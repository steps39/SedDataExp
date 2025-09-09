/**
 * Enables or disables sorting options based on available data.
 */
function updateSortingOptionsState() {
    const primarySelect = document.getElementById('primary-sorting-select');
    const secondarySelect = document.getElementById('secondary-sorting-select');

    // First, enable all options by default
    for (const option of primarySelect.options) {
        option.disabled = false;
    }
    for (const option of secondarySelect.options) {
        option.disabled = false;
    }

    // Now, disable options based on missing data
    for (const sortValue in sortOptionDependencies) {
        const requiredSheet = sortOptionDependencies[sortValue];

        // Check if the required sheet data is NOT complete/available
        if (!completeSheet[requiredSheet]) {
            // Find and disable the option in both dropdowns
            const primaryOption = primarySelect.querySelector(`option[value="${sortValue}"]`);
            if (primaryOption) {
                primaryOption.disabled = true;
            }
            
            const secondaryOption = secondarySelect.querySelector(`option[value="${sortValue}"]`);
            if (secondaryOption) {
                secondaryOption.disabled = true;
            }
        }
    }
}

function updateOptions() {
    //Recheck available samples to make sure all the correct options are available
/* for (group in sortButtonGroups) {
        disableRadioButtons(sortButtonGroups[group], false);
    }
    dataSheetNames.forEach(sheetName => {
        disableRadioButtons(sortButtonGroups[sheetName], false);
        completeSheet[sheetName] = true;
    })*/
/*    dataSheetNames.forEach(sheetName => {
        disableRadioButtons(sortButtonGroups[sheetName], false);
        completeSheet[sheetName] = true;
        for(const dateSampled in selectedSampleMeasurements) {
            if (!selectedSampleMeasurements[dateSampled][sheetName]){
                disableRadioButtons(sortButtonGroups[sheetName], true);
                completeSheet[sheetName] = false;
                break;
            }
        }
    })*/
       // This part checks which data sheets are complete
    dataSheetNames.forEach(sheetName => {
        completeSheet[sheetName] = true;
        for(const dateSampled in selectedSampleMeasurements) {
            if (!selectedSampleMeasurements[dateSampled][sheetName]){
                completeSheet[sheetName] = false;
                break;
            }
        }
    });

    // --- ADD THIS CALL ---
    // After determining which sheets are complete, update the dropdowns
    updateSortingOptionsState();
    const primarySort = document.getElementById('primary-sorting-select').value;
    const secondarySort = document.getElementById('secondary-sorting-select').value;

    // Combine the values. You will need to update your sorting logic
    // to handle this new combined format (e.g., "latitude-longitude").
    if (secondarySort !== 'none') {
        xAxisSort = `${primarySort}-${secondarySort}`;
    } else {
        xAxisSort = primarySort;
    }

//console.log('xAxisSort', xAxisSort);

    for (let i = 0; i < dataSheetNames.length; i++) {
        const sheetName = dataSheetNames[i];
        sheetsToDisplay[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]).checked ? true : false; // Check the checkbox state
    }
    for (let i = 0; i < subChartNames.length; i++) {
        const subName = subChartNames[i];
        subsToDisplay[subName] = document.getElementById(subName).checked ? true : false; // Check the checkbox state
    }
//  xAxisSort = document.querySelector('input[name="sorting"]:checked').value; //radio buttons
//    xAxisSort = document.getElementById('sorting-select').value; //dropdown
    lookSetting = document.querySelector('input[name="look"]:checked').value;
    resuspensionSize = parseFloat(document.getElementById('resuspensionsize').value);
    if (isNaN(resuspensionSize)) {
        resuspensionSize = 0;
    } else {
        if (resuspensionSize > 0 ) {
            resuspensionSize = resuspensionSize / 1000000;
        }
    }
}

function updateChart(){
    updateOptions();
//SRG 250728 Removed loosing data, not sure why or why in in first place    wrangleData();



//console.log('UPDATECHART*******************');
    if (lastInstanceNo > 0) {
        const canvas = [];
        removeScatterTables();
        for (i = 1; i < lastInstanceNo + 1; i++) {
            canvas[i] = document.getElementById('chart' + i);
            clearCanvasAndChart(canvas[i], i);
        }
    }
    lastInstanceNo = 0;
    blankSheets = {};
    setBlanksForCharting();
//console.log(sheetsToDisplay);
    for (const sheetName in sheetsToDisplay) {
//console.log(sheetName, sheetsToDisplay[sheetName], chemicalTypeHasData(sheetName));
        if (sheetsToDisplay[sheetName] && chemicalTypeHasData(sheetName)) {
            lastInstanceNo = displayCharts(sheetName, lastInstanceNo);
        }
    }
    if (!(radarPlot === "None")) {
        retData = dataForCharting(radarPlot);
        unitTitle = retData['unitTitle'];
        selectedMeas = retData['measChart'];
        createRadarPlot(selectedMeas, radarPlot);
    }
//console.log('lastInstanceNo ',lastInstanceNo);			
//console.log(selectedMeas);
console.log('about to display sample map');
    sampleMap(selectedMeas);
    filenameDisplay();
}

function displayPsdSplits(sortedSamples, sums, sheetName, instanceNo, unitTitle, subTitle) {
//  console.log(sums);
    createCanvas(instanceNo);
//Bodge lost data for unitTitle
    if (unitTitle === undefined || unitTitle === null) {
        unitTitle = 'Particle size distribution (% at 0.5 phi intervals)'; //bodge	
    }
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'PSD splits by ' + subTitle;
    instanceSheet[instanceNo] = sheetName;
//  const allSamples = Object.keys(sums);
    const allSamples = sortedSamples; // Use the sorted samples from the retData
    const allParticles = Object.keys(sums[allSamples[0]]); // Assuming all samples have the particles
    const datasets = allParticles.map((particle, index) => {
        const data = allSamples.map(sample => sums[sample][particle]);
        return {
            label: particle,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnySampleChart(sums, allSamples, datasets, instanceNo, sheetName + ': PSD splits by ' + subTitle, unitTitle + ' by ' + subTitle, true);
    y1Title = 'PSD Split by ' + subTitle;
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartInstance[instanceNo].options.plugins.legend.display = true;
    legends[instanceNo] = true;
    // Update the chart
    chartInstance[instanceNo].options.scales.x.stacked = true;
    chartInstance[instanceNo].options.scales.y.stacked = true;
    chartInstance[instanceNo].update();
}


// Function to toggle dataset visibility
function toggleDataset(instanceNo, chemicalGroup) {
    const chart = chartInstance[instanceNo];
    if (!chart) return;

    dataset = chart.data.datasets.forEach((ds, index) => {
        if (!determinands.pah[chemicalGroup.toLowerCase()].includes(ds.label)) {
            ds.hidden = true;
            // Ensure internal Chart.js tracking is also updated
            if (chart._metasets && chart._metasets[index]) {
                chart._metasets[index].hidden = true;
            }
        }
    });
    chart.update();
    document.getElementById('button'+chemicalGroup.toLowerCase()+instanceNo).disabled = true;
}

// Function to create a button for resetting samples in a chart
function createDisplayChemicals(instanceNo,chemicalGroup) {
    //console.log('creating zoom buttom',instanceNo);
    let chart = chartInstance[instanceNo];
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'button'+chemicalGroup.toLowerCase()+instanceNo
    button.textContent = 'Select ' + chemicalGroup;
    button.addEventListener('click', () => {
        toggleDataset(instanceNo,chemicalGroup);
    });
    container.appendChild(button);
}
    


// Function to reset chart (show all chemical
// s)
function resetDataset(instanceNo) {
    const chart = chartInstance[instanceNo];
    if (!chart) {
        console.log('Chart not found');
        return;
    }
    chart.data.datasets.forEach((ds, index) => {
        if (ds.hidden) {
            ds.hidden = false;
        }
    });
    // Reset internal Chart.js hidden state (for legend toggling)
    if (chart._metasets) {
        chart._metasets.forEach(meta => {
            meta.hidden = false;
        });
    }
    enableDataButtons(instanceNo,['epa','lmw','hmw','smallpts','organicc']);
    chart.update();
}

function enableDataButtons(instanceNo,chemicalGroups) {
    for (let i = 0; i < chemicalGroups.length; i++) {
        document.getElementById('button'+chemicalGroups[i].toLowerCase()+instanceNo).disabled = false;
    }
}
//document.getElementById(id).disabled = false;


// Function to create a button for resetting samples in a chart
function createResetChart(instanceNo) {
    //console.log('creating zoom buttom',instanceNo);
    let chart = chartInstance[instanceNo];
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttonr'+instanceNo
    button.textContent = 'Reset Dataset';
    button.addEventListener('click', () => {
        resetDataset(instanceNo);
    });
    container.appendChild(button);
}
        
        
function displayCharts(sheetName, instanceNo) {
    // If this is the first chart of a new plot, clear the container.
    if (instanceNo === 0) {
        document.getElementById('chartContainer').innerHTML = '';
    }

    const useTabs = document.getElementById('useTabs').checked;
    const mainChartContainer = document.getElementById('chartContainer');
    let targetContainer; // This will hold the charts for the current sheet.

    // --- Tab Logic ---
    if (useTabs) {
        // Find or create the tab button container.
        let tabButtonsContainer = document.getElementById('chart-tab-buttons');
        if (!tabButtonsContainer) {
            tabButtonsContainer = document.createElement('div');
            tabButtonsContainer.id = 'chart-tab-buttons';
            tabButtonsContainer.className = 'tab-buttons';
            mainChartContainer.appendChild(tabButtonsContainer);
        }

        const sanitizedSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '-');
        const tabContentId = 'tab-' + sanitizedSheetName;

        // Create the button and content panel for the current sheet.
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = sheetName;
        tabButton.onclick = (event) => openTab(event, tabContentId);
        tabButtonsContainer.appendChild(tabButton);

        const tabContentPanel = document.createElement('div');
        tabContentPanel.id = tabContentId;
        tabContentPanel.className = 'tab-content';
        mainChartContainer.appendChild(tabContentPanel);
        
        // Make the first tab active by default.
        if (tabButtonsContainer.children.length === 1) {
            tabButton.classList.add('active');
            tabContentPanel.classList.add('active');
        }
        
        targetContainer = tabContentPanel;

    } else {
        // If not using tabs, create a simple container for this sheet's charts.
        targetContainer = document.createElement('div');
        targetContainer.className = 'chart-sheet-container';
        targetContainer.innerHTML = `<h2 style="padding-top: 2rem; border-bottom: 1px solid #ccc;">${sheetName}</h2>`;
        mainChartContainer.appendChild(targetContainer);
    }
    
    // Temporarily swap IDs so child functions find the correct container.
    const originalChartContainerId = 'chartContainer';
    mainChartContainer.id = 'chartContainer-placeholder';
    targetContainer.id = originalChartContainerId;

    // --- Original function logic starts here ---
    let scatterData = {};
    if(sheetName === 'Physical Data') {
        retData = dataForPSDCharting(sheetName);
        unitTitle = retData['unitTitle'];
        sizes = retData['ptsSizes'];
        selectedMeas = retData['measChart'];
        selectedMeasRelativeArea = retData['measChartRelativeArea'];
        selectedMeasArea = retData['measChartArea'];
        splitWeights = retData['splitWeights'];
        splitRelativeAreas = retData['splitRelativeAreas'];
        splitAreas = retData['splitAreas'];
        cumWeights = retData['cumWeights'];
        cumAreas = retData['cumAreas'];
        sortedSamples = retData['allSamples'];
        instanceNo += 1;
        displayPSDChart(sizes, selectedMeas, sheetName, instanceNo, unitTitle, 'Relative Weight');
        instanceNo += 1;
        displayPSDChart(sizes, selectedMeasRelativeArea, sheetName, instanceNo, unitTitle, 'Relative Area');
        instanceNo += 1;
        displayPSDChart(sizes, selectedMeasArea, sheetName, instanceNo, unitTitle, 'Absolute Area');
        instanceNo += 1;
        displayPSDChart(sizes, cumWeights, sheetName, instanceNo, unitTitle, 'Cumlative by Weight');
        instanceNo += 1;
        displayPSDChart(sizes, cumAreas, sheetName, instanceNo, unitTitle, 'Cumulative by Area');
        instanceNo += 1;
        displayPsdSplits(sortedSamples, splitWeights, sheetName, instanceNo, unitTitle, 'Weight');
        instanceNo += 1;
        displayPsdSplits(sortedSamples, splitRelativeAreas, sheetName, instanceNo, unitTitle, 'Relative Area');
        instanceNo += 1;
        displayPsdSplits(sortedSamples, splitAreas, sheetName, instanceNo, unitTitle, 'Absolute Area');
        instanceNo += 1;
        displayTotalSolidOrganicC(sortedSamples, sheetName, instanceNo, unitTitle, 'Total Solids % and Organic Carbon %');
        if (resuspensionSize>0) {
            instanceNo += 1;
            displayResuspensionFractions(sizes, cumWeights, cumAreas, sheetName, instanceNo, unitTitle, 'Fractions');
        }
    } else {
        retData = dataForCharting(sheetName);
        unitTitle = retData['unitTitle'];
        selectedMeas = retData['measChart'];
        selectedMeasArea = {};
        concentrateMeas = {};
        concentrateFactor = {};
        if (completeSheet['Physical Data']) {
            if (resuspensionSize > 0) {
                retData= recalculateConcentration(selectedMeas);
                concentrateMeas = retData['concentrateMeas'];
                concentrateFactor = retData['concentrateFactor'];
            }
            if (subsToDisplay['relationareadensity']) {
                for (const chemical in selectedMeas) {
                    selectedMeasArea[chemical] = {};
                    for (const sample in selectedMeas[chemical]) {
                        let parts = sample.split(": ");
                        if (parts.length>2) {
                            parts[1] = parts[1] + ': ' + parts[2];
                        }
                        if (selectedSampleMeasurements?.[parts[0]]?.['Physical Data']?.samples[parts[1]]?.totalArea !== undefined) {
                            if (selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]].totalArea > 0) {
                                const totalArea = selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]].totalArea;
                                selectedMeasArea[chemical][sample] = selectedMeas[chemical][sample] / totalArea;
                            }
                        }
                    }
                }
            }
        }
        if (subsToDisplay['samplegroup']) {
            instanceNo += 1;
            displaySampleChart(selectedMeas, sheetName, instanceNo, unitTitle);
            if (sheetName === 'BDE data') {
                let organicCPresent = true;
                let selectedMeasOrganicC = selectedMeas;
                for (const chemical in selectedMeasOrganicC) {
                    for (const sample in selectedMeasOrganicC[chemical]) {
                        let parts = sample.split(": ");
                        if (parts.length > 2) {
                            parts[1] = parts[1] + ': ' + parts[2];
                        }
                        if (selectedSampleMeasurements?.[parts[0]]?.['Physical Data']?.samples[parts[1]]?.['Organic matter (total organic carbon)'] !== undefined) {
                            if (selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]]['Organic matter (total organic carbon)'] > 0) {
                                let organicC = selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]]['Organic matter (total organic carbon)'];
                                selectedMeasOrganicC[chemical][sample] = 2.5 * selectedMeas[chemical][sample] / organicC;
                            }
                        }
                        else {
                            organicCPresent = false;
                            break;
                        }
                    }
                }
                if (organicCPresent) {
                    instanceNo += 1;
                    displaySampleChart(selectedMeasOrganicC, sheetName + ' Organic Carbon Normalised', instanceNo, unitTitle + ' / Organic Carbon');
                }
            }

            if (completeSheet['Physical Data']) {
                if (resuspensionSize > 0) {
                    instanceNo += 1;
                    displaySampleChart(concentrateMeas, sheetName, instanceNo, unitTitle + ' < ' + resuspensionSize * 1000000 + 'µm');
                }
                if (subsToDisplay['relationareadensity']) {
                    instanceNo += 1;
                    displaySampleChart(selectedMeasArea, sheetName, instanceNo, unitTitle + ' / Area');
                }
            }
        }
        if (subsToDisplay['chemicalgroup']) {
            instanceNo += 1;
            displayChemicalChart(selectedMeas, sheetName, instanceNo, unitTitle,true);
            if (completeSheet['Physical Data']) {
                if (resuspensionSize > 0) {
                    instanceNo += 1;
                    displayChemicalChart(concentrateMeas, sheetName, instanceNo, unitTitle + ' < ' + resuspensionSize * 1000000 + 'µm', true);
                }
                if (subsToDisplay['relationareadensity']) {
                    instanceNo += 1;
                    displayChemicalChart(selectedMeas, sheetName, instanceNo, unitTitle + ' / Area', false);
                }
            }
        }
        if (subsToDisplay['pcaanalysis']) {
            instanceNo += 1;
            pcaChart(selectedMeas, sheetName, determinands[sheetName], instanceNo);
            if (sheetName === 'PAH data') {
                if (subsToDisplay['pcalmw']) {
                    instanceNo += 1;
                    pcaChart(selectedMeas, sheetName + ' LMW Subset', determinands.pah.lmw, instanceNo);
                }
                if (subsToDisplay['pcahmw']) {
                    instanceNo += 1;
                    pcaChart(selectedMeas, sheetName + ' HMW Subset', determinands.pah.hmw, instanceNo);
                }
                if (subsToDisplay['pcaepa']) {
                    instanceNo += 1;
                    pcaChart(selectedMeas, sheetName + ' EPA Subset', determinands.pah.epa, instanceNo);
                }
                if (subsToDisplay['pcasmallpts']) {
                    instanceNo += 1;
                    pcaChart(selectedMeas, sheetName + ' Small Particles Subset', determinands.pah.smallpts, instanceNo);
                }
                if (subsToDisplay['pcaorganiccarbon']) {
                    instanceNo += 1;
                    pcaChart(selectedMeas, sheetName + ' Organic Carbon Subset', determinands.pah.organicc, instanceNo);
                }
            }
        }
        largeInstanceNo = -1;
