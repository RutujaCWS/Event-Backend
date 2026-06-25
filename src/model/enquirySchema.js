import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    fullName: {
      type: String,
      trim: true,
    },

    mobileNumber: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    guestCount: {
      type: Number,
      required: true,
      min: [1, "Guest count must be at least 1"]
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    budget: {
      type: Number,
      default: 0,
      min: [0, "Budget cannot be negative"]
    },

    description: {
      type: String,
      trim: true,
    },

    source: {
      type: String,
      enum: ["Website", "Customer Portal"],
      default: "Website",
    },

    status: {
      type: String,
      enum: [
        "Pending",        // old
        "Reviewed",       // old
        "Quoted",         // old
        "Confirmed",      // old
        "Cancelled",      // old
        "New",            // new workflow
        "Contacted",      // new
        "Quotation Sent", // new
        "Converted",      // new
        "Closed",         // new
      ],
      default: "New",
    },
    // ----- ASSIGNMENT FIELDS -----
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: {
      type: Date,
    },
    followUpNotes: [
      {
        note: String,
        createdAt: Date,
        createdBy: String,
      },
    ],

    serviceRequired: {
      type: [String],
      default: [],
    }
  },
  {
    timestamps: true,
  }
);

enquirySchema.pre("save", async function() {
  if (this.location && !this.city) {
    const parts = this.location.split(",");
    this.city = parts[0].trim();
  }
});

export default mongoose.model("Enquiry", enquirySchema);