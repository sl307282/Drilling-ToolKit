/**
 * Drilling ToolKit - Central Reactive Unit Engine
 * Single Source of Truth for Unit Systems (API, SI, Mixed)
 * Boundary-Adapter pattern: UI Display <-> Native Formula Units
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.UnitsEngine = factory();
    root.UnitEngine = root.UnitsEngine; // Alias for convenience
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Exact fundamental conversion factors
  const FT_TO_M = 0.3048;
  const M_TO_FT = 1 / 0.3048;
  const IN_TO_MM = 25.4;
  const MM_TO_IN = 1 / 25.4;
  const IN_TO_FT = 1 / 12;
  const FT_TO_IN = 12;

  const GAL_TO_L = 3.785411784;
  const L_TO_GAL = 1 / 3.785411784;
  const BBL_TO_GAL = 42.0;
  const BBL_TO_L = 42.0 * GAL_TO_L; // 158.987294928
  const L_TO_BBL = 1 / BBL_TO_L;
  const BBL_TO_M3 = BBL_TO_L / 1000.0; // 0.158987294928
  const M3_TO_BBL = 1 / BBL_TO_M3;
  const M3_TO_L = 1000.0;
  const L_TO_M3 = 0.001;

  // Capacity / Volume per length
  // 1 bbl/ft = 158.987294928 L / 0.3048 m = 521.6118599999999... L/m
  const BBL_FT_TO_L_M = BBL_TO_L / FT_TO_M;
  const L_M_TO_BBL_FT = 1 / BBL_FT_TO_L_M;
  const BBL_FT_TO_BBL_M = 1 / FT_TO_M; // 3.280839895013123 bbl/m
  const BBL_M_TO_BBL_FT = FT_TO_M;
  const BBL_M_TO_L_M = BBL_TO_L; // 158.987294928
  const L_M_TO_BBL_M = 1 / BBL_TO_L;
  const M3_M_TO_L_M = 1000.0;
  const L_M_TO_M3_M = 0.001;

  // Mass & Density
  const LB_TO_KG = 0.45359237;
  const KG_TO_LB = 1 / 0.45359237;
  // 1 ppg = (1 lb / gal) = 0.45359237 kg / 0.003785411784 m³ = 119.826427321556... kg/m³
  const PPG_TO_KG_M3 = LB_TO_KG / (GAL_TO_L * 0.001);
  const KG_M3_TO_PPG = 1 / PPG_TO_KG_M3;
  const PPG_TO_SG = PPG_TO_KG_M3 / 1000.0; // ~0.11982642732
  const SG_TO_PPG = 1 / PPG_TO_SG; // ~8.345404452
  const PPG_TO_LB_FT3 = 7.48051948051948; // 1 ft³ = 7.48052 gal -> lb/ft³ = ppg * 7.48052
  const LB_FT3_TO_PPG = 1 / 7.48051948051948;

  // Pressure
  // 1 psi = 6894.757293168 Pa = 0.06894757293168 bar = 6.894757293168 kPa = 0.006894757293168 MPa
  const PSI_TO_BAR = 0.06894757293168;
  const BAR_TO_PSI = 1 / PSI_TO_BAR;
  const PSI_TO_KPA = 6.894757293168;
  const KPA_TO_PSI = 1 / PSI_TO_KPA;
  const PSI_TO_MPA = 0.006894757293168;
  const MPA_TO_PSI = 1 / PSI_TO_MPA;
  const BAR_TO_KPA = 100.0;
  const KPA_TO_BAR = 0.01;
  const BAR_TO_MPA = 0.1;
  const MPA_TO_BAR = 10.0;

  // Pressure gradient
  // 1 psi/ft = 0.06894757293168 bar / 0.3048 m = 0.22620594793858... bar/m
  const PSI_FT_TO_BAR_M = PSI_TO_BAR / FT_TO_M;
  const BAR_M_TO_PSI_FT = 1 / PSI_FT_TO_BAR_M;
  const PSI_FT_TO_KPA_M = PSI_TO_KPA / FT_TO_M;
  const KPA_M_TO_PSI_FT = 1 / PSI_FT_TO_KPA_M;

  // Force & Hookload
  // 1 lbf = 4.4482216152605 N = 0.0044482216152605 kN
  const LBF_TO_N = 4.4482216152605;
  const N_TO_LBF = 1 / LBF_TO_N;
  const LBF_TO_KN = LBF_TO_N * 0.001;
  const KN_TO_LBF = 1 / LBF_TO_KN;
  const KLBF_TO_KN = LBF_TO_KN * 1000.0;
  const KN_TO_KLBF = 1 / KLBF_TO_KN;
  const LBF_TO_KG = LB_TO_KG;
  const LBF_TO_TONNE = LB_TO_KG * 0.001;

  // Torque
  // 1 ft-lbf = 0.3048 m * 4.4482216152605 N = 1.3558179483314 N·m
  const FT_LBF_TO_NM = FT_TO_M * LBF_TO_N;
  const NM_TO_FT_LBF = 1 / FT_LBF_TO_NM;
  const FT_LBF_TO_KNM = FT_LBF_TO_NM * 0.001;
  const KNM_TO_FT_LBF = 1 / FT_LBF_TO_KNM;

  // Weight per length
  // 1 lb/ft = 0.45359237 kg / 0.3048 m = 1.4881639435695537 kg/m
  const LB_FT_TO_KG_M = LB_TO_KG / FT_TO_M;
  const KG_M_TO_LB_FT = 1 / LB_FT_TO_KG_M;

  // Velocity
  const FT_MIN_TO_M_MIN = FT_TO_M;
  const M_MIN_TO_FT_MIN = M_TO_FT;
  const FT_S_TO_M_S = FT_TO_M;
  const M_S_TO_FT_S = M_TO_FT;

  // Yield point / Gel strength
  // 1 lbf/100ft² = 4.4482216152605 N / (100 * 0.3048² m²) = 0.47880258930435286 Pa
  const LBF_100FT2_TO_PA = LBF_TO_N / (100.0 * FT_TO_M * FT_TO_M);
  const PA_TO_LBF_100FT2 = 1 / LBF_100FT2_TO_PA;

  // Additives concentration
  // 1 lb/bbl = 0.45359237 kg / 0.158987294928 m³ = 2.8530101784 kg/m³
  const LB_BBL_TO_KG_M3 = LB_TO_KG / BBL_TO_M3;
  const KG_M3_TO_LB_BBL = 1 / LB_BBL_TO_KG_M3;

  // Cement yield & mix water
  // 1 ft³/sk = 28.316846592 L/sk
  const FT3_TO_L = Math.pow(FT_TO_M * 10, 3); // 28.316846592
  const L_TO_FT3 = 1 / FT3_TO_L;

  // Dogleg severity
  // °/100ft -> °/30m: 30 / (100 * 0.3048) = 30 / 30.48 = 0.984251968503937
  const DLS_100FT_TO_30M = 30.0 / (100.0 * FT_TO_M);
  const DLS_30M_TO_100FT = 1 / DLS_100FT_TO_30M;

  // Power
  const HP_TO_KW = 0.7456998715822702;
  const KW_TO_HP = 1 / HP_TO_KW;

  // System Definitions & Default Unit Mappings
  const SYSTEM_UNITS = {
    api: {
      length: 'ft',
      depth: 'ft',
      diameter: 'in',
      capacity: 'bbl/ft',
      volume: 'bbl',
      density: 'ppg',
      pressure: 'psi',
      pump_output: 'bbl/stk',
      flow_rate: 'gpm',
      force: 'klbs',
      force_small: 'lbs',
      torque: 'ft-lbs',
      temperature: '°F',
      gradient: 'psi/ft',
      weight_per_length: 'lb/ft',
      velocity: 'ft/min',
      dogleg: '°/100 ft',
      yield_point: 'lbf/100ft2',
      additives: 'lb/bbl',
      cement_yield: 'ft3/sk',
      mix_water: 'gal/sk',
      power: 'hp',
      area: 'in2',
      pressure_rate: 'psi/hr'
    },
    si: {
      length: 'm',
      depth: 'm',
      diameter: 'mm',
      capacity: 'L/m',
      volume: 'm3',
      density: 'SG',
      pressure: 'bar',
      pump_output: 'L/stk',
      flow_rate: 'L/min',
      force: 'kN',
      force_small: 'kN',
      torque: 'N·m',
      temperature: '°C',
      gradient: 'bar/m',
      weight_per_length: 'kg/m',
      velocity: 'm/min',
      dogleg: '°/30 m',
      yield_point: 'Pa',
      additives: 'kg/m3',
      cement_yield: 'L/sk',
      mix_water: 'L/sk',
      power: 'kW',
      area: 'mm2',
      pressure_rate: 'bar/hr'
    },
    mixed: {
      // In mixed mode, defaults mirror the application's existing default state:
      length: 'm',
      depth: 'm',
      diameter: 'in',
      capacity: 'bbl/m',
      volume: 'bbl',
      density: 'ppg',
      pressure: 'psi',
      pump_output: 'L/stk',
      flow_rate: 'gpm',
      force: 'klbs',
      force_small: 'lbs',
      torque: 'ft-lbs',
      temperature: '°F',
      gradient: 'psi/ft',
      weight_per_length: 'lb/ft',
      velocity: 'ft/min',
      dogleg: '°/100 ft',
      yield_point: 'lbf/100ft2',
      additives: 'lb/bbl',
      cement_yield: 'ft3/sk',
      mix_water: 'gal/sk',
      power: 'hp',
      area: 'in2',
      pressure_rate: 'psi/hr'
    }
  };

  /**
   * Internal State
   */
  let _currentSystem = 'mixed';
  let _listeners = [];
  let _savedMixedCapUnit = null;

  function initFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('unitSystem');
      if (stored === 'api' || stored === 'si' || stored === 'mixed') {
        _currentSystem = stored;
      } else {
        _currentSystem = 'mixed';
      }
      _savedMixedCapUnit = localStorage.getItem('mixed_saved_cap_unit') || localStorage.getItem('globalUnit') || 'bbl/m';
    }
  }

  initFromStorage();

  /**
   * Normalize unit string to canonical key
   */
  function normalizeUnitStr(u) {
    if (!u) return '';
    return String(u).trim().toLowerCase()
      .replace(/[\s\-\_]/g, '')
      .replace(/[°º]/g, '')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      .replace(/·/g, '')
      .replace(/•/g, '');
  }

  /**
   * Direct Unit Conversion Engine
   */
  function convert(quantityType, value, fromUnit, toUnit) {
    const val = Number(value);
    if (!Number.isFinite(val)) return 0;
    if (!fromUnit || !toUnit) return val;

    const from = normalizeUnitStr(fromUnit);
    const to = normalizeUnitStr(toUnit);
    if (from === to) return val;

    switch (quantityType) {
      case 'length':
      case 'depth': {
        // Base: meters (m)
        let inMeters = val;
        if (from === 'ft' || from === 'feet') inMeters = val * FT_TO_M;
        else if (from === 'in' || from === 'inch' || from === 'inches') inMeters = (val * IN_TO_FT) * FT_TO_M;
        else if (from === 'mm') inMeters = val * 0.001;
        else if (from === 'cm') inMeters = val * 0.01;
        else if (from === 'km') inMeters = val * 1000;

        if (to === 'ft' || to === 'feet') return inMeters * M_TO_FT;
        if (to === 'in' || to === 'inch' || to === 'inches') return (inMeters * M_TO_FT) * FT_TO_IN;
        if (to === 'mm') return inMeters * 1000;
        if (to === 'cm') return inMeters * 100;
        if (to === 'km') return inMeters * 0.001;
        return inMeters;
      }

      case 'diameter': {
        // Base: inches (in)
        let inInches = val;
        if (from === 'mm') inInches = val * MM_TO_IN;
        else if (from === 'cm') inInches = (val * 10) * MM_TO_IN;
        else if (from === 'm') inInches = (val * 1000) * MM_TO_IN;
        else if (from === 'ft') inInches = val * 12;

        if (to === 'mm') return inInches * IN_TO_MM;
        if (to === 'cm') return (inInches * IN_TO_MM) * 0.1;
        if (to === 'm') return (inInches * IN_TO_MM) * 0.001;
        if (to === 'ft') return inInches / 12;
        return inInches;
      }

      case 'capacity':
      case 'volume_per_length': {
        // Base: bbl/ft
        let inBblFt = val;
        if (from === 'lm' || from === 'ltrm' || from === 'l/m') inBblFt = val * L_M_TO_BBL_FT;
        else if (from === 'bblm' || from === 'bbl/m') inBblFt = val * BBL_M_TO_BBL_FT;
        else if (from === 'm3m' || from === 'm3/m') inBblFt = (val * M3_M_TO_L_M) * L_M_TO_BBL_FT;

        if (to === 'lm' || to === 'ltrm' || to === 'l/m') return inBblFt * BBL_FT_TO_L_M;
        if (to === 'bblm' || to === 'bbl/m') return inBblFt * BBL_FT_TO_BBL_M;
        if (to === 'm3m' || to === 'm3/m') return (inBblFt * BBL_FT_TO_L_M) * L_M_TO_M3_M;
        return inBblFt;
      }

      case 'volume': {
        // Base: bbl
        let inBbl = val;
        if (from === 'm3') inBbl = val * M3_TO_BBL;
        else if (from === 'l' || from === 'liter' || from === 'liters') inBbl = val * L_TO_BBL;
        else if (from === 'gal' || from === 'gallon') inBbl = val / BBL_TO_GAL;
        else if (from === 'ft3') inBbl = (val * FT3_TO_L) * L_TO_BBL;

        if (to === 'm3') return inBbl * BBL_TO_M3;
        if (to === 'l' || to === 'liter' || to === 'liters') return inBbl * BBL_TO_L;
        if (to === 'gal' || to === 'gallon') return inBbl * BBL_TO_GAL;
        if (to === 'ft3') return (inBbl * BBL_TO_L) * L_TO_FT3;
        return inBbl;
      }

      case 'density':
      case 'mud_weight': {
        // Base: ppg
        let inPpg = val;
        if (from === 'sg') inPpg = val * SG_TO_PPG;
        else if (from === 'kgm3' || from === 'kg/m3') inPpg = val * KG_M3_TO_PPG;
        else if (from === 'lbft3' || from === 'lb/ft3') inPpg = val * LB_FT3_TO_PPG;

        if (to === 'sg') return inPpg * PPG_TO_SG;
        if (to === 'kgm3' || to === 'kg/m3') return inPpg * PPG_TO_KG_M3;
        if (to === 'lbft3' || to === 'lb/ft3') return inPpg * PPG_TO_LB_FT3;
        return inPpg;
      }

      case 'pressure': {
        // Base: psi
        let inPsi = val;
        if (from === 'bar') inPsi = val * BAR_TO_PSI;
        else if (from === 'kpa') inPsi = val * KPA_TO_PSI;
        else if (from === 'mpa') inPsi = val * MPA_TO_PSI;

        if (to === 'bar') return inPsi * PSI_TO_BAR;
        if (to === 'kpa') return inPsi * PSI_TO_KPA;
        if (to === 'mpa') return inPsi * PSI_TO_MPA;
        return inPsi;
      }

      case 'pump_output': {
        // Base: bbl/stroke
        let inBblStk = val;
        if (from === 'lstk' || from === 'l/stroke' || from === 'l/stk') inBblStk = val * L_TO_BBL;

        if (to === 'lstk' || to === 'l/stroke' || to === 'l/stk') return inBblStk * BBL_TO_L;
        return inBblStk;
      }

      case 'flow_rate':
      case 'circulation_rate': {
        // Base: gpm (US gal/min)
        let inGpm = val;
        if (from === 'lmin' || from === 'l/min') inGpm = val * L_TO_GAL;
        else if (from === 'bblmin' || from === 'bbl/min' || from === 'bpm') inGpm = val * BBL_TO_GAL;
        else if (from === 'm3min' || from === 'm3/min') inGpm = (val * M3_TO_L) * L_TO_GAL;
        else if (from === 'm3hr' || from === 'm3/hr') inGpm = (val * M3_TO_L / 60.0) * L_TO_GAL;

        if (to === 'lmin' || to === 'l/min') return inGpm * GAL_TO_L;
        if (to === 'bblmin' || to === 'bbl/min' || to === 'bpm') return inGpm / BBL_TO_GAL;
        if (to === 'm3min' || to === 'm3/min') return (inGpm * GAL_TO_L) * 0.001;
        if (to === 'm3hr' || to === 'm3/hr') return (inGpm * GAL_TO_L * 60.0) * 0.001;
        return inGpm;
      }

      case 'force':
      case 'weight':
      case 'tension':
      case 'hookload': {
        // Base: lbf
        let inLbf = val;
        if (from === 'kn') inLbf = val * KN_TO_LBF;
        else if (from === 'n') inLbf = val * N_TO_LBF;
        else if (from === 'klbs' || from === 'klbf') inLbf = val * 1000.0;
        else if (from === 'lbs' || from === 'lb') inLbf = val;
        else if (from === 'kg') inLbf = val * KG_TO_LB;
        else if (from === 'ton' || from === 'mt' || from === 'tonne') inLbf = (val * 1000.0) * KG_TO_LB;

        if (to === 'kn') return inLbf * LBF_TO_KN;
        if (to === 'n') return inLbf * LBF_TO_N;
        if (to === 'klbs' || to === 'klbf') return inLbf * 0.001;
        if (to === 'lbs' || to === 'lb') return inLbf;
        if (to === 'kg') return inLbf * LB_TO_KG;
        if (to === 'ton' || to === 'mt' || to === 'tonne') return (inLbf * LB_TO_KG) * 0.001;
        return inLbf;
      }

      case 'torque': {
        // Base: ft-lbs
        let inFtLbs = val;
        if (from === 'nm' || from === 'n·m' || from === 'n-m') inFtLbs = val * NM_TO_FT_LBF;
        else if (from === 'knm' || from === 'kn·m' || from === 'kn-m') inFtLbs = val * KNM_TO_FT_LBF;

        if (to === 'nm' || to === 'n·m' || to === 'n-m') return inFtLbs * FT_LBF_TO_NM;
        if (to === 'knm' || to === 'kn·m' || to === 'kn-m') return inFtLbs * FT_LBF_TO_KNM;
        return inFtLbs;
      }

      case 'temperature': {
        // Temperature with offset conversion
        let inDegC = val;
        if (from === 'f' || from === 'degf' || from === '°f') inDegC = (val - 32.0) * (5.0 / 9.0);
        else if (from === 'k' || from === 'kelvin') inDegC = val - 273.15;

        if (to === 'f' || to === 'degf' || to === '°f') return inDegC * (9.0 / 5.0) + 32.0;
        if (to === 'k' || to === 'kelvin') return inDegC + 273.15;
        return inDegC;
      }

      case 'gradient': {
        // Base: psi/ft
        let inPsiFt = val;
        if (from === 'barm' || from === 'bar/m') inPsiFt = val * BAR_M_TO_PSI_FT;
        else if (from === 'kpam' || from === 'kpa/m') inPsiFt = val * KPA_M_TO_PSI_FT;

        if (to === 'barm' || to === 'bar/m') return inPsiFt * PSI_FT_TO_BAR_M;
        if (to === 'kpam' || to === 'kpa/m') return inPsiFt * PSI_FT_TO_KPA_M;
        return inPsiFt;
      }

      case 'weight_per_length': {
        // Base: lb/ft
        let inLbFt = val;
        if (from === 'kgm' || from === 'kg/m') inLbFt = val * KG_M_TO_LB_FT;

        if (to === 'kgm' || to === 'kg/m') return inLbFt * LB_FT_TO_KG_M;
        return inLbFt;
      }

      case 'velocity': {
        // Base: ft/min
        let inFtMin = val;
        if (from === 'mmin' || from === 'm/min') inFtMin = val * M_MIN_TO_FT_MIN;
        else if (from === 'fts' || from === 'ft/s') inFtMin = val * 60.0;
        else if (from === 'ms' || from === 'm/s') inFtMin = (val * M_S_TO_FT_S) * 60.0;
        else if (from === 'kmh' || from === 'km/h') inFtMin = (val * 1000.0 / 60.0) * M_TO_FT;

        if (to === 'mmin' || to === 'm/min') return inFtMin * FT_MIN_TO_M_MIN;
        if (to === 'fts' || to === 'ft/s') return inFtMin / 60.0;
        if (to === 'ms' || to === 'm/s') return (inFtMin * FT_MIN_TO_M_MIN) / 60.0;
        if (to === 'kmh' || to === 'km/h') return ((inFtMin * FT_MIN_TO_M_MIN) * 60.0) * 0.001;
        return inFtMin;
      }

      case 'dogleg': {
        // Base: °/100ft
        let in100ft = val;
        if (from === '30m' || from === '/30m' || from === 'deg/30m' || from === 'deg30m' || from.includes('30m')) in100ft = val * DLS_30M_TO_100FT;

        if (to === '30m' || to === '/30m' || to === 'deg/30m' || to === 'deg30m' || to.includes('30m')) return in100ft * DLS_100FT_TO_30M;
        return in100ft;
      }

      case 'yield_point':
      case 'gel_strength': {
        // Base: lbf/100ft²
        let inLbf100 = val;
        if (from === 'pa' || from === 'pascal') inLbf100 = val * PA_TO_LBF_100FT2;

        if (to === 'pa' || to === 'pascal') return inLbf100 * LBF_100FT2_TO_PA;
        return inLbf100;
      }

      case 'additives': {
        // Base: lb/bbl
        let inLbBbl = val;
        if (from === 'kgm3' || from === 'kg/m3') inLbBbl = val * KG_M3_TO_LB_BBL;

        if (to === 'kgm3' || to === 'kg/m3') return inLbBbl * LB_BBL_TO_KG_M3;
        return inLbBbl;
      }

      case 'cement_yield': {
        // Base: ft³/sk
        let inFt3Sk = val;
        if (from === 'lsk' || from === 'l/sk') inFt3Sk = val * L_TO_FT3;
        else if (from === 'm3sk' || from === 'm3/sk') inFt3Sk = (val * 1000.0) * L_TO_FT3;

        if (to === 'lsk' || to === 'l/sk') return inFt3Sk * FT3_TO_L;
        if (to === 'm3sk' || to === 'm3/sk') return (inFt3Sk * FT3_TO_L) * 0.001;
        return inFt3Sk;
      }

      case 'mix_water': {
        // Base: gal/sk
        let inGalSk = val;
        if (from === 'lsk' || from === 'l/sk') inGalSk = val * L_TO_GAL;

        if (to === 'lsk' || to === 'l/sk') return inGalSk * GAL_TO_L;
        return inGalSk;
      }

      case 'power': {
        // Base: hp
        let inHp = val;
        if (from === 'kw') inHp = val * KW_TO_HP;
        else if (from === 'w') inHp = (val * 0.001) * KW_TO_HP;

        if (to === 'kw') return inHp * HP_TO_KW;
        if (to === 'w') return (inHp * HP_TO_KW) * 1000.0;
        return inHp;
      }

      case 'pressure_rate': {
        // Base: psi/hr
        let inPsiHr = val;
        if (from === 'barhr' || from === 'bar/hr') inPsiHr = val * BAR_TO_PSI;
        else if (from === 'kpahr' || from === 'kpa/hr') inPsiHr = val * KPA_TO_PSI;
        else if (from === 'mpahr' || from === 'mpa/hr') inPsiHr = val * MPA_TO_PSI;

        if (to === 'barhr' || to === 'bar/hr') return inPsiHr * PSI_TO_BAR;
        if (to === 'kpahr' || to === 'kpa/hr') return inPsiHr * PSI_TO_KPA;
        if (to === 'mpahr' || to === 'mpa/hr') return inPsiHr * PSI_TO_MPA;
        return inPsiHr;
      }

      case 'area': {
        // Base: in²
        let inSqIn = val;
        if (from === 'mm2' || from === 'sqmm') inSqIn = val / 645.16;
        else if (from === 'm2' || from === 'sqm') inSqIn = val / 0.00064516;
        else if (from === 'ft2' || from === 'sqft') inSqIn = val * 144.0;

        if (to === 'mm2' || to === 'sqmm') return inSqIn * 645.16;
        if (to === 'm2' || to === 'sqm') return inSqIn * 0.00064516;
        if (to === 'ft2' || to === 'sqft') return inSqIn / 144.0;
        return inSqIn;
      }

      case 'nozzle': {
        // Base: 1/32 in
        let in32nds = val;
        if (from === 'mm') in32nds = (val / 25.4) * 32.0;
        else if (from === 'in' || from === 'inch') in32nds = val * 32.0;

        if (to === 'mm') return (in32nds / 32.0) * 25.4;
        if (to === 'in' || to === 'inch') return in32nds / 32.0;
        return in32nds;
      }

      default:
        return val;
    }
  }

  const NATIVE_UNITS = {
    length: 'ft',
    depth: 'ft',
    diameter: 'in',
    capacity: 'bbl/ft',
    volume: 'bbl',
    density: 'ppg',
    pressure: 'psi',
    pump_output: 'bbl/stk',
    flow_rate: 'gpm',
    force: 'lbs',
    torque: 'ft-lbs',
    temperature: '°F',
    gradient: 'psi/ft',
    weight_per_length: 'lb/ft',
    velocity: 'ft/min',
    dogleg: '°/100 ft',
    yield_point: 'lbf/100ft2',
    additives: 'lb/bbl',
    cement_yield: 'ft3/sk',
    mix_water: 'gal/sk',
    power: 'hp',
    area: 'in2',
    pressure_rate: 'psi/hr'
  };

  /**
   * Boundary Adapter Pattern
   */
  function toNative(quantityType, displayVal, displayUnit, nativeUnit) {
    if (typeof quantityType === 'number' && typeof displayVal === 'string') {
      const temp = quantityType;
      quantityType = displayVal;
      displayVal = temp;
    }
    const from = displayUnit || getUnit(quantityType);
    const to = nativeUnit || NATIVE_UNITS[quantityType] || from;
    return convert(quantityType, displayVal, from, to);
  }

  function fromNative(quantityType, nativeVal, nativeUnit, displayUnit) {
    // Robust argument swap guard if called as (val, quantityType)
    if (typeof quantityType === 'number' && typeof nativeVal === 'string') {
      const temp = quantityType;
      quantityType = nativeVal;
      nativeVal = temp;
    }
    const from = nativeUnit || NATIVE_UNITS[quantityType] || 'api';
    const to = displayUnit || getUnit(quantityType);
    return convert(quantityType, nativeVal, from, to);
  }

  const toDisplay = fromNative;

  /**
   * Derive default capacity unit automatically based on active unit system:
   * - 'api'   -> 'bbl/ft'
   * - 'si'    -> 'L/m'
   * - 'mixed' -> 'bbl/m' (default, or preserved choice)
   */
  function getDefaultCapacityUnit() {
    if (_currentSystem === 'api') return 'bbl/ft';
    if (_currentSystem === 'si') return 'L/m';
    return _savedMixedCapUnit || 'bbl/m';
  }

  /**
   * Get Active Unit for a quantity type under the current system
   */
  function getUnit(quantityType, customMixedUnit) {
    if (_currentSystem === 'api') {
      return SYSTEM_UNITS.api[quantityType] || 'api';
    }
    if (_currentSystem === 'si') {
      return SYSTEM_UNITS.si[quantityType] || 'si';
    }
    // Mixed Mode:
    if (customMixedUnit) return customMixedUnit;
    if (quantityType === 'capacity' || quantityType === 'volume_per_length') {
      return getDefaultCapacityUnit();
    }
    return SYSTEM_UNITS.mixed[quantityType] || '';
  }

  /**
   * Get Standard Unit for a specific quantity type and system
   */
  function getUnitForQuantity(quantityType, unitSystem) {
    const sys = unitSystem || _currentSystem;
    if (sys === 'api') return SYSTEM_UNITS.api[quantityType] || '';
    if (sys === 'si') return SYSTEM_UNITS.si[quantityType] || '';
    return SYSTEM_UNITS.mixed[quantityType] || '';
  }

  /**
   * Formatting Helper (rounds for display only)
   */
  function format(quantityType, nativeVal, nativeUnit, displayUnit, decimals = null) {
    const disp = fromNative(quantityType, nativeVal, nativeUnit, displayUnit);
    if (decimals === null || decimals === undefined) return disp;
    return Number(disp).toFixed(decimals);
  }

  /**
   * Parse Input Number Guard
   */
  function parseInputNumber(rawVal, fallback = 0) {
    if (rawVal === null || rawVal === undefined) return fallback;
    const str = String(rawVal).trim().replace(',', '.');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Set and Persist Unit System
   */
  function setUnitSystem(newSys) {
    const valid = (newSys === 'api' || newSys === 'si' || newSys === 'mixed') ? newSys : 'mixed';
    if (valid === _currentSystem) return;

    const prevSys = _currentSystem;
    _currentSystem = valid;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('unitSystem', valid);

      // Preserve capacity unit logic
      if (prevSys === 'mixed') {
        const curCap = localStorage.getItem('defaultCapUnit') || localStorage.getItem('globalUnit') || 'bbl/m';
        localStorage.setItem('mixed_saved_cap_unit', curCap);
        _savedMixedCapUnit = curCap;
      }

      if (valid === 'api') {
        localStorage.setItem('defaultCapUnit', 'bbl/ft');
        localStorage.setItem('globalUnit', 'bbl/ft');
      } else if (valid === 'si') {
        localStorage.setItem('defaultCapUnit', 'L/m');
        localStorage.setItem('globalUnit', 'L/m');
      } else {
        // Restore previous mixed capacity choice
        const restored = _savedMixedCapUnit || 'bbl/m';
        localStorage.setItem('defaultCapUnit', restored);
        localStorage.setItem('globalUnit', restored);
      }
    }

    // Trigger internal callbacks
    _listeners.forEach(cb => {
      try { cb(valid, prevSys); } catch (e) { console.error('Error in unit listener:', e); }
    });

    // Dispatch DOM event for application screens
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('unitSystemChanged', {
          detail: { unitSystem: valid, prevSystem: prevSys }
        }));
      } catch (e) {
        console.error('Error dispatching unitSystemChanged:', e);
      }
    }
  }

  function getUnitSystem() {
    return _currentSystem;
  }

  function subscribe(callback) {
    if (typeof callback === 'function') {
      _listeners.push(callback);
      return () => {
        _listeners = _listeners.filter(cb => cb !== callback);
      };
    }
    return () => {};
  }

  return {
    // API constants & system mappings
    SYSTEM_UNITS,
    NATIVE_UNITS,
    FACTORS: {
      FT_TO_M, M_TO_FT, IN_TO_MM, MM_TO_IN,
      BBL_TO_L, L_TO_BBL, BBL_TO_M3, M3_TO_BBL,
      BBL_FT_TO_L_M, L_M_TO_BBL_FT, BBL_FT_TO_BBL_M, BBL_M_TO_BBL_FT,
      PPG_TO_SG, SG_TO_PPG, PPG_TO_KG_M3, KG_M3_TO_PPG,
      PSI_TO_BAR, BAR_TO_PSI, PSI_TO_KPA, KPA_TO_PSI, PSI_TO_MPA, MPA_TO_PSI,
      PSI_FT_TO_BAR_M, BAR_M_TO_PSI_FT, PSI_FT_TO_KPA_M, KPA_M_TO_PSI_FT,
      LBF_TO_KN, KN_TO_LBF, LBF_TO_N, N_TO_LBF,
      FT_LBF_TO_NM, NM_TO_FT_LBF, LB_FT_TO_KG_M, KG_M_TO_LB_FT,
      LBF_100FT2_TO_PA, PA_TO_LBF_100FT2, LB_BBL_TO_KG_M3, KG_M3_TO_LB_BBL,
      FT3_TO_L, L_TO_FT3, DLS_100FT_TO_30M, DLS_30M_TO_100FT, HP_TO_KW, KW_TO_HP
    },

    // Core methods
    convert,
    toNative,
    fromNative,
    toDisplay,
    getUnit,
    getUnitForQuantity,
    format,
    parseInputNumber,

    // Reactive State
    getUnitSystem,
    setUnitSystem,
    subscribe,
    getDefaultCapacityUnit,
    get defaultCapacityUnit() {
      return getDefaultCapacityUnit();
    }
  };
}));
