import { Innertube } from 'youtubei.js';

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseVideoId(url) {
  const s = url.trim();
  if (ID_RE.test(s)) return s;
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new Error('Không nhận diện được link YouTube');
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let candidate = null;
  if (host === 'youtu.be') {
    candidate = u.pathname.split('/')[1];
  } else if (host === 'youtube.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') candidate = u.searchParams.get('v');
    else if (['shorts', 'live', 'embed'].includes(parts[0])) candidate = parts[1];
  }
  if (candidate && ID_RE.test(candidate)) return candidate;
  throw new Error('Không nhận diện được link YouTube');
}

let yt = null;
async function getYt() {
  if (!yt) yt = await Innertube.create({ generate_session_locally: true });
  return yt;
}

export async function fetchVideoData(url) {
  const id = parseVideoId(url);
  const tube = await getYt();
  const info = await tube.getInfo(id);
  const basic = info.basic_info;

  let transcript = null;
  try {
    const t = await info.getTranscript();
    const segs = t?.transcript?.content?.body?.initial_segments ?? [];
    const mapped = segs
      .map(s => ({ text: s.snippet?.text ?? '', start: Number(s.start_ms ?? 0) }))
      .filter(s => s.text.trim());
    if (mapped.length) transcript = mapped;
  } catch { /* video không có captions */ }

  let comments = [];
  try {
    const c = await tube.getComments(id, 'TOP_COMMENTS');
    comments = (c.contents ?? [])
      .map(th => ({
        text: th.comment?.content?.toString() ?? '',
        likes: Number(th.comment?.like_count ?? 0) || 0
      }))
      .filter(x => x.text.trim())
      .slice(0, 60);
  } catch { /* comment tắt hoặc lỗi */ }

  return {
    id,
    title: basic.title ?? info.primary_info?.title?.text ?? '(không rõ tiêu đề)',
    channel: basic.author ?? basic.channel?.name ??
      info.secondary_info?.owner?.author?.name ?? '(không rõ kênh)',
    durationSec: Number(basic.duration ?? 0),
    viewCount: Number(basic.view_count ?? 0),
    transcript,
    comments
  };
}
