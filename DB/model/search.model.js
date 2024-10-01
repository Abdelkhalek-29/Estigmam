import mongoose, { Schema, Types, model } from "mongoose";

const searchHistorySchema = new Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User'},
  tripId: { type: mongoose.Types.ObjectId, ref: 'Trip'},
  tripTitle: { type: String},
  berh: { type: String},
}, {
  timestamps: true
});

const searchHistoryModel =
  mongoose.models.searchHistoryModel || model("SearchHistoy", searchHistorySchema);
  export default searchHistoryModel;
