import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import {
  getTaxDiscountSettings,
  updateTaxDiscountSettings
} from "../../controller/admin/adminSettingsController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

// Tax & Discount settings
router.get("/settings/tax-discount", getTaxDiscountSettings);
router.put("/settings/tax-discount", updateTaxDiscountSettings);

export default router;