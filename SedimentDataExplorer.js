    let testOne = {};
    let radarPlot = "None";
//		import {parse, stringify, toJSON, fromJSON} from 'flatted';
    const autocolors = window['chartjs-plugin-autocolors'];
    Chart.register(autocolors);
    const annotationPlugin = window['chartjs-plugin-annotation'];
    Chart.register(annotationPlugin);
    // Importing the necessary library for coordinate conversion
//    const osGridConverter = require('os-transform.js');
    const osGridConverter = window['os-transform.js'];
    
    markerPath = 'markers/';
    markerPngs = ['marker-icon-red.png', 'marker-icon-orange.png', 'marker-icon-yellow.png',
    'marker-icon-green.png', 'marker-icon-blue.png', 'marker-icon-violet.png',
    'marker-icon-grey.png', 'marker-icon-gold.png','marker-icon-black.png'];

// Define the projection for British National Grid (OSGB 1936)
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894 +units=m +no_defs");

    let lastInstanceNo = 0;
    let lastScatterInstanceNo = 0;
    let noInstances = 16;
    let exportLink = null;
    let chartInstance = [];
    let popupInstance = [];
    let instanceType = [];
    let instanceSheet = [];
    let highlighted = [];
    let legends = [];
    let ylinlog = [];
    let stacked = [];
    let largeSize = [];
    let xAxisSort = 'normal';
    let highlightMarkers = {};
    for (i = 1; i < noInstances; i++) {
        chartInstance[i] = null;
        instanceType[i] = null;
        instanceSheet[i] = null;
    }
    dataSheetNames = ['Physical Data','Trace metal data','PAH data','PCB data','BDE data','Organotins data','Organochlorine data'];
    dataSheetAbr = {'Physical Data': 'Phys','Trace metal data': 'TM','PAH data': 'PAH','PCB data': 'PCB','BDE data': 'BDE','Organotins data': 'OT',
        'Organochlorine data': 'OC'};
    dataSheetNamesCheckboxes = [];
    for (let i = 0; i < dataSheetNames.length; i++) {
        dataSheetNamesCheckboxes[i] = dataSheetNames[i].replace(/\s/g, '').toLowerCase();
      }
    sheetsToDisplay = {};
    for (i = 0; i < dataSheetNames.length; i++) {
        sheetName = dataSheetNames[i];
        sheetsToDisplay[sheetName] = true;
    }
    subChartNames = ['samplegroup','chemicalgroup','positionplace','gorhamtest','totalhc','pahratios','ringfractions','eparatios','simpleratios','congenertest']
    subsToDisplay = {};
    for (i = 0; i < subChartNames.length; i++) {
        subName = subChartNames[i];
        subsToDisplay[sheetName] = true;
    }
    sortingOptions = ['normal', 'datelatitude', 'datelongitude', 'datetotalarea', 'latitude', 'longitude', 'totalarea', 'silt', 'siltsand', 'sand', 'gravel',
        'totalhc', 'lmw', 'hmw', 'ices7', 'allpcbs', 'datelmw', 'datehmw', 'dateices7', 'dateallpcbs'];
    calcSheetNames = ['Physical Stats','PSA Charts','Metals calcs','PAH calcs','PCB calcs','BDE calcs','Organotin calcs','Organochlorine calcs'];
    let map; // Declare map as a global variable
    let fred;
    let sampleMeasurements = {};
    let selectedSampleMeasurements = {};
    let sampleInfo = {};
    let selectedSampleInfo = {};
    let blankMeasurements = {};
    let namedLocations = {};
    let chemInfo = {};
    //All actions level mg/kg
    const actionLevels = {};
    actionLevels['Trace metal data'] = {
        'Arsenic (As)':[20,100],
        'Cadmium (Cd)': [0.4,5],
        'Chromium (Cr)': [40,400],
        'Copper (Cu)': [40,400],
        'Mercury (Hg)': [0.3,3],
        'Nickel (Ni)': [20,200],
        'Lead (Pb)': [50,500],
        'Zinc (Zn)': [130,800]
    };
    actionLevels['Organotins data'] = {
        'Dibutyltine (DBT)': [0.1,1],
        'Tributyltin (TBT)': [0.1,1]
    };
    actionLevels['PAH data'] = {
        'Acenapthene': [0.1,0],
        'Acenapthylene': [0.1,0],
        'Anthracene': [0.1,0],
        'Benz[a]anthracene': [0.1,0],
        'Benzo[a]pyrene': [0.1,0],
        'Benzo[b]fluoranthene': [0.1,0],
        'Benzo[g,h,i]perylene': [0.1,0],
        'Benzo[e]pyrene': [0.1,0],
        'Benzo[k]fluoranthene': [0.1,0],
        'C1-Napthalenes': [0.1,0],
        'C1-Phenanthrenes': [0.1,0],
        'C2-Napthalenes': [0.1,0],
        'C3-Napthalenes': [0.1,0],
        'Chrysene': [0.1,0],
        'Dibenz[a,h]anthracene': [0.01,0],
        'Fluoranthene': [0.1,0],
        'Fluorene': [0.1,0],
        'Indeno[123-c,d]pyrene': [0.1,0],
        'Napthalene': [0.1,0],
        'Perylene': [0.1,0],
        'Phenanthrene': [0.1,0],
        'Pyrene': [0.1,0]
    };
    actionLevels['Organochlorine data'] = {
        'Dieldrin': [0.005,0],
        'Dichlorodiphenyltrichloroethane (PPDDT)': [0.001,0.2]
    };
    let actionLevelColors = ['rgba(255, 255, 0, 1)','rgba(255, 0, 0, 0.5)'];
    let actionLevelDashes = [[3,3],[5,5]];

    firstTime = true;
    
    const ccontainer = document.getElementById('radarPlots');
    radarPlotTypes = [];
