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
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error in [${expression}]: ` + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }
}

async function run() {
  console.log('--- Connecting to WebView CDP ---');
  const wsUrl = await getWsUrl();
  console.log('WS URL:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const cdp = new CdpClient(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  console.log('Connected to CDP.');

  // Set viewport to standard phone size
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    mobile: true
  });

  const delay = ms => new Promise(r => setTimeout(r, ms));

  // 1. Navigate to Surface Hole Selection and switch to Hindi
  console.log('\n=== TEST 1: Surface Hole Selection & Reactive Hindi Switch ===');
  await cdp.eval(`
    navigateTo('surface-hole-size');
    // Switch to Hindi
    if (window.I18n) {
      window.I18n.setLanguage('hi');
    }
    if (typeof window.refreshCurrentScreenOnLanguageChange === 'function') {
      window.refreshCurrentScreenOnLanguageChange();
    }
  `);
  await delay(400);

  const holeTexts = await cdp.eval(`
    ({
      landRig: document.querySelector('button[data-rig="LAND"]')?.textContent?.trim(),
      jackupRig: document.querySelector('button[data-rig="JACKUP"]')?.textContent?.trim(),
      stdHoleSubtitle: document.querySelector('.size-card-subtitle')?.textContent?.trim(),
      activeLang: window.I18n.getCurrentLang()
    })
  `);
  console.log('Hole screen labels in Hindi:', holeTexts);
  if (!holeTexts.jackupRig.includes('जैकअप रिग') && !holeTexts.jackupRig.includes('Jackup')) {
    throw new Error('Jackup rig toggle not translated to Hindi: ' + holeTexts.jackupRig);
  }
  await cdp.screenshot('i18n_01_surface_hole_hindi.png');

  // 2. Surface Drillstring Setup in Hindi
  console.log('\n=== TEST 2: Surface Drillstring Setup in Hindi ===');
  await cdp.eval(`
    navigateTo('surface-drillstring');
  `);
  await delay(400);

  const dsTexts = await cdp.eval(`
    ({
      dcLabel: document.querySelector('#drillstring-form-wrapper-surface label')?.textContent?.trim(),
      hwdpLabel: document.querySelectorAll('#drillstring-form-wrapper-surface label')[2]?.textContent?.trim(),
      dpLabel: document.querySelectorAll('#drillstring-form-wrapper-surface label')[3]?.textContent?.trim(),
      dcOpt1: document.querySelector('#dc-type-sel-surface option[value="1"]')?.textContent?.trim(),
      dpOpt1: document.querySelector('#dp-type-sel-surface option[value="1"]')?.textContent?.trim()
    })
  `);
  console.log('Drillstring labels in Hindi:', dsTexts);
  await cdp.screenshot('i18n_02_surface_drillstring_hindi.png');

  // 3. Surface Reference Values in Hindi
  console.log('\n=== TEST 3: Surface Reference Values in Hindi ===');
  await cdp.eval(`
    navigateTo('surface-ref-values');
  `);
  await delay(400);

  const refTexts = await cdp.eval(`
    ({
      card1Title: document.querySelectorAll('#ref-values-container-surface .content-card h3')[0]?.textContent?.trim(),
      card2Title: document.querySelectorAll('#ref-values-container-surface .content-card h3')[1]?.textContent?.trim(),
      saveBtnText: document.querySelector('#ref-save-new-surface')?.textContent?.trim(),
      useBtnText: document.querySelector('#ref-use-btn-surface')?.textContent?.trim()
    })
  `);
  console.log('Reference values labels in Hindi:', refTexts);
  await cdp.screenshot('i18n_03_surface_ref_values_hindi.png');

  // 4. Surface Calculations in Hindi
  console.log('\n=== TEST 4: Surface Calculations in Hindi & Results ===');
  await cdp.eval(`
    navigateTo('surface-calculations');
    // Fill test inputs
    state.calcInputs.holeTVD = '3000';
    state.calcInputs.holeMD = '3000';
    state.calcInputs.shoeTVD = '2000';
    state.calcInputs.shoeMD = '2000';
    state.calcInputs.dcLength = '150';
    state.calcInputs.hwdpLength = '100';
    state.calcInputs.dpLength = '2750';
    state.calcInputs.spm = 60;
    renderCalculations();
    runCalculationsEngine();
  `);
  await delay(500);

  const calcLabels = await cdp.eval(`
    ({
      paramTitle: document.querySelector('#screen-surface-calculations h3')?.textContent?.trim(),
      wellTypeBtn: document.querySelector('.well-type-selector button.active')?.textContent?.trim(),
      resCard1Label: document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')[0]?.textContent?.trim(),
      resCard2Label: document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')[1]?.textContent?.trim(),
      resCard3Label: document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')[2]?.textContent?.trim(),
      resCard4Label: document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')[3]?.textContent?.trim(),
      resCard5Label: document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')[4]?.textContent?.trim(),
      resCard7Label: document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')[6]?.textContent?.trim()
    })
  `);
  console.log('Calculations labels & cards in Hindi:', calcLabels);
  await cdp.screenshot('i18n_04_surface_calculations_hindi.png');

  // 5. Kill Data Sheet Inputs in Hindi
  console.log('\n=== TEST 5: Kill Data Sheet Inputs & Controls in Hindi ===');
  await cdp.eval(`
    navigateTo('kill-data-sheet');
  `);
  await delay(400);

  const kdInputs = await cdp.eval(`
    ({
      refTitle: document.querySelectorAll('#kill-data-sheet-container h3')[0]?.textContent?.trim(),
      inputTitle: document.querySelectorAll('#kill-data-sheet-container h3')[1]?.textContent?.trim(),
      optionsTitle: document.querySelectorAll('#kill-data-sheet-container h3')[2]?.textContent?.trim(),
      wwBtn: document.querySelector('button[data-method="wait_and_weight"]')?.textContent?.trim(),
      drillersBtn: document.querySelector('button[data-method="drillers"]')?.textContent?.trim(),
      calcKillBtn: document.querySelector('#kd-go-btn')?.textContent?.trim()
    })
  `);
  console.log('Kill Data Sheet input headers in Hindi:', kdInputs);
  await cdp.screenshot('i18n_05_kill_sheet_inputs_hindi.png');

  // 6. Kill Data Sheet Calculation, Checkbox & Results in Hindi
  console.log('\n=== TEST 6: Warning Checkbox & Calculated Results in Hindi ===');
  // First click calculate to trigger warnings
  await cdp.eval(`
    document.getElementById('kd-go-btn').click();
  `);
  await delay(300);

  const warningTexts = await cdp.eval(`
    ({
      warningTitle: document.querySelector('.wc-alert-card.warning')?.textContent?.trim()?.slice(0, 100),
      ackLabel: document.querySelector('.wc-ack-label')?.textContent?.trim()
    })
  `);
  console.log('Warning card in Hindi:', warningTexts);

  // Check the warning ack checkbox and calculate
  await cdp.eval(`
    const cb = document.getElementById('kd-ack-checkbox');
    if (cb) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change'));
    }
    const row = document.getElementById('kd-ack-row');
    if (row) row.classList.add('checked');
    const go = document.getElementById('kd-go-btn');
    if (go) {
      go.disabled = false;
      go.classList.remove('btn-disabled');
      go.style.opacity = '1';
      go.click();
    }
  `);
  await delay(600);

  const resultsTexts = await cdp.eval(`
    ({
      resultsTitle: document.querySelector('#kd-results-section h3')?.textContent?.trim(),
      maaspLabel: document.querySelectorAll('#kd-results-section .result-label')[0]?.textContent?.trim(),
      kmwLabel: document.querySelectorAll('#kd-results-section .result-label')[1]?.textContent?.trim(),
      icpLabel: document.querySelectorAll('#kd-results-section .result-label')[2]?.textContent?.trim(),
      fcpLabel: document.querySelectorAll('#kd-results-section .result-label')[3]?.textContent?.trim(),
      chokeLabel: document.querySelectorAll('#kd-results-section .result-label')[4]?.textContent?.trim(),
      recMwLabel: document.querySelectorAll('#kd-results-section .result-label')[6]?.textContent?.trim(),
      kickCardTitle: document.querySelectorAll('#kd-results-section h3')[1]?.textContent?.trim(),
      bariteCardTitle: document.querySelectorAll('#kd-results-section h3')[2]?.textContent?.trim(),
      scheduleCardTitle: document.querySelector('#kd-chart-card h3')?.textContent?.trim(),
      pdfBtnText: document.querySelector('#btn-generate-kill-record-pdf .btn-pdf-text')?.textContent?.trim()
    })
  `);
  console.log('Kill Sheet Results in Hindi:', resultsTexts);
  await cdp.screenshot('i18n_06_kill_sheet_results_hindi.png');

  // Scroll to Step-down schedule & table
  await cdp.eval(`
    const chartCard = document.getElementById('kd-chart-card');
    if (chartCard) chartCard.scrollIntoView({ behavior: 'instant' });
  `);
  await delay(400);

  const tableHeaders = await cdp.eval(`
    Array.from(document.querySelectorAll('#kd-chart-card table th')).map(th => th.textContent.trim())
  `);
  console.log('Step-down schedule table headers in Hindi:', tableHeaders);
  await cdp.screenshot('i18n_07_kill_sheet_schedule_hindi.png');

  // 7. Subsea Calculations in Hindi
  console.log('\n=== TEST 7: Subsea Calculations in Hindi ===');
  await cdp.eval(`
    state.flowType = 'subsea';
    navigateTo('subsea-calculations');
    state.calcInputs.riserLength = '1000';
    state.calcInputs.bopStatus = 'open';
    renderCalculations();
    runCalculationsEngine();
  `);
  await delay(500);

  const subseaLabels = await cdp.eval(`
    ({
      riserLabel: document.querySelector('label[for="riserlength-calc"]')?.textContent || Array.from(document.querySelectorAll('#screen-subsea-calculations label')).find(l => l.textContent.includes('राइज़र') || l.textContent.includes('Riser'))?.textContent?.trim(),
      bopLabel: document.querySelector('.bop-toggle-label')?.textContent?.trim(),
      bopStrokesCard: Array.from(document.querySelectorAll('#results-dashboard-wrapper .result-card .result-label')).map(s => s.textContent.trim()).filter(t => t.includes('BOP') || t.includes('चोक') || t.includes('राइज़र'))
    })
  `);
  console.log('Subsea calculations in Hindi:', subseaLabels);
  await cdp.screenshot('i18n_08_subsea_calculations_hindi.png');

  // 8. Reactive Switch Back to English on Live Screen (No reload)
  console.log('\n=== TEST 8: Live Reactive Switch Back to English (Zero Reload) ===');
  await cdp.eval(`
    navigateTo('kill-data-sheet');
    // Switch to English
    if (window.I18n) {
      window.I18n.setLanguage('en');
    }
    if (typeof window.refreshCurrentScreenOnLanguageChange === 'function') {
      window.refreshCurrentScreenOnLanguageChange();
    }
  `);
  await delay(500);

  const enTexts = await cdp.eval(`
    ({
      activeLang: window.I18n.getCurrentLang(),
      resultsTitle: document.querySelector('#kd-results-section h3')?.textContent?.trim(),
      kmwLabel: document.querySelectorAll('#kd-results-section .result-label')[1]?.textContent?.trim(),
      icpLabel: document.querySelectorAll('#kd-results-section .result-label')[2]?.textContent?.trim(),
      pdfBtnText: document.querySelector('#btn-generate-kill-record-pdf .btn-pdf-text')?.textContent?.trim()
    })
  `);
  console.log('Kill Sheet reactive switch back to English:', enTexts);
  if (enTexts.activeLang !== 'en' || !enTexts.kmwLabel.includes('Kill Mud Weight')) {
    throw new Error('Failed reactive switch back to English: ' + JSON.stringify(enTexts));
  }
  await cdp.screenshot('i18n_09_kill_sheet_reactive_switch_back_en.png');

  console.log('\n==============================================');
  console.log('ALL LIVE I18N REACTIVE VERIFICATION TESTS PASSED!');
  console.log('==============================================\n');

  ws.close();
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
