import express from "express";

import {
  createGalleryEvent,
  getGalleryEvents,
  getGalleryEventById,
  updateGalleryEvent,
  deleteGalleryEvent,
} from "../../controller/admin/galleryController.js";

import upload from "../../middleware/upload.js";

const router = express.Router();
router.post(
  "/",
  upload.single("image"),
  createGalleryEvent
);
router.post("/", createGalleryEvent);

router.get("/", getGalleryEvents);

router.get("/:id", getGalleryEventById);

router.put(
  "/:id",
  upload.single("image"),
  updateGalleryEvent
);

router.delete("/:id", deleteGalleryEvent);

export default router;