CEFASdata = {};
CEFASfile = {};
CEFASfilename = '';
CEFASUniqueRows = {};
ddLookup = {};
ddLookup.chemical = {'pcb101' : "2,2',4,5,5'-Pentachlorobiphenyl" , 'pcb105' : "2,3,3',4,4'-Pentachlorobiphenyl" , 'pcb110' : "2,3,3',4',6-Pentachlorobiphenyl" ,
    'pcb118' : "2,3',4,4',5-Pentachlorobiphenyl" , 'pcb128' : "2,2',3,3',4,4'-Hexachlorobiphenyl" , 'pcb138' : "2,2',3,4,4',5'-Hexachlorobiphenyl" , 
    'pcb141' : "2,2',3,4,5,5'-Hexachlorobiphenyl" , 'pcb149' : "2,2',3,4',5',6-Hexachlorobiphenyl" , 'pcb151' : "2,2',3,5,5',6-Hexachlorobiphenyl" ,
    'pcb153' : "2,2',4,4',5,5'-Hexachlorobiphenyl" , 'pcb156' : "2,3,3',4,4',5-Hexachlorobiphenyl" , 'pcb158' : "2,3,3',4,4',6-Hexachlorobiphenyl" ,
    'pcb170' : "2,2',3,3',4,4',5-Heptachlorobiphenyl" , 'pcb18' : "2,2',5- Trichlorobiphenyl" , 'pcb180' : "2,2',3,4,4',5,5'-Heptachlorobiphenyl" ,
    'pcb183' : "2,2',3,4,4',5',6-Heptachlorobiphenyl" , 'pcb187' : "2,2',3,4',5,5',6-Heptachlorobiphenyl" , 'pcb194' : "2,2',3,3',4,4',5,5'-Octachlorobiphenyl" ,
    'pcb28' : "2,4,4'-Trichlorobiphenyl" , 'pcb31' : "2,4',5-Trichlorobiphenyl" , 'pcb44' : "2,2',3,5'-Tetrachlorobiphenyl" ,
    'pcb47' : "2,2',4,4'-Tetrachlorobiphenyl" , 'pcb49' : "2,2',4,5'-Tetrachlorobiphenyl" , 'pcb52' : "2,2',5,5'-Tetrachlorobiphenyl" ,
    'pcb66' : "2,3',4,4'-Tetrachlorobiphenyl" , 'acenapth' : "Acenapthene" , 'acenapthylene' : "Acenapthylene" , 'anthracn' : "Anthracene" ,
    'baa' : "Benz[a]anthracene" , 'bap' : "Benzo[a]pyrene" , 'bbf' : "Benzo[b]fluoranthene" , 'benzghip' : "Benzo[g,h,i]perylene" , 'bep' : "Benzo[e]pyrene" ,
    'bkf' : "Benzo[k]fluoranthene" , 'c1n' : "C1-Napthalenes" , 'c1phen' : "C1-Phenanthrenes" , 'c2n' : "C2-Napthalenes" , 'c3n' : "C3-Napthalenes" ,
    'chrysene' : "Chrysene" , 'dibenzah' : "Dibenz[a,h]anthracene" , 'flurant' : "Fluoranthene" , 'fluorene' : "Fluorene" , 'indypr' : "Indeno[123-c,d]pyrene" ,
    'napth' : "Napthalene" , 'perylene' : "Perylene" , 'phenant' : "Phenanthrene" , 'pyrene' : "Pyrene" , 'thc' : "totalHC" ,
    'ahch' : "alpha-hexachlorocyclohexane (AHCH)" , 'bhch' : "beta-hexachlorocyclohexane (BHCH)" , 'ghch' : "gamma-hexachlorocyclohexane (GHCH)" ,
    'dieldrin' : "Dieldrin" , 'hcb' : "Hexachlorobenzene (HCB)" , 'dde' : "1,1-Dichloro-2,2-bis(p-chlorophenyl) ethylene (PPDDE)" ,
    'ddt' : "Dichlorodiphenyltrichloroethane (PPDDT)" , 'tde' : "1,1-dichloro-2,2-bis(p-chlorophenyl)ethane (PPTDE)" ,
    'bde100' : "2,2′,4,4′,6-penta-bromodiphenyl ether (BDE100)" , 'bde138' : "Hexabromodiphenyl ether (BDE138)" ,
    'bde153' : "2,2′,4,4′,5,5′-hexa-bromodiphenyl ether (BDE153)" , 'bde154' : "2,2′,4,4′,5,6′-hexa-bromodiphenyl ether (BDE154)" ,
    'bde17' : "2,2´,4-tri-bromodiphenylether (BDE17)" , 'bde183' : "2,2′,3,4,4′,5′,6-heptabromodiphenyl ether (BDE183)" ,
    'bde28' : "2,4,4'-tribromodiphenyl ether (BDE28)" , 'bde47' : "2,2′,4,4′-Tetrabromodiphenyl ether (BDE47)" ,
    'bde66' : "2,3',4,4'-Tetrabromodiphenyl ether (BDE66)" , 'bde85' : "2,2',3,4,4'-Pentabromodiphenyl ether (BDE85)" ,
    'bde99' : "2,2',4,4',5-pentabromodiphenyl ether (BDE99)", 'bde209' : "2,2',3,3',4,4',5,5',6,6'-decabrominated diphenyl ether (BDE 209)" ,
    'dbt' : "Dibutyltine (DBT)" , 'tbt' : "Tributyltin (TBT)" , 'as' : "Arsenic (As)" , 'cd' : "Cadmium (Cd)" , 'cr' : "Chromium (Cr)" , 'cu' : "Copper (Cu)" ,
    'hg' : "Mercury (Hg)" , 'ni' : "Nickel (Ni)" , 'pb' : "Lead (Pb)" , 'zn' : "Zinc (Zn)" };
