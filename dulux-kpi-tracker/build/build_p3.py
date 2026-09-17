# -*- coding: utf-8 -*-
"""Part 3: Incentive_Calc, Dashboard, sample data, conditional formatting."""
from common import *
from openpyxl.formatting.rule import ColorScaleRule, CellIsRule
import os, random
BASE = os.path.dirname(os.path.abspath(__file__))
wb = load_workbook(os.path.join(BASE, "stage2.xlsx"))
QTR = P_QTR

# =========================================================== INCENTIVE CALC ====
ws = wb.create_sheet("Incentive_Calc")
ws.sheet_view.showGridLines = False
title(ws, "B2", "INCENTIVE CALCULATION FY2026 – LEAD (theo quý) + FOCUS (cuối năm)")
put(ws, 3, 2, "Tự động 100%. Tiền quý = số được hưởng luỹ kế đến quý đó − số đã trả các quý trước. "
              "Payout factor đã cap theo Parameters.", font=f(10, False, "595959", it=True), border=False)
groups = [(2, 8, "THÔNG TIN & QUỸ THƯỞNG", "404040"), (9, 12, "NET LEAD FACTOR (luỹ kế)", BLUE_H),
          (13, 16, "TIỀN ĐƯỢC HƯỞNG LUỸ KẾ", BLUE_H), (17, 21, "TIỀN TRẢ TỪNG QUÝ", NAVY),
          (22, 24, "FOCUS KPI – CUỐI NĂM", GOLD_H), (25, 27, "TỔNG FY", GREEN_H)]
for c1, c2, txt, hcol in groups:
    ws.merge_cells(start_row=4, start_column=c1, end_row=4, end_column=c2)
    cell = ws.cell(row=4, column=c1, value=txt)
    cell.font = f(10, True, WHITE); cell.fill = PatternFill("solid", fgColor=hcol)
    cell.alignment = Alignment(horizontal="center", vertical="center")
heads = ["Emp Code", "Name", "Region", "Team", "ATVP (prorated)", "Lead pot", "Focus pot",
         "Q1", "Q2", "Q3", "Q4", "Earned YTD Q1", "Earned YTD Q2", "Earned YTD Q3", "Earned YTD Q4",
         "Pay Q1", "Pay Q2", "Pay Q3", "Pay Q4", "Total Lead FY",
         "Focus Ach FY", "Focus factor", "Focus payout", "TOTAL FY payout", "% of ATVP", "Note"]
for i, h in enumerate(heads):
    col = i + 2
    fill = NAVY
    if 9 <= col <= 16:
        fill = BLUE_H
    elif 17 <= col <= 21:
        fill = NAVY
    elif 22 <= col <= 24:
        fill = GOLD_H
    elif col >= 25:
        fill = GREEN_H
    hdr(ws, 5, col, h, fill=fill)
ws.row_dimensions[5].height = 34
widths(ws, {"A": 3, "B": 11, "C": 18, "D": 11, "E": 11})
for c in range(6, 28):
    ws.column_dimensions[get_column_letter(c)].width = 12
ws.column_dimensions["AB"].width = 30

def trk(col, q):
    return f'IFERROR(INDEX(Tracking!${col}${DATA_FIRST}:${col}${TRK_LAST},(ROW()-{IC_FIRST})*4+{q}),0)'

