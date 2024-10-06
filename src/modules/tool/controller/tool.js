import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import toolModel from "../../../../DB/model/tool.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import activityModel from "../../../../DB/model/activity.model.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";

// Predefined types with both English and Arabic names
const predefinedTypes = [
  { id: "66dcc2b4626dfd336c9d8732", name: { en: "Boats", ar: "مراكب" } },
  { id: "66dcc2c6626dfd336c9d873a", name: { en: "Yacht", ar: "يخت" } },
  { id: "66dc1b6737f54a0f875bf3ce", name: { en: "Jet boat", ar: "جيت بوت" } },
  { id: "66dc1ba737f54a0f875bf3d1", name: { en: "Sea bike", ar: "دباب بحرى" } },
];

export const addTool = asyncHandler(async (req, res, next) => {
  const { name, type, location, portName, licenseEndDate, licenseNunmber } = req.body;

  /*const typesOfPlaces = await typesOfPlacesModel.findById(type);
  if (!typesOfPlaces) {
    return next(new Error("typesOfPlaces not found!", { cause: 404 }));
  }*/

  const ownerId = req.owner._id;
  let licenseFileResult = null;
  const toolImages = [];
  let toolVideoResult = null;

  if (req.files.license && req.files.license.length > 0) {
    licenseFileResult = await cloudinary.uploader.upload(req.files.license[0].path, {
      resource_type: "raw",
      folder: `${process.env.FOLDER_CLOUDINARY}/license/${ownerId}/LicenseFile`,
    });
  }

  if (req.files.toolImages && req.files.toolImages.length > 0) {
    for (const file of req.files.toolImages) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `${process.env.FOLDER_CLOUDINARY}/toolImages/${ownerId}/toolImages`,
      });
      toolImages.push({ id: result.public_id, url: result.secure_url });
    }
  }

  if (req.files.toolVideo && req.files.toolVideo.length > 0) {
    toolVideoResult = await cloudinary.uploader.upload(req.files.toolVideo[0].path, {
      resource_type: "video",
      folder: `${process.env.FOLDER_CLOUDINARY}/toolVideos/${ownerId}/toolVideo`,
    });
  }

  const newTool = new toolModel({
    name,
    type,
    licensePd: licenseFileResult
      ? {
          id: licenseFileResult.public_id,
          url: licenseFileResult.secure_url,
        }
      : undefined,
    toolImage: toolImages.length > 0 ? toolImages : undefined,
    toolVideo: toolVideoResult
      ? {
          id: toolVideoResult.public_id,
          url: toolVideoResult.secure_url,
        }
      : undefined,
    location,
    portName,
    createBy: req.owner._id,
    licenseNunmber,
    licenseEndDate,
  });

  const matchingType = predefinedTypes.find((item) => item.id === type);
  if (matchingType) {
    newTool.section = {
      name_en: matchingType.name.en,
      name_ar: matchingType.name.ar,
    };
  }

  await newTool.save();

  const populatedTool = await toolModel.findById(newTool._id).populate("type", "name");

  res.status(201).json({
    success: true,
    status: 201,
    message: "Tool added successfully",
  });
});
export const updateTool = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const tool = await toolModel.findById(id);
  if (!tool) {
    return next(new Error(" Tool Not Found ! ", { status: 404 }));
  }

  if (tool.createBy.toString() !== req.owner._id.toString()) {
    return next(new Error(" Unauthorized", { status: 403 }));
  }

  // Upload license image if present
  if (req.files["license"]) {
    const licenseFile = req.files["license"][0];
    const licenseUpload = await cloudinary.uploader.upload(licenseFile.path, {
      resource_type: "raw",
    });
    tool.licenseImage = {
      id: licenseUpload.public_id,
      url: licenseUpload.secure_url,
    };
  }

  // Upload tool images if present
  if (req.files["toolImages"]) {
    const toolImages = await Promise.all(
      req.files["toolImages"].map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path);
        return { id: result.public_id, url: result.secure_url };
      })
    );
    tool.toolImage = toolImages;
  }

  // Upload tool video if present
  if (req.files["toolVideo"]) {
    const toolVideoFile = req.files["toolVideo"][0];
    const videoUpload = await cloudinary.uploader.upload(toolVideoFile.path, {
      resource_type: "video",
    });
    tool.toolVideo = { id: videoUpload.public_id, url: videoUpload.secure_url };
  }

  const updateFields = req.body;

  // Update tool type if present
  if (updateFields.type) {
    const matchingType = predefinedTypes.find((item) => item.id === updateFields.type);
    if (matchingType) {
      tool.section = {
        name_en: matchingType.name.en,
        name_ar: matchingType.name.ar,
      };
    }
    tool.type = updateFields.type;
  }

  // Update other fields
  Object.keys(updateFields).forEach((key) => {
    tool[key] = updateFields[key];
  });

  tool.isUpdated = true;
  await tool.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Tool updated successfully",
  });
});


