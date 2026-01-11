let permanentTooltipLayer;
let isHeatmapMode = false;
let activeContaminant = null;
let allMapMarkers = [];
let allMapData = { isReady: false };
//let map;
let baseLayers = {};
let datasetLayers = {};
let overlayLayers = {};
let contaminantLayers = {};
let contaminantStats = {};
let contaminantHeatmaps = {};
let dateColors = {};
let markers = {};
let sampleDepths = {};
let depthStatsGlobal = { min: Infinity, max: -Infinity };
let depthSortedSampleIds = [];
let minLat = null, maxLat = null, minLon = null, maxLon = null;
let noLocations = 0, latSum = 0, lonSum = 0;
const hoverStyle = { radius: 10, weight: 3, opacity: 1, fillOpacity: 1 };
let allShapeLayers = [];
let areaTooltipsVisible = false;
let colorMode = 'scale';
let upperLevelMode = '10x';
let shapesColoredByData = false;
let includeShapesOnStaticMaps = false;
let markerScaling = 1;

const highlightStyle = {
    radius: 10, fillColor: '#FFFF00', color: '#000000', weight: 2, opacity: 1, fillOpacity: 1
};

    function applyDynamicStyling(chemicalName, zoomLevel = null) {
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        const { valueMin, valueMax, depthMin, depthMax } = stats;
        const { breaks, colors } = getColorScale(valueMin * stats.rescale, valueMax * stats.rescale, chemicalName);
        contaminantLayers[chemicalName].eachLayer(marker => {
            const value = parseFloat(marker.options._chemValue);
            const depth = marker.options._depth;
            let color = colors[0];
            for (let i = breaks.length; i > 0; i--) {
                if (value > breaks[i-1]) { 
                    color = colors[i] || colors[colors.length - 1]; 
                    break; 
                }
            }
            const radius = getLogDepthRadius3Levels(depth, depthMin, depthMax, zoomLevel);
            marker.setStyle({ fillColor: color, radius });
        });
    }

    function getColorScale(min, max, chemicalName) {
        let breaks = [];
        let colors = [];
        let levels = null;
        if (colorMode === 'standards' && standards[chosenStandard]?.chemicals?.[chemicalName]) {
            if(!standards[chosenStandard].chemicals[chemicalName]?.definition) {
                levels = standards[chosenStandard].chemicals[chemicalName];
            } else {
                if(standards[chosenStandard].chemicals[chemicalName]?.levels){
                    levels = standards[chosenStandard].chemicals[chemicalName].levels;
                }
            }
        }
        if (!levels) {
                breaks = [
                    min + (max - min) * 0.25,
                    min + (max - min) * 0.50,
                    min + (max - min) * 0.75
                ];
                colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
        } else {
            levels = [...levels];
            if (levels[1] === null) {
                if (upperLevelMode === '10x') {
                    levels[1] = levels[0] * 10;
                    colors = ["#00FF00", "#FF0000", "#000000"];
                } else {
                    levels = [levels[0]];
                    colors = ["#00FF00", "#FF0000"];
                }
            } else {
                colors = ["#00FF00", "#FF0000", "#000000"];
            }
            const unitAlign = factorUnit(contaminantStats[chemicalName].unit, extractUnit(standards[chosenStandard].unit));
            if (unitAlign !== 1) {
                levels = levels.map(l => l / unitAlign);
            }
            breaks = levels;
        }
        return { breaks, colors };
    }

    function getHeatmapColor(intensity) {
        if (intensity <= 0.2) return '#1a9850';
        if (intensity <= 0.4) return '#fee08b';
        if (intensity <= 0.6) return '#fc8d59';
        if (intensity <= 0.8) return '#f46d43';
        return '#d73027';
    }

    function getLogDepthRadius3Levels(depth, depthMin, depthMax, zoomLevel = null) {
        // Define geographic sizes in meters for each depth level
        const rSmallMeters = 5;    // 5 meters for shallow samples
        const rMedMeters = 10;     // 10 meters for medium depth samples
        const rLargeMeters = 15;   // 15 meters for deep samples
        
        let radiusInMeters;
        if (depth == null || isNaN(depth) || depthMin === depthMax) {
            radiusInMeters = rSmallMeters;
        } else {
            const logMin = Math.log((depthMin ?? 0) + 1);
            const logMax = Math.log((depthMax ?? 0) + 1);
            const logVal = Math.log(depth + 1);
            const t = (logVal - logMin) / (logMax - logMin);
            
            if (t <= 1 / 3) radiusInMeters = rSmallMeters;
            else if (t <= 2 / 3) radiusInMeters = rMedMeters;
            else radiusInMeters = rLargeMeters;
        }
        
        // Convert meters to pixels based on zoom level
        if (zoomLevel === null) {
            // Fallback to pixel-based sizing
            if (radiusInMeters === rSmallMeters) return 6 * markerScaling;
            if (radiusInMeters === rMedMeters) return 12 * markerScaling;
            return 18 * markerScaling;
        }
        
        // Meters per pixel calculation
        const metersPerPixel = 40075017 / (256 * Math.pow(2, zoomLevel)) * Math.cos(54.596 * Math.PI / 180);
        
        // FIX: Scale the result by 20 so the physical meter size translates to visible pixels
        return (radiusInMeters / metersPerPixel) * 20 * markerScaling;
    }

/*srg251130    function getLogDepthRadius3Levels(depth, depthMin, depthMax, zoomLevel = null) {
        // Define geographic sizes in meters for each depth level
        const rSmallMeters = 5;    // 5 meters for shallow samples
        const rMedMeters = 10;     // 10 meters for medium depth samples
        const rLargeMeters = 15;   // 15 meters for deep samples
        
        let radiusInMeters;
        if (depth == null || isNaN(depth) || depthMin === depthMax) {
            radiusInMeters = rSmallMeters;
        } else {
            const logMin = Math.log((depthMin ?? 0) + 1);
            const logMax = Math.log((depthMax ?? 0) + 1);
            const logVal = Math.log(depth + 1);
            const t = (logVal - logMin) / (logMax - logMin);
            
            if (t <= 1 / 3) radiusInMeters = rSmallMeters;
            else if (t <= 2 / 3) radiusInMeters = rMedMeters;
            else radiusInMeters = rLargeMeters;
        }
        
        // Convert meters to pixels based on zoom level
        // If no zoom level provided, use default pixel sizes
        if (zoomLevel === null) {
            // Fallback to pixel-based sizing
            if (radiusInMeters === rSmallMeters) return 6;
            if (radiusInMeters === rMedMeters) return 12;
            return 18;
        }
        
        // At equator: 1 degree ≈ 111,320 meters
        // Meters per pixel = (equator circumference) / (256 * 2^zoom)
        // = 40075017 / (256 * 2^zoom)
        const metersPerPixel = 40075017 / (256 * Math.pow(2, zoomLevel)) * Math.cos(54.596 * Math.PI / 180);
        
        // Convert radius from meters to pixels
        return radiusInMeters / metersPerPixel; // Scale factor for visibility
    }
        */

    function factorUnit(unit1,unit2) {
        const unitScales = {
            'g/kg': 1,
            'mg/kg': 1e-3,
            'µg/kg': 1e-6,
            'ng/kg': 1e-9,
            'pg/kg': 1e-12,
            'fg/kg': 1e-15,
        };
        return unitScales[unit1] / unitScales[unit2];
    }

    function extractUnit(string) {
    // Define the units to search for in order of specificity
    const units = ['µg/kg', 'mg/kg', 'ng/kg', 'pg/kg', 'fg/kg', 'g/kg'];
    
    // Convert string to lowercase for case-insensitive matching
    const lowerString = string.toLowerCase();
    
    // Check each unit
    for (const unit of units) {
        if (lowerString.includes(unit.toLowerCase())) {
        return unit;
        }
    }
    
    // Return null if no unit found
    return null;
    }

    function oneextractUnit(str) {
        const regex = /\((µg\/kg)\s*dry weight\)|(mg\/kg)/;
        const match = str.match(regex);
        if (match) {
            return match[1] || match[2] || 'Unit not found';
        }
        return 'Unit not found';
    }

const openStreetMapTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
const worldImageryTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community.' });
const currentTime = new Date();
const year = currentTime.getFullYear();
const apiKey = 'WYvhmkLwjzAF0LgSL14P7y1v5fySAYy9';
const serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';
const osRoadTiles = L.tileLayer(`${serviceUrl}/Road_3857/{z}/{x}/{y}.png?key=${apiKey}`, { maxZoom: 19, attribution: 'Contains OS Data &copy; Crown copyright and database rights ' + year });
const osOutdoorTiles = L.tileLayer(`${serviceUrl}/Outdoor_3857/{z}/{x}/{y}.png?key=${apiKey}`, { maxZoom: 19, attribution: 'Contains OS Data &copy; Crown copyright and database rights ' + year });
const openStreetMapHOTTiles = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France' });
const openTopoMapTiles = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)' });
const openSensorCommunityTiles = L.tileLayer('https://osmc3.maps.sensor.community/{z}/{x}/{y}.png', { maxZoom: 19, attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © Sensor Community' });

function createGlobalLayers() {
console.log('Creating global layers...');
contaminantLayers = {};
contaminantHeatmaps = {};
    let allSamples = [];
    let sampleNo = -1;

    baseLayers = {
        "OpenStreetMap": openStreetMapTiles,
        "WorldImagery": worldImageryTiles,
        "OS Road": osRoadTiles,
        "OS Outdoor": osOutdoorTiles,
        "OpenStreetMap.HOT": openStreetMapHOTTiles,
        "OpenTopoMap": openTopoMapTiles,
        "OpenSensorCommunity": openSensorCommunityTiles
    };

    let colorIndex = 0;
    let noSamples = 0;

    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.forEach(dateSampled => {
        markers[dateSampled] = {};
        dateColors[dateSampled] = markerColors[colorIndex];
        colorIndex = (colorIndex + 1) % markerColors.length;
        const dsSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        noSamples += dsSamples.length;
        dsSamples.forEach(sample => allSamples.push(`${dateSampled}: ${sample}`));
    });

if(datesSampled.length > 1) {
    datesSampled.sort((a, b) => {
        const labelA = selectedSampleInfo[a].label || a;
        const labelB = selectedSampleInfo[b].label || b;
        return labelA.localeCompare(labelB);
    });
}

    datesSampled.forEach(dateSampled => {
        const dsSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        dsSamples.forEach(sample => {
            const depthInfo = selectedSampleInfo[dateSampled].position[sample]['Sampling depth (m)'];
            if (depthInfo) {
                const maxDepth = depthInfo['maxDepth'];
                if (!isNaN(maxDepth)) {
                    if (depthStatsGlobal.max === null) {
                        depthStatsGlobal.min = maxDepth;
                        depthStatsGlobal.max = maxDepth;
                    }
                    const key = `${dateSampled}: ${sample}`;
                    sampleDepths[key] = maxDepth;
                    if (maxDepth < depthStatsGlobal.min) depthStatsGlobal.min = maxDepth;
                    if (maxDepth > depthStatsGlobal.max) depthStatsGlobal.max = maxDepth;
                }
            }
        });
    });
//console.log('sampleDepths:', sampleDepths);
//console.log('depthStatsGlobal:', depthStatsGlobal);

function computeIndividualStats(statsByChem, unit, values, chemicalName, lookupName = chemicalName) {
//console.log('computeIndividualStats called with:', chemicalName, 'sample keys:', Object.keys(values || {}));
    if (!statsByChem?.[chemicalName]) {
        statsByChem[chemicalName] = {};
        statsByChem[chemicalName] = {
            valueMin: Infinity, valueMax: -Infinity,
            depthMin: Infinity, depthMax: -Infinity,
            unit: unit
        };
    } else if (unit && !statsByChem[chemicalName].unit) {
        statsByChem[chemicalName].unit = unit;
    }

    Object.keys(values || {}).forEach(sampleName => {
        const value = values[sampleName];
        if (value != null && !isNaN(value)) {
            if (value < statsByChem[chemicalName].valueMin) statsByChem[chemicalName].valueMin = value;
            if (value > statsByChem[chemicalName].valueMax) statsByChem[chemicalName].valueMax = value;
        }
        
        // Get depth for this sample
        const depth = sampleDepths[sampleName];
//console.log('Looking up depth for:', sampleName, 'found:', depth);
        if (depth != null && !isNaN(depth)) {
            if (depth < statsByChem[chemicalName].depthMin) statsByChem[chemicalName].depthMin = depth;
            if (depth > statsByChem[chemicalName].depthMax) statsByChem[chemicalName].depthMax = depth;
        }
    });

    const { valueMax } = statsByChem[chemicalName];
    if (valueMax === -Infinity || valueMax === Infinity || valueMax === 0) {
        return statsByChem;
    }
//console.log('Stats for', chemicalName, ':', statsByChem[chemicalName]);
    return statsByChem
}

    function computeContaminationStats() {
        let statsByChem = {};
//console.log('selectedSampleMeasurements datasets:', Object.keys(selectedSampleMeasurements));
        
        // Process each dataset separately to maintain sample name context
        Object.keys(selectedSampleMeasurements).forEach(datasetName => {
            const dataset = selectedSampleMeasurements[datasetName];
//console.log('Processing dataset:', datasetName);
            
            Object.keys(dataset).forEach(sheetName => {
                const sheet = dataset[sheetName];
                if (!sheet?.chemicals) return;
                const unit = extractUnit(sheet['Unit of measurement']);
                
                if (sheet?.total) {
                    const total = sheet.total;
                    // Prefix sample names with dataset name to match sampleDepths keys
                    const prefixedTotal = {};
                    for (const sample in total) {
                        prefixedTotal[`${datasetName}: ${sample}`] = total[sample];
                    }
//console.log('Total samples with prefix:', Object.keys(prefixedTotal));
                    statsByChem = computeIndividualStats(statsByChem, unit, prefixedTotal, 'Total ' + sheetName);
                }
                
                if (sheetName === 'PAH data'){
                    let lmwSum = {};
                    let hmwSum = {};
                    const gorham = sheet.gorhamTest;
                    for(const sample in gorham) {
                        lmwSum[`${datasetName}: ${sample}`] = gorham[sample].lmwSum;
                        hmwSum[`${datasetName}: ${sample}`] = gorham[sample].hmwSum;
                    }
                    statsByChem = computeIndividualStats(statsByChem, unit, lmwSum, 'LMW PAH Sum');
                    statsByChem = computeIndividualStats(statsByChem, unit, hmwSum, 'HMW PAH Sum');
                }
                
                if (sheetName === 'PCB data'){
                    let ices7 = {};
                    let all = {};
                    const pcbSums = sheet.congenerTest;
console.log('PCB samples with prefix:',datasetName, pcbSums);
                    for(const sample in pcbSums) {
console.log('datasetName:', datasetName, 'sample:', sample, 'ICES7:', pcbSums[sample].ICES7, 'All:', pcbSums[sample].All);
                        ices7[`${datasetName}: ${sample}`] = pcbSums[sample].ICES7;
                        all[`${datasetName}: ${sample}`] = pcbSums[sample].All;
                    }
                    statsByChem = computeIndividualStats(statsByChem, unit, ices7, 'ICES7 PCB Sum');
                    statsByChem = computeIndividualStats(statsByChem, unit, all, 'All PCB Sum');
                }
                
                Object.keys(sheet.chemicals).forEach(chemicalName => {
                    const chemical = sheet.chemicals[chemicalName];
                    // Prefix sample names with dataset name to match sampleDepths keys
                    const prefixedSamples = {};
                    for (const sample in chemical.samples) {
                        prefixedSamples[`${datasetName}: ${sample}`] = chemical.samples[sample];
                    }
//console.log('Chemical', chemicalName, 'samples with prefix:', Object.keys(prefixedSamples));
                    statsByChem = computeIndividualStats(statsByChem, unit, prefixedSamples, chemicalName);
                });
            });
        });

        Object.keys(statsByChem).forEach(chemicalName => {
            const s = statsByChem[chemicalName];
            if (s.valueMin === Infinity) s.valueMin = 0;
            if (s.valueMax === -Infinity) s.valueMax = 0;
            if (s.depthMin === Infinity) s.depthMin = depthStatsGlobal.min || 0;
            if (s.depthMax === -Infinity) s.depthMax = depthStatsGlobal.max || 0;
            const valueMax = s.valueMax;

            const unitScales = {
                'g/kg': 1,
                'mg/kg': 1e-3,
                'µg/kg': 1e-6,
                'ng/kg': 1e-9,
                'pg/kg': 1e-12,
                'fg/kg': 1e-15
            };

            const currentUnit = s.unit;
            const currentScaleFactor = unitScales[currentUnit];

            let bestRescale = 1;
            let bestUnit = currentUnit;
            let bestFitFound = false;
            if (!(valueMax > 1.0 && valueMax <= 1001.0)) {
                const valueMaxInG = valueMax * currentScaleFactor;
                for (const [newUnit, scaleFactor] of Object.entries(unitScales)) {
                    const scaledValue = valueMaxInG / scaleFactor;
                    if ((scaledValue) > 1.0 && (scaledValue <= 1001)) {
                        bestRescale = currentScaleFactor / scaleFactor;
                        bestUnit = newUnit;
                        bestFitFound = true;
                        break;
                    }
                }
            }

            statsByChem[chemicalName].rescale = bestRescale;
            if (bestFitFound) {
                statsByChem[chemicalName].unit = bestUnit;
            }
        });
        return statsByChem;
    }

    depthSortedSampleIds = Object.keys(sampleDepths).sort((a, b) => {
        return sampleDepths[b] - sampleDepths[a];
    });

    // delete current max lat etc to account if samples have been added or deleted
    minLat = null, maxLat = null, minLon = null, maxLon = null;
    depthSortedSampleIds.forEach(fullSample => {
        let parts = fullSample.split(": ");
        if (parts.length > 2) parts[1] = parts[1] + ': ' + parts[2];
        const dateSampled = parts[0];
        const sample = parts[1];
        const currentColor = dateColors[dateSampled];
//console.log(`Processing sample: ${fullSample} (Date: ${dateSampled}, Sample: ${sample})`);
        if (selectedSampleInfo[dateSampled]?.position[sample]?.hasOwnProperty('Position latitude')) {
            const lat = parseFloat(selectedSampleInfo[dateSampled].position[sample]['Position latitude']);
            const lon = parseFloat(selectedSampleInfo[dateSampled].position[sample]['Position longitude']);
            if (!isNaN(lat) && !isNaN(lon)) {
                if (maxLat === null) { minLat = lat; maxLat = lat; minLon = lon; maxLon = lon; }
                else {
                    if (lat > maxLat) maxLat = lat; else if (lat < minLat) minLat = lat;
                    if (lon > maxLon) maxLon = lon; else if (lon < minLon) minLon = lon;
                }
                sampleNo += 1;
                const dateLabel = selectedSampleInfo[dateSampled].label;
                const sampleLabel = selectedSampleInfo[dateSampled].position[sample].label;
                const alternateName = `${dateLabel}: ${sampleLabel}`;
                const depth = sampleDepths[fullSample];
                const radius = getDepthRadius(depth, depthStatsGlobal.min, depthStatsGlobal.max);
                const originalCircleOptions = {
                    radius: radius, fillColor: currentColor, color: "#000", weight: 1, opacity: 1, fillOpacity: 0.9
                };
                marker = L.circleMarker([lat, lon], originalCircleOptions)
                    .bindTooltip(alternateName);
                marker.options.customId = fullSample;
                marker.options.originalStyle = originalCircleOptions;
                marker.options.isHighlighted = false;

                marker.on('click', (e) => createHighlights(e.target.options.customId));
                highlightMarkers[fullSample] = L.circleMarker(new L.LatLng(lat, lon), highlightStyle).bindTooltip(alternateName);
                highlightMarkers[fullSample].options.customId = fullSample;
                highlightMarkers[fullSample].on('click', (e) => createHighlights(e.target.options.customId));
                noLocations += 1;
                latSum += lat;
                lonSum += lon;
            }
        } else {
            sampleNo += 1;
            highlightMarkers[fullSample] = null;
        }
        markers[dateSampled][fullSample] = marker;
        if (marker) {
            allMapMarkers.push(marker);
            const alternateName = marker.getTooltip().getContent();
            const permanentMarkerStyle = { ...marker.options.originalStyle, interactive: false };
            const permanentMarker = L.circleMarker(marker.getLatLng(), permanentMarkerStyle);
            permanentMarker.bindTooltip(alternateName, { permanent: true, direction: 'auto', className: 'no-overlap-tooltip' });
        }
    });

    let markerLayers = {};
    datesSampled.forEach(dateSampled => {
        markerLayers[dateSampled] = [];
        const dsKeys = Object.keys(markers[dateSampled]);
        dsKeys.forEach(sampleKey => {
            if (markers[dateSampled][sampleKey]) markerLayers[dateSampled].push(markers[dateSampled][sampleKey]);
        });
    });
    datasetLayers = {};
    datesSampled.forEach(dateSampled => {
        datasetLayers[dateSampled] = L.layerGroup(markerLayers[dateSampled]);
    });
//console.log(sampleMeasurements);
    contaminantStats = computeContaminationStats();
    let contaminantMarkerData = {};

    // Build a lookup of all chemical values by sample (with full sample names)
    let allChemicalValues = {};
    
    Object.keys(selectedSampleMeasurements).forEach(datasetName => {
        const dataset = selectedSampleMeasurements[datasetName];
        Object.keys(dataset).forEach(sheetName => {
            const sheet = dataset[sheetName];
            if (!sheet?.chemicals) return;
            
            if (sheet?.total) {
                const chemicalName = 'Total ' + sheetName;
                if (!allChemicalValues[chemicalName]) allChemicalValues[chemicalName] = {};
                for (const sample in sheet.total) {
                    const fullSampleName = `${datasetName}: ${sample}`;
                    allChemicalValues[chemicalName][fullSampleName] = sheet.total[sample];
                }
            }
            
            if (sheetName === 'PAH data'){
                const gorham = sheet.gorhamTest;
                if (!allChemicalValues['LMW PAH Sum']) allChemicalValues['LMW PAH Sum'] = {};
                if (!allChemicalValues['HMW PAH Sum']) allChemicalValues['HMW PAH Sum'] = {};
                for(const sample in gorham) {
                    const fullSampleName = `${datasetName}: ${sample}`;
                    allChemicalValues['LMW PAH Sum'][fullSampleName] = gorham[sample].lmwSum;
                    allChemicalValues['HMW PAH Sum'][fullSampleName] = gorham[sample].hmwSum;
                }
            }
            
            if (sheetName === 'PCB data'){
                const pcbSums = sheet.congenerTest;
                if (!allChemicalValues['ICES7 PCB Sum']) allChemicalValues['ICES7 PCB Sum'] = {};
                if (!allChemicalValues['All PCB Sum']) allChemicalValues['All PCB Sum'] = {};
                for(const sample in pcbSums) {
                    const fullSampleName = `${datasetName}: ${sample}`;
                    allChemicalValues['ICES7 PCB Sum'][fullSampleName] = pcbSums[sample].ICES7;
                    allChemicalValues['All PCB Sum'][fullSampleName] = pcbSums[sample].All;
                }
            }
            
            Object.keys(sheet.chemicals).forEach(chemicalName => {
                const chemical = sheet.chemicals[chemicalName];
                if (!allChemicalValues[chemicalName]) allChemicalValues[chemicalName] = {};
                for (const sample in chemical.samples) {
                    const fullSampleName = `${datasetName}: ${sample}`;
                    allChemicalValues[chemicalName][fullSampleName] = chemical.samples[sample];
                }
            });
        });
    });

    // Now create layers for each chemical, processing all samples in depth order
    Object.keys(allChemicalValues).forEach(chemicalName => {
        createContaminantLayer(chemicalName, allChemicalValues[chemicalName]);
    });

    function createContaminantLayer(chemicalName, sampleValues) {
        if (!contaminantLayers[chemicalName]) contaminantLayers[chemicalName] = L.layerGroup();
        if (!contaminantMarkerData[chemicalName]) contaminantMarkerData[chemicalName] = [];
        
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        
        const unit = stats.unit;
        const depthMin = stats.depthMin;
        const depthMax = stats.depthMax;
        
//console.log(`createContaminantLayer for ${chemicalName}: depthMin=${depthMin}, depthMax=${depthMax}`);
        
        // Process samples in depth order (deepest first) - THIS IS THE KEY FIX
        depthSortedSampleIds.forEach(fullSampleName => {
            const value = sampleValues[fullSampleName];
            if (value == null || isNaN(value)) return;
            
            const rescaledValue = value * stats.rescale;
            
            // Parse the fullSampleName to get dataset and sample
            let parts = fullSampleName.split(": ");
            if (parts.length > 2) parts = [parts[0], parts.slice(1).join(": ")];
            const datasetName = parts[0];
            const sampleName = parts[1];
            
            const sampleInfo = selectedSampleInfo[datasetName]?.position?.[sampleName];
            if (!sampleInfo) return;
            
            const lat = parseFloat(sampleInfo["Position latitude"]);
            const lon = parseFloat(sampleInfo["Position longitude"]);
            if (isNaN(lat) || isNaN(lon)) return;
            
            const depth = sampleDepths[fullSampleName];
            const initialRadius = getLogDepthRadius3Levels(depth, depthMin, depthMax);
            
//console.log(`${chemicalName} - Sample: ${fullSampleName}, Depth: ${depth}, Radius: ${initialRadius}`);
            
            const sampleLabel = selectedSampleInfo[datasetName]?.label + ' : ' + sampleInfo.label;
            const unitSuffix = unit ? ` ${unit}` : "";
            const tooltipHtml = `${sampleLabel}<br>${chemicalName}: ${rescaledValue.toFixed(2)}${unitSuffix}<br>Depth: ${depth} m`;
            
            const m = L.circleMarker([lat, lon], {
                radius: initialRadius,
                fillColor: "#999",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindTooltip(tooltipHtml);
            m.options._chemValue = rescaledValue.toFixed(2);
            m.options._chemUnit = unit || "";
            m.options._depth = depth;
            m.options.customId = fullSampleName;
            contaminantLayers[chemicalName].addLayer(m);
            contaminantMarkerData[chemicalName].push(m);
        });
    }

    Object.keys(contaminantLayers).forEach(chem => applyDynamicStyling(chem));

    Object.keys(contaminantMarkerData).forEach(chemicalName => {
        const items = contaminantMarkerData[chemicalName];
        if (!items || items.length === 0) return;
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        const heatmapLayer = L.layerGroup();
        items.sort((a, b) => (b.options._depth ?? -1) - (a.options._depth ?? -1)).forEach(marker => {
            const point = {
                lat: marker.getLatLng().lat,
                lng: marker.getLatLng().lng,
                value: marker.options._chemValue,
                depth: marker.options._depth
            };
            if (isNaN(point.lat) || isNaN(point.lng)) return;
            const normalizedLevel = Math.min((point.value - stats.valueMin) / (stats.valueMax - stats.valueMin || 1), 1);
            for (let i = 3; i >= 1; i--) {
                let baseRadius = (point.depth != null && !isNaN(point.depth)) ? 100 + (getLogDepthRadius3Levels(point.depth, stats.depthMin, stats.depthMax) - 6) * 5 : 100;
                const layerScale = 0.3 + (i - 1) * 0.35;
                const valueScale = 0.5 + normalizedLevel * 1.0;
                const radius = baseRadius * layerScale * valueScale;
                const opacity = (0.4 / i) * (0.4 + normalizedLevel * 0.8);
                const color = getHeatmapColor(normalizedLevel);
                L.circle([point.lat, point.lng], {
                    radius: radius,
                    fillColor: color,
                    color: 'transparent',
                    fillOpacity: opacity,
                    weight: 0
                }).addTo(heatmapLayer);
            }
        });
        contaminantHeatmaps[chemicalName] = heatmapLayer;
    });

    allMapData.isReady = true;
    allMapData.contaminantLayers = contaminantLayers;
    allMapData.contaminantHeatmaps = contaminantHeatmaps;
    allMapData.contaminantStats = contaminantStats;
}

function forceMapRefresh(containerId) {
    const container = document.getElementById(containerId);
    if (container && container._leaflet_map) {
        const map = container._leaflet_map;
        
        setTimeout(() => {
            map.invalidateSize(true);
            setTimeout(() => {
                map.invalidateSize({ pan: false });
                setTimeout(() => {
                    map.invalidateSize(true);
                    map.eachLayer(layer => {
                        if (layer._url) {
                            layer.redraw();
                        }
                    });
                }, 50);
            }, 50);
        }, 50);
    }
}

function ClaudeV4createStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    if (container._leaflet_id !== undefined) {
        console.log(`Removing existing map from container with ID: ${containerId}`);
        container._leaflet_map.remove();
        delete container._leaflet_map;
    }
    
    const staticMap = L.map(containerId, {
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

    const baseLayerInstance = baseLayers[mapTile] || baseLayers['OpenStreetMap'];
    const tileLayerUrl = baseLayerInstance._url;
    const tileLayerOptions = baseLayerInstance.options;

    L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(staticMap);

    let layerToAdd;
    if (visualizationType === 'points' && allMapData.contaminantLayers[contaminantName]) {
        layerToAdd = L.layerGroup();
        allMapData.contaminantLayers[contaminantName].eachLayer(layer => {
            const clonedLayer = L.circleMarker(layer.getLatLng(), { ...layer.options });
            if (layer.getTooltip()) {
                clonedLayer.bindTooltip(layer.getTooltip().getContent(), { ...layer.getTooltip().options });
            }
            layerToAdd.addLayer(clonedLayer);
        });
    } else if (visualizationType === 'heatmap' && allMapData.contaminantHeatmaps[contaminantName]) {
        layerToAdd = L.layerGroup();
        allMapData.contaminantHeatmaps[contaminantName].eachLayer(layer => {
            layerToAdd.addLayer(L.circle(layer.getLatLng(), { ...layer.options }));
        });
    }

    if (layerToAdd) {
        layerToAdd.addTo(staticMap);
                    //srg251130 --- CHANGE START ---
                    // 1. Add listeners to this static map to update marker sizes on zoom/resize
                    staticMap.on('zoomend resize', function() {
                         // Only apply styling if we are in 'points' mode (not heatmap)
                        if (visualizationType === 'points') {
                            applyDynamicStyling(contaminantName, staticMap.getZoom());
                        }
                    });
                    // --- CHANGE END ---        
        const bounds = new L.LatLngBounds([]);
        layerToAdd.eachLayer(layer => {
            if (layer.getLatLng) {
                bounds.extend(layer.getLatLng());
            }
        });
        if (bounds.isValid()) {
            setTimeout(() => {
                container.offsetWidth;
                staticMap.invalidateSize();
                staticMap.fitBounds(bounds, { padding: [20, 20] });
                   
                            //srg251130 --- CHANGE START ---
                            // 2. Force an immediate style update after the bounds are fitted
                            if (visualizationType === 'points') {
                                // We calculate the target zoom manually or grab it after a short delay
                                // The most reliable way here is to run it in the same timeout stack
                                applyDynamicStyling(contaminantName, staticMap.getBoundsZoom(bounds));
                            }
                            // --- CHANGE END ---

            }, 150);
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }
}

function createStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', showLegend = false , mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    if (container._leaflet_id !== undefined) {
        console.log(`Removing existing map from container with ID: ${containerId}`);
        container._leaflet_map.remove();
        delete container._leaflet_map;
    }

    let mapCreated = false;
    const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
            const { width, height } = entry.contentRect;
            console.log(`Container ${containerId} resized to: ${width}x${height}`);
            
            if (!mapCreated && width > 100 && height > 100) {
                mapCreated = true;
                resizeObserver.disconnect();
                
                console.log(`Creating map for ${containerId} with dimensions ${width}x${height}`);
                
                const staticMap = L.map(containerId, {
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

                const baseLayerInstance = baseLayers[mapTile] || baseLayers['OpenStreetMap'];
                const tileLayerUrl = baseLayerInstance._url;
                const tileLayerOptions = baseLayerInstance.options;

                L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(staticMap);

                let layerToAdd;
                if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
                    layerToAdd = L.layerGroup();
                    contaminantLayers[contaminantName].eachLayer(layer => {
                        if (layer instanceof L.CircleMarker) {
                            const options = { ...layer.options };
                            if (options.radius) {
                                options.radius = options.radius * 0.3;
                            }
                            const clonedLayer = L.circleMarker(layer.getLatLng(), options);
                            layerToAdd.addLayer(clonedLayer);
                        }
                    });
                } else if (visualizationType === 'heatmap' && contaminantHeatmaps[contaminantName]) {
                    layerToAdd = contaminantHeatmaps[contaminantName];
                }

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
                        }, 50);
                    }
                    if (showLegend) {
                        if (contaminantStats[contaminantName]) {
                            const legend = L.control({ position: 'leftright' });
                            legend.onAdd = function () {
                                const div = L.DomUtil.create('div', 'info legend');
                                const stats = contaminantStats[contaminantName];
                                const unit = stats.unit ? ` ${stats.unit}` : "";
                                const min = stats.valueMin*stats.rescale, max = stats.valueMax*stats.rescale;
                                const colors = ["#d73027", "#d73027", "#d73027", "#d73027"];
                                div.innerHTML = `
                <h4>${contaminantName}</h4>
                <strong>Value</strong>
                <div style="
                    height: 20px;
                    width: 100%;
                    background: linear-gradient(to right, ${colors.join(",")});
                    border: 1px solid #999;
                    margin-bottom: 5px;
                "></div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span>${isFinite(min) ? min.toFixed(2) : '—'}${unit}</span>
                    <span>${isFinite(max) ? max.toFixed(2) : '—'}${unit}</span>
                </div>
            `;
                                return div;
                            };
                            legend.addTo(staticMap);
                        }
                    }
                } else {
                    console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
                }

                // Add shapes if enabled
                if (includeShapesOnStaticMaps && allShapeLayers.length > 0) {
                    allShapeLayers.forEach((originalLayer, index) => {
                        let clonedLayer;
                        if (originalLayer instanceof L.Polygon) {
                            clonedLayer = L.polygon(originalLayer.getLatLngs());
                        } else if (originalLayer instanceof L.Polyline) {
                            clonedLayer = L.polyline(originalLayer.getLatLngs());
                        }
                        if (clonedLayer) {
                            const style = getShapeStyleForContaminant(originalLayer, contaminantName, index);
                            clonedLayer.setStyle(style);
                            clonedLayer.addTo(staticMap);
                        }
                    });
                }
            }
        });
    });

    resizeObserver.observe(container);
    
}

