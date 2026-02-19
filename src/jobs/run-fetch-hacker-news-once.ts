import { readOptionalNumberEnv, requireEnv } from "../env";
import { runFetchHackerNewsJob } from "./fetch-hacker-news";
import { createTelegramService } from "../telegram";

const botToken = requireEnv("TELEGRAM_BOT_TOKEN");
const chatId = readOptionalNumberEnv("TELEGRAM_CHAT_ID");

if (chatId === undefined) {
  throw new Error("Missing required env var for cron job: TELEGRAM_CHAT_ID");
}

const telegram = createTelegramService({
  botToken,
  defaultChatId: chatId,
});

try {
  const text = await runFetchHackerNewsJob();
  await telegram.sendToTelegram(text);
  console.log("fetch-hacker-news cron job sent update to Telegram");
} catch (error) {
  const text = error instanceof Error ? error.message : "Unknown job error";
  await telegram.sendToTelegram(`fetch-hacker-news cron job failed: ${text}`);
  throw error;
}
