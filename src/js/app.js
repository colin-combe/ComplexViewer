// eslint-disable-next-line no-unused-vars
import * as css from "../css/xinet.css";
import {version} from "../../package.json";
import * as d3 from "d3";
import * as d3_chromatic from "d3-scale-chromatic";
import * as cola from "./cola";
import {readMijson} from "./read-mijson";
import {chooseColors, fetchAnnotations} from "./annotationUtils";
import {svgUtils} from "./svgexp";

// import {SymbolKey} from "./symbol-key";
import * as ColorSchemeKey from "./color-scheme-key";
import {NaryLink} from "./viz/link/nary-link";
import {svgns} from "./config";

// could refactor everything to use ES6 class syntax
// but https://benmccormick.org/2015/04/07/es6-classes-and-backbone-js
// "ES6 classes don’t support adding properties directly to the class instance, only functions/methods"
// so backbone doesn't work
// so continuing to use prototypical inheritance in things for time being

export function App(/*HTMLDivElement*/networkDiv) {
    // this.debug = true; // things aren't exactly lined up in the bounding boxes cola is using, to do so breaks symetery of some things
    this.el = networkDiv;

    this.STATES = {};
    this.STATES.MOUSE_UP = 0; //start state, also set when mouse up on svgElement
    this.STATES.PANNING = 1; //set by mouse down on svgElement - left button, no shift or util
    this.STATES.DRAGGING = 2; //set by mouse down on Protein or Link
    this.STATES.ROTATING = 3; //set by mouse down on Rotator, drag?
    this.STATES.SELECTING = 4; //set by mouse down on svgElement- right button or left button shift or util, drag

    //avoids prob with 'save - web page complete'
    this.el.textContent = ""; //https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript

    this.d3cola = cola.d3adaptor();

    const customMenuSel = d3.select(this.el)
        .append("div").classed("custom-menu-margin", true)
        .append("div").classed("custom-menu", true)
        .append("ul");

    const self = this;
    const collapse = customMenuSel.append("li").classed("collapse", true); //.append("button");
    collapse.text("Collapse");
    collapse[0][0].onclick = function (evt) {
        self.collapseProtein(evt);
    };
    const scaleButtonsListItemSel = customMenuSel.append("li").text("Scale: ");

    this.barScales = [0.01, 0.2, 1, 2, 4, 8];
    const scaleButtons = scaleButtonsListItemSel.selectAll("ul.custom-menu")
        .data(this.barScales)
        .enter()
        .append("div")
        .attr("class", "barScale")
        .append("label");
    scaleButtons.append("span")
        .text(function (d) {
            if (d === 8) return "AA";
            else return d;
        });
    scaleButtons.append("input")
        // .attr ("id", function(d) { return d*100; })
        .attr("class", function (d) {
            return "scaleButton scaleButton_" + (d * 100);
        })
        .attr("name", "scaleButtons")
        .attr("type", "radio")
        .on("change", function (d) {
            self.preventDefaultsAndStopPropagation(d);
            self.contextMenuProt.setStickScale(d, self.contextMenuPoint);
        });

    const contextMenu = d3.select(".custom-menu-margin").node();
    contextMenu.onmouseout = function (evt) {
        let e = evt.relatedTarget;
        do {
            if (e === this) return;
            e = e.parentNode;
        } while (e);
        self.contextMenuProt = null;
        d3.select(this).style("display", "none");
    };


    //create SVG element
    this.svgElement = document.createElementNS(svgns, "svg");
    this.svgElement.classList.add("complexViewerSVG");

    //add listeners
    this.svgElement.onmousedown = function (evt) {
        self.mouseDown(evt);
    };
    this.svgElement.onmousemove = function (evt) {
        self.mouseMove(evt);
    };
    this.svgElement.onmouseup = function (evt) {
        self.mouseUp(evt);
    };
    this.svgElement.onmouseout = function (evt) {
        self.hideTooltip(evt);
    };
    this.lastMouseUp = new Date().getTime();
    /*this.svgElement.ontouchstart = function(evt) {
        self.touchStart(evt);
    };
    this.svgElement.ontouchmove = function(evt) {
        self.touchMove(evt);
    };
    this.svgElement.ontouchend = function(evt) {
        self.touchEnd(evt);
    };
    */

    this.el.oncontextmenu = function (evt) {
        if (evt.preventDefault) { // necessary for addEventListener, works with traditional
            evt.preventDefault();
        }
        evt.returnValue = false; // necessary for attachEvent, works with traditional
        return false; // works with traditional, not with attachEvent or addEventListener
    };

    //updated if legend changed
    this.colorSchemeKeyDivs = new Set();
    //functions that get interactor id of hover over thing
    this.hoverListeners = new Set();

    this.el.appendChild(this.svgElement);

    // various groups needed
    this.container = document.createElementNS(svgns, "g");
    this.container.setAttribute("id", "container");

    const svg = d3.select(this.svgElement);
    this.defs = svg.append("defs");

    this.acknowledgement = document.createElementNS(svgns, "g");
    const ackText = document.createElementNS(svgns, "text");
    ackText.innerHTML = "<a href='https://academic.oup.com/bioinformatics/article/33/22/3673/4061280' target='_blank'><tspan x='0' dy='1.2em' style='text-decoration: underline'>ComplexViewer "
        + version + "</tspan></a><tspan x='0' dy='1.2em'>by <a href='http://rappsilberlab.org/' target='_blank'>Rappsilber Laboratory</a></tspan>";

    this.acknowledgement.appendChild(ackText);
    ackText.setAttribute("font-size", "8pt");
    this.svgElement.appendChild(this.acknowledgement);

    this.naryLinks = document.createElementNS(svgns, "g");
    this.naryLinks.setAttribute("id", "naryLinks");
    this.container.appendChild(this.naryLinks);

    this.p_pLinksWide = document.createElementNS(svgns, "g");
    this.p_pLinksWide.setAttribute("id", "p_pLinksWide");
    this.container.appendChild(this.p_pLinksWide);

    this.highlights = document.createElementNS(svgns, "g");
    this.highlights.setAttribute("class", "highlights"); //interactors also contain highlight groups
    this.container.appendChild(this.highlights);

    this.res_resLinks = document.createElementNS(svgns, "g");
    this.res_resLinks.setAttribute("id", "res_resLinks");
    this.container.appendChild(this.res_resLinks);

    this.p_pLinks = document.createElementNS(svgns, "g");
    this.p_pLinks.setAttribute("id", "p_pLinks");
    this.container.appendChild(this.p_pLinks);

    this.proteinUpper = document.createElementNS(svgns, "g");
    this.proteinUpper.setAttribute("id", "proteinUpper");
    this.container.appendChild(this.proteinUpper);

    this.selfRes_resLinks = document.createElementNS(svgns, "g");
    this.selfRes_resLinks.setAttribute("id", "res_resLinks");
    this.container.appendChild(this.selfRes_resLinks);

    this.svgElement.appendChild(this.container);

    //showing title as tooltips is NOT part of svg spec (even though some browsers do this)
    //also more responsive / more control if we do out own
    this.tooltip = document.createElementNS(svgns, "text");
    this.tooltip.setAttribute("x", "0");
    this.tooltip.setAttribute("y", "0");
    const tooltipTextNode = document.createTextNode("tooltip");
    this.tooltip.classList.add("label", "tooltip");

    this.tooltip.appendChild(tooltipTextNode);

    this.tooltip_bg = document.createElementNS(svgns, "rect");
    this.tooltip_bg.classList.add("tooltip-background");

    this.tooltip_subBg = document.createElementNS(svgns, "rect");
    this.tooltip_subBg.classList.add("tooltip-sub-background");

    this.svgElement.appendChild(this.tooltip_subBg);
    this.svgElement.appendChild(this.tooltip_bg);
    this.svgElement.appendChild(this.tooltip);

    this.annotationSetsShown = new Map();
    this.annotationSetsShown.set("Interactor", false);
    this.annotationSetsShown.set("MI Features", true);
    this.annotationSetsShown.set("UniprotKB", false);
    this.annotationSetsShown.set("Superfamily", false);

    this.clear();
}

