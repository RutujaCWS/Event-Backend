import express from "express";
import { protect, authorize, checkPermission } from "../../middleware/authMiddleware.js";
import {
  getAssignedEnquiries,
  getAssignedCount,
  updateEnquiryStatus,
  getAssignedStatusCounts,
} from "../../controller/staff/staffController.js";

const router = express.Router();

// Apply auth and role middleware to all routes
router.use(protect);
router.use(authorize("staff"));

router.get("/enquiries/count", checkPermission("enquiries"), getAssignedCount);
router.get("/enquiries/assigned", checkPermission("enquiries"), getAssignedEnquiries);
router.put("/enquiries/:id/status", checkPermission("statusUpdates"), updateEnquiryStatus);
router.get("/enquiries/status-counts", checkPermission("enquiries"), getAssignedStatusCounts);



export default router;