function updateChart(){
//console.log('UPDATECHART*******************');
    if (lastInstanceNo > 0) {
        const canvas = [];
        for (i = 1; i < lastInstanceNo + 1; i++) {
            canvas[i] = document.getElementById('chart' + i);
            clearCanvasAndChart(canvas[i], i);
        }
    }
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
    sampleMap(selectedMeas);
    filenameDisplay();
}

function displayCharts(sheetName, instanceNo) {
    if(sheetName === 'Physical Data') {
        retData = dataForPSDCharting(sheetName);
        unitTitle = retData['unitTitle'];
//console.log('unitTitle displayCharts ',unitTitle);
        sizes = retData['sizes'];
        selectedMeas = retData['measChart'];
//console.log(sizes);	            
//console.log('selectedMeas ', selectedMeas);
        instanceNo += 1;
        displayPSDChart(sizes, selectedMeas, sheetName, instanceNo, unitTitle);
    } else {
        retData = dataForCharting(sheetName);
        unitTitle = retData['unitTitle'];
//console.log('unitTitle displayCharts ',unitTitle);
        selectedMeas = retData['measChart'];
        
//console.log('selectedMeas ', selectedMeas);
        if (subsToDisplay['samplegroup']) {
            instanceNo += 1;
            displaySampleChart(selectedMeas, sheetName, instanceNo, unitTitle);
        }
        if (subsToDisplay['chemicalgroup']) {
            instanceNo += 1;
            displayChemicalChart(selectedMeas, sheetName, instanceNo, unitTitle);
        }
        if (subsToDisplay['positionplace']) {
            retData = dataForScatterCharting(sheetName);
            unitTitle = retData['unitTitle'];
            //console.log('unitTitle displayCharts ',unitTitle);
            scatterData = retData['scatterData'];
            chemicalData = retData['chemicalData'];
            const allChemicals = Object.keys(chemicalData);
            for (const c in chemicalData) {
                instanceNo += 1;
                displayScatterChart(scatterData, chemicalData[c], sheetName, instanceNo, c);
            }
        }
/*        if (radarPlot === sheetName) {
            createRadarPlot(selectedMeas, sheetName);
        }*/
//console.log('About to sort');
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
            instanceNo += 1;
            selectedSums = sumsForGorhamCharting();
            displayGorhamTest(selectedSums, sheetName, instanceNo, unitTitle);
        }
        if (sheetName === 'PAH data' && subsToDisplay['totalHC']) {
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
//               for (const s in selectedSampleInfo[ds].position) {
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
//console.log(ds,s);
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
        if (!(selectedSampleMeasurements[ds]['PAH data'] == undefined || selectedSampleMeasurements[ds]['PAH data'] == null)) {
            const allSamples = Object.keys(selectedSampleMeasurements[ds]['PAH data'].totalHC);
            allSamples.sort();
            allSamples.forEach(s => {
            if (selectedSampleMeasurements[ds]['PAH data'].total[s] == undefined || selectedSampleMeasurements[ds]['PAH data'].totalHC[s] == null) {
                measChart[ds + ': ' + s] = { totalHC : 0.0, fractionPAH : 0.0};
            } else {
                measChart[ds + ': ' + s] = {totalHC : selectedSampleMeasurements[ds]['PAH data'].totalHC[s], fractionPAH : selectedSampleMeasurements[ds]['PAH data'].total[s] / 1000};
            }
            sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        } else {
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

function ratiosForPAHs() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    unitTitle = 'Ratio';
    measChart = {};
    sampleNo = -1;
    datesSampled.sort();
    datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds]['PAH data'] == undefined || selectedSampleMeasurements[ds]['PAH data'] == null)) {
            const ratios = sampleMeasurements[ds]['PAH data'].ratios;
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
            allSamples.sort();
            allSamples.forEach(s => {
                measChart[ds + ': ' + s] = ratios[s];
                sampleNo += 1;
    //console.log(sampleNo,ds,s);
            });
        } else {
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
            allSamples.sort();
            allSamples.forEach(s => {
                const m = {};
                //IP/(IP+B(ghi)P)
                m['IP/(IP+B(ghi)P)'] = 0.0;
                //BaA/(BaA+Chr)
                m['BaA/(BaA+Chr)'] = 0.0;
                //BaP/(BaP+Chr)
                m['BaP/(BaP+Chr)'] = 0.0;
                //Phen/(Phen+Anth)
                m['Phen/(Phen+Anth)'] = 0.0;
                //BaA/(BaA+BaP)
                m['BaA/(BaA+BaP)'] = 0.0;
                //BbF/(BbF+BkF)
                m['BbF/(BbF+BkF)'] = 0.0;
                measChart[ds + ': ' + s] = m;
            sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        }
    });
//console.log('ratios',measChart);
    return {unitTitle, measChart}
}

function simpleRatiosForPAHs() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    unitTitle = 'Ratio';
    measChart = {};
    sampleNo = -1;
    datesSampled.sort();
    datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds]['PAH data'] == undefined || selectedSampleMeasurements[ds]['PAH data'] == null)) {
            const simpleRatios = sampleMeasurements[ds]['PAH data'].simpleRatios;
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
            allSamples.sort();
            allSamples.forEach(s => {
                measChart[ds + ': ' + s] = simpleRatios[s];
                sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        } else {
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
            allSamples.sort();
            allSamples.forEach(s => {
                const m = {};
                //IP/(IP+B(ghi)P)    ????????????????????????????????????
                m['IP/(IP+B(ghi)P)'] = 0.0;
                //BaA/(BaA+Chr)
                m['BaA/(BaA+Chr)'] = 0.0;
                //BaP/(BaP+Chr)
                m['BaP/(BaP+Chr)'] = 0.0;
                //Phen/(Phen+Anth)
                m['Phen/(Phen+Anth)'] = 0.0;
                //BaA/(BaA+BaP)
                m['BaA/(BaA+BaP)'] = 0.0;
                //BbF/(BbF+BkF)
                m['BbF/(BbF+BkF)'] = 0.0;
                measChart[ds + ': ' + s] = m;
            sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        }
    });
//console.log('ratios',measChart);
    return {unitTitle, measChart}
}

function epaRatiosForPAHs() {
        const datesSampled = Object.keys(selectedSampleMeasurements);
        unitTitle = 'Fraction';
        measChart = {};
        sampleNo = -1;
        datesSampled.sort();
        datesSampled.forEach (ds => {
            if (!(selectedSampleMeasurements[ds]['PAH data'] == undefined || selectedSampleMeasurements[ds]['PAH data'] == null)) {
    //            const chemicals = selectedSampleMeasurements[ds]['PAH data'].chemicals;
                const ringSums = sampleMeasurements[ds]['PAH data'].ringSums;
                const allSamples = Object.keys(selectedSampleInfo[ds].position);
                allSamples.sort();
                allSamples.forEach(s => {
                    const rs = ringSums[s];
                    const total = rs['Total EPA PAHs'];
                    const m = {};
                    m['LPAHs/Total'] = rs['LPAHs'] / total;
                    m['HPAHs/Total'] = rs['HPAHs'] / total;
                    measChart[ds + ': ' + s] = m;
                    sampleNo += 1;
        //console.log(sampleNo,ds,s);
                });
            } else {
                const allSamples = Object.keys(selectedSampleInfo[ds].position);
                allSamples.sort();
                allSamples.forEach(s => {
                    const m = {};
                    m['LPAHs/Total'] = 0.0;
                    m['HPAHs/Total'] = 0.0;
                    measChart[ds + ': ' + s] = m;
                    sampleNo += 1;
    console.log(sampleNo,ds,s);
                });
            }
        });
//console.log('ratios',measChart);
        return {unitTitle, measChart}
    }
    function ringFractionsForPAHs() {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    unitTitle = 'Fraction per ring size';
    measChart = {};
    sampleNo = -1;
    datesSampled.sort();
    datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds]['PAH data'] == undefined || selectedSampleMeasurements[ds]['PAH data'] == null)) {
//            const chemicals = selectedSampleMeasurements[ds]['PAH data'].chemicals;
            const ringSums = sampleMeasurements[ds]['PAH data'].ringSums;
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
            allSamples.sort();
            allSamples.forEach(s => {
                const rs = ringSums[s];
                const total = rs['Total all rings'];
                const m = {};
                m['2rings/tot'] = rs['Sum of 2 rings'] / total;
                m['3rings/tot'] = rs['Sum of 3 rings'] / total;
                m['4rings/tot'] = rs['Sum of 4 rings'] / total;
                m['5rings/tot'] = rs['Sum of 5 rings'] / total;
                m['6rings/tot'] = rs['Sum of 6 rings'] / total;
                measChart[ds + ': ' + s] = m;
                sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        } else {
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
            allSamples.sort();
            allSamples.forEach(s => {
                const m = {};
                m['2rings/tot'] = 0;
                m['3rings/tot'] = 0;
                m['4rings/tot'] = 0;
                m['5rings/tot'] = 0;
                m['6rings/tot'] = 0;
                measChart[ds + ': ' + s] = m;
                sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        }
    });
//console.log('ratios',measChart);
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

function dataForScatterCharting(sheetName) {
    const datesSampled = Object.keys(selectedSampleMeasurements);
    ct = sheetName;
//			unitTitle = selected[datesSampled[0]][ct]['Unit of measurement'];
    unitTitle = blankSheets[ct]['Unit of measurement'];
    scatterData = [];
    chemicalData = {};
//			for (const ds in selected) {
//    datesSampled.sort();
    i = 0;
    datesSampled.forEach (ds => {
        const allChemicals = Object.keys(selectedSampleMeasurements[ds][ct].chemicals);
        for (const s in selectedSampleMeasurements[ds][ct].chemicals[allChemicals[0]].samples) {
             scatterData[i] = ({x: sampleInfo[ds].position[s]['Position longitude'], 
                         y: sampleInfo[ds].position[s]['Position latitude']});
                i += 1;
//console.log(sampleInfo[ds].position[s]['Position latitude']);
//console.log(sampleInfo[ds].position[s]['Position longitude']);             
        }
        for (const c in selectedSampleMeasurements[ds][ct].chemicals) {
            if (chemicalData[c] == undefined || chemicalData[c] == null) {
                chemicalData[c] = {};
            }
            currentChemical = selectedSampleMeasurements[ds][ct].chemicals[c];
//console.log(currentChemical);
            for (const s in currentChemical.samples) {
                chemicalData[c][ds + ' : ' + s] = currentChemical.samples[s];
//console.log(currentChemical.samples[s])
            }
        }
    });

/*    scatterData = [{
        x: 10,
        y: 20
    }, {
        x: 15,
        y: 10
    }];*/
console.log('data ',scatterData);
    return {unitTitle, scatterData, chemicalData}
}

/**
 * You may use this function with both 2 or 3 interval colors for your gradient.
 * For example, you want to have a gradient between Bootstrap's danger-warning-success colors.
 */
function colorGradient(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
    var color1 = rgbColor1;
    var color2 = rgbColor2;
    var fade = fadeFraction;

    // Do we have 3 colors for the gradient? Need to adjust the params.
    if (rgbColor3) {
      fade = fade * 2;

      // Find which interval to use and adjust the fade percentage
      if (fade >= 1) {
        fade -= 1;
        color1 = rgbColor2;
        color2 = rgbColor3;
      }
    }

    var diffRed = color2.red - color1.red;
    var diffGreen = color2.green - color1.green;
    var diffBlue = color2.blue - color1.blue;

    var gradient = {
      red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
      green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
      blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
    };

    return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
  }

function displayScatterChart(scatterData, oneChemical, sheetName, instanceNo, unitTitle) {
console.log(scatterData);
    legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
    createCanvas(instanceNo);
    const convas = document.getElementById("chart" + instanceNo);
    convas.style.display = "block";
    instanceType[instanceNo] = 'Scatter';
    instanceSheet[instanceNo] = sheetName;
/*    var color1 = {
        red: 19, green: 233, blue: 19
      };
      var color2 = {
        red: 255, green: 255, blue: 0
      };
      var color3 = {
        red: 255, green: 0, blue: 0
      };*/
      var color1 = {
        red: 0, green: 255, blue: 0
      };
      var color2 = {
        red: 255, green: 0, blue: 0
      };

      allSamples = Object.keys(oneChemical);
      allConcs = Object.values(oneChemical);
//console.log(allConcs);
      minConc = Math.min(...allConcs);
      maxConc = Math.max(...allConcs);
//console.log(minConc,maxConc);
//console.log(oneChemical);
//      oneChemical = (oneChemical - minConc) / (maxConc - minConc);
      for (s in oneChemical) {
        oneChemical[s] = (oneChemical[s] - minConc) / (maxConc - minConc);
//console.log(oneChemical[s]);
      }
//console.log(oneChemical);
      
/*    // Extract sample names from the PSD data structure
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
    });*/
    // Chart configuration
    const chartConfig = {
        type: 'scatter',
        data: {
//            labels: sizes,
//            datasets: datasets,
//            datasets: scatterData,
                  datasets: [{
                    data: scatterData,
                    backgroundColor:
                       allSamples.map(sample => colorGradient(oneChemical[sample], color1, color2)),
                    pointRadius: 20
                  }]
        },
        options: {
            plugins: {
                title: {
                  display: true,
                  text: sheetName + ' ' + unitTitle
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
//                        type: 'logarithmic',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'mm'
                            }
                    },
                    y: {
//                        beginAtZero: true,
                        title: {
                            display: true,
                            text: unitTitle
                            }
                        }
                    },
/*            autocolors: {
                mode: 'label'
            }*/
        }
    };
console.log(chartConfig);
    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
    chartInstance[instanceNo] = new Chart(ctx, chartConfig);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);

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



function displayPSDChart(sizes, meas, sheetName, instanceNo, unitTitle) {
    legends[instanceNo] = false;
    ylinlog[instanceNo] = false;
    stacked[instanceNo] = false;
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

    const ctx = document.getElementById('chart' + instanceNo).getContext('2d');
    chartInstance[instanceNo] = new Chart(ctx, chartConfig);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);

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
    displayAnyChart(meas, allSamples,datasets,instanceNo,sheetName,unitTitle,false);
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
/*    // Initialize arrays to accumulate concentrations and labels for each sample
    let allConcentrations = [];
    let allChemicalLabels = [];
    for (const dateSampled in selectedSampleMeasurements) {
        for (const chemical in selectedSampleMeasurements[dateSampled]['PAH data'].chemicals) {
            const chemicalData = selectedSampleMeasurements[dateSampled]['PAH data'].chemicals[chemical].samples;

            // Initialize arrays to accumulate concentrations and labels for each sample
            allConcentrations[chemical] = [];
            allChemicalLabels[chemical] = [];

            // Iterate over each sample
            for (const sample in chemicalData) {
                const concentration = Object.values(chemicalData[sample]);
//                const chemicalLabel = Object.keys(chemicalData[sample]);

                // Accumulate concentrations and labels for the current sample
                allConcentrations[chemical].push(concentration);
//                allChemicalLabels.push(chemicalLabels);
            }

        }
    }
*/
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
/*            return {
                label: sample,
                data: data,
                borderWidth: 1,
                yAxisID: 'y',
            };*/
        });
        
    console.log("datasets ",datasets);
    
    const chartsForMapContainer = document.getElementById('chartsForMapContainer');
    for (sample in data) {
        const divId = `radar_${sample}`;
        const divContainer = document.createElement('div');
        divContainer.id = divId;
        divContainer.style = "width:250px; height:300px;"
        chartsForMapContainer.appendChild(divContainer);

//        const container = document.getElementById(divId);
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
/*                    ticks: {
                        display: true // Show the labels in the middle (numbers)
                    }*/
                }
            }
        });
    }
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
    chartInstance[instanceNo] = new Chart(ctx, stanGraph);
    createResetZoomButton(chartInstance[instanceNo], instanceNo);
    createToggleLegendButton(chartInstance[instanceNo], instanceNo);
    createToggleLinLogButton(chartInstance[instanceNo], instanceNo);
    createStackedButton(chartInstance[instanceNo], instanceNo);
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
//                        createHighlights(meas, dateSampled, sample, null);
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
        //chartInstance[instanceNo].updtae();
    });
    const xLabels = document.querySelectorAll('#chart' + instanceNo + '.chartjs-axis-x .chartjs-axis-label');
    xLabels.forEach((label, index) => {
        label.addEventListener('click', () => {
            console.log('about to toggle');
            toggleHighlightMapLocation(index);
        });
    });
