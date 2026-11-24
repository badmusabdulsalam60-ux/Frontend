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


    // REQUESTS FROM THE API
    if (requireRole("Buyer")) {
        loadRequests();
    }

    async function loadRequests() {

        const totalRequests = document.getElementById("total-requests");
        const pendingRequests = document.getElementById("pending-requests");
        const acceptedRequests = document.getElementById("accepted-requests");

        const requestsTable = document.getElementById("all-requests");
        const emptyState = document.getElementById("empty-requests");

        let requests;
        let lookup;

        try {
            // GET /api/reservations/mine
            requests = await apiRequest("/reservations/mine");

            lookup = await loadListingLookup(
                requests.map(function (request) { return request.produceListingId; })
            );

        } catch (error) {
            requestsTable.innerHTML =
                `<tr><td colspan="8">${escapeHTML(error.message)}</td></tr>`;
            return;
        }

        // STATISTICS
        totalRequests.textContent = requests.length;

        pendingRequests.textContent = requests.filter(function (request) {
            return request.status === "Pending";
        }).length;

        acceptedRequests.textContent = requests.filter(function (request) {
            return request.status === "Accepted";
        }).length;

        // TABLE (the API returns the newest first)
        requestsTable.innerHTML = "";

        if (requests.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        requests.forEach(function (request) {

            const info = describeReservation(request, lookup);
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(info.cropName)}</td>

                <td>${escapeHTML(info.farmName || "N/A")}</td>

                <td>
                    ${Number(request.quantity).toLocaleString()}
                    ${escapeHTML(info.unit)}
                </td>

                <td>${info.pricePerUnit === null ? "N/A" : formatNaira(info.pricePerUnit)}</td>

                <td>${info.total === null ? "N/A" : formatNaira(info.total)}</td>

                <td>${escapeHTML([info.farmAddress, info.state].filter(Boolean).join(", ") || "N/A")}</td>

                <td>${escapeHTML(formatDate(request.createdAt))}</td>

                <td>
                    <span class="status-badge ${escapeHTML(request.status.toLowerCase())}">
                        ${escapeHTML(request.status)}
                    </span>
                    ${
                        request.status === "Accepted"
                            ? '<a href="orders.html">Track order</a>'
                            : ""
                    }
                </td>
            `;

            requestsTable.appendChild(row);

        });

    }

});
