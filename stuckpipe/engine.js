// Stuck Pipe Assistant - engine (pure logic, no DOM). ES module.
// Decision support only. Follow operator procedures, well-control policy and equipment limits.

// ---------------------------------------------------------------- mechanisms
export const MECH = {
  diff:       { id: 'diff',       nameKey: 'mech.diff.name',       familyKey: 'mech.diff.family',       summaryKey: 'mech.diff.summary',       name: 'Differential sticking',                    family: 'Differential',                 summary: 'The string is pressed into the filter cake against a permeable zone by the difference between mud hydrostatic and formation pressure.' },
  pack_cut:   { id: 'pack_cut',   nameKey: 'mech.pack_cut.name',   familyKey: 'mech.pack_cut.family',   summaryKey: 'mech.pack_cut.summary',   name: 'Pack-off: cuttings / poor hole cleaning',  family: 'Mechanical: pack-off / bridge', summary: 'Settled cuttings or a cuttings avalanche have packed the annulus around the BHA or pipe.' },
  pack_shale: { id: 'pack_shale', nameKey: 'mech.pack_shale.name', familyKey: 'mech.pack_shale.family', summaryKey: 'mech.pack_shale.summary', name: 'Pack-off: unstable shale (cavings)',        family: 'Mechanical: pack-off / bridge', summary: 'Reactive or brittle shale has sloughed or collapsed into the hole and packed off around the string.' },
  pack_frac:  { id: 'pack_frac',  nameKey: 'mech.pack_frac.name',  familyKey: 'mech.pack_frac.family',  summaryKey: 'mech.pack_frac.summary',  name: 'Pack-off: fractured / unconsolidated rock', family: 'Mechanical: pack-off / bridge', summary: 'Blocks or loose grains from a fractured, faulted or unconsolidated formation have fallen in and bridged the hole.' },
  key:        { id: 'key',        nameKey: 'mech.key.name',        familyKey: 'mech.key.family',        summaryKey: 'mech.key.summary',        name: 'Key seat',                                 family: 'Wellbore geometry',             summary: 'Tool joints or the BHA have worn a slot into the wall at a dogleg and the larger BHA is wedged in it while pulling.' },
  ledge:      { id: 'ledge',      nameKey: 'mech.ledge.name',      familyKey: 'mech.ledge.family',      summaryKey: 'mech.ledge.summary',      name: 'Ledge / micro-dogleg / stiff BHA',         family: 'Wellbore geometry',             summary: 'The BHA has hung on a ledge or abrupt hole-angle change, typically at a hard/soft boundary or after a BHA change.' },
  under:      { id: 'under',      nameKey: 'mech.under.name',      familyKey: 'mech.under.family',      summaryKey: 'mech.under.summary',      name: 'Undergauge hole',                          family: 'Wellbore geometry',             summary: 'Hole is smaller than the bit or stabilisers, usually after an abrasive section wore the previous bit or from swelling.' },
  mobile:     { id: 'mobile',     nameKey: 'mech.mobile.name',     familyKey: 'mech.mobile.family',     summaryKey: 'mech.mobile.summary',     name: 'Mobile formation (salt / plastic shale)',  family: 'Wellbore geometry',             summary: 'Salt or plastic shale is creeping into the hole and squeezing the string.' },
  foreign:    { id: 'foreign',    nameKey: 'mech.foreign.name',    familyKey: 'mech.foreign.family',    summaryKey: 'mech.foreign.summary',    name: 'Junk, cement or casing damage',            family: 'Mechanical: foreign object',    summary: 'Junk, cement blocks or green cement, or damaged/collapsed casing is locking the string.' },
};

export const KEY_FIELDS = ['operation', 'lastMove', 'circulation', 'rotation', 'movement', 'angle'];

const PRIOR = { diff: 0.3, pack_cut: 0.5, pack_shale: 0.2, pack_frac: -0.3, key: 0, ledge: 0, under: -0.3, mobile: -0.5, foreign: -1.0 };
const TEMPERATURE = 1.6;

// ---------------------------------------------------------------- evidence rules
// [mechanism, test(input), weight, key, fallbackReason]
const is = (f, ...v) => (s) => v.includes(s[f]);
const flag = (n) => (s) => s.flags.has(n);
const zoneKnownNot = (...v) => (s) => s.zone !== 'unknown' && !v.includes(s.zone);
const all = (...t) => (s) => t.every((f) => f(s));

