export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export function readOptionalNumberEnv(name: string): number | undefined {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Env var ${name} must be a number`);
  }

  return parsed;
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
