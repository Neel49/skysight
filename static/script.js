document.addEventListener('DOMContentLoaded', function() {

  var map = L.map('map').setView([20, 0], 2);


  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);


  var openWeatherMapAPIKey = '9464335dd406fb4b748c443ecb395a6a';
  var weatherLayer = L.tileLayer(
    'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=' + openWeatherMapAPIKey,
    {
      maxZoom: 18,
      attribution: '© OpenWeatherMap'
    }
  ).addTo(map);


var markerClusters = L.markerClusterGroup();


  var heatData = [];
  var flightPathLayers = [];


  fetch('/api/balloon-history')
    .then(response => response.json())
    .then(data => {

      data.balloons.forEach(function(balloon) {
        if (balloon.history.length > 1) {

          balloon.history.sort(function(a, b) {
            return a.hours_ago - b.hours_ago;
          });


          var latlngs = balloon.history.map(function(record) {
            return [parseFloat(record.lat), parseFloat(record.lon)];
          });


          heatData = heatData.concat(latlngs);


          var polyline = L.polyline(latlngs, { color: 'red', weight: 3 });

          if (L.Symbol && typeof L.Symbol.arrowHead === 'function') {
            L.polylineDecorator(polyline, {
              patterns: [{
                offset: '5%', 
                repeat: '10%',
                symbol: L.Symbol.arrowHead({
                  pixelSize: 8,
                  polygon: false,
                  pathOptions: { stroke: true, color: 'red' }
                })
              }]
            }).addTo(map);
          } else {
            polyline.addTo(map);
          }

          flightPathLayers.push(polyline);


          var latest = balloon.history[balloon.history.length - 1];
          var lat = parseFloat(latest.lat);
          var lon = parseFloat(latest.lon);


          var customIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [16, 26],
            iconAnchor: [8, 26],
            popupAnchor: [1, -20],
            shadowSize: [26, 26]
          });

          var marker = L.marker([lat, lon], { icon: customIcon })
            .bindPopup(`<b>Balloon ${balloon.id}</b><br>Latest Position: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
          markerClusters.addLayer(marker);
        }
      });


      var flightPathLayer = L.layerGroup(flightPathLayers);


      var heatLayer = L.heatLayer(heatData, {
        radius: 20,
        blur: 15,
        maxZoom: 10,
        gradient: {
          0.0: 'purple',
          0.2: 'blue',
          0.4: 'cyan',
          0.6: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        },
      });


      map.addLayer(markerClusters);

      map.addLayer(flightPathLayer);


      var overlayLayers = {
        "Marker Clusters": markerClusters,
        "Flight Paths": flightPathLayer,
        "Heatmap": heatLayer
      };
      L.control.layers(null, overlayLayers, { collapsed: false }).addTo(map);


      if (markerClusters.getLayers().length > 0) {
        map.fitBounds(markerClusters.getBounds(), { padding: [50, 50] });
      } else if (heatData.length > 0) {
        map.fitBounds(heatData, { padding: [50, 50] });
      }
      

      var loadingElem = document.getElementById('loading');
      if (loadingElem) {
        loadingElem.style.display = 'none';
      }
    })
    .catch(function(error) {
      console.error('Error fetching balloon data:', error);

      var loadingElem = document.getElementById('loading');
      if (loadingElem) {
        loadingElem.style.display = 'none';
      }
    });
});