ddLookup.sheet = {'pcb101' : "PCB data" , 'pcb105' : "PCB data" , 'pcb110' : "PCB data" , 'pcb118' : "PCB data" , 'pcb128' : "PCB data" , 'pcb138' : "PCB data" ,
        'pcb141' : "PCB data" , 'pcb149' : "PCB data" , 'pcb151' : "PCB data" , 'pcb153' : "PCB data" , 'pcb156' : "PCB data" , 'pcb158' : "PCB data" ,
        'pcb170' : "PCB data" , 'pcb18' : "PCB data" , 'pcb180' : "PCB data" , 'pcb183' : "PCB data" , 'pcb187' : "PCB data" , 'pcb194' : "PCB data" ,
        'pcb28' : "PCB data" , 'pcb31' : "PCB data" , 'pcb44' : "PCB data" , 'pcb47' : "PCB data" , 'pcb49' : "PCB data" , 'pcb52' : "PCB data" ,
        'pcb66' : "PCB data" , 'acenapth' : "PAH data" , 'acenapthylene' : "PAH data" , 'anthracn' : "PAH data" , 'baa' : "PAH data" , 'bap' : "PAH data" ,
        'bbf' : "PAH data" , 'benzghip' : "PAH data" , 'bep' : "PAH data" , 'bkf' : "PAH data" , 'c1n' : "PAH data" , 'c1phen' : "PAH data" , 'c2n' : "PAH data" ,
        'c3n' : "PAH data" , 'chrysene' : "PAH data" , 'dibenzah' : "PAH data" , 'flurant' : "PAH data" , 'fluorene' : "PAH data" , 'indypr' : "PAH data" ,
        'napth' : "PAH data" , 'perylene' : "PAH data" , 'phenant' : "PAH data" , 'pyrene' : "PAH data" , 'thc' : "PAH data" , 'ahch' : "Organochlorine data" ,
        'bhch' : "Organochlorine data" , 'ghch' : "Organochlorine data" , 'dieldrin' : "Organochlorine data" , 'hcb' : "Organochlorine data" ,
        'dde' : "Organochlorine data" , 'ddt' : "Organochlorine data" , 'tde' : "Organochlorine data" , 'bde100' : "BDE data" , 'bde138' : "BDE data" ,
        'bde153' : "BDE data" , 'bde154' : "BDE data" , 'bde17' : "BDE data" , 'bde183' : "BDE data" , 'bde28' : "BDE data" , 'bde47' : "BDE data" ,
        'bde66' : "BDE data" , 'bde85' : "BDE data" , 'bde99' : "BDE data" , 'bde209' : "BDE data", 'dbt' : "Organotins data" , 'tbt' : "Organotins data" ,
        'as' : "Trace metal data" , 'cd' : "Trace metal data" , 'cr' : "Trace metal data" , 'cu' : "Trace metal data" , 'hg' : "Trace metal data" ,
        'ni' : "Trace metal data" , 'pb' : "Trace metal data" , 'zn' : "Trace metal data"};

