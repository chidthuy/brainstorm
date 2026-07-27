import { extractJson } from '../claude.js';

// language: chuỗi mô tả ngôn ngữ output (VD "Tiếng Việt", "English", "cùng ngôn ngữ với transcript").
// question: câu hỏi tập trung của user (có thể rỗng).
export function buildContent({ title, channel, transcriptText, question, language }) {
  const focus = question && question.trim()
    ? `\n\nNGƯỜI DÙNG MUỐN TẬP TRUNG VÀO: "${question.trim()}". Trả lời trong "focusAnswer" (ngắn gọn, dẫn mốc thời gian). ` +
      'Chỉ trả lời dựa trên transcript. Nếu câu hỏi đòi kiểm chứng với nguồn bên ngoài (VD "số liệu có đáng tin?"), ' +
      'KHÔNG kết luận kiểu "không có nguồn trong transcript" — việc đối chiếu nguồn ngoài là của bước fact-check; ' +
      'ở đây chỉ nêu gọn các con số/claim chính liên quan câu hỏi.'
    : '\n\nKhông có câu hỏi tập trung — đặt "focusAnswer" = null.';
  return {
    system:
      'Bạn là trợ lý screening cho một người sắp quyết định có bỏ 1-2 giờ nghe trọn video này không. ' +
      'Người đọc: tò mò tự nhiên, tư duy phản biện, thích khám phá nhiều góc nhìn qua văn hoá, lịch sử, ' +
      'tâm lý, triết học và hành vi con người; đọc để hiểu thực tại, nuôi tự do tư duy và liên tục tinh chỉnh ' +
      'thế giới quan của riêng mình. Viết bản đọc cho đúng người này. ' +
      'Bản đọc của bạn PHẢI hữu ích hơn phần mô tả tác giả tự viết. Chỉ dựa trên transcript, không bịa.\n\n' +
      'PHONG CÁCH VIẾT (bắt buộc):\n' +
      '- Câu ngắn, rõ, dễ nắm. Mỗi bullet 1-2 câu hoàn chỉnh; tránh chuỗi dấu phẩy dài lê thê.\n' +
      '- Mọi thuật ngữ/viết tắt (ARR, orchestration, ...) phải kèm giải thích ngắn trong ngoặc ngay lần đầu dùng.\n' +
      '- KHÔNG thêm disclaimer kiểu "đây là quan điểm cá nhân, cần kiểm chứng độc lập" — người đọc tự biết. Xúc tích, không thừa chữ.\n\n' +
      'Trả về DUY NHẤT một JSON object đúng schema:\n' +
      '{\n' +
      '  "author": string,            // 1-2 câu: kênh/tác giả là ai, chuyên môn gì. Không disclaimer.\n' +
      '  "summary": {                 // tóm tắt theo 4 gạch đầu dòng, mỗi trường 1-2 câu cụ thể, dễ hiểu\n' +
      '    "theme": string,           // chủ đề chính\n' +
      '    "highlights": string,      // điểm/khái niệm nổi bật, kèm số liệu/ví dụ cụ thể\n' +
      '    "conclusion": string,      // kết luận / insight quan trọng của tác giả\n' +
      '    "takeaway": string         // người xem sẽ rút ra được gì\n' +
      '  },\n' +
      '  "outline": [{"timestamp": string, "point": string}],  // dàn ý theo mốc thời gian\n' +
      '  "stance": [string],          // quan điểm/dự đoán của tác giả. Viết THẲNG nội dung, KHÔNG mở đầu bằng "Tác giả cho rằng/tin rằng/dự đoán" — mục này đã là stance của tác giả\n' +
      '  "facts": [string],           // điều tác giả nêu NHƯ SỰ KIỆN có thể kiểm chứng, ghi cụ thể kèm số liệu\n' +
      '  "focusAnswer": string|null\n' +
      '}\n\n' +
      'QUY TẮC OUTLINE: transcript có sẵn mốc [m:ss] ở đầu mỗi dòng — "timestamp" BẮT BUỘC lấy từ các mốc đó ' +
      '(mốc của đoạn bắt đầu ý). Chỉ để "" khi transcript thực sự không có mốc nào.\n\n' +
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
