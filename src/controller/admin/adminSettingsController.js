import AdminSettings from "../../model/adminSettingsSchema.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";
import Razorpay from 'razorpay';
import mongoose from "mongoose";
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
      removeLogo,
    } = req.body;

    let settings = await AdminSettings.findOne();
    console.log("req.body:", req.body);
console.log("req.file:", req.file);

    let logoUrl = settings?.business?.logo || "";

// Remove existing logo
if (removeLogo === "true") {
  logoUrl = "";
}

// Upload new logo
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
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(200).json({
        gatewayAccounts: [],
        allowOfflinePayments: true,
        allowPartialPayments: true,
        advancePercentage: 50,
        autoSendPaymentLink: true,
        autoApproveRefund: false,
        refundLimit: 1000,
      });
    }

    res.status(200).json({
      gatewayAccounts: settings.payment?.gatewayAccounts || [],
      allowOfflinePayments: settings.payment?.allowOfflinePayments ?? true,
      allowPartialPayments: settings.payment?.allowPartialPayments ?? true,
      advancePercentage: settings.payment?.advancePercentage || 50,
      autoSendPaymentLink: settings.payment?.autoSendPaymentLink ?? true,
      autoApproveRefund: settings.payment?.autoApproveRefund ?? false,
      refundLimit: settings.payment?.refundLimit || 1000,
    });

  } catch (error) {
    console.error("Get payment settings error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch payment settings"
    });
  }
};

export const updatePaymentSettings = async (req, res) => {
  try {
    const {
      allowOfflinePayments,
      allowPartialPayments,
      advancePercentage,
      autoSendPaymentLink,
      autoApproveRefund,
      refundLimit,
    } = req.body;

    let settings = await AdminSettings.findOne();

    const existingGateways = settings?.payment?.gatewayAccounts || [];

    const paymentData = {
      gatewayAccounts: existingGateways,
      allowOfflinePayments: allowOfflinePayments ?? true,
      allowPartialPayments: allowPartialPayments ?? true,
      advancePercentage: advancePercentage || 50,
      autoSendPaymentLink: autoSendPaymentLink ?? true,
      autoApproveRefund: autoApproveRefund ?? false,
      refundLimit: refundLimit || 1000,
    };

    if (!settings) {
      settings = await AdminSettings.create({ payment: paymentData });
    } else {
      settings = await AdminSettings.findOneAndUpdate(
        {},
        { payment: paymentData },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment settings saved successfully!",
      data: settings.payment
    });

  } catch (error) {
    console.error("Update payment settings error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save payment settings"
    });
  }
};


//get all gateways
export const getGateways = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    const gateways = [];

    if (settings?.payment?.gatewayAccounts?.length > 0) {
      settings.payment.gatewayAccounts.forEach((account) => {
        let displayEmail = 'Not connected';
        let isConfigured = false;

        if (account.type === 'RAZORPAY') {
          isConfigured = !!(account.keyId && account.keySecret);
          const keyId = account.keyId || '';
          displayEmail = isConfigured ? (keyId.length > 8 ? keyId.substring(0, 8) + '******' : keyId) : 'Not connected';
        } else if (account.type === 'UPI') {
          isConfigured = !!(account.upiId);
          displayEmail = isConfigured ? account.upiId : 'Not connected';
        } else if (account.type === 'STRIPE') {
          isConfigured = !!(account.stripePublishableKey && account.stripeSecretKey);
          displayEmail = isConfigured ? 'Configured' : 'Not connected';
        }

        gateways.push({
          key: `${account.type}_${account.id}`,
          type: account.type,
          name: account.name,
          email: displayEmail,
          status: account.isActive && account.isConfigured ? 'Active' : 'Disconnected',
          isActive: account.isActive,
          isConfigured: account.isConfigured || false,  
          isPrimary: account.isPrimary || false,
          accountId: account.id,
          keyId: account.keyId || '',
          keySecret: account.keySecret || '',
          upiId: account.upiId || '',
          upiName: account.upiName || '',
          stripePublishableKey: account.stripePublishableKey || '',
          stripeSecretKey: account.stripeSecretKey || '',
        });
      });
    }

    const grouped = gateways.reduce((acc, g) => {
      if (!acc[g.type]) acc[g.type] = [];
      acc[g.type].push(g);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        gateways,
        grouped,
        primaryGateways: gateways.filter(g => g.isPrimary)
      }
    });

  } catch (error) {
    console.error("Get gateways error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch gateways"
    });
  }
};


