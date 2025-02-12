document.addEventListener('DOMContentLoaded', function() {
  // Initialize the map.
  var map = L.map('map').setView([20, 0], 2);

  // Add the OpenStreetMap base layer.
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add the OpenWeatherMap clouds overlay.
  var openWeatherMapAPIKey = '9464335dd406fb4b748c443ecb395a6a'; // Your API key.
  var weatherLayer = L.tileLayer(
    'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=' + openWeatherMapAPIKey,
    {
      maxZoom: 18,
      attribution: '© OpenWeatherMap'
    }
  ).addTo(map);

  // Create a marker cluster group.
  var markerClusters = L.markerClusterGroup();

  // Arrays to collect heatmap points and flight path layers.
  var heatData = [];
  var flightPathLayers = [];

  // Fetch the aggregated balloon flight history data.
  fetch('/api/balloon-history')
    .then(response => response.json())
    .then(data => {
      // Process only balloons with a flight path (more than one point).
      data.balloons.forEach(function(balloon) {
        if (balloon.history.length > 1) {
          // Sort history by hours_ago (earliest first).
          balloon.history.sort(function(a, b) {
            return a.hours_ago - b.hours_ago;
          });

          // Build an array of [lat, lon] points.
          var latlngs = balloon.history.map(function(record) {
            return [parseFloat(record.lat), parseFloat(record.lon)];
          });

          // Add these points to the heatData array.
          heatData = heatData.concat(latlngs);

          // Create a red polyline for the flight path.
          var polyline = L.polyline(latlngs, { color: 'red', weight: 3 });
          // Add arrow decoration using PolylineDecorator if available.
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
          // Add the polyline to our flight path layers.
          flightPathLayers.push(polyline);

          // Place a marker at the latest known position.
          var latest = balloon.history[balloon.history.length - 1];
          var lat = parseFloat(latest.lat);
          var lon = parseFloat(latest.lon);

          // Create a small custom marker icon.
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

      // Create a layer group for flight paths.
      var flightPathLayer = L.layerGroup(flightPathLayers);

      // Create a heatmap layer with a custom gradient.
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

      // Add the marker clusters by default.
      map.addLayer(markerClusters);
      // Optionally add flight paths.
      map.addLayer(flightPathLayer);

      // Add layer controls to toggle between clusters, flight paths, and heatmap.
      var overlayLayers = {
        "Marker Clusters": markerClusters,
        "Flight Paths": flightPathLayer,
        "Heatmap": heatLayer
      };
      L.control.layers(null, overlayLayers, { collapsed: false }).addTo(map);

      // Fit the map bounds to the marker clusters.
      if (markerClusters.getLayers().length > 0) {
        map.fitBounds(markerClusters.getBounds(), { padding: [50, 50] });
      } else if (heatData.length > 0) {
        map.fitBounds(heatData, { padding: [50, 50] });
      }
      
      // Hide the loading spinner once data is processed.
      var loadingElem = document.getElementById('loading');
      if (loadingElem) {
        loadingElem.style.display = 'none';
      }
    })
    .catch(function(error) {
      console.error('Error fetching balloon data:', error);
      // Hide the loading spinner even on error.
      var loadingElem = document.getElementById('loading');
      if (loadingElem) {
        loadingElem.style.display = 'none';
      }
    });
});
