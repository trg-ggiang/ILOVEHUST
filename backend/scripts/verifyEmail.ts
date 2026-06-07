import "dotenv/config";
import { verifyEmailTransport } from "../utils/email.js";

try {
  await verifyEmailTransport();
  console.log("SMTP connection verified. Gmail is ready to send password reset emails.");
} catch (error) {
  console.error("SMTP verification failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
