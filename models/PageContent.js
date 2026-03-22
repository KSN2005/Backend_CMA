const mongoose = require("mongoose");

const pageContentSchema = new mongoose.Schema({
  page: {
    type: String,
    enum: ["home", "about"],
    required: true,
    unique: true,
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  bannerImage: {
    type: String,
    default: "",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PageContent", pageContentSchema);
