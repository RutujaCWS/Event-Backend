// // import OTP from "../model/otpModel.js";
// // import User from "../model/userSchema.js";
// // import { generateOTP } from "../utils/generateOTP.js";
// // import { sendSMS } from "../services/smsService.js";
// // import { sendEmail } from "../services/sendEmail.js";
// // import jwt from "jsonwebtoken";


// // // ==================== MOBILE OTP (Registration) ====================
// // export const sendMobileOtp = async (req, res) => {
// //   try {
// //     const { mobile } = req.body;
// //     if (!mobile || !/^\d{10}$/.test(mobile)) {
// //       return res.status(400).json({ error: "Valid 10-digit mobile number required" });
// //     }

// //     // Check if mobile already verified
// //     const existingUser = await User.findOne({ mobile, isMobileVerified: true });
// //     if (existingUser) {
// //       return res.status(409).json({ error: "Mobile already registered and verified" });
// //     }

// //     const otpCode = generateOTP();
// //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

// //     await OTP.deleteMany({ identifier: mobile, purpose: "mobile_verification" });
// //     await OTP.create({
// //       identifier: mobile,
// //       code: otpCode,
// //       purpose: "mobile_verification",
// //       expiresAt,
// //     });

// //     await sendSMS(mobile, `Your OTP for event registration is ${otpCode}. Valid for 5 minutes.`);

// //     res.json({ message: "OTP sent to mobile" ,
// //     otp: otpCode,});
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };

// // export const verifyMobileOtp = async (req, res) => {
// //   try {
// //     const { mobile, otpCode } = req.body;
// //     if (!mobile || !otpCode) {
// //       return res.status(400).json({ error: "Mobile and OTP are required" });
// //     }

// //     const otpRecord = await OTP.findOne({
// //       identifier: mobile,
// //       code: otpCode,
// //       purpose: "mobile_verification",
// //       expiresAt: { $gt: new Date() },
// //     });

// //     if (!otpRecord) {
// //       return res.status(400).json({ error: "Invalid or expired OTP" });
// //     }

// //     await OTP.deleteOne({ _id: otpRecord._id });
// //     res.json({ message: "Mobile verified successfully" });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };

// // // ==================== MOBILE OTP (Login) ====================
// // export const sendLoginOtp = async (req, res) => {
// //   try {
// //     const { mobile } = req.body;
// //     if (!mobile || !/^\d{10}$/.test(mobile)) {
// //       return res.status(400).json({ error: "Valid 10-digit mobile number required" });
// //     }

// //     // 1. Ensure the user exists
// //     const user = await User.findOne({ mobile });
// //     if (!user) {
// //       return res.status(404).json({ error: "User with this mobile number does not exist." });
// //     }

// //     // 2. Ensure account is active and not locked
// //     if (!user.isActive) {
// //       return res.status(403).json({ error: "Account is disabled. Contact admin." });
// //     }
// //     if (user.lockUntil && user.lockUntil > Date.now()) {
// //       const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
// //       return res.status(423).json({ error: `Account is locked. Try again in ${remainingTime} minutes.` });
// //     }

// //     // 3. Enforce 60-second resend limit
// //     const existingOtp = await OTP.findOne({ identifier: mobile, purpose: "login" });
// //     if (existingOtp) {
// //       const secondsElapsed = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
// //       if (secondsElapsed < 60) {
// //         return res.status(429).json({ error: `Please wait ${60 - secondsElapsed} seconds before requesting a new OTP.` });
// //       }
// //     }

// //     // 4. Generate & Save OTP
// //     const otpCode = generateOTP();
// //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

// //     // Clean up old login OTPs and create new one
// //     await OTP.deleteMany({ identifier: mobile, purpose: "login" });
// //     await OTP.create({
// //       identifier: mobile,
// //       code: otpCode,
// //       purpose: "login",
// //       expiresAt,
// //     });

// //     // 5. Send OTP SMS
// //     await sendSMS(mobile, `Your login OTP is ${otpCode}. Valid for 5 minutes.`);

