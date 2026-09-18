# -*- coding: utf-8 -*-
"""Ban sao Python cua mo hinh trong workbook — dung de:
  1. tinh bang tom tat 3 kich ban (sheet Kich_ban)
  2. doi chieu voi ket qua LibreOffice tinh lai (finance/verify.py)
Moi cong thuc o day phai trung voi cong thuc Excel trong build_model.py.
"""
import math
from params import scen, N

MAXAGE = N

def _ceil(x): return math.ceil(round(x, 9))

def unit_that(p, a):
    """Unit economics 1 IP nguoi that o tuoi a."""
    if a == 0:
        return dict(surv=1.0, gross=0, net=0, comm=0, book=0, bonus=0, rev=0, shr=0, sal=0,
                    crew=0, std=0, ads=0, smp=0, build=p["build_that"], cost=p["build_that"],
                    gp=-p["build_that"])
    surv = (1.0
            * ((1 - p["gate1_drop"]) if a > p["gate1_m"] else 1)
            * ((1 - p["gate2_drop"]) if a > p["gate2_m"] else 1)
            * (1 - (1 - (1 - p["attr_y"]) ** (1 / 12))) ** max(0, a - 9))
    pick = lambda s1, s2, s3, s4: s1 if a <= 3 else s2 if a <= 6 else s3 if a <= 9 else s4
    gmvs = pick(p["gmv_s1"], p["gmv_s2"], p["gmv_s3"], p["gmv_s4"])
    ses = pick(p["ses_s1"], p["ses_s2"], p["ses_s3"], p["ses_s4"])
    gross = gmvs * ses
    net = gross * (1 - p["ret"])
    comm = net * p["comm"]
    book = p["book_fee"] * ses if a >= p["book_from"] else 0
    bonus = net * p["bonus"]
    rev = comm + book + bonus
    shr = rev * p["share_tal"]
    sal = p["sal_inc"] if a <= 3 else p["sal_st"]
    ads = net * pick(p["ads_s1"], p["ads_s2"], p["ads_s3"], p["ads_s4"])
    cost = shr + sal + p["crew"] + p["studio"] + ads + p["sample"]
    return dict(surv=surv, gross=gross, net=net, comm=comm, book=book, bonus=bonus, rev=rev,
                shr=shr, sal=sal, crew=p["crew"], std=p["studio"], ads=ads, smp=p["sample"],
                build=0, cost=cost, gp=rev - cost)

def unit_ai(p, a):
    if a == 0:
        return dict(surv=1.0, gross=0, net=0, rev=0, lic=0, ops=0, ads=0, oth=0,
                    build=p["ai_build"], cost=p["ai_build"], gp=-p["ai_build"])
    surv = (1 - (1 - (1 - p["ai_attr_y"]) ** (1 / 12))) ** max(0, a - p["ai_ramp"] - 1)
    sell = a > p["ai_ramp"]
    gross = p["ai_gmv_h"] * p["ai_hours"] * p["ai_days"] if sell else 0
    net = gross * (1 - p["ai_ret"])
    rev = net * p["ai_comm"]
    ads = net * p["ai_ads"]
    cost = p["ai_lic"] + p["ai_ops"] + ads + p["ai_other"]
    return dict(surv=surv, gross=gross, net=net, rev=rev, lic=p["ai_lic"], ops=p["ai_ops"],
                ads=ads, oth=p["ai_other"], build=0, cost=cost, gp=rev - cost)

