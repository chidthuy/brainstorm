const $ = (s) => document.querySelector(s);
const HISTORY_KEY = 'screening:index';
let lastReport = null;

function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function card(title) {
  const d = el('details', null, 'card'); d.open = true;
  const s = el('summary'); s.append(el('span', title), el('span', '▸', 'arw'));
  const body = el('div', null, 'body');
  d.append(s, body);
  return { card: d, body };
}
function fmtMin(sec) { return Math.round((sec || 0) / 60) + ' phút'; }
function scoreClass(n) { return n >= 70 ? 'hi' : n >= 45 ? 'mid' : 'lo'; }
function scoreColor(n) { return n >= 70 ? 'var(--ok)' : n >= 45 ? 'var(--warn)' : 'var(--bad)'; }
function pillClass(n) { return n >= 70 ? 'sp-hi' : n >= 45 ? 'sp-mid' : 'sp-lo'; }

// ---------- history (localStorage) ----------
function saveHistory(report) {
  try {
    localStorage.setItem('screening:report:' + report.id, JSON.stringify(report));
    const idx = loadIndex().filter(e => e.id !== report.id);
    idx.unshift({ id: report.id, title: report.video.title, score: report.score?.score ?? null });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(idx.slice(0, 100)));
  } catch { /* bỏ qua */ }
}
function loadIndex() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
function loadReport(id) { try { return JSON.parse(localStorage.getItem('screening:report:' + id) || 'null'); } catch { return null; } }
function renderHistory() {
  const ul = $('#history'); ul.replaceChildren();
  for (const it of loadIndex()) {
    const li = el('li');
    const s = it.score;
    const pill = el('span', s == null ? '·' : String(s), 'score-pill ' + (s == null ? '' : pillClass(s)));
    li.append(pill, el('span', it.title));
    li.onclick = () => { const r = loadReport(it.id); if (r) { setStepsDone(); renderReport(r); } };
    ul.append(li);
  }
}

