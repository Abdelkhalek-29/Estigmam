import mongoose, { Schema, Types, model } from "mongoose";
import randomstring from "randomstring";

const placesSchema = new Schema(
  {
    name: {
      type: String,
      min: 5,
      max: 20,
    },
    slug: {
      type: String,
    },
    type: {
      type: Types.ObjectId,
      required: true,
      ref: "TypesOfPlaces",
    },
    location: { Longitude: { type: Number }, Latitude: { type: Number } },
    description: {
      type: String,
    },
    LicenseFile: {
      id: { type: String },
      url: { type: String },
    },
    licenseNumber: {
      type: String,
    },
    ExpiryDate: {
      type: String,
    },

    images: [
      {
        url: { type: String },
        id: { type: String },
      },
    ],
    video: {
      url: { type: String },
      id: { type: String },
    },
    createBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    code:{
      type:String,
      unique: true

    },
    isUpdated:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

// Pre-save hook to generate a random code with '#'
placesSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = '#' + randomstring.generate({
      length: 3,  
      charset: 'numeric'
    });
  }
  next();
});

const placesModel = mongoose.models.placesModel || model("Place", placesSchema);

export default placesModel;
