function openDatasetLabels() {
    const datasetLabels = document.getElementById('datasetLabels');
    datasetLabels.style.display = 'block';
    let form = document.getElementById('datasetLabelsForm');
    form.innerHTML = '';
    let index = 0;
    for (dataset in selectedSampleInfo) {
        // Create a label
        let label = document.createElement('label');
        label.setAttribute('for', `dataset-${index}`);
        label.textContent = `Enter alternate name for ${dataset}: `;

        // Create an input field
        let input = document.createElement('input');
        input.type = 'text';
        input.id = `dataset-${index}`;
        input.name = `dataset-${index}`;
        input.placeholder = `Alternate name for ${dataset}`;

        // Append the label and input to the form
        form.appendChild(label);
        form.appendChild(input);

        // Add a line break for spacing
        form.appendChild(document.createElement('br'));
        index += 1;
    }
}

function updateDatasetLabels() {
    let form = document.getElementById('datasetLabelsForm');
    let formData = new FormData(form); // Collect form data
//    let result = {};
    let index = 0;

    // Iterate through form entries and collect values
    for (dataset in selectedSampleInfo) {
        let altName = formData.get(`dataset-${index}`);
//console.log(`dataset-${index}`);
console.log('altName ',altName);
        if (!(altName === '')) {
//            result[dataset] = altName;
            selectedSampleInfo[dataset].label = altName;
        }
        index += 1;
    }
    closeDatasetLabels();
//    console.log(result); // Log the result to the console
}

function closeDatasetLabels() {
    const datasetLabels = document.getElementById('datasetLabels');
    datasetLabels.style.display = 'none';
}

function openSampleLabels() {
    const sampleLabels = document.getElementById('sampleLabels');
    sampleLabels.style.display = 'block';
    let form = document.getElementById('sampleLabelsForm');
    form.innerHTML = '';
    let index = 0;
    for (dataset in selectedSampleInfo) {
        for (sample in selectedSampleInfo[dataset].position) {
            // Create a label
            let label = document.createElement('label');
            label.setAttribute('for', `sample-${index}`);
            label.textContent = `Enter alternate name for ${sample}: `;

            // Create an input field
            let input = document.createElement('input');
            input.type = 'text';
            input.id = `sample-${index}`;
            input.name = `sample-${index}`;
            input.placeholder = `Alternate name for ${sample}`;

            // Append the label and input to the form
            form.appendChild(label);
            form.appendChild(input);

            // Add a line break for spacing
            form.appendChild(document.createElement('br'));
            index += 1;
        }
    }
}

function updateSampleLabels() {
    let form = document.getElementById('sampleLabelsForm');
    let formData = new FormData(form); // Collect form data
//    let result = {};
    let index = 0;

    // Iterate through form entries and collect values
    for (dataset in selectedSampleInfo) {
        for (sample in selectedSampleInfo[dataset].position) {
            let altName = formData.get(`sample-${index}`);
//console.log(`sample-${index}`);
//console.log('altName ',altName);
            if (!(altName === '')) {
//                result[sample] = altName;
                selectedSampleInfo[dataset].position[sample].label = altName;
            }
            index += 1;
        }
    }
    closeSampleLabels();
//    console.log(result); // Log the result to the console
}

function closeSampleLabels() {
    const sampleLabels = document.getElementById('sampleLabels');
    sampleLabels.style.display = 'none';
}

function openChemicalSelection(sampleMeasurements) {
    const chemicalModal = document.getElementById('chemicalModal');
    chemicalModal.style.display = 'block';

    const chemicalCheckboxes = document.getElementById('chemicalCheckboxes');
    chemicalCheckboxes.innerHTML = '';

    const datesSampled = Object.keys(selectedSampleMeasurements);

    for (chemicalType in selectedSampleMeasurements[datesSampled[0]]) {
        if (chemicalType !== 'Physical Data') {
            const chemicals = Object.keys(selectedSampleMeasurements[datesSampled[0]][chemicalType].chemicals);

            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-container';

            chemicals.forEach(chemical => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `chemical`;
                checkbox.name = 'chemical';
                checkbox.value = chemical;
                checkbox.checked = true; // Initially all chemicals are checked

                const label = document.createElement('label');
                label.htmlFor = `chemical_${chemical}`;
                label.appendChild(document.createTextNode(chemical));

                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(label);
                checkboxContainer.appendChild(document.createElement('br'));
            });

            chemicalCheckboxes.appendChild(checkboxContainer);
        }
    }
}

