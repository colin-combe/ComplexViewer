import {highlightColour} from "../../config";
export function Link () {}

Link.prototype.highlightParticipants = function (show) {
    for (let participant of this.participants) {
        participant.showHighlight(show);
    }
};

Link.prototype.initSVG = function () {
    this.line.classList.add("link","link-line");//, "certain-link");
    this.highlightLine.classList.add("link", "highlight", "link-highlight");
    //set the events for it
    const self = this;
    this.line.onmousedown = function (evt) {
        self.mouseDown(evt);
    };
    this.line.onmouseover = function (evt) {
        self.mouseOver(evt);
    };
    this.line.onmouseout = function (evt) {
        self.mouseOut(evt);
    };
    // this.line.ontouchstart = function (evt) {
    //     self.touchStart(evt);
    // };

    this.highlightLine.onmousedown = function (evt) {
        self.mouseDown(evt);
    };
    this.highlightLine.onmouseover = function (evt) {
        self.mouseOver(evt);
    };
    this.highlightLine.onmouseout = function (evt) {
        self.mouseOut(evt);
    };
    // this.highlightLine.ontouchstart = function (evt) {
    //     self.touchStart(evt);
    // };
};
// event handler for starting dragging or rotation (or flipping internal links)
Link.prototype.mouseDown = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt);
    //stop layout
    this.app.d3cola.stop();
    this.app.dragElement = this;
    //store start location
    this.app.dragStart = evt;
    return false;
};

Link.prototype.mouseOver = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt);
    this.app.setTooltip(this.getToolTip(), this.color);
    return false;
};

Link.prototype.getToolTip = function () {
    return this.id;
};

Link.prototype.mouseOut = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt);
    this.app.hideTooltip();
    return false;
};


Link.prototype.touchStart = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
    //stop layout
    this.app.d3cola.stop();
    this.app.dragElement = this;
    //store start location
    this.app.dragStart = evt;
    return false;
};

//used by BinaryLink and UnaryLink
Link.prototype.hide = function () {
    this.highlightLine.remove();
    this.line.remove();
};
