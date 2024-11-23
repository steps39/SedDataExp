// Extend the Array prototype to include a custom sortSamples method
Array.prototype.sortSamples = function(ds) {
    // Use the built-in sort method on the array
    return this.sort((a, b) => {

        // Sorting by latitude
        if (xAxisSort === 'latitude') {
            const latitudeA = selectedSampleInfo[ds].position[a]['Position latitude'];
            const latitudeB = selectedSampleInfo[ds].position[b]['Position latitude'];
            return latitudeA - latitudeB;
        }
        
        // Sorting by longitude
        if (xAxisSort === 'longitude') {
            const latitudeA = selectedSampleInfo[ds].position[a]['Position longitude'];
            const latitudeB = selectedSampleInfo[ds].position[b]['Position longitude'];
            return latitudeA - latitudeB;
        }
        
        // Sorting by totalArea
        if (xAxisSort === 'totalarea') {
            const totalAreaA = selectedSampleMeasurements[ds]['Physical Data'].samples[a].totalArea;
            const totalAreaB = selectedSampleMeasurements[ds]['Physical Data'].samples[b].totalArea;
            return totalAreaA - totalAreaB;
        }


        // Default case if no valid sort key is provided
        return 0;
    });
};

// Extend the Array prototype to include a custom sortSamples method
Array.prototype.sortComplexSamples = function() {
    // Use the built-in sort method on the array

    return this.sort((a, b) => {
//console.log(a,b);
        const partsA = a.split(": ");
        const partsB = b.split(": ");
        selectedSampleInfo[partsA[0]].position[partsA[1]]
//console.log(partsA);
//console.log(partsB);
        // Sorting by latitude
        if (xAxisSort === 'latitude') {
            const valueA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position latitude'];
            const valueB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position latitude'];
            return valueA - valueB;
        }
        
        // Sorting by longitude
        if (xAxisSort === 'longitude') {
            const valueA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position longitude'];
            const valueB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position longitude'];
            return valueA - valueB;
        }
        
        // Sorting by totalArea
        if (xAxisSort === 'totalarea') {
            const valueA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].totalArea;
            const valueB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].totalArea;
            return valueA - valueB;
        }

        // Sorting by totalHC
        if (xAxisSort === 'totalhcsort') {
            const valueA = selectedSampleMeasurements[partsA[0]]['PAH data'].totalHC[partsA[1]];
            const valueB = selectedSampleMeasurements[partsB[0]]['PAH data'].totalHC[partsB[1]];
            return valueA - valueB;
        }

        // Sorting by LMW
        if (xAxisSort === 'lmw') {
            const valueA = selectedSampleMeasurements[partsA[0]]['PAH data'].gorhamTest[partsA[1]].lmwSum;
            const valueB = selectedSampleMeasurements[partsB[0]]['PAH data'].gorhamTest[partsB[1]].lmwSum;
            return valueA - valueB;
        }

        // Sorting by HMW
        if (xAxisSort === 'hmw') {
            const valueA = selectedSampleMeasurements[partsA[0]]['PAH data'].gorhamTest[partsA[1]].hmwSum;
            const valueB = selectedSampleMeasurements[partsB[0]]['PAH data'].gorhamTest[partsB[1]].hmwSum;
            return valueA - valueB;
        }

        // Sorting by ICES7
        if (xAxisSort === 'ices7') {
            const valueA = selectedSampleMeasurements[partsA[0]]['PCB data'].congenerTest[partsA[1]].ICES7;
            const valueB = selectedSampleMeasurements[partsB[0]]['PCB data'].congenerTest[partsB[1]].ICES7;
            return valueA - valueB;
        }

        // Sorting by All PCBs
        if (xAxisSort === 'allpcbs') {
            const valueA = selectedSampleMeasurements[partsA[0]]['PCB data'].congenerTest[partsA[1]].All;
            const valueB = selectedSampleMeasurements[partsB[0]]['PCB data'].congenerTest[partsB[1]].All;
            return valueA - valueB;
        }

        // Sorting by gravel
        if (xAxisSort === 'gravel') {
            const valueA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights['Gravel'];
            const valueB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights['Gravel'];
            return valueA - valueB;
        }

        // Sorting by silt
        if (xAxisSort === 'silt') {
            const valueA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights['Silt And Clay'];
            const valueB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights['Silt And Clay'];
            return valueA - valueB;
        }

        // Sorting by sand
        if (xAxisSort === 'sand') {
            const splitWeightsA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights;
            const splitWeightsB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights;
            const valueA = splitWeightsA['Fine And Very Fine Sand'] + splitWeightsA['Medium Sand'] + 
                          splitWeightsA['Very Coarse And Coarse Sand'];
            const valueB = splitWeightsB['Fine And Very Fine Sand'] + splitWeightsB['Medium Sand'] + 
                          splitWeightsB['Very Coarse And Coarse Sand'];
                          return valueA - valueB;
                        }

        // Sorting by sand
        if (xAxisSort === 'slitsand') {
            const splitWeightsA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights;
            const splitWeightsB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights;
            const valueA = splitWeightsA['Fine And Very Fine Sand'] + splitWeightsA['Medium Sand'] + 
                          splitWeightsA['Very Coarse And Coarse Sand'] + splitWeightsA['Silt And Clay'];
            const valueB = splitWeightsB['Fine And Very Fine Sand'] + splitWeightsB['Medium Sand'] + 
                          splitWeightsB['Very Coarse And Coarse Sand'] + splitWeightsB['Silt And Clay'];
            return valueA - valueB;
        }

        // Sorting by datelatitude
        if (xAxisSort === 'datelatitude') {
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position latitude'];
                const valueB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position latitude'];
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }
        
        // Sorting by datelongitude
        if (xAxisSort === 'datelongitude') {
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position longitude'];
                const valueB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position longitude'];
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }

        // Sorting by datetototalarea
        if (xAxisSort === 'datetotalarea') {
console.log('datetotalarea');
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].totalArea;
                const valueB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].totalArea;
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }

        // Sorting by datelmw
        if (xAxisSort === 'datelmw') {
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleMeasurements[partsA[0]]['PAH data'].gorhamTest[partsA[1]].lmwSum;
                const valueB = selectedSampleMeasurements[partsB[0]]['PAH data'].gorhamTest[partsB[1]].lmwSum;
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }
        
        // Sorting by datehmw
        if (xAxisSort === 'datehmw') {
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleMeasurements[partsA[0]]['PAH data'].gorhamTest[partsA[1]].hmwSum;
                const valueB = selectedSampleMeasurements[partsB[0]]['PAH data'].gorhamTest[partsB[1]].hmwSum;
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }
        
        // Sorting by dateices7
        if (xAxisSort === 'dateices7') {
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleMeasurements[partsA[0]]['PCB data'].congenerTest[partsA[1]].ICES7;
                const valueB = selectedSampleMeasurements[partsB[0]]['PCB data'].congenerTest[partsB[1]].ICES7;
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }
        
        // Sorting by dateallpcbs
        if (xAxisSort === 'dateallpcbs') {
            if (partsA[0] === partsB[0]) {
                const valueA = selectedSampleMeasurements[partsA[0]]['PCB data'].congenerTest[partsA[1]].All;
                const valueB = selectedSampleMeasurements[partsB[0]]['PCB data'].congenerTest[partsB[1]].All;
                return valueA - valueB;
            } else {
                if (partsA[0] > partsB[0]) {
                    return 1
                } else {
                    return -1
                }
            }
        }
        
        // Default case if no valid sort key is provided
        return 0;
    });
};

