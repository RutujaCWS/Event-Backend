import express from "express";

import {
  getContact,
  updateContact,
} from "../../controller/admin/contactController.js";

const router = express.Router();

router.get("/", getContact);

router.put("/", updateContact);

export default router;