//    xiNET Interaction Viewer
//    Copyright 2013 Rappsilber Laboratory, University of Edinburgh
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//    author: Colin Combe
//
//    Controller.js

"use strict";

const xiNET = {};
const d3 = require("d3");
const colorbrewer = require("colorbrewer");
const cola = require("webcola");
const xiNET_Storage = require("./xiNET_Storage");
const Annotation = require("../model/interactor/Annotation");
const Interactor = require("../model/interactor/Interactor");
const Protein = require("../model/interactor/Protein");
const BioactiveEntity = require("../model/interactor/BioactiveEntity");
const Gene = require("../model/interactor/Gene");
const DNA = require("../model/interactor/DNA");
const RNA = require("../model/interactor/RNA");
const Complex = require("../model/interactor/Complex");
const Complex_symbol = require("../model/interactor/Complex_symbol");
const MoleculeSet = require("../model/interactor/MoleculeSet");
const NaryLink = require("../model/link/NaryLink");
const SequenceLink = require("../model/link/SequenceLink");
const SequenceFeature = require("./../model/SequenceFeature");
const BinaryLink = require("../model/link/BinaryLink");
const UnaryLink = require("../model/link/UnaryLink");
const Expand = require("./Expand");
const Config = require("./Config");


xiNET.Controller = function (targetDiv, debug) {
    this.debug = !!debug;

    if (typeof targetDiv === "string") {
        this.el = document.getElementById(targetDiv);
    } else {
        this.el = targetDiv;
    }

    this.STATES = {};
    this.STATES.MOUSE_UP = 0; //start state, also set when mouse up on svgElement
    this.STATES.PANNING = 1; //set by mouse down on svgElement - left button, no shift or controller
    this.STATES.DRAGGING = 2; //set by mouse down on Protein or Link
    this.STATES.ROTATING = 3; //set by mouse down on Rotator, drag?
    this.STATES.SELECTING = 4; //set by mouse down on svgElement- right button or left button shift or controller, drag

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
    this.svgElement = document.createElementNS(Config.svgns, "svg");
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
    this.container = document.createElementNS(Config.svgns, "g");
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

    this.acknowledgement = document.createElementNS(Config.svgns, "g");
    const ackText = document.createElementNS(Config.svgns, "text");
    ackText.innerHTML = "<a href='https://academic.oup.com/bioinformatics/article/33/22/3673/4061280' target='_blank'><tspan x='0' dy='1.2em' style='text-decoration: underline'>ComplexViewer</tspan></a><tspan x='0' dy='1.2em'>by <a href='http://rappsilberlab.org/' target='_blank'>Rappsilber Laboratory</a></tspan>";

    this.acknowledgement.appendChild(ackText);
    ackText.setAttribute("font-size", "12px");
    this.container.appendChild(this.acknowledgement);

    this.naryLinks = document.createElementNS(Config.svgns, "g");
    this.naryLinks.setAttribute("id", "naryLinks");
    this.container.appendChild(this.naryLinks);

    this.p_pLinksWide = document.createElementNS(Config.svgns, "g");
    this.p_pLinksWide.setAttribute("id", "p_pLinksWide");
    this.container.appendChild(this.p_pLinksWide);

    this.highlights = document.createElementNS(Config.svgns, "g");
    this.highlights.setAttribute("class", "highlights"); //interactors also contain highlight groups
    this.container.appendChild(this.highlights);

    this.res_resLinks = document.createElementNS(Config.svgns, "g");
    this.res_resLinks.setAttribute("id", "res_resLinks");
    this.container.appendChild(this.res_resLinks);

    this.p_pLinks = document.createElementNS(Config.svgns, "g");
    this.p_pLinks.setAttribute("id", "p_pLinks");
    this.container.appendChild(this.p_pLinks);

    this.proteinUpper = document.createElementNS(Config.svgns, "g");
    this.proteinUpper.setAttribute("id", "proteinUpper");
    this.container.appendChild(this.proteinUpper);

    this.selfRes_resLinks = document.createElementNS(Config.svgns, "g");
    this.selfRes_resLinks.setAttribute("id", "res_resLinks");
    this.container.appendChild(this.selfRes_resLinks);

    this.svgElement.appendChild(this.container);

    //showing title as tooltips is NOT part of svg spec (even though some browsers do this)
    //also more responsive / more control if we do out own
    this.tooltip = document.createElementNS(Config.svgns, "text");
    this.tooltip.setAttribute("x", 0);
    this.tooltip.setAttribute("y", 0);
    this.tooltip.setAttribute("class", "xlv_text");
    const tooltipTextNode = document.createTextNode("tooltip");

    this.tooltip.appendChild(tooltipTextNode);

    this.tooltip_bg = document.createElementNS(Config.svgns, "rect");
    this.tooltip_bg.setAttribute("class", "tooltip_bg");

    this.tooltip_bg.setAttribute("fill-opacity", 0.75);
    this.tooltip_bg.setAttribute("stroke-opacity", 1);
    this.tooltip_bg.setAttribute("stroke-width", 1);

    this.tooltip_subBg = document.createElementNS(Config.svgns, "rect");
    this.tooltip_subBg.setAttribute("fill", "white");
    this.tooltip_subBg.setAttribute("stroke", "white");
    this.tooltip_subBg.setAttribute("class", "tooltip_bg");
    this.tooltip_subBg.setAttribute("opacity", 1);
    this.tooltip_subBg.setAttribute("stroke-width", 1);

    this.svgElement.appendChild(this.tooltip_subBg);
    this.svgElement.appendChild(this.tooltip_bg);
    this.svgElement.appendChild(this.tooltip);

    this.clear();
};

