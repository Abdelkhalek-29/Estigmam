import mongoose, { Schema, Types, model } from "mongoose";
const transactionSchema = new Schema(
  {
    actorId: { type: Types.ObjectId, required: true },
    actorType: {
      type: String,
      enum: ["User", "Owner", "TripLeader"],
      required: true,
    },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["Wallet", "Trip"], required: true },
    method: {
      type: String,
      enum: ["Card", "APPle", "Google", "PayPal", "Wallet"],
    },
    status: {
      type: String,
      enum: ["placed", "Payed", "failed"],
      default: "placed",
    },
    numberOfTickets: Number,
    tripId: { type: Types.ObjectId },
    reason: { type: String },
    date: { type: Date, default: Date.now },
    transactionId: { type: Number },
  },
  { timestamps: true }
);

const transactionModel =
  mongoose.models.transactionModel || model("transaction", transactionSchema);
export default transactionModel;
