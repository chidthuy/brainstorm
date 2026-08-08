"""Tạo bảng chia tiền chuyến đi — một sheet duy nhất, mọi số liệu chạy bằng công thức."""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

ARIAL = "Arial"
BLUE, BLACK, DARK, MUTED = "0000FF", "000000", "1F3B4D", "5A6B71"
MONEY = '#,##0;(#,##0);-'
thin = Side(style="thin", color="B7C4CC")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
TOTAL_BORDER = Border(left=thin, right=thin,
                      top=Side(style="medium", color=DARK),
                      bottom=Side(style="medium", color=DARK))
HDR_FILL = PatternFill("solid", fgColor="1F3B4D")
TOTAL_FILL = PatternFill("solid", fgColor="DCE6EC")
NOTE_FILL = PatternFill("solid", fgColor="FFF9DB")

wb = Workbook()
ws = wb.active
ws.title = "Chia tiền"

def put(r, c, v, *, bold=False, size=10, color=BLACK, italic=False,
        fmt=None, fill=None, border=None, align=None):
    cell = ws.cell(row=r, column=c, value=v)
    cell.font = Font(name=ARIAL, size=size, bold=bold, color=color, italic=italic)
    if fmt:    cell.number_format = fmt
    if fill:   cell.fill = fill
    if border: cell.border = border
    if align:  cell.alignment = Alignment(horizontal=align, vertical="center", wrap_text=True)
    return cell

def header_row(r, labels):
    for i, t in enumerate(labels, start=1):
        put(r, i, t, bold=True, size=10, color="FFFFFF",
            fill=HDR_FILL, border=BOX, align="center")

def band(r, ncol, fill):
    for c in range(1, ncol + 1):
        ws.cell(row=r, column=c).border = BOX
        if fill:
            ws.cell(row=r, column=c).fill = fill

def section(r, text):
    put(r, 1, text, bold=True, size=11, color=DARK)

put(1, 1, "BẢNG CHIA TIỀN CHUYẾN ĐI — 6 NGƯỜI", bold=True, size=14, color=DARK)
put(2, 1, "Ô chữ xanh là số nhập tay, còn lại tự tính. Sửa ô xanh là cả bảng cập nhật theo.",
    size=9, italic=True, color=MUTED)

# ---- 1. Chi phí ----------------------------------------------------------
section(4, "1. CHI PHÍ")
HDR = 5
header_row(HDR, ["Khoản chi", "Số tiền", "Chi trả", "Tú trả", "Việt trả", "Mỗi người"])

items = [
    ("Lưu trú",           13700000, 0,       0),
    ("Ăn trưa Cậu Khấu",   1228000, 0,       0),
    ("Ăn tối Hồng Phát",   2257400, 0,       0),
    ("Bar",                1075200, 0,       0),
    ("Ăn sáng",             680000, 0,       0),
    ("Cafe sáng",           723600, 0,       0),
    ("Ăn tối BBQ",               0, 1100000, 1000000),
    ("Ăn sáng 2",           645000, 0,       0),
    ("Snack",               584445, 0,       0),
    ("Snack (thêm)",        180000, 0,       0),
]
E0 = HDR + 1
for i, (name, chi, tu, viet) in enumerate(items):
    r = E0 + i
    put(r, 1, name)
    put(r, 2, f"=SUM(C{r}:E{r})", bold=True, fmt=MONEY)
    for col, val in ((3, chi), (4, tu), (5, viet)):
        put(r, col, val, color=BLUE, fmt=MONEY)
    put(r, 6, f"=B{r}/$B$%d" % (E0 + len(items) + 2), fmt=MONEY)
    band(r, 6, PatternFill("solid", fgColor="EDF2F4") if i % 2 else None)

ETOT = E0 + len(items)
put(ETOT, 1, "TỔNG CHI", bold=True)
for col, L in ((2, "B"), (3, "C"), (4, "D"), (5, "E"), (6, "F")):
    put(ETOT, col, f"=SUM({L}{E0}:{L}{ETOT-1})", bold=True, fmt=MONEY)
band(ETOT, 6, TOTAL_FILL)
for c in range(1, 7):
    ws.cell(row=ETOT, column=c).border = TOTAL_BORDER

# ---- 2. Thông số ---------------------------------------------------------
P0 = ETOT + 2          # dòng đầu khối thông số = ETOT+2, "Số người" nằm ở B(P0)
section(P0 - 0, None) if False else None
params = [
    ("Số người",              6,                      BLUE, False),
    ("Tiền cọc mỗi người",    3000000,                BLUE, False),
    ("Tổng quỹ cọc",          f"=B{P0}*B{P0+1}",      BLACK, False),
    ("Tổng chi phí",          f"=B{ETOT}",            BLACK, False),
    ("Mỗi người phải chịu",   f"=B{P0+3}/B{P0}",      BLACK, True),
    ("Còn phải bù mỗi người", f"=B{P0+4}-B{P0+1}",    BLACK, True),
]
for i, (label, val, color, hi) in enumerate(params):
    r = P0 + i
    put(r, 1, label, bold=hi, border=BOX, fill=TOTAL_FILL if hi else None)
    put(r, 2, val, bold=hi, color=color, border=BOX,
        fmt=("0" if i == 0 else MONEY), fill=TOTAL_FILL if hi else None)

