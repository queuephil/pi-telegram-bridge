import { describe, expect, mock, test } from "bun:test";
import { createTelegramBridge } from "../src/telegram-bridge";

type TelegramTextContext = {
    message: {
        text: string;
        chat: { id: number };
        from: { id: number };
    };
};

type RpcPromptCommand = {
    type: string;
    message: string;
};

describe("Integration: user -> telegram bot -> bridge -> pi RPC -> telegram -> user", () => {
    test("mocked telegram text message runs the full flow end-to-end", async () => {
        let textHandler:
            | ((ctx: TelegramTextContext) => Promise<void>)
            | undefined;

        const botOn = mock(
            (
                event: string,
                handler: (ctx: TelegramTextContext) => Promise<void>,
            ) => {
                expect(event).toBe("text");
                textHandler = handler;
            },
        );

        const sendTelegramMessage = mock(
            async (_chatId: number, _text: string) => {},
        );

        const sendRpcCommand = mock(async (command: RpcPromptCommand) => {
            expect(command.type).toBe("prompt");
            expect(command.message).toBe("please summarize this");
            return { text: "done" };
        });

        const telegramBot = {
            on: botOn,
            telegram: {
                sendMessage: sendTelegramMessage,
            },
        };

        const bridge = createTelegramBridge({
            allowedUsers: [42],
            telegramBot,
            sendRpcCommand,
        });

        await bridge.start();

        expect(botOn).toHaveBeenCalledTimes(1);
        expect(textHandler).toBeDefined();

        await textHandler?.({
            message: {
                text: "please summarize this",
                chat: { id: 1001 },
                from: { id: 42 },
            },
        });

        expect(sendRpcCommand).toHaveBeenCalledTimes(1);
        expect(sendTelegramMessage).toHaveBeenCalledTimes(1);
        expect(sendTelegramMessage).toHaveBeenCalledWith(1001, "done");
    });
});
