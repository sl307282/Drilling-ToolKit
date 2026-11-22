/**
 * Surface Wellhead Cementing Planner Controller & UI (Land Rig & Jack-up Rig)
 * Drilling Toolkit Web Runtime
 * Fully aligned with Subsea Wellhead architecture, components, and layout contracts.
 */
(function (root) {
  'use strict';

  const M_PER_FT = 0.3048;
  const SAVED_JOBS_KEY = 'drilling_toolkit_surface_cementing_jobs';
  const WELLDATA_DRAFT_PREFIX = 'surface_cementing_welldata_draft_';
  const CAPACITY_REF_PREFIX = 'surface_capacityRef_';
  const UNIT_STORAGE_KEY = 'drilling_toolkit_cementing_unit';
  const CAP_UNIT_STORAGE_KEY = 'drilling_toolkit_cementing_cap_unit';

  const DEPTH_KEYS = ['seabed', 'prev_shoe', 'td', 'shoe', 'shoe_track_len', 'planned_toc'];

  // Default section presets (stored in canonical metres)
  const SURFACE_SECTION_PRESETS = {
    'conductor': {
      section: 'conductor',
      name: '30" Conductor',
      label: '30" Conductor',
      subtitle: '36" Hole · 30" Casing · Conductor Inner String',
      model: 'conductor',
      rig_type: 'jack-up',
      seabed: 130,
      td: 205,
      shoe: 200,
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
      tubulars: {
        csg_id: 'csg_30_310',
        dp_id: 'dp_5.875_23.4',
        hole_id: 'oh_36'
      }
    },
    'surface': {
      section: 'surface',
      name: '20" Surface Casing',
      label: '20" Surface Casing',
      subtitle: '26" Hole · 20" Casing · Surface Casing Model',
      model: 'surface_casing',
      prev_shoe: 200,
      td: 555,
      shoe: 550,
      shoe_track_len: 24,
      planned_toc: 0,
      mw: 9.0,
      disp_mw: 9.0,
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
      tubulars: {
        csg_id: 'csg_20_133',
        prev_csg_id: 'csg_30_310',
        hole_id: 'oh_26'
      }
    },
    'intermediate': {
      section: 'intermediate',
      name: '13-3/8" Intermediate Casing',
      label: '13-3/8" Intermediate Casing',
      subtitle: '17½" Hole · 13-3/8" Casing · Intermediate Casing',
      model: 'surface_casing',
      prev_shoe: 550,
      td: 1525,
      shoe: 1520,
      shoe_track_len: 24,
      planned_toc: 400,
      mw: 10.0,
      disp_mw: 10.0,
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
      tubulars: {
        csg_id: 'csg_13.375_72',
        prev_csg_id: 'csg_20_133',
        hole_id: 'oh_17.5'
      }
    },
    'production': {
      section: 'production',
      name: '9-5/8" Production Casing',
      label: '9-5/8" Production Casing',
      subtitle: '12¼" Hole · 9-5/8" Casing · Production Casing',
      model: 'surface_casing',
      prev_shoe: 1520,
      td: 3055,
      shoe: 3050,
      shoe_track_len: 24,
      planned_toc: 1400,
      mw: 11.5,
      disp_mw: 11.5,
      f1_vol: 0,
      f1_mw: 10.2,
      f2_vol: 0,
      f2_mw: 6.9,
      sp_vol: 60,
      sp_mw: 12.3,
      lead_vol: 320,
      lead_mw: 13.5,
      tail_vol: 79,
      tail_mw: 15.8,
      excess_pct: 25,
      pump_output: 0.102,
      lot: 15.0,
      collapse_rating: 4760,
      burst_rating: 6870,
      bump: 1000,
      tubulars: {
        csg_id: 'csg_9.625_47',
        prev_csg_id: 'csg_13.375_72',
        hole_id: 'oh_12.25'
      }
    },
    'custom': {
      section: 'custom',
      name: 'Custom Surface Section',
      label: 'Custom Section',
      subtitle: 'User-defined casing, hole & model',
      model: 'surface_casing',
      custom_model: 'surface_casing',
      prev_shoe: 550,
      td: 1525,
      shoe: 1500,
      shoe_track_len: 24,
      planned_toc: 365,
      mw: 10.0,
      disp_mw: 10.0,
      hole_fluid_mw: 10.0,
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
      lot: 13.0,
      collapse_rating: 2500,
      burst_rating: 5000,
      bump: 1000,
      custom_csg_od: 13.375,
      custom_prev_csg_od: 20.0,
      tubulars: {
        csg_id: 'csg_13.375_72',
        prev_csg_id: 'csg_20_133',
        dp_id: 'dp_5.875_23.4',
        hole_id: 'oh_17.5'
      }
    }
  };

  SURFACE_SECTION_PRESETS['30'] = SURFACE_SECTION_PRESETS['conductor'];
  SURFACE_SECTION_PRESETS['20'] = SURFACE_SECTION_PRESETS['surface'];
  SURFACE_SECTION_PRESETS['13.375'] = SURFACE_SECTION_PRESETS['intermediate'];
  SURFACE_SECTION_PRESETS['9.625'] = SURFACE_SECTION_PRESETS['production'];

  const SECTION_SUBTITLES = {
    'conductor': '30" Conductor Casing',
    '30': '30" Conductor Casing',
    'surface': '20" Surface Casing',
    '20': '20" Surface Casing',
    'intermediate': '13-3/8" Intermediate Casing',
    '13.375': '13-3/8" Intermediate Casing',
    'production': '9-5/8" Production Casing',
    '9.625': '9-5/8" Production Casing',
    'custom': 'Custom Section'
  };

  // Persistence Helpers
  function getSavedJobsList() {
    try {
      const data = localStorage.getItem(SAVED_JOBS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  function saveJobsList(list) {
    try {
      const json = JSON.stringify(list);
      localStorage.setItem(SAVED_JOBS_KEY, json);
      if (typeof surfaceCementingState !== 'undefined' && surfaceCementingState) {
        surfaceCementingState.savedJobs = list;
      }
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: SAVED_JOBS_KEY, value: json }).catch(function () {});
      }
    } catch (_) {}
  }

  // State Management
  const surfaceCementingState = {
    view: 'chooser', // 'chooser' | 'capacities' | 'welldata' | 'results'
    section: 'conductor',
    unit: 'm',
    capUnit: 'BBL/M',
    inputs: {},
    overrides: {},
    results: null,
    jobName: '',
    activeReference: null,
    referenceIsDirty: false,
    wellDataSubmitted: false,
    collapsedSections: {
      depths: false,
      fluids: false,
      limits: false
    },
    collapsed: {
      placement: false,
      displacement: false,
      pressures: false,
      checks: false,
      schematic: false
    },
    savedJobs: getSavedJobsList()
  };

  const surfaceCementingStore = surfaceCementingState;
  root.surfaceCementingStore = surfaceCementingStore;
  root.surfaceCementingState = surfaceCementingState;

  function loadPersistedUnit() {
    try {
      const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
        ? window.UnitsEngine.getUnitSystem()
        : 'mixed';

      if (sys === 'api') {
        surfaceCementingState.unit = 'ft';
        surfaceCementingState.capUnit = 'BBL/FT';
        return;
      }
      if (sys === 'si') {
        surfaceCementingState.unit = 'm';
        surfaceCementingState.capUnit = 'L/M';
        return;
      }

      const u = localStorage.getItem(UNIT_STORAGE_KEY);
      if (u === 'm' || u === 'ft') {
        surfaceCementingState.unit = u;
      } else {
        surfaceCementingState.unit = 'm';
      }
      const cu = localStorage.getItem(CAP_UNIT_STORAGE_KEY);
      if (cu) {
        surfaceCementingState.capUnit = cu;
      } else {
        surfaceCementingState.capUnit = (surfaceCementingState.unit === 'ft') ? 'BBL/FT' : 'BBL/M';
      }
    } catch (_) {
      surfaceCementingState.unit = 'm';
      surfaceCementingState.capUnit = 'BBL/M';
    }
  }

  function savePersistedUnit() {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, surfaceCementingState.unit);
      localStorage.setItem(CAP_UNIT_STORAGE_KEY, surfaceCementingState.capUnit);
    } catch (_) {}
  }

  function toggleSurfaceUnit(newUnit) {
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';

    if (sys !== 'mixed') {
      if (typeof showToast === 'function') {
        const sysLabel = sys === 'api' ? t('Oilfield Units (API)') : t('Metric Units (SI)');
        showToast(t('Unit System') + ': ' + sysLabel);
      }
      return;
    }

    if (newUnit === surfaceCementingState.unit) return;
    surfaceCementingState.unit = newUnit;
    surfaceCementingState.capUnit = newUnit === 'm' ? 'BBL/M' : 'BBL/FT';
    savePersistedUnit();

    if (surfaceCementingState.view === 'capacities') {
      const isM = newUnit === 'm';
      const btnM = document.getElementById('surface-top-unit-m');
      const btnFt = document.getElementById('surface-top-unit-ft');
      const pill = document.getElementById('surface-unit-pill-desc');
      const unitSelect = document.getElementById('surface-cap-unit-select');
      if (btnM && btnFt) {
        btnM.classList.toggle('active', isM);
        btnFt.classList.toggle('active', !isM);
      }
      if (pill) {
        pill.textContent = isM ? t('Metric (m, bbl/m)') : t('Imperial (ft, bbl/ft)');
        pill.className = `cement-unit-mode-pill ${isM ? 'mode-metric' : 'mode-imperial'}`;
      }
      if (unitSelect) {
        unitSelect.value = surfaceCementingState.capUnit;
      }
      document.querySelectorAll('#cementing-surface-container input.cement-cap-input').forEach(inpEl => {
        const canonical = parseFloat(inpEl.getAttribute('data-canonical')) || 0;
        inpEl.value = window.CementingCommon.formatCapValue(canonical, surfaceCementingState.capUnit);
      });
    } else {
      renderSurfaceCementingScreen();
    }

    if (typeof showToast === 'function') {
      showToast(t('Units switched to {0}', newUnit.toUpperCase()));
    }
  }

  function getDraftInputs(section) {
    try {
      const raw = localStorage.getItem(WELLDATA_DRAFT_PREFIX + section);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveDraftInputs(section, inputs) {
    try {
      localStorage.setItem(WELLDATA_DRAFT_PREFIX + section, JSON.stringify(inputs));
    } catch (_) {}
  }

  function getSavedCapacityRef(id) {
    try {
      const raw = localStorage.getItem(CAPACITY_REF_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function persistCapacityRef(id, refData) {
    try {
      localStorage.setItem(CAPACITY_REF_PREFIX + id, JSON.stringify(refData));
    } catch (_) {}
  }

  function clearSavedCapacityRef(id) {
    try {
      localStorage.removeItem(CAPACITY_REF_PREFIX + id);
    } catch (_) {}
  }

  // Translation & formatting helpers
  function t(key, ...args) {
    let str = (window.CementingCommon && window.CementingCommon.t) ? window.CementingCommon.t(key) : ((window.I18n && typeof window.I18n.translate === 'function') ? window.I18n.translate(key) : key);
    if (args.length > 0 && typeof str === 'string') {
      args.forEach((val, i) => {
        str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), val);
      });
    }
    return str;
  }
  function escapeHtml(str) {
    return (window.CementingCommon && window.CementingCommon.escapeHtml) ? window.CementingCommon.escapeHtml(str) : String(str || '');
  }
  function escapeAttr(str) {
    return (window.CementingCommon && window.CementingCommon.escapeAttr) ? window.CementingCommon.escapeAttr(str) : String(str || '');
  }
  function formatMetricDepth(ftVal, isMetric) {
    const v = Number(ftVal) || 0;
    return isMetric ? (v * M_PER_FT).toFixed(1) : v.toFixed(0);
  }
  function formatMetricDist(ftVal, isMetric) {
    const v = Number(ftVal) || 0;
    return isMetric ? (v * M_PER_FT).toFixed(1) : v.toFixed(1);
  }
  function formatDepthDisplay(canonicalMeters) {
    if (canonicalMeters === undefined || canonicalMeters === null || canonicalMeters === '' || isNaN(Number(canonicalMeters))) return '';
    const v = Number(canonicalMeters);
    if (surfaceCementingState.unit === 'ft') {
      return (v / M_PER_FT).toFixed(0);
    }
    return Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);
  }

  // Capacity Computation for Surface Wellhead
  function computeSurfaceCapacities(inp, overrides = {}) {
    const tubulars = inp.tubulars || {};
    const capData = (window.CementingCommon && window.CementingCommon.CAPACITY_DATA) || [];

    const csg = capData.find(tub => tub.id === tubulars.csg_id) || null;
    const dp = capData.find(tub => tub.id === tubulars.dp_id) || null;
    const prevCsg = capData.find(tub => tub.id === tubulars.prev_csg_id) || null;
    const hole = capData.find(tub => tub.id === tubulars.hole_id) || null;

    const table_cap_csg = csg ? csg.cap_bbl_ft : (Number(inp.cap_csg) || 0);
    const csg_disp = csg ? csg.disp_bbl_ft : (Number(inp.csg_disp) || 0);
    const csg_closed_disp = table_cap_csg + csg_disp;

    const table_cap_dp = dp ? dp.cap_bbl_ft : (Number(inp.cap_dp) || 0);
    const table_cap_prev_csg = prevCsg ? prevCsg.cap_bbl_ft : (Number(inp.cap_prev_csg) || 0);
    const table_cap_oh = hole ? hole.cap_bbl_ft : (Number(inp.cap_oh) || 0);

    const table_cap_ann_oh = Math.max(0, table_cap_oh - csg_closed_disp);
    const table_cap_ann_c = prevCsg ? Math.max(0, table_cap_prev_csg - csg_closed_disp) : 0;

    const tableVals = {
      cap_csg: table_cap_csg,
      csg_disp,
      cap_dp: table_cap_dp,
      cap_prev_csg: table_cap_prev_csg,
      cap_oh: table_cap_oh,
      cap_ann_oh: table_cap_ann_oh,
      cap_ann_c: table_cap_ann_c
    };

    const jobId = inp.id || surfaceCementingState.section || 'conductor';
    const savedRef = getSavedCapacityRef(jobId);
    const refCanonical = (savedRef && savedRef.canonical) ? savedRef.canonical : null;

    const effective = {
      cap_csg: overrides.cap_csg !== undefined ? Number(overrides.cap_csg) : (refCanonical?.cap_csg !== undefined ? refCanonical.cap_csg : table_cap_csg),
      csg_disp: refCanonical?.csg_disp !== undefined ? refCanonical.csg_disp : csg_disp,
      cap_dp: overrides.cap_dp !== undefined ? Number(overrides.cap_dp) : (refCanonical?.cap_dp !== undefined ? refCanonical.cap_dp : table_cap_dp),
      cap_prev_csg: table_cap_prev_csg,
      cap_oh: overrides.cap_oh !== undefined ? Number(overrides.cap_oh) : (refCanonical?.cap_oh !== undefined ? refCanonical.cap_oh : table_cap_oh),
      cap_ann_oh: overrides.cap_ann_oh !== undefined ? Number(overrides.cap_ann_oh) : (refCanonical?.cap_ann_oh !== undefined ? refCanonical.cap_ann_oh : table_cap_ann_oh),
      cap_ann_c: overrides.cap_ann_c !== undefined ? Number(overrides.cap_ann_c) : (refCanonical?.cap_ann_c !== undefined ? refCanonical.cap_ann_c : table_cap_ann_c)
    };

    const labels = {
      csg_label: csg ? `${csg.label} Casing` : (inp.csg_label || 'Casing'),
      prev_csg_label: prevCsg ? `${prevCsg.label} Casing` : (inp.prev_csg_label || 'Previous Casing'),
      oh_label: hole ? hole.label : (inp.oh_label || 'Open Hole'),
      dp_label: dp ? `${dp.label} Drill Pipe` : (inp.dp_label || 'Drill Pipe')
    };

    return { tableVals, effective, labels, csg, dp, prevCsg, hole, savedRef, csg_closed_disp };
  }

  // Master Render Entry Function (Single CollapsingPage Header Pattern)
  function renderSurfaceCementingScreen() {
    loadPersistedUnit();
    const wrapper = document.getElementById('screen-cement-planner-surface');
    if (!wrapper) return;

    const fixedHeaderWrapper = document.getElementById('cementing-surface-fixed-header-wrapper');
    const headerSlot = document.getElementById('cementing-surface-job-header-slot');
    const container = document.getElementById('cementing-surface-container');
    const titleEl = document.getElementById('cementing-surface-screen-title');
    const compactTitleEl = document.getElementById('cementing-surface-screen-title-compact');
    const subtitleEl = document.getElementById('cementing-surface-screen-subtitle');
    const headerBadge = document.getElementById('cementing-surface-header-badge');
    const appContainer = document.querySelector('.app-container');

    if (!container) return;

    // Fixed header wrapper is kept hidden to enforce the single CollapsingPage header flow
    if (fixedHeaderWrapper) fixedHeaderWrapper.style.display = 'none';
    if (headerSlot) headerSlot.innerHTML = '';

    // Scroll to top
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || (appContainer ? appContainer.scrollTop : 0) || 0;
    if (currentScrollY > 0) {
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (appContainer) appContainer.scrollTop = 0;
    }

    if (surfaceCementingState.view === 'chooser') {
      wrapper.classList.remove('job-active');
      if (appContainer) {
        appContainer.classList.add('cementing-active');
        appContainer.classList.remove('cementing-job-active');
      }
      container.style.paddingTop = '0px';

      if (titleEl) titleEl.textContent = t('Surface Wellhead');
      if (compactTitleEl) compactTitleEl.textContent = t('Surface Wellhead');
      if (headerBadge) headerBadge.style.display = 'none';
      if (subtitleEl) {
        subtitleEl.textContent = t('Land Rig & Jack-up Rig · Casing strings to surface');
        subtitleEl.style.display = '';
      }

      renderSurfaceChooser(container);
    } else {
      wrapper.classList.add('job-active');
      if (appContainer) {
        appContainer.classList.add('cementing-active', 'cementing-job-active');
      }

      const preset = SURFACE_SECTION_PRESETS[surfaceCementingState.section] || SURFACE_SECTION_PRESETS['custom'];

      if (titleEl) titleEl.textContent = t('Surface Wellhead');
      if (compactTitleEl) compactTitleEl.textContent = t('Surface Wellhead');

      const isConductor = surfaceCementingState.inputs.model === 'conductor';
      const isCustom = surfaceCementingState.section === 'custom';
      const badgeText = isCustom ? 'CUSTOM' : (isConductor ? 'CONDUCTOR' : 'SURFACE');
      const badgeClass = isConductor ? 'cement-badge-riserless' : 'cement-badge-subsea';
      const secSubtitle = SECTION_SUBTITLES[surfaceCementingState.section] || preset.label || preset.name || 'Custom Section';

      if (subtitleEl) {
        subtitleEl.innerHTML = `<span class="cement-subtitle-text">${t(secSubtitle)}</span> <span class="cement-badge-model ${badgeClass}">${t(badgeText)}</span>`;
        subtitleEl.style.display = 'inline-flex';
        subtitleEl.style.alignItems = 'center';
        subtitleEl.style.gap = '8px';
      }

      // Hide headerBadge in top bar to keep only one clean row beneath Surface Wellhead showing section title and badge
      if (headerBadge) {
        headerBadge.style.display = 'none';
      }

      // Route through Wizard steps
      switch (surfaceCementingState.view) {
        case 'capacities':
          renderSurfaceCapacities(container);
          break;
        case 'welldata':
          renderSurfaceWellData(container);
          break;
        case 'results':
          renderSurfaceResults(container);
          break;
        default:
          renderSurfaceCapacities(container);
          break;
      }
    }
  }
  root.renderSurfaceCementingScreen = renderSurfaceCementingScreen;

  // View 1: Section Chooser Screen
  function renderSurfaceChooser(container) {
    if (!container) return;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'cement-view-animate';

    const sections = [
      {
        id: 'conductor',
        title: '30" Conductor',
        sub: '36" Hole · 30" Casing · Conductor Inner String',
        badge: 'CONDUCTOR',
        badgeClass: 'cement-badge-riserless',
        icon: '30"'
      },
      {
        id: 'surface',
        title: '20" Surface Casing',
        sub: '26" Hole · 20" Casing · Surface Casing Model',
        badge: 'SURFACE',
        badgeClass: 'cement-badge-subsea',
        icon: '20"'
      },
      {
        id: 'intermediate',
        title: '13-3/8" Intermediate Casing',
        sub: '17½" Hole · 13-3/8" Casing · Intermediate Casing',
        badge: 'SURFACE',
        badgeClass: 'cement-badge-subsea',
        icon: '13⅜"'
      },
      {
        id: 'production',
        title: '9-5/8" Production Casing',
        sub: '12¼" Hole · 9-5/8" Casing · Production Casing',
        badge: 'SURFACE',
        badgeClass: 'cement-badge-subsea',
        icon: '9⅝"'
      },
      {
        id: 'custom',
        title: 'Custom Section',
        sub: 'User-defined casing, hole & model',
        badge: 'CUSTOM',
        badgeClass: 'cement-badge-subsea',
        icon: 'O'
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
    const savedJobs = getSavedJobsList();
    let savedHtml = `
      <div class="content-card" style="margin-top:24px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:0.92rem; font-weight:700; color:var(--text-primary); margin:0;">${t('Saved Cementing Jobs')}</h3>
          <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${savedJobs.length} ${t('saved')}</span>
        </div>
    `;

    if (savedJobs.length === 0) {
      savedHtml += `
        <p style="font-size:0.75rem; color:var(--text-secondary); margin:0; line-height:1.4;">
          ${t('No saved jobs yet. Configure any section and click "Save Job" to keep your well parameters for later.')}
        </p>
      `;
    } else {
      savedHtml += `<div style="display:flex; flex-direction:column; gap:8px;">`;
      savedJobs.forEach((job, idx) => {
        const jobId = job.id || idx;
        const jobTitle = escapeAttr(job.name || job.jobName || 'Saved Job');
        const jobDate = escapeAttr(job.calendarDate || job.date || new Date(job.updatedAt || Date.now()).toLocaleDateString());
        const sectionPreset = SURFACE_SECTION_PRESETS[job.section] || SURFACE_SECTION_PRESETS['custom'];
        const sectionTitle = escapeAttr(job.casingType || SECTION_SUBTITLES[job.section] || sectionPreset?.label || job.section);
        const modelBadge = escapeAttr((job.model === 'conductor' ? 'CONDUCTOR' : (job.section === 'custom' ? 'CUSTOM' : 'SURFACE')));

        savedHtml += `
          <div class="cement-saved-job-card" data-load-id="${jobId}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-subtle); border-radius:12px; border:1px solid var(--border-subtle); cursor:pointer;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${jobTitle}</div>
              <div style="font-size:0.7rem; color:var(--text-secondary);">${jobDate} · ${sectionTitle} (${modelBadge})</div>
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

    // Section card click handler
    wrapper.querySelectorAll('.cement-section-card').forEach(card => {
      card.onclick = () => {
        const secId = card.getAttribute('data-section');
        card.classList.add('active');
        requestAnimationFrame(() => {
          setTimeout(() => {
            selectSection(secId);
          }, 35);
        });
      };
    });

    // Saved job click & load handlers
    wrapper.querySelectorAll('[data-load-id]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-load-id');
        el.classList.add('active');
        requestAnimationFrame(() => {
          setTimeout(() => {
            loadSavedJob(id);
          }, 35);
        });
      };
    });

    wrapper.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-id');
        deleteSavedJob(id);
      };
    });
  }

  function selectSection(secKey) {
    surfaceCementingState.section = secKey;
    const preset = SURFACE_SECTION_PRESETS[secKey] || SURFACE_SECTION_PRESETS['custom'];

    // Check for draft inputs
    const draft = getDraftInputs(secKey);
    surfaceCementingState.inputs = draft ? { ...preset, ...draft } : JSON.parse(JSON.stringify(preset));
    if (!surfaceCementingState.inputs.tubulars) {
      surfaceCementingState.inputs.tubulars = Object.assign({}, preset.tubulars);
    }
    surfaceCementingState.overrides = {};
    surfaceCementingState.results = null;
    surfaceCementingState.jobName = preset.name;
    surfaceCementingState.wellDataSubmitted = false;
    surfaceCementingState.collapsedSections = { depths: false, fluids: false, limits: false };

    const savedRef = getSavedCapacityRef(secKey);
    if (savedRef) {
      surfaceCementingState.activeReference = savedRef;
      if (savedRef.tubulars) {
        surfaceCementingState.inputs.tubulars = Object.assign({}, savedRef.tubulars);
      }
      if (savedRef.unit) {
        surfaceCementingState.capUnit = savedRef.unit;
      }
      if (savedRef.unitSystem) {
        surfaceCementingState.unit = savedRef.unitSystem;
      }
      if (savedRef.overrides) {
        surfaceCementingState.overrides = Object.assign({}, savedRef.overrides);
      }
    } else {
      surfaceCementingState.activeReference = null;
    }
    surfaceCementingState.referenceIsDirty = true;

    surfaceCementingState.view = 'capacities';
    renderSurfaceCementingScreen();
  }
  root.selectSurfaceSection = selectSection;

  function openSurfaceCementingModule(sectionKey) {
    if (sectionKey && SURFACE_SECTION_PRESETS[sectionKey]) {
      selectSection(sectionKey);
    } else {
      surfaceCementingState.view = 'chooser';
      renderSurfaceCementingScreen();
    }
  }
  root.openSurfaceCementingModule = openSurfaceCementingModule;

  function loadSavedJob(jobId) {
    const list = getSavedJobsList();
    const job = list.find((j, idx) => String(j.id || idx) === String(jobId));
    if (!job) return;

    surfaceCementingState.section = job.sectionId || job.section || 'conductor';
    surfaceCementingState.inputs = JSON.parse(JSON.stringify(job.inputs || job.wellData || {}));
    surfaceCementingState.overrides = Object.assign({}, job.overrides || {});
    surfaceCementingState.unit = job.unit || job.unitSystem || 'm';
    surfaceCementingState.jobName = job.name || job.jobName || '';
    surfaceCementingState.inputs.name = surfaceCementingState.jobName;

    if (job.reference) {
      surfaceCementingState.activeReference = JSON.parse(JSON.stringify(job.reference));
      surfaceCementingState.referenceIsDirty = false;
      if (job.reference.tubulars) {
        surfaceCementingState.inputs.tubulars = Object.assign({}, job.reference.tubulars);
      }
      if (job.reference.unit) {
        surfaceCementingState.capUnit = job.reference.unit;
      }
    } else {
      const savedRef = getSavedCapacityRef(surfaceCementingState.section);
      if (savedRef) {
        surfaceCementingState.activeReference = savedRef;
        surfaceCementingState.referenceIsDirty = false;
        if (savedRef.tubulars) surfaceCementingState.inputs.tubulars = Object.assign({}, savedRef.tubulars);
        if (savedRef.unit) surfaceCementingState.capUnit = savedRef.unit;
      }
    }

    // Direct calculation to show results
    executeSurfaceCalculation(true);
  }

  function deleteSavedJob(jobId) {
    let list = getSavedJobsList();
    list = list.filter((j, idx) => String(j.id || idx) !== String(jobId));
    saveJobsList(list);
    const container = document.getElementById('cementing-surface-container');
    if (container && surfaceCementingState.view === 'chooser') {
      renderSurfaceChooser(container);
    }
    if (typeof showToast === 'function') showToast(t('Saved job deleted'));
  }

  // View 2: API Capacities & Annuli Step
  function renderSurfaceCapacities(container) {
    if (!container) return;
    container.innerHTML = '';

    const inp = surfaceCementingState.inputs;
    const preset = SURFACE_SECTION_PRESETS[surfaceCementingState.section] || SURFACE_SECTION_PRESETS['custom'];
    if (!inp.tubulars) {
      inp.tubulars = Object.assign({}, preset.tubulars);
    }

    // Top-Level Unit Toggle Card directly above API Capacities & Annuli
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';
    const isM = (surfaceCementingState.unit || 'm') === 'm';

    let pillText = isM ? t('Metric (m, bbl/m)') : t('Imperial (ft, bbl/ft)');
    if (sys === 'si') {
      pillText = t('Metric (m, L/m)');
    } else if (sys === 'api') {
      pillText = t('Imperial (ft, bbl/ft)');
    } else if (surfaceCementingState.capUnit === 'L/M' || surfaceCementingState.capUnit === 'LTR/M') {
      pillText = t('Metric (m, L/m)');
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
        <span class="cement-unit-mode-pill ${isM ? 'mode-metric' : 'mode-imperial'}" id="surface-unit-pill-desc">
          ${pillText}
        </span>
      </div>
      <div class="cement-segmented-control" role="group" aria-label="Units" ${sys !== 'mixed' ? 'style="opacity:0.65; pointer-events:none;"' : ''}>
        <button type="button" class="cement-unit-btn ${isM ? 'active' : ''}" id="surface-top-unit-m" data-unit="m">M</button>
        <button type="button" class="cement-unit-btn ${!isM ? 'active' : ''}" id="surface-top-unit-ft" data-unit="ft">FT</button>
      </div>
    `;
    container.appendChild(unitCard);

    unitCard.querySelector('#surface-top-unit-m').onclick = () => toggleSurfaceUnit('m');
    unitCard.querySelector('#surface-top-unit-ft').onclick = () => toggleSurfaceUnit('ft');

    // API Capacities & Annuli Card
    const capCard = document.createElement('div');
    capCard.className = 'content-card cement-view-animate';
    capCard.style.padding = '14px 16px';
    capCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          ${t('API Capacities & Annuli')}
        </h3>
      </div>
      <div style="margin-bottom:12px; font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">
        ${t('All standard nominal values sourced from API Tubular Data. Values can be customized per job.')}
      </div>
      <div class="cement-cap-table-wrap">
        ${renderSurfaceCapacitiesTable(inp)}
      </div>
    `;
    container.appendChild(capCard);
    bindSurfaceCapacitiesActions(capCard);

    // Bottom Action Buttons: Side-by-Side [ Save as Reference ] & [ Use Reference ]
    const isSaved = Boolean(surfaceCementingState.activeReference && !surfaceCementingState.referenceIsDirty);
    const btnRow = document.createElement('div');
    btnRow.className = 'cement-btn-side-by-side cement-view-animate';
    btnRow.style.cssText = 'margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:10px;';
    btnRow.innerHTML = `
      <button type="button" class="btn ${isSaved ? 'btn-secondary' : 'btn-primary'}" id="btn-surface-save-ref" style="width:100%; margin:0; padding:11px 6px; font-size:0.82rem; font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">
        ${t('Save as Reference')}
      </button>
      <button type="button" class="btn ${isSaved ? 'btn-primary' : 'btn-secondary'}" id="btn-surface-use-ref" style="width:100%; margin:0; padding:11px 6px; font-size:0.82rem; font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; ${isSaved ? '' : 'opacity:0.45; pointer-events:none;'}" ${isSaved ? '' : 'disabled'}>
        ${t('Use Reference')}
      </button>
    `;
    container.appendChild(btnRow);

    const saveBtn = btnRow.querySelector('#btn-surface-save-ref');
    const useBtn = btnRow.querySelector('#btn-surface-use-ref');

    saveBtn.onclick = () => {
      saveActiveSurfaceReferenceFromUI(capCard, saveBtn, useBtn);
    };

    useBtn.onclick = () => {
      if (useBtn.disabled || !surfaceCementingState.activeReference || surfaceCementingState.referenceIsDirty) return;
      surfaceCementingState.view = 'welldata';
      renderSurfaceCementingScreen();
    };
  }

  function renderSurfaceCapacitiesTable(inp) {
    const computed = computeSurfaceCapacities(inp, surfaceCementingState.overrides);
    const tubulars = inp.tubulars || {};
    const sectionKey = surfaceCementingState.section || 'conductor';
    const isConductor = inp.model === 'conductor';
    const isCustom = sectionKey === 'custom';
    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';
    let activeCapUnit = surfaceCementingState.capUnit || (surfaceCementingState.unit === 'm' ? 'BBL/M' : 'BBL/FT');
    if (sys === 'api') activeCapUnit = 'BBL/FT';
    else if (sys === 'si') activeCapUnit = 'L/M';

    let targetCsgOd = 30.0;
    if (sectionKey === 'surface') targetCsgOd = 20.0;
    else if (sectionKey === 'intermediate') targetCsgOd = 13.375;
    else if (sectionKey === 'production') targetCsgOd = 9.625;
    else if (isCustom) targetCsgOd = Number(inp.custom_csg_od) || 13.375;

    let targetPrevCsgOd = null;
    if (sectionKey === 'surface') targetPrevCsgOd = 30.0;
    else if (sectionKey === 'intermediate') targetPrevCsgOd = 20.0;
    else if (sectionKey === 'production') targetPrevCsgOd = 13.375;
    else if (isCustom && !isConductor) targetPrevCsgOd = Number(inp.custom_prev_csg_od) || 20.0;

    let rows = [];

    // Row 1: Casing Capacity
    const csgOptions = window.CementingCommon.getCasingOptions(targetCsgOd);
    let selectedCsg = csgOptions.find(o => o.id === tubulars.csg_id) || csgOptions[0];
    if (selectedCsg) tubulars.csg_id = selectedCsg.id;
    const csgOdLabel = selectedCsg ? (selectedCsg.label.replace(/\s*[0-9.]+#[^"]*/, '').trim() || `${targetCsgOd}"`) : `${targetCsgOd}"`;

    const csgRow = {
      key: 'cap_csg',
      componentTitle: isConductor ? 'Conductor Casing' : `${csgOdLabel} Casing`,
      componentSub: 'Casing Capacity',
      sourceField: 'csg_id',
      currentSourceVal: selectedCsg?.id,
      sourceLabel: selectedCsg?.label,
      options: csgOptions,
      canonicalVal: computed.effective.cap_csg,
      isReadOnlySource: false
    };

    if (isCustom) {
      csgRow.customOdSelect = {
        options: window.CementingCommon.CASING_OD_LIST,
        selectedOd: targetCsgOd
      };
    }
    rows.push(csgRow);

    // Row 2: Conductor -> Inner String (Drill Pipe); Surface-casing -> Cased Annulus
    if (isConductor) {
      const dpOptions = window.CementingCommon.getDrillPipeOptions();
      let selectedDp = dpOptions.find(o => o.id === tubulars.dp_id) || dpOptions.find(o => o.id === 'dp_5.875_23.4') || dpOptions[0];
      if (selectedDp) tubulars.dp_id = selectedDp.id;

      rows.push({
        key: 'cap_dp',
        componentTitle: 'Inner String',
        componentSub: 'Inner String Capacity',
        sourceField: 'dp_id',
        currentSourceVal: selectedDp?.id,
        sourceLabel: selectedDp?.label,
        options: dpOptions,
        canonicalVal: computed.effective.cap_dp,
        isReadOnlySource: false
      });
    } else if (targetPrevCsgOd) {
      const prevCsgOptions = window.CementingCommon.getCasingOptions(targetPrevCsgOd);
      let selectedPrevCsg = prevCsgOptions.find(o => o.id === tubulars.prev_csg_id) || prevCsgOptions[0];
      if (selectedPrevCsg) tubulars.prev_csg_id = selectedPrevCsg.id;
      const prevCsgOdLabel = selectedPrevCsg ? (selectedPrevCsg.label.replace(/\s*[0-9.]+#[^"]*/, '').trim() || `${targetPrevCsgOd}"`) : `${targetPrevCsgOd}"`;

      const prevRow = {
        key: 'cap_ann_c',
        componentTitle: 'Cased Annulus',
        componentSub: `${prevCsgOdLabel} × ${csgOdLabel}`,
        sourceField: 'prev_csg_id',
        currentSourceVal: selectedPrevCsg?.id,
        sourceLabel: selectedPrevCsg?.label,
        options: prevCsgOptions,
        canonicalVal: computed.effective.cap_ann_c,
        isReadOnlySource: false
      };

      if (isCustom) {
        const availablePrevOds = window.CementingCommon.CASING_OD_LIST.filter(item => item.od > targetCsgOd);
        prevRow.customOdSelect = {
          options: availablePrevOds.length ? availablePrevOds : window.CementingCommon.CASING_OD_LIST,
          selectedOd: targetPrevCsgOd
        };
      }
      rows.push(prevRow);
    }

    // Row 3: Open Hole Annulus
    const holeOptions = window.CementingCommon.getHoleOptions(isCustom ? 'custom' : sectionKey);
    let selectedHole = holeOptions.find(o => o.id === tubulars.hole_id) || holeOptions[0];
    if (selectedHole) tubulars.hole_id = selectedHole.id;
    const holeLabelShort = selectedHole?.label.replace(' Open Hole', '').trim() || 'Hole';

    rows.push({
      key: 'cap_ann_oh',
      componentTitle: 'Open Hole Annulus',
      componentSub: `${holeLabelShort} × ${csgOdLabel}`,
      sourceField: 'hole_id',
      currentSourceVal: selectedHole?.id,
      sourceLabel: selectedHole?.label,
      options: holeOptions,
      canonicalVal: computed.effective.cap_ann_oh,
      isReadOnlySource: false
    });

    // Row 4: Open Hole Rathole (Read-only source)
    rows.push({
      key: 'cap_oh',
      componentTitle: 'Open Hole Rathole',
      componentSub: selectedHole?.label || 'Open Hole',
      sourceField: 'hole_id',
      currentSourceVal: selectedHole?.id,
      sourceLabel: selectedHole?.label,
      readOnlyText: selectedHole?.label || 'Open Hole',
      options: [],
      canonicalVal: computed.effective.cap_oh,
      isReadOnlySource: true
    });

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
                <select class="cement-cap-header-unit-select" id="surface-cap-unit-select" aria-label="Capacity Unit" ${sys !== 'mixed' ? 'disabled style="opacity:0.75; cursor:default;"' : ''}>
                  <option value="BBL/M" ${activeCapUnit === 'BBL/M' ? 'selected' : ''}>BBL/M</option>
                  <option value="BBL/FT" ${activeCapUnit === 'BBL/FT' ? 'selected' : ''}>BBL/FT</option>
                  <option value="L/M" ${(activeCapUnit === 'L/M' || activeCapUnit === 'LTR/M') ? 'selected' : ''}>L/M</option>
                </select>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
    `;

    rows.forEach(r => {
      const displayVal = window.CementingCommon.formatCapValue(r.canonicalVal, activeCapUnit);
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
    `;

    return html;
  }

  function bindSurfaceCapacitiesActions(cardEl) {
    const inp = surfaceCementingState.inputs;

    function markReferenceDirty() {
      surfaceCementingState.referenceIsDirty = true;
      const saveBtn = document.getElementById('btn-surface-save-ref');
      const useBtn = document.getElementById('btn-surface-use-ref');
      if (saveBtn) saveBtn.className = 'btn btn-primary';
      if (useBtn) {
        useBtn.className = 'btn btn-secondary';
        useBtn.disabled = true;
        useBtn.setAttribute('disabled', 'true');
        useBtn.style.opacity = '0.45';
        useBtn.style.pointerEvents = 'none';
      }
    }

    // Capacity Unit Dropdown Selector
    const unitSelect = cardEl.querySelector('#surface-cap-unit-select');
    if (unitSelect) {
      unitSelect.onchange = () => {
        const val = unitSelect.value;
        surfaceCementingState.capUnit = val;
        if (val === 'BBL/M') {
          surfaceCementingState.unit = 'm';
        } else if (val === 'BBL/FT') {
          surfaceCementingState.unit = 'ft';
        }
        savePersistedUnit();

        const isM = (surfaceCementingState.unit || 'm') === 'm';
        const btnM = document.getElementById('surface-top-unit-m');
        const btnFt = document.getElementById('surface-top-unit-ft');
        const pill = document.getElementById('surface-unit-pill-desc');
        if (btnM && btnFt) {
          btnM.classList.toggle('active', isM);
          btnFt.classList.toggle('active', !isM);
        }
        if (pill) {
          pill.textContent = isM ? t('Metric (m, bbl/m)') : t('Imperial (ft, bbl/ft)');
          pill.className = `cement-unit-mode-pill ${isM ? 'mode-metric' : 'mode-imperial'}`;
        }
        cardEl.querySelectorAll('input.cement-cap-input').forEach(inpEl => {
          const canonical = parseFloat(inpEl.getAttribute('data-canonical')) || 0;
          inpEl.value = window.CementingCommon.formatCapValue(canonical, val);
        });
      };
    }

    // Source dropdowns
    cardEl.querySelectorAll('select[data-cap-source]').forEach(select => {
      select.onchange = () => {
        const field = select.getAttribute('data-cap-source');
        const rowKey = select.getAttribute('data-row-key');
        if (!inp.tubulars) inp.tubulars = {};
        inp.tubulars[field] = select.value;
        if (rowKey && surfaceCementingState.overrides[rowKey] !== undefined) {
          delete surfaceCementingState.overrides[rowKey];
        }
        markReferenceDirty();
        renderSurfaceCapacities(document.getElementById('cementing-surface-container'));
      };
    });

    // Custom OD selectors
    cardEl.querySelectorAll('select.cement-custom-od-select').forEach(select => {
      select.onchange = () => {
        const targetField = select.getAttribute('data-custom-od-target');
        const od = parseFloat(select.value);
        if (targetField === 'csg_id') {
          inp.custom_csg_od = od;
          const opts = window.CementingCommon.getCasingOptions(od);
          if (opts.length) inp.tubulars.csg_id = opts[0].id;
        } else if (targetField === 'prev_csg_id') {
          inp.custom_prev_csg_od = od;
          const opts = window.CementingCommon.getCasingOptions(od);
          if (opts.length) inp.tubulars.prev_csg_id = opts[0].id;
        }
        markReferenceDirty();
        renderSurfaceCapacities(document.getElementById('cementing-surface-container'));
      };
    });

    // Capacity manual overrides
    cardEl.querySelectorAll('input.cement-cap-input').forEach(input => {
      input.oninput = () => {
        markReferenceDirty();
      };
      input.onchange = () => {
        const key = input.getAttribute('data-cap-key');
        const activeUnit = surfaceCementingState.capUnit || 'BBL/FT';
        const parsed = window.CementingCommon.parseCapValue(input.value, activeUnit);
        if (parsed > 0) {
          surfaceCementingState.overrides[key] = parsed;
          input.setAttribute('data-canonical', parsed);
        } else {
          delete surfaceCementingState.overrides[key];
          const comp = computeSurfaceCapacities(surfaceCementingState.inputs, surfaceCementingState.overrides);
          input.setAttribute('data-canonical', comp.effective[key] || 0);
        }
        markReferenceDirty();
      };
    });
  }

  function saveActiveSurfaceReferenceFromUI(cardEl, saveBtn, useBtn) {
    const inp = surfaceCementingState.inputs;
    const sectionKey = surfaceCementingState.section || 'conductor';
    const computed = computeSurfaceCapacities(inp, surfaceCementingState.overrides);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const activeUnit = surfaceCementingState.capUnit || 'BBL/FT';

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
      jobName: surfaceCementingState.jobName || '',
      savedAt: `${dateStr}, ${timeStr}`,
      timestamp: now.getTime(),
      unit: activeUnit,
      unitSystem: surfaceCementingState.unit,
      overrides: Object.assign({}, surfaceCementingState.overrides),
      tubulars: Object.assign({}, inp.tubulars),
      canonical: {
        cap_csg: computed.effective.cap_csg,
        csg_disp: computed.effective.csg_disp,
        cap_dp: computed.effective.cap_dp,
        cap_ann_oh: computed.effective.cap_ann_oh,
        cap_oh: computed.effective.cap_oh,
        cap_ann_c: computed.effective.cap_ann_c || 0
      },
      rows: rowsData
    };

    persistCapacityRef(sectionKey, refData);
    surfaceCementingState.activeReference = refData;
    surfaceCementingState.referenceIsDirty = false;

    if (typeof showToast === 'function') {
      showToast(t('Reference saved'));
    }
    if (saveBtn) saveBtn.className = 'btn btn-secondary';
    if (useBtn) {
      useBtn.className = 'btn btn-primary';
      useBtn.disabled = false;
      useBtn.removeAttribute('disabled');
      useBtn.style.opacity = '1';
      useBtn.style.pointerEvents = 'auto';
    }
  }

  // View 3: Well Data Form Step
  function renderSurfaceWellData(container) {
    if (!container) return;
    container.innerHTML = '';

    const inp = surfaceCementingState.inputs;
    const isConductor = inp.model === 'conductor';
    const isMetric = surfaceCementingState.unit === 'm';
    const depthUnit = isMetric ? 'm' : 'ft';

    const isSubmitted = Boolean(surfaceCementingState.wellDataSubmitted);
    const errors = isSubmitted ? getSurfaceWellDataErrors(inp) : {};

    const sys = (window.UnitsEngine && typeof window.UnitsEngine.getUnitSystem === 'function')
      ? window.UnitsEngine.getUnitSystem()
      : 'mixed';

    const volUnit = sys === 'si' ? 'm³' : 'bbl';
    const mwUnit = sys === 'si' ? 'SG' : 'ppg';
    const pressUnit = sys === 'si' ? 'bar' : 'psi';
    const pumpUnitLabel = sys === 'si' ? 'L/stk' : 'bbl/stk';

    const VOL_KEYS = ['f1_vol', 'f2_vol', 'sp_vol', 'lead_vol', 'tail_vol'];
    const MW_KEYS = ['seawater_mw', 'hole_fluid_mw', 'disp_mw', 'mw', 'f1_mw', 'f2_mw', 'sp_mw', 'lead_mw', 'tail_mw', 'lot'];
    const PRESS_KEYS = ['collapse_rating', 'burst_rating', 'bump', 'max_pump_pressure'];

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
        return v.toFixed(3);
      }
      return String(rawNativeVal);
    }

    function parseWellDataInputVal(k, rawVal) {
      if (rawVal === undefined || rawVal === null || rawVal === '') return '';
      const num = parseFloat(String(rawVal).replace(',', '.'));
      if (isNaN(num)) return '';

      if (DEPTH_KEYS.includes(k)) {
        return (surfaceCementingState.unit === 'ft') ? (num * M_PER_FT) : num;
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
        return (sys === 'si') ? (num / 158.9873) : num;
      }
      return num;
    }

    const depthFieldKeys = isConductor
      ? (inp.rig_type === 'jack-up'
          ? ['seabed', 'seawater_mw', 'shoe', 'shoe_track_len', 'td']
          : ['seabed', 'shoe', 'shoe_track_len', 'td'])
      : ['prev_shoe', 'planned_toc', 'shoe', 'shoe_track_len', 'td'];

    const fluidFieldKeys = isConductor
      ? ['hole_fluid_mw', 'disp_mw', 'f1_vol', 'f1_mw', 'f2_vol', 'f2_mw', 'sp_vol', 'sp_mw', 'lead_vol', 'lead_mw', 'tail_vol', 'tail_mw']
      : ['mw', 'disp_mw', 'f1_vol', 'f1_mw', 'f2_vol', 'f2_mw', 'sp_vol', 'sp_mw', 'lead_vol', 'lead_mw', 'tail_vol', 'tail_mw'];

    const limitFieldKeys = isConductor
      ? ['excess_pct', 'pump_output', 'collapse_rating', 'burst_rating', 'max_pump_pressure']
      : ['excess_pct', 'pump_output', 'lot', 'collapse_rating', 'burst_rating', 'bump'];

    const isFieldFilled = (k) => {
      const v = inp[k];
      return v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) && Number(v) > 0;
    };
    const countFilled = (keys) => keys.filter(isFieldFilled).length;

    const collapsed = surfaceCementingState.collapsedSections;

    // Calculate float collar depth
    const fc = Math.max(0, (Number(inp.shoe) || 0) - (Number(inp.shoe_track_len) || 0));

    // Well Data Card
    const inputsCard = document.createElement('div');
    inputsCard.className = 'content-card cement-view-animate';
    inputsCard.style.padding = '14px 16px';
    inputsCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          ${t('Well Data')}
        </h3>
        <button type="button" class="btn-copy-prev-job" id="btn-surface-copy-from-prev-job" title="${t('Copy inputs from a previous job')}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>${t('Copy from previous job')}</span>
        </button>
      </div>

      ${surfaceCementingState.section === 'custom' ? `
        <div style="margin-bottom:14px; display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg-subtle); border-radius:10px; border:1px solid var(--border-subtle);">
          <span style="font-size:0.75rem; font-weight:600; color:var(--text-secondary);">${t('Well Model')}:</span>
          <label style="font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="radio" name="custom-surface-model-radio" value="conductor" ${inp.model === 'conductor' ? 'checked' : ''}> ${t('Conductor (Stab-in)')}
          </label>
          <label style="font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="radio" name="custom-surface-model-radio" value="surface_casing" ${inp.model === 'surface_casing' ? 'checked' : ''}> ${t('Surface Casing')}
          </label>
        </div>
      ` : ''}

      <!-- Section 1: Depths & String Geometry -->
      <div class="section-collapse-header" data-section="depths">
        <div class="section-title-wrap">
          <span class="section-title" style="margin:0 !important;">${t('Well Elevations & Depths')} (${depthUnit.toUpperCase()})</span>
          <span class="section-count-chip" id="chip-depths">${countFilled(depthFieldKeys)}/${depthFieldKeys.length}</span>
        </div>
        <svg class="section-chevron ${collapsed.depths ? 'collapsed' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="section-collapse-body ${collapsed.depths ? 'collapsed' : ''}" id="sec-body-depths">
        <div class="cement-well-data-grid">
          ${isConductor ? `
            <div class="input-group" style="display:flex; flex-direction:column; gap:4px;">
              <label class="input-label" style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">
                ${t('Rig Type')}
              </label>
              <div style="position:relative; width:100%; display:flex; align-items:center; justify-content:space-between;">
                <select id="field-surface-rig-type" class="form-input" style="width:100%; margin-bottom:0; padding:10px 12px; padding-inline-end:36px; font-size:0.9rem; border-radius:10px; min-height:48px; background:var(--card-bg); border:1px solid var(--border-subtle); color:var(--text-primary); font-weight:600; -webkit-appearance:none; -moz-appearance:none; appearance:none; cursor:pointer;">
                  <option value="jack-up" ${inp.rig_type === 'jack-up' ? 'selected' : ''}>Jack-up</option>
                  <option value="land" ${inp.rig_type === 'land' ? 'selected' : ''}>Land</option>
                </select>
                <div style="position:absolute; right:0; top:0; bottom:0; padding-inline-end:12px; display:flex; align-items:center; justify-content:space-between; pointer-events:none; color:var(--text-secondary);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            ${renderSurfaceInputField(inp.rig_type === 'land' ? 'Ground Level (RKB)' : 'Seabed Depth (RKB)', 'seabed', formatDepthDisplay(inp.seabed), depthUnit.toUpperCase(), errors['seabed'])}
            ${inp.rig_type === 'jack-up' ? renderSurfaceInputField('Seawater MW', 'seawater_mw', inp.seawater_mw, 'ppg', errors['seawater_mw']) : ''}
          ` : `
            ${renderSurfaceInputField('Previous Shoe', 'prev_shoe', formatDepthDisplay(inp.prev_shoe), depthUnit.toUpperCase(), errors['prev_shoe'])}
            ${renderSurfaceInputField('Planned TOC (0 = Surface)', 'planned_toc', formatDepthDisplay(inp.planned_toc), depthUnit.toUpperCase(), errors['planned_toc'])}
          `}
          ${renderSurfaceInputField('Casing Shoe', 'shoe', formatDepthDisplay(inp.shoe), depthUnit.toUpperCase(), errors['shoe'])}
          ${renderSurfaceInputField('Hole Depth (MD)', 'td', formatDepthDisplay(inp.td), depthUnit.toUpperCase(), errors['td'])}
          ${renderSurfaceInputField('Shoe Track Length', 'shoe_track_len', formatDepthDisplay(inp.shoe_track_len), depthUnit.toUpperCase(), errors['shoe_track_len'])}
          <div class="input-group" style="display:flex; flex-direction:column; gap:4px;">
            <label class="input-label" style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">
              ${t('Float Collar Depth')} (${depthUnit.toUpperCase()})
            </label>
            <input type="text" class="form-input" id="surface-calculated-fc" readonly value="${formatDepthDisplay(fc)}" style="margin-bottom:0; padding:10px 12px; font-size:0.9rem; border-radius:10px; min-height:48px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); font-family:'Roboto Mono',monospace; font-weight:700;">
          </div>
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
          ${isConductor ? `
            ${renderSurfaceInputField('Hole Fluid MW', 'hole_fluid_mw', formatWellDataInputVal('hole_fluid_mw', inp.hole_fluid_mw), mwUnit, errors['hole_fluid_mw'])}
            ${renderSurfaceInputField('Displacement MW', 'disp_mw', formatWellDataInputVal('disp_mw', inp.disp_mw), mwUnit, errors['disp_mw'])}
          ` : `
            ${renderSurfaceInputField('Hole Fluid MW', 'mw', formatWellDataInputVal('mw', inp.mw), mwUnit, errors['mw'])}
            ${renderSurfaceInputField('Displacement MW', 'disp_mw', formatWellDataInputVal('disp_mw', inp.disp_mw !== undefined ? inp.disp_mw : inp.mw), mwUnit, errors['disp_mw'])}
          `}
          ${renderSurfaceInputField('1st Mud Vol', 'f1_vol', formatWellDataInputVal('f1_vol', inp.f1_vol), volUnit, errors['f1_vol'])}
          ${renderSurfaceInputField('1st Mud MW', 'f1_mw', formatWellDataInputVal('f1_mw', inp.f1_mw), mwUnit, errors['f1_mw'])}
          ${renderSurfaceInputField('2nd Mud Vol', 'f2_vol', formatWellDataInputVal('f2_vol', inp.f2_vol), volUnit, errors['f2_vol'])}
          ${renderSurfaceInputField('2nd Mud MW', 'f2_mw', formatWellDataInputVal('f2_mw', inp.f2_mw), mwUnit, errors['f2_mw'])}
          ${renderSurfaceInputField('Spacer Vol', 'sp_vol', formatWellDataInputVal('sp_vol', inp.sp_vol), volUnit, errors['sp_vol'])}
          ${renderSurfaceInputField('Spacer MW', 'sp_mw', formatWellDataInputVal('sp_mw', inp.sp_mw), mwUnit, errors['sp_mw'])}
          ${renderSurfaceInputField('Lead Slurry Vol', 'lead_vol', formatWellDataInputVal('lead_vol', inp.lead_vol), volUnit, errors['lead_vol'])}
          ${renderSurfaceInputField('Lead Slurry MW', 'lead_mw', formatWellDataInputVal('lead_mw', inp.lead_mw), mwUnit, errors['lead_mw'])}
          ${renderSurfaceInputField('Tail Slurry Vol', 'tail_vol', formatWellDataInputVal('tail_vol', inp.tail_vol), volUnit, errors['tail_vol'])}
          ${renderSurfaceInputField('Tail Slurry MW', 'tail_mw', formatWellDataInputVal('tail_mw', inp.tail_mw), mwUnit, errors['tail_mw'])}

          ${errors['slurry_pair'] ? `
            <div id="surface-slurry-pair-error" class="cement-slurry-pair-error" style="grid-column: 1 / -1;">
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
          ${renderSurfaceInputField('Open Hole Excess', 'excess_pct', inp.excess_pct, '%', errors['excess_pct'])}
          ${renderSurfaceInputField('Pump Output', 'pump_output', formatWellDataInputVal('pump_output', inp.pump_output), pumpUnitLabel, errors['pump_output'])}
          ${!isConductor ? renderSurfaceInputField('LOT at Prev Shoe', 'lot', formatWellDataInputVal('lot', inp.lot), mwUnit, errors['lot']) : ''}
          ${renderSurfaceInputField('Collapse Rating', 'collapse_rating', formatWellDataInputVal('collapse_rating', inp.collapse_rating), pressUnit, errors['collapse_rating'])}
          ${renderSurfaceInputField('Burst Rating', 'burst_rating', formatWellDataInputVal('burst_rating', inp.burst_rating), pressUnit, errors['burst_rating'])}
          ${isConductor
            ? renderSurfaceInputField('Max Pump Pressure', 'max_pump_pressure', formatWellDataInputVal('max_pump_pressure', inp.max_pump_pressure), pressUnit, errors['max_pump_pressure'], true)
            : renderSurfaceInputField('Float Bump Over', 'bump', formatWellDataInputVal('bump', inp.bump), pressUnit, errors['bump'], true)}
        </div>
      </div>

      <!-- Sticky Result Button -->
      <div class="cement-submit-wrap cement-sticky-submit-wrap">
        <button class="btn btn-primary" id="btn-surface-go-to-results" type="button">
          ${t('Result')}
        </button>
      </div>
    `;
    container.appendChild(inputsCard);

    // Accordion toggle handlers
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
    const copyBtn = inputsCard.querySelector('#btn-surface-copy-from-prev-job');
    if (copyBtn) {
      copyBtn.onclick = () => openSurfaceCopyFromPreviousJobModal();
    }

    // Custom model radio toggle
    if (surfaceCementingState.section === 'custom') {
      inputsCard.querySelectorAll('input[name="custom-surface-model-radio"]').forEach(r => {
        r.onchange = (e) => {
          inp.model = e.target.value;
          renderSurfaceCementingScreen();
        };
      });
    }

    // Rig type change handler
    const rigSelect = inputsCard.querySelector('#field-surface-rig-type');
    if (rigSelect) {
      rigSelect.onchange = () => {
        inp.rig_type = rigSelect.value;
        saveDraftInputs(surfaceCementingState.section, inp);
        renderSurfaceWellData(container);
      };
    }

    // Count chip updater
    const refreshChips = () => {
      const chipD = inputsCard.querySelector('#chip-depths');
      const chipF = inputsCard.querySelector('#chip-fluids');
      const chipL = inputsCard.querySelector('#chip-limits');
      if (chipD) chipD.textContent = `${countFilled(depthFieldKeys)}/${depthFieldKeys.length}`;
      if (chipF) chipF.textContent = `${countFilled(fluidFieldKeys)}/${fluidFieldKeys.length}`;
      if (chipL) chipL.textContent = `${countFilled(limitFieldKeys)}/${limitFieldKeys.length}`;
    };

    // Form inputs change and keyboard navigation
    const allFormInputs = Array.from(inputsCard.querySelectorAll('input.form-input[data-key]'));

    allFormInputs.forEach((input, index) => {
      const key = input.getAttribute('data-key');

      input.addEventListener('focus', () => {
        input.classList.remove('has-error');
        const errEl = input.parentNode.querySelector('.cement-field-error');
        if (errEl) errEl.style.display = 'none';
        if (key === 'lead_vol' || key === 'tail_vol') {
          const slurryErr = inputsCard.querySelector('#surface-slurry-pair-error');
          if (slurryErr) slurryErr.style.display = 'none';
        }
      });

      input.addEventListener('input', () => {
        const rawVal = input.value.trim();
        if (rawVal === '') {
          inp[key] = '';
        } else {
          inp[key] = parseWellDataInputVal(key, rawVal);
        }

        // Live Float Collar depth update
        if (key === 'shoe' || key === 'shoe_track_len') {
          const liveFC = Math.max(0, (Number(inp.shoe) || 0) - (Number(inp.shoe_track_len) || 0));
          const fcEl = inputsCard.querySelector('#surface-calculated-fc');
          if (fcEl) fcEl.value = formatDepthDisplay(liveFC);
        }

        refreshChips();
        saveDraftInputs(surfaceCementingState.section, inp);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (index < allFormInputs.length - 1) {
            const nextInput = allFormInputs[index + 1];
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
            const resBtn = inputsCard.querySelector('#btn-surface-go-to-results');
            if (resBtn) resBtn.click();
          }
        }
      });

      input.addEventListener('change', () => {
        saveDraftInputs(surfaceCementingState.section, inp);
      });
    });

    // Bottom Result Button click
    const resultBtn = inputsCard.querySelector('#btn-surface-go-to-results');
    resultBtn.onclick = () => {
      surfaceCementingState.wellDataSubmitted = true;
      const freshErrors = getSurfaceWellDataErrors(inp);
      const errKeys = Object.keys(freshErrors);

      if (errKeys.length > 0) {
        errKeys.forEach(k => {
          if (depthFieldKeys.includes(k)) collapsed.depths = false;
          if (fluidFieldKeys.includes(k) || k === 'slurry_pair') collapsed.fluids = false;
          if (limitFieldKeys.includes(k)) collapsed.limits = false;
        });

        renderSurfaceWellData(container);

        setTimeout(() => {
          const firstInvalid = container.querySelector('.form-input.has-error')
            || (freshErrors['slurry_pair'] ? container.querySelector('[data-key="lead_vol"]') : null);
          if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              try { firstInvalid.focus(); firstInvalid.select(); } catch (_) {}
            }, 180);
          }
        }, 60);
        return;
      }

      executeSurfaceCalculation();
    };
  }

  function renderSurfaceInputField(label, key, val, unitLabel, error, isLast = false) {
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

  function getSurfaceWellDataErrors(inp) {
    const errors = {};
    const depthKeys = ['seabed', 'prev_shoe', 'td', 'shoe', 'shoe_track_len', 'planned_toc'];
    depthKeys.forEach(k => {
      const v = inp[k];
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v);
        if (isNaN(n) || n < 0) {
          errors[k] = 'Must be a valid positive number';
        }
      }
    });

    const shoe = Number(inp.shoe) || 0;
    const td = Number(inp.td) || 0;
    const prevShoe = Number(inp.prev_shoe) || 0;
    const shoeTrack = Number(inp.shoe_track_len) || 0;

    if (!inp.shoe || shoe <= 0) {
      errors['shoe'] = 'Casing shoe depth required';
    }
    if (!inp.td || td <= 0) {
      errors['td'] = 'Hole depth (MD) required';
    } else if (shoe > 0 && td < shoe) {
      errors['td'] = 'Hole depth (MD) cannot be shallower than casing shoe';
    }

    if (inp.model === 'surface_casing' && prevShoe > 0 && shoe > 0 && shoe <= prevShoe) {
      errors['shoe'] = 'Shoe must be deeper than previous shoe';
    }
    if (shoeTrack > 0 && shoe > 0 && shoeTrack >= shoe) {
      errors['shoe_track_len'] = 'Shoe track cannot exceed shoe depth';
    }

    const pump = Number(inp.pump_output) || 0;
    if (!inp.pump_output || pump <= 0) {
      errors['pump_output'] = 'Pump output required';
    }

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

    if (inp.model === 'surface_casing') {
      const mw = Number(inp.mw) || 0;
      if (!inp.mw || mw <= 0) {
        errors['mw'] = 'Mud weight required';
      }
    }

    return errors;
  }

  function openSurfaceCopyFromPreviousJobModal() {
    const jobs = getSavedJobsList();
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
            const name = j.name || j.jobName || `${t('Job')} #${idx + 1}`;
            const sec = SURFACE_SECTION_PRESETS[j.section]?.label || j.section;
            const dateStr = j.date || (j.updatedAt ? new Date(j.updatedAt).toLocaleDateString() : t('Previous'));
            const modelBadge = (j.model === 'conductor') ? t('Conductor') : t('Surface');
            return `
              <div class="cement-copy-job-item" data-idx="${idx}">
                <div style="min-width:0; flex:1;">
                  <div style="font-weight:700; font-size:0.88rem; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                    ${escapeAttr(name)}
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">
                    ${escapeAttr(sec)} · ${modelBadge} · ${dateStr}
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
          <button type="button" class="btn btn-secondary" id="btn-cancel-surface-copy-modal">${t('Cancel')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btn-cancel-surface-copy-modal').onclick = () => {
      document.body.removeChild(overlay);
    };

    overlay.querySelectorAll('.cement-copy-job-item').forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const sourceJob = jobs[idx];
        if (sourceJob) {
          const sourceInputs = sourceJob.inputs || sourceJob.wellData || {};
          const keysToCopy = [
            'rig_type', 'seabed', 'prev_shoe', 'shoe', 'shoe_track_len', 'td', 'planned_toc',
            'mw', 'seawater_mw', 'hole_fluid_mw', 'disp_mw',
            'f1_vol', 'f1_mw', 'f2_vol', 'f2_mw', 'sp_vol', 'sp_mw',
            'lead_vol', 'lead_mw', 'tail_vol', 'tail_mw',
            'excess_pct', 'pump_output', 'lot', 'collapse_rating', 'burst_rating', 'bump', 'max_pump_pressure'
          ];
          keysToCopy.forEach(k => {
            if (sourceInputs[k] !== undefined && sourceInputs[k] !== null) {
              surfaceCementingState.inputs[k] = sourceInputs[k];
            }
          });
          saveDraftInputs(surfaceCementingState.section, surfaceCementingState.inputs);
          if (typeof showToast === 'function') {
            showToast(t('Copied data from "{0}"', sourceJob.name || t('previous job')));
          }
          renderSurfaceCementingScreen();
        }
        document.body.removeChild(overlay);
      };
    });
  }

  // Calculation Execution Engine Bridge
  function executeSurfaceCalculation(isDirectLoad = false) {
    const inp = surfaceCementingState.inputs;
    const computed = computeSurfaceCapacities(inp, surfaceCementingState.overrides);
    const eff = computed.effective;

    let res = null;

    if (inp.model === 'conductor') {
      const engineInput = {
        rig_type: inp.rig_type || 'jack-up',
        seabed: (Number(inp.seabed) || 0) / M_PER_FT,
        td: (Number(inp.td) || 0) / M_PER_FT,
        shoe: (Number(inp.shoe) || 0) / M_PER_FT,
        shoe_track_len: (Number(inp.shoe_track_len) || 0) / M_PER_FT,
        seawater_mw: Number(inp.seawater_mw) || 8.6,
        hole_fluid_mw: Number(inp.hole_fluid_mw) || 8.6,
        disp_mw: Number(inp.disp_mw) || 8.6,
        f1_vol: Number(inp.f1_vol) || 0,
        f1_mw: Number(inp.f1_mw) || 0,
        f2_vol: Number(inp.f2_vol) || 0,
        f2_mw: Number(inp.f2_mw) || 0,
        sp_vol: Number(inp.sp_vol) || 0,
        sp_mw: Number(inp.sp_mw) || 0,
        lead_vol: Number(inp.lead_vol) || 0,
        lead_mw: Number(inp.lead_mw) || 0,
        tail_vol: Number(inp.tail_vol) || 0,
        tail_mw: Number(inp.tail_mw) || 0,
        excess_pct: Number(inp.excess_pct) || 0,
        pump_output: Number(inp.pump_output) || 0.102,
        collapse_rating: Number(inp.collapse_rating) || 0,
        burst_rating: Number(inp.burst_rating) || 0,
        max_pump_pressure: Number(inp.max_pump_pressure) || 0,
        cap_csg: eff.cap_csg,
        cap_oh: eff.cap_oh,
        cap_ann_oh: eff.cap_ann_oh,
        cap_dp: eff.cap_dp
      };

      if (window.CementingEngine && window.CementingEngine.calcSurfaceConductor) {
        res = window.CementingEngine.calcSurfaceConductor(engineInput);
      }
    } else {
      const engineInput = {
        prev_shoe: (Number(inp.prev_shoe) || 0) / M_PER_FT,
        td: (Number(inp.td) || 0) / M_PER_FT,
        shoe: (Number(inp.shoe) || 0) / M_PER_FT,
        shoe_track_len: (Number(inp.shoe_track_len) || 0) / M_PER_FT,
        planned_toc: (Number(inp.planned_toc) || 0) / M_PER_FT,
        mw: Number(inp.mw) || 0,
        disp_mw: Number(inp.disp_mw || inp.mw) || 0,
        f1_vol: Number(inp.f1_vol) || 0,
        f1_mw: Number(inp.f1_mw) || 0,
        f2_vol: Number(inp.f2_vol) || 0,
        f2_mw: Number(inp.f2_mw) || 0,
        sp_vol: Number(inp.sp_vol) || 0,
        sp_mw: Number(inp.sp_mw) || 0,
        lead_vol: Number(inp.lead_vol) || 0,
        lead_mw: Number(inp.lead_mw) || 0,
        tail_vol: Number(inp.tail_vol) || 0,
        tail_mw: Number(inp.tail_mw) || 0,
        excess_pct: Number(inp.excess_pct) || 0,
        pump_output: Number(inp.pump_output) || 0.102,
        lot: Number(inp.lot) || 0,
        collapse_rating: Number(inp.collapse_rating) || 0,
        burst_rating: Number(inp.burst_rating) || 0,
        bump: Number(inp.bump) || 0,
        cap_csg: eff.cap_csg,
        cap_ann_c: eff.cap_ann_c,
        cap_oh: eff.cap_oh,
        cap_ann_oh: eff.cap_ann_oh
      };

      if (window.CementingEngine && window.CementingEngine.calcSurfaceCasing) {
        res = window.CementingEngine.calcSurfaceCasing(engineInput);
      }
    }

    if (res) {
      surfaceCementingState.results = res;
      surfaceCementingState.view = 'results';
      renderSurfaceCementingScreen();
      const scroller = document.querySelector('#screen-cement-planner-surface .scroller');
      if (scroller) scroller.scrollTop = 0;
      if (isDirectLoad && typeof showToast === 'function') {
        showToast(t('Job loaded'));
      }
    } else {
      if (typeof showToast === 'function') showToast(t('Calculation error: Engine unavailable'));
    }
  }
  root.calculateSurfaceCementing = executeSurfaceCalculation;

  // View 4: Results Step
  function renderSurfaceResults(container) {
    if (!container) return;
    const res = surfaceCementingState.results;
    const inp = surfaceCementingState.inputs;
    if (!res) {
      surfaceCementingState.view = 'welldata';
      renderSurfaceWellData(container);
      return;
    }
    container.innerHTML = '';

    const isConductor = res.model === 'surface_conductor';
    const isMetric = surfaceCementingState.unit === 'm';
    const depthUnit = isMetric ? 'm' : 'ft';
    const preset = SURFACE_SECTION_PRESETS[surfaceCementingState.section] || SURFACE_SECTION_PRESETS['custom'];

    const returnsVol = isConductor ? (res.cement_returns_seabed || 0) : (res.cement_returns_surface || 0);
    const returnsLabel = isConductor ? (inp.rig_type === 'land' ? t('Returns at Ground Level') : t('Returns at Seabed')) : t('Returns at Surface');

    const resultsWrapper = document.createElement('div');
    resultsWrapper.className = 'cement-view-animate';

    const fmtV = (v) => (window.CementingCommon && window.CementingCommon.formatVol) ? window.CementingCommon.formatVol(v) : { val: Number(v || 0).toFixed(1), unit: 'bbl', full: Number(v || 0).toFixed(1) + ' bbl' };
    const fmtMW = (v) => (window.CementingCommon && window.CementingCommon.formatDensity) ? window.CementingCommon.formatDensity(v) : { val: Number(v || 0).toFixed(2), unit: 'ppg', full: Number(v || 0).toFixed(2) + ' ppg' };
    const fmtP = (v) => (window.CementingCommon && window.CementingCommon.formatPressure) ? window.CementingCommon.formatPressure(v) : { val: Number(v || 0).toFixed(0), unit: 'psi', full: Number(v || 0).toFixed(0) + ' psi' };
    const volUnit = fmtV(0).unit;
    const mwUnit = fmtMW(0).unit;
    const pressUnit = fmtP(0).unit;

    // 1. Echo Summary Strip
    const echoStrip = document.createElement('div');
    echoStrip.className = 'cement-results-summary-strip';
    echoStrip.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em;">${t('Job Summary')}</span>
        <span class="cement-badge-model ${isConductor ? 'cement-badge-riserless' : 'cement-badge-subsea'}">${(isConductor ? 'CONDUCTOR' : 'SURFACE')}</span>
      </div>
      <div class="cement-summary-grid">
        <div>
          <div class="cement-summary-cell-title">${t('Job Name')}</div>
          <div class="cement-summary-cell-val">${escapeAttr(inp.name || surfaceCementingState.jobName || preset.label)}</div>
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
          <div class="cement-summary-cell-val">${fmtV(res.total_slurry).full}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('Total Pumped')}</div>
          <div class="cement-summary-cell-val">${fmtV(res.total_pumped).full}</div>
        </div>
        <div>
          <div class="cement-summary-cell-title">${t('EMW at Shoe')}</div>
          <div class="cement-summary-cell-val">${fmtMW(res.emw_shoe).full}</div>
        </div>
      </div>
    `;
    resultsWrapper.appendChild(echoStrip);

    // 2. Output Card 1: Placement & Cement Rise
    const placeCard = document.createElement('div');
    placeCard.className = `cement-accordion ${surfaceCementingState.collapsed.placement ? '' : 'open'}`;
    placeCard.innerHTML = `
      <div class="cement-accordion-header" id="surface-accordion-hdr-placement">
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
            <div class="cement-metric-val">${formatMetricDepth(res.toc, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Tail Slurry Top')}</div>
            <div class="cement-metric-val">${formatMetricDepth(res.tail_top, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Spacer Top')}</div>
            <div class="cement-metric-val">${formatMetricDepth(res.sp_top, isMetric)}<span class="cement-metric-unit">${depthUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Total Slurry Vol')}</div>
            <div class="cement-metric-val">${fmtV(res.total_slurry).val}<span class="cement-metric-unit">${volUnit}</span></div>
          </div>
        </div>

        <div class="cement-metrics-grid">
          <div class="cement-metric-box">
            <div class="cement-metric-label">${returnsLabel}</div>
            <div class="cement-metric-val" style="color:${returnsVol > 0 ? '#15803D' : '#B45309'};">
              ${fmtV(returnsVol).val}<span class="cement-metric-unit">${volUnit}</span>
            </div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('All Fluids Returned')}</div>
            <div class="cement-metric-val">${fmtV(res.all_fluids_returned).val}<span class="cement-metric-unit">${volUnit}</span></div>
          </div>
        </div>

        <!-- Systematic Interval Table -->
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
              ${Number(inp.tail_vol || 0) > 0 || (res.rise_tail || 0) > 0 ? `
                <tr>
                  <td class="col-name">${t('Tail Slurry')}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(inp.tail_vol || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">${formatMetricDist(res.rise_tail || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
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
                <td class="col-num"><span class="cement-table-num">${formatMetricDist(res.rise_lead || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
              </tr>
              <tr>
                <td class="col-name">${t('Spacer')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtV(inp.sp_vol || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${formatMetricDist(res.rise_sp || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
              </tr>
              ${Number(inp.f2_vol || 0) > 0 ? `
                <tr>
                  <td class="col-name">${t('2nd Mud Wash')}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(inp.f2_vol).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">${formatMetricDist(res.rise_f2 || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
                </tr>
              ` : ''}
              ${Number(inp.f1_vol || 0) > 0 ? `
                <tr>
                  <td class="col-name">${t('1st Mud Wash')}</td>
                  <td class="col-num"><span class="cement-table-num">${fmtV(inp.f1_vol).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                  <td class="col-num"><span class="cement-table-num">${formatMetricDist(res.rise_f1 || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
                </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr class="cement-table-total-row">
                <td class="col-name">${t('Total Cement Rise')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtV(res.total_slurry || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num cement-val-highlight"><span class="cement-table-num">${formatMetricDist(res.rise_tot || 0, isMetric)}</span> <span class="cement-table-unit">${depthUnit}</span></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    resultsWrapper.appendChild(placeCard);

    // 3. Output Card 2: Displacement & Pumping Sequence
    const pumpCard = document.createElement('div');
    pumpCard.className = `cement-accordion ${surfaceCementingState.collapsed.displacement ? '' : 'open'}`;
    pumpCard.innerHTML = `
      <div class="cement-accordion-header" id="surface-accordion-hdr-displacement">
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
              ${(res.pumping_sequence || []).map(s => `
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
                <td class="col-num"><span class="cement-table-num">${fmtV(res.total_pumped || 0).val}</span> <span class="cement-table-unit">${volUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
                <td class="col-num cement-val-highlight"><span class="cement-table-num">${Number(inp.pump_output) > 0 ? ((res.total_pumped || 0) / Number(inp.pump_output)).toFixed(0) : '-'}</span> <span class="cement-table-unit">stk</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="cement-metrics-grid" style="margin-top:12px;">
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Total Displacement')}</div>
            <div class="cement-metric-val">${fmtV(res.disp_tot || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Displacement Strokes')}</div>
            <div class="cement-metric-val">${(res.strokes || 0).toFixed(0)}<span class="cement-metric-unit">stk</span></div>
          </div>
          ${!isConductor ? `
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Max Disp No Bump')}</div>
              <div class="cement-metric-val">${fmtV(res.max_disp_no_bump || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Bottom Plug Lands')}</div>
              <div class="cement-metric-val">${fmtV(res.bottom_plug_lands || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
          ` : `
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Shoe Track Vol')}</div>
              <div class="cement-metric-val">${fmtV(res.st_vol || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
            <div class="cement-metric-box">
              <div class="cement-metric-label">${t('Rathole Vol')}</div>
              <div class="cement-metric-val">${fmtV(res.rat_vol || 0).val}<span class="cement-metric-unit">${volUnit}</span></div>
            </div>
          `}
        </div>

        ${isConductor ? `
          <div style="padding:10px 12px; margin-top:12px; background:rgba(var(--primary-rgb, 14, 116, 144), 0.08); border-radius:10px; font-size:0.8rem; color:var(--text-primary); border-left:3px solid var(--primary);">
            <strong>${t('Stab-in Advisory')}:</strong> ${t('Do not over-displace inner string; check floats; pull out of stab-in shoe.')}
          </div>
        ` : ''}
      </div>
    `;
    resultsWrapper.appendChild(pumpCard);

    // 4. Output Card 3: Pressures & EMW
    const pressCard = document.createElement('div');
    pressCard.className = `cement-accordion ${surfaceCementingState.collapsed.pressures ? '' : 'open'}`;
    pressCard.innerHTML = `
      <div class="cement-accordion-header" id="surface-accordion-hdr-pressures">
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
            <div class="cement-metric-val">${fmtP(res.p_ann_fc || 0).val}<span class="cement-metric-unit">${pressUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Inside Pressure at FC')}</div>
            <div class="cement-metric-val">${fmtP(res.p_in_fc || 0).val}<span class="cement-metric-unit">${pressUnit}</span></div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Differential Pressure (FC)')}</div>
            <div class="cement-metric-val" style="color:${(res.diff_press || 0) > 0 ? '#B45309' : '#15803D'};">
              ${fmtP(res.diff_press || 0).val}<span class="cement-metric-unit">${pressUnit}</span>
            </div>
          </div>
          <div class="cement-metric-box">
            <div class="cement-metric-label">${t('Collapse Safety Factor')}</div>
            <div class="cement-metric-val" style="color:${(res.collapse_sf || 0) >= 1.1 ? '#15803D' : '#EF4444'};">
              ${(res.collapse_sf !== undefined && res.collapse_sf !== null) ? (res.collapse_sf >= 900 ? 'No load' : res.collapse_sf.toFixed(2)) : '-'}
            </div>
          </div>
        </div>

        <div style="padding:10px 12px; background:var(--bg-subtle); border-radius:10px; margin-bottom:12px; font-size:0.75rem; border-left:3px solid ${(res.diff_press || 0) > 0 ? '#F59E0B' : '#22C55E'};">
          <strong>${t('Float Status')}:</strong> ${escapeAttr(t(res.diff_meaning || ''))}
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
                <td class="col-num"><span class="cement-table-num">${fmtP(res.p_ann_fc || 0).val}</span> <span class="cement-table-unit">${pressUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${fmtMW(res.emw_fc || 0).val}</span> <span class="cement-table-unit">${mwUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
              </tr>
              <tr>
                <td class="col-name">${t('Casing Shoe')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtP(res.p_ann_shoe || 0).val}</span> <span class="cement-table-unit">${pressUnit}</span></td>
                <td class="col-num"><span class="cement-table-num">${fmtMW(res.emw_shoe || 0).val}</span> <span class="cement-table-unit">${mwUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
              </tr>
              ${res.emw_prev_shoe !== undefined ? `
                <tr>
                  <td class="col-name">${t('Previous Shoe')}</td>
                  <td class="col-num"><span class="cement-table-num">${res.p_prev_shoe !== undefined ? fmtP(res.p_prev_shoe).val : '-'}</span> <span class="cement-table-unit">${res.p_prev_shoe !== undefined ? pressUnit : ''}</span></td>
                  <td class="col-num"><span class="cement-table-num">${fmtMW(res.emw_prev_shoe).val}</span> <span class="cement-table-unit">${mwUnit}</span></td>
                  <td class="col-num">
                    ${res.lot_margin !== undefined ? `
                      <span class="cement-table-badge ${res.lot_margin >= 0 ? 'badge-ok' : 'badge-alert'}">
                        ${res.lot_margin >= 0 ? '+' : ''}${fmtMW(res.lot_margin).val} ${mwUnit}
                      </span>
                    ` : '<span class="cement-table-dash">-</span>'}
                  </td>
                </tr>
              ` : ''}
              <tr>
                <td class="col-name">${isConductor ? t('Max Pump Press') : t('Bump Pressure')}</td>
                <td class="col-num"><span class="cement-table-num">${fmtP((isConductor ? inp.max_pump_pressure : res.bump_pressure) || 0).val}</span> <span class="cement-table-unit">${pressUnit}</span></td>
                <td class="col-num"><span class="cement-table-dash">-</span></td>
                <td class="col-num"><span class="cement-table-limit-badge" title="80% Casing Burst Limit">≤ ${fmtP(res.burst_limit || 0).val} ${pressUnit}</span></td>
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

    // 5. Output Card 4: Job Checks
    const checkCard = document.createElement('div');
    checkCard.className = `cement-accordion ${surfaceCementingState.collapsed.checks ? '' : 'open'}`;
    const checks = res.checks || [];
    const okCount = checks.filter(c => c.status === 'OK').length;
    checkCard.innerHTML = `
      <div class="cement-accordion-header" id="surface-accordion-hdr-checks">
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
              <div>${escapeAttr(c.message || '')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    resultsWrapper.appendChild(checkCard);

    // 6. Output Card 5: Live Well Cementing Schematic
    const schematicCard = document.createElement('div');
    const isSchematicOpen = !surfaceCementingState.collapsed.schematic;
    schematicCard.className = `cement-accordion ${isSchematicOpen ? 'open' : ''}`;
    schematicCard.id = 'surface-schematic-accordion';
    schematicCard.innerHTML = `
      <div class="cement-accordion-header" id="surface-schematic-header-btn">
        <span class="cement-accordion-title" id="surface-schematic-title-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${isSchematicOpen ? t('Hide Well Cementing Schematic') : t('Show Well Cementing Schematic')}
        </span>
        <span class="cement-chevron">▼</span>
      </div>
      <div class="cement-accordion-body" id="surface-schematic-accordion-body" style="padding:14px 16px;"></div>
    `;
    resultsWrapper.appendChild(schematicCard);

    const schematicHeader = schematicCard.querySelector('#surface-schematic-header-btn');
    const schematicTitle = schematicCard.querySelector('#surface-schematic-title-text');
    const schematicBody = schematicCard.querySelector('#surface-schematic-accordion-body');

    function renderSchematicContent() {
      const sectionName = (inp && inp.name) || surfaceCementingState.jobName || (preset && preset.name) || 'Well Cementing Schematic';
      const modelLabel = isConductor ? 'Conductor Profile' : 'Surface Casing Profile';
      const svgMarkup = renderSurfaceSchematicSvg(res, inp, surfaceCementingState.unit);
      const legendMarkup = (window.CementingCommon && typeof window.CementingCommon.renderFluidLegendHtml === 'function')
        ? window.CementingCommon.renderFluidLegendHtml(inp, res, true)
        : '';

      schematicBody.innerHTML = `
        <div class="schematic-toolbar-header">
          <span class="schematic-helper-text">${t('Vertical profile to TD · surface section to scale')}</span>
          <div class="schematic-toolbar-actions">
            <button type="button" class="schematic-tb-btn" id="btn-surface-zoom-out" title="${t('Zoom Out (100% min)')}" aria-label="${t('Zoom Out')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button type="button" class="schematic-tb-btn schematic-zoom-reset" id="btn-surface-zoom-reset" title="${t('Fit / Reset (100%)')}" aria-label="${t('Fit / Reset')}">100%</button>
            <button type="button" class="schematic-tb-btn" id="btn-surface-zoom-in" title="${t('Zoom In (300% max)')}" aria-label="${t('Zoom In')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button type="button" class="schematic-tb-btn" id="btn-surface-fullscreen" title="${t('Full Screen View')}" aria-label="${t('Full Screen View')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </button>
          </div>
        </div>
        <div class="cement-schematic-viewport" id="surface-schematic-viewport">
          <div class="cement-schematic-canvas" id="surface-schematic-canvas">
            ${svgMarkup}
          </div>
        </div>
        ${legendMarkup}
        <div class="cement-layer-tooltip" id="surface-layer-tooltip" style="display:none;"></div>
      `;

      const viewportEl = schematicBody.querySelector('#surface-schematic-viewport');
      const canvasEl = schematicBody.querySelector('#surface-schematic-canvas');
      const controls = {
        zoomOutBtn: schematicBody.querySelector('#btn-surface-zoom-out'),
        resetBtn: schematicBody.querySelector('#btn-surface-zoom-reset'),
        zoomInBtn: schematicBody.querySelector('#btn-surface-zoom-in')
      };

      if (window.CementingCommon && typeof window.CementingCommon.createSchematicViewer === 'function') {
        window.CementingCommon.createSchematicViewer(viewportEl, canvasEl, controls);
      }

      const fsBtn = schematicBody.querySelector('#btn-surface-fullscreen');
      if (fsBtn) {
        fsBtn.onclick = (e) => {
          e.stopPropagation();
          if (window.CementingCommon && typeof window.CementingCommon.openSchematicFullscreenModal === 'function') {
            window.CementingCommon.openSchematicFullscreenModal(svgMarkup, sectionName, modelLabel);
          }
        };
      }
      if (window.CementingCommon && typeof window.CementingCommon.bindSchematicLayerClicks === 'function') {
        window.CementingCommon.bindSchematicLayerClicks(schematicCard);
      }
    }

    if (isSchematicOpen) {
      renderSchematicContent();
    }

    schematicHeader.onclick = () => {
      const willOpen = !schematicCard.classList.contains('open');
      if (willOpen) {
        schematicCard.classList.add('open');
        surfaceCementingState.collapsed.schematic = false;
        schematicTitle.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${t('Hide Well Cementing Schematic')}
        `;
        renderSchematicContent();
      } else {
        schematicCard.classList.remove('open');
        surfaceCementingState.collapsed.schematic = true;
        schematicTitle.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${t('Show Well Cementing Schematic')}
        `;
        schematicBody.innerHTML = '';
      }
    };

    // 7. Bottom Action Buttons Stack
    const actionRow = document.createElement('div');
    actionRow.className = 'cement-step-btn-stack';
    actionRow.style.marginTop = '20px';
    actionRow.innerHTML = `
      <button class="btn btn-primary" id="btn-surface-save-job" style="width:100%;">${t('Save Job')}</button>
      <button class="btn btn-secondary" id="btn-surface-edit-data" style="width:100%;">${t('Edit Well Data')}</button>
      <button class="btn btn-report-pdf" id="btn-surface-generate-pdf-report" style="width:100%;">
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
    container.style.paddingBottom = 'calc(env(safe-area-inset-bottom, 0px) + 32px)';

    actionRow.querySelector('#btn-surface-save-job').onclick = () => saveCurrentSurfaceJob();
    actionRow.querySelector('#btn-surface-edit-data').onclick = () => {
      surfaceCementingState.view = 'welldata';
      renderSurfaceCementingScreen();
    };

    const reportBtn = actionRow.querySelector('#btn-surface-generate-pdf-report');
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
          if (!surfaceCementingState.sectionPresets) {
            surfaceCementingState.sectionPresets = SURFACE_SECTION_PRESETS;
          }
          if (window.CementingPDF && typeof window.CementingPDF.generateJobReport === 'function') {
            const reportResult = await window.CementingPDF.generateJobReport(surfaceCementingState, { isSurface: true });
            const savedFile = await window.CementingPDF.saveReportToFile(
              reportResult.dataUri,
              reportResult.fileName,
              true,
              'application/pdf'
            );
            if (typeof window.showReportReadyDialog === 'function') {
              window.showReportReadyDialog(savedFile);
            }
          } else {
            throw new Error('PDF generator library is not ready. Please try again.');
          }
        } catch (err) {
          console.error('Failed to generate PDF report:', err);
          if (typeof window.showReportErrorDialog === 'function') {
            window.showReportErrorDialog(
              t('Export failed'),
              err.message || t('An unexpected error occurred while saving the report.'),
              () => reportBtn.click()
            );
          } else if (typeof showToast === 'function') {
            showToast(err.message || t('Export failed'));
          }
        } finally {
          reportBtn.disabled = false;
          reportBtn.classList.remove('loading');
          reportBtn.innerHTML = origHtml;
        }
      };
    }

    // Accordion click handlers
    [placeCard, pumpCard, pressCard, checkCard].forEach(card => {
      const hdr = card.querySelector('.cement-accordion-header');
      if (hdr) {
        hdr.onclick = () => {
          card.classList.toggle('open');
        };
      }
    });
  }

  /**
   * Duplicate Confirmation Modal Dialog for Surface Wellhead
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
          ${t('Duplicate Job Exists')}
        </div>
        <div class="cement-modal-desc">
          A saved job for "<strong>${escapeAttr(existingJob.casingType || existingJob.jobName || existingJob.name)}</strong>" on this date (${escapeAttr(existingJob.calendarDate || existingJob.date || '')}) already exists. Do you want to overwrite it?
        </div>
        <div class="cement-modal-actions">
          <button type="button" class="btn btn-secondary" id="btn-dup-cancel">${t('Cancel')}</button>
          <button type="button" class="btn btn-primary" id="btn-dup-overwrite" style="background:#EF4444; border-color:#DC2626;">${t('Overwrite')}</button>
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

  function saveCurrentSurfaceJob() {
    const preset = SURFACE_SECTION_PRESETS[surfaceCementingState.section] || SURFACE_SECTION_PRESETS['custom'];
    const casingType = SECTION_SUBTITLES[surfaceCementingState.section] || preset.label || 'Surface Wellhead Casing';
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = `${hh}:${min}`;
    const finalName = `${casingType} - ${dateStr} ${timeStr}`;

    const list = getSavedJobsList();

    // Prevent duplicate: check same casing type and same calendar date (YYYY-MM-DD)
    const existingIndex = list.findIndex(existing => {
      const existingCasingType = existing.casingType || SECTION_SUBTITLES[existing.section || existing.sectionId] || existing.sectionLabel || (SURFACE_SECTION_PRESETS[existing.section]?.label);
      const isSameCasing = (existing.section === surfaceCementingState.section) ||
                           (existingCasingType && existingCasingType.toLowerCase() === casingType.toLowerCase());

      let existingDate = existing.calendarDate;
      if (!existingDate && existing.createdAt) {
        try {
          const d = new Date(existing.createdAt);
          if (!isNaN(d.getTime())) {
            existingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        } catch (_) {}
      }
      if (!existingDate && existing.updatedAt) {
        try {
          const d = new Date(existing.updatedAt);
          if (!isNaN(d.getTime())) {
            existingDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        } catch (_) {}
      }
      if (!existingDate && (existing.name || existing.jobName)) {
        const match = String(existing.name || existing.jobName).match(/\d{4}-\d{2}-\d{2}/);
        if (match) existingDate = match[0];
      }

      return isSameCasing && existingDate === dateStr;
    });

    const newJob = {
      id: 'surface_job_' + Date.now(),
      name: finalName,
      jobName: finalName,
      casingType: casingType,
      section: surfaceCementingState.section,
      sectionId: surfaceCementingState.section,
      sectionLabel: casingType,
      model: surfaceCementingState.inputs.model,
      calendarDate: dateStr,
      date: dateStr,
      unit: surfaceCementingState.unit,
      capUnit: surfaceCementingState.capUnit,
      reference: surfaceCementingState.activeReference ? JSON.parse(JSON.stringify(surfaceCementingState.activeReference)) : null,
      overrides: Object.assign({}, surfaceCementingState.overrides),
      inputs: JSON.parse(JSON.stringify(surfaceCementingState.inputs)),
      wellData: JSON.parse(JSON.stringify(surfaceCementingState.inputs)),
      results: surfaceCementingState.results ? JSON.parse(JSON.stringify(surfaceCementingState.results)) : null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    if (existingIndex >= 0) {
      const existingJob = list[existingIndex];
      showDuplicateModal(existingJob, function onOverwrite() {
        newJob.id = existingJob.id;
        newJob.createdAt = existingJob.createdAt || newJob.createdAt;
        newJob.updatedAt = now.toISOString();
        list[existingIndex] = newJob;
        saveJobsList(list);
        surfaceCementingState.jobName = finalName;
        if (typeof showToast === 'function') showToast(t('Job "{0}" updated!', finalName));
        surfaceCementingState.view = 'chooser';
        renderSurfaceCementingScreen();
      });
      return;
    }

    list.unshift(newJob);
    saveJobsList(list);
    surfaceCementingState.jobName = finalName;
    if (typeof showToast === 'function') showToast(t('Job "{0}" saved!', finalName));
    surfaceCementingState.view = 'chooser';
    renderSurfaceCementingScreen();
  }

  // SVG Well Cementing Schematic Renderer for Surface Wellhead
  function renderSurfaceSchematicSvg(res, inp, unit) {
    const isMetric = unit === 'm';
    const isConductor = res.model === 'surface_conductor';
    const isJackUp = inp.rig_type === 'jack-up';

    const tdFt = Math.max(10, (Number(inp.td) || 0) / M_PER_FT);
    const shoeFt = Math.max(0, (Number(inp.shoe) || 0) / M_PER_FT);
    const fcFt = Math.max(0, (res.fc !== undefined ? res.fc : ((Number(inp.shoe) || 0) - (Number(inp.shoe_track_len) || 0)) / M_PER_FT));
    const prevShoeFt = isConductor ? 0 : Math.max(0, (Number(inp.prev_shoe) || 0) / M_PER_FT);
    const seabedFt = isConductor ? Math.max(0, (Number(inp.seabed) || 0) / M_PER_FT) : 0;

    const yTop = 60;
    const yBot = 740;
    const totalH = yBot - yTop; // 680 px

    function depthToY(d) {
      if (d === undefined || d === null || isNaN(d)) return yTop;
      const numD = Number(d);
      const clamped = Math.max(0, Math.min(tdFt, numD));
      return yTop + (clamped / tdFt) * totalH;
    }

    const y0 = yTop;
    const yTD = depthToY(tdFt);
    const yShoe = depthToY(shoeFt);
    const yFC = depthToY(fcFt);
    const yPrevShoe = depthToY(prevShoeFt);
    const ySeabed = depthToY(seabedFt);
    const yTOC = depthToY(res.toc);
    const yTail = depthToY(res.tail_top);
    const ySP = depthToY(res.sp_top);
    const yF2 = depthToY(res.f2_top);
    const yF1 = depthToY(res.f1_top);

    const cx = 250;
    const ohLeft = 195;
    const ohRight = 305;
    const ohW = ohRight - ohLeft; // 110 px

    const csgLeft = 215;
    const csgRight = 285;
    const csgW = csgRight - csgLeft; // 70 px

    const prevCsgLeft = 205;
    const prevCsgRight = 295;
    const prevCsgW = prevCsgRight - prevCsgLeft; // 90 px

    const dpLeft = 244;
    const dpRight = 256;
    const dpW = dpRight - dpLeft; // 12 px

    const annLeftW = csgLeft - ohLeft; // 20 px
    const annRightW = ohRight - csgRight; // 20 px

    function fmtD(val) {
      return formatMetricDepth(val, isMetric) + ' ' + (isMetric ? 'm' : 'ft');
    }
    const fmtV = (v) => (window.CementingCommon && window.CementingCommon.formatVol) ? window.CementingCommon.formatVol(v) : { val: Number(v || 0).toFixed(1), unit: 'bbl', full: Number(v || 0).toFixed(1) + ' bbl' };
    const fmtMW = (v) => (window.CementingCommon && window.CementingCommon.formatDensity) ? window.CementingCommon.formatDensity(v) : { val: Number(v || 0).toFixed(2), unit: 'ppg', full: Number(v || 0).toFixed(2) + ' ppg' };

    let svg = `<svg viewBox="-50 0 800 800" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#FAF8F5; border-radius:12px; font-family:'Outfit',sans-serif;">`;

    // Definitions
    svg += `
      <defs>
        <pattern id="surf-hatch-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="10" y2="0" stroke="#D6CBBF" stroke-width="1.2" />
        </pattern>
        <linearGradient id="surf-formation-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FCF9F2" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#F5EFE3" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="surf-water-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#BAE6FD" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
    `;

    // 1. Formation Background Outside
    const formationTopY = isConductor ? ySeabed : y0;
    svg += `
      <!-- Formation Hatch -->
      <rect x="120" y="${formationTopY}" width="260" height="${yTD - formationTopY + 10}" fill="url(#surf-formation-grad)" stroke="#D6CBBF" stroke-width="1" rx="4"/>
      <rect x="120" y="${formationTopY}" width="75" height="${yTD - formationTopY + 10}" fill="url(#surf-hatch-pattern)" opacity="0.4"/>
      <rect x="305" y="${formationTopY}" width="75" height="${yTD - formationTopY + 10}" fill="url(#surf-hatch-pattern)" opacity="0.4"/>
    `;

    // 2. Conductor Specific: Water / Air zone above seabed/GL
    if (isConductor && ySeabed > y0) {
      if (isJackUp) {
        svg += `
          <rect x="120" y="${y0}" width="260" height="${ySeabed - y0}" fill="url(#surf-water-grad)" stroke="#0284C7" stroke-width="1" rx="4"/>
          <path d="M 120 ${y0} Q 140 ${y0 - 3}, 160 ${y0} T 200 ${y0} T 240 ${y0} T 280 ${y0} T 320 ${y0} T 360 ${y0} T 380 ${y0}" fill="none" stroke="#0284C7" stroke-width="2"/>
          <text x="130" y="${y0 + 14}" font-size="8.5" font-weight="700" fill="#0369A1" letter-spacing="0.5">${t('SEAWATER (JACK-UP)')}</text>
          <line x1="115" y1="${ySeabed}" x2="385" y2="${ySeabed}" stroke="#786656" stroke-width="2.5"/>
          <text x="125" y="${ySeabed + 12}" font-size="8.5" font-weight="700" fill="#786656">${t('Seabed')}</text>
        `;
      } else {
        svg += `
          <rect x="120" y="${y0}" width="260" height="${ySeabed - y0}" fill="#FAF8F5" stroke="#CBD5E1" stroke-dasharray="4,3" stroke-width="1" rx="4"/>
          <text x="130" y="${y0 + 14}" font-size="8.5" font-weight="700" fill="#64748B" letter-spacing="0.5">${t('AIR / CELLAR (LAND)')}</text>
          <line x1="115" y1="${ySeabed}" x2="385" y2="${ySeabed}" stroke="#786656" stroke-width="2.5"/>
          <text x="125" y="${ySeabed + 12}" font-size="8.5" font-weight="700" fill="#786656">${t('Ground Level')}</text>
        `;
      }
    }

    // 3. Borehole walls (open hole from prev shoe or seabed down to TD)
    const holeTopY = isConductor ? ySeabed : (yPrevShoe > y0 ? yPrevShoe : y0);
    svg += `
      <!-- Open Hole Walls -->
      <line x1="${ohLeft}" y1="${holeTopY}" x2="${ohLeft}" y2="${yTD}" stroke="#78716C" stroke-width="2" stroke-dasharray="4,2"/>
      <line x1="${ohRight}" y1="${holeTopY}" x2="${ohRight}" y2="${yTD}" stroke="#78716C" stroke-width="2" stroke-dasharray="4,2"/>
      <line x1="${ohLeft}" y1="${yTD}" x2="${ohRight}" y2="${yTD}" stroke="#78716C" stroke-width="2.5"/>
    `;

    // 4. Previous Casing (Surface-casing model)
    if (!isConductor && prevShoeFt > 0 && yPrevShoe > y0) {
      svg += `
        <!-- Previous Casing Surface to Prev Shoe -->
        <rect x="${prevCsgLeft}" y="${y0}" width="5" height="${yPrevShoe - y0}" fill="#3A3A3A"/>
        <rect x="${prevCsgRight - 5}" y="${y0}" width="5" height="${yPrevShoe - y0}" fill="#3A3A3A"/>
        <rect x="${prevCsgLeft - 2}" y="${yPrevShoe - 6}" width="9" height="6" fill="#151515"/>
        <rect x="${prevCsgRight - 7}" y="${yPrevShoe - 6}" width="9" height="6" fill="#151515"/>
      `;
    }

    // 5. Annulus Fluids (Left and Right Columns)
    const annTopY = isConductor ? ySeabed : y0;
    const topFluidY = (inp.f1_vol > 0) ? yF1 : ((inp.f2_vol > 0) ? yF2 : ((inp.sp_vol > 0) ? ySP : yTOC));

    // Annulus Original Fluid (Well mud / Hole fluid)
    if (topFluidY > annTopY) {
      const origColor = '#C9D6DF';
      const origName = 'Hole Fluid';
      const origMw = isConductor ? inp.hole_fluid_mw : inp.mw;
      svg += `
        <rect class="cement-svg-layer" data-name="${origName}" data-depth="${fmtD(isConductor ? seabedFt : 0)} - ${fmtD(inp.f1_vol > 0 ? res.f1_top : (inp.f2_vol > 0 ? res.f2_top : (inp.sp_vol > 0 ? res.sp_top : res.toc)))}" data-vol="In Hole" data-mw="${fmtMW(origMw).full}" x="${ohLeft}" y="${annTopY}" width="${annLeftW}" height="${topFluidY - annTopY}" fill="${origColor}" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="${origName}" data-depth="${fmtD(isConductor ? seabedFt : 0)} - ${fmtD(inp.f1_vol > 0 ? res.f1_top : (inp.f2_vol > 0 ? res.f2_top : (inp.sp_vol > 0 ? res.sp_top : res.toc)))}" data-vol="In Hole" data-mw="${fmtMW(origMw).full}" x="${csgRight}" y="${annTopY}" width="${annRightW}" height="${topFluidY - annTopY}" fill="${origColor}" cursor="pointer"/>
      `;
    }

    // 1st Mud/Wash
    if (inp.f1_vol > 0 && yF2 > yF1) {
      svg += `
        <rect class="cement-svg-layer" data-name="1st Mud Wash" data-depth="${fmtD(res.f1_top)} - ${fmtD(res.f2_top)}" data-vol="${fmtV(inp.f1_vol).full}" data-mw="${fmtMW(inp.f1_mw).full}" x="${ohLeft}" y="${yF1}" width="${annLeftW}" height="${yF2 - yF1}" fill="#E07B39" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="1st Mud Wash" data-depth="${fmtD(res.f1_top)} - ${fmtD(res.f2_top)}" data-vol="${fmtV(inp.f1_vol).full}" data-mw="${fmtMW(inp.f1_mw).full}" x="${csgRight}" y="${yF1}" width="${annRightW}" height="${yF2 - yF1}" fill="#E07B39" cursor="pointer"/>
      `;
    }

    // 2nd Mud/Wash
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

    // Rathole Cement (below shoe down to TD)
    if (yTD > yShoe) {
      const ratColor = (inp.tail_vol > 0) ? '#3E7D3A' : '#B5D99C';
      svg += `
        <rect class="cement-svg-layer" data-name="Rathole Cement" data-depth="${fmtD(inp.shoe)} - ${fmtD(inp.td)}" data-vol="${fmtV(res.rat_vol || 0).full}" data-mw="${fmtMW((inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0).full}" x="${ohLeft}" y="${yShoe}" width="${ohW}" height="${yTD - yShoe}" fill="${ratColor}" opacity="0.9" cursor="pointer"/>
      `;
    }

    // 6. Casing Body & Shoe Track
    svg += `
      <!-- Casing Walls -->
      <rect x="${csgLeft}" y="${y0}" width="4" height="${yShoe - y0}" fill="#1F3864"/>
      <rect x="${csgRight - 4}" y="${y0}" width="4" height="${yShoe - y0}" fill="#1F3864"/>
      <!-- Guide Shoe Block -->
      <rect x="${csgLeft - 2}" y="${yShoe - 8}" width="8" height="8" fill="#151515"/>
      <rect x="${csgRight - 6}" y="${yShoe - 8}" width="8" height="8" fill="#151515"/>
    `;

    // Casing Interior:
    if (yFC > y0) {
      if (isConductor) {
        svg += `
          <!-- Conductor Interior around DP -->
          <rect x="${csgLeft + 4}" y="${y0}" width="${dpLeft - (csgLeft + 4)}" height="${yFC - y0}" fill="#C9D6DF" opacity="0.5"/>
          <rect x="${dpRight}" y="${y0}" width="${(csgRight - 4) - dpRight}" height="${yFC - y0}" fill="#C9D6DF" opacity="0.5"/>
          <!-- Inner String DP Walls -->
          <rect x="${dpLeft}" y="${y0}" width="2.5" height="${yFC - y0}" fill="#334155"/>
          <rect x="${dpRight - 2.5}" y="${y0}" width="2.5" height="${yFC - y0}" fill="#334155"/>
          <!-- DP Interior (Displacement Fluid) -->
          <rect class="cement-svg-layer" data-name="Displacement Fluid (in DP)" data-depth="${fmtD(0)} - ${fmtD(res.fc)}" data-vol="${fmtV(res.disp_tot || 0).full}" data-mw="${fmtMW(inp.disp_mw).full}" x="${dpLeft + 2.5}" y="${y0}" width="${dpW - 5}" height="${yFC - y0}" fill="#F2D388" cursor="pointer"/>
          <!-- Stab-in Packer / Shoe -->
          <rect x="${csgLeft + 4}" y="${yFC - 6}" width="${csgW - 8}" height="6" fill="#151515" rx="1"/>
        `;
      } else {
        svg += `
          <!-- Casing Interior Displacement -->
          <rect class="cement-svg-layer" data-name="Displacement Fluid" data-depth="${fmtD(0)} - ${fmtD(res.fc)}" data-vol="${fmtV(res.disp_tot || 0).full}" data-mw="${fmtMW(inp.mw).full}" x="${csgLeft + 4}" y="${y0}" width="${csgW - 8}" height="${yFC - y0}" fill="#F2D388" cursor="pointer"/>
          <!-- Float Collar / Wiper Plug -->
          <rect x="${csgLeft + 4}" y="${yFC - 6}" width="${csgW - 8}" height="6" fill="#D97706" rx="1"/>
        `;
      }
    }

    // Shoe Track Cement (between FC and Shoe)
    if (yShoe > yFC) {
      const stColor = (inp.tail_vol > 0) ? '#3E7D3A' : '#B5D99C';
      svg += `
        <!-- Shoe Track Cement -->
        <rect class="cement-svg-layer" data-name="Shoe Track Cement" data-depth="${fmtD(res.fc)} - ${fmtD(inp.shoe)}" data-vol="${fmtV(res.st_vol || 0).full}" data-mw="${fmtMW((inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0).full}" x="${csgLeft + 4}" y="${yFC}" width="${csgW - 8}" height="${yShoe - yFC}" fill="${stColor}" cursor="pointer"/>
      `;
    }

    // 7. Balanced Left/Right Depth Callouts with Collision Avoidance & Rounded Pills
    const leftMarkers = [];
    const rightMarkers = [];

    // Left Side Callouts: Structural / Geometry depths
    leftMarkers.push({
      d: 0,
      targetY: y0,
      label: `${t('Surface / RKB')} 0 ${isMetric ? 'm' : 'ft'}`,
      bg: '#2C1A11',
      text: '#FFFFFF'
    });

    if (!isConductor && prevShoeFt > 0) {
      leftMarkers.push({
        d: prevShoeFt,
        targetY: yPrevShoe,
        label: `${t('Prev Shoe')} ${fmtD(prevShoeFt)}`,
        bg: '#64748B',
        text: '#FFFFFF'
      });
    }

    if (fcFt > 0) {
      leftMarkers.push({
        d: fcFt,
        targetY: yFC,
        label: `${t('Float Collar Depth')} ${fmtD(fcFt)}`,
        bg: '#DC2626',
        text: '#FFFFFF'
      });
    }

    if (shoeFt > 0) {
      leftMarkers.push({
        d: shoeFt,
        targetY: yShoe,
        label: `${t('Casing Shoe')} ${fmtD(shoeFt)}`,
        bg: '#1E293B',
        text: '#FFFFFF'
      });
    }

    if (tdFt > 0) {
      leftMarkers.push({
        d: tdFt,
        targetY: yTD,
        label: `${t('Hole Depth (MD)')} ${fmtD(tdFt)}`,
        bg: '#78716C',
        text: '#FFFFFF'
      });
    }

    // Right Side Callouts: Environmental & Fluid Top depths
    if (isConductor && seabedFt > 0) {
      const seabedLabel = isJackUp ? t('Seabed') : t('Ground Level');
      rightMarkers.push({
        d: seabedFt,
        targetY: ySeabed,
        label: `${seabedLabel} ${fmtD(seabedFt)}`,
        bg: '#8D7765',
        text: '#FFFFFF'
      });
    }

    if (inp.f1_vol > 0 && res.f1_top !== undefined && res.f1_top < shoeFt) {
      rightMarkers.push({
        d: res.f1_top,
        targetY: yF1,
        label: `${t('1st Mud Wash Top')} ${fmtD(res.f1_top)}`,
        bg: '#E07B39',
        text: '#FFFFFF'
      });
    }

    if (inp.f2_vol > 0 && res.f2_top !== undefined && res.f2_top < shoeFt) {
      rightMarkers.push({
        d: res.f2_top,
        targetY: yF2,
        label: `${t('2nd Mud Wash Top')} ${fmtD(res.f2_top)}`,
        bg: '#9B59B6',
        text: '#FFFFFF'
      });
    }

    if (inp.sp_vol > 0 && res.sp_top !== undefined && res.sp_top < shoeFt) {
      rightMarkers.push({
        d: res.sp_top,
        targetY: ySP,
        label: `${t('Spacer Top')} ${fmtD(res.sp_top)}`,
        bg: '#4A90D9',
        text: '#FFFFFF'
      });
    }

    if (res.toc !== undefined && res.toc >= 0 && res.toc < shoeFt) {
      const tocLabel = (inp.lead_vol > 0) ? t('Lead Slurry Top') : t('TOC');
      rightMarkers.push({
        d: res.toc,
        targetY: yTOC,
        label: `${tocLabel} ${fmtD(res.toc)}`,
        bg: '#15803D',
        text: '#FFFFFF'
      });
    }

    if (inp.tail_vol > 0 && res.tail_top > 0 && res.tail_top < shoeFt && Math.abs(res.tail_top - res.toc) > 0.5) {
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
    function fmtH(val) {
      return (window.CementingCommon && typeof window.CementingCommon.formatMetricDist === 'function')
        ? (window.CementingCommon.formatMetricDist(val, isMetric) + ' ' + (isMetric ? 'm' : 'ft'))
        : (Number(val || 0).toFixed(1) + (isMetric ? ' m' : ' ft'));
    }

    const dimensions = [];

    // Environmental / Above-Mudline/GL Zone (when > 0)
    if (isConductor && seabedFt > 0 && ySeabed > y0) {
      const seabedLabel = isJackUp ? t('Water Depth') : t('Air Gap');
      const seabedColor = isJackUp ? '#0284C7' : '#64748B';
      dimensions.push({
        id: 'seabed_zone',
        type: 'env',
        track: 'inner',
        topY: y0,
        botY: ySeabed,
        topD: 0,
        botD: seabedFt,
        label: seabedLabel,
        heightStr: fmtH(seabedFt),
        color: seabedColor,
        bg: seabedColor
      });
    }

    // Displacement Fluid inside Casing/String
    if (fcFt > 0 && yFC > y0) {
      const dispMw = isConductor ? (inp.disp_mw || inp.hole_fluid_mw) : inp.mw;
      dimensions.push({
        id: 'displacement',
        type: 'internal',
        track: 'internal',
        topY: y0,
        botY: yFC,
        topD: 0,
        botD: fcFt,
        label: t('Displacement Fluid'),
        heightStr: fmtH(fcFt),
        mwStr: fmtMW(dispMw).full,
        color: '#D97706',
        bg: '#1E293B'
      });
    }

    // Shoe Track Cement inside Casing (between FC and Shoe)
    if (shoeFt > fcFt && yShoe > yFC) {
      const stMw = (inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0;
      dimensions.push({
        id: 'shoe_track',
        type: 'internal',
        track: 'internal',
        topY: yFC,
        botY: yShoe,
        topD: fcFt,
        botD: shoeFt,
        label: t('Shoe Track'),
        heightStr: fmtH(shoeFt - fcFt),
        mwStr: fmtMW(stMw).full,
        color: '#3E7D3A',
        bg: '#1E293B'
      });
    }

    // Annular Fluids:
    const annTopD = isConductor ? seabedFt : 0;
    const topFluidD = (inp.f1_vol > 0) ? res.f1_top : ((inp.f2_vol > 0) ? res.f2_top : ((inp.sp_vol > 0) ? res.sp_top : res.toc));

    // Annulus Hole Fluid / Original Mud
    if (topFluidD > annTopD && topFluidY > annTopY) {
      const origMw = isConductor ? inp.hole_fluid_mw : inp.mw;
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
        mwStr: fmtMW(origMw).full,
        color: '#64748B',
        bg: '#334155'
      });
    }

    // 1st Mud Wash
    if (inp.f1_vol > 0 && res.f1_top !== undefined) {
      const f1NextTop = (inp.f2_vol > 0) ? res.f2_top : ((inp.sp_vol > 0) ? res.sp_top : res.toc);
      const f1NextY = (inp.f2_vol > 0) ? yF2 : ((inp.sp_vol > 0) ? ySP : yTOC);
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
      const f2NextTop = (inp.sp_vol > 0) ? res.sp_top : res.toc;
      const f2NextY = (inp.sp_vol > 0) ? ySP : yTOC;
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

  // Global functions exposed for testability and runtime
  root.renderSurfaceSchematicSvg = renderSurfaceSchematicSvg;
  if (typeof window !== 'undefined') {
    window.renderSurfaceSchematicSvg = renderSurfaceSchematicSvg;
  }

  root.surfaceGoToView = function (v) {
    surfaceCementingState.view = v;
    renderSurfaceCementingScreen();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('languageChanged', () => {
      const surfaceScreen = document.getElementById('screen-cement-planner-surface');
      if (surfaceScreen && surfaceScreen.classList.contains('active')) {
        renderSurfaceCementingScreen();
      }
    });

    window.addEventListener('unitSystemChanged', () => {
      loadPersistedUnit();
      const surfaceScreen = document.getElementById('screen-cement-planner-surface');
      if (surfaceScreen && surfaceScreen.classList.contains('active')) {
        renderSurfaceCementingScreen();
      }
    });
  }

})(typeof self !== 'undefined' ? self : this);
