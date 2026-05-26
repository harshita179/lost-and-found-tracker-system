# Android WebView Deployment

This project has been wrapped as an Android WebView app using Capacitor.

## Location

- React frontend: `frontend/`
- Android wrapper: `frontend/android/`
- Capacitor config: `frontend/capacitor.config.ts`

## One-time setup

1. Deploy the backend API to a public URL.
2. Copy `frontend/.env.production.example` to `frontend/.env.production`.
3. Set `REACT_APP_API_URL` to your deployed backend URL.

Example:

```env
REACT_APP_API_URL=https://api.yourdomain.com
```

## Build the Android app

From `frontend/`:

```bash
npm run mobile:build
```

This will:

1. Create the React production build in `frontend/build`
2. Sync that build into the Android WebView project

## Open in Android Studio

From `frontend/`:

```bash
npm run mobile:open
```

Then in Android Studio:

1. Let Gradle finish syncing
2. Use `Build > Build Bundle(s) / APK(s) > Build APK(s)` for an APK
3. Use `Build > Generate Signed Bundle / APK` for Play Store release output

## Important note

If `REACT_APP_API_URL` is not set, the app falls back to `http://localhost:5000`, which only works for local development and will not work on a real phone.
