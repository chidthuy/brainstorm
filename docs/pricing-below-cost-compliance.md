# Chứng minh bảng giá cước KHÔNG dưới giá thành khi đăng ký

> Bối cảnh: Nền tảng đặt dịch vụ vận chuyển (bưu chính) toàn quốc. Khi ban hành / đăng ký
> (niêm yết – thông báo – kê khai) bảng giá cước với cơ quan quản lý, cần chứng minh được
> mức giá **không thấp hơn giá thành toàn bộ**, để không vướng pháp luật cạnh tranh.
>
> Tài liệu này là phân tích nội bộ để Business – Finance – Legal – Tech triển khai,
> **không phải ý kiến pháp lý**. Số hiệu điều luật nêu ở mục 1 cần luật sư rà soát lại
> trước khi dùng trong văn bản gửi cơ quan nhà nước.

---

## 0. TL;DR

**Không có cơ quan nào "duyệt" giúp bạn rằng giá không dưới giá thành.** Cơ chế quản lý giá
cước bưu chính là **doanh nghiệp tự định giá – tự chịu trách nhiệm**, chỉ phải niêm yết /
thông báo / kê khai. Hệ quả: "chứng minh" ở đây không phải là một thủ tục nộp hồ sơ, mà là
**năng lực xuất trình được một hồ sơ giá thành có thể bảo vệ trước hậu kiểm** — tại thời
điểm bị kiểm tra, có thể là 1–3 năm sau khi ban hành giá.

Vậy nên deliverable thực sự cần có là **"Hồ sơ thuyết minh cơ cấu hình thành giá"** đi kèm
mỗi phiên bản bảng giá, gồm 6 phần (mục 4), trong đó lõi là:

$$\text{Giá bán từng ô bảng giá} \;\ge\; \text{Giá thành toàn bộ đơn vị của chính ô đó}$$

Ba nguyên tắc quyết định chất lượng hồ sơ:

1. **Tính theo ô (cell), không theo bình quân.** Giá thành phải tính cho từng
   `tuyến (zone) × dải khối lượng × loại dịch vụ`. Bình quân toàn mạng dương vẫn có thể
   che một số ô âm — và cơ quan điều tra sẽ soi đúng ô âm đó.
2. **Chi phí kỳ vọng, không phải chi phí ca lý tưởng.** Phải cộng chi phí giao lại và chi
   phí hoàn hàng theo tỷ lệ thực tế, cộng hoa hồng kênh/Agent, cộng chi phí quản lý phân bổ.
3. **Chốt ở mức sản lượng thận trọng.** Giá thành đơn vị giảm theo sản lượng; lấy sản lượng
   kế hoạch lạc quan để kéo giá thành xuống là lỗi hay bị bắt nhất. Phải có bảng độ nhạy và
   nêu rõ "giá này an toàn khi sản lượng ≥ X".

Và một lớp phòng thủ thứ hai, thường bị quên: kể cả khi một ô bị coi là dưới giá thành,
hành vi **chỉ bị cấm khi kèm yếu tố "dẫn đến hoặc có khả năng dẫn đến loại bỏ doanh nghiệp
khác"** (mục 1.3). Hồ sơ nên chuẩn bị sẵn cả bằng chứng cho yếu tố này.

---

## 1. Khung pháp lý: nghĩa vụ thật sự nằm ở đâu

### 1.1 Luật Bưu chính 2010 — định giá và công khai giá cước

- Doanh nghiệp bưu chính **tự quyết định giá cước** dịch vụ mình cung ứng (trừ dịch vụ bưu
  chính công ích / dịch vụ dành riêng do Nhà nước định giá, ví dụ mức cước tối đa dịch vụ
  bưu chính phổ cập tại Thông tư 12/2018/TT-BTTTT).
- **Căn cứ xác định giá cước** (Điều 28): (i) **giá thành**, (ii) quan hệ cung – cầu thị
  trường, (iii) mặt bằng giá cùng loại trên thị trường khu vực và thế giới.
  → Đây chính là chỗ "giá thành" trở thành căn cứ pháp lý bắt buộc, chứ không chỉ là chuyện
  quản trị nội bộ.
