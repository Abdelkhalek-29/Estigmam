import slugify from "slugify";
import cloudinary from "../../../utils/cloudinary.js";
import categoryModel from "../../../../DB/model/category.model.js";
import subCategoryModel from "../../../../DB/model/places.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const createCategory = asyncHandler(async (req, res, next) => {
  
  const category = await categoryModel.create({
    name: req.body.name,
    createdBy: req.owner._id,
    
    slug: slugify(req.body.name),
  });
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.FOLDER_CLOUDINARY}/category`,
      }
    );
    category.image.url = secure_url;
    category.image.id = public_id;
    await category.save();
  }
  return res.status(201).json({ success: true, results: category });
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);
  if (!category) {
    return next(new Error("category not found!", { cause: 404 }));
  }
  // if (req.user._id.toString() !== category.createdBy.toString()) {
  //   return next(new Error("You not authorized!"));
  // }
  category.name = req.body.name ? req.body.name : category.name;
  category.slug = req.body.name ? slugify(req.body.name) : category.slug;

  if (req.file) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      {
        public_id: category.image.id,
      }
    );
    category.image.url = secure_url;
  }

  await category.save();
  return res.status(200).json({ success: true, message: "updated" });
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);
  if (!category) {
    return next(new Error("invalid categoryId!", { cause: 404 }));
  }
  // if (req.user._id.toString() !== category.createdBy.toString()) {
  //   return next(new Error("You not authorized!"));
  // }
  await cloudinary.uploader.destroy(category.image.id);
  await categoryModel.findByIdAndDelete(req.params.categoryId);
  const subCategories = await subCategoryModel.find({
    categoryId: category._id,
  });
  subCategories.map(async (subCategory) => {
    await cloudinary.uploader.destroy(subCategory.image.id);
  });

  await subCategoryModel.deleteMany({ categoryId: category._id });

  return res.status(200).json({ success: true, message: "category delete" });
});

export const getAllCategory = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers['accept-language'] || 'en';

  const allCategory = await categoryModel.find();

  const results = allCategory.map(category => {
    const { name_ar, name_en, ...rest } = category.toObject();
    const name = language === 'ar' ? name_ar : name_en;

    return {
      ...rest,
      name, 
    };
  });

  return res.status(200).json({ success: true, results });
});