// //     res.json({ message: "OTP sent to your mobile number",otp: otpCode });
// //   } catch (error) {
// //     console.error("Send login OTP error:", error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };


// // export const verifyLoginOtp = async (req, res) => {
// //   try {
// //     const { mobile, otpCode } = req.body;
// //     if (!mobile || !otpCode) {
// //       return res.status(400).json({ error: "Mobile and OTP are required" });
// //     }
// //     const user = await User.findOne({ mobile });
// //     if (!user) {
// //       return res.status(404).json({ error: "User not found" });
// //     }
// //     // 1. Ensure account is not locked
// //     if (user.lockUntil && user.lockUntil > Date.now()) {
// //       const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
// //       return res.status(423).json({ error: `Account is temporarily locked. Try again in ${remainingTime} minutes.` });
// //     }
// //     // 2. Verify OTP
// //     const otpRecord = await OTP.findOne({
// //       identifier: mobile,
// //       code: otpCode,
// //       purpose: "login",
// //       expiresAt: { $gt: new Date() },
// //     });
// //     if (!otpRecord) {
// //       // Failed attempt: Increment counter
// //       user.loginAttempts += 1;
// //       if (user.loginAttempts >= 5) {
// //         user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
// //         user.loginAttempts = 0; // Reset counter
// //         await user.save();
// //         return res.status(423).json({ error: "Too many failed attempts. Account locked for 15 minutes." });
// //       }
// //       await user.save();

// //       const attemptsRemaining = 5 - user.loginAttempts;
// //       return res.status(400).json({
// //         error: `Invalid or expired OTP. ${attemptsRemaining} attempts remaining.`
// //       });
// //     }
// //     // 3. Success: Clear OTP and reset lockout attempts
// //     await OTP.deleteOne({ _id: otpRecord._id });

// //     user.loginAttempts = 0;
// //     user.lockUntil = null;
// //     user.lastLogin = new Date();
// //     await user.save();
// //     // 4. Generate token with the configurable timeout from .env
// //     const token = jwt.sign(
// //       { userId: user._id, role: user.role },
// //       process.env.JWT_SECRET,
// //       { expiresIn: process.env.SESSION_TIMEOUT || "12h" }
// //     );
// //     res.json({
// //       success: true,
// //       message: "Login successful",
// //       token,
// //       user: {
// //         id: user._id,
// //         fullName: user.name,
// //         email: user.email,
// //         mobile: user.mobile,
// //         role: user.role,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Verify login OTP error:", error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };

// // // ==================== EMAIL OTP (Registration) ====================
// // export const sendEmailOtp = async (req, res) => {
// //   try {
// //     const { email } = req.body;
// //     if (!email || !/\S+@\S+\.\S+/.test(email)) {
// //       return res.status(400).json({ error: "Valid email required" });
// //     }

// //     const existingUser = await User.findOne({ email, isEmailVerified: true });
// //     if (existingUser) {
// //       return res.status(409).json({ error: "Email already registered and verified" });
// //     }

// //     const otpCode = generateOTP();
// //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

// //     await OTP.deleteMany({ identifier: email, purpose: "email_verification" });
// //     await OTP.create({
// //       identifier: email,
// //       code: otpCode,
// //       purpose: "email_verification",
// //       expiresAt,
// //     });

// //     const html = `<p>Your OTP for email verification is <b>${otpCode}</b>. It expires in 5 minutes.</p>`;
// //     // await sendEmail(email, "Email Verification OTP", html);
// //     await sendEmail({
// //       to: email,
// //       subject: "Email Verification OTP", 
// //       html: html
// //     });

// //     console.log(`✅ OTP email sent successfully to ${email}`);

// //     res.json({ message: "OTP sent to email" });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };

// // export const verifyEmailOtp = async (req, res) => {
// //   try {
// //     const { email, otpCode } = req.body;
// //     if (!email || !otpCode) {
// //       return res.status(400).json({ error: "Email and OTP are required" });
// //     }