//console.log('instanceNo before LL', instanceNo);
        if (subsToDisplay['positionplace']) {
/*            retData = dataForScatterCharting(sheetName);
            scatterData = retData['scatterData'];
            chemicalData = retData['chemicalData'];
            const allChemicals = Object.keys(chemicalData);
            instanceNo += 1;

            // This is the single, correct declaration of currentChartContainer
            const currentChartContainer = document.getElementById('chartContainer');
            const combinedCanvas = document.createElement('canvas');
            combinedCanvas.id = 'chart' + instanceNo;
            currentChartContainer.appendChild(combinedCanvas);

            displayCombinedScatterChart(scatterData, sheetName, instanceNo, 'fred');
            largeInstanceNo = instanceNo;

            const scatterTable = document.createElement('table');
            const noCharts = allChemicals.length;
            const startInstanceNo = instanceNo;
            for (let i = 0; i < noCharts; i++) {
                instanceNo += 1;
                if (i % 4 === 0) {
                    row = scatterTable.insertRow();
                }
                const cell = row.insertCell();
                const canvas = document.createElement('canvas');
                canvas.id = 'chart' + instanceNo;
                cell.appendChild(canvas);
            }

            // The second declaration was here and has been removed.
            if (largeInstanceNo > 1) {
                const divContainer = document.createElement('div');
                divContainer.id = 'chartButtons';
                currentChartContainer.appendChild(divContainer);
            }
            currentChartContainer.appendChild(scatterTable);
            instanceNo = startInstanceNo;
            
            for (const c in chemicalData) {
                instanceNo += 1;
                const sampleNames = Object.keys(chemicalData[c]);
                displayScatterChartLL(scatterData, chemicalData[c], sheetName, instanceNo, c, 'Longitude', 'Latitude', largeInstanceNo);
            }*/
           retData = dataForScatterCharting(sheetName);
scatterData = retData['scatterData'];
chemicalData = retData['chemicalData'];
const allChemicals = Object.keys(chemicalData);
instanceNo += 1;

const currentChartContainer = document.getElementById('chartContainer');
const combinedCanvas = document.createElement('canvas');
combinedCanvas.id = 'chart' + instanceNo;
currentChartContainer.appendChild(combinedCanvas);

displayCombinedScatterChart(scatterData, sheetName, instanceNo, 'fred');
largeInstanceNo = instanceNo;

// --- Refactored Section ---

// 1. Create a div to serve as the flex container instead of a table.
const scatterFlexContainer = document.createElement('div');

// 2. Apply CSS styles to make it a flex container.
//    - 'display: flex' enables flex layout.
//    - 'flex-wrap: wrap' allows items to wrap onto the next line.
//    - 'justify-content: center' centers the charts within the container.
//    - 'gap: 1rem' adds consistent spacing between the charts.
scatterFlexContainer.style.display = 'flex';
scatterFlexContainer.style.flexWrap = 'wrap';
scatterFlexContainer.style.justifyContent = 'center';
scatterFlexContainer.style.gap = '1rem';
scatterFlexContainer.style.padding = '1rem 0';


const noCharts = allChemicals.length;
const startInstanceNo = instanceNo;

// 3. Loop through and create a canvas for each chemical.
//    The logic for creating rows (if i % 4 === 0) is no longer needed.
for (let i = 0; i < noCharts; i++) {
    instanceNo += 1;
    
    // Create a wrapper for each chart to manage its flex properties.
    const chartWrapper = document.createElement('div');
    
    // 4. Set flex properties for the wrapper.
    //    - 'flex: 0 0 calc(25% - 1rem)' sets flex-grow and flex-shrink to 0, fixing the size.
    //    - 'minWidth' ensures the charts don't become too small on smaller screens.
    chartWrapper.style.flex = '0 0 calc(25% - 1rem)';
    chartWrapper.style.minWidth = '250px';
    chartWrapper.style.boxSizing = 'border-box';

    const canvas = document.createElement('canvas');
    canvas.id = 'chart' + instanceNo;
    
    // Append the canvas to its wrapper, and the wrapper to the flex container.
    chartWrapper.appendChild(canvas);
    scatterFlexContainer.appendChild(chartWrapper);
}

// --- Existing Code ---

if (largeInstanceNo > 1) {
    const divContainer = document.createElement('div');
    divContainer.id = 'chartButtons';
    currentChartContainer.appendChild(divContainer);
}

// 5. Append the new flex container to the main chart container.
currentChartContainer.appendChild(scatterFlexContainer);
instanceNo = startInstanceNo;

for (const c in chemicalData) {
    instanceNo += 1;
    const sampleNames = Object.keys(chemicalData[c]);
    displayScatterChartLL(scatterData, chemicalData[c], sheetName, instanceNo, c, 'Longitude', 'Latitude', largeInstanceNo);
}

        }

//        instanceNo = displayScatterCharts(sheetName, { key: 'totalArea', sheetKey: 'Physical Data' }, 'latitudelongitude', 'Latitude', 'Longitude', targetContainer, instanceNo);
//console.log('instanceNo after scatter', instanceNo);
        instanceNo = displayScatterCharts(sheetName, { key: 'totalArea', sheetKey: 'Physical Data' }, 'relationareadensity', 'Total Area', 'Concentration', targetContainer, instanceNo);
//console.log('instanceNo after totalArea', instanceNo);
        instanceNo = displayScatterCharts(sheetName, { key: 'totalHC', sheetKey: 'PAH data' }, 'relationhc', 'Total Hydrocarbon', 'Concentration', targetContainer, instanceNo);
//console.log('instanceNo after totalHC', instanceNo);        
        instanceNo = displayScatterCharts(sheetName, { key: 'totalSolids', sheetKey: 'Physical Data' }, 'relationtotalsolids', 'Total Solids %', 'Concentration', targetContainer, instanceNo);
//console.log('instanceNo after totalSolids', instanceNo);        
        instanceNo = displayScatterCharts(sheetName, { key: 'organicCarbon', sheetKey: 'Physical Data' }, 'relationorganiccarbon', 'Organic Carbon %', 'Concentration', targetContainer, instanceNo);
//console.log('instanceNo after organicCarbon', instanceNo);
        if (sheetName == 'PAH data' && Object.keys(chemInfo).length != 0) {
            const chemicalNames = Object.keys(chemInfo);
            const properties = Object.keys(chemInfo[chemicalNames[0]]);
            for (i = 0; i<14 ; i++) {
                chemicalNames.sort((a, b) => chemInfo[a][properties[i]] - chemInfo[b][properties[i]]);
                const sortedSelectedMeas = {};
                chemicalNames.forEach((chemical) => {
                    if (selectedMeas[chemical]) {
                        sortedSelectedMeas[chemical] = selectedMeas[chemical];
                    }
                });
                instanceNo += 1;
                displaySampleChart(sortedSelectedMeas, sheetName + ': Sorted by ' + properties[i], instanceNo, unitTitle);
                instanceNo += 1;
                displayChemicalChart(sortedSelectedMeas, sheetName + ': Sorted by ' + properties[i], instanceNo, unitTitle);
            }
        }
        if (sheetName === 'PAH data' && subsToDisplay['gorhamtest']) {
            unitTitle = retData['unitTitle'];
            selectedSums = sumsForGorhamCharting();
            instanceNo += 1;
            displayGorhamTest(selectedSums, sheetName, instanceNo, unitTitle);
            if (resuspensionSize > 0 && completeSheet['Physical Data']) {
                retData = recalculateConcentrationComplex(selectedSums);
                concentrateSums = retData['concentrateMeas'];
                concentrateFactor = retData['concentrateFactor'];
                instanceNo += 1;
                displayGorhamTest(concentrateSums, sheetName, instanceNo, unitTitle + ' < ' + resuspensionSize * 1000000 + 'µm');
            }
        }
        if (sheetName === 'PAH data' && subsToDisplay['totalhc']) {
            instanceNo += 1;
            retData = sumsForTotalHCCharting();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
            displayTotalHC(selectedSums, sheetName, instanceNo, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['pahratios']) {
            instanceNo += 1;
            retData = ratiosForPAHs();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
            displayPAHRatios(selectedSums, sheetName, instanceNo, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['ringfractions']) {
            instanceNo += 1;
            retData = ringFractionsForPAHs();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
            displayRingFractions(selectedSums, sheetName, instanceNo, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['eparatios']) {
            instanceNo += 1;
            retData = epaRatiosForPAHs();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
            displayEpaRatios(selectedSums, sheetName, instanceNo, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['simpleratios']) {
            instanceNo += 1;
            retData = simpleRatiosForPAHs();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
            displaySimpleRatios(selectedSums, sheetName, instanceNo, unitTitle);
        }
        if (sheetName === 'PCB data' && subsToDisplay['congenertest']) {
            instanceNo += 1;
            selectedSums = sumsForCongenerCharting();
            displayCongener(selectedSums, sheetName, instanceNo, unitTitle);
            if (resuspensionSize > 0 && completeSheet['Physical Data']) {
                retData = recalculateConcentrationComplex(selectedSums);
                concentrateSums = retData['concentrateMeas'];
                concentrateFactor = retData['concentrateFactor'];
                instanceNo += 1;
                displayCongener(concentrateSums, sheetName, instanceNo, unitTitle + ' < ' + resuspensionSize * 1000000 + 'µm');
            }
        }
    }
    
    // Restore the original container ID.
    document.getElementById('chartContainer-placeholder').id = originalChartContainerId;
    targetContainer.id = useTabs ? 'tab-' + sheetName.replace(/[^a-zA-Z0-9]/g, '-') : '';

    return instanceNo;
}


function removeScatterTables() {
    const chartContainer = document.getElementById('chartContainer');
    
    // Remove all tables inside chartContainer
    const tables = chartContainer.getElementsByTagName('table');
    while (tables.length > 0) {
        tables[0].remove();
    }

    // Optionally, remove the button container if it exists
    const buttonContainer = document.getElementById('chartButtons');
    if (buttonContainer) {
        buttonContainer.remove();
    }
}

function displayScatterCharts(sheetName, chartType, subsKey, xAxisLabel, yAxisLabel, containerElement, instanceNo) {
    if (subsToDisplay[subsKey] && completeSheet[chartType.sheetKey]) {
        const retData = dataForTotalScatterCharting(sheetName, chartType.key);
        const { unitTitle, scatterData, chemicalData, fitConcentration, fitPredictors } = retData;
        
        if (unitTitle === 'No data') {
            return instanceNo;
        }
        
        const allChemicals = Object.keys(chemicalData);
        instanceNo += 1;
        
        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.id = 'chart' + instanceNo;
        containerElement.appendChild(combinedCanvas);
        displayCombinedScatterChart(scatterData, sheetName, instanceNo, 'fred');

        let largeInstanceNo = instanceNo;
        const scatterContainer = document.createElement('div');
        scatterContainer.className = 'scatter-flex-container';
        const startInstanceNo = instanceNo;

        for (let i = 0; i < allChemicals.length; i++) {
            instanceNo += 1;
            // Create a wrapper for each chart
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'scatter-chart-wrapper';
            
            const canvas = document.createElement('canvas');
            canvas.id = `chart${instanceNo}`;
            
            chartWrapper.appendChild(canvas);
            scatterContainer.appendChild(chartWrapper);
        }

        const chartContainer = containerElement; 
        if (largeInstanceNo > 1) {
            const divContainer = document.createElement('div');
            divContainer.id = 'chartButtons';
            chartContainer.appendChild(divContainer);
        }
        chartContainer.appendChild(scatterContainer); // Add the new flex container

        instanceNo = startInstanceNo;
        for (const c in chemicalData) {
            let sampleNames = Object.keys(fitConcentration[c]);
            const data = fitConcentration ? 
                concentrationFitter(fitConcentration[c], fitPredictors[c], 'Chart Analysis') : 
                { beta: 0, R_squared: 0 };

            instanceNo += 1;
            displayScatterChart(
                scatterData[c],
                chemicalData[c],
                sampleNames,
                sheetName,
                instanceNo,
                `${c} : ${data.R_squared.toFixed(4)}`,
                xAxisLabel,
                yAxisLabel,
                largeInstanceNo
            );
        }
    }
    return instanceNo;
}

function setBlanksForCharting() {
    let  datesSampled = Object.keys(selectedSampleMeasurements);
    // Have to deal with samples without measurements set everything to zero
    for (const ds in selectedSampleMeasurements) {
        for (const ct in selectedSampleMeasurements[ds]) {
            if (blankSheets[ct] == null || blankSheets[ct] == undefined) {
                if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null)) {
                    blankSheets[ct] = selectedSampleMeasurements[ds][ct];
                }
            }
        }
    }
    return
}

