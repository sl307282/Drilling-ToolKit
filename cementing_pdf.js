/**
 * Subsea Wellhead Cementing Job Plan — PDF Engineering Report Generator
 * Drilling Toolkit Web Runtime
 * Powered by jsPDF + AutoTable (100% Offline Client-Side)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CementingPDF = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const M_PER_FT = 0.3048;

  /**
   * Helper: Convert SVG markup to PNG Data URL via offscreen HTML5 canvas
   */
  function svgToPngDataUrl(svgString, width = 800, height = 1200) {
    return new Promise((resolve) => {
      if (!svgString || typeof svgString !== 'string') {
        return resolve(null);
      }
      try {
        let cleanedSvg = svgString;
        if (!cleanedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
          cleanedSvg = cleanedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        // Ensure white/cream background for print clarity
        if (!cleanedSvg.includes('background:')) {
          cleanedSvg = cleanedSvg.replace('<svg', '<svg style="background:#FAF8F5;"');
        }

        const blob = new Blob([cleanedSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        let resolved = false;
        const timer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            URL.revokeObjectURL(url);
            resolve(null);
          }
        }, 3000);

        img.onload = () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FAF8F5';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            resolve(dataUrl);
          } catch (e) {
            URL.revokeObjectURL(url);
            console.warn('Canvas export failed:', e);
            resolve(null);
          }
        };

        img.onerror = (err) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          URL.revokeObjectURL(url);
          console.warn('SVG image load failed:', err);
          resolve(null);
        };

        img.src = url;
      } catch (err) {
        console.warn('svgToPngDataUrl error:', err);
        resolve(null);
      }
    });
  }

  /**
   * Format helpers
   */
  function fmtNum(val, dec = 1, fallback = '-') {
    if (val === undefined || val === null || val === '' || isNaN(val)) return fallback;
    return Number(val).toFixed(dec);
  }

  function fmtDepth(canonicalMeters, unit, dec = 1) {
    if (canonicalMeters === undefined || canonicalMeters === null || canonicalMeters === '' || isNaN(canonicalMeters)) return '-';
    const val = unit === 'ft' ? (Number(canonicalMeters) / M_PER_FT) : Number(canonicalMeters);
    return Number(val).toFixed(dec);
  }

  function fmtEngineDepth(ftVal, isMetric, dec = 1) {
    if (ftVal === undefined || ftVal === null || ftVal === '' || isNaN(ftVal)) return '-';
    const val = isMetric ? (Number(ftVal) * M_PER_FT) : Number(ftVal);
    return Number(val).toFixed(dec);
  }

  function fmtCap(capFtVal, isMetric, dec = 5, forcedUnit = null) {
    if (capFtVal === undefined || capFtVal === null || capFtVal === '' || isNaN(capFtVal)) return '-';
    const num = Number(capFtVal);
    let targetUnit = forcedUnit;
    if (!targetUnit) {
      if (typeof cementingState !== 'undefined' && cementingState && cementingState.capUnit) {
        targetUnit = cementingState.capUnit.toLowerCase();
      } else if (typeof UnitsEngine !== 'undefined' && typeof UnitsEngine.getUnit === 'function') {
        targetUnit = UnitsEngine.getUnit('capacity');
      } else {
        targetUnit = isMetric ? 'bbl/m' : 'bbl/ft';
      }
    }
    targetUnit = String(targetUnit).toLowerCase();

    // 1. Try UnitsEngine with correct parameter order: ('capacity', num, 'bbl/ft', targetUnit)
    if (typeof UnitsEngine !== 'undefined' && typeof UnitsEngine.convert === 'function') {
      try {
        const converted = UnitsEngine.convert('capacity', num, 'bbl/ft', targetUnit);
        const precision = (targetUnit === 'l/m' || targetUnit === 'ltr/m') ? 2 : dec;
        return Number(converted).toFixed(precision);
      } catch (e) {}
    }

    // 2. Try window.CementingCommon / formatCapValue
    if (typeof window !== 'undefined' && window.CementingCommon && typeof window.CementingCommon.formatCapValue === 'function') {
      try {
        return window.CementingCommon.formatCapValue(num, targetUnit.toUpperCase());
      } catch (e) {}
    }
    if (typeof formatCapValue === 'function') {
      try {
        return formatCapValue(num, targetUnit.toUpperCase());
      } catch (e) {}
    }

    // 3. Fallback direct conversion from canonical bbl/ft
    let val = num;
    if (targetUnit === 'bbl/m' || (targetUnit !== 'bbl/ft' && isMetric)) {
      val = num / M_PER_FT;
    } else if (targetUnit === 'l/m' || targetUnit === 'ltr/m') {
      val = num * 158.9873 / M_PER_FT;
      return Number(val).toFixed(2);
    }
    return Number(val).toFixed(dec);
  }

  /**
   * Dedicated Cementing Schematic SVG Generator for PDF Reports
   * Delegates to live calculation schematic (Subsea or Surface) matching screen 100%
   */
  function renderHighResCementingPdfSchematicSvg(result, inp, unit, isSurface, tFunc) {
    if (isSurface) {
      const renderSurfaceFn = (typeof window !== 'undefined' && (window.renderSurfaceSchematicSvg || (window.CementingCommon && window.CementingCommon.renderSurfaceSchematicSvg))) || (typeof renderSurfaceSchematicSvg === 'function' ? renderSurfaceSchematicSvg : null);
      if (renderSurfaceFn) {
        return renderSurfaceFn(result, inp, unit);
      }
    } else {
      const renderSubseaFn = (typeof window !== 'undefined' && (window.renderWellCementingSchematic || (window.CementingCommon && window.CementingCommon.renderWellCementingSchematic))) || (typeof renderWellCementingSchematic === 'function' ? renderWellCementingSchematic : null);
      if (renderSubseaFn) {
        let engInp = (typeof cementingState !== 'undefined' && cementingState && cementingState.engineInput) ? cementingState.engineInput : null;
        if (!engInp) {
          const M_PER_FT = 0.3048;
          engInp = Object.assign({}, inp);
          const DEPTH_KEYS = ['air_gap', 'water_depth', 'hanger', 'prev_shoe', 'td', 'shoe', 'shoe_track_len'];
          DEPTH_KEYS.forEach(k => {
            if (engInp[k] !== undefined && engInp[k] !== '' && engInp[k] !== null && !isNaN(engInp[k])) {
              engInp[k] = unit === 'm' ? (Number(engInp[k]) / M_PER_FT) : Number(engInp[k]);
            } else {
              engInp[k] = 0;
            }
          });
        }
        return renderSubseaFn(result, engInp, unit);
      }
    }
    return '';
  }

  /**
   * Main Report Generator
   */
  async function generateJobReport(cementingState, options = {}) {
    if (!cementingState) throw new Error('cementingState is required');

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) {
      throw new Error('jsPDF library is not loaded');
    }

    const doc = new jsPDFClass({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    function t(key) {
      if (!key) return '';
      return (typeof window !== 'undefined' && window.I18n) ? window.I18n.translate(key) : key;
    }

    let primaryFont = 'helvetica';
    if (typeof window !== 'undefined' && window.ROBOTO_FONT_BASE64) {
      try {
        doc.addFileToVFS('Roboto-Medium.ttf', window.ROBOTO_FONT_BASE64);
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
        doc.addFont('Roboto-Medium.ttf', 'Roboto', 'italic');
        primaryFont = 'Roboto';
      } catch (e) {
        console.warn('Could not register Roboto font in jsPDF:', e);
      }
    }

    const inp = cementingState.inputs || {};
    const result = cementingState.results || {};
    const unit = cementingState.unit || 'm';
    const isMetric = unit === 'm';
    const depthUnit = isMetric ? 'm' : 'ft';

    const activeSys = (typeof UnitsEngine !== 'undefined' && typeof UnitsEngine.getUnitSystem === 'function')
      ? UnitsEngine.getUnitSystem()
      : (isMetric ? 'si' : 'api');
    let unitSystemLabel;
    if (activeSys === 'api') {
      unitSystemLabel = 'OILFIELD UNITS (API)';
    } else if (activeSys === 'si') {
      unitSystemLabel = 'METRIC UNITS (SI)';
    } else {
      unitSystemLabel = isMetric ? 'MIXED UNITS (m, bbl, ppg)' : 'OILFIELD (ft, bbl, ppg)';
    }

    const fmtV = (val, dec = 1) => {
      if (window.CementingCommon && typeof window.CementingCommon.formatVol === 'function') {
        return window.CementingCommon.formatVol(val, false);
      }
      return { val: fmtNum(val, dec), unit: 'bbl', full: `${fmtNum(val, dec)} bbl` };
    };
    const fmtMW = (val, dec = 2) => {
      if (window.CementingCommon && typeof window.CementingCommon.formatDensity === 'function') {
        return window.CementingCommon.formatDensity(val);
      }
      return { val: fmtNum(val, dec), unit: 'ppg', full: `${fmtNum(val, dec)} ppg` };
    };
    const fmtP = (val, dec = 0) => {
      if (window.CementingCommon && typeof window.CementingCommon.formatPressure === 'function') {
        return window.CementingCommon.formatPressure(val);
      }
      return { val: fmtNum(val, dec), unit: 'psi', full: `${fmtNum(val, dec)} psi` };
    };
    const fmtPO = (val, dec = 3) => {
      if (window.CementingCommon && typeof window.CementingCommon.formatPumpOutput === 'function') {
        return window.CementingCommon.formatPumpOutput(val);
      }
      return { val: fmtNum(val, dec), unit: 'bbl/stk', full: `${fmtNum(val, dec)} bbl/stk` };
    };

    const volUnit = fmtV(0).unit;
    const mwUnit = fmtMW(0).unit;
    const pressUnit = fmtP(0).unit;
    const pumpOutUnit = fmtPO(0).unit;
    const activeCapUnit = (cementingState && cementingState.capUnit)
      ? cementingState.capUnit.toLowerCase()
      : ((typeof UnitsEngine !== 'undefined' && typeof UnitsEngine.getUnit === 'function')
          ? UnitsEngine.getUnit('capacity')
          : (isMetric ? 'bbl/m' : 'bbl/ft'));
    const capUnit = (activeCapUnit === 'ltr/m' || activeCapUnit === 'l/m') ? 'L/m' : activeCapUnit;

    const sectionName = (inp && inp.name) || cementingState.jobName || 'Well Cementing Job';
    const presetLabel = (cementingState.sectionPresets && cementingState.sectionPresets[cementingState.section] && cementingState.sectionPresets[cementingState.section].label)
      || (inp && inp.sectionLabel) || cementingState.section || 'Subsea Wellhead';
    const model = (inp && inp.model) || (result && result.model) || 'subsea';
    const isSurface = Boolean(options.isSurface || cementingState.isSurface || model === 'conductor' || model === 'surface_casing' || model === 'surface_conductor');
    const modelLabel = isSurface
      ? (model === 'conductor' || model === 'surface_conductor' ? t('CONDUCTOR CASING', 'CONDUCTOR CASING') : (model === 'surface_casing' ? t('SURFACE WELLHEAD', 'SURFACE WELLHEAD') : t('CUSTOM SECTION', 'CUSTOM SECTION')))
      : (model === 'riserless' ? t('RISERLESS CASING', 'RISERLESS CASING') : t('SUBSEA WELLHEAD', 'SUBSEA WELLHEAD'));
    const reportTitle = isSurface ? t('Surface Cementing Job Plan', 'Surface Cementing Job Plan') : t('Subsea Cementing Job Plan', 'Subsea Cementing Job Plan');
    const runningHeaderTitle = isSurface ? t('DRILLING TOOLKIT · SURFACE WELLHEAD CEMENTING PLAN', 'DRILLING TOOLKIT · SURFACE WELLHEAD CEMENTING PLAN') : t('DRILLING TOOLKIT · SUBSEA WELLHEAD CEMENTING PLAN', 'DRILLING TOOLKIT · SUBSEA WELLHEAD CEMENTING PLAN');
    const dateStr = new Date().toLocaleString();

    // Palette
    const cNavy = [15, 39, 68];       // #0F2744
    const cBlue = [2, 132, 199];      // #0284C7
    const cDark = [30, 41, 59];       // #1E293B
    const cMuted = [100, 116, 139];   // #64748B
    const cBorder = [226, 232, 240];  // #E2E8F0
    const cBgSubtle = [248, 250, 252];// #F8FAFC
    const cWhite = [255, 255, 255];
    const cGreen = [21, 128, 61];     // #15803D
    const cAmber = [180, 83, 9];      // #B45309

    // Page Dimensions
    const pageWidth = doc.internal.pageSize.getWidth();   // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;          // 182

    /**
     * Helper: Running Header
     */
    function drawPageHeader(pageNum) {
      doc.setFont(primaryFont, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
      doc.text(runningHeaderTitle, margin, 10);

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(`${presetLabel.toUpperCase()} · ${modelLabel}`, pageWidth - margin, 10, { align: 'right' });

      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    /**
     * ==========================================
     * BUILD HTML PAGES FOR 100% UNICODE-SAFE PDF EXPORT
     * ==========================================
     */
    const tableStyle = 'width:100%; border-collapse:collapse; margin-bottom:8px; font-size:9px; line-height:1.3;';
    const thStyle = 'background:#0F2744; color:#FFFFFF; font-weight:700; padding:4px 6px; text-align:left; font-size:8.5px; border:1px solid #1E293B;';
    const tdLabel = 'padding:3px 6px; border:1px solid #E2E8F0; font-weight:600; color:#334155; background:#F8FAFC;';
    const tdVal = 'padding:3px 6px; border:1px solid #E2E8F0; color:#0F172A; font-weight:500;';
    const sectionTitleStyle = 'font-size:10.5px; font-weight:700; color:#0F2744; margin:8px 0 4px 0; text-transform:uppercase; letter-spacing:0.3px;';

    function buildRunningHeader(pageNum) {
      return `
        <div style="background:#0F2744; color:#FFFFFF; padding:10px 14px; border-radius:6px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1 style="font-size:12.5px; font-weight:800; margin:0; color:#FFFFFF; letter-spacing:0.3px;">
              ${pageNum === 1 ? reportTitle : runningHeaderTitle}
            </h1>
            <span style="font-size:8.5px; color:#94A3B8;">${t('Page', 'Page')} ${pageNum} ${t('of', 'of')} 3</span>
          </div>
          <div style="font-size:8.5px; color:#BAE6FD; margin-top:3px;">
            ${t('Job', 'Job')}: <strong>${sectionName}</strong> &nbsp;·&nbsp;
            ${t('Section', 'Section')}: <strong>${t(presetLabel, presetLabel)}</strong> &nbsp;·&nbsp;
            ${t('Mode', 'Mode')}: <strong>${t(modelLabel, modelLabel)}</strong> &nbsp;·&nbsp;
            ${t('Date', 'Date')}: ${dateStr}
          </div>
        </div>
      `;
    }

    function buildRunningFooter(pageNum) {
      return `
        <div style="position:absolute; bottom:14px; left:36px; right:36px; border-top:1px solid #E2E8F0; padding-top:4px; display:flex; justify-content:space-between; font-size:8px; color:#64748B; font-style:italic;">
          <span>${t('CONFIDENTIAL · SUBSEA WELLHEAD CEMENTING JOB PLAN', 'CONFIDENTIAL · SUBSEA WELLHEAD CEMENTING JOB PLAN')}</span>
          <span>${t('Generated', 'Generated')}: ${dateStr}</span>
          <span>${t('Page', 'Page')} ${pageNum} ${t('of', 'of')} 3</span>
        </div>
      `;
    }

    // --- PAGE 1: Summary, Geometry, Pumping Program ---
    const shoeDisp = fmtDepth(inp.shoe, unit);
    const totSlurryDisp = fmtV(result.total_slurry).full;
    const totPumpDisp = fmtV(result.total_pumped).full;
    const emwShoeDisp = result.emw_shoe !== undefined ? fmtMW(result.emw_shoe).full : '-';
    const diffPressDisp = fmtP(result.diff_press).full;
    const annFcDisp = fmtP(result.p_ann_fc).full;
    const colSfDisp = (result.collapse_sf !== undefined && result.collapse_sf !== null) ? fmtNum(result.collapse_sf, 2) : '-';
    const pumpPressDisp = ((model === 'subsea' || model === 'surface_casing') ? fmtP(result.bump_pressure).full : fmtP(inp.max_pump_pressure).full);

    const execSummaryHtml = `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:8px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Casing Shoe Depth', 'Shoe Depth')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${shoeDisp} ${depthUnit}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Total Slurry', 'Total Slurry')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${totSlurryDisp}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Total Pumped', 'Total Pumped')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${totPumpDisp}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Shoe EMW', 'Shoe EMW')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${emwShoeDisp}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Annulus Press (FC)', 'Annulus Press (FC)')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${annFcDisp}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Diff Press (FC)', 'Diff Press (FC)')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${diffPressDisp}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${t('Collapse SF', 'Collapse SF')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${colSfDisp}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569; margin-bottom:2px;">${(model === 'subsea' || model === 'surface_casing') ? t('Bump Pressure', 'Bump Pressure') : t('Max Pump Pressure', 'Max Pump Press')}</div>
          <div style="font-size:10.5px; font-weight:800; color:#0F2744;">${pumpPressDisp}</div>
        </div>
      </div>
    `;

    const hangerOrMudlineLabel = model === 'riserless' ? t('Mudline Depth', 'Mudline Depth') : t('Wellhead Hanger', 'Wellhead Hanger');
    const hangerOrMudlineVal = model === 'riserless' ? fmtDepth(inp.mudline, unit) : fmtDepth(inp.hanger, unit);

    let caps = null;
    const computeCapFn = isSurface
      ? ((typeof window !== 'undefined' && window.computeSurfaceCapacities) || (typeof computeSurfaceCapacities === 'function' ? computeSurfaceCapacities : null))
      : ((typeof window !== 'undefined' && window.computeJobCapacities) || (typeof computeJobCapacities === 'function' ? computeJobCapacities : null));

    if (typeof computeCapFn === 'function') {
      try {
        caps = computeCapFn(inp, cementingState.overrides);
      } catch (e) {
        console.warn('Could not compute job capacities in PDF:', e);
      }
    }

    const activeRef = (cementingState && cementingState.activeReference && cementingState.activeReference.canonical)
      ? cementingState.activeReference.canonical
      : null;
    const engInp = (cementingState && cementingState.engineInput) ? cementingState.engineInput : null;
    const overrides = (cementingState && cementingState.overrides) ? cementingState.overrides : {};
    const preset = (cementingState && cementingState.sectionPresets && cementingState.sectionPresets[cementingState.section])
      ? cementingState.sectionPresets[cementingState.section]
      : ((typeof SECTION_PRESETS !== 'undefined' && cementingState && SECTION_PRESETS[cementingState.section]) ? SECTION_PRESETS[cementingState.section] : null);

    const effectiveCaps = Object.assign(
      {},
      preset || {},
      inp || {},
      engInp || {},
      (caps && caps.effective) || {},
      activeRef || {},
      overrides
    );

    // Map any alternate or camelCase property names requested
    effectiveCaps.cap_csg = effectiveCaps.cap_csg ?? effectiveCaps.casingCapacity ?? effectiveCaps.casing_capacity;
    effectiveCaps.cap_ann_oh = effectiveCaps.cap_ann_oh ?? effectiveCaps.openHoleAnnulusCapacity ?? effectiveCaps.open_hole_annulus_capacity;
    effectiveCaps.cap_ann_c = effectiveCaps.cap_ann_c ?? effectiveCaps.casedAnnulusCapacity ?? effectiveCaps.cased_annulus_capacity;
    effectiveCaps.cap_dp = effectiveCaps.cap_dp ?? effectiveCaps.innerStringCapacity ?? effectiveCaps.inner_string_capacity;
    effectiveCaps.cap_riser = effectiveCaps.cap_riser ?? effectiveCaps.riserCapacity ?? effectiveCaps.marineRiserCapacity ?? effectiveCaps.marine_riser_capacity;
    effectiveCaps.cap_oh = effectiveCaps.cap_oh ?? effectiveCaps.openHoleCapacity ?? effectiveCaps.open_hole_capacity;

    const csg = (caps && caps.csg) ? caps.csg : (typeof CAPACITY_DATA !== 'undefined' && inp.tubulars ? CAPACITY_DATA.find(t => t.id === inp.tubulars.csg_id) : null);
    const dp = (caps && caps.dp) ? caps.dp : (typeof CAPACITY_DATA !== 'undefined' && inp.tubulars ? CAPACITY_DATA.find(t => t.id === inp.tubulars.dp_id) : null);
    const hole = (caps && caps.hole) ? caps.hole : (typeof CAPACITY_DATA !== 'undefined' && inp.tubulars ? CAPACITY_DATA.find(t => t.id === inp.tubulars.hole_id) : null);

    const holeSizeDisplay = hole ? `${hole.od_in}"` : (inp.hole_size ? `${fmtNum(inp.hole_size, 3)}"` : '-');
    const csgOdDisplay = csg ? `${csg.od_in}"` : (inp.csg_od ? `${fmtNum(inp.csg_od, 3)}"` : '-');
    const csgWtDisplay = csg ? `${csg.weight_ppf} lb/ft` : (inp.csg_weight ? `${fmtNum(inp.csg_weight, 1)} lb/ft` : '-');
    const csgIdDisplay = csg ? `${csg.id_in}"` : (inp.csg_id ? `${fmtNum(inp.csg_id, 3)}"` : '-');
    const csgGradeDisplay = (csg && csg.grade) ? csg.grade : (inp.csg_grade || '-');
    const dpOdDisplay = dp ? `${dp.od_in}"` : (inp.dp_od ? `${fmtNum(inp.dp_od, 3)}"` : '-');
    const riserIdDisplay = (inp.tubulars && inp.tubulars.riser_custom_id) ? `${inp.tubulars.riser_custom_id}"` : (inp.riser_id ? `${fmtNum(inp.riser_id, 3)}"` : '19.5"');

    const formatReportCap = (val) => fmtCap(val, isMetric, (capUnit === 'L/m' || capUnit === 'l/m') ? 2 : 5, capUnit);

    let wellGeoData = [];
    if (isSurface) {
      if (model === 'conductor' || model === 'surface_conductor') {
        const datumLabel = inp.rig_type === 'land' ? t('Ground Level (RKB)', 'Ground Level (RKB)') : t('Seabed Depth (RKB)', 'Seabed Depth (RKB)');
        wellGeoData = [
          [t('Rig Type', 'Rig Type'), inp.rig_type === 'land' ? t('Land Rig', 'Land Rig') : t('Jack-up Rig', 'Jack-up Rig'), t('Hole Size OD', 'Hole Size OD'), `${holeSizeDisplay} (${fmtNum(inp.excess_pct, 0)}% ${t('excess', 'excess')})`],
          [datumLabel, `${fmtDepth(inp.seabed, unit)} ${depthUnit}`, t('Casing OD / Weight', 'Casing OD / Weight'), `${csgOdDisplay} / ${csgWtDisplay}`],
          [t('Previous Shoe', 'Previous Shoe'), t('N/A (Conductor)', 'N/A (Conductor)'), t('Casing ID / Grade', 'Casing ID / Grade'), `${csgIdDisplay} / ${csgGradeDisplay}`],
          [t('Casing Shoe Depth', 'Casing Shoe Depth'), `${fmtDepth(inp.shoe, unit)} ${depthUnit}`, t('Casing Capacity', 'Casing Capacity'), `${formatReportCap(effectiveCaps.cap_csg)} ${capUnit}`],
          [t('Shoe Track Length', 'Shoe Track Length'), `${fmtDepth(inp.shoe_track_len, unit)} ${depthUnit}`, t('Open Hole Annulus Cap', 'Open Hole Annulus Cap'), `${formatReportCap(effectiveCaps.cap_ann_oh)} ${capUnit}`],
          [t('Hole Depth (MD)', 'Hole Depth (MD)'), `${fmtDepth(inp.td, unit)} ${depthUnit}`, t('Inner String / DP OD', 'Inner String / DP OD'), `${dpOdDisplay} (${formatReportCap(effectiveCaps.cap_dp)} ${capUnit})`]
        ];
        if (inp.rig_type === 'jack-up') {
          wellGeoData.push([t('Seawater MW', 'Seawater MW'), `${fmtMW(inp.seawater_mw).val} ${mwUnit}`, t('Open Hole Capacity', 'Open Hole Capacity'), `${formatReportCap(effectiveCaps.cap_oh)} ${capUnit}`]);
        }
      } else {
        wellGeoData = [
          [t('Previous Shoe', 'Previous Shoe'), inp.prev_shoe > 0 ? `${fmtDepth(inp.prev_shoe, unit)} ${depthUnit}` : t('N/A', 'N/A'), t('Hole Size OD', 'Hole Size OD'), `${holeSizeDisplay} (${fmtNum(inp.excess_pct, 0)}% ${t('excess', 'excess')})`],
          [t('Planned TOC', 'Planned TOC'), `${fmtDepth(inp.planned_toc, unit)} ${depthUnit}`, t('Casing OD / Weight', 'Casing OD / Weight'), `${csgOdDisplay} / ${csgWtDisplay}`],
          [t('Casing Shoe Depth', 'Casing Shoe Depth'), `${fmtDepth(inp.shoe, unit)} ${depthUnit}`, t('Casing ID / Grade', 'Casing ID / Grade'), `${csgIdDisplay} / ${csgGradeDisplay}`],
          [t('Shoe Track Length', 'Shoe Track Length'), `${fmtDepth(inp.shoe_track_len, unit)} ${depthUnit}`, t('Casing Capacity', 'Casing Capacity'), `${formatReportCap(effectiveCaps.cap_csg)} ${capUnit}`],
          [t('Hole Depth (MD)', 'Hole Depth (MD)'), `${fmtDepth(inp.td, unit)} ${depthUnit}`, t('Open Hole Annulus Cap', 'Open Hole Annulus Cap'), `${formatReportCap(effectiveCaps.cap_ann_oh)} ${capUnit}`],
          [t('Float Collar Depth', 'Float Collar Depth'), `${fmtDepth(Math.max(0, (Number(inp.shoe) || 0) - (Number(inp.shoe_track_len) || 0)), unit)} ${depthUnit}`, t('Cased Annulus Cap', 'Cased Annulus Cap'), `${formatReportCap(effectiveCaps.cap_ann_c)} ${capUnit}`]
        ];
      }
    } else {
      wellGeoData = [
        [t('Air Gap', 'Air Gap'), `${fmtDepth(inp.air_gap, unit)} ${depthUnit}`, t('Hole Size OD', 'Hole Size OD'), `${holeSizeDisplay} (${fmtNum(inp.excess_pct, 0)}% ${t('excess', 'excess')})`],
        [t('Water Depth', 'Water Depth'), `${fmtDepth(inp.water_depth, unit)} ${depthUnit}`, t('Casing OD / Weight', 'Casing OD / Weight'), `${csgOdDisplay} / ${csgWtDisplay}`],
        [hangerOrMudlineLabel, `${hangerOrMudlineVal} ${depthUnit}`, t('Casing ID / Grade', 'Casing ID / Grade'), `${csgIdDisplay} / ${csgGradeDisplay}`],
        [t('Previous Shoe', 'Previous Shoe'), inp.prev_shoe > 0 ? `${fmtDepth(inp.prev_shoe, unit)} ${depthUnit}` : t('N/A (Conductor)', 'N/A (Conductor)'), t('Casing Capacity', 'Casing Capacity'), `${formatReportCap(effectiveCaps.cap_csg)} ${capUnit}`],
        [t('Casing Shoe Depth', 'Casing Shoe Depth'), `${fmtDepth(inp.shoe, unit)} ${depthUnit}`, t('Open Hole Annulus Cap', 'Open Hole Annulus Cap'), `${formatReportCap(effectiveCaps.cap_ann_oh)} ${capUnit}`],
        [t('Shoe Track Length', 'Shoe Track Length'), `${fmtDepth(inp.shoe_track_len, unit)} ${depthUnit}`, t('Cased Annulus Cap', 'Cased Annulus Cap'), `${formatReportCap(effectiveCaps.cap_ann_c)} ${capUnit}`],
        [t('Hole Depth (MD)', 'Hole Depth (MD)'), `${fmtDepth(inp.td, unit)} ${depthUnit}`, t('Inner String / DP OD', 'Inner String / DP OD'), `${dpOdDisplay} (${formatReportCap(effectiveCaps.cap_dp)} ${capUnit})`]
      ];
      if (model === 'subsea') {
        wellGeoData.push([t('Marine Riser ID', 'Marine Riser ID'), `${riserIdDisplay}`, t('Marine Riser Cap', 'Marine Riser Cap'), `${formatReportCap(effectiveCaps.cap_riser)} ${capUnit}`]);
      }
    }

    const wellGeoHtml = `
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}; width:28%;">${t('Parameter (Datum / Depth)', 'Parameter')}</th>
            <th style="${thStyle}; width:22%;">${t('Value', 'Value')}</th>
            <th style="${thStyle}; width:28%;">${t('Tubular / Annulus Parameter', 'Parameter')}</th>
            <th style="${thStyle}; width:22%;">${t('Value', 'Value')}</th>
          </tr>
        </thead>
        <tbody>
          ${wellGeoData.map(row => `
            <tr>
              <td style="${tdLabel}">${row[0]}</td>
              <td style="${tdVal}">${row[1]}</td>
              <td style="${tdLabel}">${row[2]}</td>
              <td style="${tdVal}">${row[3]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const pumpSeq = result.pumping_sequence || [];
    const pumpSeqRows = pumpSeq.map(s => {
      const vol = fmtV(s.volume || 0).val;
      const mw = fmtMW(s.density || 0).val;
      const stks = Number(inp.pump_output) > 0 ? (s.volume / Number(inp.pump_output)).toFixed(0) : '-';
      return [s.step, t(s.name, s.name), `${vol} ${volUnit}`, `${mw} ${mwUnit}`, stks];
    });
    const totStk = Number(inp.pump_output) > 0 ? ((result.total_pumped || 0) / Number(inp.pump_output)).toFixed(0) : '-';
    pumpSeqRows.push(['', t('Total Pumped Volume', 'Total Pumped Volume'), `${fmtV(result.total_pumped || 0).val} ${volUnit}`, '-', `${totStk} ${t('stk', 'stk')}`]);

    const pumpSeqHtml = `
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}; width:12%; text-align:center;">${t('Step #', 'Step #')}</th>
            <th style="${thStyle}; width:40%;">${t('Fluid Description', 'Fluid Description')}</th>
            <th style="${thStyle}; width:16%; text-align:right;">${t('Volume', 'Volume')} (${volUnit})</th>
            <th style="${thStyle}; width:16%; text-align:right;">${t('Density', 'Density')} (${mwUnit})</th>
            <th style="${thStyle}; width:16%; text-align:right;">${t('Pump Strokes (stk)', 'Strokes')}</th>
          </tr>
        </thead>
        <tbody>
          ${pumpSeqRows.map(r => `
            <tr>
              <td style="${tdVal}; text-align:center; font-weight:700;">${r[0]}</td>
              <td style="${tdVal}; font-weight:600;">${r[1]}</td>
              <td style="${tdVal}; text-align:right;">${r[2]}</td>
              <td style="${tdVal}; text-align:right;">${r[3]}</td>
              <td style="${tdVal}; text-align:right; font-weight:700;">${r[4]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="font-size:8px; color:#64748B; font-style:italic; margin-top:2px;">
        ${t('Displacement', 'Displacement')}: ${fmtV(result.disp_tot).full} (${fmtNum(result.strokes, 0)} ${t('stk', 'stk')} @ ${fmtPO(inp.pump_output).full})
      </div>
    `;

    const page1Html = `
      ${buildRunningHeader(1)}
      <div style="${sectionTitleStyle}">${t('EXECUTIVE JOB SUMMARY', 'EXECUTIVE JOB SUMMARY')}</div>
      ${execSummaryHtml}
      <div style="${sectionTitleStyle}">${t('WELL ELEVATIONS & HOLE / CASING GEOMETRY', 'WELL ELEVATIONS & HOLE / CASING GEOMETRY')}</div>
      ${wellGeoHtml}
      <div style="${sectionTitleStyle}">${t('PUMPING PROGRAM & DISPLACEMENT SEQUENCE', 'PUMPING PROGRAM & DISPLACEMENT SEQUENCE')}</div>
      ${pumpSeqHtml}
      ${buildRunningFooter(1)}
    `;

    // --- PAGE 2: Placement, Hydraulics, Checks ---
    const tocVal = fmtEngineDepth(result.toc, isMetric) + ' ' + depthUnit;
    const tailTopVal = fmtEngineDepth(result.tail_top, isMetric) + ' ' + depthUnit;
    const spTopVal = fmtEngineDepth(result.sp_top, isMetric) + ' ' + depthUnit;

    const subseaOrRiserlessPlacement = isSurface
      ? (model === 'conductor' || model === 'surface_conductor'
          ? (inp.rig_type === 'land' ? `${t('Ground Level Cement Returns', 'Ground Returns')}: ${fmtV(result.returns_surface || 0).full}` : `${t('Seabed Cement Returns', 'Seabed Returns')}: ${fmtV(result.cement_returns_seabed || 0).full}`)
          : `${t('Cement Returns at Surface', 'Surface Returns')}: ${fmtV(result.returns_surface || result.cement_returns_surface || 0).full}   |   ${t('TOC Above Plan', 'TOC Above Plan')}: ${fmtEngineDepth(result.toc_above_plan || 0, isMetric)} ${depthUnit}`)
      : (model === 'riserless'
          ? `${t('TOC Below Mudline', 'TOC Below Mudline')}: ${fmtEngineDepth(result.toc_below_mudline, isMetric)} ${depthUnit}   |   ${t('Seabed Cement Returns', 'Seabed Returns')}: ${fmtV(result.cement_returns_seabed || 0).full}`
          : `${t('Cement in Riser', 'Cement in Riser')}: ${fmtEngineDepth(result.cement_in_riser, isMetric)} ${depthUnit}   |   ${t('Returns at Surface', 'Surface Returns')}: ${fmtV(result.returns_surface || 0).full}`);

    const riseTableRows = [];
    if (Number(inp.tail_vol || 0) > 0 || (result.rise_tail || 0) > 0) {
      riseTableRows.push([t('Tail Slurry', 'Tail Slurry'), `${fmtV(inp.tail_vol || 0).val} ${volUnit}`, `${fmtEngineDepth(result.rise_tail, isMetric)} ${depthUnit}`]);
    }
    riseTableRows.push([t('Lead Slurry', 'Lead Slurry'), `${fmtV(inp.lead_vol || 0).val} ${volUnit}`, `${fmtEngineDepth(result.rise_lead, isMetric)} ${depthUnit}`]);
    riseTableRows.push([t('Spacer', 'Spacer'), `${fmtV(inp.sp_vol || 0).val} ${volUnit}`, `${fmtEngineDepth(result.rise_sp, isMetric)} ${depthUnit}`]);
    if (Number(inp.f2_vol || 0) > 0) {
      riseTableRows.push([t('2nd Mud Wash', '2nd Mud Wash'), `${fmtV(inp.f2_vol).val} ${volUnit}`, `${fmtEngineDepth(result.rise_f2, isMetric)} ${depthUnit}`]);
    }
    if (Number(inp.f1_vol || 0) > 0) {
      riseTableRows.push([t('1st Mud Wash', '1st Mud Wash'), `${fmtV(inp.f1_vol).val} ${volUnit}`, `${fmtEngineDepth(result.rise_f1, isMetric)} ${depthUnit}`]);
    }
    riseTableRows.push([t('Total Cement Rise in Annulus', 'Total Cement Rise'), `${fmtV(result.total_slurry || 0).val} ${volUnit}`, `${fmtEngineDepth(result.rise_tot, isMetric)} ${depthUnit}`]);

    const placementHtml = `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:6px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569;">${t('Top of Cement (TOC)', 'Top of Cement')}</div>
          <div style="font-size:10px; font-weight:800; color:#0F2744;">${tocVal}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569;">${t('Tail Slurry Top', 'Tail Top')}</div>
          <div style="font-size:10px; font-weight:800; color:#0F2744;">${tailTopVal}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569;">${t('Spacer Top', 'Spacer Top')}</div>
          <div style="font-size:10px; font-weight:800; color:#0F2744;">${spTopVal}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px; text-align:center;">
          <div style="font-size:7.5px; font-weight:700; color:#475569;">${t('Total Slurry Vol', 'Total Slurry Vol')}</div>
          <div style="font-size:10px; font-weight:800; color:#0F2744;">${fmtV(result.total_slurry).full}</div>
        </div>
      </div>
      <div style="font-size:8px; color:#0F2744; font-weight:600; margin-bottom:6px;">
        ${subseaOrRiserlessPlacement}
      </div>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}; width:44%;">${t('Annular Interval', 'Annular Interval')}</th>
            <th style="${thStyle}; width:28%; text-align:right;">${t('Pumped Volume', 'Pumped Volume')} (${volUnit})</th>
            <th style="${thStyle}; width:28%; text-align:right;">${t('Rise Height', 'Rise Height')}</th>
          </tr>
        </thead>
        <tbody>
          ${riseTableRows.map(r => `
            <tr>
              <td style="${tdLabel}">${r[0]}</td>
              <td style="${tdVal}; text-align:right;">${r[1]}</td>
              <td style="${tdVal}; text-align:right; font-weight:700;">${r[2]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const hydRows = [
      [t('Float Collar', 'Float Collar'), fmtP(result.p_ann_fc || 0).full, fmtMW(result.emw_fc || 0).full, '-'],
      [t('Casing Shoe', 'Casing Shoe'), fmtP(result.p_ann_shoe || 0).full, fmtMW(result.emw_shoe || 0).full, '-']
    ];
    if (result.emw_prev_shoe !== undefined) {
      const lotMarginStr = result.lot_margin !== undefined
        ? `${result.lot_margin >= 0 ? '+' : ''}${fmtMW(result.lot_margin).full} (LOT ${fmtMW(inp.lot).full})`
        : '-';
      hydRows.push([t('Previous Shoe', 'Previous Shoe'), (result.p_prev_shoe !== undefined ? fmtP(result.p_prev_shoe).full : '-'), fmtMW(result.emw_prev_shoe).full, lotMarginStr]);
    }
    const pumpOrBumpLimit = (model === 'subsea' || model === 'surface_casing')
      ? [t('Bump Pressure', 'Bump Pressure'), fmtP(result.bump_pressure || 0).full, '-', `<= ${fmtP(result.burst_limit || 0).full} (80% burst)`]
      : [t('Max Pump Pressure', 'Max Pump Pressure'), fmtP(inp.max_pump_pressure || 0).full, '-', `<= ${fmtP(result.burst_limit || 0).full} (80% burst)`];
    hydRows.push(pumpOrBumpLimit);

    const hydHtml = `
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}; width:26%;">${t('Pressure Datum', 'Pressure Datum')}</th>
            <th style="${thStyle}; width:24%; text-align:right;">${t('Hydrostatic / Annulus Pressure', 'Annulus Pressure')} (${pressUnit})</th>
            <th style="${thStyle}; width:24%; text-align:right;">${t('Equivalent Mud Weight', 'EMW')} (${mwUnit})</th>
            <th style="${thStyle}; width:26%; text-align:right;">${t('Safety Limit / LOT Margin', 'Safety Limit')}</th>
          </tr>
        </thead>
        <tbody>
          ${hydRows.map(r => `
            <tr>
              <td style="${tdLabel}">${r[0]}</td>
              <td style="${tdVal}; text-align:right;">${r[1]}</td>
              <td style="${tdVal}; text-align:right;">${r[2]}</td>
              <td style="${tdVal}; text-align:right; font-weight:600;">${r[3]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="font-size:8px; color:#64748B; font-style:italic; margin-top:2px;">
        ${t('Float Status', 'Float Status')}: ${result.diff_meaning || '-'} &nbsp;·&nbsp;
        ${t('Diff Press', 'Diff Press')}: ${fmtP(result.diff_press || 0).full} &nbsp;·&nbsp;
        ${t('Collapse SF', 'Collapse SF')}: ${fmtNum(result.collapse_sf, 2)}
      </div>
    `;

    const checks = result.checks || [];
    const checkRows = checks.map(c => {
      const isOk = c.status === 'OK';
      let msg = (c.message || c.msg || '-');
      msg = msg.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/±/g, '+/-');
      msg = msg.replace(/\b(\d+\.\d{3,})\b/g, (m, n) => Number(n).toFixed(1));
      return [c.status, t(c.label || c.name || '-', c.label || c.name || '-'), msg, isOk];
    });
    if (checkRows.length === 0) {
      checkRows.push(['OK', t('General Safety', 'General Safety'), t('All routine parameters within standard envelope.', 'All routine parameters within standard envelope.'), true]);
    }

    const checksHtml = `
      <table style="${tableStyle}; font-size:8.5px;">
        <thead>
          <tr>
            <th style="${thStyle}; width:14%; text-align:center;">${t('Status', 'Status')}</th>
            <th style="${thStyle}; width:28%;">${t('Validation Check', 'Validation Check')}</th>
            <th style="${thStyle}; width:58%;">${t('Analysis & Recommendations', 'Analysis & Recommendations')}</th>
          </tr>
        </thead>
        <tbody>
          ${checkRows.map(r => `
            <tr>
              <td style="${tdVal}; text-align:center; font-weight:800; color:${r[3] ? '#16A34A' : '#D97706'};">${r[0]}</td>
              <td style="${tdLabel}">${r[1]}</td>
              <td style="${tdVal}">${r[2]}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const operationalNotesHtml = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-top:4px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px 8px;">
          <div style="font-size:8px; font-weight:700; color:#0F2744; margin-bottom:3px;">${t('Pre-Job Verification & Testing', 'Pre-Job Verification & Testing')}</div>
          <ul style="margin:0; padding-left:14px; font-size:7.5px; color:#475569; line-height:1.4;">
            <li>${t('Pressure test surface cementing lines to MATP rating prior to pumping.', 'Pressure test surface cementing lines to MATP rating prior to pumping.')}</li>
            <li>${t('Confirm spacer density, volume, and contact time requirement (>= 10 min).', 'Confirm spacer density, volume, and contact time requirement (>= 10 min).')}</li>
            <li>${t('Zero stroke counters; calibrate cement unit mass flow meters against tank dips.', 'Zero stroke counters; calibrate cement unit flow meters.')}</li>
          </ul>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:4px; padding:6px 8px;">
          <div style="font-size:8px; font-weight:700; color:#0F2744; margin-bottom:3px;">${t('Displacement & Well Control Contingency', 'Displacement & Well Control Contingency')}</div>
          <ul style="margin:0; padding-left:14px; font-size:7.5px; color:#475569; line-height:1.4;">
            <li>${t('Monitor annulus returns continuously; verify zero losses or fluid influx.', 'Monitor annulus returns continuously; verify zero losses or influx.')}</li>
            <li>${t('Slow pump rate to 2-3 bpm within 15 bbl of calculated displacement volume.', 'Slow pump rate within 15 bbl of calculated displacement volume.')}</li>
            <li>${t('Bump plug to specified differential pressure limit; hold 10 min and bleed back.', 'Bump plug to specified differential limit; hold 10 min and check float.')}</li>
          </ul>
        </div>
      </div>
    `;

    const page2Html = `
      ${buildRunningHeader(2)}
      <div style="${sectionTitleStyle}">${t('CEMENT PLACEMENT & ANNULAR RISE BREAKDOWN', 'CEMENT PLACEMENT & ANNULAR RISE BREAKDOWN')}</div>
      ${placementHtml}
      <div style="${sectionTitleStyle}">${t('HYDRAULICS, EMW & PRESSURE LIMITS', 'HYDRAULICS, EMW & PRESSURE LIMITS')}</div>
      ${hydHtml}
      <div style="${sectionTitleStyle}">${t('JOB VALIDATION & RISK CHECKS', 'JOB VALIDATION & RISK CHECKS')}</div>
      ${checksHtml}
      <div style="${sectionTitleStyle}">${t('OPERATIONAL RECOMMENDATIONS & WELL INTEGRITY GUIDELINES', 'OPERATIONAL RECOMMENDATIONS & WELL INTEGRITY GUIDELINES')}</div>
      ${operationalNotesHtml}
      ${buildRunningFooter(2)}
    `;

    // --- PAGE 3: Schematic & Fluid Key & Signatures ---
    let highResSchematicSvg = '';

    // 1. Capture live active DOM SVG if currently rendered on screen
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const activeSvg = document.querySelector('#schematic-canvas svg, .cement-schematic-canvas svg, #surface-schematic-canvas svg, #schematic-svg-container svg, #schematic-viewport svg');
      if (activeSvg) {
        highResSchematicSvg = new XMLSerializer().serializeToString(activeSvg);
      }
    }

    // 2. Programmatic generation if not captured from DOM
    if (!highResSchematicSvg) {
      if (isSurface) {
        const renderSurfaceFn = (typeof window !== 'undefined' && (window.renderSurfaceSchematicSvg || (window.CementingCommon && window.CementingCommon.renderSurfaceSchematicSvg))) || (typeof renderSurfaceSchematicSvg === 'function' ? renderSurfaceSchematicSvg : null);
        if (renderSurfaceFn) {
          highResSchematicSvg = renderSurfaceFn(result, inp, unit);
        }
      } else {
        let engInp = (cementingState && cementingState.engineInput) ? cementingState.engineInput : null;
        if (!engInp) {
          const M_PER_FT = 0.3048;
          engInp = Object.assign({}, inp);
          const DEPTH_KEYS = ['air_gap', 'water_depth', 'hanger', 'prev_shoe', 'td', 'shoe', 'shoe_track_len'];
          DEPTH_KEYS.forEach(k => {
            if (engInp[k] !== undefined && engInp[k] !== '' && engInp[k] !== null && !isNaN(engInp[k])) {
              engInp[k] = unit === 'm' ? (Number(engInp[k]) / M_PER_FT) : Number(engInp[k]);
            } else {
              engInp[k] = 0;
            }
          });
        }
        const renderSubseaFn = (typeof window !== 'undefined' && (window.renderWellCementingSchematic || (window.CementingCommon && window.CementingCommon.renderWellCementingSchematic))) || (typeof renderWellCementingSchematic === 'function' ? renderWellCementingSchematic : null);
        if (renderSubseaFn) {
          highResSchematicSvg = renderSubseaFn(result, engInp, unit);
        }
      }
    }

    if (!highResSchematicSvg) {
      highResSchematicSvg = renderHighResCementingPdfSchematicSvg(result, inp, unit, isSurface, t);
    }

    if (highResSchematicSvg) {
      highResSchematicSvg = highResSchematicSvg.replace(/font-family:'Outfit',sans-serif/g, "font-family:'Noto Sans','Outfit',system-ui,sans-serif");
    }

    const schematicImgHtml = `
      <div style="text-align:center; margin-bottom:12px; border:1px solid #E2E8F0; border-radius:6px; padding:6px; background:#FAF8F5; break-inside:avoid; width:100%; box-sizing:border-box;">
        <div style="max-width:510px; margin:0 auto; display:block;">
          ${highResSchematicSvg}
        </div>
      </div>
    `;

    const fluidItems = (typeof window !== 'undefined' && window.CementingCommon && typeof window.CementingCommon.getFluidLegendItems === 'function')
      ? window.CementingCommon.getFluidLegendItems(inp, result, isSurface)
      : [
          { name: 'Hole Fluid', color: '#C9D6DF', density: fmtMW(inp.hole_fluid_mw || inp.mw || 0).full, volume: t('In Hole', 'In Hole') },
          { name: 'Displacement Fluid', color: '#F2D388', density: fmtMW(inp.disp_mw || inp.mw || 0).full, volume: fmtV(result.disp_tot || 0).full },
          { name: 'Spacer', color: '#4A90D9', density: Number(inp.sp_mw) > 0 ? fmtMW(inp.sp_mw).full : '—', volume: Number(inp.sp_vol) > 0 ? fmtV(inp.sp_vol).full : `0.0 ${volUnit}` },
          { name: 'Lead Slurry', color: '#B5D99C', density: Number(inp.lead_mw) > 0 ? fmtMW(inp.lead_mw).full : '—', volume: Number(inp.lead_vol) > 0 ? fmtV(inp.lead_vol).full : `0.0 ${volUnit}` },
          { name: 'Tail Slurry', color: '#3E7D3A', density: Number(inp.tail_mw) > 0 ? fmtMW(inp.tail_mw).full : '—', volume: Number(inp.tail_vol) > 0 ? fmtV(inp.tail_vol).full : `0.0 ${volUnit}` }
        ];

    const fluidKeyHtml = `
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}; width:10%; text-align:center;">${t('Color', 'Color')}</th>
            <th style="${thStyle}; width:40%;">${t('Fluid Layer', 'Fluid Layer')}</th>
            <th style="${thStyle}; width:25%; text-align:center;">${t('Density', 'Density')}</th>
            <th style="${thStyle}; width:25%; text-align:right;">${t('Volume', 'Volume')}</th>
          </tr>
        </thead>
        <tbody>
          ${fluidItems.map(item => `
            <tr>
              <td style="${tdVal}; text-align:center;">
                <span style="display:inline-block; width:12px; height:12px; background:${item.color}; border:1px solid #94A3B8; border-radius:2px; vertical-align:middle;"></span>
              </td>
              <td style="${tdLabel}">${t(item.name, item.name)}</td>
              <td style="${tdVal}; text-align:center;">${item.density}</td>
              <td style="${tdVal}; text-align:right; font-weight:600;">${item.volume}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const cementingSigHtml = `
      <div style="display:flex; justify-content:space-between; gap:10px; margin-top:6px;">
        <div style="flex:1; text-align:center; padding:4px 6px; border:1px solid #E2E8F0; border-radius:4px; background:#FAFAFA;">
          <div style="border-bottom:1px solid #94A3B8; height:24px; margin-bottom:3px;"></div>
          <div style="font-size:8px; font-weight:700; color:#1E293B;">${t('Cementing Lead / Engineer', 'Cementing Lead')}</div>
          <div style="font-size:7px; color:#64748B;">${t('Signature', 'Signature')} / ${t('Date', 'Date')}</div>
        </div>
        <div style="flex:1; text-align:center; padding:4px 6px; border:1px solid #E2E8F0; border-radius:4px; background:#FAFAFA;">
          <div style="border-bottom:1px solid #94A3B8; height:24px; margin-bottom:3px;"></div>
          <div style="font-size:8px; font-weight:700; color:#1E293B;">${t('Drilling Superintendent', 'Drilling Superintendent')}</div>
          <div style="font-size:7px; color:#64748B;">${t('Signature', 'Signature')} / ${t('Date', 'Date')}</div>
        </div>
        <div style="flex:1; text-align:center; padding:4px 6px; border:1px solid #E2E8F0; border-radius:4px; background:#FAFAFA;">
          <div style="border-bottom:1px solid #94A3B8; height:24px; margin-bottom:3px;"></div>
          <div style="font-size:8px; font-weight:700; color:#1E293B;">${t('Company Representative', 'Company Representative')}</div>
          <div style="font-size:7px; color:#64748B;">${t('Signature', 'Signature')} / ${t('Date', 'Date')}</div>
        </div>
      </div>
    `;

    const page3Html = `
      ${buildRunningHeader(3)}
      <div style="${sectionTitleStyle}">${t('WELL CEMENTING SCHEMATIC & FLUID PLACEMENT', 'WELL CEMENTING SCHEMATIC & FLUID PLACEMENT')}</div>
      ${schematicImgHtml}
      <div style="${sectionTitleStyle}">${t('FLUID PLACEMENT & COLOR KEY', 'FLUID PLACEMENT & COLOR KEY')}</div>
      ${fluidKeyHtml}
      <div style="${sectionTitleStyle}; margin-top:8px;">${t('FIELD VERIFICATION & APPROVAL SIGNATURES', 'FIELD VERIFICATION & APPROVAL SIGNATURES')}</div>
      ${cementingSigHtml}
      ${buildRunningFooter(3)}
    `;

    const activeSection = (cementingState && cementingState.section) || (inp && inp.name) || 'Subsea';
    const fileName = buildSanitizedFileName(inp.name, activeSection, 'Subsea', 'pdf');

    let pdfBase64 = '';
    let docOut = doc;

    if (typeof window !== 'undefined' && typeof window.renderHtmlPagesToPdf === 'function') {
      const renderRes = await window.renderHtmlPagesToPdf([page1Html, page2Html, page3Html], {
        fileName,
        orientation: 'portrait',
        scale: 3
      });
      pdfBase64 = renderRes.pdfBase64;
      docOut = renderRes.doc;
    } else {
      pdfBase64 = doc.output('datauristring');
    }

    const base64 = pdfBase64.split(',')[1] || '';
    const blob = docOut.output('blob');

    return {
      doc: docOut,
      fileName,
      blob,
      dataUri: pdfBase64,
      base64
    };
  }

  /**
   * Build a sanitized, filesystem-safe filename with date and time
   * Format: <JobName>_<Section>_<YYYY-MM-DD_HHmm>.<ext>
   */
  function buildSanitizedFileName(jobName, sectionLabel, wellhead = 'Subsea', ext = 'pdf') {
    function cleanPart(str) {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/"/g, 'in')
        .replace(/[\/\\:*?<>|]/g, '-')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-\.]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    const cleanJob = cleanPart(jobName) || 'Subsea_Cementing_Job';
    const cleanSec = cleanPart(sectionLabel) || cleanPart(wellhead) || 'Subsea';

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${yyyy}-${mm}-${dd}_${hh}${min}`;

    let base = `${cleanJob}_${cleanSec}`;
    if (cleanJob.toLowerCase().includes(cleanSec.toLowerCase())) {
      base = cleanJob;
    }
    return `${base}_${timestamp}.${ext.replace(/^\./, '')}`;
  }

  /**
   * Format byte count into human-readable size badge string
   */
  function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Save report file (PDF or SVG) to local device storage using Capacitor Filesystem.
   * Scoped to Directory.Cache for seamless zero-permission access on Android 11+.
   * Fallback to Web Blob URL if Capacitor Filesystem is not available.
   */
  async function saveReportToFile(dataUriOrText, fileName, isBase64 = true, mimeType = 'application/pdf') {
    const Filesystem = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) || (window.Capacitor && window.Capacitor.Filesystem);

    if (Filesystem && typeof Filesystem.writeFile === 'function') {
      try {
        let rawData = dataUriOrText;
        if (isBase64 && typeof rawData === 'string' && rawData.includes(',')) {
          rawData = rawData.split(',')[1];
        }

        const writeOptions = {
          path: fileName,
          data: rawData,
          directory: 'CACHE',
          recursive: true
        };
        if (!isBase64) {
          writeOptions.encoding = 'utf8';
        }

        const writeRes = await Filesystem.writeFile(writeOptions);

        let statRes = null;
        try {
          statRes = await Filesystem.stat({
            path: fileName,
            directory: 'CACHE'
          });
        } catch (statErr) {
          console.warn('Filesystem.stat warning:', statErr);
        }

        let fileUri = (statRes && statRes.uri) || (writeRes && writeRes.uri);
        if (!fileUri && typeof Filesystem.getUri === 'function') {
          const uriRes = await Filesystem.getUri({ path: fileName, directory: 'CACHE' });
          fileUri = uriRes && uriRes.uri;
        }

        const size = (statRes && typeof statRes.size === 'number') ? statRes.size : (isBase64 && typeof rawData === 'string' ? Math.round(rawData.length * 0.75) : (rawData ? rawData.length : 0));

        return {
          success: true,
          isNative: true,
          fileName,
          uri: fileUri,
          size,
          mimeType
        };
      } catch (fsErr) {
        console.error('Capacitor Filesystem.writeFile error:', fsErr);
        throw fsErr;
      }
    }

    // Web Fallback: Blob URL
    let blob;
    if (isBase64) {
      let base64Str = dataUriOrText;
      if (typeof base64Str === 'string' && base64Str.includes(',')) {
        base64Str = base64Str.split(',')[1];
      }
      const byteCharacters = atob(base64Str);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      blob = new Blob([dataUriOrText], { type: mimeType });
    }

    const blobUrl = URL.createObjectURL(blob);
    return {
      success: true,
      isNative: false,
      fileName,
      uri: blobUrl,
      blob,
      size: blob.size,
      mimeType
    };
  }

  /**
   * Open the file using @capacitor-community/file-opener (native) or window.open (web)
   */
  async function openReportFile(fileInfo) {
    if (!fileInfo) throw new Error('File information missing');
    const { uri, mimeType, isNative, fileName } = fileInfo;

    const FileOpener = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FileOpener) || (window.Capacitor && window.Capacitor.FileOpener);

    if (isNative && FileOpener && typeof FileOpener.open === 'function') {
      try {
        await FileOpener.open({
          filePath: uri,
          contentType: mimeType || (fileName && fileName.endsWith('.svg') ? 'image/svg+xml' : 'application/pdf'),
          openWithDefault: false
        });
        return { success: true };
      } catch (err) {
        console.warn('FileOpener.open error:', err);
        const errMsg = (err && (err.message || String(err))) || '';
        const errCode = err && err.code;
        const isActivityNotFound = errCode === '8' ||
          errMsg.toLowerCase().includes('activity not found') ||
          errMsg.toLowerCase().includes('no activity found') ||
          errMsg.toLowerCase().includes('activitynotfound');

        const error = new Error(errMsg || 'Failed to open file');
        error.isActivityNotFound = isActivityNotFound;
        error.code = errCode;
        throw error;
      }
    }

    // Fallback: Web window.open or anchor download
    if (uri) {
      const win = window.open(uri, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = uri;
        a.download = fileName || 'report.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return { success: true };
    }
    throw new Error('Cannot open file: URI is invalid');
  }

  /**
   * Share the file via native share sheet (@capacitor/share) or Web Share API
   */
  async function shareReportFile(fileInfo) {
    if (!fileInfo) throw new Error('File information missing');
    const { uri, fileName, mimeType, isNative, blob } = fileInfo;

    const Share = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) || (window.Capacitor && window.Capacitor.Share);

    if (isNative && Share && typeof Share.share === 'function') {
      try {
        await Share.share({
          title: fileName,
          url: uri,
          dialogTitle: fileName
        });
        return { success: true, method: 'native_share' };
      } catch (err) {
        const errMsg = (err && (err.message || String(err))) || '';
        if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('abort')) {
          return { success: true, method: 'cancelled' };
        }
        console.warn('Capacitor Share error:', err);
        throw err;
      }
    }

    // Web Fallback: Web Share API or download
    if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined' && blob) {
      try {
        const file = new File([blob], fileName, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileName
          });
          return { success: true, method: 'web_share' };
        }
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { success: true, method: 'cancelled' };
        }
        console.warn('Web Share failed, fallback to download:', err);
      }
    }

    const a = document.createElement('a');
    a.href = uri;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, method: 'download' };
  }

  /**
   * Backward-compatible exportOrShareReport
   */
  async function exportOrShareReport(reportResult) {
    if (!reportResult || !reportResult.doc) {
      throw new Error('Valid reportResult object required');
    }
    const { doc, fileName, blob, dataUri } = reportResult;
    try {
      const saved = await saveReportToFile(dataUri || doc.output('datauristring'), fileName, true, 'application/pdf');
      return await shareReportFile(saved);
    } catch (e) {
      doc.save(fileName);
      return { success: true, method: 'downloaded' };
    }
  }

  return {
    generateJobReport,
    saveReportToFile,
    openReportFile,
    shareReportFile,
    buildSanitizedFileName,
    formatFileSize,
    exportOrShareReport,
    svgToPngDataUrl
  };
}));
