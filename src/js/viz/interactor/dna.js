import {Interactor} from "./interactor";

export class DNA extends Interactor{
    constructor(id, app, json, name) {
        super();
        this.init(id, app, json, name);
        this.upperGroup = document.createElementNS(this.app.svgns, "g");
        this.initLabel();
        const points = "0, -5  10, -10 0, 10 -10, -10";
        this.outline = document.createElementNS(this.app.svgns, "polygon");
        this.outline.setAttribute("points", points);
        this.initOutline();
        this.initListeners();
    }
}