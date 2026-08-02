import { extractJson } from '../claude.js';

// Chỉ đọc comment — KHÔNG dùng web search (đó là thứ làm bước này chậm và hay
// lỗi, mà kết quả "độ lan toả" hầu như không giúp gì cho quyết định xem hay không).
const SENTIMENTS = ['Tích cực', 'Tiêu cực', 'Trái chiều', 'Không rõ'];

export function buildSocial({ comments, language }) {
  const block = comments.length
    ? comments.map(c => `[${c.likes} likes] ${c.text}`).join('\n')
    : '(KHÔNG lấy được comment do giới hạn kỹ thuật — không suy ra là video không ai quan tâm)';
  return {
    system:
      'Bạn đọc comment của một video và rút ra 2 thứ, đúng 2 thứ:\n' +
      '1. "sentiment": thái độ chung của người xem — chọn ĐÚNG một trong: ' +
      '"Tích cực" | "Tiêu cực" | "Trái chiều" | "Không rõ", kèm 1 câu ngắn nêu căn cứ.\n' +
      '2. "notable": các phản hồi ĐÁNG KỂ — phản biện có lý lẽ, bổ sung thông tin, sửa lỗi tác giả, ' +
      'hoặc trải nghiệm thực tế cụ thể. BỎ QUA lời cảm thán ("hay quá", "cảm ơn anh"), lời khen suông, ' +
      'lời xin xỏ. Nếu không có phản hồi nào đáng kể thì để mảng rỗng — đừng cố bịa ra.\n\n' +
      'Trả về DUY NHẤT một JSON object: ' +
      '{"sentiment": {"label": string, "why": string}, "notable": [string], "dataGaps": [string]}. ' +
      `Mỗi mục notable một câu, trích ý chính (có thể trích nguyên văn ngắn trong ngoặc kép). Viết bằng ${language}.`,
    messages: [{ role: 'user', content: `Comments:\n${block}` }],
    maxTokens: 3000
  };
}

export function parseSocial(text) {
  const o = extractJson(text);
  const s = o.sentiment;
  if (!s || typeof s.label !== 'string' || typeof s.why !== 'string' ||
      !Array.isArray(o.notable)) {
    throw new Error('Social pass: output sai schema');
  }
  if (!SENTIMENTS.includes(s.label)) s.label = 'Không rõ';
  return { sentiment: s, notable: o.notable, dataGaps: Array.isArray(o.dataGaps) ? o.dataGaps : [] };
}
