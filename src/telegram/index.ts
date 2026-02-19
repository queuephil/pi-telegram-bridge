import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

export type TelegramTextMessage = {
  text: string;
  chatId: number;
  fromUserId?: number;
};

type CreateTelegramServiceOptions = {
  botToken: string;
  defaultChatId?: number;
};

export function createTelegramService(options: CreateTelegramServiceOptions) {
  const bot = new Telegraf(options.botToken);

  const onText = (handler: (message: TelegramTextMessage) => Promise<void>) => {
    bot.on(message("text"), async (ctx) => {
      await handler({
        text: ctx.message.text,
        chatId: ctx.chat.id,
        fromUserId: ctx.from?.id,
      });
    });
  };

  const sendToTelegram = async (text: string, chatId?: number) => {
    const targetChatId = chatId ?? options.defaultChatId;

    if (targetChatId === undefined) {
      throw new Error(
        "No Telegram chat id provided. Set TELEGRAM_CHAT_ID or pass chatId explicitly.",
      );
    }

    await bot.telegram.sendMessage(targetChatId, text);
  };

  const start = async () => {
    await bot.launch();
  };

  const stop = (reason: string) => {
    bot.stop(reason);
  };

  return {
    onText,
    sendToTelegram,
    start,
    stop,
  };
}
