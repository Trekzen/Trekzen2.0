import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, query,where, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB3GccrbGOWYeJb1IwwrAnoStVtouHmo-g",
    authDomain: "trekzen2024.firebaseapp.com",
    projectId: "trekzen2024",
    storageBucket: "trekzen2024.appspot.com",
    messagingSenderId: "539096075945",
    appId: "1:539096075945:web:88e4786b9f407a2e32e3b8",
    measurementId: "G-9ZD4X1PMM9"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize db once

let UserCreds = JSON.parse(sessionStorage.getItem("user-creds"));
let UserInfo = JSON.parse(sessionStorage.getItem("user-info"));
let GreetHead = document.getElementById('greet');
let PGreetHead = document.getElementById('pgreet');
let SignOutBtn= document.getElementById('signoutbutton');

let Signout =()=>{
signOut(auth).then(()=>{
sessionStorage.removeItem("user-creds");
sessionStorage.removeItem("user-info");
window.location.href = "Loginpage/user_login.html";
})
}

const getSelectedDestinations = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const userDestinationsRef = collection(db, 'users', user.uid, 'selected_destinations');
        const querySnapshot = await getDocs(userDestinationsRef);
        const destinations = [];
        querySnapshot.forEach(doc => {
            const destinationData = doc.data();
            destinations.push(destinationData); // Add places data to the array
        });
        // Sort destinations by the "order" field
        destinations.sort((a, b) => a.order - b.order);
        return destinations;
    } catch (error) {
        console.error('Error fetching selected destinations:', error);
        return [];
    }
};

// Function to render tour data on the profile page
const renderTourData = (destinations) => {
    const tourList = document.getElementById('tourList');
    tourList.innerHTML = ''; // Clear previous tour data

    // Group destinations by numbering
    const groupedDestinations = destinations.reduce((groups, destination) => {
        const numbering = destination.numbering;
        if (!groups[numbering]) {
            groups[numbering] = [];
        }
        groups[numbering].push(destination);
        return groups;
    }, {});

    // Render each tour
    Object.entries(groupedDestinations).forEach(([numbering, tourDestinations], index) => {
        const tourItem = document.createElement('div');
        const places = tourDestinations.map(destination => destination.place).join(' -> ');
        tourItem.innerHTML = `
            <p><strong>Tour ${index + 1} :</strong> ${places}</p>
            
        `;
        tourList.appendChild(tourItem);
    });
    // Show or hide the "Daycation" container based on data
    const daycationContainer = document.getElementById("Short");
    if (Object.keys(groupedDestinations).length === 0) {
        daycationContainer.closest(".card-body").style.display = "none";
    } else {
        daycationContainer.closest(".card-body").style.display = "block";
    }
};

const getDays = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const userDestinationsRef = collection(db, 'Vacation_users', user.uid, 'selected_destinations');
        
        // Fetch the selected destinations and sort them by numbering
        const querySnapshot = await getDocs(query(userDestinationsRef, orderBy('numbering')));

        const destinations = [];
        querySnapshot.forEach(doc => {
            const destinationData = doc.data();
            destinations.push(destinationData);
        });

        return destinations;
    } catch (error) {
        console.error('Error fetching selected destinations:', error);
        return [];
    }
};



const renderDays = (destinations) => {
    console.log('My function is called!');
    const destinationList = document.getElementById('tour');
    destinationList.innerHTML = ''; // Clear previous destination data

    // Group destinations by numbering (representing different tours)
    const tours = {};
    destinations.forEach(destination => {
        const numbering = destination.numbering;
        if (!tours[numbering]) {
            tours[numbering] = [];
        }
        tours[numbering].push(destination);
    });

    // Sort tours by numbering
    const sortedTours = Object.keys(tours).sort((a, b) => a - b);

    // Render each tour
    sortedTours.forEach(numbering => {
        const tourDestinations = tours[numbering];

        const tourContainer = document.createElement('div');
        tourContainer.classList.add('tour-container');
        tourContainer.innerHTML = `<h3>Tour</h3>`;

        // Group destinations within the tour by day
        const days = {};
        tourDestinations.forEach(destination => {
            const day = destination.day;
            if (!days[day]) {
                days[day] = [];
            }
            days[day].push(destination);
        });

        // Sort days within the tour by day number
        const sortedDays = Object.keys(days).sort((a, b) => a - b);

        // Render each day's destinations within the tour
        sortedDays.forEach(day => {
            const destinationsByDay = days[day];
            const dayContainer = document.createElement('div');
            dayContainer.classList.add('day-container');
            dayContainer.innerHTML = `<h5>Day ${day}</h5>`;

            // Sort destinations within the day by order
            destinationsByDay.sort((a, b) => a.order - b.order);

            const destinationList = document.createElement('ul');
            destinationList.classList.add('destination-list');
            destinationsByDay.forEach(destination => {
                const listItem = document.createElement('li');
                listItem.textContent = destination.place;
                destinationList.appendChild(listItem);
            });

            dayContainer.appendChild(destinationList);
            tourContainer.appendChild(dayContainer);
        });

        destinationList.appendChild(tourContainer);
    });


    // Show or hide the "Long Trip Tour" container based on data
    const longTripContainer = document.getElementById("Long");
    if (Object.keys(tours).length === 0) {
        longTripContainer.closest(".card-body").style.display = "none";
    } else {
        longTripContainer.closest(".card-body").style.display = "block";
    }
};

