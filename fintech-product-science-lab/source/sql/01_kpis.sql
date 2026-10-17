SELECT variant, COUNT(*) AS randomised_customers,
 ROUND(AVG(CAST(activated_7d AS REAL)),4) AS activation_rate_7d,
 ROUND(AVG(CAST(contribution_30d_gbp AS REAL)),2) AS contribution_30d_per_user_gbp,
 ROUND(AVG(CAST(support_contact_7d AS REAL)),4) AS support_contact_rate
FROM experiment GROUP BY variant ORDER BY variant;
