export type Payment = {
  correlationId: string,
  amount: number,
  requestedAt: string,
  type: "fallback" | "default"
}

export type ToProcessPayment = Omit<Payment, "requestedAt" | "type">

