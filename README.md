# 🚀 Rival Task Manager (Full-Stack Assessment)

An enterprise-grade, full-stack Task Management application built to exceed the rigorous requirements of the Rival Full-Stack Developer Assessment. This application features a seamlessly integrated Next.js frontend and a highly scalable Node/Express backend, heavily utilizing modern tools like Prisma, Server-Sent Events (SSE), and Optimistic UI updates.

---

## 🌍 Live Deployments

- **Frontend (Netlify):** [https://phenomenal-duckanoo-477fd6.netlify.app](https://phenomenal-duckanoo-477fd6.netlify.app)
- **Backend API (Railway):** [https://rival-task-manager-production.up.railway.app](https://rival-task-manager-production.up.railway.app)

---

## ✨ Features (Core & Bonus Achieved)

### 🛡️ Core Requirements (100% Completed)
- **RESTful API:** Complete CRUD endpoints (`/tasks`) with strict input validation using **Zod** and standardized HTTP error responses.
- **PostgreSQL Database:** Data fully persisted using **Prisma ORM** connected to a PostgreSQL instance.
- **Authentication:** Secure JWT-based signup and login system. Passwords hashed via **bcrypt**. Complete route protection ensuring users can only access their own data.
- **Frontend Masterpiece:** A **Next.js 14** application with an ultra-responsive layout (Tailwind CSS). Features custom Framer Motion animated modals to elegantly handle destructive actions and bypass browser ad-blockers.
- **Context-Aware Sorting Engine:** Interlocking Search (by title), Filtering (by status), and Sorting (by priority, dueDate, createdAt) with Server-Side Pagination. The sorting engine intelligently sinks `COMPLETED` tasks to the bottom of the grid to prevent clutter, while maintaining strict chronological timelines for Created Dates.
- **State Handling:** Graceful handling of Loading, Empty, and Error states across all components.

### 🌟 Advanced Bonus Features (100% Completed)
- **Real-Time Updates (SSE):** Task changes broadcast live to all connected clients using Server-Sent Events (SSE).
- **Optimistic UI:** Instantaneous state updates on the frontend before server confirmation (with auto-rollback on failure) for hyper-responsive UX.
- **Task Attachments:** Full support for `multipart/form-data` uploads via `multer`, securely associating files with specific tasks.
- **Activity Logs (Precision Diffing):** Automatic database-level tracking of all task modifications. Features a precise algorithmic Diffing Engine that traces exact `from ➔ to` property changes and silently ignores redundant saves, displaying them gracefully with visual strikethroughs.
- **Role-Based Access (RBAC):** `USER` and `ADMIN` roles implemented natively in the schema and API middleware.
- **Dark Mode:** A sleek, persisted Dark Mode toggle utilizing Tailwind CSS.
- **Automated CI/CD Pipeline:** A custom **GitHub Actions** workflow that mounts a virtual environment, installs dependencies, and flawlessly executes the extreme Jest testing suite on every push.
- **Dockerized Environment:** A `docker-compose` architecture for instant, one-click full-stack deployment.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Zustand, Framer Motion, Axios, React Hook Form.
- **Backend:** Node.js, Express.js, TypeScript, Prisma ORM, Zod, Multer, Bcrypt, JsonWebToken.
- **Database:** PostgreSQL (Production) / SQLite (Automated CI Test Environment).

---

## 🚀 Getting Started (Dockerized Setup)

The fastest and most robust way to run the application is via Docker.

### 1. Prerequisites
- Docker & Docker Compose installed on your machine.
- Git.

### 2. Setup Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. *(Optional)* Modify the secrets inside `.env` if desired. The defaults will work perfectly out-of-the-box for local testing.

### 3. Launch the Application
Run the following command from the root of the project to spin up the PostgreSQL Database, the Express API, and the Next.js Frontend simultaneously:
```bash
docker-compose up --build -d
```

### 4. Access the App
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## 🧪 Testing

The backend includes a highly aggressive integration testing suite (`api.test.ts`) that validates auth isolation, cascade deletes, validation failures, and malformed payload handling.

To run the tests manually (Node.js required):
```bash
cd backend
npm install
npm test
```
*(Note: The GitHub Actions CI pipeline automatically runs these tests using an isolated memory database on every push).*

---

## 📌 Assumptions & Trade-offs

Per the assessment guidelines, here are the key architectural decisions and assumptions made during development:

1. **Backend Language (Trade-off):** The assessment suggested "Go preferred", but allowed other languages based on expertise. I built the backend in **Node.js (Express)** combined with TypeScript and Prisma to ensure 100% type-safety synchronization with the Next.js frontend, resulting in a cohesive, robust, and highly scalable monorepo-style architecture.
2. **Local SQLite vs PostgreSQL (Assumption):** While PostgreSQL is strictly required and implemented as the primary production database (running via Docker), the backend tests (`api.test.ts`) assume the ability to rapidly cycle a localized, memory-based SQLite database to ensure automated CI tests run reliably without polluting a live PostgreSQL schema.
3. **SSE vs WebSockets (Trade-off):** For the "Real-time updates" bonus feature, I opted to implement **Server-Sent Events (SSE)** instead of full WebSockets. SSE is unidirectional (server-to-client), which perfectly fits the requirement of broadcasting task updates, and drastically reduces backend resource overhead compared to maintaining heavy, duplex WebSockets.
4. **File Storage (Trade-off):** For the "Task Attachments" bonus feature, `multer` is configured to store files locally in an `uploads/` directory on the server container. In a true enterprise production environment, this would be abstracted to an S3 bucket or equivalent cloud blob storage to ensure serverless scaleability.

---

## 👤 Default Accounts
You can register a new account instantly, or use a pre-existing testing account:
- **Email:** `hardcore_tester@example.com`
- **Password:** `password123`
