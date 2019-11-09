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

var xiNET = {}; //crosslinkviewer's javascript namespace
//var RGBColor = require('rgbcolor');
var d3 = require('d3');
var colorbrewer = require('colorbrewer');
var cola = require('webcola');
var Spinner = require('spin.js');
var xiNET_Storage = require('./xiNET_Storage');
var Annotation = require('../model/interactor/Annotation');
var Interactor = require('../model/interactor/Interactor');
var Polymer = require('../model/interactor/Polymer');
var Protein = require('../model/interactor/Protein');
var BioactiveEntity = require('../model/interactor/BioactiveEntity');
var Gene = require('../model/interactor/Gene');
var DNA = require('../model/interactor/DNA');
var RNA = require('../model/interactor/RNA');
var Complex = require('../model/interactor/Complex');
var Complex_symbol = require('../model/interactor/Complex_symbol');
var InteractorSet = require('../model/interactor/MoleculeSet');
var Link = require('../model/link/Link');
var NaryLink = require('../model/link/NaryLink');
var SequenceLink = require('../model/link/SequenceLink');
var SequenceFeature = require('./../model/SequenceFeature');
var BinaryLink = require('../model/link/BinaryLink');
var UnaryLink = require('../model/link/UnaryLink');
var Expand = require('./Expand');
var Config = require('./Config');


xiNET.Controller = function(targetDiv, debug) {
    if (debug) {
        this.debug = true;
    } else {
        this.debug = false;
    }

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

    var customMenuSel = d3.select(this.el)
        .append("div").classed("custom-menu-margin", true)
        .append("div").classed("custom-menu", true)
        .append("ul");

    var self = this;
    var collapse = customMenuSel.append("li").classed("collapse", true); //.append("button");
    collapse.text("Collapse");
    collapse[0][0].onclick = function(evt) {
        self.collapseProtein(evt);
    };
    var scaleButtonsListItemSel = customMenuSel.append("li").text("Scale: ");

    this.barScales = [0.01, 0.2, 1, 2, 4, 8];
    var scaleButtons = scaleButtonsListItemSel.selectAll("ul.custom-menu")
        .data(this.barScales)
        .enter()
        .append("div")
        .attr("class", "barScale")
        .append("label");
    scaleButtons.append("span")
        .text(function(d) {
            if (d == 8) return "AA";
            else return d;
        });
    scaleButtons.append("input")
        // .attr ("id", function(d) { return d*100; })
        .attr("class", function(d) {
            return "scaleButton scaleButton_" + (d * 100);
        })
        .attr("name", "scaleButtons")
        .attr("type", "radio")
        .on("change", function(d) {
            self.preventDefaultsAndStopPropagation(d);
            self.contextMenuProt.setStickScale(d, self.contextMenuPoint);
        });

    var contextMenu = d3.select(".custom-menu-margin").node();
    contextMenu.onmouseout = function(evt) {
        var e = evt.toElement || evt.relatedTarget;
        do {
            if (e == this) return;
            e = e.parentNode;
        } while (e);
        self.contextMenuProt = null;
        d3.select(this).style("display", "none");
    };


    //create SVG elemnent
    this.svgElement = document.createElementNS(Config.svgns, "svg");
    this.svgElement.setAttribute('id', 'complexViewerSVG');

    //add listeners
    var self = this;
    this.svgElement.onmousedown = function(evt) {
        self.mouseDown(evt);
    };
    this.svgElement.onmousemove = function(evt) {
        self.mouseMove(evt);
    };
    this.svgElement.onmouseup = function(evt) {
        self.mouseUp(evt);
    };
    this.svgElement.onmouseout = function(evt) {
        self.hideTooltip(evt);
    };
    this.lastMouseUp = new Date().getTime();
    this.svgElement.ontouchstart = function(evt) {
        self.touchStart(evt);
    };
    this.svgElement.ontouchmove = function(evt) {
        self.touchMove(evt);
    };
    this.svgElement.ontouchend = function(evt) {
        self.touchEnd(evt);
    };

    //legend changed callbacks
    this.legendCallbacks = new Array();

    this.el.appendChild(this.svgElement);

    // various groups needed
    this.container = document.createElementNS(Config.svgns, "g");
    this.container.setAttribute("id", "container");

    var svg = d3.select(this.svgElement);
    this.defs = svg.append('defs');
    var pattern = this.defs.append('pattern')
        .attr('id', 'checkers_uncertain')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr("x", 0)
        .attr("y", 0)
        .attr('width', 10)
        .attr('height', 10);

    pattern.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 5)
        .attr("height", 5)
        .style("fill", "#A01284");
    pattern.append('rect')
        .attr("x", 5)
        .attr("y", 5)
        .attr("width", 5)
        .attr("height", 5)
        .style("fill", "#A01284");
    //markers
    var data = [{
        id: 1,
        name: 'diamond',
        path: 'M 0,-7.0710768 L  0,7.0710589 L 7.0710462,0  z',
        viewbox: '-15 -15 25 25',
        transform: 'scale(1.5) translate(-5,0)',
        color: 'black'
    }];

    var marker = this.defs.selectAll('marker')
        .data(data)
        .enter()
        .append('svg:marker')
        .attr('id', function(d) {
            return 'marker_' + d.name;
        })
        .attr('markerHeight', 15)
        .attr('markerWidth', 15)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('orient', 'auto')
        .attr('refX', 0)
        .attr('refY', 0)
        .attr('viewBox', function(d) {
            return d.viewbox;
        })
        .append('svg:path')
        .attr('d', function(d) {
            return d.path;
        })
        .attr('fill', function(d) {
            return d.color;
        })
        .attr('transform', function(d) {
            return d.transform;
        });

    this.acknowledgement = document.createElementNS(Config.svgns, "g");
    var ackText = document.createElementNS(Config.svgns, "text");
    ackText.innerHTML = "<a xlink:href='https://academic.oup.com/bioinformatics/article/33/22/3673/4061280' target='_blank'><tspan x='0' dy='1.2em' style='text-decoration: underline'>ComplexViewer</tspan></a><tspan x='0' dy='1.2em'>by <a xlink:href='http://rappsilberlab.org/' target='_blank'>Rappsilber Laboratory</a></tspan>"

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
    //also more repsonsive / more control if we do out own
    this.tooltip = document.createElementNS(Config.svgns, "text");
    this.tooltip.setAttribute('x', 0);
    this.tooltip.setAttribute('y', 0);
    this.tooltip.setAttribute('class', 'xlv_text');
    var tooltipTextNode = document.createTextNode('tooltip');

    this.tooltip.appendChild(tooltipTextNode);

    this.tooltip_bg = document.createElementNS(Config.svgns, "rect");
    this.tooltip_bg.setAttribute('class', 'tooltip_bg');

    this.tooltip_bg.setAttribute('fill-opacity', 0.75);
    this.tooltip_bg.setAttribute('stroke-opacity', 1);
    this.tooltip_bg.setAttribute('stroke-width', 1);

    this.tooltip_subBg = document.createElementNS(Config.svgns, "rect");
    this.tooltip_subBg.setAttribute('fill', 'white');
    this.tooltip_subBg.setAttribute('stroke', 'white');
    this.tooltip_subBg.setAttribute('class', 'tooltip_bg');
    this.tooltip_subBg.setAttribute('opacity', 1);
    this.tooltip_subBg.setAttribute('stroke-width', 1);

    this.svgElement.appendChild(this.tooltip_subBg);
    this.svgElement.appendChild(this.tooltip_bg);
    this.svgElement.appendChild(this.tooltip);

    this.clear();
};

