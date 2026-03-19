# College ERP - Integrated Management System

A comprehensive College Enterprise Resource Planning (ERP) system built for academic institution management.

## 🚀 Features

- **RBAC (Role-Based Access Control):** Specific dashboards for Admin, HOD, Faculty, Student, and External Staff.
- **Student Lifecycle:** Manage admissions, batches, sections, promotions, and graduations.
- **Attendance Management:** Daily period-wise attendance tracking with automated eligibility (SA) checks.
- **Examination Management:** 
  - Internal (CIA) calculation and moderation.
  - External marks management with Dummy Number mapping for anonymity.
  - Hall Ticket generation and Seating Allocation algorithms.
- **Academic Results:** GPA/CGPA calculation engine with Arrear tracking and automatic clearing logic.
- **Reporting:** PDF exports for Hall Tickets, Attendance sheets, and Grade Statements.

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **Database:** Prisma ORM with SQLite (PostgreSQL ready)
- **Security:** JWT Authentication, Bcrypt password hashing
- **PDF Generation:** PDFKit

## 📂 Project Structure

```bash
├── client/          # Vite + React Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Dashboard and logic pages
│   │   └── utils/       # Client-side helpers
├── server/          # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/ # Business logic
│   │   ├── prisma/      # Database schema and migrations
│   │   └── services/    # Reusable service layers (Calculations, Seating)
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   # Root
   npm install
   # or
   cd client && npm install
   cd ../server && npm install
   ```
3. Initialize the database:
   ```bash
   cd server
   npx prisma generate
   npx prisma migrate dev
   npm run seed:grades
   ```
4. Start the application:
   ```bash
   # Both client and server
   npm run dev
   ```

## 🔒 Security

- All API routes are protected by JWT middleware.
- Input validation enforced at controller level.
- Multi-table auth lookup with identity collision guards.
