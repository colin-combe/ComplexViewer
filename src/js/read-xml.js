import {Annotation} from "./viz/interactor/annotation";
import {Protein} from "./viz/interactor/protein";
import {BioactiveEntity} from "./viz/interactor/bioactive-entity";
import {Gene} from "./viz/interactor/gene";
import {DNA} from "./viz/interactor/dna";
import {RNA} from "./viz/interactor/rna";
import {Complex} from "./viz/interactor/complex";
import {ComplexSymbol} from "./viz/interactor/complex-symbol";
import {MoleculeSet} from "./viz/interactor/molecule-set";
import {NaryLink} from "./viz/link/nary-link";
import {FeatureLink} from "./viz/link/feature-link";
import {XmlFeatureRange} from "./viz/xml-feature-range";
import {BinaryLink} from "./viz/link/binary-link";
import {UnaryLink} from "./viz/link/unary-link";
import {matrix} from "./xml-expand";
import {cloneComplexRefs} from "./xml-clone-complex-refs";
import {cloneComplexesStoich} from "./xml-clone-complex-stoich";
import {AbstractMiReader} from "../abstract-mi-reader";

export class ReadXml extends AbstractMiReader {

    read(inputObj, /*App*/ app, expand = "expand") {
        this.inputObj = inputObj;
        this.app = app;
        this.expand = expand;
        this.preprocessInput();
        this.complexes = new Map();
        // expand complexes based on stoichiometry
        if (expand === "expand") {
            inputObj = cloneComplexesStoich(inputObj);
        }
        // may be multiple references to a complex, we want different set of participants for each reference to same complex
        inputObj = cloneComplexRefs(inputObj);
        //get interactors - this could prob be before cloning of complexes?
        app.interactors = new Map();
        const self = this;
        function addInteractor(interactor) {
            const id = self.interactorId(interactor);
            if (!app.interactors.has(id)) {
                app.interactors.set(id, interactor);
            } else {
                console.warn("DUPLICATE INTERACTOR ID FOUND:", id);
            }
        }

        this.visitInteractors(addInteractor);
        expand != "collapse" ? this.participantBasedRead() : this.interactorBasedRead();
        this.initLinks();
        this.initComplexes();
        this.makeMiFeaturesIntoAnnotations();
        //app.variableParameters = getVariableParameters(inputObj);
    }

    interactorId(interactor) {
        return interactor.id;//xref.primaryRef._id;
    }

    interactorTypeId(interactor) {
        return interactor.interactorType.xref.primaryRef.id;
    }

    interactorLabel(interactor) {
        return interactor.names.shortLabel;
    }

    interactionId(interaction) {
        return interaction.id;
    }

    preprocessInput() {
        //still work if you pass in boolean for expand parameter (old way)
        if (typeof this.expand === "boolean") {
            this.expand = this.expand ? "expand" : "collapse";
        }
        this.app.stoichiometryExpanded = (this.expand == "expand");
    }

