# JavaScript Starter

Minimal JS skeleton project with a runnable plan-picker page.

## Quick start

```bash
npm install
npm start
```

`npm start` spins up a tiny static server on http://localhost:3000 and serves `home/index.html`.
Open that URL to interact with the plan-selection UI for setting up meter projects.

## Deploy on Vercel

This repo is configured for Vercel using:

- `api/index.js` as the serverless entrypoint
- `vercel.json` rewrite so every route is handled by the same Node handler
- `home/**` bundled into the function so static pages/assets still work

Deploy:

```bash
vercel
vercel --prod
```

Recommended environment variables on Vercel:

```bash
UPSTREAM_AUTH_TOKEN=...
AUTH_SESSION_HOURS=8
AUTH_RESET_MINUTES=15
RESEND_API_KEY=...
AUTH_MAIL_FROM=no-reply@your-domain.com
```

Notes:

- Local fallback user storage uses `/tmp/ppade-data/users.json` on Vercel (ephemeral, not persistent).
- For production, prefer upstream auth/users APIs as the source of truth.

## Authentication (Login only)

This project now uses session-based authentication.

- No sign-up page
- Users must be pre-added by admin (`/api/users`)
- Forgot password sends reset link by email

### Add a user

```bash
npm run add-user -- --email user@example.com --password YourPassword --name "Display Name"
```

### Auth routes

- Login page: `/login/index.html`
- Forgot password page: `/login/forgot-password.html`
- Reset password page: `/login/reset-password.html`

### Upstream API integration

- Login validates credentials against `https://solarmdb.devonix.co.th/api/auth/login`
- User profile resolves from `https://solarmdb.devonix.co.th/api/users`

### Email config for forgot password

Set environment variables before `npm start`:

```bash
export RESEND_API_KEY="your_resend_api_key"
export AUTH_MAIL_FROM="no-reply@your-domain.com"
```

Optional:

```bash
export AUTH_MAIL_API_URL="https://api.resend.com/emails"
export AUTH_DEV_RESET_LOG="true"
```

If email config is missing, reset links will be logged in server console (for development only).

## Plan picker page

Open `home/index.html` in a browser to view the plan-selection UI for starting meter projects.

## Linting

ESLint is included. Run:

```bash
npm run lint
```
