completeSample = {};
function wrangleData(){
    completeSample = {};
    for (ds in selectedSampleInfo) {
        completeSample[ds] = {};
        for (sample in selectedSampleInfo[ds].position){
            completeSample[ds][sample] = true;
        }
    }
    for (ds in selectedSampleInfo) {
        for (ct in selectedSampleMeasurements[ds]) {
            if (ct === 'Physical Data') {
                for (sample in selectedSampleInfo[ds].position) {
                    if (selectedSampleMeasurements[ds][ct].samples[sample] === undefined) {
                        completeSample[ds][sample] = false;
                    }
                }
            } else {
                for (sample in selectedSampleInfo[ds].position) {
                    for (chemical in selectedSampleInfo[ds].chemicals){
                        for (sample in selectedSampleInfo[ds].chemicals[chemical]) {
                            if (selectedSampleMeasurements[ds][ct].chemicals[chemical].samples[sample] === undefined) {
                                completeSample[ds][sample] = false;
                            }
                        }
                    }
                }
            }
        }
    }
    selectedSamples = [];
    for (ds in selectedSampleInfo) {
        for (sample in selectedSampleInfo[ds].position){
            if (completeSample[ds][sample]) {
                selectedSamples.push(ds + ': ' + sample);
            }
        }
    }
//console.log(selectedSamples);
//console.log('old',selectedSampleMeasurements);
    selectedSampleMeasurements = getselectedSampleMeasurements(selectedSamples);
//console.log('new',selectedSampleMeasurements);
//console.log('old',selectedSampleInfo);
    selectedSampleInfo = getSelectedSamples(selectedSamples);
//console.log('new',selectedSampleInfo);
}

function recalculateConcentration(meas) {
    let allSizes = {};
    let allChemicals = Object.keys(meas);
    let areaWeightRatio = {};
    let concentrateFactor = {};
    for (dsSample in meas[allChemicals[0]]) {
        let parts = dsSample.split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        ds = parts[0];
        sample = parts[1];
        let ptsSizes = [];
        if (allSizes[ds] == undefined || allSizes[ds] == null) {
            ptsSizes = selectedSampleMeasurements[ds]['Physical Data'].sizes;
            ptsSizes = ptsSizes.map(phiSize => Math.pow(2, -phiSize)/1000);
            allSizes[ds] = ptsSizes;
            concentrateFactor[ds] = {};
        }
        ptsSizes = allSizes[ds];
//console.log('PTSSIZES',ptsSizes);
        for (i=0;i<ptsSizes.length;i++) {
            if (ptsSizes[i] < resuspensionSize) {
                cumWeight = selectedSampleMeasurements[ds]['Physical Data'].samples[sample].cumWeights[i];
                cumArea = selectedSampleMeasurements[ds]['Physical Data'].samples[sample].cumAreas[i];
                concentrateFactor[ds][sample] = cumArea / cumWeight;
                break;
            }
        }
    }
    let concentrateMeas = {};
    for (chemical in meas) {
        concentrateMeas[chemical] = {};
        for (dsSample in meas[chemical]) {
            let parts = dsSample.split(": ");
            if (parts.length>2) {
                parts[1] = parts[1] + ': ' + parts[2];
            }
            ds = parts[0];
            sample = parts[1];
            concentrateMeas[chemical][dsSample] = concentrateFactor[ds][sample] * meas[chemical][dsSample];
        }
    }
    return {concentrateMeas, concentrateFactor}
}

