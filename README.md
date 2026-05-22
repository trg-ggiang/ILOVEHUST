# ILoveHust

## 1. Mục đích tạo dự án

ILoveHust là một ứng dụng web hỗ trợ sinh viên HUST quản lý thông tin học tập cá nhân trong một hệ thống thống nhất.

Dự án tập trung vào các nhu cầu chính của sinh viên như hồ sơ cá nhân, điểm số, lịch học, task, forum, tin nhắn và thông báo realtime.

## 2. Công nghệ sử dụng

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Socket.IO Client
- CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO
- JWT

### Database và deploy

- PostgreSQL local khi phát triển
- Supabase PostgreSQL khi demo/deploy
- Vercel cho frontend
- Backend cần deploy riêng trên một dịch vụ Node.js có hỗ trợ WebSocket như Render, Railway hoặc Fly.io

## 3. Setup local

### Cài dependencies

```bash
npm install

cd backend
npm install

cd ../frontend
npm install
```

### Cấu hình backend

Tạo file `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ilovehust?schema=public"
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:5173"
```

### Khởi tạo database local

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run seed
npm run seed:check
```

### Chạy app

Terminal backend:

```bash
cd backend
npm run dev
```

Terminal frontend:

```bash
cd frontend
npm run dev
```

Frontend chạy tại `http://localhost:5173`, backend chạy tại `http://localhost:5000`.

## 4. Dùng Supabase để demo dữ liệu thật

### Bước 1: Tạo database Supabase

Tạo một project Supabase, sau đó lấy connection string PostgreSQL trong phần database connection.

Nên dùng connection string dạng direct connection hoặc session pooler. Cuối URL thêm:

```txt
?schema=public&sslmode=require&uselibpqcompat=true
```

Ví dụ biến môi trường backend:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public&sslmode=require&uselibpqcompat=true"
JWT_SECRET="your-production-secret"
FRONTEND_URL="https://your-vercel-app.vercel.app"
```

### Bước 2: Đẩy schema và seed lên Supabase

Đứng trong thư mục `backend`, dùng chính `DATABASE_URL` Supabase:

```bash
npm run prisma:generate
npm run db:deploy
npm run seed
npm run seed:check
```

Sau bước này Supabase sẽ có đủ bảng và dữ liệu demo.

### Bước 3: Deploy backend

Deploy thư mục `backend` lên một host Node.js có hỗ trợ WebSocket.

Biến môi trường backend cần có:

```env
DATABASE_URL="connection-string-supabase"
JWT_SECRET="your-production-secret"
FRONTEND_URL="https://your-vercel-app.vercel.app"
```

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

### Bước 4: Deploy frontend lên Vercel

Trong Vercel, project frontend cần trỏ root directory là `frontend`.

Biến môi trường frontend:

```env
VITE_API_BASE_URL="https://your-backend-domain.com/api"
VITE_SOCKET_URL="https://your-backend-domain.com"
```

Build command:

```bash
npm run build
```

Output directory:

```txt
dist
```

Sau khi deploy xong, mở link Vercel là app sẽ gọi backend public, backend dùng dữ liệu từ Supabase nên không cần clone project về local để demo nữa.

## 5. Tài khoản seed mẫu

```txt
Admin:
email: admin@ilovehust.local
password: admin123

Student:
email: student@ilovehust.local
password: student123
```
