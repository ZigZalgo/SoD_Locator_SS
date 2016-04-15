/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery to collapse the navbar on scroll

var locationOfInteresing = {lat:51.0801184, ltd: -114.1325908}
// Custom Map Marker Icon - Customize the map-marker.png file to customize your icon

var myLatLng = new google.maps.LatLng(locationOfInteresing.lat, locationOfInteresing.ltd);
//var policeIcon = {url:'img/police_green_2.png',scaledSize: new google.maps.Size(51,51)}



function collapseNavbar() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
}

$(window).scroll(collapseNavbar);
$(document).ready(collapseNavbar);
$(document).ready(function(){
    $("#map").on('click',"#navigate",function(){
        console.log('navigate on click');
        io.emit("broadcast",{listener:"remoteNavigation",payload:{lat:clickMarkerLocation.lat(),lng:clickMarkerLocation.lng()}});
    })
});

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
    io.on("showMedia",function(){
        console.log("show media ");
        $("#ERImage").slideToggle(300);
    })
    io.on("updateERLocationOnMap",function(data){
        console.log(data);
        police.marker.setPosition(new google.maps.LatLng(data.lat,data.lng))
    })
    setInterval(function(){
        io.emit("getAllERPerson","",function(ERPeople){
            //console.log(ERPeople) // Works
            //$('#ERPerson-117').text("80");
            for(var personKey in ERPeople){
                if(ERPeople.hasOwnProperty(personKey)){
                    var personOfInterest = ERPeople[personKey];
                    if(personOfInterest.hasOwnProperty("heartbeat")){
                        //police.heartbeatWindow.setContent('<div style="color:black;"><div>Police: <span style="font-weight: bold;">John 117</span></div> <div>Heart beat: <span style="font-weight: bold;color:red;">'+personOfInterest.heartbeat+'</span></div></div>')
                        $('#ERPerson-117').text(personOfInterest.heartbeat);
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
        draggable: true

        // How you would like to style the map. 
        // This is where you would paste any style found on Snazzy Maps.
        /*styles: [
            {
            stylers: [
                {"color":"#676566"}

            ]
        },
            {
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
        }]*/
    };

    // Get the HTML DOM element that will contain your map 
    // We are using a div with id="map" seen below in the <body>
    var mapElement = document.getElementById('map');

    // Create the Google Map using out element and options defined above
    map = new google.maps.Map(mapElement, mapOptions);




    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById("directionsPanel"));
    //document.getElementById('start').addEventListener('change', onChangeHandler);
    //document.getElementById('end').addEventListener('change', onChangeHandler);

    //51.081034,-114.131995
    mapListeners()
    addMarkers();

}
function mapListeners(){
    map.addListener('click', function(e) {
        placeMarkerAndPanTo(e.latLng, map);
    });
}
var clickMarker;
var clickMarkerLocation = new google.maps.LatLng(51.079896689098796,-114.12545084953308);
function placeMarkerAndPanTo(latLng, map) {
    if(clickMarker!=undefined){clickMarker.setMap(null)}
    console.log(latLng.lat()+","+latLng.lng())
    clickMarkerLocation = new google.maps.LatLng(latLng.lat(),latLng.lng());
    clickMarker = new google.maps.Marker({
        position: latLng,
        map: map
    });



    calculateAndDisplayRoute(clickMarker.position)

    //map.panTo(latLng);
}
var directionsService = new google.maps.DirectionsService;
var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
function calculateAndDisplayRoute(destination) {
    if(selectedMarker!=null){
        directionsService.route({
            origin: selectedMarker.position,
            destination: destination ,
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                console.log(response);
                var clickInfo = new google.maps.InfoWindow({
                    content: '<div style="color:black;">Selected responder: <div style="font-weight:bold;">John-117(Police): '+response.routes[0].legs[0].duration.text+'</div></div><button type="button" id="navigate" class="btn btn-primary btn-xs">NAVIGATE</button>'
                });
                clickMarker.addListener('click',function(){
                    //this.setAnimation(google.maps.Animation.BOUNCE);
                    clickInfo.open(map,clickMarker);
                })
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }else{
        console.log(" Please selected a marker before performing remote navigation")
    }
}


// ERDemo
var ERMarker = function(){
    this.marker = null;
    this.heartbeatWindow = null;
    this.location = null;
    this.icon = null;
}
var police = new ERMarker();
var fireman = new ERMarker();
var fireMarker = new ERMarker();
fireMarker.location =  new google.maps.LatLng(51.079896689098796,-114.12545084953308);

//new google.maps.LatLng(51.078798016621995,-114.13435578346252);
var responderLocation = new google.maps.LatLng(51.08062547201551,-114.13058392703533);

//var fireIcon = {url:'img/fireicon.png',scaleSize:locationIconSize}

//Locaiton of interests
var locationIconSize = new google.maps.Size(51,51);
var fireIcon = {url:'img/fireicon.png',scaledSize:locationIconSize}
fireMarker.icon = fireIcon;
var ICTLocationIcon = {url:'img/ER_map_marker_whitebg.png',scaledSize:locationIconSize};
// Responders
var responderIconSize = new google.maps.Size(40,40);
var redPoliceIcon = {url:"img/police_red.png",scaledSize:responderIconSize }
var greenPoliceIcon = {url:"img/police_green_2.png",scaledSize: responderIconSize}
var amberPoliceIcon = {url:"img/police_amber.png",scaledSize: responderIconSize}
var redFiremanIcon = {url:"img/ER/fireman_red.png",scaledSize:responderIconSize}
var intenseFiremanIcon = {url:"img/ER/fireman_intense.png",scaledSize:new google.maps.Size(40,54)}
var greenFireman = {url:"img/ER/fireman_green.png",scaledSize:responderIconSize}
var amberFireman = {url:"img/ER/fireman_amber.png",scaledSize:responderIconSize}
var heartbeat = 75

fireman.location = new google.maps.LatLng(51.07986635800024,-114.12640571594238);
function addMarkers(){
    // Marker
    /*var beachMarker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: ICTLocationIcon
    });*/
     var fireMarkerInfo = new google.maps.InfoWindow({
        content: '<div style="color:black; font-size: 2em;">UofC Biology</div><div>' +
        /*'<video width="320" height="240" controls>'+
        '<source src="movie.mp4" type="video/mp4">'+
        '<source src="movie.ogg" type="video/ogg">'+
        'Your browser does not support the video tag.'+
        '</video>' +*/
        '<img src="img/ER/buildingOnFire.png"  height="150"/>'+
        '</div>'
    });
    fireMarker.marker = new google.maps.Marker({
        position: fireMarker.location,
        map: map,
        icon: fireIcon
    });
    fireMarker.marker.addListener('click',function(){
        //this.setAnimation(google.maps.Animation.BOUNCE);
        fireMarkerInfo.open(map,fireMarker.marker);
    })

    // Police
    police.heartbeatWindow = new google.maps.InfoWindow({
        content: '<div style="color:#2E3030;width:120px;"><div>Police: <span style="font-weight: bold;">John-117</span></div> ' +
        '<div>Heart beat: <span id="ERPerson-117" style="font-weight: bold;color:red;">' + heartbeat+'</span></div>' +
        '<div style="padding:3px 0px;">Devices: <img src="img/ER/smartglass.jpg" style="padding-right:3px;" alt="glass" height="17" ><img src="img/ER/smartwatch.png" alt="glass" height="20" ></div>' +
        '</div>'
    });
    /*
     new InfoBubble({
     map: map,
     content: '<div style="color:white;width:120px;"><div>Police: <span style="font-weight: bold;">John-117</span></div> ' +
     '<div>Heart beat: <span id="ERPerson-117" style="font-weight: bold;color:red;">' + heartbeat+'</span></div>' +
     '<div style="padding:3px 0px;">Devices: <img src="img/ER/smartglass.jpg" style="padding-right:3px;" alt="glass" height="17" ><img src="img/ER/smartwatch.png" alt="glass" height="20" ></div>' +
     '</div>',
     shadowStyle: 1,
     padding: 0,
     backgroundColor: '#2E3030',
     borderRadius: 1,
     arrowSize: 10,
     borderWidth: 0,
     borderColor: '#2c2c2c',
     disableAutoPan: true,
     hideCloseButton: false,
     arrowPosition: 30,
     backgroundClassName: 'transparent',
     arrowStyle: 0,
     minWidth:'120px'

     });
     */
    police["marker"] = new google.maps.Marker({
        position: responderLocation,
        map: map,
        icon: greenPoliceIcon
    });
    proto_police1 = new google.maps.Marker({
        position: new google.maps.LatLng(51.080948154888624,-114.12694215774536),
        map: map,
        icon: redPoliceIcon
    });
    proto_police2 = new google.maps.Marker({
        position: new google.maps.LatLng(51.08073247154662,-114.12548303604126),
        map: map,
        icon: redPoliceIcon
    });
    police["marker"].addListener('click',function(){
        //this.setAnimation(google.maps.Animation.BOUNCE);
        toggleBounce(this)
        police.heartbeatWindow.open(map,police.marker);
    })

    // Fireman
    fireman.marker = new google.maps.Marker({
        position: fireman.location,
        map:map,
        icon:redFiremanIcon
    })
    var fireman_1= new google.maps.Marker({
        position: new google.maps.LatLng(51.07950575341616,-114.1262286901474),
        map:map,
        icon:redFiremanIcon
    })
    var fireman_3 = new google.maps.Marker({
        position: new google.maps.LatLng(51.07919906880124,-114.12559568881989),
        map:map,
        icon:intenseFiremanIcon
    })
    var fireman_2 = new google.maps.Marker({
        position: new google.maps.LatLng(51.079529344456176,-114.12458717823029),
        map:map,
        icon:redFiremanIcon
    })
    fireman.heartbeatWindow = new google.maps.InfoWindow({
        content: '<div class="heartbeatInfoWindow"><div>Firefighter: <span style="font-weight: bold;">Frank Castle</span></div> ' +
        '<div>Heart beat: <span id="ERPerson-117" style="font-weight: bold;color:red;">' + 95+'</span></div>' +
        '<div style="padding:3px 0px;">Devices: <img src="img/ER/smartglass.jpg" style="padding-right:3px;" alt="glass" height="17" ><img src="img/ER/smartwatch.png" alt="glass" height="20" ></div>' +
        '</div>'
    });
    fireman["marker"].addListener('click',function(){
        //this.setAnimation(google.maps.Animation.BOUNCE);
        toggleBounce(this)
        fireman.heartbeatWindow.open(map,fireman.marker);
    })
    var cityCircle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: fireMarker.location,
        radius: 60 //Math.sqrt(citymap[city].population) * 100
    });

    //police.icon.setIcon(greenPoliceIcon);
}

var selectedMarker = null;

function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
        selectedMarker = null
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        selectedMarker = marker;
    }
}
