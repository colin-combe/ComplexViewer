import * as d3 from "d3"; // transitions and other stuff
import {Interactor, trig} from "./interactor";
import {Annotation} from "./annotation";
import {SequenceDatum} from "../sequence-datum";
import {svgns, LABEL_Y, rotatePointAboutPoint} from "../../config";

Polymer.STICKHEIGHT = 20; //height of stick in pixels
Polymer.MAXSIZE = 0; // residue count of longest sequence
Polymer.transitionTime = 650;

export function Polymer() {
}

Polymer.prototype = new Interactor();

Polymer.prototype.getSymbolRadius = function () {
    return 15;
};

Polymer.prototype.showHighlight = function (show) {
    this.highlight.setAttribute("stroke-opacity", show ? "1" : "0");
};

Polymer.minXDist = 30;
Polymer.prototype.setStickScale = function (scale, svgP) {
    const oldScale = this.stickZoom;

    //dist from centre
    const dx = (this.ix - svgP.x);
    const dy = (this.iy - svgP.y);

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
    const x = this.ix + rx;
    const y = this.iy + ry;

    this.stickZoom = scale;
    this.scale();
    this.setPosition(x, y);
    this.setAllLinkCoordinates();
};

Polymer.prototype.scale = function () {
    const protLength = (this.size) * this.stickZoom;
    if (this.expanded) {
        const labelTransform = d3.transform(this.labelSVG.getAttribute("transform"));
        const k = this.app.svgElement.createSVGMatrix().rotate(labelTransform.rotate)
            .translate((-(((this.size / 2) * this.stickZoom) + (this.nTerminusFeature ? 25 : 10))), LABEL_Y); //.scale(z).translate(-c.x, -c.y);
        this.labelSVG.transform.baseVal.initialize(this.app.svgElement.createSVGTransformFromMatrix(k));
        this.updateAnnotationRectanglesNoTransition();

        d3.select(this.background)
            .attr("width", protLength)
            .attr("x", this.getResXWithStickZoom(0.5));

        d3.select(this.outline)
            .attr("width", protLength)
            .attr("x", this.getResXWithStickZoom(0.5));

        d3.select(this.highlight)
            .attr("width", protLength + 5)
            .attr("x", this.getResXWithStickZoom(0.5) - 2.5);

        this.setScaleGroup();
    }
};

