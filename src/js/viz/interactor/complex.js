import {Interactor} from "./interactor";
import * as Point2D from "point2d";
import * as Intersection from "intersectionjs";

export function Complex(id, app) {
    this.init(id, app);
    this.type = "complex";
    this.padding = 15;
}

Complex.prototype = new Interactor();

Complex.prototype.initParticipant = function (naryLink) { // todo - rename to initLink?
    this.naryLink = naryLink;
    naryLink.path.setAttribute("stroke", "gray");
    naryLink.path.setAttribute("stroke-linejoin", "round");
    naryLink.path.setAttribute("stroke-width", 8);
};

Complex.prototype.getPosition = function (originPoint) {
    const mapped = this.naryLink.getMappedCoordinates();
    const mc = mapped.length;
    let xSum = 0,
        ySum = 0;
    for (let m = 0; m < mc; m++) {
        xSum += mapped[m][0];
        ySum += mapped[m][1];
    }
    let center = [xSum / mc, ySum / mc];
    if (originPoint) {
    // if (participant.type === "complex"){
    //     startPoint = participant.getPosition();
        let naryPath = this.naryLink.hull;
        let iPath = [];
        for (let p of naryPath) {
            iPath.push(new Point2D(p[0], p[1]));
        }
        let a1 = new Point2D(center[0], center[1]);
        let a2 = new Point2D(originPoint[0], originPoint[1]);
        let intersect = Intersection.intersectLinePolygon(a1, a2, iPath);
        if (intersect.points[0]) {
            return [intersect.points[0].x, intersect.points[0].y];
        }
    }
    return center;
};

Complex.prototype.setPosition = function () {
    console.error("bad - called setPosition on ", this);
};

Complex.prototype.changePosition = function (dx, dy) {
    for (let participant of this.naryLink.participants){
        participant.changePosition(dx, dy);
    }
};

Complex.prototype.getResidueCoordinates = function () {
    return this.getPosition();
};

