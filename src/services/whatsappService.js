import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";

let client = null;
let qrCode = "";
let ready = false;
let isInitializing = false;
let authAttempts = 0;

export const initializeWhatsApp = async () => {
  if (ready && client) {
    console.log("✅ WhatsApp already ready");
    return;
  }

  if (isInitializing) {
    console.log("WhatsApp is already initializing...");
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (ready) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  isInitializing = true;
  console.log("Initializing WhatsApp...");

  try {
    client = new Client({
      authStrategy: new LocalAuth({
        clientId: "quotation-system"
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu"
        ]
      },
      takeoverOnConflict: true,
      takeoverTimeoutMs: 30000,
    });

    client.on("qr", async (qr) => {
      try {
        qrCode = await qrcode.toDataURL(qr);
        console.log("📱 QR Code generated - Scan to authenticate");
        console.log("QR Code length:", qrCode.length);
      } catch (err) {
        console.error("QR generation error:", err);
      }
    });

    client.on("ready", () => {
      ready = true;
      isInitializing = false;
      console.log("WhatsApp Ready");
    });

    client.on("authenticated", () => {
      console.log("WhatsApp authenticated!");
      authAttempts = 0;
    });

    client.on("auth_failure", (msg) => {
      console.error("WhatsApp auth failed:", msg);
      authAttempts++;
      isInitializing = false;
      
      if (authAttempts > 3) {
        console.log("Too many auth failures, resetting...");
        client = null;
        qrCode = "";
        ready = false;
      }
    });

    client.on("disconnected", (reason) => {
      console.log("WhatsApp disconnected:", reason);
      ready = false;
      client = null;
      isInitializing = false;
      qrCode = "";
    });

    await client.initialize();
    console.log("WhatsApp initialization started...");

  } catch (error) {
    console.error("WhatsApp initialization error:", error);
    isInitializing = false;
    client = null;
    ready = false;
    throw error;
  }
};

export const getQr = () => qrCode;

export const isReady = () => ready;

export const sendWhatsAppMessage = async (phone, message) => {
  try {
    if (!ready) {
      console.log("WhatsApp not ready, initializing...");
      await initializeWhatsApp();
      
      let attempts = 0;
      while (!ready && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!ready) {
        console.error("WhatsApp not ready after initialization");
        return { success: false, error: "WhatsApp not ready" };
      }
    }

    if (!client) {
      console.error("WhatsApp client not available");
      return { success: false, error: "Client not available" };
    }

    let number = phone.replace(/\D/g, "");
    if (number.length === 10) {
      number = "91" + number;
    }

    await client.sendMessage(`${number}@c.us`, message);
    console.log(`WhatsApp message sent to ${phone}`);
    return { success: true };

  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error.message };
  }
};

export const getConnectedNumber = () => {
  if (!ready || !client || !client.info) return null;
  return {
    name: client.info.pushname,
    number: client.info.wid.user,
  };
};

export const logoutWhatsApp = async () => {
  try {
    if (!client) return;

    console.log("Logging out WhatsApp...");
    await client.logout();
    await client.destroy();

    ready = false;
    qrCode = "";
    client = null;
    isInitializing = false;
    authAttempts = 0;

    console.log("WhatsApp logged out");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

