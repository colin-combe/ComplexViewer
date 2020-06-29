import * as d3 from "d3"; // transitions and other stuff
import {Interactor, trig} from "./interactor";
import {Annotation} from "./annotation";
import {Feature} from "../feature";
//var Rotator = require('../../util/Rotator');
import {svgns, LABEL_Y} from "../../config";

Polymer.STICKHEIGHT = 20; //height of stick in pixels
Polymer.MAXSIZE = 0; // residue count of longest sequence
Polymer.transitionTime = 650;

export function Polymer() {
}

Polymer.prototype = new Interactor();

//sequence = amino acids in UPPERCASE, digits or lowercase can be used for modification info
Polymer.prototype.setSequence = function (sequence) {
    //remove modification site info from sequence
    this.sequence = sequence.replace(/[^A-Z]/g, "");
    this.size = this.sequence.length;
};

//by the time we get here all prot's have had their sequence set, so Polymer.MAXSIZE has correct value;
Polymer.prototype.initSVG = function () {
    //this.setForm(this.form);
    if (this.selfLink) this.selfLink.initSelfLinkSVG();
    this.setAllLinkCoordinates();
};

Polymer.prototype.getBlobRadius = function () {
    //~ if (this.size) {
    //~ return Math.sqrt(this.size / 2 / Math.PI);
    //~ }
    //~ else
    return 10;
};

Polymer.prototype.showHighlight = function (show) {
    if (show === true) {
        this.highlight.setAttribute("stroke-opacity", "1");
    } else {
        this.highlight.setAttribute("stroke-opacity", "0");
    }
};

Polymer.minXDist = 30;
Polymer.prototype.setStickScale = function (scale, svgP) {
    const oldScale = this.stickZoom;

    //dist from centre
    const dx = (this.cx - svgP.x);
    const dy = (this.cy - svgP.y);

    // new dist from centre
    const nx = dx * scale / oldScale;
    const ny = dy * scale / oldScale;

    //required change
    const rx = nx - dx;
    let ry = ny - dy;

    if (this.rotation === 0 || this.rotation === 180) {
        ry = 0;
    }

    //new pos
    const x = this.cx + rx;
    const y = this.cy + ry;

    this.stickZoom = scale;
    this.scale();
    this.setPosition(x, y);
    this.setAllLinkCoordinates();
};

Polymer.prototype.scale = function () {
    const protLength = (this.size) * this.stickZoom;
    if (this.form === 1) {
        const labelTransform = d3.transform(this.labelSVG.getAttribute("transform"));
        const k = this.app.svgElement.createSVGMatrix().rotate(labelTransform.rotate)
            .translate((-(((this.size / 2) * this.stickZoom) + (this.nTerminusFeature ? 25 : 10))), LABEL_Y); //.scale(z).translate(-c.x, -c.y);
        this.labelSVG.transform.baseVal.initialize(this.app.svgElement.createSVGTransformFromMatrix(k));

        if (this.annotations) {
            const ca = this.annotations.length;
            for (let a = 0; a < ca; a++) {
                const annotation = this.annotations[a];
                if (typeof annotation.seqDatum.uncertainBegin != "undefined") {
                    annotation.fuzzyStart.setAttribute("d", this.getAnnotationRectPath(annotation.seqDatum.uncertainBegin, annotation.seqDatum.begin, annotation));
                }

                annotation.certain.setAttribute("d", this.getAnnotationRectPath(annotation.seqDatum.begin, annotation.seqDatum.end, annotation));

                if (annotation.seqDatum.uncertainEnd) {
                    annotation.fuzzyEnd.setAttribute("d", this.getAnnotationRectPath(annotation.seqDatum.end, annotation.seqDatum.uncertainEnd, annotation));
                }
            }
        }

        d3.select(this.background)
            .attr("width", protLength)
            .attr("x", this.getResXwithStickZoom(0.5));

        d3.select(this.outline)
            .attr("width", protLength)
            .attr("x", this.getResXwithStickZoom(0.5));

        d3.select(this.highlight)
            .attr("width", protLength + 5)
            .attr("x", this.getResXwithStickZoom(0.5) - 2.5);


        this.setScaleGroup();
    }
};