// //     const otpRecord = await OTP.findOne({
// //       identifier: email,
// //       code: otpCode,
// //       purpose: "email_verification",
// //       expiresAt: { $gt: new Date() },
// //     });

// //     if (!otpRecord) {
// //       return res.status(400).json({ error: "Invalid or expired OTP" });
// //     }

// //     await OTP.deleteOne({ _id: otpRecord._id });
// //     res.json({ message: "Email verified successfully" });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };

// // // ==================== MOBILE OTP (Password Reset) ====================
// // export const sendResetPasswordOtp = async (req, res) => {
// //   try {
// //     const { mobile } = req.body;
// //     if (!mobile || !/^\d{10}$/.test(mobile)) {
// //       return res.status(400).json({ error: "Valid 10-digit mobile number required" });
// //     }

// //     // 1. Check if user exists
// //     const user = await User.findOne({ mobile });
// //     if (!user) {
// //       return res.status(404).json({ error: "User with this mobile number does not exist." });
// //     }

// //     // 2. Enforce 60-second resend limit
// //     const existingOtp = await OTP.findOne({ identifier: mobile, purpose: "password_reset" });
// //     if (existingOtp) {
// //       const secondsElapsed = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
// //       if (secondsElapsed < 60) {
// //         return res.status(429).json({ error: `Please wait ${60 - secondsElapsed} seconds before requesting a new OTP.` });
// //       }
// //     }

// //     // 3. Generate & Save OTP (5 minutes validity)
// //     const otpCode = generateOTP();
// //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

// //     // Clean up old reset OTPs and create new one
// //     await OTP.deleteMany({ identifier: mobile, purpose: "password_reset" });
// //     await OTP.create({
// //       identifier: mobile,
// //       code: otpCode,
// //       purpose: "password_reset",
// //       expiresAt,
// //     });

// //     // 4. Send SMS
// //     await sendSMS(mobile, `Your password reset OTP is ${otpCode}. Valid for 5 minutes.`);

// //     res.json({ message: "Password reset OTP sent to your mobile number" ,otp: otpCode});
// //   } catch (error) {
// //     console.error("Send reset OTP error:", error);
// //     res.status(500).json({ error: "Internal server error" });
// //   }
// // };



// import OTP from "../model/otpModel.js";
// import User from "../model/userSchema.js";
// import AdminSettings from "../model/adminSettingsSchema.js";
// import { generateOTP } from "../utils/generateOTP.js";
// import { sendSMS } from "../services/smsService.js";
// import { sendEmail } from "../services/sendEmail.js";
// import jwt from "jsonwebtoken";

// // ==================== MOBILE OTP (Registration) ====================
// export const sendMobileOtp = async (req, res) => {
//   try {
//     const { mobile } = req.body;
//     if (!mobile || !/^\d{10}$/.test(mobile)) {
//       return res.status(400).json({ error: "Valid 10-digit mobile number required" });
//     }

//     const existingUser = await User.findOne({ mobile, isMobileVerified: true });
//     if (existingUser) {
//       return res.status(409).json({ error: "Mobile already registered and verified" });
//     }

//     // Fetch admin settings for custom sender
//     const settings = await AdminSettings.findOne();
//     const sender = settings?.smsSenderNumber || process.env.TWILIO_PHONE_NUMBER;

//     const otpCode = generateOTP();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await OTP.deleteMany({ identifier: mobile, purpose: "mobile_verification" });
//     await OTP.create({
//       identifier: mobile,
//       code: otpCode,
//       purpose: "mobile_verification",
//       expiresAt,
//     });

//     await sendSMS(mobile, `Your OTP for event registration is ${otpCode}. Valid for 5 minutes.`, sender);

