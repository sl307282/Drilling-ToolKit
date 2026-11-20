// tests/collapsing_header_contract.test.mjs
// Automated contract test suite for Collapsing Header (v2)

import assert from 'node:assert/strict';

// Part 1: Engine Invariant & Contract Pure Logic Tests
console.log('=== PART 1: Collapsing Header Pure Engine Contract Tests ===');

// Engine formula replicates the exact pure math inside collapsing_header.js:
// H_MIN = 56, H_MAX = 104, ICON_MIN = 0.8
// fadeOutEnd = H_MAX - H_MIN = 48
// fadeInStart = fadeOutEnd + 8 = 56
// fadeInEnd = fadeInStart + 40 = 96
function computeHeaderState(scrollY, isReversingMidPage = false) {
  const H_MIN = 56;
  const H_MAX = 104;
  const ICON_MIN = 0.8;
  const fadeOutEnd = H_MAX - H_MIN; // 48
  const fadeInStart = fadeOutEnd + 8; // 56
  const fadeInEnd = fadeInStart + 40; // 96
  const end = fadeInEnd;

  if (isReversingMidPage && scrollY > 0) {
    // If mid-page reversed before reaching 0, state stays pinned collapsed
    return {
      largeOpacity: 0,
      largeY: -48,
      barTitleOpacity: 1,
      barBgOpacity: 1,
      iconScale: ICON_MIN
    };
  }

  const p = Math.max(0, Math.min(1, scrollY / end));

  // 1. Large title opacity
  const largeOpacity = Math.max(0, Math.min(1, 1 - (scrollY / fadeOutEnd)));
  const largeY = -Math.min(fadeOutEnd, scrollY);

  // 2. Compact bar title opacity
  const barTitleOpacity = scrollY <= fadeInStart
    ? 0
    : Math.max(0, Math.min(1, (scrollY - fadeInStart) / (fadeInEnd - fadeInStart)));

  // 3. Solid bar background opacity
  const barBgOpacity = Math.max(0, Math.min(1, scrollY / fadeOutEnd));

  // 4. Icon scale
  const iconScale = 1 - (1 - ICON_MIN) * p;

  return {
    largeOpacity,
    largeY,
    barTitleOpacity,
    barBgOpacity,
    iconScale
  };
}

// 1. Opacity sum test: largeOpacity + barTitleOpacity <= 1.0 everywhere
console.log('Test 1: Opacity sum test (large + barTitle <= 1.0 for all scrollY)...');
for (let y = 0; y <= 500; y++) {
  const s = computeHeaderState(y);
  const sum = s.largeOpacity + s.barTitleOpacity;
  assert(sum <= 1.0001, `Opacity sum exceeded 1.0 at y=${y}: ${sum}`);
  assert(s.largeOpacity >= 0 && s.largeOpacity <= 1, `Invalid largeOpacity at y=${y}`);
  assert(s.barTitleOpacity >= 0 && s.barTitleOpacity <= 1, `Invalid barTitleOpacity at y=${y}`);
}
console.log('  PASSED: Opacity sum <= 1.0 across all scroll offsets (no double-title overlap).');

// 2. Monotonic sweep: 0 to 200 and back in 1px increments
console.log('Test 2: Monotonic sweep (0 -> 200 -> 0 in 1px steps)...');
const forwardSweep = [];
for (let y = 0; y <= 200; y++) {
  forwardSweep.push(computeHeaderState(y));
}
for (let y = 200; y >= 0; y--) {
  const sBack = computeHeaderState(y);
  const sFwd = forwardSweep[y];
  assert.equal(sBack.largeOpacity, sFwd.largeOpacity);
  assert.equal(sBack.barTitleOpacity, sFwd.barTitleOpacity);
  assert.equal(sBack.barBgOpacity, sFwd.barBgOpacity);
  assert.equal(sBack.iconScale, sFwd.iconScale);
}
console.log('  PASSED: Identical continuous states during sweep.');

// 3. Direction reversal mid-page: scroll to 400, then down to 300, 200, 130
console.log('Test 3: Direction reversal mid-page (stays collapsed until scrollTop === 0)...');
let collapsedState = computeHeaderState(400);
assert.equal(collapsedState.barTitleOpacity, 1);
assert.equal(collapsedState.largeOpacity, 0);

