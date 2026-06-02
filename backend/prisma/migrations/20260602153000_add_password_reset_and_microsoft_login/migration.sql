ALTER TABLE "users"
ADD COLUMN "password_reset_token_hash" TEXT,
ADD COLUMN "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN "microsoft_id" TEXT;

CREATE UNIQUE INDEX "users_microsoft_id_key" ON "users"("microsoft_id");
