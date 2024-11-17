// models/user.js

const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        // 'student' atau 'lecturer'
        type: DataTypes.ENUM("student", "lecturer"),
        allowNull: false,
      },
      mahasiswaId: {
        // Relasi ke Mahasiswa, null jika role adalah 'lecturer'
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Mahasiswas",
          key: "id",
        },
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        },
      },
    }
  );

  return User;
};
