const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

const router = express.Router();
const pending2FA = new Map();
const { publish2FARequest } = require('../mqttListener');

// ✅ Registracija
router.post("/register", async (req, res) => {
  let { username, email, password } = req.body;
  email = email?.toLowerCase();

  console.log("📥 Prejem registracijskega zahtevka:", { username, email, password });

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vsa polja so obvezna" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "Uporabnik že obstaja" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();
    console.log("✅ Uporabnik uspešno registriran:", email);
    res.status(201).json({ message: "Registracija uspešna" });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email ali uporabniško ime že obstaja" });
    }

    console.error("❌ Napaka na strežniku med registracijo:", err);
    res.status(500).json({ message: "Napaka na strežniku", error: err.message });
  }
});

// ✅ Posodobi cilje
router.post("/update-goals", async (req, res) => {
  const { email, caloricGoal, proteinGoal } = req.body;
  if (!email) return res.status(400).json({ message: "Email je obvezen" });

  try {
    const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { caloricGoal: caloricGoal ?? null, proteinGoal: proteinGoal ?? null },
        { new: true }
    );
    if (!user) return res.status(404).json({ message: "Uporabnik ni najden" });

    res.json({
      message: "Cilji uspešno posodobljeni",
      caloricGoal: user.caloricGoal,
      proteinGoal: user.proteinGoal,
    });
  } catch (err) {
    console.error("❌ Napaka pri posodabljanju ciljev:", err);
    res.status(500).json({ message: "Napaka na strežniku" });
  }
});

// ✅ Prijava
router.post("/login", async (req, res) => {
  let { email, password, from, deviceId, deviceName, clientId } = req.body;
  email = email?.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Uporabnik ne obstaja" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Napačno geslo" });

    if (deviceId && clientId) {
      const deviceExists = user.devices.find((d) => d.deviceId === deviceId);
      if (deviceExists) {
        await User.updateOne(
          { _id: user._id, "devices.deviceId": deviceId },
          {
            $set: {
              "devices.$.deviceName": deviceName || deviceExists.deviceName,
              "devices.$.clientId": clientId,
              "devices.$.lastConnected": new Date(),
              "devices.$.isConnected": true,
            },
          }
        );
      } else {
        user.devices.push({
          deviceId,
          deviceName: deviceName || "",
          clientId,
          lastConnected: new Date(),
          isConnected: true,
        });
        await user.save();
      }
    }

    if (from === "web") {
      user.pending2FA = true;
      user.is2faVerified = false;
      await user.save();
      // Pošlji MQTT sporočilo
      publish2FARequest(email);
      return res.json({ message: "Prijava uspešna – preveri 2FA na telefonu" });
    }

    res.status(200).json({
      message: "Prijava uspešna",
      user: {
        email: user.email,
        username: user.username || "Uporabnik",
        caloricGoal: user.caloricGoal,
        proteinGoal: user.proteinGoal,
        is2faVerified: user.is2faVerified,
        _id: user._id,
      },
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Napaka na strežniku" });
  }
});

// ✅ Odjava
router.post("/logout", async (req, res) => {
  const { email, deviceId } = req.body;
  if (!email || !deviceId) return res.status(400).json({ message: "Email in deviceId sta obvezna" });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "Uporabnik ne obstaja" });

    const deviceExists = user.devices.find((d) => d.deviceId === deviceId);
    if (!deviceExists) return res.status(404).json({ message: "Naprava ni najdena" });

    await User.updateOne(
        { _id: user._id, "devices.deviceId": deviceId },
        {
          $set: {
            "devices.$.isConnected": false,
            "devices.$.lastConnected": new Date(),
          },
        }
    );

    res.status(200).json({ message: "Odjava uspešna" });
  } catch (err) {
    console.error("❌ Error during logout:", err.message);
    res.status(500).json({ message: "Napaka na strežniku" });
  }
});

