function updateOptions() {
    //Recheck available samples to make sure all the correct options are available
/*    for (group in sortButtonGroups) {
        disableRadioButtons(sortButtonGroups[group], false);
    }
    dataSheetNames.forEach(sheetName => {
        disableRadioButtons(sortButtonGroups[sheetName], false);
        completeSheet[sheetName] = true;
    })*/
    dataSheetNames.forEach(sheetName => {
        disableRadioButtons(sortButtonGroups[sheetName], false);
        completeSheet[sheetName] = true;
        for(dateSampled in selectedSampleMeasurements) {
            if (!selectedSampleMeasurements[dateSampled][sheetName]){
                disableRadioButtons(sortButtonGroups[sheetName], true);
                completeSheet[sheetName] = false;
                break;
            }
        }
    })
    for (i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
        sheetsToDisplay[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]).checked ? true : false; // Check the checkbox state
    }
    for (i = 0; i < subChartNames.length; i++) {
        subName = subChartNames[i];
        subsToDisplay[subName] = document.getElementById(subName).checked ? true : false; // Check the checkbox state
    }
    xAxisSort = document.querySelector('input[name="sorting"]:checked').value;
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
    wrangleData();



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
    for (sheetName in sheetsToDisplay) {
console.log(sheetName, sheetsToDisplay[sheetName], chemicalTypeHasData(sheetName));
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
    sampleMap(selectedMeas);
    filenameDisplay();
}

