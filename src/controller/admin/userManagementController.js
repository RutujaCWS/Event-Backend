import User from "../../model/userSchema.js";
import bcrypt from "bcryptjs";

// ==================== HELPER FUNCTION ====================

const generateEmployeeId = async () => {
  // Find staff with an employeeId, sorted descending by employeeId
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

// ==================== USER MANAGEMENT (ADMIN ONLY) ====================

// Get all staff members
export const getStaffList = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = {};
    // Role filter (staff or custoomber :) 
    if (role) {
      query.role = role;
        } else {
          query.role = { $in: ["staff", "customer"]};
        }

        // Activa status filter
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
    const user = await User.find(query).select("-password -otp -otpExpiry").sort({createdAt: -1});
    res.status(200).json(user);
  } catch (error) {
    console.error("get user list errrrrr:", error);
    res.status(500).json({ success: false, message: "Internal server error"});
  }
};



// Get single staff by ID
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

// Create new staff (employeeId auto-generated)
export const createStaff = async (req, res) => {
  try {
    const {
      name, email, mobile, password, dateOfJoining,
      emergencyContact, profileImage, address, permissions, isActive
    } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Name, email, mobile and password are required" });
    }

    // Check duplicate email/mobile
    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ success: false, message: "Email already exists" });
      }
      if (existing.mobile === mobile) {
        return res.status(409).json({ success: false, message: "Mobile already exists" });
      }
    }

    // Hash password (do once)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Attempt to save with unique employeeId (retry on duplicate key)
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
        permissions: permissions || {
          enquiries: true,
          events: true,
          tasks: true,
          schedule: true,
          statusUpdates: true,
          viewPayments: true,
          recordPayments: false,
        },
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
        throw err; // other error
      }
    }

    if (!saved) {
      return res.status(500).json({ success: false, message: "Failed to generate unique employee ID after multiple attempts" });
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password;
    delete staffResponse.otp;
    delete staffResponse.otpExpiry;

    res.status(201).json({ success: true, message: "Staff created successfully", staff: staffResponse });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// Update staff (employeeId cannot be changed, not allowed in updates)
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

    // If password provided, hash it
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

// Delete staff
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

// Toggle active status
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

    res.status(200).json({ success: true, message: `User ${isActive ? "enabled" : "disabled"}`, isActive });
  } catch (error) {
    console.error("Toggle active error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// get user registration and active stats

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
    console.error("get user stats errrr: ", error);
    res.status(500).json({ success: false, message: "internal server error" });
  }
};