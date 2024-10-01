import slugify from "slugify";
import subCategoryModel from "../../../../DB/model/places.model.js";
import subSubCategoryModel from "../../../../DB/model/subSubcategory.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const createSubSubCategory = asyncHandler(async (req, res, next) => {
    const { name, subCategoryId } = req.body;
    const subCategory = await subCategoryModel.findById(subCategoryId);
    if (!subCategory) {
        return next(new Error("SubCategory Not Found!", { cause: 404 }));
    }
    const subSubCategoryExists = await subSubCategoryModel.findOne({ name });
    if (subSubCategoryExists) {
        return next(new Error("SubSubCategory Already Exists!", { cause: 400 }));
    }
    const subSubCategory = await subSubCategoryModel.create({
        name,
        subCategoryId,
        createBy: req.owner._id,
        slug: slugify(name),
    });
    
    return res.status(201).json({
        success: true,
        status: 201,
        message: "SubSubCategory Added",
        data: subSubCategory,
    });
});
    
export const getAllSubcategory = asyncHandler(async (req, res, next) => {
    const subSubCategory = await subSubCategoryModel.find().select("-__v").populate({ path: "subCategoryId", select: "-__v" });
    if (!subSubCategory) {
        return next(new Error("SubSubCategory Not Found!", { cause: 404 }));
    }
    return res.status(200).json({
        success: true,
        status: 200,
        message: "All SubSubCategory",
        data: subSubCategory,
    });
});