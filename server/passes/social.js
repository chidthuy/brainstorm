import { extractJson } from '../claude.js';

// Chỉ đọc comment — KHÔNG dùng web search (đó là thứ làm bước này chậm và hay
// lỗi, mà kết quả "độ lan toả" hầu như không giúp gì cho quyết định xem hay không).
// Trả về MỘT đoạn readout gọn, không chia block Sentiment/Comment.
export const NO_SIGNAL = 'Không có ghi nhận nào đáng kể.';

export function buildSocial({ comments, language }) {
  const block = comments.length
    ? comments.map(c => `[${c.likes} likes] ${c.text}`).join('\n')
    : '(KHÔNG lấy được comment do giới hạn kỹ thuật — không suy ra là video không ai quan tâm)';
  return {
    system:
      'Bạn đọc comment của một video và viết MỘT readout ngắn về tín hiệu từ khán giả — ' +
      'gộp chung, KHÔNG chia thành mục "sentiment" và "comment" riêng.\n' +
      'CHỈ ghi lại những gì thực sự đáng giá cho người đang cân nhắc có nên xem video không:\n' +
      '- phản biện có lý lẽ, bổ sung/sửa thông tin cho tác giả, trải nghiệm thực tế cụ thể;\n' +
      '- hoặc một xu hướng thái độ RÕ RỆT và có ý nghĩa (VD "nhiều người trong ngành phản đối luận điểm X").\n' +
      'BỎ QUA lời cảm thán, khen suông, cảm ơn, xin xỏ — chúng không mang thông tin.\n' +
      `QUAN TRỌNG: nếu comment quá ít hoặc chỉ toàn lời vô thưởng vô phạt, để "readout" ĐÚNG bằng chuỗi "${NO_SIGNAL}" ` +
      '— đừng cố nặn ra nhận xét. Khi có nội dung đáng kể thì viết 1-3 câu gọn, trích ý chính ' +
      '(có thể trích nguyên văn ngắn trong ngoặc kép).\n\n' +
      'Trả về DUY NHẤT một JSON object: {"readout": string, "dataGaps": [string]}. ' +
      `Viết bằng ${language}.`,
    messages: [{ role: 'user', content: `Comments:\n${block}` }],
    maxTokens: 2000
  };
}

export function parseSocial(text) {
  const o = extractJson(text);
  if (typeof o.readout !== 'string') {
    throw new Error('Social pass: output sai schema');
  }
  const readout = o.readout.trim() || NO_SIGNAL;
  return { readout, dataGaps: Array.isArray(o.dataGaps) ? o.dataGaps : [] };
}
