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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/submissions", authMiddleware, submissionRoutes);
app.use("/api/services", serviceRoutes);
app.use("/services", serviceRoutes);
app.use("/api/page", pageRoutes);
app.use("/api/content", require("./routes/contentRoutes"));

// ✅ FIX: Public access
app.use("/api/settings", settingsRoutes);

app.use("/api/upload", authMiddleware, uploadRoutes);

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});