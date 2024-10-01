import mongoose, { Schema, Types, model } from "mongoose";
const transactionsSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "user",
    },
    price: {
      type: Number,
      required: true,
    },
    nameTransaction: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Withdraw", "Deposit"],
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    date: {
      type: String,
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

const transactionsModel =
  mongoose.models.transactionsModel || model("transaction", transactionsSchema);
export default transactionsModel;
