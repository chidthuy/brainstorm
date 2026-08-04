// Kiểm tra GEMINI_API_KEY có dùng được không, bằng một lần gọi thật nhưng rẻ:
// chỉ nghe 2 phút đầu của video bạn đưa vào.
//
//   npm run check-gemini -- "https://www.youtube.com/watch?v=..."
//
// Chạy được = phần "nghe lại video khi YouTube chặn phụ đề" đã sẵn sàng.
import 'dotenv/config';
import { transcribeWindow, GEMINI_MODEL, planWindows, WINDOW_SEC } from '../server/gemini.js';
import { parseVideoId } from '../server/ingest.js';
import { friendlyError } from '../server/errors.js';

const PROBE_SEC = 120;

const arg = process.argv[2];
if (!arg) {
  console.error(
    'Thiếu link video.\n\n' +
    '  npm run check-gemini -- "https://www.youtube.com/watch?v=XXXXXXXXXXX"\n\n' +
    'Dùng bất kỳ video YouTube CÔNG KHAI nào (Gemini không đọc được video riêng tư/unlisted).'
  );
  process.exit(2);
}

if (!process.env.GEMINI_API_KEY) {
  console.error(
    'Chưa có GEMINI_API_KEY.\n\n' +
    'Local:  thêm dòng GEMINI_API_KEY=... vào file .env (xem .env.example)\n' +
    'Vercel: Settings → Environment Variables → thêm GEMINI_API_KEY → Redeploy\n\n' +
    'Lấy key miễn phí: https://aistudio.google.com/apikey'
  );
  process.exit(2);
}

let id;
try {
  id = parseVideoId(arg);
} catch (err) {
  console.error(friendlyError(err.message));
  process.exit(2);
}

console.log(`Model:  ${GEMINI_MODEL}`);
console.log(`Video:  ${id}`);
console.log(`Nghe thử ${PROBE_SEC}s đầu…\n`);

const t0 = Date.now();
let out;
try {
  out = await transcribeWindow({ videoId: id, startSec: 0, endSec: PROBE_SEC });
} catch (err) {
  console.error('✗ Gọi Gemini thất bại.\n');
  console.error(friendlyError(err.message));
  process.exit(1);
}
const secs = ((Date.now() - t0) / 1000).toFixed(1);

if (out.empty) {
  console.error(`✗ Gemini trả về rỗng sau ${secs}s.`);
  console.error('  Key hoạt động, nhưng video này không có lời nói ở 2 phút đầu, ' +
    'hoặc không công khai. Thử một video khác có người nói ngay từ đầu.');
  process.exit(1);
}

const lines = out.text.split('\n');
console.log(`✓ Key hoạt động — ${lines.length} dòng trong ${secs}s.\n`);
for (const l of lines.slice(0, 5)) console.log('  ' + l);
if (lines.length > 5) console.log(`  … còn ${lines.length - 5} dòng`);

// Mốc thời gian phải nằm trong cửa sổ vừa nghe; lệch là dấu hiệu code đưa mốc
// về gốc video sai, thứ sẽ làm hỏng outline của báo cáo.
const last = lines.at(-1).match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]/)?.[1];
console.log(`\nMốc cuối: ${last ?? '(không đọc được)'} — phải nằm trong 0:00–${PROBE_SEC / 60}:00.`);

// Ước tính cho video dài, để biết một lần soi tốn bao nhiêu lượt gọi.
for (const mins of [60, 120]) {
  const n = planWindows(mins * 60).length;
  console.log(`Video ${mins} phút → ${n} lượt gọi (cửa sổ ${WINDOW_SEC / 60} phút).`);
}
