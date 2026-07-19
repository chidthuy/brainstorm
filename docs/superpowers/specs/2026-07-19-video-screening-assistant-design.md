# Screening Assistant — Design Spec

*Trợ lý screening video dài. Nguồn: CVP brief (khung FWWBU), 2026-07-19.*

> **Addendum (deploy Vercel):** Bản đầu thiết kế local-first (background job +
> SSE endpoint riêng + lưu file JSON trong `data/`). Để deploy lên Vercel
> (serverless), kiến trúc đổi sang: screening chạy trọn trong **một request**
> và stream SSE trực tiếp; lịch sử chuyển sang **localStorage** của trình duyệt;
> thêm lớp **mật khẩu** (`APP_PASSWORD`). Xem `DEPLOY.md`. Bốn pass phân tích
> và pipeline giữ nguyên.

## Mục tiêu

Biến quyết định "có nên xem video 2 tiếng này không" từ một canh bạc theo
thumbnail thành một quyết định có thông tin trong ~2 phút. Trợ lý chỉ
**screen**, không thay thế việc xem: tóm tắt là bộ lọc, không phải đường tắt.

Người dùng: một cá nhân (audience of one), chạy trên máy của chính mình.

## Hình thái & phạm vi

- **Web app local-first**: `npm start` → `http://localhost:3000`. Không auth,
  không hosting, không database server.
- Input: link YouTube (hoặc dán transcript thủ công khi video không có captions).
- Output: báo cáo screening 4 lớp + verdict, lưu lịch sử local.

Ngoài phạm vi (YAGNI): multi-user, deploy cloud, nền tảng ngoài YouTube,
playlist/batch, mobile app, đăng nhập YouTube (chỉ dùng dữ liệu public).

## Kiến trúc

```
browser (1 trang tĩnh)
   │  POST /api/screen  { url | transcript }
   │  GET  /api/screen/:id/events   (SSE: tiến độ + kết quả từng pass)
   ▼
Express server (Node 20+)
   ├── ingest    — youtubei.js: metadata, captions, top comments (không cần API key)
   ├── pipeline  — 3 pass gọi Claude API (@anthropic-ai/sdk, claude-sonnet-5)
   │     Pass A  content:  tóm tắt + cấu trúc lập luận + tách facts/stance
   │     Pass B  factcheck: rút claims chính từ Pass A → verify bằng web_search tool
   │     Pass C  social:   chất lượng comment, chân dung audience, buzz (web_search)
   └── store     — data/<id>.json (báo cáo + input đã dùng), data/index.json (lịch sử)
```

- `ANTHROPIC_API_KEY` đọc từ `.env` (dotenv). Không hardcode.
- Ba pass chạy tuần tự A → (B ∥ C): B cần output A; C chỉ cần comments/metadata
  nên chạy song song với B.
- Mỗi pass độc lập về lỗi: một pass fail → báo cáo vẫn render các phần còn lại,
  phần fail hiển thị lý do.

## Cấu trúc báo cáo (hợp đồng output)

JSON có schema cố định, render thành 5 khối UI:

1. **Verdict card** — `WATCH | SKIM | SKIP`, confidence (low/med/high),
   2–3 dòng lý do. Sinh bởi một call Claude ngắn cuối pipeline (compose) nhận
   output 3 pass; nếu call này fail → fallback deterministic `SKIM / low`
   kèm ghi chú "verdict không khả dụng".
2. **Tóm tắt nội dung** — video nói gì, cấu trúc lập luận, các phần chính
   kèm timestamp nếu captions có timing.
3. **Facts vs. Stance** — hai cột: điều tác giả trình bày như sự kiện vs.
   quan điểm/lập trường của tác giả.
4. **Fact-check** — mỗi claim chính: verdict (supported / contradicted /
   unverifiable) + nguồn dẫn.
5. **Social signals** — chất lượng comment (sâu vs. cảm thán, tỷ lệ),
   chân dung người comment (practitioner vs. đại trà), buzz (được nhắc ở đâu,
   bối cảnh nào).

## UX flow

1. Dán link → bấm Screen.
2. Thanh tiến độ theo bước (ingest → content → fact-check + social → done),
   cập nhật qua SSE; từng khối báo cáo hiện dần khi pass xong.
3. Không có captions → hiện ô dán transcript, giữ nguyên metadata/comments đã lấy.
4. Sidebar lịch sử: các video đã screen, mở lại báo cáo cũ không tốn API call.

## Error handling

- Link không hợp lệ / video private / bị chặn → lỗi rõ ràng ngay bước ingest.
- Không captions → degrade sang dán transcript (không phải lỗi chết).
- Claude API lỗi / hết quota → hiện lỗi từng pass, các pass khác vẫn chạy.
- Comments tắt → Pass C chạy chế độ thiếu dữ liệu (chỉ buzz qua web search),
  ghi rõ trong báo cáo.

## Testing

- **Unit (Vitest)**: parse URL YouTube (các dạng link), schema validate output
  từng pass, compose verdict từ kết quả pass, store đọc/ghi lịch sử.
- **LLM passes**: prompt tách riêng thành module thuần (input → messages),
  test bằng fixture không gọi mạng.
- **E2E thủ công**: recipe trong README — chạy app, screen một video thật,
  kiểm tra đủ 5 khối.

## Tech stack

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Runtime | Node.js 20+, ESM | một ngôn ngữ cho cả server/client |
| Server | Express | tối giản, đủ dùng |
| YouTube data | youtubei.js | metadata + captions + comments, không cần API key |
| LLM | @anthropic-ai/sdk, `claude-sonnet-5` | web_search server tool cho fact-check |
| Frontend | HTML/CSS/JS thuần, không build step | một trang, ít moving parts |
| Storage | file JSON trong `data/` | audience of one, không cần DB |
| Test | Vitest | nhẹ, ESM native |
