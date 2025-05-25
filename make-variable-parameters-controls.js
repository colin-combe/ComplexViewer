function makeVariableParametersControls(varpars, divSelector, app) {
    console.log("varpars -", varpars);

    const varparsDiv = document.querySelector(divSelector);
    if (!varparsDiv) {
        console.error(`No element found with selector: ${divSelector}`);
        return;
    }

    varparsDiv.innerHTML = '';

    // Create dropdown
    const select = document.createElement('select');
    select.id = 'varpars-select';
    select.classList.add('varpars-select');

    for (const key of varpars.keys()) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        select.appendChild(option);
    }

    const valuesDiv = document.createElement('div');
    varparsDiv.appendChild(select);
    varparsDiv.appendChild(valuesDiv);

    select.addEventListener('change', updateVariablesDiv);

    // Initialize with the first option's values
    updateVariablesDiv();

    function updateVariablesDiv() {
        valuesDiv.innerHTML = '';

        const selectedKey = select.value;
        const paramData = varpars.get(selectedKey);
        if (!paramData) {
            console.warn(`No data found for key: ${selectedKey}`);
            return;
        }

        const unit = paramData.unit?.names?.shortLabel ?? '';
        const values = paramData.variableValueList?.variableValue || [];

        values.forEach(value => {
            const label = document.createElement('label');
            label.style.display = 'block';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'varpar-value';
            radio.value = value.value;
            radio.dataset.id = value._id;

            radio.addEventListener('change', () => {
                // Example: call your app handler
                // app.setVariableParameterValue(selectedKey, value.value);
                alert(`Value: ${radio.value}, ID: ${radio.dataset.id}`);
                app.onlyShowInteractionWithId(radio.dataset.id);
            });

            label.appendChild(document.createTextNode(` [${value._order}] ${value.value} ${unit}`));
            label.appendChild(radio);
            valuesDiv.appendChild(label);
        });
    }
}