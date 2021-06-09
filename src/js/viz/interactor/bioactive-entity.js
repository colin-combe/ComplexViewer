import {Interactor} from "./interactor";

export function BioactiveEntity(id, app, json, name) {
    this.init(id, app, json, name);
    this.upperGroup = document.createElementNS(this.app.svgns, "g");
    this.initLabel();
    const points = "0, -10  8.66,5 -8.66,5";
    this.outline = document.createElementNS(this.app.svgns, "polygon");
    this.outline.setAttribute("points", points);
    this.initOutline();
    this.initListeners();
}

BioactiveEntity.prototype = new Interactor();

/*
BioactiveEntity.prototype.showData = function() {
    const url = "https://www.ebi.ac.uk/chebi/searchId.do;?chebiId=" + this.json.identifier.id;
    window.open(url, '_blank');
}
*/
