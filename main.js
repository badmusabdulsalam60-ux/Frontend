// Select the menu button
const menuToggle = document.querySelector("#menuToggle");

// Select the navigation links
const navLinks = document.querySelector("#navLinks");

// Listen for clicks on the menu button
menuToggle.addEventListener("click", function() {

    // Show or hide the navigation menu
    navLinks.classList.toggle("active");

    // Update the accessibility state
    const isOpen = navLinks.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", isOpen);

});

// Close menu after clicking a navigation link
navLinks.addEventListener("click", function(event) {

    if (event.target.tagName === "A") {

        navLinks.classList.remove("active");

        menuToggle.setAttribute("aria-expanded", "false");

    }

});