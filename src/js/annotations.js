import * as d3 from "d3";
import * as colorbrewer from "colorbrewer";
import {Annotation} from "./viz/interactor/annotation";
import {SequenceDatum} from "./viz/sequence-datum";


//todo - cache annotations in memory
export function setAnnotations (annotationChoice, /*App*/ app) {
    app.annotationChoice = annotationChoice;

    // proteins = participants.filter('blah') // todo

    //clear all annot's
    for (let mol of app.participants.values()) {
        if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
            mol.clearPositionalFeatures();
        }
    }
    //app.legendChanged(null); // todo - this isn't happening?

    let molsAnnotated = 0;
    const molCount = app.participants.size;
    if (annotationChoice.toUpperCase() === "MI FEATURES") {
        for (let mol of app.participants.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                mol.setPositionalFeatures(mol.miFeatures);
            }
        }
        chooseColors();
    } else if (annotationChoice.toUpperCase() === "INTERACTOR") {
        if (app.proteinCount < 21) {
            for (let mol of app.participants.values()) {
                if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                    const annotation = new Annotation(mol.json.label, new SequenceDatum(null, 1 + "-" + mol.size));
                    mol.setPositionalFeatures([annotation]);
                }
            }
            chooseColors();
        } else {
            alert("Too many (> 20) - can't color by interactor.");
        }
    } else if (annotationChoice.toUpperCase() === "SUPERFAM" || annotationChoice.toUpperCase() === "SUPERFAMILY") {
        for (let mol of app.participants.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                getSuperFamFeatures(mol.id, function (id, fts) {
                    const m = app.participants.get(id);
                    m.setPositionalFeatures(fts);
                    molsAnnotated++;
                    if (molsAnnotated === molCount) {
                        chooseColors();
                    }
                });
            } else {
                molsAnnotated++;
                if (molsAnnotated === molCount) {
                    chooseColors();
                }
            }
        }
    } else if (annotationChoice.toUpperCase() === "UNIPROT" || annotationChoice.toUpperCase() === "UNIPROTKB") {
        for (let mol of app.participants.values()) {
            if (mol.id.indexOf("uniprotkb_") === 0) { //LIMIT IT TO PROTEINS
                getUniProtFeatures(mol.id, function (id, fts) {
                    const m = app.participants.get(id);
                    for (let f = 0; f < fts.length; f++) {
                        const feature = fts[f];
                        feature.seqDatum = new SequenceDatum(null, feature.begin + "-" + feature.end);
                    }
                    m.setPositionalFeatures(fts);
                    molsAnnotated++;
                    if (molsAnnotated === molCount) {
                        chooseColors();
                    }
                });
            } else {
                molsAnnotated++;
                if (molsAnnotated === molCount) {
                    chooseColors();
                }
            }
        }
    }

    function chooseColors() {
        const categories = new Set();
        for (let participant of app.participants.values()) {
            if (participant.annotations) {
                for (let annotation of participant.annotations) {
                    categories.add(annotation.description);
                }
            }
        }
        let catCount = categories.size;

        let colorScheme;

        if (catCount < 3) {
            catCount = 3;
        }

        if (catCount < 9) {
            colorScheme = d3.scale.ordinal().range(colorbrewer.Dark2[catCount].slice().reverse());
        // } else if (catCount < 13) {
        //     var reversed = colorbrewer.Paired[catCount];//.slice().reverse();
        //     colorScheme = d3.scale.ordinal().range(reversed);
        } else {
            colorScheme = d3.scale.category20();
        }

        for (let mol of app.participants.values()) {
            if (mol.annotations) {
                for (let anno of mol.annotations) {
                    let color;
                    if (anno.description === "No annotations") {
                        color = "#cccccc";
                    } else {
                        color = colorScheme(anno.description);
                    }

                    //ToDO - way more of these are being created than needed
                    app.createHatchedFill("checkers_" + anno.description, color);
                    const checkedFill = "url('#checkers_" + anno.description + "')";
                    if (anno.fuzzyStart) {
                        anno.fuzzyStart.setAttribute("fill", checkedFill);
                        anno.fuzzyStart.setAttribute("stroke", color);
                    }
                    if (anno.certain) {
                        anno.certain.setAttribute("fill", color);
                        anno.certain.setAttribute("stroke", color);
                    }
                    if (anno.fuzzyEnd) {
                        anno.fuzzyEnd.setAttribute("fill", checkedFill);
                        anno.fuzzyEnd.setAttribute("stroke", color);
                    }
                }
            }
        }
        app.featureColors = colorScheme;
        app.colorSchemeChanged();
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
                    features.push(new Annotation(name, new SequenceDatum(null, start + "-" + end)));
                }
            }
            //~ console.log(JSON.stringify(features));
            callback(id, features);
        });
}
