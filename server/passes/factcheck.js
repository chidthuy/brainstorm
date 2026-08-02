import { extractJson } from '../claude.js';

// Fact-check chỉ soi các THÔNG TIN được nêu như sự kiện: đủ vững, yếu (mẫu nhỏ/thiếu
// bằng chứng), gây hiểu nhầm, hay sai/bịa. Không chấm các quan điểm (stance).
const VERDICTS = ['solid', 'weak', 'misleading', 'false'];

export function buildFactcheck({ content, language }) {
  return {
    system:
      'Bạn là fact-checker. NHIỆM VỤ CỐT LÕI: TỰ đối chiếu từng thông tin với nguồn uy tín qua web search ' +
      '(báo cáo tài chính, báo chí công nghệ lớn, dữ liệu thị trường). Việc tác giả KHÔNG dẫn nguồn trong video ' +
      'không phải căn cứ đánh giá — không nói "thiếu nguồn trong video"; hãy đi tìm nguồn và kết luận đúng/sai/yếu ' +
      'dựa trên bằng chứng BÊN NGOÀI. Với mỗi thông tin, phân loại:\n' +
      '- "solid": có cơ sở, khớp nguồn đáng tin.\n' +
      '- "weak": có thể đúng nhưng bằng chứng yếu — VD khảo sát mẫu nhỏ/tự chọn, giai thoại, thiếu nguồn.\n' +
      '- "misleading": gây hiểu nhầm — đúng một phần nhưng thổi phồng/thiếu ngữ cảnh.\n' +
      '- "false": sai hoặc bịa.\n\n' +
      'Chọn tối đa 6 fact quan trọng nhất. Trả về DUY NHẤT một JSON object: ' +
      '{"claims": [{"claim": string, "verdict": "solid"|"weak"|"misleading"|"false", "note": string, "sources": [string]}]}. ' +
      `note giải thích ngắn VÌ SAO xếp loại vậy. sources là URL. Viết bằng ${language}.`,
    messages: [{
      role: 'user',
      content: 'Các thông tin cần soi:\n' +
        (content.facts.length ? content.facts.map((f, i) => `${i + 1}. ${f}`).join('\n') : '(không có)')
    }],
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
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
  return o;
}
