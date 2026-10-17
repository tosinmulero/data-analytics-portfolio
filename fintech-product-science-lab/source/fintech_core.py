"""Reproducible, synthetic-only fintech product science reference implementation.
Do not represent results as Monzo data or measured company performance.
"""
from __future__ import annotations
import argparse
import json
import sqlite3
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.special import expit
from scipy.stats import norm, chisquare
import statsmodels.formula.api as smf
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss, roc_curve
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

SEED = 42
FEATURES = ["txn_30d","app_sessions_30d","balance_gbp","support_tickets_90d",
            "salary_inflow_90d","tenure_days","customer_segment"]
TARGET = "churn_next_30d"

def experiment_data(n=16000, seed=42):
    rng=np.random.default_rng(seed)
    variant=rng.permutation(np.array([0]*(n//2)+[1]*(n-n//2)))
    prior_txns=rng.poisson(2.2,n)
    tenure_days=rng.integers(1,540,n)
    risk_band=rng.choice(["low","medium","high"],p=[.68,.25,.07],size=n)
    latent=-.44+.17*prior_txns+.0003*tenure_days+.13*variant
    activated=rng.binomial(1,expit(latent))
    kyc=rng.binomial(1,np.clip(.92+.018*variant,.01,.99),n)
    activated=activated*kyc
    funded=np.where(activated==1,1,rng.binomial(1,.68,n)*kyc)
    support=rng.binomial(1,expit(-2.65-.10*variant+.2*(risk_band=="high")))
    dispute=rng.binomial(1,.006+.001*variant,n)
    revenue=np.where(activated==1,rng.gamma(2.4,2.4,n),rng.gamma(1,.35,n))
    dates=pd.Timestamp("2026-02-01")+pd.to_timedelta(rng.integers(0,28,n),unit="D")
    return pd.DataFrame({"customer_id":[f"EXP-{i:06d}" for i in range(n)],
      "assignment_date":dates.strftime("%Y-%m-%d"),
      "variant":np.where(variant==1,"treatment","control"),
      "prior_7d_txns":prior_txns,"tenure_days":tenure_days,"risk_band":risk_band,
      "kyc_completed":kyc,"account_funded":funded,"activated_7d":activated,
      "support_contact_7d":support,"dispute_30d":dispute,
      "contribution_30d_gbp":np.round(revenue,2)})

def causal_data(n=4500,seed=43):
    rng=np.random.default_rng(seed)
    ids=np.arange(n)
    propensity=rng.uniform(.15,.85,n)
    treated=rng.binomial(1,propensity)
    affinity=rng.normal(0,.75,n)
    week=np.tile(np.arange(-5,5),n)
    person=np.repeat(ids,10)
    tr=treated[person]
    person_effect=affinity[person]+.28*(propensity[person]-.5)
    post=(week>=0).astype(int)
    common_trend=.012*week+.016*np.sin((week+5)/2)
    prob=expit(-.18+person_effect+common_trend+.20*tr+.19*tr*post)
    active=rng.binomial(1,prob)
    dates=pd.Timestamp("2026-03-02")+pd.to_timedelta(week+5,unit="W")
    return pd.DataFrame({"customer_id":[f"DID-{x:06d}" for x in person],
      "week_relative":week,"week_start":dates.strftime("%Y-%m-%d"),
      "treated":tr,"post":post,"weekly_active":active})

def churn_data(n=14000,seed=44):
    rng=np.random.default_rng(seed)
    month_idx=rng.integers(0,8,n)
    dt=pd.Timestamp("2026-01-31")
    dates=pd.to_datetime([dt+pd.DateOffset(months=int(m)) for m in month_idx])
    tenure=rng.integers(14,1200,n)
    txns=rng.poisson(rng.uniform(1.5,16,n))
    sessions=rng.poisson(2.5+.9*txns)
    balance=np.round(rng.lognormal(6.2,1.1,n),2)
    tickets=rng.poisson(.36,n)
    salary=rng.binomial(1,.48+.1*(tenure>300),n)
    segment=rng.choice(["everyday","salary","saver"],n,p=[.49,.30,.21])
    logit=(-.5-.17*txns-.075*sessions-.00025*balance+.53*tickets
           -.62*salary-.0008*tenure+.30*(segment=="everyday")+.14*(month_idx>=6))
    churn=rng.binomial(1,expit(logit))
    df=pd.DataFrame({"customer_id":[f"RET-{i:06d}" for i in range(n)],
      "snapshot_date":dates.strftime("%Y-%m-%d"),"txn_30d":txns,
      "app_sessions_30d":sessions,"balance_gbp":balance,
      "support_tickets_90d":tickets,"salary_inflow_90d":salary,
      "tenure_days":tenure,"customer_segment":segment,"churn_next_30d":churn})
    df.loc[rng.choice(n,int(n*.03),replace=False),"balance_gbp"]=np.nan
    return df

def difference(control,treatment):
    a=np.asarray(control,float);b=np.asarray(treatment,float)
    d=float(b.mean()-a.mean())
    se=float(np.sqrt(a.var(ddof=1)/len(a)+b.var(ddof=1)/len(b)))
    return {"control_mean":float(a.mean()),"treatment_mean":float(b.mean()),
       "effect":d,"ci_low":d-1.96*se,"ci_high":d+1.96*se,
       "p_value":float(2*norm.sf(abs(d/se))) if se else 1.0}

def analyse_experiment(df):
    if df.customer_id.duplicated().any():raise ValueError("duplicate randomised users")
    a=df[df.variant=="control"];b=df[df.variant=="treatment"]
    srmp=float(chisquare([len(a),len(b)],f_exp=[len(df)/2]*2).pvalue)
    pooled=pd.concat([a,b])
    x=pooled.prior_7d_txns.to_numpy(float);y=pooled.activated_7d.to_numpy(float)
    theta=float(np.cov(x,y,ddof=1)[0,1]/np.var(x,ddof=1))
    covmean=float(x.mean())
    cuped=difference(a.activated_7d-theta*(a.prior_7d_txns-covmean),
                     b.activated_7d-theta*(b.prior_7d_txns-covmean))
    primary=difference(a.activated_7d,b.activated_7d)
    guardrails={k:difference(a[k],b[k]) for k in
       ["support_contact_7d","dispute_30d","contribution_30d_gbp"]}
    return {"n_control":len(a),"n_treatment":len(b),"srm_p":srmp,
            "primary":primary,"cuped":cuped,"guardrails":guardrails,
            "disclosure":"Synthetic ITT; no live rollout or real customer data"}

def analyse_causal(df):
    if df.duplicated(["customer_id","week_relative"]).any():raise ValueError("duplicate person/week")
    data=df.copy();data["interaction"]=data.treated*data.post
    for c in ["weekly_active","interaction"]:
        data[c+"_within"]=data[c]-data.groupby("customer_id")[c].transform("mean")
    fit=smf.ols("weekly_active_within ~ interaction_within + C(week_relative) - 1",data=data).fit(
       cov_type="cluster",cov_kwds={"groups":data.customer_id})
    ci=fit.conf_int().loc["interaction_within"]
    pre=data[data.week_relative<0].copy()
    pre["slope_interaction"]=pre.treated*pre.week_relative
    prefit=smf.ols("weekly_active ~ treated + week_relative + slope_interaction",data=pre).fit(
       cov_type="cluster",cov_kwds={"groups":pre.customer_id})
    return {"customers":int(data.customer_id.nunique()),"rows":len(data),
            "att_pp":float(fit.params["interaction_within"])*100,
            "ci_pp":[float(ci.iloc[0])*100,float(ci.iloc[1])*100],
            "p_value":float(fit.pvalues["interaction_within"]),
            "pretrend_p":float(prefit.pvalues["slope_interaction"]),
            "disclosure":"Observational estimate; parallel trends cannot be proved by a pretrend p-value"}

def build_model(estimator):
    preprocess=ColumnTransformer([
       ("numeric",Pipeline([("impute",SimpleImputer(strategy="median")),
                             ("scale",StandardScaler())]),FEATURES[:-1]),
       ("category",Pipeline([("impute",SimpleImputer(strategy="most_frequent")),
                             ("onehot",OneHotEncoder(handle_unknown="ignore"))]),["customer_segment"])])
    return Pipeline([("features",preprocess),("model",estimator)])

def score(y,p):
    return {"roc_auc":float(roc_auc_score(y,p)),
            "pr_auc":float(average_precision_score(y,p)),
            "brier":float(brier_score_loss(y,p))}

def analyse_churn(df):
    if df.customer_id.duplicated().any():raise ValueError("duplicate churn customers")
    data=df.copy();data["snapshot_date"]=pd.to_datetime(data.snapshot_date)
    train=data[data.snapshot_date<"2026-05-01"]
    val=data[(data.snapshot_date>="2026-06-01")&(data.snapshot_date<"2026-07-01")]
    test=data[data.snapshot_date>="2026-08-01"]
    excluded=len(data)-len(train)-len(val)-len(test)
    if min(map(len,[train,val,test]))<100:raise ValueError("insufficient chronological data")
    candidates={"logistic_regression":LogisticRegression(max_iter=1600,random_state=42),
        "random_forest":RandomForestClassifier(n_estimators=120,min_samples_leaf=12,
                                               max_depth=12,n_jobs=-1,random_state=42)}
    trained={};validation={}
    for name,est in candidates.items():
        pipe=build_model(est);pipe.fit(train[FEATURES],train[TARGET])
        validation[name]=score(val[TARGET],pipe.predict_proba(val[FEATURES])[:,1])
        trained[name]=pipe
    best=max(validation,key=lambda n:validation[n]["roc_auc"])
    if validation["logistic_regression"]["roc_auc"]>=validation[best]["roc_auc"]-.01:
        best="logistic_regression"
    pred=trained[best].predict_proba(test[FEATURES])[:,1]
    metric=score(test[TARGET],pred)
    ranked=test.assign(prediction=pred).sort_values("prediction",ascending=False)
    top=ranked.head(int(np.ceil(.1*len(ranked))))
    base=float(test[TARGET].mean())
    metric.update({"base_rate":base,"top_decile_rate":float(top[TARGET].mean()),
                   "top_decile_lift":float(top[TARGET].mean()/base)})
    fpr,tpr,_=roc_curve(test[TARGET],pred)
    return {"n_train":len(train),"n_validation":len(val),"n_test":len(test),
       "n_embargo":excluded,"model":best,"validation":validation,"holdout":metric,
       "roc":{"fpr":fpr.tolist(),"tpr":tpr.tolist()},
       "disclosure":"Scores rank risk, not treatment responsiveness"}

def sql_reports(frames,directory):
    sqlroot=Path(__file__).resolve().parent/"sql"
    with sqlite3.connect(":memory:") as con:
       for name,frame in frames.items():frame.to_sql(name,con,index=False)
       outputs={}
       for f in sorted(sqlroot.glob("*.sql")):
           result=pd.read_sql_query(f.read_text(),con)
           result.to_csv(directory/(f.stem+".csv"),index=False)
           outputs[f.stem]=result.to_dict(orient="records")
    return outputs

def main(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    frames={"experiment":experiment_data(),"weekly_panel":causal_data(),
            "churn_snapshots":churn_data()}
    for name,frame in frames.items():frame.to_csv(output/(name+".csv"),index=False)
    experiment=analyse_experiment(frames["experiment"])
    causal=analyse_causal(frames["weekly_panel"])
    churn=analyse_churn(frames["churn_snapshots"])
    result={"disclosure":"All data are synthetic; independent demonstration, not Monzo operating results",
            "experiment":experiment,"causal":causal,"churn":churn,
            "sql":sql_reports(frames,output)}
    (output/"results.json").write_text(json.dumps(result,indent=2,allow_nan=False),encoding="utf8")
    fig,ax=plt.subplots(figsize=(6,3.5))
    p=experiment["primary"]
    ax.bar(["Control","Treatment"],[100*p["control_mean"],100*p["treatment_mean"]])
    ax.set_ylabel("Seven-day activation (%)");ax.set_title("Synthetic onboarding experiment")
    fig.tight_layout();fig.savefig(output/"experiment_activation.png");plt.close(fig)
    fig,ax=plt.subplots(figsize=(5,4))
    ax.plot(churn["roc"]["fpr"],churn["roc"]["tpr"],label=f"ROC AUC {churn['holdout']['roc_auc']:.3f}")
    ax.plot([0,1],[0,1],"--",alpha=.5);ax.set_xlabel("False positive rate");ax.set_ylabel("True positive rate")
    ax.legend();fig.tight_layout();fig.savefig(output/"churn_roc.png");plt.close(fig)
    print(f"Synthetic A/B effect: {100*p['effect']:+.2f} pp")
    print(f"Observational DiD: {causal['att_pp']:+.2f} pp")
    print(f"Untouched August holdout ROC AUC: {churn['holdout']['roc_auc']:.3f}")
    return result

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output-dir",default="fintech-results")
    args=parser.parse_args()
    main(args.output_dir)
