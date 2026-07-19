# Giải pháp mô hình tài khoản "Commercial Franchise" (Middle-man / Đại lý)

> Bối cảnh: Nền tảng web/app đặt dịch vụ vận chuyển (bưu chính) toàn quốc. Hiện chỉ có
> 2 cơ chế tài khoản: **Main–Sub** và **Main–Staff**. Business team cần onboard một
> dạng tài khoản mới: **middle-man** – không tự sở hữu platform lên đơn, đi phát triển
> các Shop có nhu cầu dùng DVVC để lên đơn, đứng giữa ăn chênh lệch giá (mua từ DVVC
> theo bảng giá cố định, bán lại cho Shop theo bảng giá thỏa thuận). Middle-man **không**
> phải người sử dụng dịch vụ bưu chính. DVVC **chưa** có license làm nhượng quyền.

---

## 0. Tóm tắt khuyến nghị (TL;DR)

**KHÔNG** gọi/cấu trúc đây là "nhượng quyền" (franchise) — vì DVVC chưa có license và
franchise phải đăng ký theo Luật Thương mại + NĐ 35/2006. Thay vào đó neo pháp lý vào
khái niệm đã có sẵn và hợp pháp: **Đại lý bưu chính** (Luật Bưu chính 2010) kết hợp
**đại lý thương mại hưởng chênh lệch/hoa hồng** (Luật Thương mại 2005).

Mô hình khuyến nghị: **"Đại lý bưu chính – Platform thu hộ phí ship – DVVC chi hoa hồng
chênh lệch cho Đại lý"** (Model 1 bên dưới), vì:

- Middle-man (gọi là **Agent**) **không** nằm trên dòng tiền COD → tránh giấy phép trung
  gian thanh toán / thu hộ của NHNN.
- Shop vẫn là khách hàng cuối (người gửi) của DVVC → quan hệ bưu chính hợp lệ.
- Đối soát và hóa đơn sạch: DVVC xuất hóa đơn cho Shop theo giá bán; Agent xuất hóa đơn
  hoa hồng cho DVVC theo phần chênh lệch.

Ba trụ cột: **Kỹ thuật** (mục 2) · **Tài chính – đối soát** (mục 3) · **Pháp lý** (mục 4).

---

## 1. Phân tích bài toán

### Các actor
| Actor | Vai trò | Có phải người dùng DVBC? |
|---|---|---|
| **DVVC** | Sở hữu platform, cung cấp dịch vụ vận chuyển thật, có giấy phép bưu chính | Là nhà cung cấp |
| **Agent** (middle-man / "CF") | Phát triển Shop, đặt giá bán, ăn chênh lệch. Không lên đơn | **Không** |
| **Shop** | Merchant thật sự gửi hàng, lên đơn trên platform | **Có** (người gửi) |
| Sub / Staff | Cơ chế cũ dưới 1 Main | — |

### Yêu cầu cốt lõi
1. Hệ phân cấp mới: Agent nằm **giữa** DVVC và nhiều Shop.
2. **Hai bảng giá**: giá gốc (DVVC→Agent, cố định) và giá bán (Agent→Shop, thỏa thuận).
   Agent ăn margin = giá bán − giá gốc.
3. Agent **không lên đơn**, Shop mới lên đơn.
4. Đối soát 3 bên, đặc biệt là **COD** và các điều chỉnh sau giao (cân nặng lệch, hoàn
   hàng, bồi thường).
5. Shop **không** được thấy giá gốc; margin ẩn với Shop.

### Ràng buộc/rủi ro chính
- Không có license nhượng quyền → không được đóng gói là franchise.
- COD = **thu hộ tiền hàng** → hoạt động nhạy cảm về giấy phép; Agent tuyệt đối không
  chạm dòng tiền COD.
- Hóa đơn VAT & thuế cho phần chênh lệch phải rõ ai xuất cho ai.
- Áp giá bán lại cho bên độc lập có thể vướng Luật Cạnh tranh → mô hình **đại lý** (bên
  giao đại lý ủy quyền giá) an toàn hơn mô hình "áp giá".

---

## 2. Trụ cột KỸ THUẬT

Nguyên tắc thiết kế: **tách "cây định danh/phân quyền" khỏi "cây giá & đối soát"**.

### 2.1 Mô hình tài khoản
- Thêm một **tier/loại tài khoản mới: `AGENT`** (Commercial Franchise), song song với
  Main/Sub/Staff — không phải Sub, không phải Staff.
