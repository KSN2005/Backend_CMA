const express = require("express");
const router = express.Router();
const WebsiteSetting = require("../models/WebsiteSetting");

// GET settings (public)
router.get("/", async (req, res) => {
  try {
    const settings = await WebsiteSetting.find();

    const result = settings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    res.json({
      logo: result.logo || "",
      siteName: result.siteName || "CMA Himanshu Sharma",
      ...result,
    });

  } catch (error) {
    console.error(error);

    // fallback (no crash)
    res.json({
      logo: "",
      siteName: "CMA Himanshu Sharma",
    });
  }
});

// PUT settings (you can protect later with auth)
router.put("/", async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Key is required" });
    }

    const updated = await WebsiteSetting.findOneAndUpdate(
      { key },
      { value, updatedAt: Date.now() },
      { returnDocument: "after", upsert: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;