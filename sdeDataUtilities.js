function Version1deepMerge(a, b) {
  // Handle null/undefined cases
  if (a == null) return b;
  if (b == null) return a;
  
  // If either value is not an object, b takes precedence
  if (typeof a !== 'object' || typeof b !== 'object') {
    return b;
  }
  
  // Handle arrays - concatenate them
  if (Array.isArray(a) && Array.isArray(b)) {
    return [...a, ...b];
  }
  
  // If one is array and other is object, prefer the object
  if (Array.isArray(a) !== Array.isArray(b)) {
    return Array.isArray(b) ? b : a;
  }
  
  // Merge objects
  const result = { ...a };
  
  for (const key in b) {
    if (b.hasOwnProperty(key)) {
      if (key in result) {
        // Recursively merge nested objects
        result[key] = deepMerge(result[key], b[key]);
      } else {
        // Add new property from b
        result[key] = b[key];
      }
    }
  }
  
  return result;
}

function deepMerge(...objects) {
  // Filter out null/undefined objects
  const validObjects = objects.filter(obj => obj != null);
  
  if (validObjects.length === 0) return {};
  if (validObjects.length === 1) return validObjects[0];
  
  return validObjects.reduce((result, current) => {
    return mergeTwo(result, current);
  }, {});
}

function mergeTwo(a, b) {
  // Handle null/undefined cases
  if (a == null) return b;
  if (b == null) return a;
  
  // If either value is not an object, b takes precedence
  if (typeof a !== 'object' || typeof b !== 'object') {
    return b;
  }
  
  // Handle arrays - concatenate them
  if (Array.isArray(a) && Array.isArray(b)) {
    return [...a, ...b];
  }
  
  // If one is array and other is object, prefer the object
  if (Array.isArray(a) !== Array.isArray(b)) {
    return Array.isArray(b) ? b : a;
  }
  
  // Merge objects - create new object to avoid mutation
  const result = {};
  
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  
  for (const key of allKeys) {
    const hasA = key in a;
    const hasB = key in b;
    
    if (hasA && hasB) {
      // Both have the key - recursively merge
      result[key] = mergeTwo(a[key], b[key]);
    } else if (hasA) {
      // Only a has the key
      result[key] = a[key];
    } else {
      // Only b has the key
      result[key] = b[key];
    }
  }
  
  return result;
}

function isSingleValue(item) {
  return (
    item !== null && 
    typeof item !== 'object' && 
    !Array.isArray(item)
  );
}
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

/**
 * A helper function that retrieves the specific value for a given sample based on a sort key.
 */
