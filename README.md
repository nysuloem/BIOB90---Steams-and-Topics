# Tell Us About YOU Survey

A single Railway-ready BIOB90 survey for collecting the information needed to form project groups, in this order:

- Quercus name and only the last four digits of the student number
- an original, getaway-themed Avengers teamwork quiz
- preferred meeting format and time of day
- ranked top five from 60 potential topics
- complete ranking of the three BIOB90 streams, with optional context videos
- autosaved, recoverable responses
- password-protected CSV export and submission reset for the course instructor

The app has no third-party runtime dependencies. It uses Node's built-in HTTP, file-system, and cryptography modules, avoiding native modules that can fail to compile or crash on Railway.

## Railway setup

1. Create a Railway service from this GitHub repository.
2. Attach a persistent volume mounted at `/data`.
3. Add these variables:

   - `INSTRUCTOR_PASSWORD`: the password for the instructor export
   - `SESSION_SECRET`: a long, random value used to sign login sessions
   - `DATA_DIR=/data`

4. Railway will detect `railway.json`, run `npm start`, and check `/health`.

Optional variable:

- `SURVEY_CLOSED=true` prevents students from changing or submitting responses while retaining instructor export access.

## Instructor export

Select **Course instructor** at the bottom of the app, enter `INSTRUCTOR_PASSWORD`, and download the CSV. It includes submitted and in-progress autosaves, raw quiz responses, the calculated Avenger, Jung-style code, and five teamwork trait scores for later group formation.

The same screen can permanently remove all responses for testing. The instructor must type `RESET` before the server will accept this action. Download the CSV first if the test data may be needed.

## Local development

```bash
npm start
```

Open `http://localhost:3000`.

Run the integration test with:

```bash
npm test
```

## Data handling

Responses are stored in `/data/submissions.json` on Railway. Full student numbers are never requested or stored. A one-way key derived from the Quercus name and last four digits is used to find an autosave. Writes are serialized and use an atomic temporary-file replacement so a partially written file cannot corrupt the response set. Keep the Railway volume attached whenever the service is redeployed.

The Avengers quiz is an unofficial educational teamwork activity. Its questions and scoring are original and are not copied from the linked BuzzFeed quiz. It includes all nine BuzzFeed outcomes plus Black Panther from the course collaboration slides; the four-letter codes are educational interpretations rather than validated psychological results.
