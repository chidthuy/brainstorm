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