def run(name, shock_pct=None, shock_from=None, shock_len=None, over=None):
    p = scen(name)
    if over: p.update(over)
    if shock_pct is not None: p["shock_pct"] = shock_pct
    if shock_from is not None: p["shock_from"] = shock_from
    if shock_len is not None: p["shock_len"] = shock_len

    U1 = [unit_that(p, a) for a in range(MAXAGE + 1)]
    U2 = [unit_ai(p, a) for a in range(MAXAGE + 1)]
    M = range(1, N + 1)
    new_t = {m: (p["hire1"] if m <= 6 else p["hire2"] if m <= 18 else p["hire3"]) for m in M}
    new_a = {m: (0 if m < p["ai_start"] else p["ai_hire1"] if m < p["ai_start"] + 12 else p["ai_hire2"]) for m in M}
    gT = {(a, m): (new_t[m - a] * U1[a]["surv"] if m - a >= 1 else 0) for a in range(MAXAGE + 1) for m in M}
    gA = {(a, m): (new_a[m - a] * U2[a]["surv"] if m - a >= 1 else 0) for a in range(MAXAGE + 1) for m in M}
    s1 = lambda k, m: sum(gT[(a, m)] * U1[a][k] for a in range(MAXAGE + 1))
    s2 = lambda k, m: sum(gA[(a, m)] * U2[a][k] for a in range(MAXAGE + 1))
    shock = {m: (1 - p["shock_pct"]) if p["shock_from"] <= m < p["shock_from"] + p["shock_len"] else 1.0 for m in M}

    r = {k: {} for k in (
        "act_t", "act_a", "gg_t", "gg_a", "gg", "gn", "rev_t", "rev_ai", "rev", "shr", "cogs",
        "opex", "ebitda", "dep", "ebit", "tax", "ni", "cum_ni", "gp", "hc", "capex",
        "cash_in", "cash_out", "ops_cf", "cash_end", "cum_ops")}
    loss, cum_ni, capex_cum, cash, cum_ops = 0.0, 0.0, 0.0, 0.0, 0.0
    hc_prev = 0
    for m in M:
        r["act_t"][m] = sum(gT[(a, m)] for a in range(1, MAXAGE + 1))
        r["act_a"][m] = sum(gA[(a, m)] for a in range(1, MAXAGE + 1))
        r["gg_t"][m] = s1("gross", m); r["gg_a"][m] = s2("gross", m) * shock[m]
        r["gg"][m] = r["gg_t"][m] + r["gg_a"][m]
        r["gn"][m] = s1("net", m) + s2("net", m) * shock[m]
        r["rev_t"][m] = s1("comm", m) + s1("book", m) + s1("bonus", m)
        r["rev_ai"][m] = s2("rev", m) * shock[m]
        r["rev"][m] = r["rev_t"][m] + r["rev_ai"][m]
        r["shr"][m] = s1("shr", m)
        cogs = (s1("shr", m) + s1("sal", m) + s1("crew", m) + s1("std", m)
                + s1("ads", m) + s2("ads", m) * shock[m] + s1("smp", m)
                + s1("build", m) + s2("build", m)
                + s2("lic", m) + s2("ops", m) + s2("oth", m))
        r["cogs"][m] = cogs
        r["gp"][m] = r["rev"][m] - cogs
        # nhan su tang cong ty
        bod = p["hc_bod"]
        bd = max(2, _ceil(r["act_t"][m] / p["ratio_bd"]))
        rec = max(1, _ceil(new_t[m] / p["ratio_rec"]))
        tech = 0 if m < p["ai_start"] - p["tech_lead"] else p["tech_base"] + _ceil(r["act_a"][m] / p["ratio_tech"])
        bo = max(p["bo_base"], _ceil((bod + bd + rec + tech) / p["ratio_bo"]))
        hc = bod + bd + rec + tech + bo
        r["hc"][m] = hc
        pay = (bod * p["sal_bod"] + bd * p["sal_bd"] + rec * p["sal_rec"]
               + tech * p["sal_tech"] + bo * p["sal_bo"]) * (1 + p["burden"])
        opex = pay + p["mkt_brand"] + p["tech_fixed"] + p["office"] + p["ga_fixed"] + r["rev"][m] * p["ga_pct"]
        r["opex"][m] = opex
        r["ebitda"][m] = r["gp"][m] - opex
        capex = (hc if m == 1 else max(0, hc - hc_prev)) * p["dev_capex"]
        hc_prev = hc
        r["capex"][m] = capex
        capex_cum += capex
        r["dep"][m] = capex_cum / p["depr_m"]
        r["ebit"][m] = r["ebitda"][m] - r["dep"][m]
        taxable = max(0.0, r["ebit"][m] - loss)
        r["tax"][m] = taxable * p["tax"]
        r["ni"][m] = r["ebit"][m] - r["tax"][m]
        loss = max(0.0, loss - r["ebit"][m])
        cum_ni += r["ni"][m]; r["cum_ni"][m] = cum_ni
    # dong tien
    w = [max(0, min(1, 1 - p["dso"] / 30))]
    w.append(max(0, min(1, 2 - p["dso"] / 30) - w[0])); w.append(1 - w[0] - w[1])
    v = [max(0, min(1, 1 - p["dpo"] / 30))]
    v.append(max(0, min(1, 2 - p["dpo"] / 30) - v[0])); v.append(1 - v[0] - v[1])
    for m in M:
        cin = sum(r["rev"][m - i] * w[i] for i in range(3) if m - i >= 1)
        cout = (sum(r["shr"][m - i] * v[i] for i in range(3) if m - i >= 1)
                + (r["cogs"][m] - r["shr"][m]) + r["opex"][m] + r["tax"][m] + r["capex"][m])
        r["cash_in"][m] = cin; r["cash_out"][m] = cout
        r["ops_cf"][m] = cin - cout
        cum_ops += r["ops_cf"][m]; r["cum_ops"][m] = cum_ops
        raise_ = (p["raise1"] if m == p["raise1_m"] else 0) + (p["raise2"] if m == p["raise2_m"] else 0)
        cash = (p["cash0"] if m == 1 else cash) + r["ops_cf"][m] + raise_
        r["cash_end"][m] = cash
    return r, p

