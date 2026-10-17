SELECT variant, COUNT(*) AS assigned,
 SUM(kyc_completed) AS kyc_completed,
 SUM(account_funded) AS funded,
 SUM(activated_7d) AS made_first_card_payment,
 ROUND(1.0*SUM(kyc_completed)/COUNT(*),4) AS kyc_rate,
 ROUND(1.0*SUM(account_funded)/COUNT(*),4) AS funding_rate,
 ROUND(1.0*SUM(activated_7d)/COUNT(*),4) AS first_card_payment_rate
FROM experiment GROUP BY variant;
