//map.js

// ============================================================
// Drone presets
// Values are manufacturer maximum/reference speeds in m/s.
// ============================================================

const DRONE_PRESETS = {
  mavic3classic: {
    hor: 21,
    asc: 8,
    des: 6
  },

  air3: {
    hor: 21,
    asc: 10,
    des: 10
  },

  air3s: {
    hor: 21,
    asc: 10,
    des: 10
  },

  mini4pro: {
    hor: 16,
    asc: 5,
    des: 5
  },

  avata: {
    hor: 14,
    asc: 6,
    des: 6
  }
};


// ============================================================
// Apply selected drone preset
// ============================================================

function applyDronePreset() {

  const model = document.getElementById('droneModel');

  if (!model) return;

  const preset = DRONE_PRESETS[model.value];

  const custom = model.value === 'custom';

  ['hor', 'asc', 'des'].forEach(id => {

    const el = document.getElementById(id);

    if (el) {
      el.disabled = !custom;
    }

  });

  if (preset) {

    const hor = document.getElementById('hor');
    const asc = document.getElementById('asc');
    const des = document.getElementById('des');

    if (hor) hor.value = preset.hor;
    if (asc) asc.value = preset.asc;
    if (des) des.value = preset.des;

  }

}


// ============================================================
// Initialize drone selector
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  const model = document.getElementById('droneModel');

  if (model) {

    model.addEventListener('change', applyDronePreset);

    applyDronePreset();

  }

});


// ============================================================
// Global variables
// ============================================================

var marker = 0;

var lat1, lat2, lng1, lng2;

var marker1, marker2, label1, label2;

var considerBuildings = true;

var maxBuildingHeight = 0;


// ============================================================
// Move map to location
// ============================================================

function moveToLocation(lat, lng) {

  map.setView([lat, lng], 14);

  setstartloc(lat, lng);

}


// ============================================================
// Set start location
// ============================================================

function setstartloc(lat, long) {

  if (marker === 0) {

    marker = 1;

    marker1 = new L.marker(
      coords = [lat, long],
      {
        draggable: true,
        autoPan: true
      }
    ).addTo(map);

    marker1.bindTooltip("Start");

    markerLocation(1, marker1);

    marker1.on('dragend', function (event) {

      markerLocation(1, marker1);

    });

  }

}


// ============================================================
// Get marker location
// ============================================================

function markerLocation(sd, mark) {

  if (sd === 1) {

    var currentLocation = mark.getLatLng();

    lat1 = currentLocation.lat;

    lng1 = currentLocation.lng;

  }

  else {

    var currentLocation = mark.getLatLng();

    lat2 = currentLocation.lat;

    lng2 = currentLocation.lng;

  }

}


// ============================================================
// Distance between two coordinates
// ============================================================

function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {

  var R = 6371;

  var dLat = deg2rad(lat2 - lat1);

  var dLon = deg2rad(lon2 - lon1);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  var c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  var d = R * c * 1000;

  return d;

}


// ============================================================
// Degrees to radians
// ============================================================

function deg2rad(deg) {

  return deg * (Math.PI / 180);

}


// ============================================================
// Drift calculation placeholder
// ============================================================

function drift() {

  // from Observing Boundary-Layer Winds from Hot-Air Balloon Flights 2016

  // Cd = drone drag coefficient
  // rho = air density
  // A = drone frontal/side area
  // m = drone mass

  // a = Cd * rho * A / 2m

  // v0 = relative speed at t=0

  // v(t) = 1 / (a*t + (1/v0))

}


// ============================================================
// Loading indicator
// ============================================================

function showLoading(show) {

  const loader =
    document.getElementById('loadingIndicator');

  if (loader) {

    loader.style.display =
      show ? 'block' : 'none';

  }

}


// ============================================================
// Error message
// ============================================================

function showError(message) {

  const errorDiv =
    document.getElementById('errorMessage');

  if (errorDiv) {

    errorDiv.innerHTML =
      `<b style="color: red;">⚠️ שגיאה:</b> ${message}`;

    errorDiv.style.display = 'block';

  }

}


