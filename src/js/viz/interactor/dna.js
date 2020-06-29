import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function DNA(id, app, json, name) {
    this.init(id, app, json, name);
    // layout info
    this.cx = 40;
    this.cy = 40;
    this.initLabel();
    //for polygon
    const points = "0, -5  10, -10 0, 10 -10, -10";
    //make blob
    this.outline = document.createElementNS(svgns, "polygon");
    this.outline.setAttribute("points", points);
    this.initOutline();
    this.initListeners();
}

DNA.prototype = new Interactor();