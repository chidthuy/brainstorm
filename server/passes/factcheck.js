import { extractJson } from '../claude.js';
import { normalizeFacts } from './content.js';

// Fact-check có PHẠM VI HẸP CÓ CHỦ Ý: chỉ soi những thông tin làm trụ đỡ cho
// luận điểm chính — thứ mà nếu sai thì kết luận của video lung lay. Soi tràn lan
// vừa chậm, vừa loãng, vừa đẩy người đọc vào một bảng dài không ai đọc hết.
// Muốn soi thêm mục nào, người dùng hỏi tiếp ở khung Chat (pass `ask` có web search).
const VERDICTS = ['solid', 'weak', 'misleading', 'false'];

export const MAX_CLAIMS = 4;

export function buildFactcheck({ content, language }) {
  const facts = normalizeFacts(content?.facts).slice(0, MAX_CLAIMS);
  return {
    system:
      'Bạn là fact-checker. NHIỆM VỤ CỐT LÕI: TỰ đối chiếu từng thông tin với nguồn uy tín qua web search ' +
      '(báo cáo tài chính, báo chí lớn, dữ liệu chính thức, nghiên cứu). Việc tác giả KHÔNG dẫn nguồn trong video ' +
      'không phải căn cứ đánh giá — không nói "thiếu nguồn trong video"; hãy đi tìm nguồn và kết luận đúng/sai/yếu ' +
      'dựa trên bằng chứng BÊN NGOÀI.\n\n' +
      'PHẠM VI — QUAN TRỌNG: chỉ soi ĐÚNG những mục được đưa cho bạn dưới đây, KHÔNG mở rộng. ' +
      'Không tự thêm claim mới nhặt từ nội dung khác, không soi quan điểm/dự đoán của tác giả ' +
      '(dự đoán tương lai không kiểm chứng được — bỏ qua). Mỗi mục kèm sẵn luận điểm mà nó đang đỡ; ' +
      'kết luận của bạn phải nói được điều đó ảnh hưởng thế nào tới luận điểm ấy.\n' +
      'Mục nào tra không ra nguồn nào đáng tin sau khi đã thử thì xếp "weak" và nói rõ đã tìm mà không thấy — ' +
      'đừng bỏ trống, cũng đừng suy đoán liều.\n\n' +
      'PHÂN LOẠI:\n' +
      '- "solid": có cơ sở, khớp nguồn đáng tin.\n' +
      '- "weak": có thể đúng nhưng bằng chứng yếu — VD khảo sát mẫu nhỏ/tự chọn, giai thoại, không tra được nguồn.\n' +
      '- "misleading": gây hiểu nhầm — đúng một phần nhưng thổi phồng/thiếu ngữ cảnh.\n' +
      '- "false": sai hoặc bịa.\n\n' +
      'Trả về DUY NHẤT một JSON object: ' +
      '{"claims": [{"claim": string, "verdict": "solid"|"weak"|"misleading"|"false", "note": string, "sources": [string]}]}. ' +
      'note giải thích ngắn VÌ SAO xếp loại vậy VÀ hệ quả với luận điểm được đỡ. sources là URL thật đã tra được ' +
      `(không có thì để mảng rỗng, đừng bịa link). Viết bằng ${language}.`,
    messages: [{
      role: 'user',
      content: facts.length
        ? 'Soi đúng các mục sau, không thêm mục nào khác:\n' +
          facts.map((f, i) =>
            `${i + 1}. ${f.claim}` + (f.supports ? `\n   → đang đỡ luận điểm: ${f.supports}` : '')
          ).join('\n')
        : '(Không có thông tin nào làm trụ đỡ cho luận điểm chính — trả về {"claims": []})'
    }],
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
    maxTokens: 8000
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
  return { claims: o.claims.slice(0, MAX_CLAIMS) };
}
