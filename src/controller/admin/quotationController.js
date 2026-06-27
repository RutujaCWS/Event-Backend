import Quotation from "../../model/quotationSchema.js";
import { sendEmail } from "../../services/sendEmail.js";
import mongoose from "mongoose";
import Enquiry from "../../model/enquirySchema.js";
import Booking from "../../model/bookingSchema.js"

// Create Quotation
export const createQuotation = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;

    const year = new Date().getFullYear();

    const lastQuotation = await Quotation.findOne({
      quotationNumber: new RegExp(`^QT-${year}-`)
    })
      .sort({ createdAt: -1 })
      .select("quotationNumber");

    let sequence = 1;

    if (lastQuotation) {
      const lastSequence = parseInt(
        lastQuotation.quotationNumber.split("-")[2]
      );

      sequence = lastSequence + 1;
    }

    req.body.quotationNumber = `QT-${year}-${String(
      sequence
    ).padStart(4, "0")}`;
    const existingQuotation = await Quotation.findOne({
        leadId: req.body.leadId,
        status: {
          $in: ["DRAFT", "SENT", "VIEWED"]
        }
      });

      if (existingQuotation) {
        return res.status(400).json({
          success: false,
          message:
            "An active quotation already exists for this lead",
        });
      }

      const lead = await Enquiry.findById(req.body.leadId);
if (lead && lead.email) {
  req.body.guestEmail = lead.email;
  req.body.guestName = lead.fullName;
}

    const quotation = await Quotation.create(req.body);

    res.status(201).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    console.error("Create quotation error:", error); 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Get All Quotation
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("customerId")
      .populate("leadId");

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Get Quotation By Id
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate("customerId")
      .populate("leadId");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Update Quotation
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (quotation.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Quotation already approved",
      });
    }

    Object.assign(quotation, req.body);

    await quotation.save();

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



//Delete Quotation
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (quotation.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft quotations can be deleted",
      });
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: "Quotation deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Preview Quotation
export const previewQuotation = async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate("customerId")
    .populate("leadId");

  res.status(200).json({
    success: true,
    data: quotation,
  });
};


import crypto from "crypto";
//Send Quotation
export const sendQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
  .populate("customerId")
  .populate("leadId");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    quotation.status = "SENT";

    quotation.approvalToken =
      crypto.randomBytes(32).toString("hex");

    quotation.emailSent = true;
    quotation.emailSentAt = new Date();
    console.log("quotation.approvalToken",quotation.approvalToken)

    await quotation.save();
    const reviewUrl =
      `${process.env.FRONTEND_URL}/customer/quotations/${quotation.approvalToken}`;
    console.log("quotation?.customerId?._id",quotation?.customerId?._id)
    // const customer = await User.findById(
    //   quotation?.customerId?._id
    // );
    const customer = quotation.customerId;
    const lead = quotation.leadId;

if (customer) {

  // Registered customer
  await sendEmail({
    to: customer.email,

    subject: `Quotation Ready for Review - ${quotation.quotationNumber}`,

    html: `
      <h3>Hello ${customer.name}</h3>

      <p>Your quotation is ready.</p>

      <p>
        Quotation No:
        <strong>${quotation.quotationNumber}</strong>
      </p>

      <p>
        Review your quotation here:
      </p>

      <a href="${reviewUrl}">
        Review Quotation
      </a>
    `
  });

} else {

  // Customer not registered
  const signupUrl =
  `${process.env.FRONTEND_URL}/register`;

  await sendEmail({
    to: lead.email,

    subject: "Your Quotation is Ready - Please Register to View",

    html: `
      <h3>Hello</h3>

      <p>
        Your quotation has been prepared.
      </p>

      <p>
        Please create an account or login to access your quotation.
      </p>

      <a href="${signupUrl}">
        Register / Login
      </a>
    `
  });

}
    res.status(200).json({
      success: true,
      reviewUrl,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Get Quotation By Token
export const getQuotationByToken = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      approvalToken: req.params.token,
    })
      .populate("customerId")
      .populate("leadId");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Invalid quotation link",
      });
    }

    if (quotation.status === "SENT") {
      quotation.status = "VIEWED";
      quotation.viewedAt = new Date();

      await quotation.save();
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//Approve Quotation
export const approveQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (quotation.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Already approved",
      });
    }

    const year = new Date().getFullYear();

    const lastBooking = await Booking.findOne()
      .sort({ createdAt: -1 })
      .select("bookingId");

    let sequence = 1;

    if (lastBooking?.bookingId) {
      const lastSequence = parseInt(
        lastBooking.bookingId.split("-")[2]
      );

      sequence = lastSequence + 1;
    }

    const bookingNumber = `BK-${year}-${String(
      sequence
    ).padStart(4, "0")}`;


    quotation.status = "APPROVED";
    quotation.approvedAt = new Date();
    quotation.approvedBy = req.user._id;

    await quotation.save();

    const booking = await Booking.create({
      bookingId: bookingNumber,

      quotationId: quotation._id,

      leadId: quotation.leadId,

      customerId: quotation.customerId,

      eventType: quotation.eventType,

      eventDate: quotation.eventDate,

      totalAmount: quotation.totalAmount,

      advanceAmount: quotation.totalAmount * 0.3,

      balanceAmount:
        quotation.totalAmount -
        quotation.totalAmount * 0.3,

      status: "PENDING_PAYMENT",
    });

    quotation.bookingCreated = true;
    quotation.bookingId = booking._id;

    await quotation.save();

    res.status(200).json({
      success: true,
      message:
        "Quotation approved and booking created successfully",
      booking,
      quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Reject Quotation
export const rejectQuotation = async (req, res) => {
  try {
    const { reason } = req.body;

    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    quotation.status = "REJECTED";
    quotation.rejectedAt = new Date();
    quotation.rejectionReason = reason || "";

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Quotation rejected",
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Revise Quotation
export const reviseQuotation = async (req, res) => {
  try {
    const oldQuotation = await Quotation.findById(
      req.params.id
    );

    if (!oldQuotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    oldQuotation.status = "SUPERSEDED";

    await oldQuotation.save();

    const newQuotation = await Quotation.create({
      ...oldQuotation.toObject(),

      _id: undefined,

      parentQuotationId: oldQuotation._id,

      version: oldQuotation.version + 1,

      status: "DRAFT",
    });

    res.status(201).json({
      success: true,
      data: newQuotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Customer Quotations
export const getCustomerQuotations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;

    const quotations = await Quotation.find()
      .populate({
        path: "leadId",
        select: "fullName email mobileNumber"
      })
      .populate({
        path: "customerId",
        select: "name email mobile"
      })
      .sort({ createdAt: -1 });

    const filteredQuotations = quotations.filter(q => {
      const matchCustomerId = q.customerId?._id?.toString() === userId?.toString();
      const matchGuestEmail = q.guestEmail === userEmail;
      const matchLeadEmail = q.leadId?.email === userEmail;
      const matchLeadId = q.leadId?._id?.toString() === userId?.toString();
      const isNotDraft = q.status !== "DRAFT";
      
      return (matchCustomerId || matchGuestEmail || matchLeadEmail || matchLeadId) && isNotDraft;
    });

    res.status(200).json({
      success: true,
      count: filteredQuotations.length,
      data: filteredQuotations,
    });
  } catch (error) {
    console.error("Get customer quotations error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


