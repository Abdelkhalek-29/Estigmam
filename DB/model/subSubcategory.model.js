import mongoose, { Schema, Types, model } from "mongoose";

const subSubCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      min: 5,
      max: 20,
    },
    slug:{
      type: String,
      required: true,
    },
    
    subcategoryId: {
      type: Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    createBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },
  },
  { timestamps: true }
);

const subSubCategoryModel =
  mongoose.models.subSubCategoryModel || model("SubSubcategory", subSubCategorySchema);

export default subSubCategoryModel;
