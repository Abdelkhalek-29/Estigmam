import { asyncHandler } from "../../../utils/errorHandling.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import tokenModel from "../../../../DB/model/Token.model.js";
import randomstring from "randomstring";
import cityModel from "../../../../DB/model/city.model.js";
import countryModel from "../../../../DB/model/country.model.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";
import toolModel from "../../../../DB/model/tool.model.js";
import placesModel from "../../../../DB/model/places.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import tripModel from "../../../../DB/model/Trip.model.js";
import activityModel from "../../../../DB/model/activity.model.js";
import { typesOfPlaces } from "../../typesOfPlaces/controller/typesOfPlaces.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import { updateTool } from "../../tool/controller/tool.js";

const predefinedTypes = [
  { id: "66dcc2b4626dfd336c9d8732", name: { en: "Boats", ar: "مراكب" } },
  { id: "66dcc2c6626dfd336c9d873a", name: { en: "Yacht", ar: "يخت" } },
  { id: "66dc1b6737f54a0f875bf3ce", name: { en: "Jet boat", ar: "جيت بوت" } },
  { id: "66dc1ba737f54a0f875bf3d1", name: { en: "Sea bike", ar: "دباب بحرى" } },
];

export const register = asyncHandler(async (req, res, next) => {
  const {
    email,
    password,
    confirmPassword,
    city,
    country,
    phone,
    nationalID,
    fullName,
    MarineActivity,
    LandActivity,
  } = req.body;

  const isUser = await OwnerModel.findOne({ phone });
  const isEmail = await OwnerModel.findOne({ email });
  const isNationalID = await OwnerModel.findOne({ nationalID });

  if (isEmail) {
    return next(new Error("The Email has already been used!", { cause: 409 }));
  }
  if (isUser) {
    return next(new Error("Phone already registered!", { cause: 409 }));
  }
  if (isNationalID) {
    return next(new Error("National ID already exists!", { cause: 409 }));
  }

  const countryId = await countryModel.findById(country);
  if (!countryId) {
    return next(new Error("Country Not Found!", { cause: 404 }));
  }

  const cityId = await cityModel.findById(city);
  if (!cityId) {
    return next(new Error("City Not Found!", { cause: 404 }));
  }

  if (password !== confirmPassword) {
    return next(new Error("New password and confirm password do not match", { cause: 400 }));
  }

  const hashPassword = bcryptjs.hashSync(password, Number(process.env.SALT_ROUND));

  const user = await OwnerModel.create({
    fullName,
    phone,
    city,
    country,
    email,
    password: hashPassword,
    nationalID,
  });

  const userCode = randomstring.generate({ length: 15 });
  user.ownerCode = { code: userCode }; 
  await user.save();

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.TOKEN_SIGNATURE
  );

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });

  user.phoneWithCode = countryId.codePhone + phone.slice(1);
  await user.save();

  if (MarineActivity) {
    for (const key of MarineActivity) {
      const { id, quan } = key;

      const predefinedType = predefinedTypes.find(type => type.id === id);
      if (predefinedType) {
        for (let i = 0; i < +quan; i++) {
          await toolModel.create({
            type: predefinedType.id, 
            createBy: user._id,
            section: {
              name_en: predefinedType.name.en, 
              name_ar: predefinedType.name.ar, 
            },
          });
        }
      }
    }
  }

  if (LandActivity) {
    for (const key of LandActivity) {
      const { id, quan } = key;
      const type = await typesOfPlacesModel.findById(id); 
      const activity = await activityModel.findById(id); 

      if (type) {
        // It's a type
        for (let i = 0; i < +quan; i++) {
          await placesModel.create({
            type: id,
            createBy: user._id,
          });
        }
      } else if (activity) {
        const activityType = await typesOfPlacesModel.findById(activity.type); 
        for (let i = 0; i < +quan; i++) {
          await placesModel.create({
            activityId: id,
            type: activityType._id, 
            createBy: user._id,
          });
        }
      }
    }
  }

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Registration successful",
    data: {
      token,
      fullName: user.fullName || user.name,
      nationalID: user.nationalID || user.N_id,
      email: user.email,
      country: {
        id: countryId._id,
        name: countryId.name,
        image:countryId.image.url
      },
      city: {
        id: cityId._id,
        name: cityId.name, 
      },
      phone: user.phone,
      userName: user.userName,
      role: user.role,
      isUpdated: user.isUpdated,
      profileImage: user.profileImage,
      isDate: user.isDate,
      id: user._id,
      ownerInfo:user.ownerInfo,
      addLeader:user.addLeader,
      infoUpdate:user.infoUpdate,
      registerAgreement:user.registerAgreement
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { phone, password } = req.body;
  let user, role;

  user = await OwnerModel.findOne({
    $or: [{ phone }, { phoneWithCode: phone }],
  })
    .populate("country", "name image")
    .populate("city", "name");

  if (user) {
    role = "Owner";
  } else {
    user = await tripLeaderModel.findOne({ phone });

    if (user) {
      role = "TripLeader";
    }
  }

  if (!user) {
    return next(new Error("Invalid phone or password", { status: 400 }));
  }

  const isMatch =
    role === "Owner"
      ? bcryptjs.compareSync(password, user.password)
      : password === user.password;

  if (!isMatch) {
    return next(new Error("Invalid phone or password", { status: 400 }));
  }

  // Generate token
  const token = jwt.sign(
    { id: user._id, phone: user.phone, role },
    process.env.TOKEN_SIGNATURE
  );

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });


  const responseData = {
    token,
    fullName: user.fullName || user.name,
    nationalID: user.nationalID || user.N_id,
    email: user.email,
    phone: user.phone,
    userName: user.userName,
    role: user.role,
    isUpdated: user.isUpdated,
    profileImage: user.profileImage,
    isDate: user.isDate,
    id: user._id,

  };

  if (role === "Owner") {
    responseData.country = {
      id: user.country?._id,
      name: user.country?.name,
      image: user.country?.image?.url,
    };
    responseData.city = {
      id: user.city?._id,
      name: user.city?.name,
    };
    responseData.ownerInfo = user.ownerInfo;
    responseData.addLeader = user.addLeader;
    responseData.registerAgreement=user.registerAgreement
  }
  if (role === "TripLeader") {
    responseData.infoUpdate=user.infoUpdate
  }

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Login successful",
    data: responseData,
  });
});

