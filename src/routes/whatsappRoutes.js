import express from "express";
import {
  getQr,
  isReady,
  getConnectedNumber,
  logoutWhatsApp,
  initializeWhatsApp  
} from "../services/whatsappService.js";

const router = express.Router();

router.get("/qr", async (req, res) => {
  try {
    if (!isReady()) {
      console.log("Initializing WhatsApp for QR...");
      await initializeWhatsApp();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    res.json({
      ready: isReady(),
      qr: getQr()
    });
  } catch (error) {
    console.error("QR Error:", error);
    res.status(500).json({
      ready: false,
      qr: null,
      error: error.message
    });
  }
});

router.get("/status", (req, res) => {
  res.json({
    ready: isReady(),
    account: getConnectedNumber(),
  });
});

router.post("/logout", async (req, res) => {
  try {
    await logoutWhatsApp();
    res.json({
      success: true,
      message: "WhatsApp disconnected successfully."
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;