import Booking from "../../model/bookingSchema.js";
import User from "../../model/userSchema.js";

// ========== nutan changes -26-06-2026 ==========
import { getAdminUserIds, createNotificationsForUsers, createNotification } from "../../services/notificationService.js";
// ========== end nutan changes ==========

// ==================== GET ALL BOOKINGS (Admin) ====================
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId")
      .populate("quotationId")
      .populate("leadId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== GET BOOKING BY ID ====================
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customerId")
      .populate("quotationId")
      .populate("leadId")
       .populate({
    path: "assignedStaff",
    select: "name email mobile profileImage employeeId role",
  });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== GET CUSTOMER BOOKINGS ====================
export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerId: req.user._id,
    })
      .populate("quotationId")
      .populate("leadId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ==================== CANCEL BOOKING ====================
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = "CANCELLED";
    await booking.save();

    // ========== nutan changes -26-06-2026 ==========
    const adminIds = await getAdminUserIds();
    const customerName = booking.customerId?.name || "Customer";
    await createNotificationsForUsers({
      userIds: adminIds,
      type: "BOOKING_CANCELLED",
      message: `Booking #${booking._id} cancelled by ${customerName}`,
      bookingRef: booking._id,
      triggeredBy: req.user?._id,
    });

    if (booking.customerId) {
      await createNotification({
        userId: booking.customerId._id,
        type: "BOOKING_CANCELLED",
        message: `Your booking for ${booking.eventType || "event"} on ${new Date(booking.eventDate).toLocaleDateString()} has been cancelled.`,
        bookingRef: booking._id,
        triggeredBy: req.user?._id,
      });
    }
    // ========== end nutan changes ==========

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== GET BOOKING STATS ====================
export const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: "PENDING_PAYMENT" });
    const confirmedBookings = await Booking.countDocuments({ status: "CONFIRMED" });
    const revenue = await Booking.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const upcomingBookings = await Booking.countDocuments({ eventDate: { $gte: new Date() } });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        revenue: revenue[0]?.totalRevenue || 0,
        upcomingBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


