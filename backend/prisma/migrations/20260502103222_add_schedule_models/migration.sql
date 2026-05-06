-- CreateTable
CREATE TABLE "student_schedule_classes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER,
    "semester_id" INTEGER,
    "subject" TEXT NOT NULL,
    "class_type" TEXT NOT NULL DEFAULT 'Ly thuyet',
    "weekday" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "room" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_schedule_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_schedule_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "event_time" VARCHAR(5),
    "event_type" TEXT NOT NULL DEFAULT 'assignment',
    "color" TEXT NOT NULL DEFAULT 'purple',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_schedule_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_schedule_classes_user_id_weekday_idx" ON "student_schedule_classes"("user_id", "weekday");

-- CreateIndex
CREATE INDEX "student_schedule_classes_semester_id_idx" ON "student_schedule_classes"("semester_id");

-- CreateIndex
CREATE INDEX "student_schedule_events_user_id_event_date_idx" ON "student_schedule_events"("user_id", "event_date");

-- AddForeignKey
ALTER TABLE "student_schedule_classes" ADD CONSTRAINT "student_schedule_classes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_schedule_classes" ADD CONSTRAINT "student_schedule_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_schedule_classes" ADD CONSTRAINT "student_schedule_classes_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_schedule_events" ADD CONSTRAINT "student_schedule_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