function recalculateConcentrationComplex(meas) {
    let allSizes = {};
    let concentrateFactor = {};
    for (dsSample in meas) {
        let parts = dsSample.split(": ");
        if (parts.length>2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        ds = parts[0];
        sample = parts[1];
        let ptsSizes = [];
        if (allSizes[ds] == undefined || allSizes[ds] == null) {
//console.log(ds,sample);
            ptsSizes = selectedSampleMeasurements[ds]['Physical Data'].sizes;
            ptsSizes = ptsSizes.map(phiSize => Math.pow(2, -phiSize)/1000);
            allSizes[ds] = ptsSizes;
            concentrateFactor[ds] = {};
        }
        ptsSizes = allSizes[ds];
//console.log('PTSSIZES',ptsSizes);
        for (i=0;i<ptsSizes.length;i++) {
            if (ptsSizes[i] < resuspensionSize) {
                cumWeight = selectedSampleMeasurements[ds]['Physical Data'].samples[sample].cumWeights[i];
                cumArea = selectedSampleMeasurements[ds]['Physical Data'].samples[sample].cumAreas[i];
                concentrateFactor[ds][sample] = cumArea / cumWeight;
                break;
            }
        }
    }
    let concentrateMeas = {};
    for (dsSample in meas) {
        concentrateMeas[dsSample] = {};
            let parts = dsSample.split(": ");
            if (parts.length>2) {
                parts[1] = parts[1] + ': ' + parts[2];
            }
            ds = parts[0];
            sample = parts[1];
            for (bit in meas[dsSample]) {
                concentrateMeas[dsSample][bit] = concentrateFactor[ds][sample] * meas[dsSample][bit];
        }
    }
//console.log(concentrateMeas,concentrateFactor);
    return {concentrateMeas, concentrateFactor}
}

function dataForCharting(sheetName) {
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let ct = sheetName;
    let unitTitle = blankSheets[ct]['Unit of measurement'];
    let measChart = {};
//srg250308    datesSampled.sort();
    datesSampled.forEach(ds => {
        if (ct in selectedSampleMeasurements[ds]) {
            //        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null )) {
/*        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
            (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals)))) {*/
            for (const c in selectedSampleMeasurements[ds][ct].chemicals) {
                if (measChart[c] == undefined || measChart[c] == null) {
                    measChart[c] = {};
                }
                let allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308                allSamples.sort();
//console.log(ds);
//srg250308                allSamples.sortSamples(ds, 'totalArea');
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
                let allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308                allSamples.sort();
                allSamples.forEach(s => {
                    measChart[c][ds + ': ' + s] = 0.0;
                });
            }
        }
    });
    unitTitle = blankSheets[ct]['Unit of measurement'];
//console.log(sheetName,measChart);
//    if (!(xAxisSort === 'normal')) {
        measChart = measChartSort(measChart);
//    }
//console.log(measChart);
    return { unitTitle, measChart }
}

function measChartSort(measChart) {
    let sortedChart = {};
    let allChemicals = Object.keys(measChart);
    let allSamples = Object.keys(measChart[allChemicals[0]]);
//console.log(allChemicals);
//console.log(allSamples);
    allSamples.sortComplexSamples();
//console.log(allSamples);
    for (c in measChart) {
        sortedChart[c] = {};
        allSamples.forEach(sample => {
            sortedChart[c][sample] = measChart[c][sample];
        });
    }
    return sortedChart
}

function propertyChartSort(measChart) {
    let allSamples = Object.keys(measChart);
//console.log(allSamples);
    allSamples.sortComplexSamples();
//console.log(allSamples);
    let sortedChart = {};
        allSamples.forEach(sample => {
            sortedChart[sample] = measChart[sample];
        });
    return sortedChart
}

function dataForPSDCharting(sheetName) {
    let  datesSampled = Object.keys(selectedSampleMeasurements);
    let ct = sheetName;
//console.log('dataForPSD ',ct,blankSheets);
    let unitTitle = blankSheets[ct]['Unit of measurement'];
    let measChart = {};
    let measChartArea = {};
    let measChartRelativeArea = {};
    let ptsSizes = null;
    let ptsAreas = null;
    let ptsVolumes = null;
    let splitWeights = {};
    let splitAreas = {};
    let splitRelativeAreas = {};
    let cumWeights = {};
    let cumAreas = {};
//srg250308    datesSampled.sort();
       datesSampled.forEach (ds => {
console.log(ds);
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null)) {
            ptsSizes = selectedSampleMeasurements[ds][ct].sizes;
            ptsSizes = ptsSizes.map(phiSize => Math.pow(2, -phiSize)/1000);
            ptsAreas = ptsSizes.map(size => (Math.PI * size * size) / 4);
            ptsVolumes = ptsSizes.map(size => (Math.PI * size * size * size) / 6);
        for (const s in selectedSampleMeasurements[ds][ct].samples) {
                currentPsd = selectedSampleMeasurements[ds][ct].samples[s].psd;
                measChart[ds + ': ' + s] =  currentPsd;
//                measChart[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].psd;
                measChartArea[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].psdAreas;
                measChartRelativeArea[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].psdRelativeAreas;
                splitWeights[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].splitWeights;
                splitAreas[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].splitAreas;
                splitRelativeAreas[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].splitRelativeAreas;
                cumWeights[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].cumWeights;
                cumAreas[ds + ': ' + s] =  selectedSampleMeasurements[ds][ct].samples[s].cumAreas;
//console.log(sizes.length);
/*                totalArea = 0;
                for (i=0;i<ptsSizes.length;i++) {
                    currentArea = ptsAreas[i] * currentPsd[i] / ptsVolumes[i];
                    areas[i] = currentArea;
                    totalArea += currentArea;
                }
                measChartArea[ds + ': ' + s + ' : ' + totalArea] = areas;
                splitWeights[ds + ': ' + s] = psdSplit(currentPsd);
                splitAreas[ds + ': ' + s] = psdSplit(areas);*/
//console.log(ds + ': ' + s, totalArea);
            }
        } else {
            for (const s in selectedSampleInfo[ds].position) {
                measChart[ds + ': ' + s] = new Array(42).fill(0.0);
                measChartArea[ds + ': ' + s] = new Array(42).fill(0.0);
            }
        }
    });
