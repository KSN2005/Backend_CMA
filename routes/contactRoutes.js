const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { name, email, phone, service, message } = req.body;

    // ✅ VALIDATION
    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Name, Email and Message are required",
      });
    }

    // ✅ SAVE TO DB
    const newSubmission = new Submission({
      name,
      email,
      phone: phone || "",
      service: service || "",
      message,
    });

    await newSubmission.save();

    // ✅ EMAIL SAFE (MAIN FIX)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER, // ✅ FIX (NOT user email)
          replyTo: email,
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
        });

        console.log("✅ Mail sent");

      } catch (mailError) {
        console.log("❌ Mail Error:", mailError.message);
        // ❗ IMPORTANT: crash nahi hone dena
      }
    }

    res.status(200).json({
      message: "Inquiry submitted successfully",
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
  res.status(500).json({
  error: error.message,
  fullError: error
});;
  }
});

module.exports = router;