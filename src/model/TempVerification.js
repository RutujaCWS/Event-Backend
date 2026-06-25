import mongoose from "mongoose";

const tempVerificationSchema = new mongoose.Schema({
  identifier: { type: String, required: true, index: true },
  type: { type: String, enum: ["mobile", "email"], required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

export default mongoose.model("TempVerification", tempVerificationSchema);