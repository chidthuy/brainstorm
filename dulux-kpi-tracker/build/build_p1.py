# -*- coding: utf-8 -*-
"""Part 1: Guide, Parameters, KPI_Framework, Team_Master."""
from common import *
import os
BASE = os.path.dirname(os.path.abspath(__file__))
wb = Workbook()

# =================================================================== GUIDE =====
ws = wb.active
ws.title = "Guide"
ws.sheet_view.showGridLines = False
widths(ws, {"A": 3, "B": 36, "C": 100})
title(ws, "B2", "DULUX – SALES CHANNEL KPI & INCENTIVE TRACKER 2026", 16)
put(ws, 3, 2, "Target → Phasing theo tuần → Actual → Performance tracking → Incentive",
    font=f(11, False, "595959", it=True), border=False)

rows = [
    ("SECTION", "1. BỘ KPI ĐANG ÁP DỤNG", ""),
    ("KPI", "LEAD KPI – 70% – review & trả theo QUÝ",
     "Invoiced Value 50%  +  Key account approach / Site check 20%.  Hai chỉ số đo được thường xuyên để các bạn chạy và review hàng tuần/hàng quý."),
    ("KPI", "FOCUS KPI – 30% – chốt & trả CUỐI NĂM",
     "Spec-in Value 15%  +  Engaged Architect (Submit Design) 15%."),
    ("KPI", "Spec-in Design – theo dõi, weight 0%",
     "Số design nộp là chỉ số dẫn dắt của Spec-in Value (~50 MVND/design). Vẫn phase & track như 4 KPI kia nhưng chưa tính điểm – nếu quyết định tính điểm thì chỉ cần gõ weight vào KPI_Framework!F10 và chia lại 4 KPI còn lại cho tổng = 100%."),
    ("BLANK", "", ""),
    ("SECTION", "2. QUY TRÌNH SỬ DỤNG / HOW TO USE", ""),
    ("STEP", "Bước 1 – Parameters", "Điền tên kênh, quý đang chốt. Chốt tỷ trọng Lead/Focus, đường trả thưởng (threshold–target–cap), pass gate, danh sách region."),
    ("STEP", "Bước 2 – KPI_Framework", "Chốt 5 KPI và weight. Tổng weight phải = 100% (ô kiểm tra sẽ báo đỏ nếu lệch)."),
    ("STEP", "Bước 3 – Team_Master", "Nhập nhân sự: mã NV, team, region, line manager, area, số tháng hưởng, ATVP (quỹ thưởng mục tiêu cả năm)."),
    ("STEP", "Bước 4 – Target_FY", "Nhập FY Target chính thức của từng người cho từng KPI (cột G). Ví dụ: Site check 215 roadshow, Engaged architect 80 D&B, Spec-in design 85, Spec-in value 4,250 MVND."),
    ("STEP", "Bước 5 – Weekly_Tracker ⭐", "SHEET NHẬP LIỆU DUY NHẤT. Mỗi người 5 KPI × 3 dòng (Phasing / Actual / % Achieved), 12 tháng × 5 tuần. Phase target xuống từng tuần, hàng tuần điền Actual. Cột 'Check' ở Target_FY báo ngay nếu phasing cộng lại chưa khớp FY target."),
    ("STEP", "Bước 6 – Target_FY & Actual_Monthly", "Tự động: gom tuần → tháng → quý → luỹ kế YTD. Không nhập tay."),
    ("STEP", "Bước 7 – Tracking", "Tự động: achievement luỹ kế theo quý, payout factor từng KPI, Lead factor, Focus factor, pass gate, trạng thái RAG."),
    ("STEP", "Bước 8 – Incentive_Calc", "Tự động: tiền Lead trả từng quý + Focus trả cuối năm + tổng FY của từng người."),
    ("STEP", "Bước 9 – Dashboard", "Toàn kênh / theo region / theo từng người tại quý chọn ở Parameters!C7."),
    ("BLANK", "", ""),
    ("SECTION", "3. QUY TẮC TÍNH / CALCULATION RULES", ""),
    ("RULE", "Lead KPI – 70%", "Đo LUỸ KẾ theo quý (Q3 = Jan–Sep). Tiền quý n = Lead pot × n/4 × factor luỹ kế đến quý n − số đã trả các quý trước."),
    ("RULE", "Focus KPI – 30%", "Đo luỹ kế cả năm, trả 1 lần sau khi chốt Q4, tối đa 150%."),
    ("RULE", "Payout curve", "< 80% → 0%.  80% → 50%.  100% → 100%.  ≥ 120% → 150% (trần). Nội suy tuyến tính giữa các mốc. Sửa mốc tại Parameters mục C."),
    ("RULE", "Pass gate", "Kết quả Focus KPI khoá tiền Lead KPI: Focus ≥100% mở 100%; ≥90% mở 90%; ≥80% mở 80%; <80% không trả. Bật/tắt tại Parameters!C23."),
    ("RULE", "Prorate", "Người vào/ra giữa năm: điền số tháng hưởng ở Team_Master cột K, ATVP tự prorate."),
    ("BLANK", "", ""),
    ("SECTION", "4. QUY ƯỚC MÀU / COLOR LEGEND", ""),
    ("LEGEND_IN", "Chữ XANH DƯƠNG trên nền vàng nhạt", "Ô NHẬP LIỆU – chỉ gõ vào các ô này (Weekly_Tracker, Target_FY cột G, Team_Master, Parameters)."),
    ("LEGEND_FM", "Chữ ĐEN", "Công thức – không sửa."),
    ("LEGEND_LK", "Chữ XANH LÁ", "Lấy từ sheet khác – không sửa."),
    ("LEGEND_HD", "Nền xanh nhạt / vàng nhạt / xám", "Nhóm Lead KPI · nhóm Focus KPI · KPI chỉ theo dõi."),
    ("BLANK", "", ""),
    ("SECTION", "5. ĐIỂM CẦN CHỐT VỚI HR / BU", ""),
    ("ASSUME", "a. KPI thứ 5 có tính điểm không?", "Hiện Spec-in Design để weight 0%. Nếu chốt tính điểm cho đủ 5 mục thì chia lại weight (VD Focus 30% = Spec-in value 10% + Engaged 10% + Design 10%)."),
    ("ASSUME", "b. Payout tại ngưỡng 80%", "Đang giả định 50%. File Product Consultant chỉ ghi performance range 80–120, không ghi mức trả tại 80%."),
    ("ASSUME", "c. Hai bậc giữa của pass gate", "File mẫu chỉ ghi ≥100% trả 100% và <80% trả 0%; mức 90% và 80% đang giả định 90%/80%."),
    ("ASSUME", "d. Định nghĩa Site check hợp lệ", "Cần chốt: thế nào là 1 roadshow/site check được tính (check-in trên app? có biên bản? tối thiểu bao nhiêu phút?)."),
    ("ASSUME", "e. Định nghĩa Engaged Architect", "Tính theo tài khoản KTS duy nhất/năm hay theo lượt submit? Điều kiện ghi nhận trên CRM."),
    ("ASSUME", "f. Spec-in Value", "Ghi nhận lúc spec-in hay lúc convert ra đơn? Xử lý thế nào khi dự án rớt?"),
    ("ASSUME", "g. ATVP từng người", "Do HR cấp – file đang để số minh hoạ."),
    ("ASSUME", "h. Clawback", "Mặc định KHÔNG thu hồi khi quý sau tụt (Parameters!C31 = N)."),
    ("BLANK", "", ""),
    ("SECTION", "6. DỮ LIỆU MẪU", ""),
    ("NOTE", "6 nhân sự mẫu (SE-001…SE-006)",
     "Phasing cả năm + Actual Jan–Sep là SỐ MINH HOẠ. Xoá trước khi dùng thật: xoá dòng 6–11 ở Team_Master, xoá vùng tuần ở Weekly_Tracker và cột G ở Target_FY."),
    ("NOTE", "Không chèn/xoá dòng giữa bảng",
     "Target_FY / Actual_Monthly / Weekly_Tracker / Tracking / Incentive_Calc khớp dòng theo đúng thứ tự Team_Master. Template có sẵn 15 slot nhân sự."),
]
r = 5
for kind, a, b in rows:
    if kind == "BLANK":
        r += 1
        continue
    if kind == "SECTION":
        c = put(ws, r, 2, a, font=f(11, True, WHITE), fill=BLUE_H, border=False)
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
        c.alignment = Alignment(horizontal="left", vertical="center")
        ws.row_dimensions[r].height = 20
    else:
        fill = {"LEGEND_IN": INPUT_FILL, "LEGEND_HD": LEAD_FILL, "ASSUME": NOTE_FILL,
                "KPI": CALC_FILL}.get(kind)
        font = f(10, True, BLUE_TXT) if kind == "LEGEND_IN" else (
               f(10, True, GREEN_TXT) if kind == "LEGEND_LK" else f(10, True))
        put(ws, r, 2, a, font=font, fill=fill, wrap=True, align="left")
        put(ws, r, 3, b, wrap=True, align="left", fill=fill)
        ws.row_dimensions[r].height = 30
    r += 1
