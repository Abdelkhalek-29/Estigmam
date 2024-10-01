import mongoose, { Schema, Types, model } from "mongoose";
const codeSchema = new Schema(
  {
    code: {
      type: Number,
      required: true,
    },
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
  },
  { timestamps: true }
);

const codeModel =
  mongoose.models.codeModel || model("Code", codeSchema);
export default codeModel;
