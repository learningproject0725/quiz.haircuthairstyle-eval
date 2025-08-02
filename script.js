// script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDNUme5dcYQi6pKR3gpdRUp1wHxQSiP2q4",
  authDomain: "quiz-evaluasi-hairstyle.firebaseapp.com",
  databaseURL: "https://quiz-evaluasi-hairstyle-default-rtdb.firebaseio.com",
  projectId: "quiz-evaluasi-hairstyle",
  storageBucket: "quiz-evaluasi-hairstyle.appspot.com",
  messagingSenderId: "892621648220",
  appId: "1:892621648220:web:fa83dcec7dc25f4d595199",
  measurementId: "G-WT3C7QDT5N"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);


const questions = [
  {
    question: "Definisi dari pemangkasan rambut menurut Milady, adalah …. ",
    choices: [
      "A. Proses pewarnaan rambut",
      "B. Proses mengatur tatanan rambut",
      "C. Proses memangkas, membentuk dan menipiskan rambut",
      "D. Proses menyisir dan mengeringkan rambut"
    ],
    answer: 2
  },
  {
    question: "Tokoh yang mendefinisikan pemangkasan rambut sebagai seni yang harmonis dengan struktur wajah, yaitu ….",
    choices: [
      "A. Peter F. Saerang",
      "B. Vidal Sassoon",
      "C. Leo Passage",
      "D. Milady"
    ],
    answer: 1
  },
  {
    question: "Tujuan pemangkasan rambut tidak meliputi ….",
    choices: [
      "A. Memberi kesan wajah oval",
      "B. Mengikuti tren",
      "C. Menambah panjang rambut",
      "D. Mempermudah pengaturan"
    ],
    answer: 2
  },
  {
    question: "Titik tertinggi di kepala yang digunakan sebagai referensi pemangkasan, adalah ….",
    choices: [
      "A. Crown",
      "B. Apex",
      "C. Fringe",
      "D. Nape"
    ],
    answer: 1
  },
  {
    question: "Alat yang digunakan untuk membagi rambut (parting), ialah ….",
    choices: [
      "A. Gunting bilah lurus",
      "B. Razor",
      "C. Sisir berekor",
      "D. Sikat leher"
    ],
    answer: 2
  },
  {
    question: "Sudut pengangkatan (elevasi) 0° pada pemangkasan rambut akan menghasilkan model pangkasan ….",
    choices: [
      "A. Layer",
      "B. Graduasi",
      "C. Solid",
      "D. Bertumpuk"
    ],
    answer: 2
  },
  {
    question: "Panduan pemangkasan yang bersifat tetap, disebut dengan ….",
    choices: [
      "A. Mobile guideline",
      "B. Static guideline",
      "C. Flexible line",
      "D. Design section"
    ],
    answer: 1
  },
  {
    question: "Postur tubuh yang baik saat memangkas rambut akan bermanfaat untuk ….",
    choices: [
      "A. Memperlambat kerja",
      "B. Memicu nyeri punggung",
      "C. Meningkatkan hasil pangkasan",
      "D. Mempengaruhi desain pangkasan"
    ],
    answer: 2
  },
  {
    question: "Berikut yang termasuk kontra indikasi dari pemangkasan rambut, adalah ….",
    choices: [
      "A. Rambut berminyak",
      "B. Luka di kulit kepala",
      "C. Rambut kering",
      "D. Ketombe"
    ],
    answer: 1
  },
  {
    question: "Teknik finger wave termasuk dalam kategori penataan ….",
    choices: [
      "A. Dengan alat pemanas",
      "B. Tanpa alat",
      "C. Menggunakan chemical",
      "D. Semi permanen"
    ],
    answer: 1
  },
  {
    question: "Jika pelanggan memiliki wajah bulat, rekomendasi pangkasan yang tepat, adalah ….",
    choices: [
      "A. Blunt cut pendek",
      "B. Layer panjang",
      "C. Poni tumpul tebal",
      "D. Graduasi pendek di samping"
    ],
    answer: 1
  },
  {
    question: "Prosedur yang benar setelah menggunakan gunting, yaitu ….",
    choices: [
      "A. Disimpan langsung dalam laci",
      "B. Dibersihkan dengan alkohol 70%",
      "C. Dicuci dengan sabun biasa",
      "D. Direndam dengan air panas"
    ],
    answer: 1
  },
  {
    question: "Seorang penata rambut memilih elevasi 90° saat memangkas rambut. Model pangkasan yang akan dihasilkan, adalah ….",
    choices: [
      "A. Graduasi",
      "B. Bob rata",
      "C. Layer",
      "D. Undercut"
    ],
    answer: 2
  },
  {
    question: "Resiko dari cara memegang gunting yang tidak benar, adalah ….",
    choices: [
      "A. Pangkasan terlalu pendek",
      "B. Nyeri sendi dan kerusakan tendon",
      "C. Rambut jadi kaku",
      "D. Warna rambut berubah"
    ],
    answer: 1
  },
  {
    question: "Pelanggan dengan rambut keriting ingin pangkasan bob pendek. Faktor utama yang harus dipertimbangkan, adalah ….",
    choices: [
      "A. Penyusutan rambut saat kering",
      "B. Warna kulit pelanggan",
      "C. Harga produk digunakan",
      "D. Tren terbaru"
    ],
    answer: 0
  },
  {
    question: "Jika menemukan pelanggan dengan rambut penuh dengan ketombe sebelum pemangkasan, tindakan yang tepat, yakni ….",
    choices: [
      "A. Memangkas seperti biasa",
      "B. Menolak layanan dan merujuk ke dokter",
      "C. Menggunakan shampoo anti ketombe",
      "D. Memangkas pada bagian yang tidak berketombe"
    ],
    answer: 1
  },
  {
    question: "Kreasi penataan yang tepat untuk pemangkasan pixie cut, adalah ….",
    choices: [
      "A. Braid cut",
      "B. Slick back dengan gel",
      "C. Beach wave",
      "D. Crimping"
    ],
    answer: 1
  },
  {
    question: "Kelemahan portofolio yang hanya menampilkan foto hasil akhir tanpa penjelasan teknik, adalah ….",
    choices: [
      "A. Kurang menunjukkan proses berpikir kreatif",
      "B. Warna foto terlalu cerah",
      "C. Tidak mencantumkan harga jasa",
      "D. Ukuran file terlalu besar"
    ],
    answer: 0
  },
  {
    question: "Untuk pelanggan dengan ketebalan rambut tipis dan wajah persegi, rancangan pemangkasan yang paling tepat, adalah ….",
    choices: [
      "A. Blunt cut dengan layer di dagu",
      "B. Graduated dengan volume di mahkota",
      "C. Undercut dengan fade di samping",
      "D. Asymetrical bob pendek"
    ],
    answer: 1
  },
  {
    question: "Strategi pemasaran digital yang efektif dalam menampilkan portofolio pemangkasan kreatif, yaitu ….",
    choices: [
      "A. Instagram reels dengan hashtag #viral",
      "B. Brosur cetak",
      "C. Iklan koran",
      "D. Spanduk jalanan"
    ],
    answer: 0
  }
];


