// =====================================
// SELECT THE SIDEBAR ELEMENT
// =====================================

const sidebar = document.querySelector("#sidebar");


// =====================================
// SELECT THE MENU BUTTON
// =====================================

const menuButton = document.querySelector("#menuButton");


// =====================================
// OPEN AND CLOSE SIDEBAR
// =====================================

menuButton.addEventListener("click", function() {

    // Toggle the sidebar visibility

    sidebar.classList.toggle("open");

    // Check whether the sidebar is open

    const isOpen = sidebar.classList.contains("open");

    // Update accessibility state

    menuButton.setAttribute("aria-expanded", isOpen);

});


// =====================================
// CLOSE SIDEBAR AFTER NAVIGATION
// =====================================

const sidebarLinks = document.querySelectorAll(".nav-item");

sidebarLinks.forEach(function(link) {

    link.addEventListener("click", function() {

        sidebar.classList.remove("open");

        menuButton.setAttribute("aria-expanded", "false");

    });

});

// =====================================
// DASHBOARD DATA (loaded from the API)
// =====================================

(async function () {

    if (!requireRole("Farmer")) return;

    // Farmer name and avatar letter
    const user = getUser();
    const firstName = String(user.fullName || "Farmer").split(" ")[0];

    const nameElement = document.querySelector("#farmer-name");
    const avatarElement = document.querySelector("#user-avatar");

    if (nameElement) nameElement.textContent = firstName;
    if (avatarElement) avatarElement.textContent = firstName.charAt(0).toUpperCase();

    const recentContainer = document.querySelector("#recent-listings");

    try {
        // GET /api/producelistings/mine, /api/reservations/mine, /api/orders/mine
        const [listings, reservations, orders] = await Promise.all([
            apiRequest("/producelistings/mine"),
            apiRequest("/reservations/mine"),
            apiRequest("/orders/mine")
        ]);

        // Statistics
        document.querySelector("#stat-listings").textContent = listings.length;
        document.querySelector("#stat-bookings").textContent = reservations.length;
        document.querySelector("#stat-orders").textContent = orders.length;

        // Three most recent listings
        recentContainer.innerHTML = "";

        if (listings.length === 0) {
            recentContainer.innerHTML =
                "<p>You have not created any listings yet.</p>";
            return;
        }

        listings.slice(0, 3).forEach(function (listing) {

            const card = document.createElement("article");
            card.className = "recent-listing-card";

            card.innerHTML = `

                <img
                    src="${getCropImage(listing.cropName)}"
                    alt="${escapeHTML(listing.cropName)} produce">

                <div class="listing-information">

                    <div class="listing-heading">

                        <h3>${escapeHTML(listing.cropName)}</h3>

                        <span class="status active-status">
                            ${escapeHTML(prettyStatus(listing.status))}
                        </span>

                    </div>

                    <p>
                        ${Number(listing.availableQuantity).toLocaleString()}
                        ${escapeHTML(listing.unit)} available ·
                        ${formatNaira(listing.pricePerUnit)}/${escapeHTML(listing.unit)}
                    </p>

                    <small>Harvest: ${escapeHTML(formatDate(listing.availableFrom))}</small>

                </div>

                <a class="more-button" href="my-listings.html"
                    aria-label="Manage listing">
                    ⋯
                </a>

            `;

            recentContainer.appendChild(card);

        });

    } catch (error) {
        recentContainer.innerHTML =
            `<p>${escapeHTML(error.message)}</p>`;
    }

})();
