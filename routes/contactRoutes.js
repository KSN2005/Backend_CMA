const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const nodemailer = require("nodemailer");

// Endpoint used by the public website contact form
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Save to MongoDB
    const newSubmission = new Submission({
      name,
      email,
      phone,
      service,
      message,
    });

    await newSubmission.save();

    // Optional: send notification email to admin
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `New Inquiry - ${service || "General"}`,
        html: `
          <h2>New Client Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Service:</strong> ${service || "N/A"}</p>
          <p><strong>Message:</strong> ${message}</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({
      message: "Inquiry submitted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
