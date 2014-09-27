//    	xiNET Interaction Viewer
//    	Copyright 2013 Rappsilber Laboratory
//
//    	This product includes software developed at
//    	the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//		
//		Interactor.js		
//
//		authors: Colin Combe

"use strict";

var colorbrewer = require('../../../node_modules/colorbrewer/colorbrewer');//Josh - should path for this be ../../../vendor...?
var Feature = require('./Feature');
var Config = require('../../controller/Config');

//josh - should these be moved to Config.js?
Interactor.LABELMAXLENGTH = 90; // maximal width reserved for protein-labels
Interactor.labelY = -5; //label Y offset, better if calc'd half height of label once rendered
Interactor.domainColours = d3.scale.ordinal().range(colorbrewer.Pastel1[8]);

function Interactor() {}

Interactor.prototype.toJSON = function() {
    return {
        interactor: this.json
    };
};

Interactor.prototype.mouseDown = function(evt) {
        this.ctrl.preventDefaultsAndStopPropagation(evt);//see MouseEvents.js
        //if a force layout exists then stop it
        if (this.ctrl.force) {
            this.ctrl.force.stop();
        }

        this.ctrl.dragElement = this;
        //~ if (evt.ctrlKey === false) {
            this.ctrl.clearSelection();
            this.setSelected(true);
        //~ } else {
            //~ this.setSelected(!this.isSelected);
        //~ }
        //store start location
        var p = this.ctrl.getEventPoint(evt);
        this.ctrl.dragStart = this.ctrl.mouseToSVG(p.x, p.y);
        this.showData();
        return false;
};

Interactor.prototype.touchStart = function(evt) {
           this.ctrl.preventDefaultsAndStopPropagation(evt);//see MouseEvents.js
        //if a force layout exists then stop it
        if (this.ctrl.force !== undefined) {
            this.ctrl.force.stop();
        }
        this.ctrl.dragElement = this;
        //~ if (evt.ctrlKey === false) {
            this.ctrl.clearSelection();
            this.setSelected(true);
        //~ } else {
            //~ this.setSelected(!this.isSelected);
        //~ }
        //store start location
        var p = this.ctrl.getTouchEventPoint(evt);
        this.ctrl.dragStart = this.ctrl.mouseToSVG(p.x, p.y);
        this.showData();
        return false;
};

Interactor.prototype.showData = function(evt) {
    if (document.getElementById('jsonHeading')) {	
		document.getElementById('jsonHeading').innerHTML = this.id;
	} 
    if (document.getElementById('json')) {	
		document.getElementById('json').innerHTML = 
			"<pre>" + JSON.stringify(this.json, null, ' ') + "</pre>";
	} 
}

Interactor.prototype.mouseOver = function(evt) {
        this.ctrl.preventDefaultsAndStopPropagation(evt);
        this.showHighlight(true);
        this.ctrl.setTooltip(this.id);
        return false;
};

Interactor.prototype.mouseOut = function(evt) {
        this.ctrl.preventDefaultsAndStopPropagation(evt);
        this.showHighlight(false);
        this.ctrl.hideTooltip();
        return false;
};

Interactor.prototype.getBlobRadius = function() {
    if (this.accession.indexOf("CHEBI") !== -1) {
        return 10;
    }
    else if (this.json.type.name === 'peptide' || this.json.type.name === 'single stranded deoxyribonucleic acid'){
        return 5;
    }
    else {
        return Math.sqrt(this.size / 3 / Math.PI);
    }
};

//only output the info needed to reproduce the layout
//~ Interactor.prototype.toJSON = function() {
    //~ return {
        //~ //for saved interactors
        //~ //        name: this.name,
        //~ //        accession: this.accession,
        //~ //        description: this.description,
        //~ //        sequence: this.sequence,
        //~ //        processedDAS: this.processedDAS,
        //~ //for saved layout
        //~ //        name: this.name,
        //~ x: this.x,
        //~ y: this.y,
        //~ rot: this.rotation,
        //~ form: this.form,
        //~ stickZoom: this.stickZoom,
        //~ parked: this.isParked,
        //~ flipped: this.isFlipped,
        //~ annot: this.customAnnotations
    //~ };