    initLinks() {
        const self = this;
        // loop through participants and features
        // init binary, unary and sequence links,
        // and make needed associations between these and containing naryLink
        this.visitBindingFeatures(function (linkedFeatureIDs, interaction) {
            const linkedFeatureCount = linkedFeatureIDs.length;
            for (let i = 0; i < linkedFeatureCount; i++) { //for each linked feature
                for (let j = i + 1; j < linkedFeatureCount; j++) { //for each linked feature
                    const fromFeature = self.app.features.get(linkedFeatureIDs[i]);
                    const toFeature = self.app.features.get(linkedFeatureIDs[j]);
                    //         console.log("fromFeature", fromFeature, "toFeature", toFeature);
                    const fromSequenceData = fromFeature.featureRangeList.featureRange;
                    const toSequenceData = toFeature.featureRangeList.featureRange;
                    const fromInteractor = self.getNode(fromSequenceData[0]);
                    const toInteractor = self.getNode(toSequenceData[0]);
                    let link;
                    if (fromInteractor === toInteractor) {
                        link = self.getUnaryLink(fromInteractor, interaction);
                    } else {
                        link = self.getBinaryLink(fromInteractor, toInteractor, interaction);
                    }
                    const sequenceLink = self.getFeatureLink(fromSequenceData, toSequenceData, interaction);
                    fromInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                    toInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                    link.sequenceLinks.set(sequenceLink.id, sequenceLink);


                    //         for (let fromFeatureRange of fromFeature.featureRangeList.featureRange) {
                    //             const fromSequenceData = fromFeatureRange;
                    //             // !! code can't deal with
                    //             // !! composite binding region across two different interactors
                    //             // break feature links to different nodes into separate binary links
                    //             const toSequenceData_indexedByNodeId = new Map();
                    //             for (let toFeatureRange of toFeature.featureRangeList.featureRange) {
                    //                 const seqData = toFeatureRange;
                    //                 let nodeId = seqData.interactorRef;
                    //                 if (expand) {
                    //                     nodeId = `${nodeId}(${seqData.participantRef})`;
                    //                 }
                    //                 let toSequenceData = toSequenceData_indexedByNodeId.get(nodeId);
                    //                 if (typeof toSequenceData === "undefined") {
                    //                     toSequenceData = [];
                    //                     toSequenceData_indexedByNodeId.set(nodeId, toSequenceData);
                    //                 }
                    //                 toSequenceData = toSequenceData.push(seqData);
                    //             }
                    //
                    //             for (let toSequenceData of toSequenceData_indexedByNodeId.values()) {
                    //                 const fromInteractor = getNode(fromSequenceData);
                    //                 const toInteractor = getNode(toSequenceData[0]);
                    //                 let link;
                    //                 if (fromInteractor === toInteractor) {
                    //                     link = getUnaryLink(fromInteractor, interaction);
                    //                 } else {
                    //                     link = getBinaryLink(fromInteractor, toInteractor, interaction);
                    //                 }
                    //                 const sequenceLink = getFeatureLink(fromSequenceData, toSequenceData, interaction);
                    //                 fromInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                    //                 toInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                    //                 link.sequenceLinks.set(sequenceLink.id, sequenceLink);
                    //             }
                    //         }
                }
            }
        });
    }

    makeMiFeaturesIntoAnnotations() {
        //make mi features into annotations
        for (let feature of this.app.features.values()) {
            // add features to interactors/participants/nodes
            // console.log(`FEATURE:${feature.name}`, feature.sequenceData);
            let annotName = "";
            if (feature.names) {
                annotName += feature.names.shortLabel + " "; // todo - whats this space
            }
            // the id info we need is inside sequenceData att
            if (feature.featureRangeList) {
                for (let seqDatum of feature.featureRangeList.featureRange) {
                    let mID = seqDatum.interactorRef;
                    if (this.expand !== "collapse") {
                        mID = `${mID}(${seqDatum.participantRef})`;
                    }
                    // console.log("*", mID, seqDatum);
                    const molecule = this.app.participants.get(mID);
                    if (molecule) {
                        const seqFeature = new XmlFeatureRange(molecule, seqDatum);
                        const annotation = new Annotation(annotName, seqFeature);
                        let miFeatures = molecule.annotationSets.get("MI Features");
                        if (!miFeatures) {
                            miFeatures = [];
                            molecule.annotationSets.set("MI Features", miFeatures);
                        }
                        miFeatures.push(annotation);
                    } else {
                        console.log(`participant ${mID} not found!`);
                    }
                }
            }
        }
    }

