const DAY_MS = 24 * 60 * 60 * 1000;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 2);
  date.setMilliseconds(date.getMilliseconds() - 1);
  return date;
}

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getActorName(actor) {
  return actor?.studentProfile?.fullName || actor?.email || "Một sinh viên";
}

export async function createNotification(client, data) {
  if (!data?.userId || !data?.type || !data?.title || !data?.message) return null;

  const payload = {
    userId: data.userId,
    actorId: data.actorId || null,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link || null,
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    dedupeKey: data.dedupeKey || null,
    metadata: data.metadata || undefined,
  };

  if (!payload.dedupeKey) {
    return client.notification.create({ data: payload });
  }

  const updateData = {
    title: payload.title,
    message: payload.message,
    link: payload.link,
    metadata: payload.metadata,
  };

  if (data.resetReadOnUpdate !== false) {
    updateData.readAt = null;
    updateData.createdAt = new Date();
  }

  return client.notification.upsert({
    where: { dedupeKey: payload.dedupeKey },
    create: payload,
    update: updateData,
  });
}

export async function createForumLikeNotification(client, { post, actor }) {
  if (!post || !actor || post.authorId === actor.id) return null;

  const actorName = getActorName(actor);
  return createNotification(client, {
    userId: post.authorId,
    actorId: actor.id,
    type: "forum_like",
    title: "Bài viết được thích",
    message: `${actorName} đã thích bài viết "${post.title}".`,
    link: "/forum",
    entityType: "forum_post",
    entityId: post.id,
    dedupeKey: `forum-like:${post.id}:${actor.id}`,
  });
}

export async function createForumCommentNotification(client, { post, comment, actor }) {
  if (!post || !comment || !actor || post.authorId === actor.id) return null;

  const actorName = getActorName(actor);
  return createNotification(client, {
    userId: post.authorId,
    actorId: actor.id,
    type: "forum_comment",
    title: "Bài viết có trả lời mới",
    message: `${actorName} đã trả lời bài viết "${post.title}".`,
    link: "/forum",
    entityType: "forum_post",
    entityId: post.id,
    dedupeKey: `forum-comment:${comment.id}`,
  });
}

export async function createMessageNotifications(client, { conversation, sender, message }) {
  if (!conversation || !sender || !message) return;

  const senderName = getActorName(sender);
  const recipients = (conversation.members || []).filter((member) => member.userId !== sender.id);
  await Promise.all(
    recipients.map((member) =>
      createNotification(client, {
        userId: member.userId,
        actorId: sender.id,
        type: "message",
        title: "Tin nhắn mới",
        message: `${senderName}: ${message.content}`,
        link: "/messages",
        entityType: "conversation",
        entityId: conversation.id,
        dedupeKey: `message:${message.id}:${member.userId}`,
      })
    )
  );
}

export async function ensureDueTaskNotifications(client, userId) {
  const now = new Date();
  const tasks = await client.studentTask.findMany({
    where: {
      userId,
      completed: false,
      dueAt: {
        lte: endOfTomorrow(),
      },
    },
    orderBy: { dueAt: "asc" },
  });

  await Promise.all(
    tasks.map((task) => {
      const dueAt = new Date(task.dueAt);
      const overdue = dueAt.getTime() < startOfToday().getTime();
      const dueToday = dueAt.toDateString() === now.toDateString();
      const daysLeft = Math.ceil((dueAt.getTime() - now.getTime()) / DAY_MS);
      const title = overdue ? "Task đã quá hạn" : dueToday ? "Task đến hạn hôm nay" : "Task sắp đến hạn";
      const message = overdue
        ? `"${task.title}" đã quá hạn.`
        : dueToday
          ? `"${task.title}" cần hoàn thành trong hôm nay.`
          : `"${task.title}" còn khoảng ${Math.max(daysLeft, 1)} ngày là đến hạn.`;

      return createNotification(client, {
        userId,
        type: overdue ? "task_overdue" : "task_due",
        title,
        message,
        link: "/tasks",
        entityType: "student_task",
        entityId: task.id,
        dedupeKey: `task-due:${task.id}:${formatDateKey(task.dueAt)}`,
        resetReadOnUpdate: false,
      });
    })
  );
}

export function toNotificationResponse(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    entityType: notification.entityType,
    entityId: notification.entityId,
    read: Boolean(notification.readAt),
    createdAt: notification.createdAt,
    actor: notification.actor
      ? {
          id: notification.actor.id,
          name: getActorName(notification.actor),
        }
      : null,
  };
}
