const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

// 🔐 Config via Firebase CLI (see below)
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.password;

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPass,
  },
});

// 🎯 Cloud Function: /sendContactEmail
exports.sendContactEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { name, email, subject, message } = req.body;

    const mailOptions = {
      from: email,
      to: "myyulaa@gmail.com",
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    };

    try {
      await transporter.sendMail(mailOptions);

      // Optional: Log to Firestore
      await admin.firestore().collection("contactSubmissions").add({
        name,
        email,
        subject,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).send("Message sent");
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).send("Failed to send message");
    }
  });
});

// functions/index.js
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "UID required");
  }

  try {
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection("users").doc(uid).delete(); // optional: delete Firestore data
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
