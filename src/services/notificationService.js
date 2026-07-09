import Notification from '../model/notificationSchema.js';
import User from '../model/userSchema.js';

// ========== nutan changes -26-06-2026 ==========

/**
 * Create a single notification for a user.
 * ✅ Duplicate prevention – checks for similar notification in last 5 seconds
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

  // ✅ Build dynamic query – only include fields that are not null/undefined
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  const query = { user: userId, type, createdAt: { $gte: fiveSecondsAgo } };
  if (enquiryRef) query.enquiryRef = enquiryRef;
  if (quotationRef) query.quotationRef = quotationRef;
  if (bookingRef) query.bookingRef = bookingRef;
  if (paymentRef) query.paymentRef = paymentRef;
  if (staffRef) query.staffRef = staffRef;

  const existing = await Notification.findOne(query);

  if (existing) {
    console.log(`⚠️ Duplicate prevented for user ${userId}, type ${type}`);
    return existing;
  }

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
 * ✅ Duplicate prevention per user – checks for similar notification in last 5 seconds
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

  const fiveSecondsAgo = new Date(Date.now() - 5000);
  const notificationsToCreate = [];

  for (const userId of userIds) {
    // ✅ Build dynamic query
    const query = { user: userId, type, createdAt: { $gte: fiveSecondsAgo } };
    if (enquiryRef) query.enquiryRef = enquiryRef;
    if (quotationRef) query.quotationRef = quotationRef;
    if (bookingRef) query.bookingRef = bookingRef;
    if (paymentRef) query.paymentRef = paymentRef;
    if (staffRef) query.staffRef = staffRef;

    const existing = await Notification.findOne(query);
    if (!existing) {
      notificationsToCreate.push({
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
    }
  }

  if (notificationsToCreate.length === 0) return [];
  const result = await Notification.insertMany(notificationsToCreate);
  return result;
};

/**
 * Get all admin user IDs (active).
 */
export const getAdminUserIds = async () => {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  return admins.map((a) => a._id);
};

