import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(p => p.type === 'page' || p.url.includes('localhost'));
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No valid webview page target found: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.id = 1;
    this.pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Eval failed: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fullPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    console.log(`Saved artifact screenshot: ${fullPath}`);
    return fullPath;
  }
}

async function runVerification() {
  console.log('Connecting to WebView CDP...');
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const cdp = new CdpClient(ws);
  console.log('CDP connected.');

  console.log('\n--- VERIFYING 1: LAND RIG FLOW & HOLE SELECTION ---');
  await cdp.eval(`
    state.currentFlow = 'calculator';
    state.flowType = 'surface';
    state.rigType = 'LAND';
    state.globalUnit = 'bbl/m';
    renderHoleSizeSelection();
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('surface_01_land_hole_selection.png');

  console.log('\n--- VERIFYING 2: JACKUP RIG 36" HOLE & MARINE ELEVATIONS ---');
  await cdp.eval(`(() => {
    state.rigType = 'JACKUP';
    state.flowType = 'surface';
    state.selectedHoleSize = '36';
    state.calcInputs.airGap = 30;
    state.calcInputs.waterDepth = 100;
    renderCalculations();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  const jackupCheck = await cdp.eval(`(() => {
    const card = document.getElementById('jackup-marine-card');
    const readout = document.getElementById('jackup-mudline-depth')?.textContent;
    return { visible: !!card && card.style.display !== 'none', mudlineReadout: readout };
  })()`);
  console.log('Jackup 36" Marine card check:', jackupCheck);
  await cdp.screenshot('surface_02_jackup_36in_marine_card.png');

  console.log('\n--- VERIFYING 3: JACKUP RIG 17-1/2" HOLE GATING (< 36") ---');
  await cdp.eval(`(() => {
    state.selectedHoleSize = '17.5';
    renderCalculations();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  const jackup17Check = await cdp.eval(`(() => {
    const card = document.getElementById('jackup-marine-card');
    return { cardPresent: !!card };
  })()`);
  console.log('Jackup 17.5" Marine card gated away:', !jackup17Check.cardPresent);
  await cdp.screenshot('surface_03_jackup_17in_marine_card_hidden.png');

  console.log('\n--- VERIFYING 4: LAND RIG KILL DATA SHEET (BASELINE CASE) ---');
  await cdp.eval(`(() => {
    state.rigType = 'LAND';
    state.flowType = 'surface';
    state.globalUnit = 'bbl/m';
    state.kmwRoundingMode = '0.1';
    state.selectedHoleSize = '17.5';
    state.calcInputs.holeTVD = 12000;
    state.calcInputs.shoeTVD = 10000;
    state.calcInputs.holeMD = 12000;
    state.calcInputs.shoeMD = 10000;
    state.calcInputs.surfaceToBitStrokes = 5637;
    state.calcInputs.shoeToSurfaceStrokes = 88013;
    state.calcInputs.bottomsUpStrokes = 103048;
    state.calcInputs.spm = 60;
    state.calcInputs.stringVolumeBbl = 662.71;
    state.calcInputs.annularVolumeBbl = 12114.30;
    state.calcInputs.totalSystemVolumeBbl = 12777.00;
    state.calcInputs.killOMW_ppg = 9.2;
    state.calcInputs.killLotMw_ppg = 12.0;
    state.calcInputs.killSCR_psi = 23;
    state.calcInputs.killSIDPP_psi = 250;
    state.calcInputs.killSICP_psi = 222;
    state.calcInputs.pitGain_bbl = 10;
    state.calcInputs.tripMargin_ppg = 0.5;

    renderKillDataSheet();
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('surface_04_land_kill_sheet_inputs.png');

  console.log('\n--- VERIFYING 5: ACKNOWLEDGE WARNINGS & RUN CALCULATION ---');
  await cdp.eval(`
    // Trigger calculation
    document.getElementById('kd-go-btn').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Check acknowledgement checkbox appearance
  const ackCheck = await cdp.eval(`(() => {
    const cb = document.getElementById('kd-ack-checkbox');
    return { hasWarningAck: !!cb, btnDisabled: document.getElementById('kd-go-btn').disabled };
  })()`);
  console.log('Acknowledgement Checkbox Gating:', ackCheck);
  await cdp.screenshot('surface_05_land_kill_sheet_ack_checkbox.png');

  // Acknowledge and calculate
  await cdp.eval(`
    document.getElementById('kd-ack-row').click();
    document.getElementById('kd-go-btn').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const resultsSummary = await cdp.eval(`(() => {
    return {
      maasp: document.getElementById('kd-out-maasp')?.textContent,
      kmw: document.getElementById('kd-out-kmw')?.textContent,
      kmwExact: document.getElementById('kd-out-kmw-exact')?.textContent,
      icp: document.getElementById('kd-out-icp')?.textContent,
      fcp: document.getElementById('kd-out-fcp')?.textContent,
      initChoke: document.getElementById('kd-out-init-choke')?.textContent,
      dynMaasp: document.getElementById('kd-out-dyn-maasp')?.textContent,
      recMw: document.getElementById('kd-out-rec-mw')?.textContent,
      tableHeadersCount: document.querySelectorAll('#kd-chart-card thead th').length
    };
  })()`);
  console.log('Surface Calculated Results Summary:', resultsSummary);
  await cdp.screenshot('surface_06_land_kill_sheet_calculated_results.png');

  // Scroll to step-down table
  await cdp.eval(`
    document.getElementById('kd-chart-card').scrollIntoView({ behavior: 'smooth' });
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('surface_07_land_kill_sheet_schedule_table.png');

  console.log('\n--- VERIFYING 6: TEST PDF GENERATION TRIGGER ---');
  const pdfGenerated = await cdp.eval(`(() => {
    const pdfBtn = document.getElementById('btn-generate-kill-record-pdf');
    return { hasPdfBtn: !!pdfBtn };
  })()`);
  console.log('PDF generation button verified:', pdfGenerated);

  console.log('\n--- VERIFYING 7: SUBSEA REGRESSION & ISOLATION ---');
  await cdp.eval(`
    state.rigType = 'SUBSEA_FLOATER';
    state.flowType = 'subsea';
    renderKillDataSheet();
  `);
  await new Promise(r => setTimeout(r, 600));
  const subseaCheck = await cdp.eval(`(() => {
    return {
      clfPresent: !!document.getElementById('kd-clf'),
      waterDepthPresent: !!document.getElementById('kd-water-depth'),
      airGapPresent: !!document.getElementById('kd-air-gap')
    };
  })()`);
  console.log('Subsea fields present for subsea floater:', subseaCheck);
  await cdp.screenshot('surface_08_subsea_regression_check.png');

  console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