//~ };

Interactor.prototype.addFeature = function(feature) {
    if (typeof feature !== 'undefined') {
        var annotName = "";
        if (typeof feature.name !== 'undefined') {
            annotName += feature.name + ', ';
        }
        if (typeof feature.type !== 'undefined') {
            annotName += feature.type.name;
        }
        if (typeof feature.detmethod !== 'undefined') {
            annotName += ', ' + feature.detmethod.name;
        }
        var colour = Interactor.domainColours(feature.type.name);
        var segments = feature.sequenceData;
        var countSegments = segments.length;

        for (var i = 0; i < countSegments; i++) {
            var segment;
            if (typeof segments[i] === "string"){
				segment = segments[i];
			} else {
				segment = segments[i].pos;
			}
            var sequenceRegex = /(.+)-(.+)/;
            var match = sequenceRegex.exec(segment);
            var startRes = match[1] * 1;
            var endRes = match[2] * 1;
            if (isNaN(startRes) === false && isNaN(endRes) === false) {
//                console.log(segment.range);
//                console.log(match);
                var annotation = new Annotation(annotName, startRes, endRes, colour);
                if (this.customAnnotations == null) {
                    this.customAnnotations = new Array();
                }
                this.customAnnotations.push(annotation);
            }
        }
    }
}

Interactor.prototype.showHighlight = function(show) {
    if (show === true) {
        //~ this.highlight.setAttribute("stroke", xiNET.highlightColour.toRGB());
        this.highlight.setAttribute("stroke-opacity", "1");
    } else {
		//~ if (this.isSelected == false) {
                this.highlight.setAttribute("stroke-opacity", "0");
        //~ }
        //~ this.highlight.setAttribute("stroke", xiNET.selectedColour.toRGB());
    }
};

Interactor.prototype.setSelected = function(select) {
    if (select && this.isSelected === false) {
        this.ctrl.selected.set(this.id, this);
        this.isSelected = true;
		this.highlight.setAttribute("stroke", Config.selectedColour);
		this.highlight.setAttribute("stroke-opacity", "1");
    }
    else if (select === false && this.isSelected === true) {
        this.ctrl.selected.remove(this.id);
        this.isSelected = false;
		this.highlight.setAttribute("stroke-opacity", "0");
		this.highlight.setAttribute("stroke", Config.highlightColour);
    }
};

Interactor.prototype.getPosition = function(){
	return [this.x, this.y];
}

// more accurately described as setting transform for top svg elements (sets scale also)
Interactor.prototype.setPosition = function(x, y) {
    this.x = x;
    this.y = y;
    if (this.form === 1 && this.isParked === false){
		this.upperGroup.setAttribute("transform", "translate(" + this.x + " " + this.y + ")" 
				+ " scale(" + (this.ctrl.z) + ") " + "rotate(" + this.rotation + ")");
		this.lowerGroup.setAttribute("transform", "translate(" + this.x + " " + this.y + ")" 
				+ " scale(" + (this.ctrl.z) + ") " + "rotate(" + this.rotation + ")");
    } 
    else {
		this.upperGroup.setAttribute("transform", "translate(" + this.x + " " + this.y + ")" 
				+ " scale(" + (this.ctrl.z) + ") ");
		this.lowerGroup.setAttribute("transform", "translate(" + this.x + " " + this.y + ")" 
				+ " scale(" + (this.ctrl.z) + ") ");
		if (this.selfLink != null) {
			var selfLink = this.selfLink;
			if (typeof selfLink.thickLine !== 'undefined') {
				selfLink.thickLine.setAttribute("transform", "translate(" + this.x
						+ " " + this.y + ")" + " scale(" + (this.ctrl.z) + ")");
			}
			selfLink.line.setAttribute("transform", "translate(" + this.x
					+ " " + this.y + ")" + " scale(" + (this.ctrl.z) + ")");
			selfLink.highlightLine.setAttribute("transform", "translate(" + this.x
					+ " " + this.y + ")" + " scale(" + (this.ctrl.z) + ")");
		}
	}
};