export const sendForgetCode = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  let user, role;

  user = await OwnerModel.findOne({ phone });

  if (user) {
    role = "Owner";
  } else {
    user = await tripLeaderModel.findOne({ phone });

    if (user) {
      role = "TripLeader";
    }
  }

  if (!user) {
    return next(new Error("Invalid phone number!", { cause: 400 }));
  }

  const code = randomstring.generate({
    length: 4,
    charset: "numeric",
  });

  user.forgetCode = code;
  await user.save();

  const token = jwt.sign(
    { id: user._id, phone: user.phone, role },
    process.env.TOKEN_SIGNATURE
  );

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Check your phone!",
    data: { code, token },
  });
});

export const resendCode = asyncHandler(async (req, res, next) => {
  const user = await OwnerModel.findOne({ phone: req.owner.phone });

  const code = randomstring.generate({
    length: 4,
    charset: "numeric",
  });

  user.forgetCode = code;
  await user.save();

  return res.status(200).json({
    success: true,
    status: 200,
    message: "check you phone message!",
    code,
  });
});

export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const newPassword = password;

  if (req.owner) {
    await OwnerModel.findOneAndUpdate(
      { email: req.owner.email },
      { password: newPassword }
    );
  }

  if (req.tripLeader) {
    if (req.body.OldPassword) {
      if (req.body.OldPassword !== req.tripLeader.password) {
        return next(new Error("Invalid Old Password!", { cause: 400 }));
      }
    }

    await tripLeaderModel.findOneAndUpdate(
      { phone: req.tripLeader.phone },
      { password: newPassword }
    );
  }

  const userId = req.owner ? req.owner._id : req.tripLeader._id;
  const tokens = await tokenModel.find({ user: userId });

  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  return res
    .status(200)
    .json({ success: true, status: 200, message: "Try to login!" });
});
export const VerifyCode = asyncHandler(async (req, res, next) => {
  const { forgetCode } = req.body;
  const token = req.headers["token"];

  if (!forgetCode || !token) {
    return res
      .status(400)
      .json({ success: false, message: "Code and token are required" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SIGNATURE);
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  let user;
  if (req.owner) {
    user = await OwnerModel.findById(req.owner._id);
  } else if (req.tripLeader) {
    user = await tripLeaderModel.findById(req.tripLeader._id);
  }

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.forgetCode !== forgetCode) {
    return res.status(400).json({ success: false, message: "Invalid code" });
  }

  user.forgetCode = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Code verified successfully, proceed to reset password",
  });
});

