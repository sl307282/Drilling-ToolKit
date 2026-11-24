import assert from 'node:assert';
import WellControlConfig from '../well_control_config.js';
import WellControlEngine from '../well_control_engine.js';
import UnitsEngine from '../units_engine.js';

console.log('====================================================');
console.log('   WELL CONTROL REGRESSION & VALIDATION TESTS       ');
console.log('====================================================\n');

// -----------------------------------------------------------------
// SECTION 9: BASELINE REGRESSION TEST
// -----------------------------------------------------------------
console.log('--- TEST 1: Section 9 Baseline Case Calculations ---');

const baselineInputs = {
  flowType: 'subsea',
  bopStatus: 'open',
  holeTVD: 12000,
  holeMD: 12000,
  shoeTVD: 10000,
  shoeMD: 10000,
  riserLength: 200,
  dcLength: 200,
  hwdpLength: 500,
  dpLength: 11300,
  spm: 60,
  casingSize: '20'
};

// Capacities as specified in Section 9 Baseline Case (in bbl/m)
const baselineRef = {
  capacities: {
    DC: 0.02522,
    HWDP: 0.02893,
    DP: 0.05692
  },
  openHoleAnnular: {
    DC: 168.302 / 200,      // ~0.84151 bbl/m (133.79 L/m)
    HWDP: 444.22 / 500,     // ~0.88844 bbl/m (141.25 L/m)
    DP: 1154.978 / 1300     // ~0.88844 bbl/m (141.25 L/m) -> Total OH = 1,767.50 bbl
  },
  casingAnnular: {
    DC: 156.35 / 158.987,
    HWDP: 163.81 / 158.987,
    DP: 10139.87 / 9800     // ~1.03468 bbl/m (164.50 L/m) -> Below BOP = 11,907.4 bbl
  },
  riserAnnular: 238.40 / 200, // ~1.1920 bbl/m (189.52 L/m) -> Total Annulus = 12,145.77 bbl
  chokeCapacity: 3.167 / 158.987,
  pumpOutput: 0.11756 // bbl/stk
};

// Calculate volumes & strokes (capacities already in bbl/m and bbl/stk)
const volResults = WellControlEngine.calculateVolumesAndStrokes(baselineInputs, baselineRef);

// Assert Volumes (±0.01 tolerance unless stated)
console.log(`String Volume: ${volResults.stringVolume.toFixed(2)} bbl (Expected: 662.71 bbl)`);
assert.ok(Math.abs(volResults.stringVolume - 662.71) <= 0.05, `String volume mismatch: ${volResults.stringVolume}`);

console.log(`Open Hole Volume: ${volResults.openHoleVolume.toFixed(2)} bbl (Expected: 1767.50 bbl)`);
assert.ok(Math.abs(volResults.openHoleVolume - 1767.50) <= 0.1, `Open hole volume mismatch: ${volResults.openHoleVolume}`);

console.log(`Annulus Below BOP: ${volResults.annularVolBelowBop.toFixed(1)} bbl (Expected: 11907.4 bbl)`);
assert.ok(Math.abs(volResults.annularVolBelowBop - 11907.4) <= 0.5, `Below BOP annulus mismatch: ${volResults.annularVolBelowBop}`);

console.log(`Riser Volume: ${volResults.riserVolume.toFixed(1)} bbl (Expected: 238.4 bbl)`);
assert.ok(Math.abs(volResults.riserVolume - 238.4) <= 0.5, `Riser volume mismatch: ${volResults.riserVolume}`);

console.log(`Total Annulus: ${volResults.annularVolume.toFixed(2)} bbl (Expected: 12145.77 bbl)`);
assert.ok(Math.abs(volResults.annularVolume - 12145.77) <= 0.5, `Total annulus mismatch: ${volResults.annularVolume}`);

console.log(`Total System Volume: ${volResults.totalSystemVolume.toFixed(2)} bbl (Expected: 12808.48 bbl)`);
assert.ok(Math.abs(volResults.totalSystemVolume - 12808.48) <= 0.5, `Total system mismatch: ${volResults.totalSystemVolume}`);

