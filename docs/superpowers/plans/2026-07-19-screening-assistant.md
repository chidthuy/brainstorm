# Screening Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app local-first: dán link YouTube → báo cáo screening 4 lớp (tóm tắt, facts/stance, fact-check, social signals) + verdict WATCH/SKIM/SKIP.

**Architecture:** Express server (Node 20+, ESM) phục vụ frontend tĩnh một trang. Ingest qua youtubei.js (không cần API key). Pipeline 3 pass Claude API (content → factcheck ∥ social) + compose verdict, stream tiến độ qua SSE. Lưu báo cáo JSON trong `data/`.

**Tech Stack:** express, youtubei.js, @anthropic-ai/sdk, dotenv; vitest (dev). Frontend HTML/CSS/JS thuần, không build step.

## Global Constraints

- Node.js >= 20, `"type": "module"` (ESM) toàn bộ.
- Model mặc định `claude-sonnet-5`, override bằng env `ANTHROPIC_MODEL`.
- `ANTHROPIC_API_KEY` chỉ đọc từ env/.env — không hardcode, không log.
- `data/` và `.env` phải nằm trong `.gitignore`.
- Mỗi pass lỗi không được giết pipeline: ghi vào `report.errors.<pass>`, các phần khác vẫn chạy. Chỉ ingest fail là fatal.
- Fact-check dùng server tool `web_search_20250305` của Claude API.
- Fallback verdict khi compose fail: `{ verdict: "SKIM", confidence: "low", reasons: ["Verdict không khả dụng — compose pass lỗi."] }`.

---

### Task 1: Scaffold + parse YouTube URL

**Files:**
- Create: `package.json`, `.gitignore`, `.env.example`, `server/ingest.js`
- Test: `tests/parse-url.test.js`

**Interfaces:**
- Produces: `parseVideoId(url: string): string` — trả về videoId 11 ký tự, throw `Error('Không nhận diện được link YouTube')` nếu không parse được.

- [ ] **Step 1: Scaffold project**

`package.json`:
```json
{
  "name": "screening-assistant",
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "start": "node server/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "dotenv": "^16.4.0",
    "express": "^4.19.0",
    "youtubei.js": "^10.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

`.gitignore`:
```
node_modules/
data/
.env
```

`.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-sonnet-5
# PORT=3000
```

Run: `npm install` — Expected: cài xong không lỗi.

- [ ] **Step 2: Write failing test**

`tests/parse-url.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { parseVideoId } from '../server/ingest.js';

describe('parseVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ?feature=share', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ']
  ])('parses %s', (url, id) => {
    expect(parseVideoId(url)).toBe(id);
  });

  it('throws on garbage', () => {
    expect(() => parseVideoId('https://example.com/abc')).toThrow('Không nhận diện được link YouTube');
    expect(() => parseVideoId('not a url')).toThrow();
  });
});
```

- [ ] **Step 3: Run test, verify FAIL** — `npx vitest run tests/parse-url.test.js` → FAIL (module không tồn tại).

- [ ] **Step 4: Implement**

`server/ingest.js`:
```js
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
```

- [ ] **Step 5: Run test, verify PASS** — `npx vitest run tests/parse-url.test.js` → PASS.

- [ ] **Step 6: Commit** — `git add package.json package-lock.json .gitignore .env.example server tests && git commit -m "feat: scaffold + parse YouTube URL"`

---

### Task 2: Store — lưu và đọc báo cáo

**Files:**
- Create: `server/store.js`
- Test: `tests/store.test.js`

**Interfaces:**
- Produces:
  - `saveReport(report: object, dataDir?: string): Promise<void>` — ghi `data/<report.id>.json` và cập nhật `data/index.json`.
  - `getReport(id: string, dataDir?: string): Promise<object|null>`
  - `listReports(dataDir?: string): Promise<Array<{id, createdAt, title, verdict}>>` — mới nhất trước.

- [ ] **Step 1: Write failing test**

`tests/store.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveReport, getReport, listReports } from '../server/store.js';

let dir;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'store-')); });

const mk = (id, title, createdAt) => ({
  id, createdAt,
  video: { title },
  verdict: { verdict: 'WATCH', confidence: 'high', reasons: [] }
});