Polymer.prototype.setScaleGroup = function () {
    this.upperGroup.appendChild(this.ticks); //will do nothing if this.ticks already appended to this.uppergroup
    this.ticks.textContent = "";
    this.scaleLabels = [];
    const ScaleTicksPerLabel = 2;
    let tick = -1;
    const lastTickX = this.getResXWithStickZoom(this.size);
    for (let res = 1; res <= this.size; res++) {
        if (res === 1 ||
            ((res % 100 === 0) && (200 * this.stickZoom > Polymer.minXDist)) ||
            ((res % 10 === 0) && (20 * this.stickZoom > Polymer.minXDist))
        ) {
            const tx = this.getResXWithStickZoom(res);
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
            seqLabelGroup.setAttribute("transform", "translate(" + this.getResXWithStickZoom(res) + " " + 0 + ")");
            const seqLabel = document.createElementNS(svgns, "text");
            seqLabel.classList.add("label", "sequence");
            //css?
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
        scaleLabel.classList.add("label", "scale-label");
        scaleLabel.setAttribute("x", "0");
        scaleLabel.setAttribute("y", Polymer.STICKHEIGHT + 4);
        scaleLabel.appendChild(document.createTextNode(text));
        scaleLabelGroup.appendChild(scaleLabel);
        self.scaleLabels.push(scaleLabel);
        self.ticks.appendChild(scaleLabelGroup);
    }

    function tickAt(self, tickX) {
        const tick = document.createElementNS(svgns, "line");
        tick.classList.add("tick");
        tick.setAttribute("x1", tickX);
        tick.setAttribute("y1", "5");
        tick.setAttribute("x2", tickX);
        tick.setAttribute("y2", "10");
        self.ticks.appendChild(tick);
    }
};

Polymer.prototype.setForm = function (form, svgP) {
    if (this.busy !== true) {
        if (form === 1) {
            this.toStick();
        } else {
            this.toCircle(svgP);
        }
    }
};

Polymer.prototype.toCircle = function (svgP) {
    //svgP = null;// temp hack - you can uncomment this is you experience things 'flying off screen'
    this.busy = true;

    const r = this.getSymbolRadius();
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
    d3.select(this.highlight).transition()
        .attr("width", (r * 2) + 5).attr("height", (r * 2) + 5)
        .attr("x", -r - 2.5).attr("y", -r - 2.5)
        .attr("rx", r + 2.5).attr("ry", r + 2.5)
        .duration(Polymer.transitionTime);

    const stickZoomInterpol = d3.interpolate(this.stickZoom, 0);
    // var rotationInterpol = d3.interpolate((this.rotation > 180) ? this.rotation - 360 : this.rotation, 0);
    const labelTransform = d3.transform(this.labelSVG.getAttribute("transform"));
    const labelStartPoint = labelTransform.translate[0];
    const labelTranslateInterpol = d3.interpolate(labelStartPoint, -(r + 5));

    let xInterpol = null,
        yInterpol = null;
    if (typeof svgP !== "undefined" && svgP !== null) {
        xInterpol = d3.interpolate(this.ix, svgP.x);
        yInterpol = d3.interpolate(this.iy, svgP.y);
    }

    const self = this;
    d3.select(this.ticks).transition().attr("opacity", 0).duration(Polymer.transitionTime / 4)
        .each("end",
            function () {
                d3.select(this).selectAll("*").remove();
            }
        );

    for (let [annotationType, annotations] of this.annotationSets) {
        if (this.app.annotationSetsShown.get(annotationType) === true) {
            for (let anno of annotations) {
                if (anno.fuzzyStart) {
                    const fuzzyStart = anno.fuzzyStart;
                    d3.select(fuzzyStart).transition().attr("d", this.getAnnotationPieSlicePath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno, false))
                        .duration(Polymer.transitionTime);
                }

                if (anno.certain) {
                    const certain = anno.certain;
                    d3.select(certain).transition().attr("d", this.getAnnotationPieSlicePath(anno.seqDatum.begin, anno.seqDatum.end, anno, false))
                        .duration(Polymer.transitionTime);
                }

                if (anno.fuzzyEnd) {
                    const fuzzyEnd = anno.fuzzyEnd;
                    d3.select(fuzzyEnd).transition().attr("d", this.getAnnotationPieSlicePath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno, false))
                        .duration(Polymer.transitionTime);
                }
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
            self.expanded = false;
            self.checkLinks();

            for (let [annotationType, annotations] of self.annotationSets) {
                if (self.app.annotationSetsShown.get(annotationType) === true) {
                    for (let anno of annotations) {
                        if (anno.fuzzyStart) {
                            const fuzzyStart = anno.fuzzyStart;
                            d3.select(fuzzyStart).attr("d", self.getAnnotationPieSlicePath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno));
                        }

                        if (anno.certain) {
                            const certain = anno.certain;
                            d3.select(certain).attr("d", self.getAnnotationPieSlicePath(anno.seqDatum.begin, anno.seqDatum.end, anno));
                        }

                        if (anno.fuzzyEnd) {
                            const fuzzyEnd = anno.fuzzyEnd;
                            d3.select(fuzzyEnd).attr("d", self.getAnnotationPieSlicePath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno));
                        }
                    }
                }
            }

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
    this.expanded = true;

    const protLength = this.size * this.stickZoom;
    const r = this.getSymbolRadius();

    //d3.interpolate paths, update them along with everything else

    const lengthInterpol = d3.interpolate((2 * r), protLength);
    const stickZoomInterpol = d3.interpolate(0, this.stickZoom);
    const labelTranslateInterpol = d3.interpolate(-(r + 5), -(((this.size / 2) * this.stickZoom) + (this.nTerminusFeature ? 25 : 10)));

    const origStickZoom = this.stickZoom;
    this.stickZoom = 0;
    this.checkLinks();
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
        .attr("x", this.getResXWithStickZoom(0.5) - 2.5).attr("y", (-Polymer.STICKHEIGHT / 2) - 2.5)
        .attr("rx", 0).attr("ry", 0)
        .duration(Polymer.transitionTime);

    for (let [annotationType, annotations] of this.annotationSets) {
        if (this.app.annotationSetsShown.get(annotationType) === true) {
            for (let anno of annotations) {
                if (anno.fuzzyStart) {
                    const fuzzyStart = anno.fuzzyStart;
                    fuzzyStart.setAttribute("d", this.getAnnotationPieSlicePath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno, false));
                    d3.select(fuzzyStart).transition().attr("d", this.getAnnotationRectPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno))
                        .duration(Polymer.transitionTime);
                }
                if (anno.certain) {
                    const certain = anno.certain;
                    let tempBegin = anno.seqDatum.begin; //todo - might be better to have seperate att in SequenceData for end of uncertain start
                    let tempEnd = anno.seqDatum.end;
                    if (anno.seqDatum.uncertainBegin) {
                        tempBegin += 1;
                    }
                    if (anno.seqDatum.uncertainEnd) {
                        tempEnd -= 1;
                    }

                    certain.setAttribute("d", this.getAnnotationPieSlicePath(tempBegin, tempEnd, anno, false));
                    d3.select(certain).transition().attr("d", this.getAnnotationRectPath(tempBegin, tempEnd, anno))
                        .duration(Polymer.transitionTime);
                }
                if (anno.fuzzyEnd) {
                    const fuzzyEnd = anno.fuzzyEnd;
                    fuzzyEnd.setAttribute("d", this.getAnnotationPieSlicePath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno, false));
                    d3.select(fuzzyEnd).transition().attr("d", this.getAnnotationRectPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno))
                        .duration(Polymer.transitionTime);
                }
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
            self.updateAnnotationRectanglesNoTransition();
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
    this.expanded = true;

    const protLength = this.size * this.stickZoom;
    const r = this.getSymbolRadius();

    const lengthInterpol = d3.interpolate((2 * r), protLength);
    const labelTranslateInterpol = d3.interpolate(-(r + 5), -(((this.size / 2) * this.stickZoom) + (this.nTerminusFeature ? 25 : 10)));

    this.checkLinks();

    d3.select(this.background)
        .attr("height", Polymer.STICKHEIGHT)
        .attr("y", -Polymer.STICKHEIGHT / 2)
        .attr("rx", 0).attr("ry", 0);

    d3.select(this.outline)
        .attr("height", Polymer.STICKHEIGHT)
        .attr("y", -Polymer.STICKHEIGHT / 2)
        .attr("rx", 0).attr("ry", 0);

    d3.select(this.highlight)
        .attr("width", protLength + 5).attr("height", Polymer.STICKHEIGHT + 5)
        .attr("x", this.getResXWithStickZoom(0.5) - 2.5).attr("y", (-Polymer.STICKHEIGHT / 2) - 2.5)
        .attr("rx", 0).attr("ry", 0);


    const self = this;

    self.updateAnnotationRectanglesNoTransition();

    const labelTransform = d3.transform(self.labelSVG.getAttribute("transform"));
    const k = self.app.svgElement.createSVGMatrix().rotate(labelTransform.rotate).translate(labelTranslateInterpol(1), LABEL_Y); //.scale(z).translate(-c.x, -c.y);
    self.labelSVG.transform.baseVal.initialize(self.app.svgElement.createSVGTransformFromMatrix(k));

    const currentLength = lengthInterpol(1);
    d3.select(self.highlight).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
    d3.select(self.outline).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
    d3.select(self.background).attr("width", currentLength).attr("x", -(currentLength / 2) + (0.5 * self.stickZoom));
    self.setAllLinkCoordinates();

    this.setScaleGroup();
    d3.select(this.ticks).attr("opacity", 1);

    self.busy = false;
};

