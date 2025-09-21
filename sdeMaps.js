let permanentTooltipLayer;
let contaminantHeatmaps = {};
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
let dateColors = {};
let markers = {};
let minLat = null, maxLat = null, minLon = null, maxLon = null;
let noLocations = 0, latSum = 0, lonSum = 0;
const hoverStyle = { radius: 10, weight: 3, opacity: 1, fillOpacity: 1 };

const highlightStyle = {
    radius: 10, fillColor: '#FFFF00', color: '#000000', weight: 2, opacity: 1, fillOpacity: 1
};

    function getHeatmapColor(intensity) {
        if (intensity <= 0.2) return '#1a9850';
        if (intensity <= 0.4) return '#fee08b';
        if (intensity <= 0.6) return '#fc8d59';
        if (intensity <= 0.8) return '#f46d43';
        return '#d73027';
    }

    function getLogDepthRadius3Levels(depth, depthMin, depthMax) {
        const rSmall = 6, rMed = 12, rLarge = 18;
        if (depth == null || isNaN(depth) || depthMin === depthMax) return rSmall;
        const logMin = Math.log((depthMin ?? 0) + 1);
        const logMax = Math.log((depthMax ?? 0) + 1);
        const logVal = Math.log(depth + 1);
        const t = (logVal - logMin) / (logMax - logMin);
        if (t <= 1 / 3) return rSmall;
        if (t <= 2 / 3) return rMed;
        return rLarge;
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

//function createGlobalLayers(selectedSampleMeasurements, selectedSampleInfo) {
function createGlobalLayers() {
console.log('Creating global layers...');
    if (allMapData.isReady) {
        console.log("Layers already generated. Skipping regeneration.");
        return;
    }
console.log(selectedSampleMeasurements, selectedSampleInfo);
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
console.log(datesSampled);
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
console.log(datesSampled);
console.log(noSamples, allSamples);

    let sampleDepths = {};
    let depthStatsGlobal = { min: Infinity, max: -Infinity };
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
console.log(sampleDepths, depthStatsGlobal);
    function computeContaminationStats(measurements, sampleInfo) {
        const statsByChem = {};
        Object.keys(measurements).forEach(datasetName => {
            const dataset = measurements[datasetName];
            Object.keys(dataset).forEach(sheetName => {
                if (sheetName === "Physical Data") return;
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
        Object.keys(statsByChem).forEach(chem => {
            const s = statsByChem[chem];
            if (s.valueMin === Infinity) s.valueMin = 0;
            if (s.valueMax === -Infinity) s.valueMax = 0;
            if (s.depthMin === Infinity) s.depthMin = 0;
            if (s.depthMax === -Infinity) s.depthMax = 0;
        });
        return statsByChem;
    }

    function applyDynamicStyling(chemicalName) {
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        const { valueMin, valueMax, depthMin, depthMax } = stats;
        const { breaks, colors } = getColorScale(valueMin, valueMax);
        contaminantLayers[chemicalName].eachLayer(marker => {
            const value = marker.options._chemValue;
            const depth = marker.options._depth;
            let color = colors[0];
            if (value > breaks[2]) color = colors[3];
            else if (value > breaks[1]) color = colors[2];
            else if (value > breaks[0]) color = colors[1];
            const radius = getLogDepthRadius3Levels(depth, depthMin, depthMax);
            marker.setStyle({ fillColor: color, radius });
        });
    }

    function getColorScale(min, max) {
        const breaks = [min, min + (max - min) * 0.33, min + (max - min) * 0.66, max];
        const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
        return { breaks, colors };
    }

/*        let depthStatsGlobal = { min: Infinity, max: -Infinity };
    let sampleDepths = {};
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
    });*/
    const depthSortedSampleIds = Object.keys(sampleDepths).sort((a, b) => {
        return sampleDepths[b] - sampleDepths[a];
    });

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
                };
                marker = L.circleMarker([lat, lon], originalCircleOptions)
                    .bindTooltip(alternateName);
                marker.options.customId = fullSample;
                marker.options.originalStyle = originalCircleOptions;
                // Add a property to track the highlight state
                marker.options.isHighlighted = false;

/*                marker.on({
                    mouseover: (e) => {
                        const layer = e.target;
                        // Don't change style if already highlighted
                        if (!layer.options.isHighlighted) {
                            layer.setStyle(hoverStyle);
                        }
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            layer.bringToFront();
                        }
                    },
                    mouseout: (e) => {
                        const layer = e.target;
                        // Only reset the style if the marker is NOT highlighted
                        if (!layer.options.isHighlighted) {
                            layer.setStyle(layer.options.originalStyle);
                        }
                    },
                    click: (e) => {
                        const layer = e.target;
                        if (layer.options.isHighlighted) {
                            // If highlighted, reset to original style
                            layer.setStyle(layer.options.originalStyle);
                            layer.options.isHighlighted = false;
                        } else {
                            // If not highlighted, apply the highlight style
                            layer.setStyle(highlightStyle);
                            layer.options.isHighlighted = true;
                        }
                    }
                });*/
                marker.on('click', (e) => createHighlights(e.target.options.customId));
                highlightMarkers[fullSample] = L.circleMarker(new L.LatLng(lat, lon), highlightStyle).bindTooltip(alternateName);
                highlightMarkers[fullSample].options.customId = fullSample;
                highlightMarkers[fullSample].on('click', (e) => createHighlights(e.target.options.customId));
                noLocations += 1;
                latSum += lat;
                lonSum += lon;
/*                marker.on({
                    mouseover: (e) => { const layer = e.target; layer.setStyle(hoverStyle); if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) layer.bringToFront(); },
                    mouseout: (e) => { e.target.setStyle(e.target.options.originalStyle); }
                });
                marker.on('click', (e) => createHighlights(e.target.options.customId));
                highlightMarkers[fullSample] = L.circleMarker(new L.LatLng(lat, lon), highlightStyle).bindTooltip(alternateName);
                highlightMarkers[fullSample].options.customId = fullSample;
                highlightMarkers[fullSample].on('click', (e) => createHighlights(e.target.options.customId));
                noLocations += 1; latSum += lat; lonSum += lon;*/
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

    contaminantStats = computeContaminationStats(selectedSampleMeasurements, selectedSampleInfo);
    let contaminantMarkerData = {};

    Object.keys(selectedSampleMeasurements).forEach(datasetName => {
        const dataset = selectedSampleMeasurements[datasetName];
        Object.keys(dataset).forEach(sheetName => {
            if (sheetName === "Physical Data") return;
            const sheet = dataset[sheetName];
            if (!sheet?.chemicals) return;
            Object.keys(sheet.chemicals).forEach(chemicalName => {
                const chemical = sheet.chemicals[chemicalName];
                if (!contaminantLayers[chemicalName]) contaminantLayers[chemicalName] = L.layerGroup();
                if (!contaminantMarkerData[chemicalName]) contaminantMarkerData[chemicalName] = [];
                const unit = chemical.unit ?? (contaminantStats[chemicalName]?.unit ?? "");
//                Object.keys(chemical.samples || {}).forEach(sampleName => {
    depthSortedSampleIds.forEach(fullSampleName => {
        let parts = fullSampleName.split(": ");
        if (parts.length > 2) parts[1] = parts[1] + ': ' + parts[2];
        sampleName = parts[1];

//                    const fullSampleName = `${datasetName}: ${sampleName}`;
                    const value = chemical.samples[sampleName];
                    if (value == null || isNaN(value)) return;
                    const sampleInfo = selectedSampleInfo[datasetName]?.position?.[sampleName];
                    if (!sampleInfo) return;
                    const lat = parseFloat(sampleInfo["Position latitude"]);
                    const lon = parseFloat(sampleInfo["Position longitude"]);
                    if (isNaN(lat) || isNaN(lon)) return;
                    const sampleLabel = selectedSampleInfo[datasetName]?.label + ' : ' + sampleInfo.label;
                    const unitSuffix = unit ? ` ${unit}` : "";
                    const tooltipHtml = `${sampleLabel}<br>${chemicalName}: ${value}${unitSuffix}<br>Depth: ${sampleDepths[fullSampleName]} m`;
                    const m = L.circleMarker([lat, lon], {
                        radius: 6,
                        fillColor: "#999",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).bindTooltip(tooltipHtml);
                    m.options._chemValue = value;
                    m.options._chemUnit = unit || "";
                    m.options._depth = sampleDepths[fullSampleName];
                    contaminantLayers[chemicalName].addLayer(m);
                    contaminantMarkerData[chemicalName].push(m);
                });
            });
        });
    });

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

// Helper function to force a complete map refresh
function forceMapRefresh(containerId) {
    const container = document.getElementById(containerId);
    if (container && container._leaflet_map) {
        const map = container._leaflet_map;
        
        // Force multiple invalidateSize calls with different parameters
        setTimeout(() => {
            map.invalidateSize(true);
            setTimeout(() => {
                map.invalidateSize({ pan: false });
                setTimeout(() => {
                    map.invalidateSize(true);
                    // Force tiles to reload
                    map.eachLayer(layer => {
                        if (layer._url) { // It's a tile layer
                            layer.redraw();
                        }
                    });
                }, 50);
            }, 50);
        }, 50);
    }
}

// You can call this function after creating your maps if they still don't render properly:
// Example usage:
// forceMapRefresh('large-contaminant-map');
// allContaminants.forEach((_, index) => {
//     forceMapRefresh(`smallmap-${index}`);
// });


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
    
    // Check if the container already has an active Leaflet map instance
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
/*    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = contaminantLayers[contaminantName];
    } else if (visualizationType === 'heatmap' && contaminantHeatmaps[contaminantName]) {
        layerToAdd = contaminantHeatmaps[contaminantName];
    }*/
    // Clone the relevant layer to avoid layer being removed when expanded in larger map
    if (visualizationType === 'points' && allMapData.contaminantLayers[contaminantName]) {
        // Create a new LayerGroup for this specific map
        layerToAdd = L.layerGroup();
        // Iterate over the master layer's components and clone them
        allMapData.contaminantLayers[contaminantName].eachLayer(layer => {
            const clonedLayer = L.circleMarker(layer.getLatLng(), { ...layer.options });
            if (layer.getTooltip()) {
                clonedLayer.bindTooltip(layer.getTooltip().getContent(), { ...layer.getTooltip().options });
            }
            layerToAdd.addLayer(clonedLayer);
        });
    } else if (visualizationType === 'heatmap' && allMapData.contaminantHeatmaps[contaminantName]) {
        // Do the same for heatmap layers
        layerToAdd = L.layerGroup();
        allMapData.contaminantHeatmaps[contaminantName].eachLayer(layer => {
            layerToAdd.addLayer(L.circle(layer.getLatLng(), { ...layer.options }));
        });
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
            // Simple timeout approach - just like your original working code but with a small delay
            setTimeout(() => {
                container.offsetWidth; // Force layout recalculation
                staticMap.invalidateSize();
                staticMap.fitBounds(bounds, { padding: [20, 20] });
            }, 150); // Slightly longer timeout
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }
}

/*function ClaudeV4createStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap', retryCount = 0) {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    // Check if the container already has an active Leaflet map instance
    if (container._leaflet_id !== undefined) {
        console.log(`Removing existing map from container with ID: ${containerId}`);
        container._leaflet_map.remove();
        delete container._leaflet_map;
    }
    
    // Ensure container has explicit dimensions with retry limit
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
        if (retryCount < 10) { // Max 10 retries (500ms total wait)
            console.warn(`Container ${containerId} has zero dimensions, waiting... (attempt ${retryCount + 1}/10)`);
            setTimeout(() => createStaticContaminantMap(containerId, contaminantName, visualizationType, mapTile, retryCount + 1), 50);
            return;
        } else {
            console.error(`Container ${containerId} never got proper dimensions after 10 retries. Skipping map creation.`);
            return;
        }
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
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = contaminantLayers[contaminantName];
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
            // Simple approach: just ensure the map knows its size and fit the bounds
            staticMap.invalidateSize();
            staticMap.fitBounds(bounds, { 
                padding: [20, 20],
                maxZoom: 16
            });
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }
}*/

//Claude V6
// APPROACH 2: Use ResizeObserver to detect when container gets proper dimensions
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
    
    // Check if the container already has an active Leaflet map instance
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
            
            if (!mapCreated && width > 100 && height > 100) { // Reasonable minimum sizes
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
                    layerToAdd = contaminantLayers[contaminantName];
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
                            const legend = L.control({ position: 'bottomright' });
                            legend.onAdd = function () {
                                const div = L.DomUtil.create('div', 'info legend');
                                const stats = contaminantStats[contaminantName];
                                const unit = stats.unit ? ` ${stats.unit}` : "";
                                const min = stats.valueMin, max = stats.valueMax;
                                const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];

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
            }
        });
    });

    resizeObserver.observe(container);
    
}


