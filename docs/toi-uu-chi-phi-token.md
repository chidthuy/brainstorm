# Tiền token đi đâu — và cắt thế nào

Bản nghiên cứu chi phí cho Screening Assistant. Viết ngày 2026-08-04.
Mọi con số dưới đây suy ra từ **chính code trong repo này** (kích thước prompt đo
thật bằng script, không ước lượng mò) + bảng giá công khai của Anthropic và Google.

---

## 0. Kết luận trước, lý do sau

1. **Chỗ tốn nhất không phải "dùng Claude thay vì Google" — mà là app đang làm
   những việc không cần làm.** Riêng bước `recommend` (gợi ý video cùng chủ đề)
   ăn ~18% hóa đơn mỗi lần soi mà **không đóng góp gì** cho quyết định
   WATCH/SKIM/SKIP. Nó chạy tự động mọi lần.
2. **App đang mù về chi phí.** `server/claude.js` vứt bỏ `resp.usage`,
   `server/gemini.js` vứt bỏ `usageMetadata`. Không có một dòng log token nào.
   Không đo thì mọi tối ưu sau đó đều là đoán.
3. **Gợi ý của thầy đúng hướng nhưng sai chỗ.** Đổi hẳn sang Gemini chỉ rẻ
   ~50% và tốn hàng tuần viết lại + kiểm định lại chất lượng. Trong khi các
   thay đổi ở mục 3 dưới đây cắt được **40–55% ngay, không đổi nhà cung cấp,
   không giảm chất lượng**. Chỗ Google thật sự thắng tuyệt đối là **transcript**
   — và app **đã** dùng Gemini cho đúng chỗ đó rồi.
4. **Có một quả bom hẹn giờ:** giá khuyến mãi của Sonnet 5 ($2/$10) hết hạn
   **31/08/2026**. Từ 1/9 giá về $3/$15 — hóa đơn tự động **tăng 50%** dù không
   đổi gì. Đây là lý do nên làm mục 3 trong tháng này.

---

## 1. Một lần "Soi" tốn bao nhiêu

### Giá đầu vào (USD / 1 triệu token)

| Model | Input | Output | Ghi chú |
|---|---|---|---|
| Claude Sonnet 5 | **$2.00** → $3.00 | **$10.00** → $15.00 | giá KM hết hạn 31/08/2026 |
| Claude Opus 4.8 | $5.00 | $25.00 | 1.7–2.5× Sonnet |
| Claude Haiku 4.5 | $1.00 | $5.00 | rẻ nhất bên Claude |
| Gemini 3.6 Flash | $1.50 | $7.50 | cached read $0.15 |
| Gemini 3.1 Flash-Lite | ~$0.25 | ~$1.50 | rẻ nhất, yếu hơn nhiều |

Ngoài token còn hai khoản **ẩn**, không nằm trong bảng giá token:

- **Web search của Claude: $10 / 1.000 lượt = $0.01 mỗi lượt tìm.**
  App đang cho phép tối đa **5** lượt (`factcheck`) + **3** lượt (`recommend`)
  + **4** lượt mỗi câu chat (`ask`).
- **Gemini nghe video:** tính cả token audio (~32 token/giây) lẫn token khung
  hình. Video 2 tiếng ≈ 300–500 nghìn token input.

### Prompt cố định của từng pass (đo thật)

| Pass | System (ký tự) | max_tokens | Web search |
|---|---|---|---|
| `content` | 6.823 | 6.000 | không |
| `compose` | 3.172 | 3.000 | không |
| `ask` | 2.432 | 3.000 | **có (4)** |
| `factcheck` | 1.420 | 8.000 | **có (5)** |
| `social` | 859 | 2.000 | không |
| `recommend` | 358 | 4.096 | **có (3)** |

Prompt cố định **không phải** vấn đề — tất cả cộng lại chưa tới 15k ký tự.
Vấn đề nằm ở phần **biến thiên**: transcript và kết quả web search.

### Bảng chi phí một lần soi (video 2 tiếng, **có sẵn phụ đề**, Sonnet 5, giá thường $3/$15)

| Pass | Input (token) | Output | Tiền token | Tiền search | Tổng |
|---|---:|---:|---:|---:|---:|
| `content` | ~40.000 (transcript) | 2.500 | $0.158 | – | **$0.158** |
| `factcheck` | ~25.000 (kèm kết quả search) | 1.500 | $0.098 | $0.05 | **$0.148** |
| `recommend` | ~12.000 | 700 | $0.047 | $0.03 | **$0.077** |
| `compose` | ~4.000 | 1.000 | $0.027 | – | **$0.027** |
| `social` | ~3.000 | 400 | $0.015 | – | **$0.015** |
| | | | | | **≈ $0.43** |

≈ **11.000 VNĐ / video**. Với giá KM hiện tại thì ≈ $0.32 (~8.000 VNĐ).
Mỗi câu hỏi thêm ở khung Chat: ≈ **$0.10** (~2.500 VNĐ) — vì `ask` có web search.

