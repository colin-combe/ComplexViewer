"use strict";

const d3 = require("d3");
const Annotation = require("../model/interactor/Annotation");
const Protein = require("../model/interactor/Protein");
const BioactiveEntity = require("../model/interactor/BioactiveEntity");
const Gene = require("../model/interactor/Gene");
const DNA = require("../model/interactor/DNA");
const RNA = require("../model/interactor/RNA");
const Complex = require("../model/interactor/Complex");
const Complex_symbol = require("../model/interactor/Complex_symbol");
const MoleculeSet = require("../model/interactor/MoleculeSet");
const NaryLink = require("../model/link/NaryLink");
const SequenceLink = require("../model/link/SequenceLink");
const SequenceFeature = require("../model/SequenceFeature");
const BinaryLink = require("../model/link/BinaryLink");
const UnaryLink = require("../model/link/UnaryLink");
const Expand = require("./expand");

// reads MI JSON format
const readMIJSON = function (miJson, controller, expand = true) {
    //check that we've got a parsed javascript object here, not a String
    miJson = (typeof miJson === "object") ? miJson : JSON.parse(miJson);
    miJson.data = miJson.data.reverse();
    controller.features = d3.map();

    const complexes = d3.map();
    const needsSequence = d3.set(); //things that need seq looked up

    //get interactors
    controller.proteinCount = 0;
    controller.interactors = d3.map();
    for (let datum of miJson.data) {
        if (datum.object === "interactor") {
            controller.interactors.set(datum.id, datum);
            if (datum.id.indexOf("uniprotkb_") === 0) { // todo - is this best way to test this?
                controller.proteinCount++;
            }
        }
    }

    expand ? readStoichExpanded() : readStoichUnexpanded();

    // loop through participants and features
    // init binary, unary and sequence links,
    // and make needed associations between these and containing naryLink
    for (let datum of miJson.data) {
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
                            const toSequenceData_indexedByNodeId = d3.map();

                            const linkedFeature = controller.features.get(linkedFeatureIDs[lfi]);
                            for (let seqData of linkedFeature.sequenceData) {
                                let nodeId = seqData.interactorRef;
                                if (expand) {
                                    nodeId = nodeId + "(" + seqData.participantRef + ")";
                                }
                                let toSequenceData = toSequenceData_indexedByNodeId.get(nodeId);
                                if (typeof toSequenceData === "undefined") {
                                    toSequenceData = [];
                                    toSequenceData_indexedByNodeId.set(nodeId, toSequenceData);
                                }
                                toSequenceData = toSequenceData.push(seqData);
                            }

                            for (let toSequenceData of toSequenceData_indexedByNodeId.values()) {
                                const fromInteractor = getNode(fromSequenceData[0]);
                                const toInteractor = getNode(toSequenceData[0]);
                                let link;
                                if (fromInteractor === toInteractor) {
                                    link = getUnaryLink(fromInteractor, datum);
                                } else {
                                    link = getBinaryLink(fromInteractor, toInteractor, datum);
                                }
                                const sequenceLink = getFeatureLink(fromSequenceData, toSequenceData, datum);
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

    //init complexes
    controller.complexes = complexes.values();
    for (let c = 0; c < controller.complexes.length; c++) {
        const complex = controller.complexes[c];
        let interactionId;
        if (expand) {
            interactionId = complex.id.substring(0, complex.id.indexOf("("));
        } else {
            interactionId = complex.id;
        }
        for (let datum of miJson.data) {
            if (datum.object === "interaction" && datum.id === interactionId) {
                const nLinkId = getNaryLinkIdFromInteraction(datum);
                const naryLink = controller.allNaryLinks.get(nLinkId);
                complex.initInteractor(naryLink);
                naryLink.complex = complex;
            }
        }
    }

    //make mi features into annotations
    for (let feature of controller.features.values()) {
        // add features to interactors/participants/nodes
        //console.log("FEATURE:" + feature.name, feature.sequenceData);
        let annotName = "";
        if (typeof feature.name !== "undefined") {
            annotName += feature.name + " ";
        }
        if (typeof feature.detmethod !== "undefined") {
            annotName += ", " + feature.detmethod.name;
        }
        // the id info we need is inside sequenceData att
        if (feature.sequenceData) { // todo - still needed?
            for (let seqDatum of feature.sequenceData) {
                let mID = seqDatum.interactorRef;
                if (expand) {
                    mID = mID + "(" + seqDatum.participantRef + ")";
                }
                const molecule = controller.molecules.get(mID);
                const seqFeature = new SequenceFeature(molecule, seqDatum.pos);
                const annotation = new Annotation(annotName, seqFeature);
                if (molecule.miFeatures == null) {
                    molecule.miFeatures = [];
                }
                molecule.miFeatures.push(annotation);
            }
        }
    }

    controller.init();

    function readStoichExpanded() {
        //get maximum stoichiometry
        let maxStoich = 0;
        for (let datum of miJson.data) {
            if (datum.object === "interaction") {
                for (let jsonParticipant of datum.participants) {
                    if (jsonParticipant.stoichiometry && (jsonParticipant.stoichiometry - 0) > maxStoich) {
                        maxStoich = (jsonParticipant.stoichiometry - 0);
                    }
                }
            }
        }
        if (maxStoich < 30) {
            miJson = Expand.matrix(miJson);
        }

        indexFeatures();

        //add naryLinks and participants
        for (let datum of miJson.data) {
            if (datum.object === "interaction") {
                //init n-ary link
                const nLinkId = datum.id || getNaryLinkIdFromInteraction(datum);
                let nLink = controller.allNaryLinks.get(nLinkId);
                if (typeof nLink === "undefined") {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, controller);
                    controller.allNaryLinks.set(nLinkId, nLink);
                    //alot of time is being spent on creating these IDs, stash them in the interaction object?
                    datum.naryId = nLinkId;

                }
                nLink.addEvidence(datum);

                //init participants
                for (let jsonParticipant of datum.participants) {
                    const intRef = jsonParticipant.interactorRef;
                    const partRef = jsonParticipant.id;
                    const participantId = intRef + "(" + partRef + ")";
                    let participant = controller.molecules.get(participantId);
                    if (typeof participant === "undefined") {
                        const interactor = controller.interactors.get(intRef);
                        participant = newParticipant(interactor, participantId, intRef);
                        controller.molecules.set(participantId, participant);
                    }

                    participant.naryLinks.set(nLinkId, nLink);
                    //TODO: tidy up whats happening in NaryLink re interactor/participant terminology
                    if (nLink.interactors.indexOf(participant) === -1) {
                        nLink.interactors.push(participant);
                    }

                    if (jsonParticipant.stoichiometry) {
                        const interactor = controller.molecules.get(participantId);
                        interactor.addStoichiometryLabel(jsonParticipant.stoichiometry);
                    }
                }
            }
        }
    }

    function newParticipant(interactor, participantId, interactorRef) {
        let participant;
        if (typeof interactor == "undefined" || interactor.type.id === "MI:1302") {
            //must be a previously unencountered complex -
            // MI:0314 - interaction?, MI:0317 - complex? and its many subclasses

            let interactionExists = false;
            for (let datum of miJson.data) {
                if (datum.object === "interaction" && datum.id === interactorRef) {
                    interactionExists = true;
                    break;
                }
            }


            if (interactionExists) {
                participant = new Complex(participantId, controller, interactorRef);
                complexes.set(participantId, participant);
            } else {
                participant = new Complex_symbol(participantId, controller, interactorRef, interactor);
            }
        }else if (interactor.type.id === "MI:1304" //molecule set
            ||
            interactor.type.id === "MI:1305" //molecule set - candidate set
            ||
            interactor.type.id === "MI:1307" //molecule set - defined set
            ||
            interactor.type.id === "MI:1306" //molecule set - open set
        ) {
            participant = new MoleculeSet(participantId, controller, interactor, interactor.label);
        } else if (interactor.type.id === "MI:1100" // bioactive entity
            ||
            interactor.type.id === "MI:0904" // bioactive entity - polysaccharide
            ||
            interactor.type.id === "MI:0328" //bioactive entity - small mol
        ) {
            participant = new BioactiveEntity(participantId, controller, interactor, interactor.label);
        } else if (interactor.type.id === "MI:0326" || interactor.type.id === "MI:0327") { // proteins, peptides
            participant = new Protein(participantId, controller, interactor, interactor.label);
            if (typeof interactor.sequence !== "undefined") {
                participant.setSequence(interactor.sequence);
            } else {
                //should look it up using accession number
                if (participantId.indexOf("uniprotkb") === 0) {
                    needsSequence.add(participantId);
                } else {
                    participant.setSequence("SEQUENCEMISSING");
                }
            }
        } else if (interactor.type.id === "MI:0250") { //genes
            participant = new Gene(participantId, controller, interactor, interactor.label);
        } else if (interactor.type.id === "MI:0320" // RNA
            ||
            interactor.type.id === "MI:0321" // RNA - catalytic
            ||
            interactor.type.id === "MI:0322" // RNA - guide
            ||
            interactor.type.id === "MI:0323" // RNA - heterogeneous nuclear
            ||
            interactor.type.id === "MI:2190" // RNA - long non-coding
            ||
            interactor.type.id === "MI:0324" // RNA - messenger
            ||
            interactor.type.id === "MI:0679" // RNA - poly adenine
            ||
            interactor.type.id === "MI:0608" // RNA - ribosomal
            ||
            interactor.type.id === "MI:0611" // RNA - signal recognition particle
            ||
            interactor.type.id === "MI:0610" // RNA - small interfering
            ||
            interactor.type.id === "MI:0607" // RNA - small nuclear
            ||
            interactor.type.id === "MI:0609" // RNA - small nucleolar
            ||
            interactor.type.id === "MI:0325" // RNA - transfer
        ) {
            participant = new RNA(participantId, controller, interactor, interactor.label);
        } else if (interactor.type.id === "MI:0319" // DNA
            ||
            interactor.type.id === "MI:0681" // DNA - double stranded
            ||
            interactor.type.id === "MI:0680" // DNA - single stranded
        ) {
            participant = new DNA(participantId, controller, interactor, interactor.label);
        } else {
            // MI:0329 - unknown participant ?
            // MI:0383 - biopolymer ?
            alert("Unrecognised type:" + interactor.type.name);
        }
        return participant;
    }

    function indexFeatures() {
        //create indexed collection of all features from interactions
        // - still seems like a good starting point?
        for (let datum of miJson.data) {
            if (datum.object === "interaction") {
                for (let jsonParticipant of datum.participants) {
                    let features = new Array(0);
                    if (jsonParticipant.features) features = jsonParticipant.features;

                    const fCount = features.length;
                    for (let f = 0; f < fCount; f++) {
                        const feature = features[f];
                        controller.features.set(feature.id, feature);
                    }
                }
            }
        }
    }

    function readStoichUnexpanded() {
        //get interactors
        for (let interactor of controller.interactors.values()) {
            const participantId = interactor.id;
            const participant = newParticipant(interactor, participantId);
            controller.molecules.set(participantId, participant);
        }

        indexFeatures();

        //add naryLinks
        for (let datum of miJson.data) {
            if (datum.object === "interaction") {
                const jsonParticipants = datum.participants;
                const participantCount = jsonParticipants.length;

                //init n-ary link
                const nLinkId = getNaryLinkIdFromInteraction(datum);
                let nLink = controller.allNaryLinks.get(nLinkId);
                if (typeof nLink === "undefined") {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, controller);
                    controller.allNaryLinks.set(nLinkId, nLink);
                }
                nLink.addEvidence(datum);

                //~ //init participants
                for (let pi = 0; pi < participantCount; pi++) {
                    const jsonParticipant = jsonParticipants[pi];
                    const intRef = jsonParticipant.interactorRef;
                    let participant = controller.molecules.get(intRef);

                    if (typeof participant === "undefined") {
                        //must be a previously unencountered complex
                        participant = new Complex(intRef, controller);
                        complexes.set(intRef, participant);
                        controller.molecules.set(intRef, participant);
                    }


                    participant.naryLinks.set(nLinkId, nLink);
                    //TODO: tidy up whats happening in NaryLink re interactor/participant terminology
                    if (nLink.interactors.indexOf(participant) === -1) {
                        nLink.interactors.push(participant);
                    }
                    //temp - to give sensible info when stoich collapsed
                    const interactor = controller.molecules.get(intRef);
                    interactor.stoich = interactor.stoich ? interactor.stoich : 0;
                    if (jsonParticipant.stoichiometry) {
                        interactor.stoich = interactor.stoich + +jsonParticipant.stoichiometry;
                    } else {
                        interactor.stoich = interactor.stoich + 1;
                    }
                }

                const interactorArr = controller.molecules.values();
                const iCount = interactorArr.length;
                for (let ii = 0; ii < iCount; ii++) {
                    const int = interactorArr[ii];
                    int.addStoichiometryLabel(int.stoich);
                }

            }
        }

    }


    function getNaryLinkIdFromInteraction(interaction) {
        if (interaction.naryId) {
            return interaction.naryId;
        }
        const jsonParticipants = interaction.participants;
        const participantCount = jsonParticipants.length;

        const pIDs = d3.set(); //used to eliminate duplicates
        //make id
        for (let pi = 0; pi < participantCount; pi++) {
            let pID = jsonParticipants[pi].interactorRef;
            if (expand) {
                pID = pID + "(" + jsonParticipants[pi].id + ")";
            }
            pIDs.add(pID);
        }

        return pIDs.values().sort().join("-");
    }

    function getNode(seqDatum) {
        let id = seqDatum.interactorRef;
        if (expand) {
            id = id + "(" + seqDatum.participantRef + ")";
        }
        return controller.molecules.get(id);
    }

    function getFeatureLink(fromSeqData, toSeqData, interaction) {
        function seqDataToString(seqData) {
            const nodeIds = d3.set(); //used to eliminate duplicates
            //make id
            for (let s = 0; s < seqData.length; s++) {
                const seq = seqData[s];
                let id = seq.interactorRef;
                if (expand) {
                    id = id + "(" + seq.participantRef + ")";
                }
                id = id + ":" + seq.pos;
                nodeIds.add(id);
            }
            //sort ids
            return nodeIds.values().sort().join(";");
        }


        const start = seqDataToString(fromSeqData);
        const end = seqDataToString(toSeqData);
        let seqLinkId;//, endsSwapped;
        if (start < end) {
            seqLinkId = start + "><" + end;
            //endsSwapped = false;
        } else {
            seqLinkId = end + "><" + start;
            //endsSwapped = true;
        }
        let sequenceLink = controller.allSequenceLinks.get(seqLinkId);
        if (typeof sequenceLink === "undefined") {
            const fromFeaturePositions = [];
            for (let fromSeqDatum of fromSeqData) {
                fromFeaturePositions.push(new SequenceFeature(getNode(fromSeqDatum), fromSeqDatum.pos));
            }
            const toFeaturePositions = [];
            for (let toSeqDatum of toSeqData) {
                toFeaturePositions.push(new SequenceFeature(getNode(toSeqDatum), toSeqDatum.pos));
            }
            //~ if (endsSwapped === false) {
            sequenceLink = new SequenceLink(seqLinkId, fromFeaturePositions, toFeaturePositions, controller, interaction);
            //~ }else {
            //~ sequenceLink = new SequenceLink(seqLinkId, toFeaturePositions, fromFeaturePositions, util, interaction);
            //~ }
            controller.allSequenceLinks.set(seqLinkId, sequenceLink);
        }

        sequenceLink.addEvidence(interaction);
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = controller.allNaryLinks.get(nLinkId);
        nLink.sequenceLinks.set(seqLinkId, sequenceLink);
        return sequenceLink;
    }

    function getUnaryLink(interactor, interaction) {
        const linkID = "-" + interactor.id + "-" + interactor.id;
        let link = controller.allUnaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new UnaryLink(linkID, controller, interactor);
            controller.allUnaryLinks.set(linkID, link);
            interactor.controllerLink = link;
        }
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = controller.allNaryLinks.get(nLinkId);
        nLink.unaryLinks.set(linkID, link);
        link.addEvidence(interaction);
        return link;
    }

    function getBinaryLink(sourceInteractor, targetInteractor, interaction) {
        let linkID, fi, ti;
        // these links are undirected and should have same ID regardless of which way round
        // source and target are
        if (sourceInteractor.id < targetInteractor.id) {
            linkID = "-" + sourceInteractor.id + "-" + targetInteractor.id;
            fi = sourceInteractor;
            ti = targetInteractor;
        } else {
            linkID = "-" + targetInteractor.id + "-" + sourceInteractor.id;
            fi = targetInteractor;
            ti = sourceInteractor;
        }
        let link = controller.allBinaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new BinaryLink(linkID, controller, fi, ti);
            fi.binaryLinks.set(linkID, link);
            ti.binaryLinks.set(linkID, link);
            controller.allBinaryLinks.set(linkID, link);
        }
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = controller.allNaryLinks.get(nLinkId);
        nLink.binaryLinks.set(linkID, link);
        link.addEvidence(interaction);
        return link;
    }
};

module.exports = readMIJSON;