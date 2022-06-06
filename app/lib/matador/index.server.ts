import type { Job as __BullJob } from "bullmq";
import { Queue } from "bullmq";
import type Redis from "ioredis";
import { redis } from "~/lib/matador/helpers/redis-helpers.server";

export type RedisInfo = {
  [sectionTitle: string]: {
    [fieldKey: string]: string;
  };
};

export type Job = __BullJob<any, any, string>;

export const getRedisInfo = async (redis: Redis): Promise<RedisInfo> => {
  const redisInfo: RedisInfo = {};
  const rawRedisInfo = await redis.info();
  let currentSection = "";
  const lines = rawRedisInfo.split("\r\n").filter((line) => line !== "");
  for (const line of lines) {
    const isSection = line.startsWith("#");
    if (isSection) {
      currentSection = line.split(" ")[1];
      redisInfo[currentSection] = {};
    } else {
      const [key, value] = line.split(":");
      redisInfo[currentSection][key] = value;
    }
  }
  return redisInfo;
};

export const getQueues = async (redis: Redis): Promise<string[]> => {
  const getRedisKeys = async (redis: Redis, pattern: string) => {
    let [cursor, cursorKeys]: [string, string[]] = ["", []];
    const keys = cursorKeys;
    while (cursor !== "0") {
      [cursor, cursorKeys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        1000,
        "TYPE",
        "hash"
      );
      keys.push(...cursorKeys);
    }
    return keys;
  };

  const bullRedisKeys = await getRedisKeys(redis, "bull:*");

  const queues: string[] = [];
  bullRedisKeys.forEach((key) => {
    const name = key.split(":")[1];
    if (queues.includes(name)) {
      return;
    }
    queues.push(name);
  });

  return queues;
};

export const getQueueJobs = async (queueName: string): Promise<Job[]> => {
  const queue = new Queue(queueName, { connection: redis });
  return queue.getJobs();
};

export const getRepeatableQueueJobs = async (
  queueName: string,
  id: string
): Promise<Job[]> => {
  const queue = new Queue(queueName, { connection: redis });
  const queueJobs = await queue.getJobs();
  return queueJobs.filter((job) => {
    if (job.id) {
      return job.id.includes(`repeat:${id}`);
    }
    return false;
  });
};

export const getRedisClients = async (redis: Redis): Promise<string> => {
  return redis.client("LIST") as any;
};

export const getQueueJob = async (
  queueName: string,
  jobId: string
): Promise<Job | undefined> => {
  const queue = new Queue(queueName, { connection: redis });
  return queue.getJob(jobId);
};

export const getMatadorVersion = () => {
  return process.env.MATADOR_VERSION ?? "Not provided";
};
