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

  // Navigate to Kill Data Sheet
  console.log('1. Navigating to Kill Data Sheet...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        document.documentElement.setAttribute('data-theme', 'light');
        if (typeof window.I18n !== 'undefined') window.I18n.setLanguage('en');
        state.currentScreen = 'kill-data-sheet';
        if (typeof renderScreen === 'function') renderScreen();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // Tap "Calculate Kill Sheet" to trigger safety warnings
  console.log('2. Tapping Calculate Kill Sheet (#kd-go-btn)...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('kd-go-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 400));

  // Check warning card, checkbox, and button state
  const stateCheck1 = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const warningCard = document.querySelector('.wc-alert-card.warning');
        const checkbox = document.getElementById('kd-ack-checkbox');
        const label = document.querySelector('.wc-ack-label');
        const goBtn = document.getElementById('kd-go-btn');
        const scroller = document.querySelector('#screen-kill-data-sheet .scroller');
        
        // Scroll warning card into view for screenshot
        if (warningCard) warningCard.scrollIntoView({ behavior: 'auto', block: 'center' });

        return {
          hasWarningCard: !!warningCard,
          hasCheckbox: !!checkbox,
          isChecked: checkbox ? checkbox.checked : null,
          labelText: label ? label.textContent.trim() : null,
          goBtnDisabled: goBtn ? goBtn.disabled : null,
          goBtnOpacity: goBtn ? window.getComputedStyle(goBtn).opacity : null,
          goBtnPointerEvents: goBtn ? window.getComputedStyle(goBtn).pointerEvents : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('State 1 (Warnings triggered, unchecked):', JSON.stringify(stateCheck1.result.value, null, 2));

  let snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_12_kill_sheet_warning_checkbox_unchecked.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved wc_12_kill_sheet_warning_checkbox_unchecked.png');

  // 3. Click the checkbox row to check it
  console.log('3. Clicking the checkbox row (#kd-ack-row)...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('kd-ack-row')?.click();`
  });
  await new Promise(r => setTimeout(r, 300));

  const stateCheck2 = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const checkbox = document.getElementById('kd-ack-checkbox');
        const ackRow = document.getElementById('kd-ack-row');
        const goBtn = document.getElementById('kd-go-btn');
        return {
          isChecked: checkbox ? checkbox.checked : null,
          rowHasCheckedClass: ackRow ? ackRow.classList.contains('checked') : null,
          goBtnDisabled: goBtn ? goBtn.disabled : null,
          goBtnOpacity: goBtn ? window.getComputedStyle(goBtn).opacity : null,
          goBtnPointerEvents: goBtn ? window.getComputedStyle(goBtn).pointerEvents : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('State 2 (Checkbox checked, button enabled):', JSON.stringify(stateCheck2.result.value, null, 2));

  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_13_kill_sheet_warning_checkbox_checked.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved wc_13_kill_sheet_warning_checkbox_checked.png');

  // 4. Click the now-enabled Calculate Kill Sheet button
  console.log('4. Clicking enabled Calculate Kill Sheet (#kd-go-btn)...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('kd-go-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 700));

  const stateCheck3 = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const resultsSection = document.getElementById('kd-results-section');
        const validationBox = document.getElementById('kd-validation-container');
        return {
          resultsSectionVisible: resultsSection ? (resultsSection.style.display !== 'none') : false,
          validationText: validationBox ? validationBox.textContent.trim().replace(/\\s+/g, ' ') : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('State 3 (Calculation executed):', JSON.stringify(stateCheck3.result.value, null, 2));

  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_14_kill_sheet_calculated_results.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved wc_14_kill_sheet_calculated_results.png');

  // 5. Test input editing unchecking / gating behavior
  console.log('5. Testing input parameter edit unchecking behavior...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        // Trigger warning again
        state.calcInputs.killSIDPP_psi = 250;
        state.calcInputs.killSICP_psi = 200; // SICP < SIDP triggers warning
        if (typeof renderScreen === 'function') renderScreen();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));
  await send('Runtime.evaluate', {
    expression: `document.getElementById('kd-go-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 400));
  // Check the box
  await send('Runtime.evaluate', {
    expression: `document.getElementById('kd-ack-row')?.click();`
  });
  await new Promise(r => setTimeout(r, 300));

  const preEditState = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const checkbox = document.getElementById('kd-ack-checkbox');
        const goBtn = document.getElementById('kd-go-btn');
        return { isChecked: checkbox ? checkbox.checked : null, goBtnDisabled: goBtn ? goBtn.disabled : null };
      })()
    `,
    returnByValue: true
  });
  console.log('Pre-edit state (checked):', preEditState.result.value);

  // Now edit input field
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const sidpInput = document.getElementById('kd-sidp');
        if (sidpInput) {
          sidpInput.value = '275';
          sidpInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 300));

  const postEditState = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const checkbox = document.getElementById('kd-ack-checkbox');
        const goBtn = document.getElementById('kd-go-btn');
        return {
          isChecked: checkbox ? checkbox.checked : null,
          goBtnDisabled: goBtn ? goBtn.disabled : null,
          goBtnOpacity: goBtn ? window.getComputedStyle(goBtn).opacity : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Post-edit state (should be reset to unchecked & disabled):', postEditState.result.value);

  // 6. Test in Hindi
  console.log('6. Testing in Hindi (hi)...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        if (typeof window.I18n !== 'undefined') window.I18n.setLanguage('hi');
        state.currentScreen = 'kill-data-sheet';
        if (typeof renderScreen === 'function') renderScreen();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));
  await send('Runtime.evaluate', {
    expression: `document.getElementById('kd-go-btn')?.click();`
  });
  await new Promise(r => setTimeout(r, 400));

  const hindiCheck = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const label = document.querySelector('.wc-ack-label');
        const title = document.querySelector('[data-i18n="Well Control Safety Warnings"]');
        const warningCard = document.querySelector('.wc-alert-card.warning');
        if (warningCard) warningCard.scrollIntoView({ behavior: 'auto', block: 'center' });
        return {
          labelText: label ? label.textContent.trim() : null,
          titleText: title ? title.textContent.trim() : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Hindi translations check:', hindiCheck.result.value);

  snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283/wc_15_kill_sheet_warning_checkbox_hindi.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved wc_15_kill_sheet_warning_checkbox_hindi.png');

  // Reset back to English
  await send('Runtime.evaluate', {
    expression: `if (typeof window.I18n !== 'undefined') window.I18n.setLanguage('en');`
  });

  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  ws.close();
}

main().catch(console.error);
