// ==========================================
// Oluwatosin Mulero Data Portfolio
// ==========================================

// Automatically keep footer year current
document.addEventListener("DOMContentLoaded", () => {

    const footer = document.querySelector("footer p");

    if (footer) {
        const currentYear = new Date().getFullYear();

        footer.innerHTML =
            `&copy; ${currentYear} Oluwatosin Mulero. All rights reserved.`;
    }

});
