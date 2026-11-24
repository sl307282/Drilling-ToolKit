/**
 * Drilling ToolKit - Well Control Job Record PDF Generator
 * 100% Offline Unicode & Multilingual PDF Engine (html2canvas + jsPDF)
 * Supports Hindi (Devanagari), Arabic, CJK, Cyrillic, and all 13 supported languages.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WellControlPdf = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function t(key, fallback) {
    if (typeof window !== 'undefined' && window.t) {
      return window.t(key, fallback || key);
    }
    return fallback || key;
  }

  /**
   * High-Resolution Step-Down Chart SVG Generator for PDF Reports
   * High-DPI viewBox (1400x620) with crisp typography, ICP/FCP callout badges, and gridlines
   */
  function buildHighResStepDownChartSvg(reportData, isRtl, tFunc) {
    const t = tFunc || ((k, f) => f || k);
    const schedule = reportData.schedule || [];
    if (!schedule || schedule.length === 0) return '';

    const width = 1400;
    const height = 620;
    const padLeft = 140;
    const padRight = 100;
    const padTop = 85;
    const padBottom = 85;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const pressValues = schedule.map(s => Number(s.dpPressure !== undefined ? s.dpPressure : s.drillPipePressure) || 0);
    const icpVal = Number(reportData.icp) || pressValues[0] || 0;
    const fcpVal = Number(reportData.fcp) || pressValues[pressValues.length - 1] || 0;
    const maxPressRaw = Math.max(...pressValues, icpVal, 100);
    const maxPress = Math.ceil(maxPressRaw * 1.15 / 50) * 50;

    const lastPt = schedule[schedule.length - 1];
    const maxStk = Number(lastPt.stroke !== undefined ? lastPt.stroke : (lastPt.strokes || reportData.surfaceToBitStrokes || 1000));
    const safeMaxStk = Math.max(maxStk, 1);

    const uPsi = t(reportData.pressUnit || 'psi', reportData.pressUnit || 'psi');
    const uStk = t(reportData.strokeUnit || 'stks', reportData.strokeUnit || 'stks');

    let dPath = '';
    let areaPath = '';
    let markers = '';

    schedule.forEach((pt, i) => {
      const stk = Number(pt.stroke !== undefined ? pt.stroke : (pt.strokes || 0));
      const dp = Number(pt.dpPressure !== undefined ? pt.dpPressure : (pt.drillPipePressure || 0));
      const x = padLeft + (stk / safeMaxStk) * chartW;
      const y = padTop + chartH - (dp / maxPress) * chartH;

      if (i === 0) {
        dPath += `M ${x} ${y}`;
        areaPath += `M ${x} ${padTop + chartH} L ${x} ${y}`;
        const dpRounded = Math.round(dp);
        markers += `
          <g class="chart-icp-marker">
            <circle cx="${x}" cy="${y}" r="9" fill="#EF4444" stroke="#FFFFFF" stroke-width="3" />
            <rect x="${x}" y="${y - 56}" width="186" height="44" rx="8" fill="#EF4444" />
            <polygon points="${x + 14},${y - 12} ${x + 26},${y - 2} ${x + 38},${y - 12}" fill="#EF4444" />
            <text x="${x + 93}" y="${y - 28}" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">ICP ${dpRounded} ${uPsi}</text>
          </g>
        `;
      } else {
        dPath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }

      if (i === schedule.length - 1) {
        areaPath += ` L ${x} ${padTop + chartH} Z`;
        const dpRounded = Math.round(dp);
        markers += `
          <g class="chart-fcp-marker">
            <circle cx="${x}" cy="${y}" r="9" fill="#0284C7" stroke="#FFFFFF" stroke-width="3" />
            <rect x="${x - 186}" y="${y - 56}" width="186" height="44" rx="8" fill="#0284C7" />
            <polygon points="${x - 38},${y - 12} ${x - 26},${y - 2} ${x - 14},${y - 12}" fill="#0284C7" />
            <text x="${x - 93}" y="${y - 28}" font-size="20" font-weight="800" fill="#FFFFFF" text-anchor="middle">FCP ${dpRounded} ${uPsi}</text>
          </g>
        `;
      } else if (i > 0) {
        markers += `<circle cx="${x}" cy="${y}" r="5.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" />`;
      }
    });

    // Pressure Grid Lines (Y-axis) - 5 divisions
    let gridLines = '';
    for (let i = 0; i <= 4; i++) {
      const val = (maxPress / 4) * i;
      const y = padTop + chartH - (val / maxPress) * chartH;
      gridLines += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6,6" />
        <text x="${padLeft - 16}" y="${y + 6}" font-size="18" font-weight="700" fill="#64748B" text-anchor="end">${Math.round(val)}</text>
      `;
    }

    // Strokes Grid Lines (X-axis) - 4 divisions
    for (let i = 0; i <= 4; i++) {
      const stk = Math.round((safeMaxStk / 4) * i);
      const x = padLeft + (stk / safeMaxStk) * chartW;
      gridLines += `
        <line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + chartH}" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6,6" />
        <text x="${x}" y="${padTop + chartH + 34}" font-size="18" font-weight="700" fill="#64748B" text-anchor="middle">${stk.toLocaleString()}</text>
      `;
    }

    const yTitle = `${t('Pressure', 'Pressure')} (${uPsi})`;
    const xTitle = `${t('Strokes to Bit', 'Strokes to Bit')} (${uStk})`;

    return `
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#FAF8F5; border-radius:8px; font-family:'Noto Sans', system-ui, sans-serif; display:block;">
        <defs>
          <linearGradient id="stepDownGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284C7" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#0284C7" stop-opacity="0.04" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        ${gridLines}

        <!-- Shaded Area Under Curve -->
        <path d="${areaPath}" fill="url(#stepDownGrad)" />

        <!-- Axes -->
        <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartH}" stroke="#94A3B8" stroke-width="3" />
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#94A3B8" stroke-width="3" />

        <!-- Step-Down Profile Curve -->
        <path d="${dPath}" stroke="#0284C7" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Markers & Callouts -->
        ${markers}

        <!-- Axis Labels -->
        <text x="36" y="${padTop + chartH / 2}" font-size="20" font-weight="800" fill="#1E293B" transform="rotate(-90 36 ${padTop + chartH / 2})" text-anchor="middle">${yTitle}</text>
        <text x="${padLeft + chartW / 2}" y="${height - 20}" font-size="20" font-weight="800" fill="#1E293B" text-anchor="middle">${xTitle}</text>
      </svg>
    `;
  }

  /**
   * Core Unicode-Safe HTML Pages to jsPDF Renderer
   * Renders each HTML page via native browser typography (Chromium HarfBuzz)
   * at 3x high-DPI scale into jsPDF A4 pages with zero blank leading pages.
   */
  async function renderHtmlPagesToPdf(pagesHtml, options) {
    const opts = options || {};
    const jsPdfLib = (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF)
      ? window.jspdf.jsPDF
      : (typeof jsPDF !== 'undefined' ? jsPDF : null);

    if (!jsPdfLib) {
      throw new Error('PDF export engine (jsPDF) is not loaded.');
    }

    const doc = new jsPdfLib({
      orientation: opts.orientation || 'portrait',
      unit: opts.unit || 'mm',
      format: opts.format || 'a4'
    });

    const hasHtml2Canvas = typeof window !== 'undefined' && typeof window.html2canvas === 'function';

    // Filter valid pages to avoid blank leading or trailing pages
    const rawPages = Array.isArray(pagesHtml) ? pagesHtml : [pagesHtml];
    const validPages = rawPages.filter(h => typeof h === 'string' && h.trim().length > 0);

    if (validPages.length === 0) {
      throw new Error('No valid HTML page content provided to renderHtmlPagesToPdf');
    }

    if (hasHtml2Canvas && typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px';
      container.style.zIndex = '-9999';
      container.style.opacity = '1';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);

      try {
        const currentLang = (typeof window !== 'undefined' && window.I18n && typeof window.I18n.getCurrentLang === 'function')
          ? window.I18n.getCurrentLang()
          : (opts.lang || 'en');
        const isRtl = (currentLang === 'ar');

        const multiScriptFont = '"Noto Sans", "Noto Sans Arabic", "Noto Sans Devanagari", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif';

        const rtlStyleTag = `
          <style>
            .pdf-render-page {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
            }
            .pdf-render-page * {
              box-sizing: border-box !important;
            }
            ${isRtl ? `
            .pdf-render-page[dir="rtl"] {
              direction: rtl !important;
              text-align: right !important;
            }
            .pdf-render-page[dir="rtl"] th,
            .pdf-render-page[dir="rtl"] td {
              text-align: right;
            }
            .pdf-render-page[dir="rtl"] th[style*="text-align:right"],
            .pdf-render-page[dir="rtl"] td[style*="text-align:right"] {
              text-align: left !important;
            }
            .pdf-render-page[dir="rtl"] th[style*="text-align:center"],
            .pdf-render-page[dir="rtl"] td[style*="text-align:center"] {
              text-align: center !important;
            }
            .pdf-render-page[dir="rtl"] .val-bidi,
            .pdf-render-page[dir="rtl"] .num-isolate {
              direction: ltr !important;
              unicode-bidi: isolate !important;
              display: inline-block !important;
              text-align: left !important;
            }
            ` : ''}
          </style>
        `;

        const pageElements = [];
        for (let i = 0; i < validPages.length; i++) {
          const pageDiv = document.createElement('div');
          pageDiv.className = 'pdf-render-page';
          if (isRtl) {
            pageDiv.classList.add('rtl-pdf-page');
            pageDiv.setAttribute('dir', 'rtl');
            pageDiv.style.direction = 'rtl';
            pageDiv.style.textAlign = 'right';
          } else {
            pageDiv.setAttribute('dir', 'ltr');
            pageDiv.style.direction = 'ltr';
            pageDiv.style.textAlign = 'left';
          }
          pageDiv.style.width = '794px';
          pageDiv.style.minHeight = '1123px';
          pageDiv.style.height = '1123px';
          pageDiv.style.maxHeight = '1123px';
          pageDiv.style.boxSizing = 'border-box';
          pageDiv.style.padding = '30px 36px 36px 36px';
          pageDiv.style.backgroundColor = '#FFFFFF';
          pageDiv.style.color = '#0F172A';
          pageDiv.style.fontFamily = multiScriptFont;
          pageDiv.style.position = 'relative';
          pageDiv.style.overflow = 'hidden';
          pageDiv.innerHTML = rtlStyleTag + validPages[i];
          container.appendChild(pageDiv);
          pageElements.push(pageDiv);
        }

        // Allow DOM reflow and font metrics to settle
        await new Promise(resolve => setTimeout(resolve, 80));

        const targetScale = opts.scale || 3;

        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) {
            doc.addPage();
          } else {
            doc.setPage(1);
          }
          const canvas = await window.html2canvas(pageElements[i], {
            scale: targetScale,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFFFF',
            windowWidth: 794
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        // Strip any unexpected trailing blank pages
        while (doc.internal.getNumberOfPages() > pageElements.length) {
          doc.deletePage(doc.internal.getNumberOfPages());
        }
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    } else {
      // Fallback for non-browser environments or when html2canvas is absent
      doc.setFontSize(14);
      doc.text(opts.fallbackTitle || 'Report', 20, 20);
    }

    const pdfBase64 = doc.output('datauristring');
    const fileName = opts.fileName || 'Report.pdf';

    return {
      doc,
      pdfBase64,
      dataUri: pdfBase64,
      fileName,
      blob: doc.output('blob')
    };
  }

  if (typeof window !== 'undefined') {
    window.renderHtmlPagesToPdf = renderHtmlPagesToPdf;
  }

  /**
   * Main Well Control Kill Sheet Report Generator
   */
  async function generateWellControlReport(reportData, options) {
    const opts = options || {};
    const rigType = reportData.rigType || (reportData.flowType === 'subsea' ? 'SUBSEA_FLOATER' : 'LAND');
    const isSurface = (rigType === 'LAND' || rigType === 'JACKUP');

    let rigTypeLabel = t('SUBSEA FLOATER (SUBSEA BOP)', 'SUBSEA FLOATER (SUBSEA BOP)');
    if (rigType === 'LAND') rigTypeLabel = t('LAND RIG (SURFACE BOP)', 'LAND RIG (SURFACE BOP)');
    if (rigType === 'JACKUP') rigTypeLabel = t('JACKUP RIG (SURFACE BOP)', 'JACKUP RIG (SURFACE BOP)');

    const dateStr = reportData.timestamp || new Date().toLocaleString();
    const jobName = reportData.jobName || 'Well #1 Kill Sheet';

    // Base CSS styles for report elements
    const tableStyle = 'width:100%; border-collapse:collapse; margin-bottom:8px; font-size:9.5px; line-height:1.3;';
    const thStyle = 'background:#1E293B; color:#FFFFFF; font-weight:700; padding:4px 6px; text-align:left; font-size:9px; border:1px solid #334155;';
    const tdLabel = 'padding:3px 6px; border:1px solid #E2E8F0; font-weight:600; color:#334155; background:#F8FAFC; width:28%;';
    const tdVal = 'padding:3px 6px; border:1px solid #E2E8F0; color:#0F172A; font-weight:500; width:22%;';
    const sectionTitleStyle = 'font-size:11px; font-weight:700; color:#0F172A; margin:6px 0 3px 0; text-transform:uppercase; letter-spacing:0.3px;';

    // Localized unit labels
    const uBbl = t('bbl', 'bbl');
    const uM = t('m', 'm');
    const uFt = t('ft', 'ft');
    const uPsi = t('psi', 'psi');
    const uPpg = t('ppg', 'ppg');
    const uStk = t('stk', 'stk');
    const uStks = t('stks', 'stks');
    const uSpm = t('SPM', 'SPM');
    const uMin = t('min', 'min');
    const uBblStk = t('bbl/stk', 'bbl/stk');
    const uSacks = t('sacks', 'sacks');
    const uTonnes = t('tonnes', 'tonnes');
    const uPsiFt = t('psi/ft', 'psi/ft');
    const naText = t('N/A', 'N/A');

    // 1. Well Geometry Data Rows
    const geomRows = [
      `<tr>
        <td style="${tdLabel}">${t('Depth Reference', 'Depth Reference')}</td>
        <td style="${tdVal}">${t('RKB (Rotary Kelly Bushing)', 'RKB (Rotary Kelly Bushing)')}</td>
        <td style="${tdLabel}">${t('String Volume', 'String Volume')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.stringVolume?.toFixed(2) || '-'} ${uBbl}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Hole TVD / MD', 'Hole TVD / MD')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.holeTVD} ${uM} (${(reportData.holeTVD * 3.28084).toFixed(1)} ${uFt}) / ${reportData.holeMD} ${uM}</span></td>
        <td style="${tdLabel}">${t('Open Hole Volume', 'Open Hole Volume')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.openHoleVolume?.toFixed(2) || '-'} ${uBbl}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Shoe TVD / MD', 'Shoe TVD / MD')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.shoeTVD} ${uM} (${(reportData.shoeTVD * 3.28084).toFixed(1)} ${uFt}) / ${reportData.shoeMD} ${uM}</span></td>
        <td style="${tdLabel}">${t('Annular Volume', 'Annular Volume')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.annularVolume?.toFixed(2) || '-'} ${uBbl}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Casing / Hole Size', 'Casing / Hole Size')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.casingSize || '20"'} / ${reportData.holeSize || '17.5"'}</span></td>
        <td style="${tdLabel}">${t('Total System Volume', 'Total System Volume')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.totalSystemVolume?.toFixed(2) || '-'} ${uBbl}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Pump Output', 'Pump Output')}</td>
        <td style="${tdVal}"><span class="val-bidi">${(reportData.pumpOutput || 0.1176).toFixed(4)} ${uBblStk}</span></td>
        <td style="${tdLabel}">${t('Surface to Bit Strokes', 'Surface to Bit Strokes')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.surfaceToBitStrokes || 0).toLocaleString()} ${uStks} (${(reportData.surfaceToBitTimeMin || (reportData.spm > 0 ? (reportData.surfaceToBitStrokes || 0) / reportData.spm : 0)).toFixed(1)} ${uMin})</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Selected SPM', 'Selected SPM')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.spm || 60} ${uSpm}</span></td>
        <td style="${tdLabel}">${t('Total Cycle Strokes', 'Total Cycle Strokes')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.totalCycleStrokes || (reportData.totalSystemVolume && reportData.pumpOutput ? reportData.totalSystemVolume / reportData.pumpOutput : 0)).toLocaleString()} ${uStks}</span></td>
      </tr>`
    ];

    if (reportData.shoeToSurfaceStrokes) {
      geomRows.push(`<tr>
        <td style="${tdLabel}">${t('Shoe to Surface Strokes', 'Shoe to Surface Strokes')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.shoeToSurfaceStrokes).toLocaleString()} ${uStks}</span></td>
        <td style="${tdLabel}">${t('Bottoms-Up Strokes', 'Bottoms-Up Strokes')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.bottomsUpStrokes || 0).toLocaleString()} ${uStks}</span></td>
      </tr>`);
    }

    if (rigType === 'LAND' && reportData.rkbGroundElevation) {
      geomRows.push(`<tr>
        <td style="${tdLabel}">${t('RKB Elevation above Ground', 'RKB Elevation above Ground')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.rkbGroundElevation} ${uM}</span></td>
        <td style="${tdLabel}">${t('BOP Position', 'BOP Position')}</td>
        <td style="${tdVal}">${t('Surface', 'Surface')}</td>
      </tr>`);
    }

    if (rigType === 'JACKUP' && reportData.waterDepth_m) {
      geomRows.push(`<tr>
        <td style="${tdLabel}">${t('Air Gap / Water Depth', 'Air Gap / Water Depth')}</td>
        <td style="${tdVal}"><span class="val-bidi">${(reportData.airGap_m || 0).toFixed(1)} ${uM} / ${(reportData.waterDepth_m || 0).toFixed(1)} ${uM}</span></td>
        <td style="${tdLabel}">${t('Depth Below Mudline', 'Depth Below Mudline')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.depthBelowMudline_m ? `${reportData.depthBelowMudline_m.toFixed(1)} ${uM}` : naText}</span></td>
      </tr>`);
      geomRows.push(`<tr>
        <td style="${tdLabel}">${t('Surface Conductor / Tie-back', 'Surface Conductor / Tie-back')}</td>
        <td style="${tdVal}">${reportData.hasSurfaceConductor ? t('YES (Active to mudline)', 'YES (Active to mudline)') : t('NO', 'NO')}</td>
        <td style="${tdLabel}">${t('BOP Position', 'BOP Position')}</td>
        <td style="${tdVal}">${t('Surface', 'Surface')}</td>
      </tr>`);
    }

    if (!isSurface) {
      geomRows.push(`<tr>
        <td style="${tdLabel}">${t('Water Depth / Air Gap', 'Water Depth / Air Gap')}</td>
        <td style="${tdVal}"><span class="val-bidi">${(reportData.waterDepth_m || 0).toFixed(1)} ${uM} / ${(reportData.airGap_m || 0).toFixed(1)} ${uM}</span></td>
        <td style="${tdLabel}">${t('Seawater Density', 'Seawater Density')}</td>
        <td style="${tdVal}"><span class="val-bidi">${(reportData.seawaterDensity_ppg || 8.55).toFixed(2)} ${uPpg}</span></td>
      </tr>`);
      geomRows.push(`<tr>
        <td style="${tdLabel}">${t('Riser Length', 'Riser Length')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.riserLength ? `${reportData.riserLength} ${uM}` : `${((reportData.waterDepth_m || 0) + (reportData.airGap_m || 0)).toFixed(1)} ${uM}`}</span></td>
        <td style="${tdLabel}">${t('Riser Displacement', 'Riser Displacement')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.riserDisplacementStrokes ? `${Math.round(reportData.riserDisplacementStrokes).toLocaleString()} ${uStks}` : naText}</span></td>
      </tr>`);
    }

    // 2. Kill Calculations Data Rows
    const killRows = [
      `<tr>
        <td style="${tdLabel}">${t('Original Mud Wt (OMW)', 'Original Mud Wt (OMW)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.omw} ${uPpg}</span></td>
        <td style="${tdLabel}">${t('Initial MAASP', 'Initial MAASP')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.maasp?.toFixed(1)} ${uPsi}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('LOT / FIT EMW (Safety Factor)', 'LOT / FIT EMW (Safety Factor)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.lotEmw} ${uPpg} (${Math.round((reportData.lotSafetyFactor || 1) * 100)}% -> ${(reportData.lotEmw * (reportData.lotSafetyFactor || 1)).toFixed(2)} ${uPpg})</span></td>
        <td style="${tdLabel}">${isSurface ? t('Dynamic MAASP (= MAASP)', 'Dynamic MAASP (= MAASP)') : t('Dynamic MAASP (MAASP - CLF)', 'Dynamic MAASP (MAASP - CLF)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${isSurface ? `${reportData.maasp?.toFixed(1)} ${uPsi}` : (reportData.dynMaasp ? `${reportData.dynMaasp.toFixed(1)} ${uPsi}` : naText)}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Slow Pump Rate (KRP / SCR)', 'Slow Pump Rate (KRP / SCR)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.krp} ${uPsi}</span></td>
        <td style="${tdLabel}">${isSurface ? t('Initial Choke Pressure (Holds SICP)', 'Initial Choke Pressure (Holds SICP)') : t('Initial Dynamic SICP (SICP - CLF)', 'Initial Dynamic SICP (SICP - CLF)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${isSurface ? `${reportData.sicp} ${uPsi}` : (reportData.dynSicp ? `${reportData.dynSicp.toFixed(1)} ${uPsi}` : naText)}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${isSurface ? t('Surface Manifold Friction', 'Surface Manifold Friction') : t('Choke Line Friction (CLF)', 'Choke Line Friction (CLF)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.surfaceFriction ? `${reportData.surfaceFriction} ${uPsi}` : (reportData.clf ? `${reportData.clf} ${uPsi}` : `0 ${uPsi}`)}</span></td>
        <td style="${tdLabel}">${t('Initial Circulating Pressure (ICP)', 'Initial Circulating Pressure (ICP)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.icp} ${uPsi}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Shut-In Drill Pipe Pressure (SIDP)', 'Shut-In Drill Pipe Pressure (SIDP)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.sidp} ${uPsi}</span></td>
        <td style="${tdLabel}">${t('Final Circulating Pressure (FCP)', 'Final Circulating Pressure (FCP)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.fcp?.toFixed(1)} ${uPsi}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Shut-In Casing Pressure (SICP)', 'Shut-In Casing Pressure (SICP)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.sicp} ${uPsi}</span></td>
        <td style="${tdLabel}">${t('Pressure Drop / 100 Strokes', 'Pressure Drop / 100 Strokes')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.pressDrop100?.toFixed(1)} ${uPsi}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Kill Mud Weight (Exact)', 'Kill Mud Weight (Exact)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.kmwExact?.toFixed(3)} ${uPpg}</span></td>
        <td style="${tdLabel}">${t('MAASP After Kill (Rounded)', 'MAASP After Kill (Rounded)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.maaspAfterKillRounded?.toFixed(1)} ${uPsi}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Kill Mud Weight to Use (Rounded)', 'Kill Mud Weight to Use (Rounded)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.kmwUsed?.toFixed(2)} ${uPpg}</span></td>
        <td style="${tdLabel}">${t('MAASP After Kill (Exact)', 'MAASP After Kill (Exact)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.maaspAfterKillExact?.toFixed(1)} ${uPsi}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Extra Overbalance from Rounding', 'Extra Overbalance from Rounding')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.extraOverbalancePsi || 0)} ${uPsi}</span></td>
        <td style="${tdLabel}">${t('Trip Margin / Recommended MW', 'Trip Margin / Recommended MW')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.tripMarginPpg ? `${reportData.tripMarginPpg.toFixed(2)} ${uPpg} / ${(reportData.recommendedMudWeightPpg || reportData.kmwUsed).toFixed(2)} ${uPpg}` : naText}</span></td>
      </tr>`
    ];

    if (!isSurface) {
      killRows.push(`<tr>
        <td style="${tdLabel}">${t('Riser Margin', 'Riser Margin')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.riserMarginPpg ? reportData.riserMarginPpg.toFixed(2) : 0} ${uPpg}</span></td>
        <td style="${tdLabel}">${t('BHP Reduction on Disconnect', 'BHP Reduction on Disconnect')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.bhpReductionPsi || 0)} ${uPsi}</span></td>
      </tr>`);
    }

    // 3. Kick & Barite Requirements
    const prepRows = [
      `<tr>
        <td style="${tdLabel}">${t('Pit Gain', 'Pit Gain')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.pitGain ? `${reportData.pitGain} ${uBbl}` : t('Not recorded', 'Not recorded')}</span></td>
        <td style="${tdLabel}">${t('Barite per 100 bbl Mud', 'Barite per 100 bbl Mud')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.baritePer100Bbl?.toFixed(2) || 0} ${uSacks}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Calculated Influx Gradient', 'Calculated Influx Gradient')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.influxGradientPsiFt ? `${reportData.influxGradientPsiFt.toFixed(3)} ${uPsiFt}` : naText}</span></td>
        <td style="${tdLabel}">${t('Total Kill Mud to Mix', 'Total Kill Mud to Mix')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.volToMix?.toFixed(1) || 0} ${uBbl}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Influx Density', 'Influx Density')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.influxDensityPpg ? `${reportData.influxDensityPpg.toFixed(2)} ${uPpg}` : naText}</span></td>
        <td style="${tdLabel}">${t('Total Barite Sacks (100 lb)', 'Total Barite Sacks (100 lb)')}</td>
        <td style="${tdVal}"><span class="val-bidi">${Math.round(reportData.totalBariteSacks || 0).toLocaleString()} ${uSacks}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Kick Classification', 'Kick Classification')}</td>
        <td style="${tdVal}">${reportData.influxClassification ? t(reportData.influxClassification, reportData.influxClassification) : naText}</td>
        <td style="${tdLabel}">${t('Total Barite Mass', 'Total Barite Mass')}</td>
        <td style="${tdVal}"><span class="val-bidi">${(reportData.totalBariteTonnes || 0).toFixed(1)} ${uTonnes}</span></td>
      </tr>`,
      `<tr>
        <td style="${tdLabel}">${t('Calculated Kick Tolerance', 'Calculated Kick Tolerance')}</td>
        <td style="${tdVal}"><span class="val-bidi">${reportData.kickToleranceBbl ? `${reportData.kickToleranceBbl.toFixed(1)} ${uBbl}` : naText}</span></td>
        <td style="${tdLabel}">${t('Kill Method / Step Freq', 'Kill Method / Step Freq')}</td>
        <td style="${tdVal}">${reportData.method === 'drillers' ? t("Driller's Method", "Driller's Method") : t("Wait & Weight", "Wait & Weight")} (<span class="val-bidi">${reportData.stepFrequency ? `${reportData.stepFrequency} ${uStk}` : `100 ${uStk}`}</span>)</td>
      </tr>`
    ];

    const currentLang = (typeof window !== 'undefined' && window.I18n && typeof window.I18n.getCurrentLang === 'function')
      ? window.I18n.getCurrentLang()
      : (opts.lang || 'en');
    const isRtl = (currentLang === 'ar');

    // Chart HTML block - use crisp high-res SVG directly if schedule exists, or opts.chartSvgMarkup / opts.chartImageData
    let chartHtml = '';
    const highResChartSvg = (opts.chartSvgMarkup || buildHighResStepDownChartSvg(reportData, isRtl, t));
    if (highResChartSvg) {
      chartHtml = `
        <div style="${sectionTitleStyle}">${t('4. DRILL PIPE PRESSURE STEP-DOWN PROFILE', '4. DRILL PIPE PRESSURE STEP-DOWN PROFILE')}</div>
        <div style="width:100%; height:145px; text-align:center; background:#FAF8F5; border:1px solid #E2E8F0; border-radius:6px; padding:4px; box-sizing:border-box; margin-bottom:8px; break-inside:avoid;">
          ${highResChartSvg}
        </div>
      `;
    } else if (opts.chartImageData) {
      chartHtml = `
        <div style="${sectionTitleStyle}">${t('4. DRILL PIPE PRESSURE STEP-DOWN PROFILE', '4. DRILL PIPE PRESSURE STEP-DOWN PROFILE')}</div>
        <div style="width:100%; height:145px; text-align:center; background:#FAF8F5; border:1px solid #E2E8F0; border-radius:6px; overflow:hidden; margin-bottom:8px; break-inside:avoid;">
          <img src="${opts.chartImageData}" style="width:100%; height:145px; object-fit:contain;" />
        </div>
      `;
    }

    // Top Header Banner HTML
    function buildBanner(pageNum, totalPages = 2) {
      return `
        <div style="background:#0F172A; color:#FFFFFF; padding:10px 14px; border-radius:6px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1 style="font-size:13px; font-weight:800; margin:0; color:#FFFFFF; letter-spacing:0.3px;">
              ${t('DRILLING TOOLKIT — WELL CONTROL KILL SHEET REPORT', 'DRILLING TOOLKIT — WELL CONTROL KILL SHEET REPORT')}
            </h1>
            <span style="font-size:8.5px; color:#94A3B8;">${t('Page', 'Page')} ${pageNum} ${t('of', 'of')} ${totalPages}</span>
          </div>
          <div style="font-size:8.5px; color:#BAE6FD; margin-top:3px;">
            ${t('Well / Job', 'Well / Job')}: <strong>${jobName}</strong> &nbsp;·&nbsp;
            ${t('Date', 'Date')}: ${dateStr} &nbsp;·&nbsp;
            ${t('RIG TYPE', 'RIG TYPE')}: <strong>${rigTypeLabel}</strong>
          </div>
        </div>
      `;
    }

    // Advisory Footer HTML
    function buildFooter(pageNum, totalPages = 2) {
      return `
        <div style="position:absolute; bottom:14px; left:36px; right:36px; border-top:1px solid #E2E8F0; padding-top:4px; display:flex; justify-content:space-between; font-size:8px; color:#64748B; font-style:italic;">
          <span>${t('Advisory only. Follow your well control manual and operator procedures.', 'Advisory only. Follow your well control manual and operator procedures.')}</span>
          <span>${t('Page', 'Page')} ${pageNum} ${t('of', 'of')} ${totalPages}</span>
        </div>
      `;
    }

    // PAGE 1 HTML
    const page1Html = `
      ${buildBanner(1, 2)}
      
      <div style="${sectionTitleStyle}">${t('1. WELLBORE & STRING GEOMETRY', '1. WELLBORE & STRING GEOMETRY')}</div>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}">${t('Parameter', 'Parameter')}</th>
            <th style="${thStyle}">${t('Value', 'Value')}</th>
            <th style="${thStyle}">${t('Parameter', 'Parameter')}</th>
            <th style="${thStyle}">${t('Value', 'Value')}</th>
          </tr>
        </thead>
        <tbody>
          ${geomRows.join('')}
        </tbody>
      </table>

      <div style="${sectionTitleStyle}; margin-top:5px;">${t('2. WELL CONTROL PRESSURES & KILL CALCULATIONS', '2. WELL CONTROL PRESSURES & KILL CALCULATIONS')}</div>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}">${t('Input Parameter', 'Input Parameter')}</th>
            <th style="${thStyle}">${t('Value', 'Value')}</th>
            <th style="${thStyle}">${t('Calculated Result', 'Calculated Result')}</th>
            <th style="${thStyle}">${t('Value', 'Value')}</th>
          </tr>
        </thead>
        <tbody>
          ${killRows.join('')}
        </tbody>
      </table>

      <div style="${sectionTitleStyle}; margin-top:5px;">${t('3. KICK DATA, KICK TOLERANCE & BARITE REQUIREMENTS', '3. KICK DATA, KICK TOLERANCE & BARITE REQUIREMENTS')}</div>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}">${t('Kick Evaluation', 'Kick Evaluation')}</th>
            <th style="${thStyle}">${t('Value', 'Value')}</th>
            <th style="${thStyle}">${t('Barite Mixing Preparation', 'Barite Mixing Preparation')}</th>
            <th style="${thStyle}">${t('Value', 'Value')}</th>
          </tr>
        </thead>
        <tbody>
          ${prepRows.join('')}
        </tbody>
      </table>

      ${chartHtml}

      ${buildFooter(1, 2)}
    `;

    // Step-Down Schedule Rows (Page 2)
    let schedRowsHtml = '';
    if (reportData.schedule && reportData.schedule.length > 0) {
      schedRowsHtml = reportData.schedule.slice(0, 22).map(r => {
        const stk = r.stroke !== undefined ? r.stroke : (r.strokes || 0);
        const stkStr = r.circulation ? `${t('Circ', 'Circ')} ${r.circulation}: <span class="val-bidi">${stk.toLocaleString()}</span>` : `<span class="val-bidi">${stk.toLocaleString()}</span>`;
        const timeStr = r.timeFormatted || (r.elapsedTimeMin !== undefined ? `<span class="val-bidi">${r.elapsedTimeMin.toFixed(1)} ${uMin}</span>` : '-');
        const dp = Math.round(r.dpPressure !== undefined ? r.dpPressure : (r.drillPipePressure || 0));
        const cp = Math.round(r.chokePressure || 0);
        const status = r.shoePressureExceeded ? t('EXCEEDS MAASP', 'EXCEEDS MAASP') : (r.note ? t(r.note, r.note) : t('OK', 'OK'));
        const statusStyle = r.shoePressureExceeded ? 'color:#DC2626; font-weight:700;' : 'color:#16A34A; font-weight:600;';
        return `
          <tr>
            <td style="padding:2.5px 5px; border:1px solid #E2E8F0; text-align:center; font-weight:600;">${stkStr}</td>
            <td style="padding:2.5px 5px; border:1px solid #E2E8F0; text-align:center;">${timeStr}</td>
            <td style="padding:2.5px 5px; border:1px solid #E2E8F0; text-align:right; font-weight:700; color:#0F172A;"><span class="val-bidi">${dp} ${uPsi}</span></td>
            <td style="padding:2.5px 5px; border:1px solid #E2E8F0; text-align:right;"><span class="val-bidi">${cp} ${uPsi}</span></td>
            <td style="padding:2.5px 5px; border:1px solid #E2E8F0; text-align:center; ${statusStyle}">${status}</td>
            <td style="padding:2.5px 5px; border:1px solid #CBD5E1; text-align:center;"></td>
            <td style="padding:2.5px 5px; border:1px solid #CBD5E1; text-align:center;"></td>
            <td style="padding:2.5px 5px; border:1px solid #CBD5E1; text-align:center;"></td>
          </tr>
        `;
      }).join('');
    }

    // Signatures HTML Block
    const sigRoles = [
      t('Toolpusher', 'Toolpusher'),
      t('Driller', 'Driller'),
      t('Mud Engineer', 'Mud Engineer'),
      t('Company Representative', 'Company Representative')
    ];
    const sigBoxesHtml = sigRoles.map(role => `
      <div style="flex:1; text-align:center; padding:4px 8px; border:1px solid #E2E8F0; border-radius:4px; background:#FAFAFA;">
        <div style="border-bottom:1px solid #94A3B8; height:28px; margin-bottom:4px;"></div>
        <div style="font-size:8.5px; font-weight:700; color:#1E293B;">${role}</div>
        <div style="font-size:7px; color:#64748B;">${t('Signature', 'Signature')} / ${t('Date', 'Date')}</div>
      </div>
    `).join('');

    // PAGE 2 HTML
    const page2Html = `
      ${buildBanner(2, 2)}

      <div style="${sectionTitleStyle}">${t('5. PRESSURE STEP-DOWN SCHEDULE', '5. PRESSURE STEP-DOWN SCHEDULE')}</div>
      <table style="${tableStyle}; font-size:8.5px;">
        <thead>
          <tr>
            <th style="${thStyle}; text-align:center;">${t('Strokes', 'Strokes')}</th>
            <th style="${thStyle}; text-align:center;">${t('Time', 'Time')}</th>
            <th style="${thStyle}; text-align:right;">${t('DP Press', 'DP Press')}</th>
            <th style="${thStyle}; text-align:right;">${t('Choke Press', 'Choke Press')}</th>
            <th style="${thStyle}; text-align:center;">${t('Status', 'Status')}</th>
            <th style="${thStyle}; text-align:center;">${t('Actual DP', 'Actual DP')}</th>
            <th style="${thStyle}; text-align:center;">${t('Actual Choke', 'Actual Choke')}</th>
            <th style="${thStyle}; text-align:center;">${t('Pit Level', 'Pit Level')}</th>
          </tr>
        </thead>
        <tbody>
          ${schedRowsHtml}
        </tbody>
      </table>

      <div style="${sectionTitleStyle}; margin-top:12px;">${t('FIELD VERIFICATION & APPROVAL SIGNATURES', 'FIELD VERIFICATION & APPROVAL SIGNATURES')}</div>
      <div style="display:flex; justify-content:space-between; gap:10px; margin-top:6px;">
        ${sigBoxesHtml}
      </div>

      ${buildFooter(2, 2)}
    `;

    return await renderHtmlPagesToPdf([page1Html, page2Html], {
      fileName: 'Well_Control_Kill_Sheet.pdf',
      orientation: 'portrait',
      scale: 3
    });
  }

  return {
    generateWellControlReport,
    renderHtmlPagesToPdf
  };
}));
