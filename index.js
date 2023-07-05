const measurementKindSeconds = "Seconds";
const measurementKindAperture = "Aperture";
const measurementKindISO = "ISO";
const measurementKinds = [ measurementKindSeconds, measurementKindAperture, measurementKindISO ];

const allShutterValues = [
  "32",
  "16",
  "8",
  "4",
  "2",
  "1",
  "1/2",
  "1/4",
  "1/8",
  "1/15",
  "1/30",
  "1/60",
  "1/125",
  "1/250",
  "1/500",
  "1/1000",
  "1/2000",
  "1/4000",
  "1/8000",
  "1/16000",
  "1/32000",
];

const allApertureValues = [
  "0.5",
  "0.7",
  "1",
  "1.4",
  "2",
  "2.8",
  "4",
  "5.6",
  "8",
  "11",
  "16",
  "22",
  "32",
  "45",
  "64",
  "90",
  "128",
  "180",
  "256",
];

const allISOValues = [
  "102400",
  "51200",
  "25600",
  "12800",
  "6400",
  "3200",
  "1600",
  "800",
  "400",
  "200",
  "100",
  "50",
  "25"
];

const zonesTooltips = [
  "Pure black - no detail",
  "Near black, with slight tonality but no texture",
  "Textured black; the darkest part of the image in which slight detail is recorded",
  "Average dark materials and low values showing adequate texture",
  "Average dark foliage, dark stone, or landscape shadows",
  "Middle gray: clear north sky; dark skin, average weathered wood",
  "Average Caucasian skin; light stone; shadows on snow in sunlit landscapes",
  "Very light skin; shadows in snow with acute side lighting",
  "Lightest tone with texture: textured snow",
  "Slight tone without texture; glaring snow",
  "Pure white: light sources and specular reflections - paper white, no detail",
]

const config = {
  defaultShutter: "1/125",
  defaultAperture: "8",
  defaultISO: "100",
  maxNbMeasurements: 5,
  nbZones: 11,

  init() {
    this.grayIncrement = 255 / (this.nbZones-1);
    this.midpointPosition = Math.floor(this.nbZones / 2);
  }
}

const state = {
  elems: {
    userInputs: null,
    selectMeasurementKind: null,
    selectShutter: null,
    selectAperture: null,
    selectISO: null,
    zones: null,
    measurements: null
  },
  measurementKind: measurementKindSeconds,
  measurements: [],
  measurementsParsed: [],
  measurementsPositions: [],
  userShift: 0,

  init() {
    this.elems.userInputs = document.getElementById("user-inputs");
    this.elems.zones = document.getElementById("zones");
    this.elems.measurements = document.getElementById("measurements");
  },

  sortMeasurements() {
    this.measurements.sort((a, b) => {
      let aa = eval(a);
      let bb = eval(b);
      if (state.measurementKind === measurementKindAperture) {
        return aa - bb;
      }
      return bb - aa;
    });
    this.measurementsParsed.sort((a, b) => {
      if (state.measurementKind === measurementKindAperture) {
        return a - b;
      }
      return b - a;
    });
  },

  sortMeasurementsPositions() {
    this.measurementsPositions.sort((a, b) => {
      return a.position - b.position;
    });
  },

  computeMeasurementsPositions() {
    if (this.measurements.length == 0) {
      this.measurementsPositions = [];
      return
    }
    if (this.measurements.length == 1) {
      this.userShift = 0
      this.measurementsPositions = [{position: config.midpointPosition, value: this.measurements[0]}];
      return
    }
    this.sortMeasurements();

    let allValues = allShutterValues;
    if (state.measurementKind === measurementKindAperture) {
      allValues = allApertureValues;
    } else if (state.measurementKind === measurementKindISO) {
      allValues = allISOValues;
    }

    let globalPosDarkest = allValues.indexOf(this.measurements[0]);
    let globalPosBrightest = allValues.indexOf(this.measurements[this.measurements.length-1]);
    let meanDistanceDarkestToBrightest = Math.floor((globalPosBrightest-globalPosDarkest)/2);
    let globalPosMidpoint = globalPosDarkest+meanDistanceDarkestToBrightest;

    if (globalPosDarkest+this.userShift > globalPosMidpoint || globalPosBrightest+this.userShift < globalPosMidpoint) {
      this.userShift = 0;
    }

    let startPos = (config.midpointPosition - meanDistanceDarkestToBrightest)+this.userShift;
    let midpointIsMeasured = startPos == config.midpointPosition;
    this.measurementsPositions = [{ position: startPos, value: this.measurements[0] }];
    for (let i = 1; i < this.measurements.length; i++) {
      let globalPosPrev = allValues.indexOf(this.measurements[i-1]);
      let globalPosCurr = allValues.indexOf(this.measurements[i]);
      let gap = globalPosCurr - globalPosPrev;
      let prev = this.measurementsPositions[i-1]
      let curr = {position: prev.position+gap, value: this.measurements[i]}
      this.measurementsPositions.push(curr);
      if (curr.position == config.midpointPosition) {
        midpointIsMeasured = true;
      }
    }

    if (!midpointIsMeasured) {
      let midpoint = { position: config.midpointPosition, value: "-", computed: true };
      let globalPosMidpointShifted = globalPosMidpoint-this.userShift;
      if (globalPosMidpointShifted >= 0 && globalPosMidpointShifted < allValues.length) {
        midpoint.value = allValues[globalPosMidpoint-this.userShift];
      }
      this.measurementsPositions.push(midpoint);
    }

    this.sortMeasurementsPositions();
  },
}