const RULES = [
  // ---- differential
  ['diff', is('circulation', 'full'), 2.0, 'reason.diff.circulation_full', 'Circulation is unrestricted, as expected when pipe is held by the wall rather than packed off'],
  ['diff', is('circulation', 'restricted'), -1.5, 'reason.diff.circulation_restricted', 'Restricted circulation points away from pure differential sticking'],
  ['diff', is('circulation', 'none'), -3.0, 'reason.diff.circulation_none', 'No circulation points away from differential sticking'],
  ['diff', is('operation', 'static'), 2.5, 'reason.diff.operation_static', 'Pipe was stationary; differential sticking needs time against the cake'],
  ['diff', is('operation', 'sliding'), 1.2, 'reason.diff.operation_sliding', 'Sliding without rotation leaves the BHA lying on the low side against the cake'],
  ['diff', is('operation', 'drilling'), -1.0, 'reason.diff.operation_drilling', 'Rotating pipe rarely sticks differentially'],
  ['diff', is('lastMove', 'none'), 1.0, 'reason.diff.lastMove_none', 'No pipe movement before sticking'],
  ['diff', is('lastMove', 'rotating'), -0.5, 'reason.diff.lastMove_rotating', 'Pipe was rotating when it stuck'],
  ['diff', is('zone', 'permeable'), 2.5, 'reason.diff.zone_permeable', 'Pipe is across a permeable / depleted zone where filter cake builds'],
  ['diff', zoneKnownNot('permeable'), -1.5, 'reason.diff.not_zone_permeable', 'Stuck point is not across a permeable zone'],
  ['diff', is('overbalance', 'high'), 2.0, 'reason.diff.overbalance_high', 'High overbalance gives a large sticking force'],
  ['diff', is('overbalance', 'moderate'), 0.8, 'reason.diff.overbalance_moderate', 'Moderate overbalance can support differential sticking'],
  ['diff', is('overbalance', 'low'), -1.5, 'reason.diff.overbalance_low', 'Low overbalance makes differential sticking unlikely'],
  ['diff', is('staticTime', 'long'), 1.5, 'reason.diff.staticTime_long', 'Long static time increases the sticking force'],
  ['diff', flag('thick_cake'), 1.2, 'reason.diff.flag_thick_cake', 'High fluid loss / thick filter cake'],
  ['diff', is('rotation', 'locked'), 0.8, 'reason.diff.rotation_locked', 'Pipe cannot be rotated'],
  ['diff', is('rotation', 'free'), -1.0, 'reason.diff.rotation_free', 'Rotation is still free'],
  ['diff', is('movement', 'neither'), 1.5, 'reason.diff.movement_neither', 'String cannot move up or down'],
  ['diff', is('movement', 'both'), -2.5, 'reason.diff.movement_both', 'String still moves both ways'],
  ['diff', is('angle', 'mid', 'high'), 0.5, 'reason.diff.angle_mid_high', 'Inclined hole puts the string on the low side against the cake'],
  ['diff', flag('cavings'), -1.0, 'reason.diff.flag_cavings', 'Cavings at shakers point to hole instability instead'],
  ['diff', flag('poor_cleaning'), -0.5, 'reason.diff.flag_poor_cleaning', 'Hole-cleaning problems point to a pack-off'],
  ['diff', is('mud', 'obm'), -0.4, 'reason.diff.mud_obm', 'Oil-based mud gives lower friction against the cake'],
  // ---- pack-off: cuttings
  ['pack_cut', is('circulation', 'restricted'), 2.5, 'reason.pack_cut.circulation_restricted', 'Circulation is restricted: annulus is partly packed'],
  ['pack_cut', is('circulation', 'none'), 3.0, 'reason.pack_cut.circulation_none', 'No circulation: annulus is blocked'],
  ['pack_cut', is('circulation', 'full'), -2.5, 'reason.pack_cut.circulation_full', 'Full circulation argues against a pack-off'],
  ['pack_cut', is('onset', 'gradual'), 0.8, 'reason.pack_cut.onset_gradual', 'Gradual pressure rise suggests cuttings accumulating'],
  ['pack_cut', is('onset', 'sudden'), 0.5, 'reason.pack_cut.onset_sudden', 'Sudden pressure rise can be a cuttings avalanche'],
  ['pack_cut', is('angle', 'mid'), 2.0, 'reason.pack_cut.angle_mid', '30-60 degree hole is where cuttings beds form and slide'],
  ['pack_cut', is('angle', 'high'), 1.2, 'reason.pack_cut.angle_high', 'High-angle hole accumulates cuttings'],
  ['pack_cut', is('angle', 'low'), -0.3, 'reason.pack_cut.angle_low', 'Low-angle hole is less prone to cuttings beds'],
  ['pack_cut', flag('poor_cleaning'), 2.5, 'reason.pack_cut.flag_poor_cleaning', 'Hole-cleaning problems (low flow, high ROP, fewer cuttings than expected)'],
  ['pack_cut', flag('torque_trend'), 1.0, 'reason.pack_cut.flag_torque_trend', 'Torque was building before sticking'],
  ['pack_cut', flag('drag_trend'), 1.0, 'reason.pack_cut.flag_drag_trend', 'Drag / overpull was building before sticking'],
  ['pack_cut', is('operation', 'tripping_out'), 1.2, 'reason.pack_cut.operation_tripping_out', 'Pulling into a cuttings bed is a classic trigger'],
  ['pack_cut', is('operation', 'static'), 0.8, 'reason.pack_cut.operation_static', 'Cuttings settle when pumps stop'],
  ['pack_cut', is('operation', 'sliding'), 0.8, 'reason.pack_cut.operation_sliding', 'Sliding does not agitate the cuttings bed'],
  ['pack_cut', is('operation', 'drilling'), 0.5, 'reason.pack_cut.operation_drilling', 'Pack-offs while drilling follow hole-cleaning loss'],
  ['pack_cut', is('lastMove', 'up'), 1.0, 'reason.pack_cut.lastMove_up', 'Pipe was moving up into the cuttings'],
  ['pack_cut', flag('cavings'), -0.5, 'reason.pack_cut.flag_cavings', 'Cavings suggest shale rather than cuttings'],
  // ---- pack-off: unstable shale
  ['pack_shale', is('circulation', 'restricted'), 2.0, 'reason.pack_shale.circulation_restricted', 'Circulation is restricted'],
  ['pack_shale', is('circulation', 'none'), 2.5, 'reason.pack_shale.circulation_none', 'No circulation'],
  ['pack_shale', is('circulation', 'full'), -2.0, 'reason.pack_shale.circulation_full', 'Full circulation argues against a pack-off'],
  ['pack_shale', is('zone', 'shale_reactive'), 2.2, 'reason.pack_shale.zone_shale_reactive', 'Across reactive shale'],
  ['pack_shale', is('zone', 'shale_brittle'), 2.6, 'reason.pack_shale.zone_shale_brittle', 'Across brittle / pressured shale'],
  ['pack_shale', zoneKnownNot('shale_reactive', 'shale_brittle'), -1.0, 'reason.pack_shale.not_zone_shale_reactive_shale_brittle', 'Not across shale'],
  ['pack_shale', flag('cavings'), 3.0, 'reason.pack_shale.flag_cavings', 'Cavings at the shakers'],
  ['pack_shale', flag('torque_trend'), 1.0, 'reason.pack_shale.flag_torque_trend', 'Torque was building'],
  ['pack_shale', flag('drag_trend'), 0.8, 'reason.pack_shale.flag_drag_trend', 'Drag was building'],
  ['pack_shale', flag('swab'), 0.6, 'reason.pack_shale.flag_swab', 'Swab / surge pressures can destabilise shale'],
  ['pack_shale', is('operation', 'static'), 0.5, 'reason.pack_shale.operation_static', 'Shale falls in with time'],
  ['pack_shale', is('operation', 'tripping_out'), 0.5, 'reason.pack_shale.operation_tripping_out', 'Tripping imposes pressure swings'],
  // ---- pack-off: fractured / unconsolidated
  ['pack_frac', is('circulation', 'restricted'), 1.8, 'reason.pack_frac.circulation_restricted', 'Circulation is restricted'],
  ['pack_frac', is('circulation', 'none'), 2.5, 'reason.pack_frac.circulation_none', 'No circulation'],
  ['pack_frac', is('circulation', 'full'), -2.0, 'reason.pack_frac.circulation_full', 'Full circulation argues against a pack-off'],
  ['pack_frac', is('onset', 'sudden'), 1.8, 'reason.pack_frac.onset_sudden', 'Sudden onset is typical of blocks falling from fractured rock'],
  ['pack_frac', is('zone', 'fractured'), 3.5, 'reason.pack_frac.zone_fractured', 'Across fractured / faulted / unconsolidated rock'],
  ['pack_frac', zoneKnownNot('fractured'), -0.8, 'reason.pack_frac.not_zone_fractured', 'Not across fractured rock'],
  ['pack_frac', flag('losses'), 1.5, 'reason.pack_frac.flag_losses', 'Mud losses indicate fractures or vugs'],
  // ---- key seat
  ['key', is('operation', 'tripping_out'), 3.0, 'reason.key.operation_tripping_out', 'Stuck while pulling out'],
  ['key', is('operation', 'tripping_in'), -1.0, 'reason.key.operation_tripping_in', 'Key seats stick the string when pulling, not running in'],
  ['key', is('operation', 'drilling'), -1.5, 'reason.key.operation_drilling', 'Not tripping'],
  ['key', is('operation', 'static'), -1.5, 'reason.key.operation_static', 'Not moving when stuck'],
  ['key', is('lastMove', 'up'), 2.5, 'reason.key.lastMove_up', 'Pipe was moving up'],
  ['key', is('lastMove', 'down'), -1.5, 'reason.key.lastMove_down', 'Pipe was moving down'],
  ['key', is('movement', 'down_only'), 3.0, 'reason.key.movement_down_only', 'String can still be lowered but not pulled: classic key seat'],
  ['key', is('movement', 'up_only'), -2.0, 'reason.key.movement_up_only', 'String can be pulled but not lowered'],
  ['key', is('movement', 'both'), -2.0, 'reason.key.movement_both', 'String still moves both ways'],
  ['key', is('circulation', 'full'), 1.5, 'reason.key.circulation_full', 'Circulation is normal'],
  ['key', is('circulation', 'restricted'), -1.0, 'reason.key.circulation_restricted', 'Restricted circulation points to a pack-off'],
  ['key', is('circulation', 'none'), -2.0, 'reason.key.circulation_none', 'No circulation'],
  ['key', is('rotation', 'free'), 0.5, 'reason.key.rotation_free', 'Rotation is still possible'],
  ['key', flag('dogleg'), 2.0, 'reason.key.flag_dogleg', 'Known dogleg / high dogleg severity'],
  ['key', is('zone', 'shoe_dogleg'), 2.0, 'reason.key.zone_shoe_dogleg', 'At a casing shoe or dogleg'],
  ['key', flag('prev_tight'), 1.5, 'reason.key.flag_prev_tight', 'Tight spot at this depth on a previous trip'],
  ['key', flag('drag_trend'), 0.8, 'reason.key.flag_drag_trend', 'Drag was increasing'],
  // ---- ledge
  ['ledge', is('operation', 'tripping_in'), 2.5, 'reason.ledge.operation_tripping_in', 'Stuck while running in'],
  ['ledge', is('operation', 'tripping_out'), 1.0, 'reason.ledge.operation_tripping_out', 'Ledges can also catch the BHA when pulling'],
  ['ledge', is('operation', 'static'), -1.5, 'reason.ledge.operation_static', 'Not moving when stuck'],
  ['ledge', is('operation', 'drilling'), -1.0, 'reason.ledge.operation_drilling', 'Not tripping'],
  ['ledge', is('lastMove', 'down'), 2.0, 'reason.ledge.lastMove_down', 'Pipe was moving down'],
  ['ledge', is('movement', 'up_only'), 2.5, 'reason.ledge.movement_up_only', 'String can be pulled but not lowered: BHA is sitting on a ledge'],
  ['ledge', is('movement', 'down_only'), 1.0, 'reason.ledge.movement_down_only', 'String can be lowered but not pulled'],
  ['ledge', is('movement', 'both'), -2.0, 'reason.ledge.movement_both', 'String still moves both ways'],
  ['ledge', is('circulation', 'full'), 1.5, 'reason.ledge.circulation_full', 'Circulation is normal'],
  ['ledge', is('circulation', 'restricted'), -1.0, 'reason.ledge.circulation_restricted', 'Restricted circulation points to a pack-off'],
  ['ledge', is('circulation', 'none'), -2.0, 'reason.ledge.circulation_none', 'No circulation'],
  ['ledge', flag('bha_change'), 2.0, 'reason.ledge.flag_bha_change', 'Recent change to a stiffer / larger-OD BHA'],
  ['ledge', flag('interbedded'), 1.5, 'reason.ledge.flag_interbedded', 'Interbedded hard and soft formations form ledges'],
  ['ledge', flag('dogleg'), 0.8, 'reason.ledge.flag_dogleg', 'Known dogleg'],
  ['ledge', flag('prev_tight'), 1.0, 'reason.ledge.flag_prev_tight', 'Tight spot at this depth on a previous trip'],
  ['ledge', is('rotation', 'free'), 0.5, 'reason.ledge.rotation_free', 'Rotation is still possible'],
  // ---- undergauge
  ['under', is('operation', 'tripping_in'), 2.5, 'reason.under.operation_tripping_in', 'Stuck while running in'],
  ['under', is('operation', 'static'), -1.5, 'reason.under.operation_static', 'Not moving when stuck'],
  ['under', is('lastMove', 'down'), 1.5, 'reason.under.lastMove_down', 'Pipe was moving down'],
  ['under', is('zone', 'hard_abrasive'), 3.0, 'reason.under.zone_hard_abrasive', 'Across hard / abrasive rock that wears the bit gauge'],
  ['under', is('zone', 'shale_reactive'), 0.8, 'reason.under.zone_shale_reactive', 'Reactive shale can swell the hole undergauge'],
  ['under', flag('bit_undergauge'), 3.0, 'reason.under.flag_bit_undergauge', 'Previous bit came out undergauge'],
  ['under', is('movement', 'up_only'), 1.5, 'reason.under.movement_up_only', 'String can be pulled but not lowered'],
  ['under', is('circulation', 'full'), 1.2, 'reason.under.circulation_full', 'Circulation is normal'],
  ['under', is('circulation', 'none'), -1.5, 'reason.under.circulation_none', 'No circulation'],
  // ---- mobile formation
  ['mobile', is('zone', 'salt'), 4.0, 'reason.mobile.zone_salt', 'Across salt or plastic shale'],
  ['mobile', zoneKnownNot('salt'), -1.5, 'reason.mobile.not_zone_salt', 'Not across salt / plastic shale'],
  ['mobile', is('operation', 'static'), 1.5, 'reason.mobile.operation_static', 'Creep closes the hole while the pipe is static'],
  ['mobile', is('operation', 'tripping_out', 'tripping_in'), 0.8, 'reason.mobile.operation_tripping_out_tripping_in', 'Creep is time-dependent and catches the string during trips'],
  ['mobile', is('circulation', 'restricted'), 0.8, 'reason.mobile.circulation_restricted', 'Annulus is squeezed'],
  ['mobile', flag('torque_trend'), 1.0, 'reason.mobile.flag_torque_trend', 'Torque was building'],
  ['mobile', flag('drag_trend'), 0.8, 'reason.mobile.flag_drag_trend', 'Drag was building'],
  ['mobile', is('movement', 'neither'), 0.8, 'reason.mobile.movement_neither', 'String cannot move either way'],
  // ---- foreign
  ['foreign', flag('junk'), 5.0, 'reason.foreign.flag_junk', 'Junk in hole reported'],
  ['foreign', flag('cement'), 3.5, 'reason.foreign.flag_cement', 'Cement job, green cement or cement blocks in the hole'],
  ['foreign', flag('casing'), 3.5, 'reason.foreign.flag_casing', 'Casing damage suspected'],
  ['foreign', is('onset', 'sudden'), 1.0, 'reason.foreign.onset_sudden', 'Sudden onset'],
  ['foreign', is('operation', 'tripping_in', 'tripping_out'), 0.8, 'reason.foreign.operation_tripping_in_tripping_out', 'Stuck while tripping'],
];
// ---------------------------------------------------------------- normalisation
export const DEFAULT_INPUT = () => ({
  operation: 'unknown', lastMove: 'unknown', circulation: 'unknown', onset: 'unknown', rotation: 'unknown',
  movement: 'unknown', angle: 'unknown', zone: 'unknown', overbalance: 'unknown', staticTime: 'unknown',
  mud: 'unknown', flags: [],
});

