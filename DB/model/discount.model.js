import mongoose, { Schema, Types, model } from "mongoose";
const discountSchema = new Schema(
  {
    discount: {
      type: Number,
      required: true,
    },
    expireAt: {
      type: Date,
      required:true,
    },
  },
  { timestamps: true }
);

const discountModel =
  mongoose.models.discountModel || model("Discount", discountSchema);
export default discountModel;
