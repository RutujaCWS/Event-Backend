// routes/userRoutes.js
import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword, myProfile,updateProfile,
  getProfileStats,
  getRecentEnquiries,changePassword,uploadProfileImage,resetPasswordWithToken} from "../controller/userController.js";
//import { registerUser, loginUser, forgotPassword, resetPassword,  } from "../controller/userController.js";
import otpRoutes from "./otpRoutes.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use("/", otpRoutes);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/reset-password/:token", resetPasswordWithToken);
router.get("/me", protect, myProfile);
router.put(
  "/change-password",
  protect,
  changePassword
);
router.put("/profile", protect, updateProfile);

router.get("/profile/stats", protect, getProfileStats);

router.get(
  "/profile/recent-enquiries",
  protect,
  getRecentEnquiries
);

export default router;