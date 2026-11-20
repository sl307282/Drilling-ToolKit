// Stuck Pipe Assistant - UI Module for DrillingToolkit
// 100% Offline, Native Select Dropdowns, Full 13-Language i18n
import {
  diagnose, playbookFor, TIGHT_HOLE, UNIVERSAL_FIRST, DEFAULT_INPUT, calc,
  unitLabel, toDisplay, toField, buildReport,
} from './engine.js';
import { tr, STUCKPIPE_LOCALES } from './locales.js';

// Feature flags
export const showLog = false; // Hide log tab behind feature flag

// DOM helper
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

const parseNum = (s) => {
  if (s == null) return NaN;
  const v = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(v) ? v : NaN;
};

const fmt = (v, d = 0) => {
  if (!Number.isFinite(v)) return '-';
  const lang = (window.I18n && window.I18n.getCurrentLang()) || 'en';
  try {
    return v.toLocaleString(lang === 'ar' ? 'ar-EG' : undefined, {
      maximumFractionDigits: d,
      minimumFractionDigits: 0,
    });
  } catch (e) {
    return v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });
  }
};

const plain = (v) => (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000) : '');
const pct = (p) => (p < 0.01 ? '<1%' : Math.round(p * 100) + '%');

// Questions structure
const QUESTIONS = [
  {
    id: 'operation',
    labelKey: 'stuckpipe.q.operation.title',
    opts: [
      ['drilling', 'stuckpipe.q.operation.drilling'],
      ['sliding', 'stuckpipe.q.operation.sliding'],
      ['reaming', 'stuckpipe.q.operation.reaming'],
      ['tripping_out', 'stuckpipe.q.operation.tripping_out'],
      ['tripping_in', 'stuckpipe.q.operation.tripping_in'],
      ['static', 'stuckpipe.q.operation.static'],
    ],
  },
  {
    id: 'lastMove',
    labelKey: 'stuckpipe.q.lastMove.title',
    opts: [
      ['up', 'stuckpipe.q.lastMove.up'],
      ['down', 'stuckpipe.q.lastMove.down'],
      ['rotating', 'stuckpipe.q.lastMove.rotating'],
      ['none', 'stuckpipe.q.lastMove.none'],
    ],
  },
  {
    id: 'circulation',
    labelKey: 'stuckpipe.q.circulation.title',
    opts: [
      ['full', 'stuckpipe.q.circulation.full'],
      ['restricted', 'stuckpipe.q.circulation.restricted'],
      ['none', 'stuckpipe.q.circulation.none'],
    ],
  },
  {
    id: 'onset',
    labelKey: 'stuckpipe.q.onset.title',
    when: (i) => i.circulation === 'restricted' || i.circulation === 'none',
    opts: [
      ['sudden', 'stuckpipe.q.onset.sudden'],
      ['gradual', 'stuckpipe.q.onset.gradual'],
    ],
  },
  {
    id: 'rotation',
    labelKey: 'stuckpipe.q.rotation.title',
    opts: [
      ['free', 'stuckpipe.q.rotation.free'],
      ['restricted', 'stuckpipe.q.rotation.restricted'],
      ['locked', 'stuckpipe.q.rotation.locked'],
    ],
  },
  {
    id: 'movement',
    labelKey: 'stuckpipe.q.movement.title',
    hintKey: 'stuckpipe.q.movement.hint',
    opts: [
      ['neither', 'stuckpipe.q.movement.neither'],
      ['down_only', 'stuckpipe.q.movement.down_only'],
      ['up_only', 'stuckpipe.q.movement.up_only'],
      ['both', 'stuckpipe.q.movement.both'],
    ],
  },
  {
    id: 'angle',
    labelKey: 'stuckpipe.q.angle.title',
    opts: [
      ['low', 'stuckpipe.q.angle.low'],
      ['mid', 'stuckpipe.q.angle.mid'],
      ['high', 'stuckpipe.q.angle.high'],
    ],
  },
  {
    id: 'staticTime',
    labelKey: 'stuckpipe.q.staticTime.title',
    when: (i) => i.operation === 'static' || i.lastMove === 'none',
    opts: [
      ['short', 'stuckpipe.q.staticTime.short'],
      ['long', 'stuckpipe.q.staticTime.long'],
    ],
  },
  {
    id: 'mud',
    labelKey: 'stuckpipe.q.mud.title',
    opts: [
      ['wbm', 'stuckpipe.q.mud.wbm'],
      ['obm', 'stuckpipe.q.mud.obm'],
    ],
  },
];

