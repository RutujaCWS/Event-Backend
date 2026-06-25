// model/otpModel.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true
    },
    purpose: {
      type: String, enum: ["mobile_verification",
        "email_verification",
        "login",
        "password_reset"], required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
  },
  { timestamps: true }
);

export default mongoose.model("OTP", otpSchema);