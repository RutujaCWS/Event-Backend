import User from "../model/userSchema.js";
import { sendEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validateName,
  validateMobile,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateTerms
} from "../utils/validators.js";
import Enquiry from "../model/enquirySchema.js";



// ==================== REGISTER USER (NO TOKEN) ====================
export const registerUser = async (req, res) => {
  try {
    const { fullName, mobile, email, password, confirmPassword, termsAccepted } = req.body;

    // Field validations
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

    // Check duplicate email/mobile
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

    await Enquiry.updateMany(
      { 
        email: user.email,
        customerId: null 
      },
      { 
        customerId: user._id 
      }
    );

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

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // 1. Find user by email only
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 2. Ensure account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled. Contact admin." });
    }

    // 3. Ensure account is not temporarily locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ 
        success: false, 
        message: `Account is temporarily locked. Try again in ${remainingTime} minutes.` 
      });
    }

    // 4. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Failed login: Increment attempts
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        user.loginAttempts = 0; // Reset counter for next cycle
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

    // 5. Success: Clear lockout counters
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // 6. Generate token with the configurable session timeout
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
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

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

    const resetLink =
      `http://localhost:5173/reset-password/${token}`;

    const html = `
      <h2>Reset Password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
    `;

    await sendEmail(
      user.email,
      "Password Reset Link",
      html
    );

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

export const resetPassword = async (req, res) => {
  try {
    const { mobile, otpCode, password } = req.body;

    if (!mobile || !otpCode || !password) {
      return res.status(400).json({ success: false, message: "Mobile, OTP, and new password are required." });
    }

    // 1. Verify that the user exists
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 2. Find and verify matching OTP
    const otpRecord = await OTP.findOne({
      identifier: mobile,
      code: otpCode,
      purpose: "password_reset",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // 3. Hash the new password and update user record
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    
    // Clear any lockout block if they reset successfully
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // 4. Delete the used OTP
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