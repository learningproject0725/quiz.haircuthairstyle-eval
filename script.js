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
    question: "Secara etimologi, kata 'pemangkasan' berasal dari kata 'pangkas' yang artinya ...",
    choices: ["Sisir", "Potong", "Cuci", "Tata"],
    answer: 1
  },
  {
    question: "Tujuan pemangkasan rambut berikut ini yang TIDAK tepat adalah ....",
    choices: ["Memperindah bentuk kepala", "Mempermudah pengaturan rambut", "Membuat rambut tumbuh lebih cepat", "Memberi kesan wajah oval"],
    answer: 2
  },
  {
    question: "Alat yang digunakan khusus untuk membagi rambut (parting) adalah ....",
    choices: ["Gunting bilah lurus", "Sisir berekor (tail comb)", "Clipper", "Razor"],
    answer: 1
  },
  {
    question: "Sudut elevasi 0° digunakan pada teknik pemangkasan ....",
    choices: ["Layer", "Graduasi", "Solid (Blunt Cut)", "Undercut"],
    answer: 2
  },
  {
    question: "Titik referensi (reference point) pada kepala yang merupakan titik tertinggi adalah ....",
    choices: ["Crown", "Apex", "Nape", "Fringe"],
    answer: 1
  },
  {
    question: "Kontra indikasi yang mengharuskan penata rambut menolak atau menunda layanan pemangkasan adalah ....",
    choices: ["Rambut kusut", "Rambut berketombe", "Adanya luka terbuka di kulit kepala", "Rambut sangat kering"],
    answer: 2
  },
  {
    question: "Bentuk wajah yang dianggap ideal dan cocok untuk hampir semua model pangkasan adalah ....",
    choices: ["Bulat (Round)", "Persegi (Square)", "Oval", "Segitiga (Heart)"],
    answer: 2
  },
  {
    question: "Teknik pengecekan hasil pangkasan dengan memeriksa dari arah yang berlawanan untuk memastikan keseragaman disebut ....",
    choices: ["Sectioning", "Cross Check", "Design Line", "Texturizing"],
    answer: 1
  },
  {
    question: "Neck duster adalah alat yang berfungsi untuk ....",
    choices: ["Memotong rambut", "Menyisir rambut", "Membersihkan sisa potongan rambut di leher", "Menyimpan alat"],
    answer: 2
  },
  {
    question: "Langkah pertama yang harus dilakukan sebelum memulai pemangkasan rambut adalah ....",
    choices: ["Memangkas rambut", "Mencuci rambut", "Melakukan konsultasi dan analisis", "Menyeterilkan alat"],
    answer: 2
  },
  {
    question: "Seorang pelanggan memiliki bentuk wajah bulat. Rekomendasi model pangkasan yang PALING tepat untuknya adalah ....",
    choices: ["Blunt cut lurus dan berat di bagian bawah", "Poni tumpul tebal dan lurus", "Layer panjang yang menambah volume vertikal", "Pangkasan sangat pendek dan rata di samping"],
    answer: 2
  },
  {
    question: "Jika seorang pelanggan memiliki rambut dengan tekstur kasar dan densitas tebal, teknik pemangkasan yang perlu dihindari adalah ....",
    choices: ["Layer untuk mengurangi volume", "Blunt cut yang menambah kesan berat", "Graduasi untuk menambah dimensi", "Texturizing dengan razor"],
    answer: 1
  },
  {
    question: "Perawatan gunting yang benar setelah digunakan adalah ....",
    choices: ["Disimpan begitu saja dalam laci", "Dibersihkan dengan kain dan diberi minyak pelumas khusus", "Dicuci dengan sabun dan air, lalu dikeringkan dengan lap", "Direndam dalam desinfektan semalaman"],
    answer: 1
  },
  {
    question: "Teknik penataan rambut 'Finger Wave' termasuk dalam kategori penataan ....",
    choices: ["Dengan alat pemanas (thermal styling)", "Kimiawi (chemical styling)", "Tanpa alat (non-thermal styling)", "Semi permanen"],
    answer: 2
  },
  {
    question: "Pola pemangkasan mana yang menghasilkan rambut lebih panjang di depan dan lebih pendek di belakang, disebut dengan ....",
    choices: ["Pola Datar", "Pola Naik", "Pola Turun", "Pola Lingkar"],
    answer: 2
  },
  {
    question: "Komponen desain yang menunjukkan kepanjangan rambut yang diukur dari kulit kepala sampai ujung rambut adalah ....",
    choices: ["Bentuk (Shape)", "Tekstur", "Struktur", "Arah"],
    answer: 2
  },
  {
    question: "Tujuan utama dari memberikan saran pasca pelayanan kepada pelanggan adalah ....",
    choices: ["Agar pelanggan membeli produk lebih banyak", "Untuk menjaga hasil pangkasan dan kesehatan rambut", "Supaya pelanggan cepat kembali ke salon", "Sebagai formalitas akhir layanan"],
    answer: 1
  },
  {
    question: "Dalam dokumentasi portofolio, foto 'before-after' sangat efektif karena dapat menampilkan ....",
    choices: ["Harga layanan", "Transformasi dan keahlian penata rambut", "Lokasi salon", "Produk yang digunakan"],
    answer: 1
  },
  {
    question: "Platform media sosial yang paling cocok untuk menampilkan portofolio visual hasil karya tata rambut adalah ....",
    choices: ["LinkedIn", "Facebook", "Instagram", "Twitter"],
    answer: 2
  },
  {
    question: "Strategi personal branding yang kurang baik untuk seorang penata rambut pemula adalah ....",
    choices: ["Konsisten mengunggah karya terbaik", "Berinteraksi dengan pengikut di kolom komentar", "Mengunggah konten yang tidak jelas dan tidak terkait dengan keahliannya", "Menggunakan hashtag yang relevan"],
    answer: 2
  },
  {
    question: "Seorang pelanggan dengan wajah persegi dan rambut bertekstur halus serta densitas tipis datang ke salon. Analisis yang PALING tepat dan rekomendasi pangkasan untuknya adalah ....",
    choices: [
      "Wajah persegi perlu dilembutkan, rambut halus dan tipis mudah lemas. Rekomendasi: Graduasi atau layer ringan untuk menambah volume dan melembutkan garis rahang.",
      "Wajah persegi cocok dengan garis tegas. Rekomendasi: Blunt cut bob untuk menonjolkan gaya.",
      "Rambut tipis harus dihindari pemotongan. Rekomendasi: Tidak dipotong.",
      "Semua model pasti cocok. Rekomendasi: Mengikuti tren terbaru."
    ],
    answer: 0
  },
  {
    question: "Manfaat postur tubuh dan posisi kerja yang ergonomis sangat penting bagi seorang penata rambut, adalah ....",
    choices: ["Agar terlihat profesional di depan pelanggan", "Untuk mencegah risiko cedera otot dan sendi jangka panjang", "Agar dapat memotong rambut dengan lebih cepat", "Suatu aturan baku dari salon"],
    answer: 1
  },
  {
    question: "Seorang penata rambut akan memangkas menggunakan teknik Uniform Layer (elevasi 90°). Namun, hasilnya tidak membulat sempurna dan terlihat tidak rata. Kesalahan apa yang paling mungkin terjadi, yaitu ....",
    choices: ["Sudut elevasi tidak konsisten di setiap seksi", "Guide line pertama tidak ditentukan dengan benar", "Tidak melakukan cross check", "Semua jawaban di atas benar"],
    answer: 3
  },
  {
    question: "Strategi yang PALING efektif dalam membangun personal branding di Instagram, adalah ....",
    choices: ["Membeli banyak followers agar terlihat populer", "Hanya mengunggah foto hasil akhir tanpa keterangan", "Konsisten mengunggah konten berkualitas, berinteraksi dengan followers, dan menggunakan hashtag yang relevan", "Mengunggah semua hasil karya tanpa proses seleksi"],
    answer: 2
  },
  {
    question: "Sebuah video time-lapse singkat yang menunjukkan proses pangkasan dari 'before' ke 'after' sangat efektif untuk diunggah di TikTok. Jenis konten video ini dikenal sebagai ....",
    choices: ["A-Roll", "B-Roll", "Tutorial", "Vlog"],
    answer: 1
  },
  {
    question: "Jika seorang pelanggan menginginkan pangkasan pendek tapi takut terlihat terlalu maskulin, maka yang dilakukan seorang penata rambut adalah ....",
    choices: [
      "Menolak keinginannya karena tidak mungkin",
      "Merekomendasikan pangkasan yang lebih feminin seperti pixie cut dengan layer dan tekstur, serta menjelaskan kemungkinan hasilnya.",
      "Langsung memotong sesuai keinginan tanpa konsultasi",
      "Menyarankan untuk tidak memotong pendek sama sekali"
    ],
    answer: 1
  },
  {
    question: "Perhatikan pernyataan berikut: 'Rambut dipotong dengan elevasi 180°, dimana rambut bagian eksterior lebih panjang daripada interior'. Teknik pemangkasan yang dimaksud adalah ....",
    choices: ["Solid Form", "Graduated Cut", "Uniform Layer", "Increase Layer"],
    answer: 3
  },
  {
    question: "Seorang penata rambut ingin menciptakan tampilan rambut yang sangat ringan, bertekstur, dan memiliki lapisan dengan pergerakan dinamis. Teknik pemangkasan yang sesuai dengan keinginan penata rambut tersebut, adalah ....",
    choices: ["Solid form dengan menggunakan gunting biasa", "Graduasi diagonal belakang dengan menggunakan gunting biasa", "Layer dengan menggunakan gunting dan razor", "Graduasi diagonal depan dengan menggunakan razor"],
    answer: 2
  },
  {
    question: "Sebuah salon ingin meningkatkan penjualan layanan pewarnaan. Strategi portofolio digital seperti apa yang PALING efektif untuk mendukung tujuan tersebut, yaitu ....",
    choices: ["Hanya memposting foto pangkasan hitam putih", "Memfokuskan konten pada video transformasi warna rambut yang dramatis dan menarik", "Hanya menampilkan harga promo dan potongan harga menarik", "Mengunggah foto suasana dalam salon disertai dengan peralatan canggih"],
    answer: 1
  },
  {
    question: "Seorang penata rambut harus menolak melakukan pemangkasan karena menemukan kurap di kulit kepala pelanggan. Tindakan ini dilakukan berdasarkan pertimbangan ....",
    choices: ["Estetika", "Kesehatan dan Keselamatan Kerja (K3)", "Tren", "Kebiasaan salon"],
    answer: 1
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

