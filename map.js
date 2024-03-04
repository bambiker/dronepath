//map.js

//Set up some of our variables.
var map; //Will contain map object.
var marker = false; ////Has the user plotted their location marker? 
        
//Function called to initialize / create the map.
//This is called when the page has loaded.
function initMap() {

    //The center location of our map.
    var centerOfMap = new google.maps.LatLng(52.357971, -6.516758);

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
        if(marker === false){
            //Create the marker.
            marker = new google.maps.Marker({
                position: clickedLocation,
                map: map,
                draggable: true //make it draggable
            });
            //Listen for drag events!
            google.maps.event.addListener(marker, 'dragend', function(event){
                markerLocation();
            });
        } else{
            //Marker has already been added, so just change its location.
            marker.setPosition(clickedLocation);
        }
        //Get the marker's location.
        markerLocation();
    });
}


function moveToLocation(lat, lng){
  const center = new google.maps.LatLng(lat, lng);
  // using global variable:
  window.map.panTo(center);
}

//This function will get the marker's current location and then add the lat/long
//values to our textfields so that we can save the location.
function markerLocation(){
    //Get location.
    var currentLocation = marker.getPosition();
    //Add lat and lng values to a field that we can save.
    if(document.getElementById('lat').value==="")    
        {
    document.getElementById('lat').value = currentLocation.lat(); //latitude
    document.getElementById('lng').value = currentLocation.lng(); //longitude

     var location = new google.maps.LatLng(currentLocation.lat(), currentLocation.lng());    
     var map = new google.maps.Map(map_canvas, map_options);
           
     new google.maps.Marker({
        position: location,
        map: map
    });
        
        }
        else
        {
    document.getElementById('lat2').value = currentLocation.lat(); //latitude
    document.getElementById('lng2').value = currentLocation.lng(); //longitude

        
     var location = new google.maps.LatLng(currentLocation.lat(), currentLocation.lng());    
     var map = new google.maps.Map(map_canvas, map_options);
           
     new google.maps.Marker({
        position: location,
        map: map
    });
        
        
        }
            
}
        
        
//Load the map when the page has finished loading.
google.maps.event.addDomListener(window, 'load', initMap);