//console.log('dataforPSD ', unitTitle,ptsSizes,ptsAreas,ptsVolumes,measChart,measChartArea);
    let allSamples = Object.keys(measChart);
//    if (!(xAxisSort === 'normal')) {
        allSamples.sortComplexSamples();
//    }
    return {unitTitle, ptsSizes, measChart, measChartArea, measChartRelativeArea, splitWeights, splitAreas, splitRelativeAreas, cumWeights, cumAreas, allSamples}
}

function ameasChartSort(measChart) {
    let sortedChart = {};
    let allChemicals = Object.keys(measChart);
    let allSamples = Object.keys(measChart[allChemicals[0]]);
//console.log(allChemicals);
//console.log(allSamples);
    allSamples.sortComplexSamples();
    for (c in measChart) {
        sortedChart[c] = {};
        allSamples.forEach(sample => {
            sortedChart[c][sample] = measChart[c][sample];
        });
    }
    return sortedChart
}



function dataForScatterCharting(sheetName) {
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let ct = sheetName;
    let unitTitle = blankSheets[ct]['Unit of measurement'];
    let scatterData = [];
    let chemicalData = {};
    i = 0;
    datesSampled.forEach (ds => {

        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
            (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {        
            let allChemicals = Object.keys(selectedSampleMeasurements[ds][ct].chemicals);
            for (const s in selectedSampleMeasurements[ds][ct].chemicals[allChemicals[0]].samples) {
                scatterData[i] = ({
//                scatterData[ds + ' : ' + s] = ({
                    x: sampleInfo[ds].position[s]['Position longitude'],
                    y: sampleInfo[ds].position[s]['Position latitude'],
                    label: selectedSampleInfo[ds].label + ': ' + selectedSampleInfo[ds].position[s].label,
                });
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
                    chemicalData[c][ds + ': ' + s] = currentChemical.samples[s];
                    //console.log(currentChemical.samples[s])
                }
            }
        }
    });

//console.log('data ',sheetName,scatterData);
    return {unitTitle, scatterData, chemicalData}
}

