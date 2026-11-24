import fs from 'fs';
import assert from 'assert';

console.log('====================================================');
console.log('   RISER MARGIN CALCULATION VERIFICATION TESTS      ');
console.log('====================================================');

const appJs = fs.readFileSync('app.js', 'utf8');
const trJs = fs.readFileSync('translations.js', 'utf8');

global.window = global;
global.document = { addEventListener: () => {} };
global.localStorage = { getItem: () => 'en', setItem: () => {} };

// Evaluate translations
eval(trJs);

// Extract Riser Margin functions from app.js
const calcRiserMarginMatch = appJs.match(/function calculateRiserMargin\(inputs\) \{[\s\S]*?\n\}/);
assert(calcRiserMarginMatch, 'calculateRiserMargin function not found in app.js');

let calculateRiserMargin;
eval('calculateRiserMargin = ' + calcRiserMarginMatch[0]);

console.log('\n--- TEST 1: Default Math Parity with User Specification ---');
const defInputs = {
  depthUnit: 'm',
  densityUnit: 'ppg',
  whDepth: 1073,
  tdDepth: 1508,
  mudWeight: 9.4,
  swDensity: 8.6,
  porePressure: 8.8
};
const res = calculateRiserMargin(defInputs);
assert(res.valid === true, 'Calculation should be valid with default inputs');

// 1. Pill density
assert.strictEqual(res.exactPillPpg.toFixed(2), '11.37', 'Exact pill density should be 11.37 ppg');
assert.strictEqual(res.exactPillSg.toFixed(3), '1.365', 'Exact pill SG should be 1.365 SG');
assert.strictEqual(res.recPillPpg.toFixed(1), '11.4', 'Recommended pill density should be 11.4 ppg');
assert.strictEqual(res.deltaPillPpg.toFixed(1), '2.0', 'Pill weight delta should be +2.0 ppg');

// 2. Hydrostatic lost & Riser margin
assert.strictEqual(res.deltaPlostPsi.toFixed(1), '146.5', 'Delta P lost should be 146.5 psi');
assert.strictEqual(res.riserMarginPpg.toFixed(2), '0.57', 'Riser margin should be 0.57 ppg');
assert.strictEqual(Math.round(res.pillLengthM), 435, 'Pill length should be 435 m');
assert.strictEqual(res.pillLengthFt.toFixed(1), '1427.2', 'Pill length in ft should be 1427.2 ft');
assert.strictEqual(Math.round(res.whPBeforePsi), 1721, 'WH pressure before should be 1721 psi');
assert.strictEqual(Math.round(res.whPAfterPsi), 1574, 'WH pressure after should be 1574 psi');

// 3. 3-State BHP & EMW
assert.strictEqual(Math.round(res.stateA.bhpPsi), 2418, 'State A BHP should be 2418 psi');
assert.strictEqual(res.stateA.emwPpg.toFixed(2), '9.40', 'State A EMW should be 9.40 ppg');
assert.strictEqual(Math.round(res.stateA.overbalPsi), 154, 'State A overbalance should be 154 psi');
assert.strictEqual(res.stateA.overbalPpg.toFixed(2), '0.60', 'State A overbalance should be 0.60 ppg');

assert.strictEqual(Math.round(res.stateB.bhpPsi), 2567, 'State B BHP should be 2567 psi');
assert.strictEqual(res.stateB.emwPpg.toFixed(2), '9.98', 'State B EMW should be 9.98 ppg');
assert.strictEqual(Math.round(res.stateB.gainPsi), 148, 'State B net gain should be 148 psi');
assert.strictEqual(res.stateB.gainPpg.toFixed(2), '0.58', 'State B net gain should be 0.58 ppg');

assert.strictEqual(Math.round(res.stateC.bhpPsi), 2420, 'State C BHP should be 2420 psi');
assert.strictEqual(res.stateC.emwPpg.toFixed(2), '9.41', 'State C EMW should be 9.41 ppg');
assert.strictEqual(Math.round(res.stateC.changePsi), 2, 'State C net change should be +2 psi');
assert.strictEqual(Math.round(res.stateC.safetyPsi), 156, 'State C safety margin should be 156 psi');
assert.strictEqual(res.stateC.safetyPpg.toFixed(2), '0.61', 'State C safety margin should be 0.61 ppg');

assert.strictEqual(Math.round(res.noPill.bhpPsi), 2272, 'No-pill BHP should be 2272 psi');
assert.strictEqual(res.noPill.emwPpg.toFixed(2), '8.83', 'No-pill EMW should be 8.83 ppg');
assert.strictEqual(Math.round(res.noPill.lossPsi), -146, 'No-pill loss should be -146 psi');
assert.strictEqual(res.noPill.isSafe, true, 'No-pill should be safe (> pore pressure)');

console.log('PASSED: Default math values match specifications exactly!');

console.log('\n--- TEST 2: Validation Guards ---');
const invalid1 = calculateRiserMargin({ ...defInputs, tdDepth: 1000 });
assert.strictEqual(invalid1.valid, false, 'Should be invalid when TD <= WH depth');
assert(invalid1.error.includes('strictly greater'), 'Error message should describe TD > WH requirement');

const invalid2 = calculateRiserMargin({ ...defInputs, mudWeight: -1 });
assert.strictEqual(invalid2.valid, false, 'Should be invalid when mudWeight <= 0');
console.log('PASSED: Validation guards successfully prevent invalid inputs!');

