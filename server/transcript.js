// Lấy phụ đề YouTube bằng NHIỀU đường khác nhau. Máy chủ (Vercel) dùng IP trung
// tâm dữ liệu nên hay bị YouTube chặn ở một số đường — thử lần lượt cho tới khi
// được. Các hàm parse là hàm thuần (test không cần mạng).

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ANDROID_UA = 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip';
const IOS_UA = 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)';

const TIMEOUT_MS = 20000;
function get(url, headers = {}) {
  return fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

// ---------- parse helpers (thuần) ----------

const NAMED = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'" };

export function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (m) => NAMED[m] ?? m);
}

// Định dạng json3: {events:[{tStartMs, segs:[{utf8}]}]}
export function parseJson3(data) {
  const out = [];
  for (const e of data?.events ?? []) {
    if (!Array.isArray(e.segs)) continue;
    const text = e.segs.map(s => s.utf8 ?? '').join('').replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, start: Number(e.tStartMs ?? 0) });
  }
  return out;
}

// Định dạng XML cũ: <text start="12.5" dur="3">nội dung</text>
export function parseXmlCaptions(xml) {
  const out = [];
  const re = /<text[^>]*\bstart="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = re.exec(xml))) {
    const raw = m[2].replace(/<[^>]+>/g, '');
    const text = decodeEntities(decodeEntities(raw)).replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, start: Math.round(Number(m[1]) * 1000) });
  }
  return out;
}

// Cắt mảng captionTracks ra khỏi HTML trang watch (quét ngoặc cân bằng cho an toàn).
export function extractCaptionTracks(html) {
  const i = html.indexOf('"captionTracks":');
  if (i === -1) return [];
  const start = html.indexOf('[', i);
  if (start === -1) return [];
  let depth = 0, inStr = false, esc = false;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) {
      try { return JSON.parse(html.slice(start, j + 1)); } catch { return []; }
    }
  }
  return [];
}

// Ưu tiên phụ đề người làm (manual) hơn phụ đề tự động (asr); ngôn ngữ chỉ là tiêu chí phụ.
export function pickTrack(tracks, prefer = ['vi', 'en']) {
  if (!Array.isArray(tracks) || !tracks.length) return null;
  const score = (t) => {
    const idx = prefer.indexOf(String(t.languageCode ?? '').toLowerCase());
    return (t.kind === 'asr' ? 0 : 10) + (idx === -1 ? 0 : prefer.length - idx);
  };
  return [...tracks].sort((a, b) => score(b) - score(a))[0];
}

// ---------- tải nội dung một track ----------

async function fetchTrack(baseUrl) {
  const sep = baseUrl.includes('?') ? '&' : '?';
  try {
    const r = await get(baseUrl + sep + 'fmt=json3', { 'User-Agent': DESKTOP_UA });
    if (r.ok) {
      const segs = parseJson3(await r.json());
      if (segs.length) return segs;
    }
  } catch { /* thử XML */ }
  try {
    const r = await get(baseUrl, { 'User-Agent': DESKTOP_UA });
    if (r.ok) {
      const segs = parseXmlCaptions(await r.text());
      if (segs.length) return segs;
    }
  } catch { /* hết cách cho track này */ }
  return null;
}

// ---------- các đường lấy phụ đề ----------

// 1) Gọi endpoint player nội bộ với client di động — đường ít bị chặn nhất.
async function viaInnertube(id, client) {
  const cfg = client === 'IOS'
    ? { clientName: 'IOS', clientVersion: '19.09.3', ua: IOS_UA, num: '5' }
    : { clientName: 'ANDROID', clientVersion: '19.09.37', ua: ANDROID_UA, num: '3', androidSdkVersion: 30 };
  const body = {
    context: {
      client: {
        clientName: cfg.clientName, clientVersion: cfg.clientVersion,
        hl: 'en', gl: 'US',
        ...(cfg.androidSdkVersion ? { androidSdkVersion: cfg.androidSdkVersion } : {})
      }
    },
    videoId: id, contentCheckOk: true, racyCheckOk: true
  };
  const r = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': cfg.ua,
      'X-Youtube-Client-Name': cfg.num,
      'X-Youtube-Client-Version': cfg.clientVersion
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!r.ok) return null;
  const data = await r.json();
  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  const track = pickTrack(tracks);
  return track?.baseUrl ? fetchTrack(track.baseUrl) : null;
}

// 2) Tải HTML trang watch rồi bóc captionTracks.
async function viaWatchPage(id) {
  const r = await get(`https://www.youtube.com/watch?v=${id}&hl=en&bpctr=9999999999&has_verified=1`, {
    'User-Agent': DESKTOP_UA,
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8'
  });
  if (!r.ok) return null;
  const track = pickTrack(extractCaptionTracks(await r.text()));
  return track?.baseUrl ? fetchTrack(decodeEntities(track.baseUrl).replace(/\\u0026/g, '&')) : null;
}

/**
 * Thử lần lượt mọi đường. Trả về { segments, source } hoặc null.
 * `viaLibrary` là hàm bất đồng bộ dùng youtubei.js (truyền từ ingest để tránh vòng lặp import).
 */
export async function fetchTranscript(id, viaLibrary) {
  const strategies = [
    ['android', () => viaInnertube(id, 'ANDROID')],
    ['ios', () => viaInnertube(id, 'IOS')],
    ['watch-page', () => viaWatchPage(id)],
    ...(viaLibrary ? [['youtubei', viaLibrary]] : [])
  ];
  for (const [source, run] of strategies) {
    try {
      const segments = await run();
      if (segments && segments.length) return { segments, source };
    } catch { /* thử đường kế tiếp */ }
  }
  return null;
}
