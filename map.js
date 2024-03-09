//map.js

// todo:
// if choose start and than use GPs it makes two start marker
// before calculate height test if there is start and destination
// change minimum height to be 20m
// let the user decide min and max heights
// tell the user, how much he will save if he fly at 20m, 120m
// let the user decide horizontal and vertical UAV speed

//Set up some of our variables.
var map; //Will contain map object.
var marker = 0; ////Has the user plotted their location marker?
       
//Function called to initialize / create the map.
//This is called when the page has loaded.
function initMap() {
    //The center location of our map.
    var centerOfMap = new google.maps.LatLng(40.375540905462294, -74.601920573035);

    //Map options.
    var options = {
      center: centerOfMap, //Set center.
      zoom: 15 //The zoom value.
    };

    //Create the map object.
    map = new google.maps.Map(document.getElementById('map'), options);

    //Listen for any clicks on the map.
    google.maps.event.addListener(map, 'click', function(event) {                
    //Get the location that the user clicked.
    var clickedLocation = event.latLng;
    //If the marker hasn't been added.
    if(marker === 0){
       //Create the marker.
       marker1 = new google.maps.Marker({
           position: clickedLocation,
           label: "start",
           map: map,
           draggable: true //make it draggable
            });
       markerLocation(1);  
       //Listen for drag events!
       google.maps.event.addListener(marker1, 'dragend', function(event){
           markerLocation(1);  
  });
        marker=1;
    } else{
        if(marker === 1){
            //Create the marker.
            marker2 = new google.maps.Marker({
                position: clickedLocation,
                label: "destination",
                map: map,
                draggable: true //make it draggable
            });
            markerLocation();
            //Listen for drag events!
            google.maps.event.addListener(marker2, 'dragend', function(event){
                markerLocation(2);  
           });
   marker=2;
        } else{
            //Marker has already been added, so just change its location.
            marker2.setPosition(clickedLocation);
                markerLocation(2);  
        }
        }
    });
}


function moveToLocation(lat, lng){
  const center = new google.maps.LatLng(lat, lng);
  // using global variable:
  window.map.panTo(center);
}

function setstartloc(lat, long)
{
    if(marker === 0){ // new marker
   marker1 = new google.maps.Marker({
       position: { lat: lat, lng: long },
       label: "start",
       map: map,
       draggable: true //make it draggable
   });
   //Listen for drag events!
   google.maps.event.addListener(marker1, 'dragend', function(event){
       markerLocation(1);  
   });
    marker=1;
    var currentLocation = marker1.getPosition();  
    document.getElementById('lat').value = currentLocation.lat(); //latitude
    document.getElementById('lng').value = currentLocation.lng(); //longitude    
    }
    else { //there is already marker
               markerLocation(1);  
         }
}

