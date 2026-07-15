import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";

import {
  getNotificationSettings,
  updateNotificationSettings,
  updateTemplate,
  resetTemplates,
} from "../../controller/admin/notificationTemplateController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getNotificationSettings);

router.put("/", updateNotificationSettings);

router.put("/template/:template", updateTemplate);

router.post("/reset", resetTemplates);

export default router;