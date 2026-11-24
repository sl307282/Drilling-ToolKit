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

  console.log('\n--- STEP 1: Verify Drilling Calculations list & Quick Access ---');
  await client.eval(`
    calcSubState.section = 'drilling';
    calcSubState.view = 'list';
    calcSubState.category = 'calculations';
    navigateTo('drilling-calc');
  `);
  await new Promise(r => setTimeout(r, 600));

  const drillingCheck = await client.eval(`(() => {
    const text = document.getElementById('formula-list-container')?.innerText || '';
    const quickAccess = document.querySelector('.guide-quick-access')?.innerText || '';
    const hasRiserInList = text.toLowerCase().includes('riser margin');
    const hasRiserInQA = quickAccess.toLowerCase().includes('riser margin');
    return { hasRiserInList, hasRiserInQA };
  })()`);
  console.log('Drilling Calculations Check:', drillingCheck);
  if (drillingCheck.hasRiserInList) throw new Error('Riser Margin found inside Drilling Calculations list!');
  if (drillingCheck.hasRiserInQA) throw new Error('Riser Margin found inside Drilling Quick Access!');

  await client.captureScreenshot('drilling_calc_no_riser_margin.png');
  console.log('PASSED: Drilling Calculations is 100% free of Riser Margin!');

  console.log('\n--- STEP 2: Verify Well Control Calculations & Subsea Category ---');
  await client.eval(`
    calcSubState.section = 'wellcontrol';
    calcSubState.view = 'list';
    calcSubState.category = 'surface';
    calcSubState.expandedCategoryId = 'subsea';
    renderDrillingCalcScreen();
  `);
  await new Promise(r => setTimeout(r, 600));

  const wellControlCheck = await client.eval(`(() => {
    const text = document.getElementById('formula-list-container')?.innerText || '';
    const quickAccess = document.querySelector('.guide-quick-access')?.innerText || '';
    const hasRiserInList = text.toLowerCase().includes('riser margin');
    const hasRiserInQA = quickAccess.toLowerCase().includes('riser margin');

    // Also inspect wellcontrolCalcSections data
    const subseaSection = wellControlCalcSections.find(s => s.category === 'subsea');
    const subseaItems = subseaSection ? subseaSection.items : [];
    const hasRiserInSubseaItems = subseaItems.includes('riser_margin');

    return { hasRiserInList, hasRiserInQA, subseaItems, hasRiserInSubseaItems };
  })()`);
  console.log('Well Control Check:', wellControlCheck);
  if (wellControlCheck.hasRiserInList) throw new Error('Riser Margin found inside Well Control list!');
  if (wellControlCheck.hasRiserInQA) throw new Error('Riser Margin found inside Well Control Quick Access!');
  if (wellControlCheck.hasRiserInSubseaItems) throw new Error('riser_margin still in wellControlCalcSections.subsea!');

  await client.captureScreenshot('well_control_subsea_no_riser_margin.png');
  console.log('PASSED: Well Control (Subsea & Quick Access) is 100% free of Riser Margin!');

  console.log('\n--- STEP 3: Verify Calculation Hub Single Entry Point Card ---');
  await client.eval(`
    calcSubState.view = 'categories';
    renderDrillingCalcScreen();
  `);
  await new Promise(r => setTimeout(r, 600));

  const hubCategories = await client.eval(`(() => {
    const catCalc = document.getElementById('cat-calc-btn');
    const catWc = document.getElementById('cat-wellcontrol-ops-btn');
    const catRm = document.getElementById('cat-riser-margin-btn');
    return {
      hasCatCalc: !!catCalc,
      hasCatWc: !!catWc,
      hasCatRm: !!catRm,
      rmTitle: catRm?.querySelector('.card-title')?.innerText?.trim(),
      rmDesc: catRm?.querySelector('.card-desc')?.innerText?.trim()
    };
  })()`);
  console.log('Hub Categories Check:', hubCategories);
  if (!hubCategories.hasCatCalc || !hubCategories.hasCatWc || !hubCategories.hasCatRm) {
    throw new Error('Missing top-level cards on Calculation Hub!');
  }
  await client.captureScreenshot('calc_hub_single_entry_card.png');
  console.log('PASSED: Standalone Riser Margin card verified on Calculation Hub!');

  console.log('\n--- STEP 4: Open Riser Margin and Verify Detail Screen (No Star) ---');
  await client.eval(`document.getElementById('cat-riser-margin-btn').click();`);
  await new Promise(r => setTimeout(r, 600));

  const detailScreenCheck = await client.eval(`(() => {
    const hasStarBtn = !!document.getElementById('riser-margin-fav-btn');
    const hasBackBtn = !!document.getElementById('riser-margin-back-btn');
    const backBtnText = document.getElementById('riser-margin-back-btn')?.innerText?.trim();
    const titleText = document.querySelector('#screen-drilling-calc h4')?.innerText?.trim();
    const hasSchematic = !!document.querySelector('svg[viewBox="0 0 840 520"]');
    const hasPdfBtn = !!document.getElementById('btn-generate-riser-record-pdf');
    return {
      view: calcSubState.view,
      hasStarBtn,
      hasBackBtn,
      backBtnText,
      titleText,
      hasSchematic,
      hasPdfBtn
    };
  })()`);
  console.log('Detail Screen Check:', detailScreenCheck);
  if (detailScreenCheck.hasStarBtn) throw new Error('Star / favorite button #riser-margin-fav-btn is present on Riser Margin screen!');
  if (!detailScreenCheck.hasBackBtn) throw new Error('Back button is missing on Riser Margin screen!');
  if (!detailScreenCheck.hasSchematic) throw new Error('840x520 Schematic is missing!');
  if (!detailScreenCheck.hasPdfBtn) throw new Error('Generate Job Record (PDF) button is missing!');

  await client.captureScreenshot('riser_margin_detail_no_star.png');
  console.log('PASSED: Detail screen has NO star button, complete schematic, and PDF action intact!');

  console.log('\n--- STEP 5: Test Back Navigation to Calculation Hub ---');
  await client.eval(`document.getElementById('riser-margin-back-btn').click();`);
  await new Promise(r => setTimeout(r, 600));

  const afterBack = await client.eval(`({
    view: calcSubState.view,
    hasCatRm: !!document.getElementById('cat-riser-margin-btn')
  })`);
  console.log('After Back Check:', afterBack);
  if (afterBack.view !== 'categories' || !afterBack.hasCatRm) {
    throw new Error('Back button failed to return cleanly to Calculation Hub categories view!');
  }
  await client.captureScreenshot('calc_hub_return_after_back.png');
  console.log('PASSED: Back navigation returns cleanly to Calculation Hub!');

  console.log('\n====================================================');
  console.log('   ALL SINGLE ENTRY POINT CHECKS PASSED 100%!       ');
  console.log('====================================================');
  ws.close();
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
