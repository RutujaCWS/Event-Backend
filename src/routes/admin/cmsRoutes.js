import express from "express";
import upload from "../../middleware/upload.js";
import {
  getCmsSection,
  updateCmsSection,
  updateLogo,
} from "../../controller/admin/cmsController.js";

const router = express.Router();
router.put(
  "/logo/upload",
  upload.single("logo"),
  updateLogo
);
router.get("/:section", getCmsSection);
router.put(
  "/:section",
  upload.fields([
    // Home
    { name: "heroImage1", maxCount: 1 },
    { name: "heroImage2", maxCount: 1 },
    { name: "heroImage3", maxCount: 1 },

    // Journey
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },

    { name: "problemImage", maxCount: 1 },
  { name: "solutionImage", maxCount: 1 },
   { name: "leftImage", maxCount: 1 },
  { name: "rightImage", maxCount: 1 },
  ]),
  updateCmsSection
);


export default router;