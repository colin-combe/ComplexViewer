/* constructor parameter sequenceDatumString is string with following format:
 *
 *              "?-?" = unknown
 *              "n-n" = n-terminal range (to be represented as link to box beside n terminal)
 *              "c-c" = c-terminal range (to be represented as link to box beside c terminal)
 *              "123-123" = specific residue
 *              "123-456" = feature sequence
 *              "86..123-456..464" = feature sequence with uncertain boundaries
 *              "86..123-456" = feature sequence with one uncertain boundary
 *              "<8-123" = feature sequence w uncertain start between 1 and 8 to 123
 *              "123->256" = feature sequence w uncertain end between 256 and interactor.sequence.length
 */

export class XmlFeatureRange {
    constructor(participant, featureRange) {
        this.participant = participant;
        this.sequenceDatumString = JSON.stringify(featureRange);//sequenceDatumString.trim();
        // console.log("XmlSequenceDatum", this.sequenceDatumString);

        // <mif:featureRange xmlns:mif="http://psi.hupo.org/mi/mif300">
        //     <mif:startStatus>{1,1}</mif:startStatus>
        //     <mif:begin position="">{1,1}</mif:begin>
        //     <mif:beginInterval begin="" end="">{1,1}</mif:beginInterval>
        //     <mif:endStatus>{1,1}</mif:endStatus>
        //     <mif:end position="">{1,1}</mif:end>
        //     <mif:endInterval begin="" end="">{1,1}</mif:endInterval>
        //     <mif:isLink>{0,1}</mif:isLink>
        //     <mif:resultingSequence>{0,1}</mif:resultingSequence>
        //     <mif:participantRef>{0,1}</mif:participantRef>
        // </mif:featureRange>

        const startStatus = featureRange.startStatus.xref.primaryRef._id;
        const startSTatusName = featureRange.startStatus.names.shortLabel;
        const endStatus = featureRange.endStatus.xref.primaryRef._id;
        const endStatusName = featureRange.endStatus.names.shortLabel;
        const begin = featureRange.begin?._position;
        const end = featureRange.end?._position;
        const beginIntervalBegin = featureRange.beginInterval?._begin;
        const beginIntervalEnd = featureRange.beginInterval?._end;
        const endIntervalBegin = featureRange.endInterval?._begin;
        const endIntervalEnd = featureRange.endInterval?._end;

        console.log("startStatus", startStatus, startSTatusName,
            "endStatus", endStatus, endStatusName,
            "begin", begin,
            "end", end,
            "beginIntervalBegin", beginIntervalBegin, "beginIntervalEnd", beginIntervalEnd,
            "endIntervalBegin", endIntervalBegin, "endIntervalEnd", endIntervalEnd);


        // this.begin = begin ? parseInt(begin) : null;
        // this.end = end ? parseInt(end) : null;
        // if (beginIntervalBegin && beginIntervalEnd) {
        //     this.uncertainBegin = parseInt(beginIntervalBegin);
        //     this.begin = parseInt(beginIntervalEnd);
        // }
        // if (endIntervalBegin && endIntervalEnd) {
        //     this.end = parseInt(endIntervalBegin);
        //     this.uncertainEnd = parseInt(endIntervalEnd);
        // }


        // function tidyPosition(pos) {
        //     if (parseInt(pos)) return parseInt(pos);
        //     else return pos;
        // }
        //
        if (!begin && !end && !beginIntervalBegin && !beginIntervalEnd && !endIntervalBegin && !endIntervalEnd ) {//(this.sequenceDatumString === "?-?") {
            if (startStatus === "MI:1040") { //n-term range
                this.uncertainBegin = "n-n";
                this.sequenceDatumString = "n-n";
            }
            else if (startStatus === "MI:1039") { //c-term range
                this.uncertainEnd = "c-c";
                this.sequenceDatumString = "c-c";
            }
            else {
                this.end = 1;
                this.uncertainEnd = participant.size ? participant.size : 1;
            }
        } else {
            this.begin = begin ? parseInt(begin) : null;
            this.end = end ? parseInt(end) : null;
            if (beginIntervalBegin && beginIntervalEnd) {
                this.uncertainBegin = parseInt(beginIntervalBegin);
                this.begin = parseInt(beginIntervalEnd);
            }
            if (endIntervalBegin && endIntervalEnd) {
                this.end = parseInt(endIntervalBegin);
                this.uncertainEnd = parseInt(endIntervalEnd);
            }
            if (startStatus === "MI:1040" && endStatus === "MI:0335") { //n-term range
                this.uncertainBegin = 1;
                this.begin = this.end;
                this.end = null;
            }
            if (startStatus === "MI:0335" && endStatus === "MI:1039") { //c-term range
                this.end = this.begin;
                this.begin = null;
                this.uncertainEnd = participant.size ? participant.size : 1;
            }
        }
            //     //this.begin = 1;
        //     this.end = 1; //todo - having it at beginning is affecting shape of line, look at why
        //     this.uncertainEnd = participant.size ? participant.size : 1;
        // // } else
        // if (startStatus === "MI:1040") { //n-term range
        //     alert();
        //     this.uncertainBegin = "n-n";
        //     this.sequenceDatumString = "n-n";
        // }
        // } else if (this.sequenceDatumString === "c-c") {
        //     this.uncertainEnd = "c-c";
        // } else {
        //     const dashPosition = sequenceDatumString.indexOf("-");
        //     const firstPart = sequenceDatumString.substring(0, dashPosition);
        //     const secondPart = sequenceDatumString.substring(dashPosition + 1);
        //
        //     if (firstPart == '?') {
        //         this.uncertainBegin = 1;
        //         this.begin = tidyPosition(secondPart);
        //         this.end = null;
        //     } else if (secondPart == '?') {
        //         this.uncertainEnd = participant.size;
        //         this.end = tidyPosition(firstPart);
        //         this.begin = null;
        //     } else {
        //         let firstDotPosition;
        //         if (firstPart.indexOf(".") === -1) {
        //             this.begin = tidyPosition(firstPart);
        //         } else {
        //             firstDotPosition = firstPart.indexOf(".");
        //             this.uncertainBegin = tidyPosition(firstPart.substring(0, firstDotPosition));
        //             this.begin = tidyPosition(firstPart.substring(firstDotPosition + 2));
        //         }
        //
        //         if (secondPart.indexOf(".") === -1) {
        //             this.end = tidyPosition(secondPart);
        //         } else {
        //             firstDotPosition = secondPart.indexOf(".");
        //             this.end = tidyPosition(secondPart.substring(0, firstDotPosition));
        //             this.uncertainEnd = tidyPosition(secondPart.substring(firstDotPosition + 2));
        //         }
        //
        //         if (this.begin === "n") {
        //             this.uncertainBegin = 1;
        //             this.begin = tidyPosition(this.end);
        //             // this.uncertainEnd = this.end;
        //             this.end = null;
        //         }
        //
        //         if (this.end === "c") {
        //             this.uncertainEnd = participant.size;
        //             this.end = tidyPosition(this.begin);
        //             // this.uncertainBegin = this.begin;
        //             this.begin = null;
        //         }
        //
        //         if (firstPart.indexOf("<") > -1) {
        //             this.uncertainBegin = 1;
        //             this.begin = tidyPosition(firstPart.substring(1, firstPart.length));
        //         }
        //         if (secondPart.indexOf(">") > -1) {
        //             this.end = tidyPosition(secondPart.substring(1, firstPart.length));
        //             this.uncertainEnd = participant.size;
        //         }
        //
        //         if (firstPart.indexOf(">") > -1 && secondPart.indexOf("<") > -1) {
        //             this.uncertainBegin = tidyPosition(firstPart.substring(1, firstPart.length));
        //             this.begin = tidyPosition(secondPart.substring(1, firstPart.length));
        //             this.end = null;//this.begin;
        //         }
        //     }
        // }
    }

