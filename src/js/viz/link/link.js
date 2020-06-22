export function Link () {}

Link.maxNoEvidences = 0;

Link.prototype.addEvidence = function (interaction) {
    if (!this.evidences) {
        this.evidences = new Map();
    }
    if (this.evidences.has(interaction.id) === false) {
        this.evidences.set(interaction.id, interaction);
        if (this.evidences.size > Link.maxNoEvidences) {
            Link.maxNoEvidences = this.evidences.size;
            return true;
        }
    } else {
        return false;
    }
};

Link.prototype.highlightInteractors = function (show) {
    const interactors = this.interactors;
    for (let i = 0; i < interactors.length; i++) {
        interactors[i].showHighlight(show);
    }
};

// event handler for starting dragging or rotation (or flipping internal links)
Link.prototype.mouseDown = function (evt) {
    this.controller.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
    //if a force layout exists then stop it
    if (this.controller.layout) {
        this.controller.layout.stop();
    }
    this.controller.dragElement = this;
    //this.util.clearSelection();
    //this.setSelected(true);
    //store start location
    const p = this.controller.getEventPoint(evt); // seems to be correct, see above
    this.controller.dragStart = this.controller.mouseToSVG(p.x, p.y);
    //~ this.showData();
    return false;
};

// highlight on mouseover, all 'subclasses' need a showHighlight method
Link.prototype.mouseOver = function (evt) {
    //console.log("clickable mouse over");
    this.controller.preventDefaultsAndStopPropagation(evt);
    //this.showHighlight(true, true);
    this.controller.setTooltip(this.getToolTip(), this.colour);
    return false;
};

Link.prototype.getToolTip = function () {
    return this.id;
};

Link.prototype.mouseOut = function (evt) {
    this.controller.preventDefaultsAndStopPropagation(evt);
    this.showHighlight(false, true);
    this.controller.hideTooltip();
    return false;
};

Link.prototype.touchStart = function (evt) {
    this.controller.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
    //if a force layout exists then stop it
    if (this.controller.layout !== undefined) {
        this.controller.layout.stop();
    }
    this.controller.dragElement = this;
    this.controller.clearSelection();
    //    this.setSelected(true);
    //store start location
    const p = this.controller.getTouchEventPoint(evt); // seems to be correct, see above
    this.controller.dragStart = this.controller.mouseToSVG(p.x, p.y);
    //~ this.showData();
    return false;
};

//used when link clicked
/*Link.prototype.showData = function() {
    if (document.getElementById('jsonHeading')) {
        document.getElementById('jsonHeading').innerHTML = this.id;
    }
    if (document.getElementById('json')) {
        document.getElementById('json').innerHTML =
            "<pre>" + JSON.stringify(this.filteredEvidence(), null, ' ') + "</pre>";
    }
};*/

/*
Link.prototype.filteredEvidence = function () {
    //TODO - filtering
    return this.evidences.values();
    //~ if (typeof interaction.confidences !== 'undefined') {
    //~ var confidences = interaction.confidences;
    //~ var confCount = confidences.length;
    //~ for (var c = 0; c < confCount; c++){
    //~ var conf = confidences[c];
    //~ if (conf.type === 'intact-miscore'){
    //~ interaction.score = conf.value * 1.0;
    //~ }
    //~ }
    //~ }
};
*/

//used by BinaryLink and UnaryLink
Link.prototype.hide = function () {
    this.thickLine.remove();
    this.highlightLine.remove();
    this.line.remove();
    // const p_pLinksWide = [];
    // const highlights = [];
    // const p_pLinks = [];
    //
    // for (var i = 0; i < this.util.p_pLinksWide.childNodes.length; i++) {
    //     p_pLinksWide[i] = this.util.p_pLinksWide.childNodes[i];
    // }
    //
    // for (var i = 0; i < this.util.highlights.childNodes.length; i++) {
    //     highlights[i] = this.util.highlights.childNodes[i];
    // }
    //
    // for (var i = 0; i < this.util.p_pLinks.childNodes.length; i++) {
    //     p_pLinks[i] = this.util.p_pLinks.childNodes[i];
    // }
    //
    // if (p_pLinksWide.indexOf(this.thickLine) > -1) {
    //     this.util.p_pLinksWide.removeChild(this.thickLine);
    // }
    // if (highlights.indexOf(this.highlightLine) > -1) {
    //     this.util.highlights.removeChild(this.highlightLine);
    // }
    // if (p_pLinks.indexOf(this.line) > -1) {
    //     this.util.p_pLinks.removeChild(this.line);
    // }
};
