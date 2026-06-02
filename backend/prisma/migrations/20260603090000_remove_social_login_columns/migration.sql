DROP INDEX IF EXISTS "users_google_id_key";
DROP INDEX IF EXISTS "users_microsoft_id_key";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "google_id",
DROP COLUMN IF EXISTS "microsoft_id";
