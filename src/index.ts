import { Telegraf } from "telegraf";
import { parseAllowedUsers, requireEnv } from "./env";
import { sendRpcCommandToPi } from "./pi-rpc-client";
import { createTelegramBridge } from "./telegram-bridge";

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
