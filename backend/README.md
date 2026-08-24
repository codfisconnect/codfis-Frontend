# Codfis Local Backend

This is a minimal Express + SQLite backend used by the frontend for lead management and admin dashboard during local development.

Setup

1. Copy and edit `.env.example` to `.env` and set `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASS` if desired.
2. Install dependencies and run:

```bash
cd backend
npm install
npm start
```

By default the server listens on `http://localhost:4000` and exposes the following endpoints used by the frontend:

- `POST /api/auth/login` — admin login (body: `{ userId, password }`)
- `POST /api/enquiries` — submit business enquiry
- `GET /api/enquiries` — get enquiries (requires `Authorization: Bearer <token>`)
- `POST /api/enquiries/:id/status` — update status (admin)
- `POST /api/demo` — submit free demo request
- `POST /api/contact` — submit contact form
- `POST /api/courses/student/enroll` — student enroll (mirrors previous endpoint)
- `POST /api/courses/trainer/apply` — trainer apply
- `GET /api/stats` — basic counts (admin)

Data is stored in `backend/data.db` (SQLite). The server seeds an admin account from `.env` on first run.
