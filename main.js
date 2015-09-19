var centre = new google.maps.LatLng(43.5314284, -5.6684546);
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
//var wmsStyle = "polygon,line"

google.load("visualization", "1", {packages: ["columnchart"]});

function initialize() {
 
  // Variables para dibujar la ruta
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();

  // Opciones del mapa
  var options = {
    center: centre,
    zoom: mapZoom,
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
  map.setMapTypeId(google.maps.MapTypeId.HYBRID);
  
  // Añadir evento para crear los marcadores
  google.maps.event.addListener(map, 'click', function(event) {
    setMarkers(event.latLng);
  });

  // Al inicio seleccionar todos los checkbox y añadir las capas
  selectAllCheckboxes();
  setCheckLayers();
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
  var indexLayers = wmsLayers.length;
  paramWmsLayers = null;
  for(var i=0;i<checkboxes.length;i++) {
    if(checkboxes[i].type === 'checkbox' && checkboxes[i].checked==true) {
      var checkboxValue = checkboxes[i].value;
      for(var j=0;j<wmsLayers.length;j++) {
        if(checkboxValue == wmsLayers[j]) {
          if(j==0){
            paramWmsLayers=wmsLayers[j];
          } else if(j!=(indexLayers-1)) {
            paramWmsLayers +=","+wmsLayers[j];
          } else if(j==indexLayers-1) {
            paramWmsLayers +=","+wmsLayers[j];
          }
        }
      }
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
  markers.push(marker);
  positions.push({"lat":location.lat(), "lng":location.lng()});
}

// Calcular la ruta desde el origen al final con los puntos intermedios y dibujar la línea
function calculateAndDisplayRoute() {
  directionsDisplay.setMap(map);
  var lastIndex = markers.length-1;
  for (var i = 1; i < lastIndex; i++) {
      waypts.push({
        location: markers[i].position,
        stopover: true
      });
  }

  var request = {
    origin: markers[0].position,
    destination: markers[lastIndex].position,
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
}

// Añadir el gráfico de elevación y la ruta detallada en el modal.
function routeDetailInformation() {

  if(markers.length==0) {
    document.getElementById('no_route_txt').innerHTML = "You have to calculate a route";
  } else {
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