let CheckCred = async () => {
    try {
        // Wait for the authentication state to change
        await new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe(); // Unsubscribe to prevent memory leaks
                resolve(user); // Resolve the promise with the user object
            });
        });

        // Check if the user is authenticated
        const user = auth.currentUser;
        if (user) {
            if (GreetHead || PGreetHead) {
                GreetHead.innerText = `${UserInfo.firstname} ${UserInfo.lastname}`;
                GreetHead.classList.add('animated', 'fadeInUp');
                PGreetHead.innerText = `${UserInfo.firstname} ${UserInfo.lastname}`;
            }
            // Call getSelectedDestinations function
            const destinations = await getSelectedDestinations();
            renderTourData(destinations); // Render the tour data on the profile page
            // Call getSelectedDestinations function
            const destination = await getDays();
            renderDays(destination); // Render the tour data on the profile page
            getComments(); // Call getComments after Firestore instance is initialized
        } else {
            // Redirect to the login page if the user is not authenticated
            window.location.href = "Loginpage/user_login.html";
        }
    } catch (error) {
        console.error('Error checking credentials:', error);
    }
};

window.addEventListener('load', CheckCred);
// SignOutBtn.addEventListener('click', Signout);
SignOutBtn.addEventListener('click',Signout);

const addComment = async (comment) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        await addDoc(collection(db, "comments"), {
            text: comment,
            user: UserInfo.firstname + " " + UserInfo.lastname, // Include user's name with comment
            userId: user.uid,// Include user's ID
            timestamp: serverTimestamp()
        });

        console.log('Comment added successfully.');
    } catch (error) {
        console.error('Error adding comment: ', error);
    }
};

const getComments = async () => {
    try {
        // Fetch comments even if the user is not authenticated
        const querySnapshot = await getDocs(query(collection(db, "comments"), orderBy("timestamp", "desc")));
        const commentsList = document.getElementById('commentsList');
        
        //commentsList.innerHTML = ''; // Clear previous comments
        querySnapshot.forEach(doc => {
            const commentData = doc.data();
            const commentElement = document.createElement('div');
            commentElement.innerHTML = `
                <p><strong>${commentData.user}</strong>: ${commentData.text}</p>
                <hr>
            `;
            commentsList.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error getting comments: ', error);
    }
};

const commentForm = document.getElementById('commentForm');
if (commentForm) {
    // Add event listener or perform other operations related to commentForm
    commentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const commentInput = document.getElementById('comment');
        const commentText = commentInput.value.trim();
        if (commentText !== '') {
            await addComment(commentText);
            commentInput.value = ''; // Clear the input field
            getComments(); // Refresh comments list
        
        }
    });
} else {
    console.log('commentForm element not found on this page.');
}


