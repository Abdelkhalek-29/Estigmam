import userModel from "../../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import transactionModel from "../../../../DB/model/transactions.model.js";
import {
  initiateApplePayPaymentService,
  initiateCardPaymentService,
  initiateGooglePayPaymentService,
  initiatePayPalPaymentService,
} from "../../../utils/payment.js";
import OwnerModel from "../../../../DB/model/Owner.model .js";
import tripLeaderModel from "../../../../DB/model/tripLeader.model.js";
import bankModel from "../../../../DB/model/bank.model.js";

export const charging = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { amount, method } = req.body;

  let paymentResponse;

  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided",
      });
    }

    const validAmount = Number(parseFloat(amount).toFixed(2));

    switch (method) {
      case "Card":
        paymentResponse = await initiateCardPaymentService({
          amount: validAmount,
        });
        break;
      case "Apple":
        paymentResponse = await initiateApplePayPaymentService({
          amount: validAmount,
          name: "wallet charging",
          returnUrl:
            "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
        });
        break;
      case "Google":
        paymentResponse = await initiateGooglePayPaymentService({
          amount: validAmount,
          name: "wallet charging",
          userId,
          currency: "SAR",
          returnUrl:
            "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
        });
        break;
      case "PayPal":
        paymentResponse = await initiatePayPalPaymentService({
          amount: validAmount,
          name: "wallet charging",
          returnUrl:
            "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.wallet.balance += validAmount;
    user.wallet.total_Deposit += validAmount;
    user.wallet.lastUpdated = Date.now();
    await user.save();

    await transactionModel.create({
      actorId: userId,
      actorType: "User",
      amount: validAmount,
      type: "Wallet",
      method,
      reason: "Wallet recharge",
      orderId: paymentResponse.result?.orderId || "MISSING_ORDER_ID",
    });

    res.status(200).json({
      success: true,
      message: "Go to checkout page!",
      paymentResponse: paymentResponse.result.checkoutData.postUrl,
    });
  } catch (error) {
    console.error("Error charging wallet:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment failed",
      error: error.message,
    });
  }
});

export const userWallet = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const { minAmount, maxAmount, fromDate, toDate, type, sortBy, sortOrder } =
    req.query;

  const filter = { actorId: userId };

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  if (type) {
    filter.type = type;
  }

  const sortOptions = {};
  if (sortBy) {
    const sortField = sortBy === "amount" ? "amount" : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }

  const userBalance = await userModel.findById(userId).select("wallet");

  const transactions = await transactionModel
    .find(filter)
    .sort(sortOptions)
    .select("-actorType -actorId");

  res.status(200).json({
    success: true,
    data: { userBalance, transactions },
  });
});
export const bankAccount = asyncHandler(async (req, res, next) => {
  const userId = req.owner?._id || req.tripLeader?._id;
  const { account_owner, bank_name, bankId, branch, IBAN, local_num } =
    req.body;

  const userSchema = req.owner ? OwnerModel : tripLeaderModel;

  const user = await userSchema.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  user.bank_account.push({
    account_owner,
    bank_name,
    branch,
    IBAN,
    local_num,
    bankId,
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: "Bank account added successfully!",
    bank_accounts: user.bank_account,
  });
});

export const walletCharging = asyncHandler(async (req, res, next) => {
  const userId = req.owner?._id || req.tripLeader?._id;
  const userSchema = req.owner ? OwnerModel : tripLeaderModel;
  const { amount, method } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User not authenticated",
    });
  }

  let paymentResponse;

  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided",
      });
    }

    const validAmount = Number(parseFloat(amount).toFixed(2));

    switch (method) {
      case "Card":
        paymentResponse = await initiateCardPaymentService({
          amount: validAmount,
        });
        break;
      case "Apple":
        paymentResponse = await initiateApplePayPaymentService({
          amount: validAmount,
          name: "wallet charging",
          returnUrl:
            "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
        });
        break;
      case "Google":
        paymentResponse = await initiateGooglePayPaymentService({
          amount: validAmount,
          name: "wallet charging",
          userId,
          currency: "SAR",
          returnUrl:
            "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
        });
        break;
      case "PayPal":
        paymentResponse = await initiatePayPalPaymentService({
          amount: validAmount,
          name: "wallet charging",
          returnUrl:
            "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
    }

    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.wallet.balance += validAmount;
    user.wallet.total_Deposit += validAmount;
    user.wallet.lastUpdated = Date.now();
    await user.save();

    await transactionModel.create({
      actorId: userId,
      actorType: req.owner ? "Owner" : "TripLeader",
      amount: validAmount,
      type: "Wallet",
      method,
      reason: "Wallet recharge",
      orderId: paymentResponse.result?.orderId || "MISSING_ORDER_ID",
    });

    res.status(200).json({
      success: true,
      message: "Go to checkout page!",
      paymentResponse: paymentResponse.result?.checkoutData?.postUrl || null,
    });
  } catch (error) {
    console.error("Error charging wallet:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment failed",
      error: error.message,
    });
  }
});

