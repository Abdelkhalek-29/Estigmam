import mongoose, { Schema, Types, model } from "mongoose";

const countrySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    codePhone: {
      type: Number,
      required: true,
    },
    image: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dz5dpvxg7/image/upload/v1706484939/fast-plate/Screenshot_2022-09-10_040814_vhfktx.png",
      },
      id: {
        type: String,
        default: "fast-plate/Screenshot_2022-09-10_040814_vhfktx.png",
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
countrySchema.virtual("city", {
  ref: "City",
  localField: "_id",
  foreignField: "countryId",
});
const countryModel =
  mongoose.models.countryModel || model("Country", countrySchema);
export default countryModel;
