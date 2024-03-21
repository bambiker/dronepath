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
var lat1,lat2, lng1, lng2;

    lat1 = currentLocation.lat(); //latitude
    lng1 = currentLocation.lng(); //longitude    
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
lat1 = currentLocation.lat(); //latitude
    lng1 = currentLocation.lng(); //longitude

        }
    else
        {
var currentLocation = marker2.getPosition();  
lat2 = currentLocation.lat(); //latitude
    lng2 = currentLocation.lng(); //longitude
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
   const apiUrl = 'https://api.open-meteo.com/v1/forecast?latitude='+lat1+'&longitude='+lng1+'&hourly=wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m&forecast_days=1';

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
   
    drag=document.getElementById('drag').value
   
    heights = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]
    ws = []
    wd = []
    dist30max=[]
    timeupdown = []
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
diffangle=(wd[i]-dronedegrees)/180*Math.PI
angle = Math.cos(diffangle)*drag
timehor[i] = dist /  (speedhorizontal+ws[i]*angle)
timehorb[i] = dist / (speedhorizontal-ws[i]*angle)
dist30max[i]=(3600-timeupdown[i])*(speedhorizontal+ws[i]*angle)/((speedhorizontal+ws[i]*angle)+(speedhorizontal-ws[i]*angle))*(speedhorizontal-ws[i]*angle)
    }

    minhor = 0
    minhorb = 0
    maxdist30 = 0
    for (i=0;i<heights.length; i++) {
        if (timeupdown[i]+timehor[i]<timeupdown[minhor]+timehor[minhor])
            minhor=i
        if (timeupdown[i]+timehorb[i]<timeupdown[minhorb]+timehorb[minhorb])
            minhorb=i
        if (dist30max[i]>dist30max[maxdist30])
            maxdist30=i
    }
       
    document.getElementById('heightfore').innerHTML = heights[minhor].toFixed(2)
    document.getElementById('heightback').innerHTML = heights[minhorb].toFixed(2)
    document.getElementById('distance').innerHTML = dist.toFixed(2)
    document.getElementById('dronedir').innerHTML = dronedegrees.toFixed(2)
    document.getElementById('winddir').innerHTML = wd80.toFixed(2)
    document.getElementById('timenowind').innerHTML = (timeupdown[0]+(dist / speedhorizontal)).toFixed(2)
    document.getElementById('ws20').innerHTML = (ws[0]).toFixed(2)
    document.getElementById('ws80').innerHTML = (ws[6]).toFixed(2)
    document.getElementById('ws120').innerHTML = (ws[10]).toFixed(2)
    document.getElementById('timefore20').innerHTML = (timeupdown[0]+timehor[0]).toFixed(2)
    document.getElementById('timeback20').innerHTML = (timeupdown[0]+timehorb[0]).toFixed(2)
    document.getElementById('timefore80').innerHTML = (timeupdown[6]+timehor[6]).toFixed(2)
    document.getElementById('timeback80').innerHTML = (timeupdown[6]+timehorb[6]).toFixed(2)
    document.getElementById('timefore120').innerHTML = (timeupdown[10]+timehor[10]).toFixed(2)
    document.getElementById('timeback120').innerHTML = (timeupdown[10]+timehorb[10]).toFixed(2)

    travel20=2*timeupdown[0]+timehor[0]+timehorb[0]
    travelopt=timeupdown[minhor]+timehor[minhor]+timeupdown[minhorb]+timehorb[minhorb]
    //window.alert(2*timeupdown[0]+','+timehor[0]+timehorb[0]+'('+iminfore+','+iminback)



    document.getElementById('savesec').innerHTML = (travel20-travelopt).toFixed(2)
    document.getElementById('totaltime20').innerHTML = travel20.toFixed(2)

    return;
Hide quoted text

}


       
//Load the map when the page has finished loading.
google.maps.event.addDomListener(window, 'load', initMap);
