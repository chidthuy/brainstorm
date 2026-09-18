# Bộ giả định đơn vị (unit economics) cho một IP

Tài liệu này chốt các giả định ở cấp **một IP** để bản dự toán tài chính gọi vốn có thể nhân lên theo số lượng IP và theo thời gian. Mọi con số là **giả định làm việc**, không phải số liệu đã kiểm toán: mỗi dòng đều ghi rõ nguồn gốc và mức độ tin cậy để bạn thay bằng số thực khi có.

- Đơn vị tiền: **triệu đồng (tr)**, trừ khi ghi khác.
- Mô hình doanh thu giả định: **MCN ăn hoa hồng affiliate trên GMV** (không tự sở hữu hàng, không ôm tồn kho). Nếu MCN bán hàng tự có, cấu trúc chi phí đổi hoàn toàn và phải làm một bộ giả định riêng.
- Kỳ tham chiếu: bắt đầu tính từ **tháng 0** là tháng ký và dựng IP.
- Số liệu tái lập được bằng `docs/mcn/scripts/unit_economics.py`; bảng tham số máy đọc được ở `docs/mcn/gia-dinh-don-vi-ip.csv`.

---

## 1. Ba tầng chia sẻ doanh thu

Cần tách bạch ba tầng, vì rất dễ cộng nhầm phí sàn vào chi phí của MCN.

| Tầng | Ai trả cho ai | Mức giả định | Ghi chú |
|---|---|---|---|
| Phí nền tảng | Nhà bán hàng trả cho sàn | 12,5% (Marketplace) / 15,5% (Mall) | **Người bán chịu, MCN không gánh.** Chỉ đưa vào dự toán nếu MCN tự bán hàng của mình. |
| Hoa hồng affiliate | Nhà bán hàng trả cho MCN | **20% GMV ròng** (dải 12–30%) | Đây là doanh thu ghi nhận của MCN. Ngành mỹ phẩm/TPCN cao hơn, điện tử/gia dụng thấp hơn. |
| Chia cho talent | MCN trả cho IP | **30% của hoa hồng** (dải 25–35%), cộng lương cứng | Xem mục 3. |

Ngoài hoa hồng, nên mô hình hóa thêm hai dòng doanh thu phụ mà giai đoạn đầu chiếm tỷ trọng đáng kể:

- **Phí booking cố định mỗi phiên** từ nhãn hàng: 5–15 tr/phiên với IP đã có tên tuổi. Giả định base: **0** cho IP mới, bật lên từ tháng 10.
- **Thưởng đạt target** của nhãn hàng hoặc của sàn: 1–3% GMV ròng theo chiến dịch. Giả định base: **0** (để trong upside).

## 2. Vòng đời một IP người thật

Một IP không chạy ngay công suất tối đa. Dự toán phải dùng đường cong bốn giai đoạn này, chứ không phải một con số trung bình.

| Giai đoạn | Tháng | GMV/phiên | Số phiên/tháng | Vai trò |
|---|---|---|---|---|
| Dựng IP | 0 | – | – | Casting, ký hợp đồng, bộ nhận diện, đào tạo |
| Ươm | 1–3 | 10 tr | 12 | Xây kênh, live tập, tìm tệp khán giả |
| Tăng trưởng sớm | 4–6 | 25 tr | 16 | Có đơn đều, bắt đầu có nhãn hàng chủ động tìm |
| Tăng trưởng | 7–9 | 40 tr | 18 | Lên lịch live cố định, có phiên đỉnh |
| Ổn định | 10+ | 60 tr | 20 | Công suất khai thác đầy đủ |

## 3. Cấu trúc chi phí của một IP

### Chi phí dựng IP (một lần, tháng 0): **60 tr**

| Khoản | Base | Ghi chú |
|---|---|---|
| Casting, tuyển chọn, thử live | 8 tr | Phễu ~30 ứng viên cho 1 IP được chọn |
| Đào tạo (kịch bản, chốt đơn, hình thể) | 15 tr | 4–6 tuần |
| Bộ nhận diện: chụp hình, dựng kênh, video mở màn | 20 tr | |
| Thưởng ký hợp đồng / tạm ứng | 15 tr | Cần thiết để ràng buộc độc quyền; thu hồi dần nếu IP rời sớm |
| Pháp lý, hợp đồng độc quyền | 2 tr | |

### Chi phí vận hành hằng tháng (giai đoạn ổn định): **139,6 tr**