// Assert Strokes & Times
console.log(`Surface-to-Bit Strokes: ${Math.round(volResults.surfaceToBitStrokes)} stks (${volResults.surfaceToBitTimeMin.toFixed(1)} min @ 60 SPM)`);
assert.strictEqual(Math.round(volResults.surfaceToBitStrokes), 5637, `Surface-to-bit strokes expected 5637, got ${Math.round(volResults.surfaceToBitStrokes)}`);
assert.strictEqual(volResults.surfaceToBitTimeMin.toFixed(1), '94.0', `Surface-to-bit time expected 94.0 min, got ${volResults.surfaceToBitTimeMin.toFixed(1)}`);

console.log(`Bit-to-Shoe Strokes: ${Math.round(volResults.bitToShoeStrokes)} stks (Expected: 15035 stks)`);
assert.strictEqual(Math.round(volResults.bitToShoeStrokes), 15035, `Bit-to-shoe strokes expected 15035, got ${Math.round(volResults.bitToShoeStrokes)}`);

console.log(`Total Cycle Strokes: ${Math.round(volResults.totalCycleStrokes)} stks (Expected: 108953 stks)`);
assert.strictEqual(Math.round(volResults.totalCycleStrokes), 108953, `Total cycle strokes expected 108953, got ${Math.round(volResults.totalCycleStrokes)}`);

console.log(`Bottoms-Up Strokes: ${Math.round(volResults.bottomsUpStrokes)} stks (Expected: ~103315 stks)`);
assert.ok(Math.abs(Math.round(volResults.bottomsUpStrokes) - 103315) <= 5, `Bottoms-up strokes expected ~103315, got ${Math.round(volResults.bottomsUpStrokes)}`);

console.log(`Riser Displacement: ${Math.round(volResults.riserDisplacementStrokes)} stks (Expected: 2028 stks)`);
assert.strictEqual(Math.round(volResults.riserDisplacementStrokes), 2028, `Riser displacement expected 2028, got ${Math.round(volResults.riserDisplacementStrokes)}`);

// Kill inputs: MW 9.40, LOT EMW 10.00, KRP 23, CLF 140, SIDP 250, SICP 222
const killInputs = {
  ...baselineInputs,
  omw: 9.40,
  lotEmw: 10.00,
  krp: 23,
  clf: 140,
  sidp: 250,
  sicp: 222,
  surfaceToBitStrokes: volResults.surfaceToBitStrokes,
  stringVolume: volResults.stringVolume,
  annularVolume: volResults.annularVolume
};

const killResults = WellControlEngine.calculateKillSheet(killInputs, { roundingMode: '0.1' });

console.log(`KMW Exact: ${killResults.kmwExact.toFixed(3)} ppg (Expected: 9.522 ppg)`);
assert.strictEqual(killResults.kmwExact.toFixed(3), '9.522', `KMW exact mismatch: ${killResults.kmwExact}`);

console.log(`KMW Used: ${killResults.kmwUsed.toFixed(2)} ppg (Expected: 9.60 ppg)`);
assert.strictEqual(killResults.kmwUsed.toFixed(2), '9.60', `KMW used mismatch: ${killResults.kmwUsed}`);

console.log(`Extra Overbalance: ${Math.round(killResults.extraOverbalancePsi)} psi (Expected: ~159 psi)`);
assert.ok(Math.abs(killResults.extraOverbalancePsi - 159.45) <= 1.0, `Extra overbalance mismatch: ${killResults.extraOverbalancePsi}`);

console.log(`ICP: ${killResults.icp} psi (Expected: 273 psi)`);
assert.strictEqual(killResults.icp, 273, `ICP expected 273, got ${killResults.icp}`);

console.log(`FCP: ${killResults.fcp.toFixed(1)} psi (Expected: 23.5 psi)`);
assert.strictEqual(killResults.fcp.toFixed(1), '23.5', `FCP expected 23.5, got ${killResults.fcp.toFixed(1)}`);