App.prototype.createHatchedFill = function (name, color) {
    if (!this.checkedHatchNames.has(name)) {
        const pattern = this.defs.append("pattern")
            .attr("id", name)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 12)
            .attr("height", 12)
            .attr("patternTransform", "rotate(45)");

        pattern.append("rect")
            .attr("x", 0)
            .attr("y", 2)
            .attr("width", 12)
            .attr("height", 4)
            .attr("fill", color);

        pattern.append("rect")
            .attr("x", 0)
            .attr("y", 8)
            .attr("width", 12)
            .attr("height", 4)
            .attr("fill", color);

        this.checkedHatchNames.add(name);
    }
};

App.prototype.clear = function () {
    this.d3cola.stop();

    //lighten colors
    const complexColors = [];
    for (let c of d3_chromatic.schemePastel2) {//colorbrewer.Pastel2[8]) {
        const hsl = d3.hsl(c);
        hsl.l = 0.9;
        complexColors.push(hsl + "");
    }

    NaryLink.naryColors = d3.scale.ordinal().range(complexColors);
    this.defs.textContent = "";
    this.checkedHatchNames = new Set();

    this.naryLinks.textContent = "";
    this.p_pLinksWide.textContent = "";
    this.highlights.textContent = "";
    this.p_pLinks.textContent = "";
    this.res_resLinks.textContent = "";
    this.proteinUpper.textContent = "";
    this.selfRes_resLinks.textContent = "";

    // if we are dragging something at the moment - this will be the element that is dragged
    this.dragElement = null;
    // from where did we start dragging
    this.dragStart = {};

    this.participants = new Map();
    this.allNaryLinks = new Map();
    this.allBinaryLinks = new Map();
    this.allUnaryLinks = new Map();
    this.allSequenceLinks = new Map();
    this.complexes = [];

    this.proteinCount = 0;
    this.z = 1;
    this.hideTooltip();
    this.state = this.STATES.MOUSE_UP;
};

