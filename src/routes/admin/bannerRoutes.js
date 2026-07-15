import express from "express";
import upload from "../../middleware/upload.js";

import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from "../../controller/admin/bannerController.js";

const router = express.Router();

// Create Banner
router.post(
  "/",
  upload.single("bannerImage"),
  createBanner
);

// Get All Banners
router.get("/", getAllBanners);

// Get Single Banner
router.get("/:id", getBannerById);

// Update Banner
router.put(
  "/:id",
  upload.single("bannerImage"),
  updateBanner
);

// Delete Banner
router.delete("/:id", deleteBanner);

// Toggle Active Status
router.patch(
  "/status/:id",
  toggleBannerStatus
);

export default router;