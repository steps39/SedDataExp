standards = 
{
    "Cefas Action Levels": {
        "unit": "mg/kg dry weight",
        "levels": {
            "Names": ["Action Level 1", "Action Level 2"],
            "abbrev": ["AL1", "AL2"]
        },
        "chemicals": {
            "Arsenic (As)": [30, 100],
            "Cadmium (Cd)": [0.4, 5],
            "Chromium (Cr)": [40, 400],
            "Copper (Cu)": [40, 400],
            "Lead (Pb)": [50, 500],
            "Mercury (Hg)": [0.3, 3],
            "Nickel (Ni)": [20, 200],
            "Zinc (Zn)": [130, 800],
            "Fluoranthene": [0.6, 5.1],
            "All PAHs": [0.1, null],
            "All Organotins": [0.1, 1],
            "ICES7 PCBs": {
                "levels": [0.01, null],
                "definition": [
                    "2,2',5,5'-Tetrachlorobiphenyl",
                    "2,4,4'-Trichlorobiphenyl",
                    "2,2',3,4,4',5,5'-Heptachlorobiphenyl",
                    "2,2',4,4',5,5'-Hexachlorobiphenyl",
                    "2,2',3,4,4',5'-Hexachlorobiphenyl",
                    "2,3',4,4',5-Pentachlorobiphenyl",
                    "2,2',4,5,5'-Pentachlorobiphenyl"
                ],
            },
            "Total PCB data": {
                "levels": [0.02, 0],
                "definition": "Total PCBs (Sum of 22)",
            },
            "Total PAH data": {
                "levels": [0.1, null],
                "definition": "Total PAHs (Sum of 25)",
            }
        }
    },
}
/*    "Candian Quality Guidelines": {
        "unit": "mg/kg dry weight",
        "noLevels": 2,
        "levels": {
            "names": ["Threshold Effect Level", "Probable Effect Level"],
            "abbrev": ["TEL", "PEL"],
        },
        "chemicals": {
            "Arsenic": [7.24, 41.6],
            "Cadmium": [0.68, 4.21],
            "Chromium": [52.3, 160],
            "Copper": [18.7, 108],
            "Lead": [30.2, 112],
            "Mercury": [0.13, 0.7],
            "Nickel": [15.9, 42],
            "Zinc": [124, 271],
            "Fluoranthene": [0.6, 5.1],
            "Benzo(a)pyrene": [0.21, 1],
            "Phenanthrene": [1.73, 8.7],
            "Pyrene": [1.58, 5.3],
            "Chrysene": [0.63, 2.5],
            "Dibenzo(a,h)anthracene": [0.13, 0.64],
            "Benzo(b)fluoranthene": [0.39, 2.1],
            "Benzo(k)fluoranthene": [0.25, 1.4],
            "Indeno(1,2,3-cd)pyrene": [0.25, 1],
            "Total PCBs (Aroclor 1260)": [0.0227, 0.18]
        },
        "sums": {
            "Total PCBs": {
                "definition": "Total PCBs (Aroclor 1260)",
                "levels": [0.0227, 0.18]
            }
        }
    },

    "German North Sea Guiding Values":{
        "unit": "mg/kg dry weight",
        "noLevels": 2,
        "levels": {
            "names": ["Guiding Value 1", "Guiding Value 2"],
            "abbrev": ["GV1", "GV2"]
        },
        "chemicals": {
            "Arsenic (As)": [20, 50],
            "Cadmium (Cd)": [0.5, 3],
            "Chromium (Cr)": [90, 300],
            "Copper (Cu)": [40, 400],
            "Lead (Pb)": [50, 200],
            "Mercury (Hg)": [0.3, 3],
            "Nickel (Ni)": [30, 75],
            "Zinc (Zn)": [150, 600],
            "Fluoranthene": [0.6, 5.1],
            "Benzo(a)pyrene": [0.21, 1],
            "Phenanthrene": [1.73, 8.7],
            "Pyrene": [1.58, 5.3],
            "Chrysene": [0.63, 2.5],
            "Dibenzo(a,h)anthracene": [0.13, 0.64],
            "Benzo(b)fluoranthene": [0.39, 2.1],
            "Benzo(k)fluoranthene": [0.25, 1.4],
            "Indeno(1,2,3-cd)pyrene": [0.25, 1],
            "2,2',5,5'-Tetrachlorobiphenyl": [0.01, 0.1],
            "2,4,4'-Trichlorobiphenyl": [0.01, 0.1],
            "2,2',3,4,4',5,5'-Heptachlorobiphenyl": [0.01, 0.1],
            "2,2',4,4',5,5'-Hexachlorobiphenyl": [0.01, 0.1],
            "2,2',3,4,4',5'-Hexachlorobiphenyl": [0.01, 0.1],
            "2,3',4,4',5-Pentachlorobiphenyl": [0.04, 0.08],
            "2,2',4,5,5'-Pentachlorobiphenyl": [0.04, 0.08]
        },
        "sums": {
            "PCBs (Sum of 7 congeners)": {
                "definition": [
                    "2,2',5,5'-Tetrachlorobiphenyl",
                    "2,4,4'-Trichlorobiphenyl",
                    "2,2',3,4,4',5,5'-Heptachlorobiphenyl",
                    "2,2',4,4',5,5'-Hexachlorobiphenyl",
                    "2,2',3,4,4',5'-Hexachlorobiphenyl",
                    "2,2',4,4',5,5'-Hexachlorobiphenyl"
                ],
                "levels": [0.015, 0.1]
            },
            "PAHs (Sum of 16)": {
                "definition": [
                    "Acenapthene", "Acenapthylene", "Anthracene", "Benz[a]anthracene", "Benzo[a]pyrene",
                    "Benzo[b]fluoranthene","Benzo[g,h,i]perylene", "Benzo[e]pyrene", "Benzo[k]fluoranthene", "C1-Napthalenes",
                    "C1-Phenanthrenes","C2-Napthalenes", "C3-Napthalenes", "Chrysene", "Dibenz[a,h]anthracene", "Fluoranthene"
                ],
                "levels": [1.2, 5.0]
            }
        }
    }
}*/
/*    levels:"North Sea - RW1","RW1","North Sea - RW2","RW2"
    sum:"PCBs (Sum of 7 congeners)",7
    sumdefinition:"2,2',4,5,5'-Pentachlorobiphenyl", "2,3,3',4,4'-Pentachlorobiphenyl",
    "2,3,3',4',6-Pentachlorobiphenyl", "2,3',4,4',5-Pentachlorobiphenyl", "2,2',3,3',4,4'-Hexachlorobiphenyl",
    "2,2',3,4,4',5'-Hexachlorobiphenyl", "2,2',3,4,5,5'-Hexachlorobiphenyl"
    sumlevel:"PCBs (Sum of 7 congeners)", 0.015,0.1
    sum:"PAHs (Sum of 16)",16
    sumdefinition:"Acenapthene", "Acenapthylene", "Anthracene", "Benz[a]anthracene", "Benzo[a]pyrene",
    "Benzo[b]fluoranthene","Benzo[g,h,i]perylene", "Benzo[e]pyrene", "Benzo[k]fluoranthene", "C1-Napthalenes",
    "C1-Phenanthrenes","C2-Napthalenes", "C3-Napthalenes", "Chrysene", "Dibenz[a,h]anthracene", "Fluoranthene"
    sumlevel:"PAHs (Sum of 16)",1.2,5.0
}*/