// ============================================================
// Clear error
// ============================================================

function clearError() {

  const errorDiv =
    document.getElementById('errorMessage');

  if (errorDiv) {

    errorDiv.innerHTML = '';

    errorDiv.style.display = 'none';

  }

}


// ============================================================
// Fetch building data from OpenStreetMap / Overpass
// ============================================================

async function fetchBuildingsData(
  lat1,
  lon1,
  lat2,
  lon2
) {

  try {

    const minLat =
      Math.min(lat1, lat2);

    const maxLat =
      Math.max(lat1, lat2);

    const minLon =
      Math.min(lon1, lon2);

    const maxLon =
      Math.max(lon1, lon2);


    // Small margin around the route

    const margin = 0.001;


    const bbox =
      `${minLat - margin},${minLon - margin},${maxLat + margin},${maxLon + margin}`;


    const overpassQuery =
      `[out:json];(way["building"](${bbox});relation["building"](${bbox}););out geom(25);`;


    const controller =
      new AbortController();


    const timeoutId =
      setTimeout(
        () => controller.abort(),
        10000
      );


    const response =
      await fetch(
        'https://overpass-api.de/api/interpreter',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded'
          },

          body:
            `data=${encodeURIComponent(overpassQuery)}`,

          signal: controller.signal
        }
      );


    clearTimeout(timeoutId);


    if (!response.ok) {

      throw new Error(
        `Overpass API error: ${response.status} ${response.statusText}`
      );

    }


    const data =
      await response.json();


    if (data.error) {

      throw new Error(
        `Overpass error: ${data.error.message}`
      );

    }


    let maxHeight = 0;


    if (data.elements) {

      data.elements.forEach(element => {

        if (
          element.tags &&
          element.tags.height
        ) {

          const heightStr =
            String(
              element.tags.height
            ).match(/[\d.]+/);


          if (heightStr) {

            const height =
              parseFloat(heightStr[0]);


            if (height > maxHeight) {

              maxHeight = height;

            }

          }

        }

      });

    }


    return maxHeight;

  }


  catch (error) {

    if (error.name === 'AbortError') {

      console.warn(
        'Overpass API timeout - continuing without building data'
      );

      showError(
        'לא ניתן להתחבר ל-Overpass API (timeout). הטיסה תתוכנן עם מינימום 20 מטר.'
      );

    }


    else {

      console.warn(
        'שגיאה בשליפת נתוני מבנים:',
        error
      );

      showError(
        `לא ניתן לשלוף נתוני מבנים: ${error.message}. הטיסה תתוכנן עם מינימום 20 מטר.`
      );

    }


    return 0;

  }

}


// ============================================================
// Get weather data from Open-Meteo
// ============================================================

async function getJSON() {

  const apiUrl =
    'https://api.open-meteo.com/v1/forecast?' +
    'latitude=' + lat1 +
    '&longitude=' + lng1 +
    '&hourly=' +
    'wind_speed_10m,' +
    'wind_speed_80m,' +
    'wind_speed_120m,' +
    'wind_speed_180m,' +
    'wind_direction_10m,' +
    'wind_direction_80m,' +
    'wind_direction_120m,' +
    'wind_direction_180m,' +
    'precipitation_probability,' +
    'precipitation,' +
    'visibility' +
    '&temperature_unit=celsius' +
    '&wind_speed_unit=kmh' +
    '&precipitation_unit=mm' +
    '&timezone=auto';


  const response =
    await fetch(apiUrl);


  if (!response.ok) {

    throw new Error(
      `Weather API error: ${response.status}`
    );

  }


  return await response.json();

}


// ============================================================
// Main route / altitude calculation
// ============================================================

