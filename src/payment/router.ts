import Router from "@koa/router";
import { paymentSummary, processPayment } from "./controller";
import { Context } from "koa";
import { createPaymentProcessor } from "../gateway/payment-processor";

export const paymentRouter = new Router({prefix: "/"});

paymentRouter.post("payments", processPayment);
paymentRouter.get("payments-summary", paymentSummary);
paymentRouter.post("purge-payments", async (ctx: Context) => {
  await Promise.all([
    createPaymentProcessor("default").purgePayments(),
    createPaymentProcessor("fallback").purgePayments()
  ])
  
  ctx.status = 200
})