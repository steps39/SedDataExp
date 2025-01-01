//import { kml } from "https://unpkg.com/@tmcw/togeojson?module";

function sampleMap(meas) {
    // Check if there's an existing map and remove it
    if (map) {
        map.remove();
    }

    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    });
    
    var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'});
    
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

    var greenIcon = L.icon({
        iconUrl: markerPath + 'blue-marker-icon.png', // Replace with the path to your marker icon
        shadowUrl: markerPath + 'marker-shadow.png',

        iconSize: [38, 95], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    // Define a custom marker icon with a specific color
    var CustomIcon = L.Icon.extend({
        options: {
            shadowUrl: markerPath + 'marker-shadow.png',
            iconSize: [25, 41], // Replace with the size of your marker icon
            iconAnchor: [12, 41], // Replace with the anchor point of your marker icon
            popupAnchor: [1, -34], // Replace with the popup anchor point of your marker icon
        }
    });

 /*   // Add known locations to the map
    if(namedLocations) {
        // Loop through the named locations and add them to the map
        for (const locationName in namedLocations) {
            const location = namedLocations[locationName];
            const label = location.label;
            const latitude = location.latitude;
            const longitude = location.longitude;

            // Add an invisble marker with a popup displaying the location name
            L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'custom-label',
                    html: `<span>${label}</span>`,
                    iconSize: [0, 0] // Make the icon itself invisible
                })
            }).addTo(map);
        }
    }*/

    // Add markers for each sample
    iconNo = 0;
    sampleNo = -1;
    const highlightIcon = new CustomIcon({ iconUrl: markerPath + 'marker-icon-highlight.png' });
    const datesSampled = Object.keys(selectedSampleInfo);


    noSamples = 0;
    allSamples = [];
    icons = [];
    iconNos = [];
    markers = {};
    datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        markers[dateSampled] = {};
        iconNos[dateSampled] = iconNo;
        currentIcon = new CustomIcon({ iconUrl: markerPath + markerPngs[iconNo] });
//console.log(iconNo,currentIcon);
        iconNo = (iconNo + 1) % 9;
        icons.push(currentIcon);
//        noSamples = 0;
//        for (const dateSampled in selectedSampleInfo) {
        noSamples += Object.keys(selectedSampleInfo[dateSampled].position).length;
//        }
        //console.log('noSamples', noSamples);
        //        for (const sample in selectedSampleInfo[dateSampled].position) {
        dsSamples = (Object.keys(selectedSampleInfo[dateSampled].position));
        dsSamples.forEach(sample => {
            allSamples.push(dateSampled + ": " + sample);
        })
    });
    allSamples.sort();
    if (!(xAxisSort === 'normal')) {
        allSamples.sortComplexSamples();
    }
    highlighted = Array(noSamples).fill(false);