xiNET.Controller.prototype.createHatchedFill = function (name, colour) {
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

xiNET.Controller.prototype.clear = function () {
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

    this.molecules = new Map(); // todo - rename
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

xiNET.Controller.prototype.collapseProtein = function () {
    const p = this.contextMenuPoint;
    const c = p.matrixTransform(this.container.getCTM().inverse());

    d3.select(".custom-menu-margin").style("display", "none");
    this.contextMenuProt.setForm(0, c);
    this.contextMenuProt = null;
};

//this can be done before all proteins have their sequences
xiNET.Controller.prototype.init = function () {
    this.checkLinks(); // todo - should this really be here
    let maxSeqLength = 0;
    for (let participant of this.molecules.values()) {
        if (participant.size > maxSeqLength) {
            maxSeqLength = participant.size;
        }
    }
    const width = this.svgElement.parentNode.clientWidth;
    const defaultPixPerRes = ((width * 0.8) - Interactor.LABELMAXLENGTH) / maxSeqLength;
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

    for (let participant of this.molecules.values()) {
        if (participant.upperGroup) {
            this.proteinUpper.appendChild(participant.upperGroup);
            if (participant.json.type.name === "protein") {
                participant.stickZoom = this.defaultBarScale;
                participant.init();
            }
        }
    }

    if (this.molecules.size < 4) {
        for (let participant of this.molecules.values()) {
            if (participant.json.type.name === "protein") {
                participant.toStickNoTransition();
            }
        }
    }

    this.autoLayout();
};

xiNET.Controller.prototype.setAnnotations = function (annotationChoice) {
    this.annotationChoice = annotationChoice;
    const self = this;
    //clear all annot's
    for (let mol of this.molecules.values()) {
        if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS // todo - is this best way to check if protein
            mol.clearPositionalFeatures();
        }
    }
    this.legendChanged(null);

    let molsAnnotated = 0;
    const molCount = this.molecules.size;
    if (annotationChoice.toUpperCase() === "MI FEATURES") {
        for (let mol of this.molecules.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                mol.setPositionalFeatures(mol.miFeatures);
            }
        }
        chooseColours();
    } else if (annotationChoice.toUpperCase() === "INTERACTOR") {
        if (self.proteinCount < 21) {
            for (let mol of this.molecules.values()) {
                if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                    const annotation = new Annotation(mol.json.label, new SequenceFeature(null, 1 + "-" + mol.size));
                    mol.setPositionalFeatures([annotation]);
                }
            }
            chooseColours();
        } else {
            alert("Too many (> 20) - can't colour by interactor.");
        }
    } else if (annotationChoice.toUpperCase() === "SUPERFAM" || annotationChoice.toUpperCase() === "SUPERFAMILY") {
        for (let mol of this.molecules.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                xiNET_Storage.getSuperFamFeatures(mol.id, function (id, fts) {
                    const m = self.molecules.get(id);
                    m.setPositionalFeatures(fts);
                    molsAnnotated++;
                    if (molsAnnotated === molCount) {
                        chooseColours();
                    }
                });
            } else {
                molsAnnotated++;
                if (molsAnnotated === molCount) {
                    chooseColours();
                }
            }
        }
    } else if (annotationChoice.toUpperCase() === "UNIPROT" || annotationChoice.toUpperCase() === "UNIPROTKB") {
        for (let mol of this.molecules.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                xiNET_Storage.getUniProtFeatures(mol.id, function (id, fts) {
                    const m = self.molecules.get(id);
                    for (let f = 0; f < fts.length; f++) {
                        const feature = fts[f];
                        feature.seqDatum = new SequenceFeature(null, feature.begin + "-" + feature.end);
                    }
                    m.setPositionalFeatures(fts);
                    molsAnnotated++;
                    if (molsAnnotated === molCount) {
                        chooseColours();
                    }
                });
            } else {
                molsAnnotated++;
                if (molsAnnotated === molCount) {
                    chooseColours();
                }
            }
        }
    }

    function chooseColours() {
        const categories = d3.set();
        for (let mol of self.molecules.values()) {
            if (mol.annotations) {
                for (let annotation of mol.annotations) {
                    categories.add(annotation.description);
                }
            }
        }
        let catCount = categories.values().length;

        let colourScheme;

        if (catCount < 3) {
            catCount = 3;
        }

        if (catCount < 9) {
            colourScheme = d3.scale.ordinal().range(colorbrewer.Dark2[catCount].slice().reverse());
            // } else if (catCount < 13) {
            //     var reversed = colorbrewer.Paired[catCount];//.slice().reverse();
            //     colourScheme = d3.scale.ordinal().range(reversed);
        } else {
            colourScheme = d3.scale.category20();
        }

        for (let mol of self.molecules.values()) {
            if (mol.annotations) {
                for (let anno of mol.annotations) {
                    let colour;
                    if (anno.description === "No annotations") {
                        colour = "#cccccc";
                    } else {
                        colour = colourScheme(anno.description);
                    }

                    //ToDO - way more of these are being created than needed
                    self.createHatchedFill("checkers_" + anno.description, colour);
                    const checkedFill = "url('#checkers_" + anno.description + "')";

                    anno.fuzzyStart.setAttribute("fill", checkedFill);
                    anno.fuzzyStart.setAttribute("stroke", colour);
                    anno.fuzzyEnd.setAttribute("fill", checkedFill);
                    anno.fuzzyEnd.setAttribute("stroke", colour);
                    anno.certain.setAttribute("fill", colour);
                    anno.certain.setAttribute("stroke", colour);
                }
            }
        }
        self.legendChanged(colourScheme);
    }
};

