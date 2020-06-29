import * as d3 from "d3"; //only used to set att's, remove
import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function MoleculeSet(id, app, json, name) {
    this.init(id, app, json, name);
    // this.tooltip = this.id;
    // layout info
    this.cx = 40;
    this.cy = 40;
    this.initLabel();
    //make symbol
    this.outline = document.createElementNS(svgns, "rect");
    //todo
    d3.select(this.outline).attr("height", 20)
        .attr("width", 40)
        .attr("x", -20)
        .attr("y", -10)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("stroke", "black")
        .attr("stroke-width", "4")
        .attr("stroke-opacity", 1)
        .attr("fill-opacity", 1)
        .attr("fill", "#ffffff");
    //append outline
    this.upperGroup.appendChild(this.outline);

    this.upperLine = document.createElementNS(svgns, "rect");
    d3.select(this.upperLine).attr("height", 20)
        .attr("width", 40)
        .attr("x", -20)
        .attr("y", -10)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("stroke", "white")
        .attr("stroke-width", "2")
        .attr("stroke-opacity", 1)
        .attr("fill-opacity", 0);
    //append outline
    this.upperGroup.appendChild(this.upperLine);
    this.initListeners();
}

MoleculeSet.prototype.getBlobRadius = function () {
    return 25;
};

MoleculeSet.prototype = new Interactor();

/*
MoleculeSet.prototype.getBlobRadius = function() {
    return 20;
}
*/
