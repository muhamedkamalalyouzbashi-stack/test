# ai for Teacher (MVP)

Teacher-focused AI Teaching Productivity Platform (browser-based), mit local-first Datenhaltung und serverseitigen AI-Routen.

## Features

- **Teacher-first Lesson Planner** mit Klassenstufe, Fach und Lernzielen.
- **Mehrsprachige UI** (Deutsch/Englisch) + Ausgabesprache für den AI-Output.
- **Local-first Standard**: Entwürfe werden in `localStorage` gespeichert.
- **Serverseitige AI-Route** (`/api/ai/generate`), damit API-Keys nicht im Frontend landen.
- **Fallback-Modus ohne API-Key** für lokale Entwicklung.

## Start

```bash
npm install
npm start
```

Dann öffnen: `http://localhost:3000`

## Environment (optional)

- `OPENAI_API_KEY` – aktiviert echte AI-Generierung über OpenAI Responses API.
- `OPENAI_MODEL` – optional, default `gpt-4.1-mini`.
- `PORT` – optional, default `3000`.

Ohne `OPENAI_API_KEY` liefert das Backend einen sinnvollen lokalen Demo-Output.

## Beispielmaterial

- Spielesammlung für *Genial! Mathematik 1*: `content/genial-mathematik1-spieleideen.md`
