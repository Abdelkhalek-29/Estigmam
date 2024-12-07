import mongoose, { Schema, Types, model } from "mongoose";

const bankSchema = new Schema(
  {
    name_en: { type: String, required: true },
    name_ar: { type: String, required: true },
  },
  { timestamps: true }
);

const bankModel = mongoose.models.bankModel || model("Bank", bankSchema);

export default bankModel;
