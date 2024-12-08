import noonClient from "./noon.js";

const formatAmount = (amount) => {
  return Number(parseFloat(amount).toFixed(2));
};

const validateAmount = (amount) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error("Invalid amount value");
  }
  return numAmount;
};

export const initiateCardPaymentService = async (params) => {
  try {
    const validAmount = validateAmount(params.amount);
    const formattedAmount = formatAmount(validAmount);

    const response = await noonClient.post("/payment/v1/order", {
      apiOperation: "INITIATE",
      order: {
        amount: formattedAmount,
        currency: "SAR",
        name: "test",
        channel: "WEB",
        category: "pay",
      },
      configuration: {
        paymentAction: "AUTHORIZE,SALE",
        returnUrl: "https://estigmam.vercel.app/payment/success",
        locale: "en",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Noon API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const initiateApplePayPaymentService = async (order) => {
  const validAmount = validateAmount(order.amount);
  const formattedAmount = formatAmount(validAmount);

  const paymentData = {
    apiOperation: "INITIATE",
    order: {
      amount: formattedAmount,
      currency: "SAR",
      name: order.name,
      channel: "WEB",
      category: "pay",
    },
    configuration: {
      returnUrl: "https://estigmam.vercel.app/payment/success",
      paymentAction: "AUTHORIZE",
      locale: "en",
    },
  };

  const response = await noonClient.post("/payment/v1/order", paymentData);

  if (
    response.data &&
    response.data.checkoutData &&
    response.data.checkoutData.postUrl
  ) {
    return response.data.checkoutData.postUrl;
  }

  throw new Error(
    "Failed to initiate Apple Pay payment. No checkout URL received."
  );
};

export const initiateGooglePayPaymentService = async (order) => {
  const validAmount = validateAmount(order.amount);
  const formattedAmount = formatAmount(validAmount);

  const orderData = {
    apiOperation: "INITIATE",
    order: {
      amount: formattedAmount,
      currency: "SAR",
      name: order.name,
      reference: order.reference,
      category: "pay",
      channel: "WEB",
    },
    configuration: {
      PaymentAction: "AUTHORIZE,SALE",
      returnUrl: "https://estigmam.vercel.app/payment/success",
    },
  };

  const response = await noonClient.post("/payment/v1/order", orderData);

  if (
    response.data.resultCode === "000" &&
    response.data.checkoutData?.postUrl
  ) {
    return response.data.checkoutData.postUrl;
  }

  throw new Error(
    response.data.resultDescription ||
      "An error occurred while processing the payment."
  );
};

export const initiatePayPalPaymentService = async (order) => {
  const validAmount = validateAmount(order.amount);
  const formattedAmount = formatAmount(validAmount);

  const initiateRequestPayload = {
    apiOperation: "INITIATE",
    order: {
      amount: formattedAmount,
      currency: "SAR",
      name: order.orderName,
      reference: order.reference,
      category: "pay",
      channel: "WEB",
    },
    configuration: {
      paymentAction: "AUTHORIZE,SALE",
      returnUrl: "https://estigmam.vercel.app/payment/success",
      locale: "en",
    },
  };

  const response = await noonClient.post(
    "/payment/v1/order",
    initiateRequestPayload
  );

  if (
    response.data.resultCode === "000" &&
    response.data.checkoutData?.postUrl
  ) {
    return response.data.checkoutData.postUrl;
  }

  throw new Error(
    "Payment initiation failed. Details: " + JSON.stringify(response.data)
  );
};
