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
