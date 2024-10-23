import mongoose, { Schema, Types, model } from "mongoose";

const tripSchema = new Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    tripDuration: {
      days: { type: Number, default: 0 },
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
    },
    peopleNumber: {
      type: Number,
      min: 1,
      required: true,
    },
    numberOfPeopleAvailable: {
      type: Number,
      min: 0,
    },
    startLocation: { Longitude: { type: Number }, Latitude: { type: Number } },
    endLocation: { Longitude: { type: Number }, Latitude: { type: Number } },
    cityId: { type: Types.ObjectId, ref: "City"},
    berh: { type: String },
   // descriptionAddress: { type: String },
    tripTitle: {
      type: String,
      min: 3,
      max: 50,
      required: true,
    },
    //description: String,
    priceMember: {
      type: Number,
      default: 0,
      required: true,
    },
    addition: [
      {
        type: Types.ObjectId,
        ref: "Addition",
        default:""
      },
    ],
    bedType: [{ type: Types.ObjectId, ref: "BedType" }],
    subImages: [
      {
        url: { type: String },
        id: { type: String },
      },
    ],
    defaultImage: {
      url: { type: String },
      id: { type: String },
    },
    offer: {
      type: Number,
      min: 0,
      max: 100,
      default:0,
    },
    priceAfterOffer: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "Owner",
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isCustomized:{
      type:Boolean,
      required:true,
      default:false
    },
    /*subCategory: {
      type: Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },*/

    /*  Likes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],*/
    typeOfPlace: {
      type: Types.ObjectId,
      ref: "TypesOfPlaces",
      required: true,
    },
    activity: {
      type: Types.ObjectId,
      ref: "Activity",
      default: null // Use null to indicate the absence of a reference
    },
    equipmentId: {
      type: Types.ObjectId,
    },
    tripLeaderId: {
      type: Types.ObjectId,
      ref: "TripLeader",
    },
    tripCode: {
      type: String,
      unique: true,
      required: true,
    },

    distance: {
      type: String,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "confirmed", "cancelled", "rejected","current","upComing"],
      default: "confirmed",
    },
    //ratings: [{ type: Types.ObjectId, ref: "Rating" }],
    /*averageRating: {
      type: Number,
      default: 0,
    },*/
    numberBooked: {
      type: String,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
    },
    city: String,
    isFavourite:{
      type:Boolean,
      default:false
    },
    description:{
      type:String,
      default:""
    },
    descriptionAddress:{
      type:String,
    }
  },

  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/*tripSchema.virtual("averageRating").get(function () {
  if (this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / this.ratings.length).toFixed(2);
  }
  return 0;
});

tripSchema.methods.recalculateAverageRating = async function () {
  const ratings = await mongoose.model("Rating").find({ trip: this._id });
  if (ratings.length > 0) {
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = (sum / ratings.length).toFixed(2);
  } else {
    this.averageRating = 0;
  }
  await this.save();
};*/

tripSchema.virtual("finalPrice").get(function () {
  if (this.priceMember) {
    return Number.parseFloat(
      this.priceMember - (this.priceMember * this.offer || 0) / 100
    ).toFixed(2);
  }
});

tripSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const durationInMillis = new Date(this.endDate) - new Date(this.startDate);

    const days = Math.floor(durationInMillis / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (durationInMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (durationInMillis % (1000 * 60 * 60)) / (1000 * 60)
    );

    this.tripDuration = {
      days,
      hours,
      minutes,
    };
  } else {
    this.tripDuration = {
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }
  next();
});

tripSchema.query.pagination = function (page) {
  page = !page || page < 1 || isNaN(page) ? 1 : page;
  const limit = 16;
  const skip = limit * (page - 1);
  return this.skip(skip).limit(limit);
};
tripSchema.query.customSelect = function (fields) {
  if (!fields) return this;
  const modelKeys = Object.keys(tripModel.schema.paths);
  const queryKeys = fields.split(" ");
  const matchKeys = queryKeys.filter((key) => modelKeys.includes(key));
  return this.select(matchKeys);
};

tripSchema.methods.inStock = function (requiredQuantity) {
  return this.peopleNumber >= requiredQuantity ? true : false;
};

const tripModel = mongoose.models.tripModel || model("Trip", tripSchema);
export default tripModel;
