import { extractJson } from '../claude.js';

export const FALLBACK_SCORE = {
  score: 50,
  label: 'Cân nhắc',
  reasons: ['Chấm điểm không khả dụng — compose pass lỗi.'],
  focusAnswer: null
};

// Chấm một điểm 0-100 (kiểu Tomatometer) cho "có đáng nghe trọn không".
export function buildCompose({ content, factcheck, social, video, question, language }) {
  const focus = question && question.trim()
    ? `\n\nNgười dùng hỏi: "${question.trim()}". Trả lời trong "focusAnswer" (3-5 câu, xúc tích) dựa trên ` +
      'TOÀN BỘ kết quả — đặc biệt là kết quả fact-check (đối chiếu nguồn ngoài), không chỉ transcript.'
    : '\n\nKhông có câu hỏi — đặt "focusAnswer" = null.';
  return {
    system:
      'Bạn chấm điểm screening 0-100 cho một video dài: "có đáng bỏ thời gian nghe trọn không". ' +
      'Cân nhắc: nội dung dày/mỏng, lập luận chặt/lỏng, độ tin cậy của các fact (nhiều fact yếu/sai thì trừ mạnh), ' +
      'và chất lượng audience. Điểm cao = rất đáng nghe; thấp = nên bỏ qua.\n\n' +
      'QUY TẮC: nếu dữ liệu social (comment/lượt xem) bị thiếu do lỗi kỹ thuật (xem dataGaps), ' +
      'BỎ QUA tiêu chí đó — không trừ điểm, không nêu "thiếu dữ liệu social" làm lý do.\n' +
      'MẬT ĐỘ THÔNG TIN: mỗi reason vào thẳng lý do kèm dẫn chứng cụ thể, không mở đầu bằng "Video này", ' +
      '"Có thể thấy", "Đáng chú ý là"; không lặp lại ý đã có trong tóm tắt. Giữ dữ kiện, bỏ chữ rỗng.\n\n' +
      'Trả về DUY NHẤT một JSON object: {"score": number (0-100), "label": string (nhãn ngắn: VD "Đáng nghe trọn", "Nghe lướt", "Bỏ qua"), ' +
      '"reasons": [string], "focusAnswer": string|null} với 2-3 reasons. ' +
      `Viết bằng ${language}.` + focus,
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
  return {
    score: Math.round(n),
    label: o.label,
    reasons: o.reasons,
    focusAnswer: typeof o.focusAnswer === 'string' ? o.focusAnswer : null
  };
}