function ClaudeV3createStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap', retryCount = 0 ) {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    // Check if the container already has an active Leaflet map instance
    if (container._leaflet_id !== undefined) {
        console.log(`Removing existing map from container with ID: ${containerId}`);
        container._leaflet_map.remove();
        delete container._leaflet_map;
    }
    
    // Ensure container has explicit dimensions
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
        console.warn(`Container ${containerId} has zero dimensions, waiting...`);
        setTimeout(() => createStaticContaminantMap(containerId, contaminantName, visualizationType, mapTile), 50);
        return;
    }
/*   if (containerRect.width === 0 || containerRect.height === 0) {
        if (retryCount < 100) { // Max 10 retries (500ms total wait)
            console.warn(`Container ${containerId} has zero dimensions, waiting... (attempt ${retryCount + 1}/10)`);
            setTimeout(() => createStaticContaminantMap(containerId, contaminantName, visualizationType, mapTile, retryCount + 1), 50);
            return;
        } else {
            console.error(`Container ${containerId} never got proper dimensions after 10 retries. Skipping map creation.`);
            return;
        }
    }*/
    
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
        layerToAdd = contaminantLayers[contaminantName];
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
            // Simple approach: just ensure the map knows its size and fit the bounds
            staticMap.invalidateSize();
            staticMap.fitBounds(bounds, { 
                padding: [20, 20],
                maxZoom: 16
            });
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }
}