function dataForTotalScatterCharting(sheetName, chartType) {
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let ct = sheetName;
    let unitTitle = blankSheets[ct]['Unit of measurement'];
    let scatterData = {};
    let chemicalData = {};
    let fitConcentration = {};
    let fitPredictors = {};

    let j = -1;
    datesSampled.forEach(ds => {
        //        scatterData[ds] = {};
        if (ct in selectedSampleMeasurements[ds]) {
            j += 1;
            let allChemicals = Object.keys(selectedSampleMeasurements[ds][ct].chemicals);
            for (const c in selectedSampleMeasurements[ds][ct].chemicals) {
                let i = 0;

                if (!(scatterData[c])) {
                    scatterData[c] = [];
//scatterData[c].pointStyle = 'rect';
                }
                scatterData[c][j] = {};
                scatterData[c][j].data = [];
                scatterData[c][j].label = ds;
//console.log('scatterData', c, j, scatterData[c][j]);
                if (chemicalData[c] == undefined || chemicalData[c] == null) chemicalData[c] = [];
                if (fitConcentration[c] == undefined || fitPredictors[c] == null) {
                    fitConcentration[c] = {};
                    fitPredictors[c] = {};
                }
//console.log('scatterData', c, j, scatterData[c][j]);
                let currentChemical = selectedSampleMeasurements[ds][ct].chemicals[c];
                let ii = 0;
                for (const s in currentChemical.samples) {
                    //console.log(ds,c,s);
                    //let xValue;
                    switch (chartType) {
                        case "totalArea":
                            console.log(ds,s);
                            xValue = sampleMeasurements[ds]['Physical Data'].samples[s].totalArea;
                            break;

                        case "totalHC":
                            xValue = sampleMeasurements[ds]['PAH data'].totalHC[s];
                            break;

                        case "totalSolids":
                            xValue = sampleMeasurements[ds]['Physical Data'].samples[s]['Total solids (% total sediment)'];
                            break;

                        case "organicCarbon":
                            xValue = sampleMeasurements[ds]['Physical Data'].samples[s]['Organic matter (total organic carbon)'];
                            break;

                        default:
                            console.error(`Unknown chart type: ${chartType}`);
                            return;
                    }
                    scatterData[c][j].data[ii] = {
                        x: Number(xValue),
                        y: currentChemical.samples[s],
                        label: selectedSampleInfo[ds].label + ': ' + selectedSampleInfo[ds].position[s].label,
                    };
//console.log(xValue);
                    ii += 1;
                    if (!xValue) {
// reverted to 250502 version of test not sure why?                   if (!(typeof xValue === "number")) {
//console.log(i, ii, j, ds, c, s);
                        console.log('Total scatter charting not possible for ', chartType, ' as no data available', ds, s, ii, xValue);
//console.log(xValue);
                        unitTitle = 'No data';
                        return { unitTitle };
                    }
                    chemicalData[c][i] = currentChemical.samples[s];
                    fitConcentration[c][ds + ': ' + s] = currentChemical.samples[s];
                    fitPredictors[c][ds + ': ' + s] = [xValue];
                    i += 1;
                }
            }
        }
    });
//console.log('scatterData here', scatterData);
    for (const c in scatterData) {
        // Need to remove empty items
        scatterData[c] = scatterData[c].filter(item => item.data && item.data.length > 0);
//console.log('scatterData a', c, scatterData[c], scatterData[c].length);
        minConc = Math.min(...chemicalData[c]);
        maxConc = Math.max(...chemicalData[c]);
//console.log('minConc', minConc, 'maxConc', maxConc);
        for (let i = 0; i < scatterData[c].length; i++) {
//console.log('scatterData', c, i);
//console.log('scatterData', scatterData[c][i].data.length);
            for (let j = 0; j < scatterData[c][i].data.length; j++) {
//console.log('scatterData', c, i, j, scatterData[c][i].data[j]);
                scaledValue = (scatterData[c][i].data[j].y - minConc) / (maxConc - minConc);
                scatterData[c][i].data[j].pointBackgroundColor = heatmapColor(scaledValue);
                scatterData[c][i].data[j].pointBorderColor = heatmapColor(scaledValue);
                //                scatterData[c][i].data[j].pointRadius: function(context) { return convas.width / 70 }
            }
            scatterData[c][i].backgroundColor = null;
            scatterData[c][i].borderColor = null;
        }
//console.log('scatterData b', c, scatterData[c], scatterData[c].length);
    }
    // Return the result based on the chart type requirements
    //    if (chartType === "totalHC") {
    //        return { unitTitle, scatterData, chemicalData };
    //    } else {
//console.log('scatterData', scatterData);
    return { unitTitle, scatterData, chemicalData, fitConcentration, fitPredictors };
    //    }
}

