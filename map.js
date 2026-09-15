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
  panel: '#17223a'
};

function polarToXY(cx, cy, r, deg){
  var rad = (deg) * Math.PI / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function renderAltitudeTape(heights, minhorIndex, minhorbIndex){
  var el = document.getElementById('altTape');
  if (!el) return;

  var w = 220, h = 240;
  var top = 20, bottom = h - 20;
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

  var yFore = yFor(heights[minhorIndex]);
  var yBack = yFor(heights[minhorbIndex]);

  var markers =
    '<g>' +
      '<line x1="' + trackX + '" y1="' + yFore + '" x2="' + (trackX + 60) + '" y2="' + yFore + '" stroke="' + VIZ_COLORS.accent + '" stroke-width="2"/>' +
      '<circle cx="' + trackX + '" cy="' + yFore + '" r="4" fill="' + VIZ_COLORS.accent + '"/>' +
      '<text x="' + (trackX + 64) + '" y="' + (yFore + 4) + '" font-family="JetBrains Mono, monospace" font-size="11" fill="' + VIZ_COLORS.accent + '">' + heights[minhorIndex] + 'm out</text>' +
    '</g>' +
    '<g>' +
      '<line x1="' + (trackX - 40) + '" y1="' + yBack + '" x2="' + trackX + '" y2="' + yBack + '" stroke="' + VIZ_COLORS.accent2 + '" stroke-width="2" stroke-dasharray="1 0"/>' +
      '<circle cx="' + trackX + '" cy="' + yBack + '" r="4" fill="' + VIZ_COLORS.accent2 + '"/>' +
      '<text x="4" y="' + (yBack + 4) + '" font-family="JetBrains Mono, monospace" font-size="11" fill="' + VIZ_COLORS.accent2 + '" text-anchor="start">' + heights[minhorbIndex] + 'm in</text>' +
    '</g>';

  var svg =
    '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Altitude tape showing the recommended outbound and return heights">' +
      '<text x="' + trackX + '" y="14" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">ALTITUDE (m)</text>' +
      track + ticks + markers +
    '</svg>';

  el.innerHTML = svg;
}

function renderCompassRose(droneDeg, windPoints){
  var el = document.getElementById('compassRose');
  if (!el) return;

  var w = 220, h = 240;
  var cx = w / 2, cy = 128, r = 78;

  var ring = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + VIZ_COLORS.line + '" stroke-width="1.5"/>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + VIZ_COLORS.line + '"/>';

  var labels = [0, 90, 180, 270];
  var labelText = ['0/360', '90', '180', '270'];
  var ticks = '';
  for (var i = 0; i < labels.length; i++){
    var p1 = polarToXY(cx, cy, r, labels[i]);
    var p2 = polarToXY(cx, cy, r - 8, labels[i]);
    var pt = polarToXY(cx, cy, r + 14, labels[i]);
    ticks += '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" stroke="' + VIZ_COLORS.muted + '" stroke-width="1.5"/>';
    ticks += '<text x="' + pt.x + '" y="' + (pt.y + 3) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">' + labelText[i] + '</text>';
  }

  var droneTip = polarToXY(cx, cy, r - 6, droneDeg);
  var droneArrow = '<line x1="' + cx + '" y1="' + cy + '" x2="' + droneTip.x + '" y2="' + droneTip.y + '" stroke="' + VIZ_COLORS.ink + '" stroke-width="2.5"/>' +
                    '<circle cx="' + droneTip.x + '" cy="' + droneTip.y + '" r="4" fill="' + VIZ_COLORS.ink + '"/>';

  var windDots = '';
  var windShades = [VIZ_COLORS.accent2, VIZ_COLORS.accent, VIZ_COLORS.line];
  for (var j = 0; j < windPoints.length; j++){
    var wp = polarToXY(cx, cy, r, windPoints[j].wd);
    windDots += '<circle cx="' + wp.x + '" cy="' + wp.y + '" r="5" fill="' + windShades[j % windShades.length] + '" stroke="' + VIZ_COLORS.panel + '" stroke-width="1"/>';
  }

  var legend =
    '<g font-family="JetBrains Mono, monospace" font-size="10">' +
      '<circle cx="14" cy="' + (h - 42) + '" r="4" fill="' + VIZ_COLORS.ink + '"/>' +
      '<text x="24" y="' + (h - 38) + '" fill="' + VIZ_COLORS.muted + '">drone heading</text>' +
      '<circle cx="14" cy="' + (h - 26) + '" r="4" fill="' + VIZ_COLORS.accent2 + '"/>' +
      '<text x="24" y="' + (h - 22) + '" fill="' + VIZ_COLORS.muted + '">wind @ 20/80/120m</text>' +
    '</g>';

  var svg =
    '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Compass showing drone heading and wind direction at three altitudes">' +
      '<text x="' + cx + '" y="14" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="' + VIZ_COLORS.muted + '">HEADING</text>' +
      ring + ticks + windDots + droneArrow + legend +
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

    minhor = 0
    minhorb = 0
    for (i=0;i<heights.length; i++) {
        if (timeupdown[i]+timehor[i]<timeupdown[minhor]+timehor[minhor])
            minhor=i
        if (timeupdownback[i]+timehorb[i]<timeupdownback[minhorb]+timehorb[minhorb])
            minhorb=i
    }

    tofixed=0
    document.getElementById('heightfore').innerHTML = heights[minhor].toFixed(tofixed)
    document.getElementById('heightback').innerHTML = heights[minhorb].toFixed(tofixed)
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

    travel20=timeupdown[0]+timeupdownback[0]+timehor[0]+timehorb[0]
    travelopt=timeupdown[minhor]+timehor[minhor]+timeupdownback[minhorb]+timehorb[minhorb]

    document.getElementById('savesec').innerHTML = (travel20-travelopt).toFixed(2)
    document.getElementById('totaltime20').innerHTML = travel20.toFixed(tofixed)
    document.getElementById('savepercent').innerHTML = "(" +((travel20-travelopt)/travel20*100).toFixed(2) +"%)"

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
