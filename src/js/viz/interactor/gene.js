import {Interactor} from "./interactor";

export class Gene extends Interactor {
    constructor(id, app, json, name) {
        super();
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

    getSymbolRadius () {
        return 21;
    }
}