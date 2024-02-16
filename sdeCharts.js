function updateChart(){
    if (lastInstanceNo > 0) {
        const canvas = [];
        for (i = 1; i < lastInstanceNo + 1; i++) {
            canvas[i] = document.getElementById('chart' + i);
            clearCanvasAndChart(canvas[i], i);
        }
    }
    const yScaleType = document.getElementById('scaleType').checked ? 'logarithmic' : 'linear'; // Check the checkbox state
    for (i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
        sheetsToDisplay[dataSheetNames[i]] = document.getElementById(dataSheetNamesCheckboxes[i]).checked ? true : false; // Check the checkbox state
    }
    for (i = 0; i < subChartNames.length; i++) {
        subName = subChartNames[i];
        subsToDisplay[subName] = document.getElementById(subName).checked ? true : false; // Check the checkbox state
    }
    lastInstanceNo = 0;
    blankSheets = {};
    setBlanksForCharting();
    for (sheetName in sheetsToDisplay) {
        if (sheetsToDisplay[sheetName] && chemicalTypeHasData(sheetName)) {
            lastInstanceNo = displayCharts(sheetName, lastInstanceNo, yScaleType);
        }
    }
console.log('lastInstanceNo ',lastInstanceNo);			
    sampleMap(selectedMeas, yScaleType);
    filenameDisplay();
}

function displayCharts(sheetName, instanceNo, yScaleType) {
    if(sheetName === 'Physical Data') {
        retData = dataForPSDCharting(sheetName);
        unitTitle = retData['unitTitle'];
//console.log('unitTitle displayCharts ',unitTitle);
        sizes = retData['sizes'];
        selectedMeas = retData['measChart'];
//console.log(sizes);	            
//console.log('selectedMeas ', selectedMeas);
        instanceNo += 1;
        displayPSDChart(sizes, selectedMeas, sheetName, instanceNo, yScaleType, unitTitle);
    } else {
        retData = dataForCharting(sheetName);
        unitTitle = retData['unitTitle'];
//console.log('unitTitle displayCharts ',unitTitle);
        selectedMeas = retData['measChart'];
        
//console.log('selectedMeas ', selectedMeas);
        if (subsToDisplay['samplegroup']) {
            instanceNo += 1;
            displaySampleChart(selectedMeas, sheetName, instanceNo, yScaleType, unitTitle);
        }
        if (subsToDisplay['chemicalgroup']) {
            instanceNo += 1;
            displayChemicalChart(selectedMeas, sheetName, instanceNo, yScaleType, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['gorhamtest']) {
            instanceNo += 1;
            selectedSums = sumsForGorhamCharting();
            displayGorhamTest(selectedSums, sheetName, instanceNo, yScaleType, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['totalHC']) {
            instanceNo += 1;
            retData = sumsForTotalHCCharting();
            unitTitle = retData['unitTitle'];
            selectedSums = retData['measChart'];
            displayTotalHC(selectedSums, sheetName, instanceNo, yScaleType, unitTitle);
        }
        if (sheetName === 'PCB data' && subsToDisplay['congenertest']) {
            instanceNo += 1;
            selectedSums = sumsForCongenerCharting();
            displayCongener(selectedSums, sheetName, instanceNo, yScaleType, unitTitle);
        }
    }
    // Display the canvas
//console.log('Display the canvas ',instanceNo);
    return instanceNo
}

function dataForCharting(sheetName) {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    ct = sheetName;
    unitTitle = blankSheets[ct]['Unit of measurement'];
    measChart = {};
//			for (const ds in selected) {
    datesSampled.sort();
       datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null)) {
            for (const c in selectedSampleMeasurements[ds][ct].chemicals) {
                if (measChart[c] == undefined || measChart[c] == null) {
                    measChart[c] = {};
                }
//						for (const s in selected[ds][ct].chemicals[c].samples) {
//                for (const s in selectedSampleInfo[ds].position) {
                    const allSamples = Object.keys(selectedSampleInfo[ds].position);
                    allSamples.sort();
                    allSamples.forEach(s => {
                                    if (selectedSampleMeasurements[ds][ct].chemicals[c].samples[s] == undefined || selectedSampleMeasurements[ds][ct].chemicals[c].samples[s] == null) {
                        measChart[c][ds + ': ' + s] = 0.0;
                    } else {
                        measChart[c][ds + ': ' + s] = selectedSampleMeasurements[ds][ct].chemicals[c].samples[s];
                    }
                });
            }
        } else {
            // Have to deal with samples without measurements set everything to zero
            for (const c in blankSheets[ct].chemicals) {
                if (measChart[c] == undefined || measChart[c] == null) {
                    measChart[c] = {};
                }
//                for (const s in selectedSampleInfo[ds].position) {
                    const allSamples = Object.keys(selectedSampleInfo[ds].position);
                    allSamples.sort();
                    allSamples.forEach(s => {
                                    measChart[c][ds + ': ' + s] = 0.0;
                });
            }
        }
    });
    unitTitle = blankSheets[ct]['Unit of measurement'];
    return {unitTitle, measChart}
}