console.log('\n--- TEST 3: Multi-Language Localization Verification ---');
const langs = ['en', 'es', 'hi', 'ar', 'zh', 'fr', 'pt', 'de', 'ja', 'ru', 'id', 'ko', 'uk'];
const checkKeys = [
  'Riser Margin Calculation',
  'IWCF subsea riser margin, weighted pill density & LMRP unlatch BHP analysis',
  'RECOMMENDED PILL DENSITY',
  'Exact Balance',
  'Pill Density Increase',
  'Pill Column Length',
  'Riser Margin Equivalent',
  'SAFE ABOVE PORE PRESSURE',
  'UNDERBALANCED RISK',
  'Generate Job Record (PDF)',
  'COMPULSORY ENGINEERING INPUTS',
  'Planned LMRP Unlatch',
  'RISER MARGIN & HYDROSTATIC LOSS',
  'Hydrostatic Pressure Lost',
  'Seawater column replaces drilling mud in marine riser',
  'Equivalent mud density difference across wellhead TVD',
  '3-State BHP & EMW Comparison Matrix',
  'State',
  'Riser Fluid',
  'BHP at TD',
  'EMW at TD',
  'Margin / Status',
  'A. Now (Connected)',
  'B. Pill Spotted',
  'C. Planned Unlatch',
  'Unlatched (No Pill)',
  'Mud',
  'Mud + Pill',
  'Seawater + Pill',
  'Seawater + Mud',
  'Baseline',
  'Overbalanced',
  'Safe Unlatch',
  'Hydrostatic Column Schematic',
  'HYDROSTATIC WELLBORE SCHEMATIC (3 STAGES)',
  'Seawater',
  'Drilling Mud',
  'Weighted Pill',
  'Surface / RKB',
  'Seabed / Wellhead',
  'Total Depth (TD)',
  'Stage A: Baseline',
  'Riser Connected · Mud Column',
  'BHP AT TD (CONNECTED)',
  'Overbalance',
  'Stage B: Pill Spotted',
  'Riser Connected · Pill Below WH',
  'Pill',
  'BHP PRE-UNLATCH (BOOSTED)',
  'Pre-Boost',
  'Stage C: Planned Unlatch',
  'LMRP Disconnected · Seawater',
  'BHP AFTER UNLATCH (PLANNED)',
  'Safe Margin',
  'PILL DENSITY SENSITIVITY CURVE (EMW AFTER UNLATCH)',
  'Pore Pressure',
  'Current MW',
  'Pill Density',
  'EMW',
  'Pill Density vs. BHP After Unlatch',
  'EMW After Unlatch',
  'BHP',
  'Margin over Pore Pressure',
  'REC',
  'EXACT',
  'IWCF Subsea Operational Unlatch Checklist',
  'Verify current pore pressure gradient and wellbore stability before starting pill calculation.',
  'Calculate and batch-mix weighted pill with verified surface sample density.',
  'Spot pill across open hole / wellhead section.',
  'Confirm pill placement with spacer ahead and behind; monitor trip tank for U-tube effects.',
  'Perform flow check through subsea choke/kill line before unlatching LMRP.',
  'Close lower annular / pipe rams if required per subsea emergency disconnect sequence.',
  'Unlatch LMRP; monitor wellhead sonar/camera and confirm zero gas bubbles or fluid outflow.'
];

const translationsDict = global.I18n ? global.I18n.translations : (typeof translations !== 'undefined' ? translations : null);
for (const lang of langs) {
  for (const k of checkKeys) {
    const tr = translationsDict[lang] && translationsDict[lang][k];
    assert(tr, `Missing translation for "${k}" in language "${lang}"`);
  }
}
console.log(`PASSED: All 13 languages have 100% complete translations for all ${checkKeys.length} keys!`);

console.log('\n--- TEST 4: Search & Navigation Integration & Standalone Isolation ---');
assert(appJs.includes("'riser_margin': ['riser margin'"), 'curatedSynonymsMap contains riser_margin');
assert(appJs.includes("id: 'riser_margin'"), 'buildSearchRegistry contains riser_margin');
assert(appJs.includes("openRiserMarginDirectly()"), 'openRiserMarginDirectly is defined and used');
assert(appJs.includes("cat-riser-margin-btn"), 'cat-riser-margin-btn card exists in Calculation Hub');
assert(appJs.includes("calcSubState.view === 'riser-margin'"), 'view router handles riser-margin');

// Verify strict single entry-point isolation
assert(!appJs.includes("'riser_margin',\n      'subsea_accumulator'"), 'riser_margin must not be in subseaCalcSections');
assert(!appJs.includes('id="riser-margin-fav-btn"'), 'No favorite button on Riser Margin detail screen');
assert(appJs.includes("favs = favs.filter(f => f !== 'riser_margin')"), 'getCalcFavorites cleans out riser_margin');
assert(appJs.includes("if (itemId === 'riser_margin') return;"), 'Quick access builder ignores riser_margin');

console.log('PASSED: Search, card markup, single entry-point isolation, and navigation wiring verified!');

console.log('\n====================================================');
console.log('   ALL RISER MARGIN VERIFICATION TESTS PASSED!      ');
console.log('====================================================');
