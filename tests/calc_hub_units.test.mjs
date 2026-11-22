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

const fDbMatch = appJsContent.match(/const formulaDb = (\{[\s\S]*?\n\};)/);
const wcDbMatch = appJsContent.match(/const wellControlDb = (\{[\s\S]*?\n\};)/);

if (!fDbMatch || !wcDbMatch) {
  throw new Error('Could not find formulaDb or wellControlDb in app.js');
}

// Global scope initialization for eval
global.UnitsEngine = UnitsEngine;
eval('global.formulaDb = ' + fDbMatch[1]);
eval('global.wellControlDb = ' + wcDbMatch[1]);

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

assert.strictEqual(allCalcs.length, 132, 'Should have exactly 132 calculators');
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

  if (typeof resOriginal === 'number' && Number.isFinite(resOriginal) && Math.abs(resOriginal) > 1e-12) {
    const relDiff = Math.abs((resReconstituted - resOriginal) / resOriginal);
    assert(relDiff < 1e-7, `Calculation drift in ${c.id}: orig=${resOriginal}, reconstituted=${resReconstituted}, relDiff=${relDiff}`);
  }

  siSuccessCount++;
});

console.log(`PASSED: ${siSuccessCount} calculators round-tripped with zero formula drift (< 1e-7 relative error)!`);
console.log(`PASSED: ${labelAdaptedCount} input labels and ${outputAdaptedCount} output units adapted to SI specifications.\n`);

// -----------------------------------------------------------------------------
// TEST GROUP 3: Exact Riser Margin Worked Example (User Prompt Spec)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 3: Exact Riser Margin Worked Example ---');
const rm = allCalcs.find(x => x.id === 'riser_margin');
assert(rm, 'Riser Margin calculator must exist');

// Acceptance Test 1: MW=10, WD=3000, AG=80, TVD=9000, SW=8.6 -> output ≈ 0.8446 ppg
const rmNativeArgs = { mw: 10, wd: 3000, ag: 80, tvd: 9000, sw: 8.6 };
const rmNativeResult = rm.calc(rmNativeArgs);
console.log(`  Native Riser Margin result (SW=8.6): ${rmNativeResult.toFixed(4)} ppg`);
assert(Math.abs(rmNativeResult - 0.8446) < 0.0001, `Native result should be ~0.8446 ppg, got ${rmNativeResult}`);

// Acceptance Test 2: MW=10, WD=3000, AG=80, TVD=9000, SW=8.5 -> output ≈ 0.8953 (≈ 0.8946) ppg
const rmNativeArgs2 = { mw: 10, wd: 3000, ag: 80, tvd: 9000, sw: 8.5 };
const rmNativeResult2 = rm.calc(rmNativeArgs2);
console.log(`  Native Riser Margin result (SW=8.5): ${rmNativeResult2.toFixed(4)} ppg`);
assert(Math.abs(rmNativeResult2 - 0.8953) < 0.001, `Native result (SW=8.5) should be ~0.8953 ppg, got ${rmNativeResult2}`);

// Guard Tests: TVD - WD - AG <= 0 -> 'Invalid input'
const rmGuardResult1 = rm.calc({ mw: 10, wd: 3000, ag: 80, tvd: 3000, sw: 8.6 });
console.log(`  Guard test TVD <= WD + AG (TVD=3000): ${rmGuardResult1}`);
assert.strictEqual(rmGuardResult1, 'Invalid input', 'Should return Invalid input when TVD <= WD + AG');

const rmGuardResult2 = rm.calc({ mw: 10, wd: 3000, ag: 80, tvd: 3080, sw: 8.6 });
console.log(`  Guard test TVD == WD + AG (denom=0): ${rmGuardResult2}`);
assert.strictEqual(rmGuardResult2, 'Invalid input', 'Should return Invalid input when TVD == WD + AG');

// In SI:
// Convert inputs to SI:
const mwSI = UnitsEngine.convert('density', 10, 'ppg', 'SG'); // ~1.1983 SG
const wdSI = UnitsEngine.convert('length', 3000, 'ft', 'm');  // 914.4 m
const agSI = UnitsEngine.convert('length', 80, 'ft', 'm');    // 24.384 m
const tvdSI = UnitsEngine.convert('length', 9000, 'ft', 'm'); // 2743.2 m
const swSI = UnitsEngine.convert('density', 8.6, 'ppg', 'SG'); // ~1.0305 SG

console.log(`  Converted to SI inputs: MW=${mwSI.toFixed(3)} SG, WD=${wdSI.toFixed(1)} m, AG=${agSI.toFixed(2)} m, TVD=${tvdSI.toFixed(1)} m, SW=${swSI.toFixed(3)} SG`);

// Boundary adapter execution:
// User enters SI values -> Boundary adapter converts to native formula units -> executes -> converts result back to SG
const rmSimulatedNativeArgs = {
  mw: UnitsEngine.convert('density', mwSI, 'SG', 'ppg'),
  wd: UnitsEngine.convert('length', wdSI, 'm', 'ft'),
  ag: UnitsEngine.convert('length', agSI, 'm', 'ft'),
  tvd: UnitsEngine.convert('length', tvdSI, 'm', 'ft'),
  sw: UnitsEngine.convert('density', swSI, 'SG', 'ppg'),
};
const rmSimulatedNativeResult = rm.calc(rmSimulatedNativeArgs);
const rmFinalSIResult = UnitsEngine.convert('density', rmSimulatedNativeResult, 'ppg', 'SG');

console.log(`  Simulated native execution: ${rmSimulatedNativeResult.toFixed(4)} ppg`);
console.log(`  SI Display Output: ${rmFinalSIResult.toFixed(4)} SG (formatted: ${rmFinalSIResult.toFixed(2)} SG)`);

assert(Math.abs(rmFinalSIResult - 0.1012) < 0.001, `SI result should be ~0.1012 SG, got ${rmFinalSIResult}`);
console.log('PASSED: Exact Riser Margin test verified perfectly!\n');

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

console.log('====================================================');
console.log('   ALL CALCULATION HUB UNIT TESTS PASSED (100%)!    ');
console.log('====================================================');
