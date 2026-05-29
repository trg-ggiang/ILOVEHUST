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
