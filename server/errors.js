// Lỗi từ Anthropic API trả về dạng JSON thô, rất khó hiểu với người dùng.
// Dịch các lỗi hay gặp sang câu tiếng Việt nói rõ phải làm gì.

const RULES = [
  [/credit balance is too low/i,
    'Hết credit Anthropic. Vào console.anthropic.com → Billing → Buy credits để nạp thêm, rồi soi lại.'],
  [/invalid x-api-key|authentication_error|invalid api key/i,
    'API key Anthropic không hợp lệ. Kiểm tra biến ANTHROPIC_API_KEY trên Vercel (Settings → Environment Variables) rồi Redeploy.'],
  [/rate_limit|429/i,
    'Bị giới hạn tốc độ gọi API. Chờ khoảng một phút rồi soi lại.'],
  [/overloaded/i,
    'Máy chủ Claude đang quá tải. Thử lại sau ít phút.'],
  [/quotaExceeded|YouTube Data API lỗi 403/i,
    'Hết quota YouTube Data API hôm nay (10.000 lượt/ngày). Chờ sang ngày mới hoặc bỏ trống YOUTUBE_API_KEY.'],
  [/Video không tồn tại|bị ẩn/i,
    'Video không tồn tại, ở chế độ riêng tư, hoặc bị chặn ở khu vực này.'],
  [/Không nhận diện được link/i,
    'Link không đúng định dạng YouTube. Ví dụ hợp lệ: https://www.youtube.com/watch?v=XXXXXXXXXXX'],
  [/timed? ?out|ETIMEDOUT|AbortError/i,
    'Quá thời gian chờ. Video có thể quá dài — thử lại, hoặc chọn model Haiku trong Tùy chọn cho nhanh hơn.']
];

export function friendlyError(raw) {
  const msg = String(raw ?? '').trim();
  for (const [re, friendly] of RULES) {
    if (re.test(msg)) return friendly;
  }
  return msg || 'Lỗi không rõ.';
}
