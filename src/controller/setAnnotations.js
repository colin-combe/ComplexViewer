//// TODO: move set annotations code

"use strict";

const d3 = require("d3");
const colorbrewer = require("colorbrewer");
const xiNET_Storage = require("./xiNET_Storage");
const Annotation = require("../model/interactor/Annotation");
const SequenceFeature = require("./../model/SequenceFeature");

const setAnnotations = function (annotationChoice, controller) {
    controller.annotationChoice = annotationChoice;
    //clear all annot's
    for (let mol of controller.molecules.values()) {
        if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS // todo - is this best way to check if protein
            mol.clearPositionalFeatures();
        }
    }
    controller.legendChanged(null); // todo - this isn't happening?

    let molsAnnotated = 0;
    const molCount = controller.molecules.size;
    if (annotationChoice.toUpperCase() === "MI FEATURES") {
        for (let mol of controller.molecules.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                mol.setPositionalFeatures(mol.miFeatures);
            }
        }
        chooseColours();
    } else if (annotationChoice.toUpperCase() === "INTERACTOR") {
        if (controller.proteinCount < 21) {
            for (let mol of controller.molecules.values()) {
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
        for (let mol of controller.molecules.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                xiNET_Storage.getSuperFamFeatures(mol.id, function (id, fts) {
                    const m = controller.molecules.get(id);
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
        for (let mol of controller.molecules.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                xiNET_Storage.getUniProtFeatures(mol.id, function (id, fts) {
                    const m = controller.molecules.get(id);
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
        for (let mol of controller.molecules.values()) {
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

        for (let mol of controller.molecules.values()) {
            if (mol.annotations) {
                for (let anno of mol.annotations) {
                    let colour;
                    if (anno.description === "No annotations") {
                        colour = "#cccccc";
                    } else {
                        colour = colourScheme(anno.description);
                    }

                    //ToDO - way more of these are being created than needed
                    controller.createHatchedFill("checkers_" + anno.description, colour);
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
        controller.legendChanged(colourScheme);
    }
};

module.exports = setAnnotations;