//map.js

// todo:
// if choose start and than use GPs it makes two start marker
// before calculate height test if there is start and destination
// change minimum height to be 20m
// tell the user, how much he will save if he fly at 20m, 120m
// let the user decide horizontal and vertical UAV speed

//Set up some of our variables.
//var map; //Will contain map object.
var marker = 0; ////Has the user plotted their location marker?
var lat1,lat2, lng1, lng2;
var marker1, marker2, label1, label2;

//Function called to initialize / create the map.
//This is called when the page has loaded.

function moveToLocation(lat, lng){
  map.setView([lat, lng], 14);
  setstartloc(lat, lng)
}

// Used by the "Use my location" button: always puts the start marker
// at the given location, moving it if it already exists instead of
// leaving it in place or creating a duplicate.
function useCurrentLocationAsStart(lat, lng){
  map.setView([lat, lng], 14);
  if (marker === 0){
    setstartloc(lat, lng);
  } else {
    marker1.setLatLng([lat, lng]);
    markerLocation(1, marker1);
  }
}

function setstartloc(lat, long)
{
    if(marker === 0){ // new marker
            marker = 1;
   marker1 = new L.marker(coords = [lat, long],{draggable: true,autoPan: true}).addTo(map);
            marker1.bindTooltip("Start");  
         markerLocation(1, marker1);    
   //Listen for drag events!
   marker1.on('dragend', function(event) {
//        var latlng = event.target.getLatLng();
       markerLocation(1, marker1);  
});      
    }
//    else { //there is already marker
//     window.alert(marker)
//               markerLocation(2, marker1);  
//         }
}


//This function will get the marker's current location and then add the lat/long
//values to our textfields so that we can save the location.
function markerLocation(sd, mark){
    //Get location.
    if (sd===1)
        {
  var currentLocation = mark.getLatLng(); //getLatLng();  
  lat1 = currentLocation.lat; //latitude
  lng1 = currentLocation.lng; //longitude
        }
    else
        {
   var currentLocation = mark.getLatLng();  
   lat2 = currentLocation.lat; //latitude
   lng2 = currentLocation.lng; //longitude
        }

}

function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c * 1000; // Distance in m
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function drift(){
// from Observing Boundary-Layer Winds from Hot-Air Balloon Flights 2016
// Cd is the drone drag coefficient
// rho is the air density (kg/m^3)
// A is the drone area when looking from the side (m^2)
// m is the drone mass (kg)
//////// a = cd*rho*A/2m
// v0 is the relative speed at t=0
// v(t) = 1 / (a*t+(1/v0))
}

// ---------------------------------------------------------------
// Drone presets: horizontal/ascent/descent speed (m/s), from each
// manufacturer's published spec sheet (sport/S-mode figures).
// ---------------------------------------------------------------

var DRONE_PRESETS = {
  mavic3classic: { name: 'DJI Mavic 3 Classic', hor: 21, asc: 8, des: 6, windres: 12 },
  mini4pro:      { name: 'DJI Mini 4 Pro',       hor: 16, asc: 5, des: 5, windres: 10.7 },
  air3:          { name: 'DJI Air 3',            hor: 21, asc: 10, des: 10, windres: 12 },
  matrice300:    { name: 'DJI Matrice 300 RTK',  hor: 23, asc: 6, des: 5, windres: 12 },
  evolite:       { name: 'Autel EVO Lite+',      hor: 18, asc: 5, des: 4, windres: 10.6 }
};

function updateDroneSummary(){
  var sel = document.getElementById('droneModel');
  var nameEl = document.getElementById('droneSummaryName');
  if (!sel || !nameEl) return;
  var preset = DRONE_PRESETS[sel.value];
  nameEl.textContent = preset ? preset.name : 'Custom';
}

function applyDronePreset(){
  var sel = document.getElementById('droneModel');
  var preset = DRONE_PRESETS[sel.value];
  if (preset){
    document.getElementById('hor').value = preset.hor;
    document.getElementById('asc').value = preset.asc;
    document.getElementById('des').value = preset.des;
    document.getElementById('windres').value = preset.windres;
  }
  updateDroneSummary(); // "Custom" - leave whatever the user has typed, just relabel
}

// If the person hand-edits a speed field away from the selected
// preset's value, flip the picker to "Custom" so it doesn't silently
// keep claiming to be that drone.
function checkCustom(){
  var sel = document.getElementById('droneModel');
  var preset = DRONE_PRESETS[sel.value];
  if (preset){
    var hor = parseFloat(document.getElementById('hor').value);
    var asc = parseFloat(document.getElementById('asc').value);
    var des = parseFloat(document.getElementById('des').value);
    var windres = parseFloat(document.getElementById('windres').value);
    if (hor !== preset.hor || asc !== preset.asc || des !== preset.des || windres !== preset.windres){
      sel.value = 'custom';
    }
  }
  updateDroneSummary();
}

function markUnsafe(id, unsafe, reason){
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('unsafe-value', unsafe);
  el.title = unsafe ? reason : '';
}

// ---------------------------------------------------------------
// Building clearance (OpenStreetMap via the Overpass API)
//
// We ask Overpass only for buildings inside a narrow rectangle that
// hugs the straight-line route (not a big bounding box), and only for
// their tags + center point rather than full outlines - that keeps
// the download small regardless of how long the route is.
// ---------------------------------------------------------------

