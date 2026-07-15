import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {

    business: {
      companyName: {
        type: String,
        default: "",
        trim: true,
      },

      companyEmail: {
        type: String,
        default: "",
        trim: true,
      },

      companyPhone: {
        type: String,
        default: "",
        trim: true,
      },

      website: {
        type: String,
        default: "",
        trim: true,
      },

      logo: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      language: {
        type: String,
        default: "English",
      },

      currency: {
        type: String,
        default: "INR",
      },

      darkMode: {
        type: Boolean,
        default: false,
      },
    },

    // ========= GST Settings ==========

    gst: {
      gstNumber: { type: String, default: "" },
      legalBusinessName: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      hsnCode: { type: String, default: "" },
      registrationState: { type: String, default: "" },
      accountantEmail: { type: String, default: "" },
      defaultRate: { type: Number, default: 18 },
      cgstRate: { type: Number, default: 9 },
      sgstRate: { type: Number, default: 9 },
      supplyType: { type: String, default: "Intra-state (CGST + SGST)" },
      filingFrequency: { type: String, default: "Monthly" }
    },

    // ========== End GST Settings ==========

    taxDiscount: {
      cgstRate: { type: Number, default: 9 },
      sgstRate: { type: Number, default: 9 },
      defaultDiscountValue: { type: Number, default: 0 }
    },

    // ========== Payment Settings ==========
    payment: {
      gatewayAccounts: {
        type: [{
          id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
          type: {
            type: String,
            enum: ['RAZORPAY', 'UPI', 'STRIPE'],
            required: true
          },
          name: { type: String, required: true },

          // Razorpay
          keyId: { type: String, default: '' },
          keySecret: { type: String, default: '' },

          // UPI
          upiId: { type: String, default: '' },
          upiName: { type: String, default: '' },

          // Stripe
          stripePublishableKey: { type: String, default: '' },
          stripeSecretKey: { type: String, default: '' },

          isPrimary: { type: Boolean, default: false },
          isActive: { type: Boolean, default: false },
          isConfigured: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now }
        }],
        default: []
      },

      // ===== PREFERENCES =====
      allowOfflinePayments: { type: Boolean, default: true },
      allowPartialPayments: { type: Boolean, default: true },
      advancePercentage: { type: Number, default: 50 },
      autoSendPaymentLink: { type: Boolean, default: true },
      autoApproveRefund: { type: Boolean, default: false },
      refundLimit: { type: Number, default: 1000 },
    },

    // ========== SMS Settings ==========
    smsSenderNumber: {
      type: String,
      default: "",
      trim: true,
    },
    smsEnabled: {
      type: Boolean,
      default: true,
    },
    // ========== End SMS Settings ==========

    // ========== Default Staff Permissions ==========
    defaultStaffPermissions: {
      enquiries: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      schedule: { type: Boolean, default: true },
      statusUpdates: { type: Boolean, default: true },
      viewPayments: { type: Boolean, default: true },
      recordPayments: { type: Boolean, default: false },
    },
    // ========== End Default Staff Permissions ==========
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AdminSettings", adminSettingsSchema);