def year(r, k, y):
    return sum(r[k][m] for m in range((y - 1) * 12 + 1, y * 12 + 1))

def kpis(r, p):
    eb = [m for m in range(1, N + 1) if r["ebitda"][m] > 0]
    cf = [m for m in range(1, N + 1) if r["ops_cf"][m] > 0]
    peak = -min(min(r["cum_ops"].values()), 0)
    return {
        "Doanh thu Nam 1": year(r, "rev", 1), "Doanh thu Nam 2": year(r, "rev", 2),
        "Doanh thu Nam 3": year(r, "rev", 3),
        "GMV gop Nam 3": year(r, "gg", 3),
        "Doanh thu tu IP AI — Nam 3": year(r, "rev_ai", 3),
        "Loi nhuan gop Nam 3": year(r, "gp", 3),
        "EBITDA Nam 1": year(r, "ebitda", 1), "EBITDA Nam 2": year(r, "ebitda", 2),
        "EBITDA Nam 3": year(r, "ebitda", 3),
        "Bien EBITDA Nam 3": year(r, "ebitda", 3) / year(r, "rev", 3) if year(r, "rev", 3) else 0,
        "Loi nhuan sau thue luy ke 3 nam": r["cum_ni"][N],
        "Thang EBITDA duong dau tien": eb[0] if eb else 0,
        "Thang dong tien duong dau tien": cf[0] if cf else 0,
        "Nhu cau von dinh diem": peak,
        "Tien cuoi ky thang 36": r["cash_end"][N],
        "So IP nguoi that hoat dong cuoi ky": r["act_t"][N],
        "So IP AI hoat dong cuoi ky": r["act_a"][N],
        "Tong nhan su tang cong ty cuoi ky": r["hc"][N],
    }

if __name__ == "__main__":
    for nm in ("Downside", "Base", "Upside"):
        r, p = run(nm)
        k = kpis(r, p)
        print(f"--- {nm} ---")
        for a, b in k.items():
            print(f"  {a:42} {b:>14,.1f}")

