# Attendify

Attendify is a full-stack MERN employee attendance management system with role-based access for `admin`, `hr`, `manager`, and `employee`.

## Features

- JWT-based authentication with protected routes
- Employee management with activation and deactivation
- Daily attendance check-in and check-out
- Automatic late-entry detection and SMTP-ready late notification flow
- Leave request, approval, rejection, and cancellation workflows
- Monthly salary prediction based on absences and late penalties
- Role-based dashboards with attendance analytics
- CSV exports for attendance, leave, salary, and late summaries

## Project Structure

```text
Attendify/
  backend/
  frontend/
```

## Backend Setup

1. Go to `backend`.
2. Copy `.env.example` to `.env`.
3. Add your MongoDB connection string to `MONGO_URI`.
4. Optionally add SMTP credentials if you want real late-email delivery.
5. Run:

```bash
npm install
npm run seed
npm run dev
```

Backend runs by default at `http://localhost:5000`.

### Backend Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_IN_DAYS=7
DEFAULT_ADMIN_NAME=System Admin
DEFAULT_ADMIN_EMAIL=admin@attendify.com
DEFAULT_ADMIN_PASSWORD=Admin123!
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=Attendify
SMTP_FROM_EMAIL=no-reply@attendify.com
```

## Frontend Setup

1. Go to `frontend`.
2. Copy `.env.example` to `.env` if you need a custom API URL.
3. Run:

```bash
npm install
npm run dev
```

Frontend runs by default at `http://localhost:5173`.

## Seeded Accounts

- Admin: `admin@attendify.com` / `Admin123!`
- HR: `hr@attendify.com` / `Hr123456!`
- Manager: `manager@attendify.com` / `Manager123!`
- Employee: `employee@attendify.com` / `Employee123!`

## Main API Routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/change-password`
- `GET/POST /api/employees`
- `GET/PATCH/DELETE /api/employees/:id`
- `PATCH /api/employees/:id/status`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/me`
- `GET/POST /api/attendance`
- `PATCH /api/attendance/:id`
- `GET/POST /api/leaves`
- `PATCH /api/leaves/:id/cancel`
- `PATCH /api/leaves/:id/approve`
- `PATCH /api/leaves/:id/reject`
- `GET /api/salary/me`
- `GET /api/salary/employee/:employeeId`
- `GET /api/salary/report`
- `GET /api/dashboard/admin`
- `GET /api/dashboard/hr`
- `GET /api/dashboard/manager`
- `GET /api/dashboard/employee`
- `GET /api/reports/attendance`
- `GET /api/reports/late-summary`
- `GET /api/reports/leaves`
- `GET /api/reports/salary`
- `GET/PATCH /api/settings/office`

## Role Matrix

- `admin`: full access, employee management, salary reports, office settings
- `hr`: employee management, leave approval, attendance monitoring, salary reports
- `manager`: leave approval, attendance monitoring, analytics
- `employee`: self attendance, leave requests, salary summary, profile security

## Verification

- Backend tests: `npm test` inside `backend`
- Frontend build: `npm run build` inside `frontend`

Both checks were completed successfully during implementation.