Polymer.prototype.setScaleGroup = function () {
    this.upperGroup.appendChild(this.ticks); //will do nothing if this.ticks already appended to this.uppergroup
    d3.select(this.ticks).selectAll("*").remove();

    this.scaleLabels = [];
    const ScaleTicksPerLabel = 2; // varies with scale?
    let tick = -1;
    const lastTickX = this.getResXwithStickZoom(this.size);

    for (let res = 1; res <= this.size; res++) {
        if (res === 1 ||
            ((res % 100 === 0) && (200 * this.stickZoom > Polymer.minXDist)) ||
            ((res % 10 === 0) && (20 * this.stickZoom > Polymer.minXDist))
        ) {
            const tx = this.getResXwithStickZoom(res);
            if (this.stickZoom >= 8 || res !== 1) {
                tickAt(this, tx);
            }
            tick = (tick + 1) % ScaleTicksPerLabel;
            // does this one get a label?
            if (tick === 0) { // && tx > 20) {
                if ((tx + Polymer.minXDist) < lastTickX) {
                    scaleLabelAt(this, res, tx);
                }
            }
        }
        if (this.stickZoom >= 8) {
            const seqLabelGroup = document.createElementNS(svgns, "g");
            seqLabelGroup.setAttribute("transform", "translate(" + this.getResXwithStickZoom(res) + " " + 0 + ")");
            const seqLabel = document.createElementNS(svgns, "text");
            seqLabel.setAttribute("font-family", "'Courier New', monospace");
            seqLabel.setAttribute("font-size", "10px");
            seqLabel.setAttribute("text-anchor", "middle");
            seqLabel.setAttribute("x", "0");
            seqLabel.setAttribute("y", "3");
            seqLabel.appendChild(document.createTextNode(this.sequence[res - 1]));
            seqLabelGroup.appendChild(seqLabel);
            this.scaleLabels.push(seqLabel);
            this.ticks.appendChild(seqLabelGroup);
        }
    }
    scaleLabelAt(this, this.size, lastTickX);
    if (this.stickZoom >= 8) {
        tickAt(this, lastTickX);
    }

    function scaleLabelAt(self, text, tickX) {
        const scaleLabelGroup = document.createElementNS(svgns, "g");
        scaleLabelGroup.setAttribute("transform", "translate(" + tickX + " " + 0 + ")");
        const scaleLabel = document.createElementNS(svgns, "text");
        scaleLabel.setAttribute("class", "Polymer xlv_text PolymerLabel");
        scaleLabel.setAttribute("font-family", "'Courier New', monospace");
        scaleLabel.setAttribute("font-size", "14");
        scaleLabel.setAttribute("text-anchor", "middle");
        scaleLabel.setAttribute("x", "0");
        scaleLabel.setAttribute("y", Polymer.STICKHEIGHT + 4);
        scaleLabel.appendChild(document.createTextNode(text));
        scaleLabelGroup.appendChild(scaleLabel);
        self.scaleLabels.push(scaleLabel);
        self.ticks.appendChild(scaleLabelGroup);
    }

    function tickAt(self, tickX) {
        const tick = document.createElementNS(svgns, "line");
        tick.setAttribute("x1", tickX);
        tick.setAttribute("y1", "5");
        tick.setAttribute("x2", tickX);
        tick.setAttribute("y2", "10");
        tick.setAttribute("stroke", "black");
        self.ticks.appendChild(tick);
    }
};

Polymer.prototype.setForm = function (form, svgP) {
    if (this.busy !== true) {
        if (form === 1) {
            if (this.form !== 1) {
                this.toStick();
            }
        } else {
            // if (this.form !== 0) {
            this.toCircle(svgP);
            // var r = this.getBlobRadius();

        }
        // }
    }
};

