import * as d3 from "d3";
import {Interactor} from "./interactor";
import {svgns, highlightColour} from "../../config";

Gene.prototype = new Interactor();

export function Gene(id, xlvController, json, name) {
    this.id = id; // id may not be accession (multiple Segments with same accession)
    this.controller = xlvController;
    this.json = json;
    //links
    this.naryLinks = new Map();
    this.binaryLinks = new Map();
    this.selfLink = null;
    this.sequenceLinks = new Map();
    this.name = name;
    // layout info
    this.cx = 40;
    this.cy = 40;

    /*
     * Upper group
     * svg group for elements that appear above links
     */

    this.upperGroup = document.createElementNS(svgns, "g");
    //~ this.upperGroup.setAttribute("class", "protein upperGroup");

    //make highlight
    this.highlight = document.createElementNS(svgns, "rect");
    this.highlight.setAttribute("stroke", highlightColour);
    this.highlight.setAttribute("stroke-width", "5");
    this.highlight.setAttribute("fill", "none");
    this.upperGroup.appendChild(this.highlight);

    //make background
    //http://stackoverflow.com/questions/17437408/how-do-i-change-a-circle-to-a-square-using-d3
    this.background = document.createElementNS(svgns, "rect");
    this.background.setAttribute("fill", "#FFFFFF");
    this.upperGroup.appendChild(this.background);

    //create label - we will move this svg element around when protein form changes
    this.labelSVG = document.createElementNS(svgns, "text");
    this.labelSVG.setAttribute("text-anchor", "end");
    this.labelSVG.setAttribute("fill", "black");
    this.labelSVG.setAttribute("x", "0");
    this.labelSVG.setAttribute("y", "10");
    this.labelSVG.setAttribute("class", "xlv_text proteinLabel");
    this.labelSVG.setAttribute("font-family", "Arial");
    this.labelSVG.setAttribute("font-size", "16");
    //choose label text
    if (this.name !== null && this.name !== "") {
        this.labelText = this.name;
    } else {
        this.labelText = this.id;
    }
    if (this.labelText.length > 25) {
        this.labelText = this.labelText.substr(0, 16) + "...";
    }
    this.labelTextNode = document.createTextNode(this.labelText);
    this.labelSVG.appendChild(this.labelTextNode);
    this.labelSVG.appendChild("transform",
        "translate( -" + (21) + " " + Interactor.labelY + ") rotate(0) scale(1, 1)");
    this.upperGroup.appendChild(this.labelSVG);
    //ticks (and amino acid letters)
    this.ticks = document.createElementNS(svgns, "g");
    //annotation svg group
    this.annotationsSvgGroup = document.createElementNS(svgns, "g");
    this.annotationsSvgGroup.setAttribute("opacity", "1");
    this.upperGroup.appendChild(this.annotationsSvgGroup);

    //make outline
    this.outline = document.createElementNS(svgns, "rect");
    this.outline.setAttribute("stroke", "black");
    this.outline.setAttribute("stroke-width", "1");
    this.outline.setAttribute("fill", "none");
    this.upperGroup.appendChild(this.outline);

    //todo - what is this, why transition?
    // d3.select(this.background).transition()
    //     .attr("x", -16).attr("y", -8)
    //     .attr("width", 32).attr("height", 16)
    //     .attr("rx", 6).attr("ry", 6);
    // d3.select(this.outline).transition()
    //     .attr("x", -16).attr("y", -8)
    //     .attr("width", 32).attr("height", 16)
    //     .attr("rx", 6).attr("ry", 6);
    // d3.select(this.highlight).transition()
    //     .attr("x", -16).attr("y", -8)
    //     .attr("width", 32).attr("height", 16)
    //     .attr("rx", 6).attr("ry", 6);
    d3.select(this.background)
        .attr("x", -16).attr("y", -8)
        .attr("width", 32).attr("height", 16)
        .attr("rx", 6).attr("ry", 6);
    d3.select(this.outline)
        .attr("x", -16).attr("y", -8)
        .attr("width", 32).attr("height", 16)
        .attr("rx", 6).attr("ry", 6);
    d3.select(this.highlight)
        .attr("x", -16).attr("y", -8)
        .attr("width", 32).attr("height", 16)
        .attr("rx", 6).attr("ry", 6);

    this.scaleLabels = [];

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

    this.showHighlight(false);
}
