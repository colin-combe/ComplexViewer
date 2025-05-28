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
import {SequenceDatum} from "./viz/sequence-datum";
import {BinaryLink} from "./viz/link/binary-link";
import {UnaryLink} from "./viz/link/unary-link";
import {matrix} from "./expand";
import {cloneComplexRefs} from "./clone-complex-refs";
import {cloneComplexesStoich} from "./clone-complex-stoich";
import {AbstractMiReader} from "../abstract-mi-reader";

export class ReadJson extends AbstractMiReader {

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
    }

    interactorId(interactor) {
        return interactor.id;
    }

    interactorTypeId(interactor) {
        return interactor.type.id;
    }

    interactorLabel(interactor) {
        return interactor.label;
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
        //check that we've got a parsed javascript object here, not a String
        this.inputObj = (typeof this.inputObj === "object") ? this.inputObj : JSON.parse(this.inputObj);
        this.inputObj.data = this.inputObj.data.reverse();
    }

    initLinks() {
        const self = this;
        // loop through participants and features
        // init binary, unary and sequence links,
        // and make needed associations between these and containing naryLink
        for (let datum of self.inputObj.data) {
            if (datum.object === "interaction") {
                for (let jsonParticipant of datum.participants) {
                    let features = new Array(0);
                    if (jsonParticipant.features) features = jsonParticipant.features;

                    for (let feature of features) { // for each feature
                        const fromSequenceData = feature.sequenceData;
                        if (feature.linkedFeatures) { // if linked features
                            const linkedFeatureIDs = feature.linkedFeatures;
                            const linkedFeatureCount = linkedFeatureIDs.length;
                            for (let lfi = 0; lfi < linkedFeatureCount; lfi++) { //for each linked feature

                                // !! following is a hack, code can't deal with
                                // !! composite binding region across two different interactors
                                // break feature links to different nodes into separate binary links
                                const toSequenceData_indexedByNodeId = new Map();

                                const linkedFeature = self.app.features.get(linkedFeatureIDs[lfi]);
                                for (let seqData of linkedFeature.sequenceData) {
                                    let nodeId = seqData.interactorRef;
                                    if (self.expand != "collapse") {
                                        nodeId = `${nodeId}(${seqData.participantRef})`;
                                    }
                                    let toSequenceData = toSequenceData_indexedByNodeId.get(nodeId);
                                    if (typeof toSequenceData === "undefined") {
                                        toSequenceData = [];
                                        toSequenceData_indexedByNodeId.set(nodeId, toSequenceData);
                                    }
                                    toSequenceData = toSequenceData.push(seqData);
                                }

                                for (let toSequenceData of toSequenceData_indexedByNodeId.values()) {
                                    const fromInteractor = self.getNode(fromSequenceData[0]);
                                    const toInteractor = self.getNode(toSequenceData[0]);
                                    let link;
                                    if (fromInteractor === toInteractor) {
                                        link = self.getUnaryLink(fromInteractor, datum);
                                    } else {
                                        link = self.getBinaryLink(fromInteractor, toInteractor, datum);
                                    }
                                    const sequenceLink = self.getFeatureLink(fromSequenceData, toSequenceData, datum);
                                    fromInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                    toInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                    link.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                }

                            } // end for each linked feature

                        } // end if linked features
                    } // end for each feature
                }
            }
        }
    }

    makeMiFeaturesIntoAnnotations() {
        //make mi features into annotations
        for (let feature of this.app.features.values()) {
            // add features to interactors/participants/nodes
            // console.log(`FEATURE:${feature.name}`, feature.sequenceData);
            let annotName = "";
            if (typeof feature.name !== "undefined") {
                annotName += feature.name + " ";
            }
            if (typeof feature.detmethod !== "undefined") {
                annotName += ", " + feature.detmethod.name;
            }
            // the id info we need is inside sequenceData att
            if (feature.sequenceData) {
                for (let seqDatum of feature.sequenceData) {
                    let mID = seqDatum.interactorRef;
                    if (this.expand !== "collapse") {
                        mID = `${mID}(${seqDatum.participantRef})`;
                    }
                    // console.log("*", mID, seqDatum);
                    const molecule = this.app.participants.get(mID);
                    if (molecule) {
                        const seqFeature = new SequenceDatum(molecule, seqDatum.pos);
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
            const nLinkId = datum.id || this.getNaryLinkIdFromInteraction(datum);
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
            for (let jsonParticipant of datum.participants) {
                const intRef = jsonParticipant.interactorRef;
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

                if (jsonParticipant.stoichiometry || jsonParticipant.minStoichiometry || jsonParticipant.maxStoichiometry) {
                    let stoichString = "";
                    if (jsonParticipant.stoichiometry) {
                        stoichString += jsonParticipant.stoichiometry;

                    }
                    if (jsonParticipant.minStoichiometry || jsonParticipant.maxStoichiometry) {
                        if (jsonParticipant.stoichiometry) {
                            stoichString += ";";
                        }
                        stoichString += jsonParticipant.minStoichiometry + "-" + jsonParticipant.maxStoichiometry;
                    }
                    participant.addStoichiometryLabel(stoichString);
                }
            }
        });
    }

    indexFeatures() {
        //create indexed collection of all features from interactions
        // - still seems like a good starting point?
        for (let datum of this.inputObj.data) {
            if (datum.object === "interaction") {
                for (let jsonParticipant of datum.participants) {
                    let features = new Array(0);
                    if (jsonParticipant.features) features = jsonParticipant.features;

                    const fCount = features.length;
                    for (let f = 0; f < fCount; f++) {
                        const feature = features[f];

                        // jami workaround, not entirely inline with mi-json schema, but looks like mi-json has redundant info here
                        for (let seqDatum of feature.sequenceData) {
                            if (!seqDatum.interactorRef) {
                                seqDatum.interactorRef = jsonParticipant.interactorRef;
                            }
                            if (!seqDatum.participantRef) {
                                seqDatum.participantRef = feature.parentParticipant;
                            }
                        }

                        this.app.features.set(feature.id, feature);
                    }
                }
            }
        }
    }

    interactorBasedRead() {
        //get interactors
        for (let interactor of this.app.interactors.values()) {
            const participantId = interactor.id;
            const participant = this.newParticipant(interactor, participantId, participantId);
            this.app.participants.set(participantId, participant);
        }

        this.indexFeatures();

        //add naryLinks
        for (let datum of this.inputObj.data) {
            if (datum.object === "interaction") {
                const jsonParticipants = datum.participants;
                const participantCount = jsonParticipants.length;

                //init n-ary link
                const nLinkId = this.getNaryLinkIdFromInteraction(datum);
                let nLink = this.app.allNaryLinks.get(nLinkId);
                if (typeof nLink === "undefined") {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, this.app);
                    this.app.allNaryLinks.set(nLinkId, nLink);
                }
                //nLink.addEvidence(datum);

                //~ //init participants
                for (let pi = 0; pi < participantCount; pi++) {
                    const jsonParticipant = jsonParticipants[pi];
                    const intRef = jsonParticipant.interactorRef;
                    let participant = this.app.participants.get(intRef);

                    if (typeof participant === "undefined") {
                        //must be a previously unencountered complex
                        participant = new Complex(intRef, this.app, participant, intRef);
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

            }
        }

    }

    getNaryLinkIdFromInteraction(interaction) {
        if (interaction.naryId) {
            return interaction.naryId;
        }
        const jsonParticipants = interaction.participants;
        const participantCount = jsonParticipants.length;

        const pIDs = new Set(); //used to eliminate duplicates
        //make id
        for (let pi = 0; pi < participantCount; pi++) {
            let pID = jsonParticipants[pi].interactorRef;
            if (this.expand != "collapse") {
                pID = `${pID}(${jsonParticipants[pi].id})`;
            }
            pIDs.add(pID);
        }

        return Array.from(pIDs.values()).sort().join("-");
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
                if (self.expand != "collapse") {
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
                fromFeaturePositions.push(new SequenceDatum(this.getNode(fromSeqDatum), fromSeqDatum.pos));
            }
            const toFeaturePositions = [];
            for (let toSeqDatum of toSeqData) {
                toFeaturePositions.push(new SequenceDatum(this.getNode(toSeqDatum), toSeqDatum.pos));
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

    visitInteractions(interactionCallback) {
        for (let datum of this.inputObj.data) {
            if (datum.object === "interaction") {
                interactionCallback(datum);
            }
        }
    }

    visitInteractors(interactorCallback) {
        for (let datum of this.inputObj.data) {
            if (datum.object === "interactor") {
                interactorCallback(datum);
            }
        }
    }
}
