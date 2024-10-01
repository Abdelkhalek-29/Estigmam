import infoAppModel from "../../../../DB/model/infoApp.model.js";
import infoAppOwnerModel from "../../../../DB/model/infoAppOwner.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addInfoApp = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const infoApp = await infoAppModel.create({
    title,
    description,
  });
  res.status(200).json({ infoApp });
});

export const getInfoApp = asyncHandler(async (req, res, next) => {
  const infoApp = await infoAppModel.find();
  res.status(200).json({ infoApp });
});

export const addInfoAppOwner = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;
  const infoApp = await infoAppOwnerModel.create({
    title,
    description,
  });
  res.status(200).json({ infoApp });
});


export const getInfoAppOwner = asyncHandler(async (req, res, next) => {
  const infoApp = await infoAppOwnerModel.find();
  res.status(200).json({ infoApp });
});
