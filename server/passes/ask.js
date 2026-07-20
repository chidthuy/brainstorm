// Hỏi tiếp / phản hồi sau khi đã có báo cáo. Trả về text thuần (không JSON).
export function buildAsk({ report, question, language }) {
  const ctx = {
    video: report?.video,
    summary: report?.content?.summary,
    stance: report?.content?.stance,
    factcheck: report?.factcheck?.claims,
    social: report?.social,
    score: report?.score
  };
  return {
    system:
      'Bạn là trợ lý screening. Người dùng đã có báo cáo về một video và hỏi thêm/phản hồi. ' +
      'Trả lời NGẮN GỌN, bám vào báo cáo (tóm tắt, fact-check, điểm số) và transcript đã phân tích. ' +
      'Nếu không đủ dữ liệu để trả lời chắc chắn, nói rõ. Không bịa. ' +
      `Trả lời bằng ${language}. Chỉ trả lời, không JSON.`,
    messages: [{
      role: 'user',
      content: `Báo cáo (JSON):\n${JSON.stringify(ctx)}\n\nCâu hỏi/phản hồi: ${question}`
    }],
    maxTokens: 2000
  };
}
