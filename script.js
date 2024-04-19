var map = L.map('map', {
    scrollWheelZoom: 'center'
}).setView([10.8505, 76.2711], 8);
// Mapbox tile layer setup

// Mapbox tile layer setup
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWJpbjI4IiwiYSI6ImNsdWNyNzAxeDE3ejAya3FuOWlvNm5hbnUifQ.OA2ZJjoaTr8zHlJnY2KGnA', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11', // Change map style ID here
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYWJpbjI4IiwiYSI6ImNsdWNyNzAxeDE3ejAya3FuOWlvNm5hbnUifQ.OA2ZJjoaTr8zHlJnY2KGnA' // Replace with your Mapbox access token
}).addTo(map);

var currentDistrict = "Alappuzha"; // Default district selection
var markerCluster = L.markerClusterGroup(); // Initialize marker cluster group
var geojsonLayer; // Variable to store GeoJSON layer
var districtSelect = document.getElementById('district');
var categorySelect = document.getElementById('category');
var destinationSelect = document.getElementById('destination');

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

// Load CSV data for village markers
// Define an array to store all markers
var allMarkers = [];

// Load CSV data for village markers
var csvRequest = new XMLHttpRequest();
csvRequest.open('GET', 'cities.csv', true);
csvRequest.onreadystatechange = function() {
    if (csvRequest.readyState === 4) {
        if (csvRequest.status === 200) {
            var csvData = csvRequest.responseText;
            var villages = Papa.parse(csvData, { header: true }).data;
            villages.forEach(function(village) {
                var lat = parseFloat(village.Latitude);
                var lng = parseFloat(village.Longitude);
                var name = village.Place;
                var district = village.District;
                var category = village.Categories.toLowerCase();

                var markerIcon;
                if (category === "place") {
                    markerIcon = L.icon({
                        iconUrl: 'assets/marker-icon.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    });
                } else if (category === "tourist") {
                    markerIcon = L.icon({
                        iconUrl: 'assets/tourist.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    });
                } else if (category === "facilities") {
                    markerIcon = L.icon({
                        iconUrl: 'assets/facilities.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    });
                } else if (category === "hotels") {
                    markerIcon = L.icon({
                        iconUrl: 'assets/hotel.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    });
                } else {
                    markerIcon = L.icon({
                        iconUrl: 'assets/marker-icon.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    });
                }

                var marker = L.marker([lat, lng], { icon: markerIcon });
                marker.category = category;
                marker.bindPopup(name);
                marker.destinationName = name;
                allMarkers.push(marker); // Add marker to the array
                // Add click event listener to marker
                marker.on('click', function(e) {
                    // Get the clicked marker's properties
                    var clickedDistrict = district;
                    var clickedCategory = category;
                    var clickedDestination = name;

                    // Set dropdown values to corresponding district and category
                    districtSelect.value = clickedDistrict;

                    // Update category select value based on the category of the clicked marker
                    if (clickedCategory === "place") {
                        categorySelect.value = "place";
                    } else if (clickedCategory === "tourist") {
                        categorySelect.value = "tourist";
                    } else if (clickedCategory === "facilities") {
                        categorySelect.value = "facilities";
                    } else if (clickedCategory === "hotels") {
                        categorySelect.value = "hotels";
                    } else {
                        categorySelect.value = "all";
                    }

                    // Update destination options based on the clicked district and category
                    updateDestinationOptions(clickedDistrict, clickedCategory, clickedDestination);

                    // Zoom to the clicked marker
                    map.setView([lat, lng], 12);
                });

            });

            map.addLayer(markerCluster);

            document.getElementById('status').innerText = 'Markers created successfully.';
        } else {
            document.getElementById('status').innerText = 'No data found in the CSV file.';
        }
    } else {
        // document.getElementById('status').innerText = 'Error fetching CSV file: ' + csvRequest.statusText;
    }
};
csvRequest.send();


// Function to update destination select options based on the selected district and category
function updateDestinationOptions(district, category, selectedDestination) {
    destinationSelect.innerHTML = ''; // Clear existing options

    // Add default option
    var defaultOption = document.createElement('option');
    defaultOption.value = ''; // Set value to empty string
    defaultOption.text = 'Select a destination'; // Set text to display
    defaultOption.disabled = true; // Disable the option
    defaultOption.selected = true; // Select the option by default
    destinationSelect.appendChild(defaultOption);

    // Load CSV data for village markers
    var csvRequest = new XMLHttpRequest();
    csvRequest.open('GET', 'cities.csv', true);
    csvRequest.onreadystatechange = function() {
        if (csvRequest.readyState === 4) {
            if (csvRequest.status === 200) {
                var csvData = csvRequest.responseText;

                // Parse CSV data with comma delimiter
                var villages = Papa.parse(csvData, { header: true }).data;

                // Keep track of villages added to prevent duplicates
                var addedVillages = [];

                // Populate destination select options based on the selected district and category
                var sortedDestinations = [];
                villages.forEach(function(village) {
                    // Check if the village belongs to the selected district and category
                    if ((district === "All Districts" || village.District === district) && (category === "all" || village.Categories === category)) {
                        // Check if the village name is defined and not empty
                        if (village.Place && village.Place.trim() !== "") {
                            // Check if the village has already been added
                            if (!addedVillages.includes(village.Place)) {
                                sortedDestinations.push(village.Place); // Add village to the sorted array
                                addedVillages.push(village.Place); // Add village to the added list
                            }
                        }
                    }
                });

                // Sort the destination options alphabetically
                sortedDestinations.sort().forEach(function(place) {
                    var option = document.createElement('option');
                    option.value = place;
                    option.text = place;

                    // Set latitude and longitude attributes if valid values are present
                    var village = villages.find(v => v.Place === place);
                    if (village && !isNaN(parseFloat(village.Latitude)) && !isNaN(parseFloat(village.Longitude))) {
                        option.setAttribute('latitude', village.Latitude);
                        option.setAttribute('longitude', village.Longitude);
                    }

                    destinationSelect.appendChild(option);
                });

                // Select the clicked destination
                destinationSelect.value = selectedDestination;
            } else {
                console.error('Error fetching CSV file: ' + csvRequest.statusText);
            }
        }
    };
    csvRequest.send();
}


// Event listener for district select change
districtSelect.addEventListener('change', function(event) {
    var currentDistrict = event.target.value;
    var currentCategory = categorySelect.value;
    updateDestinationOptions(currentDistrict, currentCategory); // Update destinations based on district and category
    zoomToDistrict(currentDistrict); // Zoom to the selected district
});

// Event listener for category select change
categorySelect.addEventListener('change', function(event) {
    var currentDistrict = districtSelect.value;
    var selectedCategory = event.target.value;
    var currentCategory = event.target.value;

    // Clear existing markers from the markerCluster group
    markerCluster.clearLayers();

    // Iterate over all markers and add them to the markerCluster group based on the selected category
    allMarkers.forEach(function(marker) {
        if (selectedCategory === 'all' || marker.category === selectedCategory) {
            markerCluster.addLayer(marker); // Add marker to the markerCluster group
        }
    });

    // Add the markerCluster group to the map
    map.addLayer(markerCluster);
    updateDestinationOptions(currentDistrict,currentCategory);
});

// Event listener for destination select change
destinationSelect.addEventListener('change', function(event) {
    var selectedOption = event.target.options[event.target.selectedIndex];
    var lat = parseFloat(selectedOption.getAttribute('latitude'));
    var lng = parseFloat(selectedOption.getAttribute('longitude'));
    map.setView([lat, lng], 12);

    // Find the marker with the corresponding destination name and open its popup
    allMarkers.forEach(function(marker) {
        if (marker.destinationName === event.target.value) {
            marker.openPopup();
        }
    });
});

// Function to zoom map to the selected district
function zoomToDistrict(district) {
    if (geojsonLayer) {
        geojsonLayer.eachLayer(function(layer) {
            if (layer.feature.properties.DISTRICT === district) {
                map.fitBounds(layer.getBounds());
            }
        });
    }
}



// Function to update destination select options
function updateStartingLocationOptions() {

    var startingLocationSelect = document.getElementById('location'); // Correct the typo in the HTML ID attribute
    startingLocationSelect.innerHTML = ''; // Clear existing options
    
    // Add default option
    var defaultOption = document.createElement('option');
    defaultOption.value = ''; // Set value to empty string
    defaultOption.text = 'Select a starting location'; // Set text to display
    defaultOption.disabled = true; // Disable the option
    defaultOption.selected = true; // Select the option by default
    startingLocationSelect.appendChild(defaultOption);
    
    // Add "My Location" option
    var myLocationOption = document.createElement('option');
    myLocationOption.value = 'My Location';
    myLocationOption.text = 'My Location';
    startingLocationSelect.appendChild(myLocationOption);
    
    // Load CSV data for village markers
    var csvRequest = new XMLHttpRequest();
    csvRequest.open('GET', 'cities.csv', true);
    csvRequest.onreadystatechange = function() {
        if (csvRequest.readyState === 4) {
            if (csvRequest.status === 200) {
                var csvData = csvRequest.responseText;
    
                // Parse CSV data with comma delimiter
                var villages = Papa.parse(csvData, { header: true }).data;
    
                // Log villages data for debugging
                console.log("Villages Data:", villages);
    
                // Keep track of places added to prevent duplicates
                var addedPlaces = [];
    
                // Populate starting location select options with all places
                villages.forEach(function(village) {
                    var place = village.Place;
                    // Check if the place has already been added and if it's not undefined
                    if (place && !addedPlaces.includes(place)) {
                        addedPlaces.push(place); // Add place to the added list
                    }
                });
    
                // Sort the places alphabetically
                addedPlaces.sort();
    
                // Add sorted places as options to the starting location select element
                addedPlaces.forEach(function(place) {
                    var option = document.createElement('option');
                    option.value = place;
                    option.text = place;
                    startingLocationSelect.appendChild(option);
                });
    
            } else {
                console.error('Error fetching CSV file: ' + csvRequest.statusText);
            }
        }
    };
    csvRequest.send();
}

// Event listener for starting location select change
document.getElementById('location').addEventListener('change', function(event) {
    var selectedOption = event.target.value;
    if (selectedOption === 'My Location') {
        // Check if geolocation is supported
        if (navigator.geolocation) {
            // Request geolocation
            navigator.geolocation.getCurrentPosition(function(position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                // Show user's location on the map
                map.setView([latitude, longitude], 15); // Set map view to user's location with zoom level 15
    
                // Add a marker to show the user's location
                var userMarkerIcon = L.icon({
                    iconUrl: 'assets/Marker.png', // Path to your marker image
                    iconSize: [80, 80], // Size of the icon
                    iconAnchor: [16, 32], // Anchor point of the icon (center bottom)
                    popupAnchor: [0, -32] // Popup anchor relative to the icon
                });
                var userMarker = L.marker([latitude, longitude], { icon: userMarkerIcon }).addTo(map);
                userMarker.bindPopup("Your Location").openPopup(); // Add a popup to the marker
            }, function(error) {
                // Handle geolocation error
                console.error('Error getting user location:', error.message);
                alert('Error getting user location. Please try again later.');
            });
        } else {
            // Geolocation is not supported
            alert('Geolocation is not supported by your browser.');
        }
    }
    if (selectedOption !== 'My Location') { // Check if the selected option is not "My Location"
        // Load CSV data for village markers
        var csvRequest = new XMLHttpRequest();
        csvRequest.open('GET', 'cities.csv', true);
        csvRequest.onreadystatechange = function() {
            if (csvRequest.readyState === 4) {
                if (csvRequest.status === 200) {
                    var csvData = csvRequest.responseText;
    
                    // Parse CSV data with comma delimiter
                    var villages = Papa.parse(csvData, { header: true }).data;
    
                    // Find the selected village in the CSV data
                    var selectedVillage = villages.find(function(village) {
                        return village.Place === selectedOption;
                    });
    
                    // If the selected village is found, zoom to its location on the map
                    if (selectedVillage) {
                        var lat = parseFloat(selectedVillage.Latitude);
                        var lng = parseFloat(selectedVillage.Longitude);
                        map.setView([lat, lng], 12);
                    } else {
                        console.error('Village not found:', selectedOption);
                    }
                    
                } else {
                    console.error('Error fetching CSV file: ' + csvRequest.statusText);
                }
            }
        };
        csvRequest.send();
    }
});




    // // Enable routing
    // L.Routing.control({
    //     waypoints: [
    //         L.latLng(12.6759561,74.9062622),  // Starting point
    //         L.latLng(8.3176908,77.070837)  // Destination point (replace with your destination coordinates)
    //     ]
    // }).addTo(map);