App.prototype.collapseProtein = function () {
    d3.select(".custom-menu-margin").style("display", "none");
    this.contextMenuProt.setForm(0, this.contextMenuPoint);
    this.contextMenuProt = null;
};

App.prototype.init = function () {
    this.d3cola.stop();
    let maxSeqLength = 0;
    for (let participant of this.participants.values()) {
        if (participant.size > maxSeqLength) {
            maxSeqLength = participant.size;
        }
    }
    const width = this.svgElement.parentNode.clientWidth;
    const defaultPixPerRes = width * 0.8 / maxSeqLength;
    //console.log("defaultPixPerRes:" + defaultPixPerRes);
    // https://stackoverflow.com/questions/12141150/from-list-of-integers-get-number-closest-to-a-given-value/12141511#12141511
    function takeClosest(myList, myNumber) {
        const bisect = d3.bisector(function (d) {
            return d;
        }).left;
        const pos = bisect(myList, myNumber);
        if (pos === 0 || pos === 1) {
            return myList[1]; // don't return smallest scale as default
        }
        if (pos === myList.length) {
            return myList[myList.length - 1];
        }
        return myList[pos - 1];
    }

    this.defaultBarScale = takeClosest(this.barScales, defaultPixPerRes);
    //console.log("default bar scale: " + this.defaultBarScale)

    for (let participant of this.participants.values()) {
        if (participant.type != "complex") {
            participant.setPosition(-500, -500);
            this.proteinUpper.appendChild(participant.upperGroup);
        }
    }
    for (let participant of this.participants.values()) {
        if (participant.type === "protein") {
            // participant.initSelfLinkSVG(); // todo - may not even do anything, not sure its working
            participant.stickZoom = this.defaultBarScale;
            if (this.participants.size < 4) {
                participant.toStickNoTransition();
            }
        }
    }
    this.updateAnnotations();
    const self = this;
    fetchAnnotations(this, function(){self.updateAnnotations();});

    this.checkLinks(); //totally needed, not sure why tbh todo - check this out
    this.autoLayout();
};

