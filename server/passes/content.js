import { extractJson } from '../claude.js';

export function buildContent({ title, channel, transcriptText }) {
  return {
    system:
      'Bạn là trợ lý screening video. Nhiệm vụ: tóm tắt TRUNG THỰC transcript, ' +
      'tách rõ facts (điều tác giả trình bày như sự kiện) và stance (quan điểm/lập trường của tác giả). ' +
      'Không thêm ý kiến của bạn. Trả lời DUY NHẤT một JSON object đúng schema: ' +
      '{"summary": string, "structure": [{"heading": string, "gist": string, "timestamp": string?}], ' +
      '"facts": [string], "stance": [string]}. Viết tiếng Việt.',
    messages: [{
      role: 'user',
      content: `Video: "${title}" — kênh ${channel}\n\nTranscript:\n${transcriptText}`
    }]
  };
}

export function parseContent(text) {
  const o = extractJson(text);
  if (typeof o.summary !== 'string' || !Array.isArray(o.structure) ||
      !Array.isArray(o.facts) || !Array.isArray(o.stance)) {
    throw new Error('Content pass: output sai schema');
  }
  return o;
}
