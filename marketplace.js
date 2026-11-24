// =====================================
// MARKETPLACE (buyers browse, search and reserve produce)
// =====================================

(async function () {

    // GET HTML ELEMENTS

    const marketplaceListings = document.getElementById("marketplace-listings");
    const searchInput = document.getElementById("search-input");
    const cropFilter = document.getElementById("crop-filter");
    const locationFilter = document.getElementById("location-filter");
    const resetButton = document.getElementById("reset-filters");
    const emptyMarketplace = document.getElementById("empty-marketplace");
    const resultsCount = document.getElementById("results-count");
    const detailsModal = document.getElementById("details-modal");
    const detailsBody = document.getElementById("details-body");
    const closeDetails = document.getElementById("close-details");

    let allListings = [];


    // =================================
    // 1. NAVIGATION (show Dashboard when logged in)
    // =================================

    const currentUser = getUser();
    const isLoggedIn = !!localStorage.getItem("agroconnect-token") && !!currentUser;

    if (isLoggedIn) {

        const nav = document.querySelector(".market-header nav");
        const loginLink = nav ? nav.querySelector('a[href="login.html"]') : null;
        const registerLink = nav ? nav.querySelector(".nav-register") : null;

        const isFarmer = String(currentUser.role).toLowerCase() === "farmer";

        if (loginLink) {
            loginLink.textContent = "My Dashboard";
            loginLink.href = isFarmer ? "farmer-dashboard.html" : "buyer-dashboard.html";
        }

        if (registerLink) {
            registerLink.style.display = "none";
        }
    }


    // =================================
    // 2. LOAD CROPS (filter) AND LISTINGS
    // =================================

    async function loadMarketplace() {

        try {
            // GET /api/producelistings?search=...  (anyone can browse and search)
            const search = searchInput.value.trim();

            allListings = await apiRequest(
                search
                    ? `/producelistings?search=${encodeURIComponent(search)}`
                    : "/producelistings"
            );

            filterListings();

        } catch (error) {
            resultsCount.textContent = "Could not load harvests";
            marketplaceListings.innerHTML =
                `<p class="error-text">${escapeHTML(error.message)}</p>`;
        }

    }

    async function loadCropFilter() {

        try {
            // GET /api/crops
            const crops = await apiRequest("/crops");

            cropFilter.innerHTML = '<option value="">All crops</option>';

            crops.forEach(function (crop) {
                cropFilter.add(new Option(crop.name, crop.name));
            });

        } catch (error) {
            // keep the crops already written in the HTML
        }

    }


    // =================================
    // 3. DISPLAY LISTINGS
    // =================================

    function displayMarketplace(listings) {

        marketplaceListings.innerHTML = "";

        resultsCount.textContent =
            `${listings.length} harvest${listings.length !== 1 ? "s" : ""} found`;

        if (listings.length === 0) {
            emptyMarketplace.style.display = "block";
            return;
        }

        emptyMarketplace.style.display = "none";

        listings.forEach(function (listing) {

            const card = document.createElement("article");
            card.className = "harvest-card";

            card.innerHTML = `

                <img
                    src="${getCropImage(listing.cropName)}"
                    alt="${escapeHTML(listing.cropName)}"
                    class="harvest-image"
                >

                <div class="harvest-details">

                    <div class="harvest-top">
                        <h3>${escapeHTML(listing.cropName)}</h3>
                        <span class="available-badge">
                            ${escapeHTML(prettyStatus(listing.status))}
                        </span>
                    </div>

                    <p class="harvest-location">
                        📍 ${escapeHTML(listingLocation(listing))}
                    </p>

                    <div class="harvest-info">

                        <div>
                            <span class="info-label">Available</span>
                            <span class="info-value">
                                ${Number(listing.availableQuantity).toLocaleString()}
                                ${escapeHTML(listing.unit)}
                            </span>
                        </div>

                        <div>
                            <span class="info-label">Price</span>
                            <span class="info-value">
                                ${formatNaira(listing.pricePerUnit)}
                            </span>
                        </div>

                    </div>

                    <p class="harvest-date">
                        Expected harvest: ${escapeHTML(formatDate(listing.availableFrom))}
                    </p>

                    <button class="view-details" data-id="${escapeHTML(listing.id)}">
                        View Details
                    </button>

                </div>

            `;

            marketplaceListings.appendChild(card);

        });

    }


    // =================================
    // 4. SEARCH AND FILTER
    // =================================

    function filterListings() {

        const selectedCrop = cropFilter.value.toLowerCase();
        const selectedLocation = locationFilter.value.toLowerCase().trim();

        const filtered = allListings.filter(function (listing) {

            const matchesCrop =
                selectedCrop === "" ||
                listing.cropName.toLowerCase() === selectedCrop;

            const matchesLocation =
                !selectedLocation ||
                listingLocation(listing).toLowerCase().includes(selectedLocation) ||
                listing.farmName.toLowerCase().includes(selectedLocation);

            return matchesCrop && matchesLocation;

        });

        displayMarketplace(filtered);

    }

    // The name search is done by the backend (debounced while typing)
    let searchTimer;

    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(loadMarketplace, 300);
    });
    cropFilter.addEventListener("change", filterListings);
    locationFilter.addEventListener("input", filterListings);

    resetButton.addEventListener("click", function () {
        searchInput.value = "";
        cropFilter.value = "";
        locationFilter.value = "";
        loadMarketplace();
    });


    // =================================
    // 5. VIEW DETAILS AND RESERVE
    // =================================

    marketplaceListings.addEventListener("click", function (event) {

        const button = event.target.closest(".view-details");

        if (!button) return;

        const listing = allListings.find(function (item) {
            return item.id === button.dataset.id;
        });

        if (!listing) {
            alert("Harvest listing could not be found.");
            return;
        }

        showHarvestDetails(listing);

    });

    function reserveSection(listing) {

        // Not logged in
        if (!isLoggedIn) {
            return `
                <p>Log in as a buyer to reserve this harvest.</p>
                <p>
                    <a href="login.html">Log in</a> or
                    <a href="register.html">create an account</a>
                </p>
            `;
        }

        // Logged in as a farmer
        if (String(currentUser.role).toLowerCase() !== "buyer") {
            return "<p>Only buyer accounts can reserve produce.</p>";
        }

        return `
            <p>
                Reserve this harvest now. The quantity is held for you
                until the farmer accepts or rejects your request.
            </p>

            <form id="request-form">

                <label for="requested-quantity">
                    Quantity You Need (${escapeHTML(listing.unit)})
                </label>

                <input
                    type="number"
                    id="requested-quantity"
                    min="0.01"
                    max="${Number(listing.availableQuantity)}"
                    step="any"
                    placeholder="Enter quantity"
                    required
                >

                <button type="submit" class="submit-request">
                    Reserve This Harvest
                </button>

                <p id="request-message"></p>

            </form>
        `;

    }

    function showHarvestDetails(listing) {

        detailsBody.innerHTML = `

            <img
                src="${getCropImage(listing.cropName)}"
                alt="${escapeHTML(listing.cropName)}"
            >

            <h2>${escapeHTML(listing.cropName)}</h2>

            <p><strong>Farm:</strong> ${escapeHTML(listing.farmName)}</p>

            <p><strong>Location:</strong> ${escapeHTML(listingLocation(listing))}</p>

            <p>
                <strong>Available Quantity:</strong>
                ${Number(listing.availableQuantity).toLocaleString()}
                ${escapeHTML(listing.unit)}
            </p>

            <p><strong>Price:</strong> ${formatNaira(listing.pricePerUnit)} per ${escapeHTML(listing.unit)}</p>

            <p><strong>Expected Harvest:</strong> ${escapeHTML(formatDate(listing.availableFrom))}</p>

            <p>
                <strong>Description:</strong>
                ${escapeHTML(listing.description || "No description provided.")}
            </p>

            <hr>

            <h3>Interested in this harvest?</h3>

            ${reserveSection(listing)}

        `;

        detailsModal.style.display = "flex";

        const requestForm = document.getElementById("request-form");

        if (requestForm) {
            requestForm.addEventListener("submit", function (event) {
                event.preventDefault();
                submitReservation(listing, requestForm);
            });
        }

    }


    // =================================
    // 6. SEND THE RESERVATION TO THE API
    // =================================

    async function submitReservation(listing, requestForm) {

        const messageElement = document.getElementById("request-message");
        const submitButton = requestForm.querySelector("button[type='submit']");

        const quantity =
            Number(document.getElementById("requested-quantity").value);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            messageElement.textContent = "Please enter a valid quantity.";
            messageElement.style.color = "#c0392b";
            return;
        }

        if (quantity > Number(listing.availableQuantity)) {
            messageElement.textContent =
                "Your requested quantity exceeds the available quantity.";
            messageElement.style.color = "#c0392b";
            return;
        }

        submitButton.disabled = true;

        try {
            // POST /api/reservations
            await apiRequest("/reservations", {
                method: "POST",
                body: JSON.stringify({
                    produceListingId: listing.id,
                    quantity: quantity
                })
            });

            messageElement.innerHTML =
                'Reservation sent! The farmer will respond soon. ' +
                '<a href="my-requests.html">View my requests</a>';
            messageElement.style.color = "green";

            requestForm.reset();

            // Refresh the list so the available quantity is up to date
            await loadMarketplace();

        } catch (error) {
            messageElement.textContent = error.message;
            messageElement.style.color = "#c0392b";

        } finally {
            submitButton.disabled = false;
        }

    }


    // =================================
    // 7. CLOSE MODAL
    // =================================

    closeDetails.addEventListener("click", function () {
        detailsModal.style.display = "none";
    });

    detailsModal.addEventListener("click", function (event) {
        if (event.target === detailsModal) {
            detailsModal.style.display = "none";
        }
    });


    // INITIAL DISPLAY

    await loadCropFilter();
    await loadMarketplace();

})();
