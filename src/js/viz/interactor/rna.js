import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function RNA(id, app, json, name) {
    this.init(id, app, json, name);
    // layout info
    this.cx = 40;
    this.cy = 40;
    this.initLabel();
    //for polygon
    const points = "0, -10  10, 0 0, 10 -10, 0";
    //make blob
    this.outline = document.createElementNS(svgns, "polygon");
    this.outline.setAttribute("points", points);
    this.initOutline();
    this.initListeners();
}

RNA.prototype = new Interactor();

/*
RNA.prototype.showData = function(evt) {
    const url = "http://rnacentral.org/rna/" + this.json.identifier.id;
    window.open(url, '_blank');
}
*/