import Redis from "ioredis";
import genericPool from "generic-pool";

const factory = {
    create: () => Promise.resolve(new Redis(process.env.REDIS_URI ?? "", {keepAlive: 1000})),
    destroy: (client: Redis) => {
        client.quit()
        return Promise.resolve()
    }
}

const options = {
    max: 8,
    min: 6
}

export const redisPool = genericPool.createPool(factory, options);