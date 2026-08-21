# Giá vốn kênh Agent: có được bỏ fix cost không?

> Tranh luận: Fin định nghĩa true cost (giá vốn) **phải gồm fix cost**. Biz lập luận với mô
> hình đi qua middle-man thì tính fix cost là không đúng, vì kênh đó không tốn chi phí
> BD/sale. Lập luận này dùng được không?

---

## 1. Trả lời ngắn: đúng một nửa

| Chỗ Biz đúng | Chỗ Fin đúng |
|---|---|
| Phân bổ **chi phí đội BD/sale trực tiếp** vào đơn của kênh Agent là **sai nguyên tắc kế toán**, vì kênh đó không tiêu dùng nguồn lực này. Phân bổ phải theo **quan hệ nhân quả**, không phải chia đều theo đầu đơn | Không thể **bỏ fix cost** ra khỏi giá vốn. Kênh Agent vẫn dùng chung hub, xe, tuyến, kho, platform, bộ máy quản lý — những thứ đó là fix cost và **phải** được phân bổ vào |

**Vấn đề nằm ở cách đặt câu hỏi.** Đang tranh luận "có gồm fix cost hay không" — sai đề.
Câu hỏi đúng là: **"fix cost nào được phân bổ vào kênh nào, theo cơ sở gì?"**

Đổi sang câu hỏi này thì cả hai bên đều thắng: Biz gỡ được khoản BD/sale ra khỏi giá vốn kênh
Agent, Fin giữ được nguyên tắc full cost và không phải ký vào một ngoại lệ khó giải thích.

---

## 2. Ba nhóm chi phí ở kênh Agent — không phải hai

Sai lầm phổ biến là chia làm hai nhóm "tránh được / không tránh được". Thực tế có **ba**,
và nhóm thứ ba là nhóm Biz hay quên:

### Nhóm A — Thực sự tránh được (KHÔNG phân bổ vào kênh Agent) ✅

- Lương + hoa hồng đội BD/sale trực tiếp
- Marketing thu hút shop (performance marketing, khuyến mãi acquisition)
- Chi phí onboarding/KYC shop — **nếu** Agent thực sự làm
- CSKH tuyến đầu cho shop nhỏ — **nếu** Agent thực sự gánh
- Chi phí thu hồi công nợ, rủi ro nợ xấu — **nếu** Agent gánh (Model 2)

> Bốn chữ "nếu" ở trên là chỗ Fin sẽ vặn, và vặn đúng. Phải chứng minh bằng số liệu ở mục 6,
> không phải bằng mô tả mô hình trên slide.

### Nhóm B — Không tránh được (BẮT BUỘC phân bổ) ❌

- Toàn bộ chi phí mạng lưới: pickup, trung chuyển, hub/chia chọn, linehaul, phát cuối
- Khấu hao xe, băng chuyền, thiết bị; thuê kho/hub
- Chi phí hoàn hàng, giao lại, bồi thường — không đổi theo kênh
- Chi phí quản lý doanh nghiệp, kế toán, pháp chế, tài chính
- Chi phí vốn, phí ngân hàng, xử lý COD

Đơn của Agent đi qua **đúng cái hub đó, đúng cái xe đó, đúng anh bưu tá đó**. Không có cơ sở
nào để miễn nhóm này.

### Nhóm C — Phát sinh THÊM ở kênh Agent (Biz hay quên) ⚠️

- **Hoa hồng/margin trả cho Agent** — khoản lớn nhất, xem mục 3
- Chi phí quản trị kênh: đội KAM quản lý Agent, đào tạo, kiểm soát chất lượng Agent
- **Đối soát ba bên** phức tạp hơn hẳn hai bên: bảng kê hoa hồng, xử lý tranh chấp theo dòng,
  phân định trách nhiệm khi có điều chỉnh cân nặng/hoàn hàng
- Phát triển & vận hành tính năng riêng: dashboard Agent, bảng giá 2 tầng, snapshot margin →
  **chi phí IT/đơn của kênh Agent CAO HƠN kênh trực tiếp**, không thấp hơn
- Chi phí tuân thủ tăng: thỏa thuận xử lý dữ liệu cá nhân với Agent, kiểm soát truy cập PII

---

## 3. Cái bẫy chết người: hoa hồng Agent **thay thế** chi phí BD, chứ không xóa nó

Đây là chỗ lập luận của Biz dễ vỡ nhất.

Kênh Agent không làm chi phí bán hàng biến mất — nó **đổi tên**: từ *lương đội BD* thành
*hoa hồng Agent*. Và hoa hồng Agent thường **đắt hơn** chi phí BD in-house tính trên đơn.

### Ví dụ số (minh họa)

Giả định: 1.000.000 đơn/tháng, trong đó kênh trực tiếp 700.000, kênh Agent 300.000.
Tổng chi phí bán hàng toàn công ty 3 tỷ/tháng → phân bổ bình quân **3.000 đ/đơn**.

