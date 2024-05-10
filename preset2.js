document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM content loaded...");
  var tripForm = document.getElementById('tripForm');
  if (tripForm) { // Check if the form exists on the page
    var selectedDestinations = [];
    var startingLocation = "";
    var destinationSelect = document.getElementById('destination');
    var container = document.getElementById('selectedDestinationsContainer');
    var showTourButton = document.getElementById('showTourButton');
    var startNewTourBtn = document.getElementById('startNewTour'); // Added start new tour button
    var startingLocationSelect = document.getElementById('location');
    var presetPlaces = ['Group of Monuments at Hampi', 'Lotus Mahal', 'Mathanga Hill','Virupaksha Temple']; // Define your preset places here
    
    // Function to populate preset places
    function populatePresetPlaces() {
       

        presetPlaces.forEach(function (place) {
            var destinationElement = document.createElement('div');
            destinationElement.textContent = place;
            destinationElement.classList.add('selectedDestination'); // Apply a class for styling

            // Add delete button for destination
            var deleteDestinationButton = document.createElement('button');
            deleteDestinationButton.textContent = 'Delete';
            deleteDestinationButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2', 'delete-button');
            deleteDestinationButton.addEventListener('click', function () {
                // Check if the clicked place is a preset place
                if (presetPlaces.includes(place)) {
                    // Remove the preset place from the array
                    presetPlaces = presetPlaces.filter(p => p !== place);
                } else {
                    // Remove the selected destination from the array
                    selectedDestinations = selectedDestinations.filter(dest => dest !== place);
                }
                // Update the selected destinations
                updateSelectedDestinations();
            });
            destinationElement.appendChild(deleteDestinationButton);

            container.appendChild(destinationElement);
        });

        container.classList.remove('d-none');
        showTourButton.classList.remove('d-none');
    }



    // Call the populatePresetPlaces function to populate preset places when the page loads
    populatePresetPlaces();        

    tripForm.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent form submission
        updateDaySelectOptions();
    });

    document.getElementById('addToRouteButton').addEventListener('click', function () {
        

        var selectedDestination = destinationSelect.value;
        var startingLocation = startingLocationSelect.value; 
        if (selectedDestination) {
            if (!selectedDestinations.includes(selectedDestination) && !presetPlaces.includes(selectedDestination)) {
                if (selectedDestination !== startingLocation) { // Check if selected destination is not the same as starting location
                    selectedDestinations.push(selectedDestination);
                    updateSelectedDestinations();
                    
                } else {
                    alert('Starting location and destination cannot be the same.');
                }
            } else {
                alert('Destination already added.');
            }
        } else {
            alert('Please select a destination.');
        }
    });

    startingLocationSelect.addEventListener('change', function () {
        startingLocation = this.value;
        updateSelectedDestinations();

    });

    function updateSelectedDestinations() {
        container.innerHTML = '';


        if (startingLocation) {
            if (!selectedDestinations.includes(startingLocation) && !presetPlaces.includes(startingLocation)) { // Check if the selected starting location is not a preset place
                var startingLocationElement = document.createElement('div');
                startingLocationElement.textContent = 'Starting Location: '+' '+' ' + startingLocation;
                startingLocationElement.style.fontWeight = 'bold'; 
                startingLocationElement.classList.add('selectedDestination'); // Apply the same class as selected destinations
                container.appendChild(startingLocationElement);
    
                // Add change option button for starting location
                var changeStartingLocationButton = document.createElement('button');
                changeStartingLocationButton.textContent = 'Change Starting Location';
                changeStartingLocationButton.classList.add('btn', 'btn-primary', 'btn-sm', 'ms-2');
                changeStartingLocationButton.addEventListener('click', function () {
                    startingLocationSelect.disabled = false;
                    startingLocationSelect.value = '';
                    startingLocation = '';
                    updateSelectedDestinations();
                });
                startingLocationElement.appendChild(changeStartingLocationButton);
            } else {
                alert('Starting location cannot be same as Destinations.');
                startingLocation= '';
                
               
            }

        }

        // Call the populatePresetPlaces function to populate preset places when the page loads
        populatePresetPlaces();

        selectedDestinations.forEach(function (destination) {
            var destinationElement = document.createElement('div');
            destinationElement.textContent = destination;
            destinationElement.classList.add('selectedDestination'); // Apply a class for styling


            // Add delete button for destination
            var deleteDestinationButton = document.createElement('button');
            deleteDestinationButton.textContent = 'Delete';
            deleteDestinationButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2','delete-button');
            deleteDestinationButton.addEventListener('click', function () {
                selectedDestinations = selectedDestinations.filter(dest => dest !== destination);
                updateSelectedDestinations();
            });
            destinationElement.appendChild(deleteDestinationButton);

            container.appendChild(destinationElement);
        });

        container.classList.remove('d-none');
    }
    
    // Function to execute the algorithm when the button is clicked