function normalise(input) {
  const s = { ...DEFAULT_INPUT(), ...input };
  s.flags = new Set(input && input.flags ? input.flags : []);
  if (s.flags.has('salt') && s.zone === 'unknown') s.zone = 'salt';
  if (s.flags.has('permeable_zone') && s.zone === 'unknown') s.zone = 'permeable';
  return s;
}

// ---------------------------------------------------------------- diagnosis
export function diagnose(input) {
  const s = normalise(input);
  const answered = KEY_FIELDS.filter((f) => s[f] !== 'unknown').length;
  const scores = {}, pros = {}, cons = {};
  for (const id of Object.keys(MECH)) { scores[id] = PRIOR[id]; pros[id] = []; cons[id] = []; }
  for (const [id, test, w, key, fallback] of RULES) {
    if (test(s)) {
      scores[id] += w;
      (w > 0 ? pros : cons)[id].push({ w, key, why: key, text: fallback });
    }
  }
  const ids = Object.keys(MECH);
  const exps = ids.map((id) => Math.exp(scores[id] / TEMPERATURE));
  const sum = exps.reduce((a, b) => a + b, 0);
  const ranked = ids.map((id, i) => ({
    id, name: MECH[id].name, family: MECH[id].family, summary: MECH[id].summary,
    nameKey: MECH[id].nameKey, familyKey: MECH[id].familyKey, summaryKey: MECH[id].summaryKey,
    score: scores[id], prob: exps[i] / sum,
    pros: pros[id].sort((a, b) => b.w - a.w).map((x) => ({ key: x.key, text: x.text, why: x.key, w: x.w })),
    cons: cons[id].sort((a, b) => a.w - b.w).map((x) => ({ key: x.key, text: x.text, why: x.key, w: x.w })),
  })).sort((a, b) => b.prob - a.prob);

  let status = 'stuck';
  if (s.movement === 'both') status = 'tight_hole';
  if (s.operation === 'unknown' && s.circulation === 'unknown') status = 'insufficient';

  const [t1, t2] = ranked;
  let level = 'low';
  if (answered >= 5 && t1.prob >= 0.7 && t1.prob - t2.prob >= 0.3) level = 'high';
  else if (answered >= 4 && t1.prob >= 0.5) level = 'medium';

  const confObj = confidenceInfo(level, answered);

  return {
    status, ranked, answered, total: KEY_FIELDS.length,
    confidence: { level, key: confObj.key, note: confObj.note },
    warnings: warningsFor(s, ranked),
    checks: nextChecks(s, ranked),
  };
}

