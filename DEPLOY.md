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

### 2. Đặt 2 biến môi trường (Environment Variables)
Trước khi bấm Deploy, mở mục **Environment Variables** và thêm 2 dòng:

| Name (tên) | Value (giá trị) |
|---|---|
| `ANTHROPIC_API_KEY` | dán key `sk-ant-...` của bạn |
| `APP_PASSWORD` | tự đặt một mật khẩu, ví dụ `caiphe2026` |

> `APP_PASSWORD` chính là mật khẩu để mở app sau này. Ai không biết nó thì
> không dùng được, nên không đốt được tiền API của bạn.

### 3. Deploy
- Bấm **Deploy**, chờ ~1 phút.
- Xong, Vercel cho bạn một đường link dạng `https://brainstorm-xxx.vercel.app`.

### 4. Dùng thử
- Mở link đó → nhập **mật khẩu** bạn vừa đặt → dán link một video YouTube →
  bấm **Screen**.

## Vài điều cần biết

- **Tiền:** mỗi lần screen tốn một ít tiền trong tài khoản Claude API của bạn
  (đọc transcript + tra web). Video càng dài, càng nhiều claim thì càng tốn.
- **Giới hạn thời gian:** gói Vercel miễn phí cắt mỗi lần chạy ở **60 giây**.
  Video rất dài có thể chưa phân tích xong đã bị cắt. Nếu hay gặp, nâng lên
  gói **Vercel Pro** rồi sửa số `60` thành `300` trong file `vercel.json`.
- **YouTube đôi khi chặn:** máy chủ Vercel dùng IP trung tâm, thỉnh thoảng
  YouTube không cho lấy dữ liệu. Khi đó bạn dán transcript thủ công vào ô hiện ra.
- **Đổi mật khẩu:** vào dự án trên Vercel → Settings → Environment Variables →
  sửa `APP_PASSWORD` → Redeploy.

## Chạy trên máy cá nhân (không cần Vercel)

```bash
npm install
cp .env.example .env      # điền ANTHROPIC_API_KEY (APP_PASSWORD để trống cũng được)
npm start                 # → http://localhost:3000
```
