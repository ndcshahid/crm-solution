# CRM Solution

A complete, production-ready CRM built with **Next.js 14**, **TypeScript**, **Prisma**, **PostgreSQL**, and **NextAuth**.

---

## Features

- **Authentication** — JWT sessions, bcrypt password hashing, per-role permissions
- **5 Access Levels** — Super Admin, Admin, Sales Manager, Sales Executive, Viewer
- **Multi-Company** — Super Admin manages multiple companies; users are scoped to their own
- **Leads** — Full CRUD, search, filter, pagination, assign to user/team
- **Pipeline** — Drag-and-drop Kanban board (HTML5 native drag API)
- **Follow-Ups** — Tabbed view (Today / Upcoming / Overdue / All), mark complete/missed
- **Appointments** — Schedule, update status, meeting types
- **Reports** — Overview, pipeline by stage, leads by source, team performance
- **Users** — Create, edit, activate/deactivate, role assignment
- **Teams** — Create teams, assign managers and members
- **Settings** — Company info, permissions matrix view
- **Profile** — Edit own name/phone/password

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/crm_solution"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Set Up the Database

```bash
# Generate Prisma client
npm run db:generate

# Create tables (choose one)
npm run db:push      # fast, no migration history
# OR
npm run db:migrate   # generates migration files

# Seed with demo data
npm run db:seed
```

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

All passwords: **`Admin@123`**

| Email                  | Role              | Access                              |
|------------------------|-------------------|-------------------------------------|
| superadmin@crm.com     | Super Admin       | Everything, all companies           |
| admin@crm.com          | Admin             | Full company access (TechCorp)      |
| manager@crm.com        | Sales Manager     | Team Alpha leads + reports          |
| exec@crm.com           | Sales Executive   | Own assigned leads only             |
| viewer@crm.com         | Viewer            | Dashboard + reports, read-only      |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, signup, forgot password
│   ├── (dashboard)/        # All protected pages
│   │   ├── dashboard/      # Stats, charts, activity
│   │   ├── leads/          # Lead management
│   │   ├── pipeline/       # Kanban board
│   │   ├── follow-ups/     # Follow-up tracking
│   │   ├── appointments/   # Appointment scheduling
│   │   ├── reports/        # Analytics & reporting
│   │   ├── users/          # User management
│   │   ├── teams/          # Team management
│   │   ├── companies/      # Company management (super admin)
│   │   ├── settings/       # Company settings
│   │   └── profile/        # Own profile
│   └── api/                # REST API routes (all protected)
├── components/
│   ├── layout/             # Sidebar, Topbar
│   └── ui/                 # Badge, Avatar, Modal, Loading, PermGuard
├── lib/
│   ├── auth.ts             # requireAuth, requirePermission, buildLeadFilter
│   ├── prisma.ts           # Prisma singleton
│   └── utils.ts            # Formatting helpers, constants
├── types/                  # TypeScript types
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Demo data
```

---

## Security

- All API routes use `requireAuth()` — unauthenticated requests get 401
- Permission checks via `requirePermission()` — insufficient permission gets 403
- `buildLeadFilter()` scopes database queries by role (data never leaks across companies)
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 30 days
- Dashboard layout redirects to `/login` server-side if no session

---

## Deploy to Vercel

1. Push to GitHub
2. Connect repo in Vercel
3. Add environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Run `npm run db:migrate` against your production DB
5. Deploy
