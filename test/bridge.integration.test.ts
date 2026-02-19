import { describe, expect, mock, test } from "bun:test";
import type { TelegramTextMessage } from "../src/telegram";
import { startPiBridge } from "../src/pi";

describe("PI bridge", () => {
  test("allowed telegram user message is sent to PI and response is sent back", async () => {
    let textHandler:
      | ((message: TelegramTextMessage) => Promise<void>)
      | undefined;

    const onText = mock(
      (handler: (message: TelegramTextMessage) => Promise<void>) => {
        textHandler = handler;
      },
    );

    const sendPrompt = mock(async () => ({ text: "done" }));
    const sendToTelegram = mock(async () => {});

    startPiBridge({
      allowedUsers: [42],
      onText,
      sendToTelegram,
      sendPrompt,
    });

    await textHandler?.({
      text: "please summarize this",
      chatId: 1001,
      fromUserId: 42,
    });

    expect(sendPrompt).toHaveBeenCalledTimes(1);
    expect(sendToTelegram).toHaveBeenCalledTimes(1);
    expect(sendToTelegram).toHaveBeenCalledWith("done", 1001);
  });
});
