// server.js

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const path = require("path");

const { sequelize, Mahasiswa, User } = require("./models"); // Import dari models/index.js

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Middleware untuk memverifikasi token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token tidak valid." });
    req.user = user;
    next();
  });
}

// Middleware untuk otorisasi berdasarkan peran
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Akses ditolak." });
    }
    next();
  };
}

// API Routes

// Registrasi User (Optional, bisa dihapus jika ingin hanya membuat user secara manual)
app.post("/api/register", async (req, res) => {
  const { username, password, role, mahasiswaId } = req.body;
  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username sudah digunakan." });
    }

    const newUser = await User.create({
      username,
      password,
      role,
      mahasiswaId,
    });
    res.json({
      message: "User berhasil dibuat.",
      user: { id: newUser.id, username: newUser.username, role: newUser.role },
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat user." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: "Username atau password salah." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Username atau password salah." });
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login berhasil.",
      token,
      role: user.role,
      mahasiswaId: user.mahasiswaId,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal melakukan login." });
  }
});

// Get semua mahasiswa (Hanya untuk dosen)
app.get(
  "/api/mahasiswa",
  authenticateToken,
  authorizeRoles("lecturer"),
  async (req, res) => {
    try {
      const mahasiswa = await Mahasiswa.findAll();
      res.json(mahasiswa);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil data mahasiswa." });
    }
  }
);

// Get mahasiswa by ID (Dosen dapat melihat semua, mahasiswa hanya melihat diri sendiri)
app.get("/api/mahasiswa/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const mahasiswa = await Mahasiswa.findByPk(id);
    if (!mahasiswa) {
      return res.status(404).json({ error: "Mahasiswa tidak ditemukan." });
    }

    if (req.user.role === "student") {
      const user = await User.findOne({ where: { mahasiswaId: id } });
      if (!user || user.id !== req.user.id) {
        return res.status(403).json({ error: "Akses ditolak." });
      }
    }

    res.json(mahasiswa);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data mahasiswa." });
  }
});

// Tambah mahasiswa baru (Hanya untuk dosen)
app.post(
  "/api/mahasiswa",
  authenticateToken,
  authorizeRoles("lecturer"),
  async (req, res) => {
    const { nama, nim, jurusan } = req.body;
    try {
      const newMahasiswa = await Mahasiswa.create({ nama, nim, jurusan });
      res.json(newMahasiswa);
    } catch (error) {
      res.status(500).json({ error: "Gagal menambahkan mahasiswa." });
    }
  }
);

// Update mahasiswa (Dosen dapat mengupdate semua, mahasiswa hanya dapat mengupdate diri sendiri)
app.put("/api/mahasiswa/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nama, nim, jurusan } = req.body;
  try {
    const mahasiswa = await Mahasiswa.findByPk(id);
    if (!mahasiswa) {
      return res.status(404).json({ error: "Mahasiswa tidak ditemukan." });
    }

    if (req.user.role === "student") {
      const user = await User.findOne({ where: { mahasiswaId: id } });
      if (!user || user.id !== req.user.id) {
        return res.status(403).json({ error: "Akses ditolak." });
      }
    }

    mahasiswa.nama = nama;
    mahasiswa.nim = nim;
    mahasiswa.jurusan = jurusan;
    await mahasiswa.save();
    res.json(mahasiswa);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengupdate mahasiswa." });
  }
});

// Delete mahasiswa (Hanya untuk dosen)
app.delete(
  "/api/mahasiswa/:id",
  authenticateToken,
  authorizeRoles("lecturer"),
  async (req, res) => {
    const { id } = req.params;
    try {
      const mahasiswa = await Mahasiswa.findByPk(id);
      if (mahasiswa) {
        await mahasiswa.destroy();
        res.json({ message: "Mahasiswa berhasil dihapus." });
      } else {
        res.status(404).json({ error: "Mahasiswa tidak ditemukan." });
      }
    } catch (error) {
      res.status(500).json({ error: "Gagal menghapus mahasiswa." });
    }
  }
);

// Fallback to serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Jalankan server
if (require.main === module) {
  // Jalankan server hanya jika file ini dieksekusi secara langsung
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app; // Ekspor app untuk digunakan dalam pengujian