- Bảng ánh xạ `agent_shop_link(agent_id, shop_id, status, price_book_id, effective_from,
  effective_to)`.
  - Một Shop **tại một thời điểm chỉ thuộc 1 Agent** (tránh chồng margin/tranh chấp).
  - Cho phép lịch sử để xử lý Shop chuyển Agent (churn/reassign).
- Chặn **đa cấp**: giới hạn số tầng Agent (khuyến nghị 1 tầng; nếu cho Agent tuyến dưới
  thì cap ≤ 2 và có kiểm soát để không thành mô hình kinh doanh đa cấp — rủi ro pháp lý).

### 2.2 Pricing engine — bảng giá 2 tầng
- `price_book_base`: DVVC → Agent (giá gốc, cố định theo hợp đồng đại lý).
- `price_book_sell`: Agent → Shop. Agent cấu hình markup theo 1 trong các cách:
  - % cộng thêm trên giá gốc, hoặc
  - cộng cố định +X theo zone/khối lượng, hoặc
  - bảng giá tùy chỉnh riêng cho từng Shop.
- **Guardrail bắt buộc**: `giá bán ≥ giá gốc` (sàn = giá gốc) do platform ép, chặn margin
  âm. Có thể set trần markup để bảo vệ uy tín DVVC.
- Khi Shop tạo đơn: engine resolve giá bán hiệu lực → **chốt snapshot bất biến** trên đơn:
  `cost_amount`, `sell_amount`, `margin = sell − cost`, `agent_id`.

### 2.3 Luồng đơn hàng
```
Shop tạo đơn ──► định giá theo price_book_sell ──► DVVC nhận & vận chuyển
        │
        └─ đơn lưu: shop_id, agent_id, cost_amount, sell_amount, margin (snapshot)
```

### 2.4 Ví & sổ cái (ledger)
- 3 sổ tách biệt: **DVVC platform ledger**, **Agent wallet** (chỉ ghi nhận hoa hồng/margin),
  **Shop wallet** (phí ship + COD phải trả về Shop).
- **COD tách khỏi Agent hoàn toàn**: dòng COD chỉ đi DVVC ↔ Shop.

### 2.5 Phân quyền & hiển thị
- **Agent dashboard**: onboard Shop (invite link/mã giới thiệu), cấu hình price_book_sell,
  báo cáo margin tổng hợp, sản lượng theo Shop. **Không** thấy COD/PII vượt nhu cầu.
- **Shop**: dùng platform như bình thường, chỉ thấy **giá bán**, không thấy giá gốc & margin.
- Agent A không thấy dữ liệu/giá của Agent B.

### 2.6 Onboarding flow
`Agent tạo lời mời → Shop đăng ký qua link/mã → tự động gắn agent_shop_link → gán
price_book_sell → Shop chấp nhận ToS của DVVC (quan hệ bưu chính hợp lệ)`.

### 2.7 Thực thể dữ liệu (tóm tắt)
`Account(type)` · `AgentContract` · `PriceBook(base|sell)` · `AgentShopLink` ·
`Order(cost, sell, margin snapshot)` · `Wallet/Ledger` mỗi bên · `SettlementBatch` ·
`Adjustment` (cân lệch/hoàn/bồi thường).

---

## 3. Trụ cột TÀI CHÍNH – ĐỐI SOÁT

### 3.1 Các dòng tiền cần đối soát
1. **Phí ship**: Shop trả theo giá bán → tách: giá gốc về DVVC, margin về Agent.
2. **COD (thu hộ tiền hàng)**: người mua → DVVC → **Shop** (chủ hàng).
3. **Điều chỉnh**: cân nặng lệch, hoàn/giao lại, bồi thường mất/hư, refund.

### 3.2 Hai kiến trúc thanh toán

**Model 1 — Platform thu, DVVC chi hoa hồng đại lý (KHUYẾN NGHỊ)**
- Shop trả **trọn giá bán** cho DVVC (platform thu, prepaid ví hoặc postpaid công nợ).
- DVVC giữ giá gốc, **chi trả cho Agent phần margin dưới dạng hoa hồng đại lý**.
- Agent **không** chạm tiền của Shop/người mua → tránh giấy phép trung gian thanh toán.
- COD do DVVC hoàn thẳng cho Shop.
- Đối soát: cộng dồn margin theo đơn → bảng kê hoa hồng (tuần/tháng) → **Agent xuất hóa
  đơn VAT hoa hồng cho DVVC** → DVVC thanh toán.

