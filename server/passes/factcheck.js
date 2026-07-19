import { extractJson } from '../claude.js';

const VERDICTS = ['supported', 'contradicted', 'unverifiable'];

export function buildFactcheck({ content }) {
  return {
    system:
      'Bạn là fact-checker. Chọn tối đa 5 claim quan trọng nhất từ danh sách facts, ' +
      'dùng web search để kiểm chứng từng claim. Trả lời DUY NHẤT một JSON object: ' +
      '{"claims": [{"claim": string, "verdict": "supported"|"contradicted"|"unverifiable", ' +
      '"note": string, "sources": [string]}]}. Viết tiếng Việt, sources là URL.',
    messages: [{
      role: 'user',
      content: `Tóm tắt video: ${content.summary}\n\nFacts cần kiểm chứng:\n` +
        content.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')
    }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }]
  };
}

export function parseFactcheck(text) {
  const o = extractJson(text);
  if (!Array.isArray(o.claims)) throw new Error('Factcheck pass: output sai schema');
  for (const c of o.claims) {
    if (typeof c.claim !== 'string' || !VERDICTS.includes(c.verdict) ||
        typeof c.note !== 'string' || !Array.isArray(c.sources)) {
      throw new Error('Factcheck pass: claim sai schema');
    }
  }
  return o;
}
