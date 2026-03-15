# MIET ERP — College ERP System

A full-stack College ERP system built for MIET, handling student academics, attendance, examination control, results, and role-based portals.

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18 + Vite + TailwindCSS |
| Backend   | Node.js + Express 5 |
| ORM       | Prisma 5 |
| Database  | SQLite |
| Auth      | JWT (8-hour sessions) |

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

---

## Getting Started

### 1. Clone and install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment variables

```bash
# Backend
cd server
copy .env.example .env
# Edit .env and set JWT_SECRET to a strong random value

# Frontend
cd ../client
copy .env.example .env
# Edit VITE_API_URL if not using localhost
```

### 3. Set up the database

```bash
cd server
npm run migrate     # Run Prisma migrations
npm run generate    # Generate Prisma client
```

### 4. Seed initial data (first time only)

```bash
cd server
node seed.js        # Creates admin user and sample data
```

### 5. Start the servers

```bash
# Terminal 1 — Backend (with hot reload)
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Backend runs on: `http://localhost:3000`
Frontend runs on: `http://localhost:5173`

---

## Default Login Credentials

| Role    | Username | Password |
|---------|----------|----------|
| Admin   | admin    | admin123 |

> Faculty and student accounts are created through the admin panel.
> Student default password is their Date of Birth in `DDMMYYYY` format.

---

## Scripts

### Backend (`server/`)

| Script              | Description |
|---------------------|-------------|
| `npm run dev`       | Start with nodemon (hot reload) |
| `npm start`         | Start in production mode |
| `npm run migrate`   | Run pending Prisma migrations |
| `npm run studio`    | Open Prisma Studio (DB browser) |
| `npm run generate`  | Regenerate Prisma client after schema changes |

### Frontend (`client/`)

| Script           | Description |
|------------------|-------------|
| `npm run dev`    | Start Vite dev server |
| `npm run build`  | Build production bundle |
| `npm run preview`| Preview built bundle |

---

## Project Structure

```
fresh/
├── server/
│   ├── src/
│   │   ├── utils/          ← constants, helpers, logger, response formatter
│   │   └── middleware/     ← error handler, role guard, validate
│   ├── routes/             ← Express routers
│   ├── controllers/        ← Request handlers
│   ├── services/           ← Business logic + DB queries
│   ├── middleware/         ← Auth middleware (JWT)
│   ├── prisma/             ← schema.prisma + migrations
│   ├── uploads/            ← Uploaded student/faculty photos
│   ├── logs/               ← Daily log files (auto-created)
│   └── index.js            ← Entry point
│
└── client/
    └── src/
        ├── api/            ← Axios instance
        ├── config/         ← Sidebar menu config
        ├── components/     ← Shared UI components
        ├── context/        ← AuthContext
        ├── pages/          ← Page components by role
        └── utils/          ← constants, helpers, validators
```

---

## User Roles

| Role           | Portal | Description |
|----------------|--------|-------------|
| ADMIN          | /admin | Full system access |
| HOD            | /hod   | Department management + faculty features |
| FACULTY        | /faculty | Teaching features |
| STUDENT        | /student | Read-only academic portal |
| PRINCIPAL      | /principal | College-wide read-only overview |
| COE            | /coe   | Examination control read-only |
| EXTERNAL_STAFF | /external | External mark entry only |

---

## Notes

- Database engine is SQLite (production migration to PostgreSQL is a separate step)
- All uploaded files are stored in `server/uploads/`
- Log files are written to `server/logs/YYYY-MM-DD.log`
- Never commit `.env` — only `.env.example` is in version control