//    radarPlotTypes[0] = "None";;
//    radarPlotTypes = join(radarPlotTypes,dataSheetNames);
//let radarPlotTypes = dataSheetNames;
radarPlotTypes[0] = "None";
for (i = 1; i < dataSheetNames.length; i++) {
    radarPlotTypes[i] = dataSheetNames[i];
}
    radarPlotTypes.forEach((name, index) => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `radio${index}`;
        radio.name = 'dataSheet';
        radio.value = name;
        if (name === "None") {
            radio.checked = true;
        } /*else {
            radio.checked = false;
        }*/
        const label = document.createElement('label');
        label.htmlFor = `radio${index}`;
        label.appendChild(document.createTextNode(name));

        // Attach event listener to each radio button
        radio.addEventListener('change', function() {
            if (this.checked) {
                radarPlot = this.value; // Set radarPlot to the selected value
                console.log('Selected radar plot:', radarPlot);
            }
        });

        ccontainer.appendChild(radio);
        ccontainer.appendChild(label);
    });

    importData();

    function parseDates(dateString) {
        //console.log('dateString pd', dateString);
                    // Check if the date field is empty
                    if (!dateString) {
                        return ['Missing'];
                    }
        
                    const dates = [];
        
                    // Split the input by commas or hyphens
                    const dateParts = dateString.split('/,|-/');
                    dateParts.forEach(part => {
                        // Trim leading/trailing spaces
                        const trimmedPart = part.trim();
        
                        // Check if it's a range (contains a hyphen)
                        if (trimmedPart.includes('/')) {
                            const ukDate = convertToUKFormat(trimmedPart);
                            if (ukDate) {
                                dates.push(ukDate);
                            }
                        } else {
                            // Single date
                            const ukDate = convertToUKFormat(trimmedPart);
                            if (ukDate) {
                                dates.push(ukDate);
                            }
                        }
                    });
        
                    return dates.length > 0 ? dates : ['Missing'];
                }
        
            function convertToUKFormat(dateString) {
        //console.log('dateString cUKf',dateString);
            const parts = dateString.split('/');
        //console.log('parts cUKf',parts);
            if (parts.length === 3) {
                if (parts[2].length === 2) {
                    // Assuming the format is mm/dd/yy
                    const mm = parts[0].padStart(2, '0');
                    const dd = parts[1].padStart(2, '0');
                    const yy = parts[2].padStart(2, '0');
        
                    // Construct the UK format: dd/mm/yy
        //console.log('return',`20${yy}/${mm}/${dd}`);
                    return `20${yy}/${mm}/${dd}`;
                    } else {
                        if (parts[2].length === 4) {
                            // Assuming the format is mm/dd/yy
                            const dd = parts[0].padStart(2, '0');
                            const mm = parts[1].padStart(2, '0');
                            const yy = parts[2].padStart(2, '0');
        
                            // Construct the UK format: dd/mm/yy
        //console.log('return',`${yy}/${mm}/${dd}`);
                            return `${yy}/${mm}/${dd}`;
                        }
                    }
                }
            // Return null for invalid date formats
            return null;
            }
        
            function saveSnapShot() {
        const fileSave = document.getElementById('fileSave');
        const fileName = fileSave.value;
        saveStatus(fileName);
    }
    
    function loadSnapShotURL() {
        const urlLoad = document.getElementById('urlLoad');
        const fileUrl = urlLoad.value;
        loadStatus(fileUrl);
    }
    
    function loadSnapShotFile() {
        const fileInput = document.getElementById('fileLoad');
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                // Read file as text
                const textData = e.target.result;
                // Decode the base64 data (if it was encoded)
                const decodedData = decodeURIComponent(escape(atob(textData)));
                // Parse the JSON data
                const jsonData = JSON.parse(decodedData);
                // Use the loaded data
                // Now jsonData contains the loaded data
                sampleInfo = jsonData.sampleInfo;
                sampleMeasurements = jsonData.sampleMeasurements;
                selectedSampleInfo = jsonData.selectedSampleInfo;
                selectedSampleMeasurements = jsonData.selectedSampleMeasurements;
                for (dateSampled in sampleMeasurements) {
                    if ('Physical Data' in sampleMeasurements[dateSampled]) {
                        for (sample in sampleMeasurements[dateSampled]['Physical Data'].samples) {
                            if (!('totalArea' in sampleMeasurements[dateSampled]['Physical Data'].samples[sample])) {
                                currentPsd = sampleMeasurements[dateSampled]['Physical Data'].samples[sample].psd;
                                retData = psdPostProcess(currentPsd, sampleMeasurements[dateSampled]['Physical Data'].sizes);
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].psdAreas = retData['areas'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].psdRelaitveAreas = retData['realtiveAreas'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].splitWeights = retData['splitWeights'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].splitAreas = retData['splitAreas'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].splitRelativeAreas = retData['splitRelativeAreas'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].cumAreas = retData['cumAreas'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].cumWeights = retData['cumWeights'];
                                sampleMeasurements[dateSampled]['Physical Data'].samples[sample].totalArea = retData['totalArea'];
                            }
                        }
                    }
                }
                for (dateSampled in selectedSampleMeasurements) {
                    if ('Physical Data' in selectedSampleMeasurements[dateSampled]) {

                        for (sample in selectedSampleMeasurements[dateSampled]['Physical Data'].samples) {
                            if (!('totalArea' in selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample])) {
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample] = sampleMeasurements[dateSampled]['Physical Data'].samples[sample];
/*                                currentPsd = selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].psd;
                                retData = psdPostProcess(currentPsd, selectedSampleMeasurements[dateSampled]['Physical Data'].sizes);
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].psdAreas = retData['areas'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].psdAreas = retData['realtiveAreas'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].splitWeights = retData['splitWeights'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].splitAreas = retData['splitAreas'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].splitRelativeAreas = retData['splitRelativeAreas'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].cumAreas = retData['cumAreas'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].cumWeights = retData['cumWeights'];
                                selectedSampleMeasurements[dateSampled]['Physical Data'].samples[sample].totalArea = retData['totalArea'];*/
                            }
                        }
                    }
                }
                updateChart();
            };
            reader.readAsText(file);
        }
    }
    
    function saveStatus(fileName) {
        // Save data to a file
        const dataBlob = new Blob([btoa(unescape(encodeURIComponent(JSON.stringify({ sampleInfo, sampleMeasurements, selectedSampleInfo, selectedSampleMeasurements }))))], { type: 'application/octet-stream' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = fileName;
        downloadLink.click();
    }
    
    // Function to load data from a file URL
    async function loadStatus(fileURL) {
        try {
            // Fetch the data from the URL
            const response = await fetch(fileURL);
    
            // Check if the fetch was successful (status code 200)
            if (!response.ok) {
                throw new Error(`Failed to fetch data. Status: ${response.status}`);
            }
    
            // Read the response as text
            const textData = await response.text();
    
            // Decode the base64 data (if it was encoded)
            const decodedData = decodeURIComponent(escape(atob(textData)));
    
            // Parse the JSON data
            const jsonData = JSON.parse(decodedData);
    
            // Now jsonData contains the loaded data
            sampleInfo = jsonData.sampleInfo;
            sampleMeasurements = jsonData.sampleMeasurements;
            selectedSampleInfo = jsonData.selectedSampleInfo;
            selectedSampleMeasurements = jsonData.selectedSampleMeasurements;
            updateChart();
            return jsonData;
        } catch (error) {
            console.error('Error loading data:', error.message);
        }
    }

    function clearData() {
        sampleMeasurements = {};
        selectedSampleMeasurements = {};
        sampleInfo = {};
        selectedSampleInfo = {};
/*			if (map) {
            map.remove();
        }*/
        const canvas = [];
        for (i = 1; i < noInstances; i++) {
            canvas[i] = document.getElementById('chart' + i);
            clearCanvasAndChart(canvas[i], i);
        }
    }

    function importChemInfo() {
        urls = {};
console.log('importChemInfo');
        if (firstTime) {
            firstTime = false;
            files = {};
            // Get the current URL
            const currentURL = window.location.href;
            
            // Parse the URL to get the search parameters
            const suppliedParams = new URLSearchParams(window.location.search);

            // Get the value of the 'cheminfo' parameter
            const cheminfoParam = suppliedParams.get('cheminfo');
            if (!cheminfoParam) {
                return;
            } else {
                    urls = cheminfoParam.split(',').map(url => url.trim()); // Split comma-separated URLs
            }
        } else {
            const fileInput = document.getElementById('fileChemInfo');
            const urlInput = document.getElementById('urlChemInfo');
            const files = fileInput.files; // Files is now a FileList object containing multiple files
            const urls = urlInput.value.trim().split(',').map(url => url.trim()); // Split comma-separated URLs

            if (files.length === 0 && urls.length === 0) {
                alert('Please select files or enter URLs.');
                return;
            }
            // Process files
            for (let i = 0; i < files.length; i++) {
                filename = files[i].name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = new Uint8Array(e.target.result);
                    processExcelChemInfo(data,filename);
                };
                reader.readAsArrayBuffer(files[i]);
            }
        }
        // Process URLs only if URLs are supplied
        if (urls.length > 0) {
            urls.forEach(url => {
            // Check if the URL is a valid URL before fetching
                 if  (!/^https?:\/\//i.test(url)) {
                     console.error('Invalid URL:', url);
                     return;
                 }

                 fetch(url)
                    .then(response => response.arrayBuffer())
                    .then(data => {
                        processExcelChemInfo(new Uint8Array(data),url);
                    })
                    .catch(error => {
                        console.error('Error fetching the chemInfo file:', error);
                    });
                });
        }
        // Clear the input field after reading locations
        fileInput.value = '';
        urlInput.value = '';
    }
    
    function processExcelChemInfo(data,url) {
        // Based on simple Excel data in first sheet
        // row 1 column titles
        // column 1 compound name
        // column 2 - n property
        const workbook = XLSX.read(data, { type: 'array' });
//console.log(workbook);
        sheetData = workbook.Sheets['Sheet1'];
//console.log(sheetData);
        const df = XLSX.utils.sheet_to_json(sheetData, { header: 1 });
        for (let r = 1; r < df.length; r++) {
            const chemical = df[r][0];
            chemInfo[chemical] = {};
            for (let c = 1; c < df[r].length; c++) {
                const property = df[0][c];
                chemInfo[chemical][property] = df[r][c];
            }
//console.log(chemInfo[chemical]);
        }
//console.log('End of processChemInfo');
    }



    function importLocations() {
        urls = {};
        if (firstTime) {
            firstTime = false;
            files = {};
            // Get the current URL
            const currentURL = window.location.href;
            
            // Parse the URL to get the search parameters
            const suppliedParams = new URLSearchParams(window.location.search);

            // Get the value of the 'locations' parameter
            const locationsParam = suppliedParams.get('locations');
            if (!locationsParam) {
                return;
            } else {
                    urls = locationsParam.split(',').map(url => url.trim()); // Split comma-separated URLs
            }
        } else {
            const fileInput = document.getElementById('fileLocations');
            const urlInput = document.getElementById('urlLocations');
            const files = fileInput.files; // Files is now a FileList object containing multiple files
            const urls = urlInput.value.trim().split(',').map(url => url.trim()); // Split comma-separated URLs

            if (files.length === 0 && urls.length === 0) {
                alert('Please select files or enter URLs.');
                return;
            }
            // Process files
            for (let i = 0; i < files.length; i++) {
                filename = files[i].name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = new Uint8Array(e.target.result);
                    processExcelLocations(data,filename);
                };
                reader.readAsArrayBuffer(files[i]);
            }
        }
        // Process URLs only if URLs are supplied
        if (urls.length > 0) {
            urls.forEach(url => {
            // Check if the URL is a valid URL before fetching
                 if  (!/^https?:\/\//i.test(url)) {
                     console.error('Invalid URL:', url);
                     return;
                 }

                 fetch(url)
                    .then(response => response.arrayBuffer())
                    .then(data => {
                        processExcelLocations(new Uint8Array(data),url);
                    })
                    .catch(error => {
                        console.error('Error fetching the locations file:', error);
                    });
                });
        }
        // Clear the input field after reading locations
        fileInput.value = '';
        urlInput.value = '';
    }
    
    function processExcelLocations(data,url) {
        // Based on simple Excel data in first sheet
        // row 1 column titles
        // column 1 location as per name used as sample in MMO templates
        // column 2 latitude in decimal degrees
        // column 3 longitude in decimal degrees
// console.log('processexcellocations',url);
//console.log('prcoessing ',url);
        const workbook = XLSX.read(data, { type: 'array' });
//console.log(workbook);
        sheetData = workbook.Sheets['Sheet1'];
//console.log(sheetData);
        const df = XLSX.utils.sheet_to_json(sheetData, { header: 1 });
        for (let r = 1; r < df.length; r++) {
            const sample = df[r][0];
//console.log('|',sample,'|',sample.trim(),'|');
            cleanSample = sample.replace(/\s+/g, '').toLowerCase();
            namedLocations[cleanSample] = {};
            namedLocations[cleanSample].latitude = df[r][1];
            namedLocations[cleanSample].longitude = df[r][2];
//console.log(sample,namedLocations[sample]);
        }
console.log('End of processExcelLocations');
    }

    function checkboxParameters(suppliedParams, paramName, checkboxNames) {
        const param = suppliedParams.get(paramName);
        if (param) {
            sels = param.split(',').map(sel => sel.trim()); // Split comma-separated URLs
            if (sels) {
                // Blank all the checkboxes
                for (let i = 0; i < checkboxNames.length; i++) {
                    const checkbox = document.getElementById(checkboxNames[i]);
                    checkbox.checked = false;
                }
                // Check all the boxes set in url
                for (let i = 0; i < sels.length; i++) {
console.log(i);
console.log(sels[i]);
                    const checkbox = document.getElementById(sels[i].toLowerCase());
                    checkbox.checked = true;
                }
            }
        }
    }

    function cleanChemicalString(chemical) {
        return chemical
            .replace(/[\r]/g, '')                 // Remove \r
            .replace(/[\n]/g, '')                 // Remove \n
            .replace(/\s*-\s*/g, '-')               // Remove spaces around dashes
            .replace(/\s+/g, ' ')                   // Replace multiple spaces with a single space
            .trim();                                // Remove spaces at the beginning and end of the string
    }

