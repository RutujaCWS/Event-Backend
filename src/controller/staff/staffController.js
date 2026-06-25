import Enquiry from "../../model/enquirySchema.js";

// Get paginated, filterable assigned enquiries for the logged‑in staff
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

// Get total number of assigned enquiries (for staff dashboard card)
export const getAssignedCount = async (req, res) => {
  try {
    const count = await Enquiry.countDocuments({ assignedTo: req.user.id });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update enquiry status and optionally add a follow‑up note
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
      { new: true, runValidators: false }  // ← bypass validation
    );
    if (!enquiry) return res.status(404).json({ success: false, message: "Not assigned to you" });
    res.json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get status distribution for assigned enquiries (staff)
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