function sumsForCongenerCharting() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    measChart = {};
//			for (const ds in selected) {
    datesSampled.sort();
       datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds]['PCB data'] == undefined || selectedSampleMeasurements[ds]['PCB data'] == null)) {
//					for (const s in selected[ds]['PCB data'].congenerTest) {
//            for (const s in selectedSampleInfo[ds].position) {
                const allSamples = Object.keys(selectedSampleInfo[ds].position);
                allSamples.sort();
                allSamples.forEach(s => {
            console.log(ds,s);
                if (selectedSampleMeasurements[ds]['PCB data'].congenerTest[s] == undefined || selectedSampleMeasurements[ds]['PCB data'].congenerTest[s] == null) {
                    measChart[ds + ': ' + s] = { ICES7 : 0.0, All : 0.0 };
                } else {
                    measChart[ds + ': ' + s] = selectedSampleMeasurements[ds]['PCB data'].congenerTest[s];
                }
            });
        } else {
//            for (const s in selectedSampleInfo[ds].position) {
    const allSamples = Object.keys(selectedSampleInfo[ds].position);
    allSamples.sort();
    allSamples.forEach(s => {
                measChart[ds + ': ' + s] = { All : 0.0, ICES7 : 0.0};
            });
        }
    });
    return measChart
}

function sumsForGorhamCharting() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    measChart = {};
    datesSampled.sort();
       datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null)) {
//            for (const s in selectedSampleMeasurements[ds]['PAH data'].gorhamTest) {
    const allSamples = Object.keys(selectedSampleMeasurements[ds]['PAH data'].totalHC);
    allSamples.sort();
    allSamples.forEach(s => {
    if (selectedSampleMeasurements[ds]['PAH data'].gorhamTest[s] == undefined || selectedSampleMeasurements[ds]['PAH data'].gorhamTest[s] == null) {
                    measChart[ds + ': ' + s] = { hmwSum : 0.0, lmwSum : 0.0};
                } else {
                    measChart[ds + ': ' + s] = selectedSampleMeasurements[ds]['PAH data'].gorhamTest[s];
                }
            });
        } else {
//            for (const s in selectedSampleInfo[ds].position) {
    const allSamples = Object.keys(selectedSampleInfo[ds].position);
    allSamples.sort();
    allSamples.forEach(s => {
                measChart[ds + ': ' + s] = { hmwSum : 0.0, lmwSum : 0.0};
            });
        }
    });
    return measChart
}

function sumsForTotalHCCharting() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    unitTitle = blankSheets[ct]['totalHCUnit'];
    measChart = {};
