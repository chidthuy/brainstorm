# Chạy Screening Assistant trên máy của bạn

Chạy local ổn định nhất: YouTube hiếm khi chặn IP nhà bạn (lấy được transcript
lẫn comment), không giới hạn thời gian chạy, không tốn hosting. Làm một lần
~10 phút, sau đó mỗi lần dùng chỉ 1 lệnh.

## Cài một lần

**1. Cài Node.js** (nếu chưa có)
- Tải tại https://nodejs.org — bấm nút **LTS**, cài như phần mềm bình thường.
- Kiểm tra: mở Terminal (Mac) / PowerShell (Windows), gõ `node -v` → hiện số
  phiên bản (20 trở lên) là được.

**2. Tải code về**
```bash
git clone https://github.com/chidthuy/brainstorm.git
cd brainstorm
```
(Không có git? Vào https://github.com/chidthuy/brainstorm → nút **Code** →
**Download ZIP** → giải nén → mở Terminal trong thư mục đó.)

**3. Cài thư viện**
```bash
npm install
```

**4. Tạo file cấu hình**
```bash
cp .env.example .env      # Windows PowerShell: copy .env.example .env
```
Mở file `.env` bằng Notepad/TextEdit, điền:
```
ANTHROPIC_API_KEY=sk-ant-...   ← key Claude của bạn (console.anthropic.com)
APP_PASSWORD=                  ← để trống được (chạy local không cần mật khẩu)
YOUTUBE_API_KEY=               ← tùy chọn, xem DEPLOY.md cách tạo
```

## Mỗi lần dùng

```bash
npm start
```
→ Mở trình duyệt vào **http://localhost:3000** → dán link → Soi.
Tắt bằng `Ctrl+C` trong Terminal.

## Cập nhật phiên bản mới

```bash
git pull
npm install
```
