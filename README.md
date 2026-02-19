# pi-telegram-bridge

A small Bun + TypeScript service that bridges Telegram messages to `pi-coding-agent` via RPC.

It listens to incoming Telegram text messages, allows only configured user IDs, forwards the prompt to `pi`, and sends the assistant response back to the same Telegram chat.

## Quickstart

1. Install dependencies

```bash
bun install
```

2. Make sure `pi` is installed and available in your PATH

```bash
which pi
```

3. Create a Telegram bot and get a token (`TELEGRAM_BOT_TOKEN`)

4. Choose allowed Telegram user IDs (`ALLOWED_USERS`) as comma-separated list, e.g. `123456,789012`

5. Run the bridge

```bash
TELEGRAM_BOT_TOKEN=... ALLOWED_USERS=123456 bun run src/index.ts
```

6. Send a text message to your bot

- The message is forwarded to `pi`
- The response is posted back to the same chat
