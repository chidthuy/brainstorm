import { QUALITY_LADDER } from './content.js';

// Hỏi tiếp / phản hồi sau khi đã có báo cáo. Trả về text thuần (không JSON).
//
// Khung chat này là NƠI MỞ RỘNG FACT-CHECK: bước fact-check tự động cố tình chỉ
// soi các trụ đỡ của luận điểm chính, nên khi người dùng muốn soi thêm mục nào
// thì hỏi ở đây. Vì vậy pass này có web search — không có thì nó chỉ biết nói
// "báo cáo không đề cập", đúng cái bẫy vòng trước đã sửa.
export function buildAsk({ report, question, language }) {
  const ctx = {
    video: report?.video,
    author: report?.content?.author,
    summary: report?.content?.summary,
    outline: report?.content?.outline,
    stance: report?.content?.stance,
    factsLoadBearing: report?.content?.facts,
    descriptionGap: report?.content?.descriptionGap,
    factchecked: report?.factcheck?.claims,
    social: report?.social,
    score: report?.score
  };
  return {
    system:
      'Bạn là trợ lý screening. Người dùng đã có báo cáo về một video và hỏi thêm/phản hồi. ' +
      'Bám vào báo cáo (tóm tắt, dàn ý, luận điểm, fact-check, điểm số).\n\n' +
      'KHI NGƯỜI DÙNG NHỜ KIỂM CHỨNG một thông tin (dù có trong bảng fact-check hay không): ' +
      'DÙNG WEB SEARCH tra nguồn thật rồi kết luận solid / weak / gây hiểu nhầm / sai, kèm link nguồn. ' +
      'KHÔNG trả lời kiểu "báo cáo không đề cập" hay "video không dẫn nguồn" — đó không phải câu trả lời. ' +
      'Bảng fact-check trong báo cáo cố ý chỉ soi các trụ đỡ của luận điểm chính, nên việc một thông tin ' +
      'không nằm trong bảng là BÌNH THƯỜNG, không phải lý do từ chối tra.\n' +
      'Tra không ra nguồn đáng tin thì nói thẳng là đã tra và không thấy.\n\n' +
      'Câu hỏi về nội dung video (không phải kiểm chứng) thì trả lời từ báo cáo, không cần tìm kiếm. ' +
      'Không đủ dữ liệu để chắc chắn thì nói rõ. Không bịa.\n\n' +
      QUALITY_LADDER + '\n\n' +
      `Trả lời bằng ${language}. Văn xuôi/gạch đầu dòng, KHÔNG trả về JSON.`,
    messages: [{
      role: 'user',
      content: `Báo cáo (JSON):\n${JSON.stringify(ctx)}\n\nCâu hỏi/phản hồi: ${question}`
    }],
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
    maxTokens: 3000
  };
}
