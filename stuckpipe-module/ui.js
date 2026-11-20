// Stuck Pipe Assistant - UI. Vanilla DOM, no dependencies. Usage: mountStuckPipe(document.getElementById('root'))
import {
  diagnose, playbookFor, TIGHT_HOLE, UNIVERSAL_FIRST, DEFAULT_INPUT, calc,
  unitLabel, toDisplay, toField, buildReport,
} from './engine.js';

// ------------------------------------------------------------ tiny helpers
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value' || k === 'checked' || k === 'open') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
const parseNum = (s) => { const v = parseFloat(String(s).replace(',', '.')); return Number.isFinite(v) ? v : NaN; };
const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 }) : '-');
const plain = (v) => (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000) : '');
const pct = (p) => (p < 0.01 ? '<1%' : Math.round(p * 100) + '%');

// ------------------------------------------------------------ questions
const Q = [
  { id: 'operation', title: 'What was happening when it stuck?', opts: () => [
    ['drilling', 'Drilling (rotating)'], ['sliding', 'Sliding / oriented'], ['reaming', 'Reaming / back-reaming'],
    ['tripping_out', 'Tripping out'], ['tripping_in', 'Tripping in'], ['static', 'Static (connection, survey, rack)'] ] },
  { id: 'lastMove', title: 'Last pipe movement before sticking', opts: () => [
    ['up', 'Moving up'], ['down', 'Moving down'], ['rotating', 'Rotating only'], ['none', 'Stationary'] ] },
  { id: 'circulation', title: 'Circulation', opts: () => [
    ['full', 'Normal (unrestricted)'], ['restricted', 'Restricted (high pressure)'], ['none', 'None / blocked'] ] },
  { id: 'onset', title: 'How did pressure change?', when: (i) => i.circulation === 'restricted' || i.circulation === 'none', opts: () => [
    ['sudden', 'Sudden'], ['gradual', 'Gradual build-up'] ] },
  { id: 'rotation', title: 'Rotation / torque', opts: () => [
    ['free', 'Free'], ['restricted', 'Restricted / high torque'], ['locked', 'Locked'] ] },
  { id: 'movement', title: 'Which way can you move the string?', hint: 'Test carefully, inside pull and slack-off limits', opts: () => [
    ['neither', 'Neither up nor down'], ['down_only', 'Down only (cannot pull)'], ['up_only', 'Up only (cannot lower)'], ['both', 'Both ways (tight, high drag)'] ] },
  { id: 'angle', title: 'Hole inclination at the stuck point', opts: () => [
    ['low', 'Below 30°'], ['mid', '30° to 60°'], ['high', 'Above 60°'] ] },
  { id: 'staticTime', title: 'Time stationary before sticking', when: (i) => i.operation === 'static' || i.lastMove === 'none', opts: () => [
    ['short', 'Minutes (under 10 min)'], ['long', 'Long (over 10 min)'] ] },
  { id: 'mud', title: 'Mud type', opts: () => [['wbm', 'Water-based'], ['obm', 'Oil / synthetic-based']] },
];

const FLAGS = [
  ['torque_trend', 'Torque was increasing'], ['drag_trend', 'Drag / overpull was increasing'],
  ['poor_cleaning', 'Hole-cleaning problems (low flow, high ROP, fewer cuttings)'], ['cavings', 'Cavings at the shakers'],
  ['losses', 'Mud losses'], ['swab', 'Swab / surge suspected'], ['bha_change', 'New or stiffer BHA'],
  ['dogleg', 'Known dogleg / high DLS'], ['prev_tight', 'Tight spot here on a previous trip'],
  ['interbedded', 'Interbedded hard and soft formations'], ['bit_undergauge', 'Previous bit came out undergauge'],
  ['thick_cake', 'High fluid loss / thick filter cake'], ['junk', 'Junk in hole'],
  ['cement', 'Cement job / cement blocks'], ['casing', 'Suspected casing damage'],
  ['salt', 'Drilling through salt / plastic shale'], ['permeable_zone', 'Across a sand / depleted zone (from mud log)'],
];