for r in range(IC_FIRST, IC_LAST + 1):
    m = r
    put(ws, r, 2, f'=IF(Team_Master!$C{m}="","",Team_Master!$C{m})', font=f(10, False, GREEN_TXT), align="center")
    put(ws, r, 3, f'=IF(Team_Master!$G{m}="","",Team_Master!$G{m})', font=f(10, False, GREEN_TXT))
    put(ws, r, 4, f'=IF(Team_Master!$E{m}="","",Team_Master!$E{m})', font=f(10, False, GREEN_TXT), align="center")
    put(ws, r, 5, f'=IF(Team_Master!$D{m}="","",Team_Master!$D{m})', font=f(10, False, GREEN_TXT), align="center")
    put(ws, r, 6, f'=IF($B{r}="",0,Team_Master!$M{m})', nf=MONEY, font=f(10, False, GREEN_TXT))
    put(ws, r, 7, f'=IF($B{r}="",0,Team_Master!$N{m})', nf=MONEY, font=f(10, False, GREEN_TXT))
    put(ws, r, 8, f'=IF($B{r}="",0,Team_Master!$O{m})', nf=MONEY, font=f(10, False, GREEN_TXT))
    for q in range(1, 5):
        put(ws, r, 8 + q, f"={trk('X', q)}", nf=PCT, fill=LEAD_FILL)
        ec = get_column_letter(8 + q)
        put(ws, r, 12 + q, f"=$H{r}*{q}/4*{ec}{r}", nf=MONEY, fill=LEAD_FILL)
    put(ws, r, 17, f'=IF({P_CLAW}="Y",M{r},MAX(0,M{r}))', nf=MONEY, font=f(10, True))
    for q in range(2, 5):
        prev, cur = get_column_letter(11 + q), get_column_letter(12 + q)
        put(ws, r, 16 + q, f'=IF({P_CLAW}="Y",{cur}{r}-{prev}{r},MAX(0,{cur}{r}-{prev}{r}))',
            nf=MONEY, font=f(10, True))
    put(ws, r, 21, f"=SUM(Q{r}:T{r})", nf=MONEY, font=f(10, True), fill=CALC_FILL)
    put(ws, r, 22, f"={trk('U', 4)}", nf=PCT, fill=FOCUS_FILL)
    put(ws, r, 23, f"={trk('V', 4)}", nf=PCT, fill=FOCUS_FILL)
    put(ws, r, 24, f"=$I{r}*W{r}", nf=MONEY, font=f(10, True), fill=FOCUS_FILL)
    put(ws, r, 25, f"=U{r}+X{r}", nf=MONEY, font=f(11, True), fill=CALC_FILL)
    put(ws, r, 26, f"=IF($F{r}<=0,0,Y{r}/$F{r})", nf=PCT, font=f(10, True), fill=CALC_FILL)
    put(ws, r, 27, f'=IF($B{r}="","",IF(MAX(I{r}:L{r})>={P_PMAX},"Chạm trần payout – quyết toán cuối năm",'
                   f'IF(MAX(I{r}:L{r})=0,"Chưa có dữ liệu","")))', font=f(9, False, RED_TXT), wrap=True)
tot = IC_LAST + 1
put(ws, tot, 5, "TOTAL", font=f(10, True), align="right")
for c in [6, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25]:
    L = get_column_letter(c)
    put(ws, tot, c, f"=SUM({L}{IC_FIRST}:{L}{IC_LAST})", nf=MONEY, font=f(10, True), fill=CALC_FILL)
put(ws, tot + 2, 2,
    "Pay Qn = Earned YTD Qn − Earned YTD Q(n−1). Quý sau tụt: mặc định trả 0, không thu hồi "
    "(đổi tại Parameters!C31). Focus KPI chỉ trả 1 lần sau khi chốt Q4.",
    font=f(9, False, "595959", it=True), border=False)
ws.freeze_panes = "F6"

# ================================================================ DASHBOARD ====
ws = wb.create_sheet("Dashboard")
ws.sheet_view.showGridLines = False
title(ws, "B2", "DASHBOARD – KẾT QUẢ KÊNH / CHANNEL PERFORMANCE", 16)
widths(ws, {"A": 3, "B": 24, "C": 22, "D": 14, "E": 14, "F": 12, "G": 13, "H": 13, "I": 13,
            "J": 13, "K": 13, "L": 14, "M": 14})
put(ws, 3, 2, "Kênh / Channel:", font=f(10, True))
put(ws, 3, 3, "=Parameters!C6", font=f(11, True, GREEN_TXT))
put(ws, 3, 5, "Kỳ báo cáo:", font=f(10, True))
put(ws, 3, 6, f'="Q"&{QTR}&" luỹ kế"', font=f(11, True, GREEN_TXT), align="center")
put(ws, 3, 8, "Đổi quý tại Parameters!C7", font=f(9, False, RED_TXT, it=True), border=False)

def block_title(r, text):
    c = put(ws, r, 2, text, font=f(11, True, WHITE), fill=BLUE_H)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=13)
    c.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[r].height = 20

TF, TL = DATA_FIRST, TRK_LAST
def sif(col):
    return f"SUMIF(Tracking!$E${TF}:$E${TL},{QTR},Tracking!${col}${TF}:${col}${TL})"

block_title(5, "1. TOÀN KÊNH / CHANNEL TOTAL")
for i, h in enumerate(["KPI", "Đơn vị", "Target YTD", "Actual YTD", "Achievement %",
                       "Payout factor", "Weight", "Status"]):
    hdr(ws, 6, 2 + i, h)
