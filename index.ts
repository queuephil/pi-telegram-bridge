import { Telegraf } from "telegraf";
import { createTelegramBridge } from "./src/bridge";
import { sendRpcCommandToPi } from "./src/pi-rpc";

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }

    return value;
}

function parseAllowedUsers(value: string): number[] {
    const users = value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => Number(entry))
        .filter((id) => Number.isInteger(id));

    if (users.length === 0) {
        throw new Error(
            "ALLOWED_USERS must contain at least one numeric Telegram user id",
        );
    }

    return users;
}

const telegramBotToken = requireEnv("TELEGRAM_BOT_TOKEN");
const allowedUsers = parseAllowedUsers(requireEnv("ALLOWED_USERS"));

const bot = new Telegraf(telegramBotToken);

const bridge = createTelegramBridge({
    allowedUsers,
    telegramBot: {
        on: (event, handler) => {
            bot.on(event, async (ctx) => {
                if (!("text" in ctx.message)) {
                    return;
                }

                await handler({
                    message: {
                        text: ctx.message.text,
                        chat: { id: ctx.chat.id },
                        from: ctx.from ? { id: ctx.from.id } : undefined,
                    },
                });
            });
        },
        telegram: {
            sendMessage: (chatId, text) =>
                bot.telegram.sendMessage(chatId, text),
        },
    },
    sendRpcCommand: sendRpcCommandToPi,
});

await bridge.start();
await bot.launch();

console.log("pi-telegram-bridge is running");

process.once("SIGINT", () => {
    bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
    bot.stop("SIGTERM");
});