// Variabel kuis
let currentQuestion = 0;
let selectedAnswers = Array(questions.length).fill(null);
let timeLeft = 20 * 60;
let timer;
let userName = "", userAbsen = "", userKelas = "";

// DOM
const startScreen = document.getElementById("start-screen");
const formScreen = document.getElementById("user-form");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const leaderboardList = document.getElementById("leaderboard-list");
const classDisplay = document.getElementById("class-display");

// Tombol Mulai Kuis
document.getElementById("open-form-btn").onclick = () => {
  startScreen.style.display = "none";
  formScreen.style.display = "block";
};

// Tombol Mulai Sekarang
document.getElementById("start-btn").onclick = () => {
  const name = document.getElementById("user-name").value.trim();
  const absen = document.getElementById("user-absen").value.trim();
  const kelas = document.getElementById("user-kelas").value.trim();
  if (!name || !absen || !kelas) {
    alert("Isi semua data!");
    return;
  }
  userName = name;
  userAbsen = absen;
  userKelas = kelas;
  formScreen.style.display = "none";
  quizScreen.style.display = "block";
  showQuestion();
  updateNav();
  timer = setInterval(updateTimer, 1000);
};

// Timer
function updateTimer() {
  if (timeLeft <= 0) {
    clearInterval(timer);
    showResult();
    return;
  }
  let m = Math.floor(timeLeft / 60);
  let s = timeLeft % 60;
  document.getElementById("timer").textContent = `Waktu: ${m}:${s < 10 ? "0" : ""}${s}`;
  timeLeft--;
}

