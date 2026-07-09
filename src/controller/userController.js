import User from "../model/userSchema.js";
import { sendEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OTP from "../model/otpModel.js";
import {
  validateName,
  validateMobile,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateTerms
} from "../utils/validators.js";
import Enquiry from "../model/enquirySchema.js";
import cloudinary from "../config/cloudinary.js";

// ========== nutan changes -26-06-2026 ==========
import { getAdminUserIds, createNotificationsForUsers, createNotification } from "../services/notificationService.js";
// ========== end nutan changes ==========

// ==================== REGISTER USER ====================
export const registerUser = async (req, res) => {
  try {
    const { fullName, mobile, email, password, confirmPassword, termsAccepted } = req.body;

    const nameErr = validateName(fullName);
    if (nameErr) return res.status(400).json({ success: false, message: nameErr });

    const mobileErr = validateMobile(mobile);
    if (mobileErr) return res.status(400).json({ success: false, message: mobileErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ success: false, message: emailErr });

    const pwdErr = validatePassword(password);
    if (pwdErr) return res.status(400).json({ success: false, message: pwdErr });

    const confirmErr = validateConfirmPassword(confirmPassword, password);
    if (confirmErr) return res.status(400).json({ success: false, message: confirmErr });

    const termsErr = validateTerms(termsAccepted);
    if (termsErr) return res.status(400).json({ success: false, message: termsErr });

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ success: false, message: "Email already exists." });
      }
      if (existingUser.mobile === mobile) {
        return res.status(409).json({ success: false, message: "Mobile number already exists." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: fullName.trim(),
      email,
      mobile,
      password: hashedPassword,
      role: "customer",
      isActive: true,
      isMobileVerified: true,
      isEmailVerified: true,
      termsAccepted: true,
    });

    // Link existing enquiries
    await Enquiry.updateMany(
      { email: user.email, customerId: null },
      { customerId: user._id }
    );

    // ========== nutan changes -26-06-2026 ==========
    const adminIds = await getAdminUserIds();
    await createNotificationsForUsers({
      userIds: adminIds,
      type: "SYSTEM_ALERT",
      message: `New customer ${fullName} (${email}) has registered.`,
      triggeredBy: user._id,
    });

    await createNotification({
      userId: user._id,
      type: "SYSTEM_ALERT",
      message: `Welcome ${fullName}! Your account has been created successfully.`,
      triggeredBy: user._id,
    });
    // ========== end nutan changes ==========

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please log in.",
      user: {
        id: user._id,
        fullName: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== LOGIN USER ====================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled. Contact admin." });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        return res.status(423).json({
          success: false,
          message: "Too many failed attempts. Account locked for 15 minutes."
        });
      }

      await user.save();
      const remainingAttempts = 5 - user.loginAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remainingAttempts} attempts remaining.`
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.SESSION_TIMEOUT || "12h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== FORGOT PASSWORD ====================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const html = `
      <h2>Reset Password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
    `;

    await sendEmail(user.email, "Password Reset Link", html);

    res.json({
      success: true,
      message: "Reset link sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== RESET PASSWORD (with OTP) ====================
export const resetPassword = async (req, res) => {
  try {
    const { mobile, otpCode, password } = req.body;

    if (!mobile || !otpCode || !password) {
      return res.status(400).json({ success: false, message: "Mobile, OTP, and new password are required." });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const otpRecord = await OTP.findOne({
      identifier: mobile,
      code: otpCode,
      purpose: "password_reset",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Change Password Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== RESET PASSWORD (with Token) ====================
export const resetPasswordWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and password are required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("Reset password with token error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ success: false, message: "Reset token has expired." });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==================== MY PROFILE ====================
export const myProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: req.user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      emergencyContact,
      address,
      profileImage,
      gstin,
      eventPreferences,
    } = req.body;

    const updateData = {
      name,
      mobile,
      email,
      emergencyContact,
      address,
      profileImage,
      gstin,
      eventPreferences,
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -loginAttempts -lockUntil");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProfileStats = async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments({
      customerId: req.user._id,
    });

    const convertedEvents = await Enquiry.countDocuments({
      customerId: req.user._id,
      status: "Converted",
    });

    const quotationsSent = await Enquiry.countDocuments({
      customerId: req.user._id,
      status: "Quotation Sent",
    });

    const pendingEnquiries = await Enquiry.countDocuments({
      customerId: req.user._id,
      status: "New",
    });

    res.status(200).json({
      success: true,
      totalEnquiries,
      convertedEvents,
      quotationsSent,
      pendingEnquiries,
    });
  } catch (error) {
    console.error("Profile stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRecentEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      customerId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      enquiries,
    });
  } catch (error) {
    console.error("Recent enquiries error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'profile_images',
          transformation: [{ width: 500, height: 500, crop: 'limit' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const imageUrl = result.secure_url;

    // Save Cloudinary URL in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      profileImage: imageUrl,
      user,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};
