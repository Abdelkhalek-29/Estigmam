import mongoose, { Schema, Types, model } from "mongoose";
const infoAppOwnerSchema = new Schema(
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

const infoAppOwnerModel =
  mongoose.models.infoAppOwnerModel ||
  model("infoAppOwner", infoAppOwnerSchema);
export default infoAppOwnerModel;
