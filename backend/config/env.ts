export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }

  return secret;
}

export function assertRequiredEnv() {
  getJwtSecret();
}
