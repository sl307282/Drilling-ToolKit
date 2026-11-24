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
      const msgId = this.id++;
      this.pending.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
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
  await cdp.send('DOM.enable');

  console.log('\n--- 1. Testing High-Contrast Segmented Toggle in Light & Dark Mode ---');
  // Open Drill String Weight formula
  await cdp.eval(`
    navigateTo('drilling-calc');
    openFormulaDirectly('ds_weight', 'calculations');
    document.documentElement.removeAttribute('data-theme');
  `);
  await new Promise(r => setTimeout(r, 600));

  const lightStyle = await cdp.eval(`(() => {
    const seg = document.querySelector('.segmented-control');
    const activeBtn = document.querySelector('.segmented-control-btn.active');
    const inactiveBtn = document.querySelector('.segmented-control-btn:not(.active)');
    return {
      segBg: window.getComputedStyle(seg).backgroundColor,
      segBorder: window.getComputedStyle(seg).borderColor,
      activeBg: window.getComputedStyle(activeBtn).backgroundColor,
      activeColor: window.getComputedStyle(activeBtn).color,
      inactiveBg: window.getComputedStyle(inactiveBtn).backgroundColor,
      inactiveColor: window.getComputedStyle(inactiveBtn).color
    };
  })()`);
  console.log('Light Mode Styles:', lightStyle);
  await cdp.screenshot('01_segmented_toggle_ds_weight_light.png');

  // Switch to Dark Mode
  await cdp.eval(`document.documentElement.setAttribute('data-theme', 'dark');`);
  await new Promise(r => setTimeout(r, 400));

  const darkStyle = await cdp.eval(`(() => {
    const seg = document.querySelector('.segmented-control');
    const activeBtn = document.querySelector('.segmented-control-btn.active');
    const inactiveBtn = document.querySelector('.segmented-control-btn:not(.active)');
    return {
      segBg: window.getComputedStyle(seg).backgroundColor,
      segBorder: window.getComputedStyle(seg).borderColor,
      activeBg: window.getComputedStyle(activeBtn).backgroundColor,
      activeColor: window.getComputedStyle(activeBtn).color,
      inactiveBg: window.getComputedStyle(inactiveBtn).backgroundColor,
      inactiveColor: window.getComputedStyle(inactiveBtn).color
    };
  })()`);
  console.log('Dark Mode Styles:', darkStyle);
  await cdp.screenshot('02_segmented_toggle_ds_weight_dark.png');

  // Reset to light mode
  await cdp.eval(`document.documentElement.removeAttribute('data-theme');`);
  await new Promise(r => setTimeout(r, 300));

  console.log('\n--- 2. Testing Always Scroll to Top (y = 0) on Calculator Open ---');
  // Go back to list, expand category, scroll down
  await cdp.eval(`
    handleAppBack();
  `);
  await new Promise(r => setTimeout(r, 500));

  const scrollResult = await cdp.eval(`(() => {
    const scroller = document.querySelector('#screen-drilling-calc .scroller');
    scroller.scrollTop = 420;
    const initialScroll = scroller.scrollTop;
    
    // Open a formula from this scrolled state
    openFormulaDirectly('hook_load_calc', 'calculations');
    
    const scrollerAfterOpen = document.querySelector('#screen-drilling-calc .scroller');
    return {
      initialScroll,
      scrollAfterOpen: scrollerAfterOpen.scrollTop
    };
  })()`);
  console.log('Scroll Result:', scrollResult);
  await new Promise(r => setTimeout(r, 400));
  await cdp.screenshot('03_scroll_to_top_verified.png');

  console.log('\n--- 3. Testing Riser Margin Hindi Localization ---');
  // Open Riser Margin and switch language to Hindi
  await cdp.eval(`
    openRiserMarginDirectly();
    if (window.I18n && window.I18n.setLanguage) {
      window.I18n.setLanguage('hi');
    }
    updateCalculationHubLanguage('hi');
  `);
  await new Promise(r => setTimeout(r, 600));

  const hindiElements = await cdp.eval(`(() => {
    const bodyText = document.querySelector('#drilling-calc-container').innerText;
    const svgText = document.querySelector('#drilling-calc-container svg')?.textContent || '';
    return {
      hasCompulsoryInputs: bodyText.includes('अनिवार्य इंजीनियरिंग इनपुट'),
      hasHydrostaticLoss: bodyText.includes('राइज़र मार्जिन और हाइड्रोस्टैटिक हानि'),
      hasMatrix: bodyText.includes('3-स्टेट BHP और EMW तुलना मैट्रिक्स') || bodyText.includes('तुलना मैट्रिक्स'),
      hasChecklist: bodyText.includes('पिल गणना शुरू करने से पहले'),
      hasSvgSeawater: svgText.includes('सीवॉटर'),
      hasSvgMud: svgText.includes('ड्रिलिंग मड'),
      hasSvgPill: svgText.includes('भारित पिल'),
      snippet: bodyText.slice(0, 500)
    };
  })()`);
  console.log('Hindi Localization Elements:', hindiElements);
  await cdp.screenshot('04_riser_margin_hindi_localized.png');

  // Reset back to English
  await cdp.eval(`
    if (window.I18n && window.I18n.setLanguage) {
      window.I18n.setLanguage('en');
    }
    updateCalculationHubLanguage('en');
  `);
  await new Promise(r => setTimeout(r, 400));

  console.log('\n===========================================');
  console.log('   ALL LIVE CDP VERIFICATIONS COMPLETED!   ');
  console.log('===========================================');
  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