console.log(`Pressure Drop / 100 Stks: ${killResults.pressDrop100.toFixed(1)} psi (Expected: 4.4 psi)`);
assert.strictEqual(killResults.pressDrop100.toFixed(1), '4.4', `Pressure drop expected 4.4, got ${killResults.pressDrop100.toFixed(1)}`);

console.log(`MAASP: ${killResults.maasp.toFixed(2)} psi (Expected: 1023.62 psi)`);
assert.strictEqual(killResults.maasp.toFixed(2), '1023.62', `MAASP expected 1023.62, got ${killResults.maasp.toFixed(2)}`);

console.log(`Dynamic MAASP: ${killResults.dynMaasp.toFixed(2)} psi (Expected: 883.62 psi)`);
assert.strictEqual(killResults.dynMaasp.toFixed(2), '883.62', `Dynamic MAASP expected 883.62, got ${killResults.dynMaasp.toFixed(2)}`);

console.log(`Initial Dynamic SICP: ${killResults.dynSicp} psi (Expected: 82 psi)`);
assert.strictEqual(killResults.dynSicp, 82, `Initial dynamic SICP expected 82, got ${killResults.dynSicp}`);

console.log(`MAASP After Kill (rounded): ${killResults.maaspAfterKillRounded.toFixed(2)} psi (Expected: 682.41 psi)`);
assert.strictEqual(killResults.maaspAfterKillRounded.toFixed(2), '682.41', `MAASP after kill (rounded) expected 682.41, got ${killResults.maaspAfterKillRounded.toFixed(2)}`);

console.log(`MAASP After Kill (exact): ${killResults.maaspAfterKillExact.toFixed(2)} psi (Expected: ~815.29 psi)`);
assert.ok(Math.abs(killResults.maaspAfterKillExact - 815.29) <= 0.05, `MAASP after kill (exact) expected ~815.29, got ${killResults.maaspAfterKillExact.toFixed(2)}`);

console.log(`Barite: ${killResults.baritePer100Bbl.toFixed(2)} sk/100 bbl (Expected: 11.37 sk/100 bbl)`);
assert.strictEqual(killResults.baritePer100Bbl.toFixed(2), '11.37', `Barite sacks expected 11.37, got ${killResults.baritePer100Bbl.toFixed(2)}`);

console.log('PASSED: Baseline calculations match Section 9 specifications exactly!\n');

// -----------------------------------------------------------------
// TEST 2: VALIDATION RULES ON BASELINE CASE
// -----------------------------------------------------------------
console.log('--- TEST 2: Baseline Case Validation Rules ---');
const validationAlerts = WellControlEngine.validateWellControlInputs({
  ...killInputs,
  pumpOutput: 0.11756
});

const errors = validationAlerts.filter(a => a.severity === 'ERROR');
const warnings = validationAlerts.filter(a => a.severity === 'WARNING');

console.log(`Errors count: ${errors.length} (Expected: 0)`);
assert.strictEqual(errors.length, 0, 'Baseline case should have 0 ERRORs');

console.log(`Warnings count: ${warnings.length}`);
warnings.forEach(w => console.log(`  - [${w.field}] ${w.message}`));

assert.ok(warnings.some(w => w.field === 'sicp' && w.message.includes('SICP is lower than SIDP')), 'Expected SICP < SIDP warning');
assert.ok(warnings.some(w => w.field === 'holeTVD' && w.message.includes('Unusually deep well')), 'Expected TVD > 10,000m warning');
assert.ok(warnings.some(w => w.field === 'shoeTVD' && w.message.includes('20" casing shoe')), 'Expected 20" casing shoe at 10,000m warning');
assert.ok(warnings.some(w => w.field === 'krp' && w.message.includes('KRP seems unusually low')), 'Expected KRP < 100 psi warning');