kpi_rows = [("Invoiced Value", "MVND", "F", "G", "KPI_Framework!$F$6", LEAD_FILL),
            ("Site check (Key account)", "Roadshow", "J", "K", "KPI_Framework!$F$7", LEAD_FILL),
            ("Spec-in Value", "MVND", "O", "P", "KPI_Framework!$F$8", FOCUS_FILL),
            ("Engaged Architect", "D&B", "R", "S", "KPI_Framework!$F$9", FOCUS_FILL),
            ("Spec-in Design (theo dõi)", "Designs", "Z", "AA", "KPI_Framework!$F$10", TRACK_FILL)]
for i, (name, unit, tcol, acol, wref, fill) in enumerate(kpi_rows):
    r = 7 + i
    put(ws, r, 2, name, font=f(10, True), fill=fill)
    put(ws, r, 3, unit, align="center", fill=fill)
    put(ws, r, 4, f"={sif(tcol)}", nf=NUM, fill=fill)
    put(ws, r, 5, f"={sif(acol)}", nf=NUM, fill=fill)
    put(ws, r, 6, f"=IF(D{r}<=0,0,E{r}/D{r})", nf=PCT, font=f(10, True), fill=fill)
    put(ws, r, 7, f"={curve(f'F{r}', f'D{r}')}", nf=PCT, fill=fill)
    put(ws, r, 8, f"={wref}", nf=PCT0, align="center", fill=fill)
    put(ws, r, 9, f'=IF(D{r}<=0,"Chưa có target",IF(F{r}>=1,"Đạt",IF(F{r}>=0.9,"Cận đích","Chưa đạt")))',
        align="center", font=f(10, True), fill=fill)
r = 12
put(ws, r, 2, "Blended payout factor", font=f(10, True), fill=CALC_FILL)
put(ws, r, 7, "=IFERROR(SUMPRODUCT(G7:G11,H7:H11)/SUM(H7:H11),0)", nf=PCT, font=f(11, True), fill=CALC_FILL)
put(ws, r, 8, "=SUM(H7:H11)", nf=PCT0, align="center", fill=CALC_FILL)
put(ws, r, 9, "Tổng weight (phải = 100%)", font=f(9, False, "595959", it=True))

block_title(14, "2. THEO REGION / BY REGION (luỹ kế đến quý báo cáo)")
for i, h in enumerate(["Region", "Headcount", "Invoiced Target", "Invoiced Actual", "Invoiced Ach %",
                       "Site check Ach %", "Lead factor (avg)", "Focus Ach (avg)", "Gate (avg)",
                       "Net Lead factor (avg)", "Est. FY payout", "% of pot"]):
    hdr(ws, 15, 2 + i, h)
ws.row_dimensions[15].height = 34
REG_FIRST = 16
for i in range(8):
    r = REG_FIRST + i
    reg = f"$B{r}"
    put(ws, r, 2, f"=Parameters!$B${33+i}", font=f(10, True, GREEN_TXT))
    def sifs(col):
        return (f"SUMIFS(Tracking!${col}${TF}:${col}${TL},Tracking!$C${TF}:$C${TL},{reg},"
                f"Tracking!$E${TF}:$E${TL},{QTR})")
    def aifs(col):
        return (f"IFERROR(AVERAGEIFS(Tracking!${col}${TF}:${col}${TL},Tracking!$C${TF}:$C${TL},{reg},"
                f"Tracking!$E${TF}:$E${TL},{QTR}),0)")
    put(ws, r, 3, f'=IF({reg}="",0,COUNTIFS(Tracking!$C${TF}:$C${TL},{reg},Tracking!$E${TF}:$E${TL},{QTR}))',
        nf="0", align="center")
    put(ws, r, 4, f'=IF({reg}="",0,{sifs("F")})', nf=NUM)
    put(ws, r, 5, f'=IF({reg}="",0,{sifs("G")})', nf=NUM)
    put(ws, r, 6, f"=IF(D{r}<=0,0,E{r}/D{r})", nf=PCT, font=f(10, True))
    put(ws, r, 7, f'=IF({reg}="",0,IFERROR({sifs("K")}/{sifs("J")},0))', nf=PCT)
    put(ws, r, 8, f'=IF({reg}="",0,{aifs("N")})', nf=PCT)
    put(ws, r, 9, f'=IF({reg}="",0,{aifs("U")})', nf=PCT)
    put(ws, r, 10, f'=IF({reg}="",0,{aifs("W")})', nf=PCT0, align="center")
    put(ws, r, 11, f'=IF({reg}="",0,{aifs("X")})', nf=PCT, font=f(10, True))
    put(ws, r, 12, f'=IF({reg}="",0,SUMIF(Incentive_Calc!$D${IC_FIRST}:$D${IC_LAST},{reg},'
                   f'Incentive_Calc!$Y${IC_FIRST}:$Y${IC_LAST}))', nf=MONEY)
    put(ws, r, 13, f'=IF({reg}="",0,IFERROR(L{r}/SUMIF(Incentive_Calc!$D${IC_FIRST}:$D${IC_LAST},{reg},'
                   f'Incentive_Calc!$F${IC_FIRST}:$F${IC_LAST}),0))', nf=PCT)
