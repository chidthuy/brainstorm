import { extractJson } from '../claude.js';

const VERDICTS = ['WATCH', 'SKIM', 'SKIP'];
const CONFIDENCES = ['low', 'medium', 'high'];

export const FALLBACK_VERDICT = {
  verdict: 'SKIM',
  confidence: 'low',
  reasons: ['Verdict không khả dụng — compose pass lỗi.']
};

export function buildCompose({ content, factcheck, social, video }) {
  return {
    system:
      'Bạn ra verdict screening cho một video dài. Verdict giúp người dùng QUYẾT ĐỊNH có xem trọn không — ' +
      'không thay thế việc xem. WATCH = đáng đầu tư nghe trọn; SKIM = xem lướt vài phần; SKIP = bỏ qua. ' +
      'Trả lời DUY NHẤT một JSON object: {"verdict": "WATCH"|"SKIM"|"SKIP", ' +
      '"confidence": "low"|"medium"|"high", "reasons": [string]} với 2-3 reasons ngắn. Viết tiếng Việt.',
    messages: [{
      role: 'user',
      content:
        `Video: "${video.title}" (${Math.round((video.durationSec ?? 0) / 60)} phút)\n\n` +
        `Tóm tắt: ${content?.summary ?? '(content pass lỗi)'}\n\n` +
        `Fact-check: ${JSON.stringify(factcheck?.claims ?? 'lỗi')}\n\n` +
        `Social: ${JSON.stringify(social ?? 'lỗi')}`
    }]
  };
}

export function parseCompose(text) {
  const o = extractJson(text);
  if (!VERDICTS.includes(o.verdict) || !CONFIDENCES.includes(o.confidence) || !Array.isArray(o.reasons)) {
    throw new Error('Compose pass: output sai schema');
  }
  return o;
}
