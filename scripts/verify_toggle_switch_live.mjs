import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw new Error('No webview page found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP');

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (r.exceptionDetails) {
      throw new Error(JSON.stringify(r.exceptionDetails));
    }
    return r.result ? r.result.value : undefined;
  };

  const capture = async (filename) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(r.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath}`);
    return outPath;
  };

  // Ensure Light theme & English
  await evaluate(`
    document.documentElement.setAttribute('data-theme', 'light');
    if (window.I18n && typeof window.I18n.setLanguage === 'function') {
      window.I18n.setLanguage('en');
    }
  `);

  // 1. Open Feet of Drill Pipe Pulled (Dry mode, toggle OFF)
  console.log('Opening Feet of Drill Pipe Pulled (Dry mode, toggle OFF)...');
  const dryOff = await evaluate(`
    (function() {
      if (typeof openFormulaDirectly === 'function') {
        openFormulaDirectly('pipe_pulled');
      }
      const dryBtn = document.getElementById('btn-pipe_mode-dry');
      if (dryBtn) dryBtn.click();
      const toggle = document.getElementById('inp-calc_disp_toggle');
      if (toggle && toggle.checked) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        formulaId: calcSubState.formulaId,
        title: document.querySelector('#screen-drilling-calc h4')?.innerText,
        toggleLabel: document.querySelector('#form-group-calc_disp_toggle label:first-child')?.innerText,
        toggleChecked: document.getElementById('inp-calc_disp_toggle')?.checked,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('Dry mode OFF state:', dryOff);
  await new Promise(r => setTimeout(r, 600));
  await capture('01_pipe_pulled_toggle_off_light.png');

  // 2. Switch toggle to ON state (Dry mode)
  console.log('Switching toggle to ON state (Dry mode)...');
  const dryOn = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        toggleChecked: document.getElementById('inp-calc_disp_toggle')?.checked,
        odVal: document.getElementById('inp-od')?.value,
        idVal: document.getElementById('inp-id')?.value,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('Dry mode ON state:', dryOn);
  await new Promise(r => setTimeout(r, 600));
  await capture('02_pipe_pulled_toggle_on_light.png');

  // 3. Switch to Wet mode (toggle OFF)
  console.log('Switching to Wet mode (toggle OFF)...');
  const wetOff = await evaluate(`
    (function() {
      const wetBtn = document.getElementById('btn-pipe_mode-wet');
      if (wetBtn) wetBtn.click();
      const toggle = document.getElementById('inp-calc_disp_toggle');
      if (toggle && toggle.checked) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        toggleLabel: document.querySelector('#form-group-calc_disp_toggle label:first-child')?.innerText,
        toggleChecked: document.getElementById('inp-calc_disp_toggle')?.checked,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('Wet mode OFF state:', wetOff);
  await new Promise(r => setTimeout(r, 600));
  await capture('03_pipe_pulled_wet_toggle_off_light.png');

  // 4. Switch toggle to ON state (Wet mode)
  console.log('Switching toggle to ON state (Wet mode)...');
  const wetOn = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        toggleChecked: document.getElementById('inp-calc_disp_toggle')?.checked,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('Wet mode ON state:', wetOn);
  await new Promise(r => setTimeout(r, 600));
  await capture('04_pipe_pulled_wet_toggle_on_light.png');

  // 5. Open Drill Pipe Pulled to Lose Hydrostatic Pressure (toggle OFF and ON)
  console.log('Opening Drill Pipe Pulled to Lose Hydrostatic Pressure...');
  const dpLoseOff = await evaluate(`
    (function() {
      if (typeof openFormulaDirectly === 'function') {
        openFormulaDirectly('dp_pulled_lose');
      }
      const dryBtn = document.getElementById('btn-pipe_mode-dry');
      if (dryBtn) dryBtn.click();
      const toggle = document.getElementById('inp-calc_diam_toggle');
      if (toggle && toggle.checked) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        title: document.querySelector('#screen-drilling-calc h4')?.innerText,
        toggleLabel: document.querySelector('#form-group-calc_diam_toggle label:first-child')?.innerText,
        toggleChecked: document.getElementById('inp-calc_diam_toggle')?.checked,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('DP Lose OFF state:', dpLoseOff);
  await new Promise(r => setTimeout(r, 600));
  await capture('05_dp_lose_toggle_off_light.png');

  const dpLoseOn = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_diam_toggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        toggleChecked: document.getElementById('inp-calc_diam_toggle')?.checked,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('DP Lose ON state:', dpLoseOn);
  await new Promise(r => setTimeout(r, 600));
  await capture('06_dp_lose_toggle_on_light.png');

  // 6. Dark mode: Feet of Drill Pipe Pulled
  console.log('Switching to Dark Mode...');
  await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (typeof openFormulaDirectly === 'function') {
        openFormulaDirectly('pipe_pulled');
      }
      const dryBtn = document.getElementById('btn-pipe_mode-dry');
      if (dryBtn) dryBtn.click();
      const toggle = document.getElementById('inp-calc_disp_toggle');
      if (toggle && toggle.checked) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('07_pipe_pulled_toggle_off_dark.png');

  await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('08_pipe_pulled_toggle_on_dark.png');

  // 7. Hindi localization verification
  console.log('Verifying Hindi localization...');
  const hiVerify = await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'light');
      if (window.I18n && typeof window.I18n.setLanguage === 'function') {
        window.I18n.setLanguage('hi');
      }
      return {
        title: document.querySelector('#screen-drilling-calc h4')?.innerText,
        toggleLabel: document.querySelector('#form-group-calc_disp_toggle label:first-child')?.innerText,
        toggleChecked: document.getElementById('inp-calc_disp_toggle')?.checked
      };
    })()
  `);
  console.log('Hindi verification:', hiVerify);
  await new Promise(r => setTimeout(r, 600));
  await capture('09_pipe_pulled_toggle_hindi.png');

  // Restore English
  await evaluate(`
    if (window.I18n && typeof window.I18n.setLanguage === 'function') {
      window.I18n.setLanguage('en');
    }
  `);

  ws.close();
  console.log('All live verifications completed successfully!');
}

run().catch(err => {
  console.error('Error during live verification:', err);
  process.exit(1);
});