export const complete = asyncHandler(async (req, res, next) => {

  const { fullName, email, nationalID, phone, country, city ,IDExpireDate} = req.body;

  const owner = await OwnerModel.findById(req.owner._id);
  if (!owner) {
    return next(new Error("Owner not found", { cause: 404 }));
  }

  const ownerId = req.owner._id;

  owner.fullName = fullName || owner.fullName;
  owner.email = email || owner.email;
  owner.nationalID = nationalID || owner.nationalID;
  owner.phone = phone || owner.phone;
  owner.country = country || owner.country;
  owner.city = city || owner.city;
  owner.IDExpireDate=IDExpireDate|| owner.IDExpireDate;
  owner.ownerInfo=true
  if (req.files) {
    if (req.files.IDPhoto && req.files.IDPhoto.length > 0) {
      const idFileResult = await cloudinary.uploader.upload(
        req.files.IDPhoto[0].path,
        {
          resource_type: "raw",
          folder: `${process.env.FOLDER_CLOUDINARY}/owner/${ownerId}/IDPhotoFile`,
        }
      );
      owner.IDPhoto = {
        url: idFileResult.secure_url,
        id: idFileResult.public_id,
      };
    }

    if (req.files.FictionAndSimile && req.files.FictionAndSimile.length > 0) {
      const fictionAndSimileResult = await cloudinary.uploader.upload(
        req.files.FictionAndSimile[0].path,
        {
          resource_type: "raw",
          folder: `${process.env.FOLDER_CLOUDINARY}/owner/${ownerId}/FictionAndSimileFile`,
        }
      );
      owner.FictionAndSimile = {
        url: fictionAndSimileResult.secure_url,
        id: fictionAndSimileResult.public_id,
      };
    }

    if (
      req.files.MaintenanceGuarantee &&
      req.files.MaintenanceGuarantee.length > 0
    ) {
      const maintenanceGuaranteeResult = await cloudinary.uploader.upload(
        req.files.MaintenanceGuarantee[0].path,
        {
          resource_type: "raw",
          folder: `${process.env.FOLDER_CLOUDINARY}/owner/${ownerId}/MaintenanceGuaranteeFile`,
        }
      );
      owner.MaintenanceGuarantee = {
        url: maintenanceGuaranteeResult.secure_url,
        id: maintenanceGuaranteeResult.public_id,
      };
    }

    if (req.files.DrugAnalysis && req.files.DrugAnalysis.length > 0) {
      const drugAnalysisResult = await cloudinary.uploader.upload(
        req.files.DrugAnalysis[0].path,
        {
          resource_type: "raw",
          folder: `${process.env.FOLDER_CLOUDINARY}/owner/${ownerId}/DrugAnalysisFile`,
        }
      );
      owner.DrugAnalysis = {
        url: drugAnalysisResult.secure_url,
        id: drugAnalysisResult.public_id,
      };
    }

    if (req.files.profileImage && req.files.profileImage.length > 0) {
      const profileImageResult = await cloudinary.uploader.upload(
        req.files.profileImage[0].path,
        {
          resource_type: "image",
          folder: `${process.env.FOLDER_CLOUDINARY}/owner/${ownerId}/profileImageFile`,
        }
      );
      owner.profileImage = {
        url: profileImageResult.secure_url,
        id: profileImageResult.public_id,
      };
    }
  }

  await owner.save();

  res.status(200).json({
    success: true,
    message: "Owner profile updated successfully",
  });
});

