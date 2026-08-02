import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Model user chọn trên UI → model id thật. Chỉ cho phép danh sách này.
const MODEL_MAP = {
  sonnet: 'claude-sonnet-5',
  opus: 'claude-opus-4-8',
  haiku: 'claude-haiku-4-5'
};
export function resolveModel(choice) {
  return MODEL_MAP[choice] || MODEL;
}

let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

// Khi có web search, Claude chạy vòng lặp tra cứu phía server và có thể dừng
// giữa chừng với stop_reason "pause_turn" — lúc đó câu trả lời CHƯA hoàn chỉnh
// (chưa có JSON). Phải gửi tiếp để nó chạy nốt, không thì pass lỗi.
export async function callClaude({ system, messages, tools, maxTokens = 4000, model }) {
  const client = getClient();
  let msgs = messages;
  let text = '';
  for (let i = 0; i < 6; i++) {
    const resp = await client.messages.create({
      model: model || MODEL,
      max_tokens: maxTokens,
      system,
      messages: msgs,
      ...(tools ? { tools } : {})
    });
    text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (resp.stop_reason !== 'pause_turn') {
      if (resp.stop_reason === 'max_tokens' && !text.trimEnd().endsWith('}')) {
        throw new Error('Output bị cắt giữa chừng (max_tokens) — thử lại hoặc chọn model khác');
      }
      return text;
    }
    msgs = [...msgs, { role: 'assistant', content: resp.content }];
  }
  return text;
}

export function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Không tìm thấy JSON trong output của model');
  return JSON.parse(text.slice(start, end + 1));
}