function confidenceInfo(level, answered) {
  if (level === 'high') return { key: 'conf.high', note: 'Evidence points clearly to one mechanism. Still confirm with the checks below.' };
  if (level === 'medium') return { key: 'conf.medium', note: 'Likely, but another mechanism remains possible. Run the confirmation checks.' };
  return answered < 5
    ? { key: 'conf.low_insufficient', note: 'Limited information. Answer more questions or run the confirmation checks to sharpen this.' }
    : { key: 'conf.low_mixed', note: 'Evidence is mixed. Treat the top two mechanisms as live and use actions safe for both.' };
}

function warningsFor(s, ranked) {
  const w = [];
  if (s.circulation === 'none' && (s.flags.has('losses'))) {
    w.push({ key: 'warning.circulation_losses', text: 'Circulation lost with losses: monitor the well closely (flow check, pit levels). A pack-off can mask a kick or an underground flow.' });
  }
  if (s.circulation === 'none' || s.circulation === 'restricted') {
    w.push({ key: 'warning.packoff_pressure', text: 'Never pressure up against a pack-off. Bleed trapped pressure before working the pipe and keep SPP below the limit for the open hole (fracture / losses).' });
  }
  if (s.overbalance === 'high') {
    w.push({ key: 'warning.overbalance_high', text: 'High overbalance: check pore pressure and kick margin before any reduction in hydrostatic.' });
  }
  if (ranked[0].id === 'diff' || ranked[1].id === 'diff') {
    w.push({ key: 'warning.diff_time', text: 'Differential force grows with time. Act in the first minutes rather than waiting.' });
  }
  return w;
}

const PAIR_CHECKS = {
  'diff|pack_cut': { key: 'check.pair.diff_pack_cut', text: 'Try low-rate circulation within the pressure limit. Full returns at normal pressure favours differential; high pressure or no returns favours a pack-off.' },
  'diff|pack_shale': { key: 'check.pair.diff_pack_shale', text: 'Check shakers for cavings and test circulation at a low rate. Cavings and high pressure favour shale; clean returns at normal pressure favour differential.' },
  'pack_cut|pack_shale': { key: 'check.pair.pack_cut_pack_shale', text: 'Look at the shakers: angular, splintery cavings favour unstable shale; fine drilled cuttings with falling returns favour hole cleaning.' },
  'key|ledge': { key: 'check.pair.key_ledge', text: 'Which way can you move? Down only (cannot pull) is a key seat; up only (cannot lower) is a ledge.' },
  'ledge|under': { key: 'check.pair.ledge_under', text: 'Check the previous bit gauge and formation. Undergauge bit or abrasive section favours an undergauge hole; a BHA change or hard/soft boundary favours a ledge.' },
  'key|pack_cut': { key: 'check.pair.key_pack_cut', text: 'Test circulation: normal pressure favours a key seat; restricted favours a pack-off.' },
  'mobile|pack_cut': { key: 'check.pair.mobile_pack_cut', text: 'Check the formation at the stuck depth and the time since drilling it. Salt or plastic shale favours mobile formation.' },
  'diff|key': { key: 'check.pair.diff_key', text: 'Can the string be lowered? Moves down only = key seat. Cannot move either way across a permeable zone = differential.' },
  'diff|mobile': { key: 'check.pair.diff_mobile', text: 'Check formation at the stuck depth: salt or plastic shale = mobile formation; permeable sand with overbalance = differential.' },
};

function nextChecks(s, ranked) {
  const checks = [];
  const [a, b] = ranked;
  const k1 = [a.id, b.id].sort().join('|');
  if (PAIR_CHECKS[k1]) checks.push(PAIR_CHECKS[k1]);
  const prompt = {
    circulation: { key: 'check.prompt.circulation', text: 'Establish circulation at a very low rate and note the pressure and returns.' },
    movement: { key: 'check.prompt.movement', text: 'Test carefully which direction the string can move (within pull and slack-off limits).' },
    lastMove: { key: 'check.prompt.lastMove', text: 'Confirm from the driller which direction the string was moving at the moment it stuck.' },
    zone: { key: 'check.prompt.zone', text: 'Check BHA position against logs / mud log to identify the formation at the stuck point.' },
    overbalance: { key: 'check.prompt.overbalance', text: 'Calculate overbalance at the stuck depth from mud weight and formation pressure.' },
    rotation: { key: 'check.prompt.rotation', text: 'Check whether torque can be applied and held, and whether the string rotates.' },
    angle: { key: 'check.prompt.angle', text: 'Check survey inclination at the stuck depth.' },
    operation: { key: 'check.prompt.operation', text: 'Confirm the exact operation at the moment of sticking.' },
  };
  for (const f of KEY_FIELDS) {
    if (s[f] === 'unknown' && checks.length < 4 && prompt[f]) checks.push(prompt[f]);
  }
  return checks;
}

