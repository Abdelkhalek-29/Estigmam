import mongoose, { Schema, Types, model } from "mongoose";

const berthSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: 4,
            max: 15,
        },
       cityId: {
            type: Types.ObjectId,
            ref: "City",
            required: true,
        },
       location:{ Longitude: { type: Number }, Latitude: { type: Number } },
       countryId: {
        type: Types.ObjectId,
        ref: "Country", 
        required: true, 
      },
      images: [
        {
          url: {
            type: String,
            required: true,
          },
          id: {
            type: String,
            required: true,
          },
        },],
        details:{
          type:String,
          required:true
        }
  },
  { timestamps: true }
);

berthSchema.index({ "location": "2dsphere" });

const berthModel =
  mongoose.models.berthModel || model("Berth", berthSchema);

export default berthModel;
