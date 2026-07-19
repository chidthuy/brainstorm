import { extractJson } from '../claude.js';

export function buildSocial({ title, channel, viewCount, comments }) {
  const commentBlock = comments.length
    ? comments.map(c => `[${c.likes} likes] ${c.text}`).join('\n')
    : '(không lấy được comment)';
  return {
    system:
      'Bạn phân tích social signals quanh một video. Audience quality là proxy cho content quality. ' +
      'Đánh giá: (1) chất lượng comment — sâu sắc hay cảm thán, (2) chân dung người comment — ' +
      'practitioner thật hay khán giả đại trà, (3) buzz — video/kênh được nhắc ở đâu, bối cảnh nào (dùng web search nếu cần). ' +
      'Trả lời DUY NHẤT một JSON object: {"commentQuality": string, "audienceProfile": string, ' +
      '"buzz": string, "dataGaps": [string]}. Ghi vào dataGaps những dữ liệu bị thiếu. Viết tiếng Việt.',
    messages: [{
      role: 'user',
      content: `Video: "${title}" — kênh ${channel} — ${viewCount} views\n\nTop comments:\n${commentBlock}`
    }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }]
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