App.prototype.zoomToExtent = function () {
    const width = this.svgElement.parentNode.clientWidth;
    const height = this.svgElement.parentNode.clientHeight;
    const bbox = this.container.getBBox();
    let xr = (width / bbox.width).toFixed(4) - 0;
    let yr = (height / bbox.height).toFixed(4) - 0;
    let scaleFactor;
    if (yr < xr) {
        scaleFactor = yr;
    } else {
        scaleFactor = xr;
    }
    if (scaleFactor < 1) { ///didn't fit in div
        //console.log("no fit", scaleFactor);
        xr = (width - 40) / (bbox.width);
        yr = (height - 40) / (bbox.height);
        let scaleFactor;
        if (yr < xr) {
            scaleFactor = yr;
        } else {
            scaleFactor = xr;
        }

        if (scaleFactor > this.z) {
            scaleFactor = this.z;
        }

        //bbox.x + x = 0;
        let x = -bbox.x + (20 / scaleFactor);
        //box.y + y = 0
        let y = -bbox.y + (20 / scaleFactor);
        this.container.setAttribute("transform", "scale(" + scaleFactor + ") translate(" + x + " " + y + ") ");
        this.z = this.container.getCTM().inverse().a;
    } else {
        //console.log("fit", scaleFactor);
        // this.container.setAttribute("transform", "scale(" + 1 + ") translate(" + -(width/2) + " " + -bbox.y + ")");
        const deltaWidth = width - bbox.width;
        const deltaHeight = height - bbox.height;
        //bbox.x + x = deltaWidth /2;
        let x = (deltaWidth / 2) - bbox.x;
        //box.y + y = deltaHeight / 2
        let y = (deltaHeight / 2) - bbox.y;
        this.container.setAttribute("transform", "scale(" + 1 + ") translate(" + x + " " + y + ")");
        this.z = 1;
    }

    //todo - following could be tided up by using acknowledgement bbox or positioning att's of text
    this.acknowledgement.setAttribute("transform", "translate(" + (width - 150) + ", " + (height - 30) + ")");
};

//listeners also attached to mouse events by Interactor (and Rotator) and Link, those consume their events
//mouse down on svgElement must be allowed to propogate (to fire event on Prots/Links)

App.prototype.mouseDown = function (evt) {
    //prevent default, but allow propogation
    evt.preventDefault();
    this.d3cola.stop();
    const p = this.getEventPoint(evt); // seems to be correct, see below
    this.dragStart = this.mouseToSVG(p.x, p.y);
    return false;
};

// dragging/rotation/panning/selecting
App.prototype.mouseMove = function (evt) {
    const p = this.getEventPoint(evt); // seems to be correct, see below
    const c = this.mouseToSVG(p.x, p.y);

    if (this.dragElement != null) { //dragging or rotating
        this.hideTooltip();
        const dx = this.dragStart.x - c.x;
        const dy = this.dragStart.y - c.y;

        if (this.state === this.STATES.DRAGGING) {
            // we are currently dragging things around
            let ox, oy, nx, ny;
            if (!this.dragElement.ix) {
                for (let participant of this.dragElement.participants) {
                    participant.changePosition(dx, dy);
                }
                this.setAllLinkCoordinates();
            } else {
                ox = this.dragElement.ix;
                oy = this.dragElement.iy;
                nx = ox - dx;
                ny = oy - dy;
                this.dragElement.setPosition(nx, ny);
                this.dragElement.setAllLinkCoordinates();
            }
            this.dragStart = c;
        } else { //not dragging or rotating yet, maybe we should start
            // don't start dragging just on a click - we need to move the mouse a bit first
            if (Math.sqrt(dx * dx + dy * dy) > (5 * this.z)) {
                this.state = this.STATES.DRAGGING;

            }
        }
    } else {
        this.showTooltip(p);
    }
    return false;
};

// this ends all dragging and rotating
App.prototype.mouseUp = function (evt) {
    const time = new Date().getTime();
    //console.log("Mouse up: " + evt.srcElement + " " + (time - this.lastMouseUp));
    this.preventDefaultsAndStopPropagation(evt);
    //eliminate some spurious mouse up events
    if ((time - this.lastMouseUp) > 150) {

        const p = this.getEventPoint(evt); // seems to be correct, see below
        const c = this.mouseToSVG(p.x, p.y);

        if (this.dragElement && this.dragElement.type === "protein") { /// todo be consistent about how to check if thing is protein
            if (!(this.state === this.STATES.DRAGGING || this.state === this.STATES.ROTATING)) { //not dragging or rotating
                if (!this.dragElement.expanded) {
                    this.dragElement.setForm(1);
                } else {
                    this.contextMenuProt = this.dragElement;
                    this.contextMenuPoint = c;
                    const menu = d3.select(".custom-menu-margin");
                    menu.style("top", (evt.pageY - 20) + "px").style("left", (evt.pageX - 20) + "px").style("display", "block");
                    d3.select(".scaleButton_" + (this.dragElement.stickZoom * 100)).property("checked", true);
                }
            }
        }
    }

    this.dragElement = null;
    this.state = this.STATES.MOUSE_UP;

    this.lastMouseUp = time;
    return false;
};

//gets mouse position
App.prototype.getEventPoint = function (evt) {
    const p = this.svgElement.createSVGPoint();
    let element = this.svgElement.parentNode;
    let top = 0,
        left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);
    p.x = evt.pageX - left;
    p.y = evt.pageY - top;
    return p;
};