async function calcHeight() {

  clearError();

  showLoading(true);


  // Need at least a start marker

  if (marker === 0) {

    window.alert(
      'Please choose location'
    );

    showLoading(false);

    return;

  }


  try {

    // --------------------------------------------------------
    // Building information
    // --------------------------------------------------------

    if (considerBuildings) {

      maxBuildingHeight =
        await fetchBuildingsData(
          lat1,
          lng1,
          lat2,
          lng2
        );

    }

    else {

      maxBuildingHeight = 0;

    }


    // --------------------------------------------------------
    // Weather
    // --------------------------------------------------------

    const json =
      await getJSON();


    // --------------------------------------------------------
    // Determine current hour
    // --------------------------------------------------------

    const d = new Date();

    let hour =
      d.getUTCHours();


    // Protect against hour = 0

    if (hour < 1) {
      hour = 1;
    }


    const weatherIndex =
      hour - 1;


    // --------------------------------------------------------
    // Wind
    // --------------------------------------------------------

    ws10 =
      json.hourly.wind_speed_10m[weatherIndex] / 3.6;

    ws80 =
      json.hourly.wind_speed_80m[weatherIndex] / 3.6;

    ws120 =
      json.hourly.wind_speed_120m[weatherIndex] / 3.6;


    wd10 =
      json.hourly.wind_direction_10m[weatherIndex];

    wd80 =
      json.hourly.wind_direction_80m[weatherIndex];

    wd120 =
      json.hourly.wind_direction_120m[weatherIndex];


    precipitation_probability =
      json.hourly.precipitation_probability[
        weatherIndex
      ];


    precipitation =
      json.hourly.precipitation[
        weatherIndex
      ];


    visibility =
      json.hourly.visibility[
        weatherIndex
      ];


    // --------------------------------------------------------
    // If only one marker exists, destination = start
    // --------------------------------------------------------

    if (marker === 1) {

      lat2 = lat1;

      lng2 = lng1;

    }


    // --------------------------------------------------------
    // Coordinates
    // --------------------------------------------------------

    startlat = lat1;

    startlng = lng1;

    destlat = lat2;

    destlng = lng2;


    // --------------------------------------------------------
    // Direction
    // --------------------------------------------------------

    difflat =
      startlat - destlat;

    difflng =
      startlng - destlng;


    var dronedegrees =
      Math.atan2(
        difflng,
        difflat
      ) *
      180 /
      Math.PI;


    dronedegrees =
      (dronedegrees + 360) % 360;


    // --------------------------------------------------------
    // Distance
    // --------------------------------------------------------

    dist =
      getDistanceFromLatLon(
        startlat,
        startlng,
        destlat,
        destlng
      );


    // --------------------------------------------------------
    // Drone speed
    // --------------------------------------------------------

    const payloadElement =
      document.getElementById('payload');

    const payloadBackElement =
      document.getElementById('payloadback');

    const horElement =
      document.getElementById('hor');

    const ascElement =
      document.getElementById('asc');

    const desElement =
      document.getElementById('des');

    const dragElement =
      document.getElementById('drag');


    const payload =
      parseFloat(
        payloadElement.value
      );


    const payloadback =
      parseFloat(
        payloadBackElement.value
      );


    const horizontalSpeed =
      parseFloat(
        horElement.value
      );


    const ascentSpeed =
      parseFloat(
        ascElement.value
      );


    const descentSpeed =
      parseFloat(
        desElement.value
      );


    drag =
      parseFloat(
        dragElement.value
      );


    if (
      !payload ||
      payload <= 0 ||
      !payloadback ||
      payloadback <= 0 ||
      !horizontalSpeed ||
      horizontalSpeed <= 0 ||
      !ascentSpeed ||
      ascentSpeed <= 0 ||
      !descentSpeed ||
      descentSpeed <= 0
    ) {

      throw new Error(
        'Please enter valid drone and payload parameters.'
      );

    }


    speedup =
      ascentSpeed / payload;

    speeddown =
      descentSpeed / payload;

    speedhorizontal =
      horizontalSpeed / payload;


    speedupback =
      ascentSpeed / payloadback;

    speeddownback =
      descentSpeed / payloadback;

    speedhorizontalback =
      horizontalSpeed / payloadback;


    // --------------------------------------------------------
    // Minimum safe altitude
    // --------------------------------------------------------

    const minHeight =
      Math.max(
        20,
        maxBuildingHeight + 20
      );


    // --------------------------------------------------------
    // Candidate altitudes
    // --------------------------------------------------------

    heights = [];


    heights.push(minHeight);


    for (
      let h = Math.ceil(minHeight / 10) * 10 + 10;
      h <= 120;
      h += 10
    ) {

      heights.push(h);

    }


    // Remove duplicate values

    heights =
      [...new Set(heights)];


    // --------------------------------------------------------
    // Arrays
    // --------------------------------------------------------

    ws = [];

    wd = [];

    timeupdown = [];

    timeupdownback = [];

    timehor = [];

    timehorb = [];


    // --------------------------------------------------------
    // Calculate travel time for every altitude
    // --------------------------------------------------------

    for (
      let i = 0;
      i < heights.length;
      i++
    ) {

      const height =
        heights[i];


      // ------------------------------------------------------
      // Wind interpolation
      // ------------------------------------------------------

      if (height < 80) {

        ws[i] =
          ws10 *
            (80 - height) / 70 +
          ws80 *
            (height - 10) / 70;


        wd[i] =
          wd10 *
            (80 - height) / 70 +
          wd80 *
            (height - 10) / 70;

      }


      else if (height === 80) {

        ws[i] = ws80;

        wd[i] = wd80;

      }


      else if (height === 120) {

        ws[i] = ws120;

        wd[i] = wd120;

      }


      else {

        ws[i] =
          ws80 *
            (120 - height) / 40 +
          ws120 *
            (height - 80) / 40;


        wd[i] =
          wd80 *
            (120 - height) / 40 +
          wd120 *
            (height - 80) / 40;

      }


      // ------------------------------------------------------
      // Vertical flight time
      // ------------------------------------------------------

      timeupdown[i] =
        (height / speedup) +
        (height / speeddown);


      timeupdownback[i] =
        (height / speedupback) +
        (height / speeddownback);


      // ------------------------------------------------------
      // Wind direction relative to flight direction
      // ------------------------------------------------------

      const diffangle =
        (wd[i] - dronedegrees) /
        180 *
        Math.PI;


      const angle =
        Math.cos(diffangle) *
        drag;


      // ------------------------------------------------------
      // Horizontal flight time
      // ------------------------------------------------------

      let forwardGroundSpeed =
        speedhorizontal +
        ws[i] * angle;


      let returnGroundSpeed =
        speedhorizontalback -
        ws[i] * angle;


      // Prevent zero/negative ground speed

      if (forwardGroundSpeed <= 0) {

        forwardGroundSpeed = 0.1;

      }


      if (returnGroundSpeed <= 0) {

        returnGroundSpeed = 0.1;

      }


      timehor[i] =
        dist /
        forwardGroundSpeed;


      timehorb[i] =
        dist /
        returnGroundSpeed;

    }


    // --------------------------------------------------------
    // Find optimal forward altitude
    // --------------------------------------------------------

    minhor = 0;

    minhorb = 0;


    for (
      let i = 0;
      i < heights.length;
      i++
    ) {

      if (
        timeupdown[i] +
        timehor[i] <
        timeupdown[minhor] +
        timehor[minhor]
      ) {

        minhor = i;

      }


      if (
        timeupdownback[i] +
        timehorb[i] <
        timeupdownback[minhorb] +
        timehorb[minhorb]
      ) {

        minhorb = i;

      }

    }


    // --------------------------------------------------------
    // Display results
    // --------------------------------------------------------

    const tofixed = 0;


    document.getElementById(
      'heightfore'
    ).innerHTML =
      heights[minhor].toFixed(tofixed);


    document.getElementById(
      'heightback'
    ).innerHTML =
      heights[minhorb].toFixed(tofixed);


    document.getElementById(
      'distance'
    ).innerHTML =
      dist.toFixed(tofixed);


    document.getElementById(
      'dronedir'
    ).innerHTML =
      dronedegrees.toFixed(tofixed);


    // --------------------------------------------------------
    // No-wind travel time
    // --------------------------------------------------------

    document.getElementById(
      'timenowind'
    ).innerHTML =
      (
        timeupdown[0] +
        timeupdownback[0] +
        dist / speedhorizontal +
        dist / speedhorizontalback
      ).toFixed(tofixed);


    // --------------------------------------------------------
    // Find values at 20m / minimum altitude
    // --------------------------------------------------------

    const baseIndex = 0;


    // Find closest altitude to 80m

    let index80 =
      heights.findIndex(
        h => h === 80
      );


    if (index80 === -1) {

      index80 =
        heights.reduce(
          (best, h, i) =>
            Math.abs(h - 80) <
            Math.abs(
              heights[best] - 80
            )
              ? i
              : best,
          0
        );

    }


    // Find closest altitude to 120m

    let index120 =
      heights.findIndex(
        h => h === 120
      );


    if (index120 === -1) {

      index120 =
        heights.length - 1;

    }


    document.getElementById(
      'ws20'
    ).innerHTML =
      ws[baseIndex].toFixed(1);


    document.getElementById(
      'ws80'
    ).innerHTML =
      ws[index80].toFixed(1);


    document.getElementById(
      'ws120'
    ).innerHTML =
      ws[index120].toFixed(1);


    document.getElementById(
      'wd20'
    ).innerHTML =
      wd[baseIndex].toFixed(0);


    document.getElementById(
      'wd80'
    ).innerHTML =
      wd[index80].toFixed(0);


    document.getElementById(
      'wd120'
    ).innerHTML =
      wd[index120].toFixed(0);


    // --------------------------------------------------------
    // Travel times at minimum altitude
    // --------------------------------------------------------

    document.getElementById(
      'timefore20'
    ).innerHTML =
      (
        timeupdown[baseIndex] +
        timehor[baseIndex]
      ).toFixed(tofixed);


    document.getElementById(
      'timeback20'
    ).innerHTML =
      (
        timeupdownback[baseIndex] +
        timehorb[baseIndex]
      ).toFixed(tofixed);


    // --------------------------------------------------------
    // Travel times at 80m
    // --------------------------------------------------------

    document.getElementById(
      'timefore80'
    ).innerHTML =
      (
        timeupdown[index80] +
        timehor[index80]
      ).toFixed(tofixed);


    document.getElementById(
      'timeback80'
    ).innerHTML =
      (
        timeupdownback[index80] +
        timehorb[index80]
      ).toFixed(tofixed);


    // --------------------------------------------------------
    // Travel times at 120m
    // --------------------------------------------------------

    document.getElementById(
      'timefore120'
    ).innerHTML =
      (
        timeupdown[index120] +
        timehor[index120]
      ).toFixed(tofixed);


    document.getElementById(
      'timeback120'
    ).innerHTML =
      (
        timeupdownback[index120] +
        timehorb[index120]
      ).toFixed(tofixed);


    // --------------------------------------------------------
    // Total travel time
    // --------------------------------------------------------

    travel20 =
      timeupdown[baseIndex] +
      timeupdownback[baseIndex] +
      timehor[baseIndex] +
      timehorb[baseIndex];


    travelopt =
      timeupdown[minhor] +
      timehor[minhor] +
      timeupdownback[minhorb] +
      timehorb[minhorb];


    // --------------------------------------------------------
    // Time saved
    // --------------------------------------------------------

    document.getElementById(
      'savesec'
    ).innerHTML =
      (
        travel20 -
        travelopt
      ).toFixed(2);


    document.getElementById(
      'totaltime20'
    ).innerHTML =
      travel20.toFixed(tofixed);


    document.getElementById(
      'savepercent'
    ).innerHTML =
      "(" +
      (
        (travel20 - travelopt) /
        travel20 *
        100
      ).toFixed(2) +
      "%)";


    // --------------------------------------------------------
    // Weather display
    // --------------------------------------------------------

    document.getElementById(
      'visibility'
    ).innerHTML =
      (
        visibility / 1000
      ).toFixed(0);


    document.getElementById(
      'precipitation'
    ).innerHTML =
      precipitation.toFixed(1);


    document.getElementById(
      'precipitation_probability'
    ).innerHTML =
      precipitation_probability.toFixed(0);


    // --------------------------------------------------------
    // Building information
    // --------------------------------------------------------

    const buildingInfoDiv =
      document.getElementById(
        'buildingInfo'
      );


    if (
      buildingInfoDiv &&
      considerBuildings
    ) {

      if (
        maxBuildingHeight > 0
      ) {

        buildingInfoDiv.innerHTML =
          `<br><b>מידע מבנים:</b> ` +
          `גובה המבנה הגבוה ביותר: ` +
          `${maxBuildingHeight.toFixed(1)}m, ` +
          `גובה מינימום הטיסה המומלץ: ` +
          `${minHeight}m`;

      }

      else {

        buildingInfoDiv.innerHTML =
          `<br><b>מידע מבנים:</b> ` +
          `לא נמצאו מבנים בטווח. ` +
          `גובה מינימום הטיסה: 20m`;

      }

    }


    // --------------------------------------------------------
    // Show result
    // --------------------------------------------------------

    document.getElementById(
      'result'
    ).style.display = 'block';


  }


  catch (error) {

    console.error(
      'שגיאה בחישוב:',
      error
    );


    showError(
      `שגיאה במהלך החישוב: ${error.message}`
    );

  }


  finally {

    showLoading(false);

  }

}


