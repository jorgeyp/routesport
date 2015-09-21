var centre = new google.maps.LatLng(43.5314284, -5.6684546);
var oviedo = new google.maps.LatLng(43.351583,-5.849862);
var mapZoom = 14;
var map;
var markers = [];
var waypts = [];
var positions = [];
var elevator;
var chart;
var polyline;
var directionDisplay;
var directionsService;
var wmsUrl = "http://ide.gijon.es:8080/geoserver/wms?SERVICE=WMS&VERSION=1.1.1";
var wmsLayers = ["Gijon:LU_Zona_Verde", "Gijon:Rutas_Verdes", "Gijon:Golf", "Gijon:Instalaciones_Deportivas", "Gijon:Playas"];
var paramWmsLayers;
var bbox;
var wmsParameters;
var radius = 0;
var radiusOverlay;
var routeType = "all";
var geocoder;
var infowindows = [];

var defaultWaypoints = [
  {name: "Entrada", lat: 43.353019, lng: -5.850231, img: "http://i.imgur.com/fQcThQX.jpg"},
  {name: "Espalderas", lat: 43.352296, lng: -5.850522, img: "http://i.imgur.com/0QmfDuE.jpg"},
  {name: "Skatepark", lat: 43.351875, lng: -5.849913, img: "http://i.imgur.com/AbQAJkB.jpg"},
  {name: "Rocódromo", lat: 43.351361, lng: -5.850337, img: "http://i.imgur.com/VZsyAGM.jpg"},
  {name: "Gimnasio", lat: 43.351007, lng: -5.850062, img: "http://i.imgur.com/l4XTljd.jpg"},
  {name: "Barras", lat: 43.350974, lng: -5.849584, img: "http://i.imgur.com/9XtU0by.jpg"},
  {name: "Pivotes", lat: 43.350915, lng: -5.848867, img: "http://i.imgur.com/5kvszyT.jpg"}
]

google.load("visualization", "1", {packages: ["columnchart"]});

function initialize() {
 
  // Variables para dibujar la ruta
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();

  // Opciones del mapa
  var options = {
    center: oviedo,
    zoom: 17,
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
         mapTypeIds: [
          google.maps.MapTypeId.HYBRID,
          google.maps.MapTypeId.ROADMAP,
          google.maps.MapTypeId.TERRAIN,
          google.maps.MapTypeId.SATELLITE
        ],
        position: google.maps.ControlPosition.LEFT_TOP
    },
    zoomControl: true,
    zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
    }
  };

  // Crear mapa
  map = new google.maps.Map(document.getElementById("map"), options);
  map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
  
  // Añadir evento para crear los marcadores
  google.maps.event.addListener(map, 'click', function(event) {
    setMarkers(event.latLng);
  });

  geocoder = new google.maps.Geocoder();

  // Al inicio seleccionar todos los checkbox y añadir las capas
  selectAllCheckboxes();
  setCheckLayers();
//  if (markers == null) {
    setDefaultWaypoints(); 
//  }
}

function selectAllCheckboxes() {
  var checkboxes = document.getElementsByTagName("input");
  for (var i = 0;i < checkboxes.length;i++){
    if (checkboxes[i].type === 'checkbox'){
      checkboxes[i].checked = true;
    }
  }
}

function setCheckLayers () {
  var checkboxes = document.getElementsByTagName("input");
  var indexLayers;
  var layers = [];
  var counter = 0;
  paramWmsLayers = "";

  for(var i=0;i<checkboxes.length;i++) {
    if(checkboxes[i].type === 'checkbox' && checkboxes[i].checked==true) {
      var checkboxValue = checkboxes[i].value;
      for(var j=0;j<wmsLayers.length;j++) {
        if(checkboxValue == wmsLayers[j]) {
          layers[counter] = j;
          counter++;
        }
      }
    }
  }
  indexLayers = layers.length;
  for(var i=0;i<layers.length;i++) {
    if(i!=(indexLayers-1)) {
      paramWmsLayers +=wmsLayers[layers[i]]+",";
    } else if(i==(indexLayers-1)) {
      paramWmsLayers +=wmsLayers[layers[i]]
    }
  }
  setMapLayers();
}

