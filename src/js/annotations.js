import * as d3 from "d3";
import * as colorbrewer from "colorbrewer";
import {Annotation} from "./viz/interactor/annotation";
import {Feature} from "./viz/feature";

export function setAnnotations (annotationChoice, /*App*/ controller) {
    controller.annotationChoice = annotationChoice;
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
                storage.getSuperFamFeatures(mol.id, function (id, fts) {
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
                storage.getUniProtFeatures(mol.id, function (id, fts) {
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
        const categories = d3.set();
        for (let mol of controller.participants.values()) {
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

const storage = {};
storage.accessionFromId = function (id) {
    let idRegex;
    // i cant figure out way to do this purely with regex... who cares
    if (id.indexOf("(") !== -1) { //id has participant number in it
        idRegex = /uniprotkb_(.*)(\()/;
    } else {
        idRegex = /uniprotkb_(.*)/;
    }
    const match = idRegex.exec(id);
    if (match) {
        return match[1];
    } else if (id.indexOf("|") !== -1) {
        //following reads swiss-prot style identifiers
        return id.split("|")[1];
    } else {
        return id;
    }
};

storage.getUniProtTxt = function (id, callback) {
    const accession = storage.accessionFromId(id);

    function uniprotWebService() {
        const url = "https://www.ebi.ac.uk/proteins/api/proteins/" + accession;
        d3.json(url, function (txt) {
            //~ // console.log(accession + " retrieved from UniProt.");
            //~ if(typeof(Storage) !== "undefined") {
            //~ localStorage.setItem(xiNET_Storage.ns  + "UniProtKB."+ accession, txt);
            //~ //console.log(accession + " UniProt added to local storage.");
            //~ }
            callback(id, txt);
        });
    }
    uniprotWebService();
};

storage.getSequence = function (id, callback) {
    //~ var accession = xiNET_Storage.accessionFromId(id);
    storage.getUniProtTxt(id, function (noNeed, json) {
        //~ var sequence = "";
        //~ var lines = txt.split('\n');
        //~ var lineCount = lines.length;
        //~ for (var l = 0; l < lineCount; l++){
        //~ var line = lines[l];
        //~ if (line.indexOf("SQ") === 0){
        //~ //sequence = line;
        //~ l++;
        //~ for (l; l < lineCount; l++){
        //~ line = lines[l];
        //~ sequence += line;
        //~ }
        //~ }
        //~ }
        callback(id, json.sequence.replace(/[^A-Z]/g, ""));
    });
};
storage.getUniProtFeatures = function (id, callback) {
    //var accession = xiNET_Storage.accessionFromId(id);
    storage.getUniProtTxt(id, function (id, json) {
        //~ var features = new Array();
        //~ var lines = txt.split('\n');
        //~ var lineCount = lines.length;
        //~ for (var l = 0; l < lineCount; l++){
        //~ var line = lines[l];
        //~ if (line.indexOf("FT") === 0){
        //~ var fields = line.split(/\s{2,}/g);
        //~ if (fields.length > 4 && fields[1] === 'DOMAIN') {
        //~ //console.log(fields[1]);fields[4].substring(0, fields[4].indexOf("."))
        //~ var name = fields[4].substring(0, fields[4].indexOf("."));
        //~ features.push(new Annotation (name, fields[2], fields[3], null, fields[4]));
        //~ }
        //~ }
        //~ }
        callback(id, json.features.filter(function (ft) {
            return ft.type === "DOMAIN";
        }));
    });
};

storage.getSuperFamFeatures = function (id, callback) {
    const accession = storage.accessionFromId(id);

    function superFamDAS() {
        const url = "https://supfam.mrc-lmb.cam.ac.uk/SUPERFAMILY/cgi-bin/das/up/features?segment=" + accession;
        d3.xml(url, function (xml) {
            parseSuperFamDAS(new XMLSerializer().serializeToString(xml));
        });
    }

    function parseSuperFamDAS(dasXml) {
        //~ console.log(dasXml);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(dasXml, "text/xml");
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
    }
    superFamDAS();
};
