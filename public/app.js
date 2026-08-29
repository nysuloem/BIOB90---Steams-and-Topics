'use strict';

const app = document.querySelector('#app');
const progress = document.querySelector('#progress');
const notice = document.querySelector('#notice');
const saveStatus = document.querySelector('#save-status');
const instructorDialog = document.querySelector('#instructor-dialog');
const instructorContent = document.querySelector('#instructor-content');

let content = null;
let record = null;
let step = 1;
let topicSearch = '';
let topicListScroll = 0;
let saveTimer = null;
let queuedPatch = {};
let saveChain = Promise.resolve();

const stepNames = ['Team style', 'Preferences', 'Topics', 'Streams', 'Review'];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const type = response.headers.get('content-type') || '';
  const body = type.includes('json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(body.error || 'Something went wrong.');
  return body;
}

function setSaveStatus(text, type = '') {
  saveStatus.textContent = text;
  saveStatus.className = `save-status ${type}`;
}

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
  window.setTimeout(() => { notice.hidden = true; }, 5500);
}

function scheduleSave(patch) {
  Object.assign(queuedPatch, patch);
  clearTimeout(saveTimer);
  setSaveStatus('Saving…', 'saving');
  saveTimer = window.setTimeout(() => {
    const payload = queuedPatch;
    queuedPatch = {};
    savePatch(payload);
  }, 450);
}

function savePatch(patch) {
  saveChain = saveChain.then(async () => {
    setSaveStatus('Saving…', 'saving');
    const result = await request('/api/student', { method: 'PATCH', body: JSON.stringify(patch) });
    record = result.record;
    setSaveStatus('Saved', 'saved');
    return record;
  }).catch((error) => {
    setSaveStatus('Save failed', 'error');
    showNotice(error.message);
    throw error;
  });
  return saveChain;
}

function renderProgress() {
  if (!record) {
    progress.hidden = true;
    return;
  }
  progress.hidden = false;
  progress.innerHTML = `
    <div class="progress-track"><div class="progress-fill" style="width:${step * 20}%"></div></div>
    <div class="progress-labels">${stepNames.map((name, index) => `<span class="${step === index + 1 ? 'active' : ''}" data-short="${index + 1}">${index + 1}. ${name}</span>`).join('')}</div>`;
}

function renderWelcome() {
  progress.hidden = true;
  setSaveStatus('');
  app.innerHTML = `
    <section class="panel welcome-panel">
      <div class="eyebrow">BIOB90 group formation</div>
      <h1>Tell Us About YOU Survey</h1>
      <p class="lead">Complete a short Avengers teamwork activity, record your meeting preferences, rank five biology topics, and rank three ways of investigating a topic. Your responses will be used to form project groups.</p>
      <ol class="welcome-steps"><li>Complete the Avengers teamwork activity.</li><li>Record your meeting preferences.</li><li>Choose and rank five topics.</li><li>Rank the three project streams and submit.</li></ol>
      <form id="identity-form" class="form-card">
        <h2>Begin or resume</h2>
        <div class="field">
          <label for="student-name">Name <span class="hint">Enter your full name exactly as it appears on Quercus.</span></label>
          <input id="student-name" name="name" type="text" autocomplete="name" maxlength="120" required>
        </div>
        <div class="field">
          <label for="student-number">Last four digits of your student number <span class="hint">Only the last four digits are stored. Together with your Quercus name, they let you recover an autosaved response.</span></label>
          <input id="student-number" name="studentNumberLast4" type="text" inputmode="numeric" autocomplete="off" pattern="[0-9]{4}" minlength="4" maxlength="4" required>
        </div>
        <button class="primary" type="submit">Continue</button>
        <p id="identity-error" class="error-message" role="alert"></p>
      </form>
    </section>`;

  document.querySelector('#identity-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = document.querySelector('#identity-error');
    const button = event.currentTarget.querySelector('button');
    error.textContent = '';
    button.disabled = true;
    button.textContent = 'Opening…';
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = await request('/api/student/start', { method: 'POST', body: JSON.stringify(values) });
      record = result.record;
      step = Math.max(1, Math.min(5, record.currentStep || 1));
      if (result.recovered) showNotice('Welcome back—your saved responses have been restored.');
      setSaveStatus('Saved', 'saved');
      render();
      requestAnimationFrame(scrollToPageTop);
    } catch (requestError) {
      error.textContent = requestError.message;
      button.disabled = false;
      button.textContent = 'Continue';
    }
  });
}

