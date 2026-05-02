-- CreateTable
CREATE TABLE "student_tasks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "due_label" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_tasks_user_id_completed_idx" ON "student_tasks"("user_id", "completed");

-- CreateIndex
CREATE INDEX "student_tasks_due_at_idx" ON "student_tasks"("due_at");

-- AddForeignKey
ALTER TABLE "student_tasks" ADD CONSTRAINT "student_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
