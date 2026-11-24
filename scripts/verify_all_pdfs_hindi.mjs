import fs from 'fs';
import path from 'path';

const list = await fetch("http://127.0.0.1:9222/json").then(r => r.json());
console.log("Found targets:", list.length);
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

ws.onopen = async () => {
  try {
    console.log("Connected to WebView CDP");

    // 1. Set language to Hindi
    console.log("Setting language to Hindi ('hi')...");
    const setLangRes = await send("Runtime.evaluate", {
      expression: `(function() {
        if (window.I18n && typeof window.I18n.setLanguage === 'function') {
          window.I18n.setLanguage('hi');
          return window.I18n.getCurrentLang();
        }
        return 'no-i18n';
      })()`,
      returnByValue: true
    });
    console.log("Language set to:", setLangRes.result.value);

    // 2. Test Kill Data Sheet PDF Generation
    console.log("\n--- Testing Kill Data Sheet PDF Generation in Hindi ---");
    const killSheetRes = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async function() {
        try {
          const reportData = {
            jobName: "वेल #1 किल ऑपरेशन (परीक्षण)",
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
            influxClassification: "गैस अंतर्वाह (उच्च विस्तार जोखिम)",
            kickToleranceBbl: 131.6,
            baritePer100Bbl: 11.37,
            volToMix: 12808.48,
            totalBariteSacks: 1456,
            totalBariteTonnes: 72.8,
            method: "WAIT_AND_WEIGHT",
            stepFrequency: 100,
            schedule: [
              { strokes: 0, time_min: 0, dpPressure: 450, chokePressure: 300, status: "आरंभिक परिसंचरण" },
              { strokes: 1000, time_min: 33.3, dpPressure: 432, chokePressure: 300, status: "ड्रिल स्ट्रिंग में KMW" },
              { strokes: 2000, time_min: 66.7, dpPressure: 414, chokePressure: 300, status: "ड्रिल स्ट्रिंग में KMW" },
              { strokes: 5637, time_min: 187.9, dpPressure: 350, chokePressure: 300, status: "बिट पर KMW" }
            ]
          };

          const result = await window.WellControlPdf.generateWellControlReport(reportData);
          return {
            success: true,
            fileName: result.fileName,
            dataUriLength: result.pdfBase64 ? result.pdfBase64.length : 0,
            pdfBase64: result.pdfBase64
          };
        } catch (e) {
          return { success: false, error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log("Kill Sheet PDF Result:", {
      success: killSheetRes.result?.value?.success,
      fileName: killSheetRes.result?.value?.fileName,
      dataUriLength: killSheetRes.result?.value?.dataUriLength,
      error: killSheetRes.result?.value?.error
    });

    if (killSheetRes.result?.value?.pdfBase64) {
      const b64 = killSheetRes.result.value.pdfBase64.split(',')[1];
      fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/hindi_killsheet.pdf', Buffer.from(b64, 'base64'));
      console.log("Saved hindi_killsheet.pdf");
    }

    // 3. Test Riser Margin PDF Generation
    console.log("\n--- Testing Riser Margin PDF Generation in Hindi ---");
    const riserMarginRes = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async function() {
        try {
          if (typeof window.exportRiserMarginPdf !== 'function') {
            return { success: false, error: 'exportRiserMarginPdf not found' };
          }
          const res = await window.exportRiserMarginPdf();
          return { success: true, result: res };
        } catch (e) {
          return { success: false, error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log("Riser Margin PDF Result:", riserMarginRes.result?.value);

    // 4. Test Cementing PDF Generation
    console.log("\n--- Testing Cementing PDF Generation in Hindi ---");
    const cementingRes = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async function() {
        try {
          if (!window.CementingPDF || typeof window.CementingPDF.generateJobReport !== 'function') {
            return { success: false, error: 'CementingPDF.generateJobReport not found' };
          }
          // Build test cementing state
          const testState = {
            wellName: "सबसी वेल 101-A",
            rigName: "डीपवॉटर एक्सप्लोरर",
            operator: "ऑपरेशन टीम",
            jobType: "SUBSEA_CASING",
            waterDepth: 1200,
            airGap: 25,
            wellDepth: 3500,
            previousCasingShoe: 2200,
            casingOd: 9.625,
            holeId: 12.25,
            mudWeight: 10.5,
            leadSlurry: {
              name: "लीड सीमेंट स्लरी",
              density: 12.8,
              volume: 180,
              topOfCement: 1800,
              thickeningTime: "4:30"
            },
            tailSlurry: {
              name: "टेल सीमेंट स्लरी",
              density: 15.8,
              volume: 95,
              topOfCement: 3000,
              thickeningTime: "3:00"
            },
            spacers: [
              { name: "वॉश स्पेसर", density: 8.6, volume: 50 },
              { name: "वेटेड स्पेसर", density: 11.5, volume: 80 }
            ],
            displacement: {
              fluid: "ड्रिलिंग मड",
              density: 10.5,
              volume: 420,
              rate: 12
            },
            burstLimit: 5200,
            collapseLimit: 4800,
            fractureGradient: 16.2
          };

          const rep = await window.CementingPDF.generateJobReport(testState);
          return {
            success: true,
            fileName: rep.fileName,
            dataUriLength: rep.dataUri ? rep.dataUri.length : 0,
            dataUri: rep.dataUri
          };
        } catch (e) {
          return { success: false, error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log("Cementing PDF Result:", {
      success: cementingRes.result?.value?.success,
      fileName: cementingRes.result?.value?.fileName,
      dataUriLength: cementingRes.result?.value?.dataUriLength,
      error: cementingRes.result?.value?.error
    });

    if (cementingRes.result?.value?.dataUri) {
      const b64 = cementingRes.result.value.dataUri.split(',')[1];
      fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/hindi_cementing.pdf', Buffer.from(b64, 'base64'));
      console.log("Saved hindi_cementing.pdf");
    }

    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err);
    process.exit(1);
  }
};