function importData() {
    var urls = {};
    if (firstTime) {
        importLocations();
        firstTime = false;
        files = {};
        // Get the current URL
        const currentURL = window.location.href;
        // Parse the URL to get the search parameters
        const suppliedParams = new URLSearchParams(window.location.search);
        // Get the value of the 'status' parameter
        const statusParam = suppliedParams.get('status');
        if (statusParam) {
            loadStatus(statusParam);
        } else {
            const urlParam = suppliedParams.get('urls');
            if (urlParam) {
                urls = urlParam.split(',').map(url => url.trim()); // Split comma-separated URLs
            }
        }
        checkboxParameters(suppliedParams, 'selcharts', dataSheetNamesCheckboxes);
        checkboxParameters(suppliedParams, 'subcharts', subChartNames);
        const noninter = suppliedParams.get('noninter');
        if (!noninter) {
            const everything = document.getElementById('everything');
            everything.style.display = 'inline';
        }
        console.log(suppliedParams);
        const durlParam = suppliedParams.get('durl');
        console.log(durlParam);
        if (durlParam) {
/*            var urlInputDD = document.getElementById('urlInputDD');
            urlInputDD.value = durlParam;
            importDredgeData(durlParam);*/
            dlat = suppliedParams.get('dlat');
            dlon = suppliedParams.get('dlon');
            drad = suppliedParams.get('drad');
            dstart = suppliedParams.get('dstart');
            dfinish = suppliedParams.get('dfinish');
            dlicences = suppliedParams.get('dlics')
/*            if (dlat && dlon && drad) {
                centreLat = document.getElementById('centreLatitude');
                centreLon = document.getElementById('centreLongitude');
                radius = document.getElementById('radius');
                centreLat.value = dlat;
                centreLon.value = dlon;
                radius.value = drad;
//                closeCEFASSearch();
            }*/
            importDredgeData(durlParam,dlat,dlon,drad,dstart,dfinish,dlicences);
        }
        const sortParam = suppliedParams.get('sort');
        console.log(durlParam);
        if (sortParam) {
            xAxisSort = sortParam;
//            xAxisSortRadio = document.querySelector('input[name="sorting"][xAxisSort]');
//            xAxisSortRadio = document.querySelector('input[name="sorting"]');
            xAxisSortRadio = document.getElementById(xAxisSort);
            xAxisSortRadio.checked = true;
/*            switch (sortParam) {
                case 'normal': xAxisSort = 'normal'; break
                case 'latitude': xAxisSort = 'latitude'; break
                case 'longitude': xAxisSort = 'longitude'; break
                case 'datelatitude': xAxisSort = 'latitude'; break
                case 'datelongitude': xAxisSort = 'longitude'; break
                case 'totalarea': xAxisSort = 'totalarea'; break
            }*/
        }
    } else {
        const fileInput = document.getElementById('fileInput');
        const urlInput = document.getElementById('urlInput');
        files = fileInput.files; // Files is now a FileList object containing multiple files
        //console.log(files);
        urls = urlInput.value.trim().split(',').map(url => url.trim()); // Split comma-separated URLs
    }
    if (files.length === 0 && urls.length === 0) {
        alert('Please select files or enter URLs.');
        return;
    }
    // Process files
    if (files.length > 0) {
        let filesProcessed = 0; // counter to track the number of files processed
        let fL = files.length;
        //console.log(files.length);
        for (let i = 0; i < files.length; i++) {
            const filename = files[i].name;
            //console.log(filename);
            const reader = new FileReader();

            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                processExcelData(data, filename);
                filesProcessed++; // Increment the counter after processing each file
                // Check if all files have been processed
                //console.log(files.length,fL, filesProcessed);
                if (filesProcessed === fL) {
                    //console.log('calling updateChart');
                    updateChart(); // Call updateChart once all files have been processed
                //    3
                }
            };
            reader.readAsArrayBuffer(files[i]);
        }
        //            updateChart();
    }

