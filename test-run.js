const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
let script = fs.readFileSync('script.js', 'utf8');

// Replace the outer IIFE to pass an `exports` object so we can expose internals
script = script.replace(/^[\s\S]*?\(function\s*\(\)\s*\{/, '(function(exports) {');
script = script.replace(/\)\(\)\;?\s*$/m, "exports.calculateLift = typeof calculateLift !== 'undefined' ? calculateLift : null; exports.saveState = typeof saveState !== 'undefined' ? saveState : null; exports.loadState = typeof loadState !== 'undefined' ? loadState : null; })(window.__expose = window.__expose || {});");

const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
const { window } = dom;

// Inject the modified script into the DOM so it executes in the same scope
const scriptEl = window.document.createElement('script');
scriptEl.textContent = script;
window.document.body.appendChild(scriptEl);

// helper to wait for a short time
function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

(async () => {
  // wait for any async initialization
  await wait(50);

  const pressure = window.document.getElementById('pressure');
  const pressureUnit = window.document.getElementById('pressureUnit');
  const outerD_custom = window.document.getElementById('outerD_custom');
  const innerD_custom = window.document.getElementById('innerD_custom');
  const resultValue = window.document.getElementById('resultValue');

  // set values programmatically
  pressure.value = '345';
  pressureUnit.value = 'bar';
  outerD_custom.value = '';
  innerD_custom.value = '';

  // trigger input events
  pressure.dispatchEvent(new window.Event('input', { bubbles: true }));
  pressureUnit.dispatchEvent(new window.Event('change', { bubbles: true }));

  // call calculate if exposed
  if (window.__expose && typeof window.__expose.calculateLift === 'function') {
    window.__expose.calculateLift();
  } else {
    console.error('calculateLift not exposed');
    process.exit(2);
  }

  await wait(20);

  console.log('resultValue:', resultValue.textContent.trim());

  // Test persistence: set a custom value and call saveState, then read localStorage
  innerD_custom.value = '5.875';
  innerD_custom.dispatchEvent(new window.Event('input', { bubbles: true }));
  if (window.__expose && typeof window.__expose.saveState === 'function') {
    window.__expose.saveState();
    const raw = window.localStorage.getItem('stringlift.formState.v1');
    console.log('localStorage saved:', raw ? 'yes' : 'no');
    console.log('localStorage content:', raw);
  } else {
    console.log('saveState not exposed');
  }

  process.exit(0);
})();
