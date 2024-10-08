import {Interactor} from "./interactor";
import Point2D from "point2d";
import Intersection from "intersectionjs";

export class Complex extends Interactor {
    constructor(id, app) {
        super();

        this.init(id, app);
        this.type = "complex";
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

    getResidueCoordinates () {
        return this.getPosition();
    }
}