function flipChemicalSelections(selection) {
    const checkboxes = document.querySelectorAll('#chemicalCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (selection) {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        };
    });
}

function applyChemicalFilter() {
    const containsText = document.getElementById('containsTextChemical').value.toLowerCase();
    const checkboxes = document.querySelectorAll('#chemicalCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (containsText.length > 0) {
            if (checkbox.nextSibling.textContent.toLowerCase().includes(containsText)) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        }
    });
}

function closeChemicalSelection() {
    selectChemicals();
    const chemicalModal = document.getElementById('chemicalModal');
    chemicalModal.style.display = 'none';
}

function selectChemicals() {
    const checkboxes = document.querySelectorAll('input[name="chemical"]:checked');
    const selectedChemicals = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    selectedSampleMeasurements = getSelectedChemicalSampleMeasurements(selectedChemicals);
    selectedSampleInfo = getSelectedChemicalSampleInfo(selectedChemicals);
    updateChart();
}

function getSelectedChemicalSampleMeasurements(selectedChemicals) {
    selectedMeas = {};
    for (dateSampled in selectedSampleMeasurements) {
        for (const chemicalType in selectedSampleMeasurements[dateSampled]) {
            if ('Physical Data' != chemicalType) {
                for (const chemical in selectedSampleMeasurements[dateSampled][chemicalType].chemicals) {
                    if (selectedChemicals.includes(chemical)) {
                        // Put here as if no chemicals selected then don't need chemical type
                        if (!selectedMeas[dateSampled]) {
                            selectedMeas[dateSampled] = {};
                        }
                        if (!(chemicalType in selectedMeas[dateSampled])) {
                            selectedMeas[dateSampled][chemicalType] = {};
                            selectedMeas[dateSampled][chemicalType].chemicals = {};
                            if (chemicalType == 'PAH data') {
                                // Just copy all common data even if only 1 PAH is selected
                                selectedMeas[dateSampled][chemicalType].gorhamTest = sampleMeasurements[dateSampled][chemicalType].gorhamTest;
                                selectedMeas[dateSampled][chemicalType].total = sampleMeasurements[dateSampled][chemicalType].total;
                                selectedMeas[dateSampled][chemicalType].totalHC = sampleMeasurements[dateSampled][chemicalType].totalHC;
                                selectedMeas[dateSampled][chemicalType].totalHCUnit = sampleMeasurements[dateSampled][chemicalType].totalHCUnit;
                            }
                            if (chemicalType == 'PCB data') {
                                //console.log('Create ', dateSampled, chemicalType,'Gorham Test');
/*                                selectedMeas[dateSampled][chemicalType].congenerTest = {};
                                selectedMeas[dateSampled][chemicalType].congenerTest[sample] = sampleMeasurements[dateSampled][chemicalType].congenerTest[sample];*/
//                                selectedMeas[dateSampled][chemicalType].congenerTest = {};
                                selectedMeas[dateSampled][chemicalType].congenerTest = sampleMeasurements[dateSampled][chemicalType].congenerTest;
                                selectedMeas[dateSampled][chemicalType].total = sampleMeasurements[dateSampled][chemicalType].total;
                            }
                        }
                        selectedMeas[dateSampled][chemicalType].chemicals[chemical] = sampleMeasurements[dateSampled][chemicalType].chemicals[chemical];
                    }
                }
            }
        }
    }
    for (dateSampled in selectedMeas) {
        if ('Physical Data' in sampleMeasurements[dateSampled]){
            selectedMeas[dateSampled]['Physical Data'] = sampleMeasurements[dateSampled]['Physical Data']
        }
    }
    return selectedMeas;
}

