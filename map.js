//map.js

// todo:
// if choose start and than use GPs it makes two start marker
// before calculate height test if there is start and destination
// change minimum height to be 20m
// tell the user, how much he will save if he fly at 20m, 120m
// let the user decide horizontal and vertical UAV speed


// Popular drone presets. Values are manufacturer maximum speeds; the calculator uses them as reference inputs.
const DRONE_PRESETS = {
  mavic3classic: { hor: 21, asc: 8, des: 6 },
  air3: { hor: 21, asc: 10, des: 10 },
  air3s: { hor: 21, asc: 10, des: 10 },
  mini4pro: { hor: 16, asc: 5, des: 5 },
  avata: { hor: 14, asc: 6, des: 6 }
};

function applyDronePreset() {
  const model = document.getElementById('droneModel');
  if (!model) return;

  const preset = DRONE_PRESETS[model.value];
  const custom = model.value === 'custom';

  ['hor','asc','des'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !custom;
  });

  if (preset) {
    document.getElementById('hor').value = preset.hor;
    document.getElementById('asc').value = preset.asc;
    document.getElementById('des').value = preset.des;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const model = document.getElementById('droneModel');

  if (model) {
    model.addEventListener('change', applyDronePreset);
    applyDronePreset();
  }
});


// Set up some of our variables.
// var map; // Will contain map object.

var marker = 0; // Has the user plotted their location marker?
var lat1, lat2, lng1, lng2;
var marker1, marker2, label1, label2;

var considerBuildings = true; // Default flag for building checks
var maxBuildingHeight = 0; // Highest building height in range


// Function called to initialize / create the map.
// This is called when the page has loaded.

function moveToLocation(lat, lng) {
  map.setView([lat, lng], 14);
  setstartloc(lat, lng);
}

function setstartloc(lat, long) {

  if (marker === 0) { // new marker

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

    // Listen for drag events!
    marker1.on('dragend', function(event) {
      markerLocation(1, marker1);
    });
  }
}


// This function will get the marker's current location and then add the lat/long
// values to our textfields so that we can save the location.

function markerLocation(sd, mark) {

  // Get location.

  if (sd === 1) {

    var currentLocation = mark.getLatLng();

    lat1 = currentLocation.lat;
    lng1 = currentLocation.lng;

  } else {

    var currentLocation = mark.getLatLng();

    lat2 = currentLocation.lat;
    lng2 = currentLocation.lng;
  }
}


function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {

  var R = 6371; // Radius of the earth in km

  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  var d = R * c * 1000; // Distance in m

  return d;
}


function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


function drift() {

  // from Observing Boundary-Layer Winds from Hot-Air Balloon Flights 2016
  // Cd is the drone drag coefficient
  // rho is the air density (kg/m^3)
  // A is the drone area when looking from the side (m^2)
  // m is the drone mass (kg)
  // a = cd*rho*A/2m
  // v0 is the relative speed at t=0
  // v(t) = 1 / (a*t+(1/v0))

}


// Show/hide loading indicator

function showLoading(show) {

  const loader = document.getElementById('loadingIndicator');

  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}


// Show error messages

function showError(message) {

  const errorDiv = document.getElementById('errorMessage');

  if (errorDiv) {

    errorDiv.innerHTML =
      `<b style="color: red;">⚠️ Error:</b> ${message}`;

    errorDiv.style.display = 'block';
  }
}


// Clear error messages

function clearError() {

  const errorDiv = document.getElementById('errorMessage');

  if (errorDiv) {

    errorDiv.innerHTML = '';
    errorDiv.style.display = 'none';
  }
}


// Fetch building data from Overpass API