var BUILDING_CORRIDOR_HALF_WIDTH_M = 60; // 120 m wide corridor around the route
var BUILDING_HEIGHT_FALLBACK_M = 7;      // ~2 storeys, used when a building has no height/levels tag
var BUILDING_TYPE_HEIGHT_M = {
  garage: 3, garages: 3, shed: 3, roof: 3, hut: 3, carport: 3,
  house: 7, residential: 7, detached: 7, terrace: 7, semidetached_house: 7, bungalow: 5,
  apartments: 12, commercial: 10, industrial: 10, retail: 8, office: 12, warehouse: 9
};

// Places that are risky to overfly: schools, kindergartens, hospitals
// and playgrounds. We only know their tags + a center point (no
// footprint, to keep the download small), so each is treated as a
// circle whose radius is a rough guess by type.
var HAZARD_CORRIDOR_HALF_WIDTH_M = 220; // wide enough to see nearby hazards and have room to route around them
var HAZARD_SAFETY_MARGIN_M = 20;        // extra buffer added on top of the estimated radius
var HAZARD_TYPE_RADIUS_M = { school: 60, kindergarten: 40, hospital: 90, playground: 30 };
var HAZARD_TYPE_LABEL = { school: 'School', kindergarten: 'Kindergarten', hospital: 'Hospital', playground: 'Playground' };

function rad2deg(rad){
  return rad * (180 / Math.PI);
}

// Destination point at `distMeters` from (lat,lng) along `bearingDeg`
// (standard spherical "direct geodesic" formula, same Earth radius
// used elsewhere in this file).
function offsetLatLng(lat, lng, bearingDeg, distMeters){
  var R = 6371000;
  var brng = deg2rad(bearingDeg);
  var lat1r = deg2rad(lat);
  var lon1r = deg2rad(lng);
  var dOverR = distMeters / R;
  var lat2r = Math.asin(Math.sin(lat1r) * Math.cos(dOverR) + Math.cos(lat1r) * Math.sin(dOverR) * Math.cos(brng));
  var lon2r = lon1r + Math.atan2(Math.sin(brng) * Math.sin(dOverR) * Math.cos(lat1r), Math.cos(dOverR) - Math.sin(lat1r) * Math.sin(lat2r));
  return { lat: rad2deg(lat2r), lng: rad2deg(lon2r) };
}

// A thin rectangle hugging the start->destination line, used as the
// Overpass search area. Falls back to a small square around the start
// point when there's no real route yet (start and destination match).
function routeCorridorPolygon(lat1, lng1, lat2, lng2, bearingDeg, halfWidthM){
  var distM = getDistanceFromLatLon(lat1, lng1, lat2, lng2);
  if (distM < 10){
    var r = Math.max(halfWidthM, 100);
    var n = offsetLatLng(lat1, lng1, 0, r);
    var e = offsetLatLng(lat1, lng1, 90, r);
    var s = offsetLatLng(lat1, lng1, 180, r);
    var w = offsetLatLng(lat1, lng1, 270, r);
    return [n, e, s, w];
  }
  var p1 = offsetLatLng(lat1, lng1, bearingDeg + 90, halfWidthM);
  var p2 = offsetLatLng(lat2, lng2, bearingDeg + 90, halfWidthM);
  var p3 = offsetLatLng(lat2, lng2, bearingDeg - 90, halfWidthM);
  var p4 = offsetLatLng(lat1, lng1, bearingDeg - 90, halfWidthM);
  return [p1, p2, p3, p4];
}

function parseMetersTag(value){
  if (value === undefined || value === null) return null;
  var n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Best-effort height for a building from its OSM tags: explicit
// height, then level count (~3 m/level), then a type-based guess,
// then a generic fallback for untagged buildings.
function estimateBuildingHeight(tags){
  tags = tags || {};
  var explicit = parseMetersTag(tags.height);
  if (explicit === null) explicit = parseMetersTag(tags['building:height']);
  if (explicit !== null) return explicit;

  var levels = parseMetersTag(tags['building:levels']);
  if (levels === null) levels = parseMetersTag(tags.levels);
  if (levels !== null) return levels * 3;

  var type = (tags.building || '').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(BUILDING_TYPE_HEIGHT_M, type)) return BUILDING_TYPE_HEIGHT_M[type];

  return BUILDING_HEIGHT_FALLBACK_M;
}

function classifyHazard(tags){
  tags = tags || {};
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'kindergarten') return 'kindergarten';
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.leisure === 'playground') return 'playground';
  return null;
}

