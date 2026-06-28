import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },

    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
    },

    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    eventType: {
      type: String,
      required: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    venue: {
      type: String,
      default: "",
    },

    assignedStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],

    totalAmount: {
      type: Number,
      default: 0,
    },

    advanceAmount: {
      type: Number,
      default: 0,
    },

    balanceAmount: {
      type: Number,
      default: 0,
    },

    advancePaid: {
      type: Number,
      default: 0,
    },
    balancePaid: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['ADVANCE_PENDING', 'ADVANCE_COMPLETED', 'FULL_PAID', 'PARTIAL'],
      default: 'ADVANCE_PENDING'
    },
    confirmationDate: {
      type: Date,
    },
    balanceDueDate: {
      type: Date,
    },

    specialInstructions: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING_PAYMENT",
    },
    cgstRate: { type: Number, default: 9 },
sgstRate: { type: Number, default: 9 },
gstRateApplied: { type: Number, default: 18 },
totalCGST: { type: Number, default: 0 },
totalSGST: { type: Number, default: 0 },
totalGST: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({
  bookingId: 1,
});



// ========== CASCADE DELETE NOTIFICATIONS ==========
bookingSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await mongoose.model('Notification').deleteMany({ bookingRef: doc._id });
  }
});

bookingSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await mongoose.model('Notification').deleteMany({ bookingRef: this._id });
});
// ========== END CASCADE DELETE ==========

export default mongoose.model(
  "Booking",
  bookingSchema
);