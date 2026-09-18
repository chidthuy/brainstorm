# Bản dự toán tài chính 36 tháng — mô hình MCN

File bảng tính: [`finance/Du_toan_tai_chinh_MCN_36T.xlsx`](../../finance/Du_toan_tai_chinh_MCN_36T.xlsx)

Bản dự toán phục vụ gọi vốn cho mô hình MCN ba tầng: (1) build và grow IP người thật,
(2) dùng IP bán hàng livestream ăn chia sẻ doanh thu, (3) scale bằng IP AI.

Toàn bộ bảng tính là **công thức sống**: đổi một ô giả định thì P&L và dòng tiền tự tính lại.
Đơn vị tiền ở mọi sheet là **triệu VND** (1.000 = 1 tỷ đồng). Kỳ dự báo 36 tháng, mặc định bắt đầu 01/2027.

## Nguồn giả định

Bộ giả định đơn vị (cấp một IP) lấy **nguyên** từ `docs/mcn/gia-dinh-don-vi-ip.md` và
`docs/mcn/gia-dinh-don-vi-ip.csv` (nhánh `claude/project-thread-3agb5m`): vòng đời IP, GMV/phiên theo giai đoạn, tỷ lệ huỷ/hoàn, hoa hồng affiliate,
tỷ lệ chia cho talent, chi phí ê-kíp/studio/quảng cáo, và toàn bộ tham số IP AI.

Bản dự toán bổ sung ba nhóm giả định mà tài liệu đơn vị cố ý không đụng tới, đều được đánh dấu
`Dự toán` ở cột *Căn cứ / nguồn* trong sheet `Gia_dinh`:

1. **Kế hoạch đội hình** — số IP ký mới mỗi tháng, thời điểm và nhịp ra mắt IP AI.
2. **Chi phí tầng công ty** — BOD, BD tìm nhãn hàng, tuyển dụng, đội công nghệ, back office,
   văn phòng, pháp lý, marketing thương hiệu. Tài liệu đơn vị nói rõ những khoản này thuộc lớp công ty
   và phải cộng riêng ở tầng P&L, không phân bổ vào unit economics.
3. **Vốn lưu động, thuế, gọi vốn** — DSO 45 ngày, DPO 15 ngày, thuế TNDN 20% có chuyển lỗ.

## Cấu trúc bảng tính

| Sheet | Nội dung |
|---|---|
| `Huong_dan` | Cách đọc, cách dùng, giới hạn của bản dự toán |
| `Kich_ban` | Tóm tắt năm kịch bản + cột đối chiếu với mô hình đang chạy |
| `Gia_dinh` | Toàn bộ tham số, ba cột giá trị cho ba kịch bản, cột *ĐANG ÁP DỤNG*, cột căn cứ |
| `Don_vi_IP` | Unit economics một IP người thật theo tuổi 0–36 tháng |
| `Don_vi_IP_AI` | Unit economics một IP AI theo tuổi 0–36 tháng |
| `Doi_hinh` | Mô hình cohort: số IP ở từng tuổi trong từng tháng |
| `Doanh_thu` | GMV gộp/ròng và ba dòng doanh thu |
| `Chi_phi` | Chi phí trực tiếp + nhân sự và chi phí tầng công ty |
| `PnL` | Kết quả kinh doanh theo tháng + tổng hợp năm 1/2/3 |
| `Dong_tien` | Dòng tiền theo tháng, nhu cầu vốn luỹ kế, runway |

Cách mô hình chạy: `Don_vi_IP` cho biết một IP ở tuổi *a* tạo ra bao nhiêu doanh thu và tốn bao nhiêu chi phí;
`Doi_hinh` cho biết tháng *m* có bao nhiêu IP ở tuổi *a*; mỗi dòng ở `Doanh_thu` và `Chi_phi` là tích vô hướng
của hai bảng đó. Vì vậy mọi con số tổng đều truy ngược được về một ô unit economics.

## Cơ chế sàng lọc

Tài liệu đơn vị kết luận một IP chạy dưới ~35tr GMV/phiên ở trạng thái ổn định thì không bao giờ hoàn vốn,
nên dự toán bắt buộc phải có cơ chế cắt. Mô hình cài ba lớp, đều là tham số sửa được:

- **Cửa sàng lọc 1** ở tuổi 3 — loại 30% IP (base), 45% (downside), 20% (upside).
- **Cửa sàng lọc 2** ở tuổi 9 — loại 15% IP chưa đạt lãi gộp dương trước khi vào giai đoạn ổn định.
- **Rời bỏ tự nhiên** 15%/năm sau khi ổn định.

Chuyển cửa 1 từ tháng 3 về tháng 2 tiết kiệm ~126tr cho mỗi 10 IP tuyển — đổi ô `Cửa sàng lọc 1` để thấy.

## Kết quả kịch bản Base

| Chỉ tiêu (triệu VND) | Năm 1 | Năm 2 | Năm 3 |
|---|---:|---:|---:|
| GMV gộp | 37.543 | 374.590 | 1.017.232 |
| Doanh thu | 6.157 | 60.473 | 162.790 |
| — từ IP người thật | 6.157 | 41.757 | 84.088 |
| — từ IP AI | 0 | 18.716 | 78.702 |
| Lợi nhuận gộp | −5.172 | 5.263 | 41.259 |
| EBITDA | −12.474 | −6.537 | 23.157 |
| Lợi nhuận sau thuế | −12.509 | −6.594 | 22.281 |