//stop event propogation and defaults; only do what we ask
App.prototype.preventDefaultsAndStopPropagation = function (evt) {
    if (evt.stopPropagation)
        evt.stopPropagation();
    if (evt.cancelBubble != null)
        evt.cancelBubble = true;
    if (evt.preventDefault)
        evt.preventDefault();
};

/**
 * Handle touchstart event.

 App.prototype.touchStart = function(evt) {
    //prevent default, but allow propogation
    evt.preventDefault();

    //stop force layout
    if (typeof this.d3cola !== 'undefined' && this.d3cola != null) {
        this.d3cola.stop();
    }

    var p = this.getTouchEventPoint(evt); // seems to be correct, see below
    this.dragStart = this.mouseToSVG(p.x, p.y);
};

 // dragging/rotation/panning/selecting
 App.prototype.touchMove = function(evt) {
    // if (this.sequenceInitComplete) { // just being cautious
    var p = this.getTouchEventPoint(evt); // seems to be correct, see below
    var c = this.mouseToSVG(p.x, p.y);

    if (this.dragElement != null) { //dragging or rotating
        this.hideTooltip();
        var dx = this.dragStart.x - c.x;
        var dy = this.dragStart.y - c.y;

        if (this.state === this.STATES.DRAGGING) {
            // we are currently dragging things around
            var ox, oy, nx, ny;
            if (typeof this.dragElement.ix=== 'undefined') { // if not an Interactor
                var nodes = this.dragElement.interactors;
                var nodeCount = nodes.length;
                for (var i = 0; i < nodeCount; i++) {
                    var protein = nodes[i];
                    ox = protein.cx;
                    oy = protein.cy;
                    nx = ox - dx;
                    ny = oy - dy;
                    protein.setPosition(nx, ny);
                    protein.setAllLinkCoordinates();
                }
                for (i = 0; i < nodeCount; i++) {
                    nodes[i].setAllLinkCoordinates();
                }
            } else {
                ox = this.dragElement.cx;
                oy = this.dragElement.cy;
                nx = ox - dx;
                ny = oy - dy;
                this.dragElement.setPosition(nx, ny);
                this.dragElement.setAllLinkCoordinates();
            }
            this.dragStart = c;
        } else { //not dragging or rotating yet, maybe we should start
            // don't start dragging just on a click - we need to move the mouse a bit first
            if (Math.sqrt(dx * dx + dy * dy) > (5 * this.z)) {
                this.state = this.STATES.DRAGGING;

            }
        }
    } else {
        this.showTooltip(p);
    }
    return false;
};

// this ends all dragging and rotating
App.prototype.touchEnd = function(evt) {
    var time = new Date().getTime();
    //console.log("Mouse up: " + evt.srcElement + " " + (time - this.lastMouseUp));
    this.preventDefaultsAndStopPropagation(evt);
    //eliminate some spurious mouse up events
    if ((time - this.lastMouseUp) > 150) {

        var p = this.getTouchEventPoint(evt); // seems to be correct, see below
        var c = this.mouseToSVG(p.x, p.y);

        if (this.dragElement != null) {
            if (!(this.state === this.STATES.DRAGGING || this.state === this.STATES.ROTATING)) { //not dragging or rotating
                if (!this.dragElement.expanded) {
                    this.dragElement.setForm(1);
                } else {
                    this.contextMenuProt = this.dragElement;
                    this.contextMenuPoint = c;
                    var menu = d3.select(".custom-menu-margin")
                    menu.style("top", (evt.pageY - 20) + "px").style("left", (evt.pageX - 20) + "px").style("display", "block");
                    d3.select(".scaleButton_" + (this.dragElement.stickZoom * 100)).property("checked", true)
                }
            }
        }
    }

    this.dragElement = null;
    this.whichRotator = -1;
    this.state = this.STATES.MOUSE_UP;

    this.lastMouseUp = time;
    return false;
};

//gets mouse position
App.prototype.getTouchEventPoint = function(evt) {
    var p = this.svgElement.createSVGPoint();
    var element = this.svgElement.parentNode;
    var top = 0,
        left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);
    p.x = evt.touches[0].pageX - left;
    p.y = evt.touches[0].pageY - top;
    return p;
};
 */
