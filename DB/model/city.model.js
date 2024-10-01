import mongoose, { Schema, Types, model } from "mongoose";

const citySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    countryId: {
      type: Types.ObjectId,
      ref: "Country",
    },
    location: {
      Longitude: { type: Number },
      Latitude: { type: Number },
    },
  },
  { timestamps: true }
);
const cityModel = mongoose.models.cityModel || model("City", citySchema);
export default cityModel;