// Process URLs only if URLs are supplied
/*        if (urls.length > 0) {
            urls.forEach(url => {
                // Check if the URL is a valid URL before fetching
                if (!/^https?:\/\//i.test(url)) {
                    console.error('Invalid URL:', url);
                    return;
                }

                fetch(url)
                    .then(response => response.arrayBuffer())
                    .then(data => {
                        processExcelData(new Uint8Array(data), url);
//                        updateChart();
                        console.log('processexceldata again');
                    })
                    .catch(error => {
                        console.error('Error fetching the file:', error);
                    });
                console.log('here again');
            });
            console.log('there again');
        }*/
        if (urls.length > 0) {
            // Array to store all fetch promises
            const fetchPromises = [];
        
            urls.forEach(url => {
                // Check if the URL is a valid URL before fetching
                if (!/^https?:\/\//i.test(url)) {
                    console.error('Invalid URL:', url);
                    return;
                }
        
                // Push each fetch promise into the array
                fetchPromises.push(
                    fetch(url)
                        .then(response => response.arrayBuffer())
                        .then(data => {
                            processExcelData(new Uint8Array(data), url);
//console.log('processexceldata again');
                        })
                        .catch(error => {
                            console.error('Error fetching the file:', error);
                        })
                );
            });
        
            // Wait for all fetch promises to resolve
            Promise.all(fetchPromises)
                .then(() => {
                    updateChart();
//console.log('there again');
                });
        }
//console.log('Import Data out of fetch');
//        updateChart();
// Clear the input field after reading data
        fileInput.value = '';
        urlInput.value = '';
    }