const addSelectedDestinationsToFirebase = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Fetch selected destinations data from the server
        const response = await fetch('ordered_places.json');
        if (!response.ok) {
            throw new Error('Failed to fetch selected destinations data');
        }
        const selectedDestinations = await response.json();

        // Check if there are selected destinations
        if (selectedDestinations && selectedDestinations.orderedPlaces.length > 0) {
            // Fetch the existing count of destinations for this user
            const userDestinationsRef = collection(db, 'users', user.uid, 'selected_destinations');
            const userDestinationsSnapshot = await getDocs(userDestinationsRef);
            const userDestinationCount = userDestinationsSnapshot.size + 1; // Increment for the new addition

            // Sort selected destinations based on their 'number' property
            const sortedDestinations = selectedDestinations.orderedPlaces.sort((a, b) => a.number - b.number);

            // Add each destination to Firestore with user information and numbering
            for (const destination of sortedDestinations) {
                await addDoc(userDestinationsRef, {
                    ...destination,
                    userId: user.uid, // Include user ID
                    userEmail: user.email, // Include user email
                    numbering: userDestinationCount // Assign the numbering
                });
            }

            console.log('Selected destinations data stored in Firebase successfully');

            // Empty the selected_destinations.json file
            fetch('http://localhost:3000/emptySelectedDestinationsFile', {
                method: 'PUT'
            })
            .then(response => {
                if (response.ok) {
                    console.log('selected_destinations.json file emptied successfully');
                } else {
                    throw new Error('Failed to empty selected_destinations.json file');
                }
            })
            .catch(error => {
                console.error('Error emptying selected_destinations.json file:', error);
            });

        } else {
            console.log('No data found in selected destinations');
        }
    } catch (error) {
        console.error('Error storing selected destinations data in Firebase:', error);
    }
};




// Function to start a new tour
const startNewTour = async () => {
    try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (user) {
            await addSelectedDestinationsToFirebase(); // Add selected destinations to Firebase
            console.log('New tour started successfully.');
        } else {
            console.log('Unauthorized: User not authenticated');
        }
    } catch (error) {
        console.error('Error starting new tour:', error);
    }
};

// Export the startNewTour function
export { startNewTour };



const adddaysToFirebase = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Fetch selected destinations data from the server
        const response = await fetch('ordered.json');
        if (!response.ok) {
            throw new Error('Failed to fetch days data');
        }
        const selectedDestinations = await response.json();

        // Check if there are selected destinations
        if (selectedDestinations && selectedDestinations.orderedPlaces.length > 0) {
            // Fetch the existing count of destinations for this user
            const userDestinationsRef = collection(db, 'Vacation_users', user.uid, 'selected_destinations');
            const userDestinationsSnapshot = await getDocs(userDestinationsRef);
            const userDestinationCount = userDestinationsSnapshot.size + 1; // Increment for the new addition

            // Sort selected destinations based on their 'number' property
            const sortedDestinations = selectedDestinations.orderedPlaces.sort((a, b) => a.number - b.number);

            // Add each destination to Firestore with user information and numbering
            for (const destination of sortedDestinations) {
                await addDoc(userDestinationsRef, {
                    day: destination.day,
                    place: destination.place,
                    coordinates: destination.coordinates,
                    order: destination.order,
                    userId: user.uid, // Include user ID
                    userEmail: user.email, // Include user email
                    numbering: userDestinationCount // Assign the numbering
                });
            }

            console.log('Days data stored in Firebase successfully');

            // Empty the selected_destinations.json file
            fetch('http://localhost:3000/emptydaysFile', {
                method: 'PUT'
            })
            .then(response => {
                if (response.ok) {
                    console.log('days.json file emptied successfully');
                } else {
                    throw new Error('Failed to empty days.json file');
                }
            })
            .catch(error => {
                console.error('Error emptying days.json file:', error);
            });

            emptyOrderedJson();
            
        } else {
            console.log('No data found in days');
        }
    } catch (error) {
        console.error('Error storing days data in Firebase:', error);
    }
};

// Function to empty the ordered.json file
function emptyOrderedJson() {
    fetch('/emptyOrderedJson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log(data);
       
    })
    .catch(error => {
        console.error('Error emptying ordered.json file:', error);
        
    });
}




// Function to start a new tour
const VstartNewTour = async () => {
    try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (user) {
            await adddaysToFirebase(); // Add selected destinations to Firebase
            console.log('New tour started successfully.');
        } else {
            console.log('Unauthorized: User not authenticated');
        }
    } catch (error) {
        console.error('Error starting new tour:', error);
    }
};

// Export the startNewTour function
export { VstartNewTour };



