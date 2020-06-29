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
    this.app.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
    //if a force layout exists then stop it
    if (this.app.d3cola) {
        this.app.d3cola.stop();
    }
    this.app.dragElement = this;
    //this.util.clearSelection();
    //this.setSelected(true);
    //store start location
    const p = this.app.getEventPoint(evt); // seems to be correct, see above
    this.app.dragStart = this.app.mouseToSVG(p.x, p.y);
    //~ this.showData();
    return false;
};

// highlight on mouseover, all 'subclasses' need a showHighlight method
Link.prototype.mouseOver = function (evt) {
    //console.log("clickable mouse over");
    this.app.preventDefaultsAndStopPropagation(evt);
    //this.showHighlight(true, true);
    this.app.setTooltip(this.getToolTip(), this.color);
    return false;
};

Link.prototype.getToolTip = function () {
    return this.id;
};

Link.prototype.mouseOut = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt);
    this.showHighlight(false, true);
    this.app.hideTooltip();
    return false;
};

Link.prototype.touchStart = function (evt) {
    this.app.preventDefaultsAndStopPropagation(evt); //see MouseEvents.js
    //if a force layout exists then stop it
    if (this.app.layout !== undefined) {
        this.app.layout.stop();
    }
    this.app.dragElement = this;
    this.app.clearSelection();
    //    this.setSelected(true);
    //store start location
    const p = this.app.getTouchEventPoint(evt); // seems to be correct, see above
    this.app.dragStart = this.app.mouseToSVG(p.x, p.y);
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
    this.thickLine.remove(); // todo - this isn't used
    this.highlightLine.remove();
    this.line.remove();
};