### Nếu video **không có phụ đề** (phải nhờ Gemini nghe)

Video 2 tiếng → ~6 cửa sổ 20 phút → tổng ~300–500k token input + ~30k output
trên Gemini 3.6 Flash ≈ **$0.50–$0.90** — tức là **riêng khâu lấy transcript đã
đắt hơn toàn bộ phần phân tích của Claude**.

> ⚠️ Con số này là ước lượng theo cách Gemini tính token video. **Phải đo lại
> bằng `usageMetadata`** (mục 3.1) trước khi tin. Nếu đang dùng key free của AI
> Studio thì khoản này = **$0** — xem mục 4.

### Ai đang ăn tiền

```
content    ███████████████████  37%   ← transcript dài
factcheck  ██████████████████   34%   ← 12% là phí web search
recommend  █████████            18%   ← không giúp gì cho quyết định xem/bỏ
compose    ███                   6%
social     ██                    3%
```

---

## 2. Ba sự thật quan trọng rút ra từ code

**a. `recommend` là chi phí thuần.** `public/app.js` chạy nó tự động sau
`content` mỗi lần soi. Nhưng sản phẩm này tồn tại để trả lời *"có đáng bỏ 2
tiếng nghe video NÀY không"*. Danh sách video khác không tham gia vào câu trả lời
đó, không vào thang điểm 5 trục, không vào verdict. 18% hóa đơn cho một tính năng
phụ chạy mặc định.

**b. Mọi pass đang dùng chung một model.** `runStep` truyền `opts.model` cho tất
cả. `social` chỉ đọc comment rồi viết 1–3 câu — việc của Haiku. `recommend` chỉ
tìm và liệt kê — cũng việc của Haiku. Nhưng cả hai đang chạy Sonnet 5 vì người
dùng chọn "Sonnet" ở ô model. Nếu ai đó chọn **Opus 4.8**, hóa đơn nhảy từ
$0.43 lên **$0.72** mỗi video — và ô chọn model không hề báo giá.

**c. Không có prompt caching ở đâu cả.** Đáng chú ý nhất là khung Chat:
`buildAsk` nhét **toàn bộ JSON báo cáo** vào mỗi câu hỏi. Hỏi 5 câu về cùng một
video = gửi lại báo cáo 5 lần, trả tiền đủ 5 lần. Cache đọc chỉ tốn 10% giá gốc.

---

## 3. Kế hoạch cắt giảm — xếp theo (tiền tiết kiệm ÷ công sức)

### Tầng 1 — làm ngay, không giảm chất lượng (**cắt ~40–55%**)

| # | Việc | Tiết kiệm | Công sức |
|---|---|---|---|
| 3.1 | **Log `usage`** ở `claude.js` + `usageMetadata` ở `gemini.js`; hiện chi phí thật của mỗi lần soi ở cuối báo cáo | $0 (nhưng là điều kiện cần cho mọi mục sau) | ~1h |
| 3.2 | **`recommend` → nút bấm theo yêu cầu**, bỏ khỏi luồng tự động | **−$0.077 (18%)** | ~1h |
| 3.3 | **Ghim `social` và `recommend` vào Haiku 4.5**, bất kể người dùng chọn model gì | −$0.04 (9%) | ~30ph |
| 3.4 | **Giảm `max_uses`:** `factcheck` 5→3, `ask` 4→3 | −$0.03 (7%) | 5 phút |
| 3.5 | **Prompt caching cho `ask`** (JSON báo cáo là prefix ổn định trong cả phiên chat) | −~85% chi phí từ câu hỏi thứ 2 trở đi | ~2h |
| 3.6 | **Prompt caching cho system prompt của `content`/`compose`** — cần tách `system` thành mảng block để đặt được `cache_control` | −$0.01/video | ~1h |
| 3.7 | **Đặt spend limit + cảnh báo** trong Anthropic Console và Google AI Studio | chặn hóa đơn bất ngờ | 10 phút |
| 3.8 | **Ghi giá vào ô chọn model** (`Opus 4.8 — kỹ nhất, đắt gấp ~1.7×`) | tránh chọn nhầm | 5 phút |

Sau tầng 1: **$0.43 → khoảng $0.22–0.26 / video**, chất lượng báo cáo **không
đổi** (mọi pass quyết định điểm số vẫn nguyên Sonnet 5).

### Tầng 2 — cần đo và kiểm chứng trước

**3.9. Chế độ "soi hàng loạt" qua Batch API — giảm thẳng 50%.**
Anthropic Batch API rẻ đúng một nửa, đổi lại kết quả về trong vòng vài giờ.
Sản phẩm này hợp một cách bất thường: người dùng thường có sẵn một danh sách
video muốn lọc, và bản chất công cụ là *lọc trước khi xem* chứ không phải xem
ngay. Thêm ô "dán 10 link, mai xem kết quả" → **50%** cho toàn bộ luồng đó.
Đây là phương án có tỉ lệ tiết kiệm/rủi ro tốt nhất còn lại.

