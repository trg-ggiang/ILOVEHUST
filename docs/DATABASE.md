# Database Notes

The backend uses Prisma 7 with PostgreSQL and `@prisma/adapter-pg`.

Primary files:

- Schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`
- Seed data: `backend/prisma/seed.ts`
- Seed validation: `backend/prisma/checkSeed.ts`
- Prisma client setup: `backend/database.ts`

## Local Workflow

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev
npm run seed
npm run seed:check
```

For deployed databases:

```bash
cd backend
npm run prisma:generate
npm run db:deploy
npm run seed
npm run seed:check
```

Do not run destructive Prisma or SQL commands against a shared database without explicit user approval.

## Main Model Areas

- Identity: `User`, `StudentProfile`, `Major`
- Academics: `Semester`, `Course`, `GradeRecord`
- Student planning: `StudentTask`, `StudentScheduleClass`, `StudentScheduleEvent`
- Messaging: `Conversation`, `ConversationMember`, `Message`, `MessageAttachment`
- Forum: `ForumCategory`, `ForumPost`, `ForumComment`, `ForumPostLike`
- Notifications: `Notification`

## Important Conventions

- Database table and column names use snake_case through `@@map` and `@map`.
- Application code uses Prisma model fields in camelCase.
- `User.role` uses `0 = admin` and `1 = student`.
- Most user-owned data cascades on user deletion.
- Direct conversation membership uses a composite key on `conversationId` and `userId`.
- `Notification.dedupeKey` is unique and should be used for repeatable notification triggers.
- File uploads are stored under local `uploads/`; database rows store relative URLs.

## Migration Rules For Codex

- Add a new migration for schema changes with `npx prisma migrate dev --name <name>` when a local database is available.
- If no database is available, update the schema only when requested and clearly state that the migration was not generated.
- Never edit old migrations unless the user explicitly asks and understands the database history impact.
- Run `npm run prisma:generate` after schema changes.
- Update seed/check scripts when new required data is introduced.

