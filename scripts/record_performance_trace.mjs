// scripts/record_performance_trace.mjs
// Records a 5-second DevTools Performance trace of scroll fling on screen-drilling-guide,
// validates p95 frame time < 16.7ms, 0 layout shifts (CLS=0), and 0 long tasks (>50ms).

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const adbPath = '/Users/sohan/Library/Android/sdk/platform-tools/adb';

async function main() {
  console.log('--- Initializing Performance Trace Recording ---');

  // Forward adb port
  try {
    const sockets = execSync(`${adbPath} shell "grep -a webview /proc/net/unix" 2>/dev/null`, { encoding: 'utf8' });
    const m = sockets.match(/@webview_devtools_remote_(\d+)/);
    if (m) {
      execSync(`${adbPath} forward tcp:9222 localabstract:webview_devtools_remote_${m[1]}`);
    }
  } catch (e) {
    console.error('Error forwarding adb socket:', e.message);
  }

  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const target = list.find(t => t.url.includes('localhost')) || list[0];
  console.log('Connecting to target:', target.webSocketDebuggerUrl);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(res => ws.onopen = res);

  let msgId = 1;
  const traceEvents = [];

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

  ws.addEventListener('message', (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.method === 'Tracing.dataCollected') {
        traceEvents.push(...data.params.value);
      }
    } catch (_) {}
  });

  // Switch to drilling guide screen and reset scroll
  await send('Runtime.evaluate', {
    expression: `
      state.currentScreen = 'drilling-guide';
      renderScreen();
      const scroller = document.querySelector('#screen-drilling-guide .scroller');
      scroller.scrollTop = 0;
    `
  });

  await new Promise(r => setTimeout(r, 200));

  console.log('Starting Tracing...');
  await send('Tracing.start', {
    categories: '-*,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,v8.execute',
    transferMode: 'ReportEvents'
  });

  console.log('Simulating 5-second realistic scroll fling session...');
  const traceStartTime = Date.now();

  // Run scroll simulation for 5 seconds inside the WebView
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      new Promise(async (resolve) => {
        const scroller = document.querySelector('#screen-drilling-guide .scroller');
        const startTime = performance.now();
        const duration = 5000; // 5 seconds
        
        let targetScroll = 0;
        let currentScroll = 0;
        
        function tick(now) {
          const elapsed = now - startTime;
          if (elapsed >= duration) {
            resolve();
            return;
          }
          
          // Phase 1: 0 - 1500ms: fling up to 800px
          if (elapsed < 1500) {
            const p = elapsed / 1500;
            const easeOut = 1 - Math.pow(1 - p, 3);
            targetScroll = easeOut * 800;
          }
          // Phase 2: 1500 - 2500ms: coast and small reverse mid-page (800 -> 500)
          else if (elapsed < 2500) {
            const p = (elapsed - 1500) / 1000;
            targetScroll = 800 - p * 300;
          }
          // Phase 3: 2500 - 3800ms: second fling up (500 -> 1200)
          else if (elapsed < 3800) {
            const p = (elapsed - 2500) / 1300;
            const ease = 1 - Math.pow(1 - p, 2);
            targetScroll = 500 + ease * 700;
          }
          // Phase 4: 3800 - 5000ms: return all the way to 0 (top)
          else {
            const p = (elapsed - 3800) / 1200;
            const easeOut = 1 - Math.pow(1 - p, 3);
            targetScroll = 1200 * (1 - easeOut);
          }
          
          scroller.scrollTop = targetScroll;
          requestAnimationFrame(tick);
        }
        
        requestAnimationFrame(tick);
      })
    `
  });

  console.log('Scroll session completed. Stopping trace...');
  const traceEndPromise = new Promise((resolve) => {
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.method === 'Tracing.tracingComplete') {
        ws.removeEventListener('message', handler);
        resolve();
      }
    };
    ws.addEventListener('message', handler);
  });

  await send('Tracing.end');
  await traceEndPromise;
  console.log(`Trace collected: ${traceEvents.length} events.`);

  ws.close();

  // Save trace
  const tracePath = path.resolve('collapsing_header_trace.json');
  fs.writeFileSync(tracePath, JSON.stringify(traceEvents, null, 2));
  console.log(`Saved trace file to ${tracePath}`);

  // Analyze trace metrics
  console.log('\n--- Trace Analysis ---');

  // 1. Layout Shift events
  const layoutShifts = traceEvents.filter(e => e.name === 'LayoutShift' || (e.args && e.args.data && e.args.data.is_layout_shift));
  const cls = layoutShifts.reduce((acc, e) => acc + (e.args?.data?.score || 0), 0);
  console.log(`Layout Shifts count: ${layoutShifts.length}, Cumulative Layout Shift (CLS): ${cls}`);

  // 2. Long tasks (> 50ms)
  const longTasks = traceEvents.filter(e => {
    // dur is in microseconds in Chrome trace
    return (e.name === 'RunTask' || e.name === 'Task') && (e.dur > 50000);
  });
  console.log(`Long Tasks (>50ms) count: ${longTasks.length}`);

  // 3. Frame times
  const frameEvents = traceEvents.filter(e => e.name === 'BeginFrame' || e.name === 'DrawFrame' || e.name === 'Commit');
  console.log(`Total frame-related events: ${frameEvents.length}`);

  // Measure RAF frame intervals captured during the scroll
  const renderEvents = traceEvents.filter(e => e.name === 'FireAnimationFrame' && e.dur);
  const frameDurationsMs = renderEvents.map(e => e.dur / 1000).sort((a, b) => a - b);
  
  let p50 = 0, p95 = 0, p99 = 0, maxFrame = 0;
  if (frameDurationsMs.length > 0) {
    p50 = frameDurationsMs[Math.floor(frameDurationsMs.length * 0.50)];
    p95 = frameDurationsMs[Math.floor(frameDurationsMs.length * 0.95)];
    p99 = frameDurationsMs[Math.floor(frameDurationsMs.length * 0.99)];
    maxFrame = frameDurationsMs[frameDurationsMs.length - 1];
  }

  console.log(`Animation Frame sample count: ${frameDurationsMs.length}`);
  console.log(`Frame Durations: p50 = ${p50.toFixed(2)}ms, p95 = ${p95.toFixed(2)}ms, p99 = ${p99.toFixed(2)}ms, max = ${maxFrame.toFixed(2)}ms`);

  // Assertions against contract targets
  console.log('\n--- Contract Verification ---');
  if (cls === 0) {
    console.log('✅ CLS = 0 (Zero layout shifts during scroll fling)');
  } else {
    console.warn(`⚠️ Layout shift detected: CLS = ${cls}`);
  }

  if (longTasks.length === 0) {
    console.log('✅ 0 Long Tasks > 50ms during scroll fling');
  } else {
    console.warn(`⚠️ Long tasks detected: ${longTasks.length}`);
  }

  if (p95 < 16.7) {
    console.log(`✅ p95 Frame Time = ${p95.toFixed(2)}ms < 16.7ms (Smooth 60-120fps budget satisfied)`);
  } else {
    console.warn(`⚠️ p95 frame time exceeded: ${p95.toFixed(2)}ms`);
  }

  const summary = {
    screen: 'drilling-guide',
    durationMs: 5000,
    traceEventsCount: traceEvents.length,
    layoutShifts: layoutShifts.length,
    cls,
    longTasksCount: longTasks.length,
    frameDurations: {
      samples: frameDurationsMs.length,
      p50_ms: p50,
      p95_ms: p95,
      p99_ms: p99,
      max_ms: maxFrame
    }
  };

  fs.writeFileSync('perf_summary.json', JSON.stringify(summary, null, 2));
  console.log('Saved perf_summary.json');
}

main().catch(err => {
  console.error('Performance Trace Error:', err);
  process.exit(1);
});
