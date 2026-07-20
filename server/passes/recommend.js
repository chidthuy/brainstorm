import { extractJson } from '../claude.js';

// "More like this" — gợi ý vài video/nguồn cùng chủ đề, được đánh giá cao.
// Trung thực: KHÔNG bịa điểm số cho video chưa screen; chỉ nêu vì sao đáng xem.
export function buildRecommend({ title, theme, language }) {
  return {
    system:
      'Bạn gợi ý 2-4 video hoặc nguồn khác CÙNG CHỦ ĐỀ và được cộng đồng đánh giá cao, ' +
      'để người dùng có lựa chọn thay thế/bổ sung. Dùng web search để tìm. ' +
      'KHÔNG bịa điểm số — chỉ nêu vì sao đáng xem. Trả về DUY NHẤT một JSON object: ' +
      '{"items": [{"title": string, "channel": string, "url": string, "why": string}]}. ' +
      `why là 1 câu vì sao đáng xem. Viết bằng ${language}.`,
    messages: [{
      role: 'user',
      content: `Video vừa xem: "${title}". Chủ đề: ${theme}. Gợi ý nguồn cùng chủ đề đáng xem.`
    }],
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }]
  };
}

export function parseRecommend(text) {
  const o = extractJson(text);
  if (!Array.isArray(o.items)) throw new Error('Recommend pass: output sai schema');
  for (const it of o.items) {
    if (typeof it.title !== 'string' || typeof it.why !== 'string') {
      throw new Error('Recommend pass: item sai schema');
    }
  }
  return o;
}
