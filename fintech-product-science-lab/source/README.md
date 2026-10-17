# Fintech Product Science Lab — reproducible core

This directory publishes an independently executable, **synthetic-only** analytical reference implementation alongside the public case-study website. It is not Monzo code or customer data.

## Reproduce the demonstrations

Use Python 3.11+:

```bash
python -m pip install -r fintech-product-science-lab/source/requirements.txt
python fintech-product-science-lab/source/fintech_core.py --output-dir ./fintech-results
python -m unittest discover -s fintech-product-science-lab/source -p "test_*.py"
```

The script produces seeded CSV datasets, JSON results, SQL rollups, and figures for three fictional product studies. No API keys or real customer data.

- **A/B testing:** 16,000 randomised fictional customers, intent-to-treat effects and sample-ratio-mismatch checks.
- **Causal inference:** 4,500-customer × 10-week balanced observational panel, clustered two-way fixed-effects difference-in-differences and a pretrend diagnostic.
- **Retention:** 14,000 customers, point-in-time features, 30-day label maturity gaps, validation-only model selection and an August holdout.

Scope: this is a self-contained public reproduction entry point. The earlier local downloadable package additionally includes extended reporting, 20 unit tests, 15 supporting documents, Windows launchers and a separate original website build. Generated datasets and charts are not committed here.

All demonstrated results are synthetic and are not actual bank operating results, causal treatment effects achieved in production, or commercial achievements.

## Analytical cautions

- Do not treat a nonsignificant pretrend test as proof of parallel untreated trends.
- The A/B test uses normal-approximation inference; guardrail non-inferiority is **not** established.
- Retention discrimination does not identify intervention uplift; actual outreach impact requires randomisation.
- All business-value scenarios are assumptions, not measured gains.
