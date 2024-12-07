import { asyncHandler } from "../../../utils/errorHandling.js";
import noonClient from "../../../utils/noon.js";
import axios from "axios";

export const initiateCardPayment = asyncHandler(async (req, res) => {
  const { order } = req.body;
  const response = await noonClient.post("/payment/v1/order", {
    apiOperation: "INITIATE",
    order: {
      amount: order.amount,
      currency: "SAR",
      name: order.name,
      channel: "WEB",
      category: "pay",
    },
    configuration: {
      paymentAction: "AUTHORIZE,SALE",
      returnUrl:
        "http://127.0.0.1:5500/src/modules/payment/controller/success.html",
      locale: "en",
    },
  });

  res.status(200).json({
    success: true,
    message: "Payment initiated successfully.",
    data: response.data,
  });
});

export const initiateApplePayPayment = asyncHandler(async (req, res) => {
  const { order } = req.body;
  const paymentData = {
    apiOperation: "INITIATE",
    order: {
      amount: order.amount,
      currency: "SAR",
      name: order.name,
      channel: "WEB",
      category: "pay",
    },
    configuration: {
      returnUrl: order.returnUrl,
      paymentAction: "AUTHORIZE",
      locale: "en",
    },
  };

  try {
    const response = await noonClient.post("/payment/v1/order", paymentData);
    if (
      response.data &&
      response.data.checkoutData &&
      response.data.checkoutData.postUrl
    ) {
      res.status(200).json({
        success: true,
        message: "Apple Pay payment initiated successfully.",
        checkoutUrl: response.data.checkoutData.postUrl,
      });
    } else {
      throw new Error(
        "Failed to initiate Apple Pay payment. No checkout URL received."
      );
    }
  } catch (error) {
    console.error("Error initiating payment:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment initiation failed.",
      error: error.message,
    });
  }
});
export const initiateGooglePayPayment = async (req, res) => {
  const { amount, name, returnUrl, reference } = req.body;
  const orderData = {
    apiOperation: "INITIATE",
    order: {
      amount,
      currency: "SAR",
      name,
      reference,
      category: "pay",
      channel: "WEB",
    },
    configuration: {
      PaymentAction: "AUTHORIZE,SALE",
      returnUrl,
    },
  };

  try {
    const response = await axios.post("/payment/v1/order", orderData);

    if (response.data.resultCode === "000") {
      const { checkoutData } = response.data;
      if (checkoutData && checkoutData.postUrl) {
        return res.status(200).json({
          message: "Redirect to Google Pay Checkout",
          checkoutUrl: checkoutData.postUrl,
        });
      } else {
        return res
          .status(500)
          .json({ error: "Checkout URL not provided by Noon Payments" });
      }
    } else {
      return res.status(500).json({
        error:
          response.data.resultDescription ||
          "An error occurred while processing the payment.",
      });
    }
  } catch (error) {
    console.error("Error initiating Google Pay payment:", error);
    return res
      .status(500)
      .json({ error: "Failed to initiate payment. Please try again later." });
  }
};

export const initiatePayPalPayment = asyncHandler(async (req, res, next) => {
  try {
    const { amount, orderName, reference, returnUrl } = req.body;

    const initiateRequestPayload = {
      apiOperation: "INITIATE",
      order: {
        amount: amount,
        currency: "SAR",
        name: orderName,
        reference: reference,
        category: "pay",
        channel: "WEB",
      },
      configuration: {
        paymentAction: "AUTHORIZE,SALE",
        returnUrl: returnUrl,
        locale: "en",
      },
    };
    const response = await axios.post("/payment/v1/order");

    const { resultCode, checkoutData } = response.data;

    if (resultCode === "000") {
      const checkoutUrl = checkoutData.postUrl; // Get the URL to redirect the user
      res.redirect(checkoutUrl); // Redirect the user to the Noon Payments checkout page
    } else {
      // If there was an error, respond with the error message
      return res
        .status(400)
        .json({ error: "Payment initiation failed", details: response.data });
    }
  } catch (error) {
    console.error("Error initiating PayPal payment:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing payment" });
  }
});
