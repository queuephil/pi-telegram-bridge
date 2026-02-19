import type { ScheduledJob } from ".";

const HN_SEARCH_API = "https://hn.algolia.com/api/v1/search_by_date";
const HN_WINDOW_HOURS = 24;
const MAX_STORIES_TO_FETCH = 50;
const MAX_STORIES_TO_SEND = 5;

type HNSearchHit = {
  objectID?: string;
  title?: string;
  author?: string;
  points?: number;
  url?: string;
};

type HNSearchResponse = {
  hits?: HNSearchHit[];
};

type CreateFetchHackerNewsJobOptions = {
  intervalMinutes: number;
  sendToTelegram: (text: string, chatId?: number) => Promise<void>;
};

async function fetchRecentStories(hours: number): Promise<HNSearchHit[]> {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const oldestTimestamp = nowInSeconds - hours * 60 * 60;

  const url = new URL(HN_SEARCH_API);
  url.searchParams.set("tags", "story");
  url.searchParams.set("hitsPerPage", String(MAX_STORIES_TO_FETCH));
  url.searchParams.set("numericFilters", `created_at_i>${oldestTimestamp}`);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Hacker News API request failed: ${response.status}`);
  }

  const data = (await response.json()) as HNSearchResponse;
  return data.hits ?? [];
}

export async function runFetchHackerNewsJob(): Promise<string> {
  const stories = await fetchRecentStories(HN_WINDOW_HOURS);

  const lines = stories
    .filter(
      (story): story is HNSearchHit & { objectID: string; title: string } => {
        return Boolean(story.objectID && story.title);
      },
    )
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, MAX_STORIES_TO_SEND)
    .map((story, index) => {
      const storyUrl =
        story.url ?? `https://news.ycombinator.com/item?id=${story.objectID}`;
      const points = story.points ?? 0;
      const author = story.author ?? "unknown";
      return `${index + 1}. ${story.title} (${points} points, by ${author})\n${storyUrl}`;
    });

  if (lines.length === 0) {
    return "Could not fetch Hacker News stories from the last 24 hours right now.";
  }

  return `Top Hacker News stories from the last 24 hours:\n\n${lines.join("\n\n")}`;
}

export function createFetchHackerNewsJob(
  options: CreateFetchHackerNewsJobOptions,
): ScheduledJob {
  const { intervalMinutes, sendToTelegram } = options;

  return {
    name: "fetch-hacker-news",
    intervalMinutes,
    run: async () => {
      try {
        const text = await runFetchHackerNewsJob();
        await sendToTelegram(text);
      } catch (error) {
        const text =
          error instanceof Error ? error.message : "Unknown job error";
        await sendToTelegram(`fetch-hacker-news job failed: ${text}`);
      }
    },
  };
}
