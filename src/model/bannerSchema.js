import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    subtitle: {
      type: String,
      default: "",
    },

    ctaLabel: {
      type: String,
      default: "",
    },

    ctaLink: {
      type: String,
      default: "",
    },

    bannerImage: {
      type: String,
      default: "",
    },

    slot: {
      type: String,
      enum: ["Main Hero", "Secondary", "Third"],
      default: "Main Hero",
    },

    status: {
      type: String,
      enum: ["Live", "Draft"],
      default: "Draft",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Banner", bannerSchema);