function sumsForCongenerCharting() {
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let measChart = {};
//			for (const ds in selected) {
//srg250308    datesSampled.sort();
       datesSampled.forEach (ds => {
//        if (!(selectedSampleMeasurements[ds]['PCB data'] == undefined || selectedSampleMeasurements[ds]['PCB data'] == null)) {
testOne = selectedSampleMeasurements[ds];
        if ('PCB data' in selectedSampleMeasurements[ds]) {
//					for (const s in selected[ds]['PCB data'].congenerTest) {
//            for (const s in selectedSampleInfo[ds].position) {
                const allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308                allSamples.sort();
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
//srg250308    allSamples.sort();
    allSamples.forEach(s => {
                measChart[ds + ': ' + s] = { All : 0.0, ICES7 : 0.0};
            });
        }
    });
//console.log(measChart);
//    if (!(xAxisSort === 'normal')) {
        measChart = propertyChartSort(measChart);
//console.log(measChart);
//    }
    return measChart
}

function sumsForGorhamCharting() {
    ct = 'PAH data';
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let measChart = {};
//srg250308    datesSampled.sort();
    datesSampled.forEach(ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
            (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
            const allChemicals = Object.keys(selectedSampleMeasurements[ds]['PAH data'].chemicals);
//console.log(allChemicals);
            const allSamples = Object.keys(selectedSampleMeasurements[ds]['PAH data'].chemicals[allChemicals[0]].samples);
//console.log(allSamples);
//srg250308            allSamples.sort();
//            allSamples.sort((a, b) => selectedSampleInfo[ds].position[a]['Position latitude'] - selectedSampleInfo[ds].position[b]['Position latitude']);
//srg250308     allSamples.sortSamples(ds,'totalArea');
//console.log(allSamples);
            allSamples.forEach(s => {
                if (selectedSampleMeasurements[ds]['PAH data'].gorhamTest[s] == undefined || selectedSampleMeasurements[ds]['PAH data'].gorhamTest[s] == null) {
                    measChart[ds + ': ' + s] = { hmwSum: 0.0, lmwSum: 0.0 };
                } else {
                    measChart[ds + ': ' + s] = selectedSampleMeasurements[ds]['PAH data'].gorhamTest[s];
                }
            });
        } else {
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
            allSamples.forEach(s => {
                measChart[ds + ': ' + s] = { hmwSum: 0.0, lmwSum: 0.0 };
            });
        }
    });
//console.log(measChart);
//    if (!(xAxisSort === 'normal')) {
        measChart = propertyChartSort(measChart);
//console.log(measChart);
//    }
    return measChart
}

function sumsForTotalHCCharting() {
    ct = 'PAH data';
    let datesSampled = Object.keys(selectedSampleMeasurements);
    unitTitle = blankSheets[ct]['totalHCUnit'];
    let measChart = {};
    sampleNo = -1;
//srg250308    datesSampled.sort();
    datesSampled.forEach(ds => {
        const allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308        allSamples.sort();
    if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
        (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
//console.log(ds,allSamples);
            allSamples.forEach(s => {
                if (s in selectedSampleMeasurements[ds]['PAH data'].totalHC) {
                        measChart[ds + ': ' + s] = {totalHC: selectedSampleMeasurements[ds]['PAH data'].totalHC[s]};
                } else {
                    measChart[ds + ': ' + s] = {totalHC: 0.0};
                }
                sampleNo += 1;
                //console.log(sampleNo,ds,s);
            });
        } else {
            allSamples.forEach(s => {
                measChart[ds + ': ' + s] = {totalHC: 0.0};
                sampleNo += 1;
//                console.log(sampleNo, ds, s);
            });
        }
    if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
        (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
        allSamples.forEach(s => {
                if (!(selectedSampleMeasurements[ds]['PAH data'].total[s] == undefined || selectedSampleMeasurements[ds]['PAH data'].total[s] == null)) {
                    measChart[ds + ': ' + s].fractionPAH = selectedSampleMeasurements[ds]['PAH data'].total[s] / 1000;
                } else {
                    measChart[ds + ': ' + s].fractionPAH = 0.0;
                }
                sampleNo += 1;
                //console.log(sampleNo,ds,s);
            });
        } else {
            allSamples.forEach(s => {
                measChart[ds + ': ' + s].fractionPAH = 0.0;
                sampleNo += 1;
//                console.log(sampleNo, ds, s);
            });
        }
    });
//console.log(measChart);
//console.log(xAxisSort);
//    if (!(xAxisSort === 'normal')) {
//console.log(measChart);
        measChart = propertyChartSort(measChart);
//console.log(Object.keys(measChart));
//    }
//console.log(measChart);
    return { unitTitle, measChart }
}

