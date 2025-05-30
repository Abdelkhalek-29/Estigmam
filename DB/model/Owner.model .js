import mongoose, { Schema, Types, model } from "mongoose";

const OwnerSchema = new Schema(
  {
    userName: {
      type: String,
      min: 5,
      max: 15,
    },
    fullName: {
      type: String,
      required: true,
      min: 3,
      max: 20,
    },
    googleId: String,
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    ownerCode: {
      code: String,
      discount: {
        type: Types.ObjectId,
        ref: "Discount",
        default: "66a7c1d406919ff7f43c6ad3",
      },
    },
    numberTrips: {
      type: Number,
      default: 0,
    },
    city: {
      type: Types.ObjectId,
      ref: "City",
    },
    country: {
      type: Types.ObjectId,
      ref: "Country",
    },
    password: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    phone: { type: String, required: true, unique: true },
    countryCode: { type: String, required: true },
    phoneWithCode: { type: String },
    role: {
      type: String,
      enum: ["user", "admin", "owner", "tripLeader"],
      default: "owner",
      required: true,
    },
    nationalID: {
      type: String,
      unique: true,
    },

    forgetCode: String,
    profileImage: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dgzucjqgi/image/upload/v1722363345/user_profile_q6je8x.jpg",
      },
      id: {
        type: String,
        default: "user_profile_q6je8x.jpg",
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
    isDate: {
      type: Boolean,
      default: false,
    },
    ownerInfo: {
      type: Boolean,
      default: false,
    },
    addLeader: {
      type: Boolean,
      default: false,
    },
    registerAgreement: {
      type: Boolean,
      default: false,
    },
    tripsCounter: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

const OwnerModel = mongoose.models.OwnerModel || model("Owner", OwnerSchema);
export default OwnerModel;
