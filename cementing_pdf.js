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

  function fmtCap(capFtVal, isMetric, dec = 5) {
    if (capFtVal === undefined || capFtVal === null || capFtVal === '' || isNaN(capFtVal)) return '-';
    const val = isMetric ? (Number(capFtVal) / M_PER_FT) : Number(capFtVal);
    return Number(val).toFixed(dec);
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
    const capUnit = isMetric ? 'bbl/m' : 'bbl/ft';

    const sectionName = (inp && inp.name) || cementingState.jobName || 'Well Cementing Job';
    const presetLabel = (cementingState.sectionPresets && cementingState.sectionPresets[cementingState.section] && cementingState.sectionPresets[cementingState.section].label)
      || (inp && inp.sectionLabel) || cementingState.section || 'Subsea Wellhead';
    const model = (inp && inp.model) || (result && result.model) || 'subsea';
    const modelLabel = model === 'riserless' ? 'RISERLESS CASING' : 'SUBSEA WELLHEAD';
    const unitSystemLabel = isMetric ? 'METRIC (m, bbl, ppg)' : 'OILFIELD (ft, bbl, ppg)';
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
      doc.text(t('DRILLING TOOLKIT · SUBSEA WELLHEAD CEMENTING PLAN'), margin, 10);

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
     * PAGE 1: TITLE BANNER, SUMMARY, WELL DATA, SEQUENCE
     * ==========================================
     */
    drawPageHeader(1);

    // Main Report Banner Card
    let yPos = 16;
    doc.setFillColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(14);
    doc.text(t('Subsea Cementing Job Plan'), margin + 6, yPos + 8);

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(186, 230, 253); // Light cyan
    doc.text(`Job: ${sectionName}  ·  Section: ${presetLabel}`, margin + 6, yPos + 14);

    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Mode: ${model.toUpperCase()}   |   Units: ${unitSystemLabel}   |   Date: ${dateStr}`, margin + 6, yPos + 19.5);

    yPos += 28;

    // Executive Summary KPI Grid (2 rows x 4 cols)
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('EXECUTIVE JOB SUMMARY'), margin, yPos);
    yPos += 3;

    const shoeDisp = fmtDepth(inp.shoe, unit);
    const totSlurryDisp = fmtNum(result.total_slurry, 1) + ' bbl';
    const totPumpDisp = fmtNum(result.total_pumped, 1) + ' bbl';
    const emwShoeDisp = result.emw_shoe !== undefined ? fmtNum(result.emw_shoe, 2) + ' ppg' : '-';
    const diffPressDisp = fmtNum(result.diff_press, 0) + ' psi';
    const annFcDisp = fmtNum(result.p_ann_fc, 0) + ' psi';
    const colSfDisp = (result.collapse_sf !== undefined && result.collapse_sf !== null) ? fmtNum(result.collapse_sf, 2) : '-';
    const pumpPressDisp = (model === 'subsea' ? fmtNum(result.bump_pressure, 0) : fmtNum(inp.max_pump_pressure, 0)) + ' psi';

    const kpiData = [
      [
        { content: 'Shoe Depth\n' + shoeDisp + ' ' + depthUnit, styles: {
        font: primaryFont, halign: 'center' } },
        { content: 'Total Slurry\n' + totSlurryDisp, styles: {
        font: primaryFont, halign: 'center', fontStyle: 'bold' } },
        { content: 'Total Pumped\n' + totPumpDisp, styles: {
        font: primaryFont, halign: 'center' } },
        { content: 'Shoe EMW\n' + emwShoeDisp, styles: {
        font: primaryFont, halign: 'center', fontStyle: 'bold', textColor: cNavy } }
      ],
      [
        { content: 'Annulus Press (FC)\n' + annFcDisp, styles: {
        font: primaryFont, halign: 'center' } },
        { content: 'Diff Press (FC)\n' + diffPressDisp, styles: {
        font: primaryFont, halign: 'center' } },
        { content: 'Collapse SF\n' + colSfDisp, styles: {
        font: primaryFont, halign: 'center' } },
        { content: (model === 'subsea' ? 'Bump Pressure\n' : 'Max Pump Press\n') + pumpPressDisp, styles: {
        font: primaryFont, halign: 'center' } }
      ]
    ];

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      body: kpiData,
      styles: {
        font: primaryFont,
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: cBorder,
        lineWidth: 0.25,
        fillColor: cBgSubtle,
        textColor: cDark
      }
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Section 1: Well Data & Hole Geometry
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('WELL ELEVATIONS & HOLE / CASING GEOMETRY'), margin, yPos);
    yPos += 3;

    const hangerOrMudlineLabel = model === 'riserless' ? 'Mudline Depth' : 'Wellhead Hanger';
    const hangerOrMudlineVal = model === 'riserless' ? fmtDepth(inp.mudline, unit) : fmtDepth(inp.hanger, unit);

    let caps = null;
    if (typeof window !== 'undefined' && typeof window.computeJobCapacities === 'function') {
      caps = window.computeJobCapacities(inp, cementingState.overrides);
    }
    const csg = caps ? caps.csg : null;
    const dp = caps ? caps.dp : null;
    const hole = caps ? caps.hole : null;

    const holeSizeDisplay = hole ? `${hole.od_in}"` : (inp.hole_size ? `${fmtNum(inp.hole_size, 3)}"` : '-');
    const csgOdDisplay = csg ? `${csg.od_in}"` : (inp.csg_od ? `${fmtNum(inp.csg_od, 3)}"` : '-');
    const csgWtDisplay = csg ? `${csg.weight_ppf} lb/ft` : (inp.csg_weight ? `${fmtNum(inp.csg_weight, 1)} lb/ft` : '-');
    const csgIdDisplay = csg ? `${csg.id_in}"` : (inp.csg_id ? `${fmtNum(inp.csg_id, 3)}"` : '-');
    const csgGradeDisplay = (csg && csg.grade) ? csg.grade : (inp.csg_grade || '-');
    const dpOdDisplay = dp ? `${dp.od_in}"` : (inp.dp_od ? `${fmtNum(inp.dp_od, 3)}"` : '-');
    const riserIdDisplay = (inp.tubulars && inp.tubulars.riser_custom_id) ? `${inp.tubulars.riser_custom_id}"` : (inp.riser_id ? `${fmtNum(inp.riser_id, 3)}"` : '19.5"');

    const effectiveCaps = (caps && caps.effective) ? caps.effective : inp;

    const wellGeoData = [
      [t('Air Gap'), `${fmtDepth(inp.air_gap, unit)} ${depthUnit}`, t('Hole Size OD'), `${holeSizeDisplay} (${fmtNum(inp.excess_pct, 0)}% excess)`],
      [t('Water Depth'), `${fmtDepth(inp.water_depth, unit)} ${depthUnit}`, t('Casing OD / Weight'), `${csgOdDisplay} / ${csgWtDisplay}`],
      [hangerOrMudlineLabel, `${hangerOrMudlineVal} ${depthUnit}`, t('Casing ID / Grade'), `${csgIdDisplay} / ${csgGradeDisplay}`],
      [t('Previous Shoe'), inp.prev_shoe > 0 ? `${fmtDepth(inp.prev_shoe, unit)} ${depthUnit}` : 'N/A (Conductor)', t('Casing Capacity'), `${fmtCap(effectiveCaps.cap_csg, isMetric)} ${capUnit}`],
      [t('Casing Shoe Depth'), `${fmtDepth(inp.shoe, unit)} ${depthUnit}`, t('Open Hole Annulus Cap'), `${fmtCap(effectiveCaps.cap_ann_oh, isMetric)} ${capUnit}`],
      [t('Shoe Track Length'), `${fmtDepth(inp.shoe_track_len, unit)} ${depthUnit}`, t('Cased Annulus Cap'), `${fmtCap(effectiveCaps.cap_ann_c, isMetric)} ${capUnit}`],
      [t('Total Depth (TD)'), `${fmtDepth(inp.td, unit)} ${depthUnit}`, t('Inner String / DP OD'), `${dpOdDisplay} (${fmtCap(effectiveCaps.cap_dp, isMetric)} ${capUnit})`]
    ];

    if (model === 'subsea') {
      wellGeoData.push([t('Marine Riser ID'), `${riserIdDisplay}`, t('Marine Riser Cap'), `${fmtCap(effectiveCaps.cap_riser, isMetric)} ${capUnit}`]);
    }

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Parameter (Datum / Depth)', 'Value', 'Tubular / Annulus Parameter', 'Value']],
      body: wellGeoData,
      headStyles: {
        font: primaryFont,
        fillColor: cNavy,
        textColor: cWhite,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      styles: {
        font: primaryFont,
        fontSize: 7,
        cellPadding: 1.8,
        textColor: cDark,
        lineColor: cBorder,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 41 },
        2: { fontStyle: 'bold', cellWidth: 50 },
        3: { cellWidth: 41 }
      },
      alternateRowStyles: { fillColor: cBgSubtle }
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Section 2: Pumping Program & Displacement Sequence
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('PUMPING PROGRAM & DISPLACEMENT SEQUENCE'), margin, yPos);
    yPos += 3;

    const pumpSeq = result.pumping_sequence || [];
    const pumpSeqRows = pumpSeq.map(s => {
      const vol = Number(s.volume || 0).toFixed(1);
      const mw = Number(s.density || 0).toFixed(1);
      const stks = Number(inp.pump_output) > 0 ? (s.volume / Number(inp.pump_output)).toFixed(0) : '-';
      return [s.step, s.name, `${vol} bbl`, `${mw} ppg`, stks];
    });

    // Total row
    const totStk = Number(inp.pump_output) > 0 ? ((result.total_pumped || 0) / Number(inp.pump_output)).toFixed(0) : '-';
    pumpSeqRows.push([
      { content: '', styles: {
        font: primaryFont, fontStyle: 'bold' } },
      { content: t('Total Pumped Volume'), styles: {
        font: primaryFont, fontStyle: 'bold' } },
      { content: `${fmtNum(result.total_pumped, 1)} bbl`, styles: {
        font: primaryFont, fontStyle: 'bold' } },
      { content: '-', styles: {
        font: primaryFont, fontStyle: 'bold', halign: 'center' } },
      { content: `${totStk} stk`, styles: {
        font: primaryFont, fontStyle: 'bold' } }
    ]);

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Step #', 'Fluid Description', 'Volume (bbl)', 'Density (ppg)', 'Pump Strokes (stk)']],
      body: pumpSeqRows,
      headStyles: {
        font: primaryFont,
        fillColor: cNavy,
        textColor: cWhite,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      styles: {
        font: primaryFont,
        fontSize: 7,
        cellPadding: 1.8,
        textColor: cDark,
        lineColor: cBorder,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { cellWidth: 70 },
        2: { halign: 'right', cellWidth: 32 },
        3: { halign: 'right', cellWidth: 32 },
        4: { halign: 'right', cellWidth: 32 }
      },
      alternateRowStyles: { fillColor: cBgSubtle }
    });

    yPos = doc.lastAutoTable.finalY + 3;

    // Small displacement note row
    doc.setFont(primaryFont, 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    const dispNotes = [
      `Displacement: ${fmtNum(result.disp_tot, 1)} bbl (${fmtNum(result.strokes, 0)} stk @ ${fmtNum(inp.pump_output, 3)} bbl/stk)`
    ];
    if (model === 'subsea') {
      dispNotes.push(`Max Disp No Bump: ${fmtNum(result.max_disp_no_bump, 1)} bbl`);
      dispNotes.push(`Bottom Plug Lands: ${fmtNum(result.bottom_plug_lands, 1)} bbl`);
    } else {
      dispNotes.push(`Shoe Track Vol: ${fmtNum(result.st_vol, 1)} bbl`);
      dispNotes.push(`Rathole Vol: ${fmtNum(result.rat_vol, 1)} bbl`);
    }
    doc.text(dispNotes.join('   |   '), margin, yPos + 3);

    /**
     * ==========================================
     * PAGE 2: PLACEMENT BREAKDOWN, HYDRAULICS & CHECKS
     * ==========================================
     */
    doc.addPage();
    drawPageHeader(2);

    yPos = 18;

    // Section 3: Cement Placement & Annular Rise Breakdown
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('CEMENT PLACEMENT & ANNULAR RISE BREAKDOWN'), margin, yPos);
    yPos += 3;

    const tocVal = fmtEngineDepth(result.toc, isMetric) + ' ' + depthUnit;
    const tailTopVal = fmtEngineDepth(result.tail_top, isMetric) + ' ' + depthUnit;
    const spTopVal = fmtEngineDepth(result.sp_top, isMetric) + ' ' + depthUnit;
    const subseaOrRiserlessPlacement = model === 'riserless'
      ? `TOC Below Mudline: ${fmtEngineDepth(result.toc_below_mudline, isMetric)} ${depthUnit}   |   Seabed Cement Returns: ${fmtNum(result.cement_returns_seabed, 1)} bbl`
      : `Cement in Riser: ${fmtEngineDepth(result.cement_in_riser, isMetric)} ${depthUnit}   |   Returns at Surface: ${fmtNum(result.returns_surface, 1)} bbl`;

    const placementMetrics = [
      [
        { content: 'Top of Cement (TOC)\n' + tocVal, styles: {
        font: primaryFont, halign: 'center', fontStyle: 'bold' } },
        { content: 'Tail Slurry Top\n' + tailTopVal, styles: {
        font: primaryFont, halign: 'center' } },
        { content: 'Spacer Top\n' + spTopVal, styles: {
        font: primaryFont, halign: 'center' } },
        { content: 'Total Slurry Vol\n' + fmtNum(result.total_slurry, 1) + ' bbl', styles: {
        font: primaryFont, halign: 'center', fontStyle: 'bold' } }
      ]
    ];

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      body: placementMetrics,
      styles: {
        font: primaryFont,
        fontSize: 7.5,
        cellPadding: 2.2,
        lineColor: cBorder,
        lineWidth: 0.25,
        fillColor: cBgSubtle,
        textColor: cDark
      }
    });

    yPos = doc.lastAutoTable.finalY + 2.5;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(subseaOrRiserlessPlacement, margin, yPos + 2.5);
    yPos += 5.5;

    // Rise Breakdown Table
    const riseTableRows = [];
    if (Number(inp.tail_vol || 0) > 0 || (result.rise_tail || 0) > 0) {
      riseTableRows.push([t('Tail Slurry'), `${fmtNum(inp.tail_vol, 1)} bbl`, `${fmtEngineDepth(result.rise_tail, isMetric)} ${depthUnit}`]);
    }
    riseTableRows.push([t('Lead Slurry'), `${fmtNum(inp.lead_vol, 1)} bbl`, `${fmtEngineDepth(result.rise_lead, isMetric)} ${depthUnit}`]);
    riseTableRows.push([t('Spacer'), `${fmtNum(inp.sp_vol, 1)} bbl`, `${fmtEngineDepth(result.rise_sp, isMetric)} ${depthUnit}`]);
    if (Number(inp.f2_vol || 0) > 0) {
      riseTableRows.push([t('2nd Mud Wash'), `${fmtNum(inp.f2_vol, 1)} bbl`, `${fmtEngineDepth(result.rise_f2, isMetric)} ${depthUnit}`]);
    }
    if (Number(inp.f1_vol || 0) > 0) {
      riseTableRows.push([t('1st Mud Wash'), `${fmtNum(inp.f1_vol, 1)} bbl`, `${fmtEngineDepth(result.rise_f1, isMetric)} ${depthUnit}`]);
    }
    riseTableRows.push([
      { content: t('Total Cement Rise in Annulus'), styles: {
        font: primaryFont, fontStyle: 'bold' } },
      { content: `${fmtNum(result.total_slurry, 1)} bbl`, styles: {
        font: primaryFont, fontStyle: 'bold' } },
      { content: `${fmtEngineDepth(result.rise_tot, isMetric)} ${depthUnit}`, styles: {
        font: primaryFont, fontStyle: 'bold', textColor: cNavy } }
    ]);

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Annular Interval', 'Pumped Volume (bbl)', 'Rise Height']],
      body: riseTableRows,
      headStyles: {
        font: primaryFont,
        fillColor: cNavy,
        textColor: cWhite,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      styles: {
        font: primaryFont,
        fontSize: 7,
        cellPadding: 1.8,
        textColor: cDark,
        lineColor: cBorder,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 82 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 50 }
      },
      alternateRowStyles: { fillColor: cBgSubtle }
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Section 4: Hydraulics, EMW & Pressure Limits
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('HYDRAULICS, EMW & PRESSURE LIMITS'), margin, yPos);
    yPos += 3;

    const hydRows = [
      [t('Float Collar'), `${fmtNum(result.p_ann_fc, 0)} psi`, `${fmtNum(result.emw_fc, 2)} ppg`, '-'],
      [t('Casing Shoe'), `${fmtNum(result.p_ann_shoe, 0)} psi`, `${fmtNum(result.emw_shoe, 2)} ppg`, '-']
    ];

    if (result.emw_prev_shoe !== undefined) {
      const lotMarginStr = result.lot_margin !== undefined
        ? `${result.lot_margin >= 0 ? '+' : ''}${fmtNum(result.lot_margin, 2)} ppg (LOT ${fmtNum(inp.lot, 1)} ppg)`
        : '-';
      hydRows.push([t('Previous Shoe'), `${fmtNum(result.p_prev_shoe, 0)} psi`, `${fmtNum(result.emw_prev_shoe, 2)} ppg`, lotMarginStr]);
    }

    const pumpOrBumpLimit = model === 'subsea'
      ? [`Bump Pressure`, `${fmtNum(result.bump_pressure, 0)} psi`, '-', `<= ${fmtNum(result.burst_limit, 0)} psi (80% burst)`]
      : [`Max Pump Pressure`, `${fmtNum(inp.max_pump_pressure, 0)} psi`, '-', `<= ${fmtNum(result.burst_limit, 0)} psi (80% burst)`];
    hydRows.push(pumpOrBumpLimit);

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Pressure Datum', 'Hydrostatic / Annulus Pressure', 'Equivalent Mud Weight (EMW)', 'Safety Limit / LOT Margin']],
      body: hydRows,
      headStyles: {
        font: primaryFont,
        fillColor: cNavy,
        textColor: cWhite,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      styles: {
        font: primaryFont,
        fontSize: 7,
        cellPadding: 1.8,
        textColor: cDark,
        lineColor: cBorder,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        1: { halign: 'right', cellWidth: 46 },
        2: { halign: 'right', cellWidth: 46 },
        3: { halign: 'right', cellWidth: 48 }
      },
      alternateRowStyles: { fillColor: cBgSubtle }
    });

    yPos = doc.lastAutoTable.finalY + 2.5;

    // Float status banner
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    const floatStatusNote = `Float Status: ${result.diff_meaning || '-'}   |   Diff Press: ${fmtNum(result.diff_press, 0)} psi   |   Collapse SF: ${fmtNum(result.collapse_sf, 2)}`;
    doc.text(floatStatusNote, margin, yPos + 2);
    yPos += 6;

    // Section 5: Job Validation Checks
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('JOB VALIDATION & RISK CHECKS'), margin, yPos);
    yPos += 3;

    const checks = result.checks || [];
    const checkRows = checks.map(c => {
      const isOk = c.status === 'OK';
      let msg = (c.message || c.msg || '-');
      msg = msg.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/±/g, '+/-');
      msg = msg.replace(/\b(\d+\.\d{3,})\b/g, (m, n) => Number(n).toFixed(1));
      return [
        { content: c.status, styles: {
        font: primaryFont, halign: 'center', fontStyle: 'bold', textColor: isOk ? cGreen : cAmber } },
        { content: c.label || c.name || '-', styles: {
        font: primaryFont, fontStyle: 'bold' } },
        { content: msg }
      ];
    });

    if (checkRows.length === 0) {
      checkRows.push(['OK', 'General Safety', 'All routine parameters within standard subsea cementing envelope.']);
    }

    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [['Status', 'Validation Check', 'Analysis & Recommendations']],
      body: checkRows,
      headStyles: {
        font: primaryFont,
        fillColor: cNavy,
        textColor: cWhite,
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2
      },
      styles: {
        font: primaryFont,
        fontSize: 7,
        cellPadding: 2,
        textColor: cDark,
        lineColor: cBorder,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 48 },
        2: { cellWidth: 114 }
      },
      alternateRowStyles: { fillColor: cBgSubtle }
    });

    /**
     * ==========================================
     * PAGE 3: WELL CEMENTING SCHEMATIC & PROFILE
     * ==========================================
     */
    doc.addPage();
    drawPageHeader(3);

    yPos = 18;
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(cNavy[0], cNavy[1], cNavy[2]);
    doc.text(t('WELL CEMENTING SCHEMATIC & FLUID PLACEMENT'), margin, yPos);
    yPos += 2;

    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    doc.text(t('Vertical profile to TD · Sub-mudline geometry and annular placement to scale'), margin, yPos + 3);
    yPos += 6;

    // Attempt to rasterize live SVG schematic
    let svgMarkup = null;
    if (typeof window !== 'undefined') {
      const liveSvg = document.querySelector('#schematic-canvas svg, .cement-schematic-canvas svg, #schematic-svg-container svg');
      if (liveSvg) {
        svgMarkup = new XMLSerializer().serializeToString(liveSvg);
      }
    }

    if (!svgMarkup && typeof window !== 'undefined' && typeof window.renderWellCementingSchematic === 'function') {
      const engineInp = (typeof window.getEngineInputs === 'function') ? window.getEngineInputs() : inp;
      svgMarkup = window.renderWellCementingSchematic(result, engineInp, unit);
    }

    let pngDataUrl = null;
    if (svgMarkup) {
      try {
        pngDataUrl = await svgToPngDataUrl(svgMarkup, 1064, 1600);
      } catch (err) {
        console.warn('Schematic rasterization error:', err);
      }
    }

    if (pngDataUrl) {
      // Draw schematic centered on page 3
      const imgWidth = 105;
      const imgHeight = 158; // Aspect ~0.665
      const imgX = margin + (contentWidth - imgWidth) / 2;
      const imgY = yPos;

      // Card border
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.setFillColor(250, 248, 245);
      doc.roundedRect(imgX - 3, imgY - 2, imgWidth + 6, imgHeight + 4, 3, 3, 'FD');

      doc.addImage(pngDataUrl, 'JPEG', imgX, imgY, imgWidth, imgHeight);

      // Key elevations callout box below schematic
      const annotY = imgY + imgHeight + 7;
      const annotData = [
        [
          `RKB: 0.0 ${depthUnit}`,
          `Sea Level: ${fmtDepth(inp.air_gap, unit)} ${depthUnit}`,
          `Mudline: ${hangerOrMudlineVal} ${depthUnit}`,
          `TOC: ${tocVal}`,
          `Tail Top: ${tailTopVal}`,
          `Shoe: ${shoeDisp} ${depthUnit}`,
          `TD: ${fmtDepth(inp.td, unit)} ${depthUnit}`
        ]
      ];

      doc.autoTable({
        startY: annotY,
        margin: { left: margin, right: margin },
        theme: 'plain',
        body: annotData,
        styles: {
        font: primaryFont,
          fontSize: 7,
          fontStyle: 'bold',
          cellPadding: 1.5,
          halign: 'center',
          textColor: cNavy
        }
      });
    } else {
      // Fallback placeholder if canvas export was blocked
      doc.setFillColor(cBgSubtle[0], cBgSubtle[1], cBgSubtle[2]);
      doc.roundedRect(margin, yPos, contentWidth, 80, 2, 2, 'F');
      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(t('Schematic preview available in interactive viewer on device.'), margin + 10, yPos + 40);
    }

    /**
     * ==========================================
     * FINALIZE: STAMP PAGE NUMBERS & FOOTERS
     * ==========================================
     */
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setFont(primaryFont, 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
      doc.text(t('CONFIDENTIAL · SUBSEA WELLHEAD CEMENTING JOB PLAN'), margin, pageHeight - 7);
      doc.text(`Generated: ${dateStr}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    const activeSection = (cementingState && cementingState.section) || (inp && inp.name) || 'Subsea';
    const fileName = buildSanitizedFileName(inp.name, activeSection, 'Subsea', 'pdf');
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1] || '';
    const blob = doc.output('blob');

    return {
      doc,
      fileName,
      blob,
      dataUri,
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
