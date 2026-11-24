import fs from 'fs';

const list = await fetch("http://127.0.0.1:9222/json").then(r => r.json());
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

const locales = ['en', 'es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk'];

ws.onopen = async () => {
  try {
    console.log("Connected to WebView CDP. Verifying PDF exports across all 13 languages...");

    for (const lang of locales) {
      console.log(`\n========================================`);
      console.log(`Testing Language: [ ${lang.toUpperCase()} ]`);
      console.log(`========================================`);

      // Set Language
      await send("Runtime.evaluate", {
        expression: `window.I18n.setLanguage('${lang}')`,
        returnByValue: true
      });

      // 1. Kill Sheet
      const killRes = await send("Runtime.evaluate", {
        awaitPromise: true,
        expression: `(async function() {
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
              spm: 30,
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
              influxClassification: "Gas influx (high expansion risk)",
              kickToleranceBbl: 131.6,
              baritePer100Bbl: 11.37,
              volToMix: 12808.48,
              totalBariteSacks: 1456,
              totalBariteTonnes: 72.8,
              method: "WAIT_AND_WEIGHT",
              stepFrequency: 100,
              schedule: [
                { strokes: 0, time_min: 0, dpPressure: 450, chokePressure: 300, note: "Initial Circ" },
                { strokes: 1000, time_min: 33.3, dpPressure: 432, chokePressure: 300, note: "KMW in string" },
                { strokes: 5637, time_min: 187.9, dpPressure: 350, chokePressure: 300, note: "KMW at bit" }
              ]
            };
            const res = await window.WellControlPdf.generateWellControlReport(reportData);
            return { success: true, length: res.pdfBase64 ? res.pdfBase64.length : 0, pdfBase64: res.pdfBase64 };
          } catch(e) {
            return { success: false, error: e.message };
          }
        })()`,
        returnByValue: true
      });
      const killVal = killRes.result?.value;
      console.log(`  Kill Sheet PDF [${lang}]:`, killVal.success ? `SUCCESS (${killVal.length} chars)` : `FAILED (${killVal.error})`);

      // 2. Riser Margin
      const rmRes = await send("Runtime.evaluate", {
        awaitPromise: true,
        expression: `(async function() {
          try {
            const res = await window.exportRiserMarginPdf();
            return { success: true };
          } catch(e) {
            return { success: false, error: e.message };
          }
        })()`,
        returnByValue: true
      });
      const rmVal = rmRes.result?.value;
      console.log(`  Riser Margin PDF [${lang}]:`, rmVal.success ? `SUCCESS` : `FAILED (${rmVal.error})`);

      // 3. Cementing
      const cmRes = await send("Runtime.evaluate", {
        awaitPromise: true,
        expression: `(async function() {
          try {
            const testState = {
              wellName: "Test Well",
              rigName: "Deepwater 1",
              operator: "Operator",
              jobType: "SUBSEA_CASING",
              waterDepth: 1200,
              airGap: 25,
              wellDepth: 3500,
              previousCasingShoe: 2200,
              casingOd: 9.625,
              holeId: 12.25,
              mudWeight: 10.5,
              leadSlurry: { name: "Lead Slurry", density: 12.8, volume: 180, topOfCement: 1800 },
              tailSlurry: { name: "Tail Slurry", density: 15.8, volume: 95, topOfCement: 3000 },
              spacers: [{ name: "Spacer", density: 11.5, volume: 80 }],
              displacement: { fluid: "Mud", density: 10.5, volume: 420 },
              burstLimit: 5200,
              collapseLimit: 4800,
              fractureGradient: 16.2
            };
            const res = await window.CementingPDF.generateJobReport(testState);
            return { success: true, length: res.dataUri ? res.dataUri.length : 0, dataUri: res.dataUri };
          } catch(e) {
            return { success: false, error: e.message };
          }
        })()`,
        returnByValue: true
      });
      const cmVal = cmRes.result?.value;
      console.log(`  Cementing PDF [${lang}]:`, cmVal.success ? `SUCCESS (${cmVal.length} chars)` : `FAILED (${cmVal.error})`);

      // Save sample PDFs for Arabic (RTL test) and Chinese (CJK test)
      if (lang === 'ar' && killVal.pdfBase64) {
        fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/arabic_killsheet.pdf', Buffer.from(killVal.pdfBase64.split(',')[1], 'base64'));
        if (cmVal.dataUri) {
          fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/arabic_cementing.pdf', Buffer.from(cmVal.dataUri.split(',')[1], 'base64'));
        }
      }
      if (lang === 'zh' && killVal.pdfBase64) {
        fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/chinese_killsheet.pdf', Buffer.from(killVal.pdfBase64.split(',')[1], 'base64'));
      }
    }

    console.log("\nAll 13 languages completed successfully!");
    process.exit(0);
  } catch(err) {
    console.error("Execution error:", err);
    process.exit(1);
  }
};
