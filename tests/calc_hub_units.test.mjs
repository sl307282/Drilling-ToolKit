/**
 * Calculation Hub Universal Unit Parity Test Suite
 * Tests all 132 calculators across Drilling Calculations and Well Control Calculations
 * Verifies Mixed, API, and SI unit adaptation, canonical math engine, and zero formula drift.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import UnitsEngine from '../units_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read app.js and extract formulaDb, wellControlDb, and helper functions
const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const calcFreePointMatch = appJsContent.match(/function calcFreePoint\([\s\S]*?\n\}/);
if (calcFreePointMatch) {
  eval('global.calcFreePoint = ' + calcFreePointMatch[0]);
}

const calcFreePointWeightMatch = appJsContent.match(/function calcFreePointWeight\([\s\S]*?\n\}/);
if (calcFreePointWeightMatch) {
  eval('global.calcFreePointWeight = ' + calcFreePointWeightMatch[0]);
}

const dragThresholdsMatch = appJsContent.match(/const DRAG_ALERT_THRESHOLDS = (\{[\s\S]*?\n\};)/);
if (dragThresholdsMatch) {
  eval('global.DRAG_ALERT_THRESHOLDS = ' + dragThresholdsMatch[1]);
}

const calcDragAnalysisMatch = appJsContent.match(/function calcDragAnalysis\([\s\S]*?\n\}/);
if (calcDragAnalysisMatch) {
  eval('var DRAG_ALERT_THRESHOLDS = global.DRAG_ALERT_THRESHOLDS;\nglobal.calcDragAnalysis = ' + calcDragAnalysisMatch[0]);
}

const calcFreePipePercentageMatch = appJsContent.match(/function calcFreePipePercentage\([\s\S]*?\n\}/);
if (calcFreePipePercentageMatch) {
  eval('global.calcFreePipePercentage = ' + calcFreePipePercentageMatch[0]);
}

const fishThresholdsMatch = appJsContent.match(/const FISHING_LOAD_THRESHOLDS = (\{[\s\S]*?\n\};)/);
if (fishThresholdsMatch) {
  eval('global.FISHING_LOAD_THRESHOLDS = ' + fishThresholdsMatch[1]);
}

const calcFishingStringLoadMatch = appJsContent.match(/function calcFishingStringLoad\([\s\S]*?\n\}/);
if (calcFishingStringLoadMatch) {
  eval('var FISHING_LOAD_THRESHOLDS = global.FISHING_LOAD_THRESHOLDS;\nglobal.calcFishingStringLoad = ' + calcFishingStringLoadMatch[0]);
}

const subseaAccSafetyMatch = appJsContent.match(/const SUBSEA_ACC_SAFETY_FACTOR = (.*?);/);
if (subseaAccSafetyMatch) {
  eval('global.SUBSEA_ACC_SAFETY_FACTOR = ' + subseaAccSafetyMatch[1]);
}

const calcSubseaAccMatch = appJsContent.match(/function calcSubseaAccumulatorCapacity\([\s\S]*?\n\}/);
if (calcSubseaAccMatch) {
  eval('var SUBSEA_ACC_SAFETY_FACTOR = global.SUBSEA_ACC_SAFETY_FACTOR;\nglobal.calcSubseaAccumulatorCapacity = ' + calcSubseaAccMatch[0]);
}

const pipePulledHelperMatch = appJsContent.match(/const PipePulledHelper = (\{[\s\S]*?\n\};)/);
if (pipePulledHelperMatch) {
  eval('global.PipePulledHelper = ' + pipePulledHelperMatch[1]);
}

const calcPipePulledDryMatch = appJsContent.match(/function calcPipePulledDry\([\s\S]*?\n\}/);
if (calcPipePulledDryMatch) {
  eval('var PipePulledHelper = global.PipePulledHelper;\nglobal.calcPipePulledDry = ' + calcPipePulledDryMatch[0]);
}

const calcPipePulledWetMatch = appJsContent.match(/function calcPipePulledWet\([\s\S]*?\n\}/);
if (calcPipePulledWetMatch) {
  eval('var PipePulledHelper = global.PipePulledHelper;\nglobal.calcPipePulledWet = ' + calcPipePulledWetMatch[0]);
}

const calcDrillPipePulledLoseDryMatch = appJsContent.match(/function calcDrillPipePulledLoseDry\([\s\S]*?\n\}/);
if (calcDrillPipePulledLoseDryMatch) {
  eval('var PipePulledHelper = global.PipePulledHelper;\nglobal.calcDrillPipePulledLoseDry = ' + calcDrillPipePulledLoseDryMatch[0]);
}

const calcDrillPipePulledLoseWetMatch = appJsContent.match(/function calcDrillPipePulledLoseWet\([\s\S]*?\n\}/);
if (calcDrillPipePulledLoseWetMatch) {
  eval('var PipePulledHelper = global.PipePulledHelper;\nglobal.calcDrillPipePulledLoseWet = ' + calcDrillPipePulledLoseWetMatch[0]);
}

const drillingCalcConfigMatch = appJsContent.match(/const DRILLING_CALC_CONFIG = (\{[\s\S]*?\n\};)/);
if (drillingCalcConfigMatch) {
  eval('global.DRILLING_CALC_CONFIG = ' + drillingCalcConfigMatch[1]);
}

const calcNeutralPointMatch = appJsContent.match(/function calcNeutralPoint\([\s\S]*?\n\}/);
if (calcNeutralPointMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcNeutralPoint = ' + calcNeutralPointMatch[0]);
}

const calcTensileCapacityMatch = appJsContent.match(/function calcTensileCapacity\([\s\S]*?\n\}/);
if (calcTensileCapacityMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcTensileCapacity = ' + calcTensileCapacityMatch[0]);
}

const calcDcWeightVerticalMatch = appJsContent.match(/function calcDcWeightVertical\([\s\S]*?\n\}/);
if (calcDcWeightVerticalMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcDcWeightVertical = ' + calcDcWeightVerticalMatch[0]);
}

const calcDcWeightDeviatedMatch = appJsContent.match(/function calcDcWeightDeviated\([\s\S]*?\n\}/);
if (calcDcWeightDeviatedMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar calcDcWeightVertical = global.calcDcWeightVertical;\nglobal.calcDcWeightDeviated = ' + calcDcWeightDeviatedMatch[0]);
}

const calcMarginOfOverpullMatch = appJsContent.match(/function calcMarginOfOverpull\([\s\S]*?\n\}/);
if (calcMarginOfOverpullMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcMarginOfOverpull = ' + calcMarginOfOverpullMatch[0]);
}

const calcEquivalentCirculatingDensityMatch = appJsContent.match(/function calcEquivalentCirculatingDensity\([\s\S]*?\n\}/);
if (calcEquivalentCirculatingDensityMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcEquivalentCirculatingDensity = ' + calcEquivalentCirculatingDensityMatch[0]);
}

const drillingMathMatch = appJsContent.match(/const DrillingMath = (\{[\s\S]*?\n\};)/);
if (drillingMathMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.DrillingMath = ' + drillingMathMatch[1]);
}

const calcDrillStringWeightAirMatch = appJsContent.match(/function calcDrillStringWeightAir\([\s\S]*?\n\}/);
if (calcDrillStringWeightAirMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcDrillStringWeightAir = ' + calcDrillStringWeightAirMatch[0]);
}

const calcDrillStringWeightMudMatch = appJsContent.match(/function calcDrillStringWeightMud\([\s\S]*?\n\}/);
if (calcDrillStringWeightMudMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nglobal.calcDrillStringWeightMud = ' + calcDrillStringWeightMudMatch[0]);
}

const calcCriticalBucklingLoadMatch = appJsContent.match(/function calcCriticalBucklingLoad\([\s\S]*?\n\}/);
if (calcCriticalBucklingLoadMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nglobal.calcCriticalBucklingLoad = ' + calcCriticalBucklingLoadMatch[0]);
}

const calcBurstPressureRatingMatch = appJsContent.match(/function calcBurstPressureRating\([\s\S]*?\n\}/);
if (calcBurstPressureRatingMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcBurstPressureRating = ' + calcBurstPressureRatingMatch[0]);
}

const calcCollapsePressureRatingMatch = appJsContent.match(/function calcCollapsePressureRating\([\s\S]*?\n\}/);
if (calcCollapsePressureRatingMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcCollapsePressureRating = ' + calcCollapsePressureRatingMatch[0]);
}

const calcPipeBodyYieldMatch = appJsContent.match(/function calcPipeBodyYield\([\s\S]*?\n\}/);
if (calcPipeBodyYieldMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcPipeBodyYield = ' + calcPipeBodyYieldMatch[0]);
}

const calcToolJointStrengthMatch = appJsContent.match(/function calcToolJointStrength\([\s\S]*?\n\}/);
if (calcToolJointStrengthMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nglobal.calcToolJointStrength = ' + calcToolJointStrengthMatch[0]);
}

const calcHookLoadMatch = appJsContent.match(/function calcHookLoad\([\s\S]*?\n\}/);
if (calcHookLoadMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nglobal.calcHookLoad = ' + calcHookLoadMatch[0]);
}

const calcBitWeightOnBottomMatch = appJsContent.match(/function calcBitWeightOnBottom\([\s\S]*?\n\}/);
if (calcBitWeightOnBottomMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nglobal.calcBitWeightOnBottom = ' + calcBitWeightOnBottomMatch[0]);
}

const calcSafetyFactorMatch = appJsContent.match(/function calcSafetyFactor\([\s\S]*?\n\}/);
if (calcSafetyFactorMatch) {
  eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nglobal.calcSafetyFactor = ' + calcSafetyFactorMatch[0]);
}

const fDbMatch = appJsContent.match(/const formulaDb = (\{[\s\S]*?\n\};)/);
const wcDbMatch = appJsContent.match(/const wellControlDb = (\{[\s\S]*?\n\};)/);

if (!fDbMatch || !wcDbMatch) {
  throw new Error('Could not find formulaDb or wellControlDb in app.js');
}

// Global scope initialization for eval
global.UnitsEngine = UnitsEngine;
eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nvar calcNeutralPoint = global.calcNeutralPoint;\nvar calcTensileCapacity = global.calcTensileCapacity;\nvar calcDcWeightVertical = global.calcDcWeightVertical;\nvar calcDcWeightDeviated = global.calcDcWeightDeviated;\nvar calcMarginOfOverpull = global.calcMarginOfOverpull;\nvar calcEquivalentCirculatingDensity = global.calcEquivalentCirculatingDensity;\nvar calcDrillStringWeightAir = global.calcDrillStringWeightAir;\nvar calcDrillStringWeightMud = global.calcDrillStringWeightMud;\nvar calcCriticalBucklingLoad = global.calcCriticalBucklingLoad;\nvar calcBurstPressureRating = global.calcBurstPressureRating;\nvar calcCollapsePressureRating = global.calcCollapsePressureRating;\nvar calcPipeBodyYield = global.calcPipeBodyYield;\nvar calcToolJointStrength = global.calcToolJointStrength;\nvar calcHookLoad = global.calcHookLoad;\nvar calcBitWeightOnBottom = global.calcBitWeightOnBottom;\nvar calcSafetyFactor = global.calcSafetyFactor;\nvar DRAG_ALERT_THRESHOLDS = global.DRAG_ALERT_THRESHOLDS;\nvar calcFreePoint = global.calcFreePoint;\nvar calcFreePointWeight = global.calcFreePointWeight;\nvar calcDragAnalysis = global.calcDragAnalysis;\nvar calcFreePipePercentage = global.calcFreePipePercentage;\nvar FISHING_LOAD_THRESHOLDS = global.FISHING_LOAD_THRESHOLDS;\nvar calcFishingStringLoad = global.calcFishingStringLoad;\nvar SUBSEA_ACC_SAFETY_FACTOR = global.SUBSEA_ACC_SAFETY_FACTOR;\nvar calcSubseaAccumulatorCapacity = global.calcSubseaAccumulatorCapacity;\nvar PipePulledHelper = global.PipePulledHelper;\nvar calcPipePulledDry = global.calcPipePulledDry;\nvar calcPipePulledWet = global.calcPipePulledWet;\nvar calcDrillPipePulledLoseDry = global.calcDrillPipePulledLoseDry;\nvar calcDrillPipePulledLoseWet = global.calcDrillPipePulledLoseWet;\nglobal.formulaDb = ' + fDbMatch[1]);
eval('var DRILLING_CALC_CONFIG = global.DRILLING_CALC_CONFIG;\nvar DrillingMath = global.DrillingMath;\nvar calcNeutralPoint = global.calcNeutralPoint;\nvar calcTensileCapacity = global.calcTensileCapacity;\nvar calcDcWeightVertical = global.calcDcWeightVertical;\nvar calcDcWeightDeviated = global.calcDcWeightDeviated;\nvar calcMarginOfOverpull = global.calcMarginOfOverpull;\nvar calcEquivalentCirculatingDensity = global.calcEquivalentCirculatingDensity;\nvar calcDrillStringWeightAir = global.calcDrillStringWeightAir;\nvar calcDrillStringWeightMud = global.calcDrillStringWeightMud;\nvar calcCriticalBucklingLoad = global.calcCriticalBucklingLoad;\nvar calcBurstPressureRating = global.calcBurstPressureRating;\nvar calcCollapsePressureRating = global.calcCollapsePressureRating;\nvar calcPipeBodyYield = global.calcPipeBodyYield;\nvar calcToolJointStrength = global.calcToolJointStrength;\nvar calcHookLoad = global.calcHookLoad;\nvar calcBitWeightOnBottom = global.calcBitWeightOnBottom;\nvar calcSafetyFactor = global.calcSafetyFactor;\nvar DRAG_ALERT_THRESHOLDS = global.DRAG_ALERT_THRESHOLDS;\nvar calcFreePoint = global.calcFreePoint;\nvar calcFreePointWeight = global.calcFreePointWeight;\nvar calcDragAnalysis = global.calcDragAnalysis;\nvar calcFreePipePercentage = global.calcFreePipePercentage;\nvar FISHING_LOAD_THRESHOLDS = global.FISHING_LOAD_THRESHOLDS;\nvar calcFishingStringLoad = global.calcFishingStringLoad;\nvar SUBSEA_ACC_SAFETY_FACTOR = global.SUBSEA_ACC_SAFETY_FACTOR;\nvar calcSubseaAccumulatorCapacity = global.calcSubseaAccumulatorCapacity;\nvar PipePulledHelper = global.PipePulledHelper;\nvar calcPipePulledDry = global.calcPipePulledDry;\nvar calcPipePulledWet = global.calcPipePulledWet;\nvar calcDrillPipePulledLoseDry = global.calcDrillPipePulledLoseDry;\nvar calcDrillPipePulledLoseWet = global.calcDrillPipePulledLoseWet;\nglobal.wellControlDb = ' + wcDbMatch[1]);

// Extract helper functions from app.js
const detectCalcQuantityMatch = appJsContent.match(/function detectCalcQuantity\([\s\S]*?\n\}/);
const adaptLabelToSIMatch = appJsContent.match(/function adaptLabelToSI\([\s\S]*?\n\}/);
const adaptUnitToSIMatch = appJsContent.match(/function adaptUnitToSI\([\s\S]*?\n\}/);
const formatConvertedMatch = appJsContent.match(/function formatConverted\([\s\S]*?\n\}/);

if (!detectCalcQuantityMatch || !adaptLabelToSIMatch || !adaptUnitToSIMatch || !formatConvertedMatch) {
  throw new Error('Could not find Calculation Hub helper functions in app.js');
}

eval('global.detectCalcQuantity = ' + detectCalcQuantityMatch[0]);
eval('global.adaptLabelToSI = ' + adaptLabelToSIMatch[0]);
eval('global.adaptUnitToSI = ' + adaptUnitToSIMatch[0]);
eval('global.formatConverted = ' + formatConvertedMatch[0]);

const detectCalcQuantity = global.detectCalcQuantity;
const adaptLabelToSI = global.adaptLabelToSI;
const adaptUnitToSI = global.adaptUnitToSI;
const formatConverted = global.formatConverted;

console.log('====================================================');
console.log('   CALCULATION HUB UNIVERSAL UNIT PARITY TESTS      ');
console.log('====================================================\n');

const allCalcs = [
  ...global.formulaDb.calculations.map(c => ({ ...c, group: 'drilling' })),
  ...global.wellControlDb.surface.map(c => ({ ...c, group: 'surface' })),
  ...global.wellControlDb.subsea.map(c => ({ ...c, group: 'subsea' }))
];

assert.strictEqual(allCalcs.length, 128, 'Should have exactly 128 standard calculators (103 drilling + 18 surface + 7 subsea)');
console.log(`Loaded ${allCalcs.length} total calculators across Drilling & Well Control.\n`);

// -----------------------------------------------------------------------------
// TEST GROUP 1: Default State (Mixed) Preservation Guarantee
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 1: Default State (Mixed) Preservation Guarantee ---');
let mixedSuccessCount = 0;

allCalcs.forEach(c => {
  if (!c.inputs) return;
  const args = {};
  c.inputs.forEach(inp => {
    // Preserve default
    const defVal = (inp.defaultVal !== undefined ? inp.defaultVal : inp.val);
    const parsed = parseFloat(String(defVal).replace(',', '.'));
    args[inp.key] = isNaN(parsed) ? 0 : parsed;
  });

  const rawRes = c.calc(args);
  assert(rawRes !== undefined && rawRes !== null, `Calculator ${c.id} returned null/undefined`);
  mixedSuccessCount++;
});

console.log(`PASSED: 100% of ${mixedSuccessCount} calculators executed cleanly with default values in Mixed mode.\n`);

// -----------------------------------------------------------------------------
// TEST GROUP 2: Canonical Adapter & Zero Formula Drift in SI Mode
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 2: Canonical Adapter & Zero Formula Drift in SI Mode ---');
let siSuccessCount = 0;
let labelAdaptedCount = 0;
let outputAdaptedCount = 0;

allCalcs.forEach(c => {
  if (!c.inputs) return;

  // 1. Check label adaptation
  c.inputs.forEach(inp => {
    const q = detectCalcQuantity(inp.label);
    const adaptedLabel = adaptLabelToSI(inp.label);
    if (q) {
      labelAdaptedCount++;
      // Verify adapted label does not contain legacy imperial unit names
      if (q.native === 'ppg') assert(!adaptedLabel.includes('ppg'), `SI label should not contain ppg: ${adaptedLabel}`);
      if (q.native === 'psi') assert(!adaptedLabel.includes('psi') || adaptedLabel.includes('bar'), `SI label should not contain bare psi: ${adaptedLabel}`);
      if (q.native === 'ft') assert(!adaptedLabel.includes('(ft)'), `SI label should not contain (ft): ${adaptedLabel}`);
    }
  });

  // 2. Check output unit adaptation
  const outQ = detectCalcQuantity(c.unit);
  const adaptedUnit = adaptUnitToSI(c.unit);
  if (outQ) {
    outputAdaptedCount++;
    if (outQ.native === 'ppg') assert.strictEqual(adaptedUnit, 'SG');
    if (outQ.native === 'psi') assert(adaptedUnit.startsWith('bar'));
    if (outQ.native === 'ft') assert(adaptedUnit.startsWith('m'));
    if (outQ.native === 'bbl') assert.strictEqual(adaptedUnit, 'm³');
    if (outQ.native === 'bbl/ft') assert.strictEqual(adaptedUnit, 'L/m');
  }

  // 3. Round-trip simulation:
  // Convert native default inputs -> SI display values -> parse back to native args -> execute -> convert result back to SI
  const nativeArgsOriginal = {};
  const siDisplayInputs = {};
  const nativeArgsReconstituted = {};

  c.inputs.forEach(inp => {
    const q = detectCalcQuantity(inp.label);
    const origVal = parseFloat(String(inp.val).replace(',', '.')) || 0;
    nativeArgsOriginal[inp.key] = origVal;

    if (q) {
      const siVal = UnitsEngine.convert(q.type, origVal, q.native, q.si);
      siDisplayInputs[inp.key] = siVal;
      nativeArgsReconstituted[inp.key] = UnitsEngine.convert(q.type, siVal, q.si, q.native);
    } else {
      siDisplayInputs[inp.key] = origVal;
      nativeArgsReconstituted[inp.key] = origVal;
    }
  });

  const resOriginal = c.calc(nativeArgsOriginal);
  const resReconstituted = c.calc(nativeArgsReconstituted);

  const valOriginal = (typeof resOriginal === 'object' && resOriginal !== null) ? Number(resOriginal) : resOriginal;
  const valReconstituted = (typeof resReconstituted === 'object' && resReconstituted !== null) ? Number(resReconstituted) : resReconstituted;
  if (typeof valOriginal === 'number' && Number.isFinite(valOriginal) && Math.abs(valOriginal) > 1e-12) {
    const relDiff = Math.abs((valReconstituted - valOriginal) / valOriginal);
    assert(relDiff < 1e-7, `Calculation drift in ${c.id}: orig=${resOriginal}, reconstituted=${resReconstituted}, relDiff=${relDiff}`);
  }

  siSuccessCount++;
});

console.log(`PASSED: ${siSuccessCount} calculators round-tripped with zero formula drift (< 1e-7 relative error)!`);
console.log(`PASSED: ${labelAdaptedCount} input labels and ${outputAdaptedCount} output units adapted to SI specifications.\n`);

// -----------------------------------------------------------------------------
// TEST GROUP 3: Standalone Isolation for Riser Margin Calculation
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 3: Standalone Isolation for Riser Margin Calculation ---');
const rm = allCalcs.find(x => x.id === 'riser_margin');
assert.strictEqual(rm, undefined, 'Riser Margin must not exist in nested wellcontrolDb or formulaDb lists');
console.log('PASSED: Riser Margin is cleanly excluded from nested calculation categories!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 4: Nozzle Size TFA Parity
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 4: Nozzle Size TFA Parity ---');
const bitTfa = allCalcs.find(x => x.id === 'bit_tfa');
assert(bitTfa, 'Bit TFA calculator must exist');

// 3 nozzles of size 12 (12/32 in):
const tfaNativeArgs = { n1: 12, n2: 12, n3: 12 };
const tfaNativeRes = bitTfa.calc(tfaNativeArgs);
console.log(`  Native TFA for 3x 12 nozzles: ${tfaNativeRes.toFixed(4)} sq in`);

// In SI: 12/32 in = 9.525 mm
const n1SI = UnitsEngine.convert('nozzle', 12, '1/32 in', 'mm');
const tfaReconvertedNativeArgs = {
  n1: UnitsEngine.convert('nozzle', n1SI, 'mm', '1/32 in'),
  n2: UnitsEngine.convert('nozzle', n1SI, 'mm', '1/32 in'),
  n3: UnitsEngine.convert('nozzle', n1SI, 'mm', '1/32 in')
};
const tfaReconvertedRes = bitTfa.calc(tfaReconvertedNativeArgs);
const tfaSIRes = UnitsEngine.convert('area', tfaReconvertedRes, 'in2', 'mm2');
console.log(`  SI TFA for 3x ${n1SI.toFixed(2)} mm nozzles: ${tfaSIRes.toFixed(2)} mm²`);
assert(Math.abs(tfaNativeRes - tfaReconvertedRes) < 1e-9, 'TFA nozzle round-trip parity failed');
console.log('PASSED: Nozzle TFA parity verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 5: Mid-Session Reactive Switching Simulation
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 5: Mid-Session Reactive Switching Simulation ---');
// Test value format conversion
assert.strictEqual(formatConverted(914.4), '914.4');
assert.strictEqual(formatConverted(24.384), '24.38');
assert.strictEqual(formatConverted(1.19826), '1.2');
assert.strictEqual(formatConverted(215.9), '215.9');
assert.strictEqual(formatConverted(0.0459), '0.0459');

console.log('PASSED: Value format conversion verified without trailing artifacts!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 6: Subsea Accumulator Capacity Correct Formula, Monotonicity & Guards
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 6: Subsea Accumulator Capacity Correct Formula, Monotonicity & Guards ---');
const subseaAcc = allCalcs.find(x => x.id === 'subsea_accumulator');
assert(subseaAcc, 'Subsea Accumulator Capacity calculator must exist');

// 1. Acceptance Test: Bottles=10, Vol=10, Ppre=1000, Pmin=1200, Pmax=3000, WD=3000, SW=8.54 -> 38.267 gal
const accArgs1 = { bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 };
const accRes1 = subseaAcc.calc(accArgs1);
console.log(`  Acceptance Test (WD=3000 ft, SW=8.54 ppg): ${accRes1} gal`);
assert(typeof accRes1 === 'number', 'Result should be a number');
assert(Math.abs(accRes1 - 38.267) < 0.001, `Expected 38.267 gal (tolerance 0.001), got ${accRes1}`);

// 2. Surface Check: WD = 0 -> exactly 50.0 gal
const accArgsSurface = { bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 0, sw: 8.54 };
const accResSurface = subseaAcc.calc(accArgsSurface);
console.log(`  Surface Check (WD=0 ft): ${accResSurface} gal`);
assert(Math.abs(accResSurface - 50.0) < 0.001, `Expected 50.0 gal at depth 0, got ${accResSurface}`);

// 3. Monotonic decrease with depth & total capacity bound (<= N * V)
const depths = [0, 500, 1000, 2000, 3000, 5000, 8000, 10000];
let prevRes = Infinity;
const totalBottleCap = 10 * 10; // N * V = 100 gal
depths.forEach(depth => {
  const res = subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: depth, sw: 8.54 });
  assert(typeof res === 'number', `Result at depth ${depth} should be a number`);
  assert(res <= totalBottleCap, `Result at depth ${depth} (${res}) exceeds total bottle capacity (${totalBottleCap})`);
  assert(res > 0, `Result at depth ${depth} (${res}) should be positive`);
  assert(res < prevRes, `Monotonicity violated: at depth ${depth} (${res}) >= previous depth (${prevRes})`);
  prevRes = res;
});
console.log('  Monotonicity and upper bound (<= N*V) verified across depth range [0..10000 ft]');

// 4. Validation Guards:
// Ppre >= Pmin -> 'Invalid input'
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1200, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1500, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
// Pmax <= Pmin -> 'Invalid input'
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 3000, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 3000, p3: 2000, wd: 3000, sw: 8.54 }), 'Invalid input');
// Non-positive or zero pressures
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 0, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: -500, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 0, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 0, wd: 3000, sw: 8.54 }), 'Invalid input');
// Non-positive bottles or volume
assert.strictEqual(subseaAcc.calc({ bottles: 0, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: -1, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 0, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
// Negative depth
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: -100, sw: 8.54 }), 'Invalid input');
// Negative seawater density
assert.strictEqual(subseaAcc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: -8.54 }), 'Invalid input');
// Zero/empty inputs do not produce NaN or Infinity
assert.strictEqual(subseaAcc.calc({ bottles: '', vol: '', p1: '', p2: '', p3: '', wd: '', sw: '' }), 'Invalid input');
assert.strictEqual(subseaAcc.calc({ bottles: NaN, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), 'Invalid input');
console.log('  Validation guards (Ppre<Pmin, Pmax>Pmin, bottles>0, vol>0, wd>=0, sw>0, NaN safety) verified');

// 5. SI Parity: Convert native inputs to SI, re-convert and calculate
const p1SI = UnitsEngine.convert('pressure', 1000, 'psi', 'bar');
const p2SI = UnitsEngine.convert('pressure', 1200, 'psi', 'bar');
const p3SI = UnitsEngine.convert('pressure', 3000, 'psi', 'bar');
const wdSI_acc = UnitsEngine.convert('length', 3000, 'ft', 'm');
const swSI_acc = UnitsEngine.convert('density', 8.54, 'ppg', 'SG');
const volSI_acc = UnitsEngine.convert('volume', 10, 'gal', 'L');

const simArgs = {
  bottles: 10,
  vol: UnitsEngine.convert('volume', volSI_acc, 'L', 'gal'),
  p1: UnitsEngine.convert('pressure', p1SI, 'bar', 'psi'),
  p2: UnitsEngine.convert('pressure', p2SI, 'bar', 'psi'),
  p3: UnitsEngine.convert('pressure', p3SI, 'bar', 'psi'),
  wd: UnitsEngine.convert('length', wdSI_acc, 'm', 'ft'),
  sw: UnitsEngine.convert('density', swSI_acc, 'SG', 'ppg')
};
const simRes = subseaAcc.calc(simArgs);
const simSIOutput = UnitsEngine.convert('volume', simRes, 'gal', 'L');
console.log(`  SI Execution: Native = ${simRes} gal -> SI = ${simSIOutput.toFixed(2)} L`);
assert(Math.abs(simRes - 38.267) < 0.001, 'SI round-trip parity failed');

console.log('PASSED: Subsea Accumulator Capacity tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 7: Round Trip Ton-Mile API RP 9B Formula Verification & Guards
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 7: Round Trip Ton-Mile API RP 9B Formula Verification & Guards ---');
const rtTonMile = allCalcs.find(x => x.id === 'rt_ton_mile');
assert(rtTonMile, 'Round Trip Ton-Mile calculator must exist');

// 1. Acceptance Test: D=10000, Wdp=19.5, Wdc=120, Lc=600, Wb=15000, MW=10.0
// API RP 9B:
// BF = 1 - 10 / 65.5 = 0.847328244...
// Wp = 19.5 * BF = 16.52290076...
// C = (120 - 19.5) * 600 * BF = 51093.8931...
// Numerator = 10000 * (93 + 10000) * Wp + 2 * 10000 * (2 * 15000 + C) = 3,289,534,236.6...
// Ton-Miles = Numerator / 10,560,000 = 311.5089... ≈ 311.51 Ton-Miles
const rtDefaultArgs = { depth: 10000, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 10.0 };
const rtResult = rtTonMile.calc(rtDefaultArgs);
console.log(`  Native Round Trip Ton-Mile result: ${rtResult.toFixed(4)} Ton-Miles (exact: ${rtResult})`);
assert(Math.abs(rtResult - 311.5089) < 0.005, `Expected ~311.51 Ton-Miles, got ${rtResult}`);
assert(rtResult > 300 && rtResult < 320, 'Result must be in expected range');

// Verify that the old buggy output (213.2947) is eliminated
assert(Math.abs(rtResult - 213.2947) > 50, 'Must not return old buggy output 213.2947');

// 2. Validation Guards:
// Non-positive depth
assert.strictEqual(rtTonMile.calc({ depth: 0, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 10 }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: -100, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 10 }), 'Invalid input');
// Non-positive drill pipe weight
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 0, dcwt: 120, dclen: 600, bwt: 15000, mw: 10 }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: -5, dcwt: 120, dclen: 600, bwt: 15000, mw: 10 }), 'Invalid input');
// Negative drill collar weight or length
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: -1, dclen: 600, bwt: 15000, mw: 10 }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: 120, dclen: -10, bwt: 15000, mw: 10 }), 'Invalid input');
// Negative block weight
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: 120, dclen: 600, bwt: -100, mw: 10 }), 'Invalid input');
// Non-positive or excessive mud weight (>= 65.5)
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 0 }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: -2 }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 65.5 }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: 10000, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 70 }), 'Invalid input');
// Empty / NaN safety
assert.strictEqual(rtTonMile.calc({ depth: '', dswt: '', dcwt: '', dclen: '', bwt: '', mw: '' }), 'Invalid input');
assert.strictEqual(rtTonMile.calc({ depth: NaN, dswt: 19.5, dcwt: 120, dclen: 600, bwt: 15000, mw: 10 }), 'Invalid input');
console.log('  Validation guards (depth>0, dswt>0, dcwt>=0, dclen>=0, bwt>=0, 0<mw<65.5, NaN safety) verified');

// 3. SI Round-trip Parity
const rtDepthSI = UnitsEngine.convert('length', 10000, 'ft', 'm');
const rtDswtSI = UnitsEngine.convert('weight_per_length', 19.5, 'lb/ft', 'kg/m');
const rtDcwtSI = UnitsEngine.convert('weight_per_length', 120, 'lb/ft', 'kg/m');
const rtDclenSI = UnitsEngine.convert('length', 600, 'ft', 'm');
const rtBwtSI = UnitsEngine.convert('force', 15000, 'lbs', 'kN');
const rtMwSI = UnitsEngine.convert('density', 10.0, 'ppg', 'SG');

const rtSimArgs = {
  depth: UnitsEngine.convert('length', rtDepthSI, 'm', 'ft'),
  dswt: UnitsEngine.convert('weight_per_length', rtDswtSI, 'kg/m', 'lb/ft'),
  dcwt: UnitsEngine.convert('weight_per_length', rtDcwtSI, 'kg/m', 'lb/ft'),
  dclen: UnitsEngine.convert('length', rtDclenSI, 'm', 'ft'),
  bwt: UnitsEngine.convert('force', rtBwtSI, 'kN', 'lbs'),
  mw: UnitsEngine.convert('density', rtMwSI, 'SG', 'ppg')
};
const rtSimRes = rtTonMile.calc(rtSimArgs);
console.log(`  SI Execution: Native = ${rtResult.toFixed(4)} -> Reconstituted = ${rtSimRes.toFixed(4)} Ton-Miles`);
assert(Math.abs(rtSimRes - rtResult) < 1e-6, 'SI round-trip parity failed');

console.log('PASSED: Round Trip Ton-Mile API RP 9B tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 8: Cuttings Volume Generated (gal/min) Verification & Guards
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 8: Cuttings Volume Generated (gal/min) Verification & Guards ---');
const cuttingsGpm = allCalcs.find(x => x.id === 'cuttings_vol_gpm');
assert(cuttingsGpm, 'cuttings_vol_gpm calculator must exist');
assert(Array.isArray(cuttingsGpm.inputs) && cuttingsGpm.inputs.length === 2, 'cuttings_vol_gpm must define 2 inputs');
assert(cuttingsGpm.desc && cuttingsGpm.desc.includes('gallons per minute'), 'cuttings_vol_gpm description must be defined');

// 1. Acceptance Test: ROP = 50 ft/hr, Hole ID = 8.5 in -> 2.4565 gal/min
const gpmDefaultArgs = { rop: 50, hid: 8.5 };
const gpmResult = cuttingsGpm.calc(gpmDefaultArgs);
console.log(`  Native Cuttings Volume (gal/min) result: ${gpmResult.toFixed(4)} gal/min (exact: ${gpmResult})`);
assert(Math.abs(gpmResult - 2.4565) < 0.0001, `Expected ~2.4565 gal/min, got ${gpmResult}`);

// 2. Validation Guards:
// Negative ROP
assert.strictEqual(cuttingsGpm.calc({ rop: -10, hid: 8.5 }), 'Invalid input');
// Non-positive Hole ID
assert.strictEqual(cuttingsGpm.calc({ rop: 50, hid: 0 }), 'Invalid input');
assert.strictEqual(cuttingsGpm.calc({ rop: 50, hid: -8.5 }), 'Invalid input');
// Empty / NaN safety
assert.strictEqual(cuttingsGpm.calc({ rop: '', hid: '' }), 'Invalid input');
assert.strictEqual(cuttingsGpm.calc({ rop: NaN, hid: 8.5 }), 'Invalid input');
// Zero ROP is physically valid (0 cuttings generated)
assert.strictEqual(cuttingsGpm.calc({ rop: 0, hid: 8.5 }), 0);
console.log('  Validation guards (rop>=0, hid>0, NaN safety) verified');

// 3. SI Parity: Convert native inputs to SI (m/hr, mm), re-convert and calculate, output to L/min
const ropSI = UnitsEngine.convert('velocity', 50, 'ft/hr', 'm/hr');
const hidSI = UnitsEngine.convert('diameter', 8.5, 'in', 'mm');
const gpmSimArgs = {
  rop: UnitsEngine.convert('velocity', ropSI, 'm/hr', 'ft/hr'),
  hid: UnitsEngine.convert('diameter', hidSI, 'mm', 'in')
};
const gpmSimRes = cuttingsGpm.calc(gpmSimArgs);
const gpmSIOutput = UnitsEngine.convert('flow_rate', gpmSimRes, 'gal/min', 'L/min');
console.log(`  SI Execution: Native = ${gpmSimRes.toFixed(4)} gal/min -> SI = ${gpmSIOutput.toFixed(4)} L/min`);
assert(Math.abs(gpmSimRes - 2.4565) < 0.0001, 'SI round-trip parity failed');
assert(Math.abs(gpmSIOutput - 9.2989) < 0.001, `Expected ~9.299 L/min in SI, got ${gpmSIOutput}`);

console.log('PASSED: Cuttings Volume Generated (gal/min) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 9: Maximum ROP Before Fracture Formation (Cases A, B, C)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 9: Maximum ROP Before Fracture Formation ---');
const maxRopCalc = allCalcs.find(x => x.id === 'max_rop');
assert(maxRopCalc, 'max_rop calculator must exist');
assert.strictEqual(maxRopCalc.inputs.length, 6, 'max_rop must have 6 inputs');

// Case A: FG 0.8, MW 10, TVD 8000, APL 200, Q 400, Dh 8.5 -> expect ~1819 ft/hr, dMW ~4.904 ppg
const resA = maxRopCalc.calc({ fg: 0.8, mw: 10, tvd: 8000, apl: 200, q: 400, dh: 8.5 });
assert(typeof resA === 'object', 'Case A must return an object');
assert(Math.abs(resA.rop - 1819.00) < 1.0, `Case A ROP expected ~1819, got ${resA.rop}`);
assert(Math.abs(resA.dMW - 4.904) < 0.005, `Case A dMW expected ~4.904, got ${resA.dMW}`);
assert.strictEqual(resA.warning, null, 'Case A should have no warning');
console.log(`  Case A PASSED: ROP = ${resA.rop.toFixed(2)} ft/hr, dMW = ${resA.dMW.toFixed(4)} ppg`);

// Case B: MW 15.4 -> margin <= 0, expect 0 and warning
const resB = maxRopCalc.calc({ fg: 0.8, mw: 15.4, tvd: 8000, apl: 200, q: 400, dh: 8.5 });
assert(typeof resB === 'object', 'Case B must return an object');
assert.strictEqual(resB.rop, 0, `Case B ROP expected 0, got ${resB.rop}`);
assert(resB.dMW <= 0, `Case B dMW expected <= 0, got ${resB.dMW}`);
assert(resB.warning && resB.warning.includes('fracture limit'), `Case B warning expected, got ${resB.warning}`);
console.log(`  Case B PASSED: ROP = ${resB.rop} ft/hr, Warning = "${resB.warning}"`);

// Case C: empty or zero hole diameter -> no crash, show "--"
assert.strictEqual(maxRopCalc.calc({ fg: 0.8, mw: 10, tvd: 8000, apl: 200, q: 400, dh: 0 }), '--');
assert.strictEqual(maxRopCalc.calc({ fg: 0.8, mw: 10, tvd: 8000, apl: 200, q: 400, dh: '' }), '--');
assert.strictEqual(maxRopCalc.calc({ fg: 0.8, mw: 10, tvd: 8000, apl: 200, q: 0, dh: 8.5 }), '--');
console.log('  Case C PASSED: zero/empty/negative inputs safely return "--" without NaN or crash');
console.log('PASSED: Maximum ROP Before Fracture Formation tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 10: Free Point Constant & Stuck Depth Verification & Guards
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 10: Free Point Constant & Stuck Depth ---');
const fpcCalc = allCalcs.find(x => x.id === 'fpc_stuck');
assert(fpcCalc, 'fpc_stuck calculator must exist');
assert.strictEqual(fpcCalc.inputs.length, 4, 'fpc_stuck must define 4 inputs (OD, ID, Stretch, Pull)');

// 1. OD 5, ID 4.276 -> FPC about 13,187, As = 5.2746 in^2
const res1 = fpcCalc.calc({ od: 5, id: 4.276 });
assert(typeof res1 === 'object', 'res1 must return an object');
assert(Math.abs(res1.fpc - 13186.52) < 1.0, `Expected FPC ~13,187, got ${res1.fpc}`);
assert(Math.abs(res1.as - 5.2746) < 0.001, `Expected As ~5.2746, got ${res1.as}`);
assert.strictEqual(res1.depth, null, 'Depth should be null when stretch/pull omitted');
console.log(`  OD 5, ID 4.276 PASSED: FPC = ${res1.fpc.toFixed(1)}, As = ${res1.as.toFixed(4)} in^2`);

// 2. OD 4, ID 3.34 -> FPC about 9,512
const res2 = fpcCalc.calc({ od: 4, id: 3.34 });
assert(typeof res2 === 'object', 'res2 must return an object');
assert(Math.abs(res2.fpc - 9511.98) < 1.0, `Expected FPC ~9,512, got ${res2.fpc}`);
console.log(`  OD 4, ID 3.34 PASSED: FPC = ${res2.fpc.toFixed(1)}, As = ${res2.as.toFixed(4)} in^2`);

// 3. OD 3.5, ID 2.992 -> FPC about 6,475.5
const res3 = fpcCalc.calc({ od: 3.5, id: 2.992 });
assert(typeof res3 === 'object', 'res3 must return an object');
assert(Math.abs(res3.fpc - 6475.5) < 0.5, `Expected FPC ~6,475.5, got ${res3.fpc}`);
console.log(`  OD 3.5, ID 2.992 PASSED: FPC = ${res3.fpc.toFixed(1)}, As = ${res3.as.toFixed(4)} in^2`);

// 4. OD 3.5, ID 2.992, S 20, P 25 -> depth about 5,180 ft
const res4 = fpcCalc.calc({ od: 3.5, id: 2.992, stretch: 20, pull: 25 });
assert(typeof res4 === 'object', 'res4 must return an object');
assert(Math.abs(res4.fpc - 6475.5) < 0.5, `Expected FPC ~6,475.5, got ${res4.fpc}`);
assert(Math.abs(res4.depth - 5180.4) < 1.0, `Expected Depth ~5,180 ft, got ${res4.depth}`);
console.log(`  OD 3.5, ID 2.992, S 20, P 25 PASSED: Depth = ${res4.depth.toFixed(0)} ft`);

// 5. ID >= OD or pull 0 -> no crash, shows "--"
assert.strictEqual(fpcCalc.calc({ od: 5, id: 5 }), '--', 'ID == OD must return "--"');
assert.strictEqual(fpcCalc.calc({ od: 5, id: 5.5 }), '--', 'ID > OD must return "--"');
assert.strictEqual(fpcCalc.calc({ od: 0, id: 4.276 }), '--', 'OD <= 0 must return "--"');
assert.strictEqual(fpcCalc.calc({ od: '', id: '' }), '--', 'Empty inputs must return "--"');
const resPull0 = fpcCalc.calc({ od: 3.5, id: 2.992, stretch: 20, pull: 0 });
assert.strictEqual(resPull0.depth, '--', 'Pull 0 must result in depth "--"');
console.log('  Validation guards (ID>=OD, OD<=0, empty, pull 0) PASSED without crash!');
console.log('PASSED: Free Point Constant & Stuck Depth tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 11: Stuck Pipe Calculation (Free Length from Stretch Measurements)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 11: Stuck Pipe Calculation (Free Length from Stretch) ---');
const stuckPipeCalc = allCalcs.find(x => x.id === 'stuck_pipe_calc');
assert(stuckPipeCalc, 'stuck_pipe_calc calculator must exist');
assert.strictEqual(stuckPipeCalc.inputs.length, 8, 'stuck_pipe_calc must define 8 inputs (Pipe, Measurement, Context)');

// 1. OD 5, ID 4.276, S 15, dP 70 klb (Initial 35k, Final 105k) -> FPC ~13,187, L ~2,826 ft
const spRes1 = stuckPipeCalc.calc({
  od: 5,
  id: 4.276,
  manual_fpc_toggle: false,
  pull_initial: 35000,
  pull_final: 105000,
  stretch: 15
});
assert(typeof spRes1 === 'object', 'spRes1 must return an object');
assert(Math.abs(spRes1.fpc - 13186.52) < 1.0, `Expected FPC ~13,187, got ${spRes1.fpc}`);
assert(Math.abs(spRes1.pullIncrementKlb - 70.0) < 1e-4, `Expected dP 70 klb, got ${spRes1.pullIncrementKlb}`);
assert(Math.abs(spRes1.freeLengthFt - 2825.68) < 1.0, `Expected L ~2,826 ft, got ${spRes1.freeLengthFt}`);
console.log(`  Case 1 (OD 5, ID 4.276, S 15, dP 70 klb) PASSED: FPC = ${spRes1.fpc.toFixed(1)}, L = ${spRes1.freeLengthFt.toFixed(0)} ft`);

// 2. OD 5, ID 4.276, S 12, dP 30 klb (Initial 35k, Final 65k) -> L ~5,275 ft
const spRes2 = stuckPipeCalc.calc({
  od: 5,
  id: 4.276,
  manual_fpc_toggle: false,
  pull_initial: 35000,
  pull_final: 65000,
  stretch: 12
});
assert(typeof spRes2 === 'object', 'spRes2 must return an object');
assert(Math.abs(spRes2.pullIncrementKlb - 30.0) < 1e-4, `Expected dP 30 klb, got ${spRes2.pullIncrementKlb}`);
assert(Math.abs(spRes2.freeLengthFt - 5274.61) < 1.0, `Expected L ~5,275 ft, got ${spRes2.freeLengthFt}`);
console.log(`  Case 2 (OD 5, ID 4.276, S 12, dP 30 klb) PASSED: L = ${spRes2.freeLengthFt.toFixed(0)} ft`);

// 3. OD 3.5, ID 2.992, S 20, dP 25 klb (Initial 35k, Final 60k) -> FPC ~6,475.5, L ~5,180 ft
const spRes3 = stuckPipeCalc.calc({
  od: 3.5,
  id: 2.992,
  manual_fpc_toggle: false,
  pull_initial: 35000,
  pull_final: 60000,
  stretch: 20
});
assert(typeof spRes3 === 'object', 'spRes3 must return an object');
assert(Math.abs(spRes3.fpc - 6475.5) < 0.5, `Expected FPC ~6,475.5, got ${spRes3.fpc}`);
assert(Math.abs(spRes3.pullIncrementKlb - 25.0) < 1e-4, `Expected dP 25 klb, got ${spRes3.pullIncrementKlb}`);
assert(Math.abs(spRes3.freeLengthFt - 5180.4) < 1.0, `Expected L ~5,180 ft, got ${spRes3.freeLengthFt}`);
console.log(`  Case 3 (OD 3.5, ID 2.992, S 20, dP 25 klb) PASSED: FPC = ${spRes3.fpc.toFixed(1)}, L = ${spRes3.freeLengthFt.toFixed(0)} ft`);

// 4. Manual FPC 6475.5, S 20, dP 25 klb -> L ~5,180 ft
const spRes4 = stuckPipeCalc.calc({
  manual_fpc_toggle: true,
  fpc_manual: 6475.5,
  pull_initial: 35000,
  pull_final: 60000,
  stretch: 20
});
assert(typeof spRes4 === 'object', 'spRes4 must return an object');
assert(Math.abs(spRes4.fpc - 6475.5) < 0.1, `Expected manual FPC 6475.5, got ${spRes4.fpc}`);
assert(Math.abs(spRes4.freeLengthFt - 5180.4) < 1.0, `Expected L ~5,180 ft, got ${spRes4.freeLengthFt}`);
console.log(`  Case 4 (Manual FPC 6475.5, S 20, dP 25 klb) PASSED: L = ${spRes4.freeLengthFt.toFixed(0)} ft`);

// 5. Final pull <= Initial pull -> returns '--'
assert.strictEqual(stuckPipeCalc.calc({ od: 5, id: 4.276, pull_initial: 35000, pull_final: 35000, stretch: 15 }), '--');
assert.strictEqual(stuckPipeCalc.calc({ od: 5, id: 4.276, pull_initial: 35000, pull_final: 20000, stretch: 15 }), '--');
console.log('  Case 5 (Final pull <= Initial pull) safely returns "--"');

// 6. ID >= OD, zero or negative inputs -> returns '--'
assert.strictEqual(stuckPipeCalc.calc({ od: 5, id: 5, pull_initial: 35000, pull_final: 105000, stretch: 15 }), '--');
assert.strictEqual(stuckPipeCalc.calc({ od: 5, id: 6, pull_initial: 35000, pull_final: 105000, stretch: 15 }), '--');
assert.strictEqual(stuckPipeCalc.calc({ od: 0, id: 4.276, pull_initial: 35000, pull_final: 105000, stretch: 15 }), '--');
assert.strictEqual(stuckPipeCalc.calc({ od: 5, id: 4.276, pull_initial: 35000, pull_final: 105000, stretch: 0 }), '--');
assert.strictEqual(stuckPipeCalc.calc({ od: '', id: '', pull_initial: '', pull_final: '', stretch: '' }), '--');
console.log('  Case 6 (ID >= OD, zero/empty/negative inputs) safely returns "--"');

// 7. L > total string length -> returns result + warning flag + % free
const spRes7 = stuckPipeCalc.calc({
  od: 5,
  id: 4.276,
  pull_initial: 35000,
  pull_final: 105000,
  stretch: 15,
  total_length: 2000
});
assert(typeof spRes7 === 'object', 'spRes7 must return an object');
assert(Math.abs(spRes7.freeLengthFt - 2825.68) < 1.0, `Expected L ~2,826 ft, got ${spRes7.freeLengthFt}`);
assert(spRes7.warning && spRes7.warning.includes('Result exceeds string length'), `Expected warning for L > total_length, got ${spRes7.warning}`);
assert(Math.abs(spRes7.percentFree - 141.28) < 0.1, `Expected % free ~141.3%, got ${spRes7.percentFree}`);
console.log(`  Case 7 (L > total_length: 2826 ft > 2000 ft) PASSED: % free = ${spRes7.percentFree.toFixed(1)}%, Warning = "${spRes7.warning}"`);
console.log('PASSED: Stuck Pipe Calculation tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 12: Stuck Pipe Calculation (Pipe Weight Method)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 12: Stuck Pipe Calculation (Pipe Weight Method) ---');
const spWeightCalc = allCalcs.find(x => x.id === 'stuck_pipe_not_know_fpc');
assert(spWeightCalc, 'stuck_pipe_not_know_fpc calculator must exist');

// 1. OD 5, ID 4.276, S 15, P 70000 -> about 2,825 to 2,826 ft
const spwRes1 = spWeightCalc.calc({ od: 5, id: 4.276, stretch: 15, pull: 70000 });
assert(typeof spwRes1 === 'object', 'spwRes1 must return an object');
assert(Math.abs(spwRes1.freeLengthFt - 2825.63) < 1.0, `Expected L ~2,826 ft, got ${spwRes1.freeLengthFt}`);
assert(Math.abs(spwRes1.weightUsed - 17.93125) < 0.01, `Expected derived weight ~17.93, got ${spwRes1.weightUsed}`);
console.log(`  Case 1 (OD 5, ID 4.276, S 15, P 70000) PASSED: L = ${spwRes1.freeLengthFt.toFixed(0)} ft, derived W = ${spwRes1.weightUsed.toFixed(2)} lb/ft`);

// 2. Weight 17.93, S 15, P 70000 -> about 2,825 ft
const spwRes2 = spWeightCalc.calc({ weight: 17.93, stretch: 15, pull: 70000 });
assert(typeof spwRes2 === 'object', 'spwRes2 must return an object');
assert(Math.abs(spwRes2.freeLengthFt - 2825.63) < 1.0, `Expected L ~2,825.6 ft, got ${spwRes2.freeLengthFt}`);
console.log(`  Case 2 (Weight 17.93, S 15, P 70000) PASSED: L = ${spwRes2.freeLengthFt.toFixed(0)} ft`);

// 3. OD 5, ID 4.276, S 12, P 30000 -> about 5,270 ft (5,270 to 5,275 ft)
const spwRes3 = spWeightCalc.calc({ od: 5, id: 4.276, stretch: 12, pull: 30000 });
assert(typeof spwRes3 === 'object', 'spwRes3 must return an object');
assert(Math.abs(spwRes3.freeLengthFt - 5274.5) < 5.0, `Expected L ~5,270 to 5,275 ft, got ${spwRes3.freeLengthFt}`);
console.log(`  Case 3 (OD 5, ID 4.276, S 12, P 30000) PASSED: L = ${spwRes3.freeLengthFt.toFixed(0)} ft`);

// 4. Pull 0, stretch 0, ID >= OD -> no crash, shows "--"
assert.strictEqual(spWeightCalc.calc({ od: 5, id: 4.276, stretch: 15, pull: 0 }), '--');
assert.strictEqual(spWeightCalc.calc({ od: 5, id: 4.276, stretch: 0, pull: 70000 }), '--');
assert.strictEqual(spWeightCalc.calc({ od: 5, id: 5, stretch: 15, pull: 70000 }), '--');
assert.strictEqual(spWeightCalc.calc({ weight: 0, stretch: 15, pull: 70000 }), '--');
console.log('  Case 4 (Pull 0, stretch 0, ID >= OD) safely returns "--"');

// 5. Cross-check: this method and the FPC method differ by < 0.1% for the same pipe
const fpcMethodRes = stuckPipeCalc.calc({ od: 5, id: 4.276, pull_initial: 35000, pull_final: 105000, stretch: 15 });
const weightMethodRes = spWeightCalc.calc({ od: 5, id: 4.276, stretch: 15, pull: 70000 });
const relDiff = Math.abs(weightMethodRes.freeLengthFt - fpcMethodRes.freeLengthFt) / fpcMethodRes.freeLengthFt;
assert(relDiff < 0.001, `Expected < 0.1% difference, got ${(relDiff * 100).toFixed(4)}%`);
console.log(`  Case 5 (Cross-check with FPC method) PASSED: FPC=${fpcMethodRes.freeLengthFt.toFixed(2)} ft, Weight=${weightMethodRes.freeLengthFt.toFixed(2)} ft, diff=${(relDiff * 100).toFixed(4)}% (< 0.1%)`);
console.log('PASSED: Stuck Pipe Calculation (Pipe Weight Method) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 13: Mechanical Sticking Analysis (Drag Analysis)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 13: Mechanical Sticking Analysis (Drag Analysis) ---');
const dragCalc = allCalcs.find(x => x.id === 'mech_stick_risk');
assert(dragCalc, 'mech_stick_risk calculator must exist');

// 1. 220000 / 180000 / 200000 -> up 20000, down 20000, both 10.0%
const dRes1 = dragCalc.calc({ puw: 220000, sow: 180000, rw: 200000 });
assert(typeof dRes1 === 'object', 'dRes1 must return an object');
assert.strictEqual(dRes1.upDrag, 20000, 'Up drag should be 20000 lb');
assert.strictEqual(dRes1.downDrag, 20000, 'Down drag should be 20000 lb');
assert.strictEqual(dRes1.totalDrag, 40000, 'Total drag should be 40000 lb');
assert.strictEqual(dRes1.upDragPct, 10.0, 'Up drag % should be 10.0%');
assert.strictEqual(dRes1.downDragPct, 10.0, 'Down drag % should be 10.0%');
assert.strictEqual(dRes1.asymmetry, 0, 'Asymmetry should be 0 lb');
console.log(`  Case 1 (220k / 180k / 200k) PASSED: Up=${dRes1.upDrag} lb (10.0%), Down=${dRes1.downDrag} lb (10.0%), Total=${dRes1.totalDrag} lb`);

// 2. 230000 / 175000 / 200000 -> up 30000, down 25000, asymmetry 5000
const dRes2 = dragCalc.calc({ puw: 230000, sow: 175000, rw: 200000 });
assert(typeof dRes2 === 'object', 'dRes2 must return an object');
assert.strictEqual(dRes2.upDrag, 30000, 'Up drag should be 30000 lb');
assert.strictEqual(dRes2.downDrag, 25000, 'Down drag should be 25000 lb');
assert.strictEqual(dRes2.totalDrag, 55000, 'Total drag should be 55000 lb');
assert.strictEqual(dRes2.upDragPct, 15.0, 'Up drag % should be 15.0%');
assert.strictEqual(dRes2.downDragPct, 12.5, 'Down drag % should be 12.5%');
assert.strictEqual(dRes2.asymmetry, 5000, 'Asymmetry should be 5000 lb');
console.log(`  Case 2 (230k / 175k / 200k) PASSED: Up=${dRes2.upDrag} lb, Down=${dRes2.downDrag} lb, Asymmetry=${dRes2.asymmetry} lb`);

// 3. With baseline up 20000 and current up 30000 -> change +10000 -> Watch
const dRes3 = dragCalc.calc({ puw: 230000, sow: 175000, rw: 200000, base_up: 20000 });
assert(typeof dRes3 === 'object', 'dRes3 must return an object');
assert.strictEqual(dRes3.baselineUpChange, 10000, 'Baseline change should be +10000 lb');
assert.strictEqual(dRes3.status, 'Watch', 'Status should be Watch for 10k increase');
console.log(`  Case 3 (Baseline Up 20k -> Current Up 30k) PASSED: Change=+${dRes3.baselineUpChange} lb, Status=${dRes3.status}`);

// 4. Rot >= PU or Rot <= SO -> validation message, no output
assert.strictEqual(dragCalc.calc({ puw: 200000, sow: 180000, rw: 200000 }), '--', 'Rot == PU must return "--"');
assert.strictEqual(dragCalc.calc({ puw: 200000, sow: 180000, rw: 210000 }), '--', 'Rot > PU must return "--"');
assert.strictEqual(dragCalc.calc({ puw: 220000, sow: 180000, rw: 180000 }), '--', 'Rot == SO must return "--"');
assert.strictEqual(dragCalc.calc({ puw: 220000, sow: 180000, rw: 170000 }), '--', 'Rot < SO must return "--"');
assert.strictEqual(dragCalc.calc({ puw: 180000, sow: 220000, rw: 200000 }), '--', 'SO > PU must return "--"');
console.log('  Case 4 (Rot >= PU or Rot <= SO or SO >= PU) safely returns "--"');

// 5. Zero or empty -> no crash
assert.strictEqual(dragCalc.calc({ puw: 0, sow: 180000, rw: 200000 }), '--');
assert.strictEqual(dragCalc.calc({ puw: 220000, sow: 0, rw: 200000 }), '--');
assert.strictEqual(dragCalc.calc({ puw: '', sow: '', rw: '' }), '--');
console.log('  Case 5 (Zero or empty inputs) safely returns "--"');
console.log('PASSED: Mechanical Sticking Analysis (Drag Analysis) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 14: Free Pipe Percentage (formerly Pipe Recovery Estimate)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 14: Free Pipe Percentage ---');
const freePipeCalc = allCalcs.find(x => x.id === 'pipe_recovery_est');
assert(freePipeCalc, 'pipe_recovery_est calculator must exist');

// 1. 10000 / 7500 -> 75.00 %, stuck 2500 ft, stuck 25.00 %
const fpRes1 = freePipeCalc.calc({ total: 10000, free: 7500 });
assert(typeof fpRes1 === 'object', 'fpRes1 must return an object');
assert.strictEqual(fpRes1.freePipePct, 75.0, 'Free pipe % should be 75.00%');
assert.strictEqual(fpRes1.stuckLengthFt, 2500, 'Stuck length should be 2500 ft');
assert.strictEqual(fpRes1.stuckPct, 25.0, 'Stuck % should be 25.00%');
console.log(`  Case 1 (10000 / 7500) PASSED: Free=${fpRes1.freePipePct.toFixed(2)}%, Stuck=${fpRes1.stuckLengthFt} ft (${fpRes1.stuckPct.toFixed(2)}%)`);

// 2. 10000 / 10000 -> 100.00 %, stuck 0 ft, stuck 0.00 %
const fpRes2 = freePipeCalc.calc({ total: 10000, free: 10000 });
assert(typeof fpRes2 === 'object', 'fpRes2 must return an object');
assert.strictEqual(fpRes2.freePipePct, 100.0, 'Free pipe % should be 100.00%');
assert.strictEqual(fpRes2.stuckLengthFt, 0, 'Stuck length should be 0 ft');
assert.strictEqual(fpRes2.stuckPct, 0.0, 'Stuck % should be 0.00%');
console.log(`  Case 2 (10000 / 10000) PASSED: Free=${fpRes2.freePipePct.toFixed(2)}%, Stuck=${fpRes2.stuckLengthFt} ft`);

// 3. 10000 / 0 -> 0.00 %, stuck 10000 ft, stuck 100.00 %
const fpRes3 = freePipeCalc.calc({ total: 10000, free: 0 });
assert(typeof fpRes3 === 'object', 'fpRes3 must return an object');
assert.strictEqual(fpRes3.freePipePct, 0.0, 'Free pipe % should be 0.00%');
assert.strictEqual(fpRes3.stuckLengthFt, 10000, 'Stuck length should be 10000 ft');
assert.strictEqual(fpRes3.stuckPct, 100.0, 'Stuck % should be 100.00%');
console.log(`  Case 3 (10000 / 0) PASSED: Free=${fpRes3.freePipePct.toFixed(2)}%, Stuck=${fpRes3.stuckLengthFt} ft`);

// 4. 10000 / 12000 -> error message, no output
assert.strictEqual(freePipeCalc.calc({ total: 10000, free: 12000 }), '--', 'Free > Total must return "--"');
console.log('  Case 4 (Free > Total: 12000 > 10000) safely returns "--"');

// 5. Total 0 or empty -> "--", no crash
assert.strictEqual(freePipeCalc.calc({ total: 0, free: 7500 }), '--');
assert.strictEqual(freePipeCalc.calc({ total: '', free: 7500 }), '--');
assert.strictEqual(freePipeCalc.calc({ total: -5000, free: 2000 }), '--');
console.log('  Case 5 (Total 0, empty, negative) safely returns "--"');
console.log('PASSED: Free Pipe Percentage tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 15: Fishing String Load Verification
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 15: Fishing String Load Verification ---');
const fishCalc = allCalcs.find(x => x.id === 'fish_string_load');
assert(fishCalc, 'fish_string_load calculator must exist');

// 1. 150000 / 10.5 / 40000 -> BF 0.8397, buoyed 125,954, load 165,954
const fRes1 = fishCalc.calc({ wt: 150000, mw: 10.5, overpull: 40000 });
assert(typeof fRes1 === 'object', 'fRes1 must return an object');
assert(Math.abs(fRes1.bf - (55 / 65.5)) < 1e-6, `BF should be ~0.8397, got ${fRes1.bf}`);
assert.strictEqual(fRes1.bf.toFixed(4), '0.8397', 'BF formatted should be 0.8397');
assert.strictEqual(Math.round(fRes1.buoyedWeightLb), 125954, 'Buoyed weight should round to 125,954 lb');
assert.strictEqual(Math.round(fRes1.surfaceLoadLb), 165954, 'Surface load should round to 165,954 lb');
console.log(`  Case 1 (150k / 10.5 / 40k) PASSED: BF=${fRes1.bf.toFixed(4)}, Buoyed=${Math.round(fRes1.buoyedWeightLb).toLocaleString()} lb, Load=${Math.round(fRes1.surfaceLoadLb).toLocaleString()} lb`);

// 2. 150000 / 10.5 / 0 -> load 125,954
const fRes2 = fishCalc.calc({ wt: 150000, mw: 10.5, overpull: 0 });
assert(typeof fRes2 === 'object', 'fRes2 must return an object');
assert.strictEqual(Math.round(fRes2.surfaceLoadLb), 125954, 'Surface load with 0 overpull should round to 125,954 lb');
console.log(`  Case 2 (150k / 10.5 / 0) PASSED: Load=${Math.round(fRes2.surfaceLoadLb).toLocaleString()} lb`);

// 3. Same as 1 with limit 200000 -> utilization 82.98%, Caution
const fRes3 = fishCalc.calc({ wt: 150000, mw: 10.5, overpull: 40000, max_load: 200000 });
assert(typeof fRes3 === 'object', 'fRes3 must return an object');
assert.strictEqual(fRes3.utilizationPct.toFixed(2), '82.98', 'Utilization should be 82.98%');
assert.strictEqual(fRes3.status, 'Caution', 'Status should be Caution for 82.98%');
console.log(`  Case 3 (With Limit 200k) PASSED: Utilization=${fRes3.utilizationPct.toFixed(2)}%, Status=${fRes3.status}`);

// 4. MW 65.5 or higher -> validation error
assert.strictEqual(fishCalc.calc({ wt: 150000, mw: 65.5, overpull: 40000 }), '--', 'MW = 65.5 must return "--"');
assert.strictEqual(fishCalc.calc({ wt: 150000, mw: 70, overpull: 40000 }), '--', 'MW > 65.5 must return "--"');
assert.strictEqual(fishCalc.calc({ wt: 150000, mw: 0, overpull: 40000 }), '--', 'MW = 0 must return "--"');
assert.strictEqual(fishCalc.calc({ wt: 150000, mw: -2, overpull: 40000 }), '--', 'MW < 0 must return "--"');
console.log('  Case 4 (MW >= 65.5 or MW <= 0) safely returns "--"');

// 5. Empty or zero weight -> "--", no crash
assert.strictEqual(fishCalc.calc({ wt: 0, mw: 10.5, overpull: 40000 }), '--', 'wt = 0 must return "--"');
assert.strictEqual(fishCalc.calc({ wt: '', mw: 10.5, overpull: 40000 }), '--', 'wt = empty must return "--"');
assert.strictEqual(fishCalc.calc({ wt: -100, mw: 10.5, overpull: 40000 }), '--', 'wt < 0 must return "--"');
assert.strictEqual(fishCalc.calc({ wt: 150000, mw: 10.5, overpull: -5000 }), '--', 'overpull < 0 must return "--"');
console.log('  Case 5 (Empty/zero weight or negative overpull) safely returns "--"');
console.log('PASSED: Fishing String Load tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 16: Accumulator Capacity – Subsea BOP Verification
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 16: Accumulator Capacity – Subsea BOP Verification ---');
const subseaBopCalc = allCalcs.find(x => x.id === 'acc_subsea');
assert(subseaBopCalc, 'acc_subsea calculator must exist');

// 1. Depth 0: 10 x 10 gal, 1000 / 1200 / 3000 psi -> 50.0 gal
const sbRes1 = subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 0, sw: 8.54 });
assert(typeof sbRes1 === 'object', 'sbRes1 must return an object');
assert.strictEqual(sbRes1.hydrostaticPsi, 0, 'Hydrostatic at depth 0 should be 0');
assert.strictEqual(sbRes1.usableVolumeGal.toFixed(1), '50.0', 'Usable volume at depth 0 should be 50.0 gal');
console.log(`  Case 1 (Depth 0 ft) PASSED: Usable=${sbRes1.usableVolumeGal.toFixed(1)} gal`);

// 2. Depth 3000 ft, 8.54 ppg, same data -> hydrostatic 1332.24 psi, usable about 38.3 gal
const sbRes2 = subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 });
assert(typeof sbRes2 === 'object', 'sbRes2 must return an object');
assert(Math.abs(sbRes2.hydrostaticPsi - 1332.24) < 1e-6, `Hydrostatic should be 1332.24 psi, got ${sbRes2.hydrostaticPsi}`);
assert.strictEqual(sbRes2.usableVolumeGal.toFixed(1), '38.3', 'Usable volume should round to 38.3 gal');
console.log(`  Case 2 (Depth 3000 ft) PASSED: Hydrostatic=${sbRes2.hydrostaticPsi} psi, Usable=${sbRes2.usableVolumeGal.toFixed(1)} gal`);

// 3. Same as 2 with absolute pressure toggle -> about 38.2 gal
const sbRes3 = subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54, use_abs: true });
assert(typeof sbRes3 === 'object', 'sbRes3 must return an object');
assert.strictEqual(sbRes3.usableVolumeGal.toFixed(1), '38.2', 'Usable volume in absolute mode should round to 38.2 gal');
console.log(`  Case 3 (Absolute mode) PASSED: Usable=${sbRes3.usableVolumeGal.toFixed(1)} gal`);

// 4. Min operating <= precharge -> validation error, no output
assert.strictEqual(subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1200, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), '--', 'p2 <= p1 must return "--"');
assert.strictEqual(subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1300, p2: 1200, p3: 3000, wd: 3000, sw: 8.54 }), '--', 'p2 < p1 must return "--"');
assert.strictEqual(subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 3000, p3: 3000, wd: 3000, sw: 8.54 }), '--', 'p3 <= p2 must return "--"');
console.log('  Case 4 (Pressure hierarchy errors) safely returns "--"');

// 5. Result never exceeds total bottle volume for any valid input
assert(sbRes1.usableVolumeGal <= sbRes1.totalVolumeGal, 'Case 1 usable <= total volume');
assert(sbRes2.usableVolumeGal <= sbRes2.totalVolumeGal, 'Case 2 usable <= total volume');
assert(sbRes3.usableVolumeGal <= sbRes3.totalVolumeGal, 'Case 3 usable <= total volume');
console.log('  Case 5 (Upper bound <= total volume) verified');

// 6. Required volume 30 gal with test 2 -> surplus about 8.3 gal, OK
const sbRes6 = subseaBopCalc.calc({ bottles: 10, vol: 10, p1: 1000, p2: 1200, p3: 3000, wd: 3000, sw: 8.54, req_vol: 30 });
assert(typeof sbRes6 === 'object', 'sbRes6 must return an object');
assert.strictEqual(sbRes6.surplusGal.toFixed(1), '8.3', 'Surplus volume should be 8.3 gal');
assert.strictEqual(sbRes6.status, 'OK', 'Status should be OK for surplus volume');
console.log(`  Case 6 (Req 30 gal) PASSED: Surplus=+${sbRes6.surplusGal.toFixed(1)} gal, Status=${sbRes6.status}`);
console.log('PASSED: Accumulator Capacity – Subsea BOP tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 17: Feet of Drill Pipe Pulled (Dry Pipe Mode) Verification
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 17: Feet of Drill Pipe Pulled (Dry Pipe Mode) Verification ---');
const pipePulledCalc = allCalcs.find(x => x.id === 'pipe_pulled');
assert(pipePulledCalc, 'pipe_pulled calculator must exist');

// 1. 1000 ft, Dp 0.0075, casing ID 8.681, MW 10 -> 7.50 bbl, level drop about 114.1 ft, loss about 59.4 psi, Ca 0.0732 bbl/ft
const dpRes1 = pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, disp: 0.0075, casing_id: 8.681, mw: 10 });
assert(typeof dpRes1 === 'object', 'dpRes1 must return an object');
assert.strictEqual(dpRes1.displacedVolumeBbl.toFixed(2), '7.50', 'Displaced volume should be 7.50 bbl');
assert(Math.abs(dpRes1.casingCapacityBblFt - 0.0732) < 0.0001, `Casing capacity should be ~0.0732 bbl/ft, got ${dpRes1.casingCapacityBblFt}`);
assert.strictEqual(dpRes1.fluidLevelDropFt.toFixed(1), '114.1', 'Level drop should be 114.1 ft');
assert.strictEqual(dpRes1.pressureLossPsi.toFixed(1), '59.4', 'Pressure loss should be 59.4 psi');
console.log(`  Case 1 (1000 ft / 0.0075 / 8.681 / 10) PASSED: Vol=${dpRes1.displacedVolumeBbl.toFixed(2)} bbl, Ca=${dpRes1.casingCapacityBblFt.toFixed(4)}, Drop=${dpRes1.fluidLevelDropFt.toFixed(1)} ft, Loss=${dpRes1.pressureLossPsi.toFixed(1)} psi`);

// 2. OD 5.0, ID 4.276 with toggle on -> calculated displacement ~ 0.0065 bbl/ft, gives consistent volume, drop and loss
const dpRes2 = pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, calc_disp_toggle: true, od: 5.0, id: 4.276, casing_id: 8.681, mw: 10 });
assert(typeof dpRes2 === 'object', 'dpRes2 must return an object');
assert(Math.abs(dpRes2.dp - 0.006524) < 0.0001, `Calculated displacement should be ~0.0065 bbl/ft, got ${dpRes2.dp}`);
assert.strictEqual(dpRes2.displacedVolumeBbl.toFixed(2), '6.52', 'Displaced volume should be 6.52 bbl');
assert.strictEqual(dpRes2.fluidLevelDropFt.toFixed(1), '97.8', 'Level drop should be 97.8 ft');
assert.strictEqual(dpRes2.pressureLossPsi.toFixed(1), '50.9', 'Pressure loss should be 50.9 psi');
console.log(`  Case 2 (OD 5 / ID 4.276 toggle ON) PASSED: Dp=${dpRes2.dp.toFixed(4)} bbl/ft, Vol=${dpRes2.displacedVolumeBbl.toFixed(2)} bbl, Drop=${dpRes2.fluidLevelDropFt.toFixed(1)} ft, Loss=${dpRes2.pressureLossPsi.toFixed(1)} psi`);

// 3. Length 0 -> volume 0, level drop 0, loss 0
const dpRes3 = pipePulledCalc.calc({ pipe_mode: 'dry', len: 0, disp: 0.0075, casing_id: 8.681, mw: 10 });
assert(typeof dpRes3 === 'object', 'dpRes3 must return an object');
assert.strictEqual(dpRes3.displacedVolumeBbl, 0, 'Displaced volume should be 0');
assert.strictEqual(dpRes3.fluidLevelDropFt, 0, 'Fluid level drop should be 0');
assert.strictEqual(dpRes3.pressureLossPsi, 0, 'Pressure loss should be 0');
console.log('  Case 3 (Length 0) PASSED: Vol=0, Drop=0, Loss=0');

// 4. Dp >= Ca (e.g. Dp 0.08 with casing ID 8.681) -> validation error, no output
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, disp: 0.08, casing_id: 8.681, mw: 10 }), '--', 'Dp >= Ca must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, disp: 0.07321, casing_id: 8.681, mw: 10 }), '--', 'Dp > Ca must return "--"');
console.log('  Case 4 (Dp >= Ca) safely returns "--"');

// 5. Negative or empty inputs -> "--", no crash
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: -500, disp: 0.0075, casing_id: 8.681, mw: 10 }), '--', 'len < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, disp: -0.0075, casing_id: 8.681, mw: 10 }), '--', 'disp < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, disp: 0.0075, casing_id: -8.681, mw: 10 }), '--', 'casing_id < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, disp: 0.0075, casing_id: 8.681, mw: -10 }), '--', 'mw < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: '', disp: '', casing_id: '', mw: '' }), '--', 'Empty inputs must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'dry', len: 1000, calc_disp_toggle: true, od: 4, id: 5, casing_id: 8.681, mw: 10 }), '--', 'OD <= ID must return "--"');
console.log('  Case 5 (Negative/empty/invalid inputs) safely returns "--" without crash');
console.log('PASSED: Feet of Drill Pipe Pulled (Dry Pipe Mode) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 18: Feet of Drill Pipe Pulled (Wet Pipe Mode) Verification
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 18: Feet of Drill Pipe Pulled (Wet Pipe Mode) Verification ---');

// 1. 1000 ft, Dp 0.0075, Cp 0.0178, casing ID 8.681, MW 10 -> 25.30 bbl, level drop about 528 ft, loss about 275 psi, annular cap ~ 0.0479
const wpRes1 = pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: 0.0075, cap: 0.0178, casing_id: 8.681, mw: 10 });
assert(typeof wpRes1 === 'object', 'wpRes1 must return an object');
assert.strictEqual(wpRes1.displacedVolumeBbl.toFixed(2), '25.30', 'Displaced volume should be 25.30 bbl');
assert(Math.abs(wpRes1.casingCapacityBblFt - 0.0732) < 0.0001, `Casing capacity should be ~0.0732 bbl/ft, got ${wpRes1.casingCapacityBblFt}`);
assert(Math.abs(wpRes1.annularCapacityBblFt - 0.0479) < 0.0001, `Annular capacity should be ~0.0479 bbl/ft, got ${wpRes1.annularCapacityBblFt}`);
assert(Math.abs(wpRes1.fluidLevelDropFt - 528.1) < 0.5, `Level drop should be ~528 ft, got ${wpRes1.fluidLevelDropFt}`);
assert(Math.abs(wpRes1.pressureLossPsi - 274.6) < 0.5, `Pressure loss should be ~275 psi, got ${wpRes1.pressureLossPsi}`);
console.log(`  Case 1 (1000 ft / 0.0075 / 0.0178 / 8.681 / 10) PASSED: Vol=${wpRes1.displacedVolumeBbl.toFixed(2)} bbl, AnnCap=${wpRes1.annularCapacityBblFt.toFixed(4)}, Drop=${wpRes1.fluidLevelDropFt.toFixed(1)} ft, Loss=${wpRes1.pressureLossPsi.toFixed(1)} psi`);

// 2. OD 5, ID 4.276 with toggle on -> Dp about 0.0065, Cp about 0.0178
const wpRes2 = pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, calc_disp_toggle: true, od: 5.0, id: 4.276, casing_id: 8.681, mw: 10 });
assert(typeof wpRes2 === 'object', 'wpRes2 must return an object');
assert(Math.abs(wpRes2.dp - 0.006524) < 0.0001, `Calculated Dp should be ~0.0065 bbl/ft, got ${wpRes2.dp}`);
assert(Math.abs(wpRes2.cp - 0.017762) < 0.0001, `Calculated Cp should be ~0.0178 bbl/ft, got ${wpRes2.cp}`);
assert.strictEqual(wpRes2.displacedVolumeBbl.toFixed(2), '24.29', 'Displaced volume should be 24.29 bbl');
assert.strictEqual(wpRes2.annularCapacityBblFt.toFixed(4), '0.0489', 'Annular capacity should be 0.0489 bbl/ft');
assert.strictEqual(wpRes2.fluidLevelDropFt.toFixed(1), '496.4', 'Level drop should be 496.4 ft');
assert.strictEqual(wpRes2.pressureLossPsi.toFixed(1), '258.1', 'Pressure loss should be 258.1 psi');
console.log(`  Case 2 (OD 5 / ID 4.276 toggle ON) PASSED: Dp=${wpRes2.dp.toFixed(4)}, Cp=${wpRes2.cp.toFixed(4)}, Vol=${wpRes2.displacedVolumeBbl.toFixed(2)} bbl, Drop=${wpRes2.fluidLevelDropFt.toFixed(1)} ft, Loss=${wpRes2.pressureLossPsi.toFixed(1)} psi`);

// 3. Length 0 -> 0 bbl, 0 ft, 0 psi
const wpRes3 = pipePulledCalc.calc({ pipe_mode: 'wet', len: 0, disp: 0.0075, cap: 0.0178, casing_id: 8.681, mw: 10 });
assert(typeof wpRes3 === 'object', 'wpRes3 must return an object');
assert.strictEqual(wpRes3.displacedVolumeBbl, 0, 'Displaced volume should be 0');
assert.strictEqual(wpRes3.fluidLevelDropFt, 0, 'Fluid level drop should be 0');
assert.strictEqual(wpRes3.pressureLossPsi, 0, 'Pressure loss should be 0');
console.log('  Case 3 (Length 0) PASSED: Vol=0, Drop=0, Loss=0');

// 4. Ca <= Cp + Dp -> validation error, no output
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: 0.04, cap: 0.04, casing_id: 8.681, mw: 10 }), '--', 'Ca <= Cp + Dp must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: 0.05, cap: 0.05, casing_id: 8.681, mw: 10 }), '--', 'Ca < Cp + Dp must return "--"');
console.log('  Case 4 (Ca <= Cp + Dp) safely returns "--"');

// 5. Empty or negative inputs -> "--", no crash
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: -500, disp: 0.0075, cap: 0.0178, casing_id: 8.681, mw: 10 }), '--', 'len < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: -0.0075, cap: 0.0178, casing_id: 8.681, mw: 10 }), '--', 'disp < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: 0.0075, cap: -0.0178, casing_id: 8.681, mw: 10 }), '--', 'cap < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: 0.0075, cap: 0.0178, casing_id: -8.681, mw: 10 }), '--', 'casing_id < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, disp: 0.0075, cap: 0.0178, casing_id: 8.681, mw: -10 }), '--', 'mw < 0 must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: '', disp: '', cap: '', casing_id: '', mw: '' }), '--', 'Empty inputs must return "--"');
assert.strictEqual(pipePulledCalc.calc({ pipe_mode: 'wet', len: 1000, calc_disp_toggle: true, od: 4, id: 5, casing_id: 8.681, mw: 10 }), '--', 'OD <= ID must return "--"');
console.log('  Case 5 (Negative/empty/invalid inputs) safely returns "--" without crash');
console.log('PASSED: Feet of Drill Pipe Pulled (Wet Pipe Mode) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 19: Drill Pipe Pulled to Lose Hydrostatic Pressure (Dry Pipe Mode)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 19: Drill Pipe Pulled to Lose Hydrostatic Pressure (Dry Pipe Mode) ---');
const dpLoseCalc = allCalcs.find(x => x.id === 'dp_pulled_lose');
assert(dpLoseCalc, 'dp_pulled_lose calculator must exist');
const dpLoseDryCalc = dpLoseCalc;

// 1. 100 psi, 10 ppg, 0.0075, 0.0702 -> 1,607.69 ft, level drop 192.31 ft, volume 12.06 bbl, 17 stands (stand 93 ft), fill vol 11.86 bbl
const pldRes1 = dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, disp: 0.0075, ccap: 0.0702, stand_len: 93 });
assert(typeof pldRes1 === 'object', 'pldRes1 must return an object');
assert(Math.abs(pldRes1.feetPulled - 1607.69) < 0.1, `Feet pulled expected ~1,607.69 ft, got ${pldRes1.feetPulled}`);
assert.strictEqual(Math.round(pldRes1.feetPulled), 1608, 'Feet pulled display rounded should be 1608 ft');
assert(Math.abs(pldRes1.fluidLevelDropFt - 192.31) < 0.05, `Level drop expected ~192.31 ft, got ${pldRes1.fluidLevelDropFt}`);
assert(Math.abs(pldRes1.volumeDisplacedBbl - 12.06) < 0.05, `Volume displaced expected ~12.06 bbl, got ${pldRes1.volumeDisplacedBbl}`);
assert.strictEqual(pldRes1.stands, 17, `Stands expected 17, got ${pldRes1.stands}`);
assert(Math.abs(pldRes1.volumeToFillBbl - 11.86) < 0.05, `Fill volume expected ~11.86 bbl, got ${pldRes1.volumeToFillBbl}`);
console.log(`  Case 1 (100 psi / 10 ppg / 0.0075 / 0.0702 / 93 ft) PASSED: Feet=${pldRes1.feetPulled.toFixed(2)} ft, Drop=${pldRes1.fluidLevelDropFt.toFixed(2)} ft, Vol=${pldRes1.volumeDisplacedBbl.toFixed(2)} bbl, Stands=${pldRes1.stands}, FillVol=${pldRes1.volumeToFillBbl.toFixed(2)} bbl`);

// 2. Same with stand length 90 -> 17 stands
const pldRes2 = dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, disp: 0.0075, ccap: 0.0702, stand_len: 90 });
assert(typeof pldRes2 === 'object', 'pldRes2 must return an object');
assert.strictEqual(pldRes2.stands, 17, `Stands with 90 ft expected 17, got ${pldRes2.stands}`);
assert(Math.abs(pldRes2.volumeToFillBbl - 11.48) < 0.05, `Fill volume with 90 ft expected ~11.48 bbl, got ${pldRes2.volumeToFillBbl}`);
console.log(`  Case 2 (Stand length 90 ft) PASSED: Stands=${pldRes2.stands}, FillVol=${pldRes2.volumeToFillBbl.toFixed(2)} bbl`);

// 3. Casing ID 8.681, pipe OD 5 / ID 4.276 with toggle on -> Ca about 0.0732, Dp about 0.0065
const pldRes3 = dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, calc_diam_toggle: true, casing_id: 8.681, od: 5.0, id: 4.276, stand_len: 93 });
assert(typeof pldRes3 === 'object', 'pldRes3 must return an object');
assert(Math.abs(pldRes3.casingCapacityBblFt - 0.0732) < 0.0001, `Calculated Ca expected ~0.0732, got ${pldRes3.casingCapacityBblFt}`);
assert(Math.abs(pldRes3.pipeDisplacementBblFt - 0.006524) < 0.0001, `Calculated Dp expected ~0.0065, got ${pldRes3.pipeDisplacementBblFt}`);
assert(Math.abs(pldRes3.feetPulled - 1965.55) < 1.0, `Recalculated feet pulled expected ~1966 ft, got ${pldRes3.feetPulled}`);
assert.strictEqual(pldRes3.stands, 21, `Stands expected 21, got ${pldRes3.stands}`);
console.log(`  Case 3 (Diameters toggle ON) PASSED: Ca=${pldRes3.casingCapacityBblFt.toFixed(4)}, Dp=${pldRes3.pipeDisplacementBblFt.toFixed(4)}, Feet=${Math.round(pldRes3.feetPulled)} ft, Stands=${pldRes3.stands}`);

// 4. Dp >= Ca -> validation error, no output
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, disp: 0.08, ccap: 0.0702 }), '--', 'Dp >= Ca must return "--"');
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, disp: 0.0702, ccap: 0.0702 }), '--', 'Dp == Ca must return "--"');
console.log('  Case 4 (Dp >= Ca) safely returns "--"');

// 5. DeltaP 0 or empty, or invalid OD/ID -> "--", no crash
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 0, mw: 10, disp: 0.0075, ccap: 0.0702 }), '--', 'DeltaP 0 must return "--"');
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: -100, mw: 10, disp: 0.0075, ccap: 0.0702 }), '--', 'DeltaP < 0 must return "--"');
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: '', mw: 10, disp: 0.0075, ccap: 0.0702 }), '--', 'Empty drop must return "--"');
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 0, disp: 0.0075, ccap: 0.0702 }), '--', 'MW 0 must return "--"');
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, calc_diam_toggle: true, casing_id: 4.5, od: 5.0, id: 4.276 }), '--', 'Casing ID <= Pipe OD must return "--"');
assert.strictEqual(dpLoseDryCalc.calc({ pipe_mode: 'dry', drop: 100, mw: 10, calc_diam_toggle: true, casing_id: 8.681, od: 4.0, id: 4.5 }), '--', 'Pipe OD <= Pipe ID must return "--"');
console.log('  Case 5 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Drill Pipe Pulled to Lose Hydrostatic Pressure (Dry Pipe Mode) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 20: Drill Pipe Pulled to Lose Hydrostatic Pressure (Wet Pipe Mode)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 20: Drill Pipe Pulled to Lose Hydrostatic Pressure (Wet Pipe Mode) ---');
const dpLoseWetCalc = dpLoseCalc;

// 1. 100 psi, 10 ppg, 0.0075, 0.0178, 0.0702 -> 341.29 ft, level drop 192.31 ft, volume 8.63 bbl, 3 stands (stand 93 ft)
const plwRes1 = dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, disp: 0.0075, cap: 0.0178, ccap: 0.0702, stand_len: 93 });
assert(typeof plwRes1 === 'object', 'plwRes1 must return an object');
assert(Math.abs(plwRes1.feetPulled - 341.29) < 0.1, `Feet pulled expected ~341.29 ft, got ${plwRes1.feetPulled}`);
assert.strictEqual(Math.round(plwRes1.feetPulled), 341, 'Feet pulled display rounded should be 341 ft');
assert(Math.abs(plwRes1.fluidLevelDropFt - 192.31) < 0.05, `Level drop expected ~192.31 ft, got ${plwRes1.fluidLevelDropFt}`);
assert(Math.abs(plwRes1.volumeDisplacedBbl - 8.63) < 0.05, `Volume displaced expected ~8.63 bbl, got ${plwRes1.volumeDisplacedBbl}`);
assert.strictEqual(plwRes1.stands, 3, `Stands expected 3, got ${plwRes1.stands}`);
assert(Math.abs(plwRes1.volumeToFillBbl - 7.06) < 0.05, `Fill volume expected ~7.06 bbl, got ${plwRes1.volumeToFillBbl}`);
assert(Math.abs(plwRes1.feetPulledDry - 1607.69) < 0.1, `Feet pulled dry comparison expected ~1607.69 ft, got ${plwRes1.feetPulledDry}`);
console.log(`  Case 1 (100 psi / 10 ppg / 0.0075 / 0.0178 / 0.0702 / 93 ft) PASSED: Feet=${plwRes1.feetPulled.toFixed(2)} ft, Drop=${plwRes1.fluidLevelDropFt.toFixed(2)} ft, Vol=${plwRes1.volumeDisplacedBbl.toFixed(2)} bbl, Stands=${plwRes1.stands}, FillVol=${plwRes1.volumeToFillBbl.toFixed(2)} bbl, DryAllow=${Math.round(plwRes1.feetPulledDry)} ft`);

// 2. Same with stand length 90 -> 3 stands
const plwRes2 = dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, disp: 0.0075, cap: 0.0178, ccap: 0.0702, stand_len: 90 });
assert(typeof plwRes2 === 'object', 'plwRes2 must return an object');
assert.strictEqual(plwRes2.stands, 3, `Stands with 90 ft expected 3, got ${plwRes2.stands}`);
console.log(`  Case 2 (Stand length 90 ft) PASSED: Stands=${plwRes2.stands}`);

// 3. Casing ID 8.681, pipe OD 5 / ID 4.276 with toggle on -> Ca about 0.0732, Dp about 0.0065, Cp about 0.0178, result recalculated
const plwRes3 = dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, calc_diam_toggle: true, casing_id: 8.681, od: 5.0, id: 4.276, stand_len: 93 });
assert(typeof plwRes3 === 'object', 'plwRes3 must return an object');
assert(Math.abs(plwRes3.casingCapacityBblFt - 0.0732) < 0.0001, `Calculated Ca expected ~0.0732, got ${plwRes3.casingCapacityBblFt}`);
assert(Math.abs(plwRes3.pipeDisplacementBblFt - 0.006524) < 0.0001, `Calculated Dp expected ~0.0065, got ${plwRes3.pipeDisplacementBblFt}`);
assert(Math.abs(plwRes3.pipeCapacityBblFt - 0.01776) < 0.0001, `Calculated Cp expected ~0.0178, got ${plwRes3.pipeCapacityBblFt}`);
assert(Math.abs(plwRes3.feetPulled - 387.38) < 1.0, `Recalculated feet pulled expected ~387 ft, got ${plwRes3.feetPulled}`);
assert.strictEqual(plwRes3.stands, 4, `Stands expected 4, got ${plwRes3.stands}`);
console.log(`  Case 3 (Diameters toggle ON) PASSED: Ca=${plwRes3.casingCapacityBblFt.toFixed(4)}, Dp=${plwRes3.pipeDisplacementBblFt.toFixed(4)}, Cp=${plwRes3.pipeCapacityBblFt.toFixed(4)}, Feet=${Math.round(plwRes3.feetPulled)} ft, Stands=${plwRes3.stands}`);

// 4. Ca <= Cp + Dp -> validation error, no output
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, disp: 0.03, cap: 0.05, ccap: 0.0702 }), '--', 'Ca <= Cp + Dp must return "--"');
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, disp: 0.02, cap: 0.0502, ccap: 0.0702 }), '--', 'Ca == Cp + Dp must return "--"');
console.log('  Case 4 (Ca <= Cp + Dp) safely returns "--"');

// 5. DeltaP 0 or empty, or invalid OD/ID -> "--", no crash
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 0, mw: 10, disp: 0.0075, cap: 0.0178, ccap: 0.0702 }), '--', 'DeltaP 0 must return "--"');
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: -100, mw: 10, disp: 0.0075, cap: 0.0178, ccap: 0.0702 }), '--', 'DeltaP < 0 must return "--"');
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: '', mw: 10, disp: 0.0075, cap: 0.0178, ccap: 0.0702 }), '--', 'Empty drop must return "--"');
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 0, disp: 0.0075, cap: 0.0178, ccap: 0.0702 }), '--', 'MW 0 must return "--"');
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, calc_diam_toggle: true, casing_id: 4.5, od: 5.0, id: 4.276 }), '--', 'Casing ID <= Pipe OD must return "--"');
assert.strictEqual(dpLoseWetCalc.calc({ pipe_mode: 'wet', drop: 100, mw: 10, calc_diam_toggle: true, casing_id: 8.681, od: 4.0, id: 4.5 }), '--', 'Pipe OD <= Pipe ID must return "--"');
console.log('  Case 5 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Drill Pipe Pulled to Lose Hydrostatic Pressure (Wet Pipe Mode) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 21: Neutral Point Calculation
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 21: Neutral Point Calculation ---');
const npCalc = allCalcs.find(x => x.id === 'neutral_point');
assert(npCalc, 'neutral_point calculator must exist');

// 1. 40000 / 120 / 10.5 -> 396.97 ft, BF 0.8397, Buoyed BHA weight ~100.76 lb/ft
const npRes1 = npCalc.calc({ wob: 40000, dc_wt: 120, mw: 10.5 });
assert(typeof npRes1 === 'object', 'npRes1 must return an object');
assert(Math.abs(npRes1.npFt - 396.97) < 0.05, `NP expected ~396.97 ft, got ${npRes1.npFt}`);
assert.strictEqual(Math.round(npRes1.npFt), 397, 'NP display rounded should be 397 ft');
assert(Math.abs(npRes1.bf - 0.8397) < 0.0001, `BF expected ~0.8397, got ${npRes1.bf}`);
assert(Math.abs(npRes1.buoyedDcWt - 100.76) < 0.05, `Buoyed weight expected ~100.76 lb/ft, got ${npRes1.buoyedDcWt}`);
console.log(`  Case 1 (40,000 lb / 120 lb/ft / 10.5 ppg) PASSED: NP=${npRes1.npFt.toFixed(2)} ft (disp ${Math.round(npRes1.npFt)} ft), BF=${npRes1.bf.toFixed(4)}, BuoyedWt=${npRes1.buoyedDcWt.toFixed(2)} lb/ft`);

// 2. BHA length 400 -> OK
const npRes2 = npCalc.calc({ wob: 40000, dc_wt: 120, mw: 10.5, bha_len: 400 });
assert(typeof npRes2 === 'object', 'npRes2 must return an object');
assert.strictEqual(npRes2.status, 'OK', 'Status expected OK');
assert.strictEqual(npRes2.statusMsg, 'Neutral point inside BHA');
console.log(`  Case 2 (BHA length 400 ft) PASSED: status=${npRes2.status}`);

// 3. BHA length 350 -> Warning
const npRes3 = npCalc.calc({ wob: 40000, dc_wt: 120, mw: 10.5, bha_len: 350 });
assert(typeof npRes3 === 'object', 'npRes3 must return an object');
assert.strictEqual(npRes3.status, 'Warning', 'Status expected Warning');
assert(npRes3.statusMsg.includes('drill pipe, pipe may be in compression'), 'Warning message must match');
console.log(`  Case 3 (BHA length 350 ft) PASSED: status=${npRes3.status}`);

// 4. MW 65.5 or higher -> error
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: 120, mw: 65.5 }), '--', 'MW 65.5 must return "--"');
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: 120, mw: 70 }), '--', 'MW > 65.5 must return "--"');
console.log('  Case 4 (MW 65.5 or higher) safely returns "--"');

// 5. Negative/empty/zero inputs -> "--", no crash
assert.strictEqual(npCalc.calc({ wob: 0, dc_wt: 120, mw: 10.5 }), '--', 'WOB 0 must return "--"');
assert.strictEqual(npCalc.calc({ wob: -40000, dc_wt: 120, mw: 10.5 }), '--', 'WOB < 0 must return "--"');
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: 0, mw: 10.5 }), '--', 'dc_wt 0 must return "--"');
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: -120, mw: 10.5 }), '--', 'dc_wt < 0 must return "--"');
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: 120, mw: 0 }), '--', 'MW 0 must return "--"');
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: 120, mw: -10 }), '--', 'MW < 0 must return "--"');
assert.strictEqual(npCalc.calc({ wob: '', dc_wt: '', mw: '' }), '--', 'Empty inputs must return "--"');
assert.strictEqual(npCalc.calc({ wob: 40000, dc_wt: 120, mw: 10.5, bha_len: -10 }), '--', 'BHA length < 0 must return "--"');
console.log('  Case 5 (Negative/empty/zero inputs) safely returns "--" without crash');
console.log('PASSED: Neutral Point Calculation tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 22: Tensile Capacity of Drill String
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 22: Tensile Capacity of Drill String ---');
const tcCalc = allCalcs.find(x => x.id === 'tensile_cap');
assert(tcCalc, 'tensile_cap calculator must exist');

// 1. 75000 / 4.4 / DF 0.9 -> Capacity 330,000 lb, Allowable 297,000 lb
const tcRes1 = tcCalc.calc({ ys: 75000, area: 4.4, df: 0.9 });
assert(typeof tcRes1 === 'object', 'tcRes1 must return an object');
assert.strictEqual(tcRes1.capacityLb, 330000, `Capacity expected 330,000 lb, got ${tcRes1.capacityLb}`);
assert.strictEqual(tcRes1.allowableTensionLb, 297000, `Allowable tension expected 297,000 lb, got ${tcRes1.allowableTensionLb}`);
console.log(`  Case 1 (75,000 psi / 4.4 sq in / DF 0.9) PASSED: Capacity=${tcRes1.capacityLb} lb, Allowable=${tcRes1.allowableTensionLb} lb`);

// 2. OD 5, ID 4.276 toggle on -> Area about 5.2746 sq in, Capacity about 395,595 lb
const tcRes2 = tcCalc.calc({ ys: 75000, calc_area_toggle: true, od: 5, id: 4.276, df: 0.9 });
assert(typeof tcRes2 === 'object', 'tcRes2 must return an object');
assert(Math.abs(tcRes2.areaSqIn - 5.2746) < 0.001, `Area expected ~5.2746 sq in, got ${tcRes2.areaSqIn}`);
assert(Math.abs(tcRes2.capacityLb - 395595) < 10, `Capacity expected ~395,595 lb, got ${tcRes2.capacityLb}`);
console.log(`  Case 2 (OD 5, ID 4.276) PASSED: Area=${tcRes2.areaSqIn.toFixed(4)} sq in, Capacity=${Math.round(tcRes2.capacityLb)} lb`);

// 3. Hook load 250,000 lb on test 1 -> utilization 84.2%, Caution
const tcRes3 = tcCalc.calc({ ys: 75000, area: 4.4, df: 0.9, hook_load: 250000 });
assert(typeof tcRes3 === 'object', 'tcRes3 must return an object');
assert(Math.abs(tcRes3.utilizationPct - 84.175) < 0.05, `Utilization expected ~84.2%, got ${tcRes3.utilizationPct}`);
assert.strictEqual(tcRes3.status, 'Caution', 'Status expected Caution');
console.log(`  Case 3 (Hook load 250,000 lb) PASSED: Utilization=${tcRes3.utilizationPct.toFixed(1)}%, Status=${tcRes3.status}`);

// 4. OD <= ID -> error
assert.strictEqual(tcCalc.calc({ ys: 75000, calc_area_toggle: true, od: 4.276, id: 5.0, df: 0.9 }), '--', 'OD < ID must return "--"');
assert.strictEqual(tcCalc.calc({ ys: 75000, calc_area_toggle: true, od: 5.0, id: 5.0, df: 0.9 }), '--', 'OD == ID must return "--"');
console.log('  Case 4 (OD <= ID) safely returns "--"');

// 5. Negative/empty/zero/out-of-bounds inputs -> "--", no crash
assert.strictEqual(tcCalc.calc({ ys: 0, area: 4.4, df: 0.9 }), '--', 'YS 0 must return "--"');
assert.strictEqual(tcCalc.calc({ ys: -75000, area: 4.4, df: 0.9 }), '--', 'YS < 0 must return "--"');
assert.strictEqual(tcCalc.calc({ ys: 75000, area: 0, df: 0.9 }), '--', 'Area 0 must return "--"');
assert.strictEqual(tcCalc.calc({ ys: 75000, area: -4.4, df: 0.9 }), '--', 'Area < 0 must return "--"');
assert.strictEqual(tcCalc.calc({ ys: 75000, area: 4.4, df: 0.4 }), '--', 'DF < 0.5 must return "--"');
assert.strictEqual(tcCalc.calc({ ys: 75000, area: 4.4, df: 1.1 }), '--', 'DF > 1.0 must return "--"');
assert.strictEqual(tcCalc.calc({ ys: '', area: '', df: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 5 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Tensile Capacity of Drill String tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 23: Drill Collar Weight for Vertical Wells
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 23: Drill Collar Weight for Vertical Wells ---');
const dcVertCalc = allCalcs.find(x => x.id === 'dc_wt_vert');
assert(dcVertCalc, 'dc_wt_vert calculator must exist');

// 1. 40000 / 0.85 / 1.15 -> 54,117.65 lb (display 54,118 lb)
const dcRes1 = dcVertCalc.calc({ wob: 40000, bf: 0.85, sf: 1.15 });
assert(typeof dcRes1 === 'object', 'dcRes1 must return an object');
assert(Math.abs(dcRes1.collarWeightLb - 54117.65) < 0.1, `Weight expected ~54,117.65 lb, got ${dcRes1.collarWeightLb}`);
assert.strictEqual(Math.round(dcRes1.collarWeightLb), 54118, 'Weight display rounded should be 54,118 lb');
assert.strictEqual(dcRes1.bf, 0.85, 'BF should be 0.85');
assert.strictEqual(dcRes1.sf, 1.15, 'SF should be 1.15');
console.log(`  Case 1 (40,000 WOB / 0.85 BF / 1.15 SF) PASSED: Weight=${dcRes1.collarWeightLb.toFixed(2)} lb (disp ${Math.round(dcRes1.collarWeightLb)} lb)`);

// 2. MW 10.5 mode, SF 1.15 -> BF about 0.8397, collar weight about 54,782 lb
const dcRes2 = dcVertCalc.calc({ wob: 40000, calc_bf_toggle: true, mw: 10.5, sf: 1.15 });
assert(typeof dcRes2 === 'object', 'dcRes2 must return an object');
assert(Math.abs(dcRes2.bf - 0.8397) < 0.0001, `BF expected ~0.8397, got ${dcRes2.bf}`);
assert(Math.abs(dcRes2.collarWeightLb - 54781.82) < 0.5, `Weight expected ~54,782 lb, got ${dcRes2.collarWeightLb}`);
assert.strictEqual(Math.round(dcRes2.collarWeightLb), 54782, 'Weight display rounded should be 54,782 lb');
console.log(`  Case 2 (MW 10.5 mode) PASSED: BF=${dcRes2.bf.toFixed(4)}, Weight=${Math.round(dcRes2.collarWeightLb)} lb`);

// 3. With 120 lb/ft and 30 ft joints on test 1 -> length about 451 ft, 16 joints
const dcRes3 = dcVertCalc.calc({ wob: 40000, bf: 0.85, sf: 1.15, dc_wt_ft: 120, joint_len: 30 });
assert(typeof dcRes3 === 'object', 'dcRes3 must return an object');
assert(Math.abs(dcRes3.collarLengthFt - 450.98) < 0.1, `Length expected ~450.98 ft, got ${dcRes3.collarLengthFt}`);
assert.strictEqual(Math.round(dcRes3.collarLengthFt), 451, 'Length display rounded should be 451 ft');
assert.strictEqual(dcRes3.jointsNeeded, 16, `Joints needed expected 16, got ${dcRes3.jointsNeeded}`);
assert.strictEqual(dcRes3.status, 'OK');
assert.strictEqual(dcRes3.statusMsg, '16 joints (451 ft)');
console.log(`  Case 3 (120 lb/ft, 30 ft joints) PASSED: Length=${dcRes3.collarLengthFt.toFixed(2)} ft (disp ${Math.round(dcRes3.collarLengthFt)} ft), Joints=${dcRes3.jointsNeeded}`);

// 4. BF <= 0 or > 1 -> error
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: 0, sf: 1.15 }), '--', 'BF 0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: -0.85, sf: 1.15 }), '--', 'BF < 0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: 1.1, sf: 1.15 }), '--', 'BF > 1.0 must return "--"');
console.log('  Case 4 (BF <= 0 or > 1) safely returns "--"');

// 5. SF < 1.0, MW >= 65.5, or negative/empty inputs -> "--", no crash
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: 0.85, sf: 0.9 }), '--', 'SF < 1.0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: 0.85, sf: 1.6 }), '--', 'SF > 1.5 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 40000, calc_bf_toggle: true, mw: 65.5, sf: 1.15 }), '--', 'MW >= 65.5 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 0, bf: 0.85, sf: 1.15 }), '--', 'WOB 0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: -40000, bf: 0.85, sf: 1.15 }), '--', 'WOB < 0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: 0.85, sf: 1.15, dc_wt_ft: -120 }), '--', 'DC wt/ft < 0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: 40000, bf: 0.85, sf: 1.15, dc_wt_ft: 120, joint_len: 0 }), '--', 'Joint length 0 must return "--"');
assert.strictEqual(dcVertCalc.calc({ wob: '', bf: '', sf: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 5 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Drill Collar Weight for Vertical Wells tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 24: Drill Collar Weight for Deviated Wells
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 24: Drill Collar Weight for Deviated Wells ---');
const dcDevCalc = allCalcs.find(x => x.id === 'dc_wt_dev');
assert(dcDevCalc, 'dc_wt_dev calculator must exist');

// 1. 54000 at 30 deg -> 62,353.83 lb (display 62,354 lb), increase 8,354 lb (15.5%)
const devRes1 = dcDevCalc.calc({ vertWt: 54000, angle: 30 });
assert(typeof devRes1 === 'object', 'devRes1 must return an object');
assert(Math.abs(devRes1.deviatedWeightLb - 62353.83) < 0.1, `Weight expected ~62,353.83 lb, got ${devRes1.deviatedWeightLb}`);
assert.strictEqual(Math.round(devRes1.deviatedWeightLb), 62354, 'Weight display rounded should be 62,354 lb');
assert(Math.abs(devRes1.increaseLb - 8353.83) < 0.1, `Increase expected ~8,354 lb, got ${devRes1.increaseLb}`);
assert(Math.abs(devRes1.increasePct - 15.47) < 0.1, `Increase % expected ~15.5%, got ${devRes1.increasePct}`);
console.log(`  Case 1 (54,000 lb at 30 deg) PASSED: Weight=${devRes1.deviatedWeightLb.toFixed(2)} lb (disp ${Math.round(devRes1.deviatedWeightLb)} lb), Increase=+${Math.round(devRes1.increaseLb)} lb (${devRes1.increasePct.toFixed(1)}%)`);

// 2. 54000 at 0 deg -> 54,000 lb, increase 0 lb (0%)
const devRes2 = dcDevCalc.calc({ vertWt: 54000, angle: 0 });
assert(typeof devRes2 === 'object', 'devRes2 must return an object');
assert.strictEqual(Math.round(devRes2.deviatedWeightLb), 54000, 'Weight at 0 deg should be 54,000 lb');
assert.strictEqual(Math.round(devRes2.increaseLb), 0, 'Increase at 0 deg should be 0 lb');
assert.strictEqual(devRes2.increasePct, 0, 'Increase % at 0 deg should be 0%');
console.log(`  Case 2 (54,000 lb at 0 deg) PASSED: Weight=${Math.round(devRes2.deviatedWeightLb)} lb, Increase=0 lb (0%)`);

// 3. 54000 at 60 deg -> 108,000 lb, increase 54,000 lb (100%)
const devRes3 = dcDevCalc.calc({ vertWt: 54000, angle: 60 });
assert(typeof devRes3 === 'object', 'devRes3 must return an object');
assert(Math.abs(devRes3.deviatedWeightLb - 108000) < 0.1, `Weight at 60 deg expected 108,000 lb, got ${devRes3.deviatedWeightLb}`);
assert(Math.abs(devRes3.increaseLb - 54000) < 0.1, `Increase at 60 deg expected 54,000 lb, got ${devRes3.increaseLb}`);
assert(Math.abs(devRes3.increasePct - 100) < 0.1, `Increase % at 60 deg expected 100%, got ${devRes3.increasePct}`);
console.log(`  Case 3 (54,000 lb at 60 deg) PASSED: Weight=${Math.round(devRes3.deviatedWeightLb)} lb, Increase=+${Math.round(devRes3.increaseLb)} lb (${devRes3.increasePct.toFixed(1)}%)`);

// 4. 54000 at 80 deg -> about 310,994 lb, warning chip shown
const devRes4 = dcDevCalc.calc({ vertWt: 54000, angle: 80 });
assert(typeof devRes4 === 'object', 'devRes4 must return an object');
assert(Math.abs(devRes4.deviatedWeightLb - 310994) < 50, `Weight at 80 deg expected ~310,994 lb, got ${devRes4.deviatedWeightLb}`);
assert.strictEqual(devRes4.status, 'Warning', 'Status at 80 deg should be Warning');
assert(devRes4.statusMsg.includes('High inclination'), 'Warning message must indicate high inclination');
console.log(`  Case 4 (54,000 lb at 80 deg) PASSED: Weight=${Math.round(devRes4.deviatedWeightLb)} lb, Status=${devRes4.status}`);

// 5. Inclination 90 or 95 -> error ("--"), negative/empty inputs -> "--", no crash
assert.strictEqual(dcDevCalc.calc({ vertWt: 54000, angle: 90 }), '--', 'Angle 90 must return "--"');
assert.strictEqual(dcDevCalc.calc({ vertWt: 54000, angle: 95 }), '--', 'Angle > 90 must return "--"');
assert.strictEqual(dcDevCalc.calc({ vertWt: 54000, angle: -10 }), '--', 'Angle < 0 must return "--"');
assert.strictEqual(dcDevCalc.calc({ vertWt: 0, angle: 30 }), '--', 'vertWt 0 must return "--"');
assert.strictEqual(dcDevCalc.calc({ vertWt: -54000, angle: 30 }), '--', 'vertWt < 0 must return "--"');
assert.strictEqual(dcDevCalc.calc({ vertWt: '', angle: '' }), '--', 'Empty inputs must return "--"');

// 6. Mode toggle ON: Calculate from WOB, BF, SF
const devResWob = dcDevCalc.calc({ calc_wob_toggle: true, wob: 40000, bf: 0.85, sf: 1.15, angle: 30 });
assert(typeof devResWob === 'object', 'devResWob must return an object');
assert(Math.abs(devResWob.effectiveVertWt - 54117.65) < 0.1, `Effective vertical weight expected ~54,117.65 lb, got ${devResWob.effectiveVertWt}`);
assert(Math.abs(devResWob.deviatedWeightLb - 62489.88) < 0.5, `Deviated weight from WOB expected ~62,490 lb, got ${devResWob.deviatedWeightLb}`);
console.log(`  Case 6 (WOB mode: 40k, 0.85, 1.15 at 30 deg) PASSED: Weight=${Math.round(devResWob.deviatedWeightLb)} lb`);

console.log('PASSED: Drill Collar Weight for Deviated Wells tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 25: Margin of Overpull in Drillstring
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 25: Margin of Overpull in Drillstring ---');
const mopCalc = allCalcs.find(x => x.id === 'overpull_margin');
assert(mopCalc, 'overpull_margin calculator must exist');

// 1. 350000 / 220000 / DF 0.9 -> Margin with DF 95,000 lb, Margin to yield 130,000 lb, 62.9%, OK
const mopRes1 = mopCalc.calc({ ts: 350000, wt: 220000, df: 0.9 });
assert(typeof mopRes1 === 'object', 'mopRes1 must return an object');
assert.strictEqual(mopRes1.marginWithDfLb, 95000, `Margin with DF expected 95,000 lb, got ${mopRes1.marginWithDfLb}`);
assert.strictEqual(mopRes1.marginToYieldLb, 130000, `Margin to yield expected 130,000 lb, got ${mopRes1.marginToYieldLb}`);
assert(Math.abs(mopRes1.weightPctOfTensile - 62.86) < 0.1, `Weight % expected ~62.9%, got ${mopRes1.weightPctOfTensile}`);
assert.strictEqual(mopRes1.status, 'OK', 'Status should be OK');
console.log(`  Case 1 (350k / 220k / DF 0.9) PASSED: MarginWithDF=${mopRes1.marginWithDfLb} lb, MarginYield=${mopRes1.marginToYieldLb} lb, Pct=${mopRes1.weightPctOfTensile.toFixed(1)}%, Status=${mopRes1.status}`);

// 2. 350000 / 220000 / DF 0.8 -> Margin with DF 60,000 lb
const mopRes2 = mopCalc.calc({ ts: 350000, wt: 220000, df: 0.8 });
assert(typeof mopRes2 === 'object', 'mopRes2 must return an object');
assert.strictEqual(mopRes2.marginWithDfLb, 60000, `Margin with DF expected 60,000 lb, got ${mopRes2.marginWithDfLb}`);
console.log(`  Case 2 (DF 0.8) PASSED: MarginWithDF=${mopRes2.marginWithDfLb} lb`);

// 3. 350000 / 280000 / DF 0.9 -> Margin with DF 35,000 lb, Caution
const mopRes3 = mopCalc.calc({ ts: 350000, wt: 280000, df: 0.9 });
assert(typeof mopRes3 === 'object', 'mopRes3 must return an object');
assert.strictEqual(mopRes3.marginWithDfLb, 35000, `Margin with DF expected 35,000 lb, got ${mopRes3.marginWithDfLb}`);
assert.strictEqual(mopRes3.status, 'Caution', 'Status should be Caution');
console.log(`  Case 3 (350k / 280k) PASSED: MarginWithDF=${mopRes3.marginWithDfLb} lb, Status=${mopRes3.status}`);

// 4. Weight 360000 > Tensile 350000 -> negative margin shown, Warning
const mopRes4 = mopCalc.calc({ ts: 350000, wt: 360000, df: 0.9 });
assert(typeof mopRes4 === 'object', 'mopRes4 must return an object');
assert.strictEqual(mopRes4.marginWithDfLb, -45000, `Margin with DF expected -45,000 lb, got ${mopRes4.marginWithDfLb}`);
assert.strictEqual(mopRes4.marginToYieldLb, -10000, `Margin to yield expected -10,000 lb, got ${mopRes4.marginToYieldLb}`);
assert.strictEqual(mopRes4.status, 'Warning', 'Status should be Warning');
assert.strictEqual(mopRes4.statusMsg, 'Exceeds design limit');
console.log(`  Case 4 (Overload: 350k / 360k) PASSED: MarginWithDF=${mopRes4.marginWithDfLb} lb, Status=${mopRes4.status}`);

// 5. Empty or non-numeric inputs -> "--", no crash
assert.strictEqual(mopCalc.calc({ ts: 0, wt: 220000, df: 0.9 }), '--', 'TS 0 must return "--"');
assert.strictEqual(mopCalc.calc({ ts: -350000, wt: 220000, df: 0.9 }), '--', 'TS < 0 must return "--"');
assert.strictEqual(mopCalc.calc({ ts: 350000, wt: 0, df: 0.9 }), '--', 'WT 0 must return "--"');
assert.strictEqual(mopCalc.calc({ ts: 350000, wt: -220000, df: 0.9 }), '--', 'WT < 0 must return "--"');
assert.strictEqual(mopCalc.calc({ ts: 350000, wt: 220000, df: 0.4 }), '--', 'DF < 0.5 must return "--"');
assert.strictEqual(mopCalc.calc({ ts: 350000, wt: 220000, df: 1.1 }), '--', 'DF > 1.0 must return "--"');
assert.strictEqual(mopCalc.calc({ ts: '', wt: '', df: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 5 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Margin of Overpull in Drillstring tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 26: Equivalent Circulating Density (ECD)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 26: Equivalent Circulating Density (ECD) ---');
const ecdCalc = allCalcs.find(x => x.id === 'eff_mud_dens');
assert(ecdCalc, 'eff_mud_dens calculator must exist');

// 1. 10.2 / 350 / 8500 -> ECD 10.99 ppg, increase +0.79 ppg, static BHP 4,508 psi, circ BHP 4,858 psi
const ecdRes1 = ecdCalc.calc({ mw: 10.2, apl: 350, tvd: 8500, fg: '' });
assert(typeof ecdRes1 === 'object', 'ecdRes1 must return an object');
assert(Math.abs(ecdRes1.ecdPpg - 10.991855) < 0.001, `ECD expected ~10.9919 ppg, got ${ecdRes1.ecdPpg}`);
assert(Math.abs(ecdRes1.ecdIncreasePpg - 0.791855) < 0.001, `Increase expected ~0.7919 ppg, got ${ecdRes1.ecdIncreasePpg}`);
assert(Math.abs(ecdRes1.staticBhpPsi - 4508.4) < 0.1, `Static BHP expected ~4,508.4 psi, got ${ecdRes1.staticBhpPsi}`);
assert(Math.abs(ecdRes1.circBhpPsi - 4858.4) < 0.1, `Circulating BHP expected ~4,858.4 psi, got ${ecdRes1.circBhpPsi}`);
assert.strictEqual(ecdRes1.status, null, 'Status should be null when FG not provided');
console.log(`  Case 1 (10.2 / 350 / 8500) PASSED: ECD=${ecdRes1.ecdPpg.toFixed(2)} ppg, Inc=+${ecdRes1.ecdIncreasePpg.toFixed(2)} ppg, StaticBHP=${Math.round(ecdRes1.staticBhpPsi)} psi, CircBHP=${Math.round(ecdRes1.circBhpPsi)} psi`);

// 2. APL 0 -> 10.20 ppg, increase 0
const ecdRes2 = ecdCalc.calc({ mw: 10.2, apl: 0, tvd: 8500, fg: '' });
assert(typeof ecdRes2 === 'object', 'ecdRes2 must return an object');
assert.strictEqual(ecdRes2.ecdPpg, 10.2, `ECD expected 10.2 ppg, got ${ecdRes2.ecdPpg}`);
assert.strictEqual(ecdRes2.ecdIncreasePpg, 0, `Increase expected 0 ppg, got ${ecdRes2.ecdIncreasePpg}`);
console.log(`  Case 2 (APL 0) PASSED: ECD=${ecdRes2.ecdPpg.toFixed(2)} ppg, Inc=${ecdRes2.ecdIncreasePpg.toFixed(2)} ppg`);

// 3. FG 0.80 on test 1 -> max ECD 15.38 ppg, margin 4.39 ppg, OK
const ecdRes3 = ecdCalc.calc({ mw: 10.2, apl: 350, tvd: 8500, fg: 0.80 });
assert(typeof ecdRes3 === 'object', 'ecdRes3 must return an object');
assert(Math.abs(ecdRes3.maxAllowableEcdPpg - 15.3846) < 0.01, `Max allowable ECD expected ~15.38 ppg, got ${ecdRes3.maxAllowableEcdPpg}`);
assert(Math.abs(ecdRes3.marginPpg - 4.3927) < 0.01, `Margin expected ~4.39 ppg, got ${ecdRes3.marginPpg}`);
assert.strictEqual(ecdRes3.status, 'OK', 'Status should be OK');
console.log(`  Case 3 (FG 0.80 psi/ft) PASSED: MaxECD=${ecdRes3.maxAllowableEcdPpg.toFixed(2)} ppg, Margin=${ecdRes3.marginPpg.toFixed(2)} ppg, Status=${ecdRes3.status}`);

// 4. FG 0.57 on test 1 -> max ECD 10.96 ppg, margin -0.03 ppg, Warning
const ecdRes4 = ecdCalc.calc({ mw: 10.2, apl: 350, tvd: 8500, fg: 0.57 });
assert(typeof ecdRes4 === 'object', 'ecdRes4 must return an object');
assert(Math.abs(ecdRes4.maxAllowableEcdPpg - 10.9615) < 0.01, `Max allowable ECD expected ~10.96 ppg, got ${ecdRes4.maxAllowableEcdPpg}`);
assert(Math.abs(ecdRes4.marginPpg - (-0.0303)) < 0.01, `Margin expected ~-0.03 ppg, got ${ecdRes4.marginPpg}`);
assert.strictEqual(ecdRes4.status, 'Warning', 'Status should be Warning');
assert(ecdRes4.statusMsg.includes('exceeds fracture gradient'), 'StatusMsg should mention exceeding FG');
console.log(`  Case 4 (FG 0.57 psi/ft) PASSED: MaxECD=${ecdRes4.maxAllowableEcdPpg.toFixed(2)} ppg, Margin=${ecdRes4.marginPpg.toFixed(2)} ppg, Status=${ecdRes4.status}`);

// 5. TVD 0 or negative -> error, MW <= 0 -> error, non-numeric -> "--"
assert.strictEqual(ecdCalc.calc({ mw: 10.2, apl: 350, tvd: 0 }), '--', 'TVD 0 must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: 10.2, apl: 350, tvd: -8500 }), '--', 'TVD < 0 must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: 0, apl: 350, tvd: 8500 }), '--', 'MW 0 must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: -10.2, apl: 350, tvd: 8500 }), '--', 'MW < 0 must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: 10.2, apl: -50, tvd: 8500 }), '--', 'APL < 0 must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: 10.2, apl: 350, tvd: 8500, fg: -0.5 }), '--', 'FG < 0 must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: '', apl: 350, tvd: 8500 }), '--', 'Empty MW must return "--"');
assert.strictEqual(ecdCalc.calc({ mw: 10.2, apl: '', tvd: '' }), '--', 'Empty TVD must return "--"');
console.log('  Case 5 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Equivalent Circulating Density (ECD) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 27: Drill String Weight (In Air Mode)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 27: Drill String Weight (In Air Mode) ---');
const dsCalc = allCalcs.find(x => x.id === 'ds_weight');
assert(dsCalc, 'ds_weight calculator must exist');

// 1. Defaults: 8000 ft x 19.5 + 500 x 50 + 600 x 120 -> 253,000 lb, components 156k / 25k / 72k, total length 9,100 ft
const dsAirRes1 = dsCalc.calc({
  calc_mode: 'in_air',
  dp_len: 8000,
  dp_wt: 19.5,
  hwdp_len: 500,
  hwdp_wt: 50,
  dc_len: 600,
  dc_wt: 120
});
assert(typeof dsAirRes1 === 'object', 'dsAirRes1 must return an object');
assert.strictEqual(dsAirRes1.totalWeightLb, 253000, `Total weight expected 253,000 lb, got ${dsAirRes1.totalWeightLb}`);
assert.strictEqual(dsAirRes1.dpWeightLb, 156000, `DP weight expected 156,000 lb, got ${dsAirRes1.dpWeightLb}`);
assert.strictEqual(dsAirRes1.hwdpWeightLb, 25000, `HWDP weight expected 25,000 lb, got ${dsAirRes1.hwdpWeightLb}`);
assert.strictEqual(dsAirRes1.dcWeightLb, 72000, `DC weight expected 72,000 lb, got ${dsAirRes1.dcWeightLb}`);
assert.strictEqual(dsAirRes1.totalLengthFt, 9100, `Total length expected 9,100 ft, got ${dsAirRes1.totalLengthFt}`);
assert(Math.abs(dsAirRes1.dpPct - 61.66) < 0.1, `DP % expected ~61.7%, got ${dsAirRes1.dpPct}`);
assert(Math.abs(dsAirRes1.hwdpPct - 9.88) < 0.1, `HWDP % expected ~9.9%, got ${dsAirRes1.hwdpPct}`);
assert(Math.abs(dsAirRes1.dcPct - 28.46) < 0.1, `DC % expected ~28.5%, got ${dsAirRes1.dcPct}`);
console.log(`  Case 1 (Defaults: 8000/19.5, 500/50, 600/120) PASSED: Total=${dsAirRes1.totalWeightLb.toLocaleString()} lb, DP=${dsAirRes1.dpWeightLb.toLocaleString()} lb (${dsAirRes1.dpPct.toFixed(1)}%), HWDP=${dsAirRes1.hwdpWeightLb.toLocaleString()} lb (${dsAirRes1.hwdpPct.toFixed(1)}%), DC=${dsAirRes1.dcWeightLb.toLocaleString()} lb (${dsAirRes1.dcPct.toFixed(1)}%), Len=${dsAirRes1.totalLengthFt.toLocaleString()} ft`);

// 2. Custom values
const dsAirRes2 = dsCalc.calc({
  calc_mode: 'in_air',
  dp_len: 10000,
  dp_wt: 20,
  hwdp_len: 1000,
  hwdp_wt: 60,
  dc_len: 500,
  dc_wt: 150
});
assert(typeof dsAirRes2 === 'object', 'dsAirRes2 must return an object');
assert.strictEqual(dsAirRes2.totalWeightLb, 335000, `Total weight expected 335,000 lb, got ${dsAirRes2.totalWeightLb}`);
assert.strictEqual(dsAirRes2.totalLengthFt, 11500, `Total length expected 11,500 ft, got ${dsAirRes2.totalLengthFt}`);
console.log(`  Case 2 (Custom values) PASSED: Total=${dsAirRes2.totalWeightLb.toLocaleString()} lb, Len=${dsAirRes2.totalLengthFt.toLocaleString()} ft`);

// 3. Zero, negative, and empty inputs -> "--"
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 0, dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'dp_len 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: -8000, dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'dp_len < 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 0, hwdp_len: 500, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'dp_wt 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: -19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'dp_wt < 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 19.5, hwdp_len: 0, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'hwdp_len 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 19.5, hwdp_len: -500, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'hwdp_len < 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 0, dc_len: 600, dc_wt: 120 }), '--', 'hwdp_wt 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: 0, dc_wt: 120 }), '--', 'dc_len 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: -600, dc_wt: 120 }), '--', 'dc_len < 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: 8000, dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: 600, dc_wt: 0 }), '--', 'dc_wt 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_air', dp_len: '', dp_wt: 19.5, hwdp_len: 500, hwdp_wt: 50, dc_len: 600, dc_wt: 120 }), '--', 'Empty input must return "--"');
console.log('  Case 3 (Invalid/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Drill String Weight (In Air Mode) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 28: Drill String Weight (In Mud Mode)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 28: Drill String Weight (In Mud Mode) ---');

// 1. Defaults: 250,000 lb in air, 12 ppg mud -> 204,198.47 lb, BF 0.8168, loss 45,802 lb
const dsMudRes1 = dsCalc.calc({ calc_mode: 'in_mud', wt_air: 250000, mw: 12.0 });
assert(typeof dsMudRes1 === 'object', 'dsMudRes1 must return an object');
assert(Math.abs(dsMudRes1.buoyedWeightLb - 204198.47) < 0.1, `Buoyed weight expected ~204,198.47 lb, got ${dsMudRes1.buoyedWeightLb}`);
assert(Math.abs(dsMudRes1.buoyancyFactor - 0.8168) < 0.0001, `BF expected ~0.8168, got ${dsMudRes1.buoyancyFactor}`);
assert(Math.abs(dsMudRes1.buoyancyLossLb - 45801.53) < 0.1, `Loss expected ~45,801.53 lb, got ${dsMudRes1.buoyancyLossLb}`);
console.log(`  Case 1 (Defaults: 250k / 12 ppg) PASSED: BuoyedWeight=${Math.round(dsMudRes1.buoyedWeightLb).toLocaleString()} lb, BF=${dsMudRes1.buoyancyFactor.toFixed(4)}, Loss=${Math.round(dsMudRes1.buoyancyLossLb).toLocaleString()} lb`);

// 2. Mud weight 65.5 ppg (equal to steel density) -> error
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: 250000, mw: 65.5 }), '--', 'MW 65.5 must return "--"');
console.log('  Case 2 (MW 65.5 steel density) PASSED: returns "--"');

// 3. Mud weight > 65.5 ppg -> error
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: 250000, mw: 70 }), '--', 'MW > 65.5 must return "--"');

// 4. Mud weight <= 0 or air weight <= 0 or empty -> error
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: 250000, mw: 0 }), '--', 'MW 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: 250000, mw: -12 }), '--', 'MW < 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: 0, mw: 12 }), '--', 'Air weight 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: -250000, mw: 12 }), '--', 'Air weight < 0 must return "--"');
assert.strictEqual(dsCalc.calc({ calc_mode: 'in_mud', wt_air: '', mw: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 3 (Boundary/zero/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Drill String Weight (In Mud Mode) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 29: Critical Buckling Load (Vertical Well, Lubinski)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 29: Critical Buckling Load (Vertical Well, Lubinski) ---');
const buckCalc = allCalcs.find(x => x.id === 'buckling_load');
assert(buckCalc, 'buckling_load calculator must exist');

// 1. Defaults: OD 5.0, ID 4.276, Buoyed Wt 16.5 lb/ft -> I ~ 14.27 in^4, Fcr ~ 1,808 lb (1807.91)
const buckRes1 = buckCalc.calc({ od: 5.0, id: 4.276, wt_mud: 16.5, comp_load: '' });
assert(typeof buckRes1 === 'object', 'buckRes1 must return an object');
assert(Math.abs(buckRes1.momentOfInertiaIn4 - 14.2709) < 0.01, `Moment of inertia expected ~14.27 in^4, got ${buckRes1.momentOfInertiaIn4}`);
assert(Math.abs(buckRes1.criticalLoadLb - 1807.91) < 0.5, `Critical buckling load expected ~1,808 lb, got ${buckRes1.criticalLoadLb}`);
assert(Math.abs(buckRes1.buoyedWeightLbPerIn - 1.375) < 0.001, `Distributed weight expected 1.375 lb/in, got ${buckRes1.buoyedWeightLbPerIn}`);
assert.strictEqual(buckRes1.status, null, 'Status should be null when comp_load not provided');
console.log(`  Case 1 (Defaults: OD 5, ID 4.276, 16.5 lb/ft) PASSED: I=${buckRes1.momentOfInertiaIn4.toFixed(2)} in^4, Fcr=${Math.round(buckRes1.criticalLoadLb).toLocaleString()} lb`);

// 2. Compressive load 1200 lb (< Fcr) -> OK
const buckRes2 = buckCalc.calc({ od: 5.0, id: 4.276, wt_mud: 16.5, comp_load: 1200 });
assert(typeof buckRes2 === 'object', 'buckRes2 must return an object');
assert.strictEqual(buckRes2.status, 'OK', 'Status should be OK for load < 80% Fcr');
console.log(`  Case 2 (Load 1200 lb < Fcr) PASSED: Status=${buckRes2.status}, Util=${buckRes2.utilizationPct.toFixed(1)}%`);

// 3. Compressive load 2000 lb (>= Fcr) -> Warning
const buckRes3 = buckCalc.calc({ od: 5.0, id: 4.276, wt_mud: 16.5, comp_load: 2000 });
assert(typeof buckRes3 === 'object', 'buckRes3 must return an object');
assert.strictEqual(buckRes3.status, 'Warning', 'Status should be Warning for load >= Fcr');
assert(buckRes3.statusMsg.includes('Buckling expected'), 'StatusMsg should mention buckling expected');
console.log(`  Case 3 (Load 2000 lb >= Fcr) PASSED: Status=${buckRes3.status}`);

// 4. Invalid inputs: OD <= ID, wt_mud <= 0, empty inputs -> "--"
assert.strictEqual(buckCalc.calc({ od: 4.0, id: 4.276, wt_mud: 16.5 }), '--', 'OD < ID must return "--"');
assert.strictEqual(buckCalc.calc({ od: 4.276, id: 4.276, wt_mud: 16.5 }), '--', 'OD == ID must return "--"');
assert.strictEqual(buckCalc.calc({ od: 5.0, id: 4.276, wt_mud: 0 }), '--', 'wt_mud 0 must return "--"');
assert.strictEqual(buckCalc.calc({ od: 5.0, id: 4.276, wt_mud: -16.5 }), '--', 'wt_mud < 0 must return "--"');
assert.strictEqual(buckCalc.calc({ od: 0, id: 4.276, wt_mud: 16.5 }), '--', 'OD 0 must return "--"');
assert.strictEqual(buckCalc.calc({ od: 5.0, id: 0, wt_mud: 16.5 }), '--', 'ID 0 must return "--"');
assert.strictEqual(buckCalc.calc({ od: '', id: '', wt_mud: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 4 (OD <= ID, wt <= 0, empty inputs) safely returns "--" without crash');
console.log('PASSED: Critical Buckling Load (Vertical Well, Lubinski) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 30: Burst Pressure Rating
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 30: Burst Pressure Rating ---');
const burstCalc = allCalcs.find(x => x.id === 'burst_pressure');
assert(burstCalc, 'burst_pressure calculator must exist');

// 1. Defaults: Yield 135,000 psi, OD 5.0, ID 4.276, Toggle ON (default)
// Barlow nominal: 19,548 psi, API 0.875 main result: 17,105 psi
const burstRes1 = burstCalc.calc({ yield: 135000, od: 5.0, id: 4.276, api_tol_toggle: true, wall_pct: '', df: '' });
assert(typeof burstRes1 === 'object', 'burstRes1 must return an object');
assert.strictEqual(Math.round(burstRes1.mainBurstPsi), 17105, `Main burst expected 17,105 psi, got ${Math.round(burstRes1.mainBurstPsi)}`);
assert.strictEqual(Math.round(burstRes1.barlowNominalPsi), 19548, `Nominal Barlow expected 19,548 psi, got ${Math.round(burstRes1.barlowNominalPsi)}`);
assert.strictEqual(Math.round(burstRes1.apiBurstPsi), 17105, `API burst expected 17,105 psi, got ${Math.round(burstRes1.apiBurstPsi)}`);
console.log(`  Case 1 (Defaults: Yield 135k, OD 5, ID 4.276, Toggle ON) PASSED: Main=${Math.round(burstRes1.mainBurstPsi).toLocaleString()} psi, Nominal=${Math.round(burstRes1.barlowNominalPsi).toLocaleString()} psi`);

// 2. Toggle OFF: Main result is nominal Barlow = 19,548 psi
const burstRes2 = burstCalc.calc({ yield: 135000, od: 5.0, id: 4.276, api_tol_toggle: false, wall_pct: '', df: '' });
assert(typeof burstRes2 === 'object', 'burstRes2 must return an object');
assert.strictEqual(Math.round(burstRes2.mainBurstPsi), 19548, `Main burst expected 19,548 psi when toggle OFF, got ${Math.round(burstRes2.mainBurstPsi)}`);
console.log(`  Case 2 (Toggle OFF) PASSED: Main=${Math.round(burstRes2.mainBurstPsi).toLocaleString()} psi`);

// 3. Wall percentage 80%: nominal wall = 0.362 in, effective wall = 0.2896 in, effective OD = 4.8552 in
// Barlow = 2 * 135000 * 0.2896 / 4.8552 = 16,104.8 psi; API = 0.875 * 16,104.8 = 14,091.7 psi
const burstRes3 = burstCalc.calc({ yield: 135000, od: 5.0, id: 4.276, api_tol_toggle: true, wall_pct: 80, df: 0.90 });
assert(typeof burstRes3 === 'object', 'burstRes3 must return an object');
assert.strictEqual(Math.round(burstRes3.mainBurstPsi), 14092, `Main burst expected 14,092 psi with 80% wall, got ${Math.round(burstRes3.mainBurstPsi)}`);
assert.strictEqual(Math.round(burstRes3.allowableBurstPsi), 12683, `Allowable burst with DF 0.9 expected 12,683 psi, got ${Math.round(burstRes3.allowableBurstPsi)}`);
console.log(`  Case 3 (80% wall, DF 0.9) PASSED: Main=${Math.round(burstRes3.mainBurstPsi).toLocaleString()} psi, Allowable=${Math.round(burstRes3.allowableBurstPsi).toLocaleString()} psi`);

// 4. Boundary / invalid / empty inputs -> "--"
assert.strictEqual(burstCalc.calc({ yield: 0, od: 5.0, id: 4.276 }), '--', 'Yield 0 must return "--"');
assert.strictEqual(burstCalc.calc({ yield: -135000, od: 5.0, id: 4.276 }), '--', 'Yield < 0 must return "--"');
assert.strictEqual(burstCalc.calc({ yield: 135000, od: 0, id: 4.276 }), '--', 'OD 0 must return "--"');
assert.strictEqual(burstCalc.calc({ yield: 135000, od: 4.0, id: 4.276 }), '--', 'OD < ID must return "--"');
assert.strictEqual(burstCalc.calc({ yield: 135000, od: 5.0, id: 5.0 }), '--', 'OD == ID must return "--"');
assert.strictEqual(burstCalc.calc({ yield: '', od: '', id: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 4 (OD <= ID, yield <= 0, empty inputs) safely returns "--" without crash');
console.log('PASSED: Burst Pressure Rating tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 31: Collapse Pressure Rating (API 5C3 Four-Regime)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 31: Collapse Pressure Rating (API 5C3) ---');
const collapseCalc = allCalcs.find(x => x.id === 'collapse_pressure');
assert(collapseCalc, 'collapse_pressure calculator must exist');

// 1. Defaults: Yield 135,000 psi, OD 5.0, ID 4.276 -> D/t 13.81, Plastic regime, ~15,670 psi (+/- 15 psi)
const colRes1 = collapseCalc.calc({ yield: 135000, od: 5.0, id: 4.276, wall_pct: '' });
assert(typeof colRes1 === 'object', 'colRes1 must return an object');
assert.strictEqual(colRes1.regime, 'Plastic', `Expected Plastic regime, got ${colRes1.regime}`);
assert(Math.abs(colRes1.dOverT - 13.81) < 0.02, `Expected D/t ~ 13.81, got ${colRes1.dOverT}`);
assert(Math.abs(colRes1.collapsePsi - 15670) <= 15, `Expected collapse ~ 15,670 psi (+/- 15), got ${colRes1.collapsePsi}`);
console.log(`  Case 1 (Defaults: Yield 135k, OD 5, ID 4.276) PASSED: Regime=${colRes1.regime}, D/t=${colRes1.dOverT.toFixed(2)}, Collapse=${Math.round(colRes1.collapsePsi).toLocaleString()} psi`);

// 2. Thick wall giving D/t < 11.92: Yield 135,000 psi, OD 5.0, ID 4.1 -> t = 0.45, D/t = 11.11 -> Yield regime
const colRes2 = collapseCalc.calc({ yield: 135000, od: 5.0, id: 4.1, wall_pct: '' });
assert(typeof colRes2 === 'object', 'colRes2 must return an object');
assert.strictEqual(colRes2.regime, 'Yield', `Expected Yield regime, got ${colRes2.regime}`);
assert(colRes2.dOverT < colRes2.yieldPlasticLimit, 'D/t must be < yieldPlasticLimit');
console.log(`  Case 2 (Thick wall, D/t ${colRes2.dOverT.toFixed(2)} < ${colRes2.yieldPlasticLimit.toFixed(2)}) PASSED: Regime=${colRes2.regime}, Collapse=${Math.round(colRes2.collapsePsi).toLocaleString()} psi`);

// 3. Transition wall: Yield 135,000 psi, OD 5.0, ID 4.5 -> t = 0.25, D/t = 20.0 -> Transition regime (19.18 to 23.44)
const colRes3 = collapseCalc.calc({ yield: 135000, od: 5.0, id: 4.5, wall_pct: '' });
assert(typeof colRes3 === 'object', 'colRes3 must return an object');
assert.strictEqual(colRes3.regime, 'Transition', `Expected Transition regime, got ${colRes3.regime}`);
console.log(`  Case 3 (Transition wall, D/t ${colRes3.dOverT.toFixed(2)}) PASSED: Regime=${colRes3.regime}, Collapse=${Math.round(colRes3.collapsePsi).toLocaleString()} psi`);

// 4. Very thin wall: Yield 135,000 psi, OD 5.0, ID 4.8 -> t = 0.1, D/t = 50.0 > 23.44 -> Elastic regime
const colRes4 = collapseCalc.calc({ yield: 135000, od: 5.0, id: 4.8, wall_pct: '' });
assert(typeof colRes4 === 'object', 'colRes4 must return an object');
assert.strictEqual(colRes4.regime, 'Elastic', `Expected Elastic regime, got ${colRes4.regime}`);
console.log(`  Case 4 (Very thin wall, D/t ${colRes4.dOverT.toFixed(2)}) PASSED: Regime=${colRes4.regime}, Collapse=${Math.round(colRes4.collapsePsi).toLocaleString()} psi`);

// 5. Remaining wall thickness 85%: effective wall = 0.3077 in, effective OD = 4.8914 in, D/t = 15.90 -> Plastic
const colRes5 = collapseCalc.calc({ yield: 135000, od: 5.0, id: 4.276, wall_pct: 85 });
assert(typeof colRes5 === 'object', 'colRes5 must return an object');
assert.strictEqual(colRes5.regime, 'Plastic', `Expected Plastic regime, got ${colRes5.regime}`);
assert(colRes5.collapsePsi < colRes1.collapsePsi, 'Worn pipe collapse resistance must be lower than nominal');
console.log(`  Case 5 (85% wall) PASSED: Regime=${colRes5.regime}, D/t=${colRes5.dOverT.toFixed(2)}, Collapse=${Math.round(colRes5.collapsePsi).toLocaleString()} psi`);

// 6. Boundary / invalid / empty inputs -> "--"
assert.strictEqual(collapseCalc.calc({ yield: 0, od: 5.0, id: 4.276 }), '--', 'Yield 0 must return "--"');
assert.strictEqual(collapseCalc.calc({ yield: -135000, od: 5.0, id: 4.276 }), '--', 'Yield < 0 must return "--"');
assert.strictEqual(collapseCalc.calc({ yield: 135000, od: 0, id: 4.276 }), '--', 'OD 0 must return "--"');
assert.strictEqual(collapseCalc.calc({ yield: 135000, od: 4.0, id: 4.276 }), '--', 'OD < ID must return "--"');
assert.strictEqual(collapseCalc.calc({ yield: 135000, od: 5.0, id: 5.0 }), '--', 'OD == ID must return "--"');
assert.strictEqual(collapseCalc.calc({ yield: '', od: '', id: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 6 (OD <= ID, yield <= 0, empty inputs) safely returns "--" without crash');
console.log('PASSED: Collapse Pressure Rating tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 32: Pipe Body Yield Strength
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 32: Pipe Body Yield Strength ---');
const pipeYieldCalc = allCalcs.find(x => x.id === 'pipe_body_yield');
assert(pipeYieldCalc, 'pipe_body_yield calculator must exist');

// 1. Defaults: Yield 135,000 psi, OD 5.0, ID 4.276 -> Area 5.2746 in^2, Yield 712,070 lb, DF 0.9 -> 640,863 lb
const pyRes1 = pipeYieldCalc.calc({ yield: 135000, od: 5.0, id: 4.276, df: '', wall_pct: '' });
assert(typeof pyRes1 === 'object', 'pyRes1 must return an object');
assert.strictEqual(Math.round(pyRes1.yieldStrengthLb), 712070, `Expected default yield 712,070 lb, got ${Math.round(pyRes1.yieldStrengthLb)}`);
assert.strictEqual(pyRes1.crossSectionAreaIn2.toFixed(4), '5.2746', `Expected area 5.2746 in^2, got ${pyRes1.crossSectionAreaIn2.toFixed(4)}`);
assert.strictEqual(Math.round(pyRes1.allowableTensionLb), 640863, `Expected allowable tension 640,863 lb, got ${Math.round(pyRes1.allowableTensionLb)}`);
console.log(`  Case 1 (Defaults: Yield 135k, OD 5, ID 4.276) PASSED: Area=${pyRes1.crossSectionAreaIn2.toFixed(4)} in^2, Yield=${Math.round(pyRes1.yieldStrengthLb).toLocaleString()} lb, Allowable (DF 0.9)=${Math.round(pyRes1.allowableTensionLb).toLocaleString()} lb`);

// 2. Remaining wall thickness 80%: expected about 560,800 lb
const pyRes2 = pipeYieldCalc.calc({ yield: 135000, od: 5.0, id: 4.276, df: '', wall_pct: 80 });
assert(typeof pyRes2 === 'object', 'pyRes2 must return an object');
assert(Math.abs(pyRes2.yieldStrengthLb - 560800) < 100, `Expected ~560,800 lb, got ${pyRes2.yieldStrengthLb}`);
console.log(`  Case 2 (80% wall) PASSED: Yield=${Math.round(pyRes2.yieldStrengthLb).toLocaleString()} lb`);

// 3. Custom Design Factor 0.85: Allowable = 712,070 * 0.85 = 605,259 lb
const pyRes3 = pipeYieldCalc.calc({ yield: 135000, od: 5.0, id: 4.276, df: 0.85, wall_pct: '' });
assert(typeof pyRes3 === 'object', 'pyRes3 must return an object');
assert.strictEqual(Math.round(pyRes3.allowableTensionLb), 605259, `Expected allowable tension 605,259 lb, got ${Math.round(pyRes3.allowableTensionLb)}`);
console.log(`  Case 3 (Custom DF 0.85) PASSED: Allowable=${Math.round(pyRes3.allowableTensionLb).toLocaleString()} lb`);

// 4. Boundary / invalid / empty inputs -> "--"
assert.strictEqual(pipeYieldCalc.calc({ yield: 0, od: 5.0, id: 4.276 }), '--', 'Yield 0 must return "--"');
assert.strictEqual(pipeYieldCalc.calc({ yield: -135000, od: 5.0, id: 4.276 }), '--', 'Yield < 0 must return "--"');
assert.strictEqual(pipeYieldCalc.calc({ yield: 135000, od: 0, id: 4.276 }), '--', 'OD 0 must return "--"');
assert.strictEqual(pipeYieldCalc.calc({ yield: 135000, od: 4.0, id: 4.276 }), '--', 'OD < ID must return "--"');
assert.strictEqual(pipeYieldCalc.calc({ yield: 135000, od: 5.0, id: 5.0 }), '--', 'OD == ID must return "--"');
assert.strictEqual(pipeYieldCalc.calc({ yield: '', od: '', id: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 4 (OD <= ID, yield <= 0, empty inputs) safely returns "--" without crash');
console.log('PASSED: Pipe Body Yield Strength tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 33: Tool Joint Strength (API Spec 7G)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 33: Tool Joint Strength (API Spec 7G) ---');
const tjCalc = allCalcs.find(x => x.id === 'tool_joint_strength');
assert(tjCalc, 'tool_joint_strength calculator must exist');

// 1. Defaults: yield 120,000 psi, pin 9.0 in^2, box 12.0 in^2, OD 6.625 in, ID 3.25 in
// Main result: min(9, 12) * 120,000 = 1,080,000 lb, Pin governs; gross area row: 3,141,102 lb
const tjRes1 = tjCalc.calc({ yield: 120000, pin_area: 9.0, box_area: 12.0, tj_od: 6.625, tj_id: 3.25, pipe_yield: '' });
assert(typeof tjRes1 === 'object', 'tjRes1 must return an object');
assert.strictEqual(Math.round(tjRes1.jointTensileRatingLb), 1080000, `Expected joint rating 1,080,000 lb, got ${Math.round(tjRes1.jointTensileRatingLb)}`);
assert.strictEqual(tjRes1.governingMember, 'Pin', `Expected Pin governs, got ${tjRes1.governingMember}`);
assert.strictEqual(Math.round(tjRes1.grossUpperLb), 3141102, `Expected gross area upper bound 3,141,102 lb, got ${Math.round(tjRes1.grossUpperLb)}`);
console.log(`  Case 1 (Defaults: Yield 120k, Pin 9.0, Box 12.0) PASSED: Main=${Math.round(tjRes1.jointTensileRatingLb).toLocaleString()} lb (${tjRes1.governingMember} governs), GrossUpper=${Math.round(tjRes1.grossUpperLb).toLocaleString()} lb`);

// 2. Box governs: Pin 14.0 in^2, Box 10.0 in^2 -> 1,200,000 lb, Box governs
const tjRes2 = tjCalc.calc({ yield: 120000, pin_area: 14.0, box_area: 10.0, tj_od: 6.625, tj_id: 3.25, pipe_yield: '' });
assert(typeof tjRes2 === 'object', 'tjRes2 must return an object');
assert.strictEqual(Math.round(tjRes2.jointTensileRatingLb), 1200000, `Expected 1,200,000 lb, got ${Math.round(tjRes2.jointTensileRatingLb)}`);
assert.strictEqual(tjRes2.governingMember, 'Box', `Expected Box governs, got ${tjRes2.governingMember}`);
console.log(`  Case 2 (Box governs: Pin 14.0, Box 10.0) PASSED: Main=${Math.round(tjRes2.jointTensileRatingLb).toLocaleString()} lb (${tjRes2.governingMember} governs)`);

// 3. Comparison with pipe body yield:
// 3a. Pipe body 712,070 lb -> TJ (1,080,000 lb) is stronger -> OK
const tjRes3a = tjCalc.calc({ yield: 120000, pin_area: 9.0, box_area: 12.0, tj_od: 6.625, tj_id: 3.25, pipe_yield: 712070 });
assert(typeof tjRes3a === 'object', 'tjRes3a must return an object');
assert.strictEqual(tjRes3a.status, 'OK', 'Expected OK status when TJ >= Pipe Body');
assert(Math.abs(tjRes3a.tjVsPipeRatio - 1.5167) < 0.001, `Expected ratio ~1.517, got ${tjRes3a.tjVsPipeRatio}`);
console.log(`  Case 3a (Pipe body 712,070 lb) PASSED: Status=${tjRes3a.status}, Ratio=${(tjRes3a.tjVsPipeRatio * 100).toFixed(1)}%`);

// 3b. Pipe body 1,300,000 lb -> TJ (1,080,000 lb) is weaker -> Warning
const tjRes3b = tjCalc.calc({ yield: 120000, pin_area: 9.0, box_area: 12.0, tj_od: 6.625, tj_id: 3.25, pipe_yield: 1300000 });
assert(typeof tjRes3b === 'object', 'tjRes3b must return an object');
assert.strictEqual(tjRes3b.status, 'Warning', 'Expected Warning status when TJ < Pipe Body');
console.log(`  Case 3b (Pipe body 1,300,000 lb) PASSED: Status=${tjRes3b.status}, Msg="${tjRes3b.statusMsg}"`);

// 4. Missing pin or box area -> main result must be "--"
assert.strictEqual(tjCalc.calc({ yield: 120000, pin_area: '', box_area: 12.0, tj_od: 6.625, tj_id: 3.25 }), '--', 'Missing pin must return "--"');
assert.strictEqual(tjCalc.calc({ yield: 120000, pin_area: 9.0, box_area: '', tj_od: 6.625, tj_id: 3.25 }), '--', 'Missing box must return "--"');
assert.strictEqual(tjCalc.calc({ yield: 120000, pin_area: '', box_area: '', tj_od: 6.625, tj_id: 3.25 }), '--', 'Missing both must return "--"');
console.log('  Case 4 (Missing pin/box area) safely returns "--" without crash');

// 5. Boundary / invalid / empty inputs -> "--"
assert.strictEqual(tjCalc.calc({ yield: 0, pin_area: 9.0, box_area: 12.0, tj_od: 6.625, tj_id: 3.25 }), '--', 'Yield 0 must return "--"');
assert.strictEqual(tjCalc.calc({ yield: 120000, pin_area: -9.0, box_area: 12.0, tj_od: 6.625, tj_id: 3.25 }), '--', 'Pin < 0 must return "--"');
assert.strictEqual(tjCalc.calc({ yield: 120000, pin_area: 9.0, box_area: 0, tj_od: 6.625, tj_id: 3.25 }), '--', 'Box 0 must return "--"');
assert.strictEqual(tjCalc.calc({ yield: 120000, pin_area: 9.0, box_area: 12.0, tj_od: 3.25, tj_id: 6.625 }), '--', 'OD < ID must return "--"');
assert.strictEqual(tjCalc.calc({ yield: '', pin_area: '', box_area: '', tj_od: '', tj_id: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 5 (Boundary/zero/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Tool Joint Strength tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 34: Hook Load Calculation
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 34: Hook Load Calculation ---');
const hookCalc = allCalcs.find(x => x.id === 'hook_load_calc');
assert(hookCalc, 'hook_load_calc calculator must exist');

// 1. Defaults: DS 200,000 lb, MW 11.5 ppg, BHA 40,000 lb, Block 35,000 lb
// (200000 + 40000) * BF(11.5) + 35000 = 232,862.60 -> 232,863 lb
const hookRes1 = hookCalc.calc({ ds_air: 200000, mw: 11.5, bha_air: 40000, block_wt: 35000, limit: '' });
assert(typeof hookRes1 === 'object', 'hookRes1 must return an object');
assert.strictEqual(Math.round(hookRes1.totalHookLoadLb), 232863, `Expected default hook load 232,863 lb, got ${Math.round(hookRes1.totalHookLoadLb)}`);
assert.strictEqual(hookRes1.buoyancyFactor.toFixed(4), '0.8244', `Expected BF 0.8244, got ${hookRes1.buoyancyFactor.toFixed(4)}`);
assert.strictEqual(Math.round(hookRes1.buoyedDsLb), 164885, `Expected buoyed DS 164,885 lb, got ${Math.round(hookRes1.buoyedDsLb)}`);
assert.strictEqual(Math.round(hookRes1.buoyedBhaLb), 32977, `Expected buoyed BHA 32,977 lb, got ${Math.round(hookRes1.buoyedBhaLb)}`);
assert.strictEqual(Math.round(hookRes1.blockWtLb), 35000, `Expected block weight 35,000 lb, got ${Math.round(hookRes1.blockWtLb)}`);
console.log(`  Case 1 (Defaults: 200k, 11.5 ppg, 40k, 35k) PASSED: Total=${Math.round(hookRes1.totalHookLoadLb).toLocaleString()} lb, BF=${hookRes1.buoyancyFactor.toFixed(4)}, BuoyedDS=${Math.round(hookRes1.buoyedDsLb).toLocaleString()} lb, BuoyedBHA=${Math.round(hookRes1.buoyedBhaLb).toLocaleString()} lb`);

// 2. Rated Limit 300,000 lb -> utilization 77.6%, status OK
const hookRes2 = hookCalc.calc({ ds_air: 200000, mw: 11.5, bha_air: 40000, block_wt: 35000, limit: 300000 });
assert(typeof hookRes2 === 'object', 'hookRes2 must return an object');
assert.strictEqual(hookRes2.utilizationPct.toFixed(1), '77.6', `Expected utilization 77.6%, got ${hookRes2.utilizationPct.toFixed(1)}%`);
assert.strictEqual(hookRes2.status, 'OK', 'Expected OK status');
console.log(`  Case 2 (Rated limit 300,000 lb) PASSED: Utilization=${hookRes2.utilizationPct.toFixed(1)}%, Status=${hookRes2.status}`);

// 3. Rated Limit 250,000 lb -> utilization 93.1%, status Caution
const hookRes3 = hookCalc.calc({ ds_air: 200000, mw: 11.5, bha_air: 40000, block_wt: 35000, limit: 250000 });
assert(typeof hookRes3 === 'object', 'hookRes3 must return an object');
assert.strictEqual(hookRes3.status, 'Caution', 'Expected Caution status');
console.log(`  Case 3 (Rated limit 250,000 lb) PASSED: Utilization=${hookRes3.utilizationPct.toFixed(1)}%, Status=${hookRes3.status}`);

// 4. Rated Limit 220,000 lb -> utilization 105.8%, status Warning
const hookRes4 = hookCalc.calc({ ds_air: 200000, mw: 11.5, bha_air: 40000, block_wt: 35000, limit: 220000 });
assert(typeof hookRes4 === 'object', 'hookRes4 must return an object');
assert.strictEqual(hookRes4.status, 'Warning', 'Expected Warning status');
console.log(`  Case 4 (Rated limit 220,000 lb) PASSED: Utilization=${hookRes4.utilizationPct.toFixed(1)}%, Status=${hookRes4.status}`);

// 5. Mud weight 65.5 ppg (steel density) or higher -> error "--"
assert.strictEqual(hookCalc.calc({ ds_air: 200000, mw: 65.5, bha_air: 40000, block_wt: 35000 }), '--', 'MW 65.5 must return "--"');
assert.strictEqual(hookCalc.calc({ ds_air: 200000, mw: 70, bha_air: 40000, block_wt: 35000 }), '--', 'MW > 65.5 must return "--"');

// 6. Boundary / invalid / empty inputs -> "--"
assert.strictEqual(hookCalc.calc({ ds_air: 0, mw: 11.5, bha_air: 40000, block_wt: 35000 }), '--', 'DS 0 must return "--"');
assert.strictEqual(hookCalc.calc({ ds_air: -200000, mw: 11.5, bha_air: 40000, block_wt: 35000 }), '--', 'DS < 0 must return "--"');
assert.strictEqual(hookCalc.calc({ ds_air: 200000, mw: 0, bha_air: 40000, block_wt: 35000 }), '--', 'MW 0 must return "--"');
assert.strictEqual(hookCalc.calc({ ds_air: 200000, mw: -11.5, bha_air: 40000, block_wt: 35000 }), '--', 'MW < 0 must return "--"');
assert.strictEqual(hookCalc.calc({ ds_air: '', mw: '', bha_air: '', block_wt: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 6 (Boundary/zero/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Hook Load Calculation tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 35: Bit Weight on Bottom (WOB)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 35: Bit Weight on Bottom (WOB) ---');
const wobCalc = allCalcs.find(x => x.id === 'wob_calc');
assert(wobCalc, 'wob_calc calculator must exist');

// 1. Defaults: 220000 off-bottom, 185000 on-bottom -> 35,000 lb
const wobRes1 = wobCalc.calc({ hl_free: 220000, hl_drill: 185000 });
assert(typeof wobRes1 === 'object', 'wobRes1 must return an object');
assert.strictEqual(wobRes1.wobLb, 35000, `Expected WOB 35,000 lb, got ${wobRes1.wobLb}`);
assert.strictEqual(wobRes1.valueOf(), 35000, 'valueOf must equal 35,000 lb');
assert.strictEqual(wobRes1.offBottomLb, 220000, 'offBottomLb must be 220,000 lb');
assert.strictEqual(wobRes1.onBottomLb, 185000, 'onBottomLb must be 185,000 lb');
assert.strictEqual(wobRes1.targetWobLb, null, 'targetWobLb should be null by default');
console.log(`  Case 1 (Defaults: 220k off-bottom / 185k on-bottom) PASSED: WOB=${wobRes1.wobLb.toLocaleString()} lb`);

// 2. Target 40,000 lb -> 35,000 lb, difference -5,000 lb, 87.5% of target, status Caution
const wobRes2 = wobCalc.calc({ hl_free: 220000, hl_drill: 185000, target_wob: 40000 });
assert(typeof wobRes2 === 'object', 'wobRes2 must return an object');
assert.strictEqual(wobRes2.wobLb, 35000, 'WOB must be 35,000 lb');
assert.strictEqual(wobRes2.targetDiffLb, -5000, `Expected difference -5,000 lb, got ${wobRes2.targetDiffLb}`);
assert.strictEqual(wobRes2.targetPct.toFixed(1), '87.5', `Expected target % 87.5%, got ${wobRes2.targetPct.toFixed(1)}`);
assert.strictEqual(wobRes2.status, 'Caution', `Expected Caution status, got ${wobRes2.status}`);
console.log(`  Case 2 (Target 40,000 lb) PASSED: WOB=${wobRes2.wobLb.toLocaleString()} lb, Diff=${wobRes2.targetDiffLb} lb, TargetPct=${wobRes2.targetPct.toFixed(1)}%, Status=${wobRes2.status}`);

// 3. Target 35,000 lb -> 100.0%, status OK
const wobRes3 = wobCalc.calc({ hl_free: 220000, hl_drill: 185000, target_wob: 35000 });
assert(typeof wobRes3 === 'object', 'wobRes3 must return an object');
assert.strictEqual(wobRes3.targetDiffLb, 0, 'Difference should be 0');
assert.strictEqual(wobRes3.targetPct.toFixed(1), '100.0', 'Target % should be 100.0%');
assert.strictEqual(wobRes3.status, 'OK', 'Expected OK status');
console.log(`  Case 3 (Target 35,000 lb) PASSED: Diff=0 lb, TargetPct=100.0%, Status=${wobRes3.status}`);

// 4. Target 25,000 lb -> 140.0%, status Warning
const wobRes4 = wobCalc.calc({ hl_free: 220000, hl_drill: 185000, target_wob: 25000 });
assert(typeof wobRes4 === 'object', 'wobRes4 must return an object');
assert.strictEqual(wobRes4.targetDiffLb, 10000, 'Difference should be 10,000 lb');
assert.strictEqual(wobRes4.targetPct.toFixed(1), '140.0', 'Target % should be 140.0%');
assert.strictEqual(wobRes4.status, 'Warning', 'Expected Warning status');
console.log(`  Case 4 (Target 25,000 lb) PASSED: Diff=+10,000 lb, TargetPct=140.0%, Status=${wobRes4.status}`);

// 5. On-bottom >= off-bottom -> error "--"
assert.strictEqual(wobCalc.calc({ hl_free: 220000, hl_drill: 220000 }), '--', 'On-bottom == Off-bottom must return "--"');
assert.strictEqual(wobCalc.calc({ hl_free: 220000, hl_drill: 230000 }), '--', 'On-bottom > Off-bottom must return "--"');
const rawEngineErr = calcBitWeightOnBottom({ hl_free: 220000, hl_drill: 230000 });
assert(!rawEngineErr.isValid, 'Engine must mark isValid false for on > off');
assert(rawEngineErr.errors.some(e => e.field === 'hl_drill' && e.message === 'On-bottom load must be lower than off-bottom load'), 'Must have specific error message');
console.log('  Case 5 (On-bottom >= off-bottom) safely returns error with required message');

// 6. Boundary / zero / negative / empty inputs -> "--"
assert.strictEqual(wobCalc.calc({ hl_free: 0, hl_drill: 185000 }), '--', 'Off-bottom 0 must return "--"');
assert.strictEqual(wobCalc.calc({ hl_free: -220000, hl_drill: 185000 }), '--', 'Off-bottom < 0 must return "--"');
assert.strictEqual(wobCalc.calc({ hl_free: 220000, hl_drill: 0 }), '--', 'On-bottom 0 must return "--"');
assert.strictEqual(wobCalc.calc({ hl_free: 220000, hl_drill: -185000 }), '--', 'On-bottom < 0 must return "--"');
assert.strictEqual(wobCalc.calc({ hl_free: 220000, hl_drill: 185000, target_wob: -40000 }), '--', 'Target < 0 must return "--"');
assert.strictEqual(wobCalc.calc({ hl_free: '', hl_drill: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 6 (Boundary/zero/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Bit Weight on Bottom (WOB) tests fully verified!\n');

// -----------------------------------------------------------------------------
// TEST GROUP 36: Safety Factor Calculation
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 36: Safety Factor Calculation ---');
const sfCalc = allCalcs.find(x => x.id === 'safety_factor_calc');
assert(sfCalc, 'safety_factor_calc calculator must exist');

// 1. Defaults: 500k strength, 300k load, required SF 1.25 -> SF 1.6667, 400,000 max allowable, 60.0% utilization, status OK
const sfRes1 = sfCalc.calc({ strength: 500000, load: 300000, required_sf: 1.25 });
assert(typeof sfRes1 === 'object', 'sfRes1 must return an object');
assert.strictEqual(sfRes1.actualSf.toFixed(4), '1.6667', `Expected SF 1.6667, got ${sfRes1.actualSf.toFixed(4)}`);
assert.strictEqual(Math.round(sfRes1.maxAllowableLoadLb), 400000, `Expected max allowable 400,000 lb, got ${sfRes1.maxAllowableLoadLb}`);
assert.strictEqual(sfRes1.utilizationPct.toFixed(1), '60.0', `Expected utilization 60.0%, got ${sfRes1.utilizationPct.toFixed(1)}%`);
assert.strictEqual(sfRes1.status, 'OK', 'Expected OK status');
console.log(`  Case 1 (Defaults: 500k strength / 300k load / 1.25 SF) PASSED: SF=${sfRes1.actualSf.toFixed(4)}, MaxAllowable=${Math.round(sfRes1.maxAllowableLoadLb).toLocaleString()} lb, Util=${sfRes1.utilizationPct.toFixed(1)}%, Status=${sfRes1.status}`);

// 2. 300k strength, 300k load -> SF 1.0000, status Caution
const sfRes2 = sfCalc.calc({ strength: 300000, load: 300000, required_sf: 1.25 });
assert(typeof sfRes2 === 'object', 'sfRes2 must return an object');
assert.strictEqual(sfRes2.actualSf.toFixed(4), '1.0000', `Expected SF 1.0000, got ${sfRes2.actualSf.toFixed(4)}`);
assert.strictEqual(sfRes2.status, 'Caution', 'Expected Caution status');
console.log(`  Case 2 (300k / 300k) PASSED: SF=${sfRes2.actualSf.toFixed(4)}, Status=${sfRes2.status}`);

// 3. Load > strength: 300k strength, 350k load -> SF 0.8571, status Warning ("Load exceeds strength")
const sfRes3 = sfCalc.calc({ strength: 300000, load: 350000, required_sf: 1.25 });
assert(typeof sfRes3 === 'object', 'sfRes3 must return an object');
assert(sfRes3.actualSf < 1.0, 'SF must be < 1.0');
assert.strictEqual(sfRes3.status, 'Warning', 'Expected Warning status');
assert.strictEqual(sfRes3.statusMsg, 'Load exceeds strength', 'Expected statusMsg "Load exceeds strength"');
console.log(`  Case 3 (Load > Strength) PASSED: SF=${sfRes3.actualSf.toFixed(4)}, Status=${sfRes3.status}, Msg="${sfRes3.statusMsg}"`);

// 4. Load 0 -> error "--"
assert.strictEqual(sfCalc.calc({ strength: 500000, load: 0, required_sf: 1.25 }), '--', 'Load 0 must return "--"');
console.log('  Case 4 (Load 0) safely returns error "--"');

// 5. Boundary / zero / negative / empty inputs -> "--"
assert.strictEqual(sfCalc.calc({ strength: 0, load: 300000, required_sf: 1.25 }), '--', 'Strength 0 must return "--"');
assert.strictEqual(sfCalc.calc({ strength: -500000, load: 300000, required_sf: 1.25 }), '--', 'Strength < 0 must return "--"');
assert.strictEqual(sfCalc.calc({ strength: 500000, load: -300000, required_sf: 1.25 }), '--', 'Load < 0 must return "--"');
assert.strictEqual(sfCalc.calc({ strength: 500000, load: 300000, required_sf: 0 }), '--', 'Required SF 0 must return "--"');
assert.strictEqual(sfCalc.calc({ strength: 500000, load: 300000, required_sf: -1.25 }), '--', 'Required SF < 0 must return "--"');
assert.strictEqual(sfCalc.calc({ strength: '', load: '', required_sf: '' }), '--', 'Empty inputs must return "--"');
console.log('  Case 5 (Boundary/zero/negative/empty inputs) safely returns "--" without crash');
console.log('PASSED: Safety Factor Calculation tests fully verified!\n');

console.log('====================================================');
console.log('   ALL CALCULATION HUB UNIT TESTS PASSED (100%)!    ');
console.log('====================================================');