| Khoản | Base | Bản chất |
|---|---|---|
| Lương cứng talent | 15 tr | Cố định. Thị trường thuê ngoài: 15–50 tr/tháng cho người có kinh nghiệm; mức 15 tr phản ánh IP được MCN nuôi từ đầu và ăn thêm hoa hồng. |
| Hoa hồng talent (30% doanh thu MCN) | 59,0 tr | Biến đổi theo doanh thu |
| Ê-kíp nội dung + ê-kíp live | 27 tr | Bán biến đổi. 1 ê-kíp 3 người (~40 tr/tháng) phục vụ ~1,5 IP. |
| Studio, thiết bị, phần mềm | 6 tr | Bán cố định. 1 studio ~18 tr/tháng phục vụ 3 IP theo ca. |
| Quảng cáo kéo view (3% GMV ròng) | 29,5 tr | Biến đổi. Giai đoạn ươm phải chi nặng hơn (8%). |
| Mẫu sản phẩm, đạo cụ, phát sinh | 3 tr | |

**Chưa gồm chi phí chung của MCN** (ban điều hành, kế toán, BD tìm nhãn hàng, tuyển dụng, văn phòng, pháp lý). Những khoản này thuộc lớp công ty, dự toán cộng riêng ở tầng P&L chứ không phân bổ vào unit economics ở đây.

## 4. Tỷ lệ hủy và hoàn hàng

Đây là giả định dễ bị bỏ sót nhất và làm sai lệch dự toán nhiều nhất, vì hoa hồng chỉ được trả trên đơn giao thành công.

- **Base: 18% GMV gộp bị hủy hoặc hoàn** (gồm ~10% hủy trước giao và ~8% hoàn sau giao).
- Dải: **12% (upside) – 25% (downside)**.
- Cơ sở: tỷ lệ hủy/hoàn trên TikTok Shop cao hơn đáng kể so với Shopee do phần lớn đơn đến từ mua ngẫu hứng trong phiên live; các shop có tệp khách ổn định kéo được về mức 2–3%, nhưng đó không phải mức hợp lý cho một IP mới bán hàng theo phiên cho nhiều nhãn.
- Hệ quả bắt buộc phải mô hình hóa: **GMV ròng = GMV gộp × (1 − tỷ lệ hủy/hoàn)**. Mọi dòng doanh thu và hoa hồng tính trên GMV ròng, nhưng chi phí quảng cáo tính trên lượt bán gộp (ở đây xấp xỉ bằng cách tính trên GMV ròng, cần siết lại nếu tỷ lệ hoàn vượt 25%).

## 5. Kết quả: P&L và điểm hòa vốn của một IP người thật (kịch bản base)

| Giai đoạn | GMV gộp | GMV ròng | Doanh thu MCN | Chi phí trực tiếp | Lãi gộp/tháng | Lũy kế |
|---|---|---|---|---|---|---|
| Tháng 0 (dựng IP) | – | – | – | 60,0 | −60,0 | −60,0 |
| Ươm (T1–T3) | 120 | 98 | 19,7 | 61,8 | −42,1 | −186,3 |
| Tăng trưởng sớm (T4–T6) | 400 | 328 | 65,6 | 87,1 | −21,5 | −250,7 |
| Tăng trưởng (T7–T9) | 720 | 590 | 118,1 | 110,0 | +8,0 | −226,6 |
| Ổn định (T10+) | 1.200 | 984 | 196,8 | 139,6 | **+57,2** | −54,9 (T12) |

**Ba con số cần nhớ cho mỗi IP người thật (base):**

- **Điểm hòa vốn dòng tiền tích lũy: tháng 13.** Hòa vốn theo tháng (CM dương) đến sớm hơn, vào **tháng 7**.
- **Đỉnh vốn phải bỏ ra cho một IP: ~251 tr**, rơi vào tháng 6.
- **Biên lãi gộp khi ổn định: 29% trên doanh thu MCN, tương đương 5,8% trên GMV ròng.**

### Kịch bản

| Kịch bản | GMV/phiên ổn định | Hủy/hoàn | Hoa hồng | Lãi gộp ổn định | Đỉnh vốn | Hòa vốn |
|---|---|---|---|---|---|---|
| Downside | 30 tr | 25% | 15% | **−17,2 tr/tháng** | −449 tr | **Không bao giờ** |
| Base | 60 tr | 18% | 20% | +57,2 tr/tháng | −251 tr | Tháng 13 |
| Upside | 110 tr | 13% | 24% | +222,3 tr/tháng | −146 tr | Tháng 7 |

