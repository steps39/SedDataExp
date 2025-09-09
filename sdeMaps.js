//import { kml } from "https://unpkg.com/@tmcw/togeojson?module";
let permanentTooltipLayer;
let contaminantHeatmaps = {}; // Store heatmap layers for each contaminant
let isHeatmapMode = false; // Track current visualization mode
let activeContaminant = null; // Track which contaminant is currently displayed

function sampleMap(meas) {
    // Reset map if it exists
    if (map) map.remove();
    allMapMarkers = [];
    contaminantHeatmaps = {};
    isHeatmapMode = false;
    activeContaminant = null;
    const currentTime = new Date();
    const year = currentTime.getFullYear();
    // Base maps
    const apiKey = 'WYvhmkLwjzAF0LgSL14P7y1v5fySAYy9';
    const serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community.'
    });
    const OS_Road = L.tileLayer(`${serviceUrl}/Road_3857/{z}/{x}/{y}.png?key=${apiKey}`, {
        maxZoom: 19,
        attribution: 'Contains OS Data &copy; Crown copyright and database rights ' + year
    });
    const OS_Outdoor = L.tileLayer(`${serviceUrl}/Outdoor_3857/{z}/{x}/{y}.png?key=${apiKey}`, {
        maxZoom: 19,
        attribution: 'Contains OS Data &copy; Crown copyright and database rights ' + year
    });
    const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
    });
    const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
    });
    const osSensorCommunity = L.tileLayer('https://osmc3.maps.sensor.community/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © Sensor Community'
    });
    const mapLayers = {
        "OpenStreetMap": osm,
        "WorldImagery": Esri_WorldImagery,
        "OS Road": OS_Road,
        "OS Outdoor": OS_Outdoor,
        "OpenStreetMap.HOT": osmHOT,
        "OpenTopoMap": openTopoMap,
        "OpenSensorCommunity": osSensorCommunity
    };
    // Init the map
    map = L.map('map', {
        center: [54.596, -1.177],
        zoom: 13,
        layers: [osm]
    });
    // ---- Build per-dataset point markers (colored by dataset; radius from depth) ----
    let latSum = 0, lonSum = 0, noLocations = 0;
    let minLat = null, maxLat = null, minLon = null, maxLon = null;
    const markerColors = ['#FF5733', '#33CFFF', '#33FF57', '#FF33A1', '#A133FF', '#FFC300', '#33FFA1', '#C70039', '#900C3F'];
    const datesSampled = Object.keys(selectedSampleInfo);
    const dateColors = {};
    let colorIndex = 0;
    let allSamples = [];
    let noSamples = 0;
    let markers = {};
    let marker = null;
    let sampleNo = -1;
    datesSampled.forEach(dateSampled => {
        markers[dateSampled] = {};
        dateColors[dateSampled] = markerColors[colorIndex];
        colorIndex = (colorIndex + 1) % markerColors.length;
        const dsSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        noSamples += dsSamples.length;
        dsSamples.forEach(sample => allSamples.push(`${dateSampled}: ${sample}`));
    });
    // Sort datasets alphabetically by label for legend consistency
    datesSampled.sort((a, b) => {
        const labelA = selectedSampleInfo[a].label || a;
        const labelB = selectedSampleInfo[b].label || b;
        return labelA.localeCompare(labelB);
    });
    // Populate external dataset legend (your existing populateMapLegend handler)
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
    let highlighted = Array(noSamples).fill(false);
    const hoverStyle = { radius: 10, weight: 3, opacity: 1, fillOpacity: 1 };
    const highlightStyle = {
        radius: 10, fillColor: '#FFFF00', color: '#000000', weight: 2, opacity: 1, fillOpacity: 1
    };
    // Pre-compute per-sample depth for dataset markers (for size)
    let depthStatsGlobal = { min: Infinity, max: -Infinity };
    let sampleDepths = {}; // key = `${dataset}: ${sample}`, value = maxDepth number
    datesSampled.forEach(dateSampled => {
        const dsSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        dsSamples.forEach(sample => {
            const depthInfo = selectedSampleInfo[dateSampled].position[sample]['Sampling depth (m)'];
            if (depthInfo) {
                const maxDepth = depthInfo['maxDepth'];
                if (!isNaN(maxDepth)) {
                    const key = `${dateSampled}: ${sample}`;
                    sampleDepths[key] = maxDepth;
                    if (maxDepth < depthStatsGlobal.min) depthStatsGlobal.min = maxDepth;
                    if (maxDepth > depthStatsGlobal.max) depthStatsGlobal.max = maxDepth;
                }
            }
        });
    });

    function getDepthRadius(depth, min, max) {
        const minRadius = 4, maxRadius = 20;
        if (depth == null || isNaN(depth)) return minRadius;
        const logMin = Math.log((min ?? 0) + 1);
        const logMax = Math.log((max ?? 0) + 1);
        const logVal = Math.log(depth + 1);
        if (logMax === logMin) return minRadius;
        const t = (logVal - logMin) / (logMax - logMin);
        return minRadius + t * (maxRadius - minRadius);
    }

    // Build dataset markers (colored by dataset; size by global depth range)
//    allSamples.forEach(fullSample => {
    console.log("Building markers for samples:", allSamples);
    console.log("Global depth stats:", sampleDepths); 

// Get the array of sample IDs (keys)
const depthSortedSampleIds = Object.keys(sampleDepths).sort((a, b) => {
  // Use the values from the original object to compare
  return sampleDepths[b] - sampleDepths[a];
});

