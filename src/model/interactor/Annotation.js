//    xiNET Interaction Viewer
//    Copyright 2013 Rappsilber Laboratory
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//    author: Colin Combe

"use strict";

//constructor for annotations
function Annotation(annotName, startRes, endRes, colour, notes) {
    this.description = annotName.trim();
    this.begin= +startRes;
    this.end = +endRes;
    this.uncertainBegin = +startRes;
    this.uncertainEnd = +endRes;
    if (colour !== undefined && colour !== null) {
        this.colour = colour;
    }
    //~ this.description = notes;
}

Annotation.prototype.initFromSeqDatum = function(seqDatum) {
    // obviously, some of this could be tidied up...
    this.begin= +seqDatum.begin;
    this.end = +seqDatum.end;
    this.uncertainBegin = +seqDatum.uncertainBegin;
    this.uncertainEnd = +seqDatum.uncertainEnd;
    this.seqDatum = seqDatum;
}

module.exports = Annotation;
