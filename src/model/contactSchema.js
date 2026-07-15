import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    workingHours: {
      type: String,
      required: true,
    },

    mapLink: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Contact", contactSchema);