//     res.json({ message: "OTP sent to mobile" });
//     // ❌ DO NOT return otp: otpCode
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const verifyMobileOtp = async (req, res) => {
//   try {
//     const { mobile, otpCode } = req.body;
//     if (!mobile || !otpCode) {
//       return res.status(400).json({ error: "Mobile and OTP are required" });
//     }

//     const otpRecord = await OTP.findOne({
//       identifier: mobile,
//       code: otpCode,
//       purpose: "mobile_verification",
//       expiresAt: { $gt: new Date() },
//     });

//     if (!otpRecord) {
//       return res.status(400).json({ error: "Invalid or expired OTP" });
//     }

//     await OTP.deleteOne({ _id: otpRecord._id });
//     res.json({ message: "Mobile verified successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ==================== MOBILE OTP (Login) ====================
// export const sendLoginOtp = async (req, res) => {
//   try {
//     const { mobile } = req.body;
//     if (!mobile || !/^\d{10}$/.test(mobile)) {
//       return res.status(400).json({ error: "Valid 10-digit mobile number required" });
//     }

//     const user = await User.findOne({ mobile });
//     if (!user) {
//       return res.status(404).json({ error: "User with this mobile number does not exist." });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({ error: "Account is disabled. Contact admin." });
//     }
//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
//       return res.status(423).json({ error: `Account is locked. Try again in ${remainingTime} minutes.` });
//     }

//     const existingOtp = await OTP.findOne({ identifier: mobile, purpose: "login" });
//     if (existingOtp) {
//       const secondsElapsed = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
//       if (secondsElapsed < 60) {
//         return res.status(429).json({ error: `Please wait ${60 - secondsElapsed} seconds before requesting a new OTP.` });
//       }
//     }

//     const settings = await AdminSettings.findOne();
//     const sender = settings?.smsSenderNumber || process.env.TWILIO_PHONE_NUMBER;

//     const otpCode = generateOTP();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await OTP.deleteMany({ identifier: mobile, purpose: "login" });
//     await OTP.create({
//       identifier: mobile,
//       code: otpCode,
//       purpose: "login",
//       expiresAt,
//     });

//     await sendSMS(mobile, `Your login OTP is ${otpCode}. Valid for 5 minutes.`, sender);

//     res.json({ message: "OTP sent to your mobile number" });
//   } catch (error) {
//     console.error("Send login OTP error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const verifyLoginOtp = async (req, res) => {
//   try {
//     const { mobile, otpCode } = req.body;
//     if (!mobile || !otpCode) {
//       return res.status(400).json({ error: "Mobile and OTP are required" });
//     }

//     const user = await User.findOne({ mobile });
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
//       return res.status(423).json({ error: `Account is temporarily locked. Try again in ${remainingTime} minutes.` });
//     }

//     const otpRecord = await OTP.findOne({
//       identifier: mobile,
//       code: otpCode,
//       purpose: "login",
//       expiresAt: { $gt: new Date() },
//     });

//     if (!otpRecord) {
//       user.loginAttempts += 1;
//       if (user.loginAttempts >= 5) {
//         user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
//         user.loginAttempts = 0;
//         await user.save();
//         return res.status(423).json({ error: "Too many failed attempts. Account locked for 15 minutes." });
//       }
//       await user.save();
//       const attemptsRemaining = 5 - user.loginAttempts;
//       return res.status(400).json({
//         error: `Invalid or expired OTP. ${attemptsRemaining} attempts remaining.`
//       });
//     }

//     await OTP.deleteOne({ _id: otpRecord._id });

//     user.loginAttempts = 0;
//     user.lockUntil = null;
//     user.lastLogin = new Date();
//     await user.save();

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.SESSION_TIMEOUT || "12h" }
//     );

//     res.json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         fullName: user.name,
//         email: user.email,
//         mobile: user.mobile,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Verify login OTP error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ==================== EMAIL OTP (Registration) ====================
// export const sendEmailOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email || !/\S+@\S+\.\S+/.test(email)) {
//       return res.status(400).json({ error: "Valid email required" });
//     }

//     const existingUser = await User.findOne({ email, isEmailVerified: true });
//     if (existingUser) {
//       return res.status(409).json({ error: "Email already registered and verified" });
//     }

//     const otpCode = generateOTP();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await OTP.deleteMany({ identifier: email, purpose: "email_verification" });
//     await OTP.create({
//       identifier: email,
//       code: otpCode,
//       purpose: "email_verification",
//       expiresAt,
//     });