// Define ranges for different materials
let ranges = {
    'Gravel': [0, 9],
    'Very Coarse And Coarse Sand': [10, 13],
    'Medium Sand': [14, 15],
    'Fine And Very Fine Sand': [16, 19],
    'Silt And Clay': [20, 40]
    // Ignore < 0.4um particles
  };

// Function to calculate sum of a range
function sumInRange(psd, range) {
    let sum = 0;
    for (let i = range[0]; i <= range[1]; i++) {
        if (i < psd.length) {
            sum += psd[i];
        }
    }
    return sum;
}

function psdSplit(psd) {
    let split = {};
    // Calculate sums for each category
    split['Silt And Clay'] = sumInRange(psd, ranges['Silt And Clay']);
    split['Fine And Very Fine Sand'] = sumInRange(psd, ranges['Fine And Very Fine Sand']);
    split['Medium Sand'] = sumInRange(psd, ranges['Medium Sand']);
    split['Very Coarse And Coarse Sand'] = sumInRange(psd, ranges['Very Coarse And Coarse Sand']);
    split['Gravel'] = sumInRange(psd, ranges['Gravel']);
    return split
}

function psdPostProcess(currentPsd, sizes) {
    ptsSizes = null;
    ptsAreas = null;
    ptsVolumes = null;
    splitWeights = {};
    splitAreas = {};
    // Ignore < 0.4um particles
    sizes = sizes.slice(0,-1);
//console.log(sizes);
    //Sizes are in mm so convert to SI
    ptsSizes = sizes.map(phiSize => Math.pow(2, -phiSize)/1000);
    ptsAreas = ptsSizes.map(size => Math.PI * size * size);
    ptsVolumes = ptsSizes.map(size => (Math.PI * size * size * size) / 6);
//console.log(ptsSizes,ptsAreas,ptsVolumes);
    areas = [];
    totalArea = 0;
    cumAreas = [];
    cumWeights = [];
    relativeAreas = [];
    for (i = 0; i < ptsSizes.length; i++) {
        //                    noPts = currentPsd[i] / volumes[i];
        // Divide by 100 as psd in weight %
        // Divide by 1000 as 1kg is 1000th of tonne which is 1m^3 with density of 1
        currentArea = (ptsAreas[i] * currentPsd[i]) / (ptsVolumes[i] * 100 * 1000);
        areas[i] = currentArea;
        totalArea += currentArea;
        cumAreas[i] = 0;
        cumWeights[i] = 0;
        relativeAreas[i] = 0;
    }
//    cumAreas = Array(areas.length);
    previousCumArea = 0;
//    cumWeights = Array(areas.length);
    previousCumWeight = 0;
    for (i = ptsSizes.length-1; i > -1; i--) {
        relativeAreas[i] = areas[i]*100/totalArea;
        cumAreas[i] = previousCumArea + relativeAreas[i];
        previousCumArea = cumAreas[i];
        cumWeights[i] = previousCumWeight + currentPsd[i];
        previousCumWeight = cumWeights[i];
    }
    splitWeights = psdSplit(currentPsd);
    splitAreas = psdSplit(areas);
    splitRelativeAreas = psdSplit(relativeAreas);
//console.log( areas, relativeAreas, splitWeights, splitAreas, splitRelativeAreas, cumAreas, cumWeights, totalArea );
    return { areas, relativeAreas, splitWeights, splitAreas, splitRelativeAreas, cumAreas, cumWeights, totalArea }
}

