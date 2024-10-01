import discountModel from "../../../../DB/model/discount.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addDiscount = asyncHandler(async (req, res, next) => {
  const { discount, expireAt } = req.body;
  const updatedDiscount = await discountModel.findOneAndUpdate(
    { _id: "66a7c1d406919ff7f43c6ad3" },
    { discount, expireAt },
    { new: true, upsert: true } // `upsert` will create a new document if no match is found
  );
  res.status(200).json(updatedDiscount);
});