// ---------- render report ----------
function renderReport(r) {
  lastReport = r;
  const root = $('#report'); root.hidden = false; root.replaceChildren();

  // 1. Summary
  {
    const { card: c, body } = card('Summary');
    if (r.content) {
      const ct = r.content;
      const focusAnswer = r.score?.focusAnswer || ct.focusAnswer;
      if (r.question && focusAnswer) {
        const a = el('div', null, 'answer');
        a.append(el('div', '↳ ' + r.question, 'q'), document.createTextNode(focusAnswer));
        body.append(a);
      }
      const au = el('div', null, 'kv'); au.append(el('div', 'Tác giả', 'k'), el('div', ct.author)); body.append(au);
      const sm = el('div', null, 'kv'); sm.append(el('div', 'Nội dung chính', 'k'));
      const ul = el('ul', null, 'content-bullets');
      const rows = [['Chủ đề:', ct.summary.theme], ['Điểm nổi bật:', ct.summary.highlights],
                    ['Kết luận / insight:', ct.summary.conclusion], ['Bạn sẽ rút ra:', ct.summary.takeaway]];
      for (const [lead, val] of rows) { const li = el('li'); li.append(el('span', lead + ' ', 'lead'), document.createTextNode(val)); ul.append(li); }
      sm.append(ul); body.append(sm);

      const sc = r.score || { score: 50, label: '—', reasons: [] };
      const ev = el('div', null, 'kv'); ev.append(el('div', 'Đáng nghe tới đâu?', 'k'));
      const v = el('div', null, 'verdict');
      const meter = el('div', null, 'meter');
      meter.style.background = `conic-gradient(${scoreColor(sc.score)} ${sc.score}%, #242b34 0)`;
      meter.append(el('b', String(sc.score), scoreClass(sc.score)), el('small', 'SCORE'));
      const vt = el('div', null, 'vtext');
      vt.append(el('div', sc.label, 'label ' + scoreClass(sc.score)));
      const rul = el('ul'); for (const rs of sc.reasons) rul.append(el('li', rs)); vt.append(rul);
      v.append(meter, vt); ev.append(v); body.append(ev);
    } else body.append(el('p', r.errors.content ?? 'Không có dữ liệu', 'pass-error'));
    root.append(c);
  }

  // 2. Outline
  if (r.content) {
    const { card: c, body } = card('Outline / Discussion Points');
    const o = el('div', null, 'outline');
    for (const it of r.content.outline) {
      const row = el('div', null, 'oitem');
      row.append(el('span', it.timestamp || '—', 't'), el('span', it.point));
      o.append(row);
    }
    if (!r.content.outline.length) o.append(el('p', 'Không dựng được dàn ý.', 'pass-error'));
    body.append(o); root.append(c);
  }

  // 3. Stance
  if (r.content) {
    const { card: c, body } = card('Stance');
    body.append(el('p', 'Lập trường / quan điểm của tác giả — không kiểm chứng đúng-sai được:'));
    const ul = el('ul', null, 'stance');
    for (const s of r.content.stance) ul.append(el('li', '“' + s + '”'));
    if (!r.content.stance.length) ul.append(el('li', '(không có)'));
    body.append(ul); root.append(c);
  }

  // 4. Fact-check
  {
    const { card: c, body } = card('Fact-check');
    if (r.factcheck) {
      body.append(el('p', 'Soi từng thông tin: đủ vững, yếu (mẫu nhỏ/thiếu bằng chứng), gây hiểu nhầm, hay sai/bịa.'));
      const head = el('div', null, 'fc-head'); head.append(el('div', 'Thông tin trong video'), el('div', 'Kết quả soi')); body.append(head);
      const TAG = { solid: ['ĐỦ VỮNG', 't-solid'], weak: ['YẾU', 't-weak'], misleading: ['GÂY HIỂU NHẦM', 't-off'], false: ['SAI / BỊA', 't-off'] };
      for (const cl of r.factcheck.claims) {
        const row = el('div', null, 'fc-row');
        row.append(el('div', cl.claim, 'claimtext'));
        const right = el('div');
        const [label, klass] = TAG[cl.verdict] || [cl.verdict, 't-weak'];
        right.append(el('span', label, 'fc-tag ' + klass), el('div', cl.note, 'fc-note'));
        for (const s of cl.sources) { const a = el('a', s, 'fc-src'); a.href = s; a.target = '_blank'; a.rel = 'noopener'; right.append(a); }
        row.append(right); body.append(row);
      }
      if (!r.factcheck.claims.length) body.append(el('p', 'Không có thông tin nào cần soi.'));
    } else body.append(el('p', r.errors.factcheck ?? 'Bị bỏ qua (không có facts)', 'pass-error'));
    root.append(c);
  }

  // 5. Social signals
  {
    const { card: c, body } = card('Social signals');
    if (r.social) {
      const rows = [['Chất lượng comment', r.social.commentQuality], ['Chân dung audience', r.social.audienceProfile], ['Độ lan toả', r.social.buzz]];
      for (const [k, v] of rows) { const d = el('div', null, 'social-row'); d.append(el('span', k, 'k'), el('span', v)); body.append(d); }
      if (r.social.dataGaps?.length) body.append(el('p', 'Thiếu dữ liệu: ' + r.social.dataGaps.join('; '), 'pass-error'));
    } else body.append(el('p', r.errors.social ?? 'Không có dữ liệu', 'pass-error'));
    root.append(c);
  }

  // 6. More like this
  if (r.recommend && r.recommend.items.length) {
    const { card: c, body } = card('More like this');
    for (const it of r.recommend.items) {
      const row = el('div', null, 'rec');
      const info = el('div', null, 'rinfo');
      const tt = it.url ? el('a', it.title, 'rtitle') : el('div', it.title, 'rtitle');
      if (it.url) { tt.href = it.url; tt.target = '_blank'; tt.rel = 'noopener'; }
      info.append(tt);
      if (it.channel) info.append(el('div', it.channel, 'rmeta'));
      info.append(el('div', it.why, 'rwhy'));
      row.append(info); body.append(row);
    }
    root.append(c);
  }

  // follow-up chat
  root.append(buildFollowup());
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildFollowup() {
  const wrap = el('div', null, 'followup');
  wrap.append(el('div', 'Hỏi thêm / phản hồi', 'fu-head'));
  const body = el('div', null, 'fu-body');
  const thread = el('div', null, 'fu-thread'); thread.id = 'fuThread';
  thread.append(el('div', 'Soi xong rồi. Muốn tôi đào sâu chỗ nào, tóm gọn hơn, hay đổi góc nhìn — cứ hỏi.', 'msg bot'));
  const chips = el('div', null, 'fu-chips');
  for (const t of ['Tóm tắt trong 3 câu', 'Chỗ nào đáng ngờ nhất?', 'Dịch sang tiếng Anh', 'Có nên xem thay video khác không?']) {
    const ch = el('span', t, 'chip'); ch.onclick = () => sendFollowup(t); chips.append(ch);
  }
  const rowi = el('div', null, 'fu-inputrow');
  const inp = el('input'); inp.type = 'text'; inp.id = 'fuInput'; inp.placeholder = 'Hỏi thêm về video này…';
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { sendFollowup(inp.value); inp.value = ''; } });
  const btn = el('button', 'Gửi'); btn.onclick = () => { sendFollowup(inp.value); inp.value = ''; };
  rowi.append(inp, btn);
  body.append(thread, chips, rowi); wrap.append(body);
  return wrap;
}

async function sendFollowup(text) {
  if (!text || !text.trim() || !lastReport) return;
  const thread = $('#fuThread');
  thread.append(el('div', text, 'msg user'));
  const bot = el('div', '…', 'msg bot'); thread.append(bot); bot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  try {
    const res = await fetch('/api/ask', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Password': $('#password').value },
      body: JSON.stringify({ report: lastReport, question: text, language: $('#lang').value, model: $('#model').value })
    });
    const data = await res.json();
    bot.textContent = res.ok ? data.answer : ('Lỗi: ' + (data.error || 'không rõ'));
  } catch (err) { bot.textContent = 'Không gọi được server: ' + err.message; }
}

