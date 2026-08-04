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
    idx.unshift({
      id: report.id,
      title: report.video.title,
      score: report.score?.score ?? null,
      // Lưu chủ đề để lần soi sau phát hiện được nội dung trùng lặp.
      theme: report.content?.summary?.theme ?? null
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(idx.slice(0, 100)));
  } catch { /* bỏ qua */ }
}
function loadIndex() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }

// Chủ đề của các video đã soi gần đây — đưa vào bước chấm điểm để trừ điểm
// nội dung lặp lại. Video cũ chưa lưu theme thì dùng tiêu đề.
function recentThemes(excludeId) {
  return loadIndex()
    .filter(e => e.id !== excludeId)
    .slice(0, 15)
    .map(e => e.theme || e.title)
    .filter(Boolean);
}
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
      const line = (lead, val) => { const li = el('li'); li.append(el('span', lead + ' ', 'lead'), document.createTextNode(val)); return li; };
      ul.append(line('Chủ đề:', ct.summary.theme));
      // Điểm nổi bật: danh sách con để dễ quét mắt
      const hi = el('li'); hi.append(el('span', 'Điểm nổi bật:', 'lead'));
      const sub = el('ul', null, 'sub-bullets');
      const hs = Array.isArray(ct.summary.highlights) ? ct.summary.highlights : [ct.summary.highlights];
      for (const h of hs) sub.append(el('li', h));
      hi.append(sub); ul.append(hi);
      ul.append(line('Kết luận / insight:', ct.summary.conclusion));
      ul.append(line('Bạn sẽ rút ra:', ct.summary.takeaway));
      sm.append(ul); body.append(sm);

      if (ct.descriptionGap) {
        const g = el('div', null, 'kv');
        g.append(el('div', 'Lệch với mô tả', 'k'), el('div', ct.descriptionGap, 'desc-gap'));
        body.append(g);
      }

      const sc = r.score || { score: 50, label: '—', reasons: [] };
      const ev = el('div', null, 'kv'); ev.append(el('div', 'Đáng nghe tới đâu?', 'k'));
      const v = el('div', null, 'verdict');
      const meter = el('div', null, 'meter');
      meter.style.background = `conic-gradient(${scoreColor(sc.score)} ${sc.score}%, #242b34 0)`;
      meter.append(el('b', String(sc.score), scoreClass(sc.score)), el('small', 'SCORE'));
      const vt = el('div', null, 'vtext');
      vt.append(el('div', sc.label, 'label ' + scoreClass(sc.score)));
      const rul = el('ul'); for (const rs of sc.reasons) rul.append(el('li', rs)); vt.append(rul);
      v.append(meter, vt); ev.append(v);
      // Bảng trục chấm — cho thấy điểm đến từ đâu, theo đúng thứ tự trọng số.
      if (sc.breakdown?.length) {
        const MARK = { plus: ['▲', 'bd-plus'], minus: ['▼', 'bd-minus'], neutral: ['•', 'bd-neutral'], skip: ['–', 'bd-skip'] };
        const tbl = el('div', null, 'breakdown');
        for (const b of sc.breakdown) {
          const [sym, klass] = MARK[b.impact] || MARK.neutral;
          const row = el('div', null, 'bd-row ' + klass);
          row.append(el('span', sym, 'bd-mark'), el('span', b.label, 'bd-name'),
            el('span', b.impact === 'skip' ? 'không đủ dữ liệu' : b.note, 'bd-note'));
          tbl.append(row);
        }
        ev.append(tbl);
      }
      body.append(ev);
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
      body.append(el('p', r.social.readout || 'Không có ghi nhận nào đáng kể.'));
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
  thread.append(el('div',
    'Soi xong rồi. Bảng fact-check ở trên chỉ soi các trụ đỡ của luận điểm chính — ' +
    'muốn kiểm chứng thêm thông tin nào, nhắn ở đây tôi tra nguồn cho.', 'msg bot'));
  const chips = el('div', null, 'fu-chips');
  for (const t of ['Kiểm chứng giúp tôi số liệu…', 'Tóm tắt trong 3 câu', 'Chỗ nào đáng ngờ nhất?', 'Có nên xem thay video khác không?']) {
    const ch = el('span', t, 'chip');
    // Chip kết thúc bằng "…" là câu chưa hoàn chỉnh — đưa vào ô nhập để người
    // dùng viết nốt, thay vì gửi luôn một câu hỏi cụt.
    ch.onclick = () => {
      if (t.endsWith('…')) { const i = $('#fuInput'); i.value = t.slice(0, -1); i.focus(); }
      else sendFollowup(t);
    };
    chips.append(ch);
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
function resetSteps() {
  stepsEl.hidden = false;
  for (const li of stepEls()) li.className = '';
  $('#tStep').hidden = true;   // chỉ hiện khi lượt này thực sự phải nhờ Gemini nghe
}

// Trọng số của từng bước — cộng dồn khi bước xong; ticker nhích dần khi đang chạy.
// Bước "transcribe" chỉ có mặt khi phải nhờ Gemini nghe lại video, nên tổng
// trọng số thay đổi theo lượt chạy; progressNow chia cho tổng thực tế.
const BASE_WEIGHTS = { ingest: 8, content: 40, factcheck: 15, social: 13, recommend: 12, compose: 12 };
const EST_SECONDS = { ingest: 10, transcribe: 60, content: 100, factcheck: 70, social: 60, recommend: 50, compose: 30 };
let WEIGHTS = { ...BASE_WEIGHTS };
let tickWeights = {};   // ghi đè trọng số nhịp chạy (transcribe: tính theo từng cửa sổ)
let progressBase = 0;
let running = {};   // step -> start time
let ticker = null;

function progressNow() {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0) || 1;
  let p = progressBase;
  const now = Date.now();
  for (const [step, t0] of Object.entries(running)) {
    const frac = Math.min((now - t0) / 1000 / EST_SECONDS[step], 0.92);
    p += (tickWeights[step] ?? WEIGHTS[step]) * frac;
  }
  return Math.min(Math.round((p / total) * 100), 99);
}
function paintProgress(note) {
  const p = progressNow();
  $('#pfill').style.width = p + '%';
  $('#ppct').textContent = p + '%';
  if (note) $('#pnote').textContent = note;
}
function startProgress() {
  progressBase = 0; running = {}; tickWeights = {};
  WEIGHTS = { ...BASE_WEIGHTS };
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

// Bước thiết yếu (Summary, Fact-check) lỗi thì DỪNG và hỏi — không vội chấm điểm
// khi còn thiếu dữ liệu. Bước phụ (Social, Gợi ý) lỗi thì bỏ qua, vẫn chấm bình thường.
function askRetry(label, message) {
  return new Promise(resolve => {
    const box = $('#error');
    box.replaceChildren();
    box.hidden = false;
    box.append(el('div', `Bước ${label} lỗi: ${message}`));
    const row = el('div', null, 'retry-row');
    const again = el('button', 'Thử lại bước này', 'go');
    const skip = el('button', 'Bỏ qua, chấm điểm luôn', 'ghost-btn');
    again.onclick = () => { box.hidden = true; resolve('retry'); };
    skip.onclick = () => { box.hidden = true; resolve('skip'); };
    row.append(again, skip);
    box.append(row);
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// Chạy một bước thiết yếu, cho phép thử lại không giới hạn cho tới khi được
// hoặc người dùng chủ động bỏ qua.
async function runEssential(step, payload, label, note) {
  for (;;) {
    stepStart(step, note);
    try {
      const data = await callStep(step, payload);
      stepEnd(step, true);
      return { data, skipped: false };
    } catch (err) {
      stepEnd(step, false);
      const choice = await askRetry(label, err.message);
      if (choice === 'skip') return { data: null, error: err.message, skipped: true };
      progressBase -= WEIGHTS[step];          // trả lại % đã cộng để thanh không nhảy sai
      setStage(step, '');
    }
  }
}

// YouTube chặn máy chủ lấy phụ đề → nhờ Gemini nghe lại chính video đó.
// Gemini nhận thẳng link YouTube nên không đi qua IP của ta. Video dài được cắt
// thành các cửa sổ 20 phút, gọi lần lượt để không bước nào chạm trần thời gian.
// Trả về chuỗi transcript, hoặc null nếu không đường nào thành công.
async function runTranscribe(videoId, windows) {
  if (!windows.length) return null;
  WEIGHTS.transcribe = 30;
  tickWeights.transcribe = 30 / windows.length;
  $('#tStep').hidden = false;

  const parts = [];
  const gaps = [];
  for (const w of windows) {
    stepStart('transcribe',
      windows.length > 1
        ? `Gemini nghe video — đoạn ${w.index + 1}/${windows.length}…`
        : 'Gemini nghe video…');
    let got = null;
    for (let attempt = 0; attempt < 2 && !got; attempt++) {
      try {
        got = await callStep('transcribe', { videoId, startSec: w.startSec, endSec: w.endSec });
      } catch (err) {
        // Cửa sổ đầu hỏng thường là hỏng cả (chưa có key, video riêng tư) —
        // báo lỗi ngay thay vì ngồi thử hết mọi đoạn.
        if (!parts.length && attempt === 1) throw err;
      }
    }
    delete running.transcribe;
    progressBase += tickWeights.transcribe;
    if (got?.text) parts.push(got.text);
    else if (!got?.empty) gaps.push(w.index + 1);
    paintProgress();
  }

  setStage('transcribe', parts.length ? 'ok' : 'fail');
  if (!parts.length) return null;
  if (gaps.length) {
    parts.push(`\n[... không nghe được đoạn ${gaps.join(', ')}/${windows.length} — báo cáo dựa trên phần còn lại ...]`);
  }
  return parts.join('\n');
}

function showFallback(note) {
  stopProgress('cần transcript');
  $('#fbNote').textContent = note;
  $('#fallback').hidden = false;
  $('#fallback').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#go').disabled = false;
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

    // 1b. Không có phụ đề → nhờ Gemini nghe lại video, ngay tại trang này.
    let transcriptText = transcriptOverride || ing.transcriptText;
    let transcriptSource = transcriptOverride ? 'paste' : ing.transcriptSource;
    if (!transcriptText) {
      if (!ing.gemini?.available) {
        showFallback('YouTube chặn máy chủ lấy phụ đề, và app chưa có GEMINI_API_KEY để nhờ Gemini nghe lại video. ' +
          'Dán transcript vào đây để soi tiếp.');
        return;
      }
      try {
        transcriptText = await runTranscribe(ing.video.id, ing.gemini.windows);
        transcriptSource = 'gemini';
      } catch (err) {
        setStage('transcribe', 'fail');
        showFallback('Gemini không nghe được video này: ' + err.message + ' — dán transcript vào đây để soi tiếp.');
        return;
      }
      if (!transcriptText) {
        showFallback('Gemini không nghe được lời nói nào trong video này. Dán transcript vào đây để soi tiếp.');
        return;
      }
    }

    // 2. Content — thiết yếu
    {
      const r0 = await runEssential('content',
        {
          title: ing.video.title, channel: ing.video.channel, transcriptText, question,
          description: ing.description, publishedAt: ing.video.publishedAt, transcriptSource
        },
        'Summary', 'đọc transcript, dựng tóm tắt…');
      report.content = r0.data;
      if (r0.error) report.errors.content = r0.error;
    }

    // 3. Bước phụ chạy nền song song (lỗi thì bỏ qua, không chặn chấm điểm)
    const optional = [];
    stepStart('social', 'đọc comment…');
    optional.push(callStep('social', { comments: ing.comments })
      .then(d => { report.social = d; stepEnd('social', true); })
      .catch(err => { report.errors.social = err.message; stepEnd('social', false); }));
    if (report.content) {
      stepStart('recommend', 'tìm video cùng chủ đề…');
      optional.push(callStep('recommend', { title: ing.video.title, theme: report.content.summary?.theme ?? ing.video.title })
        .then(d => { report.recommend = d; stepEnd('recommend', true); })
        .catch(err => { report.errors.recommend = err.message; stepEnd('recommend', false); }));
    } else stepEnd('recommend', false);

    // 4. Fact-check — thiết yếu, có thể thử lại
    if (report.content) {
      const r1 = await runEssential('factcheck', { content: report.content },
        'Fact-check', 'đối chiếu nguồn ngoài…');
      report.factcheck = r1.data;
      if (r1.error) report.errors.factcheck = r1.error;
    } else stepEnd('factcheck', false);

    await Promise.allSettled(optional);

    // 5. Compose
    stepStart('compose', 'chấm điểm…');
    try {
      report.score = await callStep('compose', {
        content: report.content, factcheck: report.factcheck,
        social: report.social, video: report.video, question,
        seenThemes: recentThemes(report.id)
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

function showError(msg) { $('#go').disabled = false; const b = $('#error'); b.replaceChildren(); b.textContent = msg; b.hidden = false; }

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

// ---------- bookmarklet lấy transcript (đường cuối cùng) ----------
// Chạy trong ngữ cảnh trang youtube.com nên fetch phụ đề là same-origin và dùng
// chính IP/cookie của người dùng — thứ mà máy chủ không có. Nằm ngay trong trang
// này (không mở tab mới): chỉ cần kéo lên thanh bookmark một lần.
function installBookmarklet() {
  const code = `(async()=>{
var sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})};
var fmt=function(ms){var s=Math.floor(ms/1000),m=Math.floor(s/60),ss=String(s%60).padStart(2,'0');return m>=60?Math.floor(m/60)+':'+String(m%60).padStart(2,'0')+':'+ss:m+':'+ss};
var secs=function(ts){var p=String(ts).split(':').map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:0};
var lines=function(a){return a.filter(function(x){return x.text}).map(function(x){return '['+x.ts+'] '+x.text.replace(/\\s+/g,' ').trim()}).join('\\n')};
var SEG='ytd-transcript-segment-renderer';
var out='';var tried=[];var note='';

/* 1) Tai truc tiep file phu de (nhanh + day du nhat neu duoc) */
try{
var pr=window.ytInitialPlayerResponse;
if(!pr&&window.ytplayer&&ytplayer.config&&ytplayer.config.args&&ytplayer.config.args.player_response){pr=JSON.parse(ytplayer.config.args.player_response)}
var tr=pr&&pr.captions&&pr.captions.playerCaptionsTracklistRenderer&&pr.captions.playerCaptionsTracklistRenderer.captionTracks;
if(tr&&tr.length){
var pick=tr.slice().sort(function(a,b){return (b.kind==='asr'?0:10)-(a.kind==='asr'?0:10)})[0];
for(var i=0;i<3&&!out;i++){
try{var r=await fetch(pick.baseUrl+['&fmt=json3','','&fmt=srv1'][i],{credentials:'include'});var txt=await r.text();
if(txt&&txt.trim()){
if(txt.charAt(0)==='{'){var j=JSON.parse(txt);out=lines((j.events||[]).filter(function(e){return e.segs}).map(function(e){return {ts:fmt(e.tStartMs||0),text:e.segs.map(function(s){return s.utf8||''}).join('')}}))}
else{var d=new DOMParser().parseFromString(txt,'text/xml');out=lines([].slice.call(d.getElementsByTagName('text')).map(function(n){return {ts:fmt(Math.round(parseFloat(n.getAttribute('start')||0)*1000)),text:n.textContent}}))}
}}catch(e){}
}}
}catch(e){}
if(!out)tried.push('tai file');

/* 2) Mo khung transcript truoc — vua de lay params cho API, vua de doc man hinh */
var opened=!!document.querySelector(SEG);
if(!out&&!opened)try{
var cands=[].slice.call(document.querySelectorAll('button,tp-yt-paper-item,ytd-menu-service-item-renderer,yt-formatted-string'));
var btn=cands.filter(function(x){var s=((x.getAttribute&&x.getAttribute('aria-label'))||'')+' '+(x.textContent||'');
return /transcript|b\\u1ea3n ch\\u00e9p|ph\\u1ee5 \\u0111\\u1ec1/i.test(s)&&s.length<80})[0];
if(btn){btn.click();for(var w=0;w<15&&!opened;w++){await sleep(600);opened=!!document.querySelector(SEG)}}
}catch(e){}
/* xoa o tim kiem neu dang loc (gay "No results found") */
try{var sb=document.querySelector('ytd-transcript-search-box-renderer input,#transcript-search-box input');
if(sb&&sb.value){sb.value='';sb.dispatchEvent(new Event('input',{bubbles:true}));await sleep(800);opened=!!document.querySelector(SEG)}}catch(e){}

/* 3) API get_transcript — tra ve TOAN BO transcript trong 1 lan */
if(!out)try{
var key=window.ytcfg&&ytcfg.get('INNERTUBE_API_KEY');var ctx=window.ytcfg&&ytcfg.get('INNERTUBE_CONTEXT');
var hay=JSON.stringify(window.ytInitialData||{});
var mm=hay.match(/"getTranscriptEndpoint":\\{"params":"([^"]+)"/);
if(!mm){var el0=document.querySelector('ytd-transcript-renderer');var d0=el0&&(el0.__data||el0.data);if(d0){mm=JSON.stringify(d0).match(/"getTranscriptEndpoint":\\{"params":"([^"]+)"/)}}
if(key&&ctx&&mm){
var rr=await fetch('/youtubei/v1/get_transcript?key='+key,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:ctx,params:mm[1]})});
var jj=await rr.json();var segs=[];
(function walk(o){if(!o||typeof o!=='object')return;if(o.transcriptSegmentRenderer){var t=o.transcriptSegmentRenderer;segs.push({ts:fmt(Number(t.startMs||0)),text:t.snippet&&t.snippet.runs?t.snippet.runs.map(function(x){return x.text}).join(''):''})}for(var k in o)walk(o[k])})(jj);
out=lines(segs);
}}catch(e){}
if(!out)tried.push('api noi bo');

/* 4) Doc khung tren man hinh — PHAI cuon het vi YouTube chi ve phan dang nhin thay */
if(!out&&document.querySelector(SEG))try{
var seen={};
var grab=function(){[].slice.call(document.querySelectorAll(SEG)).forEach(function(el){
var a=el.querySelector('.segment-timestamp')||el.querySelector('[class*=timestamp]');
var b=el.querySelector('.segment-text')||el.querySelector('[class*=segment-text]');
var ts=a?a.textContent.trim():'';var tx=b?b.textContent.trim():'';
if(tx)seen[ts+'|'+tx]={ts:ts,text:tx}})};
var sc=document.querySelector('#segments-container')||document.querySelector('ytd-transcript-segment-list-renderer');
while(sc&&sc.scrollHeight<=sc.clientHeight&&sc.parentElement){sc=sc.parentElement}
grab();
if(sc){var pos=0,guard=0;
while(guard++<400){sc.scrollTop=pos;await sleep(120);grab();
if(pos>=sc.scrollHeight)break;pos+=Math.max(200,sc.clientHeight*0.75)}
sc.scrollTop=sc.scrollHeight;await sleep(300);grab()}
var arr=Object.keys(seen).map(function(k){return seen[k]}).sort(function(x,y){return secs(x.ts)-secs(y.ts)});
out=lines(arr);if(out)note=' ('+arr.length+' dong, den phut '+Math.floor(secs(arr[arr.length-1].ts)/60)+')';
}catch(e){}
if(!out)tried.push('khung tren man hinh');

if(!out){alert('Khong lay duoc transcript. Da thu: '+tried.join(', ')+'.\\n\\nCach thu cong: bam \\u201c...\\u201d duoi video > \\u201cShow transcript\\u201d, boi den toan bo khung ben phai roi Ctrl+C.');return}
try{await navigator.clipboard.writeText(out);alert('Da copy transcript ('+out.length+' ky tu'+note+'). Dan vao Screening Assistant.')}
catch(e){var t=document.createElement('textarea');t.value=out;t.style.cssText='position:fixed;z-index:99999;top:5%;left:5%;width:90%;height:80%';document.body.appendChild(t);t.select();alert('Bam Ctrl+C de copy, roi dong o nay.')}
})()`;
  const a = $('#bm');
  a.href = 'javascript:' + encodeURIComponent(code);
  a.addEventListener('click', (e) => e.preventDefault());
}

async function init() {
  renderHistory();
  installBookmarklet();
  try {
    const cfg = await (await fetch('/api/config')).json();
    if (cfg.requiresPassword) {
      const f = $('#password'); f.hidden = false; f.value = sessionStorage.getItem('screening:password') || '';
      f.addEventListener('change', () => sessionStorage.setItem('screening:password', f.value));
    }
  } catch { /* coi như không cần mật khẩu */ }
}
init();
