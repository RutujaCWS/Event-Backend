import Notification from '../model/notificationSchema.js';
import User from '../model/userSchema.js';

/**
 * Create a single notification for a user.
 */
export const createNotification = async ({
  userId,
  type,
  message,
  enquiryRef = null,
  quotationRef = null,
  bookingRef = null,
  paymentRef = null,
  staffRef = null,
  triggeredBy = null,
}) => {
  if (!userId) return null;

  const notification = new Notification({
    user: userId,
    type,
    message,
    enquiryRef,
    quotationRef,
    bookingRef,
    paymentRef,
    staffRef,
    triggeredBy,
  });

  await notification.save();
  return notification;
};

/**
 * Create notifications for multiple users (e.g., all admins).
 */
export const createNotificationsForUsers = async ({
  userIds,
  type,
  message,
  enquiryRef = null,
  quotationRef = null,
  bookingRef = null,
  paymentRef = null,
  staffRef = null,
  triggeredBy = null,
}) => {
  if (!userIds || userIds.length === 0) return [];

  const notifications = userIds.map((userId) => ({
    user: userId,
    type,
    message,
    enquiryRef,
    quotationRef,
    bookingRef,
    paymentRef,
    staffRef,
    triggeredBy,
  }));

  const result = await Notification.insertMany(notifications);
  return result;
};

/**
 * Get all admin user IDs (active).
 */
export const getAdminUserIds = async () => {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  return admins.map((a) => a._id);
};