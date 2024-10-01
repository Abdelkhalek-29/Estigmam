import cityModel from "../../../../DB/model/city.model.js";
import countryModel from "../../../../DB/model/country.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import cloudinary from "../../../utils/cloudinary.js";

export const addCountry = asyncHandler(async (req, res, next) => {
  const { name, codePhone } = req.body;
  const countryExists = await countryModel.findOne({ name });
  if (countryExists) {
    return next(new Error("Country Already Exists!", { cause: 400 }));
  }
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.FOLDER_CLOUDINARY}/countryFlag`,
    }
  );
  const country = await countryModel.create({
    name,
    codePhone,
    image: { url: secure_url, id: public_id },
  });

  return res.status(201).json({
    success: true,
    status: 201,
    message: "Country Added",
    data: country,
  });
});
export const addCity = asyncHandler(async (req, res, next) => {
  const { name, location } = req.body;
  const { countryId } = req.params;
  const country = await countryModel.findById(countryId);
  if (!country) {
    return next(new Error("CountryId Not Found!", { cause: 404 }));
  }
  const cityExists = await cityModel.findOne({ name });
  if (cityExists) {
    return next(new Error("City Already Exists!", { cause: 400 }));
  }

  const city = await cityModel.create({
    name,
    countryId,
    location,
  });

  return res.status(201).json({
    success: true,
    status: 201,
    message: "City Added",
    data: city,
  });
});
export const getAllcountry = asyncHandler(async (req, res, next) => {
  const country = await countryModel
    .find()
    .select("-__v ")
    .populate({ path: "city", select: "-__v" });
  if (!country) {
    return next(new Error("Country Not Found!", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Country List",
    data: country,
  });
});

export const getAllcity = asyncHandler(async (req, res, next) => {

  const city = await cityModel
    .find({}).select("name location");
    
  if (!city) {
    return next(new Error("City Not Found!", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    status: 200,
    message: "City List",
    data: city,
  });
});