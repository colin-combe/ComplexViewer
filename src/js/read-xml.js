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
import {XmlFeatureRange} from "./viz/xml-feature-range";

// reads MI JSON format
export function readXml(jsObj, /*App*/ app, expand = true) {
    app.stoichiometryExpanded = expand;
    // miJson.data = miJson.data.reverse();
    app.features = new Map();
    const complexes = new Map();

    // expand complexes based on stoichiometry
    // if (expand) {
    //     miJson = cloneComplexesStoich(miJson);
    // }

    // may be multiple references to a complex, we want different set of participants for each reference to same complex
    // miJson = cloneComplexRefs(miJson);

    //get interactors
    app.interactors = new Map();

    function addInteractor(interactor) {
        const id = interactor._id;
        console.log("Interactor ID:", id);
        if (!app.interactors.has(id)) {
            app.interactors.set(id, interactor);
        } else {
            console.warn("DUPLICATE INTERACTOR ID FOUND:", id);
        }
    }

    visitInteractors(addInteractor);

    expand ? readStoichExpanded() : readStoichUnexpanded();

    // loop through participants and features
    // init binary, unary and sequence links,
    // and make needed associations between these and containing naryLink
    visitInteractions((interaction) => {
        if (interaction.bindingFeatureList?.bindingFeatures) {
            for (let bindingFeatures of interaction.bindingFeatureList.bindingFeatures) {
                const linkedFeatureIDs = bindingFeatures.participantFeatureRef;
                const linkedFeatureCount = linkedFeatureIDs.length;
                for (let i = 0; i < linkedFeatureCount; i++) { //for each linked feature
                    for (let j = i + 1; j < linkedFeatureCount; j++) { //for each linked feature
                        const fromFeature = app.features.get(linkedFeatureIDs[i]);
                        const toFeature = app.features.get(linkedFeatureIDs[j]);
                        console.log("fromFeature", fromFeature, "toFeature", toFeature);
                        for (let fromFeatureRange of fromFeature.featureRangeList.featureRange) {
                            const fromSequenceData = fromFeatureRange;
                            // !! code can't deal with
                            // !! composite binding region across two different interactors
                            // break feature links to different nodes into separate binary links
                            const toSequenceData_indexedByNodeId = new Map();
                            for (let toFeatureRange of toFeature.featureRangeList.featureRange) {
                                const seqData = toFeatureRange;
                                let nodeId = seqData.interactorRef;
                                if (expand) {
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
                                const fromInteractor = getNode(fromSequenceData);
                                const toInteractor = getNode(toSequenceData[0]);
                                let link;
                                if (fromInteractor === toInteractor) {
                                    link = getUnaryLink(fromInteractor, interaction);
                                } else {
                                    link = getBinaryLink(fromInteractor, toInteractor, interaction);
                                }
                                const sequenceLink = getFeatureLink(fromSequenceData, toSequenceData, interaction);
                                fromInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                toInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                link.sequenceLinks.set(sequenceLink.id, sequenceLink);
                            }
                        }
                    }
                }
            }
        } // end if linked features
    });

    //init complexes
    app.complexes = Array.from(complexes.values()); // todo - why not just keep it in map
    for (let c = 0; c < app.complexes.length; c++) {
        const complex = app.complexes[c];
        let interactionId;
        if (expand) {
            interactionId = complex.id.substring(0, complex.id.indexOf("("));
        } else {
            interactionId = complex.id;
        }
        console.log("complex id", complex.id);
        visitInteractions((interaction) => {
            console.log("interaction id", interaction._id, "interactionId", interactionId, interaction._id == interactionId);
            if (interaction._id == interactionId) {
                alert("its happening");
                const nLinkId = getNaryLinkIdFromInteraction(interaction);
                const naryLink = app.allNaryLinks.get(nLinkId);
                complex.initLink(naryLink);
                naryLink.complex = complex;
            }
        });
    }

    //make mi features into annotations
    for (let feature of app.features.values()) {
        // add features to interactors/participants/nodes
        // console.log(`FEATURE:${feature.name}`, feature.sequenceData);
        let annotName = "";
        if (feature.names) {
            annotName += feature.names.shortLabel + " "; // toodo - whats this space
        }
        // the id info we need is inside sequenceData att
        if (feature.featureRangeList) { // todo - still needed?
            for (let seqDatum of feature.featureRangeList.featureRange) {
                let mID = seqDatum.interactorRef;
                if (expand) {
                    mID = `${mID}(${seqDatum.participantRef})`;
                }
                // console.log("*", mID, seqDatum);
                const molecule = app.participants.get(mID);
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

    function readStoichExpanded() {
        //get maximum stoichiometry
        // let maxStoich = 0;
        // for (let datum of miJson.data) {
        //     if (datum.object === "interaction") {
        //         for (let jsonParticipant of datum.participants) {
        //             if (jsonParticipant.stoichiometry && (jsonParticipant.stoichiometry - 0) > maxStoich) {
        //                 maxStoich = (jsonParticipant.stoichiometry - 0);
        //             }
        //         }
        //     }
        // }
        // if (maxStoich < 20) {
        //     miJson = matrix(miJson);
        // }

        indexFeatures();

        //add naryLinks and participants
        visitInteractions(function (datum) {
            //init n-ary link
            const nLinkId = datum.xref.primaryRef._id || getNaryLinkIdFromInteraction(datum);
            let nLink = app.allNaryLinks.get(nLinkId);
            if (typeof nLink === "undefined") {
                //doesn't already exist, make new nLink
                nLink = new NaryLink(nLinkId, app, datum.sourceId);
                app.allNaryLinks.set(nLinkId, nLink);
                //alot of time is being spent on creating these IDs, stash them in the interaction object?
                datum.naryId = nLinkId;

            }
            //nLink.addEvidence(datum);

            //init participants
            for (let jsonParticipant of datum.participantList.participant) {
                let intRef = jsonParticipant.interactorRef;
                if (!intRef) {
                    intRef = jsonParticipant.interactor._id;
                }
                const partRef = jsonParticipant._id;
                const participantId = `${intRef}(${partRef})`;
                let participant = app.participants.get(participantId);
                if (typeof participant === "undefined") {
                    const interactor = app.interactors.get(intRef);
                    participant = newParticipant(interactor, participantId, intRef);
                    app.participants.set(participantId, participant);
                }

                participant.naryLinks.set(nLinkId, nLink);
                if (nLink.participants.indexOf(participant) === -1) {
                    nLink.participants.push(participant);
                }

                if (jsonParticipant.stoichiometry) {
                    const interactor = app.participants.get(participantId);
                    interactor.addStoichiometryLabel(jsonParticipant.stoichiometry);
                }
            }
        });
    }

    function newParticipant(interactor, participantId, interactorRef) {
        let participant;
        if (typeof interactor == "undefined" || interactor.interactorType.xref.primaryRef._id === "MI:1302") {
            //must be a previously unencountered complex -
            // MI:0314 - interaction?, MI:0317 - complex? and its many subclasses

            let interactionExists = false;
            // for (let datum of miJson.data) {
            //     if (datum.object === "interaction" && datum.id === interactorRef) {
            //         interactionExists = true;
            //         break;
            //     }
            // }
            visitInteractions(function (interaction) {
                if (interaction._id === interactorRef) {
                    interactionExists = true;
                    // break;
                }
            });

            if (interactionExists) {
                participant = new Complex(participantId, app, interactorRef);
                complexes.set(participantId, participant);
            } else {
                participant = new ComplexSymbol(participantId, app, interactorRef, interactor);
            }
        } else if (interactor.interactorType.xref.primaryRef._id === "MI:1304" //molecule set
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:1305" //molecule set - candidate set
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:1307" //molecule set - defined set
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:1306" //molecule set - open set
        ) {
            participant = new MoleculeSet(participantId, app, interactor, interactor.names.shortLabel);
        } else if (interactor.interactorType.xref.primaryRef._id === "MI:1100" // bioactive entity
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0904" // bioactive entity - polysaccharide
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0328" //bioactive entity - small mol
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:2258" // bioactive entity - xenobiotic
        ) {
            participant = new BioactiveEntity(participantId, app, interactor, interactor.names.shortLabel);
        } else if (interactor.interactorType.xref.primaryRef._id === "MI:0326"
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0327") { // proteins, peptides
            participant = new Protein(participantId, app, interactor, interactor.names.shortLabel, interactor.sequence);
        } else if (interactor.interactorType.xref.primaryRef._id === "MI:0250") { //genes
            participant = new Gene(participantId, app, interactor, interactor.names.shortLabel);
        } else if (interactor.interactorType.xref.primaryRef._id === "MI:0320" // RNA
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0321" // RNA - catalytic
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0322" // RNA - guide
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0323" // RNA - heterogeneous nuclear
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:2190" // RNA - long non-coding
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0324" // RNA - messenger
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0679" // RNA - poly adenine
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0608" // RNA - ribosomal
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0611" // RNA - signal recognition particle
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0610" // RNA - small interfering
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0607" // RNA - small nuclear
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0609" // RNA - small nucleolar
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0325" // RNA - transfer
            ||
            interactor.interactorType.xref.primaryRef._id === "IA:2966" // RNA - double stranded ribonucleic acid (old)
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:2359" // RNA - double stranded ribonucleic acid
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0318" // nucleic acid
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:2204" // micro RNA
        ) {
            participant = new RNA(participantId, app, interactor, interactor.names.shortLabel);
        } else if (interactor.interactorType.xref.primaryRef._id === "MI:0319" // DNA
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0681" // DNA - double stranded
            ||
            interactor.interactorType.xref.primaryRef._id === "MI:0680" // DNA - single stranded
        ) {
            participant = new DNA(participantId, app, interactor, interactor.names.shortLabel);
        } else {
            // MI:0329 - unknown participant ?
            // MI:0383 - biopolymer ?
            alert(`Unrecognised type:${interactor.type.name}`);
        }
        return participant;
    }

    function indexFeatures() {
        //create indexed collection of all features from interactions
        // - still seems like a good starting point?
        visitInteractions((interaction) => {
            for (let participant of interaction.participantList.participant) {
                let features = new Array(0);
                if (participant.featureList?.feature) features = participant.featureList.feature;

                const fCount = features.length;
                for (let f = 0; f < fCount; f++) {
                    const feature = features[f];

                    // jami workaround, not entirely inline with mi-json schema, but looks like mi-json has redundant info here
                    for (let seqDatum of feature.featureRangeList.featureRange) {
                        if (!seqDatum.interactorRef) {
                            seqDatum.interactorRef = participant.interactorRef || participant.interactor._id;
                        }
                        if (!seqDatum.participantRef) {
                            seqDatum.participantRef = participant._id;//feature.parentParticipant;
                        }
                    }

                    app.features.set(feature._id, feature);
                }
            }
        });
    }

    function readStoichUnexpanded() {
        //get interactors
        for (let interactor of app.interactors.values()) {
            const participantId = interactor._id;
            const participant = newParticipant(interactor, participantId);
            app.participants.set(participantId, participant);
        }

        indexFeatures();

        visitInteractions((interaction) => {
            const participants = interaction.participantList.participant;
            const participantCount = participants.length;

            //init n-ary link
            const nLinkId = getNaryLinkIdFromInteraction(interaction);
            let nLink = app.allNaryLinks.get(nLinkId);
            if (typeof nLink === "undefined") {
                //doesn't already exist, make new nLink
                nLink = new NaryLink(nLinkId, app);
                app.allNaryLinks.set(nLinkId, nLink);
            }
            //nLink.addEvidence(datum);

            //~ //init participants
            for (let pi = 0; pi < participantCount; pi++) {
                const jsonParticipant = participants[pi];
                const intRef = jsonParticipant.interactorRef;
                let participant = app.participants.get(intRef);

                if (typeof participant === "undefined") {
                    //must be a previously unencountered complex
                    participant = new Complex(intRef, app);
                    complexes.set(intRef, participant);
                    app.participants.set(intRef, participant);
                }

                participant.naryLinks.set(nLinkId, nLink);
                if (nLink.participants.indexOf(participant) === -1) {
                    nLink.participants.push(participant);
                }
                //temp - to give sensible info when stoich collapsed
                const interactor = app.participants.get(intRef);
                interactor.stoich = interactor.stoich ? interactor.stoich : 0;
                if (jsonParticipant.stoichiometry) {
                    interactor.stoich += +jsonParticipant.stoichiometry;
                } else {
                    interactor.stoich += 1;
                }
            }

            const interactorArr = app.participants.values();
            const iCount = interactorArr.length;
            for (let ii = 0; ii < iCount; ii++) {
                const int = interactorArr[ii];
                int.addStoichiometryLabel(int.stoich);
            }

        });
    }

    function getNaryLinkIdFromInteraction(interaction) {
        if (interaction.naryId) {
            return interaction.naryId;
        }
        const participants = interaction.participantList.participant;
        const participantCount = participants.length;

        const pIDs = new Set(); //used to eliminate duplicates
        //make id
        for (let pi = 0; pi < participantCount; pi++) {
            let pID = participants[pi].interactorRef || participants[pi].interactor._id;
            if (expand) {
                pID = `${pID}(${participants[pi]._id})`;
            }
            pIDs.add(pID);
        }

        return Array.from(pIDs.values()).sort().join("-");
    }

    function getNode(seqDatum) {
        let id = seqDatum.interactorRef;
        if (expand) {
            id = `${id}(${seqDatum.participantRef})`;
        }
        return app.participants.get(id);
    }

    function getFeatureLink(fromSeqData, toSeqData, interaction) {
        function seqDataToString(seqData) {
            const nodeIds = new Set(); //used to eliminate duplicates
            //make id
            for (let s = 0; s < seqData.length; s++) {
                const seq = seqData[s];
                let id = seq.interactorRef;
                if (expand) {
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
        let sequenceLink = app.allSequenceLinks.get(seqLinkId);
        if (typeof sequenceLink === "undefined") {
            const fromFeaturePositions = [];
            for (let fromSeqDatum of fromSeqData) {
                fromFeaturePositions.push(new SequenceDatum(getNode(fromSeqDatum), fromSeqDatum.pos));
            }
            const toFeaturePositions = [];
            for (let toSeqDatum of toSeqData) {
                toFeaturePositions.push(new SequenceDatum(getNode(toSeqDatum), toSeqDatum.pos));
            }
            //~ if (endsSwapped === false) {
            sequenceLink = new FeatureLink(seqLinkId, fromFeaturePositions, toFeaturePositions, app, interaction);
            //~ }else {
            //~ sequenceLink = new FeatureLink(seqLinkId, toFeaturePositions, fromFeaturePositions, util, interaction);
            //~ }
            app.allSequenceLinks.set(seqLinkId, sequenceLink);
        }

        //sequenceLink.addEvidence(interaction);
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = app.allNaryLinks.get(nLinkId);
        nLink.sequenceLinks.set(seqLinkId, sequenceLink);
        return sequenceLink;
    }

    function getUnaryLink(interactor, interaction) {
        const linkID = `-${interactor.id}-${interactor.id}`;
        let link = app.allUnaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new UnaryLink(linkID, app, interactor);
            app.allUnaryLinks.set(linkID, link);
            interactor.appLink = link;
        }
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = app.allNaryLinks.get(nLinkId);
        nLink.unaryLinks.set(linkID, link);
        //link.addEvidence(interaction);
        return link;
    }

    function getBinaryLink(sourceInteractor, targetInteractor, interaction) {
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
        let link = app.allBinaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new BinaryLink(linkID, app, fi, ti);
            fi.binaryLinks.set(linkID, link);
            ti.binaryLinks.set(linkID, link);
            app.allBinaryLinks.set(linkID, link);
        }
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = app.allNaryLinks.get(nLinkId);
        nLink.binaryLinks.set(linkID, link);
        //link.addEvidence(interaction);
        return link;
    }


    function visitInteractions(interactionCallback) {
        for (let entry of jsObj.entrySet.entry) {
            // console.log("*entry*", entry);
            const interactions = [
                ...(entry.interactionList?.abstractInteraction || []),
                ...(entry.interactionList?.interaction || [])
            ];

            for (let interaction of interactions) {
                // console.log("*interaction*", interaction);
                interactionCallback(interaction);
            }
        }
    }

    function visitInteractors(interactorCallback) {
        for (let entry of jsObj.entrySet.entry) {
            // console.log("*entry*", entry);

            // Visit top-level interactors
            if (entry.interactorList?.interactor) {
                for (let interactor of entry.interactorList.interactor) {
                    // console.log("*interactor*", interactor);
                    interactorCallback(interactor);
                }
            }

            // Visit interactors inside participantList
            visitInteractions((interaction) => {
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
}
