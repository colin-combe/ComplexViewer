//todo - is this even working? you never see it

import {Link} from "./link";

// var FeatureLink = require('./FeatureLink');

export function UnaryLink(id, app, participant) {
    this.id = id;
    this.participants = [participant];
    this.sequenceLinks = new Map();
    this.app = app;
    this.line = document.createElementNS(this.app.svgns, "path");
    this.highlightLine = document.createElementNS(this.app.svgns, "path");
    this.initSVG();
}

UnaryLink.prototype = new Link();

UnaryLink.prototype.initSelfLinkSVG = function () {
    const path = this.participants[0].getAggregateSelfLinkPath();
    this.line.setAttribute("d", path);
    this.highlightLine.setAttribute("d", path);
};

UnaryLink.prototype.check = function () {
    if (!this.participants[0].expanded) {
        this.show();
        return true;
    } else {
        this.hide();
        return false;
    }
};

UnaryLink.prototype.show = function () {
    this.line.setAttribute("transform", "translate(" + this.participants[0].ix +
        " " + this.participants[0].iy + ")" + " scale(" + (this.app.z) + ")");
    this.highlightLine.setAttribute("transform", "translate(" + this.participants[0].ix +
        " " + this.participants[0].iy + ")" + " scale(" + (this.app.z) + ")");
    this.app.highlights.appendChild(this.highlightLine);
    this.app.p_pLinks.appendChild(this.line);
};


UnaryLink.prototype.setLinkCoordinates = function () {
    const participant = this.participants[0];
    this.line.setAttribute("transform", "translate(" + participant.ix +
        " " + participant.iy + ")" + " scale(" + (this.app.z) + ")");
    this.highlightLine.setAttribute("transform", "translate(" + participant.ix +
        " " + participant.iy + ")" + " scale(" + (this.app.z) + ")");
};

