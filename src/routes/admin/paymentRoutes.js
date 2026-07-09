import express from "express";
import {
  createOnlinePaymentOrder,  
  verifyPayment,  
  processOfflinePayment, 
  processRazorpayRefund,
  processOfflineRefund,
  getPaymentSummary,
  getBookingPaymentSummary
} from "../../controller/admin/paymentController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleBasedMiddleware.js";

const router = express.Router();

router.post("/online/:bookingId", protect, createOnlinePaymentOrder);

router.post("/offline/:bookingId", protect, authorize("admin"), processOfflinePayment);

router.post(
  "/verify/payment",
  verifyPayment  
);

// Refund routes
router.post(
  "/:bookingId/refund",
  protect,
  authorize("admin"),
  processRazorpayRefund
);

router.post(
  "/:bookingId/offline/refund",
  protect,
  authorize("admin"),
  processOfflineRefund
);

// Payment summary
router.get(
  "/:bookingId/summary",
  protect,
  getPaymentSummary
);

// Admin - Get all bookings payment summary
router.get(
  "/bookings/summary",
  protect,
  authorize("admin"),
  getBookingPaymentSummary
);

export default router;