//save gateway
export const saveGateway = async (req, res) => {
  try {
    const {
      gatewayType,
      accountName,
      razorpayKeyId,
      razorpayKeySecret,
      upiId,
      upiName,
      stripePublishableKey,
      stripeSecretKey,
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({ payment: { gatewayAccounts: [] } });
    }

    const newAccount = {
      id: new mongoose.Types.ObjectId().toString(),
      type: gatewayType,
      name: accountName || `${gatewayType} Account`,
      isPrimary: false,
      isActive: false,
      createdAt: new Date()
    };

    if (gatewayType === 'RAZORPAY') {
      newAccount.keyId = razorpayKeyId || '';
      newAccount.keySecret = razorpayKeySecret || '';
    } else if (gatewayType === 'UPI') {
      newAccount.upiId = upiId || '';
      newAccount.upiName = upiName || '';
    } else if (gatewayType === 'STRIPE') {
      newAccount.stripePublishableKey = stripePublishableKey || '';
      newAccount.stripeSecretKey = stripeSecretKey || '';
    }

    let existingIndex = -1;
    if (gatewayType === 'RAZORPAY' && razorpayKeyId) {
      existingIndex = settings.payment.gatewayAccounts.findIndex(
        acc => acc.type === 'RAZORPAY' && acc.keyId === razorpayKeyId
      );
    } else if (gatewayType === 'UPI' && upiId) {
      existingIndex = settings.payment.gatewayAccounts.findIndex(
        acc => acc.type === 'UPI' && acc.upiId === upiId
      );
    }

    if (existingIndex > -1) {
      settings.payment.gatewayAccounts[existingIndex].isActive = false;
      settings.payment.gatewayAccounts[existingIndex].keySecret = razorpayKeySecret || settings.payment.gatewayAccounts[existingIndex].keySecret;
      settings.payment.gatewayAccounts[existingIndex].name = accountName || settings.payment.gatewayAccounts[existingIndex].name;
    } else {
      settings.payment.gatewayAccounts.push(newAccount);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Gateway added successfully! Configure it to activate.",
      data: { gatewayAccounts: settings.payment.gatewayAccounts }
    });

  } catch (error) {
    console.error("Save gateway error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save gateway"
    });
  }
};

// confugureGateway
export const configureGateway = async (req, res) => {
  try {
    const { gatewayKey } = req.params;
    const {
      razorpayKeyId,
      razorpayKeySecret,
      upiId,
      upiName,
      stripePublishableKey,
      stripeSecretKey,
    } = req.body;

    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found"
      });
    }

    const [type, accountId] = gatewayKey.split('_');
    const accountIndex = settings.payment.gatewayAccounts.findIndex(
      acc => acc.id === accountId && acc.type === type
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Gateway account not found"
      });
    }

    const account = settings.payment.gatewayAccounts[accountIndex];

    if (type === 'RAZORPAY') {
      account.keyId = razorpayKeyId || account.keyId;
      account.keySecret = razorpayKeySecret || account.keySecret;
    } else if (type === 'UPI') {
      account.upiId = upiId || account.upiId;
      account.upiName = upiName || account.upiName;
    } else if (type === 'STRIPE') {
      account.stripePublishableKey = stripePublishableKey || account.stripePublishableKey;
      account.stripeSecretKey = stripeSecretKey || account.stripeSecretKey;
    }

    account.isActive = true;
    account.isConfigured = true;

    settings.payment.gatewayAccounts.forEach(acc => {
      if (acc.type === type) {
        acc.isPrimary = false;
      }
    });
    
    account.isPrimary = true;

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Gateway configured and activated successfully!",
      data: { isActive: true, isConfigured: true, isPrimary: account.isPrimary }
    });

  } catch (error) {
    console.error("Configure gateway error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to configure gateway"
    });
  }
};