put(ws, r + 1, 2, "Version 2.0 · 2026-09-17 · bộ KPI: Invoiced Value / Site check / Spec-in Value / Engaged Architect / Spec-in Design",
    font=f(9, False, "808080", it=True), border=False)

# ============================================================== PARAMETERS =====
ws = wb.create_sheet("Parameters")
ws.sheet_view.showGridLines = False
widths(ws, {"A": 3, "B": 46, "C": 18, "D": 62})
title(ws, "B2", "PARAMETERS / THÔNG SỐ ĐIỀU KHIỂN")
put(ws, 3, 2, "Tất cả sheet khác lấy thông số từ đây. Chỉ sửa ô màu vàng.",
    font=f(10, False, "595959", it=True), border=False)

def sect(r, text):
    c = put(ws, r, 2, text, font=f(10, True, WHITE), fill=BLUE_H)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
    c.alignment = Alignment(horizontal="left", vertical="center")

def param(r, label, value, nf=None, note="", inp=True):
    put(ws, r, 2, label, wrap=True)
    put(ws, r, 3, value, nf=nf, align="center",
        font=f(10, True, BLUE_TXT) if inp else f(10, True),
        fill=INPUT_FILL if inp else CALC_FILL)
    put(ws, r, 4, note, font=f(9, False, "595959", it=True), wrap=True)

