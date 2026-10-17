# Technical validation record — 17 October 2026

**Project:** Mulero Analytics Fintech Product Science Lab  
**Nature:** independent, seeded, synthetic financial-product demonstration; not Monzo data or Monzo employment evidence.

## Checks

| Verification | Result |
|---|---|
| Original local package: automated tests | 20 passed |
| Original local source and tests: Python compilation | Passed |
| Original local pipeline: data + statistics + SQL + charts + report | Passed |
| Original local website: HTML pages | 6 |
| Original local website: broken local HTML/asset references | 0 |
| Published reference core CI | Passed |
| Public website GitHub Pages deployment | Passed |
| GitHub portfolio quality checks | Passed |

## Reproduced fictional results

- Randomised 16,000-user onboarding: **+3.79 pp** seven-day activation effect.
- Balanced 4,500-customer observational panel: **+5.37 pp** conditional DiD estimate.
- Churn model August future holdout: **0.799 ROC AUC**, approximately **0.216 PR AUC**.

All figures are synthetic: no commercial KPI or causal banking outcome is claimed.

## Technical design and open risks

1. **A/B testing:** fixed-sample user-level ITT, SRM check, CUPED, Wald interval and descriptive support/dispute guardrails. Simulation forces group counts to balance. Rare disputes are underpowered; rollout conditions require separately agreed guardrails.
2. **DiD:** simultaneous-treatment TWFE with customer demeaning, week fixed effects, customer-clustered SE and pretrend slope diagnostic. The non-randomised estimate depends on untestable parallel untreated trends; pretrend p-values cannot validate causality.
3. **Churn:** customer-level snapshots, train-only preprocessing, train January–April, May and July label embargoes, June model selection and an untouched August test. This evaluates risk ranking, **not** intervention uplift.
4. **SQL:** four reports execute on an in-memory SQLite warehouse with generated datasets; no external credentials.
5. **Synthetic disclosure:** no proprietary bank customer data, no verified company results, no real-team line-management claims.

## Publication boundaries

The `source/` folder is a self-contained **reference implementation** that regenerates the primary studies, datasets, four SQL reports and illustrative plots and has its own GitHub CI. It is **not a byte-for-byte mirror of the full local package**, which also has 20 comprehensive tests, 16 explanatory guides, additional charts and Windows launchers.

Current GitHub integration does not expose creation of a new standalone repository. Source is appropriately published within the existing `data-analytics-portfolio` repository.

**Verdict:** suitable as a reproducible and clearly labelled synthetic portfolio demonstration; not audited for use in production financial services.