function ratiosForPAHs() {
    ct = 'PAH data';
    const datesSampled = Object.keys(selectedSampleMeasurements);
    unitTitle = 'Ratio';
    measChart = {};
    sampleNo = -1;
//srg250308    datesSampled.sort();
    datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
            (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
            const ratios = sampleMeasurements[ds]['PAH data'].ratios;
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
            allSamples.forEach(s => {
                measChart[ds + ': ' + s] = ratios[s];
                sampleNo += 1;
    //console.log(sampleNo,ds,s);
            });
        } else {
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
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
//if (!(xAxisSort === 'normal')) {
    measChart = propertyChartSort(measChart);
//}
return {unitTitle, measChart}
}

function simpleRatiosForPAHs() {
    ct = 'PAH data';
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let unitTitle = 'Ratio';
    let measChart = {};
    let sampleNo = -1;
//srg250308    datesSampled.sort();
    datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
            (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
            let simpleRatios = sampleMeasurements[ds]['PAH data'].simpleRatios;
            let allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
            allSamples.forEach(s => {
                measChart[ds + ': ' + s] = simpleRatios[s];
                sampleNo += 1;
//console.log(sampleNo,ds,s);
            });
        } else {
            const allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
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
//if (!(xAxisSort === 'normal')) {
    measChart = propertyChartSort(measChart);
//}
return {unitTitle, measChart}
}

function epaRatiosForPAHs() {
    ct = 'PAH data';
        let datesSampled = Object.keys(selectedSampleMeasurements);
        let unitTitle = 'Fraction';
        let measChart = {};
        let sampleNo = -1;
//srg250308        datesSampled.sort();
        datesSampled.forEach (ds => {
            if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
                (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
                let ringSums = sampleMeasurements[ds]['PAH data'].ringSums;
                let allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308                allSamples.sort();
                allSamples.forEach(s => {
                    let  rs = ringSums[s];
                    let  total = rs['Total EPA PAHs'];
                    let  m = {};
                    m['LPAHs/Total'] = rs['LPAHs'] / total;
                    m['HPAHs/Total'] = rs['HPAHs'] / total;
                    measChart[ds + ': ' + s] = m;
                    sampleNo += 1;
        //console.log(sampleNo,ds,s);
                });
            } else {
                let  allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308                allSamples.sort();
                allSamples.forEach(s => {
                    const m = {};
                    m['LPAHs/Total'] = 0.0;
                    m['HPAHs/Total'] = 0.0;
                    measChart[ds + ': ' + s] = m;
                    sampleNo += 1;
//    console.log(sampleNo,ds,s);
                });
            }
        });
//console.log('ratios',measChart);
//if (!(xAxisSort === 'normal')) {
    measChart = propertyChartSort(measChart);
//}
    return {unitTitle, measChart}
    }

function ringFractionsForPAHs() {
    ct = 'PAH data';
    let datesSampled = Object.keys(selectedSampleMeasurements);
    let unitTitle = 'Fraction per ring size';
    let measChart = {};
    let sampleNo = -1;
//srg250308    datesSampled.sort();
    datesSampled.forEach (ds => {
        if (!(selectedSampleMeasurements[ds][ct] == undefined || selectedSampleMeasurements[ds][ct] == null ||
            (ct === 'PAH data' && !('Acenapthene' in selectedSampleMeasurements[ds][ct].chemicals) ) )) {
            let  ringSums = sampleMeasurements[ds]['PAH data'].ringSums;
            let  allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
            allSamples.forEach(s => {
                let  rs = ringSums[s];
                let  total = rs['Total all rings'];
                let  m = {};
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
            let allSamples = Object.keys(selectedSampleInfo[ds].position);
//srg250308            allSamples.sort();
            allSamples.forEach(s => {
                let  m = {};
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
//if (!(xAxisSort === 'normal')) {
    measChart = propertyChartSort(measChart);
//}
return {unitTitle, measChart}
}

