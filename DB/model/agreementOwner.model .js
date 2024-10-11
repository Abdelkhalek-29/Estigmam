import mongoose, { Schema, model } from "mongoose";

const agreementOwnerSchema = new Schema(
  {
    agreements: [
      {
        title: {
          type: String,
          required: true,
        },
        header: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const agreementOwnerModel =
  mongoose.models.agreementOwnerModel || model("AgreementOwner", agreementOwnerSchema);
export default agreementOwnerModel;