export const deleteTool = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const tool = await toolModel.findById(id);

  if (!tool) {
    return next(new Error(" Tool not found !"), { status: 404 });
  }

  if (tool.createBy.toString() !== req.owner._id.toString()) {
    return next(new Error(" Unauthorized ", { status: 403 }));
  }

  if (tool.licenseImage && tool.licenseImage.id) {
    await cloudinary.uploader.destroy(tool.licenseImage.id, {
      resource_type: "raw",
    });
  }

  if (tool.toolImage && tool.toolImage.length > 0) {
    for (const image of tool.toolImage) {
      await cloudinary.uploader.destroy(image.id);
    }
  }

  if (tool.toolVideo && tool.toolVideo.id) {
    await cloudinary.uploader.destroy(tool.toolVideo.id, {
      resource_type: "video",
    });
  }

  await toolModel.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Tool deleted successfully",
    status: 200,
  });
});

export const getAllTools = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id;
  const tools = await toolModel
    .find({ createBy: ownerId })
    .populate("type", "name");
  if (!tools) {
    res.status(404);
    return new Error(
      "Tool not found or you do not have permission to access it"
    );
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: tools,
  });
});

export const getToolById = asyncHandler(async (req, res) => {
  const ownerId = req.owner._id;
  const toolId = req.params.id;

  const tool = await toolModel
    .findOne({ _id: toolId, createBy: ownerId })
    .populate("type", "name");

  if (!tool) {
    res.status(404);
    return new Error(
      "Tool not found or you do not have permission to access it"
    );
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: tool,
  });
});

export const ExaminationDate = asyncHandler(async (req, res, next) => {
  const ownerId = req.owner._id; 
  const { Examination_date: date } = req.body; 

  const tools = await toolModel.find({ createBy: ownerId });

  if (!tools || tools.length === 0) {
    return next(new Error("No tools found for this owner!", { status: 404 }));
  }

  for (let tool of tools) {
    tool.Examination_date = date;
    await tool.save(); 
  }

  const owner = await OwnerModel.findById(ownerId);
  if (owner) {
    owner.isDate = true; 
    await owner.save(); 
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Examination dates updated successfully for all tools, isDate set to true",
  });
});

export const getUpdatedTools =asyncHandler( async (req, res) => {
  const ownerId = req.owner?.id; 
  const language = req.headers["accept-language"] || "en"; 

  if (!ownerId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const tools = await toolModel
    .find({ createBy: ownerId, isUpdated: true })
    .select("name type section licensePd licenseNunmber licenseEndDate toolImage toolVideo location portName Examination_date details activityId code isUpdated");

  const formattedTools = tools.map(tool => ({
    ...tool._doc,
    section: {
      name: tool.section[language === "ar" ? "name_ar" : "name_en"], 
    },
  }));

  return res.status(200).json({
    success: true,
    tools: formattedTools, 
  });
});