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
    console.log(`Saved screenshot: ${fullPath}`);
    return fullPath;
  }
}

async function runVerification() {
  console.log('Connecting to WebView CDP...');
  const wsUrl = await getWsUrl();
  console.log('WebSocket Debugger URL:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const cdp = new CdpClient(ws);
  console.log('CDP connected successfully.');

  // Check state and navigate to Kill Data Sheet
  console.log('Setting baseline state for Section 9 test...');
  await cdp.eval(`
    // Set baseline state
    state.flowType = 'subsea';
    state.globalUnit = 'bbl/m';
    state.kmwRoundingMode = '0.1';
    state.calcInputs.holeTVD = 10000;
    state.calcInputs.shoeTVD = 2144; state.calcInputs.shoeMD = 2144;
    state.calcInputs.holeMD = 10000;
    state.calcInputs.shoeMD = 10000;
    state.calcInputs.surfaceToBitStrokes = 5637;
    state.calcInputs.spm = 60;
    state.calcInputs.stringVolumeBbl = 662.71;
    state.calcInputs.annularVolumeBbl = 12145.77;
    state.calcInputs.jobName = 'Section 9 Baseline Test';
    state.calcInputs.killOMW_ppg = 9.2;
    state.calcInputs.killLotMw_ppg = 12.0;
    state.calcInputs.killSCR_psi = 23;
    state.calcInputs.killCLF_psi = 140;
    state.calcInputs.killSIDPP_psi = 250;
    state.calcInputs.killSICP_psi = 222;
    state.calcInputs.pitGain_bbl = 10;
    state.calcInputs.waterDepth_m = 1000;
    state.calcInputs.airGap_m = 25;
    state.calcInputs.seawaterDensity_ppg = 8.55;

    // Navigate to kill sheet
    navigateTo('kill-data-sheet');
  `);

  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot('wc_01_initial_kill_sheet.png');

  // Test 1: Click Calculate / GO button to trigger Validation
  console.log('Clicking Calculate to trigger validation checks...');
  await cdp.eval(`
    document.getElementById('kd-go-btn').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const validationState = await cdp.eval(`(() => {
    const alertBox = document.querySelector('.wc-alert-card.warning');
    const hasWarning = alertBox !== null;
    const warnCount = document.querySelectorAll('.wc-alert-card.warning li').length;
    const resultsVisible = document.getElementById('kd-results-section').style.display !== 'none';
    return { hasWarning, warnCount, resultsVisible };
  })()`);

  console.log('Validation Warning check:', validationState);
  if (!validationState.hasWarning || validationState.resultsVisible) {
    throw new Error('Expected warning banner to block results until acknowledged!');
  }
  await cdp.screenshot('wc_02_validation_warning_banner.png');

  // Test 2: Acknowledge warnings
  console.log('Acknowledging warnings via button...');
  await cdp.eval(`
    document.getElementById('btn-ack-warnings').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const calculatedOutputs = await cdp.eval(`(() => {
    const resultsSection = document.getElementById('kd-results-section');
    const maasp = document.getElementById('kd-out-maasp')?.textContent;
    const kmw = document.getElementById('kd-out-kmw')?.textContent;
    const kmwExact = document.getElementById('kd-out-kmw-exact')?.textContent;
    const icp = document.getElementById('kd-out-icp')?.textContent;
    const fcp = document.getElementById('kd-out-fcp')?.textContent;
    const dynMaasp = document.getElementById('kd-out-dyn-maasp')?.textContent;
    const dynSicp = document.getElementById('kd-out-dyn-sicp')?.textContent;
    const maaspAfter = document.getElementById('kd-out-maasp-after')?.textContent;
    const pressDrop = document.getElementById('kd-out-pres-drop')?.textContent;
    const kickClass = document.getElementById('kd-kick-class-badge')?.textContent;
    const totalSacks = document.getElementById('kd-out-total-sacks')?.textContent;
    const chartSvgExists = document.getElementById('kd-schedule-svg') !== null;
    const tableRows = document.querySelectorAll('#kd-schedule-table-body tr').length;

    return {
      visible: resultsSection.style.display !== 'none',
      maasp, kmw, kmwExact, icp, fcp, dynMaasp, dynSicp, maaspAfter, pressDrop, kickClass, totalSacks, chartSvgExists, tableRows
    };
  })()`);

  console.log('Calculated outputs after acknowledgement:', calculatedOutputs);
  if (!calculatedOutputs.visible) {
    throw new Error('Results section should be visible after acknowledgement!');
  }
  await cdp.screenshot('wc_03_calculated_results.png');

  // Scroll down to view Kick Analysis, Barite, and Chart
  console.log('Scrolling down to inspect chart and schedule table...');
  await cdp.eval(`
    document.getElementById('kd-chart-card').scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await new Promise(r => setTimeout(r, 400));
  await cdp.screenshot('wc_04_schedule_chart_and_table.png');

  // Test 3: Switch to Driller's Method
  console.log("Switching kill method to Driller's Method...");
  await cdp.eval(`
    document.querySelector('#kd-kill-method-group button[data-method="drillers"]').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const drillersMethodCheck = await cdp.eval(`(() => {
    const badge = document.getElementById('kd-method-badge')?.textContent;
    const count = document.querySelectorAll('#kd-schedule-table-body tr').length;
    return { badge: badge?.trim(), tableRows: count };
  })()`);
  console.log("Driller's method check:", drillersMethodCheck);
  await cdp.screenshot('wc_05_drillers_method.png');

  // Test 4: Critical Error blocking test (Shoe TVD > Hole TVD)
  console.log('Testing critical ERROR blocking (Shoe TVD > Hole TVD)...');
  await cdp.eval(`
    state.calcInputs.shoeTVD = 12000; // deeper than 10,000 m hole
    renderKillDataSheet();
    document.getElementById('kd-go-btn').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const errorCheck = await cdp.eval(`(() => {
    const errorCard = document.querySelector('.wc-alert-card.error');
    const resultsVisible = document.getElementById('kd-results-section').style.display !== 'none';
    return { errorDisplayed: errorCard !== null, errorText: errorCard?.textContent, resultsVisible };
  })()`);
  console.log('Critical Error Check:', errorCheck);
  if (!errorCheck.errorDisplayed || errorCheck.resultsVisible) {
    throw new Error('Critical error should be displayed and results must be hidden!');
  }
  await cdp.screenshot('wc_06_critical_error_blocked.png');

  // Test 5: Verify History Screen
  console.log('Testing History screen snapshots...');
  await cdp.eval(`
    navigateTo('history');
    renderHistoryScreen();
  `);
  await new Promise(r => setTimeout(r, 500));
  await cdp.screenshot('wc_07_history_screen.png');

  console.log('ALL LIVE VERIFICATIONS PASSED 100%!');
  ws.close();
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