Polymer.prototype.updateAnnotationRectanglesNoTransition = function () {
    for (let [annotationType, annotations] of this.annotationSets) {
        if (this.app.annotationSetsShown.get(annotationType) === true) {
            for (let anno of annotations) {
                if (anno.fuzzyStart) {
                    const fuzzyStart = anno.fuzzyStart;
                    d3.select(fuzzyStart).attr("d", this.getAnnotationRectPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno));
                }
                if (anno.certain) {
                    let tempBegin = anno.seqDatum.begin; //todo - might be better to have seperate att in SequenceData for end of uncertain start
                    let tempEnd = anno.seqDatum.end;
                    if (anno.seqDatum.uncertainBegin) {
                        tempBegin += 1;
                    }
                    if (anno.seqDatum.uncertainEnd) {
                        tempEnd -= 1;
                    }
                    anno.certain.setAttribute("d", this.getAnnotationRectPath(tempBegin, tempEnd, anno));
                }
                if (anno.fuzzyEnd) {
                    const fuzzyEnd = anno.fuzzyEnd;
                    d3.select(fuzzyEnd) /*.transition()*/ .attr("d", this.getAnnotationRectPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno));
                }
            }
        }
    }
};

Polymer.prototype.getResXWithStickZoom = function (r) {
    // if (isNaN(r)) {
    //     console.error("NOT NUMBER");
    // }
    if (r === "n-n") {
        return (-this.size / 2 * this.stickZoom) - 20;
    } else if (r === "c-c") {
        return (this.size / 2 * this.stickZoom) + 20;
    } else {
        return (r - (this.size / 2)) * this.stickZoom;
    }
};