function sampleMap(meas) {
    if (map) map.remove();
    isHeatmapMode = false;
    activeContaminant = null;
    allShapeLayers = [];

    const markerColors = ['#FF5733', '#33CFFF', '#33FF57', '#FF33A1', '#A133FF', '#FFC300', '#33FFA1', '#C70039', '#900C3F'];
    const datesSampled = Object.keys(selectedSampleInfo);
    let colorIndex = 0;
    let allSamples = [];
    let noSamples = 0;
    let markers = {};
    let marker = null;
    let sampleNo = -1;
    dateColors = {};
    datesSampled.forEach(dateSampled => {
        markers[dateSampled] = {};
        dateColors[dateSampled] = markerColors[colorIndex];
        colorIndex = (colorIndex + 1) % markerColors.length;
        const dsSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        noSamples += dsSamples.length;
        dsSamples.forEach(sample => allSamples.push(`${dateSampled}: ${sample}`));
    });

    datesSampled.sort((a, b) => {
        const labelA = selectedSampleInfo[a].label || a;
        const labelB = selectedSampleInfo[b].label || b;
        return labelA.localeCompare(labelB);
    });

    const legendData = [];
    datesSampled.forEach(dateSampled => {
        const color = dateColors[dateSampled];
        const label = selectedSampleInfo[dateSampled].label || dateSampled;
        const svgIcon = `<svg height="18" width="18" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="7" stroke="black" stroke-width="1" fill="${color}" /></svg>`;
        const iconUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;
        legendData.push({ label, iconUrl });
    });
    populateMapLegend(legendData);
    if (!(xAxisSort === 'normal')) {
        allSamples.sortComplexSamples();
    }
    const hoverStyle = { radius: 10, weight: 3, opacity: 1, fillOpacity: 1 };

/*    map = L.map('map', {
        center: [54.596, -1.177],
        zoom: 13,
        layers: [baseLayers.OpenStreetMap]
    });*/


    // ... inside sampleMap(meas) in sdeMaps.js ...

    map = L.map('map', {
        center: [54.596, -1.177],
        zoom: 13,
        layers: [baseLayers.OpenStreetMap]
    });

    // Define a global variable for the control if you haven't already
    let layerControl;

    // Initialize the control only once
    if (!layerControl) {
        // (null represents base layers, which we aren't changing here)
        layerControl = L.control.layers(null, {}, { collapsed: true }).addTo(map);
    }


    // --- ADD START: Measurement Tools ---
    
    // 1. Create a FeatureGroup to store the things you draw
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // 2. Configure the tools (turn on metric measurements and area display)
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polyline: {
                metric: true,    // Shows distance
                feet: false      // Disable feet to enforce metric system
            },
            polygon: {
                allowIntersection: false,
                showArea: true,  // Shows area in m² / km²
                metric: true,
                feet: false
            },
            rectangle: {
                showArea: true,
                metric: true,
                feet: false
            },
            circle: false,       // Disable tools you might not need
            marker: false,
            circlemarker: false
        }
    });

    // 3. Add the control to the map
    map.addControl(drawControl);

    // 4. Listen for the 'created' event to add the shape to the map so it persists
    map.on(L.Draw.Event.CREATED, function (e) {
        var layer = e.layer;
        drawnItems.addLayer(layer);
        
        // Optional: Add a popup showing the measurement immediately upon completion
        if (e.layerType === 'polyline') {
             // Calculate distance for polyline if needed explicitly
             // (Leaflet.draw shows it in the tooltip while drawing)
        } 
    });

    // --- ADD END ---

    // ... existing code continues (map.on('zoomend'...) ...

    // Add zoom event listener to update marker sizes
