$(document).ready(function() {
  var playing = true;
  var pitch = 60;
  var autoRotate = false;
  var follow = true;
  var video = document.getElementsByTagName("video")[0];
  var music = document.getElementsByTagName("audio")[0];

  $('button.play').click(function() {
    $(this).addClass('active');
    $('button.pause').removeClass('active');
    playing = true;
    video.play();
    music.play();
  });
  $('button.pause').click(function() {
    $(this).addClass('active');
    $('button.play').removeClass('active');
    playing = false;
    video.pause();
    music.pause();
  });
  $('button.speed1').click(function() {
    $('.speeds').removeClass('active');
    $(this).addClass('active');
    video.playbackRate = 1.0;
  });
  $('button.speed2').click(function() {
    $('.speeds').removeClass('active');
    $(this).addClass('active');
    video.playbackRate = 2.0;
  });
  $('button.speed5').click(function() {
    $('.speeds').removeClass('active');
    $(this).addClass('active');
    video.playbackRate = 5.0;
  });
  $('button.speed10').click(function() {
    $('.speeds').removeClass('active');
    $(this).addClass('active');
    video.playbackRate = 10.0;
  });
  $('button.speed50').click(function() {
    $('.speeds').removeClass('active');
    $(this).addClass('active');
    video.playbackRate = 50.0;
  });
  $('button.map-dark').click(function() {
    $('.mapstyle').removeClass('active');
    $(this).addClass('active');
    map.setStyle('mapbox://styles/mapbox/dark-v9');
    $('video').addClass('box');
  });
  $('button.map-overlay').click(function() {
    $('.mapstyle').removeClass('active');
    $(this).addClass('active');
    map.setStyle('mapbox://styles/danpaulsmith/cj36hkr6r00062ss1cwz8xvr9');
    $('video').removeClass('box');
  });
  $('button.map-light').click(function() {
    $('.mapstyle').removeClass('active');
    $(this).addClass('active');
    map.setStyle('mapbox://styles/mapbox/light-v9');
    $('video').addClass('box');
  });
  $('button.map-satellite').click(function() {
    $('.mapstyle').removeClass('active');
    $(this).addClass('active');
    map.setStyle('mapbox://styles/mapbox/satellite-v9');
    $('video').addClass('box');
  });
  $('button.toggle-pitch').click(function() {
    $(this).toggleClass('active');
    if (pitch === 0) {
      pitch = 60;
    } else {
      pitch = 0;
    }
    map.setPitch(pitch);
  });
  $('button.toggle-autorotate').click(function() {
    $(this).toggleClass('active');
    if (autoRotate) {
      autoRotate = false;
    } else {
      autoRotate = true;
    }
  });
  $('button.toggle-follow').click(function() {
    $(this).toggleClass('active');
    if (follow) {
      follow = false;
    } else {
      follow = true;
    }
  });
  $('button.music').click(function() {
    $(this).toggleClass('active');
    if (music.muted) {
      music.muted = false;
    } else {
      music.muted = true;
    }
  });

var timeCoordsMap = {};
var accidentData;
var videoStartTimeOffset = 54;
video.playbackRate = 1.0;
video.currentTime = videoStartTimeOffset;


d3.select('#video').attr("width", window.innerWidth).attr("height", window.innerHeight);

mapboxgl.accessToken = 'pk.eyJ1IjoiZGFucGF1bHNtaXRoIiwiYSI6ImNpeXc4NXU5ZDAwMDMzMm9lZmd4ZTFmZmQifQ.Nl9itu3jhaFTlhrV92LS0g';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  zoom: 15,
  minZoom: 11
});

