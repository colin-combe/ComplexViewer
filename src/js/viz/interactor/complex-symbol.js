import {Interactor} from "./interactor";
import {svgns} from "../../config";

export function ComplexSymbol(id, app, name, json) { //, name) {
    this.init(id, app, json, name);
    // layout info
    this.ix= -100;
    this.iy = -100;

    this.upperGroup = document.createElementNS(svgns, "g");
    this.initLabel();
    const points = "15,0 8,-13 -7,-13 -15,0 -8,13 7,13";
    this.outline = document.createElementNS(svgns, "polygon");
    this.outline.setAttribute("points", points);
    this.initOutline();
    this.initListeners();
 }

ComplexSymbol.prototype = new Interactor();


ComplexSymbol.prototype.getSymbolRadius = function () {
    return 20;
};

/*
ComplexSymbol.prototype.showData = function() {
    if (this.name.startsWith("intact_")) {
        const url = "http://www.ebi.ac.uk/intact/complex/details/" + this.name.substr(7);
        window.open(url, '_blank');
    }
}
*/
