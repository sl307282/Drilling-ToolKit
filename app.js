// Global Emergency Error Handler to ensure the splash screen is ALWAYS hidden if a crash occurs
window.addEventListener('error', (event) => {
  try {
    console.log('CRITICAL UNHANDLED ERROR:', event.message, 'at', event.filename, ':', event.lineno);
    if (event.error && event.error.stack) {
      console.log('ERROR STACK:', event.error.stack);
    }
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      window.Capacitor.Plugins.SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => { });
    }
  } catch (e) { }
});

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
  globalUnit: localStorage.getItem('globalUnit') || 'L/m', // L/m, bbl/m, bbl/ft
  flowType: 'surface', // surface, subsea, or other modules
  
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
  const current = state.currentScreen;
  const primaryScreens = ['dashboard'];
  if (primaryScreens.includes(screenId)) {
    state.screenHistory = [];
  } else {
    state.screenHistory.push(current);
  }

  // Clear search on screen transition
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

  _navDirection = 'forward';
  state.currentScreen = screenId;
  renderScreen();
};

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

const navigateBack = () => {
  if (state.screenHistory.length > 0) {
    _navDirection = 'back';
    state.currentScreen = state.screenHistory.pop();
    renderScreen();
  }
};

// Helper controllers for drawer, modals and theme
const updateDynamicBackground = (theme, bgTheme) => {
  const bodyColors = {
    light: { default: '#FDFBF8', cream: '#FAF4EB', mist: '#F0F4F7', sage: '#F1F5F1', lavender: '#F5F1F7', peach: '#FAF2ED' },
    dark: { default: '#12100E', cream: '#1C1814', mist: '#141A22', sage: '#141A16', lavender: '#17141E', peach: '#1D1511' }
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

  // Sync Capacitor Status Bar if loaded
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
    const StatusBar = window.Capacitor.Plugins.StatusBar;
    try {
      StatusBar.setStyle({ style: theme === 'dark' ? 'DARK' : 'LIGHT' }).catch(() => { });
      StatusBar.setBackgroundColor({ color: bodyBg }).catch(() => { });
    } catch (err) {
      console.warn('Capacitor StatusBar error:', err);
    }
  }
};

const initThemeToggler = () => {
  const checkbox = document.getElementById('theme-toggle-checkbox');
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // Call updateDynamicBackground on startup to sync meta tag and Capacitor status bar colors
  const currentBg = localStorage.getItem('bgTheme') || 'default';
  updateDynamicBackground(currentTheme, currentBg);

  if (checkbox) {
    checkbox.checked = currentTheme === 'dark';
    checkbox.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'dark' : 'light';

      // Gate transitions: add class so CSS transition only fires on this deliberate toggle
      const html = document.documentElement;
      html.classList.add('theme-transitioning');

      // Apply theme on next frame so the transition class is painted first
      requestAnimationFrame(() => {
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        const currentBg = localStorage.getItem('bgTheme') || 'default';
        updateDynamicBackground(newTheme, currentBg);

        showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode activated`);
      });

      // Remove transitioning class after animation completes (250ms + buffer)
      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 350);
    });
  }
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

  const closeDrawer = () => {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
  };

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

  if (unitControl) {
    unitControl.addEventListener('click', (e) => {
      const btn = e.target.closest('.segmented-control-btn');
      if (!btn) return;

      const newUnit = btn.getAttribute('data-unit');
      const oldUnit = state.globalUnit;
      if (newUnit === oldUnit) return;

      state.globalUnit = newUnit;
      localStorage.setItem('globalUnit', newUnit);

      const buttons = unitControl.querySelectorAll('.segmented-control-btn');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      renderScreen();
      showToast(`Capacity unit set to: ${newUnit}`);
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

      const html = document.documentElement;
      html.classList.add('theme-transitioning');

      requestAnimationFrame(() => {
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
        const displayName = themeNames[newColor] || newColor;
        const colorNameEl = document.getElementById('active-color-name');
        if (colorNameEl) {
          colorNameEl.innerText = displayName;
        }

        showToast(`${displayName} theme activated`);
      });

      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 350);
    });
  }

  if (bgControl) {
    bgControl.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-option-btn');
      if (!btn) return;

      const newBg = btn.getAttribute('data-bg');
      const oldBg = localStorage.getItem('bgTheme') || 'default';
      if (newBg === oldBg) return;

      const html = document.documentElement;
      html.classList.add('theme-transitioning');

      requestAnimationFrame(() => {
        html.setAttribute('data-bg-theme', newBg);
        localStorage.setItem('bgTheme', newBg);

        const swatches = bgControl.querySelectorAll('.theme-option-btn');
        swatches.forEach(swatch => swatch.classList.remove('active'));
        btn.classList.add('active');

        const theme = html.getAttribute('data-theme') || 'light';
        updateDynamicBackground(theme, newBg);

        const bgNames = {
          default: 'Default',
          cream: 'Cream',
          mist: 'Mist',
          sage: 'Sage',
          lavender: 'Lavender',
          peach: 'Peach'
        };
        const displayName = bgNames[newBg] || newBg;
        const bgNameEl = document.getElementById('active-bg-name');
        if (bgNameEl) {
          bgNameEl.innerText = displayName;
        }

        showToast(`${displayName} background theme activated`);
      });

      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 350);
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
      showToast(`Language set to: ${displayName}`);
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
  const unitControl = document.getElementById('settings-unit-control');
  const colorControl = document.getElementById('settings-color-control');
  const bgControl = document.getElementById('settings-bg-control');

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

  if (unitControl) {
    const buttons = unitControl.querySelectorAll('.segmented-control-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-unit') === state.globalUnit) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

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
    colorNameEl.innerText = themeNames[currentColor] || currentColor;
  }
  const bgNameEl = document.getElementById('active-bg-name');
  if (bgNameEl) {
    bgNameEl.innerText = bgNames[currentBg] || currentBg;
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
      selectedRating = 0;
      stars.forEach(s => s.classList.remove('active'));
      if (feedbackInput) feedbackInput.value = '';
      rateModal.classList.add('active');
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
      shareModal.classList.add('active');
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

const APP_VERSION = '1.0.2';
const APP_VERSION_CODE = 3;

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
    let localVersion = APP_VERSION;
    let localVersionCode = APP_VERSION_CODE;

    // Dynamically retrieve the actual installed app version from the device
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      try {
        const info = await window.Capacitor.Plugins.App.getInfo();
        if (info && info.version) {
          localVersion = info.version;
        }
        if (info && info.build) {
          localVersionCode = Number(info.build) || APP_VERSION_CODE;
        }
      } catch (e) {
        console.error('Failed to get native app version:', e);
      }
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
    const latestVersion = remoteConfig.getValue('latest_version').asString();
    const minimumVersion = remoteConfig.getValue('minimum_version').asString();
    const latestVersionCode = remoteConfig.getValue('latest_version_code').asNumber();
    const minimumVersionCode = remoteConfig.getValue('minimum_version_code').asNumber();
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

    const forceUpdate = isOutdatedSemantic(localVersion, minimumVersion) || (localVersionCode < minimumVersionCode);
    const optionalUpdate = isOutdatedSemantic(localVersion, latestVersion) || (localVersionCode < latestVersionCode);

    if (forceUpdate || optionalUpdate) {
      showUpdatePopup(localVersion, latestVersion, false, releaseNotes);
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
  // Safe helper to hide native splash screen
  const hideSplash = () => {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      window.Capacitor.Plugins.SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => { });
    }
  };



  // Safe Fallback Timer: Hide native splash screen after maximum 4 seconds no matter what
  setTimeout(hideSplash, 4000);

  try {
    // Bind core Global events safely
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

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

    // Initial render
    renderScreen();
    CardOverrideManager.apply();

    // Run app update check
    checkForUpdates();

    // Wait 1200ms for the webview to finish painting the UI before fading out the logo
    setTimeout(hideSplash, 1200);
  } catch (error) {
    console.error('Fatal initialization error in DOMContentLoaded:', error);
    // Ensure native splash screen gets hidden even in case of critical init error
    hideSplash();
  }

  // ── Back Navigation System ─────────────────────────────────────────

  // 1. Capacitor hardware/gesture back button
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('backButton', () => {
      // Close modals first
      const langOverlay = document.getElementById('lang-picker-overlay');
      if (langOverlay && langOverlay.classList.contains('active')) {
        langOverlay.classList.remove('active');
        return;
      }
      const openModal = document.querySelector('.modal-overlay.active');
      if (openModal) {
        openModal.classList.remove('active');
        return;
      }
      const drawer = document.getElementById('drawer-menu');
      if (drawer && drawer.classList.contains('active')) {
        drawer.classList.remove('active');
        document.getElementById('drawer-backdrop')?.classList.remove('active');
        return;
      }
      // Navigate back in screen stack
      if (state.screenHistory.length > 0) {
        navigateBack();
      } else {
        window.Capacitor.Plugins.App.exitApp();
      }
    });
  }

  // 2. Edge swipe gestures (Android back gesture convention - Left & Right edges)
  (function initEdgeSwipe() {
    const EDGE_WIDTH = 40;       // px from edge that starts a valid swipe (increased for reliability)
    const MIN_SWIPE_X = 60;      // minimum horizontal travel to trigger back
    const MAX_SWIPE_Y = 80;      // maximum vertical drift allowed
    const MIN_VELOCITY = 0.30;   // px/ms (lowered threshold for smoother triggers)

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
      // Only enable if we have history to navigate back to
      if (state.screenHistory.length > 0) {
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

      // Stop Android WebView from scroll-cancelling our edge swipe back
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
        navigateBack();
      }
      swipeEdge = null;
    }, { passive: true });
  })();

};

// Execute initialization immediately or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Levenshtein distance for fuzzy matching
function getEditDistance(a, b) {
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
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Check if string matches search query
function fuzzyMatch(str, query) {
  str = str.toLowerCase();
  query = query.toLowerCase().trim();
  if (!query) return false;
  if (str.includes(query)) return true;

  const words = query.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    if (str.includes(word)) return true;

    // Check edit distance for words of target
    const targetWords = str.split(/[\s_\-\/\(\)\.,]+/);
    for (const targetWord of targetWords) {
      if (Math.abs(targetWord.length - word.length) <= 2) {
        const distance = getEditDistance(targetWord, word);
        if (distance <= 1 || (word.length > 5 && distance <= 2)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Flat search index
function getSearchIndex() {
  const searchableItems = [
    {
      name: 'Surface Stack',
      desc: 'BOP configuration and calculations for surface stack setups.',
      type: 'tool',
      badge: 'BOP Tool',
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"></path><path d="M5 20v-2h14v2"></path><path d="M8 18L11 5h2l3 13"></path><path d="M9.2 13h5.6"></path><path d="M10.2 8h3.6"></path><path d="M11 5h2"></path><path d="M9.2 18l4.4-5"></path><path d="M13.6 18l-4.4-5"></path><path d="M10.2 13l2.8-5"></path><path d="M13 13l-2.8-5"></path></svg>`,
      action: () => { state.flowType = 'surface'; navigateTo('surface-hole-size'); }
    },
    {
      name: 'Subsea Stack',
      desc: 'BOP configuration and calculations for subsea stack setups.',
      type: 'tool',
      badge: 'BOP Tool',
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0"></path><path d="M2 22c2-1 4-1 6 0s4 1 6 0 4-1 6 0"></path><rect x="10" y="7" width="4" height="9" rx="1"></rect><rect x="8" y="10" width="8" height="2" rx="0.5"></rect><rect x="8" y="13" width="8" height="2" rx="0.5"></rect><path d="M12 4v3"></path><circle cx="12" cy="4" r="1" fill="currentColor"></circle><path d="M7 6v10"></path><path d="M17 6v10"></path><circle cx="7" cy="11" r="1.5"></circle><circle cx="17" cy="11" r="1.5"></circle></svg>`,
      action: () => { state.flowType = 'subsea'; navigateTo('subsea-hole-size'); }
    },
    {
      name: 'API Tubular Data',
      desc: 'Standard API dimensions, capacities, and weights for drillpipe, casing, and tubing.',
      type: 'tool',
      badge: 'Tubulars',
      bgColor: 'var(--circle-tubular)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 13.5L19 7.5"></path><path d="M13.5 9L21.5 4.2"></path><path d="M5.5 15.5L15.5 9.5"></path><circle cx="11.5" cy="10.5" r="2.5"></circle><circle cx="11.5" cy="10.5" r="1.3"></circle><circle cx="7.5" cy="17.5" r="2.5"></circle><circle cx="7.5" cy="17.5" r="1.3"></circle><circle cx="13.5" cy="15.5" r="2.5"></circle><circle cx="13.5" cy="15.5" r="1.3"></circle><path d="M15 13.5L20 10.5"></path></svg>`,
      action: () => { navigateTo('api-tubular'); }
    },
    {
      name: 'Stuck Pipe Analysis',
      desc: 'Diagnostic tool for spotting stuck pipe mechanisms and recommended first actions.',
      type: 'tool',
      badge: 'Diagnostics',
      bgColor: 'var(--circle-stuck)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18M19 3v18"></path><path d="M12 3v10"></path><path d="M9 13h6l-3 4z"></path><circle cx="7" cy="15" r="1" fill="currentColor"></circle><circle cx="17" cy="14" r="1" fill="currentColor"></circle><circle cx="7.5" cy="12" r="0.75" fill="currentColor"></circle><circle cx="16.5" cy="17" r="0.75" fill="currentColor"></circle><path d="M2 5l3 2M2 11l3 2M2 17l3 2"></path><path d="M19 7l3-2M19 13l3-2M19 19l3-2"></path></svg>`,
      action: () => { navigateTo('stuck-pipe'); }
    },
    {
      name: 'Drilling Guide',
      desc: 'Comprehensive reference guide for drilling operations, bits, BHA, well control, cementing, and troubleshooting.',
      type: 'tool',
      badge: 'Reference',
      bgColor: 'var(--circle-stuck)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7E5F2B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
      action: () => { navigateTo('drilling-guide'); }
    },
    {
      name: 'Unit Conversion',
      desc: 'Petroleum engineering unit converter for length, volume, weight, pressure, and density.',
      type: 'tool',
      badge: 'Converter',
      bgColor: 'var(--circle-conversion)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5F3F7D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 8"></path><polyline points="3 3 3 8 8 8"></polyline><path d="M3 12a9 9 0 0 0 9 9 9 9 0 0 0 6-2.3l3-2.7"></path><polyline points="21 21 21 16 16 16"></polyline><text x="12" y="10" font-family="Outfit, system-ui, sans-serif" font-weight="bold" font-size="4.5" text-anchor="middle" fill="currentColor">psi</text><text x="12" y="14" font-family="Outfit, system-ui, sans-serif" font-weight="bold" font-size="4" text-anchor="middle" fill="currentColor">bar</text><text x="12" y="18" font-family="Outfit, system-ui, sans-serif" font-weight="bold" font-size="3" text-anchor="middle" fill="currentColor">kPa</text></svg>`,
      action: () => { navigateTo('conversion'); }
    },
    {
      name: 'Well Control Calculators',
      desc: 'Kill Mud Weight (KMW), Initial Circulating Pressure (ICP), and Final Circulating Pressure (FCP) calculators.',
      type: 'tool',
      badge: 'Well Control',
      bgColor: 'var(--circle-wellcontrol)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A2C2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="3"></circle><line x1="12" y1="8" x2="12" y2="14"></line><line x1="9" y1="11" x2="15" y2="11"></line></svg>`,
      action: () => { navigateTo('well-control'); }
    },
    {
      name: 'Drilling Calculator Categories',
      desc: 'Browse all formulas categorized by Basic, Well Control, and Applied.',
      type: 'tool',
      badge: 'Calculator',
      bgColor: 'var(--circle-calculator)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A4A28" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"></rect><rect x="7" y="5" width="10" height="4" rx="1"></rect><rect x="7" y="11" width="2" height="2" rx="0.5"></rect><rect x="11" y="11" width="2" height="2" rx="0.5"></rect><rect x="15" y="11" width="2" height="2" rx="0.5"></rect><rect x="7" y="15" width="2" height="2" rx="0.5"></rect><rect x="11" y="15" width="2" height="2" rx="0.5"></rect><rect x="15" y="15" width="2" height="2" rx="0.5"></rect></svg>`,
      action: () => { navigateTo('drilling-calc'); }
    },
    {
      name: 'Quick Reference',
      desc: 'Drill Bit Make-Up Torque Reference Table.',
      type: 'tool',
      badge: 'Quick Ref',
      bgColor: 'var(--circle-subsea)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
      action: () => { quickRefSubState.view = 'menu'; navigateTo('quick-ref'); }
    },
    {
      name: 'Ring Gaskets & Connections',
      desc: 'API 16A Flange & Hub Ring Gasket Reference Table.',
      type: 'tool',
      badge: 'Quick Ref',
      bgColor: 'var(--circle-quickref)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="5" r="0.75" fill="currentColor"></circle><circle cx="12" cy="19" r="0.75" fill="currentColor"></circle><circle cx="5" cy="12" r="0.75" fill="currentColor"></circle><circle cx="19" cy="12" r="0.75" fill="currentColor"></circle></svg>`,
      action: () => { quickRefSubState.view = 'ring-gaskets'; navigateTo('quick-ref'); }
    },
    {
      name: 'Surface Wellhead Information',
      desc: 'Technical components, stud sizes, and packaging details for A, B, and C Wellhead Sections.',
      type: 'tool',
      badge: 'Quick Ref',
      bgColor: 'var(--circle-quickref)',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--stroke-quickref)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12"></path><path d="M8 21h8"></path><rect x="9" y="8" width="6" height="10" rx="1"></rect><path d="M9 11H6V9h3"></path><path d="M15 11h3V9h-3"></path><path d="M8 5h8v3H8z"></path></svg>`,
      action: () => { quickRefSubState.view = 'wellhead'; navigateTo('quick-ref'); }
    }
  ];

  // Append all formulas dynamically from formulaDb
  if (typeof formulaDb !== 'undefined') {
    for (const category in formulaDb) {
      const categoryLabel = category === 'basic' ? 'Basic Formula' :
        category === 'wellcontrol' ? 'Well Control' : 'Applied Formula';
      formulaDb[category].forEach(formula => {
        searchableItems.push({
          name: formula.name,
          desc: formula.desc || 'Drilling calculation formula.',
          type: 'formula',
          badge: categoryLabel,
          bgColor: category === 'basic' ? 'var(--circle-tubular)' :
            category === 'wellcontrol' ? 'var(--circle-wellcontrol)' : 'var(--circle-calculator)',
          icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
          action: () => {
            calcSubState.view = 'formula';
            calcSubState.category = category;
            calcSubState.formulaId = formula.id;
            calcSubState.search = '';
            navigateTo('drilling-calc');
          }
        });
      });
    }
  }

  return searchableItems;
}

