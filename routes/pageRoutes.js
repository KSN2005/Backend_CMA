const express = require("express");
const router = express.Router();
const PageContent = require("../models/PageContent");

// Get page content for home or about
router.get("/:page", async (req, res) => {
  try {
    const page = req.params.page.toLowerCase();
    let content = await PageContent.findOne({ page });

    if (!content) {
      // Return a default empty entry so clients don't break
      content = await PageContent.create({ page, title: "", description: "", bannerImage: "" });
    }

    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update or create page content
router.put("/:page", async (req, res) => {
  try {
    const page = req.params.page.toLowerCase();
    const { title, description, bannerImage } = req.body;

    const updated = await PageContent.findOneAndUpdate(
      { page },
      { title, description, bannerImage, updatedAt: Date.now() },
      { returnDocument: "after", upsert: true }
    );

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