//calculate the coordinates of a residue (relative to this.app.container)
Polymer.prototype.getResidueCoordinates = function (r, yOff) {
    if (typeof r === "undefined") {
        console.error("ERROR: residue number is undefined");
    }
    let x = this.getResXWithStickZoom(r * 1);// * this.app.z;
    // console.log("***", this.app.z);
    // coz prots don't scale, don't multiple by app.z
    let y;
    if (x !== 0) {
        const l = Math.abs(x);
        const a = Math.acos(x / l);
        const rotRad = (this.rotation / 360) * Math.PI * 2;
        x = l * Math.cos(rotRad + a);
        y = l * Math.sin(rotRad + a);
        if (typeof yOff !== "undefined") {
            x += yOff /** this.app.z*/ * Math.cos(rotRad + (Math.PI / 2));
            y += yOff /** this.app.z*/ * Math.sin(rotRad + (Math.PI / 2));
        }
    } else {
        y = yOff;
    }
    x += this.ix;
    y += this.iy;
    return [x, y];
};

Polymer.prototype.clearPositionalFeatures = function () {
    this.annotations = [];
    this.annotationTypes = [];
    this.annotationsSvgGroup.textContent = "";
};

Polymer.prototype.updatePositionalFeatures = function () {
    const self = this;

    const toolTipFunc = function (evt) {
        const el = (evt.target.correspondingUseElement) ? evt.target.correspondingUseElement : evt.target;
        self.app.preventDefaultsAndStopPropagation(evt);
        self.app.setTooltip(el.name, el.getAttribute("fill"));
        self.showHighlight(true);
    };

    let r = -1;
    const rungs = [];

    function overlaps(rungArr, anno) {
        for (let earlierAnno of rungArr) {
            if (earlierAnno.seqDatum.overlaps(anno.seqDatum)) {
                return true;
            }
        }
        return false;
    }

    for (let [annotationType, annotations] of this.annotationSets) {
        if (this.app.annotationSetsShown.get(annotationType) === true) {
            if (annotations && annotations.length > 0) {
                r++;
                rungs[r] = [];
            }
            const dupCheck = new Set();
            //need to sort by description
            const sortedAnnos = Array.from(annotations.values()).sort(function (a, b) {
                const nameA = a.description;
                const nameB = b.description;
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }
                // names must be equal
                return 0;
            });
            for (let anno of sortedAnnos) {
                if (!dupCheck.has(anno.toString())) {
                    dupCheck.add(anno.toString());
                    if (anno.seqDatum.sequenceDatumString === "n-n" || anno.seqDatum.sequenceDatumString === "c-c") {
                        anno.rung = -1;
                    } else {
                        let rung = rungs[r];
                        if (overlaps(rung, anno)) {
                            r++;
                            rungs[r] = [];
                            rung = rungs[r];
                        }
                        anno.rung = r;
                        rung.push(anno);
                    }
                }
            }
        }
    }
    this.rungCount = r + 1;

    for (let [annotationType, annotations] of this.annotationSets) {
        if (this.app.annotationSetsShown.get(annotationType) === true) {
            const dupCheck = new Set();
            for (let anno of annotations.values()) {
                if (!dupCheck.has(anno.toString())) {
                    dupCheck.add(anno.toString());
                    let text = anno.toString();
                    if (anno.seqDatum.uncertainBegin) {
                        anno.fuzzyStart = document.createElementNS(svgns, "path");
                        if (!this.expanded) {
                            anno.fuzzyStart.setAttribute("d", this.getAnnotationPieSlicePath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno));
                        } else {
                            anno.fuzzyStart.setAttribute("d", this.getAnnotationRectPath(anno.seqDatum.uncertainBegin, anno.seqDatum.begin, anno));
                        }
                        anno.fuzzyStart.setAttribute("stroke-width", "1"); // todo - should be css
                        anno.fuzzyStart.setAttribute("fill-opacity", "0.6");
                        anno.fuzzyStart.name = text;
                        anno.fuzzyStart.onmouseover = toolTipFunc;
                        this.annotationsSvgGroup.appendChild(anno.fuzzyStart);
                    }

                    if (anno.seqDatum.begin && anno.seqDatum.end) {
                        anno.certain = document.createElementNS(svgns, "path");
                        let tempBegin = anno.seqDatum.begin; //todo - might be better to have seperate att in SequenceData for end of uncertain start
                        let tempEnd = anno.seqDatum.end;
                        if (anno.seqDatum.uncertainBegin) {
                            tempBegin += 1;
                        }
                        if (anno.seqDatum.uncertainEnd) {
                            tempEnd -= 1;
                        }
                        if (!this.expanded) {
                            anno.certain.setAttribute("d", this.getAnnotationPieSlicePath(tempBegin, tempEnd, anno));
                        } else {
                            anno.certain.setAttribute("d", this.getAnnotationRectPath(tempBegin, tempEnd, anno));
                        }
                        anno.certain.setAttribute("stroke-width", "1");
                        // anno.certain.setAttribute("fill-opacity", "0.6");
                        anno.certain.name = text;
                        anno.certain.onmouseover = toolTipFunc;
                        this.annotationsSvgGroup.appendChild(anno.certain);
                    }
                    if (anno.seqDatum.uncertainEnd) {
                        anno.fuzzyEnd = document.createElementNS(svgns, "path");
                        if (!this.expanded) {
                            anno.fuzzyEnd.setAttribute("d", this.getAnnotationPieSlicePath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno));
                        } else {
                            anno.fuzzyEnd.setAttribute("d", this.getAnnotationRectPath(anno.seqDatum.end, anno.seqDatum.uncertainEnd, anno));
                        }
                        anno.fuzzyEnd.setAttribute("stroke-width", "1");
                        anno.fuzzyEnd.setAttribute("fill-opacity", "0.6");
                        anno.fuzzyEnd.name = text;
                        anno.fuzzyEnd.onmouseover = toolTipFunc;
                        this.annotationsSvgGroup.appendChild(anno.fuzzyEnd);
                    }
                }
            }
        }
    }
};