function getSortValue(fullSampleName, sortKey) {
    const parts = fullSampleName.split(": ");
    const datePart = parts[0];
    const samplePart = parts.length > 2 ? parts.slice(1).join(": ") : parts[1];

    if (!sortKey || sortKey === 'none' || sortKey === 'unsorted') {
        return 0;
    }

    try {
        switch (sortKey) {
            // --- PRIMARY SORT KEYS (Strings) ---
            case 'dateofsampling':
                return selectedSampleInfo[datePart]['Date Sampled'].toLowerCase();
            case 'samplename':
                return selectedSampleInfo[datePart].position[samplePart]['label'].toLowerCase();
            case 'datesamplename':
                return (selectedSampleInfo[datePart]['Date Sampled'] + selectedSampleInfo[datePart].position[samplePart]['label']).toLowerCase();
            case 'samplenamedate':
                return (selectedSampleInfo[datePart].position[samplePart]['label'] + selectedSampleInfo[datePart]['Date Sampled']).toLowerCase();
            case 'datasetname':
                return selectedSampleInfo[datePart]['label'].toLowerCase();
            case 'datasetnamesamplename':
                return (selectedSampleInfo[datePart]['label'] + selectedSampleInfo[datePart].position[samplePart]['label']).toLowerCase();
            case 'samplenamedatasetname':
                return (selectedSampleInfo[datePart].position[samplePart]['label'] + selectedSampleInfo[datePart]['label']).toLowerCase();

            
            // --- SECONDARY SORT KEYS (Numbers) ---
            case 'mindepth':
                value = selectedSampleInfo[datePart]?.position[samplePart]?.['Sampling depth (m)'].minDepth;
                return value ? parseFloat(value) : 0;
            case 'maxdepth':
                value = selectedSampleInfo[datePart]?.position[samplePart]?.['Sampling depth (m)'].maxDepth;
                return value ? parseFloat(value) : 0;
            case 'meandepth':
                value = (selectedSampleInfo[datePart]?.position[samplePart]?.['Sampling depth (m)'].maxDepth
                    +selectedSampleInfo[datePart]?.position[samplePart]?.['Sampling depth (m)'].minDepth)/2;
                return value ? parseFloat(value) : 0;
            case 'latitude':
                value = selectedSampleInfo[datePart]?.position[samplePart]?.['Position latitude'];
                return value ? parseFloat(value) : 0;
            case 'longitude':
                value = selectedSampleInfo[datePart]?.position[samplePart]?.['Position longitude'];
                return value ? parseFloat(value) : 0;
            case 'totalsolids':
                value = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.['Total solids (% total sediment)'];
                return value ? parseFloat(value) : 0;
            case 'organicmatter':
                value = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.['Organic matter (total organic carbon)'];
                return value ? parseFloat(value) : 0;
            case 'totalarea':
                value = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.totalArea;
                return value ? parseFloat(value) : 0;
            case 'totalhydrocarbon':
                value = selectedSampleMeasurements[datePart]?.['PAH data']?.totalHC[samplePart];
                return value ? parseFloat(value) : 0;
            case 'gorhamlmwsum':
                value = selectedSampleMeasurements[datePart]?.['PAH data']?.gorhamTest[samplePart]?.lmwSum;
                return value ? parseFloat(value) : 0;
            case 'gorhamhmwsum':
                value = selectedSampleMeasurements[datePart]?.['PAH data']?.gorhamTest[samplePart]?.hmwSum;
                return value ? parseFloat(value) : 0;
            case 'ices7pcbsum':
                value = selectedSampleMeasurements[datePart]?.['PCB data']?.congenerTest[samplePart]?.ICES7;
                return value ? parseFloat(value) : 0;
            case 'allpcbssum':
                value = selectedSampleMeasurements[datePart]?.['PCB data']?.congenerTest[samplePart]?.All;
                return value ? parseFloat(value) : 0;
            case 'gravel':
                value = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.splitWeights['Gravel'];
                return value ? parseFloat(value) : 0;
            case 'silt':
                value = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.splitWeights['Silt And Clay'];
                return value ? parseFloat(value) : 0;
            case 'sand':
                const splitWeightsSand = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.splitWeights;
                if (!splitWeightsSand) return 0;
                return (parseFloat(splitWeightsSand['Fine And Very Fine Sand']) || 0) + (parseFloat(splitWeightsSand['Medium Sand']) || 0) + (parseFloat(splitWeightsSand['Very Coarse And Coarse Sand']) || 0);
            case 'siltandsand':
                const splitWeightsSiltSand = selectedSampleMeasurements[datePart]?.['Physical Data']?.samples[samplePart]?.splitWeights;
                if (!splitWeightsSiltSand) return 0;
                return (parseFloat(splitWeightsSiltSand['Fine And Very Fine Sand']) || 0) + (parseFloat(splitWeightsSiltSand['Medium Sand']) || 0) + (parseFloat(splitWeightsSiltSand['Very Coarse And Coarse Sand']) || 0) + (parseFloat(splitWeightsSiltSand['Silt And Clay']) || 0);
            default:
                return 0;
        }
    } catch (e) {
        console.warn(`Could not retrieve sort value for key "${sortKey}" on sample "${fullSampleName}". Returning 0.`);
        return 0;
    }
}

/**
 * Extends the Array prototype to sort samples based on primary and secondary keys.
 */
