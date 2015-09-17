var parque = new google.maps.LatLng(43.351583, -5.849862);

function initialize() {
  console.log("Init")
  var options = {
    center: parque,
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

}
