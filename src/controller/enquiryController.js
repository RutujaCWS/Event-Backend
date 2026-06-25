import Enquiry from "../model/enquirySchema.js";
import mongoose from "mongoose"; 
import User from "../model/userSchema.js"
// CREATE ENQUIRY

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

    if (
      !eventType ||
      !eventDate ||
      !guestCount ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (guestCount < 1) {
      return res.status(400).json({
        success:false,
        message: "Guest count must be at least 1",
      })
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
// CREATE Public ENQUIRY 
export const createPublicEnquiry = async (
  req,
  res
) => {
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

    if (
      !fullName ||
      !mobileNumber ||
      !email ||
      !eventType ||
      !eventDate ||
      !guestCount ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (guestCount < 1) {
      return res.status(400).json({
        success: false, // <-- FIXED: "sucess" to "success"
        message: "Guest count must be at least 1",
      })
    }

    // OPTION 1: Using imported User model (RECOMMENDED)
    const existingUser = await User.findOne({ email });
    
    // OPTION 2: Using mongoose.model (if User import not working)
    // const User = mongoose.model('User');
    // const existingUser = await User.findOne({ email });

    let enquiryData = {
      fullName,
      mobileNumber,
      email,
      eventType,
      eventDate,
      guestCount,
      location,
      budget: budget || 0, // <-- ADD default value
      description,
      serviceRequired: serviceRequired || [], // <-- ADD default value
      source: "Website",
    };

    if (existingUser) {
      enquiryData.customerId = existingUser._id;
    }

    const enquiry = await Enquiry.create(enquiryData);

    res.status(201).json({
      success: true,
      message: existingUser ? "Enquiry submitted and linked to your account" : "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("Create public enquiry error:", error); // <-- ADD this for debugging
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error", // <-- Send actual error
    });
  }
};
// GET ALL ENQUIRIES

export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      $or: [
        { customerId: req.user._id },
        { email: req.user.email }
      ]
    }).sort({
      createdAt: -1,
    });

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE ENQUIRY

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

// DELETE ENQUIRY

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