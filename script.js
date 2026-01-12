// script.js - single clean implementation

(function () {
  "use strict";

  // Utility: convert diameters to meters
  function convertDiameterToMeters(value, unit) {
    if (unit === "mm") return value / 1000;
    if (unit === "in") return value * 0.0254;
    return value; // assume meters
  }

  // Pressure conversions
  function convertPressureToPa(value, unit) {
    switch (unit) {
      case "bar":
        return value * 1e5;
      case "psi":
        return value * 6894.757293168;
      default:
        return value;
    }
  }

  function convertPaToUnit(valuePa, unit) {
    switch (unit) {
      case "bar":
        return valuePa / 1e5;
      case "psi":
        return valuePa / 6894.757293168;
      default:
        return valuePa;
    }
  }

  // Formatting helpers
  function formatInputNumber(n) {
    if (!isFinite(n)) return "";
    return String(Math.round(n));
  }

  function formatNumber(n, digits = 3) {
    if (!isFinite(n)) return "";
    return Number(n.toFixed(digits)).toLocaleString();
  }

  function formatPlainNumber(n, digits = 3) {
    if (!isFinite(n)) return "";
    return Number(n.toFixed(digits)).toString();
  }

  // Parse decimal or fraction strings like "5 7/8"
  function parseNumberOrFraction(str) {
    str = String(str).trim();
    if (str === "") return NaN;
    if (str.indexOf("/") !== -1) {
      const parts = str.split(/\s+|-/).filter(Boolean);
      if (parts.length === 1) {
        const frac = parts[0].split("/");
        if (frac.length === 2) return parseFloat(frac[0]) / parseFloat(frac[1]);
        return NaN;
      }
      if (parts.length === 2) {
        const whole = parseFloat(parts[0]);
        const frac = parts[1].split("/");
        if (frac.length === 2)
          return whole + parseFloat(frac[0]) / parseFloat(frac[1]);
      }
      return NaN;
    }
    return parseFloat(str);
  }

  // Sync selects and custom inputs
  function updateOuterCustomFromSelect() {
    const odSelect = document.getElementById("outerD");
    if (!odSelect) return;
    const od_m = parseFloat(odSelect.value);
    const el = document.getElementById("outerD_custom");
    if (isNaN(od_m)) {
      if (el) el.value = "";
      return;
    }
    const od_in = od_m / 0.0254;
    if (el) el.value = formatPlainNumber(od_in, 3);
  }

  function updateInnerCustomFromSelect() {
    const idSelect = document.getElementById("innerD");
    if (!idSelect) return;
    const id_m = parseFloat(idSelect.value);
    const el = document.getElementById("innerD_custom");
    if (isNaN(id_m) || id_m <= 0) {
      if (el) el.value = "0";
      return;
    }
    const id_in = id_m / 0.0254;
    if (el) el.value = formatPlainNumber(id_in, 3);
  }

  // Schematic visibility and layout
  function updateSchematicPipeVisibility() {
    try {
      const idSelect = document.getElementById("innerD");
      const innerCustomRaw =
        (document.getElementById("innerD_custom") || {}).value || "";
      let id_m = idSelect ? parseFloat(idSelect.value) : NaN;
      if ((innerCustomRaw || "").trim() !== "") {
        const parsed = parseNumberOrFraction(innerCustomRaw);
        if (!isNaN(parsed)) id_m = parsed * 0.0254;
      }

      const innerEl = document.querySelector(".well-inner");
      const leftBox = document.getElementById("leftBox");
      const rightBox = document.getElementById("rightBox");
      const leftBox2 = document.getElementById("leftBox2");
      const rightBox2 = document.getElementById("rightBox2");
      const liftText = document.getElementById("liftBoxValue");
      const pressureDisplayEl = document.getElementById("pressureValue");
      const liftArrow = document.getElementById("liftArrow");
      if (!innerEl) return;

      if (isNaN(id_m) || id_m <= 0) {
        // No pipe: hide inner pipe and center + widen boxes
        innerEl.style.display = "none";
        if (leftBox) {
          leftBox.setAttribute("x", "18");
          leftBox.setAttribute("width", "131");
        }
        if (rightBox) {
          rightBox.setAttribute("x", "151");
          rightBox.setAttribute("width", "131");
        }
        if (leftBox2) leftBox2.style.display = "none";
        if (rightBox2) rightBox2.style.display = "none";
        if (liftText) liftText.setAttribute("x", "150");
        if (pressureDisplayEl) {
          pressureDisplayEl.setAttribute("x", "150");
          pressureDisplayEl.setAttribute("y", "250");
        }
        if (liftArrow) {
          const line = liftArrow.querySelector("line");
          const poly = liftArrow.querySelector("polygon");
          if (line) {
            line.setAttribute("x1", "150");
            line.setAttribute("x2", "150");
          }
          if (poly) poly.setAttribute("points", "150,130 144,140 157,140");
        }
      } else {
        // Pipe present: show inner pipe and restore original positions/sizes
        innerEl.style.display = null;
        if (leftBox) {
          leftBox.setAttribute("x", "15");
          leftBox.setAttribute("width", "95");
        }
        if (rightBox) {
          rightBox.setAttribute("x", "190");
          rightBox.setAttribute("width", "95");
        }
        if (leftBox2) leftBox2.style.display = null;
        if (rightBox2) rightBox2.style.display = null;
        if (liftText) liftText.setAttribute("x", "62.5");
        if (pressureDisplayEl) {
          pressureDisplayEl.setAttribute("x", "240");
          pressureDisplayEl.setAttribute("y", "120");
        }
        if (liftArrow) {
          const line = liftArrow.querySelector("line");
          const poly = liftArrow.querySelector("polygon");
          if (line) {
            line.setAttribute("x1", "62.5");
            line.setAttribute("x2", "62.5");
          }
          if (poly) poly.setAttribute("points", "62.5,130 56,140 69,140");
        }
      }
    } catch (err) {
      console.error("updateSchematicPipeVisibility", err);
    }
  }

  // Element refs and listeners
  const odSelectEl = document.getElementById("outerD");
  if (odSelectEl) {
    odSelectEl.addEventListener("change", updateOuterCustomFromSelect);
    updateOuterCustomFromSelect();
  }

  const idSelectEl = document.getElementById("innerD");
  if (idSelectEl) {
    idSelectEl.addEventListener("change", updateInnerCustomFromSelect);
    updateInnerCustomFromSelect();
  }

  if (idSelectEl)
    idSelectEl.addEventListener("change", updateSchematicPipeVisibility);
  const innerCustomInput = document.getElementById("innerD_custom");
  if (innerCustomInput)
    innerCustomInput.addEventListener("input", updateSchematicPipeVisibility);
  updateSchematicPipeVisibility();
  // ensure pressure inputs are available for auto-listeners
  const pressureInput = document.getElementById("pressure");
  const pressureUnitSelect = document.getElementById("pressureUnit");

  // Persistence: save/load form state to localStorage
  const STORAGE_KEY = "stringlift.formState.v1";
  function saveState() {
    try {
      const state = {
        outerD: (document.getElementById("outerD") || {}).value || "",
        outerD_custom:
          (document.getElementById("outerD_custom") || {}).value || "",
        innerD: (document.getElementById("innerD") || {}).value || "",
        innerD_custom:
          (document.getElementById("innerD_custom") || {}).value || "",
        pressure: (document.getElementById("pressure") || {}).value || "",
        pressureUnit:
          (document.getElementById("pressureUnit") || {}).value || "",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("saveState failed", e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state) return false;
      // Restore pressure exactly as stored (no conversion on load)
      const pressureUnitEl = document.getElementById("pressureUnit");
      const pressureInputEl = document.getElementById("pressure");

      // Restore raw pressure value if present
      if (state.hasOwnProperty("pressure") && pressureInputEl) {
        pressureInputEl.value = state.pressure;
      }

      // Restore unit select to the stored value (robust match)
      if (state.pressureUnit && pressureUnitEl) {
        const desired = String(state.pressureUnit || "").trim();
        const opts = Array.from(pressureUnitEl.options).map((o) => o.value);
        let chosen = null;
        if (opts.includes(desired)) {
          chosen = desired;
        } else {
          const match = opts.find(
            (o) => o.toLowerCase() === desired.toLowerCase()
          );
          if (match) chosen = match;
        }
        if (chosen) {
          pressureUnitEl.value = chosen;
          pressureUnitEl.dataset.prev = chosen;
          const idx = opts.indexOf(chosen);
          if (idx >= 0) pressureUnitEl.selectedIndex = idx;
        }
      }
      if (state.outerD) {
        const el = document.getElementById("outerD");
        if (el) el.value = state.outerD;
      }
      if (state.outerD_custom !== undefined) {
        const el = document.getElementById("outerD_custom");
        if (el) el.value = state.outerD_custom;
      }
      if (state.innerD) {
        const el = document.getElementById("innerD");
        if (el) el.value = state.innerD;
      }
      if (state.innerD_custom !== undefined) {
        const el = document.getElementById("innerD_custom");
        if (el) el.value = state.innerD_custom;
      }
      return true;
    } catch (e) {
      console.warn("loadState failed", e);
      return false;
    }
  }

  // Load previous state (if any) and initialize UI
  loadState();
  if (pressureUnitSelect)
    pressureUnitSelect.dataset.prev = pressureUnitSelect.value;
  // only update select->custom sync when user has not provided a custom value
  const outerCustomEl = document.getElementById("outerD_custom");
  const innerCustomEl = document.getElementById("innerD_custom");
  if (!outerCustomEl || !outerCustomEl.value) updateOuterCustomFromSelect();
  if (!innerCustomEl || !innerCustomEl.value) updateInnerCustomFromSelect();
  updateSchematicPipeVisibility();
  // Auto-calc: recalculate whenever relevant inputs change
  if (odSelectEl) {
    odSelectEl.addEventListener("change", function () {
      updateOuterCustomFromSelect();
      updateSchematicPipeVisibility();
      calculateLift();
    });
  }
  const outerCustomInput = document.getElementById("outerD_custom");
  if (outerCustomInput) {
    outerCustomInput.addEventListener("input", function () {
      updateSchematicPipeVisibility();
      calculateLift();
    });
  }
  if (idSelectEl) {
    idSelectEl.addEventListener("change", function () {
      updateInnerCustomFromSelect();
      updateSchematicPipeVisibility();
      calculateLift();
    });
  }
  if (innerCustomInput) {
    innerCustomInput.addEventListener("input", function () {
      updateSchematicPipeVisibility();
      calculateLift();
    });
  }
  if (pressureInput) {
    pressureInput.addEventListener("input", function () {
      calculateLift();
    });
    // Also save on change to catch cases where input event might not fire before refresh
    pressureInput.addEventListener("change", saveState);
  }
  if (pressureUnitSelect) {
    // additional calc after unit conversion
    pressureUnitSelect.addEventListener("change", function () {
      try {
        calculateLift();
      } catch (err) {}
    });
  }

  // save state on relevant changes
  if (odSelectEl) odSelectEl.addEventListener("change", saveState);
  if (outerCustomInput) outerCustomInput.addEventListener("input", saveState);
  if (idSelectEl) idSelectEl.addEventListener("change", saveState);
  if (innerCustomInput) innerCustomInput.addEventListener("input", saveState);
  if (pressureInput) pressureInput.addEventListener("input", saveState);
  if (pressureUnitSelect)
    pressureUnitSelect.addEventListener("change", saveState);

  // Pressure input and unit select — convert displayed value when unit changes
  if (pressureUnitSelect) {
    pressureUnitSelect.dataset.prev = pressureUnitSelect.value;
    pressureUnitSelect.addEventListener("change", function () {
      const prev = pressureUnitSelect.dataset.prev || "bar";
      const newUnit = pressureUnitSelect.value;
      const raw = (pressureInput || {}).value || "";
      if (raw === "") {
        pressureUnitSelect.dataset.prev = newUnit;
        return;
      }
      const cleaned = raw.replace(/[,\s]/g, "").replace(/[^0-9.\-]/g, "");
      const n = parseFloat(cleaned);
      if (isNaN(n)) {
        pressureUnitSelect.dataset.prev = newUnit;
        return;
      }
      const pa = convertPressureToPa(n, prev);
      const converted = convertPaToUnit(pa, newUnit);
      console.debug("pressure unit change:", {
        prev,
        newUnit,
        raw,
        cleaned: n,
        pa,
        converted,
      });
      pressureInput.value = formatInputNumber(converted);
      pressureUnitSelect.dataset.prev = newUnit;
      try {
        calculateLift();
      } catch (err) {
        /* ignore */
      }
    });
  }

  // Form, result and controls
  const form = document.getElementById("liftForm");
  const resultEl = document.getElementById("result");
  const explainEl = document.getElementById("explain");

  function calculateLift() {
    try {
      const pressureDisplayEl = document.getElementById("pressureValue");
      if (pressureDisplayEl) pressureDisplayEl.textContent = "— bar";

      const idSelect = document.getElementById("innerD");
      const idSelectVal = parseFloat(idSelect.value);
      const idSelectLabel = idSelect.selectedOptions[0].text;
      const innerCustomRaw = (
        document.getElementById("innerD_custom") || {}
      ).value.trim();
      const innerCustomUnit = "in";
      let id_m = idSelectVal;
      let idLabel = idSelectLabel;
      if (innerCustomRaw !== "") {
        const parsed = parseNumberOrFraction(innerCustomRaw);
        if (isNaN(parsed) || parsed < 0) {
          const resultValueEl = document.getElementById("resultValue");
          if (resultValueEl) resultValueEl.textContent = "— tons";
          const liftDisplayEl = document.getElementById("liftBoxValue");
          if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
          resultEl.textContent = "";
          explainEl.textContent =
            "Custom inner diameter must be a non-negative number (supports fractions like '5 7/8').";
          return;
        }
        id_m = convertDiameterToMeters(parsed, innerCustomUnit);
        idLabel = `${innerCustomRaw} ${innerCustomUnit} (custom)`;
      }

      const odSelectVal = parseFloat(document.getElementById("outerD").value);
      const odSelectLabel =
        document.getElementById("outerD").selectedOptions[0].text;
      const outerCustomRaw =
        (document.getElementById("outerD_custom") || {}).value || "";
      const outerCustomUnit = "in";
      let od_m = odSelectVal;
      let odLabel = odSelectLabel;
      if ((outerCustomRaw || "").trim() !== "") {
        const parsedOuter = parseNumberOrFraction(outerCustomRaw);
        if (isNaN(parsedOuter) || parsedOuter <= 0) {
          const resultValueEl = document.getElementById("resultValue");
          if (resultValueEl) resultValueEl.textContent = "— tons";
          const liftDisplayEl = document.getElementById("liftBoxValue");
          if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
          resultEl.textContent = "";
          explainEl.textContent =
            "Custom outer diameter must be a positive number (supports fractions).";
          return;
        }
        od_m = convertDiameterToMeters(parsedOuter, outerCustomUnit);
        odLabel = `${outerCustomRaw} ${outerCustomUnit} (custom)`;
      }

      const pVal = parseFloat(document.getElementById("pressure").value);
      const pUnit = document.getElementById("pressureUnit").value;
      if (isNaN(id_m) || isNaN(od_m) || isNaN(pVal)) {
        const resultValueEl = document.getElementById("resultValue");
        if (resultValueEl) resultValueEl.textContent = "— tons";
        const liftDisplayEl = document.getElementById("liftBoxValue");
        if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
        resultEl.textContent = "";
        explainEl.textContent = "Please enter all numeric values.";
        return;
      }

      const p_pa = convertPressureToPa(pVal, pUnit);
      if (pressureDisplayEl) pressureDisplayEl.textContent = `${pVal} ${pUnit}`;
      if (id_m < 0 || od_m <= 0 || p_pa < 0) {
        const resultValueEl = document.getElementById("resultValue");
        if (resultValueEl) resultValueEl.textContent = "— tons";
        const liftDisplayEl = document.getElementById("liftBoxValue");
        if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
        resultEl.textContent = "";
        explainEl.textContent =
          "Diameters must be non-negative and pressure cannot be negative.";
        return;
      }

      if (od_m <= id_m) {
        const resultValueEl = document.getElementById("resultValue");
        if (resultValueEl) resultValueEl.textContent = "— tons";
        const liftDisplayEl = document.getElementById("liftBoxValue");
        if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
        resultEl.textContent = "";
        explainEl.textContent =
          "Outer diameter must be larger than inner diameter.";
        return;
      }

      const area_annulus = (Math.PI * (od_m * od_m - id_m * id_m)) / 4.0;
      const liftN = p_pa * area_annulus;
      const liftKg = liftN / 9.80665;
      const liftTon = liftKg / 1000;

      const resultValueEl = document.getElementById("resultValue");
      if (resultValueEl)
        resultValueEl.textContent = `${formatNumber(liftTon, 1)} tons`;
      const liftDisplayEl = document.getElementById("liftBoxValue");
      if (liftDisplayEl)
        liftDisplayEl.textContent = `${formatNumber(liftTon, 1)} tons`;

      const od_in = od_m / 0.0254;
      if (explainEl)
        explainEl.innerHTML = `ID: ${idLabel} (${formatNumber(
          id_m,
          5
        )} m)<br>OD: ${odLabel} (actual ${formatNumber(
          od_in,
          3
        )} in / ${formatNumber(od_m, 5)} m)<br>Annular area: ${formatNumber(
          area_annulus,
          6
        )} m²<br>Pressure: ${formatNumber(p_pa, 3)} Pa<br>Lift: ${formatNumber(
          liftTon,
          1
        )} tons (${formatNumber(liftKg, 1)} kgf / ${formatNumber(
          liftN,
          1
        )} N)<br>Calculation: F = p × A`;
    } catch (err) {
      console.error("calculateLift error", err);
      if (explainEl) explainEl.textContent = `Error: ${err.message}`;
    }
  }

  // initialize
  updateInnerCustomFromSelect();
  updateOuterCustomFromSelect();
  updateSchematicPipeVisibility();
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      calculateLift();
    });
  }

  // Navigation active link highlighting — add 'active' to the link that matches current page
  (function setActiveNavLink() {
    const links = document.querySelectorAll('.linker a');
    if (!links || !links.length) return;
    const current = window.location.href.replace(/\/$/, '');
    links.forEach((a) => {
      try {
        const href = a.href.replace(/\/$/, '');
        if (href === current || current.startsWith(href) || href.startsWith(current) || href.includes(window.location.pathname)) {
          a.classList.add('active');
        }
      } catch (e) {
        // ignore invalid URLs
      }
    });
  })();

  try {
    calculateLift();
  } catch (e) {
    /* ignore */
  }
})();
