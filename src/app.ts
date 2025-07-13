import Koa, { Context, Next } from "koa";
import bodyParser from "koa-bodyparser";
import { paymentRouter } from "./payment/router";
import { error } from "console";

const app = new Koa();

app.use(async (ctx: Context, next: Next) => {
  try {
    await next()
  } catch(error) {
    console.log(error);
    ctx.body = error;
    ctx.status = 500;
  }
})

app.use(bodyParser());
app.use(paymentRouter.routes())

export { app }