'use strict';

angular.module('FMLApp.controllers', [])
.controller("FMLCtrl", function($scope, $http, $window) {
    $scope.supportsGeo = $window.navigator;
    $scope.error = null;
    $scope.address = null;
    $scope.debug = null;

    $scope.FindPosition = function() {
        $scope.error = null;
        window.navigator.geolocation.getCurrentPosition(function(position) {
            $scope.$apply(function() {
                $scope.debug = position;
                var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                $scope.address = resolveCoordinatesToAddress(geolocation);
                return renderMap(geolocation);
            });
        }, function(error) {
            $scope.$apply(function() {
                $scope.error = error;
            });
        });
    };
    
    $scope.ClearPosition = function() {
        $scope.debug = null;
        $scope.address = null;
        $scope.error = null;
        return renderMap();
    }
    
    $scope.PostPosition = function() {
        $scope.ClearPosition();
        $scope.address = $('#search_address').val();
        $scope.debug = $scope.address;
        if ($scope.address) {
            resolveAddressToCoordinates($scope.address);
        } else {
            $scope.error = 'No value entered in address';
        }
    }

    initializeAutocomplete();
    $scope.init = $scope.FindPosition();
});

function initializeAutocomplete() {
    var autocomplete = new google.maps.places.Autocomplete(
        /** @type {HTMLInputElement} */(document.getElementById('search_address')),
        { types: ['geocode'] });

    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        autocomplete.getPlace();
    });
}

// https://developers.google.com/maps/documentation/javascript/
function renderMap(geolocation) {
    var map;
    var mapOptions = {
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    if (geolocation) {
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

// Client side Geocoding
var formatted_address;
function resolveCoordinatesToAddress(geolocation) {
    if (geolocation) {
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
    else {
        formatted_address = null;
    }

    return formatted_address;
}

var positon_object;
function resolveAddressToCoordinates(address) {
    if (address) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': address }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0].geometry.location) {
                    renderMap(results[0].geometry.location);
                } else {
                    return 'Location not found';
                }
            } else {
                return 'Geocoder failed due to: ' + status;
            }
        });        
    }
    else {
        positon_object = null;
    }
    
    return positon_object;
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

function resolveGeoEncodeURLByCoordinates(position) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
        position.coords.latitude + ',' + position.coords.longitude +
        '&sensor=false';
    return url;
}

function resolveGeoEncodeURLByAddress(address) {
    var url = 'https://maps.google.com/maps/api/geocode/json?address='+
        address + '&sensor=false';
    return url;
}