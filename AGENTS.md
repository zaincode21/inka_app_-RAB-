# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
- The active product is an **Expo / React Native app** named `inka` at the repository root (`App.tsx`, `index.ts`, `screens/`, `components/`, `navigation/`). It is a dairy & beef farming companion UI.
- `Urwuri/` is a **separate legacy native Android (Java/Gradle) project** (`inka_app_v01`). It is not part of the JS/Expo app and is not needed to run or test the Expo app.
- The app is **UI-only**: there is no backend. Login/sign-up navigation is mocked (e.g. the Login button just navigates to `Dashboard`) and dashboard/cattle data is static.

### Running (dev)
- Package manager is **npm** (`package-lock.json`). Node 22 works.
- In a headless VM, run the **web** target: `npx expo start --web --port 8081` (Metro bundler serves at `http://localhost:8081`). Scripts in `package.json`: `npm run web`, `start`, `android`, `ios`.
- First page load triggers a Metro web bundle (~700 modules), which takes a few seconds; the terminal prints `Web Bundled ... index.ts` when ready.

### Lint / typecheck / test
- Typecheck: `npx tsc --noEmit` (config in `tsconfig.json`, extends `expo/tsconfig.base`, strict mode).
- There is **no ESLint config, no `lint` script, and no test script/framework** configured in this repo. Do not assume `npm test`/`npm run lint` exist.
