// create the tile layers for the background of map
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
});

// water color layer
var waterColor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
    minZoom: 1,
    maxZoom: 16,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
});

// topo Map
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make basemaps object
let basemaps = {
    GrayScale: grayscale,
    "Water Color": waterColor,
    "Topography": topoMap,
    Default: defaultMap,
};

//create Overlays
let tectonicPlates = new L.layerGroup();
let earthquakes = new L.layerGroup();

// make the map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 3,
    layers: [defaultMap] 
});

// add the default map 
defaultMap.addTo(myMap);

// call the tectonic plate API
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json")
    .then(function(plateData) {
        // load the data and add to tectonic plate layer
        L.geoJson(plateData, {
            color: "yellow",
            weight: 1
        }).addTo(tectonicPlates);
    });

// Earthquake GeoJSON feed 
let earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Function of Color Depth
function getColor(depth) {
    return depth > 90 ? "red" :
           depth > 70 ? "orangered" :
           depth > 50 ? "orange" :
           depth > 30 ? "yellow" :
           depth > 10 ? "greenyellow" :
                        "green";
}

// Function for magnitude radius
function getRadius(magnitude) {
    return magnitude ? magnitude * 4 : 1;
  }
  
  // Connect to GeoJSON 
  d3.json(earthquakeURL).then(function (data) {
    L.geoJson(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: getRadius(feature.properties.mag),
          fillColor: getColor(feature.geometry.coordinates[2]), 
          color: "black", 
          weight: 0.5,
          opacity: 1,
          fillOpacity: 0.8
        });
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`
          <strong>Location:</strong> ${feature.properties.place}<br/>
          <strong>Magnitude:</strong> ${feature.properties.mag}<br/>
          <strong>Depth:</strong> ${feature.geometry.coordinates[2]} km
        `);
      }
    }).addTo(earthquakes);
  });
  
  // Add overlay controls
  let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquakes": earthquakes
  };
  
  L.control.layers(basemaps, overlays).addTo(myMap);
  
  // Add both overlays to map by default
  tectonicPlates.addTo(myMap);
  earthquakes.addTo(myMap);
  
  // Add a legend 
  let legend = L.control({ position: "bottomright" });
  
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");
    let depths = [-10, 10, 30, 50, 70, 90];
  
    div.innerHTML += "<h4>Depth (km)</h4>";
  
    for (let i = 0; i < depths.length; i++) {
      div.innerHTML +=
        `<i style="background:${getColor(depths[i] + 1)}; width:18px; height:18px; display:inline-block; margin-right:5px;"></i>` +
        `${depths[i]}${depths[i + 1] ? "&ndash;" + depths[i + 1] + "<br>" : "+"}`;
    }
  
    return div;
  };
  
  legend.addTo(myMap);