    participantBasedRead() {
        //get maximum stoichiometry
        //todo - reinstate this
        // let maxStoich = 0;
        // for (let datum of this.inputObj.data) {
        //     if (datum.object === "interaction") {
        //         for (let jsonParticipant of datum.participants) {
        //             if (jsonParticipant.stoichiometry && (jsonParticipant.stoichiometry - 0) > maxStoich) {
        //                 maxStoich = (jsonParticipant.stoichiometry - 0);
        //             }
        //         }
        //     }
        // }
        // if (maxStoich < 20) {
        this.inputObj = matrix(this.inputObj);
        // }

        this.indexFeatures();
        const self = this;
        //add naryLinks and participants
        this.visitInteractions(function (datum) {
            //init n-ary link
            let xmlId = self.complexPortalAccFromXref(datum.xref);
            const nLinkId = xmlId || self.getNaryLinkIdFromInteraction(datum);
            let nLink = self.app.allNaryLinks.get(nLinkId);
            if (typeof nLink === "undefined") {
                //doesn't already exist, make new nLink
                nLink = new NaryLink(nLinkId, self.app, datum.sourceId);
                self.app.allNaryLinks.set(nLinkId, nLink);
                //alot of time is being spent on creating these IDs, stash them in the interaction object?
                datum.naryId = nLinkId;

            }
            //nLink.addEvidence(datum);

            //init participants
            for (let jsonParticipant of datum.participantList.participant) {
                let intRef = jsonParticipant.interactorRef;
                if (!intRef) {
                    intRef = jsonParticipant.interactor.id;//xref.primaryRef._id;
                }
                const partRef = jsonParticipant.id;
                const participantId = `${intRef}(${partRef})`;
                let participant = self.app.participants.get(participantId);
                if (typeof participant === "undefined") {
                    const interactor = self.app.interactors.get(intRef);
                    participant = self.newParticipant(interactor, participantId, intRef);
                    self.app.participants.set(participantId, participant);
                }

                participant.naryLinks.set(nLinkId, nLink);
                if (nLink.participants.indexOf(participant) === -1) {
                    nLink.participants.push(participant);
                }

                if (jsonParticipant.stoichiometry?.value || jsonParticipant.stoichiometryRange) {
                    let stoichString = "";
                    if (jsonParticipant.stoichiometry?.value) {
                        stoichString += jsonParticipant.stoichiometry.value;
                    }
                    if (jsonParticipant.stoichiometryRange) {
                        if (stoichString !== "") {
                            stoichString += ";";
                        }
                        stoichString += jsonParticipant.stoichiometryRange.minValue + "-" + jsonParticipant.stoichiometryRange.maxValue;
                    }
                    participant.addStoichiometryLabel(stoichString);
                }
            }
        });
    }

    indexFeatures() {
        //create indexed collection of all features from interactions
        // - still seems like a good starting point?
        this.visitInteractions((interaction) => {
            for (let participant of interaction.participantList.participant) {
                let features = new Array(0);
                if (participant.featureList?.feature) features = participant.featureList.feature;

                const fCount = features.length;
                for (let f = 0; f < fCount; f++) {
                    const feature = features[f];

                    // jami workaround, not entirely inline with mi-json schema, but looks like mi-json has redundant info here
                    for (let seqDatum of feature.featureRangeList.featureRange) {
                        if (!seqDatum.interactorRef) {
                            seqDatum.interactorRef = participant.interactorRef || participant.interactor.id;//xref.primaryRef._id;
                        }
                        if (!seqDatum.participantRef) {
                            seqDatum.participantRef = participant.id;//feature.parentParticipant;
                        }
                    }

                    this.app.features.set(feature.id, feature);
                }
            }
        });
    }

    interactorBasedRead() {
        //get interactors
        for (let interactor of this.app.interactors.values()) {
            const participantId = interactor.id;//xref.primaryRef._id;
            const participant = this.newParticipant(interactor, participantId, participantId);
            this.app.participants.set(participantId, participant);
        }

        this.indexFeatures();

        this.visitInteractions((interaction) => {
            const participants = interaction.participantList.participant;
            const participantCount = participants.length;

            //init n-ary link
            const nLinkId = this.getNaryLinkIdFromInteraction(interaction);
            let nLink = this.app.allNaryLinks.get(nLinkId);
            if (typeof nLink === "undefined") {
                //doesn't already exist, make new nLink
                nLink = new NaryLink(nLinkId, this.app);//, interaction._id);
                this.app.allNaryLinks.set(nLinkId, nLink);
            }
            //nLink.addEvidence(datum);

            //~ //init participants
            for (let pi = 0; pi < participantCount; pi++) {
                const jsonParticipant = participants[pi];
                const intRef = jsonParticipant.interactorRef;// || jsonParticipant.interactor.xref.primaryRef._id;
                let participant = this.app.participants.get(intRef);

                if (typeof participant === "undefined") {
                    //must be a previously unencountered complex
                    participant = new Complex(intRef, this.app);//, participant, intRef);
                    this.complexes.set(intRef, participant);
                    this.app.participants.set(intRef, participant);
                }

                participant.naryLinks.set(nLinkId, nLink);
                if (nLink.participants.indexOf(participant) === -1) {
                    nLink.participants.push(participant);
                }
                //temp - to give sensible info when stoich collapsed
                const interactor = this.app.participants.get(intRef);
                interactor.stoich = interactor.stoich ? interactor.stoich : 0;
                if (jsonParticipant.stoichiometry) {
                    interactor.stoich += +jsonParticipant.stoichiometry;
                } else {
                    interactor.stoich += 1;
                }
            }

            const interactorArr = this.app.participants.values();
            const iCount = interactorArr.length;
            for (let ii = 0; ii < iCount; ii++) {
                const int = interactorArr[ii];
                int.addStoichiometryLabel(int.stoich);
            }

        });
    }

