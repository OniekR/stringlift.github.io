function convertDiameterToMeters(value, unit) {
  if (unit === "mm") return value / 1000;
  if (unit === "in") return value * 0.0254; // inches to meters
  return value; // meters
}

function convertPressureToPa(value, unit) {
  switch (unit) {
    case "bar":
      return value * 1e5;
    case "psi":
      return value * 6894.757293168; // 1 psi = 6894.757293168 Pa
    default:
      return value; // assume value already in Pa if unknown
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

function formatInputNumber(n) {
  if (!isFinite(n)) return "";
  // Return plain integer string (no thousands separator) so <input type="number"> can parse it
  return String(Math.round(n));
}

// Generic number formatter used by diameter fields
function formatNumber(n, digits = 3) {
  if (!isFinite(n)) return "";
  return Number(n.toFixed(digits)).toLocaleString();
}

// Plain numeric string without thousands separators for use in input fields
function formatPlainNumber(n, digits = 3) {
  if (!isFinite(n)) return "";
  // toFixed produces a string; trim trailing zeros and optional decimal point
  const s = Number(n.toFixed(digits)).toString();
  return s;
}

// Parse decimal or fractional input like "5 7/8" or "7/8" or "5.875"
function parseNumberOrFraction(str) {
  str = String(str).trim();
  if (str === "") return NaN;
  // handle formats: "5 7/8", "5-7/8", "7/8", or decimal numbers
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
  // decimal
  return parseFloat(str);
}

// Keep OD select and custom input in sync
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

// Keep ID select and custom input in sync
function updateInnerCustomFromSelect() {
  const idSelect = document.getElementById("innerD");
  if (!idSelect) return;
  const id_m = parseFloat(idSelect.value);
  const el = document.getElementById("innerD_custom");
  // If "No pipe" (value 0) or invalid, display 0 in the custom field as requested
  if (isNaN(id_m) || id_m <= 0) {
    if (el) el.value = "0";
    return;
  }
  const id_in = id_m / 0.0254;
  if (el) el.value = formatPlainNumber(id_in, 3);
}

// initialize and add listeners
const odSelectEl = document.getElementById("outerD");
if (odSelectEl) {
  odSelectEl.addEventListener("change", updateOuterCustomFromSelect);
  // set initial value
  updateOuterCustomFromSelect();
}

const idSelectEl = document.getElementById("innerD");
if (idSelectEl) {
  idSelectEl.addEventListener("change", updateInnerCustomFromSelect);
  // set initial value
  updateInnerCustomFromSelect();
}

// Pressure input and unit select — convert displayed value when unit changes
const pressureInput = document.getElementById("pressure");
const pressureUnitSelect = document.getElementById("pressureUnit");
if (pressureUnitSelect) {
  // remember previous unit for conversion
  pressureUnitSelect.dataset.prev = pressureUnitSelect.value;
  pressureUnitSelect.addEventListener("change", function (e) {
    const prev = pressureUnitSelect.dataset.prev || "bar";
    const newUnit = pressureUnitSelect.value;
    const raw = (pressureInput || {}).value || "";
    if (raw === "") {
      pressureUnitSelect.dataset.prev = newUnit;
      return;
    }
    // Strip commas, spaces, and any non-numeric characters except dot and minus
    const cleaned = raw.replace(/[,\s]/g, "").replace(/[^0-9.\-]/g, "");
    const n = parseFloat(cleaned);
    if (isNaN(n)) {
      pressureUnitSelect.dataset.prev = newUnit;
      return;
    }
    const pa = convertPressureToPa(n, prev);
    const converted = convertPaToUnit(pa, newUnit);
    // Debug log to help trace conversions
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
    // Recalculate with the new unit/value so results update immediately
    try {
      calculateLift();
    } catch (err) {
      /* ignore */
    }
  });
}

const form = document.getElementById("liftForm");
const resultEl = document.getElementById("result");
const explainEl = document.getElementById("explain");
const clearBtn = document.getElementById("clearBtn");

// calculate Lift (extracted from submit handler so it can be used live)
function calculateLift() {
  try {
    console.log("calculateLift called");
    // read inputs (allow a custom inner diameter to override the dropdown)
    const idSelect = document.getElementById("innerD");
    const idSelectVal = parseFloat(idSelect.value); // meters
    const idSelectLabel = idSelect.selectedOptions[0].text;

    const innerCustomRaw = document
      .getElementById("innerD_custom")
      .value.trim();
    // custom values are always inches
    const innerCustomUnit = "in";

    let id_m = idSelectVal;
    let idLabel = idSelectLabel;

    if (innerCustomRaw !== "") {
      const parsed = parseNumberOrFraction(innerCustomRaw);
      // allow zero (no pipe) — only negative values are invalid
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

      // convert custom value (interpreted in inches) to meters
      id_m = convertDiameterToMeters(parsed, innerCustomUnit);
      idLabel = `${innerCustomRaw} ${innerCustomUnit} (custom)`;
    }

    // outer diameter: allow custom value (inches) to override select
    const odSelectVal = parseFloat(document.getElementById("outerD").value); // meters
    const odSelectLabel =
      document.getElementById("outerD").selectedOptions[0].text;
    const outerCustomRaw =
      (document.getElementById("outerD_custom") || {}).value || "";
    const outerCustomUnit = "in"; // always inches

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
    // Always use annular area (OD² - ID²) — internal area is not calculated by this tool

    if (isNaN(id_m) || isNaN(od_m) || isNaN(pVal)) {
      const resultValueEl = document.getElementById("resultValue");
      if (resultValueEl) resultValueEl.textContent = "— tons";
      const liftDisplayEl = document.getElementById("liftBoxValue");
      if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
      resultEl.textContent = "";
      explainEl.textContent = "Please enter all numeric values.";
      return;
    }

    // pressure conversion to Pa
    const p_pa = convertPressureToPa(pVal, pUnit);

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

    const area_internal = (Math.PI * (id_m * id_m)) / 4.0; // m^2
    const area_annulus = (Math.PI * (od_m * od_m - id_m * id_m)) / 4.0; // m^2

    // Use annular area by default
    let usedArea = area_annulus;
    let caption = "Annular area";

    const liftN = p_pa * usedArea; // Force = pressure * area
    const liftKg = liftN / 9.80665; // convert N to kgf
    const liftTon = liftKg / 1000; // convert kgf to metric tons

    const resultValueEl = document.getElementById("resultValue");
    if (resultValueEl) {
      resultValueEl.textContent = `${formatNumber(liftTon, 1)} tons`;
    } else {
      resultEl.textContent = `${formatNumber(liftTon, 1)} tons`;
    }
    // update schematic lift display under the left box
    const liftDisplayEl = document.getElementById("liftBoxValue");
    if (liftDisplayEl)
      liftDisplayEl.textContent = `${formatNumber(liftTon, 1)} tons`;

    // show which ID/OD was used along with converted units and actual OD in inches
    const od_in = od_m / 0.0254;
    explainEl.innerHTML = `ID: ${idLabel} (${formatNumber(
      id_m,
      5
    )} m)<br>OD: ${odLabel} (actual ${formatNumber(
      od_in,
      3
    )} in / ${formatNumber(od_m, 5)} m)<br>${caption}: ${formatNumber(
      usedArea,
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

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    form.reset();
    // reset the stored previous pressure unit
    if (pressureUnitSelect)
      pressureUnitSelect.dataset.prev = pressureUnitSelect.value;
    const resultValueEl = document.getElementById("resultValue");
    if (resultValueEl) resultValueEl.textContent = "— tons";
    const liftDisplayEl = document.getElementById("liftBoxValue");
    if (liftDisplayEl) liftDisplayEl.textContent = "— tons";
    if (resultEl) resultEl.textContent = "";
    if (explainEl) explainEl.textContent = "";
    // Resync the custom fields to reflect the reset selects
    try {
      updateInnerCustomFromSelect();
      updateOuterCustomFromSelect();
      // recalc after reset
      calculateLift();
    } catch (err) {
      // ignore
    }
  });
} else {
  console.warn(
    "Clear button #clearBtn not found; skipping clear handler attach"
  );
}

// No live updates — calculation runs on form submit only
// initialize select -> custom sync
updateInnerCustomFromSelect();
updateOuterCustomFromSelect();

// Attach submit handler (guarded)
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("lift form submitted");
    calculateLift();
  });
  console.log("submit handler attached for #liftForm");
} else {
  console.warn("Form #liftForm not found - submit handler not attached");
}
