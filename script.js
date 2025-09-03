// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ✅ Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA0jJq5ITmMSIDzc3jH0PRyRG6lWh7Np_4",
  authDomain: "quizhairstyle.firebaseapp.com",
  databaseURL: "https://quiz-evaluasi-hairstyle-default-rtdb.firebaseio.com/",
  projectId: "quizhairstyle",
  storageBucket: "quizhairstyle.firebasestorage.app",
  messagingSenderId: "889778092393",
  appId: "1:889778092393:web:831b46773c2aa593d0e5f8",
  measurementId: "G-EG2K9M8PM1"
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// =====================
// Variabel Kuis
// =====================
let questions = [];
let currentQuestion = 0;
let selectedAnswers = [];
let timer;
let timeLeft = 20 * 60; // 20 menit
let userName = "", userAbsen = "", userKelas = "";

// =====================
// DOM Elements
// =====================
const startScreen = document.getElementById("start-screen");
const formScreen = document.getElementById("user-form");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const leaderboardList = document.getElementById("leaderboard-list");
const classDisplay = document.getElementById("class-display");

// =====================
// Admin Login
// =====================
const adminBtn = document.getElementById("admin-btn");
const adminLogin = document.getElementById("admin-login");
const adminEditor = document.getElementById("admin-editor");

adminBtn.onclick = () => {
  adminLogin.style.display = "flex";
};

document.getElementById("login-btn").onclick = () => {
  const user = document.getElementById("admin-username").value;
  const pass = document.getElementById("admin-password").value;

  if (user === "admin" && pass === "23121989") {
    adminLogin.style.display = "none";
    adminEditor.style.display = "flex";
    loadEditorQuestions();
  } else {
    alert("Username atau Password salah!");
  }
};

// =====================
// Admin Editor
// =====================
const editorContainer = document.getElementById("editor-container");

function loadEditorQuestions() {
  get(ref(db, "questions")).then(snapshot => {
    editorContainer.innerHTML = "";
    if (snapshot.exists()) {
      questions = snapshot.val();
      questions.forEach((q, i) => renderEditorQuestion(q, i));
    }
  });
}

function renderEditorQuestion(q, index) {
  const div = document.createElement("div");
  div.className = "editor-question";
  div.innerHTML = `
    <h4>Soal ${index + 1}</h4>
    <input type="text" value="${q.question}" data-field="question" data-index="${index}" placeholder="Teks Soal">
    ${q.choices.map((c, i) => `
      <input type="text" value="${c}" data-field="choice" data-choice="${i}" data-index="${index}" placeholder="Pilihan ${i+1}">
    `).join("")}
    <input type="number" value="${q.answer}" data-field="answer" data-index="${index}" min="0" max="3" placeholder="Jawaban benar (0-3)">
    <hr>
  `;
  editorContainer.appendChild(div);
}

// Tambah Soal Baru
document.getElementById("add-question-btn").onclick = () => {
  const newQ = {
    question: "Soal baru...",
    choices: ["Pilihan 1", "Pilihan 2", "Pilihan 3", "Pilihan 4"],
    answer: 0
  };
  questions.push(newQ);
  renderEditorQuestion(newQ, questions.length - 1);
};

// Simpan ke Firebase
document.getElementById("save-questions-btn").onclick = () => {
  const inputs = editorContainer.querySelectorAll("input");
  inputs.forEach(input => {
    const idx = input.dataset.index;
    if (input.dataset.field === "question") {
      questions[idx].question = input.value;
    } else if (input.dataset.field === "choice") {
      const choiceIdx = input.dataset.choice;
      questions[idx].choices[choiceIdx] = input.value;
    } else if (input.dataset.field === "answer") {
      questions[idx].answer = parseInt(input.value);
    }
  });

  set(ref(db, "questions"), questions).then(() => {
    alert("Soal berhasil disimpan!");
  });
};

// =====================
// User Flow
// =====================

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

  loadQuestions();
};

// =====================
// Load Soal
// =====================
function loadQuestions() {
  get(ref(db, "questions")).then(snapshot => {
    if (snapshot.exists()) {
      questions = snapshot.val();
      selectedAnswers = Array(questions.length).fill(null);
      showQuestion();
      updateNav();
      timer = setInterval(updateTimer, 1000);
    } else {
      alert("Belum ada soal di database!");
    }
  });
}

// =====================
// Timer
// =====================
function updateTimer() {
  if (timeLeft <= 0) {
    clearInterval(timer);
    showResult();
    return;
  }
  let m = Math.floor(timeLeft / 60);
  let s = timeLeft % 60;
  document.getElementById("timer").textContent =
    `Waktu: ${m}:${s < 10 ? "0" : ""}${s}`;
  timeLeft--;
}

// =====================
// Tampilkan Soal
// =====================
function showQuestion() {
  const q = questions[currentQuestion];
  document.getElementById("question-text").textContent =
    `${currentQuestion + 1}. ${q.question}`;
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

// =====================
// Navigasi Soal
// =====================
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

// Next
document.getElementById("next-btn").onclick = () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
    updateNav();
  } else {
    const unanswered = selectedAnswers
      .map((a, i) => (a === null ? i + 1 : null))
      .filter(Boolean);
    if (unanswered.length > 0) {
      alert("Belum dijawab: " + unanswered.join(", "));
      return;
    }
    clearInterval(timer);
    showResult();
  }
};

// Prev
document.getElementById("prev-btn").onclick = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
    updateNav();
  }
};

// =====================
// Hasil & Leaderboard
// =====================
function showResult() {
  quizScreen.style.display = "none";
  resultScreen.style.display = "block";

  const correct = selectedAnswers.filter(
    (a, i) => a === questions[i].answer
  ).length;
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
      if (!latestEntries[name] || data.timestamp > latestEntries[name].timestamp) {
        latestEntries[name] = data;
      }
    });
    const sortedEntries = Object.values(latestEntries).sort(
      (a, b) => b.score - a.score
    );
    leaderboardList.innerHTML = "";
    sortedEntries.forEach((entry, index) => {
      const li = document.createElement("li");
      li.textContent =
        `${index + 1}. ${entry.name} (Absen: ${entry.absen}) - ${entry.score}%`;
      leaderboardList.appendChild(li);
    });
  });
}