xiNET.Controller.prototype.clear = function() {
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

    // if we are dragging something at the moment - this will be the element that is draged
    this.dragElement = null;
    // from where did we start dragging
    this.dragStart = {};

    this.molecules = d3.map();
    this.allNaryLinks = d3.map();
    this.allBinaryLinks = d3.map();
    this.allUnaryLinks = d3.map();
    this.allSequenceLinks = d3.map();
    this.complexes = [];

    this.proteinCount = 0;
    this.maxBlobRadius = 30;
    Interactor.MAXSIZE = 100;

    this.z = 1;
    this.scores = null;
    this.selected = d3.map();
    this.selectedLinks = d3.map();

    this.hideTooltip();

    this.state = this.STATES.MOUSE_UP;
};

xiNET.Controller.prototype.collapseProtein = function(evt) {
    var p = this.contextMenuPoint; //his.getEventPoint(self.contextMenuPoint); // seems to be correct, see below
    var c = p.matrixTransform(this.container.getCTM().inverse());

    d3.select(".custom-menu-margin").style("display", "none");
    this.contextMenuProt.setForm(0, c);
    this.contextMenuProt == null;
};

//this can be done before all proteins have their sequences
xiNET.Controller.prototype.init = function() {

    this.checkLinks();

    var maxSeqLength = 0;

    var mols = this.molecules.values();
    var molCount = mols.length;
    for (var m = 0; m < molCount; m++) {
        var participant = mols[m];
        var protSize = participant.size;
        if (protSize > maxSeqLength) {
            maxSeqLength = protSize;
        }
    }
    var width = this.svgElement.parentNode.clientWidth;
    var defaultPixPerRes = ((width * 0.8) - Interactor.LABELMAXLENGTH) / maxSeqLength;

    console.log("defautPixPerRes:" + defaultPixPerRes);

    // https://stackoverflow.com/questions/12141150/from-list-of-integers-get-number-closest-to-a-given-value/12141511#12141511
    function takeClosest(myList, myNumber) {
        var bisect = d3.bisector(function(d) {
            return d;
        }).left;
        var pos = bisect(myList, myNumber);
        if (pos == 0 || pos == 1) {
            return myList[1]; // don't return smallest scale as default
        }
        if (pos == myList.length) {
            return myList[myList.length - 1]
        }
        var before = myList[pos - 1]
        return before;
    }

    this.defaultBarScale = takeClosest(this.barScales, defaultPixPerRes);
    console.log("default bar scale: " + this.defaultBarScale)

    if (this.annotationChoice) {
        xlv.setAnnotations(this.annotationChoice);
    } else {
        this.setAnnotations('MI FEATURES');
    }

    var mols = this.molecules.values();
    var molCount = mols.length;
    for (var m = 0; m < molCount; m++) {
        var prot = mols[m];
        if (prot.upperGroup) {
            this.proteinUpper.appendChild(prot.upperGroup);
            if (prot.json.type.name == "protein") {
                prot.stickZoom = this.defaultBarScale;
                prot.init();
            }
        }
    }

    if (molCount < 6) {
        for (var m = 0; m < molCount; m++) {
            var prot = mols[m];
            prot.setForm(1);
        }
    }

    this.autoLayout();

}