//console.log(iconNos,icons);
//console.log(allSamples);

    allSamples.forEach(fullSample => {
        parts = fullSample.split(": ");
        if (parts.length > 2){
            parts[1] = parts[1] + ': ' + parts[2];
        }
        dateSampled = parts[0];
        sample = parts[1];
        iconNo = iconNos[dateSampled];
        currentIcon = icons[iconNo];
//console.log(dateSampled,sample,iconNo,currentIcon);
        


/*    datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        currentIcon = new CustomIcon({ iconUrl: markerPath + markerPngs[iconNo] });
        iconNo = (iconNo + 1) % 9;
        noSamples = 0;
//        for (const dateSampled in selectedSampleInfo) {
            noSamples += Object.keys(selectedSampleInfo[dateSampled].position).length;
//        }
        //console.log('noSamples', noSamples);
        highlighted = Array(noSamples).fill(false);
        //        for (const sample in selectedSampleInfo[dateSampled].position) {
        const allSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        allSamples.sort();
        allSamples.forEach(sample => {*/
//            if (selectedSampleInfo[dateSampled].position[sample]['Position latitude']) {
//console.log(dateSampled,sample);
            if (selectedSampleInfo[dateSampled].position[sample].hasOwnProperty('Position latitude')) {
                lat = selectedSampleInfo[dateSampled].position[sample]['Position latitude'];
                lon = selectedSampleInfo[dateSampled].position[sample]['Position longitude'];
                // Create a marker for each sample
                if (lat !== undefined && lon !== undefined) {
                    lat = parseFloat(lat);
                    lon = parseFloat(lon);
                    if (maxLat === null) {
                        minLat = lat;
                        maxLat = lat;
                        minLon = lon;
                        maxLon = lon;
                    } else {
                        if (lat > maxLat) {
                            maxLat = lat;
                        } else if (lat < minLat) {
                            minLat = lat;
                        }
                        if (lon > maxLon) {
                            maxLon = lon;
                        } else if (lon < minLon) {
                            minLon = lon;
                        }
                    }
                    sampleNo += 1;
                    // Create a marker for each sample
                    //						const marker = L.marker([lat, lon]).addTo(map).bindPopup(`<b>${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                    const popupStatic = '<p style="height:200px; width:200px">static content</p>';
                    //                    let popup = marker.getPopup();
                    let chart_div = document.getElementById("c_radar_" + dateSampled + ": " + sample);
                    //  just bodge to allow display of position                  const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map).bindPopup(chart_div,{autoClose:false,closeOnClick:false});
                    //                    popup.setContent(chart_div);
                    //const marker = L.marker([lat, lon], { icon: currentIcon }, {title: `${dateSampled}: ${sample}`}, {riseOnHover: true} ).
                    /*const marker = L.marker([lat, lon], { icon: currentIcon }).
                    addTo(map).bindPopup(`<b>${dateSampled}: ${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`).bindTooltip(`${dateSampled}: ${sample}`);*/
                    var markerPopup = L.popup({
                        closeOnClick: false,
                        autoClose: false
                        }).setContent(`${dateSampled}: ${sample}`);
/*                    const marker = L.marker([lat, lon], { icon: currentIcon }).
                        addTo(map).bindPopup(markerPopup).bindTooltip(`${dateSampled}: ${sample}`);*/
                    marker = L.marker([lat, lon], { icon: currentIcon }).
                        bindPopup(markerPopup).bindTooltip(`${dateSampled}: ${sample}`);
                    //                    const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map);
                    //const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map).bindPopup(`<b>${dateSampled}: ${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}<br>${popupStatic,autoClose:false}`);
                    /*						const marker = L.circleMarker([lat, lon],
                                                            {radius: 4, color: 'white', fillColor: 'red', fillOpacity: 1}
                                                            ).addTo(map).bindPopup(`<b>${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                                                            marker.bindTooltip(sample, { permanent: false, direction: 'top' });*/
                    marker.isMarked = false;
//console.log(sampleNo, dateSampled, sample);

                    // Add a click event listener to the static marker
                    marker.on('click', function (e) {
                        //                        hoveredSample = sample;
//console.log('alert',e.latlng);

/*                        const centreLat = selectedSampleInfo[dateSampled].position[sample]['Position latitude'];
                        const centreLon = selectedSampleInfo[dateSampled].position[sample]['Position longitude'];*/
                        const centreLat = e.latlng.lat;
                        const centreLon = e.latlng.lng;
//console.log(centreLat,centreLon);
                        for (const ds in selectedSampleInfo) {
                            for (const s in selectedSampleInfo[ds].position) {
                                const sampleLat = sampleInfo[ds].position[s]['Position latitude'];
                                const sampleLon = sampleInfo[ds].position[s]['Position longitude'];
                                distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
//console.log('distance1',distance);
                                if (distance <= 10) {
                                    hoveredSample = ds + ': ' + s;
//console.log(meas);
//console.log(ds);
//console.log(hoveredSample);
                                    createHighlights(meas, ds, hoveredSample);
//console.log(popupInstance);
                                    if (hoveredSample in popupInstance) {
                                        popupInstance[hoveredSample].update();
                                    }
                                    let popup = marker.getPopup();
                                    let chart_div = document.getElementById("c_radar_" + hoveredSample);
                                    if (!(chart_div === null || chart_div ==undefined)) {
//console.log(chart_div);
                                        chart_div.style.height = '300px';
                                        chart_div.style.width = '250px';
                                        /*                                    popup.options.closeOnClick = false;
                                                                            popup.options.autoClose = false;*/
                                        popup.setContent(chart_div);
                                    }
//console.log(popup);
                                }
                            }
                        }



                        //                        hoveredSample = dateSampled + ': ' + sample;
                        //                        createHighlights(meas, dateSampled, hoveredSample);
                        // Update the chart - in routintes
                        //console.log('update ',sample,i);
                        //							chartInstance[i].update();
                    });

                    // Create a highlight for each sample
                    //console.log(sampleNo,lat,lon);
                    highlightMarkers[sampleNo] = new L.marker(new L.LatLng(lat, lon), { icon: highlightIcon });
                    //                    addTo(map).bindPopup(`<b>${dateSampled}: ${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                    highlightMarkers[sampleNo].bindTooltip(`${dateSampled}: ${sample}`);
//console.log(sampleNo);

                    // Add a click event listener to the highlight marker
                    highlightMarkers[sampleNo].on('click', function (e) {
//console.log('alert',e.latlng);
                        // Mark not just the clicked position but any things which are in the same place
/*                        const centreLat = selectedSampleInfo[dateSampled].position[sample]['Position latitude'];
                        const centreLon = selectedSampleInfo[dateSampled].position[sample]['Position longitude'];*/
                        const centreLat = e.latlng.lat;
                        const centreLon = e.latlng.lng;
                        for (const ds in selectedSampleInfo) {
                            for (const s in selectedSampleInfo[ds].position) {
                                const sampleLat = sampleInfo[ds].position[s]['Position latitude'];
                                const sampleLon = sampleInfo[ds].position[s]['Position longitude'];
                                distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
//console.log('distance2',distance);
                                if (distance <= 10) {
                                    hoveredSample = ds + ': ' + s;
                                    console.log(meas, ds, hoveredSample);
                                    createHighlights(meas, ds, hoveredSample);
                                    console.log(popupInstance);
                                    if (hoveredSample in popupInstance) {
                                        popupInstance[hoveredSample].update();
                                    }
                                    popup = marker.getPopup();
                                    chart_div = document.getElementById("c_radar_" + hoveredSample);
                                    /*                                    chart_div.style.height = '200px';
                                                                        chart_div.style.width = '400px';*/
                                    /*popup.options.closeOnClick = false;
                                    popup.options.autoClose = false;*/
                                    popup.setContent(chart_div);
                                }
                            }
                        }
                    });
                    noLocations += 1;
                    latSum += parseFloat(lat);
                    lonSum += parseFloat(lon);
                };
            } else {
                // Missing lat and lon so don't create a marker but do update the sampleNo so that it still aligns with chart samples
                sampleNo += 1;
                highlightMarkers[sampleNo] = null;
            }
            markers[dateSampled][fullSample] = marker;
        });
