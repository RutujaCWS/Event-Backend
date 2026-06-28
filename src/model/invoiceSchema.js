import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Enquiry" },
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    balancePaid: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    status: { type: String, enum: ["PENDING", "PAID", "CANCELLED"], default: "PAID" },
    generatedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ bookingId: 1 });

export default mongoose.model("Invoice", invoiceSchema);