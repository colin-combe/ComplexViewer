//    	xiNET Interaction Viewer
//    	Copyright 2014 Rappsilber Laboratory
//
//    	This product includes software developed at
//    	the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//		Complex.js
//
//		authors: Colin Combe

import * as d3 from "d3";
import {Interactor} from "./interactor";

Complex.prototype = new Interactor();

export function Complex(id, controller) {
    this.id = id;
    this.controller = controller;
    //links
    this.naryLinks = d3.map();
    this.binaryLinks = d3.map();
    this.selfLink = null;
    this.sequenceLinks = d3.map();
    this.type = "complex";
    this.padding = 15;
}

Complex.prototype.initInteractor = function (naryLink) {
    this.naryLink = naryLink;
    naryLink.path.setAttribute("stroke", "gray");
    naryLink.path.setAttribute("stroke-linejoin", "round");
    naryLink.path.setAttribute("stroke-width", 8);
};

Complex.prototype.getPosition = function () {
    const mapped = this.naryLink.getMappedCoordinates();
    const mc = mapped.length;
    let xSum = 0,
        ySum = 0;
    for (let m = 0; m < mc; m++) {
        xSum += mapped[m][0];
        ySum += mapped[m][1];
    }
    return [xSum / mc, ySum / mc];
};

Complex.prototype.setPosition = function () {
};

Complex.prototype.getResidueCoordinates = function () {
    return this.getPosition();
};
Complex.prototype.showHighlight = function () {
};
