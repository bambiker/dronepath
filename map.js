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
  mavic3classic: { name: 'DJI Mavic 3 Classic', hor: 21, asc: 8, des: 6 },
  mini4pro:      { name: 'DJI Mini 4 Pro',       hor: 16, asc: 5, des: 5 },
  air3:          { name: 'DJI Air 3',            hor: 21, asc: 10, des: 10 },
  matrice300:    { name: 'DJI Matrice 300 RTK',  hor: 23, asc: 6, des: 5 },
  evolite:       { name: 'Autel EVO Lite+',      hor: 18, asc: 5, des: 4 }
};

function applyDronePreset(){
  var sel = document.getElementById('droneModel');
  var preset = DRONE_PRESETS[sel.value];
  if (!preset) return; // "Custom" - leave whatever the user has typed
  document.getElementById('hor').value = preset.hor;
  document.getElementById('asc').value = preset.asc;
  document.getElementById('des').value = preset.des;
}

// If the person hand-edits a speed field away from the selected
// preset's value, flip the picker to "Custom" so it doesn't silently
// keep claiming to be that drone.
function checkCustom(){
  var sel = document.getElementById('droneModel');
  var preset = DRONE_PRESETS[sel.value];
  if (!preset) return;
  var hor = parseFloat(document.getElementById('hor').value);
  var asc = parseFloat(document.getElementById('asc').value);
  var des = parseFloat(document.getElementById('des').value);
  if (hor !== preset.hor || asc !== preset.asc || des !== preset.des){
    sel.value = 'custom';
  }
}

function markUnsafe(id, unsafe, reason){
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('unsafe-value', unsafe);
  el.title = unsafe ? reason : '';
}