App.prototype.autoLayout = function () {
    this.d3cola.stop();
    const self = this;

    // needed to ensure consistent results
    for (let p of self.participants.values()) {
        delete p.x;
        delete p.y;
        delete p.px;
        delete p.py;
        delete p.bounds;
        p.fixed = 0;
    }

    //// prune leaves from network then layout, then add back leaves and layout again (fixes haemoglobin)
    const pruned = [];
    for (let participant of self.participants.values()) {
        if (participant.binaryLinks.size > 2 && participant.type !== "complex") {
            pruned.push(participant);
        }
    }
    const allNodesExceptComplexes = Array.from(self.participants.values()).filter(function (value) {
        return value.type !== "complex";
    });

    if (pruned.length < allNodesExceptComplexes.length
        && pruned.length > 3 && self.participants.size < 9) {
        // <9 include hemoglobin, possibly some other small cases, but is catious, tends to mess other things up
        // console.log(prunedIn);
        doLayout(pruned, true);
    } else {
        doLayout(allNodesExceptComplexes, self.complexes.length > 0);
    }

    function doLayout(nodes, preRun) {
        const layoutObj = {}; // todo get rid
        layoutObj.nodes = nodes;
        layoutObj.links = [];

        const molLookUp = {};
        let mi = 0;
        for (let mol of nodes) {
            molLookUp[mol.id] = mi;
            mi++;
        }

        for (let binaryLink of self.allBinaryLinks.values()) {
            const fromMol = binaryLink.participants[0];
            const toMol = binaryLink.participants[1];
            // if (preRun || (fromMol.binaryLinks.size === 4 || toMol.binaryLinks.size == 4)) {
            const source = fromMol; //molLookUp[fromMol.id];
            const target = toMol; //molLookUp[toMol.id];

            if (source !== target && nodes.indexOf(source) !== -1 && nodes.indexOf(target) !== -1) { // todo - check what this is doing
                const linkObj = {};
                linkObj.source = molLookUp[fromMol.id];
                linkObj.target = molLookUp[toMol.id];
                linkObj.id = binaryLink.id;
                layoutObj.links.push(linkObj);
            }
            // }
        }

        const groups = [];
        if (!preRun && self.complexes) {
            for (let g of self.complexes) {
                g.leaves = [];
                g.groups = [];
                for (let interactor of g.naryLink.participants) {
                    if (interactor.type !== "complex") {
                        g.leaves.push(layoutObj.nodes.indexOf(interactor));
                    }
                }
                groups.push(g);
            }
            for (let g of self.complexes) {
                for (let interactor of g.naryLink.participants) {
                    if (interactor.type === "complex") {
                        //console.log(groups.indexOf(interactor));
                        g.groups.push(groups.indexOf(interactor));
                    }
                }
            }
        }

        //console.log("groups", groups);
        delete self.d3cola._lastStress;
        delete self.d3cola._alpha;
        delete self.d3cola._descent;
        delete self.d3cola._rootGroup;

        let linkLength = (nodes.length < 30) ? 30 : 20;
        const width = self.svgElement.parentNode.clientWidth;
        const height = self.svgElement.parentNode.clientHeight;
        //console.log("**", layoutObj);
        self.d3cola.size([height - 40, width - 40])
            .nodes(layoutObj.nodes).groups(groups).links(layoutObj.links).avoidOverlaps(true);
        let groupDebugSel, participantDebugSel;
        if (self.debug) {
            groupDebugSel = d3.select(self.container).selectAll(".group")
                .data(groups);

            groupDebugSel.enter().append("rect")
                .classed("group", true)
                .attr({
                    rx: 5,
                    ry: 5
                })
                .style("stroke", "blue")
                .style("fill", "none");

            participantDebugSel = d3.select(self.container).selectAll(".node")
                .data(layoutObj.nodes);

            participantDebugSel.enter().append("rect")
                .classed("node", true)
                .attr({
                    rx: 5,
                    ry: 5
                })
                .style("stroke", "red")
                .style("fill", "none");

            groupDebugSel.exit().remove();
            participantDebugSel.exit().remove();
        }

        const startTime = Date.now();
        self.d3cola.symmetricDiffLinkLengths(linkLength)
            .on("tick", function () {
                if (Date.now() - startTime > 750) {//!preRun) {
                    const nodes = self.d3cola.nodes();
                    for (let node of nodes) {
                        node.setPosition(node.x, node.y);
                    }
                    self.setAllLinkCoordinates();
                    self.zoomToExtent();
                    if (self.debug) {
                        groupDebugSel.attr({
                            x: function (d) {
                                return d.bounds.x;// + (width / 2);
                            },
                            y: function (d) {
                                return d.bounds.y;// + (height / 2);
                            },
                            width: function (d) {
                                return d.bounds.width();
                            },
                            height: function (d) {
                                return d.bounds.height();
                            }
                        });

                        participantDebugSel.attr({
                            x: function (d) {
                                return d.bounds.x;// + (width / 2);
                            },
                            y: function (d) {
                                return d.bounds.y;// + (height / 2);
                            },
                            width: function (d) {
                                return d.bounds.width();
                            },
                            height: function (d) {
                                return d.bounds.height();
                            }
                        });
                    }
                }
            })
            .on("end", function () {
                if (preRun) {
                    // alert("initial run complete");
                    //     // for (let p of layoutObj.nodes) {
                    //     //         p.fixed = 1;
                    //     // }
                    doLayout(allNodesExceptComplexes, false);
                } else {
                    for (let node of nodes) {
                        node.setPosition(node.x, node.y);
                    }
                    self.setAllLinkCoordinates();
                    self.zoomToExtent();
                }
            });
        if (preRun) {
            self.d3cola.start(23, 23, 0, 0, true);//, false, false);
        } else {
            self.d3cola.start(0, 23, 23, 0, true);//, false, false);
        }
    }
};