**Cách Biz đang lập luận (thiếu):**

> "Kênh Agent không tốn BD/sale → bỏ 3.000 đ/đơn ra khỏi giá vốn → tiết kiệm 3.000 đ/đơn."

**Tính đầy đủ:**

| Khoản | Kênh trực tiếp | Kênh Agent |
|---|---:|---:|
| Chi phí BD/sale phân bổ (3 tỷ dồn hết về kênh trực tiếp) | 4.286 | 0 |
| Hoa hồng Agent (10% × giá bán 25.000) | 0 | 2.500 |
| Chi phí quản trị kênh Agent (KAM, đối soát 3 bên, IT riêng) | 0 | 400 |
| **Tổng chi phí bán hàng/đơn** | **4.286** | **2.900** |

→ Tiết kiệm thực tế so với mức bình quân 3.000: **chỉ 100 đ/đơn**, không phải 3.000 đ/đơn.

→ Và nếu hoa hồng Agent là **12%**: 3.000 + 400 = **3.400 đ/đơn** → kênh Agent **đắt hơn**
mức bình quân 400 đ/đơn.

**Kết luận phải nói thẳng với Biz team:** việc gỡ chi phí BD ra khỏi kênh Agent hầu như không
tạo thêm dư địa giảm giá. Nếu đang trông chờ vào đó để hạ giá, con số sẽ gây thất vọng — và
nếu trình cho Fin bản chỉ có phần "bỏ 3.000" mà thiếu phần "cộng 2.900", Fin sẽ phát hiện
ngay và mất tin cậy cho cả những lập luận đúng còn lại.

### Quy tắc so sánh đúng cặp

Trong mô hình Agent có hai mức giá, rất dễ so lệch:

| Cách | So cái gì với cái gì |
|---|---|
| **A** | **Giá gốc** (DVVC thực nhận) vs giá thành **KHÔNG gồm** hoa hồng Agent |
| **B** | **Giá bán** (Shop trả) vs giá thành **CÓ gồm** hoa hồng Agent |

Hai cách cho **cùng một kết quả**. Sai lầm là trộn hai cách — lấy giá gốc so với giá thành đã
gồm hoa hồng (quá khắt khe, tự làm khó mình), hoặc lấy giá bán so với giá thành chưa gồm hoa
hồng (quá dễ dãi, và đây chính là kiểu sai mà audit sẽ tìm ra).

---

## 4. Vì sao lập luận "bỏ fix cost" KHÔNG dùng được để phòng thủ audit

Điểm này quyết định, và cần nói rõ để Biz không đi sai hướng ngay từ đầu.

Luật Cạnh tranh 2018 dùng đúng chữ **"dưới giá thành toàn bộ"** ở cả Điều 27.1.a và Điều 45.6.
"Toàn bộ" = full cost, gồm cả định phí phân bổ và chi phí bán hàng, quản lý. **Không có phiên
bản nào của điều luật nói tới chi phí biên hay chi phí tăng thêm.**

Có **hai chuẩn chi phí cho hai quyết định khác nhau**, và không được dùng lẫn:

| Quyết định | Chuẩn chi phí đúng | Ai dùng |
|---|---|---|
| Có nên nhận lô đơn này không? Có nên mở kênh Agent không? | **Chi phí tăng thêm** (incremental) — biên đóng góp > 0 là đủ | Biz, để ra quyết định kinh doanh |
| Đăng ký bảng giá, phòng thủ khi bị challenge | **Giá thành toàn bộ** (full cost) | Fin + Legal, để bảo vệ hồ sơ |

Lập luận của Biz là lập luận theo chuẩn thứ nhất. **Nó đúng về kinh tế, nhưng không phải là
thước đo mà audit dùng.** Mang nó ra cãi với kiểm tra viên sẽ thua, vì họ chỉ cần đọc lại chữ
"toàn bộ" trong luật.

→ Nên **Fin đúng ở tầng nguyên tắc**, và đừng đấu với Fin ở tầng đó. Chỗ đấu được, và đấu
thắng, là **cơ sở phân bổ** — mục 5.

---

## 5. Cách trình bày để Fin đồng ý

### Đừng xin ngoại lệ. Đề xuất đổi phương pháp.

| ❌ Cách sẽ bị từ chối | ✅ Cách Fin ký được |
|---|---|
| "Kênh Agent xin không tính fix cost" | "Đề nghị chuyển từ **phân bổ bình quân theo đầu đơn** sang **phân bổ theo kênh dựa trên cost driver**, áp dụng **đồng thời cho tất cả các kênh**" |
| Nghe như xin giảm giá vốn cho riêng mình | Là một thay đổi phương pháp luận chính đáng, chuẩn mực, dùng chung |