// Initial call to get comments when the page loads
getComments();
const fetchBusinesses = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Reference to the businesses collection
        const businessesCollection = collection(db, "businesses");

        // Query businesses collection based on name, type, and location
        const querySnapshot = await getDocs(query(businessesCollection, 
            where("userId", "==", user.uid) // Only fetch businesses for the current user
        ));

        const businessTableBody = document.getElementById("businessTableBody");

        if (!businessTableBody) {
            throw new Error('businessTableBody element not found');
        }

        if (querySnapshot.size === 0) {
            // If no businesses, display a message
            businessTableBody.innerHTML = `
                <tr>
                    <td colspan="4">No businesses added yet.</td>
                </tr>
            `;
        } else {
            // If businesses exist, populate the table
            businessTableBody.innerHTML = ''; // Clear previous data
            querySnapshot.forEach((doc) => {
                const business = doc.data();
                businessTableBody.innerHTML += `
                    <tr>
                        <td>${business.name}</td>
                        <td>${business.type}</td>
                        <td>${business.location}</td>
                        <td>${business.approval}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error fetching businesses: ", error);
        // Display error message
        const businessTableBody = document.getElementById("businessTableBody");
        if (businessTableBody) {
            businessTableBody.innerHTML = `
                <tr>
                    <td colspan="4">Error fetching businesses.</td>
                </tr>
            `;
        }
    }
};



// Listen for changes in authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in.');
        fetchBusinesses(); // Fetch businesses when user is signed in
    } else {
        console.log('User is not signed in.');
    }
});
const addBusiness = async (businessName, businessType, location) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Check if the business already exists
        const businessesCollection = collection(db, "businesses");
        const querySnapshot = await getDocs(query(businessesCollection, 
            where("name", "==", businessName),
            where("type", "==", businessType),
            where("location", "==", location)
        ));

        if (!querySnapshot.empty) {
            // Business already exists, display an alert
            alert("This business already exists.");
            return;
        }

        // Add the new business to Firestore
        await addDoc(businessesCollection, {
            name: businessName,
            type: businessType,
            location: location,
            userId: user.uid, // Include user ID
            userEmail: user.email, // Include user email
            approval: "Not Approved Yet"
        });

        // Display success message or perform any other action
        alert('Business added successfully.');
    } catch (error) {
        console.error('Error adding business: ', error);
        // Display error message or perform any other action
        alert('Error adding business. Please try again later.');
    }
};

export { addBusiness };

//here starts the code for add place
const fetchPlaces = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Reference to the businesses collection
        const placeCollection = collection(db, "newplace");

        // Query businesses collection based on name, type, and location
        const querySnapshot = await getDocs(query(placeCollection, 
            where("userId", "==", user.uid) // Only fetch businesses for the current user
        ));

        const placeTableBody = document.getElementById("placeTableBody");

        if (!placeTableBody) {
            throw new Error('placeTableBody element not found');
        }

        if (querySnapshot.size === 0) {
            // If no businesses, display a message
            placeTableBody.innerHTML = `
                <tr>
                    <td colspan="4">No new places added yet.</td>
                </tr>
            `;
        } else {
            // If businesses exist, populate the table
            placeTableBody.innerHTML = ''; // Clear previous data
            querySnapshot.forEach((doc) => {
                const place = doc.data();
                placeTableBody.innerHTML += `
                    <tr>
                        <td>${place.name}</td>
                        <td>${place.type}</td>
                        <td>${place.location}</td>
                        <td>${place.approval}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error fetching places: ", error);
        // Display error message
        const placeTableBody = document.getElementById("placeTableBody");
        if (placeTableBody) {
            placeTableBody.innerHTML = `
                <tr>
                    <td colspan="4">Error fetching places.</td>
                </tr>
            `;
        }
    }
};



// Listen for changes in authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in.');
        fetchPlaces(); // Fetch place when user is signed in
    } else {
        console.log('User is not signed in.');
    }
});
const addPlace = async (placeName, placeType, location) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Check if the business already exists
        const placeCollection = collection(db, "newplace");
        const querySnapshot = await getDocs(query(placeCollection, 
            where("name", "==", placeName),
            where("type", "==", placeType),
            where("location", "==", location)
        ));

        if (!querySnapshot.empty) {
            // Business already exists, display an alert
            alert("This place already exists.");
            return;
        }

        // Add the new business to Firestore
        await addDoc(placeCollection, {
            name: placeName,
            type: placeType,
            location: location,
            userId: user.uid, // Include user ID
            userEmail: user.email, // Include user email
            approval: "Not Approved Yet"
        });

        // Display success message or perform any other action
        alert('Place added successfully.');
    } catch (error) {
        console.error('Error adding place: ', error);
        // Display error message or perform any other action
        alert('Error adding place. Please try again later.');
    }
};

export { addPlace };