function pcbPostProcess(newMeas,dateSampled) {
    sheetName = 'PCB data';
//console.log(newMeas);
    mmeas = newMeas;
    sums = {};
    const ICES7 = ["2,2',5,5'-Tetrachlorobiphenyl", "2,4,4'-Trichlorobiphenyl", "2,2',3,4,4',5,5'-Heptachlorobiphenyl",
        "2,2',4,4',5,5'-Hexachlorobiphenyl", "2,2',3,4,4',5'-Hexachlorobiphenyl",
        "2,3',4,4',5-Pentachlorobiphenyl", "2,2',4,5,5'-Pentachlorobiphenyl"];
//console.log(mmeas);
    for (const chemical in mmeas.chemicals) {
        for (const sample in mmeas.chemicals[chemical].samples) {
            //console.log(chemical,sample);
            if (!sums[sample]) {
                sums[sample] = {
                    ICES7: 0,
                    All: 0
                };
            }
//            console.log(chemical,sample);
//            console.log(mmeas.chemicals[chemical].samples[sample]);
            //	                        const congenerConcentration = meas.chemicals[chemical].samples[sample].reduce((acc, val) => acc + val, 0);
            const congenerConcentration = mmeas.chemicals[chemical].samples[sample] || 0;
            if (ICES7.includes(chemical)) {
                sums[sample].ICES7 += congenerConcentration;
            }
            sums[sample].All += congenerConcentration;
        }
    }
    sampleMeasurements[dateSampled][sheetName].congenerTest = sums;
}

