import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import { fetchVideoData } from './ingest.js';
import { runScreening } from './pipeline.js';
import { callClaude } from './claude.js';
import { isAuthorized } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = process.env.APP_PASSWORD || '';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(join(__dirname, '..', 'public')));

// Cho client biết có cần mật khẩu không (để hiện ô nhập).
app.get('/api/config', (_req, res) => {
  res.json({ requiresPassword: !!PASSWORD });
});

// Chạy toàn bộ screening trong MỘT request và stream tiến độ trực tiếp về client
// (hợp với serverless: không có background job, không lưu file).
app.post('/api/screen', async (req, res) => {
  const provided = req.get('x-app-password') ?? req.body?.password;
  if (!isAuthorized(PASSWORD, provided)) {
    return res.status(401).json({ error: 'Sai mật khẩu' });
  }

  const { url, transcriptOverride } = req.body ?? {};
  if (!url) return res.status(400).json({ error: 'Thiếu url' });

  let videoData;
  try {
    videoData = await fetchVideoData(url);
  } catch (err) {
    return res.status(400).json({ error: `Không lấy được video: ${err.message}` });
  }
  if (transcriptOverride) videoData.transcriptOverride = transcriptOverride;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, payload) => res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);

  send('meta', {
    title: videoData.title,
    hasTranscript: !!videoData.transcript
  });

  try {
    const report = await runScreening(videoData, { callClaude }, send);
    send('done', { report });
  } catch (err) {
    send('fatal', { error: String(err.message ?? err) });
  }
  res.end();
});

// Chỉ nghe cổng khi chạy local. Trên Vercel, app được export làm handler.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`Screening Assistant: http://localhost:${port}`));
}

export default app;
