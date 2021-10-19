//todo - is this even working? you never see it

import {Link} from "./link";
import {svgns} from "../../svgns";

// var FeatureLink = require('./FeatureLink');

export class UnaryLink extends Link {
    constructor(id, app, participant) {
        super();
        this.id = id;
        this.participants = [participant];
        this.sequenceLinks = new Map();
        this.app = app;
        this.line = document.createElementNS(svgns, "path");
        this.highlightLine = document.createElementNS(svgns, "path");
        this.initSVG();
    }

    initSelfLinkSVG () {
        const path = this.participants[0].getAggregateSelfLinkPath();
        this.line.setAttribute("d", path);
        this.highlightLine.setAttribute("d", path);
    }

    check() {
        if (!this.participants[0].expanded) {
            this.show();
            return true;
        } else {
            this.hide();
            return false;
        }
    }

    show() {
        this.line.setAttribute("transform", "translate(" + this.participants[0].ix +
            " " + this.participants[0].iy + ")" + " scale(" + (this.app.z) + ")");
        this.highlightLine.setAttribute("transform", "translate(" + this.participants[0].ix +
            " " + this.participants[0].iy + ")" + " scale(" + (this.app.z) + ")");
        this.app.highlights.appendChild(this.highlightLine);
        this.app.p_pLinks.appendChild(this.line);
    }

    setLinkCoordinates() {
        const participant = this.participants[0];
        this.line.setAttribute("transform", "translate(" + participant.ix +
            " " + participant.iy + ")" + " scale(" + (this.app.z) + ")");
        this.highlightLine.setAttribute("transform", "translate(" + participant.ix +
            " " + participant.iy + ")" + " scale(" + (this.app.z) + ")");
    }
}
