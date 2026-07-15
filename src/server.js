import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
console.log('DNS servers forced to cloudflare/google', dns.getServers())

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
// dotenv.config({ path: envPath, debug: true });
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import cmsRoutes from "./routes/admin/cmsRoutes.js";
import galleryRoutes from "./routes/admin/galleryRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import adminSettingsRoutes from "./routes/admin/adminSettingsRoutes.js";

import cors from "cors";  
import quotationRoutes from "./routes/admin/quotationRoutes.js";
import bookingRoutes from "./routes/admin/bookingRoutes.js";

import notificationRoutes from "./routes/notificationRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import notificationTemplateRoutes from "./routes/admin/notificationTemplateRoutes.js";
  
dotenv.config();
// import leadRoutes from "./routes/admin/leadRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import staffRoutes from "./routes/staff/staffRoutes.js";
import paymentRoutes from "./routes/admin/paymentRoutes.js";
import invoiceRoutes from "./routes/admin/invoiceRoutes.js";
import bannerRoutes from "./routes/admin/bannerRoutes.js";
import serviceRoutes from "./routes/admin/serviceRoutes.js";
import contactRoutes from "./routes/admin/contactRoutes.js";
import testimonialRoutes from "./routes/admin/testimonialRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", userRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/enquiries", enquiryRoutes);

app.use("/api/quotations", quotationRoutes);  
app.use("/api/bookings", bookingRoutes);  

app.use("/api/gallery", galleryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminSettingsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/testimonials", testimonialRoutes);
// 🔔 Mount notification routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use(
  "/api/admin/notification-settings",
  notificationTemplateRoutes
);

app.get("/", (req, res)=>{
  res.send("API is running.............")
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on port", PORT);
  });
});