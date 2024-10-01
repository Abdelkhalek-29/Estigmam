import mongoose, { Schema, Types, model } from "mongoose";
const transactionsOwnAndTripLeadsSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "owner",
    },
    tripLeaderId: {
      type: Types.ObjectId,
      ref: "tripLeader",
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

const transactionsOwnAndTripLeadModel =
  mongoose.models.transactionsOwnAndTripLeadModel ||
  model("TransactionsOwnAndTripLead", transactionsOwnAndTripLeadsSchema);
export default transactionsOwnAndTripLeadModel;