sect(5, "A. THÔNG TIN CHUNG / GENERAL")
param(6, "Sales channel / Tên kênh", "Dulux – <điền tên kênh>", note="VD: Project / Specification channel.")
param(7, "Quý đang chốt (1–4) / Reporting quarter", 3, nf="0", note="Dashboard hiển thị luỹ kế đến quý này.")
param(8, "Đơn vị tiền / Currency unit", "MVND", note="Triệu đồng – giữ nhất quán mọi sheet.")

sect(9, "B. CHIA TỶ TRỌNG THƯỞNG / VARIABLE PAY SPLIT")
param(10, "Lead KPI share – trả theo QUÝ", 0.70, nf=PCT0)
param(11, "Focus KPI share – trả theo NĂM", 0.30, nf=PCT0)
put(ws, 12, 2, "Check = 100%", font=f(10, True))
put(ws, 12, 3, "=C10+C11", nf=PCT0, align="center", font=f(10, True), fill=CALC_FILL)
put(ws, 12, 4, '=IF(ROUND(C10+C11,6)=1,"OK","LỖI: tổng phải = 100%")', font=f(9, True, RED_TXT))

sect(13, "C. ĐƯỜNG TRẢ THƯỞNG / PAYOUT CURVE")
hdr(ws, 14, 2, "Mốc / Point"); hdr(ws, 14, 3, "Giá trị"); hdr(ws, 14, 4, "Ghi chú")
param(15, "Threshold achievement (dưới mức này = 0đ)", 0.80, nf=PCT0, note="Performance range 80–120 theo file mẫu.")
param(16, "Payout tại threshold", 0.50, nf=PCT0, note="GIẢ ĐỊNH – cần HR xác nhận.")
param(17, "Target achievement", 1.00, nf=PCT0)
param(18, "Payout tại target", 1.00, nf=PCT0)
param(19, "Max achievement (cap)", 1.20, nf=PCT0)
param(20, "Payout tại cap", 1.50, nf=PCT0, note="Trần 150% theo ghi chú file mẫu.")
put(ws, 21, 2, "Giữa các mốc: nội suy tuyến tính. Trên cap: giữ nguyên mức cap.",
    font=f(9, False, "595959", it=True), border=False)

