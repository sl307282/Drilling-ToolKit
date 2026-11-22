import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const UnitsEngine = require('../units_engine.js');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

function assertRel(actual, expected, maxRelErr = 1e-9, msg = '') {
  const diff = Math.abs(actual - expected);
  const denom = Math.max(Math.abs(actual), Math.abs(expected), 1e-12);
  const relErr = diff / denom;
  if (relErr > maxRelErr) {
    console.error('FAIL in assertRel:', msg, 'actual:', actual, 'expected:', expected, 'relErr:', relErr);
    process.exit(1);
  }
}

console.log('=== TEST 1: Exact Conversion Factors from User Specification ===');
assertRel(UnitsEngine.convert('length', 1, 'ft', 'm'), 0.3048, 1e-9, 'ft -> m');
assertRel(UnitsEngine.convert('diameter', 1, 'in', 'mm'), 25.4, 1e-9, 'in -> mm');
assertRel(UnitsEngine.convert('capacity', 1, 'bbl/ft', 'L/m'), 521.61186, 1e-4, 'bbl/ft -> L/m (521.612)');
assertRel(UnitsEngine.convert('volume', 1, 'bbl', 'm3'), 0.1589873, 1e-5, 'bbl -> m3 (0.158987)');
assertRel(UnitsEngine.convert('volume', 1, 'gal', 'L'), 3.785412, 1e-5, 'gal -> L (3.785412)');
assertRel(UnitsEngine.convert('density', 1, 'ppg', 'SG'), 0.1198264, 1e-5, 'ppg -> SG (0.119826)');
assertRel(UnitsEngine.convert('density', 1, 'ppg', 'kg/m3'), 119.8264, 1e-4, 'ppg -> kg/m3 (119.826)');
assertRel(UnitsEngine.convert('pressure', 1, 'psi', 'bar'), 0.06894757, 1e-5, 'psi -> bar (0.0689476)');
assertRel(UnitsEngine.convert('pressure', 1, 'psi', 'kPa'), 6.894757, 1e-5, 'psi -> kPa (6.894757)');
assertRel(UnitsEngine.convert('gradient', 1, 'psi/ft', 'bar/m'), 0.226206, 1e-5, 'psi/ft -> bar/m (0.226206)');
assertRel(UnitsEngine.convert('pump_output', 1, 'bbl/stk', 'L/stk'), 158.9873, 1e-4, 'bbl/stk -> L/stk (158.987)');
assertRel(UnitsEngine.convert('flow_rate', 1, 'gpm', 'L/min'), 3.785412, 1e-5, 'gpm -> L/min (3.785412)');
assertRel(UnitsEngine.convert('force', 1, 'lbf', 'N'), 4.448222, 1e-5, 'lbf -> N (4.448222)');
assertRel(UnitsEngine.convert('force', 1, 'lbs', 'kg'), 0.45359237, 1e-7, 'lb -> kg (0.453592)');
assertRel(UnitsEngine.convert('torque', 1, 'ft-lbs', 'N·m'), 1.355818, 1e-5, 'ft-lbf -> N·m (1.355818)');
assertRel(UnitsEngine.convert('weight_per_length', 1, 'lb/ft', 'kg/m'), 1.488164, 1e-5, 'lb/ft -> kg/m (1.488164)');
assertRel(UnitsEngine.convert('velocity', 1, 'ft/min', 'm/min'), 0.3048, 1e-9, 'ft/min -> m/min (0.3048)');
assertRel(UnitsEngine.convert('yield_point', 1, 'lbf/100ft2', 'Pa'), 0.478803, 1e-5, 'lbf/100ft2 -> Pa (0.478803)');
assertRel(UnitsEngine.convert('additives', 1, 'lb/bbl', 'kg/m3'), 2.85301, 1e-4, 'lb/bbl -> kg/m3 (2.85301)');
assertRel(UnitsEngine.convert('cement_yield', 1, 'ft3/sk', 'L/sk'), 28.3168, 1e-4, 'ft3/sk -> L/sk (28.3168)');
assertRel(UnitsEngine.convert('power', 1, 'hp', 'kW'), 0.7457, 1e-4, 'hp -> kW (0.7457)');
assertRel(UnitsEngine.convert('dogleg', 1, '°/100 ft', '°/30 m'), 0.984252, 1e-5, '°/100ft -> °/30m (0.984252)');
console.log('PASSED: All specification factors verified!');

