import { randomUUID } from 'node:crypto';

const jobs = new Map();

export function createJob() {
  const id = randomUUID().replaceAll('-', '');
  const job = {
    id,
    buffer: [],
    subscribers: new Set(),
    finished: false,
    emit(event, payload) {
      const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
      this.buffer.push(frame);
      for (const res of this.subscribers) res.write(frame);
    },
    subscribe(res) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders();
      for (const frame of this.buffer) res.write(frame);
      if (!this.finished) {
        this.subscribers.add(res);
        res.on('close', () => this.subscribers.delete(res));
      }
    },
    finish(event, payload) {
      this.emit(event, payload);
      this.finished = true;
      this.subscribers.clear();
      setTimeout(() => jobs.delete(id), 10 * 60 * 1000).unref?.();
    }
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id) {
  return jobs.get(id);
}