var startPos;
map.on('style.load', function() {
  if (accidentData) {
    addDataAndInteraction();
  }
});
map.on('load', function() {

  d3.csv('data/Casualties_2015_slim.csv', function(d) {
    if (d['Casualty Type'] === '1') {
      return {
        id: d.Accident_Index,
        type: parseInt(d['Casualty Type']),
        coord: [parseFloat(d.Longitude), parseFloat(d.Latitude)],
        severity: parseInt(d.Accident_Severity)
      };
    }
  }, function(error, rows) {
    accidentData = rows;
    addDataAndInteraction();
  });

  // We use D3 to fetch the JSON here so that we can parse and use it separately
  // from GL JS's use in the added source. You can use any request method (library
  // or otherwise) that you want.
  d3.json('data/commute.geojson', function(err, data) {
    if (err) throw err;

    // save full coordinate list for later
    // var coordinates = data.features[0].geometry.coordinates;
    window.commuteData = data;
    var coordinates = data.features[0].geometry.coordinates.map(function(coord) {
      return [coord[0], coord[1]];
    });


    var times = data.features[0].properties.coordTimes.map(function(time, index) {
      timeCoordsMap[time] = {
        step: index,
        time: new Date(time),
        prevcoord: coordinates[index - 1] || coordinates[0],
        coord: coordinates[index]
      };
      return new Date(time);
    });
    var startTime = times[0];
    startPos = coordinates[0];
    document.getElementById('sliderPos').step = 1;
    document.getElementById('sliderPos').min = video.currentTime;
    document.getElementById('sliderPos').max = Math.floor(video.duration - video.currentTime) || 1504;
    document.getElementById('sliderPos').addEventListener('input', function(e) {
      video.currentTime = e.target.value;
    });

    // console.log(startTime, startPos);
    // start by showing just the first coordinate
    data.features[0].geometry.coordinates = [startPos];

    // var i = 1;

    var currentDayTime = new Date(startTime);
    // console.log('currentDayTime', currentDayTime);
    var vidTime;
    var mapping = false;

    function animate2() {
      if (playing) {
        document.getElementById('sliderPos').value = Math.floor(video.currentTime);
        // console.log(document.getElementById('sliderPos').value, document.getElementById('sliderPos').max);
        // console.log('video.currentTime', Math.floor(video.currentTime), 'vidTime', vidTime);
        currentDayTime = new Date(startTime);
        vidTime = new Date(currentDayTime.setSeconds(currentDayTime.getSeconds() + Math.ceil(video.currentTime)));
        // console.log('Map?', vidTime.toISOString().slice(0,19)+'Z');
        $('p.timer').text(new Date(vidTime.setHours(vidTime.getHours() + 1)).toISOString().slice(11, 19) + ' AM');
        if (timeCoordsMap[vidTime.toISOString().slice(0, 19) + 'Z']) {
          mapping = timeCoordsMap[vidTime.toISOString().slice(0, 19) + 'Z'];
          // console.log('Video elapsed:', Math.floor(video.currentTime), ', time: ', mapping.time, 'coord: ', mapping.coord);
          if (map.getSource('markers')) {
            map.getSource('markers').setData({
              "type": "FeatureCollection",
              "features": [{
                "type": "Feature",
                "geometry": {
                  "type": "Point",
                  "coordinates": mapping.coord
                },
                "properties": {
                  // "title": "Me",
                  "marker-symbol": "triangle-15"
                }
              }]
            });
          }
          if (follow) {
            map.easeTo({
              center: mapping.coord,
              bearing: (autoRotate ? turf.bearing(mapping.prevcoord, mapping.coord) : false),
              duration: 1000
            });
          } else {
            map.easeTo({
              bearing: (autoRotate ? turf.bearing(mapping.prevcoord, mapping.coord) : false),
              duration: 1000
            });
          }

        }
      }
      setTimeout(function() {
        requestAnimationFrame(animate2);
      }, 100);
    }

    if (playing) {
      video.play();
    }
    animate2();


  });
});

function addDataAndInteraction() {

  map.addSource('trace', { type: 'geojson', data: window.commuteData });
  map.addLayer({
    "id": "trace",
    "type": "line",
    "source": "trace",
    "paint": {
      "line-color": "#0C70FE",
      "line-opacity": 0.75,
      "line-width": 5
    }
  });

  var accidents = accidentData.map(function(accident) {
    return {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": accident.coord
      },
      "properties": {
        "marker-symbol": "marker-15",
        "name": "Cycling accident",
        "severityCode": accident.severity,
        "severity": (accident.severity === 1 ? 'Fatal' : (accident.severity === 2 ? 'Serious' : 'Slight'))
      }
    }
  });
  map.addSource('accidents', {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": accidents
    }
  });

  map.addLayer({
    id: 'accidentLayer',
    type: 'circle',
    source: 'accidents',
    paint: {
      'circle-opacity': 0.9,
      'circle-radius': {
        'base': 1.75,
        'stops': [
          [12, 2],
          [22, 180]
        ]
      },
      'circle-color': {
        property: 'severityCode',
        stops: [
          [1, '#ff0000'],
          [2, '#FC5F08'],
          [3, '#FEEB0A']
        ]
      }
    }
  });
  map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 18,
    'paint': {
      'fill-extrusion-color': '#DEB812',
      'fill-extrusion-height': {
        'type': 'identity',
        'property': 'height'
      },
      'fill-extrusion-base': {
        'type': 'identity',
        'property': 'min_height'
      },
      'fill-extrusion-opacity': .6
    }
  });
  map.on('click', 'accidentLayer', function(e) {
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML('<p>Cycling accident: <strong>' + e.features[0].properties.severity + '</strong></p>')
      .addTo(map);
  });

  map.addSource('markers', {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": startPos
        },
        "properties": {
          "marker-symbol": "triangle-15"
        }
      }]
    }
  });
  // setup the viewport
  map.jumpTo({
    'center': startPos,
    'zoom': 16
  });
  map.setPitch(60);

  map.addLayer({
    "id": "markers",
    "source": "markers",
    "type": "symbol",
    "layout": {
      "icon-image": "{marker-symbol}",
      "text-field": "{title}",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 0.6],
      "text-anchor": "top"
    }
  });
}

});
