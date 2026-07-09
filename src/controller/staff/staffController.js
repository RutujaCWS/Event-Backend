import Enquiry from "../../model/enquirySchema.js";

// ========== nutan changes -26-06-2026 ==========
import { createNotification } from "../../services/notificationService.js";
// ========== end nutan changes ==========

// ==================== GET ASSIGNED ENQUIRIES ====================
export const getAssignedEnquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status === "all" ? null : req.query.status;

    const filter = { assignedTo: req.user.id };
    if (status) filter.status = status;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .populate("customerId", "name email mobile")
        .sort({ assignedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Enquiry.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: enquiries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== GET ASSIGNED COUNT ====================
export const getAssignedCount = async (req, res) => {
  try {
    const count = await Enquiry.countDocuments({ assignedTo: req.user.id });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== UPDATE ENQUIRY STATUS ====================
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const updateData = { status };
    if (note) {
      updateData.$push = { followUpNotes: { note, createdAt: new Date(), createdBy: req.user.name } };
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, assignedTo: req.user.id },
      updateData,
      { new: true, runValidators: false }
    ).populate("customerId", "name email _id");

    if (!enquiry) return res.status(404).json({ success: false, message: "Not assigned to you" });

    // ========== nutan changes -26-06-2026 ==========
    if (enquiry.customerId) {
      await createNotification({
        userId: enquiry.customerId._id,
        type: "ENQUIRY_STATUS_UPDATED",
        // ✅ Staff name added to the message
        message: `Your enquiry #${enquiry._id} (${enquiry.eventType}) status has been updated to "${status}" by ${req.user.name}.`,
        enquiryRef: enquiry._id,
        triggeredBy: req.user._id,
      });
    }
    // ========== end nutan changes ==========

    res.json({ success: true, data: enquiry });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET STATUS COUNTS ====================
export const getAssignedStatusCounts = async (req, res) => {
  try {
    const distribution = await Enquiry.aggregate([
      { $match: { assignedTo: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.status(200).json({ success: true, data: distribution });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};