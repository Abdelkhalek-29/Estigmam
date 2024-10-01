import mongoose, { Schema, Types, model } from "mongoose";

const activitySchema = new Schema(
  {
    name_en: {
      type: String,
      required: true,
      min: 3,
      max: 20,
    },
    name_ar: {
      type: String,
      required: true,
      min: 3,
      max: 20,
    },
    type: {
      type: Types.ObjectId,
      required: true,
      ref: "TypesOfPlaces",
    },
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
    },
   /* image: {
      id: {
        type: String,
      },
      url: {
        type: String,
      },
    },*/
    createBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },
  },
  { timestamps: true }
);

const activityModel =
  mongoose.models.activityModel || model("Activity", activitySchema);

export default activityModel;
