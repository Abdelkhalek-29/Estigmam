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
  res.status(200).json({ infoApp })})

export const getRegisterAgreement = asyncHandler(async (req, res, next) => {
  const agreements = await agreementOwnerModel.find({
    "agreements.title": "register",
  });

  if (!agreements || agreements.length === 0) {
    return res.status(404).json({
      message: "No agreements with title 'register' found.",
    });
  }
  const registerAgreements = [];
  agreements.forEach((agreement) => {
    const filteredAgreements = agreement.agreements.filter(
      (item) => item.title === "register"
    );
    registerAgreements.push(...filteredAgreements);
  });

  return res.status(200).json({
    success: true,
    data: registerAgreements,
  });
  });

export const addAgreementOwner = asyncHandler(async (req, res, next) => {
  const { agreements } = req.body;

  const newAgreementOwner = new agreementOwnerModel({
    agreements,
  });
  await newAgreementOwner.save();
  return res.status(201).json({
    message: "Agreements added successfully.",
    data: newAgreementOwner,
})})
