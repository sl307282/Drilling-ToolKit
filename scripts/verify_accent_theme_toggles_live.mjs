import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw new Error('No webview target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP');

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (r.exceptionDetails) {
      throw new Error(JSON.stringify(r.exceptionDetails));
    }
    return r.result ? r.result.value : undefined;
  };

  const capture = async (filename) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(r.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath}`);
    return outPath;
  };

  // Helper to set color theme and wait
  const setColorTheme = async (themeName) => {
    const info = await evaluate(`
      (function() {
        document.documentElement.setAttribute('data-color-theme', '${themeName}');
        localStorage.setItem('colorTheme', '${themeName}');
        return {
          theme: '${themeName}',
          accentColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim()
        };
      })()
    `);
    await new Promise(r => setTimeout(r, 250));
    return info;
  };

  // Helper to set toggle state and wait for CSS transition
  const setToggleState = async (checked) => {
    await evaluate(`
      (function() {
        const toggle = document.getElementById('inp-calc_disp_toggle');
        if (toggle && toggle.checked !== ${checked}) {
          toggle.checked = ${checked};
          toggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 250));
  };

  // Navigate to drilling-calc and open Feet of Drill Pipe Pulled
  await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'light');
      if (window.I18n) window.I18n.setLanguage('en');
      navigateTo('drilling-calc');
      openFormulaDirectly('pipe_pulled', 'drilling');
      const dryBtn = document.getElementById('btn-pipe_mode-dry');
      if (dryBtn) dryBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  // --- 1. FOREST GREEN ---
  console.log('--- Testing Forest Green Theme ---');
  const forestInfo = await setColorTheme('forest');
  console.log('Forest theme info:', forestInfo);

  // Turn toggle OFF
  await setToggleState(false);
  const offState = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const cs = slider ? getComputedStyle(slider) : {};
      return {
        checked: toggle ? toggle.checked : null,
        sliderBg: cs.backgroundColor,
        sliderBorder: cs.borderColor
      };
    })()
  `);
  console.log('Forest Green OFF state:', offState);
  await capture('01_forest_green_toggle_off.png');

  // Turn toggle ON
  await setToggleState(true);
  const onStateForest = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        checked: toggle ? toggle.checked : null,
        sliderBg: sliderStyle.backgroundColor,
        sliderBorder: sliderStyle.borderColor,
        activeBtnBg: btnStyle.backgroundColor,
        activeBtnBorder: btnStyle.borderColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('Forest Green ON state:', onStateForest);
  if (!onStateForest.colorsMatch) {
    throw new Error('Colors do not match for Forest Green! ' + JSON.stringify(onStateForest));
  }
  await capture('02_forest_green_toggle_on.png');

  // --- 2. BURGUNDY ---
  console.log('--- Testing Burgundy Theme ---');
  await setColorTheme('burgundy');
  const onStateBurgundy = await evaluate(`
    (function() {
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        sliderBg: sliderStyle.backgroundColor,
        activeBtnBg: btnStyle.backgroundColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('Burgundy ON state:', onStateBurgundy);
  if (!onStateBurgundy.colorsMatch) {
    throw new Error('Colors do not match for Burgundy! ' + JSON.stringify(onStateBurgundy));
  }
  await capture('03_burgundy_toggle_on.png');

  // --- 3. OCEAN BLUE ---
  console.log('--- Testing Ocean Blue Theme ---');
  await setColorTheme('ocean');
  const onStateOcean = await evaluate(`
    (function() {
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        sliderBg: sliderStyle.backgroundColor,
        activeBtnBg: btnStyle.backgroundColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('Ocean Blue ON state:', onStateOcean);
  if (!onStateOcean.colorsMatch) {
    throw new Error('Colors do not match for Ocean Blue! ' + JSON.stringify(onStateOcean));
  }
  await capture('04_ocean_blue_toggle_on.png');

  // --- 4. DEEP INDIGO ---
  console.log('--- Testing Deep Indigo Theme ---');
  await setColorTheme('indigo');
  const onStateIndigo = await evaluate(`
    (function() {
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        sliderBg: sliderStyle.backgroundColor,
        activeBtnBg: btnStyle.backgroundColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('Deep Indigo ON state:', onStateIndigo);
  if (!onStateIndigo.colorsMatch) {
    throw new Error('Colors do not match for Deep Indigo! ' + JSON.stringify(onStateIndigo));
  }
  await capture('05_deep_indigo_toggle_on.png');

  // --- 5. MILK TEA ---
  console.log('--- Testing Milk Tea Theme ---');
  await setColorTheme('milktea');
  const onStateMilktea = await evaluate(`
    (function() {
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        sliderBg: sliderStyle.backgroundColor,
        activeBtnBg: btnStyle.backgroundColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('Milk Tea ON state:', onStateMilktea);
  if (!onStateMilktea.colorsMatch) {
    throw new Error('Colors do not match for Milk Tea! ' + JSON.stringify(onStateMilktea));
  }
  await capture('06_milktea_toggle_on.png');

  // --- 6. DARK MODE (Forest Green) ---
  console.log('--- Testing Dark Mode with Forest Green ---');
  await setColorTheme('forest');
  await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'dark');
    })()
  `);
  await new Promise(r => setTimeout(r, 250));

  // OFF in Dark Mode
  await setToggleState(false);
  const darkOffState = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const cs = slider ? getComputedStyle(slider) : {};
      return {
        checked: toggle ? toggle.checked : null,
        sliderBg: cs.backgroundColor,
        sliderBorder: cs.borderColor
      };
    })()
  `);
  console.log('Dark Forest Green OFF state:', darkOffState);
  await capture('07_dark_forest_green_toggle_off.png');

  // ON in Dark Mode
  await setToggleState(true);
  const darkOnState = await evaluate(`
    (function() {
      const toggle = document.getElementById('inp-calc_disp_toggle');
      const slider = document.querySelector('#form-group-calc_disp_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        sliderBg: sliderStyle.backgroundColor,
        activeBtnBg: btnStyle.backgroundColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('Dark Forest Green ON state:', darkOnState);
  if (!darkOnState.colorsMatch) {
    throw new Error('Colors do not match for Dark Forest Green! ' + JSON.stringify(darkOnState));
  }
  await capture('08_dark_forest_green_toggle_on.png');

  // --- 7. Check another calculator with toggle: Drill Pipe Pulled to Lose Hydrostatic Pressure ---
  console.log('--- Testing Drill Pipe Pulled to Lose Hydrostatic Pressure ---');
  await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'light');
      openFormulaDirectly('dp_pulled_lose', 'drilling');
      const toggle = document.getElementById('inp-calc_diam_toggle');
      if (toggle) {
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const dpLoseState = await evaluate(`
    (function() {
      const slider = document.querySelector('#form-group-calc_diam_toggle .slider');
      const activeBtn = document.querySelector('#seg-pipe_mode .segmented-control-btn.active');
      const sliderStyle = slider ? getComputedStyle(slider) : {};
      const btnStyle = activeBtn ? getComputedStyle(activeBtn) : {};
      return {
        sliderBg: sliderStyle.backgroundColor,
        activeBtnBg: btnStyle.backgroundColor,
        colorsMatch: sliderStyle.backgroundColor === btnStyle.backgroundColor
      };
    })()
  `);
  console.log('DP Lose Forest Green ON state:', dpLoseState);
  if (!dpLoseState.colorsMatch) {
    throw new Error('Colors do not match for DP Lose Forest Green! ' + JSON.stringify(dpLoseState));
  }
  await capture('09_dp_lose_forest_green_on.png');

  // Reset theme and language
  await evaluate(`
    (function() {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.setAttribute('data-color-theme', 'milktea');
      localStorage.setItem('colorTheme', 'milktea');
    })()
  `);

  ws.close();
  console.log('All accent theme toggle verifications passed successfully!');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
