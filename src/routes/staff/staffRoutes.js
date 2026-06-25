import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
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

router.get("/enquiries/count", getAssignedCount);       
router.get("/enquiries/assigned", getAssignedEnquiries);  

router.put("/enquiries/:id/status", updateEnquiryStatus); 
router.get("/enquiries/status-counts", getAssignedStatusCounts);


export default router;