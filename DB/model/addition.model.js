import mongoose, { Schema, Types, model } from "mongoose";

const additionSchema = new Schema(
    {
    name: {
      type: String,
      required: true,
        },
        Image: {
           id:{
            type: String,
           },
           url: {   
            type: String,
            }
        },
        
        owner: {
            type: Types.ObjectId,
            ref: "Owner",
            required: true,
        }

  },
  { timestamps: true }
);

const additionModel = mongoose.models.additionModel || model("Addition", additionSchema);

export default additionModel;