Polymer.stepsInArc = 5;

Polymer.prototype.getAnnotationPieSlicePath = function (startRes, endRes, annotation, arc = true) {
    const radius = this.getSymbolRadius();
    let top, bottom, rungHeight;
    const rung = annotation.rung;
    if (rung === -1) {
        bottom = 0;
        top = radius;
    } else {
        rungHeight = radius / this.rungCount;
        bottom = (rung * rungHeight);
        top = bottom + rungHeight;
    }

    let startAngle, endAngle;
    if (startRes === "n-n") {
        startAngle = -20;
        endAngle = 0;
    } else if (endRes === "c-c") {
        startAngle = 0;
        endAngle = +20;
    } else {
        startAngle = ((startRes - 1) / this.size) * 360;
        endAngle = ((endRes - 1) / this.size) * 360;
    }

    let largeArch = 0;
    if ((endAngle - startAngle) > 180 || (endAngle === startAngle)) {
        largeArch = 1;
    }

    const p1 = rotatePointAboutPoint([0, bottom], [0, 0], startAngle - 180);
    const p2 = rotatePointAboutPoint([0, top], [0, 0], startAngle - 180);
    const p3 = rotatePointAboutPoint([0, top], [0, 0], endAngle - 180);
    const p4 = rotatePointAboutPoint([0, bottom], [0, 0], endAngle - 180);

    //'left' edge
    let path = "M" + p1[0] + "," + p1[1] + " L" + p2[0] + "," + p2[1];

    //top edge
    if (arc) {
        path += " A" + top + "," + top + " 0 " + largeArch + " 1 " + p3[0] + "," + p3[1];
    } else {
        //path += " L" + p3[0] + "," + p3[1];
        for (let sia = 0; sia <= Polymer.stepsInArc; sia++) {
            const angle = startAngle + ((endAngle - startAngle) / Polymer.stepsInArc) * sia;
            const p = rotatePointAboutPoint([0, top], [0, 0], angle - 180);
            path += " L" + p[0] + "," + p[1];
        }
    }

    //bottom edge
    if (arc) {
        //'right' edge
        path += " L" + p4[0] + "," + p4[1];
        //bottom edge
        path += " A" + bottom + "," + bottom + " 0 " + largeArch + " 0 " + p1[0] + "," + p1[1];
    } else {
        // path += " L" + p1[0] + "," + p1[1];
        //bottom edge
        for (let sia = Polymer.stepsInArc; sia >= 0; sia--) {
            const angle = startAngle + ((endAngle - startAngle) / Polymer.stepsInArc) * sia;
            const p = rotatePointAboutPoint([0, bottom], [0, 0], angle - 180);
            path += " L" + p[0] + "," + p[1];
        }
    }

    //close
    path += " Z";

    return path;
};

