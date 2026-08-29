'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(ROOT, 'data'));
const STORE_PATH = path.join(DATA_DIR, 'submissions.json');
const MAX_BODY = 1_000_000;
const ADMIN_PASSWORD = process.env.INSTRUCTOR_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || ADMIN_PASSWORD || crypto.randomBytes(32).toString('hex');
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);

const content = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
const streamIds = new Set(content.streams.map((stream) => stream.id));
const topicIds = new Set(content.topics.map((topic) => topic.id));
const questionMap = new Map(content.quiz.questions.map((question) => [question.id, question]));
const meetingFormats = new Set(['in-person', 'online', 'no-preference']);
const meetingTimes = new Set(['morning', 'afternoon', 'evening', 'flexible']);

class SubmissionStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.records = new Map();
    this.writeQueue = Promise.resolve();
  }

  async init() {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const parsed = JSON.parse(await fsp.readFile(this.filePath, 'utf8'));
      let migrated = false;
      for (const record of parsed.submissions || []) {
        const studentNumberLast4 = String(record.studentNumberLast4 || record.studentNumber || '').slice(-4);
        const recordKey = record.recordKey || studentKey(record.name, studentNumberLast4);
        if (record.studentNumber || !record.studentNumberLast4 || !record.recordKey) migrated = true;
        delete record.studentNumber;
        record.studentNumberLast4 = studentNumberLast4;
        record.recordKey = recordKey;
        this.records.set(recordKey, record);
      }
      if (migrated) await this.persist();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.persist();
    }
  }

  get(recordKey) {
    return this.records.get(recordKey) || null;
  }

  list() {
    return [...this.records.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async set(record) {
    this.records.set(record.recordKey, record);
    await this.persist();
    return record;
  }

  async clear() {
    const removed = this.records.size;
    this.records.clear();
    await this.persist();
    return removed;
  }

  persist() {
    this.writeQueue = this.writeQueue.then(async () => {
      const payload = JSON.stringify({ version: 1, submissions: this.list() }, null, 2);
      const tempPath = `${this.filePath}.${process.pid}.tmp`;
      await fsp.writeFile(tempPath, payload, { encoding: 'utf8', mode: 0o600 });
      await fsp.rename(tempPath, this.filePath);
    });
    return this.writeQueue;
  }
}

const store = new SubmissionStore(STORE_PATH);

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeStudentNumberLast4(value) {
  return String(value || '').replace(/\D/g, '');
}

function studentKey(name, studentNumberLast4) {
  return crypto.createHash('sha256').update(`${normalizeName(name).toLocaleLowerCase()}\0${studentNumberLast4}`).digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function createToken(payload, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url');
  return `${body}.${sign(body)}`;
}

function readToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!safeEqual(sign(body), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
      const index = part.indexOf('=');
      return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
    })
  );
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${IS_PRODUCTION ? '; Secure' : ''}`;
}

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) req.destroy(new Error('Request too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function studentFromRequest(req) {
  const session = readToken(parseCookies(req).biob90_student);
  return session?.role === 'student' ? store.get(session.recordKey) : null;
}

function isAdmin(req) {
  const session = readToken(parseCookies(req).biob90_admin);
  return session?.role === 'admin';
}

function publicRecord(record) {
  return {
    name: record.name,
    studentNumberLast4: record.studentNumberLast4,
    currentStep: record.currentStep,
    streamRanking: record.streamRanking,
    topicRanking: record.topicRanking,
    quizAnswers: record.quizAnswers,
    avengerResult: record.avengerResult,
    traitScores: record.traitScores,
    meetingFormat: record.meetingFormat,
    meetingTime: record.meetingTime,
    submittedAt: record.submittedAt,
    updatedAt: record.updatedAt
  };
}

function uniqueValidArray(value, allowed, maxLength) {
  if (!Array.isArray(value) || value.length > maxLength) return null;
  const cleaned = value.map((item) => typeof item === 'number' ? item : String(item));
  if (new Set(cleaned).size !== cleaned.length || cleaned.some((item) => !allowed.has(item))) return null;
  return cleaned;
}

function scoreQuiz(answers) {
  const traits = Object.fromEntries(content.quiz.traits.map((trait) => [trait.id, 0]));
  for (const [questionId, answerId] of Object.entries(answers || {})) {
    const question = questionMap.get(questionId);
    const option = question?.options.find((candidate) => candidate.id === answerId);
    if (!option) continue;
    for (const [trait, points] of Object.entries(option.scores)) traits[trait] += points;
  }

  if (Object.keys(answers || {}).length !== content.quiz.questions.length) {
    return { traitScores: traits, avengerResult: null };
  }

  let best = null;
  for (const outcome of content.quiz.outcomes) {
    const score = Object.entries(outcome.profile).reduce((sum, [trait, weight]) => sum + traits[trait] * weight, 0);
    if (!best || score > best.score) best = { id: outcome.id, score };
  }
  return { traitScores: traits, avengerResult: best.id };
}

function validateComplete(record) {
  const missing = [];
  if (record.streamRanking.length !== content.streams.length) missing.push('stream ranking');
  if (record.topicRanking.length !== 5) missing.push('five topic choices');
  if (Object.keys(record.quizAnswers).length !== content.quiz.questions.length || !record.avengerResult) missing.push('teamwork quiz');
  if (!record.meetingFormat) missing.push('meeting format');
  if (!record.meetingTime) missing.push('meeting time');
  return missing;
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function submissionsCsv() {
  const traitIds = content.quiz.traits.map((trait) => trait.id);
  const questionIds = content.quiz.questions.map((question) => question.id);
  const headers = [
    'Name', 'Student Number (last 4 digits)', 'Status', 'Created At', 'Updated At', 'Submitted At',
    'Stream Rank 1', 'Stream Rank 2', 'Stream Rank 3',
    'Topic Rank 1', 'Topic Rank 2', 'Topic Rank 3', 'Topic Rank 4', 'Topic Rank 5',
    'Avenger Result', 'Jung-style Code', ...traitIds.map((id) => `Trait: ${id}`),
    'Meeting Format', 'Preferred Time', ...questionIds.map((id) => `Quiz: ${id}`)
  ];
  const streamName = new Map(content.streams.map((item) => [item.id, item.title]));
  const topicName = new Map(content.topics.map((item) => [item.id, item.title]));
  const outcomes = new Map(content.quiz.outcomes.map((item) => [item.id, item]));
  const rows = store.list().map((record) => [
    record.name, record.studentNumberLast4, record.submittedAt ? 'Submitted' : 'In progress', record.createdAt, record.updatedAt, record.submittedAt,
    ...[0, 1, 2].map((index) => streamName.get(record.streamRanking[index]) || ''),
    ...[0, 1, 2, 3, 4].map((index) => topicName.get(record.topicRanking[index]) || ''),
    outcomes.get(record.avengerResult)?.name || '', outcomes.get(record.avengerResult)?.jungType || '', ...traitIds.map((id) => record.traitScores[id] || 0),
    record.meetingFormat, record.meetingTime, ...questionIds.map((id) => record.quizAnswers[id] || '')
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

async function api(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/content') return json(res, 200, content);

  if (req.method === 'POST' && url.pathname === '/api/student/start') {
    const body = await readJson(req);
    const name = normalizeName(body.name);
    const studentNumberLast4 = normalizeStudentNumberLast4(body.studentNumberLast4);
    if (name.length < 2 || name.length > 120) return json(res, 400, { error: 'Enter your name exactly as it appears on Quercus.' });
    if (!/^\d{4}$/.test(studentNumberLast4)) return json(res, 400, { error: 'Enter the last four digits of your student number.' });
    const recordKey = studentKey(name, studentNumberLast4);
    let record = store.get(recordKey);
    let recovered = false;
    if (record) {
      recovered = true;
    } else {
      const now = new Date().toISOString();
      record = {
        name, studentNumberLast4, recordKey, createdAt: now, updatedAt: now, submittedAt: null, currentStep: 1,
        streamRanking: [], topicRanking: [], quizAnswers: {}, avengerResult: null,
        traitScores: Object.fromEntries(content.quiz.traits.map((trait) => [trait.id, 0])),
        meetingFormat: '', meetingTime: ''
      };
      await store.set(record);
    }
    const token = createToken({ role: 'student', recordKey }, 60 * 60 * 24 * 30);
    return json(res, 200, { recovered, record: publicRecord(record) }, { 'Set-Cookie': cookie('biob90_student', token, 60 * 60 * 24 * 30) });
  }

  if (req.method === 'GET' && url.pathname === '/api/student') {
    const record = studentFromRequest(req);
    return record ? json(res, 200, { record: publicRecord(record) }) : json(res, 401, { error: 'Student session not found.' });
  }

  if (req.method === 'PATCH' && url.pathname === '/api/student') {
    const record = studentFromRequest(req);
    if (!record) return json(res, 401, { error: 'Student session not found.' });
    if (process.env.SURVEY_CLOSED === 'true') return json(res, 403, { error: 'Topic selection is currently closed.' });
    const body = await readJson(req);
    if ('currentStep' in body) record.currentStep = Math.max(1, Math.min(5, Number(body.currentStep) || 1));
    if ('streamRanking' in body) {
      const value = uniqueValidArray(body.streamRanking, streamIds, content.streams.length);
      if (!value) return json(res, 400, { error: 'Invalid stream ranking.' });
      record.streamRanking = value;
    }
    if ('topicRanking' in body) {
      const value = uniqueValidArray(body.topicRanking, topicIds, 5);
      if (!value) return json(res, 400, { error: 'Invalid topic ranking.' });
      record.topicRanking = value;
    }
    if ('quizAnswers' in body) {
      const answers = {};
      for (const [questionId, answerId] of Object.entries(body.quizAnswers || {})) {
        const question = questionMap.get(questionId);
        if (!question?.options.some((option) => option.id === answerId)) return json(res, 400, { error: 'Invalid quiz response.' });
        answers[questionId] = answerId;
      }
      record.quizAnswers = answers;
      Object.assign(record, scoreQuiz(answers));
    }
    if ('meetingFormat' in body) {
      if (body.meetingFormat && !meetingFormats.has(body.meetingFormat)) return json(res, 400, { error: 'Invalid meeting format.' });
      record.meetingFormat = body.meetingFormat;
    }
    if ('meetingTime' in body) {
      if (body.meetingTime && !meetingTimes.has(body.meetingTime)) return json(res, 400, { error: 'Invalid meeting time.' });
      record.meetingTime = body.meetingTime;
    }
    record.updatedAt = new Date().toISOString();
    await store.set(record);
    return json(res, 200, { record: publicRecord(record) });
  }

  if (req.method === 'POST' && url.pathname === '/api/student/submit') {
    const record = studentFromRequest(req);
    if (!record) return json(res, 401, { error: 'Student session not found.' });
    if (process.env.SURVEY_CLOSED === 'true') return json(res, 403, { error: 'Topic selection is currently closed.' });
    const missing = validateComplete(record);
    if (missing.length) return json(res, 400, { error: `Please complete: ${missing.join(', ')}.` });
    record.submittedAt = new Date().toISOString();
    record.updatedAt = record.submittedAt;
    await store.set(record);
    return json(res, 200, { record: publicRecord(record) });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    if (!ADMIN_PASSWORD) return json(res, 503, { error: 'INSTRUCTOR_PASSWORD has not been configured.' });
    const body = await readJson(req);
    if (!safeEqual(body.password || '', ADMIN_PASSWORD)) return json(res, 401, { error: 'Incorrect password.' });
    const token = createToken({ role: 'admin' }, 60 * 60 * 8);
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie('biob90_admin', token, 60 * 60 * 8) });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
    return json(res, 200, { ok: true }, { 'Set-Cookie': cookie('biob90_admin', '', 0) });
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/summary') {
    if (!isAdmin(req)) return json(res, 401, { error: 'Instructor login required.' });
    const records = store.list();
    return json(res, 200, { total: records.length, submitted: records.filter((item) => item.submittedAt).length });
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/submissions.csv') {
    if (!isAdmin(req)) return json(res, 401, { error: 'Instructor login required.' });
    const csv = submissionsCsv();
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="BIOB90-group-preferences-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Length': Buffer.byteLength(csv)
    });
    return res.end(csv);
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/reset') {
    if (!isAdmin(req)) return json(res, 401, { error: 'Instructor login required.' });
    const body = await readJson(req);
    if (body.confirmation !== 'RESET') return json(res, 400, { error: 'Type RESET to confirm.' });
    const removed = await store.clear();
    return json(res, 200, { ok: true, removed });
  }

  return json(res, 404, { error: 'Not found.' });
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

async function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: 'Forbidden.' });
  try {
    const data = await fsp.readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') return json(res, 404, { error: 'Not found.' });
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/health') return json(res, 200, { ok: true });
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    return await serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, 500, { error: 'Something went wrong. Your previous autosaves are still safe.' });
    else res.end();
  }
});

async function start() {
  await store.init();
  server.listen(PORT, '0.0.0.0', () => console.log(`BIOB90 app listening on port ${PORT}; data: ${STORE_PATH}`));
}

if (require.main === module) start().catch((error) => { console.error(error); process.exit(1); });

module.exports = { server, store, scoreQuiz, validateComplete, submissionsCsv, normalizeName, normalizeStudentNumberLast4, start };
