const express = require('express');
const path = require('path');
const fs = require('fs'); // Import the fs module

const csv = require('csv-parser');
const cors = require('cors');
const https = require('https');
// const { initializeApp } = require("firebase/app");
// const { getFirestore, collection, addDoc } = require("firebase/firestore");
// const { getAuth, onAuthStateChanged } = require("firebase/auth"); // Import getAuth for authentication

const app = express();
const PORT = process.env.PORT || 3000;

const rootDir = path.join(__dirname);
const citiesCsvFilePath = path.join(rootDir, 'cities.csv');
const selectedDestinationsFilePath = path.join(rootDir, 'selected_destinations.json');
const distanceFilePath = path.join(rootDir, 'distance.json');
const matrixFilePath = path.join(rootDir, 'matrix.json');
const daysFilePath = path.join(rootDir, 'days.json');
const distanceDaysFilePath = path.join(rootDir, 'distance_days.json');
const daysMatrixFilePath = path.join(rootDir, 'days_matrix.json');
const O = path.join(rootDir, 'ordered.json');

app.use(express.static(rootDir));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'home.html'));
});

// Function to read CSV file and return an array of places with coordinates
function readCsvFile(callback) {
    const places = [];
    fs.createReadStream(citiesCsvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            // Extract place and coordinates from CSV row
            const place = row.Place;
            const latitude = row.Latitude;
            const longitude = row.Longitude;
            places.push({ place, coordinates: { latitude, longitude } });
        })
        .on('end', () => {
            callback(places);
        });
}