Polymer.prototype.toCircle = function (svgP) {
    //svgP = null;// temp hack - you can uncomment this is you experience things 'flying off screen'
    this.busy = true;

    // var protLength = this.size * this.stickZoom;
    const r = this.getBlobRadius();
    //
    d3.select(this.background).transition()
        .attr("x", -r).attr("y", -r)
        .attr("width", r * 2).attr("height", r * 2)
        .attr("rx", r).attr("ry", r)
        .duration(Polymer.transitionTime);
    d3.select(this.outline).transition()
        .attr("x", -r).attr("y", -r)
        .attr("width", r * 2).attr("height", r * 2)
        .attr("rx", r).attr("ry", r)
        .duration(Polymer.transitionTime);
    d3.select(this.annotationsSvgGroup).transition()
        .attr("transform", "scale(1, 1)")
        .duration(Polymer.transitionTime);
    d3.select(this.highlight).transition()
        .attr("x", -r).attr("y", -r)
        .attr("width", r * 2).attr("height", r * 2)
        .attr("rx", r).attr("ry", r)
        .duration(Polymer.transitionTime);

    const stickZoomInterpol = d3.interpolate(this.stickZoom, 0);
    // var rotationInterpol = d3.interpolate((this.rotation > 180) ? this.rotation - 360 : this.rotation, 0);
    const labelTransform = d3.transform(this.labelSVG.getAttribute("transform"));
    const labelStartPoint = labelTransform.translate[0];
    const labelTranslateInterpol = d3.interpolate(labelStartPoint, -(r + 5));

    let xInterpol = null,
        yInterpol = null;
    if (typeof svgP !== "undefined" && svgP !== null) {
        xInterpol = d3.interpolate(this.cx, svgP.x);
        yInterpol = d3.interpolate(this.cy, svgP.y);
    }

    const self = this;
    d3.select(this.ticks).transition().attr("opacity", 0).duration(Polymer.transitionTime / 4)
        .each("end",
            function () {
                d3.select(this).selectAll("*").remove();
            }
        );

    d3.select(this.highlight).transition()
        .attr("width", (r * 2) + 5).attr("height", (r * 2) + 5)
        .attr("x", -r - 2.5).attr("y", -r - 2.5)
        .attr("rx", r + 2.5).attr("ry", r + 2.5)
        .duration(Polymer.transitionTime);

    if (this.annotations) {
        const ca = this.annotations.length;
        for (let annotation of this.annotations) {
            if (typeof annotation.seqDatum.uncertainBegin != "undefined") {
                const fuzzyStart = annotation.fuzzyStart;
                d3.select(fuzzyStart).transition().attr("d", this.getAnnotationPieSliceApproximatePath(annotation.seqDatum.uncertainBegin, annotation.seqDatum.begin))
                    .duration(Polymer.transitionTime).each("end",
                    function () {
                        for (let b = 0; b < ca; b++) {
                            const annoB = self.annotations[b];
                            if (this === annoB.fuzzyStart) {
                                d3.select(this).attr("d", self.getAnnotationPieSliceArcPath(annoB.seqDatum.uncertainBegin, annoB.seqDatum.begin));
                            }
                        }
                    }
                );
            }

            // if (anno.begin && anno.end) {
            const certain = annotation.certain;
            d3.select(certain).transition().attr("d", this.getAnnotationPieSliceApproximatePath(annotation.seqDatum.begin, annotation.seqDatum.end))
                .duration(Polymer.transitionTime).each("end",
                function () {
                    for (let annoB of self.annotations){
                        if (this === annoB.certain) {
                            d3.select(this).attr("d", self.getAnnotationPieSliceArcPath(annoB.seqDatum.begin, annoB.seqDatum.end));
                        }
                    }
                }
            );
            // }

            if (typeof annotation.seqDatum.uncertainEnd != "undefined") {
                const fuzzyEnd = annotation.fuzzyEnd;
                d3.select(fuzzyEnd).transition().attr("d", this.getAnnotationPieSliceApproximatePath(annotation.seqDatum.end, annotation.seqDatum.uncertainEnd))
                    .duration(Polymer.transitionTime).each("end",
                    function () {
                        for (let b = 0; b < ca; b++) {
                            const annoB = self.annotations[b];
                            if (this === annoB.fuzzyEnd) {
                                d3.select(this).attr("d", self.getAnnotationPieSliceArcPath(annoB.seqDatum.end, annoB.seqDatum.uncertainEnd));
                            }
                        }
                    }
                );

            }
        }
    }

    const originalStickZoom = this.stickZoom;
    const originalRotation = this.rotation;
    const cubicInOut = d3.ease("cubic-in-out");
    d3.timer(function (elapsed) {
        return update(elapsed / Polymer.transitionTime);
    });

    function update(interp) {
        const labelTransform = d3.transform(self.labelSVG.getAttribute("transform"));
        const k = self.app.svgElement.createSVGMatrix().rotate(labelTransform.rotate).translate(labelTranslateInterpol(cubicInOut(interp)), LABEL_Y); //.scale(z).translate(-c.x, -c.y);
        self.labelSVG.transform.baseVal.initialize(self.app.svgElement.createSVGTransformFromMatrix(k));
        //~
        if (xInterpol !== null) {
            self.setPosition(xInterpol(cubicInOut(interp)), yInterpol(cubicInOut(interp)));
        }

        self.stickZoom = stickZoomInterpol(cubicInOut(interp));
        self.setAllLinkCoordinates();

        if (interp === 1) { // finished - tidy up
            self.form = 0;
            self.checkLinks();
            self.stickZoom = originalStickZoom;
            self.rotation = originalRotation;
            self.busy = false;
            return true;
        } else if (interp > 1) {
            return update(1);
        } else {
            return false;
        }
    }
};

