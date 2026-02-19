type RpcPromptCommand = {
  type: "prompt";
  message: string;
};

type RpcPromptResponse = {
  text: string;
};

type RpcMessage = {
  role?: string;
  content?: unknown;
};

type RpcAgentEndEvent = {
  type: "agent_end";
  messages?: RpcMessage[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTextContent(
  value: unknown,
): value is { type: "text"; text: string } {
  return (
    isObject(value) && value.type === "text" && typeof value.text === "string"
  );
}

function extractAssistantText(
  messages: RpcMessage[] | undefined,
): string | null {
  const allMessages = messages ?? [];

  for (let index = allMessages.length - 1; index >= 0; index -= 1) {
    const message = allMessages[index];
    if (message?.role !== "assistant") {
      continue;
    }

    const { content } = message;

    if (typeof content === "string") {
      const text = content.trim();
      if (text.length > 0) {
        return text;
      }
      continue;
    }

    if (!Array.isArray(content)) {
      continue;
    }

    const text = content
      .filter(isTextContent)
      .map((part) => part.text.trim())
      .filter((part) => part.length > 0)
      .join("\n");

    if (text.length > 0) {
      return text;
    }
  }

  return null;
}

function parseAgentEndEvent(stdout: string): RpcAgentEndEvent | null {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let agentEndEvent: RpcAgentEndEvent | null = null;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (isObject(parsed) && parsed.type === "agent_end") {
        agentEndEvent = parsed as RpcAgentEndEvent;
      }
    } catch {
      // ignore non-JSON lines
    }
  }

  return agentEndEvent;
}

export async function sendRpcCommandToPi(
  command: RpcPromptCommand,
): Promise<RpcPromptResponse> {
  const process = Bun.spawn(["pi", "--mode", "rpc", "--no-session"], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  process.stdin.write(
    `${JSON.stringify({ id: "telegram-bridge-prompt", ...command })}\n`,
  );
  process.stdin.end();

  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(`pi RPC exited with code ${exitCode}: ${stderr.trim()}`);
  }

  const agentEndEvent = parseAgentEndEvent(stdout);
  if (agentEndEvent === null) {
    throw new Error(`No agent_end event in RPC output: ${stdout}`);
  }

  const text = extractAssistantText(agentEndEvent.messages);
  if (text === null) {
    throw new Error(
      `No assistant text in agent_end event: ${JSON.stringify(agentEndEvent)}`,
    );
  }

  return { text };
}