const FLAGS = [
  ['torque_trend', 'stuckpipe.flag.torque_trend'],
  ['drag_trend', 'stuckpipe.flag.drag_trend'],
  ['poor_cleaning', 'stuckpipe.flag.poor_cleaning'],
  ['cavings', 'stuckpipe.flag.cavings'],
  ['losses', 'stuckpipe.flag.losses'],
  ['swab', 'stuckpipe.flag.swab'],
  ['bha_change', 'stuckpipe.flag.bha_change'],
  ['dogleg', 'stuckpipe.flag.dogleg'],
  ['prev_tight', 'stuckpipe.flag.prev_tight'],
  ['interbedded', 'stuckpipe.flag.interbedded'],
  ['bit_undergauge', 'stuckpipe.flag.bit_undergauge'],
  ['thick_cake', 'stuckpipe.flag.thick_cake'],
  ['junk', 'stuckpipe.flag.junk'],
  ['cement', 'stuckpipe.flag.cement'],
  ['casing', 'stuckpipe.flag.casing'],
  ['salt', 'stuckpipe.flag.salt'],
  ['permeable_zone', 'stuckpipe.flag.permeable_zone'],
];

const CALC_DEFAULTS = {
  mw: 11.5, ppEmw: 9.0, tvd: 10000, contact: 60, od: 6.5, cake: 0.125, mu: 0.15,
  yield: 560000, df: 0.9, freeW: 250000, pillMw: 7.0, pillTvd: 1000,
  stretch: 24, pull: 30000, sections: [{ lengthFt: 20000, weightLbft: 19.5 }],
  hole: 8.5, pipe: 5.0, interval: 200, margin: 100, excess: 20, leave: 10,
};

const DIR_LABEL = {
  down: ['↓', 'stuckpipe.jar.down'],
  up: ['↑', 'stuckpipe.jar.up'],
  unknown: ['?', 'stuckpipe.jar.confirm'],
};

