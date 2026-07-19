import { randomUUID } from 'node:crypto';
import { buildContent, parseContent } from './passes/content.js';
import { buildFactcheck, parseFactcheck } from './passes/factcheck.js';
import { buildSocial, parseSocial } from './passes/social.js';
import { buildCompose, parseCompose, FALLBACK_VERDICT } from './passes/compose.js';

async function runPass(name, build, parse, deps, emit, report) {
  emit('stage', { stage: name });
  try {
    const text = await deps.callClaude(build);
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
  const report = {
    id: randomUUID().replaceAll('-', ''),
    createdAt: new Date().toISOString(),
    video: {
      id: videoData.id, title: videoData.title, channel: videoData.channel,
      durationSec: videoData.durationSec, viewCount: videoData.viewCount
    },
    content: null, factcheck: null, social: null, verdict: null,
    errors: {}
  };

  const transcriptText = videoData.transcriptOverride ??
    (videoData.transcript ? videoData.transcript.map(s => s.text).join(' ') : null);

  let content = null;
  if (!transcriptText) {
    report.errors.content = 'Không có transcript';
    emit('pass', { pass: 'content', ok: false, error: report.errors.content });
  } else {
    content = await runPass('content',
      buildContent({ title: videoData.title, channel: videoData.channel, transcriptText }),
      parseContent, deps, emit, report);
  }

  const jobs = [];
  if (content) {
    jobs.push(runPass('factcheck', buildFactcheck({ content }), parseFactcheck, deps, emit, report));
  }
  jobs.push(runPass('social',
    buildSocial({
      title: videoData.title, channel: videoData.channel,
      viewCount: videoData.viewCount, comments: videoData.comments ?? []
    }),
    parseSocial, deps, emit, report));
  await Promise.allSettled(jobs);

  emit('stage', { stage: 'compose' });
  try {
    const text = await deps.callClaude(buildCompose({
      content: report.content, factcheck: report.factcheck,
      social: report.social, video: report.video
    }));
    report.verdict = parseCompose(text);
  } catch (err) {
    report.errors.compose = String(err.message ?? err);
    report.verdict = FALLBACK_VERDICT;
  }
  emit('pass', { pass: 'verdict', ok: !report.errors.compose, data: report.verdict });
  return report;
}