// connect and disconnect gateway
export const toggleGateway = async (req, res) => {
  try {
    const { gatewayKey } = req.params;
    const { action } = req.body;

    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found"
      });
    }

    const [type, accountId] = gatewayKey.split('_');
    const accountIndex = settings.payment.gatewayAccounts.findIndex(
      acc => acc.id === accountId && acc.type === type
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Gateway account not found"
      });
    }

    const account = settings.payment.gatewayAccounts[accountIndex];

    if (action === 'disconnect') {
      account.isActive = false;
      
      if (account.isPrimary) {
        account.isPrimary = false;
        const nextActive = settings.payment.gatewayAccounts.find(
          a => a.type === type && a.isActive && a.id !== accountId
        );
        if (nextActive) {
          nextActive.isPrimary = true;
        }
      }
      
      await settings.save();

      res.status(200).json({
        success: true,
        message: "Gateway disconnected successfully!",
        data: settings.payment.gatewayAccounts
      });

    } else if (action === 'connect') {
      account.isActive = true;
      
      const hasPrimary = settings.payment.gatewayAccounts.some(
        a => a.type === type && a.isPrimary && a.isActive
      );
      
      if (!hasPrimary) {
        account.isPrimary = true;
      }

      await settings.save();

      res.status(200).json({
        success: true,
        message: "Gateway connected successfully!",
        data: settings.payment.gatewayAccounts
      });
    }

  } catch (error) {
    console.error("Toggle gateway error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle gateway"
    });
  }
};

//set primary 
export const setPrimaryGateway = async (req, res) => {
  try {
    const { gatewayKey } = req.body;

    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found"
      });
    }

    const [type, accountId] = gatewayKey.split('_');

    settings.payment.gatewayAccounts.forEach(acc => {
      if (acc.type === type) {
        acc.isPrimary = false;
      }
    });

    const accountIndex = settings.payment.gatewayAccounts.findIndex(
      acc => acc.id === accountId && acc.type === type
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Gateway account not found"
      });
    }

    if (!settings.payment.gatewayAccounts[accountIndex].isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot set inactive gateway as Primary"
      });
    }

    settings.payment.gatewayAccounts[accountIndex].isPrimary = true;
    await settings.save();

    res.status(200).json({
      success: true,
      message: `Primary ${type} gateway set to ${settings.payment.gatewayAccounts[accountIndex].name}`,
      data: { primaryGateway: gatewayKey }
    });

  } catch (error) {
    console.error("Set primary error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to set primary gateway"
    });
  }
};

//to test razorpay id adn secreatkey
export const testRazorpayConnection = async (req, res) => {
  try {
    const { keyId, keySecret } = req.body;
    
    if (!keyId || !keySecret) {
      return res.status(400).json({
        success: false,
        message: "Key ID and Key Secret are required"
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    
    const order = await razorpay.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'test_' + Date.now(),
      payment_capture: 1,
    });

    res.json({
      success: true,
      message: "✅ Connection successful!",
      data: { orderId: order.id }
    });

  } catch (error) {
    console.error("Test connection error:", error);
    res.status(400).json({
      success: false,
      message: "❌ Connection failed: " + error.message
    });
  }
};
// ========== GST Settings ==========

export const getGSTSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne().select("gst");
    res.status(200).json({
      success: true,
      data: settings?.gst || {
        gstNumber: "",
        legalBusinessName: "",
        panNumber: "",
        hsnCode: "",
        registrationState: "",
        accountantEmail: "",
        defaultRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        supplyType: "Intra-state (CGST + SGST)",
        filingFrequency: "Monthly"
      }
    });
  } catch (error) {
    console.error("Error in getGSTSettings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGSTSettings = async (req, res) => {
  try {
    const {
      gstNumber,
      legalBusinessName,
      panNumber,
      hsnCode,
      registrationState,
      accountantEmail,
      defaultRate,
      cgstRate,
      sgstRate,
      supplyType,
      filingFrequency
    } = req.body
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      {
        gst: {
          gstNumber,
          legalBusinessName,
          panNumber,
          hsnCode,
          registrationState,
          accountantEmail,
          defaultRate,
          cgstRate,
          sgstRate,
          supplyType,
          filingFrequency
        }
      },
      { new: true, upsert: true }
    );
    res.status(200).json({
      success: true,
      message: "GST settings updated successfully",
      data: settings.gst
    });
  } catch (error) {
    console.error("Error in updateGSTSettings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== End GST Settings ==========

