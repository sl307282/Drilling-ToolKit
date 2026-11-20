const code = process.argv[2] || 'document.location.href';

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await res.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) {
    console.error('No WebView page found');
    process.exit(1);
  }
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
      if (data.result.exceptionDetails) {
        console.error('Exception:', data.result.exceptionDetails);
      } else {
        console.log(JSON.stringify(data.result.result.value, null, 2));
      }
      ws.close();
      process.exit(0);
    }
  };
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
