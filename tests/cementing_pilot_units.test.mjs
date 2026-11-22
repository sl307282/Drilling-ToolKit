import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock browser global environment if needed
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] !== undefined ? store[key] : null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

const UnitsEngine = require('../units_engine.js');
globalThis.UnitsEngine = UnitsEngine;

const CementingCommon = require('../cementing_common.js');
globalThis.CementingCommon = CementingCommon;

const CementingEngine = require('../cementing_engine.js');
globalThis.CementingEngine = CementingEngine;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

function assertClose(actual, expected, maxDiff = 0.01, msg = '') {
  const diff = Math.abs(actual - expected);
  if (diff > maxDiff) {
    console.error(`FAIL: ${msg} | actual: ${actual}, expected: ${expected}, diff: ${diff}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('   CEMENT JOB PLANNER PILOT UNIT VERIFICATION TESTS');
console.log('====================================================\n');

// 10 Benchmark Pilot Test Cases
const TEST_CASES = [
  {
    id: 'CASE 1: Surface Conductor Jackup (30" in 36" hole)',
    type: 'surface_conductor',
    input: {
      rig_type: 'jack-up',
      seabed: 420,
      td: 660,
      shoe: 650,
      shoe_track_len: 40,
      seawater_mw: 8.6,
      hole_fluid_mw: 8.6,
      disp_mw: 8.6,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 20,
      sp_mw: 9.0,
      lead_vol: 0,
      lead_mw: 12.5,
      tail_vol: 250,
      tail_mw: 15.8,
      excess_pct: 100,
      pump_output: 0.102,
      collapse_rating: 1860,
      burst_rating: 3270,
      max_pump_pressure: 500,
      cap_csg: 0.7616,
      cap_oh: 1.2589,
      cap_ann_oh: 0.3846,
      cap_dp: 0.0240
    },
    expected: {
      total_slurry: 250,
      disp_tot: 14.64,
      p_ann_fc: 343.93,
      p_in_fc: 272.79,
      diff_press: 71.14,
      emw_shoe: 11.148,
      collapse_sf: 26.15
    }
  },
  {
    id: 'CASE 2: Surface Conductor Land (30" in 36" hole, ground 30 ft)',
    type: 'surface_conductor',
    input: {
      rig_type: 'land',
      seabed: 30,
      td: 660,
      shoe: 650,
      shoe_track_len: 40,
      hole_fluid_mw: 8.6,
      disp_mw: 8.6,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 20,
      sp_mw: 9.0,
      lead_vol: 0,
      lead_mw: 12.5,
      tail_vol: 250,
      tail_mw: 15.8,
      excess_pct: 100,
      pump_output: 0.102,
      collapse_rating: 1860,
      burst_rating: 3270,
      max_pump_pressure: 500,
      cap_csg: 0.7616,
      cap_oh: 1.2589,
      cap_ann_oh: 0.3846,
      cap_dp: 0.0240
    },
    expected: {
      total_slurry: 250,
      disp_tot: 14.64,
      p_ann_fc: 339.54,
      p_in_fc: 272.79,
      diff_press: 66.75,
      emw_shoe: 11.02,
      collapse_sf: 27.87
    }
  },
  {
    id: 'CASE 3: Surface Casing 20" (in 26" hole inside 30")',
    type: 'surface_casing',
    input: {
      prev_shoe: 650,
      td: 1820,
      shoe: 1800,
      shoe_track_len: 80,
      planned_toc: 0,
      mw: 9.0,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 50,
      sp_mw: 10.0,
      lead_vol: 550,
      lead_mw: 12.0,
      tail_vol: 220,
      tail_mw: 15.8,
      excess_pct: 50,
      pump_output: 0.102,
      lot: 12.5,
      collapse_rating: 1490,
      burst_rating: 3060,
      bump: 500,
      cap_csg: 0.3408,
      csg_disp: 0.0483,
      cap_prev_csg: 0.7616,
      cap_ann_c: 0.3725,
      cap_oh: 0.6567,
      cap_ann_oh: 0.2676
    },
    expected: {
      total_slurry: 770,
      disp_tot: 586.18,
      p_ann_fc: 1142.65,
      p_in_fc: 804.96,
      diff_press: 337.69,
      emw_shoe: 12.91,
      collapse_sf: 4.41
    }
  },
  {
    id: 'CASE 4: Surface Intermediate Casing 13-3/8" (in 17-1/2" hole inside 20")',
    type: 'surface_casing',
    input: {
      prev_shoe: 1800,
      td: 5020,
      shoe: 5000,
      shoe_track_len: 80,
      planned_toc: 1300,
      mw: 10.0,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 80,
      sp_mw: 11.0,
      lead_vol: 437,
      lead_mw: 12.5,
      tail_vol: 180,
      tail_mw: 15.8,
      excess_pct: 30,
      pump_output: 0.102,
      lot: 13.0,
      collapse_rating: 2670,
      burst_rating: 5380,
      bump: 1000,
      cap_csg: 0.1481,
      csg_disp: 0.0259,
      cap_prev_csg: 0.3408,
      cap_ann_c: 0.1668,
      cap_oh: 0.2975,
      cap_ann_oh: 0.1235
    },
    expected: {
      total_slurry: 617,
      disp_tot: 728.65,
      p_ann_fc: 3211.87,
      p_in_fc: 2558.40,
      diff_press: 653.47,
      emw_shoe: 12.606,
      collapse_sf: 4.086
    }
  },
  {
    id: 'CASE 5: Surface Production Casing 9-5/8" (in 12-1/4" hole inside 13-3/8")',
    type: 'surface_casing',
    input: {
      prev_shoe: 5000,
      td: 10020,
      shoe: 10000,
      shoe_track_len: 80,
      planned_toc: 4500,
      mw: 11.5,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 60,
      sp_mw: 12.3,
      lead_vol: 308,
      lead_mw: 13.5,
      tail_vol: 79,
      tail_mw: 15.8,
      excess_pct: 25,
      pump_output: 0.102,
      lot: 15.0,
      collapse_rating: 4760,
      burst_rating: 6870,
      bump: 1000,
      cap_csg: 0.0732,
      csg_disp: 0.0169,
      cap_prev_csg: 0.1481,
      cap_ann_c: 0.0580,
      cap_oh: 0.1458,
      cap_ann_oh: 0.0557
    },
    expected: {
      total_slurry: 387,
      disp_tot: 726.14,
      p_ann_fc: 6649.36,
      p_in_fc: 5932.16,
      diff_press: 717.20,
      emw_shoe: 12.914,
      collapse_sf: 6.637
    }
  },
  {
    id: 'CASE 6: Subsea Conductor (Riserless 30" in 36" hole)',
    type: 'riserless',
    input: {
      air_gap: 80,
      water_depth: 3000,
      prev_shoe: 0,
      td: 3390,
      shoe: 3380,
      shoe_track_len: 40,
      seawater_mw: 8.6,
      hole_fluid_mw: 8.6,
      disp_mw: 8.6,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 20,
      sp_mw: 9.0,
      lead_vol: 200,
      lead_mw: 12.5,
      tail_vol: 110,
      tail_mw: 15.8,
      excess_pct: 100,
      pump_output: 0.102,
      collapse_rating: 1860,
      burst_rating: 3270,
      max_pump_pressure: 1000,
      cap_csg: 0.7616,
      cap_oh: 1.2589,
      cap_ann_oh: 0.3846,
      cap_dp: 0.0240
    },
    expected: {
      total_slurry: 310,
      disp_tot: 80.16,
      p_ann_fc: 1551.60,
      p_in_fc: 1493.60,
      diff_press: 58.00,
      emw_shoe: 9.015,
      collapse_sf: 32.07
    }
  },
  {
    id: 'CASE 7: Subsea Casing 20" (Riserless 20" in 26" hole inside 30")',
    type: 'riserless',
    input: {
      air_gap: 80,
      water_depth: 3000,
      prev_shoe: 3380,
      td: 4920,
      shoe: 4900,
      shoe_track_len: 80,
      seawater_mw: 8.6,
      hole_fluid_mw: 9.5,
      disp_mw: 8.6,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 40,
      sp_mw: 10.0,
      lead_vol: 550,
      lead_mw: 12.5,
      tail_vol: 250,
      tail_mw: 15.8,
      excess_pct: 50,
      pump_output: 0.102,
      lot: 9.5,
      collapse_rating: 1490,
      burst_rating: 3060,
      max_pump_pressure: 1500,
      cap_csg: 0.3408,
      csg_disp: 0.0483,
      cap_prev_csg: 0.7616,
      cap_oh: 0.6567,
      cap_ann_oh: 0.2676,
      cap_ann_c: 0.3725,
      cap_dp: 0.0240
    },
    expected: {
      total_slurry: 800,
      disp_tot: 115.68,
      p_ann_fc: 2581.40,
      p_in_fc: 2155.50,
      diff_press: 425.90,
      emw_shoe: 10.389,
      collapse_sf: 3.498
    }
  },
  {
    id: 'CASE 8: Subsea Casing 13-3/8" (Subsea, 17-1/2" hole, riser 19.5")',
    type: 'subsea',
    input: {
      air_gap: 80,
      water_depth: 3000,
      hanger: 3070,
      prev_shoe: 4900,
      td: 8020,
      shoe: 8000,
      shoe_track_len: 80,
      mw: 10.2,
      f1_vol: 200,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 80,
      sp_mw: 11.0,
      lead_vol: 431,
      lead_mw: 12.5,
      tail_vol: 184,
      tail_mw: 15.8,
      excess_pct: 30,
      pump_output: 0.102,
      lot: 13.5,
      collapse_rating: 2670,
      burst_rating: 5380,
      bump: 1000,
      cap_csg: 0.1481,
      csg_disp: 0.0259,
      cap_prev_csg: 0.3408,
      cap_ann_c: 0.1668,
      cap_oh: 0.2975,
      cap_ann_oh: 0.1235,
      cap_dp: 0.0240,
      dp_cl_disp: 0.0343,
      cap_riser: 0.3350
    },
    expected: {
      total_slurry: 615,
      disp_tot: 791.97,
      p_ann_fc: 4813.98,
      p_in_fc: 4200.77,
      diff_press: 613.21,
      emw_shoe: 11.730,
      collapse_sf: 4.354
    }
  },
  {
    id: 'CASE 9: Subsea Casing 9-5/8" (Subsea, 12-1/4" hole, riser 19.5")',
    type: 'subsea',
    input: {
      air_gap: 80,
      water_depth: 3000,
      hanger: 3060,
      prev_shoe: 8000,
      td: 12520,
      shoe: 12500,
      shoe_track_len: 80,
      mw: 11.5,
      f1_vol: 200,
      f1_mw: 11.5,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 60,
      sp_mw: 12.3,
      lead_vol: 280,
      lead_mw: 13.5,
      tail_vol: 81,
      tail_mw: 15.8,
      excess_pct: 25,
      pump_output: 0.102,
      lot: 15.0,
      collapse_rating: 4760,
      burst_rating: 6870,
      bump: 1000,
      cap_csg: 0.0732,
      csg_disp: 0.0169,
      cap_prev_csg: 0.1481,
      cap_ann_c: 0.0580,
      cap_oh: 0.1458,
      cap_ann_oh: 0.0557,
      cap_dp: 0.0240,
      dp_cl_disp: 0.0343,
      cap_riser: 0.3350
    },
    expected: {
      total_slurry: 361,
      disp_tot: 758.59,
      p_ann_fc: 8111.60,
      p_in_fc: 7427.16,
      diff_press: 684.44,
      emw_shoe: 12.581,
      collapse_sf: 6.955
    }
  },
  {
    id: 'CASE 10: Subsea Multi-Fluid Wash with Base Oil (100 bbl 6.9 ppg)',
    type: 'subsea',
    input: {
      air_gap: 80,
      water_depth: 3000,
      hanger: 3070,
      prev_shoe: 4900,
      td: 8020,
      shoe: 8000,
      shoe_track_len: 80,
      mw: 10.2,
      f1_vol: 200,
      f1_mw: 10.2,
      f2_vol: 100,
      f2_mw: 6.9, // Base oil
      sp_vol: 80,
      sp_mw: 11.0,
      lead_vol: 431,
      lead_mw: 12.5,
      tail_vol: 184,
      tail_mw: 15.8,
      excess_pct: 30,
      pump_output: 0.102,
      lot: 13.5,
      collapse_rating: 2670,
      burst_rating: 5380,
      bump: 1000,
      cap_csg: 0.1481,
      csg_disp: 0.0259,
      cap_prev_csg: 0.3408,
      cap_ann_c: 0.1668,
      cap_oh: 0.2975,
      cap_ann_oh: 0.1235,
      cap_dp: 0.0240,
      dp_cl_disp: 0.0343,
      cap_riser: 0.3350
    },
    expected: {
      total_slurry: 615,
      disp_tot: 791.97,
      p_ann_fc: 4711.10,
      p_in_fc: 4200.77,
      diff_press: 510.33,
      emw_shoe: 11.483,
      collapse_sf: 5.231
    }
  }
];

function runCalc(tc) {
  if (tc.type === 'surface_conductor') {
    return CementingEngine.calcSurfaceConductor(tc.input);
  } else if (tc.type === 'surface_casing') {
    return CementingEngine.calcSurfaceCasing(tc.input);
  } else if (tc.type === 'riserless') {
    return CementingEngine.calcRiserless(tc.input);
  } else if (tc.type === 'subsea') {
    return CementingEngine.calcSubsea(tc.input);
  }
  throw new Error('Unknown calculation type: ' + tc.type);
}

// -------------------------------------------------------------
// VERIFICATION PHASE 1: Calculation Engine Output Invariance
// -------------------------------------------------------------
console.log('--- TEST GROUP 1: Calculation Engine Invariance Across Modes ---');
for (const tc of TEST_CASES) {
  UnitsEngine.setUnitSystem('mixed');
  const resMixed = runCalc(tc);

  UnitsEngine.setUnitSystem('api');
  const resApi = runCalc(tc);

  UnitsEngine.setUnitSystem('si');
  const resSi = runCalc(tc);

  // Assert calculations match expected values
  assertClose(resMixed.total_slurry, tc.expected.total_slurry, 1.0, `${tc.id} total_slurry`);
  assertClose(resMixed.disp_tot, tc.expected.disp_tot, 0.5, `${tc.id} disp_tot`);
  assertClose(resMixed.p_ann_fc, tc.expected.p_ann_fc, 1.0, `${tc.id} p_ann_fc`);
  assertClose(resMixed.diff_press, tc.expected.diff_press, 1.0, `${tc.id} diff_press`);
  assertClose(resMixed.emw_shoe, tc.expected.emw_shoe, 0.05, `${tc.id} emw_shoe`);

  // Assert calculation output is 100% IDENTICAL across all unit system states
  assert(resMixed.p_ann_fc === resApi.p_ann_fc && resApi.p_ann_fc === resSi.p_ann_fc,
    `${tc.id}: Mathematical engine must not change based on unit system setting!`);
  assert(resMixed.disp_tot === resApi.disp_tot && resApi.disp_tot === resSi.disp_tot,
    `${tc.id}: Displacement volume must remain mathematically identical in core engine!`);
}
console.log('PASSED: All 10 section calculation engines produce invariant mathematical results!\n');

// -------------------------------------------------------------
// VERIFICATION PHASE 2: Display Formatting in Mixed, API, and SI
// -------------------------------------------------------------
console.log('--- TEST GROUP 2: UI & PDF Formatter Parity Across Mixed, API, and SI ---');
for (const tc of TEST_CASES) {
  const res = runCalc(tc);

  // 1. Mixed Units
  UnitsEngine.setUnitSystem('mixed');
  assert(CementingCommon.getUnitSystem() === 'mixed', 'getUnitSystem should be mixed');
  const vMix = CementingCommon.formatVol(res.total_slurry);
  const pMix = CementingCommon.formatPressure(res.p_ann_fc);
  const mwMix = CementingCommon.formatDensity(res.emw_shoe);
  const poMix = CementingCommon.formatPumpOutput(tc.input.pump_output);

  assert(vMix.unit === 'bbl', `Mixed vol unit should be bbl, got ${vMix.unit}`);
  assert(pMix.unit === 'psi', `Mixed press unit should be psi, got ${pMix.unit}`);
  assert(mwMix.unit === 'ppg', `Mixed density unit should be ppg, got ${mwMix.unit}`);
  assert(poMix.unit === 'bbl/stk', `Mixed pump output unit should be bbl/stk, got ${poMix.unit}`);
  assertClose(parseFloat(vMix.val), res.total_slurry, 0.2, `${tc.id} mixed vol value`);
  assertClose(parseFloat(pMix.val), res.p_ann_fc, 1.0, `${tc.id} mixed press value`);
  assertClose(parseFloat(mwMix.val), res.emw_shoe, 0.05, `${tc.id} mixed density value`);

  // 2. Oilfield Units (API)
  UnitsEngine.setUnitSystem('api');
  assert(CementingCommon.getUnitSystem() === 'api', 'getUnitSystem should be api');
  assert(UnitsEngine.getUnit('capacity') === 'bbl/ft', 'API capacity unit must be bbl/ft');
  assert(UnitsEngine.getUnit('volume') === 'bbl', 'API vol unit must be bbl');
  assert(UnitsEngine.getUnit('pressure') === 'psi', 'API press unit must be psi');
  assert(UnitsEngine.getUnit('density') === 'ppg', 'API density unit must be ppg');
  assert(UnitsEngine.getUnit('length') === 'ft', 'API length unit must be ft');

  const vApi = CementingCommon.formatVol(res.total_slurry);
  const pApi = CementingCommon.formatPressure(res.p_ann_fc);
  const mwApi = CementingCommon.formatDensity(res.emw_shoe);
  const poApi = CementingCommon.formatPumpOutput(tc.input.pump_output);

  assert(vApi.unit === 'bbl', `API vol unit should be bbl, got ${vApi.unit}`);
  assert(pApi.unit === 'psi', `API press unit should be psi, got ${pApi.unit}`);
  assert(mwApi.unit === 'ppg', `API density unit should be ppg, got ${mwApi.unit}`);
  assert(poApi.unit === 'bbl/stk', `API pump output unit should be bbl/stk, got ${poApi.unit}`);

  // 3. Metric Units (SI)
  UnitsEngine.setUnitSystem('si');
  assert(CementingCommon.getUnitSystem() === 'si', 'getUnitSystem should be si');
  assert(UnitsEngine.getUnit('capacity') === 'L/m', 'SI capacity unit must be L/m');
  assert(UnitsEngine.getUnit('volume') === 'm³' || UnitsEngine.getUnit('volume') === 'm3', 'SI volume unit must be m³');
  assert(UnitsEngine.getUnit('pressure') === 'bar', 'SI pressure unit must be bar');
  assert(UnitsEngine.getUnit('density') === 'SG', 'SI density unit must be SG');
  assert(UnitsEngine.getUnit('length') === 'm', 'SI length unit must be m');

  const vSi = CementingCommon.formatVol(res.total_slurry);
  const pSi = CementingCommon.formatPressure(res.p_ann_fc);
  const mwSi = CementingCommon.formatDensity(res.emw_shoe);
  const poSi = CementingCommon.formatPumpOutput(tc.input.pump_output);

  assert(vSi.unit === 'm³' || vSi.unit === 'm3', `SI vol unit should be m³, got ${vSi.unit}`);
  assert(pSi.unit === 'bar', `SI press unit should be bar, got ${pSi.unit}`);
  assert(mwSi.unit === 'SG', `SI density unit should be SG, got ${mwSi.unit}`);
  assert(poSi.unit === 'L/stk', `SI pump output unit should be L/stk, got ${poSi.unit}`);

  // Verify exact mathematical conversion to SI display units
  const expectedM3 = res.total_slurry * 0.158987294928;
  assertClose(parseFloat(vSi.val), expectedM3, 0.1, `${tc.id} SI volume (m3)`);

  const expectedBar = res.p_ann_fc * 0.06894757;
  assertClose(parseFloat(pSi.val), expectedBar, 0.5, `${tc.id} SI pressure (bar)`);

  const expectedSG = res.emw_shoe * 0.1198264;
  assertClose(parseFloat(mwSi.val), expectedSG, 0.02, `${tc.id} SI density (SG)`);

  const expectedLStk = tc.input.pump_output * 158.987294928;
  assertClose(parseFloat(poSi.val), expectedLStk, 0.2, `${tc.id} SI pump output (L/stk)`);
}
console.log('PASSED: All 10 section formatters accurately convert and render in Mixed, API, and SI modes!\n');

// -------------------------------------------------------------
// VERIFICATION PHASE 3: Precision Retention & Round-Trip
// -------------------------------------------------------------
console.log('--- TEST GROUP 3: Round-Trip Stability & Zero Mutation ---');
UnitsEngine.setUnitSystem('mixed');
localStorage.setItem('capacityUnit', 'bbl/m');
assert(UnitsEngine.getUnit('capacity') === 'bbl/m', 'Capacity unit in mixed should be bbl/m');

// Switch to API -> capacity is locked to bbl/ft
UnitsEngine.setUnitSystem('api');
assert(UnitsEngine.getUnit('capacity') === 'bbl/ft', 'Capacity unit in API must be bbl/ft');

// Switch to SI -> capacity is locked to L/m
UnitsEngine.setUnitSystem('si');
assert(UnitsEngine.getUnit('capacity') === 'L/m', 'Capacity unit in SI must be L/m');

// Return to Mixed -> user capacity unit bbl/m must be faithfully restored
UnitsEngine.setUnitSystem('mixed');
assert(UnitsEngine.getUnit('capacity') === 'bbl/m', 'Capacity unit in mixed must restore to bbl/m');

console.log('PASSED: Round-trip switching preserves user capacity preference without drift!\n');

console.log('====================================================');
console.log('   ALL 10 CEMENT PILOT SECTION UNIT TESTS PASSED!   ');
console.log('====================================================');