function pahPostProcess(newMeas,dateSampled) {
    sheetName = 'PAH data';
    const chemicals = sampleMeasurements[dateSampled][sheetName].chemicals;
    if ('Acenapthene' in chemicals) {
        //If totalHC not read then set to zero
        if (!('totalHC' in sampleMeasurements[dateSampled][sheetName])) {
            thc = {};
//            sampleMeasurements[dateSampled][sheetName].totalHC = [];
            for(sample in sampleMeasurements[dateSampled][sheetName].chemicals['Acenapthene'].samples) {
                thc[sample] = 0.0;
//                totalHC[sample] = 0.0;
            }
            sampleMeasurements[dateSampled][sheetName].totalHC = thc;
        }

//        mmeas = newMeas[sheetName];
        mmeas = newMeas;
        sums = {};
        // Goring Test protocol here, but results stored by sample
        const lmw = ['Acenaphthene', 'Acenaphthylene', 'Anthracene', 'Fluorene', 'C1-Naphthalenes', 'Naphthalene', 'Phenanthrene'];
        const hmw = ['Benz[a]anthracene', 'Benzo[a]pyrene', 'Chrysene', 'Dibenz[a,h]anthracene', 'Fluoranthene', 'Pyrene'];

        for (const chemical in mmeas.chemicals) {
            for (const sample in mmeas.chemicals[chemical].samples) {
                //console.log(chemical,sample);
                if (!sums[sample]) {
                    sums[sample] = {
                        lmwSum: 0,
                        hmwSum: 0
                    };
                }
                //console.log(meas[chemical][sample]);
                if (lmw.includes(chemical)) {
                    const lmwConcentrationSum = mmeas.chemicals[chemical].samples[sample] || 0;
                    sums[sample].lmwSum += lmwConcentrationSum;
                } else if (hmw.includes(chemical)) {
                    const hmwConcentrationSum = mmeas.chemicals[chemical].samples[sample] || 0;
                    sums[sample].hmwSum += hmwConcentrationSum;
                }
            }
        }
        sampleMeasurements[dateSampled][sheetName].gorhamTest = sums;
//        const chemicals = sampleMeasurements[dateSampled][sheetName].chemicals;
        sampleMeasurements[dateSampled][sheetName].ratios = {};
        sampleMeasurements[dateSampled][sheetName].ringSums = {};
        sampleMeasurements[dateSampled][sheetName].simpleRatios = {};
        const allSamples = Object.keys(sampleInfo[dateSampled].position);
        allSamples.sort();
        allSamples.forEach(s => {
            const ace = chemicals['Acenapthene'].samples[s];//3
            const aceph = chemicals['Acenapthylene'].samples[s];//3
            const anth = chemicals['Anthracene'].samples[s];//3//Ant
            const baa = chemicals['Benz[a]anthracene'].samples[s];//4
            const bap = chemicals['Benzo[a]pyrene'].samples[s];//5
            const bbf = chemicals['Benzo[b]fluoranthene'].samples[s];//4
            const bghip = chemicals['Benzo[g,h,i]perylene'].samples[s];//6//Bgp
            const bkf = chemicals['Benzo[k]fluoranthene'].samples[s];//4
            const chr = chemicals['Chrysene'].samples[s];//4
            const dba = chemicals['Dibenz[a,h]anthracene'].samples[s];//5
            const fl = chemicals['Fluorene'].samples[s];//3
            const flu = chemicals['Fluoranthene'].samples[s];//4
            const ip = chemicals['Indeno[123-c,d]pyrene'].samples[s];//5//Inp
            const phen = chemicals['Phenanthrene'].samples[s];//3
            const naph = chemicals['Napthalene'].samples[s];//2
            const pyr = chemicals['Pyrene'].samples[s];//4
            m = {};
            //Diagnostic ratios
            //IP/(IP+B(ghi)P)
            m['IP/(IP+B(ghi)P)'] = ip / (ip + bghip);
            //BaA/(BaA+Chr)
            m['BaA/(BaA+Chr)'] = baa / (baa + chr);
            //BaP/(BaP+Chr)
            m['BaP/(BaP+Chr)'] = bap / (bap + chr);
            //Phen/(Phen+Anth)
            m['Phen/(Phen+Anth)'] = phen / (phen + anth);
            //BaA/(BaA+BaP)
            m['BaA/(BaA+BaP)'] = baa / (baa + bap);
            //BbF/(BbF+BkF)
            m['BbF/(BbF+BkF)'] = bbf / (bbf + bkf);
            sampleMeasurements[dateSampled][sheetName].ratios[s] = m;
            m = {};
            // Dash Sums: L'PAHs - Phen + Anth + Flu + Pyr; H'PAHs - BaA + Chr + BbF + BkF + BaP + IP + DBA + BgP
            m['LdPAHs'] = phen + anth + flu + pyr;
            m['HdPAHs'] = baa + chr + bbf + bkf + bap + ip + dba + bghip;
            m['Total d PAHs'] = m['LdPAHs'] + m['HdPAHs'];
            // EPS Sums: LPAHs - Naph, Aceph, Ace, Fl, Phen and Ant; HPAHs - Flu, Pyr, BaA, Chr, BbF, BkF, BaP, DBA, BgP and Inp
            m['LPAHs'] = naph + aceph + ace + fl + phen + anth;
            m['HPAHs'] = flu + pyr + baa + chr + bbf + bkf + bap + dba + bghip + ip;
            m['Total EPA PAHs'] = m['LPAHs'] + m['HPAHs'];
            // Ring Sums
            m['Sum of 2 rings'] = naph;//2
            m['Sum of 3 rings'] = ace + aceph + anth + fl + phen;//3
            m['Sum of 4 rings'] = baa + bbf + bkf + chr + flu + pyr;//4
            m['Sum of 5 rings'] = bap + dba + ip;//5
            m['Sum of 6 rings'] = bghip;//6
            m['Total all rings'] = m['Sum of 2 rings'] + m['Sum of 3 rings'] + m['Sum of 4 rings'] + m['Sum of 5 rings'] + m['Sum of 6 rings'];
            sampleMeasurements[dateSampled][sheetName].ringSums[s] = m;
            m = {};
            m['Phen/Anth'] = phen / anth;
            m['Flu/Pyr'] = flu / pyr;
            m['Baa/Chr'] = baa / chr;
            if (chemicals['Benzo[e]pyrene'] === undefined || chemicals['Benzo[e]pyrene'] === null) {
                const bep = chemicals['Benzo[e]pyrene'].sample[s];
                m['Bep/Bap'] = bep / bap;
            } else {
                m['Bep/Bap'] = 0;
            }
            sampleMeasurements[dateSampled][sheetName].simpleRatios[s] = m;
        });
    }
}

