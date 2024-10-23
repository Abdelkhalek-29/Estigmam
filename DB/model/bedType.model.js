import mongoose, { Schema, Types, model } from "mongoose";

const bedTypeSchema = new Schema(
  {
    name_ar: {
      type: String,
      required: true,
      min: 5,
      max: 20,
    },
    name_en: {
      type: String,
      required: true,
      min: 5,
      max: 20,
    },
    /*createBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },*/
    description_ar: {
      type: String,
      required: true,
      min: 5,
    },
    description_en: {
      type: String,
      required: true,
      min: 5,
    },
     image: {
      url: {
        type: String,
      },
      id: {
        type: String,
      },
    }
    /*image: {
      url: {
        type: String,
      },
      id: {
        type: String,
      },
    },*/
  },
  { timestamps: true }
);

const bedTypeModel =
  mongoose.models.bedTypeModel || model("BedType", bedTypeSchema);

export default bedTypeModel;
