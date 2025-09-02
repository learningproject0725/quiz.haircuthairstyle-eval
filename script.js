// =============================
// Firebase Setup
// =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quizhairstyle-default-rtdb.firebaseio.com/", // HARUS sesuai dengan database kamu
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.appspot.com",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =============================
// Variabel Global
// =============================
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let currentUser = null;
let timer;
let timeLeft = 30;

// =============================
// Fungsi Admin & Editor Soal
// =============================
const adminBtn = document.getElementById("admin-btn");
const adminLoginModal = document.getElementById("admin-login");
const adminEditorModal = document.getElementById("admin-editor");
const loginBtn = document.getElementById("login-btn");
const closeLogin = document.getElementById("close-login");
const closeEditor = document.getElementById("close-editor");
const saveQuestionBtn = document.getElementById("save-question-btn");
const addQuestionBtn = document.getElementById("add-question-btn");
const questionList = document.getElementById("question-list");

// Buka modal login admin
adminBtn.addEventListener("click", () => {
  adminLoginModal.style.display = "flex";
});

// Tutup modal login
closeLogin.addEventListener("click", () => {
  adminLoginModal.style.display = "none";
});

// Tutup modal editor
closeEditor.addEventListener("click", () => {
  adminEditorModal.style.display = "none";
});

// Login admin
loginBtn.addEventListener("click", () => {
  const user = document.getElementById("admin-username").value;
  const pass = document.getElementById("admin-password").value;

  if (user === "admin" && pass === "1234") {
    adminLoginModal.style.display = "none";
    adminEditorModal.style.display = "flex";
    loadQuestions();
  } else {
    alert("Username atau Password salah!");
  }
});

// Tambah soal kosong
addQuestionBtn.addEventListener("click", () => {
  const newRef = push(ref(db, "questions"));
  const newQuestion = {
    text: "Pertanyaan baru",
    options: ["A", "B", "C", "D"],
    answer: 0
  };
  set(newRef, newQuestion);
  loadQuestions();
});

// Simpan soal baru
saveQuestionBtn.addEventListener("click", () => {
  const qText = document.getElementById("question-text").value;
  const opts = [
    document.getElementById("option-a").value,
    document.getElementById("option-b").value,
    document.getElementById("option-c").value,
    document.getElementById("option-d").value
  ];
  const ans = parseInt(document.getElementById("correct-answer").value);

  if (!qText || opts.some(o => !o)) {
    alert("Isi semua data soal!");
    return;
  }

  const newRef = push(ref(db, "questions"));
  set(newRef, {
    text: qText,
    options: opts,
    answer: ans
  }).then(() => {
    alert("Soal berhasil ditambahkan!");
    loadQuestions();
  });
});

// Load semua soal
function loadQuestions() {
  get(ref(db, "questions")).then(snapshot => {
    questionList.innerHTML = "";
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach(key => {
        const q = data[key];
        const li = document.createElement("li");
        li.textContent = q.text;
        questionList.appendChild(li);
      });
    }
  });
}

// =============================
// Fungsi Kuis
// =============================
const quizForm = document.getElementById("quiz-form");
const quizContainer = document.getElementById("quiz-container");
const questionContainer = document.getElementById("question-container");
const timerDisplay = document.getElementById("timer");
const leaderboardList = document.getElementById("leaderboard-list");

// Submit form data peserta
quizForm.addEventListener("submit", e => {
  e.preventDefault();
  const nama = document.getElementById("nama").value.trim();
  const absen = document.getElementById("absen").value.trim();
  const kelas = document.getElementById("kelas").value.trim();

  if (!nama || !absen || !kelas) {
    alert("Isi semua data peserta!");
    return;
  }

  currentUser = { nama, absen, kelas };
  quizForm.style.display = "none";
  quizContainer.style.display = "block";
  startQuiz();
});

// Mulai kuis
function startQuiz() {
  get(ref(db, "questions")).then(snapshot => {
    if (snapshot.exists()) {
      questions = Object.values(snapshot.val());
      currentQuestionIndex = 0;
      score = 0;
      showQuestion();
    } else {
      alert("Belum ada soal di database!");
    }
  });
}

// Tampilkan soal
function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    endQuiz();
    return;
  }

  const q = questions[currentQuestionIndex];
  questionContainer.innerHTML = `
    <h3>${q.text}</h3>
    ${q.options
      .map(
        (opt, i) =>
          `<button class="option-btn" data-index="${i}">${opt}</button>`
      )
      .join("")}
  `;

  // Tambah listener untuk opsi jawaban
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const selected = parseInt(btn.getAttribute("data-index"));
      if (selected === q.answer) score++;
      currentQuestionIndex++;
      showQuestion();
    });
  });

  // Timer reset
  resetTimer();
}

// Timer soal
function resetTimer() {
  clearInterval(timer);
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      currentQuestionIndex++;
      showQuestion();
    }
  }, 1000);
}

// Selesai kuis
function endQuiz() {
  clearInterval(timer);
  questionContainer.innerHTML = `
    <h2>Kuis selesai!</h2>
    <p>Skor Anda: ${score} / ${questions.length}</p>
  `;
  saveToLeaderboard();
}

// Simpan skor ke leaderboard
function saveToLeaderboard() {
  if (!currentUser) return;

  const userKey = `${currentUser.nama}_${currentUser.absen}`;
  const kelasRef = ref(db, `leaderboard/${currentUser.kelas}/${userKey}`);

  set(kelasRef, {
    nama: currentUser.nama,
    absen: currentUser.absen,
    score: score,
    timestamp: Date.now()
  }).then(() => {
    loadLeaderboard(currentUser.kelas);
  });
}

// Load leaderboard per kelas
function loadLeaderboard(kelas) {
  get(ref(db, `leaderboard/${kelas}`)).then(snapshot => {
    leaderboardList.innerHTML = "";
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sorted = Object.values(data).sort((a, b) => b.score - a.score);
      sorted.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.nama} (Absen ${item.absen}) - Skor: ${item.score}`;
        leaderboardList.appendChild(li);
      });
    }
  });
}