// ---------------------------------------------------------------- playbooks
export const UNIVERSAL_FIRST = [
  { key: 'playbook.first.1', text: 'Stop pulling or slacking off against resistance. Do not force the string.' },
  { key: 'playbook.first.2', text: 'Record hookload (up, down, rotating), torque, SPP, flow, depth and time as your baseline.' },
  { key: 'playbook.first.3', text: 'Check the well: flow check and pit volumes. A pack-off or losses can hide a kick.' },
  { key: 'playbook.first.4', text: 'Apply the first action for the likely mechanism straight away. Most releases happen in the first minutes and sticking force grows with time.' },
  { key: 'playbook.first.5', text: 'Stay inside limits: maximum overpull, torque, trip load, and SPP/ECD for the open hole.' },
  { key: 'playbook.first.6', text: 'Notify the supervisor / drilling engineer and start the log.' },
];

const PREVENT_PACK = [
  { key: 'playbook.prevent_pack.1', text: 'Keep annular velocity and rheology adequate for the hole angle; sweep and rotate/reciprocate on connections.' },
  { key: 'playbook.prevent_pack.2', text: 'Monitor torque, drag and returns trends and stop to clean the hole when they build.' },
  { key: 'playbook.prevent_pack.3', text: 'Make wiper trips and pump out of high-angle sections instead of pulling dry.' },
];

