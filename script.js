document.addEventListener("DOMContentLoaded", function () {
    var year = new Date().getFullYear();
    var footerYear = document.getElementById("footer-year");
    if (footerYear) {
        footerYear.textContent = "© " + year + " Oluwatosin Mulero. All rights reserved.";
    }

    var toggle = document.querySelector(".nav-toggle");
    var navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
        toggle.addEventListener("click", function () {
            var isOpen = navLinks.classList.toggle("open");
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    var sections = document.querySelectorAll("section[id]");
    var navigationLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            navigationLinks.forEach(function (link) {
                link.classList.remove("active");
            });

            var activeLink = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
            if (activeLink) activeLink.classList.add("active");
        });
    }, { rootMargin: "-32% 0px -56% 0px" });

    sections.forEach(function (section) {
        navObserver.observe(section);
    });

    var revealItems = document.querySelectorAll(".reveal");
    var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    revealItems.forEach(function (item) {
        revealObserver.observe(item);
    });

    var progressBar = document.getElementById("page-progress-bar");

    function updateProgress() {
        if (!progressBar) return;
        var doc = document.documentElement;
        var scrollTop = window.scrollY || doc.scrollTop;
        var scrollable = doc.scrollHeight - window.innerHeight;
        var progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
        progressBar.style.width = Math.min(100, Math.max(0, progress)) + "%";
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
});