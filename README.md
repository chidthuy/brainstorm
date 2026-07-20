# Screening Assistant

Trợ lý cá nhân screening video dài: dán link YouTube → báo cáo 4 lớp
(tóm tắt, facts vs. stance, fact-check, social signals) + verdict
WATCH / SKIM / SKIP — quyết định "có đáng xem 2 tiếng không" trong 2 phút.

Tóm tắt là **bộ lọc**, không phải đường tắt: video hay thì vẫn nghe trọn.

## Deploy nhanh

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchidthuy%2Fbrainstorm&env=ANTHROPIC_API_KEY,APP_PASSWORD&envDescription=API%20key%20Claude%20va%20mat%20khau%20bao%20ve%20app)

Bấm nút trên → đăng nhập Vercel bằng GitHub → khi được hỏi, điền
`ANTHROPIC_API_KEY` (key `sk-ant-...`) và `APP_PASSWORD` (mật khẩu tự đặt) →
Deploy. Chi tiết từng bước bằng tiếng Việt: [`DEPLOY.md`](DEPLOY.md).

## Chạy trên máy cá nhân

```bash
npm install
cp .env.example .env   # điền ANTHROPIC_API_KEY (APP_PASSWORD để trống cũng được)
npm start              # → http://localhost:3000
```

## Deploy lên Vercel

Xem hướng dẫn từng bước (không cần biết code) trong [`DEPLOY.md`](DEPLOY.md).

## Dùng

1. (Nếu có đặt mật khẩu) nhập mật khẩu.
2. Dán link YouTube, bấm **Screen**.
3. Theo dõi tiến độ 5 bước; báo cáo hiện ra khi phân tích xong.
4. Video không có phụ đề → dán transcript vào ô hiện ra rồi bấm Screen lại.
5. Sidebar trái: mở lại báo cáo cũ (lưu trong trình duyệt, không tốn API call).

## Kiến trúc

Thiết kế cho serverless: mỗi lần screen chạy trọn trong một request và stream
tiến độ trực tiếp về client — không có background job, không ghi file.

- `server/ingest.js` — parse URL + lấy metadata/transcript/comments (youtubei.js, không cần YouTube API key)
- `server/passes/` — các pass Claude: `content` (tác giả + tóm tắt bullet + outline theo mốc + stance + facts + trả lời câu hỏi tập trung), `factcheck` (soi từng fact: solid/weak/misleading/false, web search), `social` (web search), `recommend` (gợi ý video cùng chủ đề, web search), `compose` (chấm điểm 0-100), `ask` (hỏi tiếp sau báo cáo)
- `server/pipeline.js` — orchestrator: content → (factcheck ∥ social ∥ recommend) → compose; pass lỗi không giết pipeline; ngôn ngữ + model chọn được per request
- `server/index.js` — Express app: `/api/screen` (stream SSE), `/api/ask` (hỏi tiếp), `/api/config`; `express.static` cho frontend
- `server/auth.js` — lớp mật khẩu (`APP_PASSWORD`)
- `api/index.js` + `vercel.json` — export app làm Vercel serverless function
- `public/` — frontend một trang (mood Spotify/podcast): input gọn + preview thumbnail, báo cáo có điểm số, fallback dán transcript, chat hỏi tiếp; lịch sử lưu trong `localStorage`

Spec: `docs/superpowers/specs/2026-07-19-video-screening-assistant-design.md`

## Test

```bash
npm test
```

E2E thủ công: chạy app, screen một video dài có captions (ví dụ một talk
1h+), kiểm tra đủ 5 khối: verdict card, tóm tắt, facts/stance, fact-check
có nguồn, social signals.
