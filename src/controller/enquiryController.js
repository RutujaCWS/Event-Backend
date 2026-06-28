import Enquiry from "../model/enquirySchema.js";
import mongoose from "mongoose";
import User from "../model/userSchema.js";

// ========== nutan changes -26-06-2026 ==========
import { getAdminUserIds, createNotificationsForUsers } from "../services/notificationService.js";
// ========== end nutan changes ==========

// ==================== CREATE ENQUIRY (Logged-in) ====================
export const createEnquiry = async (req, res) => {
  try {
    const {
      eventType,
      eventDate,
      guestCount,
      location,
      budget,
      description,
      serviceRequired
    } = req.body;

    if (!eventType || !eventDate || !guestCount || !location) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be at least 1",
      });
    }

    const enquiry = await Enquiry.create({
      customerId: req.user._id,
      eventType,
      eventDate,
      guestCount,
      location,
      budget,
      description,
      serviceRequired,
      source: "Customer Portal",
    });

    // ========== nutan changes -26-06-2026 ==========
    const adminIds = await getAdminUserIds();
    await createNotificationsForUsers({
      userIds: adminIds,
      type: "ENQUIRY",
      message: `New ${enquiry.eventType} enquiry from ${req.user.name || "Registered Customer"}`,
      enquiryRef: enquiry._id,
      triggeredBy: req.user._id,
    });
    // ========== end nutan changes ==========

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== CREATE PUBLIC ENQUIRY ====================
export const createPublicEnquiry = async (req, res) => {
  try {
    const {
      fullName,
      mobileNumber,
      email,
      eventType,
      eventDate,
      guestCount,
      location,
      budget,
      description,
      serviceRequired,
    } = req.body;

    if (!fullName || !mobileNumber || !email || !eventType || !eventDate || !guestCount || !location) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be at least 1",
      });
    }

    const existingUser = await User.findOne({ email });

    let enquiryData = {
      fullName,
      mobileNumber,
      email,
      eventType,
      eventDate,
      guestCount,
      location,
      budget: budget || 0,
      description,
      serviceRequired: serviceRequired || [],
      source: "Website",
    };

    if (existingUser) {
      enquiryData.customerId = existingUser._id;
    }

    const enquiry = await Enquiry.create(enquiryData);

    // ========== nutan changes -26-06-2026 ==========
    const adminIds = await getAdminUserIds();
    await createNotificationsForUsers({
      userIds: adminIds,
      type: "ENQUIRY",
      message: `New ${enquiry.eventType} enquiry from ${fullName || "Guest"}`,
      enquiryRef: enquiry._id,
      triggeredBy: null,
    });
    // ========== end nutan changes ==========

    res.status(201).json({
      success: true,
      message: existingUser ? "Enquiry submitted and linked to your account" : "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("Create public enquiry error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// ==================== GET ALL ENQUIRIES (customer) ====================
export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      $or: [
        { customerId: req.user._id },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    await Enquiry.updateMany(
      {
        email: req.user.email,
        customerId: null
      },
      {
        customerId: req.user._id
      }
    );

    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== UPDATE ENQUIRY ====================
export const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { customerId: req.user._id },
          { email: req.user.email }
        ]
      },
      req.body,
      { returnDocument: "after" }
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== DELETE ENQUIRY ====================
export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { customerId: req.user._id },
        { email: req.user.email }
      ]
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    // ========== nutan changes -26-06-2026 ==========
    // Notification deletion handled via Mongoose pre-hooks in enquirySchema
    // ========== end nutan changes ==========

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};