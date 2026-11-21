/**
 * Surface Wellhead Cementing Planner Controller & UI (Land Rig & Jack-up Rig)
 * Drilling Toolkit Web Runtime
 */
(function (root) {
  'use strict';

  const M_PER_FT = 0.3048;
  const SAVED_JOBS_KEY = 'surface_cement_saved_jobs_v1';
  const WELLDATA_DRAFT_PREFIX = 'surface_cementing_welldata_draft_';
  const CAPACITY_REF_PREFIX = 'surface_cementing_cap_ref_';
  const UNIT_STORAGE_KEY = 'surface_cementing_unit';
  const CAP_UNIT_STORAGE_KEY = 'surface_cementing_cap_unit';

  const DEPTH_KEYS = ['seabed', 'prev_shoe', 'td', 'shoe', 'shoe_track_len', 'planned_toc'];

  // Default section presets (stored in ft, matching T1, T2, T3, T4 specifications)
  const SURFACE_SECTION_PRESETS = {
    'conductor': {
      section: 'conductor',
      name: '30" Conductor',
      label: '30" Conductor',
      subtitle: 'Inner-string (stab-in) · Jack-up / Land',
      model: 'conductor',
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
      subtitle: '26" Hole · Inside 30" Casing',
      model: 'surface_casing',
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
      subtitle: '17½" Hole · Inside 20" Casing',
      model: 'surface_casing',
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
      subtitle: '12¼" Hole · Inside 13-3/8" Casing',
      model: 'surface_casing',
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
      tubulars: {
        csg_id: 'csg_9.625_47',
        prev_csg_id: 'csg_13.375_72',
        hole_id: 'oh_12.25'
      }
    },
    'custom': {
      section: 'custom',
      name: 'Custom Surface Section',
      label: 'Custom Surface Section',
      subtitle: 'User-defined casing, hole & job model',
      model: 'surface_casing',
      custom_model: 'surface_casing',
      prev_shoe: 1800,
      td: 5000,
      shoe: 4900,
      shoe_track_len: 80,
      planned_toc: 1200,
      mw: 10.0,
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

  // State Management
  const surfaceCementingState = {
    view: 'chooser', // 'chooser' | 'capacities' | 'welldata' | 'results'
    section: 'conductor',
    unit: 'ft',
    capUnit: 'BBL/FT',
    inputs: {},
    overrides: {},
    results: null,
    jobName: '',
    collapsed: {
      placement: false,
      displacement: false,
      pressures: false,
      checks: false,
      schematic: false
    }
  };
  root.surfaceCementingState = surfaceCementingState;

  // Persistence Helpers
  function loadPersistedUnit() {
    try {
      const u = localStorage.getItem(UNIT_STORAGE_KEY);
      if (u === 'm' || u === 'ft') surfaceCementingState.unit = u;
      const cu = localStorage.getItem(CAP_UNIT_STORAGE_KEY);
      if (cu) surfaceCementingState.capUnit = cu;
    } catch (_) {}
  }

  function savePersistedUnit() {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, surfaceCementingState.unit);
      localStorage.setItem(CAP_UNIT_STORAGE_KEY, surfaceCementingState.capUnit);
    } catch (_) {}
  }

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
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(list));
    } catch (_) {}
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

  function setSavedCapacityRef(id, refData) {
    try {
      localStorage.setItem(CAPACITY_REF_PREFIX + id, JSON.stringify(refData));
    } catch (_) {}
  }

  function clearSavedCapacityRef(id) {
    try {
      localStorage.removeItem(CAPACITY_REF_PREFIX + id);
    } catch (_) {}
  }

  // Translation & formatting helpers from CementingCommon
  function t(key) {
    return (window.CementingCommon && window.CementingCommon.t) ? window.CementingCommon.t(key) : key;
  }
  function escapeHtml(str) {
    return (window.CementingCommon && window.CementingCommon.escapeHtml) ? window.CementingCommon.escapeHtml(str) : String(str || '');
  }
  function escapeAttr(str) {
    return (window.CementingCommon && window.CementingCommon.escapeAttr) ? window.CementingCommon.escapeAttr(str) : String(str || '');
  }
  function formatMetricDepth(ftVal, isMetric) {
    const v = Number(ftVal) || 0;
    return isMetric ? (v * M_PER_FT).toFixed(1) : v.toFixed(1);
  }
  function formatMetricDist(ftVal, isMetric) {
    const v = Number(ftVal) || 0;
    return isMetric ? (v * M_PER_FT).toFixed(1) : v.toFixed(1);
  }

  // Capacity Computation for Surface Wellhead
  function computeSurfaceCapacities(inp, overrides = {}) {
    const tubulars = inp.tubulars || {};
    const capData = (window.CementingCommon && window.CementingCommon.CAPACITY_DATA) || [];

    const csg = capData.find(t => t.id === tubulars.csg_id) || null;
    const dp = capData.find(t => t.id === tubulars.dp_id) || null;
    const prevCsg = capData.find(t => t.id === tubulars.prev_csg_id) || null;
    const hole = capData.find(t => t.id === tubulars.hole_id) || null;

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

  // Master Render Function
  function renderSurfaceCementingScreen() {
    loadPersistedUnit();
    const wrapper = document.getElementById('screen-cement-planner-surface');
    if (!wrapper) return;

    const fixedHeaderWrapper = document.getElementById('cementing-surface-fixed-header-wrapper');
    const headerSlot = document.getElementById('cementing-surface-job-header-slot');
    const container = document.getElementById('cementing-surface-container');
    const headerBadge = document.getElementById('cementing-surface-header-badge');
    const compactTitle = document.getElementById('cementing-surface-screen-title-compact');

    if (!container) return;

    // View routing
    switch (surfaceCementingState.view) {
      case 'chooser':
        if (fixedHeaderWrapper) fixedHeaderWrapper.style.display = 'none';
        if (headerBadge) headerBadge.style.display = 'none';
        if (compactTitle) compactTitle.textContent = t('Surface Wellhead');
        renderSurfaceChooser(container);
        break;

      case 'capacities':
        if (fixedHeaderWrapper) {
          fixedHeaderWrapper.style.display = 'block';
          renderSurfaceJobHeader(headerSlot);
        }
        if (headerBadge) {
          headerBadge.style.display = 'inline-block';
          headerBadge.textContent = t(surfaceCementingState.inputs.model === 'conductor' ? 'Conductor' : 'Surface Casing');
        }
        renderSurfaceCapacities(container);
        break;

      case 'welldata':
        if (fixedHeaderWrapper) {
          fixedHeaderWrapper.style.display = 'block';
          renderSurfaceJobHeader(headerSlot);
        }
        if (headerBadge) {
          headerBadge.style.display = 'inline-block';
          headerBadge.textContent = t(surfaceCementingState.inputs.model === 'conductor' ? 'Conductor' : 'Surface Casing');
        }
        renderSurfaceWellData(container);
        break;

      case 'results':
        if (fixedHeaderWrapper) {
          fixedHeaderWrapper.style.display = 'block';
          renderSurfaceJobHeader(headerSlot, true);
        }
        if (headerBadge) {
          headerBadge.style.display = 'inline-block';
          headerBadge.textContent = t(surfaceCementingState.inputs.model === 'conductor' ? 'Conductor' : 'Surface Casing');
        }
        renderSurfaceResults(container);
        break;

      default:
        surfaceCementingState.view = 'chooser';
        renderSurfaceChooser(container);
        break;
    }
  }
  root.renderSurfaceCementingScreen = renderSurfaceCementingScreen;

  // View 1: Section Chooser
  function renderSurfaceChooser(container) {
    const savedJobs = getSavedJobsList();

    container.innerHTML = `
      <div class="cement-chooser-wrapper" style="display:flex; flex-direction:column; gap:20px; padding:8px 0 24px;">
        <div class="cement-section-header" style="margin-bottom:4px;">
          <h2 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin:0 0 4px;">${t('Select Casing String')}</h2>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin:0;">${t('Surface wellhead casing string setup, slurry volumes, and displacement calculations.')}</p>
        </div>

        <div class="selection-card-list" style="display:flex; flex-direction:column; gap:12px;">
          ${renderSectionCard('conductor', '30" Conductor', '36" Hole · 30" Casing', 'Conductor Model (Stab-in)', 'icon-subsea')}
          ${renderSectionCard('surface', '20" Surface Casing', '26" Hole · 20" Casing', 'Surface-casing Model', 'icon-surface')}
          ${renderSectionCard('intermediate', '13-3/8" Intermediate Casing', '17½" Hole · 13-3/8" Casing', 'Surface-casing Model', 'icon-intermediate')}
          ${renderSectionCard('production', '9-5/8" Production Casing', '12¼" Hole · 9-5/8" Casing', 'Surface-casing Model', 'icon-production')}
          ${renderSectionCard('custom', 'Custom Section', 'User-defined casing, hole & model', 'Flexible Model', 'icon-custom')}
        </div>

        ${savedJobs.length > 0 ? `
          <div class="cement-saved-jobs-section" style="margin-top:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:1rem; font-weight:700; color:var(--text-primary); margin:0;">${t('Saved Surface Jobs')}</h3>
              <span class="cement-badge-count" style="background:var(--bg-subtle-track); color:var(--text-secondary); font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:600;">${savedJobs.length}</span>
            </div>
            <div class="saved-jobs-list" style="display:flex; flex-direction:column; gap:10px;">
              ${savedJobs.map((job, idx) => `
                <div class="card selection-card saved-job-card" data-job-id="${escapeAttr(job.id)}" style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-radius:12px; background:var(--card-bg); border:1px solid var(--border-subtle); cursor:pointer;">
                  <div style="min-width:0;">
                    <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem; margin-bottom:2px;">${escapeHtml(job.name || job.label)}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary);">${job.model === 'conductor' ? t('Conductor Model') : t('Surface Casing Model')} · ${new Date(job.updatedAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <button type="button" class="btn-delete-saved-job" data-delete-idx="${idx}" title="${t('Delete Job')}" aria-label="${t('Delete Job')}" style="background:none; border:none; padding:6px; color:var(--text-secondary); cursor:pointer;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                    <span class="card-chevron" style="color:var(--text-secondary);">&rsaquo;</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Bind section card clicks
    container.querySelectorAll('.selection-card[data-section]').forEach(card => {
      card.onclick = () => {
        const sec = card.getAttribute('data-section');
        selectSection(sec);
      };
    });

    // Bind saved job clicks & deletes
    container.querySelectorAll('.saved-job-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-delete-saved-job')) return;
        const jId = card.getAttribute('data-job-id');
        loadSavedJob(jId);
      };
    });

    container.querySelectorAll('.btn-delete-saved-job').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-delete-idx'), 10);
        const list = getSavedJobsList();
        if (idx >= 0 && idx < list.length) {
          list.splice(idx, 1);
          saveJobsList(list);
          renderSurfaceChooser(container);
          if (typeof showToast === 'function') showToast(t('Saved job deleted'));
        }
      };
    });
  }

  function renderSectionCard(secKey, title, sub, modelTag, iconClass) {
    return `
      <div class="card selection-card" data-section="${secKey}" style="display:flex; align-items:center; gap:16px; padding:16px; border-radius:14px; background:var(--card-bg); border:1px solid var(--border-subtle); cursor:pointer; transition:transform 0.15s, border-color 0.15s;">
        <div class="card-icon-container ${iconClass}" style="width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:1rem; font-weight:700; color:var(--text-primary); margin:0;">${t(title)}</h3>
            <span style="font-size:0.7rem; font-weight:600; padding:2px 8px; border-radius:8px; background:var(--bg-subtle-track); color:var(--text-secondary);">${t(modelTag)}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin:4px 0 0;">${t(sub)}</p>
        </div>
        <span class="card-chevron" style="color:var(--text-secondary);">&rsaquo;</span>
      </div>
    `;
  }

  function selectSection(secKey) {
    surfaceCementingState.section = secKey;
    const preset = SURFACE_SECTION_PRESETS[secKey];
    if (!preset) return;

    // Check for draft inputs
    const draft = getDraftInputs(secKey);
    surfaceCementingState.inputs = draft ? { ...preset, ...draft } : { ...preset };
    surfaceCementingState.overrides = {};
    surfaceCementingState.results = null;
    surfaceCementingState.jobName = preset.name;
    surfaceCementingState.view = 'capacities';
    renderSurfaceCementingScreen();
  }

  function surfaceGoToView(viewName) {
    if (['chooser', 'capacities', 'welldata', 'results'].includes(viewName)) {
      surfaceCementingState.view = viewName;
      renderSurfaceCementingScreen();
    }
  }

  function openSurfaceCementingModule(sectionKey) {
    if (sectionKey && SURFACE_SECTION_PRESETS[sectionKey]) {
      selectSection(sectionKey);
    } else {
      surfaceCementingState.view = 'chooser';
      renderSurfaceCementingScreen();
    }
  }

  function loadSavedJob(jobId) {
    const list = getSavedJobsList();
    const job = list.find(j => j.id === jobId);
    if (!job) return;

    surfaceCementingState.section = job.section || 'custom';
    surfaceCementingState.inputs = { ...job.inputs };
    surfaceCementingState.overrides = { ...(job.overrides || {}) };
    surfaceCementingState.unit = job.unit || 'ft';
    surfaceCementingState.jobName = job.name || job.label;
    surfaceCementingState.view = 'results';
    renderSurfaceCementingScreen();
    if (typeof showToast === 'function') showToast(t('Job loaded'));
  }

  // Job Top Bar
  function renderSurfaceJobHeader(slot, isResults = false) {
    if (!slot) return;
    const isMetric = surfaceCementingState.unit === 'm';
    const sectionName = surfaceCementingState.jobName || SURFACE_SECTION_PRESETS[surfaceCementingState.section]?.name || 'Surface Wellhead';

    slot.innerHTML = `
      <div class="cement-job-header-bar" style="display:flex; justify-content:space-between; align-items:center; padding:10px 16px; background:var(--card-bg); border-bottom:1px solid var(--border-subtle);">
        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
          <button type="button" class="btn-job-back" id="btn-surface-job-back" aria-label="${t('Back')}" style="background:none; border:none; padding:4px; color:var(--text-primary); cursor:pointer;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <span style="font-weight:700; font-size:0.95rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(sectionName)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <!-- Unit Switcher -->
          <div class="unit-toggle-pill" id="surface-unit-toggle" style="display:flex; background:var(--bg-subtle-track); border-radius:20px; padding:2px; cursor:pointer;">
            <span class="unit-opt ${!isMetric ? 'active' : ''}" data-unit="ft" style="padding:3px 10px; font-size:0.75rem; font-weight:700; border-radius:16px; ${!isMetric ? 'background:var(--primary); color:#fff;' : 'color:var(--text-secondary);'}">ft</span>
            <span class="unit-opt ${isMetric ? 'active' : ''}" data-unit="m" style="padding:3px 10px; font-size:0.75rem; font-weight:700; border-radius:16px; ${isMetric ? 'background:var(--primary); color:#fff;' : 'color:var(--text-secondary);'}">m</span>
          </div>
          ${!isResults ? `
            <button type="button" class="btn-reset-step" id="btn-surface-reset-step" title="${t('Reset Defaults')}" style="background:none; border:none; padding:4px; color:var(--text-secondary); cursor:pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Back click
    const backBtn = slot.querySelector('#btn-surface-job-back');
    if (backBtn) {
      backBtn.onclick = () => {
        if (surfaceCementingState.view === 'results') surfaceCementingState.view = 'welldata';
        else if (surfaceCementingState.view === 'welldata') surfaceCementingState.view = 'capacities';
        else if (surfaceCementingState.view === 'capacities') surfaceCementingState.view = 'chooser';
        renderSurfaceCementingScreen();
      };
    }

    // Unit toggle
    const toggle = slot.querySelector('#surface-unit-toggle');
    if (toggle) {
      toggle.onclick = () => {
        const newUnit = surfaceCementingState.unit === 'ft' ? 'm' : 'ft';
        surfaceCementingState.unit = newUnit;
        savePersistedUnit();
        renderSurfaceCementingScreen();
      };
    }

    // Reset button
    const resetBtn = slot.querySelector('#btn-surface-reset-step');
    if (resetBtn) {
      resetBtn.onclick = () => {
        const sec = surfaceCementingState.section;
        const preset = SURFACE_SECTION_PRESETS[sec];
        if (preset) {
          surfaceCementingState.inputs = { ...preset };
          surfaceCementingState.overrides = {};
          clearSavedCapacityRef(sec);
          renderSurfaceCementingScreen();
          if (typeof showToast === 'function') showToast(t('Reset to section defaults'));
        }
      };
    }
  }

  // View 2: Capacities Table Step
  function renderSurfaceCapacities(container) {
    const inp = surfaceCementingState.inputs;
    const computed = computeSurfaceCapacities(inp, surfaceCementingState.overrides);
    const tubulars = inp.tubulars || {};
    const isConductor = inp.model === 'conductor';
    const isCustom = surfaceCementingState.section === 'custom';
    const activeCapUnit = surfaceCementingState.capUnit || 'BBL/FT';

    const csgOptions = window.CementingCommon.getCasingOptions(isCustom ? (inp.custom_csg_od || 13.375) : (computed.csg?.od_in || 30.0));
    const dpOptions = isConductor ? window.CementingCommon.getDrillPipeOptions() : [];
    const prevCsgOptions = (!isConductor) ? window.CementingCommon.getCasingOptions(isCustom ? (inp.custom_prev_csg_od || 20.0) : (computed.prevCsg?.od_in || 30.0)) : [];
    const holeOptions = window.CementingCommon.getHoleOptions(isCustom ? 'custom' : surfaceCementingState.section);

    let rows = [];

    // Row 1: Casing Capacity
    rows.push({
      key: 'cap_csg',
      title: isConductor ? 'Conductor Casing' : 'Casing Capacity',
      sub: computed.labels.csg_label,
      sourceField: 'csg_id',
      selectedId: tubulars.csg_id || csgOptions[0]?.id,
      options: csgOptions,
      val: computed.effective.cap_csg,
      tableVal: computed.tableVals.cap_csg,
      isReadOnly: false
    });

    // Row 2: Conductor -> Inner String (DP); Surface-casing -> Cased Annulus
    if (isConductor) {
      rows.push({
        key: 'cap_dp',
        title: 'Inner String',
        sub: computed.labels.dp_label,
        sourceField: 'dp_id',
        selectedId: tubulars.dp_id || dpOptions[0]?.id,
        options: dpOptions,
        val: computed.effective.cap_dp,
        tableVal: computed.tableVals.cap_dp,
        isReadOnly: false
      });
    } else {
      rows.push({
        key: 'cap_ann_c',
        title: 'Cased Annulus',
        sub: `${computed.labels.prev_csg_label} × ${computed.labels.csg_label}`,
        sourceField: 'prev_csg_id',
        selectedId: tubulars.prev_csg_id || prevCsgOptions[0]?.id,
        options: prevCsgOptions,
        val: computed.effective.cap_ann_c,
        tableVal: computed.tableVals.cap_ann_c,
        isReadOnly: false
      });
    }

    // Row 3: Open Hole Annulus
    rows.push({
      key: 'cap_ann_oh',
      title: 'Open Hole Annulus',
      sub: `${computed.labels.oh_label} × ${computed.labels.csg_label}`,
      sourceField: 'hole_id',
      selectedId: tubulars.hole_id || holeOptions[0]?.id,
      options: holeOptions,
      val: computed.effective.cap_ann_oh,
      tableVal: computed.tableVals.cap_ann_oh,
      isReadOnly: false
    });

    // Row 4: Open Hole Rathole
    rows.push({
      key: 'cap_oh',
      title: 'Open Hole Rathole',
      sub: computed.labels.oh_label,
      selectedId: tubulars.hole_id,
      options: [],
      val: computed.effective.cap_oh,
      tableVal: computed.tableVals.cap_oh,
      isReadOnly: true
    });

    container.innerHTML = `
      <div class="cement-step-wrapper" style="display:flex; flex-direction:column; gap:20px; padding:12px 0 32px;">
        <div class="cement-step-intro">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h2 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin:0 0 2px;">${t('Tubular Capacities')}</h2>
              <p style="font-size:0.8rem; color:var(--text-secondary); margin:0;">${t('Sourced from API Tubular Data with job override support')}</p>
            </div>
            <span class="cement-badge-model">${isConductor ? t('Inner String') : t('Surface Casing')}</span>
          </div>
        </div>

        <!-- Capacities Table Card -->
        <div class="card" style="padding:0; overflow:hidden; border-radius:14px; border:1px solid var(--border-subtle); background:var(--card-bg);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border-subtle); background:var(--bg-subtle-track);">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase;">${t('Capacities & Annular Volumes')}</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <label style="font-size:0.7rem; color:var(--text-secondary); font-weight:600;">${t('UNIT')}:</label>
              <select id="surface-cap-unit-select" class="cement-cap-header-unit-select" style="padding:2px 8px; font-size:0.75rem; border-radius:6px; background:var(--card-bg); border:1px solid var(--border-subtle); color:var(--text-primary); font-weight:600;">
                <option value="BBL/FT" ${activeCapUnit === 'BBL/FT' ? 'selected' : ''}>bbl/ft</option>
                <option value="BBL/M" ${activeCapUnit === 'BBL/M' ? 'selected' : ''}>bbl/m</option>
                <option value="L/M" ${(activeCapUnit === 'L/M' || activeCapUnit === 'LTR/M') ? 'selected' : ''}>L/m</option>
              </select>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="cement-cap-table-simplified" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
              <tbody>
                ${rows.map(r => {
                  const hasOverride = surfaceCementingState.overrides[r.key] !== undefined;
                  const displayVal = window.CementingCommon.formatCapValue(r.val, activeCapUnit);
                  return `
                    <tr style="border-bottom:1px solid var(--border-subtle);">
                      <td style="padding:12px 14px; width:40%;">
                        <div style="font-weight:700; color:var(--text-primary); font-size:0.88rem;">${t(r.title)}</div>
                        <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${escapeHtml(r.sub)}</div>
                      </td>
                      <td style="padding:12px 10px; width:36%;">
                        ${r.isReadOnly ? `
                          <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600;">${escapeHtml(r.sub)}</span>
                        ` : `
                          <select class="surface-cap-source-select" data-row-key="${r.key}" data-source-field="${r.sourceField}" style="width:100%; padding:6px 8px; font-size:0.75rem; border-radius:8px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); font-weight:600;">
                            ${r.options.map(o => `
                              <option value="${escapeAttr(o.id)}" ${o.id === r.selectedId ? 'selected' : ''}>${escapeHtml(o.label)}</option>
                            `).join('')}
                          </select>
                        `}
                      </td>
                      <td style="padding:12px 14px; width:24%; text-align:right;">
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
                          <input type="text"
                                 class="surface-cap-override-input ${hasOverride ? 'is-overridden' : ''}"
                                 data-row-key="${r.key}"
                                 value="${displayVal}"
                                 inputmode="decimal"
                                 style="width:90px; text-align:right; font-family:'Roboto Mono',monospace; font-weight:700; font-size:0.85rem; padding:4px 6px; border-radius:6px; border:1px solid ${hasOverride ? 'var(--primary)' : 'var(--border-subtle)'}; background:${hasOverride ? 'rgba(var(--primary-rgb), 0.08)' : 'var(--card-bg)'}; color:var(--text-primary);">
                          ${hasOverride ? `
                            <div style="display:flex; align-items:center; gap:4px;">
                              <span style="font-size:0.65rem; color:var(--primary); font-weight:700;">${t('edited')}</span>
                              <button type="button" class="btn-restore-cap" data-row-key="${r.key}" title="${t('Restore API Default')}" style="background:none; border:none; padding:1px; color:var(--text-secondary); cursor:pointer; font-size:0.65rem; text-decoration:underline;">${t('restore')}</button>
                            </div>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Next Action Button -->
        <button type="button" class="btn btn-primary" id="btn-goto-welldata" style="width:100%; padding:14px; font-size:0.95rem; font-weight:700; border-radius:12px;">
          ${t('Continue to Well Data')} &rsaquo;
        </button>
      </div>
    `;

    // Capacity unit switcher
    const unitSelect = container.querySelector('#surface-cap-unit-select');
    if (unitSelect) {
      unitSelect.onchange = () => {
        surfaceCementingState.capUnit = unitSelect.value;
        savePersistedUnit();
        renderSurfaceCapacities(container);
      };
    }

    // Source dropdown change
    container.querySelectorAll('.surface-cap-source-select').forEach(sel => {
      sel.onchange = () => {
        const field = sel.getAttribute('data-source-field');
        const key = sel.getAttribute('data-row-key');
        if (!inp.tubulars) inp.tubulars = {};
        inp.tubulars[field] = sel.value;
        // Clear any manual override on source change to load newly selected tubular
        delete surfaceCementingState.overrides[key];
        renderSurfaceCapacities(container);
      };
    });

    // Override input blur
    container.querySelectorAll('.surface-cap-override-input').forEach(input => {
      input.onchange = () => {
        const key = input.getAttribute('data-row-key');
        const canonicalVal = window.CementingCommon.parseCapValue(input.value, activeCapUnit);
        if (canonicalVal > 0) {
          surfaceCementingState.overrides[key] = canonicalVal;
        } else {
          delete surfaceCementingState.overrides[key];
        }
        renderSurfaceCapacities(container);
      };
    });

    // Restore button
    container.querySelectorAll('.btn-restore-cap').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-row-key');
        delete surfaceCementingState.overrides[key];
        renderSurfaceCapacities(container);
      };
    });

    // Continue to Well Data
    const continueBtn = container.querySelector('#btn-goto-welldata');
    if (continueBtn) {
      continueBtn.onclick = () => {
        surfaceCementingState.view = 'welldata';
        renderSurfaceCementingScreen();
      };
    }
  }

  // View 3: Well Data Form Step
  function renderSurfaceWellData(container) {
    const inp = surfaceCementingState.inputs;
    const isConductor = inp.model === 'conductor';
    const isMetric = surfaceCementingState.unit === 'm';
    const dUnit = isMetric ? 'm' : 'ft';

    // Calculate float collar depth
    const fc = Math.max(0, (Number(inp.shoe) || 0) - (Number(inp.shoe_track_len) || 0));

    container.innerHTML = `
      <div class="cement-step-wrapper" style="display:flex; flex-direction:column; gap:20px; padding:12px 0 40px;">
        <div class="cement-step-intro">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h2 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin:0 0 2px;">${t('Well Data & Fluid Parameters')}</h2>
              <p style="font-size:0.8rem; color:var(--text-secondary); margin:0;">${isConductor ? t('Conductor stab-in geometry & pumping schedule') : t('Surface casing depths, planned TOC & pumping schedule')}</p>
            </div>
            <span class="cement-badge-model">${isConductor ? t('Conductor') : t('Surface Casing')}</span>
          </div>
        </div>

        <form id="surface-welldata-form" style="display:flex; flex-direction:column; gap:16px;">
          <!-- Card: Depths & Geometry -->
          <div class="card" style="padding:16px; border-radius:14px; background:var(--card-bg); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${t('Depths & String Geometry')}</div>

            ${isConductor ? `
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="input-group">
                  <label class="input-label" style="font-size:0.7rem; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">${t('Rig Type')}</label>
                  <select id="field-rig-type" class="form-input" style="padding:10px 12px; font-size:0.9rem; border-radius:10px; min-height:48px; background:var(--card-bg); border:1px solid var(--border-subtle); color:var(--text-primary); font-weight:600;">
                    <option value="jack-up" ${inp.rig_type === 'jack-up' ? 'selected' : ''}>Jack-up</option>
                    <option value="land" ${inp.rig_type === 'land' ? 'selected' : ''}>Land</option>
                  </select>
                </div>
                ${renderFormInput(inp.rig_type === 'land' ? 'Ground Level Depth (RKB)' : 'Seabed Depth (RKB)', 'seabed', formatMetricDepth(inp.seabed, isMetric), dUnit)}
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                ${renderFormInput('Previous Shoe Depth', 'prev_shoe', formatMetricDepth(inp.prev_shoe, isMetric), dUnit)}
                ${renderFormInput('Planned TOC (0 = Surface)', 'planned_toc', formatMetricDepth(inp.planned_toc, isMetric), dUnit)}
              </div>
            `}

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Hole TD', 'td', formatMetricDepth(inp.td, isMetric), dUnit)}
              ${renderFormInput('Casing Shoe Depth', 'shoe', formatMetricDepth(inp.shoe, isMetric), dUnit)}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Shoe Track Length', 'shoe_track_len', formatMetricDist(inp.shoe_track_len, isMetric), dUnit)}
              <div class="input-group">
                <label class="input-label" style="font-size:0.7rem; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">${t('Float Collar (Calculated)')}</label>
                <input type="text" class="form-input" readonly value="${formatMetricDepth(fc, isMetric)} ${dUnit}" style="padding:10px 12px; font-size:0.9rem; border-radius:10px; min-height:48px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); font-family:'Roboto Mono',monospace; font-weight:700;">
              </div>
            </div>
          </div>

          <!-- Card: Drilling Mud & Pre-Flushes -->
          <div class="card" style="padding:16px; border-radius:14px; background:var(--card-bg); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${t('Well Fluids & Pre-Flushes')}</div>

            ${isConductor ? `
              <div style="display:grid; grid-template-columns:${inp.rig_type === 'jack-up' ? '1fr 1fr 1fr' : '1fr 1fr'}; gap:12px;">
                ${inp.rig_type === 'jack-up' ? renderFormInput('Seawater MW', 'seawater_mw', inp.seawater_mw, 'ppg') : ''}
                ${renderFormInput('Hole Fluid MW', 'hole_fluid_mw', inp.hole_fluid_mw, 'ppg')}
                ${renderFormInput('Displacement MW', 'disp_mw', inp.disp_mw, 'ppg')}
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                ${renderFormInput('Well Mud Weight', 'mw', inp.mw, 'ppg')}
                ${renderFormInput('LOT at Prev Shoe', 'lot', inp.lot, 'ppg')}
              </div>
            `}

            <!-- 1st Pumping Mud -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('1st Pumping Mud Vol', 'f1_vol', inp.f1_vol, 'bbl')}
              ${renderFormInput('1st Mud Density', 'f1_mw', inp.f1_mw, 'ppg')}
            </div>

            <!-- 2nd Pumping Mud -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('2nd Pumping Mud Vol', 'f2_vol', inp.f2_vol, 'bbl')}
              ${renderFormInput('2nd Mud Density', 'f2_mw', inp.f2_mw, 'ppg')}
            </div>

            <!-- Spacer -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Spacer Volume', 'sp_vol', inp.sp_vol, 'bbl')}
              ${renderFormInput('Spacer Density', 'sp_mw', inp.sp_mw, 'ppg')}
            </div>
          </div>

          <!-- Card: Cement Slurries -->
          <div class="card" style="padding:16px; border-radius:14px; background:var(--card-bg); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${t('Cement Slurries & Excess')}</div>

            <!-- Lead Slurry -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Lead Slurry Volume', 'lead_vol', inp.lead_vol, 'bbl')}
              ${renderFormInput('Lead Density', 'lead_mw', inp.lead_mw, 'ppg')}
            </div>

            <!-- Tail Slurry -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Tail Slurry Volume', 'tail_vol', inp.tail_vol, 'bbl')}
              ${renderFormInput('Tail Density', 'tail_mw', inp.tail_mw, 'ppg')}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Open Hole Excess', 'excess_pct', inp.excess_pct, '%')}
              ${renderFormInput('Pump Output', 'pump_output', inp.pump_output, 'bbl/stk')}
            </div>
          </div>

          <!-- Card: Ratings & Pressures -->
          <div class="card" style="padding:16px; border-radius:14px; background:var(--card-bg); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${t('Pipe Ratings & Design Pressures')}</div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              ${renderFormInput('Collapse Rating', 'collapse_rating', inp.collapse_rating, 'psi')}
              ${renderFormInput('Burst Rating', 'burst_rating', inp.burst_rating, 'psi')}
            </div>

            ${isConductor ? `
              ${renderFormInput('Max Pump Pressure', 'max_pump_pressure', inp.max_pump_pressure, 'psi')}
            ` : `
              ${renderFormInput('Bump Pressure (above circ)', 'bump', inp.bump, 'psi')}
            `}
          </div>

          <!-- Action Stack -->
          <div class="cement-step-btn-stack" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
            <button type="button" class="btn btn-primary" id="btn-calculate-surface" style="width:100%; padding:14px; font-size:1rem; font-weight:700; border-radius:12px;">
              ${t('Calculate Cement Job')}
            </button>
            <button type="button" class="btn btn-secondary" id="btn-back-to-capacities" style="width:100%; padding:12px; font-size:0.9rem; border-radius:12px;">
              &lsaquo; ${t('Back to Capacities')}
            </button>
          </div>
        </form>
      </div>
    `;

    // Rig type toggle
    const rigSelect = container.querySelector('#field-rig-type');
    if (rigSelect) {
      rigSelect.onchange = () => {
        inp.rig_type = rigSelect.value;
        saveDraftInputs(surfaceCementingState.section, inp);
        renderSurfaceWellData(container);
      };
    }

    // Input handlers
    container.querySelectorAll('.form-input[data-key]').forEach(input => {
      input.oninput = () => {
        const key = input.getAttribute('data-key');
        let raw = input.value.trim().replace(',', '.');
        let numVal = parseFloat(raw);

        if (DEPTH_KEYS.includes(key)) {
          // Convert from metres to ft if unit is metres
          if (isMetric && !isNaN(numVal)) {
            numVal = numVal / M_PER_FT;
          }
        }

        inp[key] = isNaN(numVal) ? 0 : numVal;
        saveDraftInputs(surfaceCementingState.section, inp);

        // Update calculated FC live
        if (key === 'shoe' || key === 'shoe_track_len') {
          const liveFC = Math.max(0, (Number(inp.shoe) || 0) - (Number(inp.shoe_track_len) || 0));
          const fcInput = container.querySelector('input[readonly]');
          if (fcInput) fcInput.value = `${formatMetricDepth(liveFC, isMetric)} ${dUnit}`;
        }
      };
    });

    // Calculate button
    const calcBtn = container.querySelector('#btn-calculate-surface');
    if (calcBtn) {
      calcBtn.onclick = () => {
        executeSurfaceCalculation();
      };
    }

    // Back to Capacities
    const backCapBtn = container.querySelector('#btn-back-to-capacities');
    if (backCapBtn) {
      backCapBtn.onclick = () => {
        surfaceCementingState.view = 'capacities';
        renderSurfaceCementingScreen();
      };
    }
  }

  function renderFormInput(label, key, val, unitLabel) {
    const displayVal = (val !== undefined && val !== null && val !== '') ? val : '0';
    return `
      <div class="input-group" style="display:flex; flex-direction:column; gap:4px;">
        <label class="input-label" style="font-size:0.7rem; color:var(--text-secondary); font-weight:600; text-transform:uppercase;">
          ${t(label)} ${unitLabel ? `(${unitLabel})` : ''}
        </label>
        <input type="text"
               class="form-input"
               data-key="${key}"
               value="${displayVal}"
               inputmode="decimal"
               style="padding:10px 12px; font-size:0.9rem; border-radius:10px; min-height:48px; background:var(--card-bg); border:1px solid var(--border-subtle); color:var(--text-primary); font-family:'Roboto Mono',monospace; font-weight:600;">
      </div>
    `;
  }

  // Execution Engine Bridge
  function executeSurfaceCalculation() {
    const inp = surfaceCementingState.inputs;
    const computed = computeSurfaceCapacities(inp, surfaceCementingState.overrides);
    const eff = computed.effective;

    let res = null;

    if (inp.model === 'conductor') {
      const engineInput = {
        rig_type: inp.rig_type || 'jack-up',
        seabed: Number(inp.seabed) || 0,
        td: Number(inp.td) || 0,
        shoe: Number(inp.shoe) || 0,
        shoe_track_len: Number(inp.shoe_track_len) || 0,
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
        prev_shoe: Number(inp.prev_shoe) || 0,
        td: Number(inp.td) || 0,
        shoe: Number(inp.shoe) || 0,
        shoe_track_len: Number(inp.shoe_track_len) || 0,
        planned_toc: Number(inp.planned_toc) || 0,
        mw: Number(inp.mw) || 0,
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
      // Scroll to top of results
      const scroller = document.querySelector('#screen-cement-planner-surface .scroller');
      if (scroller) scroller.scrollTop = 0;
    } else {
      if (typeof showToast === 'function') showToast(t('Calculation error: Engine unavailable'));
    }
  }

  // View 4: Results Step
  function renderSurfaceResults(container) {
    const res = surfaceCementingState.results;
    const inp = surfaceCementingState.inputs;
    if (!res) {
      surfaceCementingState.view = 'welldata';
      renderSurfaceWellData(container);
      return;
    }

    const isConductor = res.model === 'surface_conductor';
    const isMetric = surfaceCementingState.unit === 'm';
    const dUnit = isMetric ? 'm' : 'ft';

    const returnsVol = isConductor ? (res.cement_returns_seabed || 0) : (res.cement_returns_surface || 0);
    const returnsLabel = isConductor ? (inp.rig_type === 'land' ? t('Returns at Ground Level') : t('Returns at Seabed')) : t('Returns at Surface');

    container.innerHTML = `
      <div class="cement-step-wrapper" style="display:flex; flex-direction:column; gap:16px; padding:8px 0 40px;">
        <!-- Echo Summary Banner -->
        <div class="card" style="padding:14px 16px; border-radius:14px; background:var(--card-bg); border:1px solid var(--border-subtle); display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; text-align:center;">
          <div>
            <div style="font-size:0.68rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${t('Shoe')}</div>
            <div style="font-size:1rem; font-weight:700; color:var(--text-primary); font-family:'Roboto Mono',monospace;">${formatMetricDepth(inp.shoe, isMetric)}<span style="font-size:0.75rem; font-weight:500;"> ${dUnit}</span></div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${t('Total Slurry')}</div>
            <div style="font-size:1rem; font-weight:700; color:var(--primary); font-family:'Roboto Mono',monospace;">${res.total_slurry.toFixed(1)}<span style="font-size:0.75rem; font-weight:500;"> bbl</span></div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${t('Total Pumped')}</div>
            <div style="font-size:1rem; font-weight:700; color:var(--text-primary); font-family:'Roboto Mono',monospace;">${res.total_pumped.toFixed(1)}<span style="font-size:0.75rem; font-weight:500;"> bbl</span></div>
          </div>
          <div>
            <div style="font-size:0.68rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">${t('EMW at Shoe')}</div>
            <div style="font-size:1rem; font-weight:700; color:var(--text-primary); font-family:'Roboto Mono',monospace;">${res.emw_shoe.toFixed(2)}<span style="font-size:0.75rem; font-weight:500;"> ppg</span></div>
          </div>
        </div>

        <!-- Output Card 1: Placement & Cement Rise -->
        <div class="cement-accordion open" id="card-placement">
          <div class="cement-accordion-header">
            <span class="cement-accordion-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              ${t('Placement & Cement Rise')}
            </span>
            <span class="cement-chevron">▼</span>
          </div>
          <div class="cement-accordion-body">
            <div class="cement-metrics-grid">
              ${renderResultMetric('Tail Slurry Top', `${formatMetricDepth(res.tail_top, isMetric)} ${dUnit}`)}
              ${renderResultMetric('Tail Rise in Annulus', `${formatMetricDist(res.rise_tail, isMetric)} ${dUnit}`)}
              ${renderResultMetric('Top of Cement (TOC)', `${formatMetricDepth(res.toc, isMetric)} ${dUnit}`)}
              ${renderResultMetric('Total Cement Rise', `${formatMetricDist(res.rise_tot, isMetric)} ${dUnit}`)}
              ${res.rise_sp > 0 ? `
                ${renderResultMetric('Spacer Top', `${formatMetricDepth(res.sp_top, isMetric)} ${dUnit}`)}
                ${renderResultMetric('Spacer Rise', `${formatMetricDist(res.rise_sp, isMetric)} ${dUnit}`)}
              ` : ''}
              ${renderResultMetric(returnsLabel, `${returnsVol.toFixed(1)} bbl`)}
              ${renderResultMetric('All Fluids Returned', `${(res.all_fluids_returned || 0).toFixed(1)} bbl`)}
            </div>
          </div>
        </div>

        <!-- Output Card 2: Displacement & Pumping Sequence -->
        <div class="cement-accordion open" id="card-displacement">
          <div class="cement-accordion-header">
            <span class="cement-accordion-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              ${t('Displacement & Pumping Sequence')}
            </span>
            <span class="cement-chevron">▼</span>
          </div>
          <div class="cement-accordion-body">
            <div class="cement-metrics-grid">
              ${renderResultMetric('Displacement Volume', `${res.disp_tot.toFixed(1)} bbl`)}
              ${renderResultMetric('Pump Strokes', `${res.strokes.toFixed(1)} stk`)}
              ${!isConductor ? `
                ${renderResultMetric('Max Disp (no bump)', `${(res.max_disp_no_bump || 0).toFixed(1)} bbl`)}
                ${renderResultMetric('Bottom Plug Lands', `${(res.bottom_plug_lands || 0).toFixed(1)} bbl`)}
              ` : ''}
            </div>
            ${isConductor ? `
              <div style="padding:10px 12px; margin-bottom:12px; background:rgba(var(--primary-rgb), 0.08); border-radius:10px; font-size:0.8rem; color:var(--text-primary);">
                <strong>${t('Stab-in Advisory')}:</strong> ${t('Do not over-displace inner string; check floats; pull out of stab-in shoe.')}
              </div>
            ` : ''}
            ${window.CementingCommon.renderPumpingSequenceTable(res.pumping_sequence, res.total_pumped, surfaceCementingState.unit)}
          </div>
        </div>

        <!-- Output Card 3: Pressures & EMW -->
        <div class="cement-accordion open" id="card-pressures">
          <div class="cement-accordion-header">
            <span class="cement-accordion-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              ${t('Pressures & EMW (Static, End of Job)')}
            </span>
            <span class="cement-chevron">▼</span>
          </div>
          <div class="cement-accordion-body">
            <div class="cement-metrics-grid">
              ${renderResultMetric('P_ann at Float Collar', `${res.p_ann_fc.toFixed(0)} psi`)}
              ${renderResultMetric('P_in at Float Collar', `${res.p_in_fc.toFixed(0)} psi`)}
              ${renderResultMetric('Differential Pressure', `${res.diff_press.toFixed(0)} psi`)}
              ${renderResultMetric('U-Tube Risk', res.diff_meaning, res.diff_press > 0 ? 'var(--warning)' : 'var(--text-primary)')}
              ${renderResultMetric('P_ann at Shoe', `${res.p_ann_shoe.toFixed(0)} psi`)}
              ${renderResultMetric('EMW at Shoe', `${res.emw_shoe.toFixed(2)} ppg`)}
              ${renderResultMetric('EMW at Float Collar', `${res.emw_fc.toFixed(2)} ppg`)}
              ${res.emw_prev_shoe !== undefined ? renderResultMetric('EMW at Prev Shoe', `${res.emw_prev_shoe.toFixed(2)} ppg`) : ''}
              ${res.lot_margin !== undefined ? `
                ${renderResultMetric('LOT Margin', `${res.lot_margin >= 0 ? '+' : ''}${res.lot_margin.toFixed(2)} ppg`, res.lot_margin >= 0 ? 'var(--success)' : 'var(--danger)')}
                ${renderResultMetric('Bump Pressure', `${(res.bump_pressure || 0).toFixed(0)} psi`)}
              ` : ''}
              ${renderResultMetric('Collapse Differential', `${res.p_col.toFixed(0)} psi`)}
              ${renderResultMetric('Collapse Safety Factor', `${res.collapse_sf >= 900 ? 'No load' : res.collapse_sf.toFixed(2)}`, res.collapse_sf >= 1.1 ? 'var(--success)' : 'var(--danger)')}
            </div>
          </div>
        </div>

        <!-- Output Card 4: Job Checks -->
        <div class="cement-accordion open" id="card-checks">
          <div class="cement-accordion-header">
            <span class="cement-accordion-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              ${t('Job Checks')}
            </span>
            <span class="cement-chevron">▼</span>
          </div>
          <div class="cement-accordion-body">
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${(res.checks || []).map(chk => `
                <div class="cement-check-item" style="display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:10px; background:${chk.status === 'OK' ? 'rgba(var(--success-rgb, 16, 185, 129), 0.08)' : 'rgba(var(--danger-rgb, 239, 68, 68), 0.08)'}; border:1px solid ${chk.status === 'OK' ? 'rgba(var(--success-rgb, 16, 185, 129), 0.25)' : 'rgba(var(--danger-rgb, 239, 68, 68), 0.25)'};">
                  <span class="cement-check-chip ${chk.status === 'OK' ? 'status-ok' : 'status-check'}" style="font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:6px; color:#fff; background:${chk.status === 'OK' ? '#10B981' : '#EF4444'}; flex-shrink:0;">${chk.status}</span>
                  <div style="font-size:0.85rem; color:var(--text-primary); line-height:1.4;">
                    <strong>${t(chk.label)}:</strong> ${escapeHtml(chk.message)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Output Card 5: Live Well Cementing Schematic -->
        <div class="cement-accordion open" id="card-schematic">
          <div class="cement-accordion-header">
            <span class="cement-accordion-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              ${t('Live Well Cementing Schematic')}
            </span>
            <span class="cement-chevron">▼</span>
          </div>
          <div class="cement-accordion-body">
            <div class="schematic-toolbar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span class="schematic-helper-text" style="font-size:0.75rem; color:var(--text-secondary);">${t('Vertical profile to TD · scaled strictly 0 to TD')}</span>
              <div class="schematic-toolbar-actions" style="display:flex; align-items:center; gap:6px;">
                <button type="button" class="schematic-tb-btn" id="btn-surface-zoom-out" title="${t('Zoom Out')}" style="padding:6px; border-radius:6px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button type="button" class="schematic-tb-btn schematic-zoom-reset" id="btn-surface-zoom-reset" title="${t('Fit / Reset')}" style="padding:4px 10px; font-size:0.75rem; font-weight:700; border-radius:6px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">100%</button>
                <button type="button" class="schematic-tb-btn" id="btn-surface-zoom-in" title="${t('Zoom In')}" style="padding:6px; border-radius:6px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button type="button" class="schematic-tb-btn" id="btn-surface-fullscreen" title="${t('Full Screen')}" style="padding:6px; border-radius:6px; background:var(--bg-subtle-track); border:1px solid var(--border-subtle); color:var(--text-primary); cursor:pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                </button>
              </div>
            </div>
            <div class="cement-schematic-viewport" id="surface-schematic-viewport" style="overflow:hidden; border-radius:10px; border:1px solid var(--border-subtle); background:#FAF8F5; position:relative; min-height:480px;">
              <div class="cement-schematic-canvas" id="surface-schematic-canvas" style="transform-origin:top center; width:100%;">
                ${renderSurfaceSchematicSvg(res, inp, surfaceCementingState.unit)}
              </div>
            </div>
            <div class="cement-layer-tooltip" id="surface-layer-tooltip" style="display:none; margin-top:10px; padding:8px 12px; background:var(--card-bg); border:1px solid var(--border-subtle); border-radius:8px; font-size:0.8rem;"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="cement-step-btn-stack" style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
          <button type="button" class="btn btn-primary" id="btn-surface-save-job" style="width:100%; padding:14px; font-size:1rem; font-weight:700; border-radius:12px;">
            ${t('Save Job')}
          </button>
          <button type="button" class="btn btn-secondary" id="btn-surface-edit-data" style="width:100%; padding:12px; font-size:0.9rem; border-radius:12px;">
            ${t('Edit Well Data')}
          </button>
        </div>
      </div>
    `;

    // Initialize Schematic Zoom/Pan Viewer
    const viewportEl = container.querySelector('#surface-schematic-viewport');
    const canvasEl = container.querySelector('#surface-schematic-canvas');
    const controls = {
      zoomOutBtn: container.querySelector('#btn-surface-zoom-out'),
      resetBtn: container.querySelector('#btn-surface-zoom-reset'),
      zoomInBtn: container.querySelector('#btn-surface-zoom-in')
    };

    window.CementingCommon.createSchematicViewer(viewportEl, canvasEl, controls);

    // Fullscreen schematic
    const fsBtn = container.querySelector('#btn-surface-fullscreen');
    if (fsBtn) {
      fsBtn.onclick = () => {
        const svgMarkup = renderSurfaceSchematicSvg(res, inp, surfaceCementingState.unit);
        window.CementingCommon.openSchematicFullscreenModal(svgMarkup, surfaceCementingState.jobName || 'Surface Wellhead', isConductor ? 'Conductor Profile' : 'Surface Casing Profile');
      };
    }

    // Layer click tooltips
    window.CementingCommon.bindSchematicLayerClicks(container);

    // Accordions toggle
    container.querySelectorAll('.cement-accordion-header').forEach(header => {
      header.onclick = () => {
        const card = header.closest('.cement-accordion');
        if (card) {
          card.classList.toggle('open');
        }
      };
    });

    // Save job button
    const saveBtn = container.querySelector('#btn-surface-save-job');
    if (saveBtn) {
      saveBtn.onclick = () => {
        promptSaveJob();
      };
    }

    // Edit well data button
    const editBtn = container.querySelector('#btn-surface-edit-data');
    if (editBtn) {
      editBtn.onclick = () => {
        surfaceCementingState.view = 'welldata';
        renderSurfaceCementingScreen();
      };
    }
  }

  function renderResultMetric(label, val, valColor) {
    return `
      <div class="cement-metric-box">
        <div class="cement-metric-label">${t(label)}</div>
        <div class="cement-metric-val" style="${valColor ? `color:${valColor};` : ''}">${escapeHtml(val)}</div>
      </div>
    `;
  }

  function promptSaveJob() {
    const currentName = surfaceCementingState.jobName || SURFACE_SECTION_PRESETS[surfaceCementingState.section]?.name || 'Surface Wellhead Job';
    const name = prompt(t('Enter a name for this job:'), currentName);
    if (!name) return;

    const list = getSavedJobsList();
    const jobId = 'job_' + Date.now();
    const newJob = {
      id: jobId,
      name,
      label: name,
      section: surfaceCementingState.section,
      model: surfaceCementingState.inputs.model,
      inputs: { ...surfaceCementingState.inputs },
      overrides: { ...surfaceCementingState.overrides },
      unit: surfaceCementingState.unit,
      updatedAt: Date.now()
    };

    list.unshift(newJob);
    saveJobsList(list);
    surfaceCementingState.jobName = name;
    if (typeof showToast === 'function') showToast(t('Job saved successfully'));
  }

  // SVG Well Cementing Schematic Renderer for Surface Wellhead
  function renderSurfaceSchematicSvg(res, inp, unit) {
    const isMetric = unit === 'm';
    const isConductor = res.model === 'surface_conductor';
    const isJackUp = inp.rig_type === 'jack-up';

    const tdFt = Math.max(10, Number(inp.td) || 0);
    const shoeFt = Math.max(0, Number(inp.shoe) || 0);
    const fcFt = Math.max(0, res.fc || 0);
    const prevShoeFt = isConductor ? 0 : Math.max(0, Number(inp.prev_shoe) || 0);
    const seabedFt = isConductor ? Math.max(0, Number(inp.seabed) || 0) : 0;

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
    function fmtH(val) {
      return formatMetricDist(val, isMetric) + ' ' + (isMetric ? 'm' : 'ft');
    }

    let svg = `<svg viewBox="-20 0 540 800" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#FAF8F5; border-radius:12px; font-family:'Outfit',sans-serif;">`;

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
        // Seawater band
        svg += `
          <rect x="120" y="${y0}" width="260" height="${ySeabed - y0}" fill="url(#surf-water-grad)" stroke="#0284C7" stroke-width="1" rx="4"/>
          <path d="M 120 ${y0} Q 140 ${y0 - 3}, 160 ${y0} T 200 ${y0} T 240 ${y0} T 280 ${y0} T 320 ${y0} T 360 ${y0} T 380 ${y0}" fill="none" stroke="#0284C7" stroke-width="2"/>
          <text x="130" y="${y0 + 14}" font-size="8.5" font-weight="700" fill="#0369A1" letter-spacing="0.5">${t('SEAWATER (JACK-UP)')}</text>
          <line x1="115" y1="${ySeabed}" x2="385" y2="${ySeabed}" stroke="#786656" stroke-width="2.5"/>
          <text x="125" y="${ySeabed + 12}" font-size="8.5" font-weight="700" fill="#786656">${t('Seabed')}</text>
        `;
      } else {
        // Land Air band
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
      const origColor = isConductor ? '#C9D6DF' : '#F2D388';
      const origName = isConductor ? 'Hole Fluid' : 'Well Mud';
      const origMw = isConductor ? inp.hole_fluid_mw : inp.mw;
      svg += `
        <rect class="cement-svg-layer" data-name="${origName}" data-depth="${fmtD(isConductor ? seabedFt : 0)} - ${fmtD(inp.f1_vol > 0 ? res.f1_top : (inp.f2_vol > 0 ? res.f2_top : (inp.sp_vol > 0 ? res.sp_top : res.toc)))}" data-vol="In Hole" data-mw="${origMw} ppg" x="${ohLeft}" y="${annTopY}" width="${annLeftW}" height="${topFluidY - annTopY}" fill="${origColor}" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="${origName}" data-depth="${fmtD(isConductor ? seabedFt : 0)} - ${fmtD(inp.f1_vol > 0 ? res.f1_top : (inp.f2_vol > 0 ? res.f2_top : (inp.sp_vol > 0 ? res.sp_top : res.toc)))}" data-vol="In Hole" data-mw="${origMw} ppg" x="${csgRight}" y="${annTopY}" width="${annRightW}" height="${topFluidY - annTopY}" fill="${origColor}" cursor="pointer"/>
      `;
    }

    // 1st Mud/Wash
    if (inp.f1_vol > 0 && yF2 > yF1) {
      svg += `
        <rect class="cement-svg-layer" data-name="1st Mud Wash" data-depth="${fmtD(res.f1_top)} - ${fmtD(res.f2_top)}" data-vol="${inp.f1_vol} bbl" data-mw="${inp.f1_mw} ppg" x="${ohLeft}" y="${yF1}" width="${annLeftW}" height="${yF2 - yF1}" fill="#E07B39" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="1st Mud Wash" data-depth="${fmtD(res.f1_top)} - ${fmtD(res.f2_top)}" data-vol="${inp.f1_vol} bbl" data-mw="${inp.f1_mw} ppg" x="${csgRight}" y="${yF1}" width="${annRightW}" height="${yF2 - yF1}" fill="#E07B39" cursor="pointer"/>
      `;
    }

    // 2nd Mud/Wash
    if (inp.f2_vol > 0 && ySP > yF2) {
      svg += `
        <rect class="cement-svg-layer" data-name="2nd Mud Wash" data-depth="${fmtD(res.f2_top)} - ${fmtD(res.sp_top)}" data-vol="${inp.f2_vol} bbl" data-mw="${inp.f2_mw} ppg" x="${ohLeft}" y="${yF2}" width="${annLeftW}" height="${ySP - yF2}" fill="#9B59B6" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="2nd Mud Wash" data-depth="${fmtD(res.f2_top)} - ${fmtD(res.sp_top)}" data-vol="${inp.f2_vol} bbl" data-mw="${inp.f2_mw} ppg" x="${csgRight}" y="${yF2}" width="${annRightW}" height="${ySP - yF2}" fill="#9B59B6" cursor="pointer"/>
      `;
    }

    // Spacer
    if (inp.sp_vol > 0 && yTOC > ySP) {
      svg += `
        <rect class="cement-svg-layer" data-name="Spacer" data-depth="${fmtD(res.sp_top)} - ${fmtD(res.toc)}" data-vol="${inp.sp_vol} bbl" data-mw="${inp.sp_mw} ppg" x="${ohLeft}" y="${ySP}" width="${annLeftW}" height="${yTOC - ySP}" fill="#4A90D9" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Spacer" data-depth="${fmtD(res.sp_top)} - ${fmtD(res.toc)}" data-vol="${inp.sp_vol} bbl" data-mw="${inp.sp_mw} ppg" x="${csgRight}" y="${ySP}" width="${annRightW}" height="${yTOC - ySP}" fill="#4A90D9" cursor="pointer"/>
      `;
    }

    // Lead Slurry
    if (inp.lead_vol > 0 && yTail > yTOC) {
      svg += `
        <rect class="cement-svg-layer" data-name="Lead Slurry" data-depth="${fmtD(res.toc)} - ${fmtD(res.tail_top)}" data-vol="${inp.lead_vol} bbl" data-mw="${inp.lead_mw} ppg" x="${ohLeft}" y="${yTOC}" width="${annLeftW}" height="${yTail - yTOC}" fill="#B5D99C" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Lead Slurry" data-depth="${fmtD(res.toc)} - ${fmtD(res.tail_top)}" data-vol="${inp.lead_vol} bbl" data-mw="${inp.lead_mw} ppg" x="${csgRight}" y="${yTOC}" width="${annRightW}" height="${yTail - yTOC}" fill="#B5D99C" cursor="pointer"/>
      `;
    }

    // Tail Slurry (Annulus)
    if (yShoe > yTail) {
      svg += `
        <rect class="cement-svg-layer" data-name="Tail Slurry (Annulus)" data-depth="${fmtD(res.tail_top)} - ${fmtD(inp.shoe)}" data-vol="${inp.tail_vol} bbl" data-mw="${inp.tail_mw} ppg" x="${ohLeft}" y="${yTail}" width="${annLeftW}" height="${yShoe - yTail}" fill="#3E7D3A" cursor="pointer"/>
        <rect class="cement-svg-layer" data-name="Tail Slurry (Annulus)" data-depth="${fmtD(res.tail_top)} - ${fmtD(inp.shoe)}" data-vol="${inp.tail_vol} bbl" data-mw="${inp.tail_mw} ppg" x="${csgRight}" y="${yTail}" width="${annRightW}" height="${yShoe - yTail}" fill="#3E7D3A" cursor="pointer"/>
      `;
    }

    // Rathole Cement (below shoe down to TD)
    if (yTD > yShoe) {
      const ratColor = (inp.tail_vol > 0) ? '#3E7D3A' : '#B5D99C';
      svg += `
        <rect class="cement-svg-layer" data-name="Rathole Cement" data-depth="${fmtD(inp.shoe)} - ${fmtD(inp.td)}" data-vol="${(res.rat_vol || 0).toFixed(1)} bbl" data-mw="${(inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0} ppg" x="${ohLeft}" y="${yShoe}" width="${ohW}" height="${yTD - yShoe}" fill="${ratColor}" opacity="0.9" cursor="pointer"/>
      `;
    }

    // 6. Casing Body & Shoe Track
    // Casing Wall
    svg += `
      <!-- Casing Walls -->
      <rect x="${csgLeft}" y="${y0}" width="4" height="${yShoe - y0}" fill="#1F3864"/>
      <rect x="${csgRight - 4}" y="${y0}" width="4" height="${yShoe - y0}" fill="#1F3864"/>
      <!-- Guide Shoe Block -->
      <rect x="${csgLeft - 2}" y="${yShoe - 8}" width="8" height="8" fill="#151515"/>
      <rect x="${csgRight - 6}" y="${yShoe - 8}" width="8" height="8" fill="#151515"/>
    `;

    // Casing Interior:
    // From surface down to FC:
    if (yFC > y0) {
      if (isConductor) {
        // Conductor has inner string from surface to FC
        svg += `
          <!-- Conductor Interior around DP -->
          <rect x="${csgLeft + 4}" y="${y0}" width="${dpLeft - (csgLeft + 4)}" height="${yFC - y0}" fill="#C9D6DF" opacity="0.5"/>
          <rect x="${dpRight}" y="${y0}" width="${(csgRight - 4) - dpRight}" height="${yFC - y0}" fill="#C9D6DF" opacity="0.5"/>
          <!-- Inner String DP Walls -->
          <rect x="${dpLeft}" y="${y0}" width="2.5" height="${yFC - y0}" fill="#5A6B7D"/>
          <rect x="${dpRight - 2.5}" y="${y0}" width="2.5" height="${yFC - y0}" fill="#5A6B7D"/>
          <!-- Displacement fluid inside string -->
          <rect class="cement-svg-layer" data-name="Displacement Fluid" data-depth="0 - ${fmtD(fcFt)}" data-vol="${res.disp_tot.toFixed(1)} bbl" data-mw="${inp.disp_mw} ppg" x="${dpLeft + 2.5}" y="${y0}" width="${dpW - 5}" height="${yFC - y0}" fill="#38BDF8" cursor="pointer"/>
        `;
      } else {
        // Surface casing interior filled with well mud
        svg += `
          <rect class="cement-svg-layer" data-name="Displacement Mud" data-depth="0 - ${fmtD(fcFt)}" data-vol="${res.disp_tot.toFixed(1)} bbl" data-mw="${inp.mw} ppg" x="${csgLeft + 4}" y="${y0}" width="${csgW - 8}" height="${yFC - y0}" fill="#F2D388" opacity="0.85" cursor="pointer"/>
        `;
      }
    }

    // Shoe Track Cement (between FC and Shoe)
    if (yShoe > yFC) {
      const stColor = (inp.tail_vol > 0) ? '#3E7D3A' : '#B5D99C';
      svg += `
        <!-- Float Collar Plate -->
        <rect x="${csgLeft + 4}" y="${yFC - 3}" width="${csgW - 8}" height="3" fill="#151515"/>
        <rect class="cement-svg-layer" data-name="Shoe Track Cement" data-depth="${fmtD(fcFt)} - ${fmtD(shoeFt)}" data-vol="${(res.st_vol || 0).toFixed(1)} bbl" data-mw="${(inp.tail_vol > 0 ? inp.tail_mw : inp.lead_mw) || 0} ppg" x="${csgLeft + 4}" y="${yFC}" width="${csgW - 8}" height="${yShoe - yFC}" fill="${stColor}" cursor="pointer"/>
      `;
    }

    // Top reference line
    svg += `
      <line x1="110" y1="${y0}" x2="390" y2="${y0}" stroke="#475569" stroke-width="2.5"/>
    `;

    // 7. Depth Markers on the LEFT with right-aligned '►' pointers
    const leftMarkers = [
      { depth: 0, label: 'Surface', y: y0, show: true },
      { depth: seabedFt, label: isJackUp ? 'Seabed' : 'Ground Level', y: ySeabed, show: isConductor && seabedFt > 0 },
      { depth: prevShoeFt, label: 'Prev Shoe', y: yPrevShoe, show: !isConductor && prevShoeFt > 0 },
      { depth: res.f1_top, label: '1st Mud Top', y: yF1, show: inp.f1_vol > 0 && res.f1_top < (isConductor ? seabedFt : 0) },
      { depth: res.f2_top, label: '2nd Mud Top', y: yF2, show: inp.f2_vol > 0 && res.f2_top < res.sp_top },
      { depth: res.sp_top, label: 'Spacer Top', y: ySP, show: inp.sp_vol > 0 && res.sp_top < res.toc },
      { depth: res.toc, label: 'TOC', y: yTOC, show: res.total_slurry > 0 && res.toc > 0 },
      { depth: res.tail_top, label: 'Tail Top', y: yTail, show: inp.tail_vol > 0 && res.tail_top < shoeFt },
      { depth: fcFt, label: 'Float Collar', y: yFC, show: fcFt > 0 },
      { depth: shoeFt, label: 'Casing Shoe', y: yShoe, show: shoeFt > 0 },
      { depth: tdFt, label: 'TD', y: yTD, show: tdFt > 0 }
    ].filter(m => m.show);

    // Render left depth markers
    leftMarkers.forEach(m => {
      svg += `
        <g class="depth-marker-left">
          <polygon points="${ohLeft - 2},${m.y} ${ohLeft - 7},${m.y - 3.5} ${ohLeft - 7},${m.y + 3.5}" fill="#334155"/>
          <text x="${ohLeft - 10}" y="${m.y + 3.5}" font-size="8.5" font-weight="700" fill="#334155" text-anchor="end">${m.label} ${fmtD(m.depth)}</text>
        </g>
      `;
    });

    // 8. Height Arrows on the RIGHT
    const rightArrows = [];
    if (inp.tail_vol > 0 && res.rise_tail > 0) {
      rightArrows.push({
        yTop: yTail,
        yBot: yShoe,
        label: `Tail ${fmtH(res.rise_tail)} (${inp.tail_mw} ppg)`,
        color: '#3E7D3A'
      });
    }
    if (inp.lead_vol > 0 && res.rise_lead > 0) {
      rightArrows.push({
        yTop: yTOC,
        yBot: yTail,
        label: `Lead ${fmtH(res.rise_lead)} (${inp.lead_mw} ppg)`,
        color: '#64748B'
      });
    }
    if (inp.sp_vol > 0 && res.rise_sp > 0) {
      rightArrows.push({
        yTop: ySP,
        yBot: yTOC,
        label: `Spacer ${fmtH(res.rise_sp)} (${inp.sp_mw} ppg)`,
        color: '#0284C7'
      });
    }

    rightArrows.forEach((arr, i) => {
      const arrX = ohRight + 12 + (i * 2);
      const midY = (arr.yTop + arr.yBot) / 2;
      svg += `
        <g class="height-arrow-right">
          <line x1="${ohRight + 4}" y1="${arr.yTop}" x2="${arrX + 6}" y2="${arr.yTop}" stroke="${arr.color}" stroke-dasharray="2,2" stroke-width="0.8"/>
          <line x1="${ohRight + 4}" y1="${arr.yBot}" x2="${arrX + 6}" y2="${arr.yBot}" stroke="${arr.color}" stroke-dasharray="2,2" stroke-width="0.8"/>
          <line x1="${arrX}" y1="${arr.yTop}" x2="${arrX}" y2="${arr.yBot}" stroke="${arr.color}" stroke-width="1.5"/>
          <polygon points="${arrX},${arr.yTop} ${arrX - 3},${arr.yTop + 5} ${arrX + 3},${arr.yTop + 5}" fill="${arr.color}"/>
          <polygon points="${arrX},${arr.yBot} ${arrX - 3},${arr.yBot - 5} ${arrX + 3},${arr.yBot - 5}" fill="${arr.color}"/>
          <text x="${arrX + 8}" y="${midY + 3}" font-size="8.5" font-weight="700" fill="${arr.color}">${arr.label}</text>
        </g>
      `;
    });

    svg += `</svg>`;
    return svg;
  }

  // Public exports
  root.surfaceCementingState = surfaceCementingState;
  root.SURFACE_SECTION_PRESETS = SURFACE_SECTION_PRESETS;
  root.renderSurfaceCementingScreen = renderSurfaceCementingScreen;
  root.openSurfaceCementingModule = openSurfaceCementingModule;
  root.selectSurfaceSection = selectSection;
  root.surfaceGoToView = surfaceGoToView;
  root.calculateSurfaceCementing = executeSurfaceCalculation;
  root.renderSurfaceSchematicSvg = renderSurfaceSchematicSvg;
  root.promptSaveJob = promptSaveJob;
  root.loadSavedJob = loadSavedJob;
  root.computeSurfaceCapacities = computeSurfaceCapacities;

  if (typeof window !== 'undefined') {
    window.surfaceCementingState = surfaceCementingState;
    window.SURFACE_SECTION_PRESETS = SURFACE_SECTION_PRESETS;
    window.renderSurfaceCementingScreen = renderSurfaceCementingScreen;
    window.openSurfaceCementingModule = openSurfaceCementingModule;
    window.selectSurfaceSection = selectSection;
    window.surfaceGoToView = surfaceGoToView;
    window.calculateSurfaceCementing = executeSurfaceCalculation;
    window.renderSurfaceSchematicSvg = renderSurfaceSchematicSvg;
    window.promptSaveJob = promptSaveJob;
    window.loadSavedJob = loadSavedJob;
    window.computeSurfaceCapacities = computeSurfaceCapacities;
  }

})(typeof window !== 'undefined' ? window : this);
