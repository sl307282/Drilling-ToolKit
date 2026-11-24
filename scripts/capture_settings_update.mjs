import { execSync } from 'child_process';

const ARTIFACT_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';
const ADB = `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`;

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
  execSync(`${ADB} -s emulator-5554 exec-out screencap -p > "${targetPath}"`);
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  console.log('Capturing updated Settings screen screenshots...');

  // 1. Settings - Mixed Units (Default)
  await evalInWebView(`
    {
      window.navigateTo('settings');
      const mixedBtn = document.querySelector('#settings-unit-system-control button[data-system="mixed"]');
      if (mixedBtn) mixedBtn.click();
      const scroller = document.querySelector('#screen-settings .scroller');
      if (scroller) scroller.scrollTop = 0;
    }
  `);
  await sleep(1000);
  takeScreenshot('62_settings_single_unit_control_mixed.png');

  // 2. Settings - Oilfield Units (API)
  await evalInWebView(`
    {
      const apiBtn = document.querySelector('#settings-unit-system-control button[data-system="api"]');
      if (apiBtn) apiBtn.click();
    }
  `);
  await sleep(1000);
  takeScreenshot('63_settings_single_unit_control_api.png');

  // 3. Settings - Metric Units (SI)
  await evalInWebView(`
    {
      const siBtn = document.querySelector('#settings-unit-system-control button[data-system="si"]');
      if (siBtn) siBtn.click();
    }
  `);
  await sleep(1000);
  takeScreenshot('64_settings_single_unit_control_si.png');

  // 4. Settings - Dark Mode with Single Unit Control
  await evalInWebView(`
    {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  `);
  await sleep(1000);
  takeScreenshot('65_settings_dark_mode_single_unit.png');

  // 5. Restore Light Mode & Mixed Units
  await evalInWebView(`
    {
      document.documentElement.setAttribute('data-theme', 'light');
      const mixedBtn = document.querySelector('#settings-unit-system-control button[data-system="mixed"]');
      if (mixedBtn) mixedBtn.click();
    }
  `);
  await sleep(800);

  console.log('All Settings update screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
