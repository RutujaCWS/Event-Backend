import express from "express";
import {
  getAllBookings,
  getBookingById,
  getCustomerBookings,
  cancelBooking,
  getBookingStats,
  confirmAdvancePayment,
  confirmBalancePayment,
  getPaymentSummary
} from "../../controller/admin/bookingController.js";

import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Admin
router.get("/", getAllBookings);

// Customer
router.get(
  "/customer/bookings",
  protect,
  getCustomerBookings
);

router.get("/stats", getBookingStats);

router.get("/:id", getBookingById);





router.put(
  "/:id/cancel",
  cancelBooking
);

// Payment routes
router.post("/:id/confirm-advance", confirmAdvancePayment);
router.post("/:id/confirm-balance", confirmBalancePayment);
router.get("/:id/payment-summary", getPaymentSummary);

export default router;