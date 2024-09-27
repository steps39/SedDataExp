function pcbPostProcess(newMeas,dateSampled) {
    sheetName = 'PCB data';
//console.log(newMeas);
    mmeas = newMeas;
    sums = {};
    const ICES7 = ["2,2',5,5'-Tetrachlorobiphenyl", "2,4,4'-Trichlorobiphenyl", "2,2',3,4,4',5,5'-Heptachlorobiphenyl",
        "2,2',4,4',5,5'-Hexachlorobiphenyl", "2,2',3,4,4',5'-Hexachlorobiphenyl",
        "2,3',4,4',5-Pentachlorobiphenyl", "2,2',4,5,5'-Pentachlorobiphenyl"];
//console.log(mmeas);
    for (const chemical in mmeas.chemicals) {
        for (const sample in mmeas.chemicals[chemical].samples) {
            //console.log(chemical,sample);
            if (!sums[sample]) {
                sums[sample] = {
                    ICES7: 0,
                    All: 0
                };
            }
//            console.log(chemical,sample);
//            console.log(mmeas.chemicals[chemical].samples[sample]);
            //	                        const congenerConcentration = meas.chemicals[chemical].samples[sample].reduce((acc, val) => acc + val, 0);
            const congenerConcentration = mmeas.chemicals[chemical].samples[sample] || 0;
            if (ICES7.includes(chemical)) {
                sums[sample].ICES7 += congenerConcentration;
            }
            sums[sample].All += congenerConcentration;
        }
    }
    sampleMeasurements[dateSampled][sheetName].congenerTest = sums;
}

