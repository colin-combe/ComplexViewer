//todo - make c notices consistent, are they really needed in each file  - https://softwareengineering.stackexchange.com/questions/19649/copyright-notices-disclaimers-in-source-files
//    xiNET Interaction Viewer
//    Copyright 2013 Rappsilber Laboratory, University of Edinburgh
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//    author: Colin Combe
//
//    app.js

// eslint-disable-next-line no-unused-vars
import * as css from "../css/xinet.css";

import * as d3 from "d3";
import * as colorbrewer from "colorbrewer";
import * as cola from "webcola";
import {readMijson} from "./read-mijson";
import {setAnnotations} from "./annotations";

import SymbolKey from "./symbol-key";

// import * as ColorSchemeKey from "./color-scheme-key";
import {NaryLink} from "./viz/link/nary-link";
import {svgns} from "./config";

//todo - refactor everything to use ES6 class syntax
// but https://benmccormick.org/2015/04/07/es6-classes-and-backbone-js
// "ES6 classes don’t support adding properties directly to the class instance, only functions/methods"
// so backbone doesn't work
// so continuing to use prototypical inheritance in things for time being

export function App (networkDiv, /*colourSchemeDiv,*/ symbolKeyDiv) {
        // this.debug = true;

        if (typeof targetDiv === "string") {
            this.el = document.getElementById(networkDiv);
        } else {
            this.el = networkDiv;
        }

        if (symbolKeyDiv) {
            new SymbolKey(symbolKeyDiv);
        }

        this.STATES = {};
        this.STATES.MOUSE_UP = 0; //start state, also set when mouse up on svgElement
        this.STATES.PANNING = 1; //set by mouse down on svgElement - left button, no shift or util
        this.STATES.DRAGGING = 2; //set by mouse down on Protein or Link
        this.STATES.ROTATING = 3; //set by mouse down on Rotator, drag?
        this.STATES.SELECTING = 4; //set by mouse down on svgElement- right button or left button shift or util, drag

        //avoids prob with 'save - web page complete'
        d3.select(this.el).selectAll("*").remove();

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
        this.svgElement.setAttribute("id", "complexViewerSVG");

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

    //legend changed callbacks
    this.legendCallbacks = [];

    this.el.appendChild(this.svgElement);

    // various groups needed
    this.container = document.createElementNS(svgns, "g");
    this.container.setAttribute("id", "container");

    const svg = d3.select(this.svgElement);
    this.defs = svg.append("defs");
    this.createHatchedFill("checkers_uncertain", "black");

    //markers
    const data = [{
        id: 1,
        name: "diamond",
        path: "M 0,-7.0710768 L  0,7.0710589 L 7.0710462,0  z",
        viewbox: "-15 -15 25 25",
        transform: "scale(1.5) translate(-5,0)",
        color: "black"
    }];

    this.defs.selectAll("marker")
        .data(data)
        .enter()
        .append("svg:marker")
        .attr("id", function (d) {
            return "marker_" + d.name;
        })
        .attr("markerHeight", 15)
        .attr("markerWidth", 15)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .attr("refX", 0)
        .attr("refY", 0)
        .attr("viewBox", function (d) {
            return d.viewbox;
        })
        .append("svg:path")
        .attr("d", function (d) {
            return d.path;
        })
        .attr("fill", function (d) {
            return d.color;
        })
        .attr("transform", function (d) {
            return d.transform;
        });

    this.acknowledgement = document.createElementNS(svgns, "g");
    const ackText = document.createElementNS(svgns, "text");
    ackText.innerHTML = "<a href='https://academic.oup.com/bioinformatics/article/33/22/3673/4061280' target='_blank'><tspan x='0' dy='1.2em' style='text-decoration: underline'>ComplexViewer</tspan></a><tspan x='0' dy='1.2em'>by <a href='http://rappsilberlab.org/' target='_blank'>Rappsilber Laboratory</a></tspan>";

    this.acknowledgement.appendChild(ackText);
    ackText.setAttribute("font-size", "12px");
    this.container.appendChild(this.acknowledgement);

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
    this.tooltip.setAttribute("class", "xlv_text");
    const tooltipTextNode = document.createTextNode("tooltip");

    this.tooltip.appendChild(tooltipTextNode);

    this.tooltip_bg = document.createElementNS(svgns, "rect");
    this.tooltip_bg.setAttribute("class", "tooltip_bg");

    this.tooltip_bg.setAttribute("fill-opacity", "0.75");
    this.tooltip_bg.setAttribute("stroke-opacity", "1");
    this.tooltip_bg.setAttribute("stroke-width", "1");

    this.tooltip_subBg = document.createElementNS(svgns, "rect");
    this.tooltip_subBg.setAttribute("fill", "white");
    this.tooltip_subBg.setAttribute("stroke", "white");
    this.tooltip_subBg.setAttribute("class", "tooltip_bg");
    this.tooltip_subBg.setAttribute("opacity", "1");
    this.tooltip_subBg.setAttribute("stroke-width", "1");

    this.svgElement.appendChild(this.tooltip_subBg);
    this.svgElement.appendChild(this.tooltip_bg);
    this.svgElement.appendChild(this.tooltip);

    this.clear();
}