function navButtons({ back = true, nextLabel = 'Continue', nextDisabled = false } = {}) {
  return `<div class="button-row">
    ${back ? '<button class="secondary" type="button" data-nav="back">Back</button>' : '<span></span>'}
    <div class="right"><button class="primary" type="button" data-nav="next" ${nextDisabled ? 'disabled' : ''}>${nextLabel}</button></div>
  </div>`;
}

function bindNavigation(validate) {
  document.querySelector('[data-nav="back"]')?.addEventListener('click', () => goToStep(step - 1));
  document.querySelector('[data-nav="next"]')?.addEventListener('click', () => {
    const message = validate?.();
    if (message) return showNotice(message);
    goToStep(step + 1);
  });
}

async function goToStep(nextStep) {
  step = Math.max(1, Math.min(5, nextStep));
  render();
  requestAnimationFrame(scrollToPageTop);
  scheduleSave({ currentStep: step });
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function renderStreams() {
  const selected = record.streamRanking || [];
  app.innerHTML = `<section class="panel">
    <div class="section-heading"><div><div class="eyebrow">Step 4 of 5</div><h2>Choose how you want to investigate your topic</h2><p>A stream is the approach you will use to investigate whichever topic is assigned. Read all three descriptions and watch the optional context videos before ranking them.</p></div><span class="count-badge">Rank all 3</span></div>
    <div class="stream-grid">${content.streams.map((stream) => `<article class="stream-card"><h3>${escapeHtml(stream.title)}</h3><p>${escapeHtml(stream.description)}</p><p class="details">${escapeHtml(stream.details)}</p><a class="video-link" href="${escapeHtml(stream.video.url)}" target="_blank" rel="noopener">Watch: ${escapeHtml(stream.video.label)} <span aria-hidden="true">↗</span></a></article>`).join('')}</div>
    <div class="rank-box"><h3>Your stream ranking</h3><p class="hint">Rank 1 is your first choice. Each stream can be used only once.</p>
      <div class="rank-selects">${[0, 1, 2].map((index) => `<label><span class="rank-label">Rank ${index + 1}</span><select data-stream-rank="${index}"><option value="">Choose a stream</option>${content.streams.map((stream) => `<option value="${stream.id}" ${selected[index] === stream.id ? 'selected' : ''}>${escapeHtml(stream.shortTitle)}</option>`).join('')}</select></label>`).join('')}</div>
      <p id="rank-error" class="error-message"></p>
    </div>${navButtons()}
  </section>`;

  document.querySelectorAll('[data-stream-rank]').forEach((select) => select.addEventListener('change', () => {
    const values = [...document.querySelectorAll('[data-stream-rank]')].map((item) => item.value).filter(Boolean);
    const error = document.querySelector('#rank-error');
    if (new Set(values).size !== values.length) {
      error.textContent = 'Each stream can appear only once in your ranking.';
      return;
    }
    error.textContent = '';
    record.streamRanking = values;
    scheduleSave({ streamRanking: values });
  }));
  bindNavigation(() => record.streamRanking.length === 3 ? '' : 'Please rank all three streams before continuing.');
}

function topicById(id) { return content.topics.find((topic) => topic.id === Number(id)); }

function renderRankedTopics() {
  if (!record.topicRanking.length) return '<div class="empty-state">Add five topics from the browser. Your first choice belongs at the top.</div>';
  return `<ol class="ranked-list">${record.topicRanking.map((id, index) => {
    const topic = topicById(id);
    return `<li class="ranked-item"><span class="rank-number">${index + 1}</span><span class="rank-title">${escapeHtml(topic.title)}</span><span class="rank-controls">
      <button class="rank-action" type="button" data-topic-move="up" data-index="${index}" aria-label="Move ${escapeHtml(topic.title)} up" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button class="rank-action" type="button" data-topic-move="down" data-index="${index}" aria-label="Move ${escapeHtml(topic.title)} down" ${index === record.topicRanking.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="rank-action" type="button" data-topic-remove="${id}" aria-label="Remove ${escapeHtml(topic.title)}">×</button>
    </span></li>`;
  }).join('')}</ol>`;
}

function topicCards() {
  const query = topicSearch.toLocaleLowerCase();
  const topics = content.topics.filter((topic) => !query || `${topic.title} ${topic.description}`.toLocaleLowerCase().includes(query));
  if (!topics.length) return '<div class="empty-state">No topics match that search.</div>';
  return topics.map((topic) => {
    const selected = record.topicRanking.includes(topic.id);
    return `<article class="topic-card"><div class="topic-head"><h3 class="topic-title"><span class="topic-number">${topic.id}.</span>${escapeHtml(topic.title)}</h3><button class="topic-add" type="button" data-topic-add="${topic.id}" ${selected || record.topicRanking.length >= 5 ? 'disabled' : ''}>${selected ? 'Selected' : 'Add'}</button></div>
      <p>${escapeHtml(topic.description)}</p><details><summary>Starting sources (${topic.sources.length})</summary><div class="source-links">${topic.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a>`).join('')}</div></details></article>`;
  }).join('');
}

function bindTopicControls() {
  document.querySelectorAll('[data-topic-add]').forEach((button) => button.addEventListener('click', () => {
    const id = Number(button.dataset.topicAdd);
    if (record.topicRanking.length >= 5 || record.topicRanking.includes(id)) return;
    record.topicRanking.push(id);
    scheduleSave({ topicRanking: record.topicRanking });
    preserveTopicPositionAndRender();
  }));
  document.querySelectorAll('[data-topic-remove]').forEach((button) => button.addEventListener('click', () => {
    record.topicRanking = record.topicRanking.filter((id) => id !== Number(button.dataset.topicRemove));
    scheduleSave({ topicRanking: record.topicRanking });
    preserveTopicPositionAndRender();
  }));
  document.querySelectorAll('[data-topic-move]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.index);
    const target = button.dataset.topicMove === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= record.topicRanking.length) return;
    [record.topicRanking[index], record.topicRanking[target]] = [record.topicRanking[target], record.topicRanking[index]];
    scheduleSave({ topicRanking: record.topicRanking });
    preserveTopicPositionAndRender();
  }));
}

function preserveTopicPositionAndRender() {
  topicListScroll = document.querySelector('.topic-list')?.scrollTop ?? topicListScroll;
  renderTopics();
  const list = document.querySelector('.topic-list');
  if (list) list.scrollTop = topicListScroll;
}

function renderTopics() {
  app.innerHTML = `<section class="panel">
    <div class="section-heading"><div><div class="eyebrow">Step 3 of 5</div><h2>Choose and rank five topics</h2><p>We will do our best to assign you to your first choice, but be prepared to work on any topic you include. Read the descriptions and three starting sources, add exactly five topics, then use the arrows to put your first choice at the top.</p></div><span class="count-badge">${record.topicRanking.length} of 5 selected</span></div>
    <div class="topic-layout">
      <aside class="ranked-topics"><h3>Your top five</h3>${renderRankedTopics()}<p id="topic-error" class="error-message" role="alert"></p></aside>
      <div class="topic-browser"><div class="field"><label for="topic-search">Search 60 topics</label><input id="topic-search" type="search" value="${escapeHtml(topicSearch)}" placeholder="Try migration, cancer, climate…"></div><div class="topic-list">${topicCards()}</div></div>
    </div>${navButtons({ nextLabel: 'Continue to streams' })}
  </section>`;
  const search = document.querySelector('#topic-search');
  search.addEventListener('input', () => {
    topicSearch = search.value;
    document.querySelector('.topic-list').innerHTML = topicCards();
    bindTopicControls();
  });
  bindTopicControls();
  document.querySelector('[data-nav="back"]').addEventListener('click', () => goToStep(2));
  document.querySelector('[data-nav="next"]').addEventListener('click', () => {
    const error = document.querySelector('#topic-error');
    if (record.topicRanking.length !== 5) {
      error.textContent = 'You must choose five topics';
      document.querySelector('.ranked-topics').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    error.textContent = '';
    goToStep(4);
  });
}

function quizResultHtml() {
  if (!record.avengerResult) return '';
  const outcome = content.quiz.outcomes.find((item) => item.id === record.avengerResult);
  const maximum = Math.max(...Object.values(record.traitScores), 1);
  return `<article class="result-card"><div class="eyebrow">Your teamwork match</div><h3 class="result-name">${escapeHtml(outcome.name)}</h3><p class="jung-code">Jung-style preference code: <strong>${escapeHtml(outcome.jungType)}</strong></p><strong>${escapeHtml(outcome.tagline)}</strong><p>${escapeHtml(outcome.description)}</p><p class="hint"><strong>Watch-out:</strong> ${escapeHtml(outcome.watchOut)}</p>
    <div class="trait-bars">${content.quiz.traits.map((trait) => { const value = record.traitScores[trait.id] || 0; return `<div class="trait-row"><span>${escapeHtml(trait.name)}</span><span class="trait-track"><span class="trait-fill" style="width:${Math.round(value / maximum * 100)}%"></span></span><strong>${value}</strong></div>`; }).join('')}</div><p class="hint">The possible results include all nine characters from the referenced BuzzFeed quiz plus Black Panther from the course collaboration slides. The four-letter code is an informal educational interpretation, not a clinical or validated personality result.</p></article>`;
}

function renderQuiz() {
  app.innerHTML = `<section class="panel">
    <div class="section-heading"><div><div class="eyebrow">Step 1 of 5</div><h2>${escapeHtml(content.quiz.title)}</h2><p>${escapeHtml(content.quiz.intro)}</p><div class="learning-note"><strong>Why include this?</strong> Diverse teams can combine different strengths and compensate for individual blind spots. Five Captain Americas, for example, might create structure and follow through reliably—but could miss the experimentation, analysis, adaptability, or perspective that other Avengers contribute.</div></div><span class="count-badge">${Object.keys(record.quizAnswers).length} of ${content.quiz.questions.length}</span></div>
    <div class="question-list">${content.quiz.questions.map((question, index) => `<fieldset class="question-card"><legend><span class="question-number">Question ${index + 1}</span><br>${escapeHtml(question.prompt)}</legend><div class="option-grid">${question.options.map((option) => `<label class="choice"><input type="radio" name="${question.id}" value="${option.id}" ${record.quizAnswers[question.id] === option.id ? 'checked' : ''}><span>${escapeHtml(option.label)}</span></label>`).join('')}</div></fieldset>`).join('')}</div>
    <div id="quiz-result">${quizResultHtml()}</div>${navButtons({ back: false, nextLabel: 'Meeting preferences' })}
  </section>`;
  document.querySelectorAll('.question-card input').forEach((input) => input.addEventListener('change', async () => {
    record.quizAnswers[input.name] = input.value;
    document.querySelector('.count-badge').textContent = `${Object.keys(record.quizAnswers).length} of ${content.quiz.questions.length}`;
    try {
      await savePatch({ quizAnswers: record.quizAnswers });
      document.querySelector('#quiz-result').innerHTML = quizResultHtml();
    } catch { /* status and notice are handled by savePatch */ }
  }));
  bindNavigation(() => Object.keys(record.quizAnswers).length === content.quiz.questions.length ? '' : 'Please answer all teamwork questions before continuing.');
}

function renderPreferences() {
  const formatOptions = [
    ['in-person', 'In-person meetings'], ['online', 'Online meetings'], ['no-preference', 'No preference / either works']
  ];
  const timeOptions = [
    ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening'], ['flexible', 'Flexible / no strong preference']
  ];
  app.innerHTML = `<section class="panel">
    <div class="section-heading"><div><div class="eyebrow">Step 2 of 5</div><h2>How do you prefer to work together?</h2><p>These preferences will help us avoid forming groups whose basic meeting needs are incompatible.</p></div></div>
    <div class="preference-grid">
      <fieldset class="preference-group"><legend>Preferred meeting format</legend>${formatOptions.map(([id, label]) => `<label class="choice"><input type="radio" name="meetingFormat" value="${id}" ${record.meetingFormat === id ? 'checked' : ''}><span>${label}</span></label>`).join('')}</fieldset>
      <fieldset class="preference-group"><legend>Preferred meeting time</legend>${timeOptions.map(([id, label]) => `<label class="choice"><input type="radio" name="meetingTime" value="${id}" ${record.meetingTime === id ? 'checked' : ''}><span>${label}</span></label>`).join('')}</fieldset>
    </div>${navButtons({ nextLabel: 'Choose topics' })}
  </section>`;
  document.querySelectorAll('input[name="meetingFormat"]').forEach((input) => input.addEventListener('change', () => {
    record.meetingFormat = input.value; scheduleSave({ meetingFormat: input.value });
  }));
  document.querySelectorAll('input[name="meetingTime"]').forEach((input) => input.addEventListener('change', () => {
    record.meetingTime = input.value; scheduleSave({ meetingTime: input.value });
  }));
  bindNavigation(() => record.meetingFormat && record.meetingTime ? '' : 'Please answer both meeting-preference questions.');
}

function labelMeeting(value) {
  return ({ 'in-person': 'In-person', online: 'Online', 'no-preference': 'No preference', morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible' })[value] || value;
}

function renderReview() {
  const outcome = content.quiz.outcomes.find((item) => item.id === record.avengerResult);
  app.innerHTML = `<section class="panel">
    <div class="section-heading"><div><div class="eyebrow">Step 5 of 5</div><h2>Review your project preferences.</h2><p>You can go back and revise anything. Submitting confirms that these are the preferences you want used for group formation.</p></div></div>
    ${record.submittedAt ? `<div class="submitted-banner"><strong>Submitted.</strong> Your preferences were submitted on ${new Date(record.submittedAt).toLocaleString()}. You may still revise and resubmit them.</div>` : ''}
    <div class="review-grid">
      <article class="review-card"><h3>Teamwork style</h3><strong>${escapeHtml(outcome?.name || 'Not complete')}</strong><p>${escapeHtml(outcome?.jungType || '')} · ${escapeHtml(outcome?.tagline || '')}</p></article>
      <article class="review-card"><h3>Meeting preferences</h3><ul><li>${escapeHtml(labelMeeting(record.meetingFormat))}</li><li>${escapeHtml(labelMeeting(record.meetingTime))}</li></ul></article>
      <article class="review-card"><h3>Topic ranking</h3><ol>${record.topicRanking.map((id) => `<li>${escapeHtml(topicById(id)?.title || id)}</li>`).join('')}</ol></article>
      <article class="review-card"><h3>Stream ranking</h3><ol>${record.streamRanking.map((id) => `<li>${escapeHtml(content.streams.find((item) => item.id === id)?.title || id)}</li>`).join('')}</ol></article>
    </div>
    <div class="button-row"><button class="secondary" type="button" data-nav="back">Back</button><div class="right"><button id="submit-responses" class="primary" type="button">${record.submittedAt ? 'Resubmit updated responses' : 'Submit preferences'}</button></div></div>
    <p id="submit-error" class="error-message" role="alert"></p>
  </section>`;
  document.querySelector('[data-nav="back"]').addEventListener('click', () => goToStep(4));
  document.querySelector('#submit-responses').addEventListener('click', async (event) => {
    const error = document.querySelector('#submit-error');
    error.textContent = '';
    event.currentTarget.disabled = true;
    event.currentTarget.textContent = 'Submitting…';
    try {
      await saveChain;
      const result = await request('/api/student/submit', { method: 'POST', body: '{}' });
      record = result.record;
      setSaveStatus('Submitted', 'saved');
      renderReview();
      requestAnimationFrame(scrollToPageTop);
    } catch (submitError) {
      error.textContent = submitError.message;
      event.currentTarget.disabled = false;
      event.currentTarget.textContent = 'Submit preferences';
    }
  });
}

function render() {
  if (!record) return renderWelcome();
  renderProgress();
  ({ 1: renderQuiz, 2: renderPreferences, 3: renderTopics, 4: renderStreams, 5: renderReview })[step]();
}

function renderAdminLogin(message = '') {
  instructorContent.innerHTML = `<h2>Course instructor</h2><p class="hint">Enter the instructor password configured in Railway.</p><form id="admin-login"><div class="field"><label for="admin-password">Password</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required></div><button class="primary" type="submit">Sign in</button><p class="error-message">${escapeHtml(message)}</p></form>`;
  document.querySelector('#admin-login').addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await request('/api/admin/login', { method: 'POST', body: JSON.stringify(values) });
      renderAdminDashboard();
    } catch (error) { renderAdminLogin(error.message); }
  });
}

async function renderAdminDashboard() {
  try {
    const summary = await request('/api/admin/summary');
    instructorContent.innerHTML = `<h2>Course instructor</h2><div class="review-grid"><div class="review-card"><span class="admin-stat">${summary.total}</span><br><span class="hint">started</span></div><div class="review-card"><span class="admin-stat">${summary.submitted}</span><br><span class="hint">submitted</span></div></div><h3>Export responses</h3><p>In-progress autosaves are included and clearly labelled.</p><p><a class="primary" href="/api/admin/submissions.csv">Download CSV</a></p><div class="danger-zone"><h3>Reset submissions</h3><p class="hint">This permanently removes every saved and submitted response. Download the CSV first if you may need the data.</p><form id="admin-reset"><div class="field"><label for="reset-confirmation">Type RESET to confirm</label><input id="reset-confirmation" name="confirmation" type="text" autocomplete="off" required></div><button class="danger-button" type="submit">Delete all submissions</button><p id="reset-error" class="error-message" role="alert"></p></form></div><button id="admin-logout" class="text-button" type="button">Sign out</button>`;
    document.querySelector('#admin-reset').addEventListener('submit', async (event) => {
      event.preventDefault();
      const error = document.querySelector('#reset-error');
      const values = Object.fromEntries(new FormData(event.currentTarget));
      error.textContent = '';
      try {
        const result = await request('/api/admin/reset', { method: 'POST', body: JSON.stringify(values) });
        showNotice(`${result.removed} submission${result.removed === 1 ? '' : 's'} removed.`);
        renderAdminDashboard();
      } catch (resetError) { error.textContent = resetError.message; }
    });
    document.querySelector('#admin-logout').addEventListener('click', async () => { await request('/api/admin/logout', { method: 'POST', body: '{}' }); renderAdminLogin(); });
  } catch { renderAdminLogin(); }
}

document.querySelector('#instructor-open').addEventListener('click', () => {
  renderAdminDashboard();
  instructorDialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => instructorDialog.close());
instructorDialog.addEventListener('click', (event) => { if (event.target === instructorDialog) instructorDialog.close(); });

async function init() {
  try {
    content = await request('/api/content');
    try {
      const result = await request('/api/student');
      record = result.record;
      step = Math.max(1, Math.min(5, record.currentStep || 1));
      setSaveStatus(record.submittedAt ? 'Submitted' : 'Saved', 'saved');
    } catch { record = null; }
    render();
  } catch (error) {
    app.innerHTML = `<section class="panel"><h1>Unable to start</h1><p>${escapeHtml(error.message)}</p></section>`;
  }
}

init();
