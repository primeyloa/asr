# ASR

An Expo (React Native + TypeScript) prototype for a Twi automatic speech recognition (ASR) app. It demonstrates realtime microphone transcription, audio-file upload, transcript history with SQLite persistence, auth, and dialect switching — powered by a mock ASR engine that simulates streaming output from sample Twi phrases.

## Features

- **Realtime ASR** — simulated streaming transcription with mic input, word tokens, confidence scores, and English translation
- **Audio file upload** — pick an audio file and get a Twi transcript with English translation
- **History log** — browse, search, bookmark, and replay saved transcriptions persisted in SQLite
- **Dialects** — switch between Asante Twi, Akuapem, Fante, and general
- **Auth & lock** — sign in and lock the app with a PIN/biometrics
- **Export** — copy or download transcripts
- **Dark/light mode**

## Getting started

```bash
npm install
npm run start      # start Expo dev server
npm run android    # run on Android
npm run ios        # run on iOS
npm run web        # run in the browser
```

Must use Expo SDK 54-compatible tooling.

## Project structure

```
App.js                    # entry point
src/
  App.tsx                 # root component, navigation, app state
  components/             # screens and UI (realtime, history, modals, etc.)
  services/               # sqlite, auth, audio recorder, export, mock ASR engine
  data/mockData.ts        # sample Twi phrases and model info
  types.ts                # shared TypeScript types
```

## Notes

- The ASR engine (`src/services/twiAsrEngine.ts`) is a **simulation** — it streams tokens/words from predefined mock phrases rather than running a real model. The transcription/recording stack is wired up through `twiAsrEngine`, `audioRecorderService`, and `sqliteService` so a real inference backend can be dropped in later.