// Function to calculate distance between two coordinates using Mapbox API
async function calculateDistance(origin, destination) {
    const mapboxApiKey = 'pk.eyJ1IjoiYWJpbjI4IiwiYSI6ImNsdWNyNzAxeDE3ejAya3FuOWlvNm5hbnUifQ.OA2ZJjoaTr8zHlJnY2KGnA';
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${mapboxApiKey}`;
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                const distanceJson = JSON.parse(data);
                const distance = distanceJson.routes[0].distance; // Distance in meters
                resolve(distance);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Function to save distances to distance.json file
function saveDistances(distances) {
    fs.writeFile(distanceFilePath, JSON.stringify(distances, null, 2), (err) => {
        if (err) {
            console.error('Error writing distance file:', err);
        } else {
             createMatrixFile();
        }
    });
}


// Function to create matrix based on selected destinations and distances
function createMatrixFile() {
    fs.readFile(selectedDestinationsFilePath, (err, selectedDestinationsData) => {
        if (err) {
            console.error('Error reading selected destinations file:', err);
            return;
        }

        fs.readFile(distanceFilePath, (err, distanceData) => {
            if (err) {
                console.error('Error reading distance file:', err);
                return;
            }

            const selectedDestinations = JSON.parse(selectedDestinationsData);
            const distances = JSON.parse(distanceData);

            const matrix = [];

            for (let i = 0; i < selectedDestinations.length; i++) {
                const row = [];

                for (let j = 0; j < selectedDestinations.length; j++) {
                    if (i === j) {
                        row.push(0); // Distance from a place to itself is 0
                    } else {
                        const origin = selectedDestinations[i].coordinates;
                        const destination = selectedDestinations[j].coordinates;

                        const distance = distances.find(entry =>
                            (entry[0] === selectedDestinations[i].place && entry[1] === selectedDestinations[j].place) ||
                            (entry[1] === selectedDestinations[i].place && entry[0] === selectedDestinations[j].place)
                        );

                        row.push(distance ? distance[2] : null);
                    }
                }

                matrix.push(row);
            }

            fs.writeFile(matrixFilePath, JSON.stringify(matrix, null, 2), (err) => {
                if (err) {
                    console.error('Error writing matrix file:', err);
                } 
            });
        });
    });
}

app.post('/saveDestinations', (req, res) => {
    const selectedDestinations = req.body.destinations;

    // Read CSV file to get places with coordinates
    readCsvFile(async (places) => {
        const distances = [];

        // Match selected destinations with places and include coordinates
        const destinationsWithCoordinates = selectedDestinations.map((selectedDestination, index) => {
            const matchingPlace = places.find((place) => place.place === selectedDestination);
            return { number: index, place: selectedDestination, coordinates: matchingPlace ? matchingPlace.coordinates : null };
        });

        // Write destinations with coordinates to JSON file
        fs.writeFile(selectedDestinationsFilePath, JSON.stringify(destinationsWithCoordinates, null, 2), (err) => {
            if (err) {
                console.error('Error writing file:', err);
                res.status(500).send('Error writing file');
                return;
            } 
        });

        // Calculate distances between each pair of selected destinations
        for (let i = 0; i < selectedDestinations.length - 1; i++) {
            for (let j = i + 1; j < selectedDestinations.length; j++) {
                const origin = places.find(place => place.place === selectedDestinations[i]).coordinates;
                const destination = places.find(place => place.place === selectedDestinations[j]).coordinates;

                if (origin && destination) {
                    try {
                        const distance = await calculateDistance(origin, destination);
                        distances.push([selectedDestinations[i], selectedDestinations[j], distance]);
                    } catch (error) {
                        console.error('Error calculating distance:', error);
                    }
                }
            }
        }

        // Save distances to distance.json file
        saveDistances(distances);

        res.status(200).send('Data saved successfully');
    });
});

// let selectedDestinations = [];
// const selectedDestinationsFile = 'selected_destinations.json';
// try {
//     if (fs.existsSync(selectedDestinationsFile)) {
//         const data = fs.readFileSync(selectedDestinationsFile, 'utf8');
//         if (data.trim() !== '') {
//             selectedDestinations = JSON.parse(data);
//         }
//     }
// } catch (error) {
//     console.error('Error parsing selected_destinations.json:', error);
// }

// let distances = [];
// const distanceFile = 'distance.json';
// try {
//     if (fs.existsSync(distanceFile)) {
//         const data = fs.readFileSync(distanceFile, 'utf8');
//         if (data.trim() !== '') {
//             distances = JSON.parse(data);
//         }
//     }
// } catch (error) {
//     console.error('Error parsing distance.json:', error);
// }

// // Create an empty matrix
// const matrix = [];

// // Initialize matrix with zeros
// for (let i = 0; i < selectedDestinations.length; i++) {
//     matrix[i] = [];
//     for (let j = 0; j < selectedDestinations.length; j++) {
//         matrix[i][j] = 0;
//     }
// }

// // Fill the matrix with distances based on selected destinations
// for (const distance of distances) {
//     const place1Index = selectedDestinations.findIndex(dest => dest.place === distance[0]);
//     const place2Index = selectedDestinations.findIndex(dest => dest.place === distance[1]);
//     const distanceValue = distance[2];

//     // // Update matrix with distance value
//     // matrix[place1Index][place2Index] = distanceValue;
//     // matrix[place2Index][place1Index] = distanceValue; // Assuming distances are symmetric
// }

// // // Store the matrix in matrix.json
// // fs.writeFileSync('matrix.json', JSON.stringify(matrix, null, 2));

// Endpoint to empty the selected_destinations.json file
app.put('/emptySelectedDestinationsFile', async (req, res) => {
    try {
        // Empty the selected_destinations.json file
        fs.writeFileSync('selected_destinations.json', '[]', 'utf8');
        fs.writeFileSync('distance.json', '[]', 'utf8');
        fs.writeFileSync('matrix.json', '[]', 'utf8');
        } catch (error) {
        console.error('Error emptying selected destinations file:', error);
        res.status(500).send('Error emptying selected destinations file');
    }
});
// // Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyB3GccrbGOWYeJb1IwwrAnoStVtouHmo-g",
//     authDomain: "trekzen2024.firebaseapp.com",
//     projectId: "trekzen2024",
//     storageBucket: "trekzen2024.appspot.com",
//     messagingSenderId: "539096075945",
//     appId: "1:539096075945:web:88e4786b9f407a2e32e3b8",
//     measurementId: "G-9ZD4X1PMM9"
// };

// // Initialize Firebase app and Firestore
// const appFirebase = initializeApp(firebaseConfig);
// const db = getFirestore(appFirebase);
// const auth = getAuth(appFirebase); // Initialize authentication

// // Function to check if the Firestore collection for the user is empty
// async function isFirestoreEmpty(userId) {
//     try {
//         const querySnapshot = await getDocs(collection(db, `selected_destinations/${userId}`));
//         return querySnapshot.empty;
//     } catch (error) {
//         console.error('Error checking Firestore collection:', error);
//         return true; // Treat any error as if the Firestore collection is empty
//     }
// }

// // Function to empty the selected_destinations.json file and store data in Firebase
// async function quickplan_emptyFiles(userId) {
//     try {

//         // Read selected_destinations.json file
//         const selectedDestinationsData = fs.readFileSync(selectedDestinationsFilePath, 'utf8');
//         const selectedDestinations = JSON.parse(selectedDestinationsData);
        
//         // Check if Firestore collection is empty
//         const isEmpty = await isFirestoreEmpty(userId);
        
//         if (!isEmpty && selectedDestinations.length > 0 ) {
//             // Iterate over each selected destination and add it to the Firestore collection
//             for (const destination of selectedDestinations) {
//                 await addDoc(collection(db, 'selected_destinations'), destination);
//             }
//             console.log('Selected destinations data stored in Firebase successfully');

//             // Empty days.json
//             fs.writeFileSync('selected_destinations.json', '[]', { flag: 'w' });

//             // Empty days_matrix.json
//             fs.writeFileSync('distance.json', '[]', { flag: 'w' });

//             // Empty distance_days.json
//             fs.writeFileSync('matrix.json', '[]', { flag: 'w' });
//           } else {
//             console.log('No data found in selected_destinations.json');
//         }
//     } catch (error) {
//         console.error('Error storing selected destinations data in Firebase and emptying file:', error);
//     }
// }

// // Handle the request to start a new tour and empty the files
// app.get('/startNew', (req, res) => {
// // Check if user is authenticated
// const user = auth.currentUser;
// if (user) {
//     // Get the user ID
//     const userId = user.uid;
//     // Empty the files and store data in Firebase under the user's ID
//     quickplan_emptyFiles(userId); 
//     // Send a response indicating that the tour has started successfully
//     res.status(200).send('New tour started successfully.');
// } else {
//     // Send a response indicating that the user is not authenticated
//     res.status(401).send('Unauthorized: User not authenticated');
// }
// });

// // Listen for changes in authentication state
// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         console.log('User is signed in.');
//     } else {
//         console.log('User is not signed in.');
//     }
// });

// Function to save places visited for a particular day to days.json
function savePlacesVisitedForDay(day, placesVisited) {
    const data = { day, placesVisited };
    let existingData = [];
    try {
        // Read existing data from the file if it exists
        existingData = JSON.parse(fs.readFileSync(daysFilePath));
    } catch (error) {
        // If file does not exist or is empty, existingData will remain an empty array
        if (error.code !== 'ENOENT') {
            console.error('Error reading existing days data:', error);
        }
    }

    // Find index of the day if it already exists
    const index = existingData.findIndex(data => data.day === day);

    // If the day exists, update placesVisited; otherwise, add a new entry
    if (index !== -1) {
        existingData[index].placesVisited = placesVisited;
    } else {
        existingData.push({ day, placesVisited });
    }

    // Write the updated data back to the file
    fs.writeFileSync(daysFilePath, JSON.stringify(existingData, null, 2));
}

// Function to save distances between places for a particular day to distance_days.json
function saveDistancesForDay(day, distances) {
    const data = { day, distances };
    let existingData = [];
    try {
        // Read existing data from the file if it exists
        existingData = JSON.parse(fs.readFileSync(distanceDaysFilePath));
    } catch (error) {
        // If file does not exist or is empty, existingData will remain an empty array
        if (error.code !== 'ENOENT') {
            console.error('Error reading existing distance days data:', error);
        }
    }

    // Find index of the day if it already exists
    const index = existingData.findIndex(data => data.day === day);

    // If the day exists, update distances; otherwise, add a new entry
    if (index !== -1) {
        existingData[index].distances = distances;
    } else {
        existingData.push({ day, distances });
    }

    // Write the updated data back to the file
    fs.writeFileSync(distanceDaysFilePath, JSON.stringify(existingData, null, 2));
}

// Function to create distance matrix for a particular day and store it in days_matrix.json
async function createMatrixFileForDay(day, placesVisited) {
    const selectedDestinations = placesVisited.map(place => place.place);
    const distances = [];

    // Calculate distances between each pair of selected destinations for the particular day
    for (let i = 0; i < selectedDestinations.length - 1; i++) {
        for (let j = i + 1; j < selectedDestinations.length; j++) {
            const origin = placesVisited.find(place => place.place === selectedDestinations[i]).coordinates;
            const destination = placesVisited.find(place => place.place === selectedDestinations[j]).coordinates;

            if (origin && destination) {
                try {
                    // Calculate distance using calculateDistance function (assuming it's defined elsewhere)
                    const distance = await calculateDistance(origin, destination);
                    distances.push([selectedDestinations[i], selectedDestinations[j], distance]);
                } catch (error) {
                    console.error('Error calculating distance:', error);
                }
            }
        }
    }

    // Save distances to distance.json file for the particular day
    saveDistancesForDay(day, distances);

    // Create an empty matrix
    const matrix = [];

    // Initialize matrix with zeros
    for (let i = 0; i < selectedDestinations.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < selectedDestinations.length; j++) {
            matrix[i][j] = 0;
        }
    }

    // Fill the matrix with distances based on selected destinations for the particular day
    for (const distance of distances) {
        const place1Index = selectedDestinations.findIndex(dest => dest === distance[0]);
        const place2Index = selectedDestinations.findIndex(dest => dest === distance[1]);
        const distanceValue = distance[2];

        // Update matrix with distance value
        matrix[place1Index][place2Index] = distanceValue;
        matrix[place2Index][place1Index] = distanceValue; // Assuming distances are symmetric
    }

    const data={day,matrix}
    // Read existing data from the file if it exists
    let existingData = [];
    try {
        existingData = JSON.parse(fs.readFileSync(daysMatrixFilePath));
    } catch (error) {
        // If file does not exist or is empty, existingData will remain an empty array
        if (error.code !== 'ENOENT') {
            console.error('Error reading existing days matrix data:', error);
        }
    }

    // Find index of the day if it already exists
    const index = existingData.findIndex(data => data.day === day);

    // If the day exists, update matrix; otherwise, add a new entry
    if (index !== -1) {
        existingData[index].matrix = matrix;
    } else {
        existingData.push({ day, matrix });
    }

    // Write the updated data back to the file
    fs.writeFileSync(daysMatrixFilePath, JSON.stringify(existingData, null, 2));

    // // Return distances and matrix for the particular day
    return { distances, matrix };
}


// Modify the /saveDestinationsByDay endpoint to append data for each day
app.post('/saveDestinationsByDay', (req, res) => {
    const day = req.body.day;
    const selectedDestinations = req.body.destinations;

    // Read CSV file to get places with coordinates
    readCsvFile(async (places) => {
        // Match selected destinations with places and include coordinates
        const destinationsWithCoordinates = selectedDestinations.map((selectedDestination,index) => {
            const matchingPlace = places.find((place) => place.place === selectedDestination);
            return {number:index, place: selectedDestination, coordinates: matchingPlace ? matchingPlace.coordinates : null };
        });

        // Save places visited for the particular day to days.json
        savePlacesVisitedForDay(day, destinationsWithCoordinates);

        // Create distance matrix for the particular day and append it to distance_days.json
        createMatrixFileForDay(day, destinationsWithCoordinates)
            .then(() => {
                res.status(200).send('Data saved successfully');
            })
            .catch(error => {
                console.error('Error creating matrix for day:', error);
                res.status(500).send('Internal server error');
            });
    });
});


// Endpoint to empty the selected_destinations.json file
app.put('/emptydaysFile', async (req, res) => {
    try {
        // Empty the selected_destinations.json file
        fs.writeFileSync('days.json', '[]', 'utf8');
        fs.writeFileSync('distance_days.json', '[]', 'utf8');
        fs.writeFileSync('days_matrix.json', '[]', 'utf8');
       
      
        } catch (error) {
        console.error('Error emptying selected destinations file:', error);
        res.status(500).send('Error emptying selected destinations file');
    }
});

// Endpoint to empty the ordered.json file
app.post('/emptyOrderedJson', (req, res) => {
    // Clear the orderedPlaces array
    let data = {};
    
    // Write the modified JSON back to the file
    fs.writeFile('ordered.json', JSON.stringify(data), 'utf8', (err) => {
        if (err) {
            console.error('Error emptying ordered.json file:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('ordered.json file emptied successfully.');
            res.status(200).send('Ordered JSON file emptied successfully.');
        }
    });
});

const { executeAlgorithm } = require('./linalg.js');





// Add a new endpoint to handle the algorithm execution request triggered by the "Show Tour" button click
app.post('/executeAlgorithm', (req, res) => {
    // Read the matrix.json file and execute the algorithm
    fs.readFile('./matrix.json', (err, data) => {
        if (err) {
            console.error('Error reading matrix file:', err);
            res.status(500).send('Internal server error');
            return;
        }
        try {
            const matrixData = JSON.parse(data);
            executeAlgorithm(matrixData); // Execute the algorithm with matrix data
           
            res.status(200).send('Algorithm execution started');
            

    
        } catch (error) {
            console.error('Error parsing matrix data:', error);
            res.status(500).send('Internal server error');
        }
    });
});

const { executeVacationAlgorithm } = require('./vacalg.js');

// Add a new endpoint to handle the algorithm execution request triggered by the "Show Tour" button click
app.post('/executeVacationAlgorithm', (req, res) => {
    // Read the matrix.json file and execute the algorithm
    fs.readFile('./days_matrix.json', (err, data) => {
        if (err) {
            console.error('Error reading matrix file:', err);
            res.status(500).send('Internal server error');
            return;
        }
        try {
            const days_matrixData = JSON.parse(data);
            executeVacationAlgorithm(days_matrixData); // Execute the algorithm with matrix data
           
            res.status(200).send('Algorithm execution started');
            

    
        } catch (error) {
            console.error('Error parsing matrix data:', error);
            res.status(500).send('Internal server error');
        }
    });
});



  
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