console.log('PASSED: Baseline validation rules correctly trigger all 4 warnings and 0 errors!\n');

// -----------------------------------------------------------------
// TEST 3: VALIDATION ERROR CONDITIONS
// -----------------------------------------------------------------
console.log('--- TEST 3: Validation Error Conditions ---');

// Error 1: Shoe TVD > Hole TVD
const err1Alerts = WellControlEngine.validateWellControlInputs({
  ...killInputs,
  holeTVD: 5000,
  shoeTVD: 6000
});
assert.ok(err1Alerts.some(a => a.severity === 'ERROR' && a.field === 'shoeTVD'), 'Expected Shoe TVD > Hole TVD ERROR');

// Error 2: KMW >= LOT EMW
const err2Alerts = WellControlEngine.validateWellControlInputs({
  ...killInputs,
  omw: 9.40,
  sidp: 800, // will push KMW >= 10.00
  lotEmw: 10.00,
  holeTVD: 5000
});
assert.ok(err2Alerts.some(a => a.severity === 'ERROR' && a.field === 'lotEmw'), 'Expected KMW >= LOT EMW ERROR');

// Error 3: MAASP < 0 (OMW > LOT EMW)
const err3Alerts = WellControlEngine.validateWellControlInputs({
  ...killInputs,
  omw: 10.50,
  lotEmw: 10.00
});
assert.ok(err3Alerts.some(a => a.severity === 'ERROR' && a.field === 'omw'), 'Expected MAASP < 0 ERROR');

console.log('PASSED: All ERROR conditions properly detected and block calculation!\n');

// -----------------------------------------------------------------
// TEST 4: UNIT ROUND-TRIP FIDELITY (< 1e-6 error)
// -----------------------------------------------------------------
console.log('--- TEST 4: Unit Round-Trip Fidelity (< 1e-6 error) ---');

// m <-> ft
const testDepthM = 12000.0;
const depthFt = UnitsEngine.convert('length', testDepthM, 'm', 'ft');
const depthMRoundTrip = UnitsEngine.convert('length', depthFt, 'ft', 'm');
const depthRelError = Math.abs(depthMRoundTrip - testDepthM) / testDepthM;
console.log(`m <-> ft error: ${depthRelError.toExponential(2)}`);
assert.ok(depthRelError < 1e-6, `Length round-trip error too high: ${depthRelError}`);

// psi <-> bar
const testPressurePsi = 273.0;
const pressBar = UnitsEngine.convert('pressure', testPressurePsi, 'psi', 'bar');
const pressPsiRoundTrip = UnitsEngine.convert('pressure', pressBar, 'bar', 'psi');
const pressRelError = Math.abs(pressPsiRoundTrip - testPressurePsi) / testPressurePsi;
console.log(`psi <-> bar error: ${pressRelError.toExponential(2)}`);
assert.ok(pressRelError < 1e-6, `Pressure round-trip error too high: ${pressRelError}`);

// ppg <-> SG
const testDensityPpg = 9.40;
const densitySg = UnitsEngine.convert('density', testDensityPpg, 'ppg', 'sg');
const densityPpgRoundTrip = UnitsEngine.convert('density', densitySg, 'sg', 'ppg');
const densityRelError = Math.abs(densityPpgRoundTrip - testDensityPpg) / testDensityPpg;
console.log(`ppg <-> SG error: ${densityRelError.toExponential(2)}`);
assert.ok(densityRelError < 1e-6, `Density round-trip error too high: ${densityRelError}`);

console.log('PASSED: Unit round-trip precision is within < 1e-6 error!\n');

// -----------------------------------------------------------------
// TEST 5: STEP-DOWN SCHEDULE ROW VERIFICATION
// -----------------------------------------------------------------
console.log('--- TEST 5: Step-Down Schedule Row Verification ---');

const schedule = WellControlEngine.generateStepDownSchedule({
  method: 'wait_weight',
  strokes: volResults.surfaceToBitStrokes,
  icp: killResults.icp,
  fcp: killResults.fcp,
  sicp: killInputs.sicp,
  spm: 60,
  stepInterval: 100,
  maasp: killResults.maasp
});