// Overpass gives nodes their own lat/lon directly, and ways/relations
// a bounding-box "center" when queried with "out ... center;".
function elementLatLng(el){
  if (typeof el.lat === 'number' && typeof el.lon === 'number') return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

function polygonToStr(polygon){
  return polygon.map(function(p){ return p.lat + ' ' + p.lng; }).join(' ');
}

// One Overpass call for both building heights and hazard zones, each
// with its own (differently sized) corridor, tags + center only - no
// full geometries - so the download stays small and quick even when
// the route is long.
async function getOsmDataNearRoute(lat1, lng1, lat2, lng2, bearingDeg){
  var buildingPoly = polygonToStr(routeCorridorPolygon(lat1, lng1, lat2, lng2, bearingDeg, BUILDING_CORRIDOR_HALF_WIDTH_M));
  var hazardPoly = polygonToStr(routeCorridorPolygon(lat1, lng1, lat2, lng2, bearingDeg, HAZARD_CORRIDOR_HALF_WIDTH_M));

  var query = '[out:json][timeout:25];(' +
    'way["building"](poly:"' + buildingPoly + '");' +
    'node["amenity"~"^(school|kindergarten|hospital)$"](poly:"' + hazardPoly + '");' +
    'way["amenity"~"^(school|kindergarten|hospital)$"](poly:"' + hazardPoly + '");' +
    'relation["amenity"~"^(school|kindergarten|hospital)$"](poly:"' + hazardPoly + '");' +
    'node["leisure"="playground"](poly:"' + hazardPoly + '");' +
    'way["leisure"="playground"](poly:"' + hazardPoly + '");' +
    ');out tags center;';

  var response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query)
  });
  if (!response.ok){
    throw new Error('Overpass request failed: ' + response.status);
  }
  var data = await response.json();
  var elements = data.elements || [];

  var buildingCount = 0;
  var maxHeight = 0;
  var hazards = [];

  for (var i = 0; i < elements.length; i++){
    var tags = elements[i].tags || {};
    if (tags.building){
      buildingCount++;
      var h = estimateBuildingHeight(tags);
      if (h > maxHeight) maxHeight = h;
    }
    var hazardType = classifyHazard(tags);
    if (hazardType){
      var pos = elementLatLng(elements[i]);
      if (pos){
        hazards.push({ lat: pos.lat, lng: pos.lng, type: hazardType, name: tags.name || null, radius: HAZARD_TYPE_RADIUS_M[hazardType] });
      }
    }
  }

  return {
    buildings: { count: buildingCount, maxHeight: maxHeight },
    hazards: hazards
  };
}

// Straight line by default. If that line passes within a hazard's
// (radius + safety margin) of its center, we insert one waypoint per
// blocking hazard, offset just far enough to clear it on whichever
// side needs the smaller detour. Good enough for the isolated,
// one-or-two-obstacle case this app is meant for - not a full path
// planner, so it's worth a glance on the map before flying.
function computeAvoidanceRoute(lat1, lng1, lat2, lng2, hazards){
  var straightDist = getDistanceFromLatLon(lat1, lng1, lat2, lng2);
  var straightPath = [{ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }];

  if (straightDist < 10 || !hazards || hazards.length === 0){
    return { path: straightPath, distance: straightDist, blockingCount: 0 };
  }

  // Local flat-earth projection centered on the start point - fine
  // for the short distances this app targets.
  var mPerDegLat = 110540;
  var mPerDegLng = 111320 * Math.cos(deg2rad(lat1));

  function toLocal(lat, lng){
    return { x: (lng - lng1) * mPerDegLng, y: (lat - lat1) * mPerDegLat };
  }
  function toLatLng(p){
    return { lat: lat1 + p.y / mPerDegLat, lng: lng1 + p.x / mPerDegLng };
  }

  var dest = toLocal(lat2, lng2);
  var routeLen = Math.sqrt(dest.x * dest.x + dest.y * dest.y);
  var ux = dest.x / routeLen, uy = dest.y / routeLen;
  var px = -uy, py = ux;

  var blocking = [];
  for (var i = 0; i < hazards.length; i++){
    var hz = hazards[i];
    var hp = toLocal(hz.lat, hz.lng);
    var t = hp.x * ux + hp.y * uy;
    var d = hp.x * px + hp.y * py;
    var clearance = hz.radius + HAZARD_SAFETY_MARGIN_M;
    if (t >= 0 && t <= routeLen && Math.abs(d) < clearance){
      blocking.push({ t: t, d: d, clearance: clearance });
    }
  }

  if (blocking.length === 0){
    return { path: straightPath, distance: straightDist, blockingCount: 0 };
  }

  blocking.sort(function(a, b){ return a.t - b.t; });

  var pathLocal = [{ x: 0, y: 0 }];
  for (var j = 0; j < blocking.length; j++){
    var b = blocking[j];
    var posA = b.d + b.clearance;
    var posB = b.d - b.clearance;
    var pos = (Math.abs(posA) <= Math.abs(posB)) ? posA : posB;
    pathLocal.push({ x: ux * b.t + px * pos, y: uy * b.t + py * pos });
  }
  pathLocal.push(dest);

  var path = pathLocal.map(toLatLng);
  var totalDist = 0;
  for (var k = 1; k < path.length; k++){
    totalDist += getDistanceFromLatLon(path[k - 1].lat, path[k - 1].lng, path[k].lat, path[k].lng);
  }

  return { path: path, distance: totalDist, blockingCount: blocking.length };
}

async function getJSON() {

   const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude='+lat1+'&longitude='+lng1+'&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,visibility,precipitation_probability,precipitation&forecast_days=1';

    return fetch(apiUrl)
        .then((response)=>response.json())
        .then((responseJson)=>{return responseJson});
}

// ---------------------------------------------------------------
// Visuals: altitude tape + compass rose (SVG, theme-matched)
// ---------------------------------------------------------------

