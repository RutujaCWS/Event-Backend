import express from "express";
import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,

  sendQuotation,

  approveQuotation,
  rejectQuotation,

  reviseQuotation,

  getQuotationByToken,

  previewQuotation,
  getCustomerQuotations ,
} from "../../controller/admin/quotationController.js";

import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleBasedMiddleware.js"

const router = express.Router();

// Admin
router.post("/", protect,authorize("admin"), createQuotation);

router.get("/", protect, getAllQuotations);

router.get("/customer/quotations", protect, getCustomerQuotations);

router.get("/:id", protect,getQuotationById);

router.put("/:id", protect,updateQuotation);

router.delete("/:id", protect, deleteQuotation);

// Preview
router.get("/:id/preview", protect, previewQuotation);

// Send quotation
router.put("/send/:id",protect, sendQuotation);

// Revision
router.post("/:id/revise", protect, reviseQuotation);

// Customer Review
router.get("/review/:token", getQuotationByToken);

router.post("/:id/approve", protect, approveQuotation);

router.post("/:id/reject", protect, rejectQuotation);

export default router;