# Lost and Found Application

This repository contains a lost and found application for Medipacs University.
The project uses a React frontend and a Node.js/Express backend with MongoDB for data storage.

## Structure

- `frontend/` - React application
- `backend/` - Node.js/Express server

## Getting Started

### Backend

1. Navigate to `backend`
2. Run `npm install`
3. Create a `.env` file based on the sample used in this repo
4. Start the server with `npm run dev` (requires nodemon) or `npm start`

### Frontend

1. Navigate to `frontend`
2. Run `npm install` (already done during creation)
3. Start development server with `npm start`

## Features

- Admin login
- Item listing and creation (to be implemented)

## Android WebView App

The frontend has been wrapped with Capacitor so it can be shipped as an Android WebView app.

See [WEBVIEW_DEPLOYMENT.md](./WEBVIEW_DEPLOYMENT.md) for the build flow.

## Next Steps

- Implement authentication with JWT
- Add item endpoints and React components
- Enhance admin panel
- Deploy to production
