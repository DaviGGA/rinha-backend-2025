import 'dotenv/config'
import { app } from "./app";
import { redis } from './payment/queue';

app.listen(9999, async () => {
  await redis.flushall();
  console.log(`Server open on port 9999`);
})