function dualfitConcentration(concentration, totalArea, totalHC, ignoreSamples = []) {
    // Extract sample keys and filter out ignored samples
    const samples = Object.keys(concentration).filter(sample => !ignoreSamples.includes(sample));
console.log(samples,samples.length);

/*    // Extract sample keys
    const samples = Object.keys(concentration);*/

    // Create Y vector (concentration values)
    const Y = samples.map(sample => concentration[sample]);

    // Create X matrix with [totalArea, totalHC, 1] for each sample
    const X = samples.map(sample => [totalArea[sample], totalHC[sample], 1]);

    // Compute X transpose (X^T)
    const XT = math.transpose(X);

    // Compute (X^T * X)
    const XTX = math.multiply(XT, X);

    // Compute (X^T * X)^-1
    const XTX_inv = math.inv(XTX);

    // Compute (X^T * Y)
    const XTY = math.multiply(XT, Y);

    // Compute beta = (X^T * X)^-1 * (X^T * Y)
    const beta = math.multiply(XTX_inv, XTY);

    // Extract coefficients
    const a = beta[0];
    const b = beta[1];
    const c = beta[2];

    // Calculate predicted values and residuals
    const Y_pred = samples.map(sample => a * totalArea[sample] + b * totalHC[sample] + c);
    const Y_mean = math.mean(Y);

    // Compute the total sum of squares (SS_tot) and residual sum of squares (SS_res)
    const SS_tot = math.sum(Y.map(y => Math.pow(y - Y_mean, 2)));
    const SS_res = math.sum(Y.map((y, i) => Math.pow(y - Y_pred[i], 2)));

    // Calculate R-squared
    const R_squared = 1 - (SS_res / SS_tot);

    return { a, b, c, R_squared };
}