async function fetchBuildingsData(lat1, lon1, lat2, lon2) {

  try {

    // Calculate the bounding box

    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLon = Math.min(lon1, lon2);
    const maxLon = Math.max(lon1, lon2);

    // Add a small margin around the bounding box

    const margin = 0.001;

    const bbox =
      `${minLat - margin},${minLon - margin},${maxLat + margin},${maxLon + margin}`;

    // Overpass API query - retrieve building heights only

    const overpassQuery =
      `[out:json];(way["building"](${bbox});relation["building"](${bbox}););out geom(25);`;

    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      10000
    );

    const response = await fetch(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Overpass API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Check for an API error

    if (data.error) {
      throw new Error(
        `Overpass error: ${data.error.message}`
      );
    }

    // Find the highest building

    let maxHeight = 0;

    if (data.elements) {

      data.elements.forEach(element => {

        if (element.tags && element.tags.height) {

          // Convert height to a numeric value

          const heightStr =
            String(element.tags.height).match(/[\d.]+/);

          if (heightStr) {

            const height = parseFloat(heightStr[0]);

            if (height > maxHeight) {
              maxHeight = height;
            }
          }
        }
      });
    }

    return maxHeight;

  } catch (error) {

    // On timeout or connection errors, continue without building data

    if (error.name === 'AbortError') {

      console.warn(
        'Overpass API timeout - continuing without building data'
      );

      showError(
        'Unable to connect to the Overpass API (timeout). The route will be planned with a minimum altitude of 20 m.'
      );

    } else {

      console.warn(
        'Error fetching building data:',
        error
      );

      showError(
        `Unable to retrieve building data: ${error.message}. The route will be planned with a minimum altitude of 20 m.`
      );
    }

    return 0;
  }
}


async function getJSON() {

  const apiUrl =
    'https://api.open-meteo.com/v1/forecast?latitude=' +
    lat1 +
    '&longitude=' +
    lng1 +
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

  return fetch(apiUrl)
    .then((response) => response.json())
    .then((responseJson) => {
      return responseJson;
    });
}


