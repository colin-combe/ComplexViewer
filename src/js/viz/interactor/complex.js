import {Interactor} from "./interactor";

Complex.prototype = new Interactor();

export function Complex(id, app) {
    this.id = id;
    this.app = app;
    //links
    this.naryLinks = new Map();
    this.binaryLinks = new Map();
    this.sequenceLinks = new Map();
    this.type = "complex";
    this.padding = 15;
}

Complex.prototype.initParticipant = function (naryLink) {
    this.naryLink = naryLink;
    naryLink.path.setAttribute("stroke", "gray");
    naryLink.path.setAttribute("stroke-linejoin", "round");
    naryLink.path.setAttribute("stroke-width", 8);
};

Complex.prototype.getPosition = function () {
    const mapped = this.naryLink.getMappedCoordinates();
    const mc = mapped.length;
    let xSum = 0,
        ySum = 0;
    for (let m = 0; m < mc; m++) {
        xSum += mapped[m][0];
        ySum += mapped[m][1];
    }
    return [xSum / mc, ySum / mc];
};

Complex.prototype.setPosition = function () {
    console.log("bad - called setPosition on ", this);
};

Complex.prototype.changePosition = function (dx, dy) {
    for (let participant of this.naryLink.participants){
        participant.changePosition(dx, dy);
    }
};

Complex.prototype.getResidueCoordinates = function () {
    return this.getPosition();
};
Complex.prototype.showHighlight = function () {
};
