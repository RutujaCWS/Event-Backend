import AdminSettings from "../../model/adminSettingsSchema.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";

// ========== SMS Settings ==========
export const getSmsSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().select("smsSenderNumber smsEnabled");
    if (!settings) {
      // Return default values if no document exists
      return res.status(200).json({
        success: true,
        data: { smsSenderNumber: "", smsEnabled: true },
      });
    }
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error in getSmsSettings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch SMS settings",
    });
  }
};

export const updateSmsSettings = async (req, res) => {
  try {
    const { smsSenderNumber, smsEnabled } = req.body;

    // Optional: validate phone number format
    if (smsSenderNumber && !/^\+?[0-9]{10,15}$/.test(smsSenderNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Use E.164 (e.g., +1234567890).",
      });
    }

    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { smsSenderNumber, smsEnabled },
      { new: true, upsert: true } // creates if doesn't exist
    );

    res.status(200).json({
      success: true,
      message: "SMS settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error in updateSmsSettings:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update SMS settings",
    });
  }
};

// // ========== Tax & Discount (existing) ==========
export const getTaxDiscountSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().select("taxDiscount");
    res.status(200).json({
      success: true,
      data: settings?.taxDiscount || { cgstRate: 9, sgstRate: 9, defaultDiscountValue: 0 },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaxDiscountSettings = async (req, res) => {
  try {
    const { cgstRate, sgstRate, defaultDiscountValue } = req.body;
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      { taxDiscount: { cgstRate, sgstRate, defaultDiscountValue } },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, message: "Tax settings updated", data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ========== Default Staff Permissions Settings ==========
export const getDefaultStaffPermissions = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().select("defaultStaffPermissions");
    res.status(200).json({
      success: true,
      data: settings?.defaultStaffPermissions || {
        enquiries: true,
        events: true,
        tasks: true,
        schedule: true,
        statusUpdates: true,
        viewPayments: true,
        recordPayments: false,
      },
    });
  } catch (error) {
    console.error("Error in getDefaultStaffPermissions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDefaultStaffPermissions = async (req, res) => {
  try {
    const { enquiries, events, tasks, schedule, statusUpdates, viewPayments, recordPayments } = req.body;
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      {
        defaultStaffPermissions: { enquiries, events, tasks, schedule, statusUpdates, viewPayments, recordPayments }
      },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      message: "Default staff permissions updated successfully",
      data: settings.defaultStaffPermissions,
    });
  } catch (error) {
    console.error("Error in updateDefaultStaffPermissions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateBusinessSettings = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      website,
      address,
      language,
      currency,
      darkMode,
    } = req.body;

    let settings = await AdminSettings.findOne();

    let logoUrl = settings?.business?.logo || "";

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "business-logo",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      logoUrl = result.secure_url;
    }

    if (!settings) {
      settings = await AdminSettings.create({
        business: {
          companyName,
          companyEmail,
          companyPhone,
          website,
          address,
          language,
          currency,
          darkMode,
          logo: logoUrl,
        },
      });
    } else {
      settings = await AdminSettings.findOneAndUpdate(
        {},
        {
          business: {
            companyName,
            companyEmail,
            companyPhone,
            website,
            address,
            language,
            currency,
            darkMode,
            logo: logoUrl,
          },
        },
        {
          new: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Business profile updated successfully",
      data: settings.business,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBusinessSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().select("business");

    res.status(200).json({
      success: true,
      data:
        settings?.business || {
          companyName: "",
          companyEmail: "",
          companyPhone: "",
          website: "",
          logo: "",
          address: "",
          language: "English",
          currency: "INR",
          darkMode: false,
        },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Payment Settings
export const getPaymentSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(200).json({
        razorpayKeyId: "",
        razorpayKeySecret: "",
        allowOfflinePayments: true,
        allowPartialPayments: true,
        advancePercentage: 50,
        autoSendPaymentLink: true,
        autoApproveRefund: false,
        refundLimit: 1000,
        enableTestMode: true
      });
    }

    res.status(200).json(settings.payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch payment settings"
    });
  }
};

// Update Payment Settings
export const updatePaymentSettings = async (req, res) => {
  try {
    const { 
      razorpayKeyId, 
      razorpayKeySecret,
      allowOfflinePayments,
      allowPartialPayments,
      advancePercentage,
      autoSendPaymentLink,
      autoApproveRefund,
      refundLimit,
      enableTestMode
    } = req.body;

    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = await AdminSettings.create({
        payment: {
          razorpayKeyId,
          razorpayKeySecret,
          allowOfflinePayments,
          allowPartialPayments,
          advancePercentage,
          autoSendPaymentLink,
          autoApproveRefund,
          refundLimit,
          enableTestMode
        }
      });
    } else {
      settings = await AdminSettings.findOneAndUpdate(
        {},
        {
          payment: {
            razorpayKeyId,
            razorpayKeySecret,
            allowOfflinePayments,
            allowPartialPayments,
            advancePercentage,
            autoSendPaymentLink,
            autoApproveRefund,
            refundLimit,
            enableTestMode
          }
        },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment settings saved successfully!",
      data: settings.payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save payment settings"
    });
  }
};