// Modify the executeAlgorithm function to send a request to the server
async function executeAlgorithm() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/executeAlgorithm', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                alert('Algorithm executed successfully.');
            } else {
                alert('Error executing algorithm: ' + xhr.statusText);
            }
        }
    };
    xhr.send();
}
// Function to decode the polyline returned by Mapbox Directions API
function decodePolyline(encoded) {
    var coordinates = [];
    var index = 0,
        len = encoded.length;
    var lat = 0,
        lng = 0;

    while (index < len) {
        var b,
            shift = 0,
            result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        var dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        var dlng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
        lng += dlng;

        coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
}

// Create a style element
var style = document.createElement('style');
style.type = 'text/css';

// Define the CSS rules for highlighting the number
var css = '.number-highlighted { \
                background-color: #000000; \
                color: #fff; \
                font-size: 14px; \
                width: 18px; \
                height: 18px; \
                border-radius: 50%; \
                display: flex; \
                justify-content: center; \
                align-items: center; \
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.5); \
            }';

// Add the CSS rules to the style element
if (style.styleSheet) {
    // For IE
    style.styleSheet.cssText = css;
} else {
    // For other browsers
    style.appendChild(document.createTextNode(css));
}

// Append the style element to the document's head
document.head.appendChild(style);

showTourButton.addEventListener('click', async function () {
    if (startingLocation) {
        // Send selected destinations and starting location to the server to save to a JSON file
        var destinationsToSend = [];
        destinationsToSend.push(startingLocation);
        destinationsToSend.push(...presetPlaces);        
        destinationsToSend.push(...selectedDestinations);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3000/saveDestinations', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    alert('Tour saved successfully.');

                    // Execute algorithm first
                    executeAlgorithm();
                    
                    // Wait for a while to ensure the server has created the ordered_places.json file
                    setTimeout(() => {
                        map.removeLayer(markerCluster);
                        // Then fetch ordered places data
                        var jsonRequest = new XMLHttpRequest();
                        jsonRequest.open('GET', 'ordered_places.json', true);
                        jsonRequest.onreadystatechange = function () {
                            if (jsonRequest.readyState === 4) {
                                if (jsonRequest.status === 200) {
                                    var orderedPlacesData = JSON.parse(jsonRequest.responseText);
                                    var orderedPlaces = orderedPlacesData.orderedPlaces;

                                    var coordinates = orderedPlaces.map(function (place) {
                                        return [parseFloat(place.coordinates.longitude), parseFloat(place.coordinates.latitude)];
                                    });

                                    var accessToken = 'pk.eyJ1IjoiYWJpbjI4IiwiYSI6ImNsdWNyNzAxeDE3ejAya3FuOWlvNm5hbnUifQ.OA2ZJjoaTr8zHlJnY2KGnA'; // Replace with your Mapbox access token
                                    var directionsRequest = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + coordinates.join(';') + '?overview=full&steps=true&access_token=' + accessToken;

                                    var route;
                                    var routeRequest = new XMLHttpRequest();
                                    routeRequest.open('GET', directionsRequest, true);
                                    routeRequest.onreadystatechange = function () {
                                        if (routeRequest.readyState === 4) {
                                            if (routeRequest.status === 200) {
                                                var routeData = JSON.parse(routeRequest.responseText);
                                                var routeGeometry = routeData.routes[0].geometry;


                                                // Load GeoJSON data for Kerala
                                                var xhr = new XMLHttpRequest();
                                                xhr.open('GET', 'Kerala.geojson', true);
                                                xhr.onreadystatechange = function() {
                                                    if (xhr.readyState === 4) {
                                                        if (xhr.status === 200) {
                                                            var data = JSON.parse(xhr.responseText);
                                                            geojsonLayer = L.geoJSON(data, {
                                                                style: function(feature) {
                                                                    return {
                                                                        fillColor: '#3388ff',
                                                                        weight: 2,
                                                                        opacity: 1,
                                                                        color: 'white',
                                                                        fillOpacity: 0.5
                                                                    };
                                                                }
                                                            }).addTo(map);

                                                            // Populate the district select options
                                                            data.features.forEach(function(feature) {
                                                                var district = feature.properties.DISTRICT;
                                                                var option = document.createElement('option');
                                                                option.value = district;
                                                                option.text = district;
                                                                districtSelect.appendChild(option);
                                                            });

                                                            // Automatically select "All Districts" when the page loads
                                                            districtSelect.value = "All Districts";
                                                            updateDestinationOptions(currentDistrict,currentCategory);
                                                        } else {
                                                            console.error('Error fetching GeoJSON file:', xhr.statusText);
                                                        }
                                                    }
                                                };
                                                xhr.send();

                                                // Clear previous routes
                                                map.eachLayer(function (layer) {
                                                    if (layer instanceof L.Polyline) {
                                                        map.removeLayer(layer);
                                                    }
                                                });

                                                // Draw new route
                                                route = L.polyline(decodePolyline(routeGeometry)).addTo(map);
                                                map.fitBounds(route.getBounds());

                                               // Display turn-by-turn instructions
                                               var instructions = routeData.routes[0].legs[0].steps;
                                               var instructionText = instructions.map(function(step) {
                                                   return step.maneuver.instruction;
                                               }).join('<br>'); // Separate instructions by line breaks

                                              // Display turn-by-turn instructions in a detailed format
                                                var instructionsDiv = document.createElement('div');
                                                instructionsDiv.style.position = 'absolute';
                                                instructionsDiv.style.top = '10px';
                                                instructionsDiv.style.right = '10px';
                                                instructionsDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                                                instructionsDiv.style.padding = '10px';
                                                instructionsDiv.style.borderRadius = '5px';
                                                instructionsDiv.style.zIndex = '1000';
                                                instructionsDiv.style.maxWidth = '150px'; // Adjust width as needed
                                                instructionsDiv.style.height = '150px';
                                                instructionsDiv.style.overflowY = 'auto'; // Enable vertical scrolling if needed

                                                var instructionsTitle = document.createElement('h5');
                                                instructionsTitle.textContent = 'Turn-by-Turn Instructions:';
                                                instructionsDiv.appendChild(instructionsTitle);

                                                var instructionsList = document.createElement('ol');
                                                instructionsList.style.paddingLeft = '20px'; // Adjust left padding as needed

                                                var instructions = routeData.routes[0].legs[0].steps;
                                                instructions.forEach(function (step, index) {
                                                    var instructionItem = document.createElement('li');
                                                    var instructionText = document.createTextNode(
                                                        
                                                        'Travel ' + step.distance.toFixed(2) + ' meters in ' + 
                                                        step.duration.toFixed(2) + ' seconds. ' + 
                                                        'Then ' + step.maneuver.instruction
                                                    );
                                                    instructionItem.appendChild(instructionText);
                                                    instructionsList.appendChild(instructionItem);
                                                });

                                                instructionsDiv.appendChild(instructionsList);
                                                map.getContainer().appendChild(instructionsDiv);
                                            } else {
                                                console.error('Error fetching route:', routeRequest.statusText);
                                            }
                                        }
                                    };
                                    routeRequest.send();

                                    // Clear previous markers
                                    map.eachLayer(function (layer) {
                                        if (layer instanceof L.Marker) {
                                            map.removeLayer(layer);
                                        }
                                    });

                                    // Add markers for each place
                                    orderedPlaces.slice(0, orderedPlaces.length - 1).forEach(function (place) {
                                        // var marker = L.marker([place.coordinates.latitude, place.coordinates.longitude]).addTo(map);
                                        // marker.bindPopup(place.place); // Use place name for popup content

                                        // Add event listener to show place name popup on marker click
                                        // marker.on('click', function (e) {
                                        //     marker.openPopup();
                                        // });

                                        // Add numbering to the marker icon
                                        var numberIcon = L.divIcon({
                                            className: 'number-icon',
                                            html: '<div class="number-highlighted">' + place.order + '</div>'
                                        });

                                         // Add the DivIcon to the map at the specified coordinates
                                        var marker = L.marker([place.coordinates.latitude, place.coordinates.longitude], { icon: numberIcon }).addTo(map);

                                        // Set up a boolean flag to toggle popup visibility
                                        var popupVisible = false;

                                        // Add event listener to toggle place name popup on DivIcon click
                                        marker.on('click', function (e) {
                                            if (popupVisible) {
                                                marker.closePopup();
                                                popupVisible = false;
                                            } else {
                                                marker.bindPopup(place.place).openPopup();
                                                popupVisible = true;
                                            }
                                        });
                                    });
                                    
                                } else {
                                    console.error('Error fetching ordered places JSON file:', jsonRequest.statusText);
                                }
                            }
                        };
                        jsonRequest.send();
                    }, 1000); // Adjust the delay as needed

                } else {
                    alert('Error saving tour: ' + xhr.statusText);
                }
            }
        };
        map.addLayer(markerCluster);
      
        xhr.send(JSON.stringify({ destinations: destinationsToSend }));
    } else {
        alert('Please select starting location.');
    }
});





    // Event listener for starting location select change
    document.getElementById('location').addEventListener('change', function(event) {
        var selectedLocation = event.target.value;
        if (selectedLocation !== "" && selectedLocation !== "My Location") {
            document.getElementById('startNewTour').style.display = 'block';
        } else {
            document.getElementById('startNewTour').style.display = 'block';
        }
        });

    // Call the function to update starting location options
    updateStartingLocationOptions();
    
    // Import user_login.js only after the DOM content is loaded and necessary elements are available
    import('./user_login.js')
        .then(({ startNewTour }) => {
            // Assuming startNewTourBtn is the button element to start a new tour
            startNewTourBtn.addEventListener('click', async function () {
                
                try {
                   
                    // Call the startNewTour function
                    await startNewTour();
                    alert('Tour completed successfully.');
                    // Reload the page or do any other action after the tour is completed
                    location.reload();
                } catch (error) {
                    alert('Error starting new tour: ' + error.message);
                }
            });
        })
        .catch(error => {
            console.error('Error importing user_login.js:', error);
        });

       
}
});