Interactor.prototype.setParked = function(bool, svgP) {
    if (this.busy !== true) {
		if (this.isParked === true && bool == false) {
			this.isParked = false;
			if (this.form === 0) {
				this.toBlob(svgP);
			}
			else {
				this.toStick();
			}
			this.scale();
			this.setAllLinkCoordinates();
		}
		else if (this.isParked === false && bool == true) {
			this.isParked = true;
			this.toParked(svgP);
		}
	}
};

Interactor.prototype.getAggregateSelfLinkPath = function() {
	var intraR = this.getBlobRadius() + 7;
	var sectorSize = 45;
	var arcStart = Interactor.trig(intraR, 25 + sectorSize);
	var arcEnd = Interactor.trig(intraR, -25 + sectorSize);
	var cp1 = Interactor.trig(intraR, 40 + sectorSize);
	var cp2 = Interactor.trig(intraR, -40 + sectorSize);
	return 'M 0,0 ' 
		+ 'Q ' + cp1.x + ',' + -cp1.y + ' ' + arcStart.x + ',' + -arcStart.y
		+ ' A ' + intraR + ' ' + intraR + ' 0 0 1 ' + arcEnd.x + ',' + -arcEnd.y
		+ ' Q ' + cp2.x + ',' + -cp2.y + ' 0,0';
}

Interactor.rotatePointAboutPoint = function(p, o, theta) {
	theta = (theta / 360) * Math.PI * 2;
	var rx = Math.cos(theta) * (p[0]-o[0]) - Math.sin(theta) * (p[1]-o[1]) + o[0];
	var ry = Math.sin(theta) * (p[0]-o[0]) + Math.cos(theta) * (p[1]-o[1]) + o[1];
	return [rx, ry];
}

Interactor.prototype.checkLinks = function() {
    function checkAll(linkMap){
		var links = linkMap.values();
		var c = links.length;
		for (var l = 0; l < c; l++) {
			links[l].check();
		}	
	}    
    checkAll(this.naryLinks);
    checkAll(this.binaryLinks);
    checkAll(this.sequenceLinks);
    if (this.selfLink !== null) {
		this.selfLink.check();
	}
}

// update all lines (e.g after a move)
Interactor.prototype.setAllLinkCoordinates = function() {
    var links = this.naryLinks.values();
    var c = links.length;
    for (var l = 0; l < c; l++) {
		//if interactor count > 2
        links[l].setLinkCoordinates(this);
    }
    
    links = this.binaryLinks.values();
    c = links.length;
    for (var l = 0; l < c; l++) {
        links[l].setLinkCoordinates(this);
    }
    //~ 
    links = this.sequenceLinks.values();
    c = links.length;
    for (var l = 0; l < c; l++) {
        links[l].setLinkCoordinates(this);
    }    
};

//TODO: following 3 functions are used by layout and need work
Interactor.prototype.countExternalLinks = function() {
    //~ // //if (this.isParked) {
    //~ // //    return 0;
    //~ // //}
    //~ var countExternal = d3.set();
    //~ var c = this.links.keys().length;
    //~ for (var l = 0; l < c; l++) {
        //~ var link = this.links.values()[l];
        //~ for (var i = 0; i < link.interactors.length; i++) {
       //~ // // {
         //~ // //   if (link.check() === true) {
                //~ countExternal.add(link.interactors[i].id);
           //~ // //}
      //~ // //  }
		//~ }
    //~ }
    //~ return countExternal.values().length - 1;
    return this.binaryLinks.length;
};

Interactor.prototype.getSubgraph = function() {
    if (this.subgraph == null) { // don't check for undefined here
        var subgraph = {
            nodes: d3.map(),
            links: d3.map()
        };
        //if (this.isParked === false) {
            //~ this.subgraph = 
            this.addConnectedNodes(subgraph);
        //}
        this.ctrl.subgraphs.push(subgraph); 
    }
    return this.subgraph;
};

