ALTER TABLE "student_tasks"
ADD COLUMN "description" TEXT,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Khac';

ALTER TABLE "student_tasks"
ALTER COLUMN "priority" SET DEFAULT 'medium';

UPDATE "student_tasks"
SET "priority" = 'medium'
WHERE "priority" = 'normal';

CREATE INDEX "student_tasks_user_id_priority_idx" ON "student_tasks"("user_id", "priority");
