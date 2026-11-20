# Stuck Pipe Assistant: drop-in module

Framework-free (vanilla JS + CSS). Works offline inside a Capacitor WebView.

| File | Purpose |
|---|---|
| `engine.js` | Pure logic: evidence-weighted diagnosis of 9 mechanisms, action playbooks, calculators, unit conversion, report builder |
| `ui.js` | Mobile UI: Diagnose / Calculate / Log tabs. Exports `mountStuckPipe(el, options)` |
| `stuckpipe.css` | Scoped styles (`.sp`), light and dark, brand colours via CSS variables |
| `engine.test.mjs` | 33 checks. Run with `node engine.test.mjs` |
| `stuckpipe-demo.html` | Single-file preview, open in any browser |

## Integrate into your Capacitor project

1. Copy `engine.js`, `ui.js`, `stuckpipe.css` into your web source, e.g. `src/stuckpipe/`.
2. Replace the old Stuck Pipe screen body with a container and mount it:

```js
import { mountStuckPipe } from './stuckpipe/ui.js';
import './stuckpipe/stuckpipe.css';

mountStuckPipe(document.getElementById('stuckpipe-root'), {
  storageKey: 'drillingtoolkit.stuckpipe',          // optional
  onDiagnosis: ({ input, result }) => {},           // optional hook
});
```

React:

```jsx
import { useEffect, useRef } from 'react';
import { mountStuckPipe } from './stuckpipe/ui.js';
export default function StuckPipe() {
  const ref = useRef(null);
  useEffect(() => { const h = mountStuckPipe(ref.current); return () => h.destroy(); }, []);
  return <div ref={ref} />;
}
```

3. Build your web app, then `npx cap sync android` and run from Android Studio.

## The "star_border" text in the old header

Your old screen shows the literal text `star_border`. That is a Material Icons ligature rendering as plain text because the icon font is not loading (usually it is fetched from Google Fonts, which fails offline). This module uses no icon fonts. For the rest of your app, bundle the font locally or switch to inline SVG.

## Tuning

All evidence weights live in the `RULES` table in `engine.js`: `[mechanism, test, weight, reason]`. Add your company's own rules or thresholds there, plus the test scenarios in `engine.test.mjs`. Review weights and playbooks with your drilling engineers and company stuck-pipe procedure before field use.

## Limits

Decision support only. The free-point stretch method assumes a vertical, frictionless string, so confirm with a free-point tool before any back-off.
