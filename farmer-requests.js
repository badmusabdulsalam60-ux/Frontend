// =====================================
// INCOMING BUYER REQUESTS (reservations from the API)
// =====================================

(function () {

    if (!requireRole("Farmer")) return;

    // GET HTML ELEMENTS

    const requestsContainer = document.getElementById("farmer-requests-container");
    const noRequests = document.getElementById("no-requests");
    const requestCount = document.getElementById("request-count");


    // LOAD AND DISPLAY REQUESTS

    async function displayFarmerRequests() {

        let requests;
        let lookup;

        try {
            // GET /api/reservations/mine  (a farmer receives the ones made on his listings)
            requests = await apiRequest("/reservations/mine");

            // crop, unit and price come from the farmer's own listings
            lookup = await loadListingLookup(
                requests.map(function (request) { return request.produceListingId; })
            );

        } catch (error) {
            requestsContainer.innerHTML =
                `<p>${escapeHTML(error.message)}</p>`;
            return;
        }

        requestsContainer.innerHTML = "";

        requestCount.textContent =
            `${requests.length} Request${requests.length !== 1 ? "s" : ""}`;

        if (requests.length === 0) {
            noRequests.style.display = "block";
            return;
        }

        noRequests.style.display = "none";


        requests.forEach(function (request) {

            const status = request.status;
            const info = describeReservation(request, lookup);

            const statusClass =
                status === "Accepted"
                    ? "status-accepted"
                    : (status === "Rejected" || status === "Cancelled")
                        ? "status-rejected"
                        : "status-pending";

            const card = document.createElement("article");
            card.className = "request-card";

            card.innerHTML = `

                <h3>${escapeHTML(info.cropName)}</h3>

                <p>
                    <strong>Buyer:</strong>
                    ${escapeHTML(request.buyerName || "Buyer name not available")}
                </p>

                <p>
                    <strong>Buyer Phone:</strong>
                    ${escapeHTML(request.buyerPhone || "Not provided")}
                </p>

                <p>
                    <strong>Listing:</strong>
                    ${escapeHTML(request.listingTitle)}
                </p>

                <p>
                    <strong>Requested Quantity:</strong>
                    ${Number(request.quantity).toLocaleString()}
                    ${escapeHTML(info.unit)}
                </p>

                <p>
                    <strong>Price Per Unit:</strong>
                    ${info.pricePerUnit === null ? "Not available" : formatNaira(info.pricePerUnit)}
                </p>

                <p>
                    <strong>Total Amount:</strong>
                    ${info.total === null ? "Not available" : formatNaira(info.total)}
                </p>

                <p>
                    <strong>Farm Location:</strong>
                    ${escapeHTML([info.farmAddress, info.state].filter(Boolean).join(", ") || "Not provided")}
                </p>

                <p>
                    <strong>Request Date:</strong>
                    ${escapeHTML(formatDate(request.createdAt))}
                </p>

                <span class="request-status ${statusClass}">
                    ${escapeHTML(status)}
                </span>

                ${
                    status === "Pending"
                        ? `
                            <div class="request-actions">

                                <button class="accept-request"
                                    data-id="${escapeHTML(request.id)}">
                                    Accept Request
                                </button>

                                <button class="reject-request"
                                    data-id="${escapeHTML(request.id)}">
                                    Reject Request
                                </button>

                            </div>
                        `
                        : ""
                }

                ${
                    status === "Accepted"
                        ? '<p><a href="orders.html">View order →</a></p>'
                        : ""
                }

            `;

            requestsContainer.appendChild(card);

        });

    }


    // ACCEPT OR REJECT A REQUEST

    requestsContainer.addEventListener("click", async function (event) {

        const acceptButton = event.target.closest(".accept-request");
        const rejectButton = event.target.closest(".reject-request");

        if (!acceptButton && !rejectButton) return;

        const button = acceptButton || rejectButton;
        const action = acceptButton ? "accept" : "reject";

        button.disabled = true;

        try {
            // PUT /api/reservations/{id}/accept  or  /reject
            await apiRequest(`/reservations/${button.dataset.id}/${action}`, {
                method: "PUT"
            });

        } catch (error) {
            alert(error.message);
        }

        displayFarmerRequests();

    });


    // INITIAL DISPLAY

    displayFarmerRequests();

})();
