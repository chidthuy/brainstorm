import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express from 'express';
import { runStep } from './steps.js';
import { callClaude, resolveModel } from './claude.js';
import { buildAsk } from './passes/ask.js';
import { isAuthorized } from './auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = process.env.APP_PASSWORD || '';

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(join(__dirname, '..', 'public')));

// Cho client biết có cần mật khẩu không (để hiện ô nhập).
app.get('/api/config', (_req, res) => {
  res.json({ requiresPassword: !!PASSWORD });
});

// Mỗi bước phân tích là một request riêng — client điều phối trình tự,
// nên tổng thời gian screening không bị giới hạn thời gian serverless chặn.
app.post('/api/step', async (req, res) => {
  const provided = req.get('x-app-password') ?? req.body?.password;
  if (!isAuthorized(PASSWORD, provided)) {
    return res.status(401).json({ error: 'Sai mật khẩu' });
  }
  const { step, payload, language, model } = req.body ?? {};
  if (!step) return res.status(400).json({ error: 'Thiếu step' });
  try {
    const data = await runStep(step, payload, { language, model: resolveModel(model) });
    res.json({ data });
  } catch (err) {
    const msg = String(err.message ?? err);
    res.status(step === 'ingest' ? 400 : 500).json({ error: msg });
  }
});

// Hỏi tiếp / phản hồi sau khi đã có báo cáo.
app.post('/api/ask', async (req, res) => {
  const provided = req.get('x-app-password') ?? req.body?.password;
  if (!isAuthorized(PASSWORD, provided)) {
    return res.status(401).json({ error: 'Sai mật khẩu' });
  }
  const { report, question, language, model } = req.body ?? {};
  if (!question || !report) return res.status(400).json({ error: 'Thiếu câu hỏi hoặc báo cáo' });
  try {
    const answer = await callClaude({
      ...buildAsk({ report, question, language }),
      model: resolveModel(model)
    });
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: String(err.message ?? err) });
  }
});

// Chỉ nghe cổng khi chạy local. Trên Vercel, app được export làm handler.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`Screening Assistant: http://localhost:${port}`));
}

export default app;
