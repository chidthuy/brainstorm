// Lớp bảo vệ đơn giản: nếu APP_PASSWORD được đặt thì mọi request screen phải
// kèm đúng mật khẩu. Không đặt password → mở tự do (chỉ nên dùng khi chạy local).

export function isAuthorized(expected, provided) {
  if (!expected) return true;
  return typeof provided === 'string' && provided === expected;
}
