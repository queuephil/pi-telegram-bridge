import { describe, expect, mock, test } from "bun:test";
import { createTelegramBridge } from "./src/bridge";

describe("Integration: Telegram -> bridge -> pi RPC -> Telegram", () => {
    test("mock telegram message from user runs full flow and sends response back", async () => {
        const sendPromptToPi = mock(async (message: string) => {
            expect(message).toBe("please summarize this");
            return "done";
        });

        const sendTelegramMessage = mock(
            async (chatId: number, text: string) => {
                expect(chatId).toBe(1001);
                expect(text).toBe("done");
            },
        );

        const bridge = createTelegramBridge({
            allowedUsers: [42],
            sendPromptToPi,
            sendTelegramMessage,
        });

        await bridge.handleTelegramUpdate({
            message: {
                text: "please summarize this",
                chat: { id: 1001 },
                from: { id: 42 },
            },
        });

        expect(sendPromptToPi).toHaveBeenCalledTimes(1);
        expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
        expect(sendPromptToPi).toHaveBeenCalledWith("please summarize this");
        expect(sendTelegramMessage).toHaveBeenCalledWith(1001, "done");
    });
});