Polymer.prototype.toStick = function () {
    this.busy = true;
    this.form = 1;

    //remove prot-prot links - would it be better if checkLinks did this? - think not
    const c = this.binaryLinks.values().length;
    for (let l = 0; l < c; l++) {
        const link = this.binaryLinks.values()[l];
        //out with the old
        if (link.shown) {
            link.hide();
        }
    }

    const protLength = this.size * this.stickZoom;
    const r = this.getBlobRadius();

    const lengthInterpol = d3.interpolate((2 * r), protLength);
    const stickZoomInterpol = d3.interpolate(0, this.stickZoom);
    const labelTranslateInterpol = d3.interpolate(-(r + 5), -(((this.size / 2) * this.stickZoom) + (this.nTerminusFeature ? 25 : 10)));

    const origStickZoom = this.stickZoom;
    this.stickZoom = 0;
    this.checkLinks(this.binaryLinks);
    this.checkLinks(this.selfLink);
    this.checkLinks(this.sequenceLinks);
    this.stickZoom = origStickZoom;

    d3.select(this.background).transition() //.attr("stroke-opacity", 1)
        .attr("height", Polymer.STICKHEIGHT)
        .attr("y", -Polymer.STICKHEIGHT / 2)
        .attr("rx", 0).attr("ry", 0)
        .duration(Polymer.transitionTime);

    d3.select(this.outline).transition() //.attr("stroke-opacity", 1)
        .attr("height", Polymer.STICKHEIGHT)
        .attr("y", -Polymer.STICKHEIGHT / 2)
        .attr("rx", 0).attr("ry", 0)
        .duration(Polymer.transitionTime);

    d3.select(this.highlight).transition()
        .attr("width", protLength + 5).attr("height", Polymer.STICKHEIGHT + 5)
        .attr("x", this.getResXwithStickZoom(0.5) - 2.5).attr("y", (-Polymer.STICKHEIGHT / 2) - 2.5)
        .attr("rx", 0).attr("ry", 0)
        .duration(Polymer.transitionTime);

    if (this.annotations) {
        const annots = this.annotations;
        const ca = annots.length;
        for (let a = 0; a < ca; a++) {
            const anno = annots[a];
            if (typeof anno.seqDatum.uncertainBegin != "undefined") {
                const fuzzyStart = anno.fuzzyStart;
                fuzzyStart.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin));
                d3.select(fuzzyStart).transition().attr("d", this.getAnnotationRectPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno))
                    .duration(Polymer.transitionTime);
            }
            // if (anno.seqDatum.begin && anno.seqDatum.end) {
            const certain = anno.certain;
            certain.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno.seqDatum.begin, anno.seqDatum.end));
            d3.select(certain).transition().attr("d", this.getAnnotationRectPath(anno.seqDatum.begin, anno.seqDatum.end, anno))
                .duration(Polymer.transitionTime);
            // }
            if (typeof anno.seqDatum.uncertainEnd != "undefined") {
                const fuzzyEnd = anno.fuzzyEnd;
                fuzzyEnd.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno.seqDatum.end, anno.seqDatum.uncertainEnd));
                d3.select(fuzzyEnd).transition().attr("d", this.getAnnotationRectPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno))
                    .duration(Polymer.transitionTime);
            }
        }
    }

    const self = this;
    const cubicInOut = d3.ease("cubic-in-out");
    d3.timer(function (elapsed) {
        return update(elapsed / Polymer.transitionTime);
    });

    function update(interp) {
        const labelTransform = d3.transform(self.labelSVG.getAttribute("transform"));
        const k = self.app.svgElement.createSVGMatrix().rotate(labelTransform.rotate).translate(labelTranslateInterpol(cubicInOut(interp)), LABEL_Y); //.scale(z).translate(-c.x, -c.y);
        self.labelSVG.transform.baseVal.initialize(self.app.svgElement.createSVGTransformFromMatrix(k));

        const currentLength = lengthInterpol(cubicInOut(interp));
        d3.select(self.highlight).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
        d3.select(self.outline).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
        d3.select(self.background).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
        self.stickZoom = stickZoomInterpol(cubicInOut(interp));
        self.setAllLinkCoordinates();

        if (interp === 1) { // finished - tidy up
            self.busy = false;
            return true;
        } else if (interp > 1) {
            return update(1);
        } else {
            return false;
        }
    }

    d3.select(this.ticks).attr("opacity", 0);
    this.setScaleGroup();
    d3.select(this.ticks).transition().attr("opacity", 1)
        .delay(Polymer.transitionTime * 0.8).duration(Polymer.transitionTime / 2);
};


