# pi-telegram-bridge

A small bridge that lets approved Telegram users talk to `pi-coding-agent` through RPC.

## Problem this repo solves

This project connects `pi-coding-agent` with Telegram:

1. A user sends a message to your Telegram bot.
2. `pi-telegram-bridge` receives the message.
3. `pi-telegram-bridge` forwards the message as an RPC prompt to `pi-coding-agent`.
4. `pi-coding-agent` responds.
5. `pi-telegram-bridge` sends that response back to the same Telegram chat.

Only users listed in `ALLOWED_USERS` are allowed to interact with the bot.

## Prerequisites

- `pi-coding-agent` installed via Bun
- `pi-telegram-bridge` installed via Bun
- Environment variables:
  - `TELEGRAM_BOT_TOKEN`
  - `ALLOWED_USERS`

## Installation

```bash
bun install
```

## Run

```bash
TELEGRAM_BOT_TOKEN=... ALLOWED_USERS=123456 bun run index.ts
```

If startup succeeds, you should see:

```text
pi-telegram-bridge is running
```

## How it works (high-level)

- Telegram updates are consumed with [`telegraf`](https://github.com/telegraf/telegraf).
- Incoming text messages from allowed users are transformed into RPC commands.
- The bridge spawns:

```bash
pi --mode rpc --no-session
```

- It sends a prompt command, waits for the `agent_end` event, extracts assistant text, and replies in Telegram.

## Validation / health checks

This repo includes validation tests for:

- `pi` CLI availability
- required environment variables
- basic prompt communication with `pi`
- RPC communication with `pi --mode rpc`
- Telegram bot API communication (`getMe`)

Run tests with:

```bash
bun test
```

## Notes

- Non-text Telegram updates are ignored.
- Messages from users not in `ALLOWED_USERS` are ignored.
- This project currently runs in polling mode via Telegraf `bot.launch()`.
