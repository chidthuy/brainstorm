import { extractJson } from '../claude.js';

export const FALLBACK_SCORE = {
  score: 50,
  label: 'Cân nhắc',
  reasons: ['Chấm điểm không khả dụng — compose pass lỗi.']
};

// Chấm một điểm 0-100 (kiểu Tomatometer) cho "có đáng nghe trọn không".
export function buildCompose({ content, factcheck, social, video, language }) {
  return {
    system:
      'Bạn chấm điểm screening 0-100 cho một video dài: "có đáng bỏ thời gian nghe trọn không". ' +
      'Cân nhắc: nội dung dày/mỏng, lập luận chặt/lỏng, độ tin cậy của các fact (nhiều fact yếu/sai thì trừ mạnh), ' +
      'và chất lượng audience. Điểm cao = rất đáng nghe; thấp = nên bỏ qua. ' +
      'Trả về DUY NHẤT một JSON object: {"score": number (0-100), "label": string (nhãn ngắn: VD "Đáng nghe trọn", "Nghe lướt", "Bỏ qua"), ' +
      `"reasons": [string]} với 2-3 reasons ngắn giải thích điểm. Viết bằng ${language}.`,
    messages: [{
      role: 'user',
      content:
        `Video: "${video.title}" (${Math.round((video.durationSec ?? 0) / 60)} phút)\n\n` +
        `Tóm tắt: ${content?.summary ? JSON.stringify(content.summary) : '(content pass lỗi)'}\n\n` +
        `Fact-check: ${JSON.stringify(factcheck?.claims ?? 'lỗi')}\n\n` +
        `Social: ${JSON.stringify(social ?? 'lỗi')}`
    }]
  };
}

export function parseCompose(text) {
  const o = extractJson(text);
  const n = Number(o.score);
  if (!Number.isFinite(n) || n < 0 || n > 100 || typeof o.label !== 'string' || !Array.isArray(o.reasons)) {
    throw new Error('Compose pass: output sai schema');
  }
  return { score: Math.round(n), label: o.label, reasons: o.reasons };
}
