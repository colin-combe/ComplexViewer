import * as d3 from "d3"; //only used to set att's'
// import {Interactor} from "./interactor";
import {Polymer} from "./polymer";
import {svgns, highlightColour} from "../../config";

export function Protein(id, /*App*/ app, json, name) {
    this.init(id, app, json, name);

    // this.tooltip = this.name + " [" + this.id + "]"; // + this.accession;
    // layout info
    this.cx = 40;
    this.cy = 40;

    this.upperGroup = document.createElementNS(svgns, "g");
    this.rotation = 0;
    this.stickZoom = 1;
    this.form = 0; // 0 = blob, 1 = stick

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
    this.initLabel();
    //ticks (and amino acid letters)
    this.ticks = document.createElementNS(svgns, "g");
    //svg group for annotations
    this.annotationsSvgGroup = document.createElementNS(svgns, "g");
    this.annotationsSvgGroup.setAttribute("opacity", "1");
    this.upperGroup.appendChild(this.annotationsSvgGroup);

    //make outline
    this.outline = document.createElementNS(svgns, "rect");
    this.outline.setAttribute("stroke", "black");
    this.outline.setAttribute("stroke-width", "1");
    this.outline.setAttribute("fill", "none");
    this.upperGroup.appendChild(this.outline);

    this.scaleLabels = [];

    //since form is set to 0, make this a circle, this stuff is equivalent to
    // end result of toCircle but without transition
    const r = this.getBlobRadius();
    d3.select(this.outline)
        .attr("fill-opacity", 1)
        // .attr("fill", "#ffffff")
        .attr("x", -r).attr("y", -r)
        .attr("width", r * 2).attr("height", r * 2)
        .attr("rx", r).attr("ry", r);
    d3.select(this.background)
        .attr("x", -r).attr("y", -r)
        .attr("width", r * 2).attr("height", r * 2)
        .attr("rx", r).attr("ry", r);
    d3.select(this.annotationsSvgGroup).attr("transform", "scale(1, 1)");
    d3.select(this.highlight)
        .attr("width", (r * 2) + 5).attr("height", (r * 2) + 5)
        .attr("x", -r - 2.5).attr("y", -r - 2.5)
        .attr("rx", r + 2.5).attr("ry", r + 2.5)
        .attr("stroke-opacity", 0);
    this.labelSVG.setAttribute("transform", "translate(" + (-(r + 5)) + "," + "-5)");

    this.initListeners();

    Object.defineProperty(this, "height", {
        get: function height() {
            return 60;//this.upperGroup.getBBox().height + 60; // * this.util.z;
        }
    });

    this.showHighlight(false);
}

Protein.prototype = new Polymer();

/*
Protein.prototype.showData = function(evt) {
    const url = "http://www.uniprot.org/uniprot/" + this.json.identifier.id;
    window.open(url, '_blank');
}
*/