N_ROW, DEP_ROW, FUND_ROW, SHARE_ROW, TOPUP_ROW = P0, P0 + 1, P0 + 2, P0 + 4, P0 + 5

# ---- 3. Chốt sổ ----------------------------------------------------------
S_TITLE = P0 + 7
section(S_TITLE, "2. CHỐT SỔ")
SHDR = S_TITLE + 1
header_row(SHDR, ["Thành viên", "Cọc đã đóng", "Đã ứng ngoài quỹ",
                  "Phải chịu", "Chênh lệch", "Chốt (làm tròn 100đ)"])

# Chi đứng đầu: phần lẻ do làm tròn được gom về dòng của Chi
members = [
    ("Chi",   f"=C{ETOT}-$B${FUND_ROW}"),
    ("Quỳnh", 0),
    ("Hà",    0),
    ("Hiếu",  0),
    ("Việt",  f"=E{ETOT}"),
    ("Tú",    f"=D{ETOT}"),
]
M0 = SHDR + 1
for i, (name, advance) in enumerate(members):
    r = M0 + i
    put(r, 1, name, bold=True)
    put(r, 2, f"=$B${DEP_ROW}", fmt=MONEY)
    put(r, 3, advance, color=BLACK if isinstance(advance, str) else BLUE, fmt=MONEY)
    put(r, 4, f"=$B${SHARE_ROW}", fmt=MONEY)
    put(r, 5, f"=B{r}+C{r}-D{r}", fmt=MONEY)
    put(r, 6, f"=-SUM(F{M0+1}:F{M0+5})" if i == 0 else f"=ROUND(E{r},-2)",
        bold=True, fmt=MONEY)
    band(r, 6, PatternFill("solid", fgColor="EDF2F4") if i % 2 else None)

MTOT = M0 + len(members)
put(MTOT, 1, "TỔNG", bold=True)
for col, L in ((2, "B"), (3, "C"), (4, "D"), (5, "E"), (6, "F")):
    put(MTOT, col, f"=SUM({L}{M0}:{L}{MTOT-1})", bold=True, fmt=MONEY)
band(MTOT, 6, TOTAL_FILL)
for c in range(1, 7):
    ws.cell(row=MTOT, column=c).border = TOTAL_BORDER
put(MTOT + 1, 1, "Chênh lệch dương = được nhận lại, âm = phải trả thêm. Cột TỔNG của "
                 "'Chênh lệch' phải bằng 0 thì sổ mới cân.", size=9, italic=True, color=MUTED)

# ---- 4. Chuyển tiền ------------------------------------------------------
T_TITLE = MTOT + 3
section(T_TITLE, "3. CHUYỂN TIỀN (5 lượt là xong)")
CHI, QUYNH, HA, HIEU, VIET, TU = (M0 + i for i in range(6))
T0 = T_TITLE + 1
transfers = [
    ("Quỳnh  →  Chi",  f"=-F{QUYNH}"),
    ("Hà  →  Chi",     f"=-F{HA}"),
    ("Hiếu  →  Tú",    f"=F{TU}"),
    ("Hiếu  →  Việt",  f"=F{VIET}"),
    ("Hiếu  →  Chi",   f"=-F{HIEU}-B{T0+2}-B{T0+3}"),
]
for i, (label, formula) in enumerate(transfers):
    r = T0 + i
    put(r, 1, label, border=BOX)
    put(r, 2, formula, bold=True, fmt=MONEY, border=BOX)

# ---- Ghi chú -------------------------------------------------------------
notes = [
    "GHI CHÚ",
    "• Giả định: tiền cọc 3.000.000/người gom thành quỹ chung do Chi giữ, và Chi dùng quỹ này để thanh toán.",
    "• Toàn bộ các khoản do Chi trả, trừ bữa BBQ do Tú trả 1.100.000 và Việt trả 1.000.000 (số liệu người dùng cung cấp).",
    "• 'Đã ứng ngoài quỹ' của Chi = tổng Chi thanh toán − tổng quỹ cọc, tức phần Chi bỏ tiền túi thêm.",
    "• Cột 'Chốt' làm tròn đến 100đ; phần lẻ gom vào dòng của Chi để tổng thu và tổng chi luôn khớp.",
    "• Nếu tiền cọc thực tế nộp cho bên khác chứ không phải Chi giữ, sửa lại cột 'Đã ứng ngoài quỹ' cho đúng.",
]
NB = T0 + len(transfers) + 2
for i, t in enumerate(notes):
    put(NB + i, 1, t, size=9, bold=(i == 0), italic=(i > 0),
        color=DARK if i == 0 else MUTED, fill=None if i == 0 else NOTE_FILL)

for col, w in zip("ABCDEF", (30, 17, 19, 16, 16, 21)):
    ws.column_dimensions[col].width = w
ws.sheet_view.showGridLines = False
ws.freeze_panes = "A3"

wb.save("/home/user/brainstorm/group-travel-split/chia-tien-chuyen-di.xlsx")
print("saved")