App.prototype.createHatchedFill = function (name, colour) {
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
        .attr("fill", colour);

    pattern.append("rect")
        .attr("x", 0)
        .attr("y", 8)
        .attr("width", 12)
        .attr("height", 4)
        .attr("fill", colour);


    // checks - yuk
    // pattern.append('rect')
    //     .attr("x", 0)
    //     .attr("y", 0)
    //     .attr("width", 5)
    //     .attr("height", 5)
    //     .style("fill", "black");// "#A01284");
    // pattern.append('rect')
    //     .attr("x", 5)
    //     .attr("y", 5)
    //     .attr("width", 5)
    //     .attr("height", 5)
    //     .style("fill", "black");//"#A01284");
};

App.prototype.clear = function () {
    if (this.d3cola) {
        this.d3cola.stop();
    }
    this.d3cola = null;

    NaryLink.naryColours = d3.scale.ordinal().range(colorbrewer.Pastel2[8]);
    this.defs.selectAll(".feature_checkers").remove();

    d3.select(this.naryLinks).selectAll("*").remove();
    d3.select(this.p_pLinksWide).selectAll("*").remove();
    d3.select(this.highlights).selectAll("*").remove();
    d3.select(this.p_pLinks).selectAll("*").remove();
    d3.select(this.res_resLinks).selectAll("*").remove();
    d3.select(this.proteinUpper).selectAll("*").remove();
    d3.select(this.selfRes_resLinks).selectAll("*").remove();

    // if we are dragging something at the moment - this will be the element that is dragged
    this.dragElement = null;
    // from where did we start dragging
    this.dragStart = {};

    this.participants = new Map(); // todo - rename
    this.allNaryLinks = d3.map();
    this.allBinaryLinks = d3.map();
    this.allUnaryLinks = d3.map();
    this.allSequenceLinks = d3.map();
    this.complexes = [];

    this.proteinCount = 0;
    // this.maxBlobRadius = 30;
    // Interactor.MAXSIZE = 100;

    this.z = 1;

    this.hideTooltip();

    this.state = this.STATES.MOUSE_UP;
};

App.prototype.collapseProtein = function () {
    const p = this.contextMenuPoint;
    const c = p.matrixTransform(this.container.getCTM().inverse());

    d3.select(".custom-menu-margin").style("display", "none");
    this.contextMenuProt.setForm(0, c);
    this.contextMenuProt = null;
};

//this can be done before all proteins have their sequences
App.prototype.init = function () {
    this.checkLinks(); // todo - should this really be here
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

    if (this.annotationChoice) {
        this.setAnnotations(this.annotationChoice);
    } else {
        this.setAnnotations("MI FEATURES");
    }

    for (let participant of this.participants.values()) {
        if (participant.upperGroup) {
            this.proteinUpper.appendChild(participant.upperGroup);
            if (participant.json.type.name === "protein") {
                participant.stickZoom = this.defaultBarScale;
                participant.init();
            }
        }
    }

    if (this.participants.size < 4) {
        for (let participant of this.participants.values()) {
            if (participant.json.type.name === "protein") {
                participant.toStickNoTransition();
            }
        }
    }

    this.autoLayout();
};

App.prototype.setAnnotations = function (annotationChoice) {
    setAnnotations(annotationChoice, this);
};

//listeners also attached to mouse events by Interactor (and Rotator) and Link, those consume their events
//mouse down on svgElement must be allowed to propogate (to fire event on Prots/Links)

