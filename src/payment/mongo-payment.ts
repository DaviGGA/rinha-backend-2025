import mongoose, { Model, mongo } from "mongoose";

export type Payment = {
  correlationId: string,
  amount: number,
  requestedAt: Date,
  type: "fallback" | "default"
}

export type ToProcessPayment = Omit<Payment, "requestedAt" | "type">

export type MongoPayment = Payment & Document;

const paymentSchema = new mongoose.Schema<MongoPayment>({
  correlationId: {
    required: true,
    type: String
  },
  amount: {
    required: true,
    type: Number,
  },
  type: {
    required: true,
    type: String
  },
  requestedAt: {
    required: true,
    type: Date
  }
})

export const PaymentModel: Model<MongoPayment> = 
  mongoose.model("Payment", paymentSchema)