export const lastTrips = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  const filter = {
    ...(
      req.tripLeader
        ? { tripLeaderId: req.tripLeader._id }
        : { createBy: req.owner._id }
    ),
    status: { $ne: "pending" }, 
  };

  const upcomingTrips = await tripModel
    .find(filter)
    .populate({
      path: "tripLeaderId",
      select: "name profileImage tripsCounter averageRating",
      ref: "TripLeader",
    })
    .populate({
      path: "addition",
      select: "name Image",
      ref: "Addition",
    })
    .populate({
      path: "bedType",
      select: "name description image",
      ref: "BedType",
    })
    .populate({
      path: "typeOfPlace",
      select: nameField,
      ref: "TypesOfPlaces",
    })
    .populate({
      path: "category",
      select: nameField,
      ref: "Category",
    })
    .sort({ startDate: -1 });

  const transformedTrips = upcomingTrips.map((trip) => {
    const { typeOfPlace, category } = trip.toObject();

    return {
      ...trip.toObject(),
      typeOfPlace: {
        _id: typeOfPlace._id,
        name: typeOfPlace[nameField], 
      },
      category: {
        _id: category._id,
        name: category[nameField], 
        id: category._id, 
      },
    };
  });

  res.status(200).json({
    success: true,
    data: transformedTrips,
  });
});

export const cancelTrip = asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;

  const trip = await tripModel.findById(tripId);
  if (!trip) {
    return next(new Error("Trip not found", { status: 404 }));
  }
  trip.status = "cancelled";
  await trip.save();

  res.status(200).json({
    success: true,
    message: "Trip cancelled !",
  });
});

export const trips = asyncHandler(async (req, res, next) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  const nameField = language === "ar" ? "name_ar" : "name_en";

  const { status: statusIndex } = req.query;

  const ownerId = req.owner ? req.owner._id : null;
  const tripLeaderId = req.tripLeader ? req.tripLeader._id : null;

  // Mapping status index to string values
  const statusMap = {
    0: "current",
    1: "upComing",
    2: null,
    3: "completed",
    4: "cancelled",
    5: "rejected",
  };

  const status = statusMap[statusIndex] || null;

  const filter = {};
  if (ownerId) {
    filter.createdBy = ownerId;
  }
  if (tripLeaderId) {
    filter.tripLeaderId = tripLeaderId;
  }
  if (status !== null) {
    filter.status = status;
  }

  const trips = await tripModel
    .find(filter)
    .populate([
      { path: "typeOfPlace", select: "name_ar name_en" },
      { path: "category", select: "name_ar name_en" },
      { path: "bedType", select: "name" },
      { path: "addition", select: "name" },
      {
        path: "tripLeaderId",
        select: "profileImage _id name tripsCounter averageRating",
      },
      { path: "cityId", select: "name" },
      { path: "activity", select: "name_ar name_en" },
    ])
    .sort({ startDate: -1 });

  const formattedTrips = trips.map((trip) => {
    const categoryName = trip.category ? trip.category[nameField] : "";
    const typeOfPlaceName = trip.typeOfPlace
      ? trip.typeOfPlace[nameField]
      : "";
    const activityName = trip.activity ? trip.activity[nameField] : "";

    const bedTypes = trip.bedType
      ? trip.bedType.map((bed) => ({
          _id: bed._id,
          name: bed.name,
        }))
      : [];

    const additions = trip.addition
      ? trip.addition.map((add) => ({
          _id: add._id,
          name: add.name,
        }))
      : [];

    return {
      ...trip.toObject(),
      category: {
        _id: trip.category?._id,
        name: categoryName,
      },
      typeOfPlace: {
        _id: trip.typeOfPlace?._id,
        name: typeOfPlaceName,
      },
      activity: {
        _id: trip.activity?._id || "",
        name: activityName,
      },
      bedType: bedTypes, // Returning bedType as a list of objects
      addition: additions, // Returning addition as a list of objects
    };
  });

  res.status(200).json({
    success: true,
    data: formattedTrips,
  });
});