// ---------- steps ----------
const stepsEl = $('#steps');
function stepEls() { return [...stepsEl.querySelectorAll('li')]; }
function setStage(stage, cls) { const li = stepsEl.querySelector(`li[data-s="${stage}"]`); if (li) li.className = cls; }
function setStepsDone() { stepsEl.hidden = false; for (const li of stepEls()) li.className = 'ok'; }
function resetSteps() { stepsEl.hidden = false; for (const li of stepEls()) li.className = ''; setStage('ingest', 'active'); }

let streamFinished = false;

function handleEvent(event, data) {
  if (event === 'done' || event === 'fatal' || event === 'needTranscript') streamFinished = true;
  if (event === 'meta') {
    setStage('ingest', 'ok');
    $('#preview').hidden = false;
    $('#pTitle').textContent = data.title || '';
    $('#pMeta').textContent = [data.channel, data.durationSec ? Math.floor(data.durationSec / 60) + ' phút' : null,
      data.viewCount ? data.viewCount.toLocaleString() + ' views' : null].filter(Boolean).join(' · ');
    const thumb = $('#pthumb'); thumb.replaceChildren();
    if (data.id) { const img = el('img'); img.src = `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`; img.alt = ''; img.onerror = () => img.remove(); thumb.append(img); }
  } else if (event === 'needTranscript') {
    stepsEl.hidden = true;
    $('#fallback').hidden = false;
    $('#fallback').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#go').disabled = false;
  } else if (event === 'stage') {
    setStage(data.stage, 'active');
  } else if (event === 'pass') {
    setStage(data.pass, data.ok ? 'ok' : 'fail');
  } else if (event === 'done') {
    renderReport(data.report); saveHistory(data.report); renderHistory();
  } else if (event === 'fatal') {
    showError(data.error);
  }
}

async function readStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n'); buffer = blocks.pop();
    for (const block of blocks) {
      const ev = block.split('\n').find(l => l.startsWith('event:'));
      const dl = block.split('\n').find(l => l.startsWith('data:'));
      if (ev && dl) handleEvent(ev.slice(6).trim(), JSON.parse(dl.slice(5).trim()));
    }
  }
}

async function runScreen(transcriptOverride) {
  $('#go').disabled = true;
  $('#error').hidden = true;
  $('#report').hidden = true;
  $('#fallback').hidden = true;
  resetSteps();
  const body = {
    url: $('#url').value, question: $('#q').value.trim() || undefined,
    language: $('#lang').value, model: $('#model').value
  };
  if (transcriptOverride) body.transcriptOverride = transcriptOverride;
  let res;
  try {
    res = await fetch('/api/screen', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-App-Password': $('#password').value },
      body: JSON.stringify(body)
    });
  } catch (err) { return showError('Không gọi được server: ' + err.message); }
  if (!res.ok) { const d = await res.json().catch(() => ({ error: 'Lỗi không rõ' })); return showError(d.error); }
  streamFinished = false;
  try { await readStream(res); } catch (err) { showError('Mất kết nối khi đang soi: ' + err.message); }
  if (!streamFinished) {
    for (const li of stepEls()) if (li.className === 'active') li.className = 'fail';
    showError('Server dừng giữa chừng — thường do video quá dài vượt thời gian cho phép. Thử lại lần nữa, chọn model Haiku (nhanh hơn) trong Tùy chọn, hoặc soi video ngắn hơn.');
  }
  $('#go').disabled = false;
}

function showError(msg) { $('#go').disabled = false; const b = $('#error'); b.textContent = msg; b.hidden = false; }

// ---------- wire ----------
$('#form').addEventListener('submit', (e) => { e.preventDefault(); runScreen(); });
$('#fbRun').addEventListener('click', () => {
  const t = $('#txPaste').value.trim();
  if (!t) { $('#txPaste').focus(); return; }
  runScreen(t);
});
$('#chips').addEventListener('click', (e) => { if (e.target.classList.contains('chip')) $('#q').value = e.target.textContent; });
const opts = $('#opts'), optToggle = $('#optToggle');
optToggle.addEventListener('click', () => {
  const open = opts.hidden; opts.hidden = !open;
  optToggle.setAttribute('aria-expanded', String(open));
  optToggle.textContent = open ? 'Tùy chọn: ngôn ngữ · model ▴' : 'Tùy chọn: ngôn ngữ · model ▾';
});

async function init() {
  renderHistory();
  try {
    const cfg = await (await fetch('/api/config')).json();
    if (cfg.requiresPassword) {
      const f = $('#password'); f.hidden = false; f.value = sessionStorage.getItem('screening:password') || '';
      f.addEventListener('change', () => sessionStorage.setItem('screening:password', f.value));
    }
  } catch { /* coi như không cần mật khẩu */ }
}
init();
