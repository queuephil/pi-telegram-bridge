# pi-telegram-bridge

Minimal triangle setup:

- `src/telegram`: Telegram bot + `sendToTelegram(...)`
- `src/pi`: incoming Telegram -> PI RPC -> Telegram reply
- `src/jobs`: generic job scheduler + concrete jobs (e.g. `fetch-hacker-news`)

## Run

```bash
bun install
TELEGRAM_BOT_TOKEN=... ALLOWED_USERS=123456 bun run src/index.ts
```

## Optional env

- `TELEGRAM_CHAT_ID`: required for jobs (where job messages are sent)
- `FETCH_HN_INTERVAL_MINUTES`: job interval (default: `1440`)
- `JOBS_ENABLED=false`: disable in-process jobs

If `TELEGRAM_CHAT_ID` is missing, jobs stay disabled.

## Cron: send Hacker News (last 24h) once per day

`src/jobs/run-fetch-hacker-news-once.ts` fetches top Hacker News stories from the last 24 hours and sends them to Telegram once.

Run manually:

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... bun run src/jobs/run-fetch-hacker-news-once.ts
```

Add a daily cron entry (example: every day at 09:00):

```cron
0 9 * * * cd /Users/philippquauke/_pq/dev/pi-telegram-bridge && /opt/homebrew/bin/bun run src/jobs/run-fetch-hacker-news-once.ts >> /tmp/pi-telegram-bridge-cron.log 2>&1
```
