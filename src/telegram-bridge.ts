type TelegramTextContext = {
    message: {
        text: string;
        chat: { id: number };
        from?: { id: number };
    };
};

type TelegramBot = {
    on: (
        event: "text",
        handler: (ctx: TelegramTextContext) => Promise<void>,
    ) => void;
    telegram: {
        sendMessage: (chatId: number, text: string) => Promise<unknown>;
    };
};

type RpcPromptCommand = {
    type: "prompt";
    message: string;
};

type RpcPromptResponse = {
    text: string;
};

type CreateTelegramBridgeOptions = {
    allowedUsers: number[];
    telegramBot: TelegramBot;
    sendRpcCommand: (command: RpcPromptCommand) => Promise<RpcPromptResponse>;
};

export function createTelegramBridge(options: CreateTelegramBridgeOptions) {
    const { allowedUsers, telegramBot, sendRpcCommand } = options;
    const allowedUserIds = new Set(allowedUsers);

    const handleTextMessage = async (ctx: TelegramTextContext) => {
        const { message } = ctx;
        const userId = message.from?.id;

        if (userId === undefined || !allowedUserIds.has(userId)) {
            return;
        }

        const rpcResponse = await sendRpcCommand({
            type: "prompt",
            message: message.text,
        });

        await telegramBot.telegram.sendMessage(
            message.chat.id,
            rpcResponse.text,
        );
    };

    const start = async () => {
        telegramBot.on("text", handleTextMessage);
    };

    return { start };
}
