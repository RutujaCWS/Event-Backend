// import express from "express";
// import {
//   sendMobileOtp,
//   verifyMobileOtp,
//   sendEmailOtp,
//   verifyEmailOtp,
//   sendLoginOtp,
//   verifyLoginOtp,
//   sendResetPasswordOtp
// } from "../controller/otpController.js";

// const router = express.Router();

// // Registration OTPs (keep these)
// router.post("/send-mobile-otp", sendMobileOtp);
// router.post("/verify-mobile-otp", verifyMobileOtp);
// router.post("/send-email-otp", sendEmailOtp);
// router.post("/verify-email-otp", verifyEmailOtp);
// router.post("/send-login-otp", sendLoginOtp);
// router.post("/verify-login-otp", verifyLoginOtp);
// router.post("/send-reset-otp", sendResetPasswordOtp);

// export default router;


import express from "express";
import {
  sendMobileOtp,
  verifyMobileOtp,
  sendLoginOtp,
  verifyLoginOtp,
  sendEmailOtp,
  verifyEmailOtp,
  sendResetPasswordOtp,
} from "../controller/otpController.js";

const router = express.Router();

// Registration OTP
router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);

// Login OTP
router.post("/send-login-otp", sendLoginOtp);
router.post("/verify-login-otp", verifyLoginOtp);

// Email OTP
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

// Password Reset OTP
router.post("/send-reset-password-otp", sendResetPasswordOtp);

export default router;