import mongoose, { Schema, Types, model } from "mongoose";

// Search History Schema
const searchHistoryBerthSchema = new Schema(
  {
    berthName: {
      type: String,
      required: true,
    },
    berthId: {
      type: Types.ObjectId,
      ref: "Berth",
      required: true,
    },
    location: {
      Longitude: { type: Number },
      Latitude: { type: Number },
    },
    userId: {
      type: Types.ObjectId, 
      required: true,
    }
  },
  { timestamps: true }
);

const searchHistoryBrthModel = mongoose.models.SearchHistoryBerth || model("SearchHistoryBerth", searchHistoryBerthSchema);

export default searchHistoryBrthModel;