    toString() {
        return this.sequenceDatumString;
    }

    overlaps(seqDatum) {
        if (this.participant === seqDatum.participant) {
            const first = this.uncertainBegin || this.begin || this.end || this.uncertainEnd;
            const last = this.uncertainEnd || this.end || this.begin || this.uncertainBegin;

            const otherFirst = seqDatum.uncertainBegin || seqDatum.begin || seqDatum.end;
            const otherLast = seqDatum.uncertainEnd || seqDatum.end || seqDatum.begin;

            if (first <= otherLast && otherFirst <= last) { // i wouldn't have got that tbh
                return true;
            }

        }
        return false;
    }
}

//On 06/06/13 09:22, marine@ebi.ac.uk wrote:
//> Concerning the ranges, I think there was a confusion :
//>
//> "n" = residue 1
//> "c" = residue at interactor.sequence.length
//>
//> In fact n is always used to describe a position that is unknown but we
//> know it is in the N-terminal portion (somewhere at the beginning of the
//> sequence) and c is always used to describe a position that is unknown but
//> we know it is in the C-terminal portion of the sequence (somewhere at the
//> end of the sequence). If we have an exact N-terminal position (residue 1),
//> it will be represented as a certain position of 1. Same for C-terminal
//> position (residue at interactor.sequence.length). We always use '-' to
//> separate the start position from the end position so c-c means that the
//> start and end positions of a feature are unknown but are bot in the
//> C-terminal portion of the sequence.
//>
//> You will never have "123" = specific residue but rather "123-123" =
//> specific residue which means the start and the end of the feature are
//> known and are the same so it represents a single residue. If you want,
//> JAMI could merge the start and end and give you 123 instead of 123-123 if
//> it is what you want.
//> "123-456" does not mean residue range, it means that the feature sequence
//> is a sequence of 133 amino acids where the start position and the end
//> positions are certain. For me, residue range is what you call 'residue
//> range with fuzzy boundaries'. If the start is 22..25, it means that the
//> starting amino acid position for the feature sequence is fuzzy and is
//> between the 22nd and the 25th amino acid but we don't know which one it
//> is. 22..22 will mean that the starting amino acid position for the feature
//> sequence is fuzzy and is around amino acid 22 in the interactor sequence.
//>
//> "<8" = range between 1 and 8 : I have the same comment as for "123"
//> instead of "123-123". JAMI could give you "<8" if both start and end
//> positions of the feature are <8 but it could happen that you have a
//> feature such as "<8->22" or "<8-22", etc.