function pahPostProcess(newMeas,dateSampled) {
    sheetName = 'PAH data';
    const chemicals = sampleMeasurements[dateSampled][sheetName].chemicals;
    if ('Acenapthene' in chemicals) {
        //If totalHC not read then set to zero
        if (!('totalHC' in sampleMeasurements[dateSampled][sheetName])) {
            thc = {};
//            sampleMeasurements[dateSampled][sheetName].totalHC = [];
            for(sample in sampleMeasurements[dateSampled][sheetName].chemicals['Acenapthene'].samples) {
                thc[sample] = 0.0;
//                totalHC[sample] = 0.0;
            }
            sampleMeasurements[dateSampled][sheetName].totalHC = thc;
        }

//        mmeas = newMeas[sheetName];
        mmeas = newMeas;
        sums = {};
        // Goring Test protocol here, but results stored by sample
        const lmw = ['Acenaphthene', 'Acenaphthylene', 'Anthracene', 'Fluorene', 'C1-Naphthalenes', 'Naphthalene', 'Phenanthrene'];
        const hmw = ['Benz[a]anthracene', 'Benzo[a]pyrene', 'Chrysene', 'Dibenz[a,h]anthracene', 'Fluoranthene', 'Pyrene'];

        for (const chemical in mmeas.chemicals) {
            for (const sample in mmeas.chemicals[chemical].samples) {
                //console.log(chemical,sample);
                if (!sums[sample]) {
                    sums[sample] = {
                        lmwSum: 0,
                        hmwSum: 0
                    };
                }
                //console.log(meas[chemical][sample]);
                if (lmw.includes(chemical)) {
                    const lmwConcentrationSum = mmeas.chemicals[chemical].samples[sample] || 0;
                    sums[sample].lmwSum += lmwConcentrationSum;
                } else if (hmw.includes(chemical)) {
                    const hmwConcentrationSum = mmeas.chemicals[chemical].samples[sample] || 0;
                    sums[sample].hmwSum += hmwConcentrationSum;
                }
            }
        }
        sampleMeasurements[dateSampled][sheetName].gorhamTest = sums;
//        const chemicals = sampleMeasurements[dateSampled][sheetName].chemicals;
        sampleMeasurements[dateSampled][sheetName].ratios = {};
        sampleMeasurements[dateSampled][sheetName].ringSums = {};
        sampleMeasurements[dateSampled][sheetName].simpleRatios = {};
        const allSamples = Object.keys(sampleInfo[dateSampled].position);
        allSamples.sort();
        allSamples.forEach(s => {
            const ace = chemicals['Acenapthene'].samples[s];//3
            const aceph = chemicals['Acenapthylene'].samples[s];//3
            const anth = chemicals['Anthracene'].samples[s];//3//Ant
            const baa = chemicals['Benz[a]anthracene'].samples[s];//4
            const bap = chemicals['Benzo[a]pyrene'].samples[s];//5
            const bbf = chemicals['Benzo[b]fluoranthene'].samples[s];//4
            const bghip = chemicals['Benzo[g,h,i]perylene'].samples[s];//6//Bgp
            const bkf = chemicals['Benzo[k]fluoranthene'].samples[s];//4
            const chr = chemicals['Chrysene'].samples[s];//4
            const dba = chemicals['Dibenz[a,h]anthracene'].samples[s];//5
            const fl = chemicals['Fluorene'].samples[s];//3
            const flu = chemicals['Fluoranthene'].samples[s];//4
            const ip = chemicals['Indeno[123-c,d]pyrene'].samples[s];//5//Inp
            const phen = chemicals['Phenanthrene'].samples[s];//3
            const naph = chemicals['Napthalene'].samples[s];//2
            const pyr = chemicals['Pyrene'].samples[s];//4
            m = {};
            //Diagnostic ratios
            //IP/(IP+B(ghi)P)
            m['IP/(IP+B(ghi)P)'] = ip / (ip + bghip);
            //BaA/(BaA+Chr)
            m['BaA/(BaA+Chr)'] = baa / (baa + chr);
            //BaP/(BaP+Chr)
            m['BaP/(BaP+Chr)'] = bap / (bap + chr);
            //Phen/(Phen+Anth)
            m['Phen/(Phen+Anth)'] = phen / (phen + anth);
            //BaA/(BaA+BaP)
            m['BaA/(BaA+BaP)'] = baa / (baa + bap);
            //BbF/(BbF+BkF)
            m['BbF/(BbF+BkF)'] = bbf / (bbf + bkf);
            sampleMeasurements[dateSampled][sheetName].ratios[s] = m;
            m = {};
            // Dash Sums: L'PAHs - Phen + Anth + Flu + Pyr; H'PAHs - BaA + Chr + BbF + BkF + BaP + IP + DBA + BgP
            m['LdPAHs'] = phen + anth + flu + pyr;
            m['HdPAHs'] = baa + chr + bbf + bkf + bap + ip + dba + bghip;
            m['Total d PAHs'] = m['LdPAHs'] + m['HdPAHs'];
            // EPS Sums: LPAHs - Naph, Aceph, Ace, Fl, Phen and Ant; HPAHs - Flu, Pyr, BaA, Chr, BbF, BkF, BaP, DBA, BgP and Inp
            m['LPAHs'] = naph + aceph + ace + fl + phen + anth;
            m['HPAHs'] = flu + pyr + baa + chr + bbf + bkf + bap + dba + bghip + ip;
            m['Total EPA PAHs'] = m['LPAHs'] + m['HPAHs'];
            // Ring Sums
            m['Sum of 2 rings'] = naph;//2
            m['Sum of 3 rings'] = ace + aceph + anth + fl + phen;//3
            m['Sum of 4 rings'] = baa + bbf + bkf + chr + flu + pyr;//4
            m['Sum of 5 rings'] = bap + dba + ip;//5
            m['Sum of 6 rings'] = bghip;//6
            m['Total all rings'] = m['Sum of 2 rings'] + m['Sum of 3 rings'] + m['Sum of 4 rings'] + m['Sum of 5 rings'] + m['Sum of 6 rings'];
            sampleMeasurements[dateSampled][sheetName].ringSums[s] = m;
            m = {};
            m['Phen/Anth'] = phen / anth;
            m['Flu/Pyr'] = flu / pyr;
            m['Baa/Chr'] = baa / chr;
            if (chemicals['Benzo[e]pyrene'] === undefined || chemicals['Benzo[e]pyrene'] === null) {
                const bep = chemicals['Benzo[e]pyrene'].sample[s];
                m['Bep/Bap'] = bep / bap;
            } else {
                m['Bep/Bap'] = 0;
            }
            sampleMeasurements[dateSampled][sheetName].simpleRatios[s] = m;
        });
    }
}