    getNaryLinkIdFromInteraction(interaction) {
        if (interaction.naryId) {
            return interaction.naryId;
        }
        const participants = interaction.participantList.participant;
        const participantCount = participants.length;

        const pIDs = new Set(); //used to eliminate duplicates
        //make id
        for (let pi = 0; pi < participantCount; pi++) {
            let pID = participants[pi].interactorRef || participants[pi].interactor.id;//xref.primaryRef._id;
            if (this.expand != "collapse") {
                pID = `${pID}(${participants[pi].id})`;
            }
            pIDs.add(pID);
        }

        return Array.from(pIDs.values()).sort().join("-"); //interaction._id;//
    }

    getNode(seqDatum) {
        let id = seqDatum.interactorRef;
        if (this.expand != "collapse") {
            id = `${id}(${seqDatum.participantRef})`;
        }
        return this.app.participants.get(id);
    }

    getFeatureLink(fromSeqData, toSeqData, interaction) {
        const self = this;

        function seqDataToString(seqData) {
            const nodeIds = new Set(); //used to eliminate duplicates
            //make id
            for (let s = 0; s < seqData.length; s++) {
                const seq = seqData[s];
                let id = seq.interactorRef;
                if (self.expand !== "collapse") {
                    id = `${id}(${seq.participantRef})`;
                }
                id = `${id}:${seq.pos}`;
                nodeIds.add(id);
            }
            //sort ids
            return Array.from(nodeIds.values()).sort().join(";");
        }


        const start = seqDataToString(fromSeqData);
        const end = seqDataToString(toSeqData);
        let seqLinkId;//, endsSwapped;
        if (start < end) {
            seqLinkId = `${start}><${end}`;
            //endsSwapped = false;
        } else {
            seqLinkId = `${end}><${start}`;
            //endsSwapped = true;
        }
        let sequenceLink = this.app.allSequenceLinks.get(seqLinkId);
        if (typeof sequenceLink === "undefined") {
            const fromFeaturePositions = [];
            for (let fromSeqDatum of fromSeqData) {
                fromFeaturePositions.push(new XmlFeatureRange(this.getNode(fromSeqDatum), fromSeqDatum));
            }
            const toFeaturePositions = [];
            for (let toSeqDatum of toSeqData) {
                toFeaturePositions.push(new XmlFeatureRange(this.getNode(toSeqDatum), toSeqDatum));
            }
            //~ if (endsSwapped === false) {
            sequenceLink = new FeatureLink(seqLinkId, fromFeaturePositions, toFeaturePositions, this.app, interaction);
            //~ }else {
            //~ sequenceLink = new FeatureLink(seqLinkId, toFeaturePositions, fromFeaturePositions, util, interaction);
            //~ }
            this.app.allSequenceLinks.set(seqLinkId, sequenceLink);
        }

        //sequenceLink.addEvidence(interaction);
        const nLinkId = this.getNaryLinkIdFromInteraction(interaction);
        const nLink = this.app.allNaryLinks.get(nLinkId);
        nLink.sequenceLinks.set(seqLinkId, sequenceLink);
        return sequenceLink;
    }

