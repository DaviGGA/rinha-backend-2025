import { redis } from "./queue";
import { createPaymentProcessor } from "../gateway/payment-processor"
import { ServiceHealth } from "../gateway/service-health";
import { Payment, PaymentModel, ToProcessPayment } from "./mongo-payment";
import { PipelineStage } from "mongoose";

export async function processPayment(payment: ToProcessPayment) {
  const chosenProcessor = (await redis.get("processor") ?? "default") as ("default" | "fallback");
  const paymentProcessor = createPaymentProcessor(chosenProcessor);

  const processPayment = {
    ...payment, 
    type: chosenProcessor,
    requestedAt: new Date()
  }

  const { success } = await paymentProcessor.processPayment(processPayment);

  if(!success) 
    throw new Error("Não foi possível processor o pagamento.");

  return processPayment;
}

export async function savePayment(payment: Payment) {
  return await PaymentModel.create(payment)
}

export async function paymentSummary(from: string | undefined, to: string | undefined) {
  const result = await PaymentModel.aggregate([
    { $match: !from && !to ? {} : dateFilter(from, to) },
    {
      $group: {
        _id: "$type",
        totalRequests: {$sum: 1},
        totalAmount: {$sum: "$amount"}
      },  
    }
  ])

  const fallBackResult = result
    .find(agg => agg._id == "fallback")
    
  const defaultResult = result
    .find(agg => agg._id == "default")

  return {
    default: defaultResult ?? { totalRequests: 0, totalAmount: 0 },
    fallback: fallBackResult ?? { totalRequest: 0, totalAmount: 0 }
  }
}

function dateFilter(from: string | undefined, to: string | undefined) {
  const obj: Record<string, any> = {requestedAt: {} };
  if (from) obj.requestedAt.$gte = new Date(from);
  if (to) obj.requestedAt.$lte = new Date(to);
  return obj
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