import {Queue, Worker, Job} from "bullmq"
import { savePayment, processPayment, savePaymentProcessorHealth } from "./service";
import { Payment, ToProcessPayment } from "./mongo-payment";
import Redis from "ioredis";

export let redis: Redis;


redis = new Redis(
    process.env.REDIS_URI ?? "", { 
        maxRetriesPerRequest: null, 
    });

const queue = new Queue("payment-processor", {connection: redis});

const healthQueue = new Queue("check-health", { connection: redis });

redis.on("connect", async () => {
    healthQueue.upsertJobScheduler("check-health", { every: 5_000 })
})

const worker = new Worker("payment-processor", async (job: Job<ToProcessPayment>) => {
    return await processPayment(job.data)
}, {connection: redis})

worker.on("completed", async (job) => {
    const result = job.returnvalue as Payment;
    savePayment(result)
})

worker.on("failed", async () => {
    redis.set("processor", "fallback")
})

new Worker("check-health", async () => {
    savePaymentProcessorHealth()
}, {connection: redis, concurrency: 2})


export { queue }