// Global search handling
function handleSearch(e) {
  const query = e.target.value.trim();
  state.searchQuery = query;

  const resultsContainer = document.getElementById('global-search-results');
  const menuGrid = document.querySelector('.menu-grid');

  if (!resultsContainer || !menuGrid) return;

  if (query === '') {
    resultsContainer.style.display = 'none';
    resultsContainer.innerHTML = '';
    menuGrid.style.display = '';
    return;
  }

  // Hide main card grid
  menuGrid.style.display = 'none';

  const index = getSearchIndex();
  const matched = index.filter(item =>
    fuzzyMatch(item.name, query) || fuzzyMatch(item.desc, query)
  );

  resultsContainer.innerHTML = '';
  resultsContainer.style.display = 'flex';

  if (matched.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </span>
        <div class="no-results-text">No tools or formulas match your search.</div>
      </div>
    `;
    return;
  }

  matched.forEach(item => {
    const el = document.createElement('div');
    el.className = 'search-result-item';

    // Determine class for badge
    const badgeClass = item.type === 'tool' ? 'badge-tool' : 'badge-formula';

    el.innerHTML = `
      <div class="search-result-left">
        <div class="search-result-icon" style="background-color: ${item.bgColor}">
          ${item.icon}
        </div>
        <div class="search-result-info">
          <div class="search-result-meta">
            <span class="search-result-badge ${badgeClass}">${item.badge}</span>
          </div>
          <div class="search-result-title">${item.name}</div>
          <div class="search-result-desc">${item.desc}</div>
        </div>
      </div>
      <span class="search-result-chevron">&rsaquo;</span>
    `;

    el.addEventListener('click', () => {
      item.action();
    });

    resultsContainer.appendChild(el);
  });
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

    if (screenId === 'kill-data-sheet') {
      activeScreenEl.classList.add('animate-slide-down');
    } else if (_navDirection === 'back') {
      activeScreenEl.classList.add('animate-slide-in-left');
    } else if (_navDirection === 'forward') {
      activeScreenEl.classList.add('animate-slide-in-right');
    }
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

  // Dynamically toggle visibility of the back button on primary screens
  const activeScreenHeaderBtn = activeScreenEl ? activeScreenEl.querySelector('.back-btn') : null;
  if (activeScreenHeaderBtn) {
    if (primaryScreens.includes(screenId)) {
      // In drilling-calc, show back button only if we are in list or formula sub-view or have search query active
      if (screenId === 'drilling-calc' && (calcSubState.view !== 'categories' || calcSubState.search !== '')) {
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
      // Handled directly or via clear/edit init
      break;
    case 'iadc-history':
      renderBitDullGradingHistory();
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

  // Initially hide the GO button
  goBtn.style.display = 'none';

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
      const el = document.getElementById(id);
      if (!el || el.value === '' || isNaN(parseFloat(el.value))) return fallback;
      return parseFloat(el.value);
    };

    // Save tubular capacities back (convert back to L/m first)
    state.reference.capacities.DP = convertCapacityBack(getVal('cap-dp-input', convertCapacity(state.reference.capacities.DP, state.globalUnit)), state.globalUnit);
    if (document.getElementById('cap-dp2-input')) {
      state.reference.capacities.DP2 = convertCapacityBack(getVal('cap-dp2-input', convertCapacity(state.reference.capacities.DP2, state.globalUnit)), state.globalUnit);
    }
    if (document.getElementById('cap-dp3-input')) {
      state.reference.capacities.DP3 = convertCapacityBack(getVal('cap-dp3-input', convertCapacity(state.reference.capacities.DP3, state.globalUnit)), state.globalUnit);
    }
    state.reference.capacities.HWDP = convertCapacityBack(getVal('cap-hwdp-input', convertCapacity(state.reference.capacities.HWDP, state.globalUnit)), state.globalUnit);
    state.reference.capacities.DC = convertCapacityBack(getVal('cap-dc-input', convertCapacity(state.reference.capacities.DC, state.globalUnit)), state.globalUnit);
    if (document.getElementById('cap-dc2-input')) {
      state.reference.capacities.DC2 = convertCapacityBack(getVal('cap-dc2-input', convertCapacity(state.reference.capacities.DC2, state.globalUnit)), state.globalUnit);
    }
    if (document.getElementById('cap-dc3-input')) {
      state.reference.capacities.DC3 = convertCapacityBack(getVal('cap-dc3-input', convertCapacity(state.reference.capacities.DC3, state.globalUnit)), state.globalUnit);
    }

    // Save Open Hole capacities
    state.reference.openHoleAnnular.DP = convertCapacityBack(getVal('oh-dp-input', convertCapacity(state.reference.openHoleAnnular.DP || 0, state.globalUnit)), state.globalUnit);
    if (document.getElementById('oh-dp2-input')) {
      state.reference.openHoleAnnular.DP2 = convertCapacityBack(getVal('oh-dp2-input', convertCapacity(state.reference.openHoleAnnular.DP2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (document.getElementById('oh-dp3-input')) {
      state.reference.openHoleAnnular.DP3 = convertCapacityBack(getVal('oh-dp3-input', convertCapacity(state.reference.openHoleAnnular.DP3 || 0, state.globalUnit)), state.globalUnit);
    }
    state.reference.openHoleAnnular.HWDP = convertCapacityBack(getVal('oh-hwdp-input', convertCapacity(state.reference.openHoleAnnular.HWDP || 0, state.globalUnit)), state.globalUnit);
    state.reference.openHoleAnnular.DC = convertCapacityBack(getVal('oh-dc-input', convertCapacity(state.reference.openHoleAnnular.DC || 0, state.globalUnit)), state.globalUnit);
    if (document.getElementById('oh-dc2-input')) {
      state.reference.openHoleAnnular.DC2 = convertCapacityBack(getVal('oh-dc2-input', convertCapacity(state.reference.openHoleAnnular.DC2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (document.getElementById('oh-dc3-input')) {
      state.reference.openHoleAnnular.DC3 = convertCapacityBack(getVal('oh-dc3-input', convertCapacity(state.reference.openHoleAnnular.DC3 || 0, state.globalUnit)), state.globalUnit);
    }

    // Save Casing capacities
    state.reference.casingAnnular.DP = convertCapacityBack(getVal('cas-dp-input', convertCapacity(state.reference.casingAnnular.DP || 0, state.globalUnit)), state.globalUnit);
    if (document.getElementById('cas-dp2-input')) {
      state.reference.casingAnnular.DP2 = convertCapacityBack(getVal('cas-dp2-input', convertCapacity(state.reference.casingAnnular.DP2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (document.getElementById('cas-dp3-input')) {
      state.reference.casingAnnular.DP3 = convertCapacityBack(getVal('cas-dp3-input', convertCapacity(state.reference.casingAnnular.DP3 || 0, state.globalUnit)), state.globalUnit);
    }
    state.reference.casingAnnular.HWDP = convertCapacityBack(getVal('cas-hwdp-input', convertCapacity(state.reference.casingAnnular.HWDP || 0, state.globalUnit)), state.globalUnit);
    state.reference.casingAnnular.DC = convertCapacityBack(getVal('cas-dc-input', convertCapacity(state.reference.casingAnnular.DC || 0, state.globalUnit)), state.globalUnit);
    if (document.getElementById('cas-dc2-input')) {
      state.reference.casingAnnular.DC2 = convertCapacityBack(getVal('cas-dc2-input', convertCapacity(state.reference.casingAnnular.DC2 || 0, state.globalUnit)), state.globalUnit);
    }
    if (document.getElementById('cas-dc3-input')) {
      state.reference.casingAnnular.DC3 = convertCapacityBack(getVal('cas-dc3-input', convertCapacity(state.reference.casingAnnular.DC3 || 0, state.globalUnit)), state.globalUnit);
    }

    // Subsea specific saves
    if (state.flowType === 'subsea') {
      const riserAnnEl = document.getElementById('riser-ann-input');
      if (riserAnnEl) {
        state.reference.riserAnnular = convertCapacityBack(getVal('riser-ann-input', convertCapacity(state.reference.riserAnnular || 0, state.globalUnit)), state.globalUnit);
      }
      const chokeCapEl = document.getElementById('cap-choke-input');
      if (chokeCapEl) {
        state.reference.chokeCapacity = convertCapacityBack(getVal('cap-choke-input', convertCapacity(state.reference.chokeCapacity || 0, state.globalUnit)), state.globalUnit);
      }
      const riserCapEl = document.getElementById('cap-riser-input');
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

  const refSaveBtn = document.getElementById('ref-save-new');
  const refUseBtn = document.getElementById('ref-use-btn');

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
          <input type="number" step="any" class="form-input" id="dc-len-calc-2" value="${state.calcInputs.dcLength2 || 0}" style="width:100%; margin-bottom:0; padding-right:25px;">
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
          <input type="number" step="any" class="form-input" id="dc-len-calc-3" value="${state.calcInputs.dcLength3 || 0}" style="width:100%; margin-bottom:0; padding-right:25px;">
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
          <input type="number" step="any" class="form-input" id="dp-len-calc-3" value="${state.calcInputs.dpLength3 || 0}" style="width:100%; margin-bottom:0; padding-right:25px;">
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
          <input type="number" step="any" class="form-input" id="dp-len-calc-2" value="${state.calcInputs.dpLength2 || 0}" style="width:100%; margin-bottom:0; padding-right:25px;">
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
    document.getElementById('bop-status-toggle').addEventListener('change', (e) => {
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
  resultsContainer.style.display = 'none';
  container.appendChild(resultsContainer);

  // Initialize default inputs in state if they do not exist
  const defaultOMW = isBblFt ? 10.0 : 1.20;
  const defaultSIDPP = isBblFt ? 500 : 35;
  const defaultSICP = isBblFt ? 600 : 42;
  const defaultSCR = isBblFt ? 300 : 21;

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
  killSheetBtnCard.style.display = 'none';

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

  document.getElementById('open-kill-sheet-btn').onclick = () => {
    navigateTo('kill-data-sheet');
  };

  // Sync Input Elements Values & Bind change listeners
  const holeMEl = document.getElementById('hole-md-calc');
  const holeTEl = document.getElementById('hole-tvd-calc');
  const shoeMEl = document.getElementById('shoe-md-calc');
  const shoeTEl = document.getElementById('shoe-tvd-calc');
  const dcEl = document.getElementById('dc-len-calc');
  const hwdpEl = document.getElementById('hwdp-len-calc');
  const dpEl = document.getElementById('dp-len-calc');

  const updateDPLength = () => {
    if (!state.calcInputs.dpLengthOverride) {
      const hMD = parseFloat(holeMEl.value) || 0;
      const dcL = parseFloat(dcEl.value) || 0;
      const dcL2 = document.getElementById('dc-len-calc-2') ? (parseFloat(document.getElementById('dc-len-calc-2').value) || 0) : 0;
      const dcL3 = document.getElementById('dc-len-calc-3') ? (parseFloat(document.getElementById('dc-len-calc-3').value) || 0) : 0;

      const hwL = parseFloat(hwdpEl.value) || 0;

      const dpL2 = document.getElementById('dp-len-calc-2') ? (parseFloat(document.getElementById('dp-len-calc-2').value) || 0) : 0;
      const dpL3 = document.getElementById('dp-len-calc-3') ? (parseFloat(document.getElementById('dp-len-calc-3').value) || 0) : 0;

      const dpL = Math.max(0, hMD - dcL - dcL2 - dcL3 - hwL - dpL2 - dpL3);
      state.calcInputs.dpLength = dpL;
      if (dpEl) dpEl.value = dpL.toFixed(1);
    }
  };

  const syncStateFromInputs = () => {
    const getVal = (el) => el && el.value !== '' ? parseFloat(el.value) : '';

    state.calcInputs.holeMD = getVal(holeMEl);
    state.calcInputs.holeTVD = holeTEl ? getVal(holeTEl) : state.calcInputs.holeMD;
    state.calcInputs.shoeMD = getVal(shoeMEl);
    state.calcInputs.shoeTVD = shoeTEl ? getVal(shoeTEl) : state.calcInputs.shoeMD;

    state.calcInputs.dcLength = getVal(dcEl);
    state.calcInputs.dcLength2 = getVal(document.getElementById('dc-len-calc-2'));
    state.calcInputs.dcLength3 = getVal(document.getElementById('dc-len-calc-3'));

    state.calcInputs.hwdpLength = getVal(hwdpEl);

    state.calcInputs.dpLength = getVal(dpEl);
    state.calcInputs.dpLength2 = getVal(document.getElementById('dp-len-calc-2'));
    state.calcInputs.dpLength3 = getVal(document.getElementById('dp-len-calc-3'));

    if (state.flowType === 'subsea') {
      state.calcInputs.riserLength = getVal(document.getElementById('riserlength-calc'));
      if (state.calcInputs.bopStatus === 'closed') {
        state.calcInputs.chokeLength = getVal(document.getElementById('choke-len-calc'));
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

  const dcEl2 = document.getElementById('dc-len-calc-2');
  if (dcEl2) {
    dcEl2.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  const dcEl3 = document.getElementById('dc-len-calc-3');
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

  const dpEl2 = document.getElementById('dp-len-calc-2');
  if (dpEl2) {
    dpEl2.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  const dpEl3 = document.getElementById('dp-len-calc-3');
  if (dpEl3) {
    dpEl3.addEventListener('input', () => {
      updateDPLength();
      syncStateFromInputs();
      runCalculationsEngine();
    });
  }

  // Reset auto listener
  const resetBtn = document.getElementById('reset-dp-auto');
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
  const runCalcBtn = document.getElementById('run-calc-btn');
  if (runCalcBtn) {
    runCalcBtn.onclick = () => {
      syncStateFromInputs();

      // Validation Check: Find missing data entries
      let hasError = false;
      const calcContainer = document.getElementById(`calculations-container-${state.flowType}`);
      const inputsList = calcContainer.querySelectorAll('.form-input:not([disabled])');

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

      document.getElementById('results-dashboard-wrapper').style.display = 'grid';
      document.getElementById('kill-sheet-btn-card').style.display = 'block';
      runCalculationsEngine();
      saveCalculationToHistory('dashboard');
      showToast("Calculations refreshed successfully.");

      setTimeout(() => {
        document.getElementById('results-dashboard-wrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    };
  }



  // Run calculations instantly on render
  runCalculationsEngine();
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
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">CLF (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="number" step="any" class="form-input" id="kd-clf" value="${fmt(initialCLF, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>
  ` : '';

  const subseaResultCards = state.flowType === 'subsea' ? `
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">Dynamic MAASP</span>
          <span class="result-value" id="kd-out-dyn-maasp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">Initial Dynamic SICP</span>
          <span class="result-value" id="kd-out-dyn-sicp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">Riser Displacement</span>
          <span class="result-value" id="kd-out-riser-disp">-</span>
        </div>
  ` : '';

  container.innerHTML = `
    <div class="content-card compact-card" style="border-top: 4px solid var(--accent-color); margin-bottom:12px; padding: 12px 14px;">
      <h3 style="font-size:0.85rem; margin-bottom:10px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px;">Reference Parameters</h3>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
          <span style="font-weight:600; color:var(--text-secondary);">Hole TVD</span>
          <span style="font-weight:700; color:var(--text-primary);">${holeTVD.toFixed(1)} ${dUnit}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; border-top: 1px solid #efeae6; padding-top: 6px;">
          <span style="font-weight:600; color:var(--text-secondary);">Shoe TVD</span>
          <span style="font-weight:700; color:var(--text-primary);">${shoeTVD.toFixed(1)} ${dUnit}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; border-top: 1px solid #efeae6; padding-top: 6px;">
          <span style="font-weight:600; color:var(--text-secondary);">String Volume Strokes</span>
          <span style="font-weight:700; color:var(--text-primary);">${Math.round(strokes).toLocaleString()} stks</span>
        </div>
      </div>
    </div>

    <div class="content-card compact-card" style="margin-bottom:12px; padding: 12px 14px;">
      <h3 style="font-size:0.85rem; margin-bottom:12px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px;">Input Well Control Data</h3>
      
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">Current Mud Wt (${mwUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="number" step="any" class="form-input" id="kd-current-mw" value="${fmt(initialOMW, false)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">LOT in Max MW (${mwUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="number" step="any" class="form-input" id="kd-lot-mw" value="${fmt(initialLotMw, false)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">KRP (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="number" step="any" class="form-input" id="kd-krp" value="${fmt(initialSCR, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>
        ${clfInputHtml}

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">SIDP (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="number" step="any" class="form-input" id="kd-sidp" value="${fmt(initialSIDPP, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
          <label style="margin-bottom:0; font-size:0.8rem; font-weight:600; color:var(--text-primary); flex:1;">SICP (${pressUnit})</label>
          <div style="position:relative; width:110px;">
            <input type="number" step="any" class="form-input" id="kd-sicp" value="${fmt(initialSICP, true)}" style="width:100%; padding-right:25px; margin-bottom:0; text-align:right;">
            ${editIcon}
          </div>
        </div>
      </div>

      <button class="btn btn-primary" id="kd-go-btn" style="width:100%; margin-top:15px; margin-bottom:0;">GO</button>
    </div>

    <!-- Output Section (Initially hidden, populated after GO click) -->
    <div class="content-card compact-card" id="kd-results-card" style="display:none; border-left: 4px solid var(--accent-color); margin-bottom:12px;">
      <h3 style="font-size:0.95rem; margin-bottom:15px; font-weight:600; color:var(--text-primary);">Calculated Results</h3>
      <div class="results-grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">Current MAASP</span>
          <span class="result-value" id="kd-out-maasp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">Kill Mud Weight</span>
          <span class="result-value" id="kd-out-kmw">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">ICP</span>
          <span class="result-value" id="kd-out-icp">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">FCP</span>
          <span class="result-value" id="kd-out-fcp">-</span>
        </div>
        ${subseaResultCards}
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px;">
          <span class="result-label">MAASP After Kill</span>
          <span class="result-value" id="kd-out-maasp-after">-</span>
        </div>
        <div class="result-card" style="padding: 12px 14px; border-radius: 12px; gap: 2px; grid-column: span 2;">
          <span class="result-label">Pressure Drop / 100 Stks</span>
          <span class="result-value" id="kd-out-pres-drop">-</span>
        </div>
      </div>
    </div>

    <!-- Step Down Chart and Schedule Table -->
    <div class="content-card compact-card" id="kd-chart-card" style="display:none; margin-bottom:20px; padding: 12px 14px;">
      <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:600; color:var(--text-primary);">Drill Pipe Pressure Step-Down Schedule</h3>
      
      <!-- SVG Chart Wrapper -->
      <div id="kd-chart-svg-wrapper" style="width:100%; display:flex; justify-content:center; margin-bottom:15px; background:var(--card-bg); border-radius:12px; padding:10px 5px; border: 1px solid var(--border-subtle);"></div>
      
      <!-- Table Schedule -->
      <div style="overflow-x:auto; border: 1px solid var(--border-subtle); border-radius:8px;">
        <table style="width:100%; border-collapse:collapse; font-size:0.8rem; text-align:left;">
          <thead>
            <tr style="background-color:var(--bg-subtle); border-bottom: 1px solid var(--border-subtle);">
              <th style="padding: 8px 12px; font-weight:600; color:var(--text-secondary);">Cumulative Strokes</th>
              <th style="padding: 8px 12px; font-weight:600; color:var(--text-secondary); text-align: right;">Drill Pipe Pressure</th>
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
      showToast("Required input missing");
      return;
    }

    // Read input values
    const currentMw = parseFloat(document.getElementById('kd-current-mw').value) || 0;
    const lotMw = parseFloat(document.getElementById('kd-lot-mw').value) || 0;
    const krp = parseFloat(document.getElementById('kd-krp').value) || 0;
    const sidp = parseFloat(document.getElementById('kd-sidp').value) || 0;
    const sicp = parseFloat(document.getElementById('kd-sicp').value) || 0;
    const clf = state.flowType === 'subsea' ? (parseFloat(document.getElementById('kd-clf').value) || 0) : 0;

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
          <td style="padding: 8px 12px; font-weight: 700; color: var(--text-primary); border-bottom-left-radius: 8px;">${totalStrokes} (Bit)</td>
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
          <text x="10" y="${padTop + chartH / 2}" font-size="8" fill="var(--text-primary)" transform="rotate(-90 10 ${padTop + chartH / 2})" text-anchor="middle" font-weight="600">Pressure (psi)</text>
          
          <!-- X-Axis Title -->
          <text x="${padLeft + chartW / 2}" y="${height - 2}" font-size="8" fill="var(--text-primary)" text-anchor="middle" font-weight="600">Strokes</text>
        </svg>
      `;

      svgWrapper.innerHTML = svgContent;

      // Reveal the chart card
      document.getElementById('kd-chart-card').style.display = 'block';
    }

    // Show a toast message
    showToast("Kill sheet calculations completed!");
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
let tubularSubState = {
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

  // Intercept header back button to control our internal subscreen stack
  const backBtn = document.querySelector('#screen-api-tubular .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
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
      } else {
        navigateBack();
      }
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

      if (viewType === 'drillpipe') {
        resultPanel.innerHTML = `
          <div class="content-card" style="border-left: 4px solid var(--accent-green); animation: fadeIn 0.3s ease;">
            <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:700; color:var(--accent-green);">Specifications Panel</h3>
            <div class="tubular-results-grid">
              <div class="tubular-result-card">
                <span class="tubular-result-label">ID (in)</span>
                <span class="tubular-result-value">${matchedItem.id}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tool Joint OD (in)</span>
                <span class="tubular-result-value">${matchedItem.toolJointOd}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tool Joint ID (in)</span>
                <span class="tubular-result-value">${matchedItem.toolJointId}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Make-up Torque (ft-lbs)</span>
                <span class="tubular-result-value">${matchedItem.makeupTorque !== 'N/A' && !isNaN(parseFloat(matchedItem.makeupTorque)) ? parseFloat(matchedItem.makeupTorque).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tensile Yield Strength (lbs)</span>
                <span class="tubular-result-value">${matchedItem.tensile !== 'N/A' && !isNaN(parseFloat(matchedItem.tensile)) ? parseFloat(matchedItem.tensile).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Torsional Yield Strength (ft-lbs)</span>
                <span class="tubular-result-value">${matchedItem.torsional !== 'N/A' && !isNaN(parseFloat(matchedItem.torsional)) ? parseFloat(matchedItem.torsional).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Burst Pressure (psi)</span>
                <span class="tubular-result-value">${matchedItem.burst !== 'N/A' && !isNaN(parseFloat(matchedItem.burst)) ? parseFloat(matchedItem.burst).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Collapse Pressure (psi)</span>
                <span class="tubular-result-value">${matchedItem.collapse !== 'N/A' && !isNaN(parseFloat(matchedItem.collapse)) ? parseFloat(matchedItem.collapse).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Capacity (bbl/ft)</span>
                <span class="tubular-result-value">${matchedItem.capacity}</span>
              </div>
            </div>
          </div>
        `;
      } else if (viewType === 'casing') {
        resultPanel.innerHTML = `
          <div class="content-card" style="border-left: 4px solid var(--accent-green); animation: fadeIn 0.3s ease;">
            <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:700; color:var(--accent-green);">Specifications Panel</h3>
            <div class="tubular-results-grid">
              <div class="tubular-result-card">
                <span class="tubular-result-label">ID (in)</span>
                <span class="tubular-result-value">${matchedItem.id_inch}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Drift (in)</span>
                <span class="tubular-result-value">${matchedItem.drift_diameter_inch}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Wall Thickness (in)</span>
                <span class="tubular-result-value">${matchedItem.wall_inch}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Burst (psi)</span>
                <span class="tubular-result-value">${matchedItem.burst_pressure_psi.toLocaleString()}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Collapse (psi)</span>
                <span class="tubular-result-value">${matchedItem.collapse_pressure_psi.toLocaleString()}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Body Yield (lbs)</span>
                <span class="tubular-result-value">${(matchedItem.body_yield_1000_lbs * 1000).toLocaleString()}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Capacity (bbl/ft)</span>
                <span class="tubular-result-value">${matchedItem.capacity_bbl_ft}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Displacement (bbl/ft)</span>
                <span class="tubular-result-value">${matchedItem.displacement_bbl_ft}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        resultPanel.innerHTML = `
          <div class="content-card" style="border-left: 4px solid var(--accent-green); animation: fadeIn 0.3s ease;">
            <h3 style="font-size:0.95rem; margin-bottom:12px; font-weight:700; color:var(--accent-green);">Specifications Panel</h3>
            <div class="tubular-results-grid">
              <div class="tubular-result-card">
                <span class="tubular-result-label">ID (in)</span>
                <span class="tubular-result-value">${matchedItem.id}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Drift (in)</span>
                <span class="tubular-result-value">${matchedItem.drift}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Burst (psi)</span>
                <span class="tubular-result-value">${parseFloat(matchedItem.burst).toLocaleString()}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Collapse (psi)</span>
                <span class="tubular-result-value">${parseFloat(matchedItem.collapse).toLocaleString()}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Tensile (lbs)</span>
                <span class="tubular-result-value">${parseFloat(matchedItem.tensile).toLocaleString()}</span>
              </div>
              <div class="tubular-result-card">
                <span class="tubular-result-label">Capacity (bbl/ft)</span>
                <span class="tubular-result-value">${matchedItem.capacity}</span>
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
// BONUS FEATURE 2: Stuck Pipe Analysis
// ==========================================
function renderStuckPipeScreen() {
  const container = document.getElementById('stuck-pipe-container');
  container.innerHTML = `
    <div class="content-card">
      <h3 style="font-size:0.95rem; margin-bottom:15px; font-weight:600;">Diagnostic Stuck Pipe Assistant</h3>
      <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:20px;">Answer the questions below to diagnose the sticking mechanism and find operational remedies.</p>
      
      <div class="form-group">
        <label>Primary Activity when Sticking Occurred</label>
        <div class="select-wrapper">
          <select class="form-select" id="stuck-activity">
            <option value="static">Static (Connection, Survey, or Pipe Rack)</option>
            <option value="tripping">Tripping (Pulling out / Running in Hole)</option>
            <option value="drilling">Drilling (Making Hole / Reaming)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Circulation Capacity</label>
        <div class="select-wrapper">
          <select class="form-select" id="stuck-circ">
            <option value="normal">Normal (Unrestricted flow & pressure)</option>
            <option value="restricted">Restricted (High pump pressure required)</option>
            <option value="blocked">Blocked (No circulation possible)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Pipe Rotation status</label>
        <div class="select-wrapper">
          <select class="form-select" id="stuck-rot">
            <option value="free">Free (Full torque & rotation possible)</option>
            <option value="restricted">Restricted (High torque / partial rotation)</option>
            <option value="none">Locked (Cannot rotate pipe)</option>
          </select>
        </div>
      </div>

      <button class="btn btn-primary" id="stuck-diagnose-btn" style="width:100%">Diagnose Sticking Mechanism</button>
    </div>

    <div class="content-card" id="stuck-results-card" style="display:none; border-left: 4px solid var(--accent-color);">
      <h3 id="stuck-diag-title" style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:8px;">Sticking Mechanism</h3>
      <p id="stuck-diag-desc" style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:15px;"></p>
      
      <h4 style="font-size:0.85rem; font-weight:600; text-transform:uppercase; color:var(--text-primary); margin-bottom:6px;">Recommended First Actions:</h4>
      <ul id="stuck-diag-actions" style="font-size:0.85rem; padding-left:20px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
      </ul>
    </div>
  `;

  document.getElementById('stuck-diagnose-btn').onclick = () => {
    const act = document.getElementById('stuck-activity').value;
    const circ = document.getElementById('stuck-circ').value;
    const rot = document.getElementById('stuck-rot').value;

    const resultsCard = document.getElementById('stuck-results-card');
    const diagTitle = document.getElementById('stuck-diag-title');
    const diagDesc = document.getElementById('stuck-diag-desc');
    const diagActions = document.getElementById('stuck-diag-actions');

    resultsCard.style.display = 'block';

    if (act === 'static' && circ === 'normal' && rot === 'none') {
      diagTitle.textContent = "Differential Sticking";
      diagDesc.textContent = "Occurs when high mud hydrostatic pressure holds the drillstring against a permeable low-pressure zone. Pipe became stuck during a static period, circulation remains completely normal, but rotation is impossible.";
      diagActions.innerHTML = `
        <li>Apply maximum safe torque and jar downward with full weight.</li>
        <li>Reduce mud weight safely (if well control permits) to decrease differential pressure.</li>
        <li>Spot a chemical pipe-release agent (e.g. oil-based wash) across the sticking zone.</li>
        <li>If unsuccessful, prepare to wash-over or back-off the string.</li>
      `;
    } else if (circ === 'blocked' || circ === 'restricted') {
      diagTitle.textContent = "Hole Packoff / Cuttings Settling";
      diagDesc.textContent = "Annulus became packed off with cuttings or sloughing shale, blocking fluid flow and binding the drillstring. Common during drilling/connections.";
      diagActions.innerHTML = `
        <li>IMMEDIATELY bleed off pump pressure and do NOT jar upwards (doing so packs it tighter).</li>
        <li>Apply low torque and jar downward repeatedly to break the packoff.</li>
        <li>Attempt to establish circulation at very low pump rates once movement is restored.</li>
        <li>Circulate out debris with high viscous sweeps before resuming.</li>
      `;
    } else {
      diagTitle.textContent = "Mechanical Sticking / Keyseating";
      diagDesc.textContent = "The string is physically wedged in a dogleg, ledges, or keyseats. Common while tripping up or down in doglegs. Circulation remains normal, but upward or downward movement is restricted.";
      diagActions.innerHTML = `
        <li>If stuck pulling UP: Jar DOWNWARD. Do not pull harder as it forces the pipe deeper into the keyseat.</li>
        <li>If stuck running DOWN: Jar UPWARD.</li>
        <li>Apply gentle torque while jarring if rotation is not locked.</li>
        <li>In future runs, utilize a keyseat wiper or ream the dogleg section.</li>
      `;
    }

    resultsCard.scrollIntoView({ behavior: 'smooth' });
  };
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
      { name: 'Square Meters (m²)', val: 'm2' },
      { name: 'Square Feet (ft²)', val: 'ft2' },
      { name: 'Acres (acre)', val: 'acre' }
    ],
    circ: [
      { name: 'Liters/Minute (L/min)', val: 'l_min' },
      { name: 'Cubic Meters/Hour (m³/hr)', val: 'm3_hr' },
      { name: 'Gallons/Minute (gpm)', val: 'gpm' },
      { name: 'Barrels/Minute (bbl/min)', val: 'bbl_min' }
    ],
    force: [
      { name: 'Newtons (N)', val: 'n' },
      { name: 'Kilonewtons (kN)', val: 'kn' },
      { name: 'Pounds Force (lbf)', val: 'lbf' }
    ],
    len: [
      { name: 'Millimeters (mm)', val: 'mm' },
      { name: 'Centimeters (cm)', val: 'cm' },
      { name: 'Meters (m)', val: 'm' },
      { name: 'Kilometers (km)', val: 'km' },
      { name: 'Inches (in)', val: 'in' },
      { name: 'Feet (ft)', val: 'ft' }
    ],
    mudw: [
      { name: 'Pounds/Gallon (ppg)', val: 'ppg' },
      { name: 'Specific Gravity (SG)', val: 'sg' },
      { name: 'Kilograms/Cubic Meter (kg/m³)', val: 'kg_m3' },
      { name: 'Pounds/Cubic Foot (lb/ft³)', val: 'lb_ft3' }
    ],
    power: [
      { name: 'Watts (W)', val: 'w' },
      { name: 'Kilowatts (kW)', val: 'kw' },
      { name: 'Horsepower (hp)', val: 'hp' }
    ],
    pres: [
      { name: 'PSI (psi)', val: 'psi' },
      { name: 'Bar (bar)', val: 'bar' },
      { name: 'Kilopascals (kPa)', val: 'kpa' },
      { name: 'Megapascals (MPa)', val: 'mpa' }
    ],
    temp: [
      { name: 'Celsius (°C)', val: 'c' },
      { name: 'Fahrenheit (°F)', val: 'f' },
      { name: 'Kelvin (K)', val: 'k' }
    ],
    vel: [
      { name: 'Meters/Second (m/s)', val: 'm_s' },
      { name: 'Feet/Second (ft/s)', val: 'ft_s' },
      { name: 'Kilometers/Hour (km/h)', val: 'km_h' }
    ],
    vol: [
      { name: 'Liters (L)', val: 'l' },
      { name: 'Cubic Meters (m³)', val: 'm3' },
      { name: 'Barrels (bbl)', val: 'bbl' },
      { name: 'Gallons (gal)', val: 'gal' }
    ],
    weight: [
      { name: 'Kilograms (kg)', val: 'kg' },
      { name: 'Grams (g)', val: 'g' },
      { name: 'Pounds (lb)', val: 'lb' },
      { name: 'Metric Tons (ton)', val: 'ton' }
    ],
    flow: [
      { name: 'Barrels/Day (bbl/day)', val: 'bbl_d' },
      { name: 'Cubic Meters/Day (m³/day)', val: 'm3_d' },
      { name: 'Gallons/Minute (gpm)', val: 'gpm' }
    ],
    dens: [
      { name: 'Kilograms/Cubic Meter (kg/m³)', val: 'kg_m3' },
      { name: 'Grams/Cubic Centimeter (g/cm³)', val: 'g_cm3' },
      { name: 'Pounds/Gallon (ppg)', val: 'ppg' }
    ],
    torque: [
      { name: 'Newton Meters (N·m)', val: 'nm' },
      { name: 'Foot Pounds (ft·lbf)', val: 'ft_lbf' }
    ],
    visc: [
      { name: 'Centipoise (cP)', val: 'cp' },
      { name: 'Pascal Seconds (Pa·s)', val: 'pa_s' }
    ],
    pump: [
      { name: 'Liters/Stroke (L/stroke)', val: 'l_stk' },
      { name: 'Barrels/Stroke (bbl/stroke)', val: 'bbl_stk' }
    ],
    anncap: [
      { name: 'Barrels/Foot (bbl/ft)', val: 'bbl_ft' },
      { name: 'Cubic Meters/Meter (m³/m)', val: 'm3_m' },
      { name: 'Liters/Meter (L/m)', val: 'l_m' }
    ],
    yp: [
      { name: 'Pounds/100ft² (lb/100ft²)', val: 'lb_100ft2' },
      { name: 'Pascals (Pa)', val: 'pa' }
    ],
    gel: [
      { name: 'Pounds/100ft² (lb/100ft²)', val: 'lb_100ft2' },
      { name: 'Pascals (Pa)', val: 'pa' }
    ],
    grad: [
      { name: 'PSI/Foot (psi/ft)', val: 'psi_ft' },
      { name: 'Kilopascals/Meter (kPa/m)', val: 'kpa_m' },
      { name: 'Bar/Meter (bar/m)', val: 'bar_m' }
    ],
    energy: [
      { name: 'Joules (J)', val: 'j' },
      { name: 'BTU', val: 'btu' },
      { name: 'Kilowatt Hours (kWh)', val: 'kwh' }
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
    const val = parseFloat(fromVal.value);
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
let calcSubState = {
  view: 'categories', // 'categories', 'list', 'formula'
  category: '',       // 'basic', 'wellcontrol', 'applied'
  search: '',
  formulaId: ''
};

let quickRefSubState = {
  view: 'menu', // 'menu', 'drill-bit-torque', 'ring-gaskets', 'wellhead', 'subsea-ref'
  wellheadTab: 'A', // 'A', 'B', 'C'
  subseaTab: 'overview' // 'overview', 'running', 'retrieving'
};

const formulaDb = {
  basic: [
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
    }
  ],
  wellcontrol: [
    {
      id: 'gas_mig_rate',
      name: 'Actual Gas Migration Rate',
      desc: 'Estimated gas upward travel speed in shut-in well.',
      inputs: [
        { key: 'rise', label: 'Pressure Rise Rate (psi/hr)', val: 100 },
        { key: 'grad', label: 'Mud Gradient (psi/ft)', val: 0.52 }
      ],
      calc: (i) => i.rise / i.grad,
      unit: 'ft/hr'
    },
    {
      id: 'adj_masicp',
      name: 'Adjusted Maximum Allowable Shut-in Casing Pressure for New Mud Weight',
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
      id: 'est_gas_mig',
      name: 'Estimate Gas Migration Rate in a Shut-in Well',
      desc: 'Gas migration speed based on casing pressure behavior.',
      inputs: [
        { key: 'rise', label: 'Pressure Rise Rate (psi/hr)', val: 100 },
        { key: 'grad', label: 'Mud Gradient (psi/ft)', val: 0.52 }
      ],
      calc: (i) => i.rise / i.grad,
      unit: 'ft/hr'
    },
    {
      id: 'fcp',
      name: 'Final Circulating Pressure',
      desc: 'Circulating pressure required when kill mud hits bit.',
      inputs: [
        { key: 'scr', label: 'Slow Circ. Rate Pressure (psi)', val: 500 },
        { key: 'kmw', label: 'Kill Mud Weight (ppg)', val: 11.5 },
        { key: 'omw', label: 'Original Mud Weight (ppg)', val: 10.0 }
      ],
      calc: (i) => i.scr * (i.kmw / (i.omw || 1)),
      unit: 'psi'
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
      id: 'icp',
      name: 'Initial Circulating Pressure',
      desc: 'Circulating pressure required to start Driller\'s method.',
      inputs: [
        { key: 'scr', label: 'Slow Circ. Rate Pressure (psi)', val: 500 },
        { key: 'sidpp', label: 'SIDPP (psi)', val: 400 }
      ],
      calc: (i) => i.scr + i.sidpp,
      unit: 'psi'
    },
    {
      id: 'kt_factor',
      name: 'Kick Tolerance Factor',
      desc: 'Safety factor comparing fracture load to shut-in casing pressure.',
      inputs: [
        { key: 'lop', label: 'Shoe Leak Off Pressure (psi)', val: 800 },
        { key: 'sicp', label: 'SICP (psi)', val: 600 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => (i.lop - i.sicp) / (0.052 * i.tvd),
      unit: 'ppg equivalent'
    },
    {
      id: 'kt_vert',
      name: 'Kick Tolerance (Surface Stack and Vertical Well)',
      desc: 'Max mud weight increase allowable before fracture.',
      inputs: [
        { key: 'lop', label: 'Leak Off Pressure (psi)', val: 1500 },
        { key: 'hyd', label: 'Shoe Hydrostatic (psi)', val: 1200 },
        { key: 'tvd', label: 'Shoe TVD (ft)', val: 5000 }
      ],
      calc: (i) => (i.lop - i.hyd) / (0.052 * i.tvd),
      unit: 'ppg'
    },
    {
      id: 'kmw_wc',
      name: 'Kill Mud Weight Driller\'s Method',
      desc: 'Density of mud required to balance formation pressure.',
      inputs: [
        { key: 'mw', label: 'Current Mud Weight (ppg)', val: 10.0 },
        { key: 'sidpp', label: 'SIDPP (psi)', val: 400 },
        { key: 'tvd', label: 'Total TVD (ft)', val: 8000 }
      ],
      calc: (i) => Math.ceil((i.mw + i.sidpp / (0.052 * i.tvd)) * 10) / 10,
      unit: 'ppg'
    },
    {
      id: 'max_fp',
      name: 'Maximum Formation Pressure that Can Withstand When Shut in the Well',
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
      name: 'Maximum Pit Gain From Gas Kick in Water Based Mud',
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
      name: 'Maximum Possible Influx Height When Equal to Maximum Allowable Shut in Casing Pressure',
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
      id: 'max_surf_pres',
      name: 'Maximum Surface Pressure from Gas Influx Water Based Mud',
      desc: 'Approximated surface pressure during gas kick expansion.',
      inputs: [
        { key: 'gain', label: 'Pit Gain (bbl)', val: 15 },
        { key: 'p', label: 'Formation Pressure (psi)', val: 4500 },
        { key: 'cap', label: 'Annular Capacity (bbl/ft)', val: 0.029 }
      ],
      calc: (i) => Math.sqrt((i.p * i.gain) / (2 * i.cap * 1029.4)),
      unit: 'psi'
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
    },
    {
      id: 'new_pump_p_basic',
      name: 'New Pump Pressure and New Pump Stroke (Basic Calculation)',
      desc: 'Pressure update using square law of pump speeds.',
      inputs: [
        { key: 'p1', label: 'Current Pressure (psi)', val: 1500 },
        { key: 'spm1', label: 'Current SPM', val: 60 },
        { key: 'spm2', label: 'New SPM', val: 80 }
      ],
      calc: (i) => i.p1 * Math.pow(i.spm2 / i.spm1, 2),
      unit: 'psi'
    },
    {
      id: 'new_pump_p_adv',
      name: 'New Pump Pressure and New Pump Stroke (Advanced Calculation)',
      desc: 'Advanced pressure update using variable exponent.',
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
      id: 'pump_stroke_rel_adv',
      name: 'Pump Pressure and Pump Stroke Relationship (Advanced Calculation)',
      desc: 'Determines pressure ratio index from test data.',
      inputs: [
        { key: 'p1', label: 'Current Pressure (psi)', val: 1500 },
        { key: 'p2', label: 'New Pressure (psi)', val: 2500 },
        { key: 'spm1', label: 'Current SPM', val: 60 },
        { key: 'spm2', label: 'New SPM', val: 80 }
      ],
      calc: (i) => Math.log(i.p2 / i.p1) / Math.log(i.spm2 / i.spm1),
      unit: 'Exponent index (n)'
    },
    {
      id: 'pump_stroke_rel_basic',
      name: 'Pump Pressure and Pump Stroke Relationship (Basic Calculation)',
      desc: 'Ratio verification of speed adjustments.',
      inputs: [
        { key: 'p1', label: 'Current Pressure (psi)', val: 1500 },
        { key: 'spm1', label: 'Current SPM', val: 60 },
        { key: 'spm2', label: 'New SPM', val: 80 }
      ],
      calc: (i) => i.p1 * Math.pow(i.spm2 / i.spm1, 2),
      unit: 'psi'
    },
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
      id: 'trip_margin',
      name: 'Trip Margin Calculation',
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
  ],
  applied: [
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
      desc: 'Cuttings volume rate generated at bit in gpm.',
      inputs: [
        { key: 'rop', label: 'ROP (ft/hr)', val: 50 },
        { key: 'hid', label: 'Hole ID (in)', val: 8.5 }
      ],
      calc: (i) => ((i.rop * Math.pow(i.hid, 2) / 1029.4) * 42) / 60,
      unit: 'gal/min'
    }
  ]
};

function renderDrillingCalcScreen() {
  const container = document.getElementById('drilling-calc-container');

  // Intercept screen back button to control our sub-navigation
  const backBtn = document.querySelector('#screen-drilling-calc .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      if (calcSubState.search !== '') {
        calcSubState.search = '';
        renderDrillingCalcScreen();
      } else if (calcSubState.view === 'formula') {
        calcSubState.view = 'list';
        renderDrillingCalcScreen();
      } else if (calcSubState.view === 'list') {
        calcSubState.view = 'categories';
        renderDrillingCalcScreen();
      } else {
        navigateBack();
      }
    };
  }

  if (calcSubState.search !== '') {
    // Search Results View
    const query = calcSubState.search;

    // Render the search container shell only if it's not already rendered, preventing input recreation
    const isSearchShell = document.getElementById('formula-list-container') &&
      document.getElementById('calc-search-inp') &&
      document.getElementById('results-count-label');

    if (!isSearchShell) {
      container.innerHTML = `
        <div class="content-card">
          <input type="text" class="search-input" id="calc-search-inp" placeholder="Search formulas..." value="${query}" style="margin-bottom:15px; width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="font-size:0.85rem; font-weight:600; color:var(--text-secondary); text-transform:uppercase;" id="results-count-label">Search Results</h4>
            <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="clear-search-btn">Clear</button>
          </div>
          <div class="sizes-grid" style="grid-template-columns:1fr; gap:10px;" id="formula-list-container"></div>
        </div>
      `;

      document.getElementById('clear-search-btn').onclick = () => {
        calcSubState.search = '';
        renderDrillingCalcScreen();
      };

      setupSearchInput();
    }

    // Populates and updates matches list and results count header dynamically
    updateCalcSearchResultsOnly();

    // Secure input cursor focus and selection
    const inp = document.getElementById('calc-search-inp');
    if (inp) {
      inp.focus();
      const valLen = inp.value.length;
      inp.setSelectionRange(valLen, valLen);
    }
  } else if (calcSubState.view === 'categories') {
    // Categories Portal View
    container.innerHTML = `
      <input type="text" class="search-input" id="calc-search-inp" placeholder="Search all formulas..." style="margin-bottom:20px; width: 100%;">
      
      <div class="menu-grid" style="grid-template-columns:1fr; gap:12px;">
        <div class="toolkit-card compact-card" id="cat-basic-btn">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-tubular)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6346" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">Basic Drilling Formulas</span>
              <span class="card-desc">POOH, drops, gradients & capacities</span>
            </div>
          </div>
          <span class="card-chevron">&gt;</span>
        </div>

        <div class="toolkit-card compact-card" id="cat-wellcontrol-btn">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-wellcontrol)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A2C2C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">Well Control Formulas</span>
              <span class="card-desc">ICP/FCP, gas migration, kick tolerance</span>
            </div>
          </div>
          <span class="card-chevron">&gt;</span>
        </div>

        <div class="toolkit-card compact-card" id="cat-applied-btn">
          <div class="card-left">
            <div class="card-icon-container" style="background-color: var(--circle-conversion)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5F3F7D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-title">Applied Drilling Formulas</span>
              <span class="card-desc">DC weight, stuck pipe, ROP, Ton-Miles</span>
            </div>
          </div>
          <span class="card-chevron">&gt;</span>
        </div>
      </div>
    `;

    setupSearchInput();
    document.getElementById('cat-basic-btn').onclick = () => {
      calcSubState.view = 'list';
      calcSubState.category = 'basic';
      renderDrillingCalcScreen();
    };
    document.getElementById('cat-wellcontrol-btn').onclick = () => {
      calcSubState.view = 'list';
      calcSubState.category = 'wellcontrol';
      renderDrillingCalcScreen();
    };
    document.getElementById('cat-applied-btn').onclick = () => {
      calcSubState.view = 'list';
      calcSubState.category = 'applied';
      renderDrillingCalcScreen();
    };

  } else if (calcSubState.view === 'list') {
    // List formulas inside selected category
    const catName = calcSubState.category === 'basic' ? 'Basic Drilling Formulas' :
      (calcSubState.category === 'wellcontrol' ? 'Well Control Formulas' : 'Applied Drilling Formulas');

    const list = formulaDb[calcSubState.category] || [];

    container.innerHTML = `
      <div class="content-card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="list-back-btn">Back to Categories</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0;">${catName}</h3>
        </div>
        <input type="text" class="search-input" id="calc-search-inp" placeholder="Search category formulas..." style="margin-bottom:15px; width: 100%;">
        
        <div class="sizes-grid" style="grid-template-columns:1fr; gap:10px;" id="formula-list-container"></div>
      </div>
    `;

    setupSearchInput();
    document.getElementById('list-back-btn').onclick = () => {
      calcSubState.view = 'categories';
      renderDrillingCalcScreen();
    };

    const listCont = document.getElementById('formula-list-container');
    list.forEach(m => {
      const item = document.createElement('div');
      item.className = 'toolkit-card compact-card';
      item.innerHTML = `
        <div class="card-left">
          <div class="card-info">
            <span class="card-title">${m.name}</span>
            <span class="card-desc">${m.desc}</span>
          </div>
        </div>
        <span class="card-chevron">&gt;</span>
      `;
      item.onclick = () => {
        calcSubState.view = 'formula';
        calcSubState.formulaId = m.id;
        renderDrillingCalcScreen();
      };
      listCont.appendChild(item);
    });

  } else if (calcSubState.view === 'formula') {
    // Detailed Calculator View
    const list = formulaDb[calcSubState.category] || [];
    const f = list.find(x => x.id === calcSubState.formulaId);
    if (!f) {
      calcSubState.view = 'categories';
      renderDrillingCalcScreen();
      return;
    }

    container.innerHTML = `
      <div class="content-card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="form-back-btn">Back to List</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0;">Calculator</h3>
        </div>
        
        <h4 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${f.name}</h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:20px;">${f.desc}</p>
        
        <div id="dynamic-inputs-container"></div>
        
        <div class="result-card" style="margin-top:20px; border-left:4px solid var(--accent-color);">
          <span class="result-label">Calculated Output</span>
          <span class="result-value" id="calc-output-val">- <span class="unit-lbl">${f.unit}</span></span>
        </div>
      </div>
    `;

    document.getElementById('form-back-btn').onclick = () => {
      calcSubState.view = 'list';
      renderDrillingCalcScreen();
    };

    const inputsCont = document.getElementById('dynamic-inputs-container');
    f.inputs.forEach(inp => {
      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label>${inp.label}</label>
        <input type="number" step="any" class="form-input table-input" id="inp-${inp.key}" value="${inp.val}" style="text-align:left; width:100%; border-radius:var(--border-radius-pill); padding:14px 20px;">
      `;
      inputsCont.appendChild(group);
    });

    const runCalc = () => {
      const arg = {};
      f.inputs.forEach(inp => {
        const el = document.getElementById(`inp-${inp.key}`);
        arg[inp.key] = el ? (parseFloat(el.value) || 0) : 0;
      });
      try {
        const result = f.calc(arg);
        const outVal = typeof result === 'number' ?
          result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) :
          result;
        document.getElementById('calc-output-val').innerHTML = `${outVal} <span class="unit-lbl">${f.unit}</span>`;
      } catch (err) {
        document.getElementById('calc-output-val').innerHTML = `Error <span class="unit-lbl">${f.unit}</span>`;
      }
    };

    // Listen to changes on all dynamic input fields
    f.inputs.forEach(inp => {
      document.getElementById(`inp-${inp.key}`).addEventListener('input', runCalc);
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
  Object.keys(formulaDb).forEach(cat => {
    formulaDb[cat].forEach(f => {
      if (fuzzyMatch(f.name, query) || fuzzyMatch(f.desc, query)) {
        matches.push({ ...f, cat });
      }
    });
  });

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
let wellControlSubState = {
  view: 'menu',      // 'menu', 'formula', or 'equations'
  category: null,    // 'surface' or 'subsea'
  formulaId: null    // the specific formula ID
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

window.openWcFormula = (category, formulaId) => {
  wellControlSubState.view = 'formula';
  wellControlSubState.category = category;
  wellControlSubState.formulaId = formulaId;
  renderWellControlScreen();
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

  // Intercept screen back button to control our sub-navigation
  const backBtn = document.querySelector('#screen-well-control .back-btn');
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      if (wellControlSubState.fromScreen) {
        const dest = wellControlSubState.fromScreen;
        wellControlSubState.fromScreen = null;
        navigateTo(dest);
      } else if (wellControlSubState.view !== 'menu') {
        wellControlSubState.view = 'menu';
        wellControlSubState.category = null;
        wellControlSubState.formulaId = null;
        renderWellControlScreen();
      } else {
        navigateBack();
      }
    };
  }

  if (wellControlSubState.view === 'menu') {
    container.innerHTML = `
      <div class="well-control-menu">
        <!-- Surface well control category card -->
        <div class="wc-category-card">
          <div class="wc-category-header">
            <div class="wc-category-icon-container" style="background-color: var(--circle-surface);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#68553F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 22h20M6 22V15M18 22V15"></path>
                <rect x="8" y="11" width="8" height="4" rx="1"></rect>
                <path d="M12 11V7M9 7h6M8 4h8"></path>
                <circle cx="12" cy="7" r="2"></circle>
              </svg>
            </div>
            <div class="wc-category-info">
              <h3 class="wc-category-title">Surface</h3>
              <p class="wc-category-desc">Calculations for surface stack operations</p>
            </div>
          </div>
          <div class="wc-formula-list">
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'icp')">
              <span>Initial Circulating Pressure</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'fcp')">
              <span>Final Circulating Pressure</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'kmw')">
              <span>Kill Mud Weight</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'kick_tolerance')">
              <span>Kick Tolerance</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'maasp')">
              <span>MAASP</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'trip_margin')">
              <span>Trip Margin</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'safety_margin')">
              <span>Safety Margin</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('surface', 'volume_to_bleed')">
              <span>Volume to Bleed to Keep BHP Constant</span>
              <span class="chevron">&rsaquo;</span>
            </div>
          </div>
        </div>

        <!-- Subsea well control category card -->
        <div class="wc-category-card">
          <div class="wc-category-header">
            <div class="wc-category-icon-container" style="background-color: var(--circle-subsea);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B556C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 3c2 0 3 1 5 1s3-1 5-1 3 1 5 1" stroke-dasharray="2,2"></path>
                <path d="M2 6c2 0 3 1 5 1s3-1 5-1 3 1 5 1"></path>
                <rect x="8" y="11" width="8" height="8" rx="1.5"></rect>
                <path d="M12 8v3M5 19h14M12 19v3"></path>
              </svg>
            </div>
            <div class="wc-category-info">
              <h3 class="wc-category-title">Subsea</h3>
              <p class="wc-category-desc">Calculations for subsea BOP & marine riser operations</p>
            </div>
          </div>
          <div class="wc-formula-list">
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'riser_margin')">
              <span>Riser Margin</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'subsea_accumulator')">
              <span>Subsea Accumulator Capacity</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'gas_migration')">
              <span>Gas Migration</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'max_surface_pressure')">
              <span>Maximum Surface Pressure</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'kmw')">
              <span>Kill Mud Weight</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'kick_tolerance')">
              <span>Kick Tolerance</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'safety_margin')">
              <span>Safety Margin</span>
              <span class="chevron">&rsaquo;</span>
            </div>
            <div class="wc-formula-item" onclick="openWcFormula('subsea', 'volume_to_bleed')">
              <span>Volume to Bleed to Keep BHP Constant</span>
              <span class="chevron">&rsaquo;</span>
            </div>
          </div>
        </div>



      </div>
    `;
  } else if (wellControlSubState.view === 'clf-guide') {
    container.innerHTML = `
      <div class="content-card" style="padding: 16px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="wc-clf-back-btn">Back to Menu</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0;">Choke Line Friction (CLF)</h3>
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
      if (wellControlSubState.fromScreen) {
        const dest = wellControlSubState.fromScreen;
        wellControlSubState.fromScreen = null;
        navigateTo(dest);
      } else {
        wellControlSubState.view = 'menu';
        renderWellControlScreen();
      }
    };
  } else if (wellControlSubState.view === 'formula') {
    const list = wellControlDb[wellControlSubState.category] || [];
    const f = list.find(x => x.id === wellControlSubState.formulaId);
    if (!f) {
      wellControlSubState.view = 'menu';
      renderWellControlScreen();
      return;
    }

    container.innerHTML = `
      <div class="content-card">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
          <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.75rem; border-radius:12px; flex:none;" id="wc-form-back-btn">Back to Menu</button>
          <h3 style="font-size:0.95rem; font-weight:600; margin:0; text-transform: capitalize;">${wellControlSubState.category} Stack</h3>
        </div>
        
        <h4 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${f.name}</h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:20px;">${f.desc}</p>
        
        <div id="wc-dynamic-inputs-container"></div>
        
        <div class="result-card" style="margin-top:20px; border-left:4px solid var(--accent-color);">
          <span class="result-label">Calculated Output</span>
          <span class="result-value" id="wc-calc-output-val">- <span class="unit-lbl">${f.unit}</span></span>
        </div>
      </div>
    `;

    document.getElementById('wc-form-back-btn').onclick = () => {
      wellControlSubState.view = 'menu';
      wellControlSubState.category = null;
      wellControlSubState.formulaId = null;
      renderWellControlScreen();
    };

    const inputsCont = document.getElementById('wc-dynamic-inputs-container');
    f.inputs.forEach(inp => {
      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label>${inp.label}</label>
        <input type="number" step="any" class="form-input table-input" id="wc-inp-${inp.key}" value="${inp.val}" style="text-align:left; width:100%; border-radius:var(--border-radius-pill); padding:14px 20px;">
      `;
      inputsCont.appendChild(group);
    });

    const runWcCalc = () => {
      const arg = {};
      f.inputs.forEach(inp => {
        const el = document.getElementById(`wc-inp-${inp.key}`);
        arg[inp.key] = el ? (parseFloat(el.value) || 0) : 0;
      });
      try {
        const result = f.calc(arg);
        const outVal = typeof result === 'number' ?
          result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) :
          result;
        document.getElementById('wc-calc-output-val').innerHTML = `${outVal} <span class="unit-lbl">${f.unit}</span>`;
      } catch (err) {
        document.getElementById('wc-calc-output-val').innerHTML = `Error <span class="unit-lbl">${f.unit}</span>`;
      }
    };

    f.inputs.forEach(inp => {
      document.getElementById(`wc-inp-${inp.key}`).addEventListener('input', runWcCalc);
    });

    runWcCalc();

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

function renderQuickRefScreen() {
  const container = document.getElementById('quick-ref-container');
  if (!container) return;

  const subtitleEl = document.querySelector('#screen-quick-ref .screen-subtitle');
  const backBtn = document.querySelector('#screen-quick-ref .back-btn');

  if (quickRefSubState.view === 'menu') {
    if (subtitleEl) subtitleEl.textContent = 'Select quick reference category';
    if (backBtn) {
      backBtn.onclick = () => { navigateBack(); };
    }

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <!-- Option 1: Drill Bit Make-Up Torque -->
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="quickRefSubState.view = 'drill-bit-torque'; renderQuickRefScreen();">
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
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="quickRefSubState.view = 'ring-gaskets'; renderQuickRefScreen();">
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
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="quickRefSubState.view = 'wellhead'; quickRefSubState.wellheadTab = 'A'; renderQuickRefScreen();">
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
        <div class="toolkit-card compact-card" style="padding: 16px !important;" onclick="quickRefSubState.view = 'subsea-ref'; quickRefSubState.subseaTab = 'overview'; renderQuickRefScreen();">
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
    if (backBtn) {
      backBtn.onclick = () => {
        quickRefSubState.view = 'menu';
        renderQuickRefScreen();
      };
    }

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
        <div style="margin-bottom: 20px;">
          <input type="text" id="quick-ref-search" class="form-input" placeholder="Search bit thread (e.g. 4-1/2)..." style="width: 100%;">
        </div>
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
      </div>
      
      <div class="content-card" style="margin-top:20px; font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">
        <p style="margin-bottom:10px; font-weight:600; color:var(--text-primary);">Notes on Drill Bit Make-Up Torque:</p>
        <ul style="padding-left:18px; display:flex; flex-direction:column; gap:6px;">
          <li>Torque values listed above are standard recommended minimum and maximum values for regular bit threads.</li>
          <li>Ensure proper thread cleaning, inspection, and application of premium thread dope prior to make-up.</li>
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

    searchInput.oninput = (e) => {
      populate(e.target.value);
    };

    populate();
  } else if (quickRefSubState.view === 'ring-gaskets') {
    if (subtitleEl) subtitleEl.textContent = 'Ring Gaskets for 6B & 6BX Flanges';
    if (backBtn) {
      backBtn.onclick = () => {
        quickRefSubState.view = 'menu';
        renderQuickRefScreen();
      };
    }

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
        <div style="margin-bottom: 20px;">
          <input type="text" id="ring-gasket-search" class="form-input" placeholder="Search size (e.g. 4 1/16)..." style="width: 100%;">
        </div>
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
    const searchInput = document.getElementById('ring-gasket-search');

    function populate(filterText = '') {
      tbody.innerHTML = '';
      const filtered = gasketData.filter(d =>
        d.size.toLowerCase().includes(filterText.toLowerCase())
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-secondary);">No matching records found.</td></tr>`;
        return;
      }

      filtered.forEach(d => {
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

    searchInput.oninput = (e) => {
      populate(e.target.value);
    };

    populate();
  } else if (quickRefSubState.view === 'wellhead') {
    if (subtitleEl) subtitleEl.textContent = 'Surface Wellhead Body & Accessories';
    if (backBtn) {
      backBtn.onclick = () => {
        quickRefSubState.view = 'menu';
        renderQuickRefScreen();
      };
    }

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
        <div style="margin-bottom: 20px;">
          <input type="text" id="wellhead-search" class="form-input" placeholder="Search components in Section ${activeTab}..." style="width: 100%;">
        </div>
        
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
    const searchInput = document.getElementById('wellhead-search');
    const tabData = wellheadData[activeTab];

    function populate(filterText = '') {
      tbody.innerHTML = '';
      const filtered = tabData.filter(d =>
        d.desc.toLowerCase().includes(filterText.toLowerCase()) ||
        d.remark.toLowerCase().includes(filterText.toLowerCase())
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-secondary);">No matching components found.</td></tr>`;
        return;
      }

      filtered.forEach(d => {
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

    searchInput.oninput = (e) => {
      populate(e.target.value);
    };

    populate();
  } else if (quickRefSubState.view === 'subsea-ref') {
    if (subtitleEl) subtitleEl.textContent = 'Subsea Equipment Reference';
    if (backBtn) {
      backBtn.onclick = () => {
        quickRefSubState.view = 'menu';
        renderQuickRefScreen();
      };
    }

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
    desc: "Operational guidelines, dull grading, and core procedures",
    accent: "operations",
    items: [
      { id: "stuck_pipe_guide", name: "Stuck Pipe Analysis" },
      { id: "bit_dull_grading", name: "IADC Bit Dull Grading" },
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
      { id: "wait_weight_method", name: "Wait & Weight Method" }
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
  }
};

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

  // 1. Search Bar Wrapper
  let html = `
    <div class="guide-search-wrapper">
      <span class="material-icons guide-search-icon">search</span>
      <input type="text" class="guide-search-input" id="guide-search-input" placeholder="Search guides (e.g., Stuck Pipe, Bit Grading, BOP)" oninput="filterGuideTopics()">
      <button class="guide-search-clear-btn" onclick="clearGuideSearch()" style="display:none;">
        <span class="material-icons">close</span>
      </button>
    </div>
  `;

  // 2. Favorites / Quick Access Grid
  let favs = JSON.parse(localStorage.getItem('guideFavorites') || '[]');
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
    html += `
      <div class="guide-quick-access">
        <div class="guide-section-title">
          <span class="material-icons" style="font-size:1.15rem; color:#EAB308;">star</span>
          <span>QUICK ACCESS</span>
        </div>
        <div class="guide-quick-grid">
    `;

    quickAccessItems.forEach(qa => {
      html += `
        <div class="guide-quick-btn" onclick="handleGuideItemClick('${qa.itemId}', '${qa.catName}')">
          <span class="material-icons guide-quick-icon">${qa.icon}</span>
          <div class="guide-quick-info">
            <span class="guide-quick-name">${qa.name}</span>
            <span class="guide-quick-cat">${qa.catName}</span>
          </div>
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
        <div class="guide-section-title" style="margin-bottom: 4px;">
          <span class="material-icons" style="font-size:1.15rem; color:#EAB308;">star</span>
          <span>QUICK ACCESS</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 12px 0;">Click the <span class="material-icons" style="font-size: 0.85rem; color: #EAB308; vertical-align: middle;">star_border</span> on any guide to add it here.</p>
        <div style="border-bottom: 1px solid var(--border-subtle); margin: 12px 0;"></div>
        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.78rem; font-weight: 500;">
          <span class="material-icons" style="font-size:1.05rem; color:#EAB308;">star_border</span>
          <span>No quick access guides yet</span>
        </div>
      </div>
    `;
  }

  // 3. Main Accordion Card Grid
  html += `<div style="display:flex; flex-direction:column; gap:12px; padding-bottom:30px;">`;
  
  for (const catKey in drillingGuideData) {
    const cat = drillingGuideData[catKey];
    html += `
      <div class="guide-category-card guide-cat-accent-${cat.accent}" id="guide-cat-${catKey}">
        <div class="guide-category-header" onclick="toggleGuideCategory('guide-cat-${catKey}')">
          <div class="guide-category-title-section">
            <div class="guide-category-icon-wrapper">
              <span class="material-icons guide-category-icon">${cat.icon}</span>
            </div>
            <div class="guide-category-info">
              <span class="guide-category-name">${cat.name}</span>
              <span class="guide-category-desc">${cat.desc}</span>

            </div>
          </div>
          <span class="material-icons guide-category-chevron">chevron_right</span>
        </div>
        <div class="guide-subcategory-list">
    `;
    
    cat.items.forEach(item => {
      const isFav = favs.includes(item.id);
      html += `
        <div class="guide-item-row" onclick="handleGuideItemClick('${item.id}', '${cat.name}')">
          <div class="guide-item-row-left">
            <button class="guide-fav-btn ${isFav ? 'active' : ''}" onclick="toggleGuideFavorite('${item.id}', event)">
              <span class="material-icons">${isFav ? 'star' : 'star_border'}</span>
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
        if (item.name.toLowerCase().includes(query) || cat.name.toLowerCase().includes(query)) {
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
            <button class="guide-fav-btn ${isFav ? 'active' : ''}" onclick="toggleGuideFavorite('${item.id}', event)">
              <span class="material-icons">${isFav ? 'star' : 'star_border'}</span>
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
  if (event) event.stopPropagation();
  let favs = JSON.parse(localStorage.getItem('guideFavorites') || '[]');
  const idx = favs.indexOf(itemId);
  if (idx > -1) {
    favs.splice(idx, 1);
  } else {
    favs.push(itemId);
  }
  localStorage.setItem('guideFavorites', JSON.stringify(favs));
  
  // Re-render current view
  const searchInput = document.getElementById('guide-search-input');
  if (searchInput && searchInput.value.trim().length > 0) {
    filterGuideTopics();
  } else {
    renderDrillingGuideScreen();
  }
};

window.isGuideFavorited = (itemId) => {
  let favs = JSON.parse(localStorage.getItem('guideFavorites') || '[]');
  return favs.includes(itemId);
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

window.handleGuideItemClick = (itemId, categoryName) => {
  if (itemId === 'stuck_pipe_guide') {
    navigateTo('stuck-pipe');
    return;
  }
  if (itemId === 'bit_dull_grading') {
    navigateTo('bit-dull-grading');
    return;
  }
  state.selectedGuideId = itemId;
  state.selectedGuideCategory = categoryName;
  navigateTo('drilling-guide-detail');
};

window.renderDrillingGuideDetailScreen = () => {
  const itemId = state.selectedGuideId;
  const categoryName = state.selectedGuideCategory || 'Drilling Guide';
  
  const titleEl = document.getElementById('guide-detail-title');
  const subtitleEl = document.getElementById('guide-detail-subtitle');
  const container = document.getElementById('drilling-guide-detail-container');
  const favBtn = document.getElementById('guide-detail-fav-btn');
  
  if (!itemId || !container) return;
  
  const content = getGuideItemContent(itemId);
  if (titleEl) titleEl.textContent = content.title;
  if (subtitleEl) subtitleEl.textContent = categoryName;
  
  // Set favorite button icon state
  if (favBtn) {
    let favs = JSON.parse(localStorage.getItem('guideFavorites') || '[]');
    const isFav = favs.includes(itemId);
    const iconEl = favBtn.querySelector('.material-icons');
    if (iconEl) {
      iconEl.textContent = isFav ? 'star' : 'star_border';
    }
  }
  
  // Set HTML content inside a beautiful container card
  container.innerHTML = `
    <div class="guide-detail-card" style="background: var(--card-bg); border-radius: var(--border-radius-card); padding: 20px; box-shadow: var(--shadow-subtle); border: 1px solid var(--border-subtle); line-height: 1.6;">
      ${content.bodyHTML}
    </div>
  `;
  
  // Post-render init for interactive features
  if (itemId === 'bit_nozzle_selection') {
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

window.toggleDetailGuideFavorite = () => {
  const itemId = state.selectedGuideId;
  if (!itemId) return;
  
  let favs = JSON.parse(localStorage.getItem('guideFavorites') || '[]');
  const index = favs.indexOf(itemId);
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(itemId);
  }
  localStorage.setItem('guideFavorites', JSON.stringify(favs));
  
  // Re-render button state
  const favBtn = document.getElementById('guide-detail-fav-btn');
  if (favBtn) {
    const isFav = favs.includes(itemId);
    const iconEl = favBtn.querySelector('.material-icons');
    if (iconEl) {
      iconEl.textContent = isFav ? 'star' : 'star_border';
    }
  }
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
    const size = parseFloat(input.value) || 0;
    if (size > 0) {
      tfa += (size / 32) * (size / 32) * (Math.PI / 4);
    }
  });
  const resEl = document.getElementById('tfa-result');
  if (resEl) resEl.textContent = tfa.toFixed(4);
};

// Hydraulics calculations
window.calculateGuideHydraulics = () => {
  const flow = parseFloat(document.getElementById('hyd-flow').value) || 0;
  const mw = parseFloat(document.getElementById('hyd-mw').value) || 0;
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

  const kmwEl = document.getElementById('ww-val-kmw');
  const icpEl = document.getElementById('ww-val-icp');
  const fcpEl = document.getElementById('ww-val-fcp');

  if (omw > 0 && tvd > 0) {
    const kmw = omw + (sidpp / (0.052 * tvd));
    const icp = sidpp + scrp;
    const fcp = scrp * (kmw / omw);

    if (kmwEl) kmwEl.textContent = kmw.toFixed(2);
    if (icpEl) icpEl.textContent = icp.toFixed(0);
    if (fcpEl) fcpEl.textContent = fcp.toFixed(0);
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
  const mw = parseFloat(document.getElementById('hp-mw').value) || 0;
  const tvd = parseFloat(document.getElementById('hp-tvd').value) || 0;
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
  const flow = parseFloat(document.getElementById('av-flow').value) || 0;
  const hole = parseFloat(document.getElementById('av-hole').value) || 0;
  const pipe = parseFloat(document.getElementById('av-pipe').value) || 0;
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
  const md = parseFloat(document.getElementById('dls-md').value) || 100;
  const inc1 = parseFloat(document.getElementById('dls-inc1').value) || 0;
  const azi1 = parseFloat(document.getElementById('dls-azi1').value) || 0;
  const inc2 = parseFloat(document.getElementById('dls-inc2').value) || 0;
  const azi2 = parseFloat(document.getElementById('dls-azi2').value) || 0;
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
  const vol = parseFloat(document.getElementById('mudup-vol').value) || 0;
  const initialMW = parseFloat(document.getElementById('mudup-imw').value) || 0;
  const targetMW = parseFloat(document.getElementById('mudup-tmw').value) || 0;
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
          <p class="guide-text-block">Key indicators of formation fluid entering the wellbore. Early detection prevents blowouts.</p>
          <span class="guide-section-title">Primary Indicators</span>
          <ul class="guide-bullet-list">
            <li><strong>Increase in Pit Volume:</strong> Inflowing kick fluid displaces mud into active pits.</li>
            <li><strong>Increase in Flow Rate:</strong> Return flow line indicator shows higher output than pump input.</li>
            <li><strong>Flowing with Pumps Off:</strong> The well continues to flow after mud pumps are shut down.</li>
          </ul>
        `
      };
    case "shutin_procedure":
      return {
        title: "Shut-in Procedure (Hard)",
        bodyHTML: `
          <p class="guide-text-block">Standard steps to shut-in a well when kick indicators are identified.</p>
          <span class="guide-step-list">
            <div class="guide-step-item">
              <span class="guide-step-num">1</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Space Out</span>
                <span class="guide-step-desc">Position tool joints clear of BOP rams; stop rotation.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">2</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Stop Pumps</span>
                <span class="guide-step-desc">Shut down mud pumps, then verify if well is flowing.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">3</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Close BOP</span>
                <span class="guide-step-desc">Close annular preventer or pipe rams; open choke manifold valve.</span>
              </div>
            </div>
            <div class="guide-step-item">
              <span class="guide-step-num">4</span>
              <div class="guide-step-content">
                <span class="guide-step-title">Record Pressures</span>
                <span class="guide-step-desc">Record SIDPP, SICP, and pit gain once stabilized.</span>
              </div>
            </div>
          </ul>
        `
      };
    case "drillers_method":
      return {
        title: "Driller's Method",
        bodyHTML: `
          <p class="guide-text-block">A two-circulation well control method. In the 1st circulation, kick is pumped out with original mud. In the 2nd circulation, kill mud is pumped.</p>
          <span class="guide-section-title">First Circulation</span>
          <ul class="guide-bullet-list">
            <li>Pump kick out using original mud weight (OMW).</li>
            <li>Maintain casing pressure constant until pumps reach SCR rate, then maintain drillpipe pressure constant until kick is out.</li>
          </ul>
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
            </div>
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

window.onBitTypeChanged = () => {
  const typeSelect = document.getElementById('bit-info-type');
  if (!typeSelect) return;
  const type = typeSelect.value;
  const bearingSelect = document.getElementById('bit-grade-b');
  if (bearingSelect) {
    if (type === 'PDC') {
      bearingSelect.value = 'X';
      bearingSelect.disabled = true;
    } else {
      bearingSelect.disabled = false;
      if (bearingSelect.value === 'X') {
        bearingSelect.value = 'E';
      }
    }
  }
  generateIADCGrade(true);
};

window.generateIADCGrade = (bypassValidation) => {
  const i = document.getElementById('bit-grade-i').value;
  const o = document.getElementById('bit-grade-o').value;
  const d = document.getElementById('bit-grade-d').value;
  const l = document.getElementById('bit-grade-l').value;
  const b = document.getElementById('bit-grade-b').value;
  const g = document.getElementById('bit-grade-g').value;
  const o2 = document.getElementById('bit-grade-o2').value;
  const r = document.getElementById('bit-grade-r').value;
  
  const grade = `${i}-${o}-${d}-${l}-${b}-${g}-${o2}-${r}`;
  
  const gradeCodeEl = document.getElementById('iadc-visual-grade-code');
  if (gradeCodeEl) gradeCodeEl.textContent = grade;
  
  const visualGradeCard = document.getElementById('iadc-visual-grade-card');
  if (visualGradeCard) visualGradeCard.style.display = 'block';
  
  state.iadcCardVisible = true;
  return grade;
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
  
  window.navigateTo('iadc-history');
  renderBitDullGradingHistory();
};

window.editIADCRecord = (recordId) => {
  const records = JSON.parse(localStorage.getItem('iadcGradingRecords') || '[]');
  const rec = records.find(r => r.id === recordId);
  if (!rec) return;
  
  state.editingIADCRecordId = recordId;
  
  document.getElementById('bit-info-type').value = rec.type || 'PDC';
  document.getElementById('bit-info-size').value = rec.size || '';
  document.getElementById('bit-info-mfg').value = rec.mfg || '';
  document.getElementById('bit-info-sn').value = rec.sn || '';
  
  document.getElementById('bit-grade-i').value = rec.gradeI || '0';
  document.getElementById('bit-grade-o').value = rec.gradeO || '0';
  document.getElementById('bit-grade-d').value = rec.gradeD || 'NO';
  document.getElementById('bit-grade-l').value = rec.gradeL || 'N';
  document.getElementById('bit-grade-b').value = rec.gradeB || 'X';
  document.getElementById('bit-grade-g').value = rec.gradeG || 'I';
  document.getElementById('bit-grade-o2').value = rec.gradeO2 || 'X';
  document.getElementById('bit-grade-r').value = rec.gradeR || 'TD';
  
  document.getElementById('bit-grade-comments').value = rec.comments || '';
  
  onBitTypeChanged();
  generateIADCGrade(true);
  
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
  
  const saveBtnText = document.getElementById('iadc-save-btn-text');
  if (saveBtnText) {
    saveBtnText.textContent = (window.I18n && window.I18n.translate) ? window.I18n.translate('Update Record') : 'Update Record';
  }
  
  window.navigateTo('bit-dull-grading');
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