//console.log(iconNo, dateSampled);
//    });

    var exteriorStyle = {
        "color": "#ffffff",
        "weight": 0,
        "fillOpacity": .75
    };


    let markerLayers = {};
    datesSampled.forEach(dateSampled => {
        markerLayers[dateSampled] = [];
        allSamples = Object.keys(markers[dateSampled]);
        allSamples.forEach(sample => {
            markerLayers[dateSampled].push(markers[dateSampled][sample]);
        });
    });
//console.log(markers);
//console.log(datesSampled,markerLayers);
/*    var mapLayers = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    });*/
    
    markerLayer = {};
    datesSampled.forEach(dateSampled => {
console.log(dateSampled,markerLayers[dateSampled]);        
        markerLayer[dateSampled] = L.layerGroup(markerLayers[dateSampled]).addTo(map);
    });
//console.log(markerLayer,markerLayers);


    var kmlLayer = new L.KML("https://northeastfc.uk/RiverTees/Planning/MLA_2015_00088/MLA_2015_00088-LOCATIONS.kml", {async: true});
//console.log(kmlLayer);
    kmlLayer.on("loaded", function(e) {
    map.fitBounds(e.target.getBounds());
fred = kmlLayer;
    
    // Access nested layers and apply styles
    const mainLayer = Object.values(kmlLayer._layers)[0];
    if (mainLayer && mainLayer._layers) {
        Object.values(mainLayer._layers).forEach(function(layer) {
            if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                layer.setStyle({
                    color: "#FF0000",       // Set line color to red
                    weight: 2,              // Set line thickness
                    opacity: 0.5,           // Set line opacity
                    fillColor: "#FF0000",   // Set fill color to red
                    fillOpacity: 0.2        // Set fill opacity for polygons
                });
            }
        });
    }
});
//console.log(markers,markerLayers);
    var shapeOverlay =  {'MLA/2015/00088' : kmlLayer};
    datesSampled.forEach(dateSampled => {
        shapeOverlay[dateSampled] = markerLayer[dateSampled];
    });
//console.log(shapeOverlay,mapLayers);
    if (noLocations > 0) {
        const centreLat = latSum / noLocations;
        const centreLon = lonSum / noLocations;
        var bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
        map.fitBounds(bounds);
        //console.log('lat,lon ',minLat,minLon, maxLat,maxLon);
    }

var layerControl = L.control.layers(mapLayers, shapeOverlay).addTo(map);
var bounds = L.latLngBounds();
/*for (let layerName in shapeOverlay) {
    bounds.extend(shapeOverlay[layerName].getLatLng());
}*/
//map.fitBounds(bounds);
//map.fitBounds(shapeOverlay.getBounds());
/*layerControl.on("loaded", function(e) {
    map.fitBounds(e.target.getBounds());map.fitBounds(e.target.getBounds());
});*/

