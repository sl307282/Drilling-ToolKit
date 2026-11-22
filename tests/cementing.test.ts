import { describe, it, expect } from 'vitest';
import {
  calcSubsea,
  calcRiserless,
  calcSurfaceConductor,
  calcSurfaceCasing,
  SubseaCementInput,
  RiserlessCementInput,
  SurfaceConductorInput,
  SurfaceCasingInput,
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

  describe('Surface Wellhead Engine Verification Tests', () => {
    it('T1 — Conductor, Jack-up (30" 310# in 36" hole, inner string 5-7/8" DP)', () => {
      const input: SurfaceConductorInput = {
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
      };

      const res = calcSurfaceConductor(input);

      expect(res.fc).toBe(610);
      expect(res.st_vol).toBeCloseTo(30.464, 2);
      expect(res.rat_vol).toBeCloseTo(25.178, 2);
      expect(res.v_below).toBeCloseTo(55.642, 2);
      expect(res.ann_total).toBeCloseTo(176.916, 2);
      expect(res.tail_top).toBe(420);
      expect(res.toc).toBe(420);
      expect(res.rise_tail).toBe(230);
      expect(res.cement_returns_seabed).toBeCloseTo(17.442, 2);
      expect(res.all_fluids_returned).toBeCloseTo(37.442, 2);
      expect(res.disp_tot).toBeCloseTo(14.64, 2);
      expect(res.strokes).toBeCloseTo(143.5, 1);
      expect(res.total_pumped).toBeCloseTo(284.64, 2);
      expect(res.p_ann_fc).toBeCloseTo(343.93, 1);
      expect(res.p_in_fc).toBeCloseTo(272.79, 1);
      expect(res.diff_press).toBeCloseTo(71.14, 1);
      expect(res.p_ann_shoe).toBeCloseTo(376.79, 1);
      expect(res.emw_fc).toBeCloseTo(10.843, 2);
      expect(res.emw_shoe).toBeCloseTo(11.148, 2);
      expect(res.collapse_sf).toBeCloseTo(26.15, 1);
      expect(res.burst_limit).toBe(2616);
      expect(res.checks.some(c => c.label === 'Seabed Returns' && c.status === 'OK')).toBe(true);
      expect(res.checks.some(c => c.label === 'Pump Pressure' && c.status === 'OK')).toBe(true);
    });

    it('T1-Land — Conductor, Land (30" 310# in 36" hole, ground level 30 ft)', () => {
      const input: SurfaceConductorInput = {
        rig_type: 'land',
        seabed: 30, // ground level
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
      };

      const res = calcSurfaceConductor(input);

      expect(res.top_ann).toBe(30);
      expect(res.toc).toBeCloseTo(397.32, 1);
      expect(res.tail_top).toBeCloseTo(397.32, 1);
      expect(res.cement_returns_seabed).toBe(0);
      expect(res.p_ann_fc).toBeCloseTo(339.54, 1);
      expect(res.emw_shoe).toBeCloseTo(11.02, 1);
      expect(res.checks.some(c => c.label === 'Ground Level Returns' && c.status === 'CHECK')).toBe(true);
    });

    it('T2 — Surface Casing (20" 133# in 26", inside 30" 310#)', () => {
      const input: SurfaceCasingInput = {
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
      };

      const res = calcSurfaceCasing(input);

      expect(res.st_vol).toBeCloseTo(27.264, 2);
      expect(res.rat_vol).toBeCloseTo(19.701, 2);
      expect(res.oh_full).toBeCloseTo(461.61, 1);
      expect(res.c_full).toBeCloseTo(242.125, 2);
      expect(res.ann_total).toBeCloseTo(703.735, 2);
      expect(res.tail_top).toBeCloseTo(1368.92, 1);
      expect(res.toc).toBe(0);
      expect(res.rise_tail).toBeCloseTo(431.08, 1);
      expect(res.rise_lead).toBeCloseTo(1368.92, 1);
      expect(res.cement_returns_surface).toBeCloseTo(19.30, 1);
      expect(res.disp_tot).toBeCloseTo(586.176, 2);
      expect(res.strokes).toBeCloseTo(5746.8, 1);
      expect(res.max_disp_no_bump).toBeCloseTo(599.808, 2);
      expect(res.bottom_plug_lands).toBe(0);
      expect(res.total_pumped).toBeCloseTo(1406.176, 2);
      expect(res.p_ann_fc).toBeCloseTo(1142.65, 1);
      expect(res.p_in_fc).toBeCloseTo(804.96, 1);
      expect(res.diff_press).toBeCloseTo(337.69, 1);
      expect(res.p_ann_shoe).toBeCloseTo(1208.38, 1);
      expect(res.emw_fc).toBeCloseTo(12.776, 2);
      expect(res.emw_shoe).toBeCloseTo(12.910, 2);
      expect(res.emw_prev_shoe).toBeCloseTo(12.00, 2);
      expect(res.lot_margin).toBeCloseTo(0.50, 2);
      expect(res.bump_pressure).toBeCloseTo(837.69, 1);
      expect(res.burst_limit).toBe(2448);
      expect(res.collapse_sf).toBeCloseTo(4.412, 2);
      expect(res.checks.some(c => c.label === 'TOC Position' && c.status === 'OK')).toBe(true);
      expect(res.checks.some(c => c.label === 'Formation Margin' && c.status === 'OK')).toBe(true);
      expect(res.checks.some(c => c.label === 'Bump Pressure' && c.status === 'OK')).toBe(true);
    });

    it('T3 — Intermediate Casing (13-3/8" 72# in 17½", inside 20" 133#)', () => {
      const input: SurfaceCasingInput = {
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
      };

      const res = calcSurfaceCasing(input);

      expect(res.st_vol).toBeCloseTo(11.848, 2);
      expect(res.rat_vol).toBeCloseTo(7.735, 2);
      expect(res.oh_full).toBeCloseTo(513.76, 1);
      expect(res.c_full).toBeCloseTo(300.24, 1);
      expect(res.ann_total).toBeCloseTo(814.0, 1);
      expect(res.tail_top).toBeCloseTo(4000.83, 1);
      expect(res.toc).toBeCloseTo(1298.46, 1);
      expect(res.sp_top).toBeCloseTo(818.84, 1);
      expect(res.rise_tail).toBeCloseTo(999.17, 1);
      expect(res.rise_lead).toBeCloseTo(2702.37, 1);
      expect(res.rise_tot).toBeCloseTo(3701.54, 1);
      expect(res.rise_sp).toBeCloseTo(479.62, 1);
      expect(res.cement_returns_surface).toBe(0);
      expect(res.disp_tot).toBeCloseTo(728.652, 2);
      expect(res.strokes).toBeCloseTo(7143.6, 1);
      expect(res.max_disp_no_bump).toBeCloseTo(734.576, 2);
      expect(res.bottom_plug_lands).toBeCloseTo(111.652, 2);
      expect(res.total_pumped).toBeCloseTo(1425.652, 2);
      expect(res.p_ann_fc).toBeCloseTo(3211.87, 1);
      expect(res.p_in_fc).toBeCloseTo(2558.40, 1);
      expect(res.diff_press).toBeCloseTo(653.47, 1);
      expect(res.p_ann_shoe).toBeCloseTo(3277.60, 1);
      expect(res.emw_fc).toBeCloseTo(12.554, 2);
      expect(res.emw_shoe).toBeCloseTo(12.606, 2);
      expect(res.emw_prev_shoe).toBeCloseTo(10.963, 2);
      expect(res.lot_margin).toBeCloseTo(2.037, 2);
      expect(res.bump_pressure).toBeCloseTo(1653.47, 1);
      expect(res.burst_limit).toBe(4304);
      expect(res.collapse_sf).toBeCloseTo(4.086, 2);
      expect(res.checks.some(c => c.label === 'TOC Position' && c.status === 'OK')).toBe(true);
    });

    it('T4 — Production Casing (9-5/8" 47# in 12¼", inside 13-3/8" 72#)', () => {
      const input: SurfaceCasingInput = {
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
      };

      const res = calcSurfaceCasing(input);

      expect(res.st_vol).toBeCloseTo(5.856, 2);
      expect(res.rat_vol).toBeCloseTo(3.645, 2);
      expect(res.oh_full).toBeCloseTo(348.125, 2);
      expect(res.c_full).toBeCloseTo(290.0, 1);
      expect(res.ann_total).toBeCloseTo(638.125, 2);
      expect(res.tail_top).toBeCloseTo(9001.81, 1);
      expect(res.toc).toBeCloseTo(4493.55, 1);
      expect(res.sp_top).toBeCloseTo(3459.07, 1);
      expect(res.rise_tail).toBeCloseTo(998.19, 1);
      expect(res.rise_lead).toBeCloseTo(4508.26, 1);
      expect(res.rise_tot).toBeCloseTo(5506.45, 1);
      expect(res.rise_sp).toBeCloseTo(1034.48, 1);
      expect(res.disp_tot).toBeCloseTo(726.144, 2);
      expect(res.strokes).toBeCloseTo(7119.1, 1);
      expect(res.bottom_plug_lands).toBeCloseTo(339.144, 2);
      expect(res.total_pumped).toBeCloseTo(1173.144, 2);
      expect(res.p_ann_fc).toBeCloseTo(6649.36, 1);
      expect(res.p_in_fc).toBeCloseTo(5932.16, 1);
      expect(res.diff_press).toBeCloseTo(717.20, 1);
      expect(res.p_ann_shoe).toBeCloseTo(6715.09, 1);
      expect(res.emw_fc).toBeCloseTo(12.890, 2);
      expect(res.emw_shoe).toBeCloseTo(12.914, 2);
      expect(res.emw_prev_shoe).toBeCloseTo(11.868, 2);
      expect(res.lot_margin).toBeCloseTo(3.132, 2);
      expect(res.bump_pressure).toBeCloseTo(1717.20, 1);
      expect(res.burst_limit).toBe(5496);
      expect(res.collapse_sf).toBeCloseTo(6.637, 2);
    });

    it('T5 — Metres mode & Pumped Mud (T3 in metres exact parity & 2nd mud 100 bbl @ 6.9 ppg)', () => {
      // 1. T3 converted to meters and back
      const ftToM = (ft: number) => ft * 0.3048;
      const mToFt = (m: number) => m / 0.3048;
      const bblFtToM = (bf: number) => bf / 0.3048;
      const bblMToFt = (bm: number) => bm * 0.3048;

      const m_prev_shoe = ftToM(1800);
      const m_td = ftToM(5020);
      const m_shoe = ftToM(5000);
      const m_shoe_track = ftToM(80);
      const m_planned_toc = ftToM(1300);

      const m_cap_csg = bblFtToM(0.1481);
      const m_cap_ann_c = bblFtToM(0.1668);
      const m_cap_oh = bblFtToM(0.2975);
      const m_cap_ann_oh = bblFtToM(0.1235);

      const convertedInput: SurfaceCasingInput = {
        prev_shoe: mToFt(m_prev_shoe),
        td: mToFt(m_td),
        shoe: mToFt(m_shoe),
        shoe_track_len: mToFt(m_shoe_track),
        planned_toc: mToFt(m_planned_toc),
        mw: 10.0,
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
        cap_csg: bblMToFt(m_cap_csg),
        cap_ann_c: bblMToFt(m_cap_ann_c),
        cap_oh: bblMToFt(m_cap_oh),
        cap_ann_oh: bblMToFt(m_cap_ann_oh)
      };

      const resM = calcSurfaceCasing(convertedInput);
      expect(resM.p_ann_fc).toBeCloseTo(3211.87, 1);
      expect(resM.diff_press).toBeCloseTo(653.47, 1);
      expect(resM.emw_shoe).toBeCloseTo(12.606, 2);

      // 2. T3 with 2nd pumping mud (100 bbl @ 6.9 ppg)
      const inputWith2ndMud: SurfaceCasingInput = {
        prev_shoe: 1800,
        td: 5020,
        shoe: 5000,
        shoe_track_len: 80,
        planned_toc: 1300,
        mw: 10.0,
        f1_vol: 0,
        f1_mw: 10.2,
        f2_vol: 100, // 100 bbl @ 6.9 ppg
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
      };

      const res2ndMud = calcSurfaceCasing(inputWith2ndMud);
      expect(res2ndMud.f2_top).toBeLessThan(res2ndMud.sp_top);
      // Because lighter fluid (6.9 ppg) replaces well mud (10.0 ppg), pressures and EMWs must decrease
      expect(res2ndMud.p_ann_fc).toBeLessThan(3211.87);
      expect(res2ndMud.emw_shoe).toBeLessThan(12.606);
    });

    it('Edge cases — single slurry, TOC below plan, capacity validation', () => {
      // 1. Single slurry (tail = 0)
      const singleSlurry: SurfaceCasingInput = {
        prev_shoe: 1800,
        td: 5020,
        shoe: 5000,
        shoe_track_len: 80,
        planned_toc: 1300,
        mw: 10.0,
        sp_vol: 80,
        sp_mw: 11.0,
        lead_vol: 600,
        lead_mw: 13.5,
        tail_vol: 0,
        tail_mw: 15.8,
        excess_pct: 30,
        pump_output: 0.102,
        collapse_rating: 2670,
        burst_rating: 5380,
        bump: 1000,
        cap_csg: 0.1481,
        cap_ann_c: 0.1668,
        cap_oh: 0.2975,
        cap_ann_oh: 0.1235
      };
      const resSingle = calcSurfaceCasing(singleSlurry);
      expect(resSingle.rise_tail).toBe(0);
      expect(resSingle.rise_lead).toBeGreaterThan(0);
      expect(resSingle.checks.some(c => c.label === 'Tail Slurry Placement' && c.message.includes('single-slurry'))).toBe(true);

      // 2. TOC below plan
      const lowSlurry: SurfaceCasingInput = {
        ...singleSlurry,
        lead_vol: 100 // Very small slurry volume -> TOC will be deep below 1300 planned
      };
      const resLow = calcSurfaceCasing(lowSlurry);
      expect(resLow.toc).toBeGreaterThan(1300);
      expect(resLow.checks.some(c => c.label === 'TOC Position' && c.status === 'CHECK')).toBe(true);
    });
  });

  describe('Well Cementing Schematic Collision Avoidance & Callouts', () => {
    // Import CementingCommon dynamically
    // @ts-ignore
    const CementingCommon = require('../cementing_common.js');

    it('T14 — De-overlaps two identical depth markers with >= 18px separation', () => {
      const markers = [
        { d: 100, targetY: 250, label: 'Seabed 100.0 m' },
        { d: 100, targetY: 250, label: 'TOC 100.0 m' }
      ];
      const relaxed = CementingCommon.relaxSchematicMarkers(markers, 18, 40, 765);
      expect(relaxed.length).toBe(2);
      expect(Math.abs(relaxed[1].displayY - relaxed[0].displayY)).toBeGreaterThanOrEqual(18);
      // Symmetrical around 250
      expect((relaxed[0].displayY + relaxed[1].displayY) / 2).toBeCloseTo(250, 1);
    });

    it('T15 — De-overlaps 3 close bottom markers (Float Collar, Shoe, TD)', () => {
      const markers = [
        { d: 185, targetY: 732, label: 'Float Collar Depth 185.0 m' },
        { d: 200, targetY: 740, label: 'Casing Shoe 200.0 m' },
        { d: 205, targetY: 742, label: 'Hole Depth (MD) 205.0 m' }
      ];
      const relaxed = CementingCommon.relaxSchematicMarkers(markers, 18, 40, 765);
      expect(relaxed.length).toBe(3);
      for (let i = 1; i < relaxed.length; i++) {
        expect(relaxed[i].displayY - relaxed[i - 1].displayY).toBeGreaterThanOrEqual(18);
      }
      expect(relaxed[2].displayY).toBeLessThanOrEqual(765);
    });

    it('T16 — Respects minY and maxY boundary clamps', () => {
      const markers = [
        { d: 0, targetY: 30, label: 'Surface 0 m' },
        { d: 5, targetY: 35, label: 'Prev Shoe 5 m' }
      ];
      const relaxed = CementingCommon.relaxSchematicMarkers(markers, 18, 50, 765);
      expect(relaxed[0].displayY).toBeGreaterThanOrEqual(50);
      expect(relaxed[1].displayY).toBeGreaterThanOrEqual(68);
    });

    it('T17 — Generates valid SVG callout markup with leader lines and pills', () => {
      const leftMarkers = [
        { d: 0, targetY: 60, label: 'Surface / RKB 0 m', bg: '#2C1A11', text: '#FFFFFF' },
        { d: 200, targetY: 740, label: 'Casing Shoe 200.0 m', bg: '#1E293B', text: '#FFFFFF' }
      ];
      const rightMarkers = [
        { d: 100, targetY: 250, label: 'Seabed 100.0 m', bg: '#8D7765', text: '#FFFFFF' },
        { d: 100, targetY: 250, label: 'TOC 100.0 m', bg: '#15803D', text: '#FFFFFF' }
      ];

      const svg = CementingCommon.renderSchematicCallouts({
        leftMarkers,
        rightMarkers,
        ohLeft: 195,
        ohRight: 305,
        leftTagRight: 135,
        rightTagX: 365,
        minGap: 18,
        minY: 45,
        maxY: 765
      });

      expect(svg).toContain('<rect');
      expect(svg).toContain('<text');
      expect(svg).toContain('schematic-callout-pill');
      expect(svg).toContain('schematic-leader-line'); // Angled leader line for de-overlapped Seabed/TOC
      expect(svg).toContain('schematic-leader-direct'); // Direct horizontal line
      expect(svg).toContain('Seabed 100.0 m');
      expect(svg).toContain('TOC 100.0 m');
      expect(svg).toContain('Casing Shoe 200.0 m');
      expect(svg).not.toContain('NaN');
    });
  });
});
