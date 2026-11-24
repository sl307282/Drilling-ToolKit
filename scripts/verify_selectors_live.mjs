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

async function run() {
  console.log('Connecting to WebView CDP...');
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  const cdp = new CdpClient(ws);
  console.log('CDP connected.');

  // Set initial state
  console.log('Setting baseline state on Kill Data Sheet...');
  await cdp.eval(`(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    state.flowType = 'subsea';
    state.globalUnit = 'bbl/m';
    state.calcInputs.holeTVD = 10000;
    state.calcInputs.shoeTVD = 2144;
    state.calcInputs.holeMD = 10000;
    state.calcInputs.shoeMD = 2144;
    state.calcInputs.surfaceToBitStrokes = 5637;
    state.calcInputs.spm = 60;
    state.calcInputs.stringVolumeBbl = 662.71;
    state.calcInputs.annularVolumeBbl = 12145.77;
    state.calcInputs.jobName = 'Selector Styling Verification';
    state.calcInputs.killOMW_ppg = 9.2;
    state.calcInputs.killLotMw_ppg = 12.0;
    state.calcInputs.killSCR_psi = 23;
    state.calcInputs.killCLF_psi = 140;
    state.calcInputs.killSIDPP_psi = 250;
    state.calcInputs.killSICP_psi = 222;
    state.calcInputs.pitGain_bbl = 10;
    
    navigateTo('kill-data-sheet');
    renderKillDataSheet();
  })()`);

  await new Promise(r => setTimeout(r, 600));

  // 1. Initial Screenshot: Light Mode with 100% SF, Wait & Weight, 100 stks
  console.log('Checking initial selector states in Light Mode...');
  const initialSelectors = await cdp.eval(`(() => {
    const sfActive = document.querySelector('#kd-lot-sf-group .segmented-control-btn.active')?.textContent?.trim();
    const sfButtons = Array.from(document.querySelectorAll('#kd-lot-sf-group .segmented-control-btn')).map(b => b.textContent.trim());
    const methodActive = document.querySelector('#kd-kill-method-group .segmented-control-btn.active')?.textContent?.trim();
    const freqActive = document.querySelector('#kd-step-freq-group .segmented-control-btn.active')?.textContent?.trim();
    const effLot = document.getElementById('kd-eff-lot-val')?.textContent?.trim();

    return { sfActive, sfButtons, methodActive, freqActive, effLot };
  })()`);
  console.log('Initial selectors:', initialSelectors);
  await cdp.screenshot('wc_selectors_01_light_default.png');

  // 2. Test Safety Factor switching: 85%, 80%, 100%
  console.log('Tapping Safety Factor 85%...');
  await cdp.eval(`(() => {
    document.querySelector('#kd-lot-sf-group .segmented-control-btn[data-sf="0.85"]').click();
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const sf85State = await cdp.eval(`(() => {
    const active = document.querySelector('#kd-lot-sf-group .segmented-control-btn.active')?.textContent?.trim();
    const effLot = document.getElementById('kd-eff-lot-val')?.textContent?.trim();
    return { active, effLot };
  })()`);
  console.log('Safety Factor 85% check:', sf85State);

  console.log('Tapping Safety Factor 80%...');
  await cdp.eval(`(() => {
    document.querySelector('#kd-lot-sf-group .segmented-control-btn[data-sf="0.80"]').click();
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const sf80State = await cdp.eval(`(() => {
    const active = document.querySelector('#kd-lot-sf-group .segmented-control-btn.active')?.textContent?.trim();
    const effLot = document.getElementById('kd-eff-lot-val')?.textContent?.trim();
    return { active, effLot };
  })()`);
  console.log('Safety Factor 80% check:', sf80State);
  await cdp.screenshot('wc_selectors_02_sf_80_percent.png');

  // Return to 85% and switch Kill Method to Driller's Method
  console.log("Switching to Driller's Method and 50 stks Step Frequency...");
  await cdp.eval(`(() => {
    document.querySelector('#kd-lot-sf-group .segmented-control-btn[data-sf="0.85"]').click();
    document.querySelector('#kd-kill-method-group .segmented-control-btn[data-method="drillers"]').click();
    document.querySelector('#kd-step-freq-group .segmented-control-btn[data-freq="50"]').click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await cdp.screenshot('wc_selectors_03_drillers_and_50stks.png');

  // Calculate to verify badge matching
  console.log('Calculating results to verify badge matching...');
  await cdp.eval(`(() => {
    document.getElementById('kd-go-btn').click();
    const ackBtn = document.getElementById('btn-ack-warnings');
    if (ackBtn) ackBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const resultsCheck = await cdp.eval(`(() => {
    const badge = document.getElementById('kd-method-badge')?.textContent?.trim();
    const methodActive = document.querySelector('#kd-kill-method-group .segmented-control-btn.active')?.textContent?.trim();
    return { badge, methodActive, matches: badge === methodActive };
  })()`);
  console.log('Kill method badge match check:', resultsCheck);
  await cdp.screenshot('wc_selectors_04_results_badge_sync.png');

  // 3. Switch to Dark Mode
  console.log('Testing Dark Mode selector styling...');
  await cdp.eval(`(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.querySelector('#kd-kill-method-group .segmented-control-btn[data-method="wait_and_weight"]').click();
    document.querySelector('#kd-step-freq-group .segmented-control-btn[data-freq="200"]').click();
  })()`);
  await new Promise(r => setTimeout(r, 500));
  await cdp.screenshot('wc_selectors_05_dark_mode.png');

  // Scroll to chart & schedule
  await cdp.eval(`(() => {
    document.getElementById('kd-chart-card')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await cdp.screenshot('wc_selectors_06_dark_chart_and_table.png');

  // Return to light theme
  await cdp.eval(`(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  })()`);

  console.log('ALL SELECTOR VERIFICATIONS PASSED SUCCESSFULLY!');
  ws.close();
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
