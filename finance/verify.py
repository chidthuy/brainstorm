# -*- coding: utf-8 -*-
"""Doi chieu ket qua LibreOffice tinh lai tu workbook voi ban sao Python (engine.py).

Chay: python3 finance/verify.py   (can libreoffice)
"""
import os, sys, subprocess, shutil, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine
from params import N
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter as gl

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "Du_toan_tai_chinh_MCN_36T.xlsx")
mc = lambda m: gl(3 + m)
TOL = 0.02          # 2 phan nghin cua 1% — chi chap nhan sai so lam tron

def recalc(path):
    out = tempfile.mkdtemp()
    env = dict(os.environ, HOME=os.environ.get("HOME", "/tmp/lohome"))
    subprocess.run(["soffice", f"-env:UserInstallation=file://{out}/profile",
                    "--headless", "--norestore", "--convert-to", "xlsx",
                    "--outdir", out, path], check=True, capture_output=True, timeout=600, env=env)
    return os.path.join(out, os.path.basename(path))

def find_row(ws, label, col=2):
    for r in range(1, ws.max_row + 1):
        if str(ws.cell(r, col).value).strip() == label:
            return r
    raise KeyError(label)

def with_scenario(name):
    """Tao ban sao workbook voi kich ban khac roi de LibreOffice tinh lai."""
    tmp = tempfile.mkdtemp()
    dst = os.path.join(tmp, f"{name}.xlsx")
    wbw = load_workbook(SRC)
    wbw["Gia_dinh"]["B4"] = name
    wbw.save(dst)
    return dst

def main():
    checks = [
        ("Doanh_thu", "TỔNG GMV GỘP", "gg"),
        ("Doanh_thu", "TỔNG DOANH THU", "rev"),
        ("Doanh_thu", "Số IP người thật đang hoạt động", "act_t"),
        ("Doanh_thu", "Số IP AI đang hoạt động", "act_a"),
        ("PnL", "TỔNG GIÁ VỐN", "cogs"),
        ("PnL", "LỢI NHUẬN GỘP", "gp"),
        ("PnL", "TỔNG CHI PHÍ TẦNG CÔNG TY", "opex"),
        ("PnL", "EBITDA", "ebitda"),
        ("PnL", "EBIT (lợi nhuận trước thuế)", "ebit"),
        ("PnL", "Thuế TNDN", "tax"),
        ("PnL", "LỢI NHUẬN SAU THUẾ", "ni"),
        ("Chi_phi", "TỔNG NHÂN SỰ TẦNG CÔNG TY", "hc"),
        ("Dong_tien", "Thu tiền hoa hồng, booking & thưởng", "cash_in"),
        ("Dong_tien", "DÒNG TIỀN TỪ HOẠT ĐỘNG & ĐẦU TƯ", "ops_cf"),
        ("Dong_tien", "TIỀN CUỐI KỲ", "cash_end"),
    ]
    bad = 0
    for name in ("Downside", "Base", "Upside"):
        src = SRC if name == "Base" else with_scenario(name)
        calc = recalc(src)
        wb = load_workbook(calc, data_only=True)
        r_py, p = engine.run(name)
        print(f"\n=== KỊCH BẢN {name} ===")
        for sheet, label, key in checks:
            ws = wb[sheet]
            r = find_row(ws, label)
            worst, worst_m = 0.0, 0
            for m in range(1, N + 1):
                xl = ws[f"{mc(m)}{r}"].value
                if xl is None:
                    print(f"  ! {sheet}!{label} T{m}: ô rỗng"); bad += 1; continue
                py = r_py[key][m]
                rel = abs(float(xl) - py) / max(1.0, abs(py))
                if rel > worst: worst, worst_m = rel, m
            ok = worst <= TOL / 100
            if not ok: bad += 1
            print(f"  {'OK ' if ok else 'SAI'} {sheet:10} {label:46} lệch lớn nhất {worst*100:7.4f}% (T{worst_m})")
        if name == "Base":
            u, ua = wb["Don_vi_IP"], wb["Don_vi_IP_AI"]
            print(f"  --  đối chiếu tài liệu gốc: lãi gộp 1 IP thật ổn định {u['U17'].value:.1f} (goc 57.2), "
                  f"1 IP AI {ua['P17'].value:.1f} (goc 32.8)")
        shutil.rmtree(os.path.dirname(calc), ignore_errors=True)
        if src != SRC: shutil.rmtree(os.path.dirname(src), ignore_errors=True)
    print("\n" + ("TẤT CẢ KHỚP TRÊN CẢ BA KỊCH BẢN." if bad == 0 else f"CÓ {bad} DÒNG LỆCH."))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
