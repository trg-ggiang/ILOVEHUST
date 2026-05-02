-- CreateTable
CREATE TABLE "forum_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" SERIAL NOT NULL,
    "author_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "is_hot" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_post_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_name_key" ON "forum_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_slug_key" ON "forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_posts_author_id_idx" ON "forum_posts"("author_id");

-- CreateIndex
CREATE INDEX "forum_posts_category_id_idx" ON "forum_posts"("category_id");

-- CreateIndex
CREATE INDEX "forum_posts_is_hot_created_at_idx" ON "forum_posts"("is_hot", "created_at");

-- CreateIndex
CREATE INDEX "forum_posts_created_at_idx" ON "forum_posts"("created_at");

-- CreateIndex
CREATE INDEX "forum_comments_post_id_idx" ON "forum_comments"("post_id");

-- CreateIndex
CREATE INDEX "forum_comments_author_id_idx" ON "forum_comments"("author_id");

-- CreateIndex
CREATE INDEX "forum_comments_parent_id_idx" ON "forum_comments"("parent_id");

-- CreateIndex
CREATE INDEX "forum_post_likes_user_id_idx" ON "forum_post_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "forum_post_likes_post_id_user_id_key" ON "forum_post_likes"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "forum_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "forum_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
