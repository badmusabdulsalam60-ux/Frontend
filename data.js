// ==========================================
// HARVEST LISTINGS STORAGE
// ==========================================

const STORAGE_KEY = "agroconnect-practice-listings";


// GET ALL HARVEST LISTINGS

function getListings() {

    const savedData = localStorage.getItem(STORAGE_KEY);

    return savedData ? JSON.parse(savedData) : [];

}


// SAVE HARVEST LISTINGS

function saveListings(listings) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(listings)
    );

}


// ADD A NEW HARVEST LISTING

function addListing(listing) {

    const currentListings = getListings();

    currentListings.push(listing);

    saveListings(currentListings);

}


// CLEAR PRACTICE HARVEST LISTINGS

function clearPracticeListings() {

    localStorage.removeItem(STORAGE_KEY);

}



// ==========================================
// BUYER PURCHASE REQUESTS STORAGE
// ==========================================

const REQUESTS_STORAGE_KEY = "agroconnect-practice-requests";


// GET ALL BUYER REQUESTS

function getRequests() {

    const savedRequests = localStorage.getItem(
        REQUESTS_STORAGE_KEY
    );

    return savedRequests ? JSON.parse(savedRequests) : [];

}


// SAVE BUYER REQUESTS

function saveRequests(requests) {

    localStorage.setItem(
        REQUESTS_STORAGE_KEY,
        JSON.stringify(requests)
    );

}


// ADD A NEW BUYER REQUEST

function addRequest(request) {

    const currentRequests = getRequests();

    currentRequests.push(request);

    saveRequests(currentRequests);

}