var VIZ_COLORS = {
  accent: '#ff8a34',   // outbound
  accent2: '#4fd1c5',  // return / wind
  ink: '#e7ecf6',
  muted: '#8d9ab8',
  line: '#324066',
  panel: '#17223a',
  danger: '#ff5a5a'
};

// Keeps the SVG diagrams in step with the page's light/dark theme,
// which otherwise follows the OS/browser preference via CSS alone.
function refreshVizTheme(){
  var light = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
  if (light){
    VIZ_COLORS.accent = '#d9670f';
    VIZ_COLORS.accent2 = '#0e8c7f';
    VIZ_COLORS.ink = '#172037';
    VIZ_COLORS.muted = '#58658a';
    VIZ_COLORS.line = '#c7cfe0';
    VIZ_COLORS.panel = '#eef1f8';
    VIZ_COLORS.danger = '#c93030';
    WIND_COLORS = ['#3355cc', '#0e8c7f', '#b8790a'];
  } else {
    VIZ_COLORS.accent = '#ff8a34';
    VIZ_COLORS.accent2 = '#4fd1c5';
    VIZ_COLORS.ink = '#e7ecf6';
    VIZ_COLORS.muted = '#8d9ab8';
    VIZ_COLORS.line = '#324066';
    VIZ_COLORS.panel = '#17223a';
    VIZ_COLORS.danger = '#ff5a5a';
    WIND_COLORS = ['#7c9cff', '#4fd1c5', '#ffd166'];
  }
}