    getUnaryLink(interactor, interaction) {
        const linkID = `-${interactor.id}-${interactor.id}`;
        let link = this.app.allUnaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new UnaryLink(linkID, this.app, interactor);
            this.app.allUnaryLinks.set(linkID, link);
            interactor.appLink = link;
        }
        const nLinkId = this.getNaryLinkIdFromInteraction(interaction);
        const nLink = this.app.allNaryLinks.get(nLinkId);
        nLink.unaryLinks.set(linkID, link);
        //link.addEvidence(interaction);
        return link;
    }

    getBinaryLink(sourceInteractor, targetInteractor, interaction) {
        let linkID, fi, ti;
        // these links are undirected and should have same ID regardless of which way round
        // source and target are
        if (sourceInteractor.id < targetInteractor.id) {
            linkID = `-${sourceInteractor.id}-${targetInteractor.id}`;
            fi = sourceInteractor;
            ti = targetInteractor;
        } else {
            linkID = `-${targetInteractor.id}-${sourceInteractor.id}`;
            fi = targetInteractor;
            ti = sourceInteractor;
        }
        let link = this.app.allBinaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new BinaryLink(linkID, this.app, fi, ti);
            fi.binaryLinks.set(linkID, link);
            ti.binaryLinks.set(linkID, link);
            this.app.allBinaryLinks.set(linkID, link);
        }
        const nLinkId = this.getNaryLinkIdFromInteraction(interaction);
        const nLink = this.app.allNaryLinks.get(nLinkId);
        nLink.binaryLinks.set(linkID, link);
        //link.addEvidence(interaction);
        return link;
    }

    getVariableParameters(input) {
        const varpars = new Map();
        //todo - ask about variable parameters being differentn across interactions
        // maybe they can be, lets assume varpars with same description are the same
        this.visitInteractions((interaction) => {
            if (interaction.experimentList?.experimentDescription) {
                for (let experimentDescription of interaction.experimentList.experimentDescription) {
                    if (experimentDescription.variableParameterList?.variableParameter) {
                        for (let variableParameter of experimentDescription.variableParameterList.variableParameter) {
                            // lets have a check to see if any duplicates are the same
                            if (varpars.has(variableParameter.description)) {
                                const existingVarPar = varpars.get(variableParameter.description);
                                if (JSON.stringify(existingVarPar) != JSON.stringify(variableParameter)) { //todo - use lodash deep equal
                                    console.warn(`Duplicate variable parameter found with different values: ${variableParameter.description}`);
                                }
                                continue; // skip adding this one, not that it really matters
                            }
                            varpars.set(variableParameter.description, variableParameter);
                        }
                    }
                }
            }
        });
        return varpars;
    }

    visitInteractions(interactionCallback) {
        for (let entry of this.inputObj.entrySet.entry) {
            // console.log("*entry*", entry);
            const interactions = [
                ...(entry.interactionList?.abstractInteraction || []),
                ...(entry.interactionList?.interaction || [])
            ];

            //iterate in reverse order
            const interactionCount = interactions.length;
            for (let i = interactionCount - 1; i >= 0; i--) {
                // console.log("*interaction*", interaction);
                interactionCallback(interactions[i]);
            }
        }
    }

    visitInteractors(interactorCallback) {
        for (let entry of this.inputObj.entrySet.entry) {
            // console.log("*entry*", entry);

            // Visit top-level interactors
            if (entry.interactorList?.interactor) {
                for (let interactor of entry.interactorList.interactor) {
                    // console.log("*interactor*", interactor);
                    interactorCallback(interactor);
                }
            }

            // Visit interactors inside participantList
            this.visitInteractions((interaction) => {
                const participants = interaction.participantList?.participant || [];
                for (let participant of participants) {
                    // console.log("*participant*", participant);
                    if (participant.interactor) {
                        interactorCallback(participant.interactor);
                    }
                }
            });
        }
    }

    //visits both binding features and inferred links
    visitBindingFeatures(bindingFeaturesCallback) {
        this.visitInteractions((interaction) => {
            if (interaction.bindingFeatureList?.bindingFeatures) {
                for (let bindingFeatures of interaction.bindingFeatureList.bindingFeatures) {
                    const linkedFeatureIDs = bindingFeatures.participantFeatureRef;
                    bindingFeaturesCallback(linkedFeatureIDs, interaction);
                }
            }
        });

        this.visitInteractions((interaction => {
            if (interaction.inferredInteractionList?.inferredInteraction) {
                for (let bindingFeatures of interaction.inferredInteractionList.inferredInteraction) {
                    const linkedFeatureIDs = bindingFeatures.participant.map(p => p.participantFeatureRef);
                    bindingFeaturesCallback(linkedFeatureIDs, interaction);
                }
            }
        }));
    }

    complexPortalAccFromXref(xref) {
        let xmlId;
        if (xref.secondaryRef) {
            for (let ref of xref.secondaryRef) {
                if (ref.db === "complex portal") {
                    xmlId = ref.id;
                    break;
                }
            }
        }
        if (!xmlId) {
            xmlId = xref.primaryRef.id;
        }
        return xmlId;
    }

}
