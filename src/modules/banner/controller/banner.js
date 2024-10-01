import bannerModel from "../../../../DB/model/banner.model.js";
import categoryModel from "../../../../DB/model/category.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
export const createBanner = asyncHandler(async (req, res, next) => {
  const { name, description, categoryId } = req.body;
  const category = await categoryModel.find({ _id: categoryId });
  if (!category) {
    return next(new Error("Category not found !", { status: 404 }));
  }
  const banner = await bannerModel.create({
    name,
    description,
    categoryId,
    // createdBy: req.owner._id,
  });
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.FOLDER_CLOUDINARY}/banner`,
      }
    );

    banner.image.url = secure_url;
    banner.image.id = public_id;
    await banner.save();
  }
  res.status(201).json({ success: true, banner });
});

export const getBanner = asyncHandler(async (req, res, next) => {
  const banner = await bannerModel.find();
  res.status(200).json({ success: true, banner });
});
