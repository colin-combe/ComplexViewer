import {LABEL_Y, svgns} from "../../config";

export function Interactor() {
}

Interactor.prototype = {
    get width() {
        return this.upperGroup.getBBox().width;
    },
    get height() {
        return this.upperGroup.getBBox().height;
    },
};

Interactor.prototype.init = function (id, app, json, name){
    this.id = id;
    this.app = app;
    this.json = json;
    //links
    this.naryLinks = new Map();
    this.binaryLinks = new Map();
    this.sequenceLinks = new Map();
    this.name = name;
};

Interactor.prototype.initLabel = function (){

    this.labelSVG = document.createElementNS(svgns, "text");
    this.labelSVG.setAttribute("text-anchor", "end");
    this.labelSVG.setAttribute("fill", "black");
    this.labelSVG.setAttribute("x", "0");
    this.labelSVG.setAttribute("y", "10");
    this.labelSVG.setAttribute("class", "xlv_text proteinLabel");
    this.labelSVG.setAttribute("font-family", "Arial");
    this.labelSVG.setAttribute("font-size", "16");

    //choose label text
    if (this.name) {
        this.labelText = this.name;
    } else {
        this.labelText = this.id;
    }
    if (this.labelText.length > 25) {
        this.labelText = this.labelText.substr(0, 16) + "...";
    }

    this.labelText = this.name;
    this.labelTextNode = document.createTextNode(this.labelText);
    this.labelSVG.appendChild(this.labelTextNode);
    this.labelSVG.setAttribute("transform",
        "translate( -" + this.getSymbolRadius() + " " + LABEL_Y + ")");
    this.upperGroup.appendChild(this.labelSVG);
};

Interactor.prototype.initOutline = function (){
    this.outline.setAttribute("stroke", "black");
    this.outline.setAttribute("stroke-width", "1");
    this.outline.setAttribute("stroke-opacity", "1");
    this.outline.setAttribute("fill-opacity", "1");
    this.outline.setAttribute("fill", "#ffffff");
    //append outline
    this.upperGroup.appendChild(this.outline);
};

Interactor.prototype.initListeners = function (){
    // events
    const self = this;
    //    this.upperGroup.setAttribute('pointer-events','all');
    this.upperGroup.onmousedown = function (evt) {
        self.mouseDown(evt);
    };
    this.upperGroup.onmouseover = function (evt) {
        self.mouseOver(evt);
    };
    this.upperGroup.onmouseout = function (evt) {
        self.mouseOut(evt);
    };
    // this.upperGroup.ontouchstart = function (evt) {
    //     self.touchStart(evt);
    // };

    //~ this.upperGroup.ontouchmove = function(evt) {};
    //~ this.upperGroup.ontouchend = function(evt) {
    //~ self.ctrl.message("protein touch end");
    //~ self.mouseOut(evt);
    //~ };
    //~ this.upperGroup.ontouchenter = function(evt) {
    //~ self.message("protein touch enter");
    //~ self.touchStart(evt);
    //~ };
    //~ this.upperGroup.ontouchleave = function(evt) {
    //~ self.message("protein touch leave");
    //~ self.mouseOut(evt);
    //~ };
    //~ this.upperGroup.ontouchcancel = function(evt) {
    //~ self.message("protein touch cancel");
    //~ self.mouseOut(evt);
    //~ };
};

Interactor.prototype.addStoichiometryLabel = function (stoichiometry) {
    if (this.labelSVG) { //complexes don't have labels (yet?)
        // noinspection JSUndefinedPropertyAssignment
        this.labelSVG.childNodes[0].data = this.labelSVG.childNodes[0].data + " [" + stoichiometry + "]";
    }
};

Interactor.prototype.mouseDown = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
    if (typeof this.app.d3cola !== "undefined" && this.app.d3cola != null) {
        this.app.d3cola.stop();
    }
    this.app.dragElement = this;
    const p = this.app.getEventPoint(evt);
    this.app.dragStart = this.app.mouseToSVG(p.x, p.y);
    return false;
};

//// TODO: test on touch screen
// Interactor.prototype.touchStart = function(evt) {
//     this.util.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
//     if (this.util.d3cola !== undefined) {
//         this.util.d3cola.stop();
//     }
//     this.util.dragElement = this;
//     //store start location
//     var p = this.util.getTouchEventPoint(evt);
//     this.util.dragStart = this.util.mouseToSVG(p.x, p.y);
//     return false;
// };

Interactor.prototype.mouseOver = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt);
    this.showHighlight(true);
    //~ this.util.setTooltip(this.id);
    return false;
};

Interactor.prototype.mouseOut = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt);
    this.showHighlight(false);
    this.app.hideTooltip();
    return false;
};

Interactor.prototype.getSymbolRadius = function () {
    return 15;
};


Interactor.prototype.showHighlight = function () {
};

Interactor.prototype.getPosition = function () {
    return [this.cx, this.cy]; // todo - type of return is kind of inconsistent
};

Interactor.prototype.setPosition = function (x, y) {
    this.cx = x;
    this.cy = y;
    this.upperGroup.setAttribute("transform", "translate(" + (this.cx) + " " + this.cy + ")");
};

Interactor.prototype.changePosition = function (x, y) {
    this.cx -= x;
    this.cy -= y;
    this.upperGroup.setAttribute("transform", "translate(" + (this.cx) + " " + this.cy + ")");
    // this.setAllLinkCoordinates(); // todo - look at calls
};

Interactor.prototype.getAggregateSelfLinkPath = function () {
    const intraR = this.getSymbolRadius() + 7;
    const sectorSize = 45;
    const arcStart = trig(intraR, 25 + sectorSize);
    const arcEnd = trig(intraR, -25 + sectorSize);
    const cp1 = trig(intraR, 40 + sectorSize);
    const cp2 = trig(intraR, -40 + sectorSize);
    return "M 0,0 " +
        "Q " + cp1.x + "," + -cp1.y + " " + arcStart.x + "," + -arcStart.y +
        " A " + intraR + " " + intraR + " 0 0 1 " + arcEnd.x + "," + -arcEnd.y +
        " Q " + cp2.x + "," + -cp2.y + " 0,0";
};

Interactor.prototype.checkLinks = function () {
    function checkAll(linkMap) {
        for (let link of linkMap.values()) {
            link.check();
        }
    }

    // checkAll(this.naryLinks); // hacked out to fix ordering of nLinks
    checkAll(this.binaryLinks);
    checkAll(this.sequenceLinks);
    if (this.selfLink) {
        this.selfLink.check();
    }
};

// update all lines (e.g after a move)
Interactor.prototype.setAllLinkCoordinates = function () {
    for (let link of this.naryLinks.values()) {
        link.setLinkCoordinates();
    }
    for (let link of this.binaryLinks.values()) {
        link.setLinkCoordinates();
    }
    if (this.selfLink) {
        this.selfLink.setLinkCoordinates();
    }
    for (let link of this.sequenceLinks.values()) {
        link.setLinkCoordinates();
    }
};

//TODO: remove this, use rotateAboutPoint instead
export function trig (radius, angleDegrees) {
    //x = rx + radius * cos(theta) and y = ry + radius * sin(theta)
    const radians = (angleDegrees / 360) * Math.PI * 2;
    return {
        x: (radius * Math.cos(radians)),
        y: (radius * Math.sin(radians))
    };
}

Interactor.prototype.setForm = function () {
};
