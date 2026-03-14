#!/usr/bin/env node
/**
 * EasyCoder JS-browser conformance adapter (headless Node.js)
 *
 * Loads the pre-built dist/easycoder.js bundle into a minimal browser-API shim,
 * runs each canonical .ecs test, captures log output, and writes an actuals JSON
 * file for use with run_conformance.py --actuals.
 *
 * Usage:
 *   node conformance/ec_js_runner.js
 *     [--conformance-root conformance]
 *     [--dist-path dist/easycoder.js]
 *     [--output conformance/actuals-js-browser.json]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------- parse args --------------------------------------------------

function parseArgs() {
  const args = { conformanceRoot: 'conformance', distPath: 'dist/easycoder.js', output: 'conformance/actuals-js-browser.json' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--conformance-root') args.conformanceRoot = process.argv[++i];
    else if (process.argv[i] === '--dist-path') args.distPath = process.argv[++i];
    else if (process.argv[i] === '--output') args.output = process.argv[++i];
  }
  return args;
}

// ---------- minimal browser shim ----------------------------------------

function buildSandbox(logCollector, errorCollector) {
  // EasyCoder.js assigns window.onload and expects window.EasyCoder
  const localStorage = { _data: {}, getItem(k) { return this._data[k] ?? null; }, setItem(k, v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; } };
  const document = {
    getElementById() { return null; },
    createElement() { return { style: {}, appendChild() {}, textContent: '', scrollTop: 0, scrollHeight: 0 }; },
    body: null,
  };

  const alertFn = (msg) => { errorCollector.push({ category: 'runtime', message: String(msg) }); };

  const window = {
    onload: null,
    localStorage,
    location: { search: '', href: '' },
    EasyCoder: undefined,
    URLSearchParams: class URLSearchParams {
      constructor(s) { this._p = new Map(); }
      has() { return false; }
      get() { return null; }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    alert: alertFn,
    setTimeout: () => {},
    clearTimeout: () => {},
    Date: global.Date,
    Math: global.Math,
    parseInt: global.parseInt,
    parseFloat: global.parseFloat,
    isNaN: global.isNaN,
    encodeURIComponent: global.encodeURIComponent,
    decodeURIComponent: global.decodeURIComponent,
    JSON: global.JSON,
    console: global.console,
  };

  const sandbox = {
    window,
    document,
    localStorage,
    alert: alertFn,
    console: global.console,
    Date: global.Date,
    Math: global.Math,
    parseInt: global.parseInt,
    parseFloat: global.parseFloat,
    isNaN: global.isNaN,
    encodeURIComponent: global.encodeURIComponent,
    decodeURIComponent: global.decodeURIComponent,
    JSON: global.JSON,
    URLSearchParams: window.URLSearchParams,
    setTimeout: () => {},
    clearTimeout: () => {},
  };

  return { sandbox, window };
}

// ---------- run one test ------------------------------------------------

function runTest(distCode, scriptSource) {
  const logs = [];
  const errors = [];

  const { sandbox, window } = buildSandbox(logs, errors);

  // Intercept log output
  const originalConsoleLog = console.log;

  // We'll override after EasyCoder boots inside the VM
  const vmContext = vm.createContext(sandbox);

  // Inject the dist bundle, then expose the EasyCoder const into the sandbox
  // (bundle uses `const EasyCoder = {...}` which doesn't bind to vmContext keys)
  try {
    vm.runInContext(distCode + '\n__EC__ = EasyCoder;', vmContext);
  } catch (e) {
    return { logs: [], error: { category: 'runtime', message: `Bundle load failed: ${e.message}` } };
  }

  // EasyCoder.js sets window.onload; the bundle ends with `window.onload = EasyCoder_Startup`
  // We need to patch writeToDebugConsole before startup so log captures work.
  const EC = vmContext.__EC__ || vmContext.window.EasyCoder;
  if (!EC) {
    return { logs: [], error: { category: 'runtime', message: 'EasyCoder object not found after bundle load' } };
  }

  // Route all output through our collector
  EC.writeToDebugConsole = (msg) => {
    logs.push(msg);
  };

  // Initialize state that EasyCoder_Startup() would normally set
  // (bypassed when calling EC.start() directly without window.onload)
  EC.scripts = {};
  sandbox.window.EasyCoder = EC;

  // Run the test script directly through EasyCoder.start
  try {
    EC.start(scriptSource);
  } catch (e) {
    errors.push({ category: 'runtime', message: e.message });
  }

  // Parse logs: filter out version/compile lines; isolate log values
  return parseOutput(logs, errors);
}

// ---------- output parsing ----------------------------------------------

// log format: HH:MM:SS.mmm:scriptname:lino->value
const LOG_RE = /^\d{2}:\d{2}:\d{2}\.\d+:[^:]+:\d+->(.*)$/;
// compile error
const COMPILE_ERR_RE = /^Compile error in/;
const RUNTIME_ERR_RE = /^(?:Runtime error|Line \d+:|Error)/;

function parseOutput(rawLogs, errors) {
  const logValues = [];
  let error = null;

  for (const line of rawLogs) {
    if (!line) continue;
    const logM = LOG_RE.exec(line);
    if (logM) { logValues.push(logM[1]); continue; }
    if (COMPILE_ERR_RE.test(line)) { error = { category: 'compile', message: line }; continue; }
    if (RUNTIME_ERR_RE.test(line)) { error = { category: 'runtime', message: line }; }
  }
  if (errors.length > 0 && !error) error = errors[0];

  return { logs: logValues, error };
}

// ---------- main --------------------------------------------------------

function main() {
  const args = parseArgs();

  const distPath = path.resolve(args.distPath);
  const conformanceRoot = path.resolve(args.conformanceRoot);
  const outputPath = path.resolve(args.output);

  if (!fs.existsSync(distPath)) {
    console.error(`dist bundle not found: ${distPath}`);
    process.exit(1);
  }
  const distCode = fs.readFileSync(distPath, 'utf8');

  const manifest = JSON.parse(fs.readFileSync(path.join(conformanceRoot, 'tests', 'index.json'), 'utf8'));

  const actuals = {};

  for (const testFile of manifest.tests) {
    const meta = JSON.parse(fs.readFileSync(path.join(conformanceRoot, 'tests', testFile), 'utf8'));
    const testId = meta.id;
    const scriptPath = path.join(conformanceRoot, 'tests', meta.script);

    process.stdout.write(`  Running ${testId} (${meta.script}) ... `);

    if (!fs.existsSync(scriptPath)) {
      console.log('SKIP (script not found)');
      continue;
    }

    let source = fs.readFileSync(scriptPath, 'utf8');

    const result = runTest(distCode, source);
    actuals[testId] = result;

    const status = result.error ? `ERROR: ${result.error.message.substring(0, 60)}` : `${result.logs.length} log(s)`;
    console.log(status);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(actuals, null, 2) + '\n', 'utf8');
  console.log(`\nActuals written to: ${outputPath}`);
}

main();