App.prototype.getSVG = function () { //todo - somewhat broken, annotations missing
    var svgSel = d3.select(this.el).selectAll("svg");
    var svgArr = [svgSel.node()];
    var svgStrings = svgUtils.capture(svgArr);
    var svgXML = svgUtils.makeXMLStr(new XMLSerializer(), svgStrings[0]);

    return svgXML;

    // var fileName = this.filenameStateString().substring(0, 240);
    // download(svgXML, 'application/svg', fileName + ".svg");

};

// App.prototype.getSVG = function () {
//     let svgXml = this.svgElement.outerHTML.replace(/<rect .*?\/rect>/i, ""); //take out white background fill
//     const viewBox = "viewBox=\"0 0 " + this.svgElement.parentNode.clientWidth + " " + this.svgElement.parentNode.clientHeight + "\" ";
//     svgXml = svgXml.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:ev=\"http://www.w3.org/2001/xml-events\" " + viewBox);
//
//     return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>" +
//         "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" +
//         svgXml;
// };

// transform the mouse-position into a position on the svg
App.prototype.mouseToSVG = function (x, y) {
    const p = this.svgElement.createSVGPoint();
    p.x = x;
    p.y = y;
    return p.matrixTransform(this.container.getCTM().inverse());
};

// reads MI JSON format
App.prototype.readMIJSON = function (miJson, expand = true) {
    readMijson(miJson, this, expand);
    this.init();
};

App.prototype.checkLinks = function () {
    for (let link of this.allNaryLinks.values()) {
        link.check();
    }
    for (let link of this.allBinaryLinks.values()) {
        link.check();
    }
    for (let link of this.allUnaryLinks.values()) {
        link.check();
    }
    for (let link of this.allSequenceLinks.values()) {
        link.check();
    }
};

App.prototype.setAllLinkCoordinates = function () {
    for (let link of this.allNaryLinks.values()) {
        link.setLinkCoordinates();
    }
    for (let link of this.allBinaryLinks.values()) {
        link.setLinkCoordinates();
    }
    for (let link of this.allUnaryLinks.values()) {
        link.setLinkCoordinates();
    }
    for (let link of this.allSequenceLinks.values()) {
        link.setLinkCoordinates();
    }
};

App.prototype.showTooltip = function (p) {
    let ttX, ttY;
    const length = this.tooltip.getComputedTextLength() + 16;
    const width = this.svgElement.parentNode.clientWidth;
    const height = this.svgElement.parentNode.clientHeight;
    if (p.x + 20 + length < width) {
        ttX = p.x;
    } else {
        ttX = width - length - 20;
    }

    if (p.y + 60 < height) {
        ttY = p.y;
    } else {
        ttY = height - 60;
    }
    this.tooltip.setAttribute("x", ttX + 22);
    this.tooltip.setAttribute("y", ttY + 47);
    this.tooltip_bg.setAttribute("x", ttX + 16);
    this.tooltip_bg.setAttribute("y", ttY + 28);
    this.tooltip_subBg.setAttribute("x", ttX + 16);
    this.tooltip_subBg.setAttribute("y", ttY + 28);
};

