document.addEventListener("DOMContentLoaded", function () {
    var tripForm = document.getElementById('tripForm');
    if (tripForm) {
        var selectedDestinations = [];
        var startingLocation = "";
        var destinationSelect = document.getElementById('destination');
        var container = document.getElementById('selectedDestinationsContainer');
        var showTourBtn = document.getElementById('showTourBtn');
        var daySelect = document.getElementById('daySelect');
        var startNewTourBtn = document.getElementById('startNewTourBtn');
        var startingLocationSelect = document.getElementById('location');
        var daysInput = document.getElementById('Days');
        var submitButton = document.getElementById('submit');
        var startingLocationSelect = document.getElementById('location');
        var Nos = document.getElementById('No');

        daysInput.addEventListener('input', updateDaySelectOptions);

        tripForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateDaySelectOptions();

        });

        document.getElementById('addToRouteButton').addEventListener('click', function () {
            var selectedDestination = destinationSelect.value;
            var startingLocation = startingLocationSelect.value;
            if (selectedDestination) {
                if (!selectedDestinations.includes(selectedDestination)) {
                    if (selectedDestination !== startingLocation) {
                        selectedDestinations.push(selectedDestination);
                        updateSelectedDestinations();
                        showTourBtn.classList.remove('d-none');
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
                if (!selectedDestinations.includes(startingLocation)) { // Check if the selected starting location is not a preset place
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

            selectedDestinations.forEach(function (destination) {
                var destinationElement = document.createElement('div');
                destinationElement.textContent = destination;
                destinationElement.classList.add('selectedDestination');

                var deleteDestinationButton = document.createElement('button');
                deleteDestinationButton.textContent = 'Delete';
                deleteDestinationButton.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2', 'delete-button');
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
        async function executeVacationAlgorithm() {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:3000/executeVacationAlgorithm', true);
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

        showTourBtn.addEventListener('click', function () {
            var currentDay = daySelect.value;

            if (selectedDestinations.length > 0 && startingLocation && currentDay) {
                // Send selected destinations and starting location to the server to save to a JSON file
                var destinationsToSend = [];
                destinationsToSend.push(startingLocation);
                destinationsToSend.push(...selectedDestinations);

                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'http://localhost:3000/saveDestinationsByDay', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            alert('Tour saved successfully.');
                            executeVacationAlgorithm();

                            // Clear selected destinations and starting location for the next day
                            selectedDestinations = [];
                            startingLocation = '';
                            // Reset dropdown menus except the "Select Day" dropdown
                            resetForm();
                            // Update the day select dropdown to the next day
                            var nextDay = parseInt(currentDay) + 1;
                            if (nextDay <= parseInt(document.getElementById('Days').value)) {
                                daySelect.value = nextDay;
                                if(nextDay === parseInt(document.getElementById('Days').value)) {
                                    startNewTourBtn.disabled = false;
                                }
                            } 
                            
                        } else {
                            alert('Error saving tour: ' + xhr.statusText);
                        }
                    }
                    
                };
                xhr.send(JSON.stringify({ destinations: destinationsToSend, day: currentDay }));
            } else {
                alert('Please select destinations and starting location.');
            }
        }); 

        // Function to reset starting location and selected destinations dropdowns
        function resetDropdowns() {
            document.getElementById('location').selectedIndex = 0; // Reset starting location dropdown
            document.getElementById('destination').selectedIndex = 0; // Reset selected destinations dropdown
        }

        function resetForm() {
            // Reset all dropdown menus to their default options
            var dropdowns = document.querySelectorAll('.form-select');
            dropdowns.forEach(function (dropdown) {
                dropdown.selectedIndex = 0; // Reset to default option
            });
            // Clear selected destinations container
            var selectedDestinationsContainer = document.getElementById('selectedDestinationsContainer');
            selectedDestinationsContainer.innerHTML = '';
            // Reset starting location and selected destinations dropdowns
            resetDropdowns();
        }

        function updateDaySelectOptions() {
            var daySelect = document.getElementById('daySelect');
            if (daySelect) {
                var days = document.getElementById('Days').value;
                if (days !== "") {
                    daySelect.innerHTML = '';

                    for (var i = 1; i <= parseInt(days); i++) {
                        var option = document.createElement('option');
                        option.textContent = 'Day ' + i;
                        option.value = i;
                        daySelect.appendChild(option);
                    }
                } else {
                    console.error("Number of days not entered.");
                }
            } else {
                console.error("Day select element not found.");
            }
        }

        var submitButton = document.getElementById('submit');
        submitButton.addEventListener('click', function (event) {
            event.preventDefault();
            var daysInput = document.getElementById('Days');
            var days = parseInt(daysInput.value);
            if (!isNaN(days) && days > 0) {
                generateDayButtons(days);
                document.getElementById('daySelectCard').style.display = 'block';
            } else {
                alert('Please enter a valid number of days.');
            }
                    // Hide the submit button after it's clicked
                    Nos.style.display = 'none';
        });

        document.getElementById('location').addEventListener('change', function (event) {
            var selectedLocation = event.target.value;
            if (selectedLocation !== "" && selectedLocation !== "My Location") {
                document.getElementById('selectedDestinationsContainer').style.display = 'block';
                document.getElementById('showTourBtn').style.display = 'block';
                document.getElementById('startNewTourBtn').style.display = 'block';
            } else {
                document.getElementById('selectedDestinationsContainer').style.display = 'none';
                document.getElementById('showTourBtn').style.display = 'none';
                document.getElementById('startNewTourBtn').style.display = 'block';
            }
        });

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

        function displayPathForDay(day) {
            // Wait for a while to ensure the server has created the ordered_places.json file
            setTimeout(() => {
                // Then fetch ordered places data
                var jsonRequest = new XMLHttpRequest();
                jsonRequest.open('GET', 'ordered.json', true);
                jsonRequest.onreadystatechange = function () {
                    if (jsonRequest.readyState === 4) {
                        if (jsonRequest.status === 200) {
                            var orderedPlacesData = JSON.parse(jsonRequest.responseText);
                            if (orderedPlacesData && orderedPlacesData.orderedPlaces) {
                                var orderedPlaces = orderedPlacesData.orderedPlaces;
                                var placesForDay = orderedPlaces.filter(place => place.day === day.toString());
                                if (placesForDay.length > 0) {
                                    var coordinates = placesForDay.map(place => {
                                        return [parseFloat(place.coordinates.longitude), parseFloat(place.coordinates.latitude)];
                                    });
                                    map.removeLayer(markerCluster);
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
                                        xhr.onreadystatechange = function () {
                                            if (xhr.readyState === 4) {
                                                if (xhr.status === 200) {
                                                    var data = JSON.parse(xhr.responseText);
                                                    geojsonLayer = L.geoJSON(data, {
                                                        style: function (feature) {
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
                                                    data.features.forEach(function (feature) {
                                                        var district = feature.properties.DISTRICT;
                                                        var option = document.createElement('option');
                                                        option.value = district;
                                                        option.text = district;
                                                        districtSelect.appendChild(option);
                                                    });

                                                    // Automatically select "All Districts" when the page loads
                                                    districtSelect.value = "All Districts";
                                                    updateDestinationOptions(currentDistrict, currentCategory);
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
                                        var instructionText = instructions.map(function (step) {
                                            return step.maneuver.instruction;
                                        }).join('<br>'); // Separate instructions by line breaks

                                        // Display turn-by-turn instructions in a detailed way
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
                            orderedPlaces.forEach(function (place) {
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
                        }  else {
                            alert('No data found for Day ' + day + '. Please add some destinations.');
                        }
                    } else {
                            alert('No data found. Please add some destinations.');
                        }
                        } else {
                            console.error('Error fetching ordered places JSON file:', jsonRequest.statusText);
                        }
                    }
                };
                jsonRequest.send();
            }, 1000); // Adjust the delay as needed
        }

        function generateDayButtons(numDays) {
            var buttonContainer = document.getElementById('day-buttons');

            for (var i = 1; i <= numDays; i++) {
                var button = document.createElement('button');
                button.textContent = 'Day ' + i;
                button.value = i;
                button.addEventListener('click', function () {
                    var selectedDay = this.value;
                    displayPathForDay(selectedDay);
                });
                buttonContainer.appendChild(button);
            }
        }
        
         // Call the function to update starting location options
      updateStartingLocationOptions();

      // Import user_login.js only after the DOM content is loaded and necessary elements are available
    import('./user_login.js')
    .then(({ VstartNewTour }) => {
        // Assuming startNewTourBtn is the button element to start a new tour
        startNewTourBtn.addEventListener('click', async function () {
            
            try {
                // Call the startNewTour function
                await VstartNewTour();
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



