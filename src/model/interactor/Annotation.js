//    xiNET Interaction Viewer
//    Copyright 2013 Rappsilber Laboratory
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//    author: Colin Combe

"use strict";

//constructor for annotations
function Annotation(annotName, seqDatum) {
    this.description = annotName.trim();
    this.seqDatum = seqDatum;
}

module.exports = Annotation;
