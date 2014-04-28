var currentLat = 0;
var currentLon = 0;
var desiredTemperature = 0;

var objPlaces = '';
var places = []; // Need an array for the sort

var map = L.map('map');
L.tileLayer.provider('OpenStreetMap.HOT').addTo(map);

var weatherIcons = {'clear-day': 'wi-day-sunny', 'clear-night': 'wi-night-clear', 'rain': 'wi-rain', 'snow': 'wi-snow', 'sleet': 'wi-rain-mix', 'wind': 'wi-strong-wind', 'fog': 'wi-fog', 'cloudy': 'wi-cloudy', 'partly-cloudy-day': 'wi-day-cloudy', 'partly-cloudy-night': 'wi-night-cloudy'};

$(function() {
    $.getJSON('js/places.json', function(json) {
        objPlaces = json;
    });
});

$('input').on('change', function() {
    if ($.isNumeric($('#origin-latitude').val()) && $.isNumeric($('#origin-longitude').val()) && $.isNumeric($('#desired-temperature').val())) {
        $('#get-destination__button').removeAttr('disabled');
    }
});

$('#get-destination__button').on('click', function() {

    $('#origin-longitude').val(Math.abs($('#origin-longitude').val()) * -1);

    $(this).find('.fa').addClass('fa-spin');

    $('.origin__heading, .origin__body, .destination__heading, .destination__body, tbody').empty();

    $('#map, .panel.origin, .panel.destination, .directions-button-container, .cold-places').hide();

    places = [];

    currentLat = $('#origin-latitude').val();
    currentLon = $('#origin-longitude').val();
    desiredTemperature = $('#desired-temperature').val();

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
            $('.panel.origin').show();
            $('.origin__heading').html('<i class="' + weatherIcons[data.daily.data[0].icon] + '"></i> Origin: ' + Math.round(currentLat * 100) / 100 + ' N, ' + Math.round(currentLon * 100) / 100 + " W");
            if (Math.round(data.daily.data[0].temperatureMax) >= desiredTemperature) {
                $('.origin__body').append('<p class="alert alert-success">The high temperature for your current location is ' + Math.round(data.daily.data[0].temperatureMax) + ' &deg;F, which is warmer than what you desire. Congrats!</p><p>Maximum temperature for today is ' + Math.round(data.daily.data[0].temperatureMax) + ' &deg;F</p>');
                $('#get-destination__button').find('.fa').removeClass('fa-spin');
            }
            else {
                $('.origin__body').html('<p>The high temperature for your starting location is ' + Math.round(data.daily.data[0].temperatureMax) + " &deg;F. I'll find you a warmer location.</p>");

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
                printPlace(place, data.daily.data[0]);
                index++;
                getDestination(index, places);
            }
            else {

                $('#map').fadeIn(400, function() {
                    map.setView([currentLat, currentLon], 13);
                });

                $('.directions-button-container, .cold-places').show();
                drawMap(place, data.daily.data[0]);
                $('.panel.destination').show();
                $('.destination__heading').html('<i class="' + weatherIcons[data.daily.data[0].icon] + '"></i> Destination: ' + place.name + ' (' + place.distance + ' miles)');
                if (place.distance > 500) {
                    $('.destination__body').prepend('<p class="alert alert-warning">Your destination is ' + place.distance + ' miles away! Probably not a good day trip.</p>');
                }
                $('.destination__body').append('The high temperature at ' + place.name + ' today is ' + Math.round(data.daily.data[0].temperatureMax) + ' &deg;F.');
                $('#get-destination__button').find('.fa').removeClass('fa-spin');
            }
        }
    });
};

var printPlace = function(place, conditions) {
    $('.cold-places')
        .find('tbody').append('<tr><td>' + place.distance + '</td><td>' + place.name + '</td><td>' + Math.round(conditions.temperatureMax) + ' &deg;F <i class="' + weatherIcons[conditions.icon] + '"></i></td></tr>').end().show();
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
        $(this).find('.fa').addClass('fa-spin');
        navigator.geolocation.getCurrentPosition(setCurrentLocation);
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }
});

var setCurrentLocation = function(position) {
    $('#origin-latitude').val(Math.round(position.coords.latitude * 100) / 100);
    $('#origin-longitude').val(Math.round(position.coords.longitude * 100) / 100);
    $('.use-current').find('.fa').removeClass('fa-spin');
};