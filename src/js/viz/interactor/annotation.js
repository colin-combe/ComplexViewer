//constructor for annotations
export function Annotation(annotationName, seqDatum) {
    // console.log("**", annotationName, seqDatum);
    this.description = annotationName.trim();
    this.seqDatum = seqDatum;
}

Annotation.prototype.toString = function () {
    return this.description + " [" + (this.seqDatum ? this.seqDatum.toString() : this.seqDatum.begin + " - " + this.seqDatum.end) + "]";
};