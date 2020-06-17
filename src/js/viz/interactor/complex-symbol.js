//    	xiNET Interaction Viewer
//    	Copyright 2013 Rappsilber Laboratory
//
//    	This product includes software developed at
//    	the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//		Complex.js
//
//		authors: Colin Combe

import * as d3 from "d3";
import {Interactor} from "./interactor";
import {Config} from "../../config";

ComplexSymbol.prototype = new Interactor();

export function ComplexSymbol(id, xlvController, interactorRef, json) { //, name) {
    this.id = id; // id may not be accession (multiple Segments with same accession)
    this.controller = xlvController;
    this.isComplexSymbol = true;
    this.json = json;
    //links
    this.naryLinks = d3.map();
    this.binaryLinks = d3.map();
    this.selfLink = null;
    this.sequenceLinks = d3.map();

    this.name = interactorRef;
    // layout info
    this.cx = 40;
    this.cy = 40;

    /*
     * Upper group
     * svg group for elements that appear above links
     */

    this.upperGroup = document.createElementNS(Config.svgns, "g");
    //~ this.upperGroup.setAttribute("class", "protein upperGroup");

    //for polygon
    const points = "15,0 8,-13 -7,-13 -15,0 -8,13 7,13";
    //make highlight
    this.highlight = document.createElementNS(Config.svgns, "polygon");
    this.highlight.setAttribute("points", points);
    this.highlight.setAttribute("stroke", Config.highlightColour);
    this.highlight.setAttribute("stroke-width", "5");
    this.highlight.setAttribute("fill", "none");
    //attributes that may change
    d3.select(this.highlight).attr("stroke-opacity", 0);
    this.upperGroup.appendChild(this.highlight);

    //create label - we will move this svg element around when protein form changes
    this.labelSVG = document.createElementNS(Config.svgns, "text");
    this.labelSVG.setAttribute("text-anchor", "end");
    this.labelSVG.setAttribute("fill", "black");
    this.labelSVG.setAttribute("x", "0");
    this.labelSVG.setAttribute("y", "10");
    this.labelSVG.setAttribute("class", "xlv_text proteinLabel");
    this.labelSVG.setAttribute("font-family", "Arial");
    this.labelSVG.setAttribute("font-size", "16");

    this.labelText = this.name;
    this.labelTextNode = document.createTextNode(this.labelText);
    this.labelSVG.appendChild(this.labelTextNode);
    d3.select(this.labelSVG).attr("transform",
        "translate( -" + (20) + " " + Interactor.labelY + ")"); // the hexagon has slightly bigger diameter
    this.upperGroup.appendChild(this.labelSVG);

    //make blob
    this.outline = document.createElementNS(Config.svgns, "polygon");
    this.outline.setAttribute("points", points);

    this.outline.setAttribute("stroke", "black");
    this.outline.setAttribute("stroke-width", "1");
    d3.select(this.outline).attr("stroke-opacity", 1).attr("fill-opacity", 1)
        .attr("fill", "#ffffff");
    //append outline
    this.upperGroup.appendChild(this.outline);

    // events
    const self = this;
    //    this.upperGroup.setAttribute('pointer-events','all');
    this.upperGroup.onmousedown = function (evt) {
        self.mouseDown(evt);
    };
    this.upperGroup.onmouseover = function (evt) {
        self.mouseOver(evt);
    };
    this.upperGroup.onmouseout = function (evt) {
        self.mouseOut(evt);
    };
    this.upperGroup.ontouchstart = function (evt) {
        self.touchStart(evt);
    };
}

/*
ComplexSymbol.prototype.showData = function() {
    if (this.name.startsWith("intact_")) {
        const url = "http://www.ebi.ac.uk/intact/complex/details/" + this.name.substr(7);
        window.open(url, '_blank');
    }
}
*/
