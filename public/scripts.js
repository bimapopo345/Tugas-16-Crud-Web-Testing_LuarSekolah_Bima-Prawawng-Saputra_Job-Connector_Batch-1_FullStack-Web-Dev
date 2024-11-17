// public/scripts.js

const API_URL = "/api/mahasiswa";
const LOGIN_URL = "/login.html";

// Token dan role disimpan di localStorage
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const mahasiswaId = localStorage.getItem("mahasiswaId");

// Redirect ke halaman login jika tidak ada token
if (!token) {
  window.location.href = LOGIN_URL;
}

// Menampilkan form tambah/edit hanya untuk dosen
if (role === "lecturer") {
  document.getElementById("form-section").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  loadMahasiswa();

  const form = document.getElementById("mahasiswa-form");
  form.addEventListener("submit", handleFormSubmit);

  const cancelEditBtn = document.getElementById("cancel-edit");
  cancelEditBtn.addEventListener("click", resetForm);

  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", handleLogout);
});

// Memuat daftar mahasiswa berdasarkan peran
async function loadMahasiswa() {
  try {
    let url = API_URL;
    if (role === "student") {
      url = `${API_URL}/${mahasiswaId}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Gagal memuat data mahasiswa.");
    }

    const data = await response.json();
    renderTable(Array.isArray(data) ? data : [data]);
  } catch (error) {
    alert(error.message);
  }
}

// Merender tabel mahasiswa
function renderTable(mahasiswas) {
  const tbody = document.getElementById("mahasiswa-table-body");
  tbody.innerHTML = "";

  mahasiswas.forEach((mhs, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
            <td class="py-2 px-4 border-b text-center">${index + 1}</td>
            <td class="py-2 px-4 border-b">${mhs.nama}</td>
            <td class="py-2 px-4 border-b">${mhs.nim}</td>
            <td class="py-2 px-4 border-b">${mhs.jurusan}</td>
            <td class="py-2 px-4 border-b text-center">
                ${
                  role === "lecturer" ||
                  (role === "student" && mhs.id === parseInt(mahasiswaId))
                    ? `
                    <button class="bg-green-500 text-white px-2 py-1 rounded mr-2" onclick="editMahasiswa(${
                      mhs.id
                    })">Edit</button>
                    ${
                      role === "lecturer"
                        ? `<button class="bg-red-500 text-white px-2 py-1 rounded" onclick="deleteMahasiswa(${mhs.id})">Hapus</button>`
                        : ""
                    }
                `
                    : ""
                }
            </td>
        `;

    tbody.appendChild(tr);
  });
}

// Menangani submit form (tambah atau edit)
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("mahasiswa-id").value;
  const nama = document.getElementById("nama").value;
  const nim = document.getElementById("nim").value;
  const jurusan = document.getElementById("jurusan").value;

  const mahasiswaData = { nama, nim, jurusan };

  try {
    let response;
    if (id) {
      // Edit Mahasiswa
      response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mahasiswaData),
      });
      if (!response.ok) throw new Error("Gagal mengupdate mahasiswa.");
    } else {
      // Tambah Mahasiswa
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mahasiswaData),
      });
      if (!response.ok) throw new Error("Gagal menambahkan mahasiswa.");
    }

    resetForm();
    loadMahasiswa();
  } catch (error) {
    alert(error.message);
  }
}

// Mengedit mahasiswa
async function editMahasiswa(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mhs = await response.json();

    // Jika mahasiswa, pastikan hanya dapat mengedit diri sendiri
    if (role === "student" && mhs.id !== parseInt(mahasiswaId)) {
      alert("Akses ditolak.");
      return;
    }

    document.getElementById("mahasiswa-id").value = mhs.id;
    document.getElementById("nama").value = mhs.nama;
    document.getElementById("nim").value = mhs.nim;
    document.getElementById("jurusan").value = mhs.jurusan;

    document.getElementById("form-title").innerText = "Edit Mahasiswa";
    document.getElementById("cancel-edit").classList.remove("hidden");
  } catch (error) {
    alert("Gagal mengambil data mahasiswa.");
  }
}

// Menghapus mahasiswa (Hanya untuk dosen)
async function deleteMahasiswa(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus mahasiswa ini?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Gagal menghapus mahasiswa.");

    loadMahasiswa();
  } catch (error) {
    alert(error.message);
  }
}

// Reset form ke mode tambah
function resetForm() {
  document.getElementById("mahasiswa-id").value = "";
  document.getElementById("mahasiswa-form").reset();
  document.getElementById("form-title").innerText = "Tambah Mahasiswa";
  document.getElementById("cancel-edit").classList.add("hidden");
}

// Logout
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("mahasiswaId");
  window.location.href = "/login.html";
}
