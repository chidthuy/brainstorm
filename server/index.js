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
