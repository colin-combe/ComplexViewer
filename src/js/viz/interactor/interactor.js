Interactor.LABELMAXLENGTH = 90; // maximal width reserved for protein-labels
Interactor.labelY = -5; //label Y offset, better if calc'd half height of label once rendered

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

Interactor.prototype.addStoichiometryLabel = function (stoichiometry) {
    if (this.labelSVG) { //complexes don't have labels (yet?)
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

Interactor.prototype.getBlobRadius = function () {
    return 15;
};


Interactor.prototype.showHighlight = function () {
    // if (show === true) {
    //~ this.highlight.setAttribute("stroke", xiNET.highlightColour.toRGB());
    // this.highlight.setAttribute("stroke-opacity", "1");
    // } else {
    //~ if (this.isSelected == false) {
    this.highlight.setAttribute("stroke-opacity", "0");
    //~ }
    //~ this.highlight.setAttribute("stroke", xiNET.selectedColour.toRGB());
    // }
};

/*
Interactor.prototype.setSelected = function(select) {
     if (select && this.isSelected === false) {
         this.util.selected.set(this.id, this);
         this.isSelected = true;
         this.highlight.setAttribute("stroke", selectedColour);
         this.highlight.setAttribute("stroke-opacity", "1");
     }
     else if (select === false && this.isSelected === true) {
         this.util.selected.remove(this.id);
         this.isSelected = false;
         this.highlight.setAttribute("stroke-opacity", "0");
         this.highlight.setAttribute("stroke", highlightColour);
     }
}
*/

Interactor.prototype.getPosition = function () {
    return [this.cx, this.cy];
};

// more accurately described as setting transform for top svg elements (sets scale also)
Interactor.prototype.setPosition = function (x, y) {
    this.cx = x;
    this.cy = y;
    // if (this.form === 1) {
    this.upperGroup.setAttribute("transform", "translate(" + (this.cx) + " " + this.cy + ")"); // +
    //         " scale(" + (this.util.z) + ") " + "rotate(" + this.rotation + ")");
    // } else {
    //     this.upperGroup.setAttribute("transform", "translate(" + this.cx + " " + this.cy + ")" +
    //         " scale(" + (this.util.z) + ") ");
    // }
};

Interactor.prototype.getAggregateSelfLinkPath = function () {
    const intraR = this.getBlobRadius() + 7;
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

Interactor.rotatePointAboutPoint = function (p, o, theta) {
    theta = (theta / 360) * Math.PI * 2; //TODO: change theta arg to radians not degrees
    const rx = Math.cos(theta) * (p[0] - o[0]) - Math.sin(theta) * (p[1] - o[1]) + o[0];
    const ry = Math.sin(theta) * (p[0] - o[0]) + Math.cos(theta) * (p[1] - o[1]) + o[1];
    return [rx, ry];
};

Interactor.prototype.checkLinks = function () {
    function checkAll(linkMap) {
        for (let link of linkMap.values()) {
            link.check();
        }
    }

    // checkAll(this.naryLinks); // hacked out to help fix ordering of nLinks
    checkAll(this.binaryLinks);
    checkAll(this.sequenceLinks);
    if (this.selfLink !== null) {
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

/*
Interactor.prototype.showData = function() {
    //~ alert ("molecule!");
}
*/

Interactor.prototype.setForm = function () {
};