App.prototype.mouseDown = function (evt) {
    //prevent default, but allow propogation
    evt.preventDefault();
    //stop force layout
    if (typeof this.d3cola !== "undefined" && this.d3cola != null) {
        this.d3cola.stop();
    }

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
            if (typeof this.dragElement.cx === "undefined") { // if not an Interactor
                const nodes = this.dragElement.interactors;
                for (let protein of nodes) {
                    ox = protein.cx;
                    oy = protein.cy;
                    nx = ox - dx;
                    ny = oy - dy;
                    protein.setPosition(nx, ny);
                    protein.setAllLinkCoordinates();
                }
                for (let node of nodes) {
                    node.setAllLinkCoordinates();
                }
            } else {
                //its a protein - drag it TODO: DRAG SELECTED
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
App.prototype.mouseUp = function (evt) {
    const time = new Date().getTime();
    //console.log("Mouse up: " + evt.srcElement + " " + (time - this.lastMouseUp));
    this.preventDefaultsAndStopPropagation(evt);
    //eliminate some spurious mouse up events
    if ((time - this.lastMouseUp) > 150) {

        const p = this.getEventPoint(evt); // seems to be correct, see below
        const c = this.mouseToSVG(p.x, p.y);

        if (this.dragElement != null) {
            if (!(this.state === this.STATES.DRAGGING || this.state === this.STATES.ROTATING)) { //not dragging or rotating
                if (this.dragElement.form === 0) {
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
            if (typeof this.dragElement.cx === 'undefined') { // if not an Interactor
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
                //its a protein - drag it TODO: DRAG SELECTED
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
                if (this.dragElement.form === 0) {
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
    if (this.d3cola) {
        this.d3cola.stop();
    }

    const width = this.svgElement.parentNode.clientWidth; //this.svgElement.getBoundingClientRect().width;
    const height = this.svgElement.parentNode.clientHeight;

    if (this.acknowledgement) {
        this.acknowledgement.setAttribute("transform", "translate(5, " + (height - 40) + ")");
    }
    //// TODO: prune leaves from network then layout, then add back leaves and layout again

    const self = this;
    let nodes = Array.from(this.participants.values());
    nodes = nodes.filter(function (value) {
        return value.type !== "complex";
    });
    const nodeCount = nodes.length;

    const layoutObj = {};
    layoutObj.nodes = nodes;
    layoutObj.links = [];

    const molLookUp = {};
    let mi = 0;
    for (let mol of nodes) {
        molLookUp[mol.id] = mi;
        mi++;
    }

    const links = this.allBinaryLinks.values();
    const linkCount = links.length;
    for (let l = 0; l < linkCount; l++) {
        const link = links[l];
        const fromMol = link.interactors[0];
        const toMol = link.interactors[1];
        const source = fromMol; //molLookUp[fromMol.id];
        const target = toMol; //molLookUp[toMol.id];

        if (source !== target && nodes.indexOf(source) !== -1 && nodes.indexOf(target) !== -1) {

            if (typeof source !== "undefined" && typeof target !== "undefined") {
                const linkObj = {};
                linkObj.source = molLookUp[fromMol.id];
                linkObj.target = molLookUp[toMol.id];
                linkObj.id = link.id;
                layoutObj.links.push(linkObj);
            } else {
                alert("NOT RIGHT");
            }
        }
    }

    // todo: add containing group?
    const groups = [];
    if (this.complexes) {
        for (let g of this.complexes) {
            g.leaves = [];
            g.groups = [];
            for (let interactor of g.naryLink.interactors) {
                if (interactor.type !== "complex") {
                    g.leaves.push(layoutObj.nodes.indexOf(interactor));
                }
            }
            groups.push(g);
        }
        for (let g of this.complexes) {
            for (let interactor of g.naryLink.interactors) {
                if (interactor.type === "complex") {
                    g.groups.push(groups.indexOf(interactor));
                }
            }
        }
    }
    this.d3cola = cola.d3adaptor();
    //console.log("groups", groups);
    delete this.d3cola._lastStress;
    delete this.d3cola._alpha;
    delete this.d3cola._descent;
    delete this.d3cola._rootGroup;

    this.d3cola.nodes(layoutObj.nodes).groups(groups).links(layoutObj.links).avoidOverlaps(true);
    let groupDebugSel, participantDebugSel;
    if (self.debug) {
        groupDebugSel = d3.select(this.svgElement).selectAll(".group")
            .data(groups);

        groupDebugSel.enter().append("rect")
            .classed("group", true)
            .attr({
                rx: 5,
                ry: 5
            })
            .style("stroke", "blue")
            .style("fill", "none");

        participantDebugSel = d3.select(this.svgElement).selectAll(".node")
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

    this.d3cola.symmetricDiffLinkLengths(30).on("tick", function () {
        const nodes = self.d3cola.nodes();
        // console.log("nodes", nodes);
        for (let n = 0; n < nodeCount; n++) {
            const node = nodes[n];

            const outlineWidth = node.outline.getBBox().width;
            const upperGroupWidth = node.upperGroup.getBBox().width;

            const nx = node.bounds.x + upperGroupWidth - (outlineWidth / 2) + (width / 2);
            const ny = node.y + (height / 2);
            node.setPosition(nx, ny);
        }
        self.setAllLinkCoordinates();

        if (self.debug) {
            groupDebugSel.attr({
                x: function (d) {
                    return d.bounds.x + (width / 2);
                },
                y: function (d) {
                    return d.bounds.y + (height / 2);
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
                    return d.bounds.x + (width / 2);
                },
                y: function (d) {
                    return d.bounds.y + (height / 2);
                },
                width: function (d) {
                    return d.bounds.width();
                },
                height: function (d) {
                    return d.bounds.height();
                }
            });
        }
    });
    this.d3cola.start(20, 0, 20);
};

App.prototype.getSVG = function () {
    let svgXml = this.svgElement.outerHTML.replace(/<rect .*?\/rect>/i, ""); //take out white background fill
    const viewBox = "viewBox=\"0 0 " + this.svgElement.parentNode.clientWidth + " " + this.svgElement.parentNode.clientHeight + "\" ";
    svgXml = svgXml.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:ev=\"http://www.w3.org/2001/xml-events\" " + viewBox);

    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>" +
        "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" +
        svgXml;
};

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
};

App.prototype.checkLinks = function () {
    function checkAll(linkMap) {
        const links = linkMap.values();
        const c = links.length;
        for (let l = 0; l < c; l++) {
            links[l].check();
        }
    }
    checkAll(this.allNaryLinks);
    checkAll(this.allBinaryLinks);
    checkAll(this.allUnaryLinks);
    checkAll(this.allSequenceLinks);
};

App.prototype.setAllLinkCoordinates = function () {
    function setAll(linkMap) {
        const links = linkMap.values();
        const c = links.length;
        for (let l = 0; l < c; l++) {
            links[l].setLinkCoordinates();
        }
    }

    setAll(this.allNaryLinks);
    setAll(this.allBinaryLinks);
    setAll(this.allUnaryLinks);
    setAll(this.allSequenceLinks);
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

App.prototype.setTooltip = function (text, colour) {
    if (text) {
        this.tooltip.firstChild.data = text.toString().replace(/&(quot);/g, "\"");
        this.tooltip.setAttribute("display", "block");
        const length = this.tooltip.getComputedTextLength();
        this.tooltip_bg.setAttribute("width", length + 16);
        this.tooltip_subBg.setAttribute("width", length + 16);
        if (typeof colour !== "undefined" && colour != null) {
            this.tooltip_bg.setAttribute("fill", colour);
            this.tooltip_bg.setAttribute("stroke", colour);
            this.tooltip_bg.setAttribute("fill-opacity", "0.5");
        } else {
            this.tooltip_bg.setAttribute("fill", "white");
            this.tooltip_bg.setAttribute("stroke", "grey");
        }
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

App.prototype.legendChanged = function (colourScheme) {
    const callbacks = this.legendCallbacks;
    const count = callbacks.length;
    for (let i = 0; i < count; i++) {
        callbacks[i](colourScheme);
    }
};

/*
App.prototype.getComplexColours = function () {
    return NaryLink.naryColours;
};
*/

App.prototype.collapseAll = function () {
    const molecules = this.participants.values();
    const mCount = molecules.length;
    for (let m = 0; m < mCount; m++) {
        const molecule = molecules[m];
        if (molecule.form === 1) {
            molecule.setForm(0);
        }
    }
};

App.prototype.expandAll = function () {
    const molecules = this.participants.values();
    const mCount = molecules.length;
    for (let m = 0; m < mCount; m++) {
        const molecule = molecules[m];
        if (molecule.form === 0) {
            molecule.setForm(1);
        }
    }
};

/*
App.prototype.expandAndCollapseSelection = function(moleculesSelected) {
    const molecules = this.participants.values();
    for (let m = 0; m < molecules.length; m++) {
        const molecule = molecules[m];
        const molecule_id = molecule.json.identifier.id;
        if (moleculesSelected.includes(molecule_id)) {
            if (molecule.form === 0) {
                molecule.setForm(1);
            }
        } else if (molecule.form === 1) {
            molecule.setForm(0);
        }
    }
};
*/


