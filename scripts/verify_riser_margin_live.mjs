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

  console.log('\n--- STEP 0: Reload page for fresh state ---');
  await client.eval(`window.location.reload();`);
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- STEP 1: Navigate to Calculation Hub categories ---');
  await client.eval(`
    riserMarginState.depthUnit = 'm';
    riserMarginState.densityUnit = 'ppg';
    riserMarginState.whDepth = 1073;
    riserMarginState.tdDepth = 1508;
    riserMarginState.mudWeight = 9.4;
    riserMarginState.swDensity = 8.6;
    riserMarginState.porePressure = 8.8;
    calcSubState.view = 'categories';
    navigateTo('drilling-calc');
  `);
  await new Promise(r => setTimeout(r, 600));

  const hubCategoriesState = await client.eval(`({
    hasCatCalc: !!document.getElementById('cat-calc-btn'),
    hasCatWellControl: !!document.getElementById('cat-wellcontrol-ops-btn'),
    hasCatRiserMargin: !!document.getElementById('cat-riser-margin-btn'),
    riserMarginTitle: document.getElementById('cat-riser-margin-btn')?.querySelector('.card-title')?.innerText,
    riserMarginDesc: document.getElementById('cat-riser-margin-btn')?.querySelector('.card-desc')?.innerText
  })`);

  console.log('Hub Categories State:', hubCategoriesState);
  if (!hubCategoriesState.hasCatRiserMargin) {
    throw new Error('cat-riser-margin-btn was not rendered in categories view!');
  }
  await client.captureScreenshot('riser_margin_hub_card.png');

  console.log('\n--- STEP 2: Tap Riser Margin Calculation card ---');
  await client.eval(`
    document.getElementById('cat-riser-margin-btn').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const riserScreenState = await client.eval(`({
    view: calcSubState.view,
    hasRecPillBadge: document.body.innerText.includes('RECOMMENDED PILL DENSITY'),
    recPillValue: document.querySelector('.result-card span[style*="font-size:2.1rem"]')?.innerText,
    whInput: document.getElementById('inp-riser-wh-depth')?.value,
    tdInput: document.getElementById('inp-riser-td-depth')?.value,
    mwInput: document.getElementById('inp-riser-mud-weight')?.value,
    hasSchematic: !!document.querySelector('svg[viewBox="0 0 740 350"]'),
    hasSensitivity: !!document.querySelector('svg[viewBox="0 0 640 240"]')
  })`);

  console.log('Riser Screen State:', riserScreenState);
  if (riserScreenState.view !== 'riser-margin') {
    throw new Error('Expected view to be riser-margin, got: ' + riserScreenState.view);
  }
  if (!riserScreenState.hasRecPillBadge) {
    throw new Error('Expected RECOMMENDED PILL DENSITY badge on screen!');
  }
  await client.captureScreenshot('riser_margin_calculator_screen.png');

  console.log('\n--- STEP 3: Verify Unit Toggle (Meters to Feet) ---');
  await client.eval(`
    const btnFt = document.querySelector('#seg-riser-depth-unit button[data-val="ft"]');
    if (btnFt) btnFt.click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const feetState = await client.eval(`({
    whVal: document.getElementById('inp-riser-wh-depth')?.value,
    tdVal: document.getElementById('inp-riser-td-depth')?.value,
    recPillVal: document.querySelector('.result-card span[style*="font-size:2.1rem"]')?.innerText
  })`);
  console.log('Feet Unit State:', feetState);
  await client.captureScreenshot('riser_margin_feet_units.png');

  console.log('\n--- STEP 4: Verify Validation Guard on invalid input ---');
  await client.eval(`
    const tdInput = document.getElementById('inp-riser-td-depth');
    tdInput.value = '2000'; // Less than WH depth in feet (3520.5)
    tdInput.dispatchEvent(new Event('input', { bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 400));

  const invalidState = await client.eval(`({
    bannerDisplay: document.getElementById('riser-validation-banner')?.style.display,
    bannerText: document.getElementById('riser-validation-banner')?.innerText,
    resultsDisplay: document.getElementById('riser-results-container')?.style.display
  })`);
  console.log('Invalid Input State:', invalidState);
  if (invalidState.bannerDisplay === 'none' || invalidState.resultsDisplay !== 'none') {
    throw new Error('Validation banner failed to trigger on invalid input!');
  }
  await client.captureScreenshot('riser_margin_validation_guard.png');

  // Restore valid inputs and switch back to meters
  console.log('\n--- STEP 5: Restore valid inputs ---');
  await client.eval(`
    window.riserMarginState.depthUnit = 'm';
    window.riserMarginState.densityUnit = 'ppg';
    window.riserMarginState.whDepth = 1073;
    window.riserMarginState.tdDepth = 1508;
    window.riserMarginState.mudWeight = 9.4;
    window.riserMarginState.swDensity = 8.6;
    window.riserMarginState.porePressure = 8.8;
    renderDrillingCalcScreen();
  `);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n--- STEP 6: Test Back navigation to Calculation Hub ---');
  await client.eval(`
    document.getElementById('riser-margin-back-btn').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const afterBackState = await client.eval(`({
    view: calcSubState.view,
    hasCatRiserMargin: !!document.getElementById('cat-riser-margin-btn')
  })`);
  console.log('After Back State:', afterBackState);
  if (afterBackState.view !== 'categories') {
    throw new Error('Back button did not return to categories view!');
  }

  console.log('\n--- STEP 7: Test Home Global Search integration ---');
  await client.eval(`
    navigateTo('dashboard');
  `);
  await new Promise(r => setTimeout(r, 500));

  await client.eval(`
    const searchInput = document.getElementById('home-search-input');
    searchInput.value = 'riser margin';
    handleSearch({ target: searchInput }, true);
  `);
  await new Promise(r => setTimeout(r, 400));

  const searchResultsState = await client.eval(`({
    resultsCount: document.querySelectorAll('.search-result-item').length,
    firstResultTitle: document.querySelector('.search-result-title')?.innerText,
    firstResultDesc: document.querySelector('.search-result-desc')?.innerText
  })`);
  console.log('Search Results State:', searchResultsState);
  if (!searchResultsState.firstResultTitle || !searchResultsState.firstResultTitle.includes('Riser Margin')) {
    throw new Error('Search for "riser margin" did not return Riser Margin Calculation!');
  }
  await client.captureScreenshot('riser_margin_search_result.png');

  console.log('\n--- STEP 8: Tap search result directly opens Riser Margin screen ---');
  await client.eval(`
    document.querySelector('.search-result-item').click();
  `);
  await new Promise(r => setTimeout(r, 600));

  const directFromSearchState = await client.eval(`({
    view: calcSubState.view,
    hasRecPillBadge: document.body.innerText.includes('RECOMMENDED PILL DENSITY')
  })`);
  console.log('Direct from Search State:', directFromSearchState);
  if (directFromSearchState.view !== 'riser-margin') {
    throw new Error('Tapping search result did not open riser-margin view directly!');
  }
  if (!directFromSearchState.hasRecPillBadge) {
    throw new Error('Expected RECOMMENDED PILL DENSITY badge when opening from search!');
  }
  await client.captureScreenshot('riser_margin_opened_from_search.png');

  console.log('\n--- STEP 9: Back from Riser Margin returns to Dashboard with search query preserved ---');
  await client.eval(`
    handleBack();
  `);
  await new Promise(r => setTimeout(r, 600));

  const backToHomeState = await client.eval(`({
    currentScreen: state.currentScreen,
    searchVal: document.getElementById('home-search-input')?.value,
    resultsVisible: document.getElementById('search-results-container')?.style.display !== 'none'
  })`);
  console.log('Back to Home State:', backToHomeState);
  if (backToHomeState.currentScreen !== 'dashboard' || backToHomeState.searchVal !== 'riser margin') {
    throw new Error('Back did not return to dashboard with preserved search query!');
  }
  await client.captureScreenshot('riser_margin_return_to_search_preserved.png');

  console.log('\n====================================================');
  console.log('   ALL LIVE CDP VERIFICATION CHECKS PASSED (100%)!  ');
  console.log('====================================================');

  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
