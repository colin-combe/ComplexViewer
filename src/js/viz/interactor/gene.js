import {Interactor} from "./interactor";

export function Gene(id, app, json, name) {
    this.init(id, app, json, name);
    this.upperGroup = document.createElementNS(this.app.svgns, "g");
    this.initLabel();
    this.outline = document.createElementNS(this.app.svgns, "rect");
    this.outline.setAttribute("x", "-16");
    this.outline.setAttribute("y", "-8");
    this.outline.setAttribute("width", "32");
    this.outline.setAttribute("height", "16");
    this.outline.setAttribute("rx", "6");
    this.outline.setAttribute("ry", "6");
    this.initOutline();
    this.initListeners();
}

Gene.prototype = new Interactor();

Gene.prototype.getSymbolRadius = function () {
    return 21;
};