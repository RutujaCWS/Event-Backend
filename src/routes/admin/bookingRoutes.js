import express from "express";
import {
  getAllBookings,
  getBookingById,
  getCustomerBookings,
  cancelBooking,
  getBookingStats,
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

export default router;