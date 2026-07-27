import { fetchVideoData } from './ingest.js';
import { callClaude as defaultCallClaude } from './claude.js';
import { buildContent, parseContent } from './passes/content.js';
import { buildFactcheck, parseFactcheck } from './passes/factcheck.js';
import { buildSocial, parseSocial } from './passes/social.js';
import { buildRecommend, parseRecommend } from './passes/recommend.js';
import { buildCompose, parseCompose } from './passes/compose.js';

// Kiến trúc step-per-request: mỗi bước phân tích là MỘT request riêng do client
// điều phối → mỗi bước có trọn giới hạn thời gian serverless của nó, tổng thời
// gian screening không còn bị trần nào chặn. 3 bước web-search chạy song song.

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

// Ghép transcript kèm mốc [m:ss]; cắt nếu quá dài (≈4-5 giờ nói) để một pass
// không vượt giới hạn thời gian của chính nó.
export const MAX_TRANSCRIPT_CHARS = 250000;
export function transcriptWithTimes(segments) {
  const full = segments.map(s => `[${fmtTime(s.start ?? 0)}] ${s.text}`).join('\n');
  return capTranscript(full);
}
export function capTranscript(text) {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text;
  return text.slice(0, MAX_TRANSCRIPT_CHARS) +
    '\n[... transcript quá dài, phần sau đã bị cắt — báo cáo dựa trên phần đầu ...]';
}

// Transcript dán từ khung "Show transcript" của YouTube có mốc thời gian ở
// DÒNG RIÊNG ("0:45" rồi xuống dòng mới tới nội dung). Gộp lại thành "[0:45] nội dung"
// để model dựng outline có mốc chuẩn.
const TS_LINE = /^\(?(\d{1,2}:\d{2}(?::\d{2})?)\)?$/;
export function normalizePastedTranscript(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').map(l => l.trim());
  const out = [];
  let pending = null;
  for (const line of lines) {
    if (!line) continue;
    const m = line.match(TS_LINE);
    if (m) { pending = m[1]; continue; }
    out.push(pending ? `[${pending}] ${line}` : line);
    pending = null;
  }
  return out.join('\n');
}

export async function runStep(step, payload = {}, opts = {}, deps = {}) {
  const language = opts.language || 'Tiếng Việt';
  const model = opts.model;
  const callClaude = deps.callClaude ?? defaultCallClaude;
  const run = async (build, parse) => parse(await callClaude({ ...build, model }));

  switch (step) {
    case 'ingest': {
      const v = await fetchVideoData(payload.url);
      return {
        video: {
          id: v.id, title: v.title, channel: v.channel,
          durationSec: v.durationSec, viewCount: v.viewCount
        },
        hasTranscript: !!v.transcript,
        transcriptSource: v.transcriptSource ?? null,
        transcriptText: v.transcript ? transcriptWithTimes(v.transcript) : null,
        comments: v.comments ?? []
      };
    }
    case 'content':
      return run(
        buildContent({
          title: payload.title, channel: payload.channel,
          transcriptText: capTranscript(normalizePastedTranscript(payload.transcriptText ?? '')),
          question: payload.question, language
        }),
        parseContent
      );
    case 'factcheck':
      return run(buildFactcheck({ content: payload.content, language }), parseFactcheck);
    case 'social':
      return run(
        buildSocial({
          title: payload.title, channel: payload.channel,
          viewCount: payload.viewCount, comments: payload.comments ?? [], language
        }),
        parseSocial
      );
    case 'recommend':
      return run(buildRecommend({ title: payload.title, theme: payload.theme, language }), parseRecommend);
    case 'compose':
      return run(
        buildCompose({
          content: payload.content, factcheck: payload.factcheck,
          social: payload.social, video: payload.video,
          question: payload.question, language
        }),
        parseCompose
      );
    default:
      throw new Error('Bước không hợp lệ: ' + step);
  }
}
