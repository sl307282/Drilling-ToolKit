import fs from 'fs';

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw new Error('No page found');

  const ws = new globalThis.WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && pending.has(d.id)) {
      const p = pending.get(d.id);
      pending.delete(d.id);
      if (d.error) p.reject(d.error); else p.resolve(d.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  // 1. Test Subsea 17.5" Hole in Light Mode
  console.log('Testing Subsea 17.5" Hole in Light Mode...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        document.documentElement.setAttribute('data-theme', 'light');
        state.flowType = 'subsea';
        state.selectedHoleSize = '17.5';
        state.currentScreen = 'subsea-calculations';
        if (typeof renderScreen === 'function') renderScreen();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `document.getElementById('run-calc-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 700));

  let snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_09_subsea_hole_calc_scroll_light.png', Buffer.from(snap.data, 'base64'));

  // 2. Test Subsea 17.5" Hole in Dark Mode
  console.log('Testing Subsea 17.5" Hole in Dark Mode...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        document.documentElement.setAttribute('data-theme', 'dark');
        const scroller = document.querySelector('#screen-subsea-calculations .scroller');
        if (scroller) scroller.scrollTop = 0;
      })()
    `
  });
  await new Promise(r => setTimeout(r, 300));
  await send('Runtime.evaluate', {
    expression: `document.getElementById('run-calc-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 700));

  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_10_subsea_hole_calc_scroll_dark.png', Buffer.from(snap.data, 'base64'));

  // 3. Reset back to light theme and verify Surface mode
  console.log('Testing Surface 17.5" Hole in Light Mode...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        document.documentElement.setAttribute('data-theme', 'light');
        state.flowType = 'surface';
        state.selectedHoleSize = '17.5';
        state.currentScreen = 'surface-calculations';
        if (typeof renderScreen === 'function') renderScreen();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `document.getElementById('run-calc-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 700));

  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_11_surface_hole_calc_scroll_light.png', Buffer.from(snap.data, 'base64'));

  console.log('All tests and screenshots completed successfully!');
  ws.close();
}

main().catch(console.error);
