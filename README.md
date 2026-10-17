# Mulero Analytics — Data Analytics & Business Intelligence Portfolio

A professional website and a collection of **11 independently developed analytics and data science portfolio projects** by **Oluwatosin Mulero (MSc Data Science, University of Greenwich)**.

**[Visit the live website](https://tosinmulero.github.io/data-analytics-portfolio/)** · **[Browse the project case studies](https://tosinmulero.github.io/data-analytics-portfolio/projects.html)** · **[View the GitHub profile](https://github.com/tosinmulero)** · **[LinkedIn](https://www.linkedin.com/in/oluwatosin-mulero-55a578140)**

![RailPartner 360 — business intelligence portfolio dashboard](images/railpartner360_executive_overview.png)

## Purpose

Mulero Analytics presents practical capabilities in SQL, Python, data quality, analytics engineering, business intelligence, reporting, experimentation, machine learning and related tooling. It is designed for prospective employers, collaborators and organisations exploring analytics support.

This repository contains the **website**. Each technical project has a **separate repository** containing its own methodology and supporting evidence.

## Website pages

| Page | Purpose |
| --- | --- |
| [Home](https://tosinmulero.github.io/data-analytics-portfolio/) | Introduction and featured work |
| [Services](https://tosinmulero.github.io/data-analytics-portfolio/services.html) | Analytics and reporting capabilities |
| [Projects](https://tosinmulero.github.io/data-analytics-portfolio/projects.html) | Portfolio projects and filters with 11 dedicated case-study pages |
| [About](https://tosinmulero.github.io/data-analytics-portfolio/about.html) | Founder background and approach |
| [Contact](https://tosinmulero.github.io/data-analytics-portfolio/contact.html) | Project enquiries and recruiter contact |

## Dedicated project pages

Each project has a standalone case study at `case-studies/<slug>.html`, with problem framing, data provenance, analytical methods, evidence, decision relevance and limitations. Featured cards and the full projects listing link directly to these pages. Legacy `projects.html?project=<slug>` links redirect to the dedicated pages.

## Portfolio projects

| Project | Evidence repository |
| --- | --- |
| NHS Primary Care Data Management & Clinical Intelligence | [Source and documentation](https://github.com/tosinmulero/nhs-primary-care-intelligence-platform) |
| RailNexus — B2B Product Growth & Network Intelligence | [Source and documentation](https://github.com/tosinmulero/railnexus-b2b-product-growth-intelligence) |
| RailPartner 360 — B2B Rail Retail & Customer Intelligence | [Source and documentation](https://github.com/tosinmulero/railpartner-360) |
| RailFlow ML Data Platform | [Source and documentation](https://github.com/tosinmulero/railflow-ml-data-platform) |
| RailSearch — Customer Journey & Conversion Intelligence | [Source and documentation](https://github.com/tosinmulero/railsearch-customer-journey-intelligence) |
| Credit Risk Intelligence & Explainable Default Prediction | [Source and documentation](https://github.com/tosinmulero/credit-risk-explainable-ai) |
| Customer 360 & Revenue Growth Analytics | [Source and documentation](https://github.com/tosinmulero/customer-360-revenue-growth-analytics) |
| NHS Hospital Performance & Patient Flow | [Source and documentation](https://github.com/tosinmulero/nhs-hospital-performance-analysis) |
| Olist E-Commerce Analytics | [Source and documentation](https://github.com/tosinmulero/olist-ecommerce-analysis) |
| Cyclistic Rider Behaviour Analysis | [Source and documentation](https://github.com/tosinmulero/cyclistic-rider-behaviour-analysis) |
| Bellabeat Wellness Analysis | [Source and documentation](https://github.com/tosinmulero/bellabeat-wellness-analysis) |

> **Project integrity:** Several demonstrations use synthetic, fictional, or public datasets. Reported results describe the corresponding portfolio experiments, not verified outcomes for external clients. In particular, the NHS primary-care project is independently developed and synthetic; it does not contain real patient data or imply NHS endorsement. Read each project's README for its dataset provenance, limitations and reproducibility instructions.

## Website implementation

The website is a responsive, static **HTML, CSS and vanilla JavaScript** application deployed using **GitHub Pages**.

- `index.html`, `services.html`, `projects.html`, `about.html`, `contact.html` — site pages
- `style.css` — shared styling and responsive design
- `script.js` — navigation, project filtering and case-study interactions
- `portfolio-projects.json` and `projects-data.js` — structured project data and local-preview fallback
- `images/` — selected project screenshots and founder portrait
- `sitemap.xml`, `robots.txt`, `favicon.svg` — discovery and presentation assets

### Preview locally in VS Code

1. Clone the repository and open the folder in **VS Code**.
2. Run a local web server from VS Code's integrated terminal:

   ```powershell
   python -m http.server 8000
   ```

3. Open `http://localhost:8000/` in your browser.

No frontend framework or build step is needed for a basic local preview. For project-data changes, keep `portfolio-projects.json` and the local-preview fallback `projects-data.js` consistent.

## Contact

For analytics enquiries, collaboration or recruitment: **[tosinmulero@gmail.com](mailto:tosinmulero@gmail.com)**. Recruiters can request a current CV by email.

**© Mulero Analytics — independent professional portfolio.** No licence is asserted by this README; review the repository's licence status before reusing code or assets.
