import Anthropic from '@anthropic-ai/sdk';

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export async function callClaude({ system, messages, tools, maxTokens = 4000 }) {
  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
    ...(tools ? { tools } : {})
  });
  return resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

export function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('Không tìm thấy JSON trong output của model');
  return JSON.parse(text.slice(start, end + 1));
}
