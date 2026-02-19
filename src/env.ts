export function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }

    return value;
}

export function parseAllowedUsers(value: string): number[] {
    const users = value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => Number(entry))
        .filter((id) => Number.isInteger(id));

    if (users.length === 0) {
        throw new Error(
            "ALLOWED_USERS must contain at least one numeric Telegram user id",
        );
    }

    return users;
}
