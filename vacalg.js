const fs = require('fs');

function totalDistance(path, days_matrix) {
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const cityA = path[i];
        const cityB = path[i + 1];
        // Retrieve the distance between cityA and cityB from the matrix data
        const distance = days_matrix[cityA][cityB];
        // Add the distance to the total distance
        dist += distance;
    }
    return dist;
}


function nearestNeighbor(days_matrix) {
    const numCities = days_matrix.length;
    let path = [0]; // Start from the first city (index 0)
    let visited = new Array(numCities).fill(false); // Initialize all cities as unvisited
    visited[0] = true; // Mark the 0th city as visited

    let totalDist = 0; // Variable to store the total distance

    while (path.length < numCities) { // Continue until all cities are visited
        let nearestCity;
        let minDistance = Infinity;

        // Find nearest unvisited city based on the distance from the last city in the path
        for (let i = 0; i < numCities; i++) {
            if (!visited[i]) {
                const distance = days_matrix[path[path.length - 1]][i];
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCity = i;
                }
            }
        }

        // Add the distance to the total distance
        totalDist += minDistance;

        // Mark the nearest unvisited city as visited and add it to the path
        visited[nearestCity] = true;
        path.push(nearestCity);
    }

    return { path, totalDist }; // Return both the path and the total distance
}

function linKernighan(coords, initialPath, initialDistance, maxIterations) {
    let bestPath = initialPath.slice(); // Store the best path found so far
    let bestDistance = initialDistance;
    let iterationsWithoutImprovement = 0;

    while (iterationsWithoutImprovement < maxIterations) {
        let improved = false;
        for (let i = 1; i < initialPath.length; i++) {
            for (let j = i ; j < initialPath.length; j++) {
                let newPath = initialPath.slice();
                const temp = newPath[i];
                newPath[i] = newPath[j];
                newPath[j] = temp;
                newDistance = totalDistance(newPath, coords);
                if (newDistance < bestDistance) {
                    bestPath = newPath.slice();
                    bestDistance = newDistance;
                    iterationsWithoutImprovement = 0; // Reset the counter
                    improved = true;
                }
            }
        }
        if (!improved) {
            iterationsWithoutImprovement++;
        }
    }
    
    return { bestPath, bestDistance };
}


function executeVacationAlgorithm(days_matrix) {
    const starttime = Date.now();
    const vresult = []; // Array to store results for each day

    console.log("Input Data:");
    console.log(days_matrix);

    days_matrix.forEach((day, index) => {
        console.log(`\nProcessing data for day ${day.day}:`);
        const days_matrix = day.matrix;
        const numPlaces = days_matrix.length; // Assuming days_matrix represents places
        let shortestPath, shortestDistance;
        if (numPlaces >= 10) {
            // Execute nearest neighbor algorithm
            let { path, totalDist } = nearestNeighbor(days_matrix);
            console.log("Using Nearest Neighbor Algorithm:");
            console.log("Initial Path:", path);
            console.log("Shortest Total Distance:", totalDist);
            shortestPath = path;
            shortestDistance = totalDist;

        } else {
            // Execute Lin-Kernighan algorithm
            let { path, totalDist } = nearestNeighbor(days_matrix); // Start with nearest neighbor path
            const maxIterations = 10; // Set a maximum number of iterations for Lin-Kernighan
            let { bestPath, bestDistance } = linKernighan(days_matrix, path, totalDist, maxIterations);

            console.log("Using Lin-Kernighan Algorithm:");
            console.log("Shortest Path:", bestPath);
            console.log("Shortest Total Distance:", bestDistance.toFixed(2));
            shortestPath = bestPath;
            shortestDistance = bestDistance;
        }
    

    
    // Save result to vacresult.json
    vresult.push({
        day: day.day,
        shortestPath: shortestPath,
        shortestDistance: shortestDistance
    });
});
console.log("Time taken:", (Date.now() - starttime) / 1000, "seconds");


    const resultJSON = JSON.stringify(vresult, null, 2);
    fs.writeFile('vacresult.json', resultJSON, (err) => {
        if (err) {
            console.error('Error writing result to file:', err);
            return;
        }
        console.log('Result saved to vacresult.json');

        createOrderedPlacesFile()
    });
}






function createOrderedPlacesFile() {
    try {
        // Read days.json
        const daysData = JSON.parse(fs.readFileSync('days.json', 'utf8'));
        if (!daysData || !Array.isArray(daysData)) {
            throw new Error('Invalid or empty days data');
        }

        // Read vacresult.json
        const resultData = JSON.parse(fs.readFileSync('vacresult.json', 'utf8'));
        if (!resultData || !Array.isArray(resultData)) {
            throw new Error('Invalid or empty result data');
        }

        const orderedPlaces = [];
        resultData.forEach((dayResult) => {
            const dayData = daysData.find((day) => day.day === dayResult.day);
            if (dayData) {
                const shortestPath = dayResult.shortestPath;
                shortestPath.forEach((index,order) => {
                    const place = dayData.placesVisited.find((visitedPlace) => visitedPlace.number === index);
                    if (place) {
                        orderedPlaces.push({
                            day: dayResult.day,
                            number: place.number,
                            place: place.place,
                            coordinates: place.coordinates,
                            order: order + 1
                        });
                    }
                });
            }
        });

        const orderedResult = {
            orderedPlaces,
            totalDistance: resultData.reduce((acc, curr) => acc + curr.shortestDistance, 0)
        };

        fs.writeFileSync('ordered.json', JSON.stringify(orderedResult, null, 2));
        console.log('Ordered places and total distance saved to ordered.json');
    } catch (error) {
        console.error('Error creating ordered places file:', error);
    }
}






// Export the executeAlgorithm function
module.exports = { executeVacationAlgorithm };