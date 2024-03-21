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
