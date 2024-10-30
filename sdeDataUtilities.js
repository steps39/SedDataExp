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
            const latitudeA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position latitude'];
            const latitudeB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position latitude'];
            return latitudeA - latitudeB;
        }
        
        // Sorting by longitude
        if (xAxisSort === 'longitude') {
            const latitudeA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position longitude'];
            const latitudeB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position longitude'];
            return latitudeA - latitudeB;
        }
        
        // Sorting by totalArea
        if (xAxisSort === 'totalarea') {
            const totalAreaA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].totalArea;
            const totalAreaB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].totalArea;
            return totalAreaA - totalAreaB;
        }

        // Sorting by gravel
        if (xAxisSort === 'gravel') {
            const gravelA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights['Gravel'];
            const gravelB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights['Gravel'];
            return gravelA - gravelB;
        }

        // Sorting by silt
        if (xAxisSort === 'silt') {
            const siltA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights['Silt And Clay'];
            const siltB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights['Silt And Clay'];
            return siltA - siltB;
        }

        // Sorting by sand
        if (xAxisSort === 'sand') {
            const splitWeightsA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights;
            const splitWeightsB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights;
            const sandA = splitWeightsA['Fine And Very Fine Sand'] + splitWeightsA['Medium Sand'] + 
                          splitWeightsA['Very Coarse And Coarse Sand'];
            const sandB = splitWeightsB['Fine And Very Fine Sand'] + splitWeightsB['Medium Sand'] + 
                          splitWeightsB['Very Coarse And Coarse Sand'];
            return sandA - sandB;
        }

        // Sorting by sand
        if (xAxisSort === 'slitsand') {
            const splitWeightsA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].splitWeights;
            const splitWeightsB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].splitWeights;
            const sandA = splitWeightsA['Fine And Very Fine Sand'] + splitWeightsA['Medium Sand'] + 
                          splitWeightsA['Very Coarse And Coarse Sand'] + splitWeightsA['Silt And Clay'];
            const sandB = splitWeightsB['Fine And Very Fine Sand'] + splitWeightsB['Medium Sand'] + 
                          splitWeightsB['Very Coarse And Coarse Sand'] + splitWeightsB['Silt And Clay'];
            return sandA - sandB;
        }

        // Sorting by datelatitude
        if (partsA[0] === partsB[0]) {
            if (xAxisSort === 'datelatitude') {
                const latitudeA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position latitude'];
                const latitudeB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position latitude'];
                return latitudeA - latitudeB;
            }
        } else {
            if (partsA[0] > partsB[0]) {
                return 1
            } else {
                return -1
            }
        }
        
        // Sorting by datelongitude
        if (partsA[0] === partsB[0]) {
            if (xAxisSort === 'datelongitude') {
                const longitudeA = selectedSampleInfo[partsA[0]].position[partsA[1]]['Position longitude'];
                const longitudeB = selectedSampleInfo[partsB[0]].position[partsB[1]]['Position longitude'];
                return longitudeA - longitudeB;
            }
        } else {
            if (partsA[0] > partsB[0]) {
                return 1
            } else {
                return -1
            }
        }
        
        // Sorting by datetototalarea
        if (partsA[0] === partsB[0]) {
            if (xAxisSort === 'datetotalarea') {
                const totalAreaA = selectedSampleMeasurements[partsA[0]]['Physical Data'].samples[partsA[1]].totalArea;
                const totalAreaB = selectedSampleMeasurements[partsB[0]]['Physical Data'].samples[partsB[1]].totalArea;
                return totalAreaA - totalAreaB;
            }
        } else {
            if (partsA[0] > partsB[0]) {
                return 1
            } else {
                return -1
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
    ptsAreas = ptsSizes.map(size => (Math.PI * size * size) / 4);
    ptsVolumes = ptsSizes.map(size => (Math.PI * size * size * size) / 6);
//console.log(ptsSizes,ptsAreas,ptsVolumes);
    areas = [];
    totalArea = 0;
    cumAreas = [];
    cumWeights = [];
    for (i = 0; i < ptsSizes.length; i++) {
        //                    noPts = currentPsd[i] / volumes[i];
        currentArea = ptsAreas[i] * currentPsd[i] / ptsVolumes[i];
        areas[i] = currentArea;
        totalArea += currentArea;
        cumAreas[i] = 0;
        cumWeights[i] = 0;
    }
//    cumAreas = Array(areas.length);
    previousCumArea = 0;
//    cumWeights = Array(areas.length);
    previousCumWeight = 0;
    for (i = ptsSizes.length-1; i > -1; i--) {
        areas[i] = areas[i]*100/totalArea;
        cumAreas[i] = previousCumArea + areas[i];
        previousCumArea = cumAreas[i];
        cumWeights[i] = previousCumWeight + currentPsd[i];
        previousCumWeight = cumWeights[i];
    }
    splitWeights = psdSplit(currentPsd);
    splitAreas = psdSplit(areas);
console.log( areas, splitWeights, splitAreas, cumAreas, cumWeights, totalArea );
    return { areas, splitWeights, splitAreas, cumAreas, cumWeights, totalArea }
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