//This function will get the marker's current location and then add the lat/long
//values to our textfields so that we can save the location.
function markerLocation(sd){
    //Get location.
    if (sd===1)
        {
var currentLocation = marker1.getPosition();  
document.getElementById('lat').value = currentLocation.lat(); //latitude
    document.getElementById('lng').value = currentLocation.lng(); //longitude
        }
    else
        {
var currentLocation = marker2.getPosition();  
document.getElementById('lat2').value = currentLocation.lat(); //latitude
    document.getElementById('lng2').value = currentLocation.lng(); //longitude
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

async function getJSON() {
   const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude='+document.getElementById('lat').value+'&longitude='+document.getElementById('lng').value+'&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m&forecast_days=1';

    return fetch(apiUrl)
        .then((response)=>response.json())
        .then((responseJson)=>{return responseJson});
}

async function calcHeight() {
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

    startlat=document.getElementById('lat').value;
    startlng=document.getElementById('lng').value;
    destlat=document.getElementById('lat2').value;
    destlng=document.getElementById('lng2').value;
    difflat=startlat-destlat;
    difflng=startlng-destlng;
    var dronedegrees = Math.atan2(difflng, difflat) * 180 / 3.14159265;
    dronedegrees = (dronedegrees + 360) % 360;  // +360 for implementations where mod returns negative numbers
    dist=getDistanceFromLatLon(startlat,startlng,destlat, destlng);
//    window.alert(dronedegrees);
//    window.alert(dist);

//// time to go to 20m + time to go horizontaly
//    window.alert(ws80+ ' m/s '+ wd80 + ' de2222grees');
    speedup=6/2;
    speedhorizontal=18/2;
   
    drag=0.06

    height=10
    diffangle=(wd10-dronedegrees)/360*Math.PI
    angle = Math.cos(diffangle)*drag
    timeup10=2.*height/speedup
    timehorizontalws10 = dist / (speedhorizontal+ws10*angle)
    timehorizontalws10b = dist / (speedhorizontal-ws10*angle)

    height=80
    diffangle=(wd80-dronedegrees)/360*Math.PI
    angle = Math.cos(diffangle)*drag
    timeup80=2.*height/speedup
    timehorizontal = dist / speedhorizontal
    timehorizontalws80 = dist / (speedhorizontal+ws80*angle)
    timehorizontalws80b = dist / (speedhorizontal-ws80*angle)

    height=120
    diffangle=(wd120-dronedegrees)/360*Math.PI
    angle = Math.cos(diffangle)*drag
    timeup120=2.*height/speedup
    timehorizontalws120 = dist / (speedhorizontal+ws120*angle)
    timehorizontalws120b = dist / (speedhorizontal-ws120*angle)
    duration80=(timeup80+timehorizontalws80)+(timeup80+timehorizontalws80b)
    if ((timeup10+timehorizontalws10)<(timeup80+timehorizontalws80) && (timeup10+timehorizontalws10)<(timeup120+timehorizontalws120))
durationmin=timeup10+timehorizontalws10
    if ((timeup80+timehorizontalws80)<(timeup10+timehorizontalws10) && (timeup80+timehorizontalws80)<(timeup120+timehorizontalws120))
durationmin=timeup80+timehorizontalws80
    if ((timeup120+timehorizontalws120)<(timeup10+timehorizontalws10) && (timeup120+timehorizontalws120)<(timeup80+timehorizontalws80))
durationmin=timeup120+timehorizontalws120
    if ((timeup10+timehorizontalws10b)<(timeup80+timehorizontalws80b) && (timeup10+timehorizontalws10b)<(timeup120+timehorizontalws120b))
durationmin=durationmin+timeup10+timehorizontalws10b
    if ((timeup80+timehorizontalws80b)<(timeup10+timehorizontalws10b) && (timeup80+timehorizontalws80b)<(timeup120+timehorizontalws120b))
durationmin=durationmin+timeup80+timehorizontalws80b
    if ((timeup120+timehorizontalws120b)<(timeup10+timehorizontalws10b) && (timeup120+timehorizontalws120b)<(timeup80+timehorizontalws80b))
durationmin=durationmin+timeup120+timehorizontalws120b

    stat = dist.toFixed(2)+','+speedhorizontal.toFixed(2)+','+ws120.toFixed(2)+','+diffangle.toFixed(2)+':'+
                 'wind speed (@80m) '+ ws80.toFixed(2) +' m/s ' + wd80 + ' degrees\n' +
                 'distance: '+dist.toFixed(2)+ ' meters\n'+
                 'no wind:'+(timeup80+timehorizontal).toFixed(2)+ ' sec\n'+
                 '(@10m): '+(timeup10+timehorizontalws10).toFixed(2)+ ' sec\n\r'+
                 '(80m): '+(timeup80+timehorizontalws80).toFixed(2)+ ' sec\n\r'+
                 '(@120m): '+(timeup120+timehorizontalws120).toFixed(2)+ ' sec\n'+
                 'and back\n'+
                 '(@10m): '+(timeup10+timehorizontalws10b).toFixed(2)+ ' sec\n'+
                 '(@80m): '+(timeup80+timehorizontalws80b).toFixed(2)+ ' sec\n'+
                 '(@120m): '+(timeup120+timehorizontalws120b).toFixed(2)+ ' sec \n'+' duration '+durationmin.toFixed(2)+' instead of'+duration80.toFixed(2)+'>'+(1-(duration80-durationmin)/duration80).toFixed(2)
xa.innerHTML = stat;
    return stat;
}


       
//Load the map when the page has finished loading.
google.maps.event.addDomListener(window, 'load', initMap);
