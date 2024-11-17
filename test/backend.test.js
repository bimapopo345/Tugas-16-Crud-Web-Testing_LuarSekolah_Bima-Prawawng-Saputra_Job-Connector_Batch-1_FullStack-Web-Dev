// test/backend.test.js

const request = require("supertest");
const { expect } = require("chai");
const app = require("../server"); // Pastikan server.js mengekspor app

describe("Pengujian Backend", function () {
  let tokenDosen;
  let tokenMahasiswa;
  let mahasiswaId;

  // Login sebagai dosen sebelum pengujian
  before(function (done) {
    request(app)
      .post("/api/login")
      .send({ username: "dosen1", password: "password123" })
      .end(function (err, res) {
        if (err) return done(err);
        tokenDosen = res.body.token;
        done();
      });
  });

  // Login sebagai mahasiswa sebelum pengujian
  before(function (done) {
    request(app)
      .post("/api/login")
      .send({ username: "mahasiswa1", password: "password123" })
      .end(function (err, res) {
        if (err) return done(err);
        tokenMahasiswa = res.body.token;
        done();
      });
  });

  it("Dosen dapat mengambil daftar mahasiswa", function (done) {
    request(app)
      .get("/api/mahasiswa")
      .set("Authorization", `Bearer ${tokenDosen}`)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an("array");
        done();
      });
  });

  it("Mahasiswa tidak dapat mengambil daftar mahasiswa", function (done) {
    request(app)
      .get("/api/mahasiswa")
      .set("Authorization", `Bearer ${tokenMahasiswa}`)
      .end(function (err, res) {
        expect(res.status).to.equal(403);
        done();
      });
  });

  it("Dosen dapat menambahkan mahasiswa baru", function (done) {
    request(app)
      .post("/api/mahasiswa")
      .set("Authorization", `Bearer ${tokenDosen}`)
      .send({ nama: "Mahasiswa C", nim: "345678", jurusan: "Teknik Elektro" })
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property("id");
        mahasiswaId = res.body.id; // Simpan ID untuk pengujian selanjutnya
        done();
      });
  });

  it("Mahasiswa tidak dapat menambahkan mahasiswa baru", function (done) {
    request(app)
      .post("/api/mahasiswa")
      .set("Authorization", `Bearer ${tokenMahasiswa}`)
      .send({ nama: "Mahasiswa D", nim: "901234", jurusan: "Teknik Mesin" })
      .end(function (err, res) {
        expect(res.status).to.equal(403);
        done();
      });
  });

  it("Dosen dapat menghapus mahasiswa", function (done) {
    request(app)
      .delete(`/api/mahasiswa/${mahasiswaId}`)
      .set("Authorization", `Bearer ${tokenDosen}`)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property("message");
        done();
      });
  });

  it("Mahasiswa tidak dapat menghapus mahasiswa", function (done) {
    request(app)
      .delete(`/api/mahasiswa/${mahasiswaId}`)
      .set("Authorization", `Bearer ${tokenMahasiswa}`)
      .end(function (err, res) {
        expect(res.status).to.equal(403);
        done();
      });
  });
});