- Nghĩa vụ **niêm yết công khai** giá cước tại điểm phục vụ / trên website, và **thông báo,
  báo cáo giá cước** với cơ quan quản lý nhà nước về bưu chính (Bộ quản lý ngành / Sở
  chuyên ngành tại địa phương) theo yêu cầu.
- Bối cảnh thực thi đang siết: cơ quan quản lý đã nhiều lần cảnh báo tình trạng doanh nghiệp
  chuyển phát hạ cước dưới giá thành để giành thị phần, và định hướng sửa Luật Bưu chính
  theo hướng bổ sung **cơ chế "kiểm tra yếu tố hình thành giá"** khi giá cước biến động bất
  thường, cùng quy định riêng cho doanh nghiệp có vị trí thống lĩnh. Nghĩa là khả năng bị
  yêu cầu xuất trình hồ sơ giá thành đang **tăng**, không giảm.

### 1.2 Luật Giá 2023 + Nghị định 85/2024/NĐ-CP — niêm yết & kê khai giá

- **Niêm yết giá**: bắt buộc với mọi hàng hóa, dịch vụ kinh doanh; không được thu cao hơn
  giá đã niêm yết.
- **Kê khai giá**: chỉ áp dụng cho hàng hóa, dịch vụ thuộc Danh mục kê khai giá (Phụ lục V
  Nghị định 85/2024) hoặc thuộc diện bình ổn giá / Nhà nước định khung. **Cần Legal xác
  nhận dịch vụ của mình có thuộc danh mục kê khai giá hay không** — dịch vụ chuyển phát
  thương mại thông thường nhiều khả năng **không** thuộc, nhưng dịch vụ bưu chính công ích
  và các dịch vụ Nhà nước định giá thì khác.
- Nếu thuộc diện kê khai: gửi **văn bản kê khai giá theo mẫu tại Phụ lục VI Nghị định
  85/2024** trong **tối đa 05 ngày làm việc** kể từ ngày quyết định giá, và mẫu này có phần
  **thuyết minh cơ cấu hình thành giá**. Nội dung kê khai phải **trung thực** — kê khai sai
  lệch cơ cấu chi phí là một vi phạm độc lập, nặng hơn cả việc giá thấp.

> Điểm mấu chốt: dù thuộc hay không thuộc diện kê khai, **cấu trúc hồ sơ nên làm y hệt mẫu
> thuyết minh cơ cấu hình thành giá của Luật Giá**. Đó là "ngôn ngữ" mà cơ quan kiểm tra
> quen đọc, và làm sẵn thì lúc bị hỏi chỉ việc nộp.

### 1.3 Luật Cạnh tranh 2018 — hai điều cấm khác nhau, đừng nhầm

| | **Điều 27.1.a** – Lạm dụng vị trí thống lĩnh | **Điều 45.6** – Cạnh tranh không lành mạnh |
|---|---|---|
| Hành vi | Bán hàng hóa, cung ứng dịch vụ **dưới giá thành toàn bộ** dẫn đến hoặc có khả năng dẫn đến **loại bỏ đối thủ cạnh tranh** | Bán hàng hóa, cung ứng dịch vụ **dưới giá thành toàn bộ** dẫn đến hoặc có khả năng dẫn đến **loại bỏ doanh nghiệp khác cùng kinh doanh** loại dịch vụ đó |
| Điều kiện chủ thể | **Chỉ áp dụng khi có vị trí thống lĩnh** (thị phần ≥ 30% trên thị trường liên quan hoặc có sức mạnh thị trường đáng kể) | **Áp dụng cho MỌI doanh nghiệp**, không cần thống lĩnh |
| Phạm vi so sánh | "đối thủ cạnh tranh" — cùng thị trường liên quan | "doanh nghiệp khác cùng kinh doanh loại dịch vụ đó" — **rộng hơn** |
| Chế tài | Phạt đến 10% tổng doanh thu năm tài chính liền kề trên thị trường liên quan | Theo Điều 21 NĐ 75/2019: **800 triệu – 1 tỷ đồng**; **gấp đôi (1,6 – 2 tỷ)** nếu thực hiện trên phạm vi **từ hai tỉnh, thành phố trở lên** — mạng chuyển phát toàn quốc thì mặc định rơi vào khung gấp đôi. Kèm **tịch thu khoản lợi nhuận thu được** từ hành vi vi phạm |

