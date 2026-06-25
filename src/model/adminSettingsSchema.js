import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    taxDiscount: {
      cgstRate: { type: Number, default: 9 },
      sgstRate: { type: Number, default: 9 },
      defaultDiscountValue: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("AdminSettings", adminSettingsSchema);