import mongoose, { Schema, Types, model } from "mongoose";
const agreementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const agreementModel =
  mongoose.models.agreementModel || model("Agreement", agreementSchema);
export default agreementModel;
