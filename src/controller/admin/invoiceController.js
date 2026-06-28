import Invoice from "../../model/invoiceSchema.js";

// Generate Invoice
export const generateInvoice = async (booking) => {
  try {
    const cgstRate = booking.cgstRate || 9;
    const sgstRate = booking.sgstRate || 9;

    const year = new Date().getFullYear();
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 }).select("invoiceNumber");

    let sequence = 1;
    if (lastInvoice?.invoiceNumber) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
      sequence = lastSequence + 1;
    }

    const invoiceNumber = `INV-${year}-${String(sequence).padStart(4, "0")}`;

    const cgst = booking.totalCGST || 0;
    const sgst = booking.totalSGST || 0;
    const gstAmount = booking.totalGST || 0;

    const invoice = await Invoice.create({
      invoiceNumber,
      bookingId: booking._id,
      customerId: booking.customerId,
      leadId: booking.leadId,
      eventType: booking.eventType,
      eventDate: booking.eventDate,
      totalAmount: booking.totalAmount,
      advancePaid: booking.advancePaid || 0,
      balancePaid: booking.balancePaid || 0,
      gstAmount,
      cgst,
      sgst,
      cgstRate,
      sgstRate,
      status: "PAID",
      generatedDate: new Date()
    });

    return invoice;
  } catch (error) {
    console.error("Invoice generation error:", error);
    throw error;
  }
};

// Get Invoice by Booking ID
export const getInvoiceByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const invoice = await Invoice.findOne({ bookingId })
      .populate("customerId", "name email")
      .populate("leadId", "fullName email");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Invoices 
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("customerId", "name email")
      .populate("leadId", "fullName email")
      .populate("bookingId", "bookingId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Customer Invoices
export const getCustomerInvoices = async (req, res) => {
  try {
    const userId = req.user._id;
    const invoices = await Invoice.find({
      $or: [{ customerId: userId }, { leadId: userId }]
    })
      .populate("bookingId", "bookingId eventDate venue")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};