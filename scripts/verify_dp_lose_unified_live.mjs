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

  // 1. Open Calculation Hub -> Drilling Calculations -> Category 5 (Tripping Operations)
  console.log('Navigating to Tripping Operations...');
  const catItems = await evaluate(`
    (function() {
      if (typeof openDrillingCalcHub === 'function') openDrillingCalcHub();
      if (typeof openCalcHubCategory === 'function') openCalcHubCategory('drilling');
      const cat5 = document.getElementById('calc-cat-4');
      if (cat5) {
        if (!cat5.classList.contains('expanded')) {
          const header = cat5.querySelector('.guide-category-header');
          if (header) header.click();
        }
      }
      return {
        cat5Found: !!cat5,
        itemsText: cat5 ? cat5.innerText : 'none'
      };
    })()
  `);
  console.log('Category 5 items:', catItems);

  await new Promise(r => setTimeout(r, 600));
  await capture('01_tripping_operations_unified_list.png');

  // 2. Open "Drill Pipe Pulled to Lose Hydrostatic Pressure"
  console.log('Opening Drill Pipe Pulled to Lose Hydrostatic Pressure...');
  const openRes = await evaluate(`
    (function() {
      if (typeof openFormulaDirectly === 'function') {
        openFormulaDirectly('dp_pulled_lose');
      }
      return {
        formulaId: calcSubState.formulaId,
        title: document.querySelector('#screen-drilling-calc h4')?.innerText,
        desc: document.getElementById('calc-formula-desc')?.innerText,
        output: document.getElementById('calc-output-val')?.innerText
      };
    })()
  `);
  console.log('Opened formula (Dry Pipe default):', openRes);

  await new Promise(r => setTimeout(r, 600));
  await capture('02_dp_pulled_lose_dry_light.png');

  // 3. Switch to Wet Pipe
  console.log('Switching to Wet Pipe mode...');
  const wetRes = await evaluate(`
    (function() {
      const wetBtn = document.getElementById('btn-pipe_mode-wet');
      if (wetBtn) wetBtn.click();
      return {
        title: document.querySelector('#screen-drilling-calc h4')?.innerText,
        desc: document.getElementById('calc-formula-desc')?.innerText,
        output: document.getElementById('calc-output-val')?.innerText,
        capVisible: document.getElementById('form-group-cap')?.style.display !== 'none'
      };
    })()
  `);
  console.log('Wet Pipe mode:', wetRes);

  await new Promise(r => setTimeout(r, 600));
  await capture('03_dp_pulled_lose_wet_light.png');

  // 4. Test Calculate from Diameters toggle in Wet mode
  console.log('Toggling Calculate from diameters switch...');
  const diamRes = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_diam_toggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        output: document.getElementById('calc-output-val')?.innerText,
        details: document.getElementById('calc-output-details')?.innerText
      };
    })()
  `);
  console.log('Diameters toggle ON:', diamRes);

  await new Promise(r => setTimeout(r, 600));
  await capture('04_dp_pulled_lose_diam_toggle.png');

  // 5. Dark Mode verification
  console.log('Switching to Dark Mode...');
  await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'dark');
      const dryBtn = document.getElementById('btn-pipe_mode-dry');
      if (dryBtn) dryBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await capture('05_dp_pulled_lose_dry_dark.png');

  // 6. Switch to Hindi (hi) localization test
  console.log('Switching to Hindi...');
  const hiRes = await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'light');
      if (window.I18n && typeof window.I18n.setLanguage === 'function') {
        window.I18n.setLanguage('hi');
      }
      return {
        title: document.querySelector('#screen-drilling-calc h4')?.innerText,
        desc: document.getElementById('calc-formula-desc')?.innerText,
        dryBtn: document.getElementById('btn-pipe_mode-dry')?.innerText,
        wetBtn: document.getElementById('btn-pipe_mode-wet')?.innerText
      };
    })()
  `);
  console.log('Hindi localization:', hiRes);

  await new Promise(r => setTimeout(r, 600));
  await capture('06_dp_pulled_lose_hindi.png');

  // Restore English
  await evaluate(`
    if (window.I18n && typeof window.I18n.setLanguage === 'function') {
      window.I18n.setLanguage('en');
    }
  `);

  ws.close();
  console.log('CDP verification completed successfully!');
}

run().catch(err => {
  console.error('Error during CDP verification:', err);
  process.exit(1);
});
