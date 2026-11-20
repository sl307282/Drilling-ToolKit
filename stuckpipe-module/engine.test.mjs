import assert from 'node:assert/strict';
import { diagnose, calc, toDisplay, toField, playbookFor, DEFAULT_INPUT } from './engine.js';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok  ', name); };
const top = (inp) => diagnose({ ...DEFAULT_INPUT(), ...inp }).ranked[0];
const pct = (r) => Math.round(r.prob * 100) + '%';

// ---------- classification scenarios
const cases = [
  ['differential (classic)', 'diff', { operation: 'static', lastMove: 'none', circulation: 'full', rotation: 'locked', movement: 'neither', zone: 'permeable', overbalance: 'high', staticTime: 'long', flags: ['thick_cake'] }],
  ['differential (sliding, OBM-less)', 'diff', { operation: 'sliding', circulation: 'full', movement: 'neither', zone: 'permeable', overbalance: 'high', angle: 'mid' }],
  ['cuttings pack-off (tripping out, 45 deg)', 'pack_cut', { operation: 'tripping_out', lastMove: 'up', circulation: 'restricted', onset: 'gradual', angle: 'mid', flags: ['poor_cleaning', 'torque_trend', 'drag_trend'] }],
  ['cuttings pack-off (screenshot case: static/restricted/locked)', 'pack_cut', { operation: 'static', circulation: 'restricted', rotation: 'locked' }],
  ['shale pack-off', 'pack_shale', { operation: 'drilling', circulation: 'restricted', zone: 'shale_brittle', flags: ['cavings', 'torque_trend'] }],
  ['fractured pack-off', 'pack_frac', { operation: 'drilling', circulation: 'none', onset: 'sudden', zone: 'fractured', flags: ['losses'] }],
  ['key seat', 'key', { operation: 'tripping_out', lastMove: 'up', circulation: 'full', rotation: 'free', movement: 'down_only', flags: ['dogleg'] }],
  ['ledge', 'ledge', { operation: 'tripping_in', lastMove: 'down', circulation: 'full', rotation: 'free', movement: 'up_only', flags: ['bha_change', 'interbedded'] }],
  ['undergauge', 'under', { operation: 'tripping_in', lastMove: 'down', circulation: 'full', movement: 'up_only', zone: 'hard_abrasive', flags: ['bit_undergauge'] }],
  ['salt creep', 'mobile', { operation: 'static', circulation: 'restricted', zone: 'salt', movement: 'neither', flags: ['torque_trend'] }],
  ['junk', 'foreign', { operation: 'tripping_in', lastMove: 'down', onset: 'sudden', flags: ['junk'] }],
];
for (const [name, want, inp] of cases) {
  t('classify: ' + name, () => {
    const r = diagnose({ ...DEFAULT_INPUT(), ...inp });
    console.log('      ->', r.ranked.slice(0, 3).map((x) => x.id + ' ' + pct(x)).join(', '), '| conf', r.confidence.level);
    assert.equal(r.ranked[0].id, want);
  });
}

t('classic differential is high confidence', () => {
  const r = diagnose({ ...DEFAULT_INPUT(), ...cases[0][2] });
  assert.equal(r.confidence.level, 'high');
});
t('probabilities sum to 1', () => {
  const r = diagnose(DEFAULT_INPUT());
  assert.ok(Math.abs(r.ranked.reduce((a, b) => a + b.prob, 0) - 1) < 1e-9);
});
t('empty input -> insufficient, low confidence', () => {
  const r = diagnose(DEFAULT_INPUT());
  assert.equal(r.status, 'insufficient');
  assert.equal(r.confidence.level, 'low');
});
t('movement both ways -> tight_hole status', () => {
  assert.equal(diagnose({ ...DEFAULT_INPUT(), operation: 'tripping_out', movement: 'both' }).status, 'tight_hole');
});
t('does not mutate input / handles missing flags', () => {
  const inp = { operation: 'static' };
  diagnose(inp);
  assert.deepEqual(inp, { operation: 'static' });
});

// ---------- playbook jar direction
t('jar direction: ledge, stuck going down -> up', () => {
  assert.equal(playbookFor('ledge', { lastMove: 'down' }).jar.dir, 'up');
});
t('jar direction: ledge, stuck pulling up -> down', () => {
  assert.equal(playbookFor('ledge', { lastMove: 'up' }).jar.dir, 'down');
});
t('jar direction: ledge, unknown last move -> asks to confirm', () => {
  const j = playbookFor('ledge', {}).jar;
  assert.equal(j.dir, 'unknown');
  assert.match(j.text, /confirm/);
});
t('jar direction: pack-off is always down', () => {
  for (const id of ['pack_cut', 'pack_shale', 'pack_frac', 'key', 'diff']) assert.equal(playbookFor(id, { lastMove: 'down' }).jar.dir, 'down');
});

