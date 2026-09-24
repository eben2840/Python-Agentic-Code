# Dartantic + Flutter Architecture Note

Prepared: 2026-08-27

## Decision

Use Dartantic inside the Flutter app if the goal is to avoid hosting a separate backend.

In that setup, Dart Frog is not required.

## Final Target Flow

```text
Flutter app
  -> Dartantic agent running inside Flutter
  -> FHIR HTTP calls from Dart code
  -> AI-generated result/view shown inside Flutter
  -> save result metadata/data through a safe Postgres API layer
```

## What Dartantic Does

Dartantic handles the AI workflow inside Dart code.

It can:

- Run an AI agent from Flutter/Dart.
- Give the agent instructions.
- Register tools/functions the agent can call.
- Use a FHIR tool written in Dart to fetch patient data.
- Let the model decide when FHIR data is needed.
- Return a generated result that Flutter can display directly.

In this plan, the "FHIR tool" is not a separate product. It is just a Dart function registered with Dartantic.

Example concept:

```text
Dartantic agent
  -> getFhirData tool
  -> Smile CDR / FHIR API
  -> returns FHIR JSON
  -> agent builds response/view
```

## What Dart Frog Does

Dart Frog is a Dart backend framework.

It is useful when Flutter needs to call a hosted API endpoint.

Example:

```text
Flutter
  -> POST https://your-backend.com/api/generate
  -> Dart Frog server
  -> Dartantic/FHIR logic
  -> DB/storage
  -> response back to Flutter
```

That requires hosting the Dart Frog server somewhere.

## Why Dart Frog Is Not Needed For This Direction

You said the important goal is that Dartantic runs inside the app code so you do not have to host anything.

That means:

- Flutter can call Dartantic directly.
- Flutter can call FHIR directly using the user's access token.
- The generated result can be displayed inside Flutter.
- There is no need for a backend-generated mini-app URL.
- There is no need for a Dart Frog API route just to run the AI logic.

So the simplified conclusion is:

```text
Dartantic inside Flutter = no hosted Dart Frog backend required.
```

## What Changes From The Current Flask Backend

The current Flask backend does several server-side jobs:

- Receives `/api/quick/generate` requests.
- Fetches FHIR data.
- Runs the LLM generation.
- Creates task records.
- Saves generated HTML/CSS/JS.
- Returns a task/status URL.
- Serves preview/raw mini-app URLs.
- Handles questionnaire submission routes.

If Dartantic runs inside Flutter, you do not need to copy all of that exactly.

The old backend flow was:

```text
Flutter
  -> Flask backend
  -> FHIR fetch
  -> LLM generates HTML/CSS/JS
  -> backend stores generated files
  -> backend returns mini-app URL
```

The new flow can be:

```text
Flutter
  -> Dartantic inside Flutter
  -> FHIR fetch
  -> generated result shown inside Flutter
  -> save result/metadata to Postgres API layer
```

## Postgres Warning

Do not connect Flutter directly to raw Postgres in production.

That would expose database credentials in the mobile app and make security hard.

Use one of these instead:

```text
Flutter -> Supabase API -> Postgres
```

or

```text
Flutter -> PostgREST/API layer -> Postgres
```

or, only if you later accept hosting:

```text
Flutter -> Dart Frog backend -> Postgres
```

## Recommended Stack

For your stated goal:

```text
Flutter
Dartantic
FHIR HTTP calls
Supabase/PostgREST or another safe Postgres API layer
```

No Dart Frog.

## When To Add Dart Frog Later

Add Dart Frog only if you later need:

- A hosted API endpoint for Flutter.
- Server-side secrets.
- Central background jobs.
- Server-side task queues.
- Server-generated preview URLs.
- Shared logic across many clients.
- Direct server-side Postgres access.

## Clean Summary

Dartantic is enough for the AI/FHIR workflow if it runs inside Flutter and the result stays inside Flutter.

Dart Frog is only needed if you want a hosted backend API.

For your current direction:

```text
Use Dartantic.
Do not use Dart Frog.
Use a safe API layer for Postgres.
```
