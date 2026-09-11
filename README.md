# Prospera Hub

Empowering African entrepreneurs with grants, transparent savings, AI guidance, and peer supplier networking.

## Hackathon team roles

| Member | Role | Works in |
|--------|------|----------|
| Frontend | All React UI - pages, components, styling | `src/pages`, `src/components` |
| Backend | Express server, routes, auth/security | `server/controllers`, `server/middleware` |
| API | AI chatbot, grant fetching, external integrations | `server/controllers/ai.js`, `src/api/client.js` |
| Database | Schema, models, seed data, queries | `db/`, `server/models` |

## Tech stack

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (see `db/schema.sql`)

## Getting started

```bash
# 1. Install dependencies
npm install
npm run server:install        # installs backend deps

# 2. Create your env files (ask a teammate for the template)
#    - server/.env  (PORT, JWT_SECRET, API keys)
#    - root .env    (VITE_API_URL)

# 3. Run frontend + backend together
npm run dev:all

# or separately
npm run dev        # frontend at http://localhost:5173
npm run server     # backend at http://localhost:5000
```

## Feature modules

- **Grants** (`/grants`) - discover funding, check eligibility
- **Susu Savings** (`/savings`) - transparent group savings circles
- **Peer Supplier** (`/suppliers`) - group buying for bulk discounts
- **Finance** (`/finance`) - income/expense tracking + AI reports
- **AI Coach** (`/ai-chat`) - voice & text business assistant

## Git workflow (avoid conflicts!)

Each person works in **their own folder** so you never collide:

1. `git pull` before starting work
2. `git checkout -b <your-feature>` to create a working branch
3. Commit + push your branch
4. Open a Pull Request on GitHub and merge into `main`
5. `git pull` again after merging

Never commit `.env` files or API keys. They're already gitignored.

API endpoint reference: see `server/routes/` for the routes and the React API client in `src/api/client.js`.