Polymer.prototype.getAnnotationRectPath = function (startRes, endRes, annotation) {
    //domain as rectangle path
    let top, bottom, rungHeight;
    const rung = annotation.rung;
    if (rung === -1) {
        bottom = Polymer.STICKHEIGHT / 2;
        top = -Polymer.STICKHEIGHT / 2;
    } else {
        rungHeight = Polymer.STICKHEIGHT / this.rungCount;//annotationTypes.length;
        top = (-Polymer.STICKHEIGHT / 2) + (rung * rungHeight);
        bottom = top + rungHeight;
    }
    let annoX, annoSize, annoLength;
    if (startRes === "n-n") {
        annoX = this.getResXWithStickZoom(0.5) - 20;
        annoLength = 20;
    } else if (endRes === "c-c") {
        annoX = this.getResXWithStickZoom(this.size + 0.5);
        annoLength = 20;
    } else {
        annoX = this.getResXWithStickZoom(startRes - 0.5);
        annoSize = (1 + (endRes - startRes));
        annoLength = annoSize * this.stickZoom;
    }

    //'left' edge
    let path = "M" + annoX + "," + bottom + " L" + annoX + "," + top;
    //top edge
    for (let sia = 0; sia <= Polymer.stepsInArc; sia++) {
        const step = annoX + (annoLength * (sia / Polymer.stepsInArc));
        path += " L " + step + "," + top;
    }
    //'right' edge - no need
    // bottom edge
    for (let sia = Polymer.stepsInArc; sia >= 0; sia--) {
        const step = annoX + (annoLength * (sia / Polymer.stepsInArc));
        path += " L " + step + "," + bottom;
    }
    //close
    path += " Z";

    return path;
};