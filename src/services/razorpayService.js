import Razorpay from 'razorpay';
import crypto from 'crypto';
import AdminSettings from "../model/adminSettingsSchema.js";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

const getRazorpay = async () => {
  const settings = await AdminSettings.findOne();

  if (
    !settings?.payment?.razorpayKeyId ||
    !settings?.payment?.razorpayKeySecret
  ) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: settings.payment.razorpayKeyId,
    key_secret: settings.payment.razorpayKeySecret,
  });
};


export const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
  try {
    const razorpay = await getRazorpay(); 

    const options = {
      amount: amount * 100, 
      currency: currency,
      receipt: receipt,
      payment_capture: 1, 
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
};

export const verifyRazorpayPayment = async (orderId, paymentId, signature) => {
  try {
    const settings = await AdminSettings.findOne();

if (!settings?.payment?.razorpayKeySecret) {
  throw new Error("Razorpay credentials are not configured.");
}

const secret = settings.payment.razorpayKeySecret;
    
    const body = orderId + '|' + paymentId;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return false;
  }
};

export const getRazorpayPaymentDetails = async (paymentId) => {
  try {
    const razorpay = await getRazorpay();

    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay payment fetch error:', error);
    throw error;
  }
};

export const refundRazorpayPayment = async (paymentId, amount, notes = {}) => {
  try {
    const razorpay = await getRazorpay();

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, 
      notes: notes,
    });
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw error;
  }
};

export const getAllPayments = async (params = {}) => {
  try {
    const razorpay = await getRazorpay();
    const payments = await razorpay.payments.all(params);
    return payments;
  } catch (error) {
    console.error('Razorpay get payments error:', error);
    throw error;
  }
};

export const getOrderDetails = async (orderId) => {
  try {
    const razorpay = await getRazorpay();
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Razorpay get order error:', error);
    throw error;
  }
};