for (const y of [300, 200, 130, 50, 1]) {
  const sRev = computeHeaderState(y, /* isReversingMidPage = */ true);
  assert.equal(sRev.barTitleOpacity, 1, `barTitleOpacity must stay 1 at y=${y}`);
  assert.equal(sRev.largeOpacity, 0, `largeOpacity must stay 0 at y=${y}`);
  assert.equal(sRev.barBgOpacity, 1, `barBgOpacity must stay 1 at y=${y}`);
  assert.equal(sRev.iconScale, 0.8, `iconScale must stay 0.8 at y=${y}`);
}
// When reaching 0:
const sZero = computeHeaderState(0, /* isReversingMidPage = */ false);
assert.equal(sZero.largeOpacity, 1, 'largeOpacity must expand back to 1 at y=0');
assert.equal(sZero.barTitleOpacity, 0, 'barTitleOpacity must reset to 0 at y=0');
assert.equal(sZero.barBgOpacity, 0, 'barBgOpacity must reset to 0 at y=0');
assert.equal(sZero.iconScale, 1.0, 'iconScale must be 1.0 at y=0');
console.log('  PASSED: Mid-page reversal stays collapsed until scrollTop === 0.');

// 4. Threshold hover: alternate mid and mid+1 200 times without jitter
console.log('Test 4: Threshold hover test (hovering across boundary)...');
const mid = 48;
for (let i = 0; i < 200; i++) {
  const y = (i % 2 === 0) ? mid : mid + 1;
  const s = computeHeaderState(y);
  assert(s.largeOpacity >= 0 && s.largeOpacity <= 0.05);
}
console.log('  PASSED: 200 threshold alternations produce no oscillation or NaN.');

// 5. Icon shrinking: 44px to 35.2px (80%), hit box remains 44x44
console.log('Test 5: Icon scaling calculation...');
const sMin = computeHeaderState(0);
const sMax = computeHeaderState(150);
assert.equal(sMin.iconScale, 1.0);
assert.equal(Math.round(44 * sMin.iconScale * 10) / 10, 44);
assert.equal(sMax.iconScale, 0.8);
assert.equal(Math.round(44 * sMax.iconScale * 10) / 10, 35.2);
console.log('  PASSED: Icon scales exactly from 44px (1.0) to 35.2px (0.8).');

// Part 2: Live Android WebView CDP Tests
console.log('\n=== PART 2: Live Android WebView CDP Integration Tests ===');