**3.10. Thử hạ model cho pass `content` — nhưng phải A/B, đừng đoán.**
`content` là 37% hóa đơn nhưng cũng là pass **quyết định chất lượng**: toàn bộ
tóm tắt, stance, facts trụ đỡ đều từ đây. Hạ xuống Gemini 3.6 Flash cắt được
một nửa dòng này ($0.158 → $0.079), Haiku 4.5 cắt được 2/3.
**Cách làm đúng:** chạy song song trên 5–10 video thật đã biết kết quả, so theo
đúng thang `QUALITY_LADDER` của repo (ĐÚNG → ĐỦ → HỮU ÍCH). Nếu Haiku bịa tên
tác giả hay bỏ sót luận điểm chính thì tiết kiệm 5.000 VNĐ không đáng — công cụ
này bán sự chính xác.

**Điều KHÔNG nên làm:** nén transcript bằng model rẻ rồi đưa bản nén cho Sonnet.
Nghe hợp lý nhưng vi phạm chính luật của repo — "thà thiếu một ý còn hơn sai một
ý" — vì lỗi ở tầng nén sẽ lan xuống mọi tầng sau mà không ai phát hiện được.

### Tầng 3 — chuyển sang Google API (đánh giá thẳng thắn)

Thầy gợi ý API Google. Đánh giá theo con số:

| | Giữ Claude + tầng 1 | Chuyển hẳn sang Gemini 3.6 Flash |
|---|---|---|
| Chi phí/video | ~$0.24 | ~$0.21 (chưa kể phải viết lại) |
| Công sức | ~1 ngày | Viết lại `claude.js` + 6 pass, đổi web search sang Google Search grounding (giá riêng), tinh chỉnh lại toàn bộ prompt, kiểm định lại chất lượng — **nhiều tuần** |
| Rủi ro chất lượng | không | phải chứng minh lại từ đầu |

**Gemini 3.6 Flash rẻ hơn Sonnet 5 đúng 50% theo giá niêm yết.** Nhưng tầng 1
đã cắt 40–55% mà không tốn gì. Làm tầng 1 trước, rồi mới cân nhắc đổi nhà cung
cấp — lúc đó phần còn lại có thể không còn đáng để viết lại nữa.

**Chỗ Google thắng tuyệt đối, và app đã làm đúng:** lấy transcript. Google sở
hữu YouTube nên Gemini nhận thẳng link video — không nhà cung cấp nào khác làm
được. Giữ nguyên `server/gemini.js`.

---

## 4. Đòn bẩy lớn nhất mà không cần viết một dòng code

**Free tier của Google AI Studio.** Nếu lượng dùng ở mức cá nhân (vài video một
ngày), key free của AI Studio cho phép transcribe **miễn phí** — xóa sạch khoản
$0.50–0.90 mỗi video không có phụ đề, tức là khoản đắt nhất trong toàn hệ thống.
`.env.example` đã ghi "bản free 8 giờ video/ngày".

Hai lưu ý bắt buộc:
- Free tier có giới hạn theo phút và theo ngày; vượt thì request lỗi chứ không
  âm thầm tính tiền — cần bắt lỗi quota cho tử tế.
- **Dữ liệu qua free tier được Google dùng để cải thiện sản phẩm.** Không đưa
  video riêng tư/nhạy cảm qua đường này. Video công khai trên YouTube thì không
  vấn đề gì — mà app cũng chỉ nhận video công khai.

---

## 5. Thứ tự nên làm

1. **Tuần này:** 3.1 (log usage) → 3.7 (spend limit) → 3.4 + 3.8 (5 phút mỗi
   cái). Sau bước 1 sẽ có số liệu thật thay cho bảng ước lượng ở trên.
2. **Trước 31/08:** 3.2, 3.3, 3.5, 3.6 — để khi giá Sonnet 5 về mức thường thì
   hóa đơn vẫn thấp hơn hiện tại.
3. **Sau khi có số liệu 2–3 tuần:** quyết định 3.9 (batch) và 3.10 (A/B model)
   dựa trên dữ liệu thật, không dựa trên bảng này.

---

## Nguồn giá

- Claude (Sonnet 5 / Opus 4.8 / Haiku 4.5, prompt caching, Batch API): tài liệu
  Anthropic API, bảng giá tháng 8/2026.
- Web search tool $10/1.000 lượt: [Anthropic API pricing 2026 — Finout](https://www.finout.io/blog/anthropic-api-pricing)
- Gemini 3.6 Flash $1.50/$7.50: [CometAPI](https://www.cometapi.com/gemini-3-6-flash-api-pricing-migration/) · [Memeburn](https://memeburn.com/gemini-3-6-flash-benchmarks-and-pricing-guide-2026/)
- Gemini free tier & Flash-Lite: [Gemini API pricing 2026 — CloudZero](https://www.cloudzero.com/blog/gemini-pricing/) · [Gemini API Free Tier 2026](https://pecollective.com/tools/gemini-free-tier-guide/)

Giá thay đổi thường xuyên — kiểm tra lại trang giá chính thức trước khi ra quyết
định lớn dựa trên tài liệu này.
