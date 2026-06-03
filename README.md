![Vercel](https://vercelbadge.vercel.app/api/trg-ggiang/ilovehust)

# ILoveHust

## 1. Project Overview

**ILoveHust** is a comprehensive, modern web application designed exclusively for students at Hanoi University of Science and Technology (HUST). The primary goal of this project is to consolidate fragmented academic tools into a single, unified, and highly interactive platform. 

Instead of jumping between different portals to check grades, schedules, or connect with peers, ILoveHust provides a centralized hub with the following core features:

* **Student Dashboard:** A personalized overview of the student's current semester, upcoming deadlines, and academic standing.
* **Academic Management:** Easy tracking of course schedules, credits, and GPA/grades.
* **Task & Time Management:** Built-in tools to help students manage assignments, projects, and personal study plans efficiently.
* **Community Forum:** A dedicated space for HUST students to ask questions, share study materials, and discuss course-specific topics.
* **Real-time Interaction:** Integrated messaging and a live notification system (powered by WebSockets) so students never miss an important update or message from their peers.

## 2. Tech Stack

This project is built using a modern Full-stack JavaScript/TypeScript ecosystem to ensure high performance and scalability.

### Frontend
* **Framework:** React with TypeScript & Vite
* **Routing & State:** React Router
* **Networking:** Axios
* **Real-time:** Socket.IO Client

### Backend & Database
* **Runtime & Framework:** Node.js, Express, TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Real-time & Security:** Socket.IO, JWT Authentication
* **Live Infrastructure:** Supabase (Database), Render (Backend Host)

---

## 3. Live Demo & Usage Guide

The application is fully deployed and ready to use. You do not need to install or run anything locally to experience ILoveHust. 

### Access the Application
🌐 **Live Website:** [https://ilovehust.vercel.app]

### How to test the app
Since the database is pre-seeded with sample data, you can log in immediately using the provided test accounts below to explore different roles and features.

**1. Test as an Admin**
* **Email:** `admin@ilovehust.local`
* **Password:** `admin123`
* *Use this account to explore administrative features, global management, and system oversight.*

**2. Test as a Student**
* **Email:** `student@ilovehust.local`
* **Password:** `student123`
* *Use this account to experience the core user flow: viewing schedules, checking grades, managing tasks, and using the chat/forum.*

### Things to try out:
* Open two different browser windows (or one incognito mode).
* Log in to the Student account on one window and the Admin account on the other.
* Try sending a message or triggering a notification to see the **Real-time WebSocket** feature in action without refreshing the page!

---

## 4. Authentication Features

ILoveHust supports standard email/password login and password recovery by email.

### Forgot Password

Users can reset their password from the login page:

1. Click **Forgot password**.
2. Enter the account email address.
3. Open the reset link sent by email.
4. Set a new password.

Password reset tokens are stored as SHA-256 hashes and expire after 30 minutes.

If SMTP is not configured, the backend logs the reset URL for local development instead of sending an email.

Backend endpoints:

* `POST /api/auth/forgot-password`
* `POST /api/auth/reset-password`

Required backend environment variables for sending reset emails:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="no-reply@example.com"
SMTP_PASS="smtp-password"
MAIL_FROM="ILoveHust <no-reply@example.com>"
```

### Database Migration

The password recovery feature adds reset-token columns to the `users` table. Apply migrations before using it against a real database:

```bash
cd backend
npx prisma migrate deploy
npm run prisma:generate
```

---

## 5. Image & File Handling

ILoveHust separates uploaded media from application data:

* **Avatar images:** uploaded through the backend to **Supabase Storage**. The database stores only the public image URL, and the frontend renders the avatar directly from that URL.
* **Message attachments:** currently uploaded to the backend local `uploads/messages` folder and served through `/uploads/messages/...`.
* **Frontend rendering:** media URLs are normalized before rendering so both absolute storage URLs and local `/uploads/...` paths can work.

For production/demo stability, avatars should use Supabase Storage because local backend files may disappear after redeploys on serverless hosts.

### Supabase Storage Setup

1. Open Supabase Dashboard.
2. Go to **Storage**.
3. Create a bucket named `avatars`.
4. For the simplest demo setup, make the bucket public.
5. Add these backend environment variables:

```env
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_AVATAR_BUCKET="avatars"
```

`SUPABASE_SERVICE_ROLE_KEY` must stay backend-only. Never expose it in frontend env variables.

Avatar upload flow:

```text
React uploads avatar -> Express receives file -> Supabase Storage stores image -> Prisma saves public URL -> React renders avatar URL
```
