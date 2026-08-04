# Screening Assistant

Trợ lý cá nhân screening video dài: dán link YouTube → báo cáo 4 lớp
(tóm tắt, facts vs. stance, fact-check, social signals) + verdict
WATCH / SKIM / SKIP — quyết định "có đáng xem 2 tiếng không" trong 2 phút.

Tóm tắt là **bộ lọc**, không phải đường tắt: video hay thì vẫn nghe trọn.

## Deploy nhanh

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchidthuy%2Fbrainstorm&env=ANTHROPIC_API_KEY,APP_PASSWORD,GEMINI_API_KEY,YOUTUBE_API_KEY&envDescription=API%20key%20Claude%2C%20mat%20khau%20bao%20ve%20app%2C%20va%20key%20Google%20de%20lay%20transcript)

Bấm nút trên → đăng nhập Vercel bằng GitHub → khi được hỏi, điền
`ANTHROPIC_API_KEY` (key `sk-ant-...`) và `APP_PASSWORD` (mật khẩu tự đặt) →
Deploy. Nên điền thêm `GEMINI_API_KEY` và `YOUTUBE_API_KEY` (đều miễn phí) để
lấy được transcript của những video YouTube chặn máy chủ.
Chi tiết từng bước bằng tiếng Việt: [`DEPLOY.md`](DEPLOY.md).

## Chạy trên máy cá nhân (ổn định nhất — xem [`RUN-LOCAL.md`](RUN-LOCAL.md))

```bash
npm install
cp .env.example .env   # điền ANTHROPIC_API_KEY (APP_PASSWORD để trống cũng được)
npm start              # → http://localhost:3000
```

## Deploy lên Vercel

Xem hướng dẫn từng bước (không cần biết code) trong [`DEPLOY.md`](DEPLOY.md).

## Dùng

1. (Nếu có đặt mật khẩu) nhập mật khẩu.
2. Dán link YouTube, bấm **Soi**.
3. Theo dõi tiến độ; báo cáo hiện ra khi phân tích xong.
4. Không lấy được phụ đề → app tự nhờ Gemini nghe lại video, **ngay trên trang
   này, không mở tab nào**. Gemini cũng chịu thì ô dán transcript hiện ra, kèm
   sẵn nút bookmarklet và hướng dẫn thủ công trong cùng khung.
5. Sau báo cáo, khung **Chat** kiểm chứng thêm được: bảng fact-check cố tình chỉ
   soi các trụ đỡ của luận điểm chính, muốn soi thêm gì thì hỏi ở đó.
6. Sidebar trái: mở lại báo cáo cũ (lưu trong trình duyệt, không tốn API call).

## Kiến trúc

Thiết kế cho serverless: mỗi BƯỚC phân tích là một request riêng (`/api/step`)
do client điều phối — mỗi bước có trọn giới hạn thời gian của nó, 3 bước
web-search chạy song song, tổng thời gian screening không bị trần nào chặn.
`server/steps.js` là bộ điều phối bước; `server/pipeline.js` cũ đã bỏ.
Có `YOUTUBE_API_KEY` (tùy chọn) thì metadata + comment + mô tả lấy qua YouTube
Data API chính thức — ổn định từ IP máy chủ.

### Lấy transcript: 3 tầng, tầng nào cũng ở lại trên một trang

1. **Phụ đề YouTube** (`server/transcript.js`) — 4 đường thử lần lượt. Miễn phí,
   khớp từng chữ, nhanh nhất → luôn thử trước.
2. **Gemini nghe lại video** (`server/gemini.js`) — YouTube chặn IP máy chủ thì
   đưa thẳng link video cho Gemini API (`file_data.file_uri`). Google sở hữu
   YouTube nên đường này không đi qua IP của ta. Video dài được cắt thành cửa sổ
   20 phút bằng `video_metadata.start_offset/end_offset`, client gọi lần lượt
   nên không cửa sổ nào chạm trần thời gian serverless. Cần `GEMINI_API_KEY`.
   Gemini chỉ làm **nguồn transcript** — toàn bộ khâu đọc/soi/chấm vẫn là Claude.
