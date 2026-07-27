import { extractJson } from '../claude.js';

export function buildSocial({ title, channel, viewCount, comments, language }) {
  const commentBlock = comments.length
    ? comments.map(c => `[${c.likes} likes] ${c.text}`).join('\n')
    : '(KHÔNG lấy được comment do giới hạn kỹ thuật phía server — video vẫn có thể có nhiều comment)';
  const viewText = viewCount ? `${viewCount} views` : 'không rõ lượt xem (không lấy được)';
  return {
    system:
      'Bạn phân tích social signals quanh một video. Audience quality là proxy cho content quality. ' +
      'Đánh giá: (1) chất lượng comment — sâu sắc hay cảm thán, (2) chân dung người comment — ' +
      'practitioner thật hay khán giả đại trà, (3) độ lan toả — video/kênh được nhắc ở đâu, bối cảnh nào (dùng web search nếu cần).\n\n' +
      'QUY TẮC QUAN TRỌNG: dữ liệu comment/lượt xem có thể KHÔNG lấy được vì lý do kỹ thuật (server bị YouTube giới hạn). ' +
      'Thiếu dữ liệu KHÔNG có nghĩa video 0 view hay không ai quan tâm — TUYỆT ĐỐI không suy diễn tiêu cực từ việc thiếu. ' +
      'Khi thiếu: ghi ngắn gọn vào dataGaps, và đánh giá dựa trên những gì tra được về kênh/chủ đề qua web search. ' +
      'Viết xúc tích, không lặp lại ý "thiếu dữ liệu" trong nhiều trường.\n\n' +
      'Trả về DUY NHẤT một JSON object: {"commentQuality": string, "audienceProfile": string, ' +
      '"buzz": string, "dataGaps": [string]}. ' +
      `Viết bằng ${language}.`,
    messages: [{
      role: 'user',
      content: `Video: "${title}" — kênh ${channel} — ${viewText}\n\nTop comments:\n${commentBlock}`
    }],
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }]
  };
}

export function parseSocial(text) {
  const o = extractJson(text);
  if (typeof o.commentQuality !== 'string' || typeof o.audienceProfile !== 'string' ||
      typeof o.buzz !== 'string' || !Array.isArray(o.dataGaps)) {
    throw new Error('Social pass: output sai schema');
  }
  return o;
}
