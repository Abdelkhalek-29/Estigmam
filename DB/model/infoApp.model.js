import mongoose, { Schema, Types, model } from "mongoose";
const infoAppSchema = new Schema(
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

const infoAppModel =
  mongoose.models.infoAppModel || model("infoApp", infoAppSchema);
export default infoAppModel;