Array.prototype.sortComplexSamples = function() {
    // Read the current selections directly from the dropdowns
    const primaryKey = document.getElementById('primary-sorting-select').value;
    const secondaryKey = document.getElementById('secondary-sorting-select').value;

    return this.sort((a, b) => {
        // Get the values for the primary sort key
        const primaryA = getSortValue(a, primaryKey);
        const primaryB = getSortValue(b, primaryKey);

        let comparison = 0;
        // Compare primary values
        if (typeof primaryA === 'string') {
            comparison = primaryA.localeCompare(primaryB);
        } else {
            comparison = primaryA - primaryB;
        }

        // If primary values are the same, sort by the secondary key
        if (comparison === 0 && secondaryKey && secondaryKey !== 'none') {
            const secondaryA = getSortValue(a, secondaryKey);
            const secondaryB = getSortValue(b, secondaryKey);

            if (typeof secondaryA === 'string') {
                comparison = secondaryA.localeCompare(secondaryB);
            } else {
                comparison = secondaryA - secondaryB;
            }
        }
        
        return comparison;
    });
};


/**
 * Populates the primary and secondary sorting dropdowns from the new option arrays.
 */
function populateSortDropdowns() {
    const primarySelect = document.getElementById('primary-sorting-select');
    const secondarySelect = document.getElementById('secondary-sorting-select');

    primarySelect.innerHTML = '';
    secondarySelect.innerHTML = '';

    // Populate Primary Dropdown
    primarySortingOptions.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText.toLowerCase().replace(/[\s&]+/g, '');
        option.textContent = optionText;
        primarySelect.appendChild(option);
    });

    // Populate Secondary Dropdown
    const noneOption = document.createElement('option');
    noneOption.value = 'none';
    noneOption.textContent = 'None';
    secondarySelect.appendChild(noneOption);

    secondarySortingOptions.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText.toLowerCase().replace(/\s+/g, '');
        option.textContent = optionText;
        secondarySelect.appendChild(option);
    });
}

// Define ranges for different materials for standard MMO template
let ranges = {
    'Gravel': [0, 9],
    'Very Coarse And Coarse Sand': [10, 13],
    'Medium Sand': [14, 15],
    'Fine And Very Fine Sand': [16, 19],
    'Silt And Clay': [20, 40]
    // Ignore < 0.4um particles
  };

  function determineRanges(sizes) {
    const ranges = {
        'Gravel': [],
        'Very Coarse And Coarse Sand': [],
        'Medium Sand': [],
        'Fine And Very Fine Sand': [],
        'Silt And Clay': []
    };

    let startIndex = 0;

    // Helper function to find the end index for a given range
    function findEndIndex(startIndex, condition) {
        for (let i = startIndex; i < sizes.length; i++) {
            if (!condition(sizes[i])) {
                return i - 1;
            }
        }
        return sizes.length - 1;
    }

    // Gravel: > 2.0 mm (0.002 m)
    let endIndex = findEndIndex(startIndex, size => size > 0.002);
    if (endIndex >= startIndex) {
        ranges['Gravel'] = [startIndex, endIndex];
        startIndex = endIndex + 1;
    }

    // Very Coarse & Coarse Sand: 0.5 mm – 2.0 mm (0.0005 m – 0.002 m)
    endIndex = findEndIndex(startIndex, size => size <= 0.002 && size >= 0.0005);
    if (endIndex >= startIndex) {
        ranges['Very Coarse And Coarse Sand'] = [startIndex, endIndex];
        startIndex = endIndex + 1;
    }

    // Medium Sand: 0.25 mm – 0.5 mm (0.00025 m – 0.0005 m)
    endIndex = findEndIndex(startIndex, size => size < 0.0005 && size >= 0.00025);
    if (endIndex >= startIndex) {
        ranges['Medium Sand'] = [startIndex, endIndex];
        startIndex = endIndex + 1;
    }

    // Fine & Very Fine Sand: 0.0625 mm – 0.25 mm (0.0000625 m – 0.00025 m)
    endIndex = findEndIndex(startIndex, size => size < 0.00025 && size >= 0.0000625);
    if (endIndex >= startIndex) {
        ranges['Fine And Very Fine Sand'] = [startIndex, endIndex];
        startIndex = endIndex + 1;
    }

    // Silt & Clay: < 0.0625 mm (< 0.0000625 m)
    endIndex = findEndIndex(startIndex, size => size < 0.0000625);
    if (endIndex >= startIndex) {
        ranges['Silt And Clay'] = [startIndex, endIndex];
    }

    return ranges;
}

