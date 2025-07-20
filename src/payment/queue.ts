import {Queue, Worker, Job} from "bullmq"
import { savePayment, processPayment, savePaymentProcessorHealth } from "./service";
import { Payment, ToProcessPayment } from "./payment";
import Redis from "ioredis";

export let redis: Redis;

redis = new Redis(
    process.env.REDIS_URI ?? "", { 
        maxRetriesPerRequest: null, 
        keepAlive: 100,
    });

const queue = new Queue("payment-processor", {connection: redis});

const healthQueue = new Queue("check-health", { connection: redis });

redis.on("connect", async () => {
    healthQueue.upsertJobScheduler("check-health", { every: 5_000 })
})

const worker = new Worker("payment-processor", async (job: Job<ToProcessPayment>) => {
    return await processPayment(job.data)
}, {connection: redis, concurrency: 48})

worker.on("completed", async (job) => {
    const result = job.returnvalue as Payment;
    savePayment(result)
})

worker.on("failed", async (job) => {
    redis.set("processor", "fallback");
})

new Worker("check-health", async () => {
    savePaymentProcessorHealth()
}, {connection: redis})


export { queue }