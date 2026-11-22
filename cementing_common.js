/**
 * Common Cementing Module Utilities & Shared Components
 * Drilling Toolkit Web Runtime
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.CementingCommon = exports;
    // Also expose core tubular data and helpers directly on root for backward compatibility
    root.CAPACITY_DATA = exports.CAPACITY_DATA;
    root.CASING_OD_LIST = exports.CASING_OD_LIST;
    root.normalizeOd = exports.normalizeOd;
    root.getCasingOptions = exports.getCasingOptions;
    root.getHoleOptions = exports.getHoleOptions;
    root.getDrillPipeOptions = exports.getDrillPipeOptions;
    root.FLUID_COLORS = exports.FLUID_COLORS;
    root.renderFluidLegendHtml = exports.renderFluidLegendHtml;
    root.getFluidLegendItems = exports.getFluidLegendItems;
    root.relaxSchematicMarkers = exports.relaxSchematicMarkers;
    root.renderSchematicCallouts = exports.renderSchematicCallouts;
    root.formatVol = exports.formatVol;
    root.formatDensity = exports.formatDensity;
    root.formatPressure = exports.formatPressure;
    root.formatPumpOutput = exports.formatPumpOutput;
    root.getUnitSystem = exports.getUnitSystem;
    root.getActiveUnit = exports.getActiveUnit;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 7 Distinct, Non-Overlapping Schematic Fluid Colors
  const FLUID_COLORS = Object.freeze({
    holeFluid: '#C9D6DF',      // Cool Slate Gray (Original Well Mud in Annulus)
    displacement: '#F2D388',   // Warm Amber Gold (Displacement inside Casing / DP)
    mud1: '#E07B39',           // Burnt Orange (1st Pumping Mud)
    mud2: '#9B59B6',           // Royal Purple (2nd Pumping Mud)
    spacer: '#4A90D9',         // Cobalt Blue (Spacer)
    lead: '#B5D99C',           // Light Sage Green (Lead Slurry)
    tail: '#3E7D3A'            // Deep Forest Green (Tail Slurry)
  });

  const M_PER_FT = 0.3048;
  const FT_PER_M = 1 / 0.3048;

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

  function getUnitSystem() {
    if (typeof window !== 'undefined' && window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function') {
      return window.UnitsEngine.getUnitSystem();
    }
    return 'mixed';
  }

  function getActiveUnit(quantityType, fallbackUnit) {
    if (typeof window !== 'undefined' && window.UnitsEngine && typeof window.UnitsEngine.getUnit === 'function') {
      return window.UnitsEngine.getUnit(quantityType, fallbackUnit);
    }
    return fallbackUnit;
  }

  function formatCapValue(valBblFt, unit) {
    const v = Number(valBblFt) || 0;
    const u = (unit || getActiveUnit('capacity', 'bbl/m')).toUpperCase();
    if (u === 'BBL/FT') {
      return v.toFixed(5);
    }
    if (u === 'L/M' || u === 'LTR/M') {
      return (v * 158.9873 / M_PER_FT).toFixed(2);
    }
    // Default: BBL/M
    return (v / M_PER_FT).toFixed(5);
  }

  function parseCapValue(rawVal, unit) {
    const parsed = parseFloat(String(rawVal).replace(',', '.')) || 0;
    const u = (unit || getActiveUnit('capacity', 'bbl/m')).toUpperCase();
    if (u === 'BBL/FT') {
      return parsed;
    }
    if (u === 'L/M' || u === 'LTR/M') {
      return (parsed * M_PER_FT) / 158.9873;
    }
    // Default: BBL/M -> BBL/FT
    return parsed * M_PER_FT;
  }

  function formatVol(volBbl) {
    const v = Number(volBbl) || 0;
    const sys = getUnitSystem();
    if (sys === 'si') {
      return { val: (v * 0.158987294928).toFixed(2), unit: 'm³', full: (v * 0.158987294928).toFixed(2) + ' m³' };
    }
    return { val: v.toFixed(1), unit: 'bbl', full: v.toFixed(1) + ' bbl' };
  }

  function formatDensity(mwPpg) {
    if (mwPpg === undefined || mwPpg === null || isNaN(Number(mwPpg))) return { val: '-', unit: '', full: '-' };
    const v = Number(mwPpg);
    const sys = getUnitSystem();
    if (sys === 'si') {
      return { val: (v * 0.119826427317).toFixed(2), unit: 'SG', full: (v * 0.119826427317).toFixed(2) + ' SG' };
    }
    return { val: v.toFixed(2), unit: 'ppg', full: v.toFixed(2) + ' ppg' };
  }

  function formatPressure(psiVal) {
    if (psiVal === undefined || psiVal === null || isNaN(Number(psiVal))) return { val: '-', unit: '', full: '-' };
    const v = Number(psiVal);
    const sys = getUnitSystem();
    if (sys === 'si') {
      return { val: (v * 0.06894757293168).toFixed(1), unit: 'bar', full: (v * 0.06894757293168).toFixed(1) + ' bar' };
    }
    return { val: v.toFixed(0), unit: 'psi', full: v.toFixed(0) + ' psi' };
  }

  function formatPumpOutput(bblStk) {
    const v = Number(bblStk) || 0;
    const sys = getUnitSystem();
    if (sys === 'si') {
      return { val: (v * 158.987294928).toFixed(1), unit: 'L/stk', full: (v * 158.987294928).toFixed(1) + ' L/stk' };
    }
    return { val: v.toFixed(3), unit: 'bbl/stk', full: v.toFixed(3) + ' bbl/stk' };
  }

  function formatMetricDepth(ftVal, isMetric) {
    const val = Number(ftVal) || 0;
    return isMetric ? (val * M_PER_FT).toFixed(1) : val.toFixed(1);
  }

  function formatMetricDist(ftVal, isMetric) {
    const val = Number(ftVal) || 0;
    return isMetric ? (val * M_PER_FT).toFixed(1) : val.toFixed(1);
  }

  function t(key) {
    if (window.I18n && typeof window.I18n.translate === 'function') {
      return window.I18n.translate(key);
    }
    return key;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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

      const maxPanY = Math.max(0, (cvH * scale - vpH) / 2 + 16);
      const minPanY = -maxPanY;
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

    // Touch interaction
    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isTouching = false;
    let isPinching = false;
    let initialPinchDist = 0;
    let initialPinchScale = 1.0;
    let touchMode = null;
    let lastTapTime = 0;

    viewportEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        touchMode = 'pinch';
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialPinchScale = scale;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapTime < 280) {
          // Double-tap to toggle 100% <-> 200%
          if (scale > 1.05) {
            reset();
          } else {
            setZoom(2.0, true);
          }
          lastTapTime = 0;
          e.preventDefault();
          return;
        }
        lastTapTime = now;

        isTouching = true;
        isPinching = false;
        touchMode = null;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        lastTouchX = touchStartX;
        lastTouchY = touchStartY;
      }
    }, { passive: false });

    viewportEl.addEventListener('touchmove', (e) => {
      if (isPinching && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (initialPinchDist > 0) {
          const ratio = dist / initialPinchDist;
          setZoom(initialPinchScale * ratio, false);
        }
        e.preventDefault();
      } else if (isTouching && e.touches.length === 1) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const dx = currentX - lastTouchX;
        const dy = currentY - lastTouchY;

        if (scale > 1.05) {
          const bounds = getPanBounds();
          const atTop = panY >= bounds.maxY - 1;
          const atBottom = panY <= bounds.minY + 1;
          const pullingDown = dy > 0;
          const pushingUp = dy < 0;

          if ((atTop && pullingDown) || (atBottom && pushingUp)) {
            // Hand off to page scroll
            touchMode = 'page-scroll';
            return;
          }

          panX += dx;
          panY += dy;
          clampPan();
          applyTransform(false);
          lastTouchX = currentX;
          lastTouchY = currentY;
          e.preventDefault();
        }
      }
    }, { passive: false });

    viewportEl.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) isPinching = false;
      if (e.touches.length === 0) {
        isTouching = false;
        touchMode = null;
        clampPan();
        applyTransform(true);
      }
    }, { passive: true });

    viewportEl.addEventListener('touchcancel', () => {
      isTouching = false;
      isPinching = false;
      touchMode = null;
    }, { passive: true });

    // Mouse drag for desktop / emulator
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseStartY = 0;

    viewportEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isMouseDown = true;
      mouseStartX = e.clientX - panX;
      mouseStartY = e.clientY - panY;
      viewportEl.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      if (scale <= 1.0) return;
      panX = e.clientX - mouseStartX;
      panY = e.clientY - mouseStartY;
      clampPan();
      applyTransform(false);
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        viewportEl.style.cursor = scale > 1.0 ? 'grab' : 'default';
        applyTransform(true);
      }
    });

    // Wheel zoom
    viewportEl.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey || scale > 1.0) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setZoom(scale + delta, true);
      }
    }, { passive: false });

    updateUI();
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
    if (subtitleEl) subtitleEl.textContent = subtitleText || 'Vertical Well Profile';
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

  function bindSchematicLayerClicks(container) {
    const tooltip = container.querySelector('#cement-layer-tooltip') || container.querySelector('.cement-layer-tooltip');
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
          <span>${t('Interval')}: ${escapeHtml(depth)}</span> · 
          <span>${t('Vol')}: ${escapeHtml(vol)}</span> · 
          <span>${t('Density')}: ${escapeHtml(mw)}</span>
        `;
      });
    });
  }

  /**
   * Pumping Sequence Table generator
   */
  function renderPumpingSequenceTable(sequence, totalPumped, unit = 'ft') {
    const isMetric = unit === 'm';
    const rows = (sequence || []).map(step => `
      <tr class="cement-pumping-row">
        <td class="step-num" style="font-weight:700; color:var(--text-secondary); width:40px;">${step.step}</td>
        <td class="step-name" style="font-weight:600; color:var(--text-primary);">${t(step.name)}</td>
        <td class="step-vol" style="text-align:right; font-family:'Roboto Mono',monospace; font-weight:700;">${formatVol(step.volume).val} <span style="font-size:0.75rem; color:var(--text-secondary);">${formatVol(step.volume).unit}</span></td>
        <td class="step-mw" style="text-align:right; font-family:'Roboto Mono',monospace; color:var(--text-secondary);">${step.density > 0 ? formatDensity(step.density).full : '—'}</td>
      </tr>
    `).join('');

    return `
      <div class="cement-pumping-table-wrapper" style="overflow-x:auto;">
        <table class="cement-pumping-table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--text-secondary); font-size:0.7rem; text-transform:uppercase;">
              <th style="padding:6px 8px; text-align:left;">#</th>
              <th style="padding:6px 8px; text-align:left;">${t('Fluid / Step')}</th>
              <th style="padding:6px 8px; text-align:right;">${t('Volume')}</th>
              <th style="padding:6px 8px; text-align:right;">${t('Density')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border-subtle); font-weight:700;">
              <td colspan="2" style="padding:8px 8px; color:var(--text-primary);">${t('Total Pumped')}</td>
              <td style="padding:8px 8px; text-align:right; font-family:'Roboto Mono',monospace; color:var(--primary); font-size:0.95rem;">${formatVol(totalPumped).val} <span style="font-size:0.75rem;">${formatVol(totalPumped).unit}</span></td>
              <td style="padding:8px 8px; text-align:right; color:var(--text-secondary);">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  /**
   * Fluid Legend Model & Items Generator
   */
  function getFluidLegendItems(inp, res, isSurface) {
    inp = inp || {};
    res = res || {};

    const holeMw = Number(inp.hole_fluid_mw || inp.mw) || 0;
    const dispMw = Number(inp.disp_mw || inp.mw) || 0;
    const dispVol = Number(res.disp_tot) || 0;

    const f1Mw = Number(inp.f1_mw) || 0;
    const f1Vol = Number(inp.f1_vol) || 0;

    const f2Mw = Number(inp.f2_mw) || 0;
    const f2Vol = Number(inp.f2_vol) || 0;

    const spMw = Number(inp.sp_mw) || 0;
    const spVol = Number(inp.sp_vol) || 0;

    const leadMw = Number(inp.lead_mw) || 0;
    const leadVol = Number(inp.lead_vol) || 0;

    const tailMw = Number(inp.tail_mw) || 0;
    const tailVol = Number(inp.tail_vol) || 0;

    return [
      {
        id: 'hole_fluid',
        name: 'Hole Fluid',
        color: FLUID_COLORS.holeFluid,
        density: holeMw > 0 ? formatDensity(holeMw).full : '—',
        volume: 'In Hole',
        active: true
      },
      {
        id: 'displacement',
        name: 'Displacement Fluid',
        color: FLUID_COLORS.displacement,
        density: dispMw > 0 ? formatDensity(dispMw).full : '—',
        volume: dispVol > 0 ? formatVol(dispVol).full : '—',
        active: dispVol > 0
      },
      {
        id: 'mud1',
        name: '1st Mud',
        color: FLUID_COLORS.mud1,
        density: f1Mw > 0 ? formatDensity(f1Mw).full : '—',
        volume: f1Vol > 0 ? formatVol(f1Vol).full : formatVol(0).full,
        active: f1Vol > 0
      },
      {
        id: 'mud2',
        name: '2nd Mud',
        color: FLUID_COLORS.mud2,
        density: f2Mw > 0 ? formatDensity(f2Mw).full : '—',
        volume: f2Vol > 0 ? formatVol(f2Vol).full : formatVol(0).full,
        active: f2Vol > 0
      },
      {
        id: 'spacer',
        name: 'Spacer',
        color: FLUID_COLORS.spacer,
        density: spMw > 0 ? formatDensity(spMw).full : '—',
        volume: spVol > 0 ? formatVol(spVol).full : formatVol(0).full,
        active: spVol > 0
      },
      {
        id: 'lead',
        name: 'Lead Slurry',
        color: FLUID_COLORS.lead,
        density: leadMw > 0 ? formatDensity(leadMw).full : '—',
        volume: leadVol > 0 ? formatVol(leadVol).full : formatVol(0).full,
        active: leadVol > 0
      },
      {
        id: 'tail',
        name: 'Tail Slurry',
        color: FLUID_COLORS.tail,
        density: tailMw > 0 ? formatDensity(tailMw).full : '—',
        volume: tailVol > 0 ? formatVol(tailVol).full : formatVol(0).full,
        active: tailVol > 0
      }
    ];
  }

  /**
   * Render Responsive Color-Coded Fluid Legend Component
   */
  function renderFluidLegendHtml(inp, res, isSurface) {
    const items = getFluidLegendItems(inp, res, isSurface);

    const itemsHtml = items.map(item => `
      <div class="cement-fluid-legend-item" style="display:flex; align-items:center; gap:8px; min-width:0; padding:3px 0;">
        <span class="cement-fluid-legend-swatch" style="width:12px; height:12px; min-width:12px; border-radius:3px; background-color:${item.color}; border:1px solid rgba(0,0,0,0.15); box-sizing:border-box; flex-shrink:0;"></span>
        <div class="cement-fluid-legend-info" style="min-width:0; flex:1; line-height:1.25;">
          <div class="cement-fluid-legend-name" style="font-size:0.75rem; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${t(item.name)}
          </div>
          <div class="cement-fluid-legend-meta" style="font-size:0.68rem; color:var(--text-secondary); font-family:'Roboto Mono',monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${(typeof item.volume === 'string' && item.volume === 'In Hole') ? t('In Hole') : item.volume} · ${item.density}
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="cement-fluid-legend-card" style="margin-top:14px; padding:12px 14px; background:var(--card-bg, #FFFFFF); border:1px solid var(--border-subtle); border-radius:10px;">
        <div class="cement-fluid-legend-header" style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
          <span>${t('Fluid Placement Color Key')}</span>
          <span style="font-size:0.68rem; font-weight:500; text-transform:none;">${t('7 Layers')}</span>
        </div>
        <div class="cement-fluid-legend-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:6px 12px;">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Automatic Vertical Collision Avoidance (Label De-Overlapping)
   * Enforces minimum vertical spacing (minGap, default 18px) between adjacent markers.
   * Handles identical depths via symmetrical cluster pre-centering.
   */
  function relaxSchematicMarkers(markers, minGap = 18, minY = 40, maxY = 765) {
    if (!markers || markers.length === 0) return [];

    // Make a shallow copy with mutable displayY
    const list = markers.map(m => ({ ...m, displayY: m.targetY }));

    // Sort ascending by true target depth Y
    list.sort((a, b) => a.targetY - b.targetY);

    // 1. Symmetrical cluster pre-centering for identical or near-identical depths (<= 4px)
    let i = 0;
    while (i < list.length) {
      let j = i;
      while (j + 1 < list.length && Math.abs(list[j + 1].targetY - list[j].targetY) <= 4) {
        j++;
      }
      const count = j - i + 1;
      if (count > 1) {
        const clusterTargetY = list[i].targetY;
        const startOffset = -((count - 1) / 2) * minGap;
        for (let k = 0; k < count; k++) {
          list[i + k].displayY = clusterTargetY + startOffset + k * minGap;
        }
      } else {
        list[i].displayY = list[i].targetY;
      }
      i = j + 1;
    }

    // 2. Forward pass: ensure >= minGap separation
    for (let k = 1; k < list.length; k++) {
      if (list[k].displayY < list[k - 1].displayY + minGap) {
        list[k].displayY = list[k - 1].displayY + minGap;
      }
    }

    // 3. Backward pass: pull back if bottom exceeds maxY
    if (list[list.length - 1].displayY > maxY) {
      list[list.length - 1].displayY = maxY;
      for (let k = list.length - 2; k >= 0; k--) {
        if (list[k].displayY > list[k + 1].displayY - minGap) {
          list[k].displayY = list[k + 1].displayY - minGap;
        }
      }
    }

    // 4. Top clamp pass: push forward if top exceeds minY
    if (list[0].displayY < minY) {
      list[0].displayY = minY;
      for (let k = 1; k < list.length; k++) {
        if (list[k].displayY < list[k - 1].displayY + minGap) {
          list[k].displayY = list[k - 1].displayY + minGap;
        }
      }
    }

    return list;
  }

  /**
   * Render Schematic Depth Callouts (Balanced Left and Right sides)
   * Renders high-contrast rounded pill badges with crisp angled leader lines.
   */
  function renderSchematicCallouts(opts) {
    const {
      leftMarkers = [],
      rightMarkers = [],
      ohLeft = 195,
      ohRight = 305,
      leftTagRight = 135,
      rightTagX = 365,
      minGap = 18,
      minY = 40,
      maxY = 765
    } = opts;

    let svg = '';

    // 1. Process and relax left markers (Structural / Geometry)
    const relaxedLeft = relaxSchematicMarkers(leftMarkers, minGap, minY, maxY);
    relaxedLeft.forEach(m => {
      const tagW = Math.max(104, Math.min(145, Math.round(m.label.length * 5.6 + 10)));
      const tagX = leftTagRight - tagW;
      const tagH = 16;
      const cy = Math.round(m.displayY * 10) / 10;
      const ty = Math.round(m.targetY * 10) / 10;
      const bg = m.bg || '#1E293B';
      const text = m.text || '#FFFFFF';

      svg += `<g class="schematic-callout-pill schematic-callout-left" data-side="left" data-target-y="${ty}" data-relaxed-y="${cy}">`;
      // Angled or direct leader line
      if (Math.abs(cy - ty) > 1.5) {
        svg += `
          <path class="schematic-leader-line" d="M ${leftTagRight} ${cy} L ${leftTagRight + 12} ${cy} L ${leftTagRight + 26} ${ty} L ${ohLeft} ${ty}" fill="none" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="1.2"/>
        `;
      } else {
        svg += `
          <line class="schematic-leader-direct" x1="${leftTagRight}" y1="${ty}" x2="${ohLeft}" y2="${ty}" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="1.2"/>
        `;
      }
      // Tick mark dot at wellbore edge
      svg += `<circle class="schematic-tick-dot" cx="${ohLeft}" cy="${ty}" r="2" fill="${bg}"/>`;
      // Pill badge rect & text
      svg += `
        <rect x="${tagX}" y="${cy - tagH / 2}" width="${tagW}" height="${tagH}" rx="4" ry="4" fill="${bg}" opacity="0.95" stroke="#FFFFFF" stroke-width="0.5"/>
        <text x="${tagX + tagW / 2}" y="${cy + 3.5}" font-size="${m.label.length > 20 ? '8' : '8.8'}" font-weight="700" fill="${text}" text-anchor="middle" font-family="'Outfit', sans-serif">${m.label}</text>
      </g>`;
    });

    // 2. Process and relax right markers (Environmental & Fluid Tops)
    const relaxedRight = relaxSchematicMarkers(rightMarkers, minGap, minY, maxY);
    relaxedRight.forEach(m => {
      const tagW = Math.max(104, Math.min(145, Math.round(m.label.length * 5.6 + 10)));
      const tagX = rightTagX;
      const tagH = 16;
      const cy = Math.round(m.displayY * 10) / 10;
      const ty = Math.round(m.targetY * 10) / 10;
      const bg = m.bg || '#1E293B';
      const text = m.text || '#FFFFFF';

      svg += `<g class="schematic-callout-pill schematic-callout-right" data-side="right" data-target-y="${ty}" data-relaxed-y="${cy}">`;
      // Angled or direct leader line
      if (Math.abs(cy - ty) > 1.5) {
        svg += `
          <path class="schematic-leader-line" d="M ${ohRight} ${ty} L ${tagX - 26} ${ty} L ${tagX - 12} ${cy} L ${tagX} ${cy}" fill="none" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="1.2"/>
        `;
      } else {
        svg += `
          <line class="schematic-leader-direct" x1="${ohRight}" y1="${ty}" x2="${tagX}" y2="${ty}" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="1.2"/>
        `;
      }
      // Tick mark dot at wellbore edge
      svg += `<circle class="schematic-tick-dot" cx="${ohRight}" cy="${ty}" r="2" fill="${bg}"/>`;
      // Pill badge rect & text
      svg += `
        <rect x="${tagX}" y="${cy - tagH / 2}" width="${tagW}" height="${tagH}" rx="4" ry="4" fill="${bg}" opacity="0.95" stroke="#FFFFFF" stroke-width="0.5"/>
        <text x="${tagX + tagW / 2}" y="${cy + 3.5}" font-size="${m.label.length > 20 ? '8' : '8.8'}" font-weight="700" fill="${text}" text-anchor="middle" font-family="'Outfit', sans-serif">${m.label}</text>
      </g>`;
    });

    return svg;
  }

  return {
    M_PER_FT,
    FT_PER_M,
    CAPACITY_DATA,
    CASING_OD_LIST,
    FLUID_COLORS,
    normalizeOd,
    getCasingOptions,
    getHoleOptions,
    getDrillPipeOptions,
    formatCapValue,
    parseCapValue,
    formatMetricDepth,
    formatMetricDist,
    t,
    escapeHtml,
    escapeAttr,
    createSchematicViewer,
    openSchematicFullscreenModal,
    closeSchematicFullscreenModal,
    bindSchematicLayerClicks,
    renderPumpingSequenceTable,
    getFluidLegendItems,
    renderFluidLegendHtml,
    getUnitSystem,
    getActiveUnit,
    formatVol,
    formatDensity,
    formatPressure,
    formatPumpOutput,
    relaxSchematicMarkers,
    renderSchematicCallouts
  };
}));
