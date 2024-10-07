import mongoose, { model, Schema, Types } from "mongoose";

const tripLeaderSchema = new Schema(
  {
    name: {
      type: String,
      min: 3,
      max: 20,
      default: "test",
    },
    userName: {
      type: String,
      min: 5,
      max: 15,
      unique: true,
    },
    N_id: {
      type: Number,
      unique: true,
    },
    phone: { type: String, required: true, unique: true },
    password: { type: String },
    license: { type: String },
    expirationDate: { type: Date },
    typeId: {
      type: Types.ObjectId,
      ref: "TypesOfPlaces",
    },
    forgetCode: { type: String },
    ownerId: {
      type: Types.ObjectId,
      ref: "Owner",
    },
    status: {
      type: String,
      enum: ["active", "Inactive","pending"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["user", "admin", "owner", "tripLeader"],
      default: "tripLeader",
      required: true,
    },
    tripsCounter: {
      type: Number,
      default: 5,
    },
    tripAirFlightCount: {
      type: Number,
      default: 10,
    },
    NumberOfPassengers: {
      type: Number,
      default: 2,
    },
    profileImage: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dtykqby6b/image/upload/v1721806758/defualt/fp8atiz2i6ctj0qhvcyv.png",
      },
      id: {
        type: String,
        default: "defualt/fp8atiz2i6ctj0qhvcyv",
      },
    },
    IDPhoto: {
      url: { type: String },
      id: { type: String },
    },
    FictionAndSimile: {
      url: { type: String },
      id: { type: String },
    },
    DrugAnalysis: {
      url: { type: String },
      id: { type: String },
    },
    MaintenanceGuarantee: {
      url: { type: String },
      id: { type: String },
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratings: [{ type: Types.ObjectId, ref: "Rating" }],
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      TotalDeposit: {
        type: Number,
        default: 0,
      },
      TotalWithdraw: {
        type: Number,
        default: 0,
      },
    },
    isUpdated:{
      type:Boolean,
      default:false
    },
    createTrip:{
      type:Boolean,
      default:true
    },
    section:{
      type:Types.ObjectId
      
    },
  },
  { timestamps: true }
);

tripLeaderSchema.methods.recalculateAverageRating = async function () {
  const ratings = await mongoose.model("Rating").find({ leader: this._id });
  if (ratings.length > 0) {
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = (sum / ratings.length).toFixed(2);
  } else {
    this.averageRating = 0;
  }
  await this.save();
};

const tripLeaderModel =
  mongoose.models.tripLeaderModel || model("TripLeader", tripLeaderSchema);

export default tripLeaderModel;