Kịch bản downside là kết luận quan trọng nhất của tài liệu: **một IP chạy dưới ~35 tr GMV/phiên ở trạng thái ổn định thì không bao giờ hoàn vốn**, càng nuôi lâu càng lỗ. Dự toán phải có cơ chế cắt, không được giả định mọi IP đều đi tới ổn định.

## 6. Tỷ lệ rơi rụng: chi phí thật của một IP thành công

Không phải IP nào cũng qua được giai đoạn ươm. Giả định:

- **30% IP bị loại ở cửa tháng 3**, 15%/năm rời bỏ sau khi đã ổn định (hết hợp đồng, bị đối thủ mua, tự lập kênh riêng).
- Chi phí chìm của một IP bị loại ở tháng 3: **186 tr**. Nếu đặt cửa sàng lọc ở **tháng 2** thay vì tháng 3, con số này còn **144 tr**.
- Với 10 IP tuyển vào: 3 IP rơi, chôn **559 tr**; chi phí này phải phân bổ lên 7 IP thành công, tức **+80 tr mỗi IP thành công**, đẩy điểm hòa vốn thực tế của một cohort từ tháng 13 sang **khoảng tháng 15**.

Hai hệ quả cho dự toán: (1) mọi mô hình phải chạy theo **cohort**, không chạy theo "số IP trung bình"; (2) đặt cửa sàng lọc sớm là đòn bẩy vốn mạnh nhất — chuyển gate từ T3 về T2 tiết kiệm ~126 tr cho mỗi 10 IP tuyển.

## 7. So sánh với IP AI

| Tiêu chí | IP người thật | IP AI |
|---|---|---|
| Chi phí dựng ban đầu | 60 tr | **30 tr** (thiết kế nhân vật, voice, persona, tích hợp) |
| Thời gian tới phiên live bán được | 3–4 tháng | **2–4 tuần** |
| Chi phí cố định hằng tháng | 48 tr (lương cứng + ê-kíp + studio) | **20 tr** (license/compute 8 tr + vận hành trực chat 12 tr) |
| Chia hoa hồng talent | 30% doanh thu | **0%** (chỉ phí bản quyền giọng/hình nếu có) |
| GMV mỗi giờ live | ~15 tr | **~1,5 tr** |
| Giờ live/tháng | ~80 giờ | **~312 giờ** (12 giờ/ngày × 26 ngày) |
| GMV gộp/tháng (base) | 1.200 tr | **468 tr** |
| Tỷ lệ hủy/hoàn | 18% | **22%** (niềm tin thấp hơn, đơn ngẫu hứng nhiều hơn) |
| Lãi gộp/tháng (base) | +57,2 tr | **+32,8 tr** |
| Biên lãi gộp trên doanh thu | 29% | **45%** |
| Hoàn vốn chi phí dựng | Tháng 13 | **~1 tháng sau khi ramp xong** |
| Rào cản mở rộng | Người: tuyển, đào tạo, giữ chân | Số SKU và số nhãn hàng ký được; chính sách nền tảng về nội dung AI |
| Rủi ro lớn nhất | IP rời bỏ mang theo tệp fan | Nền tảng siết/gắn nhãn nội dung AI, bóp reach |

### Kịch bản cho IP AI

| Kịch bản | GMV/giờ | Giờ/ngày | GMV gộp/tháng | Doanh thu | Lãi gộp/tháng | Biên |
|---|---|---|---|---|---|---|
| Downside | 0,8 tr | 10 | 208 tr | 28,1 tr | +2,3 tr | 8% |
| Base | 1,5 tr | 12 | 468 tr | 73,0 tr | +32,8 tr | 45% |
| Upside | 2,5 tr | 14 | 910 tr | 160,2 tr | +105,0 tr | 66% |

### Đọc bảng này thế nào

IP AI **không phải bản rẻ hơn của IP người thật**, và đừng dựng dự toán như thể một IP AI thay được một IP người thật:

