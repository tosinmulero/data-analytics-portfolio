"""Regression checks for synthetic-only, deterministically seeded public reference code."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fintech_core import experiment_data, causal_data, churn_data, analyse_experiment, analyse_causal, analyse_churn

class PortfolioTests(unittest.TestCase):
    def test_sizes_and_constraints(self):
        a=experiment_data()
        self.assertEqual(len(a),16000)
        self.assertFalse(a.customer_id.duplicated().any())
        self.assertEqual((a.variant=="control").sum(),8000)
        self.assertTrue(((a.activated_7d==0)|(a.kyc_completed==1)).all())
    def test_observational_panel(self):
        d=causal_data()
        self.assertEqual(len(d),45000)
        self.assertFalse(d.duplicated(["customer_id","week_relative"]).any())
    def test_churn_point_in_time(self):
        d=churn_data()
        self.assertEqual(len(d),14000)
        self.assertFalse(d.customer_id.duplicated().any())
    def test_randomised_effect(self):
        result=analyse_experiment(experiment_data())
        self.assertAlmostEqual(result["primary"]["effect"]*100,3.79,places=1)
    def test_causal_estimate(self):
        result=analyse_causal(causal_data())
        self.assertAlmostEqual(result["att_pp"],5.37,places=1)
    def test_churn_holdout(self):
        result=analyse_churn(churn_data())
        self.assertAlmostEqual(result["holdout"]["roc_auc"],.799,places=2)
        self.assertGreater(result["n_embargo"],0)

if __name__=="__main__":unittest.main()