//srg251130 --- CHANGE START ---
    // Combine zoomend and resize events to ensure markers always scale correctly
    map.on('zoomend resize', function() {
        const currentZoom = map.getZoom();
        
        // Update sample location markers
        Object.keys(datasetLayers).forEach(datasetName => {
            datasetLayers[datasetName].eachLayer(marker => {
                if (marker.options.originalStyle && marker.options.originalStyle.radius) {
                    const depth = sampleDepths[marker.options.customId];
                    const newRadius = getDepthRadius(depth, depthStatsGlobal.min, depthStatsGlobal.max, currentZoom);
                    marker.setRadius(newRadius);
                    marker.options.originalStyle.radius = newRadius;
                }
            });
        });
        
        // Update contaminant markers if a contaminant layer is active
        if (activeContaminant && contaminantLayers[activeContaminant]) {
            applyDynamicStyling(activeContaminant, currentZoom);
        }
    });
    // --- CHANGE END ---

/* srg251130    map.on('zoomend', function() {
        const currentZoom = map.getZoom();
        
        // Update sample location markers
        Object.keys(datasetLayers).forEach(datasetName => {
            datasetLayers[datasetName].eachLayer(marker => {
                if (marker.options.originalStyle && marker.options.originalStyle.radius) {
                    const depth = sampleDepths[marker.options.customId];
                    const newRadius = getDepthRadius(depth, depthStatsGlobal.min, depthStatsGlobal.max, currentZoom);
                    marker.setRadius(newRadius);
                    marker.options.originalStyle.radius = newRadius;
                }
            });
        });
        
        // Update contaminant markers if a contaminant layer is active
        if (activeContaminant && contaminantLayers[activeContaminant]) {
            applyDynamicStyling(activeContaminant, currentZoom);
        }
    });*/

    Object.keys(datasetLayers).forEach(datasetName => {
        datasetLayers[datasetName].addTo(map);
    });

    let shapeOverlay = {};
    const kmlColors = ['#FF0000', '#00FF00', '#0000FF'];
    let colorNo = 0;