const CALC_DEFAULTS = {
  mw: 11.5, ppEmw: 9.0, tvd: 10000, contact: 60, od: 6.5, cake: 0.125, mu: 0.15,
  yield: 560000, df: 0.9, freeW: 250000, pillMw: 7.0, pillTvd: 1000,
  stretch: 24, pull: 30000, sections: [{ lengthFt: 20000, weightLbft: 19.5 }],
  hole: 8.5, pipe: 5.0, interval: 200, margin: 100, excess: 20, leave: 10,
};

const DIR_LABEL = { down: ['↓', 'DOWN'], up: ['↑', 'UP'], unknown: ['?', 'CONFIRM'] };

// ------------------------------------------------------------ main
export function mountStuckPipe(root, options = {}) {
  const key = options.storageKey || 'stuckpipe';
  const state = {
    tab: 'diagnose',
    sys: store.get(key + '.sys', 'field'),
    input: { ...DEFAULT_INPUT() },
    planId: null,
    calcTab: 'diff',
    calc: JSON.parse(JSON.stringify(CALC_DEFAULTS)),
    log: store.get(key + '.log', []),
    clearArm: false,
  };

  root.classList.add('sp');
  root.replaceChildren();
  const head = h('header', { class: 'sp-head' });
  const panel = h('main', { class: 'sp-panel' });
  const live = h('button', { type: 'button', class: 'sp-live', hidden: true });
  const foot = h('p', { class: 'sp-foot' }, 'Decision support only. Follow operator stuck-pipe procedures, well-control policy and equipment limits.');
  root.append(head, panel, foot);

  let toastTimer;
  function toast(msg) {
    root.querySelectorAll('.sp-toast').forEach((n) => n.remove());
    const t = h('div', { class: 'sp-toast', role: 'status' }, msg);
    root.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2200);
  }

  // ---------------------------------------------------- header
  function renderHead() {
    const unitBtn = (sys, label) => h('button', {
      type: 'button', class: state.sys === sys ? 'on' : '', 'aria-pressed': String(state.sys === sys),
      onclick: () => { state.sys = sys; store.set(key + '.sys', sys); renderHead(); renderPanel(); },
    }, label);
    const tab = (id, label) => h('button', {
      type: 'button', class: 'sp-tab' + (state.tab === id ? ' on' : ''), role: 'tab', 'aria-selected': String(state.tab === id),
      onclick: () => { state.tab = id; renderHead(); renderPanel(); window.scrollTo && window.scrollTo(0, 0); },
    }, label);
    head.replaceChildren(
      h('div', { class: 'sp-title-row' },
        h('h1', { class: 'sp-title' }, 'Stuck Pipe Assistant'),
        h('div', { class: 'sp-units', role: 'group', 'aria-label': 'Units' }, unitBtn('field', 'Oilfield'), unitBtn('metric', 'Metric'))),
      h('p', { class: 'sp-sub' }, 'Identify the sticking mechanism and the right first actions'),
      h('div', { class: 'sp-tabs', role: 'tablist' }, tab('diagnose', 'Diagnose'), tab('calc', 'Calculate'), tab('log', 'Log')),
      live);
    if (state.tab !== 'diagnose') live.hidden = true;
  }

  function renderPanel() {
    panel.replaceChildren();
    if (state.tab === 'diagnose') renderDiagnose();
    else if (state.tab === 'calc') renderCalc();
    else renderLog();
  }

  // ---------------------------------------------------- diagnose
  function renderDiagnose() {
    const formCard = h('section', { class: 'sp-card' });
    const results = h('div', { style: 'display:grid;gap:14px' });

    const first = h('details', { class: 'sp-card', open: !store.get(key + '.seenFirst', false) },
      h('summary', null, 'First 5 minutes checklist (any stuck pipe)'),
      h('ol', null, UNIVERSAL_FIRST.map((t) => h('li', null, t))));
    first.addEventListener('toggle', () => { if (!first.open) store.set(key + '.seenFirst', true); });

    const redraw = () => { drawForm(); drawResults(); };

    function drawForm() {
      const i = state.input;
      const nodes = Q.filter((q) => !q.when || q.when(i)).map((q) => {
        const cur = i[q.id];
        const group = h('div', { class: 'sp-chips', role: 'radiogroup', 'aria-label': q.title },
          q.opts(state.sys).map(([val, label]) => h('button', {
            type: 'button', class: 'sp-chip' + (cur === val ? ' on' : ''), role: 'radio', 'aria-checked': String(cur === val),
            onclick: () => { i[q.id] = cur === val ? 'unknown' : val; redraw(); },
          }, label)));
        return h('div', { class: 'sp-q' }, h('div', { class: 'sp-qt' }, q.title, q.hint ? h('span', { class: 'sp-hint' }, q.hint) : null), group);
      });
      const flagBox = h('details', { open: i.flags.length > 0 },
        h('summary', null, 'More indicators (optional)' + (i.flags.length ? ' · ' + i.flags.length + ' selected' : '')),
        h('div', { class: 'sp-chips', style: 'margin-top:10px' }, FLAGS.map(([id, label]) => {
          const on = i.flags.includes(id);
          return h('button', {
            type: 'button', class: 'sp-chip' + (on ? ' on' : ''), role: 'checkbox', 'aria-checked': String(on),
            onclick: () => { i.flags = on ? i.flags.filter((f) => f !== id) : [...i.flags, id]; redraw(); },
          }, label);
        })));
      const reset = h('div', { class: 'sp-row', style: 'margin-top:12px' },
        h('button', { type: 'button', class: 'sp-btn ghost small', onclick: () => { state.input = { ...DEFAULT_INPUT() }; state.planId = null; redraw(); } }, 'Reset answers'));
      formCard.replaceChildren(
        h('h2', null, 'What do you observe?'),
        h('p', { class: 'sp-muted', style: 'margin-bottom:12px' }, 'Answer what you know. Tap an answer again to clear it. The diagnosis updates as you go.'),
        ...nodes, flagBox, reset);
    }

    function drawResults() {
      const r = diagnose(state.input);
      results.replaceChildren();
      live.hidden = r.status === 'insufficient';
      if (r.status === 'insufficient') {
        results.append(h('div', { class: 'sp-callout info' }, h('strong', null, 'Start with two answers'),
          'Tell me what was happening and the state of circulation. A diagnosis appears straight away and sharpens with each answer.'));
        return;
      }
      const [lead, ...others] = r.ranked;
      live.replaceChildren(h('span', null, lead.name), h('b', null, pct(lead.prob) + ' · ' + r.confidence.level + ' ›'));
      live.onclick = () => results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const alt = others.find((o) => o.prob >= 0.15);
      if (state.planId && ![lead.id, alt && alt.id].includes(state.planId)) state.planId = null;
      const planId = state.planId || lead.id;
      const planMech = r.ranked.find((m) => m.id === planId);

      if (r.status === 'tight_hole') {
        results.append(h('div', { class: 'sp-callout warn' }, h('strong', null, 'Tight hole: not yet stuck'),
          'The string still moves both ways. Treat this as a warning and act before it becomes stuck pipe.',
          h('ul', null, TIGHT_HOLE.now.map((t) => h('li', null, t))),
          h('strong', { style: 'margin-top:8px' }, 'Do not'), h('ul', null, TIGHT_HOLE.avoid.map((t) => h('li', null, t)))));
      }

      // leading mechanism
      results.append(h('section', { class: 'sp-card sp-lead' },
        h('div', { class: 'sp-eyebrow' }, 'Most likely · ' + lead.family),
        h('h2', null, lead.name),
        h('div', { class: 'sp-probrow' }, h('div', { class: 'sp-bar' }, h('i', { style: 'width:' + Math.round(lead.prob * 100) + '%' })), h('span', { class: 'sp-pct' }, pct(lead.prob))),
        h('span', { class: 'sp-badge ' + r.confidence.level }, 'Confidence: ' + r.confidence.level),
        h('p', { class: 'sp-muted' }, lead.summary),
        h('p', { class: 'sp-muted' }, r.confidence.note),
        h('details', { open: true }, h('summary', null, 'Why this mechanism'), h('ul', null, lead.pros.slice(0, 5).map((t) => h('li', null, t)))),
        lead.cons.length ? h('details', null, h('summary', null, 'Evidence against'), h('ul', null, lead.cons.slice(0, 4).map((t) => h('li', null, t)))) : null));

      // other possibilities
      const rest = others.filter((o) => o.prob >= 0.03).slice(0, 4);
      if (rest.length) {
        results.append(h('section', { class: 'sp-card' }, h('h3', null, 'Other possibilities'),
          rest.map((o) => h('button', { type: 'button', class: 'sp-alt', onclick: () => { state.planId = o.id; drawResults(); } },
            h('span', { class: 'n' }, o.name), h('span', { class: 'p' }, pct(o.prob)),
            h('div', { class: 'sp-bar' }, h('i', { style: 'width:' + Math.round(o.prob * 100) + '%' }))))));
      }

      // warnings
      if (r.warnings.length) {
        results.append(h('div', { class: 'sp-callout warn' }, h('strong', null, 'Safety'), h('ul', null, r.warnings.map((t) => h('li', null, t)))));
      }

      // plan selector
      const plan = playbookFor(planMech.id, state.input);
      const leadPlan = playbookFor(lead.id, state.input);
      const altPlan = alt ? playbookFor(alt.id, state.input) : null;
      const short = (m) => m.name.split(':').pop().trim().split('(')[0].trim();
      const seg = h('div', { class: 'sp-seg', role: 'tablist', 'aria-label': 'Action plan for' },
        h('button', { type: 'button', class: planMech.id === lead.id ? 'on' : '', onclick: () => { state.planId = lead.id; drawResults(); } }, 'Plan: ' + short(lead)),
        alt ? h('button', { type: 'button', class: planMech.id === alt.id ? 'on' : '', onclick: () => { state.planId = alt.id; drawResults(); } }, 'If instead: ' + short(alt)) : null);

      const planCard = h('section', { class: 'sp-card' }, alt ? seg : null,
        h('h2', { style: alt ? 'margin-top:12px' : '' }, 'Action plan: ' + planMech.name));

      if (alt) {
        const combined = [...new Set([...leadPlan.avoid, ...altPlan.avoid])];
        results.append(h('div', { class: 'sp-callout danger' }, h('strong', null, 'Could be either: avoid what worsens both'), h('ul', null, combined.map((t) => h('li', null, t)))));
      }

      const dirLabel = DIR_LABEL[plan.jar.dir] || DIR_LABEL.unknown;
      planCard.append(
        h('details', { open: true }, h('summary', null, 'Do now (in this order)'), h('ol', null, plan.now.map((t) => h('li', null, t)))),
        h('details', { open: true }, h('summary', null, 'Jarring direction'),
          h('div', { class: 'sp-jar', style: 'margin-top:10px' },
            h('div', { class: 'sp-jar-dir', 'aria-hidden': 'true' }, h('div', null, h('b', null, dirLabel[0]), dirLabel[1])),
            h('p', { style: 'margin:0;font-size:14px' }, plan.jar.text))),
        h('details', { class: 'danger', open: true }, h('summary', null, 'Do NOT'), h('ul', null, plan.avoid.map((t) => h('li', null, t)))),
        h('details', null, h('summary', null, 'Confirm the diagnosis'),
          h('ul', null, [...plan.confirm, ...(planMech.id === lead.id ? r.checks : [])].map((t) => h('li', null, t)))),
        h('details', null, h('summary', null, 'Escalate if'), h('ul', null, plan.escalate.map((t) => h('li', null, t)))),
        h('details', null, h('summary', null, 'Once free: prevent a repeat'), h('ul', null, plan.prevent.map((t) => h('li', null, t)))));

      const actions = h('div', { class: 'sp-row', style: 'margin-top:12px' },
        h('button', { type: 'button', class: 'sp-btn small', onclick: () => { state.tab = 'calc'; state.calcTab = planMech.id === 'diff' ? 'diff' : 'free'; renderHead(); renderPanel(); window.scrollTo && window.scrollTo(0, 0); } },
          planMech.id === 'diff' ? 'Estimate sticking force' : 'Find free point'),
        h('button', { type: 'button', class: 'sp-btn ghost small', onclick: () => {
          addLog('Diagnosis: ' + lead.name + ' ' + pct(lead.prob) + ' (' + r.confidence.level + ' confidence)'); toast('Added to log');
        } }, 'Add diagnosis to log'));
      planCard.append(actions);
      results.append(planCard);

      if (typeof options.onDiagnosis === 'function') options.onDiagnosis({ input: { ...state.input }, result: r });
    }

    panel.append(first, formCard, results);
    redraw();
  }

  // ---------------------------------------------------- calculators
  function field(label, q, k, update, opts = {}) {
    const c = state.calc;
    const disp = q ? toDisplay(q, c[k], state.sys) : c[k];
    const input = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', value: plain(disp), 'aria-label': label });
    input.addEventListener('input', () => {
      const v = parseNum(input.value);
      c[k] = Number.isFinite(v) ? (q ? toField(q, v, state.sys) : v) : NaN;
      update();
    });
    const unit = opts.unit || (q ? unitLabel(q, state.sys) : '');
    return h('div', { class: 'sp-field' }, h('label', null, label), h('div', { class: 'sp-inwrap' }, input, unit ? h('span', null, unit) : null));
  }
  const res = (label, value, cls = '') => h('div', { class: 'sp-res ' + cls }, h('span', null, label), h('b', null, value));
  const disp = (q, v, d = 0) => fmt(toDisplay(q, v, state.sys), d) + ' ' + unitLabel(q, state.sys);

  function renderCalc() {
    const seg = h('div', { class: 'sp-seg', role: 'tablist' },
      [['diff', 'Differential'], ['free', 'Free point'], ['spot', 'Spot pill']].map(([id, label]) =>
        h('button', { type: 'button', class: state.calcTab === id ? 'on' : '', onclick: () => { state.calcTab = id; renderPanel(); } }, label)));
    panel.append(seg);
    if (state.calcTab === 'diff') panel.append(diffCard());
    else if (state.calcTab === 'free') panel.append(freeCard());
    else panel.append(spotCard());
  }

  function diffCard() {
    const c = state.calc;
    const out = h('div', { class: 'sp-out' });
    const update = () => {
      const ppPsi = 0.052 * c.ppEmw * c.tvd;
      const d = calc.diffForce({ mwPpg: c.mw, ppPsi, tvdFt: c.tvd, mu: c.mu, cakeIn: c.cake, odIn: c.od, contactFt: c.contact });
      if (d.error) { out.replaceChildren(h('p', { class: 'sp-muted' }, 'Enter all values to see the result.')); return; }
      const rows = [
        res('Overbalance (ΔP)', disp('pressure', d.dp), d.dp > 0 ? '' : 'warn'),
        res('Contact width', fmt(toDisplay('dia', d.widthIn, state.sys), 1) + ' ' + unitLabel('dia', state.sys)),
        res('Contact area', state.sys === 'metric' ? fmt(d.areaIn2 * 6.4516, 0) + ' cm²' : fmt(d.areaIn2, 0) + ' in²'),
        res('Estimated sticking force', disp('force', d.forceLbf), 'big'),
      ];
      const sop = calc.safeOverpull({ yieldLbf: c.yield, designFactor: c.df, freeWeightLbf: c.freeW });
      if (!sop.error) {
        rows.push(res('Max allowable hookload', disp('force', sop.maxHookloadLbf)));
        rows.push(res('Safe overpull available', disp('force', sop.overpullLbf), sop.overpullLbf > 0 ? '' : 'bad'));
        const a = calc.assessRelease(d.forceLbf, sop.overpullLbf);
        if (!a.error) {
          rows.push(h('div', { class: 'sp-callout ' + (a.level === 'ok' ? 'ok' : a.level === 'warn' ? 'warn' : 'danger'), style: 'margin-top:8px' }, h('strong', null, 'Margin ' + (Number.isFinite(a.ratio) ? fmt(a.ratio, 2) + 'x' : 'n/a')), a.message));
          const need = calc.requiredDpReduction({ dp: d.dp, forceLbf: d.forceLbf, overpullLbf: sop.overpullLbf });
          if (!need.error && need.reductionPsi > 0) rows.push(res('ΔP cut to reach 70% of available pull', disp('pressure', need.reductionPsi)));
        }
      }
      const pill = calc.hydReduction({ mwPpg: c.mw, pillMwPpg: c.pillMw, pillTvdFt: c.pillTvd });
      if (!pill.error) {
        const remain = d.dp - pill.reductionPsi;
        rows.push(res('Light pill reduces hydrostatic by', disp('pressure', pill.reductionPsi)));
        rows.push(res('Overbalance left after pill', disp('pressure', remain), remain <= 0 ? 'bad' : remain < 100 ? 'warn' : ''));
        if (remain <= 0) rows.push(h('div', { class: 'sp-callout danger', style: 'margin-top:8px' }, h('strong', null, 'Kick risk'), 'This pill would put the zone underbalanced. Check pore pressure and kick margin before doing it.'));
        else if (remain < 100) rows.push(h('div', { class: 'sp-callout warn', style: 'margin-top:8px' }, h('strong', null, 'Thin kick margin'), 'Remaining overbalance is small. Confirm the well-control margin with the supervisor first.'));
      }
      out.replaceChildren(...rows);
    };
    const muBtn = (label, v) => h('button', { type: 'button', class: 'sp-btn ghost small', onclick: () => { c.mu = v; renderPanel(); } }, label + ' ' + v);
    const card = h('section', { class: 'sp-card' },
      h('h2', null, 'Differential sticking force'),
      h('p', { class: 'sp-muted', style: 'margin-bottom:12px' }, 'F = μ × ΔP × contact area. Compare with the pull you can safely apply.'),
      h('div', { class: 'sp-grid2' },
        field('Mud weight', 'density', 'mw', update),
        field('Formation pressure (EMW)', 'density', 'ppEmw', update),
        field('TVD of zone', 'depth', 'tvd', update),
        field('Contact length', 'depth', 'contact', update),
        field('OD of stuck component', 'dia', 'od', update),
        field('Filter cake thickness', 'dia', 'cake', update),
        field('Friction factor μ', null, 'mu', update, { unit: '' })),
      h('div', { class: 'sp-row', style: 'margin-top:8px' }, muBtn('OBM', 0.08), muBtn('WBM', 0.15), muBtn('WBM thick cake', 0.25)),
      h('h3', { style: 'margin-top:16px' }, 'Pull you can apply'),
      h('div', { class: 'sp-grid2' },
        field('Tensile yield, weakest part', 'force', 'yield', update),
        field('Design factor (0-1)', null, 'df', update, { unit: '' }),
        field('String weight in mud', 'force', 'freeW', update)),
      h('h3', { style: 'margin-top:16px' }, 'Hydrostatic reduction (light pill)'),
      h('div', { class: 'sp-grid2' },
        field('Pill density', 'density', 'pillMw', update),
        field('Pill height (TVD)', 'depth', 'pillTvd', update)),
      out);
    update();
    return card;
  }

  function freeCard() {
    const c = state.calc;
    const out = h('div', { class: 'sp-out' });
    const update = () => {
      const r = calc.freePointComposite({ stretchIn: c.stretch, pullLbf: c.pull, sections: c.sections });
      if (r.error) { out.replaceChildren(h('p', { class: 'sp-muted' }, 'Enter all values to see the result.')); return; }
      const total = c.sections.reduce((a, s) => a + s.lengthFt, 0);
      const rows = [];
      if (r.beyondString) {
        rows.push(h('div', { class: 'sp-callout info' }, h('strong', null, 'Stretch exceeds the whole string'),
          'The measured stretch is more than a fully free string would give. The string may be free to the end, or the measurement or weights need checking.'));
      } else {
        rows.push(res('Free point (measured length)', disp('depth', r.freePointFt), 'big'));
        rows.push(res('In section', String(r.sectionIndex + 1) + ' of ' + c.sections.length));
        rows.push(res('Free string vs total', fmt((r.freePointFt / total) * 100, 0) + '%'));
      }
      rows.push(h('p', { class: 'sp-muted' }, 'Stretch method assumes a vertical, friction-free string. In deviated holes friction hides pull and the true free point is usually deeper. Confirm with a free-point tool before a back-off.'));
      out.replaceChildren(...rows);
    };
    const secBox = h('div');
    const drawSections = () => {
      secBox.replaceChildren(...c.sections.map((s, idx) => {
        const lenIn = h('input', { type: 'text', inputmode: 'decimal', value: plain(toDisplay('depth', s.lengthFt, state.sys)), 'aria-label': 'Section ' + (idx + 1) + ' length' });
        const wIn = h('input', { type: 'text', inputmode: 'decimal', value: plain(toDisplay('wpl', s.weightLbft, state.sys)), 'aria-label': 'Section ' + (idx + 1) + ' weight' });
        lenIn.addEventListener('input', () => { const v = parseNum(lenIn.value); s.lengthFt = Number.isFinite(v) ? toField('depth', v, state.sys) : NaN; update(); });
        wIn.addEventListener('input', () => { const v = parseNum(wIn.value); s.weightLbft = Number.isFinite(v) ? toField('wpl', v, state.sys) : NaN; update(); });
        return h('div', { class: 'sp-sec' },
          h('div', { class: 'sp-field' }, idx === 0 ? h('label', null, 'Length (' + unitLabel('depth', state.sys) + ')') : null, h('div', { class: 'sp-inwrap' }, lenIn)),
          h('div', { class: 'sp-field' }, idx === 0 ? h('label', null, 'Weight (' + unitLabel('wpl', state.sys) + ')') : null, h('div', { class: 'sp-inwrap' }, wIn)),
          c.sections.length > 1 ? h('button', { type: 'button', class: 'sp-btn ghost small', 'aria-label': 'Remove section', onclick: () => { c.sections.splice(idx, 1); drawSections(); update(); } }, '✕') : h('span'));
      }));
    };
    const card = h('section', { class: 'sp-card' },
      h('h2', null, 'Free point (stretch method)'),
      h('p', { class: 'sp-muted', style: 'margin-bottom:12px' }, 'Pull to two hookloads and measure the extra stretch. Enter the difference in pull and the stretch between them.'),
      h('div', { class: 'sp-grid2' },
        field('Stretch between pulls', 'dia', 'stretch', update),
        field('Difference in pull', 'force', 'pull', update)),
      h('h3', { style: 'margin-top:16px' }, 'String from surface down'),
      h('p', { class: 'sp-muted', style: 'margin:0 0 8px' }, 'Plain-end weight per length. Add DP, HWDP and DC sections in order.'),
      secBox,
      h('button', { type: 'button', class: 'sp-btn ghost small', onclick: () => { if (c.sections.length < 5) { c.sections.push({ lengthFt: 500, weightLbft: 49 }); drawSections(); update(); } } }, '+ Add section'),
      out);
    drawSections();
    update();
    return card;
  }

  function spotCard() {
    const c = state.calc;
    const out = h('div', { class: 'sp-out' });
    const update = () => {
      const r = calc.spotVolume({ holeIn: c.hole, pipeIn: c.pipe, intervalFt: c.interval, marginFt: c.margin, excessPct: c.excess, leaveInStringBbl: c.leave });
      if (r.error) { out.replaceChildren(h('p', { class: 'sp-muted' }, 'Enter valid values (pipe OD must be smaller than the hole).')); return; }
      const capDisp = state.sys === 'metric' ? fmt(r.capacityBblFt * 0.52161, 4) + ' m³/m' : fmt(r.capacityBblFt, 4) + ' bbl/ft';
      out.replaceChildren(
        res('Annular capacity', capDisp),
        res('Pill across annulus', disp('vol', r.annularBbl, 1)),
        res('Total pill to pump', disp('vol', r.totalBbl, 1), 'big'),
        h('p', { class: 'sp-muted' }, 'Soak in small stages: displace a little pill periodically while working the pipe. Spot fluid type and soak time follow the operator procedure.'));
    };
    const card = h('section', { class: 'sp-card' },
      h('h2', null, 'Spotting pill volume'),
      h('p', { class: 'sp-muted', style: 'margin-bottom:12px' }, 'Annular volume across the stuck interval plus margin, with excess for washout, plus volume to leave inside the string.'),
      h('div', { class: 'sp-grid2' },
        field('Hole size', 'dia', 'hole', update),
        field('Pipe / BHA OD', 'dia', 'pipe', update),
        field('Stuck interval', 'depth', 'interval', update),
        field('Margin (above and below)', 'depth', 'margin', update),
        field('Washout excess', null, 'excess', update, { unit: '%' }),
        field('Volume left in string', 'vol', 'leave', update)),
      out);
    update();
    return card;
  }

  // ---------------------------------------------------- log
  function addLog(note, extra = {}) {
    const now = new Date();
    state.log.push({ time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString(), note, ...extra });
    store.set(key + '.log', state.log);
  }

  function renderLog() {
    const noteEl = h('textarea', { placeholder: 'What did you do or observe? e.g. Jarred down x3 at 60k trip load, no movement', 'aria-label': 'Note' });
    const mk = (ph, label) => h('div', { class: 'sp-field' }, h('label', null, label), h('div', { class: 'sp-inwrap' }, h('input', { type: 'text', placeholder: ph, 'aria-label': label })));
    const depth = mk('', 'Depth'), hook = mk('', 'Hookload'), spp = mk('', 'SPP'), tq = mk('', 'Torque');
    const val = (f) => f.querySelector('input').value.trim();
    const list = h('div');

    const draw = () => {
      list.replaceChildren(...(state.log.length
        ? state.log.slice().reverse().map((e, ri) => {
          const idx = state.log.length - 1 - ri;
          const bits = [e.depth && 'Depth ' + e.depth, e.hookload && 'HL ' + e.hookload, e.spp && 'SPP ' + e.spp, e.torque && 'TQ ' + e.torque].filter(Boolean).join(' · ');
          return h('div', { class: 'sp-log-item' },
            h('div', { class: 'sp-log-meta' }, h('span', null, e.time), h('button', { type: 'button', class: 'sp-btn ghost small', 'aria-label': 'Delete entry', onclick: () => { state.log.splice(idx, 1); store.set(key + '.log', state.log); draw(); } }, 'Delete')),
            bits ? h('div', { class: 'sp-log-meta' }, bits) : null,
            h('div', { style: 'font-size:14px;margin-top:2px' }, e.note));
        })
        : [h('p', { class: 'sp-muted' }, 'No entries yet. Log every action and reading so the next shift and the post-job review have the full picture.')]));
    };

    const add = () => {
      const note = noteEl.value.trim();
      if (!note) { toast('Write a note first'); return; }
      addLog(note, { depth: val(depth), hookload: val(hook), spp: val(spp), torque: val(tq) });
      noteEl.value = ''; [depth, hook, spp, tq].forEach((f) => { f.querySelector('input').value = ''; });
      draw(); toast('Logged');
    };

    const report = () => buildReport({ input: state.input, result: diagnose(state.input), log: state.log, system: state.sys });
    const share = async () => {
      const text = report();
      try {
        if (navigator.share) { await navigator.share({ title: 'Stuck pipe report', text }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Report copied'); }
      catch (e) {
        const ta = h('textarea', { style: 'position:fixed;opacity:0' }, text); document.body.append(ta); ta.select();
        try { document.execCommand('copy'); toast('Report copied'); } catch (err) { toast('Could not copy'); }
        ta.remove();
      }
    };

    const clearBtn = h('button', { type: 'button', class: 'sp-btn ghost small' }, state.clearArm ? 'Tap again to clear' : 'Clear log');
    clearBtn.addEventListener('click', () => {
      if (!state.clearArm) { state.clearArm = true; clearBtn.textContent = 'Tap again to clear'; setTimeout(() => { state.clearArm = false; clearBtn.textContent = 'Clear log'; }, 3000); return; }
      state.log = []; store.set(key + '.log', []); state.clearArm = false; clearBtn.textContent = 'Clear log'; draw();
    });

    panel.append(
      h('section', { class: 'sp-card' },
        h('h2', null, 'Incident log'),
        h('p', { class: 'sp-muted', style: 'margin-bottom:12px' }, 'Time-stamped record of actions and readings.'),
        noteEl,
        h('div', { class: 'sp-grid2', style: 'margin-top:10px' }, depth, hook, spp, tq),
        h('div', { class: 'sp-row', style: 'margin-top:12px' }, h('button', { type: 'button', class: 'sp-btn', onclick: add }, 'Add entry'))),
      h('section', { class: 'sp-card' }, list,
        h('div', { class: 'sp-row', style: 'margin-top:12px' },
          h('button', { type: 'button', class: 'sp-btn small', onclick: share }, 'Share report'), clearBtn)));
    draw();
  }

  renderHead();
  renderPanel();
  return { getState: () => ({ input: { ...state.input }, sys: state.sys }), destroy: () => root.replaceChildren() };
}