//listeners also attached to mouse events by Interactor (and Rotator) and Link, those consume their events
//mouse down on svgElement must be allowed to propogate (to fire event on Prots/Links)

/**
 * Handle mousedown event.
 */
xiNET.Controller.prototype.mouseDown = function (evt) {
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
xiNET.Controller.prototype.mouseMove = function (evt) {
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
xiNET.Controller.prototype.mouseUp = function (evt) {
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
xiNET.Controller.prototype.getEventPoint = function (evt) {
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
xiNET.Controller.prototype.preventDefaultsAndStopPropagation = function (evt) {
    if (evt.stopPropagation)
        evt.stopPropagation();
    if (evt.cancelBubble != null)
        evt.cancelBubble = true;
    if (evt.preventDefault)
        evt.preventDefault();
};

/**
 * Handle touchstart event.

 xiNET.Controller.prototype.touchStart = function(evt) {
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
 xiNET.Controller.prototype.touchMove = function(evt) {
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
xiNET.Controller.prototype.touchEnd = function(evt) {
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
xiNET.Controller.prototype.getTouchEventPoint = function(evt) {
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
xiNET.Controller.prototype.autoLayout = function () {
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
    let nodes = Array.from(this.molecules.values());
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

xiNET.Controller.prototype.getSVG = function () {
    let svgXml = this.svgElement.outerHTML.replace(/<rect .*?\/rect>/i, ""); //take out white background fill
    const viewBox = "viewBox=\"0 0 " + this.svgElement.parentNode.clientWidth + " " + this.svgElement.parentNode.clientHeight + "\" ";
    svgXml = svgXml.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:ev=\"http://www.w3.org/2001/xml-events\" " + viewBox);

    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>" +
        "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" +
        svgXml;
};

// transform the mouse-position into a position on the svg
xiNET.Controller.prototype.mouseToSVG = function (x, y) {
    const p = this.svgElement.createSVGPoint();
    p.x = x;
    p.y = y;
    return p.matrixTransform(this.container.getCTM().inverse());
};

// reads MI JSON format
xiNET.Controller.prototype.readMIJSON = function (/*mi-json-schema*/miJson, expand = true) {
    //check that we've got a parsed javascript object here, not a String
    miJson = (typeof miJson === "object") ? miJson : JSON.parse(miJson);
    miJson.data = miJson.data.reverse();

    const data = miJson.data;
    const self = this;
    self.features = d3.map();

    const complexes = d3.map();
    const needsSequence = d3.set(); //things that need seq looked up

    //get interactors
    self.proteinCount = 0;
    self.interactors = d3.map();
    for (let datum of data) {
        if (datum.object === "interactor") {
            self.interactors.set(datum.id, datum);
            if (datum.id.indexOf("uniprotkb_") === 0) { // todo - is this best way to test this?
                self.proteinCount++;
            }
        }
    }

    expand ? readStoichExpanded() : readStoichUnexpanded();

    // loop through participants and features
    // init binary, unary and sequence links,
    // and make needed associations between these and containing naryLink
    for (let datum of data) {
        if (datum.object === "interaction") {
            for (let jsonParticipant of datum.participants) {
                let features = new Array(0);
                if (jsonParticipant.features) features = jsonParticipant.features;

                for (let feature of features) { // for each feature
                    const fromSequenceData = feature.sequenceData;
                    if (feature.linkedFeatures) { // if linked features
                        const linkedFeatureIDs = feature.linkedFeatures;
                        const linkedFeatureCount = linkedFeatureIDs.length;
                        for (let lfi = 0; lfi < linkedFeatureCount; lfi++) { //for each linked feature

                            // !! following is a hack, code can't deal with
                            // !! composite binding region across two different interactors
                            // break feature links to different nodes into separate binary links
                            const toSequenceData_indexedByNodeId = d3.map();

                            const linkedFeature = self.features.get(linkedFeatureIDs[lfi]);
                            for (let seqData of linkedFeature.sequenceData) {
                                let nodeId = seqData.interactorRef;
                                if (expand) {
                                    nodeId = nodeId + "(" + seqData.participantRef + ")";
                                }
                                let toSequenceData = toSequenceData_indexedByNodeId.get(nodeId);
                                if (typeof toSequenceData === "undefined") {
                                    toSequenceData = [];
                                    toSequenceData_indexedByNodeId.set(nodeId, toSequenceData);
                                }
                                toSequenceData = toSequenceData.push(seqData);
                            }

                            for (let toSequenceData of toSequenceData_indexedByNodeId.values()) {
                                const fromInteractor = getNode(fromSequenceData[0]);
                                const toInteractor = getNode(toSequenceData[0]);
                                let link;
                                if (fromInteractor === toInteractor) {
                                    link = getUnaryLink(fromInteractor, datum);
                                } else {
                                    link = getBinaryLink(fromInteractor, toInteractor, datum);
                                }
                                const sequenceLink = getFeatureLink(fromSequenceData, toSequenceData, datum);
                                fromInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                toInteractor.sequenceLinks.set(sequenceLink.id, sequenceLink);
                                link.sequenceLinks.set(sequenceLink.id, sequenceLink);
                            }

                        } // end for each linked feature

                    } // end if linked features
                } // end for each feature
            }
        }
    }

    //init complexes
    this.complexes = complexes.values();
    for (let c = 0; c < this.complexes.length; c++) {
        const complex = this.complexes[c];
        let interactionId;
        if (expand) {
            interactionId = complex.id.substring(0, complex.id.indexOf("("));
        } else {
            interactionId = complex.id;
        }
        for (let datum of data) {
            if (datum.object === "interaction" && datum.id === interactionId) {
                const nLinkId = getNaryLinkIdFromInteraction(datum);
                const naryLink = self.allNaryLinks.get(nLinkId);
                complex.initInteractor(naryLink);
                naryLink.complex = complex;
            }
        }
    }

    //make mi features into annotations
    for (let feature of self.features.values()) {
        // add features to interactors/participants/nodes
        //console.log("FEATURE:" + feature.name, feature.sequenceData);
        let annotName = "";
        if (typeof feature.name !== "undefined") {
            annotName += feature.name + " ";
        }
        if (typeof feature.detmethod !== "undefined") {
            annotName += ", " + feature.detmethod.name;
        }
        // the id info we need is inside sequenceData att
        if (feature.sequenceData) { // todo - still needed?
            for (let seqDatum of feature.sequenceData) {
                let mID = seqDatum.interactorRef;
                if (expand) {
                    mID = mID + "(" + seqDatum.participantRef + ")";
                }
                const molecule = self.molecules.get(mID);
                const seqFeature = new SequenceFeature(molecule, seqDatum.pos);
                const annotation = new Annotation(annotName, seqFeature);
                if (molecule.miFeatures == null) {
                    molecule.miFeatures = [];
                }
                molecule.miFeatures.push(annotation);
            }
        }
    }

    self.init();

    function readStoichExpanded() {
        //get maximum stoichiometry
        let maxStoich = 0;
        for (let datum of data) {
            if (datum.object === "interaction") {
                for (let jsonParticipant of datum.participants) {
                    if (jsonParticipant.stoichiometry && (jsonParticipant.stoichiometry - 0) > maxStoich) {
                        maxStoich = (jsonParticipant.stoichiometry - 0);
                    }
                }
            }
        }
        if (maxStoich < 30) {
            miJson = Expand.matrix(miJson);
        }

        indexFeatures();

        //add naryLinks and participants
        for (let datum of data) {
            if (datum.object === "interaction") {
                //init n-ary link
                const nLinkId = datum.id || getNaryLinkIdFromInteraction(datum);
                let nLink = self.allNaryLinks.get(nLinkId);
                if (typeof nLink === "undefined") {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, self);
                    self.allNaryLinks.set(nLinkId, nLink);
                    //alot of time is being spent on creating these IDs, stash them in the interaction object?
                    datum.naryId = nLinkId;

                }
                nLink.addEvidence(datum);

                //init participants
                for (let jsonParticipant of datum.participants) {
                    const intRef = jsonParticipant.interactorRef;
                    const partRef = jsonParticipant.id;
                    const participantId = intRef + "(" + partRef + ")";
                    let participant = self.molecules.get(participantId);
                    if (typeof participant === "undefined") {
                        const interactor = self.interactors.get(intRef);
                        participant = newParticipant(interactor, participantId, intRef);
                        self.molecules.set(participantId, participant);
                    }

                    participant.naryLinks.set(nLinkId, nLink);
                    //TODO: tidy up whats happening in NaryLink re interactor/participant terminology
                    if (nLink.interactors.indexOf(participant) === -1) {
                        nLink.interactors.push(participant);
                    }

                    if (jsonParticipant.stoichiometry) {
                        const interactor = self.molecules.get(participantId);
                        interactor.addStoichiometryLabel(jsonParticipant.stoichiometry);
                    }
                }
            }
        }
    }

    function newParticipant(interactor, participantId, interactorRef) {
        let participant;
        if (typeof interactor == "undefined" || interactor.type.id === "MI:1302") {
            //must be a previously unencountered complex -
            // MI:0314 - interaction?, MI:0317 - complex? and its many subclasses

            let interactionExists = false;
            for (let datum of data) {
                if (datum.object === "interaction" && datum.id === interactorRef) {
                    interactionExists = true;
                    break;
                }
            }


            if (interactionExists) {
                participant = new Complex(participantId, self, interactorRef);
                complexes.set(participantId, participant);
            } else {
                participant = new Complex_symbol(participantId, self, interactorRef, interactor);
            }
        }
        //molecule sets
        else if (interactor.type.id === "MI:1304" //molecule set
            ||
            interactor.type.id === "MI:1305" //molecule set - candidate set
            ||
            interactor.type.id === "MI:1307" //molecule set - defined set
            ||
            interactor.type.id === "MI:1306" //molecule set - open set
        ) {
            participant = new MoleculeSet(participantId, self, interactor, interactor.label);
        }
        //bioactive entities
        else if (interactor.type.id === "MI:1100" // bioactive entity
            ||
            interactor.type.id === "MI:0904" // bioactive entity - polysaccharide
            ||
            interactor.type.id === "MI:0328" //bioactive entity - small mol
        ) {
            participant = new BioactiveEntity(participantId, self, interactor, interactor.label);
        }
        // proteins, peptides
        else if (interactor.type.id === "MI:0326" || interactor.type.id === "MI:0327") {
            participant = new Protein(participantId, self, interactor, interactor.label);
            if (typeof interactor.sequence !== "undefined") {
                participant.setSequence(interactor.sequence);
            } else {
                //should look it up using accession number
                if (participantId.indexOf("uniprotkb") === 0) {
                    needsSequence.add(participantId);
                } else {
                    participant.setSequence("SEQUENCEMISSING");
                }
            }
        }
        //genes
        else if (interactor.type.id === "MI:0250") {
            participant = new Gene(participantId, self, interactor, interactor.label);
        }
        //RNA
        else if (interactor.type.id === "MI:0320" // RNA
            ||
            interactor.type.id === "MI:0321" // RNA - catalytic
            ||
            interactor.type.id === "MI:0322" // RNA - guide
            ||
            interactor.type.id === "MI:0323" // RNA - heterogeneous nuclear
            ||
            interactor.type.id === "MI:2190" // RNA - long non-coding
            ||
            interactor.type.id === "MI:0324" // RNA - messenger
            ||
            interactor.type.id === "MI:0679" // RNA - poly adenine
            ||
            interactor.type.id === "MI:0608" // RNA - ribosomal
            ||
            interactor.type.id === "MI:0611" // RNA - signal recognition particle
            ||
            interactor.type.id === "MI:0610" // RNA - small interfering
            ||
            interactor.type.id === "MI:0607" // RNA - small nuclear
            ||
            interactor.type.id === "MI:0609" // RNA - small nucleolar
            ||
            interactor.type.id === "MI:0325" // RNA - transfer
        ) {
            participant = new RNA(participantId, self, interactor, interactor.label);
        }
        //DNA
        else if (interactor.type.id === "MI:0319" // DNA
            ||
            interactor.type.id === "MI:0681" // DNA - double stranded
            ||
            interactor.type.id === "MI:0680" // DNA - single stranded
        ) {
            participant = new DNA(participantId, self, interactor, interactor.label);
        } else {
            // MI:0329 - unknown participant ?
            // MI:0383 - biopolymer ?
            alert("Unrecognised type:" + interactor.type.name);
        }
        return participant;
    }

    function indexFeatures() {
        //create indexed collection of all features from interactions
        // - still seems like a good starting point?
        for (let datum of data) {
            if (datum.object === "interaction") {
                for (let jsonParticipant of datum.participants) {
                    let features = new Array(0);
                    if (jsonParticipant.features) features = jsonParticipant.features;

                    const fCount = features.length;
                    for (let f = 0; f < fCount; f++) {
                        const feature = features[f];
                        self.features.set(feature.id, feature);
                    }
                }
            }
        }
    }

    function readStoichUnexpanded() {
        //get interactors
        for (let interactor of self.interactors.values()) {
            const participantId = interactor.id;
            const participant = newParticipant(interactor, participantId);
            self.molecules.set(participantId, participant);
        }

        indexFeatures();

        //add naryLinks
        for (let datum of data) {
            if (datum.object === "interaction") {
                const jsonParticipants = datum.participants;
                const participantCount = jsonParticipants.length;

                //init n-ary link
                const nLinkId = getNaryLinkIdFromInteraction(datum);
                let nLink = self.allNaryLinks.get(nLinkId);
                if (typeof nLink === "undefined") {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, self);
                    self.allNaryLinks.set(nLinkId, nLink);
                }
                nLink.addEvidence(datum);

                //~ //init participants
                for (let pi = 0; pi < participantCount; pi++) {
                    const jsonParticipant = jsonParticipants[pi];
                    const intRef = jsonParticipant.interactorRef;
                    let participant = self.molecules.get(intRef);

                    if (typeof participant === "undefined") {
                        //must be a previously unencountered complex
                        participant = new Complex(intRef, self);
                        complexes.set(intRef, participant);
                        self.molecules.set(intRef, participant);
                    }


                    participant.naryLinks.set(nLinkId, nLink);
                    //TODO: tidy up whats happening in NaryLink re interactor/participant terminology
                    if (nLink.interactors.indexOf(participant) === -1) {
                        nLink.interactors.push(participant);
                    }
                    //temp - to give sensible info when stoich collapsed
                    const interactor = self.molecules.get(intRef);
                    interactor.stoich = interactor.stoich ? interactor.stoich : 0;
                    if (jsonParticipant.stoichiometry) {
                        interactor.stoich = interactor.stoich + +jsonParticipant.stoichiometry;
                    } else {
                        interactor.stoich = interactor.stoich + 1;
                    }
                }

                const interactorArr = self.molecules.values();
                const iCount = interactorArr.length;
                for (let ii = 0; ii < iCount; ii++) {
                    const int = interactorArr[ii];
                    int.addStoichiometryLabel(int.stoich);
                }

            }
        }

    }


    function getNaryLinkIdFromInteraction(interaction) {
        if (interaction.naryId) {
            return interaction.naryId;
        }
        const jsonParticipants = interaction.participants;
        const participantCount = jsonParticipants.length;

        const pIDs = d3.set(); //used to eliminate duplicates
        //make id
        for (let pi = 0; pi < participantCount; pi++) {
            let pID = jsonParticipants[pi].interactorRef;
            if (expand) {
                pID = pID + "(" + jsonParticipants[pi].id + ")";
            }
            pIDs.add(pID);
        }

        return pIDs.values().sort().join("-");
    }

    function getNode(seqDatum) {
        let id = seqDatum.interactorRef;
        if (expand) {
            id = id + "(" + seqDatum.participantRef + ")";
        }
        return self.molecules.get(id);
    }

    function getFeatureLink(fromSeqData, toSeqData, interaction) {
        function seqDataToString(seqData) {
            const nodeIds = d3.set(); //used to eliminate duplicates
            //make id
            for (let s = 0; s < seqData.length; s++) {
                const seq = seqData[s];
                let id = seq.interactorRef;
                if (expand) {
                    id = id + "(" + seq.participantRef + ")";
                }
                id = id + ":" + seq.pos;
                nodeIds.add(id);
            }
            //sort ids
            return nodeIds.values().sort().join(";");
        }


        const start = seqDataToString(fromSeqData);
        const end = seqDataToString(toSeqData);
        let seqLinkId;//, endsSwapped;
        if (start < end) {
            seqLinkId = start + "><" + end;
            //endsSwapped = false;
        } else {
            seqLinkId = end + "><" + start;
            //endsSwapped = true;
        }
        let sequenceLink = self.allSequenceLinks.get(seqLinkId);
        if (typeof sequenceLink === "undefined") {
            const fromFeaturePositions = [];
            for (let fromSeqDatum of fromSeqData) {
                fromFeaturePositions.push(new SequenceFeature(getNode(fromSeqDatum), fromSeqDatum.pos));
            }
            const toFeaturePositions = [];
            for (let toSeqDatum of toSeqData) {
                toFeaturePositions.push(new SequenceFeature(getNode(toSeqDatum), toSeqDatum.pos));
            }
            //~ if (endsSwapped === false) {
            sequenceLink = new SequenceLink(seqLinkId, fromFeaturePositions, toFeaturePositions, self, interaction);
            //~ }else {
            //~ sequenceLink = new SequenceLink(seqLinkId, toFeaturePositions, fromFeaturePositions, self, interaction);
            //~ }
            self.allSequenceLinks.set(seqLinkId, sequenceLink);
        }

        sequenceLink.addEvidence(interaction);
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = self.allNaryLinks.get(nLinkId);
        nLink.sequenceLinks.set(seqLinkId, sequenceLink);
        return sequenceLink;
    }

    function getUnaryLink(interactor, interaction) {
        const linkID = "-" + interactor.id + "-" + interactor.id;
        let link = self.allUnaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new UnaryLink(linkID, self, interactor);
            self.allUnaryLinks.set(linkID, link);
            interactor.selfLink = link;
        }
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = self.allNaryLinks.get(nLinkId);
        nLink.unaryLinks.set(linkID, link);
        link.addEvidence(interaction);
        return link;
    }

    function getBinaryLink(sourceInteractor, targetInteractor, interaction) {
        let linkID, fi, ti;
        // these links are undirected and should have same ID regardless of which way round
        // source and target are
        if (sourceInteractor.id < targetInteractor.id) {
            linkID = "-" + sourceInteractor.id + "-" + targetInteractor.id;
            fi = sourceInteractor;
            ti = targetInteractor;
        } else {
            linkID = "-" + targetInteractor.id + "-" + sourceInteractor.id;
            fi = targetInteractor;
            ti = sourceInteractor;
        }
        let link = self.allBinaryLinks.get(linkID);
        if (typeof link === "undefined") {
            link = new BinaryLink(linkID, self, fi, ti);
            fi.binaryLinks.set(linkID, link);
            ti.binaryLinks.set(linkID, link);
            self.allBinaryLinks.set(linkID, link);
        }
        const nLinkId = getNaryLinkIdFromInteraction(interaction);
        const nLink = self.allNaryLinks.get(nLinkId);
        nLink.binaryLinks.set(linkID, link);
        link.addEvidence(interaction);
        return link;
    }
};

