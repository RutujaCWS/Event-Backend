import Enquiry from "../../model/enquirySchema.js";
import User from "../../model/userSchema.js";


export const getAllLeads = async (req, res) => {
  try {
    const leads = await Enquiry.find()
      .populate("customerId", "name email mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateLead = async (req, res) => {
  try {
    const lead = await Enquiry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ========== NEW FUNCTIONS FOR ADMIN DASHBOARD ==========

// Get total count of all enquiries (for admin Total Enquiries card)
export const getTotalEnquiries = async (req, res) => {
  try {
    const total = await Enquiry.countDocuments();
    res.status(200).json({ success: true, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get 5 most recent enquiries (for admin Recent Enquiries table)
export const getRecentEnquiries = async (req, res) => {
  try {
    const recent = await Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name email mobile")
      .populate("assignedTo", "name");
    res.status(200).json({ success: true, data: recent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ==================== ASSIGNMENT APIs ====================

// Get list of active staff (for assignment dropdown)
export const getStaffListForAssignment = async (req, res) => {
  try {
    // Fetch staff, include nested assignedCity
    const staff = await User.find({ role: "staff", isActive: true })
      .select("name email address.assignedCity");
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Assign enquiry to staff – manual or location‑based (works with nested assignedCity)
export const assignEnquiryToStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, assignByLocation } = req.body;

    let targetStaffId = staffId;

    if (assignByLocation) {
      const enquiry = await Enquiry.findById(id);
      if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
      const city = enquiry.city;
      if (!city) return res.status(400).json({ success: false, message: "Location missing – cannot auto-assign" });

      // Search staff with matching address.assignedCity (case-insensitive)
      const staff = await User.findOne({
        role: "staff",
        isActive: true,
        "address.assignedCity": { $regex: new RegExp(`^${city}$`, "i") }
      });
      if (!staff) return res.status(404).json({ success: false, message: `No staff assigned to city: ${city}` });
      targetStaffId = staff._id;
    } else {
      // Validate manual staffId
      const staffExists = await User.findOne({ _id: staffId, role: "staff" });
      if (!staffExists) return res.status(400).json({ success: false, message: "Invalid staff ID" });
    }

    const updated = await Enquiry.findByIdAndUpdate(
      id,
      { assignedTo: targetStaffId, assignedAt: new Date() },
      { new: true }
    ).populate("assignedTo", "name email address.assignedCity");

    if (!updated) return res.status(404).json({ success: false, message: "Enquiry not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};