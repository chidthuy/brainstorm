import { extractJson } from '../claude.js';

export function buildContent({ title, channel, transcriptText }) {
  return {
    system:
      'Bạn là trợ lý screening cho một người sắp quyết định có bỏ 1-2 giờ nghe trọn video này không. ' +
      'Bản đọc của bạn PHẢI hữu ích hơn phần mô tả (description) do chính tác giả viết — description là quảng cáo, ' +
      'còn bạn đưa ra một bản đọc độc lập, có chiều sâu, hoài nghi lành mạnh. Chỉ dựa trên transcript, không bịa.\n\n' +
      'Yêu cầu về từng trường:\n' +
      '- "thesis": luận điểm trung tâm của video trong 1-2 câu — tác giả thực sự muốn thuyết phục người xem điều gì.\n' +
      '- "summary": 2-4 đoạn văn kể lại NỘI DUNG THẬT, không phải teaser. Bám theo mạch lập luận: tác giả đi từ đâu tới đâu, ' +
      'dùng lý lẽ/bằng chứng nào, kèm chi tiết cụ thể (số liệu, tên riêng, ví dụ, trích dẫn đáng chú ý). ' +
      'Nêu rõ điều gì thực sự mới hoặc đáng giá, và bỏ qua phần lấp chỗ.\n' +
      '- "structure": các phần chính; mỗi "gist" là 1-3 câu nói RÕ luận điểm của phần đó, không phải nhãn chung chung. ' +
      'Thêm "timestamp" nếu transcript có mốc thời gian.\n' +
      '- "facts": những điều tác giả trình bày NHƯ SỰ KIỆN (có thể kiểm chứng), ghi cụ thể kèm con số/nguồn nếu tác giả nêu.\n' +
      '- "stance": quan điểm, dự đoán, đánh giá giá trị — tức lập trường của tác giả, tách bạch khỏi facts.\n' +
      '- "caveats": bản đọc hoài nghi — chỗ lập luận yếu nhất, nơi tác giả nói quá hoặc thiếu bằng chứng, ' +
      'thiên kiến có thể có, và điều quan trọng mà video KHÔNG bàn tới. Đây là phần description không bao giờ cho người xem.\n\n' +
      'Trả lời DUY NHẤT một JSON object đúng schema: ' +
      '{"thesis": string, "summary": string, "structure": [{"heading": string, "gist": string, "timestamp": string?}], ' +
      '"facts": [string], "stance": [string], "caveats": [string]}. Viết tiếng Việt.',
    messages: [{
      role: 'user',
      content: `Video: "${title}" — kênh ${channel}\n\nTranscript:\n${transcriptText}`
    }],
    maxTokens: 6000
  };
}

export function parseContent(text) {
  const o = extractJson(text);
  if (typeof o.thesis !== 'string' || typeof o.summary !== 'string' ||
      !Array.isArray(o.structure) || !Array.isArray(o.facts) ||
      !Array.isArray(o.stance) || !Array.isArray(o.caveats)) {
    throw new Error('Content pass: output sai schema');
  }
  return o;
}