function heatmapColor(value, alpha = 1) {
 // Clamp value to [0, 1]
 value = Math.max(0, Math.min(1, value));

 let r = 0, g = 0, b = 0;

 if (value <= 0.25) {
    // Blue to Cyan
    let t = value / 0.25;
    r = 0;
    g = Math.round(255 * t);
    b = 255;
 } else if (value <= 0.5) {
    // Cyan to Green
    let t = (value - 0.25) / 0.25;
    r = 0;
    g = 255;
    b = Math.round(255 * (1 - t));
 } else if (value <= 0.75) {
    // Green to Yellow
    let t = (value - 0.5) / 0.25;
    r = Math.round(255 * t);
    g = 255;
    b = 0;
 } else {
    // Yellow to Red
    let t = (value - 0.75) / 0.25;
    r = 255;
    g = Math.round(255 * (1 - t));
    b = 0;
 }

 return `rgb(${r}, ${g}, ${b}, ${alpha})`;
}

function heatColor(value, alpha = 1) {
 // Clamp value to [0, 1]
 value = Math.max(0, Math.min(1, value));

 let r, g, b;

 if (value < 0.5) {
    // Green to Orange
    // Green: (0, 255, 0)
    // Orange: (255, 165, 0)
    let t = value / 0.5;
    r = Math.round(255 * t);
    g = Math.round(255 - (90 * t)); // from 255 to 165
    b = 0;
 } else {
    // Orange to Red
    // Orange: (255, 165, 0)
    // Red: (255, 0, 0)
    let t = (value - 0.5) / 0.5;
    r = 255;
    g = Math.round(165 * (1 - t));
    b = 0;
 }

 return `rgb(${r}, ${g}, ${b}, ${alpha})`;
}

// Function to interpolate between two colors based on the value
function colorGradient(value, color1, color2) {
    // Ensure the value is between 0 and 1
    value = Math.max(0, Math.min(1, value));

    // Convert colors from hex to RGB
    const color1RGB = hexToRgb(color1);
    const color2RGB = hexToRgb(color2);

    // Calculate the interpolated color
    const r = Math.round(color1RGB.r + value * (color2RGB.r - color1RGB.r));
    const g = Math.round(color1RGB.g + value * (color2RGB.g - color1RGB.g));
    const b = Math.round(color1RGB.b + value * (color2RGB.b - color1RGB.b));

    // Return the color in 'rgb(r,g,b)' format
    return `rgb(${r},${g},${b},0.5)`;
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    // Remove the hash symbol if present
    hex = hex.replace(/^#/, '');
    
    // Parse the red, green, and blue components
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function resizeChart(chart) {
    // Get the parent container of the chart
    var container = chart.canvas.parentNode;

    // Toggle the class to resize the chart
    container.classList.toggle('large-chart');
    
    // Update the chart to reflect the new size
    chart.resize();
}

function displayCombinedScatterChart(meas, sheetName, instanceNo, unitTitle) {
    legends[instanceNo] = true;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
//    createCanvas(instanceNo);  //Already done in displayCharts
    const convas = document.getElementById("chart" + instanceNo);
    if (!convas) {
        console.error(`Canvas with ID "chart${instanceNo}" not found for displayCombinedScatterChart.`);
        return;
    }
    convas.style.display = "block";
    instanceType[instanceNo] = 'combinedscatter';
    instanceSheet[instanceNo] = sheetName;
//console.log(meas);
//console.log(meas, sheetName, instanceNo, unitTitle);
    const allChemicals = Object.keys(meas);
    const allSamples = Object.keys(meas[allChemicals[0]]); // Assuming all samples have the same chemicals // Using the first concentration value for simplicity
    const datasets = allChemicals.map((chemical, index) => {
        const data = meas[chemical];
        return {
            label: chemical,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
//console.log(datasets);

    const chartConfig = {
        type: 'scatter',
        data:
        {
            datasets: datasets
        }
    };
    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
//console.log(instanceNo,ctx,chartConfig);
    chartInstance[instanceNo] = new Chart(ctx, chartConfig);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);
    createExportButton(chartInstance[instanceNo], instanceNo);
//  console.log(ddatasets);
}

function displayScatterChartLL(scatterData, oneChemical, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo) {
//console.log(scatterData, oneChemical, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    lastScatterInstanceNo = instanceNo;
    legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'Scatter ' + unitTitle;
    instanceSheet[instanceNo] = sheetName;
    const color1 = '#00ff00'; // Start of gradient (red)
    const color2 = '#ff0000'; // End of gradient (green)
      allSamples = Object.keys(oneChemical);
      allConcs = Object.values(oneChemical);
//console.log(allConcs);
      minConc = Math.min(...allConcs);
      maxConc = Math.max(...allConcs);
//console.log(minConc,maxConc);
//console.log(oneChemical);
//console.log('llscatterData', scatterData);
//      oneChemical = (oneChemical - minConc) / (maxConc - minConc);
      scaledChemical = [];
      let i = 0;
      for (s in oneChemical) {
        scaledChemical[i] = (oneChemical[s] - minConc) / (maxConc - minConc);
        i += 1;
      }
//console.log('oneChemical',oneChemical);
//console.log('scaledChemical',scaledChemical);
    colorScale = chroma.scale(['#007bff', '#ffc107', '#dc3545']).domain([minConc, maxConc]);
    colorSacle = colorScale.mode('lrgb');
//    const colorScale = chroma.scale(['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']).domain([minConc, maxConc]);
    const pointBackgroundColors = allConcs.map(value => colorScale(value).hex());


    // Chart configuration
    const chartConfig = {
        type: 'scatter',
        data: {
                  datasets: [{
                    data: scatterData,
                    backgroundColor: pointBackgroundColors,
//                        allSamples.map(sample => colorGradient(scaledChemical[sample], color1, color2)),
                    borderColor: pointBackgroundColors,
//                        allSamples.map(sample => colorGradient(scaledChemical[sample], color1, color2)),
//                        pointStyle: 'cross',
                        pointStyle: 'rect',
                        pointRadius: function(context) {
                         return convas.width / 70
                        }
                    }]
        },
        options: {
            plugins: {
                repsonsive: true,
                title: {
                    display: true,
                    text: unitTitle,
                    onEvent: function() {
                        console.log('this is fed');
                        resizeChart(chartInstance[instanceNo]);
                    }
                    },
                    subtitle: {
                        display: true,
                        text: 'Min: ' + minConc + ' Max: ' + maxConc
                        },
                        legend: {
                    display: false, 
                    position: 'bottom', 
                    labels: {
                        font: {  // Customize legend label font
                            size: 14,
                            weight: 'italic',
                            padding: 10
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            // Show the set name (dataset label) as the tooltip title
                            if (tooltipItems.length > 0) {
//                              return tooltipItems[0].dataset.label;
                                return tooltipItems[0].dataset.label;
                            }
                            return '';
                        },
                        label: function(context) {
                            const dataPoint = context.raw; // This contains {x, y, label: fullSampleName}
                            let pointLabel = dataPoint.label || ''; // Full sample name
                            if (pointLabel) {
                                pointLabel = pointLabel.split(':').pop().trim(); // Show only part after colon
                                pointLabel += ': ';
                            }
//console.log(dataPoint);
                            // Add the x and y values to the label
                            pointLabel += `(X: ${parseFloat(dataPoint.x).toFixed(2)}, Y: ${parseFloat(dataPoint.y).toFixed(2)})`;
                            return pointLabel;
                        }
                    },
//                },

                // Add a custom plugin for interactivity
                selectSample: {
                    highlightedSample: null,
                },
            },
                    // Add a custom plugin for interactivity
                    selectSample: {
                        highlightedSample: null,
                    },
            },
            scales: {
                x: {
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xAxisTitle
                        }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisTitle
                        }
                    }
                },
        }
    };
//console.log(chartConfig);
    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
    if (chartInstance[instanceNo]) {
        chartInstance[instanceNo].destroy();
    }
    chartInstance[instanceNo] = new Chart(ctx, chartConfig);
//  createToggleCanvasSize(convas, chartInstance[instanceNo], instanceNo, unitTitle);
//console.log(largeInstanceNo,oneChemical);
/* if (largeInstanceNo > 1) {
        createToggleFocusChart(convas, chartInstance[instanceNo], instanceNo, oneChemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    }*/
    document.getElementById('chart' + instanceNo).addEventListener('click', () => displayScatterChartLL(scatterData, oneChemical, sheetName, largeInstanceNo, unitTitle, xAxisTitle, yAxisTitle, -1));
    Chart.register({
        id: 'selectSample',
        afterDraw: function (chart, args, options) {
            const highlightedSample = chart.options.plugins.selectSample.highlightedSample;

            if (highlightedSample) {
    //console.log('highlightedSample ', highlightedSample);				
                const datasetIndex = chart.data.datasets.findIndex(dataset => dataset.label === highlightedSample);
                    if (datasetIndex !== -1) {
                    const dataset = chart.data.datasets[datasetIndex];
                    dataset.borderWidth = 4;
                    dataset.borderColor = 'red';
                }
            }
        },
    });
}



function displayScatterChart(scatterData, oneChemical, sampleNames, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo) {
//console.log(scatterData, oneChemical, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    lastScatterInstanceNo = instanceNo;
    legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'Scatter ' + unitTitle;
    instanceSheet[instanceNo] = sheetName;
    const color1 = '#00ff00'; // Start of gradient (red)
    const color2 = '#ff0000'; // End of gradient (green)
//    allSamples = Object.keys(oneChemical);
//    allConcs = Object.values(oneChemical);
//console.log(allSamples, allConcs);
//console.log(allConcs);
    // Chart configuration

//      data: {
//          datasets: finalChartDatasets
//      },
//console.log('scatterData', scatterData);
scatterData[0].backgroundColor ='rgba(63, 50, 50, 0.72)'; // Set background color to transparent
scatterData[0].backgroundColor.pointStyle = 'cross';
//console.log('scatterData', scatterData);
    let k = -1;
    let sD = [];
    let oC = [];
    for (let i=0; i<scatterData.length; i++) {
        for (let j=0; j<scatterData[i].data.length; j++) {
            k += 1;
            sD[k] = scatterData[i].data[j];
            oC[k] = sD[k].y;
        }
    }
    minConc = Math.min(...oC);
    maxConc = Math.max(...oC);
//console.log(minConc,maxConc);
//console.log(oneChemical);
    scaledChemical = [];
    for (let i=0; i<oC.length; i++) {
        scaledChemical[i] = (oC[i] - minConc) / (maxConc - minConc);
//console.log(oneChemical[s]);
    }
    const colorScale = chroma.scale(['green', 'yellow', 'red']).domain([minConc, maxConc]);
    const pointBackgroundColors = oC.map(value => colorScale(value).hex());
//console.log('scaledChemical', scaledChemical);
//console.log('sD',sD);
    const chartConfig = {
        type: 'scatter',
        data: {
//              datasets: Object.values(scatterData)/*[{
                  datasets: [{
                    data: sD,
//                    data: scatterData[0].data,
//                    label: 'fred',
                    backgroundColor: pointBackgroundColors,
//                        allSamples.map(sample => colorGradient(scaledChemical[sample], color1, color2)),
//                        allSamples.map(sample => f(scaledChemical[sample])),
//                        allSamples.map(sample => heatmapColor(scaledChemical[sample])),
                    borderColor: pointBackgroundColors,
//                        allSamples.map(sample => colorGradient(scaledChemical[sample], color1, color2)),
//                        allSamples.map(sample => f(scaledChemical[sample])),
//                        allSamples.map(sample => heatmapColor(scaledChemical[sample])),
                        pointRadius: function(context) {
                         return convas.width / 70
                        },
                        pointStyle: 'rect',
                    }]
        },
        options: {
            plugins: {
                repsonsive: true,
                maintainAspectRatio: false,
                colors: {
                    enabled: true,
                    forceOverride: false
                },
                title: {
                    display: true,
                    text: unitTitle,
                    onEvent: function() {
                        console.log('this is fed');
                        resizeChart(chartInstance[instanceNo]);
                    }
                },
                subtitle: {
                    display: true,
                    text: 'Min: ' + minConc + ' Max: ' + maxConc
                },
                legend: {
                    display: false, 
                    position: 'bottom', 
                    labels: {
                        font: {  // Customize legend label font
                           size: 14,
                            weight: 'italic',
                            padding: 10
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            // Show the set name (dataset label) as the tooltip title
                            if (tooltipItems.length > 0) {
//                              return tooltipItems[0].dataset.label;
                                return tooltipItems[0].dataset.label;
                            }
                            return '';
                        },
                        label: function(context) {
                            const dataPoint = context.raw; // This contains {x, y, label: fullSampleName}
                            let pointLabel = dataPoint.label || ''; // Full sample name
                            if (pointLabel) {
                                pointLabel = pointLabel.split(':').pop().trim(); // Show only part after colon
                                pointLabel += ': ';
                            }
//console.log(dataPoint);
                            // Add the x and y values to the label
                            pointLabel += `(X: ${dataPoint.x.toFixed(2)}, Y: ${dataPoint.y.toFixed(2)})`;
                            return pointLabel;
                        }
                    }
                },

                // Add a custom plugin for interactivity
                selectSample: {
                    highlightedSample: null,
                },
            },
                scales: {
                    x: {
                        position: 'bottom',
                        title: {
                            display: true,
                            text: xAxisTitle
                            }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisTitle
                            }
                        }
                    },
        }
    };
//console.log(chartConfig);
    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
    if (chartInstance[instanceNo]) {
        chartInstance[instanceNo].destroy();
    }
    chartInstance[instanceNo] = new Chart(ctx, chartConfig);
//console.log(chartConfig);

//  createToggleCanvasSize(convas, chartInstance[instanceNo], instanceNo, unitTitle);
//console.log(largeInstanceNo,oneChemical);
/* if (largeInstanceNo > 1) {
        createToggleFocusChart(convas, chartInstance[instanceNo], instanceNo, oneChemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    }*/
    document.getElementById('chart' + instanceNo).addEventListener('click', () => displayScatterChart(scatterData, oneChemical, sampleNames, sheetName, largeInstanceNo, unitTitle, xAxisTitle, yAxisTitle, -1));
    Chart.register({
        id: 'selectSample',
        afterDraw: function (chart, args, options) {
            const highlightedSample = chart.options.plugins.selectSample.highlightedSample;

            if (highlightedSample) {
    //console.log('highlightedSample ', highlightedSample);				
                const datasetIndex = chart.data.datasets.findIndex(dataset => dataset.label === highlightedSample);
                    if (datasetIndex !== -1) {
                    const dataset = chart.data.datasets[datasetIndex];
                    dataset.borderWidth = 4;
                    dataset.borderColor = 'red';
                }
            }
        },
    });
}

function displayPSDChart(sizes, meas, sheetName, instanceNo, unitTitle, subTitle) {
//console.log(sizes, meas, sheetName, instanceNo, unitTitle, subTitle);
//Bodge lost data for unitTitle
    if (unitTitle === undefined || unitTitle === null) {
        unitTitle = 'Particle size distribution (% at 0.5 phi intervals)'; //bodge	
    }
    legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'PSD ' + subTitle;
    instanceSheet[instanceNo] = sheetName;
    // Extract sample names from the PSD data structure
    const sampleNames = Object.keys(meas);

    // Create datasets for each sample
    const datasets = sampleNames.map((sampleName, index) => {
        return {
            label: sampleName,
            data: meas[sampleName],
            borderWidth: 2,
            fill: false,
        };
    });

// console.log('sizes: ',sizes);
// console.log('datasets: ',datasets)
    
        // Chart configuration
    const chartConfig = {
        type: 'line',
        data: {
            labels: sizes,
            datasets: datasets,
        },
        options: {
            plugins: {
                title: {
                  display: true,
                  text: sheetName + ': PSD by ' + subTitle
                  },
                  legend: {
                    display: false, 
                    position: 'bottom', 
                    labels: {
                        font: {  // Customize legend label font
                            size: 14,
                            weight: 'italic',
                            padding: 10
                        }
                    }
                },
                    // Add a custom plugin for interactivity
                    selectSample: {
                        highlightedSample: null,
                    },
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'm'
                            }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: unitTitle + ' by ' + subTitle
                            }
                        }
                    },
            autocolors: {
                mode: 'label'
            }
        }
    };

    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
    chartInstance[instanceNo] = new Chart(ctx, chartConfig);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);
    createExportButton(chartInstance[instanceNo], instanceNo);

    Chart.register({
        id: 'selectSample',
        afterDraw: function (chart, args, options) {
            const highlightedSample = chart.options.plugins.selectSample.highlightedSample;

            if (highlightedSample) {
    //console.log('highlightedSample ', highlightedSample);				
                const datasetIndex = chart.data.datasets.findIndex(dataset => dataset.label === highlightedSample);
                    if (datasetIndex !== -1) {
                    const dataset = chart.data.datasets[datasetIndex];
                    dataset.borderWidth = 4;
                    dataset.borderColor = 'red';
                }
            }
        },
    });
}

