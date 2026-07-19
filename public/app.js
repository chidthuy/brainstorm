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