/*// Function to determine the ranges for different materials
function determineRanges(sizes) {
    // Define ranges for different materials
    let noSizes = sizes.length;
    ranges = {
        'Gravel': [0, 9],45mm 2mm
        'Very Coarse And Coarse Sand': [10, 13],1.4mm 0.5mm    
        'Medium Sand': [14, 15], 0.3536mm 0.25mm
        'Fine And Very Fine Sand': [16, 19], 0.1768mm 0.063mm
        'Silt And Clay': [20, 40] 0.0442mm 0.004mm
        // Ignore < 0.4um particles
    };
    // Define the range for each material
    for (const material in ranges) {
        ranges[material] = [sizes[ranges[material][0]], sizes[ranges[material][1]]];
    }
}*/

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
    // Define the split object = silt and clay to gravel
    let split = {};
    // Calculate sums for each category
    split['Silt And Clay'] = sumInRange(psd, ranges['Silt And Clay']);
    split['Fine And Very Fine Sand'] = sumInRange(psd, ranges['Fine And Very Fine Sand']);
    split['Medium Sand'] = sumInRange(psd, ranges['Medium Sand']);
    split['Very Coarse And Coarse Sand'] = sumInRange(psd, ranges['Very Coarse And Coarse Sand']);
    split['Gravel'] = sumInRange(psd, ranges['Gravel']);
    return split
}

/*function psdSplit(psd) {
    // Define the split object = gravel to silt and clay
    let split = {};
    // Calculate sums for each category
    split['Gravel'] = sumInRange(psd, ranges['Gravel']);
    split['Very Coarse And Coarse Sand'] = sumInRange(psd, ranges['Very Coarse And Coarse Sand']);
    split['Medium Sand'] = sumInRange(psd, ranges['Medium Sand']);
    split['Fine And Very Fine Sand'] = sumInRange(psd, ranges['Fine And Very Fine Sand']);
    split['Silt And Clay'] = sumInRange(psd, ranges['Silt And Clay']);
    return split
}
*/


standard_phiSizes = [-5.5,-5.0,-4.5,-4.0,-3.5,-3.0,-2.5,-2.0,-1.5,-1.0,-0.5,0.0,0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5,7.0,7.5,8.0,8.5,9.0,9.5,10.0,10.5,11.0,11.5,12.0,12.5,13.0,13.5,14.0,14.5];
standard_ptsSizes = standard_phiSizes.map(phiSize => Math.pow(2, -phiSize)/1000);

function InterresamplePsd(currentPsd, ptsSizes, standard_ptsSizes) {
    function interpolate(x, x0, y0, x1, y1) {
        return y0 + ((y1 - y0) * ((x - x0) / (x1 - x0)));
    }
    
    let resampledPsd = [];
    resampledPsd.push(0);
    sum = 0;
    
    for (let i = 0; i < standard_ptsSizes.length; i++) {
        let targetSize = standard_ptsSizes[i];
        
        if (targetSize >= ptsSizes[0]) {
            resampledPsd.push(currentPsd[0]);
        } else if (targetSize <= ptsSizes[ptsSizes.length - 1]) {
            resampledPsd.push(currentPsd[currentPsd.length - 1]);
        } else {
            for (let j = 0; j < ptsSizes.length - 1; j++) {
                if (targetSize <= ptsSizes[j] && targetSize > ptsSizes[j + 1]) {
                    let interpolatedValue = interpolate(
                        targetSize, ptsSizes[j], currentPsd[j], ptsSizes[j + 1], currentPsd[j + 1]
                    );
                    resampledPsd.push(interpolatedValue);
                    break;
                }
            }
        }
        sum += resampledPsd[i];
    }
    
    // Normalize to ensure the sum is 100%
    resampledPsd = resampledPsd.map(value => (value / sum) * 100);
    
    return resampledPsd;
}

