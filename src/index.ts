import { parseAllowedUsers, readOptionalNumberEnv, requireEnv } from "./env";
import { startJobs } from "./jobs";
import { createFetchHackerNewsJob } from "./jobs/fetch-hacker-news";
import { startPiBridge } from "./pi";
import { createTelegramService } from "./telegram";

const botToken = requireEnv("TELEGRAM_BOT_TOKEN");
const allowedUsers = parseAllowedUsers(requireEnv("ALLOWED_USERS"));

const defaultChatId = readOptionalNumberEnv("TELEGRAM_CHAT_ID");
const jobsEnabledFlag = process.env.JOBS_ENABLED?.trim();
const jobsEnabled = jobsEnabledFlag !== "false" && defaultChatId !== undefined;
const jobIntervalMinutes =
  readOptionalNumberEnv("FETCH_HN_INTERVAL_MINUTES") ?? 1440;

const telegram = createTelegramService({
  botToken,
  defaultChatId,
});

startPiBridge({
  allowedUsers,
  onText: telegram.onText,
  sendToTelegram: telegram.sendToTelegram,
});

startJobs({
  enabled: jobsEnabled,
  jobs: [
    createFetchHackerNewsJob({
      intervalMinutes: jobIntervalMinutes,
      sendToTelegram: telegram.sendToTelegram,
    }),
  ],
});

if (!jobsEnabled) {
  console.log(
    "jobs disabled (set TELEGRAM_CHAT_ID and keep JOBS_ENABLED not false to enable)",
  );
}

await telegram.start();

console.log("pi-telegram-bridge is running");

process.once("SIGINT", () => telegram.stop("SIGINT"));
process.once("SIGTERM", () => telegram.stop("SIGTERM"));
