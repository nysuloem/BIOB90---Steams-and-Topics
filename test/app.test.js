'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

async function waitForHealth(baseUrl) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error('Server did not become healthy');
}

function startServer(dataDir, port) {
  return spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, INSTRUCTOR_PASSWORD: 'test-password', SESSION_SECRET: 'test-session-secret' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function stopServer(child) {
  if (child.exitCode != null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => child.once('exit', resolve));
}

test('student workflow autosaves, submits, persists, recovers, and exports CSV', async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'biob90-'));
  const port = 33000 + Math.floor(Math.random() * 1000);
  const baseUrl = `http://127.0.0.1:${port}`;
  let child = startServer(dataDir, port);
  t.after(async () => { await stopServer(child); await fs.rm(dataDir, { recursive: true, force: true }); });
  await waitForHealth(baseUrl);

  const content = await fetch(`${baseUrl}/api/content`).then((response) => response.json());
  assert.equal(content.topics.length, 60);
  assert.equal(content.streams.length, 3);
  assert.equal(content.quiz.questions.length, 10);

  const start = await fetch(`${baseUrl}/api/student/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Student', studentNumber: '1000123456' })
  });
  assert.equal(start.status, 200);
  const studentCookie = start.headers.get('set-cookie').split(';')[0];
  assert.equal((await start.json()).recovered, false);

  const quizAnswers = Object.fromEntries(content.quiz.questions.map((question) => [question.id, question.options[0].id]));
  const patch = await fetch(`${baseUrl}/api/student`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentStep: 5,
      streamRanking: content.streams.map((stream) => stream.id),
      topicRanking: [1, 2, 3, 4, 5], quizAnswers,
      meetingFormat: 'online', meetingTime: 'evening'
    })
  });
  assert.equal(patch.status, 200);
  const patched = await patch.json();
  assert.ok(patched.record.avengerResult);

  const submit = await fetch(`${baseUrl}/api/student/submit`, { method: 'POST', headers: { Cookie: studentCookie } });
  assert.equal(submit.status, 200);
  assert.ok((await submit.json()).record.submittedAt);

  await stopServer(child);
  child = startServer(dataDir, port);
  await waitForHealth(baseUrl);

  const recovery = await fetch(`${baseUrl}/api/student/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Student', studentNumber: '1000123456' })
  });
  assert.equal(recovery.status, 200);
  assert.equal((await recovery.json()).recovered, true);

  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'test-password' })
  });
  assert.equal(login.status, 200);
  const adminCookie = login.headers.get('set-cookie').split(';')[0];
  const csv = await fetch(`${baseUrl}/api/admin/submissions.csv`, { headers: { Cookie: adminCookie } });
  assert.equal(csv.status, 200);
  const csvText = await csv.text();
  assert.match(csvText, /Test Student,1000123456,Submitted/);
  assert.match(csvText, /Captain America|Iron Man|Black Widow|Thor|Bruce Banner|Spider-Man|Captain Marvel|Black Panther/);
});
