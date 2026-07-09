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
    ref: "User",
  },
],

    totalAmount: {
      type: Number,
      default: 0,
    },

    advanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
   
    balanceAmount: {
      type: Number,
      required: true,
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

    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING_PAYMENT",
    },

    
    paymentStatus: {
      type: String,
      enum: ['ADVANCE_PENDING', 'ADVANCE_COMPLETED', 'PARTIAL', 'FULL_PAID', 'REFUNDED'],
      default: 'ADVANCE_PENDING'
    },

    paymentMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'NONE'],
      default: 'NONE'
    },

    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'NET_BANKING', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'RAZORPAY', 'NONE'],
      default: 'NONE'
    },
    
    razorpayOrderId: {
      type: String,
      default: ''
    },
    
    razorpayPaymentId: {
      type: String,
      default: ''
    },
    
    razorpaySignature: {
      type: String,
      default: ''
    },

    transactionId: {
      type: String,
      default: ''
    },

    advancePaymentDate: {
      type: Date,
    },
    
    balancePaymentDate: {
      type: Date,
    },
    
    fullPaymentDate: {
      type: Date,
    },

    confirmationDate: {
      type: Date,
    },
    
    balanceDueDate: {
      type: Date,
    },

    refundMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'NONE'],
      default: 'NONE'
    },

    refundAmount: {
      type: Number,
      default: 0,
    },
    
    refundDate: {
      type: Date,
    },
    
    refundReason: {
      type: String,
    },

    specialInstructions: {
      type: String,
      default: "",
    },

   

    cgstRate: { type: Number, default: 9 },
  sgstRate: { type: Number, default: 9 },
  gstRateApplied: { type: Number, default: 18 },
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
  totalGST: { type: Number, default: 0 },

  paymentHistory: [
    {
      type: {
        type: String,
        enum: ['ADVANCE', 'BALANCE', 'FULL', 'REFUND'],
      },
      amount: Number,
      mode: {
        type: String,
        enum: ['ONLINE', 'OFFLINE'],
      },
      method: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      transactionId: String,
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      },
      note: String,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    }
  ]
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ razorpayOrderId: 1 });





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

bookingSchema.methods.isFullyPaid = function() {
  return (this.advancePaid + this.balancePaid) >= this.totalAmount;
};

bookingSchema.methods.isAdvancePaid = function() {
  return this.advancePaid >= this.advanceAmount;
};

bookingSchema.methods.getRemainingBalance = function() {
  return this.balanceAmount - this.balancePaid;
};

bookingSchema.methods.getTotalPaid = function() {
  return this.advancePaid + this.balancePaid;
};

bookingSchema.methods.getPaymentCompletion = function() {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.getTotalPaid() / this.totalAmount) * 100);
};

export default mongoose.model("Booking", bookingSchema);