Polymer.prototype.toStickNoTransition = function () {
    this.busy = true;
    this.form = 1;

    //remove prot-prot links - would it be better if checkLinks did this? - think not
    const c = this.binaryLinks.values().length;
    for (let l = 0; l < c; l++) {
        const link = this.binaryLinks.values()[l];
        //out with the old
        if (link.shown) {
            link.hide();
        }
    }

    const protLength = this.size * this.stickZoom;
    const r = this.getBlobRadius();

    const lengthInterpol = d3.interpolate((2 * r), protLength);
    // var stickZoomInterpol = d3.interpolate(0, this.stickZoom);
    // var rotationInterpol = d3.interpolate(0, (this.rotation > 180) ? this.rotation - 360 : this.rotation);
    const labelTranslateInterpol = d3.interpolate(-(r + 5), -(((this.size / 2) * this.stickZoom) + (this.nTerminusFeature ? 25 : 10)));

    // var origStickZoom = this.stickZoom;
    // this.stickZoom = 0;
    this.checkLinks(this.binaryLinks);
    this.checkLinks(this.selfLink);
    this.checkLinks(this.sequenceLinks);
    // this.stickZoom = origStickZoom;

    d3.select(this.background) //.transition() //.attr("stroke-opacity", 1)
        .attr("height", Polymer.STICKHEIGHT)
        .attr("y", -Polymer.STICKHEIGHT / 2)
        .attr("rx", 0).attr("ry", 0);
    //  .duration(Polymer.transitionTime);

    d3.select(this.outline) //.transition() //.attr("stroke-opacity", 1)
        .attr("height", Polymer.STICKHEIGHT)
        .attr("y", -Polymer.STICKHEIGHT / 2)
        .attr("rx", 0).attr("ry", 0);
    //  .duration(Polymer.transitionTime);

    d3.select(this.highlight) //.transition()
        .attr("width", protLength + 5).attr("height", Polymer.STICKHEIGHT + 5)
        .attr("x", this.getResXwithStickZoom(0.5) - 2.5).attr("y", (-Polymer.STICKHEIGHT / 2) - 2.5)
        .attr("rx", 0).attr("ry", 0);
    // .duration(Polymer.transitionTime);

    if (this.annotations) {
        const annots = this.annotations;
        const ca = annots.length;
        for (let a = 0; a < ca; a++) {
            const anno = annots[a];
            if (typeof anno.seqDatum.uncertainBegin != "undefined") {
                const fuzzyStart = anno.fuzzyStart;
                // fuzzyStart.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin));
                d3.select(fuzzyStart).attr("d", this.getAnnotationRectPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno));
                // .duration(Polymer.transitionTime);
            }
            // if (anno.seqDatum.begin && anno.seqDatum.end) {
            const certain = anno.certain;
            certain.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno.seqDatum.begin, anno.seqDatum.end));
            d3.select(certain) /*.transition()*/ .attr("d", this.getAnnotationRectPath(anno.seqDatum.begin, anno.seqDatum.end, anno));
            // .duration(Polymer.transitionTime);
            // }
            if (typeof anno.seqDatum.uncertainEnd != "undefined") {
                const fuzzyEnd = anno.fuzzyEnd;
                // fuzzyEnd.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno.seqDatum.end, anno.seqDatum.uncertainEnd));
                d3.select(fuzzyEnd) /*.transition()*/ .attr("d", this.getAnnotationRectPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno));
                // .duration(Polymer.transitionTime);
            }
        }
    }

    const self = this;
    // var cubicInOut = d3.ease('cubic-in-out');
    // d3.timer(function(elapsed) {
    //     return update(elapsed / Polymer.transitionTime);
    // });

    // update(1)
    //
    // function update(interp) {
    const labelTransform = d3.transform(self.labelSVG.getAttribute("transform"));
    const k = self.app.svgElement.createSVGMatrix().rotate(labelTransform.rotate).translate(labelTranslateInterpol(1), LABEL_Y); //.scale(z).translate(-c.x, -c.y);
    self.labelSVG.transform.baseVal.initialize(self.app.svgElement.createSVGTransformFromMatrix(k));

    const currentLength = lengthInterpol(1);
    d3.select(self.highlight).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
    d3.select(self.outline).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
    d3.select(self.background).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
    // self.stickZoom = stickZoomInterpol(cubicInOut(interp))
    self.setAllLinkCoordinates();

    // if (interp === 1) { // finished - tidy up
    // return true;
    // } else if (interp > 1) {
    //     return update(1);
    // } else {
    //     return false;
    // }
    // }


    //d3.select(this.ticks).attr("opacity", 0);
    this.setScaleGroup();
    d3.select(this.ticks) /*.transition()*/ .attr("opacity", 1);
    //.delay(Polymer.transitionTime * 0.8).duration(Polymer.transitionTime / 2);

    self.busy = false;

};

