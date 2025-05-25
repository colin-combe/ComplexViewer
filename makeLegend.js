// you can use code below as template to make legend from json
function makeLegend(json, divId) {
    const div = document.getElementById(divId);
    div.textContent = "";
    const colorTable = document.createElement("table");
    for (let majorClass in json) {
        const tr = colorTable.insertRow();
        const headerCell = tr.insertCell();
        headerCell.textContent = majorClass;
        headerCell.colSpan = 3;
        for (let legendEntry of json[majorClass]) {
            const tr = colorTable.insertRow();
            if (legendEntry.certain && legendEntry.uncertain) {
                const tc1 = tr.insertCell();
                tc1.style.backgroundColor = legendEntry.certain.color;
                tc1.style.width = "45px";
                const tc2 = tr.insertCell();
                const color = legendEntry.uncertain.color
                tc2.style.background = "repeating-linear-gradient(45deg, #ffffff, #ffffff 6px, "+color+" 6px, "+color+" 12px)";
                tc2.style.width = "45px";
            }
            else if (legendEntry.certain) {
                const tc1 = tr.insertCell();
                tc1.style.backgroundColor = legendEntry.certain.color;
                tc1.style.width = "90px";
                tc1.colSpan = 2;
            }
            else if (legendEntry.uncertain) {
                const tc1 = tr.insertCell();
                const color = legendEntry.uncertain.color
                tc1.style.background = "repeating-linear-gradient(45deg, #ffffff, #ffffff 6px, "+color+" 6px, "+color+" 12px)";
                tc1.style.width = "90px";
                tc1.colSpan = 2;
            }
            const tc3 = tr.insertCell();
            tc3.style.paddingLeft = "10px";
            tc3.textContent = legendEntry.name;
        }
    }
    div.appendChild(colorTable);
}