// Function to generate a random color
function getRandomColor() {
const letters = '0123456789ABCDEF';
let color = '#';
for (let i = 0; i < 6; i++) {
color += letters[Math.floor(Math.random() * 16)];
}
return color;
}

function displayPSDHighlight(meas, instanceNo, clickedMapSample) {
      legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    clickedSamples = findSamplesInSameLocation(clickedMapSample);
    const allChemicals = Object.keys(meas);
    let clickedIndexes = [];
    clickedSamples.forEach (clickedSample => {
        index = -1;
        for (const sample in meas[allChemicals[0]]) {
          index += 1;
          if (sample.includes(clickedSample)) {
              clickedIndexes.push(index);
          }
      }
  });
  clickedIndexes.forEach(item => {
//console.log('displayPSDHighlight',clickedIndexes);
//console.log('item ',item);
chartInstance[instanceNo].options.plugins.selectSample.highlightedSample = item;
    });
  // Update the chart
  chartInstance[instanceNo].update();
}

// Helper function to remove highlighting
function removePSDHighlight() {
    chartInstance.options.plugins.selectSample.highlightedSample = null;
    chartInstance.update();
}

patternNames = ['plus', 'diamond-box', 'weave', 'cross', 'dash', 'cross-dash', 'dot',
                'zigzag-vertical', 'diagonal', 'dot-dash', 'disc', 'ring', //'line', 
                'line-vertical', 'zigzag', 'diagonal-right-left', 'square', 'box', 
                'triangle', 'triangle-inverted', 'diamond'];
patterns = {};
for (let i = 0; i < 40; i++) {
//for (let i = 0; i < patternNames.length; i++) {
    patterns[i] =  pattern.draw(patternNames[i], 'rgba(0.1,0.1,0.1,1)');
}

shapeNames = ['circle', 'cross', 'crossRot', 'dash', 'line', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle'];

function displaySampleChart(meas, sheetName, instanceNo, unitTitle) {
//console.log(meas, sheetName, instanceNo, unitTitle);
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'chemical';
    instanceSheet[instanceNo] = sheetName;
//console.log(meas);
    const allChemicals = Object.keys(meas);
    const allSamples = Object.keys(meas[allChemicals[0]]); // Assuming all samples have the same chemicals
    let i= -1;
    const datasets = allChemicals.map((chemical, index) => {
        i += 1;
        const data = allSamples.map(sample => meas[chemical][sample]); // Using the first concentration value for simplicity
        if (lookSetting === 'colour') {
            return {
                label: chemical,
                data: data,
                borderWidth: 1,
                yAxisID: 'y',
//              backgroundColor: getRandomColor(),
//              backgroundColor: pattern.draw('square',getRandomColor()),
            };
        } else {
            return {
                label: chemical,
                data: data,
                borderWidth: 1,
                yAxisID: 'y',
                backgroundColor: patterns[i],
            };
        }
    });
    displayAnySampleChart(meas, allSamples,datasets,instanceNo,sheetName,unitTitle,false);
    if(sheetName === 'PAH data') {
        //This is where to create the buttons which show different PAH groups
//console.log('PAH data reset');
        createDisplayChemicals(instanceNo, 'EPA');
        createDisplayChemicals(instanceNo, 'LMW');
        createDisplayChemicals(instanceNo, 'HMW');
        createDisplayChemicals(instanceNo, 'SmallPts');
        createDisplayChemicals(instanceNo, 'OrganicC');
        createResetChart(instanceNo);
    }
}

function highlightMapLocation(clickedIndex) {
    console.log(clickedIndex);
    return
}

function isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
    return true;
}

function createRadarPlot(meas, sheetName) {
        if (!isEmpty(popupInstance)) {
            allPopupKeys = Object.keys(popupInstance);
            allPopupKeys.forEach(popupKey => {
                popupInstance[popupKey].destroy();
            });
            popupInstance = [];
        }
        const allChemicals = Object.keys(meas);
        const allSamples = Object.keys(meas[allChemicals[0]]); // Assuming all samples have the same chemicals
        let data = {};
        const datasets = allSamples.map((sample, index) => {
            data[sample] = allChemicals.map(chemical => meas[chemical][sample]); // Using the first concentration value for simplicity
        });
        
//console.log("datasets ",datasets);
    
    const chartsForMapContainer = document.getElementById('chartsForMapContainer');
    for (sample in data) {
        const divId = `radar_${sample}`;
        const divContainer = document.createElement('div');
        divContainer.id = divId;
        divContainer.style = "width:250px; height:300px;"
        chartsForMapContainer.appendChild(divContainer);
        const canvas = document.createElement('canvas');
        canvas.id = `c_${divId}`; // Unique chart ID
        canvas.style = "width:250px; height:300px;"
        divContainer.appendChild(canvas); // Append the canvas to the container
        const ctx = document.getElementById(canvas.id);
        popupInstance[sample] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: allChemicals,
                datasets: [{
                    label: sample,
                    data: data[sample]
                }]
            },
            options: {
                scales: {
                    r: {
                        pointLabels: {
                            display: false //Hides the labels around the radar chart
                        }
                    },
                }
            }
        });
    }
}

function displayAnySampleChart(meas, all, datasets, instanceNo, title, yTitle, showLegend) {
    let readableLabels = [];
    for (i = 0; i < all.length; i++) {
        let parts = all[i].split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
//console.log(parts[0],parts[1]);
        readableLabels[i] = selectedSampleInfo[parts[0]].label + ': ' + selectedSampleInfo[parts[0]].position[parts[1]].label;
    }
//console.log(readableLabels,datasets);
    displayAnyChart(meas, readableLabels, datasets, instanceNo, title, yTitle, showLegend);
}

function displayAnyChart(meas, all, datasets, instanceNo, title, yTitle, showLegend) {
    legends[instanceNo] = showLegend;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    const ctx = document.getElementById('chart' + instanceNo);

    // Get the current sorting value.
    // This assumes xAxisSort is a global or accessible variable.
//  const xAxisSort = document.getElementById('sorting-select').value;
//  const selectedSortText = sortSelect.options[sortSelect.selectedIndex].text;

    stanGraph = {
        type: 'bar',
        data: {
            labels: all,
            datasets: datasets
        },
        options: {
            interaction: {
                mode: 'index',
                axis: 'xy'
            },
            plugins: {
                title: {
                    display: true,
                    text: title
                },

                // The caption now uses the descriptive text.
                subtitle: {
                    display: true,
                    text: 'Samples ordered by: ' + xAxisSort,
                    color: '#666',
                    font: {
                        size: 12,
                        style: 'italic'
                    },
/* padding: {
                        top: 10
                    }*/
                },
                legend: {
                    display: showLegend,
                    position: 'top',
                    labels: {
                        font: {  // Customize legend label font
                            size: 14,
                            weight: 'italic',
                            padding: 10
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        modifierKey: 'shift',
                    },
                    limits: {
                        y: { min: 0 }
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        drag: {
                            enabled: true,
                        },
                        mode: 'xy'
                    }
                },
            },
            indexAxis: 'x',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        maxRotation: 90,
                        minRotation: 90,
                        autoSkip: false,
                    },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yTitle,
                        position: 'left',
                    },
                },
            },
            autocolors: {
                mode: 'label'
            }
        }
    };
    if (title.includes('hydrocarbon')) {
        stanGraph.options.scales.y1 = {
            beginAtZero: true,
            position: 'right',
            title: {
                display: true,
                text: 'Total PAH content (mg/kg)',
                position: 'right',
            }
        };
    };
    if (title.includes('factor')) {
        stanGraph.options.scales.y1 = {
            beginAtZero: true,
            position: 'right',
            title: {
                display: true,
                text: 'Concentrating Factor',
                position: 'right',
            }
        };
    };
    if (title.includes('Organic')) {
        stanGraph.options.scales.y1 = {
            beginAtZero: true,
            position: 'right',
            title: {
                display: true,
                text: 'Organic matter (total organic carbon)',
                position: 'right',
            }
        };
    };
    chartInstance[instanceNo] = new Chart(ctx, stanGraph);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);
    createExportButton(chartInstance[instanceNo], instanceNo);
    function clickableScales(chart, canvas, click) {
        const height = chart.scales.x.height;
        const top = chart.scales.x.top;
        const bottom = chart.scales.x.bottom;
        const left = chart.scales.x.left;
        const right = chart.scales.x.maxWidth / chart.scales.x.ticks.length;
        let resetCoordinates = canvas.getBoundingClientRect();
        const x = click.clientX - resetCoordinates.left;
        const y = click.clientY - resetCoordinates.top;
        if (y >= top && y <= bottom) {
            for (let i = 0; i < chart.scales.x.ticks.length; i++) {
                if (x >= left + (right * i) && x <= left + (right * (i + 1))) {
                    console.log('x label', i);
                    const regexPattern = /^(.+): (.+)$/;
                    const matchResult = all[i].match(regexPattern);
                    if (matchResult) {
                        const dateSampled = matchResult[1];
                        const sample = matchResult[2];
                        console.log("Date Sampled: ", dateSampled);
                        console.log("Sample:", sample);
                        // Corrected call with only two arguments
                        createHighlights(meas, hoveredSample);
//250808                      createHighlights(meas, dateSampled, all[i], null);
                    } else {
                        console.log("String format doesn't match the expected pattern.");
                    };
                }
            }
        }
    }
    ctx.addEventListener('click', (e) => {
        clickableScales(chartInstance[instanceNo], ctx, e);
        chartInstance[instanceNo].resize();
    });
    const xLabels = document.querySelectorAll('#chart' + instanceNo + '.chartjs-axis-x .chartjs-axis-label');
    xLabels.forEach((label, index) => {
        label.addEventListener('click', () => {
            console.log('about to toggle');
            toggleHighlightMapLocation(index);
        });
    });
}

