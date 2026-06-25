// import Enquiry from "../../model/enquirySchema.js";
// import User from "../../model/userSchema.js";

// ==================== DASHBOARD APIs ====================

// Get total count of all enquiries (for admin dashboard)
// export const getTotalEnquiries = async (req, res) => {
//   try {
//     const total = await Enquiry.countDocuments();
//     res.status(200).json({ success: true, total });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// Get 5 most recent enquiries (for admin dashboard table)
// export const getRecentEnquiries = async (req, res) => {
//   try {
//     const recent = await Enquiry.find()
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .populate("customerId", "name email mobile")
//       .populate("assignedTo", "name");
//     res.status(200).json({ success: true, data: recent });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

