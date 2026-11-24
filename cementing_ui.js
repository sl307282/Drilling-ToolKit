/**
 * Casing Cementing Module Controller & UI
 * Drilling Toolkit Web Runtime
 */
(function (root) {
  'use strict';

  // Canonical depth/length unit is metres (1 ft = 0.3048 m)
  const M_PER_FT = 0.3048;
  const DEPTH_KEYS = ['air_gap', 'water_depth', 'hanger', 'prev_shoe', 'td', 'shoe', 'shoe_track_len'];
  const VOL_KEYS = ['f1_vol', 'f2_vol', 'sp_vol', 'lead_vol', 'tail_vol'];
  const MW_KEYS = ['mw', 'seawater_mw', 'hole_fluid_mw', 'disp_mw', 'f1_mw', 'f2_mw', 'sp_mw', 'lead_mw', 'tail_mw', 'lot'];
  const PRESS_KEYS = ['collapse_rating', 'burst_rating', 'bump', 'max_pump_pressure'];

  // API Tubular Data (ported from Capacity Data sheet with complete standard weights)
  const CAPACITY_DATA = [
    // 36" Casing
    { id: "csg_36_552", type: "casing", label: '36" 552#', od_in: 36.0, id_in: 33.0, weight_ppf: 552.0, cap_bbl_ft: 1.05790, disp_bbl_ft: 0.20109 },

    // 30" Casing
    { id: "csg_30_310", type: "casing", label: '30" 310#', od_in: 30.0, id_in: 28.0, weight_ppf: 310.0, cap_bbl_ft: 0.76160, disp_bbl_ft: 0.11270 },
    { id: "csg_30_457", type: "casing", label: '30" 457#', od_in: 30.0, id_in: 27.0, weight_ppf: 457.0, cap_bbl_ft: 0.70818, disp_bbl_ft: 0.16612 },

    // 20" Casing
    { id: "csg_20_94", type: "casing", label: '20" 94#', od_in: 20.0, id_in: 19.124, weight_ppf: 94.0, cap_bbl_ft: 0.35528, disp_bbl_ft: 0.03329 },
    { id: "csg_20_106.5", type: "casing", label: '20" 106.5#', od_in: 20.0, id_in: 19.0, weight_ppf: 106.5, cap_bbl_ft: 0.35069, disp_bbl_ft: 0.03789 },
    { id: "csg_20_133", type: "casing", label: '20" 133#', od_in: 20.0, id_in: 18.73, weight_ppf: 133.0, cap_bbl_ft: 0.34080, disp_bbl_ft: 0.04830 },
    { id: "csg_20_169", type: "casing", label: '20" 169#', od_in: 20.0, id_in: 18.376, weight_ppf: 169.0, cap_bbl_ft: 0.32803, disp_bbl_ft: 0.06054 },

    // 18 5/8" Casing
    { id: "csg_18.625_87.5", type: "casing", label: '18 5/8" 87.5#', od_in: 18.625, id_in: 17.755, weight_ppf: 87.5, cap_bbl_ft: 0.30624, disp_bbl_ft: 0.03075 },
    { id: "csg_18.625_94.5", type: "casing", label: '18 5/8" 94.5#', od_in: 18.625, id_in: 17.689, weight_ppf: 94.5, cap_bbl_ft: 0.30397, disp_bbl_ft: 0.03303 },
    { id: "csg_18.625_106", type: "casing", label: '18 5/8" 106#', od_in: 18.625, id_in: 17.563, weight_ppf: 106.0, cap_bbl_ft: 0.29965, disp_bbl_ft: 0.03734 },
    { id: "csg_18.625_117.5", type: "casing", label: '18 5/8" 117.5#', od_in: 18.625, id_in: 17.439, weight_ppf: 117.5, cap_bbl_ft: 0.29544, disp_bbl_ft: 0.04156 },

    // 13 5/8" Casing
    { id: "csg_13.625_88.2", type: "casing", label: '13 5/8" 88.2#', od_in: 13.625, id_in: 12.355, weight_ppf: 88.2, cap_bbl_ft: 0.14829, disp_bbl_ft: 0.03205 },

    // 13 3/8" Casing
    { id: "csg_13.375_48", type: "casing", label: '13 3/8" 48#', od_in: 13.375, id_in: 12.715, weight_ppf: 48.0, cap_bbl_ft: 0.15705, disp_bbl_ft: 0.01673 },
    { id: "csg_13.375_54.5", type: "casing", label: '13 3/8" 54.5#', od_in: 13.375, id_in: 12.615, weight_ppf: 54.5, cap_bbl_ft: 0.15459, disp_bbl_ft: 0.01919 },
    { id: "csg_13.375_61", type: "casing", label: '13 3/8" 61#', od_in: 13.375, id_in: 12.515, weight_ppf: 61.0, cap_bbl_ft: 0.15215, disp_bbl_ft: 0.02163 },
    { id: "csg_13.375_68", type: "casing", label: '13 3/8" 68#', od_in: 13.375, id_in: 12.415, weight_ppf: 68.0, cap_bbl_ft: 0.14970, disp_bbl_ft: 0.02430 },
    { id: "csg_13.375_72", type: "casing", label: '13 3/8" 72#', od_in: 13.375, id_in: 12.347, weight_ppf: 72.0, cap_bbl_ft: 0.14810, disp_bbl_ft: 0.02570 },
    { id: "csg_13.375_77", type: "casing", label: '13 3/8" 77#', od_in: 13.375, id_in: 12.275, weight_ppf: 77.0, cap_bbl_ft: 0.14637, disp_bbl_ft: 0.02741 },
    { id: "csg_13.375_86", type: "casing", label: '13 3/8" 86#', od_in: 13.375, id_in: 12.125, weight_ppf: 86.0, cap_bbl_ft: 0.14282, disp_bbl_ft: 0.03096 },

    // 10 3/4" Casing
    { id: "csg_10.75_40.5", type: "casing", label: '10 3/4" 40.5#', od_in: 10.75, id_in: 10.050, weight_ppf: 40.5, cap_bbl_ft: 0.09812, disp_bbl_ft: 0.01415 },
    { id: "csg_10.75_45.5", type: "casing", label: '10 3/4" 45.5#', od_in: 10.75, id_in: 9.950, weight_ppf: 45.5, cap_bbl_ft: 0.09618, disp_bbl_ft: 0.01609 },
    { id: "csg_10.75_51", type: "casing", label: '10 3/4" 51#', od_in: 10.75, id_in: 9.850, weight_ppf: 51.0, cap_bbl_ft: 0.09425, disp_bbl_ft: 0.01801 },
    { id: "csg_10.75_55.5", type: "casing", label: '10 3/4" 55.5#', od_in: 10.75, id_in: 9.760, weight_ppf: 55.5, cap_bbl_ft: 0.09254, disp_bbl_ft: 0.01972 },
    { id: "csg_10.75_60.7", type: "casing", label: '10 3/4" 60.7#', od_in: 10.75, id_in: 9.660, weight_ppf: 60.7, cap_bbl_ft: 0.09065, disp_bbl_ft: 0.02161 },
    { id: "csg_10.75_65.7", type: "casing", label: '10 3/4" 65.7#', od_in: 10.75, id_in: 9.560, weight_ppf: 65.7, cap_bbl_ft: 0.08878, disp_bbl_ft: 0.02348 },

    // 9 5/8" Casing
    { id: "csg_9.625_36", type: "casing", label: '9 5/8" 36#', od_in: 9.625, id_in: 8.921, weight_ppf: 36.0, cap_bbl_ft: 0.07731, disp_bbl_ft: 0.01268 },
    { id: "csg_9.625_40", type: "casing", label: '9 5/8" 40#', od_in: 9.625, id_in: 8.835, weight_ppf: 40.0, cap_bbl_ft: 0.07583, disp_bbl_ft: 0.01416 },
    { id: "csg_9.625_43.5", type: "casing", label: '9 5/8" 43.5#', od_in: 9.625, id_in: 8.755, weight_ppf: 43.5, cap_bbl_ft: 0.07446, disp_bbl_ft: 0.01553 },
    { id: "csg_9.625_47", type: "casing", label: '9 5/8" 47#', od_in: 9.625, id_in: 8.681, weight_ppf: 47.0, cap_bbl_ft: 0.07320, disp_bbl_ft: 0.01690 },
    { id: "csg_9.625_53.5", type: "casing", label: '9 5/8" 53.5#', od_in: 9.625, id_in: 8.535, weight_ppf: 53.5, cap_bbl_ft: 0.07077, disp_bbl_ft: 0.01923 },
    { id: "csg_9.625_58.4", type: "casing", label: '9 5/8" 58.4#', od_in: 9.625, id_in: 8.435, weight_ppf: 58.4, cap_bbl_ft: 0.06912, disp_bbl_ft: 0.02088 },

    // 7" Casing
    { id: "csg_7_23", type: "casing", label: '7" 23#', od_in: 7.0, id_in: 6.366, weight_ppf: 23.0, cap_bbl_ft: 0.03937, disp_bbl_ft: 0.00823 },
    { id: "csg_7_26", type: "casing", label: '7" 26#', od_in: 7.0, id_in: 6.276, weight_ppf: 26.0, cap_bbl_ft: 0.03826, disp_bbl_ft: 0.00934 },
    { id: "csg_7_29", type: "casing", label: '7" 29#', od_in: 7.0, id_in: 6.184, weight_ppf: 29.0, cap_bbl_ft: 0.03715, disp_bbl_ft: 0.01045 },
    { id: "csg_7_32", type: "casing", label: '7" 32#', od_in: 7.0, id_in: 6.094, weight_ppf: 32.0, cap_bbl_ft: 0.03608, disp_bbl_ft: 0.01152 },
    { id: "csg_7_35", type: "casing", label: '7" 35#', od_in: 7.0, id_in: 6.004, weight_ppf: 35.0, cap_bbl_ft: 0.03502, disp_bbl_ft: 0.01258 },
    { id: "csg_7_38", type: "casing", label: '7" 38#', od_in: 7.0, id_in: 5.920, weight_ppf: 38.0, cap_bbl_ft: 0.03405, disp_bbl_ft: 0.01355 },

    // Drill Pipes
    { id: "dp_5_19.5", type: "drillpipe", label: '5" 19.5#', od_in: 5.0, id_in: 4.276, weight_ppf: 19.5, cap_bbl_ft: 0.01776, disp_bbl_ft: 0.00653 },
    { id: "dp_5_25.6", type: "drillpipe", label: '5" 25.6#', od_in: 5.0, id_in: 4.000, weight_ppf: 25.6, cap_bbl_ft: 0.01554, disp_bbl_ft: 0.00874 },
    { id: "dp_5.5_21.9", type: "drillpipe", label: '5 1/2" 21.9#', od_in: 5.5, id_in: 4.778, weight_ppf: 21.9, cap_bbl_ft: 0.02218, disp_bbl_ft: 0.00721 },
    { id: "dp_5.875_23.4", type: "drillpipe", label: '5 7/8" 23.4#', od_in: 5.875, id_in: 5.045, weight_ppf: 23.4, cap_bbl_ft: 0.02400, disp_bbl_ft: 0.01030 },
    { id: "dp_6.625_27.7", type: "drillpipe", label: '6 5/8" 27.7#', od_in: 6.625, id_in: 5.303, weight_ppf: 27.7, cap_bbl_ft: 0.027316, disp_bbl_ft: 0.016674 },

    // Open Holes
    { id: "oh_36", type: "openhole", label: '36" Open Hole', od_in: 36.0, id_in: 36.0, weight_ppf: 0, cap_bbl_ft: 1.25890, disp_bbl_ft: 0.0 },
    { id: "oh_26", type: "openhole", label: '26" Open Hole', od_in: 26.0, id_in: 26.0, weight_ppf: 0, cap_bbl_ft: 0.65670, disp_bbl_ft: 0.0 },
    { id: "oh_17.5", type: "openhole", label: '17 1/2" Open Hole', od_in: 17.5, id_in: 17.5, weight_ppf: 0, cap_bbl_ft: 0.29750, disp_bbl_ft: 0.0 },
    { id: "oh_12.25", type: "openhole", label: '12 1/4" Open Hole', od_in: 12.25, id_in: 12.25, weight_ppf: 0, cap_bbl_ft: 0.14580, disp_bbl_ft: 0.0 },
    { id: "oh_8.5", type: "openhole", label: '8 1/2" Open Hole', od_in: 8.5, id_in: 8.5, weight_ppf: 0, cap_bbl_ft: 0.07019, disp_bbl_ft: 0.0 },

    // Riser
    { id: "riser_19.5", type: "riser", label: 'Riser 19.5" ID', od_in: 21.0, id_in: 19.5, weight_ppf: 0, cap_bbl_ft: 0.36939, disp_bbl_ft: 0.0 }
  ];
  root.CAPACITY_DATA = CAPACITY_DATA;

  // Generic helpers for tubular and hole dropdown filtering
  function normalizeOd(od) {
    if (typeof od === 'number') return od;
    if (!od) return 0;
    const s = String(od).trim().replace(/"/g, '').replace(/-/g, ' ').replace(',', '.');
    if (s.includes(' ')) {
      const parts = s.split(/\s+/);
      const whole = parseFloat(parts[0]) || 0;
      if (parts[1] && parts[1].includes('/')) {
        const frac = parts[1].split('/');
        return whole + (parseFloat(frac[0]) / parseFloat(frac[1]));
      }
      return whole;
    }
    if (s.includes('/')) {
      const frac = s.split('/');
      return parseFloat(frac[0]) / parseFloat(frac[1]);
    }
    return parseFloat(s) || 0;
  }

  function getCasingOptions(od) {
    const targetOd = normalizeOd(od);
    const casings = CAPACITY_DATA.filter(t => t.type === 'casing');
    const filtered = casings.filter(t => Math.abs(t.od_in - targetOd) < 0.05);
    return filtered.sort((a, b) => (a.weight_ppf || 0) - (b.weight_ppf || 0));
  }

  function getHoleOptions(sectionOrOd) {
    const openholes = CAPACITY_DATA.filter(t => t.type === 'openhole');
    if (!sectionOrOd || sectionOrOd === 'custom') {
      return openholes.slice().sort((a, b) => b.od_in - a.od_in);
    }
    const sec = String(sectionOrOd);
    const targetOd = sec === '30' ? 36.0
      : (sec === '20' ? 26.0
      : (sec === '13.375' ? 17.5
      : (sec === '9.625' ? 12.25 : normalizeOd(sectionOrOd))));
    const filtered = openholes.filter(t => Math.abs(t.od_in - targetOd) < 0.05);
    return filtered.length ? filtered : openholes;
  }

  function getDrillPipeOptions() {
    return CAPACITY_DATA
      .filter(t => t.type === 'drillpipe')
      .slice()
      .sort((a, b) => (a.od_in - b.od_in) || (a.weight_ppf - b.weight_ppf));
  }

  const CASING_OD_LIST = [
    { od: 36.0, label: '36"' },
    { od: 30.0, label: '30"' },
    { od: 20.0, label: '20"' },
    { od: 18.625, label: '18 5/8"' },
    { od: 13.625, label: '13 5/8"' },
    { od: 13.375, label: '13 3/8"' },
    { od: 10.75, label: '10 3/4"' },
    { od: 9.625, label: '9 5/8"' },
    { od: 7.0, label: '7"' }
  ];

  root.normalizeOd = normalizeOd;
  root.getCasingOptions = getCasingOptions;
  root.getHoleOptions = getHoleOptions;
  root.getDrillPipeOptions = getDrillPipeOptions;
  root.CASING_OD_LIST = CASING_OD_LIST;

  // Helper to compute Section 2 capacities from selected tubulars & overrides
  function computeJobCapacities(inp, overrides) {
    overrides = overrides || {};
    const tubulars = inp.tubulars || {};

    const csg = CAPACITY_DATA.find(t => t.id === tubulars.csg_id) || null;
    const dp = CAPACITY_DATA.find(t => t.id === tubulars.dp_id) || null;
    const prevCsg = CAPACITY_DATA.find(t => t.id === tubulars.prev_csg_id) || null;
    const hole = CAPACITY_DATA.find(t => t.id === tubulars.hole_id) || null;

    // Formulas (Section 2 of spreadsheet):
    // Casing cap = cap(csg)
    const table_cap_csg = csg ? csg.cap_bbl_ft : (Number(inp.cap_csg) || 0);
    const csg_disp = csg ? csg.disp_bbl_ft : (Number(inp.csg_disp) || 0);

    // DP cap = cap(dp)
    const table_cap_dp = dp ? dp.cap_bbl_ft : (Number(inp.cap_dp) || 0);
    const dp_disp = dp ? dp.disp_bbl_ft : 0;
    const dp_closed_disp = table_cap_dp + dp_disp;

    // Prev casing
    const table_cap_prev_csg = prevCsg ? prevCsg.cap_bbl_ft : (Number(inp.cap_prev_csg) || 0);

    // Rathole OH = cap(hole)
    const table_cap_oh = hole ? hole.cap_bbl_ft : (Number(inp.cap_oh) || 0);

    // Annulus = cap(outer) - (cap(inner) + disp(inner))
    const csg_closed_disp = table_cap_csg + csg_disp;
    const table_cap_ann_oh = Math.max(0, table_cap_oh - csg_closed_disp);
    const table_cap_ann_c = prevCsg ? Math.max(0, table_cap_prev_csg - csg_closed_disp) : 0;

    // Riser Annulus = cap(riser) - (cap(dp) + disp(dp))
    let riserCap = 0;
    if (tubulars.riser_id === 'custom') {
      const customId = Number(tubulars.riser_custom_id) || 19.5;
      riserCap = Math.pow(customId, 2) / 1029.4;
    } else {
      const riser = CAPACITY_DATA.find(t => t.id === tubulars.riser_id) || null;
      riserCap = riser ? riser.cap_bbl_ft : (Number(inp.cap_riser) || 0);
    }
    const table_cap_riser = Math.max(0, riserCap - dp_closed_disp);

    const tableVals = {
      cap_csg: table_cap_csg,
      cap_dp: table_cap_dp,
      cap_prev_csg: table_cap_prev_csg,
      cap_oh: table_cap_oh,
      cap_ann_oh: table_cap_ann_oh,
      cap_ann_c: table_cap_ann_c,
      cap_riser: table_cap_riser
    };

    const jobId = inp.id || (typeof cementingState !== 'undefined' ? cementingState.section : null) || '30';
    const savedRef = typeof getSavedCapacityRef === 'function' ? getSavedCapacityRef(jobId) : null;
    const refCanonical = (savedRef && savedRef.canonical) ? savedRef.canonical : null;

    const effective = {
      cap_csg: overrides.cap_csg !== undefined ? Number(overrides.cap_csg) : (refCanonical?.cap_csg !== undefined ? refCanonical.cap_csg : table_cap_csg),
      csg_disp: refCanonical?.csg_disp !== undefined ? refCanonical.csg_disp : csg_disp,
      cap_dp: overrides.cap_dp !== undefined ? Number(overrides.cap_dp) : (refCanonical?.cap_dp !== undefined ? refCanonical.cap_dp : table_cap_dp),
      dp_cl_disp: refCanonical?.dp_cl_disp !== undefined ? refCanonical.dp_cl_disp : dp_closed_disp,
      cap_prev_csg: table_cap_prev_csg,
      cap_oh: overrides.cap_oh !== undefined ? Number(overrides.cap_oh) : (refCanonical?.cap_oh !== undefined ? refCanonical.cap_oh : table_cap_oh),
      cap_ann_oh: overrides.cap_ann_oh !== undefined ? Number(overrides.cap_ann_oh) : (refCanonical?.cap_ann_oh !== undefined ? refCanonical.cap_ann_oh : table_cap_ann_oh),
      cap_ann_c: overrides.cap_ann_c !== undefined ? Number(overrides.cap_ann_c) : (refCanonical?.cap_ann_c !== undefined ? refCanonical.cap_ann_c : table_cap_ann_c),
      cap_riser: overrides.cap_riser !== undefined ? Number(overrides.cap_riser) : (refCanonical?.cap_riser !== undefined ? refCanonical.cap_riser : table_cap_riser)
    };

    const labels = {
      csg_label: csg ? `${csg.label} Casing` : (inp.csg_label || 'Casing'),
      prev_csg_label: prevCsg ? `${prevCsg.label} Casing` : (inp.prev_csg_label || 'Previous Casing'),
      oh_label: hole ? hole.label : (inp.oh_label || 'Open Hole'),
      dp_label: dp ? `${dp.label} Drill Pipe` : (inp.dp_label || 'Drill Pipe'),
      riser_label: tubulars.riser_id === 'custom' ? `Custom ${tubulars.riser_custom_id || 19.5}" Riser` : '19.5" Marine Riser'
    };

    return { tableVals, effective, labels, csg, dp, prevCsg, hole, savedRef, dp_closed_disp, csg_closed_disp };
  }
  root.computeJobCapacities = computeJobCapacities;

  // Section default presets (stored in canonical metres, all form inputs start at 0)
  const SECTION_PRESETS = {
    '30': {
      section: '30',
      label: '30" Conductor',
      model: 'riserless',
      name: '',
      air_gap: 25,
      water_depth: 400,
      prev_shoe: 0,
      td: 495,
      shoe: 490,
      shoe_track_len: 12,
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
      lot: 0,
      bump: 0,
      hanger: 0,
      mw: 8.6,
      // Capacities (canonical bbl/ft)
      cap_csg: 0.76160,
      csg_disp: 0.11270,
      cap_prev_csg: 0,
      cap_oh: 1.25890,
      cap_ann_oh: 0.38460,
      cap_ann_c: 0,
      cap_dp: 0.02400,
      dp_cl_disp: 0.03430,
      cap_riser: 0,
      // Labels for UI
      csg_label: '30" 310# Casing',
      oh_label: '36" Open Hole',
      dp_label: '5-7/8" Drill Pipe',
      tubulars: {
        csg_id: 'csg_30_310',
        dp_id: 'dp_5.875_23.4',
        hole_id: 'oh_36',
        prev_csg_id: null,
        riser_id: null,
        riser_custom_id: null
      }
    },
    '20': {
      section: '20',
      label: '20" Surface Casing',
      model: 'riserless',
      name: '',
      air_gap: 25,
      water_depth: 400,
      prev_shoe: 490,
      td: 955,
      shoe: 950,
      shoe_track_len: 24,
      seawater_mw: 8.6,
      hole_fluid_mw: 9.0,
      disp_mw: 9.0,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 50,
      sp_mw: 10.0,
      lead_vol: 500,
      lead_mw: 12.0,
      tail_vol: 200,
      tail_mw: 15.8,
      excess_pct: 50,
      pump_output: 0.102,
      lot: 12.5,
      collapse_rating: 1490,
      burst_rating: 3060,
      max_pump_pressure: 500,
      bump: 0,
      hanger: 425,
      mw: 9.0,
      // Capacities (canonical bbl/ft)
      cap_csg: 0.34080,
      csg_disp: 0.04830,
      cap_prev_csg: 0.76160,
      cap_oh: 0.65670,
      cap_ann_oh: 0.26760,
      cap_ann_c: 0.37250,
      cap_dp: 0.02400,
      dp_cl_disp: 0.03430,
      cap_riser: 0,
      // Labels
      csg_label: '20" 133# Casing',
      prev_csg_label: '30" 310# Casing',
      oh_label: '26" Open Hole',
      dp_label: '5-7/8" Drill Pipe',
      tubulars: {
        csg_id: 'csg_20_133',
        dp_id: 'dp_5.875_23.4',
        prev_csg_id: 'csg_30_310',
        hole_id: 'oh_26',
        riser_id: null,
        riser_custom_id: null
      }
    },
    '13.375': {
      section: '13.375',
      label: '13-3/8" Casing',
      model: 'subsea',
      name: '',
      air_gap: 25,
      water_depth: 915,
      hanger: 935,
      prev_shoe: 1495,
      td: 2445,
      shoe: 2440,
      shoe_track_len: 24,
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
      max_pump_pressure: 500,
      seawater_mw: 8.6,
      hole_fluid_mw: 10.2,
      disp_mw: 10.2,
      // Capacities (canonical bbl/ft)
      cap_csg: 0.14970,
      csg_disp: 0.02430,
      cap_prev_csg: 0.34080,
      cap_ann_c: 0.16680,
      cap_oh: 0.29750,
      cap_ann_oh: 0.12350,
      cap_dp: 0.027316,
      dp_cl_disp: 0.04399,
      cap_riser: 0.32540,
      // Labels
      csg_label: '13-3/8" 68# Casing',
      prev_csg_label: '20" 133# Casing',
      oh_label: '17-1/2" Open Hole',
      riser_label: '19.5" Marine Riser',
      dp_label: '6-5/8" Drill Pipe',
      tubulars: {
        csg_id: 'csg_13.375_68',
        dp_id: 'dp_6.625_27.7',
        prev_csg_id: 'csg_20_133',
        hole_id: 'oh_17.5',
        riser_id: 'riser_19.5',
        riser_custom_id: null
      }
    },
    '9.625': {
      section: '9.625',
      label: '9-5/8" Casing',
      model: 'subsea',
      name: '',
      air_gap: 25,
      water_depth: 915,
      hanger: 935,
      prev_shoe: 2440,
      td: 3815,
      shoe: 3810,
      shoe_track_len: 24,
      mw: 11.5,
      f1_vol: 200,
      f1_mw: 11.5,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 80,
      sp_mw: 12.0,
      lead_vol: 350,
      lead_mw: 13.0,
      tail_vol: 120,
      tail_mw: 15.8,
      excess_pct: 25,
      pump_output: 0.102,
      lot: 15.0,
      collapse_rating: 4760,
      burst_rating: 6870,
      bump: 1000,
      max_pump_pressure: 500,
      seawater_mw: 8.6,
      hole_fluid_mw: 11.5,
      disp_mw: 11.5,
      // Capacities (canonical bbl/ft)
      cap_csg: 0.07320,
      csg_disp: 0.01690,
      cap_prev_csg: 0.14810,
      cap_ann_c: 0.05800,
      cap_oh: 0.14580,
      cap_ann_oh: 0.05570,
      cap_dp: 0.027316,
      dp_cl_disp: 0.04399,
      cap_riser: 0.32540,
      // Labels
      csg_label: '9-5/8" 47# Casing',
      prev_csg_label: '13-3/8" 72# Casing',
      oh_label: '12-1/4" Open Hole',
      riser_label: '19.5" Marine Riser',
      dp_label: '6-5/8" Drill Pipe',
      tubulars: {
        csg_id: 'csg_9.625_47',
        dp_id: 'dp_6.625_27.7',
        prev_csg_id: 'csg_13.375_72',
        hole_id: 'oh_12.25',
        riser_id: 'riser_19.5',
        riser_custom_id: null
      }
    },
    'custom': {
      section: 'custom',
      label: 'Custom Section',
      model: 'subsea',
      name: '',
      air_gap: 25,
      water_depth: 915,
      hanger: 935,
      prev_shoe: 1495,
      td: 2445,
      shoe: 2440,
      shoe_track_len: 24,
      mw: 10.2,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 50,
      sp_mw: 11.0,
      lead_vol: 400,
      lead_mw: 12.5,
      tail_vol: 150,
      tail_mw: 15.8,
      excess_pct: 30,
      pump_output: 0.102,
      lot: 13.5,
      collapse_rating: 2500,
      burst_rating: 5000,
      bump: 1000,
      max_pump_pressure: 500,
      seawater_mw: 8.6,
      hole_fluid_mw: 10.2,
      disp_mw: 10.2,
      // Capacities (canonical bbl/ft)
      cap_csg: 0.14970,
      csg_disp: 0.02430,
      cap_prev_csg: 0.34080,
      cap_ann_c: 0.16680,
      cap_oh: 0.29750,
      cap_ann_oh: 0.12350,
      cap_dp: 0.027316,
      dp_cl_disp: 0.04399,
      cap_riser: 0.32540,
      // Labels
      csg_label: 'Custom Casing',
      prev_csg_label: 'Previous Casing',
      oh_label: 'Open Hole',
      riser_label: 'Marine Riser',
      dp_label: '6-5/8" Drill Pipe',
      tubulars: {
        csg_id: 'csg_13.375_68',
        dp_id: 'dp_6.625_27.7',
        prev_csg_id: 'csg_20_133',
        hole_id: 'oh_17.5',
        riser_id: 'riser_19.5',
        riser_custom_id: null
      }
    }
  };

  // Escape HTML attribute helper
  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const UNIT_STORAGE_KEY = 'drilling_toolkit_cementing_unit';

  function getStoredUnit() {
    try {
      const sys = (typeof window !== 'undefined' && window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
        ? window.UnitsEngine.getUnitSystem()
        : 'mixed';
      if (sys === 'api') return 'ft';
      if (sys === 'si') return 'm';

      const val = localStorage.getItem(UNIT_STORAGE_KEY);
      if (val === 'm' || val === 'ft') return val;
    } catch (e) {
      console.warn('Could not read stored cementing unit:', e);
    }
    return 'm'; // Fresh install default is metres ('m')
  }

  function persistStoredUnit(unit) {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch (e) {
      console.warn('Could not persist cementing unit to localStorage:', e);
    }
    try {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: UNIT_STORAGE_KEY, value: unit }).catch(function () {});
      }
    } catch (e) {}
  }

  // Saved jobs storage helper
  function getSavedJobs() {
    try {
      const data = localStorage.getItem('drilling_toolkit_cementing_jobs');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function persistSavedJobs(list) {
    try {
      localStorage.setItem('drilling_toolkit_cementing_jobs', JSON.stringify(list));
    } catch (e) {
      console.warn('Could not persist cementing jobs:', e);
    }
  }

  const WELLDATA_DRAFT_PREFIX = 'drilling_toolkit_cementing_draft_';

  function saveWellDataDraft() {
    try {
      const sec = cementingState.section || '30';
      const draft = {
        section: sec,
        unit: cementingState.unit,
        jobName: (cementingState.inputs && cementingState.inputs.name) || cementingState.jobName || '',
        inputs: cementingState.inputs,
        timestamp: Date.now()
      };
      const json = JSON.stringify(draft);
      localStorage.setItem(WELLDATA_DRAFT_PREFIX + sec, json);
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: WELLDATA_DRAFT_PREFIX + sec, value: json }).catch(function () {});
      }
    } catch (e) {
      console.warn('Could not save well data draft:', e);
    }
  }

  function getWellDataDraft(sec) {
    try {
      const targetSec = sec || (cementingState && cementingState.section) || '30';
      const raw = localStorage.getItem(WELLDATA_DRAFT_PREFIX + targetSec);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }


  const CAPACITY_REF_PREFIX = 'capacityRef_';

  function getJobId() {
    return (cementingState.inputs && cementingState.inputs.id) || cementingState.section || '30';
  }

  function getSavedCapacityRef(jobId) {
    try {
      const id = jobId || getJobId();
      const raw = localStorage.getItem(CAPACITY_REF_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Could not read saved capacity reference:', e);
      return null;
    }
  }

  function persistCapacityRef(jobId, refData) {
    try {
      const id = jobId || getJobId();
      const key = CAPACITY_REF_PREFIX + id;
      localStorage.setItem(key, JSON.stringify(refData));
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: key, value: JSON.stringify(refData) }).catch(function () {});
      }
    } catch (e) {
      console.warn('Could not persist capacity reference:', e);
    }
  }

  function deleteSavedCapacityRef(jobId) {
    try {
      const id = jobId || getJobId();
      const key = CAPACITY_REF_PREFIX + id;
      localStorage.removeItem(key);
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.remove({ key: key }).catch(function () {});
      }
    } catch (e) {}
  }

  function formatCapValue(canonicalBblFt, unit) {
    const val = Number(canonicalBblFt) || 0;
    if (unit === 'LTR/M' || unit === 'L/M' || unit === 'LTR') {
      // 1 bbl = 158.987 L, 1 m = 3.28084 ft
      return (val * 3.28084 * 158.987).toFixed(2);
    } else if (unit === 'BBL/FT') {
      return val.toFixed(5);
    } else {
      // Default: BBL/M (1 m = 3.28084 ft)
      return (val * 3.28084).toFixed(5);
    }
  }

  function parseCapValueToCanonical(inputVal, unit) {
    const val = Number(inputVal) || 0;
    if (unit === 'LTR/M' || unit === 'L/M' || unit === 'LTR') {
      return val / (3.28084 * 158.987);
    } else if (unit === 'BBL/FT') {
      return val;
    } else {
      // Default: BBL/M (1 m = 3.28084 ft)
      return val / 3.28084;
    }
  }

  const CAP_UNIT_STORAGE_KEY = 'drilling_toolkit_cementing_cap_unit';

  function getStoredCapUnit() {
    try {
      const sys = (typeof window !== 'undefined' && window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
        ? window.UnitsEngine.getUnitSystem()
        : 'mixed';
      if (sys === 'api') return 'BBL/FT';
      if (sys === 'si') return 'L/M';

      const val = localStorage.getItem(CAP_UNIT_STORAGE_KEY);
      if (val === 'BBL/M' || val === 'BBL/FT' || val === 'LTR/M' || val === 'L/M') return val;
    } catch (e) {
      console.warn('Could not read stored cementing cap unit:', e);
    }
    return getStoredUnit() === 'ft' ? 'BBL/FT' : 'BBL/M';
  }

  function persistStoredCapUnit(unit) {
    try {
      localStorage.setItem(CAP_UNIT_STORAGE_KEY, unit);
    } catch (e) {
      console.warn('Could not persist cementing cap unit to localStorage:', e);
    }
    try {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: CAP_UNIT_STORAGE_KEY, value: unit }).catch(function () {});
      }
    } catch (e) {}
  }

  // Global state for cementing (cementingStore aliased to cementingState)
  const cementingState = {
    view: 'chooser', // 'chooser' | 'capacities' | 'welldata' | 'results'
    unit: getStoredUnit(), // 'm' | 'ft', default 'm'
    capUnit: getStoredCapUnit(), // 'BBL/M' | 'BBL/FT' | 'L/M', default 'BBL/M'
    section: '13.375',
    model: 'subsea',
    jobName: '',
    inputs: JSON.parse(JSON.stringify(SECTION_PRESETS['13.375'])),
    overrides: {},
    activeReference: null,
    referenceIsDirty: false,
    results: null,
    collapsed: {
      schematic: false,
      inputs: false,
      capacities: false,
      placement: false,
      displacement: false,
      pressures: false,
      checks: false
    },
    wellDataSubmitted: false,
    collapsedSections: {
      depths: false,
      fluids: false,
      limits: false
    },
    savedJobs: getSavedJobs()
  };

  const cementingStore = cementingState;
  root.cementingStore = cementingStore;
  root.cementingState = cementingState;

  // Asynchronously sync Preferences if available
  try {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      window.Capacitor.Plugins.Preferences.get({ key: UNIT_STORAGE_KEY }).then(function (result) {
        if (result && (result.value === 'm' || result.value === 'ft')) {
          if (cementingState.unit !== result.value) {
            cementingState.unit = result.value;
            try { localStorage.setItem(UNIT_STORAGE_KEY, result.value); } catch (_) {}
            if (cementingState.view !== 'chooser') renderCementingScreen();
          }
        }
      }).catch(function () {});
    }
  } catch (_) {}

  /**
   * Launch Cementing Module
   */
  function openCementingModule(sectionKey) {
    if (sectionKey && SECTION_PRESETS[sectionKey]) {
      cementingState.section = sectionKey;
      cementingState.model = SECTION_PRESETS[sectionKey].model;
      cementingState.inputs = JSON.parse(JSON.stringify(SECTION_PRESETS[sectionKey]));
      cementingState.overrides = {};
      cementingState.jobName = '';
      cementingState.results = null;
      cementingState.wellDataSubmitted = false;
      cementingState.collapsedSections = { depths: false, fluids: false, limits: false };

      const draft = getWellDataDraft(sectionKey);
      if (draft && draft.inputs) {
        Object.assign(cementingState.inputs, draft.inputs);
        if (draft.jobName) {
          cementingState.jobName = draft.jobName;
          cementingState.inputs.name = draft.jobName;
        }
      }

      const savedRef = getSavedCapacityRef(sectionKey);
      if (savedRef) {
        cementingState.activeReference = savedRef;
        if (savedRef.tubulars) {
          cementingState.inputs.tubulars = Object.assign({}, savedRef.tubulars);
        }
        if (savedRef.unit) {
          cementingState.capUnit = savedRef.unit;
        }
        if (savedRef.unitSystem) {
          cementingState.unit = savedRef.unitSystem;
        } else {
          cementingState.unit = getStoredUnit();
        }
        if (savedRef.overrides) {
          cementingState.overrides = Object.assign({}, savedRef.overrides);
        }
      } else {
        cementingState.activeReference = null;
        cementingState.capUnit = getStoredCapUnit();
        cementingState.unit = getStoredUnit();
      }
      cementingState.referenceIsDirty = true;
      cementingState.collapsed.schematic = false;
      cementingState.view = 'capacities'; // STEP 1: Always start with Capacities step
    } else {
      cementingState.view = 'chooser';
    }
    cementingState.savedJobs = getSavedJobs();

    const curScreen = (typeof state !== 'undefined' && state && state.currentScreen)
      ? state.currentScreen
      : (window.state && window.state.currentScreen);

    if (curScreen === 'cement-planner-subsea' || curScreen === 'cementing') {
      renderCementingScreen();
      const appContainer = document.querySelector('.app-container');
      if (appContainer) appContainer.scrollTop = 0;
      window.scrollTo(0, 0);
    } else {
      if (typeof navigateTo === 'function') {
        navigateTo('cement-planner-subsea');
      } else if (typeof window.navigateTo === 'function') {
        window.navigateTo('cement-planner-subsea');
      } else {
        renderCementingScreen();
      }
    }
  }
  root.openCementingModule = openCementingModule;
  if (typeof window !== 'undefined') {
    window.openCementingModule = openCementingModule;
  }

  /**
   * Container paddingTop for sticky header: normal flow handles spacing naturally
   */
  function updateCementingHeaderHeight() {
    const container = document.getElementById('cementing-container');
    if (container) {
      container.style.paddingTop = '0px';
    }
  }

  function initCementingStickyHeaderScroll() {
    // Legacy scroll threshold removed: managed by unified CollapsingHeader engine
  }

  /**
   * Main Screen Render Entry (Wizard Flow Router)
   */
  function renderCementingScreen() {
    const container = document.getElementById('cementing-container');
    if (!container) return;
    container.innerHTML = '';

    const headerSlot = document.getElementById('cementing-job-header-slot');
    if (headerSlot) headerSlot.innerHTML = '';

    const headerWrapper = document.getElementById('cementing-fixed-header-wrapper');
    if (headerWrapper) headerWrapper.classList.remove('is-scrolled');

    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.classList.add('cementing-active');
    }

    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || (appContainer ? appContainer.scrollTop : 0) || 0;
    if (currentScrollY > 0) {
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (appContainer) appContainer.scrollTop = 0;
    }

    const titleEl = document.getElementById('cementing-screen-title');
    const compactTitleEl = document.getElementById('cementing-screen-title-compact');
    const subtitleEl = document.getElementById('cementing-screen-subtitle');
    let badgeEl = document.getElementById('cementing-header-badge');
    const screenEl = document.getElementById('screen-cement-planner-subsea') || document.getElementById('screen-cementing');

    if (cementingState.view === 'chooser') {
      if (screenEl) screenEl.classList.remove('job-active');
      if (appContainer) {
        appContainer.classList.add('cementing-active');
        appContainer.classList.remove('cementing-job-active');
      }
      if (container) container.style.paddingTop = '0px';
      if (titleEl) titleEl.textContent = t('Subsea Wellhead');
      if (compactTitleEl) compactTitleEl.textContent = t('Subsea Wellhead');
      if (badgeEl) badgeEl.style.display = 'none';
      if (titleEl && titleEl.parentNode) {
        const extraBadges = titleEl.parentNode.querySelectorAll(':scope > .cement-badge-model');
        extraBadges.forEach(b => b.remove());
      }
      if (subtitleEl) {
        subtitleEl.textContent = t('Floater Rig · Subsea & riserless casing cement calculation');
        subtitleEl.style.display = '';
      }
      renderCementingChooser(container);
    } else {
      if (screenEl) screenEl.classList.add('job-active');
      if (appContainer) {
        appContainer.classList.add('cementing-active', 'cementing-job-active');
      }
      const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];

      if (titleEl) titleEl.textContent = t('Subsea Wellhead');
      if (compactTitleEl) compactTitleEl.textContent = t('Subsea Wellhead');

      const isCustom = cementingState.section === 'custom';
      const isRiserless = cementingState.inputs.model === 'riserless' || cementingState.section === '30' || cementingState.section === '20';
      const badgeText = isCustom ? 'CUSTOM' : (isRiserless ? 'RISERLESS' : 'SUBSEA');
      const badgeClass = isRiserless ? 'cement-badge-riserless' : 'cement-badge-subsea';
      const secSubtitle = preset.label || 'Custom Section';

      if (titleEl && titleEl.parentNode) {
        const extraBadges = titleEl.parentNode.querySelectorAll(':scope > .cement-badge-model');
        extraBadges.forEach(b => b.remove());
      }

      if (subtitleEl) {
        subtitleEl.innerHTML = `<span class="cement-subtitle-text">${t(secSubtitle)}</span> <span class="cement-badge-model ${badgeClass}">${t(badgeText)}</span>`;
        subtitleEl.style.display = 'inline-flex';
        subtitleEl.style.alignItems = 'center';
        subtitleEl.style.gap = '8px';
      }

      if (badgeEl) {
        badgeEl.style.display = 'none';
      }

      // Step-by-Step Wizard Router
      if (cementingState.view === 'capacities') {
        renderCapacitiesStep(container);
      } else if (cementingState.view === 'welldata') {
        renderWellDataStep(container);
      } else if (cementingState.view === 'results') {
        renderResultsStep(container);
      } else {
        renderCapacitiesStep(container);
      }

      updateCementingHeaderHeight();
      initCementingStickyHeaderScroll();
    }
  }
  root.renderCementingScreen = renderCementingScreen;

  /**
   * Render Section Chooser Landing Screen
   */
  function renderCementingChooser(container) {
    if (!container) return;
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'cement-view-animate';

    const sections = [
      {
        id: '30',
        title: '30" Conductor',
        sub: '36" Hole · 30" Casing · Riserless Inner String',
        model: 'riserless',
        badge: 'Riserless',
        badgeClass: 'cement-badge-riserless',
        icon: '30"'
      },
      {
        id: '20',
        title: '20" Surface Casing',
        sub: '26" Hole · 20" Casing · Riserless Inner String',
        model: 'riserless',
        badge: 'Riserless',
        badgeClass: 'cement-badge-riserless',
        icon: '20"'
      },
      {
        id: '13.375',
        title: '13-3/8" Casing',
        sub: '17½" Hole · 13-3/8" Casing · Subsea Marine Riser',
        model: 'subsea',
        badge: 'Subsea',
        badgeClass: 'cement-badge-subsea',
        icon: '13⅜"'
      },
      {
        id: '9.625',
        title: '9-5/8" Casing',
        sub: '12¼" Hole · 9-5/8" Casing · Subsea Marine Riser',
        model: 'subsea',
        badge: 'Subsea',
        badgeClass: 'cement-badge-subsea',
        icon: '9⅝"'
      },
      {
        id: 'custom',
        title: 'Custom Section',
        sub: 'Custom Hole / Casing Geometry',
        model: 'subsea',
        badge: 'Custom',
        badgeClass: 'cement-badge-subsea',
        icon: '⚙'
      }
    ];

    let gridHtml = `
      <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:18px;">
    `;

    sections.forEach(sec => {
      gridHtml += `
        <div class="cement-section-card" data-section="${sec.id}" style="display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:var(--card-bg); border:1px solid var(--border-subtle); border-radius:14px; cursor:pointer; transition:transform 0.15s, box-shadow 0.15s;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:44px; height:44px; border-radius:10px; background:linear-gradient(135deg, #0369a1 0%, #0284c7 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; letter-spacing:-0.02em; flex-shrink:0;">
              ${sec.icon}
            </div>
            <div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary); margin-bottom:2px;">
                ${t(sec.title)}
              </div>
              <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.3;">
                ${t(sec.sub)}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="cement-badge-model ${sec.badgeClass}">${t(sec.badge)}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-secondary);"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      `;
    });

    gridHtml += `</div>`;

    // Saved Jobs Section
    const saved = cementingState.savedJobs;
    let savedHtml = `
      <div class="content-card" style="margin-top:24px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:0.92rem; font-weight:700; color:var(--text-primary); margin:0;">${t('Saved Cementing Jobs')}</h3>
          <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${saved.length} ${t('saved')}</span>
        </div>
    `;

    if (saved.length === 0) {
      savedHtml += `
        <p style="font-size:0.75rem; color:var(--text-secondary); margin:0; line-height:1.4;">
          ${t('No saved jobs yet. Configure any section and click "Save Job" to keep your well parameters for later.')}
        </p>
      `;
    } else {
      savedHtml += `<div style="display:flex; flex-direction:column; gap:8px;">`;
      saved.forEach((job, idx) => {
        const jobId = job.id || idx;
        savedHtml += `
          <div class="cement-saved-job-card" data-load-id="${jobId}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-subtle); border-radius:12px; border:1px solid var(--border-subtle); cursor:pointer;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${escapeAttr(job.jobName || job.name)}</div>
              <div style="font-size:0.7rem; color:var(--text-secondary);">${escapeAttr(job.date || '')} · ${escapeAttr(job.sectionLabel || (job.section + '" Section'))} (${escapeAttr((job.model || 'subsea').toUpperCase())})</div>
            </div>
            <div style="display:flex; gap:6px; align-items:center; margin-left:8px;">
              <button type="button" class="btn btn-primary" data-load-id="${jobId}" style="padding:6px 12px; font-size:0.75rem; margin:0;">${t('Load')}</button>
              <button type="button" class="btn btn-secondary" data-del-id="${jobId}" style="padding:6px 10px; font-size:0.75rem; margin:0; color:#EF4444;">✕</button>
            </div>
          </div>
        `;
      });
      savedHtml += `</div>`;
    }

    savedHtml += `</div>`;

    wrapper.innerHTML = gridHtml + savedHtml;
    container.appendChild(wrapper);

    // Bind click events on section cards with smooth feedback
    wrapper.querySelectorAll('.cement-section-card').forEach(card => {
      card.onclick = () => {
        const secId = card.getAttribute('data-section');
        card.classList.add('active');
        requestAnimationFrame(() => {
          setTimeout(() => {
            openCementingModule(secId);
          }, 35);
        });
      };
    });

    // Bind saved job card click & load button with smooth feedback
    wrapper.querySelectorAll('[data-load-id]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-load-id');
        el.classList.add('active');
        requestAnimationFrame(() => {
          setTimeout(() => {
            loadSavedCementingJob(id);
          }, 35);
        });
      };
    });

    wrapper.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        deleteSavedCementingJob(id);
      };
    });
  }

  /**
   * Load Saved Job
   * Opens directly on Results screen with option to load back into flow [ Edit Well Data ]
   */
  function loadSavedCementingJob(id) {
    const job = cementingState.savedJobs.find((j, idx) => String(j.id || idx) === String(id));
    if (!job) return;
    cementingState.section = job.sectionId || job.section || '30';
    cementingState.model = job.model || 'subsea';
    cementingState.inputs = JSON.parse(JSON.stringify(job.wellData || job.inputs || {}));
    cementingState.jobName = job.jobName || job.name || '';
    cementingState.inputs.name = cementingState.jobName;

    if (job.reference) {
      cementingState.activeReference = JSON.parse(JSON.stringify(job.reference));
      cementingState.referenceIsDirty = false;
      if (job.reference.tubulars) {
        cementingState.inputs.tubulars = Object.assign({}, job.reference.tubulars);
      }
      if (job.reference.unit) {
        cementingState.capUnit = job.reference.unit;
      }
      if (job.reference.overrides) {
        cementingState.overrides = Object.assign({}, job.reference.overrides);
      }
    } else {
      const savedRef = getSavedCapacityRef(cementingState.section);
      if (savedRef) {
        cementingState.activeReference = savedRef;
        cementingState.referenceIsDirty = false;
        if (savedRef.tubulars) cementingState.inputs.tubulars = Object.assign({}, savedRef.tubulars);
        if (savedRef.unit) cementingState.capUnit = savedRef.unit;
        if (savedRef.overrides) cementingState.overrides = Object.assign({}, savedRef.overrides);
      } else {
        cementingState.activeReference = null;
        cementingState.referenceIsDirty = true;
        cementingState.capUnit = getStoredCapUnit();
      }
    }

    if (job.overrides) {
      cementingState.overrides = Object.assign({}, job.overrides);
    }

    // If legacy job was saved in ft and not canonical metres, convert depth keys to metres once
    if (job.unit === 'ft' && !job.canonical) {
      DEPTH_KEYS.forEach(k => {
        if (cementingState.inputs[k] !== undefined) {
          cementingState.inputs[k] = Number(cementingState.inputs[k]) * M_PER_FT;
        }
      });
    }

    cementingState.unit = job.unitSystem || job.unit || getStoredUnit();
    cementingState.collapsed.schematic = false;

    // Load saved results or compute fresh
    if (job.results) {
      cementingState.results = JSON.parse(JSON.stringify(job.results));
    } else {
      const engineInput = getEngineInputs();
      try {
        if (cementingState.inputs.model === 'riserless') {
          cementingState.results = CementingEngine.calcRiserless(engineInput);
        } else {
          cementingState.results = CementingEngine.calcSubsea(engineInput);
        }
        cementingState.engineInput = engineInput;
      } catch (e) {
        console.error('Calculation error loading saved job:', e);
      }
    }

    cementingState.view = 'results';
    if (typeof showToast === 'function') showToast(`${t('Loaded')} "${cementingState.jobName}"`);
    renderCementingScreen();
  }

  /**
   * Delete Saved Job
   */
  function deleteSavedCementingJob(id) {
    cementingState.savedJobs = cementingState.savedJobs.filter((j, idx) => String(j.id || idx) !== String(id));
    persistSavedJobs(cementingState.savedJobs);
    if (typeof showToast === 'function') showToast(t('Job deleted'));
    renderCementingScreen();
  }

    function formatDepthDisplay(canonicalMeters) {
    if (canonicalMeters === undefined || canonicalMeters === null || canonicalMeters === '' || isNaN(canonicalMeters)) return '';
    const val = cementingState.unit === 'ft' ? (Number(canonicalMeters) / M_PER_FT) : Number(canonicalMeters);
    const rounded = Math.round(val * 100) / 100;
    return String(rounded);
  }

  /**
   * Unit Conversion Helpers
   */
  function toggleCementingUnit(newUnit) {
    const sys = (typeof window !== 'undefined' && window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';

    if (sys !== 'mixed') {
      if (typeof showToast === 'function') {
        const sysLabel = sys === 'api' ? t('Oilfield Units (API)') : t('Metric Units (SI)');
        showToast(t('Unit System') + ': ' + sysLabel);
      }
      return;
    }

    if (newUnit === cementingState.unit) return;
    cementingState.unit = newUnit;
    persistStoredUnit(newUnit);
    if (newUnit === 'ft') {
      cementingState.capUnit = 'BBL/FT';
      persistStoredCapUnit('BBL/FT');
    } else if (newUnit === 'm') {
      cementingState.capUnit = 'BBL/M';
      persistStoredCapUnit('BBL/M');
    }

    if (cementingState.view === 'capacities') {
      const isM = newUnit === 'm';
      const btnM = document.getElementById('subsea-top-unit-m');
      const btnFt = document.getElementById('subsea-top-unit-ft');
      const topBarM = document.getElementById('toggle-unit-m');
      const topBarFt = document.getElementById('toggle-unit-ft');
      const pill = document.getElementById('subsea-unit-pill-desc');
      const unitSelect = document.getElementById('cap-global-unit-select');
      if (btnM && btnFt) {
        btnM.classList.toggle('active', isM);
        btnFt.classList.toggle('active', !isM);
      }
      if (topBarM && topBarFt) {
        topBarM.classList.toggle('active', isM);
        topBarFt.classList.toggle('active', !isM);
      }
      if (pill) {
        pill.textContent = isM ? t('Metric (m, bbl/m)') : t('Imperial (ft, bbl/ft)');
        pill.className = `cement-unit-mode-pill ${isM ? 'mode-metric' : 'mode-imperial'}`;
      }
      if (unitSelect) {
        unitSelect.value = cementingState.capUnit;
      }
      document.querySelectorAll('#cementing-container input.cement-cap-input, .cement-cap-table-simplified input.cement-cap-input').forEach(inpEl => {
        const canonical = parseFloat(inpEl.getAttribute('data-canonical')) || 0;
        inpEl.value = (typeof formatCapValue === 'function' ? formatCapValue : window.CementingCommon.formatCapValue)(canonical, cementingState.capUnit);
      });
    } else {
      renderCementingScreen();
    }

    if (typeof showToast === 'function') showToast(t('Units switched to {0}', newUnit.toUpperCase()));
  }

  /**
   * Prepare Inputs in Imperial (ft, bbl/ft) for Engine
   * Reads strictly from active reference canonical values if available!
   */
  function getEngineInputs() {
    const raw = Object.assign({}, cementingState.inputs);
    const overrides = cementingState.overrides;

    if (!raw.tubulars) {
      const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
      raw.tubulars = Object.assign({}, preset.tubulars);
    }
    const caps = computeJobCapacities(raw, overrides);
    Object.assign(raw, caps.effective);
    Object.assign(raw, caps.labels);

    // If active reference exists and has canonical capacities, ensure downstream calculations strictly use them!
    if (cementingState.activeReference && cementingState.activeReference.canonical) {
      Object.assign(raw, cementingState.activeReference.canonical);
    }

    // CementingEngine calculates with imperial units (depth in ft).
    // Length/depth inputs are canonically stored in metres; convert to ft for engine calculations.
    // This ensures downstream calculations produce identical results regardless of active unit mode.
    DEPTH_KEYS.forEach(k => {
      if (raw[k] !== undefined && raw[k] !== '' && raw[k] !== null && !isNaN(raw[k])) {
        raw[k] = Number(raw[k]) / M_PER_FT;
      } else {
        raw[k] = 0;
      }
    });

    Object.keys(raw).forEach(k => {
      if (raw[k] === '' || raw[k] === null || raw[k] === undefined) {
        raw[k] = 0;
      }
    });

    return raw;
  }

  /**
   * Header Sub-row Builder: Job Name (editable) on left, Unit Toggle (m / ft) on right
   */
  function renderJobHeaderTopBar(container) {
    const unit = cementingState.unit;
    const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
    const currentName = cementingState.inputs.name || cementingState.jobName || '';

    const topBar = document.createElement('div');
    topBar.className = 'cement-header-row';
    topBar.innerHTML = `
      <div class="cement-job-name-wrap">
        <label for="job-name-inp" class="cement-job-name-caption">Job Name</label>
        <input type="text" class="form-input cement-job-name-input" id="job-name-inp" value="${escapeAttr(currentName)}" placeholder="Job Name (e.g. ${escapeAttr(preset.label || 'Well 1')})" autocomplete="off" autocorrect="off" spellcheck="false">
      </div>
      <div class="cement-unit-control-wrap">
        <span class="cement-unit-caption">UNIT</span>
        <div class="cement-segmented-control" role="group" aria-label="Units">
          <button type="button" class="cement-unit-btn ${unit === 'm' ? 'active' : ''}" id="toggle-unit-m" data-unit="m">m</button>
          <button type="button" class="cement-unit-btn ${unit === 'ft' ? 'active' : ''}" id="toggle-unit-ft" data-unit="ft">ft</button>
        </div>
      </div>
    `;
    container.appendChild(topBar);

    const nameInp = topBar.querySelector('#job-name-inp');
    if (nameInp) {
      nameInp.oninput = (e) => {
        cementingState.inputs.name = e.target.value;
        cementingState.jobName = e.target.value;
      };
      nameInp.onchange = (e) => {
        cementingState.inputs.name = e.target.value.trim();
        cementingState.jobName = e.target.value.trim();
      };
    }

    topBar.querySelector('#toggle-unit-m').onclick = () => toggleCementingUnit('m');
    topBar.querySelector('#toggle-unit-ft').onclick = () => toggleCementingUnit('ft');
    return topBar;
  }

  /**
   * Read-Only Header Bar for Well Data & Results steps:
   * Shows saved Job Name as plain text (fallback to preset label e.g. '30" Conductor')
   * and chosen Unit as a small badge (e.g. 'M' or 'FT'). No input field, no toggle.
   */
  function renderReadOnlyJobHeaderBar(container) {
    const unit = (cementingState.unit || 'm').toUpperCase();
    const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
    const displayName = (cementingState.inputs.name && cementingState.inputs.name.trim())
      || (cementingState.jobName && cementingState.jobName.trim())
      || (preset && preset.label)
      || '30" Conductor';

    const bar = document.createElement('div');
    bar.className = 'cement-header-row cement-readonly-header-row';
    bar.innerHTML = `
      <div class="cement-readonly-job-wrap">
        <span class="cement-readonly-caption">${t('Job Name')}</span>
        <div class="cement-readonly-job-name" title="${escapeAttr(displayName)}">
          ${escapeAttr(displayName)}
        </div>
      </div>
      <div class="cement-readonly-unit-wrap">
        <span class="cement-readonly-caption">${t('UNIT')}</span>
        <span class="cement-unit-readonly-badge">${escapeAttr(unit)}</span>
      </div>
    `;
    container.appendChild(bar);
    return bar;
  }

  /**
   * Build readable summary chip text from reference object
   */
  function formatReferenceSummaryChips(ref) {
    if (!ref) return 'Standard API Defaults';
    if (ref.rows && ref.rows.length) {
      const parts = ref.rows.map(r => r.source).filter(s => s && s !== '-');
      if (parts.length) return parts.join(' · ');
    }
    if (ref.tubulars) {
      const parts = [];
      const csg = CAPACITY_DATA.find(d => d.id === ref.tubulars.csg_id);
      if (csg) parts.push(csg.label);
      const dp = CAPACITY_DATA.find(d => d.id === ref.tubulars.dp_id);
      if (dp) parts.push(dp.label);
      const oh = CAPACITY_DATA.find(d => d.id === ref.tubulars.hole_id);
      if (oh) parts.push(oh.label);
      if (parts.length) return parts.join(' · ');
    }
    return 'Customized Reference';
  }

  /**
   * Save Active Reference from current UI state
   */
  function saveActiveReferenceFromUI(cardEl, saveBtn, useBtn) {
    const inp = cementingState.inputs;
    const sectionKey = cementingState.section || inp.section || '30';
    const computed = computeJobCapacities(inp, cementingState.overrides);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const activeUnit = cementingState.capUnit || 'BBL/M';

    // Extract current table rows dynamically from the DOM
    const rowsData = [];
    cardEl.querySelectorAll('tbody tr').forEach(tr => {
      const compTitle = tr.querySelector('.cement-cap-comp-title')?.textContent?.trim() || '';
      const compSub = tr.querySelector('.cement-cap-comp-sub')?.textContent?.trim() || '';
      const capInput = tr.querySelector('input.cement-cap-input');
      const capVal = capInput ? capInput.value : '';
      const canonicalVal = capInput ? parseFloat(capInput.getAttribute('data-canonical')) || 0 : 0;
      const selectEl = tr.querySelector('select[data-cap-source]');
      let sourceLabel = '';
      if (selectEl && selectEl.selectedOptions && selectEl.selectedOptions[0]) {
        sourceLabel = selectEl.selectedOptions[0].textContent.trim();
      } else {
        sourceLabel = tr.querySelector('.cement-cap-source-readonly')?.textContent?.trim() || '';
      }
      rowsData.push({
        component: compTitle,
        label: compSub,
        source: sourceLabel,
        canonicalBblFt: canonicalVal,
        value: capVal,
        unit: activeUnit
      });
    });

    const refData = {
      sectionId: sectionKey,
      jobName: cementingState.inputs.name || cementingState.jobName || '',
      savedAt: `${dateStr}, ${timeStr}`,
      timestamp: now.getTime(),
      unit: activeUnit,
      unitSystem: cementingState.unit,
      overrides: Object.assign({}, cementingState.overrides),
      tubulars: Object.assign({}, inp.tubulars),
      canonical: {
        cap_csg: computed.effective.cap_csg,
        csg_disp: computed.effective.csg_disp,
        cap_dp: computed.effective.cap_dp,
        dp_cl_disp: computed.effective.dp_cl_disp,
        cap_ann_oh: computed.effective.cap_ann_oh,
        cap_oh: computed.effective.cap_oh,
        cap_ann_c: computed.effective.cap_ann_c || 0,
        cap_riser: computed.effective.cap_riser || 0
      },
      rows: rowsData
    };

    persistCapacityRef(sectionKey, refData);
    cementingState.activeReference = refData;
    cementingState.referenceIsDirty = false;

    if (typeof showToast === 'function') {
      showToast(t('Reference saved'));
    }
    if (saveBtn) {
      saveBtn.className = 'btn btn-secondary';
    }
    if (useBtn) {
      useBtn.className = 'btn btn-primary';
      useBtn.disabled = false;
      useBtn.removeAttribute('disabled');
    }
  }

  /**
   * Validate Well Data inputs
   */
  function getWellDataErrors(inp) {
    const errors = {};
    const depthKeys = ['air_gap', 'water_depth', 'hanger', 'prev_shoe', 'td', 'shoe', 'shoe_track_len'];
    depthKeys.forEach(k => {
      const v = inp[k];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < 0) {
          errors[k] = 'Must be a valid positive number';
        }
      }
    });

    const shoeRaw = inp.shoe;
    const tdRaw = inp.td;
    const shoe = (shoeRaw !== undefined && shoeRaw !== null && shoeRaw !== '') ? Number(shoeRaw) : 0;
    const td = (tdRaw !== undefined && tdRaw !== null && tdRaw !== '') ? Number(tdRaw) : 0;
    const prevShoe = Number(inp.prev_shoe) || 0;
    const hanger = Number(inp.hanger) || 0;
    const shoeTrack = Number(inp.shoe_track_len) || 0;

    // Required fields: Casing shoe, TD, Pump Output
    if (!shoeRaw || shoe <= 0) {
      errors['shoe'] = 'Casing shoe depth required';
    }
    if (!tdRaw || td <= 0) {
      errors['td'] = 'Hole depth (MD) required';
    } else if (shoe > 0 && td < shoe) {
      errors['td'] = 'Hole depth (MD) cannot be shallower than casing shoe';
    }

    if (inp.model === 'subsea' && prevShoe > 0 && shoe > 0 && shoe <= prevShoe) {
      errors['shoe'] = 'Shoe must be deeper than previous shoe';
    }
    if (inp.model === 'subsea' && hanger > 0 && shoe > 0 && shoe <= hanger) {
      errors['shoe'] = 'Shoe must be deeper than casing hanger';
    }
    if (shoeTrack > 0 && shoe > 0 && shoeTrack >= shoe) {
      errors['shoe_track_len'] = 'Shoe track cannot exceed shoe depth';
    }

    const pumpRaw = inp.pump_output;
    const pump = (pumpRaw !== undefined && pumpRaw !== null && pumpRaw !== '') ? Number(pumpRaw) : 0;
    if (!pumpRaw || pump <= 0) {
      errors['pump_output'] = 'Pump output required';
    }

    // Slurry requirement: at least one of lead or tail slurry volume must be entered and > 0
    const leadVol = Number(inp.lead_vol) || 0;
    const tailVol = Number(inp.tail_vol) || 0;
    if (leadVol <= 0 && tailVol <= 0) {
      errors['slurry_pair'] = 'Specify lead or tail slurry volume';
    } else {
      if (leadVol > 0 && (!inp.lead_mw || Number(inp.lead_mw) <= 0)) {
        errors['lead_mw'] = 'Lead slurry MW required';
      }
      if (tailVol > 0 && (!inp.tail_mw || Number(inp.tail_mw) <= 0)) {
        errors['tail_mw'] = 'Tail slurry MW required';
      }
    }

    if (inp.model === 'subsea') {
      const mw = Number(inp.mw) || 0;
      if (!inp.mw || mw <= 0) {
        errors['mw'] = 'Mud weight required';
      }
    }

    return errors;
  }

  /**
   * STEP 1: Render Capacities Screen
   * Shows ONLY API Capacities & Annuli card + [ Save as Reference ] + [ Use Reference ]
   */
  function renderCapacitiesStep(container) {
    if (!container) return;
    container.innerHTML = '';
    const inp = cementingState.inputs;
    const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
    if (!inp.tubulars) {
      inp.tubulars = Object.assign({}, preset.tubulars);
    }

    // Top Header Row (mounted in fixed header slot)
    const headerSlot = document.getElementById('cementing-job-header-slot') || container;
    headerSlot.innerHTML = '';
    renderJobHeaderTopBar(headerSlot);

    // Top-Level Unit Toggle Card directly above API Capacities & Annuli
    const isM = (cementingState.unit || 'm') === 'm';
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';
    let pillText = isM ? t('Metric (m, bbl/m)') : t('Imperial (ft, bbl/ft)');
    let pillClass = isM ? 'mode-metric' : 'mode-imperial';
    if (sys === 'api') {
      pillText = t('Oilfield Units (API)');
      pillClass = 'mode-imperial';
    } else if (sys === 'si') {
      pillText = t('Metric Units (SI)');
      pillClass = 'mode-metric';
    }

    const unitCard = document.createElement('div');
    unitCard.className = 'content-card cement-unit-toggle-card cement-view-animate';
    unitCard.innerHTML = `
      <div class="cement-unit-header-left">
        <div class="cement-unit-title-group">
          <svg class="cement-unit-ruler-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/>
            <path d="m14.5 3.5 2 2"/>
            <path d="m11.5 6.5 2 2"/>
            <path d="m8.5 9.5 2 2"/>
            <path d="m5.5 12.5 2 2"/>
          </svg>
          <span class="cement-unit-caption">${t('UNIT SYSTEM')}</span>
        </div>
        <span class="cement-unit-mode-pill ${pillClass}" id="subsea-unit-pill-desc">
          ${pillText}
        </span>
      </div>
      <div class="cement-segmented-control" role="group" aria-label="Units" ${sys !== 'mixed' ? 'style="opacity:0.55; pointer-events:none;"' : ''}>
        <button type="button" class="cement-unit-btn ${isM ? 'active' : ''}" id="subsea-top-unit-m" data-unit="m">M</button>
        <button type="button" class="cement-unit-btn ${!isM ? 'active' : ''}" id="subsea-top-unit-ft" data-unit="ft">FT</button>
      </div>
    `;
    container.appendChild(unitCard);

    unitCard.querySelector('#subsea-top-unit-m').onclick = () => toggleCementingUnit('m');
    unitCard.querySelector('#subsea-top-unit-ft').onclick = () => toggleCementingUnit('ft');

    // API Capacities & Annuli Card
    const capCard = document.createElement('div');
    capCard.className = 'content-card cement-view-animate';
    capCard.style.padding = '14px 16px';
    capCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          API Capacities & Annuli
        </h3>
      </div>
      <div style="margin-bottom:12px; font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">
        All standard nominal values sourced from <strong>API Tubular Data</strong>. Values can be customized per job.
      </div>
      <div class="cement-cap-table-wrap">
        ${renderCapacitiesTable(inp)}
      </div>
    `;
    container.appendChild(capCard);
    bindCapacitiesActions(capCard);

    // Bottom Action Buttons: Side-by-Side [ Save as Reference ] & [ Use Reference ]
    const isSaved = Boolean(cementingState.activeReference && !cementingState.referenceIsDirty);
    const btnRow = document.createElement('div');
    btnRow.className = 'cement-btn-side-by-side cement-view-animate';
    btnRow.style.cssText = 'margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:10px;';
    btnRow.innerHTML = `
      <button type="button" class="btn ${isSaved ? 'btn-secondary' : 'btn-primary'}" id="btn-save-reference-wizard" style="width:100%; margin:0; padding:11px 6px; font-size:0.82rem; font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">
        ${t('Save as Reference')}
      </button>
      <button type="button" class="btn ${isSaved ? 'btn-primary' : 'btn-secondary'}" id="btn-use-reference-wizard" style="width:100%; margin:0; padding:11px 6px; font-size:0.82rem; font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" ${isSaved ? '' : 'disabled'}>
        ${t('Use Reference')}
      </button>
    `;
    container.appendChild(btnRow);

    const saveBtn = btnRow.querySelector('#btn-save-reference-wizard');
    const useBtn = btnRow.querySelector('#btn-use-reference-wizard');

    saveBtn.onclick = () => {
      saveActiveReferenceFromUI(capCard, saveBtn, useBtn);
    };

    useBtn.onclick = () => {
      if (useBtn.disabled || !cementingState.activeReference || cementingState.referenceIsDirty) return;
      cementingState.view = 'welldata';
      renderCementingScreen();
    };
  }

  /**
   * Modal to Copy Inputs from a Previous Saved Job
   */
  function openCopyFromPreviousJobModal() {
    const jobs = cementingState.savedJobs || [];
    if (!jobs || jobs.length === 0) {
      if (typeof showToast === 'function') showToast(t('No saved jobs available to copy from'));
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'cement-modal-overlay';
    overlay.innerHTML = `
      <div class="cement-modal-card" style="max-height:85vh; display:flex; flex-direction:column;">
        <div class="cement-modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          ${t('Copy from Previous Job')}
        </div>
        <p class="cement-modal-desc" style="margin-bottom:12px;">
          ${t('Select a saved job to copy its well elevations, fluids, and mechanical limits into this form.')}
        </p>
        <div style="overflow-y:auto; flex:1; margin-bottom:14px; padding-right:4px;">
          ${jobs.map((j, idx) => {
            const name = j.name || `${t('Job')} #${idx + 1}`;
            const sec = j.sectionId || j.section || '30';
            const dateStr = j.timestamp ? new Date(j.timestamp).toLocaleDateString() : t('Previous');
            const modelBadge = (j.inputs && j.inputs.model === 'riserless') ? t('Riserless') : t('Subsea');
            return `
              <div class="cement-copy-job-item" data-idx="${idx}">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:700; font-size:0.88rem; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${escapeAttr(name)}
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">
                    ${escapeAttr(sec)}" · ${modelBadge} · ${dateStr}
                  </div>
                </div>
                <button type="button" class="btn btn-secondary" style="font-size:0.75rem; padding:6px 12px; margin:0; pointer-events:none;">
                  ${t('Select')}
                </button>
              </div>
            `;
          }).join('')}
        </div>
        <div class="cement-modal-actions">
          <button type="button" class="btn btn-secondary" id="btn-cancel-copy-modal">${t('Cancel')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancel-copy-modal').onclick = () => {
      document.body.removeChild(overlay);
    };

    overlay.querySelectorAll('.cement-copy-job-item').forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const sourceJob = jobs[idx];
        if (sourceJob) {
          const sourceInputs = sourceJob.wellData || sourceJob.inputs || {};
          const keysToCopy = [
            'air_gap', 'water_depth', 'hanger', 'prev_shoe', 'shoe', 'shoe_track_len', 'td',
            'mw', 'seawater_mw', 'hole_fluid_mw', 'disp_mw',
            'f1_vol', 'f1_mw', 'f2_vol', 'f2_mw', 'sp_vol', 'sp_mw',
            'lead_vol', 'lead_mw', 'tail_vol', 'tail_mw',
            'excess_pct', 'pump_output', 'lot', 'collapse_rating', 'burst_rating', 'bump', 'max_pump_pressure'
          ];
          keysToCopy.forEach(k => {
            if (sourceInputs[k] !== undefined && sourceInputs[k] !== null) {
              cementingState.inputs[k] = sourceInputs[k];
            }
          });
          saveWellDataDraft();
          if (typeof showToast === 'function') {
            showToast(t('Copied data from "{0}"', sourceJob.name || t('previous job')));
          }
          renderCementingScreen();
        }
        document.body.removeChild(overlay);
      };
    });
  }

  /**
   * STEP 2: Render Well Data Screen
   * Shows Read-Only Header + Collapsible Sections + Sticky [ Result ] Button
   */
  function renderWellDataStep(container) {
    if (!container) return;
    container.innerHTML = '';
    const inp = cementingState.inputs;
    const unit = cementingState.unit;
    const isMetric = unit === 'm';
    const depthUnit = isMetric ? 'm' : 'ft';
    const isSubsea = inp.model === 'subsea';

    // 1. Top Header Bar (Read-Only, mounted in fixed header slot)
    const headerSlot = document.getElementById('cementing-job-header-slot') || container;
    headerSlot.innerHTML = '';
    renderReadOnlyJobHeaderBar(headerSlot);

    // 2. Validation check: ONLY if user has attempted submit
    const isSubmitted = Boolean(cementingState.wellDataSubmitted);
    const errors = isSubmitted ? getWellDataErrors(inp) : {};

    // 3. Section fields for filled count calculations
    const depthFieldKeys = isSubsea
      ? ['air_gap', 'water_depth', 'hanger', 'prev_shoe', 'shoe', 'shoe_track_len', 'td']
      : ['air_gap', 'water_depth', 'prev_shoe', 'shoe', 'shoe_track_len', 'td'];

    const fluidFieldKeys = isSubsea
      ? ['mw', 'f1_vol', 'f1_mw', 'f2_vol', 'f2_mw', 'sp_vol', 'sp_mw', 'lead_vol', 'lead_mw', 'tail_vol', 'tail_mw']
      : ['seawater_mw', 'hole_fluid_mw', 'disp_mw', 'f1_vol', 'f1_mw', 'f2_vol', 'f2_mw', 'sp_vol', 'sp_mw', 'lead_vol', 'lead_mw', 'tail_vol', 'tail_mw'];

    const limitFieldKeys = ['excess_pct', 'pump_output', 'lot', 'collapse_rating', 'burst_rating', isSubsea ? 'bump' : 'max_pump_pressure'];

    const isFieldFilled = (k) => {
      const v = inp[k];
      return v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && Number(v) > 0;
    };

    const countFilled = (keys) => keys.filter(isFieldFilled).length;

    if (!cementingState.collapsedSections) {
      cementingState.collapsedSections = { depths: false, fluids: false, limits: false };
    }
    const collapsed = cementingState.collapsedSections;

    // Helper for pump output display value
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';
    const fmtV = (v) => (window.CementingCommon && window.CementingCommon.formatVol) ? window.CementingCommon.formatVol(v) : { val: Number(v || 0).toFixed(1), unit: 'bbl', full: Number(v || 0).toFixed(1) + ' bbl' };
    const fmtMW = (v) => (window.CementingCommon && window.CementingCommon.formatDensity) ? window.CementingCommon.formatDensity(v) : { val: Number(v || 0).toFixed(2), unit: 'ppg', full: Number(v || 0).toFixed(2) + ' ppg' };
    const fmtP = (v) => (window.CementingCommon && window.CementingCommon.formatPressure) ? window.CementingCommon.formatPressure(v) : { val: Number(v || 0).toFixed(0), unit: 'psi', full: Number(v || 0).toFixed(0) + ' psi' };
    const volUnit = fmtV(0).unit;
    const mwUnit = fmtMW(0).unit;
    const pressUnit = fmtP(0).unit;
    const isLtrMode = sys === 'si' || cementingState.capUnit === 'L/M' || cementingState.capUnit === 'LTR/M';
    const pumpUnitLabel = (sys === 'si') ? 'L/stk' : (isLtrMode ? 'ltr/stk' : 'bbl/stk');

    function formatWellDataInputVal(k, rawNativeVal) {
      if (rawNativeVal === undefined || rawNativeVal === null || rawNativeVal === '' || isNaN(Number(rawNativeVal))) return '';
      const v = Number(rawNativeVal);
      if (DEPTH_KEYS.includes(k)) {
        return formatDepthDisplay(v);
      }
      if (VOL_KEYS.includes(k)) {
        if (sys === 'si') return (v * 0.1589873).toFixed(1);
        return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
      }
      if (MW_KEYS.includes(k)) {
        if (sys === 'si') return (v * 0.1198264).toFixed(2);
        return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(2);
      }
      if (PRESS_KEYS.includes(k)) {
        if (sys === 'si') return (v * 0.06894757).toFixed(0);
        return v.toFixed(0);
      }
      if (k === 'pump_output') {
        if (sys === 'si') return (v * 158.9873).toFixed(1);
        if (isLtrMode) return (v * 158.9873).toFixed(2);
        return v.toFixed(3);
      }
      return String(rawNativeVal);
    }

    function parseWellDataInputVal(k, rawVal) {
      if (rawVal === undefined || rawVal === null || rawVal === '') return '';
      const num = parseFloat(String(rawVal).replace(',', '.'));
      if (isNaN(num)) return '';

      if (DEPTH_KEYS.includes(k)) {
        return (cementingState.unit === 'ft') ? (num * M_PER_FT) : num;
      }
      if (VOL_KEYS.includes(k)) {
        return (sys === 'si') ? (num / 0.1589873) : num;
      }
      if (MW_KEYS.includes(k)) {
        return (sys === 'si') ? (num / 0.1198264) : num;
      }
      if (PRESS_KEYS.includes(k)) {
        return (sys === 'si') ? (num / 0.06894757) : num;
      }
      if (k === 'pump_output') {
        if (isLtrMode) return num / 158.9873;
        return num;
      }
      return num;
    }

    // 4. Well Data Card
    const inputsCard = document.createElement('div');
    inputsCard.className = 'content-card cement-view-animate';
    inputsCard.style.padding = '14px 16px';
    inputsCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          ${t('Well Data')}
        </h3>
        <button type="button" class="btn-copy-prev-job" id="btn-copy-from-previous-job" title="${t('Copy inputs from a previous job')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>${t('Copy from previous job')}</span>
        </button>
      </div>

      ${cementingState.section === 'custom' ? `
        <div style="margin-bottom:14px; display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg-subtle); border-radius:10px; border:1px solid var(--border-subtle);">
          <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${t('Well Model')}:</span>
          <label style="font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="radio" name="custom-model-radio" value="subsea" ${inp.model === 'subsea' ? 'checked' : ''}> ${t('Subsea')}
          </label>
          <label style="font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="radio" name="custom-model-radio" value="riserless" ${inp.model === 'riserless' ? 'checked' : ''}> ${t('Riserless')}
          </label>
        </div>
      ` : ''}

      <!-- Section 1: Well Elevations & Depths -->
      <div class="section-collapse-header" data-section="depths">
        <div class="section-title-wrap">
          <span class="section-title" style="margin:0 !important;">${t('Well Elevations & Depths')} (${depthUnit.toUpperCase()})</span>
          <span class="section-count-chip" id="chip-depths">${countFilled(depthFieldKeys)}/${depthFieldKeys.length}</span>
        </div>
        <svg class="section-chevron ${collapsed.depths ? 'collapsed' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="section-collapse-body ${collapsed.depths ? 'collapsed' : ''}" id="sec-body-depths">
        <div class="cement-well-data-grid">
          ${renderInputField('Air Gap', 'air_gap', formatDepthDisplay(inp.air_gap), depthUnit.toUpperCase(), errors['air_gap'])}
          ${renderInputField('Water Depth', 'water_depth', formatDepthDisplay(inp.water_depth), depthUnit.toUpperCase(), errors['water_depth'])}
          ${isSubsea ? renderInputField('Casing Hanger', 'hanger', formatDepthDisplay(inp.hanger), depthUnit.toUpperCase(), errors['hanger']) : ''}
          ${renderInputField('Previous Shoe', 'prev_shoe', formatDepthDisplay(inp.prev_shoe), depthUnit.toUpperCase(), errors['prev_shoe'])}
          ${renderInputField('Casing Shoe', 'shoe', formatDepthDisplay(inp.shoe), depthUnit.toUpperCase(), errors['shoe'])}
          ${renderInputField('Shoe Track Length', 'shoe_track_len', formatDepthDisplay(inp.shoe_track_len), depthUnit.toUpperCase(), errors['shoe_track_len'])}
          ${renderInputField('Hole Depth (MD)', 'td', formatDepthDisplay(inp.td), depthUnit.toUpperCase(), errors['td'])}
        </div>
      </div>

      <!-- Section 2: Fluids & Slurries -->
      <div class="section-collapse-header" data-section="fluids">
        <div class="section-title-wrap">
          <span class="section-title" style="margin:0 !important;">${t('Fluids & Slurries')}</span>
          <span class="section-count-chip" id="chip-fluids">${countFilled(fluidFieldKeys)}/${fluidFieldKeys.length}</span>
        </div>
        <svg class="section-chevron ${collapsed.fluids ? 'collapsed' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="section-collapse-body ${collapsed.fluids ? 'collapsed' : ''}" id="sec-body-fluids">
        <div class="cement-well-data-grid">
          ${isSubsea ? `
            ${renderInputField('Mud Weight', 'mw', formatWellDataInputVal('mw', inp.mw), mwUnit, errors['mw'])}
            <div></div>
          ` : `
            ${renderInputField('Seawater MW', 'seawater_mw', formatWellDataInputVal('seawater_mw', inp.seawater_mw), mwUnit, errors['seawater_mw'])}
            ${renderInputField('Hole Fluid MW', 'hole_fluid_mw', formatWellDataInputVal('hole_fluid_mw', inp.hole_fluid_mw), mwUnit, errors['hole_fluid_mw'])}
            ${renderInputField('Displacement Fluid MW', 'disp_mw', formatWellDataInputVal('disp_mw', inp.disp_mw), mwUnit, errors['disp_mw'])}
            <div></div>
          `}
          ${renderInputField('1st Mud Vol', 'f1_vol', formatWellDataInputVal('f1_vol', inp.f1_vol), volUnit, errors['f1_vol'])}
          ${renderInputField('1st Mud MW', 'f1_mw', formatWellDataInputVal('f1_mw', inp.f1_mw), mwUnit, errors['f1_mw'])}
          ${renderInputField('2nd Mud Vol', 'f2_vol', formatWellDataInputVal('f2_vol', inp.f2_vol), volUnit, errors['f2_vol'])}
          ${renderInputField('2nd Mud MW', 'f2_mw', formatWellDataInputVal('f2_mw', inp.f2_mw), mwUnit, errors['f2_mw'])}
          ${renderInputField('Spacer Vol', 'sp_vol', formatWellDataInputVal('sp_vol', inp.sp_vol), volUnit, errors['sp_vol'])}
          ${renderInputField('Spacer MW', 'sp_mw', formatWellDataInputVal('sp_mw', inp.sp_mw), mwUnit, errors['sp_mw'])}
          ${renderInputField('Lead Slurry Vol', 'lead_vol', formatWellDataInputVal('lead_vol', inp.lead_vol), volUnit, errors['lead_vol'])}
          ${renderInputField('Lead Slurry MW', 'lead_mw', formatWellDataInputVal('lead_mw', inp.lead_mw), mwUnit, errors['lead_mw'])}
          ${renderInputField('Tail Slurry Vol', 'tail_vol', formatWellDataInputVal('tail_vol', inp.tail_vol), volUnit, errors['tail_vol'])}
          ${renderInputField('Tail Slurry MW', 'tail_mw', formatWellDataInputVal('tail_mw', inp.tail_mw), mwUnit, errors['tail_mw'])}

          ${errors['slurry_pair'] ? `
            <div id="cement-slurry-pair-error" class="cement-slurry-pair-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>${escapeAttr(t(errors['slurry_pair']))}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Section 3: Pumping & Mechanical Limits -->
      <div class="section-collapse-header" data-section="limits">
        <div class="section-title-wrap">
          <span class="section-title" style="margin:0 !important;">${t('Pumping & Mechanical Limits')}</span>
          <span class="section-count-chip" id="chip-limits">${countFilled(limitFieldKeys)}/${limitFieldKeys.length}</span>
        </div>
        <svg class="section-chevron ${collapsed.limits ? 'collapsed' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="section-collapse-body ${collapsed.limits ? 'collapsed' : ''}" id="sec-body-limits">
        <div class="cement-well-data-grid">
          ${renderInputField('Open Hole Excess', 'excess_pct', inp.excess_pct, '%', errors['excess_pct'])}
          ${renderInputField('Pump Output', 'pump_output', formatWellDataInputVal('pump_output', inp.pump_output), pumpUnitLabel, errors['pump_output'])}
          ${renderInputField('LOT at Prev Shoe', 'lot', formatWellDataInputVal('lot', inp.lot), mwUnit, errors['lot'])}
          ${renderInputField('Collapse Rating', 'collapse_rating', formatWellDataInputVal('collapse_rating', inp.collapse_rating), pressUnit, errors['collapse_rating'])}
          ${renderInputField('Burst Rating', 'burst_rating', formatWellDataInputVal('burst_rating', inp.burst_rating), pressUnit, errors['burst_rating'])}
          ${isSubsea ? renderInputField('Float Bump Over', 'bump', formatWellDataInputVal('bump', inp.bump), pressUnit, errors['bump'], true) : renderInputField('Max Pump Pressure', 'max_pump_pressure', formatWellDataInputVal('max_pump_pressure', inp.max_pump_pressure), pressUnit, errors['max_pump_pressure'], true)}
        </div>
      </div>

      <!-- Inline Result Button -->
      <div class="cement-submit-wrap cement-sticky-submit-wrap">
        <button class="btn btn-primary" id="btn-go-to-results" type="button">
          ${t('Result')}
        </button>
      </div>
    `;
    container.appendChild(inputsCard);

    // Collapsible Section Click Handlers
    inputsCard.querySelectorAll('.section-collapse-header').forEach(hdr => {
      hdr.onclick = () => {
        const sec = hdr.getAttribute('data-section');
        collapsed[sec] = !collapsed[sec];
        const bodyEl = inputsCard.querySelector(`#sec-body-${sec}`);
        const chevronEl = hdr.querySelector('.section-chevron');
        if (bodyEl) bodyEl.classList.toggle('collapsed', collapsed[sec]);
        if (chevronEl) chevronEl.classList.toggle('collapsed', collapsed[sec]);
      };
    });

    // Copy from previous job handler
    const copyBtn = inputsCard.querySelector('#btn-copy-from-previous-job');
    if (copyBtn) {
      copyBtn.onclick = () => openCopyFromPreviousJobModal();
    }

    // Custom Model Radio Handlers
    if (cementingState.section === 'custom') {
      inputsCard.querySelectorAll('input[name="custom-model-radio"]').forEach(r => {
        r.onchange = (e) => {
          inp.model = e.target.value;
          renderCementingScreen();
        };
      });
    }

    // Update count chip labels dynamically on typing
    const refreshChips = () => {
      const chipD = inputsCard.querySelector('#chip-depths');
      const chipF = inputsCard.querySelector('#chip-fluids');
      const chipL = inputsCard.querySelector('#chip-limits');
      if (chipD) chipD.textContent = `${countFilled(depthFieldKeys)}/${depthFieldKeys.length}`;
      if (chipF) chipF.textContent = `${countFilled(fluidFieldKeys)}/${fluidFieldKeys.length}`;
      if (chipL) chipL.textContent = `${countFilled(limitFieldKeys)}/${limitFieldKeys.length}`;
    };

    // Get all form inputs for keyboard navigation
    const allFormInputs = Array.from(inputsCard.querySelectorAll('input.form-input[data-key]'));

    allFormInputs.forEach((input, index) => {
      const key = input.getAttribute('data-key');

      // 1. Select existing value on focus
      input.addEventListener('focus', () => {
        setTimeout(() => {
          try { input.select(); } catch (_) {}
        }, 10);
        // Clear field error on focus
        input.classList.remove('has-error');
        const errEl = input.parentElement.querySelector('.cement-field-error');
        if (errEl) errEl.style.display = 'none';
        if (key === 'lead_vol' || key === 'tail_vol') {
          const slurryErr = inputsCard.querySelector('#cement-slurry-pair-error');
          if (slurryErr) slurryErr.style.display = 'none';
        }
      });

      // 2. Normalise "," to "." and clear errors on input
      input.addEventListener('input', () => {
        if (input.value.includes(',')) {
          const start = input.selectionStart;
          input.value = input.value.replace(/,/g, '.');
          try { input.setSelectionRange(start, start); } catch (_) {}
        }

        // Clear error visually
        input.classList.remove('has-error');
        const errEl = input.parentElement.querySelector('.cement-field-error');
        if (errEl) errEl.style.display = 'none';
        if (key === 'lead_vol' || key === 'tail_vol') {
          const slurryErr = inputsCard.querySelector('#cement-slurry-pair-error');
          if (slurryErr) slurryErr.style.display = 'none';
        }

        // Store value in inp
        const rawVal = input.value.trim();
        if (rawVal === '') {
          inp[key] = '';
        } else {
          inp[key] = parseWellDataInputVal(key, rawVal);
        }
        refreshChips();
        saveWellDataDraft();
      });

      // 3. Enter key navigation: next field, or trigger submit on last
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (index < allFormInputs.length - 1) {
            const nextInput = allFormInputs[index + 1];
            // Ensure next input's parent section is expanded
            const parentSec = nextInput.closest('.section-collapse-body');
            if (parentSec && parentSec.classList.contains('collapsed')) {
              parentSec.classList.remove('collapsed');
              const secId = parentSec.id.replace('sec-body-', '');
              collapsed[secId] = false;
              const chevron = inputsCard.querySelector(`.section-collapse-header[data-section="${secId}"] .section-chevron`);
              if (chevron) chevron.classList.remove('collapsed');
            }
            nextInput.focus();
            setTimeout(() => { try { nextInput.select(); } catch (_) {} }, 10);
          } else {
            const resBtn = inputsCard.querySelector('#btn-go-to-results');
            if (resBtn) resBtn.click();
          }
        }
      });

      // 4. Change event: persist draft
      input.addEventListener('change', () => {
        saveWellDataDraft();
      });
    });

    // Bottom [ Result ] Button Submit Action
    const resultBtn = inputsCard.querySelector('#btn-go-to-results');
    resultBtn.onclick = () => {
      cementingState.wellDataSubmitted = true;
      const freshErrors = getWellDataErrors(inp);
      const errKeys = Object.keys(freshErrors);

      if (errKeys.length > 0) {
        // Expand any collapsed section that contains an error
        errKeys.forEach(k => {
          if (depthFieldKeys.includes(k)) collapsed.depths = false;
          if (fluidFieldKeys.includes(k) || k === 'slurry_pair') collapsed.fluids = false;
          if (limitFieldKeys.includes(k)) collapsed.limits = false;
        });

        // Re-render form so error classes and expanded sections display
        renderWellDataStep(container);

        // Smoothly scroll to the first invalid field and focus it
        setTimeout(() => {
          const firstInvalid = container.querySelector('.form-input.has-error')
            || (freshErrors['slurry_pair'] ? container.querySelector('[data-key="lead_vol"]') : null);
          if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              try { firstInvalid.focus(); firstInvalid.select(); } catch (_) {}
            }, 180);
          }
        }, 50);
        return;
      }

      // No errors: calculate and route to Results step
      const engineInput = getEngineInputs();
      try {
        let result;
        if (inp.model === 'riserless') {
          result = CementingEngine.calcRiserless(engineInput);
        } else {
          result = CementingEngine.calcSubsea(engineInput);
        }
        cementingState.results = result;
        cementingState.engineInput = engineInput;
        cementingState.view = 'results';
        renderCementingScreen();
      } catch (err) {
        console.error('Cementing calculation error:', err);
        if (typeof showToast === 'function') showToast('Calculation error: ' + err.message);
      }
    };
  }

  /**
   * Interactive Schematic Viewer Controller (Zoom 1.0x–3.0x, Pan, Pinch, Wheel, Reset)
   * With Priority Panning & Smooth Handoff to Outer Page Scroll at Top & Bottom Limits
   */
  function createSchematicViewer(viewportEl, canvasEl, controls) {
    if (!viewportEl || !canvasEl) return null;
    let scale = 1.0;
    let panX = 0;
    let panY = 0;
    const isModal = Boolean(viewportEl.closest('.schematic-fs-overlay'));

    const MIN_SCALE = 1.0;
    const MAX_SCALE = 3.0;

    function getPanBounds() {
      if (scale <= 1.001) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      }
      const vpW = viewportEl.clientWidth || 360;
      const vpH = viewportEl.clientHeight || 520;
      const cvW = canvasEl.offsetWidth || vpW;
      const cvH = canvasEl.offsetHeight || vpH;

      // Top limit (RKB 0 in view):
      const maxPanY = Math.max(0, (cvH * scale - vpH) / 2 + 16);
      // Bottom limit (TD in view):
      const minPanY = -maxPanY;

      // Left & right bounds:
      const maxPanX = Math.max(0, (cvW * scale - vpW) / 2 + 20);
      const minPanX = -maxPanX;

      return { minX: minPanX, maxX: maxPanX, minY: minPanY, maxY: maxPanY };
    }

    function applyTransform(smooth) {
      canvasEl.style.transition = smooth ? 'transform 0.18s ease-out' : 'none';
      canvasEl.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      updateUI();
    }

    function clampPan() {
      const bounds = getPanBounds();
      panX = Math.max(bounds.minX, Math.min(bounds.maxX, panX));
      panY = Math.max(bounds.minY, Math.min(bounds.maxY, panY));
    }

    function setZoom(newScale, smooth = true) {
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(newScale * 100) / 100));
      clampPan();
      applyTransform(smooth);
    }

    function reset() {
      scale = 1.0;
      panX = 0;
      panY = 0;
      applyTransform(true);
    }

    function updateUI() {
      const pct = Math.round(scale * 100);
      if (controls && controls.resetBtn) {
        controls.resetBtn.textContent = `${pct}%`;
        if (pct === 100 && panX === 0 && panY === 0) {
          controls.resetBtn.classList.remove('active');
        } else {
          controls.resetBtn.classList.add('active');
        }
      }
      if (controls && controls.zoomOutBtn) {
        controls.zoomOutBtn.disabled = (pct <= 100);
      }
      if (controls && controls.zoomInBtn) {
        controls.zoomInBtn.disabled = (pct >= 300);
      }
    }

    if (controls) {
      if (controls.zoomOutBtn) {
        controls.zoomOutBtn.onclick = (e) => {
          e.stopPropagation();
          setZoom(scale - 0.25, true);
        };
      }
      if (controls.zoomInBtn) {
        controls.zoomInBtn.onclick = (e) => {
          e.stopPropagation();
          setZoom(scale + 0.25, true);
        };
      }
      if (controls.resetBtn) {
        controls.resetBtn.onclick = (e) => {
          e.stopPropagation();
          reset();
        };
      }
    }

    // Touch interaction with seamless outer page scroll handoff
    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isTouching = false;
    let isPinching = false;
    let initialPinchDist = 0;
    let initialPinchScale = 1.0;
    let touchMode = null; // 'pan' | 'page-scroll' | 'pinch'
    let lastTapTime = 0;

    viewportEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        touchMode = 'pinch';
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        initialPinchScale = scale;
        canvasEl.style.transition = 'none';
        e.preventDefault();
        return;
      }

      if (e.touches.length === 1) {
        isPinching = false;
        isTouching = true;
        touchMode = null;
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
        canvasEl.style.transition = 'none';

        // Double-tap detection
        const now = Date.now();
        if (now - lastTapTime < 300) {
          if (scale > 1.05 || panX !== 0 || panY !== 0) {
            reset();
          } else {
            setZoom(1.75, true);
          }
          lastTapTime = 0;
          e.preventDefault();
          return;
        }
        lastTapTime = now;
      }
    }, { passive: false });

    viewportEl.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (initialPinchDist > 0) {
          const factor = dist / initialPinchDist;
          setZoom(initialPinchScale * factor, false);
        }
        return;
      }

      if (!isTouching || e.touches.length !== 1) return;

      const t = e.touches[0];
      const currentX = t.clientX;
      const currentY = t.clientY;
      const dx = currentX - lastTouchX;
      const dy = currentY - lastTouchY;
      lastTouchX = currentX;
      lastTouchY = currentY;

      // At 100% Zoom: pass straight through to native outer page scroll
      if (scale <= 1.001) {
        return;
      }

      // When zoomed in (> 100%):
      const bounds = getPanBounds();

      if (!touchMode) {
        const totalAbsX = Math.abs(currentX - touchStartX);
        const totalAbsY = Math.abs(currentY - touchStartY);

        if (totalAbsY >= totalAbsX) {
          // Vertical gesture
          if (!isModal && dy > 0 && panY >= bounds.maxY - 1) {
            touchMode = 'page-scroll';
            window.scrollBy({ top: -dy, behavior: 'auto' });
            return;
          } else if (!isModal && dy < 0 && panY <= bounds.minY + 1) {
            touchMode = 'page-scroll';
            window.scrollBy({ top: -dy, behavior: 'auto' });
            return;
          } else {
            touchMode = 'pan';
          }
        } else {
          touchMode = 'pan';
        }
      }

      if (touchMode === 'page-scroll') {
        if (!isModal) {
          window.scrollBy({ top: -dy, behavior: 'auto' });
        }
        return;
      }

      // Priority Panning Inside Schematic First
      e.preventDefault();

      // 1. Horizontal pan:
      if (bounds.maxX > bounds.minX) {
        panX = Math.max(bounds.minX, Math.min(bounds.maxX, panX + dx));
      }

      // 2. Vertical pan with smooth handoff to outer page scroll at limits:
      if (dy > 0) {
        // Dragging DOWN (revealing upper sections towards RKB)
        if (panY < bounds.maxY) {
          const newPanY = Math.min(bounds.maxY, panY + dy);
          const consumed = newPanY - panY;
          panY = newPanY;
          const excess = dy - consumed;
          if (excess > 0 && !isModal) {
            window.scrollBy({ top: -excess, behavior: 'auto' });
          }
        } else if (!isModal) {
          window.scrollBy({ top: -dy, behavior: 'auto' });
        }
      } else if (dy < 0) {
        // Dragging UP (revealing lower sections towards TD)
        if (panY > bounds.minY) {
          const newPanY = Math.max(bounds.minY, panY + dy);
          const consumed = newPanY - panY;
          panY = newPanY;
          const excess = dy - consumed; // excess is negative
          if (excess < 0 && !isModal) {
            window.scrollBy({ top: -excess, behavior: 'auto' });
          }
        } else if (!isModal) {
          window.scrollBy({ top: -dy, behavior: 'auto' });
        }
      }

      applyTransform(false);
    }, { passive: false });

    function endTouch() {
      isTouching = false;
      isPinching = false;
      touchMode = null;
      clampPan();
      applyTransform(true);
    }
    viewportEl.addEventListener('touchend', endTouch);
    viewportEl.addEventListener('touchcancel', endTouch);

    // Mouse drag support for desktop
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    viewportEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || scale <= 1.001) return;
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvasEl.style.transition = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown || scale <= 1.001) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      const bounds = getPanBounds();
      panX = Math.max(bounds.minX, Math.min(bounds.maxX, panX + dx));

      if (dy > 0) {
        if (panY < bounds.maxY) {
          const newPanY = Math.min(bounds.maxY, panY + dy);
          const consumed = newPanY - panY;
          panY = newPanY;
          const excess = dy - consumed;
          if (excess > 0 && !isModal) window.scrollBy(0, -excess);
        } else if (!isModal) {
          window.scrollBy(0, -dy);
        }
      } else if (dy < 0) {
        if (panY > bounds.minY) {
          const newPanY = Math.max(bounds.minY, panY + dy);
          const consumed = newPanY - panY;
          panY = newPanY;
          const excess = dy - consumed;
          if (excess < 0 && !isModal) window.scrollBy(0, -excess);
        } else if (!isModal) {
          window.scrollBy(0, -dy);
        }
      }
      applyTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        clampPan();
        applyTransform(true);
      }
    });

    // Wheel support
    viewportEl.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
        setZoom(scale * zoomFactor, true);
        return;
      }

      if (scale <= 1.001) {
        return; // Allow page scroll
      }

      const dy = -e.deltaY;
      const bounds = getPanBounds();
      if (dy > 0 && panY >= bounds.maxY - 1) return;
      if (dy < 0 && panY <= bounds.minY + 1) return;

      e.preventDefault();
      if (dy > 0) {
        panY = Math.min(bounds.maxY, panY + dy);
      } else {
        panY = Math.max(bounds.minY, panY + dy);
      }
      applyTransform(false);
    }, { passive: false });

    applyTransform(false);
    return { setZoom, reset, updateUI, getPanBounds, getPanY: () => panY, getScale: () => scale };
  }

  function openSchematicFullscreenModal(svgMarkup, titleText, subtitleText) {
    const modal = document.getElementById('schematic-fullscreen-modal');
    if (!modal) return;
    const titleEl = document.getElementById('schematic-fs-title');
    const subtitleEl = document.getElementById('schematic-fs-subtitle');
    const canvasEl = document.getElementById('schematic-fs-canvas');
    const viewportEl = document.getElementById('schematic-fs-viewport');

    if (titleEl) titleEl.textContent = titleText || 'Well Cementing Schematic';
    if (subtitleEl) subtitleEl.textContent = subtitleText || 'Floater Rig · Schematic Profile';
    if (canvasEl) {
      canvasEl.innerHTML = svgMarkup;
    }

    const fsControls = {
      zoomOutBtn: document.getElementById('btn-fs-zoom-out'),
      resetBtn: document.getElementById('btn-fs-zoom-reset'),
      zoomInBtn: document.getElementById('btn-fs-zoom-in')
    };

    createSchematicViewer(viewportEl, canvasEl, fsControls);

    const closeBtn = document.getElementById('btn-close-schematic-fs');
    if (closeBtn) {
      closeBtn.onclick = () => closeSchematicFullscreenModal();
    }

    bindSchematicLayerClicks(modal);

    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function closeSchematicFullscreenModal() {
    const modal = document.getElementById('schematic-fullscreen-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('active');
    const canvasEl = document.getElementById('schematic-fs-canvas');
    if (canvasEl) canvasEl.innerHTML = '';
  }

  /**
   * Helper to localize dynamic check messages from cementing engine
   */
  function formatCementingCheckMessage(msg) {
    if (!msg) return '';
    if (typeof t === 'function') {
      const direct = t(msg);
      if (direct !== msg) return direct;
    }
    let m;
    m = msg.match(/^OK [–-] No slurry pumped$/);
    if (m) return t('OK – No slurry pumped');
    m = msg.match(/^OK [–-] No slurry volume entered$/);
    if (m) return t('OK – No slurry volume entered');
    m = msg.match(/^OK [–-] No tail slurry \(single-slurry job\)$/);
    if (m) return t('OK – No tail slurry (single-slurry job)');
    m = msg.match(/^CHECK [–-] Tail slurry does not clear shoe into annulus \(fills rathole\/shoe track only\)$/);
    if (m) return t('CHECK – Tail slurry does not clear shoe into annulus (fills rathole/shoe track only)');
    m = msg.match(/^CHECK [–-] Tail slurry does not clear shoe into annulus$/);
    if (m) return t('CHECK – Tail slurry does not clear shoe into annulus');
    m = msg.match(/^OK [–-] No net collapse differential load at shoe$/);
    if (m) return t('OK – No net collapse differential load at shoe');
    m = msg.match(/^OK [–-] No burst limit specified$/);
    if (m) return t('OK – No burst limit specified');

    m = msg.match(/^OK [–-] Cement top \(([\d.]+) ft\) is below subsea wellhead \(([\d.]+) ft\)$/);
    if (m) {
      return t('OK – Cement top ({0} ft) is below subsea wellhead ({1} ft)')
        .replace('{0}', m[1]).replace('{1}', m[2]);
    }
    m = msg.match(/^CHECK [–-] Cement entered marine riser! \(([\d.]+) ft in riser\)$/);
    if (m) {
      return t('CHECK – Cement entered marine riser! ({0} ft in riser)')
        .replace('{0}', m[1]);
    }
    m = msg.match(/^CHECK [–-] Slurry volume \(([\d.]+) bbl\) does not fill shoe track & rathole \(([\d.]+) bbl\)$/);
    if (m) {
      return t('CHECK – Slurry volume ({0} bbl) does not fill shoe track & rathole ({1} bbl)')
        .replace('{0}', m[1]).replace('{1}', m[2]);
    }
    m = msg.match(/^OK [–-] Tail slurry placed ([\d.]+) ft into annulus$/);
    if (m) {
      return t('OK – Tail slurry placed {0} ft into annulus')
        .replace('{0}', m[1]);
    }
    m = msg.match(/^OK [–-] LOT margin at (prev|30") shoe is \+([\d.]+) ppg \(EMW ([\d.-]+) vs LOT ([\d.]+)\)$/);
    if (m) {
      return t('OK – LOT margin at {0} shoe is +{1} ppg (EMW {2} vs LOT {3})')
        .replace('{0}', m[1]).replace('{1}', m[2]).replace('{2}', m[3]).replace('{3}', m[4]);
    }
    m = msg.match(/^CHECK [–-] EMW at (prev|30") shoe \(([\d.-]+) ppg\) exceeds LOT \(([\d.]+) ppg\) by ([\d.]+) ppg! Loss risk\.$/);
    if (m) {
      return t('CHECK – EMW at {0} shoe ({1} ppg) exceeds LOT ({2} ppg) by {3} ppg! Loss risk.')
        .replace('{0}', m[1]).replace('{1}', m[2]).replace('{2}', m[3]).replace('{3}', m[4]);
    }
    m = msg.match(/^OK [–-] Collapse safety factor is ([\d.]+) \(≥ 1\.10\)$/);
    if (m) {
      return t('OK – Collapse safety factor is {0} (≥ 1.10)')
        .replace('{0}', m[1]);
    }
    m = msg.match(/^CHECK [–-] Collapse safety factor is ([\d.]+) \(< 1\.10 design limit\)$/);
    if (m) {
      return t('CHECK – Collapse safety factor is {0} (< 1.10 design limit)')
        .replace('{0}', m[1]);
    }
    m = msg.match(/^OK [–-] Bump pressure ([\d.]+) psi ≤ 80% burst limit \(([\d.]+) psi\)$/);
    if (m) {
      return t('OK – Bump pressure {0} psi ≤ 80% burst limit ({1} psi)')
        .replace('{0}', m[1]).replace('{1}', m[2]);
    }
    m = msg.match(/^CHECK [–-] Bump pressure ([\d.]+) psi exceeds 80% burst limit \(([\d.]+) psi\)$/);
    if (m) {
      return t('CHECK – Bump pressure {0} psi exceeds 80% burst limit ({1} psi)')
        .replace('{0}', m[1]).replace('{1}', m[2]);
    }
    m = msg.match(/^OK [–-] Max pump pressure ([\d.]+) psi ≤ 80% burst limit \(([\d.]+) psi\)$/);
    if (m) {
      return t('OK – Max pump pressure {0} psi ≤ 80% burst limit ({1} psi)')
        .replace('{0}', m[1]).replace('{1}', m[2]);
    }
    m = msg.match(/^CHECK [–-] Max pump pressure ([\d.]+) psi exceeds 80% burst limit \(([\d.]+) psi\)$/);
    if (m) {
      return t('CHECK – Max pump pressure {0} psi exceeds 80% burst limit ({1} psi)')
        .replace('{0}', m[1]).replace('{1}', m[2]);
    }
    m = msg.match(/^OK [–-] Cement returns observed at seabed \(([\d.]+) bbl excess returned\)$/);
    if (m) {
      return t('OK – Cement returns observed at seabed ({0} bbl excess returned)')
        .replace('{0}', m[1]);
    }
    m = msg.match(/^CHECK [–-] No cement returns to seabed! TOC is ([\d.]+) ft below mudline\.$/);
    if (m) {
      return t('CHECK – No cement returns to seabed! TOC is {0} ft below mudline.')
        .replace('{0}', m[1]);
    }
    return typeof t === 'function' ? t(msg) : msg;
  }

  /**
   * STEP 4: Render Results Screen
   * Shows Results Summary Echo + Output Cards + Schematic + [ Save Job ] + [ Edit Well Data ]
   */
  function renderResultsStep(container) {
    if (!container) return;
    container.innerHTML = '';
    const inp = cementingState.inputs;
    const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
    const unit = cementingState.unit;
    const isMetric = unit === 'm';
    const depthUnit = isMetric ? 'm' : 'ft';
    const engineInput = getEngineInputs();
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';
    const fmtV = (v) => (window.CementingCommon && window.CementingCommon.formatVol) ? window.CementingCommon.formatVol(v) : { val: Number(v || 0).toFixed(1), unit: 'bbl', full: Number(v || 0).toFixed(1) + ' bbl' };
    const fmtMW = (v) => (window.CementingCommon && window.CementingCommon.formatDensity) ? window.CementingCommon.formatDensity(v) : { val: Number(v || 0).toFixed(2), unit: 'ppg', full: Number(v || 0).toFixed(2) + ' ppg' };
    const fmtP = (v) => (window.CementingCommon && window.CementingCommon.formatPressure) ? window.CementingCommon.formatPressure(v) : { val: Number(v || 0).toFixed(0), unit: 'psi', full: Number(v || 0).toFixed(0) + ' psi' };
    const volUnit = fmtV(0).unit;
    const mwUnit = fmtMW(0).unit;
    const pressUnit = fmtP(0).unit;

    // Ensure results are computed
    if (!cementingState.results) {
      try {
        if (inp.model === 'riserless') {
          cementingState.results = CementingEngine.calcRiserless(engineInput);
        } else {
          cementingState.results = CementingEngine.calcSubsea(engineInput);
        }
        cementingState.engineInput = engineInput;
      } catch (err) {
        console.error('Cementing calculation error:', err);
        container.innerHTML = `<div class="content-card" style="color:#EF4444;">Calculation error: ${err.message}</div>`;
        return;
      }
    }
    const result = cementingState.results;

    // 1. Top Header Bar (Read-Only, mounted in fixed header slot)
    const headerSlot = document.getElementById('cementing-job-header-slot') || container;
    headerSlot.innerHTML = '';
    renderReadOnlyJobHeaderBar(headerSlot);

    // Results animated container
    const resultsWrapper = document.createElement('div');
    resultsWrapper.className = 'cement-view-animate';

    // 2. Results Echo Strip
    const echoStrip = document.createElement('div');
    echoStrip.className = 'cement-results-summary-strip';
    echoStrip.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">${t('Job Summary')}</span>
        <span class="cement-badge-model ${inp.model === 'riserless' ? 'cement-badge-riserless' : 'cement-badge-subsea'}">${inp.model.toUpperCase()}</span>
      </div>
      <div class="cement-summary-grid">
        <div>
          <div class="cement-summary-cell-title">${t('Job Name')}</div>
          <div class="cement-summary-cell-val">${escapeAttr(inp.name || cementingState.jobName || preset.label)}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('Section')}</div>
          <div class="cement-summary-cell-val">${t(preset.label)}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('Shoe Depth')}</div>
          <div class="cement-summary-cell-val">${formatDepthDisplay(inp.shoe)} ${depthUnit.toUpperCase()}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('Total Slurry')}</div>
          <div class="cement-summary-cell-val">${fmtV(result.total_slurry).full}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('Total Pumped')}</div>
          <div class="cement-summary-cell-val">${fmtV(result.total_pumped).full}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('EMW at Shoe')}</div>
          <div class="cement-summary-cell-val">${fmtMW(result.emw_shoe).full}</div>
        </div>
      </div>
    `;
    resultsWrapper.appendChild(echoStrip);

    // 3. Output Cards
    // Card 1: Placement & Cement Rise
    const placeCard = document.createElement('div');
    placeCard.className = `cement-accordion ${cementingState.collapsed.placement ? '' : 'open'}`;
    placeCard.innerHTML = `
      <div class="cement-accordion-header" onclick="window.toggleCementingCard(this, 'placement')">
        <span class="cement-accordion-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          ${t('Placement & Cement Rise')}
        </span>
        <span class="cement-chevron">▼</span>
      </div>
      <div class="cement-accordion-body">
        <div class="cement-metrics-grid">
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Top of Cement (TOC)')}</div>
            <div class="cement-metric-val">${formatMetricDepth(result.toc, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Tail Slurry Top')}</div>
            <div class="cement-metric-val">${formatMetricDepth(result.tail_top, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Spacer Top')}</div>
            <div class="cement-metric-val">${formatMetricDepth(result.sp_top, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Total Slurry Vol')}</div>
            <div class="cement-metric-val">${fmtV(result.total_slurry || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
          </div>
        </div>

        ${inp.model === 'subsea' ? `
          <div class="cement-metrics-grid">
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Cement in Riser')}</div>
              <div class="cement-metric-val" style="color:${(result.cement_in_riser || 0) > 0 ? '#EF4444' : 'inherit'};">
                ${formatMetricDist(result.cement_in_riser || 0, isMetric)}<span class="cement-metric-unit">${depthUnit}</span>
              </div>
            </div>
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Returns at Surface')}</div>
              <div class="cement-metric-val">${fmtV(result.returns_surface || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
          </div>
        ` : `
          <div class="cement-metrics-grid">
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('TOC Below Mudline')}</div>
              <div class="cement-metric-val">${formatMetricDist(result.toc_below_mudline || 0, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
            </div>
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Cement Returns at Seabed')}</div>
              <div class="cement-metric-val" style="color:${(result.cement_returns_seabed || 0) > 0 ? '#15803D' : '#B45309'};">
                ${fmtV(result.cement_returns_seabed || 0).val}<span class="cement-metric-unit">${volUnit}</span>
              </div>
            </div>
          </div>
        `}

        <!-- Rise Table: Systematic Arrangement -->
        <div class="cement-systematic-table-wrap">
          <table class="cement-systematic-table">
            <thead>
              <tr>
                <th style="width: 40%; text-align: left;">${t('Interval')}</th>
                <th style="width: 30%; text-align: right;">${t('Volume')}</th>
                <th style="width: 30%; text-align: right;">${t('Rise Height')}</th>
              </tr>
            </thead>
            <tbody>
              ${Number(inp.tail_vol || 0) > 0 || (result.rise_tail || 0) > 0 ? `
                <tr>
                  <td class="col-name">${t('Tail Slurry')}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(inp.tail_vol || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">${formatMetricDist(result.rise_tail || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
                </tr>
              ` : `
                <tr class="row-muted">
                  <td class="col-name">${t('Tail Slurry')}</td>
                  <td class="col-num"><span class="cement-table-num">0.0</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">0.0</span> <span class="cement-table-unit">${depthUnit}</span></td>
                </tr>
              `}
              <tr>
                <td class="col-name">${t('Lead Slurry')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtV(inp.lead_vol || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${formatMetricDist(result.rise_lead || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
              </tr>
              <tr>
                <td class="col-name">${t('Spacer')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtV(inp.sp_vol || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${formatMetricDist(result.rise_sp || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
              </tr>
              ${Number(inp.f2_vol || 0) > 0 ? `
                <tr>
                  <td class="col-name">${t('2nd Mud Wash')}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(inp.f2_vol).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">${formatMetricDist(result.rise_f2 || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
                </tr>
              ` : ''}
              ${Number(inp.f1_vol || 0) > 0 ? `
                <tr>
                  <td class="col-name">${t('1st Mud Wash')}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(inp.f1_vol).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">${formatMetricDist(result.rise_f1 || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="cement-table-total-row">
                <td class="col-name">${t('Total Cement Rise')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtV(result.total_slurry || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num cement-val-highlight"><span class="cement-table-num">${formatMetricDist(result.rise_tot || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    resultsWrapper.appendChild(placeCard);

    // Card 2: Displacement & Pumping Sequence
    const pumpCard = document.createElement('div');
    pumpCard.className = `cement-accordion ${cementingState.collapsed.displacement ? '' : 'open'}`;
    pumpCard.innerHTML = `
      <div class="cement-accordion-header" onclick="window.toggleCementingCard(this, 'displacement')">
        <span class="cement-accordion-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${t('Displacement & Pumping Sequence')}
        </span>
        <span class="cement-chevron">▼</span>
      </div>
      <div class="cement-accordion-body">
        <div class="cement-systematic-table-wrap">
          <table class="cement-systematic-table">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">#</th>
                <th style="width: 36%; text-align: left;">${t('Fluid Name')}</th>
                <th style="width: 18%; text-align: right;">${t('Vol')} (${volUnit})</th>
                <th style="width: 18%; text-align: right;">${t('MW')} (${mwUnit})</th>
                <th style="width: 18%; text-align: right;">${t('Strokes')}</th>
              </tr>
            </thead>
            <tbody>
              ${(result.pumping_sequence || []).map(s => `
                <tr>
                  <td class="col-center" style="font-weight:700; color:var(--text-secondary);">${s.step}</td>
                  <td class="col-name">${escapeAttr(t(s.name))}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(s.volume || 0).val}</span></td>
                  <td class="col-num"><span class="cement-table-num">${fmtMW(s.density || 0).val}</span></td>
                  <td class="col-num"><span class="cement-table-num">${Number(inp.pump_output) > 0 ? (s.volume / Number(inp.pump_output)).toFixed(0) : '-'}</span></td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="cement-table-total-row">
                <td class="col-center"></td>
                <td class="col-name">${t('Total Pumped')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtV(result.total_pumped || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
                <td class="col-num cement-val-highlight"><span class="cement-table-num">${Number(inp.pump_output) > 0 ? ((result.total_pumped || 0) / Number(inp.pump_output)).toFixed(0) : '-'}</span> <span class="cement-table-unit">stk</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="cement-metrics-grid" style="margin-top:12px;">
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Total Displacement')}</div>
            <div class="cement-metric-val">${fmtV(result.disp_tot || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Displacement Strokes')}</div>
            <div class="cement-metric-val">${(result.strokes || 0).toFixed(0)}<span class="cement-metric-unit">stk</span></div>
          </div>
          ${inp.model === 'subsea' ? `
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Max Disp No Bump')}</div>
              <div class="cement-metric-val">${fmtV(result.max_disp_no_bump || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Bottom Plug Lands')}</div>
              <div class="cement-metric-val">${fmtV(result.bottom_plug_lands || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
          ` : `
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Shoe Track Vol')}</div>
              <div class="cement-metric-val">${fmtV(result.st_vol || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Rathole Vol')}</div>
              <div class="cement-metric-val">${fmtV(result.rat_vol || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
          `}
        </div>
      </div>
    `;
    resultsWrapper.appendChild(pumpCard);

    // Card 3: Pressures & EMW
    const pressCard = document.createElement('div');
    pressCard.className = `cement-accordion ${cementingState.collapsed.pressures ? '' : 'open'}`;
    pressCard.innerHTML = `
      <div class="cement-accordion-header" onclick="window.toggleCementingCard(this, 'pressures')">
        <span class="cement-accordion-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          ${t('Pressures & EMW')}
        </span>
        <span class="cement-chevron">▼</span>
      </div>
      <div class="cement-accordion-body">
        <div class="cement-metrics-grid">
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Annulus Pressure at FC')}</div>
            <div class="cement-metric-val">${fmtP(result.p_ann_fc || 0).val}<span class="cement-metric-unit">${pressUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Inside Pressure at FC')}</div>
            <div class="cement-metric-val">${fmtP(result.p_in_fc || 0).val}<span class="cement-metric-unit">${pressUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Differential Pressure (FC)')}</div>
            <div class="cement-metric-val" style="color:${(result.diff_press || 0) > 0 ? '#B45309' : '#15803D'};">
              ${fmtP(result.diff_press || 0).val}<span class="cement-metric-unit">${pressUnit}</span>
            </div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Collapse Safety Factor')}</div>
            <div class="cement-metric-val" style="color:${(result.collapse_sf || 0) >= 1.1 ? '#15803D' : '#EF4444'};">
              ${(result.collapse_sf !== undefined && result.collapse_sf !== null) ? result.collapse_sf.toFixed(2) : '-'}
            </div>
          </div>
        </div>

        <div style="padding:10px 12px; background:var(--bg-subtle); border-radius:10px; margin-bottom:12px; font-size:0.75rem; border-left:3px solid ${(result.diff_press || 0) > 0 ? '#F59E0B' : '#22C55E'};">
          <strong>${t('Float Status')}:</strong> ${escapeAttr(t(result.diff_meaning || ''))}
        </div>

        <div class="cement-systematic-table-wrap">
          <table class="cement-systematic-table">
            <thead>
              <tr>
                <th style="width: 34%; text-align: left;">${t('Datum')}</th>
                <th style="width: 22%; text-align: right;">${t('Pressure')} (${pressUnit})</th>
                <th style="width: 22%; text-align: right;">${t('EMW')} (${mwUnit})</th>
                <th style="width: 22%; text-align: right;">${t('LOT / Limit')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="col-name">${t('Float Collar')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtP(result.p_ann_fc || 0).val}</span> <span class="cement-table-unit">${pressUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${fmtMW(result.emw_fc || 0).val}</span> <span class="cement-table-unit">${mwUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
              </tr>
              <tr>
                <td class="col-name">${t('Casing Shoe')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtP(result.p_ann_shoe || 0).val}</span> <span class="cement-table-unit">${pressUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${fmtMW(result.emw_shoe || 0).val}</span> <span class="cement-table-unit">${mwUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
              </tr>
              ${result.emw_prev_shoe !== undefined ? `
                <tr>
                  <td class="col-name">${t('Previous Shoe')}</td>
                  <td class="col-num"><span class="cement-table-num">${result.p_prev_shoe !== undefined ? fmtP(result.p_prev_shoe).val : '-'}</span> <span class="cement-table-unit">${result.p_prev_shoe !== undefined ? pressUnit : ''}</span></td>
                  <td class="col-num"><span class="cement-table-num">${fmtMW(result.emw_prev_shoe).val}</span> <span class="cement-table-unit">${mwUnit}</span></td>
                  <td class="col-num">
                    ${result.lot_margin !== undefined ? `
                      <span class="cement-table-badge ${result.lot_margin >= 0 ? 'badge-ok' : 'badge-alert'}">
                        ${result.lot_margin >= 0 ? '+' : ''}${fmtMW(result.lot_margin).val} ${mwUnit}
                      </span>
                    ` : '<span class="cement-table-dash">-</span>'}
                  </td>
                </tr>
              ` : ''}
              <tr>
                <td class="col-name">${inp.model === 'subsea' ? t('Bump Pressure') : t('Max Pump Press')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtP((inp.model === 'subsea' ? result.bump_pressure : inp.max_pump_pressure) || 0).val}</span> <span class="cement-table-unit">${pressUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
                <td class="col-num"><span class="cement-table-limit-badge" title="80% Casing Burst Limit">≤ ${fmtP(result.burst_limit || 0).val} ${pressUnit}</span></td>
              </tr>
            </tbody>
          </table>
          <div class="cement-table-footnote">
            ${t('* Pressure limit reflects 80% casing burst rating threshold.')}
          </div>
        </div>
      </div>
    `;
    resultsWrapper.appendChild(pressCard);

    // Card 4: Job Validation Checks
    const checkCard = document.createElement('div');
    checkCard.className = `cement-accordion ${cementingState.collapsed.checks ? '' : 'open'}`;
    const checks = result.checks || [];
    const okCount = checks.filter(c => c.status === 'OK').length;
    checkCard.innerHTML = `
      <div class="cement-accordion-header" onclick="window.toggleCementingCard(this, 'checks')">
        <span class="cement-accordion-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          ${t('Job Validation Checks')} (${okCount}/${checks.length})
        </span>
        <span class="cement-chevron">▼</span>
      </div>
      <div class="cement-accordion-body">
        ${checks.map(c => `
          <div class="cement-check-item ${c.status === 'OK' ? 'cement-check-ok' : 'cement-check-alert'}">
            <span class="cement-chip ${c.status === 'OK' ? 'cement-chip-ok' : 'cement-chip-alert'}">${escapeAttr(t(c.status))}</span>
            <div>
              <div style="font-weight:700; margin-bottom:2px;">${escapeAttr(t(c.label || c.name || ''))}</div>
              <div>${escapeAttr(formatCementingCheckMessage(c.message || c.msg || ''))}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    resultsWrapper.appendChild(checkCard);

    // Card 5: Interactive Schematic SVG
    const schematicCard = document.createElement('div');
    const isSchematicOpen = !cementingState.collapsed.schematic;
    schematicCard.className = `cement-accordion ${isSchematicOpen ? 'open' : ''}`;
    schematicCard.id = 'cement-schematic-accordion';
    schematicCard.innerHTML = `
      <div class="cement-accordion-header" id="schematic-header-btn">
        <span class="cement-accordion-title" id="schematic-title-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${isSchematicOpen ? t('Hide Well Cementing Schematic') : t('Show Well Cementing Schematic')}
        </span>
        <span class="cement-chevron">▼</span>
      </div>
      <div class="cement-accordion-body" id="schematic-accordion-body" style="padding:14px 16px;"></div>
    `;
    resultsWrapper.appendChild(schematicCard);

    const schematicHeader = schematicCard.querySelector('#schematic-header-btn');
    const schematicTitle = schematicCard.querySelector('#schematic-title-text');
    const schematicBody = schematicCard.querySelector('#schematic-accordion-body');

    function renderSchematicContent() {
      const sectionName = (inp && inp.name) || cementingState.jobName || (preset && preset.name) || 'Well Cementing Schematic';
      const modelLabel = (inp && inp.model === 'riserless') ? 'Riserless Profile' : 'Subsea Riser Profile';
      const svgMarkup = renderWellCementingSchematic(result, engineInput, unit);
      const legendMarkup = (window.CementingCommon && typeof window.CementingCommon.renderFluidLegendHtml === 'function')
        ? window.CementingCommon.renderFluidLegendHtml(engineInput, result, false)
        : (typeof renderFluidLegendHtml === 'function' ? renderFluidLegendHtml(engineInput, result, false) : '');

      schematicBody.innerHTML = `
        <div class="schematic-toolbar-header">
          <span class="schematic-helper-text">${t('Vertical profile to TD · sub-mudline section to scale')}</span>
          <div class="schematic-toolbar-actions">
            <button type="button" class="schematic-tb-btn" id="btn-zoom-out" title="${t('Zoom Out (100% min)')}" aria-label="${t('Zoom Out')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button type="button" class="schematic-tb-btn schematic-zoom-reset" id="btn-zoom-reset" title="${t('Fit / Reset (100%)')}" aria-label="${t('Fit / Reset')}">100%</button>
            <button type="button" class="schematic-tb-btn" id="btn-zoom-in" title="${t('Zoom In (300% max)')}" aria-label="${t('Zoom In')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button type="button" class="schematic-tb-btn" id="btn-schematic-fullscreen" title="${t('Full Screen View')}" aria-label="${t('Full Screen View')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </button>
          </div>
        </div>
        <div class="cement-schematic-viewport" id="schematic-viewport">
          <div class="cement-schematic-canvas" id="schematic-canvas">
            ${svgMarkup}
          </div>
        </div>
        ${legendMarkup}
        <div class="cement-layer-tooltip" id="cement-layer-tooltip" style="display:none;"></div>
      `;

      const viewportEl = schematicBody.querySelector('#schematic-viewport');
      const canvasEl = schematicBody.querySelector('#schematic-canvas');
      const controls = {
        zoomOutBtn: schematicBody.querySelector('#btn-zoom-out'),
        resetBtn: schematicBody.querySelector('#btn-zoom-reset'),
        zoomInBtn: schematicBody.querySelector('#btn-zoom-in')
      };

      createSchematicViewer(viewportEl, canvasEl, controls);

      const fsBtn = schematicBody.querySelector('#btn-schematic-fullscreen');
      if (fsBtn) {
        fsBtn.onclick = (e) => {
          e.stopPropagation();
          openSchematicFullscreenModal(svgMarkup, sectionName, modelLabel);
        };
      }
      bindSchematicLayerClicks(schematicCard);
    }

    if (isSchematicOpen) {
      renderSchematicContent();
    }

    schematicHeader.onclick = () => {
      const willOpen = !schematicCard.classList.contains('open');
      if (willOpen) {
        schematicCard.classList.add('open');
        cementingState.collapsed.schematic = false;
        schematicTitle.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${t('Hide Well Cementing Schematic')}
        `;
        renderSchematicContent();
      } else {
        schematicCard.classList.remove('open');
        cementingState.collapsed.schematic = true;
        schematicTitle.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${t('Show Well Cementing Schematic')}
        `;
        schematicBody.innerHTML = '';
      }
    };

    // 4. Action Buttons Stack
    const actionRow = document.createElement('div');
    actionRow.className = 'cement-step-btn-stack';
    actionRow.style.marginTop = '20px';
    actionRow.innerHTML = `
      <button class="btn btn-primary" id="btn-save-job" style="width:100%;">${t('Save Job')}</button>
      <button class="btn btn-secondary" id="btn-edit-well-data" style="width:100%;">${t('Edit Well Data')}</button>
      <button class="btn btn-report-pdf" id="btn-generate-pdf-report" style="width:100%;">
        <svg class="btn-pdf-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="btn-pdf-text">${t('Generate Job Report (PDF)')}</span>
      </button>
    `;
    resultsWrapper.appendChild(actionRow);
    container.appendChild(resultsWrapper);

    actionRow.querySelector('#btn-save-job').onclick = () => saveCurrentCementingJob();
    actionRow.querySelector('#btn-edit-well-data').onclick = () => {
      cementingState.view = 'welldata';
      renderCementingScreen();
    };

    const reportBtn = actionRow.querySelector('#btn-generate-pdf-report');
    if (reportBtn) {
      reportBtn.onclick = async () => {
        if (reportBtn.disabled) return;
        const origHtml = reportBtn.innerHTML;
        reportBtn.disabled = true;
        reportBtn.classList.add('loading');
        reportBtn.innerHTML = `
          <span class="btn-pdf-spinner"></span>
          <span>${t('Generating PDF Report...')}</span>
        `;

        try {
          if (!cementingState.sectionPresets) {
            cementingState.sectionPresets = SECTION_PRESETS;
          }
          cementingState.engineInput = getEngineInputs();
          if (window.CementingPDF && typeof window.CementingPDF.generateJobReport === 'function') {
            const reportResult = await window.CementingPDF.generateJobReport(cementingState);
            const savedFile = await window.CementingPDF.saveReportToFile(
              reportResult.dataUri,
              reportResult.fileName,
              true,
              'application/pdf'
            );
            showReportReadyDialog(savedFile);
          } else {
            throw new Error('PDF generator library is not ready. Please try again.');
          }
        } catch (err) {
          console.error('Failed to generate PDF report:', err);
          showReportErrorDialog(
            t('Export failed'),
            err.message || t('An unexpected error occurred while saving the report.'),
            () => reportBtn.click()
          );
        } finally {
          reportBtn.disabled = false;
          reportBtn.classList.remove('loading');
          reportBtn.innerHTML = origHtml;
        }
      };
    }
  }

  function renderCementingJob(container) {
    if (cementingState.view === 'welldata') {
      renderWellDataStep(container);
    } else if (cementingState.view === 'results') {
      renderResultsStep(container);
    } else {
      renderCapacitiesStep(container);
    }
  }

    // Accordion toggle helper
  root.toggleCementingCard = function(headerEl, key) {
    const card = headerEl.closest('.cement-accordion');
    if (!card) return;
    card.classList.toggle('open');
    if (key && cementingState.collapsed[key] !== undefined) {
      cementingState.collapsed[key] = !card.classList.contains('open');
    }
  };

  /**
   * Helper to format depth and distance
   */
  function formatMetricDepth(ftVal, isMetric) {
    const val = Number(ftVal) || 0;
    if (isMetric) {
      return CementingEngine.ftToMeters(val).toFixed(1);
    }
    return val.toFixed(1);
  }

  function formatMetricDist(ftVal, isMetric) {
    const val = Number(ftVal) || 0;
    if (isMetric) {
      return CementingEngine.ftToMeters(val).toFixed(1);
    }
    return val.toFixed(1);
  }

  /**
   * Input Field HTML Builder with validation styling
   */
  function renderInputField(label, key, val, unitLabel, error, isLast = false) {
    const displayVal = (val !== undefined && val !== null && val !== '') ? val : '';
    return `
      <div class="input-group" style="display:flex; flex-direction:column; gap:4px;">
        <label class="input-label" style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">
          ${t(label)} ${unitLabel ? `(${unitLabel})` : ''}
        </label>
        <input type="text"
               inputmode="decimal"
               pattern="[0-9]*[.,]?[0-9]*"
               enterkeyhint="${isLast ? 'done' : 'next'}"
               class="form-input ${error ? 'has-error' : ''}"
               data-key="${key}"
               value="${displayVal}"
               placeholder="0"
               autocomplete="off"
               autocorrect="off"
               spellcheck="false"
               style="margin-bottom:0; padding:10px 12px; font-size:0.9rem; border-radius:10px; min-height:48px;">
        ${error ? `<div class="cement-field-error">${escapeAttr(t(error))}</div>` : ''}
      </div>
    `;
  }

    /**
   * Capacities Table HTML Builder (Simplified 3-Column: COMPONENT | SOURCE | CAPACITY)
   * Each dropdown filtered strictly to target OD / tubular type for that row
   */
  function renderCapacitiesTable(inp) {
    const computed = computeJobCapacities(inp, cementingState.overrides);
    const tubulars = inp.tubulars || {};
    const sectionKey = cementingState.section || inp.section || '30';
    const is30 = sectionKey === '30';
    const is20 = sectionKey === '20';
    const is13 = sectionKey === '13.375';
    const is9 = sectionKey === '9.625';
    const isCustom = sectionKey === 'custom';
    const isSubsea = inp.model === 'subsea';
    const jobId = inp.id || sectionKey;
    const savedRef = getSavedCapacityRef(jobId);

    // Determine target casing OD
    let targetCsgOd = 30.0;
    if (is20) targetCsgOd = 20.0;
    else if (is13) targetCsgOd = 13.375;
    else if (is9) targetCsgOd = 9.625;
    else if (isCustom) {
      if (inp.custom_csg_od !== undefined && inp.custom_csg_od !== null) {
        targetCsgOd = parseFloat(String(inp.custom_csg_od).replace(',', '.'));
      } else if (computed.csg) {
        targetCsgOd = computed.csg.od_in;
        inp.custom_csg_od = targetCsgOd;
      } else {
        targetCsgOd = 13.375;
        inp.custom_csg_od = targetCsgOd;
      }
    }

    // Determine target prev casing OD (for cased annulus)
    let targetPrevCsgOd = null;
    if (is20) targetPrevCsgOd = 30.0;
    else if (is13) targetPrevCsgOd = 20.0;
    else if (is9) targetPrevCsgOd = 13.375;
    else if (isCustom && (tubulars.prev_csg_id || !is30)) {
      if (inp.custom_prev_csg_od !== undefined && inp.custom_prev_csg_od !== null) {
        targetPrevCsgOd = parseFloat(String(inp.custom_prev_csg_od).replace(',', '.'));
      } else if (computed.prevCsg) {
        targetPrevCsgOd = computed.prevCsg.od_in;
        inp.custom_prev_csg_od = targetPrevCsgOd;
      } else {
        const larger = CASING_OD_LIST.filter(item => item.od > targetCsgOd);
        targetPrevCsgOd = larger.length ? larger[larger.length - 1].od : 30.0;
        inp.custom_prev_csg_od = targetPrevCsgOd;
      }
    }

    let rows = [];

    // Row 1: Casing Capacity
    // Filtered strictly to targetCsgOd
    const csgOptions = getCasingOptions(targetCsgOd);
    let selectedCsg = csgOptions.find(o => o.id === tubulars.csg_id);
    if (!selectedCsg) {
      selectedCsg = csgOptions[0] || { id: 'csg_custom', label: `${targetCsgOd}" Casing`, cap_bbl_ft: 0, disp_bbl_ft: 0 };
      tubulars.csg_id = selectedCsg.id;
    }
    const csgSourceVal = selectedCsg.id;
    const csgOdLabel = selectedCsg.label.replace(/\s*[0-9.]+#[^"]*/, '').trim() || `${targetCsgOd}"`;

    const csgRow = {
      key: 'cap_csg',
      componentTitle: isCustom ? `${csgOdLabel} Casing` : (is30 ? '30" Casing' : (is20 ? '20" Casing' : (is13 ? '13 3/8" Casing' : (is9 ? '9 5/8" Casing' : `${csgOdLabel} Casing`)))),
      componentSub: 'Casing Capacity',
      sourceField: 'csg_id',
      currentSourceVal: csgSourceVal,
      sourceLabel: selectedCsg.label,
      options: csgOptions,
      canonicalVal: computed.effective.cap_csg,
      isReadOnlySource: false
    };

    if (isCustom) {
      csgRow.customOdSelect = {
        options: CASING_OD_LIST,
        selectedOd: targetCsgOd
      };
    }
    rows.push(csgRow);

    // Row 2: Landing String Capacity
    // Filtered strictly to drill pipes only (5", 5 1/2", 5 7/8", 6 5/8")
    const dpOptions = getDrillPipeOptions();
    let selectedDp = dpOptions.find(o => o.id === tubulars.dp_id);
    if (!selectedDp) {
      selectedDp = dpOptions.find(o => o.id === 'dp_5.875_23.4') || dpOptions[0];
      tubulars.dp_id = selectedDp.id;
    }
    rows.push({
      key: 'cap_dp',
      componentTitle: 'Landing String',
      componentSub: 'Landing String Capacity',
      sourceField: 'dp_id',
      currentSourceVal: selectedDp.id,
      sourceLabel: selectedDp.label,
      options: dpOptions,
      canonicalVal: computed.effective.cap_dp,
      isReadOnlySource: false
    });

    // Cased Annulus Row (for non-30" sections)
    if (!is30 && targetPrevCsgOd) {
      const prevCsgOptions = getCasingOptions(targetPrevCsgOd);
      let selectedPrevCsg = prevCsgOptions.find(o => o.id === tubulars.prev_csg_id);
      if (!selectedPrevCsg) {
        selectedPrevCsg = prevCsgOptions[0] || { id: 'csg_prev_custom', label: `${targetPrevCsgOd}" Casing`, cap_bbl_ft: 0, disp_bbl_ft: 0 };
        tubulars.prev_csg_id = selectedPrevCsg.id;
      }
      const prevCsgOdLabel = selectedPrevCsg.label.replace(/\s*[0-9.]+#[^"]*/, '').trim() || `${targetPrevCsgOd}"`;

      const prevRow = {
        key: 'cap_ann_c',
        componentTitle: 'Cased Annulus',
        componentSub: `${prevCsgOdLabel} × ${csgOdLabel}`,
        sourceField: 'prev_csg_id',
        currentSourceVal: selectedPrevCsg.id,
        sourceLabel: selectedPrevCsg.label,
        options: prevCsgOptions,
        canonicalVal: computed.effective.cap_ann_c,
        isReadOnlySource: false
      };

      if (isCustom) {
        const availablePrevOds = CASING_OD_LIST.filter(item => item.od > targetCsgOd);
        prevRow.customOdSelect = {
          options: availablePrevOds.length ? availablePrevOds : CASING_OD_LIST,
          selectedOd: targetPrevCsgOd
        };
      }
      rows.push(prevRow);
    }

    // Open Hole Annulus Row
    // Filtered to open hole sizes for this section (e.g. 36", 26", 17 1/2", 12 1/4", or all for custom)
    const holeOptions = getHoleOptions(sectionKey);
    let selectedHole = holeOptions.find(o => o.id === tubulars.hole_id);
    if (!selectedHole) {
      selectedHole = holeOptions[0];
      tubulars.hole_id = selectedHole.id;
    }
    const holeLabelShort = selectedHole.label.replace(' Open Hole', '').trim();

    rows.push({
      key: 'cap_ann_oh',
      componentTitle: 'Open Hole Annulus',
      componentSub: `${holeLabelShort} × ${csgOdLabel}`,
      sourceField: 'hole_id',
      currentSourceVal: selectedHole.id,
      sourceLabel: selectedHole.label,
      options: holeOptions,
      canonicalVal: computed.effective.cap_ann_oh,
      isReadOnlySource: false
    });

    // Open Hole Rathole Row
    // Linked to hole size of open hole annulus, read-only
    rows.push({
      key: 'cap_oh',
      componentTitle: 'Open Hole Rathole',
      componentSub: selectedHole.label,
      sourceField: 'hole_id',
      currentSourceVal: selectedHole.id,
      sourceLabel: selectedHole.label,
      readOnlyText: selectedHole.label,
      options: [],
      canonicalVal: computed.effective.cap_oh,
      isReadOnlySource: true
    });

    // Marine Riser Annulus (Subsea jobs)
    if (isSubsea && !is30) {
      const dpShort = selectedDp.label.replace(/\s*[0-9.]+#[^"]*/, '').trim() || 'DP';
      rows.push({
        key: 'cap_riser',
        componentTitle: 'Riser Annulus',
        componentSub: `Riser × ${dpShort}`,
        sourceField: 'riser_id',
        currentSourceVal: tubulars.riser_id || 'riser_19.5',
        sourceLabel: '19.5" ID Riser',
        options: [
          { id: 'riser_19.5', label: 'Riser 19.5" ID' }
        ],
        canonicalVal: computed.effective.cap_riser,
        isReadOnlySource: false
      });
    }

    // Capacity Check Validation Line
    let isValid = true;
    let warningMsg = '';

    if (rows.some(r => r.key === 'cap_ann_oh') && computed.effective.cap_ann_oh <= 0) {
      isValid = false;
      warningMsg = 'Open hole annulus capacity ≤ 0';
    } else if (rows.some(r => r.key === 'cap_ann_c') && computed.effective.cap_ann_c <= 0) {
      isValid = false;
      warningMsg = 'Cased hole annulus capacity ≤ 0';
    } else if (rows.some(r => r.key === 'cap_riser') && computed.effective.cap_riser <= 0) {
      isValid = false;
      warningMsg = 'Marine riser annulus capacity ≤ 0';
    } else if (!is30 && computed.effective.cap_prev_csg > 0 && computed.effective.cap_csg >= computed.effective.cap_prev_csg) {
      isValid = false;
      warningMsg = 'Casing capacity must be less than previous casing capacity';
    }

    const activeUnit = cementingState.capUnit || 'BBL/M';
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';

    let html = `
      <table class="cement-cap-table-simplified">
        <colgroup>
          <col style="width: 38%;">
          <col style="width: 32%;">
          <col style="width: 30%;">
        </colgroup>
        <thead>
          <tr>
            <th style="text-align:left;">${t('COMPONENT')}</th>
            <th style="text-align:left;">${t('SOURCE')}</th>
            <th style="text-align:right;">
              <div class="cement-cap-header-wrap">
                <span class="cement-cap-header-title">${t('CAPACITY')}</span>
                <select class="cement-cap-header-unit-select" id="cap-global-unit-select" aria-label="Capacity Unit" ${sys !== 'mixed' ? 'disabled style="opacity:0.55; pointer-events:none;"' : ''}>
                  <option value="BBL/M" ${activeUnit === 'BBL/M' ? 'selected' : ''}>BBL/M</option>
                  <option value="BBL/FT" ${activeUnit === 'BBL/FT' ? 'selected' : ''}>BBL/FT</option>
                  <option value="L/M" ${(activeUnit === 'L/M' || activeUnit === 'LTR/M') ? 'selected' : ''}>L/M</option>
                </select>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
    `;

    rows.forEach(r => {
      const displayVal = formatCapValue(r.canonicalVal, activeUnit);

      let sourceHtml = '';
      if (r.isReadOnlySource) {
        sourceHtml = `
          <span class="cement-cap-source-readonly" title="${escapeAttr(t(r.readOnlyText))}">
            ${escapeAttr(t(r.readOnlyText))}
          </span>
        `;
      } else if (r.customOdSelect) {
        sourceHtml = `
          <div class="cement-cap-source-stack" style="display:flex; flex-direction:column; gap:4px;">
            <select class="cement-cap-select cement-custom-od-select" data-custom-od-target="${r.sourceField}" aria-label="Select Casing OD" style="font-weight:600; font-size:0.75rem;">
              ${r.customOdSelect.options.map(opt => `
                <option value="${opt.od}" ${Math.abs(opt.od - r.customOdSelect.selectedOd) < 0.05 ? 'selected' : ''}>
                  ${escapeAttr(opt.label)}
                </option>
              `).join('')}
            </select>
            <select class="cement-cap-select" data-cap-source="${r.sourceField}" data-row-key="${r.key}" aria-label="${escapeAttr(r.componentTitle)} Weight">
              ${r.options.map(opt => `
                <option value="${escapeAttr(opt.id)}" ${opt.id === r.currentSourceVal ? 'selected' : ''}>
                  ${escapeAttr(opt.label)}
                </option>
              `).join('')}
            </select>
          </div>
        `;
      } else {
        sourceHtml = `
          <select class="cement-cap-select" data-cap-source="${r.sourceField}" data-row-key="${r.key}" aria-label="${escapeAttr(r.componentTitle)} Source">
            ${r.options.map(opt => `
              <option value="${escapeAttr(opt.id)}" ${opt.id === r.currentSourceVal ? 'selected' : ''}>
                ${escapeAttr(opt.label)}
              </option>
            `).join('')}
          </select>
        `;
      }

      html += `
        <tr>
          <td>
            <div class="cement-cap-comp-title">${escapeAttr(t(r.componentTitle))}</div>
            <div class="cement-cap-comp-sub">${escapeAttr(t(r.componentSub))}</div>
          </td>
          <td>
            ${sourceHtml}
          </td>
          <td>
            <input type="number" step="any" class="cement-cap-input" data-cap-key="${r.key}" data-canonical="${r.canonicalVal}" value="${displayVal}" placeholder="0.00000" aria-label="${escapeAttr(r.componentTitle)} Capacity">
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>

      ${!isValid ? `
        <!-- Capacity Check Warning line -->
        <div class="cement-cap-check-line cement-check-warn">
          <span class="cement-check-icon">⚠</span>
          <span>${t('Capacity Check')}: <strong>${t('Warning')}</strong> — ${escapeAttr(t(warningMsg))}</span>
        </div>
      ` : ''}
    `;

    return html;
  }

  function bindCapacitiesActions(cardEl) {
    const inp = cementingState.inputs;
    if (!inp.tubulars) {
      const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
      inp.tubulars = Object.assign({}, preset.tubulars);
    }

    function markReferenceDirty() {
      cementingState.referenceIsDirty = true;
      const saveBtn = document.getElementById('btn-save-reference-wizard');
      const useBtn = document.getElementById('btn-use-reference-wizard');
      if (saveBtn) {
        saveBtn.className = 'btn btn-primary';
      }
      if (useBtn) {
        useBtn.className = 'btn btn-secondary';
        useBtn.disabled = true;
        useBtn.setAttribute('disabled', 'true');
      }
    }

    // Source dropdown selection (weight / tubular)
    cardEl.querySelectorAll('select[data-cap-source]').forEach(select => {
      select.addEventListener('change', () => {
        const sourceField = select.getAttribute('data-cap-source');
        const rowKey = select.getAttribute('data-row-key');
        inp.tubulars[sourceField] = select.value;
        if (rowKey && cementingState.overrides[rowKey] !== undefined) {
          delete cementingState.overrides[rowKey];
        }
        markReferenceDirty();
        renderCementingScreen();
      });
    });

    // Custom OD Selectors (for Custom Section)
    cardEl.querySelectorAll('select.cement-custom-od-select').forEach(select => {
      select.addEventListener('change', () => {
        const targetField = select.getAttribute('data-custom-od-target');
        const newOd = parseFloat(select.value);
        if (targetField === 'csg_id') {
          inp.custom_csg_od = newOd;
          const opts = getCasingOptions(newOd);
          if (opts.length) {
            inp.tubulars.csg_id = opts[0].id;
          }
          delete cementingState.overrides.cap_csg;
          if (inp.custom_prev_csg_od !== undefined && inp.custom_prev_csg_od <= newOd) {
            const larger = CASING_OD_LIST.filter(item => item.od > newOd);
            if (larger.length) {
              inp.custom_prev_csg_od = larger[larger.length - 1].od;
              const prevOpts = getCasingOptions(inp.custom_prev_csg_od);
              if (prevOpts.length) inp.tubulars.prev_csg_id = prevOpts[0].id;
            }
          }
        } else if (targetField === 'prev_csg_id') {
          inp.custom_prev_csg_od = newOd;
          const opts = getCasingOptions(newOd);
          if (opts.length) {
            inp.tubulars.prev_csg_id = opts[0].id;
          }
          delete cementingState.overrides.cap_ann_c;
        }
        markReferenceDirty();
        renderCementingScreen();
      });
    });

    // Global capacity unit dropdown in header
    const unitSelect = cardEl.querySelector('#cap-global-unit-select');
    if (unitSelect) {
      unitSelect.addEventListener('change', () => {
        const newUnit = unitSelect.value;
        cementingState.capUnit = newUnit;
        persistStoredCapUnit(newUnit);
        if (newUnit === 'BBL/FT') {
          cementingState.unit = 'ft';
          persistStoredUnit('ft');
        } else if (newUnit === 'BBL/M' || newUnit === 'L/M' || newUnit === 'LTR/M') {
          cementingState.unit = 'm';
          persistStoredUnit('m');
        }
        const isM = (cementingState.unit || 'm') === 'm';
        const btnM = document.getElementById('subsea-top-unit-m');
        const btnFt = document.getElementById('subsea-top-unit-ft');
        const topBarM = document.getElementById('toggle-unit-m');
        const topBarFt = document.getElementById('toggle-unit-ft');
        const pill = document.getElementById('subsea-unit-pill-desc');
        if (btnM && btnFt) {
          btnM.classList.toggle('active', isM);
          btnFt.classList.toggle('active', !isM);
        }
        if (topBarM && topBarFt) {
          topBarM.classList.toggle('active', isM);
          topBarFt.classList.toggle('active', !isM);
        }
        if (pill) {
          pill.textContent = isM ? t('Metric (m, bbl/m)') : t('Imperial (ft, bbl/ft)');
          pill.className = `cement-unit-mode-pill ${isM ? 'mode-metric' : 'mode-imperial'}`;
        }
        cardEl.querySelectorAll('input.cement-cap-input').forEach(inpEl => {
          const canonical = parseFloat(inpEl.getAttribute('data-canonical')) || 0;
          inpEl.value = (typeof formatCapValue === 'function' ? formatCapValue : window.CementingCommon.formatCapValue)(canonical, newUnit);
        });
        markReferenceDirty();
      });
    }

    // Editable capacity inputs
    cardEl.querySelectorAll('input.cement-cap-input').forEach(input => {
      input.addEventListener('input', () => {
        const key = input.getAttribute('data-cap-key');
        const val = parseFloat(String(input.value).replace(',', '.'));
        if (!isNaN(val)) {
          const canonical = parseCapValueToCanonical(val, cementingState.capUnit || 'BBL/M');
          cementingState.overrides[key] = canonical;
          input.setAttribute('data-canonical', canonical);
          markReferenceDirty();
        }
      });

      input.addEventListener('change', () => {
        const key = input.getAttribute('data-cap-key');
        const val = parseFloat(String(input.value).replace(',', '.'));
        if (!isNaN(val)) {
          const canonical = parseCapValueToCanonical(val, cementingState.capUnit || 'BBL/M');
          cementingState.overrides[key] = canonical;
          input.setAttribute('data-canonical', canonical);
        } else {
          delete cementingState.overrides[key];
        }
        markReferenceDirty();
        renderCementingScreen();
      });
    });


  }

  /**
   * Duplicate Confirmation Modal Dialog
   */
  function showDuplicateModal(existingJob, onConfirmOverwrite) {
    const oldModal = document.getElementById('cement-duplicate-modal');
    if (oldModal) oldModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cement-duplicate-modal';
    overlay.className = 'cement-modal-overlay';
    overlay.innerHTML = `
      <div class="cement-modal-card" role="dialog" aria-modal="true" aria-labelledby="dup-modal-title">
        <div class="cement-modal-title" id="dup-modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Duplicate Job Exists
        </div>
        <div class="cement-modal-desc">
          A saved job with the name "<strong>${escapeAttr(existingJob.jobName || existingJob.name)}</strong>" or identical parameters already exists. Do you want to overwrite it?
        </div>
        <div class="cement-modal-actions">
          <button type="button" class="btn btn-secondary" id="btn-dup-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="btn-dup-overwrite" style="background:#EF4444; border-color:#DC2626;">Overwrite</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-dup-cancel').onclick = () => {
      overlay.remove();
    };
    overlay.querySelector('#btn-dup-overwrite').onclick = () => {
      overlay.remove();
      onConfirmOverwrite();
    };
  }

  /**
   * Save Current Job & Prevent Duplicates
   */
  function saveCurrentCementingJob() {
    const inp = cementingState.inputs;
    const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const defaultJobName = `${preset.label} – ${yyyy}-${mm}-${dd} ${hh}:${min}`;

    const finalName = (inp.name && inp.name.trim()) ? inp.name.trim() : defaultJobName;
    inp.name = finalName;
    cementingState.jobName = finalName;

    const newJob = {
      id: Date.now(),
      jobName: finalName,
      name: finalName, // backwards compatibility
      sectionId: cementingState.section,
      section: cementingState.section, // backwards compatibility
      sectionLabel: preset.label,
      model: inp.model,
      unitSystem: cementingState.unit,
      unit: cementingState.unit, // backwards compatibility
      canonical: 'm',
      reference: cementingState.activeReference ? JSON.parse(JSON.stringify(cementingState.activeReference)) : null,
      overrides: Object.assign({}, cementingState.overrides),
      wellData: JSON.parse(JSON.stringify(inp)),
      inputs: JSON.parse(JSON.stringify(inp)), // backwards compatibility
      results: cementingState.results ? JSON.parse(JSON.stringify(cementingState.results)) : null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      date: now.toLocaleDateString()
    };

    // Duplicate check:
    // Match rule 1: Same sectionId and same jobName (case-insensitive)
    // Match rule 2: Same sectionId and deep-equal reference + wellData
    const existingIndex = cementingState.savedJobs.findIndex(existing => {
      const existingName = (existing.jobName || existing.name || '').trim().toLowerCase();
      const existingSection = existing.sectionId || existing.section;
      if (existingSection === cementingState.section && existingName === finalName.toLowerCase()) {
        return true;
      }
      if (existingSection === cementingState.section) {
        const existingRef = existing.reference || {};
        const curRef = newJob.reference || {};
        const refMatch = JSON.stringify(existingRef.tubulars || {}) === JSON.stringify(curRef.tubulars || {}) &&
                         JSON.stringify(existingRef.canonical || {}) === JSON.stringify(curRef.canonical || {});
        const existingInp = existing.wellData || existing.inputs || {};
        const depthsMatch = DEPTH_KEYS.every(k => existingInp[k] === inp[k]);
        const fluidsMatch = existingInp.lead_vol === inp.lead_vol && existingInp.tail_vol === inp.tail_vol &&
                            existingInp.lead_mw === inp.lead_mw && existingInp.tail_mw === inp.tail_mw;
        if (refMatch && depthsMatch && fluidsMatch) {
          return true;
        }
      }
      return false;
    });

    if (existingIndex >= 0) {
      const existingJob = cementingState.savedJobs[existingIndex];
      showDuplicateModal(existingJob, function onOverwrite() {
        newJob.id = existingJob.id;
        newJob.createdAt = existingJob.createdAt || newJob.createdAt;
        cementingState.savedJobs[existingIndex] = newJob;
        persistSavedJobs(cementingState.savedJobs);
        if (typeof showToast === 'function') showToast(t('Job "{0}" updated!', finalName));
        cementingState.view = 'chooser';
        renderCementingScreen();
      });
      return;
    }

    // No duplicate found
    cementingState.savedJobs.unshift(newJob);
    persistSavedJobs(cementingState.savedJobs);
    if (typeof showToast === 'function') showToast(t('Job "{0}" saved!', finalName));
    cementingState.view = 'chooser';
    renderCementingScreen();
  }

  /**
   * Reset Current Job
   */
  function resetCurrentCementingJob() {
    const jobId = (cementingState.inputs && cementingState.inputs.id) || cementingState.section || '30';
    deleteSavedCapacityRef(jobId);
    cementingState.overrides = {};
    cementingState.capUnit = 'BBL/M';
    const preset = SECTION_PRESETS[cementingState.section] || SECTION_PRESETS['custom'];
    cementingState.inputs = Object.assign({}, preset);
    cementingState.overrides = {};
    cementingState.collapsed.schematic = false;
    if (typeof showToast === 'function') showToast(t('Reset to section defaults'));
    renderCementingScreen();
  }

    /**
   * Live Interactive SVG Well Cementing Schematic
   * Segmented / Piecewise Scale:
   *  - Air gap: RKB -> Sea Level (fixed small height ~6–8%, min 40 px)
   *  - Water column: Sea Level -> Mudline (fixed compressed height ~20–25%) with scale break
   *  - Below mudline: Mudline -> TD (remaining ~65–70% of canvas, drawn to scale)
   *  - Parallel dimension lines for Air Gap & Water Depth on the right
   *  - Highlighted sub-mudline focus panel
   *  - Anti-collision / auto-stacking depth tags on the left (>= 19px separation)
   */
  function renderWellCementingSchematic(res, inp, unit) {
    const isMetric = unit === 'm';

    const airGapFt = Math.max(0, Number(inp.air_gap) || 0);
    const waterDepthFt = Math.max(0, Number(inp.water_depth) || 0);
    const mudlineFt = res.mudline !== undefined ? Number(res.mudline) : (airGapFt + waterDepthFt);
    const tdFt = Math.max(mudlineFt + 10, Number(inp.td) || 0);

    const hasAirGap = airGapFt > 0;
    const hasWater = waterDepthFt > 0;
    const hasOffshore = hasWater || hasAirGap;

    const yTop = 50;
    const yBot = 745;
    const totalH = yBot - yTop; // 695 px

    let hAir = 0;
    let hWater = 0;
    let hWell = totalH;

    if (hasOffshore) {
      // 1. Air gap: fixed small height (~6–8% of canvas, min 40 px)
      hAir = hasAirGap ? Math.max(40, Math.round(totalH * 0.07)) : 0; // ~48 px

      // 2. Water column: fixed compressed height (~20–25% of canvas)
      // If waterDepth is small relative to TD (< 15% of TD), reduce compressed water band proportionally
      if (hasWater) {
        const baseHWater = Math.round(totalH * 0.22); // ~153 px
        const waterRatio = tdFt > 0 ? (waterDepthFt / tdFt) : 1;
        if (waterRatio < 0.15 && waterRatio > 0) {
          hWater = Math.max(35, Math.round(baseHWater * (waterRatio / 0.15)));
        } else {
          hWater = baseHWater;
        }
      } else {
        hWater = 0;
      }

      // 3. Below mudline: remaining ~65–70% of canvas, drawn to scale within segment
      hWell = totalH - hAir - hWater;
    }

    const y0 = yTop;
    const yAirPos = y0 + hAir;
    const yMudPos = yAirPos + hWater;
    const yTDPos = yMudPos + hWell;

    // Single central helper depthToY(depthFt) used for EVERY element
    function depthToY(d) {
      if (d === undefined || d === null || isNaN(d)) return y0;
      if (!hasOffshore) {
        const maxD = Math.max(10, tdFt);
        const clamped = Math.max(0, Math.min(maxD, Number(d)));
        return y0 + (clamped / maxD) * totalH;
      }

      const numD = Number(d);
      if (numD <= 0) return y0;

      // Segment 1: RKB (0) -> Sea Level (airGapFt)
      if (hasAirGap && numD <= airGapFt) {
        return y0 + (numD / airGapFt) * hAir;
      }

      // Segment 2: Sea Level (airGapFt) -> Mudline (mudlineFt)
      if (hasWater && numD <= mudlineFt) {
        const waterDist = numD - airGapFt;
        const totalWater = Math.max(1, mudlineFt - airGapFt);
        return yAirPos + (waterDist / totalWater) * hWater;
      }

      // Segment 3: Sub-Mudline (mudlineFt -> tdFt) to scale
      const subDist = numD - mudlineFt;
      const totalSub = Math.max(1, tdFt - mudlineFt);
      const clampedSub = Math.max(0, Math.min(totalSub, subDist));
      return yMudPos + (clampedSub / totalSub) * hWell;
    }

    const yAir = depthToY(inp.air_gap);
    const yMud = depthToY(mudlineFt);
    const yHanger = (inp.hanger > 0) ? depthToY(inp.hanger) : null;
    const yPrevShoe = (inp.prev_shoe > 0) ? depthToY(inp.prev_shoe) : null;
    const yTOC = depthToY(res.toc);
    const yTail = depthToY(res.tail_top);
    const ySP = depthToY(res.sp_top);
    const yF2 = depthToY(res.f2_top);
    const yF1 = depthToY(res.f1_top);
    const yFC = depthToY(res.fc);
    const yShoe = depthToY(inp.shoe);
    const yTD = depthToY(tdFt);

    const cx = 250;
    const ohLeft = 195;
    const ohRight = 305;
    const ohW = ohRight - ohLeft; // 110

    const csgLeft = 215;
    const csgRight = 285;
    const csgW = csgRight - csgLeft; // 70

    const annLeftW = csgLeft - ohLeft; // 20
    const annRightW = ohRight - csgRight; // 20

    const riserLeft = 205;
    const riserRight = 295;

    function fmtD(val) {
      return formatMetricDepth(val, isMetric) + ' ' + (isMetric ? 'm' : 'ft');
    }
    function fmtH(val) {
      return formatMetricDist(val, isMetric) + ' ' + (isMetric ? 'm' : 'ft');
    }
    function fmtV(val) {
      if (window.CementingCommon && typeof window.CementingCommon.formatVol === 'function') {
        return window.CementingCommon.formatVol(val, false);
      }
      return { val: Number(val || 0).toFixed(1), unit: 'bbl', full: `${Number(val || 0).toFixed(1)} bbl` };
    }
    function fmtMW(val) {
      if (window.CementingCommon && typeof window.CementingCommon.formatDensity === 'function') {
        return window.CementingCommon.formatDensity(val);
      }
      return { val: Number(val || 0).toFixed(2), unit: 'ppg', full: `${Number(val || 0).toFixed(2)} ppg` };
    }

    // Build SVG components
    let svg = `<svg viewBox="-50 0 800 800" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#FAF8F5; border-radius:12px; font-family:'Outfit',sans-serif;">`;

    // Definitions (patterns & filters)
    svg += `
      <defs>
        <pattern id="mudline-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="10" y2="0" stroke="#D6CBBF" stroke-width="1.5" />
        </pattern>
        <linearGradient id="seawater-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#BAE6FD" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="formation-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FCF9F2" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#F5EFE3" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="disp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#0284C7" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
    `;

    // 1. Air Gap Zone (RKB 0 to Sea Level)
    if (hasAirGap && yAir > y0) {
      svg += `
        <!-- Air Gap Zone -->
        <rect x="130" y="${y0}" width="240" height="${yAir - y0}" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3" rx="2" />
        <line x1="120" y1="${y0}" x2="380" y2="${y0}" stroke="#475569" stroke-width="2.5" />
        <text x="140" y="${y0 + 15}" font-size="9.5" font-weight="700" fill="#64748B" letter-spacing="0.5">${t('AIR GAP')}</text>
      `;
    } else {
      // Platform top reference
      svg += `
        <line x1="120" y1="${y0}" x2="380" y2="${y0}" stroke="#475569" stroke-width="2.5" />
      `;
    }

    // 2. Water Column & Scale Break Indicator
    if (hasWater && yMud > yAir) {
      const yMidWater = (yAir + yMud) / 2;
      svg += `
        <!-- Water Column (Compressed) -->
        <rect x="130" y="${yAir}" width="240" height="${yMud - yAir}" fill="url(#seawater-grad)" stroke="#0284C7" stroke-width="1.2" />
        <path d="M 130 ${yAir} Q 150 ${yAir - 4}, 170 ${yAir} T 210 ${yAir} T 250 ${yAir} T 290 ${yAir} T 330 ${yAir} T 370 ${yAir}" fill="none" stroke="#0284C7" stroke-width="2.5"/>
        <text x="140" y="${yAir + 14}" font-size="9.5" font-weight="700" fill="#0369A1" letter-spacing="0.5">${t('WATER COLUMN')}</text>

        <!-- Scale Break Indicator (Zig-zag / Wavy Lines) -->
        <g class="scale-break-group">
          <rect x="131" y="${yMidWater - 10}" width="238" height="20" fill="url(#seawater-grad)" opacity="0.96"/>
          <path d="M 132 ${yMidWater - 4} L 220 ${yMidWater - 4} L 228 ${yMidWater - 10} L 236 ${yMidWater + 2} L 244 ${yMidWater - 10} L 252 ${yMidWater + 2} L 260 ${yMidWater - 10} L 268 ${yMidWater - 4} L 368 ${yMidWater - 4}" fill="none" stroke="#0284C7" stroke-width="1.8"/>
          <path d="M 132 ${yMidWater + 4} L 220 ${yMidWater + 4} L 228 ${yMidWater - 2} L 236 ${yMidWater + 10} L 244 ${yMidWater - 2} L 252 ${yMidWater + 10} L 260 ${yMidWater - 2} L 268 ${yMidWater + 4} L 368 ${yMidWater + 4}" fill="none" stroke="#0284C7" stroke-width="1.8"/>
          <rect x="185" y="${yMidWater - 8}" width="130" height="16" rx="4" fill="#0284C7" opacity="0.95"/>
          <text x="250" y="${yMidWater + 3.5}" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">≋ ${t('SCALE BREAK')} ≋</text>
        </g>
      `;
    }

    // 3. Highlighted Below-Mudline Focus Panel (The Actual Well)
    const subMudlineTopY = hasOffshore ? yMud : y0;
    svg += `
      <!-- Sub-Mudline Well Section Highlight Panel -->
      <rect x="120" y="${subMudlineTopY}" width="260" height="${Math.max(30, yTD - subMudlineTopY + 12)}" fill="url(#formation-grad)" stroke="#D6CBBF" stroke-width="1.5" rx="6" />
      <rect x="120" y="${subMudlineTopY}" width="260" height="16" fill="#EDE4D6" opacity="0.7" rx="4" />
      <text x="250" y="${subMudlineTopY + 11.5}" font-size="8.5" font-weight="700" fill="#786656" text-anchor="middle" letter-spacing="0.5">${t('SUB-MUDLINE WELL SECTION (TO SCALE)')}</text>
    `;

    // 4. Mudline / Seabed Bar
    if (hasOffshore) {
      svg += `
        <rect x="115" y="${yMud}" width="270" height="12" fill="url(#mudline-pattern)" stroke="#8D7765" stroke-width="1" />
        <line x1="110" y1="${yMud}" x2="390" y2="${yMud}" stroke="#8D7765" stroke-width="2.5" />
        <text x="125" y="${yMud + 23}" font-size="9.5" font-weight="700" fill="#706053">${t('Seabed / Mudline')}</text>
      `;
    }

    // 5. Open Hole Borehole Profile (from Prev Shoe or Mudline down to TD)
    const topHoleY = yPrevShoe || yMud;
    svg += `
      <!-- Borehole Walls -->
      <line x1="${ohLeft}" y1="${topHoleY}" x2="${ohLeft}" y2="${yTD}" stroke="#78716C" stroke-width="2.5" stroke-dasharray="4,2"/>
      <line x1="${ohRight}" y1="${topHoleY}" x2="${ohRight}" y2="${yTD}" stroke="#78716C" stroke-width="2.5" stroke-dasharray="4,2"/>
      <line x1="${ohLeft}" y1="${yTD}" x2="${ohRight}" y2="${yTD}" stroke="#78716C" stroke-width="3"/>
    `;

    // 6. Annulus Fluids (Left and Right)
    const annTopY = inp.model === 'subsea' ? (yHanger || yMud) : yMud;
    const topFluidY = inp.f1_vol > 0 ? yF1 : (inp.f2_vol > 0 ? yF2 : (inp.sp_vol > 0 ? ySP : yTOC));

    // Annulus Mud (Hole Fluid)
    if (topFluidY > annTopY) {
      svg += `
        <rect class="cement-svg-layer" data-name="Hole Fluid" data-depth="${fmtD(inp.air_gap + inp.water_depth)} - ${fmtD(inp.f1_vol > 0 ? res.f1_top : res.sp_top)}" data-vol="In Hole" data-mw="${fmtMW(inp.mw || inp.hole_fluid_mw).full}" x="${ohLeft}" y="${annTopY}" width="${annLeftW}" height="${topFluidY - annTopY}" fill="#C9D6DF" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Hole Fluid" data-depth="${fmtD(inp.air_gap + inp.water_depth)} - ${fmtD(inp.f1_vol > 0 ? res.f1_top : res.sp_top)}" data-vol="In Hole" data-mw="${fmtMW(inp.mw || inp.hole_fluid_mw).full}" x="${csgRight}" y="${annTopY}" width="${annRightW}" height="${topFluidY - annTopY}" fill="#C9D6DF" cursor="pointer"/>
      `;
    }

    // 1st Mud/Wash (if f1_vol > 0)
    if (inp.f1_vol > 0 && yF2 > yF1) {
      svg += `
        <rect class="cement-svg-layer" data-name="1st Mud Wash" data-depth="${fmtD(res.f1_top)} - ${fmtD(res.f2_top)}" data-vol="${fmtV(inp.f1_vol).full}" data-mw="${fmtMW(inp.f1_mw).full}" x="${ohLeft}" y="${yF1}" width="${annLeftW}" height="${yF2 - yF1}" fill="#E07B39" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="1st Mud Wash" data-depth="${fmtD(res.f1_top)} - ${fmtD(res.f2_top)}" data-vol="${fmtV(inp.f1_vol).full}" data-mw="${fmtMW(inp.f1_mw).full}" x="${csgRight}" y="${yF1}" width="${annRightW}" height="${yF2 - yF1}" fill="#E07B39" cursor="pointer"/>
      `;
    }

    // 2nd Mud/Wash (if f2_vol > 0)
    if (inp.f2_vol > 0 && ySP > yF2) {
      svg += `
        <rect class="cement-svg-layer" data-name="2nd Mud Wash" data-depth="${fmtD(res.f2_top)} - ${fmtD(res.sp_top)}" data-vol="${fmtV(inp.f2_vol).full}" data-mw="${fmtMW(inp.f2_mw).full}" x="${ohLeft}" y="${yF2}" width="${annLeftW}" height="${ySP - yF2}" fill="#9B59B6" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="2nd Mud Wash" data-depth="${fmtD(res.f2_top)} - ${fmtD(res.sp_top)}" data-vol="${fmtV(inp.f2_vol).full}" data-mw="${fmtMW(inp.f2_mw).full}" x="${csgRight}" y="${yF2}" width="${annRightW}" height="${ySP - yF2}" fill="#9B59B6" cursor="pointer"/>
      `;
    }

    // Spacer
    if (inp.sp_vol > 0 && yTOC > ySP) {
      svg += `
        <rect class="cement-svg-layer" data-name="Spacer" data-depth="${fmtD(res.sp_top)} - ${fmtD(res.toc)}" data-vol="${fmtV(inp.sp_vol).full}" data-mw="${fmtMW(inp.sp_mw).full}" x="${ohLeft}" y="${ySP}" width="${annLeftW}" height="${yTOC - ySP}" fill="#4A90D9" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Spacer" data-depth="${fmtD(res.sp_top)} - ${fmtD(res.toc)}" data-vol="${fmtV(inp.sp_vol).full}" data-mw="${fmtMW(inp.sp_mw).full}" x="${csgRight}" y="${ySP}" width="${annRightW}" height="${yTOC - ySP}" fill="#4A90D9" cursor="pointer"/>
      `;
    }

    // Lead Slurry
    if (inp.lead_vol > 0 && yTail > yTOC) {
      svg += `
        <rect class="cement-svg-layer" data-name="Lead Slurry" data-depth="${fmtD(res.toc)} - ${fmtD(res.tail_top)}" data-vol="${fmtV(inp.lead_vol).full}" data-mw="${fmtMW(inp.lead_mw).full}" x="${ohLeft}" y="${yTOC}" width="${annLeftW}" height="${yTail - yTOC}" fill="#B5D99C" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Lead Slurry" data-depth="${fmtD(res.toc)} - ${fmtD(res.tail_top)}" data-vol="${fmtV(inp.lead_vol).full}" data-mw="${fmtMW(inp.lead_mw).full}" x="${csgRight}" y="${yTOC}" width="${annRightW}" height="${yTail - yTOC}" fill="#B5D99C" cursor="pointer"/>
      `;
    }

    // Tail Slurry (Annulus)
    if (yShoe > yTail) {
      svg += `
        <rect class="cement-svg-layer" data-name="Tail Slurry (Annulus)" data-depth="${fmtD(res.tail_top)} - ${fmtD(inp.shoe)}" data-vol="${fmtV(inp.tail_vol).full}" data-mw="${fmtMW(inp.tail_mw).full}" x="${ohLeft}" y="${yTail}" width="${annLeftW}" height="${yShoe - yTail}" fill="#3E7D3A" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Tail Slurry (Annulus)" data-depth="${fmtD(res.tail_top)} - ${fmtD(inp.shoe)}" data-vol="${fmtV(inp.tail_vol).full}" data-mw="${fmtMW(inp.tail_mw).full}" x="${csgRight}" y="${yTail}" width="${annRightW}" height="${yShoe - yTail}" fill="#3E7D3A" cursor="pointer"/>
      `;
    }

    // Rathole below shoe (filled with cement)
    if (yTD > yShoe) {
      const ratColor = (inp.tail_vol > 0) ? '#3E7D3A' : '#B5D99C';
      svg += `
        <rect class="cement-svg-layer" data-name="Rathole Cement" data-depth="${fmtD(inp.shoe)} - ${fmtD(inp.td)}" data-vol="${fmtV(res.rat_vol || 0).full}" data-mw="${fmtMW((inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0).full}" x="${ohLeft}" y="${yShoe}" width="${ohW}" height="${yTD - yShoe}" fill="${ratColor}" opacity="0.9" cursor="pointer"/>
      `;
    }

    // Shoe Track interior (between FC and Shoe)
    if (yShoe > yFC) {
      const stColor = (inp.tail_vol > 0) ? '#3E7D3A' : '#B5D99C';
      svg += `
        <rect class="cement-svg-layer" data-name="Shoe Track Cement" data-depth="${fmtD(res.fc)} - ${fmtD(inp.shoe)}" data-vol="${fmtV(res.st_vol || 0).full}" data-mw="${fmtMW((inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0).full}" x="${csgLeft}" y="${yFC}" width="${csgW}" height="${yShoe - yFC}" fill="${stColor}" cursor="pointer"/>
      `;
    }

    // Displacement Fluid inside Casing (above FC)
    const topCsgY = inp.model === 'subsea' ? (yHanger || y0) : y0;
    if (yFC > topCsgY) {
      svg += `
        <rect class="cement-svg-layer" data-name="Displacement Fluid" data-depth="${fmtD(0)} - ${fmtD(res.fc)}" data-vol="${fmtV(res.disp_tot || 0).full}" data-mw="${fmtMW(inp.disp_mw || inp.mw).full}" x="${csgLeft}" y="${topCsgY}" width="${csgW}" height="${yFC - topCsgY}" fill="#F2D388" cursor="pointer"/>
      `;
    }

    // 7. Casing Walls & Float Collar
    svg += `
      <!-- Current Casing String -->
      <line x1="${csgLeft}" y1="${topCsgY}" x2="${csgLeft}" y2="${yShoe}" stroke="#1E293B" stroke-width="2.8"/>
      <line x1="${csgRight}" y1="${topCsgY}" x2="${csgRight}" y2="${yShoe}" stroke="#1E293B" stroke-width="2.8"/>

      <!-- Casing Shoe Guide -->
      <polygon points="${csgLeft},${yShoe} ${csgLeft - 4},${yShoe + 6} ${csgRight + 4},${yShoe + 6} ${csgRight},${yShoe}" fill="#0F172A" />

      <!-- Float Collar -->
      <line x1="${csgLeft}" y1="${yFC}" x2="${csgRight}" y2="${yFC}" stroke="#EF4444" stroke-width="3.5"/>
      <circle cx="${cx}" cy="${yFC}" r="4" fill="#EF4444"/>
    `;

    // 8. Previous Casing (if present)
    if (yPrevShoe && yPrevShoe > annTopY) {
      const prevLeft = csgLeft - 8;
      const prevRight = csgRight + 8;
      svg += `
        <line x1="${prevLeft}" y1="${annTopY}" x2="${prevLeft}" y2="${yPrevShoe}" stroke="#475569" stroke-width="2.5"/>
        <line x1="${prevRight}" y1="${annTopY}" x2="${prevRight}" y2="${yPrevShoe}" stroke="#475569" stroke-width="2.5"/>
        <polygon points="${prevLeft},${yPrevShoe} ${prevLeft - 6},${yPrevShoe + 8} ${prevLeft},${yPrevShoe + 8}" fill="#334155"/>
        <polygon points="${prevRight},${yPrevShoe} ${prevRight + 6},${yPrevShoe + 8} ${prevRight},${yPrevShoe + 8}" fill="#334155"/>
      `;
    }

    // 9. Marine Riser (if Subsea)
    if (inp.model === 'subsea' && (yHanger || yMud)) {
      const riserBot = yHanger || yMud;
      svg += `
        <!-- Marine Riser -->
        <line x1="${riserLeft}" y1="${y0}" x2="${riserLeft}" y2="${riserBot}" stroke="#0369A1" stroke-width="3"/>
        <line x1="${riserRight}" y1="${y0}" x2="${riserRight}" y2="${riserBot}" stroke="#0369A1" stroke-width="3"/>

        ${yHanger ? `
          <!-- Subsea Wellhead -->
          <rect x="188" y="${yHanger - 12}" width="124" height="16" rx="3" fill="#1E293B" stroke="#0F172A" stroke-width="1.5"/>
          <polygon points="196,${yHanger + 4} 304,${yHanger + 4} 292,${yHanger + 16} 208,${yHanger + 16}" fill="#334155"/>
          <text x="130" y="${yHanger - 2}" font-size="9" font-weight="700" fill="#0369A1">${t('Subsea Wellhead')}</text>
        ` : ''}
      `;
    }

    // 10. Drill Pipe / Landing String
    const dpBotY = inp.model === 'subsea' ? (yHanger || yFC) : yFC;
    svg += `
      <line x1="${cx}" y1="${y0}" x2="${cx}" y2="${dpBotY}" stroke="#475569" stroke-width="3"/>
    `;

    // 11. Balanced Left/Right Depth Callouts with Collision Avoidance & Rounded Pills
    const leftMarkers = [];
    const rightMarkers = [];

    // Left Side Callouts: Structural / Geometry depths
    leftMarkers.push({
      d: 0,
      targetY: y0,
      label: `RKB 0 ${isMetric ? 'm' : 'ft'}`,
      bg: '#2C1A11',
      text: '#FFFFFF'
    });

    if (inp.prev_shoe > 0) {
      leftMarkers.push({
        d: inp.prev_shoe,
        targetY: yPrevShoe,
        label: `${t('Prev Shoe')} ${fmtD(inp.prev_shoe)}`,
        bg: '#64748B',
        text: '#FFFFFF'
      });
    }

    if (res.fc > 0) {
      leftMarkers.push({
        d: res.fc,
        targetY: yFC,
        label: `${t('Float Collar Depth')} ${fmtD(res.fc)}`,
        bg: '#DC2626',
        text: '#FFFFFF'
      });
    }

    if (inp.shoe > 0) {
      leftMarkers.push({
        d: inp.shoe,
        targetY: yShoe,
        label: `${t('Casing Shoe')} ${fmtD(inp.shoe)}`,
        bg: '#1E293B',
        text: '#FFFFFF'
      });
    }

    if (inp.td > 0) {
      leftMarkers.push({
        d: inp.td,
        targetY: yTD,
        label: `${t('Hole Depth (MD)')} ${fmtD(inp.td)}`,
        bg: '#78716C',
        text: '#FFFFFF'
      });
    }

    // Right Side Callouts: Environmental & Fluid Top depths
    if (hasAirGap && inp.air_gap > 0) {
      rightMarkers.push({
        d: inp.air_gap,
        targetY: yAir,
        label: `${t('Sea Level')} ${fmtD(inp.air_gap)}`,
        bg: '#0284C7',
        text: '#FFFFFF'
      });
    }

    if (hasWater && mudlineFt > (inp.air_gap || 0)) {
      rightMarkers.push({
        d: mudlineFt,
        targetY: yMud,
        label: `${t('Mudline')} ${fmtD(mudlineFt)}`,
        bg: '#8D7765',
        text: '#FFFFFF'
      });
    }

    if (inp.model === 'subsea' && inp.hanger > 0) {
      rightMarkers.push({
        d: inp.hanger,
        targetY: yHanger,
        label: `${t('Hanger')} ${fmtD(inp.hanger)}`,
        bg: '#0369A1',
        text: '#FFFFFF'
      });
    }

    if (inp.f1_vol > 0 && res.f1_top !== undefined) {
      rightMarkers.push({
        d: res.f1_top,
        targetY: yF1,
        label: `${t('1st Mud Wash Top')} ${fmtD(res.f1_top)}`,
        bg: '#E07B39',
        text: '#FFFFFF'
      });
    }

    if (inp.f2_vol > 0 && res.f2_top !== undefined) {
      rightMarkers.push({
        d: res.f2_top,
        targetY: yF2,
        label: `${t('2nd Mud Wash Top')} ${fmtD(res.f2_top)}`,
        bg: '#9B59B6',
        text: '#FFFFFF'
      });
    }

    if (inp.sp_vol > 0 && res.sp_top !== undefined) {
      rightMarkers.push({
        d: res.sp_top,
        targetY: ySP,
        label: `${t('Spacer Top')} ${fmtD(res.sp_top)}`,
        bg: '#4A90D9',
        text: '#FFFFFF'
      });
    }

    if (res.total_slurry > 0 && res.toc > 0) {
      const tocLabel = (inp.lead_vol > 0) ? t('Lead Slurry Top') : t('TOC');
      rightMarkers.push({
        d: res.toc,
        targetY: yTOC,
        label: `${tocLabel} ${fmtD(res.toc)}`,
        bg: '#15803D',
        text: '#FFFFFF'
      });
    }

    if (inp.tail_vol > 0 && res.tail_top > 0 && Math.abs(res.tail_top - res.toc) > 0.5) {
      rightMarkers.push({
        d: res.tail_top,
        targetY: yTail,
        label: `${t('Tail Top')} ${fmtD(res.tail_top)}`,
        bg: '#3E7D3A',
        text: '#FFFFFF'
      });
    }

    const calloutsFn = (window.CementingCommon && typeof window.CementingCommon.renderSchematicCallouts === 'function')
      ? window.CementingCommon.renderSchematicCallouts
      : null;

    if (calloutsFn) {
      svg += calloutsFn({
        leftMarkers,
        rightMarkers,
        ohLeft,
        ohRight,
        leftTagRight: 135,
        rightTagX: 355,
        minGap: 18,
        minY: 45,
        maxY: 765
      });
    }

    // 8. Vertical Span Dimension Lines & Brackets for All Active Zones & Fluids
    const dimensions = [];

    // Air Gap (when > 0)
    if (hasAirGap && inp.air_gap > 0 && yAir > y0) {
      dimensions.push({
        id: 'air_gap',
        type: 'env',
        track: 'inner',
        topY: y0,
        botY: yAir,
        topD: 0,
        botD: inp.air_gap,
        label: t('Air Gap'),
        heightStr: fmtH(inp.air_gap),
        color: '#0284C7',
        bg: '#0284C7'
      });
    }

    // Water Depth (when > 0)
    if (hasWater && waterDepthFt > 0 && yMud > yAir) {
      dimensions.push({
        id: 'water_depth',
        type: 'env',
        track: 'inner',
        topY: yAir,
        botY: yMud,
        topD: inp.air_gap || 0,
        botD: mudlineFt,
        label: t('Water Depth'),
        heightStr: fmtH(waterDepthFt),
        color: '#0369A1',
        bg: '#0369A1'
      });
    }

    // Displacement Fluid inside Casing/String
    const topCsgD = inp.model === 'subsea' ? (inp.hanger || 0) : 0;
    const fcDepth = res.fc !== undefined ? Number(res.fc) : (Number(inp.shoe) - (Number(inp.shoe_track_len) || 0));
    if (fcDepth > topCsgD && yFC > topCsgY) {
      const dispMw = inp.disp_mw || inp.mw || 0;
      dimensions.push({
        id: 'displacement',
        type: 'internal',
        track: 'internal',
        topY: topCsgY,
        botY: yFC,
        topD: topCsgD,
        botD: fcDepth,
        label: t('Displacement Fluid'),
        heightStr: fmtH(fcDepth - topCsgD),
        mwStr: fmtMW(dispMw).full,
        color: '#D97706',
        bg: '#1E293B'
      });
    }

    // Shoe Track Cement inside Casing (between FC and Shoe)
    if (inp.shoe > fcDepth && yShoe > yFC) {
      const stMw = (inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0;
      dimensions.push({
        id: 'shoe_track',
        type: 'internal',
        track: 'internal',
        topY: yFC,
        botY: yShoe,
        topD: fcDepth,
        botD: inp.shoe,
        label: t('Shoe Track'),
        heightStr: fmtH(inp.shoe - fcDepth),
        mwStr: fmtMW(stMw).full,
        color: '#3E7D3A',
        bg: '#1E293B'
      });
    }

    // Annular Fluids:
    const annTopD = inp.model === 'subsea' ? (inp.hanger || mudlineFt) : mudlineFt;
    const topFluidD = inp.f1_vol > 0 ? res.f1_top : (inp.f2_vol > 0 ? res.f2_top : (inp.sp_vol > 0 ? res.sp_top : res.toc));

    // Annulus Hole Fluid / Original Mud
    if (topFluidD > annTopD && topFluidY > annTopY) {
      const holeMw = inp.mw || inp.hole_fluid_mw || 0;
      dimensions.push({
        id: 'hole_fluid',
        type: 'annulus',
        track: 'inner',
        topY: annTopY,
        botY: topFluidY,
        topD: annTopD,
        botD: topFluidD,
        label: t('Hole Fluid'),
        heightStr: fmtH(topFluidD - annTopD),
        mwStr: fmtMW(holeMw).full,
        color: '#64748B',
        bg: '#334155'
      });
    }

    // 1st Mud Wash
    if (inp.f1_vol > 0 && res.f1_top !== undefined) {
      const f1NextTop = inp.f2_vol > 0 ? res.f2_top : (inp.sp_vol > 0 ? res.sp_top : res.toc);
      const f1NextY = inp.f2_vol > 0 ? yF2 : (inp.sp_vol > 0 ? ySP : yTOC);
      if (f1NextTop > res.f1_top && f1NextY > yF1) {
        dimensions.push({
          id: 'f1_mud',
          type: 'annulus',
          track: 'inner',
          topY: yF1,
          botY: f1NextY,
          topD: res.f1_top,
          botD: f1NextTop,
          label: t('1st Mud Wash'),
          heightStr: fmtH(f1NextTop - res.f1_top),
          mwStr: fmtMW(inp.f1_mw).full,
          color: '#E07B39',
          bg: '#E07B39'
        });
      }
    }

    // 2nd Mud Wash
    if (inp.f2_vol > 0 && res.f2_top !== undefined) {
      const f2NextTop = inp.sp_vol > 0 ? res.sp_top : res.toc;
      const f2NextY = inp.sp_vol > 0 ? ySP : yTOC;
      if (f2NextTop > res.f2_top && f2NextY > yF2) {
        dimensions.push({
          id: 'f2_mud',
          type: 'annulus',
          track: 'inner',
          topY: yF2,
          botY: f2NextY,
          topD: res.f2_top,
          botD: f2NextTop,
          label: t('2nd Mud Wash'),
          heightStr: fmtH(f2NextTop - res.f2_top),
          mwStr: fmtMW(inp.f2_mw).full,
          color: '#9B59B6',
          bg: '#9B59B6'
        });
      }
    }

    // Spacer
    if (inp.sp_vol > 0 && res.sp_top !== undefined && res.toc > res.sp_top && yTOC > ySP) {
      dimensions.push({
        id: 'spacer',
        type: 'annulus',
        track: 'inner',
        topY: ySP,
        botY: yTOC,
        topD: res.sp_top,
        botD: res.toc,
        label: t('Spacer'),
        heightStr: fmtH(res.toc - res.sp_top),
        mwStr: fmtMW(inp.sp_mw).full,
        color: '#4A90D9',
        bg: '#4A90D9'
      });
    }

    // Lead Slurry
    if (inp.lead_vol > 0 && res.toc !== undefined && res.tail_top > res.toc && yTail > yTOC) {
      dimensions.push({
        id: 'lead_slurry',
        type: 'annulus',
        track: 'inner',
        topY: yTOC,
        botY: yTail,
        topD: res.toc,
        botD: res.tail_top,
        label: t('Lead Slurry'),
        heightStr: fmtH(res.tail_top - res.toc),
        mwStr: fmtMW(inp.lead_mw).full,
        color: '#15803D',
        bg: '#15803D'
      });
    }

    // Tail Slurry
    const tailStartD = (inp.lead_vol > 0 && res.tail_top > 0) ? res.tail_top : res.toc;
    const tailStartY = (inp.lead_vol > 0 && res.tail_top > 0) ? yTail : yTOC;
    const tailEndD = tdFt;
    const tailEndY = yTD;
    if (tailEndD > tailStartD && tailEndY > tailStartY && (inp.tail_vol > 0 || res.total_slurry > 0)) {
      const tailMw = (inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0;
      dimensions.push({
        id: 'tail_slurry',
        type: 'annulus',
        track: 'inner',
        topY: tailStartY,
        botY: tailEndY,
        topD: tailStartD,
        botD: tailEndD,
        label: t('Tail Slurry'),
        heightStr: fmtH(tailEndD - tailStartD),
        mwStr: fmtMW(tailMw).full,
        color: '#3E7D3A',
        bg: '#3E7D3A'
      });
    }

    const dimensionsFn = (window.CementingCommon && typeof window.CementingCommon.renderVerticalDimensions === 'function')
      ? window.CementingCommon.renderVerticalDimensions
      : null;

    if (dimensionsFn) {
      svg += dimensionsFn({
        dimensions,
        isMetric,
        ohLeft,
        ohRight,
        internalX: cx,
        innerTrackX: 505,
        outerTrackX: 645,
        extStartX: 475,
        minGap: 18,
        minY: 45,
        maxY: 765
      });
    }

    svg += `</svg>`;
    return svg;
  }

  /**
   * Bind Tap / Click on Schematic Layers to Show Tooltip
   */
  function bindSchematicLayerClicks(container) {
    const tooltip = container.querySelector('#cement-layer-tooltip');
    if (!tooltip) return;

    container.querySelectorAll('.cement-svg-layer').forEach(layer => {
      layer.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = layer.getAttribute('data-name');
        const depth = layer.getAttribute('data-depth');
        const vol = layer.getAttribute('data-vol');
        const mw = layer.getAttribute('data-mw');

        tooltip.style.display = 'block';
        tooltip.innerHTML = `
          <strong>${t(name)}</strong><br>
          <span>${t('Interval')}: ${depth}</span> · 
          <span>${t('Vol')}: ${vol}</span> · 
          <span>${t('Density')}: ${mw}</span>
        `;
      });
    });
  }

  /**
   * Localization & String helpers
   */
  function t(key, ...args) {
    let res = (window.I18n && typeof window.I18n.translate === 'function') ? window.I18n.translate(key) : key;
    if (args.length > 0) {
      args.forEach((val, i) => {
        res = res.replace(new RegExp(`\\{${i}\\}`, 'g'), val);
      });
    }
    return res;
  }

  function formatMiddleEllipsis(str, maxLen = 28) {
    if (!str || typeof str !== 'string' || str.length <= maxLen) return str;
    const charsToShow = maxLen - 3;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return str.slice(0, frontChars) + '...' + str.slice(str.length - backChars);
  }

  /**
   * "Report ready" Modal Dialog
   */
  function showReportReadyDialog(fileInfo) {
    if (!fileInfo) return;
    const existing = document.getElementById('cement-report-ready-modal');
    if (existing) existing.remove();

    const isSvg = fileInfo.fileName && fileInfo.fileName.endsWith('.svg');
    const displayFileName = formatMiddleEllipsis(fileInfo.fileName, 28);
    const formattedSize = window.CementingPDF && typeof window.CementingPDF.formatFileSize === 'function'
      ? window.CementingPDF.formatFileSize(fileInfo.size)
      : (fileInfo.size ? `${(fileInfo.size / 1024).toFixed(1)} KB` : '');

    const overlay = document.createElement('div');
    overlay.id = 'cement-report-ready-modal';
    overlay.className = 'cement-modal-overlay report-ready-overlay';

    overlay.innerHTML = `
      <div class="cement-modal-card report-ready-card" role="dialog" aria-modal="true" aria-labelledby="report-ready-title">
        <div class="report-ready-header">
          <div class="report-ready-icon-wrap ${isSvg ? 'svg-icon' : 'pdf-icon'}">
            ${isSvg ? `
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            ` : `
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            `}
          </div>
          <div>
            <h3 class="cement-modal-title report-ready-title" id="report-ready-title">${t('Report ready')}</h3>
            <span class="report-ready-status">${isSvg ? t('Vector schematic generated') : t('Engineering report generated')}</span>
          </div>
        </div>

        <div class="report-ready-filebox">
          <div class="report-ready-fileinfo">
            <span class="report-ready-filename" title="${fileInfo.fileName}">${displayFileName}</span>
            ${formattedSize ? `<span class="report-ready-size-badge">${formattedSize}</span>` : ''}
          </div>
        </div>

        <div class="report-ready-notice" id="report-ready-notice" style="display:none;"></div>

        <div class="report-ready-actions">
          <button type="button" class="btn report-btn-action report-btn-open" id="btn-report-open">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>${t('Open')}</span>
          </button>
          
          <button type="button" class="btn report-btn-action report-btn-share" id="btn-report-share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>${t('Share / Save')}</span>
          </button>

          <button type="button" class="btn report-btn-action report-btn-done" id="btn-report-done">
            <span>${t('Done')}</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const noticeEl = overlay.querySelector('#report-ready-notice');
    const openBtn = overlay.querySelector('#btn-report-open');
    const shareBtn = overlay.querySelector('#btn-report-share');
    const doneBtn = overlay.querySelector('#btn-report-done');

    const closeModal = () => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 200);
    };

    doneBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    openBtn.onclick = async () => {
      noticeEl.style.display = 'none';
      openBtn.disabled = true;
      try {
        if (window.CementingPDF && typeof window.CementingPDF.openReportFile === 'function') {
          await window.CementingPDF.openReportFile(fileInfo);
        } else {
          throw new Error('File opener is not available');
        }
      } catch (err) {
        console.warn('Open report error:', err);
        noticeEl.style.display = 'block';
        if (err && err.isActivityNotFound) {
          const noViewerMsg = isSvg ? t('No SVG viewer installed.') : t('No PDF viewer installed. Would you like to share or save the file instead?');
          noticeEl.innerHTML = `
            <div class="report-notice-warning" style="display:flex; flex-direction:column; gap:8px;">
              <span>${noViewerMsg}</span>
              <button type="button" class="btn report-btn-share" id="btn-report-share-suggest" style="padding:7px 12px; font-size:0.78rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>${t('Share / Save')}</span>
              </button>
            </div>
          `;
          const suggestShareBtn = noticeEl.querySelector('#btn-report-share-suggest');
          if (suggestShareBtn) {
            suggestShareBtn.onclick = () => shareBtn.click();
          }
        } else {
          noticeEl.innerHTML = `
            <div class="report-notice-error">
              <span>${err.message || t('File not found after save.')}</span>
            </div>
          `;
        }
      } finally {
        openBtn.disabled = false;
      }
    };

    shareBtn.onclick = async () => {
      shareBtn.disabled = true;
      try {
        if (window.CementingPDF && typeof window.CementingPDF.shareReportFile === 'function') {
          await window.CementingPDF.shareReportFile(fileInfo);
        } else {
          throw new Error('Share is not available');
        }
      } catch (err) {
        console.warn('Share report error:', err);
        noticeEl.style.display = 'block';
        noticeEl.innerHTML = `
          <div class="report-notice-error">
            <span>${err.message || t('An unexpected error occurred while saving the report.')}</span>
          </div>
        `;
      } finally {
        shareBtn.disabled = false;
      }
    };
  }

  function showReportErrorDialog(title, message, onRetry) {
    const existing = document.getElementById('cement-report-ready-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cement-report-ready-modal';
    overlay.className = 'cement-modal-overlay report-ready-overlay';

    overlay.innerHTML = `
      <div class="cement-modal-card report-ready-card" role="dialog" aria-modal="true">
        <div class="report-ready-header">
          <div class="report-ready-icon-wrap error-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <h3 class="cement-modal-title report-ready-title">${title || t('Export failed')}</h3>
          </div>
        </div>

        <div class="cement-modal-desc" style="margin-top:8px; margin-bottom:18px;">
          ${message || t('An unexpected error occurred while saving the report.')}
        </div>

        <div class="cement-modal-actions">
          <button type="button" class="btn report-btn-done" id="btn-report-err-dismiss">
            ${t('Done')}
          </button>
          ${typeof onRetry === 'function' ? `
            <button type="button" class="btn report-btn-open" id="btn-report-err-retry" style="background:#0284c7; color:#fff;">
              ${t('Retry')}
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    const dismissBtn = overlay.querySelector('#btn-report-err-dismiss');
    if (dismissBtn) dismissBtn.onclick = closeModal;
    const retryBtn = overlay.querySelector('#btn-report-err-retry');
    if (retryBtn) {
      retryBtn.onclick = () => {
        closeModal();
        onRetry();
      };
    }
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };
  }

  /**
   * Export Schematic SVG to File
   */
  async function exportCementingSchematic() {
    const fsModal = document.getElementById('schematic-fullscreen-modal');
    let svgEl = null;
    if (fsModal && fsModal.classList.contains('active')) {
      const fsCanvas = document.getElementById('schematic-fs-canvas');
      if (fsCanvas) svgEl = fsCanvas.querySelector('svg');
    }
    if (!svgEl) {
      const viewport = document.getElementById('schematic-viewport');
      if (viewport) svgEl = viewport.querySelector('svg');
    }
    if (!svgEl) {
      svgEl = document.querySelector('#schematic-canvas svg, .cement-schematic-canvas svg, #schematic-svg-container svg');
    }
    if (!svgEl) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const activeSection = cementingState.section || (cementingState.inputs && cementingState.inputs.name) || 'Subsea';
      const fileName = window.CementingPDF && typeof window.CementingPDF.buildSanitizedFileName === 'function'
        ? window.CementingPDF.buildSanitizedFileName(cementingState.inputs.name, activeSection, 'Subsea', 'svg')
        : `${(cementingState.inputs.name || 'cementing_schematic').replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;

      if (window.CementingPDF && typeof window.CementingPDF.saveReportToFile === 'function') {
        const savedFile = await window.CementingPDF.saveReportToFile(svgData, fileName, false, 'image/svg+xml');
        showReportReadyDialog(savedFile);
      } else {
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export SVG schematic:', err);
      showReportErrorDialog(
        t('Export failed'),
        err.message || t('An unexpected error occurred while saving the report.'),
        () => exportCementingSchematic()
      );
    }
  }

  root.openCementingModule = openCementingModule;
  root.renderCementingScreen = renderCementingScreen;
  root.loadSavedCementingJob = loadSavedCementingJob;
  root.deleteSavedCementingJob = deleteSavedCementingJob;
  root.exportCementingSchematic = exportCementingSchematic;
  root.showReportReadyDialog = showReportReadyDialog;
  root.showReportErrorDialog = showReportErrorDialog;
  root.openSchematicFullscreenModal = openSchematicFullscreenModal;
  root.closeSchematicFullscreenModal = closeSchematicFullscreenModal;
  root.renderWellCementingSchematic = renderWellCementingSchematic;
  root.getEngineInputs = getEngineInputs;
  root.SECTION_PRESETS = SECTION_PRESETS;
  root.cementingState = cementingState;

  if (typeof window !== 'undefined') {
    window.openCementingModule = openCementingModule;
    window.renderCementingScreen = renderCementingScreen;
    window.toggleCementingCard = root.toggleCementingCard;
    window.loadSavedCementingJob = loadSavedCementingJob;
    window.deleteSavedCementingJob = deleteSavedCementingJob;
    window.exportCementingSchematic = exportCementingSchematic;
    window.showReportReadyDialog = showReportReadyDialog;
    window.showReportErrorDialog = showReportErrorDialog;
    window.openSchematicFullscreenModal = openSchematicFullscreenModal;
    window.closeSchematicFullscreenModal = closeSchematicFullscreenModal;
    window.renderWellCementingSchematic = renderWellCementingSchematic;
    window.getEngineInputs = getEngineInputs;
    window.SECTION_PRESETS = SECTION_PRESETS;
    window.cementingState = cementingState;

    window.addEventListener('languageChanged', () => {
      const subseaScreen = document.getElementById('screen-cement-planner-subsea') || document.getElementById('screen-cementing');
      if (subseaScreen && subseaScreen.classList.contains('active')) {
        renderCementingScreen();
      }
    });

    window.addEventListener('unitSystemChanged', () => {
      cementingState.unit = getStoredUnit();
      cementingState.capUnit = getStoredCapUnit();
      const subseaScreen = document.getElementById('screen-cement-planner-subsea') || document.getElementById('screen-cementing');
      if (subseaScreen && subseaScreen.classList.contains('active')) {
        renderCementingScreen();
      }
    });
  }

})(typeof window !== 'undefined' ? window : this);
