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

// ---------- steps + progress ----------
const stepsEl = $('#steps');
function stepEls() { return [...stepsEl.querySelectorAll('li')]; }
function setStage(stage, cls) { const li = stepsEl.querySelector(`li[data-s="${stage}"]`); if (li) li.className = cls; }
function setStepsDone() { stepsEl.hidden = false; $('#pwrap').hidden = true; for (const li of stepEls()) li.className = 'ok'; }
function resetSteps() { stepsEl.hidden = false; for (const li of stepEls()) li.className = ''; }

// Trọng số % của từng bước — cộng dồn khi bước xong; ticker nhích dần khi đang chạy.
const WEIGHTS = { ingest: 8, content: 40, factcheck: 15, social: 13, recommend: 12, compose: 12 };
const EST_SECONDS = { ingest: 10, content: 100, factcheck: 70, social: 60, recommend: 50, compose: 30 };
let progressBase = 0;
let running = {};   // step -> start time
let ticker = null;

function progressNow() {
  let p = progressBase;
  const now = Date.now();
  for (const [step, t0] of Object.entries(running)) {
    const frac = Math.min((now - t0) / 1000 / EST_SECONDS[step], 0.92);
    p += WEIGHTS[step] * frac;
  }
  return Math.min(Math.round(p), 99);
}
function paintProgress(note) {
  const p = progressNow();
  $('#pfill').style.width = p + '%';
  $('#ppct').textContent = p + '%';
  if (note) $('#pnote').textContent = note;
}
function startProgress() {
  progressBase = 0; running = {};
  $('#pwrap').hidden = false;
  paintProgress('bắt đầu…');
  ticker = setInterval(() => paintProgress(), 800);
}
function stepStart(step, note) { running[step] = Date.now(); setStage(step, 'active'); if (note) $('#pnote').textContent = note; }
function stepEnd(step, ok) {
  delete running[step];
  progressBase += WEIGHTS[step];
  setStage(step, ok ? 'ok' : 'fail');
  paintProgress();
}
function stopProgress(finalNote) {
  clearInterval(ticker); ticker = null; running = {};
  $('#pfill').style.width = '100%'; $('#ppct').textContent = '100%';
  if (finalNote) $('#pnote').textContent = finalNote;
}

// ---------- orchestration: mỗi bước một request ----------
async function callStep(step, payload) {
  const res = await fetch('/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-Password': $('#password').value },
    body: JSON.stringify({ step, payload, language: $('#lang').value, model: $('#model').value })
  });
  const d = await res.json().catch(() => ({ error: 'Server trả dữ liệu không hợp lệ' }));
  if (!res.ok) throw new Error(d.error || (step + ' lỗi'));
  return d.data;
}

function showMeta(video, hasTranscript) {
  $('#preview').hidden = false;
  $('#pTitle').textContent = video.title || '';
  $('#pMeta').textContent = [video.channel, video.durationSec ? Math.floor(video.durationSec / 60) + ' phút' : null,
    video.viewCount ? video.viewCount.toLocaleString() + ' views' : null].filter(Boolean).join(' · ');
  const thumb = $('#pthumb'); thumb.replaceChildren();
  if (video.id) { const img = el('img'); img.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; img.alt = ''; img.onerror = () => img.remove(); thumb.append(img); }
}

async function runScreen(transcriptOverride) {
  $('#go').disabled = true;
  $('#error').hidden = true;
  $('#report').hidden = true;
  $('#fallback').hidden = true;
  resetSteps(); startProgress();

  const question = $('#q').value.trim() || undefined;
  const report = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    video: null, question: question ?? null,
    content: null, factcheck: null, social: null, recommend: null, score: null,
    errors: {}
  };

  try {
    // 1. Ingest
    stepStart('ingest', 'lấy dữ liệu video…');
    let ing;
    try {
      ing = await callStep('ingest', { url: $('#url').value });
    } catch (err) { stepEnd('ingest', false); throw err; }
    stepEnd('ingest', true);
    report.video = ing.video;
    showMeta(ing.video, ing.hasTranscript);

    const transcriptText = transcriptOverride || ing.transcriptText;
    if (!transcriptText) {
      stopProgress('cần transcript');
      $('#fallback').hidden = false;
      $('#fallback').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#go').disabled = false;
      return;
    }

    // 2. Content (nặng nhất)
    stepStart('content', 'đọc transcript, dựng tóm tắt…');
    try {
      report.content = await callStep('content', {
        title: ing.video.title, channel: ing.video.channel, transcriptText, question
      });
      stepEnd('content', true);
    } catch (err) { report.errors.content = err.message; stepEnd('content', false); }

    // 3. Song song: factcheck + social + recommend (mỗi cái một request riêng)
    const jobs = [];
    if (report.content) {
      stepStart('factcheck', 'đối chiếu nguồn ngoài…');
      jobs.push(callStep('factcheck', { content: report.content })
        .then(d => { report.factcheck = d; stepEnd('factcheck', true); })
        .catch(err => { report.errors.factcheck = err.message; stepEnd('factcheck', false); }));
      stepStart('recommend', 'tìm video cùng chủ đề…');
      jobs.push(callStep('recommend', { title: ing.video.title, theme: report.content.summary?.theme ?? ing.video.title })
        .then(d => { report.recommend = d; stepEnd('recommend', true); })
        .catch(err => { report.errors.recommend = err.message; stepEnd('recommend', false); }));
    } else {
      stepEnd('factcheck', false); stepEnd('recommend', false);
    }
    stepStart('social', 'đọc tín hiệu cộng đồng…');
    jobs.push(callStep('social', {
      title: ing.video.title, channel: ing.video.channel,
      viewCount: ing.video.viewCount, comments: ing.comments
    })
      .then(d => { report.social = d; stepEnd('social', true); })
      .catch(err => { report.errors.social = err.message; stepEnd('social', false); }));
    await Promise.allSettled(jobs);

    // 4. Compose
    stepStart('compose', 'chấm điểm…');
    try {
      report.score = await callStep('compose', {
        content: report.content, factcheck: report.factcheck,
        social: report.social, video: report.video, question
      });
      stepEnd('compose', true);
    } catch (err) {
      report.errors.compose = err.message;
      report.score = { score: 50, label: 'Cân nhắc', reasons: ['Chấm điểm không khả dụng.'], focusAnswer: null };
      stepEnd('compose', false);
    }

    stopProgress('xong ✓');
    renderReport(report); saveHistory(report); renderHistory();
  } catch (err) {
    stopProgress('lỗi');
    showError(err.message);
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
