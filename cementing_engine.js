/**
 * Subsea & Riserless Well Casing Cementing Engine
 * Drilling Toolkit Web Runtime
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CementingEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CONSTANTS = {
    CAP_FACTOR: 1029.4,        // in² -> bbl/ft
    CUFT_PER_BBL: 5.6146,      // ft³/bbl
    PSI_GRADIENT: 0.052,       // psi/ft per ppg
    M_PER_FT: 0.3048,          // exact 1 ft = 0.3048 m
    FT_PER_M: 1 / 0.3048       // exact 1 m = 3.280839895013123 ft
  };

  /**
   * Subsea Model Calculation Engine (13-3/8", 9-5/8", Custom)
   */
  function calcSubsea(inp) {
    const xs = 1 + (Number(inp.excess_pct) || 0) / 100;
    const mudline = Number(inp.air_gap) + Number(inp.water_depth);
    const fc = Number(inp.shoe) - Number(inp.shoe_track_len);

    const st_vol = Number(inp.shoe_track_len) * Number(inp.cap_csg);
    const rat_vol = Math.max(0, Number(inp.td) - Number(inp.shoe)) * Number(inp.cap_oh) * xs;
    const v_below = st_vol + rat_vol;

    const top_ann = Number(inp.prev_shoe);
    const oh_full = Math.max(0, Number(inp.shoe) - top_ann) * Number(inp.cap_ann_oh) * xs;
    const c_full = Math.max(0, Number(inp.prev_shoe) - Number(inp.hanger)) * Number(inp.cap_ann_c);
    const r_full = Number(inp.hanger) * Number(inp.cap_riser);

    // depth_top(V)
    function depthTop(v) {
      if (v <= 0) return Number(inp.shoe || 0);
      const annOhCap = Number(inp.cap_ann_oh || 0) * xs;
      if (oh_full > 0 && annOhCap > 0 && v <= oh_full) {
        return Math.max(0, Number(inp.shoe || 0) - v / annOhCap);
      }
      const annCCap = Number(inp.cap_ann_c || 0);
      if (c_full > 0 && annCCap > 0 && v <= oh_full + c_full) {
        return Math.max(0, Number(inp.prev_shoe || 0) - (v - oh_full) / annCCap);
      }
      const riserCap = Number(inp.cap_riser || 0);
      if (riserCap > 0) {
        const res = Number(inp.hanger || 0) - (v - oh_full - c_full) / riserCap;
        return Math.max(0, res);
      }
      return 0;
    }

    const v_tail = Number(inp.tail_vol) - v_below;
    const v_cem = v_tail + Number(inp.lead_vol);
    const v_sp = v_cem + Number(inp.sp_vol);
    const v_f2 = v_sp + Number(inp.f2_vol);
    const v_f1 = v_f2 + Number(inp.f1_vol);

    const tail_top = depthTop(v_tail);
    const toc = depthTop(v_cem);
    const sp_top = depthTop(v_sp);
    const f2_top = depthTop(v_f2);
    const f1_top = depthTop(v_f1);

    const rise_tail = Number(inp.shoe) - tail_top;
    const rise_lead = tail_top - toc;
    const rise_tot = Number(inp.shoe) - toc;
    const rise_sp = toc - sp_top;
    const rise_f2 = sp_top - f2_top;
    const rise_f1 = f2_top - f1_top;
    const total_slurry = Number(inp.lead_vol) + Number(inp.tail_vol);

    const cement_in_riser = Math.max(0, Number(inp.hanger) - toc);
    const returns_surface = Math.max(0, v_f1 - oh_full - c_full - r_full);

    // Displacement
    const disp_dp = Number(inp.hanger) * Number(inp.cap_dp);
    const disp_csg = (fc - Number(inp.hanger)) * Number(inp.cap_csg);
    const disp_tot = disp_dp + disp_csg;
    const strokes = Number(inp.pump_output) > 0 ? disp_tot / Number(inp.pump_output) : 0;
    const max_disp_no_bump = disp_tot + st_vol / 2;
    const bottom_plug_lands = Math.max(0, disp_tot - total_slurry);
    const top_plug_releases = disp_dp;

    const pumping_sequence = [
      { step: 1, name: '1st Pumping Mud', volume: Number(inp.f1_vol), density: Number(inp.f1_mw) },
      { step: 2, name: '2nd Pumping Mud', volume: Number(inp.f2_vol), density: Number(inp.f2_mw) },
      { step: 3, name: 'Spacer', volume: Number(inp.sp_vol), density: Number(inp.sp_mw) },
      { step: 4, name: 'Lead Slurry', volume: Number(inp.lead_vol), density: Number(inp.lead_mw) },
      { step: 5, name: 'Tail Slurry', volume: Number(inp.tail_vol), density: Number(inp.tail_mw) },
      { step: 6, name: 'Displacement', volume: disp_tot, density: Number(inp.mw) }
    ].filter(s => s.volume > 0 || s.step === 6);

    const total_pumped = Number(inp.f1_vol) + Number(inp.f2_vol) + Number(inp.sp_vol) + Number(inp.lead_vol) + Number(inp.tail_vol) + disp_tot;

    // Pressures (Static, End of Job)
    const layers = [
      { rho: Number(inp.mw), top: 0, bot: f1_top },
      { rho: Number(inp.f1_mw), top: f1_top, bot: f2_top },
      { rho: Number(inp.f2_mw), top: f2_top, bot: sp_top },
      { rho: Number(inp.sp_mw), top: sp_top, bot: toc },
      { rho: Number(inp.lead_mw), top: toc, bot: tail_top },
      { rho: Number(inp.tail_mw), top: tail_top, bot: Number(inp.shoe) }
    ];

    function pAnn(depth) {
      let sum = 0;
      for (const l of layers) {
        const h = Math.max(0, Math.min(l.bot, depth) - Math.min(l.top, depth));
        sum += CONSTANTS.PSI_GRADIENT * l.rho * h;
      }
      return sum;
    }

    const p_ann_fc = pAnn(fc);
    const p_in_fc = CONSTANTS.PSI_GRADIENT * Number(inp.mw) * fc;
    const diff_press = p_ann_fc - p_in_fc;
    const diff_meaning = diff_press > 0
      ? 'Annulus heavier – floats must hold (U-tube risk)'
      : 'String heavier – no back-flow';

    const p_ann_shoe = pAnn(Number(inp.shoe));
    const p_prev_shoe = Number(inp.prev_shoe) > 0 ? pAnn(Number(inp.prev_shoe)) : undefined;

    const emw_fc = fc > 0 ? p_ann_fc / (CONSTANTS.PSI_GRADIENT * fc) : 0;
    const emw_shoe = Number(inp.shoe) > 0 ? p_ann_shoe / (CONSTANTS.PSI_GRADIENT * Number(inp.shoe)) : 0;
    const emw_prev_shoe = (Number(inp.prev_shoe) > 0 && p_prev_shoe !== undefined)
      ? p_prev_shoe / (CONSTANTS.PSI_GRADIENT * Number(inp.prev_shoe))
      : undefined;
    const lot_margin = (Number(inp.lot) > 0 && emw_prev_shoe !== undefined)
      ? Number(inp.lot) - emw_prev_shoe
      : undefined;

    const bottom_rho = Number(inp.tail_vol) > 0 ? Number(inp.tail_mw) : Number(inp.lead_mw);
    const p_col = p_ann_shoe - (p_in_fc + CONSTANTS.PSI_GRADIENT * bottom_rho * (Number(inp.shoe || 0) - fc));
    const collapse_sf = (p_col > 0 && Number(inp.collapse_rating || 0) > 0)
      ? Number(inp.collapse_rating) / p_col
      : (Number(inp.collapse_rating || 0) > 0 ? 999 : 0);

    const bump_pressure = diff_press + Number(inp.bump || 0);
    const burst_limit = 0.8 * Number(inp.burst_rating || 0);

    // Job Checks
    const checks = [];

    // 1. TOC vs Hanger
    if (total_slurry <= 0) {
      checks.push({
        label: 'TOC Position',
        status: 'OK',
        message: 'OK – No slurry pumped'
      });
    } else if (toc > Number(inp.hanger || 0)) {
      checks.push({
        label: 'TOC Position',
        status: 'OK',
        message: `OK – Cement top (${toc.toFixed(1)} ft) is below subsea wellhead (${inp.hanger || 0} ft)`
      });
    } else {
      checks.push({
        label: 'TOC Position',
        status: 'CHECK',
        message: `CHECK – Cement entered marine riser! (${cement_in_riser.toFixed(1)} ft in riser)`
      });
    }

    // 2. Cement Below Shoe Check
    if (total_slurry <= 0) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'OK',
        message: 'OK – No slurry volume entered'
      });
    } else if (total_slurry < v_below) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'CHECK',
        message: `CHECK – Slurry volume (${total_slurry.toFixed(1)} bbl) does not fill shoe track & rathole (${v_below.toFixed(1)} bbl)`
      });
    } else if (Number(inp.tail_vol || 0) === 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: 'OK – No tail slurry (single-slurry job)'
      });
    } else if (v_tail <= 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'CHECK',
        message: 'CHECK – Tail slurry does not clear shoe into annulus (fills rathole/shoe track only)'
      });
    } else {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: `OK – Tail slurry placed ${rise_tail.toFixed(1)} ft into annulus`
      });
    }

    // 3. Losses Check (LOT Margin)
    if (lot_margin !== undefined) {
      if (lot_margin >= 0) {
        checks.push({
          label: 'Formation Margin',
          status: 'OK',
          message: `OK – LOT margin at prev shoe is +${lot_margin.toFixed(2)} ppg (EMW ${emw_prev_shoe !== undefined ? emw_prev_shoe.toFixed(2) : '-'} vs LOT ${inp.lot})`
        });
      } else {
        checks.push({
          label: 'Formation Margin',
          status: 'CHECK',
          message: `CHECK – EMW at prev shoe (${emw_prev_shoe !== undefined ? emw_prev_shoe.toFixed(2) : '-'} ppg) exceeds LOT (${inp.lot} ppg) by ${Math.abs(lot_margin).toFixed(2)} ppg! Loss risk.`
        });
      }
    }

    // 4. Collapse Safety Factor
    if (Number(inp.collapse_rating || 0) <= 0 || p_col <= 0) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: 'OK – No net collapse differential load at shoe'
      });
    } else if (collapse_sf >= 1.1) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: `OK – Collapse safety factor is ${collapse_sf.toFixed(2)} (≥ 1.10)`
      });
    } else {
      checks.push({
        label: 'Collapse SF',
        status: 'CHECK',
        message: `CHECK – Collapse safety factor is ${collapse_sf.toFixed(2)} (< 1.10 design limit)`
      });
    }

    // 5. Bump Pressure vs 80% Burst Limit
    if (burst_limit <= 0) {
      checks.push({
        label: 'Bump Pressure',
        status: 'OK',
        message: 'OK – No burst limit specified'
      });
    } else if (bump_pressure <= burst_limit) {
      checks.push({
        label: 'Bump Pressure',
        status: 'OK',
        message: `OK – Bump pressure ${bump_pressure.toFixed(0)} psi ≤ 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    } else {
      checks.push({
        label: 'Bump Pressure',
        status: 'CHECK',
        message: `CHECK – Bump pressure ${bump_pressure.toFixed(0)} psi exceeds 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    }

    return {
      model: 'subsea',
      mudline,
      fc,
      st_vol,
      rat_vol,
      v_below,
      top_ann,
      oh_full,
      c_full,
      r_full,
      v_tail,
      v_cem,
      v_sp,
      v_f2,
      v_f1,
      tail_top,
      toc,
      sp_top,
      f2_top,
      f1_top,
      rise_tail,
      rise_lead,
      rise_tot,
      rise_sp,
      rise_f2,
      rise_f1,
      total_slurry,
      cement_in_riser,
      returns_surface,
      disp_dp,
      disp_csg,
      disp_tot,
      strokes,
      max_disp_no_bump,
      bottom_plug_lands,
      top_plug_releases,
      pumping_sequence,
      total_pumped,
      p_ann_fc,
      p_in_fc,
      diff_press,
      diff_meaning,
      p_ann_shoe,
      p_prev_shoe,
      emw_fc,
      emw_shoe,
      emw_prev_shoe,
      lot_margin,
      p_col,
      collapse_sf,
      bump_pressure,
      burst_limit,
      checks
    };
  }

  /**
   * Riserless Model Calculation Engine (30" Conductor, 20" Surface Casing, Custom)
   */
  function calcRiserless(inp) {
    const xs = 1 + (Number(inp.excess_pct) || 0) / 100;
    const mudline = Number(inp.air_gap) + Number(inp.water_depth);
    const fc = Number(inp.shoe) - Number(inp.shoe_track_len);

    const st_vol = Number(inp.shoe_track_len) * Number(inp.cap_csg);
    const rat_vol = Math.max(0, Number(inp.td) - Number(inp.shoe)) * Number(inp.cap_oh) * xs;
    const v_below = st_vol + rat_vol;

    const hasPrev = Number(inp.prev_shoe || 0) > 0;
    const top_ann = hasPrev ? Number(inp.prev_shoe) : mudline;
    const oh_full = Math.max(0, Number(inp.shoe) - top_ann) * Number(inp.cap_ann_oh) * xs;
    const c_full = hasPrev && Number(inp.cap_ann_c)
      ? Math.max(0, Number(inp.prev_shoe) - mudline) * Number(inp.cap_ann_c)
      : 0;
    const ann_total = oh_full + c_full;

    // depth_top(V)
    function depthTop(v) {
      if (v <= 0) return Number(inp.shoe || 0);
      const annOhCap = Number(inp.cap_ann_oh || 0) * xs;
      if (oh_full > 0 && annOhCap > 0 && v <= oh_full) {
        return Math.max(mudline, Number(inp.shoe || 0) - v / annOhCap);
      }
      const annCCap = Number(inp.cap_ann_c || 0);
      if (hasPrev && annCCap > 0 && c_full > 0) {
        const res = Number(inp.prev_shoe || 0) - (v - oh_full) / annCCap;
        return Math.max(mudline, res);
      }
      if (annOhCap > 0) {
        return Math.max(mudline, Number(inp.shoe || 0) - v / annOhCap);
      }
      return mudline;
    }

    const v_tail = Number(inp.tail_vol) - v_below;
    const v_cem = v_tail + Number(inp.lead_vol);
    const v_sp = v_cem + Number(inp.sp_vol);
    const v_f2 = v_sp + Number(inp.f2_vol);
    const v_f1 = v_f2 + Number(inp.f1_vol);

    const tail_top = depthTop(v_tail);
    const toc = depthTop(v_cem);
    const sp_top = depthTop(v_sp);
    const f2_top = depthTop(v_f2);
    const f1_top = depthTop(v_f1);

    const rise_tail = Number(inp.shoe) - tail_top;
    const rise_lead = tail_top - toc;
    const rise_tot = Number(inp.shoe) - toc;
    const rise_sp = toc - sp_top;
    const rise_f2 = sp_top - f2_top;
    const rise_f1 = f2_top - f1_top;
    const total_slurry = Number(inp.lead_vol) + Number(inp.tail_vol);

    const toc_below_mudline = Math.max(0, toc - mudline);
    const cement_returns_seabed = Math.max(0, v_cem - ann_total);
    const all_fluids_returned = Math.max(0, v_f1 - ann_total);

    // Displacement (inner string only)
    const disp_tot = fc * Number(inp.cap_dp);
    const strokes = Number(inp.pump_output) > 0 ? disp_tot / Number(inp.pump_output) : 0;

    const pumping_sequence = [
      { step: 1, name: '1st Pumping Mud', volume: Number(inp.f1_vol), density: Number(inp.f1_mw) },
      { step: 2, name: '2nd Pumping Mud', volume: Number(inp.f2_vol), density: Number(inp.f2_mw) },
      { step: 3, name: 'Spacer', volume: Number(inp.sp_vol), density: Number(inp.sp_mw) },
      { step: 4, name: 'Lead Slurry', volume: Number(inp.lead_vol), density: Number(inp.lead_mw) },
      { step: 5, name: 'Tail Slurry', volume: Number(inp.tail_vol), density: Number(inp.tail_mw) },
      { step: 6, name: 'Displacement (Inner String)', volume: disp_tot, density: Number(inp.disp_mw) }
    ].filter(s => s.volume > 0 || s.step === 6);

    const total_pumped = Number(inp.f1_vol) + Number(inp.f2_vol) + Number(inp.sp_vol) + Number(inp.lead_vol) + Number(inp.tail_vol) + disp_tot;

    // Pressures (Static, End of Job)
    const layers = [
      { rho: Number(inp.seawater_mw), top: 0, bot: mudline },
      { rho: Number(inp.hole_fluid_mw), top: mudline, bot: f1_top },
      { rho: Number(inp.f1_mw), top: f1_top, bot: f2_top },
      { rho: Number(inp.f2_mw), top: f2_top, bot: sp_top },
      { rho: Number(inp.sp_mw), top: sp_top, bot: toc },
      { rho: Number(inp.lead_mw), top: toc, bot: tail_top },
      { rho: Number(inp.tail_mw), top: tail_top, bot: Number(inp.shoe) }
    ];

    function pAnn(depth) {
      let sum = 0;
      for (const l of layers) {
        const h = Math.max(0, Math.min(l.bot, depth) - Math.min(l.top, depth));
        sum += CONSTANTS.PSI_GRADIENT * l.rho * h;
      }
      return sum;
    }

    const p_ann_fc = pAnn(fc);
    const p_in_fc = CONSTANTS.PSI_GRADIENT * Number(inp.disp_mw) * fc;
    const diff_press = p_ann_fc - p_in_fc;
    const diff_meaning = diff_press > 0
      ? 'Annulus heavier – floats must hold (U-tube risk)'
      : 'String heavier – no back-flow';

    const p_ann_shoe = pAnn(Number(inp.shoe));
    const p_prev_shoe = hasPrev ? pAnn(Number(inp.prev_shoe)) : undefined;

    const emw_fc = fc > 0 ? p_ann_fc / (CONSTANTS.PSI_GRADIENT * fc) : 0;
    const emw_shoe = Number(inp.shoe) > 0 ? p_ann_shoe / (CONSTANTS.PSI_GRADIENT * Number(inp.shoe)) : 0;
    const emw_prev_shoe = (hasPrev && p_prev_shoe !== undefined)
      ? p_prev_shoe / (CONSTANTS.PSI_GRADIENT * Number(inp.prev_shoe))
      : undefined;
    const lot_margin = (inp.lot && Number(inp.lot) > 0 && emw_prev_shoe !== undefined)
      ? Number(inp.lot) - emw_prev_shoe
      : undefined;

    const bottom_rho = Number(inp.tail_vol) > 0 ? Number(inp.tail_mw) : Number(inp.lead_mw);
    const p_col = p_ann_shoe - (p_in_fc + CONSTANTS.PSI_GRADIENT * bottom_rho * (Number(inp.shoe || 0) - fc));
    const collapse_sf = (p_col > 0 && Number(inp.collapse_rating || 0) > 0)
      ? Number(inp.collapse_rating) / p_col
      : (Number(inp.collapse_rating || 0) > 0 ? 999 : 0);

    const burst_limit = 0.8 * Number(inp.burst_rating || 0);

    // Job Checks
    const checks = [];

    // 1. Seabed Cement Returns
    if (total_slurry <= 0) {
      checks.push({
        label: 'Seabed Returns',
        status: 'OK',
        message: 'OK – No slurry pumped'
      });
    } else if (cement_returns_seabed > 0) {
      checks.push({
        label: 'Seabed Returns',
        status: 'OK',
        message: `OK – Cement returns observed at seabed (${cement_returns_seabed.toFixed(1)} bbl excess returned)`
      });
    } else {
      checks.push({
        label: 'Seabed Returns',
        status: 'CHECK',
        message: `CHECK – No cement returns to seabed! TOC is ${toc_below_mudline.toFixed(1)} ft below mudline.`
      });
    }

    // 2. Cement Below Shoe Check
    if (total_slurry <= 0) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'OK',
        message: 'OK – No slurry volume entered'
      });
    } else if (total_slurry < v_below) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'CHECK',
        message: `CHECK – Slurry volume (${total_slurry.toFixed(1)} bbl) does not fill shoe track & rathole (${v_below.toFixed(1)} bbl)`
      });
    } else if (Number(inp.tail_vol || 0) === 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: 'OK – No tail slurry (single-slurry job)'
      });
    } else if (v_tail <= 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'CHECK',
        message: 'CHECK – Tail slurry does not clear shoe into annulus'
      });
    } else {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: `OK – Tail slurry placed ${rise_tail.toFixed(1)} ft into annulus`
      });
    }

    // 3. LOT Margin (for 20" with prev shoe)
    if (lot_margin !== undefined) {
      if (lot_margin >= 0) {
        checks.push({
          label: 'Formation Margin',
          status: 'OK',
          message: `OK – LOT margin at 30" shoe is +${lot_margin.toFixed(2)} ppg (EMW ${emw_prev_shoe !== undefined ? emw_prev_shoe.toFixed(2) : '-'} vs LOT ${inp.lot})`
        });
      } else {
        checks.push({
          label: 'Formation Margin',
          status: 'CHECK',
          message: `CHECK – EMW at 30" shoe (${emw_prev_shoe !== undefined ? emw_prev_shoe.toFixed(2) : '-'} ppg) exceeds LOT (${inp.lot} ppg) by ${Math.abs(lot_margin).toFixed(2)} ppg! Loss risk.`
        });
      }
    }

    // 4. Collapse Safety Factor
    if (Number(inp.collapse_rating || 0) <= 0 || p_col <= 0) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: 'OK – No net collapse differential load at shoe'
      });
    } else if (collapse_sf >= 1.1) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: `OK – Collapse safety factor is ${collapse_sf.toFixed(2)} (≥ 1.10)`
      });
    } else {
      checks.push({
        label: 'Collapse SF',
        status: 'CHECK',
        message: `CHECK – Collapse safety factor is ${collapse_sf.toFixed(2)} (< 1.10 design limit)`
      });
    }

    // 5. Max Pump Pressure vs 80% Burst Limit
    if (burst_limit <= 0) {
      checks.push({
        label: 'Pump Pressure',
        status: 'OK',
        message: 'OK – No burst limit specified'
      });
    } else if (Number(inp.max_pump_pressure || 0) <= burst_limit) {
      checks.push({
        label: 'Pump Pressure',
        status: 'OK',
        message: `OK – Max pump pressure ${Number(inp.max_pump_pressure || 0).toFixed(0)} psi ≤ 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    } else {
      checks.push({
        label: 'Pump Pressure',
        status: 'CHECK',
        message: `CHECK – Max pump pressure ${Number(inp.max_pump_pressure || 0).toFixed(0)} psi exceeds 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    }

    return {
      model: 'riserless',
      mudline,
      fc,
      st_vol,
      rat_vol,
      v_below,
      top_ann,
      oh_full,
      c_full,
      ann_total,
      v_tail,
      v_cem,
      v_sp,
      v_f2,
      v_f1,
      tail_top,
      toc,
      sp_top,
      f2_top,
      f1_top,
      rise_tail,
      rise_lead,
      rise_tot,
      rise_sp,
      rise_f2,
      rise_f1,
      total_slurry,
      toc_below_mudline,
      cement_returns_seabed,
      all_fluids_returned,
      disp_tot,
      strokes,
      pumping_sequence,
      total_pumped,
      p_ann_fc,
      p_in_fc,
      diff_press,
      diff_meaning,
      p_ann_shoe,
      p_prev_shoe,
      emw_fc,
      emw_shoe,
      emw_prev_shoe,
      lot_margin,
      p_col,
      collapse_sf,
      burst_limit,
      checks
    };
  }

  // Capacity calculation helpers
  function calcCasingCap(id_inch) {
    return (id_inch * id_inch) / CONSTANTS.CAP_FACTOR;
  }

  function calcCasingDisp(od_inch, id_inch) {
    return ((od_inch * od_inch) - (id_inch * id_inch)) / CONSTANTS.CAP_FACTOR;
  }

  function calcPipeClosedDisp(od_inch) {
    return (od_inch * od_inch) / CONSTANTS.CAP_FACTOR;
  }

  function calcOpenHoleCap(hole_inch) {
    return (hole_inch * hole_inch) / CONSTANTS.CAP_FACTOR;
  }

  function calcRiserCap(riser_id_inch) {
    return (riser_id_inch * riser_id_inch) / CONSTANTS.CAP_FACTOR;
  }

  function calcCasedAnnulusCap(prevCsgCap, csgCap, csgDisp) {
    return Number(prevCsgCap) - (Number(csgCap) + Number(csgDisp));
  }

  function calcOpenHoleAnnulusCap(ohCap, csgCap, csgDisp) {
    return Number(ohCap) - (Number(csgCap) + Number(csgDisp));
  }

  function calcRiserAnnulusCap(riserCap, stringClosedDisp) {
    return Number(riserCap) - Number(stringClosedDisp);
  }

  function ftToMeters(ft) {
    return Number(ft) * 0.3048;
  }

  function metersToFt(m) {
    return Number(m) / 0.3048;
  }

  function bblFtToBblM(bblFt) {
    return Number(bblFt) / 0.3048;
  }

  function bblMToBblFt(bblM) {
    return Number(bblM) * 0.3048;
  }

  /**
   * Surface Conductor Calculation Engine (Inner-string stab-in job on Jack-up or Land rig)
   */
  function calcSurfaceConductor(inp) {
    const xs = 1 + (Number(inp.excess_pct) || 0) / 100;
    const isJackUp = inp.rig_type === 'jack-up';
    const seabed = Number(inp.seabed) || 0;
    const fc = Number(inp.shoe) - Number(inp.shoe_track_len);

    const st_vol = Number(inp.shoe_track_len) * Number(inp.cap_csg);
    const rat_vol = Math.max(0, Number(inp.td) - Number(inp.shoe)) * Number(inp.cap_oh) * xs;
    const v_below = st_vol + rat_vol;

    const top_ann = seabed;
    const oh_full = Math.max(0, Number(inp.shoe) - top_ann) * Number(inp.cap_ann_oh) * xs;
    const c_full = 0;
    const ann_total = oh_full;

    // depthTop(V)
    function depthTop(v) {
      if (v <= 0) return Number(inp.shoe) || 0;
      const annOhCap = (Number(inp.cap_ann_oh) || 0) * xs;
      if (annOhCap > 0) {
        return Math.max(top_ann, (Number(inp.shoe) || 0) - v / annOhCap);
      }
      return top_ann;
    }

    const v_tail = (Number(inp.tail_vol) || 0) - v_below;
    const v_cem = v_tail + (Number(inp.lead_vol) || 0);
    const v_sp = v_cem + (Number(inp.sp_vol) || 0);
    const v_f2 = v_sp + (Number(inp.f2_vol) || 0);
    const v_f1 = v_f2 + (Number(inp.f1_vol) || 0);

    const tail_top = (Number(inp.tail_vol) || 0) > 0 ? depthTop(v_tail) : Number(inp.shoe);
    const toc = depthTop(v_cem);
    const sp_top = depthTop(v_sp);
    const f2_top = depthTop(v_f2);
    const f1_top = depthTop(v_f1);

    const rise_tail = (Number(inp.tail_vol) || 0) > 0 ? Number(inp.shoe) - tail_top : 0;
    const rise_lead = (Number(inp.lead_vol) || 0) > 0 ? tail_top - toc : 0;
    const rise_tot = Number(inp.shoe) - toc;
    const rise_sp = (Number(inp.sp_vol) || 0) > 0 ? toc - sp_top : 0;
    const rise_f2 = (Number(inp.f2_vol) || 0) > 0 ? sp_top - f2_top : 0;
    const rise_f1 = (Number(inp.f1_vol) || 0) > 0 ? f2_top - f1_top : 0;
    const total_slurry = (Number(inp.lead_vol) || 0) + (Number(inp.tail_vol) || 0);

    const toc_below_mudline = Math.max(0, toc - top_ann);
    const cement_returns_seabed = Math.max(0, v_cem - ann_total);
    const all_fluids_returned = Math.max(0, v_f1 - ann_total);

    // Displacement (inner string only)
    const disp_tot = fc * Number(inp.cap_dp);
    const strokes = Number(inp.pump_output) > 0 ? disp_tot / Number(inp.pump_output) : 0;

    const pumping_sequence = [
      { step: 1, name: '1st Pumping Mud', volume: Number(inp.f1_vol) || 0, density: Number(inp.f1_mw) || 0 },
      { step: 2, name: '2nd Pumping Mud', volume: Number(inp.f2_vol) || 0, density: Number(inp.f2_mw) || 0 },
      { step: 3, name: 'Spacer', volume: Number(inp.sp_vol) || 0, density: Number(inp.sp_mw) || 0 },
      { step: 4, name: 'Lead Slurry', volume: Number(inp.lead_vol) || 0, density: Number(inp.lead_mw) || 0 },
      { step: 5, name: 'Tail Slurry', volume: Number(inp.tail_vol) || 0, density: Number(inp.tail_mw) || 0 },
      { step: 6, name: 'Displacement (Inner String)', volume: disp_tot, density: Number(inp.disp_mw) || 0 }
    ].filter(s => s.volume > 0 || s.step === 6);

    const total_pumped = (Number(inp.f1_vol) || 0) + (Number(inp.f2_vol) || 0) + (Number(inp.sp_vol) || 0) + (Number(inp.lead_vol) || 0) + (Number(inp.tail_vol) || 0) + disp_tot;

    // Pressures (Static, End of Job)
    const topLayerMw = isJackUp ? (Number(inp.seawater_mw) || 0) : 0;
    const layers = [
      { rho: topLayerMw, top: 0, bot: top_ann },
      { rho: Number(inp.hole_fluid_mw) || 0, top: top_ann, bot: f1_top },
      { rho: Number(inp.f1_mw) || 0, top: f1_top, bot: f2_top },
      { rho: Number(inp.f2_mw) || 0, top: f2_top, bot: sp_top },
      { rho: Number(inp.sp_mw) || 0, top: sp_top, bot: toc },
      { rho: Number(inp.lead_mw) || 0, top: toc, bot: tail_top },
      { rho: Number(inp.tail_mw) || 0, top: tail_top, bot: Number(inp.shoe) }
    ];

    function pAnn(depth) {
      let sum = 0;
      for (const l of layers) {
        const h = Math.max(0, Math.min(l.bot, depth) - Math.min(l.top, depth));
        sum += CONSTANTS.PSI_GRADIENT * l.rho * h;
      }
      return sum;
    }

    const p_ann_fc = pAnn(fc);
    const p_in_fc = CONSTANTS.PSI_GRADIENT * Number(inp.disp_mw) * fc;
    const diff_press = p_ann_fc - p_in_fc;
    const diff_meaning = diff_press > 0
      ? 'Annulus heavier – floats must hold (U-tube risk)'
      : 'String heavier – no back-flow';

    const p_ann_shoe = pAnn(Number(inp.shoe));
    const emw_fc = fc > 0 ? p_ann_fc / (CONSTANTS.PSI_GRADIENT * fc) : 0;
    const emw_shoe = Number(inp.shoe) > 0 ? p_ann_shoe / (CONSTANTS.PSI_GRADIENT * Number(inp.shoe)) : 0;

    const bottom_rho = (Number(inp.tail_vol) || 0) > 0 ? (Number(inp.tail_mw) || 0) : (Number(inp.lead_mw) || 0);
    const p_col = p_ann_shoe - (p_in_fc + CONSTANTS.PSI_GRADIENT * bottom_rho * (Number(inp.shoe) - fc));
    const collapse_sf = (p_col > 0 && (Number(inp.collapse_rating) || 0) > 0)
      ? Number(inp.collapse_rating) / p_col
      : ((Number(inp.collapse_rating) || 0) > 0 ? 999 : 0);

    const burst_limit = 0.8 * (Number(inp.burst_rating) || 0);

    // Job Checks
    const checks = [];
    const returnLocLabel = isJackUp ? 'Seabed Returns' : 'Ground Level Returns';
    const returnLocName = isJackUp ? 'seabed' : 'ground level';

    // 1. Returns Check
    if (total_slurry <= 0) {
      checks.push({
        label: returnLocLabel,
        status: 'OK',
        message: 'OK – No slurry pumped'
      });
    } else if (cement_returns_seabed > 0) {
      checks.push({
        label: returnLocLabel,
        status: 'OK',
        message: `OK – Cement returns observed at ${returnLocName} (${cement_returns_seabed.toFixed(1)} bbl excess returned)`
      });
    } else {
      checks.push({
        label: returnLocLabel,
        status: 'CHECK',
        message: `CHECK – No cement returns to ${returnLocName}! TOC is ${toc_below_mudline.toFixed(1)} ft below ${returnLocName}.`
      });
    }

    // 2. Cement Below Shoe Check
    if (total_slurry <= 0) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'OK',
        message: 'OK – No slurry volume entered'
      });
    } else if (total_slurry < v_below) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'CHECK',
        message: `CHECK – Slurry volume (${total_slurry.toFixed(1)} bbl) does not fill shoe track & rathole (${v_below.toFixed(1)} bbl)`
      });
    } else if (Number(inp.tail_vol || 0) === 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: 'OK – No tail slurry (single-slurry job)'
      });
    } else if (v_tail <= 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'CHECK',
        message: 'CHECK – Tail slurry does not clear shoe into annulus'
      });
    } else {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: `OK – Tail slurry placed ${rise_tail.toFixed(1)} ft into annulus`
      });
    }

    // 3. Collapse Safety Factor
    if (Number(inp.collapse_rating || 0) <= 0 || p_col <= 0) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: 'OK – No net collapse differential load at shoe'
      });
    } else if (collapse_sf >= 1.1) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: `OK – Collapse safety factor is ${collapse_sf.toFixed(2)} (≥ 1.10)`
      });
    } else {
      checks.push({
        label: 'Collapse SF',
        status: 'CHECK',
        message: `CHECK – Collapse safety factor is ${collapse_sf.toFixed(2)} (< 1.10 design limit)`
      });
    }

    // 4. Max Pump Pressure vs 80% Burst Limit
    if (burst_limit <= 0) {
      checks.push({
        label: 'Pump Pressure',
        status: 'OK',
        message: 'OK – No burst limit specified'
      });
    } else if ((Number(inp.max_pump_pressure) || 0) <= burst_limit) {
      checks.push({
        label: 'Pump Pressure',
        status: 'OK',
        message: `OK – Max pump pressure ${Number(inp.max_pump_pressure || 0).toFixed(0)} psi ≤ 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    } else {
      checks.push({
        label: 'Pump Pressure',
        status: 'CHECK',
        message: `CHECK – Max pump pressure ${Number(inp.max_pump_pressure || 0).toFixed(0)} psi exceeds 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    }

    return {
      model: 'surface_conductor',
      mudline: seabed,
      fc,
      st_vol,
      rat_vol,
      v_below,
      top_ann,
      oh_full,
      c_full,
      ann_total,
      v_tail,
      v_cem,
      v_sp,
      v_f2,
      v_f1,
      tail_top,
      toc,
      sp_top,
      f2_top,
      f1_top,
      rise_tail,
      rise_lead,
      rise_tot,
      rise_sp,
      rise_f2,
      rise_f1,
      total_slurry,
      toc_below_mudline,
      cement_returns_seabed,
      all_fluids_returned,
      disp_tot,
      strokes,
      pumping_sequence,
      total_pumped,
      p_ann_fc,
      p_in_fc,
      diff_press,
      diff_meaning,
      p_ann_shoe,
      emw_fc,
      emw_shoe,
      p_col,
      collapse_sf,
      burst_limit,
      checks
    };
  }

  /**
   * Surface Casing Calculation Engine (Surface Casing, Intermediate Casing, Production Casing, Custom)
   */
  function calcSurfaceCasing(inp) {
    const xs = 1 + (Number(inp.excess_pct) || 0) / 100;
    const fc = Number(inp.shoe) - Number(inp.shoe_track_len);

    const st_vol = Number(inp.shoe_track_len) * Number(inp.cap_csg);
    const rat_vol = Math.max(0, Number(inp.td) - Number(inp.shoe)) * Number(inp.cap_oh) * xs;
    const v_below = st_vol + rat_vol;

    const prev_shoe = Number(inp.prev_shoe) || 0;
    const hasPrev = prev_shoe > 0;
    const top_ann = prev_shoe;
    const oh_full = Math.max(0, Number(inp.shoe) - prev_shoe) * Number(inp.cap_ann_oh) * xs;
    const c_full = prev_shoe * Number(inp.cap_ann_c || 0);
    const ann_total = oh_full + c_full;

    // depthTop(V)
    function depthTop(v) {
      if (v <= 0) return Number(inp.shoe) || 0;
      const annOhCap = (Number(inp.cap_ann_oh) || 0) * xs;
      if (oh_full > 0 && annOhCap > 0 && v <= oh_full) {
        return Math.max(0, (Number(inp.shoe) || 0) - v / annOhCap);
      }
      const annCCap = Number(inp.cap_ann_c) || 0;
      if (annCCap > 0) {
        return Math.max(0, prev_shoe - (v - oh_full) / annCCap);
      }
      return 0;
    }

    const v_tail = (Number(inp.tail_vol) || 0) - v_below;
    const v_cem = v_tail + (Number(inp.lead_vol) || 0);
    const v_sp = v_cem + (Number(inp.sp_vol) || 0);
    const v_f2 = v_sp + (Number(inp.f2_vol) || 0);
    const v_f1 = v_f2 + (Number(inp.f1_vol) || 0);

    const tail_top = (Number(inp.tail_vol) || 0) > 0 ? depthTop(v_tail) : Number(inp.shoe);
    const toc = depthTop(v_cem);
    const sp_top = depthTop(v_sp);
    const f2_top = depthTop(v_f2);
    const f1_top = depthTop(v_f1);

    const rise_tail = (Number(inp.tail_vol) || 0) > 0 ? Number(inp.shoe) - tail_top : 0;
    const rise_lead = (Number(inp.lead_vol) || 0) > 0 ? tail_top - toc : 0;
    const rise_tot = Number(inp.shoe) - toc;
    const rise_sp = (Number(inp.sp_vol) || 0) > 0 ? toc - sp_top : 0;
    const rise_f2 = (Number(inp.f2_vol) || 0) > 0 ? sp_top - f2_top : 0;
    const rise_f1 = (Number(inp.f1_vol) || 0) > 0 ? f2_top - f1_top : 0;
    const total_slurry = (Number(inp.lead_vol) || 0) + (Number(inp.tail_vol) || 0);

    const cement_returns_surface = Math.max(0, v_cem - ann_total);
    const returns_surface = cement_returns_surface;
    const all_fluids_returned = Math.max(0, v_f1 - ann_total);
    const planned_toc = Number(inp.planned_toc) || 0;
    const toc_above_plan = planned_toc - toc;

    // Displacement (from surface casing head)
    const disp_tot = fc * Number(inp.cap_csg);
    const strokes = Number(inp.pump_output) > 0 ? disp_tot / Number(inp.pump_output) : 0;
    const max_disp_no_bump = disp_tot + st_vol / 2;
    const bottom_plug_lands = Math.max(0, disp_tot - total_slurry);

    const pumping_sequence = [
      { step: 1, name: '1st Pumping Mud', volume: Number(inp.f1_vol) || 0, density: Number(inp.f1_mw) || 0 },
      { step: 2, name: '2nd Pumping Mud', volume: Number(inp.f2_vol) || 0, density: Number(inp.f2_mw) || 0 },
      { step: 3, name: 'Spacer', volume: Number(inp.sp_vol) || 0, density: Number(inp.sp_mw) || 0 },
      { step: 4, name: 'Lead Slurry', volume: Number(inp.lead_vol) || 0, density: Number(inp.lead_mw) || 0 },
      { step: 5, name: 'Tail Slurry', volume: Number(inp.tail_vol) || 0, density: Number(inp.tail_mw) || 0 },
      { step: 6, name: 'Displacement', volume: disp_tot, density: Number(inp.mw) || 0 }
    ].filter(s => s.volume > 0 || s.step === 6);

    const total_pumped = (Number(inp.f1_vol) || 0) + (Number(inp.f2_vol) || 0) + (Number(inp.sp_vol) || 0) + (Number(inp.lead_vol) || 0) + (Number(inp.tail_vol) || 0) + disp_tot;

    // Pressures (Static, End of Job)
    const layers = [
      { rho: Number(inp.mw) || 0, top: 0, bot: f1_top },
      { rho: Number(inp.f1_mw) || 0, top: f1_top, bot: f2_top },
      { rho: Number(inp.f2_mw) || 0, top: f2_top, bot: sp_top },
      { rho: Number(inp.sp_mw) || 0, top: sp_top, bot: toc },
      { rho: Number(inp.lead_mw) || 0, top: toc, bot: tail_top },
      { rho: Number(inp.tail_mw) || 0, top: tail_top, bot: Number(inp.shoe) }
    ];

    function pAnn(depth) {
      let sum = 0;
      for (const l of layers) {
        const h = Math.max(0, Math.min(l.bot, depth) - Math.min(l.top, depth));
        sum += CONSTANTS.PSI_GRADIENT * l.rho * h;
      }
      return sum;
    }

    const p_ann_fc = pAnn(fc);
    const p_in_fc = CONSTANTS.PSI_GRADIENT * Number(inp.mw) * fc;
    const diff_press = p_ann_fc - p_in_fc;
    const diff_meaning = diff_press > 0
      ? 'Annulus heavier – floats must hold (U-tube risk)'
      : 'String heavier – no back-flow';

    const p_ann_shoe = pAnn(Number(inp.shoe));
    const p_prev_shoe = hasPrev ? pAnn(prev_shoe) : undefined;

    const emw_fc = fc > 0 ? p_ann_fc / (CONSTANTS.PSI_GRADIENT * fc) : 0;
    const emw_shoe = Number(inp.shoe) > 0 ? p_ann_shoe / (CONSTANTS.PSI_GRADIENT * Number(inp.shoe)) : 0;
    const emw_prev_shoe = (hasPrev && p_prev_shoe !== undefined && prev_shoe > 0)
      ? p_prev_shoe / (CONSTANTS.PSI_GRADIENT * prev_shoe)
      : undefined;
    const lot_margin = (inp.lot && Number(inp.lot) > 0 && emw_prev_shoe !== undefined)
      ? Number(inp.lot) - emw_prev_shoe
      : undefined;

    const bottom_rho = (Number(inp.tail_vol) || 0) > 0 ? (Number(inp.tail_mw) || 0) : (Number(inp.lead_mw) || 0);
    const p_col = p_ann_shoe - (p_in_fc + CONSTANTS.PSI_GRADIENT * bottom_rho * (Number(inp.shoe) - fc));
    const collapse_sf = (p_col > 0 && (Number(inp.collapse_rating) || 0) > 0)
      ? Number(inp.collapse_rating) / p_col
      : ((Number(inp.collapse_rating) || 0) > 0 ? 999 : 0);

    const bump_pressure = diff_press + (Number(inp.bump) || 0);
    const burst_limit = 0.8 * (Number(inp.burst_rating) || 0);

    // Job Checks
    const checks = [];

    // 1. TOC vs Planned
    if (total_slurry <= 0) {
      checks.push({
        label: 'TOC Position',
        status: 'OK',
        message: 'OK – No slurry pumped'
      });
    } else if (toc <= planned_toc + 0.5) {
      checks.push({
        label: 'TOC Position',
        status: 'OK',
        message: `OK – TOC is at ${toc.toFixed(1)} ft (${Math.abs(toc_above_plan).toFixed(1)} ft ${toc_above_plan >= 0 ? 'above' : 'below'} planned ${planned_toc.toFixed(0)} ft)`
      });
    } else {
      checks.push({
        label: 'TOC Position',
        status: 'CHECK',
        message: `CHECK – TOC is at ${toc.toFixed(1)} ft (${Math.abs(toc_above_plan).toFixed(1)} ft below planned ${planned_toc.toFixed(0)} ft!)`
      });
    }

    // 2. Cement Below Shoe Check
    if (total_slurry <= 0) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'OK',
        message: 'OK – No slurry volume entered'
      });
    } else if (total_slurry < v_below) {
      checks.push({
        label: 'Cement Below Shoe',
        status: 'CHECK',
        message: `CHECK – Slurry volume (${total_slurry.toFixed(1)} bbl) does not fill shoe track & rathole (${v_below.toFixed(1)} bbl)`
      });
    } else if (Number(inp.tail_vol || 0) === 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: 'OK – No tail slurry (single-slurry job)'
      });
    } else if (v_tail <= 0) {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'CHECK',
        message: 'CHECK – Tail slurry does not clear shoe into annulus'
      });
    } else {
      checks.push({
        label: 'Tail Slurry Placement',
        status: 'OK',
        message: `OK – Tail slurry placed ${rise_tail.toFixed(1)} ft into annulus`
      });
    }

    // 3. LOT Margin at Previous Shoe
    if (lot_margin !== undefined) {
      if (lot_margin >= 0) {
        checks.push({
          label: 'Formation Margin',
          status: 'OK',
          message: `OK – LOT margin at previous shoe (${prev_shoe} ft) is +${lot_margin.toFixed(2)} ppg (EMW ${emw_prev_shoe !== undefined ? emw_prev_shoe.toFixed(2) : '-'} vs LOT ${inp.lot} ppg)`
        });
      } else {
        checks.push({
          label: 'Formation Margin',
          status: 'CHECK',
          message: `CHECK – EMW at previous shoe (${emw_prev_shoe !== undefined ? emw_prev_shoe.toFixed(2) : '-'} ppg) exceeds LOT (${inp.lot} ppg) by ${Math.abs(lot_margin).toFixed(2)} ppg! Loss risk.`
        });
      }
    }

    // 4. Bump Pressure vs 80% Burst Limit
    if (burst_limit <= 0) {
      checks.push({
        label: 'Bump Pressure',
        status: 'OK',
        message: 'OK – No burst limit specified'
      });
    } else if (bump_pressure <= burst_limit) {
      checks.push({
        label: 'Bump Pressure',
        status: 'OK',
        message: `OK – Bump pressure ${bump_pressure.toFixed(0)} psi ≤ 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    } else {
      checks.push({
        label: 'Bump Pressure',
        status: 'CHECK',
        message: `CHECK – Bump pressure ${bump_pressure.toFixed(0)} psi exceeds 80% burst limit (${burst_limit.toFixed(0)} psi)`
      });
    }

    // 5. Collapse Safety Factor
    if (Number(inp.collapse_rating || 0) <= 0 || p_col <= 0) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: 'OK – No net collapse differential load at shoe'
      });
    } else if (collapse_sf >= 1.1) {
      checks.push({
        label: 'Collapse SF',
        status: 'OK',
        message: `OK – Collapse safety factor is ${collapse_sf.toFixed(2)} (≥ 1.10)`
      });
    } else {
      checks.push({
        label: 'Collapse SF',
        status: 'CHECK',
        message: `CHECK – Collapse safety factor is ${collapse_sf.toFixed(2)} (< 1.10 design limit)`
      });
    }

    return {
      model: 'surface_casing',
      mudline: 0,
      fc,
      st_vol,
      rat_vol,
      v_below,
      top_ann,
      oh_full,
      c_full,
      ann_total,
      v_tail,
      v_cem,
      v_sp,
      v_f2,
      v_f1,
      tail_top,
      toc,
      sp_top,
      f2_top,
      f1_top,
      rise_tail,
      rise_lead,
      rise_tot,
      rise_sp,
      rise_f2,
      rise_f1,
      total_slurry,
      cement_returns_surface,
      returns_surface,
      toc_above_plan,
      all_fluids_returned,
      disp_tot,
      strokes,
      max_disp_no_bump,
      bottom_plug_lands,
      pumping_sequence,
      total_pumped,
      p_ann_fc,
      p_in_fc,
      diff_press,
      diff_meaning,
      p_ann_shoe,
      p_prev_shoe,
      emw_fc,
      emw_shoe,
      emw_prev_shoe,
      lot_margin,
      p_col,
      collapse_sf,
      bump_pressure,
      burst_limit,
      checks
    };
  }

  return {
    CONSTANTS,
    calcSubsea,
    calcRiserless,
    calcSurfaceConductor,
    calcSurfaceCasing,
    calcCasingCap,
    calcCasingDisp,
    calcPipeClosedDisp,
    calcOpenHoleCap,
    calcRiserCap,
    calcCasedAnnulusCap,
    calcOpenHoleAnnulusCap,
    calcRiserAnnulusCap,
    ftToMeters,
    metersToFt,
    bblFtToBblM,
    bblMToBblFt
  };
}));