function ClaudeV2createStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    // Check if the container already has an active Leaflet map instance
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
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = contaminantLayers[contaminantName];
    } else if (visualizationType === 'heatmap' && contaminantHeatmaps[contaminantName]) {
        layerToAdd = contaminantHeatmaps[contaminantName];
    }

    if (layerToAdd) {
        layerToAdd.addTo(staticMap);
        
        // Collect all points to create bounds
        const bounds = new L.LatLngBounds([]);
        layerToAdd.eachLayer(layer => {
            if (layer.getLatLng) {
                bounds.extend(layer.getLatLng());
            }
        });
        
        if (bounds.isValid()) {
            // Multi-step approach to ensure proper map rendering
            setTimeout(() => {
                // Step 1: Force multiple layout recalculations
                container.offsetWidth;
                container.offsetHeight;
                
                // Step 2: Invalidate size multiple times to ensure Leaflet recalculates
                staticMap.invalidateSize(true); // Force hard reset
                
                // Step 3: Brief pause then invalidate again
                setTimeout(() => {
                    staticMap.invalidateSize(true);
                    
                    // Step 4: Fit bounds after ensuring size is correct
                    const containerRect = container.getBoundingClientRect();
                    const isSmallContainer = containerRect.width < 300 || containerRect.height < 300;
                    
                    const padding = isSmallContainer ? [10, 10] : [20, 20];
                    const maxZoom = isSmallContainer ? 16 : 18;
                    
                    staticMap.fitBounds(bounds, { 
                        padding: padding,
                        maxZoom: maxZoom
                    });
                    
                    // Step 5: Final invalidateSize after fitBounds
                    setTimeout(() => {
                        staticMap.invalidateSize(true);
                    }, 50);
                    
                }, 50);
            }, 100);
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }
}

