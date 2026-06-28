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
      .populate("leadId");

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


export const confirmAdvancePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Update advance paid amount
    booking.advancePaid = (booking.advancePaid || 0) + amount;
    booking.paymentStatus = "ADVANCE_COMPLETED";
    booking.status = "CONFIRMED";
    booking.confirmationDate = new Date();

    // Set balance due date (7 days before event)
    const eventDate = new Date(booking.eventDate);
    const dueDate = new Date(eventDate);
    dueDate.setDate(dueDate.getDate() - 7);
    booking.balanceDueDate = dueDate;

    await booking.save();

        // ========== nutan changes -26-06-2026 ==========
        const adminIds = await getAdminUserIds();
        await createNotificationsForUsers({
          userIds: adminIds,
          type: "BOOKING_CONFIRMED",
          message: `Booking #${booking._id} confirmed for ${booking.eventType || "event"} on ${new Date(booking.eventDate).toLocaleDateString()}`,
          bookingRef: booking._id,
          triggeredBy: req.user?._id,
        });
    
        if (booking.customerId) {
          await createNotification({
            userId: booking.customerId._id,
            type: "BOOKING_CONFIRMED",
            message: `Your booking for ${booking.eventType || "event"} on ${new Date(booking.eventDate).toLocaleDateString()} has been confirmed.`,
            bookingRef: booking._id,
            triggeredBy: req.user?._id,
          });
        }
        // ========== end nutan changes ==========

        
    res.status(200).json({
      success: true,
      message: "Advance payment confirmed! Booking confirmed.",
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        advancePaid: booking.advancePaid,
        balanceDueDate: booking.balanceDueDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. Confirm Balance Payment
export const confirmBalancePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Booking must be confirmed first"
      });
    }

    // Update balance paid
    booking.balancePaid = (booking.balancePaid || 0) + amount;
    booking.paymentStatus = "FULL_PAID";
    booking.status = "COMPLETED";
    await booking.save();

    // Generate invoice
    try {
      const { generateInvoice } = await import("./invoiceController.js");
      await generateInvoice(booking);
    } catch (error) {
      console.log("Invoice generation skipped:", error.message);
    }

    res.status(200).json({
      success: true,
      message: "Balance payment confirmed! Booking completed. Invoice generated.",
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        balancePaid: booking.balancePaid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. Get Payment Summary
export const getPaymentSummary = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const totalPaid = (booking.advancePaid || 0) + (booking.balancePaid || 0);
    const remainingBalance = booking.balanceAmount - (booking.balancePaid || 0);

    let paymentStatus = "PENDING";
    if (totalPaid >= booking.totalAmount) {
      paymentStatus = "FULL_PAID";
    } else if (booking.advancePaid >= booking.advanceAmount) {
      paymentStatus = "ADVANCE_COMPLETED";
    } else if (booking.advancePaid > 0) {
      paymentStatus = "PARTIAL";
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        totalAmount: booking.totalAmount,
        totalPaid: totalPaid,
        advancePaid: booking.advancePaid || 0,
        advanceRequired: booking.advanceAmount,
        remainingAdvance: Math.max(0, booking.advanceAmount - (booking.advancePaid || 0)),
        balancePaid: booking.balancePaid || 0,
        balanceRequired: booking.balanceAmount,
        remainingBalance: Math.max(0, remainingBalance),
        paymentStatus: paymentStatus,
        bookingStatus: booking.status,
        balanceDueDate: booking.balanceDueDate,
        canPayBalance: booking.status === "CONFIRMED" && remainingBalance > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};