function getSelectedChemicalSampleInfo(selectedChemicals) {
    selectedSamps = {};
    for (const dateSampled in selectedSampleMeasurements) {
        selectedSamps[dateSampled] = {};
        selectedSamps[dateSampled]['Date sampled'] = sampleInfo[dateSampled]['Date sampled'];
        selectedSamps[dateSampled].fileURL = sampleInfo[dateSampled].fileURL;
        selectedSamps[dateSampled].Applicant = sampleInfo[dateSampled].Applicant;
        selectedSamps[dateSampled]['Application number'] = sampleInfo[dateSampled]['Application number'];
        selectedSamps[dateSampled]['Application title'] = sampleInfo[dateSampled]['Application title'];
        selectedSamps[dateSampled]['label'] = sampleInfo[dateSampled]['label'];
        for (const chemicalType in selectedSampleMeasurements[dateSampled]) {
            if (!('position' in selectedSamps[dateSampled])) {
console.log('setting up position');
                selectedSamps[dateSampled].position = {};
            }
            if ('Physical Data' != chemicalType) {
console.log('getting positions',chemicalType,chemical);
                for (const chemical in selectedSampleMeasurements[dateSampled][chemicalType].chemicals) {
                    if (selectedChemicals.includes(chemical)) {
                        for (const sample in selectedSampleMeasurements[dateSampled][chemicalType].chemicals[chemical].samples) {
                            selectedSamps[dateSampled].position[sample] = selectedSampleInfo[dateSampled].position[sample];
                        }
                    }
                }
            }
        }
    }
    return selectedSamps;
}

function openDatasetSelection(selectedSampleMeasurements) {
    const sampleModal = document.getElementById('datasetModal');
    sampleModal.style.display = 'block';

}

function yourapplyDatasetFilter() {
    const sampleModal = document.getElementById('datasetModal');
    sampleModal.style.display = 'none';

    let sheetsToSelect = {}; // Use an object
    for (let i = 0; i < dataSheetNames.length; i++) {
        let sheetName = dataSheetNames[i]; // Declare sheetName with let
        sheetsToSelect[sheetName] = document.getElementById(dataSheetNamesCheckboxes[i] + 'set').checked;
    }

    console.log(sheetsToSelect);
    console.log(Object.keys(sheetsToSelect));

    let datasetsToKeep = {}; // Use an object
    for (let dateSelected in selectedSampleInfo) {
        datasetsToKeep[dateSelected] = true;

        for (let sheetName in sheetsToSelect) {
            if (sheetsToSelect[sheetName]) {
                console.log(sheetName);

                if (!(sheetName in selectedSampleMeasurements[dateSelected])) {
                    datasetsToKeep[dateSelected] = false;
                    console.log(dateSelected, ' has no ', sheetName);
                    break;
                }
            }
        }
        console.log(dateSelected, ' has ', sheetName);
    }

    console.log(datasetsToKeep);

    selectedSampleInfo = {};
    selectedSampleMeasurements = {};

    for (let dateSelected in datasetsToKeep) {
        if (datasetsToKeep[dateSelected]) {
            selectedSampleInfo[dateSelected] = sampleInfo[dateSelected];
            selectedSampleMeasurements[dateSelected] = sampleMeasurements[dateSelected];
        }
    }
    
    updateChart();
}

function applyDatasetFilter() {
    const sampleModal = document.getElementById('datasetModal');
    sampleModal.style.display = 'none';
    let sheetsToSelect = {};
    for (let i = 0; i < dataSheetNames.length; i++) {
        //sheetName = dataSheetNames[i];
        sheetsToSelect[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]+'set').checked ? true : false; // Check the checkbox state
    }
//console.log(sheetsToSelect);
//console.log(Object.keys(sheetsToSelect));
    let datasetsToKeep = {};
    for (let dateSelected in selectedSampleInfo) {
        datasetsToKeep[dateSelected] = true;
        for (let sheetName in sheetsToSelect) {
//console.log(sheetName);
            if (sheetsToSelect[sheetName]) {
//console.log(sheetName);
                if (!(sheetName in selectedSampleMeasurements[dateSelected])) {
                    datasetsToKeep[dateSelected] = false;
//console.log(dateSelected,' has no ',sheetName);
                    break;
                }
//                keepInfo = sampleInfo[dateSelected];
//                keepSample = sampleMeasurements[dateSelected]
            }
        }
//console.log(dateSelected,' has ',sheetName);
    }
//console.log(datasetsToKeep);
    selectedSampleInfo = {};
    selectedSampleMeasurements = {};
    for (let dateSelected in datasetsToKeep) {
        if (datasetsToKeep[dateSelected]) {
            selectedSampleInfo[dateSelected] = sampleInfo[dateSelected];
            selectedSampleMeasurements[dateSelected] = sampleMeasurements[dateSelected];
        }
    }
    updateChart();
}
    

