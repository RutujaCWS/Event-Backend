import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      unique: true,
    },

    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CMS", cmsSchema);