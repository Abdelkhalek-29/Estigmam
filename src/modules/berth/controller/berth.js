
import berthModel from "../../../../DB/model/berth.model.js";
import cityModel from "../../../../DB/model/city.model.js";
import tripModel from "../../../../DB/model/Trip.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";

const uploadImageToCloudinary = async (file) => {
  return cloudinary.uploader.upload(file.path, {
    folder: 'berth_images',
    resource_type: 'image',
  });
};

export const addBerth = asyncHandler(async (req, res, next) => {
  const { name, cityId, countryId, location } = req.body;

  const city = await cityModel.findById(cityId);
  if (!city) {
    return next(new Error("CityId Not Found!", { cause: 404 }));
  }

  if (!countryId) {
    return next(new Error("CountryId is required!", { cause: 400 }));
  }
  const images = [];
  if (req.files && req.files.berthImages) {
    for (const file of req.files.berthImages) {
      try {
        const result = await uploadImageToCloudinary(file);
        images.push({
          url: result.secure_url, 
          id: result.public_id,    
        });
      } catch (error) {
        return next(new Error("Image Upload Failed!", { cause: 500 }));
      }
    }
  }
  const berth = await berthModel.create({
    name,
    cityId,
    countryId,
    location,
    images, 
  });
  return res.status(201).json({
    success: true,
    status: 201,
    message: "Berth Added",
    data: berth,
  });
});
 
export const getAllBerth = asyncHandler(async (req, res, next) => {
  const { cityId } = req.params;
  const city = await cityModel.findById(cityId);
  if (!city) {
    return next(new Error("CityId Not Found!", { cause: 404 }));
  }
  const berth = await berthModel
    .find({ cityId })
    .select("name -_id");
  if (!berth) {
    return next(new Error("Berth Not Found for this city!", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Berth List",
    data: berth,
  });
});

export const getBerths=asyncHandler(async(req,res,next)=>{
 const berths=await berthModel.find().select("name _id location")

  return res.status(200).json({
    success: true,
    status: 200,
    data: berths,
  });
});
  
export const nearest=asyncHandler(async(req,res,next)=>{
    const { location } = req.body;

    if (!location || !location.longitude || !location.latitude) {
      return res.status(400).json({ message: "Location with longitude and latitude is required" });
    }

    const userLocation = [parseFloat(location.longitude), parseFloat(location.latitude)];

    const nearestBerth = await berthModel.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: userLocation },
          distanceField: "distance",
          spherical: true,
       //   maxDistance: 10000, 
        }
      },
      { $limit: 1 }
    ]);

    if (!nearestBerth.length) {
      return res.status(404).json({ message: "No berth found near your location" });
    }

    return res.json(nearestBerth[0]);
  })

  export const getUpcomingTripsCountPerBerth = asyncHandler(async (req, res) => {
    const { berthName } = req.query;
  
    const filter = berthName ? { name: berthName } : {};
  
    const berths = await berthModel
      .find(filter)
      .select("_id name location countryId images")
      .populate({ path: "countryId", select: "name" });
  
    if (!berths.length) {
      return res.status(404).json({ success: false, message: "No berth found" });
    }
  
    const results = await Promise.all(
      berths.map(async (berth) => {
        const tripCount = await tripModel.countDocuments({
          berh: berth.name,
          status: "upComing",
        });
  
        return {
          name: berth.name,
          location: berth.location,
          country: berth.countryId.name,
          upcomingTripsCount: tripCount,
          images: berth.images,
        };
      })
    );
  
    return res.status(200).json({ success: true, berths: results });
  });