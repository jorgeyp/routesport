var centre = new google.maps.LatLng(43.5314284, -5.6684546);
var map;
var wmsUrl = "http://ide.gijon.es:8080/geoserver/wms?SERVICE=WMS&VERSION=1.1.1";
var wmsLayers = "Gijon:LU_Zona_Verde,Gijon:Rutas_Verdes,Gijon:Golf,Gijon:Instalaciones_Deportivas,Gijon:Playas";
//var wmsStyle = "polygon,line"
var marker;
var TILE_SIZE = 256;

var TileWMS = function(coord,zoom) {
  var proj = map.getProjection(); 
  var zfactor = Math.pow(2, zoom); 
  var top = proj.fromPointToLatLng(new google.maps.Point(coord.x * TILE_SIZE / zfactor, coord.y * TILE_SIZE / zfactor) ); 
  var bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * TILE_SIZE / zfactor, (coord.y + 1) * TILE_SIZE / zfactor)); 
  var bbox = top.lng() + "," + bot.lat() + "," + bot.lng() + "," + top.lat();
      
  var wmsParameters = wmsUrl + "&REQUEST=GetMap&CRS=EPSG:4326&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true&LAYERS=" + wmsLayers 
//  + "&STYLE=" + wmsStyle 
  + "&BBOX=" + bbox;

  console.log(wmsParameters)
  
  return wmsParameters;
}

function addMarker(location) {
  if(marker != null)  
    marker.setMap(null);
  marker = new google.maps.Marker({
    position: location,
    map: map
    //icon:
  });
}

// The mapping between latitude, longitude and pixels is defined by the web
// mercator projection.
// From: https://developers.google.com/maps/documentation/javascript/examples/map-coordinates
function project(latLng) {
  var siny = Math.sin(latLng.lat() * Math.PI / 180);

  // Truncating to 0.9999 effectively limits latitude to 89.189. This is
  // about a third of a tile past the edge of the world tile.
  siny = Math.min(Math.max(siny, -0.9999), 0.9999);

  return new google.maps.Point(
      TILE_SIZE * (0.5 + latLng.lng() / 360),
      TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
}

function initialize() {
  console.log("Init")

  var options = {
    center: centre,
    zoom: 14,
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
    tileSize: new google.maps.Size(TILE_SIZE, TILE_SIZE),
    opacity: 0.35
  };
  var overlayWMS = new google.maps.ImageMapType(overlayOptions);
  map.overlayMapTypes.push(overlayWMS);
  
  google.maps.event.addListener(map, 'click', function(event) {
    var scale = 1 << map.getZoom();
    var worldCoordinate = project(event.latLng);
    var pixelCoordinate = new google.maps.Point(
        Math.floor(worldCoordinate.x * scale),
        Math.floor(worldCoordinate.y * scale));
    var tileCoordinate = new google.maps.Point(
      Math.floor(worldCoordinate.x * scale / TILE_SIZE),
      Math.floor(worldCoordinate.y * scale / TILE_SIZE));
    
//    var projection = map.getProjection();
//    var pixel = projection.fromLatLngToContainerPixel(event.latLng);
    console.log(tileCoordinate);
    addMarker(event.latLng);
  });
  
}
