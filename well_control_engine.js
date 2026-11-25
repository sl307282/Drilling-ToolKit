/**
 * Drilling ToolKit - Well Control Pure Calculation Engine
 * Pure math and validation with zero DOM dependencies.
 * Canonical internal units:
 *   Length: meters (m)
 *   Volume: barrels (bbl)
 *   Pressure: psi
 *   Mud Weight: ppg
 *   Strokes: strokes
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const config = require('./well_control_config.js');
    module.exports = factory(config);
  } else {
    root.WellControlEngine = factory(root.WellControlConfig);
  }
}(typeof self !== 'undefined' ? self : this, function (Config) {
  'use strict';

  const CFG = Config || {
    LIMITS: {
      MAX_PLAUSIBLE_TVD_M: 10000,
      MAX_PLAUSIBLE_TVD_FT: 32808.4,
      CASING_20_MAX_SHOE_TVD_M: 3000,
      CASING_20_MAX_SHOE_TVD_FT: 9842.5,
      DEEP_WELL_THRESHOLD_M: 3000,
      MIN_PLAUSIBLE_KRP_PSI: 100,
      PUMP_OUTPUT_MIN_BBL_STK: 0.03,
      PUMP_OUTPUT_MAX_BBL_STK: 0.25
    },
    BARITE: {
      MAX_MUD_WEIGHT_PPG: 35.8,
      COEFFICIENT: 1490,
      SACK_WEIGHT_LB: 100,
      SACK_WEIGHT_KG: 45.3592,
      SURFACE_RESERVE_PERCENT: 20
    },
    PRESSURE_BADGES: {
      SAFE_MAX_RATIO: 0.75,
      CAUTION_MAX_RATIO: 0.90
    },
    KICK_CLASSIFICATION: {
      GAS_MAX_GRADIENT_PSI_FT: 0.25,
      OIL_MAX_GRADIENT_PSI_FT: 0.40,
      ASSUMED_GAS_GRADIENT_PSI_FT: 0.10
    },
    ROUNDING_MODES: {
      UP_0_1: '0.1',
      UP_0_05: '0.05',
      EXACT: 'exact'
    },
    PRESSURE_FACTOR_US: 0.052,
    BBL_TO_LITERS: 158.987294928,
    METERS_TO_FEET: 3.28084
  };

  const BBL_TO_L = CFG.BBL_TO_LITERS || 158.987294928;
  const L_TO_BBL = 1 / BBL_TO_L;
  const M_TO_FT = CFG.METERS_TO_FEET || 3.28084;
  const FT_TO_M = 1 / M_TO_FT;
  const FACTOR_US = CFG.PRESSURE_FACTOR_US || 0.052;

  /**
   * Helper: overlap between segment [pStart, pEnd] and interval [sStart, sEnd]
   */
  function getIntersect(pStart, pEnd, sStart, sEnd) {
    return Math.max(0, Math.min(pEnd, sEnd) - Math.max(pStart, sStart));
  }

  /**
   * Round value according to KMW rounding mode
   */
  function roundKmw(rawKmw, mode) {
    if (mode === 'exact') {
      return rawKmw;
    }
    if (mode === '0.05') {
      return Math.ceil(rawKmw * 20) / 20;
    }
    // Default: '0.1'
    return Math.ceil(rawKmw * 10) / 10;
  }

  /**
   * Calculate Volumes and Strokes for Drilling and Subsea configurations.
   * Internal canonical inputs:
   *   All depths in meters
   *   Capacities in bbl/m or L/m (if capInLiters is true, converts to bbl/m)
   *   Pump output in bbl/stk (or L/stk if pumpInLiters is true)
   */
  function calculateVolumesAndStrokes(inputs, ref, options) {
    const opts = options || {};
    const capMultiplier = opts.capacitiesInLiters ? L_TO_BBL : 1.0;
    const pumpMultiplier = opts.pumpInLiters ? L_TO_BBL : 1.0;
    const rigType = inputs.rigType || (inputs.flowType === 'surface' ? (CFG.RIG_TYPES ? CFG.RIG_TYPES.LAND : 'LAND') : (CFG.RIG_TYPES ? CFG.RIG_TYPES.SUBSEA_FLOATER : 'SUBSEA_FLOATER'));
    const isSurface = rigType === 'JACKUP' || rigType === 'LAND' || (CFG.RIG_TYPES && (rigType === CFG.RIG_TYPES.JACKUP || rigType === CFG.RIG_TYPES.LAND)) || inputs.flowType === 'surface';
    const flowType = isSurface ? 'surface' : 'subsea';
    const hasRiser = isSurface ? false : (inputs.hasRiser !== false && inputs.sectionType !== 'riserless');
    const isRiserless = (flowType === 'subsea' && !hasRiser);
    const bopStatus = (!isRiserless && hasRiser) ? (inputs.bopStatus || 'open') : 'open';
    const spm = parseFloat(inputs.spm) || CFG.DEFAULT_SPM || 60;

    const holeMD = parseFloat(inputs.holeMD) || 0;
    const holeTVD = parseFloat(inputs.holeTVD) || 0;
    const shoeMD = parseFloat(inputs.shoeMD) || 0;
    const shoeTVD = parseFloat(inputs.shoeTVD) || 0;
    const riserLength = (!isRiserless && hasRiser) ? (parseFloat(inputs.riserLength) || 0) : 0;
    const chokeLength = (!isRiserless && hasRiser) ? (parseFloat(inputs.chokeLength) || riserLength) : 0;
    const waterDepth = (!isRiserless && flowType === 'surface' && inputs.rigType === 'JACKUP') ? (parseFloat(inputs.waterDepth) || 0) : 0;
    const airGap = (!isRiserless && flowType === 'surface' && inputs.rigType === 'JACKUP') ? (parseFloat(inputs.airGap) || 0) : 0;

    // Drillstring section lengths
    const dcLen = parseFloat(inputs.dcLength) || 0;
    const dcLen2 = parseFloat(inputs.dcLength2) || 0;
    const dcLen3 = parseFloat(inputs.dcLength3) || 0;
    const hwdpLen = parseFloat(inputs.hwdpLength) || 0;
    const dpLen = parseFloat(inputs.dpLength) || 0;
    const dpLen2 = parseFloat(inputs.dpLength2) || 0;
    const dpLen3 = parseFloat(inputs.dpLength3) || 0;

    const safeRef = ref || {};

    // Capacities (bbl/m)
    const refCaps = safeRef.capacities || {};
    let dcCap = (parseFloat(refCaps.DC) || 0) * capMultiplier;
    let dcCap2 = (parseFloat(refCaps.DC2) || 0) * capMultiplier;
    let dcCap3 = (parseFloat(refCaps.DC3) || 0) * capMultiplier;
    let hwdpCap = (parseFloat(refCaps.HWDP) || 0) * capMultiplier;
    let dpCap = (parseFloat(refCaps.DP) || 0) * capMultiplier;
    let dpCap2 = (parseFloat(refCaps.DP2) || 0) * capMultiplier;
    let dpCap3 = (parseFloat(refCaps.DP3) || 0) * capMultiplier;

    // Safe fallback tubular capacities if completely missing
    if (dcCap <= 0) dcCap = (opts.capacitiesInLiters ? 4.01 : 4.01 * L_TO_BBL) * capMultiplier;
    if (hwdpCap <= 0) hwdpCap = (opts.capacitiesInLiters ? 4.60 : 4.60 * L_TO_BBL) * capMultiplier;
    if (dpCap <= 0) dpCap = (opts.capacitiesInLiters ? 9.05 : 9.05 * L_TO_BBL) * capMultiplier;

    // Dimensions for custom hole fallback formula: (Hole_ID² - Pipe_OD²) / 1029.4 * 3.28084
    const holeOD = parseFloat(inputs.holeOD || inputs.selectedHoleSize || inputs.holeSize || 26);
    const casingID = parseFloat(inputs.casingID || inputs.conductorCasingID || (inputs.casingOD ? inputs.casingOD - 2 : 28));
    const dcOD = parseFloat(inputs.dcOD || inputs.dcSize || 6.5);
    const hwdpOD = parseFloat(inputs.hwdpOD || inputs.hwdpSize || 5.0);
    const dpOD = parseFloat(inputs.dpOD || inputs.dpSize || 5.0);

    const getFallbackOHCapBblM = (pipeOD, pipeType) => {
      const hKey = String(holeOD);
      const pKey = `${pipeOD}_${pipeType}`;
      if (CFG.ANNULAR_PRESETS_BBL_M && CFG.ANNULAR_PRESETS_BBL_M.openHole && CFG.ANNULAR_PRESETS_BBL_M.openHole[hKey]) {
        if (CFG.ANNULAR_PRESETS_BBL_M.openHole[hKey][pKey] !== undefined) {
          return CFG.ANNULAR_PRESETS_BBL_M.openHole[hKey][pKey];
        }
      }
      return Math.max(0, ((holeOD * holeOD - pipeOD * pipeOD) / 1029.4) * 3.28084);
    };

    const getFallbackCasCapBblM = (pipeOD, pipeType) => {
      const cKey = String(inputs.casingOD || (inputs.casingID ? Math.round(inputs.casingID + 2) : 30));
      const pKey = `${pipeOD}_${pipeType}`;
      if (CFG.ANNULAR_PRESETS_BBL_M && CFG.ANNULAR_PRESETS_BBL_M.casing && CFG.ANNULAR_PRESETS_BBL_M.casing[cKey]) {
        if (CFG.ANNULAR_PRESETS_BBL_M.casing[cKey][pKey] !== undefined) {
          return CFG.ANNULAR_PRESETS_BBL_M.casing[cKey][pKey];
        }
      }
      return Math.max(0, ((casingID * casingID - pipeOD * pipeOD) / 1029.4) * 3.28084);
    };

    // Annular capacities (bbl/m)
    const ohCaps = safeRef.openHoleAnnular || {};
    let ohDcCap = (parseFloat(ohCaps.DC) || 0) * capMultiplier;
    let ohDcCap2 = (parseFloat(ohCaps.DC2) || 0) * capMultiplier;
    let ohDcCap3 = (parseFloat(ohCaps.DC3) || 0) * capMultiplier;
    let ohHwdpCap = (parseFloat(ohCaps.HWDP) || 0) * capMultiplier;
    let ohDpCap = (parseFloat(ohCaps.DP) || 0) * capMultiplier;
    let ohDpCap2 = (parseFloat(ohCaps.DP2) || 0) * capMultiplier;
    let ohDpCap3 = (parseFloat(ohCaps.DP3) || 0) * capMultiplier;

    // Safe fallbacks if any open-hole capacity preset is missing or 0
    if (ohDcCap <= 0) ohDcCap = getFallbackOHCapBblM(dcOD, 'DC');
    if (ohHwdpCap <= 0) ohHwdpCap = getFallbackOHCapBblM(hwdpOD, 'HWDP');
    if (ohDpCap <= 0) ohDpCap = getFallbackOHCapBblM(dpOD, 'DP');

    const casCaps = safeRef.casingAnnular || {};
    let casDcCap = (parseFloat(casCaps.DC) || 0) * capMultiplier;
    let casDcCap2 = (parseFloat(casCaps.DC2) || 0) * capMultiplier;
    let casDcCap3 = (parseFloat(casCaps.DC3) || 0) * capMultiplier;
    let casHwdpCap = (parseFloat(casCaps.HWDP) || 0) * capMultiplier;
    let casDpCap = (parseFloat(casCaps.DP) || 0) * capMultiplier;
    let casDpCap2 = (parseFloat(casCaps.DP2) || 0) * capMultiplier;
    let casDpCap3 = (parseFloat(casCaps.DP3) || 0) * capMultiplier;

    // Safe fallbacks if any casing annular capacity preset is missing or 0
    if (casDcCap <= 0) casDcCap = getFallbackCasCapBblM(dcOD, 'DC');
    if (casHwdpCap <= 0) casHwdpCap = getFallbackCasCapBblM(hwdpOD, 'HWDP');
    if (casDpCap <= 0) casDpCap = getFallbackCasCapBblM(dpOD, 'DP');

    const riserAnnularCap = (parseFloat(safeRef.riserAnnular) || 0) * capMultiplier;
    const chokeCap = (parseFloat(safeRef.chokeCapacity) || 0) * capMultiplier;

    const pumpOutput = (parseFloat(safeRef.pumpOutput !== undefined ? safeRef.pumpOutput : inputs.pumpOutput) || 0) * pumpMultiplier;

    // 1. String Volume (bbl)
    const stringSections = [
      { name: 'DC', length: dcLen, capacity: dcCap, volume: dcLen * dcCap },
      { name: 'DC2', length: dcLen2, capacity: dcCap2, volume: dcLen2 * dcCap2 },
      { name: 'DC3', length: dcLen3, capacity: dcCap3, volume: dcLen3 * dcCap3 },
      { name: 'HWDP', length: hwdpLen, capacity: hwdpCap, volume: hwdpLen * hwdpCap },
      { name: 'DP3', length: dpLen3, capacity: dpCap3, volume: dpLen3 * dpCap3 },
      { name: 'DP2', length: dpLen2, capacity: dpCap2, volume: dpLen2 * dpCap2 },
      { name: 'DP', length: dpLen, capacity: dpCap, volume: dpLen * dpCap }
    ];

    const stringVolume = stringSections.reduce((acc, s) => acc + s.volume, 0);

    // Tubular segment positions (from bottom Hole MD upwards to surface 0)
    const dcEnd = holeMD;
    const dcStart = holeMD - dcLen;
    const dc2End = dcStart;
    const dc2Start = dcStart - dcLen2;
    const dc3End = dc2Start;
    const dc3Start = dc2Start - dcLen3;
    const hwdpEnd = dc3Start;
    const hwdpStart = dc3Start - hwdpLen;
    const dp3End = hwdpStart;
    const dp3Start = hwdpStart - dpLen3;
    const dp2End = dp3Start;
    const dp2Start = dp3Start - dpLen2;
    const dpEnd = dp2Start;
    const dpStart = 0;

    // Open Hole interval: [shoeMD, holeMD]
    const dcInOH = getIntersect(dcStart, dcEnd, shoeMD, holeMD);
    const dc2InOH = getIntersect(dc2Start, dc2End, shoeMD, holeMD);
    const dc3InOH = getIntersect(dc3Start, dc3End, shoeMD, holeMD);
    const hwdpInOH = getIntersect(hwdpStart, hwdpEnd, shoeMD, holeMD);
    const dp3InOH = getIntersect(dp3Start, dp3End, shoeMD, holeMD);
    const dp2InOH = getIntersect(dp2Start, dp2End, shoeMD, holeMD);
    const dpInOH = getIntersect(dpStart, dpEnd, shoeMD, holeMD);

    const openHoleVolume = (dcInOH * ohDcCap) + (dc2InOH * ohDcCap2) + (dc3InOH * ohDcCap3) +
      (hwdpInOH * ohHwdpCap) +
      (dp3InOH * ohDpCap3) + (dp2InOH * ohDpCap2) + (dpInOH * ohDpCap);

    let casingAnnularVolume = 0;
    let annularVolBelowBop = 0;
    let riserVolume = 0;
    let chokeVolume = 0;
    let annularVolume = 0;

    if (flowType === 'surface') {
      // Surface casing interval: [0, shoeMD]
      const dcInCas = getIntersect(dcStart, dcEnd, 0, shoeMD);
      const dc2InCas = getIntersect(dc2Start, dc2End, 0, shoeMD);
      const dc3InCas = getIntersect(dc3Start, dc3End, 0, shoeMD);
      const hwdpInCas = getIntersect(hwdpStart, hwdpEnd, 0, shoeMD);
      const dp3InCas = getIntersect(dp3Start, dp3End, 0, shoeMD);
      const dp2InCas = getIntersect(dp2Start, dp2End, 0, shoeMD);
      const dpInCas = getIntersect(dpStart, dpEnd, 0, shoeMD);

      casingAnnularVolume = (dcInCas * casDcCap) + (dc2InCas * casDcCap2) + (dc3InCas * casDcCap3) +
        (hwdpInCas * casHwdpCap) +
        (dp3InCas * casDpCap3) + (dp2InCas * casDpCap2) + (dpInCas * casDpCap);

      annularVolume = openHoleVolume + casingAnnularVolume;
      annularVolBelowBop = annularVolume;
      riserVolume = 0;
      chokeVolume = 0;
    } else if (!hasRiser) {
      // Subsea Riserless: Casing interval is [seabedDepth, shoeMD]
      const seabedDepth = parseFloat(inputs.seabedDepth !== undefined ? inputs.seabedDepth : ((parseFloat(inputs.airGap) || 0) + (parseFloat(inputs.waterDepth) || 0))) || 0;
      const cStart = seabedDepth;
      const cEnd = Math.max(seabedDepth, shoeMD);

      const dcInCas = getIntersect(dcStart, dcEnd, cStart, cEnd);
      const dc2InCas = getIntersect(dc2Start, dc2End, cStart, cEnd);
      const dc3InCas = getIntersect(dc3Start, dc3End, cStart, cEnd);
      const hwdpInCas = getIntersect(hwdpStart, hwdpEnd, cStart, cEnd);
      const dp3InCas = getIntersect(dp3Start, dp3End, cStart, cEnd);
      const dp2InCas = getIntersect(dp2Start, dp2End, cStart, cEnd);
      const dpInCas = getIntersect(dpStart, dpEnd, cStart, cEnd);

      casingAnnularVolume = (dcInCas * casDcCap) + (dc2InCas * casDcCap2) + (dc3InCas * casDcCap3) +
        (hwdpInCas * casHwdpCap) +
        (dp3InCas * casDpCap3) + (dp2InCas * casDpCap2) + (dpInCas * casDpCap);

      annularVolume = openHoleVolume + casingAnnularVolume;
      annularVolBelowBop = annularVolume;
      riserVolume = 0;
      chokeVolume = 0;
    } else {
      // Subsea: Casing interval: [riserLength, Math.max(riserLength, shoeMD)]
      const cStart = riserLength;
      const cEnd = Math.max(riserLength, shoeMD);

      const dcInCas = getIntersect(dcStart, dcEnd, cStart, cEnd);
      const dc2InCas = getIntersect(dc2Start, dc2End, cStart, cEnd);
      const dc3InCas = getIntersect(dc3Start, dc3End, cStart, cEnd);
      const hwdpInCas = getIntersect(hwdpStart, hwdpEnd, cStart, cEnd);
      const dp3InCas = getIntersect(dp3Start, dp3End, cStart, cEnd);
      const dp2InCas = getIntersect(dp2Start, dp2End, cStart, cEnd);
      const dpInCas = getIntersect(dpStart, dpEnd, cStart, cEnd);

      casingAnnularVolume = (dcInCas * casDcCap) + (dc2InCas * casDcCap2) + (dc3InCas * casDcCap3) +
        (hwdpInCas * casHwdpCap) +
        (dp3InCas * casDpCap3) + (dp2InCas * casDpCap2) + (dpInCas * casDpCap);

      annularVolBelowBop = openHoleVolume + casingAnnularVolume;

      // Riser interval: [0, riserLength]
      const dpInRiser = getIntersect(dpStart, dpEnd, 0, riserLength);
      const dp2InRiser = getIntersect(dp2Start, dp2End, 0, riserLength);
      const dp3InRiser = getIntersect(dp3Start, dp3End, 0, riserLength);
      const hwdpInRiser = getIntersect(hwdpStart, hwdpEnd, 0, riserLength);
      const dcInRiser = getIntersect(dcStart, dcEnd, 0, riserLength);
      const dc2InRiser = getIntersect(dc2Start, dc2End, 0, riserLength);
      const dc3InRiser = getIntersect(dc3Start, dc3End, 0, riserLength);

      riserVolume = (dpInRiser * riserAnnularCap) +
        (dp2InRiser * riserAnnularCap * 0.95) +
        (dp3InRiser * riserAnnularCap * 0.95) +
        (hwdpInRiser * riserAnnularCap * 0.9) +
        (dcInRiser * riserAnnularCap * 0.8) +
        (dc2InRiser * riserAnnularCap * 0.8) +
        (dc3InRiser * riserAnnularCap * 0.8);

      chokeVolume = chokeLength * chokeCap;

      if (bopStatus === 'open') {
        annularVolume = annularVolBelowBop + riserVolume;
      } else {
        annularVolume = annularVolBelowBop + chokeVolume;
      }
    }

    const totalSystemVolume = stringVolume + annularVolume;

    // Strokes calculations
    const surfaceToBitStrokes = pumpOutput > 0 ? (stringVolume / pumpOutput) : 0;
    const bitToShoeStrokes = pumpOutput > 0 ? (openHoleVolume / pumpOutput) : 0;
    const totalCycleStrokes = pumpOutput > 0 ? (totalSystemVolume / pumpOutput) : 0;
    const bottomsUpStrokes = pumpOutput > 0 ? (annularVolume / pumpOutput) : 0;
    const strokesToBop = (isSurface || !hasRiser) ? 0 : (pumpOutput > 0 ? (annularVolBelowBop / pumpOutput) : 0);
    const shoeToSurfaceStrokes = pumpOutput > 0 ? (casingAnnularVolume / pumpOutput) : 0;
    const riserDisplacementStrokes = (isSurface || !hasRiser) ? 0 : (pumpOutput > 0 ? (riserVolume / pumpOutput) : 0);
    const chokeLineStrokes = (isSurface || !hasRiser) ? 0 : (pumpOutput > 0 ? (chokeVolume / pumpOutput) : 0);

    return {
      hasRiser,
      sectionType: hasRiser ? 'risered' : 'riserless',
      stringVolume,
      openHoleVolume,
      casingAnnularVolume,
      annularVolBelowBop,
      riserVolume,
      chokeVolume,
      annularVolume,
      totalSystemVolume,
      stringSections,
      surfaceToBitStrokes,
      bitToShoeStrokes,
      totalCycleStrokes,
      bottomsUpStrokes,
      strokesToBop,
      strokesToShoe: bitToShoeStrokes,
      shoeToSurfaceStrokes,
      riserDisplacementStrokes,
      chokeLineStrokes,
      pumpOutput,
      spm,
      surfaceToBitTimeMin: spm > 0 ? surfaceToBitStrokes / spm : 0,
      bitToShoeTimeMin: spm > 0 ? bitToShoeStrokes / spm : 0,
      totalCycleTimeMin: spm > 0 ? totalCycleStrokes / spm : 0,
      bottomsUpTimeMin: spm > 0 ? bottomsUpStrokes / spm : 0,
      shoeToSurfaceTimeMin: spm > 0 ? shoeToSurfaceStrokes / spm : 0,
      lagTimeMin: spm > 0 ? bottomsUpStrokes / spm : 0
    };
  }

  /**
   * Validate Well Control Inputs (ValidationService)
   * Returns array of { severity: 'ERROR'|'WARNING'|'INFO', field: string, message: string }
   */
  function validateWellControlInputs(inputs) {
    const alerts = [];
    const limits = CFG.LIMITS;

    const holeTVD = parseFloat(inputs.holeTVD !== undefined ? inputs.holeTVD : inputs.holeTVD_m) || 0;
    const shoeTVD = parseFloat(inputs.shoeTVD !== undefined ? inputs.shoeTVD : inputs.shoeTVD_m) || 0;
    const shoeMD = parseFloat(inputs.shoeMD !== undefined ? inputs.shoeMD : inputs.shoeMD_m) || shoeTVD;
    const holeMD = parseFloat(inputs.holeMD !== undefined ? inputs.holeMD : inputs.holeMD_m) || holeTVD;
    const omw = parseFloat(inputs.omw !== undefined ? inputs.omw : inputs.omw_ppg) || 0;
    const lotEmw = parseFloat(inputs.lotEmw !== undefined ? inputs.lotEmw : inputs.lotEmw_ppg) || 0;
    const safetyFactor = parseFloat(inputs.lotSafetyFactor) || 1.0;
    const effLotEmw = lotEmw * safetyFactor;
    const krp = parseFloat(inputs.krp !== undefined ? inputs.krp : inputs.krp_psi) || 0;
    const clf = parseFloat(inputs.clf !== undefined ? inputs.clf : inputs.clf_psi) || 0;
    const sidp = parseFloat(inputs.sidp !== undefined ? inputs.sidp : inputs.sidp_psi) || 0;
    const sicp = parseFloat(inputs.sicp !== undefined ? inputs.sicp : inputs.sicp_psi) || 0;
    const pumpOutput = parseFloat(inputs.pumpOutput !== undefined ? inputs.pumpOutput : inputs.pumpOutput_bbl_stk) || 0; // in bbl/stk
    const casingSize = String(inputs.casingSize || inputs.selectedCasingSize || '');

    // BHA length check
    const dcLen = parseFloat(inputs.dcLength) || 0;
    const dcLen2 = parseFloat(inputs.dcLength2) || 0;
    const dcLen3 = parseFloat(inputs.dcLength3) || 0;
    const hwdpLen = parseFloat(inputs.hwdpLength) || 0;
    const totalBhaLen = dcLen + dcLen2 + dcLen3 + hwdpLen;

    // Rule 1: SICP < SIDP -> WARNING
    if (sicp > 0 && sidp > 0 && sicp < sidp) {
      alerts.push({
        severity: 'WARNING',
        field: 'sicp',
        message: 'SICP is lower than SIDP. Normally SICP > SIDP because the influx is lighter than drilling mud. Verify pressures before proceeding.'
      });
    }

    // Rule 2: Shoe TVD > Hole TVD -> ERROR
    if (shoeTVD > 0 && holeTVD > 0 && shoeTVD > holeTVD) {
      alerts.push({
        severity: 'ERROR',
        field: 'shoeTVD',
        message: 'Shoe TVD cannot be deeper than Hole TVD.'
      });
    }

    // Rule 3: BHA length > open-hole length / Hole TVD / MD
    const openHoleLength = Math.max(0, holeMD - shoeMD);
    if (totalBhaLen > 0 && openHoleLength > 0 && totalBhaLen > openHoleLength) {
      alerts.push({
        severity: 'WARNING',
        field: 'bhaLength',
        message: 'BHA length exceeds open-hole length; components extend into casing.'
      });
    } else if (totalBhaLen > 0 && holeMD > 0 && totalBhaLen > holeMD) {
      alerts.push({
        severity: 'WARNING',
        field: 'bhaLength',
        message: 'BHA length exceeds total depth.'
      });
    }

    // Drillstring length vs Hole MD check
    const dpLen = parseFloat(inputs.dpLength) || 0;
    const dpLen2 = parseFloat(inputs.dpLength2) || 0;
    const dpLen3 = parseFloat(inputs.dpLength3) || 0;
    const totalDsLen = totalBhaLen + dpLen + dpLen2 + dpLen3;
    if (holeMD > 0 && totalDsLen > 0 && Math.abs(totalDsLen - holeMD) > 5) {
      alerts.push({
        severity: 'WARNING',
        field: 'dpLength',
        message: 'Total drillstring length does not match Hole MD.'
      });
    }

    // Calculate KMW exact to evaluate Rule 4
    const holeTVD_ft = holeTVD * M_TO_FT;
    const shoeTVD_ft = shoeTVD * M_TO_FT;
    const rawKmw = (holeTVD_ft > 0 && FACTOR_US > 0) ? (omw + (sidp / (FACTOR_US * holeTVD_ft))) : omw;

    // Rule 4: KMW >= LOT EMW -> ERROR
    if (effLotEmw > 0 && rawKmw >= effLotEmw) {
      alerts.push({
        severity: 'ERROR',
        field: 'lotEmw',
        message: 'Kill mud weight equals or exceeds LOT EMW. Formation will fracture during kill. Consider bullheading or volumetric method.'
      });
    }

    // Rule 5: MAASP < 0 -> ERROR
    const maasp = (effLotEmw - omw) * FACTOR_US * shoeTVD_ft;
    if (effLotEmw > 0 && omw > 0 && maasp < 0) {
      alerts.push({
        severity: 'ERROR',
        field: 'omw',
        message: 'Initial MAASP is negative. Current mud weight already exceeds LOT EMW.'
      });
    }

    // Rule 6: Dynamic MAASP < 0 or initial dynamic SICP < 0 -> WARNING
    if (inputs.flowType === 'subsea') {
      const dynMaasp = maasp - clf;
      const dynSicp = sicp - clf;
      if (clf > 0 && (dynMaasp < 0 || dynSicp < 0)) {
        alerts.push({
          severity: 'WARNING',
          field: 'clf',
          message: 'Choke line friction exceeds available margin. Risk of shoe fracture when circulating.'
        });
      }
    }

    // Rule 7: Plausibility checks (WARNING)
    const rigType = inputs.rigType || (inputs.flowType === 'surface' ? (CFG.RIG_TYPES ? CFG.RIG_TYPES.LAND : 'LAND') : (CFG.RIG_TYPES ? CFG.RIG_TYPES.SUBSEA_FLOATER : 'SUBSEA_FLOATER'));
    const isLand = rigType === 'LAND' || (CFG.RIG_TYPES && rigType === CFG.RIG_TYPES.LAND);
    const isJackup = rigType === 'JACKUP' || (CFG.RIG_TYPES && rigType === CFG.RIG_TYPES.JACKUP);
    const maxTvdLimit = isLand ? (limits.MAX_PLAUSIBLE_TVD_LAND_M || 9000) : limits.MAX_PLAUSIBLE_TVD_M;

    // - TVD > 9,000 m (LAND) or > 10,000 m (Offshore / Subsea / Jackup)
    if (holeTVD > maxTvdLimit) {
      alerts.push({
        severity: 'WARNING',
        field: 'holeTVD',
        message: isLand
          ? 'Unusually deep well for land operations (> 9,000 m). Verify depth inputs.'
          : 'Unusually deep well. Verify depth inputs.'
      });
    }

    // Jackup Marine Elevations Check (Strictly gated by hole size >= JACKUP_MARINE_ELEVATION_MIN_HOLE_IN)
    if (isJackup) {
      const holeSizeVal = parseFloat(inputs.selectedHoleSize || inputs.holeSize || inputs.casingSize) || 0;
      const minJackupHole = (CFG.JACKUP_MARINE_ELEVATION_MIN_HOLE_IN !== undefined) ? CFG.JACKUP_MARINE_ELEVATION_MIN_HOLE_IN : 36;
      if (holeSizeVal >= minJackupHole) {
        const airGapRaw = inputs.airGap;
        const waterDepthRaw = inputs.waterDepth;
        const airGap = (airGapRaw !== undefined && airGapRaw !== null && airGapRaw !== '') ? parseFloat(airGapRaw) : NaN;
        const waterDepth = (waterDepthRaw !== undefined && waterDepthRaw !== null && waterDepthRaw !== '') ? parseFloat(waterDepthRaw) : NaN;

        if (isNaN(airGap) || airGap <= 0) {
          alerts.push({
            severity: 'ERROR',
            field: 'airGap',
            message: 'Air Gap is required and must be greater than 0 for Jackup operations with hole size ≥ 36".'
          });
        }
        if (isNaN(waterDepth) || waterDepth <= 0) {
          alerts.push({
            severity: 'ERROR',
            field: 'waterDepth',
            message: 'Water Depth is required and must be greater than 0 for Jackup operations with hole size ≥ 36".'
          });
        }
        if (!isNaN(airGap) && airGap > 0 && !isNaN(waterDepth) && waterDepth > 0) {
          const mudline = airGap + waterDepth;
          if (shoeTVD > 0 && shoeTVD <= mudline) {
            alerts.push({
              severity: 'ERROR',
              field: 'shoeTVD',
              message: 'Casing shoe TVD cannot be at or above the mudline.'
            });
          } else if (shoeTVD > 0 && shoeTVD < mudline + (CFG.JACKUP_SHOE_BELOW_MUDLINE_MIN_M || 30)) {
            alerts.push({
              severity: 'WARNING',
              field: 'shoeTVD',
              message: 'Casing shoe is less than 30 m below the mudline. Verify shallow casing setting depth.'
            });
          }
        }
      }
    }

    // - 20" casing shoe > 3,000 m
    const is20Inch = casingSize.includes('20') || casingSize.startsWith('20');
    if (is20Inch && shoeTVD > limits.CASING_20_MAX_SHOE_TVD_M) {
      alerts.push({
        severity: 'WARNING',
        field: 'shoeTVD',
        message: `20" casing shoe at ${Math.round(shoeTVD)} m is unusually deep. Verify casing programme.`
      });
    }

    // - KRP < 100 psi for TVD > 3,000 m
    if (holeTVD > limits.DEEP_WELL_THRESHOLD_M && krp > 0 && krp < limits.MIN_PLAUSIBLE_KRP_PSI) {
      alerts.push({
        severity: 'WARNING',
        field: 'krp',
        message: 'KRP seems unusually low for this depth. Verify pump rate and pressure.'
      });
    }

    // - Pump output outside 0.03 to 0.25 bbl/stk
    if (pumpOutput > 0 && (pumpOutput < limits.PUMP_OUTPUT_MIN_BBL_STK || pumpOutput > limits.PUMP_OUTPUT_MAX_BBL_STK)) {
      alerts.push({
        severity: 'WARNING',
        field: 'pumpOutput',
        message: `Pump output is outside typical range (${limits.PUMP_OUTPUT_MIN_BBL_STK}-${limits.PUMP_OUTPUT_MAX_BBL_STK} bbl/stk).`
      });
    }

    Object.defineProperty(alerts, 'hasError', {
      get() { return this.some(a => a.severity === 'ERROR'); }
    });
    Object.defineProperty(alerts, 'hasWarning', {
      get() { return this.some(a => a.severity === 'WARNING'); }
    });
    Object.defineProperty(alerts, 'alerts', {
      get() { return this; }
    });
    return alerts;
  }

  /**
   * Determine Pressure Status Flag (Green, Yellow, Red) and margin
   */
  function getPressureStatus(currentVal, maxLimit) {
    if (!maxLimit || maxLimit <= 0) {
      return { status: 'safe', label: 'Safe margin', color: 'green', ratio: 0, margin: 0 };
    }
    const ratio = currentVal / maxLimit;
    const margin = maxLimit - currentVal;
    if (ratio < CFG.PRESSURE_BADGES.SAFE_MAX_RATIO) {
      return { status: 'safe', label: 'Safe margin', color: 'green', ratio, margin };
    }
    if (ratio <= CFG.PRESSURE_BADGES.CAUTION_MAX_RATIO) {
      return { status: 'caution', label: 'Caution: approaching limit', color: 'yellow', ratio, margin };
    }
    return { status: 'danger', label: 'DANGER: exceeds safe limit', color: 'red', ratio, margin };
  }

  /**
   * Calculate Full Kill Sheet Parameters
   */
  function calculateKillSheet(inputs, options) {
    const opts = options || {};
    const roundingMode = opts.roundingMode || CFG.ROUNDING_MODES.UP_0_1;
    const lotSafetyFactor = parseFloat(inputs.lotSafetyFactor) || 1.0;

    const holeTVD = parseFloat(inputs.holeTVD !== undefined ? inputs.holeTVD : inputs.holeTVD_m) || 0;
    const shoeTVD = parseFloat(inputs.shoeTVD !== undefined ? inputs.shoeTVD : inputs.shoeTVD_m) || 0;
    const omw = parseFloat(inputs.omw !== undefined ? inputs.omw : inputs.omw_ppg) || 0;
    const lotEmw = parseFloat(inputs.lotEmw !== undefined ? inputs.lotEmw : inputs.lotEmw_ppg) || 0;
    const krp = parseFloat(inputs.krp !== undefined ? inputs.krp : inputs.krp_psi) || 0;
    const clf = parseFloat(inputs.clf !== undefined ? inputs.clf : inputs.clf_psi) || 0;
    const sidp = parseFloat(inputs.sidp !== undefined ? inputs.sidp : inputs.sidp_psi) || 0;
    const sicp = parseFloat(inputs.sicp !== undefined ? inputs.sicp : inputs.sicp_psi) || 0;
    const strokes = parseFloat(inputs.surfaceToBitStrokes !== undefined ? inputs.surfaceToBitStrokes : inputs.strokes) || 0;

    const holeTVD_ft = holeTVD * M_TO_FT;
    const shoeTVD_ft = shoeTVD * M_TO_FT;

    const effLotEmw = lotEmw * lotSafetyFactor;

    const rigType = inputs.rigType || (inputs.flowType === 'surface' ? (CFG.RIG_TYPES ? CFG.RIG_TYPES.LAND : 'LAND') : (CFG.RIG_TYPES ? CFG.RIG_TYPES.SUBSEA_FLOATER : 'SUBSEA_FLOATER'));
    const isSurface = rigType === 'JACKUP' || rigType === 'LAND' || (CFG.RIG_TYPES && (rigType === CFG.RIG_TYPES.JACKUP || rigType === CFG.RIG_TYPES.LAND)) || inputs.flowType === 'surface';

    // 1. Initial MAASP = (EMW_eff - OMW) * 0.052 * Shoe TVD_ft
    const maasp = Math.max(0, (effLotEmw - omw) * FACTOR_US * shoeTVD_ft);
    let dynMaasp = maasp;
    let dynSicp = sicp;
    let initialChokePressure = sicp;

    if (!isSurface) {
      dynMaasp = Math.max(0, maasp - clf);
      dynSicp = Math.max(0, sicp - clf);
      initialChokePressure = dynSicp;
    } else {
      const surfaceFriction = inputs.hasSurfaceManifoldFriction ? (parseFloat(inputs.surfaceManifoldFriction) || 0) : 0;
      dynMaasp = Math.max(0, maasp - surfaceFriction);
      initialChokePressure = Math.max(0, sicp - surfaceFriction);
      dynSicp = initialChokePressure;
    }

    // 2. Kill Mud Weight
    // KMW calculated (exact) = OMW + SIDP / (0.052 * TVD_ft)
    const rawKmw = holeTVD_ft > 0 ? (omw + (sidp / (FACTOR_US * holeTVD_ft))) : omw;
    const kmwUsed = roundKmw(rawKmw, roundingMode);

    // Extra overbalance from rounding (psi) = (KMW_used - KMW_exact) * 0.052 * TVD_ft
    const extraOverbalancePsi = (kmwUsed - rawKmw) * FACTOR_US * holeTVD_ft;

    // 3. ICP = SIDP + KRP
    const icp = sidp + krp;

    // 4. FCP = KRP * KMW_used / OMW (shown to 1 decimal)
    const fcp = omw > 0 ? (krp * (kmwUsed / omw)) : 0;

    // 5. MAASP After Kill for both exact and rounded KMW
    const maaspAfterKillRounded = Math.max(0, (effLotEmw - kmwUsed) * FACTOR_US * shoeTVD_ft);
    const maaspAfterKillExact = Math.max(0, (effLotEmw - rawKmw) * FACTOR_US * shoeTVD_ft);

    // 6. Pressure Drop per 100 Strokes
    const pressDropTotal = icp - fcp;
    const pressDrop100 = strokes > 0 ? (pressDropTotal / strokes) * 100 : 0;

    // 7. Pressure Status Badges
    const sicpStatus = getPressureStatus(sicp, maasp);
    const dynSicpStatus = getPressureStatus(dynSicp, dynMaasp);
    const kmwVsLotStatus = getPressureStatus(kmwUsed, effLotEmw);

    // 8. Barite and Kill Mud Calculation
    let baritePer100Bbl = 0;
    let bariteError = null;
    if (kmwUsed >= CFG.BARITE.MAX_MUD_WEIGHT_PPG) {
      bariteError = 'Cannot weight mud beyond barite theoretical limit (35.8 ppg).';
    } else if (kmwUsed > omw) {
      baritePer100Bbl = CFG.BARITE.COEFFICIENT * (kmwUsed - omw) / (CFG.BARITE.MAX_MUD_WEIGHT_PPG - kmwUsed);
    }

    const defaultVolToMix = (parseFloat(inputs.stringVolume) || 0) + (parseFloat(inputs.annularVolume) || 0);
    const reserveMultiplier = inputs.addSurfaceReserve ? (1 + (CFG.BARITE.SURFACE_RESERVE_PERCENT / 100)) : 1.0;
    const volToMix = (parseFloat(inputs.customVolumeToMix) || defaultVolToMix) * reserveMultiplier;
    const totalBariteSacks = baritePer100Bbl * (volToMix / 100);
    const totalBariteTonnes = totalBariteSacks * (CFG.BARITE.SACK_WEIGHT_KG / 1000);

    // 9. Kick Classification
    const pitGain = parseFloat(inputs.pitGain) || 0;
    const bottomAnnCap = parseFloat(inputs.bottomAnnularCapacityBblPerFt) || 0.05; // bbl/ft
    let influxHeightFt = 0;
    let influxGradientPsiFt = 0;
    let influxDensityPpg = 0;
    let influxClassification = 'No Influx Data';

    if (pitGain > 0 && bottomAnnCap > 0) {
      influxHeightFt = pitGain / bottomAnnCap;
      if (influxHeightFt > 0) {
        influxGradientPsiFt = (omw * FACTOR_US) - ((sicp - sidp) / influxHeightFt);
        influxDensityPpg = influxGradientPsiFt / FACTOR_US;

        if (influxGradientPsiFt < 0 || influxGradientPsiFt > (omw * FACTOR_US)) {
          influxClassification = 'Uncertain influx type - check pressure readings.';
        } else if (influxGradientPsiFt < CFG.KICK_CLASSIFICATION.GAS_MAX_GRADIENT_PSI_FT) {
          influxClassification = 'Gas influx (high expansion risk)';
        } else if (influxGradientPsiFt <= CFG.KICK_CLASSIFICATION.OIL_MAX_GRADIENT_PSI_FT) {
          influxClassification = 'Oil / gas-oil mix';
        } else {
          influxClassification = 'Salt water / formation water';
        }
      }
    }

    // 10. Kick Tolerance
    // KT: maximum kick volume (bbl) the well can tolerate without fracturing shoe
    const gasGrad = CFG.KICK_CLASSIFICATION.ASSUMED_GAS_GRADIENT_PSI_FT || 0.10;
    const mudGrad = omw * FACTOR_US;
    let kickToleranceBbl = 0;
    if (bottomAnnCap > 0 && (mudGrad - gasGrad) > 0) {
      const maxInfluxHeight = maasp / (mudGrad - gasGrad);
      kickToleranceBbl = maxInfluxHeight * bottomAnnCap;
    }

    // 11. Subsea Margins (Only for SUBSEA_FLOATER)
    let riserMarginPpg = 0;
    let bhpReductionPsi = 0;
    let subseaDisconnectWarning = '';
    const waterDepthM = parseFloat(inputs.waterDepth) || parseFloat(inputs.riserLength) || 0;
    const airGapM = parseFloat(inputs.airGap) || CFG.DEFAULT_AIR_GAP_M || 0;
    const seawaterDensity = parseFloat(inputs.seawaterDensity) || CFG.DEFAULT_SEAWATER_DENSITY_PPG || 8.6;

    const waterDepthFt = waterDepthM * M_TO_FT;
    const airGapFt = airGapM * M_TO_FT;

    if (!isSurface) {
      if (holeTVD > waterDepthM && (holeTVD - waterDepthM) > 0) {
        riserMarginPpg = (waterDepthM * (omw - seawaterDensity)) / (holeTVD - waterDepthM);
      }
      // BHP reduction when disconnecting riser
      bhpReductionPsi = Math.max(0, (FACTOR_US * (omw - seawaterDensity) * waterDepthFt) + (FACTOR_US * omw * airGapFt));

      subseaDisconnectWarning = bhpReductionPsi > 200
        ? 'Unlatching LMRP reduces BHP by ' + Math.round(bhpReductionPsi) + ' psi (' + riserMarginPpg.toFixed(2) + ' ppg equivalent). Ensure well is properly shut-in or weighted pill is spotted before disconnect.'
        : '';
    }

    // 12. Optional Trip Margin
    const tripMarginPpg = parseFloat(inputs.tripMargin) || 0;
    const recommendedMudWeightPpg = kmwUsed + tripMarginPpg;

    return {
      holeTVD,
      shoeTVD,
      holeTVD_ft,
      shoeTVD_ft,
      omw,
      lotEmw,
      effLotEmw,
      lotSafetyFactor,
      krp,
      clf,
      sidp,
      sicp,
      maasp,
      dynMaasp,
      dynSicp,
      initialChokePressure,
      tripMarginPpg,
      recommendedMudWeightPpg,
      isSurface,
      rigType,
      rawKmw,
      kmwExact: rawKmw,
      kmwUsed,
      roundingMode,
      extraOverbalancePsi,
      icp,
      fcp,
      maaspAfterKillRounded,
      maaspAfterKillExact,
      pressDropTotal,
      pressDrop100,
      sicpStatus,
      dynSicpStatus,
      kmwVsLotStatus,
      baritePer100Bbl,
      bariteSacksPer100Bbl: baritePer100Bbl,
      bariteLimitExceeded: bariteError,
      bariteError,
      volToMix,
      volToMix_bbl: volToMix,
      totalBariteSacks,
      totalBariteTonnes,
      pitGain,
      influxHeightFt,
      influxGradientPsiFt,
      influxDensityPpg,
      influxClassification,
      kickToleranceBbl,
      waterDepthM,
      airGapM,
      seawaterDensity,
      riserMarginPpg,
      bhpReductionPsi,
      kickData: {
        influxHeight_ft: influxHeightFt,
        influxGradient_psi_ft: influxGradientPsiFt,
        influxDensity_ppg: influxDensityPpg,
        classification: influxClassification,
        kickTolerance_bbl: kickToleranceBbl,
        isExceeded: pitGain > kickToleranceBbl
      },
      statuses: {
        sicpStatus,
        dynSicpStatus,
        kmwVsLotStatus
      },
      subseaMargins: {
        waterDepthFt,
        airGapFt,
        riserMarginPpg,
        bhpReductionPsi,
        disconnectWarning: subseaDisconnectWarning
      }
    };
  }

  /**
   * Generate Step-down Schedule
   * Supports:
   *   Method: 'wait_weight' (single circulation step-down) or 'drillers' (two circulations)
   *   Interval: stroke count (e.g. 50, 100, 200) or time minutes
   *   Tapered drillstring allocation: section-by-section proportional friction drop
   */
  function generateStepDownSchedule(params) {
    const method = (params.method === 'drillers' || params.method === "driller's") ? 'drillers' : 'wait_weight';
    const totalStrokes = Math.round(params.strokes !== undefined ? params.strokes : (params.totalStrokes || 0));
    const icp = params.icp || 0;
    const fcp = params.fcp || 0;
    const sicp = params.sicp || 0;
    const spm = params.spm || 60;
    const stepInterval = params.stepInterval || 100; // in strokes
    const isTapered = !!params.isTapered;
    const stringSections = params.stringSections || [];
    const maasp = params.maasp || 0;

    const schedule = [];

    if (totalStrokes <= 0) return schedule;

    // Helper to calculate DP pressure at a given stroke
    function getDrillPipePressure(stk) {
      if (stk <= 0) return icp;
      if (stk >= totalStrokes) return fcp;

      if (!isTapered || stringSections.length <= 1) {
        // Standard linear drop
        return icp - (((icp - fcp) / totalStrokes) * stk);
      }

      // Tapered string calculation:
      // Allocate total drop (icp - fcp) across sections proportionally
      // Each section's share proportional to length / (cap^2.4) or similar friction factor
      let cumulativeStrokes = 0;
      let cumulativeDrop = 0;
      const totalDrop = icp - fcp;

      // Calculate relative friction weighting for each section
      const weights = stringSections.map(s => {
        const cap = s.capacity > 0 ? s.capacity : 0.05;
        // Hydraulic friction loss is inversely proportional to diameter^4.8 or capacity^2.4
        return (s.length || 0) / Math.pow(cap, 2.4);
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

      for (let i = 0; i < stringSections.length; i++) {
        const sec = stringSections[i];
        const secStrokes = params.pumpOutput > 0 ? (sec.volume / params.pumpOutput) : (totalStrokes / stringSections.length);
        const secDrop = totalDrop * (weights[i] / totalWeight);

        if (stk <= cumulativeStrokes + secStrokes) {
          const frac = (stk - cumulativeStrokes) / (secStrokes || 1);
          return icp - (cumulativeDrop + (secDrop * frac));
        }

        cumulativeStrokes += secStrokes;
        cumulativeDrop += secDrop;
      }

      return fcp;
    }

    // Wait & Weight Schedule
    if (method === 'wait_weight') {
      let curStk = 0;
      while (curStk < totalStrokes) {
        const dpPressure = getDrillPipePressure(curStk);
        const elapsedMin = spm > 0 ? (curStk / spm) : 0;
        // Choke pressure holds SICP during string displacement
        const chokePressure = sicp;
        const shoePressureExceeded = chokePressure > maasp;

        schedule.push({
          strokes: curStk,
          elapsedTimeMin: elapsedMin,
          drillPipePressure: dpPressure,
          chokePressure,
          shoePressureExceeded,
          label: curStk === 0 ? 'Surface' : ''
        });

        curStk += stepInterval;
      }

      // Bit point
      const bitElapsedMin = spm > 0 ? (totalStrokes / spm) : 0;
      schedule.push({
        strokes: totalStrokes,
        elapsedTimeMin: bitElapsedMin,
        drillPipePressure: fcp,
        chokePressure: sicp,
        shoePressureExceeded: sicp > maasp,
        label: 'Bit'
      });
    } else {
      // Driller's Method: 2 circulations
      // Circulation 1: Influx out (hold DP at ICP)
      const circ1Strokes = params.bottomsUpStrokes || totalStrokes * 2;
      let curStk = 0;
      while (curStk <= circ1Strokes) {
        schedule.push({
          circulation: 1,
          strokes: curStk,
          elapsedTimeMin: spm > 0 ? curStk / spm : 0,
          drillPipePressure: icp,
          chokePressure: sicp,
          shoePressureExceeded: sicp > maasp,
          label: curStk === 0 ? 'Start Circ 1' : (curStk === circ1Strokes ? 'Influx Out' : '')
        });
        curStk += stepInterval;
      }

      // Circulation 2: Kill mud in (step down ICP to FCP over surface-to-bit, then hold FCP)
      curStk = 0;
      while (curStk < totalStrokes) {
        const dpPressure = getDrillPipePressure(curStk);
        schedule.push({
          circulation: 2,
          strokes: curStk,
          elapsedTimeMin: spm > 0 ? curStk / spm : 0,
          drillPipePressure: dpPressure,
          chokePressure: sicp,
          shoePressureExceeded: sicp > maasp,
          label: curStk === 0 ? 'Start Circ 2' : ''
        });
        curStk += stepInterval;
      }
      schedule.push({
        circulation: 2,
        strokes: totalStrokes,
        elapsedTimeMin: spm > 0 ? totalStrokes / spm : 0,
        drillPipePressure: fcp,
        chokePressure: sicp,
        shoePressureExceeded: sicp > maasp,
        label: 'Bit (Circ 2)'
      });
    }

    return schedule.map(row => {
      const min = row.elapsedTimeMin || 0;
      const timeFormatted = min >= 60
        ? (Math.floor(min / 60) + 'h ' + Math.round(min % 60) + 'm')
        : (min.toFixed(1) + ' min');
      return {
        ...row,
        stroke: row.strokes,
        dpPressure: row.drillPipePressure,
        timeMin: min,
        note: row.label,
        timeFormatted
      };
    });
  }

  /**
   * Centralized Marine Segment Volume & Stroke Calculator (Subsea Riserless & Risered)
   * Exact oilfield formulas:
   *   - Pipe capacity (bbl/ft) = ID_in² / 1029.4
   *   - Annular capacity (bbl/ft) = (Hole_in² - OD_in²) / 1029.4
   *   - Plain geometric capacity (bbl/ft) = D_in² / 1029.4
   *   - bbl/m = bbl/ft * 3.28084
   */
  function calculateMarineSegmentVolumes(inputs, ref, options) {
    const opts = options || {};
    const FT_PER_M = 3.28084;
    const bblFtPipe = (id) => (id * id) / 1029.4;
    const bblMPipe = (id) => bblFtPipe(id) * FT_PER_M;
    const bblFtAnn = (d1, d2) => Math.max(0, ((d1 * d1) - (d2 * d2)) / 1029.4);
    const bblMAnn = (d1, d2) => bblFtAnn(d1, d2) * FT_PER_M;
    const bblFtGeo = (d) => (d * d) / 1029.4;
    const bblMGeo = (d) => bblFtGeo(d) * FT_PER_M;

    const holeSize = parseFloat(inputs.holeSize || inputs.holeOD || inputs.selectedHoleSize || 36);
    const casingID = parseFloat(inputs.casingID || inputs.conductorCasingID || 28.0);
    const airGap = parseFloat(inputs.airGap !== undefined ? inputs.airGap : 25);
    const waterDepth = parseFloat(inputs.waterDepth !== undefined ? inputs.waterDepth : 300);
    const seabedDepth = parseFloat(inputs.seabedDepth !== undefined ? inputs.seabedDepth : (airGap + waterDepth));

    const returnsMode = (inputs.returnsMode || (inputs.hasRiser === false || inputs.sectionType === 'riserless' ? 'riserless' : 'risered'));
    const isRiserless = (returnsMode === 'riserless');
    const hasRiser = !isRiserless;
    const riserID = parseFloat(inputs.riserID || 18.75);
    const riserLength = hasRiser ? parseFloat(inputs.riserLength || seabedDepth) : 0;

    const holeMD = parseFloat(inputs.holeMD || 0);
    const shoeMD = parseFloat(inputs.shoeMD || 0);

    const pumpOutput = parseFloat(inputs.pumpOutput || (ref && ref.pumpOutput) || 0.1176); // bbl/stk
    const spm = parseFloat(inputs.spm || 60);

    // Drillstring lengths
    const dcLen = parseFloat(inputs.dcLength || 0);
    const dcLen2 = parseFloat(inputs.dcLength2 || 0);
    const dcLen3 = parseFloat(inputs.dcLength3 || 0);
    const hwdpLen = parseFloat(inputs.hwdpLength || 0);
    const dpLen = parseFloat(inputs.dpLength || 0);
    const dpLen2 = parseFloat(inputs.dpLength2 || 0);
    const dpLen3 = parseFloat(inputs.dpLength3 || 0);

    // Tubular ODs and IDs
    const dcOD = parseFloat(inputs.dcOD || 6.5);
    const dcID = parseFloat(inputs.dcID || 2.8125);
    const dc2OD = parseFloat(inputs.dc2OD || dcOD);
    const dc2ID = parseFloat(inputs.dc2ID || dcID);
    const dc3OD = parseFloat(inputs.dc3OD || dcOD);
    const dc3ID = parseFloat(inputs.dc3ID || dcID);

    const hwdpOD = parseFloat(inputs.hwdpOD || 5.0);
    const hwdpID = parseFloat(inputs.hwdpID || 3.0);

    const dpOD = parseFloat(inputs.dpOD || 5.0);
    const dpID = parseFloat(inputs.dpID || 4.276);
    const dp2OD = parseFloat(inputs.dp2OD || dpOD);
    const dp2ID = parseFloat(inputs.dp2ID || dpID);
    const dp3OD = parseFloat(inputs.dp3OD || dpOD);
    const dp3ID = parseFloat(inputs.dp3ID || dpID);

    // Capacities in bbl/m
    const capMultiplier = opts.capacitiesInLiters ? (1 / 158.987295) : 1.0;
    const safeRef = ref || {};
    const refCaps = safeRef.capacities || {};

    const isReasonablePipeCap = (capBblM) => (typeof capBblM === 'number' && !isNaN(capBblM) && capBblM > 0.001 && capBblM < 0.5);

    const getSafePipeCap = (refVal, idInches) => {
      const calcCap = bblMPipe(idInches);
      if (opts.useRefCapacities && refVal !== undefined && refVal !== null) {
        const parsed = parseFloat(refVal) * capMultiplier;
        if (isReasonablePipeCap(parsed)) {
          return parsed;
        }
      }
      return calcCap;
    };

    const dcCap = getSafePipeCap(refCaps.DC, dcID);
    const dcCap2 = getSafePipeCap(refCaps.DC2, dc2ID);
    const dcCap3 = getSafePipeCap(refCaps.DC3, dc3ID);
    const hwdpCap = getSafePipeCap(refCaps.HWDP, hwdpID);
    const dpCap = getSafePipeCap(refCaps.DP, dpID);
    const dpCap2 = getSafePipeCap(refCaps.DP2, dp2ID);
    const dpCap3 = getSafePipeCap(refCaps.DP3, dp3ID);

    // 1. A: String Volume (bbl)
    const stringVolume = (dcLen * dcCap) + (dcLen2 * dcCap2) + (dcLen3 * dcCap3) +
                         (hwdpLen * hwdpCap) +
                         (dpLen * dpCap) + (dpLen2 * dpCap2) + (dpLen3 * dpCap3);

    // Tubular segment positions (measured bottom-up from Hole MD to surface 0)
    const dcEnd = holeMD;
    const dcStart = holeMD - dcLen;
    const dc2End = dcStart;
    const dc2Start = dcStart - dcLen2;
    const dc3End = dc2Start;
    const dc3Start = dc2Start - dcLen3;
    const hwdpEnd = dc3Start;
    const hwdpStart = dc3Start - hwdpLen;
    const dp3End = hwdpStart;
    const dp3Start = hwdpStart - dpLen3;
    const dp2End = dp3Start;
    const dp2Start = dp3Start - dpLen2;
    const dpEnd = dp2Start;
    const dpStart = 0;

    // Helper: segment overlap
    const overlap = (p1, p2, i1, i2) => Math.max(0, Math.min(p2, i2) - Math.max(p1, i1));

    // 2. Open Hole Interval: [shoeMD, holeMD]
    const ohLen = Math.max(0, holeMD - shoeMD);
    const dcInOH = overlap(dcStart, dcEnd, shoeMD, holeMD);
    const dc2InOH = overlap(dc2Start, dc2End, shoeMD, holeMD);
    const dc3InOH = overlap(dc3Start, dc3End, shoeMD, holeMD);
    const hwdpInOH = overlap(hwdpStart, hwdpEnd, shoeMD, holeMD);
    const dp3InOH = overlap(dp3Start, dp3End, shoeMD, holeMD);
    const dp2InOH = overlap(dp2Start, dp2End, shoeMD, holeMD);
    const dpInOH = overlap(dpStart, dpEnd, shoeMD, holeMD);

    const openHoleAnnularCapDC = bblMAnn(holeSize, dcOD);
    const openHoleAnnularCapDC2 = bblMAnn(holeSize, dc2OD);
    const openHoleAnnularCapDC3 = bblMAnn(holeSize, dc3OD);
    const openHoleAnnularCapHWDP = bblMAnn(holeSize, hwdpOD);
    const openHoleAnnularCapDP = bblMAnn(holeSize, dpOD);

    const openHoleAnnularVolume = (dcInOH * openHoleAnnularCapDC) +
                                  (dc2InOH * openHoleAnnularCapDC2) +
                                  (dc3InOH * openHoleAnnularCapDC3) +
                                  (hwdpInOH * openHoleAnnularCapHWDP) +
                                  (dp3InOH * openHoleAnnularCapDP) +
                                  (dp2InOH * openHoleAnnularCapDP) +
                                  (dpInOH * openHoleAnnularCapDP);

    const openHoleGeometricVolume = ohLen * bblMGeo(holeSize);

    // 3. Cased Hole Interval:
    // In Riserless mode: [seabedDepth, shoeMD]
    // In With Riser mode: [riserLength, shoeMD]
    const casedTop = isRiserless ? seabedDepth : riserLength;
    const casedBottom = Math.max(casedTop, shoeMD);
    const casedLen = Math.max(0, casedBottom - casedTop);

    const dcInCas = overlap(dcStart, dcEnd, casedTop, casedBottom);
    const dc2InCas = overlap(dc2Start, dc2End, casedTop, casedBottom);
    const dc3InCas = overlap(dc3Start, dc3End, casedTop, casedBottom);
    const hwdpInCas = overlap(hwdpStart, hwdpEnd, casedTop, casedBottom);
    const dp3InCas = overlap(dp3Start, dp3End, casedTop, casedBottom);
    const dp2InCas = overlap(dp2Start, dp2End, casedTop, casedBottom);
    const dpInCas = overlap(dpStart, dpEnd, casedTop, casedBottom);

    const casAnnCapDC = bblMAnn(casingID, dcOD);
    const casAnnCapDC2 = bblMAnn(casingID, dc2OD);
    const casAnnCapDC3 = bblMAnn(casingID, dc3OD);
    const casAnnCapHWDP = bblMAnn(casingID, hwdpOD);
    const casAnnCapDP = bblMAnn(casingID, dpOD);

    const casedAnnularVolume = (dcInCas * casAnnCapDC) +
                               (dc2InCas * casAnnCapDC2) +
                               (dc3InCas * casAnnCapDC3) +
                               (hwdpInCas * casAnnCapHWDP) +
                               (dp3InCas * casAnnCapDP) +
                               (dp2InCas * casAnnCapDP) +
                               (dpInCas * casAnnCapDP);

    const casedGeometricVolume = casedLen * bblMGeo(casingID);

    // 4. D: Bit to Seabed Annular Volume = B + C
    const bitToSeabedAnnularVolume = openHoleAnnularVolume + casedAnnularVolume;

    // 5. E: Riser Annular Volume
    let riserAnnularVolume = 0;
    if (hasRiser && riserLength > 0) {
      const dpInRiser = overlap(dpStart, dpEnd, 0, riserLength);
      const dp2InRiser = overlap(dp2Start, dp2End, 0, riserLength);
      const dp3InRiser = overlap(dp3Start, dp3End, 0, riserLength);
      const hwdpInRiser = overlap(hwdpStart, hwdpEnd, 0, riserLength);
      const dcInRiser = overlap(dcStart, dcEnd, 0, riserLength);
      const dc2InRiser = overlap(dc2Start, dc2End, 0, riserLength);
      const dc3InRiser = overlap(dc3Start, dc3End, 0, riserLength);

      const riserAnnCapDP = bblMAnn(riserID, dpOD);
      const riserAnnCapHWDP = bblMAnn(riserID, hwdpOD);
      const riserAnnCapDC = bblMAnn(riserID, dcOD);

      riserAnnularVolume = (dpInRiser * riserAnnCapDP) +
                           (dp2InRiser * riserAnnCapDP) +
                           (dp3InRiser * riserAnnCapDP) +
                           (hwdpInRiser * riserAnnCapHWDP) +
                           (dcInRiser * riserAnnCapDC) +
                           (dc2InRiser * riserAnnCapDC) +
                           (dc3InRiser * riserAnnCapDC);
    }

    // Total Annulus
    const totalAnnulusVolume = bitToSeabedAnnularVolume + riserAnnularVolume;

    // 6. G: Total System Volume = A + Total Annulus
    const totalSystemVolume = stringVolume + totalAnnulusVolume;

    // Strokes calculations = ceil(volume / pumpOutput)
    const calcStk = (v) => (pumpOutput > 0 ? Math.ceil(v / pumpOutput) : 0);
    const surfaceToBitStrokes = calcStk(stringVolume);
    const bitToShoeStrokes = calcStk(openHoleAnnularVolume);
    const shoeToSeabedStrokes = calcStk(casedAnnularVolume);
    const bitToSeabedStrokes = calcStk(bitToSeabedAnnularVolume);
    const bottomsUpStrokes = isRiserless ? bitToSeabedStrokes : calcStk(totalAnnulusVolume);
    const totalCycleStrokes = calcStk(totalSystemVolume);

    // Times at SPM
    const calcTimeMin = (stk) => (spm > 0 ? stk / spm : 0);

    return {
      isRiserless,
      hasRiser,
      returnsMode,
      holeSize,
      casingID,
      seabedDepth,
      airGap,
      waterDepth,
      pumpOutput,
      spm,
      volumes: {
        stringVolume,
        openHoleAnnularVolume,
        openHoleGeometricVolume,
        casedAnnularVolume,
        casedGeometricVolume,
        bitToSeabedAnnularVolume,
        riserAnnularVolume,
        totalAnnulusVolume,
        totalSystemVolume
      },
      strokes: {
        surfaceToBitStrokes,
        bitToShoeStrokes,
        shoeToSeabedStrokes,
        bitToSeabedStrokes,
        bottomsUpStrokes,
        totalCycleStrokes
      },
      timesMin: {
        surfaceToBit: calcTimeMin(surfaceToBitStrokes),
        bitToShoe: calcTimeMin(bitToShoeStrokes),
        shoeToSeabed: calcTimeMin(shoeToSeabedStrokes),
        bitToSeabed: calcTimeMin(bitToSeabedStrokes),
        bottomsUp: calcTimeMin(bottomsUpStrokes),
        totalCycle: calcTimeMin(totalCycleStrokes)
      },
      intervals: {
        surfaceToBit: `0 m – ${holeMD} m`,
        bitToShoe: `${shoeMD} m – ${holeMD} m`,
        shoeToSeabed: `${seabedDepth} m – ${shoeMD} m`,
        bitToSeabed: `${seabedDepth} m – ${holeMD} m`,
        bottomsUp: isRiserless ? `${seabedDepth} m – ${holeMD} m` : `0 m – ${holeMD} m`,
        totalCycle: `Full Circulation`
      }
    };
  }

  return {
    getIntersect,
    roundKmw,
    calculateVolumesAndStrokes,
    calculateMarineSegmentVolumes,
    validateWellControlInputs,
    getPressureStatus,
    calculateKillSheet,
    generateStepDownSchedule
  };
}));
