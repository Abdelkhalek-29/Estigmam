import mongoose, { Schema, Types, model } from "mongoose";

const additionSchema = new Schema(
    {
    name_en: {
      type: String,
      required: true,
        },
    name_ar:{
      type:String,
      required:true
    }
  },
  { timestamps: true }
);

const additionModel = mongoose.models.additionModel || model("Addition", additionSchema);

export default additionModel;
