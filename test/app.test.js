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
  assert.ok(content.topics.every((topic) => topic.sources.length === 3));
  assert.ok(content.topics.every((topic) => !/indigenous/i.test(topic.description)));
  assert.equal(content.streams.length, 3);
  assert.ok(content.streams.every((stream) => stream.videos?.length >= 1));
  assert.ok(content.streams.flatMap((stream) => stream.videos).every((video) => /^https:\/\//.test(video.url)));
  assert.equal(content.streams[0].videos.length, 2);
  assert.equal(content.streams[1].title, 'Toronto Zoo: comparative biology');
  assert.equal(content.streams[1].videos.length, 2);
  assert.ok(!content.streams[1].videos.some((video) => video.url.includes('pcom.edu')));
  assert.ok(!content.streams[1].videos.some((video) => video.url.includes('lo6MzE09xm0')));
  assert.ok(content.streams[1].details.includes('Krogh principle'));
  assert.equal(content.streams[2].videos.length, 2);
  assert.equal(content.quiz.questions.length, 10);
  assert.equal(content.quiz.questions[0].id, 'companions');
  assert.ok(content.quiz.questions[0].options.some((option) => option.id === 'family'));
  assert.ok(content.quiz.questions.every((question) => question.options.length === 4));
  assert.ok(!content.quiz.questions.some((question) => question.id === 'travel-snag'));
  assert.equal(content.quiz.outcomes.length, 10);
  assert.equal(content.topics[44].title, 'Camouflage, mimicry, and biological deception');
  assert.ok(content.quiz.outcomes.every((outcome) => /^[EISNTFJP]{4}$/.test(outcome.jungType)));

  const start = await fetch(`${baseUrl}/api/student/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Student', studentNumberLast4: '3456' })
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
    body: JSON.stringify({ name: 'Test Student', studentNumberLast4: '3456' })
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
  assert.match(csvText, /Test Student,3456,Submitted/);
  assert.match(csvText, /Captain America|Spider-Man|Iron Man|Scarlet Witch|Hulk \/ Bruce Banner|Hawkeye|Ant-Man|Captain Marvel|Vision/);

  const reset = await fetch(`${baseUrl}/api/admin/reset`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie }, body: JSON.stringify({ confirmation: 'RESET' })
  });
  assert.equal(reset.status, 200);
  assert.equal((await reset.json()).removed, 1);
  const summary = await fetch(`${baseUrl}/api/admin/summary`, { headers: { Cookie: adminCookie } }).then((response) => response.json());
  assert.equal(summary.total, 0);
});
