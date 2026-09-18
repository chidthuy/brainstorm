#!/usr/bin/env python3
"""Tai lap moi con so trong docs/mcn/gia-dinh-don-vi-ip.md.

Chay: python3 docs/mcn/scripts/unit_economics.py
Don vi tien: trieu VND. Sua cac gia dinh trong SCENARIOS roi chay lai.
"""

# --- Gia dinh IP nguoi that -------------------------------------------------
# (gmv_moi_phien, so_phien, luong_cung, e_kip, studio, ads_%_gmv_rong, khac, so_thang)
LIFECYCLE = [
    ("Uom (T1-T3)",              10, 12, 12, 27, 6, 0.08, 3, 3),
    ("Tang truong som (T4-T6)",  25, 16, 15, 27, 6, 0.05, 3, 3),
    ("Tang truong (T7-T9)",      40, 18, 15, 27, 6, 0.04, 3, 3),
    ("On dinh (T10+)",           60, 20, 15, 27, 6, 0.03, 3, None),
]

SCENARIOS = {
    # ten:        (gmv/phien on dinh, huy_hoan, hoa_hong, chia_talent, chi_phi_dung)
    "Downside": (30, 0.25, 0.15, 0.30, 80),
    "Base":     (60, 0.18, 0.20, 0.30, 60),
    "Upside":  (110, 0.13, 0.24, 0.28, 55),
}

# --- Gia dinh IP AI ---------------------------------------------------------
AI_SCENARIOS = {
    # ten:        (gmv/gio, gio/ngay, ngay/thang, huy_hoan, hoa_hong, license, van_hanh, ads%, khac, chi_phi_dung)
    "Downside": (0.8, 10, 26, 0.25, 0.18,  6, 10, 0.05, 2, 30),
    "Base":     (1.5, 12, 26, 0.22, 0.20,  8, 12, 0.05, 2, 30),
    "Upside":   (2.5, 14, 26, 0.20, 0.22, 10, 14, 0.04, 2, 30),
}


def thang_ip_nguoi_that(gmv_phien, so_phien, luong, ekip, studio, ads_pct, khac,
                        huy_hoan, hoa_hong, chia_talent):
    gross = gmv_phien * so_phien
    net = gross * (1 - huy_hoan)
    doanh_thu = net * hoa_hong
    chi_phi = (doanh_thu * chia_talent + luong + ekip + studio
               + net * ads_pct + khac)
    return dict(gross=gross, net=net, doanh_thu=doanh_thu,
                chi_phi=chi_phi, lai_gop=doanh_thu - chi_phi)


def chay_kich_ban(ten, gmv_on_dinh, huy_hoan, hoa_hong, chia_talent, chi_phi_dung,
                  in_bang=False):
    he_so = gmv_on_dinh / 60.0
    luy_ke = -chi_phi_dung
    dinh_von = luy_ke
    thang = 0
    hoa_von = None
    lai_on_dinh = None
    if in_bang:
        print(f"{'Giai doan':26}{'GMV gop':>9}{'GMV rong':>10}{'Doanh thu':>11}"
              f"{'Chi phi':>10}{'Lai gop':>9}{'Luy ke':>10}")
        print(f"{'Thang 0 (dung IP)':26}{'-':>9}{'-':>10}{'-':>11}"
              f"{chi_phi_dung:>10.1f}{-chi_phi_dung:>9.1f}{luy_ke:>10.1f}")
    for ten_gd, gmv, so_phien, luong, ekip, studio, ads, khac, n in LIFECYCLE:
        p = thang_ip_nguoi_that(gmv * he_so, so_phien, luong, ekip, studio, ads,
                                khac, huy_hoan, hoa_hong, chia_talent)
        if n is None:
            lai_on_dinh = p["lai_gop"]
            if in_bang:
                print(f"{ten_gd:26}{p['gross']:>9.0f}{p['net']:>10.0f}"
                      f"{p['doanh_thu']:>11.1f}{p['chi_phi']:>10.1f}"
                      f"{p['lai_gop']:>9.1f}{'':>10}")
            while luy_ke < 0 and thang < 60:
                thang += 1
                luy_ke += lai_on_dinh
                if luy_ke >= 0:
                    hoa_von = thang
            break
        for _ in range(n):
            thang += 1
            luy_ke += p["lai_gop"]
            dinh_von = min(dinh_von, luy_ke)
            if luy_ke >= 0 and hoa_von is None:
                hoa_von = thang
        if in_bang:
            print(f"{ten_gd:26}{p['gross']:>9.0f}{p['net']:>10.0f}"
                  f"{p['doanh_thu']:>11.1f}{p['chi_phi']:>10.1f}"
                  f"{p['lai_gop']:>9.1f}{luy_ke:>10.1f}")
    return lai_on_dinh, dinh_von, hoa_von


def chay_ip_ai(gmv_gio, gio_ngay, ngay, huy_hoan, hoa_hong, license_, van_hanh,
               ads_pct, khac, chi_phi_dung):
    gross = gmv_gio * gio_ngay * ngay
    net = gross * (1 - huy_hoan)
    doanh_thu = net * hoa_hong
    chi_phi = license_ + van_hanh + net * ads_pct + khac
    lai_gop = doanh_thu - chi_phi
    hoan_von = chi_phi_dung / lai_gop if lai_gop > 0 else None
    return gross, net, doanh_thu, chi_phi, lai_gop, hoan_von


if __name__ == "__main__":
    print("=== IP NGUOI THAT - kich ban Base (chi tiet) ===")
    chay_kich_ban("Base", *SCENARIOS["Base"], in_bang=True)

    print("\n=== IP NGUOI THAT - so sanh kich ban ===")
    for ten, gd in SCENARIOS.items():
        lai, dinh, hv = chay_kich_ban(ten, *gd)
        hv_txt = f"thang {hv}" if hv else "khong hoa von"
        print(f"{ten:10} lai gop on dinh {lai:8.1f} tr/thang | "
              f"dinh von {dinh:8.1f} tr | hoa von {hv_txt}")

    print("\n=== IP AI ===")
    for ten, gd in AI_SCENARIOS.items():
        gross, net, dt, cp, lai, hv = chay_ip_ai(*gd)
        bien = 100 * lai / dt if dt else 0
        hv_txt = f"{hv:.1f} thang sau ramp" if hv else "khong hoan von"
        print(f"{ten:10} GMV gop {gross:7.0f} | rong {net:7.0f} | "
              f"doanh thu {dt:6.1f} | lai gop {lai:6.1f} ({bien:.0f}% DT) | "
              f"hoan von chi phi dung {hv_txt}")

    print("\n=== Cohort 10 IP nguoi that (Base) ===")
    p_uom = thang_ip_nguoi_that(10, 12, 12, 27, 6, 0.08, 3, 0.18, 0.20, 0.30)
    for gate in (2, 3):
        chim = 60 + abs(p_uom["lai_gop"]) * gate
        print(f"Gate thang {gate}: chi phi chim 1 IP that bai {chim:.0f} tr | "
              f"10 IP tuyen, 30% rot -> chon {10 * 0.3 * chim:.0f} tr "
              f"(+{10 * 0.3 * chim / 7:.0f} tr moi IP thanh cong)")
