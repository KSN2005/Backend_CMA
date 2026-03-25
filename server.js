const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const contactRoutes = require("./routes/contactRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const pageRoutes = require("./routes/pageRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authMiddleware = require("./middleware/auth");

const app = express();

// ✅ FIX 1: Proper CORS (important for frontend)
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// ✅ FIX 2: Body parser (already correct)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIX 3: Static uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ✅ ROUTES
app.use("/api/admin", adminRoutes);

// ❌ REMOVE THIS (can cause conflicts)
/// app.use("/", adminRoutes);

app.use("/api/contact", contactRoutes);
app.use("/api/submissions", authMiddleware, submissionRoutes);
app.use("/api/services", serviceRoutes);
app.use("/services", serviceRoutes);
app.use("/api/page", pageRoutes);
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);

// ✅ DB CONNECT (with better logging)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => {
    console.log("❌ Mongo Error:", err.message);
  });

// ✅ SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});