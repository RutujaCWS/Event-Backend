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
  getGateways,
  saveGateway,
  configureGateway,
  toggleGateway,
  setPrimaryGateway,
  testRazorpayConnection,
  getGSTSettings,
  updateGSTSettings,
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

// GST Settings
router.get("/settings/gst", getGSTSettings);
router.put("/settings/gst", updateGSTSettings);

// Default Staff Permission Settings
router.get("/settings/default-permissions", getDefaultStaffPermissions);
router.put("/settings/default-permissions", updateDefaultStaffPermissions);


router.get("/payment-settings", getPaymentSettings);
router.put("/payment-settings", updatePaymentSettings);
// Gateway Management
router.get("/gateways", protect, authorize("admin"), getGateways);
router.post("/gateway", protect, authorize("admin"), saveGateway);
router.put("/gateway/:gatewayKey/configure", protect, authorize("admin"), configureGateway);
router.put("/gateway/:gatewayKey/toggle", protect, authorize("admin"), toggleGateway);
router.post("/gateway/primary", protect, authorize("admin"), setPrimaryGateway);
router.post("/gateway/test-razorpay", protect, authorize("admin"), testRazorpayConnection);

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