export const PLAYBOOK = {
  diff: {
    now: [
      { key: 'playbook.diff.now.1', text: 'Keep circulating at the highest rate the hole allows. Returns should be normal.' },
      { key: 'playbook.diff.now.2', text: 'Slack off to set down weight, apply right-hand torque (hold within make-up limits) and jar down at maximum safe trip load. Repeat shots, do not wait.' },
      { key: 'playbook.diff.now.3', text: 'If kick margin allows and the supervisor approves, reduce hydrostatic: lighter pill / U-tube or lower mud weight. Size it in Calculate > Differential.' },
      { key: 'playbook.diff.now.4', text: 'Spot a pipe-release (oil-based or surfactant) pill across the stuck zone. Size it in Calculate > Spotting volume. Move small volumes periodically while soaking and keep working the pipe between movements.' },
    ],
    avoid: [
      { key: 'playbook.diff.avoid.1', text: 'Do not leave the string static: the sticking force increases with time.' },
      { key: 'playbook.diff.avoid.2', text: 'Do not reduce hydrostatic without checking pore pressure and kick margin.' },
      { key: 'playbook.diff.avoid.3', text: 'Do not exceed maximum overpull or torque limits.' },
    ],
    jar: { dir: 'down', key: 'playbook.diff.jar.text', text: 'Jar down at maximum safe trip load with torque held. If there is no movement after several shots, alternate with jarring up inside pull limits.' },
    confirm: [
      { key: 'playbook.diff.confirm.1', text: 'Circulation is normal with unchanged pressure.' },
      { key: 'playbook.diff.confirm.2', text: 'Estimated differential force (Calculate > Differential) exceeds the overpull you can safely apply.' },
      { key: 'playbook.diff.confirm.3', text: 'BHA position matches a permeable zone on logs.' },
    ],
    escalate: [
      { key: 'playbook.diff.escalate.1', text: 'No movement after the agreed soak time: run a free-point, then decide on back-off and fishing or a sidetrack.' },
      { key: 'playbook.diff.escalate.2', text: 'Pill cannot be spotted (circulation lost): treat as a combined problem and re-diagnose.' },
    ],
    prevent: [
      { key: 'playbook.diff.prevent.1', text: 'Minimise overbalance and keep fluid loss low with a thin, slick cake.' },
      { key: 'playbook.diff.prevent.2', text: 'Avoid long static periods across permeable zones: rotate/reciprocate and keep surveys short.' },
      { key: 'playbook.diff.prevent.3', text: 'Use spiral or slick drill collars and minimise BHA contact area.' },
    ],
  },
  pack_cut: {
    now: [
      { key: 'playbook.pack_cut.now.1', text: 'Bleed off trapped pump pressure immediately. Do not pressure up against the pack-off.' },
      { key: 'playbook.pack_cut.now.2', text: 'Work the string down with low torque and jar down repeatedly. Increase torque gradually inside limits.' },
      { key: 'playbook.pack_cut.now.3', text: 'Once there is any movement or rotation, try low-rate circulation and step the rate up as pressure allows.' },
      { key: 'playbook.pack_cut.now.4', text: 'When free, circulate bottoms-up with high-viscosity sweeps, rotating and reciprocating, before resuming.' },
    ],
    avoid: [
      { key: 'playbook.pack_cut.avoid.1', text: 'Do not jar up or pull hard: it packs the cuttings tighter.' },
      { key: 'playbook.pack_cut.avoid.2', text: 'Do not exceed SPP limits: risk of losses and fracturing.' },
      { key: 'playbook.pack_cut.avoid.3', text: 'Do not stop the pumps once circulation is re-established.' },
    ],
    jar: { dir: 'down', key: 'playbook.pack_cut.jar.text', text: 'Jar down (away from the cuttings). Never jar up against a pack-off.' },
    confirm: [
      { key: 'playbook.pack_cut.confirm.1', text: 'Circulation restricted or lost, with pressure rising before or at the moment of sticking.' },
      { key: 'playbook.pack_cut.confirm.2', text: 'Torque and drag trends were building and cuttings returns fell below expectation.' },
      { key: 'playbook.pack_cut.confirm.3', text: 'Hole angle 30-60 degrees or a long open-hole section.' },
    ],
    escalate: [
      { key: 'playbook.pack_cut.escalate.1', text: 'No circulation after sustained working: consider a free-point, back-off and wash-over or a sidetrack.' },
      { key: 'playbook.pack_cut.escalate.2', text: 'Any sign of losses, kick or flow: follow well-control procedure first.' },
    ],
    prevent: PREVENT_PACK,
  },
  pack_shale: {
    now: [
      { key: 'playbook.pack_shale.now.1', text: 'Bleed off trapped pressure. Do not pressure up against the pack-off.' },
      { key: 'playbook.pack_shale.now.2', text: 'Work the string down and jar down. Start with low torque and increase inside limits.' },
      { key: 'playbook.pack_shale.now.3', text: 'Re-establish circulation at a very low rate once there is movement and clear cavings with sweeps.' },
      { key: 'playbook.pack_shale.now.4', text: 'Check mud weight against stability: raise it only inside the pore / fracture window. Check inhibition and fluid loss for reactive shale.' },
    ],
    avoid: [
      { key: 'playbook.pack_shale.avoid.1', text: 'Do not jar up or pull hard against the pack-off.' },
      { key: 'playbook.pack_shale.avoid.2', text: 'Do not raise mud weight beyond the fracture limit or into a narrow window blindly.' },
      { key: 'playbook.pack_shale.avoid.3', text: 'Do not leave the open hole static for long periods.' },
    ],
    jar: { dir: 'down', key: 'playbook.pack_shale.jar.text', text: 'Jar down. Never jar up against a pack-off.' },
    confirm: [
      { key: 'playbook.pack_shale.confirm.1', text: 'Cavings at shakers: angular and splintery, larger than drilled cuttings.' },
      { key: 'playbook.pack_shale.confirm.2', text: 'Mud-log or offset records show unstable shale at the depth.' },
      { key: 'playbook.pack_shale.confirm.3', text: 'Torque and drag trends built before sticking.' },
    ],
    escalate: [
      { key: 'playbook.pack_shale.escalate.1', text: 'No circulation after sustained working: free-point and back-off, or sidetrack.' },
      { key: 'playbook.pack_shale.escalate.2', text: 'Repeated tight hole after freeing: stop and review mud weight and inhibition before going on.' },
    ],
    prevent: [
      { key: 'playbook.pack_shale.prevent.1', text: 'Hold stable mud weight and inhibition (OBM, KCl/polymer) for the formation.' },
      { key: 'playbook.pack_shale.prevent.2', text: 'Limit exposure time and surge/swab pressures.' },
      { key: 'playbook.pack_shale.prevent.3', text: 'Plan wiper trips and have contingencies for the shale intervals.' },
    ],
  },
  pack_frac: {
    now: [
      { key: 'playbook.pack_frac.now.1', text: 'Bleed off trapped pressure. Do not pressure up against the pack-off.' },
      { key: 'playbook.pack_frac.now.2', text: 'Work the string down and jar down at moderate torque.' },
      { key: 'playbook.pack_frac.now.3', text: 'Treat any losses (LCM) before circulating at higher rates and watch the well.' },
      { key: 'playbook.pack_frac.now.4', text: 'Once free, reduce ECD and surge pressures and clean out gently.' },
    ],
    avoid: [
      { key: 'playbook.pack_frac.avoid.1', text: 'Do not jar up or pull hard.' },
      { key: 'playbook.pack_frac.avoid.2', text: 'Do not pressure up: fractured rock takes fluid and may fall in more.' },
      { key: 'playbook.pack_frac.avoid.3', text: 'Do not ignore flow or pit-gain signs: follow well-control procedure.' },
    ],
    jar: { dir: 'down', key: 'playbook.pack_frac.jar.text', text: 'Jar down. Never jar up against a pack-off.' },
    confirm: [
      { key: 'playbook.pack_frac.confirm.1', text: 'Sudden onset with falling returns or losses.' },
      { key: 'playbook.pack_frac.confirm.2', text: 'Formation is fractured, faulted, coal or unconsolidated at this depth.' },
    ],
    escalate: [
      { key: 'playbook.pack_frac.escalate.1', text: 'No movement or circulation after sustained working: free-point and back-off or sidetrack.' },
    ],
    prevent: [
      { key: 'playbook.pack_frac.prevent.1', text: 'Control ROP and ECD, minimise surge, and strengthen the wellbore with LCM where needed.' },
      { key: 'playbook.pack_frac.prevent.2', text: 'Avoid leaving the string static through known fractured intervals.' },
    ],
  },
  key: {
    now: [
      { key: 'playbook.key.now.1', text: 'Stop pulling. Do not keep overpulling: the BHA wedges deeper into the slot.' },
      { key: 'playbook.key.now.2', text: 'Slack off and jar down at maximum safe trip load. Rotate while working down if rotation is possible.' },
      { key: 'playbook.key.now.3', text: 'Establish circulation to keep the hole clean and lubricate.' },
      { key: 'playbook.key.now.4', text: 'Once free, ream or back-ream the key seat slowly, with rotation, before continuing the trip.' },
    ],
    avoid: [
      { key: 'playbook.key.avoid.1', text: 'Do not jar up and do not continue to overpull.' },
      { key: 'playbook.key.avoid.2', text: 'Do not trip fast through the dogleg interval after release.' },
    ],
    jar: { dir: 'down', key: 'playbook.key.jar.text', text: 'Jar down, then rotate and work down. Jarring up drives the BHA further into the slot.' },
    confirm: [
      { key: 'playbook.key.confirm.1', text: 'Pipe can be lowered but not pulled.' },
      { key: 'playbook.key.confirm.2', text: 'Circulation is normal.' },
      { key: 'playbook.key.confirm.3', text: 'Sticking depth matches a dogleg or the casing shoe: use the free-point tool to compare.' },
    ],
    escalate: [
      { key: 'playbook.key.escalate.1', text: 'No release after repeated down jar shots: free-point, back-off and fish, or sidetrack.' },
    ],
    prevent: [
      { key: 'playbook.key.prevent.1', text: 'Limit dogleg severity and run a key-seat wiper or string reamers in the BHA.' },
      { key: 'playbook.key.prevent.2', text: 'Ream the interval before tripping out.' },
      { key: 'playbook.key.prevent.3', text: 'Track repeated tight spots on trips and treat them early.' },
    ],
  },
  ledge: {
    now: [
      { key: 'playbook.ledge.now.1', text: 'Work the string away from the direction of travel at sticking: jar up if stuck going down, jar down if stuck pulling up.' },
      { key: 'playbook.ledge.now.2', text: 'Apply slow right-hand rotation while working to roll the BHA off the ledge.' },
      { key: 'playbook.ledge.now.3', text: 'Circulate while working to keep the hole clean.' },
      { key: 'playbook.ledge.now.4', text: 'Once free, ream the ledge with rotation, and consider roller reamers or a less stiff BHA.' },
    ],
    avoid: [
      { key: 'playbook.ledge.avoid.1', text: 'Do not slack off heavy onto the ledge: it wedges the BHA.' },
      { key: 'playbook.ledge.avoid.2', text: 'Do not overpull beyond limits.' },
    ],
    jar: { dir: 'opposite', key: 'playbook.ledge.jar.text', text: 'Jar opposite to the direction of travel at sticking.' },
    confirm: [
      { key: 'playbook.ledge.confirm.1', text: 'String can be pulled but not lowered (stuck going in), or the reverse.' },
      { key: 'playbook.ledge.confirm.2', text: 'Recent BHA change or an interbedded hard/soft interval.' },
    ],
    escalate: [
      { key: 'playbook.ledge.escalate.1', text: 'No release after repeated jar shots: free-point, back-off and fish, or sidetrack.' },
    ],
    prevent: [
      { key: 'playbook.ledge.prevent.1', text: 'Control trip speed through known ledge depths and ream them.' },
      { key: 'playbook.ledge.prevent.2', text: 'Review BHA stiffness and stabiliser placement when changing BHA.' },
    ],
  },
  under: {
    now: [
      { key: 'playbook.under.now.1', text: 'Jar up (if stuck while running in) within pull limits and apply rotation.' },
      { key: 'playbook.under.now.2', text: 'Circulate while working the string.' },
      { key: 'playbook.under.now.3', text: 'Once free, pull back above the tight section and ream it down slowly.' },
      { key: 'playbook.under.now.4', text: 'On the next trip, ream the last stands and never force a bit into undergauge hole.' },
    ],
    avoid: [
      { key: 'playbook.under.avoid.1', text: 'Do not slack off heavy: it wedges the BHA tighter.' },
      { key: 'playbook.under.avoid.2', text: 'Do not drive the string through tight hole without reaming.' },
    ],
    jar: { dir: 'up', key: 'playbook.under.jar.text', text: 'Jar up (opposite to the direction of travel) within pull limits.' },
    confirm: [
      { key: 'playbook.under.confirm.1', text: 'Previous bit came out undergauge or section is hard / abrasive.' },
      { key: 'playbook.under.confirm.2', text: 'String can be pulled but not lowered.' },
    ],
    escalate: [
      { key: 'playbook.under.escalate.1', text: 'No release after repeated jar shots: free-point and back-off, or sidetrack.' },
    ],
    prevent: [
      { key: 'playbook.under.prevent.1', text: 'Gauge-protected bits and stabilisers, and careful gauge checks.' },
      { key: 'playbook.under.prevent.2', text: 'Ream undergauge sections before the new bit goes to bottom.' },
    ],
  },
  mobile: {
    now: [
      { key: 'playbook.mobile.now.1', text: 'Establish circulation and keep the string moving in both directions inside limits.' },
      { key: 'playbook.mobile.now.2', text: 'Jar opposite to the direction of travel and keep rotating if possible.' },
      { key: 'playbook.mobile.now.3', text: 'In salt, spot fresh water or under-saturated brine across the interval where allowed (not in shale).' },
      { key: 'playbook.mobile.now.4', text: 'Raise mud weight inside the fracture window to resist creep and ream the interval once free.' },
    ],
    avoid: [
      { key: 'playbook.mobile.avoid.1', text: 'Do not leave the string static.' },
      { key: 'playbook.mobile.avoid.2', text: 'Do not use fresh water if the stuck zone is shale, not salt.' },
    ],
    jar: { dir: 'opposite', key: 'playbook.mobile.jar.text', text: 'Jar opposite to the direction of travel at sticking and keep the pipe moving.' },
    confirm: [
      { key: 'playbook.mobile.confirm.1', text: 'Formation at the stuck point is salt or plastic shale.' },
      { key: 'playbook.mobile.confirm.2', text: 'Torque and drag increased with time since drilling.' },
    ],
    escalate: [
      { key: 'playbook.mobile.escalate.1', text: 'No release: free-point and back-off, or sidetrack. Salt creep gets worse with time.' },
    ],
    prevent: [
      { key: 'playbook.mobile.prevent.1', text: 'Run adequate mud weight for the creep rate and ream through the interval.' },
      { key: 'playbook.mobile.prevent.2', text: 'Limit static time and use bi-centre bits where hole closure is expected.' },
    ],
  },
  foreign: {
    now: [
      { key: 'playbook.foreign.now.1', text: 'Jar opposite to the direction of travel at sticking within limits and avoid heavy overpull.' },
      { key: 'playbook.foreign.now.2', text: 'Circulate if possible and inspect returns for metal, rubber or cement.' },
      { key: 'playbook.foreign.now.3', text: 'Check cement records, bit and BHA condition and casing history.' },
      { key: 'playbook.foreign.now.4', text: 'Involve a fishing specialist early if junk is the cause.' },
    ],
    avoid: [
      { key: 'playbook.foreign.avoid.1', text: 'Do not overpull aggressively: junk and cement can lock tighter.' },
      { key: 'playbook.foreign.avoid.2', text: 'Do not circulate hard if casing damage is suspected.' },
    ],
    jar: { dir: 'opposite', key: 'playbook.foreign.jar.text', text: 'Jar opposite to the direction of travel at sticking, inside limits.' },
    confirm: [
      { key: 'playbook.foreign.confirm.1', text: 'Returns contain metal, rubber, cement or casing pieces.' },
      { key: 'playbook.foreign.confirm.2', text: 'A recent cement job, dropped object or known casing wear.' },
    ],
    escalate: [
      { key: 'playbook.foreign.escalate.1', text: 'Decide early on fishing or a sidetrack. Delay rarely helps.' },
    ],
    prevent: [
      { key: 'playbook.foreign.prevent.1', text: 'Control the cement drill-out, junk baskets and casing wear.' },
    ],
  },
};

