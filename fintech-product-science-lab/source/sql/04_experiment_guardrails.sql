SELECT variant,COUNT(*) AS n,
 SUM(support_contact_7d) AS support_contacts,
 ROUND(AVG(CAST(support_contact_7d AS REAL)),4) AS support_contact_rate,
 SUM(dispute_30d) AS disputed_customers,
 ROUND(AVG(CAST(dispute_30d AS REAL)),5) AS dispute_rate
FROM experiment GROUP BY variant;