- EBITDA dương từ **tháng 22**, dòng tiền hoạt động dương từ **tháng 29**.
- **Nhu cầu vốn đỉnh điểm: ~31,8 tỷ VND**, rơi vào tháng 28.
- Cuối kỳ: 58 IP người thật và 142 IP AI đang hoạt động, 24 nhân sự tầng công ty.

Cấu trúc gọi vốn đang đặt trong mô hình: **30 tỷ tháng 1 + 12 tỷ tháng 19**. Tranche 2 đặt sau khi cohort IP
đầu tiên đã hoà vốn, tức sau khi unit economics được chứng minh bằng số thực chứ không bằng giả định.

## Năm kịch bản

| | Downside | Base | Upside | Base + sốc tầng AI | Downside + cơ chế cắt |
|---|---:|---:|---:|---:|---:|
| Doanh thu Năm 3 | 24.101 | 162.790 | 875.699 | 155.641 | 2.267 |
| EBITDA Năm 3 | −24.318 | 23.157 | 455.770 | 18.010 | −7.352 |
| Tháng EBITDA dương | không đạt | 22 | 11 | 22 | không đạt |
| Nhu cầu vốn đỉnh điểm | 62.812 | 31.800 | 12.982 | 36.766 | 26.187 |

**Base + sốc tầng AI** là bài kiểm định tài liệu đơn vị yêu cầu: nền tảng siết nội dung AI, tầng AI mất 60% GMV
trong một quý từ tháng 25. Công ty không sập — EBITDA năm 3 giảm từ 23,2 xuống 18,0 tỷ, nhu cầu vốn đỉnh điểm
tăng thêm 5 tỷ. Đây là con số nên đưa vào phần rủi ro khi trình bày với nhà đầu tư.

**Downside + cơ chế cắt** cho thấy giá trị của việc dừng tuyển sớm: nếu thấy unit economics âm mà dừng ký IP mới
từ tháng 7 và không triển khai tầng AI, thiệt hại tối đa giảm từ **62,8 tỷ xuống 26,2 tỷ**. Cơ chế cắt không cứu
được downside — nó giới hạn thiệt hại. Kết luận thẳng: nếu GMV/phiên ổn định về mức 30tr thì mô hình không chạy được
và phải đổi ngành hàng hoặc đổi cấu trúc chia sẻ, không phải nuôi tiếp để chờ quy mô.

## Kiểm chứng

`finance/engine.py` là bản sao Python của toàn bộ mô hình. `finance/verify.py` dùng LibreOffice tính lại
bảng tính rồi đối chiếu 15 dòng cốt lõi (GMV, doanh thu, giá vốn, lợi nhuận gộp, EBITDA, EBIT, thuế, lợi nhuận sau thuế,
nhân sự, ba dòng tiền) qua đủ 36 tháng, trên cả ba kịch bản. Hiện **khớp 0,0000%** ở mọi ô.

Bảng tính cũng tái lập đúng các con số của tài liệu đơn vị: lãi gộp một IP người thật ổn định **57,2tr/tháng**,
một IP AI **32,8tr/tháng**, và bảng P&L vòng đời (61,8 / 87,1 / 110,0 / 139,6tr chi phí theo bốn giai đoạn).

```
python3 finance/build_model.py    # sinh lại bảng tính từ finance/params.py
python3 finance/verify.py         # đối chiếu Excel với bản sao Python (cần libreoffice-calc)
```

## Giới hạn cần nói rõ với nhà đầu tư

- **Mọi con số là giả định làm việc**, chưa có số liệu vận hành thực tế. Có số thực dòng nào thì thay dòng đó trước,
  theo thứ tự ảnh hưởng: GMV/phiên ổn định → tỷ lệ huỷ/hoàn → hoa hồng affiliate → tỷ lệ chia cho talent →
  tỷ lệ rơi rụng tại cửa sàng lọc → GMV/giờ của IP AI.
- **Kịch bản Upside không nên dùng làm cam kết.** Nó giả định *mọi* IP đều đạt 110tr GMV/phiên, tức mức của nhóm
  creator đầu bảng, và cho ra biên EBITDA 52% — đó là trần lý thuyết để đo độ nhạy, không phải một kế hoạch.
- **Phí nền tảng TikTok Shop (12,5% Marketplace / 15,5% Mall) không có trong mô hình** vì người bán chịu.
  Chỉ phải đưa vào nếu MCN chuyển sang tự bán hàng của mình — khi đó phải làm lại cả cấu trúc chi phí.
- **Chưa mô hình hoá:** lãi vay, biến động tỷ giá, thuế TNCN của talent, dự phòng công nợ khó đòi,
  chi phí pháp lý cho tranh chấp hợp đồng độc quyền.
- **Thuế TNDN** tính 20% trên thu nhập chịu thuế sau khi bù hết lỗ luỹ kế, nộp trong chính tháng phát sinh
  (thực tế tạm nộp theo quý — chênh lệch này không đổi kết luận nào).
