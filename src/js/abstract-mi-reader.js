import {Complex} from "./viz/interactor/complex";
import {ComplexSymbol} from "./viz/interactor/complex-symbol";
import {MoleculeSet} from "./viz/interactor/molecule-set";
import {BioactiveEntity} from "./viz/interactor/bioactive-entity";
import {Protein} from "./viz/interactor/protein";
import {Gene} from "./viz/interactor/gene";
import {RNA} from "./viz/interactor/rna";
import {DNA} from "./viz/interactor/dna";
import {UnaryLink} from "./viz/link/unary-link";
import {BinaryLink} from "./viz/link/binary-link";

export class AbstractMiReader {
    constructor() {
        if (this.constructor === AbstractMiReader) {
            throw new Error("Abstract class cannot be instantiated directly.");
        }
    }

    read() {
        throw new Error("Method 'read()' must be implemented.");
    }

    visitInteractions() {
        throw new Error("Method 'visitInteractions()' must be implemented.");
    }

    visitInteractors() {
        throw new Error("Method 'visitInteractors()' must be implemented.");
    }

    // eslint-disable-next-line no-unused-vars
    interactorId(interactor) {
        throw new Error("Method 'interactorId()' must be implemented.");
    }

    // eslint-disable-next-line no-unused-vars
    interactorTypeId(interactor) {
        throw new Error("Method 'interactorTypeId()' must be implemented.");
    }

    // eslint-disable-next-line no-unused-vars
    interactionId(interaction) {
        throw new Error("Method 'interactionId()' must be implemented.");
    }


    initComplexes() {
        //init complexes
        this.app.complexes = Array.from(this.complexes.values()); // todo - why not just keep it in map
        for (let c = 0; c < this.app.complexes.length; c++) {
            const complex = this.app.complexes[c];
            let interactionId;
            if (this.expand !== "collapse") {
                interactionId = complex.id.substring(0, complex.id.indexOf("("));
            } else {
                interactionId = complex.id;
            }
            for (let datum of this.inputObj.data) {
                if (datum.object === "interaction" && datum.id === interactionId) {
                    const nLinkId = this.getNaryLinkIdFromInteraction(datum);
                    console.log("INIT*ING COMPLEX", complex.id, nLinkId);
                    const naryLink = this.app.allNaryLinks.get(nLinkId);
                    complex.initLink(naryLink);
                    naryLink.complex = complex;
                }
            }
        }
    }

    //todo -refactor to use switch / case
    newParticipant(interactor, participantId, interactorRef) {
        const self = this;
        let participant;
        if (typeof interactor == "undefined" || this.interactorTypeId(interactor) === "MI:1302") {
            //must be a previously unencountered complex -
            // MI:0314 - interaction?, MI:0317 - complex? and its many subclasses

            let interactionExists = false;
            this.visitInteractions(function (interaction) {
                if (self.interactionId(interaction) === interactorRef) {
                    interactionExists = true;
                }
            });

            if (interactionExists) {
                participant = new Complex(participantId, this.app, interactor, interactorRef);
                this.complexes.set(participantId, participant);
            } else {
                participant = new ComplexSymbol(participantId, this.app, interactorRef, interactor); //todo - param order
            }
        } else if (this.interactorTypeId(interactor) === "MI:1304" //molecule set
            ||
            this.interactorTypeId(interactor) === "MI:1305" //molecule set - candidate set
            ||
            this.interactorTypeId(interactor) === "MI:1307" //molecule set - defined set
            ||
            this.interactorTypeId(interactor) === "MI:1306" //molecule set - open set
        ) {
            participant = new MoleculeSet(participantId, this.app, interactor, this.interactorLabel(interactor));
        } else if (this.interactorTypeId(interactor) === "MI:1100" // bioactive entity
            ||
            this.interactorTypeId(interactor) === "MI:0904" // bioactive entity - polysaccharide
            ||
            this.interactorTypeId(interactor) === "MI:0328" //bioactive entity - small mol
            ||
            this.interactorTypeId(interactor) === "MI:2258" // bioactive entity - xenobiotic
        ) {
            participant = new BioactiveEntity(participantId, this.app, interactor, this.interactorLabel(interactor));
        } else if (this.interactorTypeId(interactor) === "MI:0326"
            ||
            this.interactorTypeId(interactor) === "MI:0327") { // proteins, peptides
            participant = new Protein(participantId, this.app, interactor, this.interactorLabel(interactor), interactor.sequence);
        } else if (this.interactorTypeId(interactor) === "MI:0250") { //genes
            participant = new Gene(participantId, this.app, interactor, this.interactorLabel(interactor));
        } else if (this.interactorTypeId(interactor) === "MI:0320" // RNA
            ||
            this.interactorTypeId(interactor) === "MI:0321" // RNA - catalytic
            ||
            this.interactorTypeId(interactor) === "MI:0322" // RNA - guide
            ||
            this.interactorTypeId(interactor) === "MI:0323" // RNA - heterogeneous nuclear
            ||
            this.interactorTypeId(interactor) === "MI:2190" // RNA - long non-coding
            ||
            this.interactorTypeId(interactor) === "MI:0324" // RNA - messenger
            ||
            this.interactorTypeId(interactor) === "MI:0679" // RNA - poly adenine
            ||
            this.interactorTypeId(interactor) === "MI:0608" // RNA - ribosomal
            ||
            this.interactorTypeId(interactor) === "MI:0611" // RNA - signal recognition particle
            ||
            this.interactorTypeId(interactor) === "MI:0610" // RNA - small interfering
            ||
            this.interactorTypeId(interactor) === "MI:0607" // RNA - small nuclear
            ||
            this.interactorTypeId(interactor) === "MI:0609" // RNA - small nucleolar
            ||
            this.interactorTypeId(interactor) === "MI:0325" // RNA - transfer
            ||
            this.interactorTypeId(interactor) === "IA:2966" // RNA - double stranded ribonucleic acid (old)
            ||
            this.interactorTypeId(interactor) === "MI:2359" // RNA - double stranded ribonucleic acid
            ||
            this.interactorTypeId(interactor) === "MI:0318" // nucleic acid
            ||
            this.interactorTypeId(interactor) === "MI:2204" // micro RNA
        ) {
            participant = new RNA(participantId, this.app, interactor, this.interactorLabel(interactor));
        } else if (this.interactorTypeId(interactor) === "MI:0319" // DNA
            ||
            this.interactorTypeId(interactor) === "MI:0681" // DNA - double stranded
            ||
            this.interactorTypeId(interactor) === "MI:0680" // DNA - single stranded
        ) {
            participant = new DNA(participantId, this.app, interactor, this.interactorLabel(interactor));
        } else {
            // MI:0329 - unknown participant ?
            // MI:0383 - biopolymer ?
            alert(`Unrecognised type:${interactor.type.name}`);
        }
        return participant;
    }

    getNode(seqDatum) {
        let id = seqDatum.interactorRef;
        if (this.expand != "collapse") {
            id = `${id}(${seqDatum.participantRef})`;
        }
        return this.app.participants.get(id);
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

}