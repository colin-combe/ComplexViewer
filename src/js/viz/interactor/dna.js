import {Interactor} from "./interactor";
import {svgns} from "../../svgns";

export class DNA extends Interactor{
    constructor(id, app, json, name) {
        super();
        this.init(id, app, json, name);
        this.upperGroup = document.createElementNS(svgns, "g");
        this.initLabel();
        const points = "0, -5  10, -10 0, 10 -10, -10";
        this.outline = document.createElementNS(svgns, "polygon");
        this.outline.setAttribute("points", points);
        this.initOutline();
        this.initListeners();
    }
}