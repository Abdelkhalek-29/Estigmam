import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";
import toolModel from "../../../../DB/model/tool.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";
import activityModel from "../../../../DB/model/activity.model.js";

export const addTool = asyncHandler(async (req, res, next) => {
  const { name, type, location, portName, details, activityId } = req.body;

  const typesOfPlaces = await typesOfPlacesModel.findById(type);
  if (!typesOfPlaces) {
    return next(new Error("typesOfPlaces not found!", { cause: 404 }));
  }
  const ownerId = req.owner._id;
  let licenseFileResult = null;
  const toolImages = [];
  let toolVideoResult = null;

  if (req.files.license && req.files.license.length > 0) {
    licenseFileResult = await cloudinary.uploader.upload(
      req.files.license[0].path,
      {
        resource_type: "raw",
        folder: `${process.env.FOLDER_CLOUDINARY}/license/${ownerId}/LicenseFile`,
      }
    );
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
    toolVideoResult = await cloudinary.uploader.upload(
      req.files.toolVideo[0].path,
      {
        resource_type: "video",
        folder: `${process.env.FOLDER_CLOUDINARY}/toolVideos/${ownerId}/toolVideo`,
      }
    );
  }

  const newTool = new toolModel({
    name,
    type,
    licenseImage: licenseFileResult
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
    details,
  });

  if (activityId) {
    const activity = await activityModel.findById(activityId);
    if (!activity) {
      return next(new Error("Activity not found!", { cause: 404 }));
    }
    newTool.activityId = activityId;
  }
  await newTool.save();

  const populatedTool = await toolModel
    .findById(newTool._id)
    .populate("type", "name");

  res.status(201).json({
    success: true,
    status: 201,
    message: "Tool added successfully",
    data: populatedTool,
  });
});
export const updateTool = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.owner;

  const tool = await toolModel.findById(id);
  if (!tool) {
    return next(new Error(" Tool Not Found ! ", { status: 404 }));
  }

  if (tool.createBy.toString() !== req.owner._id.toString()) {
    return next(new Error(" Unauthorized", { status: 403 }));
  }

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

  if (req.files["toolImages"]) {
    const toolImages = await Promise.all(
      req.files["toolImages"].map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path);
        return { id: result.public_id, url: result.secure_url };
      })
    );
    tool.toolImage = toolImages;
  }

  if (req.files["toolVideo"]) {
    const toolVideoFile = req.files["toolVideo"][0];
    const videoUpload = await cloudinary.uploader.upload(toolVideoFile.path, {
      resource_type: "video",
    });
    tool.toolVideo = { id: videoUpload.public_id, url: videoUpload.secure_url };
  }

  const updateFields = req.body;
  Object.keys(updateFields).forEach((key) => {
    tool[key] = updateFields[key];
  });
  tool.isUpdated = true;
  await tool.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Tool updated successfully",
    data: tool,
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
  const ownerId = req.owner._id; // assuming req.owner holds the authenticated owner
  const { id: toolId } = req.params; // renamed id to match your route definition
  const { Examination_date: date } = req.body; // use the body field `Examination_date`

  const tool = await toolModel.findById(toolId);
  if (!tool) {
    return next(new Error("Tool not found!", { status: 404 }));
  }

  tool.Examination_date = date; // assign the date to the tool document

  await tool.save(); // Save the document (not the model)

  res.status(200).json({
    success: true,
    status: 200,
    message: "Examination date sent successfully",
  });
});