Polymer.prototype.getResXwithStickZoom = function (r) {
    if (r === "n-n") {
        return (-this.size / 2 * this.stickZoom) - 20;
    } else if (r === "c-c") {
        return (this.size / 2 * this.stickZoom) + 20;
    } else {
        return (r - (this.size / 2)) * this.stickZoom;
    }
};

//calculate the  coordinates of a residue (relative to this.util.container)
Polymer.prototype.getResidueCoordinates = function (r, yOff) {
    if (typeof r === "undefined") {
        alert("Error: residue number is undefined");
    }
    let x = this.getResXwithStickZoom(r * 1) * this.app.z;
    let y;
    if (x !== 0) {
        const l = Math.abs(x);
        const a = Math.acos(x / l);
        const rotRad = (this.rotation / 360) * Math.PI * 2;
        x = l * Math.cos(rotRad + a);
        y = l * Math.sin(rotRad + a);
        if (typeof yOff !== "undefined") {
            x += yOff * this.app.z * Math.cos(rotRad + (Math.PI / 2));
            y += yOff * this.app.z * Math.sin(rotRad + (Math.PI / 2));
        }
    } else {
        y = yOff;
    }
    x += this.cx;
    y += this.cy;
    return [x, y];
};

Polymer.prototype.clearPositionalFeatures = function () {
    this.annotations = [];
    this.annotationTypes = [];
    if (this.annotationsSvgGroup) d3.select(this.annotationsSvgGroup).selectAll("*").remove();
};

