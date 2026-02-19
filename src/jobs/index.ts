export type ScheduledJob = {
  name: string;
  intervalMinutes: number;
  run: () => Promise<void>;
  runOnStart?: boolean;
};

type StartJobsOptions = {
  enabled: boolean;
  jobs: ScheduledJob[];
};

function scheduleJob(job: ScheduledJob) {
  const intervalMs = job.intervalMinutes * 60 * 1000;
  const shouldRunOnStart = job.runOnStart ?? true;

  const runJob = async () => {
    try {
      await job.run();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown job error";
      console.error(`job '${job.name}' failed: ${text}`);
    }
  };

  if (shouldRunOnStart) {
    void runJob();
  }

  setInterval(() => {
    void runJob();
  }, intervalMs);
}

export function startJobs(options: StartJobsOptions) {
  if (!options.enabled) {
    return;
  }

  for (const job of options.jobs) {
    scheduleJob(job);
  }
}
