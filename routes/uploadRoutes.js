const express = require("express");
const router = express.Router();
const { upload, getUploadUrl } = require("../middleware/multerConfig");

// Upload any image (logo, banner, service image)
router.post("/image", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was provided" });
    }

    const url = getUploadUrl(req, req.file.filename);
    res.json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Legacy / convenience endpoint for logo uploads
router.post("/logo", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was provided" });
    }

    const url = getUploadUrl(req, req.file.filename);
    res.json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