async function calcHeight() {

  clearError();
  showLoading(true);

  if (marker == 0) {

    window.alert('Please choose a start location.');

    showLoading(false);

    return;
  }

  try {

    // Fetch building data if enabled

    if (considerBuildings) {

      maxBuildingHeight =
        await fetchBuildingsData(
          lat1,
          lng1,
          lat2,
          lng2
        );

    } else {

      maxBuildingHeight = 0;
    }


    const json = await this.getJSON();


    const d = new Date();

    let hour = d.getUTCHours();

    var mydata =
      JSON.stringify(json, null, 2);


    ws10 =
      json.hourly.wind_speed_10m[hour - 1] / 3.6;

    ws80 =
      json.hourly.wind_speed_80m[hour - 1] / 3.6;

    ws120 =
      json.hourly.wind_speed_120m[hour - 1] / 3.6;


    wd10 =
      json.hourly.wind_direction_10m[hour - 1];

    wd80 =
      json.hourly.wind_direction_80m[hour - 1];

    wd120 =
      json.hourly.wind_direction_120m[hour - 1];


    precipitation_probability =
      json.hourly.precipitation_probability[hour - 1];

    precipitation =
      json.hourly.precipitation[hour - 1];

    visibility =
      json.hourly.visibility[hour - 1];


    if (marker == 1) {

      lat2 = lat1;
      lng2 = lng1;
    }


    startlat = lat1;
    startlng = lng1;

    destlat = lat2;
    destlng = lng2;


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
      3.14159265;

    dronedegrees =
      (dronedegrees + 360) % 360;


    dist =
      getDistanceFromLatLon(
        startlat,
        startlng,
        destlat,
        destlng
      );


    speedup =
      document.getElementById('asc').value /
      document.getElementById('payload').value;

    speeddown =
      document.getElementById('des').value /
      document.getElementById('payload').value;

    speedhorizontal =
      document.getElementById('hor').value /
      document.getElementById('payload').value;


    speedupback =
      document.getElementById('asc').value /
      document.getElementById('payloadback').value;

    speeddownback =
      document.getElementById('des').value /
      document.getElementById('payloadback').value;

    speedhorizontalback =
      document.getElementById('hor').value /
      document.getElementById('payloadback').value;


    drag =
      document.getElementById('drag').value;


    // Calculate minimum altitude:
    // max(20, highest building + 20)

    const minHeight =
      Math.max(
        20,
        maxBuildingHeight + 20
      );


    // Create candidate altitudes starting at the minimum

    heights = [minHeight];

    for (
      let i = minHeight + 10;
      i <= 120;
      i += 10
    ) {

      heights.push(i);
    }


    ws = [];
    wd = [];

    timeupdown = [];
    timeupdownback = [];

    timehor = [];
    timehorb = [];


    // Maximum allowed wind speed is 80% of the drone's
    // effective horizontal speed.
    //
    // Both outbound and return speeds must satisfy the limit.

    const maxAllowedWind =
      0.8 *
      Math.min(
        speedhorizontal,
        speedhorizontalback
      );


    const flyableHeights = [];


    for (
      i = 0;
      i < heights.length;
      i++
    ) {

      if (heights[i] < 80) {

        ws[i] =
          ws10 *
          (80 - heights[i]) /
          70
          +
          ws80 *
          (heights[i] - 10) /
          70;


        wd[i] =
          wd10 *
          (80 - heights[i]) /
          70
          +
          wd80 *
          (heights[i] - 10) /
          70;

      }

      else if (heights[i] == 80) {

        ws[i] = ws80;
        wd[i] = wd80;

      }

      else if (heights[i] == 120) {

        ws[i] = ws120;
        wd[i] = wd120;

      }

      else {

        ws[i] =
          ws80 *
          (120 - heights[i]) /
          40
          +
          ws120 *
          (heights[i] - 80) /
          40;


        wd[i] =
          wd80 *
          (120 - heights[i]) /
          40
          +
          wd120 *
          (heights[i] - 80) /
          40;
      }


      timeupdown[i] =
        (heights[i] / speedup) +
        (heights[i] / speeddown);


      timeupdownback[i] =
        (heights[i] / speedupback) +
        (heights[i] / speeddownback);


      // Do not offer an altitude when wind exceeds
      // 80% of the drone speed.

      if (ws[i] <= maxAllowedWind) {

        diffangle =
          (wd[i] - dronedegrees) /
          180 *
          Math.PI;


        angle =
          Math.cos(diffangle) *
          drag;


        const groundSpeedForward =
          speedhorizontal +
          ws[i] * angle;


        const groundSpeedBack =
          speedhorizontalback -
          ws[i] * angle;


        if (
          groundSpeedForward > 0 &&
          groundSpeedBack > 0
        ) {

          timehor[i] =
            dist /
            groundSpeedForward;


          timehorb[i] =
            dist /
            groundSpeedBack;


          flyableHeights.push(i);

        } else {

          timehor[i] = Infinity;
          timehorb[i] = Infinity;
        }

      } else {

        timehor[i] = Infinity;
        timehorb[i] = Infinity;
      }
    }


    // No altitude is safe enough under the current wind conditions.

    if (flyableHeights.length === 0) {

      showError(
        `<b>⛔ Flight not allowed under the current wind conditions.</b><br>` +
        `Maximum allowed wind speed: ${maxAllowedWind.toFixed(1)} m/s ` +
        `(80% of the drone's effective speed).`
      );

      document.getElementById('result').style.display =
        'none';

      return;
    }


    // Find the fastest outbound and return altitude.

    minhor =
      flyableHeights[0];

    minhorb =
      flyableHeights[0];


    for (const idx of flyableHeights) {

      if (
        timeupdown[idx] +
        timehor[idx]
        <
        timeupdown[minhor] +
        timehor[minhor]
      ) {

        minhor = idx;
      }


      if (
        timeupdownback[idx] +
        timehorb[idx]
        <
        timeupdownback[minhorb] +
        timehorb[minhorb]
      ) {

        minhorb = idx;
      }
    }


    tofixed = 0;


    document.getElementById('heightfore').innerHTML =
      heights[minhor].toFixed(tofixed);


    document.getElementById('heightback').innerHTML =
      heights[minhorb].toFixed(tofixed);


    document.getElementById('distance').innerHTML =
      dist.toFixed(tofixed);


    document.getElementById('dronedir').innerHTML =
      dronedegrees.toFixed(tofixed);


    document.getElementById('timenowind').innerHTML =
      (
        timeupdown[0] +
        timeupdownback[0] +
        (dist / speedhorizontal) +
        (dist / speedhorizontalback)
      ).toFixed(tofixed);


    document.getElementById('ws20').innerHTML =
      ws[0].toFixed(1);


    document.getElementById('ws80').innerHTML =
      ws[
        Math.floor(
          (80 - minHeight) / 10
        )
      ].toFixed(1);


    document.getElementById('ws120').innerHTML =
      ws[
        heights.length - 1
      ].toFixed(1);


    document.getElementById('wd20').innerHTML =
      wd[0].toFixed(0);


    document.getElementById('wd80').innerHTML =
      wd[
        Math.floor(
          (80 - minHeight) / 10
        )
      ].toFixed(0);


    document.getElementById('wd120').innerHTML =
      wd[
        heights.length - 1
      ].toFixed(0);


    document.getElementById('timefore20').innerHTML =
      (
        timeupdown[0] +
        timehor[0]
      ).toFixed(tofixed);


    document.getElementById('timeback20').innerHTML =
      (
        timeupdownback[0] +
        timehorb[0]
      ).toFixed(tofixed);


    document.getElementById('timefore80').innerHTML =
      (
        timeupdown[
          Math.floor(
            (80 - minHeight) / 10
          )
        ]
        +
        timehor[
          Math.floor(
            (80 - minHeight) / 10
          )
        ]
      ).toFixed(tofixed);


    document.getElementById('timeback80').innerHTML =
      (
        timeupdownback[
          Math.floor(
            (80 - minHeight) / 10
          )
        ]
        +
        timehorb[
          Math.floor(
            (80 - minHeight) / 10
          )
        ]
      ).toFixed(tofixed);


    document.getElementById('timefore120').innerHTML =
      (
        timeupdown[
          heights.length - 1
        ]
        +
        timehor[
          heights.length - 1
        ]
      ).toFixed(tofixed);


    document.getElementById('timeback120').innerHTML =
      (
        timeupdownback[
          heights.length - 1
        ]
        +
        timehorb[
          heights.length - 1
        ]
      ).toFixed(tofixed);


    travel20 =
      timeupdown[0] +
      timeupdownback[0] +
      timehor[0] +
      timehorb[0];


    travelopt =
      timeupdown[minhor] +
      timehor[minhor] +
      timeupdownback[minhorb] +
      timehorb[minhorb];


    document.getElementById('savesec').innerHTML =
      (
        travel20 -
        travelopt
      ).toFixed(2);


    document.getElementById('totaltime20').innerHTML =
      travel20.toFixed(tofixed);


    document.getElementById('savepercent').innerHTML =
      "(" +
      (
        (travel20 - travelopt) /
        travel20 *
        100
      ).toFixed(2) +
      "%)";


    document.getElementById('visibility').innerHTML =
      (visibility / 1000).toFixed(0);


    document.getElementById('precipitation').innerHTML =
      precipitation.toFixed(1);


    document.getElementById('precipitation_probability').innerHTML =
      precipitation_probability.toFixed(0);


    // Display building information when relevant

    if (
      considerBuildings &&
      maxBuildingHeight > 0
    ) {

      const buildingInfoDiv =
        document.getElementById('buildingInfo');

      if (buildingInfoDiv) {

        buildingInfoDiv.innerHTML =
          `<br><b>Building information:</b> ` +
          `Highest building: ${maxBuildingHeight.toFixed(1)}m, ` +
          `Recommended minimum flight altitude: ${minHeight}m`;
      }

    } else if (considerBuildings) {

      const buildingInfoDiv =
        document.getElementById('buildingInfo');

      if (buildingInfoDiv) {

        buildingInfoDiv.innerHTML =
          `<br><b>Building information:</b> ` +
          `No buildings found in range. ` +
          `Minimum flight altitude: 20m`;
      }
    }


    document.getElementById('result').style.display =
      'block';


  } catch (error) {

    console.error(
      'Calculation error:',
      error
    );

    showError(
      `Calculation error: ${error.message}`
    );

  } finally {

    showLoading(false);
  }

  return;
}


// Export getHeight as public function

window.getHeight = function() {

  console.log('getHeight called');

  calcHeight();
};


// Load the map when the page has finished loading.

const map =
  L.map('map').setView(
    [40.375540905462294, -74.601920573035],
    14
  );


const tiles =
  L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    {
      maxZoom: 20,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',

      subdomains:
        ['mt0', 'mt1', 'mt2', 'mt3']
    }
  ).addTo(map);


map.attributionControl.setPrefix(
  'Google map image'
);


map.on(
  'click',
  addMarker
);


function addMarker(e) {

  // Add marker to map at click location

  if (marker === 0) {

    marker = 1;

    // Create the marker

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


    // Listen for drag events

    marker1.on(
      'dragend',
      function(event) {

        var latlng =
          event.target.getLatLng();

        markerLocation(
          1,
          marker1
        );
      }
    );


  } else {

    if (marker === 1) {

      marker = 2;

      // Create the marker

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


      // Listen for drag events

      marker2.on(
        'dragend',
        function(event) {

          markerLocation(
            2,
            marker2
          );
        }
      );


    } else {

      // Marker has already been added,
      // so just change its location.

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
}
