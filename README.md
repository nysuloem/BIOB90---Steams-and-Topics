# BIOB90 Streams, Topics & Teams

A single Railway-ready workflow for collecting the information needed to form BIOB90 project groups:

- Quercus name and student number
- complete ranking of the three BIOB90 streams
- ranked top five from 60 potential topics
- an original, getaway-themed Avengers teamwork quiz
- preferred meeting format and time of day
- autosaved, recoverable responses
- password-protected CSV export for the course instructor

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

Select **Course instructor** at the bottom of the app, enter `INSTRUCTOR_PASSWORD`, and download the CSV. It includes submitted and in-progress autosaves, raw quiz responses, the calculated Avenger, and five teamwork trait scores for later group formation.

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

Responses are stored in `/data/submissions.json` on Railway. Writes are serialized and use an atomic temporary-file replacement so a partially written file cannot corrupt the response set. Keep the Railway volume attached whenever the service is redeployed.

The Avengers quiz is an unofficial educational teamwork activity. Its questions and scoring are original and are not copied from the linked BuzzFeed quiz.
