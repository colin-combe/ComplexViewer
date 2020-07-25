//import * as RGBColor from "rgbcolor";

export function update(/*HTMLDivElement*/ div, /*App*/app) {
    div.textContent = "";

    const complexColorScheme = app.getComplexColors();
    const complexColorTable = document.createElement("table");
    complexColorTable.classList.add("color-key", "complex-colors");
    const th = complexColorTable.createTHead();
    th.textContent = "Complexes";
    const ccDomain = complexColorScheme.domain();
    const ccRange = complexColorScheme.range();
    for (let i = 0; i < ccDomain.length; i++) {
        const tr = complexColorTable.insertRow();
        const tc1 = tr.insertCell();
        tc1.style.backgroundColor = ccRange[i % 6];
        const tc2 = tr.insertCell();
        tc2.textContent = ccDomain[i];
        //console.log(i + " " + ccDomain[i] + " " + ccRange[i]);
    }
    div.appendChild(complexColorTable);

    const featureColorScheme = app.getFeatureColors();
    if (featureColorScheme) {
        for (let [annotationSet, shown] of app.annotationSetsShown){
            if (shown){
                const featureColorTable = document.createElement("table");
                featureColorTable.classList.add("color-key", "feature-colors");
                const th2 = featureColorTable.createTHead();
                th2.textContent = annotationSet;
                const dupCheck = new Set();
                for (let p of app.participants.values()){
                    if (p.type === "protein"){
                        var annos = p.annotationSets.get(annotationSet);
                        if (annos) {
                            for (let anno of annos) {
                                const desc = anno.description;
                                if (!dupCheck.has(desc)) {
                                    dupCheck.add(desc);
                                    const tr = featureColorTable.insertRow();
                                    const tc1 = tr.insertCell();
                                    tc1.style.backgroundColor = featureColorScheme(desc);
                                    const tc2 = tr.insertCell();
                                    tc2.textContent = desc;
                                }
                            }
                        }
                    }
                }
                // const domain = featureColorScheme.domain();
                // const range = featureColorScheme.range();
                // for (let i = 0; i < domain.length; i++) {
                //     const tr = featureColorTable.insertRow();
                //     const tc1 = tr.insertCell();
                //     // make transparent version of color
                //     //const temp = new RGBColor(range[i % 20]).;
                //     tc1.style.backgroundColor = range[i % 20];//"rgba(" + temp.r + "," + temp.g + "," + temp.b + ", 0.6)";
                //     const tc2 = tr.insertCell();
                //     tc2.textContent = domain[i];
                // }
                div.appendChild(featureColorTable);

            }
        }
    }
}