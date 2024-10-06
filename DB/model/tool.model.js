import mongoose, { Schema, Types, model } from "mongoose";
import randomstring from "randomstring";

const toolSchema = new Schema(
  {
    name: {
      type: String,
      max: 20,
    },
    type: {
      type: Types.ObjectId,
   //   ref: "TypesOfPlaces",
      required: true,
    },
    licensePdf: {
      id: { type: String },
      url: { type: String },
    },
    licenseNunmber:{
      type:String,
      min:6,
      max:12
    },
    licenseEndDate: {  
      type: Date,
    },
    toolImage: [
      {
        url: { type: String },
        id: { type: String },
      },
    ],
    toolVideo: {
      id: { type: String },
      url: { type: String },
    },

    location: {
      Longitude: { type: Number },
      Latitude: { type: Number },
    },
    portName: {
      type: String,
    },
    Examination_date:{
      type:Date
    },

    /*  categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },*/
    createBy: {
      type: Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    details: {
      type: String,
    },
    code:{
      type:String,
      unique: true

    },
    isUpdated:{
      type:Boolean,
      default:false
    },
    section: {
      name_en: { type: String },
      name_ar: { type: String },
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate a random code with '#'
toolSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = '#' + randomstring.generate({
      length: 3,
      charset: 'numeric'
    });
  }
  next();
});
const toolModel = mongoose.models.toolModel || model("Tool", toolSchema);

export default toolModel;