//    for (fullSample in sampleDepths) { // Use only samples with depth info for markers
    depthSortedSampleIds.forEach(fullSample => {
        let parts = fullSample.split(": ");
        if (parts.length > 2) parts[1] = parts[1] + ': ' + parts[2];
        const dateSampled = parts[0];
        const sample = parts[1];
        const currentColor = dateColors[dateSampled];
        if (selectedSampleInfo[dateSampled].position[sample]?.hasOwnProperty('Position latitude')) {
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
//                    radius: 7, fillColor: currentColor, color: "#000", weight: 1, opacity: 1, fillOpacity: 0.9
                };
                marker = L.circleMarker([lat, lon], originalCircleOptions)
                    .bindTooltip(alternateName);
                marker.options.customId = fullSample;
                marker.options.originalStyle = originalCircleOptions;
                marker.on({
                    mouseover: (e) => { const layer = e.target; layer.setStyle(hoverStyle); if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) layer.bringToFront(); },
                    mouseout: (e) => { e.target.setStyle(e.target.options.originalStyle); }
                });
                marker.on('click', (e) => createHighlights(meas, e.target.options.customId));
                highlightMarkers[sampleNo] = L.circleMarker(new L.LatLng(lat, lon), highlightStyle).bindTooltip(alternateName);
                highlightMarkers[sampleNo].options.customId = fullSample;
                highlightMarkers[sampleNo].on('click', (e) => createHighlights(meas, e.target.options.customId));
                noLocations += 1; latSum += lat; lonSum += lon;
            }
        } else {
            sampleNo += 1;
            highlightMarkers[sampleNo] = null;
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
    // Build per-dataset groups for toggling
    let markerLayers = {};
    datesSampled.forEach(dateSampled => {
        markerLayers[dateSampled] = [];
        const dsKeys = Object.keys(markers[dateSampled]);
        dsKeys.forEach(sampleKey => {
            if (markers[dateSampled][sampleKey]) markerLayers[dateSampled].push(markers[dateSampled][sampleKey]);
        });
    });
    let markerLayer = {};
    datesSampled.forEach(dateSampled => {
        markerLayer[dateSampled] = L.layerGroup(markerLayers[dateSampled]).addTo(map);
    });
    // ---- KML overlays (styled cycling through 3 colors) ----
    let shapeOverlay = {};
    const kmlColors = ['#FF0000', '#00FF00', '#0000FF'];
    let colorNo = 0;
    for (const filename in kmlLayers) {
        const url = kmlLayers[filename];
        const kmlLayer = new L.KML(url, { async: true });
        kmlLayer.on("loaded", function (e) {
            const mainLayer = Object.values(e.target._layers)[0];
            if (mainLayer && mainLayer._layers) {
                Object.values(mainLayer._layers).forEach(layer => {
                    if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
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
    }
    // Add dataset marker layers to overlay collection too
    datesSampled.forEach(dateSampled => shapeOverlay[dateSampled] = markerLayer[dateSampled]);
    // Fit bounds
    if (noLocations > 0) {
        const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
        map.fitBounds(bounds);
    }
    // =========================
    // CONTAMINANT LAYERS
    // =========================
    let contaminantLayers = {}; // chemicalName -> LayerGroup
    let contaminantLayerItems = {}; // chemicalName -> array of circle markers (for iteration)
    let contaminantStats = {}; // chemicalName -> { valueMin, valueMax, depthMin, depthMax, unit }
    // --- Helper: compute stats in one pass over measurements ---
    function computeContaminationStats(measurements, sampleInfo) {
        const statsByChem = {};
        Object.keys(measurements).forEach(datasetName => {
            const dataset = measurements[datasetName];
            Object.keys(dataset).forEach(sheetName => {
                if (sheetName === "Physical Data") return; // exclude non-contaminant sheet
                const sheet = dataset[sheetName];
                if (!sheet?.chemicals) return;
                Object.keys(sheet.chemicals).forEach(chemicalName => {
                    const chemical = sheet.chemicals[chemicalName];
                    const unit = chemical.unit ?? null;
                    if (!statsByChem[chemicalName]) {
                        statsByChem[chemicalName] = {
                            valueMin: Infinity, valueMax: -Infinity,
                            depthMin: Infinity, depthMax: -Infinity,
                            unit
                        };
                    } else if (unit && !statsByChem[chemicalName].unit) {
                        statsByChem[chemicalName].unit = unit;
                    }
                    Object.keys(chemical.samples || {}).forEach(sampleName => {
                        const value = chemical.samples[sampleName];
                        if (value != null && !isNaN(value)) {
                            if (value < statsByChem[chemicalName].valueMin) statsByChem[chemicalName].valueMin = value;
                            if (value > statsByChem[chemicalName].valueMax) statsByChem[chemicalName].valueMax = value;
                        }
                        // depth for this sample if available
                        const info = sampleInfo[datasetName]?.position?.[sampleName];
                        const dObj = info?.['Sampling depth (m)'];
                        const dMax = dObj?.maxDepth;
                        if (dMax != null && !isNaN(dMax)) {
                            if (dMax < statsByChem[chemicalName].depthMin) statsByChem[chemicalName].depthMin = dMax;
                            if (dMax > statsByChem[chemicalName].depthMax) statsByChem[chemicalName].depthMax = dMax;
                        }
                    });
                });
            });
        });
        // Handle chemicals that might have only one observed depth/value
        Object.keys(statsByChem).forEach(chem => {
            const s = statsByChem[chem];
            if (s.valueMin === Infinity) s.valueMin = 0;
            if (s.valueMax === -Infinity) s.valueMax = 0;
            if (s.depthMin === Infinity) s.depthMin = 0;
            if (s.depthMax === -Infinity) s.depthMax = 0;
        });
        return statsByChem;
    }

            // Build contaminant markers data, while filling stats
    contaminantStats = computeContaminationStats(selectedSampleMeasurements, selectedSampleInfo);
    contaminantMarkerData = {}
    Object.keys(selectedSampleMeasurements).forEach(datasetName => {
        const dataset = selectedSampleMeasurements[datasetName];
        Object.keys(dataset).forEach(sheetName => {
            if (sheetName === "Physical Data") return; // exclude
            const sheet = dataset[sheetName];
            if (!sheet?.chemicals) return;
            Object.keys(sheet.chemicals).forEach(chemicalName => {
                const chemical = sheet.chemicals[chemicalName];
                if (!contaminantLayerItems[chemicalName]) contaminantLayerItems[chemicalName] = [];
                if (!contaminantMarkerData[chemicalName]) contaminantMarkerData[chemicalName] = [];

                const unit = chemical.unit ?? (contaminantStats[chemicalName]?.unit ?? "");
                Object.keys(chemical.samples || {}).forEach(sampleName => {
                    const fullSampleName = `${datasetName}: ${sampleName}`;
                    const value = chemical.samples[sampleName];
                    if (value == null || isNaN(value)) return;
                    // Position
                    const sampleInfo = selectedSampleInfo[datasetName]?.position?.[sampleName];
                    const sampleLabel = selectedSampleInfo[datasetName]?.label + ' : ' + sampleInfo.label;
                    if (!sampleInfo) return;
                    const lat = parseFloat(sampleInfo["Position latitude"]);
                    const lon = parseFloat(sampleInfo["Position longitude"]);
                    if (isNaN(lat) || isNaN(lon)) return;
                    let stuff = {};
                    stuff.unit = unit;
                    stuff.value = value;
                    stuff.lat = lat;
                    stuff.lon = lon;
                    // Depth for radius (per contaminant)
                    // Use sampleDepths instead
/*                    let depth = null;
                    const dObj = sampleInfo['Sampling depth (m)'];
                    if (dObj && dObj.maxDepth != null && !isNaN(dObj.maxDepth)) depth = dObj.maxDepth;*/
                    // Tooltip with unit + optional depth line
//                    const unitSuffix = unit ? ` ${unit}` : "";
//                    const tooltipHtml = `${sampleName}<br>${chemicalName}: ${value}${unitSuffix}${(depth != null && !isNaN(depth)) ? `<br>Depth: ${depth} m` : ""}`;
                    unitSuffix = unit ? ` ${unit}` : "";
                    stuff.tooltipHtml = value ? `${sampleLabel}<br>${chemicalName}: ${value}${unitSuffix}<br>Depth: ${sampleDepths[fullSampleName]} m` : "";
//                    stuff.tooltipHtml = `${sampleName}<br>${chemicalName}: ${value}${unitSuffix}`<br>Depth: ${sampleDepths[fullSampleName]} m` : ""}`;
/*                    // Create marker with placeholders; styling applied when layer added
                    const m = L.circleMarker([lat, lon], {
                        radius: 6,
                        fillColor: "#999",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindTooltip(tooltipHtml);
                    // Store attributes for styling later
                    m.options._chemValue = value;
                    m.options._chemUnit = unit || "";
                    m.options._depth = depth;*/
//                    contaminantLayerItems[chemicalName].push(m);
                    contaminantMarkerData[chemicalName][fullSampleName] = stuff;
                });
            });
        });
    });

    // Now create markers sorted by depth (deepest first) to ensure proper layering
            depthSortedSampleIds.forEach(fullSampleName => {
                let parts = fullSampleName.split(": ");
                if (parts.length > 2) parts[1] = parts[1] + ': ' + parts[2];
                const dateset = parts[0];
                for (chemicalName in contaminantMarkerData) {
//                Object.keys(sheet.chemicals).forEach(chemicalName => {
                    const stuff = contaminantMarkerData[chemicalName][fullSampleName];
                    if (!stuff) return;
console.log("Processing contaminant marker data for", chemicalName, "sample", fullSampleName, stuff);                    
                                        // Create marker with placeholders; styling applied when layer added
                    if (isNaN(stuff.lat) || isNaN(stuff.lon)) return;
                    const m = L.circleMarker([stuff.lat, stuff.lon], {
                        radius: 12,
                        fillColor: "#999",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindTooltip(stuff.tooltipHtml);
                    // Store attributes for styling later
                    m.options._chemValue = stuff.value;
                    m.options._chemUnit = stuff.unit || "";
                    m.options._depth = sampleDepths[fullSampleName];
                    contaminantLayerItems[chemicalName].push(m);
                }//);
            });


/*    // Build contaminant markers, while filling stats
    contaminantStats = computeContaminationStats(selectedSampleMeasurements, selectedSampleInfo);
    Object.keys(selectedSampleMeasurements).forEach(datasetName => {
        const dataset = selectedSampleMeasurements[datasetName];
        Object.keys(dataset).forEach(sheetName => {
            if (sheetName === "Physical Data") return; // exclude
            const sheet = dataset[sheetName];
            if (!sheet?.chemicals) return;
            Object.keys(sheet.chemicals).forEach(chemicalName => {
                const chemical = sheet.chemicals[chemicalName];
                if (!contaminantLayerItems[chemicalName]) contaminantLayerItems[chemicalName] = [];
                const unit = chemical.unit ?? (contaminantStats[chemicalName]?.unit ?? "");
                Object.keys(chemical.samples || {}).forEach(sampleName => {
                    const value = chemical.samples[sampleName];
                    if (value == null || isNaN(value)) return;
                    // Position
                    const sampleInfo = selectedSampleInfo[datasetName]?.position?.[sampleName];
                    if (!sampleInfo) return;
                    const lat = parseFloat(sampleInfo["Position latitude"]);
                    const lon = parseFloat(sampleInfo["Position longitude"]);
                    if (isNaN(lat) || isNaN(lon)) return;
                    // Depth for radius (per contaminant)
                    let depth = null;
                    const dObj = sampleInfo['Sampling depth (m)'];
                    if (dObj && dObj.maxDepth != null && !isNaN(dObj.maxDepth)) depth = dObj.maxDepth;
                    // Tooltip with unit + optional depth line
                    const unitSuffix = unit ? ` ${unit}` : "";
                    const tooltipHtml = `${sampleName}<br>${chemicalName}: ${value}${unitSuffix}${(depth != null && !isNaN(depth)) ? `<br>Depth: ${depth} m` : ""}`;
                    // Create marker with placeholders; styling applied when layer added
                    const m = L.circleMarker([lat, lon], {
                        radius: 6,
                        fillColor: "#999",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindTooltip(tooltipHtml);
                    // Store attributes for styling later
                    m.options._chemValue = value;
                    m.options._chemUnit = unit || "";
                    m.options._depth = depth;
                    contaminantLayerItems[chemicalName].push(m);
                });
            });
        });
    });*/
console.log(contaminantLayerItems);
    // Build LayerGroups for contaminants
    Object.keys(contaminantLayerItems).forEach(chem => {
        contaminantLayers[chem] = L.layerGroup(contaminantLayerItems[chem]);
    });
    // =========================
    // HEATMAP FUNCTIONALITY
    // =========================
    // Create heatmap layers for each contaminant

// 1. Fix the opacity issue in createContaminantHeatmaps
function createContaminantHeatmaps() {
    Object.keys(contaminantLayerItems).forEach(chemicalName => {
        const items = contaminantLayerItems[chemicalName];
        if (!items || items.length === 0) return;
        
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        
        // Create heatmap data sorted by depth (deepest first)
        const heatmapData = items.map(marker => ({
            lat: marker.getLatLng().lat,
            lng: marker.getLatLng().lng,
            value: marker.options._chemValue,
            depth: marker.options._depth
        })).sort((a, b) => {
            if (a.depth == null && b.depth == null) return 0;
            if (a.depth == null) return 1;
            if (b.depth == null) return -1;
            return b.depth - a.depth;
        });
        
        // Create heatmap layer using overlapping circles
        const heatmapLayer = L.layerGroup();
        
        heatmapData.forEach(point => {
            if (isNaN(point.lat) || isNaN(point.lng)) return;
            
            const normalizedLevel = Math.min((point.value - stats.valueMin) / (stats.valueMax - stats.valueMin || 1), 1);
            
            // Create multiple overlapping circles for smooth heat effect
            for (let i = 3; i >= 1; i--) {
                let baseRadius;
                if (point.depth != null && !isNaN(point.depth)) {
                    const depthRadius = getLogDepthRadius3Levels(point.depth, stats.depthMin, stats.depthMax);
                    baseRadius = 20 + (depthRadius - 6) * 5;
                } else {
                    baseRadius = 50;
                }
                
                const layerScale = 0.3 + (i - 1) * 0.35;
                const valueScale = 0.5 + normalizedLevel * 1.0;
                const radius = baseRadius * layerScale * valueScale;
                
                // INCREASED OPACITY - much more visible
                const opacity = (0.4 / i) * (0.4 + normalizedLevel * 0.8); // Was 0.15, now 0.4
                
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
}


    /*function createContaminantHeatmaps() {
    Object.keys(contaminantLayerItems).forEach(chemicalName => {
        const items = contaminantLayerItems[chemicalName];
        if (!items || items.length === 0) return;
        
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        
        console.log(`Creating heatmap for ${chemicalName}`);
        console.log(`Total markers for ${chemicalName}:`, items.length);
        
        // Create heatmap data and log what we're getting
        const heatmapData = items.map(marker => {
            const data = {
                lat: marker.getLatLng().lat,
                lng: marker.getLatLng().lng,
                value: marker.options._chemValue,
                depth: marker.options._depth
            };
            return data;
        });
        
        // Log the data before sorting
        console.log(`Heatmap data before sorting for ${chemicalName}:`, heatmapData);
        console.log(`Data with null/undefined depth:`, heatmapData.filter(d => d.depth == null));
        console.log(`Data with valid depth:`, heatmapData.filter(d => d.depth != null));
        
        // Sort by depth, but handle null/undefined values
        const sortedData = heatmapData.sort((a, b) => {
            // Handle null/undefined depths - put them at the end
            if (a.depth == null && b.depth == null) return 0;
            if (a.depth == null) return 1;  // a goes after b
            if (b.depth == null) return -1; // b goes after a
            return b.depth - a.depth; // Normal sort (deepest first)
        });
        
        console.log(`Sorted heatmap data for ${chemicalName}:`, sortedData);
        
        // Create heatmap layer using overlapping circles
        const heatmapLayer = L.layerGroup();
        let circlesCreated = 0;
        
        sortedData.forEach((point, index) => {
            console.log(`Processing point ${index} for ${chemicalName}:`, point);
            
            const normalizedLevel = Math.min((point.value - stats.valueMin) / (stats.valueMax - stats.valueMin || 1), 1);
            console.log(`Normalized level for point ${index}:`, normalizedLevel);
            
            // Skip points with invalid coordinates
            if (isNaN(point.lat) || isNaN(point.lng)) {
                console.log(`Skipping point ${index} - invalid coordinates`);
                return;
            }
            
            // Create multiple overlapping circles for smooth heat effect
            for (let i = 3; i >= 1; i--) {
                // Start with a smaller base radius (in meters, not pixels)
                let baseRadius;
                if (point.depth != null && !isNaN(point.depth)) {
                    // Use depth to scale radius, but keep it reasonable (10-50m range)
                    const depthRadius = getLogDepthRadius3Levels(point.depth, stats.depthMin, stats.depthMax);
                    baseRadius = 20 + (depthRadius - 6) * 5; // Scale 6-18 pixel range to 20-80m radius
                } else {
                    baseRadius = 50; // Default 50m radius for points without depth
                }
                
                // Layer-specific scaling (outermost layer is largest)
                const layerScale = 0.3 + (i - 1) * 0.35; // 0.3, 0.65, 1.0 for layers 1,2,3
                
                // Value-based scaling (higher values get larger circles)
                const valueScale = 0.5 + normalizedLevel * 1.0; // 0.5 to 1.5 scale
                
                const radius = baseRadius * layerScale * valueScale;
                
                // Opacity decreases for outer layers and increases with value
                const opacity = (0.15 / i) * (0.2 + normalizedLevel * 0.6);
                
                const color = getHeatmapColor(normalizedLevel);
                
                const circle = L.circle([point.lat, point.lng], {
                    radius: radius,
                    fillColor: color,
                    color: 'transparent',
                    fillOpacity: opacity,
                    weight: 0
                });
                
                circle.addTo(heatmapLayer);
                circlesCreated++;
                
                if (index < 3) { // Log details for first few points
                    console.log(`Circle ${i} for point ${index}: radius=${radius.toFixed(1)}m, opacity=${opacity.toFixed(3)}, color=${color}`);
                }
            }
        });
        
        console.log(`Total circles created for ${chemicalName}: ${circlesCreated}`);
        contaminantHeatmaps[chemicalName] = heatmapLayer;
    });
}*/

/*    function createContaminantHeatmaps() {
    Object.keys(contaminantLayerItems).forEach(chemicalName => {
        const items = contaminantLayerItems[chemicalName];
        if (!items || items.length === 0) return;
        
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        
        // Create heatmap data sorted by value for proper layering
        const heatmapData = items.map(marker => ({
            lat: marker.getLatLng().lat,
            lng: marker.getLatLng().lng,
            value: marker.options._chemValue,
            depth: marker.options._depth
        })).sort((a, b) => b.depth - a.depth); // Sort by depth (deepest first)
        
        // Create heatmap layer using overlapping circles
        const heatmapLayer = L.layerGroup();
        
        heatmapData.forEach(point => {
            const normalizedLevel = Math.min((point.value - stats.valueMin) / (stats.valueMax - stats.valueMin || 1), 1);
            
            // Create multiple overlapping circles for smooth heat effect
            // Use much smaller base radius and scaling
            for (let i = 3; i >= 1; i--) {
                // Start with a smaller base radius (in meters, not pixels)
                let baseRadius;
                if (point.depth) {
                    // Use depth to scale radius, but keep it reasonable (10-50m range)
                    const depthRadius = getLogDepthRadius3Levels(point.depth, stats.depthMin, stats.depthMax);
                    baseRadius = 20 + (depthRadius - 6) * 5; // Scale 6-18 pixel range to 20-80m radius
                } else {
                    baseRadius = 50; // Default 50m radius
                }
                
                // Layer-specific scaling (outermost layer is largest)
                const layerScale = 0.3 + (i - 1) * 0.35; // 0.3, 0.65, 1.0 for layers 1,2,3
                
                // Value-based scaling (higher values get larger circles)
                const valueScale = 0.5 + normalizedLevel * 1.0; // 0.5 to 1.5 scale
                
                const radius = baseRadius * layerScale * valueScale;
                
                // Opacity decreases for outer layers and increases with value
                const opacity = (0.15 / i) * (0.2 + normalizedLevel * 0.6);
                
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
}*/
/*    function createContaminantHeatmaps() {
        Object.keys(contaminantLayerItems).forEach(chemicalName => {
            const items = contaminantLayerItems[chemicalName];
            if (!items || items.length === 0) return;
            const stats = contaminantStats[chemicalName];
            if (!stats) return;
            // Create heatmap data sorted by value for proper layering
            const heatmapData = items.map(marker => ({
                lat: marker.getLatLng().lat,
                lng: marker.getLatLng().lng,
                value: marker.options._chemValue,
                depth: marker.options._depth
            })).sort((a, b) => b.depth - a.depth); // Sort by depth (deepest first)
            // Create heatmap layer using overlapping circles
            const heatmapLayer = L.layerGroup();
            heatmapData.forEach(point => {
                const normalizedLevel = Math.min((point.value - stats.valueMin) / (stats.valueMax - stats.valueMin || 1), 1);
                // Create multiple overlapping circles for smooth heat effect
                for (let i = 3; i >= 1; i--) {
                    const baseRadius = point.depth ? getLogDepthRadius3Levels(point.depth, stats.depthMin, stats.depthMax) * 1 : 20;
                    const radius = baseRadius * i * (0.5 + normalizedLevel * 1.2);
                    const opacity = (0.4 / i) * (0.3 + normalizedLevel * 0.7);
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
    }*/

console.log("Created heatmap layers:", contaminantHeatmaps);
    // Get color for heatmap based on normalized intensity (0-1)
    function getHeatmapColor(intensity) {
        if (intensity <= 0.2) return '#1a9850'; // Green (matches your existing scale)
        if (intensity <= 0.4) return '#fee08b'; // Light yellow
        if (intensity <= 0.6) return '#fc8d59'; // Orange
        if (intensity <= 0.8) return '#f46d43'; // Red-orange
        return '#d73027'; // Red
    }

    // Create all heatmaps
    createContaminantHeatmaps();

    // ---- Styling helpers ----
    function getColorScale(min, max) {
        // returns gradient endpoints & discrete breaks for 4-step color pick
        const breaks = [min, min + (max - min) * 0.33, min + (max - min) * 0.66, max];
        const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
        return { breaks, colors };
    }

    // 3-level logarithmic radius by depth, per-chemical
    function getLogDepthRadius3Levels(depth, depthMin, depthMax) {
        const rSmall = 6, rMed = 12, rLarge = 18;
        if (depth == null || isNaN(depth)) return rSmall;
        const logMin = Math.log((depthMin ?? 0) + 1);
        const logMax = Math.log((depthMax ?? 0) + 1);
        const logVal = Math.log(depth + 1);
        if (logMax === logMin) return rSmall;
        const t = (logVal - logMin) / (logMax - logMin);
        if (t <= 1 / 3) return rSmall;
        if (t <= 2 / 3) return rMed;
        return rLarge;
    }

    function applyDynamicStyling(chemicalName) {
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        const { valueMin, valueMax, depthMin, depthMax } = stats;
        const { breaks, colors } = getColorScale(valueMin, valueMax);
        contaminantLayers[chemicalName].eachLayer(marker => {
            const value = marker.options._chemValue;
            const depth = marker.options._depth;
            // color by value
            let color = colors[0];
            if (value > breaks[2]) color = colors[3];
            else if (value > breaks[1]) color = colors[2];
            else if (value > breaks[0]) color = colors[1];
            // radius by depth (3 levels, log)
            const radius = getLogDepthRadius3Levels(depth, depthMin, depthMax);
            marker.setStyle({ fillColor: color, radius });
        });
    }

// Also add debugging to the toggle function:
function toggleVisualizationMode() {
    console.log("toggleVisualizationMode called");
    console.log("activeContaminant:", activeContaminant);
    console.log("isHeatmapMode:", isHeatmapMode);
    
    if (!activeContaminant) {
        console.log("No active contaminant - exiting");
        return;
    }
    
    console.log("Available heatmaps:", Object.keys(contaminantHeatmaps));
    console.log("Available point layers:", Object.keys(contaminantLayers));
    let currentContaminant = activeContaminant;
    if (isHeatmapMode) {
        // Switch to points
        console.log("Switching from heatmap to points");
        if (contaminantHeatmaps[activeContaminant] && map.hasLayer(contaminantHeatmaps[activeContaminant])) {
            map.removeLayer(contaminantHeatmaps[activeContaminant]);
        }
        activeContaminant = currentContaminant; // Ensure activeContaminant is set
        if (contaminantLayers[activeContaminant]) {
            map.addLayer(contaminantLayers[activeContaminant]);
            applyDynamicStyling(activeContaminant);
        }
        isHeatmapMode = false;
        updateLegendForMode();
    } else {
        // Switch to heatmap
        console.log("Switching from points to heatmap");
        if (contaminantLayers[activeContaminant] && map.hasLayer(contaminantLayers[activeContaminant])) {
            map.removeLayer(contaminantLayers[activeContaminant]);
        }
        activeContaminant = currentContaminant; // Ensure activeContaminant is set
        if (contaminantHeatmaps[activeContaminant]) {
            map.addLayer(contaminantHeatmaps[activeContaminant]);
        }
        isHeatmapMode = true;
        updateLegendForMode();
    }
}

/*    // Toggle between point and heatmap visualization
    function toggleVisualizationMode() {
        if (!activeContaminant) return;
        if (isHeatmapMode) {
            // Switch to points
            if (contaminantHeatmaps[activeContaminant] && map.hasLayer(contaminantHeatmaps[activeContaminant])) {
                map.removeLayer(contaminantHeatmaps[activeContaminant]);
            }
            if (contaminantLayers[activeContaminant]) {
                map.addLayer(contaminantLayers[activeContaminant]);
                applyDynamicStyling(activeContaminant);
            }
            isHeatmapMode = false;
            updateLegendForMode();
        } else {
            // Switch to heatmap
console.log("Switching to heatmap for", contaminantLayers[activeContaminant] && map.hasLayer(contaminantLayers[activeContaminant]));
            if (contaminantLayers[activeContaminant] && map.hasLayer(contaminantLayers[activeContaminant])) {
                map.removeLayer(contaminantLayers[activeContaminant]);
            }
console.log("Active contaminant:", activeContaminant);
console.log("Heatmap layer:", contaminantHeatmaps);
console.log("Point layer:", contaminantLayers[activeContaminant]);
console.log("Removing point layer, adding heatmap layer", contaminantHeatmaps[activeContaminant]);  
            if (contaminantHeatmaps[activeContaminant]) {
                map.addLayer(contaminantHeatmaps[activeContaminant]);
            }
            isHeatmapMode = true;
            updateLegendForMode();
        }
    }*/

    // ---- Legend (bottom-right): gradient for value (min/max), and depth scale preview ----
    let legend = L.control({ position: "bottomright" });
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
        console.log('Updating legend with props:', props, 'isHeatmapMode:', isHeatmapMode, 'activeContaminant:', activeContaminant);
        if (!props || !activeContaminant) {
            this._div.innerHTML = `
<h4>Contaminant legend</h4>
<i>Toggle a contaminant layer</i>
`;
            return;
        }
        const { chemicalName } = props;
        const stats = contaminantStats[chemicalName];
        if (!stats) {
            this._div.innerHTML = "<h4>Contaminant legend</h4><i>No data</i>";
            return;
        }
        const unit = stats.unit ? ` ${stats.unit}` : "";
        const min = stats.valueMin, max = stats.valueMax;
        const { colors } = getColorScale(min, max);
        const toggleButton = `
<button onclick="window.toggleVisualizationMode()" style="
background: #007cba; color: white; border: none;
padding: 8px 12px; border-radius: 4px; cursor: pointer;
margin-bottom: 10px; width: 100%; font-size: 12px;
">
Switch to ${isHeatmapMode ? 'Points' : 'Heatmap'}
</button>
`;
        const legendType = isHeatmapMode ? 'Heat Intensity' : 'Point Colors';
        const legendContent = isHeatmapMode ? `
<div style="
height: 20px;
width: 100%;
background: linear-gradient(to right, #1a9850, #fee08b, #fc8d59, #d73027);
border: 1px solid #999;
margin-bottom: 5px;
"></div>
<div style="display: flex; justify-content: space-between; font-size: 12px;">
<span>Low</span>
<span>High</span>
</div>
` : `
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
        const depthLegend = !isHeatmapMode ? `
<br>
<div><strong>Sample depth → radius</strong><br>
${makeDepthLegend(stats.depthMin, stats.depthMax)}</div>
` : '';
        this._div.innerHTML = `
<h4>${chemicalName}</h4>
${toggleButton}
<strong>${legendType}</strong>
${legendContent}
${depthLegend}
`;
    };
    legend.addTo(map);
    // Make toggleVisualizationMode globally accessible
    window.toggleVisualizationMode = toggleVisualizationMode;
    // Track visible dataset/date markers separately
    let datasetLayers = {};
    datesSampled.forEach(dateSampled => {
        markerLayers[dateSampled] = [];
        Object.keys(markers[dateSampled]).forEach(sample => {
            if (markers[dateSampled][sample]) {
                markerLayers[dateSampled].push(markers[dateSampled][sample]);
            }
        });
        datasetLayers[dateSampled] = L.layerGroup(markerLayers[dateSampled]).addTo(map);
    });
/*    // Replace old layerControl with both dataset + contaminant overlays
    let overlayLayers = {
        ...shapeOverlay,
        ...datasetLayers,
        ...contaminantLayers
    };
    let layerControl = L.control.layers(mapLayers, overlayLayers).addTo(map);*/

    // Add this debugging code right before creating the layer control:

//console.log("Available contaminant layers:", Object.keys(contaminantLayers));

// Replace the layer control creation with this debug version:
let overlayLayers = {
    ...shapeOverlay,
    ...datasetLayers,
    ...contaminantLayers
};

//console.log("Final overlay layers:", overlayLayers);

// Create a scrollable, searchable contaminant control for 100+ contaminants
function createScrollableContaminantControl() {
    const contaminantControl = L.control({ position: 'topright' });
    
    contaminantControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded contaminant-control');
        
        // Add custom CSS for scrollable control
        const style = document.createElement('style');
        style.textContent = `
            .contaminant-control {
                width: 250px;
                max-height: 400px;
                background: white;
                border: 2px solid rgba(0,0,0,0.2);
                border-radius: 5px;
            }
            .contaminant-search {
                width: 100%;
                padding: 8px;
                margin-bottom: 8px;
                border: 1px solid #ccc;
                border-radius: 3px;
                box-sizing: border-box;
            }
            .contaminant-list {
                max-height: 300px;
                overflow-y: auto;
                padding: 0 8px;
            }
            .contaminant-item {
                margin: 4px 0;
                display: flex;
                align-items: center;
            }
            .contaminant-item input {
                margin-right: 8px;
            }
            .contaminant-item label {
                cursor: pointer;
                display: flex;
                align-items: center;
                width: 100%;
                padding: 2px 0;
                font-size: 13px;
            }
            .contaminant-item label:hover {
                background-color: #f0f0f0;
            }
            .contaminant-header {
                font-weight: bold;
                padding: 8px;
                border-bottom: 1px solid #eee;
                background-color: #f9f9f9;
            }
        `;
        document.head.appendChild(style);
        
        // Get sorted list of contaminants
        const contaminantNames = Object.keys(contaminantLayers).sort();
        
        div.innerHTML = `
            <div class="contaminant-header">
                Contaminant Layers
            </div>
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
        
        // Add search functionality
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
        
        // Add event listeners for radio buttons
        div.addEventListener('change', function(e) {
            if (e.target.type === 'radio') {
                const selectedContaminant = e.target.value;
                console.log('Selected contaminant:', selectedContaminant);
                
                // Hide all contaminant layers and heatmaps first
                Object.keys(contaminantLayers).forEach(chem => {
                    if (map.hasLayer(contaminantLayers[chem])) {
                        map.removeLayer(contaminantLayers[chem]);
                    }
                    if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) {
                        map.removeLayer(contaminantHeatmaps[chem]);
                    }
                });
                
                if (selectedContaminant === 'none') {
                    // Show all dataset layers
                    Object.keys(datasetLayers).forEach(datasetName => {
                        if (!map.hasLayer(datasetLayers[datasetName])) {
                            map.addLayer(datasetLayers[datasetName]);
                        }
                    });
                    
                    // Show KML/shape overlays if they were visible
                    Object.keys(shapeOverlay).forEach(shapeName => {
                        if (!Object.keys(contaminantLayers).includes(shapeName) && 
                            !Object.keys(datasetLayers).includes(shapeName)) {
                            if (!map.hasLayer(shapeOverlay[shapeName])) {
                                map.addLayer(shapeOverlay[shapeName]);
                            }
                        }
                    });
                    
                    activeContaminant = null;
                    isHeatmapMode = false;
                    legend.update();
                } else {
                    // Hide all dataset layers when showing contaminant
                    Object.keys(datasetLayers).forEach(datasetName => {
                        if (map.hasLayer(datasetLayers[datasetName])) {
                            map.removeLayer(datasetLayers[datasetName]);
                        }
                    });
                    
                    // Hide shape overlays to avoid clutter
                    Object.keys(shapeOverlay).forEach(shapeName => {
                        if (!Object.keys(contaminantLayers).includes(shapeName) && 
                            !Object.keys(datasetLayers).includes(shapeName)) {
                            if (map.hasLayer(shapeOverlay[shapeName])) {
                                map.removeLayer(shapeOverlay[shapeName]);
                            }
                        }
                    });
                    
                    // Show selected contaminant layer
                    activeContaminant = selectedContaminant;
                    isHeatmapMode = false;
                    
                    if (contaminantLayers[selectedContaminant]) {
                        map.addLayer(contaminantLayers[selectedContaminant]);
                        applyDynamicStyling(selectedContaminant);
                        legend.update({ chemicalName: selectedContaminant });
                    }
                }
            }
        });
        
        // Prevent map interactions when using the control
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        
        return div;
    };
    
    return contaminantControl;
}

// Replace the layer control creation section with this:
// Comment out or remove the original layer control
// let layerControl = L.control.layers(mapLayers, overlayLayers).addTo(map);

// Create separate controls for base layers and contaminants
let baseLayerControl = L.control.layers(mapLayers, {}).addTo(map);
let contaminantControl = createScrollableContaminantControl().addTo(map);

// Optional: Add dataset layer control separately if needed
function createDatasetControl() {
    const datasetControl = L.control({ position: 'topleft' });
    
    datasetControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control-layers-expanded');
        div.innerHTML = `
            <form>
                <label style="font-weight: bold;">Dataset Layers</label>
                <div class="leaflet-control-layers-separator"></div>
                ${Object.keys(datasetLayers).map(dataset => `
                    <label>
                        <input type="checkbox" value="${dataset}" checked />
                        <span> ${selectedSampleInfo[dataset]?.label || dataset}</span>
                    </label>
                `).join('')}
            </form>
        `;
        
        div.addEventListener('change', function(e) {
            if (e.target.type === 'checkbox') {
                const datasetName = e.target.value;
                if (e.target.checked) {
                    if (!map.hasLayer(datasetLayers[datasetName])) {
                        map.addLayer(datasetLayers[datasetName]);
                    }
                } else {
                    if (map.hasLayer(datasetLayers[datasetName])) {
                        map.removeLayer(datasetLayers[datasetName]);
                    }
                }
            }
        });
        
        L.DomEvent.disableClickPropagation(div);
        return div;
    };
    
    return datasetControl;
}

// Uncomment if you want separate dataset control:
// let datasetControl = createDatasetControl().addTo(map);



//let layerControl = L.control.layers(mapLayers).addTo(map);
//let contaminantLayerControl = createExclusiveContaminantControl().addTo(map);

// Add comprehensive debugging to the event handlers:

// 2. Modified event handlers to hide dataset layers when contaminant layers are shown
map.on("overlayadd", function (e) {
    console.log("Layer added:", e.name);
    
    // Check if this is a contaminant layer
    const layerNameFromObject = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    
    if (layerNameFromObject) {
        console.log("Contaminant layer activated:", layerNameFromObject);
        activeContaminant = layerNameFromObject;
        
        // Hide ALL dataset layers when a contaminant layer is activated
        Object.keys(datasetLayers).forEach(datasetName => {
            if (map.hasLayer(datasetLayers[datasetName])) {
                map.removeLayer(datasetLayers[datasetName]);
                // Update the layer control to show these as unchecked
                // Note: This won't update the checkboxes in the UI automatically
            }
        });
        
        // Remove any other active contaminant layers and their heatmaps
        Object.keys(contaminantLayers).forEach(chem => {
            if (chem !== layerNameFromObject) {
                if (map.hasLayer(contaminantLayers[chem])) {
                    map.removeLayer(contaminantLayers[chem]);
                }
                if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) {
                    map.removeLayer(contaminantHeatmaps[chem]);
                }
            }
        });
        
        // Start in point mode for newly activated contaminant
        isHeatmapMode = false;
        applyDynamicStyling(layerNameFromObject);
        legend.update({ chemicalName: layerNameFromObject });
    }
});

map.on("overlayremove", function (e) {
    const layerNameFromObject = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    
    if (layerNameFromObject && activeContaminant === layerNameFromObject) {
        console.log("Contaminant layer deactivated:", layerNameFromObject);
        
        // Remove heatmap if visible
        if (contaminantHeatmaps[layerNameFromObject] && map.hasLayer(contaminantHeatmaps[layerNameFromObject])) {
            map.removeLayer(contaminantHeatmaps[layerNameFromObject]);
        }
        
        // Re-show all dataset layers when contaminant layer is removed
        Object.keys(datasetLayers).forEach(datasetName => {
            if (!map.hasLayer(datasetLayers[datasetName])) {
                map.addLayer(datasetLayers[datasetName]);
            }
        });
        
        activeContaminant = null;
        isHeatmapMode = false;
        legend.update();
    }
});


/*map.on("overlayadd", function (e) {
    console.log("Layer added event:", e);
    console.log("Layer name from event:", e.name);
    console.log("Layer object from event:", e.layer);
    console.log("Available contaminant layer names:", Object.keys(contaminantLayers));
    
    // Method 1: Direct name lookup
    if (contaminantLayers[e.name]) {
        console.log("Method 1 worked - direct name match");
        activeContaminant = e.name;
    }
    
    // Method 2: Layer object comparison
    const layerNameFromObject = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    
    if (layerNameFromObject) {
        console.log("Method 2 worked - layer object match:", layerNameFromObject);
        activeContaminant = layerNameFromObject;
        
        // Remove any other active contaminant layers and their heatmaps
        Object.keys(contaminantLayers).forEach(chem => {
            if (chem !== layerNameFromObject) {
                if (map.hasLayer(contaminantLayers[chem])) {
                    map.removeLayer(contaminantLayers[chem]);
                }
                if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) {
                    map.removeLayer(contaminantHeatmaps[chem]);
                }
            }
        });
        
        // Start in point mode for newly activated contaminant
        isHeatmapMode = false;
        applyDynamicStyling(layerNameFromObject);
        legend.update({ chemicalName: layerNameFromObject });
    }
    
    console.log("Active contaminant after processing:", activeContaminant);
});

map.on("overlayremove", function (e) {
    console.log("Layer removed event:", e);
    
    const layerNameFromObject = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    
    if (layerNameFromObject && activeContaminant === layerNameFromObject) {
        console.log("Removing active contaminant:", layerNameFromObject);
        if (contaminantHeatmaps[layerNameFromObject] && map.hasLayer(contaminantHeatmaps[layerNameFromObject])) {
            map.removeLayer(contaminantHeatmaps[layerNameFromObject]);
        }
//        activeContaminant = null;
        isHeatmapMode = false;
        legend.update();
    }
});*/


/*// Style + legend sync on layer toggle
map.on("overlayadd", function (e) {
    // Find which contaminant layer this corresponds to
    const layerName = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    
    if (layerName) {
        // This is a contaminant layer being added
        activeContaminant = layerName;
        console.log("Setting active contaminant to:", layerName);
        
        // Remove any other active contaminant layers and their heatmaps
        Object.keys(contaminantLayers).forEach(chem => {
            if (chem !== layerName) {
                if (map.hasLayer(contaminantLayers[chem])) {
                    map.removeLayer(contaminantLayers[chem]);
                }
                if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) {
                    map.removeLayer(contaminantHeatmaps[chem]);
                }
            }
        });
        
        // Start in point mode for newly activated contaminant
        isHeatmapMode = false;
        applyDynamicStyling(layerName);
        legend.update({ chemicalName: layerName });
    }
});

map.on("overlayremove", function (e) {
    // Find which contaminant layer this corresponds to
    const layerName = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    
    if (layerName && activeContaminant === layerName) {
        console.log("Removing active contaminant:", layerName);
        // If removing the active contaminant, also remove its heatmap if visible
        if (contaminantHeatmaps[layerName] && map.hasLayer(contaminantHeatmaps[layerName])) {
            map.removeLayer(contaminantHeatmaps[layerName]);
        }
        activeContaminant = null;
        isHeatmapMode = false;
        legend.update(); // clear legend when contaminant hidden
    }
});*/

 /*   // Style + legend sync on layer toggle
    map.on("overlayadd", function (e) {
        if (contaminantLayers[e.name]) {
            // Check if this is a contaminant layer being added
            activeContaminant = e.name;
            // Remove any other active contaminant layers and their heatmaps
            Object.keys(contaminantLayers).forEach(chem => {
                if (chem !== e.name) {
                    if (map.hasLayer(contaminantLayers[chem])) {
                        map.removeLayer(contaminantLayers[chem]);
                    }
                    if (contaminantHeatmaps[chem] && map.hasLayer(contaminantHeatmaps[chem])) {
                        map.removeLayer(contaminantHeatmaps[chem]);
                    }
                }
            });
            // Start in point mode for newly activated contaminant
            isHeatmapMode = false;
            applyDynamicStyling(e.name);
            legend.update({ chemicalName: e.name });
        }
    });
    map.on("overlayremove", function (e) {
        if (contaminantLayers[e.name]) {
            // If removing the active contaminant, also remove its heatmap if visible
            if (activeContaminant === e.name) {
                if (contaminantHeatmaps[e.name] && map.hasLayer(contaminantHeatmaps[e.name])) {
                    map.removeLayer(contaminantHeatmaps[e.name]);
                }
                activeContaminant = null;
                isHeatmapMode = false;
                legend.update(); // clear legend when contaminant hidden
            }
        }
    });*/
/*    // Handle when a contaminant overlay is turned on
map.on("overlayadd", function (e) {
    // Find which chemical name this layer corresponds to
    const layerName = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    if (layerName) {
        activeContaminant = layerName;
        applyDynamicStyling(layerName);
        legend.update({ chemicalName: layerName });
    }
});

// Handle when a contaminant overlay is turned off
map.on("overlayremove", function (e) {
    const layerName = Object.keys(contaminantLayers).find(
        chem => contaminantLayers[chem] === e.layer
    );
    if (layerName && activeContaminant === layerName) {
        activeContaminant = null;
        legend.update(null); // clear legend
    }
});*/

}





// Utilities kept from your original
function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}
function exportCharts() {
    for (let i = 1; i < lastInstanceNo + 1; i++) {
        if (!(instanceType[i].includes('Scatter'))) {
            exportChart(i);
        }
    }
}
let allMapMarkers = [];
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
    if (!allMapMarkers || allMapMarkers.length === 0) return;
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
            if (hasOverlap) marker.closeTooltip();
            else visibleTooltips.push(currentTooltip);
        });
    } else {
        if (button) button.textContent = 'Show All Sample Names';
        allMapMarkers.forEach(marker => marker.closeTooltip());
    }
}
function exportChart(currentInstanceNo) {
    const now = new Date();
    const formattedDate = now.toISOString().slice(2, 16).replace(/[-T:]/g, '');
    const canvas = document.getElementById('chart' + currentInstanceNo);
    const url = canvas.toDataURL('image/png');
    const exportLink = document.createElement('a');
    const filename = `${formattedDate}-${instanceSheet[currentInstanceNo]}-${instanceType[currentInstanceNo]}.png`;
    exportLink.href = url;
    exportLink.download = filename;
    exportLink.click();
}