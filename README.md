# Attendance Management System

A full-stack web application for managing employee attendance, leaves, reports, and administrative tasks. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

This repository contains two main directories:
- `client/`: The frontend React application (Vite + TailwindCSS + React Router).
- `server/`: The backend Node.js application (Express + MongoDB + Mongoose).

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 1. Setup the Backend (Server)
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Note: Update the `.env` file with your actual MongoDB URI, JWT Secret, and Email credentials.*

4. Seed the database (Optional but recommended to create the initial Admin user):
   ```bash
   node src/seeder.js
   ```
   *Default Admin Login:*
   - **Email:** `admin@example.com`
   - **Password:** `password123`

5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Setup the Frontend (Client)
1. Navigate to the `client` directory (in a new terminal):
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Features
- **Admin Dashboard**: Overview of system metrics, manage employees, approve/reject leaves.
- **Employee Portal**: Mark attendance, apply for leaves, view personal attendance reports.
- **Authentication**: Role-based access control using JWT.
- **Reporting**: Generate daily/monthly attendance reports.
- **Announcement Emails**: When an admin creates an announcement, an email is automatically sent to all **Active** employees.

## Announcement Email Setup
- Configure either:
  - **Gmail** via `EMAIL_USER` + `EMAIL_PASS` (use a Google “App Password”), or
  - **SMTP** via `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (recommended for production).
- Optional sender customization:
  - `SMTP_FROM_NAME`
  - `SMTP_FROM_EMAIL`

## License
MIT License
