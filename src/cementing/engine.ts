/**
 * Subsea & Riserless Well Casing Cementing Engine
 * Pure TypeScript Module for Drilling Toolkit
 */

export const CONSTANTS = {
  CAP_FACTOR: 1029.4,        // in² -> bbl/ft
  CUFT_PER_BBL: 5.6146,      // ft³/bbl
  PSI_GRADIENT: 0.052,       // psi/ft per ppg
  M_PER_FT: 0.3048,          // exact 1 ft = 0.3048 m
  FT_PER_M: 1 / 0.3048       // exact 1 m = 3.280839895013123 ft
};

export interface SubseaCementInput {
  air_gap: number;           // ft
  water_depth: number;       // ft
  hanger: number;            // ft (casing hanger depth / wellhead)
  prev_shoe: number;         // ft (previous casing shoe)
  td: number;                // ft (hole TD)
  shoe: number;              // ft (casing shoe)
  shoe_track_len: number;    // ft
  mw: number;                // ppg (well mud in hole, displacement fluid)
  f1_vol: number;            // bbl
  f1_mw: number;             // ppg
  f2_vol: number;            // bbl
  f2_mw: number;             // ppg
  sp_vol: number;            // bbl
  sp_mw: number;             // ppg
  lead_vol: number;          // bbl
  lead_mw: number;           // ppg
  tail_vol: number;          // bbl
  tail_mw: number;           // ppg
  excess_pct: number;        // open hole excess percentage (e.g. 30 for 30%)
  pump_output: number;       // bbl/stk
  lot: number;               // ppg EMW at previous shoe
  collapse_rating: number;   // psi
  burst_rating: number;      // psi
  bump: number;              // psi (bump above final circulating pressure)

  // Capacities (bbl/ft)
  cap_csg: number;
  csg_disp: number;
  cap_prev_csg: number;
  cap_oh: number;
  cap_ann_oh: number;        // oh - (csg + csg_disp)
  cap_ann_c: number;         // prev_csg - (csg + csg_disp)
  cap_dp: number;            // landing string capacity
  dp_cl_disp: number;        // landing string closed displacement
  cap_riser: number;         // riser capacity minus string closed disp (riser annulus)
}

export interface RiserlessCementInput {
  air_gap: number;           // ft
  water_depth: number;       // ft
  prev_shoe: number;         // ft (0 for 30" conductor)
  td: number;                // ft (hole TD)
  shoe: number;              // ft (casing shoe)
  shoe_track_len: number;    // ft
  seawater_mw: number;       // ppg (above mudline)
  hole_fluid_mw: number;     // ppg (in annulus before job)
  disp_mw: number;           // ppg (displacement fluid MW)
  f1_vol: number;            // bbl
  f1_mw: number;             // ppg
  f2_vol: number;            // bbl
  f2_mw: number;             // ppg
  sp_vol: number;            // bbl
  sp_mw: number;             // ppg
  lead_vol: number;          // bbl
  lead_mw: number;           // ppg
  tail_vol: number;          // bbl
  tail_mw: number;           // ppg
  excess_pct: number;        // %
  pump_output: number;       // bbl/stk
  lot?: number;              // ppg EMW (for 20" only)
  collapse_rating: number;   // psi
  burst_rating: number;      // psi
  max_pump_pressure: number; // psi

  // Capacities (bbl/ft)
  cap_csg: number;
  csg_disp?: number;
  cap_prev_csg?: number;
  cap_oh: number;
  cap_ann_oh: number;        // oh - (csg + csg_disp)
  cap_ann_c?: number;        // prev_csg - (csg + csg_disp)
  cap_dp: number;            // inner string capacity
}

export interface PumpingStep {
  step: number;
  name: string;
  volume: number;
  density: number;
}

export interface JobCheck {
  label: string;
  status: 'OK' | 'CHECK';
  message: string;
}

export interface CementingResult {
  model: 'subsea' | 'riserless';
  mudline: number;
  fc: number;
  st_vol: number;
  rat_vol: number;
  v_below: number;
  top_ann: number;
  oh_full: number;
  c_full: number;
  r_full?: number;
  ann_total?: number;

  // Cumulative volumes
  v_tail: number;
  v_cem: number;
  v_sp: number;
  v_f2: number;
  v_f1: number;

  // Tops & rises
  tail_top: number;
  toc: number;
  sp_top: number;
  f2_top: number;
  f1_top: number;
  rise_tail: number;
  rise_lead: number;
  rise_tot: number;
  rise_sp: number;
  rise_f2: number;
  rise_f1: number;
  total_slurry: number;

