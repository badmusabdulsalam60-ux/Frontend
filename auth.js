
// =================================
// 1. ROLE SELECTION
// =================================

const roleButtons = document.querySelectorAll(".role-btn");
const userRole = document.querySelector("#userRole");

const farmerFields = document.querySelector("#farmerFields");
const buyerFields = document.querySelector("#buyerFields");

const buyerType = document.querySelector("#buyerType");
const businessNameGroup = document.querySelector("#businessNameGroup");
const businessNameInput = document.querySelector("#businessName");

function updateRegistrationFields(role) {
    if (!farmerFields || !buyerFields) return;

    const isFarmer = role === "Farmer";

    farmerFields.hidden = !isFarmer;
    buyerFields.hidden = isFarmer;

    // Only validate fields belonging to the selected role.
    farmerFields.querySelectorAll("input").forEach(input => {
        input.required = isFarmer;
    });

    if (buyerType) {
        updateBuyerTypeFields();
    }
}

function updateBuyerTypeFields() {
    if (!buyerType || !businessNameGroup || !businessNameInput) return;

    const isBusiness = buyerType.value === "Business";

    businessNameGroup.hidden = !isBusiness;
    businessNameInput.required = isBusiness;
}

roleButtons.forEach(button => {
    button.addEventListener("click", () => {
        roleButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        const selectedRole = button.dataset.role;
        userRole.value = selectedRole;

        updateRegistrationFields(selectedRole);
    });
});

if (buyerType) {
    buyerType.addEventListener("change", updateBuyerTypeFields);
}

if (userRole) {
    updateRegistrationFields(userRole.value);
}


// =================================
// 2. REGISTRATION
// =================================

const registerForm = document.querySelector("#registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = document.querySelector("#registerMessage");
        const button = document.querySelector("#registerButton");

        const role = userRole.value;

        const firstName = document.querySelector("#firstName").value.trim();
        const lastName = document.querySelector("#lastName").value.trim();
        const username = document.querySelector("#username").value.trim();
        const email = document.querySelector("#email").value.trim();
        const phone = document.querySelector("#phone").value.trim();
        const password = document.querySelector("#password").value;

        let endpoint;
        let payload;

        if (role === "Farmer") {
            endpoint = "/auth/register/farmer";

            payload = {
                firstName,
                lastName,
                userName: username,
                email,
                phoneNumber: phone,
                password,
                farmName: document.querySelector("#farmName").value.trim(),
                farmAddress: document.querySelector("#location").value.trim(),
                state: document.querySelector("#state").value.trim(),
                isVerified: false
            };

        } else {
            endpoint = "/auth/register/buyer";

            payload = {
                firstName,
                lastName,
                userName: username,
                email,
                phoneNumber: phone,
                password,
                buyerType: buyerType.value,
                businessName: buyerType.value === "Business"
                    ? businessNameInput.value.trim()
                    : null
            };
        }

        button.disabled = true;
        button.textContent = "Creating account...";
        message.textContent = "";
        message.style.color = "";

        try {
            await apiRequest(endpoint, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            message.textContent =
                "Registration successful! You can now log in.";

            message.style.color = "#14783b";

            registerForm.reset();

            if (userRole) {
                userRole.value = "Farmer";

                roleButtons.forEach(btn => {
                    btn.classList.toggle("active", btn.dataset.role === "Farmer");
                });

                updateRegistrationFields("Farmer");
            }

        } catch (error) {
            message.textContent = error.message;
            message.style.color = "#c0392b";

        } finally {
            button.disabled = false;
            button.textContent = "Register";
        }
    });
}


// =================================
// 3. LOGIN
// =================================

const loginForm = document.querySelector("#loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = document.querySelector("#loginMessage");
        const button = loginForm.querySelector(".auth-submit");

        const email = document.querySelector("#loginEmail").value.trim();
        const password = document.querySelector("#loginPassword").value;

        button.disabled = true;
        button.textContent = "Logging in...";
        message.textContent = "";

        try {
            const data = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!data || !data.token) {
                throw new Error("Login response did not contain an authentication token.");
            }

            // Save authentication details.
            localStorage.setItem("agroconnect-token", data.token);
            localStorage.setItem("agroconnect-user", JSON.stringify({
                userId: data.userId,
                fullName: data.fullName,
                email: data.email,
                role: data.role
            }));

            message.textContent = "Login successful!";
            message.style.color = "#14783b";

            const role = (data.role || "").toLowerCase();

            if (role.includes("farmer")) {
                window.location.href = "farmer-dashboard.html";
            } else if (role.includes("buyer")) {
                window.location.href = "buyer-dashboard.html";
            } else if (role.includes("admin")) {
                window.location.href = "crops.html";
            } else {
                throw new Error("Your account role could not be identified.");
            }

        } catch (error) {
            message.textContent = error.message;
            message.style.color = "#c0392b";

        } finally {
            button.disabled = false;
            button.textContent = "Login";
        }
    });
}


// =================================
// 4. FORGOT PASSWORD
// =================================

const forgotPassword = document.querySelector("#forgotPassword");

if (forgotPassword) {
    forgotPassword.addEventListener("click", event => {
        event.preventDefault();

        alert("Password recovery is not available yet.");
    });
}
