import creditCardType from "credit-card-type";
import creditCardModel from "../../../../DB/model/creditCard.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addCreditCard = asyncHandler(async (req, res, next) => {
  const { cardNumber, cardHolderName, cardExpirationDate, cardCvv } = req.body;
  if (!cardNumber || cardNumber.length < 6) {
    return res.status(400).send({ error: "Invalid card number" });
  }

  // Get the first 6 digits (BIN)
  const bin = cardNumber.slice(0, 6);
  // Get the card type
  const cardType = creditCardType(bin);
  // Check if the card type is supported
  if (!cardType.length) {
    return res.status(400).send({ error: "Card type not supported" });
  }

  const creditCard = new creditCardModel({
    cardNumber,
    cardHolderName,
    cardExpirationDate,
    cardCvv,
    cardType: cardType[0].niceType,
    user: req.user._id,
  });
  await creditCard.save();
  return res.status(200).send({ message: "credit card added successfully" });
});

export const getCreditCard = asyncHandler(async (req, res, next) => {
  const creditCard = await creditCardModel.find({
    user: req.user._id,
  });
  return res.status(200).send({ creditCard });
});

export const getCreditCardById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const creditCard = await creditCardModel.findById(id);
  if (!creditCard) {
    return res.status(404).send({ error: "credit card not found" });
  }
  if (req.user._id.toString() !== creditCard.user.toString()) {
    return res
      .status(403)
      .send({ error: "you are not allowed to view this credit card" });
  }
  return res.status(200).send({ creditCard });
});

export const updateCreditCard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { cardNumber, cardHolderName, cardExpirationDate, cardCvv } = req.body;
  const creditCard = await creditCardModel.findById(id);
  if (!creditCard) {
    return res.status(404).send({ error: "credit card not found" });
  }
  if (req.user._id.toString() !== creditCard.user.toString()) {
    return res
      .status(403)
      .send({ error: "you are not allowed to update this credit card" });
  }

  if (cardNumber) {
    creditCard.cardNumber = cardNumber;
    if (!cardNumber || cardNumber.length < 6) {
      return res.status(400).send({ error: "Invalid card number" });
    }

    // Get the first 6 digits (BIN)
    const bin = cardNumber.slice(0, 6);
    // Get the card type
    const cardType = creditCardType(bin);
    // Check if the card type is supported
    if (!cardType.length) {
      return res.status(400).send({ error: "Card type not supported" });
    }
    creditCard.cardType = cardType[0].niceType;
  }
  if (cardHolderName) {
    creditCard.cardHolderName = cardHolderName;
  }
  if (cardExpirationDate) {
    creditCard.cardExpirationDate = cardExpirationDate;
  }
  if (cardCvv) {
    creditCard.cardCvv = cardCvv;
  }
  await creditCard.save();
  return res.status(200).send({ message: "credit card updated successfully" });
});

export const deleteCreditCard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const creditCard = await creditCardModel.findById(id);
  if (!creditCard) {
    return res.status(404).send({ error: "credit card not found" });
  }
  if (req.user._id.toString() !== creditCard.user.toString()) {
    return res
      .status(403)
      .send({ error: "you are not allowed to delete this credit card" });
  }
  await creditCard.remove();
  return res.status(200).send({ message: "credit card deleted successfully" });
});