  // Model-specific extras
  cement_in_riser?: number;
  returns_surface?: number;
  toc_below_mudline?: number;
  cement_returns_seabed?: number;
  all_fluids_returned?: number;

  // Displacement
  disp_dp?: number;
  disp_csg?: number;
  disp_tot: number;
  strokes: number;
  max_disp_no_bump?: number;
  bottom_plug_lands?: number;
  top_plug_releases?: number;
  pumping_sequence: PumpingStep[];
  total_pumped: number;

  // Pressures & EMW
  p_ann_fc: number;
  p_in_fc: number;
  diff_press: number;
  diff_meaning: string;
  p_ann_shoe: number;
  p_prev_shoe?: number;
  emw_fc: number;
  emw_shoe: number;
  emw_prev_shoe?: number;
  lot_margin?: number;
  p_col: number;
  collapse_sf: number;
  bump_pressure?: number;
  burst_limit: number;

  // Checks
  checks: JobCheck[];
}

/**
 * Subsea Model Calculation Engine (13-3/8", 9-5/8", Custom)
 */
export function calcSubsea(inp: SubseaCementInput): CementingResult {
  const xs = 1 + (inp.excess_pct || 0) / 100;
  const mudline = inp.air_gap + inp.water_depth;
  const fc = inp.shoe - inp.shoe_track_len;

  const st_vol = inp.shoe_track_len * inp.cap_csg;
  const rat_vol = Math.max(0, inp.td - inp.shoe) * inp.cap_oh * xs;
  const v_below = st_vol + rat_vol;

  const top_ann = inp.prev_shoe;
  const oh_full = Math.max(0, inp.shoe - top_ann) * inp.cap_ann_oh * xs;
  const c_full = Math.max(0, inp.prev_shoe - inp.hanger) * inp.cap_ann_c;
  const r_full = inp.hanger * inp.cap_riser;

  // depth_top(V)
  const depthTop = (v: number): number => {
    if (v <= 0) return inp.shoe || 0;
    const annOhCap = (inp.cap_ann_oh || 0) * xs;
    if (oh_full > 0 && annOhCap > 0 && v <= oh_full) {
      return Math.max(0, (inp.shoe || 0) - v / annOhCap);
    }
    const annCCap = inp.cap_ann_c || 0;
    if (c_full > 0 && annCCap > 0 && v <= oh_full + c_full) {
      return Math.max(0, (inp.prev_shoe || 0) - (v - oh_full) / annCCap);
    }
    const riserCap = inp.cap_riser || 0;
    if (riserCap > 0) {
      const res = (inp.hanger || 0) - (v - oh_full - c_full) / riserCap;
      return Math.max(0, res);
    }
    return 0;
  };

  const v_tail = inp.tail_vol - v_below;
  const v_cem = v_tail + inp.lead_vol;
  const v_sp = v_cem + inp.sp_vol;
  const v_f2 = v_sp + inp.f2_vol;
  const v_f1 = v_f2 + inp.f1_vol;

  const tail_top = depthTop(v_tail);
  const toc = depthTop(v_cem);
  const sp_top = depthTop(v_sp);
  const f2_top = depthTop(v_f2);
  const f1_top = depthTop(v_f1);

  const rise_tail = inp.shoe - tail_top;
  const rise_lead = tail_top - toc;
  const rise_tot = inp.shoe - toc;
  const rise_sp = toc - sp_top;
  const rise_f2 = sp_top - f2_top;
  const rise_f1 = f2_top - f1_top;
  const total_slurry = inp.lead_vol + inp.tail_vol;

  const cement_in_riser = Math.max(0, inp.hanger - toc);
  const returns_surface = Math.max(0, v_f1 - oh_full - c_full - r_full);

  // Displacement
  const disp_dp = inp.hanger * inp.cap_dp;
  const disp_csg = (fc - inp.hanger) * inp.cap_csg;
  const disp_tot = disp_dp + disp_csg;
  const strokes = inp.pump_output > 0 ? disp_tot / inp.pump_output : 0;
  const max_disp_no_bump = disp_tot + st_vol / 2;
  const bottom_plug_lands = Math.max(0, disp_tot - total_slurry);
  const top_plug_releases = disp_dp;

  const pumping_sequence: PumpingStep[] = [
    { step: 1, name: '1st Pumping Mud', volume: inp.f1_vol, density: inp.f1_mw },
    { step: 2, name: '2nd Pumping Mud', volume: inp.f2_vol, density: inp.f2_mw },
    { step: 3, name: 'Spacer', volume: inp.sp_vol, density: inp.sp_mw },
    { step: 4, name: 'Lead Slurry', volume: inp.lead_vol, density: inp.lead_mw },
    { step: 5, name: 'Tail Slurry', volume: inp.tail_vol, density: inp.tail_mw },
    { step: 6, name: 'Displacement', volume: disp_tot, density: inp.mw }
  ].filter(s => s.volume > 0 || s.step === 6);

  const total_pumped = inp.f1_vol + inp.f2_vol + inp.sp_vol + inp.lead_vol + inp.tail_vol + disp_tot;

  // Pressures (Static, End of Job)
  const layers = [
    { rho: inp.mw, top: 0, bot: f1_top },
    { rho: inp.f1_mw, top: f1_top, bot: f2_top },
    { rho: inp.f2_mw, top: f2_top, bot: sp_top },
    { rho: inp.sp_mw, top: sp_top, bot: toc },
    { rho: inp.lead_mw, top: toc, bot: tail_top },
    { rho: inp.tail_mw, top: tail_top, bot: inp.shoe }
  ];

  const pAnn = (depth: number): number => {
    let sum = 0;
    for (const l of layers) {
      const h = Math.max(0, Math.min(l.bot, depth) - Math.min(l.top, depth));
      sum += CONSTANTS.PSI_GRADIENT * l.rho * h;
    }
    return sum;
  };

  const p_ann_fc = pAnn(fc);
  const p_in_fc = CONSTANTS.PSI_GRADIENT * inp.mw * fc;
  const diff_press = p_ann_fc - p_in_fc;
  const diff_meaning = diff_press > 0
    ? 'Annulus heavier – floats must hold (U-tube risk)'
    : 'String heavier – no back-flow';

  const p_ann_shoe = pAnn(inp.shoe);
  const p_prev_shoe = inp.prev_shoe > 0 ? pAnn(inp.prev_shoe) : undefined;

  const emw_fc = fc > 0 ? p_ann_fc / (CONSTANTS.PSI_GRADIENT * fc) : 0;
  const emw_shoe = inp.shoe > 0 ? p_ann_shoe / (CONSTANTS.PSI_GRADIENT * inp.shoe) : 0;
  const emw_prev_shoe = (inp.prev_shoe > 0 && p_prev_shoe !== undefined)
    ? p_prev_shoe / (CONSTANTS.PSI_GRADIENT * inp.prev_shoe)
    : undefined;
  const lot_margin = (inp.lot > 0 && emw_prev_shoe !== undefined)
    ? inp.lot - emw_prev_shoe
    : undefined;

  const bottom_rho = inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw;
  const p_col = p_ann_shoe - (p_in_fc + CONSTANTS.PSI_GRADIENT * bottom_rho * ((inp.shoe || 0) - fc));
  const collapse_sf = (p_col > 0 && (inp.collapse_rating || 0) > 0)
    ? inp.collapse_rating / p_col
    : ((inp.collapse_rating || 0) > 0 ? 999 : 0);

  const bump_pressure = diff_press + (inp.bump || 0);
  const burst_limit = 0.8 * (inp.burst_rating || 0);

  // Job Checks
  const checks: JobCheck[] = [];

  // 1. TOC vs Hanger
  if (total_slurry <= 0) {
    checks.push({
      label: 'TOC Position',
      status: 'OK',
      message: 'OK – No slurry pumped'
    });
  } else if (toc > (inp.hanger || 0)) {
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
  } else if ((inp.tail_vol || 0) === 0) {
    checks.push({
      label: 'Tail Slurry Placement',
      status: 'OK',
      message: 'OK – No tail slurry (single-slurry job)'
    });
  } else if (v_tail <= 0) {
    checks.push({
      label: 'Tail Slurry Placement',
      status: 'CHECK',
      message: `CHECK – Tail slurry does not clear shoe into annulus (fills rathole/shoe track only)`
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
        message: `OK – LOT margin at prev shoe is +${lot_margin.toFixed(2)} ppg (EMW ${emw_prev_shoe?.toFixed(2)} vs LOT ${inp.lot})`
      });
    } else {
      checks.push({
        label: 'Formation Margin',
        status: 'CHECK',
        message: `CHECK – EMW at prev shoe (${emw_prev_shoe?.toFixed(2)} ppg) exceeds LOT (${inp.lot} ppg) by ${Math.abs(lot_margin).toFixed(2)} ppg! Loss risk.`
      });
    }
  }

  // 4. Collapse Safety Factor
  if ((inp.collapse_rating || 0) <= 0 || p_col <= 0) {
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
export function calcRiserless(inp: RiserlessCementInput): CementingResult {
  const xs = 1 + (inp.excess_pct || 0) / 100;
  const mudline = inp.air_gap + inp.water_depth;
  const fc = inp.shoe - inp.shoe_track_len;

  const st_vol = inp.shoe_track_len * inp.cap_csg;
  const rat_vol = Math.max(0, inp.td - inp.shoe) * inp.cap_oh * xs;
  const v_below = st_vol + rat_vol;

  const hasPrev = (inp.prev_shoe || 0) > 0;
  const top_ann = hasPrev ? (inp.prev_shoe as number) : mudline;
  const oh_full = Math.max(0, inp.shoe - top_ann) * inp.cap_ann_oh * xs;
  const c_full = hasPrev && inp.cap_ann_c
    ? Math.max(0, (inp.prev_shoe as number) - mudline) * inp.cap_ann_c
    : 0;
  const ann_total = oh_full + c_full;

  // depth_top(V)
  const depthTop = (v: number): number => {
    if (v <= 0) return inp.shoe || 0;
    const annOhCap = (inp.cap_ann_oh || 0) * xs;
    if (oh_full > 0 && annOhCap > 0 && v <= oh_full) {
      return Math.max(mudline, (inp.shoe || 0) - v / annOhCap);
    }
    const annCCap = inp.cap_ann_c || 0;
    if (hasPrev && annCCap > 0 && c_full > 0) {
      const res = (inp.prev_shoe as number) - (v - oh_full) / annCCap;
      return Math.max(mudline, res);
    }
    if (annOhCap > 0) {
      return Math.max(mudline, (inp.shoe || 0) - v / annOhCap);
    }
    return mudline;
  };

  const v_tail = inp.tail_vol - v_below;
  const v_cem = v_tail + inp.lead_vol;
  const v_sp = v_cem + inp.sp_vol;
  const v_f2 = v_sp + inp.f2_vol;
  const v_f1 = v_f2 + inp.f1_vol;

  const tail_top = depthTop(v_tail);
  const toc = depthTop(v_cem);
  const sp_top = depthTop(v_sp);
  const f2_top = depthTop(v_f2);
  const f1_top = depthTop(v_f1);

  const rise_tail = inp.shoe - tail_top;
  const rise_lead = tail_top - toc;
  const rise_tot = inp.shoe - toc;
  const rise_sp = toc - sp_top;
  const rise_f2 = sp_top - f2_top;
  const rise_f1 = f2_top - f1_top;
  const total_slurry = inp.lead_vol + inp.tail_vol;

  const toc_below_mudline = Math.max(0, toc - mudline);
  const cement_returns_seabed = Math.max(0, v_cem - ann_total);
  const all_fluids_returned = Math.max(0, v_f1 - ann_total);

  // Displacement (inner string only)
  const disp_tot = fc * inp.cap_dp;
  const strokes = inp.pump_output > 0 ? disp_tot / inp.pump_output : 0;

  const pumping_sequence: PumpingStep[] = [
    { step: 1, name: '1st Pumping Mud', volume: inp.f1_vol, density: inp.f1_mw },
    { step: 2, name: '2nd Pumping Mud', volume: inp.f2_vol, density: inp.f2_mw },
    { step: 3, name: 'Spacer', volume: inp.sp_vol, density: inp.sp_mw },
    { step: 4, name: 'Lead Slurry', volume: inp.lead_vol, density: inp.lead_mw },
    { step: 5, name: 'Tail Slurry', volume: inp.tail_vol, density: inp.tail_mw },
    { step: 6, name: 'Displacement (Inner String)', volume: disp_tot, density: inp.disp_mw }
  ].filter(s => s.volume > 0 || s.step === 6);

  const total_pumped = inp.f1_vol + inp.f2_vol + inp.sp_vol + inp.lead_vol + inp.tail_vol + disp_tot;

  // Pressures (Static, End of Job)
  const layers = [
    { rho: inp.seawater_mw, top: 0, bot: mudline },
    { rho: inp.hole_fluid_mw, top: mudline, bot: f1_top },
    { rho: inp.f1_mw, top: f1_top, bot: f2_top },
    { rho: inp.f2_mw, top: f2_top, bot: sp_top },
    { rho: inp.sp_mw, top: sp_top, bot: toc },
    { rho: inp.lead_mw, top: toc, bot: tail_top },
    { rho: inp.tail_mw, top: tail_top, bot: inp.shoe }
  ];

  const pAnn = (depth: number): number => {
    let sum = 0;
    for (const l of layers) {
      const h = Math.max(0, Math.min(l.bot, depth) - Math.min(l.top, depth));
      sum += CONSTANTS.PSI_GRADIENT * l.rho * h;
    }
    return sum;
  };

  const p_ann_fc = pAnn(fc);
  const p_in_fc = CONSTANTS.PSI_GRADIENT * inp.disp_mw * fc;
  const diff_press = p_ann_fc - p_in_fc;
  const diff_meaning = diff_press > 0
    ? 'Annulus heavier – floats must hold (U-tube risk)'
    : 'String heavier – no back-flow';

  const p_ann_shoe = pAnn(inp.shoe);
  const p_prev_shoe = hasPrev ? pAnn(inp.prev_shoe as number) : undefined;

  const emw_fc = fc > 0 ? p_ann_fc / (CONSTANTS.PSI_GRADIENT * fc) : 0;
  const emw_shoe = inp.shoe > 0 ? p_ann_shoe / (CONSTANTS.PSI_GRADIENT * inp.shoe) : 0;
  const emw_prev_shoe = (hasPrev && p_prev_shoe !== undefined)
    ? p_prev_shoe / (CONSTANTS.PSI_GRADIENT * (inp.prev_shoe as number))
    : undefined;
  const lot_margin = (inp.lot && inp.lot > 0 && emw_prev_shoe !== undefined)
    ? inp.lot - emw_prev_shoe
    : undefined;

  const p_col = p_ann_shoe - (p_in_fc + CONSTANTS.PSI_GRADIENT * bottom_rho * (((inp.shoe || 0) as number) - fc));
  const collapse_sf = (p_col > 0 && (inp.collapse_rating || 0) > 0)
    ? inp.collapse_rating / p_col
    : ((inp.collapse_rating || 0) > 0 ? 999 : 0);

  const burst_limit = 0.8 * (inp.burst_rating || 0);

  // Job Checks
  const checks: JobCheck[] = [];

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
  } else if ((inp.tail_vol || 0) === 0) {
    checks.push({
      label: 'Tail Slurry Placement',
      status: 'OK',
      message: 'OK – No tail slurry (single-slurry job)'
    });
  } else if (v_tail <= 0) {
    checks.push({
      label: 'Tail Slurry Placement',
      status: 'CHECK',
      message: `CHECK – Tail slurry does not clear shoe into annulus`
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
        message: `OK – LOT margin at 30" shoe is +${lot_margin.toFixed(2)} ppg (EMW ${emw_prev_shoe?.toFixed(2)} vs LOT ${inp.lot})`
      });
    } else {
      checks.push({
        label: 'Formation Margin',
        status: 'CHECK',
        message: `CHECK – EMW at 30" shoe (${emw_prev_shoe?.toFixed(2)} ppg) exceeds LOT (${inp.lot} ppg) by ${Math.abs(lot_margin).toFixed(2)} ppg! Loss risk.`
      });
    }
  }

  // 4. Collapse Safety Factor
  if ((inp.collapse_rating || 0) <= 0 || p_col <= 0) {
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
  } else if ((inp.max_pump_pressure || 0) <= burst_limit) {
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

/**
 * Capacity Calculation Helpers
 */
export function calcCasingCap(id_inch: number): number {
  return (id_inch * id_inch) / CONSTANTS.CAP_FACTOR;
}

export function calcCasingDisp(od_inch: number, id_inch: number): number {
  return ((od_inch * od_inch) - (id_inch * id_inch)) / CONSTANTS.CAP_FACTOR;
}

export function calcPipeClosedDisp(od_inch: number): number {
  return (od_inch * od_inch) / CONSTANTS.CAP_FACTOR;
}

export function calcOpenHoleCap(hole_inch: number): number {
  return (hole_inch * hole_inch) / CONSTANTS.CAP_FACTOR;
}

export function calcRiserCap(riser_id_inch: number): number {
  return (riser_id_inch * riser_id_inch) / CONSTANTS.CAP_FACTOR;
}

export function calcCasedAnnulusCap(prevCsgCap: number, csgCap: number, csgDisp: number): number {
  return prevCsgCap - (csgCap + csgDisp);
}

export function calcOpenHoleAnnulusCap(ohCap: number, csgCap: number, csgDisp: number): number {
  return ohCap - (csgCap + csgDisp);
}

export function calcRiserAnnulusCap(riserCap: number, stringClosedDisp: number): number {
  return riserCap - stringClosedDisp;
}

export function ftToMeters(ft: number): number {
  return Number(ft) * 0.3048;
}

export function metersToFt(m: number): number {
  return Number(m) / 0.3048;
}

export function bblFtToBblM(bblFt: number): number {
  return Number(bblFt) / 0.3048;
}

export function bblMToBblFt(bblM: number): number {
  return Number(bblM) * 0.3048;
}
