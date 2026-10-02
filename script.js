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

// ==========================================
// ACTIVE NAVIGATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const sections = document.querySelectorAll(
        "section[id]"
    );

    const navigationLinks = document.querySelectorAll(
        '.nav-links a[href^="#"]'
    );

    const observer = new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    navigationLinks.forEach(link => {
                        link.classList.remove("active");
                    });

                    const activeLink = document.querySelector(
                        `.nav-links a[href="#${entry.target.id}"]`
                    );

                    if (activeLink) {
                        activeLink.classList.add("active");
                    }

                }

            });

        },
        {
            rootMargin: "-35% 0px -55% 0px"
        }
    );

    sections.forEach(section => {
        observer.observe(section);
    });

});