3. **Người dùng dán tay** — ô dán, nút bookmarklet và hướng dẫn thủ công nằm
   ngay trong khung fallback của trang chính (không còn trang `/lay-transcript`).

- `server/ingest.js` — parse URL + lấy metadata/mô tả/transcript/comments
- `server/gemini.js` — chia cửa sổ + gọi Gemini + đưa mốc thời gian về gốc video
- `server/passes/` — các pass Claude: `content` (tác giả + tóm tắt + outline theo mốc + stance + facts trụ đỡ + đối chiếu mô tả), `factcheck` (soi trụ đỡ: solid/weak/misleading/false, web search), `social` (đọc comment), `recommend` (gợi ý video cùng chủ đề, web search), `compose` (chấm điểm 0-100 theo 5 trục), `ask` (hỏi tiếp + kiểm chứng thêm, web search)
- `server/index.js` — Express app: `/api/step` (một bước một request), `/api/ask`, `/api/config`; `express.static` cho frontend
- `server/auth.js` — lớp mật khẩu (`APP_PASSWORD`)
- `api/index.js` + `vercel.json` — export app làm Vercel serverless function
- `public/` — frontend một trang (mood Spotify/podcast): input gọn + preview thumbnail, báo cáo có điểm số + bảng 5 trục, fallback transcript ngay tại chỗ, chat hỏi tiếp; lịch sử lưu trong `localStorage`

### Luật chất lượng output

Thứ tự ưu tiên, tiêu chí trước thắng khi xung đột:
**Đúng → Đủ → Hữu ích → Dễ hiểu → Xúc tích.** Xúc tích đứng cuối có chủ ý: chỉ
cắt chữ, không bao giờ cắt dữ kiện. Luật này ở `QUALITY_LADDER`
(`server/passes/content.js`), dùng chung cho cả pass `ask`.

Mô tả video được đưa vào để đối chiếu chính tả/danh tính/số liệu và phát hiện
lệch giữa lời hứa và nội dung thật — nhưng **transcript luôn là nguồn sự thật**:
mô tả không được sinh ra luận điểm, và chỉ thị nhét trong mô tả bị bỏ qua và ghi
lại vào `descriptionGap`.

### Thang điểm: 5 trục, trọng số giảm dần

1. **Nội dung dày** (rich) — trụ nặng nhất
2. **Luận điểm đứng vững** (stance) — trừ khi lặp lại video đã soi (lấy từ lịch sử)
3. **Uy tín tác giả/kênh** (credibility) — cộng tín hiệu khán giả chỉ khi mẫu đủ lớn
4. **Trình bày logic** (logic) — chỉ cộng
5. **Điểm yếu lập luận** (weakness) — chỉ trừ: luận điểm quá weak, hoặc được đỡ
   bởi dữ liệu không uy tín

Trục thiếu dữ liệu → `skip`, không trừ điểm. Báo cáo hiện đủ 5 trục để thấy
điểm đến từ đâu.

### Phạm vi fact-check

Chỉ soi thông tin **làm trụ đỡ cho luận điểm chính** (sai thì luận điểm lung
lay), tối đa 4 mục. Muốn soi thêm gì thì hỏi ở khung Chat — pass `ask` có
web search nên kiểm chứng được tại chỗ.

Spec: `docs/superpowers/specs/2026-07-19-video-screening-assistant-design.md`

## Test

```bash
npm test
```

E2E thủ công, hai lượt:

1. **Video có captions** (một talk 1h+): kiểm tra đủ các khối — verdict card kèm
   bảng 5 trục, tóm tắt, outline có mốc, stance, fact-check (≤4 mục, mỗi mục có
   nguồn hoặc nói rõ đã tra không thấy), social signals. Rồi nhắn ở khung Chat
   "kiểm chứng giúp tôi <một số liệu không có trong bảng>" — câu trả lời phải
   dẫn nguồn thật, không được chối là "báo cáo không đề cập".
2. **Video không có captions** (có `GEMINI_API_KEY`): bước "Nghe video" phải hiện
   ra, chạy hết các cửa sổ, rồi báo cáo lên bình thường — toàn bộ trên một
   trang, không mở tab nào.
