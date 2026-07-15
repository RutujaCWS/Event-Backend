import express from "express";

import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from "../../controller/admin/serviceController.js";

const router = express.Router();

// Create Service
router.post("/", createService);

// Get All Services
router.get("/", getServices);

// Get Service By Id
router.get("/:id", getServiceById);

// Update Service
router.put("/:id", updateService);

// Delete Service
router.delete("/:id", deleteService);

export default router;