for (const filename in kmlLayers) {
        const url = kmlLayers[filename];
        const kmlLayer = new L.KML(url, { async: true });

        // Add the layer to the "Legend" Control
        // 'filename' will be the text shown in the list (e.g., "MLA_2025_00263-LOCATIONS.kml")
        layerControl.addOverlay(kmlLayer, filename);

        kmlLayer.on("loaded", function (e) {
            
            // Helper: Extract ONLY the name from the popup HTML structure
            function extractNameFromPopup(layer) {
                if (layer.getPopup && layer.getPopup()) {
                    const content = layer.getPopup().getContent();
                    
                    if (typeof content === 'string') {
                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = content;
                        
                        // Strategy 1: Look for a Header tag
                        const header = tempDiv.querySelector('h2, h3, h4, h5, h6');
                        if (header) return header.innerText.trim();
                        
                        // Strategy 2: Look for a Bold tag
                        const bold = tempDiv.querySelector('b, strong');
                        if (bold) return bold.innerText.trim();

                        // Strategy 3: Fallback (Text before new line)
                        const cleanText = tempDiv.innerText || tempDiv.textContent;
                        return cleanText.split(/[\n\r]/)[0].trim();
                    }
                }
                return "";
            }

            function processLayerRecursive(layer, parentName) {
                // 1. Try to find the name in standard locations
                let currentName = layer.options?.name || layer.name || layer.feature?.properties?.name;
                
                // 2. If not found, extract from Popup
                if (!currentName) {
                    currentName = extractNameFromPopup(layer);
                }

                // 3. Inherit from Parent
                if (!currentName) {
                    currentName = parentName;
                }
                
                // 4. Recursion
                if (layer.eachLayer) {
                    layer.eachLayer(child => processLayerRecursive(child, currentName));
                }

                // 5. Apply to Polygon
                if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                    
                    // --- Calculate Area ---
                    let areaLabel = "";
                    if (layer instanceof L.Polygon) {
                        let area = 0;
                        const latLngs = layer.getLatLngs();
                        if (Array.isArray(latLngs) && latLngs.length > 0) {
                             if (Array.isArray(latLngs[0]) && !Array.isArray(latLngs[0][0]) && typeof latLngs[0][0] !== 'number') {
                                area = L.GeometryUtil.geodesicArea(latLngs[0]);
                                for (let i = 1; i < latLngs.length; i++) {
                                    area -= L.GeometryUtil.geodesicArea(latLngs[i]);
                                }
                            } else {
                                area = L.GeometryUtil.geodesicArea(latLngs);
                            }
                        }
                        const areaHa = area / 10000; 
                        areaLabel = `Area: ${areaHa.toFixed(2)} ha`;
                    }

                    // --- Tooltip Construction ---
                    let tooltipContent = "";
                    if (currentName) {
                        tooltipContent += `<b>${currentName}</b><br>`;
                        layer.options.name = currentName;
                    }
                    tooltipContent += areaLabel;

                    layer.bindTooltip(tooltipContent, { sticky: true });
                    layer.options.baseTooltip = tooltipContent;
                    allShapeLayers.push(layer);

                    // --- Style Override ---
                    layer.setStyle({
                        color: kmlColors[colorNo], 
                        weight: 2, 
                        opacity: 0.5,
                        fillColor: kmlColors[colorNo], 
                        fillOpacity: 0.2
                    });
                }
            }

            processLayerRecursive(e.target, "");
            colorNo = (colorNo + 1) % kmlColors.length;
        });

        shapeOverlay[filename] = kmlLayer;
        kmlLayer.addTo(map);
    }
    
/*    for (const filename in kmlLayers) {
        const url = kmlLayers[filename];
        const kmlLayer = new L.KML(url, { async: true });
        kmlLayer.on("loaded", function (e) {
            const mainLayer = Object.values(e.target._layers)[0];
console.log('KML Layer', mainLayer);
            if (mainLayer && mainLayer._layers) {
                Object.values(mainLayer._layers).forEach(layer => {
                    if (layer instanceof L.Polygon) {
                        let area = 0;
                        const latLngs = layer.getLatLngs();
                        if (Array.isArray(latLngs) && latLngs.length > 0) {
                            if (Array.isArray(latLngs[0])) {
                                area = L.GeometryUtil.geodesicArea(latLngs[0]);
                                for (let i = 1; i < latLngs.length; i++) {
                                    area -= L.GeometryUtil.geodesicArea(latLngs[i]);
                                }
                            } else {
                                area = L.GeometryUtil.geodesicArea(latLngs);
                            }
                        }
                        const areaHa = area / 10000;
console.log('KML Layer',layer);
                        const name = layer.options.name || layer.name || "";
                        let tooltipContent = "";
                        if (name !== "") {
                            tooltipContent = `${name}<br>Area: ${areaHa.toFixed(2)} ha`;
                        } else {
                            tooltipContent = `Area: ${areaHa.toFixed(2)} ha`;
                        }
                        layer.bindTooltip(tooltipContent);
                        allShapeLayers.push(layer);

                        layer.setStyle({
                            color: kmlColors[colorNo], weight: 2, opacity: 0.5,
                            fillColor: kmlColors[colorNo], fillOpacity: 0.2
                        });
                    } else if (layer instanceof L.Polyline) {
                        layer.setStyle({
                            color: kmlColors[colorNo], weight: 2, opacity: 0.5,
                            fillColor: kmlColors[colorNo], fillOpacity: 0.2
                        });
                    }
                });
            }
            colorNo = (colorNo + 1) % kmlColors.length;
        });
        shapeOverlay[filename] = kmlLayer;
        kmlLayer.addTo(map);
    }*/
    
    if (noLocations > 0) {
        let seCorner = L.latLng(minLat, minLon);
        let nwCorner = L.latLng(maxLat, maxLon);
        const bounds = L.latLngBounds(seCorner, nwCorner);
        map.fitBounds(bounds);
    }

console.log("Map created", noLocations, noSamples);

    function toggleVisualizationMode() {
        if (!activeContaminant) return;
        let currentContaminant = activeContaminant;
        if (isHeatmapMode) {
            if (contaminantHeatmaps[activeContaminant] && map.hasLayer(contaminantHeatmaps[activeContaminant])) {
                map.removeLayer(contaminantHeatmaps[activeContaminant]);
            }
            activeContaminant = currentContaminant;
            if (contaminantLayers[activeContaminant]) {
                map.addLayer(contaminantLayers[activeContaminant]);
                applyDynamicStyling(activeContaminant);
            }
            isHeatmapMode = false;
            updateLegendForMode();
        } else {
            if (contaminantLayers[activeContaminant] && map.hasLayer(contaminantLayers[activeContaminant])) {
                map.removeLayer(contaminantLayers[activeContaminant]);
            }
            activeContaminant = currentContaminant;
            if (contaminantHeatmaps[activeContaminant]) {
                map.addLayer(contaminantHeatmaps[activeContaminant]);
            }
            isHeatmapMode = true;
            updateLegendForMode();
        }
    }

    let legend = L.control({ position: "bottomleft" });
    legend.onAdd = function () {
        this._div = L.DomUtil.create("div", "info legend");
        this.update();
        return this._div;
    };
    function makeDepthLegend(min, max) {
        const mid = (min + max) / 2;
        const values = [min, mid, max];
        return values.map(v => `
<svg height="30" width="60" style="vertical-align:middle">
<circle cx="25" cy="15" r="${getDepthRadius(v, min, max)}"
stroke="black" stroke-width="1"
fill="grey" fill-opacity="0.6" />
</svg> ≈ ${isFinite(v) ? v.toFixed(2) : '—'} m
`).join("<br>");
    }

    function updateLegendForMode() {
        if (!activeContaminant) {
            legend.update();
            return;
        }
        legend.update({ chemicalName: activeContaminant });
    }

    legend.update = function (props) {
        if (!props || !activeContaminant) {
            this._div.innerHTML = `<h4>Contaminant legend</h4><i>Toggle a contaminant layer</i>`;
            return;
        }
        const { chemicalName } = props;
        const stats = contaminantStats[chemicalName];
        if (!stats) {
            this._div.innerHTML = "<h4>Contaminant legend</h4><i>No data</i>";
            return;
        }
        const unit = stats.unit ? ` ${stats.unit}` : "";
        const min = stats.valueMin*stats.rescale, max = stats.valueMax*stats.rescale;
        const { breaks, colors } = getColorScale(min, max, chemicalName);
        const toggleButton = `<button onclick="window.toggleVisualizationMode()" style="background: #007cba; color: white; border: none;padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; width: 100%; font-size: 12px;">Switch to ${isHeatmapMode ? 'Points' : 'Heatmap'}</button>`;
        const toggleColorButton = `<button onclick="window.toggleColorMode()" style="background: #007cba; color: white; border: none;padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; width: 100%; font-size: 12px;">Color: ${colorMode === 'scale' ? 'Scale' : 'Standards'}</button>`;
        let toggleUpperLevelButton = '';
        if (colorMode === 'standards') {
             toggleUpperLevelButton = `<button onclick="window.toggleUpperLevelMode()" style="background: #007cba; color: white; border: none;padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; width: 100%; font-size: 12px;">Upper Limit: ${upperLevelMode === '10x' ? '10x Level 1' : 'None'}</button>`;
        }
        let toggleShapeColorButton = '';
        if (allShapeLayers.length > 0) {
             toggleShapeColorButton = `<button onclick="window.toggleShapeColorMode()" style="background: #007cba; color: white; border: none;padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; width: 100%; font-size: 12px;">Shape Color: ${shapesColoredByData ? 'Data' : 'Default'}</button>`;
        }
        const legendType = isHeatmapMode ? 'Heat Intensity' : 'Point Colours';
        let legendContent = '';
        if (isHeatmapMode) {
            legendContent = `
<div style="height: 20px; width: 100%; background: linear-gradient(to right, #1a9850, #fee08b, #fc8d59, #d73027); border: 1px solid #999; margin-bottom: 5px;"></div>
<div style="display: flex; justify-content: space-between; font-size: 12px;">
<span>Low</span>
<span>High</span>
</div>
`;
        } else if (colorMode === 'standards') {
            if (colors.length === 3) {
            const al1 = breaks[0];
            const al2 = breaks[1];
            legendContent = `
<div style="display: flex; align-items: center; margin-bottom: 4px;">
<span style="background:${colors[0]}; width: 15px; height: 15px; display: inline-block; margin-right: 5px; border: 1px solid #999;"></span>
<span>Below ${al1.toFixed(2)} ${unit}</span>
</div>
<div style="display: flex; align-items: center; margin-bottom: 4px;">
<span style="background:${colors[1]}; width: 15px; height: 15px; display: inline-block; margin-right: 5px; border: 1px solid #999;"></span>
<span>${al1.toFixed(2)} - ${al2.toFixed(2)} ${unit}</span>
</div>
<div style="display: flex; align-items: center;">
<span style="background:${colors[2]}; width: 15px; height: 15px; display: inline-block; margin-right: 5px; border: 1px solid #999;"></span>
<span>Above ${al2.toFixed(2)} ${unit}</span>
</div>
`;
            } else if (colors.length === 2) {
                const al1 = breaks[0];
                legendContent = `
<div style="display: flex; align-items: center; margin-bottom: 4px;">
<span style="background:${colors[0]}; width: 15px; height: 15px; display: inline-block; margin-right: 5px; border: 1px solid #999;"></span>
<span>Below ${al1.toFixed(2)} ${unit}</span>
</div>
<div style="display: flex; align-items: center;">
<span style="background:${colors[1]}; width: 15px; height: 15px; display: inline-block; margin-right: 5px; border: 1px solid #999;"></span>
<span>Above ${al1.toFixed(2)} ${unit}</span>
</div>
`;
            }
        } else {
            legendContent = `
<div style="height: 20px; width: 100%; background: linear-gradient(to right, ${colors.join(",")}); border: 1px solid #999; margin-bottom: 5px;"></div>
<div style="display: flex; justify-content: space-between; font-size: 12px;">
<span>${isFinite(min) ? min.toFixed(2) : '—'}${unit}</span>
<span>${isFinite(max) ? max.toFixed(2) : '—'}${unit}</span>
</div>
`;
        }
        const depthLegend = (!isHeatmapMode & !(stats.depthMin === stats.depthMax)) ? `
<br>
<div><strong>Sample depth → radius</strong><br>
${makeDepthLegend(stats.depthMin, stats.depthMax)}</div>
` : '';
        this._div.innerHTML = `
<h4>${chemicalName}</h4>
${toggleButton}
${toggleColorButton}
${toggleUpperLevelButton}
${toggleShapeColorButton}
<strong>${legendType}</strong>
${legendContent}
${depthLegend}
`;
    };
    legend.addTo(map);
    window.toggleVisualizationMode = toggleVisualizationMode;

    function toggleColorMode() {
        colorMode = (colorMode === 'scale') ? 'standards' : 'scale';
        if (activeContaminant) {
            applyDynamicStyling(activeContaminant, map.getZoom());
            updateLegendForMode();
        }
    }
    window.toggleColorMode = toggleColorMode;

    function toggleUpperLevelMode() {
        upperLevelMode = (upperLevelMode === '10x') ? 'flat' : '10x';
        if (activeContaminant) {
            applyDynamicStyling(activeContaminant, map.getZoom());
            updateLegendForMode();
        }
    }
    window.toggleUpperLevelMode = toggleUpperLevelMode;

    function toggleShapeColorMode() {
        shapesColoredByData = !shapesColoredByData;
        if (activeContaminant) {
            updateShapeColors(activeContaminant);
        }
        updateLegendForMode();
    }
    window.toggleShapeColorMode = toggleShapeColorMode;

    window.toggleStaticShapes = toggleStaticShapes;

