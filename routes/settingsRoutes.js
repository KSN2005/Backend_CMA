const express = require("express");
const router = express.Router();
const WebsiteSetting = require("../models/WebsiteSetting");
const authMiddleware = require("../middleware/auth");
const { upload, getUploadUrl } = require("../middleware/multerConfig");

// ✅ Helper: allow multipart/form-data uploads
const optionalUpload = (req, res, next) => {
  const contentType = (req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("multipart/form-data")) {
    return upload.single("file")(req, res, next);
  }
  return next();
};

// ✅ Helper: Validate settings data
const validateSettingData = (key, value) => {
  const errors = [];
  
  if (!key || key.trim() === "") {
    errors.push("Setting key is required");
  }
  
  if (value === undefined || value === null) {
    errors.push("Setting value is required");
  }
  
  // Restrict key names to prevent injection
  const allowedKeys = ["siteName", "logo", "description", "phone", "email", "address"];
  if (key && !allowedKeys.includes(key)) {
    errors.push(`Invalid setting key. Allowed: ${allowedKeys.join(", ")}`);
  }
  
  return errors;
};

// GET settings (public) - ✅ Enhanced with error handling
router.get("/", async (req, res) => {
  try {
    const settings = await WebsiteSetting.find()
      .select("key value")
      .lean();

    const result = settings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Return with defaults
    res.json({
      siteName: result.siteName || "CMA Himanshu Sharma",
      logo: result.logo || "",
      description: result.description || "",
      phone: result.phone || "",
      email: result.email || "",
      address: result.address || "",
      ...result,
    });

  } catch (error) {
    console.error("❌ Error fetching settings:", error);

    // Return default settings on error (graceful fallback)
    res.json({
      siteName: "CMA Himanshu Sharma",
      logo: "",
      description: "",
      phone: "",
      email: "",
      address: "",
    });
  }
});

// PUT settings (protected) - ✅ Added auth and file upload support
router.put("/", authMiddleware, optionalUpload, async (req, res) => {
  try {
    let { key, value } = req.body;

    // If file is uploaded, use its URL as value
    if (req.file) {
      value = getUploadUrl(req, req.file.filename);
      // If key wasn't specified but it's a file upload, assume it's logo
      if (!key) {
        key = "logo";
      }
    }

    // Validate input
    const validationErrors = validateSettingData(key, value);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    const updated = await WebsiteSetting.findOneAndUpdate(
      { key },
      {
        value: String(value).trim(),
        updatedAt: Date.now(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Setting updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// ✅ NEW: Get individual setting
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await WebsiteSetting.findOne({ key }).lean();

    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json(setting);
  } catch (error) {
    console.error("❌ Error fetching setting:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

module.exports = router;