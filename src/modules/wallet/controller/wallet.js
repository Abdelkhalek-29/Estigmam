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

// Owner App
export const bankAccount = asyncHandler(async (req, res, next) => {
  const userId = req.owner?._id || req.tripLeader?._id;
  const { account_owner, bank_name, branch, IBAN, local_num } = req.body;

  const userSchema = req.owner ? OwnerModel : tripLeaderModel;

  const user = await userSchema.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Push the new bank account into the bank_account array
  user.bank_account.push({
    account_owner,
    bank_name,
    branch,
    IBAN,
    local_num,
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

    // Find the user
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update wallet details
    user.wallet.balance += validAmount;
    user.wallet.total_Deposit += validAmount;
    user.wallet.lastUpdated = Date.now();
    await user.save();

    // Create a transaction record
    await transactionModel.create({
      actorId: userId,
      actorType: req.owner ? "Owner" : "TripLeader",
      amount: validAmount,
      type: "Wallet",
      method,
      reason: "Wallet recharge",
    });

    // Return the checkout URL
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

  const userBalance = await userSchema
    .findById(userId)
    .select("wallet bank_account");

  const transactions = await transactionModel
    .find(filter)
    .sort(sortOptions)
    .select("-actorType -actorId");
  res.status(200).json({
    success: true,
    data: { userBalance, transactions },
  });
});

export const addBank = asyncHandler(async (req, res, next) => {
  const { name_ar, name_en } = req.body;

  const bank = await bankModel.create({ name_ar, name_en });
  res.status(200).json({
    success: true,
    message: "Bank addded successfully !",
  });
});

export const getBanks = asyncHandler(async (req, res, next) => {
  const acceptLanguage = req.headers["accept-language"] || "en";
  const languageKey = acceptLanguage.toLowerCase().startsWith("ar")
    ? "name_ar"
    : "name_en";

  const banks = await bankModel.find().select(`${languageKey}`);

  const formattedBanks = banks.map((bank) => ({
    name: bank[languageKey],
  }));

  res.status(200).json({
    success: true,
    data: formattedBanks,
  });
});