export const getCreatedActivities = asyncHandler(async (req, res, next) => {
  const userId = req.owner.id; // Get the owner ID from the request
  const language = req.headers["accept-language"] || "en";

  // Fetch created tools
  const createdTools = await toolModel
    .find({ createBy: userId, isUpdated: false })
    .select("_id type code") // Only select necessary fields
    .lean(); // Use lean to get plain JavaScript objects

  // Create a map to store tools grouped by their type
  const toolsByType = {};

  createdTools.forEach((tool) => {
    const toolTypeId = tool.type.toString(); // Convert ObjectId to string

    // Find the predefined type matching the tool's type
    const predefinedType = predefinedTypes.find(type => type.id === toolTypeId);

    // Skip this tool if the type is unknown
    if (!predefinedType) return;

    // Prepare to group by type
    const typeKey = predefinedType.id;
    const typeName = predefinedType.name[language];

    // Initialize the type grouping if not exists
    if (!toolsByType[typeKey]) {
      toolsByType[typeKey] = {
        typeId: typeKey, // Include typeId
        typeName,
        ids: [],
        codes: [],
      };
    }

    toolsByType[typeKey].ids.push(tool._id);
    toolsByType[typeKey].codes.push(tool.code);
  });

  // Fetch created places
  const createdPlaces = await placesModel
    .find({ createBy: userId, isUpdated: false }) // All places created by the owner
    .populate({
      path: "type", // Populate the type
      select: `${language === "ar" ? "name_ar" : "name_en"}`,
    })
    .select("_id type code"); // Only select necessary fields

  // Create a map to store places grouped by their type
  const placesByType = {};

  createdPlaces.forEach((place) => {
    const typeKey = place.type._id.toString(); // Using the populated type ID
    const typeName = place.type[language === "ar" ? "name_ar" : "name_en"];

    if (!placesByType[typeKey]) {
      placesByType[typeKey] = {
        typeId: typeKey, // Include typeId
        typeName,
        ids: [],
        codes: [],
      };
    }

    placesByType[typeKey].ids.push(place._id);
    placesByType[typeKey].codes.push(place.code);
  });

  const toolsWithDetails = Object.values(toolsByType);
  const placesWithDetails = Object.values(placesByType);

  return res.status(200).json({
    success: true,
    tools: toolsWithDetails,
    places: placesWithDetails,
  });
});

 

export const getActivity = asyncHandler(async (req, res, next) => {
  const userId = req.owner._id; // Assuming you get the owner ID from req.owner
  const language = req.headers["accept-language"] || "en"; // Set language preference based on headers

  // Fetch tools created by the user and populate necessary fields
  const tools = await toolModel
    .find({
      createBy: userId,
      isUpdated: true,
    })
    .populate({
      path: "type", // Populate the type of the tool
      select: `${language === "ar" ? "name_ar" : "name_en"}`, // Select the name based on language
    })
    .select(
      "_id type code location toolImage createBy isUpdated licenseEndDate licenseNunmber name portName"
    );

  // Fetch places created by the user and populate necessary fields
  const places = await placesModel
    .find({
      createBy: userId,
      isUpdated: true,
    })
    .populate({
      path: "type", // Populate the type of the place
      select: `${language === "ar" ? "name_ar" : "name_en"}`, // Select the name based on language
    })
    .select(
      "_id type code location images createBy isUpdated ExpiryDate licenseNumber name slug"
    );

  // Map the populated data to return 'name' instead of 'name_en' or 'name_ar'
  const updatedTools = tools.map((tool) => ({
    ...tool.toObject(), // Convert document to plain JS object
    type: {
      _id: tool.type._id,
      name: tool.type[language === "ar" ? "name_ar" : "name_en"], // Set 'name' based on language
    },
  }));

  const updatedPlaces = places.map((place) => ({
    ...place.toObject(), // Convert document to plain JS object
    type: {
      _id: place.type._id,
      name: place.type[language === "ar" ? "name_ar" : "name_en"], // Set 'name' based on language
    },
  }));

  // Send response
  res.status(200).json({
    success: true,
    updatedTools,
    updatedPlaces,
  });
});

