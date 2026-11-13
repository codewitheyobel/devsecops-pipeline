# devsecops-pipeline

A small Node.js + Express API with a secure CI/CD pipeline in GitHub Actions
(Assignment 6 - CI/CD Security).

## API

| Method | Path                     | Description                                  |
|--------|--------------------------|----------------------------------------------|
| GET    | `/health`                | Health check                                 |
| GET    | `/api/items`             | List items                                   |
| GET    | `/api/items/:id`         | Get one item                                 |
| POST   | `/api/items`             | Create an item (`{ "name": "...", "price": 1 }`) |
| GET    | `/api/users/search?name=`| Search users in PostgreSQL (parameterized query) |
| GET    | `/api/users/by-email?email=` | Look up a user by e-mail (parameterized query) |

```bash
npm ci
npm test        # node:test + supertest (no real database needed)
npm run lint    # ESLint
npm run build   # no compile step: smoke check that starts the app and calls /health
npm start       # needs DATABASE_URL for the /api/users endpoints (see .env.example)
```

## Pipeline

`.github/workflows/ci.yml` (on every push and every pull request to `main`):

1. **Build & Test** - checkout, Node.js 22, `npm ci`, tests, lint, build check
2. **Secret scan (gitleaks)** - scans every new commit for secrets
3. **Dependency scan (npm audit)** - full report + gate on high/critical production advisories

`.github/workflows/codeql.yml`:

4. **SAST (CodeQL)** - GitHub code scanning, results in the Security tab, gate on high/critical findings

`main` is protected: a change can only arrive through a pull request, and all
four checks above must pass before it can be merged (administrators included).

No real credentials live in this repository. Runtime secrets such as
`DATABASE_URL` come from the environment (local `.env`, git-ignored) or from
GitHub Actions secrets.
