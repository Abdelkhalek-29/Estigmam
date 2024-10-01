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
    slug: slugify(name),
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
    results: place,
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
    place.slug = slugify(req.body.name);
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
  if (req.location) {
    place.location = JSON.parse(req.body.location);
  }
  if (req.body.licenseNumber) {
    place.licenseNumber = req.body.licenseNumber;
  }
  if (req.body.ExpiryDate) {
    place.ExpiryDate = req.body.ExpiryDate;
  }
  if (req.body.location) {
    place.location = JSON.parse(req.body.location);
  }
  if (req.files.license) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.license[0].path,
      {
        public_id: place.LicenseFile.id,
      }
    );
    place.LicenseFile.url = secure_url;
  }
  if (req.files.placeImages) {
    let i = 0;
    let images = [];
    for (const file of req.files.placeImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          public_id: place.images[i++].id,
        }
      );
      images.push({ url: secure_url, id: public_id });
    }
    place.images = images;
  }
  if (req.files.placeVideo) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files.placeVideo[0].path,
      {
        resource_type: "video",
        public_id: place.video.id,
      }
    );
    place.video.url = secure_url;
  }

  place.isUpdated=true
  await place.save();

  return res.status(201).json({
    success: true,
    message: "updated successfully",
    results: place,
  });
});
export const getAllPlaces = asyncHandler(async (req, res, next) => {
  const places = await placesModel
    .find({
      createBy: req.owner._id,
    })
    .select("-__v")
    .populate({ path: "type", select: "-__v" });
  if (!places) {
    return next(new Error("places Not Found!", { cause: 404 }));
  }
  return res.status(200).json({
    success: true,
    status: 200,
    message: "All places",
    data: places,
  });
});
export const getPlace = asyncHandler(async (req, res, next) => {
  const place = await placesModel
    .findOne({
      _id: req.params.placeId,
      createBy: req.owner._id,
    })
    .select("-__v")
    .populate({ path: "type", select: "-__v" });
  if (!place) {
    return next(new Error("place Not Found!", { cause: 404 }));
  }
  return res.status(200).json({
    success: true,
    status: 200,
    message: "place",
    data: place,
  });
});
export const deletePlace = asyncHandler(async (req, res, next) => {
  const place = await placesModel.findOneAndDelete({
    _id: req.params.placeId,
    createBy: req.owner._id,
  });
  if (!place) {
    return next(new Error("place Not Found!", { cause: 404 }));
  }
  await cloudinary.uploader.destroy(place.LicenseFile.id);
  place.images.map(async (image) => {
    await cloudinary.uploader.destroy(image.id);
  });
  await cloudinary.uploader.destroy(place.video.id, {
    resource_type: "video",
  });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "place deleted",
  });
});
