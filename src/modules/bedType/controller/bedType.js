import bedTypeModel from "../../../../DB/model/bedType.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addBedType = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;
  const { _id } = req.owner;
  const bedType = await bedTypeModel.create({
    name,
    description,
    createBy: _id,
  });

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.FOLDER_CLOUDINARY}/bedType/${_id}`,
    }
  );
  bedType.image = { url: secure_url, id: public_id };
  await bedType.save();
  res.status(201).json({
    message: "Bed type created successfully",
    bedType
   });
});

export const getBedType = asyncHandler(async (req, res, next) => {
  const bedType = await bedTypeModel.find();
  return res.status(200).json({ bedType });
});

export const getBedTypeById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const bedType = await bedTypeModel.findById(id);
  return res.status(200).json({ bedType });
});

export const updateBedType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const bedType = await bedTypeModel.findById(id);
  if (!bedType) {
    return next(new Error("Bed type not found!", { cause: 404 }));
  }
  const { name, description } = req.body;
  bedType.name = name || bedType.name;
  bedType.description = description || bedType.description;
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        public_id: bedType.image.id,
      }
    );
    bedType.image.url = secure_url;
  }

  await bedType.save();
  return res.status(200).json({ message: "Bed type updated successfully" });
});

export const deleteBedType = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const bedType = await bedTypeModel.findById(id);
  if (!bedType) {
    return next(new Error("Bed type not found!", { cause: 404 }));
  }
  await bedType.remove();
  return res.status(200).json({ message: "Bed type deleted successfully" });
});




