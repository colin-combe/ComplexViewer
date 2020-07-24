import * as d3 from "d3";
import * as d3_chromatic from "d3-scale-chromatic";
import {Annotation} from "./viz/interactor/annotation";
import {SequenceDatum} from "./viz/sequence-datum";


//todo - cache annotations in memory
export function fetchAnnotations(/*App*/ app, callback) {
    // we only show annotations on proteins
    const proteins = Array.from(app.participants.values()).filter(function (value) {
        return value.type === "protein";
    });

    let protsAnnotated = 0;
    const molCount = proteins.length;

    for (let prot of proteins) {
        getSuperFamFeatures(prot, function () {
            protsAnnotated++;
            if (protsAnnotated === molCount) {
                callback();
            }
        });
        getUniProtFeatures(prot, function () {
            protsAnnotated++;
            if (protsAnnotated === molCount) {
                callback();
            }
        });
    }
}

function extractUniprotAccession(id) {
    const uniprotAccRegex = new RegExp("[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}", "i");
    const match = uniprotAccRegex.exec(id);
    return match[0];
}

function getUniProtFeatures(prot, callback) {
    const url = "https://www.ebi.ac.uk/proteins/api/proteins/" + extractUniprotAccession(prot.id);
    d3.json(url, function (json) {
        let annotations = prot.annotationSets.get("UNIPROTKB");
        if (typeof annotations === "undefined") {
            annotations = [];
            prot.annotationSets.set("UNIPROTKB", annotations);
        }
        var uniprotJsonFeatures = json.features.filter(function (ft) {
            return ft.type === "DOMAIN";
        });
        for (let feature of uniprotJsonFeatures) {
            const anno = new Annotation(feature.description, new SequenceDatum(null, feature.begin + "-" + feature.end));
            // feature.seqDatum = new SequenceDatum(null, feature.begin + "-" + feature.end);
            annotations.push(anno);
        }
        // prot.showHighlight(true);
        callback();
    });
}

function getSuperFamFeatures(prot, callback) {
    const url = "https://supfam.mrc-lmb.cam.ac.uk/SUPERFAMILY/cgi-bin/das/up/features?segment=" + extractUniprotAccession(prot.id);
    d3.xml(url, function (xml) {
        let annotations = prot.annotationSets.get("SUPERFAMILY");
        if (typeof annotations === "undefined") {
            annotations = [];
            prot.annotationSets.set("SUPERFAMILY", annotations);
        }
        const xmlDoc = new DOMParser().parseFromString(new XMLSerializer().serializeToString(xml), "text/xml");
        const xmlFeatures = xmlDoc.getElementsByTagName("FEATURE");
        for (let xmlFeature of xmlFeatures) {
            const type = xmlFeature.getElementsByTagName("TYPE")[0]; //might need to watch for text nodes getting mixed in here
            const category = type.getAttribute("category");
            if (category === "miscellaneous") {
                const name = type.getAttribute("id");
                const start = xmlFeature.getElementsByTagName("START")[0].textContent;
                const end = xmlFeature.getElementsByTagName("END")[0].textContent;
                annotations.push(new Annotation(name, new SequenceDatum(null, start + "-" + end)));
            }
        }
        //~ console.log(JSON.stringify(features));
        // prot.showHighlight(true);
        callback();
    });
}

export function chooseColors(app) {
    const categories = new Set();
    for (let participant of app.participants.values()) {
        for (let [annotationType, annotationSet] of participant.annotationSets) {
            if (app.annotationSetsShown.get(annotationType) === true) {
                for (let annotation of annotationSet.values()) {
                    categories.add(annotation.description);
                }
            }
        }
    }

    let colorScheme;
    if (categories.size < 11) {
        colorScheme = d3.scale.ordinal().range(d3_chromatic.schemeTableau10);//colorbrewer.Dark2[catCount].slice().reverse());
    } else {
        colorScheme = d3.scale.category20();
    }

    for (let participant of app.participants.values()) {
        for (let [annotationType, annotations] of participant.annotationSets) {
            if (app.annotationSetsShown.get(annotationType) === true) {
                for (let anno of annotations) {

                    let color;
                    if (anno.description === "No annotations") {
                        color = "#eeeeee";
                    } else {
                        color = colorScheme(anno.description);
                    }

                    //ToDO - way more of these are being created than needed
                    app.createHatchedFill("checkers_" + anno.description + "_" + color.toString(), color);
                    const checkedFill = "url('#checkers_" + anno.description + "_" + color.toString() + "')";
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
    }

    app.featureColors = colorScheme;
}