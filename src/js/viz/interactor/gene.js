import {Interactor} from "./interactor";
import {svgns} from "../../svgns";

export class Gene extends Interactor {
    constructor(id, app, json, name) {
        super();
        this.init(id, app, json, name);
        this.upperGroup = document.createElementNS(svgns, "g");
        this.initLabel();
        this.outline = document.createElementNS(svgns, "rect");
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