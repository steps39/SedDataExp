function openChemicalSelection(sampleMeasurements) {
    const chemicalModal = document.getElementById('chemicalModal');
    chemicalModal.style.display = 'block';

    const sampleCheckboxes = document.getElementById('chemicalCheckboxes');
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
    for (dateSampled in sampleMeasurements) {
        for (const chemicalType in selectedSampleMeasurements[dateSampled]) {
            for (const chemical in selectedSampleMeasurements[dateSampled][chemicalType].chemicals) {
                if (selectedChemicals.includes(chemical)) {
                    // Put here as if no chemicals selected then don't need chemical type
                    if (!selectedMeas[dateSampled]) {
                        selectedMeas[dateSampled] = {};
                    }
                    if (!selectedMeas[dateSampled][chemicalType]) {
                        selectedMeas[dateSampled][chemicalType] = {};
                        selectedMeas[dateSampled][chemicalType].chemicals = {};
                        if (chemicalType == 'PAH data') {
                            // Just copy all common data even if only 1 PAH is selected
                            selectedMeas[dateSampled][chemicalType].gorhamTest = selectedSampleMeasurements[dateSampled][chemicalType].gorhamTest;
                            selectedMeas[dateSampled][chemicalType].total = selectedSampleMeasurements[dateSampled][chemicalType].total;
                            selectedMeas[dateSampled][chemicalType].totalHC = selectedSampleMeasurements[dateSampled][chemicalType].totalHC;
                            selectedMeas[dateSampled][chemicalType].totalHCUnit = selectedSampleMeasurements[dateSampled][chemicalType].totalHCUnit;
                        }
                    }
                    selectedMeas[dateSampled][chemicalType].chemicals[chemical] = selectedSampleMeasurements[dateSampled][chemicalType].chemicals[chemical];
                }
            }
        }
    }
    return selectedMeas;
}

function getSelectedChemicalSampleInfo(selectedChemicals) {
    selectedSamps = {};
    for (const dateSampled in selectedSampleMeasurements) {
        for (const chemicalType in selectedSampleMeasurements[dateSampled]) {
            selectedSamps[dateSampled] = {};
            selectedSamps[dateSampled]['Date sampled'] = selectedSampleInfo[dateSampled]['Date sampled'];
            selectedSamps[dateSampled].fileURL = selectedSampleInfo[dateSampled].fileURL;
            selectedSamps[dateSampled].Applicant = selectedSampleInfo[dateSampled].Applicant;
            selectedSamps[dateSampled]['Application number'] = selectedSampleInfo[dateSampled]['Application number'];
            selectedSamps[dateSampled]['Application title'] = selectedSampleInfo[dateSampled]['Application title'];
            selectedSamps[dateSampled].position = {};
            for (const chemical in selectedSampleMeasurements[dateSampled][chemicalType].chemicals) {
                for (const sample in selectedSampleMeasurements[dateSampled][chemicalType].chemicals[chemical].samples) {
                    selectedSamps[dateSampled].position[sample] = selectedSampleInfo[dateSampled].position[sample];
                }
            }
        }
    }
    return selectedSamps;
}

function openDatasetSelection(sampleMeasurements) {
    const sampleModal = document.getElementById('datasetModal');
    sampleModal.style.display = 'block';

}

