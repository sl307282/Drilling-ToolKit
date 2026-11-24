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
      throw new Error('Eval exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename} -> ${outPath}`);
    return outPath;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to Android WebView DevTools...');
  const wsUrl = await getWsUrl();
  console.log('Target WS:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const client = new CdpClient(ws);
  await client.send('Page.enable');
  await client.send('DOM.enable');

  console.log('\n=== STEP 1: Verify Dashboard Initial State ===');
  await client.eval(`
    (() => {
      window.location.reload();
    })()
  `);
  await sleep(600);

  console.log('\n=== STEP 2: Search "lot" on Home Screen ===');
  await client.eval(`
    (() => {
      const inp = document.getElementById('home-search-input');
      inp.value = 'lot';
      handleSearch({ target: inp }, true);
    })()
  `);
  await sleep(300);

  const lotCheck = await client.eval(`
    (() => {
      const items = Array.from(document.querySelectorAll('.search-result-item'));
      return {
        count: items.length,
        titles: items.map(el => el.querySelector('.search-result-title').textContent.trim()),
        hasMilling: items.some(el => el.textContent.includes('Milling Time')),
        hasLeakOff: items.some(el => el.textContent.includes('Leak Off Test Calculation'))
      };
    })()
  `);
  console.log('Search "lot" result:', JSON.stringify(lotCheck, null, 2));

  if (!lotCheck.hasLeakOff) throw new Error('FAIL: Leak Off Test Calculation must match "lot"');
  if (lotCheck.hasMilling) throw new Error('FAIL: Milling Time Estimate must NOT match "lot"');
  console.log('PASSED: "lot" strictly matches Leak Off Test Calculation and excludes Milling Time Estimate!');

  await client.screenshot('01_search_lot_clean_match.png');

  console.log('\n=== STEP 3: Tap "Leak Off Test Calculation" Result ===');
  await client.eval(`
    const item = document.querySelector('.search-result-item');
    if (item) item.click();
  `);
  await sleep(400);

  const screenAfterClick = await client.eval(`
    (() => {
      const activeEl = document.querySelector('.screen.active');
      const titleEl = document.querySelector('#screen-drilling-calc h4');
      const backBtn = document.getElementById('form-back-btn');
      return {
        currentScreen: state.currentScreen,
        calcView: calcSubState.view,
        formulaId: calcSubState.formulaId,
        activeScreenId: activeEl ? activeEl.id : null,
        title: titleEl ? titleEl.textContent.trim() : null,
        backBtnText: backBtn ? backBtn.textContent.trim() : null
      };
    })()
  `);
  console.log('Screen after tapping result:', JSON.stringify(screenAfterClick, null, 2));

  if (screenAfterClick.currentScreen !== 'drilling-calc') throw new Error('FAIL: Current screen must be drilling-calc');
  if (screenAfterClick.calcView !== 'formula') throw new Error('FAIL: calcSubState.view must be formula, got: ' + screenAfterClick.calcView);
  if (screenAfterClick.formulaId !== 'leak_off') throw new Error('FAIL: calcSubState.formulaId must be leak_off, got: ' + screenAfterClick.formulaId);
  if (!screenAfterClick.title || !screenAfterClick.title.includes('Leak Off Test')) {
    throw new Error('FAIL: Calculator title does not match Leak Off Test: ' + screenAfterClick.title);
  }
  console.log('PASSED: Exact calculator page opened directly without going to hub categories!');

  await client.screenshot('02_direct_calculator_opened_leak_off.png');

  console.log('\n=== STEP 4: Press Back to Return to Home Search ===');
  await client.eval(`
    handleAppBack();
  `);
  await sleep(400);

  const returnHomeCheck = await client.eval(`
    (() => {
      const input = document.getElementById('home-search-input');
      const resultsCont = document.getElementById('global-search-results');
      const resultItems = Array.from(document.querySelectorAll('.search-result-item'));
      return {
        currentScreen: state.currentScreen,
        searchQuery: state.searchQuery,
        inputValue: input ? input.value : null,
        resultsVisible: resultsCont ? resultsCont.style.display !== 'none' : false,
        resultCount: resultItems.length,
        firstTitle: resultItems.length > 0 ? resultItems[0].querySelector('.search-result-title').textContent.trim() : null
      };
    })()
  `);
  console.log('State after pressing Back:', JSON.stringify(returnHomeCheck, null, 2));

  if (returnHomeCheck.currentScreen !== 'dashboard') throw new Error('FAIL: Must return to dashboard, got: ' + returnHomeCheck.currentScreen);
  if (returnHomeCheck.inputValue !== 'lot') throw new Error('FAIL: Search input value must remain "lot", got: ' + returnHomeCheck.inputValue);
  if (!returnHomeCheck.resultsVisible) throw new Error('FAIL: Search results must still be visible');
  console.log('PASSED: Back navigation cleanly returns to Home with search query and results preserved!');

  await client.screenshot('03_return_to_home_search_preserved.png');

  console.log('\n=== STEP 5: Clear Search (X Button) ===');
  await client.eval(`
    const clearBtn = document.getElementById('home-search-clear');
    if (clearBtn) clearBtn.click();
  `);
  await sleep(300);

  const clearCheck = await client.eval(`
    (() => {
      const input = document.getElementById('home-search-input');
      const resultsCont = document.getElementById('global-search-results');
      const menuGrid = document.querySelector('.menu-grid');
      return {
        inputValue: input ? input.value : null,
        resultsHidden: resultsCont ? resultsCont.style.display === 'none' : true,
        gridVisible: menuGrid ? menuGrid.style.display !== 'none' : false
      };
    })()
  `);
  console.log('State after clear button:', JSON.stringify(clearCheck, null, 2));

  if (clearCheck.inputValue !== '') throw new Error('FAIL: Search input must be empty after clear');
  if (!clearCheck.resultsHidden) throw new Error('FAIL: Results container must be hidden');
  if (!clearCheck.gridVisible) throw new Error('FAIL: Menu grid must be visible');
  console.log('PASSED: Clear button resets to the home grid!');

  await client.screenshot('04_home_search_cleared_menu_grid.png');

  console.log('\n=== STEP 6: Typo Tolerance Searches ===');
  for (const query of ['leak of test', 'leak off test', 'leak test']) {
    await client.eval(`
      (() => {
        const input = document.getElementById('home-search-input');
        input.value = '${query}';
        handleSearch({ target: input }, true);
      })()
    `);
    await sleep(250);
    const typoCheck = await client.eval(`
      (() => {
        const items = Array.from(document.querySelectorAll('.search-result-item'));
        return {
          firstTitle: items.length > 0 ? items[0].querySelector('.search-result-title').textContent.trim() : null,
          count: items.length
        };
      })()
    `);
    console.log(`Query "${query}": count=${typoCheck.count}, top="${typoCheck.firstTitle}"`);
    if (!typoCheck.firstTitle || !typoCheck.firstTitle.includes('Leak Off Test')) {
      throw new Error(`FAIL: Typo query "${query}" failed to rank Leak Off Test as #1`);
    }
  }
  console.log('PASSED: All typo tolerance queries match accurately!');

  console.log('\n=== STEP 7: Empty State ("zzzq") ===');
  await client.eval(`
    (() => {
      const input = document.getElementById('home-search-input');
      input.value = 'zzzq';
      handleSearch({ target: input }, true);
    })()
  `);
  await sleep(300);

  const emptyCheck = await client.eval(`
    (() => {
      const noResults = document.querySelector('.no-results');
      return {
        hasNoResults: !!noResults,
        text: noResults ? noResults.querySelector('.no-results-text').textContent.trim() : null
      };
    })()
  `);
  console.log('Empty state check:', JSON.stringify(emptyCheck, null, 2));
  if (!emptyCheck.hasNoResults) throw new Error('FAIL: Empty state not shown for zzzq');
  console.log('PASSED: Clean empty state rendered for non-matching query!');

  await client.screenshot('05_no_tools_found_empty_state.png');

  console.log('\n=== STEP 8: Navigation to Non-Calculation-Hub Tool (Petroleum Unit Conversion) ===');
  await client.eval(`
    (() => {
      const input = document.getElementById('home-search-input');
      input.value = 'unit conversion';
      handleSearch({ target: input }, true);
    })()
  `);
  await sleep(300);

  await client.eval(`
    (() => {
      const item = document.querySelector('.search-result-item');
      if (item) item.click();
    })()
  `);
  await sleep(400);

  const toolCheck = await client.eval(`
    (() => {
      return {
        currentScreen: state.currentScreen
      };
    })()
  `);
  console.log('Non-hub tool screen after click:', JSON.stringify(toolCheck, null, 2));
  if (toolCheck.currentScreen !== 'conversion') throw new Error('FAIL: Must navigate to conversion, got: ' + toolCheck.currentScreen);
  console.log('PASSED: Petroleum Unit Conversion opened directly!');

  await client.screenshot('06_unit_conversion_from_search.png');

  // Back from non-hub tool
  await client.eval(`handleAppBack();`);
  await sleep(300);
  const backFromTool = await client.eval(`state.currentScreen`);
  if (backFromTool !== 'dashboard') throw new Error('FAIL: Back from tool must return to dashboard');
  console.log('PASSED: Back from standalone tool returns cleanly to dashboard!');

  // Clear search for clean finish
  await client.eval(`
    (() => {
      const btn = document.getElementById('home-search-clear');
      if (btn) btn.click();
    })()
  `);
  await sleep(200);

  ws.close();
  console.log('\n====================================================');
  console.log('   ALL LIVE WEBVIEW VERIFICATION TESTS PASSED (100%)! ');
  console.log('====================================================');
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
