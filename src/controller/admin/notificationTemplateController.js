import NotificationTemplate from "../../model/notificationTemplateSchema.js";

// ================================
// Get Notification Settings
// ================================
export const getNotificationSettings = async (req, res) => {
  try {
    let settings = await NotificationTemplate.findOne();

    if (!settings) {
      settings = await NotificationTemplate.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get Notification Settings Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// Update Global Notification Settings
// ================================
export const updateNotificationSettings = async (req, res) => {
  try {
    const {
      emailNotifications,
      smsNotifications,
      whatsappNotifications,
      senderEmail,
      replyToEmail,
    } = req.body;

    const updateData = {};

    if (emailNotifications !== undefined) {
      updateData["globalSettings.emailNotifications"] =
        emailNotifications;
    }

    if (smsNotifications !== undefined) {
      updateData["globalSettings.smsNotifications"] =
        smsNotifications;
    }

    if (whatsappNotifications !== undefined) {
      updateData["globalSettings.whatsappNotifications"] =
        whatsappNotifications;
    }

    if (senderEmail !== undefined) {
      updateData["globalSettings.senderEmail"] = senderEmail;
    }

    if (replyToEmail !== undefined) {
      updateData["globalSettings.replyToEmail"] = replyToEmail;
    }

    const settings = await NotificationTemplate.findOneAndUpdate(
      {},
      {
        $set: updateData,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("Update Notification Settings Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// Update Individual Template
// ================================
export const updateTemplate = async (req, res) => {
  try {
    const { template } = req.params;
    const { title, channels, content } = req.body;

    const allowedTemplates = [
      "bookingConfirmation",
      "paymentReminder",
      "quotationSent",
      "insertVariables",
    ];

    if (!allowedTemplates.includes(template)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template name.",
      });
    }

    let settings = await NotificationTemplate.findOne();

    if (!settings) {
      settings = await NotificationTemplate.create({});
    }

    if (title !== undefined) {
      settings.templates[template].title = title;
    }

    if (channels !== undefined) {
      settings.templates[template].channels = channels;
    }

    if (content !== undefined) {
      settings.templates[template].content = content;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: `${template} updated successfully.`,
      data: settings.templates[template],
    });
  } catch (error) {
    console.error("Update Template Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// Reset Templates
// ================================
export const resetTemplates = async (req, res) => {
  try {
    const existing = await NotificationTemplate.findOne();

    if (existing) {
      await existing.deleteOne();
    }

    const settings = await NotificationTemplate.create({});

    res.status(200).json({
      success: true,
      message: "Templates reset successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("Reset Templates Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};