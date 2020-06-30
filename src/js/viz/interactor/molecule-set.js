import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function MoleculeSet(id, app, json, name) {
    this.init(id, app, json, name);
    // layout info
    this.cx = 40;
    this.cy = 40;
    this.upperGroup = document.createElementNS(svgns, "g");
    this.initLabel();
    this.outline = document.createElementNS(svgns, "rect");
    this.outline.setAttribute("x", "-20");
    this.outline.setAttribute("y", "-10");
    this.outline.setAttribute("width", "40");
    this.outline.setAttribute("height", "20");
    this.outline.setAttribute("rx", "5");
    this.outline.setAttribute("ry", "5");
    this.outline.setAttribute("stroke", "black");
    this.outline.setAttribute("stroke-width", "4");
    this.outline.setAttribute("stroke-opacity", "1");
    this.outline.setAttribute("fill-opacity", "1");
    this.outline.setAttribute("fill", "#ffffff");
    //append outline
    this.upperGroup.appendChild(this.outline);
    this.upperLine = document.createElementNS(svgns, "rect");
    this.upperLine.setAttribute("x", "-20");
    this.upperLine.setAttribute("y", "-10");
    this.upperLine.setAttribute("width", "40");
    this.upperLine.setAttribute("height", "20");
    this.upperLine.setAttribute("rx", "5");
    this.upperLine.setAttribute("ry", "5");
    this.upperLine.setAttribute("stroke", "white");
    this.upperLine.setAttribute("stroke-width", "2");
    this.upperLine.setAttribute("stroke-opacity", "1");
    this.upperLine.setAttribute("fill", "none");
    this.upperGroup.appendChild(this.upperLine);
    this.initListeners();
}

MoleculeSet.prototype = new Interactor();

MoleculeSet.prototype.getSymbolRadius = function () {
    return 25;
};
