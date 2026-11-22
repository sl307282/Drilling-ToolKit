// Global Emergency Error Handler to ensure the splash screen is ALWAYS hidden if a crash occurs
window.addEventListener('error', (event) => {
  try {
    console.log('CRITICAL UNHANDLED ERROR:', event.message, 'at', event.filename, ':', event.lineno);
    if (event.error && event.error.stack) {
      console.log('ERROR STACK:', event.error.stack);
    }
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      window.Capacitor.Plugins.SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => { });
    }
  } catch (e) { }
});

// Global translation helper
const t = (key, fallback) => (typeof window !== 'undefined' && window.I18n ? window.I18n.translate(key) : null) || fallback || key;

// Safe JSON parser to prevent startup crashes from malformed localStorage data
function safeJSONParse(str, fallback) {
  try {
    if (!str) return fallback;
    const parsed = JSON.parse(str);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.error('Failed to parse JSON string:', str, e);
    return fallback;
  }
}

// Master Database State
const DB = {
  pipeData: {
    DP: {
      "2-3/8": { capacity: 1.66, openEndDisplacement: 1.35, closedEndDisplacement: 3.01 },
      "2-7/8": { capacity: 2.33, openEndDisplacement: 2.10, closedEndDisplacement: 4.43 },
      "3-1/2": { capacity: 3.82, openEndDisplacement: 2.79, closedEndDisplacement: 6.61 },
      "4-1/2": { capacity: 7.50, openEndDisplacement: 3.60, closedEndDisplacement: 11.10 },
      "5": { capacity: 9.05, openEndDisplacement: 4.19, closedEndDisplacement: 13.24 },
      "5-1/2": { capacity: 11.20, openEndDisplacement: 5.10, closedEndDisplacement: 16.30 },
      "6-6/8": { capacity: 15.20, openEndDisplacement: 6.80, closedEndDisplacement: 22.00 } // Fallback for 6-5/8
    },
    HWDP: {
      "3-1/2": { capacity: 2.19, openEndDisplacement: 4.81, closedEndDisplacement: 7.00 },
      "4-1/2": { capacity: 3.80, openEndDisplacement: 7.20, closedEndDisplacement: 11.00 },
      "5": { capacity: 4.60, openEndDisplacement: 9.35, closedEndDisplacement: 13.95 },
      "5-1/2": { capacity: 5.40, openEndDisplacement: 10.20, closedEndDisplacement: 15.60 },
      "6-5/8": { capacity: 7.10, openEndDisplacement: 12.50, closedEndDisplacement: 19.60 }
    },
    DC: {
      "3-1/2": { capacity: 2.10, openEndDisplacement: 5.20, closedEndDisplacement: 7.30 },
      "4-3/4": { capacity: 2.56, openEndDisplacement: 8.86, closedEndDisplacement: 11.43 },
      "6-1/2": { capacity: 4.01, openEndDisplacement: 17.40, closedEndDisplacement: 21.41 },
      "6-3/4": { capacity: 3.80, openEndDisplacement: 18.50, closedEndDisplacement: 22.30 },
      "8": { capacity: 4.01, openEndDisplacement: 28.42, closedEndDisplacement: 32.43 },
      "9-1/2": { capacity: 4.56, openEndDisplacement: 41.17, closedEndDisplacement: 45.73 }
    },
    RISER: { capacity: 202.76 },
    "CHOKE LINE": { capacity: 3.167 }
  },
  openHoleVolumes: {
    "36": { "5_DP": 643.56, "5_HWDP": 642.85, "6-1/2_DC": 635.39, "8_DC": 624.37, "9-1/2_DC": 611.04 },
    "26": { "5_DP": 329.10, "5_HWDP": 328.71, "6-1/2_DC": 321.90, "8_DC": 310.07, "9-1/2_DC": 296.77 },
    "17.5": { "5_DP": 141.25, "5_HWDP": 141.25, "6-1/2_DC": 133.79, "8_DC": 122.77, "9-1/2_DC": 109.47 },
    "12.25": { "5_DP": 62.10, "5_HWDP": 62.10, "6-1/2_DC": 54.60, "8_DC": 43.61, "9-1/2_DC": 30.31 },
    "8.5": { "5_DP": 23.37, "5_HWDP": 22.66, "6-1/2_DC": 15.20 }
  },
  casingVolumes: {
    "30": { "5_DP": 383.70, "5_HWDP": 383.05, "6-1/2_DC": 375.59, "8_DC": 364.57, "9-1/2_DC": 351.27 },
    "20": { "5_DP": 164.50, "5_HWDP": 163.81, "6-1/2_DC": 156.35, "8_DC": 145.33, "9-1/2_DC": 132.03 },
    "13.375": { "5_DP": 66.13, "5_HWDP": 65.42, "6-1/2_DC": 57.96, "8_DC": 46.94, "9-1/2_DC": 33.64 },
    "9.625": { "5_DP": 24.95, "5_HWDP": 24.24, "6-1/2_DC": 16.78 },
    "RISER": { "5_DP": 189.52 }
  },
  holeToPreviousCasing: {
    "26": "30",
    "17.5": "20",
    "12.25": "13.375",
    "8.5": "9.625",
    "6": "7"
  },
  pump: {
    efficiency: 100,
    output: 18.69
  }
};

// Application State
let state = {
  currentScreen: 'dashboard',
  screenHistory: [],
  globalUnit: (window.UnitsEngine ? window.UnitsEngine.getUnit('capacity') : (localStorage.getItem('globalUnit') || 'L/m')), // L/m, bbl/m, bbl/ft
  flowType: 'surface', // surface, subsea, or other modules
  
  openedFromHomeSearch: false,
  savedHomeSearchQuery: '',

  // IADC Dull Grading state
  editingIADCRecordId: null,
  currentDullPhotoBase64: null,
  iadcCardVisible: false,

  // Drilling Guide state
  selectedGuideId: null,
  selectedGuideCategory: null,

  // Selection State
  selectedHoleSize: localStorage.getItem('selectedHoleSize') || '17.5',
  customHoleSize: '',

  drillstring: safeJSONParse(localStorage.getItem('drillstringSetup'), {
    dcType: '1',
    dcSize: '6-1/2',
    dcSize2: '6-1/2',
    dcSize3: '6-1/2',
    hwdpSize: '5',
    dpType: '1',
    dpSize: '5',
    dpSize2: '5',
    dpSize3: '5'
  }),

  // Reference Values (pulled from DB, editable in Screen 3)
  reference: (() => {
    const defaults = {
      capacities: {
        DP: 9.05, DP2: 9.05, DP3: 9.05,
        HWDP: 4.60,
        DC: 4.01, DC2: 4.01, DC3: 4.01
      },
      openHoleAnnular: {
        DP: 141.25, DP2: 141.25, DP3: 141.25,
        HWDP: 141.25,
        DC: 133.79, DC2: 133.79, DC3: 133.79
      },
      casingAnnular: {
        DP: 164.50, DP2: 164.50, DP3: 164.50,
        HWDP: 163.81,
        DC: 156.35, DC2: 156.35, DC3: 156.35
      },
      riserAnnular: 189.52,
      chokeCapacity: 3.167,
      pumpOutput: 18.69,
      pumpEfficiency: 100
    };
    const saved = safeJSONParse(localStorage.getItem('drillingToolkitReferences'), defaults);

    // Ensure subsea fields always exist even on old localStorage data
    if (saved.riserAnnular === undefined || saved.riserAnnular === null) saved.riserAnnular = defaults.riserAnnular;
    if (saved.chokeCapacity === undefined || saved.chokeCapacity === null) saved.chokeCapacity = defaults.chokeCapacity;
    if (!saved.capacities) saved.capacities = defaults.capacities;
    if (!saved.openHoleAnnular) saved.openHoleAnnular = defaults.openHoleAnnular;
    if (!saved.casingAnnular) saved.casingAnnular = defaults.casingAnnular;
    if (saved.pumpOutput === undefined) saved.pumpOutput = defaults.pumpOutput;
    if (saved.pumpEfficiency === undefined) saved.pumpEfficiency = 100;
    return saved;
  })(),

  // Design and Calculation inputs
  calcInputs: safeJSONParse(localStorage.getItem('calcInputs'), {
    wellType: 'vertical', // vertical, horizontal
    holeMD: '',
    holeTVD: '',
    shoeMD: '',
    shoeTVD: '',
    dcLength: '',
    dcLength2: '',
    dcLength3: '',
    hwdpLength: '',
    dpLength: '',
    dpLength2: '',
    dpLength3: '',
    dpLengthOverride: false,

    // Subsea inputs
    riserLength: '',
    bopStatus: 'open', // open, closed
    chokeLength: ''
  }),

  searchQuery: ''
};

// Internal in-page sub-states
let tubularSubState = {
  view: 'menu',
  selections: {
    connection: '',
    od: '',
    od_inch: '',
    grade: '',
    weight: '',
    nominal_weight_lbs_ft: '',
    class: ''
  }
};

let calcSubState = {
  view: 'categories',
  section: 'drilling',
  category: 'calculations',
  search: '',
  formulaId: ''
};

let quickRefSubState = {
  view: 'menu',
  wellheadTab: 'A',
  subseaTab: 'overview'
};

let wellControlSubState = {
  view: 'menu',
  category: null,
  formulaId: null
};

// Conversions Logic Helpers
// Base data is stored in L/m. All conversions are performed on-the-fly.
const convertCapacity = (valLPerM, targetUnit) => {
  if (targetUnit === 'bbl/m') {
    return valLPerM / 158.987;
  } else if (targetUnit === 'bbl/ft') {
    return valLPerM / 158.987 / 3.28084;
  }
  return valLPerM; // L/m
};

const convertCapacityBack = (valConverted, currentUnit) => {
  if (currentUnit === 'bbl/m') {
    return valConverted * 158.987;
  } else if (currentUnit === 'bbl/ft') {
    return valConverted * 158.987 * 3.28084;
  }
  return valConverted; // L/m
};

const convertLength = (valMeters, targetUnit) => {
  if (targetUnit === 'bbl/ft') {
    return valMeters * 3.28084; // Meters to Feet
  }
  return valMeters;
};

const convertLengthBack = (valConverted, currentUnit) => {
  if (currentUnit === 'bbl/ft') {
    return valConverted / 3.28084; // Feet to Meters
  }
  return valConverted;
};

const convertVolume = (valLiters, targetUnit) => {
  if (targetUnit === 'bbl/m' || targetUnit === 'bbl/ft') {
    return valLiters / 158.987; // Liters to Barrels
  }
  return valLiters; // Liters
};

// Pump output: stored internally as L/stroke; displayed as bbl/stroke for bbl-based units
const convertPumpOutput = (valLPerStroke, targetUnit) => {
  if (targetUnit === 'bbl/m' || targetUnit === 'bbl/ft') {
    return valLPerStroke / 158.987; // L/stroke → bbl/stroke
  }
  return valLPerStroke; // L/stroke
};

const convertPumpOutputBack = (valDisplayed, currentUnit) => {
  if (currentUnit === 'bbl/m' || currentUnit === 'bbl/ft') {
    return valDisplayed * 158.987; // bbl/stroke → L/stroke
  }
  return valDisplayed; // L/stroke
};

// Dynamic database lookup and fallback calculation
const getPipeCapacity = (type, size) => {
  if (DB.pipeData[type] && DB.pipeData[type][size]) {
    return DB.pipeData[type][size].capacity;
  }
  // Safe Fallback: Calculate approximate capacity
  // 1 inch = 25.4 mm. Inner capacity is proportional to OD^2.
  // We estimate based on nominal size in inches.
  let od = parseFloat(size.replace('-', ' '));
  if (isNaN(od)) od = 5.0;
  if (type === 'DC') return od * od * 0.1; // DC usually has smaller ID
  if (type === 'HWDP') return od * od * 0.18;
  return od * od * 0.36; // DP capacity
};

const getOHAnnularCapacity = (holeSize, pipeType, pipeSize) => {
  // Try direct DB lookup
  const holeKey = holeSize.toString();
  const pipeKey = `${pipeSize}_${pipeType}`;
  if (DB.openHoleVolumes[holeKey] && DB.openHoleVolumes[holeKey][pipeKey]) {
    return DB.openHoleVolumes[holeKey][pipeKey];
  }
  // Safe Fallback: Calculate: 0.5067 * (HoleOD^2 - PipeOD^2)
  let hOD = parseFloat(holeSize);
  let pOD = parseFloat(pipeSize);
  if (isNaN(hOD)) hOD = 12.25;
  if (isNaN(pOD)) pOD = 5.0;
  const cap = 0.5067 * (hOD * hOD - pOD * pOD);
  return Math.max(0, cap);
};

const getCasingAnnularCapacity = (casingSize, pipeType, pipeSize) => {
  const casingKey = casingSize.toString();
  const pipeKey = `${pipeSize}_${pipeType}`;
  if (DB.casingVolumes[casingKey] && DB.casingVolumes[casingKey][pipeKey]) {
    return DB.casingVolumes[casingKey][pipeKey];
  }
  // Safe Fallback: Casing Inside Diameter is approx Casing Size - 0.5 inch
  let cOD = parseFloat(casingSize);
  let pOD = parseFloat(pipeSize);
  if (isNaN(cOD)) cOD = 13.375;
  if (isNaN(pOD)) pOD = 5.0;
  let cID = cOD - 0.5;
  const cap = 0.5067 * (cID * cID - pOD * pOD);
  return Math.max(0, cap);
};

// Direction flag for slide animation: 'forward' | 'back'
let _navDirection = 'none';

// UI Navigation Controller
const navigateTo = (screenId) => {
  if (typeof screenId === 'string') {
    if (screenId.startsWith('/')) {
      screenId = screenId.slice(1).replace(/\//g, '-');
    }
    if (screenId === 'cement-job-planner') {
      screenId = 'cement-planner';
    }
    if (screenId === 'cementing') {
      screenId = 'cement-planner-subsea';
    }
    if (screenId === 'stuck-pipe-assistant') {
      screenId = 'stuck-pipe';
    }
  }

  const current = state.currentScreen;
  if (current === screenId) return;

  // Ensure cementingState is set to chooser if entering without active section/view or from planner home
  if (screenId === 'cement-planner-subsea') {
    const store = (typeof cementingStore !== 'undefined' ? cementingStore : (typeof cementingState !== 'undefined' ? cementingState : null));
    if (store && (current === 'cement-planner' || !store.view || (store.view === 'results' && !store.results))) {
      store.view = 'chooser';
    }
  }

  if (screenId === 'cement-planner-surface') {
    const store = (typeof surfaceCementingStore !== 'undefined' ? surfaceCementingStore : (typeof surfaceCementingState !== 'undefined' ? surfaceCementingState : null));
    if (store && (current === 'cement-planner' || !store.view || (store.view === 'results' && !store.results))) {
      store.view = 'chooser';
    }
  }

  // Track if we are navigating out of active home search
  if (current === 'dashboard' && state.searchQuery && state.searchQuery.trim() !== '') {
    state.openedFromHomeSearch = true;
    state.savedHomeSearchQuery = state.searchQuery;
  }

  // Clear search on screen transition unless opening from search
  if (!state.openedFromHomeSearch) {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
      state.searchQuery = '';
      const resultsContainer = document.getElementById('global-search-results');
      const menuGrid = document.querySelector('.menu-grid');
      if (resultsContainer) resultsContainer.style.display = 'none';
      if (menuGrid) {
        menuGrid.style.display = '';
        const cards = menuGrid.querySelectorAll('.toolkit-card');
        cards.forEach(card => card.style.display = '');
      }
    }
  }

  if (screenId === 'dashboard') {
    state.screenHistory = [];
    state.openedFromHomeSearch = false;
  } else {
    // If screenId is already in screenHistory, unwind history back to it to prevent loops/duplicates
    const existingIndex = state.screenHistory.indexOf(screenId);
    if (existingIndex !== -1) {
      state.screenHistory = state.screenHistory.slice(0, existingIndex);
    } else {
      state.screenHistory.push(current);
    }
  }

  _navDirection = 'forward';
  state.currentScreen = screenId;
  renderScreen();
};
window.navigateTo = navigateTo;

let calcHistory = safeJSONParse(localStorage.getItem('drillingToolkitHistory'), []);

const saveCalculationToHistory = (type) => {
  const newEntry = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    type: type,
    flowType: state.flowType,
    holeSize: state.selectedHoleSize,
    inputs: JSON.parse(JSON.stringify(state.calcInputs))
  };

  calcHistory.unshift(newEntry);
  if (calcHistory.length > 10) calcHistory = calcHistory.slice(0, 10);

  localStorage.setItem('drillingToolkitHistory', JSON.stringify(calcHistory));
};

window.openHistoryScreen = () => {
  navigateTo('history');
  renderHistoryScreen();
};

window.renderHistoryScreen = () => {
  const container = document.getElementById('history-container');
  if (!container) return;

  const filteredHistory = calcHistory.filter(item => item.flowType === state.flowType);

  if (filteredHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color:var(--text-secondary);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:15px; opacity:0.5;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p style="font-size:0.95rem;">No calculation history found.</p>
        <p style="font-size:0.8rem; margin-top:8px;">Run a calculation to save it here automatically.</p>
      </div>
    `;
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:12px;">';

  filteredHistory.forEach((item) => {
    const isKillSheet = item.type === 'kill_sheet';
    const title = isKillSheet ? 'Kill Data Sheet' : 'Wellbore Calculations';
    const desc = isKillSheet
      ? `MW: ${item.inputs.killOMW_ppg} ppg | KRP: ${item.inputs.killSCR_psi} psi`
      : `Hole MD: ${item.inputs.holeMD} ${state.globalUnit === 'bbl/ft' ? 'ft' : 'm'} | TVD: ${item.inputs.holeTVD}`;

    html += `
      <div class="content-card compact-card" style="padding:15px; position:relative; cursor:pointer;" onclick="loadHistoryItem(${item.id})">
        <button class="delete-history-btn" onclick="deleteHistoryItem(${item.id}, event)" style="position:absolute; right:12px; top:12px; background:none; border:none; color:var(--accent-color); padding:4px; border-radius:50%; cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
        <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">${item.date}</div>
        <div style="font-weight:700; color:var(--text-primary); margin-bottom:6px; font-size:0.95rem;">${title} (${item.flowType === 'subsea' ? 'Subsea' : 'Surface'})</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">
          <span style="font-weight:600; color:var(--text-primary);">${item.holeSize}" Hole</span> • ${desc}
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
};

window.deleteHistoryItem = (id, event) => {
  event.stopPropagation();
  calcHistory = calcHistory.filter(i => i.id !== id);
  localStorage.setItem('drillingToolkitHistory', JSON.stringify(calcHistory));
  renderHistoryScreen();
};

window.loadHistoryItem = (id) => {
  const item = calcHistory.find(i => i.id === id);
  if (!item) return;

  state.flowType = item.flowType;
  state.selectedHoleSize = item.holeSize;
  state.calcInputs = JSON.parse(JSON.stringify(item.inputs));

  localStorage.setItem('calcInputs', JSON.stringify(state.calcInputs));

  if (item.type === 'kill_sheet') {
    navigateTo('kill-data-sheet');
  } else {
    navigateTo(`${state.flowType}-calculations`);
  }
  showToast("History data loaded successfully");
};

// Screen History Pop Helper
function popScreenHistory() {
  if (state.screenHistory.length > 0) {
    _navDirection = 'back';
    const previousScreen = state.screenHistory.pop();
    state.currentScreen = previousScreen;
    renderScreen();

    // If returning to Home, check if we need to restore home search
    if (previousScreen === 'dashboard' && state.savedHomeSearchQuery) {
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.value = state.savedHomeSearchQuery;
        state.searchQuery = state.savedHomeSearchQuery;
        handleSearch({ target: searchInput });
      }
    }
  } else {
    // Already at Home (or history empty)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.exitApp();
    }
  }
}

// Central Unified App Back Navigation Controller
function handleAppBack() {
  // 1. Check if virtual keyboard is active (an input or textarea is focused)
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    document.activeElement.blur();
    return;
  }

  // 2. Check if a custom dropdown (e.g. language dropdown) is open
  const openDropdown = document.querySelector('.lang-dropdown.open');
  if (openDropdown) {
    openDropdown.classList.remove('open');
    return;
  }

  // 3. Check if any photo modal or dialog is open
  const photoModal = document.getElementById('iadc-photo-modal');
  if (photoModal && photoModal.style.display && photoModal.style.display !== 'none') {
    photoModal.style.display = 'none';
    return;
  }

  // 4. Check if language picker overlay is open
  const langOverlay = document.getElementById('lang-picker-overlay');
  if (langOverlay && langOverlay.classList.contains('active')) {
    langOverlay.classList.remove('active');
    return;
  }

  // 5. Check if any generic modal overlay is open
  const openModal = document.querySelector('.modal-overlay.active');
  if (openModal) {
    openModal.classList.remove('active');
    return;
  }

  // 5b. Check if cementing schematic full-screen modal is open
  const schematicModal = document.getElementById('schematic-fullscreen-modal');
  if (schematicModal && (schematicModal.classList.contains('active') || schematicModal.style.display !== 'none')) {
    if (typeof closeSchematicFullscreenModal === 'function') {
      closeSchematicFullscreenModal();
    } else {
      schematicModal.style.display = 'none';
      schematicModal.classList.remove('active');
    }
    return;
  }

  // 6. Check if side drawer / navigation menu is open
  const drawer = document.getElementById('drawer-menu');
  if (drawer && drawer.classList.contains('active')) {
    drawer.classList.remove('active');
    const backdrop = document.getElementById('drawer-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    return;
  }

  // 7. Check if user opened this tool directly from active Home Search
  if (state.openedFromHomeSearch) {
    state.openedFromHomeSearch = false;

    // Reset inner tool states
    if (typeof calcSubState !== 'undefined') {
      calcSubState.view = 'categories';
      calcSubState.formulaId = null;
    }
    if (typeof wellControlSubState !== 'undefined') {
      wellControlSubState.view = 'menu';
      wellControlSubState.category = null;
      wellControlSubState.formulaId = null;
      wellControlSubState.fromScreen = null;
    }
    if (typeof tubularSubState !== 'undefined') {
      tubularSubState.view = 'menu';
    }
    if (typeof quickRefSubState !== 'undefined') {
      quickRefSubState.view = 'menu';
      quickRefSubState.fromGuide = false;
      quickRefSubState.fromSearch = false;
    }

    _navDirection = 'back';
    state.screenHistory = [];
    state.currentScreen = 'dashboard';
    renderScreen();

    // Restore Home search input and results exactly as they were
    const searchInput = document.querySelector('.search-input');
    if (searchInput && state.savedHomeSearchQuery) {
      searchInput.value = state.savedHomeSearchQuery;
      state.searchQuery = state.savedHomeSearchQuery;
      handleSearch({ target: searchInput });
    }
    return;
  }

  // 8. Handle in-page nested views for specific tools

  // --- Tool: Calculation Hub (screen-drilling-calc) ---
  if (state.currentScreen === 'drilling-calc') {
    // If opened directly from Home Search, return straight to Home with search preserved
    if (state.openedFromHomeSearch) {
      popScreenHistory();
      return;
    }
    // Level 3: Inside a specific calculator formula view
    if (calcSubState.view === 'formula') {
      calcSubState.view = 'list';
      renderDrillingCalcScreen();
      return;
    }

    // Level 2: Inside the category list view ("Drilling Calculations")
    if (calcSubState.view === 'list') {
      // 2a. If an accordion category card is expanded, collapse it first
      const expanded = document.querySelector('#drilling-calc-container .guide-category-card.expanded');
      if (expanded) {
        expanded.classList.remove('expanded');
        const subList = expanded.querySelector('.guide-subcategory-list');
        if (subList) subList.style.maxHeight = null;
        calcSubState.formulaId = null;
        return;
      }
      // 2b. If search inside calc is active, clear it first
      if (calcSubState.search && calcSubState.search.trim() !== '') {
        calcSubState.search = '';
        renderDrillingCalcScreen();
        return;
      }
      // 2c. Step back to Categories portal view
      calcSubState.view = 'categories';
      calcSubState.formulaId = null;
      renderDrillingCalcScreen();
      return;
    }

    // Level 1: In Categories portal view
    if (calcSubState.view === 'categories') {
      if (calcSubState.search && calcSubState.search.trim() !== '') {
        calcSubState.search = '';
        renderDrillingCalcScreen();
        return;
      }
      // Level 0: Exit to Home
      popScreenHistory();
      return;
    }
  }

  // --- Tool: Well Control Calculations (screen-well-control) ---
  if (state.currentScreen === 'well-control') {
    // If opened from a parent screen like subsea-hole-size
    if (wellControlSubState.fromScreen) {
      const dest = wellControlSubState.fromScreen;
      wellControlSubState.fromScreen = null;
      wellControlSubState.view = 'menu';
      wellControlSubState.category = null;
      wellControlSubState.formulaId = null;
      if (state.screenHistory.includes(dest)) {
        while (state.screenHistory.length > 0 && state.currentScreen !== dest) {
          state.currentScreen = state.screenHistory.pop();
        }
        renderScreen();
      } else {
        navigateTo(dest);
      }
      return;
    }

    // Level 2: Inside formula, equations sheet, or CLF guide
    if (wellControlSubState.view !== 'menu') {
      wellControlSubState.view = 'menu';
      wellControlSubState.category = null;
      wellControlSubState.formulaId = null;
      renderWellControlScreen();
      return;
    }

    // Level 1: In Well Control menu
    const expanded = document.querySelector('#well-control-container .guide-category-card.expanded');
    if (expanded) {
      expanded.classList.remove('expanded');
      const subList = expanded.querySelector('.guide-subcategory-list');
      if (subList) subList.style.maxHeight = null;
      return;
    }

    // Level 0: Exit to previous screen (Home or Calculation Hub)
    popScreenHistory();
    return;
  }

  // --- Tool: API Tubular Data (screen-api-tubular) ---
  if (state.currentScreen === 'api-tubular') {
    if (state.openedFromHomeSearch) {
      popScreenHistory();
      return;
    }
    if (tubularSubState.view !== 'menu') {
      tubularSubState.view = 'menu';
      tubularSubState.selections = {
        connection: '',
        od: '',
        od_inch: '',
        grade: '',
        weight: '',
        nominal_weight_lbs_ft: '',
        class: ''
      };
      renderAPITubularScreen();
      return;
    }
    popScreenHistory();
    return;
  }

  // --- Tool: Quick Reference (screen-quick-ref) ---
  if (state.currentScreen === 'quick-ref') {
    if (state.openedFromHomeSearch) {
      popScreenHistory();
      return;
    }
    if (quickRefSubState.fromGuide) {
      quickRefSubState.fromGuide = false;
      quickRefSubState.view = 'menu';
      navigateTo('drilling-guide');
      return;
    }
    if (quickRefSubState.view !== 'menu') {
      quickRefSubState.view = 'menu';
      renderQuickRefScreen();
      return;
    }
    popScreenHistory();
    return;
  }

  // --- Tool: Drilling Guide (screen-drilling-guide) ---
  if (state.currentScreen === 'drilling-guide') {
    if (state.openedFromHomeSearch) {
      popScreenHistory();
      return;
    }
    // If search within drilling guide is active, clear it first
    const guideSearch = document.getElementById('guide-search-inp');
    if (guideSearch && guideSearch.value && guideSearch.value.trim() !== '') {
      guideSearch.value = '';
      renderDrillingGuideScreen();
      return;
    }
    // If an accordion category card is expanded, collapse it first
    const expanded = document.querySelector('#drilling-guide-container .guide-category-card.expanded');
    if (expanded) {
      expanded.classList.remove('expanded');
      const subList = expanded.querySelector('.guide-subcategory-list');
      if (subList) subList.style.maxHeight = null;
      state.selectedGuideId = null;
      window.lastExpandedGuideCat = null;
      return;
    }
    popScreenHistory();
    return;
  }

  // --- Tool: Cementing Module (screen-cement-planner-subsea / screen-cementing) ---
  if (state.currentScreen === 'cement-planner-subsea' || state.currentScreen === 'cementing') {
    const store = (typeof cementingStore !== 'undefined' ? cementingStore : (typeof cementingState !== 'undefined' ? cementingState : null));
    if (store) {
      if (store.view === 'results') {
        store.view = 'welldata';
        if (typeof renderCementingScreen === 'function') renderCementingScreen();
        return;
      }
      if (store.view === 'welldata') {
        store.view = 'capacities';
        if (typeof renderCementingScreen === 'function') renderCementingScreen();
        return;
      }
      if (store.view === 'capacities' || store.view === 'job') {
        store.view = 'chooser';
        if (typeof renderCementingScreen === 'function') renderCementingScreen();
        return;
      }
    }
    popScreenHistory();
    return;
  }

  // --- Tool: Surface Wellhead Cementing (screen-cement-planner-surface) ---
  if (state.currentScreen === 'cement-planner-surface') {
    const store = (typeof surfaceCementingStore !== 'undefined' ? surfaceCementingStore : (typeof surfaceCementingState !== 'undefined' ? surfaceCementingState : null));
    if (store) {
      if (store.view === 'results') {
        store.view = 'welldata';
        if (typeof renderSurfaceCementingScreen === 'function') renderSurfaceCementingScreen();
        return;
      }
      if (store.view === 'welldata') {
        store.view = 'capacities';
        if (typeof renderSurfaceCementingScreen === 'function') renderSurfaceCementingScreen();
        return;
      }
      if (store.view === 'capacities' || store.view === 'job') {
        store.view = 'chooser';
        if (typeof renderSurfaceCementingScreen === 'function') renderSurfaceCementingScreen();
        return;
      }
    }
    popScreenHistory();
    return;
  }

  // 9. Standard screen history pop
  popScreenHistory();
}

const navigateBack = (forceGlobal = false) => {
  handleAppBack();
};
window.navigateBack = handleAppBack;
window.handleAppBack = handleAppBack;

// Helper controllers for drawer, modals and theme
const updateDynamicBackground = (theme, bgTheme) => {
  const bodyColors = {
    light: { default: '#FAF8F5', cream: '#FAF4EB', mist: '#F0F4F7', sage: '#F1F5F1', lavender: '#F5F1F7', peach: '#FAF2ED' },
    dark: { default: '#141210', cream: '#1C1814', mist: '#141A22', sage: '#141A16', lavender: '#17141E', peach: '#1D1511' }
  };

  const bodyBg = bodyColors[theme][bgTheme] || bodyColors[theme]['default'];

  // Update HTML meta theme-color tag
  let metaTheme = document.getElementById('theme-color-meta');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.id = 'theme-color-meta';
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', bodyBg);
  return bodyBg;
};

const syncNativeTheme = (theme, bgTheme) => {
  const isDark = theme === 'dark';
  const hexBg = isDark ? '#141210' : '#FAF8F5';

  // Sync HTML meta theme-color tag
  let metaTheme = document.getElementById('theme-color-meta');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.id = 'theme-color-meta';
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', hexBg);

  // Sync Capacitor Status Bar & Android Navigation Bar
  if (window.Capacitor && window.Capacitor.Plugins) {
    if (window.Capacitor.Plugins.StatusBar) {
      const StatusBar = window.Capacitor.Plugins.StatusBar;
      try {
        // Capacitor Style.DARK = light text (for dark backgrounds). Style.LIGHT = dark text (for light backgrounds).
        StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' }).catch(() => { });
        StatusBar.setBackgroundColor({ color: hexBg }).catch(() => { });
      } catch (err) {
        console.warn('Capacitor StatusBar error:', err);
      }
    }
    if (window.Capacitor.Plugins.ThemeManagerPlugin) {
      window.Capacitor.Plugins.ThemeManagerPlugin.setNightMode({ mode: theme }).catch(() => {});
    }
  }
};

const withThemeTransition = (updateDOMCallback, postTransitionCallback) => {
  if (!document.startViewTransition) {
    updateDOMCallback();
    if (postTransitionCallback) postTransitionCallback();
    return;
  }

  const html = document.documentElement;
  html.classList.add('disable-theme-transitions');

  const transition = document.startViewTransition(() => {
    updateDOMCallback();
  });

  transition.finished.finally(() => {
    html.classList.remove('disable-theme-transitions');
    if (postTransitionCallback) postTransitionCallback();
  });
};

const initThemeToggler = () => {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const checkbox = document.getElementById('theme-toggle-checkbox');
  const drawerThemeItem = document.getElementById('drawer-theme-item');
  const switchTrack = document.getElementById('drawer-switch-track');
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  let lastToggleTime = 0;

  const updateThemeToggleUI = (theme) => {
    const homeIcon = document.getElementById('home-theme-icon');
    const drawerIcon = document.getElementById('theme-toggle-icon');
    const statusText = document.getElementById('theme-toggle-status') || document.getElementById('theme-toggle-text');
    const titleText = document.getElementById('theme-toggle-title');
    const track = document.getElementById('drawer-switch-track');
    const cb = document.getElementById('theme-toggle-checkbox');
    const btn = document.getElementById('theme-toggle-btn');

    if (btn) {
      const label = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      btn.setAttribute('aria-label', (window.t ? window.t(label, label) : label));
    }

    const sunSvg = `<circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    const moonSvg = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;

    if (homeIcon) {
      homeIcon.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
    }
    if (drawerIcon) {
      drawerIcon.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
    }
    if (titleText) {
      titleText.textContent = window.t ? window.t('Theme', 'Theme') : 'Theme';
    }
    if (statusText) {
      const modeKey = theme === 'dark' ? 'Dark' : 'Light';
      statusText.textContent = window.t ? window.t(modeKey, modeKey) : modeKey;
      statusText.setAttribute('data-i18n', modeKey);
    }
    if (track) {
      track.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
      if (theme === 'dark') {
        track.classList.add('active');
      } else {
        track.classList.remove('active');
      }
    }
    if (cb) {
      cb.checked = theme === 'dark';
    }
  };
  window.updateThemeToggleUI = updateThemeToggleUI;

  const toggleTheme = () => {
    const now = Date.now();
    if (now - lastToggleTime < 300) return;
    lastToggleTime = now;

    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';

    const applyThemeChange = () => {
      const html = document.documentElement;
      html.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        html.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        html.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      localStorage.setItem('theme', newTheme);
      updateThemeToggleUI(newTheme);

      const currentBg = localStorage.getItem('bgTheme') || 'default';
      updateDynamicBackground(newTheme, currentBg);
      syncNativeTheme(newTheme, currentBg);

      showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode activated`);
    };

    const isDrawerOpen = document.getElementById('drawer-menu')?.classList.contains('active');
    if (isDrawerOpen) {
      applyThemeChange();
    } else {
      withThemeTransition(applyThemeChange, () => {
        const currentBg = localStorage.getItem('bgTheme') || 'default';
        syncNativeTheme(newTheme, currentBg);
      });
    }
  };
  window.toggleTheme = toggleTheme;

  // Call updateDynamicBackground on startup to sync meta tag and Capacitor status bar colors
  const currentBg = localStorage.getItem('bgTheme') || 'default';
  updateDynamicBackground(currentTheme, currentBg);
  syncNativeTheme(currentTheme, currentBg);
  updateThemeToggleUI(currentTheme);

  if (themeToggleBtn && !themeToggleBtn._themeBound) {
    themeToggleBtn._themeBound = true;
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  if (drawerThemeItem && !drawerThemeItem._themeBound) {
    drawerThemeItem._themeBound = true;
    drawerThemeItem.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'theme-toggle-checkbox') return;
      toggleTheme();
    });
  }

  if (switchTrack && !switchTrack._themeBound) {
    switchTrack._themeBound = true;
    switchTrack.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  if (checkbox && !checkbox._themeBound) {
    checkbox._themeBound = true;
    checkbox.addEventListener('change', (e) => {
      const targetTheme = e.target.checked ? 'dark' : 'light';
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      if (targetTheme !== cur) {
        toggleTheme();
      }
    });
  }

  window.addEventListener('languageChanged', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeToggleUI(cur);
  });
};

const initDrawer = () => {
  const menuBtn = document.getElementById('menu-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const backdrop = document.getElementById('drawer-backdrop');
  const drawer = document.getElementById('drawer-menu');

  const openDrawer = () => {
    drawer.classList.add('active');
    backdrop.classList.add('active');
  };
  window.openDrawer = openDrawer;

  const closeDrawer = () => {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
  };
  window.closeDrawer = closeDrawer;

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  return { closeDrawer };
};

const initSettingsPage = (closeDrawer) => {
  const settingsBtn = document.getElementById('drawer-settings-btn');
  const unitControl = document.getElementById('settings-unit-control');
  const colorControl = document.getElementById('settings-color-control');
  const bgControl = document.getElementById('settings-bg-control');
  const langControl = document.getElementById('drawer-lang-control');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      closeDrawer();
      navigateTo('settings');
    });
  }

  const unitSystemControl = document.getElementById('settings-unit-system-control');
  if (unitSystemControl) {
    unitSystemControl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-system]');
      if (!btn) return;

      const newSys = btn.getAttribute('data-system');
      if (!newSys) return;

      if (window.UnitsEngine) {
        window.UnitsEngine.setUnitSystem(newSys);
        state.globalUnit = window.UnitsEngine.getUnit('capacity');
        localStorage.setItem('globalUnit', state.globalUnit);
      }

      renderSettingsScreen();
      if (state.currentScreen !== 'settings') {
        renderScreen();
      }

      const labels = {
        api: t('Oilfield Units (API)'),
        si: t('Metric Units (SI)'),
        mixed: t('Mixed Units')
      };
      showToast(`${t('Unit System')}: ${labels[newSys] || newSys}`);
    });

    unitSystemControl.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const buttons = Array.from(unitSystemControl.querySelectorAll('button[data-system]'));
      const activeIdx = buttons.findIndex(b => b.classList.contains('active') || b.getAttribute('aria-checked') === 'true');
      let targetIdx = activeIdx;
      if (e.key === 'ArrowLeft') {
        targetIdx = activeIdx <= 0 ? buttons.length - 1 : activeIdx - 1;
      } else if (e.key === 'ArrowRight') {
        targetIdx = activeIdx >= buttons.length - 1 ? 0 : activeIdx + 1;
      }
      if (buttons[targetIdx]) {
        e.preventDefault();
        buttons[targetIdx].click();
        buttons[targetIdx].focus();
      }
    });
  }

  if (colorControl) {
    colorControl.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-option-btn');
      if (!btn) return;

      const newColor = btn.getAttribute('data-color');
      let oldColor = localStorage.getItem('colorTheme') || 'milktea';
      if (oldColor === 'sand') oldColor = 'milktea';
      if (newColor === oldColor) return;

      const applyColorChange = () => {
        const html = document.documentElement;
        html.setAttribute('data-color-theme', newColor);
        localStorage.setItem('colorTheme', newColor);

        const swatches = colorControl.querySelectorAll('.theme-option-btn');
        swatches.forEach(swatch => swatch.classList.remove('active'));
        btn.classList.add('active');

        const themeNames = {
          milktea: 'Milk Tea',
          ocean: 'Ocean Blue',
          indigo: 'Deep Indigo',
          burgundy: 'Burgundy',
          forest: 'Forest Green'
        };
        const rawName = themeNames[newColor] || newColor;
        const displayName = (window.t ? window.t(rawName, rawName) : rawName);
        const colorNameEl = document.getElementById('active-color-name');
        if (colorNameEl) {
          colorNameEl.innerText = displayName;
        }

        const msgSuffix = (window.t ? window.t('theme activated', 'theme activated') : 'theme activated');
        showToast(`${displayName} ${msgSuffix}`);
      };

      withThemeTransition(applyColorChange);
    });
  }

  if (bgControl) {
    bgControl.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-option-btn');
      if (!btn) return;

      const newBg = btn.getAttribute('data-bg');
      const oldBg = localStorage.getItem('bgTheme') || 'default';
      if (newBg === oldBg) return;

      const applyBgChange = () => {
        const html = document.documentElement;
        html.setAttribute('data-bg-theme', newBg);
        localStorage.setItem('bgTheme', newBg);

        const swatches = bgControl.querySelectorAll('.theme-option-btn');
        swatches.forEach(swatch => swatch.classList.remove('active'));
        btn.classList.add('active');

        const theme = html.getAttribute('data-theme') || 'light';
        updateDynamicBackground(theme, newBg);
        syncNativeTheme(theme, newBg);

        const bgNames = {
          default: 'Default',
          cream: 'Cream',
          mist: 'Mist',
          sage: 'Sage',
          lavender: 'Lavender',
          peach: 'Peach'
        };
        const rawBgName = bgNames[newBg] || newBg;
        const displayName = (window.t ? window.t(rawBgName, rawBgName) : rawBgName);
        const bgNameEl = document.getElementById('active-bg-name');
        if (bgNameEl) {
          bgNameEl.innerText = displayName;
        }

        const msgSuffix = (window.t ? window.t('background theme activated', 'background theme activated') : 'background theme activated');
        showToast(`${displayName} ${msgSuffix}`);
      };

      withThemeTransition(applyBgChange, () => {
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        syncNativeTheme(theme, newBg);
      });
    });
  }

  // Language Picker — centered modal
  const langInput = document.getElementById('drawer-lang-control');
  const langLabel = document.getElementById('lang-selected-label');
  const modalTrigger = document.getElementById('lang-modal-trigger');
  const overlay = document.getElementById('lang-picker-overlay');
  const closeBtn = document.getElementById('lang-picker-close');
  const pickerOpts = document.querySelectorAll('.lang-picker-option');

  const applyLanguage = (lang) => {
    if (langInput) langInput.value = lang;
    // Update drawer label to native name
    const opted = document.querySelector(`.lang-picker-option[data-lang="${lang}"] .lang-name`);
    if (langLabel && opted) langLabel.textContent = opted.textContent;
    // Highlight selected option
    pickerOpts.forEach(o => o.classList.toggle('selected', o.getAttribute('data-lang') === lang));
    if (window.I18n) {
      window.I18n.setLanguage(lang);
      const displayName = window.I18n.langNames[lang] || lang;
      showToast(`${displayName}`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
    // Update theme toggle UI text (Light Mode / Dark Mode)
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (typeof window.updateThemeToggleUI === 'function') {
      window.updateThemeToggleUI(currentTheme);
    }
    const themeText = document.getElementById('theme-toggle-text');
    if (themeText) {
      themeText.textContent = (currentTheme === 'dark') ? (window.t ? window.t('Light Mode', 'Light Mode') : 'Light Mode') : (window.t ? window.t('Dark Mode', 'Dark Mode') : 'Dark Mode');
    }
    // Update drawer footer version
    const drawerFooter = document.getElementById('drawer-version-footer');
    if (drawerFooter && window.t) {
      drawerFooter.textContent = window.t('Drilling Toolkit v1.0.0', 'Drilling Toolkit v1.0.0');
    }
    // Update settings screen if open
    if (typeof renderSettingsScreen === 'function') {
      renderSettingsScreen();
    }
  };

  const openLangModal = () => { if (overlay) overlay.classList.add('active'); };
  const closeLangModal = () => { if (overlay) overlay.classList.remove('active'); };

  // Init from saved preference
  const currentLang = localStorage.getItem('appLang') || 'en';
  const initOpt = document.querySelector(`.lang-picker-option[data-lang="${currentLang}"] .lang-name`);
  if (langLabel && initOpt) langLabel.textContent = initOpt.textContent;
  pickerOpts.forEach(o => o.classList.toggle('selected', o.getAttribute('data-lang') === currentLang));

  if (modalTrigger) modalTrigger.addEventListener('click', openLangModal);
  if (closeBtn) closeBtn.addEventListener('click', closeLangModal);

  // Close on backdrop tap
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLangModal();
  });

  pickerOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.getAttribute('data-lang');
      closeLangModal();
      applyLanguage(lang);
    });
  });
};

const renderSettingsScreen = () => {
  const unitSystemControl = document.getElementById('settings-unit-system-control');
  const colorControl = document.getElementById('settings-color-control');
  const bgControl = document.getElementById('settings-bg-control');

  const currentSys = (window.UnitsEngine ? window.UnitsEngine.getUnitSystem() : 'mixed');

  if (unitSystemControl) {
    unitSystemControl.setAttribute('data-active-system', currentSys);
    const sysButtons = unitSystemControl.querySelectorAll('button[data-system]');
    sysButtons.forEach(btn => {
      const isSelected = btn.getAttribute('data-system') === currentSys;
      if (isSelected) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        btn.setAttribute('tabindex', '0');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('tabindex', '-1');
      }
    });

    const badgeEl = document.getElementById('active-unit-system-badge');
    if (badgeEl) {
      const badgeKeys = {
        api: 'API',
        si: 'SI',
        mixed: 'MIXED'
      };
      const textKey = badgeKeys[currentSys] || 'MIXED';
      badgeEl.textContent = t(textKey);
      badgeEl.setAttribute('data-i18n', textKey);
    }

    const summaryEl = document.getElementById('settings-unit-system-summary');
    if (summaryEl) {
      const summaries = {
        api: 'ft · in · bbl · ppg · psi · bbl/ft · °F',
        si: 'm · mm · m³ · SG · bar · L/m · °C',
        mixed: t('Each screen keeps its own default units')
      };
      const targetText = summaries[currentSys] || summaries.mixed;
      if (!summaryEl.textContent.trim()) {
        summaryEl.textContent = targetText;
      } else if (summaryEl.textContent.trim() !== targetText) {
        summaryEl.classList.add('is-fading');
        setTimeout(() => {
          summaryEl.textContent = targetText;
          if (currentSys === 'mixed') {
            summaryEl.setAttribute('data-i18n', 'Each screen keeps its own default units');
          } else {
            summaryEl.removeAttribute('data-i18n');
          }
          summaryEl.classList.remove('is-fading');
        }, 75);
      }
    }
  }

  const themeNames = {
    milktea: 'Milk Tea',
    ocean: 'Ocean Blue',
    indigo: 'Deep Indigo',
    burgundy: 'Burgundy',
    forest: 'Forest Green'
  };

  const bgNames = {
    default: 'Default',
    cream: 'Cream',
    mist: 'Mist',
    sage: 'Sage',
    lavender: 'Lavender',
    peach: 'Peach'
  };

  let currentColor = localStorage.getItem('colorTheme') || 'milktea';
  if (currentColor === 'sand') currentColor = 'milktea';
  if (colorControl) {
    const swatches = colorControl.querySelectorAll('.theme-option-btn');
    swatches.forEach(swatch => {
      if (swatch.getAttribute('data-color') === currentColor) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });
  }

  const currentBg = localStorage.getItem('bgTheme') || 'default';
  if (bgControl) {
    const swatches = bgControl.querySelectorAll('.theme-option-btn');
    swatches.forEach(swatch => {
      if (swatch.getAttribute('data-bg') === currentBg) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });
  }

  // Update text labels
  const colorNameEl = document.getElementById('active-color-name');
  if (colorNameEl) {
    const rawColor = themeNames[currentColor] || currentColor;
    colorNameEl.innerText = (window.t ? window.t(rawColor, rawColor) : rawColor);
  }
  const bgNameEl = document.getElementById('active-bg-name');
  if (bgNameEl) {
    const rawBg = bgNames[currentBg] || currentBg;
    bgNameEl.innerText = (window.t ? window.t(rawBg, rawBg) : rawBg);
  }
};

const initRateModal = (closeDrawer) => {
  const rateBtn = document.getElementById('drawer-rate-btn');
  const rateModal = document.getElementById('rate-modal');
  const closeRateBtn = document.getElementById('close-rate-btn');
  const stars = document.querySelectorAll('.star-rating .star-icon');
  const feedbackInput = document.getElementById('rate-feedback');
  const submitBtn = document.getElementById('submit-rating-btn');
  let selectedRating = 0;

  if (rateBtn) {
    rateBtn.addEventListener('click', () => {
      closeDrawer();
      window.open('https://play.google.com/store/apps/details?id=com.drillingtoolkit.app', '_system');
    });
  }

  if (closeRateBtn) {
    closeRateBtn.addEventListener('click', () => {
      rateModal.classList.remove('active');
    });
  }

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-star'));
      stars.forEach(s => {
        const starVal = parseInt(s.getAttribute('data-star'));
        if (starVal <= selectedRating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (selectedRating === 0) {
        showToast('Please select a star rating first.');
        return;
      }
      showToast(`Thank you! Review of ${selectedRating} stars submitted.`);
      rateModal.classList.remove('active');
    });
  }
};

const initShareModal = (closeDrawer) => {
  const shareBtn = document.getElementById('drawer-share-btn');
  const shareModal = document.getElementById('share-modal');
  const closeShareBtn = document.getElementById('close-share-btn');
  const copyBtn = document.getElementById('share-copy-btn');
  const nativeBtn = document.getElementById('share-native-btn');

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      closeDrawer();
      const shareData = {
        title: 'Drilling Toolkit',
        text: 'Drilling Toolkit - Smart Wellbore Operations & Calculations',
        url: 'https://play.google.com/store/apps/details?id=com.drillingtoolkit.app'
      };

      if (navigator.share) {
        navigator.share(shareData).catch((err) => {
          if (err.name !== 'AbortError') {
            console.log('Sharing aborted.');
          }
        });
      } else {
        navigator.clipboard.writeText(shareData.url).then(() => {
          showToast('Web share not supported. Play Store link copied to clipboard.');
        });
      }
    });
  }

  if (closeShareBtn) {
    closeShareBtn.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const shareUrl = window.location.href;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link copied to clipboard!');
        shareModal.classList.remove('active');
      }).catch(() => {
        showToast('Failed to copy link.');
      });
    });
  }

  if (nativeBtn) {
    nativeBtn.addEventListener('click', () => {
      const shareData = {
        title: 'Drilling Toolkit',
        text: 'Drilling Toolkit - Smart Wellbore Operations & Calculations',
        url: window.location.href
      };

      if (navigator.share) {
        navigator.share(shareData).then(() => {
          showToast('App shared successfully!');
          shareModal.classList.remove('active');
        }).catch((err) => {
          if (err.name !== 'AbortError') {
            showToast('Sharing aborted.');
          }
        });
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Web share not supported. Link copied to clipboard.');
          shareModal.classList.remove('active');
        });
      }
    });
  }
};

// Programmatic Card Override Manager for Home Screen Card Injections/Styling
const CardOverrideManager = {
  overrides: [],

  register(selector, callback) {
    this.overrides.push({ selector, callback });
  },

  apply() {
    const lang = window.I18n ? window.I18n.getCurrentLang() : 'en';

    // Stop translation MutationObserver to avoid race conditions during override DOM changes
    if (window.I18n && typeof window.I18n.stopObserver === 'function') {
      window.I18n.stopObserver();
    }

    this.overrides.forEach(({ selector, callback }) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => callback(el));
      } catch (err) {
        console.error('Error applying override for selector:', selector, err);
      }
    });

    // Translate DOM manually to capture any new elements/text
    if (window.I18n && typeof window.I18n.translateDOM === 'function') {
      window.I18n.translateDOM(lang);
    }

    // Restart translation MutationObserver if not in English
    if (window.I18n && lang !== 'en' && typeof window.I18n.startObserver === 'function') {
      window.I18n.startObserver(lang);
    }
  }
};

// Register Home Screen card overrides
CardOverrideManager.register('.menu-grid .toolkit-card', (el) => {
  const onClickAttr = el.getAttribute('onclick') || '';
  if (onClickAttr.includes("'quick-ref'")) {
    el.classList.add('full-width-card');

    // Convert standard vertical card layout to full-width horizontal layout
    const cardLeft = el.querySelector('.card-left');
    if (!cardLeft) {
      const iconContainer = el.querySelector('.card-icon-container');
      const title = el.querySelector('.card-title');
      const chevron = el.querySelector('.card-chevron');

      const newCardLeft = document.createElement('div');
      newCardLeft.className = 'card-left';

      if (iconContainer) {
        iconContainer.className = 'card-icon-container icon-quickref';
        newCardLeft.appendChild(iconContainer);
      }
      if (title) {
        newCardLeft.appendChild(title);
      }

      el.innerHTML = '';
      el.appendChild(newCardLeft);
      if (chevron) {
        el.appendChild(chevron);
      }
    }
  }
});

const APP_VERSION = '1.0.4';
const APP_VERSION_CODE = 5;

async function checkForUpdates() {
  // If no internet connection, skip silently and continue normally
  if (!navigator.onLine) {
    console.log('Offline: Skipping app update check.');
    return;
  }

  // If Firebase libraries are not loaded or blocked, skip silently
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not found. Skipping app update check.');
    return;
  }

  try {
    let localVersion = APP_VERSION.trim();
    let localVersionCode = Number(APP_VERSION_CODE) || 0;

    // Dynamically retrieve the actual installed app version from the device
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      try {
        const info = await window.Capacitor.Plugins.App.getInfo();
        if (info && info.version) {
          localVersion = info.version.trim();
        }
        if (info && info.build) {
          localVersionCode = Number(info.build) || APP_VERSION_CODE;
        }
      } catch (e) {
        console.error('Failed to get native app version:', e);
      }
    }

    const versionLabel = document.getElementById('drawer-version-label');
    if (versionLabel) {
      versionLabel.textContent = `Drilling Toolkit v${localVersion}`;
    }

    // Real Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyC2zZvMHMyDeSECABaOPBw0Ufc58D9o07A",
      authDomain: "drilling-toolkit.firebaseapp.com",
      projectId: "drilling-toolkit",
      storageBucket: "drilling-toolkit.firebasestorage.app",
      messagingSenderId: "937465653601",
      appId: "1:937465653601:web:0e4aaac4508479c9497d20",
      measurementId: "G-R28D1K09TN"
    };

    // Initialize Firebase if not already initialized
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }

    const remoteConfig = firebase.remoteConfig();

    // Set minimal fetch interval to 0 in development/testing, or 1 hour for production
    remoteConfig.settings.minimumFetchIntervalMillis = 0;

    // Set default config
    remoteConfig.defaultConfig = {
      latest_version: localVersion,
      minimum_version: localVersion,
      latest_version_code: localVersionCode,
      minimum_version_code: localVersionCode,
      release_notes: "• Bug fixes and stability improvements\n• Performance enhancements"
    };

    // Fetch and activate config parameters
    await remoteConfig.fetchAndActivate();
    const latestVersion = remoteConfig.getValue('latest_version').asString().trim();
    const minimumVersion = remoteConfig.getValue('minimum_version').asString().trim();
    const latestVersionCode = Number(remoteConfig.getValue('latest_version_code').asNumber()) || 0;
    const minimumVersionCode = Number(remoteConfig.getValue('minimum_version_code').asNumber()) || 0;
    const releaseNotes = remoteConfig.getValue('release_notes').asString();

    console.log(`Update check - Local: ${localVersion} (code: ${localVersionCode}), Latest Remote: ${latestVersion} (code: ${latestVersionCode}), Min Req Remote: ${minimumVersion} (code: ${minimumVersionCode})`);

    // Helper function to compare semantic version numbers (e.g. 1.0.1 vs 1.0.0)
    const isOutdatedSemantic = (current, target) => {
      const parse = (v) => v.split('.').map(Number);
      const cArr = parse(current);
      const tArr = parse(target);
      for (let i = 0; i < Math.max(cArr.length, tArr.length); i++) {
        const cVal = cArr[i] || 0;
        const tVal = tArr[i] || 0;
        if (tVal > cVal) return true;
        if (cVal > tVal) return false;
      }
      return false;
    };

    const isNewerVersion = (localV, localC, remoteV, remoteC) => {
      if (isOutdatedSemantic(localV, remoteV)) return true;
      // Ignore version code comparison to ensure popup only appears when semantic version is less
      return false;
    };

    const forceUpdate = isNewerVersion(localVersion, localVersionCode, minimumVersion, minimumVersionCode);
    const optionalUpdate = isNewerVersion(localVersion, localVersionCode, latestVersion, latestVersionCode);

    if (forceUpdate || optionalUpdate) {
      showUpdatePopup(localVersion, latestVersion, forceUpdate, releaseNotes);
    }
  } catch (error) {
    console.error('Failed to perform update check:', error);
  }
}

function showUpdatePopup(current, latest, isRequired = false, notes = '') {
  const modal = document.getElementById('update-modal');
  const currentLabel = document.getElementById('current-version-label');
  const latestLabel = document.getElementById('latest-version-label');
  const btnUpdateNow = document.getElementById('btn-update-now');
  const btnUpdateLater = document.getElementById('btn-update-later');
  const descriptionEl = modal ? modal.querySelector('.update-description') : null;

  const notesContainer = document.getElementById('update-release-notes');
  const notesList = document.getElementById('release-notes-list');

  if (currentLabel) currentLabel.textContent = current;
  if (latestLabel) latestLabel.textContent = latest;

  if (notesContainer && notesList) {
    if (notes) {
      notesList.innerHTML = '';
      const lines = notes.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      lines.forEach(line => {
        const li = document.createElement('li');
        li.textContent = line.replace(/^[•*\-\s]+/, '');
        notesList.appendChild(li);
      });
      notesContainer.style.display = 'block';
    } else {
      notesContainer.style.display = 'none';
    }
  }

  if (isRequired) {
    if (descriptionEl) {
      descriptionEl.textContent = "A critical update of Drilling Toolkit is available. You must update to the latest version to continue using the application.";
    }
    if (btnUpdateLater) {
      btnUpdateLater.style.display = 'none';
    }
    if (modal) {
      modal.setAttribute('data-forced', 'true');
    }
  } else {
    if (descriptionEl) {
      descriptionEl.textContent = "A new version of Drilling Toolkit is available. Please update to the latest version to access the newest calculations, features, and optimizations.";
    }
    if (btnUpdateLater) {
      btnUpdateLater.style.display = 'block';
    }
    if (modal) {
      modal.removeAttribute('data-forced');
    }
  }

  if (modal) {
    modal.classList.add('active');
  }

  if (btnUpdateNow) {
    btnUpdateNow.onclick = async () => {
      // Open the Play Store details page for the app in the system browser
      const url = 'https://play.google.com/store/apps/details?id=com.drillingtoolkit.app';
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
        await window.Capacitor.Plugins.Browser.open({ url });
      } else {
        window.open(url, '_system');
      }
    };
  }

  if (btnUpdateLater) {
    btnUpdateLater.onclick = () => {
      if (modal) {
        modal.classList.remove('active');
      }
    };
  }
}

// Initialize Application
const initApp = () => {
  // Record the exact time the app started initialization
  const appStartTime = Date.now();
  
  // Safe helper to hide native splash screen
  let splashAttempts = 0;
  const hideSplash = () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      window.Capacitor.Plugins.SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => { });
    } else if (splashAttempts < 40) { // Keep polling up to 2 seconds (40 * 50ms)
      splashAttempts++;
      setTimeout(hideSplash, 50);
    }
  };

  // Safe Fallback Timer: Hide native splash screen after 2.5 seconds max
  setTimeout(hideSplash, 2500);

  try {
    // Bind core Global events safely
    initHomeSearch();

    // Restrict all table inputs to a maximum of 10 digits/characters
    document.addEventListener('input', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('table-input')) {
        if (e.target.value && e.target.value.length > 10) {
          e.target.value = e.target.value.slice(0, 10);
        }
      }
    });

    // Set up header events & drawers
    const drawerCtrl = initDrawer();
    initThemeToggler();
    initSettingsPage(drawerCtrl ? drawerCtrl.closeDrawer : () => { });
    initRateModal(drawerCtrl ? drawerCtrl.closeDrawer : () => { });
    initShareModal(drawerCtrl ? drawerCtrl.closeDrawer : () => { });

    // Close modals if backdrop (overlay) is clicked
    window.addEventListener('click', (e) => {
      const overlays = document.querySelectorAll('.modal-overlay');
      overlays.forEach(overlay => {
        if (e.target === overlay) {
          // Prevent closing if it is a forced update modal
          if (overlay.id === 'update-modal' && overlay.getAttribute('data-forced') === 'true') {
            return;
          }
          overlay.classList.remove('active');
        }
      });
    });

    // Global listener for reactive unit system switching
    window.addEventListener('unitSystemChanged', (e) => {
      const newSys = e.detail && e.detail.unitSystem;
      const prevSys = e.detail && e.detail.prevSystem;
      if (!newSys || newSys === prevSys) return;

      const oldCapUnit = state.globalUnit;
      const newCapUnit = window.UnitsEngine ? window.UnitsEngine.getUnit('capacity') : (newSys === 'api' ? 'bbl/ft' : (newSys === 'si' ? 'L/m' : 'bbl/m'));
      state.globalUnit = newCapUnit;
      localStorage.setItem('globalUnit', newCapUnit);

      // Convert stack calcInputs depth scale if changed between bbl/ft (ft) and other (m)
      if (state.calcInputs) {
        if (oldCapUnit !== 'bbl/ft' && newCapUnit === 'bbl/ft') {
          ['holeMD', 'holeTVD', 'shoeMD', 'shoeTVD', 'dcLength', 'dcLength2', 'dcLength3', 'hwdpLength', 'dpLength', 'dpLength2', 'dpLength3', 'riserLength', 'chokeLength'].forEach(k => {
            if (state.calcInputs[k] && !isNaN(parseFloat(state.calcInputs[k]))) {
              state.calcInputs[k] = (parseFloat(state.calcInputs[k]) * 3.28084).toFixed(1);
            }
          });
        } else if (oldCapUnit === 'bbl/ft' && newCapUnit !== 'bbl/ft') {
          ['holeMD', 'holeTVD', 'shoeMD', 'shoeTVD', 'dcLength', 'dcLength2', 'dcLength3', 'hwdpLength', 'dpLength', 'dpLength2', 'dpLength3', 'riserLength', 'chokeLength'].forEach(k => {
            if (state.calcInputs[k] && !isNaN(parseFloat(state.calcInputs[k]))) {
              state.calcInputs[k] = (parseFloat(state.calcInputs[k]) / 3.28084).toFixed(1);
            }
          });
        }
      }

      // Refresh active screen if relevant
      if (state.currentScreen === 'api-tubular') {
        renderAPITubularScreen();
      } else if (state.currentScreen === 'surface-ref-values' || state.currentScreen === 'subsea-ref-values') {
        renderReferenceValues();
      } else if (state.currentScreen === 'surface-calculations' || state.currentScreen === 'subsea-calculations') {
        renderCalculations();
      } else if (state.currentScreen === 'drilling-calc' && typeof adaptActiveCalculatorView === 'function') {
        adaptActiveCalculatorView(newSys, prevSys);
      }
    });

    // Initial render (DO IMMEDIATELY SO IT'S READY UNDER THE SPLASH SCREEN)
    renderScreen();
    CardOverrideManager.apply();
    // Collapsing header controller initialized via collapsing_header.js

    // Load tubulars database asynchronously in the background so it never blocks home screen first paint
    const loadTubularsAsync = () => {
      if (document.querySelector('script[src="tubulars_db.js"]')) return;
      const script = document.createElement('script');
      script.src = 'tubulars_db.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadTubularsAsync();

    // Dismiss splash screen as soon as the first frame is composited and fonts are ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            hideSplash();
          }).catch(() => hideSplash());
        } else {
          hideSplash();
        }
      });
    });

    // Defer non-critical update checks completely off the launch path
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => checkForUpdates(), { timeout: 3000 });
    } else {
      setTimeout(checkForUpdates, 3000);
    }
  } catch (error) {
    console.error('Fatal initialization error in DOMContentLoaded:', error);
    // Ensure native splash screen gets hidden even in case of critical init error
    hideSplash();
  }

  // ── Back Navigation System ─────────────────────────────────────────

  // 1. Capacitor hardware/gesture back button
  const registerCapacitorBack = () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      if (!window._capacitorBackButtonRegistered) {
        window._capacitorBackButtonRegistered = true;
        try {
          window.Capacitor.Plugins.App.removeAllListeners();
        } catch (e) {}
        window.Capacitor.Plugins.App.addListener('backButton', () => {
          handleAppBack();
        });
      }
    }
  };
  registerCapacitorBack();
  window.addEventListener('load', registerCapacitorBack);
  document.addEventListener('deviceready', registerCapacitorBack);

  // 2. Edge swipe gestures (Android back gesture convention - Left & Right edges)
  (function initEdgeSwipe() {
    // Disable custom JS swipe on Android to let the true native OS back gesture work cleanly
    if (/android/i.test(navigator.userAgent)) {
      return;
    }

    const EDGE_WIDTH = 60;       // px from edge that starts a valid swipe (increased to 60px for better touch recognition)
    const MIN_SWIPE_X = 50;      // minimum horizontal travel to trigger back (lowered to 50px for responsiveness)
    const MAX_SWIPE_Y = 80;      // maximum vertical drift allowed
    const MIN_VELOCITY = 0.15;   // px/ms (lowered velocity threshold so even casual/slower swipes register)

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let swipeEdge = null;        // 'left' | 'right' | null

    // Create visual swipe handle indicators
    const leftHandle = document.createElement('div');
    leftHandle.id = 'swipe-back-handle-left';
    leftHandle.style.cssText = [
      'position:fixed', 'left:0', 'top:50%', 'transform:translateY(-50%)',
      'width:4px', 'height:80px', 'border-radius:0 8px 8px 0',
      'background:var(--accent-color,#8D7765)', 'opacity:0',
      'transition:opacity 0.2s, width 0.15s',
      'z-index:4000', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(leftHandle);

    const rightHandle = document.createElement('div');
    rightHandle.id = 'swipe-back-handle-right';
    rightHandle.style.cssText = [
      'position:fixed', 'right:0', 'top:50%', 'transform:translateY(-50%)',
      'width:4px', 'height:80px', 'border-radius:8px 0 0 8px',
      'background:var(--accent-color,#8D7765)', 'opacity:0',
      'transition:opacity 0.2s, width 0.15s',
      'z-index:4000', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(rightHandle);

    document.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();

      const width = window.innerWidth;
      
      // Determine if a back action can be performed (either screen history, an open modal, or an open drawer)
      const hasHistory = state.screenHistory.length > 0;
      const langOverlay = document.getElementById('lang-picker-overlay');
      const isLangActive = langOverlay && langOverlay.classList.contains('active');
      const isModalActive = !!document.querySelector('.modal-overlay.active');
      const drawer = document.getElementById('drawer-menu');
      const isDrawerActive = drawer && drawer.classList.contains('active');
      
      const canGoBack = hasHistory || isLangActive || isModalActive || isDrawerActive;

      if (canGoBack) {
        if (t.clientX <= EDGE_WIDTH) {
          swipeEdge = 'left';
          leftHandle.style.opacity = '0.6';
          leftHandle.style.width = '6px';
        } else if (t.clientX >= width - EDGE_WIDTH) {
          swipeEdge = 'right';
          rightHandle.style.opacity = '0.6';
          rightHandle.style.width = '6px';
        } else {
          swipeEdge = null;
        }
      } else {
        swipeEdge = null;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!swipeEdge) return;

      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }

      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dist = Math.abs(dx);
      const progress = Math.min(dist / MIN_SWIPE_X, 1);

      if (swipeEdge === 'left') {
        leftHandle.style.opacity = (0.6 + progress * 0.4).toString();
        leftHandle.style.width = (6 + progress * 12) + 'px';
      } else if (swipeEdge === 'right') {
        rightHandle.style.opacity = (0.6 + progress * 0.4).toString();
        rightHandle.style.width = (6 + progress * 12) + 'px';
      }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      leftHandle.style.opacity = '0';
      leftHandle.style.width = '4px';
      rightHandle.style.opacity = '0';
      rightHandle.style.width = '4px';

      if (!swipeEdge) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = Math.abs(t.clientY - touchStartY);
      const dt = Date.now() - touchStartTime;

      const dist = Math.abs(dx);
      const vx = dist / dt;

      const isValidDirection = (swipeEdge === 'left' && dx > 0) || (swipeEdge === 'right' && dx < 0);

      if (isValidDirection && dist > MIN_SWIPE_X && dy < MAX_SWIPE_Y && vx > MIN_VELOCITY) {
        handleAppBack();
      }
      swipeEdge = null;
    }, { passive: true });
  })();

  // (Splash screen hiding handled in initialization sequence)
};

// Execute initialization immediately or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ==========================================================
// GLOBAL SEARCH SERVICE & INDEX REGISTRY (Pure & Testable)
// ==========================================================

// Safe HTML escaper for search rendering
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// String normalization: lowercase, strip punctuation/hyphens/accents, consolidate spaces
function normalizeSearchString(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(new RegExp('[-_/' + '\\\\' + '.,():;+&]', 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for typo-tolerant fuzzy matching
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Helper to determine if a query word fuzzy-matches a candidate word
function isWordFuzzyMatch(word, targetWord) {
  if (!word || !targetWord) return false;
  if (targetWord.startsWith(word) || word.startsWith(targetWord)) return true;
  if (word.length >= 4) {
    const maxD = word.length > 6 ? 2 : 1;
    const prefix = targetWord.slice(0, word.length + 1);
    if (getLevenshteinDistance(word, prefix) <= maxD) return true;
    if (getLevenshteinDistance(word, targetWord) <= maxD) return true;
  }
  return false;
}

// Curated synonyms, abbreviations, and acronyms for drilling & well control terminology
const curatedSynonymsMap = {
  'leak_off': ['LOT', 'FIT', 'leakoff', 'leak-off', 'formation integrity', 'fracture gradient', 'shoe test', 'breakdown', 'mud weight limit'],
  'icp': ['ICP', 'initial circulating pressure', 'drillers method', 'kill operation', 'shut in drill pipe'],
  'fcp': ['FCP', 'final circulating pressure', 'drillers method', 'kill mud', 'circulation'],
  'kmw': ['KMW', 'kill mud weight', 'kill weight', 'formation pressure', 'reservoir balance'],
  'maasp': ['MAASP', 'maximum allowable annular surface pressure', 'casing shoe fracture', 'annular limit'],
  'trip_margin': ['trip margin', 'swab', 'surge', 'safety overbalance'],
  'safety_margin': ['safety margin', 'overbalance', 'differential pressure'],
  'volume_to_bleed': ['volume to bleed', 'bleed off', 'gas migration', 'constant bhp'],
  'adj_masicp': ['MASICP', 'adjusted masicp', 'weight up'],
  'est_influx_type': ['influx type', 'gas kick', 'oil kick', 'saltwater kick', 'influx gradient'],
  'form_pres': ['formation pressure', 'pore pressure', 'reservoir pressure', 'kick analysis'],
  'hydro_loss_gas_cut': ['gas cut mud', 'hydrostatic loss', 'gas cutting'],
  'influx_height': ['influx height', 'kick height', 'height of kick'],
  'max_fp': ['max formation pressure', 'withstand shut in'],
  'misicp': ['MISICP', 'maximum initial shut in casing pressure'],
  'max_pit_gain': ['pit gain', 'gas kick expansion', 'surface kick volume'],
  'max_influx_h': ['max influx height', 'masicp limit'],
  'max_surf_pres_kt': ['kick tolerance surface pressure', 'max surface pressure'],
  'riser_margin': ['riser margin', 'subsea riser', 'unlatch riser', 'disconnect'],
  'subsea_accumulator': ['subsea accumulator', 'bottle volume', 'water depth head'],
  'gas_migration': ['gas migration rate', 'bubble rise', 'gas speed'],
  'max_surface_pressure': ['max surface pressure', 'subsea gas expansion'],
  'kick_tolerance': ['kick tolerance', 'maximum kick', 'influx tolerance'],
  'tensile_cap': ['tensile capacity', 'drill string tensile', 'pipe yield', 'axial load'],
  'dc_wt_vert': ['drill collar weight', 'vertical well dc', 'wob requirement'],
  'dc_wt_dev': ['drill collar weight deviated', 'directional collar weight'],
  'overpull_margin': ['MOP', 'margin of overpull', 'overpull limit'],
  'max_rop': ['max rop', 'rate of penetration', 'cuttings load'],
  'eff_mud_dens': ['effective mud density', 'equivalent density'],
  'ecd_applied': ['ECD', 'equivalent circulating density', 'annular friction loss'],
  'dp_elongation': ['drill pipe stretch', 'pipe elongation', 'free point'],
  'neutral_point': ['neutral point', 'tension compression boundary', 'buckling point'],
  'ds_weight_air': ['drill string weight air', 'string weight'],
  'ds_weight_mud': ['buoyed weight', 'drill string weight mud', 'hook load in mud'],
  'buckling_load': ['critical buckling', 'sinusoidal buckling', 'helical buckling'],
  'burst_pressure': ['burst pressure', 'internal yield', 'pipe burst'],
  'collapse_pressure': ['collapse pressure', 'external collapse', 'pipe collapse'],
  'pipe_body_yield': ['pipe body yield', 'tensile yield strength'],
  'tool_joint_strength': ['tool joint strength', 'torsional strength', 'makeup torque'],
  'hook_load_calc': ['hook load', 'total hook load', 'derrick load'],
  'max_allowable_pull': ['max allowable pull', 'pull limit'],
  'wob_calc': ['WOB', 'weight on bit', 'collar weight available'],
  'safety_factor_calc': ['safety factor', 'design factor', 'tension sf'],
  'pump_out_duplex': ['duplex pump', 'pump output', 'liner output', 'double acting'],
  'pump_out_triplex': ['triplex pump', 'pump output', 'single acting', 'bbl per stroke'],
  'pump_pres_stroke_basic': ['pump pressure stroke', 'spm pressure rule', 'square law'],
  'pump_pres_stroke_adv': ['advanced pump pressure', 'stroke pressure'],
  'pump_pressure_spm_change': ['spm change', 'new pump pressure', 'strokes change'],
  'pump_pressure_mw_change': ['mud weight change', 'pressure change mw'],
  'pump_pressure_both_change': ['spm and mw change', 'both change pump pressure'],
  'pump_rate_req': ['required pump rate', 'gpm for annular velocity'],
  'break_gel': ['break gel', 'gel strength pressure', 'initial circulation'],
  'break_circ': ['break circulation', 'standpipe break pressure'],
  'standpipe_press': ['SPP', 'standpipe pressure', 'system pressure loss'],
  'p_loss_dp': ['pressure loss drill pipe', 'dp friction loss'],
  'p_loss_dc': ['pressure loss drill collars', 'dc friction loss'],
  'p_loss_bit': ['bit pressure drop', 'nozzle pressure loss'],
  'p_loss_ann': ['annular pressure loss', 'annular friction'],
  'bhhp': ['BHHP', 'bottom hole horsepower', 'bit hydraulic horsepower', 'hsi'],
  'pump_hhp': ['HHP', 'pump hydraulic horsepower'],
  'jet_impact_force': ['HIF', 'hydraulic impact force', 'jet force'],
  'bit_nozzle_size': ['bit nozzle size', 'jets size', '32nds'],
  'bit_tfa': ['TFA', 'total flow area', 'nozzle area'],
  'pump_eff': ['pump efficiency', 'volumetric efficiency'],
  'pump_stroke_req': ['strokes required', 'pump strokes', 'displacement strokes'],
  'flow_regime': ['flow regime', 'laminar flow', 'turbulent flow', 'critical velocity'],
  'reynolds_number': ['reynolds number', 'reynolds', 'flow turbulence'],
  'ann_cap': ['annular capacity', 'annulus volume', 'bbl per foot'],
  'ann_vel_dia': ['annular velocity', 'av', 'cutting transport'],
  'ann_vel_cap': ['annular velocity capacity', 'av from capacity'],
  'lag_time': ['lag time', 'bottoms up', 'cuttings to surface', 'strokes to surface'],
  'cuttings_vol_bbl': ['cuttings volume bbl', 'volume generated'],
  'cuttings_vol_gph': ['cuttings volume gph', 'gallons per hour cuttings'],
  'cuttings_vol_gpm': ['cuttings volume gpm', 'gallons per minute cuttings'],
  'int_cap': ['internal capacity', 'pipe capacity', 'bbl/ft'],
  'pipe_disp_applied': ['pipe displacement', 'metal displacement', 'steel displacement'],
  'pipe_disp': ['pipe displacement bbl/ft', 'pipe volume'],
  'rt_ton_mile': ['ton mile', 'round trip ton miles', 'wireline work'],
  'casing_ton_mile': ['casing ton mile', 'running casing ton miles'],
  'pipe_pulled_dry': ['pooh dry', 'pipe pulled dry', 'hole fill'],
  'pipe_pulled_wet': ['pooh wet', 'pipe pulled wet', 'swab volume'],
  'dp_pulled_lose_dry': ['dp pulled lose dry', 'hydrostatic loss dry'],
  'dp_pulled_lose_wet': ['dp pulled lose wet', 'hydrostatic loss wet'],
  'slug_vol': ['slug volume', 'dry pipe slug', 'bbl of slug'],
  'slug_weight': ['slug weight', 'required slug mw', 'heavy pill'],
  'slug_bbl_req': ['slug bbl required', 'desired slug length'],
  'hydro_dec_dry': ['hydrostatic decrease dry', 'pressure drop dry'],
  'hydro_dec_wet': ['hydrostatic decrease wet', 'pressure drop wet'],
  'hydro_grad_gas_cut': ['gas cut gradient', 'hydrostatic gradient'],
  'hydro_mw_gas_cut': ['gas cut mud weight', 'aerated mud'],
  'hydro_loss_float_fail': ['float failure', 'u tube effect', 'float loss'],
  'fpc_stuck': ['FPC', 'free point constant', 'stuck pipe modulus'],
  'stuck_pipe_calc': ['stuck pipe stretch', 'free pipe length'],
  'stuck_pipe_not_know_fpc': ['stuck pipe unknown fpc', 'approximate free point'],
  'spot_pill': ['spotting pill', 'soak pill', 'free pipe pill', 'lubricant pill'],
  'diff_stick_force': ['differential sticking force', 'stick force', 'contact area'],
  'mech_stick_risk': ['mechanical sticking risk', 'keyseat risk'],
  'jar_impact_force': ['jar impact force', 'jar blow', 'accelerator'],
  'back_off_torque': ['back off torque', 'string shot', 'unscrew torque'],
  'fish_string_load': ['fishing string load', 'overpull limit'],
  'max_overpull': ['max overpull', 'allowable pull'],
  'washover_length': ['washover length', 'washpipe requirement'],
  'milling_time': ['milling time', 'section mill', 'pilot mill'],
  'spotting_time': ['spotting time', 'pill displacement time'],
  'pipe_recovery_est': ['pipe recovery', 'recovery percentage'],
  'bf_ppg': ['buoyancy factor ppg', 'buoyancy factor', 'steel float'],
  'bf_lbs': ['buoyancy factor lb/ft3', 'density buoyancy'],
  'grad_to_mw': ['gradient to mud weight', 'psi/ft to ppg'],
  'sg_to_mw_ppg': ['SG to ppg', 'specific gravity to mud weight'],
  'sg_to_mw_lbs': ['SG to lb/ft3', 'specific gravity to lbs'],
  'mw_to_sg': ['ppg to SG', 'mud weight to specific gravity'],
  'sg_to_grad': ['SG to psi/ft', 'specific gravity to gradient'],
  'acc_surf': ['surface accumulator', 'usable fluid', 'bop accumulator'],
  'acc_subsea': ['subsea accumulator', 'subsea bop bottles'],
  'acc_bottle_req': ['accumulator bottle requirement', 'number of bottles'],
  'acc_precharge': ['precharge pressure', 'nitrogen precharge'],
  'acc_recharge_time': ['recharge time', 'accumulator pump time'],
  'bop_close_time': ['bop closing time', 'api 16d time', 'ram close time'],
  'bop_open_time': ['bop opening time', 'api 16d open time'],
  'ram_close_vol': ['ram closing volume', 'pipe ram volume'],
  'annular_close_vol': ['annular closing volume', 'annular preventer vol'],
  'control_fluid_req': ['hydraulic control fluid', 'koomey fluid'],
  'choke_line_cap': ['choke line capacity', 'choke volume'],
  'kill_line_cap': ['kill line capacity', 'kill volume'],
  'surface_line_vol': ['surface line volume', 'hp line volume'],
  'bop_function_vol': ['bop function volume', 'total bop gallons'],
  'bop_press_test_vol': ['bop pressure test', 'test fluid volume'],
  'press_rating_verif': ['pressure rating verification', 'working pressure'],
  'surface_stack': ['surface stack', 'surface bop', 'hole size selection', 'drillstring setup', 'wellbore volume', 'strokes'],
  'subsea_stack': ['subsea stack', 'subsea bop', 'riser', 'water depth', 'air gap', 'marine elevations'],
  'calc_hub': ['calculation hub', 'drilling calculations', 'formulas', 'math', 'engineering', 'calculators'],
  'cementing_module': ['cementing', 'casing cementing', 'cement module', 'slurry volume', 'lead slurry', 'tail slurry', 'displacement', 'toc', 'top of cement', 'spacer', 'hydrostatic pressure', 'schematic', 'riserless', 'shoe'],
  'bit_dull_grading': ['IADC', 'iadc', 'bit dull', 'dull grading', 'wear', 'pdc bit', 'roller cone', 'bearing', 'seal', 'gauge', 'cutting structure'],
  'iadc_history': ['IADC', 'iadc history', 'bit history', 'dull records', 'inspection history', 'saved bits'],
  'api_tubular_overview': ['api tubular', 'casing', 'drill pipe', 'tubing', 'dimensions', 'capacities', 'weights', 'drift', 'od', 'id'],
  'api_casing_table': ['api casing table', 'btc', 'ltc', 'stc', 'casing burst', 'collapse', 'drift', 'wall thickness', 'body yield'],
  'api_drillpipe_table': ['api drill pipe', 'dp specs', 'nc50', 'tool joint', 'makeup torque', 'tensile yield strength', 'drill pipe dimensions'],
  'api_tubing_table': ['api tubing table', 'eue', 'nue', 'production tubing', 'injection tubing', 'tubing burst', 'tubing collapse'],
  'api_large_casing_table': ['large casing', 'conductor', 'surface casing', '24 inch', '30 inch', '36 inch', 'casing above 22'],
  'stuck_pipe_analysis': ['stuck pipe', 'differential sticking', 'mechanical sticking', 'free point', 'jarring', 'first actions', 'stuck pipe assistant'],
  'unit_conversion': ['unit conversion', 'petroleum converter', 'psi', 'bar', 'ppg', 'sg', 'bbl', 'gpm', 'pressure converter', 'volume converter'],
  'kill_data_sheet': ['kill data sheet', 'kill sheet', 'icp', 'fcp', 'kmw', 'sidpp', 'sicp', 'strokes to bit', 'choke schedule', 'well control calculations'],
  'drilling_guide_menu': ['drilling guide', 'reference guide', 'handbook', 'bha', 'bits', 'casing', 'well control', 'procedures'],
  'quick_ref_menu': ['quick reference', 'reference tables', 'torque table', 'ring gaskets', 'surface wellhead', 'edphot', 'subsea equipment'],
  'clf_guide': ['CLF', 'choke line friction', 'clf guide', 'subsea choke line', 'subsea well control'],
  'drill_bit_torque': ['drill bit makeup torque', 'bit torque', 'makeup torque table', 'regular threads'],
  'ring_gaskets_conn': ['ring gaskets', 'api 16a', 'bx gaskets', 'r gaskets', 'rx gaskets', 'flange gaskets'],
  'surface_wellhead': ['surface wellhead', 'wellhead sections', 'spool', 'hanger', 'stud sizes'],
  'subsea_equipment': ['subsea equipment', 'edphot', 'hang off tool', 'emergency hang off', 'casing hanger'],
  'dogleg_severity': ['DLS', 'dogleg', 'dog leg severity', 'build rate', 'curvature'],
  'directional_surveying': ['directional survey', 'azimuth', 'inclination', 'tvd', 'md', 'dogleg'],
  'kickoff_build_rate': ['kickoff', 'build rate', 'kop', 'burst rate'],
  'pdc_bits': ['pdc bits', 'polycrystalline diamond', 'cutters', 'fixed cutter'],
  'roller_cone_bits': ['roller cone bits', 'milled tooth', 'tci', 'insert bit'],
  'bit_nozzle_selection': ['nozzle selection', 'jets selection', 'nozzle sizes', 'tfa'],
  'bit_hydraulics': ['bit hydraulics', 'hsi', 'hydraulic horsepower', 'jet velocity'],
  'bit_makeup_torque': ['bit makeup torque', 'makeup torque', 'pin connection'],
  'stabilizers': ['stabilizers', 'blade stabilizer', 'integral blade', 'welded blade'],
  'reamers': ['reamers', 'roller reamer', 'hole opener'],
  'jars': ['jars', 'drilling jar', 'hydraulic jar', 'mechanical jar', 'accelerator'],
  'shock_subs': ['shock sub', 'vibration dampener'],
  'float_valves': ['float valve', 'plunger valve', 'flapper valve', 'baker float'],
  'crossovers': ['crossover', 'x over', 'sub', 'connection sub'],
  'bha_components': ['bha components', 'bottom hole assembly', 'drill collars', 'stabilizers'],
  'drill_string_components': ['drill string components', 'drill pipe', 'heavy weight', 'tool joints'],
  'stuck_pipe_guide': ['stuck pipe guide', 'differential stick', 'mechanical stick', 'hole cleaning'],
  'kick_indicators': ['kick indicators', 'flow increase', 'pit gain', 'drilling break'],
  'shutin_procedure': ['shut in procedure', 'hard shut in', 'soft shut in', 'space out'],
  'drillers_method': ['drillers method', 'two circulation kill', 'well kill'],
  'wait_weight_method': ['wait and weight', 'one circulation kill', 'engineer method'],
  'slow_circulation_rate': ['slow circulation rate', 'SCR', 'kill rate pressure'],
  'casing_components': ['casing components', 'conductor', 'surface casing', 'intermediate', 'production casing'],
  'float_equipment': ['float equipment', 'float collar', 'float shoe', 'guide shoe'],
  'centralizers': ['centralizers', 'bow spring', 'rigid centralizer', 'standoff'],
  'cementing_procedure': ['cementing procedure', 'primary cement', 'plug cementing', 'displacement'],
  'cement_additives': ['cement additives', 'accelerators', 'retarders', 'fluid loss', 'extenders'],
  'overshot': ['overshot', 'fishing overshot', 'spiral grapple', 'basket grapple'],
  'spear': ['spear', 'casing spear', 'tubing spear', 'internal catch'],
  'junk_basket': ['junk basket', 'reverse circulation', 'core basket'],
  'fishing_magnets': ['fishing magnet', 'magnet', 'junk recovery'],
  'washover_pipe': ['washover pipe', 'washpipe', 'washover shoe'],
  'hydrostatic_pressure': ['hydrostatic pressure', 'column pressure', 'mud gradient'],
  'annular_velocity': ['annular velocity', 'fluid velocity', 'flow velocity'],
  'pressure_loss': ['pressure loss', 'friction loss', 'system loss'],
  'mud_weight': ['mud weight', 'mud density', 'ppg', 'specific gravity'],
  'mud_viscosity': ['mud viscosity', 'gel strength', 'plastic viscosity', 'yield point', 'marsh funnel'],
  'mud_calculations': ['mud calculations', 'weight up', 'dilution', 'mixing'],
  'packers': ['packers', 'production packer', 'mechanical packer', 'hydraulic packer'],
  'production_tubing': ['production tubing', 'tubing string', 'flow string'],
  'wellhead_xmas_tree': ['xmas tree', 'christmas tree', 'master valve', 'choke manifold']
};

// Ukrainian and technical search terms
const ukSynonyms = {
  'leak_off': ['випробування на гідророзрив', 'тиск поглинання', 'градієнт розриву', 'випробування башмака'],
  'icp': ['початковий циркуляційний тиск', 'тиск глушіння', 'глушіння свердловини'],
  'fcp': ['кінцевий циркуляційний тиск', 'тиск циркуляції'],
  'kmw': ['густина розчину глушіння', 'вага розчину глушіння', 'глушіння'],
  'maasp': ['МАДТП', 'максимально допустимий тиск', 'тиск на гирлі'],
  'burst_pressure': ['тиск розриву', 'внутрішній тиск', 'міцність на розрив'],
  'collapse_pressure': ['тиск зминання', 'зовнішній тиск', 'стійкість до зминання'],
  'pipe_body_yield': ['границя текучості труби', 'міцність труби на розтяг'],
  'tool_joint_strength': ['міцність замкового з\'єднання', 'момент згвинчування'],
  'hook_load_calc': ['навантаження на гак', 'вага колони'],
  'wob_calc': ['навантаження на долото', 'осьове навантаження'],
  'pump_out_triplex': ['трипоршневий насос', 'подача насоса', 'продуктивність насоса'],
};
for (const k in ukSynonyms) {
  if (curatedSynonymsMap[k]) {
    curatedSynonymsMap[k].push(...ukSynonyms[k]);
  }
}

// Highlights matched substrings in text
function highlightMatches(text, rawQuery) {
  if (!text || !rawQuery) return escapeHTML(text);
  const query = normalizeSearchString(rawQuery);
  if (!query) return escapeHTML(text);

  const tokens = query.split(' ').filter(Boolean);
  tokens.sort((a, b) => b.length - a.length);

  const escapedTokens = tokens.map(t => t.replace(new RegExp('[.*+?^${}()|\\[\\]\\\\]', 'g'), '\\$&'));
  if (escapedTokens.length === 0) return escapeHTML(text);

  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const safeText = escapeHTML(text);
  return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// Builds the central unified search index from existing app databases
function buildSearchRegistry() {
  const items = [];
  const tr = (k) => (window.I18n ? window.I18n.translate(k) : k) || k;

  // 1. Core Module / Standalone Tools
  const coreTools = [
    {
      id: 'surface_stack',
      title: tr('Surface Stack'),
      category: tr('BOP STACK'),
      desc: tr('BOP configuration, drillstring setup, and volume calculations for surface stack setups.'),
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"></path><path d="M5 20v-2h14v2"></path><path d="M8 18L11 5h2l3 13"></path><path d="M9.2 13h5.6"></path><path d="M10.2 8h3.6"></path><path d="M11 5h2"></path><path d="M9.2 18l4.4-5"></path><path d="M13.6 18l-4.4-5"></path><path d="M10.2 13l2.8-5"></path><path d="M13 13l-2.8-5"></path></svg>`,
      keywords: ['surface stack', 'surface bop', 'hole size selection', 'drillstring setup', 'wellbore volume', 'strokes', tr('Surface Stack'), tr('BOP STACK')],
      action: () => { state.flowType = 'surface'; navigateTo('surface-hole-size'); }
    },
    {
      id: 'subsea_stack',
      title: tr('Subsea Stack'),
      category: tr('BOP STACK'),
      desc: tr('BOP configuration, marine elevations, and calculations for subsea stack setups.'),
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0"></path><path d="M2 22c2-1 4-1 6 0s4 1 6 0 4-1 6 0"></path><rect x="10" y="7" width="4" height="9" rx="1"></rect><rect x="8" y="10" width="8" height="2" rx="0.5"></rect><rect x="8" y="13" width="8" height="2" rx="0.5"></rect><path d="M12 4v3"></path><circle cx="12" cy="4" r="1" fill="currentColor"></circle><path d="M7 6v10"></path><path d="M17 6v10"></path><circle cx="7" cy="11" r="1.5"></circle><circle cx="17" cy="11" r="1.5"></circle></svg>`,
      keywords: ['subsea stack', 'subsea bop', 'riser', 'water depth', 'air gap', 'marine elevations', tr('Subsea Stack'), tr('BOP STACK')],
      action: () => { state.flowType = 'subsea'; navigateTo('subsea-hole-size'); }
    },
    {
      id: 'calc_hub',
      title: tr('Calculation Hub'),
      category: tr('CALCULATOR'),
      desc: tr('Engineering calculation hub featuring 106 drilling formulas and 26 well control calculators.'),
      bgColor: 'var(--circle-calculator)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A4A28" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2.5 20.2 7.25 20.2 16.75 12 21.5 3.8 16.75 3.8 7.25"></polygon><path d="M15.5 8.5H9l3.5 3.5L9 15.5h6.5"></path></svg>`,
      keywords: ['calculation hub', 'drilling calculations', 'formulas', 'math', 'engineering', 'calculators', tr('Calculation Hub'), tr('CALCULATOR'), 'калькулятор', 'розрахунки', 'формули'],
      action: () => { calcSubState.view = 'categories'; navigateTo('drilling-calc'); }
    },
    {
      id: 'cement_job_planner',
      title: tr('Cement Job Planner'),
      category: tr('CEMENTING'),
      desc: tr('Casing, slurry volume, and wellbore cement planning.'),
      bgColor: '#D5F0EE',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F766E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V2"></path><path d="M8.5 2v15h7V2"></path><path d="M7 17h10"></path><line x1="4" y1="6.5" x2="8.5" y2="11"></line><line x1="4" y1="11.5" x2="8.5" y2="16"></line><line x1="15.5" y1="6.5" x2="20" y2="11"></line><line x1="15.5" y1="11.5" x2="20" y2="16"></line></svg>`,
      keywords: ['cement', 'cementing', 'slurry', 'casing', 'plan', 'job', 'schematic', 'annulus', tr('Cement Job Planner'), tr('CEMENTING'), 'цемент', 'цементування', 'тампонаж', 'обсадна колона'],
      action: () => {
        navigateTo('/cement-planner');
      }
    },
    {
      id: 'subsea_wellhead_cementing',
      title: tr('Subsea Wellhead Cementing'),
      category: tr('CEMENTING'),
      desc: tr('Subsea & riserless casing cement calculation with live interactive schematic.'),
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      keywords: ['cementing module', 'subsea wellhead', 'casing cementing', 'subsea cement', 'riserless', 'slurry volume', 'schematic', tr('Subsea Wellhead Cementing'), tr('CEMENTING'), 'підводне цементування', 'цемент'],
      action: () => {
        openCementingModule();
      }
    },
    {
      id: 'bit_dull_grading',
      title: tr('Bit Dull Grading'),
      category: tr('DRILL BITS'),
      desc: tr('IADC 8-factor bit dull grading calculator and wear code evaluator.'),
      bgColor: 'rgba(230, 161, 92, 0.1)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2h5l1 5h-7l1-5z"></path><path d="M6 8h12v2c0 2-1.5 4.5-2.5 6l-.5 2h-6l-.5-2C7.5 14.5 6 12 6 10V8z"></path><circle cx="8" cy="18" r="3"></circle><circle cx="16" cy="18" r="3"></circle><circle cx="12" cy="20" r="3"></circle><path d="M12 11v3"></path></svg>`,
      keywords: ['iadc', 'bit dull', 'dull grading', 'wear', 'pdc bit', 'roller cone', 'bearing', 'seal', 'gauge', 'cutting structure', tr('Bit Dull Grading'), tr('DRILL BITS'), 'долото', 'знос долота', 'бурові долота'],
      action: () => {
        if (typeof clearIADCForm === 'function') clearIADCForm();
        navigateTo('bit-dull-grading');
      }
    },
    {
      id: 'iadc_history',
      title: tr('Bit Dull Grading History'),
      category: tr('DRILL BITS'),
      desc: tr('Saved records and inspection history of graded drilling bits.'),
      bgColor: 'rgba(230, 161, 92, 0.1)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="9"></circle></svg>`,
      keywords: ['iadc history', 'bit history', 'dull records', 'inspection history', 'saved bits', tr('Bit Dull Grading History'), tr('DRILL BITS'), 'історія зносу', 'долото'],
      action: () => { navigateTo('iadc-history'); }
    },
    {
      id: 'api_tubular_overview',
      title: tr('API Tubular Data'),
      category: tr('TUBULARS'),
      desc: tr('Standard API dimensions, capacities, and weights for drillpipe, casing, and tubing.'),
      bgColor: 'var(--circle-tubular)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="4" height="4" rx="1"></rect><path d="M6 5h12"></path><path d="M6 7h12"></path><rect x="18" y="4.5" width="4" height="3" rx="0.5"></rect><rect x="2" y="10" width="4" height="4" rx="1"></rect><path d="M6 11h12"></path><path d="M6 13h12"></path><rect x="18" y="10.5" width="4" height="3" rx="0.5"></rect><rect x="2" y="16" width="4" height="4" rx="1"></rect><path d="M6 17h12"></path><path d="M6 19h12"></path><rect x="18" y="16.5" width="4" height="3" rx="0.5"></rect></svg>`,
      keywords: ['api tubular', 'casing', 'drill pipe', 'tubing', 'dimensions', 'capacities', 'weights', 'drift', 'od', 'id', tr('API Tubular Data'), tr('TUBULARS'), 'труби', 'обсадна колона', 'бурильні труби'],
      action: () => { tubularSubState.view = 'menu'; navigateTo('api-tubular'); }
    },
    {
      id: 'api_casing_table',
      title: tr('API Casing Table'),
      category: tr('TUBULARS'),
      desc: tr('BTC, LTC, STC & Premium casing specs: ID, drift, wall, burst, collapse, capacity.'),
      bgColor: 'var(--circle-surface)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#68553F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle></svg>`,
      keywords: ['api casing table', 'btc', 'ltc', 'stc', 'casing burst', 'collapse', 'drift', 'wall thickness', 'body yield', tr('API Casing Table'), tr('TUBULARS'), 'обсадні труби', 'таблиця обсадних'],
      action: () => { tubularSubState.view = 'casing'; navigateTo('api-tubular'); }
    },
    {
      id: 'api_drillpipe_table',
      title: tr('API Drill Pipe Table'),
      category: tr('TUBULARS'),
      desc: tr('OD, weight, grade, connection, class, tool joint ID, tensile, and make-up torque.'),
      bgColor: 'var(--circle-tubular)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
      keywords: ['api drill pipe', 'dp specs', 'nc50', 'tool joint', 'makeup torque', 'tensile yield strength', 'drill pipe dimensions', tr('API Drill Pipe Table'), tr('TUBULARS'), 'бурильні труби'],
      action: () => { tubularSubState.view = 'drillpipe'; navigateTo('api-tubular'); }
    },
    {
      id: 'api_tubing_table',
      title: tr('API Tubing Table'),
      category: tr('TUBULARS'),
      desc: tr('EUE, NUE & Premium tubing specifications: ID, drift, wall, burst, collapse.'),
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="2" x2="12" y2="22"></line></svg>`,
      keywords: ['api tubing table', 'eue', 'nue', 'production tubing', 'injection tubing', 'tubing burst', 'tubing collapse', tr('API Tubing Table'), tr('TUBULARS'), 'насосно-компресорні труби', 'нкт'],
      action: () => { tubularSubState.view = 'tubing'; navigateTo('api-tubular'); }
    },
    {
      id: 'api_large_casing_table',
      title: tr('API Casing/Tubing >22 in'),
      category: tr('TUBULARS'),
      desc: tr('Conductor and large surface casing sizes up to 36 inches.'),
      bgColor: 'var(--circle-stuck)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle></svg>`,
      keywords: ['large casing', 'conductor', 'surface casing', '24 inch', '30 inch', '36 inch', 'casing above 22', tr('API Casing/Tubing >22 in'), tr('TUBULARS'), 'кондуктор', 'напрямна колона'],
      action: () => { tubularSubState.view = 'large_casing'; navigateTo('api-tubular'); }
    },
    {
      id: 'stuck_pipe_assistant',
      title: tr('Stuck Pipe Assistant'),
      category: tr('DIAGNOSTICS'),
      desc: tr('Diagnostic assistant for identifying sticking mechanisms and recommended first actions.'),
      bgColor: 'var(--circle-stuck)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18M19 3v18"></path><path d="M12 3v10"></path><rect x="9.5" y="11" width="5" height="5" rx="1"></rect><line x1="12" y1="16" x2="12" y2="20"></line></svg>`,
      keywords: ['stuck pipe', 'differential sticking', 'mechanical sticking', 'free point', 'jarring', 'first actions', 'stuck pipe assistant', 'free point calculator', 'differential pressure', 'spotting fluid', 'jar placement', 'pack-off', 'key seat', 'ledge', 'undergauge', 'salt creep', tr('Stuck Pipe Assistant'), tr('DIAGNOSTICS'), 'прихоплення', 'прихоплення труб'],
      action: () => { navigateTo('stuck-pipe'); }
    },
    {
      id: 'unit_conversion',
      title: tr('Petroleum Unit Conversion'),
      category: tr('CONVERTER'),
      desc: tr('Petroleum engineering unit converter for length, volume, weight, pressure, and density across 21 categories.'),
      bgColor: 'var(--circle-conversion)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5F3F7D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 8"></path><polyline points="3 3 3 8 8 8"></polyline><path d="M3 12a9 9 0 0 0 9 9 9 9 0 0 0 6-2.3l3-2.7"></path><polyline points="21 21 21 16 16 16"></polyline></svg>`,
      keywords: ['unit conversion', 'petroleum converter', 'psi', 'bar', 'ppg', 'sg', 'bbl', 'gpm', 'pressure converter', 'volume converter', tr('Petroleum Unit Conversion'), tr('CONVERTER'), 'конвертер', 'одиниці'],
      action: () => { navigateTo('conversion'); }
    },
    {
      id: 'kill_data_sheet',
      title: tr('Kill Data Sheet'),
      category: tr('WELL CONTROL'),
      desc: tr('Comprehensive well control kill sheet with circulating pressures, strokes, and volume tracking.'),
      bgColor: 'var(--circle-wellcontrol)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A2C2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="3"></circle><line x1="12" y1="8" x2="12" y2="14"></line><line x1="9" y1="11" x2="15" y2="11"></line></svg>`,
      keywords: ['kill data sheet', 'kill sheet', 'icp', 'fcp', 'kmw', 'sidpp', 'sicp', 'strokes to bit', 'choke schedule', 'well control calculations', tr('Kill Data Sheet'), tr('WELL CONTROL'), 'глушіння', 'бланк глушіння', 'глушіння свердловини'],
      action: () => { navigateTo('kill-data-sheet'); }
    },
    {
      id: 'drilling_guide_menu',
      title: tr('Drilling Guide'),
      category: tr('REFERENCE'),
      desc: tr('Comprehensive engineering reference guide covering 11 drilling and operational domains.'),
      bgColor: 'var(--circle-quickref)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
      keywords: ['drilling guide', 'reference guide', 'handbook', 'bha', 'bits', 'casing', 'well control', 'procedures', tr('Drilling Guide'), tr('REFERENCE'), 'буріння', 'довідник з буріння'],
      action: () => { navigateTo('drilling-guide'); }
    },
    {
      id: 'quick_ref_menu',
      title: tr('Quick Reference'),
      category: tr('REFERENCE'),
      desc: tr('Quick reference tables for bit make-up torque, ring gaskets, surface wellheads, and subsea equipment.'),
      bgColor: 'var(--circle-quickref)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
      keywords: ['quick reference', 'reference tables', 'torque table', 'ring gaskets', 'surface wellhead', 'edphot', 'subsea equipment', tr('Quick Reference'), tr('REFERENCE'), 'швидкий довідник'],
      action: () => { quickRefSubState.view = 'menu'; navigateTo('quick-ref'); }
    },
    {
      id: 'clf_guide',
      title: tr('Choke Line Friction (CLF) Guide'),
      category: tr('WELL CONTROL'),
      desc: tr('Understanding Choke Line Friction measurements for subsea wells.'),
      bgColor: 'var(--circle-wellcontrol)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A2C2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>`,
      keywords: ['CLF', 'choke line friction', 'clf guide', 'subsea choke line', 'subsea well control', tr('Choke Line Friction (CLF) Guide'), tr('WELL CONTROL'), 'лінія дроселювання'],
      action: () => {
        wellControlSubState.view = 'clf-guide';
        navigateTo('well-control');
      }
    }
  ];

  items.push(...coreTools);

  // 2. Append all Drilling Calculations from drillingCalcSections & formulaDb
  if (typeof drillingCalcSections !== 'undefined' && typeof formulaDb !== 'undefined' && formulaDb.calculations) {
    const formulaMap = new Map();
    formulaDb.calculations.forEach(f => formulaMap.set(f.id, f));

    drillingCalcSections.forEach(sec => {
      sec.items.forEach(formulaId => {
        const formula = formulaMap.get(formulaId);
        if (!formula) return;
        const extraKeywords = curatedSynonymsMap[formula.id] || [];
        const transTitle = tr(formula.name);
        const transCat = tr(sec.name);
        const transDesc = tr(formula.desc || sec.desc || 'Drilling engineering formula calculation.');
        items.push({
          id: formula.id,
          title: transTitle,
          category: transCat,
          desc: transDesc,
          bgColor: 'var(--circle-tubular)',
          icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
          keywords: [sec.name, formula.name, transTitle, transCat, ...extraKeywords],
          action: () => {
            calcSubState.view = 'formula';
            calcSubState.section = 'drilling';
            calcSubState.category = 'calculations';
            calcSubState.formulaId = formula.id;
            calcSubState.search = '';
            navigateTo('drilling-calc');
          }
        });
      });
    });
  }

  // 3. Append all Well Control Calculations from wellControlCalcSections & wellControlDb
  if (typeof wellControlCalcSections !== 'undefined' && typeof wellControlDb !== 'undefined') {
    wellControlCalcSections.forEach(sec => {
      const catList = wellControlDb[sec.category] || [];
      const wcMap = new Map();
      catList.forEach(f => wcMap.set(f.id, f));

      sec.items.forEach(formulaId => {
        const formula = wcMap.get(formulaId);
        if (!formula) return;
        const extraKeywords = curatedSynonymsMap[formula.id] || [];
        const transTitle = tr(formula.name);
        const transCat = tr(sec.name);
        const transDesc = tr(formula.desc || sec.desc || 'Well control operation calculation.');
        items.push({
          id: `${sec.category}_${formula.id}`,
          title: `${transTitle}${sec.category === 'subsea' ? ' (Subsea)' : ''}`,
          category: transCat,
          desc: transDesc,
          bgColor: 'var(--circle-wellcontrol)',
          icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A2C2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="3"></circle></svg>`,
          keywords: [sec.name, sec.category, formula.name, transTitle, transCat, ...extraKeywords],
          action: () => {
            calcSubState.view = 'formula';
            calcSubState.section = 'wellcontrol';
            calcSubState.category = sec.category;
            calcSubState.formulaId = formula.id;
            calcSubState.search = '';
            navigateTo('drilling-calc');
          }
        });
      });
    });
  }

  // 4. Append all Drilling Guide & Reference Topics from drillingGuideData
  if (typeof drillingGuideData !== 'undefined') {
    for (const catKey in drillingGuideData) {
      const cat = drillingGuideData[catKey];
      (cat.items || []).forEach(item => {
        const extraKeywords = curatedSynonymsMap[item.id] || [];
        const transTitle = tr(item.name);
        const transCat = tr(cat.name);
        const transDesc = tr(cat.desc || `${cat.name} reference and operational guidelines.`);
        items.push({
          id: item.id,
          title: transTitle,
          category: transCat,
          desc: transDesc,
          bgColor: 'var(--circle-quickref)',
          icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
          keywords: [cat.name, item.name, transTitle, transCat, ...extraKeywords],
          action: () => {
            handleGuideItemClick(item.id, cat.name);
          }
        });
      });
    }
  }

  return items;
}

// Single search index cache
let _searchRegistryCache = null;
function getSearchIndex() {
  if (!_searchRegistryCache) {
    _searchRegistryCache = buildSearchRegistry();
  }
  return _searchRegistryCache;
}

// Recent searches store (persisted in localStorage)
const RecentSearchesStore = {
  KEY: 'recentToolkitSearches',
  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },
  add(term) {
    if (!term || typeof term !== 'string') return;
    const clean = term.trim();
    if (!clean) return;
    let list = this.get().filter(item => item.toLowerCase() !== clean.toLowerCase());
    list.unshift(clean);
    list = list.slice(0, 5);
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
    } catch (e) {}
  },
  remove(term) {
    const clean = String(term).toLowerCase().trim();
    const list = this.get().filter(item => item.toLowerCase() !== clean);
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
    } catch (e) {}
  },
  clear() {
    try {
      localStorage.removeItem(this.KEY);
    } catch (e) {}
  }
};

// Render recent search chips
function renderRecentSearches() {
  const container = document.getElementById('home-search-recent');
  if (!container) return;

  const recents = RecentSearchesStore.get();
  if (recents.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="search-recent-header">
      <span>Recent Searches</span>
      <button type="button" class="search-recent-clear-all" id="clear-all-recents-btn">Clear All</button>
    </div>
    <div class="search-recent-chips">
      ${recents.map(r => `
        <span class="search-recent-chip" data-query="${escapeHTML(r)}">
          <span>${escapeHTML(r)}</span>
          <span class="search-recent-chip-remove" data-remove="${escapeHTML(r)}" title="Remove">&times;</span>
        </span>
      `).join('')}
    </div>
  `;
  container.style.display = 'flex';

  const clearBtn = container.querySelector('#clear-all-recents-btn');
  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.stopPropagation();
      RecentSearchesStore.clear();
      container.style.display = 'none';
      container.innerHTML = '';
    };
  }

  container.querySelectorAll('.search-recent-chip').forEach(chip => {
    chip.onclick = (e) => {
      if (e.target.classList.contains('search-recent-chip-remove')) {
        e.stopPropagation();
        const term = e.target.getAttribute('data-remove');
        RecentSearchesStore.remove(term);
        renderRecentSearches();
        return;
      }
      const q = chip.getAttribute('data-query');
      const searchInput = document.getElementById('home-search-input') || document.querySelector('.search-input');
      if (searchInput) {
        searchInput.value = q;
        searchInput.focus();
        handleSearch({ target: searchInput }, true);
      }
    };
  });
}

// Pure search function (prefix, multi-word, abbreviation, keyword, typo-tolerant, ranked)
function searchTools(rawQuery, registry) {
  if (!rawQuery) return [];
  const query = normalizeSearchString(rawQuery);
  if (!query) return [];

  const queryTokens = query.split(' ').filter(Boolean);
  const queryCondensed = query.replace(/\s+/g, '');
  const isSingleChar = query.length === 1;

  const scoredItems = [];

  for (let i = 0; i < registry.length; i++) {
    const item = registry[i];
    const normTitle = item.normTitle || (item.normTitle = normalizeSearchString(item.title));
    const normCategory = item.normCategory || (item.normCategory = normalizeSearchString(item.category));
    const normDesc = item.normDesc || (item.normDesc = normalizeSearchString(item.desc));
    const normKeywords = item.normKeywords || (item.normKeywords = (item.keywords || []).map(k => normalizeSearchString(k)));
    const titleTokens = item.titleTokens || (item.titleTokens = normTitle.split(' ').filter(Boolean));
    const condensedTitle = item.condensedTitle || (item.condensedTitle = normTitle.replace(/\s+/g, ''));

    let score = 0;
    let matched = false;

    // 1. Single character search: exact prefix on title, title words, keywords, category
    if (isSingleChar) {
      if (normTitle.startsWith(query)) {
        score = 1000;
        matched = true;
      } else if (titleTokens.some(t => t.startsWith(query))) {
        score = 700;
        matched = true;
      } else if (normKeywords.some(k => k.startsWith(query))) {
        score = 500;
        matched = true;
      } else if (normCategory.startsWith(query)) {
        score = 300;
        matched = true;
      }
      if (matched) {
        scoredItems.push({ item, score });
      }
      continue;
    }

    // 2. Exact matches & Title Acronyms
    const titleInitials = titleTokens.map(t => t[0]).filter(Boolean).join('');
    if (normTitle === query || condensedTitle === queryCondensed) {
      score = 1300;
      matched = true;
    } else if (titleInitials === query || (query.length >= 3 && titleInitials.startsWith(query))) {
      // Direct title acronym match (e.g. ICP -> Initial Circulating Pressure, KMW -> Kill Mud Weight)
      score = 1250;
      matched = true;
    } else if (item.id && item.id.toLowerCase() === query) {
      // Exact tool ID match
      score = 1200;
      matched = true;
    } else if (normTitle.startsWith(query) || condensedTitle.startsWith(queryCondensed)) {
      score = 1000;
      matched = true;
    } else if (normKeywords.some(k => k === query || k.replace(/\s+/g, '') === queryCondensed)) {
      score = 900;
      matched = true;
    } else if (normKeywords.some(k => k.startsWith(query) || k.replace(/\s+/g, '').startsWith(queryCondensed))) {
      score = 750;
      matched = true;
    } else if (titleTokens.some(t => t.startsWith(query))) {
      score = 650;
      matched = true;
    } else if (normTitle.includes(query)) {
      score = 500;
      matched = true;
    } else if (normCategory.startsWith(query)) {
      score = 400;
      matched = true;
    } else if (normKeywords.some(k => k.includes(query))) {
      score = 350;
      matched = true;
    } else if (normDesc.includes(query)) {
      score = 250;
      matched = true;
    }

    // 3. Multi-word check
    if (!matched) {
      const allTokensMatch = queryTokens.every(qToken => {
        if (titleTokens.some(t => t.startsWith(qToken) || t.includes(qToken))) return true;
        if (normKeywords.some(k => k.includes(qToken) || k.startsWith(qToken))) return true;
        if (normCategory.includes(qToken)) return true;
        if (normDesc.includes(qToken)) return true;
        if (qToken.length >= 4) {
          if (titleTokens.some(t => isWordFuzzyMatch(qToken, t))) return true;
          if (normKeywords.some(k => isWordFuzzyMatch(qToken, k))) return true;
        }
        return false;
      });

      if (allTokensMatch) {
        matched = true;
        score = 200;
        if (normTitle.startsWith(queryTokens[0]) || titleTokens.some(t => t.startsWith(queryTokens[0]))) {
          score += 150;
        }
      }
    }

    // 4. Fuzzy fallback (e.g. "leek off", "cemen")
    if (!matched && queryTokens.length <= 3) {
      let fuzzyScore = 0;
      let allFuzzy = true;
      for (const qToken of queryTokens) {
        let tokenFuzzy = false;
        if (qToken.length >= 4) {
          for (const t of titleTokens) {
            if (t.length >= 3) {
              const d = getLevenshteinDistance(qToken, t.slice(0, qToken.length + 1));
              const maxD = qToken.length > 6 ? 2 : 1;
              if (d <= maxD) {
                tokenFuzzy = true;
                fuzzyScore += (80 - d * 20);
                break;
              }
            }
          }
          if (!tokenFuzzy) {
            for (const k of normKeywords) {
              const d = getLevenshteinDistance(qToken, k.slice(0, qToken.length + 1));
              const maxD = qToken.length > 6 ? 2 : 1;
              if (d <= maxD) {
                tokenFuzzy = true;
                fuzzyScore += (70 - d * 20);
                break;
              }
            }
          }
        }
        if (!tokenFuzzy) {
          allFuzzy = false;
          break;
        }
      }
      if (allFuzzy && fuzzyScore > 0) {
        matched = true;
        score = fuzzyScore;
      }
    }

    if (matched) {
      scoredItems.push({ item, score });
    }
  }

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.map(si => si.item);
}

// Global search handling with debounce and clear button state
let _searchDebounceTimer = null;

function handleSearch(e, immediate = false) {
  const rawQuery = (e && e.target) ? e.target.value : (state.searchQuery || '');
  const trimmed = rawQuery.trim();
  state.searchQuery = trimmed;

  const searchInput = document.getElementById('home-search-input') || document.querySelector('.search-input');
  const clearBtn = document.getElementById('home-search-clear');
  const resultsContainer = document.getElementById('global-search-results');
  const recentContainer = document.getElementById('home-search-recent');
  const menuGrid = document.querySelector('.menu-grid');

  if (clearBtn) {
    clearBtn.style.display = trimmed.length > 0 ? 'flex' : 'none';
  }

  if (trimmed === '') {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
    state.savedHomeSearchQuery = '';
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
    }
    if (menuGrid) {
      menuGrid.style.display = '';
    }
    if (document.activeElement === searchInput) {
      renderRecentSearches();
    } else if (recentContainer) {
      recentContainer.style.display = 'none';
    }
    return;
  }

  // Hide recent searches and main menu grid while searching
  if (recentContainer) recentContainer.style.display = 'none';
  if (menuGrid) menuGrid.style.display = 'none';

  const doSearch = () => {
    if (!resultsContainer) return;
    const registry = getSearchIndex();
    const matched = searchTools(trimmed, registry);

    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'flex';

    if (matched.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <span class="no-results-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </span>
          <div class="no-results-text" style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">
            ${(window.I18n ? window.I18n.translate('No tools found for "%s"') : null) ? window.I18n.translate('No tools found for "%s"').replace('%s', escapeHTML(trimmed)) : `No tools found for "${escapeHTML(trimmed)}"`}
          </div>
          <div class="no-results-hint" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: -4px;">
            ${(window.I18n ? window.I18n.translate('Try another term or search by abbreviation (e.g. LOT, ICP, KMW, ECD).') : null) || 'Try another term or search by abbreviation (e.g. LOT, ICP, KMW, ECD).'}
          </div>
        </div>
      `;
      return;
    }

    matched.forEach(item => {
      const el = document.createElement('div');
      el.className = 'search-result-item';

      const highlightedTitle = highlightMatches(item.title, trimmed);

      el.innerHTML = `
        <div class="search-result-left">
          <div class="search-result-icon" style="background-color: ${item.bgColor}">
            ${item.icon}
          </div>
          <div class="search-result-info">
            <div class="search-result-meta">
              <span class="search-result-badge">${escapeHTML(item.category)}</span>
            </div>
            <div class="search-result-title">${highlightedTitle}</div>
            <div class="search-result-desc">${escapeHTML(item.desc)}</div>
          </div>
        </div>
        <span class="search-result-chevron">&rsaquo;</span>
      `;

      el.addEventListener('click', () => {
        RecentSearchesStore.add(trimmed);
        state.openedFromHomeSearch = true;
        state.savedHomeSearchQuery = trimmed;
        item.action();
      });

      resultsContainer.appendChild(el);
    });
  };

  if (immediate) {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
    doSearch();
  } else {
    if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
    _searchDebounceTimer = setTimeout(doSearch, 120);
  }
}

// Controller to initialize Home search events
function initHomeSearch() {
  const searchInput = document.getElementById('home-search-input') || document.querySelector('.search-input');
  const clearBtn = document.getElementById('home-search-clear');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e, false));

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = (searchInput.value || '').trim();
        if (query) {
          const registry = getSearchIndex();
          const matched = searchTools(query, registry);
          if (matched.length > 0) {
            RecentSearchesStore.add(query);
            state.openedFromHomeSearch = true;
            state.savedHomeSearchQuery = query;
            searchInput.blur();
            matched[0].action();
          }
        }
      }
    });

    searchInput.addEventListener('focus', () => {
      if (!searchInput.value || searchInput.value.trim() === '') {
        renderRecentSearches();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchInput) {
        searchInput.value = '';
        searchInput.blur();
        handleSearch({ target: searchInput }, true);
      }
    });
  }
}


// Toast helper
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Screen Rendering router

// Screen Rendering router

function renderScreen() {
  // Hide all screens
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));

  // Setup the active screen
  const screenId = state.currentScreen;
  const activeScreenEl = document.getElementById(`screen-${screenId}`);

  if (activeScreenEl) {
    activeScreenEl.classList.add('active');
    activeScreenEl.classList.remove(
      'animate-fade-in', 'animate-slide-down',
      'animate-slide-in-right', 'animate-slide-in-left'
    );

    // Trigger reflow to restart animation reliably
    void activeScreenEl.offsetWidth;

    // Reset active screen scroll position and collapsing header state
    const scroller = activeScreenEl.querySelector('.scroller') || activeScreenEl;
    if (scroller) scroller.scrollTop = 0;
    if (window.CollapsingHeader) {
      window.CollapsingHeader.reset(activeScreenEl);
    }

    // Scroll to top on every screen transition — after DOM paint and reflow
    setTimeout(() => {
      try {
        const scroller = activeScreenEl.querySelector('.scroller') || activeScreenEl;
        if (scroller) scroller.scrollTop = 0;
        if (window.CollapsingHeader) {
          window.CollapsingHeader.reset(activeScreenEl);
        }
      } catch(e) {}
    }, 50);

    if (screenId === 'cement-planner-subsea' || screenId === 'cementing' || screenId === 'cement-planner-surface') {
      // Do not apply slide animations to cementing screen: persistent transform prevents sticky/fixed header from staying pinned to viewport
    } else if (screenId === 'kill-data-sheet') {
      activeScreenEl.classList.add('animate-slide-down');
    } else if (!window._isInitialRenderCompleted) {
      // Do NOT animate the very first screen on cold boot!
      // If we animate it from opacity 0, it overlaps with the splash screen fade out, causing a white flash!
      window._isInitialRenderCompleted = true;
    } else if (_navDirection === 'back') {
      activeScreenEl.classList.add('animate-slide-in-left');
    } else if (_navDirection === 'forward') {
      activeScreenEl.classList.add('animate-slide-in-right');
    }

    activeScreenEl.addEventListener('animationend', () => {
      activeScreenEl.classList.remove('animate-slide-in-right', 'animate-slide-in-left', 'animate-slide-down', 'animate-fade-in');
    }, { once: true });

    // Reset direction
    _navDirection = 'forward';
  }

  // Hide Search bar if not on Dashboard
  const searchBar = document.querySelector('.search-container');
  if (screenId === 'dashboard') {
    searchBar.style.display = 'block';
  } else {
    searchBar.style.display = 'none';
  }

  // Mobile layout toggles: Hide global top-bar on inner sub-screens
  const topBar = document.querySelector('.top-bar');
  const appContainer = document.querySelector('.app-container');
  const primaryScreens = ['dashboard'];

  if (topBar) {
    if (primaryScreens.includes(screenId)) {
      topBar.style.display = 'flex';
      if (appContainer) appContainer.classList.add('has-top-bar');
    } else {
      topBar.style.display = 'none';
      if (appContainer) appContainer.classList.remove('has-top-bar');
    }
  }

  if (screenId === 'cement-planner-subsea' || screenId === 'cementing' || screenId === 'cement-planner-surface') {
    if (appContainer) appContainer.classList.add('cementing-active');
  } else {
    if (appContainer) appContainer.classList.remove('cementing-active', 'cementing-job-active');
  }

  // Dynamically toggle visibility of the back button on primary screens
  const activeScreenHeaderBtn = activeScreenEl ? activeScreenEl.querySelector('.back-btn') : null;
  if (activeScreenHeaderBtn) {
    if (primaryScreens.includes(screenId)) {
      // In drilling-calc, show back button only if we are in list or formula sub-view or have search query active
      if (screenId === 'drilling-calc' && calcSubState.view !== 'categories') {
        activeScreenHeaderBtn.style.visibility = 'visible';
      } else {
        activeScreenHeaderBtn.style.visibility = 'hidden';
      }
    } else {
      activeScreenHeaderBtn.style.visibility = 'visible';
    }
  }

  // Dynamic content builders per screen
  switch (screenId) {
    case 'surface-hole-size':
    case 'subsea-hole-size':
      renderHoleSizeSelection();
      break;
    case 'surface-drillstring':
    case 'subsea-drillstring':
      renderDrillstringSetup();
      break;
    case 'surface-ref-values':
    case 'subsea-ref-values':
      renderReferenceValues();
      break;
    case 'surface-calculations':
    case 'subsea-calculations':
      renderCalculations();
      break;
    case 'api-tubular':
      renderAPITubularScreen();
      break;
    case 'stuck-pipe':
      renderStuckPipeScreen();
      break;
    case 'conversion':
      renderConversionScreen();
      break;
    case 'drilling-calc':
      renderDrillingCalcScreen();
      break;
    case 'well-control':
      renderWellControlScreen();
      break;
    case 'kill-data-sheet':
      renderKillDataSheet();
      break;
    case 'quick-ref':
      renderQuickRefScreen();
      break;
    case 'settings':
      renderSettingsScreen();
      break;
    case 'drilling-guide':
      renderDrillingGuideScreen();
      break;
    case 'drilling-guide-detail':
      renderDrillingGuideDetailScreen();
      break;
    case 'bit-dull-grading':
      // Initialize location dropdown based on current bit type selection
      setTimeout(() => { if (window.onBitTypeChanged) window.onBitTypeChanged(); }, 0);
      break;
    case 'iadc-history':
      renderBitDullGradingHistory();
      break;
    case 'cement-planner-subsea':
    case 'cementing':
      renderCementingScreen();
      break;
    case 'cement-planner-surface':
      if (typeof renderSurfaceCementingScreen === 'function') renderSurfaceCementingScreen();
      break;
  }
}

// ==========================================
// SCREEN 1: Hole Size Selection
// ==========================================
function renderHoleSizeSelection() {
  const container = document.getElementById(`hole-sizes-container-${state.flowType}`);
  container.innerHTML = '';

  const standardSizes = [
    { label: '26"', val: '26' },
    { label: '17 ½"', val: '17.5' },
    { label: '12 ¼"', val: '12.25' },
    { label: '8 ½"', val: '8.5' }
  ];

  // Grid for standard sizes
  const grid = document.createElement('div');
  grid.className = 'sizes-grid';

  standardSizes.forEach(size => {
    const card = document.createElement('div');
    card.className = `size-card ${state.selectedHoleSize === size.val && !state.customHoleSize ? 'active' : ''}`;
    card.innerHTML = `
      <div class="size-card-title">${size.label}</div>
      <div class="size-card-subtitle">Standard Hole</div>
    `;
    card.addEventListener('click', () => {
      state.selectedHoleSize = size.val;
      state.customHoleSize = '';
      showToast(`Selected hole size: ${size.label}`);
      navigateTo(`${state.flowType}-drillstring`);
    });
    grid.appendChild(card);
  });

  // Custom size card
  const customCard = document.createElement('div');
  const hasCustom = !!state.customHoleSize;
  customCard.className = `size-card ${hasCustom ? 'active' : ''}`;
  customCard.innerHTML = `
    <div class="size-card-title">${hasCustom ? state.customHoleSize + '"' : 'Custom'}</div>
    <div class="size-card-subtitle">Custom Hole</div>
  `;

  customCard.addEventListener('click', () => {
    // Show custom input section and focus it
    const inputContainer = document.getElementById(`custom-hole-input-container-${state.flowType}`);
    if (inputContainer) {
      inputContainer.style.display = 'block';
      const input = document.getElementById(`custom-hole-input-${state.flowType}`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // Highlight custom card as active
    container.querySelectorAll('.size-card').forEach(c => c.classList.remove('active'));
    customCard.classList.add('active');
  });
  grid.appendChild(customCard);

  container.appendChild(grid);

  // Custom Input group (Initially hidden unless custom is selected)
  const customGroup = document.createElement('div');
  customGroup.id = `custom-hole-input-container-${state.flowType}`;
  customGroup.className = 'form-group content-card';
  customGroup.style.display = hasCustom ? 'block' : 'none';
  customGroup.innerHTML = `
    <label style="font-size:0.85rem; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:block;">Custom Hole Size Input</label>
    <div style="display:flex; gap:10px;">
      <input type="number" step="0.01" class="form-input" id="custom-hole-input-${state.flowType}" 
             placeholder="e.g. 14.75" value="${state.customHoleSize}" style="margin-bottom:0; flex:1;">
      <button class="btn btn-primary" id="custom-hole-go-${state.flowType}" style="padding:12px 24px; font-size:0.9rem; margin-bottom:0;">Next</button>
    </div>
  `;
  container.appendChild(customGroup);

  document.getElementById(`custom-hole-go-${state.flowType}`).addEventListener('click', () => {
    const inputVal = document.getElementById(`custom-hole-input-${state.flowType}`).value;
    if (inputVal && parseFloat(inputVal) > 0) {
      state.selectedHoleSize = inputVal;
      state.customHoleSize = inputVal;
      showToast(`Custom hole size set: ${inputVal}"`);
      navigateTo(`${state.flowType}-drillstring`);
    } else {
      showToast("Please enter a valid hole size.");
    }
  });

  // If subsea stack, add Choke Line Friction card below customGroup
  if (state.flowType === 'subsea') {
    const clfGuideCard = document.createElement('div');
    clfGuideCard.className = 'content-card compact-card';
    clfGuideCard.style.marginTop = '20px';
    clfGuideCard.style.borderLeft = '4px solid var(--accent-color)';
    clfGuideCard.style.cursor = 'pointer';
    clfGuideCard.style.padding = '12px 14px';

    clfGuideCard.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="background-color: var(--circle-stuck); width: 36px; height: 36px; border-radius: 50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div style="flex:1;">
          <h3 style="font-size:0.85rem; font-weight:700; color:var(--text-primary); margin:0;">How to take CLF's</h3>
          <p style="font-size:0.7rem; color:var(--text-secondary); margin:2px 0 0 0; line-height:1.3;">Understanding Choke Line Friction measurements for subsea wells</p>
        </div>
        <span style="font-size:1.4rem; color:var(--text-secondary);">&rsaquo;</span>
      </div>
    `;

    clfGuideCard.onclick = () => {
      wellControlSubState.fromScreen = `${state.flowType}-hole-size`;
      wellControlSubState.view = 'clf-guide';
      navigateTo('well-control');
    };
    container.appendChild(clfGuideCard);
  }
}

// ==========================================
// SCREEN 2: Drillstring Setup
// ==========================================
function renderDrillstringSetup() {
  const flow = state.flowType;
  const wrapper = document.getElementById(`drillstring-form-wrapper-${flow}`);
  wrapper.innerHTML = `
    <div class="form-group">
      <label>Type of DC</label>
      <div class="select-wrapper">
        <select class="form-select" id="dc-type-sel-${flow}">
          <option value="1" ${state.drillstring.dcType === '1' ? 'selected' : ''}>DC String Type 1</option>
          <option value="2" ${state.drillstring.dcType === '2' ? 'selected' : ''}>DC String Type 2</option>
          <option value="3" ${state.drillstring.dcType === '3' ? 'selected' : ''}>DC String Type 3</option>
        </select>
      </div>
    </div>
    
    <div id="dc-sizes-rows-container-${flow}"></div>

    <div class="form-group">
      <label>HWDP Size (inches)</label>
      <div class="select-wrapper">
        <select class="form-select" id="hwdp-size-sel-${flow}">
          <option value="6-5/8" ${state.drillstring.hwdpSize === '6-5/8' ? 'selected' : ''}>6-5/8"</option>
          <option value="5-1/2" ${state.drillstring.hwdpSize === '5-1/2' ? 'selected' : ''}>5-1/2"</option>
          <option value="5" ${state.drillstring.hwdpSize === '5' ? 'selected' : ''}>5"</option>
          <option value="4-1/2" ${state.drillstring.hwdpSize === '4-1/2' ? 'selected' : ''}>4-1/2"</option>
          <option value="3-1/2" ${state.drillstring.hwdpSize === '3-1/2' ? 'selected' : ''}>3-1/2"</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label>Type of DP</label>
      <div class="select-wrapper">
        <select class="form-select" id="dp-type-sel-${flow}">
          <option value="1" ${state.drillstring.dpType === '1' ? 'selected' : ''}>DP String Type 1</option>
          <option value="2" ${state.drillstring.dpType === '2' ? 'selected' : ''}>DP String Type 2</option>
          <option value="3" ${state.drillstring.dpType === '3' ? 'selected' : ''}>DP String Type 3</option>
        </select>
      </div>
    </div>
    
    <div id="dp-sizes-rows-container-${flow}"></div>
  `;

  const dcContainer = document.getElementById(`dc-sizes-rows-container-${flow}`);
  const dpContainer = document.getElementById(`dp-sizes-rows-container-${flow}`);

  const updateDCRows = (typeVal) => {
    dcContainer.innerHTML = '';
    const type = parseInt(typeVal);
    for (let i = 1; i <= type; i++) {
      const fieldId = i === 1 ? `dc-size-sel-${flow}` : `dc-size-sel-${i}-${flow}`;
      const stateVal = i === 1 ? state.drillstring.dcSize : (i === 2 ? state.drillstring.dcSize2 : state.drillstring.dcSize3);
      const labelText = type === 1 ? 'DC Size (inches)' : `DC Size ${i} (inches)`;
      const row = document.createElement('div');
      row.className = 'form-group';
      row.innerHTML = `
        <label>${labelText}</label>
        <div class="select-wrapper">
          <select class="form-select" id="${fieldId}">
            <option value="9-1/2" ${stateVal === '9-1/2' ? 'selected' : ''}>9-1/2"</option>
            <option value="8" ${stateVal === '8' ? 'selected' : ''}>8"</option>
            <option value="6-3/4" ${stateVal === '6-3/4' ? 'selected' : ''}>6-3/4"</option>
            <option value="6-1/2" ${stateVal === '6-1/2' ? 'selected' : ''}>6-1/2"</option>
            <option value="4-3/4" ${stateVal === '4-3/4' ? 'selected' : ''}>4-3/4"</option>
            <option value="3-1/2" ${stateVal === '3-1/2' ? 'selected' : ''}>3-1/2"</option>
          </select>
        </div>
      `;
      dcContainer.appendChild(row);
    }
  };

  const updateDPRows = (typeVal) => {
    dpContainer.innerHTML = '';
    const type = parseInt(typeVal);
    for (let i = 1; i <= type; i++) {
      const fieldId = i === 1 ? `dp-size-sel-${flow}` : `dp-size-sel-${i}-${flow}`;
      const stateVal = i === 1 ? state.drillstring.dpSize : (i === 2 ? state.drillstring.dpSize2 : state.drillstring.dpSize3);
      const labelText = type === 1 ? 'DP Size (inches)' : `DP Size ${i} (inches)`;
      const row = document.createElement('div');
      row.className = 'form-group';
      row.innerHTML = `
        <label>${labelText}</label>
        <div class="select-wrapper">
          <select class="form-select" id="${fieldId}">
            <option value="6-5/8" ${stateVal === '6-5/8' ? 'selected' : ''}>6-5/8"</option>
            <option value="5-1/2" ${stateVal === '5-1/2' ? 'selected' : ''}>5-1/2"</option>
            <option value="5" ${stateVal === '5' ? 'selected' : ''}>5"</option>
            <option value="4-1/2" ${stateVal === '4-1/2' ? 'selected' : ''}>4-1/2"</option>
            <option value="3-1/2" ${stateVal === '3-1/2' ? 'selected' : ''}>3-1/2"</option>
          </select>
        </div>
      `;
      dpContainer.appendChild(row);
    }
  };

  const dcTypeSel = document.getElementById(`dc-type-sel-${flow}`);
  const dpTypeSel = document.getElementById(`dp-type-sel-${flow}`);

  dcTypeSel.addEventListener('change', (e) => updateDCRows(e.target.value));
  dpTypeSel.addEventListener('change', (e) => updateDPRows(e.target.value));

  // Initialize
  updateDCRows(dcTypeSel.value);
  updateDPRows(dpTypeSel.value);

  // Bind Buttons
  const saveBtn = document.getElementById(`drillstring-save-${flow}`);
  const goBtn = document.getElementById(`drillstring-go-${flow}`);

  // Initially hide the GO button and ensure Save button is highlighted
  goBtn.style.display = 'none';
  saveBtn.classList.remove('btn-secondary');
  saveBtn.classList.add('btn-primary');

  // Listen to change events inside the form to hide the GO button if config changes
  wrapper.addEventListener('change', () => {
    goBtn.style.display = 'none';
    saveBtn.classList.remove('btn-secondary');
    saveBtn.classList.add('btn-primary');
  });

  const handleFormSave = () => {
    const refDS = state.reference.drillstring || {};
    const refHole = state.reference.selectedHoleSize;

    state.drillstring.dcType = document.getElementById(`dc-type-sel-${flow}`).value;
    state.drillstring.dcSize = document.getElementById(`dc-size-sel-${flow}`).value;
    if (document.getElementById(`dc-size-sel-2-${flow}`)) {
      state.drillstring.dcSize2 = document.getElementById(`dc-size-sel-2-${flow}`).value;
    }
    if (document.getElementById(`dc-size-sel-3-${flow}`)) {
      state.drillstring.dcSize3 = document.getElementById(`dc-size-sel-3-${flow}`).value;
    }

    state.drillstring.hwdpSize = document.getElementById(`hwdp-size-sel-${flow}`).value;

    state.drillstring.dpType = document.getElementById(`dp-type-sel-${flow}`).value;
    state.drillstring.dpSize = document.getElementById(`dp-size-sel-${flow}`).value;
    if (document.getElementById(`dp-size-sel-2-${flow}`)) {
      state.drillstring.dpSize2 = document.getElementById(`dp-size-sel-2-${flow}`).value;
    }
    if (document.getElementById(`dp-size-sel-3-${flow}`)) {
      state.drillstring.dpSize3 = document.getElementById(`dp-size-sel-3-${flow}`).value;
    }

    // Resolve capacities from DB into reference state only if the size changed
    if (!refDS.dcSize || state.drillstring.dcSize !== refDS.dcSize) {
      state.reference.capacities.DC = getPipeCapacity('DC', state.drillstring.dcSize);
    }
    if (!refDS.dcSize2 || state.drillstring.dcSize2 !== refDS.dcSize2) {
      state.reference.capacities.DC2 = getPipeCapacity('DC', state.drillstring.dcSize2);
    }
    if (!refDS.dcSize3 || state.drillstring.dcSize3 !== refDS.dcSize3) {
      state.reference.capacities.DC3 = getPipeCapacity('DC', state.drillstring.dcSize3);
    }
    if (!refDS.hwdpSize || state.drillstring.hwdpSize !== refDS.hwdpSize) {
      state.reference.capacities.HWDP = getPipeCapacity('HWDP', state.drillstring.hwdpSize);
    }
    if (!refDS.dpSize || state.drillstring.dpSize !== refDS.dpSize) {
      state.reference.capacities.DP = getPipeCapacity('DP', state.drillstring.dpSize);
    }
    if (!refDS.dpSize2 || state.drillstring.dpSize2 !== refDS.dpSize2) {
      state.reference.capacities.DP2 = getPipeCapacity('DP', state.drillstring.dpSize2);
    }
    if (!refDS.dpSize3 || state.drillstring.dpSize3 !== refDS.dpSize3) {
      state.reference.capacities.DP3 = getPipeCapacity('DP', state.drillstring.dpSize3);
    }

    // Resolve Open Hole annular volumes
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.dcSize || state.drillstring.dcSize !== refDS.dcSize) {
      state.reference.openHoleAnnular.DC = getOHAnnularCapacity(state.selectedHoleSize, 'DC', state.drillstring.dcSize);
    }
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.dcSize2 || state.drillstring.dcSize2 !== refDS.dcSize2) {
      state.reference.openHoleAnnular.DC2 = getOHAnnularCapacity(state.selectedHoleSize, 'DC', state.drillstring.dcSize2);
    }
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.dcSize3 || state.drillstring.dcSize3 !== refDS.dcSize3) {
      state.reference.openHoleAnnular.DC3 = getOHAnnularCapacity(state.selectedHoleSize, 'DC', state.drillstring.dcSize3);
    }
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.hwdpSize || state.drillstring.hwdpSize !== refDS.hwdpSize) {
      state.reference.openHoleAnnular.HWDP = getOHAnnularCapacity(state.selectedHoleSize, 'HWDP', state.drillstring.hwdpSize);
    }
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.dpSize || state.drillstring.dpSize !== refDS.dpSize) {
      state.reference.openHoleAnnular.DP = getOHAnnularCapacity(state.selectedHoleSize, 'DP', state.drillstring.dpSize);
    }
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.dpSize2 || state.drillstring.dpSize2 !== refDS.dpSize2) {
      state.reference.openHoleAnnular.DP2 = getOHAnnularCapacity(state.selectedHoleSize, 'DP', state.drillstring.dpSize2);
    }
    if (!refHole || state.selectedHoleSize !== refHole || !refDS.dpSize3 || state.drillstring.dpSize3 !== refDS.dpSize3) {
      state.reference.openHoleAnnular.DP3 = getOHAnnularCapacity(state.selectedHoleSize, 'DP', state.drillstring.dpSize3);
    }

    // Auto-detect previous casing and resolve Casing annular volumes
    const prevCasing = DB.holeToPreviousCasing[state.selectedHoleSize] || '20';
    const oldPrevCasing = refHole ? (DB.holeToPreviousCasing[refHole] || '20') : null;
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.dcSize || state.drillstring.dcSize !== refDS.dcSize) {
      state.reference.casingAnnular.DC = getCasingAnnularCapacity(prevCasing, 'DC', state.drillstring.dcSize);
    }
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.dcSize2 || state.drillstring.dcSize2 !== refDS.dcSize2) {
      state.reference.casingAnnular.DC2 = getCasingAnnularCapacity(prevCasing, 'DC', state.drillstring.dcSize2);
    }
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.dcSize3 || state.drillstring.dcSize3 !== refDS.dcSize3) {
      state.reference.casingAnnular.DC3 = getCasingAnnularCapacity(prevCasing, 'DC', state.drillstring.dcSize3);
    }
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.hwdpSize || state.drillstring.hwdpSize !== refDS.hwdpSize) {
      state.reference.casingAnnular.HWDP = getCasingAnnularCapacity(prevCasing, 'HWDP', state.drillstring.hwdpSize);
    }
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.dpSize || state.drillstring.dpSize !== refDS.dpSize) {
      state.reference.casingAnnular.DP = getCasingAnnularCapacity(prevCasing, 'DP', state.drillstring.dpSize);
    }
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.dpSize2 || state.drillstring.dpSize2 !== refDS.dpSize2) {
      state.reference.casingAnnular.DP2 = getCasingAnnularCapacity(prevCasing, 'DP', state.drillstring.dpSize2);
    }
    if (!refHole || prevCasing !== oldPrevCasing || !refDS.dpSize3 || state.drillstring.dpSize3 !== refDS.dpSize3) {
      state.reference.casingAnnular.DP3 = getCasingAnnularCapacity(prevCasing, 'DP', state.drillstring.dpSize3);
    }

    // Subsea specific capacities
    if (state.flowType === 'subsea') {
      if (!refDS.dpSize || state.drillstring.dpSize !== refDS.dpSize) {
        state.reference.riserAnnular = DB.casingVolumes.RISER[`${state.drillstring.dpSize}_DP`] || DB.casingVolumes.RISER["5_DP"];
        state.reference.chokeCapacity = DB.pipeData["CHOKE LINE"].capacity;
      }
    }

    // Save to localStorage
    localStorage.setItem('drillstringSetup', JSON.stringify(state.drillstring));
    localStorage.setItem('selectedHoleSize', state.selectedHoleSize);
  };

  saveBtn.onclick = () => {
    handleFormSave();
    showToast("Drillstring setup configuration saved.");
    goBtn.style.display = 'flex';
    saveBtn.classList.remove('btn-primary');
    saveBtn.classList.add('btn-secondary');
  };

  goBtn.onclick = () => {
    handleFormSave();
    navigateTo(`${state.flowType}-ref-values`);
  };
}

// ==========================================
// SCREEN 3: Reference Values
// ==========================================
function renderReferenceValues() {
  const container = document.getElementById(`ref-values-container-${state.flowType}`);
  container.innerHTML = '';

  // Render Unit Toggle at top
  const toggleWrapper = document.createElement('div');
  toggleWrapper.className = 'segmented-control';
  toggleWrapper.innerHTML = `
    <button class="segmented-control-btn ${state.globalUnit === 'L/m' ? 'active' : ''}" data-unit="L/m">L/m (Metric)</button>
    <button class="segmented-control-btn ${state.globalUnit === 'bbl/m' ? 'active' : ''}" data-unit="bbl/m">bbl/m</button>
    <button class="segmented-control-btn ${state.globalUnit === 'bbl/ft' ? 'active' : ''}" data-unit="bbl/ft">bbl/ft (US)</button>
  `;
  container.appendChild(toggleWrapper);

  // Add toggle event listeners
  toggleWrapper.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const oldUnit = state.globalUnit;
      const newUnit = e.target.getAttribute('data-unit');
      if (newUnit === oldUnit) return;

      // Update unit
      state.globalUnit = newUnit;
      localStorage.setItem('globalUnit', newUnit);

      // Convert active calculations inputs if unit changes depth scale (meters <-> feet)
      if (oldUnit !== 'bbl/ft' && newUnit === 'bbl/ft') {
        // Meters to Feet
        state.calcInputs.holeMD = (state.calcInputs.holeMD * 3.28084).toFixed(1);
        state.calcInputs.holeTVD = (state.calcInputs.holeTVD * 3.28084).toFixed(1);
        state.calcInputs.shoeMD = (state.calcInputs.shoeMD * 3.28084).toFixed(1);
        state.calcInputs.shoeTVD = (state.calcInputs.shoeTVD * 3.28084).toFixed(1);
        state.calcInputs.dcLength = (state.calcInputs.dcLength * 3.28084).toFixed(1);
        state.calcInputs.dcLength2 = (state.calcInputs.dcLength2 * 3.28084).toFixed(1);
        state.calcInputs.dcLength3 = (state.calcInputs.dcLength3 * 3.28084).toFixed(1);
        state.calcInputs.hwdpLength = (state.calcInputs.hwdpLength * 3.28084).toFixed(1);
        state.calcInputs.dpLength = (state.calcInputs.dpLength * 3.28084).toFixed(1);
        state.calcInputs.dpLength2 = (state.calcInputs.dpLength2 * 3.28084).toFixed(1);
        state.calcInputs.dpLength3 = (state.calcInputs.dpLength3 * 3.28084).toFixed(1);
        state.calcInputs.riserLength = (state.calcInputs.riserLength * 3.28084).toFixed(1);
        state.calcInputs.chokeLength = (state.calcInputs.chokeLength * 3.28084).toFixed(1);
      } else if (oldUnit === 'bbl/ft' && newUnit !== 'bbl/ft') {
        // Feet to Meters
        state.calcInputs.holeMD = (state.calcInputs.holeMD / 3.28084).toFixed(1);
        state.calcInputs.holeTVD = (state.calcInputs.holeTVD / 3.28084).toFixed(1);
        state.calcInputs.shoeMD = (state.calcInputs.shoeMD / 3.28084).toFixed(1);
        state.calcInputs.shoeTVD = (state.calcInputs.shoeTVD / 3.28084).toFixed(1);
        state.calcInputs.dcLength = (state.calcInputs.dcLength / 3.28084).toFixed(1);
        state.calcInputs.dcLength2 = (state.calcInputs.dcLength2 / 3.28084).toFixed(1);
        state.calcInputs.dcLength3 = (state.calcInputs.dcLength3 / 3.28084).toFixed(1);
        state.calcInputs.hwdpLength = (state.calcInputs.hwdpLength / 3.28084).toFixed(1);
        state.calcInputs.dpLength = (state.calcInputs.dpLength / 3.28084).toFixed(1);
        state.calcInputs.dpLength2 = (state.calcInputs.dpLength2 / 3.28084).toFixed(1);
        state.calcInputs.dpLength3 = (state.calcInputs.dpLength3 / 3.28084).toFixed(1);
        state.calcInputs.riserLength = (state.calcInputs.riserLength / 3.28084).toFixed(1);
        state.calcInputs.chokeLength = (state.calcInputs.chokeLength / 3.28084).toFixed(1);
      }

      showToast(`Global unit system switched to: ${newUnit}`);
      renderReferenceValues();
    });
  });

  const unitLabel = state.globalUnit;

  // SECTION 1: Tubular capacities
  let sec1Rows = `
    <tr>
      <td>DP 1</td>
      <td>${state.drillstring.dpSize}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-dp-input" value="${convertCapacity(state.reference.capacities.DP, state.globalUnit).toFixed(5)}"></td>
    </tr>
  `;
  if (parseInt(state.drillstring.dpType) >= 2) {
    sec1Rows += `
      <tr>
        <td>DP 2</td>
        <td>${state.drillstring.dpSize2}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-dp2-input" value="${convertCapacity(state.reference.capacities.DP2, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  if (parseInt(state.drillstring.dpType) === 3) {
    sec1Rows += `
      <tr>
        <td>DP 3</td>
        <td>${state.drillstring.dpSize3}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-dp3-input" value="${convertCapacity(state.reference.capacities.DP3, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }

  sec1Rows += `
    <tr>
      <td>HWDP</td>
      <td>${state.drillstring.hwdpSize}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-hwdp-input" value="${convertCapacity(state.reference.capacities.HWDP, state.globalUnit).toFixed(5)}"></td>
    </tr>
    <tr>
      <td>DC 1</td>
      <td>${state.drillstring.dcSize}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-dc-input" value="${convertCapacity(state.reference.capacities.DC, state.globalUnit).toFixed(5)}"></td>
    </tr>
  `;
  if (parseInt(state.drillstring.dcType) >= 2) {
    sec1Rows += `
      <tr>
        <td>DC 2</td>
        <td>${state.drillstring.dcSize2}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-dc2-input" value="${convertCapacity(state.reference.capacities.DC2, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  if (parseInt(state.drillstring.dcType) === 3) {
    sec1Rows += `
      <tr>
        <td>DC 3</td>
        <td>${state.drillstring.dcSize3}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-dc3-input" value="${convertCapacity(state.reference.capacities.DC3, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }

  if (state.flowType === 'subsea') {
    sec1Rows += `
      <tr>
        <td>Marine Riser</td>
        <td>Nominal</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-riser-input" value="${convertCapacity(DB.pipeData.RISER.capacity || 0, state.globalUnit).toFixed(5)}"></td>
      </tr>
      <tr>
        <td>Choke / Kill Line</td>
        <td>Nominal</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cap-choke-input" value="${convertCapacity(state.reference.chokeCapacity || 0, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }

  const sec1 = document.createElement('div');
  sec1.className = 'content-card';
  sec1.innerHTML = `
    <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600;">Drillstring Type and Capacity (${unitLabel})</h3>
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tubular Segment</th>
            <th>Nominal Size</th>
            <th style="text-align:right">Capacity (${unitLabel})</th>
          </tr>
        </thead>
        <tbody>
          ${sec1Rows}
        </tbody>
      </table>
    </div>
  `;
  container.appendChild(sec1);

  // SECTION 2: Open Hole Annular Volume
  let sec2Rows = `
    <tr>
      <td>DC 1 in Open Hole</td>
      <td>${state.selectedHoleSize}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-dc-input" value="${convertCapacity(state.reference.openHoleAnnular.DC, state.globalUnit).toFixed(5)}"></td>
    </tr>
  `;
  if (parseInt(state.drillstring.dcType) >= 2) {
    sec2Rows += `
      <tr>
        <td>DC 2 in Open Hole</td>
        <td>${state.selectedHoleSize}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-dc2-input" value="${convertCapacity(state.reference.openHoleAnnular.DC2, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  if (parseInt(state.drillstring.dcType) === 3) {
    sec2Rows += `
      <tr>
        <td>DC 3 in Open Hole</td>
        <td>${state.selectedHoleSize}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-dc3-input" value="${convertCapacity(state.reference.openHoleAnnular.DC3, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  sec2Rows += `
    <tr>
      <td>HWDP in Open Hole</td>
      <td>${state.selectedHoleSize}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-hwdp-input" value="${convertCapacity(state.reference.openHoleAnnular.HWDP, state.globalUnit).toFixed(5)}"></td>
    </tr>
    <tr>
      <td>DP 1 in Open Hole</td>
      <td>${state.selectedHoleSize}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-dp-input" value="${convertCapacity(state.reference.openHoleAnnular.DP, state.globalUnit).toFixed(5)}"></td>
    </tr>
  `;
  if (parseInt(state.drillstring.dpType) >= 2) {
    sec2Rows += `
      <tr>
        <td>DP 2 in Open Hole</td>
        <td>${state.selectedHoleSize}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-dp2-input" value="${convertCapacity(state.reference.openHoleAnnular.DP2, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  if (parseInt(state.drillstring.dpType) === 3) {
    sec2Rows += `
      <tr>
        <td>DP 3 in Open Hole</td>
        <td>${state.selectedHoleSize}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="oh-dp3-input" value="${convertCapacity(state.reference.openHoleAnnular.DP3, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }

  const sec2 = document.createElement('div');
  sec2.className = 'content-card';
  sec2.innerHTML = `
    <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600;">Open Hole Annular Capacity (${state.selectedHoleSize}" Hole)</h3>
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tubular Segment</th>
            <th>Hole OD</th>
            <th style="text-align:right">Annular Capacity (${unitLabel})</th>
          </tr>
        </thead>
        <tbody>
          ${sec2Rows}
        </tbody>
      </table>
    </div>
  `;
  container.appendChild(sec2);

  // SECTION 3: Casing Annular Volume
  const prevCasing = DB.holeToPreviousCasing[state.selectedHoleSize] || '20';
  let sec3Rows = `
    <tr>
      <td>DC 1 in Casing</td>
      <td>${prevCasing}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-dc-input" value="${convertCapacity(state.reference.casingAnnular.DC, state.globalUnit).toFixed(5)}"></td>
    </tr>
  `;
  if (parseInt(state.drillstring.dcType) >= 2) {
    sec3Rows += `
      <tr>
        <td>DC 2 in Casing</td>
        <td>${prevCasing}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-dc2-input" value="${convertCapacity(state.reference.casingAnnular.DC2, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  if (parseInt(state.drillstring.dcType) === 3) {
    sec3Rows += `
      <tr>
        <td>DC 3 in Casing</td>
        <td>${prevCasing}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-dc3-input" value="${convertCapacity(state.reference.casingAnnular.DC3, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  sec3Rows += `
    <tr>
      <td>HWDP in Casing</td>
      <td>${prevCasing}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-hwdp-input" value="${convertCapacity(state.reference.casingAnnular.HWDP, state.globalUnit).toFixed(5)}"></td>
    </tr>
    <tr>
      <td>DP 1 in Casing</td>
      <td>${prevCasing}"</td>
      <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-dp-input" value="${convertCapacity(state.reference.casingAnnular.DP, state.globalUnit).toFixed(5)}"></td>
    </tr>
  `;
  if (parseInt(state.drillstring.dpType) >= 2) {
    sec3Rows += `
      <tr>
        <td>DP 2 in Casing</td>
        <td>${prevCasing}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-dp2-input" value="${convertCapacity(state.reference.casingAnnular.DP2, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }
  if (parseInt(state.drillstring.dpType) === 3) {
    sec3Rows += `
      <tr>
        <td>DP 3 in Casing</td>
        <td>${prevCasing}"</td>
        <td style="text-align:right"><input type="number" step="any" class="table-input" id="cas-dp3-input" value="${convertCapacity(state.reference.casingAnnular.DP3, state.globalUnit).toFixed(5)}"></td>
      </tr>
    `;
  }

  const sec3 = document.createElement('div');
  sec3.className = 'content-card';
  sec3.innerHTML = `
    <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600;">Casing Annular Capacity (Auto-Detected Casing: ${prevCasing}")</h3>
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tubular Segment</th>
            <th>Casing size</th>
            <th style="text-align:right">Annular Capacity (${unitLabel})</th>
          </tr>
        </thead>
        <tbody>
          ${sec3Rows}
        </tbody>
      </table>
    </div>
  `;
  container.appendChild(sec3);

  // SECTION 4: Subsea Annular Volume between Riser and DP
  if (state.flowType === 'subsea') {
    const sec4Subsea = document.createElement('div');
    sec4Subsea.className = 'content-card';
    sec4Subsea.innerHTML = `
      <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600;">Riser & DP Annular Capacity</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Riser Annular Section</th>
              <th>Reference Tubular</th>
              <th style="text-align:right">Annular Capacity (${unitLabel})</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Riser to DP Annulus</td>
              <td>${state.drillstring.dpSize}" DP</td>
              <td style="text-align:right"><input type="number" step="any" class="table-input" id="riser-ann-input" value="${convertCapacity(state.reference.riserAnnular || 0, state.globalUnit).toFixed(5)}"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(sec4Subsea);
  }

  // SECTION 4/5: Pump Output
  const secPump = document.createElement('div');
  secPump.className = 'content-card';
  const pumpUnitLabel = (state.globalUnit === 'bbl/m' || state.globalUnit === 'bbl/ft') ? 'bbl/stroke' : 'L/stroke';
  const pumpDisplayValue = convertPumpOutput(state.reference.pumpOutput, state.globalUnit).toFixed(5);
  secPump.innerHTML = `
    <div class="form-group" style="margin-bottom: 0;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:15px;">
        <label style="margin-bottom:0; flex-shrink:0;">Pump Output (${pumpUnitLabel})</label>
        <div style="position:relative; width: 130px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <input type="number" step="any" class="form-input" id="pump-out-input" value="${pumpDisplayValue}" style="padding-left:12px; padding-right:34px; text-align:left;">
        </div>
      </div>
    </div>
  `;
  container.appendChild(secPump);

  // Buttons Row
  const btns = document.createElement('div');
  btns.className = 'btn-group';
  btns.innerHTML = `
    <button class="btn btn-primary" id="ref-save-new">Save as Reference</button>
    <button class="btn btn-secondary" id="ref-use-btn">Use Reference</button>
  `;
  container.appendChild(btns);

  // Bind Actions
  const handleSaveState = () => {
    const getVal = (id, fallback) => {
      const el = container.querySelector('#' + id);
      if (!el || el.value === '') return fallback;
      const num = parseFloat(String(el.value).replace(',', '.'));
      if (isNaN(num)) return fallback;
      return num;
    };

    // Save tubular capacities back (convert back to L/m first)
    state.reference.capacities.DP = convertCapacityBack(getVal('cap-dp-input', convertCapacity(state.reference.capacities.DP, state.globalUnit)), state.globalUnit);
    if (container.querySelector('#' + 'cap-dp2-input')) {
      state.reference.capacities.DP2 = convertCapacityBack(getVal('cap-dp2-input', convertCapacity(state.reference.capacities.DP2, state.globalUnit)), state.globalUnit);
    }
    if (container.querySelector('#' + 'cap-dp3-input')) {
      state.reference.capacities.DP3 = convertCapacityBack(getVal('cap-dp3-input', convertCapacity(state.reference.capacities.DP3, state.globalUnit)), state.globalUnit);
    }
    state.reference.capacities.HWDP = convertCapacityBack(getVal('cap-hwdp-input', convertCapacity(state.reference.capacities.HWDP, state.globalUnit)), state.globalUnit);
    state.reference.capacities.DC = convertCapacityBack(getVal('cap-dc-input', convertCapacity(state.reference.capacities.DC, state.globalUnit)), state.globalUnit);
    if (container.querySelector('#' + 'cap-dc2-input')) {
      state.reference.capacities.DC2 = convertCapacityBack(getVal('cap-dc2-input', convertCapacity(state.reference.capacities.DC2, state.globalUnit)), state.globalUnit);
    }
    if (container.querySelector('#' + 'cap-dc3-input')) {
      state.reference.capacities.DC3 = convertCapacityBack(getVal('cap-dc3-input', convertCapacity(state.reference.capacities.DC3, state.globalUnit)), state.globalUnit);
    }

    // Save Open Hole capacities
    state.reference.openHoleAnnular.DP = convertCapacityBack(getVal('oh-dp-input', convertCapacity(state.reference.openHoleAnnular.DP || 0, state.globalUnit)), state.globalUnit);
    if (container.querySelector('#' + 'oh-dp2-input')) {
      state.reference.openHoleAnnular.DP2 = convertCapacityBack(getVal('oh-dp2-input', convertCapacity(state.reference.openHoleAnnular.DP2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (container.querySelector('#' + 'oh-dp3-input')) {
      state.reference.openHoleAnnular.DP3 = convertCapacityBack(getVal('oh-dp3-input', convertCapacity(state.reference.openHoleAnnular.DP3 || 0, state.globalUnit)), state.globalUnit);
    }
    state.reference.openHoleAnnular.HWDP = convertCapacityBack(getVal('oh-hwdp-input', convertCapacity(state.reference.openHoleAnnular.HWDP || 0, state.globalUnit)), state.globalUnit);
    state.reference.openHoleAnnular.DC = convertCapacityBack(getVal('oh-dc-input', convertCapacity(state.reference.openHoleAnnular.DC || 0, state.globalUnit)), state.globalUnit);
    if (container.querySelector('#' + 'oh-dc2-input')) {
      state.reference.openHoleAnnular.DC2 = convertCapacityBack(getVal('oh-dc2-input', convertCapacity(state.reference.openHoleAnnular.DC2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (container.querySelector('#' + 'oh-dc3-input')) {
      state.reference.openHoleAnnular.DC3 = convertCapacityBack(getVal('oh-dc3-input', convertCapacity(state.reference.openHoleAnnular.DC3 || 0, state.globalUnit)), state.globalUnit);
    }

    // Save Casing capacities
    state.reference.casingAnnular.DP = convertCapacityBack(getVal('cas-dp-input', convertCapacity(state.reference.casingAnnular.DP || 0, state.globalUnit)), state.globalUnit);
    if (container.querySelector('#' + 'cas-dp2-input')) {
      state.reference.casingAnnular.DP2 = convertCapacityBack(getVal('cas-dp2-input', convertCapacity(state.reference.casingAnnular.DP2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (container.querySelector('#' + 'cas-dp3-input')) {
      state.reference.casingAnnular.DP3 = convertCapacityBack(getVal('cas-dp3-input', convertCapacity(state.reference.casingAnnular.DP3 || 0, state.globalUnit)), state.globalUnit);
    }
    state.reference.casingAnnular.HWDP = convertCapacityBack(getVal('cas-hwdp-input', convertCapacity(state.reference.casingAnnular.HWDP || 0, state.globalUnit)), state.globalUnit);
    state.reference.casingAnnular.DC = convertCapacityBack(getVal('cas-dc-input', convertCapacity(state.reference.casingAnnular.DC || 0, state.globalUnit)), state.globalUnit);
    if (container.querySelector('#' + 'cas-dc2-input')) {
      state.reference.casingAnnular.DC2 = convertCapacityBack(getVal('cas-dc2-input', convertCapacity(state.reference.casingAnnular.DC2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (container.querySelector('#' + 'cas-dc3-input')) {
      state.reference.casingAnnular.DC3 = convertCapacityBack(getVal('cas-dc3-input', convertCapacity(state.reference.casingAnnular.DC3 || 0, state.globalUnit)), state.globalUnit);
    }

    // Subsea specific saves
    if (state.flowType === 'subsea') {
      const riserAnnEl = container.querySelector('#' + 'riser-ann-input');
      if (riserAnnEl) {
        state.reference.riserAnnular = convertCapacityBack(getVal('riser-ann-input', convertCapacity(state.reference.riserAnnular || 0, state.globalUnit)), state.globalUnit);
      }
      const chokeCapEl = container.querySelector('#' + 'cap-choke-input');
      if (chokeCapEl) {
        state.reference.chokeCapacity = convertCapacityBack(getVal('cap-choke-input', convertCapacity(state.reference.chokeCapacity || 0, state.globalUnit)), state.globalUnit);
      }
      const riserCapEl = container.querySelector('#' + 'cap-riser-input');
      if (riserCapEl) {
        DB.pipeData.RISER.capacity = convertCapacityBack(getVal('cap-riser-input', convertCapacity(DB.pipeData.RISER.capacity || 0, state.globalUnit)), state.globalUnit);
      }
    }

    // Save pump output (convert displayed unit back to L/stroke for internal storage)
    state.reference.pumpOutput = convertPumpOutputBack(getVal('pump-out-input', convertPumpOutput(state.reference.pumpOutput, state.globalUnit)), state.globalUnit);
    state.reference.pumpEfficiency = 100; // Permanently assumed 100% efficiency

    // Save current configuration metadata
    state.reference.selectedHoleSize = state.selectedHoleSize;
    state.reference.drillstring = {
      dcType: state.drillstring.dcType,
      dcSize: state.drillstring.dcSize,
      dcSize2: state.drillstring.dcSize2,
      dcSize3: state.drillstring.dcSize3,
      hwdpSize: state.drillstring.hwdpSize,
      dpType: state.drillstring.dpType,
      dpSize: state.drillstring.dpSize,
      dpSize2: state.drillstring.dpSize2,
      dpSize3: state.drillstring.dpSize3
    };

    // Save to LocalStorage permanently
    localStorage.setItem('drillingToolkitReferences', JSON.stringify(state.reference));
  };

  const refSaveBtn = container.querySelector('#' + 'ref-save-new');
  const refUseBtn = container.querySelector('#' + 'ref-use-btn');

  refSaveBtn.onclick = () => {
    handleSaveState();
    showToast("Reference values updated in active state!");
    refSaveBtn.classList.remove('btn-primary');
    refSaveBtn.classList.add('btn-secondary');
    refUseBtn.classList.remove('btn-secondary');
    refUseBtn.classList.add('btn-primary');
  };

  refUseBtn.onclick = () => {
    handleSaveState();
    // Clear depth inputs to require manual entry on a fresh calculation
    state.calcInputs.holeTVD = '';
    state.calcInputs.holeMD = '';
    state.calcInputs.shoeTVD = '';
    state.calcInputs.shoeMD = '';
    state.calcInputs.hasRun = false;
    localStorage.setItem('calcInputs', JSON.stringify(state.calcInputs));
    
    navigateTo(`${state.flowType}-calculations`);
  };

  // Revert styles when user modifies any input fields
  container.addEventListener('input', (e) => {
    if (e.target.classList.contains('table-input') || e.target.id === 'pump-out-input') {
      refSaveBtn.classList.remove('btn-secondary');
      refSaveBtn.classList.add('btn-primary');
      refUseBtn.classList.remove('btn-primary');
      refUseBtn.classList.add('btn-secondary');
    }
  });
}

// ==========================================
// SCREEN 4: Design & Calculations
// ==========================================
function renderCalculations() {
  const container = document.getElementById(`calculations-container-${state.flowType}`);
  container.innerHTML = '';

  const unitLabel = state.globalUnit;
  const isBblFt = (unitLabel === 'bbl/ft');
  const dUnit = isBblFt ? 'ft' : 'm';
  const vUnit = isBblFt || (unitLabel === 'bbl/m') ? 'bbl' : 'lts';

  // Title displays
  const titleDisplay = `${state.selectedHoleSize}" Hole`;
  const headerTitleEl = document.querySelector(`#screen-${state.flowType}-calculations .screen-title`);
  if (headerTitleEl) headerTitleEl.textContent = titleDisplay;

  // Segmented Control for Well Type
  const wellTypeSelect = document.createElement('div');
  wellTypeSelect.className = 'well-type-selector segmented-control';
  wellTypeSelect.innerHTML = `
    <button class="segmented-control-btn ${state.calcInputs.wellType === 'vertical' ? 'active' : ''}" data-type="vertical">Vertical Well</button>
    <button class="segmented-control-btn ${state.calcInputs.wellType === 'horizontal' ? 'active' : ''}" data-type="horizontal">Horizontal Well</button>
  `;
  container.appendChild(wellTypeSelect);

  // Handle well type toggle
  wellTypeSelect.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.calcInputs.wellType = e.target.getAttribute('data-type');
      if (state.calcInputs.wellType === 'vertical') {
        // Enforce equality MD = TVD
        state.calcInputs.holeMD = state.calcInputs.holeTVD;
        state.calcInputs.shoeMD = state.calcInputs.shoeTVD;
      }
      showToast(`Well profile switched to: ${state.calcInputs.wellType}`);
      renderCalculations();
    });
  });

  // Calculate default values based on units if values are zero or reset
  const defaultMD = '';
  const defaultShoe = '';
  const defaultDC = '';
  const defaultHWDP = '';

  const editIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

  // Generate dynamic tubular inputs HTML
  let dcInputsHtml = `
    <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
      <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.dcSize}" DC 1 Length (${dUnit})</label>
      <div style="position:relative; width:140px; display:inline-block;">
        <input type="number" step="any" class="form-input" id="dc-len-calc" value="${state.calcInputs.dcLength || defaultDC}" style="width:100%; margin-bottom:0; padding-right:25px;">
        ${editIcon}
      </div>
    </div>
  `;
  if (parseInt(state.drillstring.dcType) >= 2) {
    dcInputsHtml += `
      <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
        <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.dcSize2}" DC 2 Length (${dUnit})</label>
        <div style="position:relative; width:140px; display:inline-block;">
          <input type="number" step="any" class="form-input" id="dc-len-calc-2" value="${state.calcInputs.dcLength2 || ''}" style="width:100%; margin-bottom:0; padding-right:25px;">
          ${editIcon}
        </div>
      </div>
    `;
  }
  if (parseInt(state.drillstring.dcType) === 3) {
    dcInputsHtml += `
      <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
        <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.dcSize3}" DC 3 Length (${dUnit})</label>
        <div style="position:relative; width:140px; display:inline-block;">
          <input type="number" step="any" class="form-input" id="dc-len-calc-3" value="${state.calcInputs.dcLength3 || ''}" style="width:100%; margin-bottom:0; padding-right:25px;">
          ${editIcon}
        </div>
      </div>
    `;
  }

  let hwdpInputsHtml = `
    <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
      <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.hwdpSize}" HWDP Length (${dUnit})</label>
      <div style="position:relative; width:140px; display:inline-block;">
        <input type="number" step="any" class="form-input" id="hwdp-len-calc" value="${state.calcInputs.hwdpLength || defaultHWDP}" style="width:100%; margin-bottom:0; padding-right:25px;">
        ${editIcon}
      </div>
    </div>
  `;

  let dpInputsHtml = '';
  if (parseInt(state.drillstring.dpType) === 3) {
    dpInputsHtml += `
      <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
        <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.dpSize3}" DP 3 Length (${dUnit})</label>
        <div style="position:relative; width:140px; display:inline-block;">
          <input type="number" step="any" class="form-input" id="dp-len-calc-3" value="${state.calcInputs.dpLength3 || ''}" style="width:100%; margin-bottom:0; padding-right:25px;">
          ${editIcon}
        </div>
      </div>
    `;
  }
  if (parseInt(state.drillstring.dpType) >= 2) {
    dpInputsHtml += `
      <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
        <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.dpSize2}" DP 2 Length (${dUnit})</label>
        <div style="position:relative; width:140px; display:inline-block;">
          <input type="number" step="any" class="form-input" id="dp-len-calc-2" value="${state.calcInputs.dpLength2 || ''}" style="width:100%; margin-bottom:0; padding-right:25px;">
          ${editIcon}
        </div>
      </div>
    `;
  }
  dpInputsHtml += `
    <div class="form-group-row" style="display:flex; flex-direction:column; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
        <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">${state.drillstring.dpSize}" DP 1 Length (${dUnit})</label>
        <div style="position:relative; width:140px; display:inline-block;">
          <input type="number" step="any" class="form-input" id="dp-len-calc" value="${state.calcInputs.dpLength}" ${state.calcInputs.dpLengthOverride ? 'style="width:100%; margin-bottom:0; padding-right:25px;"' : 'style="background-color:var(--input-disabled-bg); width:100%; margin-bottom:0;"'}>
          ${state.calcInputs.dpLengthOverride ? editIcon : ''}
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:2px;">
        ${state.calcInputs.dpLengthOverride ? `
          <button id="reset-dp-auto" style="border:none; background:none; font-size:0.75rem; color:var(--accent-color); font-weight:600; cursor:pointer; padding:0;">Reset to Auto</button>
        ` : `<span style="font-size:0.7rem; color:var(--text-secondary); font-style:italic">Auto-calculated (Tap field to override)</span>`}
      </div>
    </div>
  `;

  // Input Form Card
  const formCard = document.createElement('div');
  formCard.className = 'content-card';
  formCard.innerHTML = `
    <h3 style="font-size:0.95rem; margin-bottom:15px; font-weight:600;">Wellbore and String Parameters</h3>
    
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
      <div class="form-group">
        <label>Hole TVD (${dUnit})</label>
        <div style="position:relative; width:100%;">
          <input type="number" step="any" class="form-input" id="hole-tvd-calc" value="${state.calcInputs.holeTVD || defaultMD}" style="width:100%; padding-right:25px;">
          ${editIcon}
        </div>
      </div>
      <div class="form-group">
        <label>Hole MD (${dUnit})</label>
        <div style="position:relative; width:100%;">
          <input type="number" step="any" class="form-input" id="hole-md-calc" value="${state.calcInputs.holeMD || defaultMD}" ${state.calcInputs.wellType === 'vertical' ? 'disabled style="background-color:var(--input-disabled-bg); width:100%;"' : 'style="width:100%; padding-right:25px;"'}>
          ${state.calcInputs.wellType === 'vertical' ? '' : editIcon}
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
      <div class="form-group">
        <label>Shoe TVD (${dUnit})</label>
        <div style="position:relative; width:100%;">
          <input type="number" step="any" class="form-input" id="shoe-tvd-calc" value="${state.calcInputs.shoeTVD || defaultShoe}" style="width:100%; padding-right:25px;">
          ${editIcon}
        </div>
      </div>
      <div class="form-group">
        <label>Shoe MD (${dUnit})</label>
        <div style="position:relative; width:100%;">
          <input type="number" step="any" class="form-input" id="shoe-md-calc" value="${state.calcInputs.shoeMD || defaultShoe}" ${state.calcInputs.wellType === 'vertical' ? 'disabled style="background-color:var(--input-disabled-bg); width:100%;"' : 'style="width:100%; padding-right:25px;"'}>
          ${state.calcInputs.wellType === 'vertical' ? '' : editIcon}
        </div>
      </div>
    </div>

    ${dcInputsHtml}
    ${hwdpInputsHtml}
    ${dpInputsHtml}

    ${state.flowType === 'subsea' ? `
    <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
      <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">Riser Length (${dUnit})</label>
      <div style="position:relative; width:140px; display:inline-block;">
        <input type="number" step="any" class="form-input" id="riserlength-calc" value="${state.calcInputs.riserLength}" style="width:100%; margin-bottom:0; padding-right:25px;">
        ${editIcon}
      </div>
    </div>
    ` : ''}

    ${state.flowType === 'subsea' && state.calcInputs.bopStatus === 'closed' ? `
    <div class="form-group-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:15px;">
      <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); flex:1;">Choke Line Length (${dUnit})</label>
      <div style="position:relative; width:140px; display:inline-block;">
        <input type="number" step="any" class="form-input" id="choke-len-calc" value="${state.calcInputs.chokeLength}" style="width:100%; margin-bottom:0; padding-right:25px;">
        ${editIcon}
      </div>
    </div>
    ` : ''}
  `;
  container.appendChild(formCard);

  // BOP Toggle for subsea stack (positioned next to GO)
  let bopToggleMarkup = '';
  if (state.flowType === 'subsea') {
    bopToggleMarkup = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <button class="btn btn-primary" id="run-calc-btn" style="padding: 12px 20px; font-size: 0.9rem; margin-bottom: 0; white-space: nowrap;">Calculate</button>
        <div class="bop-toggle-container" style="margin-bottom: 0; align-items: flex-end;">
          <span class="bop-toggle-label" style="margin-bottom: 5px;">
            BOP: <strong style="color:var(--text-primary); font-weight:700;">${state.calcInputs.bopStatus === 'closed' ? 'CLOSED' : 'OPEN'}</strong>
          </span>
          <label class="switch bop-switch" style="margin-top: 4px;">
            <input type="checkbox" id="bop-status-toggle" ${state.calcInputs.bopStatus === 'closed' ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  // BOP toggle container wrapper
  if (state.flowType === 'subsea') {
    const bopToggleWrapper = document.createElement('div');
    bopToggleWrapper.innerHTML = bopToggleMarkup;
    container.appendChild(bopToggleWrapper);

    // Bind BOP switch
    container.querySelector('#' + 'bop-status-toggle').addEventListener('change', (e) => {
      state.calcInputs.bopStatus = e.target.checked ? 'closed' : 'open';
      showToast(`BOP Status changed to: ${state.calcInputs.bopStatus.toUpperCase()}`);
      renderCalculations();
      runCalculationsEngine();
    });
  }

  // GO Button (Rendered only for Surface, since Subsea has it inline)
  if (state.flowType !== 'subsea') {
    const calcBtn = document.createElement('button');
    calcBtn.className = 'btn btn-primary';
    calcBtn.id = 'run-calc-btn';
    calcBtn.style.width = '100%';
    calcBtn.style.marginBottom = '25px';
    calcBtn.textContent = 'RUN CALCULATIONS';
    container.appendChild(calcBtn);
  }

  // Results Section (Initially empty, populated when GO is pressed)
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'results-dashboard-wrapper';
  resultsContainer.className = 'results-grid';
  const showResults = state.calcInputs.hasRun;
  resultsContainer.style.display = showResults ? 'grid' : 'none';
  container.appendChild(resultsContainer);

  // Initialize default inputs in state if they do not exist
  // Ensure kill data inputs are not auto-filled with defaults, requiring manual entry
  const defaultOMW = '';
  const defaultSIDPP = '';
  const defaultSICP = '';
  const defaultSCR = '';

  if (state.calcInputs.killOMW === undefined) state.calcInputs.killOMW = defaultOMW;
  if (state.calcInputs.killSIDPP === undefined) state.calcInputs.killSIDPP = defaultSIDPP;
  if (state.calcInputs.killSICP === undefined) state.calcInputs.killSICP = defaultSICP;
  if (state.calcInputs.killSCR === undefined) state.calcInputs.killSCR = defaultSCR;

  // Kill Sheet Button Section
  const killSheetBtnCard = document.createElement('div');
  killSheetBtnCard.id = 'kill-sheet-btn-card';
  killSheetBtnCard.className = 'content-card compact-card';
  killSheetBtnCard.style.marginTop = '20px';
  killSheetBtnCard.style.borderTop = '4px solid var(--accent-color)';
  killSheetBtnCard.style.display = showResults ? 'block' : 'none';

  killSheetBtnCard.innerHTML = `
    <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600; color:var(--text-primary);">Well Control Kill Sheet</h3>
    <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:15px; line-height:1.4;">
      Access the complete well control Kill Data Sheet to compute maximum pressures, kill mud weight, initial/final circulating pressures, and step-down charts.
    </p>
    <button class="btn btn-primary" id="open-kill-sheet-btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      OPEN KILL DATA SHEET
    </button>
  `;
  container.appendChild(killSheetBtnCard);

  container.querySelector('#' + 'open-kill-sheet-btn').onclick = () => {
    navigateTo('kill-data-sheet');
  };

  // Sync Input Elements Values & Bind change listeners
  const holeMEl = container.querySelector('#' + 'hole-md-calc');
  const holeTEl = container.querySelector('#' + 'hole-tvd-calc');
  const shoeMEl = container.querySelector('#' + 'shoe-md-calc');
  const shoeTEl = container.querySelector('#' + 'shoe-tvd-calc');
  const dcEl = container.querySelector('#' + 'dc-len-calc');
  const hwdpEl = container.querySelector('#' + 'hwdp-len-calc');
  const dpEl = container.querySelector('#' + 'dp-len-calc');

  const updateDPLength = () => {
    if (!state.calcInputs.dpLengthOverride) {
      if (!holeMEl.value || holeMEl.value.trim() === '') {
        state.calcInputs.dpLength = '';
        if (dpEl) dpEl.value = '';
        return;
      }
      const parseVal = (el) => el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0;
      const hMD = parseVal(holeMEl);
      const dcL = parseVal(dcEl);
      const dcL2 = parseVal(container.querySelector('#' + 'dc-len-calc-2'));
      const dcL3 = parseVal(container.querySelector('#' + 'dc-len-calc-3'));

      const hwL = parseVal(hwdpEl);

      const dpL2 = parseVal(container.querySelector('#' + 'dp-len-calc-2'));
      const dpL3 = parseVal(container.querySelector('#' + 'dp-len-calc-3'));

      const dpL = Math.max(0, hMD - dcL - dcL2 - dcL3 - hwL - dpL2 - dpL3);
      state.calcInputs.dpLength = dpL;
      if (dpEl) dpEl.value = dpL.toFixed(1);
    }
  };

  const syncStateFromInputs = () => {
    const getVal = (el) => el && el.value !== '' ? (parseFloat(String(el.value).replace(',', '.')) || 0) : '';

    state.calcInputs.holeMD = getVal(holeMEl);
    state.calcInputs.holeTVD = holeTEl ? getVal(holeTEl) : state.calcInputs.holeMD;
    state.calcInputs.shoeMD = getVal(shoeMEl);
    state.calcInputs.shoeTVD = shoeTEl ? getVal(shoeTEl) : state.calcInputs.shoeMD;

    state.calcInputs.dcLength = getVal(dcEl);
    state.calcInputs.dcLength2 = getVal(container.querySelector('#' + 'dc-len-calc-2'));
    state.calcInputs.dcLength3 = getVal(container.querySelector('#' + 'dc-len-calc-3'));

    state.calcInputs.hwdpLength = getVal(hwdpEl);

    state.calcInputs.dpLength = getVal(dpEl);
    state.calcInputs.dpLength2 = getVal(container.querySelector('#' + 'dp-len-calc-2'));
    state.calcInputs.dpLength3 = getVal(container.querySelector('#' + 'dp-len-calc-3'));

    if (state.flowType === 'subsea') {
      state.calcInputs.riserLength = getVal(container.querySelector('#' + 'riserlength-calc'));
      if (state.calcInputs.bopStatus === 'closed') {
        state.calcInputs.chokeLength = getVal(container.querySelector('#' + 'choke-len-calc'));
      }
    }

    localStorage.setItem('calcInputs', JSON.stringify(state.calcInputs));
  };

  // Sync inputs
  holeMEl.addEventListener('input', () => {
    if (state.calcInputs.wellType === 'vertical') {
      holeTEl.value = holeMEl.value;
    }
    updateDPLength();
    syncStateFromInputs();
    runCalculationsEngine(); // reactive update
  });

  if (holeTEl) {
    holeTEl.addEventListener('input', () => {
      if (state.calcInputs.wellType === 'vertical') {
        holeMEl.value = holeTEl.value;
      }
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  shoeMEl.addEventListener('input', () => {
    if (state.calcInputs.wellType === 'vertical') {
      shoeTEl.value = shoeMEl.value;
    }
    syncStateFromInputs();
    runCalculationsEngine();
  });

  if (shoeTEl) {
    shoeTEl.addEventListener('input', () => {
      if (state.calcInputs.wellType === 'vertical') {
        shoeMEl.value = shoeTEl.value;
      }
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  dcEl.addEventListener('input', () => {
    updateDPLength();
    syncStateFromInputs();
    runCalculationsEngine();
  });

  const dcEl2 = container.querySelector('#' + 'dc-len-calc-2');
  if (dcEl2) {
    dcEl2.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  const dcEl3 = container.querySelector('#' + 'dc-len-calc-3');
  if (dcEl3) {
    dcEl3.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  hwdpEl.addEventListener('input', () => {
    updateDPLength();
    syncStateFromInputs();
    runCalculationsEngine();
  });

  dpEl.addEventListener('input', () => {
    state.calcInputs.dpLengthOverride = true;
    syncStateFromInputs();
    runCalculationsEngine();
  });

  const dpEl2 = container.querySelector('#' + 'dp-len-calc-2');
  if (dpEl2) {
    dpEl2.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  const dpEl3 = container.querySelector('#' + 'dp-len-calc-3');
  if (dpEl3) {
    dpEl3.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  // Reset auto listener
  const resetBtn = container.querySelector('#' + 'reset-dp-auto');
  if (resetBtn) {
    resetBtn.onclick = () => {
      state.calcInputs.dpLengthOverride = false;
      updateDPLength();
      syncStateFromInputs();
      renderCalculations();
      runCalculationsEngine();
    };
  }

  // Run Calculations initially when button is clicked or after setup
  const runCalcBtn = container.querySelector('#' + 'run-calc-btn');
  if (runCalcBtn) {
    runCalcBtn.onclick = () => {
      if (runCalcBtn.disabled) return;
      
      syncStateFromInputs();

      // Validation Check: Find missing data entries
      let hasError = false;
      const inputsList = container.querySelectorAll('.form-input:not([disabled])');

      inputsList.forEach(input => {
        // Skip DP1 if it is auto-calculated and not overridden
        if (input.id === 'dp-len-calc' && !state.calcInputs.dpLengthOverride) {
          return;
        }

        if (input.value === '' || input.value === null || input.value === undefined) {
          input.style.border = '2px solid var(--accent-color)';
          hasError = true;
        } else {
          input.style.border = ''; // restore to CSS default
        }
      });

      if (hasError) {
        showToast("Required input missing");
        return;
      }

      // Logical Validation: Shoe depth must not exceed Hole depth
      const hTVD = parseFloat(state.calcInputs.holeTVD);
      const sTVD = parseFloat(state.calcInputs.shoeTVD);
      const hMD = parseFloat(state.calcInputs.holeMD);
      const sMD = parseFloat(state.calcInputs.shoeMD);
      
      let logicalError = false;
      if (!isNaN(hTVD) && !isNaN(sTVD) && sTVD > hTVD) {
        const el = container.querySelector('#shoe-tvd-calc');
        if (el) el.style.border = '2px solid var(--accent-color)';
        logicalError = true;
      }
      if (!isNaN(hMD) && !isNaN(sMD) && sMD > hMD) {
        const el = container.querySelector('#shoe-md-calc');
        if (el) el.style.border = '2px solid var(--accent-color)';
        logicalError = true;
      }

      if (logicalError) {
        showToast("Shoe depth cannot exceed Hole depth.");
        return;
      }

      runCalcBtn.disabled = true;
      const originalText = runCalcBtn.innerHTML;
      runCalcBtn.innerHTML = "Calculating...";

      // Allow UI to update with "Calculating..." before doing work
      setTimeout(() => {
        try {
          state.calcInputs.hasRun = true;
          localStorage.setItem('calcInputs', JSON.stringify(state.calcInputs));
          container.querySelector('#' + 'results-dashboard-wrapper').style.display = 'grid';
          container.querySelector('#' + 'kill-sheet-btn-card').style.display = 'block';
          
          runCalculationsEngine();
          saveCalculationToHistory('dashboard');
          
          // Request animation frame to ensure the DOM is painted before showing success
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              showToast("Calculations refreshed successfully.");
              
              runCalcBtn.disabled = false;
              runCalcBtn.innerHTML = originalText;
              
              setTimeout(() => {
                const wrapper = container.querySelector('#' + 'results-dashboard-wrapper');
                if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            });
          });
        } catch (e) {
          console.error(e);
          runCalcBtn.disabled = false;
          runCalcBtn.innerHTML = originalText;
          showToast("An error occurred during calculation");
        }
      }, 50);
    };
  }



  // Run calculations instantly on render
  runCalculationsEngine();

  // If navigating back, auto-scroll to results so they remain visible to the user
  if (_navDirection === 'back' && state.calcInputs.hasRun) {
    setTimeout(() => {
      const resultsWrap = container.querySelector('#' + 'results-dashboard-wrapper');
      if (resultsWrap) resultsWrap.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 50);
  }
}

// Engine to compute values and update Dashboard Results
function runCalculationsEngine() {
  const resultsWrapper = document.getElementById('results-dashboard-wrapper');
  if (!resultsWrapper) return;

  const inputs = state.calcInputs;
  const ref = state.reference;
  const unit = state.globalUnit;
  const isBbl = (unit === 'bbl/m' || unit === 'bbl/ft');
  const isBblFt = (unit === 'bbl/ft');

  // Resolve capacities into L/m for standardized calculation
  // Inputs might be entered in feet if unit is bbl/ft.
  // We perform math in meters and L/m, then convert the output to target unit (Liters or Barrels).

  // Converters to meter scale
  const toMeters = (len) => isBblFt ? len / 3.28084 : len;

  // Depths in meters
  const holeMD = toMeters(inputs.holeMD || 0);
  const holeTVD = toMeters(inputs.holeTVD || 0);
  const shoeMD = toMeters(inputs.shoeMD || 0);
  const shoeTVD = toMeters(inputs.shoeTVD || 0);
  const dcLength = toMeters(inputs.dcLength || 0);
  const dcLength2 = toMeters(inputs.dcLength2 || 0);
  const dcLength3 = toMeters(inputs.dcLength3 || 0);
  const hwdpLength = toMeters(inputs.hwdpLength || 0);
  const dpLength = toMeters(inputs.dpLength || 0);
  const dpLength2 = toMeters(inputs.dpLength2 || 0);
  const dpLength3 = toMeters(inputs.dpLength3 || 0);

  // Capacities in L/m
  const dcCap = ref.capacities.DC; // always stored in L/m in ref
  const dcCap2 = ref.capacities.DC2 || 0;
  const dcCap3 = ref.capacities.DC3 || 0;
  const hwdpCap = ref.capacities.HWDP;
  const dpCap = ref.capacities.DP;
  const dpCap2 = ref.capacities.DP2 || 0;
  const dpCap3 = ref.capacities.DP3 || 0;

  const ohDcCap = ref.openHoleAnnular.DC;
  const ohDcCap2 = ref.openHoleAnnular.DC2 || 0;
  const ohDcCap3 = ref.openHoleAnnular.DC3 || 0;
  const ohHwdpCap = ref.openHoleAnnular.HWDP;
  const ohDpCap = ref.openHoleAnnular.DP;
  const ohDpCap2 = ref.openHoleAnnular.DP2 || 0;
  const ohDpCap3 = ref.openHoleAnnular.DP3 || 0;

  const casDcCap = ref.casingAnnular.DC;
  const casDcCap2 = ref.casingAnnular.DC2 || 0;
  const casDcCap3 = ref.casingAnnular.DC3 || 0;
  const casHwdpCap = ref.casingAnnular.HWDP;
  const casDpCap = ref.casingAnnular.DP;
  const casDpCap2 = ref.casingAnnular.DP2 || 0;
  const casDpCap3 = ref.casingAnnular.DP3 || 0;

  const pumpOutput = ref.pumpOutput; // Nominal L/stroke
  const pumpEfficiency = 1.0; // Permanently set to 100% (1.0)
  const effectivePumpOutput = pumpOutput * pumpEfficiency; // L/stroke

  // 1. String Volume (Liters)
  const stringVolume = (dcLength * dcCap) + (dcLength2 * dcCap2) + (dcLength3 * dcCap3) +
    (hwdpLength * hwdpCap) +
    (dpLength * dpCap) + (dpLength2 * dpCap2) + (dpLength3 * dpCap3);

  // Helper to get intersection of drillstring components
  const getIntersect = (pStart, pEnd, sStart, sEnd) => {
    return Math.max(0, Math.min(pEnd, sEnd) - Math.max(pStart, sStart));
  };

  // Tubular segment ranges (measured bottom-up from Hole MD down to surface 0)
  const dcEnd = holeMD;
  const dcStart = holeMD - dcLength;

  const dc2End = dcStart;
  const dc2Start = dcStart - dcLength2;

  const dc3End = dc2Start;
  const dc3Start = dc2Start - dcLength3;

  const hwdpEnd = dc3Start;
  const hwdpStart = dc3Start - hwdpLength;

  const dp3End = hwdpStart;
  const dp3Start = hwdpStart - dpLength3;

  const dp2End = dp3Start;
  const dp2Start = dp3Start - dpLength2;

  const dpStart = 0;
  const dpEnd = dp2Start;

  // Output results declarations
  let openHoleVolume = 0;
  let annularVolume = 0;
  let riserVolume = 0;
  let chokeVolume = 0;
  let annularVolBelowBop = 0;

  if (state.flowType === 'surface') {
    // Open Hole interval: [Shoe MD, Hole MD]
    const dcInOH = getIntersect(dcStart, dcEnd, shoeMD, holeMD);
    const dc2InOH = getIntersect(dc2Start, dc2End, shoeMD, holeMD);
    const dc3InOH = getIntersect(dc3Start, dc3End, shoeMD, holeMD);

    const hwdpInOH = getIntersect(hwdpStart, hwdpEnd, shoeMD, holeMD);

    const dp3InOH = getIntersect(dp3Start, dp3End, shoeMD, holeMD);
    const dp2InOH = getIntersect(dp2Start, dp2End, shoeMD, holeMD);
    const dpInOH = getIntersect(dpStart, dpEnd, shoeMD, holeMD);

    openHoleVolume = (dcInOH * ohDcCap) + (dc2InOH * ohDcCap2) + (dc3InOH * ohDcCap3) +
      (hwdpInOH * ohHwdpCap) +
      (dp3InOH * ohDpCap3) + (dp2InOH * ohDpCap2) + (dpInOH * ohDpCap);

    // Casing interval: [0, Shoe MD]
    const dcInCas = getIntersect(dcStart, dcEnd, 0, shoeMD);
    const dc2InCas = getIntersect(dc2Start, dc2End, 0, shoeMD);
    const dc3InCas = getIntersect(dc3Start, dc3End, 0, shoeMD);

    const hwdpInCas = getIntersect(hwdpStart, hwdpEnd, 0, shoeMD);

    const dp3InCas = getIntersect(dp3Start, dp3End, 0, shoeMD);
    const dp2InCas = getIntersect(dp2Start, dp2End, 0, shoeMD);
    const dpInCas = getIntersect(dpStart, dpEnd, 0, shoeMD);

    const casingAnnularVolume = (dcInCas * casDcCap) + (dc2InCas * casDcCap2) + (dc3InCas * casDcCap3) +
      (hwdpInCas * casHwdpCap) +
      (dp3InCas * casDpCap3) + (dp2InCas * casDpCap2) + (dpInCas * casDpCap);

    annularVolume = openHoleVolume + casingAnnularVolume;
  } else {
    // Subsea stack calculations
    const riserLength = toMeters(inputs.riserLength); // from RKB down to BOP at seabed

    // Open Hole interval: [Shoe MD, Hole MD]
    const dcInOH = getIntersect(dcStart, dcEnd, shoeMD, holeMD);
    const dc2InOH = getIntersect(dc2Start, dc2End, shoeMD, holeMD);
    const dc3InOH = getIntersect(dc3Start, dc3End, shoeMD, holeMD);

    const hwdpInOH = getIntersect(hwdpStart, hwdpEnd, shoeMD, holeMD);

    const dp3InOH = getIntersect(dp3Start, dp3End, shoeMD, holeMD);
    const dp2InOH = getIntersect(dp2Start, dp2End, shoeMD, holeMD);
    const dpInOH = getIntersect(dpStart, dpEnd, shoeMD, holeMD);

    openHoleVolume = (dcInOH * ohDcCap) + (dc2InOH * ohDcCap2) + (dc3InOH * ohDcCap3) +
      (hwdpInOH * ohHwdpCap) +
      (dp3InOH * ohDpCap3) + (dp2InOH * ohDpCap2) + (dpInOH * ohDpCap);

    // Casing interval: [Riser Length, Shoe MD]
    const cStart = riserLength;
    const cEnd = Math.max(riserLength, shoeMD);

    const dcInCas = getIntersect(dcStart, dcEnd, cStart, cEnd);
    const dc2InCas = getIntersect(dc2Start, dc2End, cStart, cEnd);
    const dc3InCas = getIntersect(dc3Start, dc3End, cStart, cEnd);

    const hwdpInCas = getIntersect(hwdpStart, hwdpEnd, cStart, cEnd);

    const dp3InCas = getIntersect(dp3Start, dp3End, cStart, cEnd);
    const dp2InCas = getIntersect(dp2Start, dp2End, cStart, cEnd);
    const dpInCas = getIntersect(dpStart, dpEnd, cStart, cEnd);

    const casingAnnularVolume = (dcInCas * casDcCap) + (dc2InCas * casDcCap2) + (dc3InCas * casDcCap3) +
      (hwdpInCas * casHwdpCap) +
      (dp3InCas * casDpCap3) + (dp2InCas * casDpCap2) + (dpInCas * casDpCap);

    annularVolBelowBop = openHoleVolume + casingAnnularVolume;

    if (inputs.bopStatus === 'open') {
      // BOP Open: Annular volume includes Marine Riser
      // Riser interval: [0, Riser Length]
      const dpInRiser = getIntersect(dpStart, dpEnd, 0, riserLength);
      const dp2InRiser = getIntersect(dp2Start, dp2End, 0, riserLength);
      const dp3InRiser = getIntersect(dp3Start, dp3End, 0, riserLength);

      const hwdpInRiser = getIntersect(hwdpStart, hwdpEnd, 0, riserLength);

      const dcInRiser = getIntersect(dcStart, dcEnd, 0, riserLength);
      const dc2InRiser = getIntersect(dc2Start, dc2End, 0, riserLength);
      const dc3InRiser = getIntersect(dc3Start, dc3End, 0, riserLength);

      const riserAnnularCap = ref.riserAnnular;

      riserVolume = (dpInRiser * riserAnnularCap) +
        (dp2InRiser * riserAnnularCap * 0.95) +
        (dp3InRiser * riserAnnularCap * 0.95) +
        (hwdpInRiser * riserAnnularCap * 0.9) +
        (dcInRiser * riserAnnularCap * 0.8) +
        (dc2InRiser * riserAnnularCap * 0.8) +
        (dc3InRiser * riserAnnularCap * 0.8);

      annularVolume = annularVolBelowBop + riserVolume;
    } else {
      // BOP Closed: Annular volume includes Choke line volume
      const chokeLength = toMeters(inputs.chokeLength);
      const chokeCap = ref.chokeCapacity;
      chokeVolume = chokeLength * chokeCap;

      annularVolume = annularVolBelowBop + chokeVolume;
    }
  }

  // Total System Volume
  const totalSystemVolume = stringVolume + annularVolume;

  // Strokes calculations (strictly checked: Volume in L divided by Pump Output in L/stroke)
  const surfaceToBitStrokes = effectivePumpOutput > 0 ? (stringVolume / effectivePumpOutput) : 0;
  const bitToShoeStrokes = effectivePumpOutput > 0 ? (openHoleVolume / effectivePumpOutput) : 0;
  const totalCycleStrokes = effectivePumpOutput > 0 ? (totalSystemVolume / effectivePumpOutput) : 0;

  state.calcInputs.surfaceToBitStrokes = surfaceToBitStrokes;

  // Convert results volumes to user's selected display unit (Liters vs Barrels)
  const displayVol = (litersVal) => {
    const converted = convertVolume(litersVal, unit);
    const label = isBbl ? 'bbl' : 'L';
    return `${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span class="unit-lbl">${label}</span>`;
  };

  // Render Result Cards HTML
  resultsWrapper.innerHTML = `
    <div class="result-card">
      <span class="result-label">String Volume</span>
      <span class="result-value">${displayVol(stringVolume)}</span>
    </div>

    <div class="result-card">
      <span class="result-label">Open Hole Volume</span>
      <span class="result-value">${displayVol(openHoleVolume)}</span>
    </div>

    <div class="result-card">
      <span class="result-label">Annular Volume</span>
      <span class="result-value">${displayVol(annularVolume)}</span>
      ${state.flowType === 'subsea' ? `
        <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
          Below BOP: ${convertVolume(annularVolBelowBop, unit).toFixed(1)} ${isBbl ? 'bbl' : 'L'} | 
          ${inputs.bopStatus === 'open' ? `Riser: ${convertVolume(riserVolume, unit).toFixed(1)}` : `Choke: ${convertVolume(chokeVolume, unit).toFixed(1)}`} ${isBbl ? 'bbl' : 'L'}
        </span>
      ` : ''}
    </div>

    <div class="result-card">
      <span class="result-label">Total System Volume</span>
      <span class="result-value">${displayVol(totalSystemVolume)}</span>
    </div>

    <div class="result-card" style="border-left: 4px solid var(--accent-color);">
      <span class="result-label">Surface to Bit Strokes</span>
      <span class="result-value">${Math.round(surfaceToBitStrokes).toLocaleString()} <span class="unit-lbl">strokes</span></span>
      <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
        Time at 60 SPM: ${(surfaceToBitStrokes / 60).toFixed(1)} min
      </span>
    </div>

    <div class="result-card" style="border-left: 4px solid var(--accent-color);">
      <span class="result-label">Bit to Shoe Strokes</span>
      <span class="result-value">${Math.round(bitToShoeStrokes).toLocaleString()} <span class="unit-lbl">strokes</span></span>
      <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
        Time at 60 SPM: ${(bitToShoeStrokes / 60).toFixed(1)} min
      </span>
    </div>

    <div class="result-card" style="border-left: 4px solid var(--accent-color);">
      <span class="result-label">Total Cycle Strokes</span>
      <span class="result-value">${Math.round(totalCycleStrokes).toLocaleString()} <span class="unit-lbl">strokes</span></span>
      <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
        Time at 60 SPM: ${(totalCycleStrokes / 60).toFixed(1)} min
      </span>
    </div>
  `;
}

// ==========================================
// SCREEN: Kill Data Sheet Rendering & Logic
// ==========================================
function renderKillDataSheet() {
  const container = document.getElementById('kill-data-sheet-container');
  if (!container) return;
  container.innerHTML = '';

  const unit = state.globalUnit;
  const isBblFt = (unit === 'bbl/ft');

  // Enforce US units (PSI and PPG) for Kill Data Sheet
  const dUnit = 'ft';
  const mwUnit = 'ppg';
  const pressUnit = 'psi';

  // Get current active inputs from state and convert if necessary
  let holeTVD = parseFloat(state.calcInputs.holeTVD) || 0;
  let shoeTVD = parseFloat(state.calcInputs.shoeTVD) || 0;
  const strokes = state.calcInputs.surfaceToBitStrokes !== undefined ? parseFloat(state.calcInputs.surfaceToBitStrokes) : 0;

  // Convert TVD values to feet if global unit is metric
  if (!isBblFt) {
    holeTVD = holeTVD * 3.28084;
    shoeTVD = shoeTVD * 3.28084;
  }

  const editIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

  // Determine initial input values (read from specific US state fields, or convert from general fields, or use default)
  let initialOMW = '';
  if (state.calcInputs.killOMW_ppg !== undefined) {
    initialOMW = state.calcInputs.killOMW_ppg;
  } else if (state.calcInputs.killOMW !== undefined && state.calcInputs.killOMW !== '') {
    initialOMW = isBblFt ? state.calcInputs.killOMW : state.calcInputs.killOMW * 8.33;
  }

  let initialLotMw = '';
  if (state.calcInputs.killLotMw_ppg !== undefined) {
    initialLotMw = state.calcInputs.killLotMw_ppg;
  } else if (state.calcInputs.killLotMw !== undefined && state.calcInputs.killLotMw !== '') {
    initialLotMw = isBblFt ? state.calcInputs.killLotMw : state.calcInputs.killLotMw * 8.33;
  }

  let initialSCR = '';
  if (state.calcInputs.killSCR_psi !== undefined) {
    initialSCR = state.calcInputs.killSCR_psi;
  } else if (state.calcInputs.killSCR !== undefined && state.calcInputs.killSCR !== '') {
    initialSCR = isBblFt ? state.calcInputs.killSCR : state.calcInputs.killSCR * 14.5038;
  }

  let initialSIDPP = '';
  if (state.calcInputs.killSIDPP_psi !== undefined) {
    initialSIDPP = state.calcInputs.killSIDPP_psi;
  } else if (state.calcInputs.killSIDPP !== undefined && state.calcInputs.killSIDPP !== '') {
    initialSIDPP = isBblFt ? state.calcInputs.killSIDPP : state.calcInputs.killSIDPP * 14.5038;
  }

  let initialSICP = '';
  if (state.calcInputs.killSICP_psi !== undefined) {
    initialSICP = state.calcInputs.killSICP_psi;
  } else if (state.calcInputs.killSICP !== undefined && state.calcInputs.killSICP !== '') {
    initialSICP = isBblFt ? state.calcInputs.killSICP : state.calcInputs.killSICP * 14.5038;
  }

  let initialCLF = '';
  if (state.calcInputs.killCLF_psi !== undefined) {
    initialCLF = state.calcInputs.killCLF_psi;
  }

  // Helper to format values
  const fmt = (val, round = false) => {
    if (val === '') return '';
    return round ? Math.round(val) : parseFloat(val).toFixed(2);
  };

  // Render cards
  const clfInputHtml = state.flowType === 'subsea' ? `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">${t('CLF', 'CLF')} (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input" id="kd-clf" value="${fmt(initialCLF, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>
  ` : '';

  const subseaResultCards = state.flowType === 'subsea' ? `
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('Dynamic MAASP', 'Dynamic MAASP')}</span>
          <span class="result-value" id="kd-out-dyn-maasp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('Initial Dynamic SICP', 'Initial Dynamic SICP')}</span>
          <span class="result-value" id="kd-out-dyn-sicp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('Riser Displacement', 'Riser Displacement')}</span>
          <span class="result-value" id="kd-out-riser-disp">-</span>
        </div>
  ` : '';

  container.innerHTML = `
    <div class="content-card compact-card" style="border-top: 4px solid var(--accent-color); margin-bottom:12px; padding: 12px 14px;">
      <h3 style="font-size:0.85rem; margin-bottom:10px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px;">${t('Reference Parameters', 'Reference Parameters')}</h3>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
          <span style="font-weight:600; color:var(--text-secondary);">${t('Hole TVD', 'Hole TVD')}</span>
          <span style="font-weight:700; color:var(--text-primary);">${holeTVD.toFixed(1)} ${dUnit}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; border-top: 1px solid #efeae6; padding-top: 6px;">
          <span style="font-weight:600; color:var(--text-secondary);">${t('Shoe TVD', 'Shoe TVD')}</span>
          <span style="font-weight:700; color:var(--text-primary);">${shoeTVD.toFixed(1)} ${dUnit}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; border-top: 1px solid #efeae6; padding-top: 6px;">
          <span style="font-weight:600; color:var(--text-secondary);">${t('String Volume Strokes', 'String Volume Strokes')}</span>
          <span style="font-weight:700; color:var(--text-primary);">${Math.round(strokes).toLocaleString()} stks</span>
        </div>
      </div>
    </div>

    <div class="content-card compact-card" style="margin-bottom:12px; padding: 12px 14px;">
      <h3 style="font-size:0.85rem; margin-bottom:12px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px;">${t('Input Well Control Data', 'Input Well Control Data')}</h3>
      
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">${t('Current Mud Wt', 'Current Mud Wt')} (${mwUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input" id="kd-current-mw" value="${fmt(initialOMW, false)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">${t('LOT in Max MW', 'LOT in Max MW')} (${mwUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input" id="kd-lot-mw" value="${fmt(initialLotMw, false)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">${t('KRP', 'KRP')} (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input" id="kd-krp" value="${fmt(initialSCR, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>
        ${clfInputHtml}

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">${t('SIDP', 'SIDP')} (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input" id="kd-sidp" value="${fmt(initialSIDPP, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">${t('SICP', 'SICP')} (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input" id="kd-sicp" value="${fmt(initialSICP, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>
      </div>

      <button class="btn btn-primary" id="kd-go-btn" style="width:100%; margin-top:15px; margin-bottom:0;">${t('GO', 'GO')}</button>
    </div>

    <!-- Output Section (Initially hidden, populated after GO click) -->
    <div class="content-card compact-card" id="kd-results-card" style="display:none; border-left: 4px solid var(--accent-color); margin-bottom:12px;">
      <h3 style="font-size:0.95rem; margin-bottom:15px; font-weight:600; color:var(--text-primary);">${t('Calculated Results', 'Calculated Results')}</h3>
      <div class="results-grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('Current MAASP', 'Current MAASP')}</span>
          <span class="result-value" id="kd-out-maasp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('Kill Mud Weight', 'Kill Mud Weight')}</span>
          <span class="result-value" id="kd-out-kmw">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('ICP', 'ICP')}</span>
          <span class="result-value" id="kd-out-icp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('FCP', 'FCP')}</span>
          <span class="result-value" id="kd-out-fcp">-</span>
        </div>
        ${subseaResultCards}
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">${t('MAASP After Kill', 'MAASP After Kill')}</span>
          <span class="result-value" id="kd-out-maasp-after">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px; grid-column: span 2;">
          <span class="result-label">${t('Pressure Drop / 100 Stks', 'Pressure Drop / 100 Stks')}</span>
          <span class="result-value" id="kd-out-pres-drop">-</span>
        </div>
      </div>
    </div>

    <!-- Step Down Chart and Schedule Table -->
    <div class="content-card compact-card" id="kd-chart-card" style="display:none; margin-bottom:20px; padding: 12px 14px;">
      <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600; color:var(--text-primary);">${t('Drill Pipe Pressure Step-Down Schedule', 'Drill Pipe Pressure Step-Down Schedule')}</h3>
      
      <!-- SVG Chart Wrapper -->
      <div id="kd-chart-svg-wrapper" style="width:100%; display:flex; justify-content:center; margin-bottom:15px; background:var(--card-bg); border-radius:12px; padding:10px 5px; border: 1px solid var(--border-subtle);"></div>
      
      <!-- Table Schedule -->
      <div style="overflow-x:auto; border: 1px solid var(--border-subtle); border-radius:8px;">
        <table style="width:100%; border-collapse:collapse; font-size:0.8rem; text-align:left;">
          <thead>
            <tr style="background-color:var(--bg-subtle); border-bottom: 1px solid var(--border-subtle);">
              <th style="padding: 8px 12px; font-weight:600; color:var(--text-secondary);">${t('Cumulative Strokes', 'Cumulative Strokes')}</th>
              <th style="padding: 8px 12px; font-weight:600; color:var(--text-secondary); text-align: right;">${t('Drill Pipe Pressure', 'Drill Pipe Pressure')}</th>
            </tr>
          </thead>
          <tbody id="kd-schedule-table-body"></tbody>
        </table>
      </div>
    </div>
  `;

  // Bind GO button click handler
  const goBtn = document.getElementById('kd-go-btn');
  goBtn.onclick = () => {
    // Validation Check: Find missing data entries
    let hasError = false;
    const killContainer = document.getElementById('kill-data-sheet-container');
    const inputsList = killContainer.querySelectorAll('.form-input:not([disabled])');

    inputsList.forEach(input => {
      if (input.value === '' || input.value === null || input.value === undefined) {
        input.style.border = '2px solid var(--accent-color)';
        hasError = true;
      } else {
        input.style.border = ''; // restore to CSS default
      }
    });

    if (hasError) {
      showToast(t("Required input missing", "Required input missing"));
      return;
    }

    // Read input values
    const parseNum = (id) => {
      const el = document.getElementById(id);
      return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0;
    };
    const currentMw = parseNum('kd-current-mw');
    const lotMw = parseNum('kd-lot-mw');
    const krp = parseNum('kd-krp');
    const sidp = parseNum('kd-sidp');
    const sicp = parseNum('kd-sicp');
    const clf = state.flowType === 'subsea' ? parseNum('kd-clf') : 0;

    // Save to state in US units
    state.calcInputs.killOMW_ppg = currentMw;
    state.calcInputs.killLotMw_ppg = lotMw;
    state.calcInputs.killSCR_psi = krp;
    state.calcInputs.killSIDPP_psi = sidp;
    state.calcInputs.killSICP_psi = sicp;
    if (state.flowType === 'subsea') {
      state.calcInputs.killCLF_psi = clf;
    }

    localStorage.setItem('calcInputs', JSON.stringify(state.calcInputs));
    saveCalculationToHistory('kill_sheet');

    const factor = 0.052; // Always use US factor for calculations on this sheet

    // 1. Current MAASP = (LOT - Current Mud Wt) * factor * Shoe TVD
    const currentMaasp = Math.max(0, (lotMw - currentMw) * factor * shoeTVD);

    // 2. Kill Mud Weight = Current Mud Wt + (SIDP / (factor * Hole TVD)) -> Rounded up to 1 decimal place
    const rawKmw = holeTVD > 0 ? (currentMw + (sidp / (factor * holeTVD))) : currentMw;
    const kmw = Math.ceil(rawKmw * 10) / 10;

    // 3. ICP = SIDP + KRP
    const icp = sidp + krp;

    // 4. FCP = KRP * (KMW / Current Mud Wt)
    const fcp = currentMw > 0 ? krp * (kmw / currentMw) : 0;

    // 5. MAASP After Kill = (LOT - KMW) * factor * Shoe TVD
    const maaspAfter = Math.max(0, (lotMw - kmw) * factor * shoeTVD);

    // 6. Pressure Drop per 100 Strokes = (ICP - FCP) / strokes * 100
    const pressDropTotal = icp - fcp;
    const pressDrop100 = strokes > 0 ? (pressDropTotal / strokes) * 100 : 0;

    // 7. Subsea specific calculations: Dynamic MAASP and Initial Dynamic SICP
    const dynMaasp = Math.max(0, currentMaasp - clf);
    const dynSicp = Math.max(0, sicp - clf);

    // Update UI outputs
    document.getElementById('kd-out-maasp').innerHTML = `${Math.floor(currentMaasp * 100) / 100} <span class="unit-lbl">${pressUnit}</span>`;
    document.getElementById('kd-out-kmw').innerHTML = `${kmw.toFixed(1)} <span class="unit-lbl">${mwUnit}</span>`;
    document.getElementById('kd-out-icp').innerHTML = `${Math.round(icp)} <span class="unit-lbl">${pressUnit}</span>`;
    document.getElementById('kd-out-fcp').innerHTML = `${Math.round(fcp)} <span class="unit-lbl">${pressUnit}</span>`;
    document.getElementById('kd-out-maasp-after').innerHTML = `${Math.floor(maaspAfter * 100) / 100} <span class="unit-lbl">${pressUnit}</span>`;

    if (state.flowType === 'subsea') {
      document.getElementById('kd-out-dyn-maasp').innerHTML = `${Math.floor(dynMaasp * 100) / 100} <span class="unit-lbl">${pressUnit}</span>`;
      document.getElementById('kd-out-dyn-sicp').innerHTML = `${Math.round(dynSicp)} <span class="unit-lbl">${pressUnit}</span>`;

      const isBblFt = (state.globalUnit === 'bbl/ft');
      const riserLengthMeters = isBblFt ? (parseFloat(state.calcInputs.riserLength || 0) / 3.28084) : parseFloat(state.calcInputs.riserLength || 0);
      const riserVolLiters = riserLengthMeters * (state.reference.riserAnnular || 0);
      const riserVolSelectedUnit = convertVolume(riserVolLiters, state.globalUnit);
      const riserStrokes = state.reference.pumpOutput > 0 ? (riserVolLiters / state.reference.pumpOutput) : 0;
      const volLabel = (state.globalUnit === 'bbl/m' || state.globalUnit === 'bbl/ft') ? 'bbl' : 'L';

      document.getElementById('kd-out-riser-disp').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:flex-start; line-height:1.2;">
          <span>${Math.round(riserStrokes)} <span class="unit-lbl">stks</span></span>
          <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px; font-weight:500;">${riserVolSelectedUnit.toFixed(1)} ${volLabel}</span>
        </div>
      `;
    }

    // Format press drop avoiding round up
    document.getElementById('kd-out-pres-drop').innerHTML = `${Math.floor(pressDrop100 * 10) / 10} <span class="unit-lbl">${pressUnit}/100 stks</span>`;

    // Reveal results card
    const resultsCard = document.getElementById('kd-results-card');
    resultsCard.style.display = 'block';
    setTimeout(() => {
      resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    // 7. Generate Step-down Chart and Table
    const tableBody = document.getElementById('kd-schedule-table-body');
    const svgWrapper = document.getElementById('kd-chart-svg-wrapper');

    if (tableBody && svgWrapper && strokes > 0) {
      const totalStrokes = Math.round(strokes);
      const strokeInterval = 100;

      let tableRows = '';
      let points = [];

      // Initial point
      tableRows += `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 8px 12px; font-weight: 700; color: var(--text-primary);">0</td>
          <td style="padding: 8px 12px; font-weight: 700; text-align: right; color: var(--accent-color);">${Math.round(icp)} psi</td>
        </tr>
      `;
      points.push({ s: 0, p: icp });

      let currentStroke = strokeInterval;
      const dropPerStroke = (icp - fcp) / totalStrokes;

      while (currentStroke < totalStrokes) {
        const currentPress = icp - (dropPerStroke * currentStroke);
        tableRows += `
          <tr style="border-bottom: 1px solid var(--border-subtle);">
            <td style="padding: 8px 12px; color: var(--text-secondary);">${currentStroke}</td>
            <td style="padding: 8px 12px; text-align: right; color: var(--text-primary); font-weight: 600;">${Math.round(currentPress)} psi</td>
          </tr>
        `;
        points.push({ s: currentStroke, p: currentPress });
        currentStroke += strokeInterval;
      }

      // Final point
      tableRows += `
        <tr style="background-color: var(--bg-subtle);">
          <td style="padding: 8px 12px; font-weight: 700; color: var(--text-primary); border-bottom-left-radius: 8px;">${totalStrokes} (${t('Bit', 'Bit')})</td>
          <td style="padding: 8px 12px; font-weight: 700; text-align: right; color: #10B981; border-bottom-right-radius: 8px;">${Math.round(fcp)} psi</td>
        </tr>
      `;
      points.push({ s: totalStrokes, p: fcp });

      tableBody.innerHTML = tableRows;

      // Draw SVG Chart
      const width = 300;
      const height = 150;
      const padLeft = 45;
      const padRight = 15;
      const padTop = 15;
      const padBottom = 25;

      const chartW = width - padLeft - padRight;
      const chartH = height - padTop - padBottom;

      const maxY = Math.ceil(icp / 100) * 100;
      const maxX = totalStrokes;

      // Generate SVG path points
      let dPath = '';
      let pointCircles = '';
      let gridLines = '';

      // Draw grid lines (horizontal pressure lines)
      const gridLevels = 3;
      for (let i = 0; i <= gridLevels; i++) {
        const val = (maxY / gridLevels) * i;
        const y = padTop + chartH - (val / maxY) * chartH;
        gridLines += `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" />
          <text x="${padLeft - 6}" y="${y + 3}" font-size="7" fill="var(--text-secondary)" text-anchor="end">${Math.round(val)}</text>
        `;
      }

      // Draw vertical grid lines (stroke intervals)
      const vertGridCount = 4;
      for (let i = 0; i <= vertGridCount; i++) {
        const strokeVal = Math.round((maxX / vertGridCount) * i);
        const x = padLeft + (strokeVal / maxX) * chartW;
        gridLines += `
          <line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + chartH}" stroke="var(--border-subtle)" stroke-width="1" stroke-dasharray="3,3" />
          <text x="${x}" y="${padTop + chartH + 12}" font-size="7" fill="var(--text-secondary)" text-anchor="middle">${strokeVal}</text>
        `;
      }

      points.forEach((pt, index) => {
        const x = padLeft + (pt.s / maxX) * chartW;
        const y = padTop + chartH - (pt.p / maxY) * chartH;

        if (index === 0) {
          dPath += `M ${x} ${y}`;
        } else {
          dPath += ` L ${x} ${y}`;
        }

        // Add small interactive circles for key schedule points
        pointCircles += `
          <circle cx="${x}" cy="${y}" r="3.5" fill="var(--bg-subtle)" stroke="var(--accent-color)" stroke-width="2" />
        `;
      });

      const svgContent = `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; overflow:visible;">
          <!-- Grid Lines and labels -->
          ${gridLines}
          
          <!-- Axis Lines -->
          <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + chartH}" stroke="var(--text-secondary)" stroke-width="1.5" />
          <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="var(--text-secondary)" stroke-width="1.5" />
          
          <!-- Chart Line -->
          <path d="${dPath}" stroke="var(--accent-color)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          
          <!-- Circles -->
          ${pointCircles}
          
          <!-- Y-Axis Title -->
          <text x="10" y="${padTop + chartH / 2}" font-size="8" fill="var(--text-primary)" transform="rotate(-90 10 ${padTop + chartH / 2})" text-anchor="middle" font-weight="600">${t('Pressure (psi)', 'Pressure (psi)')}</text>
          
          <!-- X-Axis Title -->
          <text x="${padLeft + chartW / 2}" y="${height - 2}" font-size="8" fill="var(--text-primary)" text-anchor="middle" font-weight="600">${t('Strokes', 'Strokes')}</text>
        </svg>
      `;

      svgWrapper.innerHTML = svgContent;

      // Reveal the chart card
      document.getElementById('kd-chart-card').style.display = 'block';
    }

    // Show a toast message
    showToast(t("Kill sheet calculations completed!", "Kill sheet calculations completed!"));
  };

  // Enforce manual click on GO button to show results, do not auto-run calculations on screen load

  // Auto-sync Kill Sheet inputs to local storage on change
  container.addEventListener('input', (e) => {
    if (e.target.classList.contains('form-input')) {
      const id = e.target.id;
      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
      if (id === 'kd-current-mw') state.calcInputs.killOMW_ppg = val;
      if (id === 'kd-lot-mw') state.calcInputs.killLotMw_ppg = val;
      if (id === 'kd-krp') state.calcInputs.killSCR_psi = val;
      if (id === 'kd-sidp') state.calcInputs.killSIDPP_psi = val;
      if (id === 'kd-sicp') state.calcInputs.killSICP_psi = val;
      if (id === 'kd-clf' && state.flowType === 'subsea') state.calcInputs.killCLF_psi = val;

      localStorage.setItem('calcInputs', JSON.stringify(state.calcInputs));
    }
  });
}

// ==========================================
// BONUS FEATURE 1: API Tubular Data
// ==========================================
tubularSubState = {
  view: 'menu', // menu, casing, drillpipe, tubing, large_casing
  selections: {
    connection: '',
    od: '',
    od_inch: '',
    grade: '',
    weight: '',
    nominal_weight_lbs_ft: '',
    class: ''
  }
};

function renderAPITubularScreen() {
  const container = document.getElementById('api-tubular-container');
  if (!container) return;
  container.innerHTML = '';

  const backBtn = document.querySelector('#screen-api-tubular .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      handleAppBack();
    };
  }

  // Adjust subtitle dynamically
  const subtitle = document.querySelector('#screen-api-tubular .screen-subtitle');
  if (subtitle) {
    if (tubularSubState.view === 'menu') {
      subtitle.textContent = 'API standards nominal capacity & displacement data';
    } else if (tubularSubState.view === 'casing') {
      subtitle.textContent = 'API Casing Table (Standard casing properties)';
    } else if (tubularSubState.view === 'drillpipe') {
      subtitle.textContent = 'API Drill Pipe Table (Grade, connection & class)';
    } else if (tubularSubState.view === 'tubing') {
      subtitle.textContent = 'API Tubing Table (Production & injection tubing)';
    } else if (tubularSubState.view === 'large_casing') {
      subtitle.textContent = 'API Casing/Tubing >22 in (Conductor & surface casing)';
    }
  }

  if (tubularSubState.view === 'menu') {
    // Sub-Screen Selector Menu Grid
    container.innerHTML = `
      <div class="menu-grid" style="grid-template-columns:1fr; gap:14px;">
        <!-- 1. API Casing Table -->
        <div class="toolkit-card compact-card" id="btn-sub-casing">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-surface)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#68553F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">API Casing Table</span>
              <span class="card-desc">BTC, LTC, STC & Premium casing specs</span>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>

        <!-- 2. API Drill Pipe -->
        <div class="toolkit-card compact-card" id="btn-sub-drillpipe">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-tubular)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">API Drill Pipe</span>
              <span class="card-desc">OD, Weight, Grade, Connection & Class</span>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>

        <!-- 3. API Tubing Table -->
        <div class="toolkit-card compact-card" id="btn-sub-tubing">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-subsea)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">API Tubing Table</span>
              <span class="card-desc">EUE, NUE & Premium tubing specifications</span>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>

        <!-- 4. API Casing/Tubing >22 in -->
        <div class="toolkit-card compact-card" id="btn-sub-large">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-stuck)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="8"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">API Casing/Tubing >22 in</span>
              <span class="card-desc">Conductor casing sizes up to 36 inches</span>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>
      </div>
    `;

    document.getElementById('btn-sub-casing').onclick = () => { tubularSubState.view = 'casing'; renderAPITubularScreen(); };
    document.getElementById('btn-sub-drillpipe').onclick = () => { tubularSubState.view = 'drillpipe'; renderAPITubularScreen(); };
    document.getElementById('btn-sub-tubing').onclick = () => { tubularSubState.view = 'tubing'; renderAPITubularScreen(); };
    document.getElementById('btn-sub-large').onclick = () => { tubularSubState.view = 'large_casing'; renderAPITubularScreen(); };
    return;
  }

  // Active Dropdowns Subscreen Implementation
  const viewType = tubularSubState.view;
  const dbList = TUBULAR_DB[viewType] || [];
  const sel = tubularSubState.selections;

  // Render Selections card and empty results container
  container.innerHTML = `
    <div id="loading-api-data" style="display:none; text-align:center; padding:20px; font-weight:600; color:var(--text-secondary);">
      <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; margin-right:8px; vertical-align:middle;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="30, 30"></circle>
      </svg>
      Loading API data...
    </div>
    
    <div id="tubular-main-content">
      <div class="content-card" style="margin-bottom:15px;">
        <h3 style="font-size:0.95rem; margin-bottom:15px; font-weight:700; color:var(--text-primary);">Filter Specifications</h3>
        <div id="dropdowns-container" style="display:flex; flex-direction:column; gap:12px;"></div>
      </div>

      <div id="tubular-result-panel"></div>

      <!-- Action Panel -->
      <div style="display:flex; justify-content:space-between; gap:10px; margin-top:20px;">
        <button class="btn btn-secondary" style="flex:1;" id="btn-tubular-clear">Reset</button>
        <button class="btn btn-secondary" style="flex:1;" id="btn-tubular-calc">Calculate</button>
      </div>
    </div>
  `;

  // Draw dropdown fields
  const dropdownsContainer = document.getElementById('dropdowns-container');
  let fieldOrder = [];

  if (viewType === 'drillpipe') {
    fieldOrder = [
      { key: 'od', label: 'OD (in)', placeholder: 'Select Outer Diameter' },
      { key: 'weight', label: 'Weight (ppf)', placeholder: 'Select Weight' },
      { key: 'grade', label: 'Grade', placeholder: 'Select Grade' },
      { key: 'connection', label: 'Connection Type', placeholder: 'Select Connection' },
      { key: 'class', label: 'Class', placeholder: 'Select Class' }
    ];
  } else if (viewType === 'casing') {
    fieldOrder = [
      { key: 'connection', label: 'Connection Type', placeholder: 'Select Connection' },
      { key: 'od_inch', label: 'OD (in)', placeholder: 'Select Outer Diameter' },
      { key: 'grade', label: 'Grade', placeholder: 'Select Grade' },
      { key: 'nominal_weight_lbs_ft', label: 'Weight (ppf)', placeholder: 'Select Weight' }
    ];
  } else {
    fieldOrder = [
      { key: 'connection', label: 'Connection Type', placeholder: 'Select Connection' },
      { key: 'od', label: 'OD (in)', placeholder: 'Select Outer Diameter' },
      { key: 'grade', label: 'Grade', placeholder: 'Select Grade' },
      { key: 'weight', label: 'Weight (ppf)', placeholder: 'Select Weight' }
    ];
  }

  // Add the select elements to container
  fieldOrder.forEach((f, idx) => {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.style.marginBottom = '0';
    group.innerHTML = `
      <label style="font-size:0.75rem; font-weight:600; margin-bottom:4px; color:var(--text-secondary); display:block;">${f.label}</label>
      <select class="form-select-outlined" id="sel-tubular-${f.key}" disabled>
        <option value="">${f.placeholder}</option>
      </select>
    `;
    dropdownsContainer.appendChild(group);
  });

  // Recursive Cascade Filter Function
  const updateDropdownCascade = () => {
    // Show spinner simulator briefly
    const loader = document.getElementById('loading-api-data');
    const mainContent = document.getElementById('tubular-main-content');

    // Evaluate choices step-by-step
    let filteredList = [...dbList];

    for (let i = 0; i < fieldOrder.length; i++) {
      const field = fieldOrder[i];
      const selectElement = document.getElementById(`sel-tubular-${field.key}`);

      // Get unique available options for this stage based on previous filters
      const uniqueOptions = [...new Set(filteredList.map(item => item[field.key]))].sort((a, b) => {
        const na = parseFloat(a);
        const nb = parseFloat(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });

      // Populate options
      selectElement.innerHTML = `<option value="">${field.placeholder}</option>`;
      uniqueOptions.forEach(opt => {
        const selectedAttr = sel[field.key] == opt ? 'selected' : '';
        selectElement.innerHTML += `<option value="${opt}" ${selectedAttr}>${opt}</option>`;
      });

      // Enable if parent selected (or if it's the first dropdown)
      const isParentSelected = i === 0 || sel[fieldOrder[i - 1].key] !== '';
      selectElement.disabled = !isParentSelected || uniqueOptions.length === 0;

      // Filter next loops by current selected value
      if (sel[field.key] !== '') {
        filteredList = filteredList.filter(item => item[field.key] == sel[field.key]);
      } else {
        // If current selection is empty, all subsequent selections must be cleared
        for (let j = i + 1; j < fieldOrder.length; j++) {
          sel[fieldOrder[j].key] = '';
          const subSelect = document.getElementById(`sel-tubular-${fieldOrder[j].key}`);
          if (subSelect) {
            subSelect.innerHTML = `<option value="">${fieldOrder[j].placeholder}</option>`;
            subSelect.disabled = true;
          }
        }
        break;
      }
    }

    // Evaluate Result Match
    const resultPanel = document.getElementById('tubular-result-panel');
    const saveBtn = document.getElementById('btn-tubular-save');

    let isFullySelected = fieldOrder.every(f => sel[f.key] !== '');
    let matchedItem = null;

    if (isFullySelected) {
      matchedItem = dbList.find(item => {
        return fieldOrder.every(f => item[f.key] == sel[f.key]);
      });
    }

    if (matchedItem) {
      if (saveBtn) {
        saveBtn.disabled = false;
        if (viewType === 'casing') {
          saveBtn.setAttribute('data-capacity', matchedItem.capacity_bbl_ft);
          saveBtn.setAttribute('data-id', matchedItem.id_inch);
          saveBtn.setAttribute('data-name', `${matchedItem.od_inch}" ${matchedItem.grade} ${matchedItem.nominal_weight_lbs_ft}ppf`);
        } else {
          saveBtn.setAttribute('data-capacity', matchedItem.capacity);
          saveBtn.setAttribute('data-id', matchedItem.id);
          saveBtn.setAttribute('data-name', `${matchedItem.od}" ${matchedItem.grade} ${matchedItem.weight}ppf`);
        }
      }

      const isSI = (window.UnitsEngine ? window.UnitsEngine.getUnitSystem() : 'mixed') === 'si';

      if (viewType === 'drillpipe') {
        const idVal = isSI ? (parseFloat(matchedItem.id) * 25.4).toFixed(1) : matchedItem.id;
        const tjOdVal = isSI ? (parseFloat(matchedItem.toolJointOd) * 25.4).toFixed(1) : matchedItem.toolJointOd;
        const tjIdVal = isSI ? (parseFloat(matchedItem.toolJointId) * 25.4).toFixed(1) : matchedItem.toolJointId;
        const torqueVal = matchedItem.makeupTorque !== 'N/A' && !isNaN(parseFloat(matchedItem.makeupTorque)) ?
          (isSI ? Math.round(parseFloat(matchedItem.makeupTorque) * 1.355818).toLocaleString() : parseFloat(matchedItem.makeupTorque).toLocaleString()) : 'N/A';
        const tensileVal = matchedItem.tensile !== 'N/A' && !isNaN(parseFloat(matchedItem.tensile)) ?
          (isSI ? (parseFloat(matchedItem.tensile) * 0.00444822).toFixed(1).toLocaleString() : parseFloat(matchedItem.tensile).toLocaleString()) : 'N/A';
        const torsionalVal = matchedItem.torsional !== 'N/A' && !isNaN(parseFloat(matchedItem.torsional)) ?
          (isSI ? Math.round(parseFloat(matchedItem.torsional) * 1.355818).toLocaleString() : parseFloat(matchedItem.torsional).toLocaleString()) : 'N/A';
        const burstVal = matchedItem.burst !== 'N/A' && !isNaN(parseFloat(matchedItem.burst)) ?
          (isSI ? Math.round(parseFloat(matchedItem.burst) * 0.0689476).toLocaleString() : parseFloat(matchedItem.burst).toLocaleString()) : 'N/A';
        const collapseVal = matchedItem.collapse !== 'N/A' && !isNaN(parseFloat(matchedItem.collapse)) ?
          (isSI ? Math.round(parseFloat(matchedItem.collapse) * 0.0689476).toLocaleString() : parseFloat(matchedItem.collapse).toLocaleString()) : 'N/A';
        const capVal = isSI ? (parseFloat(matchedItem.capacity) * 521.61186).toFixed(2) : matchedItem.capacity;

        resultPanel.innerHTML = `
          <div class="content-card" style="border-left: 4px solid var(--accent-green); animation: fadeIn 0.3s ease;">
            <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:700; color:var(--accent-green);">Specifications Panel</h3>
            <div class="tubular-results-grid">
              <div class="tubular-result-card">
                <span class="tubular-result-label">ID (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${idVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tool Joint OD (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${tjOdVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tool Joint ID (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${tjIdVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Make-up Torque (${isSI ? 'N·m' : 'ft-lbs'})</span>
                <span class="tubular-result-value">${torqueVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tensile Yield Strength (${isSI ? 'kN' : 'lbs'})</span>
                <span class="tubular-result-value">${tensileVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Torsional Yield Strength (${isSI ? 'N·m' : 'ft-lbs'})</span>
                <span class="tubular-result-value">${torsionalVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Burst Pressure (${isSI ? 'bar' : 'psi'})</span>
                <span class="tubular-result-value">${burstVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Collapse Pressure (${isSI ? 'bar' : 'psi'})</span>
                <span class="tubular-result-value">${collapseVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Capacity (${isSI ? 'L/m' : 'bbl/ft'})</span>
                <span class="tubular-result-value">${capVal}</span>
              </div>
            </div>
          </div>
        `;
      } else if (viewType === 'casing') {
        const idVal = isSI ? (parseFloat(matchedItem.id_inch) * 25.4).toFixed(1) : matchedItem.id_inch;
        const driftVal = isSI ? (parseFloat(matchedItem.drift_diameter_inch) * 25.4).toFixed(1) : matchedItem.drift_diameter_inch;
        const wallVal = isSI ? (parseFloat(matchedItem.wall_inch) * 25.4).toFixed(2) : matchedItem.wall_inch;
        const burstVal = isSI ? Math.round(matchedItem.burst_pressure_psi * 0.0689476).toLocaleString() : matchedItem.burst_pressure_psi.toLocaleString();
        const collapseVal = isSI ? Math.round(matchedItem.collapse_pressure_psi * 0.0689476).toLocaleString() : matchedItem.collapse_pressure_psi.toLocaleString();
        const bodyYieldVal = isSI ? ((matchedItem.body_yield_1000_lbs * 1000) * 0.00444822).toFixed(1).toLocaleString() : (matchedItem.body_yield_1000_lbs * 1000).toLocaleString();
        const capVal = isSI ? (matchedItem.capacity_bbl_ft * 521.61186).toFixed(2) : matchedItem.capacity_bbl_ft;
        const dispVal = isSI ? (matchedItem.displacement_bbl_ft * 521.61186).toFixed(2) : matchedItem.displacement_bbl_ft;

        resultPanel.innerHTML = `
          <div class="content-card" style="border-left: 4px solid var(--accent-green); animation: fadeIn 0.3s ease;">
            <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:700; color:var(--accent-green);">Specifications Panel</h3>
            <div class="tubular-results-grid">
              <div class="tubular-result-card">
                <span class="tubular-result-label">ID (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${idVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Drift (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${driftVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Wall Thickness (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${wallVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Burst (${isSI ? 'bar' : 'psi'})</span>
                <span class="tubular-result-value">${burstVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Collapse (${isSI ? 'bar' : 'psi'})</span>
                <span class="tubular-result-value">${collapseVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Body Yield (${isSI ? 'kN' : 'lbs'})</span>
                <span class="tubular-result-value">${bodyYieldVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Capacity (${isSI ? 'L/m' : 'bbl/ft'})</span>
                <span class="tubular-result-value">${capVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Displacement (${isSI ? 'L/m' : 'bbl/ft'})</span>
                <span class="tubular-result-value">${dispVal}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        const idVal = isSI ? (parseFloat(matchedItem.id) * 25.4).toFixed(1) : matchedItem.id;
        const driftVal = isSI ? (parseFloat(matchedItem.drift) * 25.4).toFixed(1) : matchedItem.drift;
        const burstVal = !isNaN(parseFloat(matchedItem.burst)) ?
          (isSI ? Math.round(parseFloat(matchedItem.burst) * 0.0689476).toLocaleString() : parseFloat(matchedItem.burst).toLocaleString()) : 'N/A';
        const collapseVal = !isNaN(parseFloat(matchedItem.collapse)) ?
          (isSI ? Math.round(parseFloat(matchedItem.collapse) * 0.0689476).toLocaleString() : parseFloat(matchedItem.collapse).toLocaleString()) : 'N/A';
        const tensileVal = !isNaN(parseFloat(matchedItem.tensile)) ?
          (isSI ? (parseFloat(matchedItem.tensile) * 0.00444822).toFixed(1).toLocaleString() : parseFloat(matchedItem.tensile).toLocaleString()) : 'N/A';
        const capVal = isSI ? (parseFloat(matchedItem.capacity) * 521.61186).toFixed(2) : matchedItem.capacity;

        resultPanel.innerHTML = `
          <div class="content-card" style="border-left: 4px solid var(--accent-green); animation: fadeIn 0.3s ease;">
            <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:700; color:var(--accent-green);">Specifications Panel</h3>
            <div class="tubular-results-grid">
              <div class="tubular-result-card">
                <span class="tubular-result-label">ID (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${idVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Drift (${isSI ? 'mm' : 'in'})</span>
                <span class="tubular-result-value">${driftVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Burst (${isSI ? 'bar' : 'psi'})</span>
                <span class="tubular-result-value">${burstVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Collapse (${isSI ? 'bar' : 'psi'})</span>
                <span class="tubular-result-value">${collapseVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tensile (${isSI ? 'kN' : 'lbs'})</span>
                <span class="tubular-result-value">${tensileVal}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Capacity (${isSI ? 'L/m' : 'bbl/ft'})</span>
                <span class="tubular-result-value">${capVal}</span>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      if (saveBtn) saveBtn.disabled = true;
      resultPanel.innerHTML = `
        <div style="text-align:center; padding:30px; border: 1.5px dashed var(--border-subtle); border-radius:12px; color:var(--text-secondary); font-size:0.85rem;">
          Select all options above to calculate properties.
        </div>
      `;
    }
  };

  // Wire up dropdown event listeners
  fieldOrder.forEach(f => {
    const select = document.getElementById(`sel-tubular-${f.key}`);
    if (select) {
      select.onchange = (e) => {
        // Show simulated fast loader for premium visual response
        const loader = document.getElementById('loading-api-data');
        const mainContent = document.getElementById('tubular-main-content');
        if (loader && mainContent) {
          loader.style.display = 'block';
          mainContent.style.opacity = '0.3';
          setTimeout(() => {
            loader.style.display = 'none';
            mainContent.style.opacity = '1';
            sel[f.key] = e.target.value;
            updateDropdownCascade();
          }, 150);
        } else {
          sel[f.key] = e.target.value;
          updateDropdownCascade();
        }
      };
    }
  });

  // Action Buttons Wiring
  document.getElementById('btn-tubular-clear').onclick = () => {
    fieldOrder.forEach(f => sel[f.key] = '');
    updateDropdownCascade();
    showToast("Selections reset");
  };

  document.getElementById('btn-tubular-calc').onclick = () => {
    updateDropdownCascade();
    const isFullySelected = fieldOrder.every(f => sel[f.key] !== '');
    if (isFullySelected) {
      showToast("Properties calculated!");
    } else {
      showToast("Please select all parameters first");
    }
  };

  const saveBtnEl = document.getElementById('btn-tubular-save');
  if (saveBtnEl) {
    saveBtnEl.onclick = (e) => {
      const cap = parseFloat(e.target.getAttribute('data-capacity'));
      const id = parseFloat(e.target.getAttribute('data-id'));
      const name = e.target.getAttribute('data-name');

      if (isNaN(cap)) return;

      // Convert capacity from bbl/ft to L/m (standard for main DB calculations)
      // 1 bbl/ft = 158.987 L/m * 3.28084 = 521.611 L/m
      const capacityLPerM = cap * 158.987 * 3.28084;

      if (viewType === 'drillpipe') {
        state.drillstring.dpSize = name;
        state.reference.capacities.DP = capacityLPerM;
        showToast(`Saved ${name} to Drill Pipe Reference!`);
      } else {
        // Casing / tubing
        state.selectedHoleSize = name;
        state.reference.capacities.casing = capacityLPerM;
        showToast(`Saved ${name} as Casing Reference!`);
      }
    };
  }

  // Run initial population
  updateDropdownCascade();
}

// ==========================================
// Stuck Pipe Assistant (100% Offline, Native UI, 13 Locales)
// ==========================================
let _stuckPipeInstance = null;

function renderStuckPipeScreen() {
  const container = document.getElementById('stuck-pipe-container');
  if (!container) return;

  if (typeof window.mountStuckPipe === 'function') {
    if (_stuckPipeInstance && typeof _stuckPipeInstance.destroy === 'function') {
      _stuckPipeInstance.destroy();
    }
    _stuckPipeInstance = window.mountStuckPipe(container);
  } else {
    import('./stuckpipe/ui.js').then((mod) => {
      if (_stuckPipeInstance && typeof _stuckPipeInstance.destroy === 'function') {
        _stuckPipeInstance.destroy();
      }
      _stuckPipeInstance = mod.mountStuckPipe(container);
    }).catch((err) => {
      console.error('Failed to mount Stuck Pipe Assistant module:', err);
    });
  }
}

// ==========================================
// BONUS FEATURE 3: Petroleum Conversion
// ==========================================
function renderConversionScreen() {
  const container = document.getElementById('conversion-container');
  container.innerHTML = `
    <div class="content-card">
      <h3 style="font-size:0.95rem; margin-bottom:15px; font-weight:600;">Petroleum Unit Converter</h3>
      
      <div class="form-group">
        <label>Category</label>
        <div class="select-wrapper">
          <select class="form-select" id="conv-cat">
            <option value="area">Area (m², ft², acre)</option>
            <option value="circ">Circulation Rate (L/min, m³/hr, gpm, bbl/min)</option>
            <option value="force">Impact Force (N, kN, lbf)</option>
            <option value="len">Length (mm, cm, m, km, in, ft)</option>
            <option value="mudw">Mud Weight (ppg, SG, kg/m³, lb/ft³)</option>
            <option value="power">Power (W, kW, hp)</option>
            <option value="pres">Pressure (psi, bar, kPa, MPa)</option>
            <option value="temp">Temperature (°C, °F, K)</option>
            <option value="vel">Velocity (m/s, ft/s, km/h)</option>
            <option value="vol">Volume (L, m³, bbl, gal)</option>
            <option value="weight">Weight (kg, g, lb, ton)</option>
            <option value="flow">Flow Rate (bbl/day, m³/day, gpm)</option>
            <option value="dens">Density (kg/m³, g/cm³, ppg)</option>
            <option value="torque">Torque (N·m, ft·lbf)</option>
            <option value="visc">Viscosity (cP, Pa·s)</option>
            <option value="pump">Pump Output (L/stroke, bbl/stroke)</option>
            <option value="anncap">Annular Capacity (bbl/ft, m³/m, L/m)</option>
            <option value="yp">Yield Point (lb/100ft², Pa)</option>
            <option value="gel">Gel Strength (lb/100ft², Pa)</option>
            <option value="grad">Gradient (psi/ft, kPa/m)</option>
            <option value="energy">Energy (J, BTU, kWh)</option>
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
        <div class="form-group">
          <label>From Value</label>
          <input type="number" step="any" class="form-input" id="conv-from-val" value="1">
        </div>
        <div class="form-group">
          <label>From Unit</label>
          <div class="select-wrapper">
            <select class="form-select" id="conv-from-unit"></select>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; align-items:center;">
        <div class="form-group" style="margin-bottom:0">
          <label>Result</label>
          <input type="text" class="form-input" id="conv-to-val" readonly style="background-color:var(--input-disabled-bg); font-weight:700">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>To Unit</label>
          <div class="select-wrapper">
            <select class="form-select" id="conv-to-unit"></select>
          </div>
        </div>
      </div>
    </div>
  `;

  const catSel = document.getElementById('conv-cat');
  const fromVal = document.getElementById('conv-from-val');
  const toVal = document.getElementById('conv-to-val');
  const fromUnit = document.getElementById('conv-from-unit');
  const toUnit = document.getElementById('conv-to-unit');

  const units = {
    area: [
      { name: 'm²', val: 'm2' },
      { name: 'ft²', val: 'ft2' },
      { name: 'acre', val: 'acre' }
    ],
    circ: [
      { name: 'L/min', val: 'l_min' },
      { name: 'm³/hr', val: 'm3_hr' },
      { name: 'gpm', val: 'gpm' },
      { name: 'bbl/min', val: 'bbl_min' }
    ],
    force: [
      { name: 'N', val: 'n' },
      { name: 'kN', val: 'kn' },
      { name: 'lbf', val: 'lbf' }
    ],
    len: [
      { name: 'mm', val: 'mm' },
      { name: 'cm', val: 'cm' },
      { name: 'm', val: 'm' },
      { name: 'km', val: 'km' },
      { name: 'in', val: 'in' },
      { name: 'ft', val: 'ft' }
    ],
    mudw: [
      { name: 'ppg', val: 'ppg' },
      { name: 'SG', val: 'sg' },
      { name: 'kg/m³', val: 'kg_m3' },
      { name: 'lb/ft³', val: 'lb_ft3' }
    ],
    power: [
      { name: 'W', val: 'w' },
      { name: 'kW', val: 'kw' },
      { name: 'hp', val: 'hp' }
    ],
    pres: [
      { name: 'psi', val: 'psi' },
      { name: 'bar', val: 'bar' },
      { name: 'kPa', val: 'kpa' },
      { name: 'MPa', val: 'mpa' }
    ],
    temp: [
      { name: '°C', val: 'c' },
      { name: '°F', val: 'f' },
      { name: 'K', val: 'k' }
    ],
    vel: [
      { name: 'm/s', val: 'm_s' },
      { name: 'ft/s', val: 'ft_s' },
      { name: 'km/h', val: 'km_h' }
    ],
    vol: [
      { name: 'L', val: 'l' },
      { name: 'm³', val: 'm3' },
      { name: 'bbl', val: 'bbl' },
      { name: 'gal', val: 'gal' }
    ],
    weight: [
      { name: 'kg', val: 'kg' },
      { name: 'g', val: 'g' },
      { name: 'lb', val: 'lb' },
      { name: 'ton', val: 'ton' }
    ],
    flow: [
      { name: 'bbl/day', val: 'bbl_d' },
      { name: 'm³/day', val: 'm3_d' },
      { name: 'gpm', val: 'gpm' }
    ],
    dens: [
      { name: 'kg/m³', val: 'kg_m3' },
      { name: 'g/cm³', val: 'g_cm3' },
      { name: 'ppg', val: 'ppg' }
    ],
    torque: [
      { name: 'N·m', val: 'nm' },
      { name: 'ft·lbf', val: 'ft_lbf' }
    ],
    visc: [
      { name: 'cP', val: 'cp' },
      { name: 'Pa·s', val: 'pa_s' }
    ],
    pump: [
      { name: 'L/stk', val: 'l_stk' },
      { name: 'bbl/stk', val: 'bbl_stk' }
    ],
    anncap: [
      { name: 'bbl/ft', val: 'bbl_ft' },
      { name: 'm³/m', val: 'm3_m' },
      { name: 'L/m', val: 'l_m' }
    ],
    yp: [
      { name: 'lb/100ft²', val: 'lb_100ft2' },
      { name: 'Pa', val: 'pa' }
    ],
    gel: [
      { name: 'lb/100ft²', val: 'lb_100ft2' },
      { name: 'Pa', val: 'pa' }
    ],
    grad: [
      { name: 'psi/ft', val: 'psi_ft' },
      { name: 'kPa/m', val: 'kpa_m' },
      { name: 'bar/m', val: 'bar_m' }
    ],
    energy: [
      { name: 'J', val: 'j' },
      { name: 'BTU', val: 'btu' },
      { name: 'kWh', val: 'kwh' }
    ]
  };

  const populateUnits = () => {
    const list = units[catSel.value] || [];
    fromUnit.innerHTML = '';
    toUnit.innerHTML = '';
    list.forEach((u, i) => {
      fromUnit.innerHTML += `<option value="${u.val}" ${i === 0 ? 'selected' : ''}>${u.name}</option>`;
      toUnit.innerHTML += `<option value="${u.val}" ${i === 1 ? 'selected' : ''}>${u.name}</option>`;
    });
    doConversion();
  };

  const doConversion = () => {
    const val = parseFloat(String(fromVal.value).replace(',', '.'));
    if (isNaN(val)) {
      toVal.value = '';
      return;
    }
    const cat = catSel.value;
    const f = fromUnit.value;
    const t = toUnit.value;

    let base = val; // convert to standard first
    let result = val;

    if (cat === 'area') {
      if (f === 'ft2') base = val * 0.09290304;
      if (f === 'acre') base = val * 4046.8564;

      if (t === 'ft2') result = base / 0.09290304;
      else if (t === 'acre') result = base / 4046.8564;
      else result = base;

    } else if (cat === 'circ') {
      if (f === 'm3_hr') base = val * 16.66667;
      if (f === 'gpm') base = val * 3.78541;
      if (f === 'bbl_min') base = val * 158.9873;

      if (t === 'm3_hr') result = base / 16.66667;
      else if (t === 'gpm') result = base / 3.78541;
      else if (t === 'bbl_min') result = base / 158.9873;
      else result = base;

    } else if (cat === 'force') {
      if (f === 'kn') base = val * 1000;
      if (f === 'lbf') base = val * 4.44822;

      if (t === 'kn') result = base / 1000;
      else if (t === 'lbf') result = base / 4.44822;
      else result = base;

    } else if (cat === 'len') {
      if (f === 'mm') base = val * 0.001;
      if (f === 'cm') base = val * 0.01;
      if (f === 'km') base = val * 1000;
      if (f === 'in') base = val * 0.0254;
      if (f === 'ft') base = val * 0.3048;

      if (t === 'mm') result = base / 0.001;
      else if (t === 'cm') result = base / 0.01;
      else if (t === 'km') result = base / 1000;
      else if (t === 'in') result = base / 0.0254;
      else if (t === 'ft') result = base / 0.3048;
      else result = base;

    } else if (cat === 'mudw') {
      if (f === 'sg') base = val * 8.34;
      if (f === 'kg_m3') base = val * 0.00834;
      if (f === 'lb_ft3') base = val * 0.13368;

      if (t === 'sg') result = base / 8.34;
      else if (t === 'kg_m3') result = base / 0.00834;
      else if (t === 'lb_ft3') result = base / 0.13368;
      else result = base;

    } else if (cat === 'power') {
      if (f === 'kw') base = val * 1000;
      if (f === 'hp') base = val * 745.7;

      if (t === 'kw') result = base / 1000;
      else if (t === 'hp') result = base / 745.7;
      else result = base;

    } else if (cat === 'pres') {
      if (f === 'bar') base = val * 14.50377;
      if (f === 'kpa') base = val * 0.1450377;
      if (f === 'mpa') base = val * 145.0377;

      if (t === 'bar') result = base / 14.50377;
      else if (t === 'kpa') result = base / 0.1450377;
      else if (t === 'mpa') result = base / 145.0377;
      else result = base;

    } else if (cat === 'temp') {
      if (f === 'c') base = val + 273.15;
      else if (f === 'f') base = (val - 32) * 5 / 9 + 273.15;
      else base = val;

      if (t === 'c') result = base - 273.15;
      else if (t === 'f') result = (base - 273.15) * 9 / 5 + 32;
      else result = base;

    } else if (cat === 'vel') {
      if (f === 'ft_s') base = val * 0.3048;
      if (f === 'km_h') base = val / 3.6;

      if (t === 'ft_s') result = base / 0.3048;
      else if (t === 'km_h') result = base * 3.6;
      else result = base;

    } else if (cat === 'vol') {
      if (f === 'm3') base = val * 1000;
      if (f === 'bbl') base = val * 158.9873;
      if (f === 'gal') base = val * 3.78541;

      if (t === 'm3') result = base / 1000;
      else if (t === 'bbl') result = base / 158.9873;
      else if (t === 'gal') result = base / 3.78541;
      else result = base;

    } else if (cat === 'weight') {
      if (f === 'g') base = val * 0.001;
      if (f === 'lb') base = val * 0.45359237;
      if (f === 'ton') base = val * 1000;

      if (t === 'g') result = base / 0.001;
      else if (t === 'lb') result = base / 0.45359237;
      else if (t === 'ton') result = base / 1000;
      else result = base;

    } else if (cat === 'flow') {
      if (f === 'm3_d') base = val * 6.28981;
      if (f === 'gpm') base = val * 34.2857;

      if (t === 'm3_d') result = base / 6.28981;
      else if (t === 'gpm') result = base / 34.2857;
      else result = base;

    } else if (cat === 'dens') {
      if (f === 'kg_m3') base = val * 0.0083454;
      if (f === 'g_cm3') base = val * 8.3454;

      if (t === 'kg_m3') result = base / 0.0083454;
      else if (t === 'g_cm3') result = base / 8.3454;
      else result = base;

    } else if (cat === 'torque') {
      if (f === 'ft_lbf') base = val * 1.355818;

      if (t === 'ft_lbf') result = base / 1.355818;
      else result = base;

    } else if (cat === 'visc') {
      if (f === 'pa_s') base = val * 1000;

      if (t === 'pa_s') result = base / 1000;
      else result = base;

    } else if (cat === 'pump') {
      if (f === 'bbl_stk') base = val * 158.9873;

      if (t === 'bbl_stk') result = base / 158.9873;
      else result = base;

    } else if (cat === 'anncap') {
      if (f === 'bbl_ft') base = val * 521.6117;
      if (f === 'm3_m') base = val * 1000;

      if (t === 'bbl_ft') result = base / 521.6117;
      else if (t === 'm3_m') result = base / 1000;
      else result = base;

    } else if (cat === 'yp' || cat === 'gel') {
      if (f === 'lb_100ft2') base = val * 0.478803;

      if (t === 'lb_100ft2') result = base / 0.478803;
      else result = base;

    } else if (cat === 'grad') {
      if (f === 'kpa_m') base = val * 0.044208;
      if (f === 'bar_m') base = val * 4.4208;

      if (t === 'kpa_m') result = base / 0.044208;
      else if (t === 'bar_m') result = base / 4.4208;
      else result = base;

    } else if (cat === 'energy') {
      if (f === 'btu') base = val * 1055.056;
      if (f === 'kwh') base = val * 3600000;

      if (t === 'btu') result = base / 1055.056;
      else if (t === 'kwh') result = base / 3600000;
      else result = base;
    }

    toVal.value = result.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  catSel.addEventListener('change', populateUnits);
  fromVal.addEventListener('input', doConversion);
  fromUnit.addEventListener('change', doConversion);
  toUnit.addEventListener('change', doConversion);

  populateUnits();
}

// ==========================================
// BONUS FEATURE 4: Drilling Calculator
// ==========================================
// ==========================================
// BONUS FEATURE 4: Drilling Calculator
// ==========================================
calcSubState = {
  view: 'categories', // 'categories', 'list', 'formula'
  section: 'drilling',
  category: 'calculations',
  search: '',
  formulaId: ''
};

quickRefSubState = {
  view: 'menu', // 'menu', 'drill-bit-torque', 'ring-gaskets', 'wellhead', 'subsea-ref'
  wellheadTab: 'A', // 'A', 'B', 'C'
  subseaTab: 'overview' // 'overview', 'running', 'retrieving'
};

const formulaDb = {
  calculations: [
    {
      id: 'leak_off',
      name: 'Leak Off Test Calculation',
      desc: 'Maximum mud weight before formation breakdown at shoe.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'lop', label: 'Surface Leak Off Pressure (psi)', val: 800 },
        { key: 'tvd', label: 'Casing Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => i.mw + (i.lop / (0.052 * i.tvd)),
      unit: 'ppg'
    },
    {
      id: 'slug_weight',
      name: 'Slug Calculation Weight of Slug Required',
      desc: 'Required slug mud weight for a desired pipe drop.',
      inputs: [
        { key: 'mw', label: 'Current Mud Weight (ppg)', val: 10.0 },
        { key: 'drop', label: 'Desired Pipe Drop (ft)', val: 250 },
        { key: 'cap', label: 'Pipe Capacity (bbl/ft)', val: 0.0178 },
        { key: 'vol', label: 'Slug Volume (bbl)', val: 20 }
      ],
      calc: (i) => i.mw + (i.drop * i.cap * i.mw) / i.vol,
      unit: 'ppg'
    },
    {
      id: 'slug_vol',
      name: 'Slug Volume',
      desc: 'Required volume of slug for a desired pipe drop.',
      inputs: [
        { key: 'mw', label: 'Current Mud Weight (ppg)', val: 10.0 },
        { key: 'sw', label: 'Slug Weight (ppg)', val: 12.0 },
        { key: 'drop', label: 'Desired Drop (ft)', val: 250 },
        { key: 'cap', label: 'Pipe Capacity (bbl/ft)', val: 0.0178 }
      ],
      calc: (i) => (i.drop * i.cap * i.mw) / ((i.sw - i.mw) || 1),
      unit: 'bbl'
    },
    {
      id: 'slug_bbl_req',
      name: 'Slug Calculation Barrel of Slug Required for Desired Length',
      desc: 'Volume of slug required to fill a specific length of drill pipe.',
      inputs: [
        { key: 'len', label: 'Desired Slug Length (ft)', val: 500 },
        { key: 'cap', label: 'Pipe Capacity (bbl/ft)', val: 0.0178 }
      ],
      calc: (i) => i.len * i.cap,
      unit: 'bbl'
    },
    {
      id: 'pipe_pulled_dry',
      name: 'Feet of Drill Pipe Pulled – Dry',
      desc: 'Equivalent volume of fluid displaced when POOH dry pipe.',
      inputs: [
        { key: 'len', label: 'Length Pulled (ft)', val: 1000 },
        { key: 'disp', label: 'Pipe Metal Displacement (bbl/ft)', val: 0.0075 }
      ],
      calc: (i) => i.len * i.disp,
      unit: 'bbl'
    },
    {
      id: 'pipe_pulled_wet',
      name: 'Feet of Drill Pipe Pulled – Wet',
      desc: 'Equivalent volume of fluid displaced when POOH wet pipe (internal + metal).',
      inputs: [
        { key: 'len', label: 'Length Pulled (ft)', val: 1000 },
        { key: 'disp', label: 'Pipe Metal Displacement (bbl/ft)', val: 0.0075 },
        { key: 'cap', label: 'Pipe Capacity (bbl/ft)', val: 0.0178 }
      ],
      calc: (i) => i.len * (i.disp + i.cap),
      unit: 'bbl'
    },
    {
      id: 'dp_pulled_lose_dry',
      name: 'Drill Pipe Pulled to Lose Hydrostatic Pressure (Pull Dry)',
      desc: 'Length of dry pipe pulled to lose a specific amount of hydrostatic head.',
      inputs: [
        { key: 'drop', label: 'Hydrostatic Loss Limit (psi)', val: 100 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'disp', label: 'Pipe Displacement (bbl/ft)', val: 0.0075 },
        { key: 'ccap', label: 'Casing/Hole Capacity (bbl/ft)', val: 0.0702 }
      ],
      calc: (i) => i.drop * (i.ccap - i.disp) / ((0.052 * i.mw * i.disp) || 1),
      unit: 'ft'
    },
    {
      id: 'dp_pulled_lose_wet',
      name: 'Drill Pipe Pulled to Lose Hydrostatic Pressure (Pull Wet)',
      desc: 'Length of wet pipe pulled to lose a specific amount of hydrostatic head.',
      inputs: [
        { key: 'drop', label: 'Hydrostatic Loss Limit (psi)', val: 100 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'disp', label: 'Pipe Displacement (bbl/ft)', val: 0.0075 },
        { key: 'cap', label: 'Pipe Capacity (bbl/ft)', val: 0.0178 },
        { key: 'ccap', label: 'Casing/Hole Capacity (bbl/ft)', val: 0.0702 }
      ],
      calc: (i) => i.drop * (i.ccap - i.disp - i.cap) / ((0.052 * i.mw * (i.disp + i.cap)) || 1),
      unit: 'ft'
    },
    {
      id: 'hydro_dec_dry',
      name: 'Hydrostatic Pressure Decrease When POOH Dry Pipe',
      desc: 'Pressure drop when pulling a specific length of dry pipe.',
      inputs: [
        { key: 'len', label: 'Length Pulled (ft)', val: 1000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'disp', label: 'Pipe Displacement (bbl/ft)', val: 0.0075 },
        { key: 'ccap', label: 'Casing/Hole Capacity (bbl/ft)', val: 0.0702 }
      ],
      calc: (i) => (i.disp * i.len * 0.052 * i.mw) / ((i.ccap - i.disp) || 1),
      unit: 'psi'
    },
    {
      id: 'hydro_dec_wet',
      name: 'Hydrostatic Pressure Decrease When POOH Wet Pipe',
      desc: 'Pressure drop when pulling a specific length of wet pipe.',
      inputs: [
        { key: 'len', label: 'Length Pulled (ft)', val: 1000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'disp', label: 'Pipe Displacement (bbl/ft)', val: 0.0075 },
        { key: 'cap', label: 'Pipe Capacity (bbl/ft)', val: 0.0178 },
        { key: 'ccap', label: 'Casing/Hole Capacity (bbl/ft)', val: 0.0702 }
      ],
      calc: (i) => ((i.disp + i.cap) * i.len * 0.052 * i.mw) / ((i.ccap - i.disp - i.cap) || 1),
      unit: 'psi'
    },
    {
      id: 'hydro_grad_gas_cut',
      name: 'Hydrostatic Pressure Using Gradient (Gas Cut)',
      desc: 'Hydrostatic pressure with gas-cut mud using a gradient.',
      inputs: [
        { key: 'tvd', label: 'TVD (ft)', val: 8000 },
        { key: 'grad', label: 'Mud Gradient (psi/ft)', val: 0.52 },
        { key: 'cut', label: 'Gas Cut Percentage (%)', val: 10 }
      ],
      calc: (i) => i.tvd * i.grad * (1 - i.cut / 100),
      unit: 'psi'
    },
    {
      id: 'hydro_mw_gas_cut',
      name: 'Hydrostatic Pressure Using Mud Weight (Gas Cut)',
      desc: 'Hydrostatic pressure with gas-cut mud using density.',
      inputs: [
        { key: 'tvd', label: 'TVD (ft)', val: 8000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'cut', label: 'Gas Cut Percentage (%)', val: 10 }
      ],
      calc: (i) => i.tvd * i.mw * 0.052 * (1 - i.cut / 100),
      unit: 'psi'
    },
    {
      id: 'acc_surf',
      name: 'Accumulator Capacity – Surface Stack (gal)',
      desc: 'Usable fluid volume from surface accumulator system.',
      inputs: [
        { key: 'bottles', label: 'Number of Bottles', val: 10 },
        { key: 'vol', label: 'Bottle Volume (gal)', val: 10 },
        { key: 'p1', label: 'Precharge Pressure (psi)', val: 1000 },
        { key: 'p2', label: 'Min Operating Pressure (psi)', val: 1200 },
        { key: 'p3', label: 'Max System Pressure (psi)', val: 3000 }
      ],
      calc: (i) => i.bottles * i.vol * i.p1 * ((1 / i.p2) - (1 / i.p3)),
      unit: 'gal'
    },
    {
      id: 'acc_subsea',
      name: 'Accumulator Capacity – Subsea BOP',
      desc: 'Usable subsea fluid volume adjusting for water column head.',
      inputs: [
        { key: 'bottles', label: 'Number of Bottles', val: 10 },
        { key: 'vol', label: 'Bottle Volume (gal)', val: 10 },
        { key: 'p1', label: 'Surface Precharge (psi)', val: 1000 },
        { key: 'p2', label: 'Min Operating Pressure (psi)', val: 1200 },
        { key: 'p3', label: 'Max System Pressure (psi)', val: 3000 },
        { key: 'wd', label: 'Water Depth (ft)', val: 3000 },
        { key: 'sw', label: 'Seawater Density (ppg)', val: 8.54 }
      ],
      calc: (i) => {
        const hyd = 0.052 * i.sw * i.wd;
        const effP = i.p1 + hyd;
        return i.bottles * i.vol * effP * ((1 / i.p2) - (1 / i.p3));
      },
      unit: 'gal'
    },
    {
      id: 'acc_bottle_req',
      name: 'Accumulator Bottle Requirement',
      desc: 'Calculate number of bottles needed for usable fluid volume.',
      inputs: [
        { key: 'totalFluid', label: 'Total Usable Fluid Required (gal)', val: 120 },
        { key: 'fluidPerBottle', label: 'Usable Fluid per Bottle (gal)', val: 5 }
      ],
      calc: (i) => Math.ceil(i.totalFluid / (i.fluidPerBottle || 1)),
      unit: 'bottles'
    },
    {
      id: 'acc_precharge',
      name: 'Accumulator Pre-Charge Pressure',
      desc: 'Calculate optimum pre-charge pressure.',
      inputs: [
        { key: 'sysPress', label: 'System Pressure (psi)', val: 3000 }
      ],
      calc: (i) => i.sysPress / 3,
      unit: 'psi'
    },
    {
      id: 'acc_recharge_time',
      name: 'Accumulator Recharge Time',
      desc: 'Time to recharge accumulator system.',
      inputs: [
        { key: 'vol', label: 'Volume to Recharge (gal)', val: 50 },
        { key: 'rate', label: 'Pump Rate (gal/min)', val: 10 }
      ],
      calc: (i) => i.vol / (i.rate || 1),
      unit: 'minutes'
    },
    {
      id: 'bop_close_time',
      name: 'BOP Closing Time',
      desc: 'Estimated time to close BOP.',
      inputs: [
        { key: 'vol', label: 'Closing Volume (gal)', val: 15 },
        { key: 'rate', label: 'Flow Rate (gal/min)', val: 30 }
      ],
      calc: (i) => (i.vol / (i.rate || 1)) * 60,
      unit: 'seconds'
    },
    {
      id: 'bop_open_time',
      name: 'BOP Opening Time',
      desc: 'Estimated time to open BOP.',
      inputs: [
        { key: 'vol', label: 'Opening Volume (gal)', val: 14 },
        { key: 'rate', label: 'Flow Rate (gal/min)', val: 30 }
      ],
      calc: (i) => (i.vol / (i.rate || 1)) * 60,
      unit: 'seconds'
    },
    {
      id: 'ram_close_vol',
      name: 'Ram Closing Volume',
      desc: 'Volume required to close ram preventer.',
      inputs: [
        { key: 'area', label: 'Piston Area (sq in)', val: 75 },
        { key: 'stroke', label: 'Stroke Length (in)', val: 10 }
      ],
      calc: (i) => (i.area * i.stroke) / 231,
      unit: 'gal'
    },
    {
      id: 'annular_close_vol',
      name: 'Annular Closing Volume',
      desc: 'Volume required to close annular preventer.',
      inputs: [
        { key: 'area', label: 'Piston Area (sq in)', val: 150 },
        { key: 'stroke', label: 'Stroke Length (in)', val: 12 }
      ],
      calc: (i) => (i.area * i.stroke) / 231,
      unit: 'gal'
    },
    {
      id: 'control_fluid_req',
      name: 'Control Fluid Requirement',
      desc: 'Total fluid requirement including safety factor.',
      inputs: [
        { key: 'vol', label: 'Total Component Volume (gal)', val: 100 },
        { key: 'sf', label: 'Safety Factor', val: 1.5 }
      ],
      calc: (i) => i.vol * i.sf,
      unit: 'gal'
    },
    {
      id: 'choke_line_cap',
      name: 'Choke Line Capacity',
      desc: 'Volume capacity of the choke line.',
      inputs: [
        { key: 'id', label: 'Line ID (in)', val: 3.0 },
        { key: 'len', label: 'Line Length (ft)', val: 500 }
      ],
      calc: (i) => (Math.pow(i.id, 2) / 1029.4) * i.len,
      unit: 'bbl'
    },
    {
      id: 'kill_line_cap',
      name: 'Kill Line Capacity',
      desc: 'Volume capacity of the kill line.',
      inputs: [
        { key: 'id', label: 'Line ID (in)', val: 3.0 },
        { key: 'len', label: 'Line Length (ft)', val: 500 }
      ],
      calc: (i) => (Math.pow(i.id, 2) / 1029.4) * i.len,
      unit: 'bbl'
    },
    {
      id: 'surface_line_vol',
      name: 'Surface Line Volume',
      desc: 'Volume of surface piping.',
      inputs: [
        { key: 'id', label: 'Line ID (in)', val: 4.0 },
        { key: 'len', label: 'Line Length (ft)', val: 200 }
      ],
      calc: (i) => (Math.pow(i.id, 2) / 1029.4) * i.len,
      unit: 'bbl'
    },
    {
      id: 'bop_function_vol',
      name: 'BOP Function Volume',
      desc: 'Total volume for BOP functions.',
      inputs: [
        { key: 'open', label: 'Total Opening Volume (gal)', val: 40 },
        { key: 'close', label: 'Total Closing Volume (gal)', val: 45 }
      ],
      calc: (i) => i.open + i.close,
      unit: 'gal'
    },
    {
      id: 'bop_press_test_vol',
      name: 'BOP Pressure Test Volume',
      desc: 'Fluid required for pressure test (compressibility).',
      inputs: [
        { key: 'vol', label: 'System Volume (bbl)', val: 50 },
        { key: 'press', label: 'Test Pressure (psi)', val: 5000 },
        { key: 'comp', label: 'Fluid Compressibility (per psi)', val: 0.000003 }
      ],
      calc: (i) => i.vol * i.press * i.comp,
      unit: 'bbl'
    },
    {
      id: 'press_rating_verif',
      name: 'Pressure Rating Verification',
      desc: 'Checks if BOP rating exceeds max pressure.',
      inputs: [
        { key: 'rating', label: 'BOP Rating (psi)', val: 10000 },
        { key: 'maxP', label: 'Max Anticipated Pressure (psi)', val: 8500 }
      ],
      calc: (i) => i.rating - i.maxP,
      unit: 'psi (Margin)'
    },
    {
      id: 'standpipe_press',
      name: 'Standpipe Pressure',
      desc: 'Sum of all pressure losses in the circulating system.',
      inputs: [
        { key: 'p_surf', label: 'Surface Equip Loss (psi)', val: 50 },
        { key: 'p_dp', label: 'Drill Pipe Loss (psi)', val: 500 },
        { key: 'p_dc', label: 'Drill Collar Loss (psi)', val: 300 },
        { key: 'p_bit', label: 'Bit Nozzle Loss (psi)', val: 1200 },
        { key: 'p_ann', label: 'Annular Loss (psi)', val: 200 }
      ],
      calc: (i) => i.p_surf + i.p_dp + i.p_dc + i.p_bit + i.p_ann,
      unit: 'psi'
    },
    {
      id: 'p_loss_dp',
      name: 'Pressure Loss Inside Drill Pipe',
      desc: 'Estimated pressure drop through the drill pipe.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10 },
        { key: 'len', label: 'Pipe Length (ft)', val: 5000 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 300 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => (0.000061 * i.mw * i.len * Math.pow(i.rate, 1.86)) / Math.pow(i.id, 4.86),
      unit: 'psi'
    },
    {
      id: 'p_loss_dc',
      name: 'Pressure Loss in Drill Collar',
      desc: 'Estimated pressure drop through the drill collars.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10 },
        { key: 'len', label: 'Collar Length (ft)', val: 500 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 300 },
        { key: 'id', label: 'Collar ID (in)', val: 2.5 }
      ],
      calc: (i) => (0.000061 * i.mw * i.len * Math.pow(i.rate, 1.86)) / Math.pow(i.id, 4.86),
      unit: 'psi'
    },
    {
      id: 'p_loss_bit',
      name: 'Pressure Loss Across Bit Nozzles',
      desc: 'Pressure drop through the bit.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 300 },
        { key: 'tfa', label: 'Total Flow Area (sq in)', val: 0.35 }
      ],
      calc: (i) => (i.mw * Math.pow(i.rate, 2)) / (10858 * Math.pow(i.tfa || 0.1, 2)),
      unit: 'psi'
    },
    {
      id: 'p_loss_ann',
      name: 'Pressure Loss in Annulus',
      desc: 'Estimated pressure drop in the annulus.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10 },
        { key: 'len', label: 'Annular Length (ft)', val: 5000 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 300 },
        { key: 'dh', label: 'Hole Diameter (in)', val: 8.5 },
        { key: 'dp', label: 'Pipe OD (in)', val: 5.0 }
      ],
      calc: (i) => (0.000061 * i.mw * i.len * Math.pow(i.rate, 1.86)) / (Math.pow((i.dh - i.dp), 3) * Math.pow((i.dh + i.dp), 1.86)),
      unit: 'psi'
    },
    {
      id: 'bhhp',
      name: 'Bit Hydraulic Horsepower (BHHP)',
      desc: 'Horsepower delivered at the bit.',
      inputs: [
        { key: 'p_bit', label: 'Pressure Loss Across Bit (psi)', val: 1200 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 300 }
      ],
      calc: (i) => (i.p_bit * i.rate) / 1714,
      unit: 'HHP'
    },
    {
      id: 'pump_hhp',
      name: 'Hydraulic Horsepower (HHP)',
      desc: 'Total horsepower delivered by mud pumps.',
      inputs: [
        { key: 'spp', label: 'Standpipe Pressure (psi)', val: 3000 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 400 }
      ],
      calc: (i) => (i.spp * i.rate) / 1714,
      unit: 'HHP'
    },
    {
      id: 'jet_impact_force',
      name: 'Jet Impact Force',
      desc: 'Force exerted by fluid exiting bit nozzles.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10 },
        { key: 'rate', label: 'Flow Rate (gpm)', val: 300 },
        { key: 'vn', label: 'Nozzle Velocity (ft/sec)', val: 250 }
      ],
      calc: (i) => (i.mw * i.rate * i.vn) / 1932,
      unit: 'lbf'
    },
    {
      id: 'bit_nozzle_size',
      name: 'Bit Nozzle Size',
      desc: 'Equivalent nozzle size based on Total Flow Area.',
      inputs: [
        { key: 'tfa', label: 'Total Flow Area (sq in)', val: 0.33 },
        { key: 'num', label: 'Number of Nozzles', val: 3 }
      ],
      calc: (i) => Math.sqrt((i.tfa / (i.num || 1)) / (Math.PI / 4)) * 32,
      unit: '/ 32 inch'
    },
    {
      id: 'bit_tfa',
      name: 'Bit Nozzle Total Flow Area',
      desc: 'Calculate TFA for up to three nozzles.',
      inputs: [
        { key: 'n1', label: 'Nozzle 1 (1/32 in)', val: 12 },
        { key: 'n2', label: 'Nozzle 2 (1/32 in)', val: 12 },
        { key: 'n3', label: 'Nozzle 3 (1/32 in)', val: 12 }
      ],
      calc: (i) => (Math.PI / 4) * (Math.pow(i.n1 / 32, 2) + Math.pow(i.n2 / 32, 2) + Math.pow(i.n3 / 32, 2)),
      unit: 'sq in'
    },
    {
      id: 'pump_eff',
      name: 'Pump Efficiency',
      desc: 'Actual volumetric efficiency of the pump.',
      inputs: [
        { key: 'act_vol', label: 'Actual Pump Output (bbl/stk)', val: 0.108 },
        { key: 'theo_vol', label: 'Theoretical Pump Output (bbl/stk)', val: 0.115 }
      ],
      calc: (i) => (i.act_vol / (i.theo_vol || 1)) * 100,
      unit: '%'
    },
    {
      id: 'pump_stroke_req',
      name: 'Pump Stroke Required',
      desc: 'Total strokes to pump a given volume.',
      inputs: [
        { key: 'vol', label: 'Volume to Pump (bbl)', val: 50 },
        { key: 'po', label: 'Pump Output (bbl/stk)', val: 0.11 }
      ],
      calc: (i) => i.vol / (i.po || 1),
      unit: 'strokes'
    },
    {
      id: 'flow_regime',
      name: 'Flow Regime (Laminar/Turbulent)',
      desc: 'Determines flow regime using Critical Velocity (values >1 turbulent, <1 laminar).',
      inputs: [
        { key: 'pv', label: 'Plastic Viscosity (cP)', val: 15 },
        { key: 'yp', label: 'Yield Point (lb/100ft2)', val: 10 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10 },
        { key: 'id', label: 'Pipe ID / Annulus Eq Dia (in)', val: 4.276 },
        { key: 'vel', label: 'Fluid Velocity (ft/min)', val: 200 }
      ],
      calc: (i) => {
        const vc = (1.08 * i.pv + 1.08 * Math.sqrt(Math.pow(i.pv, 2) + 12.34 * i.yp * Math.pow(i.id, 2) * i.mw)) / (i.mw * i.id);
        return (i.vel / 60) / vc;
      },
      unit: 'Ratio (>1 is Turbulent)'
    },
    {
      id: 'reynolds_number',
      name: 'Reynolds Number',
      desc: 'Calculates Reynolds Number (Re) for Newtonian fluid.',
      inputs: [
        { key: 'mw', label: 'Fluid Density (ppg)', val: 10 },
        { key: 'vel', label: 'Velocity (ft/sec)', val: 5 },
        { key: 'dia', label: 'Diameter (in)', val: 4.276 },
        { key: 'visc', label: 'Viscosity (cP)', val: 15 }
      ],
      calc: (i) => (928 * i.mw * i.vel * i.dia) / (i.visc || 1),
      unit: '(Re)'
    },
    {
      id: 'ann_cap',
      name: 'Annular Capacity',
      desc: 'Volumetric capacity between casing/hole ID and pipe OD.',
      inputs: [
        { key: 'id', label: 'Hole/Casing ID (in)', val: 8.5 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 }
      ],
      calc: (i) => (Math.pow(i.id, 2) - Math.pow(i.od, 2)) / 1029.4,
      unit: 'bbl/ft'
    },
    {
      id: 'ann_vel_dia',
      name: 'Annular Velocity Between Two Diameters',
      desc: 'Velocity of mud moving up the annulus.',
      inputs: [
        { key: 'flow', label: 'Flow Rate (gpm)', val: 350 },
        { key: 'id', label: 'Hole/Casing ID (in)', val: 8.5 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 }
      ],
      calc: (i) => (24.51 * i.flow) / ((Math.pow(i.id, 2) - Math.pow(i.od, 2)) || 1),
      unit: 'ft/min'
    },
    {
      id: 'ann_vel_cap',
      name: 'Annular Velocity Using Annular Capacity',
      desc: 'Velocity of mud calculated from annular capacity.',
      inputs: [
        { key: 'flow', label: 'Flow Rate (gpm)', val: 350 },
        { key: 'cap', label: 'Annular Capacity (bbl/ft)', val: 0.0459 }
      ],
      calc: (i) => i.flow / (42 * i.cap || 1),
      unit: 'ft/min'
    },
    {
      id: 'bf_lbs',
      name: 'Buoyancy Factor Using Mud Weight (lb/ft³)',
      desc: 'Steel buoyancy factor using mud density in lb/ft³.',
      inputs: [
        { key: 'mw', label: 'Mud Density (lb/ft³)', val: 74.8 }
      ],
      calc: (i) => 1 - (i.mw / 489.5),
      unit: 'dimensionless'
    },
    {
      id: 'bf_ppg',
      name: 'Buoyancy Factor Using Mud Weight (ppg)',
      desc: 'Steel buoyancy factor using mud weight in ppg.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 }
      ],
      calc: (i) => 1 - (i.mw / 65.5),
      unit: 'dimensionless'
    },
    {
      id: 'pipe_disp',
      name: 'Pipe Displacement Calculation (bbl/ft)',
      desc: 'Approximated steel volume displacement from weight.',
      inputs: [
        { key: 'wt', label: 'Pipe Weight (lb/ft)', val: 19.5 }
      ],
      calc: (i) => i.wt / 2744,
      unit: 'bbl/ft'
    },
    {
      id: 'grad_to_mw',
      name: 'Pressure Gradient to Mud Weight',
      desc: 'Converts psi/ft gradient to ppg equivalent.',
      inputs: [
        { key: 'grad', label: 'Pressure Gradient (psi/ft)', val: 0.52 }
      ],
      calc: (i) => i.grad / 0.052,
      unit: 'ppg'
    },
    {
      id: 'sg_to_mw_lbs',
      name: 'Specific Gravity to Mud Weight (lb/ft³)',
      desc: 'Converts SG to lb/ft³.',
      inputs: [
        { key: 'sg', label: 'Specific Gravity', val: 1.2 }
      ],
      calc: (i) => i.sg * 62.4,
      unit: 'lb/ft³'
    },
    {
      id: 'sg_to_mw_ppg',
      name: 'Specific Gravity to Mud Weight (ppg)',
      desc: 'Converts SG to ppg.',
      inputs: [
        { key: 'sg', label: 'Specific Gravity', val: 1.2 }
      ],
      calc: (i) => i.sg * 8.33,
      unit: 'ppg'
    },
    {
      id: 'sg_to_grad',
      name: 'Specific Gravity to Pressure Gradient (psi/ft)',
      desc: 'Converts SG to psi/ft.',
      inputs: [
        { key: 'sg', label: 'Specific Gravity', val: 1.2 }
      ],
      calc: (i) => i.sg * 0.433,
      unit: 'psi/ft'
    },
    {
      id: 'mw_to_sg',
      name: 'Specific Gravity Using Mud Weight',
      desc: 'Converts ppg to SG.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 }
      ],
      calc: (i) => i.mw / 8.33,
      unit: 'SG'
    },
    {
      id: 'pump_pressure_spm_change',
      name: 'New Pump Pressure – SPM Change',
      desc: 'Calculate new pump pressure when pump speed (SPM) changes.',
      inputs: [
        { key: 'p1', label: 'Old Pump Pressure (psi)', val: 1000 },
        { key: 'spm1', label: 'Old Pump Speed (SPM)', val: 40 },
        { key: 'spm2', label: 'New Pump Speed (SPM)', val: 30 }
      ],
      calc: (i) => i.p1 * Math.pow(i.spm2 / (i.spm1 || 1), 2),
      unit: 'psi'
    },
    {
      id: 'pump_pressure_mw_change',
      name: 'New Pump Pressure – Mud Weight Change',
      desc: 'Calculate new pump pressure when fluid weight (mud weight) changes.',
      inputs: [
        { key: 'p1', label: 'Old Pump Pressure (psi)', val: 1000 },
        { key: 'mw1', label: 'Old Mud Weight (ppg)', val: 10.0 },
        { key: 'mw2', label: 'New Mud Weight (ppg)', val: 12.0 }
      ],
      calc: (i) => i.p1 * (i.mw2 / (i.mw1 || 1)),
      unit: 'psi'
    },
    {
      id: 'pump_pressure_both_change',
      name: 'New Pump Pressure – SPM & Mud Weight Change',
      desc: 'Calculate new pump pressure when both pump speed (SPM) and mud weight change simultaneously.',
      inputs: [
        { key: 'p1', label: 'Old Pump Pressure (psi)', val: 1000 },
        { key: 'spm1', label: 'Old Pump Speed (SPM)', val: 40 },
        { key: 'spm2', label: 'New Pump Speed (SPM)', val: 30 },
        { key: 'mw1', label: 'Old Mud Weight (ppg)', val: 10.0 },
        { key: 'mw2', label: 'New Mud Weight (ppg)', val: 12.0 }
      ],
      calc: (i) => i.p1 * Math.pow(i.spm2 / (i.spm1 || 1), 2) * (i.mw2 / (i.mw1 || 1)),
      unit: 'psi'
    },
    {
      id: 'hydro_loss_float_fail',
      name: 'Hydrostatic Pressure Loss if Casing Float Fails',
      desc: 'Calculate pressure drop when casing float valve fails and fluid levels equalize.',
      inputs: [
        { key: 'mw', label: 'Fluid Density (ppg)', val: 10.0 },
        { key: 'ccap', label: 'Casing Capacity (bbl/ft)', val: 0.0382 },
        { key: 'acap', label: 'Annular Capacity (bbl/ft)', val: 0.0291 },
        { key: 'h', label: 'Unfilled Casing Height (ft)', val: 1000 }
      ],
      calc: (i) => (i.mw * 0.052 * i.ccap * i.h) / ((i.ccap + i.acap) || 1),
      unit: 'psi'
    },
    {
      id: 'tensile_cap',
      name: 'Tensile Capacity of Drill String',
      desc: 'Maximum axial load before pipe body yield.',
      inputs: [
        { key: 'ys', label: 'Yield Strength (psi)', val: 75000 },
        { key: 'area', label: 'Cross-Section Area (sq in)', val: 4.4 }
      ],
      calc: (i) => i.ys * i.area,
      unit: 'lb'
    },
    {
      id: 'dc_wt_vert',
      name: 'Drill Collar Weight for Vertical Wells (lb)',
      desc: 'Required collar weight in vertical well to satisfy weight-on-bit.',
      inputs: [
        { key: 'wob', label: 'Required Weight-on-Bit (lb)', val: 40000 },
        { key: 'bf', label: 'Buoyancy Factor', val: 0.85 },
        { key: 'sf', label: 'Safety Factor (typically 1.15)', val: 1.15 }
      ],
      calc: (i) => (i.wob * i.sf) / i.bf,
      unit: 'lb'
    },
    {
      id: 'dc_wt_dev',
      name: 'Drill Collar Weight for Deviated Wells (lb)',
      desc: 'Required collar weight in deviated well to satisfy weight-on-bit.',
      inputs: [
        { key: 'vertWt', label: 'Vertical DC Weight (lb)', val: 54000 },
        { key: 'angle', label: 'Inclination Angle (degrees)', val: 30 }
      ],
      calc: (i) => i.vertWt / Math.cos(i.angle * Math.PI / 180),
      unit: 'lb'
    },
    {
      id: 'dp_elongation',
      name: 'Drill Pipe Elongation Due to Temperature (in)',
      desc: 'Linear thermal expansion of steel drillstring.',
      inputs: [
        { key: 'len', label: 'String Length (ft)', val: 8000 },
        { key: 'dt', label: 'Temp Increase (°F)', val: 120 }
      ],
      calc: (i) => 0.0000828 * i.len * i.dt,
      unit: 'inches'
    },
    {
      id: 'neutral_point',
      name: 'Neutral Point Calculation',
      desc: 'Distance from the bit where the string is neither in compression nor tension.',
      inputs: [
        { key: 'wob', label: 'Weight on Bit (lb)', val: 40000 },
        { key: 'dc_wt', label: 'BHA Weight in Air (lb/ft)', val: 120 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.5 }
      ],
      calc: (i) => {
        const bf = 1 - (i.mw / 65.5);
        return i.wob / (i.dc_wt * bf || 1);
      },
      unit: 'ft'
    },
    {
      id: 'ds_weight_air',
      name: 'Drill String Weight in Air',
      desc: 'Total dry weight of the drill string components.',
      inputs: [
        { key: 'dp_len', label: 'Drill Pipe Length (ft)', val: 8000 },
        { key: 'dp_wt', label: 'Drill Pipe Weight (lb/ft)', val: 19.5 },
        { key: 'hwdp_len', label: 'HWDP Length (ft)', val: 500 },
        { key: 'hwdp_wt', label: 'HWDP Weight (lb/ft)', val: 50 },
        { key: 'dc_len', label: 'Drill Collar Length (ft)', val: 600 },
        { key: 'dc_wt', label: 'Drill Collar Weight (lb/ft)', val: 120 }
      ],
      calc: (i) => (i.dp_len * i.dp_wt) + (i.hwdp_len * i.hwdp_wt) + (i.dc_len * i.dc_wt),
      unit: 'lb'
    },
    {
      id: 'ds_weight_mud',
      name: 'Drill String Weight in Mud',
      desc: 'Buoyed weight of the drill string.',
      inputs: [
        { key: 'wt_air', label: 'Drill String Weight in Air (lb)', val: 250000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 12.0 }
      ],
      calc: (i) => i.wt_air * (1 - (i.mw / 65.5)),
      unit: 'lb'
    },
    {
      id: 'buckling_load',
      name: 'Buckling Load Calculation',
      desc: 'Estimated critical buckling force in a vertical wellbore.',
      inputs: [
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 },
        { key: 'wt_mud', label: 'Buoyed Weight of Pipe (lb/ft)', val: 16.5 }
      ],
      calc: (i) => {
        const I = 0.049087 * (Math.pow(i.od, 4) - Math.pow(i.id, 4));
        const E = 30000000;
        const wt_in = i.wt_mud / 12;
        return 2.85 * Math.pow(E * I * Math.pow(wt_in, 2), 1/3);
      },
      unit: 'lb'
    },
    {
      id: 'burst_pressure',
      name: 'Burst Pressure Rating',
      desc: 'Barlows formula for pipe burst resistance.',
      inputs: [
        { key: 'yield', label: 'Material Yield Strength (psi)', val: 135000 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => {
        const t = (i.od - i.id) / 2;
        return (2 * i.yield * t) / i.od;
      },
      unit: 'psi'
    },
    {
      id: 'collapse_pressure',
      name: 'Collapse Pressure Rating',
      desc: 'Simplified empirical estimate for collapse resistance.',
      inputs: [
        { key: 'yield', label: 'Material Yield Strength (psi)', val: 135000 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => {
        const t = (i.od - i.id) / 2;
        const dt = i.od / (t || 1);
        return 2 * i.yield * ((dt - 1) / Math.pow(dt, 2));
      },
      unit: 'psi'
    },
    {
      id: 'pipe_body_yield',
      name: 'Pipe Body Yield Strength',
      desc: 'Maximum tensile load before plastic deformation.',
      inputs: [
        { key: 'yield', label: 'Material Yield Strength (psi)', val: 135000 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => {
        const area = (Math.PI / 4) * (Math.pow(i.od, 2) - Math.pow(i.id, 2));
        return i.yield * area;
      },
      unit: 'lb'
    },
    {
      id: 'tool_joint_strength',
      name: 'Tool Joint Strength',
      desc: 'Tensile capacity of the connection.',
      inputs: [
        { key: 'yield', label: 'Material Yield Strength (psi)', val: 120000 },
        { key: 'tj_od', label: 'Tool Joint OD (in)', val: 6.625 },
        { key: 'tj_id', label: 'Tool Joint ID (in)', val: 3.25 }
      ],
      calc: (i) => {
        const area = (Math.PI / 4) * (Math.pow(i.tj_od, 2) - Math.pow(i.tj_id, 2));
        return i.yield * area;
      },
      unit: 'lb'
    },
    {
      id: 'hook_load_calc',
      name: 'Hook Load Calculation',
      desc: 'Estimated static hook load with buoyed string weight.',
      inputs: [
        { key: 'ds_air', label: 'Drill String Weight in Air (lb)', val: 200000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 11.5 },
        { key: 'bha_air', label: 'BHA Weight in Air (lb)', val: 40000 },
        { key: 'block_wt', label: 'Block Assembly Weight (lb)', val: 35000 }
      ],
      calc: (i) => {
        const bf = 1 - (i.mw / 65.5);
        return ((i.ds_air + i.bha_air) * bf) + i.block_wt;
      },
      unit: 'lb'
    },
    {
      id: 'max_allowable_pull',
      name: 'Maximum Allowable Pull',
      desc: 'Maximum operational pull considering safety margin.',
      inputs: [
        { key: 'yield_lb', label: 'Pipe Body Yield Strength (lb)', val: 500000 },
        { key: 'sf_pct', label: 'Safety Factor Margin (%)', val: 15 }
      ],
      calc: (i) => i.yield_lb * (1 - (i.sf_pct / 100)),
      unit: 'lb'
    },
    {
      id: 'wob_calc',
      name: 'Bit Weight on Bottom (WOB)',
      desc: 'Calculated WOB based on hook load difference.',
      inputs: [
        { key: 'hl_free', label: 'Off-Bottom Hook Load (lb)', val: 220000 },
        { key: 'hl_drill', label: 'On-Bottom Hook Load (lb)', val: 185000 }
      ],
      calc: (i) => i.hl_free - i.hl_drill,
      unit: 'lb'
    },
    {
      id: 'safety_factor_calc',
      name: 'Safety Factor Calculation',
      desc: 'Ratio of component strength to applied load.',
      inputs: [
        { key: 'strength', label: 'Component Yield Strength (lb)', val: 500000 },
        { key: 'load', label: 'Applied Tensile Load (lb)', val: 300000 }
      ],
      calc: (i) => i.strength / (i.load || 1),
      unit: 'Ratio'
    },
    {
      id: 'ecd_applied',
      name: 'Equivalent Circulating Density',
      desc: 'Total dynamic bottom-hole pressure expressed in density.',
      inputs: [
        { key: 'mw', label: 'Static Mud Weight (ppg)', val: 10.2 },
        { key: 'apl', label: 'Annular Pressure Loss (psi)', val: 350 },
        { key: 'tvd', label: 'TVD (ft)', val: 8500 }
      ],
      calc: (i) => i.mw + (i.apl / (0.052 * i.tvd)),
      unit: 'ppg'
    },
    {
      id: 'eff_mud_dens',
      name: 'Effective Mud Density',
      desc: 'Effective mud column density including cuttings load.',
      inputs: [
        { key: 'mw', label: 'Static Mud Weight (ppg)', val: 10.2 },
        { key: 'apl', label: 'Annular Pressure Loss (psi)', val: 350 },
        { key: 'tvd', label: 'TVD (ft)', val: 8500 }
      ],
      calc: (i) => i.mw + (i.apl / (0.052 * i.tvd)),
      unit: 'ppg'
    },
    {
      id: 'fpc_stuck',
      name: 'Free Point Constant for Stuck Pipe Calculation',
      desc: 'Factor relating steel expansion to pull force.',
      inputs: [
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => 2.5 * (Math.pow(i.od, 2) - Math.pow(i.id, 2)),
      unit: 'FPC'
    },
    {
      id: 'int_cap',
      name: 'Internal Capacity (bbl/ft)',
      desc: 'Volumetric capacity of pipe inside diameter.',
      inputs: [
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => Math.pow(i.id, 2) / 1029.4,
      unit: 'bbl/ft'
    },
    {
      id: 'lag_time',
      name: 'Lag Time Calculation',
      desc: 'Time for bottoms-up fluid returns to reach surface.',
      inputs: [
        { key: 'annVol', label: 'Annular Volume (bbl)', val: 500 },
        { key: 'out', label: 'Pump Output (bbl/stroke)', val: 0.1 },
        { key: 'spm', label: 'Pump Speed (spm)', val: 80 }
      ],
      calc: (i) => i.annVol / (i.out * i.spm || 1),
      unit: 'minutes'
    },
    {
      id: 'spot_pill',
      name: 'Light Weight Spot Pill',
      desc: 'Calculates height of lightweight fluid spot pill.',
      inputs: [
        { key: 'v', label: 'Pill Volume (bbl)', val: 50 },
        { key: 'cap', label: 'Pipe/Annulus Capacity (bbl/ft)', val: 0.0178 }
      ],
      calc: (i) => i.v / i.cap,
      unit: 'ft'
    },
    {
      id: 'overpull_margin',
      name: 'Margin of Overpull in Drillstring (lb)',
      desc: 'Safety load capability before yielding top joint.',
      inputs: [
        { key: 'ts', label: 'Tensile Strength of Top Joint (lb)', val: 350000 },
        { key: 'wt', label: 'Drillstring Weight in Mud (lb)', val: 220000 }
      ],
      calc: (i) => i.ts - i.wt,
      unit: 'lb'
    },
    {
      id: 'max_rop',
      name: 'Maximum ROP Before Fracture Formation',
      desc: 'Maximum drilling speed to prevent ECD exceeding fracture limit.',
      inputs: [
        { key: 'fg', label: 'Fracture Gradient (psi/ft)', val: 0.8 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'tvd', label: 'TVD (ft)', val: 8000 },
        { key: 'apl', label: 'Baseline APL (psi)', val: 200 }
      ],
      calc: (i) => {
        const allowedAPL = (i.fg / 0.052 - i.mw) * 0.052 * i.tvd - i.apl;
        const rop = Math.max(0, allowedAPL * 10 / (i.mw * i.tvd || 1)) * 30; // scaled index
        return rop;
      },
      unit: 'ft/hr'
    },
    {
      id: 'pipe_disp_applied',
      name: 'Pipe Displacement Calculation',
      desc: 'Metal volume displacement per foot.',
      inputs: [
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => (Math.pow(i.od, 2) - Math.pow(i.id, 2)) / 1029.4,
      unit: 'bbl/ft'
    },
    {
      id: 'break_circ',
      name: 'Pressure Required to Break Circulation in Annulus',
      desc: 'Minimum pressure to start mud movement after static gelation.',
      inputs: [
        { key: 'gel', label: 'Gel Strength (lb/100ft²)', val: 20 },
        { key: 'len', label: 'Annular Length (ft)', val: 8000 },
        { key: 'hid', label: 'Hole ID (in)', val: 8.5 },
        { key: 'pod', label: 'Pipe OD (in)', val: 5.0 }
      ],
      calc: (i) => (i.gel * i.len) / (300 * (i.hid - i.pod) || 1),
      unit: 'psi'
    },
    {
      id: 'break_gel',
      name: 'Pressure Required to Break Gel Strength',
      desc: 'Mud start-up pressure limit.',
      inputs: [
        { key: 'gel', label: 'Gel Strength (lb/100ft²)', val: 20 },
        { key: 'len', label: 'Annular Length (ft)', val: 8000 },
        { key: 'hid', label: 'Hole ID (in)', val: 8.5 },
        { key: 'pod', label: 'Pipe OD (in)', val: 5.0 }
      ],
      calc: (i) => (i.gel * i.len) / (300 * (i.hid - i.pod) || 1),
      unit: 'psi'
    },
    {
      id: 'pump_out_duplex',
      name: 'Pump Out Put Calculation Duplex',
      desc: 'Liner output for double-acting duplex pump.',
      inputs: [
        { key: 'liner', label: 'Liner Diameter (in)', val: 6.0 },
        { key: 'rod', label: 'Rod Diameter (in)', val: 2.0 },
        { key: 'stroke', label: 'Stroke Length (in)', val: 12 },
        { key: 'eff', label: 'Volumetric Efficiency (%)', val: 90 }
      ],
      calc: (i) => 0.000162 * (2 * Math.pow(i.liner, 2) - Math.pow(i.rod, 2)) * i.stroke * (i.eff / 100),
      unit: 'bbl/stroke'
    },
    {
      id: 'pump_out_triplex',
      name: 'Pump Out Put Calculation Triplex',
      desc: 'Liner output for single-acting triplex pump.',
      inputs: [
        { key: 'liner', label: 'Liner Diameter (in)', val: 6.0 },
        { key: 'stroke', label: 'Stroke Length (in)', val: 12 },
        { key: 'eff', label: 'Volumetric Efficiency (%)', val: 95 }
      ],
      calc: (i) => 0.000243 * Math.pow(i.liner, 2) * i.stroke * (i.eff / 100),
      unit: 'bbl/stroke'
    },
    {
      id: 'pump_pres_stroke_adv',
      name: 'Pump Pressure & Pump Stroke Advance',
      desc: 'Speed adjustment pressure scaling with custom exponent.',
      inputs: [
        { key: 'p1', label: 'Current Pressure (psi)', val: 1500 },
        { key: 'spm1', label: 'Current SPM', val: 60 },
        { key: 'spm2', label: 'New SPM', val: 80 },
        { key: 'n', label: 'Exponent index (1.8-2.0)', val: 1.86 }
      ],
      calc: (i) => i.p1 * Math.pow(i.spm2 / i.spm1, i.n),
      unit: 'psi'
    },
    {
      id: 'pump_pres_stroke_basic',
      name: 'Pump Pressure & Pump Stroke Basic',
      desc: 'Speed adjustment pressure scaling with standard square law.',
      inputs: [
        { key: 'p1', label: 'Current Pressure (psi)', val: 1500 },
        { key: 'spm1', label: 'Current SPM', val: 60 },
        { key: 'spm2', label: 'New SPM', val: 80 }
      ],
      calc: (i) => i.p1 * Math.pow(i.spm2 / i.spm1, 2),
      unit: 'psi'
    },
    {
      id: 'pump_rate_req',
      name: 'Pump Rate Required',
      desc: 'Flow rate needed to sustain target annular velocity.',
      inputs: [
        { key: 'av', label: 'Desired Annular Velocity (ft/min)', val: 120 },
        { key: 'annCap', label: 'Annular Capacity (bbl/ft)', val: 0.0459 }
      ],
      calc: (i) => i.av * i.annCap,
      unit: 'bbl/min'
    },
    {
      id: 'rt_ton_mile',
      name: 'Round Trip Ton Mile',
      desc: 'Total work done during a drillstring round trip.',
      inputs: [
        { key: 'depth', label: 'Hole Depth (ft)', val: 10000 },
        { key: 'dswt', label: 'Drill Pipe Weight (lb/ft)', val: 19.5 },
        { key: 'dcwt', label: 'Drill Collar Weight (lb/ft)', val: 120 },
        { key: 'dclen', label: 'Drill Collar Length (ft)', val: 600 },
        { key: 'bwt', label: 'Block Assembly Weight (lb)', val: 15000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 }
      ],
      calc: (i) => {
        const bf = 1 - i.mw / 65.5;
        const Wdp = i.dswt * bf;
        const Wdc = i.dcwt * bf;
        return (i.depth * (Wdp * i.depth + 4 * i.bwt) + 2 * i.dclen * (Wdc - Wdp)) / 10560000;
      },
      unit: 'Ton-Miles'
    },
    {
      id: 'stuck_pipe_calc',
      name: 'Stuck Pipe Calculation',
      desc: 'Free length of stuck drillstring using stretch measurements.',
      inputs: [
        { key: 'stretch', label: 'Pipe Stretch (inches)', val: 15 },
        { key: 'pull', label: 'Overpull Force (lb)', val: 70000 },
        { key: 'fpc', label: 'Free Point Constant (FPC)', val: 2.5 }
      ],
      calc: (i) => (i.stretch * i.fpc * 100000) / (i.pull || 1),
      unit: 'ft (Free Pipe Length)'
    },
    {
      id: 'stuck_pipe_not_know_fpc',
      name: 'Stuck Pipe Calculation Not Know Free Point',
      desc: 'Approximated free length when pipe dimensions are unknown.',
      inputs: [
        { key: 'stretch', label: 'Pipe Stretch (inches)', val: 15 },
        { key: 'pull', label: 'Overpull Force (lb)', val: 70000 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 },
        { key: 'id', label: 'Pipe ID (in)', val: 4.276 }
      ],
      calc: (i) => {
        const fpc = 2.5 * (Math.pow(i.od, 2) - Math.pow(i.id, 2));
        return (i.stretch * fpc * 100000) / (i.pull || 1);
      },
      unit: 'ft (Free Pipe Length)'
    },
    {
      id: 'diff_stick_force',
      name: 'Differential Sticking Force',
      desc: 'Estimated force required to overcome differential sticking.',
      inputs: [
        { key: 'dp', label: 'Differential Pressure (psi)', val: 500 },
        { key: 'thick', label: 'Permeable Zone Thickness (ft)', val: 50 },
        { key: 'width', label: 'Contact Width (in)', val: 2.0 },
        { key: 'ff', label: 'Friction Factor', val: 0.25 }
      ],
      calc: (i) => i.dp * (i.thick * 12) * i.width * i.ff,
      unit: 'lb'
    },
    {
      id: 'mech_stick_risk',
      name: 'Mechanical Sticking Analysis',
      desc: 'Evaluates sticking severity based on drag forces.',
      inputs: [
        { key: 'puw', label: 'Pick-Up Weight (lb)', val: 220000 },
        { key: 'sow', label: 'Slack-Off Weight (lb)', val: 180000 },
        { key: 'rw', label: 'Rotating Weight (lb)', val: 200000 }
      ],
      calc: (i) => ((i.puw - i.rw) + (i.rw - i.sow)) / i.rw * 100,
      unit: '% (Risk Index)'
    },
    {
      id: 'jar_impact_force',
      name: 'Jar Force Estimate',
      desc: 'Estimated impact force generated by drilling jars.',
      inputs: [
        { key: 'overpull', label: 'Applied Overpull (lb)', val: 50000 },
        { key: 'dc_wt', label: 'BHA Weight Above Jar (lb)', val: 30000 },
        { key: 'accel', label: 'Acceleration Factor', val: 1.5 }
      ],
      calc: (i) => i.overpull + (i.dc_wt * i.accel),
      unit: 'lb'
    },
    {
      id: 'back_off_torque',
      name: 'Back-Off Torque',
      desc: 'Recommended left-hand torque for backing off pipe.',
      inputs: [
        { key: 'mut', label: 'Connection Make-Up Torque (ft-lb)', val: 15000 },
        { key: 'sf', label: 'Back-Off Factor (0.7-0.9)', val: 0.8 }
      ],
      calc: (i) => i.mut * i.sf,
      unit: 'ft-lb'
    },
    {
      id: 'fish_string_load',
      name: 'Fishing String Load',
      desc: 'Total surface load when pulling on fish.',
      inputs: [
        { key: 'wt', label: 'String Weight in Air (lb)', val: 150000 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.5 },
        { key: 'overpull', label: 'Overpull (lb)', val: 40000 }
      ],
      calc: (i) => (i.wt * (1 - i.mw / 65.5)) + i.overpull,
      unit: 'lb'
    },
    {
      id: 'max_overpull',
      name: 'Maximum Allowable Overpull',
      desc: 'Safe overpull margin based on weakest string component.',
      inputs: [
        { key: 'yield', label: 'Yield Strength of Weakest Pipe (lb)', val: 350000 },
        { key: 'sf', label: 'Safety Factor (%)', val: 90 },
        { key: 'buoy_wt', label: 'Buoyed String Weight (lb)', val: 180000 }
      ],
      calc: (i) => (i.yield * (i.sf / 100)) - i.buoy_wt,
      unit: 'lb'
    },
    {
      id: 'washover_length',
      name: 'Washover Pipe Capacity',
      desc: 'Volume required to fill washover pipe.',
      inputs: [
        { key: 'id', label: 'Washover Pipe ID (in)', val: 7.0 },
        { key: 'od', label: 'Fish OD (in)', val: 5.0 },
        { key: 'len', label: 'Washover Length (ft)', val: 500 }
      ],
      calc: (i) => (Math.pow(i.id, 2) - Math.pow(i.od, 2)) / 1029.4 * i.len,
      unit: 'bbl'
    },
    {
      id: 'milling_time',
      name: 'Milling Time Estimate',
      desc: 'Estimated time required to mill a fish.',
      inputs: [
        { key: 'len', label: 'Fish Length to Mill (ft)', val: 10 },
        { key: 'rate', label: 'Average Milling Rate (ft/hr)', val: 1.5 }
      ],
      calc: (i) => i.len / (i.rate || 1),
      unit: 'hrs'
    },
    {
      id: 'spotting_time',
      name: 'Spotting Fluid Time',
      desc: 'Time required to pump and spot a pill at stuck depth.',
      inputs: [
        { key: 'vol', label: 'Drillstring Volume to Spot Depth (bbl)', val: 120 },
        { key: 'rate', label: 'Pump Rate (bbl/min)', val: 5 }
      ],
      calc: (i) => i.vol / (i.rate || 1),
      unit: 'mins'
    },
    {
      id: 'pipe_recovery_est',
      name: 'Pipe Recovery Estimate',
      desc: 'Percentage of drillstring expected to be recovered free.',
      inputs: [
        { key: 'total', label: 'Total Drillstring Length (ft)', val: 10000 },
        { key: 'free', label: 'Calculated Free Pipe Length (ft)', val: 7500 }
      ],
      calc: (i) => (i.free / (i.total || 1)) * 100,
      unit: '%'
    },
    {
      id: 'casing_ton_mile',
      name: 'Ton-Miles for Setting Casing',
      desc: 'Total work done setting a casing string.',
      inputs: [
        { key: 'depth', label: 'Casing Depth (ft)', val: 8000 },
        { key: 'cwt', label: 'Casing Weight (lb/ft)', val: 36 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'bwt', label: 'Block Assembly Weight (lb)', val: 15000 }
      ],
      calc: (i) => {
        const bf = 1 - i.mw / 65.5;
        const Wc = i.cwt * bf;
        return (i.depth * (Wc * i.depth + 4 * i.bwt)) / (10560000 * 2);
      },
      unit: 'Ton-Miles'
    },
    {
      id: 'cuttings_vol_bbl',
      name: 'Volume of Cutting Generated While Drilling (bbl/hr)',
      desc: 'Cuttings volume rate generated at bit.',
      inputs: [
        { key: 'rop', label: 'ROP (ft/hr)', val: 50 },
        { key: 'hid', label: 'Hole ID (in)', val: 8.5 }
      ],
      calc: (i) => i.rop * Math.pow(i.hid, 2) / 1029.4,
      unit: 'bbl/hr'
    },
    {
      id: 'cuttings_vol_gph',
      name: 'Volume of Cutting Generated While Drilling (gall/hr)',
      desc: 'Cuttings volume rate generated at bit in gallons.',
      inputs: [
        { key: 'rop', label: 'ROP (ft/hr)', val: 50 },
        { key: 'hid', label: 'Hole ID (in)', val: 8.5 }
      ],
      calc: (i) => (i.rop * Math.pow(i.hid, 2) / 1029.4) * 42,
      unit: 'gal/hr'
    },
    {
      id: 'cuttings_vol_gpm',
      name: 'Volume of Cutting Generated While Drilling (gall/min)',
      calc: (i) => ((i.rop * Math.pow(i.hid, 2) / 1029.4) * 42) / 60,
      unit: 'gal/min'
    }
  ]
};

const wellControlDb = {
  surface: [
    {
      id: 'icp',
      name: 'Initial Circulating Pressure',
      desc: 'Required pressure to initiate circulation during the kill operation (Driller\'s method).',
      inputs: [
        { key: 'sidpp', label: 'Shut-In Drill Pipe Pressure (SIDPP - psi)', val: 450 },
        { key: 'scr', label: 'Slow Circulating Rate Pressure (SCR - psi)', val: 600 }
      ],
      calc: (i) => i.sidpp + i.scr,
      unit: 'psi'
    },
    {
      id: 'fcp',
      name: 'Final Circulating Pressure',
      desc: 'Circulating pressure required when kill mud fills the drillstring.',
      inputs: [
        { key: 'scr', label: 'Slow Circulating Rate Pressure (SCR - psi)', val: 600 },
        { key: 'kmw', label: 'Kill Mud Weight (KMW - ppg)', val: 11.22 },
        { key: 'omw', label: 'Original Mud Weight (ppg)', val: 10.2 }
      ],
      calc: (i) => i.scr * (i.kmw / (i.omw || 1)),
      unit: 'psi'
    },
    {
      id: 'kmw',
      name: 'Kill Mud Weight',
      desc: 'Density of mud required to balance reservoir/formation pressure.',
      inputs: [
        { key: 'omw', label: 'Original Mud Weight (ppg)', val: 10.2 },
        { key: 'sidpp', label: 'Shut-In Drill Pipe Pressure (SIDPP - psi)', val: 450 },
        { key: 'tvd', label: 'True Vertical Depth (TVD - ft)', val: 8500 }
      ],
      calc: (i) => i.omw + (i.sidpp / (0.052 * i.tvd)),
      unit: 'ppg'
    },
    {
      id: 'kick_tolerance',
      name: 'Kick Tolerance',
      desc: 'Maximum mud weight increase allowable before casing shoe fracture.',
      inputs: [
        { key: 'lop', label: 'Leak Off Pressure (psi)', val: 1500 },
        { key: 'hyd', label: 'Shoe Hydrostatic of Current Mud (psi)', val: 1200 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => (i.lop - i.hyd) / (0.052 * i.tvd),
      unit: 'ppg'
    },
    {
      id: 'maasp',
      name: 'MAASP',
      desc: 'Maximum Allowable Annular Surface Pressure to prevent casing shoe fracture.',
      inputs: [
        { key: 'lot', label: 'Fracture / Leak Off Gradient (ppg EMW)', val: 15.0 },
        { key: 'mw', label: 'Current Mud Weight (ppg)', val: 10.2 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => (i.lot - i.mw) * 0.052 * i.tvd,
      unit: 'psi'
    },
    {
      id: 'trip_margin',
      name: 'Trip Margin',
      desc: 'Required mud weight offset to overcome swab pressures.',
      inputs: [
        { key: 'yp', label: 'Yield Point (lb/100ft²)', val: 15 },
        { key: 'id', label: 'Hole ID (in)', val: 8.5 },
        { key: 'od', label: 'Pipe OD (in)', val: 5.0 }
      ],
      calc: (i) => i.yp / (11.7 * (i.id - i.od)),
      unit: 'ppg'
    },
    {
      id: 'safety_margin',
      name: 'Safety Margin',
      desc: 'Overbalance margin between mud hydrostatic pressure and formation pressure.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.2 },
        { key: 'tvd', label: 'True Vertical Depth (TVD - ft)', val: 8500 },
        { key: 'fp', label: 'Formation Pore Pressure (psi)', val: 4000 }
      ],
      calc: (i) => (0.052 * i.mw * i.tvd) - i.fp,
      unit: 'psi'
    },
    {
      id: 'volume_to_bleed',
      name: 'Volume to Bleed to Keep BHP Constant',
      desc: 'Volume of mud to bleed to keep bottomhole pressure constant during closed well gas migration.',
      inputs: [
        { key: 'sidpp', label: 'Shut-In Drill Pipe Pressure (SIDPP - psi)', val: 600 },
        { key: 'tvd', label: 'True Vertical Depth (TVD - ft)', val: 9500 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 11.5 },
        { key: 'rise', label: 'Pressure Rise Rate (psi/hr)', val: 200 },
        { key: 'gain', label: 'Pit Gain (bbl)', val: 9.5 }
      ],
      calc: (i) => {
        const fp = i.sidpp + (0.052 * i.tvd * i.mw);
        const denom = fp - i.rise;
        return denom !== 0 ? (i.rise * i.gain) / denom : 0;
      },
      unit: 'bbl/hr'
    },
    {
      id: 'adj_masicp',
      name: 'Adjusted MASICP for New Mud Weight',
      desc: 'Recalculates MASICP after weighting up.',
      inputs: [
        { key: 'masicp', label: 'Current MASICP (psi)', val: 1200 },
        { key: 'omw', label: 'Current Mud Weight (ppg)', val: 10.0 },
        { key: 'nmw', label: 'New Mud Weight (ppg)', val: 11.5 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => i.masicp - 0.052 * (i.nmw - i.omw) * i.tvd,
      unit: 'psi'
    },
    {
      id: 'est_influx_type',
      name: 'Estimate Type of Influx from Influx Height',
      desc: 'Determines kick fluid composition using pressure gradient.',
      inputs: [
        { key: 'sidpp', label: 'SIDPP (psi)', val: 400 },
        { key: 'sicp', label: 'SICP (psi)', val: 650 },
        { key: 'h', label: 'Influx Height (ft)', val: 500 },
        { key: 'grad', label: 'Mud Gradient (psi/ft)', val: 0.52 }
      ],
      calc: (i) => {
        const ig = i.grad - (i.sicp - i.sidpp) / i.h;
        let type = 'Saltwater';
        if (ig < 0.1) type = 'Gas';
        else if (ig <= 0.3) type = 'Oil/Gas Mix';
        return `${ig.toFixed(4)} psi/ft (${type})`;
      },
      unit: 'Influx Gradient'
    },
    {
      id: 'form_pres',
      name: 'Formation Pressure from Kick Analysis',
      desc: 'Computes reservoir pore pressure from shut-in data.',
      inputs: [
        { key: 'sidpp', label: 'SIDPP (psi)', val: 400 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'tvd', label: 'Total TVD (ft)', val: 8000 }
      ],
      calc: (i) => i.sidpp + 0.052 * i.mw * i.tvd,
      unit: 'psi'
    },
    {
      id: 'hydro_loss_gas_cut',
      name: 'Hydrostatic Pressure Loss Due to Gas Cut Mud',
      desc: 'Loss of hydrostatic column pressure due to gas cutting.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'tvd', label: 'Total TVD (ft)', val: 8000 },
        { key: 'gcmw', label: 'Gas Cut Mud Weight (ppg)', val: 8.5 }
      ],
      calc: (i) => 0.052 * (i.mw - i.gcmw) * i.tvd,
      unit: 'psi'
    },
    {
      id: 'influx_height',
      name: 'Influx Height',
      desc: 'Height of kick fluid around BHA.',
      inputs: [
        { key: 'gain', label: 'Pit Gain (bbl)', val: 15 },
        { key: 'cap', label: 'Annular Capacity (bbl/ft)', val: 0.029 }
      ],
      calc: (i) => i.gain / i.cap,
      unit: 'ft'
    },
    {
      id: 'max_fp',
      name: 'Maximum Formation Pressure to Withstand Shut-in',
      desc: 'Maximum pore pressure tolerable before fracture.',
      inputs: [
        { key: 'lop', label: 'Leak Off Pressure (psi)', val: 1600 },
        { key: 'shoeTvd', label: 'Shoe TVD (ft)', val: 5000 },
        { key: 'wellTvd', label: 'Well TVD (ft)', val: 8000 }
      ],
      calc: (i) => i.lop * (i.shoeTvd / i.wellTvd),
      unit: 'psi'
    },
    {
      id: 'misicp',
      name: 'Maximum Initial Shut in Casing Pressure (MISICP)',
      desc: 'Maximum SICP allowable at kickoff to prevent casing shoe fracture.',
      inputs: [
        { key: 'fg', label: 'Fracture Gradient (psi/ft)', val: 0.8 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => (i.fg - 0.052 * i.mw) * i.tvd,
      unit: 'psi'
    },
    {
      id: 'max_pit_gain',
      name: 'Maximum Pit Gain From Gas Kick (WBM)',
      desc: 'Estimated maximum kick volume expansion at surface.',
      inputs: [
        { key: 'v', label: 'Kick Volume (bbl)', val: 10 },
        { key: 'p', label: 'Formation Pressure (psi)', val: 4500 },
        { key: 'ps', label: 'Surface Pressure (psi)', val: 800 }
      ],
      calc: (i) => i.v * (i.p / i.ps),
      unit: 'bbl'
    },
    {
      id: 'max_influx_h',
      name: 'Maximum Possible Influx Height at MASICP Limit',
      desc: 'Calculates maximum height of kick fluid before MASICP is reached.',
      inputs: [
        { key: 'masicp', label: 'MASICP (psi)', val: 1200 },
        { key: 'sicp', label: 'SICP (psi)', val: 700 },
        { key: 'mGrad', label: 'Mud Gradient (psi/ft)', val: 0.52 },
        { key: 'iGrad', label: 'Influx Gradient (psi/ft)', val: 0.1 }
      ],
      calc: (i) => (i.masicp - i.sicp) / ((i.mGrad - i.iGrad) || 1),
      unit: 'ft'
    },
    {
      id: 'max_surf_pres_kt',
      name: 'Maximum Surface Pressure from Kick Tolerance',
      desc: 'Surface pressure corresponding to kick tolerance limit.',
      inputs: [
        { key: 'kt', label: 'Kick Tolerance (ppg)', val: 1.5 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => i.kt * 0.052 * i.tvd,
      unit: 'psi'
    }
  ],
  subsea: [
    {
      id: 'riser_margin',
      name: 'Riser Margin',
      desc: 'Safe mud weight increment for riser removal.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.0 },
        { key: 'wd', label: 'Water Depth (ft)', val: 3000 },
        { key: 'ag', label: 'Air Gap (ft)', val: 80 },
        { key: 'tvd', label: 'Well TVD (ft)', val: 9000 }
      ],
      calc: (i) => ((i.wd + i.ag) * i.mw * 0.052) / (0.052 * (i.tvd - i.wd)),
      unit: 'ppg'
    },
    {
      id: 'subsea_accumulator',
      name: 'Subsea Accumulator Capacity',
      desc: 'Usable subsea fluid volume adjusting for water column head pressure.',
      inputs: [
        { key: 'bottles', label: 'Number of Bottles', val: 10 },
        { key: 'vol', label: 'Bottle Volume (gal)', val: 10 },
        { key: 'p1', label: 'Surface Precharge (psi)', val: 1000 },
        { key: 'p2', label: 'Min Operating Pressure (psi)', val: 1200 },
        { key: 'p3', label: 'Max System Pressure (psi)', val: 3000 },
        { key: 'wd', label: 'Water Depth (ft)', val: 3000 },
        { key: 'sw', label: 'Seawater Density (ppg)', val: 8.54 }
      ],
      calc: (i) => {
        const hyd = 0.052 * i.sw * i.wd;
        const effP = i.p1 + hyd;
        return i.bottles * i.vol * effP * ((1 / i.p2) - (1 / i.p3));
      },
      unit: 'gal'
    },
    {
      id: 'gas_migration',
      name: 'Gas Migration Rate',
      desc: 'Gas migration speed based on casing pressure behavior.',
      inputs: [
        { key: 'rise', label: 'Pressure Rise Rate (psi/hr)', val: 100 },
        { key: 'grad', label: 'Mud Gradient (psi/ft)', val: 0.52 }
      ],
      calc: (i) => i.rise / i.grad,
      unit: 'ft/hr'
    },
    {
      id: 'max_surface_pressure',
      name: 'Maximum Surface Pressure',
      desc: 'Approximated surface pressure during gas kick expansion at surface.',
      inputs: [
        { key: 'gain', label: 'Pit Gain (bbl)', val: 15 },
        { key: 'p', label: 'Formation Pressure (psi)', val: 4500 },
        { key: 'cap', label: 'Annular Capacity (bbl/ft)', val: 0.029 }
      ],
      calc: (i) => Math.sqrt((i.p * i.gain) / (2 * i.cap * 1029.4)),
      unit: 'psi'
    },
    {
      id: 'kmw',
      name: 'Kill Mud Weight',
      desc: 'Density of mud required to balance reservoir/formation pressure.',
      inputs: [
        { key: 'omw', label: 'Original Mud Weight (ppg)', val: 10.2 },
        { key: 'sidpp', label: 'Shut-In Drill Pipe Pressure (SIDPP - psi)', val: 450 },
        { key: 'tvd', label: 'True Vertical Depth (TVD - ft)', val: 8500 }
      ],
      calc: (i) => i.omw + (i.sidpp / (0.052 * i.tvd)),
      unit: 'ppg'
    },
    {
      id: 'kick_tolerance',
      name: 'Kick Tolerance',
      desc: 'Maximum mud weight increase allowable before casing shoe fracture.',
      inputs: [
        { key: 'lop', label: 'Leak Off Pressure (psi)', val: 1500 },
        { key: 'hyd', label: 'Shoe Hydrostatic of Current Mud (psi)', val: 1200 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => (i.lop - i.hyd) / (0.052 * i.tvd),
      unit: 'ppg'
    },
    {
      id: 'safety_margin',
      name: 'Safety Margin',
      desc: 'Safety overbalance margin between mud hydrostatic and formation pressure.',
      inputs: [
        { key: 'mw', label: 'Mud Weight (ppg)', val: 10.2 },
        { key: 'tvd', label: 'True Vertical Depth (TVD - ft)', val: 8500 },
        { key: 'fp', label: 'Formation Pore Pressure (psi)', val: 4000 }
      ],
      calc: (i) => (0.052 * i.mw * i.tvd) - i.fp,
      unit: 'psi'
    },
    {
      id: 'volume_to_bleed',
      name: 'Volume to Bleed to Keep BHP Constant',
      desc: 'Volume of mud to bleed to keep bottomhole pressure constant during closed well gas migration.',
      inputs: [
        { key: 'sidpp', label: 'Shut-In Drill Pipe Pressure (SIDPP - psi)', val: 600 },
        { key: 'tvd', label: 'True Vertical Depth (TVD - ft)', val: 9500 },
        { key: 'mw', label: 'Mud Weight (ppg)', val: 11.5 },
        { key: 'rise', label: 'Pressure Rise Rate (psi/hr)', val: 200 },
        { key: 'gain', label: 'Pit Gain (bbl)', val: 9.5 }
      ],
      calc: (i) => {
        const fp = i.sidpp + (0.052 * i.tvd * i.mw);
        const denom = fp - i.rise;
        return denom !== 0 ? (i.rise * i.gain) / denom : 0;
      },
      unit: 'bbl/hr'
    }
  ]
};

const drillingCalcSections = [
  {
    name: "1. Well Planning & Drill String Design",
    desc: "Tensile capacities, DC weights, ROP, ECD limits",
    icon: "architecture",
    accent: "operations",
    items: ['tensile_cap', 'dc_wt_vert', 'dc_wt_dev', 'overpull_margin', 'max_rop', 'eff_mud_dens', 'ecd_applied', 'dp_elongation', 'neutral_point', 'ds_weight_air', 'ds_weight_mud', 'buckling_load', 'burst_pressure', 'collapse_pressure', 'pipe_body_yield', 'tool_joint_strength', 'hook_load_calc', 'max_allowable_pull', 'wob_calc', 'safety_factor_calc']
  },
  {
    name: "2. Hydraulics & Pump Calculations",
    desc: "Pump outputs, pressure changes, break circulation",
    icon: "water_drop",
    accent: "hydraulics",
    items: ['pump_out_duplex', 'pump_out_triplex', 'pump_pres_stroke_basic', 'pump_pres_stroke_adv', 'pump_pressure_spm_change', 'pump_pressure_mw_change', 'pump_pressure_both_change', 'pump_rate_req', 'break_gel', 'break_circ', 'standpipe_press', 'p_loss_dp', 'p_loss_dc', 'p_loss_bit', 'p_loss_ann', 'bhhp', 'pump_hhp', 'jet_impact_force', 'bit_nozzle_size', 'bit_tfa', 'pump_eff', 'pump_stroke_req', 'flow_regime', 'reynolds_number']
  },
  {
    name: "3. Annular Velocity & Hole Cleaning",
    desc: "Annular capacities, velocities, lag time, cuttings volume",
    icon: "waves",
    accent: "bits",
    items: ['ann_cap', 'ann_vel_dia', 'ann_vel_cap', 'lag_time', 'cuttings_vol_bbl', 'cuttings_vol_gph', 'cuttings_vol_gpm']
  },
  {
    name: "4. Pipe Capacities & Volumes",
    desc: "Internal capacities and pipe displacement",
    icon: "data_usage",
    accent: "casing",
    items: ['int_cap', 'pipe_disp_applied', 'pipe_disp']
  },
  {
    name: "5. Tripping Operations",
    desc: "Ton-miles, pipe pulling volumes, slug calculations",
    icon: "swap_vert",
    accent: "completion",
    items: ['rt_ton_mile', 'casing_ton_mile', 'pipe_pulled_dry', 'pipe_pulled_wet', 'dp_pulled_lose_dry', 'dp_pulled_lose_wet', 'slug_vol', 'slug_weight', 'slug_bbl_req']
  },
  {
    name: "6. Hydrostatic",
    desc: "Leak off tests, hydrostatic pressure losses",
    icon: "compress",
    accent: "wellcontrol",
    items: ['leak_off', 'hydro_dec_dry', 'hydro_dec_wet', 'hydro_grad_gas_cut', 'hydro_mw_gas_cut', 'hydro_loss_float_fail']
  },
  {
    name: "7. Stuck Pipe & Fishing",
    desc: "Free point constant, stuck pipe limits, spot pills",
    icon: "anchor",
    accent: "fishing",
    items: ['fpc_stuck', 'stuck_pipe_calc', 'stuck_pipe_not_know_fpc', 'spot_pill', 'diff_stick_force', 'mech_stick_risk', 'jar_impact_force', 'back_off_torque', 'fish_string_load', 'max_overpull', 'washover_length', 'milling_time', 'spotting_time', 'pipe_recovery_est']
  },
  {
    name: "8. Mud Properties & Conversions",
    desc: "Buoyancy factors, pressure gradients, specific gravity",
    icon: "science",
    accent: "mud",
    items: ['bf_ppg', 'bf_lbs', 'grad_to_mw', 'sg_to_mw_ppg', 'sg_to_mw_lbs', 'mw_to_sg', 'sg_to_grad']
  },
  {
    name: "9. BOP & Surface Equipment",
    desc: "Surface and subsea accumulator capacity sizing",
    icon: "settings_input_component",
    accent: "surface",
    items: ['acc_surf', 'acc_subsea', 'acc_bottle_req', 'acc_precharge', 'acc_recharge_time', 'bop_close_time', 'bop_open_time', 'ram_close_vol', 'annular_close_vol', 'control_fluid_req', 'choke_line_cap', 'kill_line_cap', 'surface_line_vol', 'bop_function_vol', 'bop_press_test_vol', 'press_rating_verif']
  }
];

const wellControlCalcSections = [
  {
    name: "1. Surface",
    desc: "Calculations for surface stack operations",
    icon: "tune",
    accent: "surface",
    category: "surface",
    items: [
      'icp',
      'fcp',
      'kmw',
      'kick_tolerance',
      'maasp',
      'trip_margin',
      'safety_margin',
      'volume_to_bleed',
      'adj_masicp',
      'est_influx_type',
      'form_pres',
      'hydro_loss_gas_cut',
      'influx_height',
      'max_fp',
      'misicp',
      'max_pit_gain',
      'max_influx_h',
      'max_surf_pres_kt'
    ]
  },
  {
    name: "2. Subsea",
    desc: "Calculations for subsea stack operations",
    icon: "anchor",
    accent: "subsea",
    category: "subsea",
    items: [
      'riser_margin',
      'subsea_accumulator',
      'gas_migration',
      'max_surface_pressure',
      'kmw',
      'kick_tolerance',
      'safety_margin',
      'volume_to_bleed'
    ]
  }
];

const calcSectionsConfig = {
  drilling: {
    id: 'drilling',
    title: 'Drilling Calculations',
    groups: drillingCalcSections,
    getFormula: (id) => (formulaDb.calculations || []).find(f => f.id === id)
  },
  wellcontrol: {
    id: 'wellcontrol',
    title: 'Well Control Calculations',
    groups: wellControlCalcSections,
    getFormula: (id, category) => {
      if (category && wellControlDb[category]) {
        const found = wellControlDb[category].find(f => f.id === id);
        if (found) return found;
      }
      return (wellControlDb.surface || []).find(f => f.id === id) ||
             (wellControlDb.subsea || []).find(f => f.id === id);
    }
  }
};

function findCalculator(formulaId, optCategory) {
  if (optCategory === 'surface' || optCategory === 'subsea') {
    const item = (wellControlDb[optCategory] || []).find(f => f.id === formulaId);
    if (item) {
      const group = wellControlCalcSections.find(g => g.category === optCategory);
      return {
        formula: item,
        sectionKey: 'wellcontrol',
        category: optCategory,
        groupName: group ? group.name : optCategory,
        groupIcon: group ? group.icon : 'tune',
        groupAccent: group ? group.accent : 'surface'
      };
    }
  }
  if (optCategory === 'calculations') {
    const item = (formulaDb.calculations || []).find(f => f.id === formulaId);
    if (item) {
      const group = drillingCalcSections.find(g => g.items.includes(formulaId));
      return {
        formula: item,
        sectionKey: 'drilling',
        category: 'calculations',
        groupName: group ? group.name : 'Drilling Calculations',
        groupIcon: group ? group.icon : 'functions',
        groupAccent: group ? group.accent : 'operations'
      };
    }
  }

  if (calcSubState && calcSubState.section === 'wellcontrol') {
    const surfItem = (wellControlDb.surface || []).find(f => f.id === formulaId);
    if (surfItem) {
      const group = wellControlCalcSections[0];
      return {
        formula: surfItem,
        sectionKey: 'wellcontrol',
        category: 'surface',
        groupName: group.name,
        groupIcon: group.icon,
        groupAccent: group.accent
      };
    }
    const subseaItem = (wellControlDb.subsea || []).find(f => f.id === formulaId);
    if (subseaItem) {
      const group = wellControlCalcSections[1];
      return {
        formula: subseaItem,
        sectionKey: 'wellcontrol',
        category: 'subsea',
        groupName: group.name,
        groupIcon: group.icon,
        groupAccent: group.accent
      };
    }
  }

  const drillItem = (formulaDb.calculations || []).find(f => f.id === formulaId);
  if (drillItem) {
    const group = drillingCalcSections.find(g => g.items.includes(formulaId));
    return {
      formula: drillItem,
      sectionKey: 'drilling',
      category: 'calculations',
      groupName: group ? group.name : 'Drilling Calculations',
      groupIcon: group ? group.icon : 'functions',
      groupAccent: group ? group.accent : 'operations'
    };
  }

  const surfItem = (wellControlDb.surface || []).find(f => f.id === formulaId);
  if (surfItem) {
    const group = wellControlCalcSections[0];
    return {
      formula: surfItem,
      sectionKey: 'wellcontrol',
      category: 'surface',
      groupName: group.name,
      groupIcon: group.icon,
      groupAccent: group.accent
    };
  }

  const subseaItem = (wellControlDb.subsea || []).find(f => f.id === formulaId);
  if (subseaItem) {
    const group = wellControlCalcSections[1];
    return {
      formula: subseaItem,
      sectionKey: 'wellcontrol',
      category: 'subsea',
      groupName: group.name,
      groupIcon: group.icon,
      groupAccent: group.accent
    };
  }

  return null;
}

function openFormulaDirectly(formulaId, optCategory) {
  const found = findCalculator(formulaId, optCategory);
  if (found) {
    calcSubState.view = 'formula';
    calcSubState.section = found.sectionKey;
    calcSubState.category = found.category;
    calcSubState.formulaId = formulaId;
    renderDrillingCalcScreen();
  }
}
window.openFormulaDirectly = openFormulaDirectly;

function toggleFormulaFavorite(id, e) {
  if (e && e.stopPropagation) e.stopPropagation();
  let favs = JSON.parse(localStorage.getItem('calcFavorites') || '[]');
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('calcFavorites', JSON.stringify(favs));
  renderDrillingCalcScreen();
}

/**
 * Calculation Hub Dynamic Unit Adapter Helpers
 */
function detectCalcQuantity(labelOrUnit) {
  const s = String(labelOrUnit || '').toLowerCase().trim();
  if (s.includes('1/32 in') || s.includes('/ 32 inch')) return { type: 'nozzle', native: '1/32 in', si: 'mm' };
  if (s.includes('psi/ft') || s.includes('influx gradient')) return { type: 'gradient', native: 'psi/ft', si: 'bar/m' };
  if (s.includes('psi/hr')) return { type: 'pressure_rate', native: 'psi/hr', si: 'bar/hr' };
  if (s.includes('lb/100ft') || s.includes('lbf/100ft')) return { type: 'yield_point', native: 'lbf/100ft2', si: 'Pa' };
  if (s.includes('lb/ft3') || s.includes('lb/ft³')) return { type: 'density', native: 'lbft3', si: 'kgm3' };
  if (s.includes('lb/ft') || s.includes('lbs/ft') || s.includes('ppf')) return { type: 'weight_per_length', native: 'lb/ft', si: 'kg/m' };
  if (s.includes('bbl/ft')) return { type: 'capacity', native: 'bbl/ft', si: 'L/m' };
  if (s.includes('bbl/stk') || s.includes('bbl/stroke')) return { type: 'pump_output', native: 'bbl/stk', si: 'L/stk' };
  if (s.includes('bbl/min') || s.includes('bpm')) return { type: 'flow_rate', native: 'bbl/min', si: 'L/min' };
  if (s.includes('bbl/hr')) return { type: 'flow_rate', native: 'bbl/hr', si: 'm3/hr' };
  if (s.includes('gal/min') || s.includes('gpm')) return { type: 'flow_rate', native: 'gpm', si: 'L/min' };
  if (s.includes('gal/hr')) return { type: 'flow_rate', native: 'gal/hr', si: 'L/min' };
  if (s.includes('ft/min')) return { type: 'velocity', native: 'ft/min', si: 'm/min' };
  if (s.includes('ft/sec') || s.includes('ft/s')) return { type: 'velocity', native: 'ft/s', si: 'm/s' };
  if (s.includes('ft/hr')) return { type: 'velocity', native: 'ft/hr', si: 'm/hr' };
  if (s.includes('ft-lb') || s.includes('ft-lbs')) return { type: 'torque', native: 'ft-lbs', si: 'N·m' };
  if (s.includes('sq in') || s.includes('in2') || s.includes('in²')) return { type: 'area', native: 'in2', si: 'mm2' };
  if (s.includes('hhp') || s.includes('hp')) return { type: 'power', native: 'hp', si: 'kW' };
  if (s.includes('°f') || s.includes('deg f')) return { type: 'temperature', native: '°F', si: '°C' };
  if (s.includes('ppg')) return { type: 'density', native: 'ppg', si: 'SG' };
  if (s.includes('psi')) return { type: 'pressure', native: 'psi', si: 'bar' };
  if (s.includes('tvd - ft') || s.includes('md - ft') || /\bft\b/.test(s) || s.includes('(ft)') || s.includes('feet')) return { type: 'length', native: 'ft', si: 'm' };
  if (/\bin\b/.test(s) || s.includes('(in)') || s.includes('inches')) return { type: 'diameter', native: 'in', si: 'mm' };
  if (s.includes('bbl')) return { type: 'volume', native: 'bbl', si: 'm3' };
  if (s.includes('gal')) return { type: 'volume', native: 'gal', si: 'L' };
  if (s.includes('klbs')) return { type: 'force', native: 'klbs', si: 'kN' };
  if (/\blb\b/.test(s) || /\blbs\b/.test(s) || /\blbf\b/.test(s)) return { type: 'force', native: 'lbs', si: 'kN' };
  return null;
}

function adaptLabelToSI(label) {
  let s = String(label || '');
  s = s.replace(/ppg\s+EMW/gi, 'SG EMW');
  s = s.replace(/KMW\s*-\s*ppg/gi, 'KMW - SG');
  s = s.replace(/\bppg\b/gi, 'SG');
  s = s.replace(/SIDPP\s*-\s*psi/gi, 'SIDPP - bar');
  s = s.replace(/SICP\s*-\s*psi/gi, 'SICP - bar');
  s = s.replace(/SCR\s*-\s*psi/gi, 'SCR - bar');
  s = s.replace(/psi\/ft/gi, 'bar/m');
  s = s.replace(/psi\/hr/gi, 'bar/hr');
  s = s.replace(/\bpsi\b/gi, 'bar');
  s = s.replace(/TVD\s*-\s*ft/gi, 'TVD - m');
  s = s.replace(/MD\s*-\s*ft/gi, 'MD - m');
  s = s.replace(/\bfeet\b/gi, 'm');
  s = s.replace(/\(ft\)/gi, '(m)');
  s = s.replace(/1\/32\s*in/gi, 'mm');
  s = s.replace(/\binches\b/gi, 'mm');
  s = s.replace(/\(in\)/gi, '(mm)');
  s = s.replace(/bbl\/ft/gi, 'L/m');
  s = s.replace(/bbl\/stk/gi, 'L/stk');
  s = s.replace(/bbl\/stroke/gi, 'L/stk');
  s = s.replace(/bbl\/min/gi, 'L/min');
  s = s.replace(/bbl\/hr/gi, 'm³/hr');
  s = s.replace(/gal\/min/gi, 'L/min');
  s = s.replace(/gal\/hr/gi, 'L/min');
  s = s.replace(/\bgpm\b/gi, 'L/min');
  s = s.replace(/\(bbl\)/gi, '(m³)');
  s = s.replace(/\(gal\)/gi, '(L)');
  s = s.replace(/\bklbs\b/gi, 'kN');
  s = s.replace(/lb\/100ft[²2]/gi, 'Pa');
  s = s.replace(/lbf\/100ft[²2]/gi, 'Pa');
  s = s.replace(/lb\/ft[³3]/gi, 'kg/m³');
  s = s.replace(/lb\/ft/gi, 'kg/m');
  s = s.replace(/lbs\/ft/gi, 'kg/m');
  s = s.replace(/\(lbs\)/gi, '(kN)');
  s = s.replace(/\(lb\)/gi, '(kN)');
  s = s.replace(/ft-lbs?/gi, 'N·m');
  s = s.replace(/°F/gi, '°C');
  s = s.replace(/ft\/min/gi, 'm/min');
  s = s.replace(/ft\/sec/gi, 'm/s');
  s = s.replace(/ft\/s\b/gi, 'm/s');
  s = s.replace(/ft\/hr/gi, 'm/hr');
  s = s.replace(/sq\s*in/gi, 'mm²');
  s = s.replace(/\(hp\)/gi, '(kW)');
  s = s.replace(/\(HHP\)/gi, '(kW)');
  return s;
}

function adaptUnitToSI(unit) {
  const u = String(unit || '').trim();
  if (u === 'ppg') return 'SG';
  if (u === 'psi') return 'bar';
  if (u === 'psi (Margin)') return 'bar (Margin)';
  if (u === 'psi/ft') return 'bar/m';
  if (u === 'Influx Gradient') return 'bar/m';
  if (u === 'ft') return 'm';
  if (u === 'ft (Free Pipe Length)') return 'm (Free Pipe Length)';
  if (u === 'inches') return 'mm';
  if (u === '/ 32 inch') return 'mm';
  if (u === 'bbl') return 'm³';
  if (u === 'bbl/ft') return 'L/m';
  if (u === 'bbl/stroke') return 'L/stk';
  if (u === 'bbl/min') return 'L/min';
  if (u === 'bbl/hr') return 'm³/hr';
  if (u === 'gal/min') return 'L/min';
  if (u === 'gal/hr') return 'L/min';
  if (u === 'gal') return 'L';
  if (u === 'lb' || u === 'lbf') return 'kN';
  if (u === 'lb/ft³') return 'kg/m³';
  if (u === 'ft-lb') return 'N·m';
  if (u === 'ft/hr') return 'm/hr';
  if (u === 'ft/min') return 'm/min';
  if (u === 'sq in') return 'mm²';
  if (u === 'HHP') return 'kW';
  return u;
}

function formatConverted(val) {
  if (!Number.isFinite(val)) return '0';
  if (Math.abs(val) >= 1000) return String(parseFloat(val.toFixed(1)));
  if (Math.abs(val) >= 100) return String(parseFloat(val.toFixed(2)));
  if (Math.abs(val) >= 1) return String(parseFloat(val.toFixed(2)));
  return String(parseFloat(val.toFixed(4)));
}

function adaptActiveCalculatorView(newSys, prevSys) {
  if (!calcSubState || calcSubState.view !== 'formula' || !calcSubState.formulaId) return;
  const found = findCalculator(calcSubState.formulaId, calcSubState.category);
  if (!found || !found.formula) return;
  const f = found.formula;

  f.inputs.forEach(inp => {
    const el = document.getElementById(`inp-${inp.key}`);
    const lbl = document.getElementById(`lbl-inp-${inp.key}`);
    const q = detectCalcQuantity(inp.label);

    if (lbl) {
      lbl.textContent = (newSys === 'si') ? adaptLabelToSI(inp.label) : inp.label;
    }

    if (el && q && window.UnitsEngine) {
      const curVal = parseFloat(String(el.value).replace(',', '.'));
      if (!isNaN(curVal)) {
        let converted = curVal;
        if (prevSys !== 'si' && newSys === 'si') {
          converted = window.UnitsEngine.convert(q.type, curVal, q.native, q.si);
        } else if (prevSys === 'si' && newSys !== 'si') {
          converted = window.UnitsEngine.convert(q.type, curVal, q.si, q.native);
        }
        el.value = formatConverted(converted);
      }
    }
  });

  const outUnitEl = document.getElementById('calc-output-unit');
  if (outUnitEl) {
    outUnitEl.textContent = (newSys === 'si') ? adaptUnitToSI(f.unit) : f.unit;
  }

  // Trigger recalculation with new units
  const runCalcFn = window._currentRunCalc;
  if (typeof runCalcFn === 'function') {
    runCalcFn();
  }
}

function renderDrillingCalcScreen() {
  const container = document.getElementById('drilling-calc-container');

  const backBtn = document.querySelector('#screen-drilling-calc .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      handleAppBack();
    };
  }

  if (calcSubState.view === 'categories') {
    // Categories Portal View
    container.innerHTML = `
      <div class="menu-grid" style="grid-template-columns:1fr; gap:12px;">
        <div class="toolkit-card compact-card" id="cat-calc-btn">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-tubular)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">Drilling Calculations</span>
              <span class="card-desc">Basic & Applied Engineering Formulas</span>
            </div>
          </div>
          <span class="card-chevron">&gt;</span>
        </div>

        <div class="toolkit-card compact-card" id="cat-wellcontrol-ops-btn">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-wellcontrol)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A2C2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <circle cx="12" cy="11" r="3"></circle>
                <line x1="12" y1="8" x2="12" y2="14"></line>
                <line x1="9" y1="11" x2="15" y2="11"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">Well Control Calculations</span>
              <span class="card-desc">Surface & subsea stack well control calculators</span>
            </div>
          </div>
          <span class="card-chevron">&gt;</span>
        </div>
      </div>
    `;

    setupSearchInput();
    document.getElementById('cat-calc-btn').onclick = () => {
      calcSubState.section = 'drilling';
      calcSubState.view = 'list';
      calcSubState.category = 'calculations';
      calcSubState.formulaId = null;
      renderDrillingCalcScreen();
    };
    document.getElementById('cat-wellcontrol-ops-btn').onclick = () => {
      calcSubState.section = 'wellcontrol';
      calcSubState.view = 'list';
      calcSubState.category = 'surface';
      calcSubState.formulaId = null;
      renderDrillingCalcScreen();
    };

  } else if (calcSubState.view === 'list') {
    const currSection = calcSectionsConfig[calcSubState.section] || calcSectionsConfig.drilling;
    const catName = currSection.title;
    const favs = JSON.parse(localStorage.getItem('calcFavorites') || '[]');

    let quickAccessItems = [];
    if (favs.length > 0) {
      favs.forEach(itemId => {
        const found = findCalculator(itemId);
        if (found) {
          quickAccessItems.push({
            itemId,
            name: found.formula.name,
            catName: found.groupName,
            icon: found.groupIcon,
            category: found.category
          });
        }
      });
    }

    let html = `
      <div class="content-card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="list-back-btn">← Categories</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0;">${catName}</h3>
        </div>
    `;

    if (quickAccessItems.length > 0) {
      html += `
        <div class="guide-quick-access">
          <div class="guide-section-title">
            ${renderIcon('star', { size: '1.15rem', style: 'color:#EAB308;' })}
            <span style="font-weight: 900; color: var(--text-primary); letter-spacing: 0.1em;">QUICK ACCESS</span>
          </div>
          <div class="guide-quick-grid">
      `;
      quickAccessItems.forEach(qa => {
        html += `
          <div class="guide-quick-btn" onclick="openFormulaDirectly('${qa.itemId}', '${qa.category || ''}')">
            ${renderIcon(qa.icon, { size: '1.1rem', className: 'guide-quick-icon' })}
            <div class="guide-quick-info">
              <span class="guide-quick-name">${qa.name}</span>
              <span class="guide-quick-cat">${qa.catName}</span>
            </div>
            <button class="guide-fav-btn active" style="border: none; background: transparent; padding: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;" onclick="toggleFormulaFavorite('${qa.itemId}', event)" aria-label="Favorite">
              ${renderIcon('star', { size: '1.15rem', style: 'color: #EAB308;' })}
            </button>
          </div>
        `;
      });
      html += `
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="guide-quick-access">
          <div class="guide-section-title" style="margin-bottom: 6px;">
            ${renderIcon('star', { size: '1.05rem', style: 'color:#EAB308;' })}
            <span style="font-weight: 900; color: var(--text-primary); letter-spacing: 0.1em;">QUICK ACCESS</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 0.75rem; line-height: 1; margin-bottom: 20px;">
            ${renderIcon('star_border', { size: '0.95rem', style: 'color: #EAB308;' })}
            <span>Tap the star on any calculator to add it here.</span>
          </div>
        </div>
      `;
    }

    html += `<div style="display:flex; flex-direction:column; gap:12px; padding-bottom:30px;" id="formula-list-container">`;
    currSection.groups.forEach((sec, idx) => {
      html += `
        <div class="guide-category-card guide-cat-accent-${sec.accent}" id="calc-cat-${idx}">
          <div class="guide-category-header" onclick="toggleGuideCategory('calc-cat-${idx}')">
            <div class="guide-category-title-section">
              <div class="guide-category-icon-wrapper">
                ${renderIcon(sec.icon, { size: '1.25rem', className: 'guide-category-icon' })}
              </div>
              <div class="guide-category-info">
                <span class="guide-category-name">${sec.name}</span>
                <span class="guide-category-desc">${sec.desc}</span>
              </div>
            </div>
            ${renderIcon('chevron_right', { size: '1.2rem', className: 'guide-category-chevron' })}
          </div>
          <div class="guide-subcategory-list">
      `;
      sec.items.forEach(itemId => {
        const item = currSection.getFormula(itemId, sec.category);
        if (!item) return; 
        const isFav = favs.includes(item.id);
        html += `
          <div class="guide-item-row" onclick="openFormulaDirectly('${item.id}', '${sec.category || ''}')">
            <div class="guide-item-row-left">
              <button class="guide-fav-btn ${isFav ? 'active' : ''}" onclick="toggleFormulaFavorite('${item.id}', event)" aria-label="Favorite">
                ${renderIcon(isFav ? 'star' : 'star_border', { size: '1.15rem', style: isFav ? 'color:#EAB308;' : '' })}
              </button>
              <span class="guide-item-title">${item.name}</span>
            </div>
            <div class="guide-item-right">
              <span class="guide-item-arrow">&rsaquo;</span>
            </div>
          </div>
        `;
      });
      html += `
          </div>
        </div>
      `;
    });
    html += `</div></div>`;
    container.innerHTML = html;

    if (calcSubState.formulaId) {
      currSection.groups.forEach((sec, idx) => {
        if (sec.items.includes(calcSubState.formulaId)) {
          window.toggleGuideCategory('calc-cat-' + idx);
        }
      });
    }

    document.getElementById('list-back-btn').onclick = () => {
      calcSubState.view = 'categories';
      calcSubState.formulaId = null;
      renderDrillingCalcScreen();
    };

  } else if (calcSubState.view === 'formula') {
    // Detailed Calculator View
    const found = findCalculator(calcSubState.formulaId, calcSubState.category);
    if (!found) {
      calcSubState.view = 'categories';
      renderDrillingCalcScreen();
      return;
    }
    const f = found.formula;
    const favs = JSON.parse(localStorage.getItem('calcFavorites') || '[]');
    const isFav = favs.includes(f.id);
    const activeSys = (window.UnitsEngine ? window.UnitsEngine.getUnitSystem() : 'mixed');
    const displayOutputUnit = (activeSys === 'si') ? adaptUnitToSI(f.unit) : f.unit;

    container.innerHTML = `
      <div class="content-card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="form-back-btn">Back to List</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0; flex:1;">Calculator</h3>
          <button class="guide-fav-btn ${isFav ? 'active' : ''}" style="border: none; background: transparent; padding: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;" onclick="toggleFormulaFavorite('${f.id}', event)" aria-label="Favorite">
            ${renderIcon(isFav ? 'star' : 'star_border', { size: '1.5rem', style: `color: ${isFav ? '#EAB308' : 'var(--text-secondary)'};` })}
          </button>
        </div>
        
        <h4 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${f.name}</h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:20px;">${f.desc}</p>
        
        <div id="dynamic-inputs-container"></div>
        
        <div class="result-card" style="margin-top:20px; border-left:4px solid var(--accent-color);">
          <span class="result-label">Calculated Output</span>
          <span class="result-value" id="calc-output-val">- <span class="unit-lbl" id="calc-output-unit">${displayOutputUnit}</span></span>
        </div>
      </div>
    `;

    document.getElementById('form-back-btn').onclick = () => {
      handleAppBack();
    };

    const inputsCont = document.getElementById('dynamic-inputs-container');
    f.inputs.forEach(inp => {
      if (inp.defaultVal === undefined) {
        inp.defaultVal = inp.val;
      }
      const q = detectCalcQuantity(inp.label);
      let initialVal = inp.defaultVal;
      if (activeSys === 'si' && q && window.UnitsEngine) {
        const num = parseFloat(String(inp.defaultVal).replace(',', '.'));
        if (!isNaN(num)) {
          const converted = window.UnitsEngine.convert(q.type, num, q.native, q.si);
          initialVal = formatConverted(converted);
        }
      }
      const displayLabel = (activeSys === 'si') ? adaptLabelToSI(inp.label) : inp.label;

      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label id="lbl-inp-${inp.key}">${displayLabel}</label>
        <input type="text" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" class="form-input table-input" id="inp-${inp.key}" value="${initialVal}" style="text-align:left; width:100%; border-radius:var(--border-radius-pill); padding:14px 20px;">
      `;
      inputsCont.appendChild(group);
    });

    const runCalc = () => {
      const currentSys = (window.UnitsEngine ? window.UnitsEngine.getUnitSystem() : 'mixed');
      const arg = {};
      f.inputs.forEach(inp => {
        const el = document.getElementById(`inp-${inp.key}`);
        const q = detectCalcQuantity(inp.label);
        let rawVal = el ? parseFloat(String(el.value).replace(',', '.')) : 0;
        if (isNaN(rawVal)) rawVal = 0;

        if (currentSys === 'si' && q && window.UnitsEngine) {
          arg[inp.key] = window.UnitsEngine.convert(q.type, rawVal, q.si, q.native);
        } else {
          arg[inp.key] = rawVal;
        }
      });

      try {
        const result = f.calc(arg);
        const outQ = detectCalcQuantity(f.unit);
        let finalVal = result;
        const outUnit = (currentSys === 'si') ? adaptUnitToSI(f.unit) : f.unit;
        if (typeof result === 'number' && Number.isFinite(result)) {
          if (currentSys === 'si' && outQ && window.UnitsEngine) {
            finalVal = window.UnitsEngine.convert(outQ.type, result, outQ.native, outQ.si);
          }
          const outVal = finalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
          document.getElementById('calc-output-val').innerHTML = `${outVal} <span class="unit-lbl" id="calc-output-unit">${outUnit}</span>`;
        } else {
          document.getElementById('calc-output-val').innerHTML = `${result} <span class="unit-lbl" id="calc-output-unit">${outUnit}</span>`;
        }
      } catch (err) {
        const outUnit = (currentSys === 'si') ? adaptUnitToSI(f.unit) : f.unit;
        document.getElementById('calc-output-val').innerHTML = `Error <span class="unit-lbl" id="calc-output-unit">${outUnit}</span>`;
      }
    };

    window._currentRunCalc = runCalc;

    f.inputs.forEach(inp => {
      const el = document.getElementById(`inp-${inp.key}`);
      if (el) el.addEventListener('input', runCalc);
    });

    runCalc();
  }
}

function updateCalcSearchResultsOnly() {
  const query = calcSubState.search.trim();
  const resultsContainer = document.getElementById('formula-list-container');
  const countLabel = document.getElementById('results-count-label');

  if (query === '') {
    calcSubState.search = '';
    renderDrillingCalcScreen();
    return;
  }

  const matches = [];
  (formulaDb.calculations || []).forEach(f => {
    const combinedText = [f.name, f.desc, f.keywords, 'calculations', 'drilling'].filter(Boolean).join(' ');
    if (fuzzyMatch(combinedText, query)) {
      matches.push({ ...f, sectionKey: 'drilling', cat: 'calculations' });
    }
  });
  if (typeof wellControlDb !== 'undefined') {
    (wellControlDb.surface || []).forEach(f => {
      const combinedText = [f.name, f.desc, f.keywords, 'surface', 'wellcontrol'].filter(Boolean).join(' ');
      if (fuzzyMatch(combinedText, query)) {
        matches.push({ ...f, sectionKey: 'wellcontrol', cat: 'surface' });
      }
    });
    (wellControlDb.subsea || []).forEach(f => {
      const combinedText = [f.name, f.desc, f.keywords, 'subsea', 'wellcontrol'].filter(Boolean).join(' ');
      if (fuzzyMatch(combinedText, query)) {
        matches.push({ ...f, sectionKey: 'wellcontrol', cat: 'subsea' });
      }
    });
  }

  if (countLabel) {
    countLabel.textContent = `Search Results (${matches.length})`;
  }

  if (resultsContainer) {
    resultsContainer.innerHTML = '';
    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.85rem;">No matching formulas found.</div>`;
    } else {
      matches.forEach(m => {
        const item = document.createElement('div');
        item.className = 'toolkit-card compact-card';
        item.innerHTML = `
          <div class="card-left">
            <div class="card-info">
              <span class="card-title">${m.name}</span>
              <span class="card-desc">${m.desc}</span>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        `;
        item.onclick = () => {
          calcSubState.view = 'formula';
          calcSubState.section = m.sectionKey;
          calcSubState.category = m.cat;
          calcSubState.formulaId = m.id;
          calcSubState.search = '';
          renderDrillingCalcScreen();
        };
        resultsContainer.appendChild(item);
      });
    }
  }
}

function setupSearchInput() {
  const inp = document.getElementById('calc-search-inp');
  if (!inp) return;

  inp.oninput = (e) => {
    calcSubState.search = e.target.value;

    // If the search results shell is already on screen, update results in-place to maintain input focus!
    const isSearchShell = document.getElementById('formula-list-container') &&
      document.getElementById('calc-search-inp') &&
      document.getElementById('results-count-label');

    if (isSearchShell) {
      updateCalcSearchResultsOnly();
    } else {
      renderDrillingCalcScreen();
    }
  };
}

// ==========================================
// BONUS FEATURE 5: Well Control
// ==========================================
wellControlSubState = {
  view: 'menu',      // 'menu', 'formula', or 'equations'
  category: null,    // 'surface' or 'subsea'
  formulaId: null    // the specific formula ID
};


window.openWcFormula = (category, formulaId) => {
  calcSubState.section = 'wellcontrol';
  calcSubState.category = category;
  calcSubState.formulaId = formulaId;
  calcSubState.view = 'formula';
  navigateTo('drilling-calc');
};

window.openWcEquations = (category) => {
  wellControlSubState.view = 'equations';
  wellControlSubState.category = category;
  renderWellControlScreen();
};

window.openClfGuide = () => {
  wellControlSubState.view = 'clf-guide';
  renderWellControlScreen();
};

function renderWellControlScreen() {
  const container = document.getElementById('well-control-container');
  const titleEl = document.querySelector('#screen-well-control .screen-title');
  const subtitleEl = document.querySelector('#screen-well-control .screen-subtitle');

  if (wellControlSubState.view === 'clf-guide') {
    if (titleEl) titleEl.textContent = "Choke Line Friction (CLF)";
    if (subtitleEl) subtitleEl.textContent = "Understanding Choke Line Friction measurements for subsea wells";
  } else if (wellControlSubState.view === 'formula') {
    const category = wellControlSubState.category;
    const formulaId = wellControlSubState.formulaId;
    const list = wellControlDb[category] || [];
    const f = list.find(x => x.id === formulaId);
    if (f) {
      if (titleEl) titleEl.textContent = f.name;
      const catLabel = category === 'surface' ? 'Surface Stack' : 'Subsea Stack';
      if (subtitleEl) subtitleEl.textContent = `${catLabel} operations calculation`;
    } else {
      if (titleEl) titleEl.textContent = "Well Control Calculations";
      if (subtitleEl) subtitleEl.textContent = "Surface and subsea stack well control calculators & formulas";
    }
  } else if (wellControlSubState.view === 'equations') {
    if (titleEl) titleEl.textContent = "Well Control Equations";
    const catLabel = wellControlSubState.category === 'surface' ? 'Surface Stack' : 'Subsea Stack';
    if (subtitleEl) subtitleEl.textContent = `${catLabel} operations equations`;
  } else {
    if (titleEl) titleEl.textContent = "Well Control Calculations";
    if (subtitleEl) subtitleEl.textContent = "Surface and subsea stack well control calculators & formulas";
  }

  const backBtn = document.querySelector('#screen-well-control .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      handleAppBack();
    };
  }

  if (wellControlSubState.view === 'menu') {
    calcSubState.section = 'wellcontrol';
    calcSubState.category = 'surface';
    calcSubState.formulaId = null;
    calcSubState.view = 'list';
    navigateTo('drilling-calc');
    return;
  }
  if (wellControlSubState.view === 'formula') {
    calcSubState.section = 'wellcontrol';
    calcSubState.category = wellControlSubState.category || 'surface';
    calcSubState.formulaId = wellControlSubState.formulaId;
    calcSubState.view = 'formula';
    navigateTo('drilling-calc');
    return;
  }
if (wellControlSubState.view === 'clf-guide') {
    const backBtnText = wellControlSubState.fromScreen ? "Back to Hole Selection" : "Back to Menu";
    container.innerHTML = `
      <div class="content-card" style="padding: 16px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="wc-clf-back-btn">${backBtnText}</button>
        </div>
        
        <h2 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin-bottom:12px; border-bottom: 2px solid var(--border-subtle); padding-bottom: 6px;">What is CLF?</h2>
        <p style="font-size:0.8rem; line-height:1.45; color:var(--text-primary); margin-bottom:15px; background-color:var(--bg-subtle); padding:10px; border-radius:8px; border-left:3px solid var(--accent-color);">
          <strong>CLF (Choke Line Friction)</strong> is the pressure loss caused by fluid flowing through the choke line at a given circulation rate.<br><br>
          It is measured before well control operations so it can be compensated for during kill operations.
        </p>

        <div style="display:flex; flex-direction:column; gap:15px; margin-top:20px;">
          <!-- Method 1 -->
          <div style="border: 1px solid var(--border-subtle); border-radius:12px; padding:12px 14px; background-color:var(--card-bg);">
            <h4 style="font-size:0.9rem; font-weight:700; color:var(--accent-color); margin-top:0; margin-bottom:8px;">Method 1 (Most common)</h4>
            <div style="font-size:0.8rem; line-height:1.4; color:var(--text-secondary); display:flex; flex-direction:column; gap:6px;">
              <div><strong>Step 1:</strong> Open BOP. Circulate through the marine riser. Record pump pressure.</div>
              <div style="background-color:var(--bg-subtle); padding:6px 10px; border-radius:6px; font-family:monospace; color:var(--text-primary); margin-bottom:6px;">Example: Pump pressure = 500 psi</div>
              
              <div><strong>Step 2:</strong> Keep the same pump rate. Divert returns through the fully open choke line. Record pump pressure.</div>
              <div style="background-color:var(--bg-subtle); padding:6px 10px; border-radius:6px; font-family:monospace; color:var(--text-primary); margin-bottom:6px;">Example: Pump pressure = 700 psi</div>
              
              <div style="border-top:1px solid var(--border-subtle); padding-top:6px; margin-top:4px;">
                <strong>Formula:</strong><br>
                CLF = Pump pressure through choke − Pump pressure through riser<br>
                = 700 − 500 = 200 psi
              </div>
              <div style="font-weight:700; color:#10B981; font-size:0.85rem; margin-top:4px;">✅ Answer: CLF = 200 psi</div>
            </div>
          </div>

          <!-- Method 2 -->
          <div style="border: 1px solid var(--border-subtle); border-radius:12px; padding:12px 14px; background-color:var(--card-bg);">
            <h4 style="font-size:0.9rem; font-weight:700; color:var(--accent-color); margin-top:0; margin-bottom:8px;">Method 2</h4>
            <div style="font-size:0.8rem; line-height:1.4; color:var(--text-secondary); display:flex; flex-direction:column; gap:6px;">
              <div>Close the BOP. Pump through the drill string. Return through a fully open choke. The kill line is static.</div>
              <div>The pressure shown on the Kill Line Gauge equals the choke line friction.</div>
              <div style="background-color:var(--bg-subtle); padding:6px 10px; border-radius:6px; font-family:monospace; color:var(--text-primary); margin-top:4px;">Example: Kill line pressure = 200 psi</div>
              <div style="font-weight:700; color:#10B981; font-size:0.85rem; margin-top:4px;">Therefore, CLF = 200 psi</div>
            </div>
          </div>

          <!-- Method 3 -->
          <div style="border: 1px solid var(--border-subtle); border-radius:12px; padding:12px 14px; background-color:var(--card-bg);">
            <h4 style="font-size:0.9rem; font-weight:700; color:var(--accent-color); margin-top:0; margin-bottom:8px;">Method 3</h4>
            <div style="font-size:0.8rem; line-height:1.4; color:var(--text-secondary); display:flex; flex-direction:column; gap:6px;">
              <div>BOP open. Pump down the choke line. Return up the marine riser.</div>
              <div>The circulating pressure required is only due to choke line friction.</div>
              <div style="background-color:var(--bg-subtle); padding:6px 10px; border-radius:6px; font-family:monospace; color:var(--text-primary); margin-top:4px;">Example: Pump pressure = 200 psi</div>
              <div style="font-weight:700; color:#10B981; font-size:0.85rem; margin-top:4px;">Therefore, CLF = 200 psi</div>
            </div>
          </div>

          <!-- Method 4 -->
          <div style="border: 1px solid var(--border-subtle); border-radius:12px; padding:12px 14px; background-color:var(--card-bg);">
            <h4 style="font-size:0.9rem; font-weight:700; color:var(--accent-color); margin-top:0; margin-bottom:8px;">Method 4</h4>
            <div style="font-size:0.8rem; line-height:1.4; color:var(--text-secondary); display:flex; flex-direction:column; gap:6px;">
              <div>Close the BOP. Pump down the kill line. Return through a fully open choke line.</div>
              <div>The pressure observed is twice the choke line friction because fluid travels down the kill line and up the choke line.</div>
              <div style="background-color:var(--bg-subtle); padding:6px 10px; border-radius:6px; font-family:monospace; color:var(--text-primary); margin-top:4px;">Example: Pump pressure = 400 psi</div>
              <div style="border-top:1px solid var(--border-subtle); padding-top:6px; margin-top:4px;">
                <strong>Formula:</strong><br>
                CLF = Total pressure ÷ 2<br>
                = 400 ÷ 2 = 200 psi
              </div>
              <div style="font-weight:700; color:#10B981; font-size:0.85rem; margin-top:4px;">Therefore, CLF = 200 psi</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('wc-clf-back-btn').onclick = () => {
      handleAppBack();
    };
  } else if (wellControlSubState.view === 'equations') {
    const isSurface = wellControlSubState.category === 'surface';
    const title = isSurface ? 'Surface Stack Well Control Formulas' : 'Subsea Stack Well Control Formulas';
    const content = isSurface ? `
      <div class="wc-equation-card">
        <span class="wc-equation-name">Initial Circulating Pressure (ICP)</span>
        <span class="wc-equation-formula">ICP = SIDPP + SCR</span>
        <p class="wc-equation-desc">Required pressure to initiate circulation with original mud.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Final Circulating Pressure (FCP)</span>
        <span class="wc-equation-formula">FCP = SCR &times; (KMW / OMW)</span>
        <p class="wc-equation-desc">Pressure to maintain constant bottom-hole pressure when kill mud fills string.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Kill Mud Weight (KMW)</span>
        <span class="wc-equation-formula">KMW = OMW + [SIDPP / (0.052 &times; TVD)]</span>
        <p class="wc-equation-desc">Mud density required to balance formation pressure.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Kick Tolerance (KT)</span>
        <span class="wc-equation-formula">KT = (LOT_Pressure - Shoe_Hydrostatic) / (0.052 &times; Shoe_TVD)</span>
        <p class="wc-equation-desc">Maximum allowable kick mud density increase to avoid fracturing the casing shoe.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">MAASP</span>
        <span class="wc-equation-formula">MAASP = (LOT_EMW - Mud_Weight) &times; 0.052 &times; Shoe_TVD</span>
        <p class="wc-equation-desc">Maximum Allowable Annular Surface Pressure before casing shoe fractures.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Trip Margin</span>
        <span class="wc-equation-formula">Trip Margin = YP / (11.7 &times; [Hole_ID - Pipe_OD])</span>
        <p class="wc-equation-desc">Mud weight increment required to overcome swab pressure during tripping.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Safety Margin (Overbalance)</span>
        <span class="wc-equation-formula">Safety Margin = (0.052 &times; MW &times; TVD) - Pore_Pressure</span>
        <p class="wc-equation-desc">Hydrostatic safety overbalance margin above formation pore pressure.</p>
      </div>
      
      <button class="btn btn-primary" style="margin-top:20px;" onclick="state.flowType='surface'; navigateTo('surface-hole-size');">
        Go to Surface Stack Workflow
      </button>
    ` : `
      <div class="wc-equation-card">
        <span class="wc-equation-name">Riser Margin (RM)</span>
        <span class="wc-equation-formula">RM = [(Water_Depth + Air_Gap) &times; MW &times; 0.052] / [0.052 &times; (TVD - Water_Depth)]</span>
        <p class="wc-equation-desc">Mud density increment to prevent blowout/collapse when riser is disconnected.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Subsea Accumulator Capacity</span>
        <span class="wc-equation-formula">Capacity = Bottles &times; Vol &times; (P_precharge + 0.052 &times; SW_Density &times; WD) &times; [1/P_min - 1/P_max]</span>
        <p class="wc-equation-desc">Usable subsea fluid volume adjusted for hydrostatic head of seawater column.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Gas Migration Rate</span>
        <span class="wc-equation-formula">Migration Rate = Rise_Rate / Mud_Gradient</span>
        <p class="wc-equation-desc">Gas migration velocity in a shut-in wellbore.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Maximum Surface Pressure</span>
        <span class="wc-equation-formula">Max P_surf = sqrt((P_formation &times; Pit_Gain) / (2 &times; Annular_Cap &times; 1029.4))</span>
        <p class="wc-equation-desc">Estimated maximum surface pressure during gas kick expansion at surface.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Kill Mud Weight (KMW)</span>
        <span class="wc-equation-formula">KMW = OMW + [SIDPP / (0.052 &times; TVD)]</span>
        <p class="wc-equation-desc">Mud density required to balance formation pressure.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Kick Tolerance (KT)</span>
        <span class="wc-equation-formula">KT = (LOT_Pressure - Shoe_Hydrostatic) / (0.052 &times; Shoe_TVD)</span>
        <p class="wc-equation-desc">Maximum allowable mud weight increase to avoid fracturing casing shoe.</p>
      </div>
      <div class="wc-equation-card">
        <span class="wc-equation-name">Safety Margin (Overbalance)</span>
        <span class="wc-equation-formula">Safety Margin = (0.052 &times; MW &times; TVD) - Pore_Pressure</span>
        <p class="wc-equation-desc">Hydrostatic safety overbalance margin above formation pore pressure.</p>
      </div>

      <button class="btn btn-primary" style="margin-top:20px;" onclick="state.flowType='subsea'; navigateTo('subsea-hole-size');">
        Go to Subsea Stack Workflow
      </button>
    `;

    container.innerHTML = `
      <div class="content-card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="wc-eqs-back-btn">Back to Menu</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0; text-transform: capitalize;">${wellControlSubState.category} Stack</h3>
        </div>
        
        <h4 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin-bottom:15px;">${title}</h4>
        
        <div class="wc-equations-list">
          ${content}
        </div>
      </div>
    `;

    document.getElementById('wc-eqs-back-btn').onclick = () => {
      wellControlSubState.view = 'menu';
      wellControlSubState.category = null;
      wellControlSubState.formulaId = null;
      renderWellControlScreen();
    };
  }
}

function getQuickRefGuideItemId() {
  if (quickRefSubState.view === 'drill-bit-torque') return 'drill_bit_torque';
  if (quickRefSubState.view === 'ring-gaskets') return 'ring_gaskets_conn';
  if (quickRefSubState.view === 'wellhead') return 'surface_wellhead';
  if (quickRefSubState.view === 'subsea-ref') return 'subsea_equipment';
  return null;
}

window.updateQuickRefFavoriteIcon = () => {
  const favBtn = document.getElementById('quick-ref-fav-btn');
  if (!favBtn) return;
  
  const itemId = getQuickRefGuideItemId();
  if (!itemId) {
    favBtn.style.display = 'none';
    return;
  }
  
  favBtn.style.display = 'flex';
  const isFav = typeof GuideFavoritesStore !== 'undefined' && GuideFavoritesStore.isFavorited(itemId);
  favBtn.innerHTML = renderIcon(isFav ? 'star' : 'star_border', { size: '20px', style: isFav ? 'color:#EAB308;' : 'color:var(--text-secondary);' });
};

window.toggleQuickRefFavorite = () => {
  const itemId = getQuickRefGuideItemId();
  if (!itemId) return;
  
  if (typeof GuideFavoritesStore !== 'undefined') {
    const isFav = GuideFavoritesStore.toggleFavorite(itemId);
    if (typeof syncGuideFavoriteButtonsInDOM === 'function') {
      syncGuideFavoriteButtonsInDOM(itemId, isFav);
    }
    if (typeof updateGuideQuickAccessUI === 'function') {
      updateGuideQuickAccessUI();
    }
  }
  window.updateQuickRefFavoriteIcon();
};

function getQuickRefTitle() {
  if (quickRefSubState.view === 'drill-bit-torque') return 'Drill Bit Make-Up Torque';
  if (quickRefSubState.view === 'ring-gaskets') return 'Ring Gaskets & Connections';
  if (quickRefSubState.view === 'wellhead') return 'Surface Wellhead Information';
  if (quickRefSubState.view === 'subsea-ref') return 'Subsea Equipment Reference';
  return 'Quick Reference';
}

function renderQuickRefScreen() {
  window.updateQuickRefFavoriteIcon();
  const titleEl = document.getElementById('quick-ref-title');
  if (titleEl) {
    const rawTitle = getQuickRefTitle();
    titleEl.textContent = window.I18n ? window.I18n.translate(rawTitle) : rawTitle;
  }
  const container = document.getElementById('quick-ref-container');
  if (!container) return;

  const subtitleEl = document.querySelector('#screen-quick-ref .screen-subtitle');
  const backBtn = document.querySelector('#screen-quick-ref .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      handleAppBack();
    };
  }

  if (quickRefSubState.view === 'menu') {
    if (subtitleEl) subtitleEl.textContent = 'Select quick reference category';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <!-- Option 1: Drill Bit Make-Up Torque -->
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="handleGuideItemClick('drill_bit_torque', 'Quick Reference');">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-quickref)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 3h6v4H9z"></path>
                <path d="M6 7h12l-2 8H8z"></path>
                <path d="M8 15l-2 5 3-1 3 1 3-1 3 1-2-5"></path>
                <path d="M10 7l-2 8"></path>
                <path d="M14 7l-2 8"></path>
              </svg>
            </div>
            <div class="card-info">
              <div class="card-title">Drill Bit Make-Up Torque</div>
              <div class="card-desc">Standard recommended make-up torque values for regular bit threads.</div>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>

        <!-- Option 2: Ring Gaskets & Connections -->
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="handleGuideItemClick('ring_gaskets_conn', 'Quick Reference');">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-quickref)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"></circle>
                <circle cx="12" cy="12" r="5"></circle>
                <circle cx="12" cy="5" r="0.75" fill="currentColor"></circle>
                <circle cx="12" cy="19" r="0.75" fill="currentColor"></circle>
                <circle cx="5" cy="12" r="0.75" fill="currentColor"></circle>
                <circle cx="19" cy="12" r="0.75" fill="currentColor"></circle>
                <circle cx="7" cy="7" r="0.75" fill="currentColor"></circle>
                <circle cx="17" cy="17" r="0.75" fill="currentColor"></circle>
              </svg>
            </div>
            <div class="card-info">
              <div class="card-title">Ring Gaskets & Connections</div>
              <div class="card-desc">API 16A Flange & Hub Ring Gasket Reference Table.</div>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>

        <!-- Option 3: Surface Wellhead Information -->
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="handleGuideItemClick('surface_wellhead', 'Quick Reference');">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-quickref)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 18h12"></path>
                <path d="M8 21h8"></path>
                <rect x="9" y="8" width="6" height="10" rx="1"></rect>
                <path d="M9 11H6V9h3"></path>
                <path d="M15 11h3V9h-3"></path>
                <path d="M8 5h8v3H8z"></path>
              </svg>
            </div>
            <div class="card-info">
              <div class="card-title">Surface Wellhead Information</div>
              <div class="card-desc">API surface wellhead body parts, ring gaskets, studs & packing specifications.</div>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>

        <!-- Option 4: Subsea Equipment Reference -->
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="handleGuideItemClick('subsea_equipment', 'Quick Reference');">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-quickref)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0"></path>
                <path d="M2 22c2-1 4-1 6 0s4 1 6 0 4-1 6 0"></path>
                <circle cx="12" cy="10" r="4"></circle>
                <path d="M12 14v4"></path>
              </svg>
            </div>
            <div class="card-info">
              <div class="card-title">Subsea Equipment Reference</div>
              <div class="card-desc">Emergency Drill Pipe Hang-Off Tool (EDPHOT) overview, capacities & operational procedures.</div>
            </div>
          </div>
          <span class="card-chevron">&rsaquo;</span>
        </div>
      </div>
    `;
  } else if (quickRefSubState.view === 'drill-bit-torque') {
    if (subtitleEl) subtitleEl.textContent = 'Drill Bit Make-Up Torque Reference Table';

    const torqueData = [
      { thread: '2-3/8" REG', danm: '400–480', ftlb: '3000–3500' },
      { thread: '2-7/8" REG', danm: '600–750', ftlb: '4500–5500' },
      { thread: '3-1/2" REG', danm: '950–1200', ftlb: '7000–9000' },
      { thread: '4-1/2" REG', danm: '1600–2200', ftlb: '12000–16000' },
      { thread: '6-5/8" REG', danm: '3800–4300', ftlb: '28000–32000' },
      { thread: '7-5/8" REG', danm: '4600–5400', ftlb: '34000–40000' },
      { thread: '8-5/8" REG', danm: '5400–8100', ftlb: '40000–60000' }
    ];

    container.innerHTML = `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="font-weight:700; color:var(--text-primary);">Bit Thread</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">Torque (daN.m)</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">Torque (ft.lb)</th>
              </tr>
            </thead>
            <tbody id="quick-ref-tbody"></tbody>
          </table>
        </div>

        <h4 style="margin-top: 25px; margin-bottom: 10px; font-weight: 600; font-size: 0.9rem;">Important Torque Guidelines:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
          <li>All connection threads must be thoroughly cleaned with a wire brush and solvent before makeup.</li>
          <li>Apply a uniform, thin coat of API thread compound to the pin and box threads, including thread shoulders.</li>
          <li>Initial makeup torque should start at the lower limit and can be increased up to the upper limit if leakage occurs or under high drag/rotational force drilling.</li>
          <li>Always follow the specific bit manufacturer's specifications when available.</li>
        </ul>
      </div>
    `;

    const tbody = document.getElementById('quick-ref-tbody');
    const searchInput = document.getElementById('quick-ref-search');

    function populate(filterText = '') {
      tbody.innerHTML = '';
      const filtered = torqueData.filter(d =>
        d.thread.toLowerCase().includes(filterText.toLowerCase())
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:var(--text-secondary);">No matching thread records found.</td></tr>`;
        return;
      }

      filtered.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 600; color: var(--text-primary);">${d.thread}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.9rem;">${d.danm}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.9rem; font-weight: 600; color: var(--accent-color);">${d.ftlb}</td>
        `;
        tbody.appendChild(row);
      });
    }

    if (searchInput) {
      searchInput.oninput = (e) => {
        populate(e.target.value);
      };
    }

    populate();
  } else if (quickRefSubState.view === 'ring-gaskets') {
    if (subtitleEl) subtitleEl.textContent = 'Ring Gaskets for 6B & 6BX Flanges';

    const gasketData = [
      { size: '2 1/16"', m2: 'R/RX 23', m3: 'R/RX 24', m5: 'R/RX 24', m10: 'BX 152', m15_20: 'BX 152' },
      { size: '2 9/16"', m2: 'R/RX 26', m3: 'R/RX 27', m5: 'R/RX 27', m10: 'BX 153', m15_20: 'BX 153' },
      { size: '3 1/8"', m2: 'R/RX 31', m3: 'R/RX 31', m5: 'R/RX 35', m10: '—', m15_20: '—' },
      { size: '3 1/16"', m2: '—', m3: '—', m5: '—', m10: 'BX 154', m15_20: 'BX 154' },
      { size: '4 1/16"', m2: 'R/RX 37', m3: 'R/RX 37', m5: 'R/RX 39', m10: 'BX 155', m15_20: 'BX 155' },
      { size: '7 1/16"', m2: 'R/RX 45', m3: 'R/RX 45', m5: 'R/RX 46', m10: 'BX 156', m15_20: 'BX 156' },
      { size: '9"', m2: 'R/RX 49', m3: 'R/RX 49', m5: 'R/RX 50', m10: 'BX 157', m15_20: 'BX 157' },
      { size: '11"', m2: 'R/RX 53', m3: 'R/RX 53', m5: 'R/RX 54', m10: 'BX 158', m15_20: 'BX 158' },
      { size: '13 5/8"', m2: 'R/RX 57', m3: 'R/RX 57', m5: 'BX 160', m10: 'BX 159', m15_20: 'BX 159' },
      { size: '16 3/4"', m2: 'R/RX 65', m3: 'R/RX 66', m5: 'BX 162', m10: 'BX 162', m15_20: '—' },
      { size: '18 3/4"', m2: '—', m3: '—', m5: 'BX 163', m10: 'BX 164', m15_20: 'BX 164' },
      { size: '20 3/4"', m2: '—', m3: 'R/RX 74', m5: '—', m10: '—', m15_20: '—' },
      { size: '21 1/4"', m2: 'R/RX 73', m3: '—', m5: 'BX 165', m10: 'BX 166', m15_20: '—' }
    ];

    container.innerHTML = `
      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="font-weight:700; color:var(--text-primary);">Size</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">2M</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">3M</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">5M</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">10M</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary);">15M/20M</th>
              </tr>
            </thead>
            <tbody id="ring-gaskets-tbody"></tbody>
          </table>
        </div>
      </div>
      
      <div class="content-card" style="margin-top:20px; font-size:0.85rem; line-height:1.5; color:var(--text-secondary);">
        <h4 style="font-weight:700; color:var(--text-primary); margin-bottom:12px;">Technical Guidelines</h4>
        
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <span style="font-weight:600; color:var(--text-primary); display:block; margin-bottom:4px;">Flange Types (6B vs 6BX)</span>
            <p style="margin:0;">
              <strong>Type 6B flanges</strong> are used for pressure ratings of 2,000 & 3,000 psi (all sizes), and 5,000 psi (sizes smaller than 13-5/8").<br>
              <strong>Type 6BX flanges</strong> are used for 5,000 psi (sizes 13-5/8" & above), and all sizes of 10,000, 15,000 & 20,000 psi rating.
            </p>
          </div>
          
          <div>
            <span style="font-weight:600; color:var(--text-primary); display:block; margin-bottom:4px;">Ring Gasket Types & Interchangeability</span>
            <p style="margin:0;">
              <strong>R & RX Gaskets:</strong> Used in Type 6B flanges (flat bottom grooves). R and RX are interchangeable since they use the same flange groove.<br>
              <strong>BX Gaskets:</strong> Used only in Type 6BX flanges. BX rings are not interchangeable with RX or R.
            </p>
          </div>

          <div>
            <span style="font-weight:600; color:var(--text-primary); display:block; margin-bottom:4px;">Clamp-Type & Grayloc Connections</span>
            <p style="margin:0;">
              Bolted half-ring clamp hub connections are quicker to assemble/disassemble than API flanges. The Grayloc ring combines tapered, flexible lips forming a pressure-energized seal against the mating hub faces.
            </p>
          </div>
          
          <div style="background-color:rgba(230,161,92,0.06); border-left:3px solid var(--accent-color); padding:10px 12px; border-radius:4px;">
            <span style="font-weight:600; color:var(--text-primary); display:block; margin-bottom:4px;">Critical Maintenance Rules</span>
            <ul style="margin:0; padding-left:16px;">
              <li>Ring gaskets should be used clean & dry. <strong>No grease</strong> should be applied to ring gaskets.</li>
              <li>Ring gaskets are designed for single-use deformation and <strong>should not be re-used</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    const tbody = document.getElementById('ring-gaskets-tbody');

    function populate() {
      tbody.innerHTML = '';

      gasketData.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 600; color: var(--text-primary);">${d.size}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.85rem;">${d.m2}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.85rem;">${d.m3}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.85rem; color: var(--accent-color);">${d.m5}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${d.m10}</td>
          <td style="text-align: right; font-family: monospace; font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${d.m15_20}</td>
        `;
        tbody.appendChild(row);
      });
    }

    populate();
  } else if (quickRefSubState.view === 'wellhead') {
    if (subtitleEl) subtitleEl.textContent = 'Surface Wellhead Body & Accessories';

    const activeTab = quickRefSubState.wellheadTab || 'A';

    const wellheadData = {
      A: [
        { no: 1, desc: 'MAIN W/H BODY 11" X 5M', qty: 1, remark: 'A-SEC INSTALLATION' },
        { no: 2, desc: '13-5/8" X 9-5/8" SECONDARY PRESSURE PLATE', qty: 2, remark: 'A-SEC INSTALLATION' },
        { no: 3, desc: '13-5/8" X 9-5/8" SECONDARY RUBBER PACKING', qty: 1, remark: 'A-SEC INSTALLATION' },
        { no: 4, desc: 'RX-54 RING GASKET SS 304', qty: 1, remark: 'A-SEC INSTALLATION' },
        { no: 5, desc: '1-7/8" X 13-3/8" TO 14-1/2" STUD WITH NUT', qty: 12, remark: 'A-SEC INSTALLATION' }
      ],
      B: [
        { no: 1, desc: 'MAIN W/H BODY 13-5/8" X 5M', qty: 1, remark: 'B-SEC INSTALLATION' },
        { no: 2, desc: '13-5/8" X 9-5/8" CASING SLIP', qty: 1, remark: 'A-SEC INSTALLATION' },
        { no: 3, desc: '21-1/4" X 13-3/8" SECONDARY PRESSURE PLATE', qty: 2, remark: 'B-SEC INSTALLATION' },
        { no: 4, desc: '21-1/4" X 13-3/8" SECONDARY RUBBER PACKING', qty: 1, remark: 'B-SEC INSTALLATION' },
        { no: 5, desc: '13-5/8" X 9-5/8" PRIMARY PRESSURE PLATE', qty: 2, remark: 'A-SEC INSTALLATION' },
        { no: 6, desc: '13-5/8" X 9-5/8" PRIMARY RUBBER PACKING', qty: 1, remark: 'A-SEC INSTALLATION' },
        { no: 7, desc: 'BX-160 RING GASKET SS 304', qty: 1, remark: 'A-SEC INSTALLATION' },
        { no: 8, desc: '1-5/8" X 12-1/2" TO 12-3/4" STUD WITH NUT', qty: 16, remark: 'A-SEC INSTALLATION' }
      ],
      C: [
        { no: 1, desc: 'MAIN W/H BODY 21-1/4" X 2M', qty: 1, remark: 'C-SEC ACCESSORY' },
        { no: 2, desc: '21-1/4" X 13-3/8" CASING SLIP', qty: 1, remark: 'B-SEC INSTALLATION' },
        { no: 3, desc: '21-1/4" X 13-3/8" PRIMARY RUBBER PACKING', qty: 1, remark: 'B-SEC INSTALLATION' },
        { no: 4, desc: '21-1/4" X 13-3/8" PRIMARY PRESSURE PLATE', qty: 2, remark: 'B-SEC INSTALLATION' },
        { no: 5, desc: 'RX-73 RING GASKET SS 304', qty: 1, remark: 'B-SEC INSTALLATION' },
        { no: 6, desc: '1-5/8" X 11-3/4" STUD WITH NUT', qty: 24, remark: 'B-SEC INSTALLATION' }
      ]
    };

    container.innerHTML = `
      <div class="segmented-control">
        <button class="segmented-control-btn ${activeTab === 'A' ? 'active' : ''}" onclick="quickRefSubState.wellheadTab = 'A'; renderQuickRefScreen();">Section A</button>
        <button class="segmented-control-btn ${activeTab === 'B' ? 'active' : ''}" onclick="quickRefSubState.wellheadTab = 'B'; renderQuickRefScreen();">Section B</button>
        <button class="segmented-control-btn ${activeTab === 'C' ? 'active' : ''}" onclick="quickRefSubState.wellheadTab = 'C'; renderQuickRefScreen();">Section C</button>
      </div>

      <div class="content-card">
        <div class="table-responsive">
          <table class="data-table" style="width:100%;">
            <thead>
              <tr>
                <th style="font-weight:700; color:var(--text-primary); width: 10%;">S.N</th>
                <th style="font-weight:700; color:var(--text-primary); width: 50%;">Description</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary); width: 15%;">Qty</th>
                <th style="text-align: right; font-weight:700; color:var(--text-primary); width: 25%;">Remarks</th>
              </tr>
            </thead>
            <tbody id="wellhead-tbody"></tbody>
          </table>
        </div>
      </div>

      <div class="content-card" style="margin-top:20px; font-size:0.85rem; line-height:1.5; color:var(--text-secondary);">
        <h4 style="font-weight:700; color:var(--text-primary); margin-bottom:8px;">Section ${activeTab} Overview</h4>
        <p style="margin:0;" id="wellhead-desc-summary"></p>
      </div>
    `;

    // Set explanation summaries
    const summaryEl = document.getElementById('wellhead-desc-summary');
    if (activeTab === 'A') {
      summaryEl.innerHTML = `<strong>Section A (Tubing / Production interface)</strong>: Features a high-pressure 11" 5,000 psi body housing, configured with secondary packing elements and pressure plates for 9-5/8" casing protection. Utilizes the RX-54 ring gasket and 1-7/8" structural studs.`;
    } else if (activeTab === 'B') {
      summaryEl.innerHTML = `<strong>Section B (Intermediate casing section)</strong>: Consists of a 13-5/8" 5,000 psi body housing supporting the 9-5/8" casing slip hanger and secondary seals for Section C's 13-3/8" interface. Fits the BX-160 ring gasket and 1-5/8" studs.`;
    } else if (activeTab === 'C') {
      summaryEl.innerHTML = `<strong>Section C (Surface casing section)</strong>: Houses the main 21-1/4" 2,000 psi body housing that mounts on the conductor. Accommodates the 13-3/8" casing slip hanger, primary packaging seals, primary pressure plates, RX-73 gasket, and 24 structural studs (1-5/8" x 11-3/4").`;
    }

    const tbody = document.getElementById('wellhead-tbody');
    const tabData = wellheadData[activeTab];

    function populate() {
      tbody.innerHTML = '';
      tabData.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-family: monospace; font-size: 0.85rem;">${d.no}</td>
          <td style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${d.desc}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 700; color: var(--accent-color);">${d.qty}</td>
          <td style="text-align: right; font-size: 0.8rem; color: var(--text-secondary);">${d.remark}</td>
        `;
        tbody.appendChild(row);
      });
    }

    populate();
  } else if (quickRefSubState.view === 'subsea-ref') {
    if (subtitleEl) subtitleEl.textContent = 'Subsea Equipment Reference';

    const activeTab = quickRefSubState.subseaTab || 'overview';

    let tabContent = '';
    if (activeTab === 'overview') {
      tabContent = `
        <div class="content-card">
          <h3 style="font-size:1.05rem; font-weight:700; margin:0 0 10px 0; color:var(--text-primary);">Emergency Drill Pipe Hang-Off Tool (EDPHOT)</h3>
          <p style="font-size:0.85rem; line-height:1.45; color:var(--text-secondary); margin:0 0 15px 0;">
            This procedure covers emergency drill pipe hang-off using the drill pipe Hang-Off Tool. This tool can be landed on top of any Wear Bushing 16" or smaller. The Hang-Off Tool can be landed on top of the Nominal Bore Protector and the bottom of the Wellhead. 
          </p>
          <p style="font-size:0.85rem; line-height:1.45; color:var(--text-secondary); margin:0 0 15px 0;">
            The length of the Hang-Off Tool is tailored to space out a 5" OD drill pipe section opposite the lower pipe rams in your BOP stack. When the tool lands on a Wear Bushing, the upper body of the tool is safely below the shear rams. 
          </p>
          <div style="background-color:rgba(230,161,92,0.06); border-left:3px solid var(--accent-color); padding:10px 12px; border-radius:4px; margin-bottom:15px; font-size:0.82rem; line-height:1.4; color:var(--text-secondary);">
            <strong>Usage Restriction:</strong> Use this tool for emergency drill pipe hang-off only. If it is desired to perform a BOP stack test in conjunction with hanging-off the drill pipe, refer to the appropriate BOP testing procedures.
          </div>
        </div>

        <div class="content-card" style="margin-top:15px; overflow:hidden;">
          <h3 style="font-size:1rem; font-weight:700; margin:0 0 5px 0; color:var(--text-primary);">EDPHOT Technical Assembly</h3>
          <span style="font-size:0.75rem; color:var(--text-secondary); display:block; margin-bottom:15px;">Figure 1. Drill Pipe Hang-Off Tool with its Running Tool (Hover to inspect components)</span>
          
          <div class="edphot-diagram-container">
            <svg class="edphot-svg" width="320" height="420" viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;">
              <!-- Definitions for CAD hatch and blueprint patterns -->
              <defs>
                <!-- Blueprint Grid -->
                <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--text-secondary)" stroke-width="0.35" opacity="0.12" />
                </pattern>

                <!-- 3D Satin Cylindrical Gradients -->
                <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stop-color="#374151" />
                  <stop offset="25%"  stop-color="#6b7280" />
                  <stop offset="50%"  stop-color="#f9fafb" />
                  <stop offset="75%"  stop-color="#9ca3af" />
                  <stop offset="100%" stop-color="#1f2937" />
                </linearGradient>
                <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stop-color="#78350f" />
                  <stop offset="25%"  stop-color="#b45309" />
                  <stop offset="50%"  stop-color="#fef3c7" />
                  <stop offset="75%"  stop-color="#d97706" />
                  <stop offset="100%" stop-color="#78350f" />
                </linearGradient>
                <linearGradient id="pipe-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stop-color="#111827" />
                  <stop offset="25%"  stop-color="#4b5563" />
                  <stop offset="50%"  stop-color="#e5e7eb" />
                  <stop offset="75%"  stop-color="#6b7280" />
                  <stop offset="100%" stop-color="#0f172a" />
                </linearGradient>

                <!-- Micro CAD Hatch Pattern -->
                <pattern id="hatch-pattern" width="5" height="5" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(255,255,255,0.22)" stroke-width="0.5" />
                </pattern>
              </defs>

              <!-- Technical Grid Background -->
              <rect width="320" height="420" fill="url(#blueprint-grid)" rx="8" />

              <!-- Outer Border for Blueprint Aesthetic -->
              <rect x="2" y="2" width="316" height="416" fill="none" stroke="var(--text-secondary)" stroke-width="0.5" opacity="0.2" rx="6" />

              <!-- Deep Internal Bore Cavity Shadow -->
              <rect x="140" y="15" width="16" height="385" fill="#0f172a" opacity="0.95" />

              <!-- RUNNING TOOL -->
              <g class="diagram-part" data-name="RUNNING TOOL">
                <title>RUNNING TOOL: Heavy-duty assembly used to lower, land, and release the Hang-Off Tool. Released by right-hand rotation.</title>
                <!-- Left side exterior 3D cylinder -->
                <path d="M125 15 L140 15 L140 35 L125 35 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <!-- Right side cutaway wall -->
                <path d="M146 15 L155 15 L155 35 L146 35 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <path d="M146 15 L155 15 L155 35 L146 35 Z" fill="url(#hatch-pattern)" />
                <!-- Top Box Internal Threads -->
                <path d="M146 18 L142 20 L146 22 M146 22 L142 24 L146 26 M146 26 L142 28 L146 30 M146 30 L142 32 L146 34" stroke="#9ca3af" stroke-width="0.75" fill="none" />
                <!-- Neck -->
                <rect x="130" y="35" width="10" height="25" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <rect x="144" y="35" width="6"  height="25" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <rect x="144" y="35" width="6"  height="25" fill="url(#hatch-pattern)" />
                <!-- Thread stem -->
                <rect x="132" y="85" width="8" height="50" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <rect x="143" y="85" width="5" height="50" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <rect x="143" y="85" width="5" height="50" fill="url(#hatch-pattern)" />
                <!-- Callout -->
                <line x1="155" y1="25" x2="228" y2="25" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="155" cy="25" r="1.2" fill="var(--accent-color)" />
                <text x="232" y="28" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">RUNNING TOOL</text>
              </g>

              <!-- RE-ENTRY TAPER -->
              <g class="diagram-part" data-name="RE-ENTRY TAPER">
                <title>RE-ENTRY TAPER: Conical guide profile that centres the retrieving string for re-entry and alignment during retrieval operations.</title>
                <path d="M100 60 L140 60 L140 85 L110 85 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <path d="M144 60 L180 60 L170 85 L144 85 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
                <path d="M144 60 L180 60 L170 85 L144 85 Z" fill="url(#hatch-pattern)" />
                <!-- Callout -->
                <line x1="165" y1="70" x2="228" y2="70" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="165" cy="70" r="1.2" fill="var(--accent-color)" />
                <text x="232" y="73" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">RE-ENTRY TAPER</text>
              </g>

              <!-- UPPER BODY -->
              <g class="diagram-part" data-name="UPPER BODY">
                <title>UPPER BODY: Main upper housing of the Hang-Off Tool. Contains the L.H. square-thread bore and 4-1/2" API I.F. drill pipe box connection.</title>
                <path d="M95 85 L140 85 L140 145 L115 145 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
                <path d="M144 85 L185 85 L185 105 L165 145 L148 145 L148 135 L154 135 L154 105 L144 105 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
                <path d="M144 85 L185 85 L185 105 L165 145 L148 145 L148 135 L154 135 L154 105 L144 105 Z" fill="url(#hatch-pattern)" />
                <!-- Callout -->
                <line x1="170" y1="95" x2="228" y2="95" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="170" cy="95" r="1.2" fill="var(--accent-color)" />
                <text x="232" y="98" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">UPPER BODY</text>
              </g>

              <!-- O-RING -->
              <g class="diagram-part" data-name="O-RING">
                <title>O-RING: Elastomer seal on the running stem that provides a pressure-tight barrier between the stem and upper body bore.</title>
                <ellipse cx="136" cy="95" rx="4" ry="2" fill="#f87171" stroke="#dc2626" stroke-width="0.6" />
                <circle cx="143.5" cy="95" r="2.2" fill="#f87171" stroke="#dc2626" stroke-width="0.6" />
                <!-- Callout -->
                <line x1="136" y1="95" x2="75" y2="95" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="136" cy="95" r="1.2" fill="var(--accent-color)" />
                <text x="72" y="98" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">O-RING</text>
              </g>

              <!-- SQUARE THREADS -->
              <g class="diagram-part" data-name="SQUARE THREADS">
                <title>SQUARE THREADS: Left-Hand square-profile threads on the running stem. Clockwise rotation disengages the running tool from the hang-off tool.</title>
                <!-- Male threads on stem -->
                <rect x="140" y="105" width="4" height="2" fill="url(#metal-grad)"  stroke="#0f172a" stroke-width="0.4" />
                <rect x="140" y="109" width="4" height="2" fill="url(#metal-grad)"  stroke="#0f172a" stroke-width="0.4" />
                <rect x="140" y="113" width="4" height="2" fill="url(#metal-grad)"  stroke="#0f172a" stroke-width="0.4" />
                <rect x="140" y="117" width="4" height="2" fill="url(#metal-grad)"  stroke="#0f172a" stroke-width="0.4" />
                <rect x="140" y="121" width="4" height="2" fill="url(#metal-grad)"  stroke="#0f172a" stroke-width="0.4" />
                <rect x="140" y="125" width="4" height="2" fill="url(#metal-grad)"  stroke="#0f172a" stroke-width="0.4" />
                <!-- Female threads in upper body -->
                <rect x="144" y="107" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
                <rect x="144" y="111" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
                <rect x="144" y="115" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
                <rect x="144" y="119" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
                <rect x="144" y="123" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
                <rect x="144" y="127" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
                <!-- Callout -->
                <line x1="140" y1="115" x2="75" y2="115" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="140" cy="115" r="1.2" fill="var(--accent-color)" />
                <text x="72" y="118" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">SQUARE THREADS</text>
              </g>

              <!-- DRILL PIPE BOX -->
              <g class="diagram-part" data-name="DRILL PIPE BOX">
                <title>DRILL PIPE BOX: 4-1/2" API I.F. box connection machined into the upper body. Used to re-engage and retrieve the hang-off tool.</title>
                <path d="M148 138 L143 140 L148 142 M148 142 L143 144 L148 146 M148 146 L143 148 L148 150 M148 150 L143 152 L148 154 M148 154 L143 156 L148 158" stroke="#cbd5e1" stroke-width="0.8" fill="none" />
                <!-- Callout -->
                <line x1="143" y1="148" x2="75" y2="148" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="143" cy="148" r="1.2" fill="var(--accent-color)" />
                <text x="72" y="151" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">DRILL PIPE BOX</text>
              </g>

              <!-- DRILL PIPE SECTION -->
              <g class="diagram-part" data-name="DRILL PIPE SECTION">
                <title>DRILL PIPE SECTION: 5" OD drill pipe body running through the BOP stack. Length is tailored so the tool seats precisely opposite the lower pipe rams.</title>
                <rect x="128" y="145" width="12" height="150" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
                <rect x="126" y="145" width="14" height="15"  fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
                <rect x="126" y="280" width="14" height="15"  fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
                <rect x="144" y="145" width="8"  height="150" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
                <rect x="144" y="145" width="8"  height="150" fill="url(#hatch-pattern)" />
                <!-- Callout -->
                <line x1="138" y1="210" x2="228" y2="210" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="138" cy="210" r="1.2" fill="var(--accent-color)" />
                <text x="232" y="213" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">DRILL PIPE SECTION</text>
              </g>

              <!-- LOWER BODY -->
              <g class="diagram-part" data-name="LOWER BODY">
                <title>LOWER BODY: Tapered landing shoulder that seats inside the Wear Bushing bore to support the full weight of the suspended drill string.</title>
                <path d="M110 295 L140 295 L140 350 L120 350 L100 320 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
                <path d="M148 290 L170 290 L180 320 L160 350 L144 350 L144 335 L148 335 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
                <path d="M148 290 L170 290 L180 320 L160 350 L144 350 L144 335 L148 335 Z" fill="url(#hatch-pattern)" />
                <path d="M148 303 L143 305 L148 307 M148 307 L143 309 L148 311 M148 311 L143 313 L148 315 M148 315 L143 317 L148 319 M148 319 L143 321 L148 323 M148 323 L143 325 L148 327" stroke="#cbd5e1" stroke-width="0.8" fill="none" />
                <!-- Callout -->
                <line x1="120" y1="310" x2="75" y2="310" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="120" cy="310" r="1.2" fill="var(--accent-color)" />
                <text x="72" y="313" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">LOWER BODY</text>
              </g>

              <!-- FLOW BY -->
              <g class="diagram-part" data-name="FLOW BY">
                <title>FLOW BY: Elongated bypass slots in the landing shoulder that allow mud returns and pressure equalisation during running and landing.</title>
                <ellipse cx="120" cy="325" rx="3" ry="12" fill="#0f172a" />
                <ellipse cx="130" cy="325" rx="3" ry="12" fill="#0f172a" />
                <!-- Callout -->
                <line x1="116" y1="325" x2="75" y2="325" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="116" cy="325" r="1.2" fill="var(--accent-color)" />
                <text x="72" y="328" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">FLOW BY</text>
              </g>

              <!-- DRILL PIPE EXTENSION -->
              <g class="diagram-part" data-name="DRILL PIPE EXTENSION">
                <title>DRILL PIPE EXTENSION: Lower pin connection that makes up directly to the uppermost joint of the suspended string being hung off.</title>
                <rect x="130" y="350" width="10" height="50" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
                <path d="M130 385 L126 387 L130 389 M130 389 L126 391 L130 393 M130 393 L126 395 L130 397 M130 397 L126 399 L130 401" stroke="#9ca3af" stroke-width="0.8" fill="none" />
                <rect x="144" y="350" width="6"  height="50" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
                <rect x="144" y="350" width="6"  height="50" fill="url(#hatch-pattern)" />
                <path d="M150 385 L154 387 L150 389 M150 389 L154 391 L150 393 M150 393 L154 395 L150 397 M150 397 L154 399 L150 401" stroke="#cbd5e1" stroke-width="0.8" fill="none" />
                <!-- Callout -->
                <line x1="130" y1="380" x2="75" y2="380" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
                <circle cx="130" cy="380" r="1.2" fill="var(--accent-color)" />
                <text x="72" y="383" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">DRILL PIPE EXTENSION</text>
              </g>

              <!-- Central Axis Line (chain-dot) -->
              <line x1="140" y1="10" x2="140" y2="410" stroke="var(--accent-color)" stroke-width="1" stroke-dasharray="6,3,1,3" opacity="0.65" />
            </svg>
          </div>
          
          <div id="diagram-interactive-panel" style="margin-top:12px; padding:10px 12px; border-radius:6px; background:var(--bg-subtle); font-size:0.8rem; text-align:center; min-height:36px; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); transition: all 0.2s;">
            Hover over the diagram components for details
          </div>
        </div>

        <div class="content-card" style="margin-top:15px;">
          <h3 style="font-size:1rem; font-weight:700; margin:0 0 12px 0; color:var(--text-primary);">Landed Load Capacities</h3>
          <div class="table-responsive">
            <table class="data-table" style="width:100%;">
              <thead>
                <tr>
                  <th style="font-weight:700; color:var(--text-primary); text-align:left;">Hang-Off Location</th>
                  <th style="font-weight:700; color:var(--text-primary); text-align:right;">Maximum Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary); font-size:0.85rem;">Nominal Bore Protector</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">100,000 lb</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary); font-size:0.85rem;">Casing Hanger</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">1,200,000 lb</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary); font-size:0.85rem;">Wear Bushing</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">1,200,000 lb</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary); font-size:0.85rem;">Single Load Shoulder</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">1,200,000 lb</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="background-color:rgba(239,68,68,0.05); border-left:3px solid #ef4444; padding:10px 12px; border-radius:4px; margin-top:15px; font-size:0.8rem; line-height:1.45; color:var(--text-secondary);">
            <strong>⚠️ Disclaimer:</strong> The landed load capacities provided are for reference only. Actual allowable loads depend on the EDPHOT model, wellhead configuration, and OEM specifications. Always verify the maximum allowable landed load using the applicable OEM documentation before use.
          </div>
        </div>
      `;
    } else if (activeTab === 'running') {
      tabContent = `
        <div class="content-card">
          <h3 style="font-size:1rem; font-weight:700; margin:0 0 12px 0; color:var(--text-primary);">Running Procedure</h3>
          <ol class="styled-list" style="margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:0.85rem; line-height:1.45; color:var(--text-secondary); list-style-type: decimal; padding-left: 16px;">
            <li>Make up the stand containing the Hang-Off Tool and run the tool to approximately 20 ft above the lower marine riser package (LMRP).</li>
            <li>Activate and adjust the motion compensator to support only the weight of the drillstring above the Hang-Off Tool. Land the Hang-Off Tool on the Wear Bushing.</li>
            <li>Adjust the motion compensator to tension the running string slightly. Close a set of pipe rams on the neck of the Hang-Off Tool.</li>
            <li>Paint an alignment mark on the drill pipe and a corresponding mark at the rotary table to assist in counting turns for release.</li>
            <li>Apply tongs to the drill pipe running string and rotate the drill pipe to the right (left-hand thread) approximately eight turns.</li>
            <li>Once the threads disengage, the running tool will move clear. Verify the running tool is clear of the shear rams, close the shear rams, and retrieve the running tool to the surface.</li>
          </ol>
        </div>
      `;
    } else if (activeTab === 'retrieving') {
      tabContent = `
        <div class="content-card">
          <h3 style="font-size:1rem; font-weight:700; margin:0 0 10px 0; color:var(--text-primary);">Retrieving Procedure</h3>
          <div style="background-color:rgba(230,161,92,0.06); border-left:3px solid var(--accent-color); padding:10px 12px; border-radius:4px; margin-bottom:15px; font-size:0.82rem; line-height:1.4; color:var(--text-secondary);">
            <strong>Pre-requisite:</strong> This procedure assumes that the guidelines, the riser string, and all well control devices have been re-installed and properly connected.
          </div>
          <ol class="styled-list" style="margin:0; padding:0; display:flex; flex-direction:column; gap:10px; font-size:0.85rem; line-height:1.45; color:var(--text-secondary); list-style-type: decimal; padding-left: 16px;">
            <li>Pick up a stand of open-ended drill pipe. Lubricate the pin connection and run the drill pipe into the hole.</li>
            <li>When the retrieving string is approximately 20 ft above the LMRP, activate and adjust the motion compensator to support the weight of the retrieving string.</li>
            <li>Ensure proper well control procedures are followed and open the shear rams.</li>
            <li>Lower the retrieving string slowly. The re-entry taper on top of the upper body guides the drill pipe pin into the drill pipe box in the upper body of the Hang-Off Tool.</li>
            <li>Rotate the drill pipe to the right to make up the 4-1/2" API I.F. connection. Apply standard 4-1/2" API I.F. torque values.</li>
            <li>Ensure proper well control procedures are followed and open the pipe rams.</li>
            <li>Pick straight up and retrieve the Hang-Off Tool to the surface.</li>
          </ol>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="segmented-control" style="margin-bottom:15px;">
        <button class="segmented-control-btn ${activeTab === 'overview' ? 'active' : ''}" onclick="quickRefSubState.subseaTab = 'overview'; renderQuickRefScreen();">Overview & Spec</button>
        <button class="segmented-control-btn ${activeTab === 'running' ? 'active' : ''}" onclick="quickRefSubState.subseaTab = 'running'; renderQuickRefScreen();">Running</button>
        <button class="segmented-control-btn ${activeTab === 'retrieving' ? 'active' : ''}" onclick="quickRefSubState.subseaTab = 'retrieving'; renderQuickRefScreen();">Retrieving</button>
      </div>

      <div class="subsea-ref-content-wrapper" style="display:flex; flex-direction:column; gap:12px;">
        ${tabContent}
      </div>
    `;

    // Hook up interactive diagram hovers if the overview tab is active
    if (activeTab === 'overview') {
      const parts = container.querySelectorAll('.diagram-part');
      const infoPanel = document.getElementById('diagram-interactive-panel');
      if (parts && infoPanel) {
        parts.forEach(part => {
          part.style.cursor = 'pointer';
          part.addEventListener('mouseenter', () => {
            const partName = part.getAttribute('data-name');
            const titleEl = part.querySelector('title');
            const partDesc = titleEl ? titleEl.textContent : '';
            infoPanel.innerHTML = `<strong style="color:var(--accent-color);">${partName}:</strong> ${partDesc}`;
            infoPanel.style.background = 'rgba(230,161,92,0.1)';
            part.style.filter = 'brightness(1.15)';
          });
          part.addEventListener('mouseleave', () => {
            infoPanel.innerHTML = 'Hover over the diagram components for details';
            infoPanel.style.background = 'var(--bg-subtle)';
            part.style.filter = '';
          });
        });
      }
    }
  }
}

// ==========================================
// DRILLING GUIDE FEATURE
// ==========================================
const drillingGuideData = {
  operations: {
    name: "Drilling Operations",
    icon: "engineering",
    desc: "Operational guidelines, BHA components, and core procedures",
    accent: "operations",
    items: [
      { id: "stuck_pipe_guide", name: "Stuck Pipe Analysis" },
      { id: "bha_components", name: "BHA Components" },
      { id: "drill_string_components", name: "Drill String Components" }
    ]
  },
  bits: {
    name: "Drill Bits",
    icon: "construction",
    desc: "PDC & roller cone design, TFA nozzle selection, torque",
    accent: "bits",
    items: [
      { id: "pdc_bits", name: "PDC Bits" },
      { id: "roller_cone_bits", name: "Roller Cone Bits" },
      { id: "bit_nozzle_selection", name: "Bit Nozzle Selection" },
      { id: "bit_hydraulics", name: "Bit Hydraulics" },
      { id: "bit_makeup_torque", name: "Bit Make-up Torque" }
    ]
  },
  bha: {
    name: "BHA & Drillstring",
    icon: "settings",
    desc: "Stabilizers, reamers, jars, crossovers & shock subs",
    accent: "bha",
    items: [
      { id: "stabilizers", name: "Stabilizers" },
      { id: "reamers", name: "Reamers" },
      { id: "jars", name: "Jars" },
      { id: "shock_subs", name: "Shock Subs" },
      { id: "float_valves", name: "Float Valves" },
      { id: "crossovers", name: "Crossovers" }
    ]
  },
  wellcontrol: {
    name: "Well Control",
    icon: "security",
    desc: "Kick detection, shut-in methods & kill calculations",
    accent: "wellcontrol",
    items: [
      { id: "kick_indicators", name: "Kick Indicators" },
      { id: "shutin_procedure", name: "Shut-in Procedure" },
      { id: "drillers_method", name: "Driller's Method" },
      { id: "wait_weight_method", name: "Wait & Weight Method" },
      { id: "slow_circulation_rate", name: "Slow Circulation Rate (SCR)" }
    ]
  },
  casing: {
    name: "Casing & Cementing",
    icon: "foundation",
    desc: "Centralizers, float equipment, cementing steps & additives",
    accent: "casing",
    items: [
      { id: "casing_components", name: "Casing Components" },
      { id: "float_equipment", name: "Float Equipment" },
      { id: "centralizers", name: "Centralizers" },
      { id: "cementing_procedure", name: "Cementing Procedure" },
      { id: "cement_additives", name: "Cement Additives" }
    ]
  },
  fishing: {
    name: "Fishing Operations",
    icon: "build",
    desc: "Overshot, spears, junk baskets, magnets, washover pipe",
    accent: "fishing",
    items: [
      { id: "overshot", name: "Overshot" },
      { id: "spear", name: "Spear" },
      { id: "junk_basket", name: "Junk Basket" },
      { id: "fishing_magnets", name: "Fishing Magnets" },
      { id: "washover_pipe", name: "Washover Pipe" }
    ]
  },
  hydraulics: {
    name: "Hydraulics",
    icon: "water_drop",
    desc: "Hydrostatic pressures, annular velocities & fluid losses",
    accent: "hydraulics",
    items: [
      { id: "hydrostatic_pressure", name: "Hydrostatic Pressure" },
      { id: "annular_velocity", name: "Annular Velocity" },
      { id: "pressure_loss", name: "Pressure Loss" }
    ]
  },
  directional: {
    name: "Directional Drilling",
    icon: "explore",
    desc: "Surveys, doglegs, toolfaces and kick-offs",
    accent: "directional",
    items: [
      { id: "directional_surveying", name: "Directional Surveying" },
      { id: "dogleg_severity", name: "Dogleg Severity (DLS)" },
      { id: "kickoff_build_rate", name: "Kick-off & Build Rate" }
    ]
  },
  mud: {
    name: "Mud Engineering",
    icon: "science",
    desc: "Fluid density, viscosity, mud weight-up calculations",
    accent: "mud",
    items: [
      { id: "mud_weight", name: "Mud Weight / Density" },
      { id: "mud_viscosity", name: "Viscosity & Gel Strength" },
      { id: "mud_calculations", name: "Mud Calculations" }
    ]
  },
  completion: {
    name: "Well Completion",
    icon: "done_all",
    desc: "Packers, production tubing and wellheads",
    accent: "completion",
    items: [
      { id: "packers", name: "Packers" },
      { id: "production_tubing", name: "Production Tubing" },
      { id: "wellhead_xmas_tree", name: "Wellhead & Xmas Tree" }
    ]
  },
  quickref: {
    name: "Quick Reference",
    icon: "bookmark",
    desc: "Rig site rules of thumb and reference charts",
    accent: "quickref",
    items: [
      { id: "drill_bit_torque", name: "Drill Bit Make-Up Torque" },
      { id: "ring_gaskets_conn", name: "Ring Gaskets & Connections" },
      { id: "surface_wellhead", name: "Surface Wellhead Information" },
      { id: "subsea_equipment", name: "Subsea Equipment Reference" }
    ]
  }
};

// ==========================================
// GUIDE FAVORITES STORE (Single Source of Truth)
// ==========================================
const GuideFavoritesStore = {
  KEY: 'guideFavorites',
  _cache: null,

  getFavorites() {
    if (this._cache === null) {
      try {
        const stored = localStorage.getItem(this.KEY);
        this._cache = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(this._cache)) this._cache = [];
      } catch (e) {
        this._cache = [];
      }
    }
    return this._cache;
  },

  isFavorited(itemId) {
    if (!itemId) return false;
    return this.getFavorites().includes(itemId);
  },

  setFavorites(favs) {
    this._cache = Array.isArray(favs) ? [...favs] : [];
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this._cache));
    } catch (e) {}

    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      try {
        window.Capacitor.Plugins.Preferences.set({
          key: this.KEY,
          value: JSON.stringify(this._cache)
        }).catch(() => {});
      } catch (e) {}
    }
  },

  toggleFavorite(itemId) {
    if (!itemId) return false;
    const favs = [...this.getFavorites()];
    const idx = favs.indexOf(itemId);
    let isFav = false;
    if (idx > -1) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push(itemId);
      isFav = true;
    }
    this.setFavorites(favs);
    return isFav;
  },

  async init() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      try {
        const res = await window.Capacitor.Plugins.Preferences.get({ key: this.KEY });
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (Array.isArray(parsed)) {
            this._cache = parsed;
            localStorage.setItem(this.KEY, res.value);
          }
        }
      } catch (e) {}
    }
  }
};
window.GuideFavoritesStore = GuideFavoritesStore;
GuideFavoritesStore.init();

function renderGuideQuickAccessHTML() {
  const favs = GuideFavoritesStore.getFavorites();
  let quickAccessItems = [];
  if (favs.length > 0) {
    favs.forEach(itemId => {
      const match = getCategoryByItemId(itemId);
      if (match) {
        quickAccessItems.push({ itemId, name: match.item.name, catName: match.catName, icon: match.icon });
      }
    });
  }

  if (quickAccessItems.length > 0) {
    let itemsHtml = '';
    quickAccessItems.forEach(qa => {
      itemsHtml += `
        <div class="guide-quick-btn" onclick="handleGuideItemClick('${qa.itemId}', '${qa.catName}')">
          ${renderIcon(qa.icon, { size: '1.1rem', className: 'guide-quick-icon' })}
          <div class="guide-quick-info">
            <span class="guide-quick-name">${qa.name}</span>
            <span class="guide-quick-cat">${qa.catName}</span>
          </div>
          <button class="guide-fav-btn active" data-guide-id="${qa.itemId}" style="border: none; background: transparent; padding: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;" onclick="toggleGuideFavorite('${qa.itemId}', event)" aria-label="Favorite">
            ${renderIcon('star', { size: '1.15rem', style: 'color: #EAB308;' })}
          </button>
        </div>
      `;
    });
    return `
      <div class="guide-quick-access">
        <div class="guide-section-title">
          ${renderIcon('star', { size: '1.15rem', style: 'color:#EAB308;' })}
          <span style="font-weight: 900; color: var(--text-primary); letter-spacing: 0.1em;">QUICK ACCESS</span>
        </div>
        <div class="guide-quick-grid" style="grid-template-columns: repeat(2, 1fr);">
          ${itemsHtml}
        </div>
      </div>
    `;
  } else {
    return `
      <div class="guide-quick-access">
        <div class="guide-section-title" style="margin-bottom: 6px;">
          ${renderIcon('star', { size: '1.05rem', style: 'color:#EAB308;' })}
          <span style="font-weight: 900; color: var(--text-primary); letter-spacing: 0.1em;">QUICK ACCESS</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 0.75rem; line-height: 1;">
          ${renderIcon('star_border', { size: '0.95rem', style: 'color: #EAB308;' })}
          <span>Tap the star on any guide to add it here.</span>
        </div>
      </div>
    `;
  }
}

window.updateGuideQuickAccessUI = () => {
  const qaContainer = document.querySelector('#drilling-guide-container .guide-quick-access');
  if (qaContainer) {
    const temp = document.createElement('div');
    temp.innerHTML = renderGuideQuickAccessHTML();
    const newQa = temp.firstElementChild;
    if (newQa) {
      qaContainer.replaceWith(newQa);
    }
  }
};

function syncGuideFavoriteButtonsInDOM(itemId, isFav) {
  document.querySelectorAll(`.guide-fav-btn[data-guide-id="${itemId}"]`).forEach(btn => {
    if (isFav) {
      btn.classList.add('active');
      btn.innerHTML = renderIcon('star', { size: '1.15rem', style: 'color: #EAB308;' });
    } else {
      btn.classList.remove('active');
      btn.innerHTML = renderIcon('star_border', { size: '1.15rem' });
    }
  });

  if (state.selectedGuideId === itemId) {
    const detailBtn = document.getElementById('guide-detail-fav-btn');
    if (detailBtn) {
      if (isFav) {
        detailBtn.classList.add('active');
        detailBtn.innerHTML = renderIcon('star', { size: '26px' });
      } else {
        detailBtn.classList.remove('active');
        detailBtn.innerHTML = renderIcon('star_border', { size: '26px' });
      }
    }
  }

  window.updateQuickRefFavoriteIcon();
}

function getCategoryByItemId(itemId) {
  for (const catKey in drillingGuideData) {
    const cat = drillingGuideData[catKey];
    const found = cat.items.find(item => item.id === itemId);
    if (found) return { item: found, catName: cat.name, icon: cat.icon };
  }
  return null;
}

function renderDrillingGuideScreen() {
  const container = document.getElementById('drilling-guide-container');
  if (!container) return;

  const backBtn = document.querySelector('#screen-drilling-guide .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      handleAppBack();
    };
  }

  let html = '';

  // 2. Favorites / Quick Access Grid
  html += renderGuideQuickAccessHTML();

  // 3. Main Accordion Card Grid
  html += `<div style="display:flex; flex-direction:column; gap:12px; padding-bottom:30px;">`;
  
  for (const catKey in drillingGuideData) {
    const cat = drillingGuideData[catKey];
    html += `
      <div class="guide-category-card guide-cat-accent-${cat.accent}" id="guide-cat-${catKey}">
        <div class="guide-category-header" onclick="toggleGuideCategory('guide-cat-${catKey}')">
          <div class="guide-category-title-section">
            <div class="guide-category-icon-wrapper">
              ${renderIcon(cat.icon, { size: '1.25rem', className: 'guide-category-icon' })}
            </div>
            <div class="guide-category-info">
              <span class="guide-category-name">${cat.name}</span>
              <span class="guide-category-desc">${cat.desc}</span>
            </div>
          </div>
          ${renderIcon('chevron_right', { size: '1.2rem', className: 'guide-category-chevron' })}
        </div>
        <div class="guide-subcategory-list">
    `;
    
    cat.items.forEach(item => {
      const isFav = GuideFavoritesStore.isFavorited(item.id);
      html += `
        <div class="guide-item-row" onclick="handleGuideItemClick('${item.id}', '${cat.name}')">
          <div class="guide-item-row-left">
            <button class="guide-fav-btn ${isFav ? 'active' : ''}" data-guide-id="${item.id}" onclick="toggleGuideFavorite('${item.id}', event)" aria-label="Favorite">
              ${renderIcon(isFav ? 'star' : 'star_border', { size: '1.15rem', style: isFav ? 'color:#EAB308;' : '' })}
            </button>
            <span class="guide-item-title">${item.name}</span>
          </div>
          <div class="guide-item-right">
            <span class="guide-item-arrow">&rsaquo;</span>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
  
  if (state.selectedGuideId) {
    for (const catKey in drillingGuideData) {
      const items = drillingGuideData[catKey].items || [];
      if (items.some(item => item.id === state.selectedGuideId)) {
        setTimeout(() => {
          window.toggleGuideCategory('guide-cat-' + catKey);
        }, 0);
        break;
      }
    }
  }
}

window.filterGuideTopics = () => {
  const query = document.getElementById('guide-search-input').value.toLowerCase().trim();
  const container = document.getElementById('drilling-guide-container');
  const clearBtn = document.querySelector('.guide-search-clear-btn');
  
  // Find search wrapper sibling for list display
  let listEl = container.querySelector('.guide-subcategory-list-search');
  if (!listEl) {
    listEl = document.createElement('div');
    listEl.className = 'guide-subcategory-list-search';
    listEl.style.cssText = 'border:1px solid var(--border-subtle); border-radius:12px; overflow:hidden; background-color:var(--card-bg);';
  }

  // Remove existing lists/grids for search mode
  const quickAccess = container.querySelector('.guide-quick-access');
  const accordionCards = container.querySelectorAll('.guide-category-card');

  if (query.length > 0) {
    if (clearBtn) clearBtn.style.display = 'flex';
    if (quickAccess) quickAccess.style.display = 'none';
    accordionCards.forEach(c => c.style.display = 'none');

    let matches = [];
    for (const catKey in drillingGuideData) {
      const cat = drillingGuideData[catKey];
      cat.items.forEach(item => {
        const combinedText = [item.name, cat.name].filter(Boolean).join(' ');
        if (fuzzyMatch(combinedText, query)) {
          matches.push({ item, catName: cat.name, catKey });
        }
      });
    }

    if (matches.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-secondary); font-size:0.9rem;">
          No topics match your search.
        </div>
      `;
      if (!listEl.parentElement) container.appendChild(listEl);
      return;
    }

    let html = '';
    matches.forEach(({ item, catName }) => {
      const isFav = isGuideFavorited(item.id);
      html += `
        <div class="guide-item-row" onclick="handleGuideItemClick('${item.id}', '${catName}')">
          <div class="guide-item-row-left">
            <button class="guide-fav-btn ${isFav ? 'active' : ''}" data-guide-id="${item.id}" onclick="toggleGuideFavorite('${item.id}', event)" aria-label="Favorite">
              ${renderIcon(isFav ? 'star' : 'star_border', { size: '1.15rem', style: isFav ? 'color:#EAB308;' : '' })}
            </button>
            <span class="guide-item-title">${item.name}</span>
          </div>
          <div class="guide-item-right">
            <span style="font-size:0.7rem; color:var(--text-secondary); background-color:rgba(141,119,101,0.06); padding:2px 8px; border-radius:10px; margin-right:8px;">${catName}</span>
            <span class="guide-item-arrow">&rsaquo;</span>
          </div>
        </div>
      `;
    });
    listEl.innerHTML = html;
    if (!listEl.parentElement) container.appendChild(listEl);
  } else {
    if (clearBtn) clearBtn.style.display = 'none';
    if (listEl.parentElement) listEl.remove();
    if (quickAccess) quickAccess.style.display = 'block';
    accordionCards.forEach(c => c.style.display = 'block');
  }
};

window.clearGuideSearch = () => {
  const input = document.getElementById('guide-search-input');
  if (input) {
    input.value = '';
    filterGuideTopics();
  }
};

window.toggleGuideFavorite = (itemId, event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (!itemId) return;

  const isFav = GuideFavoritesStore.toggleFavorite(itemId);
  syncGuideFavoriteButtonsInDOM(itemId, isFav);
  updateGuideQuickAccessUI();

  const searchInput = document.getElementById('guide-search-input');
  if (searchInput && searchInput.value.trim().length > 0) {
    filterGuideTopics();
  }
};

window.isGuideFavorited = (itemId) => {
  return GuideFavoritesStore.isFavorited(itemId);
};

window.toggleGuideCategory = (cardId) => {
  const card = document.getElementById(cardId);
  if (!card) return;
  
  const isExpanded = card.classList.contains('expanded');
  
  // Collapse all others first for accordion effect
  document.querySelectorAll('.guide-category-card').forEach(otherCard => {
    otherCard.classList.remove('expanded');
    const otherList = otherCard.querySelector('.guide-subcategory-list');
    if (otherList) otherList.style.maxHeight = null;
  });
  
  if (!isExpanded) {
    card.classList.add('expanded');
    const list = card.querySelector('.guide-subcategory-list');
    if (list) {
      list.style.maxHeight = list.scrollHeight + 'px';
    }
  }
};

window.toggleWcCategory = (cardId) => {
  const card = document.getElementById(cardId);
  if (!card) return;
  
  const isExpanded = card.classList.contains('expanded');
  
  document.querySelectorAll('#well-control-container .guide-category-card').forEach(otherCard => {
    otherCard.classList.remove('expanded');
    const otherList = otherCard.querySelector('.guide-subcategory-list');
    if (otherList) otherList.style.maxHeight = null;
  });
  
  if (!isExpanded) {
    card.classList.add('expanded');
    const list = card.querySelector('.guide-subcategory-list');
    if (list) {
      list.style.maxHeight = list.scrollHeight + 'px';
    }
  }
};

window.switchGuideWellheadTab = (section) => {
  const container = document.getElementById('guide-wellhead-content');
  if (!container) return;

  ['A', 'B', 'C'].forEach(s => {
    const btn = document.getElementById(`guide-wh-btn-${s}`);
    if (btn) {
      if (s === section) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  const wellheadData = {
    A: [
      { no: 1, desc: 'MAIN W/H BODY 11" X 5M', qty: 1, remark: 'A-SEC INSTALLATION' },
      { no: 2, desc: '13-5/8" X 9-5/8" SECONDARY PRESSURE PLATE', qty: 2, remark: 'A-SEC INSTALLATION' },
      { no: 3, desc: '13-5/8" X 9-5/8" SECONDARY RUBBER PACKING', qty: 1, remark: 'A-SEC INSTALLATION' },
      { no: 4, desc: 'RX-54 RING GASKET SS 304', qty: 1, remark: 'A-SEC INSTALLATION' },
      { no: 5, desc: '1-7/8" X 13-3/8" TO 14-1/2" STUD WITH NUT', qty: 12, remark: 'A-SEC INSTALLATION' }
    ],
    B: [
      { no: 1, desc: 'MAIN W/H BODY 13-5/8" X 5M', qty: 1, remark: 'B-SEC INSTALLATION' },
      { no: 2, desc: '13-5/8" X 9-5/8" CASING SLIP', qty: 1, remark: 'A-SEC INSTALLATION' },
      { no: 3, desc: '21-1/4" X 13-3/8" SECONDARY PRESSURE PLATE', qty: 2, remark: 'B-SEC INSTALLATION' },
      { no: 4, desc: '21-1/4" X 13-3/8" SECONDARY RUBBER PACKING', qty: 1, remark: 'B-SEC INSTALLATION' },
      { no: 5, desc: '13-5/8" X 9-5/8" PRIMARY PRESSURE PLATE', qty: 2, remark: 'A-SEC INSTALLATION' },
      { no: 6, desc: '13-5/8" X 9-5/8" PRIMARY RUBBER PACKING', qty: 1, remark: 'A-SEC INSTALLATION' },
      { no: 7, desc: 'BX-160 RING GASKET SS 304', qty: 1, remark: 'A-SEC INSTALLATION' },
      { no: 8, desc: '1-5/8" X 12-1/2" TO 12-3/4" STUD WITH NUT', qty: 16, remark: 'A-SEC INSTALLATION' }
    ],
    C: [
      { no: 1, desc: 'MAIN W/H BODY 21-1/4" X 2M', qty: 1, remark: 'C-SEC ACCESSORY' },
      { no: 2, desc: '21-1/4" X 13-3/8" CASING SLIP', qty: 1, remark: 'B-SEC INSTALLATION' },
      { no: 3, desc: '21-1/4" X 13-3/8" PRIMARY RUBBER PACKING', qty: 1, remark: 'B-SEC INSTALLATION' },
      { no: 4, desc: '21-1/4" X 13-3/8" PRIMARY PRESSURE PLATE', qty: 2, remark: 'B-SEC INSTALLATION' },
      { no: 5, desc: 'RX-73 RING GASKET SS 304', qty: 1, remark: 'B-SEC INSTALLATION' },
      { no: 6, desc: '1-5/8" X 11-3/4" STUD WITH NUT', qty: 24, remark: 'B-SEC INSTALLATION' }
    ]
  };

  const summaries = {
    A: `<strong>Section A (Tubing / Production interface):</strong> Features a high-pressure 11" 5,000 psi body housing, configured with secondary packing elements and pressure plates for 9-5/8" casing protection. Utilizes the RX-54 ring gasket and 1-7/8" structural studs.`,
    B: `<strong>Section B (Intermediate casing section):</strong> Consists of a 13-5/8" 5,000 psi body housing supporting the 9-5/8" casing slip hanger and secondary seals for Section C's 13-3/8" interface. Fits the BX-160 ring gasket and 1-5/8" studs.`,
    C: `<strong>Section C (Surface casing section):</strong> Houses the main 21-1/4" 2,000 psi body housing that mounts on the conductor. Accommodates the 13-3/8" casing slip hanger, primary packaging seals, primary pressure plates, RX-73 gasket, and 24 structural studs (1-5/8" x 11-3/4").`
  };

  const rows = wellheadData[section].map(d => `
    <tr>
      <td style="font-family: monospace; font-size: 0.85rem;">${d.no}</td>
      <td style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${d.desc}</td>
      <td style="text-align: right; font-family: monospace; font-weight: 700; color: var(--accent-color);">${d.qty}</td>
      <td style="text-align: right; font-size: 0.8rem; color: var(--text-secondary);">${d.remark}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th style="font-weight:700; color:var(--text-primary); width: 10%;">S.N</th>
            <th style="font-weight:700; color:var(--text-primary); width: 50%;">Description</th>
            <th style="text-align: right; font-weight:700; color:var(--text-primary); width: 15%;">Qty</th>
            <th style="text-align: right; font-weight:700; color:var(--text-primary); width: 25%;">Remarks</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="margin-top:16px; font-size:0.85rem; line-height:1.5; color:var(--text-secondary); background:var(--bg-subtle, rgba(141,119,101,0.04)); padding:12px 14px; border-radius:12px; border:1px solid var(--border-subtle);">
      <span class="guide-section-title" style="margin:0 0 6px 0;">Section ${section} Overview</span>
      <p style="margin:0;">${summaries[section]}</p>
    </div>
  `;
};

window.handleGuideItemClick = (itemId, categoryName) => {
  state.selectedGuideId = itemId;
  state.selectedGuideCategory = categoryName;
  navigateTo('drilling-guide-detail');
};

window.renderDrillingGuideDetailScreen = () => {
  const itemId = state.selectedGuideId;
  const container = document.getElementById('drilling-guide-detail-container');
  if (!itemId || !container) return;

  // Header row: always "Drilling Guide" title, no subtitle, no star in header
  const titleEl = document.getElementById('guide-detail-title');
  if (titleEl) {
    titleEl.textContent = (window.I18n && window.I18n.translate) ? window.I18n.translate('Drilling Guide') : 'Drilling Guide';
  }
  const subtitleEl = document.getElementById('guide-detail-subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = '';
    subtitleEl.style.display = 'none';
  }

  const content = getGuideItemContent(itemId);
  const isFav = GuideFavoritesStore.isFavorited(itemId);
  const topicTitle = (window.I18n && window.I18n.translate) ? window.I18n.translate(content.title) : content.title;

  // ONE white rounded card (large radius ~20px, soft shadow) containing:
  // - Top row: Topic chip on the left, star button on the right
  // - Body content (intro paragraph in muted text, section label in uppercase, bullet list/tables)
  container.innerHTML = `
    <div class="guide-detail-card">
      <div class="guide-detail-top-row">
        <div class="guide-detail-topic-chip">
          ${topicTitle}
        </div>
        <button class="guide-detail-fav-btn ${isFav ? 'active' : ''}" id="guide-detail-fav-btn" onclick="toggleDetailGuideFavorite(event)" aria-label="Favorite">
          ${renderIcon(isFav ? 'star' : 'star_border', { size: '26px' })}
        </button>
      </div>
      <div class="guide-detail-body">
        ${content.bodyHTML}
      </div>
    </div>
  `;

  // Post-render init for interactive features
  if (itemId === 'surface_wellhead') {
    window.switchGuideWellheadTab('A');
  } else if (itemId === 'subsea_equipment') {
    const parts = container.querySelectorAll('.diagram-part');
    const panel = document.getElementById('diagram-interactive-panel');
    if (panel) {
      parts.forEach(part => {
        const titleEl = part.querySelector('title');
        const desc = titleEl ? titleEl.textContent : part.getAttribute('data-name');
        const show = () => { panel.innerHTML = `<strong style="color:var(--text-primary);">${part.getAttribute('data-name')}:</strong> ${desc}`; };
        part.addEventListener('mouseenter', show);
        part.addEventListener('click', show);
      });
    }
  } else if (itemId === 'bit_nozzle_selection') {
    renderGuideNozzleInputs();
  } else if (itemId === 'bit_hydraulics') {
    calculateGuideHydraulics();
  } else if (itemId === 'bit_dull_grading') {
    calculateGuideDullGrade();
  } else if (itemId === 'wait_weight_method') {
    calculateGuideKillParameters();
  } else if (itemId === 'bit_makeup_torque') {
    selectGuideMakeupTorque();
  } else if (itemId === 'hydrostatic_pressure') {
    calculateGuideHydrostatic();
  } else if (itemId === 'annular_velocity') {
    calculateGuideAnnularVelocity();
  } else if (itemId === 'dogleg_severity') {
    calculateGuideDLS();
  } else if (itemId === 'mud_calculations') {
    calculateGuideMudWeightUp();
  }
};

window.toggleDetailGuideFavorite = (event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const itemId = state.selectedGuideId;
  if (!itemId) return;

  const isFav = GuideFavoritesStore.toggleFavorite(itemId);
  syncGuideFavoriteButtonsInDOM(itemId, isFav);
  updateGuideQuickAccessUI();
};

// Nozzle Selection calculations
window.renderGuideNozzleInputs = () => {
  const count = parseInt(document.getElementById('tfa-count').value) || 3;
  const container = document.getElementById('nozzle-inputs-container');
  if (!container) return;
  
  let html = '';
  for (let i = 1; i <= count; i++) {
    html += `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Nozzle #${i} (/32")</span>
        <input type="number" class="guide-calc-input nozzle-size-input" style="width:90px;" value="12" min="6" max="32" oninput="calculateGuideTFA()">
      </div>
    `;
  }
  container.innerHTML = html;
  calculateGuideTFA();
};

window.calculateGuideTFA = () => {
  const inputs = document.querySelectorAll('.nozzle-size-input');
  let tfa = 0;
  inputs.forEach(input => {
    const size = parseFloat(String(input.value).replace(',', '.')) || 0;
    if (size > 0) {
      tfa += (size / 32) * (size / 32) * (Math.PI / 4);
    }
  });
  const resEl = document.getElementById('tfa-result');
  if (resEl) resEl.textContent = tfa.toFixed(4);
};

// Hydraulics calculations
window.calculateGuideHydraulics = () => {
  const parseV = (id) => { const el = document.getElementById(id); return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0; };
  const flow = parseV('hyd-flow');
  const mw = parseV('hyd-mw');
  const tfa = parseFloat(document.getElementById('hyd-tfa').value) || 0;
  const size = parseFloat(document.getElementById('hyd-size').value) || 0;

  const vnEl = document.getElementById('hyd-val-vn');
  const pbEl = document.getElementById('hyd-val-pb');
  const hhpEl = document.getElementById('hyd-val-hhp');
  const hsiEl = document.getElementById('hyd-val-hsi');
  const ifEl = document.getElementById('hyd-val-if');

  if (flow > 0 && tfa > 0) {
    const vn = (0.32086 * flow) / tfa;
    const pb = (flow * flow * mw) / (10858 * tfa * tfa);
    const hhp = (pb * flow) / 1714;
    const area = (Math.PI * size * size) / 4;
    const hsi = area > 0 ? hhp / area : 0;
    const impactForce = (flow * mw * vn) / 1930;

    if (vnEl) vnEl.textContent = vn.toFixed(0);
    if (pbEl) pbEl.textContent = pb.toFixed(0);
    if (hhpEl) hhpEl.textContent = hhp.toFixed(0);
    if (hsiEl) hsiEl.textContent = hsi.toFixed(2);
    if (ifEl) ifEl.textContent = impactForce.toFixed(0);
  }
};

// Dull Grading calculations
window.calculateGuideDullGrade = () => {
  const i = document.getElementById('dull-i').value;
  const o = document.getElementById('dull-o').value;
  const dl = document.getElementById('dull-dl').value;
  const l = document.getElementById('dull-l').value;
  const b = document.getElementById('dull-b').value;
  const g = document.getElementById('dull-g').value;
  const er = document.getElementById('dull-er').value;
  const rp = document.getElementById('dull-rp').value;

  if (document.getElementById('dg-val-i')) {
    document.getElementById('dg-val-i').textContent = i;
    document.getElementById('dg-val-o').textContent = o;
    document.getElementById('dg-val-dl').textContent = dl;
    document.getElementById('dg-val-l').textContent = l;
    document.getElementById('dg-val-b').textContent = b;
    document.getElementById('dg-val-g').textContent = g;
    document.getElementById('dg-val-er').textContent = er;
    document.getElementById('dg-val-rp').textContent = rp;
  }

  const explBox = document.getElementById('dg-explanation');
  if (explBox) {
    let expl = `<strong>Dull Grade: ${i}-${o}-${dl}-${l}-${b}-${g}-${er}-${rp}</strong><br>`;
    expl += `• Inner wear: ${i}/8, Outer wear: ${o}/8.<br>`;
    expl += `• Main Wear: <strong>${dl}</strong> at <strong>${l}</strong>.<br>`;
    expl += `• Bearings: <strong>${b}</strong>, Gauge: <strong>${g === 'I' ? 'In Gauge' : g + '/16" Under'}</strong>.<br>`;
    expl += `• Reason Pulled: <strong>${rp}</strong>.`;
    explBox.innerHTML = expl;
  }
};

// Kill parameters calculations
window.calculateGuideKillParameters = () => {
  const omw = parseFloat(document.getElementById('ww-omw').value) || 0;
  const sidpp = parseFloat(document.getElementById('ww-sidpp').value) || 0;
  const scrp = parseFloat(document.getElementById('ww-scrp').value) || 0;
  const tvd = parseFloat(document.getElementById('ww-tvd').value) || 0;
  const stksEl = document.getElementById('ww-stks');
  const stks = stksEl ? (parseFloat(String(stksEl.value).replace(',', '.')) || 1000) : 1000;

  const kmwEl = document.getElementById('ww-val-kmw');
  const icpEl = document.getElementById('ww-val-icp');
  const fcpEl = document.getElementById('ww-val-fcp');
  const scheduleRowsEl = document.getElementById('ww-step-schedule-rows');

  if (omw > 0 && tvd > 0) {
    const kmw = omw + (sidpp / (0.052 * tvd));
    const icp = sidpp + scrp;
    const fcp = scrp * (kmw / omw);

    if (kmwEl) kmwEl.textContent = kmw.toFixed(2);
    if (icpEl) icpEl.textContent = icp.toFixed(0);
    if (fcpEl) fcpEl.textContent = fcp.toFixed(0);

    if (scheduleRowsEl) {
      let scheduleHTML = '';
      const stepsCount = 5;
      for (let i = 0; i <= stepsCount; i++) {
        const fraction = i / stepsCount;
        const currentStks = Math.round(stks * fraction);
        const currentPress = Math.round(icp - (icp - fcp) * fraction);
        const label = i === 0 ? `0 stks (Start)` : i === stepsCount ? `${currentStks} stks (At Bit)` : `${currentStks} stks`;
        scheduleHTML += `
          <div style="display: grid; grid-template-columns: 1fr 1fr; padding: 5px 10px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05)); color: var(--text-primary); align-items: center;">
            <span style="font-weight: 500;">${label}</span>
            <span style="text-align: right; font-weight: 700; color: var(--accent-color, #f39c12);">${currentPress} psi</span>
          </div>
        `;
      }
      scheduleRowsEl.innerHTML = scheduleHTML;
    }
  }
};

window.toggleStepDownSchedule = () => {
  const container = document.getElementById('ww-step-schedule-container');
  const label = document.getElementById('ww-step-schedule-toggle-lbl');
  if (!container) return;
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
    if (label) label.textContent = '▼ Hide Step Down Schedule';
  } else {
    container.style.display = 'none';
    if (label) label.textContent = '▶ View Step Down Schedule';
  }
};

// Makeup torque selector
window.selectGuideMakeupTorque = () => {
  const val = document.getElementById('mut-conn').value;
  const ftlbEl = document.getElementById('mut-val-ftlb');
  const nmEl = document.getElementById('mut-val-nm');
  
  if (!ftlbEl || !nmEl) return;
  
  let ftlbs = "";
  let nms = "";
  
  if (val === "2.375") {
    ftlbs = "3,000 - 3,400";
    nms = "4,070 - 4,610";
  } else if (val === "2.875") {
    ftlbs = "6,000 - 6,800";
    nms = "8,130 - 9,220";
  } else if (val === "3.5") {
    ftlbs = "7,000 - 9,000";
    nms = "9,490 - 12,200";
  } else if (val === "4.5") {
    ftlbs = "28,000 - 32,000";
    nms = "37,960 - 43,380";
  } else if (val === "6.625") {
    ftlbs = "55,000 - 65,000";
    nms = "74,570 - 88,130";
  } else if (val === "7.625") {
    ftlbs = "75,000 - 85,000";
    nms = "101,690 - 115,240";
  } else if (val === "8.625") {
    ftlbs = "90,000 - 110,000";
    nms = "122,020 - 149,140";
  }
  
  ftlbEl.textContent = ftlbs;
  nmEl.textContent = nms;
};

// Hydrostatic Pressure Calculator Actions
window.calculateGuideHydrostatic = () => {
  const parseV = (id) => { const el = document.getElementById(id); return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0; };
  const mw = parseV('hp-mw');
  const tvd = parseV('hp-tvd');
  const resEl = document.getElementById('hp-result');
  if (resEl) {
    if (mw > 0 && tvd > 0) {
      const hp = mw * 0.052 * tvd;
      resEl.textContent = Math.round(hp).toLocaleString();
    } else {
      resEl.textContent = "0";
    }
  }
};

// Annular Velocity Calculator Actions
window.calculateGuideAnnularVelocity = () => {
  const parseV = (id) => { const el = document.getElementById(id); return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0; };
  const flow = parseV('av-flow');
  const hole = parseV('av-hole');
  const pipe = parseV('av-pipe');
  const resEl = document.getElementById('av-result');
  if (resEl) {
    if (flow > 0 && hole > pipe) {
      const av = (24.51 * flow) / (hole * hole - pipe * pipe);
      resEl.textContent = Math.round(av).toLocaleString();
    } else {
      resEl.textContent = "0";
    }
  }
};

// Dogleg Severity Calculator Actions
window.calculateGuideDLS = () => {
  const parseV = (id, fb=0) => { const el = document.getElementById(id); return el && el.value !== '' ? (parseFloat(String(el.value).replace(',', '.')) || 0) : fb; };
  const md = parseV('dls-md', 100);
  const inc1 = parseV('dls-inc1', 0);
  const azi1 = parseV('dls-azi1', 0);
  const inc2 = parseV('dls-inc2', 0);
  const azi2 = parseV('dls-azi2', 0);
  const resEl = document.getElementById('dls-result');
  
  if (resEl) {
    if (md > 0) {
      const rInc1 = inc1 * Math.PI / 180;
      const rInc2 = inc2 * Math.PI / 180;
      const rAziDiff = (azi2 - azi1) * Math.PI / 180;
      
      let cosTheta = Math.cos(rInc1) * Math.cos(rInc2) + Math.sin(rInc1) * Math.sin(rInc2) * Math.cos(rAziDiff);
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
      
      const theta = Math.acos(cosTheta);
      const thetaDeg = theta * 180 / Math.PI;
      
      const dls = (thetaDeg / md) * 100;
      resEl.textContent = dls.toFixed(2);
    } else {
      resEl.textContent = "0.00";
    }
  }
};

// Mud Weight Up Calculator Actions
window.calculateGuideMudWeightUp = () => {
  const parseV = (id) => { const el = document.getElementById(id); return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0; };
  const vol = parseV('mudup-vol');
  const initialMW = parseV('mudup-imw');
  const targetMW = parseV('mudup-tmw');
  const resEl = document.getElementById('mudup-result');
  if (resEl) {
    if (vol > 0 && targetMW > initialMW && targetMW < 35.8) {
      const sacks = (vol * 14.7 * (targetMW - initialMW)) / (35.8 - targetMW);
      resEl.textContent = Math.round(sacks).toLocaleString();
    } else {
      resEl.textContent = "0";
    }
  }
};

function getEdphotSvgMarkup() {
  return `
    <svg class="edphot-svg" width="320" height="420" viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;">
      <defs>
        <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--text-secondary)" stroke-width="0.35" opacity="0.12" />
        </pattern>
        <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#374151" />
          <stop offset="25%" stop-color="#6b7280" />
          <stop offset="50%" stop-color="#f9fafb" />
          <stop offset="75%" stop-color="#9ca3af" />
          <stop offset="100%" stop-color="#1f2937" />
        </linearGradient>
        <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#78350f" />
          <stop offset="25%" stop-color="#b45309" />
          <stop offset="50%" stop-color="#fef3c7" />
          <stop offset="75%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#78350f" />
        </linearGradient>
        <linearGradient id="pipe-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="25%" stop-color="#4b5563" />
          <stop offset="50%" stop-color="#e5e7eb" />
          <stop offset="75%" stop-color="#6b7280" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <pattern id="hatch-pattern" width="5" height="5" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(255,255,255,0.22)" stroke-width="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="420" fill="url(#blueprint-grid)" rx="8" />
      <rect x="2" y="2" width="316" height="416" fill="none" stroke="var(--text-secondary)" stroke-width="0.5" opacity="0.2" rx="6" />
      <rect x="140" y="15" width="16" height="385" fill="#0f172a" opacity="0.95" />

      <!-- RUNNING TOOL -->
      <g class="diagram-part" data-name="RUNNING TOOL" style="cursor:pointer;">
        <title>RUNNING TOOL: Heavy-duty assembly used to lower, land, and release the Hang-Off Tool. Released by right-hand rotation.</title>
        <path d="M125 15 L140 15 L140 35 L125 35 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <path d="M146 15 L155 15 L155 35 L146 35 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <path d="M146 15 L155 15 L155 35 L146 35 Z" fill="url(#hatch-pattern)" />
        <path d="M146 18 L142 20 L146 22 M146 22 L142 24 L146 26 M146 26 L142 28 L146 30 M146 30 L142 32 L146 34" stroke="#9ca3af" stroke-width="0.75" fill="none" />
        <rect x="130" y="35" width="10" height="25" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <rect x="144" y="35" width="6" height="25" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <rect x="144" y="35" width="6" height="25" fill="url(#hatch-pattern)" />
        <rect x="132" y="85" width="8" height="50" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <rect x="143" y="85" width="5" height="50" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <rect x="143" y="85" width="5" height="50" fill="url(#hatch-pattern)" />
        <line x1="155" y1="25" x2="228" y2="25" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="155" cy="25" r="1.2" fill="var(--accent-color)" />
        <text x="232" y="28" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">RUNNING TOOL</text>
      </g>

      <!-- RE-ENTRY TAPER -->
      <g class="diagram-part" data-name="RE-ENTRY TAPER" style="cursor:pointer;">
        <title>RE-ENTRY TAPER: Conical guide profile that centres the retrieving string for re-entry and alignment during retrieval operations.</title>
        <path d="M100 60 L140 60 L140 85 L110 85 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <path d="M144 60 L180 60 L170 85 L144 85 Z" fill="url(#metal-grad)" stroke="#1e293b" stroke-width="0.75" />
        <path d="M144 60 L180 60 L170 85 L144 85 Z" fill="url(#hatch-pattern)" />
        <line x1="165" y1="70" x2="228" y2="70" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="165" cy="70" r="1.2" fill="var(--accent-color)" />
        <text x="232" y="73" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">RE-ENTRY TAPER</text>
      </g>

      <!-- UPPER BODY -->
      <g class="diagram-part" data-name="UPPER BODY" style="cursor:pointer;">
        <title>UPPER BODY: Main upper housing of the Hang-Off Tool. Contains the L.H. square-thread bore and 4-1/2&quot; API I.F. drill pipe box connection.</title>
        <path d="M95 85 L140 85 L140 145 L115 145 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
        <path d="M144 85 L185 85 L185 105 L165 145 L148 145 L148 135 L154 135 L154 105 L144 105 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
        <path d="M144 85 L185 85 L185 105 L165 145 L148 145 L148 135 L154 135 L154 105 L144 105 Z" fill="url(#hatch-pattern)" />
        <line x1="170" y1="95" x2="228" y2="95" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="170" cy="95" r="1.2" fill="var(--accent-color)" />
        <text x="232" y="98" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">UPPER BODY</text>
      </g>

      <!-- O-RING -->
      <g class="diagram-part" data-name="O-RING" style="cursor:pointer;">
        <title>O-RING: Elastomer seal on the running stem that provides a pressure-tight barrier between the stem and upper body bore.</title>
        <ellipse cx="136" cy="95" rx="4" ry="2" fill="#f87171" stroke="#dc2626" stroke-width="0.6" />
        <circle cx="143.5" cy="95" r="2.2" fill="#f87171" stroke="#dc2626" stroke-width="0.6" />
        <line x1="136" y1="95" x2="75" y2="95" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="136" cy="95" r="1.2" fill="var(--accent-color)" />
        <text x="72" y="98" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">O-RING</text>
      </g>

      <!-- SQUARE THREADS -->
      <g class="diagram-part" data-name="SQUARE THREADS" style="cursor:pointer;">
        <title>SQUARE THREADS: Left-Hand square-profile threads on the running stem. Clockwise rotation disengages the running tool from the hang-off tool.</title>
        <rect x="140" y="105" width="4" height="2" fill="url(#metal-grad)" stroke="#0f172a" stroke-width="0.4" />
        <rect x="140" y="109" width="4" height="2" fill="url(#metal-grad)" stroke="#0f172a" stroke-width="0.4" />
        <rect x="140" y="113" width="4" height="2" fill="url(#metal-grad)" stroke="#0f172a" stroke-width="0.4" />
        <rect x="140" y="117" width="4" height="2" fill="url(#metal-grad)" stroke="#0f172a" stroke-width="0.4" />
        <rect x="140" y="121" width="4" height="2" fill="url(#metal-grad)" stroke="#0f172a" stroke-width="0.4" />
        <rect x="140" y="125" width="4" height="2" fill="url(#metal-grad)" stroke="#0f172a" stroke-width="0.4" />
        <rect x="144" y="107" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
        <rect x="144" y="111" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
        <rect x="144" y="115" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
        <rect x="144" y="119" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
        <rect x="144" y="123" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
        <rect x="144" y="127" width="4" height="2" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.4" />
        <line x1="140" y1="115" x2="75" y2="115" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="140" cy="115" r="1.2" fill="var(--accent-color)" />
        <text x="72" y="118" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">SQUARE THREADS</text>
      </g>

      <!-- DRILL PIPE BOX -->
      <g class="diagram-part" data-name="DRILL PIPE BOX" style="cursor:pointer;">
        <title>DRILL PIPE BOX: 4-1/2&quot; API I.F. box connection machined into the upper body. Used to re-engage and retrieve the hang-off tool.</title>
        <path d="M148 138 L143 140 L148 142 M148 142 L143 144 L148 146 M148 146 L143 148 L148 150 M148 150 L143 152 L148 154 M148 154 L143 156 L148 158" stroke="#cbd5e1" stroke-width="0.8" fill="none" />
        <line x1="143" y1="148" x2="75" y2="148" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="143" cy="148" r="1.2" fill="var(--accent-color)" />
        <text x="72" y="151" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">DRILL PIPE BOX</text>
      </g>

      <!-- DRILL PIPE SECTION -->
      <g class="diagram-part" data-name="DRILL PIPE SECTION" style="cursor:pointer;">
        <title>DRILL PIPE SECTION: 5&quot; OD drill pipe body running through the BOP stack. Length is tailored so the tool seats precisely opposite the lower pipe rams.</title>
        <rect x="128" y="145" width="12" height="150" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
        <rect x="126" y="145" width="14" height="15" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
        <rect x="126" y="280" width="14" height="15" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
        <rect x="144" y="145" width="8" height="150" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
        <rect x="144" y="145" width="8" height="150" fill="url(#hatch-pattern)" />
        <line x1="138" y1="210" x2="228" y2="210" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="138" cy="210" r="1.2" fill="var(--accent-color)" />
        <text x="232" y="213" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">DRILL PIPE SECTION</text>
      </g>

      <!-- LOWER BODY -->
      <g class="diagram-part" data-name="LOWER BODY" style="cursor:pointer;">
        <title>LOWER BODY: Tapered landing shoulder that seats inside the Wear Bushing bore to support the full weight of the suspended drill string.</title>
        <path d="M110 295 L140 295 L140 350 L120 350 L100 320 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
        <path d="M148 290 L170 290 L180 320 L160 350 L144 350 L144 335 L148 335 Z" fill="url(#bronze-grad)" stroke="#78350f" stroke-width="0.75" />
        <path d="M148 290 L170 290 L180 320 L160 350 L144 350 L144 335 L148 335 Z" fill="url(#hatch-pattern)" />
        <path d="M148 303 L143 305 L148 307 M148 307 L143 309 L148 311 M148 311 L143 313 L148 315 M148 315 L143 317 L148 319 M148 319 L143 321 L148 323 M148 323 L143 325 L148 327" stroke="#cbd5e1" stroke-width="0.8" fill="none" />
        <line x1="120" y1="310" x2="75" y2="310" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="120" cy="310" r="1.2" fill="var(--accent-color)" />
        <text x="72" y="313" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">LOWER BODY</text>
      </g>

      <!-- FLOW BY -->
      <g class="diagram-part" data-name="FLOW BY" style="cursor:pointer;">
        <title>FLOW BY: Elongated bypass slots in the landing shoulder that allow mud returns and pressure equalisation during running and landing.</title>
        <ellipse cx="120" cy="325" rx="3" ry="12" fill="#0f172a" />
        <ellipse cx="130" cy="325" rx="3" ry="12" fill="#0f172a" />
        <line x1="116" y1="325" x2="75" y2="325" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="116" cy="325" r="1.2" fill="var(--accent-color)" />
        <text x="72" y="328" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">FLOW BY</text>
      </g>

      <!-- DRILL PIPE EXTENSION -->
      <g class="diagram-part" data-name="DRILL PIPE EXTENSION" style="cursor:pointer;">
        <title>DRILL PIPE EXTENSION: Lower pin connection that makes up directly to the uppermost joint of the suspended string being hung off.</title>
        <rect x="130" y="350" width="10" height="50" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
        <path d="M130 385 L126 387 L130 389 M130 389 L126 391 L130 393 M130 393 L126 395 L130 397 M130 397 L126 399 L130 401" stroke="#9ca3af" stroke-width="0.8" fill="none" />
        <rect x="144" y="350" width="6" height="50" fill="url(#pipe-grad)" stroke="#0f172a" stroke-width="0.75" />
        <rect x="144" y="350" width="6" height="50" fill="url(#hatch-pattern)" />
        <path d="M150 385 L154 387 L150 389 M150 389 L154 391 L150 393 M150 393 L154 395 L150 397 M150 397 L154 399 L150 401" stroke="#cbd5e1" stroke-width="0.8" fill="none" />
        <line x1="130" y1="380" x2="75" y2="380" stroke="var(--text-secondary)" stroke-width="0.65" opacity="0.8" />
        <circle cx="130" cy="380" r="1.2" fill="var(--accent-color)" />
        <text x="72" y="383" text-anchor="end" fill="var(--text-primary)" font-family="Outfit,sans-serif" font-size="8.5" font-weight="600">DRILL PIPE EXTENSION</text>
      </g>

      <!-- Central Axis Line (chain-dot) -->
      <line x1="140" y1="10" x2="140" y2="410" stroke="var(--accent-color)" stroke-width="1" stroke-dasharray="6,3,1,3" opacity="0.65" />
    </svg>
  `;
}

// Database content for items
function getGuideItemContent(itemId) {
  switch (itemId) {
    // ─── HYDRAULICS CATEGORY ───
    case "hydrostatic_pressure":
      return {
        title: "Hydrostatic Pressure",
        bodyHTML: `
          <p class="guide-text-block">Pressure exerted by a static column of fluid due to the force of gravity. Essential for maintaining primary well control.</p>
          <span class="guide-section-title">Hydrostatic Formula</span>
          <div style="background-color:rgba(141,119,101,0.04); padding:10px 14px; border-radius:8px; font-family:monospace; font-size:0.85rem; margin-bottom:15px; color:var(--text-primary); border: 1px solid var(--border-subtle);">
            HP = MW (ppg) × 0.052 × TVD (ft)
          </div>
          <span class="guide-section-title">Interactive HP Calculator</span>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Mud Weight (ppg)</label>
                <input type="number" class="guide-calc-input" id="hp-mw" value="10.0" step="0.1" oninput="calculateGuideHydrostatic()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">True Vertical Depth (ft)</label>
                <input type="number" class="guide-calc-input" id="hp-tvd" value="8000" step="100" oninput="calculateGuideHydrostatic()">
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Hydrostatic Pressure</span>
                <span class="guide-calc-result-val"><span id="hp-result">4160</span> psi</span>
              </div>
            </div>
          </div>
        `
      };
    case "annular_velocity":
      return {
        title: "Annular Velocity",
        bodyHTML: `
          <p class="guide-text-block">Speed of fluid moving up the annular space between the drill pipe/collar outer wall and the wellbore/casing inner wall. Critical for hole cleaning.</p>
          <span class="guide-section-title">Annular Velocity Formula</span>
          <div style="background-color:rgba(141,119,101,0.04); padding:10px 14px; border-radius:8px; font-family:monospace; font-size:0.85rem; margin-bottom:15px; color:var(--text-primary); border: 1px solid var(--border-subtle);">
            AV = (24.51 × Q) / (Dh² - Dp²)
          </div>
          <span class="guide-section-title">Interactive AV Calculator</span>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Flow Rate (gpm)</label>
                <input type="number" class="guide-calc-input" id="av-flow" value="400" step="10" oninput="calculateGuideAnnularVelocity()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">Hole / Casing ID (in)</label>
                <input type="number" class="guide-calc-input" id="av-hole" value="12.25" step="0.125" oninput="calculateGuideAnnularVelocity()">
              </div>
              <div class="guide-calc-group" style="grid-column: span 2;">
                <label class="guide-calc-label">Pipe / Collar OD (in)</label>
                <input type="number" class="guide-calc-input" id="av-pipe" value="5.0" step="0.1" oninput="calculateGuideAnnularVelocity()">
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Annular Velocity</span>
                <span class="guide-calc-result-val"><span id="av-result">78</span> ft/min</span>
              </div>
            </div>
          </div>
        `
      };
    case "pressure_loss":
      return {
        title: "Pressure Loss / Hydraulics",
        bodyHTML: `
          <p class="guide-text-block">Friction pressure losses encountered as drilling fluids travel through surface manifolds, drill string bore, drill bit nozzles, and annular spaces.</p>
          <span class="guide-section-title">Hydraulics Distribution</span>
          <ul class="guide-bullet-list">
            <li><strong>Surface Equipment:</strong> Standpipe, hose, swivel, kelly (usually 50-150 psi).</li>
            <li><strong>Drill String Bore:</strong> High flow velocity inside drill pipes and drill collars.</li>
            <li><strong>Bit Nozzles:</strong> Typically designed to consume 50% to 65% of total pump pressure for maximum cleaning impact.</li>
            <li><strong>Annulus Friction:</strong> Creates additional pressure on formation (ECD).</li>
          </ul>
        `
      };

    // ─── DIRECTIONAL DRILLING CATEGORY ───
    case "directional_surveying":
      return {
        title: "Directional Surveying",
        bodyHTML: `
          <p class="guide-text-block">Measuring inclination and azimuth along the wellbore to determine and map the 3D trajectory of the well.</p>
          <span class="guide-section-title">Key Parameters</span>
          <ul class="guide-bullet-list">
            <li><strong>Measured Depth (MD):</strong> Actual length of the hole from surface.</li>
            <li><strong>Inclination:</strong> Angle of deviation from vertical (0° = vertical).</li>
            <li><strong>Azimuth:</strong> Direction in horizontal plane relative to True/Magnetic North.</li>
            <li><strong>True Vertical Depth (TVD):</strong> Vertical distance from surface plane.</li>
          </ul>
        `
      };
    case "dogleg_severity":
      return {
        title: "Dogleg Severity (DLS)",
        bodyHTML: `
          <p class="guide-text-block">The rate of change in wellbore trajectory direction (combining inclination and azimuth) over a set interval length, expressed in degrees per 100 ft.</p>
          <span class="guide-section-title">Interactive DLS Calculator</span>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Survey MD Interval (ft)</label>
                <input type="number" class="guide-calc-input" id="dls-md" value="100" step="10" oninput="calculateGuideDLS()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">Survey #1: Inc / Azi (°)</label>
                <div style="display:flex; gap:6px;">
                  <input type="number" class="guide-calc-input" id="dls-inc1" value="2.0" step="0.1" oninput="calculateGuideDLS()" style="padding: 8px 6px;">
                  <input type="number" class="guide-calc-input" id="dls-azi1" value="45.0" step="1" oninput="calculateGuideDLS()" style="padding: 8px 6px;">
                </div>
              </div>
              <div class="guide-calc-group" style="grid-column: span 2;">
                <label class="guide-calc-label">Survey #2: Inc / Azi (°)</label>
                <div style="display:flex; gap:6px;">
                  <input type="number" class="guide-calc-input" id="dls-inc2" value="3.5" step="0.1" oninput="calculateGuideDLS()" style="padding: 8px 6px;">
                  <input type="number" class="guide-calc-input" id="dls-azi2" value="48.0" step="1" oninput="calculateGuideDLS()" style="padding: 8px 6px;">
                </div>
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Dogleg Severity (DLS)</span>
                <span class="guide-calc-result-val"><span id="dls-result">1.51</span> °/100 ft</span>
              </div>
            </div>
          </div>
        `
      };
    case "kickoff_build_rate":
      return {
        title: "Kick-off & Build Rate",
        bodyHTML: `
          <p class="guide-text-block">Guidelines for initiating directional deviation (kickoff point KOP) and managing building/dropping section curvatures.</p>
          <span class="guide-section-title">Key Operational Stages</span>
          <ul class="guide-bullet-list">
            <li><strong>KOP selection:</strong> Set in competent formations below unstable shales.</li>
            <li><strong>Toolface Orientation:</strong> Orienting the bent-sub motor to kick-off.</li>
            <li><strong>Build-up Rate (BUR):</strong> Speed of inclination build, typically 2° to 6° per 100 ft.</li>
          </ul>
        `
      };

    // ─── MUD ENGINEERING CATEGORY ───
    case "mud_weight":
      return {
        title: "Mud Weight / Density",
        bodyHTML: `
          <p class="guide-text-block">Density controls hydrostatic pressures in the well. Insufficient weight causes kicks/sloughing; excessive weight causes lost circulation.</p>
          <span class="guide-section-title">Measurement Steps</span>
          <ul class="guide-step-list">
            <div class="guide-step-item">
              <span class="guide-step-num">1</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Fill Mud Cup</span>
                <span class="guide-step-desc">Fill the clean, dry cup completely with freshly sampled mud.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">2</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Seal & Wipe</span>
                <span class="guide-step-desc">Place lid firmly, allowing excess mud to escape vents, then wipe cup dry.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">3</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Balance Rider</span>
                <span class="guide-step-desc">Move the rider along the graduated beam until the bubble levels, then read density.</span>
              </div>
            </div>
          </ul>
        `
      };
    case "mud_viscosity":
      return {
        title: "Viscosity & Gel Strength",
        bodyHTML: `
          <p class="guide-text-block">Viscosity determines cuttings transport. Gel strength indicates fluid's capacity to suspend solids when circulation is halted.</p>
          <span class="guide-section-title">Marsh Funnel Viscosity</span>
          <ul class="guide-bullet-list">
            <li><strong>Procedure:</strong> Record time taken for 1 quart (946 ml) of mud to flow from funnel.</li>
            <li><strong>Water Standard:</strong> Fresh water at 70°F should take <strong>26 ± 0.5 seconds</strong>.</li>
            <li><strong>Gel Strengths:</strong> Measured at 10-second and 10-minute static intervals using a Fann VG meter to verify thixotropic properties.</li>
          </ul>
        `
      };
    case "mud_calculations":
      return {
        title: "Mud Engineering Calculations",
        bodyHTML: `
          <p class="guide-text-block">Calculate quantities of weighting materials (Barite) required to increase mud weight.</p>
          <span class="guide-section-title">Barite Increase Formula</span>
          <div style="background-color:rgba(141,119,101,0.04); padding:10px 14px; border-radius:8px; font-family:monospace; font-size:0.85rem; margin-bottom:15px; color:var(--text-primary); border: 1px solid var(--border-subtle);">
            Sacks of Barite = V × 14.7 × (W2 - W1) / (35.8 - W2)
          </div>
          <span class="guide-section-title">Weight Up Calculator</span>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Initial Mud Vol (bbl)</label>
                <input type="number" class="guide-calc-input" id="mudup-vol" value="1000" step="100" oninput="calculateGuideMudWeightUp()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">Initial MW (ppg)</label>
                <input type="number" class="guide-calc-input" id="mudup-imw" value="10.0" step="0.1" oninput="calculateGuideMudWeightUp()">
              </div>
              <div class="guide-calc-group" style="grid-column: span 2;">
                <label class="guide-calc-label">Target MW (ppg)</label>
                <input type="number" class="guide-calc-input" id="mudup-tmw" value="12.0" step="0.1" oninput="calculateGuideMudWeightUp()">
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Barite Sacks (100 lbs)</span>
                <span class="guide-calc-result-val"><span id="mudup-result">1235</span> sacks</span>
              </div>
            </div>
          </div>
        `
      };

    // ─── WELL COMPLETION CATEGORY ───
    case "packers":
      return {
        title: "Production Packers",
        bodyHTML: `
          <p class="guide-text-block">Downhole isolation devices containing packer elements that seal the casing-tubing annulus. Protects upper casing from reservoir pressure.</p>
          <span class="guide-section-title">Common Classifications</span>
          <ul class="guide-bullet-list">
            <li><strong>Mechanical Set:</strong> Set by rotation, tension, or compression of the tubing.</li>
            <li><strong>Hydraulic Set:</strong> Set by applying pump pressure down the tubing string.</li>
            <li><strong>Permanent:</strong> Sealed permanently in casing; must be milled out to retrieve.</li>
          </ul>
        `
      };
    case "production_tubing":
      return {
        title: "Production Tubing",
        bodyHTML: `
          <p class="guide-text-block">Conduit through which reservoir fluids flow to surface. Selected to withstand tension, collapse, and burst loads.</p>
          <span class="guide-section-title">Design Parameters</span>
          <ul class="guide-bullet-list">
            <li><strong>API Grades:</strong> J-55 (55k psi), N-80 (80k), L-80 (corrosion resistant), P-110 (110k).</li>
            <li><strong>Connection Types:</strong> EUE (External Upset) threaded & coupled, or Premium gas-tight metal-to-metal seal joints.</li>
          </ul>
        `
      };
    case "wellhead_xmas_tree":
      return {
        title: "Wellhead & Christmas Tree",
        bodyHTML: `
          <p class="guide-text-block">The primary surface equipment that supports casing/tubing strings and controls fluid production flow.</p>
          <span class="guide-section-title">Key Elements</span>
          <ul class="guide-bullet-list">
            <li><strong>Casing Head:</strong> Welded/screwed to surface casing; supports next casing string.</li>
            <li><strong>Tubing Spool:</strong> Suspends the tubing hanger and seals the annulus.</li>
            <li><strong>Xmas Tree Valves:</strong> Master valve (main isolation), swab valve (access vertical bore), wing valves, and surface choke.</li>
          </ul>
        `
      };

    // ─── BHA COMPONENTS ───
    case "bha_components":
      return {
        title: "BHA Components",
        bodyHTML: `
          <p class="guide-text-block">Bottom Hole Assembly (BHA) components are placed above the drill bit to provide weight, stiffness, stabilization, and direction control.</p>
          <span class="guide-section-title">Core Components</span>
          <ul class="guide-bullet-list">
            <li><strong>Drill Collars (DC):</strong> Heavy, thick-walled steel pipes to apply weight on bit (WOB).</li>
            <li><strong>Stabilizers:</strong> Maintain concentricity, prevent keyseating, and control hole trajectory.</li>
            <li><strong>Heavy Weight Drill Pipe (HWDP):</strong> Transitional pipe between stiff collars and flexible drill pipe.</li>
            <li><strong>Mud Motor / RSS:</strong> Rotary Steerable Systems or downhole motors for directional control.</li>
          </ul>
        `
      };
    case "drill_string_components":
      return {
        title: "Drill String Components",
        bodyHTML: `
          <p class="guide-text-block">The conduit connecting surface machinery to the BHA. Transmits rotation, torque, and fluid circulation.</p>
          <span class="guide-section-title">Standard Components</span>
          <ul class="guide-bullet-list">
            <li><strong>Kelly / Top Drive:</strong> Transmits rotation from the surface rotary table or top drive motor.</li>
            <li><strong>Drill Pipe (DP):</strong> Standard hollow seamless tubes (length usually Range 2: ~30 ft).</li>
            <li><strong>Tool Joints:</strong> Threaded connections (Pin/Box) welded to pipe ends.</li>
          </ul>
        `
      };

    // ─── DRILL BITS ───
    case "pdc_bits":
      return {
        title: "PDC Bits",
        bodyHTML: `
          <p class="guide-text-block">Polycrystalline Diamond Compact (PDC) bits use synthetic diamond cutters to shear rock rather than scrape it. Highly effective in homogenous formations.</p>
          <span class="guide-section-title">PDC Advantages</span>
          <ul class="guide-bullet-list">
            <li>No moving parts, reducing risk of mechanical failure downhole.</li>
            <li>High rate of penetration (ROP) in soft to medium-hard rock.</li>
            <li>Excellent durability, enabling longer runs without tripping.</li>
          </ul>
        `
      };
    case "roller_cone_bits":
      return {
        title: "Roller Cone Bits",
        bodyHTML: `
          <p class="guide-text-block">Features three moving cones with steel teeth or tungsten carbide inserts (TCI) that crush and gouge rock. Best suited for variable or hard formations.</p>
          <span class="guide-section-title">Key Elements</span>
          <ul class="guide-bullet-list">
            <li><strong>TCI (Tungsten Carbide Inserts):</strong> Press-fit buttons for hard abrasive formations.</li>
            <li><strong>Steel Teeth:</strong> Milled directly on the cones for soft formations.</li>
            <li><strong>Bearings:</strong> Sealed roller/journal bearings or open bearings.</li>
          </ul>
        `
      };
    case "bit_nozzle_selection":
      return {
        title: "Bit Nozzle Selection",
        bodyHTML: `
          <p class="guide-text-block">Select and calculate the Total Flow Area (TFA) of jet nozzles (measured in 32nds of an inch) to optimize hydraulic energy at the bottom of the wellbore.</p>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Number of Nozzles</label>
                <select class="guide-calc-input" id="tfa-count" onchange="renderGuideNozzleInputs()">
                  <option value="3">3 Nozzles</option>
                  <option value="4">4 Nozzles</option>
                  <option value="5">5 Nozzles</option>
                  <option value="6">6 Nozzles</option>
                </select>
              </div>
            </div>
            <div id="nozzle-inputs-container" style="display:flex; flex-direction:column; gap:10px;">
              <!-- Dynamic inputs here -->
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Total Flow Area (TFA)</span>
                <span class="guide-calc-result-val"><span id="tfa-result">0.0000</span> in²</span>
              </div>
            </div>
          </div>
        `
      };
    case "bit_hydraulics":
      return {
        title: "Bit Hydraulics",
        bodyHTML: `
          <p class="guide-text-block">Calculate hydraulic parameters at the bit nozzles to verify efficient cutting removal and optimum hydraulic horsepower (HSI).</p>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Flow Rate (gpm)</label>
                <input type="number" class="guide-calc-input" id="hyd-flow" value="400" oninput="calculateGuideHydraulics()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">Mud Weight (ppg)</label>
                <input type="number" class="guide-calc-input" id="hyd-mw" value="10.0" step="0.1" oninput="calculateGuideHydraulics()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">Bit TFA (in²)</label>
                <input type="number" class="guide-calc-input" id="hyd-tfa" value="0.331" step="0.001" oninput="calculateGuideHydraulics()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">Bit Size (in)</label>
                <input type="number" class="guide-calc-input" id="hyd-size" value="8.5" step="0.1" oninput="calculateGuideHydraulics()">
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row"><span class="guide-calc-result-lbl">Nozzle Velocity</span><span class="guide-calc-result-val"><span id="hyd-val-vn">0</span> ft/s</span></div>
              <div class="guide-calc-result-row"><span class="guide-calc-result-lbl">Bit Pressure Drop</span><span class="guide-calc-result-val"><span id="hyd-val-pb">0</span> psi</span></div>
              <div class="guide-calc-result-row"><span class="guide-calc-result-lbl">Hydraulic Horsepower</span><span class="guide-calc-result-val"><span id="hyd-val-hhp">0</span> HP</span></div>
              <div class="guide-calc-result-row"><span class="guide-calc-result-lbl">HSI (HP/in²)</span><span class="guide-calc-result-val"><span id="hyd-val-hsi">0.00</span> HSI</span></div>
              <div class="guide-calc-result-row"><span class="guide-calc-result-lbl">Impact Force</span><span class="guide-calc-result-val"><span id="hyd-val-if">0</span> lbf</span></div>
            </div>
          </div>
        `
      };
    case "bit_makeup_torque":
      return {
        title: "Bit Make-up Torque",
        bodyHTML: `
          <p class="guide-text-block">API recommended makeup torque ranges for standard thread connection sizes of drill bits.</p>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs single-col">
              <div class="guide-calc-group">
                <label class="guide-calc-label">API Regular Thread Connection</label>
                <select class="guide-calc-input" id="mut-conn" onchange="selectGuideMakeupTorque()">
                  <option value="2.375">2-3/8" API Reg</option>
                  <option value="2.875">2-7/8" API Reg</option>
                  <option value="3.5">3-1/2" API Reg</option>
                  <option value="4.5">4-1/2" API Reg</option>
                  <option value="6.625">6-5/8" API Reg</option>
                  <option value="7.625">7-5/8" API Reg</option>
                  <option value="8.625">8-5/8" API Reg</option>
                </select>
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Recommended Torque (ft-lbs)</span>
                <span class="guide-calc-result-val" id="mut-val-ftlb">-</span>
              </div>
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Recommended Torque (N-m)</span>
                <span class="guide-calc-result-val" id="mut-val-nm">-</span>
              </div>
            </div>
          </div>
        `
      };

    // ─── BHA & DRILLSTRING ───
    case "stabilizers":
      return {
        title: "Stabilizers",
        bodyHTML: `
          <p class="guide-text-block">Maintain concentric alignment of BHA. Placement determines build, hold, or drop trajectory effects.</p>
          <span class="guide-section-title">Design Variations</span>
          <ul class="guide-bullet-list">
            <li><strong>Integral Blade:</strong> Machined from single alloy steel bar (rugged, durable).</li>
            <li><strong>Welded Blade:</strong> Spiral blades welded onto body (cost-effective).</li>
            <li><strong>Sleeve Stabilizers:</strong> Exchangeable sleeve fitted over mandrel (easy wear replacement).</li>
          </ul>
        `
      };
    case "reamers":
      return {
        title: "Reamers / Underreamers",
        bodyHTML: `
          <p class="guide-text-block">Reamers clear swelling shales and doglegs. Underreamers expand hole size dynamically below casings.</p>
          <span class="guide-section-title">Applications</span>
          <ul class="guide-bullet-list">
            <li>Ensure hole gauge in swelling clay formations.</li>
            <li>Expand borehole diameter to allow casing run with small annular clearances.</li>
          </ul>
        `
      };
    case "jars":
      return {
        title: "Drilling Jars",
        bodyHTML: `
          <p class="guide-text-block">Downhole energy-storing tool designed to deliver high impact force (upward or downward) to free stuck drill strings.</p>
          <span class="guide-section-title">Safety Guidelines</span>
          <ul class="guide-bullet-list">
            <li>Place jars in tension above the neutral point during normal drilling.</li>
            <li>Always test jar function on surface before tripping in hole.</li>
            <li>Utilize jar accelerators to increase impact energy at depth.</li>
          </ul>
        `
      };
    case "shock_subs":
      return {
        title: "Shock Subs",
        bodyHTML: `
          <p class="guide-text-block">Dampen longitudinal vibrations caused by bit bouncing on hard formation rocks. Protects drill string threads and surface equipment.</p>
          <span class="guide-section-title">Operational Benefits</span>
          <ul class="guide-bullet-list">
            <li>Reduces micro-fracturing of tungsten carbide bit inserts.</li>
            <li>Extends seal life of downhole logging tools (MWD/LWD).</li>
          </ul>
        `
      };
    case "float_valves":
      return {
        title: "Float Valves",
        bodyHTML: `
          <p class="guide-text-block">One-way check valves installed in the bit sub to prevent backflow of mud up the drill string. Protects against plugged nozzles and back-pressure kicks.</p>
          <span class="guide-section-title">Types</span>
          <ul class="guide-bullet-list">
            <li><strong>Plunger Type:</strong> Spring-loaded plunger providing positive mud shut-off.</li>
            <li><strong>Flapper Type:</strong> Hinged flapper opening under circulation, sealing on shut down.</li>
          </ul>
        `
      };
    case "crossovers":
      return {
        title: "Crossovers (X-O Subs)",
        bodyHTML: `
          <p class="guide-text-block">Short connection subs designed to bridge differing thread profiles or connection styles inside the drill string (e.g. IF to REG).</p>
          <span class="guide-section-title">Design Rule</span>
          <ul class="guide-bullet-list">
            <li>Always verify OD, ID, and steel yield grade match the weaker component.</li>
          </ul>
        `
      };

    // ─── WELL CONTROL ───
    case "kick_indicators":
      return {
        title: "Kick Indicators",
        bodyHTML: `
          <div style="background: linear-gradient(135deg, rgba(243, 156, 18, 0.12), rgba(243, 156, 18, 0.03)); border-left: 4px solid var(--accent-color, #f39c12); padding: 14px 16px; border-radius: 8px; margin-bottom: 18px;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color, #f39c12); margin-bottom: 6px; letter-spacing: 0.3px;">POSITIVE KICK SIGN</div>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-primary); line-height: 1.5; font-weight: 400;">Positive kick indicators are different from kick warning signs. They indicate that the kick has already entered the well bore. Any of them indicate regular flow checks.</p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 14px 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
              <strong style="display: block; font-size: 0.88rem; color: var(--text-primary); margin-bottom: 6px;">Increase in return flow (Pumps On)</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.48;">After the early warning signs the first positive kick sign is increase in flow rate at the flow line with pumps on. The entrance of any fluid into the well bore causes the flow rate to increase.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 14px 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
              <strong style="display: block; font-size: 0.88rem; color: var(--text-primary); margin-bottom: 6px;">Flow from well (Pumps Off)</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.48;">Stopping the pump causes a reduction in bottom hole pressure equivalent to the annular pressure drop, so flow check is a reliable method of checking for a well kick. If the well does not flow when the pump is shut off and remains static for two or three minutes, then no well kick is entering.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 14px 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
              <strong style="display: block; font-size: 0.88rem; color: var(--text-primary); margin-bottom: 6px;">Pit Volume Increase</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.48;">An increase in pit volume is obvious & positive indication of flow into the well bore & can be easily verified. If an increase in pit volume is seen, shut off the pump and make a flow check. If the well does not flow, no kick is entering.</p>
            </div>
          </div>
        `
      };
    case "shutin_procedure":
      return {
        title: "Shut-in Procedures",
        bodyHTML: `
          <p class="guide-text-block">Standard steps to shut-in a well, varying by rig type, operation, and method.</p>
          
          <div style="display:flex; gap:8px; margin-bottom: 16px; background:var(--bg-subtle, rgba(141,119,101,0.05)); padding:12px 10px; border-radius:10px; border: 1px solid var(--border-subtle); align-items:center;">
            <div class="input-group" style="margin-bottom:0; flex:1.2; min-width:0;">
              <label class="input-label" style="font-size:0.64rem; font-weight:700; letter-spacing:0.3px; margin-bottom:4px; white-space:nowrap; overflow:visible; color:var(--text-secondary);">RIG TYPE</label>
              <select id="shutin-rig" class="toolkit-select" onchange="window.updateShutInProcedure()" style="padding:6px 20px 6px 8px; font-size:0.82rem; font-weight:600; height:auto; color:var(--text-primary);">
                <option value="land">Land/Jack-Up</option>
                <option value="subsea">Subsea</option>
              </select>
            </div>
            <div class="input-group" style="margin-bottom:0; flex:1.15; min-width:0;">
              <label class="input-label" style="font-size:0.64rem; font-weight:700; letter-spacing:0.3px; margin-bottom:4px; white-space:nowrap; overflow:visible; color:var(--text-secondary);">SHUT-IN METHOD</label>
              <select id="shutin-method" class="toolkit-select" onchange="window.updateShutInProcedure()" style="padding:6px 20px 6px 8px; font-size:0.82rem; font-weight:600; height:auto; color:var(--text-primary);">
                <option value="hard">Hard</option>
                <option value="soft">Soft</option>
              </select>
            </div>
            <div class="input-group" style="margin-bottom:0; flex:1.05; min-width:0;">
              <label class="input-label" style="font-size:0.64rem; font-weight:700; letter-spacing:0.3px; margin-bottom:4px; white-space:nowrap; overflow:visible; color:var(--text-secondary);">OPERATION</label>
              <select id="shutin-op" class="toolkit-select" onchange="window.updateShutInProcedure()" style="padding:6px 20px 6px 8px; font-size:0.82rem; font-weight:600; height:auto; color:var(--text-primary);">
                <option value="drilling">Drilling</option>
                <option value="tripping">Tripping</option>
                <option value="ooh">Out of Hole</option>
              </select>
            </div>
          </div>

          <div id="shutin-steps-container">
            <!-- Rendered by updateShutInProcedure -->
          </div>
          
          <div style="margin-top:20px; padding:10px 14px; background:var(--bg-subtle, rgba(230,161,92,0.08)); border-left:3px solid var(--accent-color, #e6a15c); border-radius:6px; font-size:0.75rem; color:var(--text-secondary); line-height:1.4;">
            <strong style="color:var(--text-primary);">Disclaimer:</strong> Verify all procedures against your company's approved well control documentation before use.
          </div>

          <img src="x" onerror="if(window.updateShutInProcedure) window.updateShutInProcedure(); this.onerror=null;" style="display:none;">
        `
      };
    case "drillers_method":
      return {
        title: "Driller's Method",
        bodyHTML: `
          <div style="background: linear-gradient(135deg, rgba(243, 156, 18, 0.12), rgba(243, 156, 18, 0.03)); border-left: 4px solid var(--accent-color, #f39c12); padding: 14px 16px; border-radius: 8px; margin-bottom: 18px;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color, #f39c12); margin-bottom: 6px; letter-spacing: 0.3px;">TWO-CIRCULATION WELL CONTROL</div>
            <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
              <li><strong>First Circulation:</strong> Influx is removed from the well bore using original mud density.</li>
              <li><strong>Second Circulation:</strong> Kill mud replaces original mud and restores primary control of the well.</li>
            </ul>
          </div>

          <span class="guide-section-title" style="margin-top: 14px; display: block; color: var(--accent-color, #f39c12); font-size: 0.95rem;">First Circulation (Killing Procedure)</span>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px; margin-bottom: 16px;">
            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">a) Bring Pump Up to Kill Speed</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Bring the pump up to kill speed in steps of 5 SPM, gradually opening the choke holding casing pressure constant.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">b) Maintain Drill Pipe Pressure Constant</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">When the pump is up to kill speed, maintain drill pipe pressure constant.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">c) Circulate Out Influx</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Circulate out the influx from the well maintaining drill pipe pressure constant.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">d) Shut Down & Record Pressures</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">When the influx is out, stop the pump reducing the pump speed in steps of 5 SPM, gradually closing the choke, maintaining casing pressure constant. Record pressure, SIDPP and SICP should be equal to original SIDPP.</p>
            </div>

            <div style="background: rgba(243, 156, 18, 0.08); border-left: 3px solid var(--accent-color, #f39c12); padding: 12px 14px; border-radius: 6px; margin-top: 2px;">
              <strong style="display: block; font-size: 0.84rem; color: var(--accent-color, #f39c12); margin-bottom: 4px;">Important Note (First Circulation Analysis)</strong>
              <p style="margin: 0; font-size: 0.81rem; color: var(--text-secondary); line-height: 1.48;">In case recorded SIDPP & SICP are equal but more than original SIDPP value, it indicates trapped pressure in wellbore. Whereas if SICP is more than original SIDPP, it indicates that some influx is still in the wellbore.</p>
            </div>
          </div>

          <span class="guide-section-title" style="margin-top: 18px; display: block; color: var(--accent-color, #f39c12); font-size: 0.95rem;">Second Circulation (Displace with Kill Mud)</span>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px; margin-bottom: 16px;">
            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">a) Line Up Kill Mud</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Line up suction with kill mud.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">b) Bring Pump Up to Kill Speed</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Bring the pump up to kill speed in steps of 5 SPM, gradually opening the choke, holding casing pressure constant.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">c) Pump Kill Mud to Bit</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">When the pump is at kill speed, pump kill mud from surface to bit, maintaining casing pressure constant.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">d) Displace Annulus (Bit to Surface)</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Pump kill mud from bit to surface, maintaining drill pipe pressure constant equal to FCP.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">e) Shut Down & Confirm Zero Pressure</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">When the kill mud reaches surface, stop the pump reducing the pump in steps of 5 SPM, gradually closing the choke maintaining casing pressure constant. Record pressures, SIDPP and SICP both should be equal to zero.</p>
            </div>

            <div style="background: linear-gradient(135deg, rgba(46, 204, 113, 0.12), rgba(46, 204, 113, 0.03)); border-left: 3px solid #2ecc71; padding: 12px 14px; border-radius: 6px; margin-top: 2px;">
              <strong style="display: block; font-size: 0.84rem; color: #2ecc71; margin-bottom: 4px;">Final Action & Verification</strong>
              <p style="margin: 0; font-size: 0.81rem; color: var(--text-secondary); line-height: 1.48;">Open & observe the well. Add trip margin before resuming normal operation.</p>
            </div>
          </div>
        `
      };
    case "wait_weight_method":
      return {
        title: "Wait & Weight Method",
        bodyHTML: `
          <p class="guide-text-block">Kill mud is mixed on surface before circulation starts. The kick is circulated out and the well is killed in a single circulation.</p>
          <div class="guide-calc-box">
            <div class="guide-calc-inputs">
              <div class="guide-calc-group">
                <label class="guide-calc-label">Original MW (ppg)</label>
                <input type="number" class="guide-calc-input" id="ww-omw" value="10.0" step="0.1" oninput="calculateGuideKillParameters()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">SIDPP (psi)</label>
                <input type="number" class="guide-calc-input" id="ww-sidpp" value="500" step="10" oninput="calculateGuideKillParameters()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">SCR Pressure (psi)</label>
                <input type="number" class="guide-calc-input" id="ww-scrp" value="350" step="10" oninput="calculateGuideKillParameters()">
              </div>
              <div class="guide-calc-group">
                <label class="guide-calc-label">True Vertical Depth (ft)</label>
                <input type="number" class="guide-calc-input" id="ww-tvd" value="8000" step="100" oninput="calculateGuideKillParameters()">
              </div>
              <div class="guide-calc-group" style="grid-column: span 2;">
                <label class="guide-calc-label">Surface to Bit Strokes (stks)</label>
                <input type="number" class="guide-calc-input" id="ww-stks" value="1000" step="50" oninput="calculateGuideKillParameters()">
              </div>
            </div>
            <div class="guide-calc-results">
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Kill Mud Weight (KMW)</span>
                <span class="guide-calc-result-val"><span id="ww-val-kmw">0.00</span> ppg</span>
              </div>
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Initial Circulation Press (ICP)</span>
                <span class="guide-calc-result-val"><span id="ww-val-icp">0</span> psi</span>
              </div>
              <div class="guide-calc-result-row">
                <span class="guide-calc-result-lbl">Final Circulation Press (FCP)</span>
                <span class="guide-calc-result-val"><span id="ww-val-fcp">0</span> psi</span>
              </div>

              <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-top: 12px;">
                <button type="button" onclick="toggleStepDownSchedule()" style="background: linear-gradient(135deg, rgba(243, 156, 18, 0.22), rgba(243, 156, 18, 0.08)); border: 1.5px solid var(--accent-color, #f39c12); border-radius: 8px; padding: 10px 14px; font-size: 0.84rem; font-weight: 700; color: var(--accent-color, #f39c12); cursor: pointer; width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(243, 156, 18, 0.15); transition: all 0.2s ease;">
                  <span id="ww-step-schedule-toggle-lbl">▶ View Step Down Schedule</span>
                </button>
                <div id="ww-step-schedule-container" style="display: none; margin-top: 10px;">
                  <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; letter-spacing: 0.2px;">STEP DOWN SCHEDULE (ICP TO FCP)</div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.76rem; font-weight: 700; color: var(--text-secondary); background: var(--bg-subtle, rgba(0,0,0,0.1)); padding: 6px 10px; border-radius: 6px; margin-bottom: 6px;">
                    <span>Strokes Pumped</span>
                    <span style="text-align: right;">Drill Pipe Press (psi)</span>
                  </div>
                  <div id="ww-step-schedule-rows" style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem;">
                    <!-- Dynamically populated rows -->
                  </div>
                </div>
              </div>
            </div>
          </div>

          <span class="guide-section-title" style="margin-top: 20px; display: block; color: var(--accent-color, #f39c12); font-size: 0.95rem;">3.4.1 Killing Procedure (Wait and Weight Method)</span>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px; margin-bottom: 16px;">
            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">a) Line Up Kill Mud</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Line up suction with kill mud.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">b) Bring Pump Up to Kill Speed</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Bring the pump up to kill speed in steps of 5 SPM, gradually opening the choke, holding casing pressure constant.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">c) Pump Kill Mud to Bit (Step Down Schedule)</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">When the pump is at kill speed, pump kill mud from surface to bit, maintaining drill pipe pressure as per step down schedule (during this step drill pipe pressure will fall from ICP to FCP).</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">d) Displace Annulus (Bit to Surface)</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Pump kill mud from bit to surface, maintaining drill pipe pressure constant equal to FCP.</p>
            </div>

            <div style="background: var(--bg-subtle, rgba(141,119,101,0.05)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding: 12px 14px; border-radius: 8px;">
              <strong style="display: block; font-size: 0.86rem; color: var(--text-primary); margin-bottom: 4px;">e) Shut Down & Confirm Zero Pressure</strong>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">When the kill mud reaches surface, stop the pump reducing the pump speed in steps of 5 SPM, gradually closing the choke maintaining casing pressure constant. Record pressures, SIDPP and SICP both should be equal to zero.</p>
            </div>
          </div>
        `
      };
    case "slow_circulation_rate":
      return {
        title: "Slow Circulation Rate (SCR)",
        bodyHTML: `
          <p class="guide-text-block">During well control operations, to avoid further entry of formation fluid, it is essential to keep BHP at least equal to formation pressure. Kicks must be circulated out at slow circulation rates (SCR) to ensure that back pressure and system losses do not exceed the rating of high pressure lines and other rig equipment.</p>
          
          <span class="guide-section-title">Reasons for Slow Circulation</span>
          <ul class="guide-bullet-list">
            <li>Ensure that slow circulation pressure plus shut-in drill pipe pressure does not exceed surface line ratings.</li>
            <li>Allow mud returns to be weighted up and re-circulated within available mud mixing system capabilities.</li>
            <li>Allow longer reaction time for choke adjustments.</li>
            <li>Allow sufficient time for disposal of kick fluid / de-gassing at the surface.</li>
            <li>Reduce annular pressure losses.</li>
            <li>Reduce the risk of pump breakdown and other mechanical problems.</li>
            <li>Manage Equivalent Circulating Density (ECD) on open hole.</li>
            <li>Manage choke line friction pressure (floaters).</li>
          </ul>

          <span class="guide-section-title">Rate Selection</span>
          <div style="background-color:rgba(141,119,101,0.04); padding:10px 14px; border-radius:8px; font-size:0.85rem; margin-bottom:15px; color:var(--text-primary); border: 1px solid var(--border-subtle); line-height: 1.45;">
            The slow circulation rate should ideally be <strong>1/2 to 1/3 of the pump SPM</strong> at the time of drilling. It should be the minimum possible pump speed at which the pump can run smoothly without any knocking.
          </div>

          <span class="guide-section-title">Recording SCR</span>
          <p class="guide-text-block" style="margin-bottom: 8px;">The SCR for each pump is selected before any well control problems arise. Standard policy is to measure the pump pressure periodically. It should be recorded near to the bottom for each pump at regular intervals and/or when conditions change:</p>
          <ul class="guide-bullet-list">
            <li>At the beginning of each shift.</li>
            <li>After a change in drilling fluid density.</li>
            <li>After a change in bit nozzle size or BHA.</li>
            <li>After drilling a long section of hole (e.g., 500 ft.) in a shift.</li>
            <li>After pump fluid end repair.</li>
            <li>After any significant change in mud properties.</li>
          </ul>
          <div style="background: linear-gradient(135deg, rgba(243, 156, 18, 0.12), rgba(243, 156, 18, 0.03)); border-left: 3px solid var(--accent-color, #f39c12); padding: 12px 14px; border-radius: 6px; margin-top: 15px;">
            <strong style="display: block; font-size: 0.86rem; color: var(--accent-color, #f39c12); margin-bottom: 4px;">Important Note</strong>
            <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">Slow circulation pressure must be recorded from the gauge that is to be used for the well killing operation (typically at the remote choke panel).</p>
          </div>
        `
      };

    // ─── CASING & CEMENTING ───
    case "casing_components":
      return {
        title: "Casing Components",
        bodyHTML: `
          <p class="guide-text-block">Steel pipes lining the borehole to prevent cave-ins, isolate formations, and withstand geological/hydrostatic pressures.</p>
          <span class="guide-section-title">Key Components</span>
          <ul class="guide-bullet-list">
            <li><strong>Conductor Casing:</strong> Prevents washouts under rig floor.</li>
            <li><strong>Surface Casing:</strong> Protects freshwater sands; anchors BOP stack.</li>
            <li><strong>Intermediate Casing:</strong> Isolates lost circulation or high pressure zones.</li>
            <li><strong>Production Casing/Liner:</strong> Confines production fluids to reservoir zone.</li>
          </ul>
        `
      };
    case "float_equipment":
      return {
        title: "Float Equipment",
        bodyHTML: `
          <p class="guide-text-block">Valves installed in the casing shoe and collar to prevent backflow of slurry once cement is pumped.</p>
          <span class="guide-section-title">Core Devices</span>
          <ul class="guide-bullet-list">
            <li><strong>Float Shoe:</strong> Rounded profile at bottom containing a check valve to guide casing past ledges.</li>
            <li><strong>Float Collar:</strong> Installed 1-2 joints above shoe; provides landing shoulder for cementing plugs.</li>
          </ul>
        `
      };
    case "centralizers":
      return {
        title: "Centralizers",
        bodyHTML: `
          <p class="guide-text-block">Fitted on the casing OD to ensure uniform annular clearance between casing and formation. Crucial for successful primary cementing displacement.</p>
          <span class="guide-section-title">Types</span>
          <ul class="guide-bullet-list">
            <li><strong>Bow-Spring:</strong> Flexible springs compress to pass tight spots, then expand.</li>
            <li><strong>Solid Rigid:</strong> Stiff steel blades for high deviation or horizontal wells.</li>
          </ul>
        `
      };
    case "cementing_procedure":
      return {
        title: "Cementing Procedure",
        bodyHTML: `
          <p class="guide-text-block">Primary cementing steps to place slurry in casing annulus.</p>
          <span class="guide-step-list">
            <div class="guide-step-item">
              <span class="guide-step-num">1</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Circulate Hole</span>
                <span class="guide-step-desc">Condition mud and clean out cuttings before running casing.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">2</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Pump Spacer</span>
                <span class="guide-step-desc">Pump fluid spacer to separate slurry from chemical contact with mud.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">3</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Release Bottom Plug</span>
                <span class="guide-step-desc">Pump bottom plug, then mix and pump cement slurry.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">4</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Displace Slurry</span>
                <span class="guide-step-desc">Release top plug; pump displacement fluid to push cement to annulus. Bump plug.</span>
              </div>
            </div>
          </ul>
        `
      };
    case "cement_additives":
      return {
        title: "Cement Additives",
        bodyHTML: `
          <p class="guide-text-block">Chemicals added to slurry to modify curing times, densities, or flow properties.</p>
          <ul class="guide-bullet-list">
            <li><strong>Accelerators (CaCl₂):</strong> Shorten cement setting time in shallow, cold zones.</li>
            <li><strong>Retarders:</strong> Extend setting time to allow deep hot-hole placement.</li>
            <li><strong>Extenders (Bentonite):</strong> Lower slurry density to prevent breakdown.</li>
            <li><strong>Fluid Loss Control:</strong> Prevents water loss into permeable formations.</li>
          </ul>
        `
      };

    // ─── FISHING OPERATIONS ───
    case "overshot":
      return {
        title: "Overshot",
        bodyHTML: `
          <p class="guide-text-block">The most common external catch tool. Slips over the outside of the fish to grip it firmly using basket or spiral grapples.</p>
          <span class="guide-section-title">Operation Guide</span>
          <ul class="guide-bullet-list">
            <li>Lower slowly over the top of the fish.</li>
            <li>Apply slight rotation to engage grapple teeth, then pull upward.</li>
            <li>Circulate through the tool to clean debris before engagement.</li>
          </ul>
        `
      };
    case "spear":
      return {
        title: "Spear",
        bodyHTML: `
          <p class="guide-text-block">An internal catch tool. Enters the hollow inside of casing, tubing, or drill pipe and expands slips to grip the fish internally.</p>
          <span class="guide-section-title">Key Step</span>
          <ul class="guide-bullet-list">
            <li>Rotate spear mandrel to expand slip blocks. Once gripped, jar upward.</li>
          </ul>
        `
      };
    case "junk_basket":
      return {
        title: "Junk Basket",
        bodyHTML: `
          <p class="guide-text-block">Retrieves loose items (bit cones, hand tools, slips) from the bottom of the wellbore.</p>
          <span class="guide-section-title">Mechanism</span>
          <ul class="guide-bullet-list">
            <li><strong>Reverse Circulation:</strong> Diverts fluid flow to wash junk directly into the inner basket chamber.</li>
          </ul>
        `
      };
    case "fishing_magnets":
      return {
        title: "Fishing Magnets",
        bodyHTML: `
          <p class="guide-text-block">High-strength permanent magnets run on drill string to collect small steel junk (shavings, slips, hand tools).</p>
          <span class="guide-section-title">Pre-run checklist</span>
          <ul class="guide-bullet-list">
            <li>Circulate mud right above bottom to clean cuttings off the junk.</li>
          </ul>
        `
      };
    case "washover_pipe":
      return {
        title: "Washover Pipe",
        bodyHTML: `
          <p class="guide-text-block">Large-diameter pipe run to cut away packed formation or cement surrounding a stuck drill string to release it.</p>
          <span class="guide-section-title">Precautions</span>
          <ul class="guide-bullet-list">
            <li>Maintain slow, cautious rotation to avoid binding the washover string.</li>
          </ul>
        `
      };

    // ─── DRILLING OPERATIONS: STUCK PIPE ───
    case "stuck_pipe_guide":
      return {
        title: "Stuck Pipe Analysis",
        bodyHTML: `
          <p class="guide-text-block">Comprehensive guide for diagnosing stuck pipe mechanisms—differential sticking, mechanical pack-off / bridging, and wellbore geometry—and executing immediate freeing procedures.</p>
          <span class="guide-section-title">Primary Sticking Mechanisms</span>
          <ul class="guide-bullet-list">
            <li><strong>Differential Sticking:</strong> Occurs when stationary drill collars contact permeable formation filter cake with hydrostatic pressure higher than pore pressure. Overpull increases with time; full circulation is maintained.</li>
            <li><strong>Mechanical Pack-off & Bridging:</strong> Settling cuttings, sloughing shale, or junk pack around the BHA. Circulation is restricted or impossible; pumping causes immediate pressure spikes.</li>
            <li><strong>Wellbore Geometry:</strong> Keyseats, micro-doglegs, or undergauge hole trap collars or stabilizers during pipe movement. Circulation remains normal; sticking occurs specifically while tripping.</li>
          </ul>
          <span class="guide-section-title">Immediate Rig Actions</span>
          <ul class="guide-bullet-list">
            <li><strong>Jarring Direction:</strong> Jar opposite to the direction of pipe movement prior to sticking. If stuck while pulling up, jar DOWN with maximum allowable load. If stuck while running in, jar UP.</li>
            <li><strong>Circulation Attempt:</strong> If circulation is lost, surge pipe or bleed off trapped pressure to break pack-off before high pump pressure wedges debris tighter.</li>
            <li><strong>Freeing Fluid Pill:</strong> Spot an organic oil-based or glycol-based soaking pill to break filter cake in differential sticking scenarios.</li>
          </ul>
          <span class="guide-section-title">Interactive Diagnostic Assistant</span>
          <button class="toolkit-btn primary" onclick="navigateTo('stuck-pipe')" style="width:100%; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 16px; border-radius:12px; font-weight:600; cursor:pointer;">
            ${renderIcon('troubleshoot', { size: '20px' })}
            Launch Stuck Pipe Diagnostic Tool
          </button>
        `
      };

    // ─── QUICK REFERENCE CATEGORY ───
    case "drill_bit_torque":
      return {
        title: "Drill Bit Make-Up Torque",
        bodyHTML: `
          <p class="guide-text-block">API recommended makeup torque ranges for standard regular rotary drilling bit connections. Proper makeup torque ensures seal integrity and prevents connection failures downhole.</p>
          <span class="guide-section-title">Torque Reference Table</span>
          <div class="table-responsive">
            <table class="data-table" style="width:100%;">
              <thead>
                <tr>
                  <th style="font-weight:700; color:var(--text-primary); text-align:left;">Bit Thread</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">Torque (daN.m)</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">Torque (ft.lb)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">2-3/8" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">400–480</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">3000–3500</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">2-7/8" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">600–750</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">4500–5500</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">3-1/2" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">950–1200</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">7000–9000</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">4-1/2" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">1600–2200</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">12000–16000</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">6-5/8" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">3800–4300</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">28000–32000</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">7-5/8" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">4600–5400</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">34000–40000</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">8-5/8" REG</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; color:var(--text-secondary);">5400–8100</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.9rem; font-weight:700; color:var(--accent-color);">40000–60000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <span class="guide-section-title">Important Torque Guidelines</span>
          <ul class="guide-bullet-list">
            <li><strong>Thread Cleaning:</strong> All connection threads must be thoroughly cleaned with a wire brush and solvent before makeup.</li>
            <li><strong>API Thread Compound:</strong> Apply a uniform, thin coat of API thread compound to the pin and box threads, including thread shoulders.</li>
            <li><strong>Makeup Limits:</strong> Initial makeup torque should start at the lower limit and can be increased up to the upper limit if leakage occurs or under high drag/rotational force drilling.</li>
            <li><strong>OEM Specifications:</strong> Always follow the specific bit manufacturer's specifications when available.</li>
          </ul>
        `
      };

    case "ring_gaskets_conn":
      return {
        title: "Ring Gaskets & Connections",
        bodyHTML: `
          <p class="guide-text-block">API ring gaskets provide high-integrity metal-to-metal pressure seals for API Type 6B and Type 6BX flanged connections across wellhead and BOP equipment.</p>
          <span class="guide-section-title">Flange & Gasket Sizing Table</span>
          <div class="table-responsive">
            <table class="data-table" style="width:100%;">
              <thead>
                <tr>
                  <th style="font-weight:700; color:var(--text-primary); text-align:left;">Size</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">2M</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">3M</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">5M</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">10M</th>
                  <th style="text-align:right; font-weight:700; color:var(--text-primary);">15M/20M</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">2 1/16"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 23</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 24</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 24</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 152</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 152</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">2 9/16"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 26</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 27</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 27</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 153</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 153</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">3 1/8"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 31</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 31</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 35</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">3 1/16"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 154</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 154</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">4 1/16"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 37</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 37</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 39</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 155</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 155</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">7 1/16"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 45</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 45</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 46</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 156</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 156</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">9"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 49</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 49</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 50</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 157</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 157</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">11"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 53</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 53</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">R/RX 54</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 158</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 158</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">13 5/8"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 57</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 57</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">BX 160</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 159</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 159</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">16 3/4"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 65</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 66</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">BX 162</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 162</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">18 3/4"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">BX 163</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 164</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 164</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">20 3/4"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 74</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">21 1/4"</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">R/RX 73</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--accent-color);">BX 165</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--text-primary);">BX 166</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; color:var(--text-secondary);">&mdash;</td>
                </tr>
              </tbody>
            </table>
          </div>
          <span class="guide-section-title">Technical Guidelines</span>
          <ul class="guide-bullet-list">
            <li><strong>Flange Types (6B vs 6BX):</strong> Type 6B flanges are used for 2,000 & 3,000 psi (all sizes), and 5,000 psi (sizes smaller than 13-5/8"). Type 6BX flanges are used for 5,000 psi (sizes 13-5/8" & above), and all 10,000, 15,000 & 20,000 psi ratings.</li>
            <li><strong>Ring Gasket Interchangeability:</strong> R & RX gaskets are used in Type 6B flanges (flat bottom grooves) and are interchangeable. BX gaskets are pressure-energized and used exclusively in Type 6BX flanges; BX rings are not interchangeable with R or RX.</li>
            <li><strong>Clamp-Type & Grayloc:</strong> Bolted half-ring clamp hub connections assemble quicker than standard API flanges. Grayloc rings combine flexible tapered lips for pressure-energized seals against mating hub faces.</li>
            <li><strong>Clean & Dry Rule:</strong> Ring gaskets must always be installed clean and dry. Never apply grease or pipe dope to ring gaskets.</li>
            <li><strong>Single-Use Only:</strong> Ring gaskets undergo controlled plastic deformation during bolt makeup and should never be re-used.</li>
          </ul>
        `
      };

    case "surface_wellhead":
      return {
        title: "Surface Wellhead Information",
        bodyHTML: `
          <p class="guide-text-block">Technical components, stud sizes, secondary packaging, and casing hanger slip specifications across Sections A, B, and C of surface wellhead assemblies.</p>
          <div class="segmented-control" style="margin-bottom: 16px;">
            <button class="segmented-control-btn active" id="guide-wh-btn-A" onclick="window.switchGuideWellheadTab('A')">Section A</button>
            <button class="segmented-control-btn" id="guide-wh-btn-B" onclick="window.switchGuideWellheadTab('B')">Section B</button>
            <button class="segmented-control-btn" id="guide-wh-btn-C" onclick="window.switchGuideWellheadTab('C')">Section C</button>
          </div>
          <div id="guide-wellhead-content"></div>
        `
      };

    case "subsea_equipment":
      return {
        title: "Subsea Equipment Reference",
        bodyHTML: `
          <p class="guide-text-block">Emergency Drill Pipe Hang-Off Tool (EDPHOT) procedures and technical specifications. Used to land drill pipe securely inside wear bushings or wellheads below the BOP shear rams during emergency disconnect operations.</p>
          <span class="guide-section-title">Operational Guidelines</span>
          <ul class="guide-bullet-list">
            <li><strong>Space-Out Alignment:</strong> EDPHOT length is tailored so a 5" OD drill pipe section spaces out opposite the lower pipe rams in your BOP stack, leaving the upper tool body safely below the shear rams.</li>
            <li><strong>Landing Surface:</strong> The Hang-Off Tool can be landed on top of any Wear Bushing 16" or smaller, Nominal Bore Protector, or bottom of the wellhead.</li>
            <li><strong>Emergency Restriction:</strong> Use this tool for emergency drill pipe hang-off only. Released via clockwise (right-hand) rotation of the running tool.</li>
          </ul>
          <span class="guide-section-title">Landed Load Capacities</span>
          <div class="table-responsive">
            <table class="data-table" style="width:100%;">
              <thead>
                <tr>
                  <th style="font-weight:700; color:var(--text-primary); text-align:left;">Hang-Off Location</th>
                  <th style="font-weight:700; color:var(--text-primary); text-align:right;">Maximum Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">Nominal Bore Protector</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">100,000 lb</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">Casing Hanger</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">1,200,000 lb</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">Wear Bushing</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">1,200,000 lb</td>
                </tr>
                <tr>
                  <td style="font-weight:600; color:var(--text-primary);">Single Load Shoulder</td>
                  <td style="text-align:right; font-family:monospace; font-size:0.85rem; font-weight:700; color:var(--accent-color);">1,200,000 lb</td>
                </tr>
              </tbody>
            </table>
          </div>
          <span class="guide-section-title">EDPHOT Technical CAD Assembly</span>
          <div class="edphot-diagram-container" style="display:flex; justify-content:center; margin: 12px 0;">
            ${getEdphotSvgMarkup()}
          </div>
          <div id="diagram-interactive-panel" style="margin-top:10px; padding:10px 14px; border-radius:10px; background:var(--bg-subtle, rgba(141,119,101,0.04)); font-size:0.82rem; text-align:center; min-height:38px; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); border:1px solid var(--border-subtle);">
            Hover over or tap diagram components to inspect details
          </div>
        `
      };

    default:
      return { title: "Topic Detail", bodyHTML: "<p>Detail info.</p>" };
  }
}


// ==========================================
// IADC BIT DULL GRADING MODULE
// ==========================================

window.clearIADCForm = () => {
  state.editingIADCRecordId = null;
  state.currentDullPhotoBase64 = null;
  state.iadcCardVisible = false;
  
  const typeSelect = document.getElementById('bit-info-type');
  if (typeSelect) typeSelect.value = 'PDC';
  
  const sizeInput = document.getElementById('bit-info-size');
  if (sizeInput) sizeInput.value = '8.5';
  
  const mfgInput = document.getElementById('bit-info-mfg');
  if (mfgInput) mfgInput.value = '';
  
  const snInput = document.getElementById('bit-info-sn');
  if (snInput) snInput.value = '';
  
  const selects = ['bit-grade-i', 'bit-grade-o', 'bit-grade-d', 'bit-grade-l', 'bit-grade-b', 'bit-grade-g', 'bit-grade-o2', 'bit-grade-r'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'bit-grade-d') el.value = 'NO';
      else if (id === 'bit-grade-l') el.value = 'N';
      else if (id === 'bit-grade-b') el.value = 'X';
      else if (id === 'bit-grade-g') el.value = 'I';
      else if (id === 'bit-grade-o2') el.value = 'X';
      else if (id === 'bit-grade-r') el.value = 'TD';
      else el.value = '0';
    }
  });
  
  const commentsText = document.getElementById('bit-grade-comments');
  if (commentsText) commentsText.value = '';
  
  const cameraInput = document.getElementById('dull-photo-camera-input');
  const galleryInput = document.getElementById('dull-photo-gallery-input');
  if (cameraInput) cameraInput.value = '';
  if (galleryInput) galleryInput.value = '';
  
  const previewContainer = document.getElementById('dull-photo-preview-container');
  const previewImg = document.getElementById('dull-photo-preview');
  if (previewImg) previewImg.src = '';
  if (previewContainer) previewContainer.style.display = 'none';
  
  const visualGradeCard = document.getElementById('iadc-visual-grade-card');
  if (visualGradeCard) visualGradeCard.style.display = 'none';
  
  const saveBtnText = document.getElementById('iadc-save-btn-text');
  if (saveBtnText) {
    saveBtnText.textContent = (window.I18n && window.I18n.translate) ? window.I18n.translate('Save Record') : 'Save Record';
  }
  
  onBitTypeChanged();
  
  state.iadcCardVisible = false;
  if (visualGradeCard) visualGradeCard.style.display = 'none';
};

window.showIADCInfo = (type) => {
  const modal = document.getElementById('iadc-info-modal');
  const titleEl = document.getElementById('iadc-info-modal-title');
  const bodyEl = document.getElementById('iadc-info-modal-body');
  if (!modal || !titleEl || !bodyEl) return;

  const content = {
    inner: {
      title: 'I \u2013 Inner Wear',
      sections: [
        { heading: 'Definition', text: 'Wear on the inner 2/3 of the bit cutting structure, measured from the bit center (nose).' },
        { heading: 'Wear Scale', list: ['0 \u2013 No wear', '1\u20137 \u2013 Increasing wear', '8 \u2013 Complete wear'] },
        { heading: 'How to Grade', text: 'Inspect only the inner cutting structure and assign the wear value (0\u20138) according to the amount of cutter or tooth wear.' },
        { heading: 'Note', note: 'Do not include wear on the outer (gauge) section when grading Inner Wear.' }
      ]
    },
    outer: {
      title: 'O \u2013 Outer Wear',
      sections: [
        { heading: 'Definition', text: 'Wear on the outer 1/3 of the bit cutting structure, extending from the inner zone to the gauge.' },
        { heading: 'Wear Scale', list: ['0 \u2013 No wear', '1\u20137 \u2013 Increasing wear', '8 \u2013 Complete wear'] },
        { heading: 'How to Grade', text: 'Inspect only the outer cutting structure and record the wear from 0\u20138.' },
        { heading: 'Note', note: 'Outer wear includes the gauge area but excludes the inner cutting structure.' }
      ]
    },
    location: {
      title: 'L \u2013 Location',
      html: `
        <div style="margin-bottom:14px;">
          <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-color); margin-bottom:10px;">Bit Location Diagram</div>
          <!-- SVG Bit Cross-section Diagram -->
          <svg viewBox="0 0 220 170" width="100%" style="max-width:300px; display:block; margin:0 auto 14px;">
            <!-- Bit body outline -->
            <path d="M110,10 C130,10 155,20 165,50 L175,90 C178,110 175,130 165,148 L110,160 L55,148 C45,130 42,110 45,90 L55,50 C65,20 90,10 110,10 Z" fill="var(--bg-subtle, rgba(141,119,101,0.1))" stroke="var(--accent-color)" stroke-width="1.5"/>
            <!-- Nose zone (center top) -->
            <ellipse cx="110" cy="28" rx="18" ry="12" fill="rgba(234,179,8,0.22)" stroke="#EAB308" stroke-width="1.2"/>
            <text x="110" y="31" text-anchor="middle" font-size="9" font-weight="700" fill="#EAB308">N</text>
            <!-- Middle zone -->
            <ellipse cx="110" cy="68" rx="32" ry="14" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" stroke-width="1.2"/>
            <text x="110" y="72" text-anchor="middle" font-size="9" font-weight="700" fill="#3B82F6">M</text>
            <!-- Shoulder zone (left) -->
            <ellipse cx="70" cy="108" rx="18" ry="10" fill="rgba(168,85,247,0.15)" stroke="#A855F7" stroke-width="1.2"/>
            <text x="70" y="112" text-anchor="middle" font-size="9" font-weight="700" fill="#A855F7">S</text>
            <!-- Shoulder zone (right) -->
            <ellipse cx="150" cy="108" rx="18" ry="10" fill="rgba(168,85,247,0.15)" stroke="#A855F7" stroke-width="1.2"/>
            <text x="150" y="112" text-anchor="middle" font-size="9" font-weight="700" fill="#A855F7">S</text>
            <!-- Gauge zone (left) -->
            <ellipse cx="55" cy="140" rx="14" ry="8" fill="rgba(239,68,68,0.15)" stroke="#EF4444" stroke-width="1.2"/>
            <text x="55" y="144" text-anchor="middle" font-size="9" font-weight="700" fill="#EF4444">G</text>
            <!-- Gauge zone (right) -->
            <ellipse cx="165" cy="140" rx="14" ry="8" fill="rgba(239,68,68,0.15)" stroke="#EF4444" stroke-width="1.2"/>
            <text x="165" y="144" text-anchor="middle" font-size="9" font-weight="700" fill="#EF4444">G</text>
          </svg>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-color); margin-bottom:8px;">Location Codes</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${[
              { code:'N', color:'#EAB308', label:'Nose (Center)' },
              { code:'M', color:'#3B82F6', label:'Middle' },
              { code:'S', color:'#A855F7', label:'Shoulder' },
              { code:'G', color:'#EF4444', label:'Gauge' },
              { code:'C', color:'var(--text-secondary)', label:'Cone (Roller Cone only)' },
              { code:'A', color:'var(--accent-color)', label:'All Areas' },
            ].map(r => `
              <div style="display:flex; align-items:center; gap:10px; padding:5px 8px; background:var(--bg-subtle); border-radius:8px;">
                <span style="font-size:0.82rem; font-weight:800; color:${r.color}; min-width:18px; text-align:center;">${r.code}</span>
                <span style="font-size:0.82rem; color:var(--text-primary);">${r.label}</span>
              </div>`).join('')}
          </div>
        </div>
        <div style="font-size:0.82rem; color:var(--text-secondary); font-style:italic; line-height:1.5; padding:8px 10px; background:var(--bg-subtle); border-radius:8px; border-left:3px solid var(--accent-color);">
          💡 Tip: Select the location where the dull characteristic is most severe.
        </div>
      `
    },
    gauge: {
      title: 'G \u2013 Gauge Condition',
      sections: [
        {
          heading: 'How Under Gauge is Measured',
          list: [
            'A standard gauge ring is placed over the bit.',
            'The ring touches two cones.',
            'Measure the gap between the third cone and the inside of the ring.'
          ]
        },
        {
          heading: 'Roller Cone Bit Formula',
          text: 'UG (in 1/16 inch) = Measured gap \u00d7 2/3',
          note: 'Example: Gap = 3/16 in \u2192 UG = 3/16 \u00d7 2/3 = 2/16 \u2192 Record UG = 2/16'
        },
        {
          heading: 'PDC (Fixed Cutter) Bit Formula',
          text: 'UG (in 1/16 inch) = Measured gap directly',
          note: 'Example: Gap = 2/16 in \u2192 UG = 2/16'
        }
      ]
    }
  };

  const info = content[type];
  if (!info) return;

  titleEl.textContent = info.title;

  // Support raw html (for diagrams) or structured sections
  if (info.html) {
    bodyEl.innerHTML = info.html;
  } else {
    bodyEl.innerHTML = info.sections.map(sec => {
      let html = `<div style="margin-bottom:14px;">`;
      html += `<div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-color); margin-bottom:5px;">${sec.heading}</div>`;
      if (sec.text) html += `<div style="font-size:0.85rem; color:var(--text-primary); line-height:1.5;">${sec.text}</div>`;
      if (sec.note) html += `<div style="font-size:0.82rem; color:var(--text-secondary); font-style:italic; line-height:1.5; padding:8px 10px; background:var(--bg-subtle); border-radius:8px; border-left:3px solid var(--accent-color);">${sec.note}</div>`;
      if (sec.list) html += `<ul style="margin:4px 0 0; padding-left:18px; font-size:0.85rem; color:var(--text-primary); line-height:1.8;">${sec.list.map(li => `<li>${li}</li>`).join('')}</ul>`;
      html += `</div>`;
      return html;
    }).join('');
  }

  modal.classList.add('active');
};

window.closeIADCInfoModal = (e) => {
  const modal = document.getElementById('iadc-info-modal');
  if (!modal) return;
  if (e && e.target !== modal) return;
  modal.classList.remove('active');
};

window.onBitTypeChanged = () => {
  const typeSelect = document.getElementById('bit-info-type');
  if (!typeSelect) return;
  const type = typeSelect.value;

  // Helper to rebuild a select with options array
  const rebuildSelect = (id, options, defaultVal) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '';
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      sel.appendChild(opt);
    });
    const validValues = options.map(o => o.value);
    sel.value = validValues.includes(currentVal) ? currentVal : (defaultVal || options[0].value);
  };

  // --- Bearing/Seal (Column-5) — depends on bit type ---
  const bearingSelect = document.getElementById('bit-grade-b');
  if (type === 'PDC') {
    // Fixed Cutter: only X (Not Applicable)
    rebuildSelect('bit-grade-b', [
      { value: 'X', label: 'X - Not Applicable (Fixed Cutter)' }
    ], 'X');
    if (bearingSelect) bearingSelect.disabled = true;
  } else {
    // Roller Cone: 0–8 non-sealed + E/F/N sealed
    rebuildSelect('bit-grade-b', [
      { value: 'E', label: 'E - Sealed Bearing (Effective)' },
      { value: 'F', label: 'F - Sealed Bearing (Failed)' },
      { value: 'N', label: 'N - Sealed Bearing (Not Able to Grade)' },
      { value: '0', label: '0 - No Bearing Wear' },
      { value: '1', label: '1 - 1/8 Bearing Life Used' },
      { value: '2', label: '2 - 2/8 Bearing Life Used' },
      { value: '3', label: '3 - 3/8 Bearing Life Used' },
      { value: '4', label: '4 - 4/8 Bearing Life Used' },
      { value: '5', label: '5 - 5/8 Bearing Life Used' },
      { value: '6', label: '6 - 6/8 Bearing Life Used' },
      { value: '7', label: '7 - 7/8 Bearing Life Used' },
      { value: '8', label: '8 - Bearing Failed / All Life Used' },
    ], 'E');
    if (bearingSelect) bearingSelect.disabled = false;
  }

  // --- Location (Column-4) — options depend on bit type ---
  if (type === 'PDC') {
    rebuildSelect('bit-grade-l', [
      { value: 'C', label: 'C - Cone' },
      { value: 'N', label: 'N - Nose' },
      { value: 'T', label: 'T - Taper' },
      { value: 'S', label: 'S - Shoulder' },
      { value: 'G', label: 'G - Gauge' },
      { value: 'A', label: 'A - All Rows' },
    ], 'C');
  } else {
    rebuildSelect('bit-grade-l', [
      { value: 'N', label: 'N - Nose Row' },
      { value: 'M', label: 'M - Middle Row' },
      { value: 'G', label: 'G - Gage Row' },
      { value: 'A', label: 'A - All Rows' },
      { value: '#1', label: '#1 - Cone #1' },
      { value: '#2', label: '#2 - Cone #2' },
      { value: '#3', label: '#3 - Cone #3' },
    ], 'N');
  }

  generateIADCGrade(true);
};

window.toggleIADCDetails = () => {
  const container = document.getElementById('iadc-details-container');
  const btn = document.getElementById('iadc-see-more-btn');
  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.innerHTML = 'See Less ' + renderIcon('expand_less', { size: '20px' });
  } else {
    container.style.display = 'none';
    btn.innerHTML = 'See More ' + renderIcon('expand_more', { size: '20px' });
  }
};

window.generateIADCGrade = (bypassValidation, isFromSave = false) => {
  const getLabel = (id) => {
    const sel = document.getElementById(id);
    if (!sel) return '';
    const opt = sel.options[sel.selectedIndex];
    return opt ? opt.text : sel.value;
  };

  const i   = document.getElementById('bit-grade-i')?.value  || '0';
  const o   = document.getElementById('bit-grade-o')?.value  || '0';
  const d   = document.getElementById('bit-grade-d')?.value  || 'NO';
  const l   = document.getElementById('bit-grade-l')?.value  || 'N';
  const b   = document.getElementById('bit-grade-b')?.value  || 'X';
  const g   = document.getElementById('bit-grade-g')?.value  || 'I';
  const o2  = document.getElementById('bit-grade-o2')?.value || 'X';
  const r   = document.getElementById('bit-grade-r')?.value  || 'TD';

  const grade = `${i}-${o}-${d}-${l}-${b}-${g}-${o2}-${r}`;

  const gradeCodeEl = document.getElementById('iadc-visual-grade-code');
  if (gradeCodeEl) gradeCodeEl.textContent = grade;

  // --- Build Grade Interpretation rows ---
  const interpEl = document.getElementById('iadc-grade-interpretation');
  if (interpEl) {
    const rows = [
      { label: 'Inner Wear',               value: getLabel('bit-grade-i') },
      { label: 'Outer Wear',               value: getLabel('bit-grade-o') },
      { label: 'Dull Characteristic',      value: getLabel('bit-grade-d') },
      { label: 'Location',                 value: getLabel('bit-grade-l') },
      { label: 'Bearing / Seal',           value: getLabel('bit-grade-b') },
      { label: 'Gauge Condition',          value: getLabel('bit-grade-g') },
      { label: 'Other Dull Characteristic',value: getLabel('bit-grade-o2') },
      { label: 'Reason Pulled',            value: getLabel('bit-grade-r') },
    ];
    interpEl.innerHTML = rows.map(row => `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; padding:6px 10px; background:var(--bg-subtle, rgba(141,119,101,0.05)); border-radius:8px;">
        <span style="font-size:0.74rem; font-weight:600; color:var(--text-secondary); flex-shrink:0; min-width:110px;">${row.label}</span>
        <span style="font-size:0.78rem; font-weight:700; color:var(--text-primary); text-align:right;">${row.value}</span>
      </div>
    `).join('');
  }

  const visualGradeCard = document.getElementById('iadc-visual-grade-card');
  if (visualGradeCard) {
    visualGradeCard.style.display = 'block';
    visualGradeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Reset "See More" to collapsed state on each new generation if not from save
    if (!isFromSave) {
      const section = document.getElementById('iadc-interpretation-section');
      const label   = document.getElementById('iadc-see-more-label');
      const chevron = document.getElementById('iadc-see-more-chevron');
      if (section) { section.style.maxHeight = '0'; section.style.opacity = '0'; }
      if (label)   label.textContent = 'See More';
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      
      // Also reset save button state since user changed a value
      state.isIADCSaved = false;
      const saveBtn = document.getElementById('iadc-save-btn');
      const saveBtnText = document.getElementById('iadc-save-btn-text');
      if (saveBtn) saveBtn.style.opacity = '1';
      if (saveBtnText) saveBtnText.textContent = state.editingIADCRecordId ? 'Update' : 'Save';
    }
  }

  state.iadcCardVisible = true;
  return grade;
};

// Toggle Grade Interpretation expand / collapse
window.toggleIADCInterpretation = () => {
  const section = document.getElementById('iadc-interpretation-section');
  const label   = document.getElementById('iadc-see-more-label');
  const chevron = document.getElementById('iadc-see-more-chevron');
  if (!section) return;

  const isOpen = section.style.maxHeight !== '0px' && section.style.maxHeight !== '0' && section.style.maxHeight !== '';

  if (isOpen) {
    section.style.maxHeight = '0';
    section.style.opacity   = '0';
    if (label)   label.textContent = 'See More';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  } else {
    section.style.maxHeight = section.scrollHeight + 'px';
    section.style.opacity   = '1';
    if (label)   label.textContent = 'See Less';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }
};

// Combined: Generate grade display + Save to history (called by Save button)
window.saveIADCGradeAndRecord = () => {
  if (state.isIADCSaved) {
    showToast('Already saved!');
    return;
  }

  // 1. Generate and show the output card (pass true for isFromSave to avoid resetting state)
  const grade = generateIADCGrade(true, true);

  // 2. Collect form values
  const type     = document.getElementById('bit-info-type')?.value  || '';
  const size     = document.getElementById('bit-info-size')?.value.trim()  || '';
  const mfg      = document.getElementById('bit-info-mfg')?.value.trim()   || '';
  const sn       = document.getElementById('bit-info-sn')?.value.trim()    || '';
  const comments = document.getElementById('bit-grade-comments')?.value    || '';

  // 3. Build record
  const record = {
    id:       state.editingIADCRecordId || Date.now().toString(),
    date:     new Date().toLocaleDateString(),
    type, size, mfg, sn,
    gradeI:  document.getElementById('bit-grade-i')?.value  || '0',
    gradeO:  document.getElementById('bit-grade-o')?.value  || '0',
    gradeD:  document.getElementById('bit-grade-d')?.value  || 'NO',
    gradeL:  document.getElementById('bit-grade-l')?.value  || 'N',
    gradeB:  document.getElementById('bit-grade-b')?.value  || 'X',
    gradeG:  document.getElementById('bit-grade-g')?.value  || 'I',
    gradeO2: document.getElementById('bit-grade-o2')?.value || 'X',
    gradeR:  document.getElementById('bit-grade-r')?.value  || 'TD',
    grade,
    comments,
    photo: state.currentDullPhotoBase64 || null
  };

  // 4. Save to localStorage
  const records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  if (state.editingIADCRecordId) {
    const idx = records.findIndex(r => r.id === state.editingIADCRecordId);
    if (idx !== -1) records[idx] = record; else records.push(record);
    showToast('Data modified');
  } else {
    records.unshift(record);   // newest first
    showToast('Data saved');
  }
  localStorage.setItem('iadcGradingRecords', JSON.stringify(records));

  // 5. Update UI state (disable button visually, don't navigate away)
  state.isIADCSaved = true;
  state.editingIADCRecordId = null;
  const saveBtn = document.getElementById('iadc-save-btn');
  const saveBtnText = document.getElementById('iadc-save-btn-text');
  if (saveBtn) saveBtn.style.opacity = '0.5';
  if (saveBtnText) saveBtnText.textContent = 'Saved';
};

window.saveIADCRecord = () => {
  const mfg = document.getElementById('bit-info-mfg').value.trim();
  const sn = document.getElementById('bit-info-sn').value.trim();
  const size = document.getElementById('bit-info-size').value.trim();
  
  if (!mfg || !sn || !size) {
    showToast('Please fill in all bit information fields');
    return;
  }
  
  const records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  const grade = generateIADCGrade(true);
  
  const record = {
    id: state.editingIADCRecordId || Date.now().toString(),
    type: document.getElementById('bit-info-type').value,
    size: size,
    mfg: mfg,
    sn: sn,
    gradeI: document.getElementById('bit-grade-i').value,
    gradeO: document.getElementById('bit-grade-o').value,
    gradeD: document.getElementById('bit-grade-d').value,
    gradeL: document.getElementById('bit-grade-l').value,
    gradeB: document.getElementById('bit-grade-b').value,
    gradeG: document.getElementById('bit-grade-g').value,
    gradeO2: document.getElementById('bit-grade-o2').value,
    gradeR: document.getElementById('bit-grade-r').value,
    grade: grade,
    comments: document.getElementById('bit-grade-comments').value,
    photo: state.currentDullPhotoBase64,
    date: new Date().toLocaleDateString()
  };
  
  if (state.editingIADCRecordId) {
    const idx = records.findIndex(r => r.id === state.editingIADCRecordId);
    if (idx !== -1) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    showToast((window.I18n && window.I18n.translate) ? window.I18n.translate('Record updated successfully') : 'Record updated successfully');
  } else {
    records.push(record);
    showToast((window.I18n && window.I18n.translate) ? window.I18n.translate('Record saved successfully') : 'Record saved successfully');
  }
  
  localStorage.setItem('iadcGradingRecords', JSON.stringify(records));
  clearIADCForm();
  
  navigateTo('iadc-history');
  renderBitDullGradingHistory();
};

window.editIADCRecord = (recordId) => {
  const records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  const rec = records.find(r => r.id === recordId);
  if (!rec) return;
  
  state.editingIADCRecordId = recordId;
  
  const setSelectVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el || !val) return;
    
    // 1. Direct match
    el.value = val;
    if (el.value === val) return;
    
    // 2. Extract prefix before ' - '
    const prefix = val.split(' - ')[0].trim();
    el.value = prefix;
    if (el.value === prefix) return;
    
    // 3. Match any option whose value/text starts with or is started by the value
    for (let opt of el.options) {
      if (opt.value.startsWith(prefix) || prefix.startsWith(opt.value)) {
        el.value = opt.value;
        return;
      }
    }
  };
  
  const bitTypeEl = document.getElementById('bit-info-type');
  if (bitTypeEl) bitTypeEl.value = rec.type || 'PDC';
  
  // MUST call this before setting the grade dropdowns because it rebuilds them based on bit type
  if (typeof window.onBitTypeChanged === 'function') window.onBitTypeChanged();
  else if (typeof onBitTypeChanged === 'function') onBitTypeChanged();
  
  const bitSizeEl = document.getElementById('bit-info-size');
  if (bitSizeEl) bitSizeEl.value = rec.size || '';
  
  const bitMfgEl = document.getElementById('bit-info-mfg');
  if (bitMfgEl) bitMfgEl.value = rec.mfg || '';
  
  const bitSnEl = document.getElementById('bit-info-sn');
  if (bitSnEl) bitSnEl.value = rec.sn || '';
  
  setSelectVal('bit-grade-i', rec.gradeI || '0');
  setSelectVal('bit-grade-o', rec.gradeO || '0');
  setSelectVal('bit-grade-d', rec.gradeD || 'NO');
  setSelectVal('bit-grade-l', rec.gradeL || 'N');
  setSelectVal('bit-grade-b', rec.gradeB || 'X');
  setSelectVal('bit-grade-g', rec.gradeG || 'I');
  setSelectVal('bit-grade-o2', rec.gradeO2 || 'X');
  setSelectVal('bit-grade-r', rec.gradeR || 'TD');
  
  const commentsEl = document.getElementById('bit-grade-comments');
  if (commentsEl) commentsEl.value = rec.comments || '';
  
  if (typeof window.generateIADCGrade === 'function') window.generateIADCGrade(true, true);
  else if (typeof generateIADCGrade === 'function') generateIADCGrade(true, true);
  state.isIADCSaved = true;
  
  state.currentDullPhotoBase64 = rec.photo || null;
  const previewContainer = document.getElementById('dull-photo-preview-container');
  const previewImg = document.getElementById('dull-photo-preview');
  if (state.currentDullPhotoBase64) {
    if (previewImg) previewImg.src = state.currentDullPhotoBase64;
    if (previewContainer) previewContainer.style.display = 'block';
  } else {
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
  }
  
  navigateTo('bit-dull-grading');
};

window.deleteIADCRecord = (recordId) => {
  const confirmMsg = (window.I18n && window.I18n.translate) ? window.I18n.translate('Are you sure you want to delete this record?') : 'Are you sure you want to delete this record?';
  if (!confirm(confirmMsg)) return;
  
  let records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  records = records.filter(r => r.id !== recordId);
  localStorage.setItem('iadcGradingRecords', JSON.stringify(records));
  
  if (state.editingIADCRecordId === recordId) {
    clearIADCForm();
  }
  
  showToast((window.I18n && window.I18n.translate) ? window.I18n.translate('Record deleted') : 'Record deleted');
  renderBitDullGradingHistory();
};

window.onDullPhotoSelected = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    state.currentDullPhotoBase64 = e.target.result;
    const previewContainer = document.getElementById('dull-photo-preview-container');
    const previewImg = document.getElementById('dull-photo-preview');
    if (previewImg) previewImg.src = e.target.result;
    if (previewContainer) previewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
};

window.removeDullPhoto = () => {
  state.currentDullPhotoBase64 = null;
  const cameraInput = document.getElementById('dull-photo-camera-input');
  const galleryInput = document.getElementById('dull-photo-gallery-input');
  if (cameraInput) cameraInput.value = '';
  if (galleryInput) galleryInput.value = '';
  
  const previewContainer = document.getElementById('dull-photo-preview-container');
  const previewImg = document.getElementById('dull-photo-preview');
  if (previewImg) previewImg.src = '';
  if (previewContainer) previewContainer.style.display = 'none';
};

window.viewFullPhoto = (id) => {
  const records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  const rec = records.find(r => r.id === id);
  if (!rec || !rec.photo) return;
  
  let modal = document.getElementById('iadc-photo-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'iadc-photo-modal';
    if (!modal.style) modal.style = {};
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; cursor:pointer;';
    modal.onclick = () => { modal.style.display = 'none'; };
    
    const img = document.createElement('img');
    img.id = 'iadc-photo-modal-img';
    if (!img.style) img.style = {};
    img.style.cssText = 'max-width:90%; max-height:90%; border-radius:8px; border:2px solid #fff; box-shadow:0 8px 30px rgba(0,0,0,0.5);';
    modal.appendChild(img);
    document.body.appendChild(modal);
  }
  
  const modalImg = document.getElementById('iadc-photo-modal-img');
  if (modalImg) {
    modalImg.src = rec.photo;
    if (!modalImg.style) modalImg.style = {};
  }
  if (modal) {
    if (!modal.style) modal.style = {};
    modal.style.display = 'flex';
  }
};

window.renderBitDullGradingHistory = () => {
  const container = document.getElementById('iadc-history-list-container');
  if (!container) return;
  
  const records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  container.innerHTML = '';
  
  if (records.length === 0) {
    const noRecsText = (window.I18n && window.I18n.translate) ? window.I18n.translate('No grading history records found.') : 'No grading history records found.';
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:var(--text-secondary);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.5;">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p>${noRecsText}</p>
      </div>
    `;
    return;
  }
  
  records.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'content-card';
    if (!card.style) card.style = {};
    card.style.cssText = 'margin-bottom:12px; display:flex; flex-direction:column; gap:8px; position:relative;';
    
    let photoHtml = '';
    if (rec.photo) {
      photoHtml = `
        <div style="width:60px; height:60px; border-radius:6px; overflow:hidden; border:1px solid var(--border-color); cursor:pointer; flex-shrink:0;" onclick="viewFullPhoto('${rec.id}')">
          <img src="${rec.photo}" style="width:100%; height:100%; object-fit:cover;">
        </div>
      `;
    }
    
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div style="display:flex; gap:12px; flex:1;">
          ${photoHtml}
          <div>
            <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">
              ${rec.size}" ${rec.type} - ${rec.mfg}
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">
              S/N: ${rec.sn} | ${rec.date}
            </div>
            <div style="font-size:1.1rem; font-weight:800; color:var(--accent-color); font-family:monospace; margin-top:4px;">
              ${rec.grade}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary" style="padding:6px; min-width:32px; height:32px; display:flex; align-items:center; justify-content:center;" onclick="editIADCRecord('${rec.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn btn-secondary" style="padding:6px; min-width:32px; height:32px; display:flex; align-items:center; justify-content:center; color:var(--error-color, #ff4d4d);" onclick="deleteIADCRecord('${rec.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      ${rec.comments ? `<div style="font-size:0.85rem; color:var(--text-secondary); background:var(--bg-subtle); padding:6px 10px; border-radius:4px; margin-top:4px;">${rec.comments}</div>` : ''}
    `;
    container.appendChild(card);
  });
};

window.printIADCReport = () => {
  const type = document.getElementById('bit-info-type').value;
  const size = document.getElementById('bit-info-size').value;
  const mfg = document.getElementById('bit-info-mfg').value;
  const sn = document.getElementById('bit-info-sn').value;
  const grade = generateIADCGrade(true);
  const comments = document.getElementById('bit-grade-comments').value;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Failed to open print window');
    return;
  }
  
  let imgHtml = '';
  if (state.currentDullPhotoBase64) {
    imgHtml = `<div class="photo-container"><img src="${state.currentDullPhotoBase64}"></div>`;
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>IADC Bit Dull Grading Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .grid-item { background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #ddd; }
          .label { font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 600; color: #111; }
          .grade-container { text-align: center; padding: 25px; border: 2px dashed #e6a15c; background: #fffcf8; border-radius: 8px; margin-bottom: 30px; }
          .grade-code { font-size: 36px; font-weight: 800; color: #e6a15c; font-family: monospace; letter-spacing: 2px; }
          .comments-container { background: #f5f5f5; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
          .photo-container { text-align: center; margin-top: 20px; }
          .photo-container img { max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">IADC Bit Dull Grading Report</div>
          <div class="subtitle">Drilling Toolkit - Generated on ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="grade-container">
          <div class="label">Calculated IADC Dull Grade</div>
          <div class="grade-code">${grade}</div>
        </div>
        
        <div class="grid">
          <div class="grid-item">
            <div class="label">Bit Type</div>
            <div class="value">${type}</div>
          </div>
          <div class="grid-item">
            <div class="label">Bit Size</div>
            <div class="value">${size}"</div>
          </div>
          <div class="grid-item">
            <div class="label">Manufacturer</div>
            <div class="value">${mfg}</div>
          </div>
          <div class="grid-item">
            <div class="label">Serial Number</div>
            <div class="value">${sn}</div>
          </div>
        </div>
        
        ${comments ? `
          <div class="comments-container">
            <div class="label" style="margin-bottom: 8px;">Comments / Remarks</div>
            <div style="font-size:15px; line-height:1.5;">${comments}</div>
          </div>
        ` : ''}
        
        ${imgHtml}
        
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

window.shareIADCReport = () => {
  const grade = generateIADCGrade(true);
  const text = `IADC Dull Grade Report: ${grade}`;
  if (navigator.share) {
    navigator.share({
      title: 'IADC Dull Grade Report',
      text: text,
      url: window.location.href
    }).catch(err => {
      console.log('Error sharing:', err);
    });
  } else {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast((window.I18n && window.I18n.translate) ? window.I18n.translate('Link copied to clipboard!') : 'Link copied to clipboard!');
      }).catch(err => {
        showToast('Sharing not supported on this device');
      });
    } else {
      showToast('Sharing not supported on this device');
    }
  }
};

window.updateShutInProcedure = () => {
  const container = document.getElementById('shutin-steps-container');
  if (!container) return;

  const rig = document.getElementById('shutin-rig')?.value || 'land';
  const op = document.getElementById('shutin-op')?.value || 'drilling';
  const method = document.getElementById('shutin-method')?.value || 'hard';

  let steps = [];

  if (rig === 'subsea') {
    if (op === 'drilling') {
      if (method === 'hard') {
        steps = [
          { title: "Stop Rotary Table", desc: "Stop rotary table." },
          { title: "Raise Kelly / Space Out", desc: "Raise kelly to hang off point ensuring that lower kelly cock is above rotary table and Kelly is at the pre-designated level so that tool joint is clear of ram preventers." },
          { title: "Stop Mud Pump", desc: "Stop mud pump, check self-flow. If yes, proceed further to shut in the well." },
          { title: "Close Annular BOP", desc: "Close annular BOP (Preferably upper annular)." },
          { title: "Open Fail-Safe Valve", desc: "Open fail-safe valve on choke line when remote choke is in close position." },
          { title: "Close Upper Pipe Rams", desc: "Close the upper pipe rams." },
          { title: "Hang String & Lock Rams", desc: "Reduce hydraulic pressure on annular, hang the string and ensure rams are locked." },
          { title: "Bleed Pressure & Open Annular", desc: "Open annular after bleeding trapped pressure between annular and pipe ram." },
          { title: "Record Pressures", desc: "Record SIDPP, SICP and Pit Gain." }
        ];
      } else { // soft
        steps = [
          { title: "Stop Rotary Table", desc: "Stop rotary table." },
          { title: "Raise Kelly / Space Out", desc: "Raise kelly to hang off point ensuring tool joint is clear of ram preventers." },
          { title: "Stop Mud Pump", desc: "Stop mud pump, check self-flow. If yes, proceed further to shut in the well." },
          { title: "Open Fail-Safe Valve", desc: "Open fail-safe valve on choke line when remote choke is in partially open position." },
          { title: "Close Annular BOP", desc: "Close annular BOP (Preferably upper annular)." },
          { title: "Close Remote Choke", desc: "Gradually close adjustable remote choke, monitoring casing pressure." },
          { title: "Close Upper Pipe Rams", desc: "Close the upper pipe rams. Reduce operating pressure on annular BOP." },
          { title: "Hang String & Open Annular", desc: "Reduce hydraulic pressure on annular, hang string and open annular after bleeding trapped pressure." },
          { title: "Record Pressures", desc: "Record SIDPP, SICP and Pit Gain." }
        ];
      }
    } else if (op === 'tripping') {
      if (method === 'hard') {
        steps = [
          { title: "Set Slips", desc: "Set slips below tool joint." },
          { title: "Install FOSV", desc: "Install full open safety valve (FOSV) in open position, close it & remove slips." },
          { title: "Close Annular BOP", desc: "Close annular BOP." },
          { title: "Open Fail-Safe Valve", desc: "Open fail-safe valve on choke line when remote choke is in close position." },
          { title: "Space Out String", desc: "Calculate the length of the pup joint and /or length of stick up above rotary table to ensure that the tool joint is clear off the pipe ram to be closed." },
          { title: "Make Up Kelly & Open FOSV", desc: "Make up kelly & open FOSV." },
          { title: "Close Upper Pipe Rams", desc: "Close upper pipe rams. Reduce operating pressure on annular BOP." },
          { title: "Hang String & Open Annular", desc: "Lower drill string & hang it off on the rams. Open Annular BOP after bleeding pressure." },
          { title: "Record Pressures", desc: "Record SIDPP, SICP and pit gain." }
        ];
      } else { // soft
        steps = [
          { title: "Set Slips", desc: "Set slips below tool joint." },
          { title: "Install FOSV", desc: "Install full open safety valve (FOSV) in open position, close it & remove slips." },
          { title: "Open Fail-Safe Valve", desc: "Open fail-safe valve on choke line when remote choke is in partially open position." },
          { title: "Close Annular BOP", desc: "Close annular BOP." },
          { title: "Close Remote Choke", desc: "Gradually close adjustable remote choke, monitoring casing pressure." },
          { title: "Space Out String", desc: "Calculate the length of the pup joint and /or length of stick up above rotary table to ensure that the tool joint is clear off the pipe ram to be closed." },
          { title: "Make Up Kelly & Open FOSV", desc: "Make up kelly & open FOSV." },
          { title: "Close Upper Pipe Rams", desc: "Close upper pipe rams. Reduce operating pressure on annular BOP." },
          { title: "Hang String & Open Annular", desc: "Lower drill string & hang it off on the rams. Open Annular BOP after bleeding pressure." },
          { title: "Record Pressures", desc: "Record SIDPP, SICP and pit gain." }
        ];
      }
    } else { // ooh
      if (method === 'hard') {
        steps = [
          { title: "Close Blind Shear Rams", desc: "At the first indication of flow from the well, close the blind shear rams." },
          { title: "Open Selected Valves", desc: "Open selected subsea Choke & Kill line valves." },
          { title: "Monitor Riser & Close Diverter", desc: "Monitor flow from the riser & close the diverter as a precautionary measure (ensure riser booster valve is closed)." },
          { title: "Record Pressures & Prepare", desc: "Record shut-in casing pressure on both Choke & Kill lines, and pit gain. Prepare for stripping, volumetric or bull heading operations." }
        ];
      } else { // soft
        steps = [
          { title: "Open Fail-Safe Valve", desc: "Open fail-safe valve on choke line when remote choke is in partially open position." },
          { title: "Close Blind Shear Rams", desc: "At the first indication of flow from the well, close the blind shear rams." },
          { title: "Close Remote Choke", desc: "Gradually close adjustable remote choke, monitoring casing pressure." },
          { title: "Monitor Riser & Close Diverter", desc: "Monitor flow from the riser & close the diverter as a precautionary measure (ensure riser booster valve is closed)." },
          { title: "Record Pressures & Prepare", desc: "Record shut-in casing pressure on both Choke & Kill lines, and pit gain. Prepare for stripping, volumetric or bull heading operations." }
        ];
      }
    }
  } else {
    // land / jack-up
    if (op === 'drilling') {
      if (method === 'hard') {
        steps = [
          { title: "Space Out", desc: "Position tool joints clear of BOP rams; stop rotation." },
          { title: "Stop Pumps", desc: "Shut down mud pumps, then verify if well is flowing." },
          { title: "Close BOP", desc: "Close annular preventer or pipe rams." },
          { title: "Open HCR", desc: "Open HCR / manual valve on choke line when choke is in fully closed position." },
          { title: "Record Pressures", desc: "Allow pressure to stabilize and record SIDPP, SICP, and pit gain." }
        ];
      } else { // soft
        steps = [
          { title: "Space Out", desc: "Position tool joints clear of BOP rams; stop rotation." },
          { title: "Stop Pumps", desc: "Shut down mud pumps, then verify if well is flowing." },
          { title: "Open HCR", desc: "Open hydraulic control valve (HCR valve) / manual valve on choke line." },
          { title: "Close BOP", desc: "Close Blow Out Preventer (Preferably Annular Preventer)." },
          { title: "Close Remote Choke", desc: "Gradually close adjustable remote choke, monitoring casing pressure." },
          { title: "Record Pressures", desc: "Allow the pressure to stabilize and record SIDPP, SICP and Pit gain." }
        ];
      }
    } else if (op === 'tripping') {
      if (method === 'hard') {
        steps = [
          { title: "Position Tool Joint", desc: "Position tool joint above rotary table and set pipe on slips." },
          { title: "Install FOSV", desc: "Install full opening safety valve (FOSV) in open position & close it." },
          { title: "Close BOP", desc: "Close Blow Out preventer (Preferably Annular Preventer)." },
          { title: "Open HCR", desc: "Open choke line HCR valve with choke in fully closed position." },
          { title: "Make up Kelly", desc: "Make up kelly and open FOSV." },
          { title: "Record Pressures", desc: "Allow pressure to stabilise and record SIDPP, SICP and Pit gain." }
        ];
      } else { // soft
        steps = [
          { title: "Position Tool Joint", desc: "Position tool joint above rotary table and set pipe on slips." },
          { title: "Install FOSV", desc: "Install full opening safety valve (FOSV) in open position & close it." },
          { title: "Open HCR", desc: "Open HCR Valve / Manual valve on choke line." },
          { title: "Close BOP", desc: "Close Blow Out Preventer (Preferably Annular Preventer)." },
          { title: "Close Remote Choke", desc: "Gradually close adjustable remote choke, monitoring casing pressure." },
          { title: "Make up Kelly", desc: "Make up kelly and open FOSV." }
        ];
      }
    } else { // ooh
      if (method === 'hard') {
        steps = [
          { title: "Close BOP", desc: "Close Blind / BSR." },
          { title: "Open HCR", desc: "Open HCR valve on choke line." },
          { title: "Record Pressures", desc: "Record SICP and pit gain." }
        ];
      } else { // soft
        steps = [
          { title: "Open HCR", desc: "Open HCR valve on choke line." },
          { title: "Close BOP", desc: "Close shear or blind ram." },
          { title: "Close Remote Choke", desc: "Close remote choke." },
          { title: "Record Pressures", desc: "Record SICP and pit gain." }
        ];
      }
    }
  }

  let html = '<span class="guide-step-list">';
  steps.forEach((step, idx) => {
    html += `
      <div class="guide-step-item">
        <span class="guide-step-num">${idx + 1}</span>
        <div class="guide-step-content">
          <span class="guide-step-title">${step.title}</span>
          <span class="guide-step-desc">${step.desc}</span>
        </div>
      </div>
    `;
  });
  html += '</span>';

  container.innerHTML = html;
};
