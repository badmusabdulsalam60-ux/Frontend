// =====================================
// CREATE A PRODUCE LISTING (saved through the API)
// =====================================

(async function () {

    if (!requireRole("Farmer")) return;


    // =================================
    // 1. SELECT HTML ELEMENTS
    // =================================

    const form = document.querySelector("#produce-form");
    const message = document.querySelector("#form-message");
    const publishButton = document.querySelector("#publish-button");

    const cropSelect = document.querySelector("#crop");
    const locationInput = document.querySelector("#location");

    let farmerProfile = null;


    function showMessage(text, type) {
        message.textContent = text;
        message.className = type;
    }

    function farmLocationText() {
        return farmerProfile
            ? [farmerProfile.farmAddress, farmerProfile.state]
                .filter(Boolean)
                .join(", ")
            : "";
    }


    // =================================
    // 2. LOAD CROPS AND FARM LOCATION
    // =================================

    try {
        // GET /api/crops and GET /api/farmer-profile/me
        const crops = await apiRequest("/crops");
        farmerProfile = await apiRequest("/farmer-profile/me");

        cropSelect.innerHTML = '<option value="">Select Crop</option>';

        crops.forEach(function (crop) {
            const option = document.createElement("option");
            option.value = crop.id;          // the API needs the crop id
            option.textContent = crop.name;
            cropSelect.appendChild(option);
        });

        // The listing location is the farm's address from the profile
        locationInput.value = farmLocationText();
        locationInput.readOnly = true;

    } catch (error) {
        showMessage(error.message, "error");
    }


    // =================================
    // 3. HANDLE FORM SUBMISSION
    // =================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const cropId = cropSelect.value;
        const cropName = cropSelect.selectedOptions[0]?.textContent || "";

        const quantity = Number(document.querySelector("#quantity").value);
        const unit = document.querySelector("#unit").value;
        const price = Number(document.querySelector("#price").value);
        const harvestDate = document.querySelector("#harvest-date").value;
        const description = document.querySelector("#description").value.trim();


        // VALIDATE THE INFORMATION

        if (!cropId || !quantity || quantity < 1 || !unit || !price || price < 1 || !harvestDate) {
            showMessage("Please complete all required fields correctly.", "error");
            return;
        }


        // CREATE THE LISTING THROUGH THE API

        // The farm address and state belong to the farmer profile.
        // The listing title remains the crop name; the API returns the
        // farm address and state separately with each listing.
        const newListing = {
            cropId: cropId,
            title: cropName,
            description: description,
            pricePerUnit: price,
            unit: unit,
            quantity: quantity,
            availableFrom: `${harvestDate}T00:00:00`
        };

        publishButton.disabled = true;
        publishButton.textContent = "Publishing...";

        try {
            // POST /api/producelistings
            await apiRequest("/producelistings", {
                method: "POST",
                body: JSON.stringify(newListing)
            });

            showMessage("Your harvest listing has been published successfully!", "success");

            form.reset();
            locationInput.value = farmLocationText();

            // Show the farmer his listings
            setTimeout(function () {
                window.location.href = "my-listings.html";
            }, 1200);

        } catch (error) {
            showMessage(error.message, "error");

        } finally {
            publishButton.disabled = false;
            publishButton.textContent = "Publish Listing";
        }

    });


    // =================================
    // 4. ADD A NEW CROP (POST /api/crops)
    // =================================

    const toggleNewCrop = document.querySelector("#toggle-new-crop");
    const newCropBox = document.querySelector("#new-crop-box");
    const saveNewCrop = document.querySelector("#save-new-crop");

    if (toggleNewCrop) {

        toggleNewCrop.addEventListener("click", function () {
            newCropBox.style.display =
                newCropBox.style.display === "none" ? "flex" : "none";
        });

        saveNewCrop.addEventListener("click", async function () {

            const name = document.querySelector("#new-crop-name").value.trim();
            const category = document.querySelector("#new-crop-category").value;

            if (!name) {
                showMessage("Please type the name of the new crop.", "error");
                return;
            }

            saveNewCrop.disabled = true;

            try {
                const created = await apiRequest("/crops", {
                    method: "POST",
                    body: JSON.stringify({ name: name, category: category, description: null })
                });

                const option = new Option(name, created.id, true, true);
                cropSelect.add(option);

                document.querySelector("#new-crop-name").value = "";
                newCropBox.style.display = "none";

                showMessage(`"${name}" was added. You can now publish it.`, "success");

            } catch (error) {
                showMessage(error.message, "error");

            } finally {
                saveNewCrop.disabled = false;
            }
        });
    }

})();
