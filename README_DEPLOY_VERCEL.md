Vercel deployment guide — BudgetBox
=================================

This repository contains a Next.js frontend (in `frontend/`) and an Express + Prisma backend (in `backend/`).

Quick summary of recommended deployment approach
- Deploy the frontend to Vercel (recommended). The frontend is a Next.js app and works natively on Vercel.
- Deploy the backend to a separate server (Render, Railway, Fly, Heroku, etc.) because the backend uses Prisma and a writable SQLite database in development. For production use, provision a managed PostgreSQL or MySQL and point Prisma to it.

Option A — Fast (recommended) — Frontend on Vercel, Backend on Render/Railway
1. Push your repo to GitHub (already done).
2. Frontend (Vercel):
   - Go to https://vercel.com and create a new project connected to your GitHub repo.
   - Set the Root Directory to `frontend` (so Vercel builds the Next app there).
   - In Project Settings -> Environment Variables, set:
     - `NEXT_PUBLIC_API_URL` = `https://<your-backend-url>` (the HTTPS URL where your backend will be hosted)
   - Deploy — Vercel will run `npm install` and `npm run build` in `/frontend`.

3. Backend (Render / Railway / Heroku):
   - Create a new Node service. Point it to the `backend/` folder.
   - Add environment variables:
     - `DATABASE_URL` — a connection string to a managed database (Postgres/MySQL). If you want to use SQLite for quick testing, keep current local setup but note that serverless hosts won't persist the DB between deploys.
   - Run `npm install` and `npx prisma migrate deploy` (or `npx prisma migrate dev` for development) on the host to apply migrations and generate the Prisma client.
   - Start the app with `npm run start` or `npm run dev` depending on the host's configuration.

4. In Vercel Project env, set `NEXT_PUBLIC_API_URL` to the backend URL (e.g. `https://my-backend.onrender.com`).

Option B — Single deployment on Vercel (advanced)
- You can migrate backend routes into Next.js API routes under `frontend/app/api` to run both frontend and APIs on Vercel. This requires:
  - Moving/pruning the Express code into Next API handlers.
  - Reconfiguring Prisma to use a production DB (PlanetScale, Neon, etc.) and using the Prisma Data Proxy or an external database — Vercel serverless functions are not a good fit for a local SQLite file.

Vercel CLI quick commands
-------------------------
Install and login:

  npm i -g vercel
  vercel login

From `frontend/` directory you can deploy manually:

  cd frontend
  vercel --prod

Troubleshooting and notes
- If you get Prisma permission or connection errors on the host, verify `DATABASE_URL` and that migrations were applied.
- For immediate local testing on Vercel preview builds, ensure `NEXT_PUBLIC_API_URL` points to a reachable backend preview URL.

If you'd like, I can:
- Create a small `frontend/vercel.json` and a minimal `README.md` in the repo that documents env vars and build steps.
- Migrate the current Express endpoints into Next.js API routes so both frontend and backend can live on Vercel (this is a larger change — I can implement it if you want).
