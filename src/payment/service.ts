import { redis } from "./queue";
import { createPaymentProcessor } from "../gateway/payment-processor"
import { ServiceHealth } from "../gateway/service-health";
import { Payment, ToProcessPayment } from "./payment";
import { parseStringArrToJson, safeDollar} from "./utils";

export async function processPayment(payment: ToProcessPayment) {
  const chosenProcessor = (await redis.get("processor") ?? "default") as ("default" | "fallback");
  const paymentProcessor = createPaymentProcessor(chosenProcessor);

  const processPayment = {
    ...payment, 
    type: chosenProcessor,
    requestedAt: new Date().toISOString()
  }

  const { success } = await paymentProcessor.processPayment(processPayment);

  if(!success) 
    throw new Error("Não foi possível processor o pagamento.");

  return processPayment;
}

export async function savePayment(payment: Payment) {
  payment.amount = payment.amount * 100;
  return await redis.lpush("payments", JSON.stringify(payment))
}

export async function paymentSummary(from: string | undefined, to: string | undefined) {
  const stringPayments = (await redis.lrange("payments", 0, -1));

  const payments = parseStringArrToJson<Payment>(stringPayments)

  const result = {
    default: { totalRequests: 0, totalAmount: 0 },
    fallback: { totalRequests: 0, totalAmount: 0 }
  };
  
  for (let i = 0; i < payments.length; i++) {
    if(!isFromRange(payments[i], {from, to})) continue;
    
    if (payments[i].type == "default") {
      result.default.totalAmount += payments[i].amount;
      result.default.totalRequests += 1;
    }

    if (payments[i].type == "fallback") {
      result.fallback.totalAmount += payments[i].amount;
      result.fallback.totalRequests += 1;
    }
  }

  return {
    default: {...result.default, totalAmount: safeDollar(result.default.totalAmount)},
    fallback: {...result.fallback, totalAmount: safeDollar(result.fallback.totalAmount)}
  }
}

type Range = { from: string | undefined, to: string | undefined }
function isFromRange(payment: Payment, { from, to }: Range) {
  
  if (!from  && !to) return true;

  const paymentDate = new Date(payment.requestedAt).getTime();
  const fromDate = new Date(from!).getTime();
  const toDate = new Date(to!).getTime();

  if (from && !to) return fromDate <= paymentDate;
  if (!from && to) return paymentDate >= toDate;
  
  return fromDate <= paymentDate && toDate >= paymentDate
}

export async function savePaymentProcessorHealth() {
  const defaultHealthPromise = createPaymentProcessor("default").serviceHealth();
  const fallBackHealthPromise = createPaymentProcessor("fallback").serviceHealth();

  const [defaultHealth, fallbackHealth] = await Promise.all([
    defaultHealthPromise,
    fallBackHealthPromise
  ])

  if(!defaultHealth.success || !fallbackHealth.success) {
    return;
  }

  const chosenPaymentProcessor = choosePaymentProcessorHealth(
    defaultHealth.data, 
    fallbackHealth.data
  );

  redis.set("processor", chosenPaymentProcessor)
}

function choosePaymentProcessorHealth(
  defaultHealth: ServiceHealth,
  fallbackHealth: ServiceHealth
): "fallback" | "default" {
  if (defaultHealth.failing) return "fallback"

  const responseTimeRatio = defaultHealth.minResponseTime / fallbackHealth.minResponseTime;

  const MAX_RESPONSE_TIME_RATIO = 2.0;

  return responseTimeRatio > MAX_RESPONSE_TIME_RATIO ?
    "fallback" : "default"
}


