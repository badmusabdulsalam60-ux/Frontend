// =====================================
// AgroConnect - shared API helpers
// (loaded first on every page that talks to the backend)
// =====================================

// Change this address when the backend is deployed,
// e.g. "https://your-backend-address/api"
const API_BASE_URL = "http://localhost:5212/api";


// =====================================
// 1. SEND A REQUEST TO THE API
// =====================================

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("agroconnect-token");

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (error) {
        throw new Error(
            "Cannot reach the server. Please make sure the API is running."
        );
    }

    const result = await response.json().catch(() => null);

    // Token expired or invalid -> send the user back to login
    if (response.status === 401 && token && !endpoint.startsWith("/auth/")) {
        clearSession();
        window.location.href = "login.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 403) {
        throw new Error("You do not have permission to do that.");
    }

    if (!response.ok || result?.isSuccessful === false) {
        // ASP.NET validation errors come back as { errors: { Field: [..] } }
        const validationErrors = result?.errors && !Array.isArray(result.errors)
            ? Object.values(result.errors).flat().join(" ")
            : "";

        throw new Error(
            result?.message ||
            validationErrors ||
            (Array.isArray(result?.errors) && result.errors.join(", ")) ||
            result?.title ||
            `Request failed (${response.status})`
        );
    }

    return result?.data ?? result;
}


// =====================================
// 2. LOGIN SESSION
// =====================================

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("agroconnect-user"));
    } catch (error) {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem("agroconnect-token");
    localStorage.removeItem("agroconnect-user");
}

// Returns true when the user is logged in with the given role
// ("Farmer" or "Buyer"). Otherwise sends them to the login page.
function requireRole(role) {
    const user = getUser();
    const token = localStorage.getItem("agroconnect-token");

    const hasRole = user &&
        String(user.role || "").toLowerCase() === role.toLowerCase();

    if (!token || !hasRole) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// Log out buttons on every page clear the saved session
document.addEventListener("DOMContentLoaded", function () {
    document
        .querySelectorAll(".logout-button, .logout-link")
        .forEach(function (link) {
            link.addEventListener("click", clearSession);
        });
});


// =====================================
// 3. SMALL DISPLAY HELPERS
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

function formatDate(value) {
    if (!value) return "Not specified";

    const date = new Date(value);

    return isNaN(date) ? "Not specified" : date.toLocaleDateString();
}

// "2026-12-01T00:00:00" -> "2026-12-01" (for <input type="date">)
function toDateInput(value) {
    return value ? String(value).substring(0, 10) : "";
}

// "PartiallyReserved" -> "Partially Reserved"
function prettyStatus(status) {
    return String(status ?? "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

// Listing location comes from the farmer profile. The backend returns
// FarmAddress and State on ProduceListingDto; it is not stored in the title.
function listingLocation(listing) {
    const parts = [listing?.farmAddress, listing?.state].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location not provided";
}


// =====================================
// 4. LINK RESERVATIONS / ORDERS TO THEIR LISTINGS
// =====================================
// The reservation and order objects only carry the listing title and ids,
// so the crop, unit, price and farm name are looked up from the listings.

// Returns { listingId: listing } for the logged-in user.
// Farmers get all of their own listings; buyers get the available listings
// plus any listing they reserved (even if it is sold out now).
async function loadListingLookup(extraListingIds = []) {

    const user = getUser();
    const isFarmer = user && String(user.role).toLowerCase() === "farmer";

    const lookup = {};

    const listings = await apiRequest(
        isFarmer ? "/producelistings/mine" : "/producelistings"
    );

    listings.forEach(function (listing) {
        lookup[listing.id] = listing;
    });

    const missing = [...new Set(extraListingIds)].filter(function (id) {
        return id && !lookup[id];
    });

    await Promise.all(missing.map(async function (id) {
        try {
            // GET /api/producelistings/{id}
            lookup[id] = await apiRequest(`/producelistings/${id}`);
        } catch (error) {
            // listing not available any more - the title is still shown
        }
    }));

    return lookup;
}

function cropFromTitle(title) {
    return String(title || "").split(" - ")[0] || "Produce";
}

// ReservationDto already includes crop, unit, price and buyer details.
// Listing lookup supplies the full farm address and state.
function describeReservation(reservation, lookup = {}) {

    const listing = lookup[reservation.produceListingId];

    const priceValue = reservation.pricePerUnit ?? listing?.pricePerUnit;
    const price = priceValue === undefined || priceValue === null
        ? null
        : Number(priceValue);

    return {
        cropName: reservation.cropName || listing?.cropName || cropFromTitle(reservation.listingTitle),
        unit: reservation.unit || listing?.unit || "",
        farmName: reservation.farmName || listing?.farmName || "",
        farmAddress: listing?.farmAddress || "",
        state: listing?.state || "",
        pricePerUnit: price,
        total: price === null ? null : price * Number(reservation.quantity)
    };
}


// OrderDto contains its own price and total. Listing lookup supplies
// the farm address and state that are not included in OrderDto.
function describeOrder(order, lookup = {}) {

    const listing = Object.values(lookup).find(function (item) {
        return item.title === order.listingTitle &&
            (!order.farmerProfileId || item.farmerProfileId === order.farmerProfileId);
    });

    const priceValue = order.pricePerUnit ?? listing?.pricePerUnit;
    const price = priceValue === undefined || priceValue === null
        ? null
        : Number(priceValue);

    const totalValue = order.totalAmount ?? order.total;
    const total = totalValue === undefined || totalValue === null
        ? (price === null ? null : price * Number(order.quantity))
        : Number(totalValue);

    return {
        cropName: order.cropName || listing?.cropName || cropFromTitle(order.listingTitle),
        unit: order.unit || listing?.unit || "",
        farmName: order.farmName || listing?.farmName || "",
        farmAddress: listing?.farmAddress || "",
        state: listing?.state || "",
        pricePerUnit: price,
        total: total
    };
}


// Picture for a crop (falls back to a plain green placeholder)
function getCropImage(cropName) {
    const images = {
        maize: "corn.jpg",
        rice: "rice.jpg",
        cassava: "Cassava.jpg",
        yam: "Yam-1.jpg",
        beans: "beans.jpg"
    };

    const placeholder =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'>" +
            "<rect width='100%' height='100%' fill='#d7ecd4'/>" +
            "<text x='50%' y='54%' font-size='72' text-anchor='middle'>🌱</text>" +
            "</svg>"
        );

    return images[String(cropName || "").toLowerCase()] || placeholder;
}