//BDE209 missing from original dataset
//ddLookup.chemical['BDE#209']="2,2',3,3',4,4',5,5',6,6'-decabrominateddiphenylether (BDE209)";
//[A-Z]{3}\_[0-9]{4}\_[0-9]{5}
//ddLookup.sheet['BDE#209']="BDE data";

ddCorrection = {'Trace metal data' : 1,'PAH data' : 1,'PCB data' : 0.001,'BDE data' : 0.001,'Organotins data' : 0.001,'Organochlorine data' : 0.001};

CEFASconcentration='concentration';
CEFASlatitude = 'lat';
CEFASlongitude = 'lon';
CEFASmla = 'ml_application';
CEFASchemical = 'parameter_measured';
CEFASsampledate = 'sample_date_collection';
CEFASdepth = 'sample_depth';
CEFASsamplename = 'sample_reference';

everything = {};

function importDredgeData(url,centreLat,centreLon,radius,startDate,finishDate,licences) {
//    var urls = {};
    if (url === undefined) {
        const fileInputDD = document.getElementById('fileInputDD');
        const urlInputDD = document.getElementById('urlInputDD');
        files = fileInputDD.files; // Files is now a FileList object containing multiple files
        //console.log(files);
        //    urls = urlInputDD.value.trim().split(',').map(url => url.trim()); // Split comma-separated URLs
        url = urlInputDD.value;
    }
    if (files.length === 0 && url === undefined) {
        alert('Please select files or enter URLs.');
        return;
    }
    // Process files
    if (files.length > 0) {
        let filesProcessed = 0; // counter to track the number of files processed
        let fL = files.length;
        console.log(files.length);
        for (let i = 0; i < files.length; i++) {
            CEFASfilename = files[i].name;
            const reader = new FileReader();
            reader.onload = function (e) {
                data = new Uint8Array(e.target.result);
                filesProcessed++; // Increment the counter after processing each file
                ret = loadDredgeData(data);
                CEFASdata = ret['df'];
                CEFASUniqueRows = ret['uniqueRows'];
            };
            reader.readAsArrayBuffer(files[i]);
        }
    }
//    if (urls.length > 0) {
    if (!(url  === undefined)) {
            // Array to store all fetch promises
        const fetchPromises = [];

//        urls.forEach(url => {
console.log(url);
            // Check if the URL is a valid URL before fetching
            if (!/^https?:\/\//i.test(url)) {
                console.error('Invalid URL:', url);
                return;
            }
            CEFASfilename = url;

            function disableUserInteraction(fileName) {
                const overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.style.position = 'fixed';
                overlay.style.top = 0;
                overlay.style.left = 0;
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                overlay.style.zIndex = 1000;
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.innerHTML = '<p style="color: white; font-size: 20px; text-align: center">Loading <br>' + fileName + '<br>...</p>';
                document.body.appendChild(overlay);
            }
            
            // Function to enable user interaction
            function enableUserInteraction() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) {
                    overlay.remove();
                }
            }
            
            // Disable user interaction
            disableUserInteraction(url);

            // Push each fetch promise into the array
            fetchPromises.push(
                fetch(url)
                    .then(response => response.arrayBuffer())
                    .then(data => {
//                        var data = new Uint8Array(e.target.result);
//                        ret = loadDredgeData(data);
                        ret = loadDredgeData(new Uint8Array(data));
                        CEFASdata = ret['df'];
                        CEFASUniqueRows = ret['uniqueRows'];
                    })
                    .catch(error => {
                        console.error('Error fetching the DD file:', error);
                    })
            );
        Promise.all(fetchPromises)
        .then(() => {
//console.log(startDate,finishDate);
            if (centreLat && centreLon && radius) {
                if (!(startDate || finishDate)) {
//console.log('settting invalid date');
                    startDate = 'Invalid Date';
                    finishDate = 'Invalid Date';
                }
                closeCEFASSearch(centreLat,centreLon,radius,startDate,finishDate);
            }
            if(licences) {
                closeCEFASSelection(dlicences);
            }
            enableUserInteraction();
//console.log('there again');
        })
        .catch(error => {
            console.error('Error in Promise.all:', error);
            // Ensure user interaction is enabled in case of error
            enableUserInteraction();
        });
    }
    fileInputDD.value = '';
    urlInputDD.value = '';
}