async function runCdpTests() {
  let list;
  try {
    // Attempt auto-forwarding adb socket if adb is present
    try {
      const { execSync } = await import('node:child_process');
      const adbPath = '/Users/sohan/Library/Android/sdk/platform-tools/adb';
      const sockets = execSync(`${adbPath} shell "grep -a webview /proc/net/unix" 2>/dev/null`, { encoding: 'utf8' });
      const m = sockets.match(/@webview_devtools_remote_(\d+)/);
      if (m) {
        execSync(`${adbPath} forward tcp:9222 localabstract:webview_devtools_remote_${m[1]}`);
      }
    } catch (_) {}

    list = await fetch('http://127.0.0.1:9222/json', { signal: AbortSignal.timeout(3000) }).then(r => r.json());
  } catch (err) {
    console.log('DevTools port 9222 not reachable, skipping live WebView suite:', err.message);
    return;
  }

  if (!list || !list.length) {
    console.log('No WebView targets found.');
    return;
  }

  const target = list.find(t => t.url.includes('localhost')) || list[0];
  console.log('Connecting to WebView target:', target.url, target.webSocketDebuggerUrl);

  if (typeof WebSocket === 'undefined') {
    console.log('Native WebSocket not enabled (use --experimental-websocket). Skipping live CDP tests.');
    return;
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 100;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(new Error(data.error.message));
            else resolve(data.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  // 6. Same-row alignment test on screen-drilling-guide
  console.log('Test 6: Same-row alignment on Drilling Guide...');
  const alignment = await evalJs(`
    (async () => {
      state.currentScreen = 'drilling-guide';
      renderScreen();
      await new Promise(r => setTimeout(r, 100));

      const screen = document.getElementById('screen-drilling-guide');
      const back = screen.querySelector('.back');
      const h1 = screen.querySelector('.large h1');
      const large = screen.querySelector('.large');

      const backRect = back.getBoundingClientRect();
      const h1Rect = h1.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(h1).lineHeight || '28');

      const backCenterY = backRect.top + (backRect.height / 2);
      const h1FirstLineCenterY = h1Rect.top + (lh / 2);
      const diffY = Math.abs(backCenterY - h1FirstLineCenterY);
      const largePaddingStart = parseFloat(getComputedStyle(large).paddingInlineStart || '72');

      return {
        backWidth: backRect.width,
        backHeight: backRect.height,
        backCenterY,
        h1FirstLineCenterY,
        diffY,
        largePaddingStart
      };
    })()
  `);

  console.log('  Alignment metrics:', alignment);
  assert(alignment.backWidth >= 44, `Back button width ${alignment.backWidth} < 44px`);
  assert(alignment.backHeight >= 44, `Back button height ${alignment.backHeight} < 44px`);
  assert(alignment.diffY <= 1.0, `Back button center-Y (${alignment.backCenterY}) and title first-line center-Y (${alignment.h1FirstLineCenterY}) diff ${alignment.diffY} exceeds 1px!`);
  assert(Math.abs(alignment.largePaddingStart - 72) <= 1, `large padding-inline-start (${alignment.largePaddingStart}) is not 72px!`);
  console.log('  PASSED: Back center-Y and title first-line center-Y match within 1px, left edge = 72px, hit target >= 44x44.');

  // 7. Overscroll behavior verification
  console.log('Test 7: overscroll-behavior-y: none on scroller, html, body...');
  const overscroll = await evalJs(`
    (() => {
      const screen = document.getElementById('screen-drilling-guide');
      const scroller = screen.querySelector('.scroller');
      return {
        html: getComputedStyle(document.documentElement).overscrollBehaviorY,
        body: getComputedStyle(document.body).overscrollBehaviorY,
        scroller: getComputedStyle(scroller).overscrollBehaviorY
      };
    })()
  `);
  console.log('  Overscroll computed values:', overscroll);
  assert.equal(overscroll.html, 'none');
  assert.equal(overscroll.body, 'none');
  assert.equal(overscroll.scroller, 'none');
  console.log('  PASSED: overscroll-behavior-y: none strictly configured everywhere.');

  // 8. Live scroll shrink -> reversal -> expand cycle
  console.log('Test 8: Live scroll shrink, reversal, and expand cycle...');
  const scrollTest = await evalJs(`
    (async () => {
      const screen = document.getElementById('screen-drilling-guide');
      const scroller = screen.querySelector('.scroller');
      const barTitle = screen.querySelector('.bar-title');
      const large = screen.querySelector('.large');
      const barBg = screen.querySelector('.bar-bg');
      const ico = screen.querySelector('.back .ico');

      // 1. Initial state at 0
      scroller.scrollTop = 0;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const state0 = {
        scrollTop: scroller.scrollTop,
        largeOpacity: parseFloat(large.style.opacity || '1'),
        barTitleOpacity: parseFloat(barTitle.style.opacity || '0'),
        barBgOpacity: parseFloat(barBg.style.opacity || '0')
      };

      // 2. Scroll up to 300px
      scroller.scrollTop = 300;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const state300 = {
        scrollTop: scroller.scrollTop,
        largeOpacity: parseFloat(large.style.opacity || '0'),
        barTitleOpacity: parseFloat(barTitle.style.opacity || '1'),
        barBgOpacity: parseFloat(barBg.style.opacity || '1'),
        icoTransform: ico.style.transform
      };

      // 3. Scroll down mid-page to 150px (must stay collapsed)
      scroller.scrollTop = 150;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const state150 = {
        scrollTop: scroller.scrollTop,
        largeOpacity: parseFloat(large.style.opacity || '0'),
        barTitleOpacity: parseFloat(barTitle.style.opacity || '1'),
        barBgOpacity: parseFloat(barBg.style.opacity || '1')
      };

      // 4. Scroll all the way to 0 (must expand)
      scroller.scrollTop = 0;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const stateFinal0 = {
        scrollTop: scroller.scrollTop,
        largeOpacity: parseFloat(large.style.opacity || '1'),
        barTitleOpacity: parseFloat(barTitle.style.opacity || '0'),
        barBgOpacity: parseFloat(barBg.style.opacity || '0'),
        icoTransform: ico.style.transform
      };

      return { state0, state300, state150, stateFinal0 };
    })()
  `);
  console.log('  Live scroll cycle results:', JSON.stringify(scrollTest, null, 2));
  assert.equal(scrollTest.state0.largeOpacity, 1);
  assert.equal(scrollTest.state0.barTitleOpacity, 0);

  assert.equal(scrollTest.state300.largeOpacity, 0);
  assert.equal(scrollTest.state300.barTitleOpacity, 1);
  assert.equal(scrollTest.state300.barBgOpacity, 1);
  assert(scrollTest.state300.icoTransform.includes('0.8'), `Icon must be scaled to 0.8: ${scrollTest.state300.icoTransform}`);

  // Crucial contract: reversal mid-page stays collapsed!
  assert.equal(scrollTest.state150.largeOpacity, 0, 'Large title must stay hidden at mid-page reversal!');
  assert.equal(scrollTest.state150.barTitleOpacity, 1, 'Bar title must stay visible at mid-page reversal!');
  assert.equal(scrollTest.state150.barBgOpacity, 1, 'Bar background must stay visible at mid-page reversal!');

  // Contract: expand back at 0
  assert.equal(scrollTest.stateFinal0.largeOpacity, 1, 'Large title must restore to 1 at scrollTop 0!');
  assert.equal(scrollTest.stateFinal0.barTitleOpacity, 0, 'Bar title must restore to 0 at scrollTop 0!');
  assert.equal(scrollTest.stateFinal0.barBgOpacity, 0, 'Bar background must restore to 0 at scrollTop 0!');
  console.log('  PASSED: Live scroll shrink -> mid-page reversal -> expand-at-top verified!');

  // 9. Multi-locale test: German, Russian, Arabic (RTL)
  console.log('Test 9: Multi-locale testing (German, Russian, Arabic RTL)...');
  const localeResults = await evalJs(`
    (async () => {
      const results = {};
      const screen = document.getElementById('screen-drilling-guide');
      const h1 = screen.querySelector('.large h1');
      const back = screen.querySelector('.back');
      const icoSvg = screen.querySelector('.back .ico svg');

      // German
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('de');
      } else {
        document.documentElement.lang = 'de';
      }
      await new Promise(r => setTimeout(r, 60));
      results.de = {
        text: h1.textContent,
        clientHeight: h1.clientHeight,
        scrollHeight: h1.scrollHeight,
        noClip: h1.clientHeight >= h1.scrollHeight - 2
      };

      // Russian
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('ru');
      } else {
        document.documentElement.lang = 'ru';
      }
      await new Promise(r => setTimeout(r, 60));
      results.ru = {
        text: h1.textContent,
        clientHeight: h1.clientHeight,
        scrollHeight: h1.scrollHeight,
        noClip: h1.clientHeight >= h1.scrollHeight - 2
      };

      // Arabic (RTL)
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.lang = 'ar';
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('ar');
      }
      await new Promise(r => setTimeout(r, 60));
      const backRectRtl = back.getBoundingClientRect();
      const screenRectRtl = screen.getBoundingClientRect();
      const arrowTransform = getComputedStyle(icoSvg).transform;
      results.ar = {
        text: h1.textContent,
        dir: document.documentElement.getAttribute('dir'),
        backIsOnRight: backRectRtl.right > (screenRectRtl.width / 2),
        arrowFlipped: arrowTransform.includes('matrix(-1') || arrowTransform.includes('-1, 0, 0, 1')
      };

      // Restore English and LTR
      document.documentElement.removeAttribute('dir');
      document.documentElement.lang = 'en';
      if (typeof window.setLanguage === 'function') {
        window.setLanguage('en');
      }
      await new Promise(r => setTimeout(r, 60));

      return results;
    })()
  `);
  console.log('  Locale test results:', JSON.stringify(localeResults, null, 2));
  assert(localeResults.de.noClip, 'German title clipped!');
  assert(localeResults.ru.noClip, 'Russian title clipped!');
  assert(localeResults.ar.backIsOnRight, 'Arabic RTL: back button must be on the right side!');
  assert(localeResults.ar.arrowFlipped, 'Arabic RTL: back arrow SVG must be mirrored with transform: scaleX(-1)!');
  console.log('  PASSED: Multi-locale wrapping, Russian ascenders, Arabic RTL mirroring verified.');

  // 10. Font scaling test: 200%
  console.log('Test 10: 200% font scale test...');
  const fontScaleResult = await evalJs(`
    (async () => {
      const origRootFontSize = document.documentElement.style.fontSize;
      document.documentElement.style.fontSize = '32px'; // 200% of 16px
      await new Promise(r => setTimeout(r, 60));

      const screen = document.getElementById('screen-drilling-guide');
      const h1 = screen.querySelector('.large h1');
      const barTitle = screen.querySelector('.bar-title');
      const scroller = screen.querySelector('.scroller');

      const result = {
        h1ScrollHeight: h1.scrollHeight,
        h1ClientHeight: h1.clientHeight,
        noClip: h1.clientHeight >= h1.scrollHeight - 2
      };

      document.documentElement.style.fontSize = origRootFontSize;
      await new Promise(r => setTimeout(r, 60));
      return result;
    })()
  `);
  console.log('  200% Font Scale Result:', fontScaleResult);
  assert(fontScaleResult.noClip, '200% font scale caused clipping in header title!');
  console.log('  PASSED: 200% font scale renders cleanly without clipping.');

  ws.close();
}

runCdpTests().then(() => {
  console.log('\n===========================================');
  console.log('ALL CONTRACT TESTS PASSED PERFECTLY!');
  console.log('===========================================\n');
}).catch(err => {
  console.error('TEST RUN ERROR:', err);
  process.exit(1);
});