function polarToXY(cx, cy, r, deg){
  var rad = (deg) * Math.PI / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

var WIND_COLORS = ['#7c9cff', '#4fd1c5', '#ffd166']; // 20m, 80m, 120m

// Draws a line from the center out to `length`, with a small triangular
// arrowhead at the tip pointing in the direction of travel, plus an
// optional short text label placed just past the tip.
function drawArrow(cx, cy, length, deg, color, width, label, labelOffset){
  var tip = polarToXY(cx, cy, length, deg);
  var back = polarToXY(cx, cy, length - 9, deg);
  var leftDeg = deg - 8, rightDeg = deg + 8;
  var headBase = length - 9;
  var lp = polarToXY(cx, cy, headBase, leftDeg);
  var rp = polarToXY(cx, cy, headBase, rightDeg);

  var svg = '<line x1="' + cx + '" y1="' + cy + '" x2="' + back.x + '" y2="' + back.y + '" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round"/>' +
    '<polygon points="' + tip.x + ',' + tip.y + ' ' + lp.x + ',' + lp.y + ' ' + rp.x + ',' + rp.y + '" fill="' + color + '"/>';

  if (label){
    var lpt = polarToXY(cx, cy, length + (labelOffset || 14), deg);
    svg += '<text x="' + lpt.x + '" y="' + (lpt.y + 3) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + color + '">' + label + '</text>';
  }
  return svg;
}

function renderCompassRose(droneDeg, windPoints){
  var el = document.getElementById('compassRose');
  if (!el) return;
  refreshVizTheme();

  var w = 220, h = 300;
  var cx = w / 2, cy = 120, r = 76;

  var ring = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + VIZ_COLORS.line + '" stroke-width="1.5"/>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + VIZ_COLORS.line + '"/>';

  var labels = [0, 90, 180, 270];
  var labelText = ['0/360', '90', '180', '270'];
  var ticks = '';
  for (var i = 0; i < labels.length; i++){
    var p1 = polarToXY(cx, cy, r, labels[i]);
    var p2 = polarToXY(cx, cy, r - 8, labels[i]);
    var pt = polarToXY(cx, cy, r + 15, labels[i]);
    ticks += '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="' + VIZ_COLORS.muted + '" stroke-width="1.5"/>';
    ticks += '<text x="' + pt.x + '" y="' + (pt.y + 3) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">' + labelText[i] + '</text>';
  }

  // Wind arrows first (shorter, so the drone heading arrow sits on top
  // and always stays readable even if directions overlap). Open-Meteo
  // reports wind direction as where it blows FROM (met. convention);
  // we flip it 180 deg here so the arrow points where it's blowing
  // TO, which lines up intuitively against the drone's heading arrow
  // (same direction = tailwind, opposite = headwind).
  var windArrows = '';
  var windFlowDeg = [];
  var radii = [r * 0.45, r * 0.62, r * 0.8];
  for (var j = 0; j < windPoints.length; j++){
    var color = WIND_COLORS[j % WIND_COLORS.length];
    windFlowDeg[j] = (windPoints[j].wd + 180) % 360;
    windArrows += drawArrow(cx, cy, radii[j], windFlowDeg[j], color, 2, null, 0);
  }

  var droneArrow = drawArrow(cx, cy, r - 4, droneDeg, VIZ_COLORS.ink, 2.5, null, 0);

  // Legend: one row per series with its actual heading, since color
  // alone on an overlapping compass is hard to read at a glance. The
  // wind rows show the same "blowing to" degree as their arrow.
  var legendRows = [
    { color: VIZ_COLORS.ink, text: 'drone heading ' + droneDeg.toFixed(0) + '\u00B0' }
  ];
  var windLabels = ['wind 20m \u2192 ', 'wind 80m \u2192 ', 'wind 120m \u2192 '];
  for (var k = 0; k < windPoints.length; k++){
    legendRows.push({
      color: WIND_COLORS[k % WIND_COLORS.length],
      text: windLabels[k] + windFlowDeg[k].toFixed(0) + '\u00B0'
    });
  }

  var legendTop = h - (legendRows.length * 18) - 6;
  var legend = '<g font-family="JetBrains Mono, monospace" font-size="11">';
  for (var m = 0; m < legendRows.length; m++){
    var ly = legendTop + m * 18;
    legend += '<line x1="6" y1="' + ly + '" x2="20" y2="' + ly + '" stroke="' + legendRows[m].color + '" stroke-width="3" stroke-linecap="round"/>';
    legend += '<text x="26" y="' + (ly + 4) + '" fill="' + VIZ_COLORS.muted + '">' + legendRows[m].text + '</text>';
  }
  legend += '</g>';

  var svg =
    '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Compass showing the drone\'s outbound heading and the direction each wind is blowing toward, at 20, 80 and 120 meters">' +
      '<text x="' + cx + '" y="14" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">HEADING (OUT) vs WIND FLOW</text>' +
      ring + ticks + windArrows + droneArrow + legend +
    '</svg>';

  el.innerHTML = svg;
}

async function calcHeight() {

    if (marker==0){
       window.alert('please choose location');
       return;
        }

    if (marker==1)
        {lat2=lat1;
         lng2=lng1;
        }
    startlat=lat1;
    startlng=lng1;
    destlat=lat2;
    destlng=lng2;
    difflat=startlat-destlat;
    difflng=startlng-destlng;
    var dronedegrees = Math.atan2(difflng, difflat) * 180 / 3.14159265;
    dronedegrees = (dronedegrees + 360) % 360;  // +360 for implementations where mod returns negative numbers
    // dronedegrees is used as-is by the headwind/crosswind formulas
    // below; for anything shown to the person, "heading" should mean
    // the outbound direction of travel, which is the opposite bearing.
    var outboundHeading = (dronedegrees + 180) % 360;
    dist=getDistanceFromLatLon(startlat,startlng,destlat, destlng);

    // Kick both network calls off together - wind from open-meteo, and
    // nearby buildings + hazard zones from OpenStreetMap's Overpass
    // API. A failed OSM lookup shouldn't block the wind calculation,
    // so it's caught locally and treated as "no data".
    const windPromise = this.getJSON();
    const osmPromise = getOsmDataNearRoute(startlat, startlng, destlat, destlng, dronedegrees)
        .catch(function(err){ console.warn('OSM lookup failed:', err); return null; });

    const json = await windPromise;  // command waits until completion
    const osmData = await osmPromise;
    const buildings = osmData ? osmData.buildings : null;
    const hazards = osmData ? osmData.hazards : [];

    const avoidance = computeAvoidanceRoute(startlat, startlng, destlat, destlng, hazards);
    const routeDist = avoidance.distance;
    renderHazardsAndRoute(hazards, avoidance.path);

    const d = new Date();
    let hour = d.getUTCHours();
    var mydata = JSON.stringify(json, null, 2);

ws10=json.hourly.wind_speed_10m[hour-1]/3.6; //array start at zero
ws80=json.hourly.wind_speed_80m[hour-1]/3.6; //array start at zero
ws120=json.hourly.wind_speed_120m[hour-1]/3.6; //array start at zero
wd10=json.hourly.wind_direction_10m[hour-1]; //array start at zero
wd80=json.hourly.wind_direction_80m[hour-1]; //array start at zero
wd120=json.hourly.wind_direction_120m[hour-1]; //array start at zero
gust10=json.hourly.wind_gusts_10m[hour-1]/3.6;
precipitation_probability=json.hourly.precipitation_probability[hour-1];
precipitation=json.hourly.precipitation[hour-1];
visibility=json.hourly.visibility[hour-1];

// Gusts are only forecast at 10m. We estimate gusts at other heights
// by applying the same gustiness ratio (gust/average at 10m) to the
// average wind there - clamped so a near-calm 10m reading (division
// by ~0) can't blow the ratio up unrealistically.
gustFactor = (ws10 > 0.1) ? (gust10 / ws10) : 1;
gustFactor = Math.min(Math.max(gustFactor, 1), 3);

//    window.alert(dronedegrees);
//    window.alert(dist);

//// time to go to 20m + time to go horizontaly
//    window.alert(ws80+ ' m/s '+ wd80 + ' de2222grees');

    speedup=document.getElementById('asc').value/document.getElementById('payload').value;
    speeddown=document.getElementById('des').value/document.getElementById('payload').value;
    speedhorizontal=document.getElementById('hor').value/document.getElementById('payload').value;
    speedupback=document.getElementById('asc').value/document.getElementById('payloadback').value;
    speeddownback=document.getElementById('des').value/document.getElementById('payloadback').value;
    speedhorizontalback=document.getElementById('hor').value/document.getElementById('payloadback').value;

    drag=document.getElementById('drag').value

    heights = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
    ws = []
    wd = []
    timeupdown = []
    timeupdownback = []
    timehor = []
    timehorb = []
    estgust = []
    crosswind = []
    for (i=0;i<heights.length; i++) {
    if (heights[i]<80)
            {
            ws[i]=ws10*(80-heights[i])/70+ws80*(heights[i]-10)/70
            wd[i]=wd10*(80-heights[i])/70+wd80*(heights[i]-10)/70
            }
        else if (heights[i]==80)
            {
            ws[i]=ws80
            wd[i]=wd80
            }
            else if (heights[i]==120)
   {
   ws[i]=ws120
   wd[i]=wd120  
   }
   else
   {
   ws[i]=ws80*(120-heights[i])/40+ws120*(heights[i]-80)/40
   wd[i]=wd80*(120-heights[i])/40+wd120*(heights[i]-80)/40
   }
timeupdown[i] = (heights[i]/speedup)+(heights[i]/speeddown)
timeupdownback[i] = (heights[i]/speedupback)+(heights[i]/speeddownback)
diffangle=(wd[i]-dronedegrees)/180*Math.PI
angle = Math.cos(diffangle)*drag
timehor[i] = routeDist /  (speedhorizontal+ws[i]*angle)
timehorb[i] = routeDist / (speedhorizontalback-ws[i]*angle)
// Gust extrapolated from the 10m gust/average ratio, and the
// crosswind component (perpendicular to heading) of the average
// wind - used below as separate flyability checks.
estgust[i] = ws[i] * gustFactor
crosswind[i] = ws[i] * Math.abs(Math.sin(diffangle))
    }

    // A height isn't flyable if:
    //  - it's below the minimum clearance above the tallest building
    //    OSM knows about near this route, or
    //  - the estimated gust there meets or exceeds the drone's rated
    //    max wind resistance (an airframe limit, same for both legs), or
    //  - the crosswind component of the average wind meets or exceeds
    //    the drone's horizontal speed for that leg - beyond that point
    //    the drone can't hold its course at all, regardless of speed.
    var maxBuildingHeight = buildings ? buildings.maxHeight : 0;
    var minSafeAltitude = maxBuildingHeight > 0 ? (maxBuildingHeight + 20) : 20;
    var windResistance = parseFloat(document.getElementById('windres').value);

    flyableOut = []
    flyableBack = []
    buildingOk = []
    windResOk = []
    crosswindOkOut = []
    crosswindOkBack = []
    for (i=0;i<heights.length; i++) {
        buildingOk[i] = heights[i] >= minSafeAltitude
        windResOk[i] = estgust[i] < windResistance
        crosswindOkOut[i] = speedhorizontal > crosswind[i]
        crosswindOkBack[i] = speedhorizontalback > crosswind[i]
        flyableOut[i] = buildingOk[i] && windResOk[i] && crosswindOkOut[i]
        flyableBack[i] = buildingOk[i] && windResOk[i] && crosswindOkBack[i]
    }

    minhor = -1
    minhorb = -1
    for (i=0;i<heights.length; i++) {
        if (flyableOut[i] && (minhor===-1 || timeupdown[i]+timehor[i]<timeupdown[minhor]+timehor[minhor]))
            minhor=i
        if (flyableBack[i] && (minhorb===-1 || timeupdownback[i]+timehorb[i]<timeupdownback[minhorb]+timehorb[minhorb]))
            minhorb=i
    }

    tofixed=0
    document.getElementById('heightfore').innerHTML = (minhor===-1) ? '&mdash;' : heights[minhor].toFixed(tofixed)
    document.getElementById('heightback').innerHTML = (minhorb===-1) ? '&mdash;' : heights[minhorb].toFixed(tofixed)
    document.getElementById('readoutFore').classList.toggle('unsafe', minhor===-1)
    document.getElementById('readoutBack').classList.toggle('unsafe', minhorb===-1)
    document.getElementById('distance').innerHTML = routeDist.toFixed(tofixed)
    var detourNote = document.getElementById('detourNote')
    var detourExtra = routeDist - dist
    if (avoidance.blockingCount > 0 && detourExtra > 1){
        detourNote.textContent = ' (+' + detourExtra.toFixed(0) + 'm detour around ' + avoidance.blockingCount + ' restricted area' + (avoidance.blockingCount===1?'':'s') + ')'
    } else {
        detourNote.textContent = ''
    }
    document.getElementById('dronedir').innerHTML = outboundHeading.toFixed(tofixed)
    // document.getElementById('windrose').innerHTML = wd[0].toFixed(tofixed)
    document.getElementById('timenowind').innerHTML = (timeupdown[10]+timeupdownback[10]+(routeDist / speedhorizontal)+(routeDist / speedhorizontalback)).toFixed(tofixed)
    document.getElementById('ws20').innerHTML = (ws[0]).toFixed(1)
    document.getElementById('ws80').innerHTML = (ws[6]).toFixed(1)
    document.getElementById('ws120').innerHTML = (ws[10]).toFixed(1)
    document.getElementById('gust20').innerHTML = (estgust[0]).toFixed(1)
    document.getElementById('gust80').innerHTML = (estgust[6]).toFixed(1)
    document.getElementById('gust120').innerHTML = (estgust[10]).toFixed(1)
    document.getElementById('wd20').innerHTML = (wd[0]).toFixed(0)
    document.getElementById('wd80').innerHTML = (wd[6]).toFixed(0)
    document.getElementById('wd120').innerHTML = (wd[10]).toFixed(0)
    document.getElementById('timefore20').innerHTML = (timeupdown[0]+timehor[0]).toFixed(tofixed)
    document.getElementById('timeback20').innerHTML = (timeupdownback[0]+timehorb[0]).toFixed(tofixed)
    document.getElementById('timefore80').innerHTML = (timeupdown[6]+timehor[6]).toFixed(tofixed)
    document.getElementById('timeback80').innerHTML = (timeupdownback[6]+timehorb[6]).toFixed(tofixed)
    document.getElementById('timefore120').innerHTML = (timeupdown[10]+timehor[10]).toFixed(tofixed)
    document.getElementById('timeback120').innerHTML = (timeupdownback[10]+timehorb[10]).toFixed(tofixed)

    var unsafeReasonBuilding = "Below the minimum safe height above buildings on this route (min " + minSafeAltitude.toFixed(0) + " m).";
    var unsafeReasonGust = "Estimated gust here is at or above this drone's rated wind resistance (" + windResistance.toFixed(1) + " m/s).";
    var unsafeReasonCrossOut = "The crosswind component here is at or above this drone's outbound speed - it couldn't hold this course.";
    var unsafeReasonCrossBack = "The crosswind component here is at or above this drone's return speed - it couldn't hold this course.";
    function cellReason(idx, crosswindOk, crossMsg){
        if (!buildingOk[idx]) return unsafeReasonBuilding;
        if (!windResOk[idx]) return unsafeReasonGust;
        if (!crosswindOk) return crossMsg;
        return '';
    }
    markUnsafe('timefore20', !flyableOut[0], cellReason(0, crosswindOkOut[0], unsafeReasonCrossOut))
    markUnsafe('timeback20', !flyableBack[0], cellReason(0, crosswindOkBack[0], unsafeReasonCrossBack))
    markUnsafe('timefore80', !flyableOut[6], cellReason(6, crosswindOkOut[6], unsafeReasonCrossOut))
    markUnsafe('timeback80', !flyableBack[6], cellReason(6, crosswindOkBack[6], unsafeReasonCrossBack))
    markUnsafe('timefore120', !flyableOut[10], cellReason(10, crosswindOkOut[10], unsafeReasonCrossOut))
    markUnsafe('timeback120', !flyableBack[10], cellReason(10, crosswindOkBack[10], unsafeReasonCrossBack))
    markUnsafe('ws20', !crosswindOkOut[0] || !crosswindOkBack[0], "The crosswind component here is at or above this drone's speed for at least one leg.")
    markUnsafe('ws80', !crosswindOkOut[6] || !crosswindOkBack[6], "The crosswind component here is at or above this drone's speed for at least one leg.")
    markUnsafe('ws120', !crosswindOkOut[10] || !crosswindOkBack[10], "The crosswind component here is at or above this drone's speed for at least one leg.")
    markUnsafe('gust20', !windResOk[0], unsafeReasonGust)
    markUnsafe('gust80', !windResOk[6], unsafeReasonGust)
    markUnsafe('gust120', !windResOk[10], unsafeReasonGust)

    var buildingInfo = document.getElementById('buildingInfo')
    buildingInfo.classList.remove('warning-hint')
    if (buildings === null){
        buildingInfo.innerHTML = "Couldn't load building data from OpenStreetMap for this route, so only wind is being checked right now &mdash; heights below 20 m above nearby buildings might not actually be safe."
        buildingInfo.classList.add('warning-hint')
    } else if (buildings.count === 0){
        buildingInfo.innerHTML = "No buildings found near this route in OpenStreetMap, so no extra height is needed for obstacle clearance."
    } else {
        buildingInfo.innerHTML = "Checked " + buildings.count + " building" + (buildings.count===1?'':'s') + " from OpenStreetMap near this route &mdash; the tallest is about " + maxBuildingHeight.toFixed(0) + " m, so we won't recommend flying below " + minSafeAltitude.toFixed(0) + " m."
    }
    buildingInfo.style.display = 'block'

    var hazardInfo = document.getElementById('hazardInfo')
    hazardInfo.classList.remove('warning-hint')
    if (osmData === null){
        hazardInfo.innerHTML = "Couldn't load restricted-area data from OpenStreetMap, so schools, kindergartens, hospitals and playgrounds along this route aren't being checked right now."
        hazardInfo.classList.add('warning-hint')
    } else if (hazards.length === 0){
        hazardInfo.innerHTML = "No schools, kindergartens, hospitals or playgrounds found near this route in OpenStreetMap."
    } else {
        var detourText = avoidance.blockingCount > 0
            ? "The route on the map now detours around " + avoidance.blockingCount + " of them."
            : "The straight-line route already clears all of them."
        hazardInfo.innerHTML = "Found " + hazards.length + " restricted area" + (hazards.length===1?'':'s') + " (schools, kindergartens, hospitals, playgrounds) near this route, marked in red on the map. " + detourText
    }
    hazardInfo.style.display = 'block'

    var flyWarning = document.getElementById('flyWarning')
    var savingsText = document.getElementById('savingsText')

    if (minhor!==-1 && minhorb!==-1){
        flyWarning.style.display = 'none'
        savingsText.style.display = ''

        travel120=timeupdown[10]+timeupdownback[10]+timehor[10]+timehorb[10]
        travelopt=timeupdown[minhor]+timehor[minhor]+timeupdownback[minhorb]+timehorb[minhorb]

        document.getElementById('savesec').innerHTML = (travel120-travelopt).toFixed(2)
        document.getElementById('totaltime120').innerHTML = travel120.toFixed(tofixed)
        document.getElementById('savepercent').innerHTML = "(" +((travel120-travelopt)/travel120*100).toFixed(2) +"%)"
    } else {
        savingsText.style.display = 'none'
        var legs = []
        if (minhor===-1) legs.push('outbound')
        if (minhorb===-1) legs.push('return')

        var reasonBits = []
        if (minSafeAltitude > 120){
            reasonBits.push("buildings along the route need about " + minSafeAltitude.toFixed(0) + " m of clearance, above the 120 m ceiling we check")
        }
        var gustBlocksAll = true
        for (i=0;i<heights.length; i++){
            if (windResOk[i]) gustBlocksAll = false
        }
        if (gustBlocksAll){
            reasonBits.push("estimated gusts meet or beat this drone's " + windResistance.toFixed(1) + " m/s wind resistance at every height we can still check")
        }
        var crosswindBlocksOut = true, crosswindBlocksBack = true
        for (i=0;i<heights.length; i++){
            if (crosswindOkOut[i]) crosswindBlocksOut = false
            if (crosswindOkBack[i]) crosswindBlocksBack = false
        }
        if ((legs.indexOf('outbound')>-1 && crosswindBlocksOut) || (legs.indexOf('return')>-1 && crosswindBlocksBack)){
            reasonBits.push("the crosswind meets or beats the drone's speed at every height we can still check, so it couldn't hold course")
        }
        if (reasonBits.length===0){
            reasonBits.push("no height between 20 and 120 m clears the buildings, the gusts, and the crosswind on this route")
        }

        flyWarning.innerHTML = "We can't recommend a safe height for the " + legs.join(' and ') + " leg: " + reasonBits.join(' and ') + ". Consider a faster drone, a different time, or don't fly."
        flyWarning.style.display = 'block'
    }

    document.getElementById('visibility').innerHTML = (visibility/1000).toFixed(0)
    document.getElementById('precipitation').innerHTML = precipitation.toFixed(1)
    document.getElementById('precipitation_probability').innerHTML = precipitation_probability.toFixed(0)

    renderCompassRose(outboundHeading, [
        {h: 20, wd: wd[0]},
        {h: 80, wd: wd[6]},
        {h: 120, wd: wd[10]}
    ]);

    return;
}


//Load the map when the page has finished loading.

//google.maps.event.addDomListener(window, 'load', initMap);


const map = L.map('map').setView([40.375540905462294, -74.601920573035], 14);

const tiles = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
maxZoom: 20,
attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'        ,
subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

map.attributionControl.setPrefix('Google map image') //remove flag

// Hazard zones (schools/kindergartens/hospitals/playgrounds) and the
// route around them. Cleared and redrawn on every calculation instead
// of piling up new layers each time.
var hazardLayer = L.layerGroup().addTo(map);
var routeLine = L.polyline([], { color: '#2f6fed', weight: 4, opacity: 0.85 }).addTo(map);

function renderHazardsAndRoute(hazards, path){
  hazardLayer.clearLayers();
  for (var i = 0; i < hazards.length; i++){
    var hz = hazards[i];
    var label = HAZARD_TYPE_LABEL[hz.type] || 'Restricted area';
    if (hz.name) label += ' \u2014 ' + hz.name;
    L.circle([hz.lat, hz.lng], {
      radius: hz.radius,
      color: '#e6484f',
      weight: 2,
      fillColor: '#e6484f',
      fillOpacity: 0.22
    }).bindTooltip(label).addTo(hazardLayer);
  }
  routeLine.setLatLngs(path.map(function(p){ return [p.lat, p.lng]; }));
}

map.on('click', addMarker);

function addMarker(e){
    // Add marker to map at click location; add popup window  

        if(marker === 0){
        marker=1;        
       //Create the marker.
   marker1 = new L.marker(coords = e.latlng,{draggable: true,autoPan: true ,color: 'car'}).addTo(map);
//marker1.valueOf()._icon.style.marker-color = 'red';
       marker1.bindTooltip("Start");    

       markerLocation(1, marker1);  
       //Listen for drag events!

marker1.on('dragend', function(event) {
 var latlng = event.target.getLatLng();
 markerLocation(1, marker1);
});      
    } else{
        if(marker === 1){
            marker=2;
            //Create the marker.
   marker2 = new L.marker(coords = e.latlng,{draggable: true,autoPan: true}).addTo(map);
//marker1.valueOf()._icon.style.marker-color = 'green'    
            marker2.bindTooltip("Destination");    
            markerLocation(2, marker2);
            //Listen for drag events!
     marker2.on('dragend', function(event) {
   markerLocation(2, marker2);  
});      
        } else{
            //Marker has already been added, so just change its location.
                var lat = (e.latlng.lat);
                var lng = (e.latlng.lng);
                var newLatLng = new L.LatLng(lat, lng);
                marker2.setLatLng(newLatLng);    
                markerLocation(2, marker2);  
        }
        }
}
