import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ENQUIRY',
        'QUOTATION_SENT',
        'QUOTATION_APPROVED',
        'QUOTATION_REJECTED',
        'BOOKING_CONFIRMED',
        'BOOKING_UPDATED',
        'BOOKING_CANCELLED',
        'PAYMENT_RECEIVED',
        'LEAD_ASSIGNED',
        'FOLLOWUP_REMINDER',
        'SYSTEM_ALERT',
        'ENQUIRY_STATUS_UPDATED',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    enquiryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
    },
    quotationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
    },
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    paymentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    staffRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);