xiNET.Controller.prototype.setAnnotations = function(annotationChoice) {
    this.annotationChoice = annotationChoice;
    var self = this;
    //clear all annot's
    var mols = this.molecules.values();
    var molCount = mols.length;
    for (var m = 0; m < molCount; m++) {
        mols[m].clearPositionalFeatures();
    }
    this.legendChanged(null);
    // if (this.sequenceInitComplete) { //dont want to be changing annotations while still waiting on sequence
    var self = this;
    if (annotationChoice.toUpperCase() === "MI FEATURES") {
        for (m = 0; m < molCount; m++) {
            var mol = mols[m];
            if (mol.id.indexOf('uniprotkb_') === 0) { //LIMIT IT TO PROTEINS
                mol.setPositionalFeatures(mol.miFeatures);
            }
        }
        chooseColours();
    } else if (annotationChoice.toUpperCase() === "INTERACTOR") {
        if (self.proteinCount < 21) {
            for (m = 0; m < molCount; m++) {
                var mol = mols[m];
                if (mol.id.indexOf('uniprotkb_') === 0) { //LIMIT IT TO PROTEINS
                    var annotation = new Annotation(mol.json.label, new SequenceFeature(null, 1 + "-" + mol.size));
                    mol.setPositionalFeatures([annotation]);
                }
            }
            chooseColours();
        } else {
            alert("Too many (> 20) - can't colour by interactor.");
        }
    } else if (annotationChoice.toUpperCase() === "SUPERFAM" || annotationChoice.toUpperCase() === "SUPERFAMILY") {
        var molsAnnotated = 0;
        for (m = 0; m < molCount; m++) {
            var mol = mols[m];
            if (mol.id.indexOf('uniprotkb_') === 0) { //LIMIT IT TO PROTEINS //todo:fix
                xiNET_Storage.getSuperFamFeatures(mol.id, function(id, fts) {
                    var m = self.molecules.get(id);
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
        var molsAnnotated = 0;
        for (m = 0; m < molCount; m++) {
            var mol = mols[m];
            if (mol.id.indexOf('uniprotkb_') === 0) { //LIMIT IT TO PROTEINS //todo:fix
                xiNET_Storage.getUniProtFeatures(mol.id, function(id, fts) {
                    var m = self.molecules.get(id);
                    for (var f = 0; f < fts.length; f++) {
                        var feature = fts[f];
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
        // }
    }

    function chooseColours() {
        var categories = d3.set();
        for (m = 0; m < molCount; m++) {
            var mol = mols[m];
            for (var a = 0; a < mol.annotations.length; a++) {
                categories.add(mol.annotations[a].description);
            }
        }
        var catCount = categories.values().length;

        var colourScheme;
        if (catCount < 3) {
            catCount = 3;
        }
        if (catCount < 5) {
            colourScheme = d3.scale.ordinal().range(colorbrewer.Set1[4]);
        } else if (catCount < 13) {
            var reversed = colorbrewer.Set3[catCount].slice().reverse();
            colourScheme = d3.scale.ordinal().range(reversed);
        } else {
            colourScheme = d3.scale.category20();
        }

        for (m = 0; m < molCount; m++) {
            var mol = mols[m];
            for (a = 0; a < mol.annotations.length; a++) {
                var anno = mol.annotations[a];
                var colour
                if (anno.description == "No annotations") {
                    colour = "#cccccc";
                } else {
                    colour = colourScheme(anno.description);
                }
                var pattern = self.defs.append('pattern')
                    .attr('id', 'checkers_' + anno.description)
                    .classed("feature_checkers", true)
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr('width', 10)
                    .attr('height', 10);

                pattern.append('rect')
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 5)
                    .attr("height", 5)
                    .style("fill", colour);
                pattern.append('rect')
                    .attr("x", 5)
                    .attr("y", 5)
                    .attr("width", 5)
                    .attr("height", 5)
                    .style("fill", colour);
                var checkedFill = "url('#checkers_" + anno.description + "')";

                anno.fuzzyStart.setAttribute("fill", checkedFill);
                anno.fuzzyStart.setAttribute("stroke", colour);
                anno.fuzzyEnd.setAttribute("fill", checkedFill);
                anno.fuzzyEnd.setAttribute("stroke", colour);
                anno.certain.setAttribute("fill", colour);
                anno.certain.setAttribute("stroke", colour);

            }
        }
        self.legendChanged(colourScheme);
    }
};

//listeners also attached to mouse evnts by Interactor (and Rotator) and Link, those consume their events
//mouse down on svgElement must be allowed to propogate (to fire event on Prots/Links)

/**
 * Handle mousedown event.
 */
xiNET.Controller.prototype.mouseDown = function(evt) {
    //prevent default, but allow propogation
    evt.preventDefault();
    //stop force layout
    if (typeof this.d3cola !== 'undefined' && this.d3cola != null) {
        this.d3cola.stop();
    }

    var p = this.getEventPoint(evt); // seems to be correct, see below
    this.dragStart = this.mouseToSVG(p.x, p.y);

    return false;
};

// dragging/rotation/panning/selecting
xiNET.Controller.prototype.mouseMove = function(evt) {
    var p = this.getEventPoint(evt); // seems to be correct, see below
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
xiNET.Controller.prototype.mouseUp = function(evt) {
    var time = new Date().getTime();
    //console.log("Mouse up: " + evt.srcElement + " " + (time - this.lastMouseUp));
    this.preventDefaultsAndStopPropagation(evt);
    //eliminate some spurious mouse up events
    if ((time - this.lastMouseUp) > 150) {

        var p = this.getEventPoint(evt); // seems to be correct, see below
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
xiNET.Controller.prototype.getEventPoint = function(evt) {
    var p = this.svgElement.createSVGPoint();
    var element = this.svgElement.parentNode;
    var top = 0,
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
xiNET.Controller.prototype.preventDefaultsAndStopPropagation = function(evt) {
    if (evt.stopPropagation)
        evt.stopPropagation();
    if (evt.cancelBubble != null)
        evt.cancelBubble = true;
    if (evt.preventDefault)
        evt.preventDefault();
};

/**
 * Handle touchstart event.
 */
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
                    ox = protein.x;
                    oy = protein.y;
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
        } else if (this.state === this.STATES.ROTATING) {
            // Distance from mouse x and center of stick.
            var _dx = c.x - this.dragElement.cx
            // Distance from mouse y and center of stick.
            var _dy = c.y - this.dragElement.cy;
            //see http://en.wikipedia.org/wiki/Atan2#Motivation
            var centreToMouseAngleRads = Math.atan2(_dy, _dx);
            if (this.whichRotator === 0) {
                centreToMouseAngleRads = centreToMouseAngleRads + Math.PI;
            }
            var centreToMouseAngleDegrees = centreToMouseAngleRads * (360 / (2 * Math.PI));
            this.dragElement.setRotation(centreToMouseAngleDegrees);
            this.dragElement.setAllLinkCoordinates();
        } else { //not dragging or rotating yet, maybe we should start
            // don't start dragging just on a click - we need to move the mouse a bit first
            if (Math.sqrt(dx * dx + dy * dy) > (5 * this.z)) {
                this.state = this.STATES.DRAGGING;

            }
        }
    }

    //    else if (this.state ===  this.STATES.SELECTING) {
    //        this.updateMarquee(this.marquee, c);
    //    }
    else {

        // if (this.state === this.STATES.PANNING) {
        //~ xiNET.setCTM(this.container, this.container.getCTM()
        //~ .translate(c.x - this.dragStart.x, c.y - this.dragStart.y));
        // }
        // else {
        // // this.showTooltip(p);
        // }
    }
    // }
    return false;
};

// this ends all dragging and rotating
xiNET.Controller.prototype.touchEnd = function(evt) {
    this.preventDefaultsAndStopPropagation(evt);
    if (this.dragElement != null) {
        if (!(this.state === this.STATES.DRAGGING || this.state === this.STATES.ROTATING)) { //not dragging or rotating
            if (typeof this.dragElement.cx === 'undefined') { //if not protein
                //this.dragElement.showID();
            } else {
                if (this.dragElement.form === 0) {
                    this.dragElement.setForm(1);
                } else {
                    this.dragElement.setForm(0);
                }
            }
            //~ this.checkLinks();
        } else if (this.state === this.STATES.ROTATING) {
            //round protein rotation to nearest 5 degrees (looks neater)
            this.dragElement.setRotation(Math.round(this.dragElement.rotation / 5) * 5);
        } else {} //end of protein drag; do nothing
    }
    //~ else if (/*this.state !== xiNET.Controller.PANNING &&*/ evt.ctrlKey === false) {
    //~ this.clearSelection();
    //~ }
    //~
    //~ if (this.state === xiNET.Controller.SELECTING) {
    //~ clearInterval(this.marcher);
    //~ this.svgElement.removeChild(this.marquee);
    //~ }
    this.dragElement = null;
    this.whichRotator = -1;
    this.state = this.STATES.MOUSE_UP;
    return false;
};

//gets mouse position
xiNET.Controller.prototype.getTouchEventPoint = function(evt) {
    var p = this.svgElement.createSVGPoint();
    //    var rect = this.container.getBoundingClientRect();
    //   p.x = evt.clientX - rect.left;
    //    p.y = evt.clientY - rect.top;
    var element = this.svgElement.parentNode;
    var top = 0,
        left = 0;
    do {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);
    //TODO: should do equivalent for horizontal scroll also
    //~ top += getScrollTop();
    p.x = evt.touches[0].pageX - left;
    p.y = evt.touches[0].pageY - top;
    //~ var help = left;////evt.touches[0].pageX;//.toString();
    return p;
};


xiNET.Controller.prototype.autoLayout = function() {
    if (this.d3cola) {
        this.d3cola.stop();
    }

    var width = this.svgElement.parentNode.clientWidth;
    var height = this.svgElement.parentNode.clientHeight;
    this.acknowledgement.setAttribute("transform", "translate(5, " + (height - 40) + ")");

    //var molCount = this.molecules.keys().length;
    var self = this;
    var nodes = this.molecules.values();
    nodes = nodes.filter(function(value) {
        return value.type != "complex"
    });
    var nodeCount = nodes.length;

    var layoutObj = {};
    layoutObj.nodes = nodes; //[];
    layoutObj.links = [];

    // var molLookUp = {};
    // var mi = 0;
    // for (var n = 0; n < nodeCount; n++) {
    //     var mol = nodes[n];
    //     molLookUp[mol.id] = mi;
    //     mi++;
    //     var nodeObj = {};
    //     nodeObj.id = mol.id;
    //     nodeObj.x = mol.x;
    //     nodeObj.y = mol.y;
    //     nodeObj.px = mol.x;
    //     nodeObj.py = mol.y;
    //     layoutObj.nodes.push(nodeObj);
    // }

    var linkedParticipants = new Set();

    var links = this.allBinaryLinks.values();
    var linkCount = links.length;
    for (var l = 0; l < linkCount; l++) {
        var link = links[l];
        var fromMol = link.interactors[0];
        var toMol = link.interactors[1];
        var source = fromMol; //molLookUp[fromMol.id];
        var target = toMol; //molLookUp[toMol.id];

        if (source !== target && nodes.indexOf(source) != -1 && nodes.indexOf(target) != -1) {

            if (typeof source !== 'undefined' && typeof target !== 'undefined') {
                var linkObj = {};
                linkObj.source = source;
                linkObj.target = target;
                linkObj.id = link.id;
                layoutObj.links.push(linkObj);

                linkedParticipants.add(source);
                linkedParticipants.add(target);
            } else {
                alert("NOT RIGHT");
            }
        }
    }

    var groups = [];
    if (this.complexes) {
        for (var c = 0; c < this.complexes.length; c++) {
            var g = this.complexes[c];
            // if (g.form == 1) {
            g.leaves = [];
            g.groups = [];
            for (var pi = 0; pi < g.naryLink.interactors.length; pi++) {
                //var rp = this.renderedProteins.get(p.id);
                var i = layoutObj.nodes.indexOf(g.naryLink.interactors[pi]);
                if (g.naryLink.interactors[pi].type != "complex") {
                    g.leaves.push(i);
                }
                // else {
                //    console.log("?",g.naryLink.interactors[pi])
                //    g.groups.push(g.naryLink.interactors[pi]);
                // }
            }
            groups.push(g);
        }
        for (var c = 0; c < this.complexes.length; c++) {
            var g = this.complexes[c];
            // if (g.form == 1) {
            for (var pi = 0; pi < g.naryLink.interactors.length; pi++) {
                //var rp = this.renderedProteins.get(p.id);
                var i = groups.indexOf(g.naryLink.interactors[pi]);
                if (g.naryLink.interactors[pi].type == "complex") {
                    g.groups.push(i);
                }
            }
            //groups.push(g);
        }
    }
    this.d3cola = cola.d3adaptor();
    //console.log("groups", groups);
    delete this.d3cola._lastStress;
    delete this.d3cola._alpha;
    delete this.d3cola._descent;
    delete this.d3cola._rootGroup;

    this.d3cola.nodes(layoutObj.nodes).groups(groups).links(layoutObj.links).avoidOverlaps(true);

    var self = this;
    if (self.debug) {
        var groupDebugSel = d3.select(this.svgElement).selectAll('.group')
            .data(groups);

        groupDebugSel.enter().append('rect')
            .classed('group', true)
            .attr({
                rx: 5,
                ry: 5
            })
            .style('stroke', "blue")
            .style('fill', "none");

        var participantDebugSel = d3.select(this.svgElement).selectAll('.node')
            .data(layoutObj.nodes);

        participantDebugSel.enter().append('rect')
            .classed('node', true)
            .attr({
                rx: 5,
                ry: 5
            })
            .style('stroke', "red")
            .style('fill', "none");

        groupDebugSel.exit().remove();
        participantDebugSel.exit().remove();
    }

    this.d3cola.symmetricDiffLinkLengths(30).on("tick", function(e) {
        var nodes = self.d3cola.nodes();
        // console.log("nodes", nodes);
        for (var n = 0; n < nodeCount; n++) {
            var node = nodes[n];
            var mol = self.molecules.get(node.id);
            var nx = node.x + (width / 2) + 60;
            var ny = node.y + (height / 2);
            mol.setPosition(nx, ny);
        }
        self.setAllLinkCoordinates();

        if (self.debug) {
            groupDebugSel.attr({
                x: function(d) {
                    return d.bounds.x + (width / 2);
                },
                y: function(d) {
                    return d.bounds.y + (height / 2);
                },
                width: function(d) {
                    return d.bounds.width()
                },
                height: function(d) {
                    return d.bounds.height()
                }
            });

            participantDebugSel.attr({
                x: function(d) {
                    return d.bounds.x + (width / 2);
                },
                y: function(d) {
                    return d.bounds.y + (height / 2);
                },
                width: function(d) {
                    return d.bounds.width()
                },
                height: function(d) {
                    return d.bounds.height()
                }
            });
        }
    });
    this.d3cola.start(20, 0, 20);
};

xiNET.Controller.prototype.getSVG = function() {
    var svgXml = this.svgElement.outerHTML.replace(/<rect .*?\/rect>/i, ""); //take out white background fill
    var viewBox = 'viewBox="0 0 ' + this.svgElement.parentNode.clientWidth + " " + this.svgElement.parentNode.clientHeight + '" ';
    svgXml = svgXml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events" ' + viewBox);

    return '<?xml version="1.0" encoding="UTF-8" standalone=\"no\"?>' +
        "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" +
        svgXml;
}



// transform the mouse-position into a position on the svg
xiNET.Controller.prototype.mouseToSVG = function(x, y) {
    var p = this.svgElement.createSVGPoint();
    p.x = x;
    p.y = y;
    var p = p.matrixTransform(this.container.getCTM().inverse());
    return p;
};

// reads MI JSON format
xiNET.Controller.prototype.readMIJSON = function(miJson, expand) {
    //check that we've got a parsed javascript object here, not a String
    miJson = (typeof miJson === 'object') ? miJson : JSON.parse(miJson);
    miJson.data = miJson.data.reverse();
    //default is to expand
    if (typeof expand === 'undefined') {
        expand = true;
    }
    this.expand = expand; //naryLink checks this when deciding colour
    var data = miJson.data;
    var dataElementCount = data.length;
    var self = this;
    self.features = d3.map();

    var complexes = d3.map();
    var needsSequence = d3.set(); //things that need seq looked up

    //get interactors
    self.proteinCount = 0;
    self.interactors = d3.map();
    for (var n = 0; n < dataElementCount; n++) {
        if (data[n].object === 'interactor') {
            var interactor = data[n];
            self.interactors.set(interactor.id, interactor);
            if (interactor.id.indexOf('uniprotkb_') === 0) {
                self.proteinCount++;
            }
        }
    }

    expand ? readStoichExpanded() : readStoichUnexpanded();

    // loop through particpants and features
    // init binary, unary and sequence links,
    // and make needed associations between these and containing naryLink
    for (var l = 0; l < dataElementCount; l++) {
        var interaction = data[l];
        if (interaction.object === 'interaction') {
            var jsonParticipants = interaction.participants;
            var participantCount = jsonParticipants.length

            for (var pi = 0; pi < participantCount; pi++) {
                var jsonParticipant = jsonParticipants[pi];
                var features = new Array(0);
                if (jsonParticipant.features) features = jsonParticipant.features;

                var fCount = features.length;
                for (var f = 0; f < fCount; f++) { // for each feature
                    var feature = features[f];
                    var fromSequenceData = feature.sequenceData;
                    if (feature.linkedFeatures) { // if linked features
                        var linkedFeatureIDs = feature.linkedFeatures;


                        var linkedFeatureCount = linkedFeatureIDs.length;
                        for (var lfi = 0; lfi < linkedFeatureCount; lfi++) { //for each linked feature

                            // !! following is a hack, code can't deal with
                            // !! composite binding region across two different interactors
                            // break feature links to different nodes into seperate binary links
                            var toSequenceData_indexedByNodeId = d3.map();

                            var linkedFeature = self.features.get(linkedFeatureIDs[lfi])
                            var seqDataCount = linkedFeature.sequenceData.length;
                            for (var s = 0; s < seqDataCount; s++) {
                                var seqData = linkedFeature.sequenceData[s];
                                var nodeId = seqData.interactorRef;
                                if (expand) {
                                    nodeId = nodeId + '(' + seqData.participantRef + ')';
                                }
                                var toSequenceData = toSequenceData_indexedByNodeId.get(nodeId);
                                if (typeof toSequenceData === 'undefined') {
                                    toSequenceData = new Array();
                                    toSequenceData_indexedByNodeId.set(nodeId, toSequenceData);
                                }
                                toSequenceData = toSequenceData.push(seqData)
                            }

                            var countEndNodes = toSequenceData_indexedByNodeId.values().length;
                            for (var n = 0; n < countEndNodes; n++) {
                                toSequenceData = toSequenceData_indexedByNodeId.values()[n];
                                var fromInteractor = getNode(fromSequenceData[0]);
                                var toInteractor = getNode(toSequenceData[0]);
                                var link;
                                if (fromInteractor === toInteractor) {
                                    link = getUnaryLink(fromInteractor, interaction);
                                } else {
                                    link = getBinaryLink(fromInteractor, toInteractor, interaction);
                                }
                                var sequenceLink = getFeatureLink(fromSequenceData, toSequenceData, interaction);
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
    this.complexes = complexes.values()
    for (var c = 0; c < this.complexes.length; c++) {
        var complex = this.complexes[c];
        var interactionId;
        if (expand) {
            interactionId = complex.id.substring(0, complex.id.indexOf('('));
        } else {
            interactionId = complex.id;
        }
        var naryLink;
        for (var l = 0; l < dataElementCount; l++) {
            var interaction = data[l];
            if (interaction.object == "interaction" && interaction.id == interactionId) {
                var nLinkId = getNaryLinkIdFromInteraction(interaction);
                naryLink = self.allNaryLinks.get(nLinkId);
            }
        }
        complex.initInteractor(naryLink);
        naryLink.complex = complex;
    }

    //make mi features into annotations
    var features = self.features.values();
    var fCount = features.length;
    for (var f = 0; f < fCount; f++) {
        var feature = features[f];
        // add features to interactors/participants/nodes
        //console.log("FEATURE:" + feature.name, feature.sequenceData);
        var annotName = "";
        if (typeof feature.name !== 'undefined') {
            annotName += feature.name + ' ';
        }
        if (typeof feature.detmethod !== 'undefined') {
            annotName += ', ' + feature.detmethod.name;
        }
        // the id info we need is inside sequenceData att
        if (feature.sequenceData) {
            //console.log(JSON.stringify(feature, null, '\t'));
            var seqData = feature.sequenceData;
            var seqDataCount = seqData.length;
            for (var sdi = 0; sdi < seqDataCount; sdi++) {
                var seqDatum = seqData[sdi];
                var mID = seqDatum.interactorRef;
                if (expand) {
                    mID = mID + "(" + seqDatum.participantRef + ")";
                }
                var molecule = self.molecules.get(mID);
                var seqDatum = new SequenceFeature(molecule, seqDatum.pos)
                var annotation = new Annotation(annotName, seqDatum);
                if (molecule.miFeatures == null) {
                    molecule.miFeatures = new Array();
                }
                molecule.miFeatures.push(annotation);
            }
        }
    }

    self.init();

    function readStoichExpanded() {
        //get maximum stoichiometry
        var maxStoich = 0;
        for (var l = 0; l < dataElementCount; l++) {
            var interaction = data[l];
            if (interaction.object === 'interaction') {
                var participantCount = interaction.participants.length;
                for (var pi = 0; pi < participantCount; pi++) {
                    var participant = interaction.participants[pi];
                    if (participant.stoichiometry && (participant.stoichiometry - 0) > maxStoich) {
                        maxStoich = (participant.stoichiometry - 0);
                    }
                }
            }
        }
        if (maxStoich < 30) {
            miJson = Expand.matrix(miJson);
        }

        indexFeatures();

        //add naryLinks and participants
        for (var l = 0; l < dataElementCount; l++) {
            var interaction = data[l];
            if (interaction.object === 'interaction') {
                var jsonParticipants = interaction.participants;
                var participantCount = jsonParticipants.length

                //init n-ary link
                var nLinkId = interaction.id || getNaryLinkIdFromInteraction(interaction)
                var nLink = self.allNaryLinks.get(nLinkId);
                if (typeof nLink === 'undefined') {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, self);
                    self.allNaryLinks.set(nLinkId, nLink);
                    //alot of time is being spent on creating these IDs, stash them in the interaction object?
                    interaction.naryId = nLinkId;

                }
                nLink.addEvidence(interaction);

                //init participants
                for (var pi = 0; pi < participantCount; pi++) {
                    var jsonParticipant = jsonParticipants[pi];

                    var intRef = jsonParticipant.interactorRef;
                    var partRef = jsonParticipant.id;
                    var participantId = intRef + "(" + partRef + ")";
                    var participant = self.molecules.get(participantId);
                    if (typeof participant === 'undefined') {
                        var interactor = self.interactors.get(intRef);
                        participant = newInteractor(interactor, participantId, intRef);
                        self.molecules.set(participantId, participant);
                    }

                    participant.naryLinks.set(nLinkId, nLink);
                    //TODO: tidy up whats happening in NaryLink re interactor/participant terminology
                    if (nLink.interactors.indexOf(participant) === -1) {
                        nLink.interactors.push(participant);
                    }

                    if (jsonParticipant.stoichiometry && jsonParticipant.stoichiometry !== null) {
                        var interactor = self.molecules.get(participantId);
                        interactor.addStoichiometryLabel(jsonParticipant.stoichiometry);
                    }
                }
            }
        }
    };

    function newInteractor(interactor, participantId, interactorRef) {
        var participant;
        if (typeof interactor == "undefined" || interactor.type.id === 'MI:1302') {
            //must be a previously unencountered complex -
            // MI:0314 - interaction?, MI:0317 - complex? and its many subclasses

            var interactionExists = false;
            for (var l = 0; l < dataElementCount; l++) {
                var interaction = data[l];
                if (interaction.object == "interaction" && interaction.id == interactorRef) {
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
        else if (interactor.type.id === 'MI:1304' //molecule set
            ||
            interactor.type.id === 'MI:1305' //molecule set - candidate set
            ||
            interactor.type.id === 'MI:1307' //molecule set - defined set
            ||
            interactor.type.id === 'MI:1306' //molecule set - open set
        ) {
            participant = new InteractorSet(participantId, self, interactor, interactor.label);
        }
        //bioactive entities
        else if (interactor.type.id === 'MI:1100' // bioactive entity
            ||
            interactor.type.id === 'MI:0904' // bioactive entity - polysaccharide
            ||
            interactor.type.id === 'MI:0328' //bioactive entity - small mol
        ) {
            participant = new BioactiveEntity(participantId, self, interactor, interactor.label);
        }
        // proteins, peptides
        else if (interactor.type.id === 'MI:0326' || interactor.type.id === 'MI:0327') {
            participant = new Protein(participantId, self, interactor, interactor.label);
            if (typeof interactor.sequence !== 'undefined') {
                participant.setSequence(interactor.sequence);
            } else {
                //should look it up using accession number
                if (participantId.indexOf('uniprotkb') === 0) {
                    needsSequence.add(participantId);
                } else {
                    participant.setSequence("SEQUENCEMISSING");
                }
            }
        }
        //genes
        else if (interactor.type.id === 'MI:0250') {
            participant = new Gene(participantId, self, interactor, interactor.label);
        }
        //RNA
        else if (interactor.type.id === 'MI:0320' // RNA
            ||
            interactor.type.id === 'MI:0321' // RNA - catalytic
            ||
            interactor.type.id === 'MI:0322' // RNA - guide
            ||
            interactor.type.id === 'MI:0323' // RNA - heterogeneous nuclear
            ||
            interactor.type.id === 'MI:2190' // RNA - long non-coding
            ||
            interactor.type.id === 'MI:0324' // RNA - messenger
            ||
            interactor.type.id === 'MI:0679' // RNA - poly adenine
            ||
            interactor.type.id === 'MI:0608' // RNA - ribosomal
            ||
            interactor.type.id === 'MI:0611' // RNA - signal recognition particle
            ||
            interactor.type.id === 'MI:0610' // RNA - small interfering
            ||
            interactor.type.id === 'MI:0607' // RNA - small nuclear
            ||
            interactor.type.id === 'MI:0609' // RNA - small nucleolar
            ||
            interactor.type.id === 'MI:0325' // RNA - transfer
        ) {
            participant = new RNA(participantId, self, interactor, interactor.label);
        }
        //DNA
        else if (interactor.type.id === 'MI:0319' // DNA
            ||
            interactor.type.id === 'MI:0681' // DNA - double stranded
            ||
            interactor.type.id === 'MI:0680' // DNA - single stranded
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
        for (var l = 0; l < dataElementCount; l++) {
            var interaction = data[l];
            if (interaction.object === 'interaction') {
                var participantCount = interaction.participants.length;
                for (var pi = 0; pi < participantCount; pi++) {
                    var participant = interaction.participants[pi];
                    var features = new Array(0);
                    if (participant.features) features = participant.features;

                    var fCount = features.length;
                    for (var f = 0; f < fCount; f++) {
                        var feature = features[f];
                        self.features.set(feature.id, feature);
                    }
                }
            }
        }
    }

    function readStoichUnexpanded() {
        //get interactors
        var interactors = self.interactors.values();
        var interactorCount = interactors.length;
        for (var i = 0; i < interactorCount; i++) {
            var interactor = interactors[i];
            var participant;
            var participantId = interactor.id;
            participant = newInteractor(interactor, participantId);
            self.molecules.set(participantId, participant);
        }

        indexFeatures();

        //add naryLinks
        for (var l = 0; l < dataElementCount; l++) {
            var interaction = data[l];
            if (interaction.object === 'interaction') {
                var jsonParticipants = interaction.participants;
                var participantCount = jsonParticipants.length

                //init n-ary link
                var nLinkId = getNaryLinkIdFromInteraction(interaction)
                var nLink = self.allNaryLinks.get(nLinkId);
                if (typeof nLink === 'undefined') {
                    //doesn't already exist, make new nLink
                    nLink = new NaryLink(nLinkId, self);
                    self.allNaryLinks.set(nLinkId, nLink);
                }
                nLink.addEvidence(interaction);

                //~ //init participants
                for (var pi = 0; pi < participantCount; pi++) {
                    var jsonParticipant = jsonParticipants[pi];
                    var intRef = jsonParticipant.interactorRef;
                    var participantId = intRef; // + "(" + partRef + ")";
                    var participant = self.molecules.get(participantId);

                    if (typeof participant === 'undefined') {
                        //must be a previously unencountered complex
                        participant = new Complex(participantId, self);
                        complexes.set(participantId, participant);
                        self.molecules.set(participantId, participant);
                    }


                    participant.naryLinks.set(nLinkId, nLink);
                    //TODO: tidy up whats happening in NaryLink re interactor/participant terminology
                    if (nLink.interactors.indexOf(participant) === -1) {
                        nLink.interactors.push(participant);
                    }
                    //temp - to give sensible info when stoich collapsed
                    var interactor = self.molecules.get(participantId);
                    interactor.stoich = interactor.stoich ? interactor.stoich : 0;
                    if (jsonParticipant.stoichiometry && jsonParticipant.stoichiometry !== null) {
                        interactor.stoich = interactor.stoich + +jsonParticipant.stoichiometry;
                    } else {
                        interactor.stoich = interactor.stoich + 1;
                    }
                }

                var interactorArr = self.molecules.values();
                var iCount = interactorArr.length
                for (var ii = 0; ii < iCount; ii++) {
                    var int = interactorArr[ii];
                    int.addStoichiometryLabel(int.stoich);
                }

            }
        }

    };


    function getNaryLinkIdFromInteraction(interaction) {
        if (interaction.naryId) {
            return interaction.naryId;
        }
        var jsonParticipants = interaction.participants;
        var participantCount = jsonParticipants.length

        var pIDs = d3.set(); //used to eliminate duplicates
        //make id
        for (var pi = 0; pi < participantCount; pi++) {
            var pID = jsonParticipants[pi].interactorRef;
            if (expand) {
                pID = pID + "(" + jsonParticipants[pi].id + ")";
            }
            pIDs.add(pID);
        }

        return pIDs.values().sort().join('-');
    };

    function getNode(seqDatum) {
        var id = seqDatum.interactorRef;
        if (expand) {
            id = id + '(' + seqDatum.participantRef + ')';
        }
        return self.molecules.get(id);
    }

    function getFeatureLink(fromSeqData, toSeqData, interaction) {
        function seqDataToString(seqData) {
            var nodeIds = d3.set(); //used to eliminate duplicates
            //make id
            for (var s = 0; s < seqData.length; s++) {
                var seq = seqData[s];
                var id = seq.interactorRef;
                if (expand) {
                    id = id + '(' + seq.participantRef + ')';
                }
                id = id + ':' + seq.pos;
                nodeIds.add(id);
            }
            //sort ids
            return nodeIds.values().sort().join(';');
        }


        var start = seqDataToString(fromSequenceData);
        var end = seqDataToString(toSequenceData);
        var seqLinkId, endsSwapped;
        if (start < end) {
            seqLinkId = start + '><' + end;
            endsSwapped = false;
        } else {
            seqLinkId = end + '><' + start;
            endsSwapped = true;
        }
        var sequenceLink = self.allSequenceLinks.get(seqLinkId);
        if (typeof sequenceLink === 'undefined') {
            var fromFeaturePositions = new Array();
            var seqDatumCount = fromSeqData.length;
            for (var i = 0; i < seqDatumCount; i++) {
                fromFeaturePositions.push(new SequenceFeature(getNode(fromSeqData[i]), fromSeqData[i].pos));
            }
            var toFeaturePositions = new Array();
            seqDatumCount = toSeqData.length;
            for (i = 0; i < seqDatumCount; i++) {
                toFeaturePositions.push(new SequenceFeature(getNode(toSeqData[i]), toSeqData[i].pos));
            }
            //~ if (endsSwapped === false) {
            sequenceLink = new SequenceLink(seqLinkId, fromFeaturePositions, toFeaturePositions, self, interaction);
            //~ }else {
            //~ sequenceLink = new SequenceLink(seqLinkId, toFeaturePositions, fromFeaturePositions, self, interaction);
            //~ }
            self.allSequenceLinks.set(seqLinkId, sequenceLink);
        }

        sequenceLink.addEvidence(interaction);
        var nLinkId = getNaryLinkIdFromInteraction(interaction);
        var nLink = self.allNaryLinks.get(nLinkId);
        nLink.sequenceLinks.set(seqLinkId, sequenceLink);
        return sequenceLink;
    };

    function getUnaryLink(interactor, interaction) {
        var linkID = '-' + interactor.id + '-' + interactor.id
        var link = self.allUnaryLinks.get(linkID);
        if (typeof link === 'undefined') {
            link = new UnaryLink(linkID, self, interactor);
            self.allUnaryLinks.set(linkID, link);
            interactor.selfLink = link;
        }
        var nLinkId = getNaryLinkIdFromInteraction(interaction);
        var nLink = self.allNaryLinks.get(nLinkId);
        nLink.unaryLinks.set(linkID, link);
        link.addEvidence(interaction);
        return link;
    };

    function getBinaryLink(sourceInteractor, targetInteractor, interaction) {
        var linkID, fi, ti;
        // these links are undirected and should have same ID regardless of which way round
        // source and target are
        if (sourceInteractor.id < targetInteractor.id) {
            linkID = '-' + sourceInteractor.id + '-' + targetInteractor.id;
            fi = sourceInteractor;
            ti = targetInteractor;
        } else {
            linkID = "-" + targetInteractor.id + '-' + sourceInteractor.id;
            fi = targetInteractor;
            ti = sourceInteractor;
        }
        var link = self.allBinaryLinks.get(linkID);
        if (typeof link === 'undefined') {
            link = new BinaryLink(linkID, self, fi, ti);
            fi.binaryLinks.set(linkID, link);
            ti.binaryLinks.set(linkID, link);
            self.allBinaryLinks.set(linkID, link);
        }
        var nLinkId = getNaryLinkIdFromInteraction(interaction);
        var nLink = self.allNaryLinks.get(nLinkId);
        nLink.binaryLinks.set(linkID, link);
        link.addEvidence(interaction);
        return link;
    }
};

xiNET.Controller.prototype.checkLinks = function() {
    function checkAll(linkMap) {
        var links = linkMap.values();
        var c = links.length;
        for (var l = 0; l < c; l++) {
            links[l].check();
        }
    }

    checkAll(this.allNaryLinks);
    checkAll(this.allBinaryLinks);
    checkAll(this.allUnaryLinks);
    checkAll(this.allSequenceLinks);
};

xiNET.Controller.prototype.setAllLinkCoordinates = function() {
    function setAll(linkMap) {
        var links = linkMap.values();
        var c = links.length;
        for (var l = 0; l < c; l++) {
            links[l].setLinkCoordinates();
        }
    }
    setAll(this.allNaryLinks);
    setAll(this.allBinaryLinks);
    setAll(this.allUnaryLinks);
    setAll(this.allSequenceLinks);
};

xiNET.Controller.prototype.showTooltip = function(p) {
    var ttX, ttY;
    var length = this.tooltip.getComputedTextLength() + 16;
    var width = this.svgElement.parentNode.clientWidth;
    var height = this.svgElement.parentNode.clientHeight;
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

xiNET.Controller.prototype.setTooltip = function(text, colour) {
    if (text) {
        this.tooltip.firstChild.data = text.toString().replace(/&(quot);/g, '"');
        this.tooltip.setAttribute("display", "block");
        var length = this.tooltip.getComputedTextLength();
        this.tooltip_bg.setAttribute("width", length + 16);
        this.tooltip_subBg.setAttribute("width", length + 16);
        if (typeof colour !== 'undefined' && colour != null) {
            this.tooltip_bg.setAttribute('fill', colour);
            this.tooltip_bg.setAttribute('stroke', colour);
            this.tooltip_bg.setAttribute('fill-opacity', '0.5');
        } else {
            this.tooltip_bg.setAttribute('fill', 'white');
            this.tooltip_bg.setAttribute('stroke', 'grey');
        }
        this.tooltip_bg.setAttribute('height', 28);
        this.tooltip_subBg.setAttribute('height', 28);
        this.tooltip_bg.setAttribute("display", "block");
        this.tooltip_subBg.setAttribute("display", "block");
    } else {
        this.hideTooltip();
    }
};

xiNET.Controller.prototype.hideTooltip = function(evt) {
    this.tooltip.setAttribute("display", "none");
    this.tooltip_bg.setAttribute("display", "none");
    this.tooltip_subBg.setAttribute("display", "none");
};

xiNET.Controller.prototype.legendChanged = function(colourScheme) {
    var callbacks = this.legendCallbacks;
    var count = callbacks.length;
    for (var i = 0; i < count; i++) {
        callbacks[i](colourScheme);
    }
}

xiNET.Controller.prototype.getComplexColours = function() {
    return NaryLink.naryColours;
};

xiNET.Controller.prototype.collapseAll = function() {
    var molecules = this.molecules.values();
    var mCount = molecules.length;
    for (var m = 0; m < mCount; m++) {
        var molecule = molecules[m];
        if (molecule.form === 1) {
            molecule.setForm(0);
        }
    }
};

xiNET.Controller.prototype.expandAll = function() {
    var molecules = this.molecules.values();
    var mCount = molecules.length;
    for (var m = 0; m < mCount; m++) {
        var molecule = molecules[m];
        if (molecule.form === 0) {
            molecule.setForm(1);
        }
    }
};

xiNET.Controller.prototype.expandAndCollapseSelection = function(moleculesSelected) {
    const molecules = this.molecules.values();
    for (var m = 0; m < molecules.length; m++) {
        var molecule = molecules[m];
        var molecule_id = molecule.json.identifier.id;
        if (moleculesSelected.includes(molecule_id)) {
            if (molecule.form === 0) {
                molecule.setForm(1);
            }
        } else if (molecule.form === 1) {
            molecule.setForm(0);
        }
    }
};

module.exports = xiNET.Controller;
