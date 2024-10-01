import mongoose, { Schema, Types, model } from "mongoose";
const agreementOwnerSchema = new Schema(
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

const agreementOwnerModel =
  mongoose.models.agreementOwnerModel || model("AgreementOwner", agreementOwnerSchema);
export default agreementOwnerModel;
