document.addEventListener("DOMContentLoaded", function () {

    // MOBILE SIDEBAR
    const sidebar = document.querySelector(".sidebar");
    const menuToggle = document.getElementById("menu-toggle");

    if (sidebar && menuToggle) {

        menuToggle.addEventListener("click", function () {

            sidebar.classList.toggle("active");

            const isOpen = sidebar.classList.contains("active");

            menuToggle.textContent = isOpen ? "✕" : "☰";

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );

        });

        document.querySelectorAll(".sidebar-nav a").forEach(function (link) {

            link.addEventListener("click", function () {

                if (window.innerWidth <= 650) {
                    sidebar.classList.remove("active");
                    menuToggle.textContent = "☰";
                }

            });

        });
    }


    // DASHBOARD DATA (from the API)
    if (requireRole("Buyer")) {
        loadDashboard();
    }

    async function loadDashboard() {

        const availableCount = document.getElementById("available-count");
        const totalRequests = document.getElementById("total-requests");
        const totalOrders = document.getElementById("total-orders");
        const requestTotal = document.getElementById("request-total");

        const requestsContainer = document.getElementById("recent-requests");
        const emptyRequests = document.getElementById("empty-requests");

        // Buyer name
        const buyerName = document.getElementById("buyer-name");
        const user = getUser();

        if (buyerName && user) {
            buyerName.textContent = String(user.fullName || "Buyer").split(" ")[0];
        }

        try {
            // GET /api/producelistings, /api/reservations/mine and /api/orders/mine
            const [listings, requests, orders] = await Promise.all([
                apiRequest("/producelistings"),
                apiRequest("/reservations/mine"),
                apiRequest("/orders/mine")
            ]);

            const lookup = await loadListingLookup(
                requests.map(function (request) { return request.produceListingId; })
            );

            availableCount.textContent = listings.length;
            totalRequests.textContent = requests.length;
            totalOrders.textContent = orders.length;

            requestTotal.textContent =
                `${requests.length} Request${requests.length !== 1 ? "s" : ""}`;

            requestsContainer.innerHTML = "";

            if (requests.length === 0) {
                emptyRequests.style.display = "block";
                return;
            }

            emptyRequests.style.display = "none";

            // Five most recent requests (the API returns newest first)
            requests.slice(0, 5).forEach(function (request) {

                const info = describeReservation(request, lookup);
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${escapeHTML(info.cropName)}</td>
                    <td>${escapeHTML(info.farmName || "N/A")}</td>
                    <td>
                        ${Number(request.quantity).toLocaleString()}
                        ${escapeHTML(info.unit)}
                    </td>
                    <td>
                        <span class="status-badge ${escapeHTML(request.status.toLowerCase())}">
                            ${escapeHTML(request.status)}
                        </span>
                    </td>
                `;

                requestsContainer.appendChild(row);

            });

        } catch (error) {
            requestsContainer.innerHTML =
                `<tr><td colspan="4">${escapeHTML(error.message)}</td></tr>`;
        }

    }

});