// ---------- calculators
t('free point: 24 in stretch, 30,000 lbf, 19.5 lb/ft ~ 11,471 ft', () => {
  const r = calc.freePoint({ stretchIn: 24, pullLbf: 30000, weightLbft: 19.5 });
  assert.ok(Math.abs(r.freePointFt - 11470.6) < 1);
});
t('composite free point equals single section when one section is long enough', () => {
  const a = calc.freePoint({ stretchIn: 24, pullLbf: 30000, weightLbft: 19.5 }).freePointFt;
  const b = calc.freePointComposite({ stretchIn: 24, pullLbf: 30000, sections: [{ lengthFt: 20000, weightLbft: 19.5 }] });
  assert.ok(Math.abs(a - b.freePointFt) < 1e-6);
  assert.equal(b.beyondString, false);
});
t('composite free point across DP + HWDP', () => {
  // 10,000 ft of 19.5 lb/ft fully free at 30,000 lbf: stretch = 30000*10000/(735294*19.5) = 20.92 in
  const full = (30000 * 10000) / (735294 * 19.5);
  const r = calc.freePointComposite({ stretchIn: full + 0.5, pullLbf: 30000, sections: [{ lengthFt: 10000, weightLbft: 19.5 }, { lengthFt: 900, weightLbft: 49 }] });
  const expectedInHwdp = (0.5 * 735294 * 49) / 30000;
  assert.ok(Math.abs(r.freePointFt - (10000 + expectedInHwdp)) < 1e-6);
  assert.equal(r.sectionIndex, 1);
});
t('composite free point beyond string -> flagged', () => {
  const r = calc.freePointComposite({ stretchIn: 500, pullLbf: 30000, sections: [{ lengthFt: 5000, weightLbft: 19.5 }] });
  assert.equal(r.beyondString, true);
});
t('differential force: worked example ~ 250 klbf', () => {
  const r = calc.diffForce({ mwPpg: 11.5, ppPsi: 0.052 * 9.0 * 10000, tvdFt: 10000, mu: 0.15, cakeIn: 0.125, odIn: 6.5, contactFt: 60 });
  assert.ok(Math.abs(r.dp - 1300) < 1e-6);
  assert.ok(r.forceLbf > 240000 && r.forceLbf < 265000, String(r.forceLbf));
});
t('differential force is zero at negative overbalance', () => {
  const r = calc.diffForce({ mwPpg: 8, ppPsi: 5000, tvdFt: 10000, mu: 0.15, cakeIn: 0.125, odIn: 6.5, contactFt: 60 });
  assert.equal(r.forceLbf, 0);
});
t('invalid inputs return an error object', () => {
  assert.equal(calc.diffForce({ mwPpg: NaN, ppPsi: 0, tvdFt: 1, mu: 1, cakeIn: 0, odIn: 1, contactFt: 1 }).error, 'invalid');
  assert.equal(calc.freePoint({ stretchIn: 0, pullLbf: 1, weightLbft: 1 }).error, 'invalid');
  assert.equal(calc.spotVolume({ holeIn: 8.5, pipeIn: 9, intervalFt: 100, marginFt: 0, excessPct: 0, leaveInStringBbl: 0 }).error, 'invalid');
});
t('safe overpull', () => {
  const r = calc.safeOverpull({ yieldLbf: 560000, designFactor: 0.9, freeWeightLbf: 250000 });
  assert.equal(r.maxHookloadLbf, 504000);
  assert.equal(r.overpullLbf, 254000);
});
t('release assessment bands', () => {
  assert.equal(calc.assessRelease(100000, 200000).level, 'ok');
  assert.equal(calc.assessRelease(100000, 120000).level, 'warn');
  assert.equal(calc.assessRelease(100000, 60000).level, 'bad');
  assert.equal(calc.assessRelease(100000, -5).level, 'bad');
});
t('required dP reduction scales linearly with force', () => {
  const r = calc.requiredDpReduction({ dp: 1300, forceLbf: 250000, overpullLbf: 175000, targetFraction: 0.7 });
  // target force = 122,500 -> dpTarget = 1300 * 0.49 = 637
  assert.ok(Math.abs(r.dpTarget - 637) < 1e-6);
});
t('hydrostatic reduction from a light pill', () => {
  assert.ok(Math.abs(calc.hydReduction({ mwPpg: 11.5, pillMwPpg: 7.0, pillTvdFt: 1000 }).reductionPsi - 234) < 1e-6);
});
t('spot volume: 8.5 in hole, 5 in pipe, 200 ft + 100 ft margin, 20% excess', () => {
  const r = calc.spotVolume({ holeIn: 8.5, pipeIn: 5, intervalFt: 200, marginFt: 100, excessPct: 20, leaveInStringBbl: 10 });
  const cap = (8.5 * 8.5 - 25) / 1029.4;
  assert.ok(Math.abs(r.annularBbl - cap * 300 * 1.2) < 1e-9);
  assert.ok(Math.abs(r.totalBbl - (cap * 300 * 1.2 + 10)) < 1e-9);
});
t('unit conversions round-trip and known values', () => {
  for (const q of ['density', 'depth', 'pressure', 'force', 'dia', 'wpl', 'vol']) {
    assert.ok(Math.abs(toField(q, toDisplay(q, 123.4, 'metric'), 'metric') - 123.4) < 1e-9);
  }
  assert.ok(Math.abs(toDisplay('density', 10, 'metric') - 1198.26) < 0.01);
  assert.ok(Math.abs(toDisplay('depth', 10000, 'metric') - 3048) < 1e-9);
  assert.ok(Math.abs(toDisplay('pressure', 1000, 'metric') - 68.9476) < 1e-6);
});

console.log('\n' + pass + ' checks passed');
