// =====================================
// FARMER PROFILE (loaded from and saved to the API)
// =====================================

(async function () {

    if (!requireRole("Farmer")) return;


    // GET PROFILE ELEMENTS

    const profileForm = document.getElementById("profile-form");

    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");

    const farmNameInput = document.getElementById("farm-name");
    const farmAddressInput = document.getElementById("farm-address");
    const stateInput = document.getElementById("state");

    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileInitials = document.getElementById("profile-initials");

    const verificationStatus = document.getElementById("verification-status");
    const profileMessage = document.getElementById("profile-message");

    const cancelButton = document.querySelector(".cancel-button");

    let savedProfile = null;


    function showMessage(text, isError) {
        profileMessage.textContent = text;
        profileMessage.className = isError ? "error-message" : "success-message";
        profileMessage.style.color = isError ? "#c0392b" : "";
    }


    // DISPLAY PROFILE

    function displayProfile(profile) {

        firstNameInput.value = profile.firstName || "";
        lastNameInput.value = profile.lastName || "";
        usernameInput.value = profile.userName || "";
        emailInput.value = profile.email || "";
        phoneInput.value = profile.phoneNumber || "";

        farmNameInput.value = profile.farmName || "";
        farmAddressInput.value = profile.farmAddress || "";
        stateInput.value = profile.state || "";

        const fullName =
            `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

        profileName.textContent = fullName || "Farmer";
        profileEmail.textContent = profile.email || "Email unavailable";

        const initials =
            (profile.firstName || "").charAt(0) +
            (profile.lastName || "").charAt(0);

        profileInitials.textContent = initials.toUpperCase() || "F";

        verificationStatus.textContent =
            `Verification: ${profile.isVerified ? "Verified" : "Not verified yet"}`;
    }


    // LOAD PROFILE FROM THE API

    try {
        // GET /api/farmer-profile/me
        savedProfile = await apiRequest("/farmer-profile/me");
        displayProfile(savedProfile);
    } catch (error) {
        showMessage(error.message, true);
    }


    // SAVE PROFILE

    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!savedProfile) return;

        try {
            // PUT /api/farmer-profile/me
            savedProfile = await apiRequest("/farmer-profile/me", {
                method: "PUT",
                body: JSON.stringify({
                    farmName: farmNameInput.value.trim(),
                    farmAddress: farmAddressInput.value.trim(),
                    state: stateInput.value.trim()
                })
            });

            displayProfile(savedProfile);

            showMessage("Your farm profile has been updated successfully!", false);

        } catch (error) {
            showMessage(error.message, true);
        }
    });


    // CANCEL CHANGES (restore the last saved information)

    cancelButton.addEventListener("click", function (event) {

        // The button is type="reset", so stop the browser from blanking the form
        event.preventDefault();

        if (savedProfile) {
            displayProfile(savedProfile);
        }

        profileMessage.textContent = "";
        profileMessage.className = "";
    });

})();
