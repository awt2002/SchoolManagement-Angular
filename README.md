# School Management System

A full-stack School Management application built with an **ASP.NET Core 9 Web API** backend and an **Angular SPA** frontend. It provides JWT-based authentication with rotating refresh tokens, role-based authorization, password reset by email, and complete school modules for students, teachers, classes, attendance, grades, exams, announcements, and dashboard insights.

## Features

- **JWT Authentication** – Access token + rotating refresh-token cookie flow with configurable expiry
- **Role-Based Authorization** – `Admin`, `Teacher`, and `Student` roles with protected endpoints and row-level access checks for student-owned data
- **Password Reset** – Forgot-password and reset-password flow with email delivery
- **Grade Audit Log** – Every grade change is recorded with the previous value and the user who made it
- **School Modules** – Students, Teachers, Classes, Academic Years, Subjects, Attendance, Grades, Exams, Announcements, Dashboard
- **Swagger / OpenAPI** – Interactive API documentation with Bearer token support
- **Auto-Seeding** – Academic year, demo users, classes, students, teachers, subjects, grades, attendance, exams, and announcements are created on first run

## Tech Stack

| Layer | Technology |
|---|---|
| API | ASP.NET Core 9 (.NET 9) |
| Frontend | Angular (standalone components, signals) + Angular Material |
| Authentication | Custom JWT + rotating refresh-token cookie |
| Database | SQL Server + Entity Framework Core 9 |
| Email | SMTP |
| API Docs | Swagger / OpenAPI (Swashbuckle) |

## Prerequisites

- .NET 9 SDK
- Node.js 20+ and npm
- SQL Server (LocalDB, Express, or full instance)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/awt2002/SchoolManagement-Angular.git
cd SchoolManagement-Angular
```

### 2. Configure `appsettings.json`

Open `backend/SMS.API/appsettings.json` and update the sections below.

#### Connection String

Point to your SQL Server instance:

```json
"ConnectionStrings": {
  "Default": "Server=YOUR_SERVER;Database=SchoolManagementDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
}
```

#### Email (SMTP)

```json
"Smtp": {
  "Host": "smtp.gmail.com",
  "Port": "587",
  "User": "youremail@gmail.com",
  "Password": "your-app-password", // https://myaccount.google.com/apppasswords
  "FromName": "SchoolManagement"
}
```

### 3. Set the JWT signing secret

The API refuses to start if `Jwt:Secret` is still a placeholder. Store a real value with .NET user-secrets so it stays out of the repo:

```bash
dotnet user-secrets set "Jwt:Secret" "<a-random-string-at-least-32-chars>" --project backend/SMS.API
```

You can generate a strong secret in one PowerShell line:

```powershell
$b = New-Object byte[] 64; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); dotnet user-secrets set "Jwt:Secret" ([Convert]::ToBase64String($b)) --project backend/SMS.API
```

### 4. Run the application

Database migrations and seed data are applied automatically on first startup in Development.

**In Visual Studio (recommended)**

Open `SchoolManagement.sln`, make sure the launch-profile dropdown shows **https**, then press **F5**. SpaProxy spawns the Angular dev server as a child process, and your browser opens the SPA at `http://localhost:4200` once it's ready.

**From the CLI**

Run the API and the Angular dev server in two terminals:

```bash
# Terminal 1 – API
dotnet run --project backend/SMS.API --launch-profile https

# Terminal 2 – Angular SPA
cd frontend/sms-angular
npm install     # first time only
npm start
```

Then browse to `http://localhost:4200`.

### 5. Explore with Swagger

Open `https://localhost:7056/swagger` to view and test API endpoints.

## API Endpoints

### Authentication — `/api/v1/auth/...`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/login` | Login and receive JWT + refresh token cookie |
| POST | `/refresh` | Exchange refresh token cookie for a new JWT |
| POST | `/logout` | Revoke refresh token and sign out |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Submit new password with reset token |
| POST | `/change-password` | Change current user password (authorized) |

### Core Modules — `/api/v1/...`

| Controller | Base Route |
|---|---|
| Students | `/api/v1/students` |
| Teachers | `/api/v1/teachers` |
| Classes | `/api/v1/classes` |
| Academic Years | `/api/v1/academic-years` |
| Attendance | `/api/v1/attendance` |
| Subjects | `/api/v1/subjects` |
| Grades | `/api/v1/grades` |
| Exams | `/api/v1/exams` |
| Announcements | `/api/v1/announcements` |
| Dashboard | `/api/v1/dashboard` |

## API Response Format

All endpoints use a consistent response envelope style:

```json
{
  "success": true,
  "message": "Descriptive message",
  "data": {},
  "errors": [],
  "statusCode": 200
}
```

## Request Body Examples

### Login

`POST /api/v1/auth/login`

```json
{
  "username": "admin",
  "password": "Admin123"
}
```

### Forgot Password

`POST /api/v1/auth/forgot-password`

```json
{
  "email": "youremail@gmail.com"
}
```

### Change Password

`POST /api/v1/auth/change-password`
`Authorization: Bearer <token>`

```json
{
  "currentPassword": "Strong@123",
  "newPassword": "NewStrong@456",
  "confirmNewPassword": "NewStrong@456"
}
```

## Default Seeded Accounts

Created automatically on first run:

- Admin: `admin` / `Admin123`
- Teachers: `sjohnson`, `mbrown`, `edavis`, `rwilson`, `landerson` – password `Teacher123`
- Students: sample student users (e.g. `alicesmith`, `bobtaylor`, `charliewhite`) – password `Student123`

## Project Structure

```text
SchoolManagement-Angular/
├── backend/
│   ├── SMS.API/
│   │   ├── Controllers/
│   │   ├── Extensions/
│   │   ├── Middleware/
│   │   ├── Properties/launchSettings.json
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── SMS.API.csproj
│   ├── SMS.Application/
│   │   ├── Features/
│   │   ├── Interfaces/
│   │   ├── Common/
│   │   └── SMS.Application.csproj
│   ├── SMS.Domain/
│   │   ├── Entities/
│   │   ├── Enums/
│   │   └── SMS.Domain.csproj
│   └── SMS.Infrastructure/
│       ├── Data/
│       ├── Services/
│       ├── Seed/
│       └── SMS.Infrastructure.csproj
└── frontend/
    └── sms-angular/
        ├── src/
        │   ├── app/
        │   │   ├── core/       # auth, http, models
        │   │   ├── features/   # admin, teacher, student, auth, dashboard
        │   │   ├── layout/
        │   │   └── shared/
        │   └── environments/
        ├── angular.json
        └── package.json
```

## License

This project is open source.
