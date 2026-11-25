/**
 * Drilling ToolKit - Well Control Configuration
 * Centralized Thresholds, Plausibility Limits, and Safety Settings
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WellControlConfig = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    RIG_TYPES: {
      SUBSEA_FLOATER: 'SUBSEA_FLOATER',
      JACKUP: 'JACKUP',
      LAND: 'LAND'
    },

    SECTION_TYPES: {
      RISERLESS: 'riserless',
      RISERED: 'risered'
    },

    SUBSEA_HOLE_CONFIGS: {
      riserless: [
        {
          id: '42',
          label: '42"',
          val: '42',
          holeOD: 42,
          hasRiser: false,
          sectionType: 'riserless',
          conductorCasingOD: 36,
          conductorCasingID: 34,
          casingLabel: '36"'
        },
        {
          id: '36',
          label: '36"',
          val: '36',
          holeOD: 36,
          hasRiser: false,
          sectionType: 'riserless',
          conductorCasingOD: 30,
          conductorCasingID: 28,
          casingLabel: '30"'
        },
        {
          id: '26',
          label: '26"',
          val: '26',
          holeOD: 26,
          hasRiser: false,
          sectionType: 'riserless',
          conductorCasingOD: 30,
          conductorCasingID: 28,
          casingLabel: '30"'
        },
        {
          id: 'custom_riserless',
          label: 'Custom',
          val: 'custom_riserless',
          isCustom: true,
          hasRiser: false,
          sectionType: 'riserless',
          subtitle: 'Custom Hole (Riserless)'
        }
      ],
      risered: [
        {
          id: '17.5',
          label: '17 ½"',
          val: '17.5',
          holeOD: 17.5,
          hasRiser: true,
          sectionType: 'risered',
          conductorCasingOD: 20,
          conductorCasingID: 18.73,
          casingLabel: '20"'
        },
        {
          id: '12.25',
          label: '12 ¼"',
          val: '12.25',
          holeOD: 12.25,
          hasRiser: true,
          sectionType: 'risered',
          conductorCasingOD: 13.375,
          conductorCasingID: 12.415,
          casingLabel: '13 3/8"'
        },
        {
          id: '8.5',
          label: '8 ½"',
          val: '8.5',
          holeOD: 8.5,
          hasRiser: true,
          sectionType: 'risered',
          conductorCasingOD: 9.625,
          conductorCasingID: 8.681,
          casingLabel: '9 5/8"'
        },
        {
          id: 'custom_riser',
          label: 'Custom',
          val: 'custom_riser',
          isCustom: true,
          hasRiser: true,
          sectionType: 'risered',
          subtitle: 'Custom Hole (Riser)'
        }
      ]
    },

    getSubseaHoleConfig: function (val, sectionType) {
      if (!val) return null;
      var strVal = String(val).trim();
      var configs = this.SUBSEA_HOLE_CONFIGS;
      if (sectionType === 'riserless') {
        return configs.riserless.find(function (c) { return c.val === strVal || c.id === strVal; }) || null;
      }
      if (sectionType === 'risered') {
        return configs.risered.find(function (c) { return c.val === strVal || c.id === strVal; }) || null;
      }
      // Search all
      var found = configs.riserless.find(function (c) { return c.val === strVal || c.id === strVal; });
      if (found) return found;
      return configs.risered.find(function (c) { return c.val === strVal || c.id === strVal; }) || null;
    },

    /**
     * Standard Open-Hole and Casing Annular Capacity Presets (in bbl/m)
     */
    ANNULAR_PRESETS_BBL_M: {
      openHole: {
        '42': {
          '5_DP': 5.5739,
          '5_HWDP': 5.5739,
          '6-1/2_DC': 5.4487,
          '6.5_DC': 5.4487,
          '8_DC': 5.3794,
          '9-1/2_DC': 5.2957
        },
        '36': {
          '5_DP': 4.0814,
          '5_HWDP': 4.0814,
          '6-1/2_DC': 3.9562,
          '6.5_DC': 3.9562,
          '8_DC': 3.8869,
          '9-1/2_DC': 3.8032
        },
        '26': {
          '5_DP': 2.06998,
          '5_HWDP': 2.06753,
          '6-1/2_DC': 2.02469,
          '6.5_DC': 2.02469,
          '8_DC': 1.95028,
          '9-1/2_DC': 1.86662
        },
        '17.5': {
          '5_DP': 0.88844,
          '5_HWDP': 0.88844,
          '6-1/2_DC': 0.84151,
          '6.5_DC': 0.84151,
          '8_DC': 0.77220,
          '9-1/2_DC': 0.68854
        },
        '12.25': {
          '5_DP': 0.39060,
          '5_HWDP': 0.39060,
          '6-1/2_DC': 0.34342,
          '6.5_DC': 0.34342,
          '8_DC': 0.27430,
          '9-1/2_DC': 0.19064
        },
        '8.5': {
          '5_DP': 0.14699,
          '5_HWDP': 0.14253,
          '6-1/2_DC': 0.09561,
          '6.5_DC': 0.09561
        }
      },
      casing: {
        '48': {
          '5_DP': 6.6640,
          '5_HWDP': 6.6640,
          '6-1/2_DC': 6.6092,
          '6.5_DC': 6.6092
        },
        '42': {
          '5_DP': 5.0196,
          '5_HWDP': 5.0196,
          '6-1/2_DC': 4.9646,
          '6.5_DC': 4.9646
        },
        '36': {
          '5_DP': 3.6046,
          '5_HWDP': 3.6046,
          '6-1/2_DC': 3.5496,
          '6.5_DC': 3.5496
        },
        '30': {
          '5_DP': 2.4134,
          '5_HWDP': 2.4093,
          '6-1/2_DC': 2.3624,
          '6.5_DC': 2.3624
        },
        '20': {
          '5_DP': 1.0347,
          '5_HWDP': 1.0303,
          '6-1/2_DC': 0.9834,
          '6.5_DC': 0.9834
        }
      }
    },

    /**
     * Custom Hole annular capacity formula: (Hole_ID² - Pipe_OD²) / 1029.4 * 3.28084 (in bbl/m)
     */
    getCustomAnnularCapBblM: function (holeOrCasingID, pipeOD) {
      var hID = parseFloat(holeOrCasingID);
      var pOD = parseFloat(pipeOD);
      if (isNaN(hID) || hID <= 0) return 0;
      if (isNaN(pOD) || pOD <= 0) return 0;
      return Math.max(0, ((hID * hID - pOD * pOD) / 1029.4) * 3.28084);
    },

    /**
     * Custom Hole annular capacity in L/m
     */
    getCustomAnnularCapLM: function (holeOrCasingID, pipeOD) {
      return this.getCustomAnnularCapBblM(holeOrCasingID, pipeOD) * (this.BBL_TO_LITERS || 158.987294928);
    },

    JACKUP_MARINE_ELEVATION_MIN_HOLE_IN: 36,
    JACKUP_SHOE_BELOW_MUDLINE_MIN_M: 30,

    LIMITS: {
      MAX_PLAUSIBLE_TVD_M: 10000,
      MAX_PLAUSIBLE_TVD_LAND_M: 9000,
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
      SAFE_MAX_RATIO: 0.75,       // < 75% -> Green "Safe margin"
      CAUTION_MAX_RATIO: 0.90     // 75% - 90% -> Yellow "Caution: approaching limit", > 90% -> Red "DANGER: exceeds safe limit"
    },

    KICK_CLASSIFICATION: {
      GAS_MAX_GRADIENT_PSI_FT: 0.25,
      OIL_MAX_GRADIENT_PSI_FT: 0.40,
      ASSUMED_GAS_GRADIENT_PSI_FT: 0.10
    },

    DECIMALS: {
      pressure: 1,
      mudWeight: 2,
      volume: 2,
      strokes: 0,
      time: 1,
      margins: 1
    },

    ROUNDING_MODES: {
      UP_0_1: '0.1',
      UP_0_05: '0.05',
      EXACT: 'exact'
    },

    SAFETY_FACTORS: [
      { label: '100% (Standard)', value: 1.0 },
      { label: '95%', value: 0.95 },
      { label: '90%', value: 0.90 }
    ],

    DEFAULT_SPM: 60,
    DEFAULT_SEAWATER_DENSITY_PPG: 8.6,
    DEFAULT_SEAWATER_DENSITY_SG: 1.03,
    DEFAULT_AIR_GAP_M: 25,
    DEFAULT_WATER_DEPTH_M: 200,

    PRESSURE_FACTOR_US: 0.052,
    BBL_TO_LITERS: 158.987294928,
    METERS_TO_FEET: 3.28084
  };
}));
