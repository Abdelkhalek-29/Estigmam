import mongoose, { Schema, Types, model } from "mongoose";

const typesOfPlacesSchema = new Schema(
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
    categoryId: {
      type: Types.ObjectId,
      required: true,
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
    isTool:{
      type:Boolean,
      required:true,
    }
  },
  { timestamps: true }
);

const typesOfPlacesModel =
  mongoose.models.typesOfPlacesModel ||
  model("TypesOfPlaces", typesOfPlacesSchema);

export default typesOfPlacesModel;