sect(22, "D. PASS GATE – Focus KPI khoá tiền Lead KPI")
param(23, "Gate ON / OFF", "ON", note="OFF = trả đủ Lead KPI, bỏ qua gate.")
hdr(ws, 24, 2, "Focus KPI achievement ≥"); hdr(ws, 24, 3, "% tiền Lead được trả"); hdr(ws, 24, 4, "Ghi chú")
for i, (bound, pay, note) in enumerate([
        (1.00, 1.00, "Theo file mẫu: ≥100% → trả 100%."),
        (0.90, 0.90, "GIẢ ĐỊNH – cần chốt."),
        (0.80, 0.80, "GIẢ ĐỊNH – cần chốt."),
        (None, 0.00, "Theo file mẫu: <80% → trả 0%.")]):
    r = 25 + i
    put(ws, r, 2, bound if bound is not None else "< 80%", nf=PCT0 if bound else None,
        align="center", font=f(10, True, BLUE_TXT), fill=INPUT_FILL)
    put(ws, r, 3, pay, nf=PCT0, align="center", font=f(10, True, BLUE_TXT), fill=INPUT_FILL)
    put(ws, r, 4, note, font=f(9, False, "595959", it=True), wrap=True)

sect(29, "E. TRUE-UP / CLAWBACK")
put(ws, 30, 2, "Cơ chế luỹ kế: tiền quý = số hưởng luỹ kế − số đã trả.", font=f(9, False, "595959", it=True))
param(31, "Cho phép true-up âm (thu hồi) Y/N", "N", note="N = quý tụt thì trả 0, không thu hồi.")

sect(32, "F. DANH SÁCH REGION / REGION LIST")
for i, reg in enumerate(["HA NOI", "HCMC", "NORTH", "NCENT", "SCENT", "HCMEX", "MEKONG", ""]):
    put(ws, 33 + i, 2, reg, font=f(10, True, BLUE_TXT), fill=INPUT_FILL)
put(ws, 33, 4, "Sửa/thêm region tại B33:B40 – Dashboard đọc đúng danh sách này.",
    font=f(9, False, "595959", it=True), wrap=True)

sect(41, "G. LỊCH QUÝ / THÁNG / TUẦN")
put(ws, 42, 2, "Q1 = Jan–Mar · Q2 = Apr–Jun · Q3 = Jul–Sep · Q4 = Oct–Dec", font=f(10))
put(ws, 42, 4, "Weekly_Tracker: mỗi tháng có 5 ô tuần (W1–W5); tháng chỉ có 4 tuần thì để trống W5.",
    font=f(9, False, "595959", it=True), wrap=True)

for cell, lst in (("C23", '"ON,OFF"'), ("C31", '"Y,N"'), ("C7", '"1,2,3,4"')):
    dv = DataValidation(type="list", formula1=lst, allow_blank=True)
    ws.add_data_validation(dv); dv.add(ws[cell])

# =========================================================== KPI FRAMEWORK =====
ws = wb.create_sheet("KPI_Framework")
ws.sheet_view.showGridLines = False
title(ws, "B2", "2026 KPIs OF SALES FORCE INCENTIVE – <TÊN KÊNH> – FY2026")
put(ws, 3, 2, "Tracking / Incentive đọc weight trực tiếp từ cột Weight bên dưới. Sửa weight ở đây là cả file đổi theo.",
    font=f(10, False, "595959", it=True), border=False)
