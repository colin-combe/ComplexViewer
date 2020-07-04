import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function DNA(id, app, json, name) {
    this.init(id, app, json, name);
    // layout info
    this.ix= -500;
    this.iy = -500;

    this.upperGroup = document.createElementNS(svgns, "g");
    this.initLabel();
    const points = "0, -5  10, -10 0, 10 -10, -10";
    this.outline = document.createElementNS(svgns, "polygon");
    this.outline.setAttribute("points", points);
    this.initOutline();
    this.initListeners();
}

DNA.prototype = new Interactor();