function show(elem) {
  elem.classList.remove("hidden");
}

function hide(elem) {
  elem.classList.add("hidden");
}

window.addEventListener("load", (event) => {
  config.init();
  state.init();
  renderInitialUserInputs();
  renderInitialZonesAndMeasurements();
  document.addEventListener("click", (event) => {
    document.querySelectorAll('.tooltiptext').forEach(function(tooltipElem) {
      tooltipElem.classList.remove("visible");
    });
  });
  document.getElementById("loading").classList.add("hidden");
});

function renderInitialUserInputs() {
  renderInitialMeasurementsInput();
}

function renderInitialMeasurementsInput() {
  let measurementKindSelectAndLbl = createSelectElem(
    "select-measurement-kind", ["Seconds", "Aperture", "ISO"], "Seconds", "Measured values:", onSelectMeasurementKindChange);
  let shutterSelectAndLbl = createSelectElem(
    "select-measurement-speed", allShutterValues, config.defaultShutter, "", onSelectShutterChange);
  let apertureSelectAndLbl = createSelectElem(
    "select-measurement-aperture", allApertureValues, config.defaultAperture, "", onSelectApertureChange);
  let isoSelectAndLbl = createSelectElem(
      "select-measurement-iso", allISOValues, config.defaultISO, "", onSelectISOChange);

  let addBtn = createBtnElem(["add"], "&plus; Add", onAddBtnClick);
  let delBtn = createBtnElem(["del"], "&minus; Remove", onDelBtnClick);
  let delAllBtn = createBtnElem(["del-all"], "&#10005; Remove All", onDelAllBtnClick);
  let darkerBtn = createBtnElem(["darker"], "&#8679; Darker", onDarkerBtnClick);
  let lighterBtn = createBtnElem(["lighter"], "&#8681; Lighter", onLighterBtnClick);
  let resetShiftBtn = createBtnElem(["reset"], "&olarr; Reset", onResetShiftBtnClick);

  state.elems.userInputs.appendChild(measurementKindSelectAndLbl[1]);
  state.elems.userInputs.appendChild(measurementKindSelectAndLbl[0]);
  state.elems.selectMeasurementKind = measurementKindSelectAndLbl[0];

  state.elems.userInputs.appendChild(shutterSelectAndLbl[0]);
  state.elems.selectShutter = shutterSelectAndLbl[0];
  hide(apertureSelectAndLbl[0]);
  state.elems.userInputs.appendChild(apertureSelectAndLbl[0]);
  state.elems.selectAperture = apertureSelectAndLbl[0];
  hide(isoSelectAndLbl[0]);
  state.elems.userInputs.appendChild(isoSelectAndLbl[0]);
  state.elems.selectISO = isoSelectAndLbl[0];

  state.elems.userInputs.appendChild(addBtn);
  state.elems.userInputs.appendChild(delBtn);
  state.elems.userInputs.appendChild(delAllBtn);
  state.elems.userInputs.appendChild(darkerBtn);
  state.elems.userInputs.appendChild(lighterBtn);
  state.elems.userInputs.appendChild(resetShiftBtn);
}

function createSelectElem(id, values, selectedValue, label, listener) {
  let select = document.createElement("select");
  select.setAttribute("id", id);
  select.setAttribute("name", id);
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    let option = document.createElement("option");
    option.innerText = value;
    option.setAttribute("value", value);
    if (value == selectedValue) {
      option.setAttribute("selected", "selected");
    }
    select.appendChild(option);
  }

  if (listener != null) {
    select.addEventListener("change", listener);
  }

  let selectAndLabel = [select];

  if (label !== "") {
    let selectLabel = document.createElement("label");
    selectLabel.setAttribute("for", id);
    selectLabel.innerText = label;
    selectAndLabel.push(selectLabel);
  }

  return selectAndLabel;
}

function createBtnElem(classList, innerHTML, listener) {
  let btn = document.createElement("a");
  btn.setAttribute("href", "#");
  btn.classList.add("btn", ...classList);
  btn.innerHTML = innerHTML;
  btn.addEventListener("click", listener);
  return btn;
}