widths(ws, {"A": 3, "B": 9, "C": 32, "D": 30, "E": 11, "F": 10, "G": 11, "H": 20, "I": 12,
            "J": 13, "K": 22, "L": 56})
for i, h in enumerate(["KPI code", "KPI (EN)", "Tên KPI (VN)", "Group", "Weight", "Weight in group",
                       "Measurement frequency", "Payout", "Unit", "Data source",
                       "Định nghĩa / Definition"]):
    hdr(ws, 5, i + 2, h)
ws.row_dimensions[5].height = 36

for i, (code, en, vn, grp, wt, unit, src, defn) in enumerate(KPIS):
    r = 6 + i
    fill = LEAD_FILL if grp == "Lead" else (FOCUS_FILL if grp == "Focus" else TRACK_FILL)
    freq = "Quarterly cumulative" if grp == "Lead" else "Yearly cumulative"
    pay = "Quarterly" if grp == "Lead" else ("Annual" if grp == "Focus" else "n/a")
    put(ws, r, 2, code, align="center", font=f(10, True), fill=fill)
    put(ws, r, 3, en, font=f(10, True), fill=fill, wrap=True)
    put(ws, r, 4, vn, fill=fill, wrap=True)
    put(ws, r, 5, grp, align="center", fill=fill)
    put(ws, r, 6, wt, nf=PCT0, align="center", font=f(10, True, BLUE_TXT), fill=INPUT_FILL)
    put(ws, r, 7, f"=IFERROR(F{r}/SUMIF($E$6:$E$10,E{r},$F$6:$F$10),0)", nf=PCT0, align="center")
    put(ws, r, 8, freq, align="center", fill=fill)
    put(ws, r, 9, pay, align="center", fill=fill)
    put(ws, r, 10, unit, align="center", fill=fill)
    put(ws, r, 11, src, fill=fill, wrap=True)
    put(ws, r, 12, defn, wrap=True)
    ws.row_dimensions[r].height = 32

put(ws, 11, 5, "TOTAL", font=f(10, True), align="right")
put(ws, 11, 6, "=SUM(F6:F10)", nf=PCT0, align="center", font=f(10, True), fill=CALC_FILL)
put(ws, 11, 8, '=IF(ROUND(SUM(F6:F10),6)=1,"OK – tổng weight = 100%","LỖI: tổng weight phải = 100%")',
    font=f(10, True, RED_TXT))
put(ws, 12, 5, "Lead group", font=f(10, True), align="right")
put(ws, 12, 6, '=SUMIF($E$6:$E$10,"Lead",$F$6:$F$10)', nf=PCT0, align="center", fill=CALC_FILL)
put(ws, 12, 8, f'=IF(ROUND(F12,6)=ROUND({P_LEAD},6),"OK – khớp Parameters","LỆCH so với Parameters!C10")',
    font=f(10, True, RED_TXT))
put(ws, 13, 5, "Focus group", font=f(10, True), align="right")
put(ws, 13, 6, '=SUMIF($E$6:$E$10,"Focus",$F$6:$F$10)', nf=PCT0, align="center", fill=CALC_FILL)
put(ws, 13, 8, f'=IF(ROUND(F13,6)=ROUND({P_FOCUS},6),"OK – khớp Parameters","LỆCH so với Parameters!C11")',
    font=f(10, True, RED_TXT))

for i, n in enumerate([
    "*/ Lead KPIs: đo luỹ kế theo quý, trả thưởng hàng quý, cap 150%.",
    "*/ Focus KPIs: đo luỹ kế cả năm, trả 1 lần cuối năm, tối đa 150%.",
    "*/ Pass gate: Focus KPI quyết định % tiền Lead KPI được giải ngân (Parameters mục D).",
    "*/ K5 Spec-in Design weight 0% – chỉ theo dõi. Muốn tính điểm: gõ weight vào F10 và chia lại F6:F9 cho tổng = 100%.",
    "*/ Điều kiện ghi nhận: tên & mã nhân viên phải khớp giữa DERP / CRM / Mini Sales app.",
]):
    put(ws, 15 + i, 2, n, font=f(9, False, RED_TXT, it=True), border=False)

