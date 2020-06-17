//    xiNET interaction viewer
//    Copyright 2013 Rappsilber Laboratory
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).

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

export function Feature(node, sequenceDatumString) {
    this.node = node; //todo: rename to participant
    this.sequenceDatumString = sequenceDatumString.trim();

    if (this.sequenceDatumString === "?-?") {
        this.begin = 0;
        this.end = 0;
        this.uncertainEnd = node.size;
    } else if (this.sequenceDatumString === "n-n") {
        this.uncertainBegin = "n-n";
        this.begin = 0;
        this.end = 0;
        node.nTerminusFeature = true;
    } else if (this.sequenceDatumString === "c-c") {
        this.begin = node.size + 1;
        this.end = node.size + 1;
        this.uncertainEnd = "c-c";//node.size + 21;
    } else {

        const dashPosition = sequenceDatumString.indexOf("-");
        const firstPart = sequenceDatumString.substring(0, dashPosition);
        const secondPart = sequenceDatumString.substring(dashPosition + 1);
        let firstDotPosition;
        if (firstPart.indexOf(".") === -1) {
            this.begin = firstPart;
        } else {
            firstDotPosition = firstPart.indexOf(".");
            this.uncertainBegin = firstPart.substring(0, firstDotPosition) * 1;
            this.begin = firstPart.substring(firstDotPosition + 2) * 1;
        }

        if (secondPart.indexOf(".") === -1) {
            this.end = secondPart;
        } else {
            firstDotPosition = secondPart.indexOf(".");
            this.end = secondPart.substring(0, firstDotPosition) * 1;
            this.uncertainEnd = secondPart.substring(firstDotPosition + 2) * 1;
        }

        if (this.begin === "n") {
            this.uncertainBegin = 0;
            this.begin = this.end;
            this.uncertainEnd = this.end;
        }

        if (this.end === "c") {
            this.uncertainEnd = node.size;
            this.end = this.begin;
            this.uncertainBegin = this.begin;
        }

        if (firstPart.indexOf("<") > -1) {
            this.uncertainBegin = 0;
            this.begin = firstPart.substring(1, firstPart.length);
        }
        if (secondPart.indexOf(">") > -1) {
            this.end = secondPart.substring(1, firstPart.length);
            this.uncertainEnd = node.size;
        }

        if (firstPart.indexOf(">") > -1 && secondPart.indexOf("<") > -1) {
            this.uncertainBegin = firstPart.substring(1, firstPart.length);
            this.begin = secondPart.substring(1, firstPart.length);
            this.end = this.begin;
        }
    }
}

Feature.prototype.toString = function () {
    return this.sequenceDatumString;
};
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

