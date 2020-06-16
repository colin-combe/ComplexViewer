//      xiNET interaction viewer
//      Copyright 2014 Rappsilber Laboratory
//
//      This product includes software developed at
//      the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//      author: Colin Combe, Josh Heimbach
//
//		NaryLink.js
//		graphically represents n-ary interactions

"use strict";

const d3 = require("d3");
const Link = require("./Link");
const Config = require("../../util/Config");
const Interactor = require("../interactor/Interactor");

//NaryLink.naryColours; // init'ed in clear function of util
NaryLink.orbitNodes = 16;
NaryLink.orbitRadius = 20;

NaryLink.prototype = new Link();

function NaryLink(id, xlvController) {
    this.id = id;
    this.evidences = d3.map();
    this.interactors = []; // todo: rename to participants
    this.sequenceLinks = d3.map();
    this.binaryLinks = d3.map();
    this.unaryLinks = d3.map();
    this.controller = xlvController;
    this.tooltip = this.id;
    //used to avoid some unnecessary manipulation of DOM
    this.initSVG();
}

NaryLink.prototype.getTotalParticipantCount = function () {
    let result = 0;
    const c = this.interactors.length;
    for (let p = 0; p < c; p++) {
        const participant = this.interactors[p];
        //console.log("! " + typeof participant);
        if (participant.type !== "complex") {
            result++;
        } else {
            result = result + participant.naryLink.getTotalParticipantCount();
        }
    }
    return result;
};

NaryLink.prototype.initSVG = function () {
    this.path = document.createElementNS(Config.svgns, "path");
    this.colour = NaryLink.naryColours(this.id);
    this.path.setAttribute("fill", this.colour);
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
};

NaryLink.prototype.showHighlight = function (show) {
    this.highlightInteractors(show);
};

NaryLink.prototype.check = function () {
    this.show();
    return true;
};

NaryLink.prototype.show = function () {
    this.path.setAttribute("stroke-width", this.controller.z * 1);
    this.setLinkCoordinates();
    this.controller.naryLinks.appendChild(this.path);
};

NaryLink.prototype.hide = function () {
};

NaryLink.prototype.setLinkCoordinates = function () {
    // Uses d3.geom.hull to calculate a bounding path around an array of vertices
    const calculateHullPath = function (values) {
        const hullPath = d3.geom.hull(values);
        self.hull = hullPath; //hack?
        return "M" + hullPath.join("L") + "Z";
    };
    const self = this; // TODO: - tidy hack above?
    const mapped = this.orbitNodes(this.getMappedCoordinates());
    const hullValues = calculateHullPath(mapped);
    if (hullValues) {
        this.path.setAttribute("d", hullValues);
    }
    if (this.complex) {
        this.complex.setAllLinkCoordinates();
    }
};

NaryLink.prototype.getMappedCoordinates = function () {
    const interactors = this.interactors;
    let mapped = [];
    const ic = interactors.length;
    for (let i = 0; i < ic; i++) {
        const interactor = interactors[i];
        if (interactor.type === "complex") {
            mapped = mapped.concat(this.orbitNodes(interactor.naryLink.getMappedCoordinates()));
        } else if (interactor.form === 1) {
            const start = interactor.getResidueCoordinates(0);
            const end = interactor.getResidueCoordinates(interactor.size);
            if (!isNaN(start[0]) && !isNaN(start[1]) &&
                !isNaN(end[0]) && !isNaN(end[1])) {
                mapped.push(start);
                mapped.push(end);
            } else {
                mapped.push(interactor.getPosition());
            }
        } else {
            mapped.push(interactor.getPosition());
        }
    }
    return mapped;
};

//'orbit' nodes - several nodes around interactor positions to give margin
NaryLink.prototype.orbitNodes = function (mapped) {
    const orbitNodes = [];
    const mc = mapped.length;
    for (let mi = 0; mi < mc; mi++) {
        const m = mapped[mi];
        for (let o = 0; o < NaryLink.orbitNodes; o++) {
            const angle = (360 / NaryLink.orbitNodes) * o;
            const p = [m[0] + NaryLink.orbitRadius, m[1]];
            orbitNodes.push(Interactor.rotatePointAboutPoint(p, m, angle));
        }
    }
    return orbitNodes;
};


module.exports = NaryLink;