function ClaudeV1createStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    // Check if the container already has an active Leaflet map instance
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
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = contaminantLayers[contaminantName];
    } else if (visualizationType === 'heatmap' && contaminantHeatmaps[contaminantName]) {
        layerToAdd = contaminantHeatmaps[contaminantName];
    }

    if (layerToAdd) {
        layerToAdd.addTo(staticMap);
        
        // Collect all points to create bounds
        const bounds = new L.LatLngBounds([]);
        layerToAdd.eachLayer(layer => {
            if (layer.getLatLng) {
                bounds.extend(layer.getLatLng());
            }
        });
        
        if (bounds.isValid()) {
            // SOLUTION 1: Use setTimeout to ensure DOM is fully rendered
            setTimeout(() => {
                // Force layout recalculation
                container.offsetWidth;
                
                // Invalidate size to account for the container dimensions
                staticMap.invalidateSize();
                
                // Fit bounds with appropriate padding for small containers
                const containerRect = container.getBoundingClientRect();
                const isSmallContainer = containerRect.width < 300 || containerRect.height < 300;
                
                const padding = isSmallContainer ? [10, 10] : [20, 20];
                const maxZoom = isSmallContainer ? 16 : 18; // Limit zoom for small containers
                
                staticMap.fitBounds(bounds, { 
                    padding: padding,
                    maxZoom: maxZoom
                });
            }, 100); // Increased timeout to ensure rendering is complete
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }
}

function WorkingcreateStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }
console.log(containerId, contaminantName, visualizationType, mapTile);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    // Check if the container already has an active Leaflet map instance
    // The `_leaflet_id` is a reliable property set by Leaflet when a map is initialized.
    if (container._leaflet_id !== undefined) {
        console.log(`Removing existing map from container with ID: ${containerId}`);
        // Safely remove the existing map instance to prevent the reuse error.
        container._leaflet_map.remove();
        // Clear the internal reference to the map instance.
        delete container._leaflet_map;
    }


/*    if (container._leaflet_map) {
console.log("Removing existing map from container");
        container._leaflet_map.remove();
//        container.remove();
    }*/
    
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

    // Corrected logic:
    // Get the correct base layer object from the global collection.
    const baseLayerInstance = baseLayers[mapTile] || baseLayers['OpenStreetMap'];

    // Retrieve the URL and options from the L.tileLayer instance directly.
    // L.tileLayer objects store the URL in a private-like property `_url`.
    const tileLayerUrl = baseLayerInstance._url;
    const tileLayerOptions = baseLayerInstance.options;

    L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(staticMap);

/*    if (baseLayers[mapTile]) {
        baseLayers[mapTile].addTo(staticMap);
    } else {
        baseLayers['OpenStreetMap'].addTo(staticMap);
    }*/

    let layerToAdd;
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = contaminantLayers[contaminantName];
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
/*            // Delay the resizing and fitting to allow the DOM to render.
            setTimeout(() => {
                staticMap.invalidateSize();
                staticMap.fitBounds(bounds, { padding: [20, 20] });
            }, 0);*/
            // Force browser to recalculate layout now
            // Reading a layout property like offsetWidth triggers this process.
            container.offsetWidth;

            staticMap.invalidateSize();
            staticMap.fitBounds(bounds, { padding: [20, 20] });
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }

/*    if (contaminantStats[contaminantName]) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const stats = contaminantStats[contaminantName];
            const unit = stats.unit ? ` ${stats.unit}` : "";
            const min = stats.valueMin, max = stats.valueMax;
            const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
            
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
    }*/
}

function ORIGINALcreateStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }
console.log(containerId, contaminantName, visualizationType, mapTile);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }
    
    // Check if the container already has an active Leaflet map instance
    // The `_leaflet_id` is a reliable property set by Leaflet when a map is initialized.
    if (container._leaflet_id !== undefined) {
        console.log(`Removing existing map from container with ID: ${containerId}`);
        // Safely remove the existing map instance to prevent the reuse error.
        container._leaflet_map.remove();
        // Clear the internal reference to the map instance.
        delete container._leaflet_map;
    }


/*    if (container._leaflet_map) {
console.log("Removing existing map from container");
        container._leaflet_map.remove();
//        container.remove();
    }*/
    
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

    // Corrected logic:
    // Get the correct base layer object from the global collection.
    const baseLayerInstance = baseLayers[mapTile] || baseLayers['OpenStreetMap'];

    // Retrieve the URL and options from the L.tileLayer instance directly.
    // L.tileLayer objects store the URL in a private-like property `_url`.
    const tileLayerUrl = baseLayerInstance._url;
    const tileLayerOptions = baseLayerInstance.options;

    L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(staticMap);

/*    if (baseLayers[mapTile]) {
        baseLayers[mapTile].addTo(staticMap);
    } else {
        baseLayers['OpenStreetMap'].addTo(staticMap);
    }*/

    let layerToAdd;
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = contaminantLayers[contaminantName];
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
            staticMap.fitBounds(bounds, { padding: [20, 20] });
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }

/*    if (contaminantStats[contaminantName]) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const stats = contaminantStats[contaminantName];
            const unit = stats.unit ? ` ${stats.unit}` : "";
            const min = stats.valueMin, max = stats.valueMax;
            const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
            
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
    }*/
}


function NEXTTRYcreateStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }
    console.log(`Creating map for container: ${containerId}, contaminant: ${contaminantName}`);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    if (container._leaflet_map) {
        console.log(`Removing existing map from container: ${containerId}`);
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

    // Clone base map layer before adding it
    if (baseLayers[mapTile]) {
        L.tileLayer(baseLayers[mapTile].options.url, baseLayers[mapTile].options).addTo(staticMap);
    } else {
        L.tileLayer(baseLayers['OpenStreetMap'].options.url, baseLayers['OpenStreetMap'].options).addTo(staticMap);
    }

    let layerToAdd;
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        // Clone the layer group to create a unique instance for this map
        layerToAdd = L.layerGroup();
        contaminantLayers[contaminantName].eachLayer(layer => {
            const newLayer = L.circleMarker(layer.getLatLng(), { ...layer.options });
            // You may need to also clone tooltips if they are complex
            if (layer.getTooltip()) {
                newLayer.bindTooltip(layer.getTooltip().getContent());
            }
            layerToAdd.addLayer(newLayer);
        });
    } else if (visualizationType === 'heatmap' && contaminantHeatmaps[contaminantName]) {
        // Clone the heatmap layer group
        layerToAdd = L.layerGroup();
        contaminantHeatmaps[contaminantName].eachLayer(layer => {
            layerToAdd.addLayer(L.circle(layer.getLatLng(), { ...layer.options }));
        });
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
            staticMap.fitBounds(bounds, { padding: [20, 20] });
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }

    if (contaminantStats[contaminantName]) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const stats = contaminantStats[contaminantName];
            const unit = stats.unit ? ` ${stats.unit}` : "";
            const min = stats.valueMin, max = stats.valueMax;
            const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
            
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

