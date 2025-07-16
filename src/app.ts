import Koa, { Context, Next } from "koa";
import bodyParser from "koa-bodyparser";
import { paymentRouter } from "./payment/router";

const app = new Koa();

app.use(bodyParser());
app.use(paymentRouter.routes())

export { app }