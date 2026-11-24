import fs from 'fs';
import assert from 'assert';

console.log('====================================================');
console.log('   HOME GLOBAL SEARCH ENGINE VERIFICATION TESTS     ');
console.log('====================================================');

const iconsJs = fs.readFileSync('icons.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

const mockWindow = {
  I18n: { translate: (k) => k },
  renderIcon: () => '<svg></svg>',
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} },
  navigator: { language: 'en' }
};

const createMockEl = () => ({
  addEventListener: () => {},
  style: { display: 'none' },
  value: '',
  appendChild: () => {},
  getAttribute: () => null,
  setAttribute: () => {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  querySelectorAll: () => [],
  querySelector: () => createMockEl()
});

const mockDoc = {
  getElementById: (id) => createMockEl(),
  querySelector: (sel) => {
    if (sel.includes('.modal') || sel.includes('.open') || sel.includes('.active')) return null;
    return createMockEl();
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => createMockEl(),
  head: { appendChild: () => {} },
  body: { appendChild: () => {} }
};

const mockLocalStorage = {
  getItem: () => null,
  setItem: () => null,
  removeItem: () => null
};

const sandbox = new Function(
  'window', 'document', 'localStorage', 'navigator',
  'const renderIcon = (name) => \"<svg></svg>\";\n' + appJs + '; return { searchTools, getSearchIndex, openCalculatorFromSearch, calcSubState, state, navigateTo, navStack, handleBack };'
);

const env = sandbox(mockWindow, mockDoc, mockLocalStorage, { language: 'en' });
const registry = env.getSearchIndex();

console.log(`\nRegistry initialized with ${registry.length} items.\n`);

// TEST 1: Strict abbreviation match for "lot"
console.log('--- TEST 1: Strict matching for "lot" (<= 3 chars) ---');
const lotResults = env.searchTools('lot', registry);
console.log('Results for "lot":', lotResults.map(r => r.title));
assert(lotResults.length >= 1, '"lot" must return results');
assert.strictEqual(lotResults[0].id, 'leak_off', 'First result for "lot" must be leak_off');
assert(
  !lotResults.some(r => r.id === 'milling_time'),
  'Milling Time Estimate MUST NOT appear in results for "lot"'
);
console.log('PASSED: "lot" strictly matches Leak Off Test Calculation and excludes Milling Time Estimate!\n');

// TEST 2: Typo tolerance for queries >= 4 chars
console.log('--- TEST 2: Typo tolerance for queries >= 4 chars ---');
const typo1 = env.searchTools('leak of test', registry);
assert(typo1.length >= 1 && typo1[0].id === 'leak_off', '"leak of test" must match leak_off');

const typo2 = env.searchTools('leak off test', registry);
assert(typo2.length >= 1 && typo2[0].id === 'leak_off', '"leak off test" must match leak_off');

const typo3 = env.searchTools('leak test', registry);
assert(typo3.length >= 1 && typo3[0].id === 'leak_off', '"leak test" must match leak_off');
console.log('PASSED: Typo tolerance correctly matches "leak of test", "leak off test", and "leak test"!\n');

// TEST 3: Common drilling engineering acronyms
console.log('--- TEST 3: Common drilling acronyms (WOB, ECD, KMW, ICP, FCP, MAASP) ---');
const wobRes = env.searchTools('wob', registry);
assert.strictEqual(wobRes[0].id, 'wob_calc', 'Top result for "wob" must be wob_calc');

const ecdRes = env.searchTools('ecd', registry);
assert(ecdRes.length >= 1 && (ecdRes[0].id === 'ecd_applied' || ecdRes[0].id === 'eff_mud_dens'), 'Top result for "ecd" must be ECD');

const kmwRes = env.searchTools('kmw', registry);
assert.strictEqual(kmwRes[0].title, 'Kill Mud Weight', 'Top result for "kmw" must be Kill Mud Weight');

const icpRes = env.searchTools('icp', registry);
assert.strictEqual(icpRes[0].title, 'Initial Circulating Pressure', 'Top result for "icp" must be Initial Circulating Pressure');

const fcpRes = env.searchTools('fcp', registry);
assert.strictEqual(fcpRes[0].title, 'Final Circulating Pressure', 'Top result for "fcp" must be Final Circulating Pressure');

const maaspRes = env.searchTools('maasp', registry);
assert(maaspRes[0].title.includes('MAASP'), 'Top result for "maasp" must be MAASP');
console.log('PASSED: All standard drilling engineering acronyms match correctly at #1 rank!\n');

// TEST 4: Non-matching garbage query returns empty list without error
console.log('--- TEST 4: Empty / non-matching query handling ---');
const emptyRes = env.searchTools('zzzq123xyz', registry);
assert.strictEqual(emptyRes.length, 0, 'Garbage query must return 0 results');
console.log('PASSED: Non-matching query cleanly returns empty array.\n');

// TEST 5: Direct Calculator Navigation from Search
console.log('--- TEST 5: Direct Calculator Navigation from Search ---');
env.state.currentScreen = 'dashboard';
env.state.openedFromHomeSearch = true;
env.state.savedHomeSearchQuery = 'lot';
env.openCalculatorFromSearch('leak_off', 'drilling', 'calculations');
assert.strictEqual(env.state.currentScreen, 'drilling-calc', 'Current screen must be drilling-calc');
assert.strictEqual(env.calcSubState.view, 'formula', 'calcSubState.view must be formula');
assert.strictEqual(env.calcSubState.formulaId, 'leak_off', 'calcSubState.formulaId must be leak_off');
console.log('PASSED: openCalculatorFromSearch directly activates formula view for leak_off!\n');

// TEST 6: Back Navigation to Dashboard with Preserved Search Query
console.log('--- TEST 6: Back Navigation to Dashboard ---');
env.handleBack();
assert.strictEqual(env.state.currentScreen, 'dashboard', 'Pressing Back must return to dashboard');
assert.strictEqual(env.state.searchQuery, 'lot', 'Search query must be preserved on return to dashboard');
console.log('PASSED: Back from formula returns to dashboard and restores search query!\n');

console.log('====================================================');
console.log('   ALL SEARCH ENGINE TESTS PASSED (100%)!           ');
console.log('====================================================');
