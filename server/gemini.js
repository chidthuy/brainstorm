// Lấy transcript bằng Gemini khi YouTube chặn mọi đường lấy phụ đề.
//
// VÌ SAO GEMINI: Google sở hữu YouTube, nên Gemini API nhận THẲNG link YouTube
// (`file_data.file_uri`) và tự đọc audio phía Google — không đi qua IP máy chủ
// của ta, nên không dính chuyện Vercel bị chặn. Đây là lý do duy nhất Gemini
// có mặt trong app: nó là NGUỒN TRANSCRIPT, không phải người phân tích.
// Toàn bộ khâu đọc/soi/chấm điểm vẫn do Claude làm.
//
// VÌ SAO CẮT CỬA SỔ: một video 2 tiếng cho ra transcript vài chục nghìn token
// output — vượt giới hạn output của model và vượt luôn giới hạn thời gian của
// một serverless function. `video_metadata.start_offset/end_offset` cho phép
// đọc từng đoạn 20 phút; client gọi lần lượt từng đoạn, đúng kiến trúc
// "mỗi bước một request" sẵn có.

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// 20 phút/cửa sổ: đủ nhỏ để một request xong trong giới hạn thời gian, đủ lớn
// để video 2 tiếng chỉ tốn 6 lượt gọi.
export const WINDOW_SEC = 1200;

// Không lấy được thời lượng video → đọc một lượt, không cắt cửa sổ.
export const MAX_UNKNOWN_SEC = 3600;

export function hasGemini() {
  return !!process.env.GEMINI_API_KEY;
}

// Chia video thành các cửa sổ [start, end). durationSec = 0 (không rõ) → một
// cửa sổ duy nhất không giới hạn cuối.
export function planWindows(durationSec, windowSec = WINDOW_SEC) {
  const total = Number(durationSec) || 0;
  if (total <= 0) return [{ index: 0, startSec: 0, endSec: null, total: 1 }];
  const n = Math.max(1, Math.ceil(total / windowSec));
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    startSec: i * windowSec,
    endSec: Math.min((i + 1) * windowSec, total),
    total: n
  }));
}

export function fmtTimestamp(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function parseTimestamp(ts) {
  const p = String(ts).split(':').map(Number);
  if (p.some(Number.isNaN)) return null;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return null;
}

const LINE_RE = /^\[?\(?(\d{1,2}:\d{2}(?::\d{2})?)\)?\]?\s*[-–:]?\s*(.+)$/;

/**
 * Chuẩn hoá output của Gemini về đúng dạng "[m:ss] nội dung" mà các pass sau
 * đang chờ, và ĐƯA MỐC VỀ GỐC VIDEO.
 *
 * Khi cắt cửa sổ bằng start_offset, model có thể đánh mốc theo gốc video HOẶC
 * theo gốc đoạn cắt — tài liệu không cam kết. Thay vì tin một phía, ta đo: nếu
 * mốc nhỏ nhất nằm hẳn dưới điểm bắt đầu cửa sổ thì đó là mốc tương đối, cộng
 * bù startSec cho cả đoạn.
 */
export function normalizeWindowTranscript(raw, startSec = 0) {
  const rows = [];
  for (const line of String(raw ?? '').replace(/\r/g, '').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(LINE_RE);
    if (!m) continue;
    const sec = parseTimestamp(m[1]);
    const text = m[2].trim();
    if (sec == null || !text) continue;
    rows.push({ sec, text });
  }
  if (!rows.length) return '';

  const min = Math.min(...rows.map(r => r.sec));
  // Ngưỡng 60s: cho phép model lệch chút, nhưng lệch cả một cửa sổ thì rõ là
  // đang đánh mốc tương đối.
  const offset = startSec > 0 && min < startSec - 60 ? startSec : 0;

  return rows
    .map(r => `[${fmtTimestamp(r.sec + offset)}] ${r.text}`)
    .join('\n');
}

const NO_SPEECH = 'KHONG_CO_LOI_NOI';

function buildBody({ videoUrl, startSec, endSec, minimal }) {
  const videoMetadata = { fps: 0.2 };
  if (startSec > 0) videoMetadata.start_offset = `${Math.floor(startSec)}s`;
  if (endSec) videoMetadata.end_offset = `${Math.ceil(endSec)}s`;

  const window = endSec
    ? `từ phút ${fmtTimestamp(startSec)} đến phút ${fmtTimestamp(endSec)}`
    : 'toàn bộ video';

  const body = {
    contents: [{
      role: 'user',
      parts: [
        {
          text:
            `Chép lại LỜI NÓI trong đoạn ${window} của video.\n\n` +
            'QUY TẮC:\n' +
            '- Chép nguyên văn, GIỮ NGUYÊN ngôn ngữ gốc của người nói. Không dịch.\n' +
            '- Không tóm tắt, không diễn giải, không thêm nhận xét hay tiêu đề.\n' +
            '- Mỗi dòng một câu/ý ngắn, bắt đầu bằng mốc thời gian TÍNH TỪ ĐẦU VIDEO ' +
            'theo dạng [m:ss] (hoặc [h:mm:ss] nếu quá 60 phút).\n' +
            '- Giữ đúng con số, tên riêng, thuật ngữ nghe được. Nghe không rõ thì ghi [không rõ].\n' +
            '- Bỏ qua nhạc nền, tiếng động, quảng cáo chèn giữa.\n' +
            `- Nếu đoạn này hoàn toàn không có lời nói, chỉ trả về đúng một dòng: ${NO_SPEECH}\n\n` +
            'Chỉ trả về các dòng transcript, không có gì khác.'
        },
        { file_data: { file_uri: videoUrl }, video_metadata: videoMetadata }
      ]
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 16384 }
  };

  // Cấu hình tiết kiệm token: khung hình độ phân giải thấp (ta chỉ cần audio)
  // và tắt suy luận dài dòng. Tên tham số khác nhau giữa các đời model, nên
  // nếu API từ chối thì gọi lại bằng cấu hình tối thiểu (xem callGemini).
  if (!minimal) {
    body.generationConfig.mediaResolution = 'MEDIA_RESOLUTION_LOW';
    body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return body;
}

const TIMEOUT_MS = 240000;

async function callGemini(body, model, apiKey, fetchImpl) {
  const res = await fetchImpl(`${ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini API lỗi ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function textOf(data) {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.filter(p => typeof p.text === 'string').map(p => p.text).join('\n').trim();
}

/**
 * Đọc một cửa sổ thời gian của video, trả về { text, empty }.
 * `text` đã ở dạng "[m:ss] nội dung" với mốc tính từ đầu video.
 */
export async function transcribeWindow({
  videoId, startSec = 0, endSec = null, model = GEMINI_MODEL, fetchImpl = fetch, apiKey = process.env.GEMINI_API_KEY
}) {
  if (!apiKey) throw new Error('Chưa cấu hình GEMINI_API_KEY');
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let data;
  try {
    data = await callGemini(buildBody({ videoUrl, startSec, endSec, minimal: false }), model, apiKey, fetchImpl);
  } catch (err) {
    // 400 thường là do một tham số generationConfig không có ở đời model này —
    // thử lại bằng cấu hình tối thiểu trước khi bỏ cuộc.
    if (err.status !== 400) throw err;
    data = await callGemini(buildBody({ videoUrl, startSec, endSec, minimal: true }), model, apiKey, fetchImpl);
  }

  const raw = textOf(data);
  if (!raw || raw.includes(NO_SPEECH)) return { text: '', empty: true };
  const text = normalizeWindowTranscript(raw, startSec);
  return { text, empty: !text };
}
