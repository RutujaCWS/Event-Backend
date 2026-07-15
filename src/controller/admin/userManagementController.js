import User from "../../model/userSchema.js";
import bcrypt from "bcryptjs";
import AdminSettings from "../../model/adminSettingsSchema.js";
import { validatePassword, validateName, validateEmail, validateMobile } from "../../utils/validators.js";

// ========== nutan changes -26-06-2026 ==========
import { getAdminUserIds, createNotificationsForUsers, createNotification } from "../../services/notificationService.js";
// ========== end nutan changes -26-06-2026 ==========

const generateEmployeeId = async () => {
  const lastStaff = await User.findOne(
    { role: "staff", employeeId: { $exists: true, $ne: null } },
    { employeeId: 1 },
    { sort: { employeeId: -1 } }
  );

  let nextNumber = 1;
  if (lastStaff && lastStaff.employeeId) {
    const match = lastStaff.employeeId.match(/^EMP(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  return `EMP${nextNumber.toString().padStart(3, '0')}`;
};

// ==================== GET ALL USERS ====================
export const getStaffList = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ["staff", "customer"]};
    }
    if (status) {
      query.isActive = status === "active";
    }
    if (search) {
      query.$or = [
        { name: {$regex: search, $options: "i" }},
        {email: {$regex: search, $options: "i"}},
        {mobile: {$regex: search, $options: "i"}}
      ];
    }
    const users = await User.find(query).select("-password -otp -otpExpiry").sort({createdAt: -1});
    res.status(200).json(users);
  } catch (error) {
    console.error("get user list err:", error);
    res.status(500).json({ success: false, message: "Internal server error"});
  }
};

// ==================== GET USER BY ID ====================
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await User.findById(id).select("-password -otp -otpExpiry");
    if (!staff || !["staff", "customer"].includes(staff.role)) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json(staff);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== CREATE STAFF ====================
export const createStaff = async (req, res) => {
  try {
    const {
      name, email, mobile, password, dateOfJoining,
      emergencyContact, profileImage, address, permissions, isActive
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Name, email, mobile and password are required" });
    }

    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ success: false, message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ success: false, message: emailErr });

    const mobileErr = validateMobile(mobile);
    if (mobileErr) return res.status(400).json({ success: false, message: mobileErr });

    const pwdErr = validatePassword(password);
    if (pwdErr) return res.status(400).json({ success: false, message: pwdErr });

    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
      if (existing.mobile === mobile) {
        return res.status(409).json({ success: false, message: "Mobile already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // this fetch the default permission from the setting
    const settings = await AdminSettings.findOne().select("defaultStaffPermissions");
    const defaultPerms = settings?.defaultStaffPermissions || {
      enquiries: true,
      events: true,
      tasks: true,
      schedule: true,
      statusUpdates: true,
      viewPayments: true,
      recordPayments: false,
    }

    let saved = false;
    let retries = 0;
    let staff;

    while (!saved && retries < 5) {
      const employeeId = await generateEmployeeId();

      staff = new User({
        name,
        email,
        mobile,
        password: hashedPassword,
        role: "staff",
        employeeId,
        dateOfJoining: dateOfJoining || null,
        emergencyContact: emergencyContact || "",
        profileImage: profileImage || "",
        address: address || {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        permissions: permissions || defaultPerms,
        isActive: isActive !== undefined ? isActive : true,
        isMobileVerified: true,
        isEmailVerified: true,
      });

      try {
        await staff.save();
        saved = true;
      } catch (err) {
        if (err.code === 11000 && err.keyPattern?.employeeId) {
          retries++;
          continue;
        }
        throw err;
      }
    }

    if (!saved) {
      return res.status(500).json({ success: false, message: "Failed to generate unique employee ID after multiple attempts" });
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password;
    delete staffResponse.otp;
    delete staffResponse.otpExpiry;

    // ========== nutan changes -26-06-2026 ==========
    const adminIds = await getAdminUserIds();
    await createNotificationsForUsers({
      userIds: adminIds,
      type: "SYSTEM_ALERT",
      message: `New staff member ${name} (${email}) has been added.`,
      triggeredBy: req.user._id,
    });

    await createNotification({
      userId: staff._id,
      type: "SYSTEM_ALERT",
      message: `Welcome ${name}! You have been added as a staff member. Please log in.`,
      triggeredBy: req.user._id,
    });
    // ========== end nutan changes -26-06-2026 ==========

    res.status(201).json({ success: true, message: "Staff created successfully", staff: staffResponse });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// ==================== UPDATE STAFF ====================
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedUpdates = [
      "name", "email", "mobile", "dateOfJoining",
      "emergencyContact", "profileImage", "address", "permissions", "isActive"
    ];

    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
    });

    if (updates.password && updates.password.trim() !== "") {
      filteredUpdates.password = await bcrypt.hash(updates.password, 10);
    }

    const staff = await User.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry");

    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.status(200).json({ success: true, message: "Staff updated successfully", staff });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== DELETE STAFF ====================
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await User.findByIdAndDelete(id);
    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }
    res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== TOGGLE ACTIVE STATUS ====================
export const toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user || !["staff","customer"].includes(user.role)) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = isActive;
    await user.save();

    // ========== nutan changes -26-06-2026 ==========
    const adminIds = await getAdminUserIds();
    await createNotificationsForUsers({
      userIds: adminIds,
      type: "SYSTEM_ALERT",
      message: `User ${user.name} (${user.role}) has been ${isActive ? "enabled" : "disabled"}.`,
      triggeredBy: req.user._id,
    });

    await createNotification({
      userId: user._id,
      type: "SYSTEM_ALERT",
      message: `Your account has been ${isActive ? "enabled" : "disabled"} by admin.`,
      triggeredBy: req.user._id,
    });
    // ========== end nutan changes -26-06-2026 ==========

    res.status(200).json({ success: true, message: `User ${isActive ? "enabled" : "disabled"}`, isActive });
  } catch (error) {
    console.error("Toggle active error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== GET USER STATS ====================
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ["staff", "customer"]}});
    const activeUsers = await User.countDocuments({ role: { $in: ["staff", "customer"]}, isActive: true });
    const customerCount = await User.countDocuments( { role:"customer" });
    const staffCount = await User.countDocuments( { role:"staff" });
    const inactiveUsers = await User.countDocuments({ role: { $in: ["staff", "customer"]}, isActive: false });

    res.status(200).json({
      totalUsers,
      activeUsers,
      customerCount,
      staffCount,
      inactiveUsers
    });
  } catch (error) {
    console.error("get user stats error:", error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};