# SentinelX — Frontend

React 19 + Vite + Tailwind CSS v4 dashboard UI for SentinelX. This package is
frontend-only: all data on the dashboard pages comes from `src/data/mockData.ts`.
Only the login screen talks to a real service (Google).

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Configure Google Sign-In

The login screen needs a Google OAuth **Client ID**. Without it, the Google
button is replaced with a "not configured" notice and the app still works via
the demo email/password accounts below.

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create a project (or pick an existing one), then **Create Credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins**, add every origin you'll load the app from, exactly, with no trailing slash:
   - `http://localhost:5173` (Vite's default dev port)
   - your Netlify URL, e.g. `https://your-site.netlify.app`
   - your Vercel URL, e.g. `https://your-site.vercel.app`
   - any custom domain you attach later
4. No redirect URI is needed — Google Identity Services authenticates in-page.
5. Copy the generated Client ID into `.env` (local) or your host's environment
   variables (deployed):
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
   ```
6. Redeploy after adding/changing the env var — Vite bakes `VITE_*` vars in at
   build time, so the site must rebuild to pick up a new value.

If you later deploy to a new domain, add that domain to the same "Authorized
JavaScript origins" list — Google rejects the button on any origin it doesn't
recognize.

## Demo email/password accounts

No backend exists yet, so the password form checks against a local list in
`src/lib/auth.ts`:

| email | password | role |
|---|---|---|
| p.sharma@campus.edu | admin123 | Administrator |
| k.nair@campus.edu | security123 | Security Officer |
| m.iyer@campus.edu | analyst123 | Analyst |
| a.rao@campus.edu | staff123 | Staff |
| r.verma@campus.edu | student123 | Student |

## Deploy to Netlify

**Option A — Netlify UI**
1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. [New site from Git](https://app.netlify.com/start) → pick the repo. Build settings are already set via `netlify.toml` (`npm run build`, publish `dist`).
3. Site settings → Environment variables → add `VITE_GOOGLE_CLIENT_ID`.
4. Deploy, then add the resulting `https://<site-name>.netlify.app` URL to Google's Authorized JavaScript origins (see above) and redeploy/trigger a new build.

**Option B — Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_GOOGLE_CLIENT_ID xxxxxxxxxx.apps.googleusercontent.com
netlify deploy --prod
```

## Deploy to Vercel

**Option A — Vercel UI**
1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. [New Project](https://vercel.com/new) → import the repo. Vercel auto-detects Vite; `vercel.json` pins the build command and output dir.
3. Project Settings → Environment Variables → add `VITE_GOOGLE_CLIENT_ID` (for Production, Preview, and Development as needed).
4. Deploy, then add the resulting `https://<project>.vercel.app` URL to Google's Authorized JavaScript origins and redeploy.

**Option B — Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel link
vercel env add VITE_GOOGLE_CLIENT_ID
vercel --prod
```

## Notes

- The Google credential is decoded client-side and trusted as-is — fine for
  this mock-data stage, but a real backend should verify the JWT signature
  server-side before treating it as an authenticated identity.
- Any Google account that isn't one of the three demo emails signs in with
  the `Student` role by default (see `resolveRole` in `src/lib/auth.ts`).
