// =====================================
// ORDERS - farmer and buyer track order status
// =====================================

(function () {

    const user = getUser();
    const token = localStorage.getItem("agroconnect-token");

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    const isFarmer = String(user.role).toLowerCase() === "farmer";

    const container = document.getElementById("orders-container");
    const emptyState = document.getElementById("empty-orders");
    const orderCount = document.getElementById("order-count");
    const backLink = document.getElementById("back-link");

    backLink.href = isFarmer ? "farmer-dashboard.html" : "buyer-dashboard.html";

    // The steps an order goes through
    const STEPS = ["Confirmed", "Preparing", "ReadyForPickup", "Delivered", "Completed"];


    // What each person can do next (matches the backend rules)
    function nextActions(order) {

        const actions = [];

        if (order.status === "Completed" || order.status === "Cancelled") {
            return actions;
        }

        if (isFarmer) {

            if (order.status === "Confirmed") {
                actions.push({ label: "Start Preparing", status: "Preparing" });
            }

            if (order.status === "Preparing") {
                actions.push({ label: "Ready for Pickup", status: "ReadyForPickup" });
            }

            if (order.status === "ReadyForPickup") {
                actions.push({ label: "Mark as Delivered", status: "Delivered" });
            }

            if (order.status !== "Delivered") {
                actions.push({ label: "Cancel Order", status: "Cancelled", danger: true });
            }

        } else if (order.status === "Delivered") {
            actions.push({ label: "Confirm Received", status: "Completed" });
        }

        return actions;
    }


    function progressHTML(order) {

        if (order.status === "Cancelled") {
            return '<p class="order-cancelled">This order was cancelled.</p>';
        }

        const currentIndex = STEPS.indexOf(order.status);

        return `
            <ol class="order-steps">
                ${STEPS.map(function (step, index) {
                    const state = index < currentIndex
                        ? "done"
                        : index === currentIndex ? "current" : "";

                    return `<li class="${state}">${escapeHTML(prettyStatus(step))}</li>`;
                }).join("")}
            </ol>
        `;
    }


    async function loadOrders() {

        let orders;
        let lookup;

        try {
            // GET /api/orders/mine
            orders = await apiRequest("/orders/mine");

            // The order only has the listing title, so the crop, unit and price
            // are found from the listings (buyers also use their reservations)
            const reservations = await apiRequest("/reservations/mine");

            lookup = await loadListingLookup(
                reservations.map(function (item) { return item.produceListingId; })
            );

        } catch (error) {
            container.innerHTML = `<p class="error-text">${escapeHTML(error.message)}</p>`;
            return;
        }

        container.innerHTML = "";

        orderCount.textContent =
            `${orders.length} Order${orders.length !== 1 ? "s" : ""}`;

        if (orders.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        orders.forEach(function (order) {

            const info = describeOrder(order, lookup);

            const card = document.createElement("article");
            card.className = "order-card";

            card.innerHTML = `

                <div class="order-top">

                    <div>
                        <h3>${escapeHTML(info.cropName)}</h3>
                        <p class="order-number">${escapeHTML(order.orderNumber)}</p>
                    </div>

                    <span class="order-status ${escapeHTML(order.status.toLowerCase())}">
                        ${escapeHTML(prettyStatus(order.status))}
                    </span>

                </div>

                <div class="order-details">

                    <p><strong>Listing:</strong> ${escapeHTML(order.listingTitle)}</p>

                    <p><strong>Farm:</strong> ${escapeHTML(info.farmName || "Not provided")}</p>

                    <p><strong>Farm Address:</strong>
                        ${escapeHTML(info.farmAddress || "Not provided")}</p>

                    <p><strong>Farm State:</strong>
                        ${escapeHTML(info.state || "Not provided")}</p>

                    ${isFarmer
                        ? `
                            <p><strong>Buyer:</strong>
                                ${escapeHTML(order.buyerName || "Buyer name not available")}</p>
                            <p><strong>Buyer Phone:</strong>
                                ${escapeHTML(order.buyerPhone || "Not provided")}</p>
                        `
                        : ""}

                    <p><strong>Quantity:</strong>
                        ${Number(order.quantity).toLocaleString()} ${escapeHTML(info.unit)}</p>

                    <p><strong>Price Per Unit:</strong>
                        ${info.pricePerUnit === null ? "Not available" : formatNaira(info.pricePerUnit)}</p>

                    <p><strong>Total Amount:</strong>
                        ${info.total === null ? "Not available" : formatNaira(info.total)}</p>

                    <p><strong>Ordered:</strong> ${escapeHTML(formatDate(order.createdAt))}</p>

                </div>

                ${progressHTML(order)}

                <div class="order-actions">
                    ${nextActions(order).map(function (action) {
                        return `
                            <button
                                class="order-action ${action.danger ? "danger" : ""}"
                                data-id="${escapeHTML(order.id)}"
                                data-status="${escapeHTML(action.status)}">
                                ${escapeHTML(action.label)}
                            </button>
                        `;
                    }).join("")}
                </div>

            `;

            container.appendChild(card);

        });

    }


    // UPDATE AN ORDER'S STATUS

    container.addEventListener("click", async function (event) {

        const button = event.target.closest(".order-action");

        if (!button) return;

        if (button.dataset.status === "Cancelled" &&
            !confirm("Are you sure you want to cancel this order?")) {
            return;
        }

        button.disabled = true;

        try {
            // PUT /api/orders/{id}/status
            await apiRequest(`/orders/${button.dataset.id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status: button.dataset.status })
            });

        } catch (error) {
            alert(error.message);
        }

        loadOrders();

    });


    loadOrders();

})();