//     const html = `<p>Your OTP for email verification is <b>${otpCode}</b>. It expires in 5 minutes.</p>`;
//     await sendEmail({
//       to: email,
//       subject: "Email Verification OTP",
//       html: html,
//     });

//     console.log(`✅ OTP email sent successfully to ${email}`);
//     res.json({ message: "OTP sent to email" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const verifyEmailOtp = async (req, res) => {
//   try {
//     const { email, otpCode } = req.body;
//     if (!email || !otpCode) {
//       return res.status(400).json({ error: "Email and OTP are required" });
//     }

//     const otpRecord = await OTP.findOne({
//       identifier: email,
//       code: otpCode,
//       purpose: "email_verification",
//       expiresAt: { $gt: new Date() },
//     });

//     if (!otpRecord) {
//       return res.status(400).json({ error: "Invalid or expired OTP" });
//     }

//     await OTP.deleteOne({ _id: otpRecord._id });
//     res.json({ message: "Email verified successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ==================== MOBILE OTP (Password Reset) ====================
// export const sendResetPasswordOtp = async (req, res) => {
//   try {
//     const { mobile } = req.body;
//     if (!mobile || !/^\d{10}$/.test(mobile)) {
//       return res.status(400).json({ error: "Valid 10-digit mobile number required" });
//     }

//     const user = await User.findOne({ mobile });
//     if (!user) {
//       return res.status(404).json({ error: "User with this mobile number does not exist." });
//     }

//     const existingOtp = await OTP.findOne({ identifier: mobile, purpose: "password_reset" });
//     if (existingOtp) {
//       const secondsElapsed = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
//       if (secondsElapsed < 60) {
//         return res.status(429).json({ error: `Please wait ${60 - secondsElapsed} seconds before requesting a new OTP.` });
//       }
//     }

//     const settings = await AdminSettings.findOne();
//     const sender = settings?.smsSenderNumber || process.env.TWILIO_PHONE_NUMBER;

//     const otpCode = generateOTP();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await OTP.deleteMany({ identifier: mobile, purpose: "password_reset" });
//     await OTP.create({
//       identifier: mobile,
//       code: otpCode,
//       purpose: "password_reset",
//       expiresAt,
//     });

//     await sendSMS(mobile, `Your password reset OTP is ${otpCode}. Valid for 5 minutes.`, sender);

//     res.json({ message: "Password reset OTP sent to your mobile number" });
//   } catch (error) {
//     console.error("Send reset OTP error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
import OTP from "../model/otpModel.js";
import User from "../model/userSchema.js";
import AdminSettings from "../model/adminSettingsSchema.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendSMS } from "../services/smsService.js";
import { sendEmail } from "../services/sendEmail.js";
import jwt from "jsonwebtoken";

// ============================================================
// ========== nutan changes -30-06-2026 ==========
// MOBILE OTP (Registration)
// ============================================================

