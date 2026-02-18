import { describe, expect, test } from "bun:test";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = process.env.ALLOWED_USERS;

describe("Validation: Prerequisites", () => {
    test("pi CLI is installed", async () => {
        const exitCode = await Bun.spawn(["which", "pi"]).exited;
        expect(exitCode).toBe(0);
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
    test("pi prompt communication works", async () => {
        const process = Bun.spawn(["pi", "-p", "respond with 1 word"], {
            stdout: "pipe",
        });

        const [exitCode, stdout] = await Promise.all([
            process.exited,
            new Response(process.stdout).text(),
        ]);

        expect(exitCode).toBe(0);
        expect(stdout.trim().length).toBeGreaterThan(0);
    });

    test("RPC communication via pi --mode rpc works", async () => {
        const process = Bun.spawn(["pi", "--mode", "rpc", "--no-session"], {
            stdin: "pipe",
            stdout: "pipe",
        });

        process.stdin.write('{"id":"health-1","type":"get_state"}\n');
        process.stdin.end();

        const [exitCode, stdout] = await Promise.all([
            process.exited,
            new Response(process.stdout).text(),
        ]);

        expect(exitCode).toBe(0);

        const responseLine = stdout
            .split("\n")
            .find(
                (line) =>
                    line.includes('"type":"response"') &&
                    line.includes('"command":"get_state"'),
            );

        expect(responseLine).toBeDefined();

        const rpcResponse = JSON.parse(responseLine ?? "{}");
        expect(rpcResponse.success).toBe(true);
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
