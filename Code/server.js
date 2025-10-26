require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (to match frontend timeout)
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many requests, please try again later.",
});
app.use("/send-email", limiter);

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // your Gmail password
  },
});

// --- POST /send-email Route with Input Validation & Google reCAPTCHA Verification ---
app.post(
  "/send-email",
  [
    // Validate and sanitize inputs
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email")
      .isEmail()
      .withMessage("Invalid email address.")
      .custom((value) => {
        if (!value.endsWith("@gmail.com") && !value.endsWith("@outlook.com")) {
          throw new Error("Only Gmail and Outlook emails are allowed.");
        }
        return true;
      }),
    body("subject").trim().notEmpty().withMessage("Subject is required."),
    body("message").trim().notEmpty().withMessage("Message is required."),
    body("g-recaptcha-response").notEmpty().withMessage("reCAPTCHA token is required."),
  ],
  async (req, res) => {
    // Check input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;
    const recaptchaToken = req.body["g-recaptcha-response"];

    // --- Verify reCAPTCHA ---
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    try {
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`,
        { method: "POST" }
      );
      const recaptchaResult = await recaptchaResponse.json();
      if (!recaptchaResult.success) {
        return res.status(400).json({ error: "reCAPTCHA verification failed." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Failed to verify reCAPTCHA." });
    }

    // --- Email Existence Verification for Gmail ---
    if (email.endsWith("@gmail.com")) {
      try {
        const response = await fetch(`https://api.eva.pingutil.com/email?email=${email}`);
        const data = await response.json();
        if (!(data.data && data.data.deliverable)) {
          return res.status(400).json({ error: "Email address is not valid or does not exist." });
        }
      } catch (err) {
        return res.status(500).json({ error: "Could not verify email." });
      }
    }

    // --- Prepare Email ---
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL, // your receiving email
      subject: `[Contact Form] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #a363aa;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Email sent successfully!" });
    } catch (error) {
      console.error("Email sending error:", error);
      res.status(500).json({ error: "Failed to send email." });
    }
  }
);

app.listen(5000, () => console.log("Server running on port 5000"));