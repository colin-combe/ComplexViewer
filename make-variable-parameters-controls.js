function makeVariableParametersControls(varpars, divSelector, app) {
    console.log("varpars -", varpars);

    const varparsDiv = document.getElementById(divSelector);
    if (!varparsDiv) {
        console.error(`No element found with selector: ${divSelector}`);
        return;
    }

    varparsDiv.innerHTML = '<p>Variable Parameters:</p>';

    function makeRadioButton(id, text) {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "varpar-value";
        radio.value = id;

        radio.addEventListener("change", (event) => {
                app.onlyShowInteractionWithId(event.target.value);
            }
        );
        const label = document.createElement("label");
        label.style.display = "block";
        label.appendChild(radio);
        label.appendChild(document.createTextNode(text));
        return label;
    }

    for (const [id, text] of varpars.entries()) {
        varparsDiv.appendChild(makeRadioButton(id, text));
    }
    
    varparsDiv.appendChild(makeRadioButton(null, "ALL INTERACTIONS"));

}