- **Mỗi IP AI tạo ít GMV hơn nhưng biên cao hơn nhiều** (45% so với 29%), vì không có lương cứng và không chia hoa hồng. Sức mạnh của IP AI nằm ở chỗ nhân bản gần như miễn phí, không ở chỗ mỗi IP mạnh hơn.
- **Tốc độ scale khác hẳn bậc:** thêm một IP người thật là quyết định 251 tr và 13 tháng; thêm một IP AI là quyết định 30 tr và 1 tháng. Đây là luận điểm gọi vốn: vốn nhà đầu tư rót vào để nuôi tầng IP người thật (tài sản có tường bao, định giá được), còn tầng IP AI là nơi vốn chuyển thành biên lợi nhuận nhanh.
- **Hai tầng không cạnh tranh mà bù nhau:** IP người thật giữ khung giờ vàng và các ngành hàng cần niềm tin (mỹ phẩm, thực phẩm chức năng, mẹ và bé); IP AI lấp khung giờ thấp điểm (0–8 giờ), hàng phổ thông, hàng long-tail, và làm nền cho các phiên chạy liên tục 24/7.
- **Rủi ro tập trung vào IP AI là rủi ro nền tảng, không phải rủi ro vận hành.** Nếu sàn siết nội dung AI hoặc bắt buộc gắn nhãn, toàn bộ tầng này có thể mất phần lớn reach cùng lúc. Dự toán nên có kịch bản "tầng AI mất 60% GMV trong một quý" để nhà đầu tư thấy công ty không sập nếu điều đó xảy ra.

## 8. Những giả định cần bạn xác nhận hoặc thay bằng số thực

Đây là các tham số mà sai lệch nhỏ làm đổi kết luận. Xếp theo mức độ ảnh hưởng:

1. **GMV/phiên ở trạng thái ổn định (60 tr).** Đây là biến quyết định sống còn: dưới 35 tr là không hoàn vốn. Nếu bạn đã có số thực từ IP nào đang chạy, thay ngay dòng này trước mọi dòng khác.
2. **Tỷ lệ hủy/hoàn (18%).** Chênh 7 điểm phần trăm giữa base và downside làm đổi ~15% doanh thu.
3. **Hoa hồng affiliate trung bình (20%).** Phụ thuộc hoàn toàn vào ngành hàng bạn định tập trung — chốt ngành hàng trước rồi chốt số này.
4. **Tỷ lệ chia cho talent (30%) và mức lương cứng (15 tr).** Quyết định thương mại của bạn, không phải số thị trường.
5. **Tỷ lệ rơi rụng ở cửa tháng 3 (30%)** và chính sách đặt cửa sàng lọc ở tháng mấy.
6. **GMV/giờ của IP AI (1,5 tr).** Rất ít dữ liệu công khai đáng tin; nếu đã thử nghiệm được một phiên AI thực tế thì số đó giá trị hơn mọi tham chiếu thị trường.

## 9. Nguồn tham chiếu

Các mức thị trường dùng để hiệu chỉnh giả định (đều là nguồn thứ cấp, dùng để đặt dải chứ không dùng làm số chốt):

- Phí nền tảng TikTok Shop 12,5% Marketplace / 15,5% Mall, hoa hồng affiliate do người bán đặt phổ biến 5–25%: [Phí sàn TikTok Shop 2026](https://eimskip.vn/phi-san-tiktok-shop), [Phí hoa hồng nền tảng — TikTok Shop Seller University](https://seller-vn.tiktok.com/university/essay?knowledge_id=3396736626312961&lang=en)
- Tỷ lệ hủy/hoàn trên TikTok Shop cao hơn đáng kể Shopee, nguyên nhân từ hành vi mua ngẫu hứng trong live: [Khi tỷ lệ hoàn hàng trên sàn TMĐT tăng](https://effitrack.me/khi-ty-le-hoan-hang-tang-goc-nhin-tu-van-hanh-va-hanh-vi-mua-sam/)
- Giá thuê người livestream: 300k–1 tr/giờ, 1,5–5 tr/buổi, 15–50 tr/tháng; lương nhân viên livestream 8–30 tr/tháng gồm hoa hồng: [Tổng hợp giá thuê người livestream bán hàng 2026 — Sapo](https://www.sapo.vn/blog/gia-thue-nguoi-livestream-ban-hang)
- Chi phí một phiên livestream trọn gói 5–10 tr (gói cơ bản) đến 30–50 tr (gói cao cấp có KOL): [Dịch vụ livestream TikTok trọn gói 2026](https://kenbistudio.com/dich-vu-livestream-tiktok/)
- GMV từ livestream chiếm 35–40% tổng GMV TikTok Shop tại Đông Nam Á: [TikTok Commerce: báo cáo affiliate và livestream tại Đông Nam Á](https://www.brandsvietnam.com/congdong/topic/tiktok-commerce-2025-bao-cao-chuyen-sau-ve-affiliate-livestream-tai-dong-nam-a)
