// =====================================
// CROPS (farmers and admins can add and rename crops)
// =====================================

(function () {

    const user = getUser();
    const token = localStorage.getItem("agroconnect-token");
    const role = user ? String(user.role).toLowerCase() : "";

    // Only farmers and admins can manage crops (matches the backend)
    if (!token || (role !== "farmer" && role !== "admin")) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("back-link").href =
        role === "farmer" ? "farmer-dashboard.html" : "index.html";

    if (role === "admin") {
        document.getElementById("back-link").textContent = "← Home";
    }

    const container = document.getElementById("crops-container");
    const cropCount = document.getElementById("crop-count");

    const form = document.getElementById("crop-form");
    const formTitle = document.getElementById("crop-form-title");
    const idInput = document.getElementById("crop-id");
    const nameInput = document.getElementById("crop-name");
    const categoryInput = document.getElementById("crop-category");
    const descriptionInput = document.getElementById("crop-description");
    const saveButton = document.getElementById("crop-save");
    const cancelButton = document.getElementById("crop-cancel");
    const message = document.getElementById("crop-message");

    let crops = [];


    function showMessage(text, isError) {
        message.textContent = text;
        message.style.color = isError ? "#b02a1f" : "#14783b";
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        formTitle.textContent = "Add a new crop";
        saveButton.textContent = "Add Crop";
        cancelButton.style.display = "none";
    }


    async function loadCrops() {

        try {
            // GET /api/crops
            crops = await apiRequest("/crops");

        } catch (error) {
            container.innerHTML = `<p class="error-text">${escapeHTML(error.message)}</p>`;
            return;
        }

        cropCount.textContent = `${crops.length} Crop${crops.length !== 1 ? "s" : ""}`;

        container.innerHTML = "";

        crops.forEach(function (crop) {

            const card = document.createElement("article");
            card.className = "order-card";

            card.innerHTML = `
                <div class="order-top">

                    <div>
                        <h3>${escapeHTML(crop.name)}</h3>
                        <p class="order-number">${escapeHTML(crop.category)}</p>
                    </div>

                    <button class="order-action" data-id="${escapeHTML(crop.id)}">
                        Edit
                    </button>

                </div>

                ${crop.description
                    ? `<p>${escapeHTML(crop.description)}</p>`
                    : ""}
            `;

            container.appendChild(card);

        });

    }


    // EDIT BUTTON: load the crop into the form

    container.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-id]");

        if (!button) return;

        const crop = crops.find(function (item) {
            return item.id === button.dataset.id;
        });

        idInput.value = crop.id;
        nameInput.value = crop.name;
        descriptionInput.value = crop.description || "";

        if (![...categoryInput.options].some(o => o.value === crop.category)) {
            categoryInput.add(new Option(crop.category, crop.category));
        }

        categoryInput.value = crop.category;

        formTitle.textContent = `Edit ${crop.name}`;
        saveButton.textContent = "Save Changes";
        cancelButton.style.display = "inline-block";

        window.scrollTo({ top: 0, behavior: "smooth" });

    });

    cancelButton.addEventListener("click", function () {
        resetForm();
        showMessage("", false);
    });


    // ADD OR UPDATE A CROP

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const body = JSON.stringify({
            name: nameInput.value.trim(),
            category: categoryInput.value,
            description: descriptionInput.value.trim() || null
        });

        saveButton.disabled = true;

        try {
            if (idInput.value) {
                // PUT /api/crops/{id}
                await apiRequest(`/crops/${idInput.value}`, { method: "PUT", body: body });
                showMessage("Crop updated successfully.", false);
            } else {
                // POST /api/crops
                await apiRequest("/crops", { method: "POST", body: body });
                showMessage("Crop added successfully.", false);
            }

            resetForm();
            await loadCrops();

        } catch (error) {
            showMessage(error.message, true);

        } finally {
            saveButton.disabled = false;
        }

    });


    loadCrops();

})();
