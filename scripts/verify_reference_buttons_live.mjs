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

async function run() {
  console.log('Connecting to WebView CDP...');
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const cdp = new CdpClient(ws);
  console.log('CDP connected.');

  console.log('\n--- TEST 1: SURFACE FLOW - INITIAL STATE ---');
  await cdp.eval(`(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    state.currentFlow = 'calculator';
    state.flowType = 'surface';
    state.rigType = 'LAND';
    state.selectedHoleSize = '17.5';
    navigateTo('surface-ref-values');
  })()`);
  await new Promise(r => setTimeout(r, 600));

  // Scroll to buttons
  await cdp.eval(`(() => {
    const btn = document.querySelector('#ref-values-container-surface .ref-save-btn');
    if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const initialSurface = await cdp.eval(`(() => {
    const saveBtn = document.querySelector('#ref-values-container-surface .ref-save-btn');
    const useBtn = document.querySelector('#ref-values-container-surface .ref-use-btn');
    return {
      save: {
        text: saveBtn?.textContent.trim(),
        isPrimary: saveBtn?.classList.contains('btn-primary'),
        isSecondary: saveBtn?.classList.contains('btn-secondary'),
        disabled: saveBtn?.disabled
      },
      use: {
        text: useBtn?.textContent.trim(),
        isPrimary: useBtn?.classList.contains('btn-primary'),
        isSecondary: useBtn?.classList.contains('btn-secondary'),
        disabled: useBtn?.disabled
      }
    };
  })()`);
  console.log('Surface Initial State:', initialSurface);
  if (!initialSurface.save.isPrimary || initialSurface.save.disabled) {
    throw new Error('Save as Reference should be primary and enabled initially');
  }
  if (!initialSurface.use.isSecondary || !initialSurface.use.disabled) {
    throw new Error('Use Reference should be secondary and disabled initially');
  }
  await cdp.screenshot('ref_01_surface_initial_state.png');

  console.log('\n--- TEST 2: SURFACE FLOW - CLICK "SAVE AS REFERENCE" ---');
  await cdp.eval(`(() => {
    document.querySelector('#ref-values-container-surface .ref-save-btn').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const afterSaveSurface = await cdp.eval(`(() => {
    const saveBtn = document.querySelector('#ref-values-container-surface .ref-save-btn');
    const useBtn = document.querySelector('#ref-values-container-surface .ref-use-btn');
    return {
      save: {
        text: saveBtn?.textContent.trim(),
        isPrimary: saveBtn?.classList.contains('btn-primary'),
        isSecondary: saveBtn?.classList.contains('btn-secondary'),
        disabled: saveBtn?.disabled
      },
      use: {
        text: useBtn?.textContent.trim(),
        isPrimary: useBtn?.classList.contains('btn-primary'),
        isSecondary: useBtn?.classList.contains('btn-secondary'),
        disabled: useBtn?.disabled
      }
    };
  })()`);
  console.log('Surface After Save:', afterSaveSurface);
  if (!afterSaveSurface.save.isSecondary || afterSaveSurface.save.disabled) {
    throw new Error('Save as Reference should be secondary and enabled after saving');
  }
  if (!afterSaveSurface.use.isPrimary || afterSaveSurface.use.disabled) {
    throw new Error('Use Reference should be primary and enabled after saving');
  }
  await cdp.screenshot('ref_02_surface_after_save.png');

  console.log('\n--- TEST 3: SURFACE FLOW - EDIT VALUE REVERTS BUTTON STATES ---');
  await cdp.eval(`(() => {
    const input = document.querySelector('#ref-values-container-surface #cap-dp-input');
    if (input) {
      input.value = '10.555';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await new Promise(r => setTimeout(r, 400));

  const afterEditSurface = await cdp.eval(`(() => {
    const saveBtn = document.querySelector('#ref-values-container-surface .ref-save-btn');
    const useBtn = document.querySelector('#ref-values-container-surface .ref-use-btn');
    return {
      save: {
        isPrimary: saveBtn?.classList.contains('btn-primary'),
        isSecondary: saveBtn?.classList.contains('btn-secondary'),
        disabled: saveBtn?.disabled
      },
      use: {
        isPrimary: useBtn?.classList.contains('btn-primary'),
        isSecondary: useBtn?.classList.contains('btn-secondary'),
        disabled: useBtn?.disabled
      }
    };
  })()`);
  console.log('Surface After Edit Reverts:', afterEditSurface);
  if (!afterEditSurface.save.isPrimary || afterEditSurface.save.disabled) {
    throw new Error('Save as Reference should revert to primary/enabled on edit');
  }
  if (!afterEditSurface.use.isSecondary || !afterEditSurface.use.disabled) {
    throw new Error('Use Reference should revert to disabled on edit');
  }
  await cdp.screenshot('ref_03_surface_after_edit_reverts.png');

  console.log('\n--- TEST 4: SURFACE FLOW - RE-SAVE AND NAVIGATE VIA USE REFERENCE ---');
  await cdp.eval(`(() => {
    document.querySelector('#ref-values-container-surface .ref-save-btn').click();
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await cdp.eval(`(() => {
    document.querySelector('#ref-values-container-surface .ref-use-btn').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const navResult = await cdp.eval(`(() => {
    return {
      currentScreen: state.currentScreen,
      calcScreenVisible: !document.getElementById('screen-surface-calculations').classList.contains('hidden')
    };
  })()`);
  console.log('Navigation to Calculations:', navResult);
  await cdp.screenshot('ref_04_surface_nav_calculations.png');

  console.log('\n--- TEST 5: SUBSEA FLOW - INITIAL STATE ---');
  await cdp.eval(`(() => {
    state.flowType = 'subsea';
    state.rigType = 'SUBSEA_FLOATER';
    state.selectedHoleSize = '17.5';
    navigateTo('subsea-ref-values');
  })()`);
  await new Promise(r => setTimeout(r, 600));

  // Scroll to buttons
  await cdp.eval(`(() => {
    const btn = document.querySelector('#ref-values-container-subsea .ref-save-btn');
    if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);
  await new Promise(r => setTimeout(r, 300));

  const initialSubsea = await cdp.eval(`(() => {
    const saveBtn = document.querySelector('#ref-values-container-subsea .ref-save-btn');
    const useBtn = document.querySelector('#ref-values-container-subsea .ref-use-btn');
    return {
      save: {
        text: saveBtn?.textContent.trim(),
        isPrimary: saveBtn?.classList.contains('btn-primary'),
        isSecondary: saveBtn?.classList.contains('btn-secondary'),
        disabled: saveBtn?.disabled
      },
      use: {
        text: useBtn?.textContent.trim(),
        isPrimary: useBtn?.classList.contains('btn-primary'),
        isSecondary: useBtn?.classList.contains('btn-secondary'),
        disabled: useBtn?.disabled
      }
    };
  })()`);
  console.log('Subsea Initial State:', initialSubsea);
  if (!initialSubsea.save.isPrimary || initialSubsea.save.disabled) {
    throw new Error('Subsea: Save as Reference should be primary and enabled initially');
  }
  if (!initialSubsea.use.isSecondary || !initialSubsea.use.disabled) {
    throw new Error('Subsea: Use Reference should be secondary and disabled initially');
  }
  await cdp.screenshot('ref_05_subsea_initial_state.png');

  console.log('\n--- TEST 6: SUBSEA FLOW - CLICK "SAVE AS REFERENCE" ---');
  await cdp.eval(`(() => {
    document.querySelector('#ref-values-container-subsea .ref-save-btn').click();
  })()`);
  await new Promise(r => setTimeout(r, 600));

  const afterSaveSubsea = await cdp.eval(`(() => {
    const saveBtn = document.querySelector('#ref-values-container-subsea .ref-save-btn');
    const useBtn = document.querySelector('#ref-values-container-subsea .ref-use-btn');
    return {
      save: {
        isPrimary: saveBtn?.classList.contains('btn-primary'),
        isSecondary: saveBtn?.classList.contains('btn-secondary'),
        disabled: saveBtn?.disabled
      },
      use: {
        isPrimary: useBtn?.classList.contains('btn-primary'),
        isSecondary: useBtn?.classList.contains('btn-secondary'),
        disabled: useBtn?.disabled
      }
    };
  })()`);
  console.log('Subsea After Save:', afterSaveSubsea);
  if (!afterSaveSubsea.save.isSecondary || afterSaveSubsea.save.disabled) {
    throw new Error('Subsea: Save as Reference should be secondary and enabled after save');
  }
  if (!afterSaveSubsea.use.isPrimary || afterSaveSubsea.use.disabled) {
    throw new Error('Subsea: Use Reference should be primary and enabled after save');
  }
  await cdp.screenshot('ref_06_subsea_after_save.png');

  console.log('\n--- TEST 7: DARK THEME SUPPORT ---');
  await cdp.eval(`(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  })()`);
  await new Promise(r => setTimeout(r, 400));
  await cdp.screenshot('ref_07_subsea_dark_theme.png');

  console.log('\nALL REFERENCE BUTTON WORKFLOW TESTS PASSED CLEANLY!');
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
