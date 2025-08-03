import Redis from "ioredis";
import { Payment, ToProcessPayment } from "../payment/payment";
import { processPayment } from "../payment/service";
import { redis } from "../redis";


async function add(item: string) {
    return await redis.lpush("payment-queue", item);
}

async function addLast(item: unknown) {
    return await redis.rpush("payment-queue", JSON.stringify(item));
}

async function process() {
    const paymentsRedis = await Promise.all([
        redis.lpop("payment-queue"),
        redis.lpop("payment-queue"),
        redis.lpop("payment-queue"),  
        redis.lpop("payment-queue"),
        redis.lpop("payment-queue"),
    ]);

    const payments: ToProcessPayment[] = paymentsRedis
        .filter(Boolean)
        .map(p => JSON.parse(p as string));

    if (payments.length == 0) return false;
    
    await Promise.all(payments.map(processPayment));

    return true;
}

async function loop() {
    while(true) {
        const processed = await process();
        if (processed) continue;
        await new Promise((resolve) => setTimeout(resolve, 1));
    }
}

export const Queue = {add, addLast, loop}


