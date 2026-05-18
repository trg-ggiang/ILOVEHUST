import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function assertCheck(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

async function main() {
  const errors = [];

  const [admin, student] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@ilovehust.local" } }),
    prisma.user.findUnique({
      where: { email: "student@ilovehust.local" },
      include: {
        studentProfile: true,
        gradeRecords: {
          include: { semester: true },
        },
      },
    }),
  ]);

  const [
    majorCount,
    semesterCount,
    courseCount,
    gradeRecordCount,
    taskCount,
    scheduleClassCount,
    scheduleEventCount,
    forumCategoryCount,
    forumPostCount,
    forumCommentCount,
    forumLikeCount,
    conversationCount,
    conversationMemberCount,
    messageCount,
    userCount,
  ] = await Promise.all([
    prisma.major.count(),
    prisma.semester.count(),
    prisma.course.count(),
    prisma.gradeRecord.count(),
    prisma.studentTask.count(),
    prisma.studentScheduleClass.count(),
    prisma.studentScheduleEvent.count(),
    prisma.forumCategory.count(),
    prisma.forumPost.count(),
    prisma.forumComment.count(),
    prisma.forumPostLike.count(),
    prisma.conversation.count(),
    prisma.conversationMember.count(),
    prisma.message.count(),
    prisma.user.count(),
  ]);

  assertCheck(Boolean(admin), "Missing admin user: admin@ilovehust.local", errors);
  assertCheck(Boolean(student), "Missing student user: student@ilovehust.local", errors);
  assertCheck(userCount >= 101, "Expected at least 100 students plus admin", errors);
  assertCheck(majorCount >= 1, "No major records found", errors);
  assertCheck(semesterCount >= 6, "Expected at least 6 semesters", errors);
  assertCheck(courseCount >= 12, "Expected at least 12 courses", errors);
  assertCheck(gradeRecordCount >= 1200, "Expected at least 1200 grade records", errors);
  assertCheck(taskCount >= 300, "Expected at least 300 student tasks", errors);
  assertCheck(scheduleClassCount >= 300, "Expected at least 300 schedule classes", errors);
  assertCheck(scheduleEventCount >= 100, "Expected at least 100 schedule events", errors);
  assertCheck(forumCategoryCount >= 3, "Expected at least 3 forum categories", errors);
  assertCheck(forumPostCount >= 100, "Expected at least 100 forum posts", errors);
  assertCheck(forumCommentCount >= 300, "Expected at least 300 forum comments", errors);
  assertCheck(forumLikeCount >= 800, "Expected at least 800 forum post likes", errors);
  assertCheck(conversationCount >= 38, "Expected at least 38 conversations", errors);
  assertCheck(conversationMemberCount >= 100, "Expected at least 100 conversation members", errors);
  assertCheck(messageCount >= 380, "Expected at least 380 chat messages", errors);

  if (student) {
    const uniqueSemesters = new Set(
      student.gradeRecords.map((item) => item.semester?.semesterCode).filter(Boolean)
    );

    assertCheck(
      Boolean(student.studentProfile?.profileCompleted),
      "Student profile is not marked as completed",
      errors
    );
    assertCheck(
      Boolean(student.studentProfile?.studentCode),
      "Student profile has no studentCode",
      errors
    );
    assertCheck(uniqueSemesters.size >= 6, "Student grade history is missing semesters", errors);
    assertCheck(student.gradeRecords.length >= 18, "Student has fewer than 18 grade records", errors);
  }

  const report = {
    users: userCount,
    majors: majorCount,
    semesters: semesterCount,
    courses: courseCount,
    gradeRecords: gradeRecordCount,
    studentTasks: taskCount,
    scheduleClasses: scheduleClassCount,
    scheduleEvents: scheduleEventCount,
    forumCategories: forumCategoryCount,
    forumPosts: forumPostCount,
    forumComments: forumCommentCount,
    forumPostLikes: forumLikeCount,
    conversations: conversationCount,
    conversationMembers: conversationMemberCount,
    messages: messageCount,
    checksPassed: errors.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));

  if (errors.length) {
    console.error("\nSeed completeness check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("\nSeed completeness check passed.");
}

main()
  .catch((error) => {
    console.error("CHECK SEED ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
