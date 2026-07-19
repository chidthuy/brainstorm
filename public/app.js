const $ = (sel) => document.querySelector(sel);
const HISTORY_KEY = 'screening:index';

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

// ---------- lịch sử lưu trong trình duyệt (localStorage) ----------

function saveToHistory(report) {
  try {
    localStorage.setItem('screening:report:' + report.id, JSON.stringify(report));
    const index = loadIndex().filter((e) => e.id !== report.id);
    index.unshift({
      id: report.id,
      title: report.video.title,
      verdict: report.verdict?.verdict ?? null
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(index.slice(0, 100)));
  } catch { /* localStorage đầy hoặc bị chặn — bỏ qua */ }
}

function loadIndex() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadReport(id) {
  try {
    return JSON.parse(localStorage.getItem('screening:report:' + id) || 'null');
  } catch {
    return null;
  }
}

function renderHistory() {
  const ul = $('#history');
  ul.replaceChildren();
  for (const it of loadIndex()) {
    const li = el('li');
    li.append(el('span', it.verdict ?? '·', 'v'), el('span', it.title));
    li.onclick = () => {
      const r = loadReport(it.id);
      if (r) { setProgressDone(); renderReport(r); }
    };
    ul.append(li);
  }
}

// ---------- render báo cáo ----------

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

// ---------- tiến độ ----------

function setStage(stage, cls) {
  const li = document.querySelector(`#progress li[data-stage="${stage}"]`);
  if (li) li.className = cls;
}
function setProgressDone() {
  $('#progress').hidden = false;
  for (const li of document.querySelectorAll('#progress li')) li.className = 'ok';
}

function handleEvent(event, data) {
  if (event === 'meta') {
    setStage('ingest', 'ok');
    if (!data.hasTranscript && !$('#transcript').value.trim()) $('#transcript-box').hidden = false;
  } else if (event === 'stage') {
    setStage(data.stage, 'active');
  } else if (event === 'pass') {
    const stage = data.pass === 'verdict' ? 'compose' : data.pass;
    setStage(stage, data.ok ? 'ok' : 'fail');
  } else if (event === 'done') {
    renderReport(data.report);
    saveToHistory(data.report);
    renderHistory();
  } else if (event === 'fatal') {
    showError(data.error);
  }
}

// Đọc luồng SSE từ fetch response (thay cho EventSource để gửi được mật khẩu + POST body).
async function readStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop();
    for (const block of blocks) {
      const evLine = block.split('\n').find((l) => l.startsWith('event:'));
      const dataLine = block.split('\n').find((l) => l.startsWith('data:'));
      if (!evLine || !dataLine) continue;
      handleEvent(evLine.slice(6).trim(), JSON.parse(dataLine.slice(5).trim()));
    }
  }
}

// ---------- submit ----------

$('#screen-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('#go').disabled = true;
  $('#error').hidden = true;
  $('#report').hidden = true;
  $('#progress').hidden = false;
  for (const li of document.querySelectorAll('#progress li')) li.className = '';
  setStage('ingest', 'active');

  const password = $('#password').value;
  if (password) sessionStorage.setItem('screening:password', password);

  const body = { url: $('#url').value };
  const pasted = $('#transcript').value.trim();
  if (pasted) body.transcriptOverride = pasted;

  let res;
  try {
    res = await fetch('/api/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Password': password },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return showError('Không gọi được server: ' + err.message);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Lỗi không rõ' }));
    return showError(data.error);
  }

  try {
    await readStream(res);
  } catch (err) {
    showError('Mất kết nối khi đang phân tích: ' + err.message);
  }
  $('#go').disabled = false;
});

function showError(msg) {
  $('#go').disabled = false;
  const box = $('#error');
  box.textContent = msg;
  box.hidden = false;
}

// ---------- khởi động ----------

async function init() {
  renderHistory();
  try {
    const cfg = await (await fetch('/api/config')).json();
    if (cfg.requiresPassword) {
      const field = $('#password');
      field.hidden = false;
      field.value = sessionStorage.getItem('screening:password') || '';
    }
  } catch { /* để yên, coi như không cần mật khẩu */ }
}

init();
