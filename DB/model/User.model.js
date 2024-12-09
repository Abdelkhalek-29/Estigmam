import mongoose, { Schema, Types, model } from "mongoose";

const userSchema = new Schema(
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
    phoneWithCode: { type: String },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    role: {
      type: String,
      enum: ["user", "admin", "owner", "tripLeader"],
      default: "user",
      required: true,
    },
    location: { type: { type: String }, coordinates: [Number] },
    Likes: [{ type: Types.ObjectId, ref: "Trip" }],
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    forgetCode: String,
    activationCode: String,
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
    coverImages: [
      {
        url: {
          type: String,
          required: true,
        },
        id: {
          type: String,
          required: true,
        },
      },
    ],
    wallet: {
      balance: { type: Number, required: true, default: 0 },
      currency: { type: String, required: true, default: "SAR" },
      total_Deposit: { type: Number, required: true, default: 0 },
      total_Expenses: { type: Number, required: true, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    Booked: [
      {
        tripId: {
          type: Types.ObjectId,
          ref: "Trip",
        },
        BookedTicket: {
          type: Number,
        },
      },
    ],
    userCode: {
      code: String,
      discount: {
        type: Types.ObjectId,
        ref: "Discount",
        default: "66a7c1d406919ff7f43c6ad3",
      },
    },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.models.userModel || model("User", userSchema);
export default userModel;
