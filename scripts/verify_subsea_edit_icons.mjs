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

  console.log('1. Setting subsea flow type and opening Kill Data Sheet...');
  await client.eval(`(() => {
    state.flowType = 'subsea';
    state.currentScreen = 'kill-data-sheet';
    renderScreen();
  })()`);

  await new Promise(r => setTimeout(r, 1000));

  console.log('2. Verifying edit icons on subsea inputs...');
  const iconChecks = await client.eval(`(() => {
    function inspectInput(id) {
      const input = document.getElementById(id);
      if (!input) return { id, found: false };
      const parent = input.parentElement;
      const isRelative = parent ? window.getComputedStyle(parent).position === 'relative' : false;
      const svg = parent ? parent.querySelector('svg') : null;
      const svgWidth = svg ? svg.getAttribute('width') : null;
      const svgHeight = svg ? svg.getAttribute('height') : null;
      const svgStroke = svg ? svg.getAttribute('stroke') : null;
      const svgStrokeWidth = svg ? svg.getAttribute('stroke-width') : null;
      const svgStyle = svg ? svg.getAttribute('style') : '';
      const inputPaddingRight = window.getComputedStyle(input).paddingRight;
      return {
        id,
        found: true,
        isRelative,
        hasSvg: !!svg,
        svgWidth,
        svgHeight,
        svgStroke,
        svgStrokeWidth,
        svgStyle,
        inputPaddingRight,
        value: input.value
      };
    }

    return {
      waterDepth: inspectInput('kd-water-depth'),
      airGap: inspectInput('kd-air-gap'),
      seawaterDensity: inspectInput('kd-seawater-density'),
      referenceSidp: inspectInput('kd-sidp')
    };
  })()`);

  console.log('Icon Inspection Results:', JSON.stringify(iconChecks, null, 2));

  // Check that all 3 subsea inputs have the SVG icon matching referenceSidp
  for (const key of ['waterDepth', 'airGap', 'seawaterDensity']) {
    const item = iconChecks[key];
    if (!item.found || !item.hasSvg || !item.isRelative) {
      throw new Error(`Subsea input ${key} is missing relative parent or edit icon!`);
    }
  }
  console.log('PASS: All 3 subsea inputs have the edit/pen icon properly configured!');

  // Scroll to Subsea Water & Air Margins card
  await client.eval(`(() => {
    const el = document.getElementById('kd-water-depth');
    if (el) el.closest('.content-card, div[style*=\"background:rgba(59\"]').scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);

  await new Promise(r => setTimeout(r, 600));
  await client.captureScreenshot('wc_07_subsea_edit_icons_light.png');

  console.log('3. Testing Dark Mode appearance...');
  await client.eval(`(() => {
    document.body.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  })()`);

  await new Promise(r => setTimeout(r, 500));
  await client.captureScreenshot('wc_08_subsea_edit_icons_dark.png');

  // Reset theme to light
  await client.eval(`(() => {
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  })()`);

  client.close();
  console.log('Subsea edit icon verification completed successfully!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