function displayChemicalChart(meas, sheetName, instanceNo, unitTitle, dsiplayALs) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'sample';
    instanceSheet[instanceNo] = sheetName;
    const allChemicals = Object.keys(meas);
    const allSamples = Object.keys(meas[allChemicals[0]]); // Assuming all samples have the same chemicals
    const datasets = allSamples.map((sample, index) => {
        const data = allChemicals.map(chemical => meas[chemical][sample]); // Using the first concentration value for simplicity
//console.log(data);
        return {
            label: sample,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
//console.log(datasets);
    
//console.log("datasets ",datasets);
    names4Chemicals = allChemicals;
    if (sheetName === 'PCB data') {
//console.log('PCB data allChemicals',allChemicals);
        names4Chemicals = [];
        allChemicals.forEach(chemical => {names4Chemicals.push(ddLookup.reverseChemical[chemical])});
//console.log('PCB data names4Chemicals',names4Chemicals);
    }
    displayAnyChart(meas, names4Chemicals,datasets,instanceNo,sheetName,unitTitle,false);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    let allal = actionLevels[sheetName];

if (dsiplayALs) {
    if(allal) {
        allChemicals.forEach (chemical => {
            let  al = allal[chemical] ? allal[chemical].slice() : null;
            alMax = 0;
            al2 = false;
            if(al) {
                item = allChemicals.indexOf(chemical);
                for (i = 0; i < 2; i++) {
                    if (al[i] > 0.0) {
                        // Get the units right between action levels and sample measurements
                        // Action levels are all in mg/kg but PAHs in ug/kg
                        if (sheetName === 'PAH data') {
                            al[i] = al[i] * 1000;
                        }
                        if (i === 1) {
                            al2 = true;
                        }
                        chartLine(instanceNo,chemical + i,item-0.5,item+0.5,al[i],al[i],actionLevelColors[i],actionLevelDashes[i]);
                    }
                }
                if (al[1] > alMax) {
                    alMax = al[1];
                }
            }
        });
        maxConc = findMaxConcentration(meas);
//console.log('maxConc ',maxConc);
//console.log(meas);			
        if (maxConc > alMax) {
            alMax = maxConc;
        }
        alX = allChemicals.length * 0.03;
        chartLabel(instanceNo,alX,0.8*alMax,actionLevelColors[0],'Action Level 1                        ');
        chartLine(instanceNo,'Legend - Action Level 1',alX*1.4,alX*2.5,0.8*alMax,0.8*alMax,actionLevelColors[0],actionLevelDashes[0]);
        if (al2) {
            chartLabel(instanceNo,alX,0.9*alMax,actionLevelColors[1],'Action Level 2                        ');
            chartLine(instanceNo,'Legend - Action Level 2',alX*1.4,alX*2.5,0.9*alMax,0.9*alMax,actionLevelColors[1],actionLevelDashes[1]);
//console.log(sheetName,'here');
        }
    }
}
    // Update the chart
    chartInstance[instanceNo].update();
    }
    // Function to find the maximum concentration
    function findMaxConcentration(data) {
    let maxConcentration = -Infinity;

    for (const chemical in data) {
    for (const sample in data[chemical]) {
        const concentration = data[chemical][sample];
        if (concentration > maxConcentration) {
            maxConcentration = concentration;
        }
    }
    }

    return maxConcentration;
}

function chartLine(instanceNo,name,xMin,xMax,yMin,yMax,borderColor,borderDash) {
      chartInstance[instanceNo].options.plugins.annotation.annotations[('line-' + instanceNo + '-' + name)] = {
        type: 'line',
        yMin: yMin,
        yMax: yMax,
        xMin: xMin,
        xMax: xMax,
        borderColor: borderColor,
        borderDash: borderDash,
        borderWidth: 2,
    };
}
    
function chartLabel(instanceNo,xValue,yValue,borderColor,label) {
    chartInstance[instanceNo].options.plugins.annotation.annotations[('label-' + instanceNo + '-'+label)] = {
      type: 'label',
      enabled: true,
      xValue: xValue,
      yValue: yValue,
      color: borderColor,
      backgroundColor: 'rgba(200,200,200)',
      content: [label],
      font: {
        size: 10
      }
    };
}

function displayTotalSolidOrganicC(sortedSamples, sheetName, instanceNo, unitTitle, subTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'totsolorgc';
    instanceSheet[instanceNo] = sheetName;
    let index = 0;
    const allSamples = sortedSamples; // Use the sorted samples from the retData
    let totalSolids = [];
    let organicC = [];
    allSamples.forEach((sampleName, i) => {
        const parts = sampleName.split(": ");
        if (parts.length >2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        totalSolids[i] = selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]]['Total solids (% total sediment)'];
        organicC[i] = selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]]['Organic matter (total organic carbon)'];
    });

    datasets = [
        {
            label: 'Total Solids %',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            data: totalSolids,
            yAxisID: 'y',
        },
        {
            label: 'Organic Carbon %',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: organicC,
            yAxisID: 'y1',
        },
    ];

    console.log(datasets);

    displayAnySampleChart(totalSolids, allSamples, datasets, instanceNo, sheetName + ': Total Solids % and Organic Carbon %', 'Total solids (% total sediment)', true);
    // Update the chart
    chartInstance[instanceNo].options.plugins.legend.display = true;
    legends[instanceNo] = true;
    chartInstance[instanceNo].update();
}




function displayResuspensionFractions(sizes, cumWeights, cumAreas, sheetName, instanceNo, unitTitle, subTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'resuspfrac';
    instanceSheet[instanceNo] = sheetName;
    let ptsSizes = sizes;
    let index = 0;
    //console.log('PTSSIZES',ptsSizes);
    for (let i=0;i<ptsSizes.length;i++) {
        if (ptsSizes[i] < resuspensionSize) {
            index = i;
            break;
        }
    }
    let i = 0;
    fractionWeights = [];
    fractionAreas = [];
    areaWeightRatios = [];
    relativeToxicity = []
    for (dsSample in cumWeights) {
        fractionWeights[i] = cumWeights[dsSample][index] / 100;
        fractionAreas[i] = cumAreas[dsSample][index] / 100;
        areaWeightRatios[i] = fractionAreas[i] / fractionWeights[i];
        i += 1;
    }
    
    
    
    
    //samples.forEach(sample => console.log(sample));
//  const lmwSumData = samples.map(sample => sums[sample].lmwSum);
    //console.log(lmwSumData);
//  const hmwSumData = samples.map(sample => sums[sample].hmwSum);
    //console.log(hmwSumData);
    const samples = Object.keys(cumWeights);
    datasets = [
        {
            label: 'Fraction Weight',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            data: fractionWeights,
            yAxisID: 'y',
        },
        {
            label: 'Fraction Area',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: fractionAreas,
            yAxisID: 'y',
        },
        {
            type: 'line',
            label: 'Area / Weight Ratio',
            backgroundColor: 'rgba(55, 99, 132, 0.5)',
            borderColor: 'rgba(55, 99, 132, 1)',
            borderWidth: 1,
            data: areaWeightRatios,
            yAxisID: 'y1',
        },
    ];

    console.log(datasets);

    displayAnySampleChart(cumWeights, samples, datasets, instanceNo, sheetName + ': Fractions < ' + resuspensionSize * 1000000 + 'µm and Concentration factor', 'Fraction', true);
//  displayAnyChart(cumWeights, samples, datasets, instanceNo, sheetName + ': Fractions < ' + resuspensionSize * 1000000 + 'µm', unitTitle, true);
//  displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Total hydrocarbon & Total PAH',unitTitle,true);
    // Update the chart
    chartInstance[instanceNo].options.plugins.legend.display = true;
    legends[instanceNo] = true;
    chartInstance[instanceNo].update();
}

