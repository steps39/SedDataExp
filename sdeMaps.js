//import { kml } from "https://unpkg.com/@tmcw/togeojson?module";

let permanentTooltipLayer;

function sampleMap(meas) {
    // Check if there's an existing map and remove it
    if (map) {
        map.remove();
    }

    allMapMarkers = [];

//    permanentTooltipLayer = L.layerGroup.collision({margin: 5});

    var currentTime = new Date();
    var year = currentTime.getFullYear();

    //Ordnance Survey
    var apiKey = 'WYvhmkLwjzAF0LgSL14P7y1v5fySAYy9';
    var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';

    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community.'
    });

    var OS_Road = L.tileLayer(serviceUrl + '/Road_3857/{z}/{x}/{y}.png?key=' + apiKey, {
        maxZoom: 19,
        attribution: 'Contains OS Data &copy; Crown copyright and database rights ' + year
    });

    var OS_Outdoor = L.tileLayer(serviceUrl + '/Outdoor_3857/{z}/{x}/{y}.png?key=' + apiKey, {
        maxZoom: 19,
        attribution: 'Contains OS Data &copy; Crown copyright and database rights ' + year
    });

    var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
    });

    var openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
    });

    var osSensorCommunity = L.tileLayer('https://osmc3.maps.sensor.community/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © Sensor Community'
    });

    var mapLayers = {
        "OpenStreetMap": osm,
        "WorldImagery": Esri_WorldImagery,
        "OS Road": OS_Road,
        "OS Outdoor": OS_Outdoor,
        "OpenStreetMap.HOT": osmHOT,
        "OpenTopoMap": openTopoMap,
        "OpenSensorCommunity": osSensorCommunity
    };

    map = L.map('map', {
        center: [54.596, -1.177],
        zoom: 13,
        layers: [osm]
    });

    // SampleInfo data structure
    latSum = 0;
    lonSum = 0;
    noLocations = 0;
    minLat = null;
    maxLat = null;
    minLon = null;
    maxLon = null;
    let hoveredSample = null;
    markers = [];
    marker = null;

    const markerColors = [
        '#FF5733', '#33CFFF', '#33FF57', '#FF33A1', '#A133FF',
        '#FFC300', '#33FFA1', '#C70039', '#900C3F'
    ];

    const highlightStyle = {
        radius: 10,
        fillColor: '#FFFF00', // A bright yellow for highlighting
        color: '#000000',     // Black outline
        weight: 2,
        opacity: 1,
        fillOpacity: 1
    };
    
    sampleNo = -1;
    const datesSampled = Object.keys(selectedSampleInfo);

    noSamples = 0;
    allSamples = [];
    const dateColors = {}; 
    let colorIndex = 0;   
    markers = {};

    datesSampled.forEach(dateSampled => {
        markers[dateSampled] = {};
        dateColors[dateSampled] = markerColors[colorIndex];
        colorIndex = (colorIndex + 1) % markerColors.length;
        noSamples += Object.keys(selectedSampleInfo[dateSampled].position).length;
        
        dsSamples = (Object.keys(selectedSampleInfo[dateSampled].position));
        dsSamples.forEach(sample => {
            allSamples.push(dateSampled + ": " + sample);
        });
    });

    // --- SORT and POPULATE LEGEND DATA ---
    // Sort the datasets alphabetically by their label for a consistent order.
    datesSampled.sort((a, b) => {
        const labelA = selectedSampleInfo[a].label || a;
        const labelB = selectedSampleInfo[b].label || b;
        return labelA.localeCompare(labelB);
    });

    const legendData = [];
    datesSampled.forEach(dateSampled => {
        const color = dateColors[dateSampled];
        const label = selectedSampleInfo[dateSampled].label || dateSampled;
        // Create an SVG circle as a Data URL to represent the marker
        const svgIcon = `<svg height="18" width="18" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="7" stroke="black" stroke-width="1" fill="${color}" /></svg>`;
        const iconUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;
        legendData.push({ label: label, iconUrl: iconUrl });
    });
    // Call the function from the main HTML file to build the legend
    populateMapLegend(legendData);
    // --- END ---


    if (!(xAxisSort === 'normal')) {
        allSamples.sortComplexSamples();
    }
    highlighted = Array(noSamples).fill(false);

    const hoverStyle = {
        radius: 10,
        weight: 3,
        opacity: 1,
        fillOpacity: 1
    };

    allSamples.forEach(fullSample => {
        let parts = fullSample.split(": ");
        if (parts.length > 2) {
            parts[1] = parts[1] + ': ' + parts[2];
        }
        const dateSampled = parts[0];
        const sample = parts[1];
        
        const currentColor = dateColors[dateSampled];
        
        if (selectedSampleInfo[dateSampled].position[sample].hasOwnProperty('Position latitude')) {
            const lat = parseFloat(selectedSampleInfo[dateSampled].position[sample]['Position latitude']);
            const lon = parseFloat(selectedSampleInfo[dateSampled].position[sample]['Position longitude']);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                if (maxLat === null) { minLat = lat; maxLat = lat; minLon = lon; maxLon = lon; } 
                else { if (lat > maxLat) maxLat = lat; else if (lat < minLat) minLat = lat; if (lon > maxLon) maxLon = lon; else if (lon < minLon) minLon = lon; }

                sampleNo += 1;

                const dateLabel = selectedSampleInfo[dateSampled].label;
                const sampleLabel = selectedSampleInfo[dateSampled].position[sample].label;
                const alternateName = `${dateLabel}: ${sampleLabel}`;
                
                const originalCircleOptions = {
                    radius: 7,
                    fillColor: currentColor,
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.9
                };

                marker = L.circleMarker([lat, lon], originalCircleOptions)
                    .bindTooltip(alternateName);

                marker.options.customId = fullSample;
                marker.options.originalStyle = originalCircleOptions;

                marker.on({
                    mouseover: function (e) {
                        const layer = e.target;
                        layer.setStyle(hoverStyle);
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            layer.bringToFront();
                        }
                    },
                    mouseout: function (e) {
                        e.target.setStyle(e.target.options.originalStyle);
                    }
                });

                marker.on('click', function (e) {
                    const clickedId = e.target.options.customId;
                    createHighlights(meas, clickedId);
                });

                highlightMarkers[sampleNo] = L.circleMarker(new L.LatLng(lat, lon), highlightStyle);
                highlightMarkers[sampleNo].bindTooltip(alternateName);
                highlightMarkers[sampleNo].options.customId = fullSample;
                highlightMarkers[sampleNo].on('click', function (e) {
                    const clickedId = e.target.options.customId;
                    createHighlights(meas, clickedId);
                });

                noLocations += 1;
                latSum += lat;
                lonSum += lon;
            }
        } else {
            sampleNo += 1;
            highlightMarkers[sampleNo] = null;
        }
        markers[dateSampled][fullSample] = marker;
        if (marker) {
            allMapMarkers.push(marker);
        }
        if (marker) {
            const alternateName = marker.getTooltip().getContent();
            const permanentMarkerStyle = { ...marker.options.originalStyle, interactive: false };
            const permanentMarker = L.circleMarker(marker.getLatLng(), permanentMarkerStyle);
            permanentMarker.bindTooltip(alternateName, { 
                permanent: true, 
                direction: 'auto',
                className: 'no-overlap-tooltip'
            });
        }
    });

    let markerLayers = {};
    datesSampled.forEach(dateSampled => {
        markerLayers[dateSampled] = [];
        allSamples = Object.keys(markers[dateSampled]);
        allSamples.forEach(sample => {
            if (markers[dateSampled][sample]) {
                markerLayers[dateSampled].push(markers[dateSampled][sample]);
            }
        });
    });
    
    markerLayer = {};
    datesSampled.forEach(dateSampled => {
        markerLayer[dateSampled] = L.layerGroup(markerLayers[dateSampled]).addTo(map);
    });

    var shapeOverlay = {};
    let kmlColors = ['#FF0000', '#00FF00', '#0000FF'];
    let colorNo = 0;

    for (filename in kmlLayers) {
        url = kmlLayers[filename];
        kmlLayer = new L.KML(url, {async: true});
        kmlLayer.on("loaded", function (e) {
            const mainLayer = Object.values(e.target._layers)[0];
            if (mainLayer && mainLayer._layers) {
                Object.values(mainLayer._layers).forEach(function (layer) {
                    if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                        layer.setStyle({
                            color: kmlColors[colorNo],
                            weight: 2,
                            opacity: 0.5,
                            fillColor: kmlColors[colorNo],
                            fillOpacity: 0.2
                        });
                    }
                });
            }
            if (colorNo < 2) {
                colorNo += 1;
            } else {
                colorNo = 0;
            }
        });
        shapeOverlay[filename] = kmlLayer;
    }
    datesSampled.forEach(dateSampled => {
        shapeOverlay[dateSampled] = markerLayer[dateSampled];
    });

    if (noLocations > 0) {
        const centreLat = latSum / noLocations;
        const centreLon = lonSum / noLocations;
        var bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
        map.fitBounds(bounds);
    }

    var layerControl = L.control.layers(mapLayers, shapeOverlay).addTo(map);
}

function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function exportCharts() {
    for (i = 1; i<lastInstanceNo+1 ; i++) {
        if (!(instanceType[i].includes('Scatter'))){
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

function exportChart(currentInstanceNo) {
    const now = new Date();
    const formattedDate = now
        .toISOString()
        .slice(2, 16)
        .replace(/[-T:]/g, '');
    canvas = document.getElementById('chart' + currentInstanceNo);
    const url = canvas.toDataURL('image/png');
    exportLink = document.createElement('a');
    const filename = `${formattedDate}-${instanceSheet[currentInstanceNo]}-${instanceType[currentInstanceNo]}.png`;
    exportLink.href = url;
    exportLink.download = filename;
    exportLink.click();
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
    if (latitude > 360) {
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs");
        const point = proj4("EPSG:27700", "EPSG:4326", [parseInt(latitude, 10), parseInt(longitude, 10)]);
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
