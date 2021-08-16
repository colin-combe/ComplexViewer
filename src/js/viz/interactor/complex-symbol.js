import {Interactor} from "./interactor";
import {svgns} from "../../svgns";

export class ComplexSymbol extends Interactor {
    constructor(id, app, name, json) { //, name) {
        super();
        this.init(id, app, json, name);
        this.upperGroup = document.createElementNS(svgns, "g");
        this.initLabel();
        const points = "15,0 8,-13 -7,-13 -15,0 -8,13 7,13";
        this.outline = document.createElementNS(svgns, "polygon");
        this.outline.setAttribute("points", points);
        this.initOutline();
        this.initListeners();
    }

    getSymbolRadius () {
        return 20;
    }
}

/*
ComplexSymbol.prototype.showData = function() {
    if (this.name.startsWith("intact_")) {
        const url = "http://www.ebi.ac.uk/intact/complex/details/" + this.name.substr(7);
        window.open(url, '_blank');
    }
}
*/