function displayGorhamTest(sums, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'gorham';
    instanceSheet[instanceNo] = sheetName;
    const lmw = ['Acenapthene', 'Acenapthylene', 'Anthracene', 'Fluorene', 'C1-Napthalenes', 'Napthalene', 'Phenanthrene'];
    const hmw = ['Benz[a]anthracene', 'Benzo[a]pyrene', 'Chrysene', 'Dibenz[a,h]anthracene', 'Fluoranthene', 'Pyrene'];
    const LMW = {
        ERL: 552,
        ERM: 3160
    };
    const HMW = {
        ERL: 1700,
        ERM: 9600
    };

//  const samples = Object.keys(cumWeights);
    const samples = Object.keys(sums);
//console.log(samples);
//console.log(sums);
//samples.forEach(sample => console.log(sample));
    const lmwSumData = samples.map(sample => sums[sample].lmwSum);
//console.log(lmwSumData);
    const hmwSumData = samples.map(sample => sums[sample].hmwSum);
//console.log(hmwSumData);
            datasets = [
                {
                    label: 'LMW Sums',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    data: lmwSumData,
                    yAxisID: 'y',
                },
                {
                    label: 'HMW Sums',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    data: hmwSumData,
                    yAxisID: 'y',
                },
            ];

    displayAnySampleChart(sums, samples,datasets,instanceNo,sheetName + ': Gorham Test Protocol',unitTitle,true);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartLine(instanceNo,'LMW.ERL',0,samples.length,LMW.ERL,LMW.ERL,'rgba(0, 0, 255, 0.5)',[3,3]);
    chartLine(instanceNo,'LMW.ERM',0,samples.length,LMW.ERM,LMW.ERM,'rgba(0, 0, 255, 0.5)',[5,5]);
    chartLine(instanceNo,'HMW.ERL',0,samples.length,HMW.ERL,HMW.ERL,'rgba(255, 0, 0, 0.5)',[3,3]);
    chartLine(instanceNo,'HMW.ERM',0,samples.length,HMW.ERM,HMW.ERM,'rgba(255, 0, 0, 0.5)',[5,5]);
    gorX = samples.length * 0.05;
    gorMax = HMW.ERM;
    for (const sample in sums) {
        if (sums[sample].lmwSum > gorMax) {
            gorMax = sums[sample].lmwSum;
        }
        if (sums[sample].hmwSum > gorMax) {
            gorMax = sums[sample].hmwSum;
        }
    }
    chartLabel(instanceNo,gorX,0.75*gorMax,'rgba(0, 0, 255, 0.5)','LMW ERL                               ');
    chartLine(instanceNo,'Legend - LMW.ERL',gorX*1.2,gorX*2.2,0.75*gorMax,0.75*gorMax,'rgba(0, 0, 255, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.8*gorMax,'rgba(0, 0, 255, 0.5)','LMW ERM                               ');
    chartLine(instanceNo,'Legend - LMW.ERM',gorX*1.2,gorX*2.2,0.8*gorMax,0.8*gorMax,'rgba(0, 0, 255, 0.5)',actionLevelDashes[1]);
    chartLabel(instanceNo,gorX,0.9*gorMax,'rgba(255, 0, 0, 0.5)','HMW ERL                               ');
    chartLine(instanceNo,'Legend - HMW.ERL',gorX*1.2,gorX*2.2,0.9*gorMax,0.9*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.95*gorMax,'rgba(255, 0, 0, 0.5)','HMW ERM                               ');
    chartLine(instanceNo,'Legend - HMW.ERM',gorX*1.2,gorX*2.2,0.95*gorMax,0.95*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[1]);
  // Update the chart
  chartInstance[instanceNo].options.plugins.legend.display = true;
  legends[instanceNo] = true;
  chartInstance[instanceNo].update();
}



function displayPAHRatios(ratios, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'pahratios';
    instanceSheet[instanceNo] = sheetName;
    const allSamples = Object.keys(ratios);
    const allRatios = Object.keys(ratios[allSamples[0]]); // Assuming all samples have the same chemicals
    const datasets = allRatios.map(ratio => {
            const data = allSamples.map(sample => ratios[sample][ratio]); // Using the first concentration value for simplicity
        return {
            label: ratio,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnySampleChart(ratios, allSamples, datasets, instanceNo, sheetName + ': Ratios', unitTitle,true);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartInstance[instanceNo].update();
}

function displayEpaRatios(epaRatios, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'eparatios';
    instanceSheet[instanceNo] = sheetName;
    const allSamples = Object.keys(epaRatios);
    const allRatios = Object.keys(epaRatios[allSamples[0]]); // Assuming all samples have the same chemicals
    const datasets = allRatios.map((ratio, index) => {
        const data = allSamples.map(sample => epaRatios[sample][ratio]); // Using the first concentration value for simplicity
        return {
            label: ratio,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnySampleChart(epaRatios, allSamples, datasets, instanceNo, sheetName + ': EPA Ratios', unitTitle,true);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartInstance[instanceNo].update();
}

function displaySimpleRatios(simpleRatios, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'simpleratios';
    instanceSheet[instanceNo] = sheetName;
    const allSamples = Object.keys(simpleRatios);
    const allRatios = Object.keys(simpleRatios[allSamples[0]]); // Assuming all samples have the same chemicals
    const datasets = allRatios.map((ratio, index) => {
        const data = allSamples.map(sample => simpleRatios[sample][ratio]); // Using the first concentration value for simplicity
        return {
            label: ratio,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnySampleChart(simpleRatios, allSamples, datasets, instanceNo, sheetName + ': Simple Ratios', unitTitle,);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartInstance[instanceNo].update();
}

function displayRingFractions(fractions, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'ringfractions';
    instanceSheet[instanceNo] = sheetName;
    const allSamples = Object.keys(fractions);
    const allFractions = Object.keys(fractions[allSamples[0]]); // Assuming all samples have the same chemicals
    const datasets = allFractions.map((fraction, index) => {
        const data = allSamples.map(sample => fractions[sample][fraction]); // Using the first concentration value for simplicity
        return {
            label: fraction,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnySampleChart(fractions, allSamples, datasets, instanceNo, sheetName + ' Ring Fractions', unitTitle,true);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartInstance[instanceNo].options.scales.x.stacked = true;
    chartInstance[instanceNo].options.scales.y.stacked = true;
    chartInstance[instanceNo].update();
}

function displayCongener(sums, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'congener';
    instanceSheet[instanceNo] = sheetName;
    const samples = Object.keys(sums);
    const ICES7SumData = samples.map(sample => sums[sample].ICES7);
    const allSumData = samples.map(sample => sums[sample].All);
    const datasets = [
        {
            label: 'ICES7',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            data: ICES7SumData,
            yAxisID: 'y',
        },
        {
            label: 'All',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: allSumData,
            yAxisID: 'y',
        },
    ];
    displayAnySampleChart(sums, samples,datasets,instanceNo,sheetName + ': Congener Sums',unitTitle,true);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartLine(instanceNo,'ICES7 Action Level 1',0,samples.length,0.01,0.01,'rgba(0, 0, 255, 0.5)',[3,3]);
    chartLine(instanceNo,'All Action Level 1',0,samples.length,0.02,0.02,'rgba(255, 0, 0, 0.5)',[3,3]);
    chartLine(instanceNo,'All Action Level 2',0,samples.length,0.2,0.2,'rgba(255, 0, 0, 0.5)',[5,5]);
    gorX = samples.length * 0.1;
    gorMax = 0.2;
    for (const sample in sums) {
        if (sums[sample].ICES7 > gorMax) {
            gorMax = sums[sample].ICES7;
        }
        if (sums[sample].All > gorMax) {
            gorMax = sums[sample].All;
        }
    }
    chartLabel(instanceNo,gorX,0.75*gorMax,'rgba(0, 0, 255, 0.5)','ICES7 Action Level 1                               ');
    chartLine(instanceNo,'Legend - ICES7 AL1',gorX*1.2,gorX*2.2,0.75*gorMax,0.75*gorMax,'rgba(0, 0, 255, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.9*gorMax,'rgba(255, 0, 0, 0.5)','All Action Level 1                               ');
    chartLine(instanceNo,'Legend - All AL1',gorX*1.2,gorX*2.2,0.9*gorMax,0.9*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.95*gorMax,'rgba(255, 0, 0, 0.5)','All Action Level 2                               ');
    chartLine(instanceNo,'Legend - All AL2',gorX*1.2,gorX*2.2,0.95*gorMax,0.95*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[1]);
  // Update the chart
  chartInstance[instanceNo].update();
}

function displayScatterTotalHC(sums, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'scatterTotalHC';
    instanceSheet[instanceNo] = sheetName;
    const samples = Object.keys(sums);
    const totalHC = samples.map(sample => sums[sample].totalHC);
    const fractionPAH = samples.map(sample => sums[sample].fractionPAH);
    const datasets = [
        {
            label: 'Total Hydrocarbon',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            data: totalHC,
            yAxisID: 'y',
        },
        {
            label: 'Total PAH',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: fractionPAH,
            yAxisID: 'y1',
        },
    ];
displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Total hydrocarbon & Total PAH',unitTitle,true);
y1Title = 'Total PAH';
chartInstance[instanceNo].options.plugins.legend.display = true;
legends[instanceNo] = true;
  // Update the chart
  chartInstance[instanceNo].update();
}

function displayTotalHC(sums, sheetName, instanceNo, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'totalHC';
    instanceSheet[instanceNo] = sheetName;
    const samples = Object.keys(sums);
//samples.forEach(sample => console.log(sample));
    const totalHC = samples.map(sample => sums[sample].totalHC);
    const fractionPAH = samples.map(sample => sums[sample].fractionPAH);
    const datasets = [
        {
            label: 'Total Hydrocarbon',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            data: totalHC,
            yAxisID: 'y',
        },
        {
            label: 'Total PAH',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: fractionPAH,
            yAxisID: 'y1',
        },
    ];
    displayAnySampleChart(sums, samples, datasets, instanceNo, sheetName + ': Total hydrocarbon & Total PAH', unitTitle, true);
//  y1Title = 'Total PAH';
    chartInstance[instanceNo].options.plugins.legend.display = true;
    legends[instanceNo] = true;
    // Update the chart
    chartInstance[instanceNo].update();
}


/*function findSamplesInSameLocation(clickedMapSample) {
    for (ds in selectedSampleInfo) {
        for (s in selectedSampleInfo[ds].position) {
            if (clickedMapSample === s) {
                lat = selectedSampleInfo[ds].position[s]['Position latitude'];
                lon = selectedSampleInfo[ds].position[s]['Position longitude'];
            }
        }
    }
    clickedMapSamples = [];		
    for (ds in selectedSampleInfo) {
        for (s in selectedSampleInfo[ds].position) {
            const testPos = selectedSampleInfo[ds].position[s];
            if (testPos['Position latitude'] === lat && testPos['Position longitude'] === lon) {
                clickedMapSamples.push(ds + ': ' + s);
            }
        }
    }
    return clickedMapSamples
}*/

//250808 The function has been modified to handle full sample names with date and sample name
function findSamplesInSameLocation(clickedFullSample) {
    let lat, lon;
    
    // Correctly parse the full sample name (e.g., "date: sample")
    const parts = clickedFullSample.split(": ");
    const datePart = parts[0];
    // Handle sample names that might contain a colon
    const samplePart = parts.length > 2 ? parts.slice(1).join(": ") : parts[1];

    // Find coordinates of the clicked sample
    if (selectedSampleInfo[datePart] && selectedSampleInfo[datePart].position[samplePart]) {
        lat = selectedSampleInfo[datePart].position[samplePart]['Position latitude'];
        lon = selectedSampleInfo[datePart].position[samplePart]['Position longitude'];
    } else {
        return [clickedFullSample]; // Fallback if not found
    }
    
    // Now find all other samples at that exact lat/lon
    const samplesAtLocation = [];
    for (const ds in selectedSampleInfo) {
        for (const s in selectedSampleInfo[ds].position) {
            const testPos = selectedSampleInfo[ds].position[s];
            if (testPos['Position latitude'] === lat && testPos['Position longitude'] === lon) {
                samplesAtLocation.push(ds + ': ' + s);
            }
        }
    }
    return samplesAtLocation;
}

/* hidden 25/8/8 function createHighlights(meas, dateSampled, hoveredSample) {
console.log('createHighlights',hoveredSample,dateSampled);
    noSamples = 0;
    samples = [];
    const datesSampled = Object.keys(selectedSampleInfo);
//srg250308   datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        const ok = Object.keys(selectedSampleInfo[dateSampled].position);
        noSamples += ok.length;
        const allSamples = Object.keys(selectedSampleInfo[dateSampled].position);
//srg250308       allSamples.sort();
        allSamples.forEach(sample => {
            samples.push(dateSampled + ': ' + sample);
        });
        //			}
    });
    //This needs the new sorting logic *************************************************************************
//  if (!(xAxisSort === 'normal')) {
        samples.sortComplexSamples();
//  }
//console.log(samples, hoveredSample);
    if (!dateSampled) {
        clickedSamples = findSamplesInSameLocation(hoveredSample);
//console.log('Not dateSampled', hoveredSample);
    } else {
        clickedSamples = [];
        clickedSamples[0] = dateSampled + ': ' + hoveredSample;
//clickedSamples[0] = hoveredSample;
//console.log('dateSampled',dateSampled,hoveredSample);
    }
    //console.log('clickedSamples',clickedSamples);
    const allChemicals = Object.keys(meas);
    let clickedIndexes = [];
//console.log('samples', samples);
//console.log('clickedSamples', clickedSamples);
    //  console.log('meas[allChemicals[0]]', Object.keys(meas[allChemicals[0]]));
    clickedSamples.forEach(clickedSample => {
        index = -1;
        samples.forEach(sample => {
//console.log(sample);
            index += 1;
            if ((dateSampled + ': ' + sample) === clickedSample) {
                clickedIndexes.push(index);
            }
        });
    });
 //console.log('clickedIndexes',clickedIndexes);
    clickedIndexes.forEach(item => {
//console.log('doing the null bit');
        if (highlighted[item]) {
            highlighted[item] = false;
        } else {
            highlighted[item] = true;
        }
    });
 //console.log(highlighted);
    clickedIndexes.forEach(item => {
        console.log(item);
        for (let i = 1; i < lastInstanceNo + 1; i++) {
            if (instanceType[i] === 'gorham' || instanceType[i] === 'chemical' || instanceType[i] === 'congener' ||
                instanceType[i] === 'totalHC' || instanceType[i] === 'pahratios' || instanceType[i] === 'ringfractions' ||
                instanceType[i] === 'eparatios' || instanceType[i] === 'simpleratios') {
                if (highlighted[item]) {
                    displayChartHighlight(meas, i, dateSampled, item);
                } else {
                    removeChartHighlight(meas, i, dateSampled, item);
                }
            }
        }
        if (highlighted[item]) {
            // highlightMarkers set to null if no position coordinates were available
            console.log('addcharhigh', item, (!highlightMarkers[item] === null));
            if (!(highlightMarkers[item] === null)) {
    // Highlight marker on map
                map.addLayer(highlightMarkers[item]);
            }
        } else {
            // highlightMarkers set to null if no position coordinates were available
            console.log('remcharhigh', item, (!highlightMarkers[item] === null));
            if (!(highlightMarkers[item] === null)) {
                // Remove highlight of marker on map
                if (map.hasLayer(highlightMarkers[item])) {
                    map.removeLayer(highlightMarkers[item]);
                }
            }
        }
    });
}*/

/*// first try 250808 The 'dateSampled' parameter has been removed as it was causing the error
function createHighlights(meas, hoveredSample) {
    console.log('createHighlights', hoveredSample);

    // This part rebuilds the sorted list of all samples. This logic is correct.
    const samples = [];
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.forEach(dateSampled => {
        const allSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        allSamples.forEach(sample => {
            samples.push(dateSampled + ': ' + sample);
        });
    });
    samples.sortComplexSamples(); // Ensure order matches the map markers

    // --- FIX START ---

    // Use the corrected findSamplesInSameLocation function
    const clickedSamples = findSamplesInSameLocation(hoveredSample);
    
    const clickedIndexes = [];
    // Find the index for each co-located sample efficiently
    clickedSamples.forEach(clickedSample => {
        const index = samples.indexOf(clickedSample);
        if (index > -1) {
            clickedIndexes.push(index);
        }
    });
    
    // --- FIX END ---

    // The rest of the function for toggling highlights is correct
    clickedIndexes.forEach(item => {
        if (highlighted[item]) {
            highlighted[item] = false;
        } else {
            highlighted[item] = true;
        }
    });

    clickedIndexes.forEach(item => {
        for (let i = 1; i < lastInstanceNo + 1; i++) {
            // This logic correctly highlights the charts
            if (instanceType[i] === 'gorham' || instanceType[i] === 'chemical' || instanceType[i] === 'congener' ||
                instanceType[i] === 'totalHC' || instanceType[i] === 'pahratios' || instanceType[i] === 'ringfractions' ||
                instanceType[i] === 'eparatios' || instanceType[i] === 'simpleratios') {
                if (highlighted[item]) {
                    displayChartHighlight(meas, i, null, item); // dateSampled no longer needed
                } else {
                    removeChartHighlight(meas, i, null, item); // dateSampled no longer needed
                }
            }
        }
        // This logic correctly highlights the map
        if (highlighted[item]) {
            if (highlightMarkers[item]) {
                map.addLayer(highlightMarkers[item]);
            }
        } else {
            if (highlightMarkers[item] && map.hasLayer(highlightMarkers[item])) {
                map.removeLayer(highlightMarkers[item]);
            }
        }
    });
}*/

/*function createHighlights(meas, clickedSampleIdentifier) {
    // 1. Create the master list of all samples and sort it EXACTLY as in sampleMap.
    // This list provides the correct order for finding the highlight marker's index.
    const masterSampleList = [];
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.forEach(date => {
        const samplesForDate = Object.keys(selectedSampleInfo[date].position);
        samplesForDate.forEach(sampleName => {
            masterSampleList.push(date + ': ' + sampleName);
        });
    });
    masterSampleList.sortComplexSamples();

    // 2. Find the coordinates of the sample that was actually clicked.
    let clickedLat, clickedLon;
    const parts = clickedSampleIdentifier.split(": ");
    const datePart = parts[0];
    const samplePart = parts.length > 2 ? parts.slice(1).join(": ") : parts[1]; // Handles sample names with colons
    
    const positionInfo = selectedSampleInfo[datePart]?.position[samplePart];
    if (positionInfo) {
        clickedLat = positionInfo['Position latitude'];
        clickedLon = positionInfo['Position longitude'];
    } else {
        console.error("Could not find position info for clicked sample:", clickedSampleIdentifier);
        return; // Exit if the clicked sample data is missing
    }

    // 3. Find all samples (including the clicked one) that share the same coordinates.
    const samplesToHighlight = [];
    if (clickedLat !== undefined && clickedLon !== undefined) {
        // We check against the full database to find co-located points
        for (const ds in selectedSampleInfo) {
            for (const s in selectedSampleInfo[ds].position) {
                const testPos = selectedSampleInfo[ds].position[s];
                if (testPos['Position latitude'] === clickedLat && testPos['Position longitude'] === clickedLon) {
                    samplesToHighlight.push(ds + ': ' + s);
                }
            }
        }
    }
    
    if (samplesToHighlight.length === 0) {
        samplesToHighlight.push(clickedSampleIdentifier); // Fallback
    }
    
    // 4. Get the index of each sample-to-be-highlighted from the master sorted list.
    const indexesToToggle = [];
    samplesToHighlight.forEach(sampleId => {
        const index = masterSampleList.indexOf(sampleId);
        if (index !== -1) {
            indexesToToggle.push(index);
        }
    });

    // 5. Toggle the 'highlighted' state and update the map and charts.
    indexesToToggle.forEach(item => {
        // Toggle the highlight state for this index
        highlighted[item] = !highlighted[item];

        // Update the map layer
        if (highlightMarkers[item]) {
            if (highlighted[item]) {
                if (!map.hasLayer(highlightMarkers[item])) {
                    map.addLayer(highlightMarkers[item]);
                }
            } else {
                if (map.hasLayer(highlightMarkers[item])) {
                    map.removeLayer(highlightMarkers[item]);
                }
            }
        }
        
        // Update any relevant charts
        for (let i = 1; i < lastInstanceNo + 1; i++) {
            if (instanceType[i] === 'gorham' || instanceType[i] === 'chemical' || instanceType[i] === 'congener' ||
                instanceType[i] === 'totalHC' || instanceType[i] === 'pahratios' || instanceType[i] === 'ringfractions' ||
                instanceType[i] === 'eparatios' || instanceType[i] === 'simpleratios') {
                if (highlighted[item]) {
                    displayChartHighlight(meas, i, null, item);
                } else {
                    removeChartHighlight(meas, i, null, item);
                }
            }
        }
    });
}*/

function createHighlights(meas, clickedSampleIdentifier) {
    // 1. Create the master list of all samples and sort it to match the map markers' order.
    const masterSampleList = [];
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.forEach(date => {
        const samplesForDate = Object.keys(selectedSampleInfo[date].position);
        samplesForDate.forEach(sampleName => {
            masterSampleList.push(date + ': ' + sampleName);
        });
    });
    masterSampleList.sortComplexSamples();

    // 2. Find the coordinates of the sample that was clicked.
    let clickedLat, clickedLon, datePart, samplePart;
    const delimiterIndex = clickedSampleIdentifier.lastIndexOf(': ');

    if (delimiterIndex !== -1) {
        datePart = clickedSampleIdentifier.substring(0, delimiterIndex);
        samplePart = clickedSampleIdentifier.substring(delimiterIndex + 2);
    } else {
        datePart = clickedSampleIdentifier;
        const positionKeys = Object.keys(selectedSampleInfo[datePart]?.position || {});
        samplePart = positionKeys.length === 1 ? positionKeys[0] : "";
    }
    
    const positionInfo = selectedSampleInfo[datePart]?.position[samplePart];
    if (positionInfo) {
        clickedLat = positionInfo['Position latitude'];
        clickedLon = positionInfo['Position longitude'];
    } else {
        console.error("Could not find position info for clicked sample:", clickedSampleIdentifier);
        return;
    }

    // 3. Find all samples that share these exact coordinates.
    const samplesToHighlight = [];
    for (const ds in selectedSampleInfo) {
        for (const s in selectedSampleInfo[ds].position) {
            const testPos = selectedSampleInfo[ds].position[s];
            if (testPos['Position latitude'] === clickedLat && testPos['Position longitude'] === clickedLon) {
                samplesToHighlight.push(ds + ': ' + s);
            }
        }
    }
    
    // 4. Get the index of each sample from the master sorted list.
    const indexesToToggle = [];
    samplesToHighlight.forEach(sampleId => {
        const index = masterSampleList.indexOf(sampleId);
        if (index !== -1) {
            indexesToToggle.push(index);
        }
    });

    // 5. Toggle the 'highlighted' state and update the map and charts.
    indexesToToggle.forEach(item => {
        highlighted[item] = !highlighted[item];

        if (highlightMarkers[item]) {
            if (highlighted[item]) {
                if (!map.hasLayer(highlightMarkers[item])) map.addLayer(highlightMarkers[item]);
            } else {
                if (map.hasLayer(highlightMarkers[item])) map.removeLayer(highlightMarkers[item]);
            }
        }
        
        for (let i = 1; i < lastInstanceNo + 1; i++) {
            if (instanceType[i] === 'gorham' || /* ... other chart types ... */ instanceType[i] === 'simpleratios') {
                if (highlighted[item]) {
                    displayChartHighlight(meas, i, null, item);
                } else {
                    removeChartHighlight(meas, i, null, item);
                }
            }
        }
    });
}

// Function to display the chart based on the clicked sample
function displayChartHighlight(meas, instanceNo, dateSampled, item) {
  // Draw a rectangle around the clicked data
//console.log('about to highlight',instanceNo,item);
  chartInstance[instanceNo].options.plugins.annotation.annotations[('tempBox-' + instanceNo + '-'+item)] = {
    type: 'box',
    xScaleID: 'x',
    yScaleID: 'y',
    xMin: item - 0.5, // Adjust based on your data and preferences
    xMax: item + 0.5,
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    id: `tempBox-$(instanceNo)-$(item)`,
  };
  // Update the chart
  chartInstance[instanceNo].update();
}

function removeChartHighlight(meas, instanceNo, dateSampled, item) {
//console.log('about to remove highlight',instanceNo,item);
      delete chartInstance[instanceNo].options.plugins.annotation.annotations['tempBox-' + instanceNo + '-'+item];
  // Update the chart
  chartInstance[instanceNo].update();
}

/**
 * Performs PCA on selected measurements for a given chemical group (sheetName)
 * and plots the first two principal components using Chart.js.
 *
 * @param {object} selectMeas Data structure: selectMeas[chemicalName][sampleName] = concentration.
 * @param {string} sheetName Type of chemical data (e.g., 'PAH data').
 * @param {array} chemicalNames An array of chemical names.
 * @param {string|number} instanceNo A unique identifier for this chart instance.
 */

/*
function pcaChart(selectMeas, sheetName, chemicalNames, instanceNo) {
    console.log(`pcaChart called for sheet: ${sheetName}, instance: ${instanceNo}`);

    // --- 1. Validate Prerequisites & Inputs ---
    if (typeof Chart === 'undefined') {
        console.error("Chart.js library is not loaded.");
        alert("Error: Chart.js library is not loaded. PCA chart cannot be created.");
        return;
    }
    if (typeof PCA === 'undefined') {
        console.error("PCA library (pca-js) is not loaded.");
        alert("Error: PCA library (pca-js) is not loaded. PCA chart cannot be created.");
        return;
    }
    if (typeof createCanvas !== 'function') {
        console.error("createCanvas function is not defined.");
        alert("Error: createCanvas function is not defined. PCA chart cannot be created.");
        return;
    }
     if (!instanceType || typeof instanceType !== 'object') {
        console.error("Global 'instanceType' object is not defined or not an object.");
        // Potentially proceed but log warning, as this is for tracking
    }
    if (!instanceSheet || typeof instanceSheet !== 'object') {
        console.error("Global 'instanceSheet' object is not defined or not an object.");
        // Potentially proceed but log warning
    }

    if (!selectMeas || typeof selectMeas !== 'object' || Object.keys(selectMeas).length === 0) {
        console.error("selectMeas data is empty or not a valid object.");
        alert("Error: No measurement data provided. PCA chart cannot be created.");
        return;
    }

    // --- 2. Canvas Setup ---
    createCanvas(instanceNo); // Call your existing function to create the canvas DOM element
    const convas = document.getElementById("chart" + instanceNo);

    if (!convas) {
        console.error(`Canvas element with ID "chart${instanceNo}" not found after createCanvas call.`);
        alert(`Error: Canvas "chart${instanceNo}" not found. PCA chart cannot be created.`);
        return;
    }
    convas.style.display = "block"; // Make it visible

    // Store instance information (assuming instanceType and instanceSheet are global arrays/objects)
    if (instanceType) instanceType[instanceNo] = 'PCA';
    if (instanceSheet) instanceSheet[instanceNo] = sheetName;

    // --- 3. Data Extraction and Preparation ---
    const dataMatrix = [];
    const sampleLabels = [];

    // First, identify all unique sample names across all specified chemicals
    const allSampleNamesSet = new Set();
    for (const chemName of chemicalNames) {
        if (selectMeas[chemName]) {
            Object.keys(selectMeas[chemName]).forEach(sampleName => {
                allSampleNamesSet.add(sampleName);
            });
        }
    }
    const allSampleNames = Array.from(allSampleNamesSet);
console.log("Chemical names:", chemicalNames);
console.log("Unique sample names found:", allSampleNamesSet);
console.log("All sample names found:", allSampleNames);

    if (allSampleNames.length === 0) {
        console.error(`No samples found in selectMeas for the chemicals in "${sheetName}".`);
        alert(`Error: No samples found for chemicals in "${sheetName}". PCA chart cannot be created.`);
        return;
    }

    // Now, build the dataMatrix: rows are samples, columns are chemicals in order of `chemicalNames`
    for (const sampleName of allSampleNames) {

        const sampleConcentrations = [];
        let hasDataForSample = false;
        for (const chemName of chemicalNames) {
            let concentration = 0; // Default for missing data
            if (selectMeas[chemName] && selectMeas[chemName][sampleName] !== undefined) {
                const val = parseFloat(selectMeas[chemName][sampleName]);
                if (!isNaN(val)) {
                    concentration = val;
                    hasDataForSample = true;
                } else {
                    console.warn(`Invalid concentration for ${chemName} in ${sampleName}: ${selectMeas[chemName][sampleName]}. Using 0.`);
                }
            } else {
                // console.log(`Missing data for ${chemName} in ${sampleName}. Using 0.`);
            }
            sampleConcentrations.push(concentration);
        }
        
        // Only add sample if it had at least one valid data point (optional, but good practice)
        // Or, you might decide to include it even if all are zeros if that's meaningful
        if (hasDataForSample || chemicalNames.length > 0) { // ensure vector of correct length if no data
             dataMatrix.push(sampleConcentrations);
             sampleLabels.push(sampleName);
        } else {
            console.warn(`Sample ${sampleName} had no valid data for any specified chemicals. It will be excluded from PCA.`);
        }
    }
    
    if (dataMatrix.length === 0) {
        console.error("No valid data extracted for PCA after processing samples.");
        alert("Error: No data to process for PCA. Check your input data and chemical list.");
        return;
    }
    if (dataMatrix.length < 2) {
        console.error(`PCA requires at least two data points (samples). Found: ${dataMatrix.length}`);
        alert(`Error: PCA requires at least two samples. Only ${dataMatrix.length} found.`);
        return;
    }
    if (dataMatrix[0].length < 2) {
        console.error(`PCA requires at least two variables (chemicals). Found: ${dataMatrix[0].length}`);
        alert(`Error: PCA requires at least two chemicals. Only ${dataMatrix[0].length} found for sheet "${sheetName}".`);
        return;
    }

    console.log("Data matrix prepared for PCA:", dataMatrix.length, "samples,", dataMatrix[0].length, "chemicals.");

    // --- 4. PCA Calculation ---
    let vectors;
    let projectedData;

//srg scale the data matrix all sums to 100
console.log('dataMatrix ',dataMatrix);
    for (let i = 0; i < dataMatrix.length; i++) {
        let sum = 0;
        const sample = dataMatrix[i];
        for (let j = 0; j < sample.length; j++) {
            sum += sample[j];
        }
        if (sum > 0) {
            for (let j = 0; j < sample.length; j++) {
                sample[j] = (sample[j] / sum) * 100; // Scale to 100
            }
            dataMatrix[i] = sample; // Update the dataMatrix with scaled values
        } else {
            console.warn(`Sample ${i} has a sum of 0. Skipping scaling for this sample.`);
            // Optionally handle this case, e.g., set to NaN or leave as is
        }
    }
console.log('dataMatrix after scaling ',dataMatrix);


// ... inside pcaChart function
try {
    vectors = PCA.getEigenVectors(dataMatrix);

    // --- Rigorous checks for vectors (keep these from previous advice) ---
    if (!vectors || vectors.length < 2) {
        console.error("PCA did not return enough eigenvectors. Need at least 2.");
        alert("Error: PCA could not compute two principal components.");
        return;
    }
    // Ensure vectors[0] and vectors[1] and their .vector properties are valid arrays
    if (!vectors[0] || !vectors[0].vector || !Array.isArray(vectors[0].vector) || vectors[0].vector.length === 0) {
        console.error("First principal component vector is missing, not an array, or empty.", vectors[0]);
        alert("Error: Invalid structure for the first principal component.");
        return;
    }
    if (!vectors[1] || !vectors[1].vector || !Array.isArray(vectors[1].vector) || vectors[1].vector.length === 0) {
        console.error("Second principal component vector is missing, not an array, or empty.", vectors[1]);
        alert("Error: Invalid structure for the second principal component.");
        return;
    }
    const numFeatures = dataMatrix[0].length;
    if (vectors[0].vector.length !== numFeatures || vectors[1].vector.length !== numFeatures) {
        console.error("Eigenvector length does not match number of features.");
        alert("Error: Mismatch in eigenvector dimensions.");
        return;
    }
    // Optionally check for NaN/non-numeric in vectors here

    const pc1_vec = vectors[0].vector;
    const pc2_vec = vectors[1].vector;

    console.log("Eigenvectors pc1_vec and pc2_vec appear valid. Proceeding with MANUAL projection.");

    projectedData = [];
    for (let i = 0; i < dataMatrix.length; i++) {
        const sample = dataMatrix[i];
        if (sample.length !== numFeatures) { // Should have been caught by dataMatrix validation earlier
            console.error(`Sample ${i} length (${sample.length}) does not match feature count (${numFeatures}). Skipping.`);
            projectedData.push([NaN, NaN]); // Or handle error more strictly
            continue;
        }
        let pc1_val = 0;
        let pc2_val = 0;
        for (let j = 0; j < numFeatures; j++) {
            // Ensure sample[j] and vector elements are numbers before multiplying
            const sampleVal = typeof sample[j] === 'number' ? sample[j] : 0;
            const pc1VecVal = typeof pc1_vec[j] === 'number' ? pc1_vec[j] : 0;
            const pc2VecVal = typeof pc2_vec[j] === 'number' ? pc2_vec[j] : 0;

            pc1_val += sampleVal * pc1VecVal;
            pc2_val += sampleVal * pc2VecVal;
        }
        projectedData.push([pc1_val, pc2_val]);
    }
    console.log("Manual projection results (first few):", projectedData.slice(0, 3));

} catch (error) {
    console.error(`Error during PCA's getEigenVectors or manual projection:`, error);
    alert(`PCA processing failed: ${error.message}. Check console for details.`);
    return;
}

if (!projectedData || projectedData.length === 0) {
    console.error("Projection resulted in no data.");
    alert("Error: PCA projection failed to produce data points.");
    return;
}
// ... rest of your charting code ...


    console.log("PCA projection successful.");
console.log("Projected data:", projectedData);
    // --- 5. Chart.js Plotting ---
    const chartDataPoints = projectedData.map((point, index) => ({
        x: point[0], // Projection on PC1
        y: point[1], // Projection on PC2
        label: sampleLabels[index] // sample identifier
    }));

/* // Destroy existing chart instance if it exists on the canvas
    const existingChart = Chart.getChart(canvas); // Use the canvas object directly
    if (existingChart) {
        existingChart.destroy();
    }
*/
/* const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
 
    new Chart(convas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `Samples (${sheetName})`,
                data: chartDataPoints,
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
//          maintainAspectRatio: false, // Good for fitting in dynamic containers
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Principal Component 1'
                    },
                    grid: { display: true }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Principal Component 2'
                    },
                    grid: { display: true }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataPoint = context.raw;
                            let label = dataPoint.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `(PC1: ${dataPoint.x.toFixed(2)}, PC2: ${dataPoint.y.toFixed(2)})`;
                            return label;
                        }
                        // If you want to show original data in tooltip, you'd need to pass it
                        // or re-fetch it based on dataPoint.label
                    }
                },
                title: {
                    display: true,
                    text: `PCA of ${sheetName} Concentrations`
                },
                legend: {
                    display: true,
                    position: 'top',
                }
            }
        }
    });
    console.log(`PCA chart for ${sheetName} (Instance ${instanceNo}) rendered successfully.`);
}
*/

/**
 * Performs PCA on selected measurements for a given chemical group (sheetName)
 * and plots the first two principal components using Chart.js, with points
 * color-coded by sample set.
 *
 * @param {object} selectMeas Data structure: selectMeas[chemicalName][sampleName] = concentration.
 * @param {string} sheetName Type of chemical data (e.g., 'PAH data').
 * @param {array} chemicalNames An array of chemical names.
 * @param {string|number} instanceNo A unique identifier for this chart instance.
 */
function pcaChart(selectMeas, sheetName, chemicalNames, instanceNo) {
//console.log(`pcaChart called for sheet: ${sheetName}, instance: ${instanceNo}`);

    // --- 1. Validate Prerequisites & Inputs ---
    if (typeof Chart === 'undefined') {
        console.error("Chart.js library is not loaded.");
        alert("Error: Chart.js library is not loaded. PCA chart cannot be created.");
        return;
    }
    if (typeof PCA === 'undefined') {
        // Assuming PCA is a global object from pca-js or a similar library
        console.error("PCA library (pca-js) is not loaded.");
        alert("Error: PCA library (pca-js) is not loaded. PCA chart cannot be created.");
        return;
    }
    if (typeof createCanvas !== 'function') {
        console.error("createCanvas function is not defined.");
        alert("Error: createCanvas function is not defined. PCA chart cannot be created.");
        return;
    }
    // Assuming instanceType and instanceSheet are global objects for tracking
    if (typeof instanceType !== 'object') {
        console.warn("Global 'instanceType' object is not defined or not an object.");
    }
    if (typeof instanceSheet !== 'object') {
        console.warn("Global 'instanceSheet' object is not defined or not an object.");
    }
    if (!chemicalNames || !Array.isArray(chemicalNames) || chemicalNames.length === 0) {
        console.error("chemicalNames array is missing, not an array, or empty.");
        alert("Error: Chemical names not provided. PCA chart cannot be created.");
        return;
    }
    if (!selectMeas || typeof selectMeas !== 'object' || Object.keys(selectMeas).length === 0) {
        console.error("selectMeas data is empty or not a valid object.");
        alert("Error: No measurement data provided. PCA chart cannot be created.");
        return;
    }

    // --- 2. Canvas Setup ---
    createCanvas(instanceNo); // Call your existing function
    const convas = document.getElementById("chart" + instanceNo); // User's variable name

    if (!convas) {
        console.error(`Canvas element with ID "chart${instanceNo}" not found after createCanvas call.`);
        alert(`Error: Canvas "chart${instanceNo}" not found. PCA chart cannot be created.`);
        return;
    }
    convas.style.display = "block";

    if (instanceType) instanceType[instanceNo] = 'PCA';
    if (instanceSheet) instanceSheet[instanceNo] = sheetName;

    // --- 3. Data Extraction and Preparation ---
    const dataMatrix = [];
    const sampleLabels = []; // Will store the full sample names

    const allSampleNamesSet = new Set();
    for (const chemName of chemicalNames) {
        if (selectMeas[chemName]) {
            Object.keys(selectMeas[chemName]).forEach(sampleName => {
                allSampleNamesSet.add(sampleName);
            });
        }
    }
    const allSampleNames = Array.from(allSampleNamesSet);
//console.log("Chemical names used for PCA:", chemicalNames);
//console.log("Unique sample names found:", allSampleNames);

    if (allSampleNames.length === 0) {
        console.error(`No samples found in selectMeas for the chemicals in "${sheetName}".`);
        alert(`Error: No samples found for chemicals in "${sheetName}". PCA chart cannot be created.`);
        return;
    }

    for (const sampleName of allSampleNames) {
        const sampleConcentrations = [];
        let hasDataForSample = false;
        for (const chemName of chemicalNames) {
            let concentration = 0;
            if (selectMeas[chemName] && selectMeas[chemName][sampleName] !== undefined) {
                const val = parseFloat(selectMeas[chemName][sampleName]);
                if (!isNaN(val)) {
                    concentration = val;
                    hasDataForSample = true;
                } else {
                    console.warn(`Invalid concentration for ${chemName} in ${sampleName}: ${selectMeas[chemName][sampleName]}. Using 0.`);
                }
            }
            sampleConcentrations.push(concentration);
        }
        if (hasDataForSample || chemicalNames.length > 0) {
            dataMatrix.push(sampleConcentrations);
            sampleLabels.push(sampleName);
        } else {
            console.warn(`Sample ${sampleName} had no valid data for any specified chemicals. It will be excluded from PCA.`);
        }
    }
    
    if (dataMatrix.length === 0) {
        console.error("No valid data extracted for PCA.");
        alert("Error: No data to process for PCA.");
        return;
    }
    if (dataMatrix.length < 2) {
        console.error(`PCA requires at least two samples. Found: ${dataMatrix.length}`);
        alert(`Error: PCA requires at least two samples. Only ${dataMatrix.length} found.`);
        return;
    }
    if (dataMatrix[0].length < 2) {
        console.error(`PCA requires at least two chemicals. Found: ${dataMatrix[0].length}`);
        alert(`Error: PCA requires at least two chemicals. Only ${dataMatrix[0].length} found.`);
        return;
    }
    console.log("Data matrix prepared for PCA:", dataMatrix.length, "samples,", dataMatrix[0].length, "chemicals.");

    // --- 4. Data Scaling & PCA Calculation ---
    // User's scaling: make each sample's chemical profile sum to 100
//console.log('Original dataMatrix (first sample):', dataMatrix.length > 0 ? JSON.stringify(dataMatrix[0]) : 'empty');
    if (subsToDisplay['pcanormalise']) {
        for (let i = 0; i < dataMatrix.length; i++) {
            let sum = 0;
            const sample = dataMatrix[i];
            for (let j = 0; j < sample.length; j++) {
                sum += sample[j];
            }
            if (sum > 0) {
                for (let j = 0; j < sample.length; j++) {
                    sample[j] = (sample[j] / sum) * 100;
                }
                // dataMatrix[i] = sample; // sample is already a reference to dataMatrix[i]
            } else {
                console.warn(`Sample ${sampleLabels[i]} has a sum of 0. Skipping scaling for this sample.`);
            }
        }
    }
//console.log('DataMatrix after scaling (first sample):', dataMatrix.length > 0 ? JSON.stringify(dataMatrix[0]) : 'empty');

    let vectors;
    let projectedData;
    try {
        vectors = PCA.getEigenVectors(dataMatrix);
        if (!vectors || vectors.length < 2) {
            console.error("PCA did not return enough eigenvectors.");
            alert("Error: PCA could not compute two principal components.");
            return;
        }
        if (!vectors[0] || !vectors[0].vector || !Array.isArray(vectors[0].vector) || vectors[0].vector.length === 0 ||
            !vectors[1] || !vectors[1].vector || !Array.isArray(vectors[1].vector) || vectors[1].vector.length === 0) {
            console.error("Principal component vector structure is invalid.", vectors);
            alert("Error: Invalid structure for principal components.");
            return;
        }
        const numFeatures = dataMatrix[0].length;
        if (vectors[0].vector.length !== numFeatures || vectors[1].vector.length !== numFeatures) {
            console.error("Eigenvector length does not match number of features.");
            alert("Error: Mismatch in eigenvector dimensions.");
            return;
        }

        const pc1_vec = vectors[0].vector;
        const pc2_vec = vectors[1].vector;
        console.log("Eigenvectors pc1_vec and pc2_vec appear valid. Proceeding with MANUAL projection.");

        projectedData = [];
        for (let i = 0; i < dataMatrix.length; i++) {
            const sample = dataMatrix[i];
            let pc1_val = 0;
            let pc2_val = 0;
            for (let j = 0; j < numFeatures; j++) {
                const sampleVal = typeof sample[j] === 'number' && isFinite(sample[j]) ? sample[j] : 0;
                const pc1VecVal = typeof pc1_vec[j] === 'number' && isFinite(pc1_vec[j]) ? pc1_vec[j] : 0;
                const pc2VecVal = typeof pc2_vec[j] === 'number' && isFinite(pc2_vec[j]) ? pc2_vec[j] : 0;
                pc1_val += sampleVal * pc1VecVal;
                pc2_val += sampleVal * pc2VecVal;
            }
            projectedData.push([pc1_val, pc2_val]);
        }
        console.log("Manual projection results (first few):", projectedData.slice(0, 3));

    } catch (error) {
        console.error(`Error during PCA's getEigenVectors or manual projection:`, error);
        alert(`PCA processing failed: ${error.message}. Check console for details.`);
        return;
    }

    if (!projectedData || projectedData.length !== sampleLabels.length) {
        console.error("Projection resulted in no data or mismatched length.");
        alert("Error: PCA projection failed to produce valid data points for all samples.");
        return;
    }
    console.log("PCA projection successful. Number of projected points:", projectedData.length);

    // --- 5. Prepare Data for Chart.js with Color Coding by Set ---
    const setColors = {}; 
//  const onePattern = pattern.draw('square', 'rgba(255, 99, 132, 0.7)');
    const colorPalette = [
        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)',
        'rgba(255, 206, 86, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(40, 159, 64, 0.7)',
        'rgba(210, 99, 132, 0.7)', 'rgba(128, 0, 0, 0.7)', 'rgba(0, 128, 0, 0.7)',
        'rgba(0, 0, 128, 0.7)', 'rgba(128, 128, 0, 0.7)', 'rgba(128, 0, 128, 0.7)'
    ];
    let nextColorIndex = 0;
    const datasetsBySet = {};

    projectedData.forEach((point, index) => {
        const fullSampleName = sampleLabels[index];
        const parts = fullSampleName.split(':');
        const setName = parts.length > 1 ? parts[0].trim() : "Unknown Set";

        if (!setColors[setName]) {
            setColors[setName] = colorPalette[nextColorIndex % colorPalette.length];
            nextColorIndex++;
        }
        const pointColor = setColors[setName];
        // Create a slightly more opaque version for the border
//      const borderColor = pointColor.replace(/rgba\((\d+,\s*\d+,\s*\d+),\s*[\d\.]+\)/, `rgba($1, 1)`);
          const borderColor = pointColor;
//console.log(`Point color for set "${setName}":`, pointColor, "Border color:", borderColor);

        if (!datasetsBySet[setName]) {
            datasetsBySet[setName] = {
//              label: setName, // This will be shown in the legend
                label: selectedSampleInfo[setName].label, // This will be shown in the legend
                data: [],
                backgroundColor: pointColor,
                borderColor: borderColor,
                pointRadius: 6,
                pointHoverRadius: 8,
                borderWidth: 1 // Optional: explicitly set border width
            };
        }
        
        // Ensure point data is valid before pushing
        if (isFinite(point[0]) && isFinite(point[1])) {
            datasetsBySet[setName].data.push({
                x: point[0],
                y: point[1],
                label: fullSampleName // Store full name for tooltip
            });
        } else {
            console.warn(`Skipping invalid data point for ${fullSampleName}: PC1=${point[0]}, PC2=${point[1]}`);
        }
    });
//console.log("Datasets by set prepared for chart:", datasetsBySet);
    const finalChartDatasets = Object.values(datasetsBySet);
//console.log("Final datasets for chart:", finalChartDatasets);

    // Destroy existing chart instance if it exists on the canvas
    // This is important if the function can be called multiple times for the same canvas
    const existingChart = Chart.getChart(convas);
    if (existingChart) {
        existingChart.destroy();
    }
 
    new Chart(convas, {
        type: 'scatter',
        data: {
            datasets: finalChartDatasets
        },
        options: {
            responsive: true,
            // maintainAspectRatio: false, // User had this commented out, respecting that
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Principal Component 1'
                    },
                    grid: { display: true }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Principal Component 2'
                    },
                    grid: { display: true }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            // Show the set name (dataset label) as the tooltip title
                            if (tooltipItems.length > 0) {
//                              return tooltipItems[0].dataset.label;
                                return tooltipItems[0].dataset.label;
                            }
                            return '';
                        },
                        label: function(context) {
                            const dataPoint = context.raw; // This contains {x, y, label: fullSampleName}
                            let pointLabel = dataPoint.label || ''; // Full sample name
                            if (pointLabel) {
                                pointLabel = pointLabel.split(':').pop().trim(); // Show only part after colon
                                pointLabel += ': ';
                            }
                            pointLabel += `(PC1: ${dataPoint.x.toFixed(2)}, PC2: ${dataPoint.y.toFixed(2)})`;
                            return pointLabel;
                        }
                    }
                },
                title: {
                    display: true,
                    text: `PCA of ${sheetName} Concentrations`
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true, // Makes legend markers match point style
                    }
                }
            }
        }
    });
    console.log(`PCA chart for ${sheetName} (Instance ${instanceNo}) rendered successfully with color coding.`);
}
