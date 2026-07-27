# Deploy lên Vercel — hướng dẫn từng bước

App đã được chuẩn bị sẵn để chạy trên Vercel. Bạn chỉ cần bấm vài nút trên
web, **không cần biết code**. Mất khoảng 10 phút.

## Bạn cần chuẩn bị 2 thứ

1. **Tài khoản Vercel** — miễn phí, đăng ký bằng chính tài khoản GitHub tại
   https://vercel.com/signup (chọn "Continue with GitHub").
2. **API key của Claude** — lấy tại https://console.anthropic.com → mục
   *API Keys* → *Create Key*. Copy chuỗi bắt đầu bằng `sk-ant-...` (chỉ hiện
   một lần, lưu lại tạm).

## Cách nhanh nhất: nút một chạm

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchidthuy%2Fbrainstorm&env=ANTHROPIC_API_KEY,APP_PASSWORD&envDescription=API%20key%20Claude%20va%20mat%20khau%20bao%20ve%20app)

Bấm nút này → đăng nhập Vercel bằng GitHub → Vercel tự hỏi 2 giá trị
`ANTHROPIC_API_KEY` và `APP_PASSWORD` → điền vào → Deploy. Xong.

Nếu muốn làm thủ công thay vì bấm nút, theo các bước dưới đây.

## Các bước (thủ công)

### 1. Import dự án
- Vào https://vercel.com/new
- Chọn repo **`chidthuy/brainstorm`** trong danh sách → bấm **Import**.
  (Nếu chưa thấy, bấm "Adjust GitHub App Permissions" để cho Vercel xem repo này.)

### 2. Đặt biến môi trường (Environment Variables)
Trước khi bấm Deploy, mở mục **Environment Variables** và thêm:

| Name (tên) | Value (giá trị) | Bắt buộc? |
|---|---|---|
| `ANTHROPIC_API_KEY` | dán key `sk-ant-...` của bạn | ✅ |
| `APP_PASSWORD` | tự đặt một mật khẩu, ví dụ `caiphe2026` | ✅ |
| `YOUTUBE_API_KEY` | key YouTube Data API (cách tạo bên dưới) | Nên có |

> `APP_PASSWORD` chính là mật khẩu để mở app sau này. Ai không biết nó thì
> không dùng được, nên không đốt được tiền API của bạn.

#### Tạo `YOUTUBE_API_KEY` (miễn phí, ~3 phút — giúp lấy comment/metadata ổn định)
1. Vào https://console.cloud.google.com → đăng nhập Google → chấp nhận điều khoản.
2. Thanh trên cùng → **Select a project → New Project** → đặt tên bất kỳ → Create.
3. Vào **APIs & Services → Library** → tìm **"YouTube Data API v3"** → **Enable**.
4. Vào **APIs & Services → Credentials** → **Create Credentials → API key** → copy key.
5. Dán vào Vercel làm biến `YOUTUBE_API_KEY`.

(Không có key này app vẫn chạy, nhưng phần comment/social hay bị YouTube chặn
trên máy chủ Vercel.)

### 3. Deploy
- Bấm **Deploy**, chờ ~1 phút.
- Xong, Vercel cho bạn một đường link dạng `https://brainstorm-xxx.vercel.app`.

### 4. Dùng thử
- Mở link đó → nhập **mật khẩu** bạn vừa đặt → dán link một video YouTube →
  bấm **Screen**.

## Vài điều cần biết

- **Tiền:** mỗi lần screen tốn một ít tiền trong tài khoản Claude API của bạn
  (đọc transcript + tra web). Video càng dài, càng nhiều claim thì càng tốn.
- **Thời gian:** mỗi bước phân tích chạy thành một request riêng nên tổng thời
  gian không bị giới hạn — video vài tiếng vẫn soi được, chỉ là chờ lâu hơn
  (có thanh % tiến độ).
- **YouTube đôi khi chặn transcript:** máy chủ Vercel dùng IP trung tâm, có lúc
  YouTube không cho lấy phụ đề. Khi đó dán transcript thủ công vào ô hiện ra —
  hoặc chạy local trên máy bạn ([`RUN-LOCAL.md`](RUN-LOCAL.md)) là ổn định nhất.
- **Đổi mật khẩu:** vào dự án trên Vercel → Settings → Environment Variables →
  sửa `APP_PASSWORD` → Redeploy.

## Chạy trên máy cá nhân (không cần Vercel)

```bash
npm install
cp .env.example .env      # điền ANTHROPIC_API_KEY (APP_PASSWORD để trống cũng được)
npm start                 # → http://localhost:3000
```