// Tampilkan soal
function showQuestion() {
  const q = questions[currentQuestion];
  document.getElementById("question-text").textContent = `${currentQuestion + 1}. ${q.question}`;
  const choices = document.getElementById("choices");
  choices.innerHTML = "";
  q.choices.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.textContent = c;
    if (selectedAnswers[currentQuestion] === i) btn.classList.add("selected");
    btn.onclick = () => {
      selectedAnswers[currentQuestion] = i;
      showQuestion();
      updateNav();
    };
    choices.appendChild(btn);
  });
}

// Navigasi soal
function updateNav() {
  const nav = document.getElementById("question-nav");
  nav.innerHTML = "";
  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.className = "question-btn";
    if (i === currentQuestion) btn.classList.add("active");
    if (selectedAnswers[i] !== null) btn.classList.add("answered");
    btn.onclick = () => {
      currentQuestion = i;
      showQuestion();
      updateNav();
    };
    nav.appendChild(btn);
  });
}

// Tombol selanjutnya
document.getElementById("next-btn").onclick = () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
    updateNav();
  } else {
    const unanswered = selectedAnswers.map((a, i) => a === null ? i + 1 : null).filter(Boolean);
    if (unanswered.length > 0) {
      alert("Belum dijawab: " + unanswered.join(", "));
      return;
    }
    clearInterval(timer);
    showResult();
  }
};

// Tombol sebelumnya
document.getElementById("prev-btn").onclick = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
    updateNav();
  }
};

// Tampilkan hasil
function showResult() {
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  const correct = selectedAnswers.filter((a, i) => a === questions[i].answer).length;
  const wrong = questions.length - correct;
  const score = Math.round((correct / questions.length) * 100);

  document.getElementById("correct-count").textContent = correct;
  document.getElementById("wrong-count").textContent = wrong;
  const scoreText = document.getElementById("score-text");
  scoreText.textContent = `Nilai: ${score}%`;
  scoreText.className = score >= 70 ? "green" : score >= 60 ? "yellow" : "red";

  classDisplay.textContent = userKelas;

  const path = `leaderboard/${userKelas}/${userName}`;
  const entry = {
    name: userName,
    absen: userAbsen,
    kelas: userKelas,
    score: score,
    timestamp: Date.now()
  };
  set(ref(db, path), entry).then(() => loadLeaderboard(userKelas));
}

// ✅ Fungsi yang diperbaiki untuk memuat leaderboard
function loadLeaderboard(kelas) {
  const leaderboardRef = ref(db, `leaderboard/${kelas}`);
  get(leaderboardRef).then(snapshot => {
    if (!snapshot.exists()) {
      leaderboardList.innerHTML = "<li>Belum ada data untuk kelas ini.</li>";
      return;
    }

    const latestEntries = {};

    snapshot.forEach(child => {
      const data = child.val();
      const name = data.name;
      // Simpan hanya entri terbaru per nama
      if (!latestEntries[name] || data.timestamp > latestEntries[name].timestamp) {
        latestEntries[name] = data;
      }
    });

    // Ubah jadi array dan sort
    const sortedEntries = Object.values(latestEntries).sort((a, b) => b.score - a.score);

    leaderboardList.innerHTML = "";
    sortedEntries.forEach((entry, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${entry.name} (Absen: ${entry.absen}) - ${entry.score}%`;
      leaderboardList.appendChild(li);
    });
  }).catch(error => {
    console.error("Gagal memuat leaderboard:", error);
    leaderboardList.innerHTML = "<li>Gagal memuat leaderboard.</li>";
  });
}
