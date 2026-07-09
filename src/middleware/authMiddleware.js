import jwt from "jsonwebtoken";
import User from "../model/userSchema.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// ✅ authorize middleware – flexible role checking
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// middleware to check staff prmission
export const checkPermission = (permissionName) => {
  return (req, res, next) => {
    // admin bypass all permission checks
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    //check staff permissions
    if (req.user && req.user.role === "staff") {
      if (req.user.permissions && req.user.permissions[permissionName] === true) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. you do not have permission for: ${permissionName}`,
      })
    }
    // block other roles (like custum_berrrrr) if they hit staff routes
    return res.status(403).json({
      success: false,
      message: "Access denied."
    })
  }
}