function processExcelData(data, url) {
    // console.log('processexceldata',url);
    const workbook = XLSX.read(data, { type: 'array' });

    function extractDataFromSheet(sheetName, sheetData, dateSampled) {
        if (sheetData === null || sheetData == undefined) {
            return null;
        }
        //console.log('ext data ',sheetData);
        const df = XLSX.utils.sheet_to_json(sheetData, { header: 1 });
        //                const df = XLSX.utils.sheet_to_json(sheetData, { header: 1, cellText: true });
        let startRow = -1;
        let startCol = -1;
        let measurementUnit = 'Not set';
        let totalSum = 0;
        meas = {};
        // Read in date of analysis
        //console.log('df ', df);
        if (df[18][1] === 'Date of analysis:') {
            row = 18;
            column = 2;
        } else {
            if (df[17][1] === 'Date of analysis:') {
                row = 17;
                column = 2;
            } else {
                if (df[18][2] === 'Date of analysis:') {
                    row = 18;
                    column = 3;
                } else {
                    if (df[17][2] === 'Date of analysis:') {
                        row = 17;
                        column = 3;
                    } else {
                        row = null;
                        dataAnalysed = 'AD: missing';
                        contractor = 'Not listed';
                    }
                }
            }
        }
        dateAnalysed = 'AD: missing';
        contractor = 'Not listed';
        for (let cc = 0; cc < 30; cc++) {
            for (let r = 0; r < 30; r++) {
                const cellValue = df[r][cc];
                //console.log(sheetName,r,cc);
                if (typeof cellValue === 'string' && cellValue.includes('Date of analysis')) {
                    dateAnalysed = parseDates(df[r][cc + 1])[0];
                    contractor = df[r - 1][cc + 1];
                    break;
                }
            }
        }

        for (let r = 0; r < df.length; r++) {
            for (let cc = 0; cc < df[r].length; cc++) {
                const cellValue = df[r][cc];
                if (typeof cellValue === 'string' && cellValue.includes('Dredge Area')) {
                    c = cc - 1;
                    measurementUnit = df[r][c + 4];
                    corec = 0;
                    extraValue = df[r][c];
                    if (typeof extraValue === 'string' && extraValue.includes('Laboratory sample number')) {
                        //console.log('Lab sampl numb');
                        corec = 0;
                        measurementUnit = df[r][c + 4];
                    } else {
                        //console.log('No Lab sampl numb');
                        corec = 0;
                        measurementUnit = df[r][c + 3];
                    }
                    //}
                    //console.log('unit ',measurementUnit);
                    if (!(sheetName === 'Physical Data')) {
                        if (!(sheetName === 'PCB data')) {
                            startRow = r + 2;
                        } else {
                            startRow = r + 3;
                        }
                        startCol = c;
                        for (let col = startCol + 1; col < df[startRow].length; col++) {
                            if (!(sheetName === 'PCB data')) {
                                rawChemical = df[startRow - 1][col];
                            } else {
                                rawChemical = df[startRow - 2][col];
                                congener = df[startRow - 1][col];
                            }
                            if (rawChemical !== null && rawChemical !== undefined) {
                                // Need to tidy name coming from template
                                // In BDE seem to have variations some with \n or \r\n
                                //if(sheetName === 'BDE data') {
                                //    console.log('r ',rawChemical);
                                //}
                                chemical = cleanChemicalString(rawChemical);

                                //if(sheetName === 'BDE data') {
                                //    console.log('c ',chemical);
                                //}
                                if (!meas.chemicals) {
                                    meas.chemicals = {};
                                    meas.total = {};
                                    if (sheetName === 'PCB data') {
                                        meas.congeners = {};
                                    }
                                }
                                if (!meas.chemicals[chemical]) {
                                    meas.chemicals[chemical] = {};
                                    if (sheetName === 'PCB data') {
                                        meas.congeners[chemical] = congener;
                                    }
                                }
                                for (let row = startRow; row < df.length; row++) {
                                    sample = df[row][startCol + 2]; //bodge to pick up sample id
                                    // If sample id not present then use Laboratory sample number instead
                                    if (sample == undefined || sample == null) {
                                        sample = df[row][startCol];
                                    }
                                    if (!(sample == undefined || sample == null)) {
                                        //console.log(sample);
                                        let concentration = df[row][col + corec];
                                        if (isNaN(concentration)) {
                                            concentration = 0.0;
                                        }
                                        if (sample.includes('detection')) {
                                            meas.chemicals[chemical][sample] = concentration;
                                            //.push(parseFloat(concentration) || 0);
                                        } else {
                                            if (!meas.chemicals[chemical].samples) {
                                                meas.chemicals[chemical].samples = {};
                                            }
                                            if (!meas.chemicals[chemical].samples[sample]) {
                                                meas.chemicals[chemical].samples[sample] = {};
                                            }
                                            if (!meas.total[sample]) {
                                                meas.total[sample] = 0;
                                            }
                                            if (concentration !== null && concentration !== undefined) {
                                                meas.chemicals[chemical].samples[sample] = parseFloat(concentration);
                                                meas.total[sample] += parseFloat(concentration) || 0;
                                                totalSum += parseFloat(concentration) || 0;
                                            }
                                        }
                                    }
                                }
                            } else if (sheetName === 'PAH data') {
                                hydrocarbon = df[startRow - 2][col];
                                if (hydrocarbon !== null && hydrocarbon !== undefined) {
                                    if (hydrocarbon === 'Total hydrocarbon content (mg/kg)') {
                                        for (let row = startRow; row < df.length; row++) {
                                            sample = df[row][startCol + 2]; //bodge to pick up sample id
                                            // If sample id not present then use Laboratory sample number instead
                                            if (sample == undefined || sample == null) {
                                                sample = df[row][startCol];
                                            }
                                            if (!(sample == undefined || sample == null)) {
                                                const concentration = parseFloat(df[row][col + corec]);
                                                if (sample.includes('detection')) {
                                                    meas[sample] = concentration;
                                                    //.push(parseFloat(concentration) || 0);
                                                } else {
                                                    if (!meas.totalHC) {
                                                        meas.totalHC = {};
                                                        meas.totalHCUnit = hydrocarbon;
                                                    }
                                                    if (isNaN(concentration)) {
                                                        meas.totalHC[sample] = 0.0;
                                                    } else {
                                                        meas.totalHC[sample] = concentration;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        measurementUnit = df[r][c + 7];
                        meas.samples = {};
                        meas.sizes = [];
                        startRow = r + 3;
                        startCol = c;
                        for (let col = startCol + 7; col < df[startRow - 1].length; col++) {
                            meas.sizes.push(parseFloat(df[startRow - 2][col]) || 0);
                            for (let row = startRow; row < 38; row++) {
                                sample = df[row][startCol + 2]; //bodge to pick up sample id
                                // If sample id not present then use Laboratory sample number instead
                                if (sample == undefined || sample == null) {
                                    sample = df[row][startCol];
                                }
                                if (!(sample == undefined || sample == null)) {
                                    //console.log(sheetName, col, row, sample);
                                    if (!meas.samples) {
                                        meas.samples = {}
                                    }
                                    if (!meas.samples[sample]) {
                                        meas.samples[sample] = {};
                                        meas.samples[sample].psd = [];
                                        meas.samples[sample]['Visual Appearance'] = df[row][startCol + 3];
                                        meas.samples[sample]['Total solids (% total sediment)'] = df[row][startCol + 5];
                                        meas.samples[sample]['Organic matter (total organic carbon)'] = df[row][startCol + 6];
                                    }

                                    //console.log(sample);
                                    meas.samples[sample].psd.push(parseFloat(df[row][col]) || 0);
                                    //console.log('meas.psd ',df[row][col]);
                                }
                            }
                        }
                        for (sample in meas.samples) {
                            currentPsd = meas.samples[sample].psd;
                            retData = psdPostProcess(currentPsd,meas.sizes);
                            meas.samples[sample].psdAreas = retData['areas'];
                            meas.samples[sample].psdRelativeAreas = retData['relativeAreas'];
                            meas.samples[sample].splitWeights = retData['splitWeights'];
                            meas.samples[sample].splitAreas = retData['splitAreas'];
                            meas.samples[sample].splitRelativeAreas = retData['splitRelativeAreas'];
                            meas.samples[sample].cumWeights = retData['cumWeights'];
                            meas.samples[sample].cumAreas = retData['cumAreas'];
                            meas.samples[sample].totalArea = retData['totalArea'];
                        }
                    }
                    break;
                }
            }
            if (startRow !== -1 && startCol !== -1) {
                break;
            }
        }
        meas['Date analysed'] = dateAnalysed;
        meas['Unit of measurement'] = measurementUnit;
        meas['Laboratory/contractor'] = contractor;
        if (!totalSum > 0 && !(sheetName === 'Physical Data')) {
            return 'No data for ' + sheetName;
        }
        if (sheetName === 'Physical Data' && Object.keys(meas.samples).length === 0) {
            return 'No data for ' + sheetName;
        }
        //console.log(dateSampled, sheetName, 'meas ', meas);
//        if (!(meas.samples === undefined || meas.samples === null)) {
            sampleMeasurements[dateSampled][sheetName] = meas;
            const sums = {};
            //console.log(meas);
            //for (const sheetName in meas) {
            if (sheetName === 'PAH data') {
                pahPostProcess(meas, dateSampled);
            }
            if (sheetName === 'PCB data') {
                pcbPostProcess(meas, dateSampled);
            }
//        }
        //}
        return dateAnalysed;
    }

    function extractApplicationDataFromSheet(sheetName, sheetData, url) {
        //console.log('extractappdata',url);
        //            dateSampled = 'SD Missing';
        const df = XLSX.utils.sheet_to_json(sheetData, { header: 1 });
        //                const df = XLSX.utils.sheet_to_json(sheetData, { header: 1, cellText: true });

        //console.log(sheetName);  //Output each cell value to console
        //console.log(df.length);
        let startRow = -1;
        let startCol = -1;

        // This code should have found Applicant: but doesn't so bodged above
        /*                        if (typeof cellValue === 'string' && cellValue.includes('Applicant:')) {
                                console.log('found applicant');
                                const applicant = df[r][c+1];
                                const applicationNumber = df[r+1][c+1];
                                const applicationTitle = df[r+2][c+1];
                                const dateSampled = df[r+3][c+1];
                                const samplingLocation = df[r+4][c+1];
                            }
        */


        /*                // This relies on template first page not changing at all
                     const applicant = df[14][4];
                    const applicationNumber = df[15][4];
                    const applicationTitle = df[16][4];*/
        for (i = 16; 19; i++) {
            dateRow = i;
            //console.log('df[dateRow][2]',dateRow,df[dateRow][2]);                
            if (df[dateRow][2].includes('Date sampled:')) {
                break;
            }
            dateRow = 0;
            //					dateSampled = 'SD Missing';
        }
        if (dateRow > 0) {
            //console.log('here',dateRow);
            applicant = df[dateRow - 3][4];
            applicationNumber = df[dateRow - 2][4];
            applicationTitle = df[dateRow - 1][4];
            //console.log(df[dateRow][4]);
            //console.log(df);
            dateSampled = parseDates(df[dateRow][4])[0];
            //console.log(dateSampled);
        } else {
            //console.log('there');
            applicant = df[14][4];
            applicationNumber = df[15][4];
            applicationTitle = df[16][4];
            dateSampled = 'Missing';
            dateRow = 17;
        }
        sampleInfo[dateSampled] = {};
        sampleInfo[dateSampled]['Applicant'] = applicant;
        sampleInfo[dateSampled]['Application number'] = applicationNumber;
        sampleInfo[dateSampled]['Application title'] = applicationTitle;
        sampleInfo[dateSampled]['Date sampled'] = dateSampled;
        sampleInfo[dateSampled]['fileURL'] = url;
        //console.log('extractapplicationdatafromsheet ', dateSampled,url);
        sampleInfo[dateSampled].position = {};
        sampleInfo[dateSampled].label = dateSampled;
        sampleMeasurements[dateSampled] = {};

        const samplingLocation = df[dateRow + 1][4];
        for (let c = 0; c < df.length; c++) {

            //Bodge as didn't read enough of columns when set by length alone
            //                    for (let r = 0; r < df[c].length; r++) {
            if (df[c].length < 40) {
                cdepth = 40;
            } else {
                cdepth = df[c].length;
            }
            for (let r = 0; r < cdepth; r++) {
                const cellValue = df[r][c];
                // console.log(c,r,cellValue);
                //                        if (typeof cellValue === 'string' && cellValue.includes('Excluded sample (MMO use)')) {
                if (typeof cellValue === 'string' && cellValue.includes('Sample location (decimal degrees, WGS84)')) {
                    //console.log('Sample Location');
                    const extraValue = df[r][c - 1]
                    //console.log(extraValue);
                    if (typeof extraValue === 'string' && extraValue.includes('Excluded sample (MMO use)')) {
                        startRow = r + 2;
                        startCol = c - 2;
                        samCol = startCol;
                        excCol = startCol + 1;
                        latCol = startCol + 2;
                        lonCol = startCol + 3;
                        namCol = startCol + 4;
                        depCol = startCol + 5;
                        dreCol = startCol + 6;
                    } else {
                        startRow = r + 2;
                        startCol = c - 1;
                        samCol = startCol;
                        excCol = startCol + 6; // not present here
                        dreCol = startCol + 5;
                        latCol = startCol + 1;
                        lonCol = startCol + 2;
                        namCol = startCol + 3;
                        depCol = startCol + 4;
                    }

                    for (let row = startRow; row < df.length; row++) {
                        const sample = df[row][samCol]; //bodge to pick up sample id
                        if (!(sample == undefined || sample == null)) {
                            sInfo = {};
                            sInfo['Excluded sample (MMO use)'] = df[row][excCol];
                            sInfo['Dredge area'] = df[row][dreCol];
                            point = parseCoordinates(df[row][latCol], df[row][lonCol]);
                            //console.log(df[row][latCol],df[row][lonCol]);
                            //console.log(point);
                            if (point === null || point === undefined) {
                                // latitude and longitude aren't specified so try to retrieve latlon from previously entered locations
                                cleanSample = sample.replace(/\s+/g, '').toLowerCase();
console.log(sample,cleanSample);
                                if (cleanSample in namedLocations) {
//                                if (namedLocations[cleanSample] !== null && namedLocations[cleanSample] !== undefined) {
console.log('found');
                                    point = {};
                                    point['latitude'] = namedLocations[cleanSample].latitude;
                                    point['longitude'] = namedLocations[cleanSample].longitude;
                                } else {
console.log('not found');
                                    //console.log('lat and long undefined does not match', sample);
                                    point = {};
                                    point['latitude'] = undefined;
                                    point['longitude'] = undefined;
                                }
                            }
                            sInfo['Position latitude'] = point['latitude'];
                            sInfo['Position longitude'] = point['longitude'];
                            sInfo['Location name (as per sampling plan)'] = df[row][namCol];
                            sInfo['Sampling depth (m)'] = processDepth(df[row][depCol]);
                            sInfo['Sampling location'] = samplingLocation;
                            sInfo['label'] = sample;
                            sampleInfo[dateSampled].position[sample] = sInfo;
                        }
                    }
                    break;
                }
            }
            if (startRow !== -1 && startCol !== -1) {
                // console.log('Breaking up');
                break;
            }
        }
        /*            if (dateSampled === 'Missing'){
                        dateSampled = 'Missing';
        console.log('This is test');
                    }*/
        //console.log('end of function',dateSampled);
        return dateSampled;
    }


//                workbook.SheetNames.forEach(sheetName => {
//                    const sheetData = workbook.Sheets[sheetName];
//                    extractDataFromSheet(sheetName, sheetData);
//                });
        sheetName = 'Application info';
        sheetData = workbook.Sheets[sheetName];
        dateSampled = extractApplicationDataFromSheet(sheetName, sheetData, url);
        sheetName = 'PAH data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);
        newDateSampled = dateSampled;
//console.log(dateSampled,dateAnalysed);
        if (dateSampled.includes('Missing')) {
            // Date sampled is missing so include an M for missing and the analysis date
            newDateSampled = dateAnalysed + 'M';
        } else if (dateSampled > dateAnalysed) {
            // Date sampled is later than date analysed so include an L for late and the analysis date
            newDateSampled = dateAnalysed + 'L';
        }
        //Add in application number
//console.log(dateSampled,sampleInfo[dateSampled]);
        if ('Application number' in sampleInfo[dateSampled]) {
            if(!sampleInfo[dateSampled]['Application number']) {
                pattern = '[A-Z]{3}_[0-9]{4}\_[0-9]{5}';
                fileURL = sampleInfo[dateSampled]['fileURL'];
//console.log(fileURL);
//console.log(pattern);
                matches = fileURL.match(pattern);
/*                if (matches) {
                    console.log('matches');
                }*/
                sampleInfo[dateSampled]['Application number'] = matches ? matches[0] : 'NAN';
//console.log(fileURL);
//console.log(pattern.match(sampleInfo[dateSampled]['fileURL']));
//                sampleInfo[dateSampled]['Application number'] = fileURL.match(pattern)[0];
//                sampleInfo[dateSampled]['Application number'] = pattern.match(fileURL)[0];
}
            newDateSampled = newDateSampled + ' f ' + sampleInfo[dateSampled]['Application number'];
            sampleInfo[newDateSampled] = sampleInfo[dateSampled];
            sampleInfo[newDateSampled]['Date Sampled'] = newDateSampled;
            sampleInfo[newDateSampled].label = newDateSampled;
            delete sampleInfo[dateSampled];
            sampleMeasurements[newDateSampled] = sampleMeasurements[dateSampled];
            delete sampleMeasurements[dateSampled];
        }
        dateSampled = newDateSampled;
        sheetName = 'PCB data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);
        sheetName = 'Trace metal data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);
        sheetName = 'BDE data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);
        sheetName = 'Organotins data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);
        sheetName = 'Organochlorine data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);
        
        sheetName = 'Physical Data';
        sheetData = workbook.Sheets[sheetName];
        dateAnalysed = extractDataFromSheet(sheetName, sheetData, dateSampled);

        
        selectedSampleMeasurements = sampleMeasurements;
        selectedSampleInfo = sampleInfo;
//        updateChart();
    };
//    updateChart();

    function processDepth(enteredDepth) {
//		console.log(enteredDepth);
      if (!enteredDepth) {
          return {
            minDepth: 0.0,
            maxDepth: 0.0,
      };
      }
      // Remove any non-numeric characters, except for dots and hyphens
      const cleanedDepth = enteredDepth.replace(/[^0-9.\-]/g, '');
    
      // Split the cleaned depth by hyphens to handle ranges
      const depthParts = cleanedDepth.split('-');
    
      // Convert the parts to numbers
      const numericDepths = depthParts.map(parseFloat);
    
      // Determine min and max depths
      const minDepth = Math.min(...numericDepths);
      const maxDepth = Math.max(...numericDepths);
    
      // Return the result
      return {
        minDepth: isNaN(minDepth) ? 0.0 : minDepth,
        maxDepth: isNaN(maxDepth) ? 0.0 : maxDepth,
      };
    }
    
// Function to create a new canvas for a chart
function createCanvas(instanceNo, row) {
//    if(typeof row === 'undefined') {
        htmlContainer = 'chartContainer';
        const container = document.getElementById(htmlContainer);
//    const container = document.getElementById('chartContainer');
        const canvas = document.createElement('canvas');
        canvas.id = 'chart' + instanceNo; // Unique chart ID
        container.appendChild(canvas); // Append the canvas to the container
/*    } else {
        htmlContainer = 'table';
console.log(row);
//        const cell = row.insertCell(); // Create a cell
        const container = document.getElementById(htmlContainer);
//    const container = document.getElementById('chartContainer');
        const canvas = document.createElement('canvas');
        canvas.id = 'chart' + instanceNo; // Unique chart ID
        row.appendChild(canvas); // Append the canvas to the container
    }*/
}

// Function to create a button for resetting zoom
function createExportButton(chart, instanceNo) {
    //console.log('creating zoom buttom',instanceNo);
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttone' + instanceNo
    button.textContent = 'Export';
    button.addEventListener('click', () => {
        exportChart(instanceNo);
    });
    container.appendChild(button);
}
        
    // Function to create a button for resetting zoom
function createResetZoomButton(chart,instanceNo) {
//console.log('creating zoom buttom',instanceNo);
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttonz'+instanceNo
    button.textContent = 'Reset Zoom';
    button.addEventListener('click', () => {
        chart.resetZoom();
    });
    container.appendChild(button);
}
    
// Function to create a button for toggling legend
function createToggleLegendButton(chart,instanceNo) {
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttonl'+instanceNo
    if (!legends[instanceNo]) {
        button.textContent = 'Legend';
    } else {
        button.textContent = 'No Legend';
    }
    button.addEventListener('click', () => {
        if (legends[instanceNo]) {
            chartInstance[instanceNo].options.plugins.legend.display = false;
            chartInstance[instanceNo].update();
            legends[instanceNo] = false;
            button.innerHTML = 'Legend';
        } else {
            chartInstance[instanceNo].options.plugins.legend.display = true;
            chartInstance[instanceNo].update();
            legends[instanceNo] = true;
            button.innerHTML = 'No Legend';
        }
//        chart.resetZoom();
    });
    container.appendChild(button);
}

/*
// Function to create a button for canvassize
function createToggleFocusChart(convas, chart, instanceNo, oneChemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle,largeInstanceNo) {
console.log(instanceNo, chemical, scatterData, sheetName, unitTitle, xAxisTitle, yAxisTitle,largeInstanceNo)
    const container = document.getElementById('chartButtons');
    const button = document.createElement('button');
    button.id = 'buttonf'+instanceNo
    if (!largeSize[instanceNo]) {
        button.textContent = unitTitle;
    } else {
        button.textContent = unitTitle;
    }
    button.addEventListener('click', () => {
        displayScatterChart(scatterData, oneChemical, sheetName, largeInstanceNo, unitTitle, xAxisTitle, yAxisTitle, -1);
        chartInstance[largeInstanceNo].update();
//                           (scatterData, oneChemical, sheetName, instanceNo, unitTitle, xAxisTitle, yAxisTitle, largeInstanceNo)   

    });
    container.appendChild(button);
}*/

// Function to create a button for canvassize
function createToggleCanvasSize(canvas, chart,instanceNo,chemical) {
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttonc'+instanceNo
    if (!largeSize[instanceNo]) {
        button.textContent = chemical;
    } else {
        button.textContent = chemical;
    }
    button.addEventListener('click', () => {
        if (largeSize[instanceNo]) {
            canvas.width = 1200;
            canvas.height = 800;
            largeSize[instanceNo] = false;
//            button.innerHTML = 'Y Log';
        } else {
              canvas.width = 400;
              canvas.height = 250;
              largeSize[instanceNo] = true;
//              button.innerHTML = 'Y Lin';
        }
        chartInstance[instanceNo].update();
    });
    container.appendChild(button);
}
    
// Function to create a button for toggling log scale
function createToggleLinLogButton(chart,instanceNo) {
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttono'+instanceNo
    if (!ylinlog[instanceNo]) {
        button.textContent = 'Y Log';
    } else {
        button.textContent = 'Y Lin';
    }
    button.addEventListener('click', () => {
        if (ylinlog[instanceNo]) {
            chartInstance[instanceNo].options.scales.y.type = 'linear';
            chartInstance[instanceNo].update();
            ylinlog[instanceNo] = false;
            button.innerHTML = 'Y Log';
        } else {
            chartInstance[instanceNo].options.scales.y.type = 'logarithmic';
            chartInstance[instanceNo].update();
            ylinlog[instanceNo] = true;
            button.innerHTML = 'Y Lin';
        }
    });
    container.appendChild(button);
}
    
// Function to create a button for toggling legend
function createStackedButton(chart,instanceNo) {
    const container = document.getElementById('chartContainer');
    const button = document.createElement('button');
    button.id = 'buttons'+instanceNo
    if (!stacked[instanceNo]) {
        button.textContent = 'Stack';
    } else {
        button.textContent = 'Unstack';
    }
    button.addEventListener('click', () => {
        if (stacked[instanceNo]) {
            chartInstance[instanceNo].options.scales.x.stacked = false;
            chartInstance[instanceNo].options.scales.y.stacked = false;
            chartInstance[instanceNo].update();
            stacked[instanceNo] = false;
            button.innerHTML = 'Stack';
        } else {
            chartInstance[instanceNo].options.scales.x.stacked = true;
            chartInstance[instanceNo].options.scales.y.stacked = true;
            chartInstance[instanceNo].update();
            stacked[instanceNo] = true;
            button.innerHTML = 'Unstack';
        }
//        chart.resetZoom();
    });
    container.appendChild(button);
}
    
function clearCanvasAndChart(canvas, chartInstanceNo) {
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (chartInstance[chartInstanceNo]) {
            chartInstance[chartInstanceNo].destroy();
            chartInstance[chartInstanceNo] = null;
        }
        /*            // Hide the canvas
                   const convas = document.getElementById("chart" + chartInstanceNo);
                convas.style.display = "none";*/
        // Remove the canvas
        const convas = document.getElementById("chart" + chartInstanceNo);
        convas.remove();
        // Remove all the buttons if created
        removeButtons(chartInstanceNo);
    }
}

function removeButtons(chartInstanceNo) {
//console.log(lastInstanceNo);
//console.log(chartInstanceNo);
    removeButton(chartInstanceNo, 'z');
    removeButton(chartInstanceNo, 'l');
    removeButton(chartInstanceNo, 'o');
    removeButton(chartInstanceNo, 's');
    removeButton(chartInstanceNo, 'c');    
    removeButton(chartInstanceNo, 'e');    
}

function removeButton(chartInstanceNo, buttonType) {
        // Remove a reset button if created
        const buttonToRemove = document.getElementById('button' + buttonType + chartInstanceNo);
        // Check if the button exists
        if (buttonToRemove) {
            // Remove the button
            buttonToRemove.remove();
//        } else {
//            console.log('Button ' + buttonType + ' not found', chartInstanceNo);
        }
}

function chemicalTypeHasData(sheetName) {
    chemicalTypeData = false;
    for (const ds in selectedSampleMeasurements) {
console.log(ds);
console.log(ds, sheetName);
        const chemicalTypes = Object.keys(selectedSampleMeasurements[ds]);
console.log(ds, sheetName, chemicalTypes);
        if (chemicalTypes.includes(sheetName)) {
            chemicalTypeData = true;
            return chemicalTypeData;
        }
    }
}

function filenameDisplay() {
    const fileDisplayDiv = document.getElementById("fileDisplay");
    // blank it each time
    fileDisplayDiv.innerHTML = "";

    iconNo = 0;
    const datesSampled = Object.keys(selectedSampleInfo);
    datesSampled.sort();
    datesSampled.forEach(dateSampled => {

//    for (dateSampled in selectedSampleInfo) {
        currentIcon = markerPath + markerPngs[iconNo];
        iconNo = (iconNo + 1) % 9;

        const fileURL = sampleInfo[dateSampled].fileURL;

        // Create an image element for the icon
        const iconElement = document.createElement("img");
        iconElement.src = currentIcon;
        iconElement.alt = "Marker Icon";
        iconElement.style.width = "20px"; // Adjust the width as needed

        // Create a link element for each file and append it to the div
        const linkElement = document.createElement("a");
        linkElement.href = fileURL;
        // console.log(fileURL);
        // console.log(dateSampled);
        positions = Object.keys(selectedSampleInfo[dateSampled].position);
        infos = '';
        for (dataType in selectedSampleMeasurements[dateSampled]) {
//console.log(dataType,dateSampled);
            if (dataType === 'Physical Data') {
                infos += `${dataSheetAbr[dataType]} `;
            } else {
                infos += `${Object.keys(selectedSampleMeasurements[dateSampled][dataType].chemicals).length}x${dataSheetAbr[dataType]}s `;
            }
        }
//        infos = 'PAH BDE OC OT PCB Phys TM';
        textElement1 = document.createTextNode(`${dateSampled} has ${positions.length} samples with ${infos}:`);
        textElement2 = document.createTextNode(`File `);
        linkElement.textContent = `${fileURL}`;
        linkElement.target = "_blank"; // Open link in a new tab/window

        // Append the icon before the link
        fileDisplayDiv.appendChild(iconElement);
        fileDisplayDiv.appendChild(textElement1);
        fileDisplayDiv.appendChild(document.createElement("br"));
        fileDisplayDiv.appendChild(textElement2);
        fileDisplayDiv.appendChild(linkElement);

        // Add a line break for better readability
        fileDisplayDiv.appendChild(document.createElement("br"));
    });
    fileDisplayDiv.style.display = 'none';
}

function toggleFileDisplay() {
    const fileDisplayDiv = document.getElementById("fileDisplay");
    if (fileDisplayDiv.style.display === 'block') {
        fileDisplayDiv.style.display = 'none';
    } else {
        fileDisplayDiv.style.display = 'block';
    }
}
