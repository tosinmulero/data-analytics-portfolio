SELECT CASE WHEN tenure_days < 90 THEN 'new_under_90d'
  WHEN tenure_days <= 365 THEN 'established_90_to_365d'
  ELSE 'mature_over_365d' END AS tenure_segment,
 customer_segment,COUNT(*) AS customers,
 ROUND(AVG(CAST(churn_next_30d AS REAL)),4) AS subsequent_churn_rate,
 ROUND(AVG(CAST(txn_30d AS REAL)),2) AS mean_txn_30d
FROM churn_snapshots GROUP BY 1,2 ORDER BY 1,2;
