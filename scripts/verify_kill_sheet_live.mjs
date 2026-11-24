import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
          if (!page) reject(new Error('No page target found'));
          else resolve(page.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    const WS = globalThis.WebSocket;
    this.ws = new WS(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const resp = JSON.parse(event.data);
      if (resp.id && this.pending.has(resp.id)) {
        const { resolve, reject } = this.pending.get(resp.id);
        this.pending.delete(resp.id);
        if (resp.error) reject(resp.error);
        else resolve(resp.result);
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
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return outPath;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('Connecting to WebView CDP...');
  const wsUrl = await getWsUrl();
  const client = new CdpClient(wsUrl);
  await client.connect();

  console.log('1. Navigating to Kill Data Sheet screen...');
  await client.eval(`(() => {
    state.currentScreen = 'kill-data-sheet';
    renderScreen();
  })()`);

  await new Promise(r => setTimeout(r, 1000));

  console.log('2. Calculating Kill Sheet to populate chart and table...');
  await client.eval(`(() => {
    const goBtn = document.getElementById('kd-go-btn');
    if (goBtn) goBtn.click();
  })()`);

  await new Promise(r => setTimeout(r, 600));

  await client.eval(`(() => {
    const ackBtn = document.getElementById('btn-ack-warnings');
    if (ackBtn) ackBtn.click();
  })()`);

  await new Promise(r => setTimeout(r, 800));

  console.log('3. Scrolling to Chart...');
  await client.eval(`(() => {
    const svgWrap = document.getElementById('kd-chart-svg-wrapper');
    if (svgWrap) svgWrap.scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);

  await new Promise(r => setTimeout(r, 600));
  await client.captureScreenshot('wc_01_step_down_chart_clarity.png');

  console.log('4. Scrolling to Step-Down Table...');
  await client.eval(`(() => {
    const table = document.querySelector('#kd-chart-card table');
    if (table) table.scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);

  await new Promise(r => setTimeout(r, 600));
  await client.captureScreenshot('wc_02_step_down_table_clarity.png');

  console.log('5. Clicking "Generate Job Record (PDF)"...');
  await client.eval(`(() => {
    const btn = document.getElementById('btn-generate-kill-record-pdf');
    if (btn) {
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
      btn.click();
    }
  })()`);

  // Wait for modal dialog to appear
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 300));
    const modalFound = await client.eval(`(() => {
      const modal = document.getElementById('cement-report-ready-modal');
      return !!modal;
    })()`);
    if (modalFound) {
      console.log('PASS: Report Ready modal is visible!');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 500));
  await client.captureScreenshot('wc_03_job_report_ready_modal.png');

  // Close the modal
  await client.eval(`(() => {
    const modal = document.getElementById('cement-report-ready-modal');
    if (modal) {
      const doneBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Done'));
      if (doneBtn) doneBtn.click();
      else modal.remove();
    }
  })()`);

  client.close();
  console.log('Verification completed!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