xiNET.Controller.prototype.checkLinks = function () {
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

xiNET.Controller.prototype.setAllLinkCoordinates = function () {
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

xiNET.Controller.prototype.showTooltip = function (p) {
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

xiNET.Controller.prototype.setTooltip = function (text, colour) {
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
        this.tooltip_bg.setAttribute("height", 28);
        this.tooltip_subBg.setAttribute("height", 28);
        this.tooltip_bg.setAttribute("display", "block");
        this.tooltip_subBg.setAttribute("display", "block");
    } else {
        this.hideTooltip();
    }
};

xiNET.Controller.prototype.hideTooltip = function () {
    this.tooltip.setAttribute("display", "none");
    this.tooltip_bg.setAttribute("display", "none");
    this.tooltip_subBg.setAttribute("display", "none");
};

xiNET.Controller.prototype.legendChanged = function (colourScheme) {
    const callbacks = this.legendCallbacks;
    const count = callbacks.length;
    for (let i = 0; i < count; i++) {
        callbacks[i](colourScheme);
    }
};

xiNET.Controller.prototype.getComplexColours = function () {
    return NaryLink.naryColours;
};

xiNET.Controller.prototype.collapseAll = function () {
    const molecules = this.molecules.values();
    const mCount = molecules.length;
    for (let m = 0; m < mCount; m++) {
        const molecule = molecules[m];
        if (molecule.form === 1) {
            molecule.setForm(0);
        }
    }
};

xiNET.Controller.prototype.expandAll = function () {
    const molecules = this.molecules.values();
    const mCount = molecules.length;
    for (let m = 0; m < mCount; m++) {
        const molecule = molecules[m];
        if (molecule.form === 0) {
            molecule.setForm(1);
        }
    }
};

/*
xiNET.Controller.prototype.expandAndCollapseSelection = function(moleculesSelected) {
    const molecules = this.molecules.values();
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

module.exports = xiNET.Controller;