function openSampleSelection(sampleMeasurements) {
    const sampleModal = document.getElementById('sampleModal');
    sampleModal.style.display = 'block';

    const sampleCheckboxes = document.getElementById('sampleCheckboxes');
    sampleCheckboxes.innerHTML = '';

    //    const datesSampled = Object.keys(sampleInfo);
    const datesSampled = Object.keys(selectedSampleInfo);


    datesSampled.sort();
    datesSampled.forEach(dateSampled => {

        //    for (dateSampled in sampleInfo) {
        const samples = Object.keys(selectedSampleInfo[dateSampled].position);
        samples.sort();
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';

        samples.forEach(sample => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `sample_${dateSampled + ': ' + sample}`;
            checkbox.name = 'sample';
            checkbox.value = dateSampled + ': ' + sample;
            checkbox.checked = true; // Initially all samples are checked

            const label = document.createElement('label');
            label.htmlFor = `sample_${sample}`;
            label.appendChild(document.createTextNode(dateSampled + ': ' + sample));

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            checkboxContainer.appendChild(document.createElement('br'));
        });

        sampleCheckboxes.appendChild(checkboxContainer);
    });
}

function flipSampleSelections(selection) {
    const checkboxes = document.querySelectorAll('#sampleCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (selection) {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        };
    });
}

/*function selectHighlighted(selection) {
    const checkboxes = document.querySelectorAll('#sampleCheckboxes input[type="checkbox"]');
    index = 0;
    //        for (ds in selectedSampleInfo) {
    //            for (s in selectedSampleInfo[ds]) {
    checkboxes.forEach(checkbox => {
        checkbox.checked = highlighted[index];
        index += 1;
    });
    //            }
    //        }
}*/

function selectHighlighted(selection) {
    // 1. Create the master list of all samples and sort it EXACTLY as in createHighlights.
    // This list correctly corresponds to the indices in the 'highlighted' array.
    const masterSampleList = [];
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.forEach(date => {
        const samplesForDate = Object.keys(selectedSampleInfo[date].position);
        samplesForDate.forEach(sampleName => {
            masterSampleList.push(date + ': ' + sampleName);
        });
    });
    masterSampleList.sortComplexSamples(); // Use the same custom sort function

    // 2. Get all checkboxes from the modal.
    const checkboxes = document.querySelectorAll('#sampleCheckboxes input[type="checkbox"]');

    // 3. Create a map of checkboxes by their value (which is the unique sample ID) for fast lookups.
    const checkboxMap = new Map();
    checkboxes.forEach(cb => checkboxMap.set(cb.value, cb));

    // 4. Iterate through the master sorted list. For each sample, check if it should be highlighted.
    masterSampleList.forEach((sampleId, index) => {
        const checkbox = checkboxMap.get(sampleId);
        if (checkbox) {
            // Use the index from the sorted list to check the 'highlighted' array.
            // This ensures the correct checkbox is updated.
            checkbox.checked = highlighted[index] || false; // Default to false if undefined
        }
    });
}

function applySampleFilter() {
    let sheetsToSelect = [];
    selectBySheet = false;
    for (i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
console.log('sheetName',sheetName,dataSheetNamesCheckboxes[i]);
        sheetsToSelect[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]+'sample').checked ? true : false; // Check the checkbox state
        if (sheetsToSelect[dataSheetNames[i]]) {
            selectBySheet = true;
        }
    }
    const checkboxes = document.querySelectorAll('#sampleCheckboxes input[type="checkbox"]');
    const checkboxesIn = document.querySelectorAll('input[name="sample"]:checked');