/**
         * Fetches a text file from a URL and parses it into a structured object
         * containing environmental quality standards according to a specific format.
         * @param {string} url The URL of the text file to read.
         * @returns {Promise<object>} A promise that resolves to the parsed standards object.
         */
        async function readQualityStandards(url) {
            const standards = {};
            let currentStandard = null;
            let currentSum = null;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                const rawLines = text.split('\n');

                // Pre-process lines to handle continuations
                const processedLines = [];
                let lineBuffer = '';
                for (const line of rawLines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine === '') continue;

                    lineBuffer += trimmedLine;
                    if (trimmedLine.endsWith(',')) {
                        // This line is a continuation, so we'll append the next line to it.
                        continue;
                    } else {
                        // This line is complete, push it to our processed array and clear the buffer.
                        processedLines.push(lineBuffer);
                        lineBuffer = '';
                    }
                }
                if (lineBuffer) { // push any remaining buffer
                    processedLines.push(lineBuffer);
                }


                // A robust parser to handle values that might be quoted (and contain commas/single quotes) or unquoted.
                const parseLineValues = (line) => {
                    const values = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];

                        if (char === '"') {
                            inQuotes = !inQuotes;
                            current += char; // Keep the quote for now
                        } else if (char === ',' && !inQuotes) {
                            values.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current.trim()); // Add the last value

                    // Now, clean up the collected values by removing the surrounding quotes
                    return values.map(val => {
                        if (val.startsWith('"') && val.endsWith('"')) {
                            return val.substring(1, val.length - 1);
                        }
                        return val;
                    });
                };

                for (const line of processedLines) {
                    const separatorIndex = line.indexOf(':');
                    if (separatorIndex === -1) continue;

                    const key = line.substring(0, separatorIndex).trim();
                    const valueString = line.substring(separatorIndex + 1).trim();

                    switch (key) {
                        case 'standard': {
                            const [name, unit] = parseLineValues(valueString);
                            currentStandard = name;
                            standards[currentStandard] = {
                                unit: unit || null,
                                levels: { Names: [], abbrev: [] },
                                noLevels: 0,
                                chemicals: {},
                                sums: {}
                            };
                            break;
                        }
                        case 'levels': {
                            if (currentStandard) {
                                const parsed = parseLineValues(valueString);
                                const names = [];
                                const abbrevs = [];
                                for (let i = 0; i < parsed.length; i += 2) {
                                    names.push(parsed[i]);
                                    if (parsed[i+1]) {
                                       abbrevs.push(parsed[i+1].replace(/[()]/g, ''));
                                    }
                                }
                                standards[currentStandard].levels.Names = names;
                                standards[currentStandard].levels.abbrev = abbrevs;
                                standards[currentStandard].noLevels = names.length;
                            }
                            break;
                        }
                        case 'chemlevel': {
                            if (currentStandard) {
                                const [chemName, ...levels] = parseLineValues(valueString);
                                standards[currentStandard].chemicals[chemName] = levels.map(level => parseFloat(level));
                            }
                            break;
                        }
                        case 'sumName':
                        case 'sum': {
                            if (currentStandard) {
                                const [sumName] = parseLineValues(valueString);
                                currentSum = sumName; 
                                if (!standards[currentStandard].sums[sumName]) {
                                    standards[currentStandard].sums[sumName] = { definition: [], levels: [] };
                                }
                            }
                            break;
                        }
                        case 'sumdefinition': {
                            if (currentStandard) {
                                const values = parseLineValues(valueString);
                                let sumNameForDef = currentSum;
                                let definition = values;

                                if (standards[currentStandard].sums[values[0]]) {
                                    sumNameForDef = values[0];
                                    definition = values.slice(1);
                                }
                                
                                if (sumNameForDef.toLowerCase().includes('total')) {
                                    standards[currentStandard].sums[sumNameForDef].definition = sumNameForDef;
                                } else {
                                    standards[currentStandard].sums[sumNameForDef].definition = definition;
                                }
                            }
                            break;
                        }
                         case 'sumlevel': {
                            if (currentStandard) {
                                const [sumName, ...levels] = parseLineValues(valueString);
                                if (!standards[currentStandard].sums[sumName]) {
                                     standards[currentStandard].sums[sumName] = { definition: [], levels: [] };
                                }
                                standards[currentStandard].sums[sumName].levels = levels.map(level => parseFloat(level));
                            }
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to read or parse quality standards:", error);
                document.getElementById('output').textContent = `Error loading data: ${error.message}`;
                return null;
            }

            return standards;
        }

/*        // --- Execution ---
        document.addEventListener('DOMContentLoaded', async () => {
            const dataUrl = 'https://northeastfc.uk/Supporting/quality_standards.sdes';
            const parsedData = await readQualityStandards(dataUrl);
            const outputElement = document.getElementById('output');

            if (parsedData) {
                outputElement.textContent = JSON.stringify(parsedData, null, 2);
            } else {
                outputElement.textContent = 'Failed to load and parse the standards data. See console for details.';
            }
        });*/