rt = REG_FIRST + 8
put(ws, rt, 2, "TOTAL", font=f(10, True), fill=CALC_FILL)
for c, nf in [(3, "0"), (4, NUM), (5, NUM), (12, MONEY)]:
    L = get_column_letter(c)
    put(ws, rt, c, f"=SUM({L}{REG_FIRST}:{L}{rt-1})", nf=nf, font=f(10, True), fill=CALC_FILL)
put(ws, rt, 6, f"=IF(D{rt}<=0,0,E{rt}/D{rt})", nf=PCT, font=f(10, True), fill=CALC_FILL)

block_title(rt + 2, "3. THEO TỪNG NGƯỜI / BY SALES PERSON (luỹ kế đến quý báo cáo)")
PH = rt + 3
PF = PH + 1
for i, h in enumerate(["Rank", "Emp Code", "Name", "Region", "Invoiced Ach %", "Site check Ach %",
                       "Lead factor", "Focus Ach %", "Gate %", "Net Lead factor", "Status",
                       "TOTAL FY payout"]):
    hdr(ws, PH, 2 + i, h)
ws.row_dimensions[PH].height = 34
for i in range(NPEOPLE):
    r = PF + i
    def tk(col):
        return f'IFERROR(INDEX(Tracking!${col}${TF}:${col}${TL},(ROW()-{PF})*4+{QTR}),"")'
    put(ws, r, 2, f'=IF($C{r}="","",RANK(K{r},$K${PF}:$K${PF+NPEOPLE-1},0))', nf="0", align="center")
    put(ws, r, 3, f"={tk('A')}", font=f(10, False, GREEN_TXT), align="center")
    put(ws, r, 4, f"={tk('B')}", font=f(10, False, GREEN_TXT))
    put(ws, r, 5, f"={tk('C')}", font=f(10, False, GREEN_TXT), align="center")
    put(ws, r, 6, f"={tk('H')}", nf=PCT, fill=LEAD_FILL)
    put(ws, r, 7, f"={tk('L')}", nf=PCT, fill=LEAD_FILL)
    put(ws, r, 8, f"={tk('N')}", nf=PCT, font=f(10, True), fill=LEAD_FILL)
    put(ws, r, 9, f"={tk('U')}", nf=PCT, fill=FOCUS_FILL)
    put(ws, r, 10, f"={tk('W')}", nf=PCT0, align="center", fill=FOCUS_FILL)
    put(ws, r, 11, f"={tk('X')}", nf=PCT, font=f(10, True), fill=CALC_FILL)
    put(ws, r, 12, f"={tk('Y')}", align="center", font=f(10, True))
    put(ws, r, 13, f'=IF($C{r}="","",IFERROR(INDEX(Incentive_Calc!$Y${IC_FIRST}:$Y${IC_LAST},ROW()-{PF}+1),""))',
        nf=MONEY, fill=CALC_FILL)
ws.freeze_panes = "B4"

# ==================================================== CONDITIONAL FORMATTING ===
def rag(sheet, rng):
    wb[sheet].conditional_formatting.add(rng, ColorScaleRule(
        start_type="num", start_value=0.8, start_color="F8696B",
        mid_type="num", mid_value=1.0, mid_color="FFEB84",
        end_type="num", end_value=1.2, end_color="63BE7B"))

for col in ["H", "L", "N", "Q", "T", "U", "X"]:
    rag("Tracking", f"{col}{TF}:{col}{TL}")
for rng in ["F7:F11", f"F{REG_FIRST}:F{rt-1}", f"K{PF}:K{PF+NPEOPLE-1}", f"H{PF}:H{PF+NPEOPLE-1}"]:
    rag("Dashboard", rng)
