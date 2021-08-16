export class Annotation {
    constructor(annotationName, seqDatum) {
        // console.log("**", annotationName, seqDatum);
        this.description = annotationName.trim();
        this.seqDatum = seqDatum;
    }

    toString() {
        return this.description + " ["
            + (this.seqDatum ? this.seqDatum.toString() : this.seqDatum.begin + " - " + this.seqDatum.end)
            + "]";
    }
}