import {Interactor} from "./interactor";

export function RNA(id, app, json, name) {
    this.init(id, app, json, name);
    this.upperGroup = document.createElementNS(this.app.svgns, "g");
    this.initLabel();
    const points = "0, -10  10, 0 0, 10 -10, 0";
    this.outline = document.createElementNS(this.app.svgns, "polygon");
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