/*    fetch("https://northeastfc.uk/RiverTees/Planning/MLA_2015_00088/MLA_2015_00088-LOCATIONS.kml")
      .then(function (response) {
        return response.text();
      })
      .then(function (xml) {
        geoJSONThing = kml(new DOMParser().parseFromString(xml, "text/xml"));
        L.geoJSON(geoJSONThing).addTo(map);
    });*/
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
/*      leafletImage(map, function(err, canvas) {
// 'canvas' now contains an image of the map
const img = document.createElement('img');
img.src = canvas.toDataURL();
document.body.appendChild(img);
});*/
}

function exportChart(currentInstanceNo) {
    const now = new Date();
    const formattedDate = now
        .toISOString()
        .slice(2, 16)
        .replace(/[-T:]/g, ''); // Format: yymmddhhmm
    canvas = document.getElementById('chart' + currentInstanceNo);
    const url = canvas.toDataURL('image/png');
    exportLink = document.createElement('a');
    const filename = `${formattedDate}-${instanceSheet[currentInstanceNo]}-${instanceType[currentInstanceNo]}.png`;
    exportLink.href = url;
    exportLink.download = filename;
    exportLink.click();
}


function neweexportChart() {
    const now = new Date();
    const formattedDate = now
        .toISOString()
        .slice(2, 16)
        .replace(/[-T:]/g, ''); // Format: yymmddhhmm

        currentInstanceNo = 0;

    for (let i = 1; i < lastInstanceNo + 1; i++) {
        currentInstanceNo = i;
        const chartType = instanceType[i];
        
        if (chartType.includes('Scatter')) {
            chartLink = document.getElementById('chart' + i);
            chartLink.click();
            currentInstanceNo = lastScatterInstanceNo;
            const chartElementId = 'chart' + currentInstanceNo;
            const canvas = document.getElementById(chartElementId);

            // Assuming you have access to each Chart instance here, e.g., in an array of charts
//            const chartInstance = Chart.getChart(canvas); // or however you reference the Chart.js instance for each chart
            const currentInstance = chartInstance[currentInstanceNo];

console.log('exportChart part way in on scatter');

            // Define the export logic as a separate function
            const exportChartImage = () => {
console.log('exportchartimage');
                const url = canvas.toDataURL('image/png');
                const exportLink = document.createElement('a');
                const filename = `${formattedDate}-${instanceSheet[i]}-${chartType}.png`;
                
                exportLink.href = url;
                exportLink.download = filename;
                exportLink.click();
                // Remove the hook to prevent repeated execution
                currentInstance.options.animation.onComplete = null;
            };


            // Check if currentInstance exists and set onComplete callback
            if (currentInstance) {
console.log('setting animation');
                // Set onComplete only for one-time execution
                currentInstance.options.animation = currentInstance.options.animation || {};
console.log('setting oncomplete',currentInstance.options.animation);
                currentInstance.options.animation.onComplete = exportChartImage;
console.log('set oncomplete',currentInstance.options.animation.onComplete);
/*                currentInstance.options.plugins = currentInstance.options.plugins || {};
                currentInstance.options.plugins.onComplete = exportChartImage;*/

                // Redraw the chart to trigger the onComplete callback
                currentInstance.update();
            }
/*console.log('doing chartLink click');
            chartLink = document.getElementById('chart' + i);
            chartLink.click();*/
        }
    }
}




function eexportChart() {
    const now = new Date();
    const formattedDate = now
        .toISOString()
        .slice(2, 16)
        .replace(/[-T:]/g, ''); // Format: yymmddhhmm

    for (let i = 1; i < lastInstanceNo + 1; i++) {
        const chartType = instanceType[i];
        
        if (chartType.includes('Scatter')) {
            const chartElementId = 'chart' + i;
            const canvas = document.getElementById(chartElementId);

            // Assuming you have access to each Chart instance here, e.g., in an array of charts
            const chartInstance = Chart.getChart(canvas); // or however you reference the Chart.js instance for each chart

            // Define the export logic as a separate function
            const exportChartImage = () => {
                const url = canvas.toDataURL('image/png');
                const exportLink = document.createElement('a');
                const filename = `${formattedDate}-${instanceSheet[i]}-${chartType}.png`;
                
                exportLink.href = url;
                exportLink.download = filename;
                exportLink.click();
            };

            // Check if chartInstance exists and set onComplete callback
            if (chartInstance) {
                chartInstance.options.plugins = chartInstance.options.plugins || {};
                chartInstance.options.plugins.onComplete = exportChartImage;

                // Redraw the chart to trigger the onComplete callback
                chartInstance.update();
            }
        }
    }
}








