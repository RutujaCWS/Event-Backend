import mongoose from "mongoose";


const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      type: String,
      required: true,
      default: "bi-heart-fill",
    },

    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Draft",
    },

    seoScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Service", serviceSchema);