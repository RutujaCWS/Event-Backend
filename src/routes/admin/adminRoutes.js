import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleActiveStatus,
  getUserStats,
} from "../../controller/admin/userManagementController.js";
import {
  getAllLeads, updateLead, getTotalEnquiries, getRecentEnquiries, getStaffListForAssignment,
  assignEnquiryToStaff,
} from "../../controller/admin/leadController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

// Staff management

router.get("/users/stats", getUserStats);
router.get("/users", getStaffList);
router.get("/users/:id", getStaffById);
router.post("/users/create", createStaff);
router.put("/users/:id", updateStaff);
router.delete("/users/:id", deleteStaff);
router.patch("/users/:id/toggle-active", toggleActiveStatus);

// Lead/Enquiry management (admin)
router.get("/enquiries", getAllLeads);
router.put("/enquiries/:id", updateLead);

// Dashboard endpoints (new)
router.get("/enquiries/total", getTotalEnquiries);
router.get("/enquiries/recent", getRecentEnquiries);

// Assignment & staff list for dropdown
router.get("/staff-list", getStaffListForAssignment);
router.put("/enquiries/:id/assign", assignEnquiryToStaff);

export default router;