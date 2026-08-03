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
      'Chấm theo GIÁ TRỊ THÔNG TIN cho người xem, KHÔNG phải theo mức độ hoàn hảo học thuật.\n\n' +
      'THANG ĐIỂM (mặc định là điểm khá — chỉ hạ thấp khi có lý do thực sự):\n' +
      '- 80-100: nội dung dày, nhiều insight/dữ kiện có giá trị, lập luận vững — rất đáng nghe trọn.\n' +
      '- 65-79: nội dung tốt, đáng nghe; có vài chỗ dàn trải hoặc claim chưa chắc nhưng không làm hỏng giá trị.\n' +
      '- 50-64: có giá trị vừa phải — nghe lướt/tua phần hay là đủ.\n' +
      '- 30-49: loãng, ít thông tin mới, hoặc nhiều fact sai lệch đáng kể.\n' +
      '- 0-29: sai sự thật nghiêm trọng, câu view rỗng tuếch, gần như vô giá trị.\n' +
      'ĐIỂM XUẤT PHÁT: một video có nội dung chuyên môn thật, mạch lạc, nhiều dữ kiện cụ thể MẶC ĐỊNH nằm ở vùng 70-85. ' +
      'Chỉ kéo xuống khi có bằng chứng rõ: fact bị fact-check đánh false/misleading (trừ mạnh), nội dung rỗng, lặp, hoặc lạc đề. ' +
      'ĐỪNG trừ điểm chỉ vì một vài claim ở mức "weak/chưa kiểm chứng được" — đó là chuyện bình thường của mọi video. ' +
      'Một video hay bị chấm 35-62 là SAI; hãy tự hỏi "nếu bỏ 1-2 giờ nghe, người xem có thu được gì đáng giá không" — ' +
      'nếu có thì điểm phải phản ánh đúng điều đó.\n\n' +
      'QUY TẮC: nếu dữ liệu social (comment/lượt xem) bị thiếu do lỗi kỹ thuật (xem dataGaps), ' +
      'BỎ QUA tiêu chí đó — không trừ điểm, không nêu "thiếu dữ liệu social" làm lý do. ' +
      'Comment ít/vô thưởng vô phạt cũng KHÔNG phải lý do trừ điểm nội dung.\n' +
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