for state, fc, bg in [("Behind", "9C0006", "FFC7CE"), ("On track", "006100", "C6EFCE"),
                      ("Watch", "9C6500", "FFEB9C")]:
    wb["Tracking"].conditional_formatting.add(f"Y{TF}:Y{TL}", CellIsRule(
        operator="equal", formula=[f'"{state}"'],
        font=Font(name=F, size=10, bold=True, color=fc), fill=PatternFill("solid", fgColor=bg)))
wb["Target_FY"].conditional_formatting.add(
    f"{get_column_letter(C_CHECK)}{DATA_FIRST}:{get_column_letter(C_CHECK)}{TGT_LAST}",
    CellIsRule(operator="equal", formula=['"OK"'],
               font=Font(name=F, size=9, bold=True, color="006100"),
               fill=PatternFill("solid", fgColor="C6EFCE")))

# ============================================================== SAMPLE DATA ====
people = [
    ("SE-001", "SPEC", "HA NOI", "Nguyen Thi Lan", "HUNG", "Ha Noi 1", "Sales Executive", 120),
    ("SE-002", "SPEC", "HA NOI", "Nguyen Thi Lan", "DUY", "Ha Noi 2", "Sales Executive", 120),
    ("SE-003", "SPEC", "HCMC", "Tran Quang Minh", "QUYEN", "HCMC 1", "Sales Executive", 130),
    ("SE-004", "SPEC", "HCMC", "Tran Quang Minh", "Pham Minh Chau", "HCMC 2", "Sales Executive", 130),
    ("SE-005", "SPEC", "NORTH", "Nguyen Thi Lan", "Vo Thi Em", "Bac Ninh", "Sales Supervisor", 110),
    ("SE-006", "SPEC", "MEKONG", "Tran Quang Minh", "Ngo Van Phuc", "Can Tho", "Sales Executive", 110),
]
tm = wb["Team_Master"]
for i, p in enumerate(people):
    r = DATA_FIRST + i
    for j, v in enumerate(p[:7]):
        tm.cell(row=r, column=3 + j).value = v
    tm.cell(row=r, column=10).value = "Active"
    tm.cell(row=r, column=12).value = p[7]
    c = tm.cell(row=r, column=16)
    c.value = "SAMPLE – xoá trước khi dùng thật"
    c.font = f(9, False, RED_TXT, it=True)

# FY targets per person: Invoiced Value / Site check / Spec-in Value / Engaged / Design
fy_targets = [
    [12000, 215, 4250, 80, 85],
    [10500, 216, 3900, 75, 78],
    [13800, 230, 4600, 88, 92],
    [11200, 205, 4100, 78, 82],
    [ 8600, 190, 3400, 65, 68],
    [ 7900, 180, 3100, 60, 62],
]
perf = [1.03, 0.94, 1.08, 0.88, 0.99, 1.12]
season = [0.85, 0.62, 0.95, 1.00, 1.02, 1.05, 1.00, 1.03, 1.08, 1.12, 1.15, 1.13]
ssum = sum(season)
random.seed(11)
wk = wb["Weekly_Tracker"]
tg = wb["Target_FY"]

for p, targets in enumerate(fy_targets):
    for k, fy in enumerate(targets):
        tg.cell(row=DATA_FIRST + p * NK + k, column=C_FYTGT).value = fy
        # monthly split, remainder into December
        monthly = [int(round(fy * season[m] / ssum)) for m in range(12)]
        monthly[11] += fy - sum(monthly)
        rp, ra = wk_row(p, k, 0), wk_row(p, k, 1)
        for m in range(12):
            s, _ = week_cols(m)
            base = monthly[m] // 4
            weeks = [base, base, base, monthly[m] - 3 * base]
            for w in range(4):
                wk.cell(row=rp, column=s + w).value = weeks[w]
                if m < 9:      # actual closed through September
                    wk.cell(row=ra, column=s + w).value = max(
                        0, int(round(weeks[w] * perf[p] * random.uniform(0.82, 1.18))))

for name in ["KPI_Framework", "Team_Master", "Weekly_Tracker", "Target_FY", "Actual_Monthly",
             "Tracking", "Incentive_Calc", "Dashboard"]:
    s = wb[name]
    s.page_setup.orientation = "landscape"
    s.page_setup.fitToWidth = 1
    s.sheet_properties.pageSetUpPr.fitToPage = True

wb.active = wb.index(wb["Guide"])
out = os.path.join(BASE, "Dulux_Channel_KPI_Incentive_Tracker_2026_Template.xlsx")
wb.save(out)
print("part3 ok ->", out)