function setMapLayers() {
  // Sí no hay niguna capa elegida, simplemente borrar todas las capas
  if(map.overlayMapTypes!=null) {
    map.overlayMapTypes.clear();
  }
  // Visualizar solamente las capas seleccionadas sí hay algún layer en el param paramWmsLayers
  if(paramWmsLayers!=null) {
    var overlayOptions = {
      getTileUrl: TileWMS,
      tileSize: new google.maps.Size(256, 256),
      opacity: 0.35
    };
    var overlayWMS = new google.maps.ImageMapType(overlayOptions);
    map.overlayMapTypes.push(overlayWMS);
  }
}

// Crear la url para pedir las capas (WMS)
var TileWMS = function(coord,zoom) {
  var proj = map.getProjection(); 
  var zfactor = Math.pow(2, zoom); 
  var top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor) ); 
  var bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor)); 
  bbox = top.lng() + "," + bot.lat() + "," + bot.lng() + "," + top.lat();
      
  var wmsParameters = wmsUrl + "&REQUEST=GetMap&CRS=EPSG:4326&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true&LAYERS=" + paramWmsLayers 
//  + "&STYLE=" + wmsStyle 
  + "&BBOX=" + bbox;
  return wmsParameters;
}

// Añadir marcadores en el mapa
function setMarkers(location) {
  var marker;
  if(markers.length==0) {
    // Sí es el primer marcador -> verde y el resto en rojo
    var pinColor = "00e13c";
  } else {
    var pinColor = "fe7569";
  }
  var pin = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));
  marker = new google.maps.Marker(
  {
    position: {
        lat: location.lat(),
        lng: location.lng()
      },
    map: map,
    icon: pin
  });
  var infowindow = new google.maps.InfoWindow({
    content: '<div id="streetview" style="width:500px;height:500px;"></div>'
  });
  marker.addListener('click', function() {
    infowindow.open(map, marker);
    pano = new google.maps.StreetViewPanorama(document.getElementById("streetview"));
    pano.bindTo('position', marker);
  });
  markers.push(marker);
  positions.push({"lat":location.lat(), "lng":location.lng()});
}

// Calcular la ruta desde el origen al final con los puntos intermedios y dibujar la línea
function calculateAndDisplayRoute() {
  directionsDisplay.setMap(map);
  var lastIndex = markers.length-1;
  for (var i = 1; i <= lastIndex; i++) {
      if (routeType == "radius") {
        var start = markers[0]
        var distance = google.maps.geometry.spherical.computeDistanceBetween(start.position, markers[i].position)
        console.log(distance)
        if (distance > radius) {
          console.log("mayor")
          continue;
        }
      }
      waypts.push({
        location: markers[i].position,
        stopover: true
      });
  }

  var request = {
    origin: markers[0].position,
    destination: markers[0].position,
    waypoints: waypts,
    optimizeWaypoints: true,
    travelMode: google.maps.TravelMode.WALKING
  };
  hiddeMarkers();
  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(result);
    }
  });
  if (radiusOverlay != null)
    radiusOverlay.setMap(null);
}

// Esconder los marcadores que pone el usuario ya que al crear la ruta google pone los suyos
function hiddeMarkers() {
  for(var i=0;i<markers.length;i++){
    markers[i].setVisible(false);
  }
}

// Borrar los marcadores que pone el usuario
function deleteMarkers() {
  for(var i=0;i<markers.length;i++){
    markers[i].setMap(null);
  }
  if(waypts.length!=0) {
    waypts = [];
  }
  markers = [];
  directionsDisplay.setMap(null);
  map.setCenter(centre)
  map.setZoom(mapZoom);
  if (radiusOverlay != null)
    radiusOverlay.setMap(null);
}

