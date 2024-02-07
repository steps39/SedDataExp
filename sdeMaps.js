function sampleMap(meas, linLog) {
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
        iconUrl: 'blue-marker-icon.png', // Replace with the path to your marker icon
        shadowUrl: 'marker-shadow.png',

        iconSize: [38, 95], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    // Define a custom marker icon with a specific color
    var CustomIcon = L.Icon.extend({
        options: {
            shadowUrl: 'marker-shadow.png',
            iconSize: [25, 41], // Replace with the size of your marker icon
            iconAnchor: [12, 41], // Replace with the anchor point of your marker icon
            popupAnchor: [1, -34], // Replace with the popup anchor point of your marker icon
        }
    });
    // Add markers for each sample
    iconNo = 0;

    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.sort();
    datesSampled.forEach(dateSampled => {
        currentIcon = new CustomIcon({ iconUrl: markerPngs[iconNo] });
        iconNo = (iconNo + 1) % 9;
        noSamples = 0;
        for (const dateSampled in selectedSampleInfo) {
            noSamples += Object.keys(selectedSampleInfo[dateSampled].position).length;
        }
        console.log('noSamples', noSamples);
        highlighted = Array(noSamples).fill(false);
        for (const sample in selectedSampleInfo[dateSampled].position) {
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
                    // Create a marker for each sample
                    //						const marker = L.marker([lat, lon]).addTo(map).bindPopup(`<b>${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                    const marker = L.marker([lat, lon], { icon: currentIcon }).addTo(map).bindPopup(`<b>${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                    /*						const marker = L.circleMarker([lat, lon],
                                        {radius: 4, color: 'white', fillColor: 'red', fillOpacity: 1}
                                        ).addTo(map).bindPopup(`<b>${sample}</b><br>Latitude: ${lat}<br>Longitude: ${lon}`);
                                        marker.bindTooltip(sample, { permanent: false, direction: 'top' });*/
                    marker.isMarked = false;

                    // Add a click event listener to the marker
                    marker.on('click', function () {
                        hoveredSample = sample;
                        createHighlights(meas, linLog, null, hoveredSample, marker.isMarked);
                        if (!marker.isMarked) {
                            marker.isMarked = true;
                        } else {
                            marker.isMarked = false;
                        }
                        // Update the chart - in routintes
                        //console.log('update ',sample,i);
                        //							chartInstance[i].update();
                    });

                    noLocations += 1;
                    latSum += parseFloat(lat);
                    lonSum += parseFloat(lon);
                };
            }

        }
        /*				iconNo += 1;
                    if (iconNo > 8) {
                        iconNo = 0;
                    }*/
        console.log(iconNo, dateSampled);
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

// If the input doesn't match any recognized format, return null or handle accordingly
return null;
}

function parseCoordinates(latitude, longitude) {
// Check if the input is undefined or null
if (latitude == undefined || latitude == null || longitude == undefined || longitude == null) {
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

