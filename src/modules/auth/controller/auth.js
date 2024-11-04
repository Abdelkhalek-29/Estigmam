import { asyncHandler } from "../../../utils/errorHandling.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import tokenModel from "../../../../DB/model/Token.model.js";
import randomstring from "randomstring";
import userModel from "../../../../DB/model/User.model.js";
import cityModel from "../../../../DB/model/city.model.js";
import countryModel from "../../../../DB/model/country.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { sendSMS } from "../../../utils/twilioService.js";

export const register = asyncHandler(async (req, res, next) => {
  const { userName, fullName, email, password, city, country, phone } =
    req.body;
  const isUser = await userModel.findOne({ phone });
  const isEmail = await userModel.findOne({ email });
  if (isEmail) {
    return next(new Error("The Email has already been used!", { cause: 409 }));
  }
  if (isUser) {
    return next(new Error("phone already registered !", { cause: 409 }));
  }
  const countryId = await countryModel.findById(country);
  if (!countryId) {
    return next(new Error("Country Not Found!", { cause: 404 }));
  }
  const cityId = await cityModel.findById(city);

  if (!cityId) {
    return next(new Error("City Not Found!", { cause: 404 }));
  }
  const hashPassword = bcryptjs.hashSync(
    password,
    Number(process.env.SALT_ROUND)
  );

  const user = await userModel.create({
    userName: userName.toLowerCase(),
    fullName,
    phone,
    city,
    country,
    email,
    password: hashPassword,
  });

  // const code = randomstring.generate({
  //   length: 4,
  //   charset: "numeric",
  // });
  const userCode = randomstring.generate({
    length: 15,
  });
  user.userCode.code = userCode;

  user.forgetCode = "1234";
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

  return res.status(200).json({
    success: true,

    data: { token, code: user.forgetCode },
  });
});
// export const activationAccount = asyncHandler(async (req, res, next) => {
//   const user = await userModel.findOneAndUpdate(
//     { activationCode: req.params.activationCode },
//     { isConfirmed: true, $unset: { activationCode: 1 } }
//   );

//   if (!user) {
//     return next(new Error("User Not Found!", { cause: 404 }));
//   }

//   return res
//     .status(200)
//     .send("Congratulation, Your Account is now activated, try to login");
// });

export const verificationCode = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.user.email });
  if (!user.forgetCode) {
    return next(new Error("Go to resend forget code", { status: 400 }));
  }
  if (user.forgetCode !== req.body.forgetCode) {
    return next(new Error("Invalid code!", { status: 400 }));
  }

  await userModel.findOneAndUpdate(
    { email: req.user.email },
    { $unset: { forgetCode: 1 } }
  );
  user.isConfirmed = true;
  await user.save();

  const tokens = await tokenModel.find({ user: req.user._id });
  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.TOKEN_SIGNATURE
  );

  await tokenModel.create({
    token,
    user: req.user._id,
    agent: req.headers["user-agent"],
  });

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Success! Sign up completed.",
    data: {
      userName: user.userName,
      phone: user.phone,
      email: user.email,
      profileImage: user.profileImage,
      token,
      fileData: {},
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { phone, password, fcmToken } = req.body;

  const user = await userModel
    .findOne({
      $or: [{ phone }, { phoneWithCode: phone }],
    })
    .populate("country", "name image")
    .populate("city", "name");

  if (!user) {
    return next(new Error("Phone not found", { cause: 400 }));
  }

  if (!user.isConfirmed) {
    user.forgetCode = "1234";
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

    return res.status(200).json({
      status: 200,
      success: true,
      isConfirmed: user.isConfirmed,
      msgError: "Unverified phone code",
      data: { token, code: user.forgetCode },
    });
  }

  const match = bcryptjs.compareSync(password, user.password);
  if (!match) {
    return next(new Error("Invalid phone or password", { cause: 400 }));
  }

  if (fcmToken) {
    user.fcmToken = fcmToken;
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.TOKEN_SIGNATURE
  );

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });

  user.status = "online";
  await user.save();

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Login success",
    data: {
      userName: user.userName,
      phone: user.phone,
      email: user.email,
      profileImage: user.profileImage,
      token,
      country: user.country,
      city: user.city,
      fileData: {},
    },
  });
});

//send forget Code

export const sendForgetCode = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ phone: req.body.phone });

  if (!user) {
    return next(new Error("Invalid phone number!", { cause: 400 }));
  }

  // const code = randomstring.generate({
  //   length: 4,
  //   charset: "numeric",
  // });

  user.forgetCode = "1234";
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
  return res.status(200).json({
    success: true,
    status: 200,
    message: "check you phone!",

    data: { code: user.forgetCode, token },
  });
});
export const resendCode = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ phone: req.user.phone });

  // const code = randomstring.generate({
  //   length: 4,
  //   charset: "numeric",
  // });

  user.forgetCode = "1234";
  await user.save();

  return res.status(200).json({
    success: true,
    status: 200,
    message: "check you phone message!",

    code: user.forgetCode,
  });
});

