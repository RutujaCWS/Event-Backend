import express from "express";
import {
  getAllInvoices,
  getInvoiceByBooking,
  getCustomerInvoices,
  generateInvoice
} from "../../controller/admin/invoiceController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleBasedMiddleware.js";

const router = express.Router();

// Admin routes
router.get("/", protect, authorize("admin"), getAllInvoices);
router.post("/generate/:bookingId", protect, authorize("admin"), generateInvoice);

// Customer routes
router.get("/customer", protect, getCustomerInvoices);
router.get("/booking/:bookingId", protect, getInvoiceByBooking);

export default router;