Polymer.prototype.setPositionalFeatures = function (posFeats) {
    if (posFeats) {
        const annotationTypesSet = new Set();
        // var y = -Interactor.STICKHEIGHT / 2;
        //draw longest regions first
        posFeats.sort(function (a, b) {
            return (b.end - b.begin) - (a.end - a.begin);
        });
        this.annotations = posFeats;
        if (this.annotations.length === 0) {
            //~ alert("no annot");
            this.annotations.push(new Annotation("No annotations", new Feature(null, 1 + "-" + this.size)));
        }
        for (let i = 0; i < posFeats.length; i++) {
            const anno = posFeats[i];
            if (anno.seqDatum.sequenceDatumString !== "n-n" && anno.seqDatum.sequenceDatumString !== "c-c") {
                annotationTypesSet.add(anno.description);
            }

            anno.fuzzyStart = document.createElementNS(svgns, "path");
            anno.certain = document.createElementNS(svgns, "path");
            anno.fuzzyEnd = document.createElementNS(svgns, "path");

            if (this.form === 0) {
                if (typeof anno.seqDatum.uncertainBegin != "undefined") {
                    anno.fuzzyStart.setAttribute("d", this.getAnnotationPieSliceArcPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin));
                }
                // if (anno.seqDatum.begin && anno.seqDatum.end) {
                anno.certain.setAttribute("d", this.getAnnotationPieSliceArcPath(anno.seqDatum.begin, anno.seqDatum.end));
                // }
                if (typeof anno.seqDatum.uncertainEnd != "undefined") {
                    anno.fuzzyEnd.setAttribute("d", this.getAnnotationPieSliceArcPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd));
                }
            } else {
                if (typeof anno.seqDatum.uncertainBegin != "undefined") {
                    anno.fuzzyStart.setAttribute("d", this.getAnnotationRectPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno));
                }
                // if (anno.seqDatum.begin && anno.seqDatum.end) {
                anno.certain.setAttribute("d", this.getAnnotationRectPath(anno.seqDatum.begin, anno.seqDatum.end, anno));
                // }
                if (typeof anno.seqDatum.uncertainEnd != "undefined") {
                    anno.fuzzyEnd.setAttribute("d", this.getAnnotationRectPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno));
                }
            }
            anno.fuzzyStart.setAttribute("stroke-width", "1");
            anno.fuzzyStart.setAttribute("fill-opacity", "0.6");
            anno.certain.setAttribute("stroke-width", "1");
            anno.certain.setAttribute("fill-opacity", "0.6");
            anno.fuzzyEnd.setAttribute("stroke-width", "1");
            anno.fuzzyEnd.setAttribute("fill-opacity", "0.6");

            const text = anno.description + " [" + (anno.seqDatum ? anno.seqDatum.toString() : anno.seqDatum.begin + " - " + anno.seqDatum.end) + "]";
            anno.fuzzyStart.name = text;
            anno.certain.name = text;
            anno.fuzzyEnd.name = text;
            const self = this;
            const toolTipFunc = function (evt) {
                const el = (evt.target.correspondingUseElement) ? evt.target.correspondingUseElement : evt.target;
                self.app.preventDefaultsAndStopPropagation(evt);
                self.app.setTooltip(el.name, el.getAttribute("fill"));
                self.showHighlight(true);
            };
            anno.fuzzyStart.onmouseover = toolTipFunc;
            anno.certain.onmouseover = toolTipFunc;
            anno.fuzzyEnd.onmouseover = toolTipFunc;
            // if (this.annotationsSvgGroup) { //hack
            if (typeof anno.seqDatum.uncertainBegin != "undefined") {
                this.annotationsSvgGroup.appendChild(anno.fuzzyStart);
            }
            this.annotationsSvgGroup.appendChild(anno.certain);
            if (typeof anno.seqDatum.uncertainEnd != "undefined") {
                this.annotationsSvgGroup.appendChild(anno.fuzzyEnd);
            }
            // }
        }
        this.annotationTypes = Array.from(annotationTypesSet.values());
    }
};

Polymer.stepsInArc = 5;

