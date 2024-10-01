import mongoose, { Schema, Types, model } from "mongoose";

const customizeTripSchema = new Schema(
  {
        monthTrip: {
          type: String,
          required: true,    
        },
        dayTrip: {
          type: String,
          required: true,    
        },
        tripDuration: {
            type: String,
            required: true,    
        },
        categoryId: {
            type: Types.ObjectId,
            ref: "Category",
        },
        subCategoryId: {
            type: Types.ObjectId,
            ref: "Subcategory",
        },
    peopleNumber: {
      type: Number,
      min: 1,
      required: true,
    },
    berth: {type: String, required: true},
    addressTrip: { Longitude: { type: Number }, Latitude: { type: Number } },
    addressYou: { Longitude: { type: Number }, Latitude: { type: Number } },
    tripTitle: {
      type: String,
      min: 3,
      max: 50,
      required: true,
    },
    priceMember: {
      type: Number,
      default: 0,
      required: true,
    },
    addition: {
      type: String,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    tripIsComplete: {
      type: Boolean,
      default: false,
    },
   
  },
  { timestamps: true, strictQuery: true, toJSON: { virtuals: true } }
);

customizeTripSchema.virtual("finalPrice").get(function () {
  if (this.priceMember) {
    return Number.parseFloat(
      this.priceMember - (this.priceMember * this.offer || 0) / 100
    ).toFixed(2);
  }
});

customizeTripSchema.query.pagination = function (page) {
  page = !page || page < 1 || isNaN(page) ? 1 : page;
  const limit = 16;
  const skip = limit * (page - 1);
  return this.skip(skip).limit(limit);
};
customizeTripSchema.query.customSelect = function (fields) {
  if (!fields) return this;
  const modelKeys = Object.keys(tripModel.schema.paths);
  const queryKeys = fields.split(" ");
  const matchKeys = queryKeys.filter((key) => modelKeys.includes(key));
  return this.select(matchKeys);
};

// tripSchema.methods.inStock = function (requiredQuantity) {
//   return this.peopleNumber >= requiredQuantity ? true : false;
// };

const customizeTripModel = mongoose.models.customizeTripModel || model("customizeTrip", customizeTripSchema);
export default customizeTripModel;
