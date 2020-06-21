import * as d3 from 'd3';
import * as colorbrewer from 'colorbrewer';
import {Annotation} from './viz/interactor/annotation';
import {Feature} from './viz/feature';

export function setAnnotations (annotationChoice, /*App*/ controller) {
    controller.annotationChoice = annotationChoice;

    // proteins = participants.filter('blah') // todo

    //clear all annot's
    for (let mol of controller.participants.values()) {
        if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
            mol.clearPositionalFeatures();
        }
    }
    //controller.legendChanged(null); // todo - this isn't happening?

    let molsAnnotated = 0;
    const molCount = controller.participants.size;
    if (annotationChoice.toUpperCase() === "MI FEATURES") {
        for (let mol of controller.participants.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                mol.setPositionalFeatures(mol.miFeatures);
            }
        }
        chooseColours();
    } else if (annotationChoice.toUpperCase() === "INTERACTOR") {
        if (controller.proteinCount < 21) {
            for (let mol of controller.participants.values()) {
                if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                    const annotation = new Annotation(mol.json.label, new Feature(null, 1 + "-" + mol.size));
                    mol.setPositionalFeatures([annotation]);
                }
            }
            chooseColours();
        } else {
            alert("Too many (> 20) - can't colour by interactor.");
        }
    } else if (annotationChoice.toUpperCase() === "SUPERFAM" || annotationChoice.toUpperCase() === "SUPERFAMILY") {
        for (let mol of controller.participants.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                getSuperFamFeatures(mol.id, function (id, fts) {
                    const m = controller.participants.get(id);
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
        for (let mol of controller.participants.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                getUniProtFeatures(mol.id, function (id, fts) {
                    const m = controller.participants.get(id);
                    for (let f = 0; f < fts.length; f++) {
                        const feature = fts[f];
                        feature.seqDatum = new Feature(null, feature.begin + "-" + feature.end);
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
        const categories = new Set();
        for (let participant of controller.participants.values()) {
            if (participant.annotations) {
                for (let annotation of participant.annotations) {
                    categories.add(annotation.description);
                }
            }
        }
        let catCount = categories.size;

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

        for (let mol of controller.participants.values()) {
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
}

function extractUniprotAccession (id) {
    const uniprotAccRegex = new RegExp("[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}", "i");
    const match = uniprotAccRegex.exec(id);
    return match[0];
}

function fetchUniProtJson (id, callback) {
        const url = "https://www.ebi.ac.uk/proteins/api/proteins/" + extractUniprotAccession(id);
        d3.json(url, function (txt) {
            callback(id, txt);
        });
}

// function getSequence (id, callback) {
//     fetchUniProtJson(id, function (noNeed, json) {
//         callback(id, json.sequence.replace(/[^A-Z]/g, ""));
//     });
// }

function getUniProtFeatures (id, callback) {
    fetchUniProtJson(id, function (id, json) {
        callback(id, json.features.filter(function (ft) {
            return ft.type === "DOMAIN";
        }));
    });
}

function getSuperFamFeatures (id, callback) {
        const url = "https://supfam.mrc-lmb.cam.ac.uk/SUPERFAMILY/cgi-bin/das/up/features?segment=" + extractUniprotAccession(id);
        d3.xml(url, function (xml) {
            //~ console.log(dasXml);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(new XMLSerializer().serializeToString(xml), "text/xml");
            const features = [];
            const xmlFeatures = xmlDoc.getElementsByTagName("FEATURE");
            const featureCount = xmlFeatures.length;
            for (let f = 0; f < featureCount; f++) {
                const xmlFeature = xmlFeatures[f];
                const type = xmlFeature.getElementsByTagName("TYPE")[0]; //might need to watch for text nodes getting mixed in here
                const category = type.getAttribute("category");
                if (category === "miscellaneous") {
                    const name = type.getAttribute("id");
                    const start = xmlFeature.getElementsByTagName("START")[0].textContent;
                    const end = xmlFeature.getElementsByTagName("END")[0].textContent;
                    features.push(new Annotation(name, new Feature(null, start + "-" + end)));
                }
            }
            //~ console.log(JSON.stringify(features));
            callback(id, features);
        });
}
