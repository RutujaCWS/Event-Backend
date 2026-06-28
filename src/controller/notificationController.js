import Notification from '../model/notificationSchema.js';

/**
 * Get notifications for the logged-in user with role-based filtering.
 */
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    // Role-based visibility
    if (req.user.role === 'admin') {
      query = {};
    } else if (req.user.role === 'staff') {
      query = {
        $or: [{ user: req.user._id }, { staffRef: req.user._id }],
      };
    } else {
      query = { user: req.user._id };
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('enquiryRef', 'eventType fullName mobileNumber')
        .populate('quotationRef', 'quotationNumber totalAmount')
        .populate('bookingRef', 'eventDate totalAmount')
        // .populate('paymentRef', 'amount paymentMethod') // Commented – Payment model may not exist
        .populate('staffRef', 'name email')
        .populate('triggeredBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
    ]);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get unread notification count for the current user.
 */
export const getUnreadCount = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      query = {};
    } else if (req.user.role === 'staff') {
      query = {
        $or: [{ user: req.user._id }, { staffRef: req.user._id }],
      };
    } else {
      query = { user: req.user._id };
    }

    const count = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };
    if (req.user.role === 'admin') {
      // admin can mark any as read
    } else if (req.user.role === 'staff') {
      query = { $or: [{ user: req.user._id }, { staffRef: req.user._id }] };
    } else {
      query = { user: req.user._id };
    }

    const notification = await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or not accessible' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Mark all notifications as read for the current user.
 */
export const markAllAsRead = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'admin') {
      query = {};
    } else if (req.user.role === 'staff') {
      query = {
        $or: [{ user: req.user._id }, { staffRef: req.user._id }],
      };
    } else {
      query = { user: req.user._id };
    }

    await Notification.updateMany(
      { ...query, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a notification.
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };
    if (req.user.role !== 'admin') {
      query = { ...query, user: req.user._id };
    }

    const deleted = await Notification.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found or not accessible' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};