async function getJSON() {
   const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude='+lat1+'&longitude='+lng1+'&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,visibility,precipitation_probability,precipitation&forecast_days=1';

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

function polarToXY(cx, cy, r, deg){
  var rad = (deg) * Math.PI / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function renderAltitudeTape(heights, minhorIndex, minhorbIndex){
  var el = document.getElementById('altTape');
  if (!el) return;

  var w = 220, h = 300;
  var top = 20, bottom = h - 60;
  var minH = heights[0], maxH = heights[heights.length - 1];
  var trackX = 70;

  function yFor(val){
    return bottom - ((val - minH) / (maxH - minH)) * (bottom - top);
  }

  var ticks = '';
  for (var i = 0; i < heights.length; i++){
    var y = yFor(heights[i]);
    var major = (heights[i] % 20 === 0);
    ticks += '<line x1="' + (trackX - (major ? 10 : 6)) + '" y1="' + y + '" x2="' + trackX + '" y2="' + y + '" stroke="' + VIZ_COLORS.line + '" stroke-width="1"/>';
    if (major){
      ticks += '<text x="' + (trackX - 14) + '" y="' + (y + 4) + '" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">' + heights[i] + '</text>';
    }
  }

  var track = '<line x1="' + trackX + '" y1="' + top + '" x2="' + trackX + '" y2="' + bottom + '" stroke="' + VIZ_COLORS.line + '" stroke-width="2"/>';

  var markers = '';

  if (minhorIndex !== -1){
    var yFore = yFor(heights[minhorIndex]);
    markers +=
      '<g>' +
        '<line x1="' + trackX + '" y1="' + yFore + '" x2="' + (trackX + 60) + '" y2="' + yFore + '" stroke="' + VIZ_COLORS.accent + '" stroke-width="2"/>' +
        '<circle cx="' + trackX + '" cy="' + yFore + '" r="4" fill="' + VIZ_COLORS.accent + '"/>' +
        '<text x="' + (trackX + 64) + '" y="' + (yFore + 4) + '" font-family="JetBrains Mono, monospace" font-size="11" fill="' + VIZ_COLORS.accent + '">' + heights[minhorIndex] + 'm out</text>' +
      '</g>';
  } else {
    markers += '<text x="' + (trackX + 4) + '" y="' + (top + 4) + '" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.danger + '">no safe out height</text>';
  }

  if (minhorbIndex !== -1){
    var yBack = yFor(heights[minhorbIndex]);
    markers +=
      '<g>' +
        '<line x1="' + (trackX - 40) + '" y1="' + yBack + '" x2="' + trackX + '" y2="' + yBack + '" stroke="' + VIZ_COLORS.accent2 + '" stroke-width="2" stroke-dasharray="1 0"/>' +
        '<circle cx="' + trackX + '" cy="' + yBack + '" r="4" fill="' + VIZ_COLORS.accent2 + '"/>' +
        '<text x="4" y="' + (yBack + 4) + '" font-family="JetBrains Mono, monospace" font-size="11" fill="' + VIZ_COLORS.accent2 + '" text-anchor="start">' + heights[minhorbIndex] + 'm in</text>' +
      '</g>';
  } else {
    markers += '<text x="' + (trackX + 4) + '" y="' + (top + 18) + '" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.danger + '">no safe return height</text>';
  }

  var svg =
    '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Altitude tape showing the recommended outbound and return heights">' +
      '<text x="' + trackX + '" y="14" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">ALTITUDE (m)</text>' +
      track + ticks + markers +
    '</svg>';

  el.innerHTML = svg;
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
  // and always stays readable even if directions overlap).
  var windArrows = '';
  var radii = [r * 0.45, r * 0.62, r * 0.8];
  for (var j = 0; j < windPoints.length; j++){
    var color = WIND_COLORS[j % WIND_COLORS.length];
    windArrows += drawArrow(cx, cy, radii[j], windPoints[j].wd, color, 2, null, 0);
  }

  var droneArrow = drawArrow(cx, cy, r - 4, droneDeg, VIZ_COLORS.ink, 2.5, null, 0);

  // Legend: one row per series with its actual heading, since color
  // alone on an overlapping compass is hard to read at a glance.
  var legendRows = [
    { color: VIZ_COLORS.ink, text: 'drone heading ' + droneDeg.toFixed(0) + '\u00B0' }
  ];
  var windLabels = ['wind 20m ', 'wind 80m ', 'wind 120m '];
  for (var k = 0; k < windPoints.length; k++){
    legendRows.push({
      color: WIND_COLORS[k % WIND_COLORS.length],
      text: windLabels[k] + windPoints[k].wd.toFixed(0) + '\u00B0'
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
    '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Compass showing drone heading and wind direction at 20, 80 and 120 meters">' +
      '<text x="' + cx + '" y="14" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">HEADING</text>' +
      ring + ticks + windArrows + droneArrow + legend +
    '</svg>';

  el.innerHTML = svg;
}

async function calcHeight() {

    if (marker==0){
       window.alert('please choose location');
       return;
        }
    const json = await this.getJSON();  // command waits until completion

    const d = new Date();
    let hour = d.getUTCHours();
    var mydata = JSON.stringify(json, null, 2);

ws10=json.hourly.wind_speed_10m[hour-1]/3.6; //array start at zero
ws80=json.hourly.wind_speed_80m[hour-1]/3.6; //array start at zero
ws120=json.hourly.wind_speed_120m[hour-1]/3.6; //array start at zero
wd10=json.hourly.wind_direction_10m[hour-1]; //array start at zero
wd80=json.hourly.wind_direction_80m[hour-1]; //array start at zero
wd120=json.hourly.wind_direction_120m[hour-1]; //array start at zero
precipitation_probability=json.hourly.precipitation_probability[hour-1];
precipitation=json.hourly.precipitation[hour-1];
visibility=json.hourly.visibility[hour-1];

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
    dist=getDistanceFromLatLon(startlat,startlng,destlat, destlng);
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
timehor[i] = dist /  (speedhorizontal+ws[i]*angle)
timehorb[i] = dist / (speedhorizontalback-ws[i]*angle)
    }

    // A height isn't flyable for a leg if the wind speed there meets
    // or exceeds the drone's horizontal speed for that leg (loaded
    // outbound, or with the return payload) - the drone couldn't make
    // reliable headway against it.
    flyableOut = []
    flyableBack = []
    for (i=0;i<heights.length; i++) {
        flyableOut[i] = ws[i] < speedhorizontal
        flyableBack[i] = ws[i] < speedhorizontalback
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
    document.getElementById('distance').innerHTML = dist.toFixed(tofixed)
    document.getElementById('dronedir').innerHTML = dronedegrees.toFixed(tofixed)
    // document.getElementById('windrose').innerHTML = wd[0].toFixed(tofixed)
    document.getElementById('timenowind').innerHTML = (timeupdown[0]+timeupdownback[0]+(dist / speedhorizontal)+(dist / speedhorizontalback)).toFixed(tofixed)
    document.getElementById('ws20').innerHTML = (ws[0]).toFixed(1)
    document.getElementById('ws80').innerHTML = (ws[6]).toFixed(1)
    document.getElementById('ws120').innerHTML = (ws[10]).toFixed(1)
    document.getElementById('wd20').innerHTML = (wd[0]).toFixed(0)
    document.getElementById('wd80').innerHTML = (wd[6]).toFixed(0)
    document.getElementById('wd120').innerHTML = (wd[10]).toFixed(0)
    document.getElementById('timefore20').innerHTML = (timeupdown[0]+timehor[0]).toFixed(tofixed)
    document.getElementById('timeback20').innerHTML = (timeupdownback[0]+timehorb[0]).toFixed(tofixed)
    document.getElementById('timefore80').innerHTML = (timeupdown[6]+timehor[6]).toFixed(tofixed)
    document.getElementById('timeback80').innerHTML = (timeupdownback[6]+timehorb[6]).toFixed(tofixed)
    document.getElementById('timefore120').innerHTML = (timeupdown[10]+timehor[10]).toFixed(tofixed)
    document.getElementById('timeback120').innerHTML = (timeupdownback[10]+timehorb[10]).toFixed(tofixed)

    var unsafeReasonOut = "Wind here is at or above this drone's outbound horizontal speed - not safe to fly this leg at this height.";
    var unsafeReasonBack = "Wind here is at or above this drone's return horizontal speed - not safe to fly this leg at this height.";
    markUnsafe('timefore20', !flyableOut[0], unsafeReasonOut)
    markUnsafe('timeback20', !flyableBack[0], unsafeReasonBack)
    markUnsafe('timefore80', !flyableOut[6], unsafeReasonOut)
    markUnsafe('timeback80', !flyableBack[6], unsafeReasonBack)
    markUnsafe('timefore120', !flyableOut[10], unsafeReasonOut)
    markUnsafe('timeback120', !flyableBack[10], unsafeReasonBack)
    markUnsafe('ws20', !flyableOut[0] || !flyableBack[0], "Wind here is at or above this drone's horizontal speed for at least one leg.")
    markUnsafe('ws80', !flyableOut[6] || !flyableBack[6], "Wind here is at or above this drone's horizontal speed for at least one leg.")
    markUnsafe('ws120', !flyableOut[10] || !flyableBack[10], "Wind here is at or above this drone's horizontal speed for at least one leg.")

    var flyWarning = document.getElementById('flyWarning')
    var savingsText = document.getElementById('savingsText')

    if (minhor!==-1 && minhorb!==-1){
        flyWarning.style.display = 'none'
        savingsText.style.display = ''

        travel20=timeupdown[0]+timeupdownback[0]+timehor[0]+timehorb[0]
        travelopt=timeupdown[minhor]+timehor[minhor]+timeupdownback[minhorb]+timehorb[minhorb]

        document.getElementById('savesec').innerHTML = (travel20-travelopt).toFixed(2)
        document.getElementById('totaltime20').innerHTML = travel20.toFixed(tofixed)
        document.getElementById('savepercent').innerHTML = "(" +((travel20-travelopt)/travel20*100).toFixed(2) +"%)"
    } else {
        savingsText.style.display = 'none'
        var legs = []
        if (minhor===-1) legs.push('outbound')
        if (minhorb===-1) legs.push('return')
        flyWarning.innerHTML = "Wind is as strong as, or stronger than, this drone's horizontal speed at every altitude between 20 and 120 m on the " + legs.join(' and ') + " leg. We can't recommend a safe height here &mdash; consider a faster drone, a different time, or don't fly."
        flyWarning.style.display = 'block'
    }

    document.getElementById('visibility').innerHTML = (visibility/1000).toFixed(0)
    document.getElementById('precipitation').innerHTML = precipitation.toFixed(1)
    document.getElementById('precipitation_probability').innerHTML = precipitation_probability.toFixed(0)

    renderAltitudeTape(heights, minhor, minhorb);
    renderCompassRose(dronedegrees, [
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