// Main Mount Function
export function mountStuckPipe(root, options = {}) {
  const key = options.storageKey || 'drillingtoolkit_stuckpipe';
  
  // App global unit preference default
  const defaultUnit = (typeof state !== 'undefined' && state.globalUnit === 'L/m') ? 'metric' : 'field';

  const s = {
    tab: 'diagnose',
    sys: store.get(key + '.sys', defaultUnit),
    input: { ...DEFAULT_INPUT() },
    planId: null,
    calcTab: 'diff',
    calc: JSON.parse(JSON.stringify(CALC_DEFAULTS)),
    log: store.get(key + '.log', []),
  };

  root.classList.add('sp');
  root.replaceChildren();

  const head = h('header', { class: 'sp-head' });
  const live = h('button', { type: 'button', class: 'sp-live', hidden: true });
  const panel = h('main', { class: 'sp-panel' });
  const foot = h('p', { class: 'sp-foot' });

  root.append(head, live, panel, foot);

  let toastTimer;
  function showToast(msg) {
    root.querySelectorAll('.sp-toast').forEach((n) => n.remove());
    const t = h('div', { class: 'sp-toast', role: 'status' }, msg);
    root.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2500);
  }

  function renderHead() {
    head.replaceChildren();

    // Row with Tabs & Unit toggle
    const controlRow = h('div', { class: 'sp-control-row' });
    
    // Tabs: Diagnose & Calculate (and optionally Log)
    const tabs = h('div', { class: 'sp-tabs', role: 'tablist' },
      h('button', {
        type: 'button', class: 'sp-tab' + (s.tab === 'diagnose' ? ' on' : ''),
        onclick: () => { s.tab = 'diagnose'; redraw(); },
      }, tr('stuckpipe.tab_diagnose')),
      h('button', {
        type: 'button', class: 'sp-tab' + (s.tab === 'calculate' ? ' on' : ''),
        onclick: () => { s.tab = 'calculate'; redraw(); },
      }, tr('stuckpipe.tab_calculate')),
      showLog ? h('button', {
        type: 'button', class: 'sp-tab' + (s.tab === 'log' ? ' on' : ''),
        onclick: () => { s.tab = 'log'; redraw(); },
      }, tr('stuckpipe.tab_log')) : null
    );

    // Unit toggle (Oilfield / Metric)
    const unitToggle = h('div', { class: 'sp-units', role: 'group', 'aria-label': 'Units' },
      h('button', {
        type: 'button', class: s.sys === 'field' ? 'on' : '',
        onclick: () => { s.sys = 'field'; store.set(key + '.sys', 'field'); redraw(); },
      }, tr('stuckpipe.unit_field')),
      h('button', {
        type: 'button', class: s.sys === 'metric' ? 'on' : '',
        onclick: () => { s.sys = 'metric'; store.set(key + '.sys', 'metric'); redraw(); },
      }, tr('stuckpipe.unit_metric'))
    );

    controlRow.append(tabs, unitToggle);
    head.append(controlRow);

    foot.textContent = tr('stuckpipe.disclaimer');
  }

  function redraw() {
    renderHead();
    panel.replaceChildren();
    if (s.tab === 'diagnose') renderDiagnose();
    else if (s.tab === 'calculate') renderCalculate();
    else if (s.tab === 'log' && showLog) renderLog();
  }

  // ---------------------------------------------------------------- Diagnose Section
  function renderDiagnose() {
    const inp = s.input;

    // "First 5 minutes" banner
    const first5 = h('details', { class: 'sp-card', style: 'margin-bottom:0;' },
      h('summary', null, tr('stuckpipe.res_first_5_minutes')),
      h('ol', null, UNIVERSAL_FIRST.map((step) => h('li', null, tr(step.key, {}, step.text))))
    );

    const formCard = h('section', { class: 'sp-card' });
    const resultsContainer = h('div', { id: 'sp-results' });

    function drawForm() {
      const fieldNodes = QUESTIONS.filter((q) => !q.when || q.when(inp)).map((q) => {
        const cur = inp[q.id];
        
        // Native select dropdown
        const select = h('select', {
          class: 'toolkit-select',
          'aria-label': tr(q.labelKey),
          onchange: (e) => {
            inp[q.id] = e.target.value;
            drawForm();
            drawResults();
          },
        },
          // First option: "Not sure" (unknown)
          h('option', { value: 'unknown', selected: cur === 'unknown' }, tr('stuckpipe.opt_unknown')),
          q.opts.map(([val, optKey]) => h('option', { value: val, selected: cur === val }, tr(optKey)))
        );

        return h('div', { class: 'form-group' },
          h('label', { class: 'input-label' }, tr(q.labelKey), q.hintKey ? h('span', { class: 'sp-hint' }, tr(q.hintKey)) : null),
          select
        );
      });

      // Collapsible "More indicators" checkboxes
      const selectedFlagsCount = inp.flags.length;
      const flagDetails = h('details', { open: selectedFlagsCount > 0, style: 'margin-top:10px;' },
        h('summary', null,
          tr('stuckpipe.indicators_title') + (selectedFlagsCount ? ' · ' + tr('stuckpipe.indicators_count', { count: selectedFlagsCount }) : '')
        ),
        h('div', { class: 'sp-checkbox-grid' },
          FLAGS.map(([flagId, flagKey]) => {
            const checked = inp.flags.includes(flagId);
            const cb = h('input', {
              type: 'checkbox',
              checked,
              onchange: (e) => {
                inp.flags = e.target.checked
                  ? [...inp.flags, flagId]
                  : inp.flags.filter((f) => f !== flagId);
                drawForm();
                drawResults();
              },
            });
            return h('label', { class: 'sp-checkbox-item' }, cb, h('span', null, tr(flagKey)));
          })
        )
      );

      // Reset button
      const resetRow = h('div', { class: 'sp-row', style: 'margin-top:14px;' },
        h('button', {
          type: 'button', class: 'sp-btn ghost small',
          onclick: () => {
            s.input = { ...DEFAULT_INPUT() };
            s.planId = null;
            drawForm();
            drawResults();
          },
        }, tr('stuckpipe.btn_reset'))
      );

      // Primary Dark-Brown button scrolling to result
      const diagnoseBtn = h('button', {
        type: 'button',
        class: 'sp-btn',
        style: 'width:100%; margin-top:14px;',
        onclick: () => {
          resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      }, tr('stuckpipe.btn_diagnose'));

      formCard.replaceChildren(
        h('h2', null, tr('stuckpipe.form_title')),
        h('p', { class: 'sp-muted', style: 'margin-bottom:14px;' }, tr('stuckpipe.form_subtitle')),
        ...fieldNodes,
        flagDetails,
        resetRow,
        diagnoseBtn
      );
    }

    function drawResults() {
      const r = diagnose(inp);
      resultsContainer.replaceChildren();

      // Update sticky summary bar under header
      live.hidden = r.status === 'insufficient';
      if (r.status === 'insufficient') {
        resultsContainer.append(
          h('div', { class: 'sp-callout info' },
            h('strong', null, tr('stuckpipe.res_start_title')),
            tr('stuckpipe.res_start_text')
          )
        );
        return;
      }

      const [lead, ...others] = r.ranked;
      const leadName = tr(lead.nameKey, {}, lead.name);
      const confLevel = r.confidence.level;

      live.replaceChildren(
        h('span', null, leadName),
        h('b', null, pct(lead.prob) + ' · ' + confLevel.toUpperCase() + ' ›')
      );
      live.onclick = () => resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Tight hole warning state if movement === 'both'
      if (r.status === 'tight_hole') {
        resultsContainer.append(
          h('div', { class: 'sp-callout warn', style: 'margin-bottom:12px;' },
            h('strong', null, tr('stuckpipe.res_tight_hole_title')),
            tr('stuckpipe.res_tight_hole_text'),
            h('ul', null, TIGHT_HOLE.now.map((step) => h('li', null, tr(step.key, {}, step.text)))),
            h('strong', { style: 'margin-top:8px;' }, tr('stuckpipe.res_do_not')),
            h('ul', null, TIGHT_HOLE.avoid.map((step) => h('li', null, tr(step.key, {}, step.text))))
          )
        );
      }

      // Most Likely Mechanism Card
      const leadCard = h('section', { class: 'sp-card sp-lead' },
        h('div', { class: 'sp-eyebrow' }, tr('stuckpipe.res_most_likely') + ' · ' + tr(lead.familyKey, {}, lead.family)),
        h('h2', null, leadName),
        h('div', { class: 'sp-probrow' },
          h('div', { class: 'sp-bar' }, h('i', { style: 'width:' + Math.round(lead.prob * 100) + '%' })),
          h('span', { class: 'sp-pct' }, pct(lead.prob))
        ),
        h('span', { class: 'sp-badge ' + confLevel }, tr('stuckpipe.res_confidence', { level: tr('stuckpipe.res_confidence_' + confLevel) })),
        h('p', { class: 'sp-muted' }, tr(lead.summaryKey, {}, lead.summary)),
        h('p', { class: 'sp-muted', style: 'font-weight:600;' }, tr(r.confidence.key, {}, r.confidence.note)),
        h('details', { open: true },
          h('summary', null, tr('stuckpipe.res_why')),
          h('ul', null, lead.pros.slice(0, 5).map((x) => h('li', null, tr(x.key, {}, x.text))))
        ),
        lead.cons.length ? h('details', null,
          h('summary', null, tr('stuckpipe.res_evidence_against')),
          h('ul', null, lead.cons.slice(0, 4).map((x) => h('li', null, tr(x.key, {}, x.text))))
        ) : null
      );
      resultsContainer.append(leadCard);

      // Other possibilities
      const rest = others.filter((o) => o.prob >= 0.03).slice(0, 4);
      if (rest.length) {
        const otherSection = h('section', { class: 'sp-card', style: 'margin-top:12px;' },
          h('h3', null, tr('stuckpipe.res_other_possibilities')),
          rest.map((o) => {
            const oName = tr(o.nameKey, {}, o.name);
            return h('button', {
              type: 'button', class: 'sp-alt',
              onclick: () => { s.planId = o.id; drawResults(); },
            },
              h('span', { class: 'n' }, oName),
              h('span', { class: 'p' }, pct(o.prob)),
              h('div', { class: 'sp-bar' }, h('i', { style: 'width:' + Math.round(o.prob * 100) + '%' }))
            );
          })
        );
        resultsContainer.append(otherSection);
      }

      // Safety warnings
      if (r.warnings && r.warnings.length) {
        resultsContainer.append(
          h('div', { class: 'sp-callout warn', style: 'margin-top:12px;' },
            h('strong', null, tr('stuckpipe.res_safety')),
            h('ul', null, r.warnings.map((w) => h('li', null, tr(w.key, {}, w.text))))
          )
        );
      }

      // Action Plan Card
      const alt = others.find((o) => o.prob >= 0.15);
      if (s.planId && ![lead.id, alt && alt.id].includes(s.planId)) s.planId = null;
      const planId = s.planId || lead.id;
      const planMech = r.ranked.find((m) => m.id === planId) || lead;
      const plan = playbookFor(planMech.id, inp);
      const leadPlan = playbookFor(lead.id, inp);
      const altPlan = alt ? playbookFor(alt.id, inp) : null;

      const planCard = h('section', { class: 'sp-card', style: 'margin-top:12px;' });

      // Plan Switcher if second likely candidate exists
      if (alt) {
        const seg = h('div', { class: 'sp-seg', role: 'tablist' },
          h('button', {
            type: 'button', class: planMech.id === lead.id ? 'on' : '',
            onclick: () => { s.planId = lead.id; drawResults(); },
          }, tr('stuckpipe.res_plan_for', { name: tr(lead.nameKey, {}, lead.name).split(':')[0] })),
          h('button', {
            type: 'button', class: planMech.id === alt.id ? 'on' : '',
            onclick: () => { s.planId = alt.id; drawResults(); },
          }, tr('stuckpipe.res_if_instead', { name: tr(alt.nameKey, {}, alt.name).split(':')[0] }))
        );
        planCard.append(seg);

        // Combined avoid warning
        const combinedAvoidKeys = [...new Set([...leadPlan.avoid.map((a) => a.key), ...altPlan.avoid.map((a) => a.key)])];
        resultsContainer.append(
          h('div', { class: 'sp-callout danger', style: 'margin-top:12px;' },
            h('strong', null, tr('stuckpipe.res_avoid_both')),
            h('ul', null, combinedAvoidKeys.map((k) => h('li', null, tr(k))))
          )
        );
      }

      planCard.append(h('h2', null, tr('stuckpipe.res_action_plan', { name: tr(planMech.nameKey, {}, planMech.name) })));

      // Jar direction indicator
      const dirMeta = DIR_LABEL[plan.jar.dir] || DIR_LABEL.unknown;
      const jarBox = h('div', { class: 'sp-jar', style: 'margin-top:8px;' },
        h('div', { class: 'sp-jar-dir' },
          h('div', null, h('b', null, dirMeta[0]), tr(dirMeta[1]))
        ),
        h('p', { style: 'margin:0; font-size:14px; line-height:1.45;' }, tr(plan.jar.key, {}, plan.jar.text))
      );

      planCard.append(
        h('details', { open: true },
          h('summary', null, tr('stuckpipe.res_do_now')),
          h('ol', null, plan.now.map((item) => h('li', null, tr(item.key, {}, item.text))))
        ),
        h('details', { open: true },
          h('summary', null, tr('stuckpipe.res_jar_direction')),
          jarBox
        ),
        h('details', { class: 'danger', open: true },
          h('summary', null, tr('stuckpipe.res_do_not')),
          h('ul', null, plan.avoid.map((item) => h('li', null, tr(item.key, {}, item.text))))
        ),
        h('details', null,
          h('summary', null, tr('stuckpipe.res_confirm')),
          h('ul', null, [
            ...plan.confirm.map((item) => h('li', null, tr(item.key, {}, item.text))),
            ...(planMech.id === lead.id && r.checks ? r.checks.map((c) => h('li', null, tr(c.key, {}, c.text))) : []),
          ])
        ),
        h('details', null,
          h('summary', null, tr('stuckpipe.res_escalate')),
          h('ul', null, plan.escalate.map((item) => h('li', null, tr(item.key, {}, item.text))))
        ),
        h('details', null,
          h('summary', null, tr('stuckpipe.res_prevent')),
          h('ul', null, plan.prevent.map((item) => h('li', null, tr(item.key, {}, item.text))))
        )
      );

      // Action buttons: Jump to calculator & Add to log
      const actions = h('div', { class: 'sp-row', style: 'margin-top:14px;' },
        h('button', {
          type: 'button', class: 'sp-btn small',
          onclick: () => {
            s.tab = 'calculate';
            s.calcTab = planMech.id === 'diff' ? 'diff' : 'free';
            redraw();
            window.scrollTo && window.scrollTo(0, 0);
          },
        }, planMech.id === 'diff' ? tr('stuckpipe.calc.btn_estimate_force') : tr('stuckpipe.calc.btn_find_freepoint')),
        h('button', {
          type: 'button', class: 'sp-btn ghost small',
          onclick: () => {
            s.log.unshift({
              time: new Date().toLocaleTimeString(),
              note: `Diagnosis: ${leadName} ${pct(lead.prob)} (${confLevel})`,
            });
            store.set(key + '.log', s.log);
            showToast(tr('stuckpipe.toast_added_log'));
          },
        }, tr('stuckpipe.log_btn_add'))
      );
      planCard.append(actions);

      resultsContainer.append(planCard);
    }

    panel.append(first5, formCard, resultsContainer);
    drawForm();
    drawResults();
  }

  // ---------------------------------------------------------------- Calculate Section
  function renderCalculate() {
    const c = s.calc;
    const card = h('section', { class: 'sp-card' });

    // Subtabs: Differential, Free Point, Spot Pill
    const subtabs = h('div', { class: 'sp-subtabs', role: 'tablist' },
      h('button', {
        type: 'button', class: 'sp-subtab' + (s.calcTab === 'diff' ? ' on' : ''),
        onclick: () => { s.calcTab = 'diff'; renderCalculate(); },
      }, tr('stuckpipe.calc.subtab_diff')),
      h('button', {
        type: 'button', class: 'sp-subtab' + (s.calcTab === 'free' ? ' on' : ''),
        onclick: () => { s.calcTab = 'free'; renderCalculate(); },
      }, tr('stuckpipe.calc.subtab_free')),
      h('button', {
        type: 'button', class: 'sp-subtab' + (s.calcTab === 'spot' ? ' on' : ''),
        onclick: () => { s.calcTab = 'spot'; renderCalculate(); },
      }, tr('stuckpipe.calc.subtab_spot'))
    );
    card.append(subtabs);

    // Number field helper
    function numField(labelKey, q, k, onUpdate, opts = {}) {
      const disp = q ? toDisplay(q, c[k], s.sys) : c[k];
      const input = h('input', {
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        value: plain(disp),
        'aria-label': tr(labelKey),
      });
      input.addEventListener('input', () => {
        const v = parseNum(input.value);
        c[k] = Number.isFinite(v) ? (q ? toField(q, v, s.sys) : v) : NaN;
        onUpdate();
      });
      const unit = opts.unit || (q ? unitLabel(q, s.sys) : '');
      return h('div', { class: 'sp-field' },
        h('label', null, tr(labelKey)),
        h('div', { class: 'sp-inwrap' }, input, unit ? h('span', null, unit) : null)
      );
    }

    const resRow = (labelKey, valText, cls = '') =>
      h('div', { class: 'sp-res ' + cls }, h('span', null, tr(labelKey)), h('b', null, valText));

    // Subtab 1: Differential Sticking Calculator
    if (s.calcTab === 'diff') {
      const outWrap = h('div', { class: 'sp-out' });

      function updateDiff() {
        outWrap.replaceChildren();
        const ppPsi = calc.hydrostatic(c.ppEmw, c.tvd);
        const f = calc.diffForce({
          mwPpg: c.mw, ppPsi, tvdFt: c.tvd, mu: c.mu,
          cakeIn: c.cake, odIn: c.od, contactFt: c.contact,
        });
        const so = calc.safeOverpull({
          yieldLbf: c.yield, designFactor: c.df, freeWeightLbf: c.freeW,
        });

        if (f.error || so.error) {
          outWrap.append(h('p', { class: 'sp-muted' }, '-'));
          return;
        }

        const ass = calc.assessRelease(f.forceLbf, so.overpullLbf);
        const req = calc.requiredDpReduction({
          dp: f.dp, forceLbf: f.forceLbf, overpullLbf: so.overpullLbf, targetFraction: 0.7,
        });
        const pillRed = calc.hydReduction({
          mwPpg: c.mw, pillMwPpg: c.pillMw, pillTvdFt: c.pillTvd,
        });

        outWrap.append(
          resRow('stuckpipe.calc.overbalance', fmt(toDisplay('pressure', f.dp, s.sys)) + ' ' + unitLabel('pressure', s.sys)),
          resRow('stuckpipe.calc.contact_area', fmt(f.areaIn2) + ' in² (' + fmt(f.widthIn, 2) + ' in width)'),
          resRow('stuckpipe.calc.sticking_force', fmt(toDisplay('force', f.forceLbf, s.sys)) + ' ' + unitLabel('force', s.sys), 'big'),
          resRow('stuckpipe.calc.max_hookload', fmt(toDisplay('force', so.maxHookloadLbf, s.sys)) + ' ' + unitLabel('force', s.sys)),
          resRow('stuckpipe.calc.safe_overpull', fmt(toDisplay('force', so.overpullLbf, s.sys)) + ' ' + unitLabel('force', s.sys), 'big ' + (so.overpullLbf > 0 ? 'ok' : 'bad')),
          resRow('stuckpipe.calc.verdict', tr(ass.key, {}, ass.message), ass.level)
        );

        if (req && !req.error && req.reductionPsi > 0) {
          outWrap.append(
            resRow('stuckpipe.calc.reduction_needed', fmt(toDisplay('pressure', req.reductionPsi, s.sys)) + ' ' + unitLabel('pressure', s.sys))
          );
        }

        if (pillRed && !pillRed.error) {
          const remOb = f.dp - pillRed.reductionPsi;
          outWrap.append(
            resRow('stuckpipe.calc.pill_reduction', fmt(toDisplay('pressure', pillRed.reductionPsi, s.sys)) + ' ' + unitLabel('pressure', s.sys)),
            resRow('stuckpipe.calc.remaining_ob', fmt(toDisplay('pressure', remOb, s.sys)) + ' ' + unitLabel('pressure', s.sys), remOb < 0 ? 'bad' : '')
          );
        }
      }

      // Preset buttons for friction coefficient
      const presets = h('div', { style: 'margin-bottom:12px;' },
        h('div', { class: 'sp-eyebrow' }, tr('stuckpipe.calc.presets_label')),
        h('div', { class: 'sp-row' },
          h('button', {
            type: 'button', class: 'sp-btn ghost small',
            onclick: () => { c.mu = 0.08; renderCalculate(); },
          }, tr('stuckpipe.calc.preset_obm')),
          h('button', {
            type: 'button', class: 'sp-btn ghost small',
            onclick: () => { c.mu = 0.15; renderCalculate(); },
          }, tr('stuckpipe.calc.preset_wbm')),
          h('button', {
            type: 'button', class: 'sp-btn ghost small',
            onclick: () => { c.mu = 0.25; renderCalculate(); },
          }, tr('stuckpipe.calc.preset_wbm_thick'))
        )
      );

      const fields = h('div', { class: 'sp-grid2' },
        numField('stuckpipe.calc.mw', 'density', 'mw', updateDiff),
        numField('stuckpipe.calc.pp_emw', 'density', 'ppEmw', updateDiff),
        numField('stuckpipe.calc.tvd', 'depth', 'tvd', updateDiff),
        numField('stuckpipe.calc.contact_length', 'depth', 'contact', updateDiff),
        numField('stuckpipe.calc.od', 'dia', 'od', updateDiff),
        numField('stuckpipe.calc.cake', 'dia', 'cake', updateDiff),
        numField('stuckpipe.calc.friction', null, 'mu', updateDiff),
        numField('stuckpipe.calc.tensile_yield', 'force', 'yield', updateDiff),
        numField('stuckpipe.calc.design_factor', null, 'df', updateDiff),
        numField('stuckpipe.calc.free_weight', 'force', 'freeW', updateDiff),
        numField('stuckpipe.calc.pill_mw', 'density', 'pillMw', updateDiff),
        numField('stuckpipe.calc.pill_tvd', 'depth', 'pillTvd', updateDiff)
      );

      card.append(presets, fields, outWrap);
      updateDiff();
    }

    // Subtab 2: Free Point Calculator
    else if (s.calcTab === 'free') {
      const outWrap = h('div', { class: 'sp-out' });

      function updateFree() {
        outWrap.replaceChildren();
        const res = calc.freePointComposite({
          stretchIn: c.stretch,
          pullLbf: c.pull,
          sections: c.sections,
        });

        if (res.error) {
          outWrap.append(h('p', { class: 'sp-muted' }, '-'));
          return;
        }

        const totalLen = c.sections.reduce((a, b) => a + b.lengthFt, 0);
        const pctFree = totalLen > 0 ? (res.freePointFt / totalLen) * 100 : 0;

        outWrap.append(
          resRow('stuckpipe.calc.free_point', fmt(toDisplay('depth', res.freePointFt, s.sys), 1) + ' ' + unitLabel('depth', s.sys), 'big ok'),
          resRow('stuckpipe.calc.section', tr('stuckpipe.calc.section_title', { num: res.sectionIndex + 1 })),
          resRow('stuckpipe.calc.pct_free', fmt(pctFree, 1) + '%')
        );

        if (res.beyondString) {
          outWrap.append(h('div', { class: 'sp-callout warn', style: 'margin-top:8px;' }, tr('stuckpipe.calc.beyond_string')));
        }
        outWrap.append(h('p', { class: 'sp-muted', style: 'margin-top:8px;' }, tr('stuckpipe.calc.deviated_note')));
      }

      const mainInputs = h('div', { class: 'sp-grid2' },
        numField('stuckpipe.calc.stretch', 'dia', 'stretch', updateFree),
        numField('stuckpipe.calc.pull_diff', 'force', 'pull', updateFree)
      );

      // Multi-section manager (up to 5 sections)
      const secContainer = h('div', { style: 'margin-top:14px;' });
      function renderSections() {
        secContainer.replaceChildren(
          h('div', { class: 'sp-eyebrow' }, 'String Sections (' + c.sections.length + ' / 5)')
        );
        c.sections.forEach((sec, idx) => {
          const row = h('div', { class: 'sp-sec-row' },
            h('div', { class: 'sp-field' },
              h('label', null, tr('stuckpipe.calc.section_len')),
              h('div', { class: 'sp-inwrap' },
                h('input', {
                  type: 'text', inputmode: 'decimal', value: plain(toDisplay('depth', sec.lengthFt, s.sys)),
                  oninput: (e) => {
                    const v = parseNum(e.target.value);
                    sec.lengthFt = Number.isFinite(v) ? toField('depth', v, s.sys) : NaN;
                    updateFree();
                  },
                }),
                h('span', null, unitLabel('depth', s.sys))
              )
            ),
            h('div', { class: 'sp-field' },
              h('label', null, tr('stuckpipe.calc.section_weight')),
              h('div', { class: 'sp-inwrap' },
                h('input', {
                  type: 'text', inputmode: 'decimal', value: plain(toDisplay('wpl', sec.weightLbft, s.sys)),
                  oninput: (e) => {
                    const v = parseNum(e.target.value);
                    sec.weightLbft = Number.isFinite(v) ? toField('wpl', v, s.sys) : NaN;
                    updateFree();
                  },
                }),
                h('span', null, unitLabel('wpl', s.sys))
              )
            ),
            c.sections.length > 1 ? h('button', {
              type: 'button', class: 'sp-btn ghost small', style: 'margin-bottom:10px;',
              onclick: () => {
                c.sections.splice(idx, 1);
                renderSections();
                updateFree();
              },
            }, tr('stuckpipe.calc.remove_section')) : null
          );
          secContainer.append(row);
        });

        if (c.sections.length < 5) {
          secContainer.append(
            h('button', {
              type: 'button', class: 'sp-btn ghost small', style: 'margin-top:4px;',
              onclick: () => {
                c.sections.push({ lengthFt: 1000, weightLbft: 19.5 });
                renderSections();
                updateFree();
              },
            }, tr('stuckpipe.calc.add_section'))
          );
        }
      }

      card.append(mainInputs, secContainer, outWrap);
      renderSections();
      updateFree();
    }

    // Subtab 3: Spot Pill Calculator
    else if (s.calcTab === 'spot') {
      const outWrap = h('div', { class: 'sp-out' });

      function updateSpot() {
        outWrap.replaceChildren();
        const res = calc.spotVolume({
          holeIn: c.hole, pipeIn: c.pipe,
          intervalFt: c.interval, marginFt: c.margin,
          excessPct: c.excess, leaveInStringBbl: c.leave,
        });

        if (res.error) {
          outWrap.append(h('p', { class: 'sp-muted' }, '-'));
          return;
        }

        outWrap.append(
          resRow('stuckpipe.calc.annular_cap', fmt(res.capacityBblFt, 4) + ' bbl/ft'),
          resRow('stuckpipe.calc.annular_vol', fmt(toDisplay('vol', res.annularBbl, s.sys), 1) + ' ' + unitLabel('vol', s.sys)),
          resRow('stuckpipe.calc.total_pill', fmt(toDisplay('vol', res.totalBbl, s.sys), 1) + ' ' + unitLabel('vol', s.sys), 'big ok')
        );
      }

      const fields = h('div', { class: 'sp-grid2' },
        numField('stuckpipe.calc.hole_size', 'dia', 'hole', updateSpot),
        numField('stuckpipe.calc.pipe_od', 'dia', 'pipe', updateSpot),
        numField('stuckpipe.calc.interval', 'depth', 'interval', updateSpot),
        numField('stuckpipe.calc.margin', 'depth', 'margin', updateSpot),
        numField('stuckpipe.calc.excess', null, 'excess', updateSpot, { unit: '%' }),
        numField('stuckpipe.calc.leave_string', 'vol', 'leave', updateSpot)
      );

      card.append(fields, outWrap);
      updateSpot();
    }

    panel.append(card);
  }

  // ---------------------------------------------------------------- Log Section (behind showLog)
  function renderLog() {
    const card = h('section', { class: 'sp-card' });
    card.append(h('h2', null, tr('stuckpipe.tab_log')));

    if (!s.log.length) {
      card.append(h('p', { class: 'sp-muted' }, tr('stuckpipe.log_empty')));
    } else {
      const list = h('div', { style: 'margin:12px 0;' },
        s.log.map((item, idx) =>
          h('div', { class: 'sp-log-item' },
            h('div', { class: 'sp-log-meta' }, h('span', null, item.time)),
            h('div', null, item.note)
          )
        )
      );
      const row = h('div', { class: 'sp-row' },
        h('button', {
          type: 'button', class: 'sp-btn ghost small',
          onclick: () => { s.log = []; store.set(key + '.log', []); redraw(); },
        }, tr('stuckpipe.log_clear')),
        h('button', {
          type: 'button', class: 'sp-btn small',
          onclick: () => {
            const rpt = buildReport({ input: s.input, result: diagnose(s.input), log: s.log, system: s.sys });
            navigator.clipboard && navigator.clipboard.writeText(rpt);
            showToast('Report copied to clipboard');
          },
        }, tr('stuckpipe.log_export'))
      );
      card.append(list, row);
    }
    panel.append(card);
  }

  // Initial draw
  redraw();

  // Listen for language changes to update UI instantly without reload
  const langHandler = () => {
    redraw();
  };
  window.addEventListener('languageChanged', langHandler);

  return {
    destroy() {
      window.removeEventListener('languageChanged', langHandler);
      root.replaceChildren();
    },
    getState: () => ({ ...s }),
  };
}

if (typeof window !== 'undefined') {
  window.mountStuckPipe = mountStuckPipe;
}