//console.log(checkboxes,checkboxesIn);
//console.log(Object.keys(checkboxes));
let checkboxesNames = [];
for (let i = 0; i < checkboxes.length; i++) {
    checkboxesNames[i] = checkboxes[i].value;
}
    if (selectBySheet) {
        index = 0;
        samplesToKeep = {};
//        for (const sheetName in sheetsToSelect) {
//            for (const dateSelected in selectedSampleMeasurements) {
        for (const dateSelected in selectedSampleMeasurements) {
            for (const sample in selectedSampleInfo[dateSelected].position) {
//a            for (const sample in sampleInfo[dateSelected].position) {
                samplesToKeep[dateSelected + ': ' + sample] = true;
            }
            for (const sheetName in sheetsToSelect) {
//console.log('Should I check for',sheetName);
                if (sheetsToSelect[sheetName]) {
//console.log('I should check for',sheetName);
                    if (sheetName in selectedSampleMeasurements[dateSelected]) {
//console.log(dateSelected,'has',sheetName,'so setting all false');
                        for (const sample in selectedSampleInfo[dateSelected].position) {
//a                        for (const sample in sampleInfo[dateSelected].position) {
                                samplesToKeep[dateSelected + ': ' + sample] = false;
                            }
                            for (const chemical in selectedSampleMeasurements[dateSelected][sheetName].chemicals) {
                                for (const sample in selectedSampleMeasurements[dateSelected][sheetName].chemicals[chemical].samples) {
//console.log(dateSelected,sheetName,chemical);
/*                                    if (sample === 'CSA 2.00') {
        index += 1;
        console.log(index,sample,chemical);
    }*/
                                    if (!samplesToKeep[dateSelected + ': ' + sample]) {
                                        if (selectedSampleMeasurements[dateSelected][sheetName].chemicals[chemical].samples[sample] > 0) {
//console.log('keeping',dateSelected,sample);
                                            samplesToKeep[dateSelected + ': ' + sample] = true;
                                        }
                                    }
                                }
                            }
                        } else {
                            if (!(sheetName === 'Physical Data')) {
                                for (const sample in selectedSampleInfo[dateSelected].position) {
//a                                for (const sample in sampleInfo[dateSelected].position) {
//console.log(dateSelected,'has no',sheetName,'so setting all false');
                                                                    samplesToKeep[dateSelected + ': ' + sample] = false;
                            }
                        }
                            }
                }

            }
        }
//console.log(samplesToKeep);
        for (const sampleName in samplesToKeep) {
            if(samplesToKeep[sampleName]) {
//console.log('keeping ',sampleName);
                    const checkName = `sample_${sampleName}`;
                    const checkbox = document.getElementById(checkName);
                    checkbox.checked = true;
            }
        }
    }
//console.log(checkboxes);
    const containsText = document.getElementById('containsText').value.toLowerCase();
    const minDepth = parseFloat(document.getElementById('minDepth').value);
    const maxDepth = parseFloat(document.getElementById('maxDepth').value);
    centreLat = parseFloat(document.getElementById('centreLat').value);
    centreLon = parseFloat(document.getElementById('centreLon').value);
    const centreDist = parseFloat(document.getElementById('centreDist').value);
//    const checkboxes = document.querySelectorAll('#sampleCheckboxes input[type="checkbox"]');
//    const checkboxesIn = document.querySelectorAll('input[name="sample"]:checked');
    checkboxes.forEach(checkbox => {
        if (containsText.length > 0) {
            if (checkbox.nextSibling.textContent.toLowerCase().includes(containsText)) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        }
    });
    if (!(isNaN(minDepth) || isNaN(maxDepth)) && (minDepth <= maxDepth)) {
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        for (const dateSelected in selectedSampleInfo) {
            for (const sample in selectedSampleInfo[dateSelected].position) {
                const minSample = selectedSampleInfo[dateSelected].position[sample]['Sampling depth (m)'].minDepth;
                if (minDepth <= minSample) {
                    const maxSample = selectedSampleInfo[dateSelected].position[sample]['Sampling depth (m)'].maxDepth;
/*a        for (const dateSelected in sampleInfo) {
            for (const sample in sampleInfo[dateSelected].position) {
                const minSample = sampleInfo[dateSelected].position[sample]['Sampling depth (m)'].minDepth;
                if (minDepth <= minSample) {
                    const maxSample = sampleInfo[dateSelected].position[sample]['Sampling depth (m)'].maxDepth;*/
                    if (maxDepth >= maxSample) {
                        const checkName = `sample_${dateSelected + ': ' + sample}`;
                        const checkbox = document.getElementById(checkName);
                        checkbox.checked = true;
                    }
                }
            }
        }
    }
    // going to find samples close to a set of coordinates
    if (!isNaN(centreDist)) {
        // latitude and longitude not supplied
        if ((isNaN(centreLat) || isNaN(centreLon))) {
            // so assuming only one checkbox is ticked then find all samples near to that position
            const selectedSamples = Array.from(checkboxesIn)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);
            if (selectedSamples.length === 1) {
                for (const dateSampled in selectedSampleInfo) {
                    for (const sample in selectedSampleInfo[dateSampled].position) {
                        if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                            centreLat = selectedSampleInfo[dateSampled].position[sample]['Position latitude'];
                            centreLon = selectedSampleInfo[dateSampled].position[sample]['Position longitude'];
/*a                for (const dateSampled in sampleInfo) {
                    for (const sample in sampleInfo[dateSampled].position) {
                        if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                            centreLat = sampleInfo[dateSampled].position[sample]['Position latitude'];
                            centreLon = sampleInfo[dateSampled].position[sample]['Position longitude'];*/
                        }
                    }
                }
            } else {
                return
            }
        }
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        for (const dateSelected in selectedSampleInfo) {
            for (const sample in selectedSampleInfo[dateSelected].position) {
                const sampleLat = selectedSampleInfo[dateSelected].position[sample]['Position latitude'];
                const sampleLon = selectedSampleInfo[dateSelected].position[sample]['Position longitude'];
/*a        for (const dateSelected in sampleInfo) {
            for (const sample in sampleInfo[dateSelected].position) {
                const sampleLat = sampleInfo[dateSelected].position[sample]['Position latitude'];
                const sampleLon = sampleInfo[dateSelected].position[sample]['Position longitude'];*/
                distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
                if (distance <= centreDist) {
                    const checkName = `sample_${dateSelected + ': ' + sample}`;
                    const checkbox = document.getElementById(checkName);
                    checkbox.checked = true;
                }
            }
        }
    }
    // going to find sample with specific measurements
