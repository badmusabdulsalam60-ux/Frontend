// =====================================
// MY LISTINGS (farmer's own listings from the API)
// =====================================

(function () {

    if (!requireRole("Farmer")) return;

    const listingsContainer = document.querySelector("#listingsContainer");
    const emptyState = document.querySelector("#emptyState");

    const totalListings = document.querySelector("#totalListings");
    const availableListings = document.querySelector("#availableListings");
    const totalQuantity = document.querySelector("#totalQuantity");

    const editModal = document.querySelector("#editModal");
    const editForm = document.querySelector("#editForm");
    const editCrop = document.querySelector("#editCrop");
    const editQuantity = document.querySelector("#editQuantity");
    const editUnit = document.querySelector("#editUnit");
    const editPrice = document.querySelector("#editPrice");
    const editDate = document.querySelector("#editDate");
    const editLocation = document.querySelector("#editLocation");
    const editDescription = document.querySelector("#editDescription");
    const editId = document.querySelector("#editId");
    const closeModal = document.querySelector("#closeModal");

    let listings = [];
    async function loadListings() {
        try {
            // GET /api/producelistings/mine
            listings = await apiRequest("/producelistings/mine");
            displayListings();
        } catch (error) {
            listingsContainer.innerHTML =
                `<p class="error-text">${escapeHTML(error.message)}</p>`;
            emptyState.style.display = "none";
        }
    }

    function displayListings() {
        listingsContainer.innerHTML = "";

        totalListings.textContent = listings.length;

        availableListings.textContent = listings.filter(function (listing) {
            return listing.status === "Available" ||
                listing.status === "PartiallyReserved";
        }).length;

        const quantity = listings.reduce(function (total, listing) {
            return total + Number(listing.availableQuantity || 0);
        }, 0);

        totalQuantity.textContent = quantity.toLocaleString();

        if (listings.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";

        listings.forEach(function (listing) {
            const reserved = Number(listing.totalQuantity) -
                Number(listing.availableQuantity);

            const isCancelled = listing.status === "Cancelled";

            const card = document.createElement("article");
            card.className = "listing-card";

            card.innerHTML = `
                <div class="card-top">
                    <div class="crop-heading">
                        <h3>${escapeHTML(listing.cropName || listing.title)}</h3>
                        <span class="status available">
                            ${escapeHTML(prettyStatus(listing.status))}
                        </span>
                    </div>

                    <div class="card-details">
                        <div class="detail">
                            <p>Total Quantity</p>
                            <h4>${Number(listing.totalQuantity).toLocaleString()} ${escapeHTML(listing.unit)}</h4>
                        </div>

                        <div class="detail">
                            <p>Available Quantity</p>
                            <h4>${Number(listing.availableQuantity).toLocaleString()} ${escapeHTML(listing.unit)}</h4>
                        </div>

                        <div class="detail">
                            <p>Reserved Quantity</p>
                            <h4>${reserved.toLocaleString()} ${escapeHTML(listing.unit)}</h4>
                        </div>

                        <div class="detail">
                            <p>Price Per Unit</p>
                            <h4>${formatNaira(listing.pricePerUnit)}</h4>
                        </div>

                        <div class="detail">
                            <p>Expected Harvest</p>
                            <h4>${escapeHTML(formatDate(listing.availableFrom))}</h4>
                        </div>

                        <div class="detail">
                            <p>Farm Address</p>
                            <h4>${escapeHTML(listing.farmAddress || "Not provided")}</h4>
                        </div>

                        <div class="detail">
                            <p>State</p>
                            <h4>${escapeHTML(listing.state || "Not provided")}</h4>
                        </div>
                    </div>

                    <p class="card-description">
                        ${escapeHTML(listing.description || "No description provided.")}
                    </p>
                </div>

                <div class="card-actions">
                    <button type="button"
                        class="edit-button"
                        data-action="edit"
                        data-id="${escapeHTML(listing.id)}"
                        ${isCancelled ? "disabled" : ""}>
                        Edit Listing
                    </button>

                    <button type="button"
                        class="delete-button"
                        data-action="cancel"
                        data-id="${escapeHTML(listing.id)}"
                        ${isCancelled ? "disabled" : ""}>
                        Cancel Listing
                    </button>
                </div>
            `;

            listingsContainer.appendChild(card);
        });
    }

    function openEditModal(listing) {
        editId.value = listing.id;
        editCrop.value = listing.cropName || listing.title;
        editQuantity.value = listing.totalQuantity;
        editUnit.value = listing.unit;
        editPrice.value = listing.pricePerUnit;
        editDate.value = toDateInput(listing.availableFrom);
        editLocation.value = [listing.farmAddress, listing.state]
            .filter(Boolean)
            .join(", ");
        editDescription.value = listing.description || "";

        // Explain why the total quantity cannot go below the reserved amount.
        let quantityHint = document.querySelector("#edit-quantity-hint");
        if (!quantityHint) {
            quantityHint = document.createElement("small");
            quantityHint.id = "edit-quantity-hint";
            editQuantity.insertAdjacentElement("afterend", quantityHint);
        }

        const reserved = Number(listing.totalQuantity) -
            Number(listing.availableQuantity);

        quantityHint.textContent =
            ` ${reserved.toLocaleString()} ${listing.unit} already reserved. Total quantity cannot be lower than this.`;

        editModal.classList.add("show");
    }

    function closeEditModal() {
        editModal.classList.remove("show");
    }

    listingsContainer.addEventListener("click", async function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const listing = listings.find(function (item) {
            return item.id === button.dataset.id;
        });

        if (!listing) return;

        if (button.dataset.action === "edit") {
            openEditModal(listing);
            return;
        }

        if (button.dataset.action === "cancel") {
            const confirmed = confirm(
                "Are you sure you want to cancel this produce listing? This cannot be undone."
            );

            if (!confirmed) return;

            button.disabled = true;

            try {
                // DELETE /api/producelistings/{id}
                await apiRequest(`/producelistings/${listing.id}`, {
                    method: "DELETE"
                });

                alert("Your listing has been cancelled.");
                await loadListings();
            } catch (error) {
                alert(error.message);
                button.disabled = false;
            }
        }
    });

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const quantity = Number(editQuantity.value);
        const price = Number(editPrice.value);

        if (quantity <= 0 || price <= 0 || !editDate.value) {
            alert("Enter a valid quantity, price and harvest date.");
            return;
        }

        const saveButton = editForm.querySelector(".save-button");
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            // PUT /api/producelistings/{id}
            await apiRequest(`/producelistings/${editId.value}`, {
                method: "PUT",
                body: JSON.stringify({
                    cropId: listings.find(function (item) {
                        return item.id === editId.value;
                    }).cropId,
                    title: editCrop.value,
                    description: editDescription.value.trim(),
                    pricePerUnit: price,
                    unit: editUnit.value,
                    quantity: quantity,
                    availableFrom: `${editDate.value}T00:00:00`
                })
            });

            alert("Listing updated successfully.");
            closeEditModal();
            await loadListings();
        } catch (error) {
            alert(error.message);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });

    closeModal.addEventListener("click", closeEditModal);

    editModal.addEventListener("click", function (event) {
        if (event.target === editModal) closeEditModal();
    });

    loadListings();

})();
