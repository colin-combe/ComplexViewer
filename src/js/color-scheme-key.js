import * as RGBColor from "rgbcolor";

export function update(/*HTMLDivElement*/ div, /*App*/app) {
    div.textContent = '';

    const complexColorScheme = app.getComplexColors();
    const complexColorTable = document.createElement('table');
    complexColorTable.classList.add('color_key', 'complex_colors');
    const th = complexColorTable.createTHead();
    th.textContent = 'Complexes';
    const ccDomain = complexColorScheme.domain();
    const ccRange = complexColorScheme.range();
    for (let i = 0; i < ccDomain.length; i++) {
        const tr = complexColorTable.insertRow();
        const tc1 = tr.insertCell();
        tc1.style.backgroundColor = ccRange[i % 6];
        const tc2 = tr.insertCell();
        tc2.textContent = ccDomain[i];
        console.log(i + ' ' + ccDomain[i] + ' ' + ccRange[i]);
    }
    div.appendChild(complexColorTable);

    const featureColorScheme = app.getFeatureColors();
    if (featureColorScheme) {
        const featureColorTable = document.createElement('table');
        featureColorTable.classList.add('color_key', 'feature_colors');
        const th2 = featureColorTable.createTHead();
        th2.textContent = 'Features';
        const domain = featureColorScheme.domain();
        const range = featureColorScheme.range();
        for (let i = 0; i < domain.length; i++) {
            const tr = featureColorTable.insertRow();
            const tc1 = tr.insertCell();
            // make transparent version of color
            var temp = new RGBColor(range[i % 20]);
            const trans = 'rgba(' + temp.r + ',' + temp.g + ',' + temp.b + ', 0.6)';
            tc1.style.backgroundColor = trans;
            const tc2 = tr.insertCell();
            tc2.textContent = domain[i];
        }
        div.appendChild(featureColorTable);
    }
}