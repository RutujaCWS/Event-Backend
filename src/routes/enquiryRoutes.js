import express from "express";
import {
  createEnquiry,
  getAllEnquiries,
  deleteEnquiry,
  updateEnquiry,
  createPublicEnquiry,
} from "../controller/enquiryController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createEnquiry);
router.get("/", protect, getAllEnquiries);
router.put("/:id", protect, updateEnquiry);
router.delete("/:id", protect, deleteEnquiry);
router.post("/public", createPublicEnquiry);
export default router;