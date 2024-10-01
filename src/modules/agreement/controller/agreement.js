import agreementModel from "../../../../DB/model/agreement.model .js";
import agreementOwnerModel from "../../../../DB/model/agreementOwner.model .js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addAgreement = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const infoApp = await agreementModel.create({
    title,
    description,
  });
  res.status(200).json({ infoApp });
});

export const getAgreement = asyncHandler(async (req, res, next) => {
  const infoApp = await agreementModel.find();
  res.status(200).json({ infoApp });
});


export const addAgreementOwner = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const infoApp = await agreementOwnerModel.create({
    title,
    description,
  });
  res.status(200).json({ infoApp });
});

export const getAgreementOwner = asyncHandler(async (req, res, next) => {
  const infoApp = await agreementOwnerModel.find();
  res.status(200).json({ infoApp });
});
