import fs from 'fs';

async function main() {
  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const target = list.find(t => t.type === 'page' && t.url.includes('localhost')) || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP');

  // Navigate and wait for clean reload
  console.log('Navigating page to fetch updated web assets...');
  await send('Page.enable');
  await send('Page.navigate', { url: 'https://localhost/' });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const artifactDir = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';

  // 1. TEST KILL SHEET PDF
  console.log('--- Testing Kill Sheet PDF ---');
  const killRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async function() {
      const pages = [];
      const origHtml2Canvas = window.html2canvas;
      window.html2canvas = async function(el, opts) {
        const c = await origHtml2Canvas(el, opts);
        pages.push(c.toDataURL('image/png'));
        return c;
      };

      try {
        const reportData = {
          jobName: "Well #1 Kill Operation",
          rigType: "SUBSEA_FLOATER",
          isSurface: false,
          flowType: "SUBSEA_FLOATER",
          holeTVD: 3048,
          shoeTVD: 2438.4,
          holeMD: 3200,
          shoeMD: 2438.4,
          casingSize: "20 in",
          holeSize: "17.5 in",
          surfaceToBitStrokes: 5637,
          shoeToSurfaceStrokes: 15035,
          bottomsUpStrokes: 103315,
          spm: 60,
          stringVolume: 662.71,
          openHoleVolume: 1767.5,
          annularVolume: 12145.77,
          totalSystemVolume: 12808.48,
          pumpOutput: 0.1176,
          omw: 9.2,
          lotEmw: 14.5,
          lotSafetyFactor: 1.0,
          krp: 250,
          clf: 50,
          surfaceFriction: 0,
          sidp: 200,
          sicp: 350,
          initialChokePressure: 300,
          kmwExact: 10.46,
          kmwUsed: 10.5,
          tripMarginPpg: 0.5,
          recommendedMudWeightPpg: 11.0,
          extraOverbalancePsi: 159,
          icp: 450,
          fcp: 350,
          maasp: 1023.62,
          dynMaasp: 883.62,
          dynSicp: 82,
          maaspAfterKillRounded: 682.41,
          maaspAfterKillExact: 815.29,
          pressDrop100: 4.4,
          riserMarginPpg: 1.2,
          bhpReductionPsi: 320,
          pitGain: 15,
          waterDepth_m: 500,
          airGap_m: 25,
          seawaterDensity_ppg: 8.55,
          influxGradientPsiFt: 0.15,
          influxDensityPpg: 2.88,
          influxClassification: "Gas Influx (High expansion risk)",
          kickToleranceBbl: 131.6,
          baritePer100Bbl: 11.37,
          volToMix: 12808.48,
          totalBariteSacks: 1456,
          totalBariteTonnes: 72.8,
          method: "WAIT_AND_WEIGHT",
          stepFrequency: 100,
          schedule: [
            { stroke: 0, dpPressure: 450, chokePressure: 300, note: "Initial Circulation" },
            { stroke: 500, dpPressure: 441, chokePressure: 300 },
            { stroke: 1000, dpPressure: 432, chokePressure: 300 },
            { stroke: 1500, dpPressure: 423, chokePressure: 300 },
            { stroke: 2000, dpPressure: 414, chokePressure: 300 },
            { stroke: 3000, dpPressure: 396, chokePressure: 300 },
            { stroke: 4000, dpPressure: 379, chokePressure: 300 },
            { stroke: 5000, dpPressure: 361, chokePressure: 300 },
            { stroke: 5637, dpPressure: 350, chokePressure: 300, note: "KMW at Bit" }
          ]
        };
        const rep = await window.WellControlPdf.generateWellControlReport(reportData);
        return {
          numPages: rep.doc.internal.getNumberOfPages(),
          dataUri: rep.pdfBase64,
          pages
        };
      } finally {
        window.html2canvas = origHtml2Canvas;
      }
    })()`,
    returnByValue: true
  });

  const killData = killRes.result?.value;
  console.log(`Kill Sheet PDF generated: ${killData.numPages} pages, captured ${killData.pages?.length} pages`);
  if (killData.pages) {
    killData.pages.forEach((p, idx) => {
      const b64 = p.split(',')[1];
      fs.writeFileSync(`${artifactDir}/hd_killsheet_p${idx+1}.png`, Buffer.from(b64, 'base64'));
      console.log(`Saved hd_killsheet_p${idx+1}.png`);
    });
  }

  // 2. TEST RISER MARGIN PDF
  console.log('--- Testing Riser Margin PDF ---');
  const riserRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async function() {
      const pages = [];
      const origHtml2Canvas = window.html2canvas;
      window.html2canvas = async function(el, opts) {
        const c = await origHtml2Canvas(el, opts);
        pages.push(c.toDataURL('image/png'));
        return c;
      };

      try {
        // Set sample state
        window.riserMarginState = {
          jobName: "Subsea Exploration Well 4",
          whDepth: 1200,
          tdDepth: 3800,
          currentMw: 11.2,
          porePressure: 10.5,
          swDensity: 8.55,
          densityUnit: "ppg",
          depthUnit: "m"
        };
        await window.exportRiserMarginPdf();
        // Return captured pages
        return {
          pages
        };
      } finally {
        window.html2canvas = origHtml2Canvas;
      }
    })()`,
    returnByValue: true
  });

  const riserData = riserRes.result?.value;
  console.log(`Riser Margin PDF generated, captured ${riserData.pages?.length} pages`);
  if (riserData.pages) {
    riserData.pages.forEach((p, idx) => {
      const b64 = p.split(',')[1];
      fs.writeFileSync(`${artifactDir}/hd_riser_margin_p${idx+1}.png`, Buffer.from(b64, 'base64'));
      console.log(`Saved hd_riser_margin_p${idx+1}.png`);
    });
  }

  // 3. TEST CEMENTING PDF
  console.log('--- Testing Cementing PDF ---');
  const cementRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async function() {
      const pages = [];
      const origHtml2Canvas = window.html2canvas;
      window.html2canvas = async function(el, opts) {
        const c = await origHtml2Canvas(el, opts);
        pages.push(c.toDataURL('image/png'));
        return c;
      };

      try {
        const testState = {
          inputs: {
            name: "Subsea 13-3/8in Production Casing",
            shoe: 2440,
            td: 2445,
            air_gap: 25,
            water_depth: 915,
            hanger: 935,
            prev_shoe: 1495,
            mw: 10.2,
            lead_vol: 431,
            lead_mw: 12.5,
            tail_vol: 184,
            tail_mw: 15.8,
            sp_vol: 80,
            sp_mw: 11.0,
            disp_mw: 10.2,
            pump_output: 0.102,
            max_pump_pressure: 3500,
            rig_type: "subsea"
          },
          results: {
            total_slurry: 615,
            total_pumped: 1250,
            emw_shoe: 13.2,
            diff_press: 520,
            p_ann_fc: 890,
            collapse_sf: 1.52,
            bump_pressure: 1000,
            toc: 1200,
            tail_top: 2100,
            sp_top: 1050,
            rise_lead: 900,
            rise_tail: 340,
            rise_sp: 150,
            rise_tot: 1240,
            disp_tot: 635,
            strokes: 6225,
            mudline: 940,
            fc: 2416
          },
          unit: "m"
        };
        const rep = await window.CementingPDF.generateJobReport(testState);
        return {
          numPages: rep.doc.internal.getNumberOfPages(),
          dataUri: rep.dataUri,
          pages
        };
      } finally {
        window.html2canvas = origHtml2Canvas;
      }
    })()`,
    returnByValue: true
  });

  const cementData = cementRes.result?.value;
  console.log(`Cementing PDF generated: ${cementData.numPages} pages, captured ${cementData.pages?.length} pages`);
  if (cementData.pages) {
    cementData.pages.forEach((p, idx) => {
      const b64 = p.split(',')[1];
      fs.writeFileSync(`${artifactDir}/hd_cementing_p${idx+1}.png`, Buffer.from(b64, 'base64'));
      console.log(`Saved hd_cementing_p${idx+1}.png`);
    });
  }

  console.log('ALL PDF EXPORTS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}
main().catch(err => { console.error('Verification error:', err); process.exit(1); });