Ba hệ quả thực tiễn:

1. **Doanh nghiệp nhỏ không được miễn.** Rất nhiều người tưởng "chưa thống lĩnh thì bán rẻ
   thoải mái" — sai, Điều 45.6 không có ngưỡng thị phần.
2. **Giá dưới giá thành, tự nó, chưa đủ để kết luận vi phạm.** Cần **cả hai** yếu tố: dưới
   giá thành toàn bộ **và** dẫn đến/có khả năng loại bỏ doanh nghiệp khác. Đây là lớp phòng
   thủ thứ hai (mục 5).
3. **Luật Cạnh tranh 2018 và NĐ 35/2020 không định nghĩa "giá thành toàn bộ".** Định nghĩa
   quen dùng ("tổng các chi phí cấu thành giá thành sản xuất/giá mua vào để bán lại **cộng**
   chi phí lưu thông") đến từ NĐ 116/2005 hướng dẫn Luật Cạnh tranh 2004 — **đã hết hiệu
   lực**. Khoảng trống này cắt cả hai chiều: doanh nghiệp được quyền chọn phương pháp tính
   hợp lý, nhưng cũng không có "safe harbor" chính thức. Cách xử lý an toàn: **chọn phương
   pháp rộng (full cost, gồm cả chi phí bán hàng và quản lý), tài liệu hóa, và áp dụng nhất
   quán qua các kỳ** — thay đổi phương pháp giữa chừng theo hướng có lợi cho mình là dấu
   hiệu xấu.

### 1.4 Các luật liên quan cần chú ý cùng lúc

- **Khuyến mại** (Luật Thương mại + NĐ 81/2018): mức giảm giá tối đa **50%**, phải có chương
  trình khuyến mại hợp lệ (thông báo/đăng ký với Sở Công Thương tùy hình thức). Giá khuyến
  mại hợp lệ, có thời hạn, là một lý do chính đáng để một mức giá tạm thời thấp — nhưng
  **phải là chương trình khuyến mại thật, có hồ sơ**, không phải bảng giá thường xuyên gắn
  mác "khuyến mại".
- **Thỏa thuận hạn chế cạnh tranh** (Điều 11–12): tuyệt đối không bàn/thống nhất mức giá sàn
  với các doanh nghiệp chuyển phát khác, kể cả dưới danh nghĩa hiệp hội. Kiến nghị "áp giá
  sàn cho dịch vụ bưu chính" nếu có chỉ hợp pháp khi do **Nhà nước** ban hành, không phải do
  các doanh nghiệp tự thỏa thuận với nhau.
- **Thuế**: giá bán dưới giá thành kéo dài cũng là dấu hiệu bị cơ quan thuế xem xét (chuyển
  giá / xác định lại giá giao dịch liên kết), đặc biệt nếu giá thấp áp cho bên liên kết.

---

## 2. Định nghĩa vận hành: "giá thành toàn bộ" của một bưu gửi

### 2.1 Công thức

$$
C_{\text{toàn bộ}}(cell) = C_{\text{trực tiếp}}^{\text{kỳ vọng}}(cell) + C_{\text{gián tiếp phân bổ}}(cell) + C_{\text{bán hàng}}(cell) + C_{\text{quản lý DN}}(cell) + C_{\text{tài chính}}(cell)
$$

trong đó `cell` = `loại dịch vụ × zone × dải khối lượng` (và nếu có, × kênh bán).

**Chi phí trực tiếp kỳ vọng** — điểm khác biệt lớn nhất giữa hồ sơ tốt và hồ sơ bị bác:

$$
C_{\text{trực tiếp}}^{\text{kỳ vọng}} = C_{\text{giao thành công}} + p_{\text{giao lại}} \times C_{\text{giao lại}} + p_{\text{hoàn}} \times C_{\text{hoàn}}
$$

Trong đó `p_hoàn`, `p_giao lại` lấy từ **số liệu vận hành thực tế 3–6 tháng gần nhất của
chính cell đó**, không lấy bình quân toàn mạng, không lấy con số kế hoạch.

### 2.2 Bảng khoản mục chi phí

| Nhóm | Khoản mục | Tài khoản KT tham chiếu | Cost driver phân bổ |
|---|---|---|---|
| Trực tiếp | Lấy hàng (pickup) tại shop | 154/632 | số đơn / số điểm dừng |
| Trực tiếp | Trung chuyển chặng đầu về hub | 154/632 | kg hoặc chargeable weight |
| Trực tiếp | Khai thác, chia chọn tại hub/kho | 154/632 | số đơn |
| Trực tiếp | Vận chuyển đường dài (linehaul) theo tuyến | 154/632 | kg × km theo zone |
| Trực tiếp | Phát cuối (last-mile), trả bưu tá/đối tác | 154/632 | số đơn theo zone |
| Trực tiếp | Bao bì, vật tư, tem nhãn | 154/632 | số đơn |
| Trực tiếp | Chi phí giao lại & hoàn hàng (theo xác suất) | 154/632 | số đơn × tỷ lệ thực tế |
| Trực tiếp | Xử lý COD, chi phí chuyển trả tiền COD | 154/632/635 | số đơn COD |
| Trực tiếp | Dự phòng bồi thường mất/hư hỏng | 154/632/352 | số đơn × tỷ lệ sự cố × mức bồi thường bình quân |
| Gián tiếp | Khấu hao xe, băng chuyền, thiết bị; thuê kho/hub; điện nước | 627/642 | số đơn hoặc m³-giờ |
| Gián tiếp | Hạ tầng CNTT, platform, hosting, license, đội kỹ thuật | 642 | số đơn |
| Bán hàng | Lương + hoa hồng sales, **hoa hồng/margin trả cho Agent (đại lý)**, marketing, chăm sóc khách hàng | 641 | theo đơn hoặc **% giá bán** (xem 2.4) |
| Quản lý DN | Bộ máy quản lý, kế toán, pháp chế, thuê văn phòng HO | 642 | số đơn |
| Tài chính | Lãi vay vốn lưu động, chi phí ứng vốn COD, phí ngân hàng/cổng thanh toán | 635 | số đơn hoặc số dư COD bình quân × lãi suất |

> **Không được để sót**: chi phí Agent/đại lý và chi phí giao lại–hoàn hàng. Đây là hai
> khoản mà mô hình giá thành "làm nhanh" hay bỏ quên, và cũng là hai khoản đủ lớn để lật
> ngược kết luận từ "có lãi" sang "dưới giá thành".

### 2.3 Nguyên tắc phân bổ chi phí gián tiếp

- Chọn driver **phản ánh quan hệ nhân quả** (số đơn, chargeable weight, số điểm dừng), ghi
  rõ lý do chọn trong thuyết minh.
- **Nhất quán giữa các kỳ và giữa các dịch vụ.** Không được đổi driver riêng cho dịch vụ
  đang muốn bán rẻ để "đẩy" chi phí sang dịch vụ khác — đó là bù chéo trá hình.
- Tổng chi phí phân bổ cho tất cả các cell phải **khớp với số liệu kế toán tổng thể** của kỳ
  (kiểm tra đối chiếu bắt buộc: `Σ (giá thành đơn vị × sản lượng) ≈ tổng chi phí trên sổ`,
  chênh lệch ≤ ngưỡng đã định, ví dụ 2%).

### 2.4 Bẫy vòng lặp: hoa hồng tính theo % giá bán

Nếu hoa hồng Agent/kênh = `r × giá bán`, thì giá sàn không thể tính bằng phép cộng thuần —
phải giải phương trình:

$$
P_{\text{sàn}} = \frac{C_{\text{các khoản không phụ thuộc giá bán}}}{1 - r}
$$

Ví dụ: chi phí khác = 21.220 đ/đơn, hoa hồng Agent 10% giá bán
→ `P_sàn = 21.220 / 0,9 = 23.578 đ`, **không phải** `21.220 × 1,1 = 23.342 đ`.
Chênh lệch nhỏ nhưng đúng chiều bất lợi — và sai công thức này làm hỏng độ tin cậy của cả
hồ sơ.

---

## 3. Ví dụ tính minh họa (đơn nội tỉnh, 0–0,5 kg)

*Số liệu minh họa, đơn vị VNĐ/đơn — thay bằng số thật của công ty khi lập hồ sơ.*

**Bước 1 — Chi phí trực tiếp cho một đơn giao thành công**

| Khoản mục | Số tiền |
|---|---:|
| Pickup tại shop | 3.500 |
| Trung chuyển về hub | 1.200 |
| Khai thác, chia chọn | 2.000 |
| Phát cuối (trả bưu tá) | 8.000 |
| Bao bì, vật tư | 300 |
| **Cộng** | **15.000** |

**Bước 2 — Quy về chi phí kỳ vọng**

| Yếu tố | Tỷ lệ thực tế | Chi phí/lần | Cộng thêm |
|---|---:|---:|---:|
| Giao lại lần 2 | 12% | 5.000 | 600 |
| Hoàn hàng về shop | 8% | 9.000 | 720 |
| **Chi phí trực tiếp kỳ vọng** | | | **16.320** |

**Bước 3 — Cộng các lớp chi phí còn lại (ở sản lượng kế hoạch 1,0 triệu đơn/tháng)**

| Nhóm | Số tiền |
|---|---:|
| Chi phí trực tiếp kỳ vọng | 16.320 |
| Gián tiếp phân bổ (hub, xe, kho, IT/platform, khấu hao) | 3.100 |
| Quản lý doanh nghiệp phân bổ | 1.400 |
| Tài chính (ứng vốn COD, phí ngân hàng) | 400 |
| **Cộng (chưa gồm chi phí bán hàng theo % giá)** | **21.220** |

**Bước 4 — Giá sàn sau khi gộp hoa hồng Agent 10% giá bán**

`P_sàn = 21.220 / (1 − 0,10) = **23.578 đ** → làm tròn **23.600 đ**`

**Bước 5 — Đối chiếu bảng giá đăng ký**

| | Số tiền |
|---|---:|
| Giá niêm yết ô này | 25.000 |
| Giá thành toàn bộ | 23.600 |
| **Biên (margin)** | **+1.400 (5,6%)** ✔ |

**Bước 6 — Độ nhạy theo sản lượng (phần quan trọng nhất của hồ sơ)**

Giả định 80% chi phí gián tiếp và 100% chi phí quản lý là chi phí cố định:

| Sản lượng so với kế hoạch | Giá thành toàn bộ | Biên tại giá 25.000 | Kết luận |
|---|---:|---:|---|
| 120% | 22.900 | +2.100 | An toàn |
| 100% | 23.600 | +1.400 | An toàn |
| 80% | 24.700 | +300 | Sát ngưỡng |
| 60% | 26.500 | **−1.500** | **Dưới giá thành** |

Điểm hòa vốn: `v ≈ 75%` sản lượng kế hoạch.

→ Kết luận đưa vào hồ sơ: *"Mức giá 25.000 đ bảo đảm không thấp hơn giá thành toàn bộ khi
sản lượng đạt từ ~75% kế hoạch trở lên. Doanh nghiệp áp dụng cơ chế rà soát hàng quý; nếu
sản lượng thực tế 2 quý liên tiếp dưới ngưỡng này, bảng giá được điều chỉnh theo quy trình
tại mục 6."* — Câu này chính là thứ biến hồ sơ từ "một bảng tính" thành **bằng chứng về sự
cẩn trọng có hệ thống**, và nó cũng chặn trước câu hỏi khó nhất mà kiểm tra viên sẽ đặt ra.

---

## 4. Bộ hồ sơ chứng minh (deliverable chuẩn cho mỗi phiên bản bảng giá)

**Phần 1 — Quyết định ban hành giá.** Quyết định nội bộ của người có thẩm quyền, ghi rõ
bảng giá, phạm vi áp dụng, ngày hiệu lực, và **viện dẫn hồ sơ tính giá thành kèm theo**.

**Phần 2 — Thuyết minh phương pháp tính giá thành (cost model memo).** Phạm vi dịch vụ; kỳ
dữ liệu sử dụng; định nghĩa cell; danh mục khoản mục chi phí; driver phân bổ và lý do chọn;
giả định sản lượng; nguyên tắc nhất quán giữa các kỳ. Đây là phần cơ quan kiểm tra đọc đầu
tiên và cũng là phần quyết định họ có tin phần còn lại hay không.

**Phần 3 — Bảng tính giá thành đơn vị theo từng cell**, đặt cạnh bảng giá đăng ký, có cột
`margin = giá bán − giá thành` và **cột cảnh báo cho mọi ô margin < 0** (kèm giải trình
riêng cho từng ô âm nếu có — xem mục 5).

**Phần 4 — Chứng từ nguồn.** Trích sổ kế toán các TK 154/632/641/642/635 kỳ tương ứng; báo
cáo tài chính (ưu tiên đã kiểm toán); hợp đồng với nhà thầu vận tải / đối tác bưu tá / cho
thuê kho; bảng lương; hóa đơn nhiên liệu; biểu phí ngân hàng. **Mọi con số trong Phần 3 phải
lần ngược được về một chứng từ ở Phần 4** — nguyên tắc bất khả xâm phạm.

**Phần 5 — Bảng độ nhạy & ngưỡng an toàn** theo sản lượng, theo tỷ lệ hoàn, theo giá nhiên
liệu / đơn giá bưu tá (3 biến số biến động mạnh nhất).

**Phần 6 — Đối chiếu tổng thể.** Chứng minh `Σ (giá thành đơn vị × sản lượng) ≈ tổng chi phí
trên sổ kế toán`, kèm giải thích chênh lệch. Đây là bước kiểm tra chéo mà kiểm toán và cơ
quan quản lý đều sẽ làm; làm sẵn thì mất thế bị động.

**Lưu trữ:** mỗi lần đổi giá → một phiên bản hồ sơ mới, đóng gói bất biến (PDF ký số + file
nguồn), lưu **tối thiểu 5 năm** theo yêu cầu lưu trữ chứng từ kế toán, và lưu ý thời hiệu xử
lý vụ việc cạnh tranh là **3 năm** kể từ ngày thực hiện hành vi.

---

## 5. Xử lý các trường hợp "trông như" bán dưới giá thành

| Tình huống | Rủi ro | Cách xử lý & bằng chứng cần có |
|---|---|---|
| **Giá khuyến mại / ra mắt** thấp hơn giá thành | Trung bình | Tách hẳn khỏi bảng giá niêm yết. Lập chương trình khuyến mại hợp lệ theo NĐ 81/2018 (mức giảm ≤ 50%, có thông báo/đăng ký Sở Công Thương). Giới hạn thời gian & ngân sách rõ ràng, hạch toán phần chênh vào **chi phí marketing**. Hồ sơ ghi rõ mục tiêu (thử nghiệm tuyến, thu hút khách mới) — **không bao giờ** ghi mục tiêu là giành thị phần từ đối thủ cụ thể |
| **Giá bậc thang theo sản lượng** cho shop lớn | Thấp | Chứng minh **cost-to-serve thấp hơn thật**: gom lô, ít điểm dừng, ít CSKH, thanh toán tập trung. Bảng tính giá thành **riêng cho phân khúc đó** phải ≥ giá bán. Chiết khấu phải phản ánh tiết kiệm chi phí thực, có tiêu chí công khai và áp dụng cho mọi khách đạt ngưỡng |
| **Bù chéo giữa các dịch vụ / các zone** | **Cao** | Nguyên tắc an toàn: **mỗi dòng dịch vụ tự đứng được** (≥ giá thành toàn bộ của chính nó). Nếu buộc phải bù chéo, tối thiểu phải: (i) không ô nào dưới **chi phí trực tiếp kỳ vọng**, (ii) có quyết định phê duyệt nêu lý do thương mại và thời hạn, (iii) rà soát định kỳ. Bù chéo kéo dài + có ô âm là kịch bản khó bảo vệ nhất |
| **Giá gốc bán cho Agent/đại lý** (mô hình CF) | **Cao** | Guardrail hiện có mới chỉ là `giá bán ≥ giá gốc`. Phải bổ sung guardrail thứ hai: **`giá gốc ≥ giá thành toàn bộ`**, trong đó giá thành đã gồm hoa hồng Agent (mục 2.4). Nếu không, chính giá gốc mới là mức giá bị soi |
| **Freeship / trợ giá do sàn TMĐT hoặc shop chi trả** | Trung bình | Chứng minh **doanh thu thực nhận của mình vẫn ≥ giá thành**; phần trợ giá là doanh thu từ bên thứ ba, có hợp đồng và hóa đơn. Đây thường là lý do giải trình tốt nếu chứng từ đầy đủ |
| **Lỗ ở giai đoạn đầu do sản lượng chưa đạt điểm hòa vốn** | Trung bình | Đây là lỗ do chưa đạt quy mô, không phải định giá dưới giá thành. Bằng chứng: phương án kinh doanh lập **trước** khi ban hành giá, cho thấy giá ≥ giá thành **tại sản lượng thiết kế**, kèm lộ trình đạt sản lượng. Hồ sơ lập sau khi bị hỏi thì gần như vô giá trị |

### 5.1 Lớp phòng thủ thứ hai: yếu tố "loại bỏ doanh nghiệp khác"

Điều 45.6 và Điều 27.1.a đều đòi **hai** yếu tố. Nếu một ô giá bị kết luận là dưới giá
thành, vẫn còn cửa lập luận rằng hành vi không dẫn đến và không có khả năng loại bỏ doanh
nghiệp khác. Bằng chứng nên chuẩn bị sẵn:

- **Thị phần khiêm tốn** trên thị trường liên quan (số liệu ngành, báo cáo Bộ quản lý ngành);
  thị trường chuyển phát VN có gần 800 doanh nghiệp được cấp phép — mức độ phân mảnh cao là
  dữ kiện có lợi.
- **Quy mô và thời hạn giới hạn** của mức giá thấp: chỉ áp cho một tuyến/phân khúc, tỷ trọng
  nhỏ trong tổng sản lượng, có ngày kết thúc.
- **Không có ý định loại bỏ**: đây là lý do phải kiểm soát ngôn ngữ trong tài liệu nội bộ.
  Slide, email, chat nội bộ dạng *"giá này để đối thủ X không sống nổi ở tuyến này"* là bằng
  chứng bất lợi trực tiếp và không thể rút lại. Ghi mục tiêu bằng ngôn ngữ chi phí và khách
  hàng: tăng mật độ giao hàng để giảm chi phí/đơn, thử nghiệm tuyến mới, giữ chân khách hàng.
- **Đối thủ vẫn hoạt động bình thường** trong và sau kỳ áp dụng giá.

---

## 6. Vận hành trên platform: biến việc "chứng minh" thành tự động

Hồ sơ giấy làm một lần sẽ lạc hậu sau vài tháng. Cách duy nhất bền vững là để hệ thống giữ
sẵn dữ liệu chứng minh.

### 6.1 Dữ liệu

- **`cost_rate_card`** — bảng giá thành song song với `price_book`, cùng chiều cell
  (`service × zone × weight_band`), có `version`, `effective_from/to`, `assumed_volume`,
  `model_doc_ref` (link tới hồ sơ Phần 2).
- **`price_book`** giữ thêm khóa ngoại tới phiên bản `cost_rate_card` đã dùng để phê duyệt.
- **`Order`** đã snapshot `cost_amount / sell_amount / margin`; bổ sung
  `cost_model_version` để hậu kiểm truy được đúng phiên bản giá thành tại thời điểm phát sinh.

### 6.2 Guardrail

- Chặn cứng khi phát hành bảng giá: **mọi ô** phải thỏa `sell ≥ cost_rate_card.full_cost`.
  Ô vi phạm → không cho publish, trừ khi có **override kèm lý do bắt buộc nhập + người phê
  duyệt cấp có thẩm quyền** (mọi override được ghi log và tổng hợp vào báo cáo tháng).
- Với mô hình Agent: hai tầng guardrail — `giá gốc ≥ giá thành toàn bộ` **và**
  `giá bán ≥ giá gốc`.
- Cảnh báo mềm khi `margin < ngưỡng an toàn` (ví dụ < 3%) để Finance rà trước.

### 6.3 Hậu kiểm định kỳ

- Job hàng tháng đối chiếu **giá thành mô hình vs giá thành thực tế** từ kế toán; lệch quá
  ngưỡng → tạo task cập nhật `cost_rate_card`.
- Báo cáo tháng: tỷ lệ đơn có `margin < 0`, phân bố margin theo cell, top cell rủi ro, danh
  sách override.
- Rà soát toàn bộ bảng giá **hàng quý**, và rà soát bất thường ngay khi có biến động lớn
  (giá nhiên liệu, đơn giá bưu tá, tỷ lệ hoàn tăng, sản lượng tụt dưới ngưỡng an toàn).
- **Audit log** bất biến: ai đổi giá, đổi gì, khi nào, hồ sơ phê duyệt nào.

---

## 7. Checklist trước khi ban hành / đăng ký một bảng giá

- [ ] Xác định rõ dịch vụ có thuộc diện **Nhà nước định giá** (bưu chính công ích, dịch vụ
      dành riêng) hay **doanh nghiệp tự định giá**
- [ ] Xác định rõ có thuộc **Danh mục kê khai giá** (Phụ lục V NĐ 85/2024) hay không → nếu
      có, chuẩn bị mẫu Phụ lục VI và nộp trong **05 ngày làm việc** kể từ ngày quyết định giá
- [ ] Bảng tính giá thành **theo từng cell**, không dùng bình quân toàn mạng
- [ ] Đã cộng đủ: giao lại, hoàn hàng, dự phòng bồi thường, hoa hồng Agent/kênh, chi phí
      quản lý, chi phí tài chính
- [ ] Công thức hoa hồng theo % giá bán đã dùng đúng dạng chia `1/(1−r)`
- [ ] Mọi ô có `margin ≥ 0`; ô âm (nếu có) đều có giải trình riêng theo mục 5
- [ ] Bảng độ nhạy theo sản lượng + **tuyên bố ngưỡng sản lượng an toàn**
- [ ] Đối chiếu tổng: `Σ(giá thành × sản lượng)` khớp sổ kế toán trong ngưỡng cho phép
- [ ] Chương trình khuyến mại (nếu có) tách riêng, hợp lệ theo NĐ 81/2018, giảm ≤ 50%
- [ ] Quyết định ban hành giá đã ký, viện dẫn hồ sơ tính giá thành
- [ ] **Niêm yết công khai** bảng giá tại điểm phục vụ và trên website/app
- [ ] Đóng gói phiên bản hồ sơ, lưu ≥ 5 năm
- [ ] Rà soát ngôn ngữ tài liệu nội bộ: không có câu nào thể hiện ý định loại bỏ đối thủ

---

## 8. Việc cần Business / Finance / Legal quyết

1. **Legal**: dịch vụ của công ty có thuộc Danh mục kê khai giá tại Phụ lục V NĐ 85/2024
   không? Câu trả lời quyết định toàn bộ mức độ hình thức của thủ tục.
2. **Legal**: rà lại số hiệu điều luật ở mục 1 (đặc biệt Điều 27/28 Luật Bưu chính và Điều
   21 NĐ 75/2019 — một số nguồn dẫn là Điều 20) trước khi trích dẫn trong văn bản gửi cơ
   quan nhà nước.
3. **Finance**: chốt **một** phương pháp phân bổ chi phí gián tiếp và cam kết dùng nhất
   quán; xác định ngưỡng chênh lệch chấp nhận được khi đối chiếu tổng.
4. **Finance**: có thuê kiểm toán/tư vấn độc lập soát xét mô hình giá thành lần đầu không?
   Ý kiến độc lập làm tăng đáng kể sức nặng của hồ sơ khi bị hậu kiểm.
5. **Business**: ngưỡng margin tối thiểu cho phép publish giá (đề xuất 3–5%) và ai có quyền
   override.
6. **Business + Legal**: chính sách với mô hình Agent — giá gốc có được phép bằng đúng giá
   thành (margin 0) không, hay phải có biên tối thiểu?
7. **Tech**: đưa `cost_rate_card` + guardrail hai tầng + báo cáo margin âm vào backlog cùng
   phase với tính năng bảng giá 2 tầng của mô hình Agent — làm sau sẽ phải backfill dữ liệu
   giá thành lịch sử, việc rất tốn kém.

---

## 9. Đọc tiếp

Nếu doanh nghiệp thuộc nhóm dẫn đầu thị trường, rủi ro chuyển từ Điều 45.6 (phạt tối đa
2 tỷ) sang **Điều 27.1.a — lạm dụng vị trí thống lĩnh, phạt đến 10% tổng doanh thu**, và bộ
hồ sơ cần chuẩn bị rộng hơn nhiều: xem
[`pricing-below-cost-large-player-defense.md`](./pricing-below-cost-large-player-defense.md).
