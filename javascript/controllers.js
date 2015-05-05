'use strict';

angular.module('FMLApp.controllers', [])
.controller("FMLCtrl", function($scope, $http, $window) {
    $scope.supportsGeo = $window.navigator;
    $scope.position = null;
    $scope.address = null;
    $scope.error = null;
    $scope.urlGeo = null;

    $scope.FindPosition = function() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
            $scope.$apply(function() {
                $scope.position = position;
                $scope.address = resolveCoordinatesToAddress(position);
                $scope.urlGeo = resolveGeoEncodeURL(position);
                return renderMap(position);
            });
        }, function(error) {
            $scope.$apply(function() {
                $scope.error = error;
            });
        });
    };
    
    $scope.ClearPosition = function() {
        renderMap();
        $scope.position = null;
        $scope.address = null;
        $scope.error = null;
        $scope.urlGeo = null;
        return renderMap($scope.position);
    }
    
    $scope.PostPosition = function() {
        if ($scope.urlGeo) {
/*
            $http.jsonp($scope.urlGeo + '&prefix=JSON_CALLBACK').success(function(data, status, headers, config){
                alert(data);
            }).
            error(function(data, status, headers, config) {
                console.log(status);
            });
*/
        } else {
            $scope.ClearPosition();
        }
    }

    $scope.init = $scope.FindPosition();
    initializeAutocomplete();
});

function initializeAutocomplete() {
    var autocomplete = new google.maps.places.Autocomplete(
        /** @type {HTMLInputElement} */(document.getElementById('autocomplete')),
        { types: ['geocode'] });

    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        autocomplete.getPlace();
    });
}

// https://developers.google.com/maps/documentation/javascript/
function renderMap(position) {
    var map;
    var mapOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    if (position) {
        var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var marker = renderMarker(map, geolocation);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        map.setZoom(15);
        map.setCenter(geolocation);
    } else {
        var geolocation = new google.maps.LatLng(0,0);
        map.setZoom(0);
        map.setCenter(geolocation);
    }
    return;
}

function renderMarker(map, geolocation) {
    var marker = new google.maps.Marker({
        position: geolocation,
        map: map,
        animation: google.maps.Animation.DROP,
        title: 'Your Location',
    });

    // Place a info window with blurb
    var infowindow = new google.maps.InfoWindow({
        map: map,
        position: geolocation,
        content: returnLocationBlurb(geolocation),
    });
    infowindow.close();

    google.maps.event.addListener(marker, 'click', function() {
        toggleMarkerBounce(marker);
        infowindow.open(map,marker);
    });

    return marker;
}

// Client side Geocoder
var formatted_address;
function resolveCoordinatesToAddress(position) {
    if (position) {
        var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'latLng': geolocation }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[1]) {
//                    retval = results;
                    formatted_address = results[1].formatted_address;
                } else {
                    return 'Location not found';
                }
            } else {
                return 'Geocoder failed due to: ' + status;
            }
        });
    }

    return formatted_address;
}

function toggleMarkerBounce(marker) {
    if (marker.getAnimation() != null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function returnLocationBlurb(geolocation) {
    var location_blurb = 'Your location is approximately:' + '<br/>' +
        '<strong>Latitude:</strong> ' + geolocation.lat() + '<br/>' +
        '<strong>Longitude:</strong> ' + geolocation.lng();
    return location_blurb;
}
function resolveGeoEncodeURL(position) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
        position.coords.latitude + ',' + position.coords.longitude +
        '&sensor=false';
    return url;
}