export const sendMobileOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: "Valid 10-digit mobile number required" });
    }

    const existingUser = await User.findOne({ mobile, isMobileVerified: true });
    if (existingUser) {
      return res.status(409).json({ error: "Mobile already registered and verified" });
    }

    // Fetch admin settings for custom sender number (optional)
    const settings = await AdminSettings.findOne();
    const sender = settings?.smsSenderNumber || process.env.TWILIO_PHONE_NUMBER;

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ identifier: mobile, purpose: "mobile_verification" });
    await OTP.create({
      identifier: mobile,
      code: otpCode,
      purpose: "mobile_verification",
      expiresAt,
    });

    await sendSMS(mobile, `Your OTP for event registration is ${otpCode}. Valid for 5 minutes.`, sender);

    res.json({ message: "OTP sent to mobile" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyMobileOtp = async (req, res) => {
  try {
    const { mobile, otpCode } = req.body;
    if (!mobile || !otpCode) {
      return res.status(400).json({ error: "Mobile and OTP are required" });
    }

    const otpRecord = await OTP.findOne({
      identifier: mobile,
      code: otpCode,
      purpose: "mobile_verification",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await OTP.deleteOne({ _id: otpRecord._id });
    res.json({ message: "Mobile verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================
// MOBILE OTP (Login)
// ============================================================

export const sendLoginOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: "Valid 10-digit mobile number required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ error: "User with this mobile number does not exist." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is disabled. Contact admin." });
    }
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ error: `Account is locked. Try again in ${remainingTime} minutes.` });
    }

    const existingOtp = await OTP.findOne({ identifier: mobile, purpose: "login" });
    if (existingOtp) {
      const secondsElapsed = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
      if (secondsElapsed < 60) {
        return res.status(429).json({ error: `Please wait ${60 - secondsElapsed}s before requesting a new OTP.` });
      }
    }

    const settings = await AdminSettings.findOne();
    const sender = settings?.smsSenderNumber || process.env.TWILIO_PHONE_NUMBER;

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ identifier: mobile, purpose: "login" });
    await OTP.create({
      identifier: mobile,
      code: otpCode,
      purpose: "login",
      expiresAt,
    });

    await sendSMS(mobile, `Your login OTP is ${otpCode}. Valid for 5 minutes.`, sender);

    res.json({ message: "OTP sent to your mobile number" });
  } catch (error) {
    console.error("Send login OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { mobile, otpCode } = req.body;
    if (!mobile || !otpCode) {
      return res.status(400).json({ error: "Mobile and OTP are required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ error: `Account is temporarily locked. Try again in ${remainingTime} minutes.` });
    }

    const otpRecord = await OTP.findOne({
      identifier: mobile,
      code: otpCode,
      purpose: "login",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        return res.status(423).json({ error: "Too many failed attempts. Account locked for 15 minutes." });
      }
      await user.save();
      const attemptsRemaining = 5 - user.loginAttempts;
      return res.status(400).json({
        error: `Invalid or expired OTP. ${attemptsRemaining} attempts remaining.`
      });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.SESSION_TIMEOUT || "12h" }
    );

    res.json({
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
    console.error("Verify login OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================
// EMAIL OTP (Registration)
// ============================================================

export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    const existingUser = await User.findOne({ email, isEmailVerified: true });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered and verified" });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ identifier: email, purpose: "email_verification" });
    await OTP.create({
      identifier: email,
      code: otpCode,
      purpose: "email_verification",
      expiresAt,
    });

    const html = `<p>Your OTP for email verification is <b>${otpCode}</b>. It expires in 5 minutes.</p>`;
    await sendEmail({
      to: email,
      subject: "Email Verification OTP",
      html: html,
    });

    console.log(`✅ OTP email sent successfully to ${email}`);
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const otpRecord = await OTP.findOne({
      identifier: email,
      code: otpCode,
      purpose: "email_verification",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await OTP.deleteOne({ _id: otpRecord._id });
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================================
// MOBILE OTP (Password Reset)
// ============================================================

export const sendResetPasswordOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: "Valid 10-digit mobile number required" });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ error: "User with this mobile number does not exist." });
    }

    const existingOtp = await OTP.findOne({ identifier: mobile, purpose: "password_reset" });
    if (existingOtp) {
      const secondsElapsed = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
      if (secondsElapsed < 60) {
        return res.status(429).json({ error: `Please wait ${60 - secondsElapsed}s before requesting a new OTP.` });
      }
    }

    const settings = await AdminSettings.findOne();
    const sender = settings?.smsSenderNumber || process.env.TWILIO_PHONE_NUMBER;

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ identifier: mobile, purpose: "password_reset" });
    await OTP.create({
      identifier: mobile,
      code: otpCode,
      purpose: "password_reset",
      expiresAt,
    });

    await sendSMS(mobile, `Your password reset OTP is ${otpCode}. Valid for 5 minutes.`, sender);

    res.json({ message: "Password reset OTP sent to your mobile number" });
  } catch (error) {
    console.error("Send reset OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// ============================================================
// ========== end nutan changes ==========