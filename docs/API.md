# API Notes

Backend routes are mounted in `backend/server.ts`. The frontend uses `frontend/src/api.ts`, which adds `Authorization: Bearer <token>` from `localStorage.token`.

Default local URLs:

- Backend: `http://localhost:5000`
- REST API base: `http://localhost:5000/api`
- Frontend: `http://localhost:5173`
- Socket.IO: `http://localhost:5000/socket.io`

## Auth

Mounted at `/api/auth`.

- `POST /register`: create a student account and profile shell.
- `POST /login`: authenticate and return `{ token, user }`.
- `GET /me`: return the authenticated user.

JWT payloads include `id`, `role`, and `email`. Protected routes use `authMiddleware`.

## Majors

Mounted at `/api/majors`.

- `GET /`: list majors for profile completion and settings.

## Student

Mounted at `/api/students`.

- `GET /me/dashboard`: dashboard summary, GPA history, recent grades, tasks, and classes.
- `GET /me/tasks`: task list and task stats.
- `POST /me/tasks`: create a task.
- `PATCH /me/tasks/:taskId/toggle`: toggle completion.
- `PATCH /me/tasks/:taskId`: update task fields.
- `DELETE /me/tasks/:taskId`: delete a task.
- `GET /me/statistics`: academic, study, goals, achievement, and comparison metrics.
- `GET /me/grades`: grade table, filters, and chart data.
- `PUT /me/profile`: complete or update student profile fields.
- `POST /me/avatar`: upload avatar image as multipart field `avatar`.

## Schedule

Mounted at `/api/schedule`.

- `GET /?date=YYYY-MM-DD&view=day|week|month`: schedule payload for calendar views.
- `POST /events`: create a schedule event.

Schedule combines recurring classes, one-off events, and due tasks into calendar response items.

## Forum

Mounted at `/api/forum`.

- `GET /`: forum categories, posts, search/filter/sort payload.
- `POST /posts`: create a post.
- `POST /posts/:postId/likes`: toggle a post like.
- `POST /posts/:postId/comments`: create a comment.

## Messages

Mounted at `/api/messages`.

- `GET /`: list conversations.
- `GET /students/search?q=...`: search students before starting direct chat.
- `POST /direct`: create or restore a direct conversation.
- `GET /:conversationId`: conversation details and paged messages.
- `PATCH /:conversationId/star`: toggle starred status.
- `POST /:conversationId/messages`: send a text message.
- `POST /:conversationId/attachments`: upload message attachments as multipart field `files`.

## Notifications

Mounted at `/api/notifications`.

- `GET /`: list notifications.
- `PATCH /:notificationId/read`: mark one notification as read.
- `PATCH /read-all`: mark all current-user notifications as read.

## Realtime

Socket.IO is initialized in `backend/realtime.ts`. Clients authenticate with the JWT in `handshake.auth.token` and join a private `user:<id>` room.

Known event names:

- `message:changed`
- `notification:changed`

When adding realtime behavior, emit to user rooms through `emitToUser` or `emitToUsers` rather than broadcasting private data.

