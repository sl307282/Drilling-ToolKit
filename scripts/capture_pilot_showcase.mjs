import { execSync } from 'child_process';

const ARTIFACT_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';
const ADB = '~/Library/Android/sdk/platform-tools/adb';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function evalInWebView(code) {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw new Error('No WebView page found');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: code,
          returnByValue: true,
          awaitPromise: true
        }
      }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === 1) {
        ws.close();
        if (data.result.exceptionDetails) {
          reject(new Error(JSON.stringify(data.result.exceptionDetails)));
        } else {
          resolve(data.result.result.value);
        }
      }
    };
    ws.onerror = (err) => reject(err);
  });
}

function takeScreenshot(filename) {
  const targetPath = `${ARTIFACT_DIR}/${filename}`;
  execSync(`${ADB} exec-out screencap -p > "${targetPath}"`);
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  console.log('Starting automated pilot verification & screenshot capture...');

  await evalInWebView(`window.location.reload();`);
  await sleep(1500);

  // 1. Settings - Mixed Units
  await evalInWebView(`
    {
      window.navigateTo('settings');
      const mixedBtn = document.querySelector('#settings-unit-system-control button[data-system="mixed"]');
      if (mixedBtn) mixedBtn.click();
    }
  `);
  await sleep(1000);
  takeScreenshot('54_settings_mixed_units.png');

  // 2. Settings - Oilfield Units (API)
  await evalInWebView(`
    const apiBtn = document.querySelector('#settings-unit-system-control button[data-system="api"]');
    if (apiBtn) apiBtn.click();
  `);
  await sleep(1000);
  takeScreenshot('55_settings_api_units.png');

  // 3. Surface Cementing in API Mode (Conductor Jackup)
  await evalInWebView(`
    window.navigateTo('cement-planner-surface');
    if (typeof selectSurfacePreset === 'function') {
      selectSurfacePreset('conductor');
    }
    if (typeof surfaceGoToView === 'function') {
      surfaceGoToView('results');
    }
  `);
  await sleep(1500);
  takeScreenshot('56_surface_conductor_api_results.png');

  // 4. Settings - Metric Units (SI)
  await evalInWebView(`
    window.navigateTo('settings');
    const siBtn = document.querySelector('#settings-unit-system-control button[data-system="si"]');
    if (siBtn) siBtn.click();
  `);
  await sleep(1000);
  takeScreenshot('57_settings_si_units.png');

  // 5. Surface Cementing in SI Mode (Conductor Jackup)
  await evalInWebView(`
    window.navigateTo('cement-planner-surface');
    if (typeof selectSurfacePreset === 'function') {
      selectSurfacePreset('conductor');
    }
    if (typeof surfaceGoToView === 'function') {
      surfaceGoToView('results');
    }
  `);
  await sleep(1500);
  takeScreenshot('58_surface_conductor_si_results.png');

  // 6. Subsea Cementing in SI Mode (13-3/8" Casing)
  await evalInWebView(`
    {
      window.navigateTo('cement-planner-subsea');
      const card = document.querySelector('.cement-section-card[data-section="13.375"]');
      if (card) card.click();
    }
  `);
  await sleep(1000);
  await evalInWebView(`
    {
      const saveBtn = document.querySelector('#btn-save-reference-wizard');
      if (saveBtn) saveBtn.click();
      const useBtn = document.querySelector('#btn-use-reference-wizard');
      if (useBtn) useBtn.click();
    }
  `);
  await sleep(1000);
  await evalInWebView(`
    {
      const resBtn = document.querySelector('#btn-go-to-results');
      if (resBtn) resBtn.click();
    }
  `);
  await sleep(1500);
  takeScreenshot('59_subsea_13_38_si_results.png');

  // 7. Subsea Schematic in SI Mode
  await evalInWebView(`
    {
      const schemAccordion = document.getElementById('cement-schematic-accordion');
      if (schemAccordion) {
        if (!schemAccordion.classList.contains('open')) {
          const headerBtn = document.getElementById('schematic-header-btn');
          if (headerBtn) headerBtn.click();
        }
        schemAccordion.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
  `);
  await sleep(1500);
  takeScreenshot('60_subsea_schematic_si_results.png');

  // 8. Return to Settings & restore Mixed Mode
  await evalInWebView(`
    {
      window.navigateTo('settings');
      const mb = document.querySelector('#settings-unit-system-control button[data-system="mixed"]');
      if (mb) mb.click();
    }
  `);
  await sleep(1000);
  takeScreenshot('61_settings_restored_mixed.png');

  console.log('All automated screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