Interactor.prototype.addConnectedNodes = function(subgraph) {
	this.subgraph = subgraph;
	subgraph.nodes.set(this.id, this);
	
	var count = this.binaryLinks.values().length;
    
    for (var bi = 0; bi < count; bi++) {
		var binaryLink = this.binaryLinks.values()[bi];
        if (subgraph.links.has(binaryLink.id) === false) {
			//~ if (externalLink.check() === true) {
        	subgraph.links.set(binaryLink.id, binaryLink);
			//~ for (var i = 0; i < externalLink.interactors.length; i++) {
				var otherEnd = binaryLink.getOtherEnd(this);
				 if (otherEnd) {
					 otherEnd.addConnectedNodes(subgraph);
				 }
			//~ }
			//~ }
		}
    }
    
    //~ if (!subgraph.links.has(link.id)) {
                //~ subgraph.links.set(link.id, link);
                //~ var otherEnd;
                //~ if (link.getFromProtein() === this) {
                    //~ otherEnd = link.getToProtein();
                //~ }
                //~ else {
                    //~ otherEnd = link.getFromProtein();
                //~ }
                //~ if (otherEnd !== null) {
					//~ if (!subgraph.nodes.has(otherEnd.id)) {
						//~ subgraph.nodes.set(otherEnd.id, otherEnd);
						//~ otherEnd.subgraph = subgraph;
						//~ otherEnd.addConnectedNodes(subgraph);
					//~ }
				//~ }
            //~ }
    
    
    //~ console.debug(subgraph.nodes.keys());
};

// Pulled from Annotations.js

Interactor.prototype.setAnnotations = function(pos, group, category) {
    //clear
    while (this.circDomains.firstChild) {
        this.circDomains.removeChild(this.circDomains.firstChild);
    }
    while (this.rectDomains.firstChild) {
        this.rectDomains.removeChild(this.rectDomains.firstChild);
    }
    while (this.rectDomainsMouseEvents.firstChild) {
        this.rectDomainsMouseEvents.removeChild(this.rectDomainsMouseEvents.firstChild);
    }
    var g = this.processedDAS.get(group);
    if (pos === true) {
        if (category === 'none') {
            this.setPositionalFeatures(this.customAnnotatiuons);
        }
        else {
            if (g !== undefined) {
                var positional = g['positional'];
                if (positional !== undefined) {
                    this.setPositionalFeatures(positional.get(category));
                }
            }
        }
    }
    else {
        if (g !== undefined) {
            var keywords = g['keywords'];
            if (keywords !== undefined) {
                this.setKeywords(keywords.get(category));
            }
        }
    }
};

Interactor.prototype.setKeywords = function(keywords) {
    function trig(radius, angleDegrees) {
        //x = rx + radius * cos(theta) and y = ry + radius * sin(theta)
        var radians = (angleDegrees / 360) * Math.PI * 2;
        return {
            x: (radius * Math.cos(radians)),
            y: (radius * Math.sin(radians))
        };
    }
    
    if (keywords !== undefined && keywords !== null) {
        var numberOfKeywords = keywords.length;
        var sliceAngleDegrees = 359 / numberOfKeywords;
        for (var i = 0; i < numberOfKeywords; i++) {
            var anno = keywords[i];
            var annotPieSlice = document.createElementNS(Config.svgns, "path");
            annotPieSlice.setAttribute("class", "protein");

            //make pie slice

            var startAngle = i * sliceAngleDegrees;
            var endAngle = startAngle + sliceAngleDegrees;

            var radius = this.getBlobRadius() - 2;
            var arcStart = trig(radius, startAngle - 90);
            var arcEnd = trig(radius, endAngle - 90);
            var largeArch = 0;
            if ((endAngle - startAngle || endAngle == startAngle) > 180)
                largeArch = 1;
            annotPieSlice.setAttribute("d", "M0,0 L" + arcStart.x + "," +
                    arcStart.y + " A" + radius + "," + radius + " 0 " +
                    largeArch + ",1 " + arcEnd.x + "," + arcEnd.y + " z");

            //style 'em
            annotPieSlice.setAttribute("stroke", "none");
            var c;
            //temp
            if (anno.colour == null) { //check why == needed here
                c = new RGBColor(Interactor.domainColours(anno.name));
            }
            else {
                c = anno.colour;
            }
            annotPieSlice.setAttribute("fill", "rgb(" + c.r + "," + c.g + "," + c.b + ")");
            annotPieSlice.setAttribute("fill-opacity", "0.85");

            var text = anno.name;
            annotPieSlice.name = text;
            var xlv = this.ctrl;
            var self = this;
            annotPieSlice.onmouseover = function(evt) {
                //    for magnifier experiment
                var el = (evt.target.correspondingUseElement) ? evt.target.correspondingUseElement : evt.target;
                xlv.preventDefaultsAndStopPropagation(evt);
                xlv.setTooltip(el.name, el.getAttribute('fill'));// anno.colour);
                self.showHighlight(true);
            };
            this.circDomains.appendChild(annotPieSlice);
        }
    }
};