sampleNo = -1;
    datesSampled.sort();
       datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null)) {
//            for (const s in selectedSampleMeasurements[ds]['PAH data'].totalHC) {
                const allSamples = Object.keys(selectedSampleMeasurements[ds]['PAH data'].totalHC);
                allSamples.sort();
                allSamples.forEach(s => {
                            if (selectedSampleMeasurements[ds]['PAH data'].total[s] == undefined || selectedSampleMeasurements[ds]['PAH data'].totalHC[s] == null) {
                    measChart[ds + ': ' + s] = { totalHC : 0.0, fractionPAH : 0.0};
                } else {
//							measChart[ds + ': ' + s] = {totalHC : selected[ds]['PAH data'].totalHC[s], fractionPAH : (selected[ds]['PAH data'].total[s] / (1000 * selected[ds]['PAH data'].totalHC[s]))};
                    measChart[ds + ': ' + s] = {totalHC : selectedSampleMeasurements[ds]['PAH data'].totalHC[s], fractionPAH : selectedSampleMeasurements[ds]['PAH data'].total[s] / 1000};
                }
sampleNo += 1;
console.log(sampleNo,ds,s);
            });
        } else {
//            for (const s in selectedSampleInfo[ds].position) {
    const allSamples = Object.keys(selectedSampleInfo[ds].position);
    allSamples.sort();
    allSamples.forEach(s => {
                measChart[ds + ': ' + s] = { totalHC : 0.0, fractionPAH : 0.0};
sampleNo += 1;
console.log(sampleNo,ds,s);
            });
        }
    });
    return {unitTitle, measChart}
}



function setBlanksForCharting() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
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

function dataForPSDCharting(sheetName) {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    ct = sheetName;
//			unitTitle = selected[datesSampled[0]][ct]['Unit of measurement'];
    unitTitle = blankSheets[ct]['Unit of measurement'];
    measChart = {};
    sizes = null;
//			for (const ds in selected) {
    datesSampled.sort();
       datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null)) {
            if (!sizes) {
                sizes = selectedSampleMeasurements[ds][ct].sizes;
                sizes = sizes.map(phiSize => Math.pow(2, -phiSize));
            }
            for (const s in selectedSampleMeasurements[ds][ct].samples) {
                measChart[ds + ': ' + s] = selectedSampleMeasurements[ds][ct].samples[s].psd;
            }
        } else {
            for (const s in selectedSampleInfo[ds].position) {
                measChart[ds + ': ' + s] = new Array(42).fill(0.0);
            }
        }
    });
//console.log('dataforPSD ', unitTitle,sizes,measChart);
    return {unitTitle, sizes, measChart}
}

function displayPSDChart(sizes, meas, sheetName, instanceNo, yLogLin, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'PSD';
    instanceSheet[instanceNo] = sheetName;
    // Extract sample names from the PSD data structure
    const sampleNames = Object.keys(meas);

    // Create datasets for each sample
    const datasets = sampleNames.map((sampleName, index) => {
        return {
            label: sampleName,
            data: meas[sampleName],
//		            borderColor: getRandomColor(), // Function to generate random color
            borderWidth: 2,
            fill: false,
        };
    });

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
                  text: sheetName
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
                            text: 'mm'
                            }
                    },
                    y: {
                        beginAtZero: true,
                        type: yLogLin,
                        title: {
                            display: true,
                            text: unitTitle
                            }
                        }
                    },
            autocolors: {
                mode: 'label'
            }
        }
        };
//		    };


const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
chartInstance[instanceNo] = new Chart(ctx, chartConfig);

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

function displayPSDHighlight(meas, yLogLin, instanceNo, clickedMapSample) {
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

function displaySampleChart(meas, sheetName, instanceNo, yLogLin, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'chemical';
    instanceSheet[instanceNo] = sheetName;
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
    displayAnyChart(meas, allSamples,datasets,instanceNo,sheetName,unitTitle,yLogLin);
}

function highlightMapLocation(clickedIndex) {
    console.log(clickedIndex);
    return
}

function displayAnyChart(meas, all, datasets, instanceNo, title, yTitle, yLogLin) {
    //console.log('chartInstance ', instanceNo);
    //		            const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
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
                    display: false,
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
                    }
                },
                y: {
                    beginAtZero: true,
                    type: yLogLin,
                    title: {
                        display: true,
                        text: yTitle,
                        position: 'left',
                    }
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
            type: yLogLin,
            position: 'right',
            title: {
                display: true,
                text: 'Total PAH content (mg/kg)',
                position: 'right',
            }
        };
        console.log(stanGraph);
    };
    chartInstance[instanceNo] = new Chart(ctx, stanGraph);

    //clickableScales(chartInstance[instanceNo], 1);		            
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
                    const regexPattern = /^(\S+): (.+)$/;
                    const matchResult = all[i].match(regexPattern);
                    if (matchResult) {
                        // Extracted parts
                        const dateSampled = matchResult[1];
                        const sample = matchResult[2];

                        // Output the results
                        console.log("Date Sampled: ", dateSampled);
                        console.log("Sample:", sample);
//                        createHighlights(meas, yLogLin, dateSampled, sample, null);
                        createHighlights(meas, yLogLin, dateSampled, all[i], null);
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
        //chartInstance[instanceNo].updtae();
    });
    const xLabels = document.querySelectorAll('#chart' + instanceNo + '.chartjs-axis-x .chartjs-axis-label');
    xLabels.forEach((label, index) => {
        label.addEventListener('click', () => {
            console.log('about to toggle');
            toggleHighlightMapLocation(index);
        });
    });
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
}


