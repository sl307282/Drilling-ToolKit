// scripts/record_emulator_gestures.mjs
// Records video and screenshots of the 4 required gestures on emulator-5554

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const adbPath = '/Users/sohan/Library/Android/sdk/platform-tools/adb';
const artifactDir = '/Users/sohan/.gemini/antigravity/brain/0a3170c7-7294-424a-8279-e6df6b6c5283';
const screenshotsDir = path.join(artifactDir, 'screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

function sh(cmd) {
  return execSync(`${adbPath} ${cmd}`, { encoding: 'utf8' });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureScreenshot(name) {
  const devicePath = `/sdcard/${name}.png`;
  const localPath = path.join(screenshotsDir, `${name}.png`);
  sh(`shell screencap -p ${devicePath}`);
  sh(`pull ${devicePath} "${localPath}"`);
  sh(`shell rm ${devicePath}`);
  console.log(`Saved screenshot: ${localPath}`);
  return localPath;
}

async function run() {
  console.log('--- Starting Emulator Gesture Recording ---');

  // Re-forward port and connect to WebView to switch screen cleanly
  const sockets = sh('shell "grep -a webview /proc/net/unix"');
  const m = sockets.match(/@webview_devtools_remote_(\d+)/);
  if (m) sh(`forward tcp:9222 localabstract:webview_devtools_remote_${m[1]}`);

  // Navigate to Drilling Guide screen
  console.log('Navigating to Drilling Guide...');
  await fetch('http://127.0.0.1:9222/json').then(r => r.json()).then(async list => {
    const ws = new WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise(res => ws.onopen = res);
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          state.currentScreen = 'drilling-guide';
          renderScreen();
          const s = document.querySelector('#screen-drilling-guide .scroller');
          if (s) s.scrollTop = 0;
        `
      }
    }));
    await sleep(200);
    ws.close();
  });

  await sleep(500);

  // Start background screen recording on device
  console.log('Starting screen recording on device...');
  sh('shell rm -f /sdcard/collapsing_header_demo.mp4');
  const recordProc = spawn(adbPath, ['shell', 'screenrecord', '--bit-rate', '6000000', '/sdcard/collapsing_header_demo.mp4']);

  await sleep(1000);

  // Gesture 3 Initial State: Expanded at top
  console.log('Capturing Initial State: Expanded at top (Gesture 3/initial)...');
  await captureScreenshot('gesture_0_expanded_top');
  await sleep(600);

  // Gesture 1: Scroll up moderately fast
  console.log('Executing Gesture 1: Scroll up...');
  sh('shell input swipe 640 1800 640 900 350');
  await sleep(800);
  console.log('Capturing Gesture 1: Collapsed state...');
  await captureScreenshot('gesture_1_collapsed_scroll_up');
  await sleep(600);

  // Gesture 2: Scroll down mid-page (header MUST stay collapsed)
  console.log('Executing Gesture 2: Scroll down mid-page...');
  sh('shell input swipe 640 1000 640 1350 350');
  await sleep(800);
  console.log('Capturing Gesture 2: Stays collapsed mid-page...');
  await captureScreenshot('gesture_2_stays_collapsed_mid_page');
  await sleep(600);

  // Gesture 3: Scroll all the way back to top (scrollTop = 0) -> expands smoothly
  console.log('Executing Gesture 3: Scroll back to very top...');
  sh('shell input swipe 640 800 640 2200 400');
  await sleep(800);
  console.log('Capturing Gesture 3: Expanded back at top...');
  await captureScreenshot('gesture_3_expanded_at_top');
  await sleep(600);

  // Gesture 4: Pull down at top -> verify NO Android 12+ rubber-band stretch
  console.log('Executing Gesture 4: Pull down at top (test overscroll stretch prevention)...');
  sh('shell input swipe 640 900 640 1700 500');
  await sleep(400);
  console.log('Capturing Gesture 4: Pull down at top (no stretch bounce)...');
  await captureScreenshot('gesture_4_no_overscroll_stretch');
  await sleep(1000);

  // Stop recording
  console.log('Stopping screen recording...');
  recordProc.kill('SIGINT');
  await sleep(2000);

  // Pull video file
  const videoLocalPath = path.join(artifactDir, 'collapsing_header_gestures.mp4');
  sh(`pull /sdcard/collapsing_header_demo.mp4 "${videoLocalPath}"`);
  sh('shell rm /sdcard/collapsing_header_demo.mp4');
  console.log(`Video saved to: ${videoLocalPath}`);

  console.log('--- Gesture Verification Recording Complete! ---');
}

run().catch(err => {
  console.error('Gesture recording error:', err);
  process.exit(1);
});