//    legends[instanceNo] = false;
//    ctx.style.width = '10%'; // Set a small width
//    ctx.style.height = '10%'; // Set a small height    
}


function displayChemicalChart(meas, sheetName, instanceNo, unitTitle) {
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
    
console.log("datasets ",datasets);
    displayAnyChart(meas, allChemicals,datasets,instanceNo,sheetName,unitTitle,false);
    chartInstance[instanceNo].options.plugins.annotation.annotations = {};
    //chartInstance[instanceNo].resize(600,600);
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

function displayGorhamTest(sums, sheetName, instanceNo, unitTitle) {
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

    displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Gorham Test Protocol',unitTitle,true);

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
    const datasets = allRatios.map((ratio, index) => {
        const data = allSamples.map(sample => ratios[sample][ratio]); // Using the first concentration value for simplicity
        return {
            label: ratio,
            data: data,
            borderWidth: 1,
            yAxisID: 'y',
        };
    });
    displayAnyChart(ratios, allSamples, datasets, instanceNo, sheetName + ': Ratios', unitTitle,true);
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
    displayAnyChart(epaRatios, allSamples, datasets, instanceNo, sheetName + ': EPA Ratios', unitTitle,true);
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
    displayAnyChart(simpleRatios, allSamples, datasets, instanceNo, sheetName + ': Simple Ratios', unitTitle,);
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
    displayAnyChart(fractions, allSamples, datasets, instanceNo, sheetName + ' Ring Fractions', unitTitle,true);
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
    displayAnyChart(sums, samples,datasets,instanceNo,sheetName + ': Congener Sums',unitTitle,true);
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
//console.log('createHighlights',hoveredSample,dateSampled);
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
//console.log(hoveredSample);
    if (!dateSampled) {
        clickedSamples = findSamplesInSameLocation(hoveredSample);
        console.log('Not dateSampled',hoveredSample);
    } else {
        clickedSamples = [];
        clickedSamples[0] = dateSampled + ': ' + hoveredSample;
//        clickedSamples[0] = hoveredSample;
//console.log('dateSampled',dateSampled,hoveredSample);
    }
//console.log('clickedSamples',clickedSamples);
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
//console.log('clickedIndexes',clickedIndexes);
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