function loadDredgeData(data) {
    const workbook = XLSX.read(data, { type: 'array' });
    //everything = workbook;        
    sheetData = workbook.Sheets['Dredge Contaminant Seabed Data '];
    let uniqueRows = [];
    let uniqueDatasets = [];
    let uniqueMLAs = [];
    let noMLAs = 0;
    const df = XLSX.utils.sheet_to_json(sheetData, { cellText: true });
    console.log(df);
    df.forEach(row => {
        let mlaLicense = row[CEFASmla];
        let mlaDate = row[CEFASsampledate];
        let mlaName = mlaLicense + mlaDate;
        if (mlaName && !uniqueDatasets[mlaName]) {
            uniqueDatasets[mlaName] = true;
            if (mlaLicense && !uniqueMLAs[mlaLicense]) {
                uniqueMLAs[mlaLicense] = true;
                noMLAs += 1;
            }
            uniqueRows.push(row);
        }
    });
    sedDredgeDataDisplay(noMLAs,uniqueRows.length);
    return {df,uniqueRows};
}

function processDDExcelData(data, url, mlaInput) {
    console.log('processexceldata', url);
    sheetData = data;
//console.log(mlaInput);
    if (mlaInput === undefined || mlaInput === null) {
        mlaReturn = document.getElementById('mlApplications');
        mlaInput = mlaReturn.value;
    }
//console.log(mlaInput);
    mlas = mlaInput.trim().split(',').map(mla => mla.trim()); // Split comma-separated URLs
    if (mlas.length > 0) {
        mlas.forEach(mlApplication => {
            extractDataFromSheet(sheetData, mlApplication);
        });
    }
    //    dateAnalysed = extractDataFromSheet();
    selectedSampleInfo = sampleInfo;
    selectedSampleMeasurements = sampleMeasurements;
    updateChart();
}
    
function extractDataFromSheet(sheetData, mlApplication) {
    df = sheetData;
    testAll = df.filter(row => row[CEFASmla] && row[CEFASmla].includes(mlApplication));
    console.log(testAll);
    console.log('length testAll', testAll.length);
    let uniqueSamples = {};
    let uniqueRows = [];
    let testBits = {};
    testAll.forEach(row => {
        let sampleDate = parseDates(row[CEFASsampledate]);
        let applicationNo = row[CEFASmla];
        let dateSampled = sampleDate + ' d ' + applicationNo;
        if (!(dateSampled in testBits)) {
            testBits[dateSampled] = [];
        }
        testBits[dateSampled].push(row);
    });
    console.log(testBits);
    for (dateSampled in testBits) {
        testDD = testBits[dateSampled];
        testDD.forEach(row => {
            let sampleName = row[CEFASsamplename];
            if (sampleName && !uniqueSamples[sampleName]) {
                uniqueSamples[sampleName] = true;
                uniqueRows.push(row);
            }
        });
        sampleDate = parseDates(uniqueRows[0][CEFASsampledate]);
        applicationNo = uniqueRows[0][CEFASmla];
        console.log(dateSampled);
        sampleInfo[dateSampled] = {};
        sampleInfo[dateSampled]['Date Sampled'] = sampleDate;
        sampleInfo[dateSampled]['Application number'] = applicationNo;
        sampleInfo[dateSampled]['fileURL'] = CEFASfilename;
        sampleInfo[dateSampled].position = {};
        sampleInfo[dateSampled].label = dateSampled;
        uniqueRows.forEach(row => {
            sampleInfo[dateSampled].position[row[CEFASsamplename]] = {
                'Position latitude': row[CEFASlatitude], 'Position longitude': row[CEFASlongitude],
                'Sampling depth (m)': row[CEFASdepth]
            };
        });
        let meas = {};
        if (!(dateSampled in sampleMeasurements)) {
            meas = {};
        } else {
            meas = sampleMeasurements[dateSampled];
        };
        everything = testDD;
        testDD.forEach(row => {
            let chemicalAbr = row[CEFASchemical].trim();
            let sheetName = '';
            if (chemicalAbr in ddLookup.sheet) {
                let chemicalName = ddLookup.chemical[chemicalAbr];
                let sample = row[CEFASsamplename];
                if (chemicalName === 'totalHC') {
                    sheetName = 'PAH data';
                } else {
                    sheetName = ddLookup.sheet[chemicalAbr];
                }
                let concentration = parseFloat(row[CEFASconcentration]) * ddCorrection[sheetName];
                if (concentration === undefined) {
                    concentration = 0.0;
                }
                if (!(sheetName in meas)) {
                    meas[sheetName] = {};
                    meas[sheetName].chemicals = {};
                    meas[sheetName].total = {};
                    //Populate chemicals as data could be missing some chemicals
                    expectedChemicals = Object.keys(ddLookup.sheet).filter(key => ddLookup.sheet[key] === sheetName);

                    for (let i = 0; i < expectedChemicals.length; i++) {
                        meas[sheetName].chemicals[ddLookup.chemical[expectedChemicals[i]]] = {};
                        meas[sheetName].chemicals[ddLookup.chemical[expectedChemicals[i]]].samples = {};
                    }
                }
                if (chemicalName === 'totalHC') {
                    if (!('totalHC' in meas[sheetName])) {
                        meas[sheetName].totalHC = {};
                    }
                    meas[sheetName].totalHC[sample] = concentration;
                } else {
                    if (!(chemicalName in meas[sheetName].chemicals)) {
                        meas[sheetName].chemicals[chemicalName] = {};
                        meas[sheetName].chemicals[chemicalName].samples = {};
                    }
                    if (!(sample in meas[sheetName].total)) {
                        meas[sheetName].total[sample] = 0;
                    }
                    meas[sheetName].chemicals[chemicalName].samples[sample] = concentration;
                    meas[sheetName].total[sample] += concentration;
                }
            }
        });
        sampleMeasurements[dateSampled] = meas;
        for (const sheetName in meas) {
            if (sheetName === 'PAH data') {
//console.log(meas[sheetName]);
                pahPostProcess(meas[sheetName], dateSampled);
//console.log(sampleMeasurements[dateSampled][sheetName]);
            }
            if (sheetName === 'PCB data') {
                pcbPostProcess(meas[sheetName], dateSampled);
            }
        }
    }
}