export function playbookFor(id, input) {
  const base = PLAYBOOK[id];
  const s = normalise(input || {});
  let jarText = base.jar.text;
  let jarDir = base.jar.dir;
  let jarKey = base.jar.key;
  if (jarDir === 'opposite') {
    if (s.lastMove === 'up') {
      jarDir = 'down';
      jarKey = 'playbook.jar.opposite_up';
      jarText = 'Jar down (opposite to the last movement, which was up).';
    } else if (s.lastMove === 'down') {
      jarDir = 'up';
      jarKey = 'playbook.jar.opposite_down';
      jarText = 'Jar up (opposite to the last movement, which was down).';
    } else {
      jarDir = 'unknown';
      jarKey = 'playbook.jar.opposite_unknown';
      jarText = (base.jar.text || 'Jar opposite to the direction of travel at sticking.') + ' The last movement is not known: confirm it with the driller before jarring.';
    }
  }
  return {
    ...base,
    jar: { dir: jarDir, key: jarKey, text: jarText },
  };
}

export const TIGHT_HOLE = {
  now: [
    { key: 'tight_hole.now.1', text: 'You can still move the string, so this is a warning, not yet a stuck pipe. Stop forcing it.' },
    { key: 'tight_hole.now.2', text: 'Work the string through gently: circulate, rotate and ream the tight interval in both directions.' },
    { key: 'tight_hole.now.3', text: 'Record the depth and the overpull / drag at each tight spot.' },
    { key: 'tight_hole.now.4', text: 'Raise hole-cleaning effort: sweeps, rotation, flow rate within limits.' },
  ],
  avoid: [
    { key: 'tight_hole.avoid.1', text: 'Do not push through with high overpull or heavy slack-off: forcing a tight hole is how pipe gets stuck.' },
  ],
};

// ---------------------------------------------------------------- units
export const QTY = {
  density:  { field: 'ppg',   metric: 'kg/m³', k: 119.826 },
  depth:    { field: 'ft',    metric: 'm',     k: 0.3048 },
  pressure: { field: 'psi',   metric: 'bar',   k: 0.0689476 },
  force:    { field: 'lbf',   metric: 'kN',    k: 0.00444822 },
  dia:      { field: 'in',    metric: 'mm',    k: 25.4 },
  wpl:      { field: 'lb/ft', metric: 'kg/m',  k: 1.48816 },
  vol:      { field: 'bbl',   metric: 'm³',    k: 0.158987 },
};
export const unitLabel = (q, sys) => QTY[q][sys];
export const toDisplay = (q, v, sys) => (sys === 'metric' ? v * QTY[q].k : v);
export const toField = (q, v, sys) => (sys === 'metric' ? v / QTY[q].k : v);

// ---------------------------------------------------------------- calculators (field units internally)
const bad = (...xs) => xs.some((x) => !Number.isFinite(x));
const nonpos = (...xs) => xs.some((x) => !(x > 0));

