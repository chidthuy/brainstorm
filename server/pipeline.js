import { randomUUID } from 'node:crypto';
import { buildContent, parseContent } from './passes/content.js';
import { buildFactcheck, parseFactcheck } from './passes/factcheck.js';
import { buildSocial, parseSocial } from './passes/social.js';
import { buildRecommend, parseRecommend } from './passes/recommend.js';
import { buildCompose, parseCompose, FALLBACK_SCORE } from './passes/compose.js';

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

// Ghép transcript kèm mốc thời gian để model dựng outline chính xác.
// Cắt bớt nếu quá dài để pipeline không vượt giới hạn thời gian serverless.
const MAX_TRANSCRIPT_CHARS = 150000;
function transcriptWithTimes(segments) {
  const full = segments.map(s => `[${fmtTime(s.start ?? 0)}] ${s.text}`).join('\n');
  if (full.length <= MAX_TRANSCRIPT_CHARS) return full;
  return full.slice(0, MAX_TRANSCRIPT_CHARS) +
    '\n[... transcript quá dài, phần sau đã bị cắt — báo cáo dựa trên phần đầu ...]';
}

async function runPass(name, build, parse, deps, emit, report) {
  emit('stage', { stage: name });
  try {
    const text = await deps.callClaude({ ...build, model: deps.model });
    const data = parse(text);
    report[name] = data;
    emit('pass', { pass: name, ok: true, data });
    return data;
  } catch (err) {
    report.errors[name] = String(err.message ?? err);
    emit('pass', { pass: name, ok: false, error: report.errors[name] });
    return null;
  }
}

export async function runScreening(videoData, deps, emit) {
  const language = deps.language || 'Tiếng Việt';
  const report = {
    id: randomUUID().replaceAll('-', ''),
    createdAt: new Date().toISOString(),
    video: {
      id: videoData.id, title: videoData.title, channel: videoData.channel,
      durationSec: videoData.durationSec, viewCount: videoData.viewCount
    },
    question: videoData.question || null,
    language,
    content: null, factcheck: null, social: null, recommend: null, score: null,
    errors: {}
  };

  const transcriptText = videoData.transcriptOverride ??
    (videoData.transcript ? transcriptWithTimes(videoData.transcript) : null);

  let content = null;
  if (!transcriptText) {
    report.errors.content = 'Không có transcript';
    emit('pass', { pass: 'content', ok: false, error: report.errors.content });
  } else {
    content = await runPass('content',
      buildContent({
        title: videoData.title, channel: videoData.channel,
        transcriptText, question: videoData.question, language
      }),
      parseContent, deps, emit, report);
  }

  const jobs = [];
  if (content) {
    jobs.push(runPass('factcheck', buildFactcheck({ content, language }), parseFactcheck, deps, emit, report));
    jobs.push(runPass('recommend',
      buildRecommend({ title: videoData.title, theme: content.summary?.theme ?? videoData.title, language }),
      parseRecommend, deps, emit, report));
  }
  jobs.push(runPass('social',
    buildSocial({
      title: videoData.title, channel: videoData.channel,
      viewCount: videoData.viewCount, comments: videoData.comments ?? [], language
    }),
    parseSocial, deps, emit, report));
  await Promise.allSettled(jobs);

  emit('stage', { stage: 'compose' });
  try {
    const text = await deps.callClaude({
      ...buildCompose({
        content: report.content, factcheck: report.factcheck,
        social: report.social, video: report.video, language
      }),
      model: deps.model
    });
    report.score = parseCompose(text);
  } catch (err) {
    report.errors.compose = String(err.message ?? err);
    report.score = FALLBACK_SCORE;
  }
  emit('pass', { pass: 'score', ok: !report.errors.compose, data: report.score });
  return report;
}