function renderInitialZonesAndMeasurements() {
  let minusZoneDiv = document.createElement("div");
  minusZoneDiv.innerText = "-0";
  minusZoneDiv.classList.add("outside-zone-minus");
  state.elems.zones.appendChild(minusZoneDiv);

  let plusZoneDiv = document.createElement("div");
  plusZoneDiv.innerText = "+0";
  plusZoneDiv.classList.add("outside-zone-plus");

  let minusMeasurementDiv = document.createElement("div");
  state.elems.measurements.appendChild(minusMeasurementDiv);
  let plusMeasurementDiv = document.createElement("div");

  for (let zone = 0; zone < config.nbZones; zone++) {
    let shade = config.grayIncrement * zone;
    let backgroundColor = "rgb("+shade+", "+shade+", "+shade+")";
    let color = "white";
    if (zone > config.midpointPosition) {
      color = "black";
    }

    let zoneDiv = document.createElement("div");
    let measurementDiv = document.createElement("div");
    zoneDiv.innerText = zone;
    zoneDiv.style.backgroundColor = backgroundColor;
    zoneDiv.style.color = color;
    zoneDiv.classList.add("tooltip");
    switch (zone) {
      case 0:
        zoneDiv.classList.add("min");
        measurementDiv.classList.add("min");
        break;
      case 1:
        zoneDiv.classList.add("almost-min");
        measurementDiv.classList.add("almost-min");
        break;
      case config.midpointPosition:
        zoneDiv.classList.add("midpoint");
        measurementDiv.classList.add("midpoint");
        break;
      case config.nbZones-2:
        zoneDiv.classList.add("almost-max");
        measurementDiv.classList.add("almost-max");
        break;
      case config.nbZones-1:
        zoneDiv.classList.add("max");
        measurementDiv.classList.add("max");
        break;
    }

    let zoneTooltip = document.createElement("span");
    zoneTooltip.innerText = zonesTooltips[zone];
    zoneTooltip.classList.add("tooltiptext");
    zoneDiv.appendChild(zoneTooltip);
    zoneDiv.addEventListener("click", onZoneClick);
    zoneTooltip.addEventListener("click", onZoneTooltipClick);

    state.elems.zones.appendChild(zoneDiv);
    state.elems.zones.appendChild(plusZoneDiv);
    state.elems.measurements.appendChild(measurementDiv);
    state.elems.measurements.appendChild(plusMeasurementDiv);
  }
}

function onZoneClick(event) {
  event.preventDefault();
  event.stopPropagation();
  document.querySelectorAll('.tooltiptext').forEach(function(tooltipElem) {
    if (!event.target.children[0].isEqualNode(tooltipElem)) {
      tooltipElem.classList.remove("visible");
    }
  });
  event.target.children[0].classList.toggle("visible");
}

function onZoneTooltipClick(event) {
  event.preventDefault();
  event.stopPropagation();
  document.querySelectorAll('.tooltiptext').forEach(function(tooltipElem) {
    if (!event.target.isEqualNode(tooltipElem)) {
      tooltipElem.classList.remove("visible");
    }
  });
  event.target.classList.toggle("visible");
}

function renderMeasurementsPositions() {
  for (var i = 0; i < state.elems.measurements.children.length; i++) {
    let child = state.elems.measurements.children[i];
    child.innerText = "";
    child.classList.remove("measured");
  }

  // find midpoint
  let midpointIndex = -1;
  for (let i = 0; i < state.measurementsPositions.length; i++) {
    if (state.measurementsPositions[i].position == config.midpointPosition) {
      midpointIndex = i;
      break
    }
  }
  if (state.measurementsPositions.length > 0 && midpointIndex < 0) {
    alert("Logic error! Report it to the developer by sending an email to ogg@purecore.ro");
    return
  }

  // render darks
  let underexposed = false;
  for (let i = midpointIndex; i >= 0; i--) {
    let underexposure = 0;
    let pos = state.measurementsPositions[i].position;
    if (pos < 0) {
      underexposure = pos;
      pos = -1;
    }
    let measurementElem = state.elems.measurements.children[pos+1];
    measurementElem.innerText = state.measurementsPositions[i].value;
    if (i != midpointIndex || !state.measurementsPositions[i].computed) {
      measurementElem.classList.add("measured");
      measurementElem.addEventListener("click", onMeasurementClick);
    }
    if (underexposure < 0) {
      let zoneElem = state.elems.zones.children[pos+1];
      zoneElem.innerText = underexposure;
      underexposed = true;
      break;
    }
  }
  if (underexposed == 0) {
    state.elems.zones.children[0].innerText = "-0";
  }

  // render lights
  let overexposed = false;
  for (let i = midpointIndex+1; i < state.measurementsPositions.length; i++) {
    let overexposure = 0;
    let pos = state.measurementsPositions[i].position;
    if (pos >= config.nbZones) {
      overexposure = pos-(config.nbZones-1);
      pos = config.nbZones;
    }
    let measurementElem = state.elems.measurements.children[pos+1];
    measurementElem.innerText = state.measurementsPositions[i].value;
    measurementElem.classList.add("measured");
    measurementElem.addEventListener("click", onMeasurementClick);
    if (overexposure > 0) {
      let zoneElem = state.elems.zones.children[pos+1];
      zoneElem.innerText = "+" + overexposure;
      overexposed = true;
      break;
    }
  }
  if (overexposed == 0) {
    state.elems.zones.children[state.elems.zones.children.length-1].innerText = "+0";
  }
}

