//constructor for annotations
export function Annotation(annotationName, seqDatum) {
    this.description = annotationName.trim();
    this.seqDatum = seqDatum;
}
