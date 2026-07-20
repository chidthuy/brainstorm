import { extractJson } from '../claude.js';

// language: chuỗi mô tả ngôn ngữ output (VD "Tiếng Việt", "English", "cùng ngôn ngữ với transcript").
// question: câu hỏi tập trung của user (có thể rỗng).
export function buildContent({ title, channel, transcriptText, question, language }) {
  const focus = question && question.trim()
    ? `\n\nNGƯỜI DÙNG MUỐN TẬP TRUNG VÀO: "${question.trim()}". Trả lời câu này trong trường "focusAnswer" (ngắn gọn, dẫn mốc thời gian nếu có). Nếu transcript không đủ để trả lời, nói rõ.`
    : '\n\nKhông có câu hỏi tập trung — đặt "focusAnswer" = null.';
  return {
    system:
      'Bạn là trợ lý screening cho một người sắp quyết định có bỏ 1-2 giờ nghe trọn video này không. ' +
      'Người đọc: tò mò tự nhiên, tư duy phản biện, thích khám phá nhiều góc nhìn qua văn hoá, lịch sử, ' +
      'tâm lý, triết học và hành vi con người; đọc để hiểu thực tại, nuôi tự do tư duy và liên tục tinh chỉnh ' +
      'thế giới quan của riêng mình. Viết bản đọc cho đúng người này. ' +
      'Bản đọc của bạn PHẢI hữu ích hơn phần mô tả tác giả tự viết. Chỉ dựa trên transcript, không bịa.\n\n' +
      'Trả về DUY NHẤT một JSON object đúng schema:\n' +
      '{\n' +
      '  "author": string,            // 1-2 câu: kênh/tác giả là ai, có đáng tin không (suy từ transcript + tên kênh)\n' +
      '  "summary": {                 // tóm tắt theo 4 gạch đầu dòng, mỗi trường 1-2 câu cụ thể\n' +
      '    "theme": string,           // chủ đề chính\n' +
      '    "highlights": string,      // điểm/khái niệm nổi bật, kèm số liệu/ví dụ cụ thể\n' +
      '    "conclusion": string,      // kết luận / insight quan trọng của tác giả\n' +
      '    "takeaway": string         // người xem sẽ rút ra được gì\n' +
      '  },\n' +
      '  "outline": [{"timestamp": string, "point": string}],  // dàn ý theo mốc thời gian; timestamp dạng "m:ss" nếu biết, else ""\n' +
      '  "stance": [string],          // lập trường/quan điểm/dự đoán của tác giả (không kiểm chứng đúng-sai được)\n' +
      '  "facts": [string],           // điều tác giả nêu NHƯ SỰ KIỆN có thể kiểm chứng, ghi cụ thể kèm số liệu/nguồn nếu có\n' +
      '  "focusAnswer": string|null\n' +
      '}\n\n' +
      `Viết bằng ${language}. Tách bạch facts (kiểm chứng được) và stance (quan điểm).` + focus,
    messages: [{
      role: 'user',
      content: `Video: "${title}" — kênh ${channel}\n\nTranscript:\n${transcriptText}`
    }],
    maxTokens: 6000
  };
}

export function parseContent(text) {
  const o = extractJson(text);
  const s = o.summary;
  if (typeof o.author !== 'string' || !s || typeof s.theme !== 'string' ||
      typeof s.highlights !== 'string' || typeof s.conclusion !== 'string' ||
      typeof s.takeaway !== 'string' || !Array.isArray(o.outline) ||
      !Array.isArray(o.stance) || !Array.isArray(o.facts) ||
      !('focusAnswer' in o)) {
    throw new Error('Content pass: output sai schema');
  }
  return o;
}
