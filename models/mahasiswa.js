// models/mahasiswa.js

module.exports = (sequelize, DataTypes) => {
  const Mahasiswa = sequelize.define(
    "Mahasiswa",
    {
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nim: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      jurusan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    }
  );

  return Mahasiswa;
};