describe('store', () => {
  it('round-trips a report', async () => {
    await saveReport(mk('abc', 'Video A', '2026-07-19T00:00:00Z'), dir);
    const got = await getReport('abc', dir);
    expect(got.video.title).toBe('Video A');
  });

  it('returns null for missing report', async () => {
    expect(await getReport('nope', dir)).toBeNull();
  });

  it('lists newest first with summary fields', async () => {
    await saveReport(mk('a', 'Old', '2026-07-18T00:00:00Z'), dir);
    await saveReport(mk('b', 'New', '2026-07-19T00:00:00Z'), dir);
    const list = await listReports(dir);
    expect(list.map(r => r.id)).toEqual(['b', 'a']);
    expect(list[0]).toMatchObject({ title: 'New', verdict: 'WATCH' });
  });

  it('rejects path-traversal ids', async () => {
    expect(await getReport('../etc/passwd', dir)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run tests/store.test.js` → FAIL.

- [ ] **Step 3: Implement**

`server/store.js`:
```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_DIR = join(process.cwd(), 'data');
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

async function readIndex(dir) {
  try {
    return JSON.parse(await readFile(join(dir, 'index.json'), 'utf8'));
  } catch {
    return [];
  }
}

export async function saveReport(report, dataDir = DEFAULT_DIR) {
  if (!SAFE_ID.test(report.id)) throw new Error('invalid report id');
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, `${report.id}.json`), JSON.stringify(report, null, 2));
  const index = (await readIndex(dataDir)).filter(e => e.id !== report.id);
  index.push({
    id: report.id,
    createdAt: report.createdAt,
    title: report.video?.title ?? '(không rõ tiêu đề)',
    verdict: report.verdict?.verdict ?? null
  });
  index.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await writeFile(join(dataDir, 'index.json'), JSON.stringify(index, null, 2));
}

export async function getReport(id, dataDir = DEFAULT_DIR) {
  if (!SAFE_ID.test(id)) return null;
  try {
    return JSON.parse(await readFile(join(dataDir, `${id}.json`), 'utf8'));
  } catch {
    return null;
  }
}

export async function listReports(dataDir = DEFAULT_DIR) {
  return readIndex(dataDir);
}
```

- [ ] **Step 4: Run, verify PASS** — `npx vitest run tests/store.test.js` → PASS.

- [ ] **Step 5: Commit** — `git add server/store.js tests/store.test.js && git commit -m "feat: JSON report store"`

---

### Task 3: Claude client + 4 pass builders/parsers

**Files:**
- Create: `server/claude.js`, `server/passes/content.js`, `server/passes/factcheck.js`, `server/passes/social.js`, `server/passes/compose.js`
- Test: `tests/passes.test.js`

**Interfaces:**
- Produces (dùng bởi Task 4 pipeline):
  - `claude.js`: `callClaude({system, messages, tools?, maxTokens?}): Promise<string>` (ghép các text block); `extractJson(text): object` — lấy JSON object đầu tiên trong text, throw nếu không có.
  - Mỗi pass module X export: `buildX(input): {system, messages, tools?}` và `parseX(text): object` (validate, throw nếu thiếu field).
  - `content.js`: `buildContent({ title, channel, transcriptText })` / `parseContent` → `{ summary, structure: [{heading, gist, timestamp?}], facts: string[], stance: string[] }`
  - `factcheck.js`: `buildFactcheck({ content })` (kèm `tools: [{type:'web_search_20250305', name:'web_search', max_uses:5}]`) / `parseFactcheck` → `{ claims: [{claim, verdict, note, sources: string[]}] }`, verdict ∈ supported|contradicted|unverifiable.
  - `social.js`: `buildSocial({ title, channel, viewCount, comments })` (kèm web_search tool, max_uses 3) / `parseSocial` → `{ commentQuality: string, audienceProfile: string, buzz: string, dataGaps: string[] }`
  - `compose.js`: `buildCompose({ content, factcheck, social, video })` / `parseCompose` → `{ verdict: 'WATCH'|'SKIM'|'SKIP', confidence: 'low'|'medium'|'high', reasons: string[] }`; export `FALLBACK_VERDICT` đúng theo Global Constraints.

- [ ] **Step 1: Write failing tests**

`tests/passes.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { extractJson } from '../server/claude.js';
import { buildContent, parseContent } from '../server/passes/content.js';
import { buildFactcheck, parseFactcheck } from '../server/passes/factcheck.js';
import { buildSocial, parseSocial } from '../server/passes/social.js';
import { buildCompose, parseCompose, FALLBACK_VERDICT } from '../server/passes/compose.js';

describe('extractJson', () => {
  it('pulls JSON out of chatter', () => {
    expect(extractJson('Here you go:\n{"a": 1}\nDone.')).toEqual({ a: 1 });
  });
  it('throws when no JSON', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

describe('content pass', () => {
  it('build includes transcript and asks for JSON', () => {
    const req = buildContent({ title: 'T', channel: 'C', transcriptText: 'xin chào' });
    const all = JSON.stringify(req.messages) + req.system;
    expect(all).toContain('xin chào');
    expect(all).toContain('JSON');
  });
  it('parse validates shape', () => {
    const good = { summary: 's', structure: [{ heading: 'h', gist: 'g' }], facts: ['f'], stance: ['q'] };
    expect(parseContent(JSON.stringify(good))).toEqual(good);
    expect(() => parseContent('{"summary": "s"}')).toThrow();
  });
});

describe('factcheck pass', () => {
  it('build attaches web_search tool', () => {
    const req = buildFactcheck({ content: { summary: 's', facts: ['claim 1'], stance: [] } });
    expect(req.tools[0].type).toBe('web_search_20250305');
  });
  it('parse validates verdict enum', () => {
    const good = { claims: [{ claim: 'c', verdict: 'supported', note: 'n', sources: ['http://x'] }] };
    expect(parseFactcheck(JSON.stringify(good))).toEqual(good);
    expect(() => parseFactcheck(JSON.stringify({ claims: [{ claim: 'c', verdict: 'maybe', note: '', sources: [] }] }))).toThrow();
  });
});

describe('social pass', () => {
  it('build includes comments', () => {
    const req = buildSocial({ title: 'T', channel: 'C', viewCount: 9, comments: [{ text: 'bình luận sâu', likes: 3 }] });
    expect(JSON.stringify(req.messages)).toContain('bình luận sâu');
  });
  it('parse validates shape', () => {
    const good = { commentQuality: 'a', audienceProfile: 'b', buzz: 'c', dataGaps: [] };
    expect(parseSocial(JSON.stringify(good))).toEqual(good);
    expect(() => parseSocial('{}')).toThrow();
  });
});

describe('compose pass', () => {
  it('parse validates verdict enum', () => {
    const good = { verdict: 'WATCH', confidence: 'high', reasons: ['r'] };
    expect(parseCompose(JSON.stringify(good))).toEqual(good);
    expect(() => parseCompose(JSON.stringify({ verdict: 'MAYBE', confidence: 'high', reasons: [] }))).toThrow();
  });
  it('fallback matches spec', () => {
    expect(FALLBACK_VERDICT).toEqual({
      verdict: 'SKIM', confidence: 'low',
      reasons: ['Verdict không khả dụng — compose pass lỗi.']
    });
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run tests/passes.test.js` → FAIL.

- [ ] **Step 3: Implement claude.js**

`server/claude.js`:
```js
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
```

- [ ] **Step 4: Implement pass modules**

`server/passes/content.js`:
```js
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
```

`server/passes/factcheck.js`:
```js
import { extractJson } from '../claude.js';

const VERDICTS = ['supported', 'contradicted', 'unverifiable'];

export function buildFactcheck({ content }) {
  return {
    system:
      'Bạn là fact-checker. Chọn tối đa 5 claim quan trọng nhất từ danh sách facts, ' +
      'dùng web search để kiểm chứng từng claim. Trả lời DUY NHẤT một JSON object: ' +
      '{"claims": [{"claim": string, "verdict": "supported"|"contradicted"|"unverifiable", ' +
      '"note": string, "sources": [string]}]}. Viết tiếng Việt, sources là URL.',
    messages: [{
      role: 'user',
      content: `Tóm tắt video: ${content.summary}\n\nFacts cần kiểm chứng:\n` +
        content.facts.map((f, i) => `${i + 1}. ${f}`).join('\n')
    }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }]
  };
}

export function parseFactcheck(text) {
  const o = extractJson(text);
  if (!Array.isArray(o.claims)) throw new Error('Factcheck pass: output sai schema');
  for (const c of o.claims) {
    if (typeof c.claim !== 'string' || !VERDICTS.includes(c.verdict) ||
        typeof c.note !== 'string' || !Array.isArray(c.sources)) {
      throw new Error('Factcheck pass: claim sai schema');
    }
  }
  return o;
}
```

`server/passes/social.js`:
```js
import { extractJson } from '../claude.js';

export function buildSocial({ title, channel, viewCount, comments }) {
  const commentBlock = comments.length
    ? comments.map(c => `[${c.likes} likes] ${c.text}`).join('\n')
    : '(không lấy được comment)';
  return {
    system:
      'Bạn phân tích social signals quanh một video. Audience quality là proxy cho content quality. ' +
      'Đánh giá: (1) chất lượng comment — sâu sắc hay cảm thán, (2) chân dung người comment — ' +
      'practitioner thật hay khán giả đại trà, (3) buzz — video/kênh được nhắc ở đâu, bối cảnh nào (dùng web search nếu cần). ' +
      'Trả lời DUY NHẤT một JSON object: {"commentQuality": string, "audienceProfile": string, ' +
      '"buzz": string, "dataGaps": [string]}. Ghi vào dataGaps những dữ liệu bị thiếu. Viết tiếng Việt.',
    messages: [{
      role: 'user',
      content: `Video: "${title}" — kênh ${channel} — ${viewCount} views\n\nTop comments:\n${commentBlock}`
    }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }]
  };
}

export function parseSocial(text) {
  const o = extractJson(text);
  if (typeof o.commentQuality !== 'string' || typeof o.audienceProfile !== 'string' ||
      typeof o.buzz !== 'string' || !Array.isArray(o.dataGaps)) {
    throw new Error('Social pass: output sai schema');
  }
  return o;
}
```

`server/passes/compose.js`:
```js
import { extractJson } from '../claude.js';

const VERDICTS = ['WATCH', 'SKIM', 'SKIP'];
const CONFIDENCES = ['low', 'medium', 'high'];

export const FALLBACK_VERDICT = {
  verdict: 'SKIM',
  confidence: 'low',
  reasons: ['Verdict không khả dụng — compose pass lỗi.']
};

export function buildCompose({ content, factcheck, social, video }) {
  return {
    system:
      'Bạn ra verdict screening cho một video dài. Verdict giúp người dùng QUYẾT ĐỊNH có xem trọn không — ' +
      'không thay thế việc xem. WATCH = đáng đầu tư nghe trọn; SKIM = xem lướt vài phần; SKIP = bỏ qua. ' +
      'Trả lời DUY NHẤT một JSON object: {"verdict": "WATCH"|"SKIM"|"SKIP", ' +
      '"confidence": "low"|"medium"|"high", "reasons": [string]} với 2-3 reasons ngắn. Viết tiếng Việt.',
    messages: [{
      role: 'user',
      content:
        `Video: "${video.title}" (${Math.round((video.durationSec ?? 0) / 60)} phút)\n\n` +
        `Tóm tắt: ${content?.summary ?? '(content pass lỗi)'}\n\n` +
        `Fact-check: ${JSON.stringify(factcheck?.claims ?? 'lỗi')}\n\n` +
        `Social: ${JSON.stringify(social ?? 'lỗi')}`
    }]
  };
}

export function parseCompose(text) {
  const o = extractJson(text);
  if (!VERDICTS.includes(o.verdict) || !CONFIDENCES.includes(o.confidence) || !Array.isArray(o.reasons)) {
    throw new Error('Compose pass: output sai schema');
  }
  return o;
}
```

- [ ] **Step 5: Run, verify PASS** — `npx vitest run tests/passes.test.js` → PASS.

- [ ] **Step 6: Commit** — `git add server/claude.js server/passes tests/passes.test.js && git commit -m "feat: Claude client + 4 screening passes"`

---

### Task 4: Pipeline orchestrator

**Files:**
- Create: `server/pipeline.js`
- Test: `tests/pipeline.test.js`

**Interfaces:**
- Consumes: pass builders/parsers (Task 3), `FALLBACK_VERDICT`.
- Produces: `runScreening(videoData, deps, emit): Promise<report>` trong đó:
  - `videoData`: `{ id, title, channel, durationSec, viewCount, transcript: [{text,start}]|null, transcriptOverride?: string, comments: [{text,likes}] }`
  - `deps`: `{ callClaude }` (inject để test không cần mạng)
  - `emit(event: string, payload: object)` — gọi với `('stage', {stage})` khi bắt đầu mỗi bước và `('pass', {pass, ok, data|error})` khi xong.
  - `report`: `{ id, createdAt, video: {id,title,channel,durationSec,viewCount}, content, factcheck, social, verdict, errors: {content?, factcheck?, social?, compose?} }`
  - Thứ tự: content trước; factcheck + social chạy song song (`Promise.allSettled`); compose cuối. Content fail → skip factcheck (không có facts), social vẫn chạy, verdict vẫn compose từ phần còn lại.
  - Transcript text = `transcriptOverride` nếu có, ngược lại ghép `transcript[].text`. Không có cả hai → `errors.content = 'Không có transcript'`, skip content + factcheck.

- [ ] **Step 1: Write failing test**

`tests/pipeline.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { runScreening } from '../server/pipeline.js';
import { FALLBACK_VERDICT } from '../server/passes/compose.js';

const video = {
  id: 'abc12345678', title: 'T', channel: 'C', durationSec: 3600, viewCount: 100,
  transcript: [{ text: 'hello', start: 0 }],
  comments: [{ text: 'great', likes: 1 }]
};

const CONTENT = { summary: 's', structure: [], facts: ['f1'], stance: [] };
const FACTCHECK = { claims: [{ claim: 'f1', verdict: 'supported', note: '', sources: [] }] };
const SOCIAL = { commentQuality: 'a', audienceProfile: 'b', buzz: 'c', dataGaps: [] };
const VERDICT = { verdict: 'WATCH', confidence: 'high', reasons: ['r'] };

function fakeClaude(byPass) {
  return async ({ system }) => {
    if (system.includes('screening video')) return byPass.content ?? JSON.stringify(CONTENT);
    if (system.includes('fact-checker')) return byPass.factcheck ?? JSON.stringify(FACTCHECK);
    if (system.includes('social signals')) return byPass.social ?? JSON.stringify(SOCIAL);
    if (system.includes('verdict screening')) return byPass.compose ?? JSON.stringify(VERDICT);
    throw new Error('unknown pass: ' + system.slice(0, 40));
  };
}

describe('runScreening', () => {
  it('happy path fills all sections and emits stages', async () => {
    const events = [];
    const report = await runScreening(video, { callClaude: fakeClaude({}) },
      (e, p) => events.push([e, p]));
    expect(report.content).toEqual(CONTENT);
    expect(report.factcheck).toEqual(FACTCHECK);
    expect(report.social).toEqual(SOCIAL);
    expect(report.verdict).toEqual(VERDICT);
    expect(report.errors).toEqual({});
    expect(events.some(([e, p]) => e === 'stage' && p.stage === 'content')).toBe(true);
  });

  it('content failure skips factcheck but social + verdict still run', async () => {
    const report = await runScreening(video,
      { callClaude: fakeClaude({ content: 'not json at all' }) }, () => {});
    expect(report.content).toBeNull();
    expect(report.errors.content).toBeTruthy();
    expect(report.factcheck).toBeNull();
    expect(report.social).toEqual(SOCIAL);
    expect(report.verdict).toEqual(VERDICT);
  });

  it('compose failure falls back to FALLBACK_VERDICT', async () => {
    const report = await runScreening(video,
      { callClaude: fakeClaude({ compose: 'garbage' }) }, () => {});
    expect(report.verdict).toEqual(FALLBACK_VERDICT);
    expect(report.errors.compose).toBeTruthy();
  });

  it('no transcript → content error, social still runs', async () => {
    const report = await runScreening({ ...video, transcript: null },
      { callClaude: fakeClaude({}) }, () => {});
    expect(report.errors.content).toBe('Không có transcript');
    expect(report.social).toEqual(SOCIAL);
  });

  it('transcriptOverride wins over missing transcript', async () => {
    const report = await runScreening({ ...video, transcript: null, transcriptOverride: 'pasted' },
      { callClaude: fakeClaude({}) }, () => {});
    expect(report.content).toEqual(CONTENT);
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run tests/pipeline.test.js` → FAIL.

- [ ] **Step 3: Implement**

`server/pipeline.js`:
```js
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
```

- [ ] **Step 4: Run, verify PASS** — `npx vitest run tests/pipeline.test.js` → PASS. Chạy cả suite: `npm test` → PASS toàn bộ.

- [ ] **Step 5: Commit** — `git add server/pipeline.js tests/pipeline.test.js && git commit -m "feat: screening pipeline orchestrator"`

---

### Task 5: Ingest YouTube data (youtubei.js)

**Files:**
- Modify: `server/ingest.js` (thêm `fetchVideoData`)

**Interfaces:**
- Consumes: `parseVideoId` (Task 1).
- Produces: `fetchVideoData(url: string): Promise<videoData>` — shape đúng như pipeline cần (Task 4). Transcript null nếu video không có captions; comments `[]` nếu tắt. Throw nếu video không tồn tại/private.

Lưu ý: hàm này phụ thuộc mạng + YouTube nên KHÔNG unit test; đã cô lập sau interface để pipeline test được bằng fake. Verify thủ công ở Task 7.

- [ ] **Step 1: Implement**

Thêm vào cuối `server/ingest.js`:
```js
import { Innertube } from 'youtubei.js';

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
    title: basic.title ?? '(không rõ tiêu đề)',
    channel: basic.author ?? '(không rõ kênh)',
    durationSec: Number(basic.duration ?? 0),
    viewCount: Number(basic.view_count ?? 0),
    transcript,
    comments
  };
}
```

- [ ] **Step 2: Chạy `npm test`** — Expected: toàn bộ suite vẫn PASS (không test mới).

- [ ] **Step 3: Commit** — `git add server/ingest.js && git commit -m "feat: fetch YouTube metadata/transcript/comments via youtubei.js"`

---

### Task 6: Express server + SSE

**Files:**
- Create: `server/index.js`, `server/jobs.js`
- Test: `tests/jobs.test.js`

**Interfaces:**
- Consumes: `fetchVideoData`, `runScreening`, `callClaude`, store.
- Produces HTTP API:
  - `POST /api/screen` body `{url, transcriptOverride?}` → `202 {jobId}`; ingest fail → `400 {error}`.
  - `GET /api/screen/:jobId/events` — SSE; replay các event đã buffer rồi stream tiếp; event cuối `done {reportId}` hoặc `fatal {error}`.
  - `GET /api/reports` → index; `GET /api/reports/:id` → full report hoặc 404.
  - Static: `express.static('public')`.
- `jobs.js`: `createJob(): {id, emit, subscribe(res), finish(event, payload)}` — buffer events, phát lại cho subscriber đến muộn.

- [ ] **Step 1: Write failing test cho jobs buffer**

`tests/jobs.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { createJob, getJob } from '../server/jobs.js';

function fakeRes() {
  const chunks = [];
  return {
    chunks,
    setHeader() {}, flushHeaders() {},
    write(s) { chunks.push(s); },
    on() {}
  };
}

describe('jobs', () => {
  it('replays buffered events to late subscriber', () => {
    const job = createJob();
    job.emit('stage', { stage: 'content' });
    const res = fakeRes();
    job.subscribe(res);
    expect(res.chunks.join('')).toContain('"stage":"content"');
  });

  it('streams new events to existing subscriber and marks done', () => {
    const job = createJob();
    const res = fakeRes();
    job.subscribe(res);
    job.finish('done', { reportId: 'r1' });
    expect(res.chunks.join('')).toContain('"reportId":"r1"');
    expect(getJob(job.id).finished).toBe(true);
  });

  it('getJob returns undefined for unknown id', () => {
    expect(getJob('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run tests/jobs.test.js` → FAIL.

- [ ] **Step 3: Implement jobs.js**

`server/jobs.js`:
```js
import { randomUUID } from 'node:crypto';

const jobs = new Map();

export function createJob() {
  const id = randomUUID().replaceAll('-', '');
  const job = {
    id,
    buffer: [],
    subscribers: new Set(),
    finished: false,
    emit(event, payload) {
      const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
      this.buffer.push(frame);
      for (const res of this.subscribers) res.write(frame);
    },
    subscribe(res) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders();
      for (const frame of this.buffer) res.write(frame);
      if (!this.finished) {
        this.subscribers.add(res);
        res.on('close', () => this.subscribers.delete(res));
      }
    },
    finish(event, payload) {
      this.emit(event, payload);
      this.finished = true;
      this.subscribers.clear();
      setTimeout(() => jobs.delete(id), 10 * 60 * 1000).unref?.();
    }
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id) {
  return jobs.get(id);
}
```

- [ ] **Step 4: Run, verify PASS** — `npx vitest run tests/jobs.test.js` → PASS.

- [ ] **Step 5: Implement server entry**

`server/index.js`:
```js
import 'dotenv/config';
import express from 'express';
import { fetchVideoData } from './ingest.js';
import { runScreening } from './pipeline.js';
import { callClaude } from './claude.js';
import { saveReport, getReport, listReports } from './store.js';
import { createJob, getJob } from './jobs.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

app.post('/api/screen', async (req, res) => {
  const { url, transcriptOverride } = req.body ?? {};
  if (!url) return res.status(400).json({ error: 'Thiếu url' });

  let videoData;
  try {
    videoData = await fetchVideoData(url);
  } catch (err) {
    return res.status(400).json({ error: `Không lấy được video: ${err.message}` });
  }
  if (transcriptOverride) videoData.transcriptOverride = transcriptOverride;

  const job = createJob();
  res.status(202).json({ jobId: job.id, video: videoData, hasTranscript: !!videoData.transcript });

  (async () => {
    try {
      const report = await runScreening(videoData, { callClaude }, (e, p) => job.emit(e, p));
      await saveReport(report);
      job.finish('done', { reportId: report.id });
    } catch (err) {
      job.finish('fatal', { error: String(err.message ?? err) });
    }
  })();
});

app.get('/api/screen/:jobId/events', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job không tồn tại' });
  job.subscribe(res);
});

app.get('/api/reports', async (_req, res) => res.json(await listReports()));

app.get('/api/reports/:id', async (req, res) => {
  const report = await getReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
  res.json(report);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Screening Assistant: http://localhost:${port}`));
```

- [ ] **Step 6: Smoke test** — `node --check server/index.js` → không lỗi syntax; `npm test` → PASS toàn bộ.

- [ ] **Step 7: Commit** — `git add server/index.js server/jobs.js tests/jobs.test.js && git commit -m "feat: Express server with SSE screening API"`

---

### Task 7: Frontend một trang

**Files:**
- Create: `public/index.html`, `public/style.css`, `public/app.js`

**Interfaces:**
- Consumes: HTTP API Task 6 (đúng event names: `stage`, `pass`, `done`, `fatal`; pass names: `content`, `factcheck`, `social`, `verdict`).

UI gồm: header + form dán link, ô dán transcript (ẩn, hiện khi `hasTranscript=false`), progress steps, 5 khối báo cáo (verdict card, tóm tắt, facts/stance 2 cột, fact-check, social), sidebar lịch sử. Client render thuần DOM (không innerHTML với dữ liệu model — dùng `textContent` để tránh XSS từ nội dung video/comment).

- [ ] **Step 1: Implement 3 file** (code đầy đủ — xem các khối dưới)

`public/index.html`:
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Screening Assistant</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <aside id="sidebar">
    <h2>Lịch sử</h2>
    <ul id="history"></ul>
  </aside>
  <main>
    <h1>Screening Assistant</h1>
    <p class="tagline">Quyết định "có đáng xem 2 tiếng không" trong 2 phút.</p>
    <form id="screen-form">
      <input id="url" type="text" placeholder="Dán link YouTube..." required>
      <button type="submit" id="go">Screen</button>
    </form>
    <div id="transcript-box" hidden>
      <p>Video này không có captions. Dán transcript vào đây rồi bấm Screen lại:</p>
      <textarea id="transcript" rows="6"></textarea>
    </div>
    <ol id="progress" hidden>
      <li data-stage="ingest">Lấy dữ liệu video</li>
      <li data-stage="content">Tóm tắt + facts/stance</li>
      <li data-stage="factcheck">Fact-check</li>
      <li data-stage="social">Social signals</li>
      <li data-stage="compose">Verdict</li>
    </ol>
    <div id="error" class="error" hidden></div>
    <section id="report" hidden>
      <div id="verdict-card"></div>
      <details open><summary>Tóm tắt nội dung</summary><div id="sec-content"></div></details>
      <details open><summary>Facts vs. Stance</summary><div id="sec-facts"></div></details>
      <details open><summary>Fact-check</summary><div id="sec-factcheck"></div></details>
      <details open><summary>Social signals</summary><div id="sec-social"></div></details>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

`public/style.css`:
```css
:root {
  --bg: #101418; --panel: #1a2027; --text: #e6e9ec; --muted: #8b949e;
  --accent: #4da3ff; --ok: #3fb950; --warn: #d29922; --bad: #f85149;
  font-size: 15px;
}
* { box-sizing: border-box; }
body {
  margin: 0; display: flex; min-height: 100vh; color: var(--text);
  background: var(--bg); font-family: system-ui, sans-serif;
}
#sidebar { width: 240px; padding: 1rem; background: var(--panel); flex-shrink: 0; }
#sidebar h2 { margin-top: 0; font-size: 1rem; color: var(--muted); }
#history { list-style: none; padding: 0; margin: 0; }
#history li { padding: .4rem 0; cursor: pointer; border-bottom: 1px solid #2a313a; }
#history li:hover { color: var(--accent); }
#history .v { font-size: .75rem; margin-right: .4rem; }
main { flex: 1; max-width: 860px; padding: 2rem; }
h1 { margin-bottom: .2rem; }
.tagline { color: var(--muted); margin-top: 0; }
#screen-form { display: flex; gap: .5rem; margin: 1rem 0; }
#url { flex: 1; padding: .6rem; border-radius: 6px; border: 1px solid #2a313a; background: var(--panel); color: var(--text); }
button { padding: .6rem 1.2rem; border-radius: 6px; border: 0; background: var(--accent); color: #04121f; font-weight: 600; cursor: pointer; }
button:disabled { opacity: .5; cursor: wait; }
#transcript-box textarea { width: 100%; background: var(--panel); color: var(--text); border: 1px solid #2a313a; border-radius: 6px; }
#progress { list-style: none; display: flex; gap: 1rem; padding: 0; flex-wrap: wrap; }
#progress li { color: var(--muted); }
#progress li.active { color: var(--accent); }
#progress li.ok { color: var(--ok); }
#progress li.fail { color: var(--bad); }
.error { color: var(--bad); margin: 1rem 0; }
#report details { background: var(--panel); border-radius: 8px; margin: .8rem 0; padding: .6rem 1rem; }
#report summary { cursor: pointer; font-weight: 600; }
#verdict-card { border-radius: 10px; padding: 1rem; margin: 1rem 0; background: var(--panel); border-left: 6px solid var(--muted); }
#verdict-card.WATCH { border-color: var(--ok); }
#verdict-card.SKIM { border-color: var(--warn); }
#verdict-card.SKIP { border-color: var(--bad); }
#verdict-card .big { font-size: 1.6rem; font-weight: 700; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.claim { margin: .5rem 0; padding: .5rem; border-radius: 6px; background: #12171d; }
.claim .supported { color: var(--ok); }
.claim .contradicted { color: var(--bad); }
.claim .unverifiable { color: var(--warn); }
.pass-error { color: var(--bad); font-style: italic; }
ul { padding-left: 1.2rem; }
a { color: var(--accent); }
```

`public/app.js`:
```js
const $ = (sel) => document.querySelector(sel);

function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

function list(items) {
  const ul = el('ul');
  for (const it of items) ul.append(el('li', it));
  return ul;
}

function renderReport(r) {
  $('#report').hidden = false;

  const vc = $('#verdict-card');
  vc.replaceChildren();
  vc.className = r.verdict?.verdict ?? '';
  vc.append(el('div', `${r.verdict?.verdict ?? '?'} — độ tin cậy: ${r.verdict?.confidence ?? '?'}`, 'big'));
  for (const reason of r.verdict?.reasons ?? []) vc.append(el('div', '• ' + reason));
  vc.append(el('div', `${r.video.title} — ${r.video.channel} — ${Math.round(r.video.durationSec / 60)} phút`, 'muted'));

  const sc = $('#sec-content');
  sc.replaceChildren();
  if (r.content) {
    sc.append(el('p', r.content.summary));
    for (const s of r.content.structure) {
      sc.append(el('div', `${s.timestamp ? '[' + s.timestamp + '] ' : ''}${s.heading}: ${s.gist}`));
    }
  } else sc.append(el('p', r.errors.content ?? 'Không có dữ liệu', 'pass-error'));

  const sf = $('#sec-facts');
  sf.replaceChildren();
  if (r.content) {
    const cols = el('div', null, 'cols');
    const c1 = el('div'); c1.append(el('h4', 'Facts'), list(r.content.facts));
    const c2 = el('div'); c2.append(el('h4', 'Stance của tác giả'), list(r.content.stance));
    cols.append(c1, c2);
    sf.append(cols);
  } else sf.append(el('p', '—', 'pass-error'));

  const sk = $('#sec-factcheck');
  sk.replaceChildren();
  if (r.factcheck) {
    for (const c of r.factcheck.claims) {
      const d = el('div', null, 'claim');
      d.append(el('div', c.claim));
      d.append(el('span', c.verdict.toUpperCase() + ' — ' + c.note, c.verdict));
      for (const s of c.sources) {
        const a = el('a', s); a.href = s; a.target = '_blank'; a.rel = 'noopener';
        d.append(el('br'), a);
      }
      sk.append(d);
    }
    if (!r.factcheck.claims.length) sk.append(el('p', 'Không có claim nào cần kiểm chứng.'));
  } else sk.append(el('p', r.errors.factcheck ?? 'Bị bỏ qua (không có facts)', 'pass-error'));

  const ss = $('#sec-social');
  ss.replaceChildren();
  if (r.social) {
    ss.append(el('p', 'Chất lượng comment: ' + r.social.commentQuality));
    ss.append(el('p', 'Chân dung audience: ' + r.social.audienceProfile));
    ss.append(el('p', 'Buzz: ' + r.social.buzz));
    if (r.social.dataGaps.length) ss.append(el('p', 'Thiếu dữ liệu: ' + r.social.dataGaps.join('; '), 'muted'));
  } else ss.append(el('p', r.errors.social ?? 'Không có dữ liệu', 'pass-error'));
}

async function loadHistory() {
  const items = await (await fetch('/api/reports')).json();
  const ul = $('#history');
  ul.replaceChildren();
  for (const it of items) {
    const li = el('li');
    li.append(el('span', it.verdict ?? '·', 'v'), el('span', it.title));
    li.onclick = async () => {
      const r = await (await fetch('/api/reports/' + it.id)).json();
      setProgressDone();
      renderReport(r);
    };
    ul.append(li);
  }
}

function setStage(stage, cls) {
  const li = document.querySelector(`#progress li[data-stage="${stage}"]`);
  if (li) li.className = cls;
}
function setProgressDone() {
  $('#progress').hidden = false;
  for (const li of document.querySelectorAll('#progress li')) li.className = 'ok';
}

$('#screen-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('#go').disabled = true;
  $('#error').hidden = true;
  $('#report').hidden = true;
  $('#progress').hidden = false;
  for (const li of document.querySelectorAll('#progress li')) li.className = '';
  setStage('ingest', 'active');

  const body = { url: $('#url').value };
  const pasted = $('#transcript').value.trim();
  if (pasted) body.transcriptOverride = pasted;

  let resp;
  try {
    resp = await fetch('/api/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return showError('Không gọi được server: ' + err.message);
  }
  const data = await resp.json();
  if (!resp.ok) return showError(data.error);
  setStage('ingest', 'ok');
  if (!data.hasTranscript && !pasted) $('#transcript-box').hidden = false;

  const es = new EventSource(`/api/screen/${data.jobId}/events`);
  es.addEventListener('stage', (e) => setStage(JSON.parse(e.data).stage, 'active'));
  es.addEventListener('pass', (e) => {
    const p = JSON.parse(e.data);
    const stage = p.pass === 'verdict' ? 'compose' : p.pass;
    setStage(stage, p.ok ? 'ok' : 'fail');
  });
  es.addEventListener('done', async (e) => {
    es.close();
    $('#go').disabled = false;
    const { reportId } = JSON.parse(e.data);
    const r = await (await fetch('/api/reports/' + reportId)).json();
    renderReport(r);
    loadHistory();
  });
  es.addEventListener('fatal', (e) => {
    es.close();
    showError(JSON.parse(e.data).error);
  });
  es.onerror = () => { es.close(); showError('Mất kết nối tới server.'); };
});

function showError(msg) {
  $('#go').disabled = false;
  const box = $('#error');
  box.textContent = msg;
  box.hidden = false;
}

loadHistory();
```

- [ ] **Step 2: Verify** — `npm start`, mở `http://localhost:3000`: form hiện, history rỗng, không lỗi console. (Trong môi trường CI/agent: `curl -s localhost:3000 | grep -q "Screening Assistant"` → exit 0 và `curl -s localhost:3000/api/reports` → `[]`.)

- [ ] **Step 3: Commit** — `git add public && git commit -m "feat: single-page frontend"`

---

### Task 8: README + verify tổng

**Files:**
- Create: `README.md`

- [ ] **Step 1: Viết README**

`README.md`:
```markdown
# Screening Assistant

Trợ lý cá nhân screening video dài: dán link YouTube → báo cáo 4 lớp
(tóm tắt, facts vs. stance, fact-check, social signals) + verdict
WATCH / SKIM / SKIP — quyết định "có đáng xem 2 tiếng không" trong 2 phút.

Tóm tắt là **bộ lọc**, không phải đường tắt: video hay thì vẫn nghe trọn.

## Cài đặt

```bash
npm install
cp .env.example .env   # điền ANTHROPIC_API_KEY
npm start              # → http://localhost:3000
```

## Dùng

1. Dán link YouTube, bấm **Screen**.
2. Theo dõi tiến độ 5 bước; báo cáo hiện dần từng phần.
3. Video không có captions → dán transcript vào ô hiện ra rồi bấm Screen lại.
4. Sidebar trái: mở lại báo cáo cũ (không tốn API call).

## Kiến trúc

- `server/ingest.js` — parse URL + lấy metadata/transcript/comments (youtubei.js, không cần YouTube API key)
- `server/passes/` — 4 pass Claude: content, factcheck (web search), social (web search), compose verdict
- `server/pipeline.js` — orchestrator: content → (factcheck ∥ social) → compose; pass lỗi không giết pipeline
- `server/index.js` + `server/jobs.js` — Express + SSE tiến độ
- `server/store.js` — báo cáo JSON trong `data/`
- `public/` — frontend một trang, không build step

Spec: `docs/superpowers/specs/2026-07-19-video-screening-assistant-design.md`

## Test

```bash
npm test
```

E2E thủ công: chạy app, screen một video dài có captions (ví dụ một talk
1h+), kiểm tra đủ 5 khối: verdict card, tóm tắt, facts/stance, fact-check
có nguồn, social signals.
```

- [ ] **Step 2: Verify tổng** — `npm test` → PASS toàn bộ; `node --check` từng file server → OK.

- [ ] **Step 3: Commit** — `git add README.md && git commit -m "docs: README with setup and architecture"`
