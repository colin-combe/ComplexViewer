import {Interactor} from "./interactor";
import Point2D from "point2d";
import Intersection from "intersectionjs";
import {svgns} from "../../svgns";

export class Complex extends Interactor {
    constructor(id, app, interactor, interactorRef) {
        super();

        this.init(id, app, interactor, interactorRef);
        this.type = "complex";
        this.upperGroup = document.createElementNS(svgns, "g");
        this.initLabel();
        this.padding = 28;

        // const self = this;
        // // its bad if you end up with these getting called
        // Object.defineProperty(this, "width", {
        //     get: function height() {
        //         return self.naryLink.path.getBBox().width;
        //         //return 160;
        //     }
        // });
        // Object.defineProperty(this, "height", {
        //     get: function height() {
        //         return self.naryLink.path.getBBox().height;
        //         //return 160;
        //     }
        // });
    }

    initLink(naryLink) {
        this.naryLink = naryLink;
        this.naryLink.path.classList.add("complex-outline");
    }

    setLinked() {

        this.naryLink.path2.classList.add("linked-complex");
    }

    getPosition(originPoint) {
        let mapped = this.naryLink.mapped;//getMappedCoordinates();
        if (!mapped) {
            this.naryLink.setLinkCoordinates();
            mapped = this.naryLink.mapped;//this.naryLink.orbitNodeCount(this.naryLink.getMappedCoordinates());
        }
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
            this.setLinked();
        }
        return center;
    }

    setPosition () {
        console.error("error - called setPosition on ", this);
    }

    changePosition (dx, dy) {
        for (let participant of this.naryLink.participants) {
            participant.changePosition(dx, dy);
        }
    }

    setLabelPosition () {
        // const pos = this.getPosition();

        const participants = this.naryLink.participants;
        let mapped = [];
        const ic = participants.length;
        for (let i = 0; i < ic; i++) {
            const participant = participants[i];
        //     if (participant.type === "complex") {
        //         //use some kind of caching?
        //         mapped = mapped.concat(this.orbitNodes(participant.naryLink.getMappedCoordinates(), 20));
        //     } else if (participant.expanded) {
        //         const start = participant.getResidueCoordinates(0);
        //         const end = participant.getResidueCoordinates(participant.size);
        //         if (!isNaN(start[0]) && !isNaN(start[1]) &&
        //             !isNaN(end[0]) && !isNaN(end[1])) {
        //             mapped.push(start);
        //             mapped.push(end);
        //         } else {
        //             mapped.push(participant.getPosition());
        //         }
        //     } else {
                mapped.push(participant.getPosition());
        //     }
        }
        const mc = mapped.length;
        let xSum = 0,
            ySum = 0;
        for (let m = 0; m < mc; m++) {
            xSum += mapped[m][0];
            ySum += mapped[m][1];
        }
        let pos = [xSum / mc, ySum / mc];
        this.upperGroup.setAttribute("transform", `translate(${pos[0]} ${pos[1]})`);
    }

    getResidueCoordinates () {
        return this.getPosition();
    }
}
