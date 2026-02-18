import { describe, test, expect } from "bun:test";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = process.env.ALLOWED_USERS;

describe("Validation: Prerequisites", () => {
    test("pi-coding-agent is installed", async () => {
        const result = await Bun.spawn(["which", "pi-coding-agent"]).exited;
        expect(result).toBe(0);
    });

    test("TELEGRAM_BOT_TOKEN is set in environment", () => {
        expect(TELEGRAM_BOT_TOKEN).toBeDefined();
        expect(TELEGRAM_BOT_TOKEN).not.toBe("");
    });

    test("ALLOWED_USERS is set in environment", () => {
        expect(ALLOWED_USERS).toBeDefined();
        expect(ALLOWED_USERS).not.toBe("");
    });
});

describe("Validation: Health Check", () => {
    test("RPC communication to pi-coding-agent works", async () => {
        const process = Bun.spawn(["pi-coding-agent", "--version"]);
        const exitCode = await process.exited;
        expect(exitCode).toBe(0);
    });

    test("Telegram bot communication works", async () => {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.ok).toBe(true);
        expect(data.result.id).toBeDefined();
    });
});