// ============================================================
// Public function called by HTML button
// ============================================================

window.getHeight = function () {

  console.log(
    'getHeight called'
  );

  calcHeight();

};


// ============================================================
// Initialize Leaflet map
// ============================================================

const map =
  L.map('map').setView(
    [
      40.375540905462294,
      -74.601920573035
    ],
    14
  );


// ============================================================
// Satellite map
// ============================================================

const tiles =
  L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    {
      maxZoom: 20,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',

      subdomains: [
        'mt0',
        'mt1',
        'mt2',
        'mt3'
      ]
    }
  ).addTo(map);


map.attributionControl.setPrefix(
  'Google map image'
);


// ============================================================
// Map click
// ============================================================

map.on(
  'click',
  addMarker
);


// ============================================================
// Add start / destination marker
// ============================================================

function addMarker(e) {

  // ----------------------------------------------------------
  // First click = start
  // ----------------------------------------------------------

  if (marker === 0) {

    marker = 1;


    marker1 =
      new L.marker(
        coords = e.latlng,
        {
          draggable: true,
          autoPan: true,
          color: 'car'
        }
      ).addTo(map);


    marker1.bindTooltip(
      "Start"
    );


    markerLocation(
      1,
      marker1
    );


    marker1.on(
      'dragend',
      function (event) {

        markerLocation(
          1,
          marker1
        );

      }
    );

  }


  // ----------------------------------------------------------
  // Second click = destination
  // ----------------------------------------------------------

  else if (marker === 1) {

    marker = 2;


    marker2 =
      new L.marker(
        coords = e.latlng,
        {
          draggable: true,
          autoPan: true
        }
      ).addTo(map);


    marker2.bindTooltip(
      "Destination"
    );


    markerLocation(
      2,
      marker2
    );


    marker2.on(
      'dragend',
      function (event) {

        markerLocation(
          2,
          marker2
        );

      }
    );

  }


  // ----------------------------------------------------------
  // Further clicks move destination
  // ----------------------------------------------------------

  else {

    var lat =
      e.latlng.lat;

    var lng =
      e.latlng.lng;


    var newLatLng =
      new L.LatLng(
        lat,
        lng
      );


    marker2.setLatLng(
      newLatLng
    );


    markerLocation(
      2,
      marker2
    );

  }

}
