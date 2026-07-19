# Screening Assistant

Trợ lý cá nhân screening video dài: dán link YouTube → báo cáo 4 lớp
(tóm tắt, facts vs. stance, fact-check, social signals) + verdict
WATCH / SKIM / SKIP — quyết định "có đáng xem 2 tiếng không" trong 2 phút.

Tóm tắt là **bộ lọc**, không phải đường tắt: video hay thì vẫn nghe trọn.

## Cài đặt

```bash
npm install
cp .env.example .env   # điền ANTHROPIC_API_KEY
npm start              # → http://localhost:3000
```

## Dùng

1. Dán link YouTube, bấm **Screen**.
2. Theo dõi tiến độ 5 bước; báo cáo hiện dần từng phần.
3. Video không có captions → dán transcript vào ô hiện ra rồi bấm Screen lại.
4. Sidebar trái: mở lại báo cáo cũ (không tốn API call).

## Kiến trúc

- `server/ingest.js` — parse URL + lấy metadata/transcript/comments (youtubei.js, không cần YouTube API key)
- `server/passes/` — 4 pass Claude: content, factcheck (web search), social (web search), compose verdict
- `server/pipeline.js` — orchestrator: content → (factcheck ∥ social) → compose; pass lỗi không giết pipeline
- `server/index.js` + `server/jobs.js` — Express + SSE tiến độ
- `server/store.js` — báo cáo JSON trong `data/`
- `public/` — frontend một trang, không build step

Spec: `docs/superpowers/specs/2026-07-19-video-screening-assistant-design.md`

## Test

```bash
npm test
```

E2E thủ công: chạy app, screen một video dài có captions (ví dụ một talk
1h+), kiểm tra đủ 5 khối: verdict card, tóm tắt, facts/stance, fact-check
có nguồn, social signals.