Vì sao cách thứ hai an toàn cả trước audit: doc trước đã nêu một dấu hiệu xấu là **"thay đổi
phương pháp giữa chừng theo hướng có lợi cho mình"**. Xin ngoại lệ cho riêng kênh Agent rơi
đúng vào dấu hiệu đó. Còn đổi phương pháp cho toàn bộ các kênh, có tài liệu, áp dụng nhất
quán từ một mốc thời gian rõ ràng, thì là nâng cấp chất lượng kế toán quản trị — **làm mạnh
hồ sơ lên chứ không yếu đi**.

### Kỷ luật bắt buộc: TÁI phân bổ, không phải XÓA

Đây là điều Fin thật sự lo, và cần cam kết ngay từ câu đầu:

$$\sum_{\text{tất cả các kênh}} (\text{chi phí phân bổ}) = \text{tổng chi phí trên sổ kế toán}$$

3 tỷ chi phí BD không được **bốc hơi**. Gỡ khỏi kênh Agent thì phải **dồn hết về kênh trực
tiếp** (4.286 đ/đơn thay vì 3.000). Hệ quả phải kiểm tra ngay và báo cáo cùng lúc:

- Kênh trực tiếp sau khi gánh đủ **có còn biên dương không?**
- Nếu không → phát hiện quan trọng: kênh trực tiếp đang được kênh Agent bù chéo, và đó là vấn
  đề thật cần xử lý, không phải vấn đề trình bày.

Nói trước điều này với Fin, trước khi Fin phải tự hỏi, là cách nhanh nhất để lấy được lòng tin.

---

## 6. Số liệu Biz phải đưa để chứng minh (không mô tả bằng lời)

Fin sẽ không chấp nhận "mô hình Agent thì không tốn BD" như một mệnh đề hiển nhiên. Cần đo:

| Cần chứng minh | Bằng chứng cụ thể |
|---|---|
| Đội BD/sale không phục vụ kênh Agent | Headcount mapping: bao nhiêu FTE thuộc kênh nào; timesheet hoặc phân công theo tổ chức. **Nếu có KAM quản lý Agent thì đó vẫn là chi phí bán hàng của kênh Agent** — phải tính vào, không được bỏ |
| Agent thực sự gánh onboarding/CSKH | Số ticket CSKH phát sinh từ shop thuộc Agent so với shop trực tiếp; ai xử lý; SLA quy định trong hợp đồng đại lý |
| Marketing không chi cho shop của Agent | Bóc chi tiêu marketing theo kênh; shop thuộc Agent có nằm trong tệp target không |
| Không phát sinh nợ xấu ở kênh Agent | Số liệu công nợ quá hạn theo kênh |
| Chi phí quản trị kênh Agent là bao nhiêu | Nhân sự KAM + đối soát + phần IT phát triển riêng cho tính năng Agent, chia cho sản lượng kênh |

Nguyên tắc: **mỗi khoản gỡ ra khỏi kênh Agent phải chỉ được đích danh nó đi đâu và ai gánh.**
Khoản nào không chỉ được thì để nguyên.

---

## 7. Một bẫy phụ, nhưng cần biết trước

Nếu **giá gốc** bán cho Agent thấp hơn đáng kể so với giá áp cho khách trực tiếp cùng dịch vụ,
chênh lệch đó phải giải thích được bằng **chênh lệch chi phí phục vụ có số liệu**. Nếu không,
rủi ro chuyển từ "bán dưới giá thành" sang **"áp dụng điều kiện thương mại khác nhau trong
các giao dịch tương tự"** — cũng là hành vi bị cấm với doanh nghiệp có vị trí thống lĩnh.

Tin tốt: bộ số liệu ở mục 6 phục vụ được **cả hai** mục đích. Làm một lần, dùng cho hai rủi
ro khác nhau.

---

## 8. Tóm tắt để mang vào họp

1. Không đấu với Fin ở mệnh đề "giá vốn phải gồm fix cost" — **Fin đúng**, và luật ghi rõ chữ
   *"giá thành toàn bộ"*.
2. Đấu ở **cơ sở phân bổ**: chi phí BD/sale phân bổ vào kênh không tiêu dùng nó là sai nguyên
   tắc nhân quả. **Chỗ này Biz đúng.**
3. Đề xuất đổi phương pháp **cho tất cả các kênh**, không xin ngoại lệ cho riêng kênh Agent.
4. Cam kết trước: tổng chi phí phân bổ vẫn khớp sổ — **tái phân bổ, không phải xóa**.
5. Trình luôn con số đầy đủ: gỡ BD ra thì phải cộng hoa hồng Agent và chi phí quản trị kênh
   vào. Dư địa thật thường rất mỏng, đôi khi âm. Trình thiếu vế này là mất tin cậy.
6. Mang theo số liệu mục 6, không mang theo mô tả mô hình.