console.log("=== TEST 2: Round-Trip Accuracy (< 1e-9 relative error) ===");
const pairs = [
  ['length', 'ft', 'm', 3280.84],
  ['length', 'in', 'mm', 12.25],
  ['capacity', 'bbl/ft', 'L/m', 0.15705],
  ['capacity', 'bbl/ft', 'bbl/m', 0.14970],
  ['capacity', 'bbl/m', 'L/m', 0.49114],
  ['volume', 'bbl', 'm3', 500.0],
  ['volume', 'bbl', 'L', 1250.0],
  ['density', 'ppg', 'SG', 15.8],
  ['density', 'ppg', 'kg/m3', 12.5],
  ['pressure', 'psi', 'bar', 3500.0],
  ['pressure', 'psi', 'kPa', 5000.0],
  ['gradient', 'psi/ft', 'bar/m', 0.82],
  ['force', 'klbs', 'kN', 250.0],
  ['torque', 'ft-lbs', 'N·m', 15000.0],
  ['velocity', 'ft/min', 'm/min', 120.0],
  ['dogleg', '°/100 ft', '°/30 m', 3.5],
  ['power', 'hp', 'kW', 1200.0]
];

for (const [qty, u1, u2, val] of pairs) {
  const converted = UnitsEngine.convert(qty, val, u1, u2);
  const roundTrip = UnitsEngine.convert(qty, converted, u2, u1);
  assertRel(roundTrip, val, 1e-12, );
}
console.log('PASSED: All pairs round-trip within < 1e-12 error!');

console.log("=== TEST 3: Temperature Offset Conversions ===");
assertRel(UnitsEngine.convert('temperature', 32, '°F', '°C'), 0.0, 1e-9, '32 °F -> 0 °C');
assertRel(UnitsEngine.convert('temperature', 212, '°F', '°C'), 100.0, 1e-9, '212 °F -> 100 °C');
assertRel(UnitsEngine.convert('temperature', -40, '°F', '°C'), -40.0, 1e-9, '-40 °F -> -40 °C');
assertRel(UnitsEngine.convert('temperature', 0, '°C', '°F'), 32.0, 1e-9, '0 °C -> 32 °F');
assertRel(UnitsEngine.convert('temperature', 100, '°C', '°F'), 212.0, 1e-9, '100 °C -> 212 °F');
assertRel(UnitsEngine.convert('temperature', 0, '°C', 'K'), 273.15, 1e-9, '0 °C -> 273.15 K');
assertRel(UnitsEngine.convert('temperature', 300, 'K', '°C'), 26.85, 1e-9, '300 K -> 26.85 °C');
console.log('PASSED: Temperature conversions with offset validated!');

console.log("=== TEST 4: Boundary Values (Zero, Negative, Large) ===");
assertRel(UnitsEngine.convert('length', 0, 'ft', 'm'), 0.0, 1e-12, '0 ft -> 0 m');
assertRel(UnitsEngine.convert('pressure', 0, 'psi', 'bar'), 0.0, 1e-12, '0 psi -> 0 bar');
assertRel(UnitsEngine.convert('pressure', -50, 'psi', 'bar'), -50 * 0.06894757293168, 1e-9, '-50 psi -> bar');
assertRel(UnitsEngine.convert('length', 1e7, 'ft', 'm'), 1e7 * 0.3048, 1e-9, '1e7 ft -> m');
console.log('PASSED: Boundary values validated!');

console.log("=== TEST 5: Reactive Context & Storage Logic ===");
UnitsEngine.setUnitSystem('api');
assert(UnitsEngine.getUnitSystem() === 'api', 'Set API mode');
assert(UnitsEngine.getUnit('depth') === 'ft', 'API depth is ft');
assert(UnitsEngine.getUnit('capacity') === 'bbl/ft', 'API capacity is bbl/ft');
assert(UnitsEngine.getDefaultCapacityUnit() === 'bbl/ft', 'API defaultCapacityUnit method is bbl/ft');
assert(UnitsEngine.defaultCapacityUnit === 'bbl/ft', 'API defaultCapacityUnit getter is bbl/ft');

UnitsEngine.setUnitSystem('si');
assert(UnitsEngine.getUnitSystem() === 'si', 'Set SI mode');
assert(UnitsEngine.getUnit('depth') === 'm', 'SI depth is m');
assert(UnitsEngine.getUnit('capacity') === 'L/m', 'SI capacity is L/m');
assert(UnitsEngine.getDefaultCapacityUnit() === 'L/m', 'SI defaultCapacityUnit method is L/m');
assert(UnitsEngine.defaultCapacityUnit === 'L/m', 'SI defaultCapacityUnit getter is L/m');

UnitsEngine.setUnitSystem('invalid_val');
assert(UnitsEngine.getUnitSystem() === 'mixed', 'Invalid falls back to mixed');
assert(UnitsEngine.getUnit('depth') === 'm', 'Mixed depth default is m');
assert(UnitsEngine.getUnit('capacity') === 'bbl/m', 'Mixed capacity default is bbl/m');
assert(UnitsEngine.getDefaultCapacityUnit() === 'bbl/m', 'Mixed defaultCapacityUnit method is bbl/m');
assert(UnitsEngine.defaultCapacityUnit === 'bbl/m', 'Mixed defaultCapacityUnit getter is bbl/m');
console.log('PASSED: Reactive state transitions verified!');

console.log('\n===========================================');
console.log('ALL UNIT ENGINE TESTS PASSED PERFECTLY!');
console.log('===========================================');
