import { ServiceHealth } from "../gateway/service-health";
import { Payment } from "../payment/payment";

type ServiceHealthResponse =
  {success: true, data: ServiceHealth} |
  {success: false, data: null}

export type PaymentProcessor = {
  serviceHealth: () => Promise<ServiceHealthResponse>,
  processPayment: (payment: Payment) => Promise<{success: boolean}>
  purgePayments: () => Promise<void>
}

function serviceHealth(url: string): () => Promise<ServiceHealthResponse> {

  return async () => {
    const result = await fetch(
      `${url}/payments/service-health`
    )

    if(result.status == 429) {
      return { success: false, data: null }
    }

    if (!result.ok) {
      throw new Error("Invalid call to PROCESSOR PAYMENT")
    }

    return {
      success: true,
      data: await result.json() as ServiceHealth 
    }
  }
  
}

function processPayment(url: string) {
  return async (payment: Payment) => {
    const result = await fetch(`${url}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payment)});
    
      return {success: result.ok}
  }
}

function purgePayments(url: string) {
  return async () => {
    await fetch(`${url}/admin/purge-payments`)
  }
}

const processorUrl = {
  default: process.env.PAYMENT_PROCESSOR_URL_DEFAULT as string,
  fallback: process.env.PAYMENT_PROCESSOR_URL_FALLBACK as string
} as const

export function createPaymentProcessor(processor: "default" | "fallback"): PaymentProcessor {
  const url = processorUrl[processor];

  return {
    serviceHealth: serviceHealth(url),
    processPayment: processPayment(url),
    purgePayments: purgePayments(url)
  }
}

