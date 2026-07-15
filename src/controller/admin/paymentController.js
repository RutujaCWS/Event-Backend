import Booking from "../../model/bookingSchema.js";
import Invoice from "../../model/invoiceSchema.js";
import AdminSettings from "../../model/adminSettingsSchema.js";
import { 
  createRazorpayOrder, 
  verifyRazorpayPayment as verifyRazorpaySignature,  
  getRazorpayPaymentDetails,
  refundRazorpayPayment 
} from "../../services/razorpayService.js";
import {generateInvoice} from "./invoiceController.js";

export const createOnlinePaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentType } = req.body;

    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: "Admin settings not found"
      });
    }

    const razorpayGateway = settings.payment?.gatewayAccounts?.find(
      (gateway) =>
        gateway.type === "RAZORPAY" &&
        gateway.isActive &&
        gateway.isConfigured &&
        gateway.isPrimary
    );
    
    if (!razorpayGateway) {
      return res.status(400).json({
        success: false,
        message: "No active Razorpay gateway configured."
      });
    }


    const booking = await Booking.findById(bookingId)
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (
      settings.payment.allowPartialPayments === false &&
      paymentType !== "FULL"
    ) {
      return res.status(400).json({
        success: false,
        message: "Partial payments are disabled by admin. Please pay full amount."
      });
    }

    let amount = 0;
    let receiptPrefix = '';

    if (paymentType === 'ADVANCE') {
      amount = booking.advanceAmount - booking.advancePaid;
      receiptPrefix = 'advance';
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: "Advance already paid completely" });
      }
    } else if (paymentType === 'BALANCE') {
      if (booking.status !== "CONFIRMED") {
        return res.status(400).json({ success: false, message: "Booking must be confirmed first" });
      }
      if (booking.advancePaid < booking.advanceAmount) {
        return res.status(400).json({ success: false, message: "Advance payment must be completed first" });
      }
      amount = booking.balanceAmount - booking.balancePaid;
      receiptPrefix = 'balance';
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: "Balance already paid completely" });
      }
    } else if (paymentType === 'FULL') {
      const totalPaid = booking.advancePaid + booking.balancePaid;
      amount = booking.totalAmount - totalPaid;
      receiptPrefix = 'full';
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: "Booking is already fully paid" });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment type. Use ADVANCE, BALANCE, or FULL" 
      });
    }

    const order = await createRazorpayOrder(amount, 'INR', `${receiptPrefix}_${booking.bookingId}`);

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: amount,
        currency: 'INR',
        keyId: razorpayGateway.keyId,
        bookingId: booking.bookingId,
        customerName: booking.customerId?.name || 'Guest',
        customerEmail: booking.customerId?.email || '',
        customerMobile: booking.customerId?.mobile || '',
        paymentType: paymentType,
        paymentBreakdown: {
          totalAmount: booking.totalAmount,
          advanceAmount: booking.advanceAmount,
          balanceAmount: booking.balanceAmount,
          advancePaid: booking.advancePaid || 0,
          balancePaid: booking.balancePaid || 0,
          totalPaid: (booking.advancePaid || 0) + (booking.balancePaid || 0),
          remainingAmount: amount
        }
      }
    });

  } catch (error) {
    console.error("Create online payment order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPayment = async (req, res) => {  
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingId,
      paymentType 
    } = req.body;

    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    const paymentDetails = await getRazorpayPaymentDetails(razorpay_payment_id);

    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id })
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const amount = paymentDetails.amount / 100;

    if (paymentType === 'ADVANCE') {
      booking.advancePaid += amount;
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      booking.paymentMode = 'ONLINE';
      booking.paymentMethod = paymentDetails.method || 'UPI';
      booking.transactionId = razorpay_payment_id;
      booking.advancePaymentDate = new Date();

      if (booking.advancePaid >= booking.advanceAmount) {
        booking.paymentStatus = "ADVANCE_COMPLETED";
        booking.status = "CONFIRMED";
        booking.confirmationDate = new Date();
        
        const eventDate = new Date(booking.eventDate);
        const dueDate = new Date(eventDate);
        dueDate.setDate(dueDate.getDate() - 7);
        booking.balanceDueDate = dueDate;
      } else {
        booking.paymentStatus = "PARTIAL";
      }

      booking.paymentHistory.push({
        type: 'ADVANCE',
        amount: amount,
        mode: 'ONLINE',
        method: paymentDetails.method || 'UPI',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        transactionId: razorpay_payment_id,
        status: 'SUCCESS',
        date: new Date(),
        note: `Razorpay advance payment via ${paymentDetails.method || 'UPI'}`
      });

    } else if (paymentType === 'BALANCE') {
      booking.balancePaid += amount;
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      booking.paymentMode = 'ONLINE';
      booking.paymentMethod = paymentDetails.method || 'UPI';
      booking.transactionId = razorpay_payment_id;
      booking.balancePaymentDate = new Date();

      const totalPaid = booking.advancePaid + booking.balancePaid;
      if (totalPaid >= booking.totalAmount) {
        booking.paymentStatus = "FULL_PAID";
        booking.status = "COMPLETED";
        booking.fullPaymentDate = new Date();
      } else {
        booking.paymentStatus = "PARTIAL";
      }

      booking.paymentHistory.push({
        type: 'BALANCE',
        amount: amount,
        mode: 'ONLINE',
        method: paymentDetails.method || 'UPI',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        transactionId: razorpay_payment_id,
        status: 'SUCCESS',
        date: new Date(),
        note: `Razorpay balance payment via ${paymentDetails.method || 'UPI'}`
      });

    } else if (paymentType === 'FULL') {
      booking.advancePaid = booking.advanceAmount;
      booking.balancePaid = booking.balanceAmount;
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      booking.paymentMode = 'ONLINE';
      booking.paymentMethod = paymentDetails.method || 'UPI';
      booking.transactionId = razorpay_payment_id;
      booking.advancePaymentDate = new Date();
      booking.balancePaymentDate = new Date();
      booking.fullPaymentDate = new Date();
      booking.paymentStatus = "FULL_PAID";
      booking.status = "CONFIRMED";
      booking.confirmationDate = new Date();

      booking.paymentHistory.push({
        type: 'FULL',
        amount: amount,
        mode: 'ONLINE',
        method: paymentDetails.method || 'UPI',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        transactionId: razorpay_payment_id,
        status: 'SUCCESS',
        date: new Date(),
        note: `Razorpay full payment via ${paymentDetails.method || 'UPI'}`
      });
      booking.status = "COMPLETED";
    }

    await booking.save();

    let invoice = null;
    if (booking.paymentStatus === "FULL_PAID") {
      try {
        invoice = await generateInvoice(booking);
      } catch (error) {
        console.log("Invoice generation skipped:", error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentId: razorpay_payment_id,
        invoice: invoice
      }
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processOfflinePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentType, amount, paymentMethod, referenceNumber, note } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (!['ADVANCE', 'BALANCE', 'FULL'].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type. Use ADVANCE, BALANCE, or FULL"
      });
    }

    if (paymentType === 'ADVANCE') {
      if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
        return res.status(400).json({
          success: false,
          message: `Booking is ${booking.status}`
        });
      }

      const remainingAdvance = booking.advanceAmount - booking.advancePaid;
      if (amount > remainingAdvance) {
        return res.status(400).json({
          success: false,
          message: `Amount exceeds remaining advance. Remaining: ₹${remainingAdvance}`
        });
      }

      booking.advancePaid += amount;
      booking.paymentMode = 'OFFLINE';
      booking.paymentMethod = paymentMethod || 'CASH';
      booking.transactionId = referenceNumber || `OFFLINE-${Date.now()}`;
      booking.advancePaymentDate = new Date();

      if (booking.advancePaid >= booking.advanceAmount) {
        booking.paymentStatus = "ADVANCE_COMPLETED";
        booking.status = "CONFIRMED";
        booking.confirmationDate = new Date();
        
        const eventDate = new Date(booking.eventDate);
        const dueDate = new Date(eventDate);
        dueDate.setDate(dueDate.getDate() - 7);
        booking.balanceDueDate = dueDate;
      } else {
        booking.paymentStatus = "PARTIAL";
      }

      booking.paymentHistory.push({
        type: 'ADVANCE',
        amount: amount,
        mode: 'OFFLINE',
        method: paymentMethod || 'CASH',
        transactionId: referenceNumber || `OFFLINE-${Date.now()}`,
        status: 'SUCCESS',
        date: new Date(),
        note: note || `Offline ${paymentMethod || 'Cash'} advance payment`,
        processedBy: req.user?._id
      });
    }

    else if (paymentType === 'BALANCE') {
      if (booking.status !== "CONFIRMED") {
        return res.status(400).json({
          success: false,
          message: "Booking must be confirmed first"
        });
      }

      if (booking.advancePaid < booking.advanceAmount) {
        return res.status(400).json({
          success: false,
          message: "Advance payment must be completed first"
        });
      }

      const remainingBalance = booking.balanceAmount - booking.balancePaid;
      if (amount > remainingBalance) {
        return res.status(400).json({
          success: false,
          message: `Amount exceeds remaining balance. Remaining: ₹${remainingBalance}`
        });
      }

      booking.balancePaid += amount;
      booking.paymentMode = 'OFFLINE';
      booking.paymentMethod = paymentMethod || 'CASH';
      booking.transactionId = referenceNumber || `OFFLINE-${Date.now()}`;
      booking.balancePaymentDate = new Date();

      const totalPaid = booking.advancePaid + booking.balancePaid;
      if (totalPaid >= booking.totalAmount) {
        booking.paymentStatus = "FULL_PAID";
        booking.status = "COMPLETED";
        booking.fullPaymentDate = new Date();
      } else {
        booking.paymentStatus = "PARTIAL";
      }

      booking.paymentHistory.push({
        type: 'BALANCE',
        amount: amount,
        mode: 'OFFLINE',
        method: paymentMethod || 'CASH',
        transactionId: referenceNumber || `OFFLINE-${Date.now()}`,
        status: 'SUCCESS',
        date: new Date(),
        note: note || `Offline ${paymentMethod || 'Cash'} balance payment`,
        processedBy: req.user?._id
      });
    }

    else if (paymentType === 'FULL') {
      if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
        return res.status(400).json({
          success: false,
          message: `Booking is ${booking.status}. Cannot process payment.`
        });
      }

      const totalPaid = (booking.advancePaid || 0) + (booking.balancePaid || 0);
      if (totalPaid >= booking.totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Booking is already fully paid"
        });
      }

      const advanceRemaining = booking.advanceAmount - (booking.advancePaid || 0);
      const balanceRemaining = booking.balanceAmount - (booking.balancePaid || 0);

      if (advanceRemaining > 0) {
        booking.advancePaid = booking.advanceAmount; 
      }
      if (balanceRemaining > 0) {
        booking.balancePaid = booking.balanceAmount;  
      }

      booking.paymentMode = 'OFFLINE';
      booking.paymentMethod = paymentMethod || 'CASH';
      booking.transactionId = referenceNumber || `OFFLINE-FULL-${Date.now()}`;
      booking.advancePaymentDate = new Date();
      booking.balancePaymentDate = new Date();
      booking.fullPaymentDate = new Date();
      booking.paymentStatus = "FULL_PAID";
      booking.status = "CONFIRMED";
      booking.confirmationDate = new Date();
      booking.status = "COMPLETED";  

      booking.paymentHistory.push({
        type: 'FULL',
        amount: booking.totalAmount - totalPaid, 
        mode: 'OFFLINE',
        method: paymentMethod || 'CASH',
        transactionId: referenceNumber || `OFFLINE-FULL-${Date.now()}`,
        status: 'SUCCESS',
        date: new Date(),
        note: note || `Offline full payment via ${paymentMethod || 'Cash'}`,
        processedBy: req.user?._id
      });
    }

    await booking.save();

    let invoice = null;
    if (booking.paymentStatus === "FULL_PAID") {
      try {
        invoice = await generateInvoice(booking);
      } catch (error) {
        console.log("Invoice generation skipped:", error.message);
      }
    }

    let message = '';
    if (paymentType === 'ADVANCE') {
      message = booking.paymentStatus === "ADVANCE_COMPLETED" 
        ? "Offline advance payment recorded! Booking confirmed." 
        : "Partial offline advance payment recorded.";
    } else if (paymentType === 'BALANCE') {
      message = booking.paymentStatus === "FULL_PAID" 
        ? "Offline balance payment recorded! Booking completed." 
        : "Partial offline balance payment recorded.";
    } else {
      message = "Offline full payment recorded! Booking completed.";
    }

    res.status(200).json({
      success: true,
      message: message,
      data: {
        bookingId: booking.bookingId,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentType: paymentType,
        advancePaid: booking.advancePaid || 0,
        balancePaid: booking.balancePaid || 0,
        totalPaid: (booking.advancePaid || 0) + (booking.balancePaid || 0),
        totalAmount: booking.totalAmount,
        paymentMode: 'OFFLINE',
        transactionId: booking.transactionId,
        invoice: invoice
      }
    });

  } catch (error) {
    console.error("Offline payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentSummary = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId)
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const totalPaid = booking.advancePaid + booking.balancePaid;
    const remainingAdvance = Math.max(0, booking.advanceAmount - booking.advancePaid);
    const remainingBalance = Math.max(0, booking.balanceAmount - booking.balancePaid);
    const totalRemaining = remainingAdvance + remainingBalance;

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
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        totalAmount: booking.totalAmount,
        advanceRequired: booking.advanceAmount,
        balanceRequired: booking.balanceAmount,
        advancePaid: booking.advancePaid || 0,
        balancePaid: booking.balancePaid || 0,
        totalPaid: totalPaid,
        remainingAdvance: remainingAdvance,
        remainingBalance: remainingBalance,
        totalRemaining: totalRemaining,
        paymentStatus: paymentStatus,
        bookingStatus: booking.status,
        paymentPercentage: booking.getPaymentCompletion ? booking.getPaymentCompletion() : 0,
        paymentMode: booking.paymentMode,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        razorpayOrderId: booking.razorpayOrderId,
        razorpayPaymentId: booking.razorpayPaymentId,
        advancePaymentDate: booking.advancePaymentDate,
        balancePaymentDate: booking.balancePaymentDate,
        fullPaymentDate: booking.fullPaymentDate,
        balanceDueDate: booking.balanceDueDate,
        canPayAdvance: remainingAdvance > 0 && booking.status !== "COMPLETED" && booking.status !== "CANCELLED",
        canPayBalance: remainingBalance > 0 && booking.status === "CONFIRMED",
        canPayFull: totalRemaining > 0 && booking.status !== "CANCELLED",
        canProcessRefund: totalPaid > 0 && booking.status !== "REFUNDED",
        paymentHistory: booking.paymentHistory || []
      }
    });

  } catch (error) {
    console.error("Payment summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingPaymentSummary = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    
    const filter = {};
    if (status) filter.paymentStatus = status;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const bookings = await Booking.find(filter)
      .populate("customerId", "name email mobile")
      .sort({ createdAt: -1 });

    const summary = bookings.map(booking => ({
      bookingId: booking.bookingId,
      customerName: booking.customerId?.name || 'Guest',
      eventType: booking.eventType,
      eventDate: booking.eventDate,
      totalAmount: booking.totalAmount,
      totalPaid: (booking.advancePaid || 0) + (booking.balancePaid || 0),
      remainingAmount: booking.totalAmount - ((booking.advancePaid || 0) + (booking.balancePaid || 0)),
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      paymentMode: booking.paymentMode,
      paymentMethod: booking.paymentMethod
    }));

    const totalRevenue = bookings.reduce((sum, b) => sum + ((b.advancePaid || 0) + (b.balancePaid || 0)), 0);
    const totalPending = bookings.reduce((sum, b) => sum + (b.totalAmount - ((b.advancePaid || 0) + (b.balancePaid || 0))), 0);

    res.status(200).json({
      success: true,
      data: {
        bookings: summary,
        summary: {
          totalBookings: bookings.length,
          totalRevenue: totalRevenue,
          totalPending: totalPending,
          byPaymentStatus: {
            ADVANCE_PENDING: bookings.filter(b => b.paymentStatus === 'ADVANCE_PENDING').length,
            ADVANCE_COMPLETED: bookings.filter(b => b.paymentStatus === 'ADVANCE_COMPLETED').length,
            PARTIAL: bookings.filter(b => b.paymentStatus === 'PARTIAL').length,
            FULL_PAID: bookings.filter(b => b.paymentStatus === 'FULL_PAID').length,
            REFUNDED: bookings.filter(b => b.paymentStatus === 'REFUNDED').length
          }
        }
      }
    });

  } catch (error) {
    console.error("Payment summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processRazorpayRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, reason } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (!booking.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "No Razorpay payment found for this booking"
      });
    }

    const refund = await refundRazorpayPayment(
      booking.razorpayPaymentId,
      amount,
      { bookingId: booking.bookingId, reason: reason || 'Customer request' }
    );

    booking.refundAmount += amount;
    booking.refundDate = new Date();
    booking.refundReason = reason || 'Customer request';
    booking.paymentStatus = "REFUNDED";
    booking.status = "REFUNDED";

    booking.paymentHistory.push({
      type: 'REFUND',
      amount: amount,
      mode: 'ONLINE',
      method: 'RAZORPAY',
      transactionId: refund.id,
      status: 'REFUNDED',
      date: new Date(),
      note: `Razorpay refund: ${reason || 'Customer request'}`,
      processedBy: req.user?._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        bookingId: booking.bookingId,
        refundAmount: booking.refundAmount,
        refundId: refund.id,
        status: booking.status
      }
    });

  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processOfflineRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { 
      amount, 
      reason, 
      refundMethod,  
      referenceNumber,
      note 
    } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate("customerId", "name email mobile");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const totalPaid = (booking.advancePaid || 0) + (booking.balancePaid || 0);
    if (totalPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: "No payment found for this booking"
      });
    }

    if (amount > totalPaid) {
      return res.status(400).json({
        success: false,
        message: `Refund amount exceeds total paid. Total paid: ₹${totalPaid}`
      });
    }

    if (booking.paymentStatus === "REFUNDED") {
      return res.status(400).json({
        success: false,
        message: "Booking is already refunded"
      });
    }

    booking.refundAmount = (booking.refundAmount || 0) + amount;
    booking.refundDate = new Date();
    booking.refundReason = reason || 'Customer requested cancellation';
    booking.refundMethod = refundMethod || 'CASH';
    booking.paymentStatus = "REFUNDED";
    booking.status = "REFUNDED";

    booking.paymentHistory.push({
      type: 'REFUND',
      amount: amount,
      mode: 'OFFLINE',  
      method: refundMethod || 'CASH',
      transactionId: referenceNumber || `OFFLINE-REFUND-${Date.now()}`,
      status: 'REFUNDED',
      date: new Date(),
      note: note || `Offline refund via ${refundMethod || 'Cash'}: ${reason || 'Customer request'}`,
      processedBy: req.user?._id
    });

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Offline refund recorded successfully",
      data: {
        bookingId: booking.bookingId,
        refundAmount: booking.refundAmount,
        refundMode: 'OFFLINE',
        refundMethod: refundMethod || 'CASH',
        refundId: referenceNumber || `OFFLINE-REFUND-${Date.now()}`,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error("Offline refund error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


