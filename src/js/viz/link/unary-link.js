//todo - is this even working? you never see it

import {Link} from "./link";

export class UnaryLink extends Link {
    constructor(id, app, participant) {
        super(id, app);
        this.participants = [participant];
        participant.selfLink = this;
    }

    get line (){
        if (!this._line) {
            this._line = document.createElementNS("http://www.w3.org/2000/svg", "path");
            this._line.classList.add("link", "link-line");//, "certain-link");
            const self = this;
            this._line.onmousedown = evt => self.mouseDown(evt);
            this._line.onmouseover = evt => self.mouseOver(evt);
            this._line.onmouseout = evt => self.mouseOut(evt);
        }
        return this._line;
    }

    get highlightLine (){
        if (!this._highlightLine) {
            this._highlightLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
            this._highlightLine.classList.add("link", "highlight", "link-highlight");
            const self = this;
            this._highlightLine.onmousedown = evt => self.mouseDown(evt);
            this._highlightLine.onmouseover = evt => self.mouseOver(evt);
            this._highlightLine.onmouseout = evt => self.mouseOut(evt);
        }
        return this._highlightLine;
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
        this.initSelfLinkSVG();
        this.line.setAttribute(
            "transform",
            `translate(${this.participants[0].ix} ${this.participants[0].iy}) scale(${this.app.z})`
        );
        this.highlightLine.setAttribute(
            "transform",
            `translate(${this.participants[0].ix} ${this.participants[0].iy}) scale(${this.app.z})`
        );
        this.app.highlights.appendChild(this.highlightLine);
        this.app.p_pLinks.appendChild(this.line);
    }

    setLinkCoordinates() {
        const participant = this.participants[0];
        this.line.setAttribute(
            "transform",
            `translate(${participant.ix} ${participant.iy}) scale(${this.app.z})`
        );
        this.highlightLine.setAttribute(
            "transform",
            `translate(${participant.ix} ${participant.iy}) scale(${this.app.z})`
        );
    }
}