function resamplePsd(currentPsd, ptsSizes, standard_ptsSizes) {
    let resampledPsd = new Array(standard_ptsSizes.length).fill(0);
    let sizeMap = new Map();
    
    // Map the original PSD values to their respective particle sizes
    for (let i = 0; i < ptsSizes.length; i++) {
        sizeMap.set(ptsSizes[i], currentPsd[i]);
    }
    
    for (let i = 0; i < standard_ptsSizes.length; i++) {
        let targetSize = standard_ptsSizes[i];
        
        let closestSize = ptsSizes.reduce((prev, curr) => 
            Math.abs(curr - targetSize) < Math.abs(prev - targetSize) ? curr : prev
        );
        
        resampledPsd[i] = sizeMap.get(closestSize) || 0;
    }
    
    // Normalize to ensure the sum is 100%
    let sum = resampledPsd.reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
        resampledPsd = resampledPsd.map(value => (value / sum) * 100);
    }
    
    return resampledPsd;
}

function psdPostProcess(currentPsd, sizes) {
    ptsSizes = null;
    ptsAreas = null;
    ptsVolumes = null;
    splitWeights = {};
    splitAreas = {};
    // Ignore < 0.4um particles
//console.log(standard_phiSizes);
//console.log(sizes)
    sizes = sizes.slice(0,-1);
//console.log(sizes)    
    //Sizes are in mm so convert to SI
    current_ptsSizes = sizes.map(phiSize => Math.pow(2, -phiSize)/1000);
//console.log(current_ptsSizes);
//console.log(standard_ptsSizes);
    if (current_ptsSizes.length !== standard_ptsSizes.length) {
        currentPsd = resamplePsd(currentPsd, current_ptsSizes, standard_ptsSizes);
//console.log('Resampled');
//console.log(currentPsd);
    } 
//console.log(currentPsd.length);
//console.log(currentPsd);
    ptsSizes = standard_ptsSizes;
//console.log(ptsSizes);
    ptsAreas = ptsSizes.map(size => Math.PI * size * size);
    ptsVolumes = ptsSizes.map(size => (Math.PI * size * size * size) / 6);
//    ranges = determineRanges(ptsSizes);
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
    return { currentPsd, areas, relativeAreas, splitWeights, splitAreas, splitRelativeAreas, cumAreas, cumWeights, totalArea }
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
            //,                        const congenerConcentration = meas.chemicals[chemical].samples[sample].reduce((acc, val) => acc + val, 0);
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
//console.log('fered');
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
        const lmw = ['Acenapthene', 'Acenapthylene', 'Anthracene', 'C1-Napthalenes',  'Fluorene','Napthalene', 'Phenanthrene'];
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
//console.log(chemical,sample,lmwConcentrationSum);
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
//console.log('stuff there');
        const allSamples = Object.keys(sampleInfo[dateSampled].position);
        allSamples.sort();
        allSamples.forEach(s => {
//console.log('stuff here');
            const ace = chemicals['Acenapthene'].samples[s];//3
            const aceph = chemicals['Acenapthylene'].samples[s];//3
            const anth = chemicals['Anthracene'].samples[s];//3//Ant
            const baa = chemicals['Benz[a]anthracene'].samples[s];//4
            const bap = chemicals['Benzo[a]pyrene'].samples[s];//5
            const bep = chemicals['Benzo[e]pyrene'].samples[s];
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
            let m1 = {};
            //Diagnostic ratios
            //IP/(IP+B(ghi)P)
            m1['IP/(IP+B(ghi)P)'] = ip / (ip + bghip);
            //BaA/(BaA+Chr)
            m1['BaA/(BaA+Chr)'] = baa / (baa + chr);
            //BaP/(BaP+Chr)
            m1['BaP/(BaP+Chr)'] = bap / (bap + chr);
            //Phen/(Phen+Anth)
            m1['Phen/(Phen+Anth)'] = phen / (phen + anth);
            //BaA/(BaA+BaP)
            m1['BaA/(BaA+BaP)'] = baa / (baa + bap);
            //BbF/(BbF+BkF)
            m1['BbF/(BbF+BkF)'] = bbf / (bbf + bkf);
            sampleMeasurements[dateSampled][sheetName].ratios[s] = m1;
            let m2 = {};
            // Dash Sums: L'PAHs - Phen + Anth + Flu + Pyr; H'PAHs - BaA + Chr + BbF + BkF + BaP + IP + DBA + BgP
            m2['LdPAHs'] = phen + anth + flu + pyr;
            m2['HdPAHs'] = baa + chr + bbf + bkf + bap + ip + dba + bghip;
            m2['Total d PAHs'] = m2['LdPAHs'] + m2['HdPAHs'];
            // EPS Sums: LPAHs - Naph, Aceph, Ace, Fl, Phen and Ant; HPAHs - Flu, Pyr, BaA, Chr, BbF, BkF, BaP, DBA, BgP and Inp
            m2['LPAHs'] = naph + aceph + ace + fl + phen + anth;
            m2['HPAHs'] = flu + pyr + baa + chr + bbf + bkf + bap + dba + bghip + ip;
            m2['Total EPA PAHs'] = m2['LPAHs'] + m2['HPAHs'];
            // Ring Sums
            m2['Sum of 2 rings'] = naph;//2
            m2['Sum of 3 rings'] = ace + aceph + anth + fl + phen;//3
            m2['Sum of 4 rings'] = baa + bbf + bkf + chr + flu + pyr;//4
            m2['Sum of 5 rings'] = bap + dba + ip;//5
            m2['Sum of 6 rings'] = bghip;//6
            m2['Total all rings'] = m2['Sum of 2 rings'] + m2['Sum of 3 rings'] + m2['Sum of 4 rings'] + m2['Sum of 5 rings'] + m2['Sum of 6 rings'];
            sampleMeasurements[dateSampled][sheetName].ringSums[s] = m2;
            let m3 = {};
            m3['Phen/Anth'] = phen / anth;
            m3['Flu/Pyr'] = flu / pyr;
            m3['Baa/Chr'] = baa / chr;
            m3['Bep/Bap'] = bep / bap;
/*            m['Phen/Anth'] = 10;
            m['Flu/Pyr'] = 10;
            m['Baa/Chr'] = 10;
            m['Bep/Bap'] = 10;            //            if (chemicals['Benzo[e]pyrene'] === undefined || chemicals['Benzo[e]pyrene'] === null) {
//                const bep = chemicals['Benzo[e]pyrene'].samples[s];
console.log(bap);
console.log(bep);
//                m['Bep/Bap'] = bep / bap;
/*            } else {
                m['Bep/Bap'] = 0;
            }*/
            sampleMeasurements[dateSampled][sheetName].simpleRatios[s] = m3;
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

/*// IDs of radio buttons to disable
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
}*/

function disableRadioButtons(radioButtonsToChange, state) {
    // Disable each radio button
    radioButtonsToChange.forEach(id => {
        const inputElement = document.getElementById(id);

        // Check if the element exists to prevent errors
        if (inputElement) {
            inputElement.disabled = state;

            // Find the parent <label> of the input element
            const label = inputElement.parentElement;

            // Check if the parent is a LABEL and then change its color
            if (label && label.tagName === 'LABEL') {
                if (state) {
                    label.style.color = "lightgrey";
                } else {
                    // Reverts to the default text color from the stylesheet
                    label.style.color = ""; 
                }
            }
        }
    });
}

function parseCoordinate(input) {
    if (input == undefined || input == null) {
        return null;
    }
    const digitalFormatRegex = /^[-+]?\d+(\.\d+)?$/;
    if (digitalFormatRegex.test(input)) {
        return parseFloat(input);
    }
    const dmsRegex = /^(\d+)\s+(\d+)\s+([\d.]+)\s*([NSEW])$/i;
    const dmsMatch = input.match(dmsRegex);
    if (dmsMatch) {
        const degrees = parseFloat(dmsMatch[1]);
        const minutes = parseFloat(dmsMatch[2]);
        const seconds = parseFloat(dmsMatch[3]);
        const direction = dmsMatch[4].toUpperCase();
        let result = degrees + minutes / 60 + seconds / 3600;
        if (direction === 'S' || direction === 'W') {
            result = -result;
        }
        return result;
    }
    const dmRegex = /^(\d+)[\s\:]+([\d.]+)\s*([NSEW])$/i;
    const dmMatch = input.match(dmRegex);
    if (dmMatch) {
        const degrees = parseFloat(dmMatch[1]);
        const minutes = parseFloat(dmMatch[2]);
        const direction = dmMatch[3].toUpperCase();
        let result = degrees + minutes / 60;
        if (direction === 'S' || direction === 'W') {
            result = -result;
        }
        return result;
    }
    return null;
}

function parseCoordinates(latitude, longitude) {
//console.log(latitude,longitude);
// Detect Easting/Northing in "E181866.536,N32697.506" format
//    const enRegex = /^E\s*([0-9.]+)\s*,?\s*N\s*([0-9.]+)$/i;
    const enMatchLat = typeof latitude === "string" ? latitude.match(/^N\s*([0-9.]+)/i) : null;
    const enMatchLon = typeof longitude === "string" ? longitude.match(/^E\s*([0-9.]+)/i) : null;

    if (enMatchLat && enMatchLon) {
        const easting = parseFloat(longitude.replace(/^[Ee]/, '').replace(',', ''));
        const northing = parseFloat(latitude.replace(/^[Nn]/, '').replace(',', ''));

        // Define EPSG:27700 if not already defined
        if (!proj4.defs["EPSG:27700"]) {
            proj4.defs("EPSG:27700",
                "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 " +
                "+x_0=400000 +y_0=-100000 +ellps=airy " +
                "+towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 " +
                "+units=m +no_defs"
            );
        }

        const [lon, lat] = proj4("EPSG:27700", "EPSG:4326", [easting, northing]);
        return { latitude: lat, longitude: lon };
    }


    if ((!(latitude == undefined || latitude == null)) && (longitude == undefined || longitude == null)) {
        const en = os.Transform.fromGridRef(latitude);
        if (en.ea === undefined || en.ea === null) {
            console.log('Looks like this is an invalid grid reference ', latitude);
            return null;
        }
        const latlong = os.Transform.toLatLng(en);
        if (latlong === undefined || latlong == null) {
            return null;
        }
        return { latitude: latlong.lat, longitude: latlong.lng };
    }
    if ((latitude == undefined || latitude == null) && (longitude == undefined || longitude == null)) {
        return null;
    }
//console.log(latitude,longitude);
    if (latitude > 360) {
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs");
        const point = proj4("EPSG:27700", "EPSG:4326", [parseFloat(latitude), parseFloat(longitude)]);
        return { latitude: point[1], longitude: point[0] };
    }
    const digitalDegreesRegex = /^([-+]?\d+(\.\d+)?)\s*([NSEW])\s*([-+]?\d+(\.\d+)?)\s*([NSEW])$/i;
    const digitalDegreesMatch = `${latitude} ${longitude}`.match(digitalDegreesRegex);
    if (digitalDegreesMatch) {
        const latValue = parseFloat(digitalDegreesMatch[1]) * (digitalDegreesMatch[3].toUpperCase() === 'S' ? -1 : 1);
        const lonValue = parseFloat(digitalDegreesMatch[4]) * (digitalDegreesMatch[6].toUpperCase() === 'W' ? -1 : 1);
        return { latitude: latValue, longitude: lonValue };
    }
    const digitalMinutesRegex = /^(\d{1,3})°\s*(\d{1,2}\.\d+)’\s*([NSEW])\s*(\d{1,3})°\s*(\d{1,2}\.\d+)’\s*([NSEW])\s*$/i;
    const digitalMinutesMatch = `${latitude} ${longitude}`.match(digitalMinutesRegex);
    if (digitalMinutesMatch) {
        const latValue = (parseInt(digitalMinutesMatch[1]) + parseFloat(digitalMinutesMatch[2])/60) * (digitalMinutesMatch[3].toUpperCase() === 'S' ? -1 : 1);
        const lonValue = (parseInt(digitalMinutesMatch[4]) + parseFloat(digitalMinutesMatch[5])/60) * (digitalMinutesMatch[6].toUpperCase() === 'W' ? -1 : 1);
        return { latitude: latValue, longitude: lonValue };
    }
    if (latitude > 360) {
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs");
        const point = proj4("EPSG:27700", "EPSG:4326", [parseInt(latitude, 10), parseInt(longitude, 10)]);
        return { latitude: point[1], longitude: point[0] };
    } else {
        return { latitude: parseCoordinate(latitude), longitude: parseCoordinate(longitude) };
    }
    return null;
}
