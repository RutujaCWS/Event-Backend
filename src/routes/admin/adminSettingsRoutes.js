import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import upload from "../../middleware/upload.js";
import {
  getSmsSettings,
  updateSmsSettings,
  getTaxDiscountSettings,
  updateTaxDiscountSettings,
  getDefaultStaffPermissions,
  updateDefaultStaffPermissions,
  getPaymentSettings,
  updatePaymentSettings,
  getBusinessSettings,
  updateBusinessSettings,
} from "../../controller/admin/adminSettingsController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// SMS Settings
router.get("/sms-settings", getSmsSettings);
router.put("/sms-settings", updateSmsSettings);

// Tax & Discount settings
router.get("/settings/tax-discount", getTaxDiscountSettings);
router.put("/settings/tax-discount", updateTaxDiscountSettings);

// Default Staff Permission Settings
router.get("/settings/default-permissions", getDefaultStaffPermissions);
router.put("/settings/default-permissions", updateDefaultStaffPermissions);
router.get("/payment-settings", getPaymentSettings);
router.put("/payment-settings", updatePaymentSettings);

router.get(
  "/business-settings",
  getBusinessSettings
);

router.put(
  "/business-settings",
  upload.single("logo"),
  updateBusinessSettings
);

export default router;