import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

    

dotenv.config();
// import leadRoutes from "./routes/admin/leadRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import staffRoutes from "./routes/staff/staffRoutes.js";


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



connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on port", PORT);
  });
});