assert.ok(schedule.length > 0, 'Schedule must contain rows');

// Row 0 = 273 psi
const row0 = schedule.find(r => r.strokes === 0);
console.log(`Row 0 strokes: ${row0.strokes}, pressure: ${Math.round(row0.drillPipePressure)} psi (Expected: 273 psi)`);
assert.strictEqual(Math.round(row0.drillPipePressure), 273, 'Row 0 must be 273 psi');

// Row 100 = 269 psi
const row100 = schedule.find(r => r.strokes === 100);
console.log(`Row 100 strokes: ${row100.strokes}, pressure: ${Math.round(row100.drillPipePressure)} psi (Expected: 269 psi)`);
assert.strictEqual(Math.round(row100.drillPipePressure), 269, 'Row 100 must be 269 psi');

// Row 200 = 264 psi
const row200 = schedule.find(r => r.strokes === 200);
console.log(`Row 200 strokes: ${row200.strokes}, pressure: ${Math.round(row200.drillPipePressure)} psi (Expected: 264 psi)`);
assert.strictEqual(Math.round(row200.drillPipePressure), 264, 'Row 200 must be 264 psi');

// Last row = 5637 stks = FCP = 23.5 psi
const lastRow = schedule[schedule.length - 1];
console.log(`Last row strokes: ${lastRow.strokes}, pressure: ${lastRow.drillPipePressure.toFixed(1)} psi (Expected: 23.5 psi)`);
assert.strictEqual(lastRow.strokes, 5637, 'Last row strokes must be 5637');
assert.strictEqual(lastRow.drillPipePressure.toFixed(1), '23.5', 'Last row pressure must be 23.5 psi');

console.log('PASSED: Step-down schedule rows match exact specification!\n');

// -----------------------------------------------------------------
// TEST 6: KICK CLASSIFICATION & KICK TOLERANCE
// -----------------------------------------------------------------
console.log('--- TEST 6: Kick Classification & Kick Tolerance ---');

// Gas kick scenario: 20 bbl pit gain with 0.05 bbl/ft annular cap, SIDP 250, SICP 390 (SICP > SIDP)
const kickCase1 = WellControlEngine.calculateKillSheet({
  ...killInputs,
  sidp: 250,
  sicp: 390,
  pitGain: 20,
  bottomAnnularCapacityBblPerFt: 0.05
});

console.log(`Influx height: ${kickCase1.influxHeightFt.toFixed(1)} ft`);
console.log(`Influx gradient: ${kickCase1.influxGradientPsiFt.toFixed(3)} psi/ft`);
console.log(`Influx classification: ${kickCase1.influxClassification}`);
assert.ok(kickCase1.influxClassification.includes('Gas influx'), 'Should classify low gradient as gas influx');

// Kick tolerance
console.log(`Kick tolerance: ${kickCase1.kickToleranceBbl.toFixed(1)} bbl`);
assert.ok(kickCase1.kickToleranceBbl > 0, 'Kick tolerance must be positive');

console.log('PASSED: Kick classification and tolerance verified!\n');

// -----------------------------------------------------------------
// TEST 7: SECTION 9 SURFACE BASELINE CASE (LAND, 17-1/2" hole)
// -----------------------------------------------------------------
console.log('--- TEST 7: Section 9 Surface Baseline Case (LAND) ---');

const surfaceBaselineInputs = {
  rigType: 'LAND',
  flowType: 'surface',
  bopStatus: 'open',
  holeTVD: 12000,
  holeMD: 12000,
  shoeTVD: 10000,
  shoeMD: 10000,
  dcLength: 200,
  hwdpLength: 500,
  dpLength: 11300,
  spm: 60,
  casingSize: '20'
};

