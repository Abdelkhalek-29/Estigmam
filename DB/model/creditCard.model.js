import mongoose, { Schema, Types, model } from "mongoose";

const creditCardSchema = new Schema(
  {
    cardNumber: {
      type: String,
      required: true,
    },
    cardHolderName: {
      type: String,
      required: true,
    },
    cardExpirationDate: {
      type: String,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    cardType: {
      type: String,
    },
  },
  { timestamps: true }
);

const creditCardModel =
  mongoose.models.creditCardModel || model("creditCard", creditCardSchema);

export default creditCardModel;