function parseCoordinate(input) {
    // Check if the input is undefined or null
    if (input == undefined || input == null) {
        return null;
    }

    // Check if the input is already in digital format (e.g., 54.1 or -1.7)
    const digitalFormatRegex = /^[-+]?\d+(\.\d+)?$/;
    if (digitalFormatRegex.test(input)) {
        return parseFloat(input);
    }

    // Check if the input is in degrees minutes digital seconds format (e.g., 54 10 9.6 N)
    const dmsRegex = /^(\d+)\s+(\d+)\s+([\d.]+)\s*([NSEW])$/i;
    const dmsMatch = input.match(dmsRegex);
    if (dmsMatch) {
        const degrees = parseFloat(dmsMatch[1]);
        const minutes = parseFloat(dmsMatch[2]);
        const seconds = parseFloat(dmsMatch[3]);
        const direction = dmsMatch[4].toUpperCase();

        let result = degrees + minutes / 60 + seconds / 3600;

        // Ensure negative for S or W directions
        if (direction === 'S' || direction === 'W') {
            result = -result;
        }

        return result;
    }

    // Check if the input is in degrees digital minutes format (e.g., 54:10.67983432N)
    const dmRegex = /^(\d+)[\s\:]+([\d.]+)\s*([NSEW])$/i;
    const dmMatch = input.match(dmRegex);
    if (dmMatch) {
        const degrees = parseFloat(dmMatch[1]);
        const minutes = parseFloat(dmMatch[2]);
        const direction = dmMatch[3].toUpperCase();

        let result = degrees + minutes / 60;
        // Ensure negative for S or W directions
        if (direction === 'S' || direction === 'W') {
            result = -result;
        }

        return result;
    }

    // If the input doesn't match any recognized format, return null or handle accordingly
    return null;
}

function parseCoordinates(latitude, longitude) {
    // If only latitude is provided, handle UK National Grid Reference System (as in your original logic)
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

    // Handle undefined/null inputs
    if ((latitude == undefined || latitude == null) && (longitude == undefined || longitude == null)) {
        return null;
    }

    // Crude check for easting and northing (British National Grid)
    if (latitude > 360) {
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs");
        const point = proj4("EPSG:27700", "EPSG:4326", [parseInt(latitude, 10), parseInt(longitude, 10)]);
        return { latitude: point[1], longitude: point[0] };
    }

    // Handle digital degrees with direction (N/S and E/W)
    const digitalDegreesRegex = /^([-+]?\d+(\.\d+)?)\s*([NSEW])\s*([-+]?\d+(\.\d+)?)\s*([NSEW])$/i;
    const digitalDegreesMatch = `${latitude} ${longitude}`.match(digitalDegreesRegex);
    if (digitalDegreesMatch) {
        const latValue = parseFloat(digitalDegreesMatch[1]) * (digitalDegreesMatch[3].toUpperCase() === 'S' ? -1 : 1);
        const lonValue = parseFloat(digitalDegreesMatch[4]) * (digitalDegreesMatch[6].toUpperCase() === 'W' ? -1 : 1);
        return { latitude: latValue, longitude: lonValue };
    }

    // Handle degree digital minutes with direction (N/S and E/W)
    const digitalMinutesRegex = /^(\d{1,3})°\s*(\d{1,2}\.\d+)’\s*([NSEW])\s*(\d{1,3})°\s*(\d{1,2}\.\d+)’\s*([NSEW])\s*$/i;
    const digitalMinutesMatch = `${latitude} ${longitude}`.match(digitalMinutesRegex);
//console.log(digitalMinutesMatch);
    if (digitalMinutesMatch) {
        const latValue = (parseInt(digitalMinutesMatch[1]) + parseFloat(digitalMinutesMatch[2])/60) * (digitalMinutesMatch[3].toUpperCase() === 'S' ? -1 : 1);
        const lonValue = (parseInt(digitalMinutesMatch[4]) + parseFloat(digitalMinutesMatch[5])/60) * (digitalMinutesMatch[6].toUpperCase() === 'W' ? -1 : 1);
        return { latitude: latValue, longitude: lonValue };
    }

    // Crude check of whether easting and northing
    if (latitude > 360) {
        // Use proj4js library to convert British National Grid to latitude and longitude
        proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs");
        const point = proj4("EPSG:27700", "EPSG:4326", [parseInt(latitude, 10), parseInt(longitude, 10)]);

        return { latitude: point[1], longitude: point[0] };
    } else {
        return { latitude: parseCoordinate(latitude), longitude: parseCoordinate(longitude) };
    }

    // If no valid format matched, return null
    return null;
}