/*    for (const dateSelected in selectedSampleMeasurements) {
        for (const sheetName in selectedSampleMeasurements[dateSelected]) {
            const mustChemicalType = document.getElementById((sheetName + 'sample').replace(/\s/g, '').toLowerCase()).checked;
            if (mustChemicalType) {
                for (const chemical in selectedSampleMeasurements[dateSelected][sheetName].chemicals) {
                    for (const sample in selectedSampleInfo[dateSelected].position) {
                        const conc = selectedSampleMeasurements[dateSelected][sheetName].chemicals[chemical].samples[sample];
console.log(dateSelected,sheetName,chemical,sample,conc);
                        if (conc === null || conc == undefined) {
                            const checkName = `sample_${dateSelected + ': ' + sample}`;
                            const checkbox = document.getElementById(checkName);
                            checkbox.checked = false;
                        }
                    }
                }
            }
        }
    }*/
    for (let i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
        const mustChemicalType = document.getElementById((sheetName + 'sample').replace(/\s/g, '').toLowerCase()).checked;
        if(mustChemicalType) {
            for (let j = 0; j < checkboxesNames.length; j++) {
                let parts = checkboxesNames[j].split(": ");
                if (parts.length > 2) parts[1] = parts[1] + ': ' + parts[2];
                const dateSampled = parts[0];
                const sample = parts[1];
                const checkName = `sample_${dateSampled + ': ' + sample}`;
                const checkbox = document.getElementById(checkName);
                if (!(sheetName in selectedSampleMeasurements[dateSampled])) {
                    checkbox.checked = false;
                } else {
                    // Assume no chemicals are present for this sample
                    checkbox.checked = false;
                    for (const chemical in selectedSampleMeasurements[dateSampled][sheetName].chemicals) {
                        const conc = selectedSampleMeasurements[dateSampled][sheetName].chemicals[chemical].samples[sample];
//        console.log(dateSampled,sheetName,chemical,sample,conc);
  /*                          if (conc === null || conc == undefined) {
                                const checkName = `sample_${dateSampled + ': ' + sample}`;
                                const checkbox = document.getElementById(checkName);
                                checkbox.checked = false;
                            }*/
                           // If any chemical has a concentration > 0 then keep the sample
                        if (conc > 0) {
                            checkbox.checked = true;
                            break;
                        }
                    }
                }
            }
        }
    }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}


function closeSampleSelection() {
    selectSamples();
    const sampleModal = document.getElementById('sampleModal');
    sampleModal.style.display = 'none';
}

function selectSamples() {
    const checkboxes = document.querySelectorAll('input[name="sample"]:checked');
    //console.log(checkboxes);
    const selectedSamples = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    //console.log(selectedSamples);
    selectedSampleMeasurements = getselectedSampleMeasurements(selectedSamples);
    selectedSampleInfo = getSelectedSamples(selectedSamples);
    updateChart();
}


