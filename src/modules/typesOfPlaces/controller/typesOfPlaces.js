import activityModel from "../../../../DB/model/activity.model.js";
import categoryModel from "../../../../DB/model/category.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const typesOfPlaces = asyncHandler(async (req, res, next) => {
  const { name_ar,name_en,isTool, categoryId } = req.body;

  const category = await categoryModel.findById(categoryId);
  if (!category) {
    console.error("Category not found for ID:", categoryId);
    return next(new Error("category not found", { cause: 404 }));
  }
  const typesOfPlaces = await typesOfPlacesModel.create({
    name_ar,name_en,isTool, categoryId
  });

  /*const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.FOLDER_CLOUDINARY}/typesOfPlaces/${typesOfPlaces._id}`,
    }
  );
  typesOfPlaces.image = { url: secure_url, id: public_id };
  await typesOfPlaces.save();*/
  res.status(201).json({
    success: true,
    typesOfPlaces,
  });
});

export const updateTypesOfPlaces = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);

  if (!category) {
    return next(new Error("category not found", { cause: 404 }));
  }

  const typesOfPlaces = await typesOfPlacesModel.findOne({
    _id: req.params.typesOfPlacesId,
    categoryId: req.params.categoryId,
  });
  if (!typesOfPlaces) {
    return next(new Error("typesOfPlaces not found", { cause: 404 }));
  }
  //   if (req.user._id.toString() !== typesOfPlaces.createBy.toString()) {
  //     return next(new Error("You not authorized!"));
  //   }
  typesOfPlaces.name = req.body.name ? req.body.name : typesOfPlaces.name;

  if (req.file) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      {
        public_id: typesOfPlaces.image.id,
      }
    );
    typesOfPlaces.image.url = secure_url;
  }
  await typesOfPlaces.save();
  return res.status(201).json({
    success: true,
    message: "updated successfully",
    results: typesOfPlaces,
  });
});

export const deleteTypesOfPlaces = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);

  if (!category) {
    return next(new Error("category not found", { cause: 404 }));
  }

  const typesOfPlaces = await typesOfPlacesModel.findOne({
    _id: req.params.typesOfPlacesId,
    categoryId: req.params.categoryId,
  });
  if (!typesOfPlaces) {
    return next(new Error("typesOfPlaces not found", { cause: 404 }));
  }
  await cloudinary.uploader.destroy(typesOfPlaces.image.id);
  await typesOfPlaces.remove();

  //   if (req.user._id.toString() !== typesOfPlaces.createBy.toString()) {
  //     return next(new Error("You not authorized!"));
  //   }

  return res.status(201).json({
    success: true,
    message: "deleted successfully",
  });
});

export const getTypesOfPlaces = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.categoryId);

  if (!category) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  const language = req.query.lang || req.headers["accept-language"] || "en";

  const typesOfPlaces = await typesOfPlacesModel
    .find({
      categoryId: req.params.categoryId,
    })
    .populate({
      path: "categoryId",
      select: `name_${language}`,
    });

  const results = typesOfPlaces.map((place) => {
    const { name_ar, name_en, ...rest } = place.toObject();
    const name = language === "ar" ? name_ar : name_en;

    return {
      ...rest,
      name,
    };
  });

  return res.status(200).json({
    success: true,
    results,
  });
});

export const anyType = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.findById(req.params.anyType);

  if (!category) {
    return next(new Error("category not found", { cause: 404 }));
  }

  const typesOfPlaces = await typesOfPlacesModel.find({
    categoryId: req.params.anyType,
  });

  const activities = typesOfPlaces.map(
    async (type) => await activityModel.find({ type: type._id })
  );

  const results = await Promise.all(activities);

  // Merge typesOfPlaces and non-empty results into one array
  const mergedResults = typesOfPlaces.flatMap((type, index) => {
    const relatedActivities = results[index];
    if (relatedActivities.length > 0) {
      return [type, ...relatedActivities];
    } else {
      return [type];
    }
  });

  return res.status(200).json({
    success: true,
    results: mergedResults,
  });
});




export const getallWithActivity = asyncHandler(async (req, res, next) => {
  const lang = req.query.lang || 'ar'; // تحديد اللغة الافتراضية 'ar' إذا لم توجد لغة في الاستعلام

  const result = await typesOfPlacesModel.aggregate([
    {
      $lookup: {
        from: 'activities', // اسم مجموعة الأنشطة
        localField: '_id', // الحقل الذي يربط الوثيقتين في مجموعة TypesOfPlaces
        foreignField: 'type', // الحقل الذي يربط الوثيقتين في مجموعة Activity
        as: 'activities' // اسم الحقل الذي سيتم تخزين الأنشطة فيه بعد الدمج
      }
    },
    {
      $unwind: {
        path: "$activities",
        preserveNullAndEmptyArrays: true // السماح بعرض الوثائق التي لا تحتوي على أنشطة
      }
    },
    {
      $project: {
        _id: {
          $cond: {
            if: { $gt: ["$activities._id", null] }, // التحقق من وجود activity_id
            then: "$activities._id", // إذا كان هناك activity_id، استخدمه كـ _id
            else: "$_id" // خلاف ذلك، استخدم _id من TypesOfPlaces
          }
        },
        name: {
          $cond: {
            if: { $gt: ["$activities", null] }, // التحقق من وجود أنشطة
            then: lang === 'en' ? "$activities.name_en" : "$activities.name_ar", // استخدام اسم النشاط حسب اللغة
            else: lang === 'en' ? "$name_en" : "$name_ar" // استخدام اسم المكان حسب اللغة
          }
        }
      }
    }
  ]);

  return res.status(200).json({
    success: true,
    results: result
  });
});



export const getTypesAndActivities = async (req, res) => {
  const { categoryId } = req.params; 
  const language = req.headers['accept-language'] === 'ar' ? 'ar' : 'en'; 

  const types = await typesOfPlacesModel.find({ categoryId, isTool: true }).lean();
  const activities = await activityModel.find({ type: { $in: types.map(type => type._id) } }).lean();

  const activitiesMap = activities.reduce((acc, activity) => {
    const typeId = activity.type.toString();
    if (!acc[typeId]) {
      acc[typeId] = [];
    }
    acc[typeId].push({
      id: activity._id,
      name: activity[`name_${language}`], 
    });
    return acc;
  }, {});

  const results = types.map((type) => {
    const associatedActivities = activitiesMap[type._id.toString()];
    if (associatedActivities && associatedActivities.length > 0) {
      return associatedActivities; 
    }
    return {
      id: type._id,
      name: type[`name_${language}`], 
    };
  }).flat();

  // Custom sort logic based on language
  const customSortOrder = language === 'ar' ? ["يخت", "مراكب"] : ["Yacht", "Boats"];

  results.sort((a, b) => {
    const aIndex = customSortOrder.indexOf(a.name);
    const bIndex = customSortOrder.indexOf(b.name);

    if (aIndex === -1 && bIndex === -1) {
      return 0; // No change if both names are not in the custom order
    }

    if (aIndex === -1) return 1; // Keep `a` after `b` if `a` is not in the custom list
    if (bIndex === -1) return -1; // Keep `b` after `a` if `b` is not in the custom list

    return aIndex - bIndex; // Sort by the order in `customSortOrder`
  });

  return res.status(200).json({ success: true, data: results });
};
