import mongoose, { Schema, Types, model } from "mongoose";

const cardSchema = new Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    actorType: {
      type: String,
      enum: ["User", "Owner", "TripLeader"],
      required: true,
    },
    cardholderName: { type: String, required: true },
    token: { type: String, required: true },
    last4Digits: { type: String, required: true },
    cardType: {
      type: String,
      enum: ["Visa", "MasterCard", "Mada"],
      required: true,
    },
    expiryDate: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },

  { timestamps: true }
);

const cardModel = mongoose.models.cardModel || model("Card", cardSchema);

export default cardModel;