export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  if (req.body.OldPassword) {
    const match = bcryptjs.compareSync(req.body.OldPassword, req.user.password);
    if (!match) {
      return next(new Error("Invalid Old Password!", { cause: 400 }));
    }
  }

  const newPassword = bcryptjs.hashSync(
    req.body.password,
    +process.env.SALT_ROUND
  );
  await userModel.findOneAndUpdate(
    { email: req.user.email },
    { password: newPassword }
  );

  //invalidate tokens
  const tokens = await tokenModel.find({ user: req.user._id });

  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  return res
    .status(200)
    .json({ success: true, status: 200, message: "Try to login!" });
});

export const VerifyCode = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.user.email });
  if (!user.forgetCode) {
    return next(new Error("go to resend forget code", { status: 400 }));
  }
  if (user.forgetCode !== req.body.forgetCode) {
    return next(new Error("Invalid code!", { status: 400 }));
  }
  await userModel.findOneAndUpdate(
    { email: req.user.email },
    { $unset: { forgetCode: 1 } }
  );

  return res.status(200).json({
    success: true,
    status: 200,
    data: { message: "go to reset new password" },
  });
});
export const tokenIsValid = asyncHandler(async (req, res, next) => {
  if (!req.headers["token"]) {
    return res.status(401).json({ message: "No token provided", status: 401 });
  }
  const token = await tokenModel.findOne({ token: req.headers["token"] });
  if (!token || !token.isValid) {
    return res
      .status(401)
      .json({ message: "In-valid token", status: 401, isValid: token.isValid });
  }
  return res
    .status(200)
    .json({ message: "valid token", status: 200, isValid: token.isValid });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findById(req.user._id)
    .populate("country", "name image")
    .populate("city", "name");

  if (!user) {
    return next(new Error("User Not Found!", { cause: 404 }));
  }

  const { userName, email, phone, city, country } = req.body;

  // Check for email conflict only if the new email is different
  if (email && email !== user.email) {
    const emailExist = await userModel.findOne({ email });
    if (emailExist) {
      return next(new Error("Email already exists!", { cause: 409 }));
    }
  }

  // Check for phone conflict only if the new phone is different
  if (phone && phone !== user.phone) {
    const phoneExist = await userModel.findOne({ phone });
    if (phoneExist) {
      return next(new Error("Phone already exists!", { cause: 409 }));
    }
  }

  // Handle country update
  if (country) {
    const countryId = await countryModel.findById(country).select("name image");
    if (!countryId) {
      return next(new Error("Country Not Found!", { cause: 404 }));
    }
    user.country = countryId;
  }

  // Handle city update
  if (city) {
    const cityId = await cityModel.findById(city).select("name");
    if (!cityId) {
      return next(new Error("City Not Found!", { cause: 404 }));
    }
    user.city = cityId;
  }

  // Update other fields
  if (userName) {
    user.userName = userName;
  }
  if (email) {
    user.email = email;
  }
  if (phone) {
    const countryId = await countryModel.findOne({
      $or: [{ _id: country }, { _id: user.country }],
    });
    user.phone = phone;
    user.phoneWithCode = countryId.codePhone + phone.slice(1);
  }

  // Handle file upload for profile image
  let fileData = {};
  if (req.file) {
    if (user.profileImage.id === "user_profile_q6je8x.jpg") {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.file.path,
        {
          folder: `${process.env.FOLDER_CLOUDINARY}/user/${user._id}/profileImage`,
        }
      );
      user.profileImage.url = secure_url;
      user.profileImage.id = public_id;
    } else {
      const { public_id, secure_url } = await cloudinary.uploader.upload(
        req.file.path,
        {
          public_id: user.profileImage.id,
        }
      );
      user.profileImage.url = secure_url;
    }
    fileData = {
      size: req.file.size || "",
      path: req.file.path || "",
      filename: req.file.filename || "",
      destination: req.file.destination || "",
      mimetype: req.file.mimetype || "",
      encoding: req.file.encoding || "",
      originalname: req.file.originalname || "",
      fieldname: req.file.fieldname || "",
    };
  }

  // Save the updated user information
  await user.save();

  // Return the existing token from headers
  const token = req.headers["token"];

  const responseData = {
    userName: user.userName,
    phone: user.phone,
    email: user.email,
    profileImage: user.profileImage,
    country: {
      name: user.country?.name,
      image: user.country?.image,
      _id: user.country?._id,
      id: user.country?.id,
    },
    city: {
      name: user.city?.name,
      _id: user.city?._id,
    },
    token,
    fileData,
  };

  return res.status(200).json({
    success: true,
    status: 200,
    message: "Profile Updated!",
    data: responseData,
  });
});

export const getUserCode = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.user.email }).populate({
    path: "userCode.discount",
    ref: "Discount",
    select: "discount -_id",
  });
  if (!user) {
    return next(new Error("User Not Found!", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    status: 200,
    data: {
      code: user.userCode.code,
      discount: user.userCode.discount.discount,
    },
  });
});

export const getUser = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .find({})
    .select("userName fullName email phone _id role");
  if (!user) {
    return next(new Error("User Not Found!", { cause: 404 }));
  }
  return res.status(200).json({
    success: true,
    status: 200,
    user,
  });
});