function concentrationFitter(concentration, predictors, ignoreSamples = []) {
//console.log(concentration, predictors);
    // Extract sample keys and filter out ignored samples
    const samples = Object.keys(concentration).filter(sample => !ignoreSamples.includes(sample));

    // Create Y vector (concentration values) excluding ignored samples
    const Y = samples.map(sample => concentration[sample]);

    // Create X matrix dynamically based on the predictors provided, adding a column of 1s for the intercept
    const X = samples.map(sample => [...predictors[sample], 1]);

    // Compute X transpose (X^T)
    const XT = math.transpose(X);

    // Compute (X^T * X)
    const XTX = math.multiply(XT, X);

    // Compute (X^T * X)^-1
    const XTX_inv = math.inv(XTX);

    // Compute (X^T * Y)
    const XTY = math.multiply(XT, Y);

    // Compute beta = (X^T * X)^-1 * (X^T * Y)
    const beta = math.multiply(XTX_inv, XTY);

    // Calculate predicted values and residuals (only for included samples)
    const Y_pred = samples.map(sample => {
        // Calculate predicted concentration using the fitted model coefficients
        return predictors[sample].reduce((sum, value, index) => sum + beta[index] * value, beta[beta.length - 1]);
    });
    const Y_mean = math.mean(Y);

    // Compute the total sum of squares (SS_tot) and residual sum of squares (SS_res)
    const SS_tot = math.sum(Y.map(y => Math.pow(y - Y_mean, 2)));
    const SS_res = math.sum(Y.map((y, i) => Math.pow(y - Y_pred[i], 2)));

    // Calculate R-squared
    const R_squared = 1 - (SS_res / SS_tot);

    // Return the coefficients (beta) and the R-squared value
//    return { coefficients: beta, R_squared };
    return { beta, R_squared };
}

// IDs of radio buttons to disable
function disableRadioButtons(radioButtonsToChange,state)  {
//console.log(radioButtonsToChange);
    // Disable each radio button
    radioButtonsToChange.forEach(id => {
//console.log(id);
        document.getElementById(id).disabled = state;
        if (state) {
            document.querySelector("label[for='"+id+"']").style.color = "lightgrey";
        } else {
            document.querySelector("label[for='"+id+"']").style.color = "black";
        }
    });
}