//constructor for annotations
export function Annotation(annotationName, seqDatum) {
    // console.log("**", annotationName, seqDatum);
    this.description = annotationName.trim();
    this.seqDatum = seqDatum;
}