export const addTripLeader = asyncHandler(async (req, res, next) => {
  const {
    name,
    N_id,
    phone,
    userName,
    license,
    expirationDate,
    createTrip,
    section,
  } = req.body;
  const { ownerId } = req.owner._id;

  const existingTripLeader = await tripLeaderModel.findOne({
    $or: [{ phone }, { N_id }, { userName }],
  });

  if (existingTripLeader) {
    return next(new Error("User already exists", { cause: 409 }));
  }

  const randomPassword = randomstring.generate({
    length: 8,
    charset: "alphanumeric",
  });

  const files = req.files;
  let images = {};

  if (files) {
    if (files.IDPhoto) {
      const result = await cloudinary.uploader.upload(files.IDPhoto[0].path, {
        folder: "tripLeaders/IDPhotos",
      });
      images.IDPhoto = { url: result.secure_url, id: result.public_id };
    }
    if (files.FictionAndSimile) {
      const result = await cloudinary.uploader.upload(
        files.FictionAndSimile[0].path,
        {
          folder: "tripLeaders/FictionAndSimile",
        }
      );
      images.FictionAndSimile = {
        url: result.secure_url,
        id: result.public_id,
      };
    }
    if (files.MaintenanceGuarantee) {
      const result = await cloudinary.uploader.upload(
        files.MaintenanceGuarantee[0].path,
        {
          folder: "tripLeaders/MaintenanceGuarantee",
        }
      );
      images.MaintenanceGuarantee = {
        url: result.secure_url,
        id: result.public_id,
      };
    }
    if (files.DrugAnalysis) {
      const result = await cloudinary.uploader.upload(
        files.DrugAnalysis[0].path,
        {
          folder: "tripLeaders/DrugAnalysis",
        }
      );
      images.DrugAnalysis = { url: result.secure_url, id: result.public_id };
    }
    if (files.profileImage) {
      const result = await cloudinary.uploader.upload(
        files.profileImage[0].path,
        {
          folder: "tripLeaders/profileImage",
        }
      );
      images.profileImage = { url: result.secure_url, id: result.public_id };
    }
  }

  const tripLeader = await tripLeaderModel.create({
    name,
    N_id,
    phone,
    userName,
    license,
    expirationDate,
    ownerId,
    createTrip,
    section,
    password: randomPassword,
    ...images,
  });
  return res.status(201).json({
    success: true,
    message: "Trip leader added successfully",
    data: {
      tripLeader,
      password: randomPassword,
    },
  });
});

export const getOwnerCode = asyncHandler(async (req, res, next) => {
  const owner = await OwnerModel.findOne({ email: req.owner.email }).populate({
    path: "ownerCode.discount",
    ref: "Discount",
    select: "discount -_id",
  });
  if (!owner) {
    return next(new Error("Owner Not Found!", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    status: 200,
    data: {
      code: owner.ownerCode.code,
      discount: owner.ownerCode.discount.discount,
    },
  });
});

export const registerAgreement = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;
  const owner = await OwnerModel.findById(ownerId);

  if (!owner) {
    return res.status(404).json({
      success: false,
      message: "Owner not found",
    });
  }

  owner.registerAgreement = true;

  await owner.save();

  return res.status(200).json({
    success: true,
    message: "Agreement registered successfully.",
  });
});