export const calc = {
  K_STRETCH: 735294, // lbf per (in of stretch x lb/ft / ft): E = 30e6 psi, steel 3.4 lb/ft per in^2

  buoyancy: (mwPpg) => 1 - mwPpg / 65.4,
  hydrostatic: (mwPpg, tvdFt) => 0.052 * mwPpg * tvdFt,
  overbalance: (mwPpg, ppPsi, tvdFt) => 0.052 * mwPpg * tvdFt - ppPsi,

  // formation pressure given as psi
  contactWidth(cakeIn, odIn) {
    if (bad(cakeIn, odIn) || nonpos(odIn) || cakeIn < 0) return NaN;
    return 2 * Math.sqrt(Math.max(0, cakeIn * (odIn - cakeIn)));
  },

  diffForce({ mwPpg, ppPsi, tvdFt, mu, cakeIn, odIn, contactFt }) {
    if (bad(mwPpg, ppPsi, tvdFt, mu, cakeIn, odIn, contactFt) || nonpos(tvdFt, mu, odIn, contactFt) || cakeIn < 0) return { error: 'invalid' };
    const dp = calc.overbalance(mwPpg, ppPsi, tvdFt);
    const widthIn = calc.contactWidth(cakeIn, odIn);
    const areaIn2 = widthIn * contactFt * 12;
    const forceLbf = dp > 0 ? mu * dp * areaIn2 : 0;
    return { dp, widthIn, areaIn2, forceLbf };
  },

  freePoint({ stretchIn, pullLbf, weightLbft }) {
    if (bad(stretchIn, pullLbf, weightLbft) || nonpos(stretchIn, pullLbf, weightLbft)) return { error: 'invalid' };
    return { freePointFt: (calc.K_STRETCH * stretchIn * weightLbft) / pullLbf };
  },

  // sections from surface downward: [{lengthFt, weightLbft}]
  freePointComposite({ stretchIn, pullLbf, sections }) {
    if (bad(stretchIn, pullLbf) || nonpos(stretchIn, pullLbf) || !sections || !sections.length) return { error: 'invalid' };
    for (const s of sections) if (bad(s.lengthFt, s.weightLbft) || nonpos(s.lengthFt, s.weightLbft)) return { error: 'invalid' };
    let remaining = stretchIn, depth = 0;
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const full = (pullLbf * s.lengthFt) / (calc.K_STRETCH * s.weightLbft);
      if (remaining <= full) {
        depth += (remaining * calc.K_STRETCH * s.weightLbft) / pullLbf;
        return { freePointFt: depth, sectionIndex: i, beyondString: false };
      }
      remaining -= full;
      depth += s.lengthFt;
    }
    return { freePointFt: depth, sectionIndex: sections.length - 1, beyondString: true, residualStretchIn: remaining };
  },

  safeOverpull({ yieldLbf, designFactor, freeWeightLbf }) {
    if (bad(yieldLbf, designFactor, freeWeightLbf) || nonpos(yieldLbf, designFactor) || designFactor > 1 || freeWeightLbf < 0) return { error: 'invalid' };
    const maxHookload = yieldLbf * designFactor;
    return { maxHookloadLbf: maxHookload, overpullLbf: maxHookload - freeWeightLbf };
  },

  assessRelease(forceLbf, overpullLbf) {
    if (bad(forceLbf, overpullLbf)) return { error: 'invalid' };
    if (forceLbf <= 0) return { level: 'ok', ratio: Infinity, key: 'calc.verdict.no_overbalance', message: 'No positive overbalance: differential sticking force is zero at these inputs.' };
    const ratio = overpullLbf / forceLbf;
    if (overpullLbf <= 0) return { level: 'bad', ratio, key: 'calc.verdict.no_margin', message: 'No overpull margin left. Reduce hydrostatic and soak a release pill; pulling alone is not an option.' };
    if (ratio >= 1.5) return { level: 'ok', ratio, key: 'calc.verdict.good_margin', message: 'Safe overpull exceeds the estimated sticking force by a good margin. Jarring has a reasonable chance.' };
    if (ratio >= 1.0) return { level: 'warn', ratio, key: 'calc.verdict.thin_margin', message: 'Margin is thin. Combine jarring with a release pill and a hydrostatic reduction.' };
    return { level: 'bad', ratio, key: 'calc.verdict.overpull_below', message: 'Safe overpull is below the estimated sticking force. Do not rely on pulling: reduce ΔP and soak a pill.' };
  },

  // pressure reduction needed so that force <= target fraction of available overpull
  requiredDpReduction({ dp, forceLbf, overpullLbf, targetFraction = 0.7 }) {
    if (bad(dp, forceLbf, overpullLbf) || forceLbf <= 0 || overpullLbf <= 0) return { error: 'invalid' };
    const dpTarget = dp * ((overpullLbf * targetFraction) / forceLbf);
    return { dpTarget, reductionPsi: Math.max(0, dp - dpTarget) };
  },

  hydReduction({ mwPpg, pillMwPpg, pillTvdFt }) {
    if (bad(mwPpg, pillMwPpg, pillTvdFt) || nonpos(mwPpg, pillMwPpg, pillTvdFt)) return { error: 'invalid' };
    return { reductionPsi: 0.052 * (mwPpg - pillMwPpg) * pillTvdFt };
  },

  annularCapacity: (holeIn, pipeIn) => (holeIn * holeIn - pipeIn * pipeIn) / 1029.4, // bbl/ft

  spotVolume({ holeIn, pipeIn, intervalFt, marginFt, excessPct, leaveInStringBbl }) {
    if (bad(holeIn, pipeIn, intervalFt, marginFt, excessPct, leaveInStringBbl) || nonpos(holeIn, intervalFt) || pipeIn < 0 || pipeIn >= holeIn || marginFt < 0 || excessPct < 0 || leaveInStringBbl < 0) return { error: 'invalid' };
    const cap = calc.annularCapacity(holeIn, pipeIn);
    const annBbl = cap * (intervalFt + marginFt) * (1 + excessPct / 100);
    return { capacityBblFt: cap, annularBbl: annBbl, totalBbl: annBbl + leaveInStringBbl };
  },
};

// ---------------------------------------------------------------- report
export function buildReport({ input, result, log, system = 'field' }) {
  const lines = [];
  lines.push('STUCK PIPE REPORT');
  lines.push('Generated: ' + new Date().toISOString());
  lines.push('');
  lines.push('Observations:');
  const s = normalise(input);
  for (const k of ['operation', 'lastMove', 'circulation', 'onset', 'rotation', 'movement', 'angle', 'zone', 'overbalance', 'staticTime', 'mud']) {
    if (s[k] !== 'unknown') lines.push('  - ' + k + ': ' + s[k]);
  }
  if (s.flags.size) lines.push('  - indicators: ' + [...s.flags].join(', '));
  lines.push('');
  if (result && result.ranked) {
    lines.push('Diagnosis (' + result.confidence.level + ' confidence):');
    result.ranked.slice(0, 3).forEach((r) => lines.push('  - ' + r.name + ': ' + Math.round(r.prob * 100) + '%'));
    lines.push('');
  }
  if (log && log.length) {
    lines.push('Log:');
    log.forEach((e) => lines.push('  ' + e.time + (e.depth ? ' | depth ' + e.depth : '') + (e.hookload ? ' | hookload ' + e.hookload : '') + (e.spp ? ' | SPP ' + e.spp : '') + (e.torque ? ' | torque ' + e.torque : '') + ' | ' + e.note));
  }
  lines.push('');
  lines.push('Decision support only. Follow operator procedures and equipment limits.');
  return lines.join('\n');
}
