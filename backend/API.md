# Codfis Backend API Documentation

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env to set JWT_SECRET and admin credentials
npm start
```

Backend runs on `http://localhost:4000` by default.

## Authentication

Admin and student endpoints use JWT tokens. After login, include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Endpoints

### Admin Auth

- **POST `/api/auth/login`** — Login (returns JWT token)
  - Body: `{ userId, password }`
  - Returns: `{ token, userId, role }`

- **POST `/api/auth/register`** — Register new admin
  - Body: `{ userId, password }`
  - Returns: `{ message }`

- **POST `/api/auth/send-otp`** — Mock OTP send
  - Body: `{ email }`

- **POST `/api/auth/reset-password`** — Mock password reset
  - Body: `{ email, otp, newPassword }`

### Student Auth

- **POST `/api/student-auth/login`** — Student login
  - Body: `{ email, password }`
  - Returns: `{ token, email }`

- **POST `/api/student-auth/register`** — Student registration
  - Body: `{ name, email, mobile, gender, password, course_name }`

- **GET `/api/student-auth/profile/:email`** — Get student profile (auth required)

- **POST `/api/student-auth/send-otp`** — Mock OTP for student

### Courses

- **GET `/api/courses`** — List all courses

- **POST `/api/courses/add`** — Create course (auth required)
  - Body: `{ name, description, duration, fee, mode, skill_level, technologies }`

- **POST `/api/courses/update/:id`** — Update course (auth required)
  - Body: `{ name, description, duration, fee, mode, skill_level, technologies }`

- **POST `/api/courses/delete/:id`** — Delete course (auth required)

### Students

- **GET `/api/courses/student/all`** — List students (auth required)

- **POST `/api/courses/student/enroll`** — Enroll student
  - Body: `{ name, gender, email, mobile, courseName }`

- **POST `/api/courses/student/:action/:mobile`** — Update student status (auth required)

- **POST `/api/courses/student/delete/:mobile`** — Delete student (auth required)

### Trainers

- **GET `/api/courses/trainer/applied`** — List trainer applications (auth required)

- **POST `/api/courses/trainer/apply`** — Apply as trainer
  - Body: `{ name, gender, email, mobile, description }`
  - Body (form-data): file upload support

- **POST `/api/courses/trainer/approve/:mobile`** — Approve trainer (auth required)

- **POST `/api/courses/trainer/reject/:mobile`** — Reject trainer (auth required)

- **POST `/api/courses/trainer/delete/:mobile`** — Delete trainer (auth required)

### Business Enquiries

- **POST `/api/enquiries`** — Submit business enquiry
  - Body: `{ name, company, email, phone, businessType, requirement, preferredSolution, projectType, additional, type }`

- **GET `/api/enquiries`** — List enquiries (auth required)

- **POST `/api/enquiries/:id/status`** — Update enquiry status (auth required)
  - Body: `{ status }` — One of: "New", "Contacted", "In Progress", "Converted", "Closed"

### Demo Requests

- **POST `/api/demo`** — Submit demo request
  - Body: `{ name, phone, email, course, mode, preferredDate, experienceLevel, message }`

- **GET `/api/demo`** — List demo requests (auth required)

- **POST `/api/demo/:id/status`** — Update demo status (auth required)

### Contacts

- **POST `/api/contact`** — Submit contact form
  - Body: `{ name, email, phone, message }`

- **GET `/api/contact`** — List contacts (auth required)

### Stats

- **GET `/api/stats`** — Dashboard statistics (auth required)
  - Returns: `{ enquiries, demo_requests, contacts, students, trainers, courses }`

## Database

SQLite database stored at `backend/data.db`. Tables:
- `admins`
- `courses`
- `students`
- `trainers`
- `enquiries`
- `demo_requests`
- `contacts`

## Example Requests

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "userId": "admin", "password": "adminpass" }'
```

### Submit Enquiry
```bash
curl -X POST http://localhost:4000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "company": "Tech Co",
    "email": "john@example.com",
    "phone": "+1234567890",
    "businessType": "Startup",
    "requirement": "Web Application"
  }'
```

### Get Enquiries (with auth)
```bash
curl -X GET http://localhost:4000/api/enquiries \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Status Codes

- 200 — Success
- 400 — Bad request / Missing fields
- 401 — Unauthorized / Invalid token
- 409 — Conflict (e.g., duplicate email)
- 500 — Server error
