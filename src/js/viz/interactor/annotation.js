//    xiNET Interaction Viewer
//    Copyright 2013 Rappsilber Laboratory
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//    author: Colin Combe

//constructor for annotations
export function Annotation(annotationName, seqDatum) {
    this.description = annotationName.trim();
    this.seqDatum = seqDatum;
}
