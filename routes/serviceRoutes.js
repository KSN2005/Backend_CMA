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

// List services (public)
router.get("/", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new service (protected)
router.post("/", authMiddleware, optionalUpload, async (req, res) => {
  try {
    const { title, description, imageUrl: bodyImageUrl = "" } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const imageUrl = req.file
      ? getUploadUrl(req, req.file.filename)
      : bodyImageUrl;

    const service = new Service({
      title,
      description,
      imageUrl,
    });

    await service.save();

    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a service (protected)
router.put("/:id", authMiddleware, optionalUpload, async (req, res) => {
  try {
    const { title, description, imageUrl: bodyImageUrl = "" } = req.body;

    const imageUrl = req.file
      ? getUploadUrl(req, req.file.filename)
      : bodyImageUrl;

    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      { title, description, imageUrl },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a service
router.delete("/:id", async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
