const express = require("express");
const router = express.Router();
const PageContent = require("../models/PageContent");

router.get("/:page", async (req, res) => {
  try {
    const page = req.params.page.toLowerCase();

    if (!["home", "about"].includes(page)) {
      return res.status(404).json({ error: "Page not found" });
    }

    let content = await PageContent.findOne({ page });

    if (!content) {
      content = await PageContent.create({
        page,
        title: "",
        description: "",
        bannerImage: "",
        layoutVariant: "default",
      });
    }

    res.json({
      title: content.title || "",
      description: content.description || "",
      bannerImage: content.bannerImage || "",
      layoutVariant: content.layoutVariant || "default",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;