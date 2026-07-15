import Razorpay from "razorpay";
import crypto from "crypto";
import AdminSettings from "../model/adminSettingsSchema.js";

// Get Primary Razorpay Gateway
const getRazorpay = async () => {
  const settings = await AdminSettings.findOne();

  if (!settings?.payment?.gatewayAccounts?.length) {
    throw new Error("No payment gateway configured.");
  }

  const razorpayAccount = settings.payment.gatewayAccounts.find(
    (gateway) =>
      gateway.type === "RAZORPAY" &&
      gateway.isActive === true &&
      gateway.isPrimary === true &&
      gateway.isConfigured === true
  );

  if (!razorpayAccount) {
    throw new Error("Primary Razorpay gateway not configured.");
  }

  if (!razorpayAccount.keyId || !razorpayAccount.keySecret) {
    throw new Error("Razorpay credentials are missing.");
  }

  return {
    razorpay: new Razorpay({
      key_id: razorpayAccount.keyId,
      key_secret: razorpayAccount.keySecret,
    }),
    keyId: razorpayAccount.keyId,
    keySecret: razorpayAccount.keySecret,
  };
};

// Create Razorpay Order
export const createRazorpayOrder = async (
  amount,
  currency = "INR",
  receipt
) => {
  try {
    const { razorpay } = await getRazorpay();

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency,
      receipt,
      payment_capture: 1,
    });

    return order;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw error;
  }
};

// Verify Payment
export const verifyRazorpayPayment = async (
  orderId,
  paymentId,
  signature
) => {
  try {
    const { keySecret } = await getRazorpay();

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return false;
  }
};

// Fetch Payment Details
export const getRazorpayPaymentDetails = async (paymentId) => {
  try {
    const { razorpay } = await getRazorpay();

    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    console.error("Razorpay payment fetch error:", error);
    throw error;
  }
};

// Refund Payment
export const refundRazorpayPayment = async (
  paymentId,
  amount,
  notes = {}
) => {
  try {
    const { razorpay } = await getRazorpay();

    return await razorpay.payments.refund(paymentId, {
      amount: amount * 100,
      notes,
    });
  } catch (error) {
    console.error("Razorpay refund error:", error);
    throw error;
  }
};

// Get All Payments
export const getAllPayments = async (params = {}) => {
  try {
    const { razorpay } = await getRazorpay();

    return await razorpay.payments.all(params);
  } catch (error) {
    console.error("Razorpay get payments error:", error);
    throw error;
  }
};

// Get Order Details
export const getOrderDetails = async (orderId) => {
  try {
    const { razorpay } = await getRazorpay();

    return await razorpay.orders.fetch(orderId);
  } catch (error) {
    console.error("Razorpay get order error:", error);
    throw error;
  }
};