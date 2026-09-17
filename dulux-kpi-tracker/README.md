# Dulux Sales Channel – KPI Tracker 2026

File: `Dulux_Channel_KPI_Tracker_2026.xlsx` — 4 sheet, không có sheet diễn giải.

| Sheet | Nội dung |
|---|---|
| `Setup` | Tham số + KPI/weight + danh sách nhân sự. Ô vàng = nhập. Có dropdown & check tự báo lỗi. |
| `Weekly_Tracker` | Sheet nhập liệu duy nhất: mỗi người 5 KPI × 3 dòng (Phasing / Actual / % Achieved) × 12 tháng × 5 tuần, kèm FY Target và cột Check. |
| `Tracking` | Luỹ kế theo quý: achievement, payout factor từng KPI, Lead factor, Focus factor, pass gate, net factor, status. Cuối sheet có tổng kênh tại quý chọn ở `Setup!C5`. |
| `Incentive` | Tiền Lead trả từng quý + Focus cuối năm + tổng FY từng người. |

## KPI & weight (Setup mục G)

| Code | KPI | Nhóm | Weight | Đơn vị |
|---|---|---|---|---|
| K1 | Invoiced Value | Lead 70% | 50% | MVND |
| K2 | Key account approach / Site check | Lead | 20% | Roadshow |
| K3 | Spec-in Value | Focus 30% | 15% | MVND |
| K4 | Engaged Architect (Submit Design) | Focus | 15% | D&B |
| K5 | Spec-in Design | Theo dõi | 0% | Designs |

Weight là ô nhập — đổi ở `Setup!E44:E48`, cả file tính lại. Muốn tính điểm cho đủ 5 KPI thì gõ weight cho K5 và chia lại 4 dòng trên sao cho tổng = 100% (ô check sẽ báo đỏ nếu lệch).

## Logic tính

- **Payout curve**: <80% → 0% · 80% → 50% · 100% → 100% · ≥120% → 150% (trần), nội suy tuyến tính. Mốc sửa ở `Setup` mục C.
- **Lead KPI**: đo luỹ kế theo quý (Q3 = Jan–Sep). `Tiền quý n = Lead pot × n/4 × factor luỹ kế đến quý n − tiền đã trả trước đó`. Quý tụt thì trả 0, không thu hồi (bật ở `Setup!C30`).
- **Focus KPI**: luỹ kế cả năm, trả 1 lần sau khi chốt Q4, cap 150%.
- **Pass gate**: Focus achievement khoá tiền Lead — ≥100% mở 100%, ≥90% mở 90%, ≥80% mở 80%, <80% = 0. Tắt bằng `Setup!C22 = OFF`.
- **Target luỹ kế = phasing luỹ kế**, nên so sánh giữa năm đúng với kế hoạch tới thời điểm đó.
- **Prorate**: số tháng hưởng ở `Setup` cột J.
- **Quý chưa chốt**: quý lớn hơn `Setup!C5` có status "Chưa chốt", không tính tiền. Focus chỉ trả khi `Setup!C5 = 4`. Vì vậy "Total Lead / TOTAL payout" là số **đã trả đến quý chốt**, không phải dự phóng cả năm.

## Validation có sẵn

- Dropdown: quý (1–4), Gate ON/OFF, clawback Y/N, Region (lấy từ `Setup` mục F), Status.
- Chặn nhập: weight 0–100%, mốc payout 0–300%, eligible months 0–12, ATVP ≥ 0, ô tuần chỉ nhận số ≥ 0.
- Check tự động: `Lead + Focus = 100%` · tổng weight = 100% · Lead/Focus weight khớp tỷ trọng · cột Check ở `Weekly_Tracker` báo "OK" hoặc "Lệch x" khi phasing cả năm chưa khớp FY Target.
- Cảnh báo màu: % Achieved theo tuần (đỏ <80%, vàng <100%, xanh ≥100%), thang màu ở các cột achievement, status On track / Watch / Behind.

## Dữ liệu mẫu

6 nhân sự (SE-001…SE-006) với phasing cả năm và actual Jan–Sep. Xoá trước khi dùng: `Setup` dòng 53–58, cột FY Target và vùng tuần ở `Weekly_Tracker`.

## Dựng lại & kiểm tra

```bash
pip install openpyxl && python3 build.py     # dựng file
python3 audit.py                              # soát mọi tham chiếu chéo sheet
pip install formulas && python3 check_values.py   # đối chiếu số tính ra với tính tay
```

`audit.py` kiểm tra 600 tham chiếu Tracking → Weekly_Tracker (đúng dòng KPI, đúng loại Phasing/Actual, đúng cột tuần cuối quý) cùng các tham chiếu sang `Setup`. `check_values.py` tính lại toàn bộ chuỗi target → achievement → payout factor → tiền thưởng bằng Python và so với kết quả công thức.
