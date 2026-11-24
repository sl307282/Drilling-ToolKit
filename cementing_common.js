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
    root.renderVerticalDimensions = exports.renderVerticalDimensions;
    root.renderWellCementingSchematic = exports.renderWellCementingSchematic;
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

  /**
   * Render Vertical Span Dimension Lines & Brackets for Well Zones & Fluid Columns
   * Renders crisp engineering extension lines, end ticks, arrows (▲/▼), and rounded pill badges.
   * Features automatic thin-interval detection and offset leader lines to prevent overlapping.
   */
  function renderVerticalDimensions(opts) {
    const {
      dimensions = [],
      isMetric = false,
      ohLeft = 195,
      ohRight = 305,
      internalX = 250,
      innerTrackX = 505,
      outerTrackX = 645,
      extStartX = 480,
      minGap = 18,
      minY = 40,
      maxY = 765
    } = opts;

    if (!dimensions || !dimensions.length) return '';

    let svg = `<g class="schematic-dimensions-layer">`;

    // Separate dimensions by track
    const internalDims = [];
    const innerDims = [];
    const outerDims = [];

    dimensions.forEach(d => {
      const topY = Math.round((Number(d.topY) || 0) * 10) / 10;
      const botY = Math.round((Number(d.botY) || 0) * 10) / 10;
      if (botY - topY < 0.5) return; // skip degenerate spans

      const fullLabel = d.mwStr ? `${d.label}: ${d.heightStr} (${d.mwStr})` : `${d.label}: ${d.heightStr}`;
      const item = Object.assign({}, d, {
        topY,
        botY,
        midY: Math.round(((topY + botY) / 2) * 10) / 10,
        spanH: botY - topY,
        fullLabel,
        color: d.color || '#4A90D9',
        bg: d.bg || '#1E293B',
        text: d.text || '#FFFFFF'
      });

      if (item.type === 'internal' || item.track === 'internal') {
        internalDims.push(item);
      } else if (item.track === 'outer') {
        outerDims.push(item);
      } else {
        innerDims.push(item);
      }
    });

    // 1. Render Internal Dimensions (e.g. Displacement Fluid inside Casing / String)
    internalDims.forEach(d => {
      const x = internalX;
      const tagW = Math.max(80, Math.min(150, Math.round(d.fullLabel.length * 5.0 + 12)));
      const tagH = 16;
      const ty = d.midY;

      svg += `<g class="schematic-dim-item schematic-dim-internal" data-id="${d.id}" data-top-y="${d.topY}" data-bot-y="${d.botY}">`;
      
      // Vertical dimension line
      svg += `<line class="schematic-dim-line" x1="${x}" y1="${d.topY}" x2="${x}" y2="${d.botY}" stroke="${d.color}" stroke-width="1.6" stroke-dasharray="3,2"/>`;
      
      // Top & bottom end ticks
      svg += `<line class="schematic-dim-tick" x1="${x - 6}" y1="${d.topY}" x2="${x + 6}" y2="${d.topY}" stroke="${d.color}" stroke-width="2"/>`;
      svg += `<line class="schematic-dim-tick" x1="${x - 6}" y1="${d.botY}" x2="${x + 6}" y2="${d.botY}" stroke="${d.color}" stroke-width="2"/>`;
      
      // Arrowheads (▲ / ▼)
      if (d.spanH >= 16) {
        svg += `<path class="schematic-dim-arrow" d="M ${x - 2.5} ${d.topY + 5} L ${x} ${d.topY} L ${x + 2.5} ${d.topY + 5}" fill="none" stroke="${d.color}" stroke-width="1.8" stroke-linecap="round"/>`;
        svg += `<path class="schematic-dim-arrow" d="M ${x - 2.5} ${d.botY - 5} L ${x} ${d.botY} L ${x + 2.5} ${d.botY - 5}" fill="none" stroke="${d.color}" stroke-width="1.8" stroke-linecap="round"/>`;
      }

      // Pill badge (centered over break/dimension line)
      svg += `
        <rect x="${x - tagW / 2}" y="${ty - tagH / 2}" width="${tagW}" height="${tagH}" rx="4" ry="4" fill="#0F172A" opacity="0.95" stroke="${d.color}" stroke-width="1"/>
        <text x="${x}" y="${ty + 3.5}" font-size="${d.fullLabel.length > 25 ? '7.8' : '8.4'}" font-weight="700" fill="${d.text}" text-anchor="middle" font-family="'Outfit', sans-serif">${d.fullLabel}</text>
      </g>`;
    });

    // 2. Process Inner & Outer Annular/Environmental Tracks with Collision Avoidance
    const finalInner = [];
    const finalOuter = outerDims.slice();

    innerDims.forEach(d => {
      if (d.spanH < 22) {
        // Thin interval -> offset to outer track with elbow leader line
        d.isOffset = true;
        finalOuter.push(d);
      } else {
        finalInner.push(d);
      }
    });

    // Relax pill display positions on inner track
    const relaxedInner = relaxSchematicMarkers(finalInner.map(d => ({
      dim: d,
      d: d.midY,
      targetY: d.midY
    })), minGap, minY, maxY);

    // Relax pill display positions on outer track
    const relaxedOuter = relaxSchematicMarkers(finalOuter.map(d => ({
      dim: d,
      d: d.midY,
      targetY: d.midY
    })), minGap, minY, maxY);

    // Helper to render track items
    function renderTrack(items, trackX, pillBaseX, isOuter) {
      items.forEach(item => {
        const d = item.dim;
        const cy = Math.round(item.displayY * 10) / 10;
        const ty = d.midY;
        const tagW = Math.max(80, Math.min(150, Math.round(d.fullLabel.length * 5.0 + 12)));
        const tagH = 16;
        const pillX = pillBaseX;

        svg += `<g class="schematic-dim-item ${isOuter ? 'schematic-dim-outer' : 'schematic-dim-inner'}" data-id="${d.id}" data-top-y="${d.topY}" data-bot-y="${d.botY}">`;

        // Horizontal extension lines from wellbore / depth marker edge to dimension track
        const extX = Math.min(extStartX, trackX - 10);
        svg += `
          <line class="schematic-ext-line" x1="${extX}" y1="${d.topY}" x2="${trackX + 5}" y2="${d.topY}" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="0.9" opacity="0.8"/>
          <line class="schematic-ext-line" x1="${extX}" y1="${d.botY}" x2="${trackX + 5}" y2="${d.botY}" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="0.9" opacity="0.8"/>
        `;

        // Vertical dimension line
        svg += `<line class="schematic-dim-line" x1="${trackX}" y1="${d.topY}" x2="${trackX}" y2="${d.botY}" stroke="${d.color}" stroke-width="1.8"/>`;

        // Top & bottom end ticks
        svg += `<line class="schematic-dim-tick" x1="${trackX - 4}" y1="${d.topY}" x2="${trackX + 4}" y2="${d.topY}" stroke="${d.color}" stroke-width="2"/>`;
        svg += `<line class="schematic-dim-tick" x1="${trackX - 4}" y1="${d.botY}" x2="${trackX + 4}" y2="${d.botY}" stroke="${d.color}" stroke-width="2"/>`;

        // Arrowheads (▲ / ▼)
        if (d.spanH >= 14) {
          svg += `<path class="schematic-dim-arrow" d="M ${trackX - 2.5} ${d.topY + 5} L ${trackX} ${d.topY} L ${trackX + 2.5} ${d.topY + 5}" fill="none" stroke="${d.color}" stroke-width="1.8" stroke-linecap="round"/>`;
          svg += `<path class="schematic-dim-arrow" d="M ${trackX - 2.5} ${d.botY - 5} L ${trackX} ${d.botY} L ${trackX + 2.5} ${d.botY - 5}" fill="none" stroke="${d.color}" stroke-width="1.8" stroke-linecap="round"/>`;
        }

        // Leader line to pill
        if (d.isOffset || Math.abs(cy - ty) > 1.5) {
          // Angled elbow leader line from (trackX, ty) to (pillX, cy)
          svg += `
            <path class="schematic-dim-leader" d="M ${trackX} ${ty} L ${pillX - 6} ${ty} L ${pillX} ${cy}" fill="none" stroke="#94A3B8" stroke-dasharray="2,2" stroke-width="1.2"/>
          `;
        } else {
          // Direct horizontal connection
          svg += `
            <line class="schematic-dim-leader" x1="${trackX}" y1="${ty}" x2="${pillX}" y2="${ty}" stroke="${d.color}" stroke-width="1.2"/>
          `;
        }

        // Pill badge
        svg += `
          <rect x="${pillX}" y="${cy - tagH / 2}" width="${tagW}" height="${tagH}" rx="4" ry="4" fill="${d.bg}" opacity="0.95" stroke="#FFFFFF" stroke-width="0.5"/>
          <text x="${pillX + tagW / 2}" y="${cy + 3.5}" font-size="${d.fullLabel.length > 25 ? '7.8' : '8.4'}" font-weight="700" fill="${d.text}" text-anchor="middle" font-family="'Outfit', sans-serif">${d.fullLabel}</text>
        </g>`;
      });
    }

    // Render inner track items (trackX = 505, pillBaseX = 514)
    renderTrack(relaxedInner, innerTrackX, innerTrackX + 9, false);

    // Render outer track items (trackX = 645, pillBaseX = 654)
    renderTrack(relaxedOuter, outerTrackX, outerTrackX + 9, true);

    svg += `</g>`;
    return svg;
  }


  /**
   * Subsea / Well Cementing Schematic SVG Generator
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

  return {
    renderWellCementingSchematic,
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
    renderSchematicCallouts,
    renderVerticalDimensions
  };
}));
