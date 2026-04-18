const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const authMiddleware = require("../middleware/auth");
const { upload, getUploadUrl } = require("../middleware/multerConfig");

// Helper: allow multipart/form-data uploads, but also accept JSON
const optionalUpload = (req, res, next) => {
  const contentType = (req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("multipart/form-data")) {
    return upload.single("file")(req, res, next);
  }
  return next();
};

// ✅ Helper: Validate service data
const validateServiceData = (title, description = "") => {
  const errors = [];
  
  if (!title || title.trim() === "") {
    errors.push("Title is required");
  } else if (title.trim().length < 2) {
    errors.push("Title must be at least 2 characters");
  } else if (title.trim().length > 100) {
    errors.push("Title must not exceed 100 characters");
  }
  
  if (description && description.trim().length > 500) {
    errors.push("Description must not exceed 500 characters");
  }
  
  return errors;
};

// List services (public) - ✅ Enhanced error handling
router.get("/", async (req, res) => {
  try {
    const services = await Service.find()
      .select("_id title description imageUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(services);
  } catch (error) {
    console.error("❌ Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Create a new service (protected) - ✅ Enhanced validation
router.post("/", authMiddleware, optionalUpload, async (req, res) => {
  try {
    const { title, description = "", imageUrl: bodyImageUrl = "" } = req.body;

    // Validate input
    const validationErrors = validateServiceData(title, description);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    const imageUrl = req.file
      ? getUploadUrl(req, req.file.filename)
      : bodyImageUrl;

    const service = new Service({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || "",
    });

    await service.save();

    res.status(201).json({
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    console.error("❌ Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

// Update a service (protected) - ✅ Enhanced validation
router.put("/:id", authMiddleware, optionalUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description = "", imageUrl: bodyImageUrl = "" } = req.body;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid service ID" });
    }

    // Validate input
    const validationErrors = validateServiceData(title, description);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    const imageUrl = req.file
      ? getUploadUrl(req, req.file.filename)
      : bodyImageUrl;

    const updated = await Service.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || "",
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({
      message: "Service updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Delete a service (protected) - ✅ Added auth check
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid service ID" });
    }

    const deleted = await Service.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

module.exports = router;
