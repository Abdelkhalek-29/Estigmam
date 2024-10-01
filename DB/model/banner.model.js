import mongoose, { Schema, Types, model } from "mongoose";

const bannerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      min: 4,
      max: 15,
    },
    image: {
      url: {
        type: String,
      },
      id: {
        type: String,
      },
    },
  /*  createdBy: {
      type: Types.ObjectId,
      ref:"Owner"
    },*/
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
const bannerModel =
  mongoose.models.bannerModel || model("Banner", bannerSchema);

export default bannerModel;
