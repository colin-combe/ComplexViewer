function makeVariableParametersControls(varpars, divSelector, app) {
    console.log("varpars -", varpars);

    const varparsDiv = document.getElementById(divSelector);
    if (!varparsDiv) {
        console.error(`No element found with selector: ${divSelector}`);
        return;
    }

    varparsDiv.innerHTML = '<p>Variable Parameters:</p>';

    for (const vp of varpars.values()) {
        const vpTitle = document.createElement('p');
        vpTitle.textContent = vp.description;
        varparsDiv.appendChild(vpTitle);

        const variableValueList = vp.variableValueList?.sort((a, b) => a.order - b.order) || [];

        for (const v of variableValueList) {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'varpar-value';
            radio.value = v.value;
            radio.dataset.varparId = v.order;

            radio.addEventListener('change', (event) => {
                app.onlyShowInteractionWithId(event.target.dataset.varparId);
            }
            
            );
            const label = document.createElement('label');
            label.style.display = 'block';
            label.appendChild(radio);
            label.appendChild(document.createTextNode(`${v.value} ${vp.unit}`));
            varparsDiv.appendChild(label);
        }

    }
    
    // all interactions
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'varpar-value';
    radio.value = "ALL";
    radio.dataset.varparId = null;
    radio.checked = true;

    radio.addEventListener('change', () => {
        app.onlyShowInteractionWithId(null);
    }
    
    );
    const label = document.createElement('label');
    label.style.display = 'block';
    label.appendChild(radio);
    label.appendChild(document.createTextNode("ALL INTERACTIONS"));
    varparsDiv.appendChild(label);
    
}