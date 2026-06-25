import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "customer", "staff"],
      default: "customer",
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },
    
    isMobileVerified: { 
      type: Boolean,
      default: false 
    },
    
    isEmailVerified: { 
      type: Boolean,
      default: false 
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    lastLogin: {
      type: Date,
    },

    // ========== NEW FIELDS FOR STAFF (optional for others) ==========
    
    employeeId: {
      type: String,
      unique: true,
      sparse: true,          // allows null/undefined for non-staff
      trim: true,
    },

    dateOfJoining: {
      type: Date,
      default: null,
    },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
      // Inside the userSchema definition, add:
    assignedCity: { type: String, default: "" },
    },

    
    emergencyContact: {
      type: String,
      default: "",
    },

    permissions: {
      enquiries: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      schedule: { type: Boolean, default: true },
      statusUpdates: { type: Boolean, default: true },
      viewPayments: { type: Boolean, default: true },
      recordPayments: { type: Boolean, default: false },
    },

    // ========== RATE LIMITING FIELDS ==========
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);