import * as d3 from "d3";
import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function Gene(id, app, json, name) {
    this.init(id, app, json, name);
    // layout info
    this.cx = 40;
    this.cy = 40;
    this.initLabel();
    // this.background = document.createElementNS(svgns, "rect");
    // this.background.setAttribute("fill", "#FFFFFF");
    // this.upperGroup.appendChild(this.background);

    //make outline
    this.outline = document.createElementNS(svgns, "rect");
    this.initOutline();
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
    // d3.select(this.background)
    //     .attr("x", -16).attr("y", -8)
    //     .attr("width", 32).attr("height", 16)
    //     .attr("rx", 6).attr("ry", 6);
    d3.select(this.outline)
        .attr("x", -16).attr("y", -8)
        .attr("width", 32).attr("height", 16)
        .attr("rx", 6).attr("ry", 6);

    this.initListeners();
}

Gene.prototype = new Interactor();