import moment from "moment";
import transactionsModel from "../../../../DB/model/transactions.model.js";
import userModel from "../../../../DB/model/User.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import randomstring from "randomstring";

export const Deposit = asyncHandler(async (req, res, next) => {
  const { price, type } = req.body;
  const { _id } = req.user;
  const number = randomstring.generate({
    length: 7,
    charset: "numeric",
  });
  const transaction = await transactionsModel.create({
    userId: _id,
    price,
    nameTransaction: "ايداع",
    status: "Deposit",
    transactionId: number,

    type,
  });
  transaction.date = moment(transaction.createdAt).format("MM/DD/YYYY");
  await transaction.save();
  const userWallet = await userModel.findById(_id);
  userWallet.wallet.balance =+userWallet.wallet.balance + +price;
  userWallet.wallet.TotalDeposit=+userWallet.wallet.TotalDeposit + +price;

  await userWallet.save();

  return res.status(201).json({
    success: true,
    status: 201,
    message: "تم الايداع",
    data: transaction,
  });
});

export const transactionHistory = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const transactions = await transactionsModel
    .find({ userId: _id })
    .select("-__v");
  if (!transactions) {
    return next(new Error("Transactions Not Found!", { cause: 404 }));
  }
  return res.status(200).json({
    success: true,
    status: 200,
    message: "All Transactions",
    data: transactions,
  });
});

export const deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await transactionsModel.findById(
    req.params.transactionId
  );
  if (!transaction) {
    return next(new Error("transactionId not found", { cause: 404 }));
  }
  if (req.user._id.toString() !== transaction.userId.toString()) {
    return next(new Error("You not authorized!"));
  }

  await transaction.remove();
  return res.status(200).json({
    success: true,
    status: 200,
    message: "Transaction Deleted",
  });
});

export const getWallet = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const userWallet = await userModel.findById(_id).select("wallet");
    if (!userWallet) {
        return next(new Error("Wallet Not Found!", { cause: 404 }));
    }
    return res.status(200).json({
        success: true,
        status: 200,
        message: "User Wallet",
        data: userWallet.wallet,
    });
});