export const ownerWallet = asyncHandler(async (req, res, next) => {
  const userId = req.owner?._id || req.tripLeader?._id;
  const userSchema = req.owner ? OwnerModel : tripLeaderModel;
  const { minAmount, maxAmount, fromDate, toDate, type, sortBy, sortOrder } =
    req.query;

  // Get the accepted language from the request headers (e.g., "en" or "ar")
  const acceptedLanguage = req.headers["accept-language"] || "en";

  const filter = { actorId: userId };

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  if (type) {
    filter.type = type;
  }

  const sortOptions = {};
  if (sortBy) {
    const sortField = sortBy === "amount" ? "amount" : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;
  } else {
    sortOptions.createdAt = -1;
  }

  // Fetch user balance and bank accounts
  const userBalance = await userSchema
    .findById(userId)
    .select("wallet bank_account")
    .populate({
      path: "bank_account.bankId", // Populate using bankId
      model: "Bank",
      select: "bank_image name_en name_ar", // Select the required fields
    });

  if (!userBalance) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Ensure bank_account is an array before calling .map()
  const bankAccountsWithDetails = Array.isArray(userBalance.bank_account)
    ? userBalance.bank_account.map((account) => {
        const bankName =
          acceptedLanguage === "ar"
            ? account.bankId?.name_ar
            : account.bankId?.name_en;

        return {
          ...account.toObject(),
          bank_name: bankName || null, // Return bank name directly as a string
          bank_image: account.bankId?.bank_image || null, // Return only the bank image
        };
      })
    : []; // If it's not an array, return an empty array

  res.status(200).json({
    success: true,
    data: {
      wallet: userBalance.wallet,
      bank_account: bankAccountsWithDetails, // Return bank accounts with names and images
      transactions: await transactionModel
        .find(filter)
        .sort(sortOptions)
        .select("-actorType -actorId"),
    },
  });
});

export const getBanks = asyncHandler(async (req, res, next) => {
  const acceptLanguage = req.headers["accept-language"] || "en";
  const languageKey = acceptLanguage.toLowerCase().startsWith("ar")
    ? "name_ar"
    : "name_en";

  const banks = await bankModel.find().select("name_en name_ar bank_image");

  const formattedBanks = banks.map((bank) => ({
    name: bank[languageKey],
    bank_image: bank.bank_image,
  }));

  res.status(200).json({
    success: true,
    data: formattedBanks,
  });
});

export const addBank = asyncHandler(async (req, res, next) => {
  const { name_ar, name_en } = req.body;
  let bank_image = "";

  if (req.files.bank_image && req.files.bank_image.length > 0) {
    const file = req.files.bank_image[0];
    const result = await cloudinary.uploader.upload(file.path, {
      folder: `${process.env.FOLDER_CLOUDINARY}/bank_image/`,
    });
    bank_image = result.secure_url;
  }

  const bank = await bankModel.create({ name_ar, name_en, bank_image });
  res.status(200).json({
    success: true,
    message: "Bank added successfully!",
    data: bank,
  });
});

export const setDefault = asyncHandler(async (req, res, next) => {
  const { bankId } = req.params;
  const userId = req.owner?._id || req.tripLeader?._id;
  const userSchema = req.owner ? OwnerModel : tripLeaderModel;

  const user = await userSchema.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const bank = user.bank_account.find((b) => b._id.toString() === bankId);
  if (!bank) {
    return res.status(404).json({
      success: false,
      message: "Bank account not found",
    });
  }

  // Toggle the isDefault value
  bank.isDefault = !bank.isDefault;

  await user.save();

  res.status(200).json({
    success: true,
    message: `Bank account ${
      bank.isDefault ? "set as default" : "unset as default"
    } successfully!`,
    bank_account: user.bank_account,
  });
});
