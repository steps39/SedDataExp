function sampleMap(meas) {
    // Check if there's an existing map and remove it
    if (map) {
        map.remove();
    }
    // SampleInfo data structure
    // Initialize the map
    map = L.map('map').setView([54.596, -1.177], 13); // Set the initial center and zoom level

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    latSum = 0;
    lonSum = 0;
    noLocations = 0;
    minLat = null;
    maxLat = null;
    minLon = null;
    maxLon = null;
    let hoveredSample = null;

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
    // Add markers for each sample
    iconNo = 0;
    sampleNo = -1;
    const highlightIcon = new CustomIcon({ iconUrl: markerPath + 'marker-icon-highlight.png' });
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        currentIcon = new CustomIcon({ iconUrl: markerPath + markerPngs[iconNo] });
        iconNo = (iconNo + 1) % 9;
        noSamples = 0;
        for (const dateSampled in selectedSampleInfo) {
            noSamples += Object.keys(selectedSampleInfo[dateSampled].position).length;
        }
        //console.log('noSamples', noSamples);
        highlighted = Array(noSamples).fill(false);
        //        for (const sample in selectedSampleInfo[dateSampled].position) {
        const allSamples = Object.keys(selectedSampleInfo[dateSampled].position);
        allSamples.sort();
        allSamples.forEach(sample => {
            if (selectedSampleInfo[dateSampled].position[sample]['Position latitude']) {
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
                    const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map).bindPopup(chart_div,{autoClose:false,closeOnClick:false});
//                    popup.setContent(chart_div);
//                    const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map).bindPopup(`<b>${dateSampled}: ${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
//                    const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map);
//const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map).bindPopup(`<b>${dateSampled}: ${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}<br>${popupStatic}`);
/*						const marker = L.circleMarker([lat, lon],
                                        {radius: 4, color: 'white', fillColor: 'red', fillOpacity: 1}
                                        ).addTo(map).bindPopup(`<b>${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                                        marker.bindTooltip(sample, { permanent: false, direction: 'top' });*/
                        marker.isMarked = false;
                    //console.log(sampleNo, dateSampled, sample);

                    // Add a click event listener to the static marker
                    marker.on('click', function () {
                        //                        hoveredSample = sample;


                        const centreLat = selectedSampleInfo[dateSampled].position[sample]['Position latitude'];
                        const centreLon = selectedSampleInfo[dateSampled].position[sample]['Position longitude'];
                        for (const ds in selectedSampleInfo) {
                            for (const s in selectedSampleInfo[ds].position) {
                                const sampleLat = sampleInfo[ds].position[s]['Position latitude'];
                                const sampleLon = sampleInfo[ds].position[s]['Position longitude'];
                                distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
                                //console.log('distance1',distance);
                                if (distance <= 10) {
                                    hoveredSample = ds + ': ' + s;
                                    createHighlights(meas, ds, hoveredSample);
                                    popupInstance[hoveredSample].update();
                                    let popup = marker.getPopup();
                                    let chart_div = document.getElementById("c_radar_" + hoveredSample);
                                    chart_div.style.height = '300px';
                                    chart_div.style.width = '250px';
/*                                    popup.options.closeOnClick = false;
                                    popup.options.autoClose = false;*/
                                    popup.setContent(chart_div);
console.log(popup);
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
                    // Add a click event listener to the highlight marker
                    highlightMarkers[sampleNo].on('click', function () {
                        // Mark not just the clicked position but any things which are in the same place
                        const centreLat = selectedSampleInfo[dateSampled].position[sample]['Position latitude'];
                        const centreLon = selectedSampleInfo[dateSampled].position[sample]['Position longitude'];
                        for (const ds in selectedSampleInfo) {
                            for (const s in selectedSampleInfo[ds].position) {
                                const sampleLat = sampleInfo[ds].position[s]['Position latitude'];
                                const sampleLon = sampleInfo[ds].position[s]['Position longitude'];
                                distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
                                //console.log('distance2',distance);
                                if (distance <= 10) {
                                    hoveredSample = ds + ': ' + s;
                                    createHighlights(meas, ds, hoveredSample);
                                    popupInstance[hoveredSample].update();
                                    popup = marker.getPopup();
                                    chart_div = document.getElementById("c_radar_" + hoveredSample);
/*                                    chart_div.style.height = '200px';
                                    chart_div.style.width = '400px';*/
/*                                    popup.options.closeOnClick = false;
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
        });
        //console.log(iconNo, dateSampled);
    });

    if (noLocations > 0) {
        const centreLat = latSum / noLocations;
        const centreLon = lonSum / noLocations;
        var bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
        map.fitBounds(bounds);
        //console.log('lat,lon ',minLat,minLon, maxLat,maxLon);
        /*	    		if (centreLat !== undefined && centreLon !== undefined) {
                        map.setView(new L.LatLng(centreLat, centreLon), 13);
                    }*/
        //			}
    }

}

function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function exportChart() {
    const now = new Date();
    const formattedDate = now
        .toISOString()
        .slice(2, 16)
        .replace(/[-T:]/g, ''); // Format: yymmddhhmm

    for (i = 1; i<lastInstanceNo+1 ; i++) {
        const canvas = document.getElementById('chart' + i);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const filename = `${formattedDate}-${instanceSheet[i]}-${instanceType[i]}.png`;
        link.href = url;
        link.download = filename;
        link.click();
    }
/*      leafletImage(map, function(err, canvas) {
// 'canvas' now contains an image of the map
const img = document.createElement('img');
img.src = canvas.toDataURL();
document.body.appendChild(img);
});*/
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
//console.log('parse coordinates');
//console.log(latitude,longitude);
    // Check to see if only latitude in which case UK National Grid Reference System is being used
    // Use https://github.com/OrdnanceSurvey/os-transform
    if ((!(latitude == undefined || latitude == null)) && (longitude == undefined || longitude == null)) {
//console.log(latitude);
        const en = os.Transform.fromGridRef(latitude);
//console.log(en);
        if (en.ea === undefined || en.ea === null) {
            console.log('Looks like this is an invalid grid reference ',latitude);
            return null;
        }
        const latlong = os.Transform.toLatLng(en);
//console.log(latlong);
        if (latlong === undefined || latlong == null) {
            return null;
        }
        return {latitude : latlong.lat, longitude : latlong.lng}
    }
    // Check if all input is undefined or null
    if ((latitude == undefined || latitude == null) && (longitude == undefined || longitude == null)) {
        return null;
    }

    // Handle coordinates in digital degrees with N/S and E/W
    const digitalDegreesRegex = /^([-+]?\d+(\.\d+)?)\s*([NSEW])\s*([-+]?\d+(\.\d+)?)\s*([NSEW])$/i;
    const digitalDegreesMatch = `${latitude} ${longitude}`.match(digitalDegreesRegex);
    if (digitalDegreesMatch) {
        const latValue = parseFloat(digitalDegreesMatch[1]) * (digitalDegreesMatch[3].toUpperCase() === 'S' ? -1 : 1);
        const lonValue = parseFloat(digitalDegreesMatch[4]) * (digitalDegreesMatch[6].toUpperCase() === 'W' ? -1 : 1);
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

    // If the input doesn't match any recognized format, return null or handle accordingly
    return null;
}

