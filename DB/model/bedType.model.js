import mongoose, { Schema, Types, model } from "mongoose";

const bedTypeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      min: 5,
      max: 20,
    },
    createBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    description: {
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
    },

    
  },
  { timestamps: true }
);

const bedTypeModel =
  mongoose.models.bedTypeModel || model("BedType", bedTypeSchema);

export default bedTypeModel;
