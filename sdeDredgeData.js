CEFASdata = {};
CEFASfile = {};
CEFASfilename = '';
CEFASUniqueRows = {};
ddLookup = {};
ddLookup.chemical = {};
ddLookup.sheet = {};
ddLookup.chemical['pcb101']="2,2',4,5,5'-Pentachlorobiphenyl";
ddLookup.chemical['pcb105']="2,3,3',4,4'-Pentachlorobiphenyl";
ddLookup.chemical['pcb110']="2,3,3',4',6-Pentachlorobiphenyl";
ddLookup.chemical['pcb118']="2,3',4,4',5-Pentachlorobiphenyl";
ddLookup.chemical['pcb128']="2,2',3,3',4,4'-Hexachlorobiphenyl";
ddLookup.chemical['pcb138']="2,2',3,4,4',5'-Hexachlorobiphenyl";
ddLookup.chemical['pcb141']="2,2',3,4,5,5'-Hexachlorobiphenyl";
ddLookup.chemical['pcb149']="2,2',3,4',5',6-Hexachlorobiphenyl";
ddLookup.chemical['pcb151']="2,2',3,5,5',6-Hexachlorobiphenyl";
ddLookup.chemical['pcb153']="2,2',4,4',5,5'-Hexachlorobiphenyl";
ddLookup.chemical['pcb156']="2,3,3',4,4',5-Hexachlorobiphenyl";
ddLookup.chemical['pcb158']="2,3,3',4,4',6-Hexachlorobiphenyl";
ddLookup.chemical['pcb170']="2,2',3,3',4,4',5-Heptachlorobiphenyl";
ddLookup.chemical['pcb18']="2,2',5- Trichlorobiphenyl";
ddLookup.chemical['pcb180']="2,2',3,4,4',5,5'-Heptachlorobiphenyl";
ddLookup.chemical['pcb183']="2,2',3,4,4',5',6-Heptachlorobiphenyl";
ddLookup.chemical['pcb187']="2,2',3,4',5,5',6-Heptachlorobiphenyl";
ddLookup.chemical['pcb194']="2,2',3,3',4,4',5,5'-Octachlorobiphenyl";
ddLookup.chemical['pcb28']="2,4,4'-Trichlorobiphenyl";
ddLookup.chemical['pcb31']="2,4',5-Trichlorobiphenyl";
ddLookup.chemical['pcb44']="2,2',3,5'-Tetrachlorobiphenyl";
ddLookup.chemical['pcb47']="2,2',4,4'-Tetrachlorobiphenyl";
ddLookup.chemical['pcb49']="2,2',4,5'-Tetrachlorobiphenyl";
ddLookup.chemical['pcb52']="2,2',5,5'-Tetrachlorobiphenyl";
ddLookup.chemical['pcb66']="2,3',4,4'-Tetrachlorobiphenyl";
ddLookup.chemical['acenapth']="Acenapthene";
ddLookup.chemical['acenapthylene']="Acenapthylene";
ddLookup.chemical['anthracn']="Anthracene";
ddLookup.chemical['baa']="Benz[a]anthracene";
ddLookup.chemical['bap']="Benzo[a]pyrene";
ddLookup.chemical['bbf']="Benzo[b]fluoranthene";
ddLookup.chemical['benzghip']="Benzo[g,h,i]perylene";
ddLookup.chemical['bep']="Benzo[e]pyrene";
ddLookup.chemical['bkf']="Benzo[k]fluoranthene";
ddLookup.chemical['c1n']="C1-Napthalenes";
ddLookup.chemical['c1phen']="C1-Phenanthrenes";
ddLookup.chemical['c2n']="C2-Napthalenes";
ddLookup.chemical['c3n']="C3-Napthalenes";
ddLookup.chemical['chrysene']="Chrysene";
ddLookup.chemical['dibenzah']="Dibenz[a,h]anthracene";
ddLookup.chemical['flurant']="Fluoranthene";
ddLookup.chemical['fluorene']="Fluorene";
ddLookup.chemical['indypr']="Indeno[123-c,d]pyrene";
ddLookup.chemical['napth']="Napthalene";
ddLookup.chemical['perylene']="Perylene";
ddLookup.chemical['phenant']="Phenanthrene";
ddLookup.chemical['pyrene']="Pyrene";
ddLookup.chemical['thc']="totalHC";
ddLookup.chemical['ahch']="alpha-hexachlorocyclohexane (AHCH)";
ddLookup.chemical['bhch']="beta-hexachlorocyclohexane (BHCH)";
ddLookup.chemical['ghch']="gamma-hexachlorocyclohexane (GHCH)";
ddLookup.chemical['dieldrin']="Dieldrin";
ddLookup.chemical['hcb']="Hexachlorobenzene (HCB)";
ddLookup.chemical['dde']="1,1-Dichloro-2,2-bis (p-chlorophenyl)ethylene (PPDDE)";
ddLookup.chemical['ddt']="Dichlorodiphenyltrichloroethane (PPDDT)";
ddLookup.chemical['tde']="1,1-dichloro-2,2-bis (p-chlorophenyl)ethane (PPTDE)";
ddLookup.chemical['bde100']="2,2′,4,4′,6-penta-bromodiphenylether (BDE100)";
ddLookup.chemical['bde138']="Hexabromodiphenylether (BDE138)";
ddLookup.chemical['bde153']="2,2′,4,4′,5,5′-hexa-bromodiphenylether (BDE153)";
ddLookup.chemical['bde154']="2,2′,4,4′,5,6′-hexa-bromodiphenylether (BDE154)";
ddLookup.chemical['bde17']="2,2´,4-tri-bromodiphenylether (BDE17)";
ddLookup.chemical['bde183']="2,2′,3,4,4′,5′,6-heptabromodiphenylether (BDE183)";
//ddLookup.chemical['BDE#209']="2,2',3,3',4,4',5,5',6,6'-decabrominateddiphenylether (BDE209)";
ddLookup.chemical['bde28']="2,4,4'-tribromodiphenylether (BDE28)";
ddLookup.chemical['bde47']="2,2′,4,4′-Tetrabromodiphenylether (BDE47)";
ddLookup.chemical['bde66']="2,3',4,4'-Tetrabromodiphenylether (BDE66)";
ddLookup.chemical['bde85']="2,2',3,4,4'-Pentabromodiphenylether (BDE85)";
ddLookup.chemical['bde99']="2,2',4,4',5-pentabromodiphenylether (BDE99)";
ddLookup.chemical['dbt']="Dibutyltine (DBT)";
ddLookup.chemical['tbt']="Tributyltin (TBT)";
ddLookup.chemical['as']="Arsenic (As)";
ddLookup.chemical['cd']="Cadmium (Cd)";
ddLookup.chemical['cr']="Chromium (Cr)";
ddLookup.chemical['cu']="Copper (Cu)";
ddLookup.chemical['hg']="Mercury (Hg)";
ddLookup.chemical['ni']="Nickel (Ni)";
ddLookup.chemical['pb']="Lead (Pb)";
ddLookup.chemical['zn']="Zinc (Zn)";
ddLookup.sheet['pcb101']="PCB data";
ddLookup.sheet['pcb105']="PCB data";
ddLookup.sheet['pcb110']="PCB data";
ddLookup.sheet['pcb118']="PCB data";
ddLookup.sheet['pcb128']="PCB data";
ddLookup.sheet['pcb138']="PCB data";
ddLookup.sheet['pcb141']="PCB data";
ddLookup.sheet['pcb149']="PCB data";
ddLookup.sheet['pcb151']="PCB data";
ddLookup.sheet['pcb153']="PCB data";
ddLookup.sheet['pcb156']="PCB data";
ddLookup.sheet['pcb158']="PCB data";
ddLookup.sheet['pcb170']="PCB data";
ddLookup.sheet['pcb18']="PCB data";
ddLookup.sheet['pcb180']="PCB data";
ddLookup.sheet['pcb183']="PCB data";
ddLookup.sheet['pcb187']="PCB data";
ddLookup.sheet['pcb194']="PCB data";
ddLookup.sheet['pcb28']="PCB data";
ddLookup.sheet['pcb31']="PCB data";
ddLookup.sheet['pcb44']="PCB data";
ddLookup.sheet['pcb47']="PCB data";
ddLookup.sheet['pcb49']="PCB data";
ddLookup.sheet['pcb52']="PCB data";
ddLookup.sheet['pcb66']="PCB data";
ddLookup.sheet['acenapth']="PAH data";
ddLookup.sheet['acenapthylene']="PAH data";
ddLookup.sheet['anthracn']="PAH data";
ddLookup.sheet['baa']="PAH data";
ddLookup.sheet['bap']="PAH data";
ddLookup.sheet['bbf']="PAH data";
ddLookup.sheet['benzghip']="PAH data";
ddLookup.sheet['bep']="PAH data";
ddLookup.sheet['bkf']="PAH data";
ddLookup.sheet['c1n']="PAH data";
ddLookup.sheet['c1phen']="PAH data";
ddLookup.sheet['c2n']="PAH data";
ddLookup.sheet['c3n']="PAH data";
ddLookup.sheet['chrysene']="PAH data";
ddLookup.sheet['dibenzah']="PAH data";
ddLookup.sheet['flurant']="PAH data";
ddLookup.sheet['fluorene']="PAH data";
ddLookup.sheet['indypr']="PAH data";
ddLookup.sheet['napth']="PAH data";
ddLookup.sheet['perylene']="PAH data";
ddLookup.sheet['phenant']="PAH data";
ddLookup.sheet['pyrene']="PAH data";
ddLookup.sheet['thc']="PAH data";
ddLookup.sheet['ahch']="Organochlorine data";
ddLookup.sheet['bhch']="Organochlorine data";
ddLookup.sheet['ghch']="Organochlorine data";
ddLookup.sheet['dieldrin']="Organochlorine data";
ddLookup.sheet['hcb']="Organochlorine data";
ddLookup.sheet['dde']="Organochlorine data";
ddLookup.sheet['ddt']="Organochlorine data";
ddLookup.sheet['tde']="Organochlorine data";
ddLookup.sheet['bde100']="BDE data";
ddLookup.sheet['bde138']="BDE data";
ddLookup.sheet['bde153']="BDE data";
ddLookup.sheet['bde154']="BDE data";
ddLookup.sheet['bde17']="BDE data";
ddLookup.sheet['bde183']="BDE data";
//ddLookup.sheet['BDE#209']="BDE data";
ddLookup.sheet['bde28']="BDE data";
ddLookup.sheet['bde47']="BDE data";
ddLookup.sheet['bde66']="BDE data";
ddLookup.sheet['bde85']="BDE data";
ddLookup.sheet['bde99']="BDE data";
ddLookup.sheet['dbt']="Organotins data";
ddLookup.sheet['tbt']="Organotins data";
ddLookup.sheet['as']="Trace metal data";
ddLookup.sheet['cd']="Trace metal data";
ddLookup.sheet['cr']="Trace metal data";
ddLookup.sheet['cu']="Trace metal data";
ddLookup.sheet['hg']="Trace metal data";
ddLookup.sheet['ni']="Trace metal data";
ddLookup.sheet['pb']="Trace metal data";
ddLookup.sheet['zn']="Trace metal data";

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

