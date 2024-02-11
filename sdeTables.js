/*// Function to generate the HTML table for position data
function generatePositionTable(sampleName, positionData) {
    // Extract position data
console.log(positionData);
    const LocationName = positionData['Location name (as per sampling plan)'];
    const PositionLatitude  = positionData['Position latitude'];
    const PositionLongitude = positionData['Position longitude'];
    const SamplingDepthMin = positionData['Sampling depth (m)'].minDepth;
    const SamplingDepthMax = positionData['Sampling depth (m)'].maxDepth;
    const DredgeArea = positionData['Dredge area'];
    const SamplingLocation = positionData['Sampling location'];

    // Generate HTML for the table
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th colspan="2">Position Data for Sample: ${sampleName}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Location Name:</td>
                    <td>${LocationName}</td>
                </tr>
                <tr>
                    <td>Position:</td>
                    <td>Lat: ${PositionLatitude}, Lon: ${PositionLongitude}</td>
                </tr>
                <tr>
                    <td>Position Longitude:</td>
                    <td>${PositionLongitude}</td>
                </tr>
                <tr>
                    <td>Sampling Depth:</td>
                    <td>Min: ${SamplingDepthMin}, Max: ${SamplingDepthMax}</td>
                </tr>
                <tr>
                    <td>Dredge Area:</td>
                    <td>${DredgeArea}</td>
                </tr>
                <tr>
                    <td>Sampling Location:</td>
                    <td>${SamplingLocation}</td>
                </tr>
            </tbody>
        </table>
    `;

    return tableHTML;
}

// Function to generate position tables for all samples
function generateAllPositionTables(sampleInfo) {
    // Iterate over sampleInfo to generate tables for each sample
    for (const dateSampled in sampleInfo) {
        const samples = sampleInfo[dateSampled].position;
        for (const sampleName in samples) {
            const positionData = samples[sampleName];
            const positionTableHTML = generatePositionTable(sampleName, positionData);
            // Append the generated HTML to a container element
            document.getElementById('position-table-container').innerHTML += positionTableHTML;
        }
    }
}
*/
// Function to generate the HTML table for all samples
function generateSampleInfoTable(sampleInfo) {
    // Generate HTML for the table header
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Sample</th>
                    <th>Location Name</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Min Depth</th>
                    <th>Max Depth</th>
                    <th>Dredge Area</th>
                    <th>Sampling Location</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Iterate over sampleInfo to generate rows for each sample
    for (const dateSampled in sampleInfo) {
        const samples = sampleInfo[dateSampled].position;
        for (const sampleName in samples) {
            const positionData = samples[sampleName];
            const LocationName = positionData['Location name (as per sampling plan)'];
            const PositionLatitude  = positionData['Position latitude'];
            const PositionLongitude = positionData['Position longitude'];
            const SamplingDepthMin = positionData['Sampling depth (m)'].minDepth;
            const SamplingDepthMax = positionData['Sampling depth (m)'].maxDepth;
            const DredgeArea = positionData['Dredge area'];
            const SamplingLocation = positionData['Sampling location'];
        


            // Add a row for the sample
            tableHTML += `
                <tr>
                    <td>${sampleName}</td>
                    <td>${LocationName}</td>
                    <td>${PositionLatitude}</td>
                    <td>${PositionLongitude}</td>
                    <td>${SamplingDepthMin}</td>
                    <td>${SamplingDepthMax}</td>
                    <td>${DredgeArea}</td>
                    <td>${SamplingLocation}</td>
                </tr>
            `;
        }
    }

    // Close the table
    tableHTML += `
            </tbody>
        </table>
    `;
    document.getElementById('sample-info-table-container').innerHTML = tableHTML
    return tableHTML;
}

/*// Example usage
const sampleInfoTableHTML = generateSampleInfoTable(sampleInfo);
// Append the generated HTML to a container element
document.getElementById('sample-info-table-container').innerHTML = sampleInfoTableHTML;*/
