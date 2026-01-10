const fs = require('fs');
const { JSDOM } = require('jsdom');

const rawHtml = fs.readFileSync('index.html', 'utf8');
// remove external script tag to avoid double-loading
const html = rawHtml.replace(/<script[^>]*src="script\.js"[^>]*>\s*<\/script>/i, '');
let script = fs.readFileSync('script.js', 'utf8');

// Strip outer IIFE wrapper: remove leading (function(){ and trailing })();
script = script.replace(/^\s*\(function\s*\(\)\s*\{\s*'use strict';\s*/m, '');
script = script.replace(/\}\)\(\)\;?\s*$/m, '');
// After script content, attach exposures
script += "\n\n// expose selected functions for testing\nif (typeof calculateLift === 'function') window.__expose = window.__expose || {}; window.__expose.calculateLift = calculateLift; if (typeof saveState === 'function') window.__expose.saveState = saveState; if (typeof loadState === 'function') window.__expose.loadState = loadState;";

const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
const { window } = dom;

// Inject the modified script into the DOM so it executes in the same scope
const scriptEl = window.document.createElement('script');
scriptEl.textContent = script;
window.document.body.appendChild(scriptEl);

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

(async () => {
  // wait for scripts to run
  await wait(100);

  const pressure = window.document.getElementById('pressure');
  const pressureUnit = window.document.getElementById('pressureUnit');
  const outerD_custom = window.document.getElementById('outerD_custom');
  const innerD_custom = window.document.getElementById('innerD_custom');
  const resultValue = window.document.getElementById('resultValue');
  const explain = window.document.getElementById('explain');

  // Basic smoke test: ensure elements exist
  if (!pressure || !pressureUnit || !resultValue) {
    console.error('Missing required elements');
    process.exit(2);
  }

  // Set values and trigger calculation
  pressure.value = '345';
  pressure.dispatchEvent(new window.Event('input', { bubbles: true }));
  pressureUnit.value = 'bar';
  pressureUnit.dispatchEvent(new window.Event('change', { bubbles: true }));

  // call calculate
  if (window.__expose && typeof window.__expose.calculateLift === 'function') {
    window.__expose.calculateLift();
  } else {
    console.error('calculateLift not available');
    process.exit(3);
  }

  await wait(50);

  console.log('resultValue:', resultValue.textContent.trim());
  console.log('explain (short):', (explain.textContent || '').slice(0,120).replace(/\s+/g,' '));

  // Test persistence
  innerD_custom.value = '5 7/8';
  innerD_custom.dispatchEvent(new window.Event('input', { bubbles: true }));
  if (window.__expose && typeof window.__expose.saveState === 'function') {
    window.__expose.saveState();
    const raw = window.localStorage.getItem('stringlift.formState.v1');
    console.log('localStorage saved:', raw ? 'yes' : 'no');
    console.log('localStorage content:', raw);
  } else {
    console.log('saveState not available');
  }

  process.exit(0);
})();
