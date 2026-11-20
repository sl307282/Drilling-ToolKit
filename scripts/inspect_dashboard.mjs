import { execSync } from 'node:child_process';

const adbPath = '/Users/sohan/Library/Android/sdk/platform-tools/adb';

async function main() {
  try {
    const sockets = execSync(`${adbPath} shell "grep -a webview /proc/net/unix" 2>/dev/null`, { encoding: 'utf8' });
    const m = sockets.match(/@webview_devtools_remote_(\d+)/);
    if (m) execSync(`${adbPath} forward tcp:9222 localabstract:webview_devtools_remote_${m[1]}`);
  } catch (_) {}

  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise(res => ws.onopen = res);

  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        state.currentScreen = 'dashboard';
        renderScreen();
        const topBar = document.querySelector('.top-bar');
        const search = document.querySelector('.search-container');
        const dash = document.getElementById('screen-dashboard');
        function r(rect) {
          return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
        }
        return {
          topBarRect: r(topBar.getBoundingClientRect()),
          topBarDisplay: getComputedStyle(topBar).display,
          searchRect: r(search.getBoundingClientRect()),
          searchDisplay: getComputedStyle(search).display,
          dashRect: r(dash.getBoundingClientRect()),
          dashOverflow: getComputedStyle(dash).overflow,
          dashDisplay: getComputedStyle(dash).display,
          appContainerPadding: getComputedStyle(document.querySelector('.app-container')).padding
        };
      })()
    `,
    returnByValue: true
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
}

main().catch(console.error);
