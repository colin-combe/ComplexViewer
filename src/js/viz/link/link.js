import {svgns} from "../../svgns";

export class Link {
    constructor(id, app) {
        this.id = id;
        this.app = app;
        this.participants = [];
        this.sequenceLinks = new Map();
        // this.evidences = d3.map();
    }



    highlightParticipants(show) {
        for (let participant of this.participants) {
            participant.showHighlight(show);
        }
    }

// event handler for starting dragging or rotation (or flipping internal links)
    mouseDown(evt) {
        this.app.preventDefaultsAndStopPropagation(evt);
        this.app.d3cola.stop();
        this.app.dragElement = this;
        //store start location
        this.app.dragStart = evt;
        return false;
    }

    mouseOver(evt) {
        this.app.preventDefaultsAndStopPropagation(evt);
        this.app.setTooltip(this.getToolTip(), this.color);
        return false;
    }

    getToolTip() {
        return this.id;
    }

    mouseOut(evt) {
        this.app.preventDefaultsAndStopPropagation(evt);
        this.app.hideTooltip();
        return false;
    }

    touchStart(evt) {
        this.app.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
        this.app.d3cola.stop();
        this.app.dragElement = this;
        //store start location
        this.app.dragStart = evt;
        return false;
    }

//used by BinaryLink and UnaryLink
    hide() {
        this.highlightLine.remove();
        this.line.remove();
    }

    _createElement(tagName, classes = []) {
        const line = document.createElementNS(svgns, tagName);
        line.classList.add(...classes);
        line.onmousedown = evt => this.mouseDown(evt);
        line.onmouseover = evt => this.mouseOver(evt);
        line.onmouseout = evt => this.mouseOut(evt);
        return line;
    }
}