function displayPsdSplits(sums, sheetName, instanceNo, unitTitle, subTitle) {
//    console.log(sums);
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'PSD splits by ' + subTitle;
    instanceSheet[instanceNo] = sheetName;
    const allSamples = Object.keys(sums);
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
    //    totalAreasAvailable = true;
    if(sheetName === 'Physical Data') {
        retData = dataForPSDCharting(sheetName);
        unitTitle = retData['unitTitle'];
//console.log('unitTitle displayCharts ',unitTitle);
        sizes = retData['ptsSizes'];
        selectedMeas = retData['measChart'];
fred=selectedMeas;
        selectedMeasRelativeArea = retData['measChartRelativeArea'];
        selectedMeasArea = retData['measChartArea'];
        splitWeights = retData['splitWeights'];
        splitRelativeAreas = retData['splitRelativeAreas'];
        splitAreas = retData['splitAreas'];
        cumWeights = retData['cumWeights'];
        cumAreas = retData['cumAreas'];
//console.log(sizes);	            
//console.log('selectedMeas ', selectedMeas);
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
        displayPsdSplits(splitWeights, sheetName, instanceNo, unitTitle, 'Weight');
        instanceNo += 1;
        displayPsdSplits(splitRelativeAreas, sheetName, instanceNo, unitTitle, 'Relative Area');
        instanceNo += 1;
        displayPsdSplits(splitAreas, sheetName, instanceNo, unitTitle, 'Absolute Area');
        if (resuspensionSize>0) {
            instanceNo += 1;
            displayResuspensionFractions(sizes, cumWeights, cumAreas, sheetName, instanceNo, unitTitle, 'Fractions');
        }
    } else {
        retData = dataForCharting(sheetName);
        unitTitle = retData['unitTitle'];
console.log('unitTitle displayCharts ',unitTitle);
        selectedMeas = retData['measChart'];
//console.log('dataForCharting - selectedMeas ', selectedMeas);
        selectedMeasArea = {};
        concentrateMeas = {};
        concentrateFactor = {};
//        totalAreasAvailable = true;
        if (completeSheet['Physical Data']) {
            if (resuspensionSize > 0) {
                retData= recalculateConcentration(selectedMeas);
                concentrateMeas = retData['concentrateMeas'];
                concentrateFactor = retData['concentrateFactor'];
            }
            if (subsToDisplay['relationareadensity']) {
                for (chemical in selectedMeas) {
                    selectedMeasArea[chemical] = {};
                    for (sample in selectedMeas[chemical]) {
                        let parts = sample.split(": ");
                        if (parts.length>2) {
                            parts[1] = parts[1] + ': ' + parts[2];
                        }
                        if (selectedSampleMeasurements?.[parts[0]]?.['Physical Data']?.samples[parts[1]]?.totalArea !== undefined) {
                            if (selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]].totalArea > 0) {
                                totalArea = selectedSampleMeasurements[parts[0]]['Physical Data'].samples[parts[1]].totalArea;
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
console.log(sheetName);
console.log(selectedMeas);
console.log(instanceNo);
console.log(unitTitle);
console.log(sheetName, selectedMeas, instanceNo, unitTitle);
/*            if(sheetName === 'PAH data') {
//This is where to create the buttons which show different PAH groups
console.log('PAH data reset');
                createDisplayChemicals(instanceNo,'EPA');
                createDisplayChemicals(instanceNo,'LMW');
                createDisplayChemicals(instanceNo,'HMW');
                createDisplayChemicals(instanceNo,'SmallPts');
                createDisplayChemicals(instanceNo,'OrganicC');
                createResetChart(instanceNo);
            }*/
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
        largeInstanceNo = -1;
        if (subsToDisplay['positionplace']) {
            retData = dataForScatterCharting(sheetName);
            unitTitle = retData['unitTitle'];
            //console.log('unitTitle displayCharts ',unitTitle);
            scatterData = retData['scatterData'];
            chemicalData = retData['chemicalData'];
//console.log('dataForScatterCharting scatterData, chemicalData',scatterData,chemicalData);
            const allChemicals = Object.keys(chemicalData);
            instanceNo += 1;
            displayCombinedScatterChart(scatterData, sheetName, instanceNo, 'fred');
            largeInstanceNo = instanceNo;

            // Step 1: Create a table element
            const scatterTable = document.createElement('table');
            const noCharts = allChemicals.length;
            const startInstanceNo = instanceNo;
            // Step 2: Loop to create rows and cells for the table
            for (let i = 0; i < noCharts; i++) {
                instanceNo += 1;
                if (i % 4 === 0) {
//                    console.log('created row');
                    row = scatterTable.insertRow(); // Create a row
//                    console.log(row);
                }
                const cell = row.insertCell(); // Create a cell
                const canvas = document.createElement('canvas'); // Create a canvas for the chart
                canvas.id = 'chart' + instanceNo;; // Unique id for each chart canvas
                cell.appendChild(canvas); // Append the canvas to the cell
                //  }
            }

            // Step 3: Append the table to a container element in your HTML (e.g., <div id="container"></div>)
            const chartContainer = document.getElementById('chartContainer');
            // first add a div for the buttons
            if (largeInstanceNo > 1) {
                const divContainer = document.createElement('div');
                divContainer.id = 'chartButtons';
                chartContainer.appendChild(divContainer);
            }
            chartContainer.appendChild(scatterTable);
            instanceNo = startInstanceNo;
            i = 0;
            for (const c in chemicalData) {
                instanceNo += 1;
//console.log(c,scatterData, chemicalData[c]);
                displayScatterChart(scatterData, chemicalData[c], sheetName, instanceNo, c, 'Longitude', 'Latitude', largeInstanceNo);
                i += 1;
            }
        }


        // Usage
        instanceNo = displayScatterCharts(sheetName,
            { key: 'totalArea', sheetKey: 'Physical Data' },
            'relationareadensity',
            'Total Area',
            'Concentration',
            'chartContainer',
            instanceNo
        );

        instanceNo = displayScatterCharts(sheetName,
            { key: 'totalHC', sheetKey: 'PAH data' },
            'relationhc',
            'Total Hydrocarbon',
            'Concentration',
            'chartContainer',
            instanceNo
        );

        instanceNo = displayScatterCharts(sheetName,
            { key: 'totalSolids', sheetKey: 'Physical Data' },
            'relationtotalsolids',
            'Total Solids %',
            'Concentration',
            'chartContainer',
            instanceNo
        );

        instanceNo = displayScatterCharts(sheetName,
            { key: 'organicCarbon', sheetKey: 'Physical Data' },
            'relationorganiccarbon',
            'Organic Carbon %',
            'Concentration',
            'chartContainer',
            instanceNo
        );



//    }

        if (sheetName == 'PAH data' && Object.keys(chemInfo).length != 0) {
            const chemicalNames = Object.keys(chemInfo);
            const properties = Object.keys(chemInfo[chemicalNames[0]]);
            for (i = 0; i<14 ; i++) {

                // Step 2: Sort the chemical names based on the property (e.g., molWeight)
                chemicalNames.sort((a, b) => chemInfo[a][properties[i]] - chemInfo[b][properties[i]]);
                
                // Step 3-6: Iterate through the sorted chemical names and populate selectedMeas
                const sortedSelectedMeas = {};
                chemicalNames.forEach((chemical) => {
                    if (selectedMeas[chemical]) {
                        sortedSelectedMeas[chemical] = selectedMeas[chemical];
                    }
                });
//    console.log(sortedSelectedMeas);
                instanceNo += 1;
                displaySampleChart(sortedSelectedMeas, sheetName + ': Sorted by ' + properties[i], instanceNo, unitTitle);
                instanceNo += 1;
                displayChemicalChart(sortedSelectedMeas, sheetName + ': Sorted by ' + properties[i], instanceNo, unitTitle);
            }
        }
        if (sheetName === 'PAH data' && subsToDisplay['gorhamtest']) {
            unitTitle = retData['unitTitle'];
            selectedSums = sumsForGorhamCharting();
//console.log('sumsForGorhamCharting selectedSums',selectedSums);
//console.log(selectedSums);
            instanceNo += 1;
            displayGorhamTest(selectedSums, sheetName, instanceNo, unitTitle);
            if (resuspensionSize > 0 && completeSheet['Physical Data']) {
                retData = recalculateConcentrationComplex(selectedSums);
                concentrateSums = retData['concentrateMeas'];
                concentrateFactor = retData['concentrateFactor'];
                instanceNo += 1;
                displayGorhamTest(concentrateSums, sheetName, instanceNo, unitTitle + ' < ' + resuspensionSize * 1000000 + 'µm');
            }
//            retData = null;
        }
        if (sheetName === 'PAH data' && subsToDisplay['totalhc']) {
            instanceNo += 1;
            retData = sumsForTotalHCCharting();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
//console.log('sumsForTotalHCCharting ',selectedSums);
            //console.log(Object.keys(selectedSums));
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
    // Display the canvas
//console.log('Display the canvas ',instanceNo);
    return instanceNo
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

function displayScatterCharts(sheetName, chartType, subsKey, xAxisLabel, yAxisLabel, containerId, instanceNo) {
//console.log('Sheet Name ',sheetName, 'chartType ', chartType, 'subsKey', subsKey, 'xAxisLael', xAxisLabel, 'yAxisLabel', yAxisLabel, 'containerId', containerId, 'instanceNo', instanceNo);
    if (subsToDisplay[subsKey] && completeSheet[chartType.sheetKey]) {
        // Fetch chart data
        const retData = dataForTotalScatterCharting(sheetName, chartType.key);
        const { unitTitle, scatterData, chemicalData, fitConcentration, fitPredictors } = retData;
//console.log('dataForTotalScatterCharting scatterData, chemicalData ',scatterData, chemicalData);
        if (unitTitle === 'No data') {
    return instanceNo
}
        const allChemicals = Object.keys(chemicalData);

        instanceNo += 1;
        displayCombinedScatterChart(scatterData, sheetName, instanceNo, 'fred');
        largeInstanceNo = instanceNo;

        // Create a table element
        const scatterTable = document.createElement('table');
        const noCharts = allChemicals.length;
        const startInstanceNo = instanceNo;

        for (let i = 0; i < noCharts; i++) {
            instanceNo += 1;
            if (i % 4 === 0) scatterTable.insertRow();
            const cell = scatterTable.rows[scatterTable.rows.length - 1].insertCell();
            const canvas = document.createElement('canvas');
            canvas.id = `chart${instanceNo}`;
            cell.appendChild(canvas);
        }

        // Append table and buttons to the container
        const chartContainer = document.getElementById(containerId);
        if (largeInstanceNo > 1) {
            const divContainer = document.createElement('div');
            divContainer.id = 'chartButtons';
            chartContainer.appendChild(divContainer);
        }
        chartContainer.appendChild(scatterTable);

        instanceNo = startInstanceNo;
        for (const c in chemicalData) {
//console.log(sheetName, c);
            const data = fitConcentration ? 
                concentrationFitter(fitConcentration[c], fitPredictors[c], 'Chart Analysis') : 
                { beta: 0, R_squared: 0 }; // Default values for charts without fitting

            instanceNo += 1;
            displayScatterChart(
                scatterData[c],
                chemicalData[c],
                sheetName,
                instanceNo,
                `${c} : ${data.R_squared.toFixed(4)}`,
                xAxisLabel,
                yAxisLabel,
                largeInstanceNo
            );
        }
    }
    return instanceNo
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
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
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
//    console.log(ddatasets);
}

function displayScatterChart(scatterData, oneChemical, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo) {
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
//      oneChemical = (oneChemical - minConc) / (maxConc - minConc);
      scaledChemical = {};
      for (s in oneChemical) {
        scaledChemical[s] = (oneChemical[s] - minConc) / (maxConc - minConc);
//console.log(oneChemical[s]);
      }
//console.log(oneChemical);
    // Chart configuration
    const chartConfig = {
        type: 'scatter',
        data: {
                  datasets: [{
                    data: scatterData,
                    backgroundColor:
                       allSamples.map(sample => colorGradient(scaledChemical[sample], color1, color2)),
                    borderColor:
                       allSamples.map(sample => colorGradient(scaledChemical[sample], color1, color2)),
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
//    createToggleCanvasSize(convas, chartInstance[instanceNo], instanceNo, unitTitle);
//console.log(largeInstanceNo,oneChemical);
/*    if (largeInstanceNo > 1) {
        createToggleFocusChart(convas, chartInstance[instanceNo], instanceNo, oneChemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo);
    }*/
    document.getElementById('chart' + instanceNo).addEventListener('click', () => displayScatterChart(scatterData, oneChemical, sheetName, largeInstanceNo, unitTitle, xAxisTitle, yAxisTitle, -1));
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
    const datasets = allChemicals.map((chemical, index) => {
        const data = allSamples.map(sample => meas[chemical][sample]); // Using the first concentration value for simplicity
        return {
            label: chemical,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnySampleChart(meas, allSamples,datasets,instanceNo,sheetName,unitTitle,false);
    if(sheetName === 'PAH data') {
        //This is where to create the buttons which show different PAH groups
        console.log('PAH data reset');
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
        
    console.log("datasets ",datasets);
    
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
    //console.log(sheetName, instanceNo);
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
                        // pan options and/or events
                        enabled: true,
                        mode: 'xy',
                        modifierKey: 'shift',
                    },
                    limits: {
                        y: { min: 0 }
                        // axis limits
                    },
                    zoom: {
                        // zoom options and/or events
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
//console.log(stanGraph);
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
//console.log(stanGraph);
    };
    chartInstance[instanceNo] = new Chart(ctx, stanGraph);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);
    createExportButton(chartInstance[instanceNo], instanceNo);
    function clickableScales(chart, canvas, click) {
        //console.log(chart);
        const height = chart.scales.x.height;
        const top = chart.scales.x.top;
        const bottom = chart.scales.x.bottom;
        const left = chart.scales.x.left;
        const right = chart.scales.x.maxWidth / chart.scales.x.ticks.length;
        //console.log('click scales - height,top,bottom,left,right', height,top,bottom,left,right);
        let resetCoordinates = canvas.getBoundingClientRect();
        //console.log('click - raw x y', click.clientX, click.clientY);
        const x = click.clientX - resetCoordinates.left;
        const y = click.clientY - resetCoordinates.top;
        //console.log('click - corrrected x y', x, y);
        //console.log('chart.scales.x.ticks.length',chart.scales.x.ticks.length);
        if (y >= top && y <= bottom) {
            for (let i = 0; i < chart.scales.x.ticks.length; i++) {
                if (x >= left + (right * i) && x <= left + (right * (i + 1))) {
                    console.log('x label', i);
                    const regexPattern = /^(.+): (.+)$/;
console.log(all[i]);
                    const matchResult = all[i].match(regexPattern);
                    if (matchResult) {
                        // Extracted parts
                        const dateSampled = matchResult[1];
                        const sample = matchResult[2];

                        // Output the results
                        console.log("Date Sampled: ", dateSampled);
                        console.log("Sample:", sample);
                        createHighlights(meas, dateSampled, all[i], null);
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
        names4Chemicals = [];
        allChemicals.forEach(chemical => {names4Chemicals.push(ddLookup.reverseChemical[chemical])});
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
        chartLabel(instanceNo,alX,0.8*alMax,actionLevelColors[0],'Action Level 1                  ');
        chartLine(instanceNo,'Legend - Action Level 1',alX*1.4,alX*2.5,0.8*alMax,0.8*alMax,actionLevelColors[0],actionLevelDashes[0]);
        if (al2) {
            chartLabel(instanceNo,alX,0.9*alMax,actionLevelColors[1],'Action Level 2                  ');
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
//    const lmwSumData = samples.map(sample => sums[sample].lmwSum);
    //console.log(lmwSumData);
//    const hmwSumData = samples.map(sample => sums[sample].hmwSum);
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
//    displayAnyChart(cumWeights, samples, datasets, instanceNo, sheetName + ': Fractions < ' + resuspensionSize * 1000000 + 'µm', unitTitle, true);
//    displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Total hydrocarbon & Total PAH',unitTitle,true);
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

//    const samples = Object.keys(cumWeights);
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
    chartLabel(instanceNo,gorX,0.75*gorMax,'rgba(0, 0, 255, 0.5)','LMW ERL                            ');
    chartLine(instanceNo,'Legend - LMW.ERL',gorX*1.2,gorX*2.2,0.75*gorMax,0.75*gorMax,'rgba(0, 0, 255, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.8*gorMax,'rgba(0, 0, 255, 0.5)','LMW ERM                           ');
    chartLine(instanceNo,'Legend - LMW.ERM',gorX*1.2,gorX*2.2,0.8*gorMax,0.8*gorMax,'rgba(0, 0, 255, 0.5)',actionLevelDashes[1]);
    chartLabel(instanceNo,gorX,0.9*gorMax,'rgba(255, 0, 0, 0.5)','HMW ERL                            ');
    chartLine(instanceNo,'Legend - HMW.ERL',gorX*1.2,gorX*2.2,0.9*gorMax,0.9*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.95*gorMax,'rgba(255, 0, 0, 0.5)','HMW ERM                           ');
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
    chartLabel(instanceNo,gorX,0.75*gorMax,'rgba(0, 0, 255, 0.5)','ICES7 Action Level 1                            ');
    chartLine(instanceNo,'Legend - ICES7 AL1',gorX*1.2,gorX*2.2,0.75*gorMax,0.75*gorMax,'rgba(0, 0, 255, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.9*gorMax,'rgba(255, 0, 0, 0.5)','All Action Level 1                            ');
    chartLine(instanceNo,'Legend - All AL1',gorX*1.2,gorX*2.2,0.9*gorMax,0.9*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[0]);
    chartLabel(instanceNo,gorX,0.95*gorMax,'rgba(255, 0, 0, 0.5)','All Action Level 2                           ');
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
//    y1Title = 'Total PAH';
    chartInstance[instanceNo].options.plugins.legend.display = true;
    legends[instanceNo] = true;
    // Update the chart
    chartInstance[instanceNo].update();
}


function findSamplesInSameLocation(clickedMapSample) {
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
}

function createHighlights(meas, dateSampled, hoveredSample) {
console.log('createHighlights',hoveredSample,dateSampled);
    noSamples = 0;
    samples = [];
    const datesSampled = Object.keys(selectedSampleInfo);
//srg250308    datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        const ok = Object.keys(selectedSampleInfo[dateSampled].position);
        noSamples += ok.length;
        const allSamples = Object.keys(selectedSampleInfo[dateSampled].position);
//srg250308        allSamples.sort();
        allSamples.forEach(sample => {
            samples.push(dateSampled + ': ' + sample);
        });
        //			}
    });
    //This needs the new sorting logic  *************************************************************************
//    if (!(xAxisSort === 'normal')) {
        samples.sortComplexSamples();
//    }
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
    //    console.log('meas[allChemicals[0]]', Object.keys(meas[allChemicals[0]]));
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



