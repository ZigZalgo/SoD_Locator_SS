/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery to collapse the navbar on scroll

var locationOfInteresing = {lat:51.0801184, ltd: -114.1325908}
// Custom Map Marker Icon - Customize the map-marker.png file to customize your icon
var image = 'img/ER_map_marker_whitebg.png';
var fireIcon = 'img/fireicon.png'
var myLatLng = new google.maps.LatLng(locationOfInteresing.lat, locationOfInteresing.ltd);
var policeIcon = {url:'img/police_green_2.png',scaledSize: new google.maps.Size(51,51)}
var EEELLocation = new google.maps.LatLng(51.0811681,-114.1300747);
var responderLocation = new google.maps.LatLng(51.0796703,-114.1292812);


function collapseNavbar() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
}

$(window).scroll(collapseNavbar);
$(document).ready(collapseNavbar);

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
  if ($(this).attr('class') != 'dropdown-toggle active' && $(this).attr('class') != 'dropdown-toggle') {
    $('.navbar-toggle:visible').click();
  }
});

// Google Maps Scripts
var map = null;
// When the window has finished loading create our google map below
google.maps.event.addDomListener(window, 'load', init);
google.maps.event.addDomListener(window, 'resize', function() {
    map.setCenter(myLatLng);
});

// Config socket.io
io = io.connect();
io.on('connect',function(data){

    setInterval(function(){
        io.emit("getAllERPerson","",function(ERPeople){
            console.log(ERPeople) // Works
            for(var personKey in ERPeople){
                if(ERPeople.hasOwnProperty(personKey)){
                    var personOfInterest = ERPeople[personKey];
                    if(personOfInterest.hasOwnProperty("heartbeat")){
                        heartbeatWindow.setContent('<div style="color:black;"><div>Police: <span style="font-weight: bold;">John 117</span></div> <div>Heart beat: <span style="font-weight: bold;color:red;">'+personOfInterest.heartbeat+'</span></div></div>')
                    }
                }
            }
        })
    },1000)
})

function init() {
    // Basic options for a simple Google Map
    // For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions

    var mapOptions = {
        // How zoomed in you want the map to start at (always required)
        zoom: 17,

        // The latitude and longitude to center the map (always required)
        center: myLatLng, // New York

        // Disables the default Google Maps UI components
        disableDefaultUI: false,
        scrollwheel: true,
        draggable: true,

        // How you would like to style the map. 
        // This is where you would paste any style found on Snazzy Maps.
        styles: [
            {
                stylers: [
                    {"color":"#676566"}

                ]
            }
            ,{
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 29
            }, {
                "weight": 0.2
            }]
        }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 18
            }]
        }, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 16
            }]
        }, {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 21
            }]
        }, {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
            }, {
                "color": "#000000"
            }, {
                "lightness": 16
            }]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [{
                "saturation": 36
            }, {
                "color": "#a6a6a6"
            }, {
                "lightness": 40
            }]
        }, {
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 19
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#000000"
            }, {
                "lightness": 17
            }, {
                "weight": 1.2
            }]
        }]
    };

    // Get the HTML DOM element that will contain your map 
    // We are using a div with id="map" seen below in the <body>
    var mapElement = document.getElementById('map');

    // Create the Google Map using out element and options defined above
    map = new google.maps.Map(mapElement, mapOptions);


    //51.081034,-114.131995
    var beachMarker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: image
    });
    var fireMaker = new google.maps.Marker({
        position: EEELLocation,
        map: map,
        icon: fireIcon
    });
    heartbeatWindow = new google.maps.InfoWindow({
        content: '<div style="color:black;"><div>Police: <span style="font-weight: bold;">John 117</span></div> ' +
        '<div>Heart beat: <span id="ERPerson-117" style="font-weight: bold;color:red;">'+heartbeat+'</span></div></div>'
    });
    responder = new google.maps.Marker({
        position: responderLocation,
        map: map,
        icon: policeIcon
    });
    responder.addListener('click',function(){
        heartbeatWindow.open(map,responder);
    })

    responder.setIcon()
    responder.setIcon(amberPoliceIcon)
    responder.setLabel("123");
    responder.setTitle("321")
}
var responder;
var redPoliceIcon = {url:"img/police_red.png",scaledSize: new google.maps.Size(51,51)}
var amberPoliceIcon = {url:"img/police_amber.png",scaledSize: new google.maps.Size(51,51)}
var heartbeatWindow ;
var heartbeat = 75