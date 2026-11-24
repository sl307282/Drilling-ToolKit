import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';

http.get('http://127.0.0.1:9222/json', async (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    const targets = JSON.parse(data);
    const wsUrl = targets.find(t => t.type === 'page').webSocketDebuggerUrl;
    const ws = new globalThis.WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const curId = id++;
        const handler = (evt) => {
          const resp = JSON.parse(evt.data);
          if (resp.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    async function evalCode(expr) {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    }

    async function screenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), Buffer.from(res.data, 'base64'));
      console.log('Saved', filename);
    }

    console.log('Navigating to Feet of Drill Pipe Pulled...');
    await evalCode(`(() => {
      state.currentScreen = 'drilling-calc';
      renderScreen();
      openCalculationDetails('dp_pull_dry');
      const toggle = document.querySelector('.calc-toggle-row');
      if (toggle) toggle.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);

    await new Promise(r => setTimeout(r, 600));
    await screenshot('wc_05_dp_pulled_toggle_off.png');

    console.log('Toggling switch ON...');
    await evalCode(`(() => {
      const sw = document.querySelector('#dp-pulled-use-diameters, .calc-toggle-row input[type="checkbox"]');
      if (sw) {
        sw.checked = true;
        sw.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const toggle = document.querySelector('.calc-toggle-row');
      if (toggle) toggle.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);

    await new Promise(r => setTimeout(r, 600));
    await screenshot('wc_06_dp_pulled_toggle_on.png');

    ws.close();
  });
});