function applyDatasetFilter() {
    const sampleModal = document.getElementById('datasetModal');
    sampleModal.style.display = 'none';
    sheetsToSelect = [];
    for (i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
        sheetsToSelect[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]+'set').checked ? true : false; // Check the checkbox state
    }
    datasetsToKeep = [];
    for (const dateSelected in sampleInfo) {
        datasetsToKeep[dateSelected] = true;
        for (sheetName in sheetsToSelect) {
            if (sheetsToSelect[sheetName]) {
                if (!(sheetName in sampleMeasurements[dateSelected])) {
                    datasetsToKeep[dateSelected] = false;
                    break;
                }
                keepInfo = sampleInfo[dateSelected];
                keepSample = sampleMeasurements[dateSelected]
            }
        }
    }
    selectedSampleInfo = {};
    selectedSampleMeasurements = {};
    for (dateSelected in datasetsToKeep) {
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

function selectHighlighted(selection) {
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
}

function applySampleFilter() {
    let sheetsToSelect = [];
    selectBySheet = false;
    for (i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
        sheetsToSelect[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]+'sample').checked ? true : false; // Check the checkbox state
        if (sheetsToSelect[dataSheetNames[i]]) {
            selectBySheet = true;
        }
    }
    const checkboxes = document.querySelectorAll('#sampleCheckboxes input[type="checkbox"]');
    const checkboxesIn = document.querySelectorAll('input[name="sample"]:checked');
    if (selectBySheet) {
        index = 0;
        samplesToKeep = {};
//        for (const sheetName in sheetsToSelect) {
//            for (const dateSelected in selectedSampleMeasurements) {
        for (const dateSelected in selectedSampleMeasurements) {
            for (const sample in sampleInfo[dateSelected].position) {
                samplesToKeep[dateSelected + ': ' + sample] = true;
            }
            for (const sheetName in sheetsToSelect) {
//console.log('Should I check for',sheetName);
                if (sheetsToSelect[sheetName]) {
//console.log('I should check for',sheetName);
                    if (sheetName in selectedSampleMeasurements[dateSelected]) {
//console.log(dateSelected,'has',sheetName,'so setting all false');
                            for (const sample in sampleInfo[dateSelected].position) {
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
                                for (const sample in sampleInfo[dateSelected].position) {
                                    console.log(dateSelected,'has no',sheetName,'so setting all false');
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
        for (const dateSelected in sampleInfo) {
            for (const sample in sampleInfo[dateSelected].position) {
                const minSample = sampleInfo[dateSelected].position[sample]['Sampling depth (m)'].minDepth;
                if (minDepth <= minSample) {
                    const maxSample = sampleInfo[dateSelected].position[sample]['Sampling depth (m)'].maxDepth;
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
                for (const dateSampled in sampleInfo) {
                    for (const sample in sampleInfo[dateSampled].position) {
                        if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                            centreLat = sampleInfo[dateSampled].position[sample]['Position latitude'];
                            centreLon = sampleInfo[dateSampled].position[sample]['Position longitude'];
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
        for (const dateSelected in sampleInfo) {
            for (const sample in sampleInfo[dateSelected].position) {
                const sampleLat = sampleInfo[dateSelected].position[sample]['Position latitude'];
                const sampleLon = sampleInfo[dateSelected].position[sample]['Position longitude'];
                distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
                if (distance <= centreDist) {
                    const checkName = `sample_${dateSelected + ': ' + sample}`;
                    const checkbox = document.getElementById(checkName);
                    checkbox.checked = true;
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
    //console.log(selectedSamples);
    for (dateSampled in sampleMeasurements) {
        //console.log(dateSampled);
        const chemicalTypes = Object.keys(sampleMeasurements[dateSampled]);
        //                const chemicals = Object.keys(sampleMeasurements[dateSampled][chemicalTypes[0]].chemicals);
        for (const chemicalType in sampleMeasurements[dateSampled]) {
            if (chemicalType === 'Physical Data') {
                for (const sample in sampleMeasurements[dateSampled][chemicalType].samples) {
                    if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                        if (!selectedMeas[dateSampled]) {
                            selectedMeas[dateSampled] = {};
                            selectedMeas[dateSampled][chemicalType] = {};
                            selectedMeas[dateSampled][chemicalType].samples = {};
                            selectedMeas[dateSampled][chemicalType]['Unit of measurement'] = sampleMeasurements[dateSampled][chemicalType]['Unit of measurement'];
                            selectedMeas[dateSampled][chemicalType].sizes = sampleMeasurements[dateSampled][chemicalType].sizes;
                            //console.log('1 psd selectedMeas ',dateSampled,chemicalType,selectedMeas);
                        } else {
                            if (!selectedMeas[dateSampled][chemicalType]) {
                                selectedMeas[dateSampled][chemicalType] = {};
                                selectedMeas[dateSampled][chemicalType].samples = {};
                                selectedMeas[dateSampled][chemicalType]['Unit of measurement'] = sampleMeasurements[dateSampled][chemicalType]['Unit of measurement'];
                                selectedMeas[dateSampled][chemicalType].sizes = sampleMeasurements[dateSampled][chemicalType].sizes;
                                //console.log('2 psd selectedMeas ',dateSampled,chemicalType,selectedMeas);
                            }
                            //console.log('3 psd selectedMeas ',dateSampled,chemicalType,sample,selectedMeas);
                            selectedMeas[dateSampled][chemicalType].samples[sample] = {};
                            selectedMeas[dateSampled][chemicalType].samples[sample].psd = sampleMeasurements[dateSampled][chemicalType].samples[sample].psd;
                        }
                    }
                }

                //console.log('Create ', dateSampled, chemicalType);
                //console.log('should do Gorham Test here');

            } else {
                for (const chemical in sampleMeasurements[dateSampled][chemicalType].chemicals) {
                    for (const sample in sampleMeasurements[dateSampled][chemicalType].chemicals[chemical].samples) {
                        //console.log(sample);
                        if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                            //console.log('Found one');
                            if (!selectedMeas[dateSampled]) {
                                //console.log('Create ', dateSampled);
                                selectedMeas[dateSampled] = {};
                                //    						for (const chemicalType in sampleMeasurements[dateSampled]) {
                                selectedMeas[dateSampled][chemicalType] = {};
                                selectedMeas[dateSampled][chemicalType]['Unit of measurement'] = sampleMeasurements[dateSampled][chemicalType]['Unit of measurement'];
                                selectedMeas[dateSampled][chemicalType].chemicals = {};
                                //console.log('Create ', dateSampled, chemicalType);
                                //console.log('should do Gorham Test here');
                                if (chemicalType == 'PAH data') {
                                    //console.log('Create ', dateSampled, chemicalType,'Gorham Test');
                                    selectedMeas[dateSampled][chemicalType].gorhamTest = {};
                                    selectedMeas[dateSampled][chemicalType].gorhamTest[sample] = sampleMeasurements[dateSampled][chemicalType].gorhamTest[sample];
                                    selectedMeas[dateSampled][chemicalType].total = {};
                                    selectedMeas[dateSampled][chemicalType].total[sample] = selectedSampleMeasurements[dateSampled][chemicalType].total[sample];
                                    selectedMeas[dateSampled][chemicalType].totalHC = {};
                                    selectedMeas[dateSampled][chemicalType].totalHCUnit = selectedSampleMeasurements[dateSampled][chemicalType].totalHCUnit;
                                    selectedMeas[dateSampled][chemicalType].totalHC[sample] = selectedSampleMeasurements[dateSampled][chemicalType].totalHC[sample];
                                }
                                if (chemicalType == 'PCB data') {
                                    //console.log('Create ', dateSampled, chemicalType,'Gorham Test');
                                    selectedMeas[dateSampled][chemicalType].congenerTest = {};
                                    selectedMeas[dateSampled][chemicalType].congenerTest[sample] = sampleMeasurements[dateSampled][chemicalType].congenerTest[sample];
                                }
                                for (const chemical in sampleMeasurements[dateSampled][chemicalType].chemicals) {
                                    //console.log('Create ', dateSampled, chemicalType,chemical);
                                    selectedMeas[dateSampled][chemicalType].chemicals[chemical] = {};
                                    selectedMeas[dateSampled][chemicalType].chemicals[chemical].samples = {};
                                    selectedMeas[dateSampled][chemicalType].chemicals[chemical].samples[sample] = sampleMeasurements[dateSampled][chemicalType].chemicals[chemical].samples[sample];
                                }
                                //							}
                            } else {
                                //   						for (const chemicalType in sampleMeasurements[dateSampled]) {
                                //console.log('ch ', dateSampled,sample,chemicalType);
                                if (!selectedMeas[dateSampled][chemicalType]) {
                                    selectedMeas[dateSampled][chemicalType] = {};
                                    selectedMeas[dateSampled][chemicalType]['Unit of measurement'] = sampleMeasurements[dateSampled][chemicalType]['Unit of measurement'];
                                    selectedMeas[dateSampled][chemicalType].chemicals = {};
                                    if (chemicalType === 'PAH data') {
                                        //console.log('Create ', dateSampled, chemicalType,'Gorham Test');
                                        selectedMeas[dateSampled][chemicalType].gorhamTest = {};
                                        selectedMeas[dateSampled][chemicalType].gorhamTest[sample] = sampleMeasurements[dateSampled][chemicalType].gorhamTest[sample];
                                        selectedMeas[dateSampled][chemicalType].total = {};
                                        selectedMeas[dateSampled][chemicalType].total[sample] = selectedSampleMeasurements[dateSampled][chemicalType].total[sample];
                                        selectedMeas[dateSampled][chemicalType].totalHC = {};
                                        selectedMeas[dateSampled][chemicalType].totalHC[sample] = selectedSampleMeasurements[dateSampled][chemicalType].totalHC[sample];
                                    }
                                    if (chemicalType == 'PCB data') {
                                        //console.log('Create ', dateSampled, chemicalType,'Gorham Test');
                                        selectedMeas[dateSampled][chemicalType].congenerTest = {};
                                        selectedMeas[dateSampled][chemicalType].congenerTest[sample] = sampleMeasurements[dateSampled][chemicalType].congenerTest[sample];
                                    }
                                    for (const chemical in sampleMeasurements[dateSampled][chemicalType].chemicals) {
                                        //console.log('Create ', dateSampled, chemicalType,chemical);
                                        selectedMeas[dateSampled][chemicalType].chemicals[chemical] = {};
                                        selectedMeas[dateSampled][chemicalType].chemicals[chemical].samples = {};
                                        selectedMeas[dateSampled][chemicalType].chemicals[chemical].samples[sample] = sampleMeasurements[dateSampled][chemicalType].chemicals[chemical].samples[sample];
                                    }
                                } else {
                                    if (chemicalType === 'PAH data') {
                                        //console.log('Create ', dateSampled, chemicalType, sample, 'Gorham Test');
                                        selectedMeas[dateSampled][chemicalType].gorhamTest[sample] = sampleMeasurements[dateSampled][chemicalType].gorhamTest[sample];
                                        selectedMeas[dateSampled][chemicalType].total[sample] = selectedSampleMeasurements[dateSampled][chemicalType].total[sample];
                                        selectedMeas[dateSampled][chemicalType].totalHC[sample] = selectedSampleMeasurements[dateSampled][chemicalType].totalHC[sample];
                                    }
                                    if (chemicalType == 'PCB data') {
                                        //console.log('Create ', dateSampled, chemicalType,'Gorham Test');
                                        selectedMeas[dateSampled][chemicalType].congenerTest[sample] = sampleMeasurements[dateSampled][chemicalType].congenerTest[sample];
                                    }
                                    for (const chemical in sampleMeasurements[dateSampled][chemicalType].chemicals) {
                                        selectedMeas[dateSampled][chemicalType].chemicals[chemical].samples[sample] = sampleMeasurements[dateSampled][chemicalType].chemicals[chemical].samples[sample];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    // console.log(selectedMeas); // Output each cell value to console
    return selectedMeas;
}

function getSelectedSamples(selectedSamples) {
    selectedSamps = {};
    for (const dateSampled in sampleInfo) {
        for (const sample in sampleInfo[dateSampled].position) {
            if (selectedSamples.includes(dateSampled + ': ' + sample)) {
                // console.log('a point ' + dateSampled + ': ' + sample);
                if (!selectedSamps[dateSampled]) {
                    selectedSamps[dateSampled] = {};
                    selectedSamps[dateSampled]['Date sampled'] = sampleInfo[dateSampled]['Date sampled'];
                    selectedSamps[dateSampled].fileURL = sampleInfo[dateSampled].fileURL;
                    selectedSamps[dateSampled].Applicant = sampleInfo[dateSampled].Applicant;
                    selectedSamps[dateSampled]['Application number'] = sampleInfo[dateSampled]['Application number'];
                    selectedSamps[dateSampled]['Application title'] = sampleInfo[dateSampled]['Application title'];
                }
                if (!selectedSamps[dateSampled].position) {
                    selectedSamps[dateSampled].position = {};
                }
                selectedSamps[dateSampled].position[sample] = sampleInfo[dateSampled].position[sample];
            }
        }
    }
    // console.log(selectedSamps); // Output each cell value to console
    return selectedSamps;
}

function clearSelections() {
    selectedSampleMeasurements = sampleMeasurements;
    selectedSampleInfo = sampleInfo;
}