function displayChemicalChart(meas, sheetName, instanceNo, yLogLin, unitTitle) {
createCanvas(instanceNo);
const convas = document.getElementById("chart" + instanceNo);
convas.style.display = "block";
instanceType[instanceNo] = 'sample';
instanceSheet[instanceNo] = sheetName;
const allChemicals = Object.keys(meas);
const allSamples = Object.keys(meas[allChemicals[0]]); // Assuming all samples have the same chemicals
const datasets = allSamples.map((sample, index) => {
    const data = allChemicals.map(chemical => meas[chemical][sample]); // Using the first concentration value for simplicity
    return {
        label: sample,
        data: data,
        borderWidth: 1,
        yAxisID: 'y',
    };
});
displayAnyChart(meas, allChemicals,datasets,instanceNo,sheetName,unitTitle,yLogLin);
chartInstance[instanceNo].options.plugins.annotation.annotations = {};
let allal = actionLevels[sheetName];


if(allal) {
    allChemicals.forEach (chemical => {
        let  al = allal[chemical] ? allal[chemical].slice() : null;
        alMax = 0;
        al2 = false;
        if(al) {
            item = allChemicals.indexOf(chemical);
            for (i = 0; i < 2; i++) {
                if (al[i] > 0.0) {
//							borderColor = actionLevelColors[i];
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
    }
}
  // Update the chart
  chartInstance[instanceNo].update();
}

//        chartInstance[3].resetZoom();
// <button onclick="chartInstance[3].resetZoom()">Reset Zoom</button>

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
//		    chartInstance[instanceNo].options.plugins.annotation.annotations.push({
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
//		    chartInstance[instanceNo].options.plugins.annotation.annotations.push({
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

function displayGorhamTest(sums, sheetName, instanceNo, yLogLin, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'gorham';
    instanceSheet[instanceNo] = sheetName;
    const lmw = ['Acenaphthene', 'Acenaphthylene', 'Anthracene', 'Fluorene', 'C1-Naphthalenes', 'Naphthalene', 'Phenanthrene'];
    const hmw = ['Benz[a]anthracene', 'Benzo[a]pyrene', 'Chrysene', 'Dibenz[a,h]anthracene', 'Fluoranthene', 'Pyrene'];
    const LMW = {
        ERL: 552,
        ERM: 3160
    };
    const HMW = {
        ERL: 1700,
        ERM: 9600
    };

    const samples = Object.keys(sums);
    const lmwSumData = samples.map(sample => sums[sample].lmwSum);
    const hmwSumData = samples.map(sample => sums[sample].hmwSum);
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

    displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Gorham Test Protocol',unitTitle,yLogLin);

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
  chartInstance[instanceNo].update();
}

function displayCongener(sums, sheetName, instanceNo, yLogLin, unitTitle) {
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
    displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Congener Sums',unitTitle,yLogLin);
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

function displayTotalHC(sums, sheetName, instanceNo, yLogLin, unitTitle) {
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'totalHC';
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
displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Total hydrocarbon & Total PAH',unitTitle,yLogLin);
y1Title = 'Total PAH';
/*		    chartInstance[instanceNo].options.scales.push({
                y1: { beginAtZero: true,
                    type: yLogLin,
                    title: {
                        display: true,
                        text: y1Title,
                        position: 'right',
                        }
                    }
                });*/

/*			  chartInstance[instanceNo].scales[('y1')] = {
                y1: { beginAtZero: true,
                    type: yLogLin,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Something',
                        position: 'right',
                        }
                    },
                };*/
chartInstance[instanceNo].options.plugins.legend.display = true;
                
  /*chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    chartLine(instanceNo,'ICES7 Action Level 1',0,samples.length,0.01,0.01,'rgba(0, 0, 255, 0.5)',[3,3]);
    chartLine(instanceNo,'All Action Level 1',0,samples.length,0.02,0.02,'rgba(255, 0, 0, 0.5)',[3,3]);
    chartLine(instanceNo,'All Action Level 2',0,samples.length,0.2,0.2,'rgba(255, 0, 0, 0.5)',[5,5]);
    gorX = samples.length * 0.1;
    gorMax = 0.2;
    for (const sample in sums) {
        if (sums[sample].totalHC > gorMax) {
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
    chartLine(instanceNo,'Legend - All AL2',gorX*1.2,gorX*2.2,0.95*gorMax,0.95*gorMax,'rgba(255, 0, 0, 0.5)',actionLevelDashes[1]);*/
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

function createHighlights(meas, linLog, dateSampled, hoveredSample) {
console.log('createHighlights',hoveredSample,dateSampled);
    noSamples = 0;
    samples = [];
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        //			for (const dateSampled in selectedSampleInfo) {
        const ok = Object.keys(selectedSampleInfo[dateSampled].position);
        //				noSamples += Object.keys(selectedSampleInfo[dateSampled].position).length;
        noSamples += ok.length;
//        for (const sample in selectedSampleInfo[dateSampled].position) {
            const allSamples = Object.keys(selectedSampleInfo[dateSampled].position);
            allSamples.sort();
            allSamples.forEach(sample => {
                    samples.push(dateSampled + ': ' + sample);
        });
        //			}
    });
console.log(hoveredSample);
    if (!dateSampled) {
        clickedSamples = findSamplesInSameLocation(hoveredSample);
        console.log('Not dateSampled',hoveredSample);
    } else {
        clickedSamples = [];
        clickedSamples[0] = dateSampled + ': ' + hoveredSample;
//        clickedSamples[0] = hoveredSample;
console.log('dateSampled',dateSampled,hoveredSample);
    }
console.log('clickedSamples',clickedSamples);
    const allChemicals = Object.keys(meas);
    let clickedIndexes = [];
//    console.log('samples', samples);
//    console.log('meas[allChemicals[0]]', Object.keys(meas[allChemicals[0]]));
    clickedSamples.forEach(clickedSample => {
        index = -1;
        samples.forEach(sample => {
            index += 1;
            if ((dateSampled + ': ' + sample) === clickedSample) {
                clickedIndexes.push(index);
            }
        });
    });
console.log('clickedIndexes',clickedIndexes);
    clickedIndexes.forEach(item => {
//        if (isMarked === null) {
            console.log('doing the null bit');
            if (highlighted[item]) {
                highlighted[item] = false;
            } else {
                highlighted[item] = true;
            }
/*        } else {
console.log('doing the other bit');
            highlighted[item] = !isMarked;
        }*/
    });
console.log(highlighted);
    clickedIndexes.forEach(item => {
        console.log(item);
        for (let i = 1; i < lastInstanceNo + 1; i++) {
            if (instanceType[i] === 'gorham' || instanceType[i] === 'chemical' || instanceType[i] === 'congener' || instanceType[i] === 'totalHC') {
                if (highlighted[item]) {
                    displayChartHighlight(meas, linLog, i, dateSampled, item);
                } else {
                    removeChartHighlight(meas, linLog, i, dateSampled, item);
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
function displayChartHighlight(meas, yLogLin, instanceNo, dateSampled, item) {
  // Draw a rectangle around the clicked data
console.log('about to highlight',instanceNo,item);
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

function removeChartHighlight(meas, yLogLin, instanceNo, dateSampled, item) {
console.log('about to remove highlight',instanceNo,item);
      delete chartInstance[instanceNo].options.plugins.annotation.annotations['tempBox-' + instanceNo + '-'+item];
  // Update the chart
  chartInstance[instanceNo].update();
}