function getselectedSampleMeasurements(selectedSamples) {
    selectedMeas = {};
    for (let i=0; i < selectedSamples.length; i++) {
        let parts = selectedSamples[i].split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        dateSampled = parts[0];
        sample = parts[1];
        let dataset = sampleMeasurements[dateSampled];
        if (!selectedMeas[dateSampled]) {
            selectedMeas[dateSampled] = {};
        }
        const chemicalTypes = Object.keys(sampleMeasurements[dateSampled]);
        for (const chemicalType in sampleMeasurements[dateSampled]) {
            if (!selectedMeas[dateSampled][chemicalType]) {
                //console.log('Create ', dateSampled);
                selectedMeas[dateSampled][chemicalType] = {};
            }
            if (chemicalType === 'Physical Data') {
                if (!selectedMeas[dateSampled][chemicalType].samples) {
                    selectedMeas[dateSampled][chemicalType].samples = {};
                    selectedMeas[dateSampled][chemicalType]['Unit of measurement'] = sampleMeasurements[dateSampled][chemicalType]['Unit of measurement'];
                    selectedMeas[dateSampled][chemicalType].sizes = sampleMeasurements[dateSampled][chemicalType].sizes;
console.log('1 psd selectedMeas ',dateSampled,chemicalType,selectedMeas);
//console.log('2 psd selectedMeas ',dateSampled,chemicalType,selectedMeas);
                }
console.log('3 psd selectedMeas ',dateSampled,chemicalType,sample,selectedMeas);
                selectedMeas[dateSampled][chemicalType].samples[sample] = sampleMeasurements[dateSampled][chemicalType].samples[sample];
            } else {
                        //    						for (const chemicalType in sampleMeasurements[dateSampled]) {
                let newData = selectedMeas[dateSampled][chemicalType];
console.log(chemicalType, dataset, newData);
                for (const key in dataset[chemicalType]) {
                    let currentData = dataset[chemicalType][key];
console.log(chemicalType,key);
                    if (key === 'chemicals') {
                        if (!newData.chemicals) {
                            newData.chemicals = {};
                            for (const chemical in dataset[chemicalType].chemicals) {
                                    //console.log('Create ', dateSampled, chemicalType,chemical);
                                newData.chemicals[chemical] = {};
                                newData.chemicals[chemical].samples = {};
                                newData.chemicals[chemical].samples[sample] = currentData[chemical].samples[sample];
                            }
                        } else {
                            newData.chemicals = selectedMeas[dateSampled][chemicalType].chemicals;
                            for (const chemical in dataset[chemicalType].chemicals) {
console.log('Create ', dateSampled, chemicalType, chemical,newData, currentData);
                                newData.chemicals[chemical].samples[sample] = currentData[chemical].samples[sample];
                            }
                        }
                    } else {
                        if (isSingleValue(currentData)) {
                            if (!newData[key]) {
                                newData[key] = currentData;
                            }
                        } else {
                            if (!newData[key]) {
                                newData[key] = {};
                                newData[key][sample] = currentData[sample];
                            } else {
                                newData[key][sample] = currentData[sample];
                            }
                        }
                    }
                }
console.log(newData);
                selectedMeas[dateSampled][chemicalType] = newData;
            }
        }
    }
//console.log(selectedMeas); // Output each cell value to console
    return selectedMeas;
}

function getSelectedSamples(selectedSamples) {
    let selectedSamps = {};
//let numberNow = 0;
    for (let i=0; i < selectedSamples.length; i++) {
        let parts = selectedSamples[i].split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        dateSampled = parts[0];
        sample = parts[1];

//    for (const dateSampled in selectedSampleInfo) {
//        for (const sample in selectedSampleInfo[dateSampled].position) {
//numberNow += 1;
//            if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                // console.log('a point ' + dateSampled + ': ' + sample);
        if (!selectedSamps[dateSampled]) {
            selectedSamps[dateSampled] = {};
        }
        for (const key in sampleInfo[dateSampled]) {
            currentData = sampleInfo[dateSampled][key];
            if (isSingleValue(currentData)) {
                selectedSamps[dateSampled][key] = currentData;
            } else {
                if (!selectedSamps[dateSampled][key]) {
                    selectedSamps[dateSampled][key] = {};
                }
console.log(dateSampled, sample, currentData, selectedSamps);
                selectedSamps[dateSampled][key][sample] = currentData[sample];
            }
        }
    }
//    selectedSampleInfo = selectedSamps;
//console.log(selectedSamps); // Output each cell value to console
//console.log('numberNow',numberNow);
fred=selectedSamps;
    return selectedSamps;
}

function clearSelections() {
    selectedSampleMeasurements = sampleMeasurements;
    selectedSampleInfo = sampleInfo;
    updateChart();
}

