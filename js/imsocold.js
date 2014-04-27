var currentLat = 0;
var currentLon = 0;
var desiredTemperature = 0;

var objPlaces = '';
var places = []; // Need an array for the sort

var map = L.map('map');
L.tileLayer.provider('OpenStreetMap.HOT').addTo(map);

$(function() {
    $.getJSON('js/places.json', function(json) {
        objPlaces = json;
    });
});

$('#get-destination__button').on('click', function() {

    $('.cold-places').empty();

    places = [];

    currentLat = $('#origin-latutude').val();
    currentLon = $('#origin-longitude').val();
    desiredTemperature = $('#desired-temperature').val();

    $('#map').fadeIn(400, function() {
        map.setView([currentLat, currentLon], 13);
    });

    // Add distance from origin to each place
    $.each(objPlaces, function(key, value) {
        places.push({"name":value.Name, "latitude":value.Latitude,"longitude":value.Longitude,"distance":Math.round(getDistance(currentLat, currentLon, value.Latitude, value.Longitude))});
    });

    // Sort places by distance from origin
    places.sort(function(a,b){
        return a.distance - b.distance;
    });

    // Get temperature of current location
    $.ajax({
        type: 'GET',
        dataType: 'jsonp',
        data: {},
        crossDomain: 'true',
        url: "https://api.forecast.io/forecast/28927fd15064739cf340517cd81b1c8a/" + currentLat + "," + currentLon,
        error: function(textStatus, errorThrown) {
            alert("error");
        },
        success: function(data) {
            if (Math.round(data.daily.data[0].temperatureMax) >= desiredTemperature) {
                $('.origin').html('<p>The high temperature for your current location is ' + Math.round(data.daily.data[0].temperatureMax) + ' &deg;F, which is warmer than what you desire. Congrats!</p><p>Maximum temperature for today is ' + Math.round(data.daily.data[0].temperatureMax) + ' &deg;F</p>');
            }
            else {
                $('.origin').html("<p>The high temperature for your starting location is " + Math.round(data.daily.data[0].temperatureMax) + " &deg;F. I'll find you a warmer location.</p>");

                // Get temperatures of closest location
                getDestination(0, places);
            }
        }
    });

});

var getDestination = function(index, places) {
    var place = places[index];
    $.ajax({
        type: 'GET',
        dataType: 'jsonp',
        data: {},
        crossDomain: 'true',
        url: "https://api.forecast.io/forecast/28927fd15064739cf340517cd81b1c8a/" + place.latitude + "," + place.longitude,
        error: function(textStatus, errorThrown) {
            alert("error");
        },
        success: function(data) {
            place["temperature"] = Math.round(data.daily.data[0].temperatureMax);
            if (place.temperature < desiredTemperature) {
                printPlace(places[index], data.daily.data[0], "too-cold");
                index++;
                getDestination(index, places);
            }
            else {
                printPlace(places[index], data.daily.data[0], "destination");
                drawMap(places[index], data.currently);
                if (places[index].distance > 500) {
                    $('body').append('<p>Your destination is ' + places[index].distance + ' miles away! Probably not a good day trip.</p>');
                }
            }
        }
    });
};

var printPlace = function(place, conditions, placeType) {
    $('.cold-places').append("<div class='" + placeType + "'>" + place.name + ": " + place.distance + " miles - " + Math.round(conditions.temperatureMax) + " &deg;F icon: " + conditions.icon + " wind: " + Math.round(conditions.windSpeed) + "mph at " + conditions.windBearing + "&deg;</div>");
};

var drawMap = function(place, conditions) {

    L.Routing.control({
        waypoints: [
            L.latLng(currentLat, currentLon),
            L.latLng(place.latitude, place.longitude)
        ]
    }).addTo(map);

    $('.toggle-directions').show();
};

// Haversine Formula
var getDistance = function(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var radlon1 = Math.PI * lon1/180
    var radlon2 = Math.PI * lon2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist
};

$('.toggle-directions').on('click', function() {
    if ($('.leaflet-routing-container').is(':visible')) {
        $(this).text('Show Turn-by-turn');
    }
    else {
        $(this).text('Hide Turn-by-turn');
    }
    $('.leaflet-routing-container').fadeToggle(500);
});

$('.use-current').on('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setCurrentLocation);
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }
});

var setCurrentLocation = function(position) {
    $('#origin-latitude').val(Math.round(position.coords.latitude * 100) / 100);
    $('#origin-longitude').val(Math.round(position.coords.longitude * 100) / 100);
};