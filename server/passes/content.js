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
      'DANH TÍNH TÁC GIẢ — TUYỆT ĐỐI KHÔNG BỊA:\n' +
      'Chỉ nêu tên/chức danh/tổ chức của tác giả nếu chính transcript hoặc tiêu đề/kênh NÓI RÕ. ' +
      'KHÔNG suy ra danh tính từ kiến thức nền của bạn, KHÔNG đoán tên người nói, KHÔNG thêm tiểu sử ' +
      '(công ty đã sáng lập, học vấn, thành tựu...) mà transcript không hề nhắc. Đoán sai tên là lỗi nặng nhất. ' +
      'Nếu transcript không cho biết rõ người nói là ai, ghi đúng những gì biết được (VD "diễn giả trong hội thảo X", ' +
      '"kênh Y") thay vì bịa một cái tên. Chỉ giữ thông tin tác giả LIÊN QUAN tới độ tin cậy của nội dung.\n\n' +
      'PHONG CÁCH VIẾT — MẬT ĐỘ THÔNG TIN CAO:\n' +
      'Giữ TRỌN thông tin, cắt sạch chữ rỗng. Độ dài đi theo lượng dữ kiện thật: nhiều dữ kiện thì viết dài hơn, ' +
      'ít thì ngắn. KHÔNG cắt cụt làm mất dữ kiện, cũng KHÔNG kéo dài cho đầy.\n' +
      '- GIỮ BẰNG MỌI GIÁ: con số, tên riêng, mốc thời gian, ví dụ cụ thể, đơn vị. Đây là phần giá trị nhất.\n' +
      '- CẮT: cụm mở đầu rỗng nghĩa ("Video bàn về", "Trong video này", "Tác giả đề cập đến", "Bài nói xoay quanh"); ' +
      'lời rào đón ("có thể thấy rằng", "nhìn chung", "đáng chú ý là", "nhấn mạnh rằng", "được nêu là"); ' +
      'disclaimer ("cần kiểm chứng độc lập", "đây là quan điểm cá nhân"); tính từ cảm thán không mang thông tin.\n' +
      '- KHÔNG LẶP: mỗi thông tin xuất hiện đúng một lần. theme nêu video NÓI VỀ GÌ; conclusion nêu điều ' +
      'RÚT RA ĐƯỢC — không diễn đạt lại theme bằng chữ khác.\n' +
      '- CHỈ GIỮ CHI TIẾT LIÊN QUAN tới luận điểm. Bỏ chi tiết vụn không ảnh hưởng kết luận ' +
      '(biệt danh, tên người phụ, chuyện bên lề) — trừ khi chính nó là dữ kiện quan trọng.\n' +
      '- MỖI CÂU PHẢI TỰ ĐỨNG ĐƯỢC, đọc một lần là hiểu. Không dùng cấu trúc lơ lửng kiểu ' +
      '"cùng với X mới nổi lên sau Y và Z: W". Viết rõ quan hệ: cái gì thay cái gì, theo thứ tự nào.\n' +
      '- Một ý một câu. Tránh chuỗi mệnh đề nối bằng dấu phẩy kéo dài.\n' +
      '- Thuật ngữ/viết tắt lạ (ARR, orchestration...) kèm giải thích ngắn trong ngoặc, chỉ lần đầu.\n' +
      'TRƯỚC KHI TRẢ VỀ: đọc lại từng câu, thử xoá từng cụm từ — xoá mà không mất thông tin thì xoá thật.\n\n' +
      'VÍ DỤ (giữ nguyên mọi dữ kiện, chỉ bỏ chữ thừa):\n' +
      'DỞ: "Video bàn về sự chuyển dịch từ người làm sang người điều phối AI (Orchestrator) trong kỷ nguyên ' +
      'Agentic AI, cuộc đua hệ điều hành AI (Open Claw vs Claude/Anthropic), và nút thắt hạ tầng mới: CPU đang ' +
      'hot trở lại sau khi GPU và chip nhớ (Memory) đã qua giai đoạn khan hiếm."\n' +
      'TỐT: "Chuyển từ người làm sang người điều phối AI (orchestrator). Cuộc đua hệ điều hành AI: Open Claw ' +
      'vs Claude. Nút thắt hạ tầng đi từ GPU sang chip nhớ, nay tới CPU."\n\n' +
      'Trả về DUY NHẤT một JSON object đúng schema:\n' +
      '{\n' +
      '  "author": string,            // 1 câu, CHỈ từ dữ kiện trong transcript/tiêu đề/kênh — không đoán tên, không thêm tiểu sử tự bịa\n' +
      '  "summary": {\n' +
      '    "theme": string,           // video nói về gì — 1-2 câu\n' +
      '    "highlights": [string],    // MẢNG 2-5 gạch đầu dòng — CHỈ các ý CỐT LÕI làm nên giá trị video.\n' +
      '                               // Chọn lọc gắt: mỗi highlight phải là một luận điểm/insight trung tâm,\n' +
      '                               // KHÔNG phải mọi ví dụ hay case study đều đáng lên highlight (một ca minh hoạ\n' +
      '                               // cho luận điểm đã có thì gộp vào luận điểm đó hoặc bỏ). Nếu phân vân "cái này\n' +
      '                               // có phải điểm chính không" thì gần như chắc là không — để nó cho outline.\n' +
      '                               // Gom theo chủ đề, mỗi gạch một ý trọn vẹn kèm số liệu/ví dụ nếu là cốt lõi.\n' +
      '    "conclusion": string,      // điều RÚT RA được từ nội dung — không lặp lại theme\n' +
      '    "takeaway": string         // người xem áp dụng được gì\n' +
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
      !Array.isArray(s.highlights) || typeof s.conclusion !== 'string' ||
      typeof s.takeaway !== 'string' || !Array.isArray(o.outline) ||
      !Array.isArray(o.stance) || !Array.isArray(o.facts) ||
      !('focusAnswer' in o)) {
    throw new Error('Content pass: output sai schema');
  }
  return o;
}
