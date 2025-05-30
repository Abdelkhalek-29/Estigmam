import slugify from "slugify";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import placesModel from "../../../../DB/model/places.model.js";
import typesOfPlacesModel from "../../../../DB/model/typesOfPlaces.model.js";

export const addPlace = asyncHandler(async (req, res, next) => {
  const { name, type, licenseNumber, ExpiryDate, description, location } =
    req.body;
  const typesOfPlaces = await typesOfPlacesModel.findById(type);
  if (!typesOfPlaces) {
    return next(new Error("typesOfPlaces not found!", { cause: 404 }));
  }

  const place = await placesModel.create({
    name,
    type,
    location: JSON.parse(location),
    licenseNumber,
    description,
    ExpiryDate,
    createBy: req.owner._id,
  });
  if (req.files.license) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.license[0].path,
      {
        folder: `${process.env.FOLDER_CLOUDINARY}/place/${place.createBy}/${place._id}/LicenseFile`,
      }
    );
    place.LicenseFile = { url: secure_url, id: public_id };
    await place.save();
  } else {
    return next(new Error("LicenseFile is required", { cause: 400 }));
  }
  if (req.files.placeImages) {
    let images = [];
    for (const file of req.files.placeImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.FOLDER_CLOUDINARY}/place/${place.createBy}/${place._id}/images`,
        }
      );
      images.push({ url: secure_url, id: public_id });
    }

    place.images = images;
    await place.save();
  } else {
    return next(new Error("images is required", { cause: 400 }));
  }

  if (req.files.placeVideo) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.placeVideo[0].path,
      {
        resource_type: "video",
        folder: `${process.env.FOLDER_CLOUDINARY}/place/${place.createBy}/${place._id}/video`,
      }
    );
    place.video = { url: secure_url, id: public_id };
    await place.save();
  } else {
    return next(new Error("video is required", { cause: 400 }));
  }
  return res.status(201).json({
    success: true,
    message: "place added successfully",
  });
});

export const updatePlace = asyncHandler(async (req, res, next) => {
  const place = await placesModel.findOne({
    _id: req.params.placeId,
    createBy: req.owner._id,
  });

  if (!place) {
    return next(new Error("place not found", { cause: 404 }));
  }

  if (req.body.name) {
    place.name = req.body.name;
  }

  if (req.body.type) {
    const typesOfPlaces = await typesOfPlacesModel.findOne({
      _id: req.body.type,
    });

    if (!typesOfPlaces) {
      return next(new Error("typesOfPlaces not found", { cause: 404 }));
    }

    place.type = req.body.type;
  }

  if (req.body.location) {
    place.location = JSON.parse(req.body.location);
  }

  if (req.body.licenseNumber) {
    place.licenseNumber = req.body.licenseNumber;
  }

  if (req.body.ExpiryDate) {
    place.ExpiryDate = req.body.ExpiryDate;
  }
  if (req.body.description) {
    place.description = req.body.description;
  }

  if (req.files.license && place.LicenseFile) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.license[0].path,
      {
        public_id: place.LicenseFile.id,
      }
    );
    place.LicenseFile.url = secure_url;
  }

  if (req.files.placeImages && place.images) {
    let i = 0;
    let images = [];
    for (const file of req.files.placeImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          public_id: place.images[i]?.id || undefined,
        }
      );
      images.push({ url: secure_url, id: public_id });
      i++;
    }
    place.images = images;
  }
  if (req.files.placeVideo && place.video) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.placeVideo[0].path,
      {
        resource_type: "video",
        public_id: place.video.id,
      }
    );
    place.video.url = secure_url;
  }

  place.isUpdated = true;

  await place.save();

  return res.status(201).json({
    success: true,
    message: "updated successfully",
  });
});
export const getAllPlaces = asyncHandler(async (req, res, next) => {
  const language = req.headers["accept-language"] === "ar" ? "ar" : "en";
  const ownerId = req.owner._id;

  const types = await typesOfPlacesModel.find().select("name_en name_ar");
  console.log("Fetched Types:", types);

  const typeMap = types.reduce((acc, type) => {
    acc[type._id.toString()] = type[`name_${language}`] || "Unknown Type";
    return acc;
  }, {});

  console.log("Type Map:", typeMap);

  const places = await placesModel.find({ createBy: ownerId }).select("-__v");

  const placesWithTranslatedTypes = places.map((place) => {
    const typeIdString = place.type?.toString();
    const typeName = typeMap[typeIdString] || "Unknown Type";
    return {
      ...place.toObject(),
      type: {
        _id: place.type,
        name: typeName,
      },
    };
  });

  return res.status(200).json({
    success: true,
    status: 200,
    data: placesWithTranslatedTypes,
  });
});

export const placesName = asyncHandler(async (req, res, next) => {
  const language = req.headers["accept-language"] === "ar" ? "ar" : "en";
  const ownerId = req.owner._id;

  const types = await typesOfPlacesModel.find().select("name_en name_ar");
  const typeMap = types.reduce((acc, type) => {
    acc[type._id.toString()] = type[`name_${language}`] || "Unknown Type";
    return acc;
  }, {});

  const places = await placesModel
    .find({ createBy: ownerId })
    .select("name _id type");

  const placesWithTranslatedTypes = places.map((place) => {
    const typeIdString = place.type?.toString();
    const typeName = typeMap[typeIdString] || "Unknown Type";

    return {
      ...place.toObject(),
      type: {
        _id: place.type,
        name: typeName,
      },
    };
  });

  return res.status(200).json({
    success: true,
    status: 200,
    data: placesWithTranslatedTypes,
  });
});

export const getPlace = asyncHandler(async (req, res, next) => {
  const language = req.headers["accept-language"] === "ar" ? "ar" : "en";
  const placeId = req.params.placeId;
  const place = await placesModel
    .findOne({
      _id: placeId,
      createBy: req.owner._id,
    })
    .select("-__v");

  if (!place) {
    return next(new Error("Place Not Found!", { cause: 404 }));
  }

  const type = await typesOfPlacesModel
    .findById(place.type)
    .select(`name_${language}`);
  const typeName = type ? type[`name_${language}`] : "Unknown Type";

  const placeWithTypeName = {
    ...place.toObject(),
    type: {
      _id: place.type,
      name: typeName,
    },
  };

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Place retrieved successfully",
    data: placeWithTypeName,
  });
});

export const deletePlace = asyncHandler(async (req, res, next) => {
  const place = await placesModel.findOneAndDelete({
    _id: req.params.placeId,
    createBy: req.owner._id,
  });

  if (!place) {
    return res.status(404).json({
      success: false,
      message: "Place not found!",
    });
  }
  if (place.LicenseFile && place.LicenseFile.id) {
    await cloudinary.uploader.destroy(place.LicenseFile.id);
  }

  if (place.images && Array.isArray(place.images)) {
    for (const image of place.images) {
      if (image.id) {
        await cloudinary.uploader.destroy(image.id);
      }
    }
  }
  if (place.video && place.video.id) {
    await cloudinary.uploader.destroy(place.video.id, {
      resource_type: "video",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Place deleted successfully",
  });
});
export const getUpdatedPlaces = asyncHandler(async (req, res) => {
  const ownerId = req.owner?.id;
  const language = req.headers["accept-language"] || "en";

  if (!ownerId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const places = await placesModel
    .find({ createBy: ownerId, isUpdated: true })
    .populate({
      path: "type",
      select: `${language === "ar" ? "name_ar" : "name_en"}`,
    })
    .select(
      "name type location description LicenseFile licenseNumber ExpiryDate images video code isUpdated"
    )
    .catch((err) => {
      console.error("Database query failed:", err);
      return res.status(500).json({ message: "Internal server error" });
    });
  const formattedPlaces = places.map((place) => ({
    ...place._doc,
    type: {
      id: place.type?._id,
      name: place.type[language === "ar" ? "name_ar" : "name_en"],
    },
  }));

  return res.status(200).json({
    success: true,
    places: formattedPlaces,
  });
});
