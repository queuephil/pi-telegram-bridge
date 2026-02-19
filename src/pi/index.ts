import type { TelegramTextMessage } from "../telegram";
import { sendRpcCommandToPi } from "./rpc-client";

type StartPiBridgeOptions = {
  allowedUsers: number[];
  onText: (handler: (message: TelegramTextMessage) => Promise<void>) => void;
  sendToTelegram: (text: string, chatId?: number) => Promise<void>;
  sendPrompt?: (command: { type: "prompt"; message: string }) => Promise<{
    text: string;
  }>;
};

export function startPiBridge(options: StartPiBridgeOptions) {
  const allowedUserIds = new Set(options.allowedUsers);
  const sendPrompt = options.sendPrompt ?? sendRpcCommandToPi;

  options.onText(async (message) => {
    if (
      message.fromUserId === undefined ||
      !allowedUserIds.has(message.fromUserId)
    ) {
      return;
    }

    try {
      const response = await sendPrompt({
        type: "prompt",
        message: message.text,
      });

      await options.sendToTelegram(response.text, message.chatId);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown PI error";

      await options.sendToTelegram(`PI error: ${text}`, message.chatId);
    }
  });
}
