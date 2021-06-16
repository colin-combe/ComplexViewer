import * as d3 from "d3"; //used for d3.geom.hull
import {Link} from "./link";

export class NaryLink extends Link {
    constructor(id, app) {
        super();
        this.id = id;
        this.participants = [];
        this.sequenceLinks = new Map();
        this.binaryLinks = new Map();
        this.unaryLinks = new Map();
        this.app = app;
        // this.tooltip = this.id;
        this.initSVG();
    }

    /*
    NaryLink.prototype.getTotalParticipantCount = function () {
        let result = 0;
        const c = this.participants.length;
        for (let p = 0; p < c; p++) {
            const participant = this.participants[p];
            //console.log("! " + typeof participant);
            if (participant.type !== "complex") {
                result++;
            } else {
                result += participant.naryLink.getTotalParticipantCount();
            }
        }
        return result;
    };
    */

    initSVG() {
        this.path = document.createElementNS(this.app.svgns, "path");
        this.color = NaryLink.naryColors(this.id);
        this.path.setAttribute("fill", this.color);
        //set the events for it
        const self = this;
        this.path.onmousedown = function (evt) {
            self.mouseDown(evt);
        };
        this.path.onmouseover = function (evt) {
            self.mouseOver(evt);
        };
        this.path.onmouseout = function (evt) {
            self.mouseOut(evt);
        };
        this.path.ontouchstart = function (evt) {
            self.touchStart(evt);
        };
        // todo - prob better way todo this
        this.path2 = document.createElementNS(this.app.svgns, "path");
        this.path2.setAttribute("fill", "none");
        //set the events for it
        this.path2.onmousedown = function (evt) {
            self.mouseDown(evt);
        };
        this.path2.onmouseover = function (evt) {
            self.mouseOver(evt);
        };
        this.path2.onmouseout = function (evt) {
            self.mouseOut(evt);
        };
        this.path2.ontouchstart = function (evt) {
            self.touchStart(evt);
        };
    }

    showHighlight (show) {
        this.highlightParticipants(show);
    }

    check () {
        this.show();
        return true;
    }

    show() {
        // this.path.setAttribute("stroke-width", this.app.z);
        // this.setLinkCoordinates(); // todo - having this here slows down start up. instead see lines 41-44 complex.js
        this.app.naryLinks.appendChild(this.path);
        this.app.naryLinks.appendChild(this.path2);
    }

    setLinkCoordinates(dontPropogate) {
        // Uses d3.geom.hull to calculate a bounding path around an array of vertices
        const calculateHullPath = function (values) {
            const hullPath = d3.geom.hull(values);
            self.hull = hullPath; //hack?
            return "M" + hullPath.join("L") + "Z";
        };
        const self = this; // TODO: - tidy hack above?
        this.mapped = this.orbitNodes(this.getMappedCoordinates());
        const hullValues = calculateHullPath(this.mapped);
        if (hullValues) {
            this.path.setAttribute("d", hullValues);
            this.path2.setAttribute("d", hullValues);
        }
        if (this.complex && !dontPropogate) {
            this.complex.setAllLinkCoordinates();
        }
    }

    getMappedCoordinates() {
        const participants = this.participants;
        let mapped = [];
        const ic = participants.length;
        for (let i = 0; i < ic; i++) {
            const participant = participants[i];
            if (participant.type === "complex") {
                //use some kind of caching?
                mapped = mapped.concat(this.orbitNodes(participant.naryLink.getMappedCoordinates(), 20));
            } else if (participant.expanded) {
                const start = participant.getResidueCoordinates(0);
                const end = participant.getResidueCoordinates(participant.size);
                if (!isNaN(start[0]) && !isNaN(start[1]) &&
                    !isNaN(end[0]) && !isNaN(end[1])) {
                    mapped.push(start);
                    mapped.push(end);
                } else {
                    mapped.push(participant.getPosition());
                }
            } else {
                mapped.push(participant.getPosition());
            }
        }
        return mapped;
    }

//'orbit' nodes - several nodes around participant positions to give margin
    orbitNodes(mapped, orbitNodeCount = 20) { // add orbit node count as param? cut it down for subcomplexes?
        const orbitNodes = [];
        const mc = mapped.length;
        for (let mi = 0; mi < mc; mi++) {
            const m = mapped[mi];
            for (let o = 0; o < orbitNodeCount; o++) {
                const angle = (360 / orbitNodeCount) * o;
                const p = [m[0] + NaryLink.orbitRadius, m[1]];
                orbitNodes.push(this.app.rotatePointAboutPoint(p, m, angle));
            }
        }
        return orbitNodes;
    }
}

NaryLink.orbitRadius = 28;
