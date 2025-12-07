/**
 * Enables or disables sorting options based on available data.
 */

chartNameSep = '   '// Three spaces to separate dataset name from sample name for point labels

// Mapping of sorting options to required data sheets

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
    const useTabs = document.getElementById('useTabs').checked;
    const mainChartContainer = document.getElementById('chartContainer');
    if (useTabs) {
        let tabButtonsContainer = document.getElementById('chart-tab-buttons');
        if (tabButtonsContainer) {
            // Clear existing tab buttons to avoid duplicates
            tabButtonsContainer.innerHTML = '';
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
    allMapData.isReady = false; // Force regeneration of map layers
    createGlobalLayers();
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
//console.log(sortedSamples, sums, sheetName, instanceNo, unitTitle, subTitle);
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

//    const allSamples = sortedSamples; // Use the sorted samples from the retData
    const allSamples = Object.keys(sums); // Use the sums from the retData
//console.log('allSamples',allSamples);
    const allParticles = Object.keys(sums[allSamples[0]]); // Assuming all samples have the particles
//console.log('allParticles',allParticles);
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
    if (instanceNo === 0) {
        document.getElementById('chartContainer').innerHTML = '';
    }

    const useTabs = document.getElementById('useTabs').checked;
    const mainChartContainer = document.getElementById('chartContainer');
    let targetContainer;

    if (useTabs) {
        let tabButtonsContainer = document.getElementById('chart-tab-buttons');
        if (!tabButtonsContainer) {
            tabButtonsContainer = document.createElement('div');
            tabButtonsContainer.id = 'chart-tab-buttons';
            tabButtonsContainer.className = 'tab-buttons';
            mainChartContainer.appendChild(tabButtonsContainer);
        }

        const sanitizedSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '-');
        const tabContentId = 'tab-' + sanitizedSheetName;
        
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = sheetName;
        tabButton.onclick = (event) => openTab(event, tabContentId);
        tabButtonsContainer.appendChild(tabButton);

        const tabContentPanel = document.createElement('div');
        tabContentPanel.id = tabContentId;
        tabContentPanel.className = 'tab-content';
        mainChartContainer.appendChild(tabContentPanel);
        
        if (tabButtonsContainer.children.length === 1) {
            tabButton.classList.add('active');
            tabContentPanel.classList.add('active');
        }
        
        targetContainer = tabContentPanel;

    } else {
        targetContainer = document.createElement('div');
        targetContainer.className = 'chart-sheet-container';
        targetContainer.innerHTML = `<h2 style="padding-top: 2rem; border-bottom: 1px solid #ccc;">${sheetName}</h2>`;
        mainChartContainer.appendChild(targetContainer);
    }
    
    const originalChartContainerId = 'chartContainer';
    mainChartContainer.id = 'chartContainer-placeholder';
    targetContainer.id = originalChartContainerId;

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
        if (subsToDisplay['cumulative']) {
            instanceNo += 1;
            displayPSDChart(sizes, cumWeights, sheetName, instanceNo, unitTitle, 'Cumlative by Weight');
            instanceNo += 1;
            displayPSDChart(sizes, cumAreas, sheetName, instanceNo, unitTitle, 'Cumulative by Area');
        }
        if (subsToDisplay['splitbyweight']) {
            instanceNo += 1;
            displayPsdSplits(sortedSamples, splitWeights, sheetName, instanceNo, unitTitle, 'Weight');
        }
        if (subsToDisplay['splitbyarea']) {
            instanceNo += 1;
            displayPsdSplits(sortedSamples, splitRelativeAreas, sheetName, instanceNo, unitTitle, 'Relative Area');
            instanceNo += 1;
            displayPsdSplits(sortedSamples, splitAreas, sheetName, instanceNo, unitTitle, 'Absolute Area');
        }
        if (subsToDisplay['totalsolidsandtotalcarbon']) {
            instanceNo += 1;
            displayTotalSolidOrganicC(sortedSamples, sheetName, instanceNo, unitTitle, 'Total Solids % and Organic Carbon %');
        }
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
    if (subsToDisplay['mapgrid']) {
        //{if (subsToDisplay['positionplace']) {
        const allContaminants = Object.keys(selectedMeas);
        if (allContaminants.length > 0) {
            // 1. Create a large container for the main map
            const largeMapContainer = document.createElement('div');
    //        const largeContaminantMapId = 'large-contaminant-map';
            const largeContaminantMapId = `largemap-${sheetName.replace(/[^a-zA-Z0-9]/g, '')}`;
            largeMapContainer.id = largeContaminantMapId;
            largeMapContainer.style.width = '100%';
            largeMapContainer.style.height = '600px';
            largeMapContainer.style.border = '2px solid #ccc';
            targetContainer.appendChild(largeMapContainer);
            
            // 2. Create the grid container for small maps
            const gridContainer = document.createElement('div');
            gridContainer.id = 'small-contaminant-map-grid';
            gridContainer.style.display = 'grid';
            gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
            gridContainer.style.gap = '1rem';
            gridContainer.style.marginTop = '2rem';
            gridContainer.innerHTML = '<h3 style="grid-column: 1 / -1;">' + sheetName + '</h3>';
            targetContainer.appendChild(gridContainer);
            
            const firstContaminant = allContaminants[0];

            // Create the large map - try ResizeObserver first, then fallback
            createStaticContaminantMap(largeContaminantMapId, firstContaminant, 'points', true);
            
            // Fallback: if large map doesn't appear after 2 seconds, force create it
            setTimeout(() => {
                const container = document.getElementById(largeContaminantMapId);
                if (container && !container._leaflet_map) {
                    console.log('Large map not created by ResizeObserver, forcing creation...');
                    // Force create without size checking
                    const staticMap = L.map(largeContaminantMapId, {
                        center: [54.596, -1.177],
                        zoom: 13,
                        zoomControl: false,
                        attributionControl: false,
                        scrollWheelZoom: false,
                        doubleClickZoom: false,
                        boxZoom: false,
                        keyboard: false,
                        dragging: false,
                    });
                    container._leaflet_map = staticMap;

                    const baseLayerInstance = baseLayers['OpenStreetMap'];
                    L.tileLayer(baseLayerInstance._url, baseLayerInstance.options).addTo(staticMap);

                    const layerToAdd = contaminantLayers[firstContaminant];
                    if (layerToAdd) {
                        layerToAdd.addTo(staticMap);
                        const bounds = new L.LatLngBounds([]);
                        layerToAdd.eachLayer(layer => {
                            if (layer.getLatLng) {
                                bounds.extend(layer.getLatLng());
                            }
                        });
                        if (bounds.isValid()) {
                            setTimeout(() => {
                                staticMap.invalidateSize();
                                staticMap.fitBounds(bounds, { padding: [20, 20] });
                            }, 100);
                        }
                    }
                }
            }, 2000);

            // Generate small maps for all contaminants
            allContaminants.forEach((contaminantName, index) => {
                const mapWrapper = document.createElement('div');
                const mapId = `map-${contaminantName.replace(/[^a-zA-Z0-9]/g, '')}`;
    //            const mapId = `smallmap-${index}`;
                mapWrapper.className = 'small-map-wrapper';
                mapWrapper.style.border = '1px solid #ddd';
                mapWrapper.style.padding = '5px';
                mapWrapper.style.textAlign = 'center';
                mapWrapper.style.height = '280px';
                mapWrapper.style.minWidth = '250px';

                // Add Flexbox properties to arrange children vertically
                mapWrapper.style.display = 'flex';
                mapWrapper.style.flexDirection = 'column';
        
                const stats = contaminantStats[contaminantName];
                const min = stats ? (stats.valueMin*stats.rescale).toFixed(2) : 'N/A';
                const max = stats ? (stats.valueMax*stats.rescale).toFixed(2) : 'N/A';
                const unit = stats ? stats.unit : '';
                
                const titleElement = document.createElement('h4');
                titleElement.style.margin = '0';
                titleElement.style.padding = '5px';
                titleElement.style.backgroundColor = '#f0f0f0';
                titleElement.style.cursor = 'pointer';
                titleElement.style.fontSize = '14px';
                titleElement.innerHTML = `${contaminantName}<br>(${min} - ${max} ${unit})`;
                mapWrapper.appendChild(titleElement);
                
                const mapElement = document.createElement('div');
                mapElement.id = mapId;
                mapElement.style.width = '100%';
                mapElement.style.flexGrow = '1';
    //            mapElement.style.height = 'calc(100% - 50px)';
                mapElement.style.minHeight = '200px';
                mapWrapper.appendChild(mapElement);
                gridContainer.appendChild(mapWrapper);
                
                // Create small maps with staggered delays
                setTimeout(() => {
                    createStaticContaminantMap(mapId, contaminantName, 'points');
                }, 300 + (index * 50));

                titleElement.addEventListener('click', () => {
                    // Should be removed inside createStaticContaminantMap
    //                const existingLargeMap = document.getElementById(largeContaminantMapId)._leaflet_map;
    //                if (existingLargeMap) existingLargeMap.remove();

                    setTimeout(() => {
                        createStaticContaminantMap(largeContaminantMapId, contaminantName, 'points', true);
                    }, 100);
                    
                    targetContainer.scrollTop = 0;
                });
            });
        } else {
            console.warn(sheetName, ': No contaminant layers available for mapping.');
        }
    }
    if (subsToDisplay['correlationplots']) {
        if (subsToDisplay['relationareadensity']) {
            instanceNo = displayScatterCharts(sheetName, { key: 'totalArea', sheetKey: 'Physical Data' }, 'relationareadensity', 'Total Area', 'Concentration', targetContainer, instanceNo);
        }
        if (subsToDisplay['relationhc']) {
            instanceNo = displayScatterCharts(sheetName, { key: 'totalHC', sheetKey: 'PAH data' }, 'relationhc', 'Total Hydrocarbon', 'Concentration', targetContainer, instanceNo);
        }
        if (subsToDisplay['relationtotalsolids']) {
            instanceNo = displayScatterCharts(sheetName, { key: 'totalSolids', sheetKey: 'Physical Data' }, 'relationtotalsolids', 'Total Solids %', 'Concentration', targetContainer, instanceNo);
        }
        if (subsToDisplay['relationorganiccarbon']) {
            instanceNo = displayScatterCharts(sheetName, { key: 'organicCarbon', sheetKey: 'Physical Data' }, 'relationorganiccarbon', 'Organic Carbon %', 'Concentration', targetContainer, instanceNo);
        }
    }
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
//console.log(scatterData[c], chemicalData[c], sampleNames);
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
//    instanceType[instanceNo] = 'combinedscatter';
    instanceType[instanceNo] = 'scatter';
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


function displayScatterChart(scatterData, oneChemical, sampleNames, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo) {
console.log('displayScatterChart', scatterData, oneChemical, sampleNames, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    lastScatterInstanceNo = instanceNo;
    legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
//    instanceType[instanceNo] = 'Scatter ' + unitTitle;
    instanceType[instanceNo] = 'scatter ' + unitTitle;
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

                selectSample: {
                    highlightedSample: null, // This will be updated by your code
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
/*                            if (pointLabel) {
                                pointLabel = pointLabel.split(':').pop().trim(); // Show only part after colon
                                pointLabel += ': ';
                            }*/
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
    const chart = new Chart(ctx, chartConfig);
    chartInstance[instanceNo] = chart;
//console.log(chartConfig);

//  createToggleCanvasSize(convas, chartInstance[instanceNo], instanceNo, unitTitle);
//console.log(largeInstanceNo,oneChemical);
/* if (largeInstanceNo > 1) {
        createToggleFocusChart(convas, chartInstance[instanceNo], instanceNo, oneChemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    }*/

    const canvas = document.getElementById('chart' + instanceNo)
    if (largeInstanceNo > 1) { 
        canvas.addEventListener('click', (e) => {
            const existingAnnoations = chartInstance[instanceNo].options.plugins.annotation.annotations;
//console.log(existingAnnoations);
            displayScatterChart(scatterData, oneChemical, sampleNames, sheetName, largeInstanceNo, unitTitle, xAxisTitle, yAxisTitle, -1);
            chartInstance[largeInstanceNo].options.plugins.annotation.annotations =  existingAnnoations;
            chartInstance[largeInstanceNo].update();
        });
    } else {
        // Add a click listener to the canvas element
        canvas.addEventListener('click', (e) => {
            const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
console.log(points);            
            if (points.length > 0) {
                const firstPoint = points[0];
                const pointLabel = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index].label;
console.log('firstPoint', firstPoint, pointLabel);
                let parts = pointLabel.split(": ");
                if (parts.length>2) parts[1] = parts[1] + ': ' + parts[2];
                const pointDateSampled = parts[0].trim();
                const pointSampleID = parts[1].trim();
console.log('pointDateSampled', pointDateSampled, 'pointSampleID', pointSampleID);
                const dateSampled = getKeyFromLabel(selectedSampleInfo, pointDateSampled);
                const sampleID = getKeyFromLabel(selectedSampleInfo[dateSampled].position, pointSampleID);
                const clickedSampleIdentifier = dateSampled + ': ' + sampleID;
console.log('clickedSampleIdentifier', clickedSampleIdentifier);
                // Get the sample identifier from the clicked point
//                const dataPoint = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
//                const clickedSampleIdentifier = dataPoint.label;
                
                // Call the central highlighting function
                createHighlights(clickedSampleIdentifier);
//                createHighlights(sampleNames[firstPoint.index]);
            }
        });
    }
}

function getKeyFromLabel(bitInfo, labelToFind) {
  for (const key in bitInfo) {
    if (bitInfo[key].label.trim() === labelToFind) {
      return key;
    }
  }
  return null; // Return null if no matching label is found.
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

function displayAnySampleChart(meas, fullSampleNames, datasets, instanceNo, title, yTitle, showLegend) {
    let readableLabels = [];
    for (i = 0; i < fullSampleNames.length; i++) {
        let parts = fullSampleNames[i].split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
//console.log(parts[0],parts[1]);
        readableLabels[i] = selectedSampleInfo[parts[0]].label + ': ' + selectedSampleInfo[parts[0]].position[parts[1]].label;
    }
//console.log(readableLabels,datasets);
    displayAnyChart(meas, fullSampleNames, readableLabels, datasets, instanceNo, title, yTitle, showLegend);
}

function displayAnyChart(meas, fullSampleNames, all, datasets, instanceNo, title, yTitle, showLegend) {
//console.log(meas, fullSampleNames, all, datasets, instanceNo, title, yTitle, showLegend);
//if (title === "Trace metal data") console.log(measss);
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

    // Check if a chart instance already exists on this canvas and destroy it first.
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }


    chartInstance[instanceNo] = new Chart(ctx, stanGraph);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);
    createExportButton(chartInstance[instanceNo], instanceNo);
//    let allChemicals = Object.keys(meas);
//    let allSamples = Object.keys(meas[allChemicals[0]]); // Assuming all samples have the same chemicals
    function clickableScales(fullSampleNames, chart, canvas, click) {
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
                        console.log(all[i]);
                        console.log("Date sampled: ", dateSampled);
                        console.log("Sample:", sample);
                        console.log("Full Sample Name:", fullSampleNames[i]);
                        // Corrected call with only two arguments
//                        let fullSampleName = dateSampled + ': ' + sample;
                        createHighlights(fullSampleNames[i]);
//250808                      createHighlights(meas, dateSampled, all[i], null);
                    } else {
                        console.log("String format doesn't match the expected pattern.");
                    };
                }
            }
        }
    }
        // Create a single click event listener on the canvas.
    ctx.addEventListener('click', (e) => {
        const chart = chartInstance[instanceNo];
        const rect = ctx.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Get the coordinates of the x-axis scale.
        const xScale = chart.scales.x;

        // Check if the click occurred within the bounds of the x-axis labels.
        // This is the key part that was missing from my previous code.
        if (y > xScale.top && y < xScale.bottom) {
            // If the click is on the x-axis, call your custom function.
            clickableScales(fullSampleNames, chart, ctx, e);
        } else {
            // If the click is on a chart bar itself, handle it here.
            // This is good practice for a more general solution.
            const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
            if (points.length > 0) {
                const firstPoint = points[0];
                const sampleIndex = firstPoint.index;
//                const clickedSampleIdentifier = allSamples[sampleIndex];
                createHighlights(fullSampleNames[sampleIndex]);
            }
        }
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
    displayAnyChart(meas, allChemicals, names4Chemicals,datasets,instanceNo,sheetName,unitTitle,false);
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
    let samplesWithData = [];
    allSamples.forEach((sampleName, i) => {
        const parts = sampleName.split(": ");
        if (parts.length >2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        if (selectedSampleMeasurements[parts[0]]?.['Physical Data']) {
            samplesWithData.push(allSamples[i]);
            totalSolids.push(selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]]['Total solids (% total sediment)']);
            organicC.push(selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]]['Organic matter (total organic carbon)']);
        }
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
    displayAnySampleChart(totalSolids, samplesWithData, datasets, instanceNo, sheetName + ': Total Solids % and Organic Carbon %', 'Total solids (% total sediment)', true);
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

//    console.log(datasets);

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
console.log('findSamplesInSameLocation',clickedFullSample);
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

function toggleScatterHighlight(instanceNo, fullSampleIdentifier) {
    const chart = chartInstance[instanceNo];
    if (!chart) return;

    // Get the current highlighted sample from the plugin options.
    const currentHighlight = chart.options.plugins.selectSample.highlightedSample;

    // Toggle the state: if the same sample is clicked again, un-highlight it.
    if (currentHighlight === fullSampleIdentifier) {
        chart.options.plugins.selectSample.highlightedSample = null;
    } else {
        chart.options.plugins.selectSample.highlightedSample = fullSampleIdentifier;
    }

    chart.update();
}
// Use a simple object to track the highlighted state by full sample name.
let highlightedState = {}; 

function createHighlights(fullSampleIdentifier) {
console.log('createHighlights', fullSampleIdentifier);
    const samplesToHighlight = findSamplesInSameLocation(fullSampleIdentifier);

    samplesToHighlight.forEach(sampleId => {
        // Toggle the highlight state.
        highlightedState[sampleId] = !highlightedState[sampleId];

        const isHighlighted = highlightedState[sampleId];
        const parts = sampleId.split(": ");
        const datePart = parts[0];
        const samplePart = parts.length > 2 ? parts.slice(1).join(": ") : parts[1]; // Handles sample names with colons
        
        // --- Update the Map Markers ---
        const mapMarker = markers[datePart][sampleId];
console.log('Toggling highlight for sample:', sampleId, isHighlighted, mapMarker);
        if (mapMarker) {
console.log('Found map marker for sample:', sampleId);
            // Apply the highlight style or reset to the original style.
            if (isHighlighted) {
console.log('Applying highlight style for sample:', sampleId);
                mapMarker.setStyle(highlightStyle);
            } else {
console.log('Resetting to original style for sample:', sampleId);
                mapMarker.setStyle(mapMarker.options.originalStyle);
            }
        }
        
        // --- Update the Charts ---
        for (let i = 1; i < lastInstanceNo + 1; i++) {
console.log('Checking chart instance', i, instanceType[i]);
//            if (['gorham', 'chemical', 'congener', 'totalHC', 'pahratios', 'ringfractions', 'eparatios', 'simpleratios', 'scatter'].includes(instanceType[i])) {
            const validTypes = ['gorham', 'chemical', 'congener', 'totalHC', 'pahratios', 'ringfractions', 'eparatios', 'simpleratios', 'scatter', 'PCA'];
            const chartType = instanceType[i];
            if (validTypes.some(type => chartType.includes(type))) {
                if (isHighlighted) {
                    displayChartHighlight(i, sampleId);
                } else {
                    removeChartHighlight(i, sampleId);
                }
            }
        }
    });
}

function displayChartHighlight(instanceNo, fullSampleIdentifier) {
    console.log('displayChartHighlight', instanceNo, instanceType[instanceNo], fullSampleIdentifier);
    
    // Turn the fullSampleIdentifier into the correct label for this chart instance
    let parts = fullSampleIdentifier.split(": ");
    if (parts.length > 2) {
        parts[1] = parts[1] + ': ' + parts[2];
    }
    console.log(parts[0], parts[1]);
    
    let chartLabel = selectedSampleInfo[parts[0]].label + ': ' + selectedSampleInfo[parts[0]].position[parts[1]].label;
    
    if (instanceType[instanceNo].includes('scatter') || instanceType[instanceNo].includes('PCA')) {
        // For scatter plots, we need to find the data point by matching the label
        const datasets = chartInstance[instanceNo].data.datasets;
console.log('chartInstance[instanceNo].data', chartInstance[instanceNo].data, 'datasets', datasets, 'chartLabel', chartLabel);          
        let foundDataPoint = null;
        let datasetIndex = -1;
        let pointIndex = -1;
        
console.log('Searching for data point matching label:', datasets.length, 'datasets');
        // Search through all datasets and their data points
        for (let i = 0; i < datasets.length; i++) {
            const dataset = datasets[i];
console.log('Checking dataset', i, dataset, dataset.data.length);
            for (let j = 0; j < dataset.data.length; j++) {
                const dataPoint = dataset.data[j];
                // Check if this data point matches our sample
console.log('Checking data point', j, dataPoint.label);
                if (dataPoint.label === chartLabel) {
                    foundDataPoint = dataPoint;
                    datasetIndex = i;
                    pointIndex = j;
                    break;
                }
            }
            if (foundDataPoint) break;
        }
        
        if (foundDataPoint) {
            // Create a highlight annotation around the found data point
//            const annotationId = `tempBox-${instanceNo}-${datasetIndex}-${pointIndex}`;
            const annotationId = `tempBox-${fullSampleIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
            chartInstance[instanceNo].options.plugins.annotation.annotations[annotationId] = {
                type: 'point',
                xValue: foundDataPoint.x,
                yValue: foundDataPoint.y,
//                backgroundColor: 'rgba(255, 0, 0, 0.3)',
                backgroundColor: 'rgba(224, 77, 77, 0.07)',
                borderColor: 'red',
                borderWidth: 3,
                radius: 12, // Make it larger than the original point
                id: annotationId,
            };
            console.log(`Added ${instanceType[instanceNo]} highlight for ${fullSampleIdentifier} at (${foundDataPoint.x}, ${foundDataPoint.y})`);
        } else {
            console.warn(`Could not find ${instanceType[instanceNo]} data point for sample: ${fullSampleIdentifier}`);
        }
    } else {
        // Original logic for bar charts
        const allChartSamples = chartInstance[instanceNo].data.labels;
        const itemIndex = allChartSamples.indexOf(chartLabel);
        if (itemIndex > -1) {
            const annotationId = `tempBox-${fullSampleIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
//            chartInstance[instanceNo].options.plugins.annotation.annotations[(`tempBox-${instanceNo}-${itemIndex}`)] = {
            chartInstance[instanceNo].options.plugins.annotation.annotations[annotationId] = {
                type: 'box',
                xScaleID: 'x',
                yScaleID: 'y',
                xMin: itemIndex - 0.5,
                xMax: itemIndex + 0.5,
                borderWidth: 2,
                borderColor: 'red',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                id: annotationId,
//                id: `tempBox-${instanceNo}-${itemIndex}`,
            };
        }
    }
    // Update the chart to show the new highlight
    chartInstance[instanceNo].update();
}

function removeChartHighlight(instanceNo, fullSampleIdentifier) {
    console.log('removeChartHighlight', instanceNo, fullSampleIdentifier);
    const annotationId = `tempBox-${fullSampleIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
    delete chartInstance[instanceNo].options.plugins.annotation.annotations[annotationId];
    chartInstance[instanceNo].update();
    console.log(`Removed ${instanceType[instanceNo]} scatter highlight annotations for ${fullSampleIdentifier}`);

/*    
//    if (instanceType[instanceNo].includes('scatter') || instanceType[instanceNo].includes('PCA')) {
        // For scatter plots, we need to find and remove all annotations that match this sample
//        const annotations = chartInstance[instanceNo].options.plugins.annotation.annotations;
        const annotationId = `tempBox-${fullSampleIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
        delete chartInstance[instanceNo].options.plugins.annotation.annotations[annotationId];
//        const annotationsToRemove = [];
        
        // Find all annotations that belong to this sample
//        for (const annotationId in annotations) {
//            if (annotationId.startsWith(`tempBox-${instanceNo}-`)) {
/*            if (annotationId.startsWith(`tempBox-${fullSampleIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`)) {
                // We need to check if this annotation corresponds to our sample
                // Since we don't store the sample ID in the annotation, we'll remove all temp annotations
                // and let the highlighting system re-add the ones that should still be there
                annotationsToRemove.push(annotationId);
            }
        }
        
        // Remove the annotations
        annotationsToRemove.forEach(id => {
            delete annotations[id];
        });
        
//        console.log(`Removed ${annotationsToRemove.length} scatter highlight annotations for ${fullSampleIdentifier}`);
        console.log(`Removed ${instanceType[instanceNo]} scatter highlight annotations for ${fullSampleIdentifier}`);
    } else {
        // Original logic for bar charts
        let parts = fullSampleIdentifier.split(": ");
        if (parts.length > 2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        let chartLabel = selectedSampleInfo[parts[0]].label + ': ' + selectedSampleInfo[parts[0]].position[parts[1]].label;
        
        const allChartSamples = chartInstance[instanceNo].data.labels;
        const itemIndex = allChartSamples.indexOf(chartLabel);
        const annotationId = `tempBox-${fullSampleIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
        if (itemIndex > -1) {
//            delete chartInstance[instanceNo].options.plugins.annotation.annotations[`tempBox-${instanceNo}-${itemIndex}`];
            delete chartInstance[instanceNo].options.plugins.annotation.annotations[annotationId];
        }
    }
    
    // Update the chart to remove the highlight
    chartInstance[instanceNo].update();*/
}

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
        let parts = fullSampleName.split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        const setName = parts.length > 1 ? parts[0].trim() : "Unknown Set";
        const sampleName = parts[1];
//        console.log(`Sample "${fullSampleName}" parsed as set "${setName}", sample "${sampleName}".`);
//        console.log('selectedSampleInfo', selectedSampleInfo[setName].label);
//        console.log('selectedSampleInfo position', selectedSampleInfo[setName].position[sampleName].label);
        const labelSampleName = selectedSampleInfo[setName].label + ': ' + selectedSampleInfo[setName].position[sampleName].label;
//        const sampleName = parts.length > 2 ? parts.slice(1).join(':').trim() : fullSampleName.trim();

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
//                label: fullSampleName // Store full name for tooltip
                label: labelSampleName // Store label sample name for tooltip
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
/*    const existingChart = Chart.getChart(convas);
    if (existingChart) {
        existingChart.destroy();
    }*/
 
    let chartConfig = {
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
                annotation: {
                    annotations: {}
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
/*                            if (pointLabel) {
                                pointLabel = pointLabel.split(':').pop().trim(); // Show only part after colon
                                pointLabel += ': ';
                            }*/
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
                },
                selectSample: {
                    highlightedSample: null
                }
            }
        }
    };
/*
        convas.addEventListener('click', (e) => {
        const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (points.length > 0) {
            const firstPoint = points[0];
            const dataPoint = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
            const clickedSampleIdentifier = dataPoint.label;

            createHighlights(clickedSampleIdentifier);
        }
    });*/

    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
    if (chartInstance[instanceNo]) {
        chartInstance[instanceNo].destroy();
    }
    const chart = new Chart(ctx, chartConfig);
    chartInstance[instanceNo] = chart;
//console.log(chartConfig);

//  createToggleCanvasSize(convas, chartInstance[instanceNo], instanceNo, unitTitle);
//console.log(largeInstanceNo,oneChemical);
/* if (largeInstanceNo > 1) {
        createToggleFocusChart(convas, chartInstance[instanceNo], instanceNo, oneChemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    }*/

    const canvas = document.getElementById('chart' + instanceNo)
        // Add a click listener to the canvas element
        canvas.addEventListener('click', (e) => {
            const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
console.log(points);            
            if (points.length > 0) {
                const firstPoint = points[0];
                const pointLabel = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index].label;
console.log('firstPoint', firstPoint, pointLabel);
                let parts = pointLabel.split(": ");
                if (parts.length>2) parts[1] = parts[1] + ': ' + parts[2];
                const pointDateSampled = parts[0].trim();
                const pointSampleID = parts[1].trim();
console.log('pointDateSampled', pointDateSampled, 'pointSampleID', pointSampleID);
                const dateSampled = getKeyFromLabel(selectedSampleInfo, pointDateSampled);
                const sampleID = getKeyFromLabel(selectedSampleInfo[dateSampled].position, pointSampleID);
                const clickedSampleIdentifier = dateSampled + ': ' + sampleID;
console.log('clickedSampleIdentifier', clickedSampleIdentifier);
                // Get the sample identifier from the clicked point
//                const dataPoint = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
//                const clickedSampleIdentifier = dataPoint.label;
                
                // Call the central highlighting function
                createHighlights(clickedSampleIdentifier);
//                createHighlights(sampleNames[firstPoint.index]);
            }
        });


    console.log(`PCA chart for ${sheetName} (Instance ${instanceNo}) rendered successfully with color coding.`);
}
