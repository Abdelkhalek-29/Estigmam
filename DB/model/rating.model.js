import mongoose, { Schema, Types, model } from "mongoose";

const ratingSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User" },
    tripLeader: {
      type: Types.ObjectId,
      ref: "TripLeader",
    },

    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    trip: { type: Types.ObjectId, ref: "Trip" },
  },
  { timestamps: true }
);

const ratingModel =
  mongoose.models.ratingModel || model("Rating", ratingSchema);

export default ratingModel;