function delAllMeasurements() {
  state.measurements = [];
  state.measurementsParsed = [];
  state.userShift = 0;
  state.computeMeasurementsPositions();
  renderMeasurementsPositions();
}

function onSelectMeasurementKindChange(event) {
  let prevMeasurementKind = state.measurementKind;
  let newMeasurementKind = state.elems.selectMeasurementKind.value;
  if (newMeasurementKind === prevMeasurementKind) {
    return
  }

  delAllMeasurements();

  let elemToHide = state.elems.selectShutter;
  if (prevMeasurementKind === measurementKindAperture) {
    elemToHide = state.elems.selectAperture;
  } else if (prevMeasurementKind === measurementKindISO) {
    elemToHide = state.elems.selectISO;
  }
  hide(elemToHide);

  let elemToShow = state.elems.selectShutter;
  if (newMeasurementKind === measurementKindAperture) {
    elemToShow = state.elems.selectAperture;
  } else if (newMeasurementKind === measurementKindISO) {
    elemToShow = state.elems.selectISO;
  }
  show(elemToShow);

  state.measurementKind = newMeasurementKind;
}

function onSelectShutterChange(event) {
  addMeasurement();
};
function onSelectApertureChange(event) {
  addMeasurement();
};
function onSelectISOChange(event) {
  addMeasurement();
};

function onAddBtnClick(event) {
  event.preventDefault();
  addMeasurement();
}

function addMeasurement() {
  let measurement = state.elems.selectShutter.value;
  if (state.measurementKind === measurementKindAperture) {
    measurement = state.elems.selectAperture.value;
  } else if (state.measurementKind === measurementKindISO) {
    measurement = state.elems.selectISO.value;
  }
  if (state.measurements.indexOf(measurement) >= 0) {
    return
  }
  if (state.measurements.length == config.maxNbMeasurements) {
    alert("Maximum " + config.maxNbMeasurements + " measurements.");
    return
  }

  state.measurements.push(measurement);
  state.measurementsParsed.push(eval(measurement));
  state.computeMeasurementsPositions();
  renderMeasurementsPositions();
}

function onDelBtnClick(event) {
  event.preventDefault();
  let measurement = state.elems.selectShutter.value;
  if (state.measurementKind === measurementKindAperture) {
    measurement = state.elems.selectAperture.value;
  } else if (state.measurementKind === measurementKindISO) {
    measurement = state.elems.selectISO.value;
  }
  removeMeasurement(measurement);
}

function onMeasurementClick(event) {
  event.preventDefault();
  removeMeasurement(this.innerText);
}

function removeMeasurement(measurement) {
  if (state.measurements.length == 0) {
    return
  }
  let measurementIndex = state.measurements.indexOf(measurement);
  if (measurementIndex < 0) {
    return
  }

  state.measurements.splice(measurementIndex, 1);
  state.measurementsParsed.splice(eval(measurement), 1);
  state.computeMeasurementsPositions();
  renderMeasurementsPositions();
}

function onDelAllBtnClick(event) {
  event.preventDefault();
  delAllMeasurements();
}

function onDarkerBtnClick(event) {
  event.preventDefault();
  if (state.measurementsPositions.length == 0) {
    return
  }
  if (state.measurementsPositions[state.measurementsPositions.length-1].position-1 < config.midpointPosition) {
    alert("The brightest measured area would become darker than middle zone.");
    return
  }
  state.userShift--;
  state.computeMeasurementsPositions();
  renderMeasurementsPositions();
}

function onLighterBtnClick(event) {
  event.preventDefault();
  if (state.measurementsPositions.length == 0) {
    return
  }
  if (state.measurementsPositions[0].position+1 > config.midpointPosition) {
    alert("The darkest measured area would become brighter than middle zone.");
    return
  }
  state.userShift++;
  state.computeMeasurementsPositions();
  renderMeasurementsPositions();
}

function onResetShiftBtnClick(event) {
  event.preventDefault();
  if (state.userShift == 0) {
    return
  }
  state.userShift = 0;
  state.computeMeasurementsPositions();
  renderMeasurementsPositions();
}
