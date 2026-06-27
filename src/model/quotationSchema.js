import mongoose from "mongoose";

const quotationItemSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    cgstPercent: {
      type: Number,
      default: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
    },

    sgstPercent: {
      type: Number,
      default: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
    },

    taxableAmount: {
      type: Number,
      default: 0,
    },

    lineTotal: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const quotationSchema = new mongoose.Schema(
  {
    // =========================
    // References
    // =========================

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // =========================
    // Quotation Identity
    // =========================

    quotationNumber: {
      type: String,
      required: true,
      unique: true,
    },

    version: {
      type: Number,
      default: 1,
    },

    parentQuotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
    },

    // =========================
    // Event Information
    // =========================

    eventType: {
      type: String,
      required: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    // =========================
    // Line Items
    // =========================

    services: [quotationItemSchema],

    // =========================
    // Summary
    // =========================

    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },

    totalDiscount: {
      type: Number,
      default: 0,
    },

    totalCGST: {
      type: Number,
      default: 0,
    },

    totalSGST: {
      type: Number,
      default: 0,
    },

    totalGST: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    // =========================
    // Status
    // =========================

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SENT",
        "VIEWED",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
        "SUPERSEDED",
      ],
      default: "DRAFT",
    },

    // =========================
    // Approval Flow
    // =========================

    approvalToken: {
      type: String,
      default: null,
    },

    viewedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =========================
    // Rejection Flow
    // =========================

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    // =========================
    // Validity
    // =========================

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
      required: true,
    },

    // =========================
    // Communication
    // =========================

    emailSent: {
      type: Boolean,
      default: false,
    },

    emailSentAt: {
      type: Date,
      default: null,
    },

    whatsappSent: {
      type: Boolean,
      default: false,
    },

    whatsappSentAt: {
      type: Date,
      default: null,
    },

    // =========================
    // Booking Conversion
    // =========================

    bookingCreated: {
      type: Boolean,
      default: false,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    // =========================
    // Notes
    // =========================

    notes: {
      type: String,
      default: "",
    },

    termsAndConditions: {
      type: String,
      default: "",
    },
   
  },
  {
    timestamps: true,
  }
);

// Prevent multiple active quotations for same lead
quotationSchema.index(
  {
    leadId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["DRAFT", "SENT", "VIEWED"]
      }
    }
  }
);

export default mongoose.model(
  "Quotation",
  quotationSchema
);