Interactor.prototype.setPositionalFeatures = function(posFeats) {
    this.annotations = [];
    
    if (this.circDomains) this.ctrl.emptyElement(this.circDomains);
    if (this.rectDomains) this.ctrl.emptyElement(this.rectDomains);
    
    if (posFeats !== undefined && posFeats !== null) {
        var y = -Interactor.STICKHEIGHT / 2;
        //draw longest regions first
        posFeats.sort(function(a, b) {
            return (b.end - b.start) - (a.end - a.start);
        });     
        
        for (var i = 0; i < posFeats.length; i++) {
            var anno = posFeats[i];
            anno.start = anno.start - 0;
            anno.end = anno.end - 0;
            var annotPieSlice = document.createElementNS(Config.svgns, "path");
            var annotColouredRect = document.createElementNS(Config.svgns, "path");
            
            this.annotations.push({anno:anno, pieSlice:annotPieSlice, rect:annotColouredRect});
           // alert(this.form);
            if (this.form === 0) {
                annotPieSlice.setAttribute("d", this.getAnnotationPieSliceArcPath(anno));
                annotColouredRect.setAttribute("d", this.getAnnotationPieSliceApproximatePath(anno));
            } else {
                annotPieSlice.setAttribute("d", this.getAnnotationRectPath(anno));
                annotColouredRect.setAttribute("d", this.getAnnotationRectPath(anno));
            }
            annotPieSlice.setAttribute("stroke", "none");
            annotColouredRect.setAttribute("stroke", "none");
            
            var c;
            //temp
            if (anno.colour == null) { // check == here
                if (anno.name === 'alpha_helix') {
                    c = new RGBColor('#7EB6FF88');
                }
                else if (anno.name === 'beta_strand') {
                    c = new RGBColor('#9AFF9A88');
                }
                else if (anno.name === 'turn') {
                    c = new RGBColor('#FF00AA88');
                }
                else {
                    c = new RGBColor(Interactor.domainColours(anno.name));
                }
            }
            else {
                c = anno.colour;
            }
            annotPieSlice.setAttribute("fill", "rgb(" + c.r + "," + c.g + "," + c.b + ")");
            annotPieSlice.setAttribute("fill-opacity", "1");
            annotColouredRect.setAttribute("fill", "rgb(" + c.r + "," + c.g + "," + c.b + ")");
            annotColouredRect.setAttribute("fill-opacity", "1");
            
            var text = anno.name + " [" + anno.start + " - " + anno.end + "]";
            annotPieSlice.name = text;
            //~ annotMouseEventRect.name = text;
            var xlv = this.ctrl;
            var self = this;
            annotPieSlice.onmouseover = function(evt) {
                //    for magnifier experiment
                var el = (evt.target.correspondingUseElement) ? evt.target.correspondingUseElement : evt.target;
                xlv.preventDefaultsAndStopPropagation(evt);
                xlv.setTooltip(el.name, el.getAttribute('fill'));
                self.showHighlight(true);
            };
            annotColouredRect.onmouseover = function(evt) {
                //    for magnifier experiment
                var el = (evt.target.correspondingUseElement) ? evt.target.correspondingUseElement : evt.target;
                xlv.preventDefaultsAndStopPropagation(evt);
                xlv.setTooltip(el.name, el.getAttribute('fill'));
                self.showHighlight(true);
            };
            this.circDomains.appendChild(annotPieSlice);
            if (this.rectDomains) {
                this.rectDomains.appendChild(annotColouredRect);
            }
        }
    }
};

