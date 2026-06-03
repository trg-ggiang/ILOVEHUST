import { randomUUID } from "crypto";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "avatars";

function getAvatarExtension(originalName) {
  const extension = path.extname(String(originalName || "")).toLowerCase();
  return extension || ".png";
}

function getAvatarStorageClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function isAvatarStorageConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export async function uploadAvatarToStorage({ userId, file }) {
  const supabase = getAvatarStorageClient();
  if (!supabase) {
    throw new Error("AVATAR_STORAGE_NOT_CONFIGURED");
  }

  const extension = getAvatarExtension(file.originalname);
  const objectPath = `${userId}/${Date.now()}-${randomUUID()}${extension}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
