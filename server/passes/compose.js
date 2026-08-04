import { extractJson } from '../claude.js';

export const FALLBACK_SCORE = {
  score: 50,
  label: 'Cân nhắc',
  reasons: ['Chấm điểm không khả dụng — compose pass lỗi.'],
  breakdown: [],
  focusAnswer: null
};

// Năm trục chấm điểm, XẾP THEO TRỌNG SỐ GIẢM DẦN. Hai trục cuối là điều chỉnh
// (+/−) chứ không phải nền điểm.
export const CRITERIA = ['rich', 'stance', 'credibility', 'logic', 'weakness'];
export const IMPACTS = ['plus', 'neutral', 'minus', 'skip'];

export const CRITERIA_LABELS = {
  rich: 'Nội dung dày',
  stance: 'Luận điểm đứng vững',
  credibility: 'Uy tín tác giả / kênh',
  logic: 'Trình bày logic',
  weakness: 'Điểm yếu lập luận'
};

// Chấm một điểm 0-100 (kiểu Tomatometer) cho "có đáng nghe trọn không".
export function buildCompose({
  content, factcheck, social, video, question, language, seenThemes
}) {
  const focus = question && question.trim()
    ? `\n\nNgười dùng hỏi: "${question.trim()}". Trả lời trong "focusAnswer" (3-5 câu, xúc tích) dựa trên ` +
      'TOÀN BỘ kết quả — đặc biệt là kết quả fact-check (đối chiếu nguồn ngoài), không chỉ transcript.'
    : '\n\nKhông có câu hỏi — đặt "focusAnswer" = null.';

  const seen = Array.isArray(seenThemes) && seenThemes.length
    ? '\n\nCÁC VIDEO NGƯỜI DÙNG ĐÃ SOI GẦN ĐÂY (để phát hiện trùng lặp):\n' +
      seenThemes.slice(0, 15).map((t, i) => `${i + 1}. ${t}`).join('\n') +
      '\nChỉ trừ điểm ở trục "stance" khi video này gần như LẶP LẠI một video đã soi ' +
      '(cùng luận điểm, cùng dữ kiện, không thêm góc nhìn mới). Cùng chủ đề nhưng góc nhìn/dữ kiện mới ' +
      'thì KHÔNG trừ — trùng chủ đề là chuyện bình thường.'
    : '\n\n(Chưa có lịch sử đủ để xét trùng lặp — bỏ qua yếu tố này.)';

  return {
    system:
      'Bạn chấm điểm screening 0-100 cho một video dài: "có đáng bỏ thời gian nghe trọn không". ' +
      'Chấm theo GIÁ TRỊ THÔNG TIN cho người xem, KHÔNG phải theo mức độ hoàn hảo học thuật.\n\n' +
      'NĂM TRỤC CHẤM, XẾP THEO TRỌNG SỐ GIẢM DẦN — ba trục đầu dựng nên điểm nền, ' +
      'hai trục cuối chỉ điều chỉnh lên/xuống:\n' +
      '1. NỘI DUNG DÀY (rich) — TRỤ NẶNG NHẤT. Lượng và chất của thông tin thật: insight, dữ kiện cụ thể, ' +
      'số liệu, ví dụ, khung tư duy dùng được. Video dày thông tin ăn điểm cao ngay ở trục này.\n' +
      '2. LUẬN ĐIỂM ĐỨNG VỮNG (stance) — luận điểm có sắc nét và có cơ sở không, hay chỉ là nhận định chung chung ' +
      'ai nói cũng được. Có lặp lại nội dung người dùng đã soi gần đây không.\n' +
      '3. UY TÍN TÁC GIẢ / KÊNH (credibility) — dựa trên chuyên môn thể hiện trong chính nội dung và những gì ' +
      'biết chắc về tác giả/kênh. Cộng thêm tín hiệu khán giả (comment, lượt xem) CHỈ KHI mẫu đủ lớn để có ý nghĩa ' +
      '(vài chục comment thực chất trở lên). Mẫu nhỏ hoặc thiếu dữ liệu → impact "skip", KHÔNG trừ điểm.\n' +
      '4. TRÌNH BÀY LOGIC (logic) — CỘNG điểm khi mạch lập luận rõ, có thứ tự, dẫn dắt được người nghe. ' +
      'Trục này chỉ cộng hoặc trung tính, không dùng để trừ.\n' +
      '5. ĐIỂM YẾU LẬP LUẬN (weakness) — TRỪ điểm khi: luận điểm chính quá yếu so với kết luận rút ra, ' +
      'hoặc luận điểm được đỡ bởi dữ liệu không uy tín (fact-check trả "misleading"/"false", ' +
      'số liệu tự chế, khảo sát mẫu nhỏ dùng để kết luận lớn). Không có vấn đề gì thì impact "neutral".\n\n' +
      'THANG ĐIỂM (mặc định là điểm khá — chỉ hạ thấp khi có lý do thực sự):\n' +
      '- 80-100: nội dung dày, nhiều insight/dữ kiện có giá trị, lập luận vững — rất đáng nghe trọn.\n' +
      '- 65-79: nội dung tốt, đáng nghe; có vài chỗ dàn trải hoặc claim chưa chắc nhưng không làm hỏng giá trị.\n' +
      '- 50-64: có giá trị vừa phải — nghe lướt/tua phần hay là đủ.\n' +
      '- 30-49: loãng, ít thông tin mới, hoặc nhiều fact sai lệch đáng kể.\n' +
      '- 0-29: sai sự thật nghiêm trọng, câu view rỗng tuếch, gần như vô giá trị.\n' +
      'ĐIỂM XUẤT PHÁT: một video có nội dung chuyên môn thật, mạch lạc, nhiều dữ kiện cụ thể MẶC ĐỊNH nằm ở vùng 70-85. ' +
      'Chỉ kéo xuống khi có bằng chứng rõ ở trục 5. ' +
      'ĐỪNG trừ điểm chỉ vì một vài claim ở mức "weak/chưa kiểm chứng được" — đó là chuyện bình thường của mọi video. ' +
      'Một video hay bị chấm 35-62 là SAI; hãy tự hỏi "nếu bỏ 1-2 giờ nghe, người xem có thu được gì đáng giá không" — ' +
      'nếu có thì điểm phải phản ánh đúng điều đó.\n\n' +
      'QUY TẮC DỮ LIỆU THIẾU: trục nào không đủ dữ liệu để xét (social bị lỗi kỹ thuật, không biết gì về kênh...) ' +
      'thì đặt impact "skip" và BỎ QUA — không trừ điểm, không nêu "thiếu dữ liệu" làm lý do trong "reasons".\n' +
      'MẬT ĐỘ THÔNG TIN: mỗi reason vào thẳng lý do kèm dẫn chứng cụ thể, không mở đầu bằng "Video này", ' +
      '"Có thể thấy", "Đáng chú ý là"; không lặp lại ý đã có trong tóm tắt.\n\n' +
      'Trả về DUY NHẤT một JSON object:\n' +
      '{"score": number (0-100), "label": string (nhãn ngắn: VD "Đáng nghe trọn", "Nghe lướt", "Bỏ qua"),\n' +
      ' "reasons": [string],   // 2-3 lý do quyết định điểm, mạnh nhất trước\n' +
      ' "breakdown": [{"criterion": "rich"|"stance"|"credibility"|"logic"|"weakness",\n' +
      '                "impact": "plus"|"neutral"|"minus"|"skip", "note": string}],  // ĐỦ 5 trục, ĐÚNG THỨ TỰ trên, note 1 câu\n' +
      ' "focusAnswer": string|null}\n' +
      `Viết bằng ${language}.` + focus,
    messages: [{
      role: 'user',
      content:
        `Video: "${video.title}" (${Math.round((video.durationSec ?? 0) / 60)} phút) — kênh ${video.channel ?? '(không rõ)'}\n` +
        `Lượt xem: ${video.viewCount || 'không rõ'} · số comment: ${video.commentCount || 'không rõ'}\n\n` +
        `Tác giả (chỉ từ dữ kiện trong video): ${content?.author ?? '(không rõ)'}\n\n` +
        `Tóm tắt: ${content?.summary ? JSON.stringify(content.summary) : '(content pass lỗi)'}\n\n` +
        `Luận điểm của tác giả: ${JSON.stringify(content?.stance ?? [])}\n\n` +
        `Trụ đỡ đã soi (fact-check): ${JSON.stringify(factcheck?.claims ?? 'lỗi')}\n\n` +
        `Lệch giữa mô tả và nội dung thật: ${content?.descriptionGap ?? 'không có'}\n\n` +
        `Social: ${JSON.stringify(social ?? 'lỗi')}` + seen
    }],
    maxTokens: 3000
  };
}

function parseBreakdown(raw) {
  if (!Array.isArray(raw)) return [];
  const byKey = new Map();
  for (const b of raw) {
    const criterion = String(b?.criterion ?? '');
    if (!CRITERIA.includes(criterion) || byKey.has(criterion)) continue;
    byKey.set(criterion, {
      criterion,
      label: CRITERIA_LABELS[criterion],
      impact: IMPACTS.includes(b?.impact) ? b.impact : 'neutral',
      note: String(b?.note ?? '').trim()
    });
  }
  // Luôn trả về đúng thứ tự trọng số, kể cả khi model đảo thứ tự.
  return CRITERIA.map(c => byKey.get(c)).filter(Boolean);
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
    breakdown: parseBreakdown(o.breakdown),
    focusAnswer: typeof o.focusAnswer === 'string' ? o.focusAnswer : null
  };
}