App.prototype.setTooltip = function (text, color) {
    if (text) {
        this.tooltip.firstChild.data = text.toString().replace(/&(quot);/g, "\"");
        this.tooltip.setAttribute("display", "block");
        const length = this.tooltip.getComputedTextLength();
        this.tooltip_bg.setAttribute("width", length + 16);
        this.tooltip_subBg.setAttribute("width", length + 16);
        if (typeof color !== "undefined" && color != null) {
            this.tooltip_bg.setAttribute("fill", color);
            this.tooltip_bg.setAttribute("stroke", color);
            this.tooltip_bg.setAttribute("fill-opacity", "0.0");
        } else {
            this.tooltip_bg.setAttribute("fill", "white");
            this.tooltip_bg.setAttribute("stroke", "grey");
        }
        // todo - whats this height for?
        this.tooltip_bg.setAttribute("height", "28");
        this.tooltip_subBg.setAttribute("height", "28");
        this.tooltip_bg.setAttribute("display", "block");
        this.tooltip_subBg.setAttribute("display", "block");
    } else {
        this.hideTooltip();
    }
};

App.prototype.hideTooltip = function () {
    this.tooltip.setAttribute("display", "none");
    this.tooltip_bg.setAttribute("display", "none");
    this.tooltip_subBg.setAttribute("display", "none");
};

App.prototype.addColorSchemeKey = function (/*HTMLDivElement*/ div) {
    this.colorSchemeKeyDivs.add(div);
    ColorSchemeKey.update(div, this);
};

App.prototype.removeColorSchemeKey = function (/*HTMLDivElement*/ colorSchemeKeyDiv) {
    this.colorSchemeKeyDivs.remove(colorSchemeKeyDiv);
    colorSchemeKeyDiv.textContent = "";
};

//for backwards compatibility (noe?), tbh i might have made a bit of a mess here
App.prototype.setAnnotations = function (annoChoice) {
    annoChoice = annoChoice.toUpperCase();
    for (let annoType of this.annotationSetsShown.keys()) {
        this.showAnnotations(annoType, annoChoice === annoType);
    }
};

App.prototype.showAnnotations = function (annoChoice, show) {
    this.annotationSetsShown.set(annoChoice, show);
    this.updateAnnotations();
};

App.prototype.updateAnnotations = function () {
    // //clear all annot's
    for (let mol of this.participants.values()) {
        if (mol.type === "protein") {
            mol.clearPositionalFeatures();
        }
    }
    chooseColors(this);
    this.colorSchemeChanged();

    for (let mol of this.participants.values()) {
        if (mol.type === "protein") {
            mol.updatePositionalFeatures();
        }
    }
    chooseColors(this);
    this.colorSchemeChanged();
};

App.prototype.colorSchemeChanged = function () {
    for (let div of this.colorSchemeKeyDivs) {
        ColorSchemeKey.update(div, this);
    }
};

App.prototype.getComplexColors = function () {
    return NaryLink.naryColors;
};

App.prototype.getFeatureColors = function () {
    return this.featureColors;
};

App.prototype.collapseAll = function () {
    for (let participant of this.participants.values()) {
        if (participant.expanded) {
            participant.setForm(0);
        }
    }
};

App.prototype.expandAll = function () {
    for (let participant of this.participants.values()) {
        if (participant.type === "protein" && !participant.expanded) {
            participant.setForm(1);
        }
    }
};

//from noe
App.prototype.expandAndCollapseSelection = function (moleculesSelected) {
    for (let participant of this.participants.values()) {
        const molecule_id = participant.json.identifier.id;
        if (moleculesSelected.includes(molecule_id)) {
            if (!participant.expanded) {
                participant.setForm(1);
            }
        } else if (participant.expanded) {
            participant.setForm(0);
        }
    }
};


App.prototype.addHoverListener = function (hoverListener) {
    this.hoverListeners.add(hoverListener);
};

App.prototype.removeHoverListener = function (hoverListener) {
    this.hoverListeners.remove(hoverListener);
};

App.prototype.notifyHoverListeners = function (interactorIdArr) {
    for (let hl of this.hoverListeners) {
        hl(interactorIdArr)
    }
};


// export function makeSymbolKey(targetDiv){
//     new SymbolKey(targetDiv);
// }