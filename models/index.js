// models/index.js

const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "database.sqlite"),
  logging: false, // Nonaktifkan logging untuk tampilan bersih
});

// Import model
const Mahasiswa = require("./mahasiswa")(sequelize, DataTypes);
const User = require("./user")(sequelize, DataTypes);

// Definisikan relasi antar model
User.belongsTo(Mahasiswa, { foreignKey: "mahasiswaId" });

// Function untuk pre-populate users
async function prepopulateUsers() {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      // Tambah Dosen
      const dosen = await User.create({
        username: "dosen1",
        password: "password123", // Password akan di-hash otomatis
        role: "lecturer",
        mahasiswaId: null,
      });

      // Tambah Mahasiswa
      const mhs1 = await Mahasiswa.create({
        nama: "Mahasiswa A",
        nim: "123456",
        jurusan: "Teknik Informatika",
      });

      const mhs2 = await Mahasiswa.create({
        nama: "Mahasiswa B",
        nim: "789012",
        jurusan: "Sistem Informasi",
      });

      // Tambah Akun Mahasiswa
      await User.create({
        username: "mahasiswa1",
        password: "password123", // Password akan di-hash otomatis
        role: "student",
        mahasiswaId: mhs1.id,
      });

      await User.create({
        username: "mahasiswa2",
        password: "password123", // Password akan di-hash otomatis
        role: "student",
        mahasiswaId: mhs2.id,
      });

      console.log("Pre-populated users berhasil dibuat.");
    } else {
      console.log("Users sudah ada. Tidak perlu pre-populate.");
    }
  } catch (error) {
    console.error("Error pre-populating users:", error);
  }
}

// Sinkronisasi semua model dengan database
sequelize
  .sync()
  .then(() => {
    console.log("Database & tables created!");
    prepopulateUsers(); // Panggil fungsi pre-populate
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

module.exports = {
  sequelize,
  Mahasiswa,
  User,
};
