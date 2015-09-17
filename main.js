var centre = new google.maps.LatLng(43.5314284, -5.6684546);
var map;
var wmsUrl = "http://ide.gijon.es:8080/geoserver/wms?SERVICE=WMS&VERSION=1.1.1";
var wmsLayers = "Gijon:LU_Zona_Verde,Gijon:Rutas_Verdes";
//var wmsStyle = "polygon,line"

var TileWMS = function(coord,zoom) {
  var proj = map.getProjection(); 
  var zfactor = Math.pow(2, zoom); 
  var top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor) ); 
  var bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor)); 
  var bbox = top.lng() + "," + bot.lat() + "," + bot.lng() + "," + top.lat();
      
  var wmsParameters = wmsUrl + "&REQUEST=GetMap&CRS=EPSG:4326&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true&LAYERS=" + wmsLayers 
//  + "&STYLE=" + wmsStyle 
  + "&BBOX=" + bbox;

  return wmsParameters;
}

function initialize() {
  console.log("Init")

  var options = {
    center: centre,
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    styles: [{
        elementType: "labels",
        stylers: [
          { visibility: "off" }
        ]
      }]
  };

  map = new google.maps.Map(document.getElementById("map"), options);
  
  var overlayOptions = {
      getTileUrl: TileWMS,
      tileSize: new google.maps.Size(256, 256)
  };
  var overlayWMS = new google.maps.ImageMapType(overlayOptions);
  map.overlayMapTypes.push(overlayWMS);
  
}
