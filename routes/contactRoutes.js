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

    // ✅ ⚡ FAST RESPONSE (NO DELAY)
    res.status(200).json({
      message: "Inquiry submitted successfully",
    });

    // ✅ EMAIL IN BACKGROUND (NON-BLOCKING)
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();

    if (!emailUser || !emailPass) {
      console.warn("⚠️ Email credentials are missing. Skipping email send.");
      return;
    }

    setImmediate(async () => {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.verify();

        await transporter.sendMail({
          from: `Website Contact <${emailUser}>`,
          replyTo: email,
          to: emailUser,
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

        console.log("✅ Mail sent successfully for inquiry from", email);
      } catch (mailError) {
        console.error("❌ Mail Error:", mailError);
      }
    });

  } catch (error) {
    console.error("🔥 SERVER ERROR:", error.message);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;