function NEXTNEXTTRYcreateStaticContaminantMap(containerId, contaminantName, visualizationType = 'points', mapTile = 'OpenStreetMap') {
    if (!allMapData.isReady) {
        console.error("Data not yet processed. Call createGlobalLayers first.");
        return;
    }
    console.log(`Creating map for container: ${containerId}, contaminant: ${contaminantName}`);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    if (container._leaflet_map) {
        console.log(`Removing existing map from container: ${containerId}`);
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

    // Corrected logic:
    // Get the correct base layer object from the global collection.
    const baseLayerInstance = baseLayers[mapTile] || baseLayers['OpenStreetMap'];

    // Retrieve the URL and options from the L.tileLayer instance directly.
    // L.tileLayer objects store the URL in a private-like property `_url`.
    const tileLayerUrl = baseLayerInstance._url;
    const tileLayerOptions = baseLayerInstance.options;

    L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(staticMap);

    let layerToAdd;
    if (visualizationType === 'points' && contaminantLayers[contaminantName]) {
        layerToAdd = L.layerGroup();
        contaminantLayers[contaminantName].eachLayer(layer => {
            const newLayer = L.circleMarker(layer.getLatLng(), { ...layer.options });
            if (layer.getTooltip()) {
                newLayer.bindTooltip(layer.getTooltip().getContent());
            }
            layerToAdd.addLayer(newLayer);
        });
    } else if (visualizationType === 'heatmap' && contaminantHeatmaps[contaminantName]) {
        layerToAdd = L.layerGroup();
        contaminantHeatmaps[contaminantName].eachLayer(layer => {
            layerToAdd.addLayer(L.circle(layer.getLatLng(), { ...layer.options }));
        });
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
            staticMap.fitBounds(bounds, { padding: [20, 20] });
        }
    } else {
        console.warn(`Contaminant layer '${contaminantName}' of type '${visualizationType}' not found.`);
    }

    if (contaminantStats[contaminantName]) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const stats = contaminantStats[contaminantName];
            const unit = stats.unit ? ` ${stats.unit}` : "";
            const min = stats.valueMin, max = stats.valueMax;
            const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
            
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

function sampleMap(meas) {
    if (map) map.remove();
//    allMapMarkers = [];
    isHeatmapMode = false;
    activeContaminant = null;

    if (!allMapData.isReady) {
        createGlobalLayers(meas, selectedSampleInfo);
    }
    
//    let latSum = 0, lonSum = 0, noLocations = 0;
//    let minLat = null, maxLat = null, minLon = null, maxLon = null;
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
//    let highlighted = Array(noSamples).fill(false);
    const hoverStyle = { radius: 10, weight: 3, opacity: 1, fillOpacity: 1 };
/*    const highlightStyle = {
        radius: 10, fillColor: '#FFFF00', color: '#000000', weight: 2, opacity: 1, fillOpacity: 1
    };*/

/*    let depthStatsGlobal = { min: Infinity, max: -Infinity };
    let sampleDepths = {};
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
    });*/

/*    function getDepthRadius(depth, min, max) {
        const minRadius = 4, maxRadius = 20;
        if (depth == null || isNaN(depth)) return minRadius;
        const logMin = Math.log((min ?? 0) + 1);
        const logMax = Math.log((max ?? 0) + 1);
        const logVal = Math.log(depth + 1);
        if (logMax === logMin) return minRadius;
        const t = (logVal - logMin) / (logMax - logMin);
        return minRadius + t * (maxRadius - minRadius);
    }*/

    function getColorScale(min, max) {
        // returns gradient endpoints & discrete breaks for 4-step color pick
        const breaks = [min, min + (max - min) * 0.33, min + (max - min) * 0.66, max];
        const colors = ["#1a9850", "#fee08b", "#fc8d59", "#d73027"];
        return { breaks, colors };
    }
    
    map = L.map('map', {
        center: [54.596, -1.177],
        zoom: 13,
        layers: [baseLayers.OpenStreetMap]
    });

    Object.keys(datasetLayers).forEach(datasetName => {
        datasetLayers[datasetName].addTo(map);
    });

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
        kmlLayer.addTo(map);
    }
    
    if (noLocations > 0) {
        const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
        map.fitBounds(bounds);
    }

console.log("Map created", noLocations, noSamples);

    //DUPLICATE from sampleMap
    function applyDynamicStyling(chemicalName) {
        const stats = contaminantStats[chemicalName];
        if (!stats) return;
        const { valueMin, valueMax, depthMin, depthMax } = stats;
        const { breaks, colors } = getColorScale(valueMin, valueMax);
        contaminantLayers[chemicalName].eachLayer(marker => {
            const value = marker.options._chemValue;
            const depth = marker.options._depth;
            let color = colors[0];
            if (value > breaks[2]) color = colors[3];
            else if (value > breaks[1]) color = colors[2];
            else if (value > breaks[0]) color = colors[1];
            const radius = getLogDepthRadius3Levels(depth, depthMin, depthMax);
            marker.setStyle({ fillColor: color, radius });
        });
    }

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
        const min = stats.valueMin, max = stats.valueMax;
        const { colors } = getColorScale(min, max);
        const toggleButton = `<button onclick="window.toggleVisualizationMode()" style="background: #007cba; color: white; border: none;padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; width: 100%; font-size: 12px;">Switch to ${isHeatmapMode ? 'Points' : 'Heatmap'}</button>`;
        const legendType = isHeatmapMode ? 'Heat Intensity' : 'Point Colors';
        const legendContent = isHeatmapMode ? `
<div style="height: 20px; width: 100%; background: linear-gradient(to right, #1a9850, #fee08b, #fc8d59, #d73027); border: 1px solid #999; margin-bottom: 5px;"></div>
<div style="display: flex; justify-content: space-between; font-size: 12px;">
<span>Low</span>
<span>High</span>
</div>
` : `
<div style="height: 20px; width: 100%; background: linear-gradient(to right, ${colors.join(",")}); border: 1px solid #999; margin-bottom: 5px;"></div>
<div style="display: flex; justify-content: space-between; font-size: 12px;">
<span>${isFinite(min) ? min.toFixed(2) : '—'}${unit}</span>
<span>${isFinite(max) ? max.toFixed(2) : '—'}${unit}</span>
</div>
`;
        const depthLegend = (!isHeatmapMode & !(stats.depthMin === stats.depthMax)) ? `
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
    window.toggleVisualizationMode = toggleVisualizationMode;

    function createScrollableContaminantControl() {
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
    }

    let baseLayerControl = L.control.layers(baseLayers, {}).addTo(map);
    let contaminantControl = createScrollableContaminantControl().addTo(map);
}


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