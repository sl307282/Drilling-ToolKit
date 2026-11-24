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
    return res.result ? res.result.value : res;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${filePath}`);
    return filePath;
  }
}

async function run() {
  const wsUrl = await getWsUrl();
  console.log('Connecting to WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => { ws.onopen = resolve; });
  const client = new CdpClient(ws);

  console.log('\n--- STEP 1: Set Default Units and Open Calculation Hub ---');
  await client.eval(`
    if (window.UnitsEngine && typeof window.UnitsEngine.setUnitSystem === 'function') {
      window.UnitsEngine.setUnitSystem('mixed');
    }
    calcSubState.view = 'categories';
    navigateTo('drilling-calc');
  `);
  await new Promise(r => setTimeout(r, 600));

  const hubCategoriesState = await client.eval(`({
    hasCatRiserMargin: !!document.getElementById('cat-riser-margin-btn'),
    riserMarginTitle: document.getElementById('cat-riser-margin-btn')?.querySelector('.card-title')?.innerText,
    riserMarginDesc: document.getElementById('cat-riser-margin-btn')?.querySelector('.card-desc')?.innerText
  })`);
  console.log('Hub Categories State:', hubCategoriesState);
  if (!hubCategoriesState.hasCatRiserMargin) {
    throw new Error('cat-riser-margin-btn was not found in categories view!');
  }

  console.log('\n--- STEP 2: Open Riser Margin Screen ---');
  await client.eval(`document.getElementById('cat-riser-margin-btn').click();`);
  await new Promise(r => setTimeout(r, 600));

  // Verify removed elements: local toggles and top print/pdf buttons
  const uiIntegrity = await client.eval(`({
    view: calcSubState.view,
    hasLocalDepthToggle: !!document.getElementById('seg-riser-depth-unit'),
    hasLocalDensityToggle: !!document.getElementById('seg-riser-density-unit'),
    hasTopPrintBtn: !!document.getElementById('btn-riser-print'),
    hasTopPdfBtn: !!document.getElementById('btn-riser-export-pdf'),
    hasBottomPdfBtn: !!document.getElementById('btn-generate-riser-record-pdf'),
    bottomPdfText: document.getElementById('btn-generate-riser-record-pdf')?.innerText?.trim(),
    bottomPdfHasClass: document.getElementById('btn-generate-riser-record-pdf')?.classList.contains('btn-report-pdf')
  })`);
  console.log('UI Integrity Check:', uiIntegrity);

  if (uiIntegrity.hasLocalDepthToggle) throw new Error('Local depth toggle #seg-riser-depth-unit is still present!');
  if (uiIntegrity.hasLocalDensityToggle) throw new Error('Local density toggle #seg-riser-density-unit is still present!');
  if (uiIntegrity.hasTopPrintBtn) throw new Error('Top print button #btn-riser-print is still present!');
  if (uiIntegrity.hasTopPdfBtn) throw new Error('Top PDF button #btn-riser-export-pdf is still present!');
  if (!uiIntegrity.hasBottomPdfBtn) throw new Error('Bottom PDF action button #btn-generate-riser-record-pdf is missing!');
  if (!uiIntegrity.bottomPdfHasClass) throw new Error('Bottom PDF button does not have class btn-report-pdf!');

  console.log('PASSED: Top toggles and print/PDF buttons successfully removed; bottom action button confirmed.');

  console.log('\n--- STEP 3: Verify Mixed Units (m, ppg) ---');
  const mixedUnitsState = await client.eval(`({
    unitSystem: window.UnitsEngine ? window.UnitsEngine.getUnitSystem() : 'mixed',
    whLabel: document.getElementById('inp-riser-wh-depth')?.parentElement?.querySelector('label')?.innerText,
    whValue: document.getElementById('inp-riser-wh-depth')?.value,
    tdLabel: document.getElementById('inp-riser-td-depth')?.parentElement?.querySelector('label')?.innerText,
    tdValue: document.getElementById('inp-riser-td-depth')?.value,
    mwLabel: document.getElementById('inp-riser-mud-weight')?.parentElement?.querySelector('label')?.innerText,
    mwValue: document.getElementById('inp-riser-mud-weight')?.value,
    recPillDisplay: document.querySelector('#riser-results-container .result-card span[style*="font-size:2.1rem"]')?.innerText,
    hasSchematic840: !!document.querySelector('svg[viewBox="0 0 840 520"]')
  })`);
  console.log('Mixed Units State:', mixedUnitsState);
  if (!mixedUnitsState.whLabel.toUpperCase().includes('(M)')) throw new Error('WH label does not show (m) in Mixed mode');
  if (!mixedUnitsState.mwLabel.toUpperCase().includes('(PPG)')) throw new Error('MW label does not show (ppg) in Mixed mode');
  if (mixedUnitsState.whValue !== '1073') throw new Error('Expected default WH value 1073 m');
  if (mixedUnitsState.tdValue !== '1508') throw new Error('Expected default TD value 1508 m');
  if (mixedUnitsState.mwValue !== '9.4') throw new Error('Expected default MW value 9.4 ppg');
  if (!mixedUnitsState.hasSchematic840) throw new Error('Schematic SVG 840x520 was not found!');

  await client.captureScreenshot('riser_margin_v2_screen.png');

  console.log('\n--- STEP 4: Verify Global Unit System Switch to API (ft, ppg) ---');
  await client.eval(`
    window.UnitsEngine.setUnitSystem('api');
  `);
  await new Promise(r => setTimeout(r, 600));

  const apiUnitsState = await client.eval(`({
    unitSystem: window.UnitsEngine.getUnitSystem(),
    whLabel: document.getElementById('inp-riser-wh-depth')?.parentElement?.querySelector('label')?.innerText,
    whValue: document.getElementById('inp-riser-wh-depth')?.value,
    tdLabel: document.getElementById('inp-riser-td-depth')?.parentElement?.querySelector('label')?.innerText,
    tdValue: document.getElementById('inp-riser-td-depth')?.value,
    mwLabel: document.getElementById('inp-riser-mud-weight')?.parentElement?.querySelector('label')?.innerText,
    mwValue: document.getElementById('inp-riser-mud-weight')?.value
  })`);
  console.log('API Units State:', apiUnitsState);
  if (!apiUnitsState.whLabel.toUpperCase().includes('(FT)')) throw new Error('WH label does not show (ft) in API mode');
  if (!apiUnitsState.mwLabel.toUpperCase().includes('(PPG)')) throw new Error('MW label does not show (ppg) in API mode');
  await client.captureScreenshot('riser_margin_v2_api_units.png');

  console.log('\n--- STEP 5: Verify Global Unit System Switch to SI (m, SG) ---');
  await client.eval(`
    window.UnitsEngine.setUnitSystem('si');
  `);
  await new Promise(r => setTimeout(r, 600));

  const siUnitsState = await client.eval(`({
    unitSystem: window.UnitsEngine.getUnitSystem(),
    whLabel: document.getElementById('inp-riser-wh-depth')?.parentElement?.querySelector('label')?.innerText,
    whValue: document.getElementById('inp-riser-wh-depth')?.value,
    tdLabel: document.getElementById('inp-riser-td-depth')?.parentElement?.querySelector('label')?.innerText,
    tdValue: document.getElementById('inp-riser-td-depth')?.value,
    mwLabel: document.getElementById('inp-riser-mud-weight')?.parentElement?.querySelector('label')?.innerText,
    mwValue: document.getElementById('inp-riser-mud-weight')?.value
  })`);
  console.log('SI Units State:', siUnitsState);
  if (!siUnitsState.whLabel.toUpperCase().includes('(M)')) throw new Error('WH label does not show (m) in SI mode');
  if (!siUnitsState.mwLabel.toUpperCase().includes('(SG)')) throw new Error('MW label does not show (SG) in SI mode');
  await client.captureScreenshot('riser_margin_v2_si_units.png');

  console.log('\n--- STEP 6: Switch back to Mixed and verify zero drift ---');
  await client.eval(`
    window.UnitsEngine.setUnitSystem('mixed');
  `);
  await new Promise(r => setTimeout(r, 600));

  const restoredMixed = await client.eval(`({
    whValue: document.getElementById('inp-riser-wh-depth')?.value,
    tdValue: document.getElementById('inp-riser-td-depth')?.value,
    mwValue: document.getElementById('inp-riser-mud-weight')?.value,
    swValue: document.getElementById('inp-riser-sw-density')?.value,
    ppValue: document.getElementById('inp-riser-pore-pressure')?.value
  })`);
  console.log('Restored Mixed State:', restoredMixed);
  if (restoredMixed.whValue !== '1073' || restoredMixed.tdValue !== '1508' || restoredMixed.mwValue !== '9.4') {
    throw new Error('Base value drift occurred after unit switching: ' + JSON.stringify(restoredMixed));
  }
  console.log('PASSED: Zero rounding drift across round-trip unit switching!');

  console.log('\n--- STEP 7: Scroll to Schematic and Capture ---');
  await client.eval(`
    const schematic = document.querySelector('svg[viewBox="0 0 840 520"]');
    if (schematic) schematic.scrollIntoView({ block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 400));
  await client.captureScreenshot('riser_margin_v2_schematic.png');

  console.log('\n--- STEP 8: Tap Generate Job Record (PDF) Action Button ---');
  // Scroll to bottom button
  await client.eval(`
    const btn = document.getElementById('btn-generate-riser-record-pdf');
    if (btn) btn.scrollIntoView({ block: 'center' });
  `);
  await new Promise(r => setTimeout(r, 300));

  // Click the PDF button
  await client.eval(`
    const btn = document.getElementById('btn-generate-riser-record-pdf');
    btn.click();
  `);

  console.log('Waiting for PDF generation and Report Ready Modal...');
  let modalShown = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const modalCheck = await client.eval(`({
      modalExists: !!document.getElementById('cement-report-ready-modal'),
      fileName: document.querySelector('.report-ready-filename')?.innerText,
      fileSize: document.querySelector('.report-ready-size-badge')?.innerText,
      hasOpenBtn: !!document.getElementById('btn-report-open'),
      hasShareBtn: !!document.getElementById('btn-report-share'),
      hasDoneBtn: !!document.getElementById('btn-report-done')
    })`);
    if (modalCheck.modalExists && modalCheck.hasOpenBtn && modalCheck.hasShareBtn && modalCheck.hasDoneBtn) {
      console.log('Modal visible check at attempt', i + 1, ':', modalCheck);
      modalShown = true;
      break;
    }
  }

  if (!modalShown) {
    throw new Error('Report ready modal did not appear within 10 seconds!');
  }

  await client.captureScreenshot('riser_margin_v2_report_ready_modal.png');

  console.log('\n--- STEP 9: Tap Done to dismiss modal ---');
  await client.eval(`document.getElementById('btn-report-done').click();`);
  await new Promise(r => setTimeout(r, 400));

  const afterDismiss = await client.eval(`({
    modalExists: !!document.getElementById('cement-report-ready-modal')
  })`);
  console.log('After Dismiss State:', afterDismiss);

  console.log('\n====================================================');
  console.log('   ALL LIVE CDP VERIFICATION CHECKS PASSED!        ');
  console.log('====================================================');
  ws.close();
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
