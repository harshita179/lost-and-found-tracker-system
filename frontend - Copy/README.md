# Frontend

This React app supports two delivery targets:

- Standard web deployment
- Android WebView app via Capacitor

## Web development

```bash
npm start
```

The app runs on `http://localhost:3000`.

## Android WebView app

The Android wrapper lives in [android](./android) and loads the built React app inside a native WebView.

Before creating a production mobile build, set:

```env
REACT_APP_API_URL=https://your-backend-domain.com
```

You can place that in `.env.production`.

Useful commands:

```bash
npm run build
npm run mobile:sync
npm run mobile:build
npm run mobile:open
```

`mobile:build` rebuilds the web app and syncs it into the Android project.

## Testing

```bash
npm test
```