# ============================================================== TEAM MASTER ====
ws = wb.create_sheet("Team_Master")
ws.sheet_view.showGridLines = False
title(ws, "B2", "TEAM MASTER – DANH SÁCH NHÂN SỰ & QUỸ THƯỞNG")
put(ws, 3, 2, "Nhập từ cột Emp Code đến ATVP. Thứ tự dòng ở đây quyết định thứ tự khối của mọi sheet khác – "
              "KHÔNG chèn/xoá dòng giữa bảng, chỉ ghi đè hoặc xoá nội dung.",
    font=f(10, False, RED_TXT, it=True), border=False)
widths(ws, {"A": 3, "B": 6, "C": 12, "D": 14, "E": 14, "F": 18, "G": 22, "H": 18, "I": 20,
            "J": 11, "K": 12, "L": 14, "M": 14, "N": 13, "O": 13, "P": 26})
for i, h in enumerate(["No", "Emp Code", "Team", "Region", "Line Manager", "Name of Sales Person",
                       "Area", "Role", "Status", "Eligible months (0–12)", "ATVP full year",
                       "ATVP prorated", "Lead pot (70%)", "Focus pot (30%)", "Note"]):
    hdr(ws, 5, i + 2, h)
ws.row_dimensions[5].height = 40
for r in range(DATA_FIRST, MST_LAST + 1):
    put(ws, r, 2, f'=IF($C{r}="","",ROW()-5)', align="center", nf="0")
    for c in range(3, 11):
        put(ws, r, c, None, font=f(10, False, BLUE_TXT), fill=INPUT_FILL)
    put(ws, r, 11, 12, nf="0", align="center", font=f(10, False, BLUE_TXT), fill=INPUT_FILL)
    put(ws, r, 12, None, nf=MONEY, font=f(10, False, BLUE_TXT), fill=INPUT_FILL)
    put(ws, r, 13, f'=IF($C{r}="","",L{r}*MIN(K{r},12)/12)', nf=MONEY)
    put(ws, r, 14, f'=IF($C{r}="","",M{r}*{P_LEAD})', nf=MONEY, font=f(10, False, GREEN_TXT))
    put(ws, r, 15, f'=IF($C{r}="","",M{r}*{P_FOCUS})', nf=MONEY, font=f(10, False, GREEN_TXT))
    put(ws, r, 16, None, font=f(9, False, BLUE_TXT), fill=INPUT_FILL)
put(ws, MST_LAST + 1, 11, "TOTAL", font=f(10, True), align="right")
for c in (12, 13, 14, 15):
    L = get_column_letter(c)
    put(ws, MST_LAST + 1, c, f"=SUM({L}{DATA_FIRST}:{L}{MST_LAST})", nf=MONEY,
        font=f(10, True), fill=CALC_FILL)
put(ws, MST_LAST + 3, 2,
    "ATVP = Annual Target Variable Pay (quỹ thưởng mục tiêu cả năm của 1 người, do HR cấp), đơn vị theo Parameters!C8.",
    font=f(9, False, "595959", it=True), border=False)
dvr = DataValidation(type="list", formula1="=Parameters!$B$33:$B$40", allow_blank=True)
ws.add_data_validation(dvr); dvr.add(f"E{DATA_FIRST}:E{MST_LAST}")
dvs = DataValidation(type="list", formula1='"Active,Vacant,Left,New joiner"', allow_blank=True)
ws.add_data_validation(dvs); dvs.add(f"J{DATA_FIRST}:J{MST_LAST}")
ws.freeze_panes = "C6"

wb.save(os.path.join(BASE, "stage1.xlsx"))
print("part1 ok")