Polymer.prototype.getAnnotationPieSliceArcPath = function (startRes, endRes) {
    // var startAngle = ((startRes - 1) / this.size) * 360;
    // var endAngle = ((endRes - 1) / this.size) * 360;
    let startAngle, endAngle;
    if (startRes === "n-n") {
        startAngle = -20; //((startRes - 1) / this.size) * 360;
        endAngle = ((endRes - 1) / this.size) * 360;
    } else if (endRes === "c-c") {
        startAngle = ((startRes - 1) / this.size) * 360;
        endAngle = +20; //((endRes) / this.size) * 360;
    } else {
        startAngle = ((startRes - 1) / this.size) * 360;
        endAngle = ((endRes - 1) / this.size) * 360;
    }
    const radius = this.getBlobRadius() - 2;
    const arcStart = trig(radius, startAngle - 90);
    const arcEnd = trig(radius, endAngle - 90);
    let largeArch = 0;
    if ((endAngle - startAngle) > 180 || (endAngle === startAngle)) {
        largeArch = 1;
    }
    return "M0,0 L" + arcStart.x + "," + arcStart.y + " A" + radius + "," +
        radius + " 0 " + largeArch + " 1 " + arcEnd.x + "," + arcEnd.y + " Z";
};

Polymer.prototype.getAnnotationPieSliceApproximatePath = function (startRes, endRes) {
    //approximate pie slice
    let startAngle, endAngle;
    if (startRes === "n-n") {
        startAngle = -20; //((startRes - 1) / this.size) * 360;
        endAngle = ((endRes) / this.size) * 360;
    } else if (endRes === "c-c") {
        startAngle = ((startRes - 1) / this.size) * 360;
        endAngle = +20; //((endRes) / this.size) * 360;
    } else {
        startAngle = ((startRes - 1) / this.size) * 360;
        endAngle = ((endRes) / this.size) * 360;
    }
    const pieRadius = this.getBlobRadius() - 2;
    // var arcStart = Interactor.trig(pieRadius, startAngle - 90);
    // var arcEnd = Interactor.trig(pieRadius, endAngle - 90);
    let approximatePiePath = "M 0,0";
    const stepsInArc = 5;
    for (let sia = 0; sia <= Polymer.stepsInArc; sia++) {
        const angle = startAngle + ((endAngle - startAngle) * (sia / stepsInArc));
        const siaCoord = trig(pieRadius, angle - 90);
        approximatePiePath += " L " + siaCoord.x + "," + siaCoord.y;
    }
    approximatePiePath += " L " + 0 + "," + 0;
    approximatePiePath += "  Z";
    return approximatePiePath;
};

Polymer.prototype.getAnnotationRectPath = function (startRes, endRes, annotation) {
    //domain as rectangle path
    let top, bottom, rungHeight;
    const rung = this.annotationTypes.indexOf(annotation.description);
    if (rung === -1) {
        bottom = Polymer.STICKHEIGHT / 2;
        top = -Polymer.STICKHEIGHT / 2;
    } else {
        rungHeight = Polymer.STICKHEIGHT / this.annotationTypes.length;
        top = (-Polymer.STICKHEIGHT / 2) + (rung * rungHeight); // todo - looks like top and bottom wrong way round?
        bottom = top + rungHeight;
    }

    let annotX, annotSize, annotLength;
    if (startRes === "n-n") {
        annotX = this.getResXwithStickZoom(0 - 0.5) - 20;
        // var annotSize = (1 + (endRes - startRes));
        annotLength = 20;//annotSize * this.stickZoom;
    } else if (endRes === "c-c") {
        annotX = this.getResXwithStickZoom(startRes - 0 + 0.5);
        // var annotSize = (1 + (endRes - startRes));
        annotLength = 20;//annotSize * this.stickZoom;
    } else {
        annotX = this.getResXwithStickZoom(startRes - 0.5); // todo - look out for positions being strings
        annotSize = (1 + (endRes - startRes));
        annotLength = annotSize * this.stickZoom;
    }
    let rectPath = "M " + annotX + "," + bottom;
    for (let sia = 0; sia <= Polymer.stepsInArc; sia++) {
        const step = annotX + (annotLength * (sia / Polymer.stepsInArc));
        rectPath += " L " + step + "," + top;
    }
    rectPath += " L " + (annotX + annotLength) + "," + bottom +
        " Z";
    return rectPath;
};