import { describe, it, expect } from 'vitest';
import {
  calcSubsea,
  calcRiserless,
  SubseaCementInput,
  RiserlessCementInput,
  calcCasedAnnulusCap,
  calcOpenHoleAnnulusCap,
  calcRiserAnnulusCap,
  ftToMeters,
  metersToFt,
  bblFtToBblM,
  bblMToBblFt
} from '../src/cementing/engine';

describe('Cementing Engine Verification Tests', () => {
  it('T1 — 30" conductor (riserless, 36" hole, inner string 5-7/8" DP)', () => {
    const input: RiserlessCementInput = {
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
    };

    const res = calcRiserless(input);

    expect(res.mudline).toBeCloseTo(3080, 1);
    expect(res.fc).toBeCloseTo(3340, 1);
    expect(res.st_vol).toBeCloseTo(30.464, 2);
    expect(res.rat_vol).toBeCloseTo(25.178, 2);
    expect(res.oh_full).toBeCloseTo(230.76, 1);
    expect(res.tail_top).toBeCloseTo(3309.33, 1);
    expect(res.toc).toBeCloseTo(3080, 1);
    expect(res.cement_returns_seabed).toBeCloseTo(23.598, 2);
    expect(res.disp_tot).toBeCloseTo(80.16, 1);
    expect(res.strokes).toBeCloseTo(785.9, 1);
    expect(res.total_pumped).toBeCloseTo(410.16, 1);
    expect(res.p_ann_fc).toBeCloseTo(1551.6, 1);
    expect(res.p_in_fc).toBeCloseTo(1493.6, 1);
    expect(res.diff_press).toBeCloseTo(58.0, 1);
    expect(res.p_ann_shoe).toBeCloseTo(1584.5, 1);
    expect(res.emw_fc).toBeCloseTo(8.934, 2);
    expect(res.emw_shoe).toBeCloseTo(9.015, 2);
    expect(res.collapse_sf).toBeCloseTo(32.07, 1);
  });

  it('T2 — 20" casing (riserless, 26" hole, inside 30" shoe 3380)', () => {
    const input: RiserlessCementInput = {
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
    };

    const res = calcRiserless(input);

    expect(res.st_vol).toBeCloseTo(27.264, 2);
    expect(res.rat_vol).toBeCloseTo(19.701, 2);
    expect(res.oh_full).toBeCloseTo(610.128, 2);
    expect(res.c_full).toBeCloseTo(111.75, 1);
    expect(res.ann_total).toBeCloseTo(721.878, 2);
    expect(res.tail_top).toBeCloseTo(4394.18, 1);
    expect(res.toc).toBeCloseTo(3080, 1);
    expect(res.cement_returns_seabed).toBeCloseTo(31.157, 2);
    expect(res.disp_tot).toBeCloseTo(115.68, 1);
    expect(res.strokes).toBeCloseTo(1134.1, 1);
    expect(res.p_ann_fc).toBeCloseTo(2581.4, 1);
    expect(res.p_in_fc).toBeCloseTo(2155.5, 1);
    expect(res.diff_press).toBeCloseTo(425.9, 1);
    expect(res.p_ann_shoe).toBeCloseTo(2647.2, 1);
    expect(res.emw_fc).toBeCloseTo(10.299, 2);
    expect(res.emw_shoe).toBeCloseTo(10.389, 2);
    expect(res.emw_prev_shoe).toBeCloseTo(8.946, 2);
    expect(res.lot_margin).toBeCloseTo(0.554, 2);
    expect(res.collapse_sf).toBeCloseTo(3.498, 2);
  });

  it('T3 — 13-3/8" casing (subsea, 17½" hole, riser 19.5", landing string 5-7/8" DP)', () => {
    const input: SubseaCementInput = {
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
    };

    const res = calcSubsea(input);

    expect(res.st_vol).toBeCloseTo(11.848, 2);
    expect(res.rat_vol).toBeCloseTo(7.735, 2);
    expect(res.oh_full).toBeCloseTo(497.705, 2);
    expect(res.c_full).toBeCloseTo(305.244, 2);
    expect(res.r_full).toBeCloseTo(1028.45, 1);
    expect(res.tail_top).toBeCloseTo(6975.91, 1);
    expect(res.toc).toBeCloseTo(4314.20, 1);
    expect(res.sp_top).toBeCloseTo(3834.58, 1);
    expect(res.f1_top).toBeCloseTo(2853.68, 1);

    expect(res.rise_tail).toBeCloseTo(1024.09, 1);
    expect(res.rise_lead).toBeCloseTo(2661.72, 1);
    expect(res.rise_tot).toBeCloseTo(3685.80, 1);
    expect(res.rise_sp).toBeCloseTo(479.62, 1);
    expect(res.rise_f1).toBeCloseTo(980.90, 1);

    expect(res.disp_dp).toBeCloseTo(73.68, 1);
    expect(res.disp_csg).toBeCloseTo(718.285, 2);
    expect(res.disp_tot).toBeCloseTo(791.965, 2);
    expect(res.strokes).toBeCloseTo(7764.4, 1);
    expect(res.max_disp_no_bump).toBeCloseTo(797.889, 2);
    expect(res.bottom_plug_lands).toBeCloseTo(176.965, 2);
    expect(res.total_pumped).toBeCloseTo(1686.965, 2);

    expect(res.p_ann_fc).toBeCloseTo(4813.98, 1);
    expect(res.p_in_fc).toBeCloseTo(4200.77, 1);
    expect(res.diff_press).toBeCloseTo(613.21, 1);
    expect(res.p_ann_shoe).toBeCloseTo(4879.71, 1);
    expect(res.emw_fc).toBeCloseTo(11.689, 2);
    expect(res.emw_shoe).toBeCloseTo(11.730, 2);
    expect(res.emw_prev_shoe).toBeCloseTo(10.553, 2);
    expect(res.lot_margin).toBeCloseTo(2.947, 2);
    expect(res.bump_pressure).toBeCloseTo(1613.2, 1);
    expect(res.burst_limit).toBeCloseTo(4304, 0);
    expect(res.collapse_sf).toBeCloseTo(4.354, 2);
  });

  it('T4 — 9-5/8" casing (subsea, 12¼" hole)', () => {
    const input: SubseaCementInput = {
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
    };

    const res = calcSubsea(input);

    expect(res.st_vol).toBeCloseTo(5.856, 2);
    expect(res.rat_vol).toBeCloseTo(3.645, 2);
    expect(res.oh_full).toBeCloseTo(313.3125, 2);
    expect(res.c_full).toBeCloseTo(286.52, 1);
    expect(res.tail_top).toBeCloseTo(11473.08, 1);
    expect(res.toc).toBeCloseTo(7341.61, 1);
    expect(res.sp_top).toBeCloseTo(6307.13, 1);
    expect(res.f1_top).toBeCloseTo(3025.17, 1);

    expect(res.disp_tot).toBeCloseTo(758.592, 2);
    expect(res.strokes).toBeCloseTo(7437.2, 1);
    expect(res.p_ann_fc).toBeCloseTo(8111.60, 1);
    expect(res.p_in_fc).toBeCloseTo(7427.16, 1);
    expect(res.diff_press).toBeCloseTo(684.44, 1);
    expect(res.p_ann_shoe).toBeCloseTo(8177.33, 1);
    expect(res.emw_fc).toBeCloseTo(12.560, 2);
    expect(res.emw_shoe).toBeCloseTo(12.581, 2);
    expect(res.emw_prev_shoe).toBeCloseTo(11.768, 2);
    expect(res.bump_pressure).toBeCloseTo(1684.4, 1);
    expect(res.collapse_sf).toBeCloseTo(6.955, 2);
  });

  it('T5 — base-oil check (modify T3 with 100 bbl @ 6.9 ppg) and units conversion', () => {
    const inputT5: SubseaCementInput = {
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
      f2_mw: 6.9, // 100 bbl base oil
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
    };

    const resT5 = calcSubsea(inputT5);
    expect(resT5.f2_top).toBeCloseTo(3235.06, 1);
    expect(resT5.f1_top).toBeCloseTo(2555.17, 1);
    // Base oil of lower density (6.9 vs 10.2) must drop the annulus hydrostatic pressure
    expect(resT5.p_ann_fc).toBeCloseTo(4711.10, 1);
    expect(resT5.p_ann_fc).toBeLessThan(4813.98);

    // Test unit conversion functions
    const depthFt = 8000;
    const depthM = ftToMeters(depthFt);
    expect(metersToFt(depthM)).toBeCloseTo(8000, 4);

    const capBblFt = 0.1481;
    const capBblM = bblFtToBblM(capBblFt);
    expect(bblMToBblFt(capBblM)).toBeCloseTo(0.1481, 4);
  });

  it('Edge Cases: Single slurry (tail=0), TOC in riser, and zero returns', () => {
    // 1. Single slurry (tail = 0)
    const singleSlurryInput: RiserlessCementInput = {
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
      lead_vol: 310,
      lead_mw: 12.5,
      tail_vol: 0, // Single slurry
      tail_mw: 0,
      excess_pct: 100,
      pump_output: 0.102,
      collapse_rating: 1860,
      burst_rating: 3270,
      max_pump_pressure: 1000,
      cap_csg: 0.7616,
      cap_oh: 1.2589,
      cap_ann_oh: 0.3846,
      cap_dp: 0.0240
    };
    const resSingle = calcRiserless(singleSlurryInput);
    expect(resSingle.rise_tail).toBe(0);
    expect(resSingle.rise_lead).toBeGreaterThan(0);
    expect(resSingle.checks.some(c => c.label === 'Tail Slurry Placement' && c.status === 'OK')).toBe(true);

    // 2. Cement in riser check
    const cementInRiserInput: SubseaCementInput = {
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
      lead_vol: 1500, // Large volume will pump into riser
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
    };
    const resRiser = calcSubsea(cementInRiserInput);
    expect(resRiser.toc).toBeLessThan(3070); // TOC in riser
    expect(resRiser.checks.some(c => c.label === 'TOC Position' && c.status === 'CHECK')).toBe(true);

    // 3. Annulus capacity calculations helper checks
    const casedAnn = calcCasedAnnulusCap(0.3408, 0.1481, 0.0259);
    expect(casedAnn).toBeCloseTo(0.1668, 4);

    const ohAnn = calcOpenHoleAnnulusCap(0.2975, 0.1481, 0.0259);
    expect(ohAnn).toBeCloseTo(0.1235, 4);

    const riserAnn = calcRiserAnnulusCap(0.3693, 0.0343);
    expect(riserAnn).toBeCloseTo(0.3350, 4);
  });
});
