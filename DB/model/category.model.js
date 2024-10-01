import mongoose, { Schema, Types, model } from "mongoose";

const categorySchema = new Schema(
  {
    name_en: {
      type: String,
      required: true,
      min: 4,
      max: 15,
    },
    name_ar: {
      type: String,
      required: true,
      min: 4,
      max: 15,
    },
    slug: {
      type: String,
      required: true,
    },
    image: {
      url: {
        type: String,
       
      },
      id: {
        type: String,
       
      },
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

categorySchema.virtual("subcategory", {
  ref: "Subcategory",
  localField: "_id",
  foreignField: "categoryId",
});

const categoryModel =
  mongoose.models.categoryModel || model("Category", categorySchema);

export default categoryModel;