//TODO: remove this, use rotateAboutPoint instead
Interactor.trig = function(radius, angleDegrees) {
        //x = rx + radius * cos(theta) and y = ry + radius * sin(theta)
        var radians = (angleDegrees / 360) * Math.PI * 2;
        return {
            x: (radius * Math.cos(radians)),
            y: (radius * Math.sin(radians))
        };
};
Interactor.stepsInArc = 5;

Interactor.prototype.getAnnotationPieSliceArcPath = function(annotation) {
    var startAngle = ((annotation.start - 1) / this.size) * 360;
    var endAngle = ((annotation.end - 1) / this.size) * 360;
    var radius = this.getBlobRadius() - 2;
    var arcStart = Interactor.trig(radius, startAngle - 90);
    var arcEnd = Interactor.trig(radius, endAngle - 90);
    var largeArch = 0;
    if ((endAngle - startAngle) > 180 || (endAngle == startAngle)) {
        largeArch = 1;
    }
    //~ console.debug("M0,0 L" + arcStart.x + "," + arcStart.y + " A" + radius + "," 
        //~ + radius + " 0 " + largeArch + " 1 " + arcEnd.x + "," + arcEnd.y + " Z");
    return "M0,0 L" + arcStart.x + "," + arcStart.y + " A" + radius + "," 
        + radius + " 0 " + largeArch + " 1 " + arcEnd.x + "," + arcEnd.y + " Z"; 
};

Interactor.prototype.getAnnotationPieSliceApproximatePath = function(annotation) {
    //approximate pie slice
    var startAngle = ((annotation.start - 1) / this.size) * 360;
    var endAngle = ((annotation.end) / this.size) * 360;
    var pieRadius = this.getBlobRadius() - 2;
    var arcStart = Interactor.trig(pieRadius, startAngle - 90);
    var arcEnd = Interactor.trig(pieRadius, endAngle - 90);
    var approximatePiePath = "M 0,0";
    var stepsInArc = 5;
    for (var sia = 0; sia <= Interactor.stepsInArc; sia++) {
        var angle = startAngle + ((endAngle - startAngle) * (sia / stepsInArc));
        var siaCoord = Interactor.trig(pieRadius, angle - 90);
        approximatePiePath += " L " + siaCoord.x + "," + siaCoord.y;
    }
    approximatePiePath += " L " + 0 + "," + 0;
    approximatePiePath += "  Z";
    return approximatePiePath;
};

// Interactor.prototype.getAnnotationRectPath = function(annotation) {
//     //domain as rectangle path
//     var bottom = Config.Polymer.STICKHEIGHT / 2, top = -Config.Polymer.STICKHEIGHT / 2;
//     var annotX =  ((annotation.start - 0.5) - (this.size/2)) * Config.Polymer.UNITS_PER_RESIDUE;//this.getResXUnzoomed(annotation.start - 0.5);
//     //~ //Ouch!! Without brackets following may do string concatenation
//     var annotSize = (1 + (annotation.end - annotation.start));
//     var annotLength = annotSize * Config.Polymer.UNITS_PER_RESIDUE;
//     var rectPath = "M " + annotX + "," + bottom;
//     for (var sia = 0; sia <= Interactor.stepsInArc; sia++) {
//         var step = annotX + (annotLength * (sia / Interactor.stepsInArc));
//         rectPath += " L " + step + "," + top;
//     }       
//     rectPath +=  " L " + (annotX  + annotLength)+ "," + bottom 
//         + " Z";
//     return rectPath;
// };

module.exports = Interactor;
