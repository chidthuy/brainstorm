# Screening Assistant

Trợ lý cá nhân screening video dài: dán link YouTube → báo cáo 4 lớp
(tóm tắt, facts vs. stance, fact-check, social signals) + verdict
WATCH / SKIM / SKIP — quyết định "có đáng xem 2 tiếng không" trong 2 phút.

Tóm tắt là **bộ lọc**, không phải đường tắt: video hay thì vẫn nghe trọn.

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
- `server/passes/` — 4 pass Claude: content, factcheck (web search), social (web search), compose verdict
- `server/pipeline.js` — orchestrator: content → (factcheck ∥ social) → compose; pass lỗi không giết pipeline
- `server/index.js` — Express app: endpoint `/api/screen` chạy pipeline và stream SSE trong một request; `express.static` cho frontend
- `server/auth.js` — lớp mật khẩu (`APP_PASSWORD`)
- `api/index.js` + `vercel.json` — export app làm Vercel serverless function
- `public/` — frontend một trang; lịch sử lưu trong `localStorage` của trình duyệt

Spec: `docs/superpowers/specs/2026-07-19-video-screening-assistant-design.md`

## Test

```bash
npm test
```

E2E thủ công: chạy app, screen một video dài có captions (ví dụ một talk
1h+), kiểm tra đủ 5 khối: verdict card, tóm tắt, facts/stance, fact-check
có nguồn, social signals.
