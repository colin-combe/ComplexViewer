import {Link} from "./link";
import * as Intersection from "intersectionjs";
import * as Point2D from "point2d";

export function BinaryLink(id, app, fromI, toI) {
    this.id = id;
    // this.evidences = d3.map();
    this.participants = [fromI, toI];
    this.sequenceLinks = new Map();
    this.app = app;
    this.line = document.createElementNS(this.app.svgns, "line");
    this.highlightLine = document.createElementNS(this.app.svgns, "line");
    this.initSVG();
}

BinaryLink.prototype = new Link();

BinaryLink.prototype.check = function () {
    if (!this.participants[0].expanded && !this.participants[1].expanded) { //checks if form not defined or is 0
        this.show();
        return true;
    } else { //at least one end was in stick form
        this.hide();
        return false;
    }
};

BinaryLink.prototype.show = function () {
    // if (typeof this.line === "undefined") {
    //     this.initSVG();
    // }
    this.line.setAttribute("stroke-width", this.app.z * 1);
    this.highlightLine.setAttribute("stroke-width", this.app.z * 10);
    this.setLinkCoordinates(this.participants[0]);
    this.setLinkCoordinates(this.participants[1]);
    this.app.highlights.appendChild(this.highlightLine);
    this.app.p_pLinks.appendChild(this.line);
};


BinaryLink.prototype.setLinkCoordinates = function () {
    if (typeof this.line === "undefined") {
        this.initSVG();
    }
    let pos1 = this.participants[0].getPosition();
    let pos2 = this.participants[1].getPosition();

    let naryPath, iPath, a1, a2, intersect;
    const complexPosition = function (participant) {
        naryPath = participant.naryLink.hull;
        iPath = [];
        for (let p of naryPath) {
            iPath.push(new Point2D(p[0], p[1]));
        }
        a1 = new Point2D(pos1[0], pos1[1]);
        a2 = new Point2D(pos2[0], pos2[1]);
        intersect = Intersection.intersectLinePolygon(a1, a2, iPath);
        if (intersect.points[0]) {
            return [intersect.points[0].x, intersect.points[0].y];
        }
    };

    if (this.participants[0].type === "complex") {
        const cPos = complexPosition(this.participants[0]);
        if (cPos) {
            pos1 = cPos;
        }
    }

    if (this.participants[1].type === "complex") {
        const cPos = complexPosition(this.participants[1]);
        if (cPos) {
            pos2 = cPos;
        }
    }

    this.line.setAttribute("x1", pos1[0]);
    this.line.setAttribute("y1", pos1[1]);
    this.highlightLine.setAttribute("x1", pos1[0]);
    this.highlightLine.setAttribute("y1", pos1[1]);

    this.line.setAttribute("x2", pos2[0]);
    this.line.setAttribute("y2", pos2[1]);
    this.highlightLine.setAttribute("x2", pos2[0]);
    this.highlightLine.setAttribute("y2", pos2[1]);
};