**Model 2 — Agent "mua đứt bán đoạn" (reseller)**
- DVVC xuất công nợ cho Agent theo giá gốc cho toàn bộ đơn của các Shop thuộc Agent.
- Agent tự thu giá bán từ Shop → **Agent gánh rủi ro công nợ Shop** trong khi vẫn nợ DVVC.
- Agent nằm trên dòng tiền → rủi ro cao, nếu COD chảy qua Agent thì vướng thu hộ.
- Đối soát: bảng kê DVVC↔Agent theo giá gốc; Agent↔Shop theo giá bán (Agent tự chịu,
  platform chỉ cấp công cụ).

| Tiêu chí | Model 1 (Hoa hồng đại lý) | Model 2 (Mua đứt bán đoạn) |
|---|---|---|
| Agent chạm dòng tiền | Không | Có |
| Rủi ro giấy phép thu hộ (COD) | Thấp | Cao |
| Rủi ro công nợ Shop | DVVC/Platform | Agent gánh |
| Hóa đơn | DVVC→Shop (giá bán); Agent→DVVC (hoa hồng) | DVVC→Agent (giá gốc); Agent→Shop (giá bán) |
| Doanh thu DVVC ghi nhận | Giá bán, trừ hoa hồng | Giá gốc |
| Độ phức tạp kỹ thuật platform | Trung bình | Cao (thêm AR Agent↔Shop) |
| **Khuyến nghị** | **✅ Chính** | Phương án 2/đặc thù |

### 3.3 Cơ chế đối soát
- **Snapshot margin bất biến** theo đơn; mọi điều chỉnh tạo bản ghi `Adjustment` tính lại
  cost/sell/margin và **quy trách nhiệm ai chịu** (ví dụ phí hoàn: Shop chịu hay trừ margin
  Agent — phải định nghĩa rõ trong hợp đồng).
- **Chu kỳ**: dồn tích T+1 hằng ngày; chi trả Agent theo tuần/tháng.
- **Bảng kê**: Agent (kê hoa hồng/margin) · Shop (kê phí ship theo giá bán) · DVVC nội bộ
  (giá gốc + hoa hồng phải trả).
- **Quy trình tranh chấp** theo từng dòng: Shop khiếu nại giá bán với Agent; Agent↔DVVC
  khiếu nại giá gốc.
- **Ví/công nợ**: xử lý số dư âm, hạn mức tín dụng (postpaid), nạp tiền (prepaid),
  **giữ/escrow COD** để bảo vệ Shop.

### 3.4 Thuế & hóa đơn (Model 1)
- Dịch vụ bưu chính do **DVVC cung cấp cho Shop** (Shop là người gửi) → **DVVC xuất hóa
  đơn VAT cho Shop theo giá bán**; ghi nhận doanh thu = giá bán.
- **Agent xuất hóa đơn VAT hoa hồng cho DVVC = phần margin** → doanh thu thuần DVVC = giá gốc.
- Agent nộp VAT + TNDN trên hoa hồng (hoặc TNCN nếu là cá nhân) → cần **ĐKKD ngành đại lý/
  môi giới** hợp lệ.

---

## 4. Trụ cột PHÁP LÝ

### 4.1 Không dùng khung "nhượng quyền"
Franchise (Luật Thương mại Đ.284+, NĐ 35/2006) yêu cầu đăng ký và trao quyền dùng thương
hiệu/hệ thống. DVVC **chưa** có license → **không đóng gói là nhượng quyền**.

### 4.2 Neo pháp lý: "Đại lý bưu chính"
Luật Bưu chính 2010 công nhận **đại lý bưu chính**: hoạt động theo **hợp đồng đại lý** với
doanh nghiệp bưu chính đã có giấy phép. Điểm mấu chốt:
- Agent **không cần** giấy phép bưu chính riêng — chỉ cần hợp đồng đại lý với DVVC.
- Agent nhân danh/thay mặt DVVC, có thể được **ủy quyền đặt giá trong biên độ** hoặc hưởng
  hoa hồng.
- Giải quyết gọn cả 3 vấn đề: **không phải franchise · không phải nhà cung cấp bưu chính
  độc lập · không phải người dùng dịch vụ**.

### 4.3 COD / thu hộ
Thu hộ tiền hàng có thể bị xem là **trung gian thanh toán** cần giấy phép NHNN. DVVC cung
cấp COD như **dịch vụ bưu chính cộng thêm (phát hàng thu tiền)** thì nằm trong khung bưu
chính. **Giữ COD hoàn toàn trên trục DVVC↔Shop; Agent chỉ hưởng margin/hoa hồng phí ship.**
→ củng cố cho Model 1.

### 4.4 Bộ hợp đồng (3 lớp)
1. **DVVC ↔ Agent**: Hợp đồng đại lý bưu chính / đại lý thương mại — giá gốc, cơ chế hoa
   hồng/chênh lệch, phạm vi, nghĩa vụ, trách nhiệm, **cấm Agent tự ý thu hộ**, xử lý điều
   chỉnh/bồi thường.