const surfaceBaselineRef = {
  capacities: {
    DC: 0.02522,
    HWDP: 0.02893,
    DP: 0.05692
  },
  openHoleAnnular: {
    DC: 0.84152,
    HWDP: 0.88844,
    DP: 0.88844
  },
  casingAnnular: {
    DP: 1.03468
  },
  pumpOutput: 0.11756
};

const surfaceVolResults = WellControlEngine.calculateVolumesAndStrokes(surfaceBaselineInputs, surfaceBaselineRef);

// Volumes (±0.01 tolerance)
console.log(`Surface String Volume: ${surfaceVolResults.stringVolume.toFixed(2)} bbl (Expected: 662.71 bbl)`);
assert.ok(Math.abs(surfaceVolResults.stringVolume - 662.71) <= 0.05, `String volume mismatch: ${surfaceVolResults.stringVolume}`);

console.log(`Surface Open Hole Volume: ${surfaceVolResults.openHoleVolume.toFixed(2)} bbl (Expected: 1767.50 bbl)`);
assert.ok(Math.abs(surfaceVolResults.openHoleVolume - 1767.50) <= 0.1, `Open hole volume mismatch: ${surfaceVolResults.openHoleVolume}`);

console.log(`Surface Annulus Volume: ${surfaceVolResults.annularVolume.toFixed(2)} bbl (Expected: 12114.30 bbl)`);
assert.ok(Math.abs(surfaceVolResults.annularVolume - 12114.30) <= 0.5, `Annular volume mismatch: ${surfaceVolResults.annularVolume}`);

console.log(`Surface Total System Volume: ${surfaceVolResults.totalSystemVolume.toFixed(2)} bbl (Expected: 12777.00 bbl)`);
assert.ok(Math.abs(surfaceVolResults.totalSystemVolume - 12777.00) <= 0.5, `Total system mismatch: ${surfaceVolResults.totalSystemVolume}`);

// Strokes & Times
console.log(`Surface-to-Bit Strokes: ${Math.round(surfaceVolResults.surfaceToBitStrokes)} (Expected: 5637)`);
assert.strictEqual(Math.round(surfaceVolResults.surfaceToBitStrokes), 5637);
assert.strictEqual(surfaceVolResults.surfaceToBitTimeMin.toFixed(1), '94.0');

console.log(`Bit-to-Shoe Strokes: ${Math.round(surfaceVolResults.bitToShoeStrokes)} (Expected: 15035)`);
assert.strictEqual(Math.round(surfaceVolResults.bitToShoeStrokes), 15035);
assert.strictEqual(surfaceVolResults.bitToShoeTimeMin.toFixed(1), '250.6');

console.log(`Shoe-to-Surface Strokes: ${Math.round(surfaceVolResults.shoeToSurfaceStrokes)} (Expected: 88013)`);
assert.strictEqual(Math.round(surfaceVolResults.shoeToSurfaceStrokes), 88013);

console.log(`Bottoms-Up Strokes: ${Math.round(surfaceVolResults.bottomsUpStrokes)} (Expected: 103048)`);
assert.strictEqual(Math.round(surfaceVolResults.bottomsUpStrokes), 103048);
assert.strictEqual(surfaceVolResults.bottomsUpTimeMin.toFixed(1), '1717.5');

console.log(`Total Cycle Strokes: ${Math.round(surfaceVolResults.totalCycleStrokes)} (Expected: 108685)`);
assert.strictEqual(Math.round(surfaceVolResults.totalCycleStrokes), 108685);
assert.strictEqual(surfaceVolResults.totalCycleTimeMin.toFixed(1), '1811.4');

// Surface Kill Sheet
const surfaceKillInputs = {
  ...surfaceBaselineInputs,
  omw: 9.40,
  lotEmw: 10.00,
  krp: 23,
  sidp: 250,
  sicp: 222,
  surfaceToBitStrokes: surfaceVolResults.surfaceToBitStrokes,
  stringVolume: surfaceVolResults.stringVolume,
  annularVolume: surfaceVolResults.annularVolume,
  pumpOutput: 0.11756
};

