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
    countryCode: { type: String, required: true },
    password: { type: String },
    license: { type: String },
    expirationDate: { type: Date },
    typeId: {
      type: Types.ObjectId,
    },
    forgetCode: { type: String },
    ownerId: {
      type: Types.ObjectId,
      ref: "Owner",
    },
    status: {
      type: String,
      enum: ["active", "Inactive", "pending"],
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
    IDExpireDate: {
      type: Date,
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
      balance: { type: Number, required: true, default: 0 },
      currency: { type: String, required: true, default: "SAR" },
      total_Deposit: { type: Number, required: true, default: 0 },
      total_Expenses: { type: Number, required: true, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    bank_account: [
      {
        account_owner: { type: String, required: true },
        bank_name: { type: String, required: true },
        branch: { type: String },
        IBAN: { type: String, required: true, unique: true },
        local_num: { type: String },
        isDefault: { type: Boolean, default: false },
        bankId: { type: Types.ObjectId, ref: "Bank", required: true }, // Reference to Bank model
      },
    ],
    isUpdated: {
      type: Boolean,
      default: false,
    },
    createTrip: {
      type: Boolean,
      default: true,
    },
    section: {
      type: Types.ObjectId,
    },
    infoUpdate: {
      type: Boolean,
      default: false,
    },
    leaderCode: {
      code: String,
      discount: {
        type: Types.ObjectId,
        ref: "Discount",
        default: "66a7c1d406919ff7f43c6ad3",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
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