router.post("/register-face", upload.array("images"), async (req, res) => {
  const { email } = req.body;
  const files = req.files;

  if (!email || !files || files.length < 5) {
    return res.status(400).json({ message: "Potrebnih je 5 slik in email" });
  }

  try {
    const form = new FormData();
    form.append("email", email);
    files.forEach((file) => {
      form.append("images", fs.createReadStream(file.path));
    });

    const response = await axios.post(
      "https://prehrankopython-production.up.railway.app/register",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    files.forEach((f) => fs.unlinkSync(f.path)); // Počistimo slike

    if (response.data.registered) {
      return res.json({ message: "✅ Registracija obraznih značilk uspešna" });
    } else {
      return res
        .status(400)
        .json({ message: response.data.error || "Napaka pri registraciji" });
    }
  } catch (err) {
    console.error("❌ Napaka pri povezavi na Python strežnik:", err.message);
    return res
      .status(500)
      .json({ message: "Napaka pri komunikaciji s prepoznavo obraza" });
  }
});

router.post("/verify-face", upload.single("image"), async (req, res) => {
  const { email } = req.body;
  const file = req.file;

  if (!email || !file) {
    return res.status(400).json({ message: "Manjka slika ali email" });
  }

  try {
    const form = new FormData();
    form.append("email", email);
    form.append("image", fs.createReadStream(file.path));

    const response = await axios.post(
      "https://prehranko-production.up.railway.app/api/auth/verify",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    fs.unlinkSync(file.path);

    if (response.data.success) {
      return res.json({ message: "Obraz preverjen, 2FA uspešna" });
    } else {
      return res.status(401).json({ message: "Obraz ni prepoznan" });
    }
  } catch (err) {
    console.error("❌ Napaka pri preverjanju obraza:", err.message);
    return res.status(500).json({ message: "Napaka pri preverjanju" });
  }
});

router.post(
  "/upload-face-image",
  upload.array("images", 5),
  async (req, res) => {
    const { email } = req.body;
    const files = req.files;

    if (!email || !files || files.length < 3) {
      return res
        .status(400)
        .json({ message: "Potrebne so vsaj 3 slike in email" });
    }

    const form = new FormData();
    form.append("email", email);
    files.forEach((file) => {
      form.append("images", fs.createReadStream(file.path));
    });

    try {
      const response = await axios.post(
        "https://prehranko-production.up.railway.app/api/register-face",
        form,
        {
          headers: form.getHeaders(),
        }
      );

      files.forEach((f) => fs.unlinkSync(f.path));

      if (response.data.success) {
        return res.json({ message: "Uspeh", result: response.data });
      } else {
        return res.status(400).json({
          message: response.data.message || "Napaka v prepoznavi obraza",
        });
      }
    } catch (err) {
      console.error("❌ Napaka pri povezavi na Python strežnik:", err.message);
      return res
        .status(500)
        .json({ message: "Napaka pri komunikaciji s prepoznavo obraza" });
    }
  }
);

router.post("/save-features", async (req, res) => {
  const { email, features } = req.body;
  if (!email || !features || !Array.isArray(features)) {
    return res.status(400).json({ message: "Manjka email ali značilke" });
  }

  try {
    const result = await User.findOneAndUpdate(
      { email },
      { features }, // Posodobi faceEmbeddings namesto features
      { new: true }
    );
    if (!result) {
      return res.status(404).json({ message: "Uporabnik ni bil najden" });
    }
    res.json({ success: true, updated: true });
  } catch (err) {
    console.error("❌ Napaka pri shranjevanju značilk:", err);
    res.status(500).json({ message: "Napaka pri shranjevanju značilk" });
  }
});

router.get("/finish-login", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email je potreben" });

  try {
    const user = await User.findOne({ email });

    if (!user || !user.is2faVerified) {
      return res.status(401).json({ message: "2FA še ni bila dokončana" });
    }

    res.json({
      message: "Prijava uspešna",
      user: {
        email: user.email,
        username: user.username || "Uporabnik",
        caloricGoal: user.caloricGoal,
        proteinGoal: user.proteinGoal,
        is2faVerified: user.is2faVerified,
        _id: user._id,
      },
    });
  } catch (err) {
    console.error("❌ Napaka pri finish-login:", err.message);
    res.status(500).json({ message: "Napaka na strežniku" });
  }
});

router.get("/embeddings", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email je potreben" });

  const user = await User.findOne({ email });
  if (!user || !user.faceEmbeddings) {
    return res.status(404).json({ message: "Ni značilk za tega uporabnika" });
  }

  res.json({ faceEmbeddings: user.faceEmbeddings });
});

// GET /auth/user?email=...
router.get("/user", async (req, res) => {
  console.log("📥 GET /auth/user klican z:", req.query);

  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email je potreben" });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("⚠️ Uporabnik ni najden za:", email);
      return res.status(404).json({ message: "Uporabnik ni najden" });
    }

    res.setHeader("Cache-Control", "no-store");

    res.json({
      user: {
        email: user.email,
        username: user.username || "Uporabnik",
        caloricGoal: user.caloricGoal,
        proteinGoal: user.proteinGoal,
        is2faVerified: user.is2faVerified,
        _id: user._id,
      },
    });
  } catch (err) {
    console.error("❌ Napaka pri GET /auth/user:", err);
    res.status(500).json({ message: "Napaka strežnika" });
  }
});

module.exports = router;
