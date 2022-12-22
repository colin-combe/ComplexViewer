import {Link} from "./link";

export class HideableLink extends Link {

    get line() {
        throw new Error("line must be implemented");
    }

    get highlightLine() {
        throw new Error("highlightLine must be implemented");
    }

    //used by BinaryLink and UnaryLink
    hide() {
        this.highlightLine.remove();
        this.line.remove();
    }

}