function importDredgeData(url,centreLat,centreLon,radius,startDate,finishDate) {
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
//console.log('there again');
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
    let uniqueMLAs = [];
    const df = XLSX.utils.sheet_to_json(sheetData, { cellText: true });
    console.log(df);
    df.forEach(row => {
        let mlaName = row[CEFASmla];
        if (mlaName && !uniqueMLAs[mlaName]) {
//console.log('found a unique one ', mlaName);
            uniqueMLAs[mlaName] = true;
            uniqueRows.push(row);
        }
    });
    sedDredgeDataDisplay(uniqueRows.length);
    return {df,uniqueRows};
}

        function processDDExcelData(data, url) {
    console.log('processexceldata', url);
sheetData = data;
    const mlaInput = document.getElementById('mlApplications');
    mlas = mlaInput.value.trim().split(',').map(mla => mla.trim()); // Split comma-separated URLs
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
    testDD = df.filter(row => row[CEFASmla] && row[CEFASmla].includes(mlApplication));
    let uniqueSamples = {};
    let uniqueRows = [];

    testDD.forEach(row => {
        let sampleName = row[CEFASsamplename];
        if (sampleName && !uniqueSamples[sampleName]) {
            uniqueSamples[sampleName] = true;
            uniqueRows.push(row);
        }
    });
    //console.log(uniqueRows);
    sampleDate = parseDates(uniqueRows[0][CEFASsampledate]);
    dateSampled = sampleDate + ' ' + uniqueRows[0][CEFASmla];
//console.log(dateSampled);
    sampleInfo[dateSampled] = {};
    sampleInfo[dateSampled]['Date Sampled'] = sampleDate;
    sampleInfo[dateSampled]['fileURL'] = CEFASfilename;
    sampleInfo[dateSampled].position = {};
    uniqueRows.forEach(row => {
        sampleInfo[dateSampled].position[row[CEFASsamplename]] = { 'Position latitude': row[CEFASlatitude], 'Position longitude': row[CEFASlongitude],
             'Sampling depth (m)': row[CEFASdepth] };
    });
    if (!(dateSampled in sampleMeasurements)) {
        meas = {};
    } else {
        meas = sampleMeasurements[dateSampled];
    };
    everything = testDD;
    //meas = {};
    testDD.forEach(row => {
        chemicalAbr = row[CEFASchemical].trim();
        if (chemicalAbr in ddLookup.sheet) {
            sheetName = ddLookup.sheet[chemicalAbr];
            chemicalName = ddLookup.chemical[chemicalAbr];
            sample = row[CEFASsamplename];
            concentration = parseFloat(row[CEFASconcentration]) * ddCorrection[sheetName];
            if (!(sheetName in meas)) {
                meas[sheetName] = {};
                meas[sheetName].chemicals = {};
                meas[sheetName].total = {};
            }
            if (chemicalName === 'totalHC') {
                if(!('totalHC' in meas[sheetName])) {
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
            pahPostProcess(meas[sheetName]);
        }
        if (sheetName === 'PCB data') {
            pcbPostProcess(meas[sheetName]);
        }
    }
    // Read in date of analysis
    //        console.log('df ', df);
}

function openCEFASSelection() {
    const sedDataModal = document.getElementById('sedDataModal');
    sedDataModal.style.display = 'block';
}

function closeCEFASSelection() {
    const sedDataModal = document.getElementById('sedDataModal');
    sedDataModal.style.display = 'none';
    processDDExcelData(CEFASdata,CEFASfile);
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

function sedDredgeDataDisplay(noMLAs) {
    const sedDDDisplayDiv = document.getElementById("sedDredgeData");
    // blank it each time
    sedDDDisplayDiv.innerHTML = "";
    var countNode = document.createTextNode(`${noMLAs} marine applications available`);
    sedDDDisplayDiv.appendChild(countNode);
        // Add a line break for better readability
        sedDDDisplayDiv.appendChild(document.createElement("br"));
    sedDDDisplayDiv.style.display = 'block';
}

