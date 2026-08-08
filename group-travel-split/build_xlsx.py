"""Bảng chia tiền chuyến đi — một sheet, một bảng, mọi số chạy bằng công thức."""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

ARIAL, MONEY = "Arial", '#,##0'
BLUE, BLACK, DARK, MUTED = "0000FF", "000000", "1F3B4D", "5A6B71"
thin = Side(style="thin", color="C3CED4")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
TOTAL_BORDER = Border(left=thin, right=thin,
                      top=Side(style="medium", color=DARK),
                      bottom=Side(style="medium", color=DARK))
HDR_FILL = PatternFill("solid", fgColor="1F3B4D")
TOTAL_FILL = PatternFill("solid", fgColor="DCE6EC")
BAND_FILL = PatternFill("solid", fgColor="F2F6F8")

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

put(1, 1, "CHIA TIỀN CHUYẾN ĐI — 6 NGƯỜI", bold=True, size=14, color=DARK)
put(2, 1, "Chi, Quỳnh, Hà, Hiếu, Việt, Tú  ·  đơn vị: VNĐ  ·  ô chữ xanh là số nhập tay",
    size=9, italic=True, color=MUTED)

# --- bảng chính -----------------------------------------------------------
HDR = 4
for i, t in enumerate(["Loại chi phí", "Số tiền", "Người trả",
                       "Mỗi người", "Đã đóng", "Còn thiếu"], start=1):
    put(HDR, i, t, bold=True, color="FFFFFF", fill=HDR_FILL, border=BOX, align="center")

items = [
    ("Lưu trú",           13700000, "Chi"),
    ("Ăn trưa Cậu Khấu",   1228000, "Chi"),
    ("Ăn tối Hồng Phát",   2257400, "Chi"),
    ("Bar",                1075200, "Chi"),
    ("Ăn sáng",             680000, "Chi"),
    ("Cafe sáng",           723600, "Chi"),
    ("Ăn tối BBQ",         2100000, "Tú 1.100.000 · Việt 1.000.000"),
    ("Ăn sáng 2",           645000, "Chi"),
    ("Snack",               584445, "Chi"),
    ("Snack (thêm)",        180000, "Chi"),
]
R0 = HDR + 1
for i, (name, amount, payer) in enumerate(items):
    r = R0 + i
    fill = BAND_FILL if i % 2 else None
    put(r, 1, name, border=BOX, fill=fill)
    put(r, 2, amount, color=BLUE, fmt=MONEY, border=BOX, fill=fill)
    put(r, 3, payer, size=9, color=MUTED, border=BOX, fill=fill)
    put(r, 4, f"=B{r}/$H$4", fmt=MONEY, border=BOX, fill=fill)
    for c in (5, 6):
        put(r, c, None, border=BOX, fill=fill)

TOT = R0 + len(items)
put(TOT, 1, "TỔNG", bold=True)
put(TOT, 2, f"=SUM(B{R0}:B{TOT-1})", bold=True, fmt=MONEY)
put(TOT, 3, None)
put(TOT, 4, f"=SUM(D{R0}:D{TOT-1})", bold=True, fmt=MONEY)
put(TOT, 5, "=$H$5", bold=True, fmt=MONEY)
put(TOT, 6, f"=ROUND(D{TOT},0)-E{TOT}", bold=True, fmt=MONEY)
for c in range(1, 7):
    ws.cell(row=TOT, column=c).border = TOTAL_BORDER
    ws.cell(row=TOT, column=c).fill = TOTAL_FILL

put(TOT + 1, 1, "Mỗi người chịu chung một phần bằng nhau; đã đóng cọc rồi nên mỗi người còn thiếu "
                "phần chênh ở cột cuối.", size=9, italic=True, color=MUTED)

# --- tham số (cột H, tách khỏi bảng cho gọn) -------------------------------
put(3, 8, "THAM SỐ", bold=True, size=9, color=DARK)
put(4, 8, 6,       color=BLUE, fmt="0",   border=BOX)
put(4, 9, "Số người", size=9, color=MUTED)
put(5, 8, 3000000, color=BLUE, fmt=MONEY, border=BOX)
put(5, 9, "Tiền cọc mỗi người đã đóng", size=9, color=MUTED)

# --- chuyển tiền ----------------------------------------------------------
T = TOT + 3
put(T, 1, "CHUYỂN TIỀN", bold=True, size=11, color=DARK)
put(T, 3, "Mọi người đóng cho Chi, Chi bank lại phần đã ứng cho Việt & Tú.",
    size=9, italic=True, color=MUTED)

T0 = T + 1
for i, name in enumerate(["Quỳnh", "Hà", "Hiếu", "Việt", "Tú"]):
    r = T0 + i
    put(r, 1, f"{name}  →  Chi", border=BOX)
    put(r, 2, f"=$F${TOT}", bold=True, fmt=MONEY, border=BOX)

B0 = T0 + 5
for i, (name, amount) in enumerate([("Tú", 1100000), ("Việt", 1000000)]):
    r = B0 + i
    put(r, 1, f"Chi  →  {name}", border=BOX, fill=BAND_FILL)
    put(r, 2, amount, bold=True, color=BLUE, fmt=MONEY, border=BOX, fill=BAND_FILL)
    put(r, 3, "hoàn lại tiền đã ứng trả bữa BBQ", size=9, color=MUTED)

NET = B0 + 2
put(NET, 1, "Chi thực nhận", bold=True)
put(NET, 2, f"=SUM(B{T0}:B{T0+4})-SUM(B{B0}:B{B0+1})", bold=True, fmt=MONEY)
for c in range(1, 3):
    ws.cell(row=NET, column=c).border = TOTAL_BORDER
    ws.cell(row=NET, column=c).fill = TOTAL_FILL

put(NET + 2, 1, "Giả định: tiền cọc gom thành quỹ chung do Chi giữ và Chi dùng để thanh toán. "
                "Nếu cọc nộp cho bên khác thì cách chốt sẽ khác.", size=9, italic=True, color=MUTED)

for col, w in zip("ABCDEFGHI", (24, 15, 30, 15, 14, 14, 3, 14, 26)):
    ws.column_dimensions[col].width = w
ws.sheet_view.showGridLines = False

wb.save("/home/user/brainstorm/group-travel-split/chia-tien-chuyen-di.xlsx")
print("saved")