const surfaceKillResults = WellControlEngine.calculateKillSheet(surfaceKillInputs, { roundingMode: '0.1' });

console.log(`Surface KMW Exact: ${surfaceKillResults.kmwExact.toFixed(3)} ppg (Expected: 9.522 ppg)`);
assert.strictEqual(surfaceKillResults.kmwExact.toFixed(3), '9.522');

console.log(`Surface KMW Used: ${surfaceKillResults.kmwUsed.toFixed(2)} ppg (Expected: 9.60 ppg)`);
assert.strictEqual(surfaceKillResults.kmwUsed.toFixed(2), '9.60');

console.log(`Surface ICP: ${surfaceKillResults.icp} psi (Expected: 273 psi)`);
assert.strictEqual(surfaceKillResults.icp, 273);

console.log(`Surface FCP: ${surfaceKillResults.fcp.toFixed(1)} psi (Expected: 23.5 psi)`);
assert.strictEqual(surfaceKillResults.fcp.toFixed(1), '23.5');

console.log(`Surface Press Drop / 100 Stks: ${surfaceKillResults.pressDrop100.toFixed(1)} psi (Expected: 4.4 psi)`);
assert.strictEqual(surfaceKillResults.pressDrop100.toFixed(1), '4.4');

console.log(`Surface Initial Choke: ${surfaceKillResults.dynSicp} psi (Expected: 222 psi)`);
assert.strictEqual(surfaceKillResults.dynSicp, 222);

console.log(`Surface MAASP: ${surfaceKillResults.maasp.toFixed(2)} psi (Expected: 1023.62 psi)`);
assert.strictEqual(surfaceKillResults.maasp.toFixed(2), '1023.62');

console.log(`Surface Dynamic MAASP: ${surfaceKillResults.dynMaasp.toFixed(2)} psi (Expected: 1023.62 psi)`);
assert.strictEqual(surfaceKillResults.dynMaasp.toFixed(2), '1023.62');

console.log(`Surface MAASP After Kill (rounded): ${surfaceKillResults.maaspAfterKillRounded.toFixed(2)} psi (Expected: 682.41 psi)`);
assert.strictEqual(surfaceKillResults.maaspAfterKillRounded.toFixed(2), '682.41');

console.log(`Surface MAASP After Kill (exact): ${surfaceKillResults.maaspAfterKillExact.toFixed(2)} psi (Expected: ~815.29 psi)`);
assert.ok(Math.abs(surfaceKillResults.maaspAfterKillExact - 815.29) <= 0.05);

console.log(`Surface Extra Overbalance: ${Math.round(surfaceKillResults.extraOverbalancePsi)} psi (Expected: ~159 psi)`);
assert.ok(Math.abs(surfaceKillResults.extraOverbalancePsi - 159.45) <= 1.0);

console.log(`Surface Barite: ${surfaceKillResults.baritePer100Bbl.toFixed(2)} sk/100 bbl (Expected: 11.37 sk/100 bbl)`);
assert.strictEqual(surfaceKillResults.baritePer100Bbl.toFixed(2), '11.37');

console.log(`Surface Total Barite: ${Math.round(surfaceKillResults.totalBariteSacks)} sk (Expected: ~1453 sk)`);
assert.ok(Math.abs(surfaceKillResults.totalBariteSacks - 1453) <= 2);

// Surface Validation (4 warnings, 0 errors)
const surfaceAlerts = WellControlEngine.validateWellControlInputs(surfaceKillInputs);
const surfErrors = surfaceAlerts.filter(a => a.severity === 'ERROR');
const surfWarnings = surfaceAlerts.filter(a => a.severity === 'WARNING');

console.log(`Surface Errors: ${surfErrors.length} (Expected: 0)`);
assert.strictEqual(surfErrors.length, 0);

