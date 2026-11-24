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

ws.onopen = async () => {
  try {
    console.log("Connected to WebView CDP");

    // 1. Render Kill Sheet Page 2
    console.log("Rendering Kill Sheet Page 2...");
    const killPage2 = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async function() {
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
            { strokes: 500, time_min: 16.7, dpPressure: 441, chokePressure: 300, status: "ड्रिल स्ट्रिंग में KMW" },
            { strokes: 1000, time_min: 33.3, dpPressure: 432, chokePressure: 300, status: "ड्रिल स्ट्रिंग में KMW" },
            { strokes: 1500, time_min: 50.0, dpPressure: 423, chokePressure: 300, status: "ड्रिल स्ट्रिंग में KMW" },
            { strokes: 2000, time_min: 66.7, dpPressure: 414, chokePressure: 300, status: "ड्रिल स्ट्रिंग में KMW" },
            { strokes: 5637, time_min: 187.9, dpPressure: 350, chokePressure: 300, status: "बिट पर KMW" }
          ]
        };

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        document.body.appendChild(container);

        // We can call window.WellControlPdf internal or create page 2
        // Let's generate and intercept canvases
        let p2Base64 = null;
        const origHtml2Canvas = window.html2canvas;
        let callCount = 0;
        window.html2canvas = async function(el, opts) {
          callCount++;
          const c = await origHtml2Canvas(el, opts);
          if (callCount === 2) {
            p2Base64 = c.toDataURL('image/png');
          }
          return c;
        };
        try {
          await window.WellControlPdf.generateWellControlReport(reportData);
        } finally {
          window.html2canvas = origHtml2Canvas;
        }
        return p2Base64;
      })()`,
      returnByValue: true
    });

    if (killPage2.result?.value) {
      const b64 = killPage2.result.value.split(',')[1];
      fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/hindi_killsheet_p2.png', Buffer.from(b64, 'base64'));
      console.log("Saved hindi_killsheet_p2.png");
    }

    // 2. Render Riser Margin Page 2
    console.log("Rendering Riser Margin Page 2...");
    const riserPage2 = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async function() {
        let p2Base64 = null;
        const origHtml2Canvas = window.html2canvas;
        let callCount = 0;
        window.html2canvas = async function(el, opts) {
          callCount++;
          const c = await origHtml2Canvas(el, opts);
          if (callCount === 2) {
            p2Base64 = c.toDataURL('image/png');
          }
          return c;
        };
        try {
          await window.exportRiserMarginPdf();
        } finally {
          window.html2canvas = origHtml2Canvas;
        }
        return p2Base64;
      })()`,
      returnByValue: true
    });

    if (riserPage2.result?.value) {
      const b64 = riserPage2.result.value.split(',')[1];
      fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/hindi_riser_margin_p2.png', Buffer.from(b64, 'base64'));
      console.log("Saved hindi_riser_margin_p2.png");
    }

    // 3. Render Cementing Page 2 & 3
    console.log("Rendering Cementing Page 2 & 3...");
    const cementPages = await send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async function() {
        let p2Base64 = null;
        let p3Base64 = null;
        const origHtml2Canvas = window.html2canvas;
        let callCount = 0;
        window.html2canvas = async function(el, opts) {
          callCount++;
          const c = await origHtml2Canvas(el, opts);
          if (callCount === 2) p2Base64 = c.toDataURL('image/png');
          if (callCount === 3) p3Base64 = c.toDataURL('image/png');
          return c;
        };
        try {
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
          await window.CementingPDF.generateJobReport(testState);
        } finally {
          window.html2canvas = origHtml2Canvas;
        }
        return { p2Base64, p3Base64 };
      })()`,
      returnByValue: true
    });

    if (cementPages.result?.value?.p2Base64) {
      const b64 = cementPages.result.value.p2Base64.split(',')[1];
      fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/hindi_cementing_p2.png', Buffer.from(b64, 'base64'));
      console.log("Saved hindi_cementing_p2.png");
    }
    if (cementPages.result?.value?.p3Base64) {
      const b64 = cementPages.result.value.p3Base64.split(',')[1];
      fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/hindi_cementing_p3.png', Buffer.from(b64, 'base64'));
      console.log("Saved hindi_cementing_p3.png");
    }

    process.exit(0);
  } catch (err) {
    console.error("Export Error:", err);
    process.exit(1);
  }
};
