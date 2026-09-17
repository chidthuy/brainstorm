# Dulux Sales Channel – KPI & Incentive Tracker 2026

Template Excel cho 1 sales channel của Dulux: **FY Target → Phasing theo tuần → Actual → Performance tracking → Incentive**.

File: `Dulux_Channel_KPI_Incentive_Tracker_2026_Template.xlsx`

## Bộ KPI (5 mục)

| Code | KPI | Nhóm | Weight | Đơn vị | Chu kỳ đo | Chu kỳ trả |
|---|---|---|---|---|---|---|
| K1 | Invoiced Value | **Lead – 70%** | 50% | MVND | Luỹ kế theo quý | Hàng quý |
| K2 | Key account approach / Site check | Lead | 20% | Roadshow | Luỹ kế theo quý | Hàng quý |
| K3 | Spec-in Value | **Focus – 30%** | 15% | MVND | Luỹ kế cả năm | Cuối năm |
| K4 | Engaged Architect (Submit Design) | Focus | 15% | D&B | Luỹ kế cả năm | Cuối năm |
| K5 | Spec-in Design (submitted design) | Theo dõi | 0% | Designs | Luỹ kế cả năm | – |

K5 là chỉ số dẫn dắt của K3 (~50 MVND/design). Đang để weight 0%; muốn tính điểm cho đủ 5 mục thì gõ weight vào `KPI_Framework!F10` và chia lại F6:F9 sao cho tổng = 100% — cả file tự tính lại.

## 9 sheet

| Sheet | Vai trò | Ai nhập |
|---|---|---|
| `Guide` | Hướng dẫn, quy ước màu, danh sách điểm cần chốt với HR/BU | – |
| `Parameters` | Tỷ trọng Lead/Focus, đường trả thưởng, pass gate, region, quý báo cáo | Channel manager |
| `KPI_Framework` | 5 KPI, weight, tần suất, data source, định nghĩa | Channel manager + HR |
| `Team_Master` | Nhân sự, số tháng hưởng, ATVP → tự chia Lead pot / Focus pot | HR + channel manager |
| `Weekly_Tracker` ⭐ | **Sheet nhập liệu duy nhất** – mỗi người 5 KPI × 3 dòng (Phasing / Actual / % Achieved) × 12 tháng × 5 tuần | Sales + sales admin |
| `Target_FY` | Nhập FY Target chính thức (cột G); phần còn lại gom từ phasing tuần; cột Check báo lệch | Channel manager |
| `Actual_Monthly` | Chỉ đọc – gom actual tuần → tháng → quý → YTD | – |
| `Tracking` | Achievement luỹ kế, payout factor từng KPI, Lead factor, Focus factor, pass gate, RAG | – |
| `Incentive_Calc` | Tiền Lead từng quý + Focus cuối năm + tổng FY từng người | – |
| `Dashboard` | Toàn kênh / theo region / theo từng người tại quý chọn ở `Parameters!C7` | – |

`Weekly_Tracker` giữ đúng format team đang dùng (Phasing / Actual / % Achieved theo tuần), nhưng nối thẳng lên tầng quý và tiền thưởng nên không phải nhập lại ở đâu nữa.

## Quy tắc tính

- **Payout curve** (`Parameters` mục C): <80% → 0% · 80% → 50% · 100% → 100% · ≥120% → 150% (trần), nội suy tuyến tính giữa các mốc.
- **Lead KPI trả luỹ kế**: `Tiền quý n = Lead pot × n/4 × factor luỹ kế đến quý n − tiền đã trả các quý trước`. Quý sau tụt thì trả 0, không thu hồi (bật clawback tại `Parameters!C31`).
- **Focus KPI**: luỹ kế cả năm, trả 1 lần sau khi chốt Q4, cap 150%.
- **Pass gate**: kết quả Focus KPI khoá tiền Lead KPI – ≥100% mở 100%, ≥90% mở 90%, ≥80% mở 80%, <80% không trả. Tắt bằng `Parameters!C23 = OFF`.
- **Target luỹ kế = phasing luỹ kế**, nên achievement giữa năm so đúng với kế hoạch tới thời điểm đó, không so với cả năm.
- **Prorate**: người vào/ra giữa năm điền số tháng hưởng ở `Team_Master` cột K.

## Quy ước màu

- Chữ **xanh dương** trên nền vàng nhạt = ô nhập liệu.
- Chữ **đen** = công thức · chữ **xanh lá** = lấy từ sheet khác. Không sửa.
- Nền xanh nhạt = Lead KPI · vàng nhạt = Focus KPI · xám = KPI chỉ theo dõi.

## Trước khi dùng thật

1. Xoá dữ liệu mẫu: `Team_Master` dòng 6–11, vùng tuần ở `Weekly_Tracker`, cột `FY Target (nhập)` ở `Target_FY`.
2. Chốt với HR/BU các điểm đang là giả định (liệt kê đầy đủ ở sheet `Guide` mục 5):
   - KPI thứ 5 có tính điểm không,
   - mức payout tại ngưỡng 80% (đang giả định 50%),
   - hai bậc giữa của pass gate (90% / 80%),
   - định nghĩa "site check hợp lệ" và "engaged architect",
   - thời điểm ghi nhận Spec-in Value,
   - ATVP từng người.
3. **Không chèn/xoá dòng giữa bảng** – `Weekly_Tracker`, `Target_FY`, `Actual_Monthly`, `Tracking`, `Incentive_Calc` khớp dòng theo thứ tự `Team_Master`. Template có sẵn 15 slot nhân sự; cần thêm thì mở rộng đồng thời cả 5 sheet (hoặc sửa `NPEOPLE` trong `build/common.py` rồi dựng lại).

## Dựng lại file

```bash
pip install openpyxl
cd build && python3 build_p1.py && python3 build_p2.py && python3 build_p3.py
```