// Añadir el gráfico de elevación y la ruta detallada en el modal.
function routeDetailInformation() {

  if(markers.length==0) {
    document.getElementById('no_route_txt').innerHTML = "You have to calculate a route";
    document.getElementById("elevation_title").className = "txt_hidden";
  } else {
    document.getElementById("elevation_title").className = "txt_show";
    document.getElementById("no_route_txt").className = "txt_hidden";
    // Create an ElevationService.
    elevator = new google.maps.ElevationService();
    // Draw the path, using the Visualization API and the Elevation service.
    drawPath();

    directionsDisplay.setPanel(document.getElementById("route_information"));
    directionsDisplay.setDirections(result);
  }
}

// Dibujar el recorrido de la elevación
function drawPath() {

  // Create a new chart in the elevation_chart DIV.
  chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));

  // Create a PathElevationRequest object using this array.
  // Ask for 256 samples along that path.
  var pathRequest = {
    'path': positions,
    'samples': 256
  }

  // Initiate the path request.
  elevator.getElevationAlongPath(pathRequest, plotElevation);
}

// Añadir el recorridoa l gráfico
function plotElevation(results, status) {
  if (status == google.maps.ElevationStatus.OK) {
    elevations = results;

    // Extract the elevation samples from the returned results
    // and store them in an array of LatLngs.
    var elevationPath = [];
    for (var i = 0; i < results.length; i++) {
      elevationPath.push(elevations[i].location);
    }

    // Extract the data from which to populate the chart.
    // Because the samples are equidistant, the 'Sample'
    // column here does double duty as distance along the
    // X axis.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Sample');
    data.addColumn('number', 'Elevation');
    for (var i = 0; i < results.length; i++) {
      data.addRow(['', elevations[i].elevation]);
    }

    // Draw the chart using the data within its DIV. 
    document.getElementById('elevation_chart').style.display = 'block';
    chart.draw(data, {
      width: 640,
      height: 200,
      legend: 'none',
      titleY: 'Elevation (m)'
    });
  }
} 

function setRadius(value) {
  radius = parseInt(value);
  document.getElementById("radius-label").innerHTML = "Radius: " + radius + " meters";
}

function drawRadius() {
  if (radiusOverlay != null)
    radiusOverlay.setMap(null);
  radiusOverlay = new google.maps.Circle({
    strokeColor: 'blue',
    strokeOpacity: '0.5',
    strokeWeight: 2,
    fillColor: 'blue',
    fillOpacity: 0.2,
    map: map,
    center: markers[0].position,
    radius: radius
  });
}

function setRouteType(type) {
  routeType = type;
  switch(type) {
    case "all":
      document.getElementById("range-slider").disabled = true;
      break;
    case "radius":
      document.getElementById("range-slider").disabled = false;
      break;
  }
}

function setGeocodingAddress() {
  var dir = document.getElementById("direction").value;
  geocoder.geocode( { 'country': 'ES', 'latLng': centre,'address': dir}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      map.setCenter(results[0].geometry.location);
      map.setZoom(16);
    } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  }); 
}

function closeAllInfowindows() {
  for (var i=0; i<infowindows.length; i++) {
     infowindows[i].close();
  }
}

function setCustomMarker(name, location, infowindow) {
  var marker = new google.maps.Marker({
    position: location,
    title: name,
    map: map,
    icon: "css/star-3.png"
  });
  marker.addListener('click', function() {
    closeAllInfowindows();
    infowindow.open(map, marker);
  });
  markers.push(marker)
}

function setDefaultWaypoints() {
  for (var i = 0; i < defaultWaypoints.length; i++) {
    var waypoint = defaultWaypoints[i];
    var location = new google.maps.LatLng(waypoint.lat, waypoint.lng)
    var name = waypoint.name
    var infowindow = new google.maps.InfoWindow({
          content: "<h2>" + name + "</h2><img id='info-img' src='" + waypoint.img + "'>"
        });
    infowindows.push(infowindow);
    setCustomMarker(name, location, infowindow);
  }
}