// import categoryModel from "../../../../DB/model/category.model.js";
// import subCategoryModel from "../../../../DB/model/subcategory.model.js";
// import { asyncHandler } from "../../../utils/errorHandling.js";
// import customizeTripModel from "../../../../DB/model/customizeTripe.js";
// export const createCustomizeTrip = asyncHandler(async (req, res, next) => {
//   const {monthTrip,dayTrip,tripDuration,peopleNumber, berth, addressTrip, addressYou, tripTitle, priceMember, addition, categoryId, subCategoryId} = req.body;
//   const categoryExist = await categoryModel.findById(categoryId);
//   if (!categoryExist) {
//     return next(new Error("Category not found!", { cause: 404 }));
//   }

//   const subCategoryExist = await subCategoryModel.findById(subCategoryId);
//   if (!subCategoryExist) {
//     return next(new Error("SubCategory not found!", { cause: 404 }));
//   }
//   console.log(req.files);
//   if (!req.files) {
//     return next(new Error("trip images is required", { cause: 400 }));
//   }
//   const customizeTrip = await customizeTripModel.create({
//     monthTrip,
//     dayTrip,
//     tripDuration,
//     peopleNumber,
//     tripTitle,
//     priceMember,
//     categoryId,
//     subCategoryId,
//     berth,
//     addition,
//     addressTrip: JSON.parse(addressTrip),
//     addressYou: JSON.parse(addressYou),
//     createdBy: req.user._id,
//   });
  
  
//   return res.status(201).json({ success: true, customizeTrip });
// });
