# -*- coding: utf-8 -*-
"""Sinh ban du toan tai chinh MCN 36 thang (cong thuc song trong Excel).

Chay: python3 finance/build_model.py
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from params import SECTIONS, PARAMS, SCEN_NAMES, N
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as gl
from openpyxl.worksheet.datavalidation import DataValidation

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "Du_toan_tai_chinh_MCN_36T.xlsx")
MAXAGE = N  # tuoi IP 0..36

F_TITLE = Font(bold=True, size=14, color="1F3864")
F_H = Font(bold=True, color="FFFFFF")
F_S = Font(bold=True, color="1F3864")
F_B = Font(bold=True)
FI_H = PatternFill("solid", fgColor="1F3864")
FI_S = PatternFill("solid", fgColor="D9E2F3")
FI_T = PatternFill("solid", fgColor="FFF2CC")
FI_K = PatternFill("solid", fgColor="E2EFDA")
FI_IN = PatternFill("solid", fgColor="FFF9C4")
THIN = Side(style="thin", color="BFBFBF")
BOX = Border(THIN, THIN, THIN, THIN)
NUM, NUM1, PCT, INT = '#,##0', '#,##0.0', '0.0%', '#,##0'

def mc(m): return gl(3 + m)          # thang m -> cot D..AM

wb = Workbook(); wb.remove(wb.active)

# ============================================================ 1. GIA_DINH
gd = wb.create_sheet("Gia_dinh")
for col, w in zip("ABCDEFG", (54, 15, 12, 12, 12, 15, 92)):
    gd.column_dimensions[col].width = w
gd["A1"] = "MÔ HÌNH TÀI CHÍNH MCN — BẢNG GIẢ ĐỊNH"; gd["A1"].font = F_TITLE
gd["A2"] = "Mọi ô màu vàng là ô nhập liệu. Đổi kịch bản ở B4, toàn bộ mô hình tự tính lại."
gd["A3"] = "Đơn vị tiền tệ"; gd["B3"] = "triệu VND"; gd["A3"].font = F_B
gd["A4"] = "KỊCH BẢN ĐANG CHẠY"; gd["A4"].font = F_S
gd["B4"] = "Base"; gd["B4"].font = Font(bold=True, size=12); gd["B4"].fill = FI_IN; gd["B4"].border = BOX
gd["C4"] = "<- chọn Downside / Base / Upside"
gd["A5"] = "Tháng bắt đầu dự báo"; gd["B5"] = datetime.date(2027, 1, 1)
gd["B5"].number_format = "mm/yyyy"; gd["B5"].fill = FI_IN; gd["B5"].border = BOX
gd["A6"] = "Chỉ số kịch bản"; gd["B6"] = '=MATCH($B$4,$C$8:$E$8,0)'
dv = DataValidation(type="list", formula1='"Downside,Base,Upside"'); gd.add_data_validation(dv); dv.add(gd["B4"])
START, SIDX = "Gia_dinh!$B$5", "Gia_dinh!$B$6"

for i, h in enumerate(["Tham số", "Đơn vị", "Downside", "Base", "Upside", "ĐANG ÁP DỤNG", "Căn cứ / nguồn"]):
    c = gd.cell(8, 1 + i, h); c.font = F_H; c.fill = FI_H
A, r = {}, 9
for sect, items in SECTIONS:
    c = gd.cell(r, 1, sect); c.font = F_S
    for col in range(1, 8): gd.cell(r, col).fill = FI_S
    r += 1
    for key, lab, unit, d, b, u, note in items:
        gd.cell(r, 1, lab); gd.cell(r, 2, unit); gd.cell(r, 7, note)
        fmt = PCT if unit.startswith("%") or unit.endswith("%") else NUM1
        for j, v in enumerate((d, b, u)):
            cc = gd.cell(r, 3 + j, v); cc.number_format = fmt; cc.fill = FI_IN; cc.border = BOX
        cc = gd.cell(r, 6, f"=INDEX($C{r}:$E{r},1,$B$6)")
        cc.number_format = fmt; cc.font = F_B; cc.fill = FI_T; cc.border = BOX
        A[key] = f"Gia_dinh!$F${r}"
        r += 1
    r += 1

gd.cell(r, 1, "THAM SỐ DẪN XUẤT (tự động tính)").font = F_S
for col in range(1, 8): gd.cell(r, col).fill = FI_S
r += 1
derived = [
 ("attr_m", "Tỷ lệ IP người thật rời bỏ / tháng", "%/thang", f"=1-(1-{A['attr_y']})^(1/12)", PCT),
 ("ai_attr_m", "Tỷ lệ IP AI ngừng hoạt động / tháng", "%/thang", f"=1-(1-{A['ai_attr_y']})^(1/12)", PCT),
 ("w0", "Thu tiền trong tháng phát sinh", "% doanh thu", f"=MAX(0,MIN(1,1-{A['dso']}/30))", '0.00'),
 ("w1", "Thu tiền tháng kế tiếp", "% doanh thu", None, '0.00'),
 ("w2", "Thu tiền sau 2 tháng", "% doanh thu", None, '0.00'),
 ("v0", "Trả talent trong tháng", "% chia sẻ", f"=MAX(0,MIN(1,1-{A['dpo']}/30))", '0.00'),
 ("v1", "Trả talent tháng kế tiếp", "% chia sẻ", None, '0.00'),
 ("v2", "Trả talent sau 2 tháng", "% chia sẻ", None, '0.00'),
]
for key, lab, unit, f, fmt in derived:
    gd.cell(r, 1, lab); gd.cell(r, 2, unit)
    if f is None:
        base = A['dso'] if key.startswith("w") else A['dpo']
        f = (f"=MAX(0,MIN(1,2-{base}/30)-$F${r-1})" if key in ("w1", "v1")
             else f"=1-$F${r-2}-$F${r-1}")
    cc = gd.cell(r, 6, f); cc.number_format = fmt; cc.font = F_B; cc.fill = FI_T
    A[key] = f"Gia_dinh!$F${r}"
    r += 1
gd.freeze_panes = "C9"

# ======================================================= 2. DON_VI_IP (that)
u1 = wb.create_sheet("Don_vi_IP")
u1["A1"] = "UNIT ECONOMICS — MỘT IP NGƯỜI THẬT THEO TUỔI (triệu VND)"; u1["A1"].font = F_TITLE
u1["A2"] = "Tuổi 0 = tháng casting/dựng IP. Mỗi dòng dưới đây là kết quả của MỘT IP sống sót đến tuổi đó."
COLS1 = ["Tuổi (tháng)", "Giai đoạn", "Tỷ lệ sống sót", "GMV/phiên", "Số phiên", "GMV gộp", "GMV ròng",
         "Hoa hồng affiliate", "Phí booking", "Thưởng target", "DOANH THU MCN", "Chia hoa hồng talent",
         "Lương cứng talent", "Ê-kíp", "Studio", "Quảng cáo kéo view", "Mẫu SP & khác",
         "Chi phí dựng IP", "TỔNG CHI PHÍ TRỰC TIẾP", "LÃI GỘP", "Lãi gộp luỹ kế / IP"]
UH = 4
for i, h in enumerate(COLS1):
    c = u1.cell(UH, 2 + i, h); c.font = F_H; c.fill = FI_H
    c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    u1.column_dimensions[gl(2 + i)].width = 13
u1.column_dimensions["B"].width = 11; u1.column_dimensions["C"].width = 20
U1 = {name: gl(2 + i) for i, name in enumerate(
    ["age", "stage", "surv", "gmvs", "ses", "gross", "net", "comm", "book", "bonus", "rev",
     "shr", "sal", "crew", "std", "ads", "smp", "build", "cost", "gp", "cum"])}
R1 = UH + 1                                   # tuoi 0 o hang R1
for a in range(0, MAXAGE + 1):
    r = R1 + a
    u1[f"{U1['age']}{r}"] = a
    u1[f"{U1['stage']}{r}"] = ("Dựng IP" if a == 0 else "Ươm" if a <= 3 else
                               "Tăng trưởng sớm" if a <= 6 else "Tăng trưởng" if a <= 9 else "Ổn định")
    u1[f"{U1['surv']}{r}"] = (1 if a == 0 else
        f"=IF({a}>{A['gate1_m']},1-{A['gate1_drop']},1)*IF({a}>{A['gate2_m']},1-{A['gate2_drop']},1)"
        f"*(1-{A['attr_m']})^MAX(0,{a}-9)")
    z = lambda s1, s2, s3, s4: f"IF({a}=0,0,IF({a}<=3,{s1},IF({a}<=6,{s2},IF({a}<=9,{s3},{s4}))))"
    u1[f"{U1['gmvs']}{r}"] = "=" + z(A['gmv_s1'], A['gmv_s2'], A['gmv_s3'], A['gmv_s4'])
    u1[f"{U1['ses']}{r}"] = "=" + z(A['ses_s1'], A['ses_s2'], A['ses_s3'], A['ses_s4'])
    u1[f"{U1['gross']}{r}"] = f"={U1['gmvs']}{r}*{U1['ses']}{r}"
    u1[f"{U1['net']}{r}"] = f"={U1['gross']}{r}*(1-{A['ret']})"
    u1[f"{U1['comm']}{r}"] = f"={U1['net']}{r}*{A['comm']}"
    u1[f"{U1['book']}{r}"] = f"=IF({a}>={A['book_from']},{A['book_fee']}*{U1['ses']}{r},0)"
    u1[f"{U1['bonus']}{r}"] = f"={U1['net']}{r}*{A['bonus']}"
    u1[f"{U1['rev']}{r}"] = f"=SUM({U1['comm']}{r}:{U1['bonus']}{r})"
    u1[f"{U1['shr']}{r}"] = f"={U1['rev']}{r}*{A['share_tal']}"
    u1[f"{U1['sal']}{r}"] = f"=IF({a}=0,0,IF({a}<=3,{A['sal_inc']},{A['sal_st']}))"
    u1[f"{U1['crew']}{r}"] = f"=IF({a}=0,0,{A['crew']})"
    u1[f"{U1['std']}{r}"] = f"=IF({a}=0,0,{A['studio']})"
    u1[f"{U1['ads']}{r}"] = f"={U1['net']}{r}*" + z(A['ads_s1'], A['ads_s2'], A['ads_s3'], A['ads_s4'])
    u1[f"{U1['smp']}{r}"] = f"=IF({a}=0,0,{A['sample']})"
    u1[f"{U1['build']}{r}"] = f"=IF({a}=0,{A['build_that']},0)"
    u1[f"{U1['cost']}{r}"] = f"=SUM({U1['shr']}{r}:{U1['build']}{r})"
    u1[f"{U1['gp']}{r}"] = f"={U1['rev']}{r}-{U1['cost']}{r}"
    u1[f"{U1['cum']}{r}"] = (f"={U1['gp']}{r}" if a == 0 else f"={U1['cum']}{r-1}+{U1['gp']}{r}")
    for k in ("surv",): u1[f"{U1[k]}{r}"].number_format = PCT
    for k in ("gmvs", "ses", "gross", "net", "comm", "book", "bonus", "rev", "shr", "sal",
              "crew", "std", "ads", "smp", "build", "cost", "gp", "cum"):
        u1[f"{U1[k]}{r}"].number_format = NUM1
    if a in (0, 3, 6, 9):
        for k in U1.values(): u1[f"{k}{r}"].fill = FI_S
R1_END = R1 + MAXAGE
sr = R1_END + 2
u1.cell(sr, 2, "KẾT QUẢ MỘT IP (kịch bản đang chạy)").font = F_TITLE
kpi1 = [
 ("Lãi gộp/tháng khi ổn định (tuổi 12)", f"={U1['gp']}{R1+12}", NUM1),
 ("Biên lãi gộp trên doanh thu MCN (ổn định)", f"={U1['gp']}{R1+12}/{U1['rev']}{R1+12}", PCT),
 ("Biên lãi gộp trên GMV ròng (ổn định)", f"={U1['gp']}{R1+12}/{U1['net']}{R1+12}", PCT),
 ("Đỉnh vốn phải bỏ ra cho 1 IP", f"=MIN({U1['cum']}{R1}:{U1['cum']}{R1_END})", NUM1),
 ("Tháng hoà vốn luỹ kế của 1 IP",
  f'=IF(COUNTIF({U1["cum"]}{R1}:{U1["cum"]}{R1_END},"<0")>{MAXAGE},"Không hoà vốn trong 36 tháng",'
  f'COUNTIF({U1["cum"]}{R1}:{U1["cum"]}{R1_END},"<0"))', NUM),
 ("Chi phí chìm của 1 IP bị loại tại cửa sàng lọc 1",
  f"=-({U1['cum']}{R1}+SUMPRODUCT(({U1['age']}{R1}:{U1['age']}{R1_END}>=1)*"
  f"({U1['age']}{R1}:{U1['age']}{R1_END}<={A['gate1_m']})*{U1['gp']}{R1}:{U1['gp']}{R1_END}))", NUM1),
]
for i, (lab, f, fmt) in enumerate(kpi1):
    u1.cell(sr + 1 + i, 2, lab)
    c = u1.cell(sr + 1 + i, 6, f); c.number_format = fmt; c.font = F_B; c.fill = FI_K
u1.freeze_panes = f"D{UH+1}"

# ======================================================= 3. DON_VI_IP_AI
u2 = wb.create_sheet("Don_vi_IP_AI")
u2["A1"] = "UNIT ECONOMICS — MỘT IP AI THEO TUỔI (triệu VND)"; u2["A1"].font = F_TITLE
u2["A2"] = "Tuổi 0 = tháng dựng nhân vật. Bán được từ tuổi > số tháng ramp."
COLS2 = ["Tuổi (tháng)", "Giai đoạn", "Tỷ lệ sống sót", "GMV/giờ", "Số giờ/tháng", "GMV gộp", "GMV ròng",
         "DOANH THU MCN", "License & compute", "Vận hành & trực chat", "Quảng cáo kéo view",
         "Chi phí khác", "Chi phí dựng IP AI", "TỔNG CHI PHÍ TRỰC TIẾP", "LÃI GỘP", "Lãi gộp luỹ kế / IP"]
for i, h in enumerate(COLS2):
    c = u2.cell(UH, 2 + i, h); c.font = F_H; c.fill = FI_H
    c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    u2.column_dimensions[gl(2 + i)].width = 14
u2.column_dimensions["C"].width = 18
U2 = {n: gl(2 + i) for i, n in enumerate(
    ["age", "stage", "surv", "gmvh", "hrs", "gross", "net", "rev", "lic", "ops", "ads", "oth",
     "build", "cost", "gp", "cum"])}
R2 = UH + 1
for a in range(0, MAXAGE + 1):
    r = R2 + a
    u2[f"{U2['age']}{r}"] = a
    u2[f"{U2['stage']}{r}"] = f'=IF({a}=0,"Dựng IP AI",IF({a}<={A["ai_ramp"]},"Ramp","Bán hàng"))'
    u2[f"{U2['surv']}{r}"] = (1 if a == 0 else f"=(1-{A['ai_attr_m']})^MAX(0,{a}-{A['ai_ramp']}-1)")
    u2[f"{U2['gmvh']}{r}"] = f"=IF({a}<={A['ai_ramp']},0,{A['ai_gmv_h']})"
    u2[f"{U2['hrs']}{r}"] = f"=IF({a}<={A['ai_ramp']},0,{A['ai_hours']}*{A['ai_days']})"
    u2[f"{U2['gross']}{r}"] = f"={U2['gmvh']}{r}*{U2['hrs']}{r}"
    u2[f"{U2['net']}{r}"] = f"={U2['gross']}{r}*(1-{A['ai_ret']})"
    u2[f"{U2['rev']}{r}"] = f"={U2['net']}{r}*{A['ai_comm']}"
    u2[f"{U2['lic']}{r}"] = f"=IF({a}=0,0,{A['ai_lic']})"
    u2[f"{U2['ops']}{r}"] = f"=IF({a}=0,0,{A['ai_ops']})"
    u2[f"{U2['ads']}{r}"] = f"={U2['net']}{r}*{A['ai_ads']}"
    u2[f"{U2['oth']}{r}"] = f"=IF({a}=0,0,{A['ai_other']})"
    u2[f"{U2['build']}{r}"] = f"=IF({a}=0,{A['ai_build']},0)"
    u2[f"{U2['cost']}{r}"] = f"=SUM({U2['lic']}{r}:{U2['build']}{r})"
    u2[f"{U2['gp']}{r}"] = f"={U2['rev']}{r}-{U2['cost']}{r}"
    u2[f"{U2['cum']}{r}"] = (f"={U2['gp']}{r}" if a == 0 else f"={U2['cum']}{r-1}+{U2['gp']}{r}")
    u2[f"{U2['surv']}{r}"].number_format = PCT
    for k in ("gmvh", "hrs", "gross", "net", "rev", "lic", "ops", "ads", "oth", "build", "cost", "gp", "cum"):
        u2[f"{U2[k]}{r}"].number_format = NUM1
R2_END = R2 + MAXAGE
sr2 = R2_END + 2
u2.cell(sr2, 2, "KẾT QUẢ MỘT IP AI (kịch bản đang chạy)").font = F_TITLE
for i, (lab, f, fmt) in enumerate([
    ("Lãi gộp/tháng khi ổn định (tuổi 12)", f"={U2['gp']}{R2+12}", NUM1),
    ("Biên lãi gộp trên doanh thu MCN", f"={U2['gp']}{R2+12}/{U2['rev']}{R2+12}", PCT),
    ("Đỉnh vốn phải bỏ ra cho 1 IP AI", f"=MIN({U2['cum']}{R2}:{U2['cum']}{R2_END})", NUM1),
    ("Tháng hoà vốn luỹ kế của 1 IP AI",
     f'=IF(COUNTIF({U2["cum"]}{R2}:{U2["cum"]}{R2_END},"<0")>{MAXAGE},"Không hoà vốn trong 36 tháng",'
     f'COUNTIF({U2["cum"]}{R2}:{U2["cum"]}{R2_END},"<0"))', NUM)]):
    u2.cell(sr2 + 1 + i, 2, lab)
    c = u2.cell(sr2 + 1 + i, 6, f); c.number_format = fmt; c.font = F_B; c.fill = FI_K
u2.freeze_panes = f"D{UH+1}"

# ------------------------------------------------------------ helpers theo thang
def ts_header(ws, title, sub=""):
    ws["A1"] = title; ws["A1"].font = F_TITLE
    if sub: ws["A2"] = sub
    for r, lab in ((3, "Thang"), (4, "Ky"), (5, "Nam")):
        c = ws.cell(r, 2, lab); c.font = F_H; c.fill = FI_H
        ws.cell(r, 1).fill = FI_H; ws.cell(r, 3).fill = FI_H
    ws.cell(3, 3, "Đơn vị").font = F_H
    for m in range(1, N + 1):
        for r, v, fmt in ((3, m, INT), (4, f"=EDATE({START},{m}-1)", "mm/yyyy"), (5, f"Nam {(m-1)//12+1}", None)):
            c = ws.cell(r, 3 + m, v); c.font = F_H; c.fill = FI_H
            c.alignment = Alignment(horizontal="center")
            if fmt: c.number_format = fmt
        ws.column_dimensions[mc(m)].width = 12
    ws.freeze_panes = "D6"
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 48
    ws.column_dimensions["C"].width = 14

class Rows:
    def __init__(self, ws, start=5): self.ws, self.r = ws, start
    def section(self, lab):
        self.r += 1
        self.ws.cell(self.r, 2, lab).font = F_S
        for c in range(2, 4 + N): self.ws.cell(self.r, c).fill = FI_S
        return self.r
    def blank(self): self.r += 1; return self.r
    def row(self, lab, unit, fn, fmt=NUM, total=False, kpi=False):
        self.r += 1; r = self.r
        self.ws.cell(r, 2, lab); self.ws.cell(r, 3, unit)
        if total: self.ws.cell(r, 2).font = F_B
        for m in range(1, N + 1):
            c = self.ws.cell(r, 3 + m, fn(m)); c.number_format = fmt
            if total: c.font = F_B; c.fill = FI_T
            elif kpi: c.fill = FI_K
        return r

# ============================================================ 4. DOI_HINH
dh = wb.create_sheet("Doi_hinh")
ts_header(dh, "ĐỘI HÌNH IP THEO THÁNG (mô hình cohort)",
          "Số IP ở mỗi tuổi = số IP ký mới của tháng tương ứng × tỷ lệ sống sót của tuổi đó.")
R = Rows(dh, 5)
R.section("KẾ HOẠCH KÝ MỚI")
r_new_t = R.row("IP người thật ký mới trong tháng", "IP",
                lambda m: f"=IF({m}<=6,{A['hire1']},IF({m}<=18,{A['hire2']},{A['hire3']}))", INT)
r_new_a = R.row("IP AI ra mắt trong tháng", "IP",
                lambda m: f"=IF({m}<{A['ai_start']},0,IF({m}<{A['ai_start']}+12,{A['ai_hire1']},{A['ai_hire2']}))", INT)
R.blank()
R.section("A. SỐ IP NGƯỜI THẬT THEO TUỔI (hàng = tuổi, cột = tháng)")
GA = R.r + 2
dh.cell(GA - 1, 2, "Tuổi (tháng)").font = F_H; dh.cell(GA - 1, 2).fill = FI_H
dh.cell(GA - 1, 3, "Tỷ lệ sống sót").font = F_H; dh.cell(GA - 1, 3).fill = FI_H
for a in range(0, MAXAGE + 1):
    r = GA + a
    dh.cell(r, 2, a)
    dh.cell(r, 3, f"=Don_vi_IP!{U1['surv']}{R1+a}").number_format = PCT
    for m in range(1, N + 1):
        if m - a < 1: continue
        dh.cell(r, 3 + m, f"={mc(m-a)}{r_new_t}*$C{r}").number_format = NUM1
GA_END = GA + MAXAGE
R.r = GA_END
r_build_t = R.row("IP người thật đang dựng (tuổi 0)", "IP", lambda m: f"={mc(m)}{GA}", NUM1)
r_act_t = R.row("TỔNG IP NGƯỜI THẬT ĐANG HOẠT ĐỘNG", "IP",
                lambda m: f"=SUM({mc(m)}{GA+1}:{mc(m)}{GA_END})", NUM1, total=True)
for lab, lo, hi in (("— giai đoạn ươm (tuổi 1-3)", 1, 3), ("— tăng trưởng sớm (tuổi 4-6)", 4, 6),
                    ("— tăng trưởng (tuổi 7-9)", 7, 9), ("— ổn định (tuổi 10+)", 10, MAXAGE)):
    R.row(lab, "IP", lambda m, lo=lo, hi=hi: f"=SUM({mc(m)}{GA+lo}:{mc(m)}{GA+hi})", NUM1)
r_cum_sign = R.row("Luỹ kế IP người thật đã ký", "IP",
                   lambda m: f"=SUM($D${r_new_t}:{mc(m)}{r_new_t})", NUM1)
r_cut = R.row("Luỹ kế IP người thật đã bị loại/rời bỏ", "IP",
              lambda m: f"={mc(m)}{r_cum_sign}-{mc(m)}{r_build_t}-{mc(m)}{r_act_t}", NUM1)
R.blank()
R.section("B. SỐ IP AI THEO TUỔI")
GB = R.r + 2
dh.cell(GB - 1, 2, "Tuổi (tháng)").font = F_H; dh.cell(GB - 1, 2).fill = FI_H
dh.cell(GB - 1, 3, "Tỷ lệ sống sót").font = F_H; dh.cell(GB - 1, 3).fill = FI_H
for a in range(0, MAXAGE + 1):
    r = GB + a
    dh.cell(r, 2, a)
    dh.cell(r, 3, f"=Don_vi_IP_AI!{U2['surv']}{R2+a}").number_format = PCT
    for m in range(1, N + 1):
        if m - a < 1: continue
        dh.cell(r, 3 + m, f"={mc(m-a)}{r_new_a}*$C{r}").number_format = NUM1
GB_END = GB + MAXAGE
R.r = GB_END
r_act_a = R.row("TỔNG IP AI ĐANG HOẠT ĐỘNG", "IP",
                lambda m: f"=SUM({mc(m)}{GB+1}:{mc(m)}{GB_END})", NUM1, total=True)

def AGG1(col, m):
    return (f"SUMPRODUCT(Doi_hinh!{mc(m)}${GA}:{mc(m)}${GA_END},"
            f"Don_vi_IP!${U1[col]}${R1}:${U1[col]}${R1_END})")
def AGG2(col, m):
    return (f"SUMPRODUCT(Doi_hinh!{mc(m)}${GB}:{mc(m)}${GB_END},"
            f"Don_vi_IP_AI!${U2[col]}${R2}:${U2[col]}${R2_END})")

# ============================================================ 5. DOANH_THU
dt = wb.create_sheet("Doanh_thu")
ts_header(dt, "DOANH THU THEO TỪNG DÒNG (triệu VND)",
          "Doanh thu MCN = hoa hồng nhãn hàng trả, GHI NHẬN TRƯỚC khi chia cho talent. "
          "Phí nền tảng TikTok Shop do người bán chịu, không nằm trong bảng này.")
R = Rows(dt, 5)
R.section("KIỂM ĐỊNH RỦI RO")
r_shock = R.row("Hệ số còn lại của GMV tầng AI (cú sốc nền tảng)", "hệ số",
                lambda m: f"=IF(AND({m}>={A['shock_from']},{m}<{A['shock_from']}+{A['shock_len']}),1-{A['shock_pct']},1)",
                '0.00', kpi=True)
R.blank()
R.section("ĐỘI HÌNH")
d_act_t = R.row("Số IP người thật đang hoạt động", "IP", lambda m: f"=Doi_hinh!{mc(m)}{r_act_t}", NUM1)
d_act_a = R.row("Số IP AI đang hoạt động", "IP", lambda m: f"=Doi_hinh!{mc(m)}{r_act_a}", NUM1)
d_new_t = R.row("Số IP người thật ký mới", "IP", lambda m: f"=Doi_hinh!{mc(m)}{r_new_t}", INT)
d_new_a = R.row("Số IP AI ra mắt", "IP", lambda m: f"=Doi_hinh!{mc(m)}{r_new_a}", INT)
R.blank()
R.section("GMV")
d_gg_t = R.row("GMV gộp — IP người thật", "triệu VND", lambda m: "=" + AGG1("gross", m))
d_gg_a = R.row("GMV gộp — IP AI", "triệu VND", lambda m: "=" + AGG2("gross", m) + f"*{mc(m)}{r_shock}")
d_gg = R.row("TỔNG GMV GỘP", "triệu VND", lambda m: f"={mc(m)}{d_gg_t}+{mc(m)}{d_gg_a}", total=True)
d_gn_t = R.row("GMV ròng — IP người thật", "triệu VND", lambda m: "=" + AGG1("net", m))
d_gn_a = R.row("GMV ròng — IP AI", "triệu VND", lambda m: "=" + AGG2("net", m) + f"*{mc(m)}{r_shock}")
d_gn = R.row("TỔNG GMV RÒNG (sau huỷ & hoàn hàng)", "triệu VND",
             lambda m: f"={mc(m)}{d_gn_t}+{mc(m)}{d_gn_a}", total=True)
R.blank()
R.section("DOANH THU MCN")
d_r1 = R.row("Hoa hồng affiliate — IP người thật", "triệu VND", lambda m: "=" + AGG1("comm", m))
d_r2 = R.row("Phí booking cố định", "triệu VND", lambda m: "=" + AGG1("book", m))
d_r3 = R.row("Thưởng đạt target", "triệu VND", lambda m: "=" + AGG1("bonus", m))
d_rt = R.row("Doanh thu từ IP người thật", "triệu VND",
             lambda m: f"=SUM({mc(m)}{d_r1}:{mc(m)}{d_r3})", total=True)
d_r4 = R.row("Hoa hồng affiliate — IP AI", "triệu VND", lambda m: "=" + AGG2("rev", m) + f"*{mc(m)}{r_shock}")
d_rev = R.row("TỔNG DOANH THU", "triệu VND", lambda m: f"={mc(m)}{d_rt}+{mc(m)}{d_r4}", total=True)
R.blank()
d_mix = R.row("Tỷ trọng doanh thu từ tầng IP AI", "%",
              lambda m: f"=IFERROR({mc(m)}{d_r4}/{mc(m)}{d_rev},0)", PCT, kpi=True)
d_take = R.row("Take rate hiệu dụng (doanh thu / GMV gộp)", "%",
               lambda m: f"=IFERROR({mc(m)}{d_rev}/{mc(m)}{d_gg},0)", PCT, kpi=True)
d_arpu = R.row("Doanh thu bình quân / IP người thật đang hoạt động", "triệu VND",
               lambda m: f"=IFERROR({mc(m)}{d_rt}/{mc(m)}{d_act_t},0)", NUM1, kpi=True)

# ============================================================ 6. CHI_PHI
cp = wb.create_sheet("Chi_phi")
ts_header(cp, "CHI PHÍ THEO THÁNG (triệu VND)",
          "Chi phí trực tiếp lấy từ unit economics nhân với đội hình IP. "
          "Chi phí tầng công ty là giả định riêng của bản dự toán này.")
R = Rows(cp, 5)
R.section("1. CHI PHÍ TRỰC TIẾP — IP NGƯỜI THẬT")
c_shr = R.row("Chia hoa hồng cho talent", "triệu VND", lambda m: "=" + AGG1("shr", m))
c_sal = R.row("Lương cứng talent", "triệu VND", lambda m: "=" + AGG1("sal", m))
c_crew = R.row("Ê-kíp nội dung & ê-kíp live", "triệu VND", lambda m: "=" + AGG1("crew", m))
c_std = R.row("Studio, thiết bị, phần mềm", "triệu VND", lambda m: "=" + AGG1("std", m))
c_ads = R.row("Quảng cáo kéo view", "triệu VND", lambda m: "=" + AGG1("ads", m))
c_smp = R.row("Mẫu sản phẩm, đạo cụ", "triệu VND", lambda m: "=" + AGG1("smp", m))
c_bld = R.row("Chi phí dựng IP mới (casting, đào tạo, nhận diện)", "triệu VND", lambda m: "=" + AGG1("build", m))
c_t1 = R.row("Cộng chi phí trực tiếp — IP người thật", "triệu VND",
             lambda m: f"=SUM({mc(m)}{c_shr}:{mc(m)}{c_bld})", total=True)
R.blank()
R.section("2. CHI PHÍ TRỰC TIẾP — IP AI")
a_lic = R.row("License & compute", "triệu VND", lambda m: "=" + AGG2("lic", m))
a_ops = R.row("Vận hành & trực chat", "triệu VND", lambda m: "=" + AGG2("ops", m))
a_ads = R.row("Quảng cáo kéo view", "triệu VND", lambda m: "=" + AGG2("ads", m) + f"*Doanh_thu!{mc(m)}{r_shock}")
a_oth = R.row("Chi phí khác", "triệu VND", lambda m: "=" + AGG2("oth", m))
a_bld = R.row("Chi phí dựng IP AI mới", "triệu VND", lambda m: "=" + AGG2("build", m))
c_t2 = R.row("Cộng chi phí trực tiếp — IP AI", "triệu VND",
             lambda m: f"=SUM({mc(m)}{a_lic}:{mc(m)}{a_bld})", total=True)
R.blank()
c_dir = R.row("TỔNG CHI PHÍ TRỰC TIẾP", "triệu VND", lambda m: f"={mc(m)}{c_t1}+{mc(m)}{c_t2}", total=True)
R.blank()
R.section("3. NHÂN SỰ TẦNG CÔNG TY (người)")
h_bod = R.row("BOD / quản lý cấp cao", "nguoi", lambda m: f"={A['hc_bod']}", INT)
h_bd = R.row("BD / sales tìm nhãn hàng", "nguoi",
             lambda m: f"=MAX(2,ROUNDUP(Doanh_thu!{mc(m)}{d_act_t}/{A['ratio_bd']},0))", INT)
h_rec = R.row("Tuyển dụng & đào tạo IP", "nguoi",
              lambda m: f"=MAX(1,ROUNDUP(Doanh_thu!{mc(m)}{d_new_t}/{A['ratio_rec']},0))", INT)
h_tech = R.row("Kỹ sư AI / công nghệ", "nguoi",
               lambda m: f"=IF({m}<{A['ai_start']}-{A['tech_lead']},0,"
                         f"{A['tech_base']}+ROUNDUP(Doanh_thu!{mc(m)}{d_act_a}/{A['ratio_tech']},0))", INT)
h_bo = R.row("Back office (kế toán, HR, hành chính)", "nguoi",
             lambda m: f"=MAX({A['bo_base']},ROUNDUP(SUM({mc(m)}{h_bod}:{mc(m)}{h_tech})/{A['ratio_bo']},0))", INT)
h_tot = R.row("TỔNG NHÂN SỰ TẦNG CÔNG TY", "nguoi",
              lambda m: f"=SUM({mc(m)}{h_bod}:{mc(m)}{h_bo})", INT, total=True)
R.blank()
R.section("4. CHI PHÍ TẦNG CÔNG TY (OPEX)")
BU = f"*(1+{A['burden']})"
o_pay = R.row("Lương & phụ cấp tầng công ty", "triệu VND",
              lambda m: f"=({mc(m)}{h_bod}*{A['sal_bod']}+{mc(m)}{h_bd}*{A['sal_bd']}+{mc(m)}{h_rec}*{A['sal_rec']}"
                        f"+{mc(m)}{h_tech}*{A['sal_tech']}+{mc(m)}{h_bo}*{A['sal_bo']}){BU}")
o_mkt = R.row("Marketing thương hiệu MCN & tuyển IP", "triệu VND", lambda m: f"={A['mkt_brand']}")
o_tech = R.row("Công nghệ & nền tảng dùng chung", "triệu VND", lambda m: f"={A['tech_fixed']}")
o_ga = R.row("Văn phòng, pháp lý, kế toán & chi phí chung", "triệu VND",
             lambda m: f"={A['office']}+{A['ga_fixed']}+Doanh_thu!{mc(m)}{d_rev}*{A['ga_pct']}")
o_tot = R.row("TỔNG CHI PHÍ TẦNG CÔNG TY", "triệu VND",
              lambda m: f"=SUM({mc(m)}{o_pay}:{mc(m)}{o_ga})", total=True)
R.blank()
R.section("5. ĐẦU TƯ TÀI SẢN (CAPEX)")
x_tot = R.row("Thiết bị cho nhân sự tầng công ty", "triệu VND",
              lambda m: (f"={mc(1)}{h_tot}*{A['dev_capex']}" if m == 1 else
                         f"=MAX(0,{mc(m)}{h_tot}-{mc(m-1)}{h_tot})*{A['dev_capex']}"), total=True)
x_dep = R.row("Khấu hao trong tháng (đường thẳng)", "triệu VND",
              lambda m: f"=SUM($D${x_tot}:{mc(m)}{x_tot})/{A['depr_m']}")

# ============================================================ 7. PNL
pl = wb.create_sheet("PnL")
ts_header(pl, "BÁO CÁO KẾT QUẢ KINH DOANH (P&L) THEO THÁNG — triệu VND")
R = Rows(pl, 5)
R.section("DOANH THU")
p_r1 = R.row("Hoa hồng affiliate — IP người thật", "triệu VND", lambda m: f"=Doanh_thu!{mc(m)}{d_r1}")
p_r2 = R.row("Phí booking cố định", "triệu VND", lambda m: f"=Doanh_thu!{mc(m)}{d_r2}")
p_r3 = R.row("Thưởng đạt target", "triệu VND", lambda m: f"=Doanh_thu!{mc(m)}{d_r3}")
p_r4 = R.row("Hoa hồng affiliate — IP AI", "triệu VND", lambda m: f"=Doanh_thu!{mc(m)}{d_r4}")
p_rev = R.row("TỔNG DOANH THU", "triệu VND", lambda m: f"=SUM({mc(m)}{p_r1}:{mc(m)}{p_r4})", total=True)
R.blank()
R.section("GIÁ VỐN (chi phí trực tiếp của IP)")
p_c1 = R.row("Chia hoa hồng cho talent", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{c_shr}")
p_c2 = R.row("Lương cứng talent", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{c_sal}")
p_c3 = R.row("Ê-kíp nội dung & live", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{c_crew}")
p_c4 = R.row("Studio, thiết bị, phần mềm", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{c_std}")
p_c5 = R.row("Quảng cáo kéo view (IP thật + IP AI)", "triệu VND",
             lambda m: f"=Chi_phi!{mc(m)}{c_ads}+Chi_phi!{mc(m)}{a_ads}")
p_c6 = R.row("Mẫu sản phẩm, đạo cụ", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{c_smp}")
p_c7 = R.row("Chi phí dựng IP mới (thật + AI)", "triệu VND",
             lambda m: f"=Chi_phi!{mc(m)}{c_bld}+Chi_phi!{mc(m)}{a_bld}")
p_c8 = R.row("License, compute & vận hành IP AI", "triệu VND",
             lambda m: f"=Chi_phi!{mc(m)}{a_lic}+Chi_phi!{mc(m)}{a_ops}+Chi_phi!{mc(m)}{a_oth}")
p_cogs = R.row("TỔNG GIÁ VỐN", "triệu VND", lambda m: f"=SUM({mc(m)}{p_c1}:{mc(m)}{p_c8})", total=True)
p_gp = R.row("LỢI NHUẬN GỘP", "triệu VND", lambda m: f"={mc(m)}{p_rev}-{mc(m)}{p_cogs}", total=True)
p_gpm = R.row("Biên lợi nhuận gộp", "%", lambda m: f"=IFERROR({mc(m)}{p_gp}/{mc(m)}{p_rev},0)", PCT, kpi=True)
R.blank()
R.section("CHI PHÍ TẦNG CÔNG TY")
p_o1 = R.row("Lương & phụ cấp tầng công ty", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{o_pay}")
p_o2 = R.row("Marketing thương hiệu & tuyển IP", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{o_mkt}")
p_o3 = R.row("Công nghệ & nền tảng dùng chung", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{o_tech}")
p_o4 = R.row("Văn phòng, pháp lý & chi phí chung", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{o_ga}")
p_opex = R.row("TỔNG CHI PHÍ TẦNG CÔNG TY", "triệu VND", lambda m: f"=SUM({mc(m)}{p_o1}:{mc(m)}{p_o4})", total=True)
R.blank()
p_ebitda = R.row("EBITDA", "triệu VND", lambda m: f"={mc(m)}{p_gp}-{mc(m)}{p_opex}", total=True)
p_ebm = R.row("Biên EBITDA", "%", lambda m: f"=IFERROR({mc(m)}{p_ebitda}/{mc(m)}{p_rev},0)", PCT, kpi=True)
p_dep = R.row("Khấu hao", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{x_dep}")
p_ebit = R.row("EBIT (lợi nhuận trước thuế)", "triệu VND", lambda m: f"={mc(m)}{p_ebitda}-{mc(m)}{p_dep}", total=True)
p_l0 = R.row("Lỗ luỹ kế đầu kỳ", "triệu VND", lambda m: "=0")
p_tb = R.row("Thu nhập chịu thuế", "triệu VND", lambda m: f"=MAX(0,{mc(m)}{p_ebit}-{mc(m)}{p_l0})")
p_tax = R.row("Thuế TNDN", "triệu VND", lambda m: f"={mc(m)}{p_tb}*{A['tax']}")
p_ni = R.row("LỢI NHUẬN SAU THUẾ", "triệu VND", lambda m: f"={mc(m)}{p_ebit}-{mc(m)}{p_tax}", total=True)
p_l1 = R.row("Lỗ luỹ kế cuối kỳ", "triệu VND", lambda m: f"=MAX(0,{mc(m)}{p_l0}-{mc(m)}{p_ebit})")
for m in range(2, N + 1):
    pl.cell(p_l0, 3 + m).value = f"={mc(m-1)}{p_l1}"
p_cum = R.row("Lợi nhuận sau thuế luỹ kế", "triệu VND", lambda m: f"={mc(m)}{p_ni}")
for m in range(2, N + 1):
    pl.cell(p_cum, 3 + m).value = f"={mc(m-1)}{p_cum}+{mc(m)}{p_ni}"

ar = p_cum + 3
pl.cell(ar, 2, "TỔNG HỢP THEO NĂM (triệu VND)").font = F_TITLE
for i, h in enumerate(["Chỉ tiêu", "Năm 1", "Năm 2", "Năm 3", "Cộng 3 năm"]):
    c = pl.cell(ar + 1, 2 + i, h); c.font = F_H; c.fill = FI_H
ann = [("Tổng GMV gộp", f"Doanh_thu!", d_gg), ("Tổng GMV ròng", "Doanh_thu!", d_gn),
       ("Tổng doanh thu", "", p_rev), ("  — từ IP người thật", "Doanh_thu!", d_rt),
       ("  — từ IP AI", "", p_r4), ("Tổng giá vốn", "", p_cogs), ("Lợi nhuận gộp", "", p_gp),
       ("Tổng chi phí tầng công ty", "", p_opex), ("EBITDA", "", p_ebitda),
       ("Khấu hao", "", p_dep), ("EBIT", "", p_ebit), ("Thuế TNDN", "", p_tax),
       ("Lợi nhuận sau thuế", "", p_ni)]
for i, (lab, pre, row) in enumerate(ann):
    rr = ar + 2 + i
    pl.cell(rr, 2, lab)
    if lab.startswith("Lợi nhuận sau thuế") or lab == "EBITDA": pl.cell(rr, 2).font = F_B
    for y in range(3):
        c = pl.cell(rr, 3 + y, f"=SUM({pre}{mc(y*12+1)}{row}:{mc(y*12+12)}{row})")
        c.number_format = NUM
    c = pl.cell(rr, 6, f"=SUM(C{rr}:E{rr})"); c.number_format = NUM; c.font = F_B; c.fill = FI_T
rev_r = ar + 4
for i, (lab, src) in enumerate([("Biên lợi nhuận gộp", ar + 8), ("Biên EBITDA", ar + 10)]):
    rr = ar + 2 + len(ann) + i
    pl.cell(rr, 2, lab)
    for y in range(4):
        col = gl(3 + y)
        c = pl.cell(rr, 3 + y, f"=IFERROR({col}{src}/{col}{rev_r},0)"); c.number_format = PCT

# ============================================================ 8. DONG_TIEN
ct = wb.create_sheet("Dong_tien")
ts_header(ct, "DỰ BÁO DÒNG TIỀN THEO THÁNG (triệu VND)",
          "Tiền hoa hồng về theo DSO; chia sẻ cho talent trả theo DPO; các khoản còn lại trả trong tháng.")
R = Rows(ct, 5)
R.section("DÒNG TIỀN VÀO")
f_in = R.row("Thu tiền hoa hồng, booking & thưởng", "triệu VND", lambda m: "=" + "+".join(
    f"PnL!{mc(m-i)}{p_rev}*{A[w]}" for i, w in enumerate(["w0", "w1", "w2"]) if m - i >= 1), total=True)
R.blank()
R.section("DÒNG TIỀN RA")
f_shr = R.row("Trả chia sẻ hoa hồng cho talent", "triệu VND", lambda m: "=" + "+".join(
    f"PnL!{mc(m-i)}{p_c1}*{A[v]}" for i, v in enumerate(["v0", "v1", "v2"]) if m - i >= 1))
f_dir = R.row("Chi phí trực tiếp khác (lương talent, ê-kíp, studio, ads, dựng IP)", "triệu VND",
              lambda m: f"=PnL!{mc(m)}{p_cogs}-PnL!{mc(m)}{p_c1}")
f_op = R.row("Chi phí tầng công ty", "triệu VND", lambda m: f"=PnL!{mc(m)}{p_opex}")
f_tax = R.row("Nộp thuế TNDN", "triệu VND", lambda m: f"=PnL!{mc(m)}{p_tax}")
f_cx = R.row("Đầu tư tài sản (capex)", "triệu VND", lambda m: f"=Chi_phi!{mc(m)}{x_tot}")
f_out = R.row("TỔNG CHI", "triệu VND", lambda m: f"=SUM({mc(m)}{f_shr}:{mc(m)}{f_cx})", total=True)
R.blank()
f_ops = R.row("DÒNG TIỀN TỪ HOẠT ĐỘNG & ĐẦU TƯ", "triệu VND",
              lambda m: f"={mc(m)}{f_in}-{mc(m)}{f_out}", total=True)
f_rs = R.row("Vốn góp từ nhà đầu tư", "triệu VND",
             lambda m: f"=IF({m}={A['raise1_m']},{A['raise1']},0)+IF({m}={A['raise2_m']},{A['raise2']},0)")
f_net = R.row("DÒNG TIỀN THUẦN TRONG THÁNG", "triệu VND", lambda m: f"={mc(m)}{f_ops}+{mc(m)}{f_rs}", total=True)
f_beg = R.row("Tiền đầu kỳ", "triệu VND", lambda m: f"={A['cash0']}")
f_end = R.row("TIỀN CUỐI KỲ", "triệu VND", lambda m: f"={mc(m)}{f_beg}+{mc(m)}{f_net}", total=True)
for m in range(2, N + 1):
    ct.cell(f_beg, 3 + m).value = f"={mc(m-1)}{f_end}"
R.blank()
R.section("NHU CẦU VỐN")
f_cum = R.row("Dòng tiền HĐKD & đầu tư luỹ kế (chưa tính vốn góp)", "triệu VND",
              lambda m: f"={mc(m)}{f_ops}")
for m in range(2, N + 1):
    ct.cell(f_cum, 3 + m).value = f"={mc(m-1)}{f_cum}+{mc(m)}{f_ops}"
f_need = R.row("Nhu cầu vốn luỹ kế tối đa tính đến tháng này", "triệu VND",
               lambda m: f"=-MIN(0,MIN($D${f_cum}:{mc(m)}{f_cum}))", kpi=True)
f_run = R.row("Số tháng tiền còn đủ (runway) theo mức đốt hiện tại", "thang",
              lambda m: f'=IF({mc(m)}{f_ops}>=0,"lãi dương",IFERROR(ROUND({mc(m)}{f_end}/-{mc(m)}{f_ops},1),0))',
              NUM1, kpi=True)
# ============================================================ 9. KICH_BAN
import engine
VARIANTS = [
 ("Downside", "Downside", {}, "GMV/phiên ổn định 30tr, huỷ/hoàn 25%, hoa hồng 15%"),
 ("Base", "Base", {}, "GMV/phiên ổn định 60tr, huỷ/hoàn 18%, hoa hồng 20%"),
 ("Upside", "Upside", {}, "GMV/phiên ổn định 110tr, huỷ/hoàn 13%, hoa hồng 24%"),
 ("Base + sốc tầng AI", "Base", {"shock_pct": 0.6, "shock_from": 25, "shock_len": 3},
  "Kiểm định: nền tảng siết nội dung AI, tầng AI mất 60% GMV trong 1 quý từ T25"),
 ("Downside + cơ chế cắt", "Downside", {"hire2": 0, "hire3": 0, "ai_start": 99},
  "Dừng tuyển IP mới từ T7 và không triển khai tầng AI khi thấy unit economics âm"),
]
RESULTS = []
for title, base, over, desc in VARIANTS:
    rr, pp = engine.run(base, over=over or None)
    RESULTS.append((title, desc, engine.kpis(rr, pp)))

kb = wb.create_sheet("Kich_ban")
kb["A1"] = "TÓM TẮT KỊCH BẢN (triệu VND)"; kb["A1"].font = F_TITLE
kb["A2"] = ("Bảng này là ảnh chụp tính sẵn cho cả năm kịch bản. Các sheet còn lại chạy theo kịch bản "
            "chọn ở Gia_dinh!B4 — đổi ô đó sẽ thấy số ở đây KHÔNG đổi, đây là chủ ý.")
kb.column_dimensions["A"].width = 3
kb.column_dimensions["B"].width = 44
for i in range(len(RESULTS)): kb.column_dimensions[gl(3 + i)].width = 20
for i, (title, desc, _k) in enumerate(RESULTS):
    c = kb.cell(4, 3 + i, title); c.font = F_H; c.fill = FI_H
    c.alignment = Alignment(wrap_text=True, horizontal="center", vertical="center")
    c = kb.cell(5, 3 + i, desc); c.alignment = Alignment(wrap_text=True, vertical="top")
    c.font = Font(italic=True, size=9)
kb.cell(4, 2, "Chỉ tiêu").font = F_H; kb.cell(4, 2).fill = FI_H
kb.row_dimensions[5].height = 46
KEYS = list(RESULTS[1][2].keys())
GROUPS = {"Doanh thu Năm 1": "TĂNG TRƯỞNG", "EBITDA Năm 1": "LỢI NHUẬN",
          "Tháng EBITDA dương đầu tiên": "ĐIỂM HOÀ VỐN & VỐN", "Số IP người thật hoạt động cuối kỳ": "QUY MÔ CUỐI KỲ"}
r = 6
for key in KEYS:
    if key in GROUPS:
        r += 1
        kb.cell(r, 2, GROUPS[key]).font = F_S
        for c in range(2, 3 + len(RESULTS)): kb.cell(r, c).fill = FI_S
        r += 1
    kb.cell(r, 2, key)
    bold = key in ("EBITDA Năm 3", "Nhu cầu vốn đỉnh điểm", "Lợi nhuận sau thuế luỹ kế 3 năm")
    if bold: kb.cell(r, 2).font = F_B
    for i, (_t, _d, k) in enumerate(RESULTS):
        v = k[key]
        c = kb.cell(r, 3 + i, v if not (key.startswith("Thang") and v == 0) else "Không đạt trong 36 tháng")
        c.number_format = PCT if key.startswith("Bien") else (INT if key.startswith("Thang") else NUM)
        if bold: c.font = F_B; c.fill = FI_T
    r += 1
r += 1
kb.cell(r, 2, "ĐỐI CHIẾU VỚI MÔ HÌNH ĐANG CHẠY (công thức sống)").font = F_TITLE
r += 1
kb.cell(r, 2, "Kịch bản đang chạy ở Gia_dinh!B4"); kb.cell(r, 3, "=Gia_dinh!$B$4").font = F_B
live = [("Doanh thu Năm 1", f"=PnL!C{ar+4}"), ("Doanh thu Năm 2", f"=PnL!D{ar+4}"),
        ("Doanh thu Năm 3", f"=PnL!E{ar+4}"), ("EBITDA Năm 3", f"=PnL!E{ar+10}"),
        ("Nhu cầu vốn đỉnh điểm", f"=MAX(Dong_tien!D{f_need}:{mc(N)}{f_need})"),
        ("Tiền cuối kỳ tháng 36", f"=Dong_tien!{mc(N)}{f_end}")]
for i, (lab, f) in enumerate(live):
    kb.cell(r + 1 + i, 2, lab)
    c = kb.cell(r + 1 + i, 3, f)
    c.number_format = NUM; c.font = F_B; c.fill = FI_K
kb.cell(r + 1 + len(live) + 1, 2,
        "Nếu cột này không trùng với cột kịch bản tương ứng ở trên thì một giả định đã bị sửa tay.")

# ============================================================ 10. HUONG_DAN
hd = wb.create_sheet("Huong_dan")
hd.column_dimensions["A"].width = 3
hd.column_dimensions["B"].width = 26
hd.column_dimensions["C"].width = 110
hd["B1"] = "BẢN DỰ TOÁN TÀI CHÍNH MCN — 36 THÁNG"; hd["B1"].font = Font(bold=True, size=16, color="1F3864")
TEXT = [
 ("", ""),
 ("Mục đích", "Bản dự toán phục vụ gọi vốn cho mô hình MCN: (1) build và grow IP người thật, "
              "(2) dùng IP bán hàng livestream ăn chia sẻ doanh thu, (3) scale bằng IP AI."),
 ("Đơn vị tiền tệ", "TRIỆU VND ở mọi sheet. 1.000 = 1 tỷ đồng."),
 ("Kỳ dự báo", "36 thang, bat dau tu thang dat o Gia_dinh!B5 (mac dinh 01/2027)."),
 ("Cách dùng", "Chỉ sửa các ô màu vàng ở sheet Gia_dinh. Đổi kịch bản tại Gia_dinh!B4 "
               "(Downside / Base / Upside) — toàn bộ mô hình tự tính lại."),
 ("", ""),
 ("CÁC SHEET", ""),
 ("Gia_dinh", "Toàn bộ tham số, ba cột giá trị cho ba kịch bản, cột ĐANG ÁP DỤNG là giá trị mô hình đang dùng. "
              "Cột cuối ghi căn cứ của từng giả định."),
 ("Don_vi_IP", "Unit economics của MỘT IP người thật theo tuổi 0-36 tháng: doanh thu, từng dòng chi phí, "
               "lãi gộp, lãi gộp luỹ kế, đỉnh vốn và tháng hoà vốn của một IP."),
 ("Don_vi_IP_AI", "Unit economics của MỘT IP AI, cùng cấu trúc."),
 ("Doi_hinh", "Mô hình cohort: số IP ở từng tuổi trong từng tháng = số IP ký mới của tháng tương ứng "
              "nhân tỷ lệ sống sót. Đây là nơi cơ chế sàng lọc (cửa T3, cửa T9, rời bỏ hàng năm) chạy."),
 ("Doanh_thu", "GMV gộp, GMV ròng, và ba dòng doanh thu: hoa hồng affiliate IP người thật, phí booking, "
               "hoa hồng affiliate IP AI."),
 ("Chi_phi", "Chi phí trực tiếp (lấy từ unit economics nhân đội hình) và chi phí tầng công ty."),
 ("PnL", "Kết quả kinh doanh theo tháng và bảng tổng hợp theo năm 1/2/3."),
 ("Dong_tien", "Dòng tiền theo tháng, có độ trễ thu tiền (DSO) và trả talent (DPO), nhu cầu vốn luỹ kế và runway."),
 ("Kich_ban", "Tóm tắt năm kịch bản, gồm hai bài kiểm định rủi ro."),
 ("", ""),
 ("BA ĐIỀU CẦN ĐỌC KỸ", ""),
 ("1. Phí nền tảng",
  "Phí TikTok Shop 12,5% (Marketplace) / 15,5% (Mall) do NGƯỜI BÁN chịu, không phải chi phí của MCN, "
  "nên không xuất hiện trong bảng này. Chỉ đưa vào nếu MCN tự bán hàng của mình."),
 ("2. Doanh thu ghi nhận",
  "Doanh thu MCN = hoa hồng nhãn hàng trả, ghi nhận TRƯỚC khi chia cho talent. Phần chia cho talent "
  "nằm trong giá vốn. GMV không phải doanh thu."),
 ("3. Kịch bản downside",
  "Một IP chạy dưới ~35tr GMV/phiên ở trạng thái ổn định thì không bao giờ hoàn vốn: càng nuôi lâu càng lỗ. "
  "Vì vậy mô hình có hai cửa sàng lọc (tuổi 3 và tuổi 9) và một kịch bản 'Downside + cơ chế cắt' cho thấy "
  "việc dừng tuyển sớm giảm thiệt hại thế nào."),
 ("", ""),
 ("GIỚI HẠN CỦA BẢN DỰ TOÁN", ""),
 ("Giả định, không phải số thực",
  "Mọi con số là giả định làm việc, chưa có số liệu vận hành thực tế. Cột 'Căn cứ / nguồn' ở sheet Gia_dinh "
  "ghi rõ từng dòng đến từ đâu: 'Unit econ' là bộ giả định đơn vị đã chốt, 'Dự toán' là giả định bổ sung "
  "của bản dự toán này."),
 ("Tham số nhạy nhất",
  "Theo thứ tự ảnh hưởng: GMV/phiên ổn định, tỷ lệ huỷ & hoàn hàng, hoa hồng affiliate, tỷ lệ chia cho talent, "
  "tỷ lệ rơi rụng tại cửa sàng lọc, GMV/giờ của IP AI. Có số liệu thực dòng nào thì thay dòng đó trước."),
 ("Kịch bản Upside",
  "Upside giả định MỌI IP đều đạt 110tr GMV/phiên — mức của nhóm creator đầu bảng. Đây là trần lý thuyết "
  "để đo độ nhạy, không nên dùng làm cam kết với nhà đầu tư."),
 ("Chưa mô hình hoá",
  "Lãi vay, biến động tỷ giá, thuế TNCN của talent, dự phòng công nợ khó đòi, và chi phí pháp lý cho "
  "tranh chấp hợp đồng độc quyền."),
 ("Thuế TNDN", "Tính 20% trên thu nhập chịu thuế sau khi bù hết lỗ luỹ kế, nộp trong chính tháng phát sinh. "
               "Thực tế tạm nộp theo quý — chênh lệch này không đổi kết luận."),
]
rr = 2
for a, b in TEXT:
    if a and not b:
        c = hd.cell(rr + 1, 2, a); c.font = F_S
        for col in (2, 3): hd.cell(rr + 1, col).fill = FI_S
    elif a:
        hd.cell(rr + 1, 2, a).font = F_B
        c = hd.cell(rr + 1, 3, b); c.alignment = Alignment(wrap_text=True, vertical="top")
        hd.row_dimensions[rr + 1].height = max(15, 14 * (1 + len(b) // 105))
    rr += 1
hd.cell(rr + 2, 2, "Tạo từ finance/build_model.py + finance/params.py. Sửa tham số trong params.py rồi chạy lại "
                   "script để sinh bản mới, hoặc sửa trực tiếp ở Gia_dinh.").font = Font(italic=True, size=9)

wb.move_sheet("Huong_dan", offset=-(len(wb.sheetnames) - 1))
wb.move_sheet("Kich_ban", offset=-(len(wb.sheetnames) - 2))
wb.save(OUT)
print("Đã ghi:", OUT)
print("Sheets:", wb.sheetnames)
