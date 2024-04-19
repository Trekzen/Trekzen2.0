const fs = require('fs');

function totalDistance(path, matrixData) {
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const cityA = path[i];
        const cityB = path[i + 1];
        // Retrieve the distance between cityA and cityB from the matrix data
        distance = matrixData[cityA][cityB];
        // Add the distance to the total distance
        dist += distance;
    }
    return dist;
}

function nearestNeighbor(matrixData) {
    const numCities = matrixData.length;
    let path = [0]; // Start from the first city (index 0)
    
    let unvisitedCities = Array.from(Array(numCities).keys()).slice(1);
   

    let totalDist = 0; // Variable to store the total distance
    
    while (path.length < numCities) { // Continue until all cities are visited
        let nearestCity;
        let minDistance = Infinity;

        for (let i = 0; i < unvisitedCities.length; i++) {
            const city = unvisitedCities[i];
            const distance = matrixData[path[path.length - 1]][city]; // Distance from the last city in the path to the current city
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        }

        // Add the distance to the total distance
        totalDist += minDistance;
      

        // Move to the nearest unvisited city
        path.push(nearestCity);
        unvisitedCities = unvisitedCities.filter(city => city !== nearestCity);
    }
    totalDist += matrixData[path[path.length - 1]][0];

    // Close the loop by returning to the starting city
    path.push(0); // Return to the starting city (index 0)
    console.log(totalDist);

    return { path, totalDist }; // Return both the path and the total distance
}



function linKernighan(coords, initialPath, initialDistance, maxIterations) {
    let bestPath = initialPath.slice(); // Store the best path found so far
    let bestDistance = initialDistance;
    let iterationsWithoutImprovement = 0;

    while (iterationsWithoutImprovement < maxIterations) {
        let improved = false;
        for (let i = 1; i < initialPath.length - 1; i++) {
            for (let j = i + 1; j < initialPath.length - 1; j++) {
                let newPath = bestPath.slice();
                const temp = newPath[i];
                newPath[i] = newPath[j];
                newPath[j] = temp;
                newDistance = totalDistance(newPath, coords);
                console.log(newPath);
                console.log(newDistance);
                if (newDistance < bestDistance) {
                    bestPath = newPath;
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


function executeAlgorithm(matrixData) {
    const starttime = Date.now();

    console.log("Matrix Data:");
    console.log(matrixData);

    const numPlaces = matrixData.length; // Assuming matrixData represents places
    let bestPath; // Define bestPath variable here
    let bestDistance; // Define bestDistance variable here

    if (numPlaces >= 10) {
        // Execute nearest neighbor algorithm
        let { path, totalDist } = nearestNeighbor(matrixData);
        console.log("\nInitial Path (Nearest Neighbor):");
        console.log(path);
        console.log(totalDist);
        bestPath = path; // Assign bestPath here
        bestDistance = totalDist; // Assign bestDistance here
    } else {
      
        // Execute Lin-Kernighan algorithm
        let { path, totalDist } = nearestNeighbor(matrixData); // Start with nearest neighbor path
        const maxIterations = 10; // Set a maximum number of iterations for Lin-Kernighan
        let { bestPath: lkBestPath, bestDistance: lkBestDistance } = linKernighan(matrixData, path, totalDist, maxIterations);

        console.log("\nShortest Path found using Lin-Kernighan:");
        console.log(lkBestPath);
        console.log(lkBestDistance);
        // console.log(`\nShortest Total Distance: ${bestDistance.toFixed(2)}`);
        bestPath = lkBestPath; // Assign bestPath here
        bestDistance = lkBestDistance; // Assign bestDistance here
    }

    console.log("Time taken:", (Date.now() - starttime) / 1000, "seconds");
    // Save result to result.json
    const result = {
        shortestPath: bestPath,
        shortestDistance: bestDistance !== undefined ? bestDistance.toFixed(2) : "N/A" // Check if bestDistance is defined
    };
    
    const resultJSON = JSON.stringify(result, null, 2);
    fs.writeFile('result.json', resultJSON, (err) => {
        if (err) {
            console.error('Error writing result to file:', err);
            return;
        }
        console.log('Result saved to result.json');
        
        // Call createOrderedPlacesFile after writing result.json
        createOrderedPlacesFile();
    
    // Function to decode the polyline returned by Mapbox Directions API

});


}



function createOrderedPlacesFile() {
    try {
        // Read selected_destinations.json
        const destinationData = JSON.parse(fs.readFileSync('selected_destinations.json', 'utf8'));
        if (!destinationData || !Array.isArray(destinationData)) {
            throw new Error('Invalid or empty destination data');
        }

        // Read result.json
        const resultData = JSON.parse(fs.readFileSync('result.json', 'utf8'));
        if (!resultData || typeof resultData !== 'object') {
            throw new Error('Invalid or empty result data');
        }

        // Your existing code to generate ordered_places.json...
        const orderedPlaces = [];
        resultData.shortestPath.forEach((index, order) => {
            const place = destinationData.find(dest => dest.number === index);
            if (place) {
                orderedPlaces.push({
                    ...place,
                    order: order + 1
                });
            }
        });
        const totalDistance = resultData.shortestDistance;
        const orderedResult = {
            orderedPlaces,
            totalDistance
        };
        fs.writeFileSync('ordered_places.json', JSON.stringify(orderedResult, null, 2));
        console.log('Ordered places and total distance saved to ordered_places.json');
    } catch (error) {
        console.error('Error creating ordered places file:', error);
    }
}

// Export the executeAlgorithm function
module.exports = { executeAlgorithm };