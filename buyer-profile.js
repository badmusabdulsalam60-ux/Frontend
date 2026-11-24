document.addEventListener("DOMContentLoaded", async function () {

    // Business address and state are not stored by the backend yet,
    // so they are kept in this browser only.
    const EXTRA_KEY = "agroconnect-buyer-extra";

    // Must be logged in to see this page.
    if (!localStorage.getItem("agroconnect-token")) {
        window.location.href = "login.html";
        return;
    }


    // GET FORM ELEMENTS
    const form = document.getElementById("buyer-profile-form");

    const firstName = document.getElementById("first-name");
    const lastName = document.getElementById("last-name");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");

    const businessName = document.getElementById("business-name");
    const businessAddress = document.getElementById("business-address");
    const state = document.getElementById("state");

    const profileName = document.getElementById("profile-name");
    const profileAvatar = document.getElementById("profile-avatar");

    const cancelButton = document.getElementById("cancel-button");
    const saveMessage = document.getElementById("save-message");

    let savedProfile = null;


    function getExtra() {
        try {
            return JSON.parse(localStorage.getItem(EXTRA_KEY)) || {};
        } catch {
            return {};
        }
    }

    function showMessage(text, isError) {
        saveMessage.textContent = text;
        saveMessage.style.color = isError ? "#c0392b" : "";
    }


    // DISPLAY PROFILE INFORMATION
    function displayProfile(profile) {

        firstName.value = profile.firstName;
        lastName.value = profile.lastName;
        username.value = profile.username;
        email.value = profile.email;
        phone.value = profile.phone;

        businessName.value = profile.businessName;
        businessAddress.value = profile.businessAddress;
        state.value = profile.state;

        profileName.textContent = `${profile.firstName} ${profile.lastName}`;

        profileAvatar.textContent =
            (profile.firstName.charAt(0) + profile.lastName.charAt(0))
            .toUpperCase();
    }


    // LOAD THE LOGGED-IN BUYER FROM THE API
    async function loadProfile() {
        try {
            // GET /api/buyer-profile/me  (apiRequest comes from api.js)
            const data = await apiRequest("/buyer-profile/me");
            const extra = getExtra();

            savedProfile = {
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                username: data.userName || "",
                email: data.email || "",
                phone: data.phoneNumber || "Not provided",
                businessName: data.businessName || "",
                businessAddress: extra.businessAddress || "",
                state: extra.state || ""
            };

            displayProfile(savedProfile);

        } catch (error) {
            showMessage(error.message, true);
        }
    }

    await loadProfile();


    // SAVE PROFILE CHANGES
    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!savedProfile) return;

        const name = businessName.value.trim();

        try {
            // PUT /api/buyer-profile/me
            // A business name means a Business buyer, otherwise Individual.
            await apiRequest("/buyer-profile/me", {
                method: "PUT",
                body: JSON.stringify({
                    buyerType: name ? "Business" : "Individual",
                    businessName: name || null
                })
            });

            localStorage.setItem(EXTRA_KEY, JSON.stringify({
                businessAddress: businessAddress.value.trim(),
                state: state.value.trim()
            }));

            savedProfile = {
                ...savedProfile,
                businessName: name,
                businessAddress: businessAddress.value.trim(),
                state: state.value.trim()
            };

            showMessage("Profile updated successfully!", false);

        } catch (error) {
            showMessage(error.message, true);
        }
    });


    // CANCEL CHANGES
    cancelButton.addEventListener("click", function () {

        if (savedProfile) {
            displayProfile(savedProfile);
        }

        showMessage("Changes have been cancelled.", false);
    });

});
