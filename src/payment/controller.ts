import { Context } from "koa";
import { queue } from "./queue";
import * as service from "./service";

export function processPayment(ctx: Context) {
  const body = ctx.request.body;
  
  queue.add("process-payment", body, {
    attempts: 3, 
    backoff: {
      type :"fixed", 
      delay: 1_000
    }
  })

  ctx.status = 200;
  ctx.body = { message: "Pagamento na fila" }
}

export async function paymentSummary(ctx: Context) {
  const { from, to } = ctx.query;

  const summary = await service.paymentSummary(
    from as string | undefined, 
    to as string | undefined
  );
    
  ctx.status = 200
  ctx.body = summary
}