2. **DVVC ↔ Shop**: Shop chấp nhận **ToS của DVVC** trên platform (DVVC là bên cung cấp
   dịch vụ bưu chính, quan hệ hợp lệ), Agent là đối tác thương mại quản lý giá của Shop.
3. **Agent ↔ Shop** (thương mại/giới thiệu): ở Model 1 chỉ là quan hệ giới thiệu & thỏa
   thuận giá; ở Model 2 mới là hợp đồng bán lại dịch vụ.

### 4.5 Trách nhiệm & bảo vệ người tiêu dùng
- Mất/hư/chậm: **DVVC (bên vận chuyển thật) chịu trách nhiệm với Shop**; trách nhiệm Agent
  giới hạn ở thương mại/giá.
- Sàng lọc hàng cấm/hạn chế vẫn là nghĩa vụ tuân thủ của DVVC.

### 4.6 Dữ liệu cá nhân
Agent tiếp cận dữ liệu Shop & thông tin người nhận → cần **thỏa thuận xử lý dữ liệu** giữa
DVVC và Agent (theo NĐ 13/2023 về bảo vệ dữ liệu cá nhân): xác định vai trò xử lý, giới hạn
mục đích, bảo mật.

### 4.7 Cạnh tranh
Áp **giá bán lại** cho bên độc lập có thể vướng Luật Cạnh tranh (ấn định giá bán lại). Mô
hình **đại lý (bên giao đại lý ủy quyền/kiểm soát giá)** an toàn hơn mô hình áp giá cho
reseller độc lập → thêm một lý do chọn Model 1.

---

## 5. Blueprint khuyến nghị (ghép 3 trụ cột)

**"Đại lý bưu chính hưởng chênh lệch/hoa hồng" = Model 1 + neo pháp lý đại lý bưu chính**

- **Pháp lý**: Agent = đại lý bưu chính của DVVC (hợp đồng đại lý). Không franchise, không
  nhà cung cấp bưu chính độc lập. Shop = khách hàng cuối của DVVC (chấp nhận ToS).
- **Kỹ thuật**: thêm tier `AGENT`; bảng giá 2 tầng (giá gốc + giá bán do Agent set, có sàn);
  agent_shop_link; snapshot cost/sell/margin theo đơn; dashboard Agent (onboard + giá +
  báo cáo margin); Shop dùng bình thường, chỉ thấy giá bán.
- **Tài chính**: platform thu giá bán từ Shop (prepaid/postpaid), DVVC giữ giá gốc, chi hoa
  hồng margin cho Agent theo chu kỳ; COD chỉ DVVC↔Shop; đối soát tháng + hóa đơn hoa hồng
  Agent→DVVC; DVVC xuất hóa đơn giá bán cho Shop.

---

## 6. Lộ trình triển khai (đề xuất)

**Phase 0 – Pháp lý & tài chính (song song với dev):** soạn hợp đồng đại lý bưu chính, quy
chế đối soát/hoa hồng, luồng hóa đơn, ToS Shop, DPA dữ liệu.

**Phase 1 – MVP kỹ thuật:** tier `AGENT` + agent_shop_link + onboarding link; bảng giá 2
tầng với markup % và sàn; snapshot cost/sell/margin; dashboard margin cơ bản; COD giữ nguyên
trục DVVC↔Shop.

**Phase 2 – Đối soát tự động:** SettlementBatch, bảng kê hoa hồng, quy trình khiếu nại theo
dòng, xử lý Adjustment (cân lệch/hoàn/bồi thường), ví/công nợ postpaid + hạn mức.

**Phase 3 – Nâng cao:** bảng giá tùy chỉnh per-Shop, báo cáo BI cho Agent, chuyển Shop giữa
Agent, (tùy chọn) tầng Agent thứ 2 có kiểm soát pháp lý.

---

## 7. Rủi ro & câu hỏi mở cần Business/Legal quyết
- Phí hoàn/hủy/cân lệch: Shop chịu hay trừ margin Agent? (định nghĩa rõ trong hợp đồng)
- Chính sách khi Shop rời Agent (đơn đang treo, công nợ, đối soát dở dang).
- Có cho Agent tầng dưới không? → cân nhắc rủi ro "đa cấp".
- Hạn mức tín dụng postpaid cho Shop/Agent & bên gánh rủi ro nợ xấu.
- Model 1 vs Model 2 theo thực tế dòng tiền hiện tại của DVVC (khả năng platform đứng thu).
```
