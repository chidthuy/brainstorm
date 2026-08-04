import { Innertube } from 'youtubei.js';
import { fetchTranscript } from './transcript.js';

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

export function parseIsoDuration(iso = '') {
  const m = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0;
}

// YouTube Data API v3 chính thức — hoạt động ổn định từ IP máy chủ (Vercel),
// lấy được metadata + comment mà youtubei.js hay bị chặn.
async function fetchViaDataApi(id, key) {
  const base = 'https://www.googleapis.com/youtube/v3';
  const vRes = await fetch(`${base}/videos?part=snippet,statistics,contentDetails&id=${id}&key=${key}`);
  if (!vRes.ok) throw new Error('YouTube Data API lỗi ' + vRes.status);
  const v = (await vRes.json()).items?.[0];
  if (!v) throw new Error('Video không tồn tại hoặc bị ẩn');

  let comments = [];
  try {
    const cRes = await fetch(
      `${base}/commentThreads?part=snippet&videoId=${id}&order=relevance&maxResults=60&textFormat=plainText&key=${key}`
    );
    if (cRes.ok) {
      comments = ((await cRes.json()).items ?? [])
        .map(it => ({
          text: it.snippet?.topLevelComment?.snippet?.textDisplay ?? '',
          likes: Number(it.snippet?.topLevelComment?.snippet?.likeCount ?? 0)
        }))
        .filter(c => c.text.trim());
    }
  } catch { /* comment tắt hoặc quota — không chặn flow */ }

  return {
    title: v.snippet?.title ?? '(không rõ tiêu đề)',
    channel: v.snippet?.channelTitle ?? '(không rõ kênh)',
    description: capDescription(v.snippet?.description),
    publishedAt: v.snippet?.publishedAt ?? null,
    viewCount: Number(v.statistics?.viewCount ?? 0),
    commentCount: Number(v.statistics?.commentCount ?? 0),
    durationSec: parseIsoDuration(v.contentDetails?.duration),
    comments
  };
}

// Description do TÁC GIẢ tự viết — vừa là nguồn đối chiếu hữu ích, vừa là chỗ
// dễ dẫn dắt/nhồi chỉ thị nhất. Cắt ngắn để không nuốt mất transcript trong
// context và để một description dài bất thường không lấn át bản đọc.
export const MAX_DESCRIPTION_CHARS = 4000;
export function capDescription(text) {
  const s = String(text ?? '').trim();
  if (!s) return '';
  return s.length <= MAX_DESCRIPTION_CHARS
    ? s
    : s.slice(0, MAX_DESCRIPTION_CHARS) + '\n[... phần mô tả còn lại đã cắt ...]';
}

let yt = null;
async function getYt() {
  if (!yt) yt = await Innertube.create({ generate_session_locally: true });
  return yt;
}

export async function fetchVideoData(url) {
  const id = parseVideoId(url);

  // Ưu tiên Data API chính thức cho metadata + comments (nếu có key).
  const apiKey = process.env.YOUTUBE_API_KEY;
  let meta = null;
  if (apiKey) {
    try { meta = await fetchViaDataApi(id, apiKey); } catch { /* fallback youtubei */ }
  }

  // Transcript: thử nhiều đường (android/ios player, trang watch, rồi youtubei.js).
  const viaLibrary = async () => {
    const tube = await getYt();
    const info = await tube.getInfo(id);
    const t = await info.getTranscript();
    const segs = t?.transcript?.content?.body?.initial_segments ?? [];
    return segs
      .map(s => ({ text: s.snippet?.text ?? '', start: Number(s.start_ms ?? 0) }))
      .filter(s => s.text.trim());
  };
  let transcript = null;
  let transcriptSource = null;
  try {
    const got = await fetchTranscript(id, viaLibrary);
    if (got) { transcript = got.segments; transcriptSource = got.source; }
  } catch { /* không lấy được — client sẽ mời dán tay */ }

  // youtubei.js: fallback cho metadata/comments khi không có YOUTUBE_API_KEY.
  let ytMeta = null;
  let ytComments = [];
  if (!meta) try {
    const tube = await getYt();
    const info = await tube.getInfo(id);
    const basic = info.basic_info;
    {
      let viewCount = Number(basic.view_count ?? 0);
      if (!viewCount) {
        const t = info.primary_info?.view_count?.view_count?.text ??
          info.primary_info?.view_count?.text ?? '';
        const digits = String(t).replace(/[^0-9]/g, '');
        if (digits) viewCount = Number(digits);
      }
      ytMeta = {
        title: basic.title ?? info.primary_info?.title?.text ?? '(không rõ tiêu đề)',
        channel: basic.author ?? basic.channel?.name ??
          info.secondary_info?.owner?.author?.name ?? '(không rõ kênh)',
        description: capDescription(
          basic.short_description ?? info.secondary_info?.description?.text ?? ''
        ),
        publishedAt: info.primary_info?.published?.text ?? null,
        durationSec: Number(basic.duration ?? 0),
        viewCount,
        commentCount: 0
      };
      try {
        const c = await tube.getComments(id, 'TOP_COMMENTS');
        ytComments = (c.contents ?? [])
          .map(th => ({
            text: th.comment?.content?.toString() ?? '',
            likes: Number(th.comment?.like_count ?? 0) || 0
          }))
          .filter(x => x.text.trim())
          .slice(0, 60);
      } catch { /* comment tắt hoặc bị chặn */ }
    }
  } catch (err) {
    // youtubei bị chặn hẳn và cũng không có Data API → không có metadata nào.
    if (!transcript) throw err;
  }

  const m = meta ?? ytMeta ?? {
    title: '(không rõ tiêu đề)', channel: '(không rõ kênh)', description: '',
    publishedAt: null, durationSec: 0, viewCount: 0, commentCount: 0
  };
  const comments = meta ? meta.comments : ytComments;
  return {
    id,
    title: m.title,
    channel: m.channel,
    description: m.description ?? '',
    publishedAt: m.publishedAt ?? null,
    durationSec: m.durationSec,
    viewCount: m.viewCount,
    commentCount: m.commentCount || comments.length,
    transcript,
    transcriptSource,
    comments
  };
}