function createScrollableContaminantControl() {
        const contaminantControl = L.control({ position: 'topright' });
        contaminantControl.onAdd = function(map) {
            // 1. Create the main container WITHOUT the 'expanded' class initially
            const container = L.DomUtil.create('div', 'leaflet-control-layers contaminant-control');
            
            // 2. Add the standard Leaflet toggle icon (the stack of layers image)
            const link = L.DomUtil.create('a', 'leaflet-control-layers-toggle', container);
            link.href = '#';
            link.title = 'Contaminants';
            
            // 3. Create the container for the content (hidden by default via CSS)
            const section = L.DomUtil.create('section', 'leaflet-control-layers-list', container);

            const style = document.createElement('style');
            style.textContent = `
                /* Apply size/style ONLY when expanded */
                .contaminant-control.leaflet-control-layers-expanded { 
                    width: 250px; 
                    max-height: 400px; 
                    background: white; 
                    padding: 10px;
                    border-radius: 5px;
                }
                .contaminant-search { width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box; }
                .contaminant-list { max-height: 300px; overflow-y: auto; padding: 0 4px; }
                .contaminant-item { margin: 4px 0; display: flex; align-items: center; }
                .contaminant-item input { margin-right: 8px; }
                .contaminant-item label { cursor: pointer; display: flex; align-items: center; width: 100%; padding: 2px 0; font-size: 13px; }
                .contaminant-item label:hover { background-color: #f0f0f0; }
                .contaminant-header { font-weight: bold; padding-bottom: 8px; border-bottom: 1px solid #eee; margin-bottom: 8px; }
            `;
            document.head.appendChild(style);
            
            const contaminantNames = Object.keys(contaminantLayers).sort();
            
            // 4. Inject the HTML into the 'section' (list) instead of the main div
            section.innerHTML = `
                <div class="contaminant-header">Contaminant Layers</div>
                <input type="text" class="contaminant-search" placeholder="Search contaminants..." />
                <div class="contaminant-list">
                    <div class="contaminant-item">
                        <label>
                            <input type="radio" name="contaminant" value="none" checked />
                            <strong>None (show all datasets)</strong>
                        </label>
                    </div>
                    <div style="border-bottom: 1px solid #eee; margin: 8px 0;"></div>
                    ${contaminantNames.map(chem => `
                        <div class="contaminant-item" data-name="${chem.toLowerCase()}">
                            <label>
                                <input type="radio" name="contaminant" value="${chem}" />
                                <span title="${chem}">${chem}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            `;
            
            const searchInput = section.querySelector('.contaminant-search');
            const contaminantItems = section.querySelectorAll('.contaminant-item[data-name]');
            
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                contaminantItems.forEach(item => {
                    const name = item.getAttribute('data-name');
                    if (name.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
            
            container.addEventListener('change', function(e) {
                if (e.target.type === 'radio') {
                    const selectedContaminant = e.target.value;
                    Object.keys(contaminantLayers).forEach(chem => {
                        if (map.hasLayer(contaminantLayers[chem])) map.removeLayer(contaminantLayers[chem]);
                        if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) map.removeLayer(contaminantHeatmaps[chem]);
                    });
                    
                    if (selectedContaminant === 'none') {
                        Object.keys(datasetLayers).forEach(datasetName => {
                            if (!map.hasLayer(datasetLayers[datasetName])) map.addLayer(datasetLayers[datasetName]);
                        });
                        activeContaminant = null;
                        isHeatmapMode = false;
                        legend.update();
                    } else {
                        Object.keys(datasetLayers).forEach(datasetName => {
                            if (map.hasLayer(datasetLayers[datasetName])) map.removeLayer(datasetLayers[datasetName]);
                        });
                        activeContaminant = selectedContaminant;
                        if (isHeatmapMode) {
                            if (contaminantHeatmaps[activeContaminant]) map.addLayer(contaminantHeatmaps[activeContaminant]);
                        } else {
                            applyDynamicStyling(activeContaminant, map.getZoom());
                            if (contaminantLayers[selectedContaminant]) map.addLayer(contaminantLayers[selectedContaminant]);
                        }
                        updateShapeColors(activeContaminant);
                        legend.update({ chemicalName: selectedContaminant });
                    }
                }
            });

            // 5. Add Hover Events to Expand/Collapse
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            // Expand on mouse enter
            L.DomEvent.on(container, 'mouseenter', function() {
                L.DomUtil.addClass(container, 'leaflet-control-layers-expanded');
            });

            // Collapse on mouse leave
            L.DomEvent.on(container, 'mouseleave', function() {
                L.DomUtil.removeClass(container, 'leaflet-control-layers-expanded');
            });
            
            // Allow touch devices to toggle on tap
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (L.DomUtil.hasClass(container, 'leaflet-control-layers-expanded')) {
                    L.DomUtil.removeClass(container, 'leaflet-control-layers-expanded');
                } else {
                    L.DomUtil.addClass(container, 'leaflet-control-layers-expanded');
                }
            });

            return container;
        };
        return contaminantControl;
    }


/*    function createScrollableContaminantControl() {
        const contaminantControl = L.control({ position: 'topright' });
        contaminantControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded contaminant-control');
            const style = document.createElement('style');
            style.textContent = `
                .contaminant-control { width: 250px; max-height: 400px; background: white; border: 2px solid rgba(0,0,0,0.2); border-radius: 5px; }
                .contaminant-search { width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box; }
                .contaminant-list { max-height: 300px; overflow-y: auto; padding: 0 8px; }
                .contaminant-item { margin: 4px 0; display: flex; align-items: center; }
                .contaminant-item input { margin-right: 8px; }
                .contaminant-item label { cursor: pointer; display: flex; align-items: center; width: 100%; padding: 2px 0; font-size: 13px; }
                .contaminant-item label:hover { background-color: #f0f0f0; }
                .contaminant-header { font-weight: bold; padding: 8px; border-bottom: 1px solid #eee; background-color: #f9f9f9; }
            `;
            document.head.appendChild(style);
            
            const contaminantNames = Object.keys(contaminantLayers).sort();
            div.innerHTML = `
                <div class="contaminant-header">Contaminant Layers</div>
                <input type="text" class="contaminant-search" placeholder="Search contaminants..." />
                <div class="contaminant-list">
                    <div class="contaminant-item">
                        <label>
                            <input type="radio" name="contaminant" value="none" checked />
                            <strong>None (show all datasets)</strong>
                        </label>
                    </div>
                    <div style="border-bottom: 1px solid #eee; margin: 8px 0;"></div>
                    ${contaminantNames.map(chem => `
                        <div class="contaminant-item" data-name="${chem.toLowerCase()}">
                            <label>
                                <input type="radio" name="contaminant" value="${chem}" />
                                <span title="${chem}">${chem}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            `;
            
            const searchInput = div.querySelector('.contaminant-search');
            const contaminantItems = div.querySelectorAll('.contaminant-item[data-name]');
            
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                contaminantItems.forEach(item => {
                    const name = item.getAttribute('data-name');
                    if (name.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
            
            div.addEventListener('change', function(e) {
                if (e.target.type === 'radio') {
                    const selectedContaminant = e.target.value;
                    Object.keys(contaminantLayers).forEach(chem => {
                        if (map.hasLayer(contaminantLayers[chem])) map.removeLayer(contaminantLayers[chem]);
                        if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) map.removeLayer(contaminantHeatmaps[chem]);
                    });
                    
                    if (selectedContaminant === 'none') {
                        Object.keys(datasetLayers).forEach(datasetName => {
                            if (!map.hasLayer(datasetLayers[datasetName])) map.addLayer(datasetLayers[datasetName]);
                        });
                        activeContaminant = null;
                        isHeatmapMode = false;
                        legend.update();
                    } else {
                        Object.keys(datasetLayers).forEach(datasetName => {
                            if (map.hasLayer(datasetLayers[datasetName])) map.removeLayer(datasetLayers[datasetName]);
                        });
                        activeContaminant = selectedContaminant;
                        if (isHeatmapMode) {
                            if (contaminantHeatmaps[activeContaminant]) map.addLayer(contaminantHeatmaps[activeContaminant]);
                        } else {
                            if (contaminantLayers[selectedContaminant]) map.addLayer(contaminantLayers[selectedContaminant]);
                        }
                        legend.update({ chemicalName: selectedContaminant });
                    }
                }
            });

            L.DomEvent.disableClickPropagation(div);
            L.DomEvent.disableScrollPropagation(div);
            return div;
        };
        return contaminantControl;
    }*/

    let baseLayerControl = L.control.layers(baseLayers, {}).addTo(map);
    let contaminantControl = createScrollableContaminantControl().addTo(map);
}

function getDepthRadius(depth, min, max, zoomLevel = null) {
    // Define geographic sizes in meters for min and max depths
    const minRadiusMeters = 3;   // 3 meters for shallowest samples
    const maxRadiusMeters = 20;  // 20 meters for deepest samples
    
    let radiusInMeters;
    if (depth == null || isNaN(depth)) {
        radiusInMeters = minRadiusMeters;
    } else {
        const logMin = Math.log((min ?? 0) + 1);
        const logMax = Math.log((max ?? 0) + 1);
        const logVal = Math.log(depth + 1);
        
        if (logMax === logMin) {
            radiusInMeters = minRadiusMeters;
        } else {
            const t = (logVal - logMin) / (logMax - logMin);
            radiusInMeters = minRadiusMeters + t * (maxRadiusMeters - minRadiusMeters);
        }
    }
    
    // Convert meters to pixels based on zoom level
    if (zoomLevel === null) {
        // Fallback to pixel-based sizing for backward compatibility
        return (radiusInMeters / maxRadiusMeters * 20) * markerScaling; // Scale to 4-20 pixel range
    }
    
    // Calculate meters per pixel at this zoom level
    const metersPerPixel = 40075017 / (256 * Math.pow(2, zoomLevel)) * Math.cos(54.596 * Math.PI / 180);
    
    // FIX: Scale the result by 20 so the physical meter size translates to visible pixels
    return (radiusInMeters / metersPerPixel) * 20 * markerScaling;
}

/*srg251130 function getDepthRadius(depth, min, max, zoomLevel = null) {
    // Define geographic sizes in meters for min and max depths
    const minRadiusMeters = 3;   // 3 meters for shallowest samples
    const maxRadiusMeters = 20;  // 20 meters for deepest samples
    
    let radiusInMeters;
    if (depth == null || isNaN(depth)) {
        radiusInMeters = minRadiusMeters;
    } else {
        const logMin = Math.log((min ?? 0) + 1);
        const logMax = Math.log((max ?? 0) + 1);
        const logVal = Math.log(depth + 1);
        
        if (logMax === logMin) {
            radiusInMeters = minRadiusMeters;
        } else {
            const t = (logVal - logMin) / (logMax - logMin);
            radiusInMeters = minRadiusMeters + t * (maxRadiusMeters - minRadiusMeters);
        }
    }
    
    // Convert meters to pixels based on zoom level
    if (zoomLevel === null) {
        // Fallback to pixel-based sizing for backward compatibility
        return radiusInMeters / maxRadiusMeters * 20; // Scale to 4-20 pixel range
    }
    
    // Calculate meters per pixel at this zoom level
    // Using Web Mercator projection at latitude 54.596
    const metersPerPixel = 40075017 / (256 * Math.pow(2, zoomLevel)) * Math.cos(54.596 * Math.PI / 180);
    
    // Convert radius from meters to pixels
    return radiusInMeters / metersPerPixel;
}*/

let tooltipsAreVisible = false;

function isOverlapping(el1, el2) {
    if (!el1 || !el2) return false;
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

function toggleAllTooltips() {
    if (!allMapMarkers || allMapMarkers.length === 0) {
        return;
    }

    tooltipsAreVisible = !tooltipsAreVisible;
    const button = document.getElementById('toggleTooltipsBtn');

    if (tooltipsAreVisible) {
        if (button) button.textContent = 'Hide All Sample Names';
        allMapMarkers.forEach(marker => marker.openTooltip());
        const visibleTooltips = [];
        allMapMarkers.forEach(marker => {
            const currentTooltip = marker.getTooltip();
            if (!currentTooltip) return;
            let hasOverlap = false;
            for (const visibleTooltip of visibleTooltips) {
                if (isOverlapping(currentTooltip._container, visibleTooltip._container)) {
                    hasOverlap = true;
                    break;
                }
            }
            if (hasOverlap) {
                marker.closeTooltip();
            } else {
                visibleTooltips.push(currentTooltip);
            }
        });
    } else {
        if (button) button.textContent = 'Show All Sample Names';
        allMapMarkers.forEach(marker => marker.closeTooltip());
    }
}

function toggleAllAreaTooltips() {
    areaTooltipsVisible = !areaTooltipsVisible;
    const button = document.getElementById('toggleAreaTooltipsBtn');

    if (areaTooltipsVisible) {
        if (button) button.textContent = 'Hide All Area Names';
        allShapeLayers.forEach(layer => layer.openTooltip());
    } else {
        if (button) button.textContent = 'Show All Area Names';
        allShapeLayers.forEach(layer => layer.closeTooltip());
    }
}

function updateShapeColors(chemicalName) {
    window.areaStats = [];
    const kmlColors = ['#FF0000', '#00FF00', '#0000FF'];
    let colorNo = 0;

    // Calculate colors based on data standards
    let levels = null;
    let breaks = null;
    let unitAlign = 1;

    if (chemicalName) {
        if (standards[chosenStandard]?.chemicals?.[chemicalName]) {
             if(!standards[chosenStandard].chemicals[chemicalName]?.definition) {
                levels = standards[chosenStandard].chemicals[chemicalName];
            } else {
                if(standards[chosenStandard].chemicals[chemicalName]?.levels){
                    levels = standards[chosenStandard].chemicals[chemicalName].levels;
                }
            }
        }
        
        if (levels) {
            breaks = [...levels];
            if (breaks[1] === null) {
                 if (upperLevelMode === '10x') {
                    breaks[1] = breaks[0] * 10;
                } else {
                    breaks = [breaks[0]];
                }
            }
            
            unitAlign = factorUnit(contaminantStats[chemicalName].unit, extractUnit(standards[chosenStandard].unit));
            if (unitAlign !== 1) {
                breaks = breaks.map(l => l / unitAlign);
            }
        }
    }

    allShapeLayers.forEach(layer => {
        const stats = getAggregateStatsInShape(layer);
        const concStats = getConcentrationStatsInShape(layer);
        
        let color = kmlColors[colorNo]; // Default color
        let fillOpacity = 0.2;
        let weight = 2;
        let opacity = 0.5;

        if (chemicalName) {
            const maxVal = getMaxValueInShape(layer, chemicalName);
            
            if (!levels) {
                 color = '#808080';
                 fillOpacity = 0.1;
            } else {
                color = '#808080'; // Default grey if no data
                fillOpacity = 0.2;

                if (maxVal !== null) {
                    fillOpacity = 0.5;
                    if (breaks.length >= 2 && breaks[1] !== null) {
                        if (maxVal < breaks[0]) color = '#00FF00'; // Green
                        else if (maxVal < breaks[1]) color = '#FF0000'; // Red
                        else color = '#000000'; // Black
                    } else if (breaks.length >= 1) {
                         if (maxVal < breaks[0]) color = '#00FF00';
                         else color = '#FF0000';
                    }
                } else {
                     color = '#808080';
                     fillOpacity = 0.1;
                }
            }
        } else {
             colorNo = (colorNo + 1) % kmlColors.length;
        }

        layer.setStyle({
            color: color,
            fillColor: color,
            fillOpacity: fillOpacity,
            weight: weight,
            opacity: opacity
        });

        // Update Tooltip
        if (layer.options.baseTooltip) {
            let content = layer.options.baseTooltip;
            if (stats.totalExceedances > 0) {
                const abbrevs = standards[chosenStandard].levelAbbrev || standards[chosenStandard].levels?.abbrev || ["Level 1", "Level 2"];
                const al1 = abbrevs[0];
                const al2 = abbrevs[1] || "Max";
                
                content += `<br><b>Total Exceedances:</b>`;
                if (stats.between > 0) content += `<br>${al1} &gt; = &lt; ${al2}: ${stats.between}`;
                if (stats.above > 0) content += `<br>&gt; ${al2}: ${stats.above}`;
            }
            layer.setTooltipContent(content);
        }

        window.areaStats.push({
            name: layer.options.name || layer.name || "Unnamed Area",
            stats: stats,
            concentrationStats: concStats
        });
    });
    if (window.updateSummaryChart) window.updateSummaryChart();
}

function getSheetForChemical(chemName) {
    if (typeof determinands !== 'undefined') {
        for (const sheet in determinands) {
            if (Array.isArray(determinands[sheet]) && determinands[sheet].includes(chemName)) {
                return sheet;
            }
        }
    }
    if (chemName.includes('PAH') || chemName.includes('Benzo') || chemName.includes('Fluor')) return 'PAH data';
    if (chemName.includes('PCB')) return 'PCB data';
    if (chemName.includes('BDE')) return 'BDE data';
    if (chemName.includes('TBT') || chemName.includes('DBT') || chemName.includes('Organotin')) return 'Organotins data';
    if (chemName.includes('Dieldrin') || chemName.includes('DDT') || chemName.includes('Organochlorine')) return 'Organochlorine data';
    if (chemName.includes('Arsenic') || chemName.includes('Cadmium') || chemName.includes('Chromium') || chemName.includes('Copper') || chemName.includes('Lead') || chemName.includes('Mercury') || chemName.includes('Nickel') || chemName.includes('Zinc') || chemName.includes('Trace metal')) return 'Trace metal data';
    
    return 'Other';
}

function getAggregateStatsInShape(layer) {
    let counts = { 
        between: 0, above: 0, totalExceedances: 0, 
        betweenChemicals: new Set(), aboveChemicals: new Set(),
        bySheet: {}
    };
    
    // 1. Identify all samples within the shape
    const samplesInShape = new Set();
    allMapMarkers.forEach(marker => {
        const latLng = marker.getLatLng();
        if (isPointInLayerLocal(latLng.lat, latLng.lng, layer)) {
            samplesInShape.add(marker.options.customId);
        }
    });

    if (samplesInShape.size === 0) return counts;

    // 2. Iterate over all chemicals in the standard
    const standardChemicals = standards[chosenStandard]?.chemicals || {};
    
    Object.keys(standardChemicals).forEach(chemName => {
        if (!contaminantLayers[chemName]) return;

        let sheetName = getSheetForChemical(chemName);
        if (!counts.bySheet[sheetName]) {
            counts.bySheet[sheetName] = { between: 0, above: 0, totalExceedances: 0, betweenChemicals: new Set(), aboveChemicals: new Set() };
        }

        // Get levels
        let levels = standardChemicals[chemName];
        if (levels && levels.levels) levels = levels.levels; // Handle object definition
        if (!levels || !Array.isArray(levels)) return;

        let breaks = [...levels];
        
        // Handle missing upper level
        if (breaks[1] === null) {
             if (upperLevelMode === '10x') {
                breaks[1] = breaks[0] * 10;
            } else {
                // If no AL2 and not 10x mode, we only have AL1.
                // Anything > AL1 is "Red" (Between).
                breaks = [breaks[0]]; 
            }
        }

        // Unit conversion
        const unitAlign = factorUnit(contaminantStats[chemName].unit, extractUnit(standards[chosenStandard].unit));
        if (unitAlign !== 1) {
            breaks = breaks.map(l => l / unitAlign);
        }

        // Check samples
        contaminantLayers[chemName].eachLayer(marker => {
            if (samplesInShape.has(marker.options.customId)) {
                const val = parseFloat(marker.options._chemValue);
                if (!isNaN(val)) {
                    if (breaks.length >= 2 && breaks[1] !== null && val > breaks[1]) {
                        counts.above++;
                        counts.totalExceedances++;
                        counts.aboveChemicals.add(chemName);
                        
                        counts.bySheet[sheetName].above++;
                        counts.bySheet[sheetName].totalExceedances++;
                        counts.bySheet[sheetName].aboveChemicals.add(chemName);
                    } else if (val > breaks[0]) {
                        counts.between++;
                        counts.totalExceedances++;
                        counts.betweenChemicals.add(chemName);

                        counts.bySheet[sheetName].between++;
                        counts.bySheet[sheetName].totalExceedances++;
                        counts.bySheet[sheetName].betweenChemicals.add(chemName);
                    }
                }
            }
        });
    });

    return counts;
}

function getConcentrationStatsInShape(layer) {
    const stats = {
        sumAverage: 0,
        sumHighest: 0,
        bySheet: {}
    };

    // 1. Identify all samples within the shape
    const samplesInShape = new Set();
    allMapMarkers.forEach(marker => {
        const latLng = marker.getLatLng();
        if (isPointInLayerLocal(latLng.lat, latLng.lng, layer)) {
            samplesInShape.add(marker.options.customId);
        }
    });

    if (samplesInShape.size === 0) return stats;

    // 2. Iterate over all available contaminant layers
    Object.keys(contaminantLayers).forEach(chemName => {
        // Exclude aggregate layers to avoid double counting mass
        if (chemName.startsWith("Total ") || chemName.endsWith(" Sum")) return;

        let sheetName = getSheetForChemical(chemName);
        if (!stats.bySheet[sheetName]) {
            stats.bySheet[sheetName] = { sumAverage: 0, sumHighest: 0 };
        }

        let values = [];
        contaminantLayers[chemName].eachLayer(marker => {
            if (samplesInShape.has(marker.options.customId)) {
                let val = parseFloat(marker.options._chemValue);
                if (!isNaN(val)) {
                    // Normalize to mg/kg
                    const unit = marker.options._chemUnit;
                    if (unit === 'µg/kg') val = val / 1000;
                    else if (unit === 'ng/kg') val = val / 1000000;
                    else if (unit === 'g/kg') val = val * 1000;
                    else if (unit === 'pg/kg') val = val / 1000000000;
                    values.push(val);
                }
            }
        });

        if (values.length > 0) {
            const maxVal = Math.max(...values);
            const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
            
            stats.sumHighest += maxVal;
            stats.sumAverage += avgVal;
            
            stats.bySheet[sheetName].sumHighest += maxVal;
            stats.bySheet[sheetName].sumAverage += avgVal;
        }
    });

    return stats;
}

function getMaxValueInShape(layer, chemicalName) {
    let maxVal = -Infinity;
    let found = false;
    
    if (contaminantLayers[chemicalName]) {
        contaminantLayers[chemicalName].eachLayer(marker => {
            const latLng = marker.getLatLng();
            if (isPointInLayerLocal(latLng.lat, latLng.lng, layer)) {
                const val = parseFloat(marker.options._chemValue);
                if (!isNaN(val)) {
                    if (val > maxVal) maxVal = val;
                    found = true;
                }
            }
        });
    }
    return found ? maxVal : null;
}

function isPointInLayerLocal(lat, lon, layer) {
    // Simple ray casting for point in polygon
    const point = [lat, lon];
    const latlngs = layer.getLatLngs();
    
    // Normalize structure: Leaflet polygons can be simple arrays or arrays of arrays (holes/multipolygons)
    let rings = latlngs;
    if (latlngs[0] && ('lat' in latlngs[0])) {
        rings = [latlngs];
    }

    // Helper for ray casting
    function isInsideRing(pt, ring) {
        let x = pt[0], y = pt[1];
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            let xi = ring[i].lat, yi = ring[i].lng;
            let xj = ring[j].lat, yj = ring[j].lng;
            let intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Handle MultiPolygons (array of arrays of arrays)
    if (Array.isArray(rings[0]) && Array.isArray(rings[0][0])) {
         for (let i = 0; i < rings.length; i++) {
             if (isInsideRing(point, rings[i][0] || rings[i])) return true;
         }
         return false;
    }
    
    // Standard Polygon (Index 0 is outer boundary, 1+ are holes)
    const insideOuter = isInsideRing(point, rings[0]);
    if (!insideOuter) return false;

    // Check holes
    if (rings.length > 1) {
        for (let i = 1; i < rings.length; i++) {
            if (isInsideRing(point, rings[i])) {
                return false; // In a hole
            }
        }
    }
    return true;
}

function getShapeStyleForContaminant(layer, chemicalName, index) {
    const kmlColors = ['#FF0000', '#00FF00', '#0000FF'];
    
    if (!shapesColoredByData || !chemicalName) {
         const color = kmlColors[index % kmlColors.length];
         return {
            color: color,
            weight: 2,
            opacity: 0.5,
            fillColor: color,
            fillOpacity: 0.2
         };
    }

    // Calculate colors based on data standards
    let levels = null;
    if (standards[chosenStandard]?.chemicals?.[chemicalName]) {
         if(!standards[chosenStandard].chemicals[chemicalName]?.definition) {
            levels = standards[chosenStandard].chemicals[chemicalName];
        } else {
            if(standards[chosenStandard].chemicals[chemicalName]?.levels){
                levels = standards[chosenStandard].chemicals[chemicalName].levels;
            }
        }
    }
    
    if (!levels) {
        return { color: '#808080', fillColor: '#808080', fillOpacity: 0.1, weight: 2 }; 
    }
    
    let breaks = [...levels];
    if (breaks[1] === null) {
         if (upperLevelMode === '10x') {
            breaks[1] = breaks[0] * 10;
        } else {
            breaks = [breaks[0]];
        }
    }
    
    const unitAlign = factorUnit(contaminantStats[chemicalName].unit, extractUnit(standards[chosenStandard].unit));
    if (unitAlign !== 1) {
        breaks = breaks.map(l => l / unitAlign);
    }

    const maxVal = getMaxValueInShape(layer, chemicalName);
    let color = '#808080';
    let fillOpacity = 0.2;

    if (maxVal !== null) {
        fillOpacity = 0.5;
        if (breaks.length >= 2 && breaks[1] !== null && maxVal >= breaks[1]) color = '#000000';
        else if (maxVal >= breaks[0]) color = '#FF0000';
        else color = '#00FF00';
    }
    return { color: color, fillColor: color, fillOpacity: fillOpacity, weight: 2 };
}

    function toggleStaticShapes() {
        includeShapesOnStaticMaps = !includeShapesOnStaticMaps;
        const btn = document.getElementById('toggleStaticShapesBtn');
        if (btn) btn.textContent = `Static Maps Shapes: ${includeShapesOnStaticMaps ? 'On' : 'Off'}`;
    }

    // Fallback for potential lingering calls to the old function name
    function getStatsInShape(layer) {
        return getAggregateStatsInShape(layer);
    }
