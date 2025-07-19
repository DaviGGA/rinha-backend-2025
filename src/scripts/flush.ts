import { redis } from "../payment/queue"

(async () => {
  await redis.flushall();
  console.log("DATABASE FLUSHED");
  process.exit(0)
})()