function openCEFASSelection() {
    const sedDataModal = document.getElementById('sedDataModal');
    sedDataModal.style.display = 'block';
}

function closeCEFASSelection(licences) {
    const sedDataModal = document.getElementById('sedDataModal');
    sedDataModal.style.display = 'none';
    processDDExcelData(CEFASdata,CEFASfile,licences);
}

function closeCEFASSearch(centreLat,centreLon,radius,startDate,finishDate) {
    const isBetweenDates = (dateStart, dateEnd, date) =>
        date > dateStart && date < dateEnd;
    const sedDataModal = document.getElementById('sedDataModal');
    sedDataModal.style.display = 'none';
    if (!(centreLat && centreLon && radius)) {
        centreLat = parseFloat(document.getElementById('centreLatitude').value);
        centreLon = parseFloat(document.getElementById('centreLongitude').value);
        radius = parseFloat(document.getElementById('radius').value);
        startDate = new Date(document.getElementById('startDate').value);
        finishDate = new Date(document.getElementById('finishDate').value);
    }
    mlas = [];
    uniqueRows = CEFASUniqueRows;
//console.log(uniqueRows);
    uniqueRows.forEach(row => {
        samplingDate = new Date(parseDates(row[CEFASsampledate])[0]);
        sampleLat = row[CEFASlatitude];
        sampleLon = row[CEFASlongitude];
        distance = 1000 * haversineDistance(sampleLat, sampleLon, centreLat, centreLon);
        if (distance <= radius) {
//console.log(startDate);
            if(startDate.toString() === 'Invalid Date' || finishDate.toString() === 'Invalid Date'){
//console.log('Pushing Invalid Date');
                mlas.push(row[CEFASmla]);
            } else {
                if (isBetweenDates(startDate,finishDate,samplingDate)){
                    mlas.push(row[CEFASmla]);
                }
            }
        }
    });
console.log(mlas);
    if (mlas.length > 0) {
        mlas.forEach(mlApplication => {
//console.log(mlApplication);
            extractDataFromSheet(CEFASdata, mlApplication);
        });
        selectedSampleInfo = sampleInfo;
        selectedSampleMeasurements = sampleMeasurements;
        updateChart();
    }
}

function sedDredgeDataDisplay(noMLAs,noDatasets) {
    const sedDDDisplayDiv = document.getElementById("sedDredgeData");
    // blank it each time
    sedDDDisplayDiv.innerHTML = "";
    var countNode = document.createTextNode(`${noMLAs} marine applications available`);
    sedDDDisplayDiv.appendChild(countNode);
    // Add a line break for better readability
    sedDDDisplayDiv.appendChild(document.createElement("br"));
    var countNode = document.createTextNode(`${noDatasets} marine datasets available`);
    sedDDDisplayDiv.appendChild(countNode);
    // Add a line break for better readability
    sedDDDisplayDiv.appendChild(document.createElement("br"));
    sedDDDisplayDiv.style.display = 'block';
}