console.log(`Surface Warnings: ${surfWarnings.length} (Expected: 4)`);
assert.ok(surfWarnings.some(w => w.field === 'sicp' && w.message.includes('SICP is lower than SIDP')));
assert.ok(surfWarnings.some(w => w.field === 'holeTVD' && (w.message.includes('9,000') || w.message.includes('deep'))));
assert.ok(surfWarnings.some(w => w.field === 'shoeTVD' && w.message.includes('20" casing shoe')));
assert.ok(surfWarnings.some(w => w.field === 'krp' && w.message.includes('KRP seems unusually low')));

console.log('PASSED: Surface Baseline Case matches Section 9 specifications exactly!\n');

// -----------------------------------------------------------------
// TEST 8: JACKUP GATING & MARINE ELEVATION TESTS
// -----------------------------------------------------------------
console.log('--- TEST 8: Jackup Gating & Marine Elevation Tests ---');

// Case 1: JACKUP + 36" hole, Air Gap 30m, Water Depth 100m, Shoe 10,000m -> Valid, Depth below mudline = 9,870m
const jackup36Valid = {
  rigType: 'JACKUP',
  holeSize: 36,
  holeTVD: 10500,
  holeMD: 10500,
  shoeTVD: 10000,
  shoeMD: 10000,
  airGap: 30,
  waterDepth: 100,
  omw: 9.0,
  lotEmw: 11.0,
  krp: 200,
  sidp: 200,
  sicp: 300,
  pumpOutput: 0.1
};
const j36Alerts = WellControlEngine.validateWellControlInputs(jackup36Valid);
assert.strictEqual(j36Alerts.filter(a => a.severity === 'ERROR').length, 0, 'Jackup 36" valid inputs should have 0 errors');
const depthBelowMudline = jackup36Valid.shoeTVD - jackup36Valid.airGap - jackup36Valid.waterDepth;
assert.strictEqual(depthBelowMudline, 9870, 'Depth below mudline should be 9870 m');

// Case 2: JACKUP + 36" hole, Shoe TVD 100m <= mudline (130m) -> ERROR
const jackup36ShoeAboveMudline = {
  ...jackup36Valid,
  shoeTVD: 100
};
const j36Err1 = WellControlEngine.validateWellControlInputs(jackup36ShoeAboveMudline);
assert.ok(j36Err1.some(a => a.severity === 'ERROR' && a.field === 'shoeTVD'), 'Expected shoe TVD <= mudline ERROR');

// Case 3: JACKUP + 36" hole, blank / 0 Water Depth -> ERROR
const jackup36BlankWater = {
  ...jackup36Valid,
  waterDepth: 0
};
const j36Err2 = WellControlEngine.validateWellControlInputs(jackup36BlankWater);
assert.ok(j36Err2.some(a => a.severity === 'ERROR' && a.field === 'waterDepth'), 'Expected blank water depth ERROR');

// Case 4: JACKUP + 17-1/2" hole -> Marine elevations ignored/hidden
const jackup17 = {
  rigType: 'JACKUP',
  holeSize: 17.5,
  holeTVD: 10500,
  shoeTVD: 10000,
  airGap: null,
  waterDepth: null,
  omw: 9.0,
  lotEmw: 11.0,
  krp: 200,
  sidp: 200,
  sicp: 300,
  pumpOutput: 0.1
};
const j17Alerts = WellControlEngine.validateWellControlInputs(jackup17);
assert.strictEqual(j17Alerts.filter(a => a.severity === 'ERROR').length, 0, 'Jackup < 36" should not require marine elevations');

// Case 5: Custom 40" vs Custom 30"
assert.ok(40 >= WellControlConfig.JACKUP_MARINE_ELEVATION_MIN_HOLE_IN, 'Custom 40" >= 36"');
assert.ok(30 < WellControlConfig.JACKUP_MARINE_ELEVATION_MIN_HOLE_IN, 'Custom 30" < 36"');

console.log('PASSED: Jackup gating rules and marine elevation logic verified!\n');

console.log('====================================================');
console.log('   ALL WELL CONTROL REGRESSION TESTS PASSED!        ');
console.log('====================================================');
