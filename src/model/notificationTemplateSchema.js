import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
  {
    globalSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },

      smsNotifications: {
        type: Boolean,
        default: true,
      },

      whatsappNotifications: {
        type: Boolean,
        default: true,
      },

      senderEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid sender email"],
      },

      replyToEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid reply-to email"],
      },
    },

    templates: {
      bookingConfirmation: {
        title: {
          type: String,
          default: "Standard Confirmation",
          trim: true,
        },

        channels: {
          type: [
            {
              type: String,
              enum: ["EMAIL", "SMS", "WHATSAPP"],
            },
          ],
          default: ["WHATSAPP", "EMAIL"],
        },

        content: {
          type: String,
          default: "",
          trim: true,
        },
      },

      paymentReminder: {
        title: {
          type: String,
          default: "Deposit Due Reminder",
          trim: true,
        },

        channels: {
          type: [
            {
              type: String,
              enum: ["EMAIL", "SMS", "WHATSAPP"],
            },
          ],
          default: ["SMS"],
        },

        content: {
          type: String,
          default: "",
          trim: true,
        },
      },

      quotationSent: {
        title: {
          type: String,
          default: "New Quote Notification",
          trim: true,
        },

        channels: {
          type: [
            {
              type: String,
              enum: ["EMAIL", "SMS", "WHATSAPP"],
            },
          ],
          default: ["EMAIL"],
        },

        content: {
          type: String,
          default: "",
          trim: true,
        },
      },

      insertVariables: {
        title: {
          type: String,
          default: "Insert Variables",
          trim: true,
        },

        channels: {
          type: [
            {
              type: String,
              enum: ["EMAIL", "SMS", "WHATSAPP"],
            },
          ],
          default: ["EMAIL"],
        },

        content: {
          type: String,
          default: "",
          trim: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "NotificationTemplate",
  notificationTemplateSchema
);